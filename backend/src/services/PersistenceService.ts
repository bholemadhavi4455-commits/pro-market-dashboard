import sqlite3 from 'sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';
import { PriceAlert } from '../models';

/**
 * PersistenceService handles database operations for price history
 * Implements connection management, schema initialization, and CRUD operations
 * 
 * Validates: Requirements 10.3
 */
export class PersistenceService {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Default to development database in backend directory
    this.dbPath = dbPath || path.join(__dirname, '../../data/pro_market.db');
  }

  /**
   * Initialize database connection and create schema if needed
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Failed to connect to database:', err);
          reject(err);
          return;
        }
        console.log(`Connected to SQLite database at ${this.dbPath}`);
        this.createSchema()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  /**
   * Create database schema for price_history, price_alerts, and wishlist_items tables
   * 
   * price_history table design:
   * - listing_id: identifier from source (VARCHAR)
   * - price: stored in smallest currency unit (INTEGER)
   * - timestamp: when price was recorded (TIMESTAMP)
   * - UNIQUE constraint on (listing_id, timestamp) to prevent duplicates
   * - Index on (listing_id, timestamp) for efficient queries
   * 
   * price_alerts table design (Requirements 1.2):
   * - id: UUID v4 identifier (VARCHAR(36))
   * - listing_id: identifier from source (VARCHAR(255))
   * - product_name: product display name (VARCHAR(200))
   * - source: source identifier (VARCHAR(50))
   * - alert_threshold: trigger price in smallest currency unit (INTEGER)
   * - currency: ISO 4217 currency code (CHAR(3))
   * - current_price: latest known price (INTEGER)
   * - created_at: when alert was created (TIMESTAMP)
   * - triggered: whether alert has been triggered (BOOLEAN)
   * - triggered_at: when alert was triggered (TIMESTAMP NULL)
   * - CHECK constraints for positive prices
   * - Indexes for listing_id and triggered columns
   * 
   * wishlist_items table design (Requirements 2.2):
   * - id: UUID v4 identifier (VARCHAR(36))
   * - listing_id: identifier from source (VARCHAR(255)) - UNIQUE to prevent duplicates
   * - product_name: product display name (VARCHAR(200))
   * - source: source identifier (VARCHAR(50))
   * - saved_price: price when added to wishlist (INTEGER)
   * - current_price: latest known price (INTEGER)
   * - currency: ISO 4217 currency code (CHAR(3))
   * - added_at: when item was added to wishlist (TIMESTAMP)
   * - category: product category (VARCHAR(50))
   * - image_url: optional product thumbnail URL (TEXT)
   * - UNIQUE constraint on listing_id (one entry per listing)
   * - CHECK constraints for positive prices
   * - Indexes for added_at and category columns
   */
  private createSchema(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const createPriceHistoryTableSQL = `
        CREATE TABLE IF NOT EXISTS price_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          listing_id VARCHAR(255) NOT NULL,
          price INTEGER NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          UNIQUE(listing_id, timestamp)
        )
      `;

      const createPriceHistoryIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_listing_timestamp 
        ON price_history(listing_id, timestamp)
      `;

      const createPriceAlertsTableSQL = `
        CREATE TABLE IF NOT EXISTS price_alerts (
          id VARCHAR(36) PRIMARY KEY,
          listing_id VARCHAR(255) NOT NULL,
          product_name VARCHAR(200) NOT NULL,
          source VARCHAR(50) NOT NULL,
          alert_threshold INTEGER NOT NULL,
          currency CHAR(3) NOT NULL,
          current_price INTEGER NOT NULL,
          created_at TIMESTAMP NOT NULL,
          triggered BOOLEAN DEFAULT 0,
          triggered_at TIMESTAMP NULL,
          CHECK (alert_threshold > 0),
          CHECK (current_price > 0)
        )
      `;

      const createPriceAlertsListingIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_alerts_listing 
        ON price_alerts(listing_id)
      `;

      const createPriceAlertsTriggeredIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_alerts_triggered 
        ON price_alerts(triggered, created_at)
      `;

      const createWishlistItemsTableSQL = `
        CREATE TABLE IF NOT EXISTS wishlist_items (
          id VARCHAR(36) PRIMARY KEY,
          listing_id VARCHAR(255) NOT NULL UNIQUE,
          product_name VARCHAR(200) NOT NULL,
          source VARCHAR(50) NOT NULL,
          saved_price INTEGER NOT NULL,
          current_price INTEGER NOT NULL,
          currency CHAR(3) NOT NULL,
          added_at TIMESTAMP NOT NULL,
          category VARCHAR(50) NOT NULL,
          image_url TEXT NULL,
          CHECK (saved_price > 0),
          CHECK (current_price > 0)
        )
      `;

      const createWishlistAddedIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_wishlist_added 
        ON wishlist_items(added_at DESC)
      `;

      const createWishlistCategoryIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_wishlist_category 
        ON wishlist_items(category)
      `;

      // Create price_history table
      this.db.run(createPriceHistoryTableSQL, (err) => {
        if (err) {
          console.error('Failed to create price_history table:', err);
          reject(err);
          return;
        }

        console.log('price_history table created or already exists');

        // Create price_history index
        this.db!.run(createPriceHistoryIndexSQL, (err) => {
          if (err) {
            console.error('Failed to create price_history index:', err);
            reject(err);
            return;
          }

          console.log('Index on price_history created or already exists');

          // Create price_alerts table
          this.db!.run(createPriceAlertsTableSQL, (err) => {
            if (err) {
              console.error('Failed to create price_alerts table:', err);
              reject(err);
              return;
            }

            console.log('price_alerts table created or already exists');

            // Create price_alerts listing index
            this.db!.run(createPriceAlertsListingIndexSQL, (err) => {
              if (err) {
                console.error('Failed to create price_alerts listing index:', err);
                reject(err);
                return;
              }

              console.log('Index on price_alerts(listing_id) created or already exists');

              // Create price_alerts triggered index
              this.db!.run(createPriceAlertsTriggeredIndexSQL, (err) => {
                if (err) {
                  console.error('Failed to create price_alerts triggered index:', err);
                  reject(err);
                  return;
                }

                console.log('Index on price_alerts(triggered, created_at) created or already exists');

                // Create wishlist_items table
                this.db!.run(createWishlistItemsTableSQL, (err) => {
                  if (err) {
                    console.error('Failed to create wishlist_items table:', err);
                    reject(err);
                    return;
                  }

                  console.log('wishlist_items table created or already exists');

                  // Create wishlist_items added_at index
                  this.db!.run(createWishlistAddedIndexSQL, (err) => {
                    if (err) {
                      console.error('Failed to create wishlist added_at index:', err);
                      reject(err);
                      return;
                    }

                    console.log('Index on wishlist_items(added_at DESC) created or already exists');

                    // Create wishlist_items category index
                    this.db!.run(createWishlistCategoryIndexSQL, (err) => {
                      if (err) {
                        console.error('Failed to create wishlist category index:', err);
                        reject(err);
                        return;
                      }

                      console.log('Index on wishlist_items(category) created or already exists');
                      resolve();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  /**
   * Store a price snapshot for a listing
   * Implements deduplication: if record exists within 1-hour window, update instead of insert
   * 
   * @param listingId - Listing identifier (format: "{source}_{productId}")
   * @param price - Price in smallest currency unit (e.g., cents/paise)
   * @param timestamp - When the price was recorded
   */
  async storePriceSnapshot(
    listingId: string,
    price: number,
    timestamp: Date
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // Check for existing record within 1-hour window
      const oneHourBefore = new Date(timestamp.getTime() - 60 * 60 * 1000);
      const oneHourAfter = new Date(timestamp.getTime() + 60 * 60 * 1000);

      const checkSQL = `
        SELECT id FROM price_history
        WHERE listing_id = ?
        AND timestamp BETWEEN ? AND ?
        LIMIT 1
      `;

      this.db.get(
        checkSQL,
        [listingId, oneHourBefore.toISOString(), oneHourAfter.toISOString()],
        (err, row: any) => {
          if (err) {
            console.error('Error checking for existing record:', err);
            reject(err);
            return;
          }

          if (row) {
            // Update existing record
            const updateSQL = `
              UPDATE price_history
              SET price = ?, timestamp = ?
              WHERE id = ?
            `;

            this.db!.run(updateSQL, [price, timestamp.toISOString(), row.id], (err) => {
              if (err) {
                console.error('Error updating price snapshot:', err);
                reject(err);
                return;
              }

              console.log(`Updated price snapshot for listing ${listingId}`);
              resolve();
            });
          } else {
            // Insert new record
            const insertSQL = `
              INSERT INTO price_history (listing_id, price, timestamp)
              VALUES (?, ?, ?)
            `;

            this.db!.run(
              insertSQL,
              [listingId, price, timestamp.toISOString()],
              (err) => {
                if (err) {
                  console.error('Error inserting price snapshot:', err);
                  reject(err);
                  return;
                }

                console.log(`Stored price snapshot for listing ${listingId}`);
                resolve();
              }
            );
          }
        }
      );
    });
  }

  /**
   * Retrieve price history for a listing within a date range
   * 
   * @param listingId - Listing identifier
   * @param rangeDays - Number of days of history to retrieve (7, 30, or 90)
   * @returns Array of price records ordered by timestamp (oldest to newest)
   */
  async getPriceHistory(
    listingId: string,
    rangeDays: number
  ): Promise<Array<{ timestamp: Date; price: number }>> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - rangeDays);

      const selectSQL = `
        SELECT timestamp, price
        FROM price_history
        WHERE listing_id = ?
        AND timestamp >= ?
        ORDER BY timestamp ASC
      `;

      this.db.all(
        selectSQL,
        [listingId, startDate.toISOString()],
        (err, rows: any[]) => {
          if (err) {
            console.error('Error retrieving price history:', err);
            reject(err);
            return;
          }

          const history = rows.map((row) => ({
            timestamp: new Date(row.timestamp),
            price: row.price,
          }));

          resolve(history);
        }
      );
    });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
          return;
        }

        console.log('Database connection closed');
        this.db = null;
        resolve();
      });
    });
  }

  /**
   * Get database connection status
   */
  isConnected(): boolean {
    return this.db !== null;
  }

  // ===========================
  // Price Alerts Methods
  // ===========================

  /**
   * Create a new price alert for a listing
   * 
   * **Validates: Requirements 1.2**
   * 
   * @param alert - Alert parameters (id, createdAt, triggered, triggeredAt will be auto-generated)
   * @returns Created PriceAlert with generated fields
   */
  async createPriceAlert(
    alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered' | 'triggeredAt'>
  ): Promise<PriceAlert> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const id = randomUUID();
      const createdAt = new Date().toISOString();

      const sql = `
        INSERT INTO price_alerts (
          id, listing_id, product_name, source, alert_threshold, 
          currency, current_price, created_at, triggered, triggered_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
      `;

      this.db.run(
        sql,
        [
          id,
          alert.listingId,
          alert.productName,
          alert.source,
          alert.alertThreshold,
          alert.currency,
          alert.currentPrice,
          createdAt,
        ],
        (err) => {
          if (err) {
            console.error('Error creating price alert:', err);
            reject(err);
            return;
          }

          console.log(`Created price alert ${id} for ${alert.productName}`);
          resolve({
            id,
            ...alert,
            createdAt,
            triggered: false,
            triggeredAt: null,
          });
        }
      );
    });
  }

  /**
   * Get all active (untriggered) price alerts
   * 
   * **Validates: Requirements 1.4**
   * 
   * @returns Array of active PriceAlert objects ordered by creation date (newest first)
   */
  async getActiveAlerts(): Promise<PriceAlert[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const sql = `
        SELECT * FROM price_alerts 
        WHERE triggered = 0 
        ORDER BY created_at DESC
      `;

      this.db.all(sql, [], (err, rows: any[]) => {
        if (err) {
          console.error('Error fetching active alerts:', err);
          reject(err);
          return;
        }

        const alerts: PriceAlert[] = rows.map((row) => ({
          id: row.id,
          listingId: row.listing_id,
          productName: row.product_name,
          source: row.source,
          alertThreshold: row.alert_threshold,
          currency: row.currency,
          currentPrice: row.current_price,
          createdAt: row.created_at,
          triggered: Boolean(row.triggered),
          triggeredAt: row.triggered_at,
        }));

        resolve(alerts);
      });
    });
  }

  /**
   * Get all alerts for a specific listing
   * 
   * **Validates: Requirements 1.8**
   * 
   * @param listingId - Listing identifier
   * @returns Array of PriceAlert objects for the listing ordered by creation date (newest first)
   */
  async getAlertsByListing(listingId: string): Promise<PriceAlert[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const sql = `
        SELECT * FROM price_alerts 
        WHERE listing_id = ? 
        ORDER BY created_at DESC
      `;

      this.db.all(sql, [listingId], (err, rows: any[]) => {
        if (err) {
          console.error('Error fetching alerts by listing:', err);
          reject(err);
          return;
        }

        const alerts: PriceAlert[] = rows.map((row) => ({
          id: row.id,
          listingId: row.listing_id,
          productName: row.product_name,
          source: row.source,
          alertThreshold: row.alert_threshold,
          currency: row.currency,
          currentPrice: row.current_price,
          createdAt: row.created_at,
          triggered: Boolean(row.triggered),
          triggeredAt: row.triggered_at,
        }));

        resolve(alerts);
      });
    });
  }

  /**
   * Mark a price alert as triggered
   * 
   * **Validates: Requirements 1.4**
   * 
   * @param alertId - Alert identifier
   */
  async triggerAlert(alertId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const triggeredAt = new Date().toISOString();
      const sql = `
        UPDATE price_alerts 
        SET triggered = 1, triggered_at = ? 
        WHERE id = ?
      `;

      this.db.run(sql, [triggeredAt, alertId], (err) => {
        if (err) {
          console.error('Error triggering alert:', err);
          reject(err);
          return;
        }

        console.log(`Triggered alert ${alertId} at ${triggeredAt}`);
        resolve();
      });
    });
  }

  /**
   * Delete a price alert
   * 
   * **Validates: Requirements 1.6**
   * 
   * @param alertId - Alert identifier
   */
  async deleteAlert(alertId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const sql = `DELETE FROM price_alerts WHERE id = ?`;

      this.db.run(sql, [alertId], (err) => {
        if (err) {
          console.error('Error deleting alert:', err);
          reject(err);
          return;
        }

        console.log(`Deleted alert ${alertId}`);
        resolve();
      });
    });
  }

  /**
   * Update current price for all alerts of a listing
   * Called by background job to keep alert prices in sync
   * 
   * @param listingId - Listing identifier
   * @param newPrice - New price in smallest currency unit
   */
  async updateAlertPrice(listingId: string, newPrice: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const sql = `
        UPDATE price_alerts 
        SET current_price = ? 
        WHERE listing_id = ? AND triggered = 0
      `;

      this.db.run(sql, [newPrice, listingId], (err) => {
        if (err) {
          console.error('Error updating alert price:', err);
          reject(err);
          return;
        }

        console.log(`Updated alert prices for listing ${listingId} to ${newPrice}`);
        resolve();
      });
    });
  }

  // ===========================
  // Wishlist Methods
  // ===========================

  /**
   * Add item to wishlist
   * 
   * **Validates: Requirements 2.2**
   * 
   * @param item - Wishlist item (id and addedAt will be auto-generated)
   * @returns Created wishlist item with generated fields
   */
  async addToWishlist(item: {
    listingId: string;
    productName: string;
    source: string;
    savedPrice: number;
    currentPrice: number;
    currency: string;
    category: string;
    imageUrl?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const id = randomUUID();
      const addedAt = new Date().toISOString();

      const sql = `
        INSERT INTO wishlist_items (
          id, listing_id, product_name, source, saved_price, 
          current_price, currency, added_at, category, image_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          id,
          item.listingId,
          item.productName,
          item.source,
          item.savedPrice,
          item.currentPrice,
          item.currency,
          addedAt,
          item.category,
          item.imageUrl || null,
        ],
        (err) => {
          if (err) {
            console.error('Error adding to wishlist:', err);
            reject(err);
            return;
          }

          console.log(`Added ${item.productName} to wishlist`);
          resolve({
            id,
            ...item,
            addedAt,
          });
        }
      );
    });
  }

  /**
   * Get all wishlist items
   * 
   * **Validates: Requirements 2.4**
   * 
   * @returns Array of wishlist items ordered by added date (newest first)
   */
  async getWishlist(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const sql = `
        SELECT * FROM wishlist_items 
        ORDER BY added_at DESC
      `;

      this.db.all(sql, [], (err, rows: any[]) => {
        if (err) {
          console.error('Error fetching wishlist:', err);
          reject(err);
          return;
        }

        const items = rows.map((row) => ({
          id: row.id,
          listingId: row.listing_id,
          productName: row.product_name,
          source: row.source,
          savedPrice: row.saved_price,
          currentPrice: row.current_price,
          currency: row.currency,
          addedAt: row.added_at,
          category: row.category,
          imageUrl: row.image_url,
        }));

        resolve(items);
      });
    });
  }

  /**
   * Remove item from wishlist
   * 
   * **Validates: Requirements 2.6**
   * 
   * @param itemId - Wishlist item identifier
   */
  async removeFromWishlist(itemId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const sql = `DELETE FROM wishlist_items WHERE id = ?`;

      this.db.run(sql, [itemId], (err) => {
        if (err) {
          console.error('Error removing from wishlist:', err);
          reject(err);
          return;
        }

        console.log(`Removed item ${itemId} from wishlist`);
        resolve();
      });
    });
  }

  /**
   * Check if a listing is in the wishlist
   * 
   * **Validates: Requirements 2.8**
   * 
   * @param listingId - Listing identifier
   * @returns Boolean indicating if item is in wishlist
   */
  async isInWishlist(listingId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const sql = `
        SELECT 1 FROM wishlist_items 
        WHERE listing_id = ? 
        LIMIT 1
      `;

      this.db.get(sql, [listingId], (err, row: any) => {
        if (err) {
          console.error('Error checking wishlist:', err);
          reject(err);
          return;
        }

        resolve(!!row);
      });
    });
  }

  /**
   * Update current price for a wishlist item
   * Called by background job to keep wishlist prices in sync
   * 
   * @param listingId - Listing identifier
   * @param newPrice - New price in smallest currency unit
   */
  async updateWishlistPrice(listingId: string, newPrice: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const sql = `
        UPDATE wishlist_items 
        SET current_price = ? 
        WHERE listing_id = ?
      `;

      this.db.run(sql, [newPrice, listingId], (err) => {
        if (err) {
          console.error('Error updating wishlist price:', err);
          reject(err);
          return;
        }

        console.log(`Updated wishlist price for listing ${listingId} to ${newPrice}`);
        resolve();
      });
    });
  }
}

// Export singleton instance for use across application
let persistenceServiceInstance: PersistenceService | null = null;

export const getPersistenceService = (): PersistenceService => {
  if (!persistenceServiceInstance) {
    persistenceServiceInstance = new PersistenceService();
  }
  return persistenceServiceInstance;
};
