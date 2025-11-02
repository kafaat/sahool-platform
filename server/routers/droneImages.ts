import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { protectedProcedure, router } from '../_core/trpc';
import { droneImages, processingJobs, ndviAnalysis, pestDetections, waterStressAnalysis } from '../../drizzle/schema';
import { storagePut } from '../storage';

export const droneImagesRouter = router({
  // رفع صورة طائرة
  upload: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        fieldId: z.number().optional(),
        fileName: z.string(),
        fileData: z.string(), // base64
        captureDate: z.date().optional(),
        altitude: z.number().optional(),
        gpsLatitude: z.string().optional(),
        gpsLongitude: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // تحويل base64 إلى Buffer
        const buffer = Buffer.from(input.fileData, 'base64');

        // رفع إلى S3
        const timestamp = Date.now();
        const fileKey = `drone-images/${input.farmId}/${timestamp}-${input.fileName}`;
        const { url, key } = await storagePut(
          fileKey,
          buffer,
          input.fileName.endsWith('.tif') || input.fileName.endsWith('.tiff')
            ? 'image/tiff'
            : 'image/jpeg'
        );

        // حفظ في قاعدة البيانات
        const db = await ctx.db;
        if (!db) {
          throw new Error('Database not available');
        }

        const [image] = await db
          .insert(droneImages)
          .values({
            farmId: input.farmId,
            fieldId: input.fieldId,
            uploadedBy: ctx.user.id,
            fileName: input.fileName,
            fileSize: buffer.length,
            fileType: input.fileName.endsWith('.tif') || input.fileName.endsWith('.tiff')
              ? 'image/tiff'
              : 'image/jpeg',
            storagePath: key,
            storageUrl: url,
            captureDate: input.captureDate,
            altitude: input.altitude,
            gpsLatitude: input.gpsLatitude,
            gpsLongitude: input.gpsLongitude,
            status: 'uploaded',
          })
          .$returningId();

        // إنشاء مهام معالجة
        await db.insert(processingJobs).values([
          {
            imageId: image.id,
            jobType: 'ndvi',
            status: 'queued',
          },
          {
            imageId: image.id,
            jobType: 'segmentation',
            status: 'queued',
          },
          {
            imageId: image.id,
            jobType: 'object_detection',
            status: 'queued',
          },
        ]);

        // TODO: بدء المعالجة في الخلفية
        // processImageInBackground(image.id, url);

        return {
          imageId: image.id,
          status: 'processing' as const,
          message: 'تم رفع الصورة بنجاح، جاري المعالجة...',
        };
      } catch (error: any) {
        console.error('Upload error:', error);
        throw new Error(`فشل رفع الصورة: ${error.message}`);
      }
    }),

  // الحصول على قائمة الصور
  list: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        fieldId: z.number().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await ctx.db;
      if (!db) {
        return [];
      }

      const conditions = [eq(droneImages.farmId, input.farmId)];
      if (input.fieldId) {
        conditions.push(eq(droneImages.fieldId, input.fieldId));
      }

      const images = await db
        .select()
        .from(droneImages)
        .where(conditions.length > 1 ? conditions[0] : conditions[0])
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(droneImages.createdAt);

      return images;
    }),

  // الحصول على حالة المعالجة
  getProcessingStatus: protectedProcedure
    .input(
      z.object({
        imageId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await ctx.db;
      if (!db) {
        return [];
      }

      const jobs = await db
        .select()
        .from(processingJobs)
        .where(eq(processingJobs.imageId, input.imageId));

      return jobs;
    }),

  // الحصول على نتائج التحليل
  getAnalysisResults: protectedProcedure
    .input(
      z.object({
        imageId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await ctx.db;
      if (!db) {
        return {
          ndvi: null,
          pests: [],
          waterStress: null,
        };
      }

      const [ndvi] = await db
        .select()
        .from(ndviAnalysis)
        .where(eq(ndviAnalysis.imageId, input.imageId))
        .limit(1);

      const pests = await db
        .select()
        .from(pestDetections)
        .where(eq(pestDetections.imageId, input.imageId));

      const [waterStress] = await db
        .select()
        .from(waterStressAnalysis)
        .where(eq(waterStressAnalysis.imageId, input.imageId))
        .limit(1);

      return {
        ndvi: ndvi || null,
        pests,
        waterStress: waterStress || null,
      };
    }),

  // محاكاة معالجة الصورة (للتجربة)
  simulateProcessing: protectedProcedure
    .input(
      z.object({
        imageId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.db;
      if (!db) {
        throw new Error('Database not available');
      }

      // الحصول على الصورة
      const [image] = await db
        .select()
        .from(droneImages)
        .where(eq(droneImages.id, input.imageId))
        .limit(1);

      if (!image) {
        throw new Error('الصورة غير موجودة');
      }

      // تحديث حالة الصورة إلى "processing"
      await db
        .update(droneImages)
        .set({ status: 'processing' })
        .where(eq(droneImages.id, input.imageId));

      // تحديث حالة المهام إلى "processing"
      await db
        .update(processingJobs)
        .set({ status: 'processing', startedAt: new Date(), progress: 10 })
        .where(eq(processingJobs.imageId, input.imageId));

      // محاكاة المعالجة (في الخلفية)
      setTimeout(async () => {
        try {
          // إنشاء نتائج NDVI تجريبية
          const avgNdvi = (Math.random() * 0.4 + 0.4).toFixed(3); // 0.4-0.8
          const minNdvi = (parseFloat(avgNdvi) - 0.2).toFixed(3);
          const maxNdvi = (parseFloat(avgNdvi) + 0.2).toFixed(3);
          const healthScore = Math.round(parseFloat(avgNdvi) * 100);

          await db.insert(ndviAnalysis).values({
            imageId: input.imageId,
            farmId: image.farmId,
            fieldId: image.fieldId,
            avgNdvi,
            minNdvi,
            maxNdvi,
            healthScore,
          });

          // إنشاء كشف آفات تجريبي (احتمال 30%)
          if (Math.random() < 0.3) {
            const severities = ['low', 'moderate', 'high'] as const;
            const pestTypes = [
              'حشرات المن',
              'الذبابة البيضاء',
              'دودة ورق القطن',
              'العنكبوت الأحمر',
            ];

            await db.insert(pestDetections).values({
              imageId: input.imageId,
              farmId: image.farmId,
              fieldId: image.fieldId,
              pestType: pestTypes[Math.floor(Math.random() * pestTypes.length)],
              severity: severities[Math.floor(Math.random() * severities.length)],
              affectedArea: (Math.random() * 5 + 0.5).toFixed(2),
              confidence: (Math.random() * 20 + 75).toFixed(1),
              recommendations: 'يُنصح بمراقبة المنطقة المصابة واستخدام المبيدات المناسبة إذا لزم الأمر.',
            });
          }

          // إنشاء تحليل إجهاد مائي تجريبي (احتمال 40%)
          if (Math.random() < 0.4) {
            const stressLevels = ['none', 'low', 'moderate', 'high'] as const;
            const stressLevel = stressLevels[Math.floor(Math.random() * stressLevels.length)];

            await db.insert(waterStressAnalysis).values({
              imageId: input.imageId,
              farmId: image.farmId,
              fieldId: image.fieldId,
              avgNdwi: (Math.random() * 0.4 - 0.2).toFixed(3),
              stressLevel,
              affectedArea: stressLevel === 'none' ? '0' : (Math.random() * 3 + 0.5).toFixed(2),
              recommendations:
                stressLevel === 'high' || stressLevel === 'moderate'
                  ? 'يُنصح بزيادة كمية الري في المناطق المتأثرة.'
                  : 'مستوى الري مناسب.',
            });
          }

          // تحديث حالة المهام إلى "completed"
          await db
            .update(processingJobs)
            .set({ status: 'completed', completedAt: new Date(), progress: 100 })
            .where(eq(processingJobs.imageId, input.imageId));

          // تحديث حالة الصورة إلى "completed"
          await db
            .update(droneImages)
            .set({ status: 'completed' })
            .where(eq(droneImages.id, input.imageId));
        } catch (error) {
          console.error('Simulation error:', error);

          // تحديث حالة المهام إلى "failed"
          await db
            .update(processingJobs)
            .set({
              status: 'failed',
              errorMessage: 'فشلت المعالجة التجريبية',
              completedAt: new Date(),
            })
            .where(eq(processingJobs.imageId, input.imageId));

          // تحديث حالة الصورة إلى "failed"
          await db
            .update(droneImages)
            .set({ status: 'failed' })
            .where(eq(droneImages.id, input.imageId));
        }
      }, 5000); // 5 ثواني

      return {
        success: true,
        message: 'بدأت المعالجة التجريبية، ستكتمل خلال 5 ثواني...',
      };
    }),

  // حذف صورة
  delete: protectedProcedure
    .input(
      z.object({
        imageId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.db;
      if (!db) {
        throw new Error('Database not available');
      }

      // TODO: حذف الصورة من S3
      // await storageDelete(image.storagePath);

      // حذف من قاعدة البيانات
      await db.delete(droneImages).where(eq(droneImages.id, input.imageId));

      return { success: true };
    }),
});
