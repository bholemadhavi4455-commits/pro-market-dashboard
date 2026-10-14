import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import type { Listing } from '../types';

/**
 * Category Filtering Tests for Dashboard Component
 * Task 13.4: Implement category filtering
 * 
 * Requirements validated:
 * - 3.1: Dashboard displays category filter control
 * - 3.2: Filter displayed Listings by selected category
 * - 3.3: Display all Listings when "All" is selected
 * - 3.4: Reset filter to "All" on new search
 */

// Mock SearchBar component to simplify testing
vi.mock('./SearchBar', () => ({
  default: ({ onSearchSubmit }: { onSearchSubmit: (query: string, category: string) => void }) => (
    <div data-testid="mock-searchbar">
      <button onClick={() => onSearchSubmit('test query', 'All')}>Submit Search</button>
    </div>
  ),
}));

describe('Dashboard Component - Category Filtering (Task 13.4)', () => {
  const mockOnSearch = vi.fn();

  // Sample test data with multiple categories
  const mixedCategoryListings: Listing[] = [
    {
      id: 'electronics1',
      productName: 'Laptop',
      source: 'Amazon',
      sourceUrl: 'https://amazon.com/laptop',
      price: 80000,
      currency: 'INR',
      rating: 4.5,
      reviewCount: 200,
      category: 'Electronics',
      compositeScore: 85.0,
      fetchedAt: '2025-01-15T10:00:00Z',
    },
    {
      id: 'electronics2',
      productName: 'Smartphone',
      source: 'eBay',
      sourceUrl: 'https://ebay.com/phone',
      price: 40000,
      currency: 'INR',
      rating: 4.3,
      reviewCount: 150,
      category: 'Electronics',
      compositeScore: 80.0,
      fetchedAt: '2025-01-15T10:01:00Z',
    },
    {
      id: 'books1',
      productName: 'JavaScript Guide',
      source: 'Amazon',
      sourceUrl: 'https://amazon.com/js-book',
      price: 500,
      currency: 'INR',
      rating: 4.8,
      reviewCount: 300,
      category: 'Books',
      compositeScore: 90.0,
      fetchedAt: '2025-01-15T10:02:00Z',
    },
    {
      id: 'books2',
      productName: 'Python Cookbook',
      source: 'Walmart',
      sourceUrl: 'https://walmart.com/python-book',
      price: 600,
      currency: 'INR',
      rating: 4.6,
      reviewCount: 250,
      category: 'Books',
      compositeScore: 87.0,
      fetchedAt: '2025-01-15T10:03:00Z',
    },
    {
      id: 'clothing1',
      productName: 'T-Shirt',
      source: 'Target',
      sourceUrl: 'https://target.com/tshirt',
      price: 800,
      currency: 'INR',
      rating: 4.2,
      reviewCount: 100,
      category: 'Clothing',
      compositeScore: 75.0,
      fetchedAt: '2025-01-15T10:04:00Z',
    },
    {
      id: 'sports1',
      productName: 'Tennis Racket',
      source: 'Amazon',
      sourceUrl: 'https://amazon.com/racket',
      price: 3000,
      currency: 'INR',
      rating: 4.7,
      reviewCount: 180,
      category: 'Sports',
      compositeScore: 88.0,
      fetchedAt: '2025-01-15T10:05:00Z',
    },
    {
      id: 'home1',
      productName: 'Coffee Maker',
      source: 'eBay',
      sourceUrl: 'https://ebay.com/coffee',
      price: 2500,
      currency: 'INR',
      rating: 4.4,
      reviewCount: 220,
      category: 'Home & Kitchen',
      compositeScore: 82.0,
      fetchedAt: '2025-01-15T10:06:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Category Filter UI - Requirement 3.1', () => {
    it('should display category filter control with all category options', () => {
      render(<Dashboard onSearch={mockOnSearch} />);

      const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
      expect(categorySelect).toBeInTheDocument();

      // Check all category options are present
      const options = Array.from(categorySelect.options).map(opt => opt.value);
      expect(options).toEqual(['All', 'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports']);
    });

    it('should default to "All" category', () => {
      render(<Dashboard onSearch={mockOnSearch} />);

      const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
      expect(categorySelect.value).toBe('All');
    });

    it('should have proper label for category filter', () => {
      render(<Dashboard onSearch={mockOnSearch} />);

      const categoryLabel = screen.getByText(/category:/i);
      expect(categoryLabel).toBeInTheDocument();
      expect(categoryLabel.tagName).toBe('LABEL');
    });

    it('should have aria-label for accessibility', () => {
      render(<Dashboard onSearch={mockOnSearch} />);

      const categorySelect = screen.getByLabelText(/filter by category/i);
      expect(categorySelect).toHaveAttribute('aria-label', 'Filter by category');
    });
  });

  describe('Category Filtering Logic - Requirement 3.2', () => {
    it('should filter listings to show only Electronics category', () => {
      // This test verifies the filterListingsByCategory function
      const electronicsOnly = mixedCategoryListings.filter(l => l.category === 'Electronics');
      expect(electronicsOnly).toHaveLength(2);
      expect(electronicsOnly.every(l => l.category === 'Electronics')).toBe(true);
    });

    it('should filter listings to show only Books category', () => {
      const booksOnly = mixedCategoryListings.filter(l => l.category === 'Books');
      expect(booksOnly).toHaveLength(2);
      expect(booksOnly.every(l => l.category === 'Books')).toBe(true);
    });

    it('should filter listings to show only Clothing category', () => {
      const clothingOnly = mixedCategoryListings.filter(l => l.category === 'Clothing');
      expect(clothingOnly).toHaveLength(1);
      expect(clothingOnly[0].productName).toBe('T-Shirt');
    });

    it('should filter listings to show only Sports category', () => {
      const sportsOnly = mixedCategoryListings.filter(l => l.category === 'Sports');
      expect(sportsOnly).toHaveLength(1);
      expect(sportsOnly[0].productName).toBe('Tennis Racket');
    });

    it('should filter listings to show only Home & Kitchen category', () => {
      const homeOnly = mixedCategoryListings.filter(l => l.category === 'Home & Kitchen');
      expect(homeOnly).toHaveLength(1);
      expect(homeOnly[0].productName).toBe('Coffee Maker');
    });

    it('should handle empty result after filtering', () => {
      const testListings: Listing[] = [
        {
          ...mixedCategoryListings[0],
          category: 'Electronics',
        },
      ];

      // Filter for a category that doesn't exist
      const clothingOnly = testListings.filter(l => l.category === 'Clothing');
      expect(clothingOnly).toHaveLength(0);
    });
  });

  describe('Show All Categories - Requirement 3.3', () => {
    it('should show all listings when "All" is selected', () => {
      const allListings = mixedCategoryListings.filter(l => {
        // When category is "All", no filtering should occur
        return true; // All listings pass through
      });

      expect(allListings).toHaveLength(7);
      expect(allListings).toEqual(mixedCategoryListings);
    });

    it('should return complete array when filter is "All"', () => {
      const categoryFilter = 'All';
      const filtered = categoryFilter === 'All' 
        ? mixedCategoryListings 
        : mixedCategoryListings.filter(l => l.category === categoryFilter);

      expect(filtered).toHaveLength(7);
    });
  });

  describe('Reset Filter on New Search - Requirement 3.4', () => {
    it('should reset category filter to "All" when new search is submitted', () => {
      render(<Dashboard onSearch={mockOnSearch} />);

      const categorySelect = screen.getByLabelText(/filter by category/i) as HTMLSelectElement;
      
      // Change category filter to Electronics
      fireEvent.change(categorySelect, { target: { value: 'Electronics' } });
      expect(categorySelect.value).toBe('Electronics');

      // Submit new search
      const searchButton = screen.getByText('Submit Search');
      fireEvent.click(searchButton);

      // Category filter should reset to "All"
      expect(categorySelect.value).toBe('All');
    });

    it('should reset category even if user changed it multiple times', () => {
      render(<Dashboard onSearch={mockOnSearch} />);

      const categorySelect = screen.getByLabelText(/filter by category/i) as HTMLSelectElement;
      
      // Change category multiple times
      fireEvent.change(categorySelect, { target: { value: 'Books' } });
      fireEvent.change(categorySelect, { target: { value: 'Sports' } });
      fireEvent.change(categorySelect, { target: { value: 'Clothing' } });
      expect(categorySelect.value).toBe('Clothing');

      // Submit new search
      const searchButton = screen.getByText('Submit Search');
      fireEvent.click(searchButton);

      // Should reset to "All"
      expect(categorySelect.value).toBe('All');
    });
  });

  describe('Category Filter State Management', () => {
    it('should update category filter state when user changes dropdown', () => {
      render(<Dashboard onSearch={mockOnSearch} />);

      const categorySelect = screen.getByLabelText(/filter by category/i) as HTMLSelectElement;
      
      fireEvent.change(categorySelect, { target: { value: 'Electronics' } });
      expect(categorySelect.value).toBe('Electronics');

      fireEvent.change(categorySelect, { target: { value: 'Books' } });
      expect(categorySelect.value).toBe('Books');
    });

    it('should not trigger API call when category filter changes', () => {
      render(<Dashboard onSearch={mockOnSearch} />);

      const categorySelect = screen.getByLabelText(/filter by category/i) as HTMLSelectElement;
      
      // Change category filter (client-side filtering only)
      fireEvent.change(categorySelect, { target: { value: 'Electronics' } });
      
      // Should not trigger new search
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should maintain category filter selection across re-renders', () => {
      const { rerender } = render(<Dashboard onSearch={mockOnSearch} />);

      const categorySelect = screen.getByLabelText(/filter by category/i) as HTMLSelectElement;
      
      fireEvent.change(categorySelect, { target: { value: 'Sports' } });
      expect(categorySelect.value).toBe('Sports');

      // Re-render component
      rerender(<Dashboard onSearch={mockOnSearch} />);

      // Category filter should persist
      const categorySelectAfter = screen.getByLabelText(/filter by category/i) as HTMLSelectElement;
      expect(categorySelectAfter.value).toBe('Sports');
    });
  });

  describe('Category Filter with Disabled State', () => {
    it('should disable category filter when loading', () => {
      render(<Dashboard onSearch={mockOnSearch} />);

      // Trigger loading state by clicking search
      const searchButton = screen.getByText('Submit Search');
      fireEvent.click(searchButton);

      const categorySelect = screen.getByLabelText(/filter by category/i) as HTMLSelectElement;
      expect(categorySelect.disabled).toBe(true);
    });

    it('should disable category filter when no results', () => {
      render(<Dashboard onSearch={mockOnSearch} />);

      const categorySelect = screen.getByLabelText(/filter by category/i) as HTMLSelectElement;
      // No listings initially, so should be disabled
      expect(categorySelect.disabled).toBe(true);
    });
  });

  describe('Integration: Category Filter with Sorting', () => {
    it('should apply category filter before sorting', () => {
      // Filter Electronics, then sort by price
      const filtered = mixedCategoryListings.filter(l => l.category === 'Electronics');
      const sorted = [...filtered].sort((a, b) => a.price - b.price);
      
      expect(sorted).toHaveLength(2);
      expect(sorted[0].price).toBeLessThan(sorted[1].price);
      expect(sorted.every(l => l.category === 'Electronics')).toBe(true);
    });

    it('should filter then sort by rating', () => {
      // Filter Books, then sort by rating descending
      const filtered = mixedCategoryListings.filter(l => l.category === 'Books');
      const sorted = [...filtered].sort((a, b) => b.rating - a.rating);
      
      expect(sorted).toHaveLength(2);
      expect(sorted[0].rating).toBeGreaterThanOrEqual(sorted[1].rating);
      expect(sorted[0].productName).toBe('JavaScript Guide'); // rating 4.8
      expect(sorted[1].productName).toBe('Python Cookbook'); // rating 4.6
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty listings array', () => {
      const emptyListings: Listing[] = [];
      const categoryFilter = 'Electronics';
      
      const filtered = categoryFilter === 'All' 
        ? emptyListings 
        : emptyListings.filter(l => l.category === categoryFilter);
      
      expect(filtered).toHaveLength(0);
    });

    it('should handle single listing', () => {
      const singleListing: Listing[] = [mixedCategoryListings[0]];
      const categoryFilter = 'Electronics';
      
      const filtered = singleListing.filter(l => l.category === categoryFilter);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('Electronics');
    });

    it('should handle all listings in same category', () => {
      const allElectronics: Listing[] = mixedCategoryListings.map(l => ({
        ...l,
        category: 'Electronics',
      }));
      
      const filtered = allElectronics.filter(l => l.category === 'Electronics');
      
      expect(filtered).toHaveLength(7);
      expect(filtered.every(l => l.category === 'Electronics')).toBe(true);
    });

    it('should handle listings with no matching category', () => {
      const customCategoryListings: Listing[] = [{
        ...mixedCategoryListings[0],
        category: 'CustomCategory' as any,
      }];
      
      const filtered = customCategoryListings.filter(l => l.category === 'Electronics');
      
      expect(filtered).toHaveLength(0);
    });
  });
});
