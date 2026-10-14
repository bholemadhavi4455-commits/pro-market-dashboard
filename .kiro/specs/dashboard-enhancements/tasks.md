# Implementation Plan: Dashboard Enhancements

## Overview

This plan implements four key enhancements to the existing PRO Market Dashboard: Price Drop Alerts, Wishlist Functionality, Mobile Optimization, and Product Comparison View. The implementation builds upon the existing backend (Node.js/Express with SQLite) and frontend (React with TypeScript), adding new database tables, API endpoints, services, and UI components.

The approach follows a backend-first strategy: extend the database schema and PersistenceService → implement notification scheduler → add API endpoints → build frontend components → integrate responsive design → comprehensive testing. All tasks reference specific requirements for traceability and include property-based tests using fast-check.

---

## Tasks

- [x] 1. Extend database schema for new tables
  - [x] 1.1 Add price_alerts table to database schema
    - Modify `backend/src/db/init.ts` to create price_alerts table
    - Include all fields: id, listing_id, product_name, source, alert_threshold, currency, current_price, created_at, triggered, triggered_at
    - Add indexes for listing_id and triggered columns
    - Add CHECK constraints for positive prices
    - _Requirements: 1.2_
  
  - [x] 1.2 Add wishlist_items table to database schema
    - Modify `backend/src/db/init.ts` to create wishlist_items table
    - Include all fields: id, listing_id, product_name, source, saved_price, current_price, currency, added_at, category, image_url
    - Add UNIQUE constraint on listing_id
    - Add indexes for added_at and category columns
    - Add CHECK constraints for positive prices
    - _Requirements: 2.2_


- [x] 2. Extend PersistenceService with price alerts methods
  - [x] 2.1 Implement price alert CRUD operations
    - Add createPriceAlert() method with UUID generation
    - Add getActiveAlerts() method filtering by triggered=false
    - Add getAlertsByListing() method for listing-specific alerts
    - Add triggerAlert() method to mark alert as triggered
    - Add deleteAlert() method
    - Add updateAlertPrice() method for background price updates
    - _Requirements: 1.2, 1.4, 1.6_
  
  - [ ]* 2.2 Write property test for price alert storage round-trip
    - **Property 1: Price Alert Storage Round-Trip**
    - **Validates: Requirements 1.2**
    - Test that storing and retrieving an alert preserves all field values
  
  - [ ]* 2.3 Write property test for price alert deletion
    - **Property 2: Price Alert Deletion**
    - **Validates: Requirements 1.6**
    - Test that deleting an alert removes it from storage

- [ ] 3. Extend PersistenceService with wishlist methods
  - [~] 3.1 Implement wishlist CRUD operations
    - Add addToWishlist() method with 50-item limit enforcement
    - Add getWishlist() method returning all items
    - Add removeFromWishlist() method
    - Add isInWishlist() method for checking existence
    - Add updateWishlistPrice() method for background price updates
    - _Requirements: 2.2, 2.6, 2.8, 2.9_
  
  - [ ]* 3.2 Write property test for wishlist storage round-trip
    - **Property 7: Wishlist Storage Round-Trip**
    - **Validates: Requirements 2.2**
    - Test that adding and retrieving a wishlist item preserves all fields
  
  - [ ]* 3.3 Write property test for wishlist deletion
    - **Property 10: Wishlist Deletion**
    - **Validates: Requirements 2.6**
    - Test that removing an item removes it from the wishlist


- [ ] 4. Implement NotificationService for price monitoring
  - [~] 4.1 Create NotificationService class with scheduler
    - Create `backend/src/services/NotificationService.ts`
    - Implement start() method with 60-minute interval scheduler
    - Implement stop() method to clear interval
    - Implement checkAlerts() method to check all active alerts
    - Add sendNotification() placeholder method for future integration
    - _Requirements: 1.3, 1.4_
  
  - [~] 4.2 Integrate NotificationService with server startup
    - Import and instantiate NotificationService in server.ts
    - Start scheduler when server initializes
    - Add graceful shutdown on server stop
    - _Requirements: 1.3_
  
  - [ ]* 4.3 Write property test for alert trigger condition
    - **Property 3: Price Alert Trigger Condition**
    - **Validates: Requirements 1.4**
    - Test that alerts trigger when current price <= threshold

