# Test Architecture Overview

## Project Testing Structure

```
PRO MARKET DASHBOARD/
│
├── backend/                    # Backend Testing (Jest)
│   ├── src/
│   │   ├── services/
│   │   │   ├── CacheManager.ts
│   │   │   └── CacheManager.test.ts       ← Unit tests
│   │   ├── routes/
│   │   │   └── api.test.ts                ← Integration tests
│   │   └── models/
│   │       └── Listing.test.ts            ← Property tests
│   │
│   ├── jest.config.js          # Jest configuration
│   ├── package.json            # Test scripts
│   ├── coverage/               # Generated coverage reports
│   └── TEST_SETUP.md          # Backend testing guide
│
└── frontend/                   # Frontend Testing (Vitest)
    ├── src/
    │   ├── components/
    │   │   ├── SearchBar.tsx
    │   │   └── SearchBar.test.tsx         ← Component tests
    │   ├── utils/
    │   │   ├── validation.ts
    │   │   └── validation.test.ts         ← Unit tests
    │   └── test/
    │       ├── setup.ts                   ← Test environment setup
    │       └── example.test.ts            ← Example test
    │
    ├── vite.config.ts          # Vitest configuration
    ├── package.json            # Test scripts
    ├── coverage/               # Generated coverage reports
    └── TEST_SETUP.md          # Frontend testing guide
```

## Test Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TEST EXECUTION FLOW                       │
└─────────────────────────────────────────────────────────────┘

Developer runs test command
         │
         ├── Backend: npm test (Jest)
         │   │
         │   ├── Load jest.config.js
         │   ├── Find *.test.ts files
         │   ├── Run tests in Node environment
         │   ├── Collect coverage with Istanbul
         │   ├── Check coverage thresholds (≥85%)
         │   └── Generate reports (text, HTML, LCOV)
         │
         └── Frontend: npm test (Vitest)
             │
             ├── Load vite.config.ts
             ├── Run src/test/setup.ts
             ├── Find *.test.ts(x) files
             ├── Run tests in jsdom environment
             ├── Collect coverage with v8
             ├── Check coverage thresholds (≥80%)
             └── Generate reports (text, HTML, LCOV)
```

## Test Types Matrix

| Test Type          | Backend (Jest) | Frontend (Vitest) | Purpose                    |
|--------------------|----------------|-------------------|----------------------------|
| Unit Tests         | ✅ Yes         | ✅ Yes            | Test isolated functions    |
| Component Tests    | ❌ No          | ✅ Yes            | Test React components      |
| Integration Tests  | ✅ Yes         | ✅ Yes            | Test module interactions   |
| Property Tests     | ✅ Yes         | ✅ Yes            | Test universal properties  |
| API Tests          | ✅ Yes         | ❌ No             | Test REST endpoints        |
| E2E Tests          | ❌ No          | ❌ No             | (Future: Playwright/Cypress)|

## Coverage Collection

```
┌──────────────────────────────────────────────────────────────┐
│                      COVERAGE WORKFLOW                        │
└──────────────────────────────────────────────────────────────┘

Test execution
      │
      ├── Instrument code (inject tracking)
      ├── Run all tests
      ├── Collect coverage data
      │   ├── Lines executed
      │   ├── Functions called
      │   ├── Branches taken
      │   └── Statements run
      │
      ├── Calculate percentages
      ├── Compare against thresholds
      │   ├── Backend: ≥85% all metrics
      │   └── Frontend: ≥80% all metrics
      │
      └── Generate reports
          ├── Text (console output)
          ├── HTML (browser viewing)
          ├── LCOV (CI integration)
          └── JSON (programmatic access)
