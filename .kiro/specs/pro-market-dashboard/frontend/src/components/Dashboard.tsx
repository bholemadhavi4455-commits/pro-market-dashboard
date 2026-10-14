import React, { useState } from 'react';
import { Listing } from '../types';
import SearchBar from './SearchBar';
import { countUniqueSources } from '../utils/validation';
import './Dashboard.css';

/**
 * Sort options for displaying listings
 * Requirement 8.1: Dashboard provides sort control with options
 */
export const SORT_OPTIONS = [
  'Best Match',
  'Lowest Price',
  'Highest Rating',
  'Most Reviews',
] as const;

export type SortOption = typeof SORT_OPTIONS[number];

/**
 * Props for Dashboard component
 */
export interface DashboardProps {
  /**
   * Callback to execute search against backend API
   * Requirement 1.1: Send query to Aggregator API
   */
  onSearch: (query: string, category: string) => Promise<{
    listings: Listing[];
    bestPick: Listing | null;
    sourcesCount: number;
    error?: string;
  }>;
}

/**
 * Dashboard Component
 * 
 * Main interface for searching and viewing product listings with filtering and sorting.
 * 
 * Requirements:
 * - 1.2: Dashboard renders one PriceCard per Listing
 * - 3.2: Dashboard filters displayed Listings by selected category
 * - 8.1: Dashboard provides sort control with options
 */
