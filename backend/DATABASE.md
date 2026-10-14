# Database Setup Documentation

## Overview

The PRO Market Dashboard uses SQLite for persistent storage of price history data during development. This document describes the database setup, schema, and usage.

## Installation

The required dependencies are listed in `package.json`:

```json
{
  "dependencies": {
    "sqlite3": "^5.1.7"
  },
  "devDependencies": {
    "@types/sqlite3": "^3.1.11"
  }
}
```

Install dependencies:

```bash
npm install
```

## Database Schema

### price_history Table

Stores historical price snapshots for product listings.

```sql
CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  UNIQUE(listing_id, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_listing_timestamp 
ON price_history(listing_id, timestamp);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `listing_id`: Listing identifier in format "{source}_{productId}" (e.g., "amazon_prod123")
- `price`: Price in smallest currency unit (e.g., cents/paise) stored as INTEGER
- `timestamp`: ISO 8601 timestamp when price was recorded

**Constraints:**
- UNIQUE constraint on (listing_id, timestamp) prevents duplicate records
- Index on (listing_id, timestamp) optimizes range queries

## Database Initialization

### Automatic Initialization

The database is automatically initialized when the PersistenceService is first used:

```typescript
import { getPersistenceService } from './services/PersistenceService';

const persistenceService = getPersistenceService();
await persistenceService.initialize();
```

### Manual Initialization

You can manually initialize the database using the npm script:

```bash
npm run db:init
```

This runs the `src/db/init.ts` script which creates the database, tables, and indexes.

## Database Location

**Development:** `backend/data/pro_market.db`

The `data/` directory is created automatically and is excluded from git (see `.gitignore`).

## PersistenceService API

### Connection Management

```typescript
// Get singleton instance
const service = getPersistenceService();

// Initialize connection and schema
await service.initialize();

// Check connection status
const isConnected = service.isConnected();

// Close connection
await service.close();
```

### Storing Price Snapshots

```typescript
await service.storePriceSnapshot(
  listingId: string,    // e.g., "amazon_prod123"
  price: number,        // e.g., 24999 (for $249.99)
  timestamp: Date       // e.g., new Date()
);
```

**Deduplication Logic:**
- If a record exists within ±1 hour of the timestamp, it updates the existing record
- Otherwise, it creates a new record
- This prevents duplicate entries from frequent polling

### Retrieving Price History

```typescript
const history = await service.getPriceHistory(
  listingId: string,    // e.g., "amazon_prod123"
  rangeDays: number     // 7, 30, or 90
);

// Returns: Array<{ timestamp: Date, price: number }>
// Ordered by timestamp ascending (oldest to newest)
```

## Testing

Unit tests for PersistenceService are located in:
`src/services/PersistenceService.test.ts`

Run tests:

```bash
npm test
```

The tests use a separate test database (`data/test_pro_market.db`) which is automatically created and cleaned up.

## Data Persistence

### Requirement 10.3

This implementation satisfies Requirement 10.3:

> "THE Aggregator SHALL store PriceHistory records in a persistent data store so that historical data is not lost when the server restarts."

**How it's satisfied:**
- SQLite provides file-based persistent storage
- Data survives server restarts
- Schema is created automatically on first run
- Deduplication prevents data bloat from frequent polling

### Integration with Aggregator

When the AggregatorService fetches fresh data, it should store price snapshots:

```typescript
// After fetching listings
for (const listing of listings) {
  await persistenceService.storePriceSnapshot(
    listing.id,
    listing.price,
    new Date(listing.fetchedAt)
  );
}
```

## Production Considerations

For production deployment, consider:

1. **Migration to PostgreSQL**: SQLite is suitable for development but PostgreSQL is recommended for production
2. **Connection Pooling**: Implement connection pooling for concurrent requests
3. **Backup Strategy**: Regular database backups
4. **Monitoring**: Track database size and query performance
5. **Data Retention**: Implement data retention policies (e.g., keep 1 year of history)

## Troubleshooting

### Database locked error

If you encounter "database is locked" errors:
- Ensure only one process is accessing the database
- Check for lingering connections (call `close()` properly)
- Consider increasing the busy timeout

### Schema migration

If schema changes are needed:
- Delete the existing database: `rm data/pro_market.db`
- Re-run initialization: `npm run db:init`
- For production, use proper migration tools (e.g., knex migrations)

### Test database conflicts

If tests fail due to database conflicts:
- Ensure `afterEach` cleanup is running
- Check that test database path is unique
- Manually delete test database: `rm data/test_pro_market.db`

## References

- SQLite documentation: https://www.sqlite.org/docs.html
- node-sqlite3 documentation: https://github.com/TryGhost/node-sqlite3
- Requirements: See `requirements.md` section 10.3
- Design: See `design.md` PersistenceService interface
