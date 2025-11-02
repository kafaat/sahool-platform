import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "manager", "operator", "farmer"]).default("farmer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// جداول المزارع والحقول
export const farms = mysqlTable("farms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: int("ownerId").notNull(),
  location: text("location"),
  totalArea: int("totalArea"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const fields = mysqlTable("fields", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  area: int("area"),
  cropType: varchar("cropType", { length: 100 }),
  coordinates: text("coordinates"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// جداول المعدات
export const equipment = mysqlTable("equipment", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }),
  manufacturer: varchar("manufacturer", { length: 100 }),
  year: int("year"),
  status: mysqlEnum("status", ["active", "maintenance", "idle", "retired"]).default("active").notNull(),
  purchasePrice: int("purchasePrice"),
  purchaseDate: timestamp("purchaseDate"),
  currentValue: int("currentValue"),
  totalHours: int("totalHours").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// جداول خطط العمل
export const workPlans = mysqlTable("workPlans", {
  id: int("id").autoincrement().primaryKey(),
  fieldId: int("fieldId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  cropType: varchar("cropType", { length: 100 }),
  season: varchar("season", { length: 100 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["draft", "active", "completed", "cancelled"]).default("draft").notNull(),
  estimatedCost: int("estimatedCost"),
  actualCost: int("actualCost"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  workPlanId: int("workPlanId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 100 }).notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(),
  completedDate: timestamp("completedDate"),
  status: mysqlEnum("status", ["pending", "assigned", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  assignedTo: int("assignedTo"),
  equipmentId: int("equipmentId"),
  estimatedDuration: int("estimatedDuration"),
  actualDuration: int("actualDuration"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// جداول التنبيهات
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  equipmentId: int("equipmentId"),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["active", "acknowledged", "resolved"]).default("active").notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Farm = typeof farms.$inferSelect;
export type Field = typeof fields.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type WorkPlan = typeof workPlans.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Alert = typeof alerts.$inferSelect;