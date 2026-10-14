/**
 * Data models and interfaces for PRO Market Dashboard
 */

/**
 * Listing represents a single product entry from one source.
 * 
 * **Validates: Requirements 4.1, 6.1**
 * 
 * @interface Listing
 * @property {string} id - Unique identifier within result set. Format: "{source}_{productId}". Must be non-empty.
 * @property {string} productName - Normalized product name. Must be non-empty, max 200 characters.
 * @property {string} source - Source identifier (e.g., "Amazon", "eBay"). Must be non-empty.
 * @property {string} sourceUrl - Direct link to product page. Must be valid URL.
 * @property {number} price - Price in smallest currency unit (e.g., cents/paise). Must be positive integer.
 * @property {string} currency - ISO 4217 currency code (e.g., "USD", "INR"). Must be 3 uppercase letters.
 * @property {number} rating - Star rating with one decimal precision. Constraint: 0.0 ≤ rating ≤ 5.0
 * @property {number} reviewCount - Total number of reviews. Must be non-negative integer.
 * @property {string} category - Product category. Must be one of: "Electronics", "Books", "Clothing", "Home & Kitchen", "Sports"
 * @property {number} compositeScore - Computed recommendation score. Constraint: 0 ≤ score ≤ 100
 * @property {string} fetchedAt - ISO 8601 timestamp of when data was retrieved. Format: YYYY-MM-DDTHH:mm:ss.sssZ
 * @property {string} [imageUrl] - Optional product thumbnail URL. If provided, must be valid URL.
 */
export interface Listing {
  id: string;
  productName: string;
  source: string;
  sourceUrl: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  category: string;
  compositeScore: number;
  fetchedAt: string;
  imageUrl?: string;
}

/**
 * Review represents a customer review for a product listing.
 * 
 * **Validates: Requirements 6.1**
 * 
 * @interface Review
 * @property {string} author - Reviewer display name. Must be non-empty.
 * @property {number} rating - Star rating. Constraint: 1 ≤ rating ≤ 5 (integer)
 * @property {string} text - Review body text. Can be full text; truncated to 200 chars in display with ellipsis.
 * @property {string} date - Review date in ISO date format. Format: YYYY-MM-DD
 * @property {boolean} verified - Whether purchase was verified by the source.
 * @property {string} sourceReviewUrl - Link to full review on source website. Must be valid URL.
 */
export interface Review {
  author: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  sourceReviewUrl: string;
}

/**
 * PriceHistoryRecord represents a single price observation at a specific point in time.
 * 
 * @interface PriceHistoryRecord
 * @property {Date} timestamp - When the price was recorded. Must be valid Date object.
 * @property {number} price - Price at that time in smallest currency unit. Must be positive integer.
 */
export interface PriceHistoryRecord {
  timestamp: Date;
  price: number;
}

/**
 * PriceHistory is a time-ordered array of price records for a listing.
 * 
 * @typedef {PriceHistoryRecord[]} PriceHistory
 * @description Array should be ordered chronologically (oldest to newest).
 */
export type PriceHistory = PriceHistoryRecord[];

/**
 * SearchResult represents the aggregated response from a product search query.
 * 
 * **Validates: Requirements 4.1**
 * 
 * @interface SearchResult
 * @property {Listing[]} listings - All listings sorted by compositeScore in descending order (highest first).
 * @property {Listing | null} bestPick - Top-scored listing recommendation. Null if fewer than 2 results.
 * @property {number} sourcesCount - Number of distinct sources that returned results. Must be non-negative integer.
 * @property {string | null} cachedAt - ISO 8601 timestamp if served from cache, null if freshly fetched.
 */
export interface SearchResult {
  listings: Listing[];
  bestPick: Listing | null;
  sourcesCount: number;
  cachedAt: string | null;
}

/**
 * ErrorResponse represents an API error response.
 * 
 * @interface ErrorResponse
 * @property {string} error - Human-readable error message. Must be non-empty.
 * @property {string} [code] - Optional error code for programmatic handling (e.g., "INVALID_QUERY", "SOURCE_TIMEOUT").
 * @property {any} [details] - Optional additional context or debugging information.
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

/**
 * ReviewResponse represents the aggregated review data for a specific listing.
 * 
 * **Validates: Requirements 6.1**
 * 
 * @interface ReviewResponse
 * @property {string} listingId - Unique identifier of the listing. Format: "{source}_{productId}"
 * @property {Review[]} reviews - Array of up to 20 review objects. Empty if reviews unavailable.
 * @property {number} totalReviews - Total review count from source. Must be non-negative integer.
 * @property {number} averageRating - Average star rating to one decimal place. Constraint: 0.0 ≤ rating ≤ 5.0
 * @property {boolean} available - Whether review data is available from the source.
 * @property {string} [message] - Optional message (e.g., "Reviews unavailable" when available is false).
 */
export interface ReviewResponse {
  listingId: string;
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
  available: boolean;
  message?: string;
}

/**
 * PriceAlert represents a user-configured notification for price drops.
 * 
 * **Validates: Requirements 1.2**
 * 
 * @interface PriceAlert
 * @property {string} id - Unique alert identifier. Format: UUID v4.
 * @property {string} listingId - Associated listing identifier. Format: "{source}_{productId}".
 * @property {string} productName - Product name for display. Max 200 characters.
 * @property {string} source - Source identifier (e.g., "Amazon", "Flipkart").
 * @property {number} alertThreshold - Trigger price in smallest currency unit. Must be positive integer.
 * @property {string} currency - ISO 4217 currency code. Must be 3 uppercase letters.
 * @property {number} currentPrice - Latest known price in smallest currency unit. Must be positive integer.
 * @property {string} createdAt - ISO 8601 timestamp when alert was created.
 * @property {boolean} triggered - Whether alert has been triggered. Default: false.
 * @property {string | null} triggeredAt - ISO 8601 timestamp when alert triggered. Null if not triggered.
 */
export interface PriceAlert {
  id: string;
  listingId: string;
  productName: string;
  source: string;
  alertThreshold: number;
  currency: string;
  currentPrice: number;
  createdAt: string;
  triggered: boolean;
  triggeredAt: string | null;
}

/**
 * WishlistItem represents a saved product in the user's wishlist.
 * 
 * **Validates: Requirements 2.2**
 * 
 * @interface WishlistItem
 * @property {string} id - Unique wishlist item identifier. Format: UUID v4.
 * @property {string} listingId - Associated listing identifier. Format: "{source}_{productId}".
 * @property {string} productName - Product name for display. Max 200 characters.
 * @property {string} source - Source identifier (e.g., "Amazon", "Flipkart").
 * @property {number} savedPrice - Price at time of addition in smallest currency unit. Must be positive integer.
 * @property {number} currentPrice - Latest known price in smallest currency unit. Must be positive integer.
 * @property {string} currency - ISO 4217 currency code. Must be 3 uppercase letters.
 * @property {string} addedAt - ISO 8601 timestamp when item was added to wishlist.
 * @property {string} category - Product category for filtering.
 * @property {string} [imageUrl] - Optional product thumbnail URL.
 */
export interface WishlistItem {
  id: string;
  listingId: string;
  productName: string;
  source: string;
  savedPrice: number;
  currentPrice: number;
  currency: string;
  addedAt: string;
  category: string;
  imageUrl?: string;
}
