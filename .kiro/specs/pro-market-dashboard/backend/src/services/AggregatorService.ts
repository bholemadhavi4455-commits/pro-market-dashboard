import { Listing, SearchResult, Review, PriceHistoryRecord } from '../models/types';
import { SourceAdapter } from '../adapters/SourceAdapter';
import { CacheManager } from './CacheManager';
import { PersistenceService } from './PersistenceService';
import { ScoringEngine } from './ScoringEngine';

/**
 * AggregatorService orchestrates data fetching from multiple sources,
 * deduplication, scoring, caching, and persistence.
 * 
 * Requirements:
 * - 2.1: Multi-source aggregation with parallel queries
 * - 2.3: Graceful degradation when sources fail
 * - 2.4: Deduplication by (productName, source)
 * - 2.5: Sort by CompositeScore descending
 * - 7.1: BestPick selection
 * - 10.1: Caching with 10-minute TTL
 */
export class AggregatorService {
  private sourceAdapters: SourceAdapter[];
  private cacheManager: CacheManager;
  private persistenceService: PersistenceService;
  private scoringEngine: ScoringEngine;

  constructor(
    sourceAdapters: SourceAdapter[],
    cacheManager: CacheManager,
    persistenceService: PersistenceService,
    scoringEngine: ScoringEngine
  ) {
    this.sourceAdapters = sourceAdapters;
    this.cacheManager = cacheManager;
    this.persistenceService = persistenceService;
    this.scoringEngine = scoringEngine;
  }

