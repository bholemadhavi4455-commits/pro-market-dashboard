# Frontend Testing Setup

## Overview

The frontend uses **Vitest** as the test runner (optimized for Vite projects) with **React Testing Library** for component testing.

## Testing Stack

- **Test Runner**: Vitest (fast, Vite-native test runner)
- **Component Testing**: React Testing Library + @testing-library/jest-dom
- **Property-Based Testing**: fast-check
- **Coverage**: Vitest Coverage (v8 provider)
- **Test Environment**: jsdom

## Coverage Targets

- **Target**: ≥80% coverage (lines, functions, branches, statements)
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

# Run tests with UI interface
npm run test:ui
```

## Test File Conventions

- Test files: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
- Place tests near the components they test
- Use descriptive test names that explain behavior

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should return expected value', () => {
    expect(myFunction(input)).toBe(expected);
  });
});
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Property-Based Test Example

```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';

describe('Property: Commutative Addition', () => {
  it('should satisfy a + b = b + a', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      }),
      { numRuns: 100 }
    );
  });
});
```

## Configuration Files

- `vite.config.ts` - Contains Vitest configuration
- `src/test/setup.ts` - Test environment setup (runs before each test)
- `tsconfig.json` - TypeScript configuration with test types

## Notes

- Tests run in jsdom environment to simulate browser APIs
- Coverage thresholds enforce 80% minimum coverage
- Global test APIs (describe, it, expect) are available without imports
