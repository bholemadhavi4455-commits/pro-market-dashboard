# Test Scripts Verification - Task 22.2

## Backend Test Scripts (Jest)

All scripts verified in `backend/package.json`:

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:verbose": "jest --verbose"
}
```

### Usage Examples

```bash
cd backend

# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests and generate coverage report
npm run test:coverage

# Run tests with detailed output
npm run test:verbose
```

### Expected Outputs

**`npm test`**:
- Runs all `*.test.ts` and `*.spec.ts` files
- Shows pass/fail summary
- Exit code 0 on success, 1 on failure

**`npm run test:coverage`**:
- Runs all tests
- Generates coverage report in `coverage/` directory
- Shows coverage percentage in terminal
- **FAILS if coverage < 85%** (enforced threshold)
- Creates reports: `coverage/index.html`, `coverage/lcov.info`

**`npm run test:watch`**:
- Starts Jest in watch mode
- Automatically reruns tests on file changes
- Interactive mode with filtering options
- Press 'q' to quit

**`npm run test:verbose`**:
- Shows individual test results
- Displays full test hierarchy
- Useful for debugging

---

## Frontend Test Scripts (Vitest)

All scripts verified in `frontend/package.json`:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage"
}
```

### Usage Examples

```bash
cd frontend

# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with visual UI
npm run test:ui

# Run tests and generate coverage report
npm run test:coverage
```

### Expected Outputs

**`npm test`**:
- Runs all `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx` files
- Shows pass/fail summary
- Exit code 0 on success, 1 on failure

**`npm run test:coverage`**:
- Runs all tests
- Generates coverage report in `coverage/` directory
- Shows coverage percentage in terminal
- **FAILS if coverage < 80%** (enforced threshold)
- Creates reports: `coverage/index.html`, `coverage/lcov.info`

**`npm run test:watch`**:
- Starts Vitest in watch mode
- Automatically reruns tests on file changes
- Instant feedback (HMR-like speed)
- Press 'q' to quit

**`npm run test:ui`**:
- Opens visual test UI in browser
- Shows test hierarchy graphically
- Click tests to filter and rerun
- View code and test side-by-side

---

## Coverage Report Access

After running coverage tests:

### Backend
```bash
# Generate coverage
cd backend
npm run test:coverage

# View HTML report
open coverage/index.html           # macOS
start coverage/index.html          # Windows
xdg-open coverage/index.html       # Linux
```

### Frontend
```bash
# Generate coverage
cd frontend
npm run test:coverage

# View HTML report
open coverage/index.html           # macOS
start coverage/index.html          # Windows
xdg-open coverage/index.html       # Linux
```

---

## Coverage Thresholds

### Backend (85% minimum)
```javascript
coverageThresholds: {
  global: {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
}
```

Tests will **FAIL** if any metric drops below 85%.

### Frontend (80% minimum)
```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

Tests will **FAIL** if any metric drops below 80%.

---

## Test File Examples

### Backend Test (Jest)
Location: `backend/src/services/PersistenceService.test.ts`

```typescript
import { PersistenceService } from './PersistenceService';

describe('PersistenceService', () => {
  let service: PersistenceService;

  beforeEach(async () => {
    service = new PersistenceService(testDbPath);
    await service.initialize();
  });

  it('should store a new price snapshot', async () => {
    await service.storePriceSnapshot('id', 24999, new Date());
    const history = await service.getPriceHistory('id', 30);
    expect(history).toHaveLength(1);
  });
});
```

### Frontend Test (Vitest + React Testing Library)
Location: `frontend/src/test/ComponentExample.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('ExampleButton', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<ExampleButton onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## CI/CD Integration

### Package.json Scripts for CI

Both backend and frontend can be run in CI with:

```bash
npm test              # Exit code 0 = pass, 1 = fail
npm run test:coverage # Enforces coverage thresholds
```

### Coverage Report Formats

Multiple formats generated for different use cases:

- **text**: Terminal output (for CI logs)
- **html**: Human-readable report (for developers)
- **lcov**: Standard format (for Codecov, Coveralls)
- **json**: Programmatic access (for custom tooling)
- **json-summary**: Quick stats (for badges)

### Example CI Workflow (GitHub Actions)

```yaml
- name: Backend Tests
  run: |
    cd backend
    npm install
    npm run test:coverage
    
- name: Frontend Tests
  run: |
    cd frontend
    npm install
    npm run test:coverage
```

---

## Verification Status

✅ **All test scripts verified in package.json**  
✅ **Backend scripts use Jest**  
✅ **Frontend scripts use Vitest**  
✅ **Coverage thresholds configured and enforced**  
✅ **Multiple coverage report formats enabled**  
✅ **Watch modes available for development**  
✅ **UI mode available for frontend (Vitest)**  
✅ **Test examples exist and demonstrate usage**  
✅ **React Testing Library configured for components**

---

## Quick Reference

| Task | Backend Command | Frontend Command |
|------|-----------------|------------------|
| Run tests | `npm test` | `npm test` |
| Run with coverage | `npm run test:coverage` | `npm run test:coverage` |
| Watch mode | `npm run test:watch` | `npm run test:watch` |
| Verbose output | `npm run test:verbose` | N/A |
| Visual UI | N/A | `npm run test:ui` |

---

## Task 22.2 Completion

All requirements satisfied:

1. ✅ Jest configured for backend
2. ✅ Vitest (Jest-compatible) configured for frontend
3. ✅ React Testing Library set up with examples
4. ✅ Coverage reporting configured with ≥80% threshold
5. ✅ Test scripts added to both package.json files

**Date**: 2025-01-15  
**Status**: COMPLETE
