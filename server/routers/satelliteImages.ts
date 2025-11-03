import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

const SENTINEL_HUB_SCRIPT = path.join(__dirname, '../_core/sentinelHub.py');

/**
 * Satellite Images Router
 * Provides access to Sentinel Hub satellite imagery
 */
export const satelliteImagesRouter = router({
  /**
   * Get true color (RGB) satellite image
   */
  getTrueColorImage: protectedProcedure
    .input(z.object({
      bbox: z.object({
        minLon: z.number(),
        minLat: z.number(),
        maxLon: z.number(),
        maxLat: z.number(),
      }),
      dateFrom: z.string(), // YYYY-MM-DD
      dateTo: z.string(),   // YYYY-MM-DD
      resolution: z.number().optional().default(10),
    }))
    .mutation(async ({ input }) => {
      try {
        const bbox = [input.bbox.minLon, input.bbox.minLat, input.bbox.maxLon, input.bbox.maxLat];
        const bboxStr = JSON.stringify(bbox);

        const { stdout, stderr } = await execAsync(
          `python3 ${SENTINEL_HUB_SCRIPT} true_color '${bboxStr}' ${input.dateFrom} ${input.dateTo}`,
          {
            env: {
              ...process.env,
              SENTINEL_HUB_CLIENT_ID: process.env.SENTINEL_HUB_CLIENT_ID || '',
              SENTINEL_HUB_CLIENT_SECRET: process.env.SENTINEL_HUB_CLIENT_SECRET || '',
            },
            maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large images
          }
        );

        if (stderr) {
          console.error('[Sentinel Hub] stderr:', stderr);
        }

        const result = JSON.parse(stdout);

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch satellite image');
        }

        return {
          success: true,
          imageBase64: result.image_base64,
          date: result.date,
          resolution: result.resolution,
        };
      } catch (error: any) {
        console.error('[Sentinel Hub] Error fetching true color image:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch satellite image',
        };
      }
    }),

  /**
   * Get NDVI satellite image with color mapping
   */
  getNDVIImage: protectedProcedure
    .input(z.object({
      bbox: z.object({
        minLon: z.number(),
        minLat: z.number(),
        maxLon: z.number(),
        maxLat: z.number(),
      }),
      dateFrom: z.string(),
      dateTo: z.string(),
      resolution: z.number().optional().default(10),
    }))
    .mutation(async ({ input }) => {
      try {
        const bbox = [input.bbox.minLon, input.bbox.minLat, input.bbox.maxLon, input.bbox.maxLat];
        const bboxStr = JSON.stringify(bbox);

        const { stdout, stderr } = await execAsync(
          `python3 ${SENTINEL_HUB_SCRIPT} ndvi '${bboxStr}' ${input.dateFrom} ${input.dateTo}`,
          {
            env: {
              ...process.env,
              SENTINEL_HUB_CLIENT_ID: process.env.SENTINEL_HUB_CLIENT_ID || '',
              SENTINEL_HUB_CLIENT_SECRET: process.env.SENTINEL_HUB_CLIENT_SECRET || '',
            },
            maxBuffer: 50 * 1024 * 1024,
          }
        );

        if (stderr) {
          console.error('[Sentinel Hub] stderr:', stderr);
        }

        const result = JSON.parse(stdout);

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch NDVI image');
        }

        return {
          success: true,
          imageBase64: result.image_base64,
          ndviStats: result.ndvi_stats,
          date: result.date,
          resolution: result.resolution,
        };
      } catch (error: any) {
        console.error('[Sentinel Hub] Error fetching NDVI image:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch NDVI image',
        };
      }
    }),

  /**
   * Get available satellite image dates for a given area
   */
  getAvailableDates: protectedProcedure
    .input(z.object({
      bbox: z.object({
        minLon: z.number(),
        minLat: z.number(),
        maxLon: z.number(),
        maxLat: z.number(),
      }),
      dateFrom: z.string(),
      dateTo: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const bbox = [input.bbox.minLon, input.bbox.minLat, input.bbox.maxLon, input.bbox.maxLat];
        const bboxStr = JSON.stringify(bbox);

        const { stdout, stderr } = await execAsync(
          `python3 ${SENTINEL_HUB_SCRIPT} dates '${bboxStr}' ${input.dateFrom} ${input.dateTo}`,
          {
            env: {
              ...process.env,
              SENTINEL_HUB_CLIENT_ID: process.env.SENTINEL_HUB_CLIENT_ID || '',
              SENTINEL_HUB_CLIENT_SECRET: process.env.SENTINEL_HUB_CLIENT_SECRET || '',
            },
          }
        );

        if (stderr) {
          console.error('[Sentinel Hub] stderr:', stderr);
        }

        const result = JSON.parse(stdout);

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch available dates');
        }

        return {
          success: true,
          dates: result.dates,
          count: result.count,
        };
      } catch (error: any) {
        console.error('[Sentinel Hub] Error fetching available dates:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch available dates',
          dates: [],
          count: 0,
        };
      }
    }),

  /**
   * Get field boundary from database and fetch satellite image
   */
  getFieldSatelliteImage: protectedProcedure
    .input(z.object({
      fieldId: z.number(),
      dateFrom: z.string(),
      dateTo: z.string(),
      imageType: z.enum(['true_color', 'ndvi']),
      resolution: z.number().optional().default(10),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { getDb } = await import('../db');
        const { fields } = await import('../../drizzle/schema');
        const { eq } = await import('drizzle-orm');

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Get field details
        const field = await db.select().from(fields).where(eq(fields.id, input.fieldId)).limit(1);

        if (!field || field.length === 0) {
          throw new Error('Field not found');
        }

        const fieldData = field[0];

        // Parse coordinates (assuming stored as JSON string)
        let coordinates;
        try {
          coordinates = typeof fieldData.coordinates === 'string' 
            ? JSON.parse(fieldData.coordinates) 
            : fieldData.coordinates;
        } catch (e) {
          throw new Error('Invalid field coordinates');
        }

        // Calculate bounding box from coordinates
        // Assuming coordinates is an array of [lon, lat] pairs
        const lons = coordinates.map((c: any) => c[0] || c.lon);
        const lats = coordinates.map((c: any) => c[1] || c.lat);

        const bbox = {
          minLon: Math.min(...lons),
          minLat: Math.min(...lats),
          maxLon: Math.max(...lons),
          maxLat: Math.max(...lats),
        };

        // Fetch satellite image based on type
        if (input.imageType === 'true_color') {
          const bboxArray = [bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat];
          const bboxStr = JSON.stringify(bboxArray);

          const { stdout } = await execAsync(
            `python3 ${SENTINEL_HUB_SCRIPT} true_color '${bboxStr}' ${input.dateFrom} ${input.dateTo}`,
            {
              env: {
                ...process.env,
                SENTINEL_HUB_CLIENT_ID: process.env.SENTINEL_HUB_CLIENT_ID || '',
                SENTINEL_HUB_CLIENT_SECRET: process.env.SENTINEL_HUB_CLIENT_SECRET || '',
              },
              maxBuffer: 50 * 1024 * 1024,
            }
          );

          const result = JSON.parse(stdout);

          if (!result.success) {
            throw new Error(result.error);
          }

          return {
            success: true,
            fieldName: fieldData.name,
            imageBase64: result.image_base64,
            date: result.date,
            resolution: result.resolution,
            bbox,
          };
        } else {
          // NDVI
          const bboxArray = [bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat];
          const bboxStr = JSON.stringify(bboxArray);

          const { stdout } = await execAsync(
            `python3 ${SENTINEL_HUB_SCRIPT} ndvi '${bboxStr}' ${input.dateFrom} ${input.dateTo}`,
            {
              env: {
                ...process.env,
                SENTINEL_HUB_CLIENT_ID: process.env.SENTINEL_HUB_CLIENT_ID || '',
                SENTINEL_HUB_CLIENT_SECRET: process.env.SENTINEL_HUB_CLIENT_SECRET || '',
              },
              maxBuffer: 50 * 1024 * 1024,
            }
          );

          const result = JSON.parse(stdout);

          if (!result.success) {
            throw new Error(result.error);
          }

          return {
            success: true,
            fieldName: fieldData.name,
            imageBase64: result.image_base64,
            ndviStats: result.ndvi_stats,
            date: result.date,
            resolution: result.resolution,
            bbox,
          };
        }
      } catch (error: any) {
        console.error('[Sentinel Hub] Error fetching field satellite image:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch field satellite image',
        };
      }
    }),
});
