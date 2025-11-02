import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// دوال إدارة المستخدمين
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users);
}

export async function updateUserRole(userId: number, role: "admin" | "manager" | "operator" | "farmer") {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return await db.select().from(users).where(eq(users.id, userId)).limit(1).then(r => r[0]);
}

// دوال إدارة المزارع
export async function getUserFarms(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { farms } = await import("../drizzle/schema");
  return await db.select().from(farms).where(eq(farms.ownerId, userId));
}

export async function createFarm(data: { name: string; ownerId: number; location?: string; totalArea?: number }) {
  const db = await getDb();
  if (!db) return null;
  const { farms } = await import("../drizzle/schema");
  const result = await db.insert(farms).values(data);
  const insertId = Number((result as any).insertId);
  return await db.select().from(farms).where(eq(farms.id, insertId)).limit(1).then(r => r[0]);
}

// دوال إدارة الحقول
export async function getFarmFields(farmId: number) {
  const db = await getDb();
  if (!db) return [];
  const { fields } = await import("../drizzle/schema");
  return await db.select().from(fields).where(eq(fields.farmId, farmId));
}

export async function createField(data: { farmId: number; name: string; area?: number; cropType?: string; coordinates?: string }) {
  const db = await getDb();
  if (!db) return null;
  const { fields } = await import("../drizzle/schema");
  const result = await db.insert(fields).values(data);
  const insertId = Number((result as any).insertId);
  return await db.select().from(fields).where(eq(fields.id, insertId)).limit(1).then(r => r[0]);
}

// دوال إدارة المعدات
export async function getFarmEquipment(farmId: number) {
  const db = await getDb();
  if (!db) return [];
  const { equipment } = await import("../drizzle/schema");
  return await db.select().from(equipment).where(eq(equipment.farmId, farmId));
}

export async function createEquipment(data: any) {
  const db = await getDb();
  if (!db) return null;
  const { equipment } = await import("../drizzle/schema");
  const result = await db.insert(equipment).values(data);
  const insertId = Number((result as any).insertId);
  return await db.select().from(equipment).where(eq(equipment.id, insertId)).limit(1).then(r => r[0]);
}

// دوال إدارة خطط العمل
export async function getFieldWorkPlans(fieldId: number) {
  const db = await getDb();
  if (!db) return [];
  const { workPlans } = await import("../drizzle/schema");
  return await db.select().from(workPlans).where(eq(workPlans.fieldId, fieldId));
}

export async function createWorkPlan(data: any) {
  const db = await getDb();
  if (!db) return null;
  const { workPlans } = await import("../drizzle/schema");
  const result = await db.insert(workPlans).values(data);
  const insertId = Number((result as any).insertId);
  return await db.select().from(workPlans).where(eq(workPlans.id, insertId)).limit(1).then(r => r[0]);
}

// دوال إدارة المهام
export async function getWorkPlanTasks(workPlanId: number) {
  const db = await getDb();
  if (!db) return [];
  const { tasks } = await import("../drizzle/schema");
  return await db.select().from(tasks).where(eq(tasks.workPlanId, workPlanId));
}

export async function createTask(data: any) {
  const db = await getDb();
  if (!db) return null;
  const { tasks } = await import("../drizzle/schema");
  const result = await db.insert(tasks).values(data);
  const insertId = Number((result as any).insertId);
  return await db.select().from(tasks).where(eq(tasks.id, insertId)).limit(1).then(r => r[0]);
}

export async function updateTaskStatus(taskId: number, status: string, completedDate?: Date) {
  const db = await getDb();
  if (!db) return null;
  const { tasks } = await import("../drizzle/schema");
  const updateData: any = { status };
  if (completedDate) updateData.completedDate = completedDate;
  await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));
  return await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1).then(r => r[0]);
}

// دوال إدارة التنبيهات
export async function getUserAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { alerts } = await import("../drizzle/schema");
  return await db.select().from(alerts).where(eq(alerts.userId, userId));
}

export async function createAlert(data: any) {
  const db = await getDb();
  if (!db) return null;
  const { alerts } = await import("../drizzle/schema");
  const result = await db.insert(alerts).values(data);
  const insertId = Number((result as any).insertId);
  return await db.select().from(alerts).where(eq(alerts.id, insertId)).limit(1).then(r => r[0]);
}

export async function acknowledgeAlert(alertId: number) {
  const db = await getDb();
  if (!db) return null;
  const { alerts } = await import("../drizzle/schema");
  await db.update(alerts).set({ status: "acknowledged", acknowledgedAt: new Date() }).where(eq(alerts.id, alertId));
  return await db.select().from(alerts).where(eq(alerts.id, alertId)).limit(1).then(r => r[0]);
}
