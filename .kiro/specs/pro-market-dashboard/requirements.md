# Requirements Document

## Introduction

PRO Market Dashboard is a web application that searches, aggregates, and analyzes product market rates across multiple online sources. Users can search for any product by name or category, compare prices across retailers/marketplaces, read aggregated customer reviews, view price history trends, and receive a data-driven "best pick" recommendation based on price, rating, and review sentiment. The application consists of a React frontend and a Node.js/Express backend that orchestrates data fetching from multiple external sources.

---

## Glossary

- **Dashboard**: The main web interface users interact with to search and view product data.
- **Product**: Any consumer good that can be searched, listed, and compared across sources.
- **Source**: An external website or API (e.g., a marketplace or retailer) from which product listings are fetched.
- **Listing**: A single product entry from one Source, containing a name, price, source identifier, rating, and review count.
- **Aggregator**: The backend service responsible for fetching and combining Listings from multiple Sources for a given search query.
- **Category**: A named classification used to group Products (e.g., "Electronics", "Books", "Clothing").
- **PriceCard**: The UI component that displays a single Listing's price, source, and rating.
- **ChartBox**: The UI component that renders a price-history trend chart for a selected Product.
- **SearchBar**: The UI component through which users enter a search query and optional Category filter.
- **BestPick**: The algorithmically selected Listing recommended to the user based on a composite score of price, rating, and review count.
- **CompositeScore**: A normalized numeric value (0–100) computed from normalized price rank, star rating, and review volume, used to determine the BestPick.
- **ReviewSummary**: An aggregated display of customer review count and average star rating for a Listing.
- **PriceHistory**: A time-ordered series of recorded prices for a Product at a given Source.
- **API**: Application Programming Interface — the backend REST endpoints consumed by the frontend.

---

## Requirements

### Requirement 1: Product Search

**User Story:** As a user, I want to search for a product by name so that I can find and compare relevant listings across sources.

#### Acceptance Criteria

1. WHEN a user submits a non-empty search query, THE SearchBar SHALL send the query to the Aggregator API and display a loading indicator until results are returned.
2. WHEN the Aggregator returns Listings, THE Dashboard SHALL render one PriceCard per Listing in the results area.
3. IF the search query is empty or contains only whitespace, THEN THE SearchBar SHALL display an inline validation message and SHALL NOT submit the query to the API.
4. IF the Aggregator returns zero Listings for a query, THEN THE Dashboard SHALL display a "No results found" message with a suggestion to broaden the search.
5. IF the Aggregator API returns an error response, THEN THE Dashboard SHALL display a user-readable error message and SHALL preserve the previous results if any existed.
6. THE SearchBar SHALL debounce user input by 300 milliseconds before triggering an API call to prevent excessive requests.

---

### Requirement 2: Multi-Source Aggregation

**User Story:** As a user, I want results pulled from multiple sources so that I can see the full market landscape for a product.

#### Acceptance Criteria

1. WHEN a search query is received, THE Aggregator SHALL query at least two distinct external Sources in parallel and combine their responses into a single Listings array.
2. THE Aggregator SHALL attach a `source` identifier field to each Listing indicating which Source it originated from.
3. IF one Source returns an error or times out within 5 seconds, THEN THE Aggregator SHALL continue processing results from the remaining Sources and SHALL log the failed Source.
4. THE Aggregator SHALL deduplicate Listings where the product name and source are identical, retaining the most recently fetched entry.
5. THE Aggregator SHALL return the combined Listings array sorted by CompositeScore in descending order by default.

---

### Requirement 3: Category Filtering

**User Story:** As a user, I want to filter product results by category so that I can narrow down the listings to the type of product I am interested in.

#### Acceptance Criteria

1. THE Dashboard SHALL display a category filter control containing at least the following categories: Electronics, Books, Clothing, Home & Kitchen, Sports, and All.
2. WHEN a user selects a category other than "All", THE Dashboard SHALL filter the displayed Listings to only those whose `category` field matches the selected category.
3. WHEN a user selects "All", THE Dashboard SHALL display all Listings regardless of category.
4. WHEN a new search query is submitted, THE Dashboard SHALL reset the active category filter to "All".
5. THE Aggregator SHALL accept an optional `category` query parameter and, WHEN provided, SHALL request only category-matching Listings from each Source.

---

### Requirement 4: Price Comparison Display

**User Story:** As a user, I want to see prices from all sources side by side so that I can identify the best deal at a glance.

#### Acceptance Criteria

