import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

// ===== Validation Schemas =====

const farmSchema = z.object({
  name: z.string().min(1, "اسم المزرعة مطلوب").max(100, "اسم المزرعة طويل جداً"),
  location: z.string().max(200).optional(),
  totalArea: z.number().positive("المساحة يجب أن تكون موجبة").optional(),
});

const fieldSchema = z.object({
  farmId: z.number().positive(),
  name: z.string().min(1, "اسم الحقل مطلوب").max(100),
  area: z.number().positive("المساحة يجب أن تكون موجبة").optional(),
  cropType: z.string().max(50).optional(),
  coordinates: z.string().max(500).optional(),
});

const equipmentSchema = z.object({
  farmId: z.number().positive(),
  name: z.string().min(1, "اسم المعدة مطلوب").max(100),
  type: z.string().min(1, "نوع المعدة مطلوب").max(50),
  model: z.string().max(50).optional(),
  manufacturer: z.string().max(100).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  purchasePrice: z.number().nonnegative().optional(),
  purchaseDate: z.date().optional(),
});

const workPlanSchema = z.object({
  fieldId: z.number().positive(),
  name: z.string().min(1, "اسم الخطة مطلوب").max(100),
  cropType: z.string().max(50).optional(),
  season: z.string().max(20).optional(),
  startDate: z.date(),
  estimatedCost: z.number().nonnegative().optional(),
});

const taskSchema = z.object({
  workPlanId: z.number().positive(),
  name: z.string().min(1, "اسم المهمة مطلوب").max(100),
  description: z.string().max(500).optional(),
  type: z.string().min(1, "نوع المهمة مطلوب").max(50),
  scheduledDate: z.date(),
  assignedTo: z.number().positive().optional(),
  equipmentId: z.number().positive().optional(),
  estimatedDuration: z.number().positive().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

const alertSchema = z.object({
  equipmentId: z.number().positive().optional(),
  type: z.string().min(1, "نوع التنبيه مطلوب").max(50),
  title: z.string().min(1, "عنوان التنبيه مطلوب").max(200),
  message: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

// ===== Helper Functions =====

/**
 * Verify farm ownership
 */
async function verifyFarmOwnership(farmId: number, userId: number) {
  const farm = await db.getFarmById(farmId);
  if (!farm) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "المزرعة غير موجودة",
    });
  }
  if (farm.ownerId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "ليس لديك صلاحية الوصول لهذه المزرعة",
    });
  }
  return farm;
}

/**
 * Verify field ownership through farm
 */
async function verifyFieldOwnership(fieldId: number, userId: number) {
  const field = await db.getFieldById(fieldId);
  if (!field) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "الحقل غير موجود",
    });
  }
  await verifyFarmOwnership(field.farmId, userId);
  return field;
}

// ===== Main Router =====

