import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { farms, fields, equipment, droneImages, diseaseDetections, ndviAnalysis, pestDetections, waterStressAnalysis } from '../../drizzle/schema';
import { eq, count, avg, sql } from 'drizzle-orm';
import { withCache, userCacheKey } from '../_core/redis';

export const dashboardRouter = router({
  /**
   * الحصول على إحصائيات Dashboard الشاملة
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const cacheKey = userCacheKey(ctx.user.id, 'dashboard:stats');
    
    return await withCache(cacheKey, 300, async () => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // 1. إحصائيات المزارع
      const userFarms = await db
        .select({
          totalFarms: count(),
          totalArea: sql<number>`SUM(${farms.totalArea})`,
        })
        .from(farms)
        .where(eq(farms.ownerId, ctx.user.id));

      const farmsStats = {
        totalFarms: userFarms[0]?.totalFarms || 0,
        totalArea: userFarms[0]?.totalArea || 0,
      };

      // 2. إحصائيات الحقول
      const userFields = await db
        .select({
          totalFields: count(),
        })
        .from(fields)
        .innerJoin(farms, eq(fields.farmId, farms.id))
        .where(eq(farms.ownerId, ctx.user.id));

      const fieldsStats = {
        totalFields: userFields[0]?.totalFields || 0,
      };

      // 3. إحصائيات المعدات
      const userEquipment = await db
        .select({
          totalEquipment: count(),
          activeEquipment: sql<number>`SUM(CASE WHEN ${equipment.status} = 'active' THEN 1 ELSE 0 END)`,
        })
        .from(equipment)
        .innerJoin(farms, eq(equipment.farmId, farms.id))
        .where(eq(farms.ownerId, ctx.user.id));

      const equipmentStats = {
        totalEquipment: userEquipment[0]?.totalEquipment || 0,
        activeEquipment: userEquipment[0]?.activeEquipment || 0,
      };

      // 4. إحصائيات Drone Analysis
      const userDroneImages = await db
        .select({
          totalImages: count(),
          processedImages: sql<number>`SUM(CASE WHEN ${droneImages.status} = 'processed' THEN 1 ELSE 0 END)`,
        })
        .from(droneImages)
        .innerJoin(farms, eq(droneImages.farmId, farms.id))
        .where(eq(farms.ownerId, ctx.user.id));

      // متوسط NDVI
      const avgNdviResult = await db
        .select({
          avgNdvi: avg(ndviAnalysis.avgNdvi),
        })
        .from(ndviAnalysis)
        .innerJoin(droneImages, eq(ndviAnalysis.imageId, droneImages.id))
        .innerJoin(farms, eq(droneImages.farmId, farms.id))
        .where(eq(farms.ownerId, ctx.user.id));

      // عدد الآفات المكتشفة
      const pestsResult = await db
        .select({
          totalPests: count(),
        })
        .from(pestDetections)
        .innerJoin(droneImages, eq(pestDetections.imageId, droneImages.id))
        .innerJoin(farms, eq(droneImages.farmId, farms.id))
        .where(eq(farms.ownerId, ctx.user.id));

      // مناطق الإجهاد المائي
      const waterStressResult = await db
        .select({
          highStressCount: sql<number>`SUM(CASE WHEN ${waterStressAnalysis.stressLevel} = 'high' THEN 1 ELSE 0 END)`,
        })
        .from(waterStressAnalysis)
        .innerJoin(droneImages, eq(waterStressAnalysis.imageId, droneImages.id))
        .innerJoin(farms, eq(droneImages.farmId, farms.id))
        .where(eq(farms.ownerId, ctx.user.id));

      const droneAnalysisStats = {
        totalImages: userDroneImages[0]?.totalImages || 0,
        processedImages: userDroneImages[0]?.processedImages || 0,
        avgNdvi: avgNdviResult[0]?.avgNdvi ? Number(avgNdviResult[0].avgNdvi) : 0,
        totalPests: pestsResult[0]?.totalPests || 0,
        highWaterStress: waterStressResult[0]?.highStressCount || 0,
      };

      // 5. إحصائيات Disease Detection
      const userDiseaseDetections = await db
        .select({
          totalDetections: count(),
          completedDetections: sql<number>`SUM(CASE WHEN ${diseaseDetections.status} = 'completed' THEN 1 ELSE 0 END)`,
        })
        .from(diseaseDetections)
        .innerJoin(farms, eq(diseaseDetections.farmId, farms.id))
        .where(eq(farms.ownerId, ctx.user.id));

      const diseaseDetectionStats = {
        totalDetections: userDiseaseDetections[0]?.totalDetections || 0,
        completedDetections: userDiseaseDetections[0]?.completedDetections || 0,
      };

      return {
        farms: farmsStats,
        fields: fieldsStats,
        equipment: equipmentStats,
        droneAnalysis: droneAnalysisStats,
        diseaseDetection: diseaseDetectionStats,
        lastUpdated: new Date(),
      };
    });
  }),

  /**
   * الحصول على بيانات الرسوم البيانية
   */
  getChartData: protectedProcedure
    .input(
      z.object({
        type: z.enum(['ndvi', 'diseases', 'productivity']),
        period: z.enum(['week', 'month', 'year']).default('month'),
      })
    )
    .query(async ({ ctx, input }) => {
      const cacheKey = userCacheKey(ctx.user.id, `dashboard:chart:${input.type}:${input.period}`);
      
      return await withCache(cacheKey, 600, async () => {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // حساب التاريخ بناءً على الفترة
        const now = new Date();
        let startDate = new Date();
        
        if (input.period === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (input.period === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        } else {
          startDate.setFullYear(now.getFullYear() - 1);
        }

        if (input.type === 'ndvi') {
          // بيانات NDVI عبر الزمن
          const ndviData = await db
            .select({
              date: sql<string>`DATE(${ndviAnalysis.createdAt})`,
              avgNdvi: avg(ndviAnalysis.avgNdvi),
            })
            .from(ndviAnalysis)
            .innerJoin(droneImages, eq(ndviAnalysis.imageId, droneImages.id))
            .innerJoin(farms, eq(droneImages.farmId, farms.id))
            .where(eq(farms.ownerId, ctx.user.id))
            .groupBy(sql`DATE(${ndviAnalysis.createdAt})`)
            .orderBy(sql`DATE(${ndviAnalysis.createdAt})`);

          return ndviData.map(item => ({
            date: item.date,
            value: item.avgNdvi ? Number(item.avgNdvi) : 0,
          }));
        } else if (input.type === 'diseases') {
          // بيانات الأمراض المكتشفة عبر الزمن
          const diseaseData = await db
            .select({
              date: sql<string>`DATE(${diseaseDetections.createdAt})`,
              count: count(),
            })
            .from(diseaseDetections)
            .innerJoin(farms, eq(diseaseDetections.farmId, farms.id))
            .where(eq(farms.ownerId, ctx.user.id))
            .groupBy(sql`DATE(${diseaseDetections.createdAt})`)
            .orderBy(sql`DATE(${diseaseDetections.createdAt})`);

          return diseaseData.map(item => ({
            date: item.date,
            value: item.count,
          }));
        } else {
          // بيانات الإنتاجية (مثال بسيط)
          return [
            { date: '2025-01-01', value: 85 },
            { date: '2025-01-15', value: 88 },
            { date: '2025-02-01', value: 90 },
            { date: '2025-02-15', value: 87 },
            { date: '2025-03-01', value: 92 },
          ];
        }
      });
    }),

  /**
   * الحصول على آخر التنبيهات
   */
  getRecentAlerts: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const cacheKey = userCacheKey(ctx.user.id, `dashboard:alerts:${input.limit}`);
      
      return await withCache(cacheKey, 60, async () => {
        const db = await getDb();
        if (!db) {
          return [];
        }

        // جمع التنبيهات من مصادر مختلفة
        const alerts: Array<{
          id: number;
          type: string;
          title: string;
          message: string;
          priority: string;
          createdAt: Date;
        }> = [];

        // تنبيهات الآفات
        const pestAlerts = await db
          .select({
            id: pestDetections.id,
            pestType: pestDetections.pestType,
            severity: pestDetections.severity,
            createdAt: pestDetections.createdAt,
          })
          .from(pestDetections)
          .innerJoin(droneImages, eq(pestDetections.imageId, droneImages.id))
          .innerJoin(farms, eq(droneImages.farmId, farms.id))
          .where(eq(farms.ownerId, ctx.user.id))
          .orderBy(sql`${pestDetections.createdAt} DESC`)
          .limit(input.limit);

        pestAlerts.forEach(alert => {
          alerts.push({
            id: alert.id,
            type: 'pest',
            title: `تم اكتشاف آفة: ${alert.pestType}`,
            message: `مستوى الخطورة: ${alert.severity}`,
            priority: alert.severity === 'high' ? 'high' : 'medium',
            createdAt: alert.createdAt,
          });
        });

        // تنبيهات الإجهاد المائي
        const waterStressAlerts = await db
          .select({
            id: waterStressAnalysis.id,
            stressLevel: waterStressAnalysis.stressLevel,
            createdAt: waterStressAnalysis.createdAt,
          })
          .from(waterStressAnalysis)
          .innerJoin(droneImages, eq(waterStressAnalysis.imageId, droneImages.id))
          .innerJoin(farms, eq(droneImages.farmId, farms.id))
          .where(eq(farms.ownerId, ctx.user.id))
          .orderBy(sql`${waterStressAnalysis.createdAt} DESC`)
          .limit(input.limit);

        waterStressAlerts.forEach(alert => {
          if (alert.stressLevel === 'high') {
            alerts.push({
              id: alert.id,
              type: 'water_stress',
              title: 'إجهاد مائي عالٍ',
              message: 'يحتاج الحقل إلى ري عاجل',
              priority: 'high',
              createdAt: alert.createdAt,
            });
          }
        });

        // ترتيب حسب التاريخ
        alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return alerts.slice(0, input.limit);
      });
    }),
});
