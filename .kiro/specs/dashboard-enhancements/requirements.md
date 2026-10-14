# Requirements Document

## Introduction

The Dashboard Enhancements feature extends the existing PRO Market Dashboard with four key capabilities: price drop alerts, a wishlist for favorite products, improved mobile responsiveness, and side-by-side product comparison. These enhancements enable users to track products of interest, receive price notifications, enjoy an optimized mobile experience, and make more informed purchasing decisions through direct product comparisons.

---

## Glossary

- **Dashboard**: The main web interface of the PRO Market Dashboard application where users search and view product data.
- **PriceAlert**: A user-configured notification rule that triggers when a Listing's price drops below a specified threshold.
- **Wishlist**: A user-curated collection of saved Listings that can be revisited and monitored over time.
- **WishlistItem**: A single saved Listing stored in a user's Wishlist, containing the product name, source, current price, and timestamp of addition.
- **Listing**: A single product entry from one Source, containing name, price, source identifier, rating, and review count.
- **ComparisonView**: A UI feature that displays two or more selected Listings in a side-by-side layout with aligned attributes for direct comparison.
- **ComparisonTable**: The visual component within the ComparisonView that renders product attributes in aligned rows for easy comparison.
- **MobileView**: The responsive layout optimized for viewport widths below 768 pixels.
- **TabletView**: The responsive layout optimized for viewport widths between 768 and 1024 pixels.
- **DesktopView**: The responsive layout optimized for viewport widths of 1024 pixels and above.
- **AlertThreshold**: The user-specified price value that triggers a PriceAlert when a Listing's price drops to or below this value.
- **NotificationService**: The backend service responsible for checking prices against active PriceAlerts and delivering notifications to users.
- **PersistenceService**: The backend service responsible for storing and retrieving user data including Wishlists, PriceAlerts, and WishlistItems.

---

## Requirements

### Requirement 1: Price Drop Alerts

**User Story:** As a user, I want to set price alerts for products so that I can be notified when prices drop to my desired level.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a "Set Alert" control on each PriceCard that allows users to specify an AlertThreshold price value.
2. WHEN a user creates a PriceAlert, THE PersistenceService SHALL store the alert with the Listing ID, AlertThreshold value, and creation timestamp.
3. THE NotificationService SHALL check all active PriceAlerts against current Listing prices every 60 minutes.
4. WHEN a Listing's current price drops to or below its associated AlertThreshold, THE NotificationService SHALL trigger a notification and mark the PriceAlert as triggered.
5. THE Dashboard SHALL display all active PriceAlerts in an "Alerts" panel showing the product name, source, AlertThreshold, and current price.
6. WHEN a user deletes a PriceAlert, THE PersistenceService SHALL remove the alert from storage and THE Dashboard SHALL remove it from the Alerts panel.
7. IF a user attempts to create a PriceAlert with an AlertThreshold greater than or equal to the current price, THEN THE Dashboard SHALL display a validation message requiring the threshold to be lower than the current price.
8. THE Dashboard SHALL display a visual indicator on PriceCards that have active PriceAlerts associated with them.

---

### Requirement 2: Wishlist Functionality

**User Story:** As a user, I want to save favorite products to a wishlist so that I can easily track and revisit items I am interested in purchasing.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a "Add to Wishlist" control on each PriceCard that allows users to save a Listing to their Wishlist.
2. WHEN a user adds a Listing to the Wishlist, THE PersistenceService SHALL create a WishlistItem containing the Listing ID, product name, source, current price, and addition timestamp.
3. THE Dashboard SHALL provide a dedicated "Wishlist" view accessible from the main navigation that displays all saved WishlistItems.
4. THE Wishlist view SHALL display each WishlistItem with the product name, source, original saved price, current price, and price change indicator.
5. WHEN a WishlistItem's current price differs from the saved price, THE Dashboard SHALL display a visual indicator showing the price increase or decrease percentage.
6. THE Dashboard SHALL allow users to remove WishlistItems from the Wishlist, and THE PersistenceService SHALL delete the corresponding record.
7. WHEN a user clicks a WishlistItem, THE Dashboard SHALL navigate to the product search results page with that product pre-loaded.
8. THE Dashboard SHALL display a visual indicator on PriceCards showing whether a Listing is already in the user's Wishlist.
9. THE Dashboard SHALL limit each Wishlist to a maximum of 50 WishlistItems, and display a message when this limit is reached.

---

### Requirement 3: Mobile Optimization

**User Story:** As a mobile user, I want the dashboard interface to be fully usable on my smartphone so that I can search and compare products while on the go.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768 pixels, THE Dashboard SHALL render in MobileView with a single-column layout for all PriceCards.
2. THE MobileView SHALL display the SearchBar with full-width input controls that are touch-optimized with minimum touch target sizes of 44x44 pixels.
3. WHEN the viewport width is between 768 and 1024 pixels, THE Dashboard SHALL render in TabletView with a two-column grid layout for PriceCards.
4. WHEN the viewport width is 1024 pixels or greater, THE Dashboard SHALL render in DesktopView with a three-column grid layout for PriceCards.
5. THE Dashboard SHALL use responsive typography that scales appropriately for MobileView, TabletView, and DesktopView without requiring horizontal scrolling.
6. THE MobileView SHALL display navigation controls in a collapsible hamburger menu to conserve screen space.
7. THE Dashboard SHALL ensure all interactive controls including buttons, links, and form inputs are touch-accessible with adequate spacing in MobileView.
8. THE ChartBox SHALL display simplified charts in MobileView with legible axis labels and touch-enabled data point tooltips.
9. THE Dashboard SHALL load and render efficiently on mobile devices with page load times under 3 seconds on 4G connections.

---

### Requirement 4: Product Comparison View

**User Story:** As a user, I want to compare products side-by-side so that I can easily see differences in price, ratings, features, and make informed decisions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a "Compare" checkbox on each PriceCard that allows users to select Listings for comparison.
2. WHEN at least 2 and no more than 4 Listings are selected for comparison, THE Dashboard SHALL display a "Compare Selected" button.
3. WHEN a user clicks "Compare Selected", THE Dashboard SHALL navigate to the ComparisonView displaying the selected Listings.
4. THE ComparisonView SHALL display a ComparisonTable with each selected Listing in a separate column and the following attributes in aligned rows: product name, source, price, rating, review count, and category.
5. THE ComparisonTable SHALL highlight the best value in each attribute row using distinct visual styling.
6. THE ComparisonView SHALL display PriceHistory charts for each selected Listing in aligned columns for visual trend comparison.
7. THE ComparisonView SHALL provide a "Remove from Comparison" control for each Listing that removes it from the comparison without navigating away.
8. WHEN fewer than 2 Listings remain in the ComparisonView, THE Dashboard SHALL display a message prompting the user to select additional products and provide a "Back to Results" navigation control.
9. THE Dashboard SHALL persist the comparison selection state when navigating between search results and ComparisonView within the same session.
10. IF a user attempts to select more than 4 Listings for comparison, THEN THE Dashboard SHALL display a validation message indicating the maximum limit and prevent additional selections.

