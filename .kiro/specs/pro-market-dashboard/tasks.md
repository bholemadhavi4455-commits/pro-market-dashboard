N# Implementation Plan: PRO Market Dashboard

## Overview

This implementation plan converts the PRO Market Dashboard design into actionable coding tasks. The system is a full-stack TypeScript application with a React frontend and Node.js/Express backend that aggregates product listings from multiple sources, enabling users to search, compare prices, view historical trends, and receive data-driven purchase recommendations.

The implementation follows a layered approach:
1. Backend core infrastructure (data models, services, database)
2. Backend API endpoints with caching and aggregation
3. Frontend components with state management
4. Integration and testing

Each task builds incrementally, with checkpoints to ensure system stability before moving forward.

---

## Tasks

- [ ] 1. Set up backend core infrastructure and data models
  - [ ] 1.1 Create TypeScript interfaces for core data models
    - Define Listing, Review, PriceHistoryRecord, SearchResult, and ErrorResponse interfaces in `backend/src/models/index.ts`
    - Include validation rules as JSDoc comments
    - Export all interfaces
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 1.2 Write property test for Listing data model
    - **Property 1: UI Rendering Completeness**
    - **Validates: Requirements 4.1, 6.1**
    - Verify all required Listing fields (productName, source, price, rating, reviewCount) are present and non-empty
    - _Requirements: 4.1, 6.1_

  - [ ] 1.3 Implement CacheManager service
    - Create `backend/src/services/CacheManager.ts` with in-memory Map-based storage
    - Implement set(), get(), generateKey(), and clear() methods
    - Include TTL expiration logic
    - _Requirements: 10.1, 10.2_

  - [ ]* 1.4 Write property test for CacheManager
    - **Property 15: Cache Hit Behavior**
    - **Validates: Requirements 10.1, 10.2**
    - Test first request is MISS, subsequent within TTL are HIT
    - Test response data from cache hits is identical to original
    - _Requirements: 10.1, 10.2_

  - [ ] 1.5 Implement PersistenceService with SQLite
    - Create `backend/src/services/PersistenceService.ts` with SQLite3 integration
    - Implement storePriceSnapshot() with 1-hour window deduplication
    - Implement getPriceHistory() with date range filtering
    - Initialize database schema in `backend/src/db/init.ts`
    - _Requirements: 10.3, 10.4_

  - [ ]* 1.6 Write property test for PersistenceService
    - **Property 16: Price History Temporal Deduplication**
    - **Validates: Requirements 10.4**
    - Test records within 1-hour window update instead of creating duplicates
    - Test no two records for same listingId exist within 1 hour
    - _Requirements: 10.4_

- [ ] 2. Checkpoint - Backend infrastructure tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement backend scoring and aggregation logic
  - [ ] 3.1 Create ScoringEngine service
    - Implement `backend/src/services/ScoringEngine.ts`
    - Implement calculateCompositeScore() using formula: (0.5 × priceRank) + (0.3 × ratingNorm) + (0.2 × reviewCountNorm)
    - Implement selectBestPick() with tiebreaker logic (lowest price)
    - Implement determineBestPickReason() logic
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 3.2 Write property test for ScoringEngine
    - **Property 13: BestPick Selection Algorithm**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
    - Test composite score formula correctness
    - Test highest score selection
    - Test tiebreaker by lowest price
    - Test no BestPick when < 2 listings
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 3.3 Create SourceAdapter interface and mock adapters
    - Define SourceAdapter interface in `backend/src/adapters/index.ts`
    - Create AmazonAdapter, FlipkartAdapter stub implementations with mock data
    - Implement search() and getReviews() methods returning normalized Listings
    - _Requirements: 2.1, 2.2_

  - [ ] 3.4 Implement AggregatorService
    - Create `backend/src/services/AggregatorService.ts`
    - Implement search() method with parallel source queries using Promise.allSettled
    - Implement 5-second timeout per source
    - Implement deduplication by (productName, source)
    - Implement composite score computation and sorting
    - Implement cache integration
    - Implement price snapshot storage
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 10.1_

  - [ ]* 3.5 Write property test for deduplication
    - **Property 5: Deduplication by Name and Source**
    - **Validates: Requirements 2.4**
    - Test exactly one listing per unique (productName, source) pair
    - Test most recently fetched entry is retained
    - _Requirements: 2.4_

  - [ ]* 3.6 Write property test for multi-source aggregation
    - **Property 4: Multi-Source Aggregation Completeness**
    - **Validates: Requirements 2.1**
    - Test all listings from K successful sources are included
    - Test no data loss during combination
    - _Requirements: 2.1_

  - [ ]* 3.7 Write property test for composite score sorting
    - **Property 6: CompositeScore Descending Sort**
    - **Validates: Requirements 2.5**
    - Test sorted output is in descending order by compositeScore
    - _Requirements: 2.5_

