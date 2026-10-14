# Validation Utilities

This directory contains utility functions for input validation and data formatting in the PRO Market Dashboard frontend.

## Files

- `validation.ts` - Core utility functions
- `validation.test.ts` - Comprehensive test suite with unit and property-based tests

## Functions

### `validateSearchQuery(query: string): string | null`

Validates search query input according to Requirement 1.3.

- **Returns**: Error message if invalid, `null` if valid
- **Rules**: Rejects empty strings and whitespace-only strings
- **Example**:
  ```typescript
  validateSearchQuery('laptop')      // null (valid)
  validateSearchQuery('')            // 'Please enter a search term'
  validateSearchQuery('   ')         // 'Please enter a search term'
  ```

### `formatCurrency(price: number, currency: string): string`

Formats price with appropriate currency symbol.

- **Parameters**:
  - `price`: Price in smallest currency unit (cents/paise)
  - `currency`: ISO 4217 currency code (e.g., 'USD', 'INR', 'EUR')
- **Returns**: Formatted price string with currency symbol
- **Example**:
  ```typescript
  formatCurrency(24999, 'USD')  // '$249.99'
  formatCurrency(24999, 'INR')  // '₹249.99'
  formatCurrency(1000, 'EUR')   // '€10.00'
  ```

### `formatDate(dateString: string, format?: 'short' | 'medium' | 'long'): string`

Formats ISO date string for display.

- **Parameters**:
  - `dateString`: ISO date string
  - `format`: Display format (default: 'medium')
- **Returns**: Formatted date string
- **Example**:
  ```typescript
  formatDate('2025-01-15T10:30:00Z', 'short')   // 'Jan 15'
  formatDate('2025-01-15T10:30:00Z', 'medium')  // 'Jan 15, 2025'
  formatDate('2025-01-15T10:30:00Z', 'long')    // 'January 15, 2025'
  ```

### `formatDateForChart(dateString: string, rangeDays: number): string`

Formats date for chart axis labels based on time range.

- **Parameters**:
  - `dateString`: ISO date string
  - `rangeDays`: Number of days in range (7, 30, or 90)
- **Returns**: Formatted date string appropriate for the range
- **Example**:
  ```typescript
  formatDateForChart('2025-01-15T10:30:00Z', 7)   // 'Wed' (day of week)
  formatDateForChart('2025-01-15T10:30:00Z', 30)  // 'Jan 15' (month + day)
  formatDateForChart('2025-01-15T10:30:00Z', 90)  // 'Jan 15' (month + day)
  ```

### `countUniqueSources(listings: Listing[]): number`

Counts the number of distinct sources in an array of listings.

- **Parameters**:
  - `listings`: Array of Listing objects
- **Returns**: Number of unique source values in the array
- **Example**:
  ```typescript
  countUniqueSources([
    { source: 'Amazon', ... },
    { source: 'eBay', ... },
    { source: 'Amazon', ... }
  ])  // 2
  
  countUniqueSources([])  // 0
  ```

## Testing

The test suite includes:

1. **Unit Tests**: Specific examples for each function
2. **Property-Based Tests**: Universal properties tested across 100 iterations using fast-check

### Property Tests Included

- **Property 2: Input Validation Rejects Whitespace** (Validates Requirements 1.3)
  - All whitespace-only strings are rejected
  - All non-whitespace strings are accepted

- **Property 10: Source Count Accuracy** (Validates Requirements 4.4)
  - Count of distinct sources equals number of unique source field values
  - Returns 0 for empty arrays
  - Count is always less than or equal to array length
  - Returns array length when all sources are unique
  - Returns 1 when all listings have the same source

- **Currency Formatting Properties**:
  - Always produces string output
  - Correctly converts smallest unit to major unit
  - Includes decimal points for major currencies

- **Date Formatting Properties**:
  - Always produces string output for valid dates
  - Different formats produce appropriately different outputs
  - Chart formatting adapts to range duration

### Running Tests

To run the tests, first install dependencies:

```bash
npm install
```

Then run tests:

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Requirements Validated

- **Requirement 1.3**: Input validation for search queries (empty/whitespace rejection)
- **Requirement 4.4**: Display total number of sources contributing results (source count calculation)
- **Supporting Requirements**: Currency and date formatting for displaying listings and price history

## Dependencies

- `vitest` - Test runner
- `fast-check` - Property-based testing library
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom matchers for DOM testing

## Notes

- All utility functions include error handling for invalid inputs
- Currency formatting uses `Intl.NumberFormat` for internationalization support
- Date formatting uses `Intl.DateTimeFormat` for locale-aware formatting
- Property-based tests run 100 iterations per property as specified in the design document
