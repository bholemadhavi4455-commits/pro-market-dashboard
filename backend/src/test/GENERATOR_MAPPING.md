# Generator to Property Mapping

This document maps test generators to the correctness properties they support.

## Property → Generator Mapping

| Property | Description | Primary Generator(s) | Task |
|----------|-------------|---------------------|------|
| **Property 1** | UI Rendering Completeness | `arbListing()` | 2.2 |
| **Property 2** | Input Validation Rejects Whitespace | `arbWhitespaceString()` | 11.3 |
| **Property 3** | Listing Count Preservation | `arbListingArray()` | 13.9 |
| **Property 4** | Multi-Source Aggregation Completeness | `arbListingArray()` | 6.3 |
| **Property 5** | Deduplication by Name and Source | `arbListingsWithDuplicates()` | 7.4 |
| **Property 6** | CompositeScore Descending Sort | `arbListingArray()` | 3.5 |
| **Property 7** | Category Filtering Correctness | `arbListingArray()` | 13.5 |
| **Property 8** | Lowest Price Identification | `arbListingArray()` | 13.7 |
| **Property 9** | Cross-Source Product Separation | `arbCrossSourceListings()` | 15.8 |
| **Property 10** | Source Count Accuracy | `arbListingArray()` | 19.1 |
| **Property 11** | Star Rating Rendering | `arbStarRating()` | 15.3 |
| **Property 12** | Review Text Truncation | `arbReviewTextForTruncation()` | 15.6 |
| **Property 13** | BestPick Selection Algorithm | `arbListingArray()` | 3.4 |
| **Property 14** | Client-Side Sorting Correctness | `arbListingArray()` | 13.3 |
| **Property 15** | Cache Hit Behavior | `arbListing()` | 3.2 |
| **Property 16** | Price History Temporal Deduplication | `arbListing()` | 5.3 |

## Generator Usage Summary

### `arbListing()`
**Purpose**: Generates single valid Listing objects  
**Used in Properties**: 1, 15, 16  
**Use Cases**:
- Testing individual listing rendering
- Cache behavior tests
- Price history recording

**Example**:
```typescript
fc.property(arbListing(), (listing) => {
  // Test single listing behavior
})
```

---

### `arbReview()`
**Purpose**: Generates single valid Review objects  
**Used in Properties**: 12 (indirectly)  
**Use Cases**:
- Review display tests
- Review fetching tests

**Example**:
```typescript
fc.property(arbReview(), (review) => {
  // Test review rendering
})
```

---

### `arbWhitespaceString()`
**Purpose**: Generates whitespace-only or empty strings  
**Used in Properties**: 2  
**Use Cases**:
- Input validation tests
- Search query validation
- Form field validation

**Example**:
```typescript
fc.property(arbWhitespaceString(), (input) => {
  expect(validateInput(input)).toBe(false);
})
```

---

### `arbListingArray(min, max)`
**Purpose**: Generates arrays of Listings  
**Used in Properties**: 3, 4, 6, 7, 8, 10, 13, 14  
**Use Cases**:
- Aggregation tests
- Sorting tests
- Filtering tests
- Count verification

**Example**:
```typescript
fc.property(arbListingArray(2, 10), (listings) => {
  // Test array operations
})
```

---

### `arbReviewArray(min, max)`
**Purpose**: Generates arrays of Reviews  
**Used in Properties**: N/A (support generator)  
**Use Cases**:
- Multiple review display
- Review pagination tests

**Example**:
```typescript
fc.property(arbReviewArray(0, 20), (reviews) => {
  // Test review list rendering
})
```

---

### `arbStarRating()`
**Purpose**: Generates ratings [0.0, 5.0] with one decimal  
**Used in Properties**: 11  
**Use Cases**:
- Star rendering logic
- Rating display tests
- Icon calculation tests

**Example**:
```typescript
fc.property(arbStarRating(), (rating) => {
  const stars = renderStars(rating);
  expect(stars.full + stars.half + stars.empty).toBe(5);
})
```

---

