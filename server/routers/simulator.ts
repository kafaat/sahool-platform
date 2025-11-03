import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';

/**
 * Comprehensive Simulator Router
 * محاكي شامل لاختبار جميع ميزات المنصة
 */

// حالة المحاكاة (في الذاكرة)
let simulatorState = {
  isRunning: false,
  settings: {
    farmCount: 5,
    fieldPerFarm: 3,
    equipmentPerFarm: 4,
    droneImageInterval: 60000, // 1 minute
    satelliteImageInterval: 300000, // 5 minutes
    diseaseDetectionInterval: 120000, // 2 minutes
    autoGenerate: false,
  },
  stats: {
    farmsGenerated: 0,
    fieldsGenerated: 0,
    equipmentGenerated: 0,
    droneImagesGenerated: 0,
    satelliteImagesGenerated: 0,
    diseaseDetectionsGenerated: 0,
  },
  lastRun: null as Date | null,
};

// أسماء عشوائية للمزارع
const farmNames = [
  'مزرعة الأمل', 'مزرعة النخيل', 'مزرعة الربيع', 'مزرعة الخير',
  'مزرعة البركة', 'مزرعة الفجر', 'مزرعة الوادي', 'مزرعة الصحراء',
  'مزرعة الجنوب', 'مزرعة الشمال', 'مزرعة الوسطى', 'مزرعة الشرق',
];

// أنواع المحاصيل
const cropTypes = ['قمح', 'ذرة', 'طماطم', 'بطاطس', 'خيار', 'فلفل', 'باذنجان'];

// أنواع المعدات
const equipmentTypes = ['جرار', 'حصادة', 'رشاش', 'محراث', 'بذارة', 'مضخة'];

// أنواع الأمراض
const diseaseTypes = [
  'تعفن الجذور',
  'البياض الدقيقي',
  'الصدأ',
  'اللفحة المتأخرة',
  'التبقع البني',
  'الذبول الفيوزاريومي',
];

