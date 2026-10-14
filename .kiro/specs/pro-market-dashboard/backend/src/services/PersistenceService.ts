import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { PriceHistoryRecord, Listing } from '../models/types';

/**
 * PersistenceService handles database operations for price history storage
 * 
 * Requirements:
 * - 5.5: Store price history records with timestamps
 * - 10.3: Persist data across server restarts
 * - 10.4: Deduplicate records within 1-hour window
 */
export class PersistenceService {
  private db: sqlite3.Database;
  private dbRun: (sql: string, params?: any[]) => Promise<void>;
  private dbGet: (sql: string, params?: any[]) => Promise<any>;
  private dbAll: (sql: string, params?: any[]) => Promise<any[]>;

  constructor(dbPath: string = './data/price_history.db') {
    // Initialize SQLite database
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        throw err;
      }
      console.log('Connected to SQLite database at', dbPath);
    });

    // Promisify database methods
    this.dbRun = promisify(this.db.run.bind(this.db));
    this.dbGet = promisify(this.db.get.bind(this.db));
    this.dbAll = promisify(this.db.all.bind(this.db));

    // Initialize database schema
    this.initializeSchema();
  }

  /**
   * Initialize database schema
   * Creates price_history table with unique constraint on (listing_id, timestamp)
   */
  private async initializeSchema(): Promise<void> {
    try {
      // Create price_history table
      await this.dbRun(`
        CREATE TABLE IF NOT EXISTS price_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          listing_id TEXT NOT NULL,
          price INTEGER NOT NULL,
          timestamp INTEGER NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )
      `);

      // Create index for efficient queries by listing_id and timestamp
      await this.dbRun(`
        CREATE INDEX IF NOT EXISTS idx_listing_timestamp 
        ON price_history(listing_id, timestamp)
      `);

      // Create index for deduplication queries
      await this.dbRun(`
        CREATE INDEX IF NOT EXISTS idx_listing_id 
        ON price_history(listing_id)
      `);

      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Error initializing database schema:', error);
      throw error;
    }
  }

  /**
   * Store a price snapshot for a listing
   * Implements 1-hour deduplication: if a record exists within 1 hour, update it instead of inserting
   * 
   * @param listingId - Unique identifier for the listing
   * @param price - Price in smallest currency unit
   * @param timestamp - When the price was recorded
   * 
   * Requirements: 5.5, 10.4
   */
  async storePriceSnapshot(
    listingId: string,
    price: number,
    timestamp: Date
  ): Promise<void> {
    try {
      const timestampUnix = Math.floor(timestamp.getTime() / 1000);
      const oneHourBefore = timestampUnix - 3600; // 1 hour = 3600 seconds
      const oneHourAfter = timestampUnix + 3600;

      // Check if a record exists within 1-hour window
      const existingRecord = await this.dbGet(
        `SELECT id, timestamp FROM price_history 
         WHERE listing_id = ? 
         AND timestamp BETWEEN ? AND ?
         ORDER BY ABS(timestamp - ?) ASC
         LIMIT 1`,
        [listingId, oneHourBefore, oneHourAfter, timestampUnix]
      );

      if (existingRecord) {
        // Update existing record
        await this.dbRun(
          `UPDATE price_history 
           SET price = ?, timestamp = ? 
           WHERE id = ?`,
          [price, timestampUnix, existingRecord.id]
        );
        console.log(
          `Updated existing price record for ${listingId} at ${timestamp.toISOString()}`
        );
      } else {
        // Insert new record
        await this.dbRun(
          `INSERT INTO price_history (listing_id, price, timestamp) 
           VALUES (?, ?, ?)`,
          [listingId, price, timestampUnix]
        );
        console.log(
          `Stored new price snapshot for ${listingId}: ${price} at ${timestamp.toISOString()}`
        );
      }
    } catch (error) {
      console.error(
        `Error storing price snapshot for ${listingId}:`,
        error
      );
      throw new Error(`Failed to store price snapshot: ${error}`);
    }
  }

  /**
   * Retrieve price history for a listing within a date range
   * Returns records ordered from oldest to newest
   * 
   * @param listingId - Unique identifier for the listing
   * @param rangeDays - Number of days to look back (default 30)
   * @returns Array of price history records ordered by timestamp ascending
   * 
   * Requirements: 5.1, 5.2
   */
  async getPriceHistory(
    listingId: string,
    rangeDays: number = 30
  ): Promise<PriceHistoryRecord[]> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - rangeDays * 24 * 60 * 60;

      const records = await this.dbAll(
        `SELECT price, timestamp 
         FROM price_history 
         WHERE listing_id = ? 
         AND timestamp >= ?
         ORDER BY timestamp ASC`,
        [listingId, startTime]
      );

      // Convert Unix timestamps to Date objects
      const history: PriceHistoryRecord[] = records.map((record) => ({
        timestamp: new Date(record.timestamp * 1000),
        price: record.price,
      }));

      console.log(
        `Retrieved ${history.length} price history records for ${listingId} (${rangeDays} days)`
      );

      return history;
    } catch (error) {
      console.error(
        `Error retrieving price history for ${listingId}:`,
        error
      );
      throw new Error(`Failed to retrieve price history: ${error}`);
    }
  }

  /**
   * Get listing metadata (optional method for future use)
   * Currently returns null as metadata is not stored
   * 
   * @param listingId - Unique identifier for the listing
   * @returns Listing object or null
   */
  async getListingMetadata(listingId: string): Promise<Listing | null> {
    // Not implemented in current schema
    // This would require a separate listings table to store full metadata
    return null;
  }

  /**
   * Close database connection
   * Should be called when shutting down the application
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }

  /**
   * Clear all price history records (for testing purposes)
   */
  async clearAll(): Promise<void> {
    try {
      await this.dbRun('DELETE FROM price_history');
      console.log('Cleared all price history records');
    } catch (error) {
      console.error('Error clearing price history:', error);
      throw error;
    }
  }

  /**
   * Get total count of price history records for a listing
   * Useful for debugging and monitoring
   */
  async getRecordCount(listingId?: string): Promise<number> {
    try {
      let query = 'SELECT COUNT(*) as count FROM price_history';
      const params: any[] = [];

      if (listingId) {
        query += ' WHERE listing_id = ?';
        params.push(listingId);
      }

      const result = await this.dbGet(query, params);
      return result.count;
    } catch (error) {
      console.error('Error getting record count:', error);
      throw error;
    }
  }
}
