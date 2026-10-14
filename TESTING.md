# PRO Market Dashboard - Testing Guide

This document provides an overview of the testing infrastructure for the PRO Market Dashboard project.

## Project Structure

```
PRO MARKET DASHBOARD/
├── backend/           # Node.js/Express API (Jest)
│   ├── src/
│   ├── jest.config.js
│   └── TEST_SETUP.md
└── frontend/          # React/Vite UI (Vitest)
    ├── src/
    ├── vite.config.ts
    └── TEST_SETUP.md
```

## Quick Start

### Backend Tests

```bash
cd backend
npm install
npm test                # Run all tests
npm run test:coverage   # Run with coverage report
npm run test:watch      # Run in watch mode
```

### Frontend Tests

```bash
cd frontend
npm install
npm test                # Run all tests
npm run test:coverage   # Run with coverage report
npm run test:watch      # Run in watch mode
npm run test:ui         # Run with UI interface
```

## Testing Stack Summary

| Aspect              | Backend                | Frontend               |
|---------------------|------------------------|------------------------|
| Test Runner         | Jest                   | Vitest                 |
| TypeScript Support  | ts-jest                | Native (Vite)          |
| Component Testing   | N/A                    | React Testing Library  |
| Property Testing    | fast-check             | fast-check             |
| Coverage Target     | ≥85%                   | ≥80%                   |
| Test Environment    | Node.js                | jsdom                  |

## Test Types

### 1. Unit Tests
Test individual functions, classes, and modules in isolation.

**Backend Example**: Services, utilities, scoring algorithms  
**Frontend Example**: Utility functions, helpers, validation logic

### 2. Component Tests (Frontend Only)
Test React components rendering and user interactions.

**Example**: SearchBar, PriceCard, Dashboard components

### 3. Integration Tests
Test interaction between multiple modules or API endpoints.

**Backend Example**: API endpoint tests with database  
**Frontend Example**: API client integration

### 4. Property-Based Tests
Test universal properties that should hold for all inputs.

**Backend Example**: CompositeScore always between 0-100  
**Frontend Example**: Star rating always renders 5 stars total

## Coverage Reports

After running tests with coverage, reports are available at:

- **Backend**: `backend/coverage/index.html`
- **Frontend**: `frontend/coverage/index.html`

Open these files in a browser to view detailed coverage reports.

## Coverage Thresholds

Tests will **fail** if coverage falls below:

- **Backend**: 85% (lines, functions, branches, statements)
- **Frontend**: 80% (lines, functions, branches, statements)

## Running All Tests

To run the complete test suite:

```bash
# From project root
cd backend && npm test && cd ../frontend && npm test
```

Or create a root package.json with scripts to orchestrate both.

## Continuous Integration

The testing infrastructure is designed for CI/CD pipelines:

1. Install dependencies
2. Run linter
3. Run tests with coverage
4. Check coverage thresholds
5. Generate coverage reports

## Best Practices

1. **Write tests alongside code** - Don't wait until the end
2. **Test behavior, not implementation** - Focus on what, not how
3. **Use descriptive test names** - Explain what's being tested
4. **Keep tests fast** - Mock external dependencies when appropriate
5. **Maintain coverage** - Don't let coverage drop below thresholds
6. **Use property tests for algorithms** - Verify universal properties

## Property-Based Testing

Both backend and frontend use **fast-check** for property-based testing:

- Minimum 100 runs per property test
- Tests verify universal correctness properties from design document
- All property tests are annotated with requirement validation comments

See individual TEST_SETUP.md files for detailed examples.

## Troubleshooting

### Backend Tests Failing

- Ensure SQLite database is initialized: `npm run db:init`
- Check that all dependencies are installed: `npm install`
- Clear coverage directory: `rm -rf coverage`

### Frontend Tests Failing

- Ensure jsdom is installed: `npm install jsdom`
- Check vite.config.ts test configuration
- Clear node_modules and reinstall if needed

### Coverage Not Generated

- Ensure you run tests with coverage flag: `npm run test:coverage`
- Check that coverage directories are not gitignored
- Verify coverage reporters in config files

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [fast-check Documentation](https://fast-check.dev/)

## Task Completion Status

✅ **Task 22.1**: Property-based testing with fast-check configured  
✅ **Task 22.2**: Test runners and coverage configured

- Jest configured for backend with ≥85% coverage target
- Vitest configured for frontend with ≥80% coverage target
- React Testing Library set up for component tests
- Coverage reporting configured (text, HTML, LCOV, JSON)
- Test scripts added to package.json files
