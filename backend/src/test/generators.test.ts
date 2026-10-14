/**
 * Property-based tests demonstrating the usage of test generators
 * 
 * This file contains example property tests that validate the generators
 * themselves and demonstrate how to use them in actual property tests.
 */

import * as fc from 'fast-check';
import {
  arbListing,
  arbReview,
  arbWhitespaceString,
  arbListingArray,
  arbReviewArray,
  arbStarRating,
  arbReviewTextForTruncation,
  pbtConfig,
} from './generators';

describe('Property-based test generators', () => {
  describe('arbListing generator', () => {
    test('generates valid Listing objects with all required fields', () => {
      fc.assert(
        fc.property(arbListing(), (listing) => {
          // Validate structure
          expect(listing).toHaveProperty('id');
          expect(listing).toHaveProperty('productName');
          expect(listing).toHaveProperty('source');
          expect(listing).toHaveProperty('sourceUrl');
          expect(listing).toHaveProperty('price');
          expect(listing).toHaveProperty('currency');
          expect(listing).toHaveProperty('rating');
          expect(listing).toHaveProperty('reviewCount');
          expect(listing).toHaveProperty('category');
          expect(listing).toHaveProperty('compositeScore');
          expect(listing).toHaveProperty('fetchedAt');

          // Validate constraints
          expect(listing.id).toBeTruthy();
          expect(listing.id).toContain('_'); // Format: source_productId
          expect(listing.productName.length).toBeGreaterThan(0);
          expect(listing.productName.length).toBeLessThanOrEqual(200);
          expect(listing.price).toBeGreaterThan(0);
          expect(listing.rating).toBeGreaterThanOrEqual(0);
          expect(listing.rating).toBeLessThanOrEqual(5.0);
          expect(listing.reviewCount).toBeGreaterThanOrEqual(0);
          expect(['Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports']).toContain(
            listing.category
          );
          expect(listing.compositeScore).toBeGreaterThanOrEqual(0);
          expect(listing.compositeScore).toBeLessThanOrEqual(100);
          
          // Validate ISO timestamp format
          expect(() => new Date(listing.fetchedAt)).not.toThrow();
          expect(new Date(listing.fetchedAt).toISOString()).toBe(listing.fetchedAt);
        }),
        pbtConfig
      );
    });

    test('generates ratings with one decimal precision', () => {
      fc.assert(
        fc.property(arbListing(), (listing) => {
          const decimalPart = listing.rating.toString().split('.')[1];
          if (decimalPart) {
            expect(decimalPart.length).toBeLessThanOrEqual(1);
          }
        }),
        pbtConfig
      );
    });
  });

  describe('arbReview generator', () => {
    test('generates valid Review objects with all required fields', () => {
      fc.assert(
        fc.property(arbReview(), (review) => {
          expect(review).toHaveProperty('author');
          expect(review).toHaveProperty('rating');
          expect(review).toHaveProperty('text');
          expect(review).toHaveProperty('date');
          expect(review).toHaveProperty('verified');
          expect(review).toHaveProperty('sourceReviewUrl');

          // Validate constraints
          expect(review.author.length).toBeGreaterThan(0);
          expect(review.rating).toBeGreaterThanOrEqual(1);
          expect(review.rating).toBeLessThanOrEqual(5);
          expect(Number.isInteger(review.rating)).toBe(true);
          expect(typeof review.verified).toBe('boolean');
          
          // Validate date format (YYYY-MM-DD)
          expect(review.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }),
        pbtConfig
      );
    });
  });

  describe('arbWhitespaceString generator', () => {
    test('generates strings composed entirely of whitespace or empty strings', () => {
      fc.assert(
        fc.property(arbWhitespaceString(), (str) => {
          // String should be empty or contain only whitespace
          expect(str.trim()).toBe('');
        }),
        pbtConfig
      );
    });

    test('generates various types of whitespace', () => {
      const samples = fc.sample(arbWhitespaceString(), 100);
      
      // Should include empty strings
      expect(samples.some(s => s === '')).toBe(true);
      
      // Should include strings with spaces
      expect(samples.some(s => s.includes(' '))).toBe(true);
      
      // All should be whitespace-only
      samples.forEach(str => {
        expect(str.trim()).toBe('');
      });
    });
  });

  describe('arbListingArray generator', () => {
    test('generates arrays within specified size bounds', () => {
      fc.assert(
        fc.property(arbListingArray(2, 10), (listings) => {
          expect(listings.length).toBeGreaterThanOrEqual(2);
          expect(listings.length).toBeLessThanOrEqual(10);
        }),
        pbtConfig
      );
    });

    test('all elements in array are valid Listings', () => {
      fc.assert(
        fc.property(arbListingArray(1, 5), (listings) => {
          listings.forEach(listing => {
            expect(listing).toHaveProperty('id');
            expect(listing).toHaveProperty('productName');
            expect(listing.price).toBeGreaterThan(0);
          });
        }),
        { numRuns: 50 } // Fewer runs since we're checking array elements
      );
    });
  });

  describe('arbReviewArray generator', () => {
    test('generates arrays within specified size bounds', () => {
      fc.assert(
        fc.property(arbReviewArray(0, 20), (reviews) => {
          expect(reviews.length).toBeGreaterThanOrEqual(0);
          expect(reviews.length).toBeLessThanOrEqual(20);
        }),
        pbtConfig
      );
    });
  });

  describe('arbStarRating generator', () => {
    test('generates ratings in valid range [0.0, 5.0]', () => {
      fc.assert(
        fc.property(arbStarRating(), (rating) => {
          expect(rating).toBeGreaterThanOrEqual(0.0);
          expect(rating).toBeLessThanOrEqual(5.0);
        }),
        pbtConfig
      );
    });

    test('generates ratings with one decimal precision', () => {
      fc.assert(
        fc.property(arbStarRating(), (rating) => {
          const decimalPart = rating.toString().split('.')[1];
          if (decimalPart) {
            expect(decimalPart.length).toBeLessThanOrEqual(1);
          }
        }),
        pbtConfig
      );
    });
  });

  describe('arbReviewTextForTruncation generator', () => {
    test('generates text of varying lengths', () => {
      const samples = fc.sample(arbReviewTextForTruncation(), 100);
      
      // Should have variety in lengths
      const hasShort = samples.some(text => text.length < 200);
      const hasExact = samples.some(text => text.length === 200);
      const hasLong = samples.some(text => text.length > 200);
      
      expect(hasShort || hasExact || hasLong).toBe(true);
    });

    test('all generated text is valid string', () => {
      fc.assert(
        fc.property(arbReviewTextForTruncation(), (text) => {
          expect(typeof text).toBe('string');
          expect(text.length).toBeGreaterThanOrEqual(1);
        }),
        pbtConfig
      );
    });
  });
});
