import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // إدارة المستخدمين
  users: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    updateRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["admin", "manager", "operator", "farmer"]) }))
      .mutation(async ({ input }) => {
        return await db.updateUserRole(input.userId, input.role);
      }),
  }),

  // إدارة المزارع
  farms: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserFarms(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string(), location: z.string().optional(), totalArea: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        return await db.createFarm({ ...input, ownerId: ctx.user.id });
      }),
  }),

  // إدارة الحقول
  fields: router({
    list: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFarmFields(input.farmId);
      }),
    create: protectedProcedure
      .input(z.object({ farmId: z.number(), name: z.string(), area: z.number().optional(), cropType: z.string().optional(), coordinates: z.string().optional() }))
      .mutation(async ({ input }) => {
        return await db.createField(input);
      }),
  }),

  // إدارة المعدات
  equipment: router({
    list: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFarmEquipment(input.farmId);
      }),
    create: protectedProcedure
      .input(z.object({ farmId: z.number(), name: z.string(), type: z.string(), model: z.string().optional(), manufacturer: z.string().optional(), year: z.number().optional(), purchasePrice: z.number().optional(), purchaseDate: z.date().optional() }))
      .mutation(async ({ input }) => {
        return await db.createEquipment(input);
      }),
  }),

  // إدارة خطط العمل
  workPlans: router({
    list: protectedProcedure
      .input(z.object({ fieldId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFieldWorkPlans(input.fieldId);
      }),
    create: protectedProcedure
      .input(z.object({ fieldId: z.number(), name: z.string(), cropType: z.string().optional(), season: z.string().optional(), startDate: z.date(), estimatedCost: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        return await db.createWorkPlan({ ...input, createdBy: ctx.user.id });
      }),
  }),

  // إدارة المهام
  tasks: router({
    list: protectedProcedure
      .input(z.object({ workPlanId: z.number() }))
      .query(async ({ input }) => {
        return await db.getWorkPlanTasks(input.workPlanId);
      }),
    create: protectedProcedure
      .input(z.object({ workPlanId: z.number(), name: z.string(), description: z.string().optional(), type: z.string(), scheduledDate: z.date(), assignedTo: z.number().optional(), equipmentId: z.number().optional(), estimatedDuration: z.number().optional(), priority: z.enum(["low", "medium", "high", "urgent"]).optional() }))
      .mutation(async ({ input }) => {
        return await db.createTask(input);
      }),
    updateStatus: protectedProcedure
      .input(z.object({ taskId: z.number(), status: z.string(), completedDate: z.date().optional() }))
      .mutation(async ({ input }) => {
        return await db.updateTaskStatus(input.taskId, input.status, input.completedDate);
      }),
  }),

  // إدارة التنبيهات
  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAlerts(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({ equipmentId: z.number().optional(), type: z.string(), title: z.string(), message: z.string().optional(), priority: z.enum(["low", "medium", "high", "critical"]).optional() }))
      .mutation(async ({ ctx, input }) => {
        return await db.createAlert({ ...input, userId: ctx.user.id });
      }),
    acknowledge: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.acknowledgeAlert(input.alertId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
