/**
 * CacheManager - In-memory cache with TTL support
 * 
 * Provides a simple key-value cache with automatic expiration.
 * Used by AggregatorService to cache search results for 10 minutes.
 * 
 * Validates: Requirements 10.1, 10.2
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number; // Unix timestamp in milliseconds
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Store data in cache with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlSeconds - Time to live in seconds
   */
  set(key: string, data: any, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Retrieve data from cache
   * Returns null if key doesn't exist or data has expired
   * Automatically removes expired entries on access
   * @param key - Cache key
   * @returns Cached data or null
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      // Remove expired entry
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Generate a cache key from search parameters
   * @param query - Search query string
   * @param category - Optional category filter
   * @returns Cache key string
   */
  generateKey(query: string, category?: string): string {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedCategory = category ? category.trim().toLowerCase() : 'all';
    return `search:${normalizedQuery}:${normalizedCategory}`;
  }

  /**
   * Clear all entries from the cache
   * Useful for testing and manual cache invalidation
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current number of entries in the cache
   * @returns Number of cache entries
   */
  size(): number {
    return this.cache.size;
  }
}
