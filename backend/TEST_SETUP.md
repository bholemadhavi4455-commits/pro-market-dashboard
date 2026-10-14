# Backend Testing Setup

## Overview

The backend uses **Jest** with **ts-jest** for TypeScript support and **fast-check** for property-based testing.

## Testing Stack

- **Test Runner**: Jest
- **TypeScript Support**: ts-jest
- **Property-Based Testing**: fast-check
- **Coverage**: Jest built-in coverage (Istanbul)
- **Test Environment**: Node.js

## Coverage Targets

- **Target**: ≥85% coverage (lines, functions, branches, statements)
- Coverage reports are generated in `coverage/` directory
- Reports available in multiple formats: text, HTML, LCOV, JSON

## Available Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in verbose mode
npm run test:verbose
```

## Test File Conventions

- Test files: `*.test.ts`, `*.spec.ts`
- Place tests near the modules they test
- Use descriptive test names that explain behavior

## Writing Tests

### Unit Test Example

```typescript
describe('CacheManager', () => {
  it('should store and retrieve cached data', () => {
    const cache = new CacheManager();
    cache.set('key', { data: 'value' }, 600);
    expect(cache.get('key')).toEqual({ data: 'value' });
  });
});
```

### Integration Test Example

```typescript
import request from 'supertest';
import app from '../server';

describe('GET /api/search', () => {
  it('should return listings for valid query', async () => {
    const response = await request(app)
      .get('/api/search?q=laptop')
      .expect(200);
    
    expect(response.body.listings).toBeInstanceOf(Array);
  });
});
```

### Property-Based Test Example

```typescript
import * as fc from 'fast-check';

describe('Property: CompositeScore calculation', () => {
  it('should always return score between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.record({
          price: fc.integer({ min: 1, max: 1000000 }),
          rating: fc.float({ min: 0, max: 5 }),
          reviewCount: fc.integer({ min: 0, max: 100000 })
        }),
        (listing) => {
          const score = calculateCompositeScore(listing, [listing]);
          return score >= 0 && score <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Configuration Files

- `jest.config.js` - Jest configuration with coverage thresholds
- `tsconfig.json` - TypeScript configuration

## Coverage Exclusions

The following files are excluded from coverage:
- Test files (`*.test.ts`, `*.spec.ts`)
- Type definitions (`*.d.ts`)
- Server entry point (`src/server.ts`)

## Notes

- Coverage thresholds enforce 85% minimum coverage
- Fast-check is configured with minimum 100 runs per property test
- All async tests should properly handle promises/async-await
