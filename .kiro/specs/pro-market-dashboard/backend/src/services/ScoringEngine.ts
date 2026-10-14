import { Listing } from '../models/types';

/**
 * ScoringEngine calculates composite scores and selects best picks
 * 
 * Requirements:
 * - 7.2: Compute CompositeScore using weighted formula
 * - 7.3: Select BestPick listing
 * - 7.4: Determine reason for BestPick selection
 */
export class ScoringEngine {
  /**
   * Calculate composite score for a listing
   * Formula: (0.5 × priceRank) + (0.3 × ratingNorm) + (0.2 × reviewCountNorm)
   * 
   * @param listing - The listing to score
   * @param allListings - All listings in the result set for normalization
   * @returns Composite score between 0 and 100
   * 
   * Requirements: 7.2
   */
  calculateCompositeScore(listing: Listing, allListings: Listing[]): number {
    if (allListings.length === 0) {
      return 0;
    }

    // Calculate price rank (inverse: lowest price gets highest score)
    const prices = allListings.map((l) => l.price).sort((a, b) => a - b);
    const priceRank = prices.indexOf(listing.price);
    const priceRankNorm =
      prices.length > 1 ? 1 - priceRank / (prices.length - 1) : 1;

    // Normalize rating (0.0-5.0 → 0.0-1.0)
    const ratingNorm = listing.rating / 5.0;

    // Normalize review count using log scale
    const reviewCounts = allListings.map((l) => l.reviewCount);
    const maxReviewCount = Math.max(...reviewCounts, 1);
    const minReviewCount = Math.min(...reviewCounts, 0);

    let reviewCountNorm = 0;
    if (maxReviewCount > minReviewCount) {
      // Log scale normalization
      const logMax = Math.log(maxReviewCount + 1);
      const logMin = Math.log(minReviewCount + 1);
      const logCurrent = Math.log(listing.reviewCount + 1);
      reviewCountNorm = (logCurrent - logMin) / (logMax - logMin);
    } else if (listing.reviewCount > 0) {
      reviewCountNorm = 1;
    }

    // Weighted combination
    const score =
      0.5 * priceRankNorm + 0.3 * ratingNorm + 0.2 * reviewCountNorm;

    // Scale to 0-100
    return Math.round(score * 100 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Select the best pick from a list of listings
   * Returns the listing with the highest composite score
   * Tiebreaker: lowest price
   * 
   * @param listings - Array of listings with composite scores
   * @returns Best pick listing or null if fewer than 2 listings
   * 
   * Requirements: 7.3
   */
  selectBestPick(listings: Listing[]): Listing | null {
    // Requirement: at least 2 listings needed for best pick
    if (listings.length < 2) {
      return null;
    }

    // Find listings with highest composite score
    const maxScore = Math.max(...listings.map((l) => l.compositeScore));
    const topListings = listings.filter(
      (l) => l.compositeScore === maxScore
    );

    // Tiebreaker: lowest price
    if (topListings.length === 1) {
      return topListings[0];
    }

    return topListings.reduce((best, current) =>
      current.price < best.price ? current : best
    );
  }

  /**
   * Determine the reason why a listing was selected as best pick
   * 
   * @param bestPick - The selected best pick listing
   * @param allListings - All listings in the result set
   * @returns Reason string
   * 
   * Requirements: 7.4
   */
  determineBestPickReason(
    bestPick: Listing,
    allListings: Listing[]
  ): string {
    // Check if it has the lowest price
    const minPrice = Math.min(...allListings.map((l) => l.price));
    if (bestPick.price === minPrice) {
      return 'Best price';
    }

    // Check if it has the highest rating
    const maxRating = Math.max(...allListings.map((l) => l.rating));
    if (bestPick.rating === maxRating) {
      return 'Highest rated';
    }

    // Check if it has the most reviews
    const maxReviews = Math.max(...allListings.map((l) => l.reviewCount));
    if (bestPick.reviewCount === maxReviews) {
      return 'Most reviewed';
    }

    // Default reason
    return 'Best value';
  }
}