- [~] 5. Checkpoint - Backend data layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement backend API endpoints for price alerts
  - [~] 6.1 Add GET /api/alerts endpoint
    - Call persistenceService.getActiveAlerts()
    - Return JSON with alerts array
    - Add error handling for 500 status
    - _Requirements: 1.5_
  
  - [~] 6.2 Add POST /api/alerts endpoint
    - Extract alert parameters from request body
    - Validate alertThreshold < currentPrice
    - Return 400 with INVALID_THRESHOLD code if validation fails
    - Call persistenceService.createPriceAlert()
    - Return 201 with created alert
    - _Requirements: 1.2, 1.7_
  
  - [~] 6.3 Add DELETE /api/alerts/:id endpoint
    - Extract alert ID from path parameter
    - Call persistenceService.deleteAlert()
    - Return 204 No Content on success
    - _Requirements: 1.6_
  
  - [~] 6.4 Add GET /api/alerts/listing/:listingId endpoint
    - Extract listingId from path parameter
    - Call persistenceService.getAlertsByListing()
    - Return JSON with alerts array
    - _Requirements: 1.8_


- [ ] 7. Implement backend API endpoints for wishlist
  - [~] 7.1 Add GET /api/wishlist endpoint
    - Call persistenceService.getWishlist()
    - Return JSON with items array
    - Add error handling for 500 status
    - _Requirements: 2.3_
  
  - [~] 7.2 Add POST /api/wishlist endpoint
    - Extract wishlist item parameters from request body
    - Call persistenceService.addToWishlist()
    - Handle WISHLIST_FULL error with 400 status and error code
    - Return 201 with created item
    - _Requirements: 2.2, 2.9_
  
  - [~] 7.3 Add DELETE /api/wishlist/:id endpoint
    - Extract item ID from path parameter
    - Call persistenceService.removeFromWishlist()
    - Return 204 No Content on success
    - _Requirements: 2.6_
  
  - [~] 7.4 Add GET /api/wishlist/check/:listingId endpoint
    - Extract listingId from path parameter
    - Call persistenceService.isInWishlist()
    - Return JSON with inWishlist boolean
    - _Requirements: 2.8_
  
  - [ ]* 7.5 Write integration tests for alerts and wishlist endpoints
    - Test all endpoints with valid and invalid parameters
    - Test error responses (400, 500)
    - Test alert threshold validation
    - Test wishlist limit enforcement
    - Use supertest for HTTP assertions

- [~] 8. Checkpoint - Backend API complete
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 9. Create frontend TypeScript interfaces for new models
  - [~] 9.1 Add PriceAlert interface
    - Create or extend `frontend/src/types/index.ts`
    - Define PriceAlert interface with all fields: id, listingId, productName, source, alertThreshold, currency, currentPrice, createdAt, triggered, triggeredAt
    - Add JSDoc comments for field descriptions
    - _Requirements: 1.2_
  
  - [~] 9.2 Add WishlistItem interface
    - Define WishlistItem interface with all fields: id, listingId, productName, source, savedPrice, currentPrice, currency, addedAt, category, imageUrl
    - Add JSDoc comments
    - _Requirements: 2.2_
  
  - [~] 9.3 Add ComparisonSelection interface
    - Define ComparisonSelection interface with listingIds array and listings array
    - Add JSDoc comments
    - _Requirements: 4.1_

