/**
 * Validation and formatting utilities for PRO Market Dashboard
 */

import { Listing } from '../types';

/**
 * Validates search query input
 * Requirement 1.3: Reject empty or whitespace-only strings
 * 
 * @param query - The search query string to validate
 * @returns Error message if invalid, null if valid
 */
export function validateSearchQuery(query: string): string | null {
  // Check if query is empty or contains only whitespace
  if (!query || query.trim().length === 0) {
    return 'Please enter a search term';
  }
  
  return null;
}

/**
 * Formats price with currency symbol
 * Converts smallest currency unit (e.g., cents/paise) to display format
 * 
 * @param price - Price in smallest currency unit (e.g., cents for USD, paise for INR)
 * @param currency - ISO 4217 currency code (e.g., 'USD', 'INR', 'EUR')
 * @returns Formatted price string with currency symbol
 * 
 * @example
 * formatCurrency(24999, 'INR') // '₹249.99'
 * formatCurrency(24999, 'USD') // '$249.99'
 * formatCurrency(1000, 'EUR') // '€10.00'
 */
export function formatCurrency(price: number, currency: string): string {
  // Convert from smallest unit to major unit (divide by 100)
  const majorUnit = price / 100;
  
  // Format with appropriate currency symbol and decimals
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(majorUnit);
  } catch (error) {
    // Fallback if currency code is invalid
    console.error(`Invalid currency code: ${currency}`, error);
    return `${currency} ${majorUnit.toFixed(2)}`;
  }
}

/**
 * Formats ISO date string for display
 * 
 * @param dateString - ISO date string (e.g., '2025-01-15T10:30:00Z' or '2025-01-15')
 * @param format - Display format: 'short' (Jan 15), 'medium' (Jan 15, 2025), 'long' (January 15, 2025)
 * @returns Formatted date string
 * 
 * @example
 * formatDate('2025-01-15T10:30:00Z', 'short') // 'Jan 15'
 * formatDate('2025-01-15T10:30:00Z', 'medium') // 'Jan 15, 2025'
 * formatDate('2025-01-15T10:30:00Z', 'long') // 'January 15, 2025'
 */
export function formatDate(
  dateString: string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error(`Invalid date string: ${dateString}`);
      return dateString;
    }
    
    switch (format) {
      case 'short':
        // Format: 'Jan 15'
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
        }).format(date);
      
      case 'medium':
        // Format: 'Jan 15, 2025'
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(date);
      
      case 'long':
        // Format: 'January 15, 2025'
        return new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).format(date);
      
      default:
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(date);
    }
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return dateString;
  }
}

/**
 * Formats date for chart axis labels based on time range
 * 
 * @param dateString - ISO date string
 * @param rangeDays - Number of days in the range (7, 30, or 90)
 * @returns Formatted date string appropriate for the range
 * 
 * @example
 * formatDateForChart('2025-01-15T10:30:00Z', 7) // 'Mon'
 * formatDateForChart('2025-01-15T10:30:00Z', 30) // 'Jan 15'
 * formatDateForChart('2025-01-15T10:30:00Z', 90) // 'Jan 15'
 */
export function formatDateForChart(
  dateString: string,
  rangeDays: number
): string {
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error(`Invalid date string: ${dateString}`);
      return dateString;
    }
    
    // For 7-day range, show day of week (e.g., 'Mon')
    if (rangeDays <= 7) {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
      }).format(date);
    }
    
    // For 30 and 90-day ranges, show month and day (e.g., 'Jan 15')
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error(`Error formatting date for chart: ${dateString}`, error);
    return dateString;
  }
}

/**
 * Counts the number of distinct sources in an array of listings
 * Requirement 4.4: Dashboard displays total number of Sources contributing results
 * Design Property 10: Count of distinct sources equals number of unique source field values
 * 
 * @param listings - Array of listings to count sources from
 * @returns Number of unique source values in the array
 * 
 * @example
 * countUniqueSources([
 *   { source: 'Amazon', ... },
 *   { source: 'eBay', ... },
 *   { source: 'Amazon', ... }
 * ]) // 2
 * 
 * countUniqueSources([]) // 0
 */
export function countUniqueSources(listings: Listing[]): number {
  // Create a Set to track unique source values
  const uniqueSources = new Set<string>();
  
  // Add each listing's source to the set (duplicates are automatically filtered)
  for (const listing of listings) {
    uniqueSources.add(listing.source);
  }
  
  // Return the size of the set (number of unique sources)
  return uniqueSources.size;
}