### `arbReviewTextForTruncation()`
**Purpose**: Generates text of varying lengths (<200, =200, >200)  
**Used in Properties**: 12  
**Use Cases**:
- Text truncation tests
- Ellipsis addition tests
- "Read more" link tests

**Example**:
```typescript
fc.property(arbReviewTextForTruncation(), (text) => {
  const displayed = truncateText(text, 200);
  if (text.length > 200) {
    expect(displayed).toContain('...');
  }
})
```

---

### `arbListingsWithDuplicates()`
**Purpose**: Generates Listings with intentional (productName, source) duplicates  
**Used in Properties**: 5  
**Use Cases**:
- Deduplication logic tests
- Most recent entry selection tests
- Timestamp-based resolution tests

**Example**:
```typescript
fc.property(arbListingsWithDuplicates(), (listings) => {
  const deduped = deduplicate(listings);
  // Check no duplicates remain
})
```

---

### `arbCrossSourceListings()`
**Purpose**: Generates same product from multiple sources  
**Used in Properties**: 9  
**Use Cases**:
- Cross-source display tests
- Ensuring separate rendering per source
- Source badge display tests

**Example**:
```typescript
fc.property(arbCrossSourceListings(), (listings) => {
  const cards = renderPriceCards(listings);
  expect(cards.length).toBe(listings.length);
})
```

---

## Configuration

All property tests should use:

```typescript
import { pbtConfig } from './generators';

fc.assert(
  fc.property(...),
  pbtConfig  // Ensures 100 iterations
);
```

## Adding New Generators

When adding new generators:

1. **Define in `generators.ts`**
   ```typescript
   export const arbMyNewType = (): fc.Arbitrary<MyType> => {
     return fc.record({
       // field definitions
     });
   };
   ```

2. **Add validation test in `generators.test.ts`**
   ```typescript
   describe('arbMyNewType generator', () => {
     test('generates valid MyType objects', () => {
       fc.assert(
         fc.property(arbMyNewType(), (obj) => {
           // validation assertions
         }),
         pbtConfig
       );
     });
   });
   ```

3. **Document in this file**
   - Add to usage summary section
   - Map to relevant properties
   - Provide example usage

4. **Add JSDoc with requirements**
   ```typescript
   /**
    * Generator description
    * 
    * **Validates: Requirements X.Y**
    */
   ```

## Quick Reference

### Testing Single Objects
- Listing → `arbListing()`
- Review → `arbReview()`
- Rating → `arbStarRating()`

### Testing Collections
- Multiple Listings → `arbListingArray(min, max)`
- Multiple Reviews → `arbReviewArray(min, max)`

### Testing Edge Cases
- Whitespace inputs → `arbWhitespaceString()`
- Duplicates → `arbListingsWithDuplicates()`
- Cross-source → `arbCrossSourceListings()`
- Text lengths → `arbReviewTextForTruncation()`

### Always Use
- `pbtConfig` for 100 iterations
- `// **Validates: Requirements X.Y**` tags
- Descriptive test names

## Example Test Suite Structure

```typescript
import * as fc from 'fast-check';
import {
  arbListing,
  arbListingArray,
  arbWhitespaceString,
  pbtConfig,
} from './test/generators';

describe('Search functionality', () => {
  describe('Property 2: Input Validation', () => {
    test('rejects all whitespace strings', () => {
      // **Validates: Requirements 1.3**
      fc.assert(
        fc.property(arbWhitespaceString(), (input) => {
          expect(validateInput(input)).toBe(false);
        }),
        pbtConfig
      );
    });
  });

  describe('Property 3: Listing Count Preservation', () => {
    test('renders exactly N cards for N listings', () => {
      // **Validates: Requirements 1.2**
      fc.assert(
        fc.property(arbListingArray(1, 50), (listings) => {
          const cards = renderResults(listings);
          expect(cards.length).toBe(listings.length);
        }),
        pbtConfig
      );
    });
  });
});
```

---

**Last Updated**: Task 22.1 completion  
**Generators**: 9 main generators + helpers  
**Properties Supported**: All 16 properties from design.md
