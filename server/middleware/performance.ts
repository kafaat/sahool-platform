/**
 * Performance Optimization Middleware
 * تحسينات الأداء المتقدمة
 */

import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// Memory Cache Layer
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Better performance
});

/**
 * Cache Middleware
 * Caches GET requests for specified duration
 */
export function cacheMiddleware(duration: number = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      // Return cached response
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (body: any) {
      cache.set(key, body, duration);
      return originalJson(body);
    };

    next();
  };
}

/**
 * Compression Headers
 * Add compression hints for better performance
 */
export function compressionHeaders(req: Request, res: Response, next: NextFunction) {
  // Enable compression for JSON responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Encoding', 'gzip');
  }
  
  next();
}

/**
 * ETags for Static Resources
 * Add ETags for better caching
 */
export function etagMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add ETag header for static resources
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('ETag', `"${Date.now()}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  }
  
  next();
}

/**
 * Response Time Header
 * Add X-Response-Time header for monitoring
 */
export function responseTimeMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
}

/**
 * Clear Cache Function
 * Manually clear cache for specific keys or all
 */
export function clearCache(pattern?: string) {
  if (pattern) {
    const keys = cache.keys();
    keys.forEach((key: string) => {
      if (key.includes(pattern)) {
        cache.del(key);
      }
    });
  } else {
    cache.flushAll();
  }
}

/**
 * Get Cache Stats
 * Returns cache statistics
 */
export function getCacheStats() {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize,
  };
}

export default {
  cacheMiddleware,
  compressionHeaders,
  etagMiddleware,
  responseTimeMiddleware,
  clearCache,
  getCacheStats,
};
