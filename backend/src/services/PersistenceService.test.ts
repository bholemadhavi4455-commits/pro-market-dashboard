import { PersistenceService } from './PersistenceService';
import fs from 'fs';
import path from 'path';
import * as fc from 'fast-check';
import { arbListing } from '../test/generators';

describe('PersistenceService', () => {
  let service: PersistenceService;
  const testDbPath = path.join(__dirname, '../../data/test_pro_market.db');

  beforeEach(async () => {
    // Remove test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create new service instance with test database
    service = new PersistenceService(testDbPath);
    await service.initialize();
  });

  afterEach(async () => {
    // Clean up after each test
    await service.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('initialize', () => {
    it('should create database connection and schema', async () => {
      expect(service.isConnected()).toBe(true);
      expect(fs.existsSync(testDbPath)).toBe(true);
    });
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
      expect(history[0].timestamp.toISOString()).toBe(timestamp.toISOString());
    });

    it('should update existing record within 1-hour window', async () => {
      const listingId = 'amazon_prod123';
      const price1 = 24999;
      const price2 = 23999;
      const timestamp1 = new Date('2025-01-15T10:00:00Z');
      const timestamp2 = new Date('2025-01-15T10:30:00Z'); // 30 minutes later

      await service.storePriceSnapshot(listingId, price1, timestamp1);
      await service.storePriceSnapshot(listingId, price2, timestamp2);

      const history = await service.getPriceHistory(listingId, 30);
      expect(history).toHaveLength(1);
      expect(history[0].price).toBe(price2);
      expect(history[0].timestamp.toISOString()).toBe(timestamp2.toISOString());
    });

    it('should create separate records outside 1-hour window', async () => {
      const listingId = 'amazon_prod123';
      const price1 = 24999;
      const price2 = 23999;
      const timestamp1 = new Date('2025-01-15T10:00:00Z');
      const timestamp2 = new Date('2025-01-15T12:00:00Z'); // 2 hours later

      await service.storePriceSnapshot(listingId, price1, timestamp1);
      await service.storePriceSnapshot(listingId, price2, timestamp2);

      const history = await service.getPriceHistory(listingId, 30);
      expect(history).toHaveLength(2);
      expect(history[0].price).toBe(price1);
      expect(history[1].price).toBe(price2);
    });

    it('should handle multiple listings independently', async () => {
      const listing1 = 'amazon_prod123';
      const listing2 = 'ebay_prod456';
      const price1 = 24999;
      const price2 = 25999;
      const timestamp = new Date('2025-01-15T10:00:00Z');

      await service.storePriceSnapshot(listing1, price1, timestamp);
      await service.storePriceSnapshot(listing2, price2, timestamp);

      const history1 = await service.getPriceHistory(listing1, 30);
      const history2 = await service.getPriceHistory(listing2, 30);

      expect(history1).toHaveLength(1);
      expect(history2).toHaveLength(1);
      expect(history1[0].price).toBe(price1);
      expect(history2[0].price).toBe(price2);
    });
  });

  describe('getPriceHistory', () => {
    it('should return empty array for listing with no history', async () => {
      const history = await service.getPriceHistory('unknown_listing', 30);
      expect(history).toHaveLength(0);
    });

    it('should return history within specified date range', async () => {
      const listingId = 'amazon_prod123';
      const now = new Date();
      
      // Store prices at different times
      await service.storePriceSnapshot(listingId, 25999, new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000)); // 40 days ago
      await service.storePriceSnapshot(listingId, 24999, new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)); // 15 days ago
      await service.storePriceSnapshot(listingId, 23999, new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000));  // 5 days ago

      // Query last 7 days
      const history7 = await service.getPriceHistory(listingId, 7);
      expect(history7).toHaveLength(1);
      expect(history7[0].price).toBe(23999);

      // Query last 30 days
      const history30 = await service.getPriceHistory(listingId, 30);
      expect(history30).toHaveLength(2);
      expect(history30[0].price).toBe(24999);
      expect(history30[1].price).toBe(23999);

      // Query last 90 days
      const history90 = await service.getPriceHistory(listingId, 90);
      expect(history90).toHaveLength(3);
      expect(history90[0].price).toBe(25999);
      expect(history90[1].price).toBe(24999);
      expect(history90[2].price).toBe(23999);
    });

    it('should return history ordered by timestamp ascending', async () => {
      const listingId = 'amazon_prod123';
      const timestamps = [
        new Date('2025-01-10T10:00:00Z'),
        new Date('2025-01-12T10:00:00Z'),
        new Date('2025-01-08T10:00:00Z'),
        new Date('2025-01-15T10:00:00Z'),
      ];
      const prices = [25999, 24999, 26999, 23999];

      // Store in random order
      for (let i = 0; i < timestamps.length; i++) {
        await service.storePriceSnapshot(listingId, prices[i], timestamps[i]);
      }

      const history = await service.getPriceHistory(listingId, 30);
      expect(history).toHaveLength(4);
      
      // Verify ascending order
      for (let i = 1; i < history.length; i++) {
        expect(history[i].timestamp.getTime()).toBeGreaterThan(
          history[i - 1].timestamp.getTime()
        );
      }
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      expect(service.isConnected()).toBe(true);
      await service.close();
      expect(service.isConnected()).toBe(false);
    });

    it('should handle closing when not connected', async () => {
      await service.close();
      await expect(service.close()).resolves.not.toThrow();
    });
  });

  describe('Property 16: Price History Temporal Deduplication', () => {
    /**
     * **Validates: Requirements 10.4**
     * 
     * Property: For any PriceHistory record with (listingId, price, timestamp), 
     * when a new record is stored with the same listingId and a timestamp within 
     * a 1-hour window (±3600 seconds) of an existing record's timestamp, the system 
     * SHALL update the existing record rather than creating a duplicate entry. 
     * The result SHALL be that no two records for the same listingId exist with 
     * timestamps within 1 hour of each other.
     */
    it('should update records within 1-hour window instead of creating duplicates', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbListing(),
          fc.integer({ min: 1000, max: 100000 }), // price1
          fc.integer({ min: 1000, max: 100000 }), // price2
          fc.integer({ min: 0, max: 3599 }), // seconds within 1 hour (0-3599)
          async (listing, price1, price2, secondsWithinHour) => {
            // Arrange: Create base timestamp and a second timestamp within 1-hour window
            const baseTimestamp = new Date('2025-01-15T10:00:00Z');
            const withinHourTimestamp = new Date(
              baseTimestamp.getTime() + secondsWithinHour * 1000
            );

            // Act: Store first record, then store second record within 1-hour window
            await service.storePriceSnapshot(listing.id, price1, baseTimestamp);
            await service.storePriceSnapshot(listing.id, price2, withinHourTimestamp);

            // Assert: Should have only 1 record (update, not duplicate)
            const history = await service.getPriceHistory(listing.id, 30);
            expect(history).toHaveLength(1);
            
            // Should have the updated price and timestamp
            expect(history[0].price).toBe(price2);
            expect(history[0].timestamp.toISOString()).toBe(withinHourTimestamp.toISOString());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create separate records when timestamps are more than 1 hour apart', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbListing(),
          fc.integer({ min: 1000, max: 100000 }), // price1
          fc.integer({ min: 1000, max: 100000 }), // price2
          fc.integer({ min: 3601, max: 86400 }), // seconds beyond 1 hour (3601-86400)
          async (listing, price1, price2, secondsBeyondHour) => {
            // Arrange: Create base timestamp and a second timestamp beyond 1-hour window
            const baseTimestamp = new Date('2025-01-15T10:00:00Z');
            const beyondHourTimestamp = new Date(
              baseTimestamp.getTime() + secondsBeyondHour * 1000
            );

            // Act: Store first record, then store second record beyond 1-hour window
            await service.storePriceSnapshot(listing.id, price1, baseTimestamp);
            await service.storePriceSnapshot(listing.id, price2, beyondHourTimestamp);

            // Assert: Should have 2 separate records
            const history = await service.getPriceHistory(listing.id, 30);
            expect(history).toHaveLength(2);
            
            // Both records should exist with their original prices
            expect(history[0].price).toBe(price1);
            expect(history[0].timestamp.toISOString()).toBe(baseTimestamp.toISOString());
            expect(history[1].price).toBe(price2);
            expect(history[1].timestamp.toISOString()).toBe(beyondHourTimestamp.toISOString());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple updates within 1-hour window (always keep latest)', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbListing(),
          fc.array(fc.integer({ min: 1000, max: 100000 }), { minLength: 3, maxLength: 5 }), // prices
          async (listing, prices) => {
            // Arrange: Create timestamps all within the same 1-hour window
            const baseTimestamp = new Date('2025-01-15T10:00:00Z');
            const timestamps = prices.map((_, idx) => 
              new Date(baseTimestamp.getTime() + (idx * 600 * 1000)) // 10-minute intervals
            );

            // Act: Store multiple records within 1-hour window
            for (let i = 0; i < prices.length; i++) {
              await service.storePriceSnapshot(listing.id, prices[i], timestamps[i]);
            }

            // Assert: Should have only 1 record (the latest one)
            const history = await service.getPriceHistory(listing.id, 30);
            expect(history).toHaveLength(1);
            
            // Should have the last price and timestamp
            const lastIdx = prices.length - 1;
            expect(history[0].price).toBe(prices[lastIdx]);
            expect(history[0].timestamp.toISOString()).toBe(timestamps[lastIdx].toISOString());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle deduplication independently per listingId', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(arbListing(), arbListing()),
          fc.integer({ min: 1000, max: 100000 }),
          fc.integer({ min: 1000, max: 100000 }),
          fc.integer({ min: 0, max: 3599 }),
          async ([listing1, listing2], price1, price2, secondsWithinHour) => {
            // Ensure listings have different IDs
            fc.pre(listing1.id !== listing2.id);

            // Arrange: Same base timestamp for both listings
            const baseTimestamp = new Date('2025-01-15T10:00:00Z');
            const withinHourTimestamp = new Date(
              baseTimestamp.getTime() + secondsWithinHour * 1000
            );

            // Act: Store records for both listings with timestamps within 1 hour
            await service.storePriceSnapshot(listing1.id, price1, baseTimestamp);
            await service.storePriceSnapshot(listing1.id, price2, withinHourTimestamp);
            await service.storePriceSnapshot(listing2.id, price1, baseTimestamp);
            await service.storePriceSnapshot(listing2.id, price2, withinHourTimestamp);

            // Assert: Each listing should have exactly 1 record (updated)
            const history1 = await service.getPriceHistory(listing1.id, 30);
            const history2 = await service.getPriceHistory(listing2.id, 30);
            
            expect(history1).toHaveLength(1);
            expect(history2).toHaveLength(1);
            
            // Both should have the updated price
            expect(history1[0].price).toBe(price2);
            expect(history2[0].price).toBe(price2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ===========================
  // Price Alerts Tests
  // ===========================

  describe('createPriceAlert', () => {
    it('should create a new price alert with auto-generated id and timestamps', async () => {
      const alertData = {
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      };

      const alert = await service.createPriceAlert(alertData);

      expect(alert.id).toBeDefined();
      expect(alert.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(alert.listingId).toBe(alertData.listingId);
      expect(alert.productName).toBe(alertData.productName);
      expect(alert.source).toBe(alertData.source);
      expect(alert.alertThreshold).toBe(alertData.alertThreshold);
      expect(alert.currency).toBe(alertData.currency);
      expect(alert.currentPrice).toBe(alertData.currentPrice);
      expect(alert.createdAt).toBeDefined();
      expect(alert.triggered).toBe(false);
      expect(alert.triggeredAt).toBeNull();
    });

    it('should create multiple alerts for the same listing', async () => {
      const alertData1 = {
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      };

      const alertData2 = {
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 18000,
        currency: 'INR',
        currentPrice: 25000,
      };

      const alert1 = await service.createPriceAlert(alertData1);
      const alert2 = await service.createPriceAlert(alertData2);

      expect(alert1.id).not.toBe(alert2.id);
      
      const alertsByListing = await service.getAlertsByListing('amazon_prod123');
      expect(alertsByListing).toHaveLength(2);
    });
  });

  describe('getActiveAlerts', () => {
    it('should return empty array when no alerts exist', async () => {
      const alerts = await service.getActiveAlerts();
      expect(alerts).toHaveLength(0);
    });

    it('should return all untriggered alerts ordered by creation date', async () => {
      // Create three alerts
      const alert1 = await service.createPriceAlert({
        listingId: 'amazon_prod1',
        productName: 'Product 1',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      });

      const alert2 = await service.createPriceAlert({
        listingId: 'amazon_prod2',
        productName: 'Product 2',
        source: 'Amazon',
        alertThreshold: 15000,
        currency: 'INR',
        currentPrice: 20000,
      });

      const alert3 = await service.createPriceAlert({
        listingId: 'flipkart_prod3',
        productName: 'Product 3',
        source: 'Flipkart',
        alertThreshold: 10000,
        currency: 'INR',
        currentPrice: 15000,
      });

      const activeAlerts = await service.getActiveAlerts();
      
      expect(activeAlerts).toHaveLength(3);
      // Should be ordered by created_at DESC (newest first)
      expect(activeAlerts[0].id).toBe(alert3.id);
      expect(activeAlerts[1].id).toBe(alert2.id);
      expect(activeAlerts[2].id).toBe(alert1.id);
    });

    it('should exclude triggered alerts', async () => {
      const alert1 = await service.createPriceAlert({
        listingId: 'amazon_prod1',
        productName: 'Product 1',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      });

      const alert2 = await service.createPriceAlert({
        listingId: 'amazon_prod2',
        productName: 'Product 2',
        source: 'Amazon',
        alertThreshold: 15000,
        currency: 'INR',
        currentPrice: 20000,
      });

      // Trigger one alert
      await service.triggerAlert(alert1.id);

      const activeAlerts = await service.getActiveAlerts();
      
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].id).toBe(alert2.id);
    });
  });

  describe('getAlertsByListing', () => {
    it('should return empty array for listing with no alerts', async () => {
      const alerts = await service.getAlertsByListing('unknown_listing');
      expect(alerts).toHaveLength(0);
    });

    it('should return all alerts for a specific listing', async () => {
      await service.createPriceAlert({
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      });

      await service.createPriceAlert({
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 18000,
        currency: 'INR',
        currentPrice: 25000,
      });

      await service.createPriceAlert({
        listingId: 'flipkart_prod456',
        productName: 'Other Product',
        source: 'Flipkart',
        alertThreshold: 15000,
        currency: 'INR',
        currentPrice: 20000,
      });

      const amazonAlerts = await service.getAlertsByListing('amazon_prod123');
      const flipkartAlerts = await service.getAlertsByListing('flipkart_prod456');

      expect(amazonAlerts).toHaveLength(2);
      expect(flipkartAlerts).toHaveLength(1);
      expect(amazonAlerts[0].listingId).toBe('amazon_prod123');
      expect(amazonAlerts[1].listingId).toBe('amazon_prod123');
      expect(flipkartAlerts[0].listingId).toBe('flipkart_prod456');
    });

    it('should include both triggered and untriggered alerts for a listing', async () => {
      const alert1 = await service.createPriceAlert({
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      });

      await service.createPriceAlert({
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 18000,
        currency: 'INR',
        currentPrice: 25000,
      });

      await service.triggerAlert(alert1.id);

      const alerts = await service.getAlertsByListing('amazon_prod123');
      expect(alerts).toHaveLength(2);
      expect(alerts.some(a => a.triggered)).toBe(true);
      expect(alerts.some(a => !a.triggered)).toBe(true);
    });
  });

  describe('triggerAlert', () => {
    it('should mark an alert as triggered and set triggeredAt timestamp', async () => {
      const alert = await service.createPriceAlert({
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      });

      expect(alert.triggered).toBe(false);
      expect(alert.triggeredAt).toBeNull();

      await service.triggerAlert(alert.id);

      const alerts = await service.getAlertsByListing('amazon_prod123');
      const triggeredAlert = alerts.find(a => a.id === alert.id);

      expect(triggeredAlert).toBeDefined();
      expect(triggeredAlert!.triggered).toBe(true);
      expect(triggeredAlert!.triggeredAt).toBeDefined();
      expect(triggeredAlert!.triggeredAt).not.toBeNull();
    });

    it('should remove triggered alert from active alerts list', async () => {
      const alert = await service.createPriceAlert({
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      });

      let activeAlerts = await service.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);

      await service.triggerAlert(alert.id);

      activeAlerts = await service.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);
    });
  });

  describe('deleteAlert', () => {
    it('should delete an alert by id', async () => {
      const alert = await service.createPriceAlert({
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      });

      let alerts = await service.getActiveAlerts();
      expect(alerts).toHaveLength(1);

      await service.deleteAlert(alert.id);

      alerts = await service.getActiveAlerts();
      expect(alerts).toHaveLength(0);
    });

    it('should only delete the specified alert', async () => {
      const alert1 = await service.createPriceAlert({
        listingId: 'amazon_prod1',
        productName: 'Product 1',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      });

      const alert2 = await service.createPriceAlert({
        listingId: 'amazon_prod2',
        productName: 'Product 2',
        source: 'Amazon',
        alertThreshold: 15000,
        currency: 'INR',
        currentPrice: 20000,
      });

      await service.deleteAlert(alert1.id);

      const alerts = await service.getActiveAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe(alert2.id);
    });
  });

  describe('updateAlertPrice', () => {
    it('should update current price for all untriggered alerts of a listing', async () => {
      await service.createPriceAlert({
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      });

      await service.createPriceAlert({
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 18000,
        currency: 'INR',
        currentPrice: 25000,
      });

      const newPrice = 22000;
      await service.updateAlertPrice('amazon_prod123', newPrice);

      const alerts = await service.getAlertsByListing('amazon_prod123');
      expect(alerts).toHaveLength(2);
      expect(alerts[0].currentPrice).toBe(newPrice);
      expect(alerts[1].currentPrice).toBe(newPrice);
    });

    it('should not update triggered alerts', async () => {
      const alert1 = await service.createPriceAlert({
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      });

      const alert2 = await service.createPriceAlert({
        listingId: 'amazon_prod123',
        productName: 'Test Product',
        source: 'Amazon',
        alertThreshold: 18000,
        currency: 'INR',
        currentPrice: 25000,
      });

      await service.triggerAlert(alert1.id);

      const newPrice = 22000;
      await service.updateAlertPrice('amazon_prod123', newPrice);

      const alerts = await service.getAlertsByListing('amazon_prod123');
      const triggeredAlert = alerts.find(a => a.id === alert1.id);
      const activeAlert = alerts.find(a => a.id === alert2.id);

      expect(triggeredAlert!.currentPrice).toBe(25000); // Should not change
      expect(activeAlert!.currentPrice).toBe(newPrice); // Should change
    });

    it('should only update alerts for the specified listing', async () => {
      await service.createPriceAlert({
        listingId: 'amazon_prod123',
        productName: 'Product 1',
        source: 'Amazon',
        alertThreshold: 20000,
        currency: 'INR',
        currentPrice: 25000,
      });

      await service.createPriceAlert({
        listingId: 'flipkart_prod456',
        productName: 'Product 2',
        source: 'Flipkart',
        alertThreshold: 15000,
        currency: 'INR',
        currentPrice: 20000,
      });

      const newPrice = 22000;
      await service.updateAlertPrice('amazon_prod123', newPrice);

      const amazonAlerts = await service.getAlertsByListing('amazon_prod123');
      const flipkartAlerts = await service.getAlertsByListing('flipkart_prod456');

      expect(amazonAlerts[0].currentPrice).toBe(newPrice);
      expect(flipkartAlerts[0].currentPrice).toBe(20000); // Should not change
    });
  });
});
