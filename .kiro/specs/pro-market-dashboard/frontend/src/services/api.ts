/**
 * API service for communicating with the backend
 */
import axios from 'axios';
import type {
  SearchResult,
  PriceHistoryResponse,
  ReviewResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const searchProducts = async (
  query: string,
  category?: string
): Promise<SearchResult> => {
  const params: Record<string, string> = { q: query };
  if (category && category !== 'All') {
    params.category = category;
  }
  const response = await api.get<SearchResult>('/search', { params });
  return response.data;
};

export const getListingHistory = async (
  listingId: string,
  range: 7 | 30 | 90 = 30
): Promise<PriceHistoryResponse> => {
  const response = await api.get<PriceHistoryResponse>(
    `/listing/${listingId}/history`,
    { params: { range } }
  );
  return response.data;
};

export const getListingReviews = async (
  listingId: string
): Promise<ReviewResponse> => {
  const response = await api.get<ReviewResponse>(
    `/listing/${listingId}/reviews`
  );
  return response.data;
};

export default api;
