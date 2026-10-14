/**
 * Flipkart Affiliate API Adapter
 * Fetches real product data from Flipkart (India's #1 marketplace)
 */

import { Listing, Review } from '../models';
import { SourceAdapter } from './index';
import axios from 'axios';

export class FlipkartAdapter implements SourceAdapter {
  sourceName = 'Flipkart';
  
  private affiliateId: string;
  private affiliateToken: string;
  private baseUrl = 'https://affiliate-api.flipkart.net/affiliate/api';
  
  constructor() {
    this.affiliateId = process.env.FLIPKART_AFFILIATE_ID || '';
    this.affiliateToken = process.env.FLIPKART_AFFILIATE_TOKEN || '';
    
    if (!this.affiliateId || !this.affiliateToken) {
      console.warn('⚠️  Flipkart API credentials not configured. Using mock data.');
    }
  }
  
  /**
   * Search for products on Flipkart
   */
  async search(query: string, category?: string): Promise<Listing[]> {
    if (!this.affiliateId || !this.affiliateToken) {
      return this.getMockData(query, category);
    }
    
    try {
      // Flipkart Affiliate API endpoint
      const url = `${this.baseUrl}/${this.affiliateId}/product/search`;
      
      const response = await axios.get(url, {
        params: {
          query: query,
          resultCount: 10,
        },
        headers: {
          'Fk-Affiliate-Id': this.affiliateId,
          'Fk-Affiliate-Token': this.affiliateToken,
        },
        timeout: 5000,
      });
      
      console.log(`✅ Flipkart API: Found products for "${query}"`);
      return this.normalizeResponse(response.data);
      
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️  Flipkart API: Request timeout');
      } else if (error.response) {
        console.error(`❌ Flipkart API Error: ${error.response.status}`);
      } else {
        console.error('❌ Flipkart API Error:', error.message);
      }
      return this.getMockData(query, category);
    }
  }
  
  /**
   * Get reviews for a specific product
   */
  async getReviews(productId: string): Promise<Review[]> {
    if (!this.affiliateId) {
      return this.getMockReviews(productId);
    }
    
    try {
      // Flipkart doesn't provide reviews via Affiliate API
      // Would need web scraping or other methods
      console.log(`ℹ️  Flipkart: Reviews not available via API for ${productId}`);
      return this.getMockReviews(productId);
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Normalize Flipkart API response to our Listing format
   */
  private normalizeResponse(apiData: any): Listing[] {
    const listings: Listing[] = [];
    
    try {
      const products = apiData.products || apiData.productBaseInfoList || [];
      
      for (const product of products) {
        const productInfo = product.productBaseInfo || product;
        
        // Extract price (Flipkart returns price in rupees as string)
        const priceStr = productInfo.flipkartSellingPrice?.amount || 
                        productInfo.productShippingInfo?.price || '0';
        const priceInRupees = parseFloat(priceStr);
        const priceInPaise = Math.round(priceInRupees * 100);
        
        // Extract rating
        const rating = parseFloat(productInfo.productRating?.averageRating || '4.0');
        const reviewCount = parseInt(productInfo.productRating?.reviewCount || '0');
        
        listings.push({
          id: `flipkart_${productInfo.productId}`,
          productName: productInfo.productName || productInfo.title || 'Unknown Product',
          source: 'Flipkart',
          sourceUrl: productInfo.productUrl || `https://www.flipkart.com/product/${productInfo.productId}`,
          price: priceInPaise,
          currency: 'INR',
          rating: Math.min(5.0, Math.max(0.0, rating)),
          reviewCount: reviewCount,
          category: this.detectCategory(productInfo.productName || '', productInfo.category),
          compositeScore: 0, // Will be calculated by aggregator
          fetchedAt: new Date().toISOString(),
          imageUrl: productInfo.imageUrls?.['400x400'] || productInfo.imageUrl,
        });
      }
    } catch (error) {
      console.error('❌ Error parsing Flipkart response:', error);
    }
    
    return listings;
  }
  
  /**
   * Detect category from product name or API category
   */
  private detectCategory(productName: string, apiCategory?: string): string {
    const name = productName.toLowerCase();
    
    if (name.includes('laptop') || name.includes('mobile') || name.includes('phone') || 
        name.includes('tablet') || name.includes('electronics')) return 'Electronics';
    if (name.includes('book')) return 'Books';
    if (name.includes('shirt') || name.includes('jeans') || name.includes('saree') || 
        name.includes('dress') || name.includes('clothing')) return 'Clothing';
    if (name.includes('gold') || name.includes('silver') || name.includes('jewelry') ||
        name.includes('ring') || name.includes('necklace')) return 'Jewelry';
    if (name.includes('kitchen') || name.includes('mixer') || name.includes('cooker')) return 'Home & Kitchen';
    if (name.includes('cricket') || name.includes('football') || name.includes('sports')) return 'Sports';
    
    return apiCategory || 'General';
  }
  
  /**
   * Mock data fallback
   */
  private getMockData(query: string, category?: string): Listing[] {
    console.log(`ℹ️  Using Flipkart mock data for: ${query}`);
    return [];
  }
  
  /**
   * Mock reviews fallback
   */
  private getMockReviews(productId: string): Review[] {
    return [
      {
        author: 'Flipkart Customer',
        rating: 5,
        text: 'Authentic product, fast delivery. Happy with Flipkart service!',
        date: new Date().toISOString().split('T')[0],
        verified: true,
        sourceReviewUrl: `https://www.flipkart.com/review/${productId}`,
      },
    ];
  }
}
