/**
 * Property-based test generators using fast-check
 * 
 * This module provides arbitraries (generators) for creating valid test data
 * for property-based testing with fast-check. Each generator creates random
 * instances of data structures that conform to the validation rules defined
 * in the models.
 * 
 * **Property Test Configuration:**
 * - Minimum iterations per property test: 100
 * - Use fc.assert with { numRuns: 100 } or higher for thorough testing
 * 
 * **Test Tags for Traceability:**
 * Each property test should include a comment linking to requirements:
 * Example: // **Validates: Requirements 1.3**
 */

import * as fc from 'fast-check';
import { Listing, Review } from '../models';

/**
 * Valid product categories as defined in the requirements
 */
const VALID_CATEGORIES = [
  'Electronics',
  'Books',
  'Clothing',
  'Home & Kitchen',
  'Sports',
] as const;

/**
 * Valid source identifiers for mock adapters
 */
const VALID_SOURCES = ['Amazon', 'eBay', 'Walmart', 'BestBuy', 'Target'] as const;

/**
 * Valid currency codes (ISO 4217)
 */
const VALID_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY'] as const;

/**
 * Generates a valid Listing object with all required fields.
 * 
 * **Validates: Requirements 4.1, 6.1**
 * 
 * Constraints enforced:
 * - id: Non-empty string, format "{source}_{productId}"
 * - productName: Non-empty, max 200 characters
 * - price: Positive integer
 * - rating: 0.0 ≤ rating ≤ 5.0 (one decimal precision)
 * - reviewCount: Non-negative integer
 * - category: One of predefined valid categories
 * - compositeScore: 0 ≤ score ≤ 100
 * - fetchedAt: Valid ISO 8601 timestamp
 * 
 * @returns {fc.Arbitrary<Listing>} Arbitrary that generates valid Listing objects
 */
export const arbListing = (): fc.Arbitrary<Listing> => {
  return fc.record({
    id: fc
      .tuple(
        fc.constantFrom(...VALID_SOURCES),
        fc.hexaString({ minLength: 6, maxLength: 12 })
      )
      .map(([source, productId]) => `${source}_${productId}`),
    productName: fc.string({ minLength: 1, maxLength: 200 }),
    source: fc.constantFrom(...VALID_SOURCES),
    sourceUrl: fc.webUrl(),
    price: fc.integer({ min: 1, max: 10000000 }), // $0.01 to $100,000 in cents
    currency: fc.constantFrom(...VALID_CURRENCIES),
    rating: fc
      .integer({ min: 0, max: 50 })
      .map((n) => parseFloat((n / 10).toFixed(1))), // 0.0 to 5.0 with one decimal
    reviewCount: fc.integer({ min: 0, max: 50000 }),
    category: fc.constantFrom(...VALID_CATEGORIES),
    compositeScore: fc.float({ min: 0, max: 100, noNaN: true }),
    fetchedAt: fc
      .date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
      .map((d) => d.toISOString()),
    imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
  });
};

/**
 * Generates a valid Review object.
 * 
 * **Validates: Requirements 6.1**
 * 
 * Constraints enforced:
 * - author: Non-empty string
 * - rating: Integer 1-5
 * - text: Can be any length (truncation tested separately)
 * - date: Valid ISO date format (YYYY-MM-DD)
 * - verified: Boolean
 * - sourceReviewUrl: Valid URL
 * 
 * @returns {fc.Arbitrary<Review>} Arbitrary that generates valid Review objects
 */
export const arbReview = (): fc.Arbitrary<Review> => {
  return fc.record({
    author: fc.string({ minLength: 1, maxLength: 50 }),
    rating: fc.integer({ min: 1, max: 5 }),
    text: fc.lorem({ maxCount: 100 }), // Generate realistic review text
    date: fc
      .date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
      .map((d) => d.toISOString().split('T')[0]), // Format as YYYY-MM-DD
    verified: fc.boolean(),
    sourceReviewUrl: fc.webUrl(),
  });
};

/**
 * Generates strings composed entirely of whitespace characters.
 * 
 * **Validates: Requirements 1.3**
 * 
 * This generator creates strings that should be rejected by input validation:
 * - Spaces only
 * - Tabs only
 * - Newlines only
 * - Mixed whitespace combinations
 * - Empty strings
 * 
 * Used for testing Property 2: Input Validation Rejects Whitespace
 * 
 * @returns {fc.Arbitrary<string>} Arbitrary that generates whitespace-only strings
 */
export const arbWhitespaceString = (): fc.Arbitrary<string> => {
  const whitespaceChars = fc.constantFrom(' ', '\t', '\n', '\r');
  
  return fc.oneof(
    // Empty string
    fc.constant(''),
    
    // Single whitespace character repeated
    fc
      .tuple(whitespaceChars, fc.integer({ min: 1, max: 20 }))
      .map(([char, count]) => char.repeat(count)),
    
    // Mixed whitespace characters
    fc
      .array(whitespaceChars, { minLength: 1, maxLength: 50 })
      .map((chars) => chars.join(''))
  );
};

/**
 * Generates an array of Listings with configurable size.
 * 
 * Used for testing aggregation, sorting, and filtering operations.
 * 
 * @param {number} minLength - Minimum number of listings
 * @param {number} maxLength - Maximum number of listings
 * @returns {fc.Arbitrary<Listing[]>} Arbitrary that generates Listing arrays
 */
export const arbListingArray = (
  minLength: number = 0,
  maxLength: number = 20
): fc.Arbitrary<Listing[]> => {
  return fc.array(arbListing(), { minLength, maxLength });
};

/**
 * Generates an array of Reviews with configurable size.
 * 
 * @param {number} minLength - Minimum number of reviews
 * @param {number} maxLength - Maximum number of reviews
 * @returns {fc.Arbitrary<Review[]>} Arbitrary that generates Review arrays
 */