```

## Testing Libraries Stack

### Backend Stack
```
┌─────────────────────────────────────┐
│           Backend Stack             │
├─────────────────────────────────────┤
│  fast-check  (Property Testing)     │
├─────────────────────────────────────┤
│  @types/jest (Type Definitions)     │
├─────────────────────────────────────┤
│  ts-jest     (TypeScript Support)   │
├─────────────────────────────────────┤
│  Jest        (Test Runner)          │
├─────────────────────────────────────┤
│  Node.js     (Runtime)              │
└─────────────────────────────────────┘
```

### Frontend Stack
```
┌─────────────────────────────────────┐
│          Frontend Stack             │
├─────────────────────────────────────┤
│  fast-check  (Property Testing)     │
├─────────────────────────────────────┤
│  @testing-library/user-event        │
│  @testing-library/jest-dom          │
│  @testing-library/react             │
│  (Component Testing)                │
├─────────────────────────────────────┤
│  jsdom       (Browser Simulation)   │
├─────────────────────────────────────┤
│  Vitest      (Test Runner)          │
├─────────────────────────────────────┤
│  Vite        (Build Tool)           │
└─────────────────────────────────────┘
```

## Test Configuration Files

### Backend Configuration Chain
```
package.json
    ↓ (defines "test" script)
jest.config.js
    ↓ (configures Jest + coverage)
tsconfig.json
    ↓ (TypeScript compilation)
Test Files (*.test.ts)
```

### Frontend Configuration Chain
```
package.json
    ↓ (defines "test" script)
vite.config.ts
    ↓ (configures Vitest + coverage)
src/test/setup.ts
    ↓ (test environment setup)
tsconfig.json
    ↓ (TypeScript compilation)
Test Files (*.test.ts, *.test.tsx)
```

## CI/CD Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE                            │
└─────────────────────────────────────────────────────────────┘

1. Code Push
      ↓
2. Install Dependencies
      ├── cd backend && npm install
      └── cd frontend && npm install
      ↓
3. Run Linters
      ├── npm run lint (backend)
      └── npm run lint (frontend)
      ↓
4. Run Tests with Coverage
      ├── npm run test:coverage (backend)
      └── npm run test:coverage (frontend)
      ↓
5. Check Coverage Thresholds
      ├── Backend ≥85%? (Pass/Fail)
      └── Frontend ≥80%? (Pass/Fail)
      ↓
6. Upload Coverage Reports
      └── (Codecov, Coveralls, etc.)
      ↓
7. Build Application
      ├── npm run build (backend)
      └── npm run build (frontend)
      ↓
8. Deploy (if all pass)
```

## Quick Command Reference

| Action                  | Backend Command           | Frontend Command          |
|-------------------------|---------------------------|---------------------------|
| Run tests               | `npm test`                | `npm test`                |
| Watch mode              | `npm run test:watch`      | `npm run test:watch`      |
| Coverage report         | `npm run test:coverage`   | `npm run test:coverage`   |
| Visual UI               | N/A                       | `npm run test:ui`         |
| Single test file        | `npm test -- file.test.ts`| `npm test file.test.ts`   |
| Update snapshots        | `npm test -- -u`          | `npm test -- -u`          |

## Best Practices

### Test Organization
✅ **DO**: Place tests next to source files  
✅ **DO**: Use descriptive test names  
✅ **DO**: Group related tests with `describe`  
✅ **DO**: Use `it` or `test` for individual tests  

### Coverage
✅ **DO**: Aim for 100% of critical paths  
✅ **DO**: Test edge cases and error handling  
❌ **DON'T**: Test for coverage alone  
❌ **DON'T**: Skip tests to meet deadlines  

### Property Testing
✅ **DO**: Use for algorithms and data transformations  
✅ **DO**: Run minimum 100 iterations  
✅ **DO**: Test universal properties  
❌ **DON'T**: Use for UI rendering  

### Component Testing
✅ **DO**: Test user interactions  
✅ **DO**: Test conditional rendering  
✅ **DO**: Use semantic queries (getByRole)  
❌ **DON'T**: Test implementation details  

## Resources

- 📖 [Full Testing Guide](./TESTING.md)
- 🔧 [Backend Setup](./backend/TEST_SETUP.md)
- ⚛️ [Frontend Setup](./frontend/TEST_SETUP.md)
- 🚀 [Quick Commands](./TEST_COMMANDS_QUICK_REF.md)
