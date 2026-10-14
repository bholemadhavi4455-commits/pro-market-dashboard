# Property-Based Testing Quick Reference

## Task 22.1 Completion Summary

This guide documents the property-based testing infrastructure configured for the PRO Market Dashboard project.

### ✅ Completed Items

1. **Installed fast-check dependency** (v3.15.0)
   - Added to `package.json` devDependencies
   - Latest stable version with full TypeScript support

2. **Created test generators** in `src/test/generators.ts`
   - `arbListing()` - Generates valid Listing objects
   - `arbReview()` - Generates valid Review objects
   - `arbWhitespaceString()` - Generates whitespace-only strings
   - Additional specialized generators for edge cases

3. **Configured 100 minimum iterations** per property test
   - Exported `pbtConfig` object with `numRuns: 100`
   - Applied consistently across all property tests

4. **Added test tags for traceability**
   - Each property links back to requirements
   - Format: `// **Validates: Requirements X.Y**`
   - Documented in README and generators

## Quick Start

### Import and Use

```typescript
import * as fc from 'fast-check';
import { arbListing, arbReview, arbWhitespaceString, pbtConfig } from './test/generators';

test('my property test', () => {
  fc.assert(
    fc.property(arbListing(), (listing) => {
      // Your test assertion
      expect(listing.price).toBeGreaterThan(0);
    }),
    pbtConfig // Always use this for 100 iterations
  );
});
```

### Available Generators

| Generator | Purpose | Example Use Case |
|-----------|---------|------------------|
| `arbListing()` | Valid Listing object | Testing price comparisons, sorting |
| `arbReview()` | Valid Review object | Testing review display, truncation |
| `arbWhitespaceString()` | Whitespace/empty strings | Input validation tests |
| `arbListingArray(min, max)` | Array of Listings | Aggregation, filtering tests |
| `arbReviewArray(min, max)` | Array of Reviews | Review fetching tests |
| `arbStarRating()` | Rating 0.0-5.0 | Star rendering tests |
| `arbReviewTextForTruncation()` | Text of varying lengths | Truncation tests |
| `arbListingsWithDuplicates()` | Listings with duplicates | Deduplication tests |
| `arbCrossSourceListings()` | Same product, different sources | Cross-source separation tests |

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test generators.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Property Test Template

Copy this template for new property tests:

```typescript
import * as fc from 'fast-check';
import { arbListing, pbtConfig } from './test/generators';

describe('Feature name', () => {
  test('Property X: Description', () => {
    // **Validates: Requirements X.Y, X.Z**
    
    fc.assert(
      fc.property(arbListing(), (listing) => {
        // Arrange
        const result = functionUnderTest(listing);
        
        // Assert - the universal property
        expect(result).toSatisfyProperty();
      }),
      pbtConfig
    );
  });
});
```

## Integration with Jest

The Jest configuration (`jest.config.js`) is already set up to:
- Use `ts-jest` preset for TypeScript support
- Run all `*.test.ts` files
- Collect coverage from source files
- Provide verbose output

## Next Steps

The following property tests can now be implemented using these generators:

### Backend Property Tests
- ✅ Task 2.2 - Listing data validation
- Task 3.2 - Cache TTL behavior
- Task 3.4 - CompositeScore calculation
- Task 3.5 - Sorting by CompositeScore
- Task 5.3 - Price history deduplication
- Task 6.3 - Source adapter normalization
- Task 7.4 - Deduplication logic

### Frontend Property Tests
- Task 11.3 - Input validation
- Task 13.3 - Client-side sorting
- Task 13.5 - Category filtering
- Task 13.7 - Lowest price identification
- Task 13.9 - Listing count preservation
- Task 15.3 - Star rating rendering
- Task 15.6 - Review truncation
- Task 15.8 - Cross-source separation
- Task 19.1 - Source count accuracy

## Files Created

```
backend/
├── package.json                    (updated with fast-check)
├── jest.config.js                  (updated with ts-jest globals)
├── PROPERTY_TESTING_GUIDE.md       (this file)
└── src/
    └── test/
        ├── README.md               (detailed documentation)
        ├── generators.ts           (all test generators)
        └── generators.test.ts      (generator validation tests)
```

## Example: Whitespace Validation Test

Here's how to use the whitespace generator for Property 2:

```typescript
import * as fc from 'fast-check';
import { arbWhitespaceString, pbtConfig } from './test/generators';

describe('SearchBar input validation', () => {
  test('Property 2: Input Validation Rejects Whitespace', () => {
    // **Validates: Requirements 1.3**
    
    fc.assert(
      fc.property(arbWhitespaceString(), (input) => {
        const isValid = validateSearchInput(input);
        
        // All whitespace strings should be rejected
        expect(isValid).toBe(false);
      }),
      pbtConfig
    );
  });
});
```

## Troubleshooting

### Node.js/npm not found
If you encounter issues with npm commands:
1. Ensure Node.js is installed
2. Add Node.js to PATH
3. Restart terminal/IDE
4. Run: `node --version` and `npm --version` to verify

### TypeScript errors
If you see TypeScript errors in test files:
1. Ensure `@types/jest` is installed
2. Run: `npm install`
3. Restart TypeScript server in IDE

### Test failures
When property tests fail:
1. Check the counterexample in the output
2. Use the seed to reproduce: `fc.assert(property, { seed: 123456 })`
3. Debug with smaller `numRuns` during development

## Documentation

- Full documentation: `src/test/README.md`
- Design document: `.kiro/specs/pro-market-dashboard/design.md`
- Requirements: `.kiro/specs/pro-market-dashboard/requirements.md`
- fast-check docs: https://github.com/dubzzz/fast-check

---

**Task 22.1 Status**: ✅ Complete

All deliverables have been implemented:
- ✅ fast-check dependency installed
- ✅ Test generators created for Listings, Reviews, whitespace strings
- ✅ 100 minimum iterations configured via pbtConfig
- ✅ Test tags for traceability added to all generators
- ✅ Documentation and examples provided
