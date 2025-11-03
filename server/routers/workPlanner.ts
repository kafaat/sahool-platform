import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { workPlans, tasks, droneImages, ndviAnalysis, pestDetections, waterStressAnalysis, diseaseDetections } from '../../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { withCache, farmCacheKey, invalidateFarmCache } from '../_core/redis';
import { invokeLLM } from '../_core/llm';

export const workPlannerRouter = router({
  /**
   * الحصول على خطط العمل لحقل معين
   */
  list: protectedProcedure
    .input(
      z.object({
        fieldId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const cacheKey = `field:${input.fieldId}:work-plans:${input.limit}:${input.offset}`;
      
      return await withCache(cacheKey, 300, async () => {
        const db = await getDb();
        if (!db) return [];

        const plans = await db
          .select()
          .from(workPlans)
          .where(eq(workPlans.fieldId, input.fieldId))
          .limit(input.limit)
          .offset(input.offset)
          .orderBy(desc(workPlans.createdAt));

        return plans;
      });
    }),

  /**
   * الحصول على مهام خطة عمل معينة
   */
  getTasks: protectedProcedure
    .input(z.object({ workPlanId: z.number() }))
    .query(async ({ input }) => {
      const cacheKey = `work-plan:${input.workPlanId}:tasks`;
      
      return await withCache(cacheKey, 180, async () => {
        const db = await getDb();
        if (!db) return [];

        const planTasks = await db
          .select()
          .from(tasks)
          .where(eq(tasks.workPlanId, input.workPlanId))
          .orderBy(tasks.scheduledDate);

        return planTasks;
      });
    }),

  /**
   * توليد توصيات ذكية بناءً على تحليل الطائرات
   */
  generateAIRecommendations: protectedProcedure
    .input(
      z.object({
        fieldId: z.number(),
        farmId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // 1. جمع بيانات تحليل الطائرات
      const latestDroneImages = await db
        .select()
        .from(droneImages)
        .where(
          and(
            eq(droneImages.farmId, input.farmId),
            eq(droneImages.fieldId, input.fieldId)
          )
        )
        .orderBy(desc(droneImages.createdAt))
        .limit(5);

      if (latestDroneImages.length === 0) {
        return {
          success: false,
          message: 'لا توجد صور طائرات متاحة لهذا الحقل',
          recommendations: [],
        };
      }

      // 2. جمع بيانات NDVI
      const ndviData = await db
        .select()
        .from(ndviAnalysis)
        .where(
          sql`${ndviAnalysis.imageId} IN (${sql.join(
            latestDroneImages.map((img) => sql`${img.id}`),
            sql`, `
          )})`
        );

      // 3. جمع بيانات الآفات
      const pestData = await db
        .select()
        .from(pestDetections)
        .where(
          sql`${pestDetections.imageId} IN (${sql.join(
            latestDroneImages.map((img) => sql`${img.id}`),
            sql`, `
          )})`
        );

      // 4. جمع بيانات الإجهاد المائي
      const waterStressData = await db
        .select()
        .from(waterStressAnalysis)
        .where(
          sql`${waterStressData.imageId} IN (${sql.join(
            latestDroneImages.map((img) => sql`${img.id}`),
            sql`, `
          )})`
        );

      // 5. جمع بيانات الأمراض
      const diseaseData = await db
        .select()
        .from(diseaseDetections)
        .where(
          and(
            eq(diseaseDetections.farmId, input.farmId),
            eq(diseaseDetections.fieldId, input.fieldId)
          )
        )
        .orderBy(desc(diseaseDetections.createdAt))
        .limit(5);

      // 6. تجهيز البيانات للـ LLM
      const avgNdvi = ndviData.length > 0
        ? ndviData.reduce((sum, item) => sum + Number(item.avgNdvi || 0), 0) / ndviData.length
        : 0;

      const pestCount = pestData.length;
      const highWaterStressCount = waterStressData.filter(
        (item) => item.stressLevel === 'high'
      ).length;
      const diseaseCount = diseaseData.filter(
        (item) => item.status === 'completed'
      ).length;

      // 7. استدعاء LLM للحصول على توصيات
      const prompt = `أنت خبير زراعي متخصص في تخطيط العمل الزراعي. بناءً على البيانات التالية، قدم توصيات عملية ومحددة:

**بيانات الحقل:**
- متوسط NDVI: ${avgNdvi.toFixed(2)} (0.0-1.0، حيث >0.6 جيد)
- عدد الآفات المكتشفة: ${pestCount}
- مناطق إجهاد مائي عالٍ: ${highWaterStressCount}
- أمراض مكتشفة: ${diseaseCount}

**المطلوب:**
قدم 3-5 توصيات محددة وعملية، كل توصية يجب أن تحتوي على:
1. العنوان (مختصر)
2. الوصف (تفصيلي)
3. الأولوية (high, medium, low)
4. الإطار الزمني المقترح (urgent, this_week, this_month)

**تنسيق الإجابة:**
قدم الإجابة كـ JSON array بهذا الشكل:
[
  {
    "title": "عنوان التوصية",
    "description": "وصف تفصيلي",
    "priority": "high",
    "timeframe": "urgent"
  }
]`;

      try {
        const llmResponse = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'أنت خبير زراعي متخصص. قدم توصيات عملية بتنسيق JSON فقط.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'recommendations',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  recommendations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                        timeframe: { type: 'string', enum: ['urgent', 'this_week', 'this_month'] },
                      },
                      required: ['title', 'description', 'priority', 'timeframe'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['recommendations'],
                additionalProperties: false,
              },
            },
          },
        });

        const content = llmResponse.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No response from LLM');
        }

        const parsed = JSON.parse(content);
        const recommendations = parsed.recommendations || [];

        return {
          success: true,
          message: 'تم توليد التوصيات بنجاح',
          recommendations,
          analysisData: {
            avgNdvi,
            pestCount,
            highWaterStressCount,
            diseaseCount,
          },
        };
      } catch (error: any) {
        console.error('LLM Error:', error);
        
        // Fallback: توصيات افتراضية بناءً على البيانات
        const fallbackRecommendations = [];

        if (avgNdvi < 0.4) {
          fallbackRecommendations.push({
            title: 'تحسين صحة المحاصيل',
            description: 'مؤشر NDVI منخفض يشير إلى ضعف نمو النباتات. يُنصح بفحص التربة وإضافة الأسمدة المناسبة.',
            priority: 'high',
            timeframe: 'urgent',
          });
        }

        if (pestCount > 0) {
          fallbackRecommendations.push({
            title: 'مكافحة الآفات',
            description: `تم اكتشاف ${pestCount} آفة. يجب رش المبيدات المناسبة والمراقبة المستمرة.`,
            priority: 'high',
            timeframe: 'this_week',
          });
        }

        if (highWaterStressCount > 0) {
          fallbackRecommendations.push({
            title: 'تحسين نظام الري',
            description: `${highWaterStressCount} منطقة تعاني من إجهاد مائي. يجب زيادة الري وفحص نظام الري.`,
            priority: 'high',
            timeframe: 'urgent',
          });
        }

        if (diseaseCount > 0) {
          fallbackRecommendations.push({
            title: 'معالجة الأمراض',
            description: `تم اكتشاف ${diseaseCount} مرض. اتبع التوصيات العلاجية المحددة لكل مرض.`,
            priority: 'high',
            timeframe: 'this_week',
          });
        }

        if (fallbackRecommendations.length === 0) {
          fallbackRecommendations.push({
            title: 'مراقبة دورية',
            description: 'الحقل في حالة جيدة. استمر في المراقبة الدورية والصيانة الوقائية.',
            priority: 'medium',
            timeframe: 'this_month',
          });
        }

        return {
          success: true,
          message: 'تم توليد توصيات افتراضية',
          recommendations: fallbackRecommendations,
          analysisData: {
            avgNdvi,
            pestCount,
            highWaterStressCount,
            diseaseCount,
          },
        };
      }
    }),

  /**
   * إنشاء خطة عمل من التوصيات
   */
  createFromRecommendations: protectedProcedure
    .input(
      z.object({
        fieldId: z.number(),
        recommendations: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
            priority: z.enum(['high', 'medium', 'low']),
            timeframe: z.enum(['urgent', 'this_week', 'this_month']),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // إنشاء خطة عمل
      const [workPlan] = await db.insert(workPlans).values({
        fieldId: input.fieldId,
        name: `خطة ذكية - ${new Date().toLocaleDateString('ar-SA')}`,
        status: 'active',
        startDate: new Date(),
      });

      // إنشاء مهام من التوصيات
      const tasksToCreate = input.recommendations.map((rec, index) => {
        let scheduledDate = new Date();
        
        if (rec.timeframe === 'urgent') {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        } else if (rec.timeframe === 'this_week') {
          scheduledDate.setDate(scheduledDate.getDate() + 3);
        } else {
          scheduledDate.setDate(scheduledDate.getDate() + 7);
        }

        return {
          workPlanId: workPlan.insertId,
          name: rec.title,
          description: rec.description,
          type: 'maintenance',
          scheduledDate,
          priority: rec.priority,
          status: 'pending',
        };
      });

      await db.insert(tasks).values(tasksToCreate);

      // Invalidate cache
      await invalidateFarmCache(input.fieldId);

      return {
        success: true,
        workPlanId: workPlan.insertId,
        tasksCreated: tasksToCreate.length,
      };
    }),
});
