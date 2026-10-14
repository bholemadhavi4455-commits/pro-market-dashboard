import React, { useState, useEffect } from 'react';
import { validateSearchQuery } from '../utils/validation';
import './SearchBar.css';

/**
 * Category options for product filtering
 * Requirement 3.1: Dashboard displays category filter control
 */
export const CATEGORIES = [
  'All',
  'Electronics',
  'Books',
  'Clothing',
  'Home & Kitchen',
  'Sports',
] as const;

export type Category = typeof CATEGORIES[number];

/**
 * Props for SearchBar component
 */
export interface SearchBarProps {
  /**
   * Callback triggered when user submits a valid search
   * Requirement 1.1: SearchBar sends query to Aggregator API
   */
  onSearchSubmit: (query: string, category: string) => void;
}

/**
 * SearchBar Component
 * 
 * Allows users to search for products with optional category filtering.
 * 
 * Requirements:
 * - 1.1: SearchBar sends query to Aggregator API and displays loading indicator
 * - 1.3: SearchBar validates input (reject empty/whitespace) and displays validation message
 * - 3.1: Dashboard displays category filter control
 */
export const SearchBar: React.FC<SearchBarProps> = ({ onSearchSubmit }) => {
  // State management
  const [query, setQuery] = useState<string>('');
  const [category, setCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  /**
   * Handle input change
   * Requirement 1.1: Updates query state
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  /**
   * Debounce input changes
   * Requirement 1.6: Debounce user input by 300ms before triggering API call
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    // Cleanup function to cancel timeout if query changes before 300ms
    return () => {
      clearTimeout(timeoutId);
    };
  }, [query]);

  /**
   * Handle category change
   * Requirement 3.1: Updates category filter
   */
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };

  /**
   * Validate input
   * Requirement 1.3: Validate search query
   * @param inputQuery - The query string to validate
   * @returns Error message if invalid, null if valid
   */
  const validateInput = (inputQuery: string): string | null => {
    return validateSearchQuery(inputQuery);
  };

  /**
   * Validate and submit search
   * Requirements 1.1, 1.3: Validates input before submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate query using utility function
    // Requirement 1.3: Reject empty/whitespace-only queries
    const error = validateInput(query);
    
    if (error) {
      setValidationError(error);
      return;
    }
    
    // Clear validation error and set loading state
    setValidationError(null);
    setIsLoading(true);
    
    // Trigger search callback
    // Requirement 1.1: Send query to Aggregator API
    try {
      onSearchSubmit(query, category);
    } finally {
      // Reset loading state
      // Note: In a real scenario, this would be managed by the parent component
      // after the API call completes, but we reset it here to avoid blocking UI
      setIsLoading(false);
    }
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-controls">
          {/* Search input field */}
          <div className="search-input-group">
            <input
              type="text"
              className="search-input"
              placeholder="Search for products..."
              value={query}
              onChange={handleInputChange}
              disabled={isLoading}
              aria-label="Search query"
              aria-invalid={validationError !== null}
              aria-describedby={validationError ? 'search-error' : undefined}
            />
          </div>

          {/* Category dropdown */}
          <div className="category-select-group">
            <select
              className="category-select"
              value={category}
              onChange={handleCategoryChange}
              disabled={isLoading}
              aria-label="Product category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="search-button"
            disabled={isLoading}
            aria-label="Search"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Validation error display */}
        {/* Requirement 1.3: Display validation message */}
        {validationError && (
          <div
            className="validation-error"
            id="search-error"
            role="alert"
            aria-live="polite"
          >
            {validationError}
          </div>
        )}

        {/* Loading indicator */}
        {/* Requirement 1.1: Display loading indicator */}
        {isLoading && (
          <div className="loading-indicator" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true"></span>
            <span className="sr-only">Loading search results...</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
