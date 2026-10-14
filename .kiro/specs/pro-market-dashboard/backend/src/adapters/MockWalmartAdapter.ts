import { SourceAdapter } from './SourceAdapter';
import { Listing, Review } from '../models/types';

/**
 * Mock Walmart adapter for testing
 * Generates realistic mock data for Walmart listings
 * 
 * Requirements: 2.1, 2.2
 */
export class MockWalmartAdapter implements SourceAdapter {
  readonly sourceName = 'Walmart';
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
      throw new Error('Walmart API error: Connection timeout');
    }

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
        name: `${query} Value Pack`,
        price: 18999,
        rating: 4.3,
        reviews: 678,
        cat: 'Electronics',
      },
      {
        name: `${query} Plus`,
        price: 23499,
        rating: 4.6,
        reviews: 1045,
        cat: 'Electronics',
      },
      {
        name: `${query} Everyday`,
        price: 16499,
        rating: 3.9,
        reviews: 342,
        cat: 'Electronics',
      },
    ];

    return baseProducts
      .filter((p) => !category || category === 'All' || p.cat === category)
      .map((product, index) => ({
        id: `Walmart_${query.toLowerCase().replace(/\s+/g, '_')}_${index + 1}`,
        productName: product.name,
        source: this.sourceName,
        sourceUrl: `https://walmart.com/ip/${this.generateMockItemId()}`,
        price: product.price,
        currency: 'USD',
        rating: product.rating,
        reviewCount: product.reviews,
        category: product.cat,
        compositeScore: 0,
        fetchedAt: new Date().toISOString(),
        imageUrl: `https://i5.walmartimages.com/asr/${this.generateMockImageId()}.jpeg`,
      }));
  }

  private generateMockReviews(productId: string): Review[] {
    const reviews: Review[] = [
      {
        author: 'HappyShopper',
        rating: 5,
        text: 'Great value from Walmart! Always reliable. Product quality is excellent and the in-store pickup option made it super convenient.',
        date: this.getRandomDate(22),
        verified: true,
        sourceReviewUrl: `https://walmart.com/reviews/product/${this.generateRandomId()}`,
      },
      {
        author: 'FamilyFirst',
        rating: 4,
        text: 'Good product for the family. Price was very competitive compared to other retailers. Meets all our needs perfectly.',
        date: this.getRandomDate(35),
        verified: true,
        sourceReviewUrl: `https://walmart.com/reviews/product/${this.generateRandomId()}`,
      },
      {
        author: 'SmartBuyer',
        rating: 5,
        text: 'Best price I found anywhere! Walmart Plus free shipping was a huge bonus. Item arrived in perfect condition and works flawlessly.',
        date: this.getRandomDate(12),
        verified: true,
        sourceReviewUrl: `https://walmart.com/reviews/product/${this.generateRandomId()}`,
      },
      {
        author: 'PracticalMom',
        rating: 4,
        text: 'Solid choice for everyday needs. Not fancy but gets the job done reliably. Good quality at this price point.',
        date: this.getRandomDate(48),
        verified: true,
        sourceReviewUrl: `https://walmart.com/reviews/product/${this.generateRandomId()}`,
      },
      {
        author: 'BudgetConscious',
        rating: 3,
        text: 'Decent for the price but had some issues. Customer service helped resolve the problem. Acceptable quality for budget-conscious shoppers.',
        date: this.getRandomDate(65),
        verified: false,
        sourceReviewUrl: `https://walmart.com/reviews/product/${this.generateRandomId()}`,
      },
    ];

    return reviews;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateMockItemId(): string {
    return Math.floor(Math.random() * 1000000000).toString();
  }

  private generateMockImageId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      '-' +
      Math.random().toString(36).substring(2, 9)
    );
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private getRandomDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }
}
