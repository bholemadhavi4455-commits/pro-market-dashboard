import { Listing, Review } from '../models/types';

/**
 * SourceAdapter interface defines the contract for external source integrations
 * 
 * Each source (Amazon, eBay, Walmart, etc.) implements this interface to provide
 * normalized product listings and reviews.
 * 
 * Requirements: 2.1 - Multi-source aggregation
 */
export interface SourceAdapter {
  /**
   * Unique identifier for the source (e.g., "Amazon", "eBay", "Walmart")
   */
  readonly sourceName: string;

  /**
   * Search for products matching the query
   * 
   * @param query - Search query string
   * @param category - Optional category filter
   * @returns Promise resolving to array of normalized Listing objects
   * @throws Error if the source fails to respond or times out
   * 
   * Contract expectations:
   * - Must return normalized Listing objects with all required fields
   * - Each listing id must be unique and follow format: "{sourceName}_{productId}"
   * - Prices must be in smallest currency unit (cents/paise)
   * - Ratings must be in range [0.0, 5.0]
   * - Should complete within 5 seconds (timeout handled by aggregator)
   * - Should throw descriptive errors on failure
   */
  search(query: string, category?: string): Promise<Listing[]>;

  /**
   * Retrieve customer reviews for a specific product
   * 
   * @param productId - Product identifier (without source prefix)
   * @returns Promise resolving to array of normalized Review objects
   * @returns Empty array if reviews are not available
   * 
   * Contract expectations:
   * - Must return normalized Review objects with all required fields
   * - Should return up to 20 most recent/relevant reviews
   * - Should return empty array (not throw) if reviews unavailable
   * - Review text may be truncated to reasonable length
   * - Should complete within reasonable time
   */
  getReviews(productId: string): Promise<Review[]>;
}
