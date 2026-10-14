# PRO Market Dashboard - Backend

Backend API server for the PRO Market Dashboard application. Aggregates product listings from multiple online sources, provides price comparison, and computes recommendations.

## Project Structure

```
backend/
├── src/
│   ├── server.ts           # Express application entry point
│   ├── models/             # TypeScript interfaces and data models
│   ├── services/           # Business logic and orchestration
│   ├── routes/             # API route definitions
│   └── adapters/           # External source integrations
├── dist/                   # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── nodemon.json
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Start production server:
```bash
npm start
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/search?q={query}&category={category}` - Search for products (to be implemented)
- `GET /api/listing/:id/history?range={days}` - Get price history (to be implemented)
- `GET /api/listing/:id/reviews` - Get product reviews (to be implemented)

## Requirements Addressed

- **Requirement 9.1**: API endpoint structure
- **Requirement 9.6**: CORS configuration for frontend integration

## Technology Stack

- **Node.js** with **Express** - Web server framework
- **TypeScript** - Type-safe development with strict mode enabled
- **Axios** - HTTP client for external API calls
- **CORS** - Cross-origin resource sharing
- **Body-parser** - Request body parsing middleware
