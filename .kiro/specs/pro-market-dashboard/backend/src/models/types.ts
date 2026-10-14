/**
 * PRO Market Dashboard - Data Models
 * 
 * This module defines the core TypeScript interfaces for the application's data models.
 * All validation rules are documented as JSDoc comments for each interface field.
 */

/**
 * Represents a product listing from a single source.
 * 
 * @interface Listing
 */
export interface Listing {
  /**
   * Unique identifier for the listing.
   * Format: "{source}_{productId}"
   * 
   * @validation Non-empty string, must be unique within result set
   */
  id: string;

  /**
   * Normalized product name.
   * 
   * @validation Non-empty string, maximum 200 characters
   */
  productName: string;

  /**
   * Source identifier (e.g., "Amazon", "eBay", "Walmart").
   * 
   * @validation Non-empty string
   */
  source: string;

  /**
   * Direct link to the product page on the source website.
   * 
   * @validation Valid URL string
   */
  sourceUrl: string;

  /**
   * Price in the smallest currency unit (e.g., cents for USD, paise for INR).
   * 
   * @validation Positive integer (> 0)
   */
  price: number;

  /**
   * ISO 4217 currency code (e.g., "USD", "INR", "EUR").
   * 
   * @validation Valid 3-character ISO 4217 code
   */
  currency: string;

  /**
   * Star rating for the product.
   * 
   * @validation Number in range [0.0, 5.0], one decimal precision
   */
  rating: number;

  /**
   * Total number of customer reviews.
   * 
   * @validation Non-negative integer (>= 0)
   */
  reviewCount: number;

  /**
   * Product category classification.
   * 
   * @validation Must be one of: "Electronics", "Books", "Clothing", "Home & Kitchen", "Sports"
   */
  category: string;

  /**
   * Computed composite score used for ranking and best pick selection.
   * 
   * @validation Number in range [0, 100]
   */
  compositeScore: number;

  /**
   * ISO 8601 timestamp indicating when the data was retrieved.
   * 
   * @validation Valid ISO 8601 datetime string
   */
  fetchedAt: string;

  /**
   * Optional product thumbnail image URL.
   * 
   * @validation Valid URL string if provided
   */
  imageUrl?: string;
}

/**
 * Represents a customer review for a product.
 * 
 * @interface Review
 */
export interface Review {
  /**
   * Reviewer display name.
   * 
   * @validation Non-empty string
   */
  author: string;

  /**
   * Star rating given by the reviewer.
   * 
   * @validation Integer in range [1, 5]
   */
  rating: number;

  /**
   * Review body text.
   * 
   * @validation Non-empty string, maximum 200 characters when displayed (may be truncated)
   */
  text: string;

  /**
   * Date when the review was posted.
   * Format: ISO date string (YYYY-MM-DD)
   * 
   * @validation Valid ISO date string (YYYY-MM-DD format)
   */
  date: string;

  /**
   * Indicates whether the purchase was verified by the source.
   * 
   * @validation Boolean value
   */
  verified: boolean;

  /**
   * Link to the full review on the source website.
   * 
   * @validation Valid URL string
   */
  sourceReviewUrl: string;
}

/**
 * Represents a single price data point in the historical price record.
 * 
 * @interface PriceHistoryRecord
 */
export interface PriceHistoryRecord {
  /**
   * When the price was recorded.
   * 
   * @validation Valid Date object
   */
  timestamp: Date;

  /**
   * Price at that time in the smallest currency unit.
   * 
   * @validation Positive integer (> 0)
   */
  price: number;
}

/**
 * Represents the aggregated search results containing listings,
 * best pick recommendation, and metadata.
 * 
 * @interface SearchResult
 */
export interface SearchResult {
  /**
   * All listings sorted by compositeScore in descending order.
   * 
   * @validation Array of valid Listing objects
   */
  listings: Listing[];

  /**
   * Top-scored listing recommendation.
   * Null if fewer than 2 results are available.
   * 
   * @validation Valid Listing object or null
   */
  bestPick: Listing | null;

  /**
   * Number of sources that successfully returned results.
   * 
   * @validation Non-negative integer (>= 0)
   */
  sourcesCount: number;

  /**
   * ISO 8601 timestamp if results were served from cache.
   * Null if results are fresh.
   * 
   * @validation Valid ISO 8601 datetime string or null
   */
  cachedAt: string | null;
}

/**
 * Represents an error response from the API.
 * 
 * @interface ErrorResponse
 */
export interface ErrorResponse {
  /**
   * Human-readable error message.
   * 
   * @validation Non-empty string
   */
  error: string;

  /**
   * Optional error code for programmatic error handling.
   * Examples: "INVALID_QUERY", "SOURCE_TIMEOUT", "DATABASE_ERROR"
   * 
   * @validation Non-empty string if provided
   */
  code?: string;

  /**
   * Optional additional context or debugging information.
   * 
   * @validation Any valid JSON value
   */
  details?: any;
}