export const arbReviewArray = (
  minLength: number = 0,
  maxLength: number = 20
): fc.Arbitrary<Review[]> => {
  return fc.array(arbReview(), { minLength, maxLength });
};

/**
 * Generates Listings with duplicate (productName, source) pairs for testing deduplication.
 * 
 * **Validates: Requirements 2.4**
 * 
 * Creates an array containing intentional duplicates based on the unique key
 * (productName + source). Used for testing Property 5: Deduplication by Name and Source.
 * 
 * @returns {fc.Arbitrary<Listing[]>} Arbitrary that generates Listings with duplicates
 */
export const arbListingsWithDuplicates = (): fc.Arbitrary<Listing[]> => {
  return fc
    .tuple(
      arbListing(), // Base listing
      fc.integer({ min: 1, max: 5 }), // Number of duplicates
      fc.integer({ min: 1, max: 3600000 }) // Time difference in milliseconds
    )
    .chain(([baseListing, duplicateCount, timeDiff]) => {
      // Create duplicates with same productName and source but different timestamps
      const listings: Listing[] = [baseListing];
      
      for (let i = 0; i < duplicateCount; i++) {
        const baseTime = new Date(baseListing.fetchedAt).getTime();
        const duplicateTime = new Date(baseTime + (i + 1) * timeDiff);
        
        listings.push({
          ...baseListing,
          id: `${baseListing.source}_dup${i}_${Date.now()}`, // Different ID
          price: baseListing.price + fc.sample(fc.integer({ min: -100, max: 100 }), 1)[0], // Slightly different price
          fetchedAt: duplicateTime.toISOString(), // Different timestamp
        });
      }
      
      // Shuffle to ensure duplicates aren't always in order
      return fc.shuffledSubarray(listings, { minLength: listings.length, maxLength: listings.length });
    });
};

/**
 * Generates Listings where multiple have the same productName but different sources.
 * 
 * **Validates: Requirements 4.3**
 * 
 * Used for testing Property 9: Cross-Source Product Separation.
 * Ensures that the same product from different sources is rendered separately.
 * 
 * @returns {fc.Arbitrary<Listing[]>} Arbitrary that generates cross-source listings
 */
export const arbCrossSourceListings = (): fc.Arbitrary<Listing[]> => {
  return fc
    .tuple(
      fc.string({ minLength: 5, maxLength: 50 }), // Product name
      fc.integer({ min: 2, max: 5 }) // Number of sources
    )
    .chain(([productName, sourceCount]) => {
      const sources = fc.sample(fc.constantFrom(...VALID_SOURCES), sourceCount);
      
      return fc.tuple(
        ...sources.map((source) =>
          arbListing().map((listing) => ({
            ...listing,
            productName, // Same product name
            source, // Different source
            id: `${source}_${Date.now()}_${Math.random()}`,
          }))
        )
      );
    })
    .map((listings) => listings);
};

/**
 * Generates review text strings of varying lengths for truncation testing.
 * 
 * **Validates: Requirements 6.5**
 * 
 * Creates text that is:
 * - Exactly 200 characters (boundary case)
 * - Less than 200 characters (should not truncate)
 * - Greater than 200 characters (should truncate with ellipsis)
 * 
 * Used for testing Property 12: Review Text Truncation
 * 
 * @returns {fc.Arbitrary<string>} Arbitrary that generates review text of varying lengths
 */
export const arbReviewTextForTruncation = (): fc.Arbitrary<string> => {
  return fc.oneof(
    // Short text (< 200 chars)
    fc.string({ minLength: 1, maxLength: 199 }),
    
    // Exactly 200 characters
    fc.string({ minLength: 200, maxLength: 200 }),
    
    // Long text (> 200 chars)
    fc.string({ minLength: 201, maxLength: 1000 })
  );
};

/**
 * Generates star ratings in the valid range [0.0, 5.0] with one decimal precision.
 * 
 * **Validates: Requirements 6.4**
 * 
 * Used for testing Property 11: Star Rating Rendering.
 * Ensures star rendering logic works correctly for all valid rating values.
 * 
 * @returns {fc.Arbitrary<number>} Arbitrary that generates valid star ratings
 */
export const arbStarRating = (): fc.Arbitrary<number> => {
  return fc
    .integer({ min: 0, max: 50 })
    .map((n) => parseFloat((n / 10).toFixed(1)));
};

/**
 * Configuration object for property-based tests.
 * 
 * Use this configuration to ensure all property tests run with
 * consistent parameters:
 * 
 * @example
 * fc.assert(
 *   fc.property(arbListing(), (listing) => {
 *     // test assertion
 *   }),
 *   pbtConfig
 * );
 */
export const pbtConfig = {
  numRuns: 100, // Minimum 100 iterations per property test
  verbose: true, // Show detailed output on failure
  seed: undefined, // Allow random seed (set to specific value for reproduction)
};

/**
 * Helper function to run property tests with standard configuration and test tags.
 * 
 * @param {string} testName - Descriptive name for the test
 * @param {string} requirements - Requirements being validated (e.g., "Requirements 1.3, 4.1")
 * @param {fc.IProperty<any>} property - The property to test
 * @param {Partial<fc.Parameters<any>>} config - Optional config overrides
 */
export const runPropertyTest = (
  testName: string,
  requirements: string,
  property: fc.IProperty<any>,
  config: Partial<fc.Parameters<any>> = {}
): void => {
  test(testName, () => {
    // Add requirements tag as metadata
    console.log(`**Validates: ${requirements}**`);
    
    fc.assert(property, {
      ...pbtConfig,
      ...config,
    });
  });
};
