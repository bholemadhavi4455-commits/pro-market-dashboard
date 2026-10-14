/**
 * Tests for validation and formatting utilities
 * Feature: pro-market-dashboard
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateSearchQuery,
  formatCurrency,
  formatDate,
  formatDateForChart,
  countUniqueSources,
} from './validation';
import { Listing } from '../types';

describe('Validation Utilities', () => {
  describe('validateSearchQuery', () => {
    // Unit tests for specific examples
    it('should return null for valid non-empty query', () => {
      expect(validateSearchQuery('laptop')).toBeNull();
      expect(validateSearchQuery('Apple AirPods Pro')).toBeNull();
      expect(validateSearchQuery('a')).toBeNull(); // Single character is valid
    });

    it('should return error for empty string', () => {
      expect(validateSearchQuery('')).toBe('Please enter a search term');
    });

    it('should return error for whitespace-only strings', () => {
      expect(validateSearchQuery(' ')).toBe('Please enter a search term');
      expect(validateSearchQuery('   ')).toBe('Please enter a search term');
      expect(validateSearchQuery('\t')).toBe('Please enter a search term');
      expect(validateSearchQuery('\n')).toBe('Please enter a search term');
      expect(validateSearchQuery(' \t \n ')).toBe('Please enter a search term');
    });

    it('should accept strings with leading/trailing whitespace if they contain content', () => {
      expect(validateSearchQuery(' laptop ')).toBeNull();
      expect(validateSearchQuery('\tlaptop\n')).toBeNull();
    });

    // Property-based tests
    describe('Property 2: Input Validation Rejects Whitespace', () => {
      it('should reject all whitespace-only strings', () => {
        /**
         * **Validates: Requirements 1.3**
         * 
         * Property: For any string composed entirely of whitespace characters
         * (spaces, tabs, newlines, or any combination thereof), the validation
         * SHALL reject the input and display a validation error message.
         */
        fc.assert(
          fc.property(
            // Generator: strings containing only whitespace characters
            fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1 }),
            (whitespaceString) => {
              const result = validateSearchQuery(whitespaceString);
              // Property: All whitespace strings must be rejected (non-null error)
              expect(result).not.toBeNull();
              expect(result).toBe('Please enter a search term');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept all non-whitespace strings', () => {
        /**
         * **Validates: Requirements 1.3**
         * 
         * Property: For any string containing at least one non-whitespace character,
         * the validation SHALL accept the input (return null).
         */
        fc.assert(
          fc.property(
            // Generator: strings with at least one non-whitespace character
            fc
              .string({ minLength: 1 })
              .filter((s) => s.trim().length > 0),
            (validString) => {
              const result = validateSearchQuery(validString);
              // Property: All strings with content must be accepted (null result)
              expect(result).toBeNull();
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('formatCurrency', () => {
    // Unit tests for specific examples
    it('should format USD correctly', () => {
      expect(formatCurrency(24999, 'USD')).toBe('$249.99');
      expect(formatCurrency(100, 'USD')).toBe('$1.00');
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
      expect(formatCurrency(999999, 'USD')).toBe('$9,999.99');
    });

    it('should format INR correctly', () => {
      expect(formatCurrency(24999, 'INR')).toBe('₹249.99');
      expect(formatCurrency(100000, 'INR')).toBe('₹1,000.00');
    });

    it('should format EUR correctly', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€10.00');
      expect(formatCurrency(50000, 'EUR')).toBe('€500.00');
    });

    it('should handle invalid currency codes gracefully', () => {
      const result = formatCurrency(1000, 'INVALID');
      expect(result).toContain('INVALID');
      expect(result).toContain('10.00');
    });

    // Property-based tests
    it('should always produce a string output', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000000 }), // Price in smallest unit
          fc.constantFrom('USD', 'EUR', 'INR', 'GBP', 'JPY'), // Common currencies
          (price, currency) => {
            const result = formatCurrency(price, currency);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include decimal point for major currencies', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000000 }),
          fc.constantFrom('USD', 'EUR', 'INR', 'GBP'),
          (price, currency) => {
            const result = formatCurrency(price, currency);
            // Should contain decimal point or be JPY which doesn't use decimals
            expect(result).toMatch(/\d+\.\d{2}|JPY/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly convert smallest unit to major unit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 100000 }), // At least $1.00
          (price) => {
            const result = formatCurrency(price, 'USD');
            // Extract numeric value (remove $ and commas)
            const numericValue = parseFloat(
              result.replace(/[$,]/g, '')
            );
            // Should equal price / 100
            expect(numericValue).toBeCloseTo(price / 100, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('formatDate', () => {
    // Unit tests for specific examples
    it('should format short dates correctly', () => {
      expect(formatDate('2025-01-15T10:30:00Z', 'short')).toBe('Jan 15');
      expect(formatDate('2025-12-31T23:59:59Z', 'short')).toBe('Dec 31');
    });

    it('should format medium dates correctly', () => {
      expect(formatDate('2025-01-15T10:30:00Z', 'medium')).toBe('Jan 15, 2025');
      expect(formatDate('2025-12-31T23:59:59Z', 'medium')).toBe('Dec 31, 2025');
    });

    it('should format long dates correctly', () => {
      expect(formatDate('2025-01-15T10:30:00Z', 'long')).toBe('January 15, 2025');
      expect(formatDate('2025-12-31T23:59:59Z', 'long')).toBe('December 31, 2025');
    });

    it('should default to medium format', () => {
      const resultWithoutFormat = formatDate('2025-01-15T10:30:00Z');
      const resultWithMedium = formatDate('2025-01-15T10:30:00Z', 'medium');
      expect(resultWithoutFormat).toBe(resultWithMedium);
    });

    it('should handle date-only strings', () => {
      expect(formatDate('2025-01-15', 'short')).toBe('Jan 15');
    });

    it('should return original string for invalid dates', () => {
      const invalidDate = 'not-a-date';
      expect(formatDate(invalidDate, 'short')).toBe(invalidDate);
    });

    // Property-based tests
    it('should always produce a string output for valid dates', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.constantFrom('short', 'medium', 'long'),
          (date, format) => {
            const isoString = date.toISOString();
            const result = formatDate(isoString, format);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce different formats for short vs long', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const isoString = date.toISOString();
            const shortFormat = formatDate(isoString, 'short');
            const longFormat = formatDate(isoString, 'long');
            // Long format should be longer than short format
            expect(longFormat.length).toBeGreaterThanOrEqual(shortFormat.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('formatDateForChart', () => {
    // Unit tests for specific examples
    it('should format 7-day range with day of week', () => {
      expect(formatDateForChart('2025-01-13T00:00:00Z', 7)).toBe('Mon');
      expect(formatDateForChart('2025-01-14T00:00:00Z', 7)).toBe('Tue');
      expect(formatDateForChart('2025-01-15T00:00:00Z', 7)).toBe('Wed');
    });

    it('should format 30-day range with month and day', () => {
      expect(formatDateForChart('2025-01-15T00:00:00Z', 30)).toBe('Jan 15');
      expect(formatDateForChart('2025-12-31T00:00:00Z', 30)).toBe('Dec 31');
    });

    it('should format 90-day range with month and day', () => {
      expect(formatDateForChart('2025-01-15T00:00:00Z', 90)).toBe('Jan 15');
      expect(formatDateForChart('2025-03-20T00:00:00Z', 90)).toBe('Mar 20');
    });

    it('should return original string for invalid dates', () => {
      const invalidDate = 'not-a-date';
      expect(formatDateForChart(invalidDate, 7)).toBe(invalidDate);
    });

    // Property-based tests
    it('should produce different formats for different ranges', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const isoString = date.toISOString();
            const weekFormat = formatDateForChart(isoString, 7);
            const monthFormat = formatDateForChart(isoString, 30);
            
            // Week format should be shorter (just day name like "Mon")
            // Month format should contain month abbreviation
            expect(weekFormat.length).toBeLessThanOrEqual(3); // "Mon", "Tue", etc.
            expect(monthFormat).toMatch(/[A-Z][a-z]{2} \d{1,2}/); // "Jan 15" pattern
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all valid range values', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.constantFrom(7, 30, 90),
          (date, range) => {
            const isoString = date.toISOString();
            const result = formatDateForChart(isoString, range);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('countUniqueSources', () => {
    // Helper function to create a minimal listing object for testing
    const createListing = (source: string, id: string = 'test-id'): Listing => ({
      id,
      productName: 'Test Product',
      source,
      sourceUrl: 'https://example.com',
      price: 10000,
      currency: 'USD',
      rating: 4.5,
      reviewCount: 100,
      category: 'Electronics',
      compositeScore: 80,
      fetchedAt: '2025-01-15T10:30:00Z',
    });

    // Unit tests for specific examples
    it('should return 0 for empty array', () => {
      expect(countUniqueSources([])).toBe(0);
    });

    it('should return 1 for single listing', () => {
      const listings = [createListing('Amazon')];
      expect(countUniqueSources(listings)).toBe(1);
    });

    it('should return 1 for multiple listings from same source', () => {
      const listings = [
        createListing('Amazon', 'id1'),
        createListing('Amazon', 'id2'),
        createListing('Amazon', 'id3'),
      ];
      expect(countUniqueSources(listings)).toBe(1);
    });

    it('should return correct count for multiple distinct sources', () => {
      const listings = [
        createListing('Amazon', 'id1'),
        createListing('eBay', 'id2'),
        createListing('Walmart', 'id3'),
      ];
      expect(countUniqueSources(listings)).toBe(3);
    });

    it('should count distinct sources correctly with duplicates', () => {
      const listings = [
        createListing('Amazon', 'id1'),
        createListing('eBay', 'id2'),
        createListing('Amazon', 'id3'),
        createListing('Walmart', 'id4'),
        createListing('eBay', 'id5'),
        createListing('Amazon', 'id6'),
      ];
      expect(countUniqueSources(listings)).toBe(3);
    });

    it('should handle sources with different casing as distinct', () => {
      const listings = [
        createListing('Amazon', 'id1'),
        createListing('amazon', 'id2'),
        createListing('AMAZON', 'id3'),
      ];
      // Case-sensitive comparison: all three are different sources
      expect(countUniqueSources(listings)).toBe(3);
    });

    // Property-based tests
    describe('Property 10: Source Count Accuracy', () => {
      it('should count distinct sources equal to unique source field values', () => {
        /**
         * **Validates: Requirements 4.4**
         * 
         * Property: For any array of Listings, the count of distinct sources
         * SHALL equal the number of unique source field values across all
         * Listings in the array.
         */
        fc.assert(
          fc.property(
            // Generator: array of listings with various sources
            fc.array(
              fc.record({
                source: fc.constantFrom('Amazon', 'eBay', 'Walmart', 'BestBuy', 'Target'),
                id: fc.string(),
              }),
              { minLength: 0, maxLength: 50 }
            ),
            (listingData) => {
              // Create full listing objects from the generated data
              const listings: Listing[] = listingData.map((data) =>
                createListing(data.source, data.id)
              );

              // Count using our function
              const count = countUniqueSources(listings);

              // Calculate expected count using Set
              const expectedCount = new Set(listingData.map((d) => d.source)).size;

              // Property: Count must equal the number of unique sources
              expect(count).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return 0 for any empty array', () => {
        /**
         * **Validates: Requirements 4.4**
         * 
         * Property: For any empty array of Listings, the count of distinct
         * sources SHALL equal 0.
         */
        expect(countUniqueSources([])).toBe(0);
      });

      it('should return count <= array length', () => {
        /**
         * **Validates: Requirements 4.4**
         * 
         * Property: For any array of N Listings, the count of distinct sources
         * SHALL be less than or equal to N (since multiple listings can share
         * the same source).
         */
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                source: fc.string({ minLength: 1, maxLength: 20 }),
                id: fc.string(),
              }),
              { minLength: 1, maxLength: 50 }
            ),
            (listingData) => {
              const listings: Listing[] = listingData.map((data) =>
                createListing(data.source, data.id)
              );

              const count = countUniqueSources(listings);

              // Property: Count can never exceed array length
              expect(count).toBeLessThanOrEqual(listings.length);
              expect(count).toBeGreaterThan(0); // Since array is non-empty
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return array length when all sources are unique', () => {
        /**
         * **Validates: Requirements 4.4**
         * 
         * Property: For any array of N Listings where all source values are
         * unique, the count SHALL equal N.
         */
        fc.assert(
          fc.property(
            fc.uniqueArray(fc.string({ minLength: 1, maxLength: 20 }), {
              minLength: 1,
              maxLength: 20,
            }),
            (uniqueSources) => {
              const listings: Listing[] = uniqueSources.map((source, idx) =>
                createListing(source, `id-${idx}`)
              );

              const count = countUniqueSources(listings);

              // Property: When all sources are unique, count equals array length
              expect(count).toBe(listings.length);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return 1 when all listings have the same source', () => {
        /**
         * **Validates: Requirements 4.4**
         * 
         * Property: For any non-empty array of Listings where all source
         * values are identical, the count SHALL equal 1.
         */
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.integer({ min: 1, max: 50 }),
            (source, arrayLength) => {
              const listings: Listing[] = Array.from({ length: arrayLength }, (_, idx) =>
                createListing(source, `id-${idx}`)
              );

              const count = countUniqueSources(listings);

              // Property: When all sources are the same, count is 1
              expect(count).toBe(1);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
