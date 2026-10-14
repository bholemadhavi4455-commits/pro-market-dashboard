# PRO Market Dashboard - Frontend

React-based frontend for the PRO Market Dashboard application.

## Project Structure

```
frontend/
├── src/
│   ├── components/      # React components (SearchBar, Dashboard, PriceCard, etc.)
│   ├── services/        # API service layer
│   │   └── api.ts      # Axios-based API client
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts    # Interfaces matching backend models
│   ├── App.tsx         # Root component
│   ├── main.tsx        # React entry point
│   └── index.css       # Global styles
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration with proxy to backend
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Installation

Install dependencies using npm:

```bash
npm install
```

## Available Scripts

- `npm run dev` - Start development server (port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## TypeScript Interfaces

All TypeScript interfaces matching the backend models are defined in `src/types/index.ts`:

- **Listing** - Product listing with price, rating, and source information
- **Review** - Customer review data
- **SearchResult** - Search API response with listings and best pick
- **PriceHistoryRecord** - Price at a specific timestamp
- **PriceHistoryResponse** - Price history API response
- **ReviewResponse** - Reviews API response
- **ErrorResponse** - Error response structure

## API Service

The `src/services/api.ts` module provides typed functions for all backend API endpoints:

- `searchProducts(query, category?)` - Search for products
- `getListingHistory(listingId, range?)` - Get price history
- `getListingReviews(listingId)` - Get customer reviews

## Development

The Vite dev server is configured to proxy `/api` requests to the backend running on `http://localhost:3000`.

Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Requirements Validation

This setup satisfies:
- **Requirement 1.1**: SearchBar can send queries to Aggregator API
- **Requirement 1.2**: Dashboard can render PriceCard components per Listing
- All TypeScript interfaces match backend models as specified in design.md
