/**
 * PRO Market Dashboard - Backend Server
 * Entry point for the Express API server
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Listing, SearchResult } from './models';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock data generator
function generateMockListings(query: string): Listing[] {
  const products = [
    // Electronics - Updated to 2026 Indian market prices
    { name: 'Wireless Headphones', category: 'Electronics', basePrice: 299900 },  // ₹2,999
    { name: 'Laptop Computer', category: 'Electronics', basePrice: 5499900 },    // ₹54,999
    { name: 'Smart Watch', category: 'Electronics', basePrice: 1999900 },        // ₹19,999
    { name: 'Mobile Phone', category: 'Electronics', basePrice: 1599900 },       // ₹15,999
    { name: 'Tablet', category: 'Electronics', basePrice: 2499900 },             // ₹24,999
    { name: 'Bluetooth Speaker', category: 'Electronics', basePrice: 149900 },   // ₹1,499
    { name: 'Gaming Console', category: 'Electronics', basePrice: 4999900 },     // ₹49,999
    { name: 'Smart TV', category: 'Electronics', basePrice: 3999900 },           // ₹39,999
    { name: 'Wireless Mouse', category: 'Electronics', basePrice: 59900 },       // ₹599
    { name: 'Keyboard', category: 'Electronics', basePrice: 149900 },            // ₹1,499
    { name: 'Webcam', category: 'Electronics', basePrice: 249900 },              // ₹2,499
    { name: 'Power Bank', category: 'Electronics', basePrice: 99900 },           // ₹999
    { name: 'Earbuds', category: 'Electronics', basePrice: 199900 },             // ₹1,999
    { name: 'Smartwatch Band', category: 'Electronics', basePrice: 49900 },      // ₹499
    { name: 'USB Cable', category: 'Electronics', basePrice: 19900 },            // ₹199
    
    // Sports & Fitness - Realistic prices
    { name: 'Running Shoes', category: 'Sports', basePrice: 249900 },            // ₹2,499
    { name: 'Yoga Mat', category: 'Sports', basePrice: 79900 },                  // ₹799
    { name: 'Dumbbell Set', category: 'Sports', basePrice: 199900 },             // ₹1,999
    { name: 'Cricket Bat', category: 'Sports', basePrice: 149900 },              // ₹1,499
    { name: 'Football', category: 'Sports', basePrice: 69900 },                  // ₹699
    { name: 'Badminton Racket', category: 'Sports', basePrice: 99900 },          // ₹999
    { name: 'Gym Bag', category: 'Sports', basePrice: 79900 },                   // ₹799
    { name: 'Water Bottle', category: 'Sports', basePrice: 29900 },              // ₹299
    { name: 'Tennis Ball', category: 'Sports', basePrice: 19900 },               // ₹199
    { name: 'Skipping Rope', category: 'Sports', basePrice: 24900 },             // ₹249
    
    // Books - Indian market prices
    { name: 'Best Seller Book', category: 'Books', basePrice: 49900 },           // ₹499
    { name: 'Novel', category: 'Books', basePrice: 29900 },                      // ₹299
    { name: 'Textbook', category: 'Books', basePrice: 79900 },                   // ₹799
    { name: 'Comics', category: 'Books', basePrice: 19900 },                     // ₹199
    { name: 'Biography', category: 'Books', basePrice: 59900 },                  // ₹599
    { name: 'Self Help Book', category: 'Books', basePrice: 39900 },             // ₹399
    { name: 'Cookbook', category: 'Books', basePrice: 34900 },                   // ₹349
    
    // Clothing - Updated prices
    { name: 'T-Shirt', category: 'Clothing', basePrice: 39900 },                 // ₹399
    { name: 'Jeans', category: 'Clothing', basePrice: 119900 },                  // ₹1,199
    { name: 'Shoes', category: 'Clothing', basePrice: 179900 },                  // ₹1,799
    { name: 'Jacket', category: 'Clothing', basePrice: 249900 },                 // ₹2,499
    { name: 'Dress', category: 'Clothing', basePrice: 149900 },                  // ₹1,499
    { name: 'Shirt', category: 'Clothing', basePrice: 69900 },                   // ₹699
    { name: 'Saree', category: 'Clothing', basePrice: 179900 },                  // ₹1,799
    { name: 'Kurta', category: 'Clothing', basePrice: 99900 },                   // ₹999
    { name: 'Sneakers', category: 'Clothing', basePrice: 229900 },               // ₹2,299
    { name: 'Sandals', category: 'Clothing', basePrice: 69900 },                 // ₹699
    
    // Home & Kitchen - Market accurate prices
    { name: 'Coffee Maker', category: 'Home & Kitchen', basePrice: 249900 },     // ₹2,499
    { name: 'Mixer Grinder', category: 'Home & Kitchen', basePrice: 349900 },    // ₹3,499
    { name: 'Pressure Cooker', category: 'Home & Kitchen', basePrice: 179900 },  // ₹1,799
    { name: 'Microwave Oven', category: 'Home & Kitchen', basePrice: 799900 },   // ₹7,999
    { name: 'Air Fryer', category: 'Home & Kitchen', basePrice: 449900 },        // ₹4,499
    { name: 'Toaster', category: 'Home & Kitchen', basePrice: 149900 },          // ₹1,499
    { name: 'Blender', category: 'Home & Kitchen', basePrice: 199900 },          // ₹1,999
    { name: 'Rice Cooker', category: 'Home & Kitchen', basePrice: 179900 },      // ₹1,799
    { name: 'Kettle', category: 'Home & Kitchen', basePrice: 89900 },            // ₹899
    { name: 'Dinner Set', category: 'Home & Kitchen', basePrice: 249900 },       // ₹2,499
    { name: 'Bedsheet', category: 'Home & Kitchen', basePrice: 99900 },          // ₹999
    { name: 'Pillow', category: 'Home & Kitchen', basePrice: 49900 },            // ₹499
    { name: 'Curtains', category: 'Home & Kitchen', basePrice: 129900 },         // ₹1,299
    { name: 'Vacuum Cleaner', category: 'Home & Kitchen', basePrice: 599900 },   // ₹5,999
    
    // Jewelry & Precious Metals - Based on current gold/silver rates (June 2026)
    { name: 'Gold Ring', category: 'Jewelry', basePrice: 3500000 },              // ₹35,000 (5g gold)
    { name: 'Gold Necklace', category: 'Jewelry', basePrice: 7500000 },          // ₹75,000 (10g gold)
    { name: 'Gold Earrings', category: 'Jewelry', basePrice: 2500000 },          // ₹25,000 (3g gold)
    { name: 'Gold Bracelet', category: 'Jewelry', basePrice: 4500000 },          // ₹45,000 (6g gold)
    { name: 'Gold Chain', category: 'Jewelry', basePrice: 6000000 },             // ₹60,000 (8g gold)
    { name: 'Silver Ring', category: 'Jewelry', basePrice: 150000 },             // ₹1,500 (20g silver)
    { name: 'Silver Necklace', category: 'Jewelry', basePrice: 350000 },         // ₹3,500 (50g silver)
    { name: 'Silver Bracelet', category: 'Jewelry', basePrice: 200000 },         // ₹2,000 (25g silver)
    { name: 'Silver Anklet', category: 'Jewelry', basePrice: 180000 },           // ₹1,800 (22g silver)
    { name: 'Diamond Ring', category: 'Jewelry', basePrice: 10000000 },          // ₹1,00,000 (0.5 carat)
    { name: 'Diamond Earrings', category: 'Jewelry', basePrice: 8000000 },       // ₹80,000
    { name: 'Platinum Ring', category: 'Jewelry', basePrice: 5000000 },          // ₹50,000
    { name: 'Watch', category: 'Jewelry', basePrice: 799900 },                   // ₹7,999
    { name: 'Sunglasses', category: 'Jewelry', basePrice: 149900 },              // ₹1,499
    
    // Beauty & Personal Care
    { name: 'Perfume', category: 'Beauty', basePrice: 199900 },                  // ₹1,999
    { name: 'Lipstick', category: 'Beauty', basePrice: 49900 },                  // ₹499
    { name: 'Face Cream', category: 'Beauty', basePrice: 69900 },                // ₹699
    { name: 'Shampoo', category: 'Beauty', basePrice: 29900 },                   // ₹299
    { name: 'Hair Dryer', category: 'Beauty', basePrice: 149900 },               // ₹1,499
    { name: 'Trimmer', category: 'Beauty', basePrice: 99900 },                   // ₹999
    { name: 'Makeup Kit', category: 'Beauty', basePrice: 249900 },               // ₹2,499
    
    // Toys & Baby
    { name: 'Toy Car', category: 'Toys', basePrice: 49900 },                     // ₹499
    { name: 'Doll', category: 'Toys', basePrice: 69900 },                        // ₹699
    { name: 'Board Game', category: 'Toys', basePrice: 99900 },                  // ₹999
    { name: 'Puzzle', category: 'Toys', basePrice: 39900 },                      // ₹399
    { name: 'Baby Stroller', category: 'Toys', basePrice: 599900 },              // ₹5,999
    { name: 'Baby Carrier', category: 'Toys', basePrice: 179900 },               // ₹1,799
    
    // Groceries
    { name: 'Rice', category: 'Groceries', basePrice: 99900 },                   // ₹999 (25kg)
    { name: 'Wheat Flour', category: 'Groceries', basePrice: 49900 },            // ₹499 (10kg)
    { name: 'Cooking Oil', category: 'Groceries', basePrice: 79900 },            // ₹799 (5L)
    { name: 'Sugar', category: 'Groceries', basePrice: 29900 },                  // ₹299 (5kg)
    { name: 'Tea', category: 'Groceries', basePrice: 19900 },                    // ₹199 (500g)
    { name: 'Coffee', category: 'Groceries', basePrice: 39900 },                 // ₹399 (200g)
    { name: 'Spices', category: 'Groceries', basePrice: 14900 },                 // ₹149 (100g)
    
    // Stationery
    { name: 'Notebook', category: 'Stationery', basePrice: 9900 },               // ₹99
    { name: 'Pen Set', category: 'Stationery', basePrice: 14900 },               // ₹149
    { name: 'Pencil Box', category: 'Stationery', basePrice: 19900 },            // ₹199
    { name: 'Backpack', category: 'Stationery', basePrice: 99900 },              // ₹999
    { name: 'Calculator', category: 'Stationery', basePrice: 49900 },            // ₹499
  ];

  const sources = ['Amazon', 'eBay', 'Walmart'];
  const listings: Listing[] = [];

  // Convert query to lowercase for better matching
  const searchQuery = query.toLowerCase().trim();

  // Filter products based on query (search in product name)
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery) ||
    searchQuery.split(' ').some(word => p.name.toLowerCase().includes(word)) ||
    p.category.toLowerCase().includes(searchQuery)
  );

  // If no matches, return popular products
  const productsToUse = filteredProducts.length > 0 
    ? filteredProducts 
    : products.filter(p => ['Laptop Computer', 'Mobile Phone', 'Smart Watch', 'T-Shirt', 'Running Shoes'].includes(p.name));

  productsToUse.forEach(product => {
    sources.forEach(source => {
      const priceVariation = Math.floor(Math.random() * 2000) - 1000;
      const price = product.basePrice + priceVariation;
      const rating = Number((3.5 + Math.random() * 1.5).toFixed(1));
      const reviewCount = Math.floor(Math.random() * 5000) + 100;

      listings.push({
        id: `${source.toLowerCase()}_${product.name.replace(/\s/g, '_').toLowerCase()}`,
        productName: product.name,
        source,
        sourceUrl: `https://${source.toLowerCase()}.com/product/${Math.random().toString(36).substr(2, 9)}`,
        price,
        currency: 'INR',
        rating,
        reviewCount,
        category: product.category,
        compositeScore: 0,
        fetchedAt: new Date().toISOString(),
      });
    });
  });

  // Calculate composite scores
  if (listings.length > 0) {
    const maxPrice = Math.max(...listings.map(l => l.price));
    const minPrice = Math.min(...listings.map(l => l.price));
    const maxReviews = Math.max(...listings.map(l => l.reviewCount));

    listings.forEach(listing => {
      const priceScore = maxPrice > minPrice ? (maxPrice - listing.price) / (maxPrice - minPrice) : 0.5;
      const ratingScore = listing.rating / 5.0;
      const reviewScore = maxReviews > 0 ? listing.reviewCount / maxReviews : 0.5;
      
      listing.compositeScore = Number(
        ((0.5 * priceScore) + (0.3 * ratingScore) + (0.2 * reviewScore)) * 100
      ).toFixed(1) as any;
    });

    // Sort by composite score descending
    listings.sort((a, b) => Number(b.compositeScore) - Number(a.compositeScore));
  }

  return listings;
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'PRO Market Dashboard API is running' });
});

// Search endpoint
app.get('/api/search', (req: Request, res: Response): void => {
  const query = req.query.q as string;
  const category = req.query.category as string;

  if (!query || query.trim() === '') {
    res.status(400).json({ error: 'Missing required parameter: q' });
    return;
  }

  try {
    let listings = generateMockListings(query);

    // Filter by category if provided
    if (category && category !== 'All') {
      listings = listings.filter(l => l.category === category);
    }

    // Determine best pick
    const bestPick = listings.length >= 2 ? listings[0] : null;

    // Count unique sources
    const uniqueSources = new Set(listings.map(l => l.source));
    const sourcesCount = uniqueSources.size;

    const result: SearchResult = {
      listings,
      bestPick,
      sourcesCount,
      cachedAt: null,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Price history endpoint
app.get('/api/listing/:id/history', (req: Request, res: Response) => {
  const { id } = req.params;
  const range = parseInt(req.query.range as string) || 30;

  // Generate mock price history
  const history = [];
  const now = new Date();
  const basePrice = 5000 + Math.random() * 10000;

  for (let i = range; i >= 0; i -= Math.floor(range / 10)) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    history.push({
      timestamp: date.toISOString(),
      price: Math.floor(basePrice + (Math.random() - 0.5) * 2000),
    });
  }

  res.status(200).json({
    listingId: id,
    productName: 'Product Name',
    history,
    dataPoints: history.length,
  });
});

// Reviews endpoint
app.get('/api/listing/:id/reviews', (req: Request, res: Response) => {
  const { id } = req.params;

  // Generate mock reviews
  const reviews = [
    {
      author: 'John D.',
      rating: 5,
      text: 'Excellent product! Highly recommended. Works great and arrived on time.',
      date: '2025-01-10',
      verified: true,
      sourceReviewUrl: 'https://example.com/review/1',
    },
    {
      author: 'Sarah M.',
      rating: 4,
      text: 'Good quality, but a bit pricey. Overall satisfied with the purchase.',
      date: '2025-01-08',
      verified: true,
      sourceReviewUrl: 'https://example.com/review/2',
    },
    {
      author: 'Mike R.',
      rating: 5,
      text: 'Best purchase I made this year! Absolutely love it.',
      date: '2025-01-05',
      verified: false,
      sourceReviewUrl: 'https://example.com/review/3',
    },
  ];

  res.status(200).json({
    listingId: id,
    reviews,
    totalReviews: reviews.length,
    averageRating: 4.7,
    available: true,
  });
});

// Wishlist endpoints
app.get('/api/wishlist', async (_req: Request, res: Response) => {
  try {
    const { getPersistenceService } = await import('./services/PersistenceService');
    const persistence = getPersistenceService();
    
    if (!persistence.isConnected()) {
      await persistence.initialize();
    }
    
    const items = await persistence.getWishlist();
    res.status(200).json({ items });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

app.post('/api/wishlist', async (req: Request, res: Response) => {
  try {
    const { listingId, productName, source, savedPrice, currentPrice, currency, category, imageUrl } = req.body;
    
    if (!listingId || !productName || !source || !savedPrice || !currentPrice || !currency || !category) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const { getPersistenceService } = await import('./services/PersistenceService');
    const persistence = getPersistenceService();
    
    if (!persistence.isConnected()) {
      await persistence.initialize();
    }
    
    const item = await persistence.addToWishlist({
      listingId,
      productName,
      source,
      savedPrice,
      currentPrice,
      currency,
      category,
      imageUrl,
    });
    
    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error adding to wishlist:', error);
    if (error.message && error.message.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Item already in wishlist' });
    } else {
      res.status(500).json({ error: 'Failed to add to wishlist' });
    }
  }
});

app.delete('/api/wishlist/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { getPersistenceService } = await import('./services/PersistenceService');
    const persistence = getPersistenceService();
    
    if (!persistence.isConnected()) {
      await persistence.initialize();
    }
    
    await persistence.removeFromWishlist(id);
    res.status(200).json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

app.get('/api/wishlist/check/:listingId', async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    
    const { getPersistenceService } = await import('./services/PersistenceService');
    const persistence = getPersistenceService();
    
    if (!persistence.isConnected()) {
      await persistence.initialize();
    }
    
    const inWishlist = await persistence.isInWishlist(listingId);
    res.status(200).json({ inWishlist });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

// Price Alerts endpoints
app.get('/api/alerts', async (_req: Request, res: Response) => {
  try {
    const { getPersistenceService } = await import('./services/PersistenceService');
    const persistence = getPersistenceService();
    
    if (!persistence.isConnected()) {
      await persistence.initialize();
    }
    
    const alerts = await persistence.getActiveAlerts();
    res.status(200).json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.post('/api/alerts', async (req: Request, res: Response) => {
  try {
    const { listingId, productName, source, alertThreshold, currentPrice, currency } = req.body;
    
    if (!listingId || !productName || !source || !alertThreshold || !currentPrice || !currency) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const { getPersistenceService } = await import('./services/PersistenceService');
    const persistence = getPersistenceService();
    
    if (!persistence.isConnected()) {
      await persistence.initialize();
    }
    
    const alert = await persistence.createPriceAlert({
      listingId,
      productName,
      source,
      alertThreshold,
      currentPrice,
      currency,
    });
    
    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

app.delete('/api/alerts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { getPersistenceService } = await import('./services/PersistenceService');
    const persistence = getPersistenceService();
    
    if (!persistence.isConnected()) {
      await persistence.initialize();
    }
    
    await persistence.deleteAlert(id);
    res.status(200).json({ message: 'Alert deleted' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

app.get('/api/alerts/listing/:listingId', async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    
    const { getPersistenceService } = await import('./services/PersistenceService');
    const persistence = getPersistenceService();
    
    if (!persistence.isConnected()) {
      await persistence.initialize();
    }
    
    const alerts = await persistence.getAlertsByListing(listingId);
    res.status(200).json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts by listing:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET /health`);
  console.log(`   GET /api/search?q={query}&category={category}`);
  console.log(`   GET /api/listing/:id/history?range={days}`);
  console.log(`   GET /api/listing/:id/reviews`);
  console.log(`   GET /api/wishlist`);
  console.log(`   POST /api/wishlist`);
  console.log(`   DELETE /api/wishlist/:id`);
  console.log(`   GET /api/wishlist/check/:listingId`);
  console.log(`   GET /api/alerts`);
  console.log(`   POST /api/alerts`);
  console.log(`   DELETE /api/alerts/:id`);
  console.log(`   GET /api/alerts/listing/:listingId`);
});

export default app;
