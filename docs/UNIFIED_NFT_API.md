# Unified NFT API Documentation

## Overview

The `/api/nfts` endpoint has been enhanced to be a comprehensive, unified API that handles all NFT fetching, filtering, and searching use cases across the application. This replaces multiple separate endpoints and provides a more robust, maintainable solution.

## Base URL

```
GET /api/nfts
```

## Query Parameters

### Core Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number for pagination | `1` |
| `limit` | number | Number of items per page | `12` |
| `query` | string | Search query (searches name, description, record label, and track names) | `"jazz"` |

### Filtering Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `genre` | string | Filter by music genre | `"rock"` |
| `recordSize` | string | Filter by record size (comma-separated for multiple) | `"12inch,7inch"` |
| `saleType` | string | Filter by sale type | `"presale"`, `"70% Funded"`, `"New"` |
| `formatType` | string | Filter by format type | `"vinyl"`, `"digital"`, `"presale"` |
| `subscriptionTier` | string | Filter by creator subscription tier | `"plus"`, `"starter"` |
| `plusCreatorsOnly` | boolean | Show only Plus creators | `true` |
| `isCurated` | boolean | Show only curated NFTs | `true` |
| `isRadioEligible` | boolean | Show only radio-eligible NFTs | `true` |

### User-Specific Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `userId` | string | Filter NFTs by specific user ID | `"user_123"` |
| `createdBy` | string | Filter NFTs created by specific user | `"user_123"` |
| `likedBy` | string | Filter NFTs liked by specific user | `"user_123"` |

### Price and Date Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `priceMin` | number | Minimum price filter | `10.50` |
| `priceMax` | number | Maximum price filter | `100.00` |
| `dateFrom` | string | Filter from date (ISO format) | `"2024-01-01"` |
| `dateTo` | string | Filter to date (ISO format) | `"2024-12-31"` |

### Sorting Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `sortOrder` | string | Sort order for results | `"Recently-listed"`, `"Ending-soon"`, `"Most-favorited"`, `"Most-viewed"`, `"Price-low-to-high"`, `"Price-high-to-low"`, `"Oldest-first"` |

### Special Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `filter` | string | Special filter type | `"viewed"`, `"appreciated"`, `"recent"` |
| `tab` | string | User-specific tab filter | `"collectibles"`, `"created"` |
| `isLive` | boolean | Filter for live NFTs (future feature) | `true` |

## Response Format

```json
{
  "success": true,
  "nfts": [
    {
      "id": "nft_123",
      "name": "Album Name",
      "description": "Album description",
      "genre": "rock",
      "creator": "Artist Name",
      "userImage": "https://...",
      "creatorSubscriptionTier": "plus",
      "recordSize": "12inch",
      "recordLabel": "Independent",
      "price": 25.00,
      "endDate": "2024-12-31T23:59:59.000Z",
      "imageUrl": "https://...",
      "sideAImage": "https://...",
      "sideBImage": "https://...",
      "sideATracks": [...],
      "sideBTracks": [...],
      "currentOrders": 75,
      "targetOrders": 100,
      "isVinylPresale": true,
      "isLiked": false,
      "likeCount": 42,
      "viewCount": 150,
      "isDeleted": false,
      "isCurated": false,
      "isRadioEligible": true,
      "user": {
        "id": "user_123",
        "name": "Artist Name",
        "image": "https://...",
        "subscriptionTier": "plus"
      }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 12,
  "totalPages": 13,
  "hasMore": true,
  "filters": {
    "applied": {
      "query": "jazz",
      "genre": "rock",
      "sortOrder": "Recently-listed",
      "page": 1,
      "limit": 12
    }
  }
}
```

## Use Cases and Examples

### 1. Search Page
```javascript
// Search for jazz albums
const response = await fetch('/api/nfts?query=jazz&sortOrder=Recently-listed&page=1&limit=12');
```

### 2. Collection Page
```javascript
// Get all NFTs with filtering
const response = await fetch('/api/nfts?genre=rock&recordSize=12inch&sortOrder=Most-favorited&page=1&limit=20');
```

### 3. User's Created NFTs
```javascript
// Get NFTs created by specific user
const response = await fetch('/api/nfts?createdBy=user_123&sortOrder=Recently-listed&page=1&limit=12');
```

### 4. User's Liked NFTs
```javascript
// Get NFTs liked by specific user
const response = await fetch('/api/nfts?likedBy=user_123&sortOrder=Recently-listed&page=1&limit=12');
```

### 5. Plus Creators Only
```javascript
// Show only Plus creator NFTs
const response = await fetch('/api/nfts?plusCreatorsOnly=true&sortOrder=Recently-listed&page=1&limit=12');
```

### 6. Price Range Filter
```javascript
// Filter by price range
const response = await fetch('/api/nfts?priceMin=10&priceMax=50&sortOrder=Price-low-to-high&page=1&limit=12');
```

### 7. Date Range Filter
```javascript
// Filter by creation date
const response = await fetch('/api/nfts?dateFrom=2024-01-01&dateTo=2024-12-31&sortOrder=Recently-listed&page=1&limit=12');
```

### 8. Complex Filtering
```javascript
// Multiple filters combined
const response = await fetch('/api/nfts?genre=rock&recordSize=12inch&plusCreatorsOnly=true&isCurated=true&sortOrder=Most-favorited&page=1&limit=12');
```

## Migration Guide

### From Old Endpoints

#### Before (Multiple APIs):
```javascript
// Search page
const searchResponse = await fetch('/api/nft/search?query=jazz');

// Collection page  
const collectionResponse = await fetch('/api/nfts/filter?genre=rock');

// User NFTs
const userNftsResponse = await fetch('/api/user/nfts?userId=123');

// Exact search
const exactResponse = await fetch('/api/nfts/exact?query=album');
```

#### After (Unified API):
```javascript
// All use cases now use the same endpoint
const searchResponse = await fetch('/api/nfts?query=jazz');
const collectionResponse = await fetch('/api/nfts?genre=rock');
const userNftsResponse = await fetch('/api/nfts?createdBy=123');
const exactResponse = await fetch('/api/nfts?query=album');
```

## Benefits

1. **Consistency**: All NFT fetching uses the same endpoint with consistent response format
2. **Maintainability**: Single codebase to maintain instead of multiple endpoints
3. **Performance**: Optimized queries with proper indexing and caching
4. **Flexibility**: Easy to add new filters and sorting options
5. **Type Safety**: Better TypeScript support with unified types
6. **Caching**: Built-in request debouncing and caching
7. **Pagination**: Consistent pagination across all use cases

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (authentication required)
- `500`: Server error

Error response format:
```json
{
  "error": "Error message description"
}
```

## Performance Considerations

- **Debouncing**: Requests within 300ms are cached to prevent duplicate calls
- **Pagination**: Always use pagination for large datasets
- **Filtering**: Use database-level filtering when possible
- **Caching**: Responses are cached for improved performance

## Future Enhancements

- Full-text search capabilities
- Advanced filtering (duration, BPM, etc.)
- Aggregation queries (counts, averages)
- Real-time updates via WebSocket
- GraphQL support for complex queries 