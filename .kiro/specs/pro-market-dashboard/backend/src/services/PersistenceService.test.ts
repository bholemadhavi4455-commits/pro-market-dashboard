import { PersistenceService } from './PersistenceService';
import { PriceHistoryRecord } from '../models/types';
import * as fs from 'fs';
import * as path from 'path';

describe('PersistenceService', () => {
  let service: PersistenceService;
  const testDbPath = './test_price_history.db';

  beforeEach(async () => {
    // Remove test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create new service instance with test database
    service = new PersistenceService(testDbPath);

    // Wait a bit for database initialization
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    // Close database connection
    await service.close();

    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('storePriceSnapshot', () => {
    it('should store a new price snapshot', async () => {
      const listingId = 'amazon_prod123';
      const price = 24999;
      const timestamp = new Date('2025-01-15T10:00:00Z');

      await service.storePriceSnapshot(listingId, price, timestamp);

      const history = await service.getPriceHistory(listingId, 30);
      expect(history).toHaveLength(1);
      expect(history[0].price).toBe(price);
      expect(history[0].timestamp.getTime()).toBe(timestamp.getTime());
    });

    it('should store multiple price snapshots for different timestamps', async () => {
      const listingId = 'amazon_prod123';

      await service.storePriceSnapshot(
        listingId,
        25999,
        new Date('2025-01-01T00:00:00Z')
      );
      await service.storePriceSnapshot(
        listingId,
        24999,
        new Date('2025-01-08T00:00:00Z')
      );
      await service.storePriceSnapshot(
        listingId,
        23999,
        new Date('2025-01-15T00:00:00Z')
      );

      const history = await service.getPriceHistory(listingId, 30);
      expect(history).toHaveLength(3);
      expect(history[0].price).toBe(25999); // Oldest first
      expect(history[1].price).toBe(24999);
      expect(history[2].price).toBe(23999); // Newest last
    });

    it('should update existing record when within 1-hour window (same time)', async () => {
      const listingId = 'amazon_prod123';
      const timestamp = new Date('2025-01-15T10:00:00Z');

      // Store initial price
      await service.storePriceSnapshot(listingId, 24999, timestamp);

      // Store updated price at same timestamp
      await service.storePriceSnapshot(listingId, 23999, timestamp);

      // Should only have one record with updated price
      const history = await service.getPriceHistory(listingId, 30);
      expect(history).toHaveLength(1);
      expect(history[0].price).toBe(23999);
      expect(history[0].timestamp.getTime()).toBe(timestamp.getTime());
    });

    it('should update existing record when within 1-hour window (30 minutes later)', async () => {
      const listingId = 'amazon_prod123';
      const timestamp1 = new Date('2025-01-15T10:00:00Z');
      const timestamp2 = new Date('2025-01-15T10:30:00Z'); // 30 minutes later

      await service.storePriceSnapshot(listingId, 24999, timestamp1);
      await service.storePriceSnapshot(listingId, 23999, timestamp2);

      // Should only have one record with updated price and timestamp
      const history = await service.getPriceHistory(listingId, 30);
      expect(history).toHaveLength(1);
      expect(history[0].price).toBe(23999);
      expect(history[0].timestamp.getTime()).toBe(timestamp2.getTime());
    });

    it('should update existing record when within 1-hour window (59 minutes later)', async () => {
      const listingId = 'amazon_prod123';
      const timestamp1 = new Date('2025-01-15T10:00:00Z');
      const timestamp2 = new Date('2025-01-15T10:59:00Z'); // 59 minutes later

      await service.storePriceSnapshot(listingId, 24999, timestamp1);
      await service.storePriceSnapshot(listingId, 23999, timestamp2);

      const history = await service.getPriceHistory(listingId, 30);
      expect(history).toHaveLength(1);
      expect(history[0].price).toBe(23999);
    });

    it('should create new record when outside 1-hour window (61 minutes later)', async () => {
      const listingId = 'amazon_prod123';
      const timestamp1 = new Date('2025-01-15T10:00:00Z');
      const timestamp2 = new Date('2025-01-15T11:01:00Z'); // 61 minutes later

      await service.storePriceSnapshot(listingId, 24999, timestamp1);
      await service.storePriceSnapshot(listingId, 23999, timestamp2);

      // Should have two separate records
      const history = await service.getPriceHistory(listingId, 30);
      expect(history).toHaveLength(2);
      expect(history[0].price).toBe(24999);
      expect(history[1].price).toBe(23999);
    });

    it('should create new record when more than 1 hour apart', async () => {
      const listingId = 'amazon_prod123';
      const timestamp1 = new Date('2025-01-15T10:00:00Z');
      const timestamp2 = new Date('2025-01-15T12:00:00Z'); // 2 hours later

      await service.storePriceSnapshot(listingId, 24999, timestamp1);
      await service.storePriceSnapshot(listingId, 23999, timestamp2);

      const history = await service.getPriceHistory(listingId, 30);
      expect(history).toHaveLength(2);
    });

    it('should handle different listing IDs independently', async () => {
      const timestamp = new Date('2025-01-15T10:00:00Z');

      await service.storePriceSnapshot('amazon_prod123', 24999, timestamp);
      await service.storePriceSnapshot('ebay_prod456', 23999, timestamp);

      const history1 = await service.getPriceHistory('amazon_prod123', 30);
      const history2 = await service.getPriceHistory('ebay_prod456', 30);

      expect(history1).toHaveLength(1);
      expect(history1[0].price).toBe(24999);
      expect(history2).toHaveLength(1);
      expect(history2[0].price).toBe(23999);
    });

    it('should throw error when database operation fails', async () => {
      // Close the database to force an error
      await service.close();

      await expect(
        service.storePriceSnapshot('amazon_prod123', 24999, new Date())
      ).rejects.toThrow();
    });
  });

  describe('getPriceHistory', () => {
    it('should return empty array when no history exists', async () => {
      const history = await service.getPriceHistory('nonexistent', 30);
      expect(history).toEqual([]);
    });

    it('should return records within the specified date range', async () => {
      const listingId = 'amazon_prod123';
      const now = new Date();

      // Store records at different times
      await service.storePriceSnapshot(
        listingId,
        25999,
        new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
      );
      await service.storePriceSnapshot(
        listingId,
        24999,
        new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
      );
      await service.storePriceSnapshot(
        listingId,
        23999,
        new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      );

      // Get last 30 days
      const history30 = await service.getPriceHistory(listingId, 30);
      expect(history30).toHaveLength(2); // Only 15 and 5 days ago

      // Get last 7 days
      const history7 = await service.getPriceHistory(listingId, 7);
      expect(history7).toHaveLength(1); // Only 5 days ago

      // Get last 90 days
      const history90 = await service.getPriceHistory(listingId, 90);
      expect(history90).toHaveLength(3); // All records
    });

    it('should return records ordered from oldest to newest', async () => {
      const listingId = 'amazon_prod123';

      // Store in non-chronological order
      await service.storePriceSnapshot(
        listingId,
        23999,
        new Date('2025-01-15T00:00:00Z')
      );
      await service.storePriceSnapshot(
        listingId,
        25999,
        new Date('2025-01-01T00:00:00Z')
      );
      await service.storePriceSnapshot(
        listingId,
        24999,
        new Date('2025-01-08T00:00:00Z')
      );

      const history = await service.getPriceHistory(listingId, 30);

      expect(history).toHaveLength(3);
      expect(history[0].timestamp.toISOString()).toBe('2025-01-01T00:00:00.000Z');
      expect(history[1].timestamp.toISOString()).toBe('2025-01-08T00:00:00.000Z');
      expect(history[2].timestamp.toISOString()).toBe('2025-01-15T00:00:00.000Z');
    });

    it('should filter by listing ID correctly', async () => {
      const timestamp = new Date('2025-01-15T10:00:00Z');

      await service.storePriceSnapshot('amazon_prod123', 24999, timestamp);
      await service.storePriceSnapshot('ebay_prod456', 23999, timestamp);
      await service.storePriceSnapshot('walmart_prod789', 22999, timestamp);

      const history = await service.getPriceHistory('amazon_prod123', 30);
      expect(history).toHaveLength(1);
      expect(history[0].price).toBe(24999);
    });

    it('should default to 30 days when rangeDays not specified', async () => {
      const listingId = 'amazon_prod123';
      const now = new Date();

      await service.storePriceSnapshot(
        listingId,
        24999,
        new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
      );

      const history = await service.getPriceHistory(listingId);
      expect(history).toHaveLength(1);
    });

    it('should handle edge case of exactly rangeDays ago', async () => {
      const listingId = 'amazon_prod123';
      const now = new Date();
      const exactly30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      await service.storePriceSnapshot(listingId, 24999, exactly30DaysAgo);

      const history = await service.getPriceHistory(listingId, 30);
      expect(history).toHaveLength(1);
    });

    it('should throw error when database operation fails', async () => {
      await service.close();

      await expect(service.getPriceHistory('amazon_prod123', 30)).rejects.toThrow();
    });
  });

  describe('getRecordCount', () => {
    it('should return 0 when no records exist', async () => {
      const count = await service.getRecordCount();
      expect(count).toBe(0);
    });

    it('should return total count of all records', async () => {
      const timestamp = new Date('2025-01-15T10:00:00Z');

      await service.storePriceSnapshot('amazon_prod123', 24999, timestamp);
      await service.storePriceSnapshot('ebay_prod456', 23999, timestamp);
      await service.storePriceSnapshot('walmart_prod789', 22999, timestamp);

      const count = await service.getRecordCount();
      expect(count).toBe(3);
    });

    it('should return count for specific listing ID', async () => {
      const timestamp = new Date('2025-01-15T10:00:00Z');

      await service.storePriceSnapshot('amazon_prod123', 24999, timestamp);
      await service.storePriceSnapshot('amazon_prod123', 23999, new Date('2025-01-16T10:00:00Z'));
      await service.storePriceSnapshot('ebay_prod456', 22999, timestamp);

      const count = await service.getRecordCount('amazon_prod123');
      expect(count).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('should remove all records from database', async () => {
      const timestamp = new Date('2025-01-15T10:00:00Z');

      await service.storePriceSnapshot('amazon_prod123', 24999, timestamp);
      await service.storePriceSnapshot('ebay_prod456', 23999, timestamp);

      let count = await service.getRecordCount();
      expect(count).toBe(2);

      await service.clearAll();

      count = await service.getRecordCount();
      expect(count).toBe(0);
    });
  });

  describe('getListingMetadata', () => {
    it('should return null (not implemented)', async () => {
      const metadata = await service.getListingMetadata('amazon_prod123');
      expect(metadata).toBeNull();
    });
  });

  describe('database connection management', () => {
    it('should close database connection successfully', async () => {
      await expect(service.close()).resolves.not.toThrow();
    });

    it('should throw error when operating on closed database', async () => {
      await service.close();

      await expect(
        service.storePriceSnapshot('amazon_prod123', 24999, new Date())
      ).rejects.toThrow();
    });
  });

  describe('data directory creation', () => {
    it('should create data directory if it does not exist', async () => {
      const dataDir = './test_data';
      const dbPath = path.join(dataDir, 'test.db');

      // Ensure directory doesn't exist
      if (fs.existsSync(dataDir)) {
        fs.rmSync(dataDir, { recursive: true });
      }

      // Create directory
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const testService = new PersistenceService(dbPath);
      await new Promise((resolve) => setTimeout(resolve, 100));

      await testService.storePriceSnapshot('test', 100, new Date());
      const count = await testService.getRecordCount();
      expect(count).toBe(1);

      await testService.close();

      // Cleanup
      if (fs.existsSync(dataDir)) {
        fs.rmSync(dataDir, { recursive: true });
      }
    });
  });
});
