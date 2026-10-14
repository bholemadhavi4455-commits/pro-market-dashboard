import { SourceAdapter } from './SourceAdapter';
import { Listing, Review } from '../models/types';

/**
 * Mock eBay adapter for testing
 * Generates realistic mock data for eBay listings
 * 
 * Requirements: 2.1, 2.2
 */
export class MockEbayAdapter implements SourceAdapter {
  readonly sourceName = 'eBay';
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
      throw new Error('eBay API error: Rate limit exceeded');
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
        name: `${query} Pro Edition`,
        price: 22999,
        rating: 4.3,
        reviews: 734,
        cat: 'Electronics',
      },
      {
        name: `${query} Refurbished`,
        price: 16999,
        rating: 4.1,
        reviews: 521,
        cat: 'Electronics',
      },
      {
        name: `${query} - New`,
        price: 21499,
        rating: 4.4,
        reviews: 892,
        cat: 'Electronics',
      },
    ];

    return baseProducts
      .filter((p) => !category || category === 'All' || p.cat === category)
      .map((product, index) => ({
        id: `eBay_${query.toLowerCase().replace(/\s+/g, '_')}_${index + 1}`,
        productName: product.name,
        source: this.sourceName,
        sourceUrl: `https://ebay.com/itm/${this.generateMockItemId()}`,
        price: product.price,
        currency: 'USD',
        rating: product.rating,
        reviewCount: product.reviews,
        category: product.cat,
        compositeScore: 0,
        fetchedAt: new Date().toISOString(),
        imageUrl: `https://i.ebayimg.com/images/g/${this.generateMockImageId()}/s-l1600.jpg`,
      }));
  }

  private generateMockReviews(productId: string): Review[] {
    const reviews: Review[] = [
      {
        author: 'TechGuru99',
        rating: 4,
        text: 'Great seller, fast shipping! Item exactly as described. Had a minor issue but seller resolved it quickly. Would definitely purchase from this seller again.',
        date: this.getRandomDate(25),
        verified: true,
        sourceReviewUrl: `https://ebay.com/fdbk/${this.generateRandomId()}`,
      },
      {
        author: 'BargainHunter',
        rating: 5,
        text: 'Amazing deal! Better than retail stores. Item arrived well-packaged and in pristine condition. Very happy with this purchase.',
        date: this.getRandomDate(40),
        verified: true,
        sourceReviewUrl: `https://ebay.com/fdbk/${this.generateRandomId()}`,
      },
      {
        author: 'ShopSmart2023',
        rating: 4,
        text: 'Good quality product. Took a bit longer to arrive than expected but worth the wait. Product performs exactly as advertised.',
        date: this.getRandomDate(18),
        verified: true,
        sourceReviewUrl: `https://ebay.com/fdbk/${this.generateRandomId()}`,
      },
      {
        author: 'ValueSeeker',
        rating: 3,
        text: 'Product is okay for the price. Some minor cosmetic issues but functionally works fine. Not premium quality but decent.',
        date: this.getRandomDate(55),
        verified: false,
        sourceReviewUrl: `https://ebay.com/fdbk/${this.generateRandomId()}`,
      },
    ];

    return reviews;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateMockItemId(): string {
    return Math.floor(Math.random() * 1000000000000).toString();
  }

  private generateMockImageId(): string {
    return Math.random().toString(36).substring(2, 15) + '~';
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