- [ ] 10. Create frontend API client methods
  - [~] 10.1 Add price alerts API methods
    - Create or extend `frontend/src/services/api.ts`
    - Implement fetchAlerts() method
    - Implement createAlert() method
    - Implement deleteAlert() method
    - Implement fetchAlertsByListing() method
    - Add error handling with try/catch
    - _Requirements: 1.2, 1.5, 1.6_
  
  - [~] 10.2 Add wishlist API methods
    - Implement fetchWishlist() method
    - Implement addToWishlist() method
    - Implement removeFromWishlist() method
    - Implement checkInWishlist() method
    - Add error handling
    - _Requirements: 2.2, 2.3, 2.6, 2.8_


- [ ] 11. Enhance PriceCard component with new controls
  - [~] 11.1 Add alert and wishlist buttons to PriceCard
    - Modify `frontend/src/components/PriceCard.tsx`
    - Add hasAlert, inWishlist, isCompareSelected props
    - Add onSetAlert, onAddToWishlist, onCompareToggle callback props
    - Render "Set Alert" button with active indicator when hasAlert=true
    - Render "Add to Wishlist" button with active indicator when inWishlist=true
    - Add Compare checkbox with controlled checked state
    - _Requirements: 1.1, 1.8, 2.1, 2.8, 4.1_
  
  - [ ]* 11.2 Write property test for alert indicator display
    - **Property 6: Price Alert Indicator Display**
    - **Validates: Requirements 1.8**
    - Test that alert indicator is present if and only if hasAlert is true
  
  - [ ]* 11.3 Write property test for wishlist indicator display
    - **Property 12: Wishlist Indicator Display**
    - **Validates: Requirements 2.8**
    - Test that wishlist indicator is present if and only if inWishlist is true

- [ ] 12. Create AlertsPanel component
  - [~] 12.1 Implement AlertsPanel component
    - Create `frontend/src/components/AlertsPanel.tsx`
    - Accept alerts array and onDelete callback props
    - Render empty state message when no alerts exist
    - Display all alerts with product name, source, current price, alert threshold
    - Add delete button (✕) for each alert
    - Format prices using currency formatter
    - _Requirements: 1.5, 1.6_
  
  - [ ]* 12.2 Write property test for alert rendering completeness
    - **Property 4: Price Alert Rendering Completeness**
    - **Validates: Requirements 1.5**
    - Test that all required fields are rendered for each alert
  
  - [ ]* 12.3 Write unit tests for AlertsPanel
    - Test empty state rendering
    - Test delete button click handling
    - Test price formatting


- [ ] 13. Create WishlistView component
  - [~] 13.1 Implement WishlistView component
    - Create `frontend/src/components/WishlistView.tsx`
    - Accept items array, onRemove callback, onItemClick callback props
    - Render empty state message when no items exist
    - Display item count with 50-item limit indicator (X/50)
    - Render grid of wishlist items with image, name, source, prices
    - Calculate and display price change percentage with direction indicator (↑↓)
    - Add Remove button that stops event propagation
    - Add click handler to navigate to search results
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.9_
  
  - [ ]* 13.2 Write property test for wishlist rendering completeness
    - **Property 8: Wishlist Rendering Completeness**
    - **Validates: Requirements 2.4**
    - Test that all required fields are rendered for each item
  
  - [ ]* 13.3 Write property test for price change calculation
    - **Property 9: Wishlist Price Change Calculation**
    - **Validates: Requirements 2.5**
    - Test that price change percentage formula is correct and direction matches
  
  - [ ]* 13.4 Write property test for wishlist navigation
    - **Property 11: Wishlist Navigation**
    - **Validates: Requirements 2.7**
    - Test that clicking an item triggers navigation with correct query parameter
  
  - [ ]* 13.5 Write unit tests for WishlistView
    - Test empty state rendering
    - Test remove button event propagation
    - Test price change color coding (up/down/same)


