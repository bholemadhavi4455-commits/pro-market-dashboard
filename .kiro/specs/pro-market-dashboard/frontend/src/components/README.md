# Components

This directory contains React components for the PRO Market Dashboard frontend.

## SearchBar Component

**File:** `SearchBar.tsx`

### Purpose
Provides a search interface for users to search products by name and filter by category.

### Requirements Implemented
- **Requirement 1.1**: Sends query to Aggregator API and displays loading indicator
- **Requirement 1.3**: Validates input (rejects empty/whitespace) and displays validation message
- **Requirement 3.1**: Displays category filter control

### State Management
The component manages the following state:
- `query` (string): The search query entered by the user
- `category` (string): The selected category filter ("All" | "Electronics" | "Books" | "Clothing" | "Home & Kitchen" | "Sports")
- `isLoading` (boolean): Indicates whether a search is in progress
- `validationError` (string | null): Validation error message, if any

### Props
```typescript
interface SearchBarProps {
  onSearchSubmit: (query: string, category: string) => void;
}
```

### Usage Example
```tsx
import { SearchBar } from './components/SearchBar';

function App() {
  const handleSearch = (query: string, category: string) => {
    console.log('Searching for:', query, 'in category:', category);
    // Call API here
  };

  return <SearchBar onSearchSubmit={handleSearch} />;
}
```

### Features
- Input validation using `validateSearchQuery` utility
- Real-time error clearing when user starts typing
- Category filtering with predefined options
- Loading state management
- Accessible ARIA labels and attributes
- Responsive design (mobile-friendly)
- Keyboard support (Enter to submit)

### Accessibility
- Proper ARIA labels for all interactive elements
- ARIA invalid state for validation errors
- ARIA live regions for dynamic content (errors, loading)
- Screen reader support
- Keyboard navigation

### Testing
Comprehensive unit tests in `SearchBar.test.tsx` cover:
- State management
- Input validation (Requirement 1.3)
- Search submission (Requirement 1.1)
- Category filtering (Requirement 3.1)
- Loading states
- Accessibility features
