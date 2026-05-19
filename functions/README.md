# Smart Cafe Firebase Cloud Functions

Serverless data aggregation engine for Smart Cafe that automatically processes orders and maintains real-time statistics.

## Overview

This Cloud Functions module provides:

1. **Order Statistics Aggregation** - Automatically triggered when orders are created
2. **Atomic Updates** - Uses `FieldValue.increment()` to prevent race conditions
3. **Real-time Statistics** - Maintains daily, monthly, and weekly statistics
4. **Best Sellers Tracking** - Tracks top-selling items by category

## Features

### Trigger-Based Aggregation

- `aggregateOrderStatistics` - Triggered by `onDocumentCreated` in the `orders` collection
- `updateStatisticsOnOrderChange` - Handles order cancellations and reverts statistics
- `generateWeeklySummary` - Scheduled function that runs every Monday

### Data Structure

Statistics are stored in the `statistics` collection with the following document structure:

```typescript
// Daily stats: statistics/daily_YYYYMMDD
// Monthly stats: statistics/monthly_YYYYMM
// Weekly stats: statistics/weekly_YYYY_WNN

{
  period: "daily" | "monthly" | "weekly",
  date: "2024-01-15",           // For daily
  month: "2024-01",             // For monthly
  totalTurnover: 1250.50,
  totalOrders: 45,
  cancelledOrders: 2,
  bestSellers: {
    "item_id_1": {
      name: "Salted Caramel Mocha",
      count: 15,
      revenue: 82.50,
      category: "Coffee"
    },
    // ... more items
  },
  itemSalesCount: {
    "item_id_1": {
      count: 15,
      revenue: 82.50,
      lastSold: Timestamp
    },
    // ... more items
  },
  lastUpdated: Timestamp
}
```

## Installation

### Prerequisites

- Node.js 20 or higher
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Firestore enabled

### Setup

1. Navigate to the functions directory:

   ```bash
   cd functions
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the TypeScript code:

   ```bash
   npm run build
   ```

4. Deploy to Firebase:

   ```bash
   npm run deploy
   ```

   Or using Firebase CLI directly:

   ```bash
   firebase deploy --only functions
   ```

## Development

### Local Testing

Start the Firebase emulator:

```bash
npm run serve
```

This will start the local emulator suite where you can test functions.

### Build Watch Mode

For development with auto-rebuild:

```bash
npm run build:watch
```

### View Logs

```bash
npm run logs
```

## Deployment

### Deploy All Functions

```bash
firebase deploy --only functions
```

### Deploy Specific Function

```bash
firebase deploy --only functions:aggregateOrderStatistics
```

## Usage in React Application

### Using the useStatistics Hook

```typescript
import {
  useStatistics,
  useStatisticsTrend,
  useStatisticsSummary,
} from "./hooks/useStatistics";

// Get daily statistics with real-time updates
const {
  statistics,
  loading,
  error,
  bestSellersChartData,
  categoryChartData,
  refresh,
} = useStatistics("daily", new Date(), true);

// Get 7-day trend data
const { trendData, loading: trendLoading } = useStatisticsTrend(7);

// Get summary statistics
const { summary, loading: summaryLoading } = useStatisticsSummary();
```

### Using the Statistics Dashboard Component

```typescript
import StatisticsDashboard from './components/StatisticsDashboard';

// Use in your admin dashboard
function AdminDashboard() {
  return (
    <div>
      <StatisticsDashboard />
    </div>
  );
}
```

## Firestore Security Rules

Add these rules to secure the statistics collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Statistics collection - read only for authenticated users
    match /statistics/{document} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write
    }

    // Orders collection
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null &&
        (request.auth.token.admin == true || resource.data.userId == request.auth.uid);
    }
  }
}
```

## Callable Function

The `getStatisticsSummary` callable function can be used from the client:

```typescript
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const getStatisticsSummary = httpsCallable(functions, "getStatisticsSummary");

const result = await getStatisticsSummary({
  period: "daily",
  date: "2024-01-15",
});

console.log(result.data);
```

## Monitoring

### Function Metrics

Monitor function performance in the Firebase Console:

- Function execution time
- Success/failure rates
- Invocation count

### Alerts

Set up Cloud Monitoring alerts for:

- Function failures
- High execution times
- Quota usage

## Troubleshooting

### Common Issues

1. **Function timeout**: Increase timeout in `index.ts` if processing large orders
2. **Permission denied**: Ensure Firebase Admin SDK has proper credentials
3. **Missing data**: Check that orders have the required fields (total, items)

### Debug Logs

View detailed logs:

```bash
firebase functions:log --severity DEBUG
```

## License

MIT
