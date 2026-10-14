import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

/**
 * Example Component Test
 * 
 * This file demonstrates how to write React component tests using:
 * - Vitest (test runner)
 * - React Testing Library (component testing utilities)
 * - @testing-library/jest-dom (DOM matchers)
 */

// Example Button Component (inline for demonstration)
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ExampleButton({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      aria-label={label}
    >
      {label}
    </button>
  );
}

describe('ExampleButton Component', () => {
  it('should render button with correct label', () => {
    render(<ExampleButton label="Click Me" onClick={() => {}} />);
    
    // Using semantic query (recommended)
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', () => {
    // Create a mock function
    const handleClick = vi.fn();
    
    render(<ExampleButton label="Submit" onClick={handleClick} />);
    
    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);
    
    // Verify the handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<ExampleButton label="Disabled" onClick={() => {}} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  it('should not call onClick when button is disabled', () => {
    const handleClick = vi.fn();
    
    render(<ExampleButton label="Disabled" onClick={handleClick} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /disabled/i });
    fireEvent.click(button);
    
    // Handler should not be called
    expect(handleClick).not.toHaveBeenCalled();
  });
});

/**
 * Testing Best Practices Demonstrated:
 * 
 * 1. ✅ Use semantic queries (getByRole) over test IDs
 * 2. ✅ Test user behavior, not implementation
 * 3. ✅ Use descriptive test names
 * 4. ✅ Mock functions with vi.fn()
 * 5. ✅ Use @testing-library/jest-dom matchers (toBeInTheDocument, toBeDisabled)
 * 6. ✅ Test accessibility (aria-label, roles)
 * 7. ✅ Group related tests with describe blocks
 */

// Example: Testing component with state
function Counter() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// Note: Import React for the Counter component
import React from 'react';

describe('Counter Component', () => {
  it('should start with count of 0', () => {
    render(<Counter />);
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
  });

  it('should increment count when increment button is clicked', () => {
    render(<Counter />);
    
    const incrementButton = screen.getByRole('button', { name: /increment/i });
    fireEvent.click(incrementButton);
    
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  });

  it('should reset count to 0 when reset button is clicked', () => {
    render(<Counter />);
    
    // Increment a few times
    const incrementButton = screen.getByRole('button', { name: /increment/i });
    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);
    
    expect(screen.getByText(/count: 3/i)).toBeInTheDocument();
    
    // Reset
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
  });
});

/**
 * Common Testing Library Queries:
 * 
 * - getByRole: Find by ARIA role (button, textbox, heading, etc.) - PREFERRED
 * - getByLabelText: Find form elements by label
 * - getByText: Find by text content
 * - getByPlaceholderText: Find input by placeholder
 * - getByAltText: Find images by alt text
 * - getByTestId: Find by data-testid (use sparingly)
 * 
 * Variants:
 * - getBy*: Throws error if not found (use for assertions)
 * - queryBy*: Returns null if not found (use for non-existence checks)
 * - findBy*: Returns promise (use for async elements)
 * 
 * Multiple elements:
 * - getAllBy*, queryAllBy*, findAllBy*
 */

/**
 * Common jest-dom Matchers:
 * 
 * - toBeInTheDocument(): Element exists in DOM
 * - toBeVisible(): Element is visible
 * - toBeDisabled(): Form element is disabled
 * - toHaveValue(): Input has specific value
 * - toHaveTextContent(): Element contains text
 * - toHaveClass(): Element has CSS class
 * - toHaveAttribute(): Element has attribute
 * - toBeChecked(): Checkbox/radio is checked
 */
