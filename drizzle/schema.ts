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
// ========================================
// جداول نظام الاستشعار عن بعد (Remote Sensing System)
// ========================================

// جدول صور الطائرات بدون طيار
export const droneImages = mysqlTable("droneImages", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  fieldId: int("fieldId"),
  uploadedBy: int("uploadedBy").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(), // بالبايت
  fileType: varchar("fileType", { length: 50 }).notNull(),
  storagePath: varchar("storagePath", { length: 500 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 500 }),
  captureDate: timestamp("captureDate"),
  altitude: int("altitude"), // ارتفاع الطائرة (متر)
  resolution: int("resolution"), // دقة الصورة (سم/بكسل)
  gpsLatitude: varchar("gpsLatitude", { length: 50 }),
  gpsLongitude: varchar("gpsLongitude", { length: 50 }),
  status: mysqlEnum("status", ["uploaded", "processing", "completed", "failed"]).default("uploaded").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// جدول مهام المعالجة
export const processingJobs = mysqlTable("processingJobs", {
  id: int("id").autoincrement().primaryKey(),
  imageId: int("imageId").notNull(),
  jobType: mysqlEnum("jobType", [
    "ndvi",
    "segmentation",
    "object_detection",
    "area_measurement",
    "pest_detection",
    "water_stress"
  ]).notNull(),
  status: mysqlEnum("status", ["queued", "processing", "completed", "failed"]).default("queued").notNull(),
  progress: int("progress").default(0), // 0-100
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// جدول تحليلات NDVI
export const ndviAnalysis = mysqlTable("ndviAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  imageId: int("imageId").notNull(),
  farmId: int("farmId").notNull(),
  fieldId: int("fieldId"),
  avgNdvi: varchar("avgNdvi", { length: 10 }), // قيمة عشرية كـ string
  minNdvi: varchar("minNdvi", { length: 10 }),
  maxNdvi: varchar("maxNdvi", { length: 10 }),
  healthScore: int("healthScore"), // 0-100
  mapImagePath: varchar("mapImagePath", { length: 500 }),
  geoJsonPath: varchar("geoJsonPath", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// جدول مناطق NDVI
export const ndviZones = mysqlTable("ndviZones", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),
  zoneType: mysqlEnum("zoneType", [
    "very_poor",    // ضعيف جداً
    "poor",         // ضعيف
    "moderate",     // متوسط
    "good",         // جيد
    "excellent"     // ممتاز
  ]).notNull(),
  area: varchar("area", { length: 20 }), // المساحة بالهكتار
  percentage: varchar("percentage", { length: 10 }), // نسبة من المساحة الكلية
  geoJson: text("geoJson"), // حدود المنطقة (JSON)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// جدول حدود الحقول
export const fieldBoundaries = mysqlTable("fieldBoundaries", {
  id: int("id").autoincrement().primaryKey(),
  fieldId: int("fieldId").notNull(),
  imageId: int("imageId"),
  boundary: text("boundary").notNull(), // GeoJSON Polygon
  area: varchar("area", { length: 20 }).notNull(), // بالهكتار
  perimeter: varchar("perimeter", { length: 20 }), // بالمتر
  source: mysqlEnum("source", ["manual", "auto_detected", "gps"]).default("auto_detected").notNull(),
  accuracy: varchar("accuracy", { length: 10 }), // دقة الكشف (%)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// جدول كشف الآفات
export const pestDetections = mysqlTable("pestDetections", {
  id: int("id").autoincrement().primaryKey(),
  imageId: int("imageId").notNull(),
  farmId: int("farmId").notNull(),
  fieldId: int("fieldId"),
  pestType: varchar("pestType", { length: 100 }),
  severity: mysqlEnum("severity", ["low", "moderate", "high", "critical"]).notNull(),
  affectedArea: varchar("affectedArea", { length: 20 }), // بالهكتار
  confidence: varchar("confidence", { length: 10 }), // ثقة النموذج (%)
  location: text("location"), // GeoJSON Point/Polygon
  imageUrl: varchar("imageUrl", { length: 500 }), // صورة المنطقة المصابة
  recommendations: text("recommendations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// جدول إجهاد المياه
export const waterStressAnalysis = mysqlTable("waterStressAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  imageId: int("imageId").notNull(),
  farmId: int("farmId").notNull(),
  fieldId: int("fieldId"),
  avgNdwi: varchar("avgNdwi", { length: 10 }), // NDWI متوسط
  stressLevel: mysqlEnum("stressLevel", ["none", "low", "moderate", "high", "severe"]).notNull(),
  affectedArea: varchar("affectedArea", { length: 20 }), // بالهكتار
  mapImagePath: varchar("mapImagePath", { length: 500 }),
  geoJsonPath: varchar("geoJsonPath", { length: 500 }),
  recommendations: text("recommendations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// أنواع مستنتجة للاستخدام في TypeScript
export type DroneImage = typeof droneImages.$inferSelect;
export type InsertDroneImage = typeof droneImages.$inferInsert;
export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertProcessingJob = typeof processingJobs.$inferInsert;
export type NdviAnalysis = typeof ndviAnalysis.$inferSelect;
export type InsertNdviAnalysis = typeof ndviAnalysis.$inferInsert;
export type NdviZone = typeof ndviZones.$inferSelect;
export type FieldBoundary = typeof fieldBoundaries.$inferSelect;
export type PestDetection = typeof pestDetections.$inferSelect;
export type WaterStressAnalysis = typeof waterStressAnalysis.$inferSelect;