// دالة مساعدة لتوليد رقم عشوائي
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// دالة مساعدة لتوليد رقم عشري عشوائي
function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// دالة مساعدة لاختيار عنصر عشوائي من مصفوفة
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export const simulatorRouter = router({
  /**
   * الحصول على حالة المحاكاة
   */
  getStatus: protectedProcedure.query(() => {
    return {
      isRunning: simulatorState.isRunning,
      settings: simulatorState.settings,
      stats: simulatorState.stats,
      lastRun: simulatorState.lastRun,
    };
  }),

  /**
   * تحديث إعدادات المحاكاة
   */
  updateSettings: protectedProcedure
    .input(z.object({
      farmCount: z.number().min(1).max(20).optional(),
      fieldPerFarm: z.number().min(1).max(10).optional(),
      equipmentPerFarm: z.number().min(1).max(10).optional(),
      droneImageInterval: z.number().min(10000).optional(),
      satelliteImageInterval: z.number().min(60000).optional(),
      diseaseDetectionInterval: z.number().min(30000).optional(),
      autoGenerate: z.boolean().optional(),
    }))
    .mutation(({ input }) => {
      simulatorState.settings = {
        ...simulatorState.settings,
        ...input,
      };

      return {
        success: true,
        settings: simulatorState.settings,
      };
    }),

  /**
   * توليد بيانات المزارع
   */
  generateFarmData: protectedProcedure
    .input(z.object({
      count: z.number().min(1).max(20).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { getDb } = await import('../db');
        const { farms, fields, equipment } = await import('../../drizzle/schema');

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        const count = input.count || simulatorState.settings.farmCount;
        const generatedFarms = [];
        const generatedFields = [];
        const generatedEquipment = [];

        for (let i = 0; i < count; i++) {
          // إنشاء مزرعة
          const farmName = `${randomChoice(farmNames)} ${randomInt(1, 100)}`;
          const farmResult = await db.insert(farms).values({
            ownerId: ctx.user.id,
            name: farmName,
            location: `الرياض - ${randomChoice(['الشمال', 'الجنوب', 'الشرق', 'الغرب'])}`,
            totalArea: randomFloat(50, 500, 1),
          });

          const farmId = Number(farmResult[0].insertId);
          generatedFarms.push({ id: farmId, name: farmName });
          simulatorState.stats.farmsGenerated++;

          // إنشاء حقول للمزرعة
          const fieldCount = simulatorState.settings.fieldPerFarm;
          for (let j = 0; j < fieldCount; j++) {
            const cropType = randomChoice(cropTypes);
            const fieldResult = await db.insert(fields).values({
              farmId,
              name: `حقل ${cropType} ${j + 1}`,
              area: randomFloat(5, 50, 1),
              cropType,
              coordinates: JSON.stringify([
                [randomFloat(46.5, 46.9, 4), randomFloat(24.5, 24.9, 4)],
                [randomFloat(46.5, 46.9, 4), randomFloat(24.5, 24.9, 4)],
                [randomFloat(46.5, 46.9, 4), randomFloat(24.5, 24.9, 4)],
                [randomFloat(46.5, 46.9, 4), randomFloat(24.5, 24.9, 4)],
              ]),
            });

            const fieldId = Number(fieldResult[0].insertId);
            generatedFields.push({ id: fieldId, name: `حقل ${cropType} ${j + 1}` });
            simulatorState.stats.fieldsGenerated++;
          }

          // إنشاء معدات للمزرعة
          const equipmentCount = simulatorState.settings.equipmentPerFarm;
          for (let k = 0; k < equipmentCount; k++) {
            const equipmentType = randomChoice(equipmentTypes);
            const equipmentResult = await db.insert(equipment).values({
              farmId,
              name: `${equipmentType} ${k + 1}`,
              type: equipmentType,
              status: randomChoice(['active', 'maintenance', 'inactive']),
              purchaseDate: new Date(Date.now() - randomInt(0, 365 * 3) * 24 * 60 * 60 * 1000),
              lastMaintenanceDate: new Date(Date.now() - randomInt(0, 90) * 24 * 60 * 60 * 1000),
            });

            const equipmentId = Number(equipmentResult[0].insertId);
            generatedEquipment.push({ id: equipmentId, name: `${equipmentType} ${k + 1}` });
            simulatorState.stats.equipmentGenerated++;
          }
        }

        simulatorState.lastRun = new Date();

        return {
          success: true,
          generated: {
            farms: generatedFarms,
            fields: generatedFields,
            equipment: generatedEquipment,
          },
          stats: simulatorState.stats,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل توليد بيانات المزارع: ' + error.message,
        });
      }
    }),

  /**
   * توليد صور الطائرات
   */
  generateDroneImages: protectedProcedure
    .input(z.object({
      farmId: z.number().optional(),
      count: z.number().min(1).max(50).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { getDb } = await import('../db');
        const { droneImages, farms } = await import('../../drizzle/schema');

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // الحصول على مزارع المستخدم
        const { eq } = await import('drizzle-orm');
        let userFarms;
        
        if (input.farmId) {
          userFarms = await db.select().from(farms).where(eq(farms.id, input.farmId)).limit(1);
        } else {
          userFarms = await db.select().from(farms).where(eq(farms.ownerId, ctx.user.id));
        }

        if (!userFarms || userFarms.length === 0) {
          throw new Error('لا توجد مزارع متاحة');
        }

        const count = input.count || 5;
        const generatedImages = [];

        for (let i = 0; i < count; i++) {
          const farm = randomChoice(userFarms);
          
          const imageResult = await db.insert(droneImages).values({
            farmId: farm.id,
            imageUrl: `/simulator/drone_${Date.now()}_${i}.jpg`,
            captureDate: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000),
            processingStatus: randomChoice(['pending', 'processing', 'completed']),
            ndviValue: randomFloat(0.2, 0.9, 2),
            pestCount: randomInt(0, 15),
            waterStressLevel: randomChoice(['low', 'medium', 'high']),
          });

          const imageId = Number(imageResult[0].insertId);
          generatedImages.push({
            id: imageId,
            farmId: farm.id,
            farmName: farm.name,
          });
          simulatorState.stats.droneImagesGenerated++;
        }

        simulatorState.lastRun = new Date();

        return {
          success: true,
          generated: generatedImages,
          stats: simulatorState.stats,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل توليد صور الطائرات: ' + error.message,
        });
      }
    }),

  /**
   * توليد كشف الأمراض
   */
  generateDiseaseDetections: protectedProcedure
    .input(z.object({
      farmId: z.number().optional(),
      count: z.number().min(1).max(50).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { getDb } = await import('../db');
        const { diseaseDetections, farms } = await import('../../drizzle/schema');

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // الحصول على مزارع المستخدم
        const { eq } = await import('drizzle-orm');
        let userFarms;
        
        if (input.farmId) {
          userFarms = await db.select().from(farms).where(eq(farms.id, input.farmId)).limit(1);
        } else {
          userFarms = await db.select().from(farms).where(eq(farms.ownerId, ctx.user.id));
        }

        if (!userFarms || userFarms.length === 0) {
          throw new Error('لا توجد مزارع متاحة');
        }

        const count = input.count || 5;
        const generatedDetections = [];

        for (let i = 0; i < count; i++) {
          const farm = randomChoice(userFarms);
          const diseaseType = randomChoice(diseaseTypes);
          
          const detectionResult = await db.insert(diseaseDetections).values({
            farmId: farm.id,
            imageUrl: `/simulator/disease_${Date.now()}_${i}.jpg`,
            cropType: randomChoice(cropTypes),
            diseaseType,
            confidence: randomFloat(0.7, 0.99, 2),
            severity: randomChoice(['low', 'medium', 'high']),
            detectionDate: new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000),
            status: randomChoice(['pending', 'confirmed', 'treated']),
          });

          const detectionId = Number(detectionResult[0].insertId);
          generatedDetections.push({
            id: detectionId,
            farmId: farm.id,
            farmName: farm.name,
            diseaseType,
          });
          simulatorState.stats.diseaseDetectionsGenerated++;
        }

        simulatorState.lastRun = new Date();

        return {
          success: true,
          generated: generatedDetections,
          stats: simulatorState.stats,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل توليد كشف الأمراض: ' + error.message,
        });
      }
    }),

  /**
   * توليد صور فضائية وهمية (Sentinel Hub Mock)
   */
  generateSatelliteImages: protectedProcedure
    .input(z.object({
      count: z.number().min(1).max(10).optional(),
    }))
    .mutation(({ input }) => {
      const count = input.count || 3;
      const generatedImages = [];

      for (let i = 0; i < count; i++) {
        // توليد صورة NDVI وهمية (base64)
        const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        generatedImages.push({
          id: Date.now() + i,
          imageBase64: mockImageBase64,
          ndviStats: {
            mean: randomFloat(0.4, 0.8, 2),
            min: randomFloat(0.1, 0.4, 2),
            max: randomFloat(0.8, 0.95, 2),
          },
          date: new Date(Date.now() - randomInt(0, 14) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          resolution: 10,
        });
        
        simulatorState.stats.satelliteImagesGenerated++;
      }

      simulatorState.lastRun = new Date();

      return {
        success: true,
        generated: generatedImages,
        stats: simulatorState.stats,
      };
    }),

  /**
   * توليد كل شيء دفعة واحدة
   */
  generateAll: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // توليد بيانات المزارع
      const farmDataResult = await simulatorRouter.createCaller({ user: ctx.user, req: ctx.req, res: ctx.res })
        .generateFarmData({ count: simulatorState.settings.farmCount });

      // توليد صور الطائرات
      const droneImagesResult = await simulatorRouter.createCaller({ user: ctx.user, req: ctx.req, res: ctx.res })
        .generateDroneImages({ count: 10 });

      // توليد كشف الأمراض
      const diseaseDetectionsResult = await simulatorRouter.createCaller({ user: ctx.user, req: ctx.req, res: ctx.res })
        .generateDiseaseDetections({ count: 5 });

      // توليد صور فضائية
      const satelliteImagesResult = await simulatorRouter.createCaller({ user: ctx.user, req: ctx.req, res: ctx.res })
        .generateSatelliteImages({ count: 3 });

      return {
        success: true,
        results: {
          farmData: farmDataResult,
          droneImages: droneImagesResult,
          diseaseDetections: diseaseDetectionsResult,
          satelliteImages: satelliteImagesResult,
        },
        stats: simulatorState.stats,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'فشل توليد البيانات: ' + error.message,
      });
    }
  }),

  /**
   * تشغيل المحاكاة التلقائية
   */
  start: protectedProcedure.mutation(() => {
    simulatorState.isRunning = true;
    simulatorState.lastRun = new Date();

    return {
      success: true,
      message: 'تم تشغيل المحاكاة التلقائية',
      isRunning: simulatorState.isRunning,
    };
  }),

  /**
   * إيقاف المحاكاة التلقائية
   */
  stop: protectedProcedure.mutation(() => {
    simulatorState.isRunning = false;

    return {
      success: true,
      message: 'تم إيقاف المحاكاة التلقائية',
      isRunning: simulatorState.isRunning,
    };
  }),

  /**
   * إعادة تعيين الإحصائيات
   */
  reset: protectedProcedure.mutation(() => {
    simulatorState.stats = {
      farmsGenerated: 0,
      fieldsGenerated: 0,
      equipmentGenerated: 0,
      droneImagesGenerated: 0,
      satelliteImagesGenerated: 0,
      diseaseDetectionsGenerated: 0,
    };
    simulatorState.lastRun = null;

    return {
      success: true,
      message: 'تم إعادة تعيين الإحصائيات',
      stats: simulatorState.stats,
    };
  }),
});
