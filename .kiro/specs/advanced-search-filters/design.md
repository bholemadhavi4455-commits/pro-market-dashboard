# Design Document

## Introduction

The Advanced Search Filters feature provides comprehensive client-side filtering capabilities for the PRO Market Dashboard. This feature operates entirely in the frontend using React + TypeScript, filtering product search results returned from the existing `/api/search` endpoint without requiring backend modifications. The design emphasizes real-time responsiveness, URL shareability, and a persistent always-visible filter panel.

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Application                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐           ┌─────────────────────────────┐ │
│  │  Filter Panel   │           │   Product Results Grid      │ │
│  │   Component     │──filters──▶│       Component             │ │
│  │   (Sidebar)     │           │                             │ │
│  └────────┬────────┘           └─────────────────────────────┘ │
│           │                                                      │
│           │                                                      │
│  ┌────────▼────────────────────────────────────────────────┐   │
│  │         Filter State Manager (React Context)            │   │
│  │  - Manages all filter state (price, rating, keywords)   │   │
│  │  - Applies filtering logic to listings                  │   │
│  │  - Triggers re-renders on state change                  │   │
│  └────────┬────────────────┬──────────────────┬────────────┘   │
│           │                │                  │                 │
│  ┌────────▼────────┐  ┌────▼──────────┐  ┌───▼─────────────┐  │
│  │  URL Sync Hook  │  │ Session Store │  │  History Manager│  │
│  │  (Query Params) │  │ (sessionStorag│  │  (localStorage) │  │
│  └─────────────────┘  └───────────────┘  └─────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP GET /api/search?q={query}
                             ▼
                   ┌──────────────────┐
                   │  Backend API     │
                   │  (Unchanged)     │
                   └──────────────────┘
```

### Component Hierarchy


```
App
├── SearchBar (existing)
├── FilterContext.Provider
│   ├── FilterPanel
│   │   ├── FilterPresets
│   │   ├── PriceRangeFilter
│   │   │   ├── DualRangeSlider
│   │   │   └── NumericInput (min/max)
│   │   ├── RatingFilter
│   │   │   └── StarRatingSelector
│   │   ├── KeywordFilter
│   │   │   ├── KeywordInput
│   │   │   ├── KeywordTagList
│   │   │   └── LogicToggle (AND/OR)
│   │   ├── CategoryFilter
│   │   │   └── CheckboxGroup
│   │   ├── ReviewCountFilter
│   │   │   ├── NumericInput
│   │   │   ├── Slider
│   │   │   └── QuickPresets
│   │   ├── SourceFilter
│   │   │   └── CheckboxGroup
│   │   ├── ActiveFilterCount
│   │   └── ClearAllButton
│   └── ProductResultsGrid
│       ├── ResultsSummary ("Showing X of Y")
│       ├── LoadingIndicator
│       ├── NoResultsMessage
│       └── ProductCard[] (existing)
└── SearchHistory
    ├── HistoryPanel
    └── HistoryEntry[]
```

## Core Data Structures

### FilterState Interface

```typescript
interface FilterState {
  // Price range in paise (smallest currency unit)
  minPrice: number | null;
  maxPrice: number | null;
  
  // Minimum rating (0.0 - 5.0 in 0.5 increments)
  minRating: number | null;
  
  // Keywords and logic
  keywords: string[];
  keywordLogic: 'AND' | 'OR';
  
  // Selected categories (from dynamic list)
  selectedCategories: string[];
  
  // Minimum review count
  minReviewCount: number | null;
  
  // Selected sources (from dynamic list)
  selectedSources: string[];
  
  // Active preset name (null if no preset or modified)
  activePreset: string | null;
}
```

### SearchHistoryEntry Interface

```typescript
interface SearchHistoryEntry {
  id: string; // UUID
  timestamp: string; // ISO 8601 format
  searchQuery: string;
  filterState: FilterState;
  resultCount: number;
}
```

### ValidationError Interface

```typescript
interface ValidationError {
  field: string; // e.g., 'minPrice', 'maxPrice', 'minReviewCount'
  message: string;
}
```

## Component Specifications

### 1. FilterContext and Provider

**Purpose**: Centralized state management for all filter operations

**State Management**:

```typescript
interface FilterContextValue {
  // Current filter state
  filters: FilterState;
  
  // Raw listings from backend (unfiltered)
  rawListings: Listing[];
  
  // Filtered listings (after applying filters)
  filteredListings: Listing[];
  
  // Validation errors
  validationErrors: ValidationError[];
  
  // Loading state
  isFiltering: boolean;
  
  // Actions
  updateFilter: (filterKey: keyof FilterState, value: any) => void;
  applyPreset: (presetName: string) => void;
  clearAllFilters: () => void;
  
  // Available options (dynamic from current results)
  availableCategories: string[];
  availableSources: string[];
  maxPrice: number; // Computed from rawListings
}
```

**Implementation Details**:
- Uses React Context API for global state
- Implements memoization using `useMemo` to prevent unnecessary re-filtering
- Separates `rawListings` (from API) and `filteredListings` (after filter application)
- Computes dynamic filter options (categories, sources, maxPrice) from `rawListings`

### 2. PriceRangeFilter Component

**Props**:
```typescript
interface PriceRangeFilterProps {
  minPrice: number | null;
  maxPrice: number | null;
  absoluteMax: number; // From context
  onChange: (min: number | null, max: number | null) => void;
  validationError?: ValidationError;
}
```

**Features**:
- Dual-handle slider component for visual range selection
- Two numeric input fields for precise entry (displayed in ₹ Rupees)

- Stores values internally in paise, displays in Rupees with `formatINR` utility
- 300ms debounce on input changes using `useDebouncedCallback` hook
- Validation: ensures min ≤ max, displays error message inline
- Range display label: "₹X - ₹Y" formatted with Indian comma separators

**Internal State**:
- Local state for input values during typing (before debounce)
- Syncs with global context after debounce period

### 3. RatingFilter Component

**Props**:
```typescript
interface RatingFilterProps {
  minRating: number | null;
  onChange: (rating: number | null) => void;
}
```

**Features**:
- Displays clickable star rating options: 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0
- Visual representation using star icons (⭐) with half-star support
- Selected rating highlighted with distinct styling
- Display format: "⭐ 4.0 & up" or "Any rating" when null
- No debounce required (discrete selection)

### 4. KeywordFilter Component

**Props**:
```typescript
interface KeywordFilterProps {
  keywords: string[];
  keywordLogic: 'AND' | 'OR';
  onKeywordsChange: (keywords: string[]) => void;
  onLogicChange: (logic: 'AND' | 'OR') => void;
}
```

**Features**:
- Text input accepting comma or space-separated keywords
- Automatic keyword parsing and normalization (trim whitespace)
- Individual keyword tags with × remove buttons
- Toggle button for AND/OR logic (pill-style toggle)

- Maximum 10 keywords supported
- Case-insensitive matching in filter logic
- No debounce (tag-based interface updates immediately)

**Keyword Matching Logic**:
```typescript
function matchesKeywords(productName: string, keywords: string[], logic: 'AND' | 'OR'): boolean {
  if (keywords.length === 0) return true;
  
  const normalizedName = productName.toLowerCase();
  const normalizedKeywords = keywords.map(k => k.toLowerCase().trim());
  
  if (logic === 'AND') {
    return normalizedKeywords.every(keyword => normalizedName.includes(keyword));
  } else {
    return normalizedKeywords.some(keyword => normalizedName.includes(keyword));
  }
}
```

### 5. CategoryFilter Component

**Props**:
```typescript
interface CategoryFilterProps {
  availableCategories: string[]; // From context
  selectedCategories: string[];
  listingCounts: Record<string, number>; // Count per category
  onChange: (selected: string[]) => void;
}
```

**Features**:
- Checkbox list with category names and product counts
- Format: "Electronics (45)" where 45 is the count
- "Select All" and "Clear All" buttons at top
- Scrollable container if many categories
- Maintains selection when new search results load
- Checkboxes use native HTML input for accessibility

### 6. ReviewCountFilter Component

**Props**:
```typescript
interface ReviewCountFilterProps {
  minReviewCount: number | null;
  onChange: (count: number | null) => void;
  validationError?: ValidationError;
}
```

**Features**:
- Numeric input field with validation (non-negative integers only)
- Slider control for visual selection
- Quick preset buttons: 10+, 50+, 100+, 500+ reviews
- Display format: "500+ reviews" or "Any" when null
- Validation: rejects negative numbers, decimals, non-numeric input
- No debounce on preset buttons; 300ms debounce on input/slider

### 7. SourceFilter Component

**Props**:
```typescript
interface SourceFilterProps {
  availableSources: string[]; // From context (e.g., ["Amazon", "Flipkart"])
  selectedSources: string[];
  listingCounts: Record<string, number>; // Count per source
  onChange: (selected: string[]) => void;
}
```

**Features**:
- Checkbox list with source names, icons, and counts
- Source icons/labels: Amazon 🛒, Flipkart 🛍️, eBay 🏪 (customizable)
- Format: "🛒 Amazon (32)"
- "Select All" and "Clear All" buttons
- Maintains selection across search updates

### 8. FilterPresets Component

**Props**:
```typescript
interface FilterPresetsProps {
  activePreset: string | null;
  onPresetClick: (presetName: string) => void;
}
```

**Preset Definitions**:

```typescript
const PRESETS: Record<string, Partial<FilterState>> = {
  'Best Deals': {
    minRating: 4.0,
    minReviewCount: 50,
    // + sort by price ascending (handled by results grid)
  },
  'Top Rated': {
    minRating: 4.5,
    minReviewCount: 100,
  },
  'Most Reviewed': {
    minReviewCount: 500,
    // + sort by reviewCount descending
  },
  'Budget': {
    maxPrice: 200000, // ₹2,000 in paise
    // + sort by price ascending
  },
  'Premium': {
    minPrice: 5000000, // ₹50,000 in paise
    // + sort by price descending
  },
};
```

**Features**:
- Five prominent buttons displayed horizontally
- Active preset highlighted with distinct styling
- Clicking a preset applies its filter configuration
- Manual filter changes clear the active preset indicator
- Presets include sort order hints (applied by results grid component)

### 9. SearchHistory Component

**Storage**: localStorage with key `promarket_search_history`

**Props**:
```typescript
interface SearchHistoryProps {
  onHistorySelect: (entry: SearchHistoryEntry) => void;
}
```

**Features**:
- Displays last 10 unique searches
- Each entry shows: timestamp, search query, filter summary, result count
- Format: "laptop (₹1000-5000, 4★+, 32 results) - 2 mins ago"
- Click entry to restore filters and execute search
- "Clear History" button to remove all entries

- Prevents duplicate consecutive entries (same query + filters)
- Displays "No search history" when empty
- Relative timestamps: "2 mins ago", "1 hour ago", "Yesterday"

**History Management Logic**:
```typescript
function addHistoryEntry(entry: SearchHistoryEntry, history: SearchHistoryEntry[]): SearchHistoryEntry[] {
  // Check if duplicate of last entry
  const lastEntry = history[0];
  if (lastEntry && 
      lastEntry.searchQuery === entry.searchQuery &&
      deepEqual(lastEntry.filterState, entry.filterState)) {
    return history; // Don't add duplicate
  }
  
  // Add to beginning, keep max 10
  const newHistory = [entry, ...history].slice(0, 10);
  return newHistory;
}
```

### 10. URL State Synchronization (useURLSync Hook)

**Purpose**: Bidirectional sync between FilterState and URL query parameters

**URL Parameter Mapping**:
```typescript
const URL_PARAM_MAP = {
  minPrice: 'minPrice',      // Value in paise (integer)
  maxPrice: 'maxPrice',      // Value in paise (integer)
  minRating: 'minRating',    // Decimal (e.g., '4.5')
  keywords: 'keywords',      // Comma-separated string
  keywordLogic: 'logic',     // 'AND' or 'OR'
  selectedCategories: 'categories', // Comma-separated string
  minReviewCount: 'minReviews',     // Integer
  selectedSources: 'sources',       // Comma-separated string
  activePreset: 'preset',           // String preset name
};
```

**Implementation**:
```typescript
function useURLSync(filters: FilterState, updateFilters: (f: FilterState) => void) {
  // On mount: parse URL params and apply to filters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsedFilters = parseFiltersFromURL(params);
    updateFilters(parsedFilters);
  }, []);
  
  // On filter change: update URL
  useEffect(() => {
    const params = encodeFiltersToURL(filters);
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newURL);
  }, [filters]);
}

