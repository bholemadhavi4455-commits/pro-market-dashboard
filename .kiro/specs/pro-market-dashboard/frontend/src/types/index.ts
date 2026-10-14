/**
 * Frontend TypeScript interfaces matching backend models
 */

export interface Listing {
  id: string;
  productName: string;
  source: string;
  sourceUrl: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  category: string;
  compositeScore: number;
  fetchedAt: string;
  imageUrl?: string;
}

export interface Review {
  author: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  sourceReviewUrl: string;
}

export interface SearchResult {
  listings: Listing[];
  bestPick: Listing | null;
  sourcesCount: number;
  cachedAt: string | null;
}

export interface PriceHistoryRecord {
  timestamp: string;
  price: number;
}

export interface PriceHistoryResponse {
  listingId: string;
  productName?: string;
  history: PriceHistoryRecord[];
  dataPoints: number;
  message?: string;
}

export interface ReviewResponse {
  listingId: string;
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
  available: boolean;
  message?: string;
}
