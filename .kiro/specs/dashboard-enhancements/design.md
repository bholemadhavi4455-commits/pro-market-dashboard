# Design Document: Dashboard Enhancements

## Introduction

This document defines the technical design for the Dashboard Enhancements feature, which extends the existing PRO Market Dashboard with four key capabilities:

1. **Price Drop Alerts**: User-configured notification system for price monitoring
2. **Wishlist Functionality**: Persistent storage and tracking of favorite products
3. **Mobile Optimization**: Responsive layouts for mobile, tablet, and desktop viewports
4. **Product Comparison View**: Side-by-side comparison interface for informed decision-making

The design follows a layered architecture with clear separation between data models, business logic, API layer, and UI components. All new functionality integrates with the existing PersistenceService and follows established patterns in the codebase.

---

## Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React)                    │
│  ┌──────────────┬──────────────┬──────────────┬──────────┐ │
│  │ PriceCard    │ Wishlist     │ Comparison   │ Alerts   │ │
│  │ Component    │ View         │ View         │ Panel    │ │
│  └──────────────┴──────────────┴──────────────┴──────────┘ │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Responsive Layout Manager                    │  │
│  │     (Mobile/Tablet/Desktop view switching)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                    REST API (HTTP/JSON)
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer (Node.js)                  │
│  ┌──────────────┬──────────────┬──────────────────────────┐│
│  │ Alerts API   │ Wishlist API │ Notification Scheduler   ││
│  └──────────────┴──────────────┴──────────────────────────┘│
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PersistenceService (SQLite)              │  │
│  │  - price_history table (existing)                     │  │
│  │  - price_alerts table (new)                           │  │
│  │  - wishlist_items table (new)                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Extend, Don't Replace**: All enhancements build upon existing components and services
2. **Mobile-First Responsive**: CSS Grid and Flexbox with breakpoint-based layouts
3. **Persistent State**: All user data (alerts, wishlist) stored in SQLite via PersistenceService
4. **Stateless API**: RESTful endpoints with no server-side session state
5. **Progressive Enhancement**: Core functionality works without JavaScript for comparison view

---

## Data Models

### Backend Models

**File**: `backend/src/models/index.ts` (additions)

```typescript
/**
 * PriceAlert represents a user-configured notification for price drops.
 * 
 * @interface PriceAlert
 * @property {string} id - Unique alert identifier. Format: UUID v4.
 * @property {string} listingId - Associated listing identifier. Format: "{source}_{productId}".
 * @property {string} productName - Product name for display. Max 200 characters.
 * @property {string} source - Source identifier (e.g., "Amazon", "Flipkart").
 * @property {number} alertThreshold - Trigger price in smallest currency unit. Must be positive integer.
 * @property {string} currency - ISO 4217 currency code. Must be 3 uppercase letters.
 * @property {number} currentPrice - Latest known price in smallest currency unit. Must be positive integer.
 * @property {string} createdAt - ISO 8601 timestamp when alert was created.
 * @property {boolean} triggered - Whether alert has been triggered. Default: false.
 * @property {string | null} triggeredAt - ISO 8601 timestamp when alert triggered. Null if not triggered.
 */
export interface PriceAlert {
  id: string;
  listingId: string;
  productName: string;
  source: string;
  alertThreshold: number;
  currency: string;
  currentPrice: number;
  createdAt: string;
  triggered: boolean;
  triggeredAt: string | null;
}

/**
 * WishlistItem represents a saved product in the user's wishlist.
 * 
 * @interface WishlistItem
 * @property {string} id - Unique wishlist item identifier. Format: UUID v4.
 * @property {string} listingId - Associated listing identifier. Format: "{source}_{productId}".
 * @property {string} productName - Product name for display. Max 200 characters.
 * @property {string} source - Source identifier (e.g., "Amazon", "Flipkart").
 * @property {number} savedPrice - Price at time of addition in smallest currency unit. Must be positive integer.
 * @property {number} currentPrice - Latest known price in smallest currency unit. Must be positive integer.
 * @property {string} currency - ISO 4217 currency code. Must be 3 uppercase letters.
 * @property {string} addedAt - ISO 8601 timestamp when item was added to wishlist.
 * @property {string} category - Product category for filtering.
 * @property {string} [imageUrl] - Optional product thumbnail URL.
 */
export interface WishlistItem {
  id: string;
  listingId: string;
  productName: string;
  source: string;
  savedPrice: number;
  currentPrice: number;
  currency: string;
  addedAt: string;
  category: string;
  imageUrl?: string;
}

/**
 * ComparisonSelection represents the current set of listings selected for comparison.
 * Managed in frontend state, not persisted to backend.
 * 
 * @interface ComparisonSelection
 * @property {string[]} listingIds - Array of selected listing IDs. Length: 0-4.
 * @property {Listing[]} listings - Full listing objects for selected items.
 */
export interface ComparisonSelection {
  listingIds: string[];
  listings: Listing[];
}

/**
 * NotificationTrigger represents a notification event when a price alert fires.
 * 
 * @interface NotificationTrigger
 * @property {string} alertId - ID of the triggered alert.
 * @property {string} productName - Product name for notification display.
 * @property {string} source - Source identifier.
 * @property {number} oldPrice - Previous price in smallest currency unit.
 * @property {number} newPrice - New (trigger) price in smallest currency unit.
 * @property {string} currency - ISO 4217 currency code.
 * @property {string} triggeredAt - ISO 8601 timestamp of trigger event.
 */
export interface NotificationTrigger {
  alertId: string;
  productName: string;
  source: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  triggeredAt: string;
}
```

---

## Database Schema Extensions

**File**: `backend/src/db/init.ts` (additions to existing schema)