export const appRouter = router({
  system: systemRouter,
  
  // ===== Authentication =====
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== User Management =====
  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Only admins can list users
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ليس لديك صلاحية الوصول لقائمة المستخدمين",
        });
      }
      return await db.getAllUsers();
    }),
    
    updateRole: protectedProcedure
      .input(z.object({ 
        userId: z.number().positive(), 
        role: z.enum(["admin", "manager", "operator", "farmer"]) 
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admins can update roles
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "ليس لديك صلاحية تعديل الأدوار",
          });
        }
        
        // Cannot change own role
        if (input.userId === ctx.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "لا يمكنك تعديل دورك الخاص",
          });
        }
        
        return await db.updateUserRole(input.userId, input.role);
      }),
  }),

  // ===== Farm Management =====
  farms: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await db.getUserFarms(ctx.user.id);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "فشل في جلب قائمة المزارع",
          cause: error,
        });
      }
    }),
    
    getById: protectedProcedure
      .input(z.object({ farmId: z.number().positive() }))
      .query(async ({ ctx, input }) => {
        const farm = await verifyFarmOwnership(input.farmId, ctx.user.id);
        return farm;
      }),
    
    create: protectedProcedure
      .input(farmSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await db.createFarm({ ...input, ownerId: ctx.user.id });
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في إنشاء المزرعة",
            cause: error,
          });
        }
      }),
    
    update: protectedProcedure
      .input(farmSchema.extend({ farmId: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        await verifyFarmOwnership(input.farmId, ctx.user.id);
        try {
          return await db.updateFarm(input.farmId, input);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في تحديث المزرعة",
            cause: error,
          });
        }
      }),
    
    delete: protectedProcedure
      .input(z.object({ farmId: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        await verifyFarmOwnership(input.farmId, ctx.user.id);
        try {
          return await db.deleteFarm(input.farmId);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في حذف المزرعة",
            cause: error,
          });
        }
      }),
  }),

  // ===== Field Management =====
  fields: router({
    list: protectedProcedure
      .input(z.object({ farmId: z.number().positive() }))
      .query(async ({ ctx, input }) => {
        await verifyFarmOwnership(input.farmId, ctx.user.id);
        try {
          return await db.getFarmFields(input.farmId);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في جلب قائمة الحقول",
            cause: error,
          });
        }
      }),
    
    create: protectedProcedure
      .input(fieldSchema)
      .mutation(async ({ ctx, input }) => {
        await verifyFarmOwnership(input.farmId, ctx.user.id);
        try {
          return await db.createField(input);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في إنشاء الحقل",
            cause: error,
          });
        }
      }),
    
    update: protectedProcedure
      .input(fieldSchema.extend({ fieldId: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        await verifyFieldOwnership(input.fieldId, ctx.user.id);
        try {
          return await db.updateField(input.fieldId, input);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في تحديث الحقل",
            cause: error,
          });
        }
      }),
    
    delete: protectedProcedure
      .input(z.object({ fieldId: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        await verifyFieldOwnership(input.fieldId, ctx.user.id);
        try {
          return await db.deleteField(input.fieldId);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في حذف الحقل",
            cause: error,
          });
        }
      }),
  }),

  // ===== Equipment Management =====
  equipment: router({
    list: protectedProcedure
      .input(z.object({ farmId: z.number().positive() }))
      .query(async ({ ctx, input }) => {
        await verifyFarmOwnership(input.farmId, ctx.user.id);
        try {
          return await db.getFarmEquipment(input.farmId);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في جلب قائمة المعدات",
            cause: error,
          });
        }
      }),
    
    create: protectedProcedure
      .input(equipmentSchema)
      .mutation(async ({ ctx, input }) => {
        await verifyFarmOwnership(input.farmId, ctx.user.id);
        try {
          return await db.createEquipment(input);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في إنشاء المعدة",
            cause: error,
          });
        }
      }),
    
    update: protectedProcedure
      .input(equipmentSchema.extend({ equipmentId: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        const equipment = await db.getEquipmentById(input.equipmentId);
        if (!equipment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "المعدة غير موجودة",
          });
        }
        await verifyFarmOwnership(equipment.farmId, ctx.user.id);
        try {
          return await db.updateEquipment(input.equipmentId, input);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في تحديث المعدة",
            cause: error,
          });
        }
      }),
    
    delete: protectedProcedure
      .input(z.object({ equipmentId: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        const equipment = await db.getEquipmentById(input.equipmentId);
        if (!equipment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "المعدة غير موجودة",
          });
        }
        await verifyFarmOwnership(equipment.farmId, ctx.user.id);
        try {
          return await db.deleteEquipment(input.equipmentId);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في حذف المعدة",
            cause: error,
          });
        }
      }),
  }),

  // ===== Work Plan Management =====
  workPlans: router({
    list: protectedProcedure
      .input(z.object({ fieldId: z.number().positive() }))
      .query(async ({ ctx, input }) => {
        await verifyFieldOwnership(input.fieldId, ctx.user.id);
        try {
          return await db.getFieldWorkPlans(input.fieldId);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في جلب خطط العمل",
            cause: error,
          });
        }
      }),
    
    create: protectedProcedure
      .input(workPlanSchema)
      .mutation(async ({ ctx, input }) => {
        await verifyFieldOwnership(input.fieldId, ctx.user.id);
        try {
          return await db.createWorkPlan({ ...input, createdBy: ctx.user.id });
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في إنشاء خطة العمل",
            cause: error,
          });
        }
      }),
  }),

  // ===== Task Management =====
  tasks: router({
    list: protectedProcedure
      .input(z.object({ workPlanId: z.number().positive() }))
      .query(async ({ ctx, input }) => {
        const workPlan = await db.getWorkPlanById(input.workPlanId);
        if (!workPlan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "خطة العمل غير موجودة",
          });
        }
        await verifyFieldOwnership(workPlan.fieldId, ctx.user.id);
        try {
          return await db.getWorkPlanTasks(input.workPlanId);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في جلب المهام",
            cause: error,
          });
        }
      }),
    
    create: protectedProcedure
      .input(taskSchema)
      .mutation(async ({ ctx, input }) => {
        const workPlan = await db.getWorkPlanById(input.workPlanId);
        if (!workPlan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "خطة العمل غير موجودة",
          });
        }
        await verifyFieldOwnership(workPlan.fieldId, ctx.user.id);
        try {
          return await db.createTask(input);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في إنشاء المهمة",
            cause: error,
          });
        }
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({ 
        taskId: z.number().positive(), 
        status: z.string().min(1).max(50), 
        completedDate: z.date().optional() 
      }))
      .mutation(async ({ ctx, input }) => {
        const task = await db.getTaskById(input.taskId);
        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "المهمة غير موجودة",
          });
        }
        const workPlan = await db.getWorkPlanById(task.workPlanId);
        if (!workPlan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "خطة العمل غير موجودة",
          });
        }
        await verifyFieldOwnership(workPlan.fieldId, ctx.user.id);
        try {
          return await db.updateTaskStatus(input.taskId, input.status, input.completedDate);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في تحديث حالة المهمة",
            cause: error,
          });
        }
      }),
  }),

  // ===== Alert Management =====
  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await db.getUserAlerts(ctx.user.id);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "فشل في جلب التنبيهات",
          cause: error,
        });
      }
    }),
    
    create: protectedProcedure
      .input(alertSchema)
      .mutation(async ({ ctx, input }) => {
        // Verify equipment ownership if equipmentId is provided
        if (input.equipmentId) {
          const equipment = await db.getEquipmentById(input.equipmentId);
          if (!equipment) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "المعدة غير موجودة",
            });
          }
          await verifyFarmOwnership(equipment.farmId, ctx.user.id);
        }
        try {
          return await db.createAlert({ ...input, userId: ctx.user.id });
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في إنشاء التنبيه",
            cause: error,
          });
        }
      }),
    
    acknowledge: protectedProcedure
      .input(z.object({ alertId: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        const alert = await db.getAlertById(input.alertId);
        if (!alert) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "التنبيه غير موجود",
          });
        }
        if (alert.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "ليس لديك صلاحية الوصول لهذا التنبيه",
          });
        }
        try {
          return await db.acknowledgeAlert(input.alertId);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في تأكيد التنبيه",
            cause: error,
          });
        }
      }),
    
    delete: protectedProcedure
      .input(z.object({ alertId: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        const alert = await db.getAlertById(input.alertId);
        if (!alert) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "التنبيه غير موجود",
          });
        }
        if (alert.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "ليس لديك صلاحية حذف هذا التنبيه",
          });
        }
        try {
          return await db.deleteAlert(input.alertId);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في حذف التنبيه",
            cause: error,
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