- [~] 14. Checkpoint - Review core new components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Create ComparisonView component
  - [~] 15.1 Implement ComparisonView component structure
    - Create `frontend/src/components/ComparisonView.tsx`
    - Accept listings array, priceHistories map, onRemove callback, onBackToResults callback props
    - Render insufficient data message when fewer than 2 listings
    - Create comparison table with attribute rows and listing columns
    - Display all required attributes: product name, source, price, rating, review count, category
    - _Requirements: 4.3, 4.4, 4.7, 4.8_
  
  - [~] 15.2 Implement best value highlighting
    - Calculate lowest price across all listings
    - Calculate highest rating across all listings
    - Calculate most reviews across all listings
    - Apply "best-value" CSS class to cells with best values
    - _Requirements: 4.5_
  
  - [ ]* 15.3 Write property test for comparison table structure
    - **Property 18: Comparison Table Structure**
    - **Validates: Requirements 4.4**
    - Test that table has columns for each listing and rows for all required attributes
  
  - [ ]* 15.4 Write property test for best value highlighting
    - **Property 19: Best Value Highlighting**
    - **Validates: Requirements 4.5**
    - Test that lowest price, highest rating, and most reviews have best-value class
  
  - [~] 15.3 Add price history charts to comparison
    - Import existing ChartBox component
    - Render aligned chart columns for each listing
    - Display "No history data" for listings without history
    - _Requirements: 4.6_
  
  - [ ]* 15.6 Write property test for price history chart alignment
    - **Property 20: Price History Chart Alignment**
    - **Validates: Requirements 4.6**
    - Test that each listing has a corresponding chart in aligned columns


- [ ] 16. Implement comparison selection state management
  - [~] 16.1 Add comparison state to App component
    - Add comparisonSelection state with listingIds and listings arrays
    - Add handleCompareToggle method to add/remove listings
    - Implement 4-item limit validation
    - Display validation message when limit reached
    - _Requirements: 4.1, 4.10_
  
  - [~] 16.2 Implement comparison view navigation
    - Add "Compare Selected" button visible when 2-4 items selected
    - Add handleCompareClick method to navigate to comparison view
    - Add currentView state to track 'search' | 'wishlist' | 'comparison'
    - Persist comparison selection in sessionStorage
    - _Requirements: 4.2, 4.3, 4.9_
  
  - [ ]* 16.3 Write property test for comparison button visibility
    - **Property 16: Comparison Button Visibility**
    - **Validates: Requirements 4.2**
    - Test that button is visible only when 2-4 items are selected
  
  - [ ]* 16.4 Write property test for comparison view navigation
    - **Property 17: Comparison View Navigation**
    - **Validates: Requirements 4.3**
    - Test that clicking button navigates with correct listings displayed
  
  - [ ]* 16.5 Write property test for comparison item removal
    - **Property 21: Comparison Item Removal**
    - **Validates: Requirements 4.7**
    - Test that removing an item updates state without navigation
  
  - [ ]* 16.6 Write property test for comparison selection persistence
    - **Property 22: Comparison Selection Persistence**
    - **Validates: Requirements 4.9**
    - Test that selection persists across navigation within same session
  
  - [ ]* 16.7 Write property test for comparison selection limit
    - **Property 23: Comparison Selection Limit Validation**
    - **Validates: Requirements 4.10**
    - Test that 5th selection is prevented with validation message