- [ ] 4. Checkpoint - Backend aggregation logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement backend API routes and server
  - [ ] 5.1 Create Express server with middleware
    - Set up `backend/src/server.ts` with Express, CORS, body-parser
    - Configure CORS to allow frontend origin
    - Add error handling middleware
    - _Requirements: 9.6_

  - [ ] 5.2 Implement GET /api/search endpoint
    - Create route handler in `backend/src/routes/index.ts`
    - Validate required query parameter 'q'
    - Call AggregatorService.search() with query and optional category
    - Return SearchResult JSON with cache headers
    - Handle errors with appropriate 400/500 responses
    - _Requirements: 9.1, 9.4, 9.5, 10.2_

  - [ ] 5.3 Implement GET /api/listing/:id/history endpoint
    - Create route handler for price history
    - Validate listingId path parameter
    - Parse optional 'range' query parameter (default 30, allowed: 7, 30, 90)
    - Call AggregatorService.getListingHistory()
    - Return history array or "Insufficient history data" message if < 2 points
    - _Requirements: 9.2, 9.4, 9.5, 5.1, 5.3_

  - [ ] 5.4 Implement GET /api/listing/:id/reviews endpoint
    - Create route handler for reviews
    - Parse listingId to extract source identifier
    - Call appropriate SourceAdapter.getReviews()
    - Return reviews array or "Reviews unavailable" message
    - _Requirements: 9.3, 9.4, 9.5, 6.2, 6.3_

  - [ ]* 5.5 Write integration tests for API endpoints
    - Test /api/search with valid query, missing query, category filter
    - Test cache headers on hit/miss
    - Test /api/listing/:id/history with various ranges
    - Test /api/listing/:id/reviews success and unavailable cases
    - Use Supertest for HTTP assertions
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6. Checkpoint - Backend API endpoints functional
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement frontend SearchBar component
  - [ ] 7.1 Create SearchBar component with state management
    - Create `frontend/src/components/SearchBar.tsx`
    - Implement controlled input for query
    - Implement category dropdown with options: All, Electronics, Books, Clothing, Home & Kitchen, Sports
    - Add loading indicator
    - Add inline validation error display
    - _Requirements: 1.1, 3.1_

  - [ ] 7.2 Implement input validation and debouncing
    - Add validateInput() function to reject empty/whitespace queries
    - Implement 300ms debounce using useEffect and setTimeout
    - Prevent API call on validation failure
    - _Requirements: 1.3, 1.6_

  - [ ]* 7.3 Write property test for input validation
    - **Property 2: Input Validation Rejects Whitespace**
    - **Validates: Requirements 1.3**
    - Test all whitespace combinations (spaces, tabs, newlines) are rejected
    - Test validation error is displayed
    - Test no API request is submitted
    - _Requirements: 1.3_

  - [ ] 7.4 Implement search submission and API integration
    - Add handleSubmit() function to call /api/search endpoint
    - Handle category change to trigger new search
    - Reset category filter to "All" on new query submission
    - Display loading state during API call
    - _Requirements: 1.1, 3.2, 3.4, 3.5_

- [ ] 8. Implement frontend PriceCard component
  - [ ] 8.1 Create PriceCard component with listing display
    - Create `frontend/src/components/PriceCard.tsx`
    - Display product name, source badge, price (formatted with currency), star rating, review count
    - Implement conditional badges for "Lowest Price" and "Best Pick"
    - Add click handler to open source URL in new tab
    - _Requirements: 4.1, 4.5_

  - [ ] 8.2 Implement star rating renderer
    - Create renderStars() function to generate visual 5-star representation
    - Calculate full stars, half stars, and empty stars from rating value
    - Display numeric rating alongside icons
    - _Requirements: 6.4_

  - [ ]* 8.3 Write property test for star rating rendering
    - **Property 11: Star Rating Rendering**
    - **Validates: Requirements 6.4**
    - Test any rating [0.0, 5.0] produces correct full/half/empty star combination
    - Test total always equals 5 stars
    - _Requirements: 6.4_

  - [ ] 8.4 Implement expand/collapse for reviews
    - Add expand button and state management
    - On expand, fetch reviews from /api/listing/:id/reviews
    - Display up to 5 review excerpts (truncated to 200 chars)
    - Show "Reviews unavailable" if not available
    - _Requirements: 6.2, 6.3_

  - [ ]* 8.5 Write property test for review text truncation
    - **Property 12: Review Text Truncation**
    - **Validates: Requirements 6.5**
    - Test review text > 200 chars is truncated to exactly 200 chars
    - Test ellipsis is appended
    - Test "Read more" link is included
    - _Requirements: 6.5_

