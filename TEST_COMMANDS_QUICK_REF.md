# Test Commands Quick Reference

## Backend Tests (Jest)

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

## Frontend Tests (Vitest)

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with visual UI
npm run test:ui
```

## Coverage Reports

After running with coverage, view reports at:

- Backend: `backend/coverage/index.html`
- Frontend: `frontend/coverage/index.html`

## First Time Setup

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## Coverage Thresholds

- **Backend**: Minimum 85% (lines, functions, branches, statements)
- **Frontend**: Minimum 80% (lines, functions, branches, statements)

Tests will **fail** if coverage drops below these thresholds.
