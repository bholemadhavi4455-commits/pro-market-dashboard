/**
 * Source Adapters
 * Interface implementations for external data sources
 */

import { Listing, Review } from '../models';

/**
 * Common interface for all source adapters
 */
export interface SourceAdapter {
  sourceName: string;
  
  /**
   * Search for products matching the query
   * @param query - Search query string
   * @param category - Optional category filter
   * @returns Array of normalized Listing objects
   */
  search(query: string, category?: string): Promise<Listing[]>;
  
  /**
   * Get reviews for a specific product
   * @param productId - Product identifier from this source
   * @returns Array of normalized Review objects
   */
  getReviews(productId: string): Promise<Review[]>;
}

// Concrete adapter implementations will be added in subsequent tasks
export {};