- [ ] 9. Implement frontend Dashboard component
  - [ ] 9.1 Create Dashboard component with results display
    - Create `frontend/src/components/Dashboard.tsx`
    - Accept listings, bestPick, sourcesCount, isLoading, error as props
    - Render array of PriceCard components
    - Display total sources count
    - Implement loading state UI
    - Implement error state UI with retry button
    - Display "No results found" message for empty results
    - _Requirements: 1.2, 1.4, 1.5, 4.4_

  - [ ]* 9.2 Write property test for listing count preservation
    - **Property 3: Listing Count Preservation**
    - **Validates: Requirements 1.2**
    - Test N listings result in exactly N PriceCard components rendered
    - _Requirements: 1.2_

  - [ ] 9.3 Implement lowest price highlighting
    - Create findLowestPrice() function
    - Pass isLowestPrice prop to corresponding PriceCard
    - Apply visual distinction (border, badge, or background color)
    - _Requirements: 4.2_

  - [ ]* 9.4 Write property test for lowest price identification
    - **Property 8: Lowest Price Identification**
    - **Validates: Requirements 4.2**
    - Test exactly one listing is identified as lowest price
    - Test correct listing with minimum price value is selected
    - _Requirements: 4.2_

  - [ ] 9.5 Implement BestPick banner
    - Create BestPickBanner component in `frontend/src/components/BestPickBanner.tsx`
    - Display when bestPick is not null and listings count ≥ 2
    - Show product name, source, price, rating, and selection reason
    - Do not display if < 2 listings
    - _Requirements: 7.1, 7.5, 7.6_

- [ ] 10. Implement sorting and filtering features
  - [ ] 10.1 Add sort control to Dashboard
    - Create sort dropdown with options: Best Match, Lowest Price, Highest Rating, Most Reviews
    - Implement sortListings() function for client-side sorting
    - Sort by compositeScore (desc), price (asc), rating (desc), or reviewCount (desc)
    - Reset sort to "Best Match" on new search
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 10.2 Write property test for client-side sorting
    - **Property 14: Client-Side Sorting Correctness**
    - **Validates: Requirements 8.2**
    - Test Best Match sorts by compositeScore descending
    - Test Lowest Price sorts by price ascending
    - Test Highest Rating sorts by rating descending
    - Test Most Reviews sorts by reviewCount descending
    - _Requirements: 8.2_

  - [ ] 10.3 Implement category filtering in Dashboard
    - Filter displayed listings based on selected category from SearchBar
    - Show all listings when category is "All"
    - Show only matching category listings otherwise
    - _Requirements: 3.2, 3.3_

  - [ ]* 10.4 Write property test for category filtering
    - **Property 7: Category Filtering Correctness**
    - **Validates: Requirements 3.2, 3.3**
    - Test non-"All" category shows only matching listings
    - Test "All" category shows all listings
    - _Requirements: 3.2, 3.3_

- [ ] 11. Checkpoint - Frontend core components functional
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement frontend ChartBox component
  - [ ] 12.1 Create ChartBox component with Recharts integration
    - Create `frontend/src/components/ChartBox.tsx`
    - Set up Recharts LineChart with responsive container
    - Configure X-axis for dates and Y-axis for prices
    - Add tooltip to show exact date and price on hover
    - _Requirements: 5.1, 5.2_

  - [ ] 12.2 Implement price history data fetching
    - Add fetchHistory() function to call /api/listing/:id/history
    - Accept listingId and range props (7, 30, or 90 days)
    - Handle loading state while fetching
    - Display "Insufficient history data" if < 2 data points
    - _Requirements: 5.1, 5.3_

  - [ ] 12.3 Implement range toggle controls
    - Add buttons/tabs for 7-day, 30-day, and 90-day ranges
    - Update chart on range change
    - Refetch data when range changes
    - _Requirements: 5.4_

  - [ ]* 12.4 Write unit tests for ChartBox rendering
    - Test chart renders with valid data (≥ 2 points)
    - Test "Insufficient data" message with < 2 points
    - Test range toggle functionality
    - Test loading and error states
    - _Requirements: 5.1, 5.3_

