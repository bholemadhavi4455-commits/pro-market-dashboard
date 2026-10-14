/**
 * Unit tests for CacheManager service
 * 
 * Tests cover:
 * - Basic set/get operations
 * - TTL expiration behavior
 * - Cache key generation
 * - Clear functionality
 * - Edge cases (expired entries, non-existent keys)
 */

import { CacheManager } from './CacheManager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
  });

  describe('set() and get()', () => {
    it('should store and retrieve data', () => {
      const testData = { message: 'Hello, World!' };
      cacheManager.set('test-key', testData, 60);

      const result = cacheManager.get('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheManager.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle multiple entries', () => {
      cacheManager.set('key1', 'value1', 60);
      cacheManager.set('key2', 'value2', 60);
      cacheManager.set('key3', 'value3', 60);

      expect(cacheManager.get('key1')).toBe('value1');
      expect(cacheManager.get('key2')).toBe('value2');
      expect(cacheManager.get('key3')).toBe('value3');
    });

    it('should overwrite existing keys', () => {
      cacheManager.set('key', 'original', 60);
      cacheManager.set('key', 'updated', 60);

      expect(cacheManager.get('key')).toBe('updated');
    });

    it('should handle complex data types', () => {
      const complexData = {
        listings: [
          { id: '1', name: 'Product 1', price: 1000 },
          { id: '2', name: 'Product 2', price: 2000 }
        ],
        bestPick: { id: '1', name: 'Product 1', price: 1000 },
        sourcesCount: 3
      };

      cacheManager.set('search-results', complexData, 600);
      const result = cacheManager.get('search-results');

      expect(result).toEqual(complexData);
    });
  });

  describe('TTL expiration', () => {
    it('should return null for expired entries', (done) => {
      cacheManager.set('expires-soon', 'test-data', 0.1); // 100ms TTL

      // Immediately after setting, data should be available
      expect(cacheManager.get('expires-soon')).toBe('test-data');

      // After TTL expires, should return null
      setTimeout(() => {
        const result = cacheManager.get('expires-soon');
        expect(result).toBeNull();
        done();
      }, 150);
    }, 300);

    it('should automatically remove expired entries on access', (done) => {
      cacheManager.set('auto-remove', 'data', 0.1); // 100ms TTL
      
      expect(cacheManager.size()).toBe(1);

      setTimeout(() => {
        cacheManager.get('auto-remove'); // This should trigger removal
        expect(cacheManager.size()).toBe(0);
        done();
      }, 150);
    }, 300);

    it('should handle different TTL values correctly', (done) => {
      cacheManager.set('short-lived', 'data1', 0.1);  // 100ms
      cacheManager.set('long-lived', 'data2', 10);    // 10 seconds

      setTimeout(() => {
        expect(cacheManager.get('short-lived')).toBeNull();
        expect(cacheManager.get('long-lived')).toBe('data2');
        done();
      }, 150);
    }, 300);
  });

  describe('generateKey()', () => {
    it('should generate key with query only', () => {
      const key = cacheManager.generateKey('laptop');
      expect(key).toBe('search:laptop:all');
    });

    it('should generate key with query and category', () => {
      const key = cacheManager.generateKey('laptop', 'Electronics');
      expect(key).toBe('search:laptop:electronics');
    });

    it('should normalize query to lowercase', () => {
      const key1 = cacheManager.generateKey('LAPTOP');
      const key2 = cacheManager.generateKey('laptop');
      expect(key1).toBe(key2);
    });

    it('should normalize category to lowercase', () => {
      const key1 = cacheManager.generateKey('laptop', 'ELECTRONICS');
      const key2 = cacheManager.generateKey('laptop', 'electronics');
      expect(key1).toBe(key2);
    });

    it('should trim whitespace from query', () => {
      const key1 = cacheManager.generateKey('  laptop  ');
      const key2 = cacheManager.generateKey('laptop');
      expect(key1).toBe(key2);
    });

    it('should trim whitespace from category', () => {
      const key1 = cacheManager.generateKey('laptop', '  Electronics  ');
      const key2 = cacheManager.generateKey('laptop', 'Electronics');
      expect(key1).toBe(key2);
    });

    it('should treat undefined category as "all"', () => {
      const key1 = cacheManager.generateKey('laptop');
      const key2 = cacheManager.generateKey('laptop', undefined);
      expect(key1).toBe(key2);
      expect(key1).toBe('search:laptop:all');
    });

    it('should handle special characters in query', () => {
      const key = cacheManager.generateKey('laptop & accessories');
      expect(key).toBe('search:laptop & accessories:all');
    });
  });

  describe('clear()', () => {
    it('should remove all entries from cache', () => {
      cacheManager.set('key1', 'value1', 60);
      cacheManager.set('key2', 'value2', 60);
      cacheManager.set('key3', 'value3', 60);

      expect(cacheManager.size()).toBe(3);

      cacheManager.clear();

      expect(cacheManager.size()).toBe(0);
      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBeNull();
      expect(cacheManager.get('key3')).toBeNull();
    });

    it('should work on empty cache', () => {
      expect(() => cacheManager.clear()).not.toThrow();
      expect(cacheManager.size()).toBe(0);
    });
  });

  describe('size()', () => {
    it('should return 0 for empty cache', () => {
      expect(cacheManager.size()).toBe(0);
    });

    it('should return correct count after additions', () => {
      cacheManager.set('key1', 'value1', 60);
      expect(cacheManager.size()).toBe(1);

      cacheManager.set('key2', 'value2', 60);
      expect(cacheManager.size()).toBe(2);
    });

    it('should not count expired entries after access', (done) => {
      cacheManager.set('expires', 'data', 0.1);
      expect(cacheManager.size()).toBe(1);

      setTimeout(() => {
        cacheManager.get('expires'); // Triggers removal
        expect(cacheManager.size()).toBe(0);
        done();
      }, 150);
    }, 300);
  });

  describe('Integration scenarios', () => {
    it('should support 10-minute cache TTL for search results', () => {
      const searchResults = {
        listings: [{ id: '1', name: 'Product', price: 1000 }],
        bestPick: null,
        sourcesCount: 2
      };

      const cacheKey = cacheManager.generateKey('laptop', 'Electronics');
      cacheManager.set(cacheKey, searchResults, 600); // 10 minutes

      const cached = cacheManager.get(cacheKey);
      expect(cached).toEqual(searchResults);
    });

    it('should handle concurrent search queries with different parameters', () => {
      const results1 = { data: 'results for laptop in electronics' };
      const results2 = { data: 'results for laptop in all categories' };
      const results3 = { data: 'results for phone in electronics' };

      const key1 = cacheManager.generateKey('laptop', 'Electronics');
      const key2 = cacheManager.generateKey('laptop');
      const key3 = cacheManager.generateKey('phone', 'Electronics');

      cacheManager.set(key1, results1, 600);
      cacheManager.set(key2, results2, 600);
      cacheManager.set(key3, results3, 600);

      expect(cacheManager.get(key1)).toEqual(results1);
      expect(cacheManager.get(key2)).toEqual(results2);
      expect(cacheManager.get(key3)).toEqual(results3);

      // Verify keys are unique
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });

    it('should handle cache invalidation via clear', () => {
      // Simulate caching multiple search results
      cacheManager.set(cacheManager.generateKey('laptop'), { data: 'laptops' }, 600);
      cacheManager.set(cacheManager.generateKey('phone'), { data: 'phones' }, 600);
      cacheManager.set(cacheManager.generateKey('tablet'), { data: 'tablets' }, 600);

      expect(cacheManager.size()).toBe(3);

      // Clear cache (e.g., when data source is updated)
      cacheManager.clear();

      // All entries should be gone
      expect(cacheManager.get(cacheManager.generateKey('laptop'))).toBeNull();
      expect(cacheManager.size()).toBe(0);
    });
  });
});
