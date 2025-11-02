# Performance Optimization Guide - Sahool Platform

This document outlines performance optimizations implemented and recommended for the Sahool Platform.

---

## Table of Contents

1. [Frontend Performance](#frontend-performance)
2. [Backend Performance](#backend-performance)
3. [Database Performance](#database-performance)
4. [Network Performance](#network-performance)
5. [Caching Strategies](#caching-strategies)
6. [Monitoring & Metrics](#monitoring--metrics)

---

## Frontend Performance

### React Optimizations

#### 1. Code Splitting

```typescript
// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Farms = lazy(() => import('./pages/Farms'));

// Use Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

#### 2. Memoization

```typescript
// Memoize expensive computations
const totalArea = useMemo(() => {
  return farms.reduce((sum, farm) => sum + (farm.totalArea || 0), 0);
}, [farms]);

// Memoize callbacks
const handleFarmClick = useCallback((farmId: number) => {
  navigate(`/farms/${farmId}`);
}, [navigate]);

// Memoize components
const FarmCard = memo(({ farm }: { farm: Farm }) => {
  return <div>...</div>;
});
```

#### 3. Virtual Scrolling

```typescript
// For long lists, use react-window or react-virtualized
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={farms.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <FarmCard farm={farms[index]} />
    </div>
  )}
</FixedSizeList>
```

#### 4. Image Optimization

```typescript
// Use WebP format with fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Farm" loading="lazy" />
</picture>

// Lazy load images
<img src="farm.jpg" loading="lazy" alt="Farm" />

// Use appropriate sizes
<img 
  srcSet="farm-320w.jpg 320w, farm-640w.jpg 640w, farm-1280w.jpg 1280w"
  sizes="(max-width: 320px) 280px, (max-width: 640px) 600px, 1200px"
  src="farm-640w.jpg"
  alt="Farm"
/>
```

#### 5. Bundle Size Optimization

```bash
# Analyze bundle size
pnpm build
pnpm analyze

# Tree shaking - import only what you need
import { Button } from '@/components/ui/button'; // ✅ Good
import * as Components from '@/components/ui'; // ❌ Bad

# Remove unused dependencies
pnpm prune
```

### Metrics to Monitor

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

---

## Backend Performance

### 1. Efficient Database Queries

```typescript
// ✅ Good: Select only needed fields
const farms = await db
  .select({
    id: farms.id,
    name: farms.name,
    totalArea: farms.totalArea,
  })
  .from(farms)
  .where(eq(farms.ownerId, userId));

// ❌ Bad: Select all fields
const farms = await db.select().from(farms);
```

### 2. Batch Operations

```typescript
// ✅ Good: Batch insert
await db.insert(farms).values([
  { name: 'Farm 1', ownerId: 1 },
  { name: 'Farm 2', ownerId: 1 },
  { name: 'Farm 3', ownerId: 1 },
]);

// ❌ Bad: Multiple inserts
for (const farm of farms) {
  await db.insert(farms).values(farm);
}
```

### 3. Async/Await Optimization

```typescript
// ✅ Good: Parallel execution
const [farms, equipment, alerts] = await Promise.all([
  getFarms(userId),
  getEquipment(userId),
  getAlerts(userId),
]);

// ❌ Bad: Sequential execution
const farms = await getFarms(userId);
const equipment = await getEquipment(userId);
const alerts = await getAlerts(userId);
```

### 4. Pagination

```typescript
// Implement cursor-based pagination
const getFarms = async (userId: number, cursor?: number, limit = 20) => {
  const query = db
    .select()
    .from(farms)
    .where(eq(farms.ownerId, userId))
    .limit(limit);
  
  if (cursor) {
    query.where(gt(farms.id, cursor));
  }
  
  return await query;
};
```

### 5. Response Compression

```typescript
import compression from 'compression';

app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses > 1KB
}));
```

---

## Database Performance

### 1. Indexes

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_farms_owner_id ON farms(owner_id);
CREATE INDEX idx_equipment_farm_id ON equipment(farm_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_tasks_work_plan_id ON tasks(work_plan_id);

-- Composite indexes for common queries
CREATE INDEX idx_farms_owner_created ON farms(owner_id, created_at DESC);
CREATE INDEX idx_alerts_user_status ON alerts(user_id, status);
```

### 2. Query Optimization

```typescript
// ✅ Good: Use indexes
const farms = await db
  .select()
  .from(farms)
  .where(eq(farms.ownerId, userId)) // Uses idx_farms_owner_id
  .orderBy(desc(farms.createdAt));

// ❌ Bad: Full table scan
const farms = await db
  .select()
  .from(farms)
  .where(sql`LOWER(name) LIKE '%farm%'`); // No index
```

### 3. Connection Pooling

```typescript
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10, // Max connections
  queueLimit: 0,
  waitForConnections: true,
});

const db = drizzle(pool);
```

### 4. Avoid N+1 Queries

```typescript
// ✅ Good: Single query with join
const farmsWithFields = await db
  .select()
  .from(farms)
  .leftJoin(fields, eq(fields.farmId, farms.id))
  .where(eq(farms.ownerId, userId));

// ❌ Bad: N+1 queries
const farms = await db.select().from(farms).where(eq(farms.ownerId, userId));
for (const farm of farms) {
  farm.fields = await db.select().from(fields).where(eq(fields.farmId, farm.id));
}
```

### 5. Database Monitoring

```sql
-- Check slow queries
SHOW FULL PROCESSLIST;

-- Analyze query performance
EXPLAIN SELECT * FROM farms WHERE owner_id = 1;

-- Check index usage
SHOW INDEX FROM farms;
```

---

## Network Performance

### 1. HTTP/2

```typescript
// Enable HTTP/2 in production
import http2 from 'http2';

const server = http2.createSecureServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt'),
}, app);
```

### 2. CDN for Static Assets

```typescript
// Serve static assets from CDN
const CDN_URL = 'https://cdn.sahool.com';

<img src={`${CDN_URL}/images/logo.png`} alt="Logo" />
<link rel="stylesheet" href={`${CDN_URL}/styles/main.css`} />
```

### 3. Resource Hints

```html
<!-- Preconnect to external domains -->
<link rel="preconnect" href="https://api.sahool.com" />
<link rel="dns-prefetch" href="https://cdn.sahool.com" />

<!-- Preload critical resources -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin />

<!-- Prefetch next page -->
<link rel="prefetch" href="/farms" />
```

### 4. API Response Optimization

```typescript
// Use tRPC batching
const [farms, equipment] = await Promise.all([
  trpc.farms.list.query(),
  trpc.equipment.list.query({ farmId: 1 }),
]);

// Enable response compression
app.use(compression());

// Set cache headers
app.use((req, res, next) => {
  if (req.url.startsWith('/static/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});
```

---

## Caching Strategies

### 1. Client-Side Caching

```typescript
// React Query caching
const { data: farms } = useQuery({
  queryKey: ['farms'],
  queryFn: () => trpc.farms.list.query(),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// LocalStorage caching
const cachedData = localStorage.getItem('farms');
if (cachedData) {
  const { data, timestamp } = JSON.parse(cachedData);
  if (Date.now() - timestamp < 5 * 60 * 1000) {
    return data; // Use cached data
  }
}
```

### 2. Server-Side Caching

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check for expired keys every 60s
});