  /**
   * Search for products across all sources
   * 
   * Implementation flow:
   * 1. Generate cache key from query+category
   * 2. Check cache, return if hit
   * 3. Promise.allSettled with 5s timeout per source adapter
   * 4. Combine fulfilled results, log rejected
   * 5. Deduplicate by (productName, source)
   * 6. Compute composite scores
   * 7. Sort by score descending
   * 8. Select best pick
   * 9. Store price snapshots
   * 10. Cache result
   * 11. Return
   * 
   * @param query - Search query string
   * @param category - Optional category filter
   * @returns SearchResult with listings, bestPick, sourcesCount, cachedAt
   * 
   * Requirements: 2.1, 2.3, 2.4, 2.5, 7.1, 10.1
   */
  async search(query: string, category?: string): Promise<SearchResult> {
    // Step 1: Generate cache key
    const cacheKey = this.cacheManager.generateKey(query, category);

    // Step 2: Check cache
    const cachedResult = this.cacheManager.get(cacheKey);
    if (cachedResult) {
      console.log(`Cache HIT for query: ${query}`);
      return cachedResult;
    }

    console.log(`Cache MISS for query: ${query}, fetching from sources...`);

    // Step 3: Query all sources in parallel with timeout
    const sourcePromises = this.sourceAdapters.map((adapter) =>
      this.querySourceWithTimeout(adapter, query, category, 5000)
    );

    const results = await Promise.allSettled(sourcePromises);

    // Step 4: Combine fulfilled results, log rejected
    let allListings: Listing[] = [];
    let successfulSources = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allListings = allListings.concat(result.value);
        successfulSources++;
        console.log(
          `Source ${this.sourceAdapters[index].sourceName} returned ${result.value.length} listings`
        );
      } else {
        console.error(
          `Source ${this.sourceAdapters[index].sourceName} failed:`,
          result.reason
        );
      }
    });

    // Step 5: Deduplicate by (productName, source)
    const deduplicatedListings = this.deduplicate(allListings);
    console.log(
      `Deduplicated ${allListings.length} listings to ${deduplicatedListings.length}`
    );

    // Step 6: Compute composite scores
    deduplicatedListings.forEach((listing) => {
      listing.compositeScore = this.scoringEngine.calculateCompositeScore(
        listing,
        deduplicatedListings
      );
    });

    // Step 7: Sort by composite score descending
    const sortedListings = this.sortByCompositeScore(deduplicatedListings);

    // Step 8: Select best pick
    const bestPick = this.scoringEngine.selectBestPick(sortedListings);
    if (bestPick) {
      const reason = this.scoringEngine.determineBestPickReason(
        bestPick,
        sortedListings
      );
      console.log(
        `Best pick selected: ${bestPick.productName} from ${bestPick.source} - Reason: ${reason}`
      );
    }

    // Step 9: Store price snapshots (async, don't block response)
    this.storePriceSnapshots(sortedListings).catch((err) => {
      console.error('Error storing price snapshots:', err);
    });

    // Step 10: Cache result (10 minutes = 600 seconds)
    const searchResult: SearchResult = {
      listings: sortedListings,
      bestPick,
      sourcesCount: successfulSources,
      cachedAt: null,
    };

    this.cacheManager.set(cacheKey, searchResult, 600);

    // Step 11: Return
    return searchResult;
  }

  /**
   * Get price history for a listing
   * Delegates to PersistenceService
   * 
   * @param listingId - Listing identifier
   * @param rangeDays - Number of days to look back
   * @returns Array of price history records
   * 
   * Requirements: 5.1, 5.2
   */
  async getListingHistory(
    listingId: string,
    rangeDays: number
  ): Promise<PriceHistoryRecord[]> {
    return this.persistenceService.getPriceHistory(listingId, rangeDays);
  }

  /**
   * Get reviews for a listing
   * Parses listingId to extract source, delegates to appropriate SourceAdapter
   * 
   * @param listingId - Listing identifier (format: "{source}_{productId}")
   * @returns Review response with reviews array and metadata
   * 
   * Requirements: 6.2, 6.3
   */
  async getListingReviews(listingId: string): Promise<{
    listingId: string;
    reviews: Review[];
    totalReviews: number;
    averageRating: number;
    available: boolean;
    message?: string;
  }> {
    // Parse listingId to extract source and productId
    const parts = listingId.split('_');
    if (parts.length < 2) {
      throw new Error(`Invalid listing ID format: ${listingId}`);
    }

    const sourceName = parts[0];
    const productId = parts.slice(1).join('_');

    // Find the appropriate adapter
    const adapter = this.sourceAdapters.find(
      (a) => a.sourceName === sourceName
    );

    if (!adapter) {
      console.warn(`No adapter found for source: ${sourceName}`);
      return {
        listingId,
        reviews: [],
        totalReviews: 0,
        averageRating: 0,
        available: false,
        message: 'Reviews unavailable',
      };
    }

    try {
      const reviews = await adapter.getReviews(productId);

      if (reviews.length === 0) {
        return {
          listingId,
          reviews: [],
          totalReviews: 0,
          averageRating: 0,
          available: false,
          message: 'Reviews unavailable',
        };
      }

      // Calculate average rating and total reviews
      const totalReviews = reviews.length;
      const averageRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

      return {
        listingId,
        reviews,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        available: true,
      };
    } catch (error) {
      console.error(`Error fetching reviews for ${listingId}:`, error);
      return {
        listingId,
        reviews: [],
        totalReviews: 0,
        averageRating: 0,
        available: false,
        message: 'Reviews unavailable',
      };
    }
  }

  /**
   * Query a source adapter with timeout
   * 
   * @param adapter - Source adapter to query
   * @param query - Search query
   * @param category - Optional category filter
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise resolving to array of listings
   * 
   * Requirements: 2.3, 9.7
   */
  private async querySourceWithTimeout(
    adapter: SourceAdapter,
    query: string,
    category: string | undefined,
    timeoutMs: number
  ): Promise<Listing[]> {
    return Promise.race([
      adapter.search(query, category),
      new Promise<Listing[]>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Deduplicate listings by (productName, source) tuple
   * Retains the most recent entry based on fetchedAt timestamp
   * 
   * @param listings - Array of listings to deduplicate
   * @returns Deduplicated array
   * 
   * Requirements: 2.4
   */
  private deduplicate(listings: Listing[]): Listing[] {
    const uniqueMap = new Map<string, Listing>();

    listings.forEach((listing) => {
      const key = `${listing.productName}|${listing.source}`;
      const existing = uniqueMap.get(key);

      if (!existing) {
        uniqueMap.set(key, listing);
      } else {
        // Keep the most recent entry
        const existingTime = new Date(existing.fetchedAt).getTime();
        const currentTime = new Date(listing.fetchedAt).getTime();

        if (currentTime > existingTime) {
          uniqueMap.set(key, listing);
        }
      }
    });

    return Array.from(uniqueMap.values());
  }

  /**
   * Sort listings by composite score in descending order
   * 
   * @param listings - Array of listings with composite scores
   * @returns Sorted array
   * 
   * Requirements: 2.5
   */
  private sortByCompositeScore(listings: Listing[]): Listing[] {
    return [...listings].sort(
      (a, b) => b.compositeScore - a.compositeScore
    );
  }

  /**
   * Store price snapshots for all listings
   * Runs asynchronously, errors are logged but don't block the response
   * 
   * @param listings - Array of listings to store
   * 
   * Requirements: 5.5, 10.3
   */
  private async storePriceSnapshots(listings: Listing[]): Promise<void> {
    const promises = listings.map((listing) =>
      this.persistenceService
        .storePriceSnapshot(listing.id, listing.price, new Date(listing.fetchedAt))
        .catch((err) => {
          console.error(
            `Failed to store price snapshot for ${listing.id}:`,
            err
          );
        })
    );

    await Promise.allSettled(promises);
  }
}