### price_alerts Table

```sql
CREATE TABLE IF NOT EXISTS price_alerts (
  id VARCHAR(36) PRIMARY KEY,           -- UUID v4
  listing_id VARCHAR(255) NOT NULL,       -- Format: "{source}_{productId}"
  product_name VARCHAR(200) NOT NULL,
  source VARCHAR(50) NOT NULL,
  alert_threshold INTEGER NOT NULL,       -- Price in smallest currency unit
  currency CHAR(3) NOT NULL,              -- ISO 4217 code
  current_price INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL,
  triggered BOOLEAN DEFAULT 0,            -- 0 = false, 1 = true
  triggered_at TIMESTAMP NULL,
  
  CHECK (alert_threshold > 0),
  CHECK (current_price > 0)
);

CREATE INDEX idx_alerts_listing ON price_alerts(listing_id);
CREATE INDEX idx_alerts_triggered ON price_alerts(triggered, created_at);
```

**Design Notes**:
- `id`: UUID v4 for globally unique identifiers
- `alert_threshold` and `current_price`: Stored as integers (cents/paise) for precision
- `triggered`: Boolean flag to track alert state
- Indexes optimize queries for fetching alerts by listing and checking untriggered alerts

### wishlist_items Table

```sql
CREATE TABLE IF NOT EXISTS wishlist_items (
  id VARCHAR(36) PRIMARY KEY,           -- UUID v4
  listing_id VARCHAR(255) NOT NULL,       -- Format: "{source}_{productId}"
  product_name VARCHAR(200) NOT NULL,
  source VARCHAR(50) NOT NULL,
  saved_price INTEGER NOT NULL,           -- Price when added
  current_price INTEGER NOT NULL,         -- Latest price
  currency CHAR(3) NOT NULL,
  added_at TIMESTAMP NOT NULL,
  category VARCHAR(50) NOT NULL,
  image_url TEXT NULL,
  
  UNIQUE(listing_id),                     -- One entry per listing
  CHECK (saved_price > 0),
  CHECK (current_price > 0)
);

CREATE INDEX idx_wishlist_added ON wishlist_items(added_at DESC);
CREATE INDEX idx_wishlist_category ON wishlist_items(category);
```

**Design Notes**:
- `UNIQUE(listing_id)`: Prevents duplicate wishlist entries for same product
- `saved_price`: Preserved for price change calculation
- `current_price`: Updated periodically by background job
- Maximum 50 items enforced at application layer (not database constraint for flexibility)

---

## Backend Components

### 1. PersistenceService Extensions

**File**: `backend/src/services/PersistenceService.ts` (additions to existing class)

