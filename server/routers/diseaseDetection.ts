import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { diseaseDetections, detectedDiseases, diseaseDatabase } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export const diseaseDetectionRouter = router({
  // رفع صورة للتحليل
  uploadImage: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        fieldId: z.number().optional(),
        imageUrl: z.string(),
        cropType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // إنشاء سجل اكتشاف جديد
      const [detection] = await db.insert(diseaseDetections).values({
        farmId: input.farmId,
        fieldId: input.fieldId,
        imageUrl: input.imageUrl,
        cropType: input.cropType,
        status: 'pending',
      });

      return {
        success: true,
        detectionId: detection.insertId,
      };
    }),

  // محاكاة معالجة YOLO (للنموذج الأولي)
  simulateYOLO: protectedProcedure
    .input(z.object({ detectionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // تحديث حالة المعالجة
      await db
        .update(diseaseDetections)
        .set({ status: 'processing' })
        .where(eq(diseaseDetections.id, input.detectionId));

      // محاكاة التأخير (معالجة YOLO)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // قائمة الأمراض المحتملة للمحاكاة
      const possibleDiseases = [
        {
          name: 'Tomato Early Blight',
          confidence: '92.5',
          severity: 'moderate' as const,
          affectedArea: '0.15',
          recommendations:
            'استخدم مبيد فطري نحاسي. قم بإزالة الأوراق المصابة. تجنب الري من الأعلى.',
        },
        {
          name: 'Tomato Late Blight',
          confidence: '88.3',
          severity: 'high' as const,
          affectedArea: '0.25',
          recommendations:
            'رش بمبيد فطري جهازي فوراً. احرق النباتات المصابة بشدة. حسّن تهوية الحقل.',
        },
        {
          name: 'Tomato Leaf Mold',
          confidence: '85.7',
          severity: 'moderate' as const,
          affectedArea: '0.12',
          recommendations:
            'قلل الرطوبة. حسّن التهوية. استخدم مبيد فطري وقائي.',
        },
        {
          name: 'Tomato Septoria Leaf Spot',
          confidence: '90.1',
          severity: 'moderate' as const,
          affectedArea: '0.18',
          recommendations:
            'أزل الأوراق السفلية المصابة. استخدم مبيد فطري. تجنب الري بالرش.',
        },
      ];

      // اختيار عشوائي لـ 1-3 أمراض
      const numDiseases = Math.floor(Math.random() * 3) + 1;
      const selectedDiseases = possibleDiseases
        .sort(() => Math.random() - 0.5)
        .slice(0, numDiseases);

      // إدراج الأمراض المكتشفة
      for (const disease of selectedDiseases) {
        await db.insert(detectedDiseases).values({
          detectionId: input.detectionId,
          diseaseName: disease.name,
          confidence: disease.confidence,
          severity: disease.severity,
          bboxX: Math.floor(Math.random() * 200),
          bboxY: Math.floor(Math.random() * 200),
          bboxWidth: Math.floor(Math.random() * 150) + 100,
          bboxHeight: Math.floor(Math.random() * 150) + 100,
          affectedArea: disease.affectedArea,
          recommendations: disease.recommendations,
        });
      }

      // تحديث حالة الاكتشاف
      await db
        .update(diseaseDetections)
        .set({
          status: 'completed',
          processedAt: new Date(),
        })
        .where(eq(diseaseDetections.id, input.detectionId));

      return {
        success: true,
        diseasesFound: selectedDiseases.length,
      };
    }),

  // الحصول على نتائج التحليل
  getResults: protectedProcedure
    .input(z.object({ detectionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // جلب معلومات الاكتشاف
      const [detection] = await db
        .select()
        .from(diseaseDetections)
        .where(eq(diseaseDetections.id, input.detectionId))
        .limit(1);

      if (!detection) {
        throw new Error('Detection not found');
      }

      // جلب الأمراض المكتشفة
      const diseases = await db
        .select()
        .from(detectedDiseases)
        .where(eq(detectedDiseases.detectionId, input.detectionId));

      return {
        detection,
        diseases,
      };
    }),

  // الحصول على سجل الاكتشافات
  getHistory: protectedProcedure
    .input(
      z.object({
        farmId: z.number().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db.select().from(diseaseDetections);

      if (input.farmId) {
        query = query.where(eq(diseaseDetections.farmId, input.farmId)) as any;
      }

      const detections = await query
        .orderBy(desc(diseaseDetections.createdAt))
        .limit(input.limit);

      return detections;
    }),

  // الحصول على معلومات مرض من قاعدة البيانات
  getDiseaseInfo: protectedProcedure
    .input(z.object({ diseaseName: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [disease] = await db
        .select()
        .from(diseaseDatabase)
        .where(eq(diseaseDatabase.name, input.diseaseName))
        .limit(1);

      return disease || null;
    }),

  // الحصول على جميع الأمراض في قاعدة البيانات
  getAllDiseases: protectedProcedure
    .input(
      z.object({
        cropType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db.select().from(diseaseDatabase);

      if (input.cropType) {
        query = query.where(eq(diseaseDatabase.cropType, input.cropType)) as any;
      }

      const diseases = await query.orderBy(diseaseDatabase.name);

      return diseases;
    }),

  // إحصائيات الأمراض
  getStatistics: protectedProcedure
    .input(z.object({ farmId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // جلب جميع الاكتشافات
      let detectionsQuery = db.select().from(diseaseDetections);

      if (input.farmId) {
        detectionsQuery = detectionsQuery.where(
          eq(diseaseDetections.farmId, input.farmId)
        ) as any;
      }

      const detections = await detectionsQuery;

      // جلب جميع الأمراض المكتشفة
      const allDiseases = await db
        .select()
        .from(detectedDiseases)
        .where(
          eq(
            detectedDiseases.detectionId,
            detections.length > 0 ? detections[0].id : 0
          )
        );

      // حساب الإحصائيات
      const totalDetections = detections.length;
      const completedDetections = detections.filter(
        (d) => d.status === 'completed'
      ).length;
      const totalDiseases = allDiseases.length;

      // أكثر الأمراض شيوعاً
      const diseaseCount: Record<string, number> = {};
      allDiseases.forEach((d) => {
        diseaseCount[d.diseaseName] = (diseaseCount[d.diseaseName] || 0) + 1;
      });

      const mostCommon = Object.entries(diseaseCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      return {
        totalDetections,
        completedDetections,
        totalDiseases,
        mostCommonDiseases: mostCommon,
      };
    }),
});
