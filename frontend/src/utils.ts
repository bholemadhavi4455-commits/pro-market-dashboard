/**
 * Utility functions for PRO Market Dashboard
 */

/**
 * Format price in Indian Rupees with proper comma separation
 * @param priceInPaise - Price in paise (smallest unit)
 * @returns Formatted string with ₹ symbol
 * 
 * Examples:
 * formatINR(100000) => "₹1,000.00"
 * formatINR(250000) => "₹2,500.00"
 * formatINR(8999900) => "₹89,999.00"
 */
export function formatINR(priceInPaise: number): string {
  const rupees = priceInPaise / 100;
  
  // Indian number format (lakhs and crores)
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
  
  return formatted;
}

/**
 * Format price in compact Indian notation (with K, L, Cr)
 * @param priceInPaise - Price in paise
 * @returns Compact formatted string
 * 
 * Examples:
 * formatINRCompact(100000) => "₹1K"
 * formatINRCompact(10000000) => "₹1L"
 * formatINRCompact(1000000000) => "₹1Cr"
 */
export function formatINRCompact(priceInPaise: number): string {
  const rupees = priceInPaise / 100;
  
  if (rupees >= 10000000) {
    // Crores
    return `₹${(rupees / 10000000).toFixed(1)}Cr`;
  } else if (rupees >= 100000) {
    // Lakhs
    return `₹${(rupees / 100000).toFixed(1)}L`;
  } else if (rupees >= 1000) {
    // Thousands
    return `₹${(rupees / 1000).toFixed(1)}K`;
  } else {
    return `₹${rupees.toFixed(2)}`;
  }
}