```typescript
// Price Alerts Methods

async createPriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered' | 'triggeredAt'>): Promise<PriceAlert> {
  const id = generateUUID();
  const createdAt = new Date().toISOString();
  
  const sql = `
    INSERT INTO price_alerts (id, listing_id, product_name, source, alert_threshold, 
                              currency, current_price, created_at, triggered, triggered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
  `;
  
  await this.db.run(sql, [id, alert.listingId, alert.productName, alert.source,
                           alert.alertThreshold, alert.currency, alert.currentPrice, createdAt]);
  
  return { id, ...alert, createdAt, triggered: false, triggeredAt: null };
}

async getActiveAlerts(): Promise<PriceAlert[]> {
  const sql = `SELECT * FROM price_alerts WHERE triggered = 0 ORDER BY created_at DESC`;
  return await this.db.all(sql);
}

async getAlertsByListing(listingId: string): Promise<PriceAlert[]> {
  const sql = `SELECT * FROM price_alerts WHERE listing_id = ? ORDER BY created_at DESC`;
  return await this.db.all(sql, [listingId]);
}

async triggerAlert(alertId: string): Promise<void> {
  const triggeredAt = new Date().toISOString();
  const sql = `UPDATE price_alerts SET triggered = 1, triggered_at = ? WHERE id = ?`;
  await this.db.run(sql, [triggeredAt, alertId]);
}

async deleteAlert(alertId: string): Promise<void> {
  const sql = `DELETE FROM price_alerts WHERE id = ?`;
  await this.db.run(sql, [alertId]);
}

async updateAlertPrice(listingId: string, newPrice: number): Promise<void> {
  const sql = `UPDATE price_alerts SET current_price = ? WHERE listing_id = ? AND triggered = 0`;
  await this.db.run(sql, [newPrice, listingId]);
}

// Wishlist Methods

async addToWishlist(item: Omit<WishlistItem, 'id' | 'addedAt'>): Promise<WishlistItem> {
  // Check count limit
  const countSql = `SELECT COUNT(*) as count FROM wishlist_items`;
  const { count } = await this.db.get(countSql);
  
  if (count >= 50) {
    throw new Error('Wishlist is full. Maximum 50 items allowed.');
  }
  
  const id = generateUUID();
  const addedAt = new Date().toISOString();
  
  const sql = `
    INSERT INTO wishlist_items (id, listing_id, product_name, source, saved_price,
                                 current_price, currency, added_at, category, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  await this.db.run(sql, [id, item.listingId, item.productName, item.source, item.savedPrice,
                           item.currentPrice, item.currency, addedAt, item.category, item.imageUrl || null]);
  
  return { id, ...item, addedAt };
}

async getWishlist(): Promise<WishlistItem[]> {
  const sql = `SELECT * FROM wishlist_items ORDER BY added_at DESC`;
  return await this.db.all(sql);
}

async removeFromWishlist(itemId: string): Promise<void> {
  const sql = `DELETE FROM wishlist_items WHERE id = ?`;
  await this.db.run(sql, [itemId]);
}

async isInWishlist(listingId: string): Promise<boolean> {
  const sql = `SELECT COUNT(*) as count FROM wishlist_items WHERE listing_id = ?`;
  const { count } = await this.db.get(sql, [listingId]);
  return count > 0;
}

async updateWishlistPrice(listingId: string, newPrice: number): Promise<void> {
  const sql = `UPDATE wishlist_items SET current_price = ? WHERE listing_id = ?`;
  await this.db.run(sql, [newPrice, listingId]);
}
```

**Design Notes**:
- UUID generation using `crypto.randomUUID()` or `uuid` package
- Alert validation (threshold < current price) happens at API layer before persistence
- Wishlist limit of 50 enforced in `addToWishlist` method
- Price updates occur via background job that fetches latest prices and calls `updateAlertPrice`/`updateWishlistPrice`

### 2. NotificationService

**File**: `backend/src/services/NotificationService.ts` (new)

```typescript
import { PersistenceService } from './PersistenceService';
import { NotificationTrigger } from '../models';

export class NotificationService {
  private persistenceService: PersistenceService;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(persistenceService: PersistenceService) {
    this.persistenceService = persistenceService;
  }

  /**
   * Start the notification checker scheduler.
   * Runs every 60 minutes to check alerts against current prices.
   */
  start(): void {
    if (this.checkInterval) {
      console.log('NotificationService already running');
      return;
    }

    console.log('Starting NotificationService scheduler (60 minute interval)');
    
    // Run immediately on start
    this.checkAlerts();
    
    // Schedule every 60 minutes
    this.checkInterval = setInterval(() => {
      this.checkAlerts();
    }, 60 * 60 * 1000);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('NotificationService stopped');
    }
  }

  /**
   * Check all active alerts and trigger notifications for price drops.
   */
  async checkAlerts(): Promise<NotificationTrigger[]> {
    console.log('Checking price alerts...');
    
    const activeAlerts = await this.persistenceService.getActiveAlerts();
    const triggered: NotificationTrigger[] = [];

    for (const alert of activeAlerts) {
      if (alert.currentPrice <= alert.alertThreshold) {
        console.log(`Alert triggered for ${alert.productName}: ${alert.currentPrice} <= ${alert.alertThreshold}`);
        
        // Mark alert as triggered
        await this.persistenceService.triggerAlert(alert.id);
        
        // Create notification trigger
        const notification: NotificationTrigger = {
          alertId: alert.id,
          productName: alert.productName,
          source: alert.source,
          oldPrice: alert.alertThreshold,
          newPrice: alert.currentPrice,
          currency: alert.currency,
          triggeredAt: new Date().toISOString(),
        };
        
        triggered.push(notification);
        
        // In a real system, this would send email/SMS/push notification
        // For MVP, we log and return the triggers for UI display
        this.sendNotification(notification);
      }
    }

    console.log(`Checked ${activeAlerts.length} alerts, triggered ${triggered.length}`);
    return triggered;
  }

  /**
   * Send notification to user (placeholder implementation).
   * In production, integrate with email service, SMS gateway, or push notification service.
   */
  private sendNotification(trigger: NotificationTrigger): void {
    console.log(`[NOTIFICATION] Price Alert: ${trigger.productName} from ${trigger.source}`);
    console.log(`  Price dropped to ${trigger.newPrice} (threshold: ${trigger.oldPrice})`);
    // TODO: Integrate with notification service (SendGrid, Twilio, Firebase Cloud Messaging)
  }
}
```

**Design Notes**:
- Scheduler runs every 60 minutes as specified in requirements
- `checkAlerts()` method can also be called manually for testing or immediate checks
- Notification delivery is abstracted to allow future integration with external services
- Triggered alerts remain in database for historical tracking

---

## API Endpoints

**File**: `backend/src/routes/index.ts` (additions)

### Price Alerts Endpoints

```typescript
// GET /api/alerts - Get all active price alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await persistenceService.getActiveAlerts();
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST /api/alerts - Create a new price alert
// Body: { listingId, productName, source, alertThreshold, currency, currentPrice }
router.post('/alerts', async (req, res) => {
  try {
    const { listingId, productName, source, alertThreshold, currency, currentPrice } = req.body;
    
    // Validate threshold < current price
    if (alertThreshold >= currentPrice) {
      return res.status(400).json({ 
        error: 'Alert threshold must be lower than current price',
        code: 'INVALID_THRESHOLD'
      });
    }
    
    const alert = await persistenceService.createPriceAlert({
      listingId, productName, source, alertThreshold, currency, currentPrice
    });
    
    res.status(201).json({ alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// DELETE /api/alerts/:id - Delete a price alert
router.delete('/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await persistenceService.deleteAlert(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// GET /api/alerts/listing/:listingId - Get alerts for specific listing
router.get('/alerts/listing/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const alerts = await persistenceService.getAlertsByListing(listingId);
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts for listing' });
  }
});
```

### Wishlist Endpoints

```typescript
// GET /api/wishlist - Get all wishlist items
router.get('/wishlist', async (req, res) => {
  try {
    const items = await persistenceService.getWishlist();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// POST /api/wishlist - Add item to wishlist
// Body: { listingId, productName, source, savedPrice, currentPrice, currency, category, imageUrl? }
router.post('/wishlist', async (req, res) => {
  try {
    const { listingId, productName, source, savedPrice, currentPrice, currency, category, imageUrl } = req.body;
    
    const item = await persistenceService.addToWishlist({
      listingId, productName, source, savedPrice, currentPrice, currency, category, imageUrl
    });
    
    res.status(201).json({ item });
  } catch (error) {
    if (error.message === 'Wishlist is full. Maximum 50 items allowed.') {
      return res.status(400).json({ error: error.message, code: 'WISHLIST_FULL' });
    }
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /api/wishlist/:id - Remove item from wishlist
router.delete('/wishlist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await persistenceService.removeFromWishlist(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// GET /api/wishlist/check/:listingId - Check if listing is in wishlist
router.get('/wishlist/check/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const inWishlist = await persistenceService.isInWishlist(listingId);
    res.json({ inWishlist });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check wishlist status' });
  }
});
```

**Design Notes**:
- RESTful endpoint design with standard HTTP methods (GET, POST, DELETE)
- Validation happens at API layer before calling persistence methods
- Error responses include `code` field for programmatic handling by frontend
- 201 Created status for successful resource creation
- 204 No Content for successful deletion

---

## Frontend Components

### 1. PriceCard Enhancements

**File**: `frontend/src/components/PriceCard.tsx` (modifications to existing component)

```typescript
interface PriceCardProps {
  listing: Listing;
  onSetAlert: (listing: Listing) => void;
  onAddToWishlist: (listing: Listing) => void;
  onCompareToggle: (listingId: string, selected: boolean) => void;
  hasAlert: boolean;
  inWishlist: boolean;
  isCompareSelected: boolean;
}

export const PriceCard: React.FC<PriceCardProps> = ({
  listing,
  onSetAlert,
  onAddToWishlist,
  onCompareToggle,
  hasAlert,
  inWishlist,
  isCompareSelected
}) => {
  return (
    <div className="price-card">
      {/* Existing price card content */}
      
      <div className="card-actions">
        {/* Alert indicator and button */}
        <button 
          onClick={() => onSetAlert(listing)}
          className={hasAlert ? 'btn-alert active' : 'btn-alert'}
          title={hasAlert ? 'Alert is active' : 'Set price alert'}
        >
          {hasAlert ? '🔔 Alert Active' : '🔔 Set Alert'}
        </button>
        
        {/* Wishlist indicator and button */}
        <button
          onClick={() => onAddToWishlist(listing)}
          className={inWishlist ? 'btn-wishlist active' : 'btn-wishlist'}
          title={inWishlist ? 'In wishlist' : 'Add to wishlist'}
        >
          {inWishlist ? '⭐ In Wishlist' : '⭐ Add to Wishlist'}
        </button>
        
        {/* Compare checkbox */}
        <label className="compare-checkbox">
          <input
            type="checkbox"
            checked={isCompareSelected}
            onChange={(e) => onCompareToggle(listing.id, e.target.checked)}
          />
          Compare
        </label>
      </div>
    </div>
  );
};
```

**Design Notes**:
- Visual indicators for alert and wishlist status via CSS class `active`
- Compare checkbox integrated into existing card layout
- Parent component manages state for alerts, wishlist, and comparison selection

### 2. AlertsPanel Component

**File**: `frontend/src/components/AlertsPanel.tsx` (new)

```typescript
import { PriceAlert } from '../types';
import { formatINR } from '../utils';

interface AlertsPanelProps {
  alerts: PriceAlert[];
  onDelete: (alertId: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onDelete }) => {
  if (alerts.length === 0) {
    return (
      <div className="alerts-panel empty">
        <p>No active price alerts. Set an alert on any product card.</p>
      </div>
    );
  }

  return (
    <div className="alerts-panel">
      <h3>Active Price Alerts ({alerts.length})</h3>
      <ul className="alerts-list">
        {alerts.map(alert => (
          <li key={alert.id} className="alert-item">
            <div className="alert-info">
              <h4>{alert.productName}</h4>
              <p className="source">Source: {alert.source}</p>
              <p className="prices">
                <span className="current">Current: {formatINR(alert.currentPrice)}</span>
                <span className="threshold">Alert at: {formatINR(alert.alertThreshold)}</span>
              </p>
            </div>
            <button 
              onClick={() => onDelete(alert.id)}
              className="btn-delete"
              aria-label="Delete alert"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

**Design Notes**:
- Displays all required fields: product name, source, alert threshold, current price
- Delete button with clear visual affordance
- Empty state guidance for new users

### 3. WishlistView Component

**File**: `frontend/src/components/WishlistView.tsx` (new)

```typescript
import { WishlistItem } from '../types';
import { formatINR } from '../utils';

interface WishlistViewProps {
  items: WishlistItem[];
  onRemove: (itemId: string) => void;
  onItemClick: (item: WishlistItem) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({ items, onRemove, onItemClick }) => {
  const calculatePriceChange = (saved: number, current: number): { percent: number; direction: 'up' | 'down' | 'same' } => {
    if (saved === current) return { percent: 0, direction: 'same' };
    const percent = ((current - saved) / saved) * 100;
    return { percent: Math.abs(percent), direction: current > saved ? 'up' : 'down' };
  };

  if (items.length === 0) {
    return (
      <div className="wishlist-view empty">
        <h2>Your Wishlist</h2>
        <p>No items in your wishlist. Add products from search results to track them.</p>
      </div>
    );
  }

  return (
    <div className="wishlist-view">
      <h2>Your Wishlist ({items.length}/50)</h2>
      <div className="wishlist-grid">
        {items.map(item => {
          const priceChange = calculatePriceChange(item.savedPrice, item.currentPrice);
          
          return (
            <div 
              key={item.id} 
              className="wishlist-item"
              onClick={() => onItemClick(item)}
              style={{ cursor: 'pointer' }}
            >
              {item.imageUrl && <img src={item.imageUrl} alt={item.productName} />}
              <h3>{item.productName}</h3>
              <p className="source">{item.source}</p>
              
              <div className="price-info">
                <p className="saved-price">Saved at: {formatINR(item.savedPrice)}</p>
                <p className="current-price">Current: {formatINR(item.currentPrice)}</p>
                
                {priceChange.direction !== 'same' && (
                  <p className={`price-change ${priceChange.direction}`}>
                    {priceChange.direction === 'up' ? '↑' : '↓'} {priceChange.percent.toFixed(1)}%
                  </p>
                )}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className="btn-remove"
                aria-label="Remove from wishlist"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

**Design Notes**:
- Displays all required fields: product name, source, saved price, current price, price change
- Price change percentage calculated with direction indicator (↑↓)
- Item click navigates to search results (handled by parent)
- Remove button stops propagation to prevent navigation on delete

### 4. ComparisonView Component

**File**: `frontend/src/components/ComparisonView.tsx` (new)

```typescript
import { Listing, PriceHistory } from '../types';
import { formatINR } from '../utils';

interface ComparisonViewProps {
  listings: Listing[];
  priceHistories: Map<string, PriceHistory>;
  onRemove: (listingId: string) => void;
  onBackToResults: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  listings,
  priceHistories,
  onRemove,
  onBackToResults
}) => {
  if (listings.length < 2) {
    return (
      <div className="comparison-view insufficient">
        <p>Select at least 2 products to compare.</p>
        <button onClick={onBackToResults} className="btn-back">
          Back to Results
        </button>
      </div>
    );
  }

  // Determine best values for highlighting
  const lowestPrice = Math.min(...listings.map(l => l.price));
  const highestRating = Math.max(...listings.map(l => l.rating));
  const mostReviews = Math.max(...listings.map(l => l.reviewCount));

  return (
    <div className="comparison-view">
      <h2>Product Comparison</h2>
      
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Attribute</th>
            {listings.map(listing => (
              <th key={listing.id}>
                <button 
                  onClick={() => onRemove(listing.id)}
                  className="btn-remove-comparison"
                  aria-label="Remove from comparison"
                >
                  ✕
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="attribute-label">Product Name</td>
            {listings.map(listing => (
              <td key={listing.id}>{listing.productName}</td>
            ))}
          </tr>
          
          <tr>
            <td className="attribute-label">Source</td>
            {listings.map(listing => (
              <td key={listing.id}>{listing.source}</td>
            ))}
          </tr>
          
          <tr>
            <td className="attribute-label">Price</td>
            {listings.map(listing => (
              <td 
                key={listing.id}
                className={listing.price === lowestPrice ? 'best-value' : ''}
              >
                {formatINR(listing.price)}
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="attribute-label">Rating</td>
            {listings.map(listing => (
              <td 
                key={listing.id}
                className={listing.rating === highestRating ? 'best-value' : ''}
              >
                ⭐ {listing.rating}
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="attribute-label">Review Count</td>
            {listings.map(listing => (
              <td 
                key={listing.id}
                className={listing.reviewCount === mostReviews ? 'best-value' : ''}
              >
                {listing.reviewCount}
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="attribute-label">Category</td>
            {listings.map(listing => (
              <td key={listing.id}>{listing.category}</td>
            ))}
          </tr>
        </tbody>
      </table>
      
      {/* Price History Charts */}
      <div className="price-history-comparison">
        <h3>Price Trends</h3>
        <div className="charts-grid">
          {listings.map(listing => (
            <div key={listing.id} className="chart-column">
              <h4>{listing.productName}</h4>
              <ChartBox 
                data={priceHistories.get(listing.id) || []}
                currency={listing.currency}
              />
            </div>
          ))}
        </div>
      </div>
      
      <button onClick={onBackToResults} className="btn-back">
        Back to Results
      </button>
    </div>
  );
};
```

**Design Notes**:
- Comparison table with aligned rows for all required attributes
- Best value highlighting via `best-value` CSS class (green background/bold text)
- Price history charts in aligned columns for visual comparison
- Remove buttons in table header for each listing
- Prompts user when fewer than 2 items with "Back to Results" button

### 5. Responsive Layout Manager

**File**: `frontend/src/App.css` (additions for responsive design)

```css
/* Responsive Grid Layouts */

/* Mobile View: < 768px */
@media (max-width: 767px) {
  .results-grid {
    display: grid;
    grid-template-columns: 1fr; /* Single column */
    gap: 1rem;
  }
  
  .search-input,
  .search-button {
    min-height: 44px; /* Touch target size */
    min-width: 44px;
  }
  
  .navbar {
    display: none; /* Hidden by default */
  }
  
  .hamburger-menu {
    display: block;
    min-height: 44px;
    min-width: 44px;
  }
  
  .navbar.open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 60px;
    left: 0;
    width: 100%;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 100;
  }
  
  .price-card button,
  .price-card input[type="checkbox"] {
    min-height: 44px;
    min-width: 44px;
    padding: 8px;
  }
  
  .chart-box {
    height: 200px; /* Simplified chart size */
  }
  
  body {
    font-size: 14px; /* Scaled typography */
  }
  
  h1 {
    font-size: 1.5rem;
  }
  
  h2 {
    font-size: 1.25rem;
  }
}

/* Tablet View: 768px - 1023px */
@media (min-width: 768px) and (max-width: 1023px) {
  .results-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* Two columns */
    gap: 1.5rem;
  }
  
  .navbar {
    display: flex; /* Standard horizontal nav */
  }
  
  .hamburger-menu {
    display: none;
  }
  
  body {
    font-size: 15px;
  }
}

/* Desktop View: >= 1024px */
@media (min-width: 1024px) {
  .results-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* Three columns */
    gap: 2rem;
  }
  
  .navbar {
    display: flex;
  }
  
  .hamburger-menu {
    display: none;
  }
  
  body {
    font-size: 16px;
  }
}

/* Touch Target Accessibility */
button, a, input[type="checkbox"], input[type="radio"] {
  min-height: 44px;
  min-width: 44px;
}

/* Prevent Horizontal Scrolling */
body {
  overflow-x: hidden;
}

.results-grid,
.comparison-table,
.wishlist-grid {
  max-width: 100%;
  overflow-x: auto;
}
```

**Design Notes**:
- CSS Grid for responsive layouts with breakpoint-based column counts
- Mobile-first approach with progressive enhancement
- Touch target sizes meet WCAG 2.1 AA guidelines (44x44px minimum)
- Hamburger menu pattern for mobile navigation
- Typography scales with viewport size
- No horizontal scrolling at any viewport width

---

## State Management

**File**: `frontend/src/App.tsx` (state structure)

```typescript
interface AppState {
  // Existing state
  searchQuery: string;
  results: Listing[];
  loading: boolean;
  error: string;
  
  // New state for enhancements
  alerts: PriceAlert[];
  wishlist: WishlistItem[];
  comparisonSelection: ComparisonSelection;
  currentView: 'search' | 'wishlist' | 'comparison';
  viewport: 'mobile' | 'tablet' | 'desktop';
}
```

**State Management Pattern**:
- React `useState` hooks for component-local state
- API calls via `fetch` with async/await
- Comparison selection persisted in `sessionStorage` for navigation persistence
- Viewport detection via `window.matchMedia` and resize listener

---

## Error Handling

### Validation Errors

1. **Alert Threshold Validation**:
   - Client-side: Validate threshold < current price before API call
   - Server-side: Return 400 with `INVALID_THRESHOLD` code
   - UI: Display inline error message below alert form

2. **Wishlist Limit**:
   - Server-side: Check count before insert, return 400 with `WISHLIST_FULL` code
   - UI: Display toast notification with limit message

3. **Comparison Selection**:
   - Client-side: Disable checkbox when 4 items selected
   - UI: Display tooltip "Maximum 4 products for comparison"

### Network Errors

- Retry logic for failed API calls (max 3 retries with exponential backoff)
- Fallback UI states for offline mode
- Error boundaries for React component failures

### Database Errors

- PersistenceService wraps all database operations in try/catch
- Log errors to console (or external logging service)
- Return user-friendly error messages to API layer

---

## Performance Optimization

### Frontend

1. **Code Splitting**: Lazy load Wishlist and Comparison views
   ```typescript
   const WishlistView = lazy(() => import('./components/WishlistView'));
   const ComparisonView = lazy(() => import('./components/ComparisonView'));
   ```

2. **Memoization**: Use `React.memo` for PriceCard to prevent unnecessary re-renders

3. **Image Optimization**: Use lazy loading for wishlist images
   ```typescript
   <img src={imageUrl} loading="lazy" alt={productName} />
   ```

4. **Debouncing**: Debounce viewport resize listener (300ms)

5. **Virtual Scrolling**: Consider for wishlist with many items (future optimization)

### Backend

1. **Database Indexing**: Indexes on frequently queried fields (listing_id, triggered, added_at)

2. **Connection Pooling**: SQLite WAL mode for concurrent reads

3. **Caching**: Leverage existing CacheManager for frequently accessed wishlist/alerts

4. **Batch Operations**: Update prices for all alerts/wishlist items in single transaction

### Mobile Performance

- Target metrics per requirements:
  - Page load time: < 3 seconds on 4G (estimated 4 Mbps)
  - Time to Interactive (TTI): < 5 seconds
  - First Contentful Paint (FCP): < 2 seconds

- Optimization strategies:
  - Minimize JavaScript bundle size (target < 200 KB gzipped)
  - Use CSS Grid over JavaScript layout calculations
  - Compress images (WebP format, max 100 KB per image)
  - Enable HTTP/2 and Brotli compression on server

---

## Security Considerations

1. **Input Validation**: Sanitize all user inputs on both client and server
   - Product names: Max 200 characters, escape HTML
   - Price values: Positive integers only, reject negative/float
   - UUID validation for IDs

2. **SQL Injection Prevention**: Use parameterized queries (already implemented in PersistenceService)

3. **XSS Prevention**: Escape user-generated content in React (automatic via JSX)

4. **Rate Limiting**: Implement rate limiting on API endpoints (future enhancement)
   - 100 requests per minute per IP for POST endpoints
   - 500 requests per minute for GET endpoints

5. **CORS Configuration**: Configure allowed origins for production deployment

---

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, the following properties were identified as testable with property-based testing. Redundant properties were eliminated:

**Eliminated Redundancies**:
- Alert storage and deletion can be combined into a round-trip property
- Wishlist storage and deletion can be combined into a round-trip property
- Viewport layout properties (mobile/tablet/desktop) share the same pattern and can be generalized

### Property 1: Price Alert Storage Round-Trip

*For any* valid PriceAlert data (listing ID, product name, source, alert threshold, currency, current price), storing the alert and then retrieving it should preserve all field values.

**Validates: Requirements 1.2**

### Property 2: Price Alert Deletion

*For any* valid PriceAlert that exists in storage, deleting it by ID should result in the alert no longer being retrievable from storage.

**Validates: Requirements 1.6**

### Property 3: Price Alert Trigger Condition

*For any* listing with an active PriceAlert, when the listing's current price is less than or equal to the alert threshold, the notification service should trigger the alert and mark it as triggered.

**Validates: Requirements 1.4**

### Property 4: Price Alert Rendering Completeness

*For any* set of active PriceAlerts, rendering the Alerts panel should produce output containing all required fields for each alert: product name, source, alert threshold, and current price.

**Validates: Requirements 1.5**

### Property 5: Price Alert Validation

*For any* alert threshold value that is greater than or equal to the current price, attempting to create a PriceAlert should fail with a validation error message.

**Validates: Requirements 1.7**

### Property 6: Price Alert Indicator Display

*For any* PriceCard, the visual alert indicator should be present if and only if there exists an active PriceAlert associated with that listing's ID.

**Validates: Requirements 1.8**


### Property 7: Wishlist Storage Round-Trip

*For any* valid Listing, adding it to the wishlist and then retrieving the wishlist should produce a WishlistItem that preserves all required fields: listing ID, product name, source, saved price (equal to current price at time of addition), currency, and category.

**Validates: Requirements 2.2**

### Property 8: Wishlist Rendering Completeness

*For any* WishlistItem, rendering the item in the Wishlist view should produce output containing all required fields: product name, source, original saved price, current price, and price change indicator (if prices differ).

**Validates: Requirements 2.4**

### Property 9: Wishlist Price Change Calculation

*For any* WishlistItem where the current price differs from the saved price, the displayed price change percentage should equal `abs((currentPrice - savedPrice) / savedPrice) * 100`, and the direction indicator should match the sign of the difference.

**Validates: Requirements 2.5**

### Property 10: Wishlist Deletion

*For any* WishlistItem that exists in storage, removing it by ID should result in the item no longer appearing in the retrieved wishlist.

**Validates: Requirements 2.6**

### Property 11: Wishlist Navigation

*For any* WishlistItem, simulating a click event should trigger navigation to the search results page with a query parameter matching the item's product name.

**Validates: Requirements 2.7**

### Property 12: Wishlist Indicator Display

*For any* PriceCard, the visual wishlist indicator should be present if and only if the listing's ID exists in the current wishlist.

**Validates: Requirements 2.8**

### Property 13: Responsive Layout - Mobile View

*For any* viewport width less than 768 pixels, the results grid should render with a single-column layout (grid-template-columns: 1fr).

**Validates: Requirements 3.1**


### Property 14: Responsive Layout - Tablet View

*For any* viewport width in the range [768, 1024) pixels, the results grid should render with a two-column layout (grid-template-columns: repeat(2, 1fr)).

**Validates: Requirements 3.3**

### Property 15: Responsive Layout - Desktop View

*For any* viewport width greater than or equal to 1024 pixels, the results grid should render with a three-column layout (grid-template-columns: repeat(3, 1fr)).

**Validates: Requirements 3.4**

### Property 16: Comparison Button Visibility

*For any* comparison selection count in the range [2, 4], the "Compare Selected" button should be visible; for any count outside this range, the button should not be visible.

**Validates: Requirements 4.2**

### Property 17: Comparison View Navigation

*For any* valid set of 2-4 selected listings, clicking the "Compare Selected" button should navigate to the ComparisonView and display exactly those selected listings in the comparison table.

**Validates: Requirements 4.3**

### Property 18: Comparison Table Structure

*For any* set of selected listings displayed in the ComparisonView, the comparison table should have columns for each listing and rows for all required attributes: product name, source, price, rating, review count, and category.

**Validates: Requirements 4.4**

### Property 19: Best Value Highlighting

*For any* comparison table with multiple listings, the cell with the lowest price should have the "best-value" CSS class, the cell with the highest rating should have the "best-value" class, and the cell with the most reviews should have the "best-value" class.

**Validates: Requirements 4.5**

### Property 20: Price History Chart Alignment

*For any* set of listings in ComparisonView where price history data exists, each listing should have a corresponding chart displayed in aligned columns with equal widths.

**Validates: Requirements 4.6**


### Property 21: Comparison Item Removal

*For any* listing in the ComparisonView, clicking the "Remove from Comparison" control should update the comparison selection state to exclude that listing, without triggering navigation away from the ComparisonView.

**Validates: Requirements 4.7**

### Property 22: Comparison Selection Persistence

*For any* comparison selection state, navigating from search results to ComparisonView and back should preserve the same set of selected listing IDs.

**Validates: Requirements 4.9**

### Property 23: Comparison Selection Limit Validation

*For any* attempt to select a 5th listing when 4 are already selected, the system should prevent the selection and display a validation message indicating the maximum limit of 4 products.

**Validates: Requirements 4.10**

---

## Testing Strategy

### Property-Based Testing

**Framework**: `fast-check` (TypeScript/JavaScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Seed-based reproducibility for failed tests
- Custom generators for domain models (PriceAlert, WishlistItem, Listing)

**Test Organization**:
```
backend/src/test/
  ├── generators.ts              # Custom fast-check generators
  ├── price-alerts.property.test.ts
  ├── wishlist.property.test.ts
  └── notification.property.test.ts

frontend/src/test/
  ├── generators.ts
  ├── responsive-layout.property.test.ts
  ├── comparison-view.property.test.ts
  └── wishlist-view.property.test.ts
```

**Example Property Test Structure**:
```typescript
import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Property 1: Price Alert Storage Round-Trip', () => {
  it('should preserve all fields when storing and retrieving alerts', async () => {
    await fc.assert(
      fc.asyncProperty(
        alertGenerator(),
        async (alertData) => {
          const created = await persistenceService.createPriceAlert(alertData);
          const retrieved = await persistenceService.getAlertsByListing(alertData.listingId);
          
          expect(retrieved[0]).toMatchObject({
            listingId: alertData.listingId,
            productName: alertData.productName,
            source: alertData.source,
            alertThreshold: alertData.alertThreshold,
            currency: alertData.currency,
            currentPrice: alertData.currentPrice
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

**Framework**: Vitest (frontend and backend)

**Coverage Targets**:
- Backend services: 80% line coverage
- Frontend components: 70% line coverage
- Critical paths (payment, data persistence): 95% coverage

**Focus Areas**:
- Edge cases not covered by property tests (boundary values, empty states)
- Integration points between components
- Error handling and validation logic
- UI event handlers and user interactions

### Integration Testing

**Scope**:
- End-to-end API workflows (create alert → check → trigger → delete)
- Frontend-backend integration via API calls
- Database transactions and rollback scenarios
- Notification scheduler integration

**Tools**:
- Backend: Supertest for API testing
- Frontend: Vitest + React Testing Library
- Database: In-memory SQLite for test isolation

### Performance Testing

**Mobile Performance**:
- Use Lighthouse CI in GitHub Actions
- Target scores: Performance > 90, Accessibility > 95
- Test on emulated 4G with CPU throttling (4x slowdown)

**Load Testing** (future):
- Simulate 100 concurrent users for API endpoints
- Measure response times: p50 < 200ms, p95 < 500ms, p99 < 1000ms

---

## Deployment Considerations

### Database Migration

**Migration Script** (`backend/migrations/001_add_enhancements.sql`):
```sql
-- Create price_alerts table
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
);

CREATE INDEX idx_alerts_listing ON price_alerts(listing_id);
CREATE INDEX idx_alerts_triggered ON price_alerts(triggered, created_at);

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  source VARCHAR(50) NOT NULL,
  saved_price INTEGER NOT NULL,
  current_price INTEGER NOT NULL,
  currency CHAR(3) NOT NULL,
  added_at TIMESTAMP NOT NULL,
  category VARCHAR(50) NOT NULL,
  image_url TEXT NULL,
  UNIQUE(listing_id),
  CHECK (saved_price > 0),
  CHECK (current_price > 0)
);

CREATE INDEX idx_wishlist_added ON wishlist_items(added_at DESC);
CREATE INDEX idx_wishlist_category ON wishlist_items(category);
```

**Migration Execution**:
- Run migration script on application startup if tables don't exist
- Use `CREATE TABLE IF NOT EXISTS` for idempotent migrations
- No data loss risk (new tables only, no schema changes to existing tables)

### Environment Configuration

**Environment Variables** (`.env` additions):
```
# Notification Service
NOTIFICATION_CHECK_INTERVAL=3600000  # 60 minutes in milliseconds
NOTIFICATION_ENABLED=true

# Wishlist Configuration
WISHLIST_MAX_ITEMS=50

# Performance
ENABLE_PRICE_HISTORY_CACHE=true
CACHE_TTL_MINUTES=15
```

### Notification Service Initialization

**File**: `backend/src/server.ts` (additions)

```typescript
import { NotificationService } from './services/NotificationService';
import { getPersistenceService } from './services/PersistenceService';

// Initialize services
const persistenceService = getPersistenceService();
await persistenceService.initialize();

const notificationService = new NotificationService(persistenceService);

// Start notification checker if enabled
if (process.env.NOTIFICATION_ENABLED === 'true') {
  notificationService.start();
  console.log('Notification service started');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  notificationService.stop();
  await persistenceService.close();
  process.exit(0);
});
```

---

## Future Enhancements

### Phase 2 Features (Out of Scope for MVP)

1. **User Authentication**:
   - Multi-user support with individual wishlists and alerts
   - OAuth integration (Google, Facebook)
   - Encrypted user data storage

2. **Advanced Notifications**:
   - Email notifications via SendGrid
   - SMS notifications via Twilio
   - Browser push notifications via Web Push API
   - Configurable notification preferences per user

3. **Enhanced Analytics**:
   - Price drop history charts on wishlist items
   - Average price trends across categories
   - Best time to buy recommendations

4. **Social Features**:
   - Share wishlist with friends via unique URL
   - Collaborative wishlists for families
   - Gift registry mode

5. **Export Functionality**:
   - Export wishlist to CSV/PDF
   - Print-friendly comparison view
   - Email comparison report

---

## Appendix

### Technology Stack Summary

**Backend**:
- Runtime: Node.js 18+
- Framework: Express.js
- Language: TypeScript 5.0+
- Database: SQLite 3.x with WAL mode
- Testing: Vitest + fast-check

**Frontend**:
- Framework: React 18+
- Language: TypeScript 5.0+
- Build Tool: Vite
- Styling: CSS3 with Grid and Flexbox
- Testing: Vitest + React Testing Library + fast-check

**DevOps**:
- Version Control: Git
- CI/CD: GitHub Actions (future)
- Linting: ESLint + Prettier
- Type Checking: TypeScript strict mode

### Glossary Reference

All terms defined in requirements document glossary are used consistently throughout this design:
- Dashboard, PriceAlert, Wishlist, WishlistItem, Listing
- ComparisonView, ComparisonTable, MobileView, TabletView, DesktopView
- AlertThreshold, NotificationService, PersistenceService

### Design Review Checklist

- [x] All acceptance criteria mapped to design components
- [x] Data models defined with TypeScript interfaces
- [x] Database schema designed with constraints and indexes
- [x] API endpoints specified with request/response formats
- [x] Frontend components defined with props and state
- [x] Responsive design covers all viewport breakpoints
- [x] Error handling strategy defined
- [x] Performance optimization strategies documented
- [x] Security considerations addressed
- [x] Correctness properties defined for all testable criteria
- [x] Testing strategy covers property-based, unit, and integration tests
- [x] Deployment considerations including migrations and configuration

---

**End of Design Document**