function parseFiltersFromURL(params: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {};
  
  // Parse each parameter with validation
  const minPrice = params.get('minPrice');
  if (minPrice && !isNaN(Number(minPrice))) {
    filters.minPrice = Number(minPrice);
  }
  
  const keywords = params.get('keywords');
  if (keywords) {
    filters.keywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
  }
  
  // ... similar parsing for other fields
  
  return filters;
}

function encodeFiltersToURL(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  
  // Preserve existing search query 'q'
  const existingQ = new URLSearchParams(window.location.search).get('q');
  if (existingQ) params.set('q', existingQ);
  
  // Encode each filter
  if (filters.minPrice !== null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.keywords.length > 0) params.set('keywords', filters.keywords.join(','));
  
  // ... similar encoding for other fields
  
  return params;
}
```

**Features**:
- Uses `pushState` API (no page reload)
- Maintains search query `q` parameter alongside filter params
- Batches multiple filter updates to prevent history pollution
- Validates and sanitizes URL parameters on page load
- Logs warnings for malformed parameters, ignores them gracefully

### 11. Session Storage Persistence (useSessionStorage Hook)

**Purpose**: Preserve filter state during navigation within the same session

**Implementation**:
```typescript
function useSessionStorage(filters: FilterState) {
  const STORAGE_KEY = 'promarket_filter_state';
  
  // Save to sessionStorage on filter change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);
  
  // Restore from sessionStorage on mount
  function restoreFilters(): FilterState | null {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored) as FilterState;
    } catch (e) {
      console.warn('Failed to parse stored filters', e);
      return null;
    }
  }
  
  return { restoreFilters };
}
```

**Behavior**:
- Stores complete FilterState as JSON string
- Automatically cleared when browser session ends
- Synchronized with URL state (URL takes precedence on load)
- Cleared on new search query (different `q` parameter)

## Filter Application Logic

### Core Filtering Function


```typescript
function applyFilters(listings: Listing[], filters: FilterState): Listing[] {
  return listings.filter(listing => {
    // Price range filter
    if (filters.minPrice !== null && listing.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== null && listing.price > filters.maxPrice) {
      return false;
    }
    
    // Rating filter
    if (filters.minRating !== null && listing.rating < filters.minRating) {
      return false;
    }
    
    // Keyword filter
    if (filters.keywords.length > 0) {
      const matches = matchesKeywords(listing.productName, filters.keywords, filters.keywordLogic);
      if (!matches) return false;
    }
    
    // Category filter
    if (filters.selectedCategories.length > 0) {
      if (!filters.selectedCategories.includes(listing.category)) {
        return false;
      }
    }
    
    // Review count filter
    if (filters.minReviewCount !== null && listing.reviewCount < filters.minReviewCount) {
      return false;
    }
    
    // Source filter
    if (filters.selectedSources.length > 0) {
      if (!filters.selectedSources.includes(listing.source)) {
        return false;
      }
    }
    
    return true;
  });
}
```

**Performance Optimization**:
- Wrapped in `useMemo` with dependencies on `listings` and `filters`
- Early return on each filter check (short-circuit evaluation)
- No intermediate array allocations (single pass)


## Validation Logic

### Input Validation

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

function validateFilters(filters: FilterState): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Price range validation
  if (filters.minPrice !== null && filters.maxPrice !== null) {
    if (filters.minPrice > filters.maxPrice) {
      errors.push({
        field: 'priceRange',
        message: 'Minimum price cannot exceed maximum price'
      });
    }
  }
  
  // Price numeric validation
  if (filters.minPrice !== null && (isNaN(filters.minPrice) || filters.minPrice < 0)) {
    errors.push({
      field: 'minPrice',
      message: 'Price must be a positive number'
    });
  }
  
  // Review count validation
  if (filters.minReviewCount !== null) {
    if (isNaN(filters.minReviewCount) || filters.minReviewCount < 0 || !Number.isInteger(filters.minReviewCount)) {
      errors.push({
        field: 'minReviewCount',
        message: 'Review count must be a positive number'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

**Error Handling**:
- Inline error messages displayed below invalid inputs
- Red border styling on invalid input fields
- Filter application blocked while validation errors exist
- Errors cleared automatically when input is corrected


## UI Layout and Responsive Design

### Desktop Layout (≥ 768px)

```
┌─────────────────────────────────────────────────────────────┐
│  Header: PRO Market Dashboard                               │
│  Search Bar: [___________________________] [Search]         │
└─────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────────────────────┐
│  FILTER PANEL    │  PRODUCT RESULTS                         │
│  (280px width)   │  (Flexible width)                        │
│                  │                                          │
│  [Best Deals]    │  Showing 25 of 100 products             │
│  [Top Rated]     │                                          │
│  [Most Reviewed] │  ┌────────────────┐  ┌────────────────┐ │
│  [Budget]        │  │  Product Card  │  │  Product Card  │ │
│  [Premium]       │  │                │  │                │ │
│                  │  └────────────────┘  └────────────────┘ │
│  Price Range     │                                          │
│  [====●─────●]   │  ┌────────────────┐  ┌────────────────┐ │
│  ₹[500] - ₹[5000]│  │  Product Card  │  │  Product Card  │ │
│                  │  │                │  │                │ │
│  Rating          │  └────────────────┘  └────────────────┘ │
│  ⭐⭐⭐⭐ & up    │                                          │
│                  │  ...                                     │
│  Keywords        │                                          │
│  [laptop gaming] │                                          │
│  [Tag1 ×][Tag2 ×]│                                          │
│  ○ AND  ● OR     │                                          │
│                  │                                          │
│  Categories      │                                          │
│  ☑ Electronics   │                                          │
│  ☐ Books         │                                          │
│  ☐ Clothing      │                                          │
│                  │                                          │
│  [Clear All]     │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

