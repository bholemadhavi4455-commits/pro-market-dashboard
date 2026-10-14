import { SourceAdapter } from './SourceAdapter';
import { Listing, Review } from '../models/types';

/**
 * Mock Amazon adapter for testing
 * Generates realistic mock data for Amazon listings
 * 
 * Requirements: 2.1, 2.2
 */
export class MockAmazonAdapter implements SourceAdapter {
  readonly sourceName = 'Amazon';
  private delayMs: number;
  private shouldFail: boolean;

  constructor(config?: { delayMs?: number; shouldFail?: boolean }) {
    this.delayMs = config?.delayMs || 0;
    this.shouldFail = config?.shouldFail || false;
  }

  async search(query: string, category?: string): Promise<Listing[]> {
    // Simulate network delay
    if (this.delayMs > 0) {
      await this.delay(this.delayMs);
    }

    // Simulate error
    if (this.shouldFail) {
      throw new Error('Amazon API error: Service unavailable');
    }

    // Generate mock listings based on query
    const mockData = this.generateMockListings(query, category);
    return mockData;
  }

  async getReviews(productId: string): Promise<Review[]> {
    // Simulate network delay
    if (this.delayMs > 0) {
      await this.delay(this.delayMs);
    }

    return this.generateMockReviews(productId);
  }

  private generateMockListings(
    query: string,
    category?: string
  ): Listing[] {
    const baseProducts = [
      {
        name: `${query} Premium`,
        price: 24999,
        rating: 4.5,
        reviews: 1203,
        cat: 'Electronics',
      },
      {
        name: `${query} Standard`,
        price: 19999,
        rating: 4.2,
        reviews: 856,
        cat: 'Electronics',
      },
      {
        name: `${query} Basic`,
        price: 14999,
        rating: 4.0,
        reviews: 432,
        cat: 'Electronics',
      },
    ];

    return baseProducts
      .filter((p) => !category || category === 'All' || p.cat === category)
      .map((product, index) => ({
        id: `Amazon_${query.toLowerCase().replace(/\s+/g, '_')}_${index + 1}`,
        productName: product.name,
        source: this.sourceName,
        sourceUrl: `https://amazon.com/dp/${this.generateMockASIN()}`,
        price: product.price,
        currency: 'USD',
        rating: product.rating,
        reviewCount: product.reviews,
        category: product.cat,
        compositeScore: 0, // Will be calculated by ScoringEngine
        fetchedAt: new Date().toISOString(),
        imageUrl: `https://m.media-amazon.com/images/I/${this.generateMockImageId()}.jpg`,
      }));
  }

  private generateMockReviews(productId: string): Review[] {
    const reviews: Review[] = [
      {
        author: 'John D.',
        rating: 5,
        text: 'Excellent product! Great quality and fast shipping. Highly recommend to anyone looking for a reliable option. The build quality exceeds expectations.',
        date: this.getRandomDate(30),
        verified: true,
        sourceReviewUrl: `https://amazon.com/review/R${this.generateRandomId()}`,
      },
      {
        author: 'Sarah M.',
        rating: 4,
        text: 'Good value for money. Works as described, though the packaging could be better. Overall satisfied with the purchase and would buy again.',
        date: this.getRandomDate(45),
        verified: true,
        sourceReviewUrl: `https://amazon.com/review/R${this.generateRandomId()}`,
      },
      {
        author: 'Mike R.',
        rating: 5,
        text: 'Best purchase I made this year! The features are exactly what I needed and the customer service was top-notch.',
        date: this.getRandomDate(20),
        verified: true,
        sourceReviewUrl: `https://amazon.com/review/R${this.generateRandomId()}`,
      },
      {
        author: 'Emily W.',
        rating: 3,
        text: 'It is okay. Does the job but nothing special. The price point is fair but I expected slightly better quality for the brand.',
        date: this.getRandomDate(60),
        verified: false,
        sourceReviewUrl: `https://amazon.com/review/R${this.generateRandomId()}`,
      },
      {
        author: 'David L.',
        rating: 5,
        text: 'Perfect! Exactly as described in the listing. Delivery was quick and the item arrived in perfect condition. Cannot fault it at all.',
        date: this.getRandomDate(15),
        verified: true,
        sourceReviewUrl: `https://amazon.com/review/R${this.generateRandomId()}`,
      },
    ];

    return reviews;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateMockASIN(): string {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  }

  private generateMockImageId(): string {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  }

  private getRandomDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }
}