- [x] 17. Implement responsive design with CSS
  - [x] 17.1 Add mobile view styles (< 768px)
    - Modify `frontend/src/App.css`
    - Add media query for max-width 767px
    - Set results-grid to single-column layout (grid-template-columns: 1fr)
    - Set minimum touch target sizes (44x44px) for all interactive elements
    - Hide navbar by default, show hamburger menu button
    - Scale typography to 14px base font size
    - Simplify ChartBox height to 200px
    - _Requirements: 3.1, 3.2, 3.6, 3.7, 3.8_
  
  - [x] 17.2 Add tablet view styles (768px - 1023px)
    - Add media query for min-width 768px and max-width 1023px
    - Set results-grid to two-column layout (grid-template-columns: repeat(2, 1fr))
    - Show standard horizontal navbar
    - Hide hamburger menu
    - Scale typography to 15px base font size
    - _Requirements: 3.3_
  
  - [x] 17.3 Add desktop view styles (>= 1024px)
    - Add media query for min-width 1024px
    - Set results-grid to three-column layout (grid-template-columns: repeat(3, 1fr))
    - Show standard navbar, hide hamburger menu
    - Scale typography to 16px base font size
    - _Requirements: 3.4, 3.5_
  
  - [x] 17.4 Add global responsive utilities
    - Prevent horizontal scrolling (overflow-x: hidden on body)
    - Ensure max-width: 100% on all grids and tables
    - Add touch target size classes
    - Ensure adequate spacing for touch interactions
    - _Requirements: 3.5, 3.7_
  
  - [ ]* 17.5 Write property test for mobile view layout
    - **Property 13: Responsive Layout - Mobile View**
    - **Validates: Requirements 3.1**
    - Test that viewport < 768px renders single-column grid
  
  - [ ]* 17.6 Write property test for tablet view layout
    - **Property 14: Responsive Layout - Tablet View**
    - **Validates: Requirements 3.3**
    - Test that viewport [768, 1024) renders two-column grid
  
  - [ ]* 17.7 Write property test for desktop view layout
    - **Property 15: Responsive Layout - Desktop View**
    - **Validates: Requirements 3.4**
    - Test that viewport >= 1024px renders three-column grid


- [ ] 18. Implement viewport detection and state management
  - [~] 18.1 Add viewport state to App component
    - Add viewport state: 'mobile' | 'tablet' | 'desktop'
    - Implement useViewport custom hook using window.matchMedia
    - Add resize event listener with 300ms debounce
    - Update viewport state based on window width breakpoints
    - Clean up event listener on unmount
    - _Requirements: 3.1, 3.3, 3.4_
  
  - [~] 18.2 Implement hamburger menu for mobile
    - Add hamburger menu button component
    - Add menu open/closed state
    - Toggle navbar visibility on button click
    - Position navbar as overlay when open in mobile view
    - Close menu on navigation item click
    - _Requirements: 3.6_

- [~] 19. Checkpoint - Responsive design complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Integrate all new features into App component
  - [~] 20.1 Add state management for alerts and wishlist
    - Add alerts state array
    - Add wishlist state array
    - Add currentView state for view switching
    - Fetch alerts and wishlist on component mount
    - _Requirements: 1.5, 2.3_
  
  - [~] 20.2 Wire alert functionality to PriceCards
    - Pass hasAlert prop by checking if listing has active alerts
    - Implement handleSetAlert method to show alert creation modal/form
    - Implement handleDeleteAlert method to delete alerts
    - Fetch alerts by listing ID when needed
    - _Requirements: 1.1, 1.6, 1.8_
  
  - [~] 20.3 Wire wishlist functionality to PriceCards
    - Pass inWishlist prop by checking if listing is in wishlist
    - Implement handleAddToWishlist method
    - Implement handleRemoveFromWishlist method
    - Check wishlist status on search results load
    - _Requirements: 2.1, 2.6, 2.8_


- [ ] 21. Create alert creation modal/form
  - [~] 21.1 Implement AlertCreationModal component
    - Create `frontend/src/components/AlertCreationModal.tsx`
    - Accept listing and onSubmit callback props
    - Display current price
    - Add input field for alert threshold
    - Validate threshold < current price on client side
    - Display validation error if threshold invalid
    - Submit alert data to API on form submit
    - Close modal on successful creation
    - _Requirements: 1.1, 1.7_
  
  - [ ]* 21.2 Write property test for alert validation
    - **Property 5: Price Alert Validation**
    - **Validates: Requirements 1.7**
    - Test that threshold >= current price fails validation with error message