- [ ] 13. Implement cross-source separation and source counting
  - [ ] 13.1 Ensure separate PriceCards for same product across sources
    - Verify Dashboard renders separate PriceCard for each (productName, source) combination
    - Do not deduplicate at display level
    - _Requirements: 4.3_

  - [ ]* 13.2 Write property test for cross-source product separation
    - **Property 9: Cross-Source Product Separation**
    - **Validates: Requirements 4.3**
    - Test listings with same productName but different source render as separate PriceCards
    - _Requirements: 4.3_

  - [ ]* 13.3 Write property test for source count accuracy
    - **Property 10: Source Count Accuracy**
    - **Validates: Requirements 4.4**
    - Test count of distinct sources equals unique source field values
    - _Requirements: 4.4_

- [ ] 14. Integrate App component and routing
  - [ ] 14.1 Create App component with state management
    - Create or update `frontend/src/App.tsx`
    - Manage global state for listings, loading, error, selected listing
    - Connect SearchBar, Dashboard, and ChartBox components
    - Handle search submission from SearchBar
    - Pass data to child components via props
    - _Requirements: 1.1, 1.2_

  - [ ] 14.2 Implement error handling throughout frontend
    - Display inline validation errors in SearchBar
    - Display network errors in Dashboard with retry button
    - Display specific API error messages (400, 500, timeout)
    - Preserve previous results when new search fails
    - _Requirements: 1.5_

  - [ ]* 14.3 Write integration tests for user flows
    - Test complete search and display flow
    - Test sort and filter interactions
    - Test error recovery with retry
    - Test review expansion
    - Use React Testing Library
    - _Requirements: 1.1, 1.2, 1.5, 8.2, 3.2_

- [ ] 15. Final testing and polish
  - [ ]* 15.1 Run all property-based tests
    - Execute all property tests with minimum 100 iterations
    - Verify shrinking produces minimal failing examples on failures
    - Tag tests with Feature and Property numbers
    - _Requirements: All_

  - [ ]* 15.2 Run full unit and integration test suites
    - Execute backend test suite with coverage report
    - Execute frontend test suite with coverage report
    - Verify ≥80% statement coverage on frontend, ≥85% on backend
    - _Requirements: All_

  - [ ] 15.3 Manual end-to-end testing
    - Test search flow with real or mock sources
    - Test price history chart display
    - Test sorting and filtering
    - Test error scenarios (network failure, empty results)
    - Test review expansion
    - Verify CORS headers allow frontend-backend communication
    - _Requirements: All_

- [ ] 16. Final checkpoint - Application complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit and integration tests validate specific examples, error conditions, and API contracts
- Backend uses TypeScript with Express, SQLite, and fast-check for property testing
- Frontend uses TypeScript with React, Recharts, and fast-check for property testing
- Checkpoints ensure incremental validation of system stability
- All property tests should run with minimum 100 iterations per test
- Testing framework: Jest (backend), Vitest (frontend)

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.5"] },
    { "id": 2, "tasks": ["1.4", "1.6", "3.1", "3.3"] },
    { "id": 3, "tasks": ["3.2", "3.4"] },
    { "id": 4, "tasks": ["3.5", "3.6", "3.7", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4"] },
    { "id": 6, "tasks": ["5.5", "7.1"] },
    { "id": 7, "tasks": ["7.2", "8.1"] },
    { "id": 8, "tasks": ["7.3", "7.4", "8.2"] },
    { "id": 9, "tasks": ["8.3", "8.4", "9.1"] },
    { "id": 10, "tasks": ["8.5", "9.2", "9.3"] },
    { "id": 11, "tasks": ["9.4", "9.5", "10.1"] },
    { "id": 12, "tasks": ["10.2", "10.3", "12.1"] },
    { "id": 13, "tasks": ["10.4", "12.2", "13.1"] },
    { "id": 14, "tasks": ["12.3", "12.4", "13.2", "13.3", "14.1"] },
    { "id": 15, "tasks": ["14.2", "14.3"] },
    { "id": 16, "tasks": ["15.1", "15.2", "15.3"] }
  ]
}
```
