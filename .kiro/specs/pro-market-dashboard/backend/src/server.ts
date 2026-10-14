import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AggregatorService } from './services/AggregatorService';
import { CacheManager } from './services/CacheManager';
import { PersistenceService } from './services/PersistenceService';
import { ScoringEngine } from './services/ScoringEngine';
import {
  MockAmazonAdapter,
  MockEbayAdapter,
  MockWalmartAdapter,
} from './adapters';

/**
 * Express API Server for PRO Market Dashboard
 * 
 * Requirements:
 * - 9.1: Well-structured REST API
 * - 9.6: CORS, body-parser, error handling
 */

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Initialize services
const cacheManager = new CacheManager();
const persistenceService = new PersistenceService();
const scoringEngine = new ScoringEngine();

// Initialize source adapters (using mock adapters for now)
const sourceAdapters = [
  new MockAmazonAdapter(),
  new MockEbayAdapter(),
  new MockWalmartAdapter(),
];

const aggregatorService = new AggregatorService(
  sourceAdapters,
  cacheManager,
  persistenceService,
  scoringEngine
);

// Routes

/**
 * GET /api/search
 * Search for products across all sources
 * 
 * Query parameters:
 * - q (required): Search query string
 * - category (optional): Category filter
 * 
 * Requirements: 1.1, 9.1, 9.4, 9.5, 10.2
 */
app.get('/api/search', async (req: Request, res: Response) => {
  try {
    const { q: query, category } = req.query;

    // Validate required parameters
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: q',
        code: 'INVALID_QUERY',
      });
    }

    // Validate query is not empty or whitespace
    if (query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query cannot be empty or whitespace only',
        code: 'INVALID_QUERY',
      });
    }

    // Perform search
    const result = await aggregatorService.search(
      query,
      category as string | undefined
    );

    // Add cache headers
    const cacheStatus = result.cachedAt ? 'HIT' : 'MISS';
    res.setHeader('X-Cache', cacheStatus);
    res.setHeader('Cache-Control', 'private, max-age=600');

    // Update cachedAt for response
    if (result.cachedAt === null) {
      result.cachedAt = new Date().toISOString();
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in /api/search:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/listing/:id/history
 * Get price history for a listing
 * 
 * Path parameters:
 * - id (required): Listing identifier
 * 
 * Query parameters:
 * - range (optional): Days of history (default 30, allowed: 7, 30, 90)
 * 
 * Requirements: 5.1, 5.2, 5.3, 9.2, 9.5
 */
app.get('/api/listing/:id/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { range } = req.query;

    // Validate listing ID
    if (!id) {
      return res.status(400).json({
        error: 'Missing required parameter: id',
        code: 'INVALID_LISTING_ID',
      });
    }

    // Parse and validate range
    let rangeDays = 30; // default
    if (range) {
      rangeDays = parseInt(range as string, 10);
      if (![7, 30, 90].includes(rangeDays)) {
        return res.status(400).json({
          error: 'Invalid range parameter. Allowed values: 7, 30, 90',
          code: 'INVALID_RANGE',
        });
      }
    }

    // Fetch price history
    const history = await aggregatorService.getListingHistory(id, rangeDays);

    // Check for insufficient data
    if (history.length < 2) {
      return res.status(200).json({
        listingId: id,
        history: [],
        dataPoints: history.length,
        message: 'Insufficient history data',
      });
    }

    // Extract product name from listing ID (mock implementation)
    const productName = id.split('_').slice(1).join(' ');

    res.status(200).json({
      listingId: id,
      productName,
      history: history.map((record) => ({
        timestamp: record.timestamp.toISOString(),
        price: record.price,
      })),
      dataPoints: history.length,
    });
  } catch (error) {
    console.error('Error in /api/listing/:id/history:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/listing/:id/reviews
 * Get reviews for a listing
 * 
 * Path parameters:
 * - id (required): Listing identifier
 * 
 * Requirements: 6.2, 6.3, 9.3, 9.5
 */
app.get('/api/listing/:id/reviews', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate listing ID
    if (!id) {
      return res.status(400).json({
        error: 'Missing required parameter: id',
        code: 'INVALID_LISTING_ID',
      });
    }

    // Fetch reviews
    const reviewResponse = await aggregatorService.getListingReviews(id);

    res.status(200).json(reviewResponse);
  } catch (error) {
    console.error('Error in /api/listing/:id/reviews:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: err.message,
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PRO Market Dashboard API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Search endpoint: http://localhost:${PORT}/api/search?q=<query>`);
  });
}

export { app, aggregatorService };