1. THE PriceCard SHALL display the product name, source name, price (in the user's local currency), star rating, and review count for each Listing.
2. THE Dashboard SHALL highlight the PriceCard with the lowest price among the current result set using a distinct visual indicator.
3. WHEN multiple Listings for the same product exist from different Sources, THE Dashboard SHALL display each as a separate PriceCard to enable direct price comparison.
4. THE Dashboard SHALL display the total number of Sources contributing results for the current query.
5. WHEN a user clicks a PriceCard, THE Dashboard SHALL open the Source URL for that Listing in a new browser tab.

---

### Requirement 5: Price History Chart

**User Story:** As a user, I want to view a price history trend for a product so that I can understand how prices have changed over time.

#### Acceptance Criteria

1. WHEN a user selects a Listing, THE ChartBox SHALL display a line chart of that Listing's PriceHistory spanning the most recent 30 days.
2. THE ChartBox SHALL label the horizontal axis with dates and the vertical axis with price values in the displayed currency.
3. WHEN fewer than 2 PriceHistory data points exist for a Listing, THE ChartBox SHALL display a "Insufficient history data" notice instead of an empty chart.
4. THE ChartBox SHALL support toggling between 7-day, 30-day, and 90-day PriceHistory ranges.
5. THE Aggregator SHALL store each fetched price as a PriceHistory record with a timestamp so that historical data accumulates over time.

---

### Requirement 6: Customer Reviews Display

**User Story:** As a user, I want to see customer reviews for a product so that I can gauge quality and buyer satisfaction before making a purchasing decision.

#### Acceptance Criteria

1. THE PriceCard SHALL display the ReviewSummary for each Listing, showing the average star rating (to one decimal place) and the total review count.
2. WHEN a user expands a PriceCard, THE Dashboard SHALL display up to 5 of the most recent customer review excerpts (up to 200 characters each) sourced from the corresponding Source.
3. IF a Source does not provide review data, THEN THE Dashboard SHALL display "Reviews unavailable" for that Listing's ReviewSummary.
4. THE Dashboard SHALL render star ratings using a visual 5-star icon scale alongside the numeric value.
5. WHEN review excerpts are truncated to 200 characters, THE Dashboard SHALL append an ellipsis and provide a "Read more" link to the full review on the Source website.

---

### Requirement 7: BestPick Recommendation

**User Story:** As a user, I want the dashboard to recommend the best product among all results so that I can make a confident purchasing decision without manually comparing every listing.

#### Acceptance Criteria

1. WHEN at least 2 Listings are present in the results, THE Dashboard SHALL display a BestPick banner identifying the recommended Listing.
2. THE Aggregator SHALL compute a CompositeScore for each Listing using the formula: `(0.5 × normalized_price_rank) + (0.3 × normalized_rating) + (0.2 × normalized_review_count)`, where each factor is normalized to a 0–1 scale within the current result set.
3. THE Aggregator SHALL select the Listing with the highest CompositeScore as the BestPick.
4. WHEN two or more Listings share the highest CompositeScore, THE Aggregator SHALL select the Listing with the lower price as the BestPick.
5. THE BestPick banner SHALL display the product name, source, price, star rating, and the reason for selection (e.g., "Best price", "Highest rated", "Most reviewed").
6. IF fewer than 2 Listings are returned, THEN THE Dashboard SHALL NOT display the BestPick banner.

---

### Requirement 8: Search Results Sorting

**User Story:** As a user, I want to sort search results by different criteria so that I can view listings in the order most relevant to my priorities.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a sort control with the following options: Best Match (default, by CompositeScore), Lowest Price, Highest Rating, and Most Reviews.
2. WHEN a user selects a sort option, THE Dashboard SHALL re-order the displayed PriceCards immediately without a new API call.
3. WHEN a new search query is submitted, THE Dashboard SHALL reset the sort order to "Best Match".

---

### Requirement 9: Backend API

**User Story:** As a developer, I want a well-structured REST API so that the frontend can reliably fetch and display product data.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/search?q={query}&category={category}` endpoint that returns an array of Listings in JSON format.
2. THE API SHALL expose a `GET /api/listing/:id/history?range={days}` endpoint that returns the PriceHistory array for a specific Listing.
3. THE API SHALL expose a `GET /api/listing/:id/reviews` endpoint that returns up to 20 review objects for a specific Listing.
4. THE API SHALL respond to all endpoints with an HTTP 400 status and a descriptive error message when required parameters are missing or invalid.
5. THE API SHALL respond with an HTTP 200 status and the data payload for all successful requests.
6. THE API SHALL include CORS headers permitting requests from the frontend origin.
7. WHEN a request to an external Source times out after 5 seconds, THE API SHALL return cached data for that Source if available, or exclude that Source from results.

---

### Requirement 10: Data Persistence and Caching

**User Story:** As a user, I want the application to respond quickly and show up-to-date data so that my experience is smooth and reliable.

#### Acceptance Criteria

1. THE Aggregator SHALL cache the result of each unique search query for 10 minutes, returning the cached response for subsequent identical queries within that window.
2. WHEN cached data is returned, THE API SHALL include a `X-Cache: HIT` response header and a `cachedAt` timestamp field in the response body.
3. THE Aggregator SHALL store PriceHistory records in a persistent data store so that historical data is not lost when the server restarts.
4. WHEN a PriceHistory record for a Listing already exists at the same timestamp (within a 1-hour window), THE Aggregator SHALL update the existing record rather than creating a duplicate.