- [ ] 22. Add navigation controls for view switching
  - [~] 22.1 Add navigation menu with view links
    - Add "Search" navigation link
    - Add "Wishlist" navigation link
    - Add "Alerts" navigation link (display alerts panel)
    - Update currentView state on link clicks
    - Conditionally render Search/Wishlist/Comparison views based on currentView
    - _Requirements: 2.3_
  
  - [~] 22.2 Implement view routing logic
    - Show search results and alerts panel in 'search' view
    - Show WishlistView component in 'wishlist' view
    - Show ComparisonView component in 'comparison' view
    - Add "Back to Results" button in comparison view
    - _Requirements: 4.3, 4.8_

- [ ] 23. Add loading indicators and error handling
  - [~] 23.1 Add loading states for async operations
    - Add loading state for alerts fetch
    - Add loading state for wishlist fetch
    - Display spinner or skeleton loader during loading
    - _Requirements: 1.5, 2.3_
  
  - [~] 23.2 Implement error handling for API failures
    - Display error message toast for failed alert creation
    - Display error message for failed wishlist addition
    - Handle network errors gracefully
    - Display specific error for wishlist full (50-item limit)
    - _Requirements: 1.2, 2.2, 2.9_


- [~] 24. Checkpoint - Integration complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Set up property-based testing infrastructure
  - [ ]* 25.1 Create test generators for dashboard enhancements
    - Create `backend/src/test/dashboard-generators.ts`
    - Implement priceAlertGenerator() for generating valid PriceAlert data
    - Implement wishlistItemGenerator() for generating valid WishlistItem data
    - Implement viewportWidthGenerator() for responsive testing (0-2000px)
    - Implement comparisonSelectionGenerator() for 0-5 listings
    - _Requirements: All_
  
  - [ ]* 25.2 Configure property test settings
    - Set minimum 100 iterations per property test
    - Configure seed-based reproducibility
    - Add test tags for traceability (Feature: dashboard-enhancements, Property N)
    - Ensure fast-check is properly configured in both frontend and backend

- [ ] 26. Optimize mobile performance
  - [~] 26.1 Implement code splitting for new views
    - Use React.lazy() to lazy load WishlistView component
    - Use React.lazy() to lazy load ComparisonView component
    - Add Suspense boundaries with loading fallbacks
    - _Requirements: 3.9_
  
  - [~] 26.2 Add image optimization for wishlist
    - Add loading="lazy" attribute to wishlist item images
    - Implement placeholder images while loading
    - Optimize image sizes (max 100KB per image)
    - _Requirements: 3.9_
  
  - [~] 26.3 Add performance monitoring
    - Measure page load time on mobile
    - Target < 3 seconds on 4G connection
    - Add console logging for performance metrics
    - _Requirements: 3.9_


- [ ] 27. Accessibility enhancements
  - [~] 27.1 Add ARIA labels to new interactive elements
    - Add aria-label to alert buttons
    - Add aria-label to wishlist buttons
    - Add aria-label to compare checkboxes
    - Add aria-label to delete buttons in alerts panel
    - Add aria-label to remove buttons in wishlist and comparison views
    - _Requirements: 3.7_
  
  - [~] 27.2 Ensure keyboard navigation
    - Test tab navigation through all new controls
    - Add keyboard shortcuts for common actions (optional)
    - Ensure focus indicators are visible
    - Test screen reader compatibility
    - _Requirements: 3.7_
  
  - [~] 27.3 Verify color contrast
    - Check color contrast for all new UI elements
    - Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
    - Test price change indicators (up/down colors)
    - Test best value highlighting in comparison table
    - _Requirements: All_

- [~] 28. Final checkpoint - Complete testing and validation
  - Run full test suite (unit, property, integration)
  - Verify all acceptance criteria are met for each requirement
  - Test all critical user flows:
    - Create alert → notification check → delete alert
    - Add to wishlist → view wishlist → remove item
    - Select products → compare → remove from comparison
    - Resize viewport → verify responsive layouts
  - Check test coverage (target ≥80% frontend, ≥80% backend for new code)
  - Test mobile performance on emulated 4G connection
  - Ensure all tests pass, ask the user if questions arise.

