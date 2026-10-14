# Property-Based Testing Infrastructure

This directory contains the property-based testing (PBT) infrastructure for the PRO Market Dashboard backend, using the [fast-check](https://github.com/dubzzz/fast-check) library.

## Overview

Property-based testing validates universal properties that should hold true for all valid inputs, rather than testing specific examples. This approach catches edge cases that example-based tests might miss.

## Configuration

### Minimum Iterations

All property tests are configured to run **at least 100 iterations** per test, as specified in task 22.1. This is enforced through the `pbtConfig` object in `generators.ts`.

### Test Tags for Traceability

Each property test includes a comment linking it to the requirements it validates:

```typescript
// **Validates: Requirements 1.3, 4.1**
```

This enables traceability from tests back to acceptance criteria in the requirements document.

## Test Generators (Arbitraries)

The `generators.ts` file provides the following arbitraries:

### Core Data Generators

| Generator | Description | Validates |
|-----------|-------------|-----------|
| `arbListing()` | Generates valid Listing objects with all fields conforming to validation rules | Requirements 4.1, 6.1 |
| `arbReview()` | Generates valid Review objects | Requirements 6.1 |
| `arbListingArray(min, max)` | Generates arrays of Listings with configurable size | Used in aggregation tests |
| `arbReviewArray(min, max)` | Generates arrays of Reviews | Used in review tests |

### Specialized Generators

| Generator | Description | Use Case |
|-----------|-------------|----------|
| `arbWhitespaceString()` | Generates strings with only whitespace (spaces, tabs, newlines) or empty strings | Property 2: Input validation |
| `arbListingsWithDuplicates()` | Generates Listings with intentional duplicates based on (productName, source) | Property 5: Deduplication |
| `arbCrossSourceListings()` | Generates same product from multiple sources | Property 9: Cross-source separation |
| `arbReviewTextForTruncation()` | Generates text of varying lengths (<200, =200, >200 chars) | Property 12: Text truncation |
| `arbStarRating()` | Generates ratings in [0.0, 5.0] with one decimal precision | Property 11: Star rendering |

## Usage Examples

### Basic Property Test

```typescript
import * as fc from 'fast-check';
import { arbListing, pbtConfig } from './test/generators';

test('Property 1: UI Rendering Completeness', () => {
  // **Validates: Requirements 4.1, 6.1**
  fc.assert(
    fc.property(arbListing(), (listing) => {
      const card = renderPriceCard(listing);
      
      expect(card).toContain(listing.productName);
      expect(card).toContain(listing.source);
      expect(card).toContain(listing.price.toString());
      expect(card).toContain(listing.rating.toString());
      expect(card).toContain(listing.reviewCount.toString());
    }),
    pbtConfig
  );
});
```

### Custom Configuration

```typescript
import { pbtConfig } from './test/generators';

// Override default config for specific tests
fc.assert(
  fc.property(arbListing(), (listing) => {
    // test logic
  }),
  {
    ...pbtConfig,
    numRuns: 500, // More iterations for critical properties
    seed: 42, // Reproducible test with fixed seed
  }
);
```

### Using the Helper Function

```typescript
import { runPropertyTest, arbWhitespaceString } from './test/generators';

describe('Input validation', () => {
  runPropertyTest(
    'rejects all whitespace strings',
    'Requirements 1.3',
    fc.property(arbWhitespaceString(), (input) => {
      expect(validateSearchInput(input)).toBe(false);
    })
  );
});
```

## Validation Rules

All generators enforce the following constraints from the data models:

### Listing Constraints
- `id`: Non-empty, format `{source}_{productId}`
- `productName`: 1-200 characters
- `price`: Positive integer
- `rating`: 0.0 ≤ rating ≤ 5.0, one decimal place
- `reviewCount`: Non-negative integer
- `category`: One of: Electronics, Books, Clothing, Home & Kitchen, Sports
- `compositeScore`: 0 ≤ score ≤ 100
- `fetchedAt`: Valid ISO 8601 timestamp

### Review Constraints
- `author`: Non-empty string
- `rating`: Integer 1-5
- `date`: ISO date format (YYYY-MM-DD)
- `verified`: Boolean
- `sourceReviewUrl`: Valid URL

## Running Tests

```bash
# Run all tests including property tests
npm test

# Run only property tests
npm test -- generators.test.ts

# Run with coverage
npm test -- --coverage

# Run with verbose output
npm test -- --verbose
```

## Property Tests Roadmap

The following properties are defined in the design document and should be implemented using these generators:

1. ✅ **Property 1**: UI Rendering Completeness - Task 2.2
2. ✅ **Property 2**: Input Validation Rejects Whitespace - Task 11.3
3. **Property 3**: Listing Count Preservation - Task 13.9
4. **Property 4**: Multi-Source Aggregation Completeness - Task 6.3
5. **Property 5**: Deduplication by Name and Source - Task 7.4
6. **Property 6**: CompositeScore Descending Sort - Task 3.5
7. **Property 7**: Category Filtering Correctness - Task 13.5
8. **Property 8**: Lowest Price Identification - Task 13.7
9. **Property 9**: Cross-Source Product Separation - Task 15.8
10. **Property 10**: Source Count Accuracy - Task 19.1
11. **Property 11**: Star Rating Rendering - Task 15.3
12. **Property 12**: Review Text Truncation - Task 15.6
13. **Property 13**: BestPick Selection Algorithm - Task 3.4
14. **Property 14**: Client-Side Sorting Correctness - Task 13.3
15. **Property 15**: Cache Hit Behavior - Task 3.2
16. **Property 16**: Price History Temporal Deduplication - Task 5.3

## Best Practices

1. **Always use `pbtConfig`** to ensure minimum 100 iterations
2. **Add requirement tags** as comments for traceability
3. **Test one property per test** - keep tests focused
4. **Use descriptive test names** that explain what property is being validated
5. **Leverage specialized generators** rather than creating custom ones
6. **Check counterexamples** when tests fail - they reveal edge cases
7. **Consider shrinking** - fast-check automatically shrinks failing inputs to minimal counterexamples

## Troubleshooting

### Test Failures

When a property test fails, fast-check provides:
- The **counterexample** (specific input that violated the property)
- A **shrunk version** (minimal input that still fails)
- The **seed** (for reproducing the exact failure)

Example failure output:
```
Property failed after 42 tests
{ seed: 123456789, path: "42:0", endOnFailure: true }
Counterexample: [{ id: "Amazon_abc123", productName: "", ... }]
```

To reproduce:
```typescript
fc.assert(property, { ...pbtConfig, seed: 123456789 });
```

### Common Issues

1. **Generator produces invalid data**: Check constraints in `generators.ts`
2. **Tests are slow**: Reduce `numRuns` temporarily during development
3. **Flaky tests**: Use fixed seed to reproduce intermittent failures
4. **TypeScript errors**: Ensure `@types/jest` and fast-check types are installed

## Additional Resources

- [fast-check documentation](https://github.com/dubzzz/fast-check/tree/main/documentation)
- [Property-based testing introduction](https://fsharpforfunandprofit.com/posts/property-based-testing/)
- [Design document](../../.kiro/specs/pro-market-dashboard/design.md) - Correctness Properties section
- [Requirements document](../../.kiro/specs/pro-market-dashboard/requirements.md)
