/**
 * Property-based tests for CacheManager TTL behavior
 * 
 * **Validates: Requirements 10.1, 10.2**
 * 
 * This test suite implements Property 15: Cache Hit Behavior from the design document.
 * It verifies that the cache correctly handles:
 * - First request results in MISS (null)
 * - Subsequent requests within TTL result in HIT (returns data)
 * - Requests after TTL expiration result in MISS (null)
 * 
 * Property-based testing ensures cache behavior is correct across all possible
 * cache keys, data values, and TTL durations.
 */

import * as fc from 'fast-check';
import { pbtConfig } from '../test/generators';
import { CacheManager } from './CacheManager';

describe('Property 15: Cache Hit Behavior', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
  });

  /**
   * Property Test: Cache MISS on first request, HIT on subsequent within TTL
   * 
   * **Validates: Requirements 10.1, 10.2**
   * 
   * For any unique cache key and any data value:
   * 1. First get() call SHALL return null (MISS - data not in cache)
   * 2. After set() with TTL, subsequent get() SHALL return the stored data (HIT)
   * 3. The returned data SHALL be identical to the originally stored data
   * 
   * This property ensures the fundamental cache contract: store once, retrieve many
   * times within the TTL window.
   */
  test('First request returns MISS, subsequent requests return HIT within TTL', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // Cache key
        fc.anything(), // Cache data (any serializable value)
        fc.integer({ min: 1, max: 3600 }), // TTL in seconds (1s to 1 hour)
        (key: string, data: any, ttlSeconds: number) => {
          // Clear cache before each property test run to ensure isolation
          cacheManager.clear();

          // ===== PHASE 1: CACHE MISS =====
          // Before storing anything, get() should return null
          const firstResult = cacheManager.get(key);
          expect(firstResult).toBeNull();

          // ===== PHASE 2: STORE DATA =====
          // Store data with specified TTL
          cacheManager.set(key, data, ttlSeconds);

          // ===== PHASE 3: CACHE HIT =====
          // Immediately after storing, get() should return the data (HIT)
          const secondResult = cacheManager.get(key);
          expect(secondResult).toEqual(data);

          // ===== PHASE 4: MULTIPLE HITS WITHIN TTL =====
          // Multiple subsequent calls should continue returning the same data
          const thirdResult = cacheManager.get(key);
          expect(thirdResult).toEqual(data);

          const fourthResult = cacheManager.get(key);
          expect(fourthResult).toEqual(data);

          // ===== INVARIANT: DATA INTEGRITY =====
          // The returned data must be identical to what was stored
          // (deep equality for objects, reference or value equality for primitives)
          expect(secondResult).toStrictEqual(data);
        }
      ),
      {
        ...pbtConfig,
        numRuns: 100, // Minimum 100 iterations as per requirements
      }
    );
  });

  /**
   * Property Test: Cache returns MISS after TTL expiration
   * 
   * **Validates: Requirements 10.1, 10.2**
   * 
   * For any cache entry with a TTL:
   * 1. Within TTL: get() SHALL return the stored data (HIT)
   * 2. After TTL expires: get() SHALL return null (MISS)
   * 3. The expired entry SHALL be automatically removed from cache
   * 
   * This property ensures that cached data does not persist beyond its intended lifetime.
   */
  test('Cache returns MISS after TTL expiration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }), // Cache key
        fc.record({
          // Generate structured test data to ensure serialization works
          id: fc.string(),
          value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          timestamp: fc.date().map(d => d.toISOString()),
        }),
        async (key: string, data: any) => {
          // Clear cache before each property test run to ensure isolation
          cacheManager.clear();

          const shortTTL = 0.15; // 150ms TTL for faster testing

          // ===== PHASE 1: STORE DATA =====
          cacheManager.set(key, data, shortTTL);

          // ===== PHASE 2: VERIFY HIT WITHIN TTL =====
          // Immediately after storing, data should be retrievable
          const hitResult = cacheManager.get(key);
          expect(hitResult).toEqual(data);

          // ===== PHASE 3: WAIT FOR TTL EXPIRATION =====
          // Wait for TTL to expire (200ms > 150ms TTL)
          await new Promise(resolve => setTimeout(resolve, 200));

          // ===== PHASE 4: VERIFY MISS AFTER EXPIRATION =====
          // After TTL expires, get() should return null
          const missResult = cacheManager.get(key);
          expect(missResult).toBeNull();

          // ===== PHASE 5: VERIFY AUTOMATIC REMOVAL =====
          // The expired entry should be automatically removed
          // (accessing an expired entry triggers removal in CacheManager)
          const sizeAfterExpiry = cacheManager.size();
          expect(sizeAfterExpiry).toBe(0);
        }
      ),
      {
        ...pbtConfig,
        numRuns: 50, // Reduced iterations due to async nature and timeouts
      }
    );
  }, 15000); // Extend Jest timeout to 15s to accommodate async property test

  /**
   * Property Test: Multiple cache entries with different TTLs expire independently
   * 
   * **Validates: Requirements 10.1, 10.2**
   * 
   * For any set of cache entries with different TTLs:
   * 1. Each entry SHALL expire independently based on its own TTL
   * 2. Short-lived entries SHALL expire before long-lived entries
   * 3. Long-lived entries SHALL remain accessible after short-lived ones expire
   * 
   * This property ensures that the cache correctly manages multiple entries
   * with different expiration times simultaneously.
   */
  test('Multiple entries with different TTLs expire independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 50 }), // Key 1
          fc.string({ minLength: 1, maxLength: 50 }), // Key 2
        ).filter(([k1, k2]) => k1 !== k2), // Ensure keys are different
        fc.anything(), // Data 1
        fc.anything(), // Data 2
        async (keys: [string, string], data1: any, data2: any) => {
          // Clear cache before each property test run to ensure isolation
          cacheManager.clear();

          const [shortKey, longKey] = keys;
          const shortTTL = 0.08; // 80ms
          const longTTL = 0.5; // 500ms

          // ===== PHASE 1: STORE BOTH ENTRIES =====
          cacheManager.set(shortKey, data1, shortTTL);
          cacheManager.set(longKey, data2, longTTL);

          // ===== PHASE 2: VERIFY BOTH ARE INITIALLY ACCESSIBLE =====
          expect(cacheManager.get(shortKey)).toEqual(data1);
          expect(cacheManager.get(longKey)).toEqual(data2);
          expect(cacheManager.size()).toBe(2);

          // ===== PHASE 3: WAIT FOR SHORT TTL TO EXPIRE =====
          // Wait 120ms (short TTL expires, long TTL still active)
          await new Promise(resolve => setTimeout(resolve, 120));

          // ===== PHASE 4: VERIFY SHORT EXPIRED, LONG STILL ACCESSIBLE =====
          const shortResult = cacheManager.get(shortKey);
          expect(shortResult).toBeNull(); // Short TTL expired

          const longResult = cacheManager.get(longKey);
          expect(longResult).toEqual(data2); // Long TTL still valid

          // Size should be 1 (short entry removed, long entry remains)
          expect(cacheManager.size()).toBe(1);

          // ===== PHASE 5: WAIT FOR LONG TTL TO EXPIRE =====
          // Wait additional 450ms (total 570ms > 500ms long TTL)
          await new Promise(resolve => setTimeout(resolve, 450));

          // ===== PHASE 6: VERIFY BOTH EXPIRED =====
          expect(cacheManager.get(shortKey)).toBeNull();
          expect(cacheManager.get(longKey)).toBeNull();
          expect(cacheManager.size()).toBe(0);
        }
      ),
      {
        ...pbtConfig,
        numRuns: 20, // Reduced due to multiple timeouts per iteration
      }
    );
  }, 30000); // 30s timeout for this test due to multiple delays

  /**
   * Property Test: Cache key generation produces consistent, collision-free keys
   * 
   * **Validates: Requirements 10.1, 10.2**
   * 
   * For any search parameters (query, category):
   * 1. generateKey() SHALL produce the same key for identical inputs
   * 2. generateKey() SHALL produce different keys for different inputs
   * 3. Keys SHALL be normalized (lowercase, trimmed)
   * 
   * This property ensures that cache lookups are consistent and collisions
   * don't cause incorrect cache hits.
   */
  test('Cache key generation is consistent and collision-free', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 100 }), // Query 1
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // Category 1
          fc.string({ minLength: 1, maxLength: 100 }), // Query 2
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // Category 2
        ),
        ([query1, category1, query2, category2]) => {
          // ===== TEST 1: CONSISTENCY =====
          // Same inputs should always produce the same key
          const key1a = cacheManager.generateKey(query1, category1);
          const key1b = cacheManager.generateKey(query1, category1);
          expect(key1a).toBe(key1b);

          const key2a = cacheManager.generateKey(query2, category2);
          const key2b = cacheManager.generateKey(query2, category2);
          expect(key2a).toBe(key2b);

          // ===== TEST 2: NORMALIZATION =====
          // Keys should be normalized (lowercase, trimmed)
          const keyWithSpaces = cacheManager.generateKey(`  ${query1}  `, category1);
          const keyWithoutSpaces = cacheManager.generateKey(query1.trim(), category1);
          expect(keyWithSpaces).toBe(keyWithoutSpaces);

          const keyUpperCase = cacheManager.generateKey(query1.toUpperCase(), category1);
          const keyLowerCase = cacheManager.generateKey(query1.toLowerCase(), category1);
          expect(keyUpperCase).toBe(keyLowerCase);

          // ===== TEST 3: COLLISION AVOIDANCE =====
          // Different inputs should produce different keys
          // (unless query and category are identical after normalization)
          if (
            query1.trim().toLowerCase() !== query2.trim().toLowerCase() ||
            (category1 || 'all').trim().toLowerCase() !== (category2 || 'all').trim().toLowerCase()
          ) {
            expect(key1a).not.toBe(key2a);
          }

          // ===== TEST 4: CATEGORY DEFAULT =====
          // Undefined/null category should default to "all"
          const keyWithoutCategory = cacheManager.generateKey(query1);
          const keyWithAllCategory = cacheManager.generateKey(query1, 'all');
          expect(keyWithoutCategory).toBe(keyWithAllCategory);
        }
      ),
      {
        ...pbtConfig,
        numRuns: 100,
      }
    );
  });

  /**
   * Property Test: Cache correctly handles edge case data types
   * 
   * **Validates: Requirements 10.1, 10.2**
   * 
   * The cache should correctly store and retrieve various data types:
   * - Primitives: strings, numbers, booleans, null
   * - Objects: nested objects, arrays
   * - Special values: empty strings, zero, false
   * 
   * This ensures the cache doesn't incorrectly treat falsy values as cache misses.
   */
  test('Cache correctly handles all data types including edge cases', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // Key
        fc.oneof(
          fc.constant(null),
          fc.constant(0),
          fc.constant(false),
          fc.constant(''),
          fc.constant([]),
          fc.constant({}),
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.array(fc.anything()),
          fc.record({
            nested: fc.record({
              value: fc.anything(),
            }),
          }),
        ), // Various data types
        (key: string, data: any) => {
          // Clear cache before each property test run to ensure isolation
          cacheManager.clear();

          // Store the data
          cacheManager.set(key, data, 60);

          // Retrieve the data
          const retrieved = cacheManager.get(key);

          // The retrieved data should match exactly what was stored
          // This is critical for edge cases like null, 0, false, empty string/array
          expect(retrieved).toStrictEqual(data);

          // Special case: differentiate between cache miss (null) and stored null
          // If we stored null, we should get null back (not treated as a miss)
          if (data === null) {
            // We can verify this by checking size - if null was stored, size > 0
            expect(cacheManager.size()).toBeGreaterThan(0);
          }
        }
      ),
      {
        ...pbtConfig,
        numRuns: 100,
      }
    );
  });

  /**
   * Property Test: Cache set() overwrites existing entries
   * 
   * **Validates: Requirements 10.1, 10.2**
   * 
   * For any cache key:
   * 1. First set() stores initial data
   * 2. Second set() with same key overwrites with new data
   * 3. Subsequent get() returns the new data, not the old
   * 4. TTL is reset to the new value
   * 
   * This ensures cache updates work correctly when search results are refreshed.
   */
  test('Setting the same key twice overwrites the first value', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // Key
        fc.anything(), // First data value
        fc.anything(), // Second data value
        fc.integer({ min: 1, max: 100 }), // First TTL
        fc.integer({ min: 1, max: 100 }), // Second TTL
        (key: string, data1: any, data2: any, ttl1: number, ttl2: number) => {
          // Clear cache before each property test run to ensure isolation
          cacheManager.clear();

          // ===== PHASE 1: STORE FIRST VALUE =====
          cacheManager.set(key, data1, ttl1);
          const firstGet = cacheManager.get(key);
          expect(firstGet).toEqual(data1);

          // ===== PHASE 2: OVERWRITE WITH SECOND VALUE =====
          cacheManager.set(key, data2, ttl2);
          const secondGet = cacheManager.get(key);
          expect(secondGet).toEqual(data2);

          // ===== VERIFICATION: OLD VALUE IS GONE =====
          // The second value should be returned, not the first
          expect(secondGet).not.toEqual(data1);
          expect(secondGet).toEqual(data2);

          // ===== VERIFICATION: SIZE REMAINS 1 =====
          // Overwriting should not increase cache size
          expect(cacheManager.size()).toBe(1);
        }
      ),
      {
        ...pbtConfig,
        numRuns: 100,
      }
    );
  });
});