export const Dashboard: React.FC<DashboardProps> = ({ onSearch }) => {
  // State for listings data
  const [listings, setListings] = useState<Listing[]>([]);
  const [bestPick, setBestPick] = useState<Listing | null>(null);
  const [sourcesCount, setSourcesCount] = useState<number>(0);
  
  // State for UI controls
  const [sortBy, setSortBy] = useState<SortOption>('Best Match');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store last search query for retry functionality
  // Requirement 1.5: Preserve previous results on error and allow retry
  const [lastQuery, setLastQuery] = useState<string>('');
  const [lastCategory, setLastCategory] = useState<string>('All');

  /**
   * Handle search submission from SearchBar
   * Requirement 1.1: SearchBar sends query to Aggregator API
   * Requirement 3.4: Reset category filter to "All" on new search
   * Requirement 1.5: Preserve previous results on error
   */
  const handleSearchSubmit = async (query: string, category: string) => {
    // Store query and category for retry functionality
    // Requirement 1.5: Enable retry on error
    setLastQuery(query);
    setLastCategory(category);
    
    // Reset sort to Best Match on new search
    // Requirement 8.3: Reset sort order to Best Match on new search
    setSortBy('Best Match');
    
    // Reset category filter to "All" on new search
    // Requirement 3.4: Dashboard resets active category filter to "All" on new search
    setCategoryFilter('All');
    
    // Set loading state
    setIsLoading(true);
    setError(null);
    
    try {
      // Delegate to parent component's search handler
      const result = await onSearch(query, category);
      
      // Update state with results
      // Requirement 1.5: Only update listings if no error
      if (result.error) {
        setError(result.error);
        // Preserve previous results - do NOT clear listings
      } else {
        setListings(result.listings || []);
        setBestPick(result.bestPick || null);
        // Requirement 4.4: Store source count from API response
        setSourcesCount(result.sourcesCount || 0);
        setError(null);
      }
    } catch (err) {
      // Handle error and preserve previous results
      // Requirement 1.5: Preserve previous results if any existed before error
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      // Do NOT clear listings - previous results are preserved
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle retry after error
   * Requirement 1.5: Retry button to re-execute search after error
   */
  const handleRetry = async () => {
    if (lastQuery) {
      // Clear error and retry with last query
      setError(null);
      setIsLoading(true);
      
      try {
        const result = await onSearch(lastQuery, lastCategory);
        
        // Update state with results
        if (result.error) {
          setError(result.error);
          // Preserve previous results - do NOT clear listings
        } else {
          setListings(result.listings || []);
          setBestPick(result.bestPick || null);
          // Requirement 4.4: Store source count from API response
          setSourcesCount(result.sourcesCount || 0);
          setError(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        // Preserve previous results
      } finally {
        setIsLoading(false);
      }
    }
  };

  /**
   * Handle sort option change
   * Requirement 8.2: Re-order displayed PriceCards immediately without new API call
   */
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value as SortOption;
    setSortBy(newSortBy);
  };

  /**
   * Sort listings based on selected sort option
   * Requirement 8.2: Client-side sorting implementation
   */
  const sortListings = (listingsToSort: Listing[]): Listing[] => {
    const sorted = [...listingsToSort];
    
    switch (sortBy) {
      case 'Best Match':
        // Sort by compositeScore descending (highest first)
        return sorted.sort((a, b) => b.compositeScore - a.compositeScore);
      
      case 'Lowest Price':
        // Sort by price ascending (lowest first)
        return sorted.sort((a, b) => a.price - b.price);
      
      case 'Highest Rating':
        // Sort by rating descending (highest first)
        return sorted.sort((a, b) => b.rating - a.rating);
      
      case 'Most Reviews':
        // Sort by reviewCount descending (most first)
        return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
      
      default:
        return sorted;
    }
  };

  /**
   * Filter listings by category
   * Requirement 3.2: Filter displayed Listings by selected category
   */
  const filterListingsByCategory = (listingsToFilter: Listing[]): Listing[] => {
    if (categoryFilter === 'All') {
      // Requirement 3.3: Display all Listings when "All" is selected
      return listingsToFilter;
    }
    
    // Filter to only listings matching the selected category
    return listingsToFilter.filter(
      (listing) => listing.category === categoryFilter
    );
  };

  /**
   * Find the listing with the lowest price
   * Requirement 4.2: Highlight the PriceCard with the lowest price
   * 
   * @param listingsToCheck - Array of listings to check
   * @returns The ID of the listing with the lowest price, or null if no listings
   */
  const findLowestPrice = (listingsToCheck: Listing[]): string | null => {
    if (listingsToCheck.length === 0) {
      return null;
    }
    
    // Find listing with minimum price value
    const lowestPriceListing = listingsToCheck.reduce((lowest, current) => 
      current.price < lowest.price ? current : lowest
    );
    
    return lowestPriceListing.id;
  };

  /**
   * Get sorted and filtered listings for display
   * Applies category filtering first, then sorting
   * Requirements 3.2, 3.3, 8.2: Filter by category, then sort
   */
  const getDisplayedListings = (): Listing[] => {
    const filtered = filterListingsByCategory(listings);
    const sorted = sortListings(filtered);
    return sorted;
  };

  /**
   * Render no results state
   * Requirement 1.4: Display "No results found" message with suggestions
   */
  const renderNoResults = () => (
    <div className="no-results" role="status" aria-live="polite">
      <div className="no-results-icon" aria-hidden="true">🔍</div>
      <p className="no-results-message">No results found</p>
      <p className="no-results-suggestion">
        Try broadening your search or selecting a different category.
      </p>
    </div>
  );

  /**
   * Render error state with retry button
   * Requirement 1.5: Display user-readable error message with retry button
   * Requirement 1.5: Preserve previous results if any existed before error
   */
  const renderError = () => (
    <div className="error-state" role="alert" aria-live="assertive">
      <div className="error-content">
        <span className="error-icon" aria-hidden="true">⚠️</span>
        <p className="error-message">{error || 'An error occurred'}</p>
      </div>
      <button
        className="retry-button"
        onClick={handleRetry}
        aria-label="Retry search"
        type="button"
      >
        🔄 Retry
      </button>
    </div>
  );

  /**
   * Render loading state
   * Requirement 1.1: Display loading indicator
   */
  const renderLoading = () => (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true"></div>
      <p className="loading-message">Loading results...</p>
    </div>
  );

  // Get listings to display after filtering and sorting
  const displayedListings = getDisplayedListings();
  
  // Find the listing with the lowest price for highlighting
  // Requirement 4.2: Highlight the PriceCard with the lowest price
  const lowestPriceId = findLowestPrice(displayedListings);

  return (
    <div className="dashboard">
      {/* Search bar section */}
      <div className="dashboard-search-section">
        <SearchBar onSearchSubmit={handleSearchSubmit} />
      </div>

      {/* Sort and filter controls */}
      <div className="dashboard-controls">
        {/* Category filter control */}
        {/* Requirement 3.1: Dashboard displays category filter control */}
        {/* Requirement 3.2: Filter displayed Listings by selected category */}
        {/* Requirement 3.4: Reset to "All" on new search (handled in handleSearchSubmit) */}
        <div className="category-filter-control">
          <label htmlFor="category-filter-select" className="category-filter-label">
            Category:
          </label>
          <select
            id="category-filter-select"
            className="category-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={isLoading || listings.length === 0}
            aria-label="Filter by category"
          >
            <option value="All">All</option>
            <option value="Electronics">Electronics</option>
            <option value="Books">Books</option>
            <option value="Clothing">Clothing</option>
            <option value="Home & Kitchen">Home & Kitchen</option>
            <option value="Sports">Sports</option>
          </select>
        </div>

        {/* Sort control */}
        {/* Requirement 8.1: Provide sort control with options */}
        <div className="sort-control">
          <label htmlFor="sort-select" className="sort-label">
            Sort by:
          </label>
          <select
            id="sort-select"
            className="sort-select"
            value={sortBy}
            onChange={handleSortChange}
            disabled={isLoading || displayedListings.length === 0}
            aria-label="Sort results by"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        {displayedListings.length > 0 && (
          <div className="results-count" aria-live="polite">
            {displayedListings.length} {displayedListings.length === 1 ? 'result' : 'results'}
            {/* Requirement 4.4: Display total number of Sources contributing results */}
            {sourcesCount > 0 && (
              <span className="sources-count">
                {' • '}
                {sourcesCount} {sourcesCount === 1 ? 'source' : 'sources'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results area */}
      <div className="dashboard-results">
        {/* Loading state */}
        {isLoading && renderLoading()}

        {/* Error state */}
        {/* Requirement 1.5: Display error message and preserve previous results if existed */}
        {error && renderError()}

        {/* Previous results preserved during error */}
        {/* Requirement 1.5: Preserve previous results on error */}
        {error && listings.length > 0 && (
          <div className="preserved-results-notice" role="status" aria-live="polite">
            <p>Showing previous results</p>
          </div>
        )}

        {/* No results state */}
        {/* Requirement 1.4: Display no results message */}
        {!isLoading && !error && displayedListings.length === 0 && listings.length === 0 && renderNoResults()}

        {/* Results grid */}
        {/* Requirement 1.2: Dashboard renders one PriceCard per Listing */}
        {!isLoading && displayedListings.length > 0 && (
          <div className="results-grid">
            {displayedListings.map((listing) => {
              // Determine if this listing has the lowest price
              // Requirement 4.2: Highlight the PriceCard with the lowest price
              const isLowestPrice = listing.id === lowestPriceId;
              
              return (
                <div key={listing.id} className="price-card-placeholder">
                  {/* PriceCard component will be rendered here with isLowestPrice prop */}
                  {/* 
                    TODO: Replace with actual PriceCard component (Task 15.1)
                    <PriceCard 
                      listing={listing}
                      isLowestPrice={isLowestPrice}
                      isBestPick={listing.id === bestPick?.id}
                      onExpand={handleExpandListing}
                      onClickBuyLink={handleBuyLink}
                    />
                  */}
                  <div className="listing-preview">
                    <h3>{listing.productName}</h3>
                    <p>Source: {listing.source}</p>
                    <p>Price: {listing.price} {listing.currency}</p>
                    <p>Rating: {listing.rating} ⭐ ({listing.reviewCount} reviews)</p>
                    {isLowestPrice && (
                      <span className="lowest-price-badge" style={{ color: 'green', fontWeight: 'bold' }}>
                        🏆 Lowest Price
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filtered results message */}
        {!isLoading && displayedListings.length === 0 && listings.length > 0 && (
          <div className="filtered-no-results" role="status">
            <p>No results match the current category filter.</p>
            <p>Try selecting "All" categories to see more results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