// Cache database queries
const getFarms = async (userId: number) => {
  const cacheKey = `farms:${userId}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const farms = await db.select().from(farms).where(eq(farms.ownerId, userId));
  cache.set(cacheKey, farms);
  
  return farms;
};

// Invalidate cache on mutations
const createFarm = async (data: any) => {
  const farm = await db.insert(farms).values(data);
  cache.del(`farms:${data.ownerId}`); // Invalidate cache
  return farm;
};
```

### 3. Redis Caching

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
});

// Cache with Redis
const getFarms = async (userId: number) => {
  const cacheKey = `farms:${userId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const farms = await db.select().from(farms).where(eq(farms.ownerId, userId));
  await redis.setex(cacheKey, 300, JSON.stringify(farms)); // 5 minutes TTL
  
  return farms;
};
```

### 4. HTTP Caching

```typescript
// Set cache headers
app.get('/api/farms', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.setHeader('ETag', generateETag(data));
  
  // Check If-None-Match header
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // Not Modified
  }
  
  res.json(farms);
});
```

---

## Monitoring & Metrics

### 1. Performance Monitoring

```typescript
// Track API response times
const startTime = Date.now();
const result = await someOperation();
const duration = Date.now() - startTime;

console.log(`Operation took ${duration}ms`);

// Send to monitoring service
analytics.track('api_call', {
  endpoint: '/farms',
  duration,
  status: 'success',
});
```

### 2. Error Tracking

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions
});

// Capture errors
try {
  await someOperation();
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### 3. Real User Monitoring (RUM)

```typescript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 4. Database Monitoring

```sql
-- Monitor slow queries
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2; -- Log queries > 2 seconds

-- Monitor connection pool
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';
```

---

## Performance Checklist

### Frontend

- [ ] Enable code splitting
- [ ] Implement lazy loading
- [ ] Optimize images (WebP, lazy loading)
- [ ] Minimize bundle size
- [ ] Use React.memo for expensive components
- [ ] Implement virtual scrolling for long lists
- [ ] Enable service worker for offline support
- [ ] Optimize fonts (subset, preload)
- [ ] Minimize CSS (remove unused styles)
- [ ] Use CDN for static assets

### Backend

- [ ] Implement response compression
- [ ] Enable HTTP/2
- [ ] Use connection pooling
- [ ] Implement caching (Redis)
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Implement pagination
- [ ] Use batch operations
- [ ] Enable query logging
- [ ] Monitor slow queries

### Deployment

- [ ] Enable CDN
- [ ] Configure caching headers
- [ ] Enable gzip/brotli compression
- [ ] Use HTTP/2
- [ ] Implement rate limiting
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure auto-scaling
- [ ] Optimize Docker images
- [ ] Use production build
- [ ] Enable database replication

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| **Page Load Time** | < 2s | TBD |
| **API Response Time** | < 200ms | TBD |
| **Database Query Time** | < 50ms | TBD |
| **Time to Interactive** | < 3.8s | TBD |
| **First Contentful Paint** | < 1.8s | TBD |
| **Lighthouse Score** | > 90 | TBD |

---

**Last Updated**: November 3, 2025  
**Version**: 1.0