### Mobile Layout (< 768px)


```
┌─────────────────────────────┐
│  Header + Search            │
└─────────────────────────────┘
┌─────────────────────────────┐
│  [🔽 Filters (3 active)]    │  ← Collapsible button
└─────────────────────────────┘
┌─────────────────────────────┐
│  PRODUCT RESULTS (full)     │
│                             │
│  Showing 25 of 100          │
│                             │
│  ┌─────────────────────┐   │
│  │   Product Card      │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │   Product Card      │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

**When filter button clicked**:
- Filters slide in from side or expand from top
- Overlay backdrop dims product results
- Close button (×) at top of filter panel

### Styling Guidelines

**Color Scheme**:
- Primary: #2563eb (blue for active elements)
- Secondary: #64748b (gray for inactive)
- Success: #10b981 (green for valid inputs)
- Error: #ef4444 (red for validation errors)
- Background: #f8fafc (light gray for filter panel)
- Text: #0f172a (dark gray, WCAG AA compliant)

**Typography**:
- Headers: 16px bold, Inter/system-ui font
- Body text: 14px regular
- Small labels: 12px regular
- WCAG AA contrast ratio 4.5:1 minimum

**Spacing**:
- Filter sections: 24px vertical gap
- Filter components: 16px internal padding
- Input fields: 8px padding, 4px border-radius

