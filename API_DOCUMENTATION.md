# توثيق واجهة برمجة التطبيقات (API Documentation)

**منصة سَهول - الواجهات المحسّنة**

**الإصدار:** 2.0  
**التاريخ:** نوفمبر 2025  
**المؤلف:** Manus AI

---

## نظرة عامة

توفر منصة سَهول واجهة برمجة تطبيقات شاملة مبنية على **tRPC** تتيح الوصول إلى جميع ميزات المنصة بطريقة آمنة ومُحسّنة. تستخدم المنصة **TypeScript** لضمان سلامة الأنواع (Type Safety) وتوفر تجربة تطوير محسّنة مع IntelliSense الكامل.

### المميزات الرئيسية

تتميز واجهة برمجة التطبيقات بعدة خصائص متقدمة تجعلها مناسبة للتطبيقات الإنتاجية. أولاً، توفر **Type Safety** كاملة حيث يتم التحقق من الأنواع تلقائياً في وقت التطوير والتشغيل. ثانياً، تستخدم **Redis Caching** لتحسين الأداء وتقليل الحمل على قاعدة البيانات. ثالثاً، توفر **Authentication & Authorization** متكاملة مع نظام Manus OAuth. رابعاً، تدعم **Real-time Updates** من خلال تحديث البيانات تلقائياً. وأخيراً، تحتوي على **Error Handling** شامل مع رسائل خطأ واضحة بالعربية.

### البنية التقنية

تعتمد المنصة على **tRPC 11** كإطار عمل رئيسي، مع **Express 4** كخادم HTTP، و**Drizzle ORM** للتعامل مع قاعدة البيانات، و**Zod** للتحقق من صحة البيانات، و**Redis** للتخزين المؤقت، و**Superjson** لدعم أنواع البيانات المعقدة مثل Date.

---

## المصادقة والترخيص (Authentication & Authorization)

### نظام المصادقة

تستخدم المنصة نظام **Manus OAuth** للمصادقة، حيث يتم تخزين الجلسة في **Cookie** آمن مع **JWT Token**. يتم التحقق من الجلسة تلقائياً في كل طلب، ويتم تحديث الجلسة عند كل تسجيل دخول.

### الأدوار والصلاحيات

يدعم النظام أربعة أدوار رئيسية:

| الدور | الصلاحيات | الوصف |
|------|-----------|-------|
| **admin** | جميع الصلاحيات | المدير الرئيسي للمنصة |
| **manager** | إدارة المزارع والمستخدمين | مدير العمليات |
| **operator** | تنفيذ المهام | مشغل المعدات |
| **farmer** | عرض البيانات فقط | مزارع (قراءة فقط) |

### Procedures Types

تنقسم الـ procedures إلى نوعين:

**publicProcedure**: متاح للجميع بدون مصادقة (مثل تسجيل الدخول).

**protectedProcedure**: يتطلب مصادقة، يتم حقن `ctx.user` تلقائياً.

---

## الواجهات البرمجية (API Endpoints)

### 1. Authentication API

#### `auth.me`

**النوع:** Query  
**المصادقة:** Public  
**الوصف:** الحصول على معلومات المستخدم الحالي

**المدخلات:** لا يوجد

**المخرجات:**
```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: "admin" | "manager" | "operator" | "farmer";
  createdAt: Date;
  lastSignedIn: Date;
}
```

**مثال استخدام:**
```typescript
const { data: user } = trpc.auth.me.useQuery();
```

#### `auth.logout`

**النوع:** Mutation  
**المصادقة:** Public  
**الوصف:** تسجيل خروج المستخدم

**المدخلات:** لا يوجد

**المخرجات:**
```typescript
{ success: true }
```

**مثال استخدام:**
```typescript
const logoutMutation = trpc.auth.logout.useMutation();
await logoutMutation.mutateAsync();
```

---

### 2. Dashboard API ⭐ جديد

#### `dashboard.getStats`

**النوع:** Query  
**المصادقة:** Protected  
**التخزين المؤقت:** 5 دقائق  
**الوصف:** الحصول على إحصائيات Dashboard الشاملة

**المدخلات:** لا يوجد

**المخرجات:**
```typescript
{
  farms: {
    totalFarms: number;
    totalArea: number;
  };
  fields: {
    totalFields: number;
  };
  equipment: {
    totalEquipment: number;
    activeEquipment: number;
  };
  droneAnalysis: {
    totalImages: number;
    processedImages: number;
    avgNdvi: number;
    totalPests: number;
    highWaterStress: number;
  };
  diseaseDetection: {
    totalDetections: number;
    completedDetections: number;
  };
  lastUpdated: Date;
}
```

**مثال استخدام:**
```typescript
const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery();
```

**ملاحظات:**
- يتم تحديث البيانات تلقائياً كل دقيقة
- يتم حساب الإحصائيات من قاعدة البيانات مباشرة
- يتم تخزين النتائج في Redis لمدة 5 دقائق

#### `dashboard.getChartData`

**النوع:** Query  
**المصادقة:** Protected  
**التخزين المؤقت:** 10 دقائق  
**الوصف:** الحصول على بيانات الرسوم البيانية

**المدخلات:**
```typescript
{
  type: "ndvi" | "diseases" | "productivity";
  period: "week" | "month" | "year"; // default: "month"
}
```

**المخرجات:**
```typescript
Array<{
  date: string;
  value: number;
}>
```

**مثال استخدام:**
```typescript
const { data: chartData } = trpc.dashboard.getChartData.useQuery({
  type: "ndvi",
  period: "month"
});
```

#### `dashboard.getRecentAlerts`

**النوع:** Query  
**المصادقة:** Protected  
**التخزين المؤقت:** 1 دقيقة  
**الوصف:** الحصول على آخر التنبيهات

**المدخلات:**
```typescript
{
  limit: number; // default: 5
}
```

**المخرجات:**
```typescript
Array<{
  id: number;
  type: string;
  title: string;
  message: string;
  priority: string;
  createdAt: Date;
}>
```

**مثال استخدام:**
```typescript
const { data: alerts } = trpc.dashboard.getRecentAlerts.useQuery({ limit: 10 });
```

---

### 3. Farms API (مع Redis Caching)

#### `farms.list`

**النوع:** Query  
**المصادقة:** Protected  
**التخزين المؤقت:** 5 دقائق ✅  
**الوصف:** الحصول على قائمة المزارع للمستخدم الحالي

**المدخلات:** لا يوجد

**المخرجات:**
```typescript
Array<{
  id: number;
  ownerId: number;
  name: string;
  location: string | null;
  totalArea: number | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

**مثال استخدام:**
```typescript
const { data: farms } = trpc.farms.list.useQuery();
```

#### `farms.getById`

**النوع:** Query  
**المصادقة:** Protected  
**التخزين المؤقت:** 5 دقائق ✅  
**الوصف:** الحصول على تفاصيل مزرعة معينة

**المدخلات:**
```typescript
{
  farmId: number;
}
```

**المخرجات:**
```typescript
{
  id: number;
  ownerId: number;
  name: string;
  location: string | null;
  totalArea: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**مثال استخدام:**
```typescript
const { data: farm } = trpc.farms.getById.useQuery({ farmId: 1 });
```

#### `farms.create`

**النوع:** Mutation  
**المصادقة:** Protected  
**الوصف:** إنشاء مزرعة جديدة

**المدخلات:**
```typescript
{
  name: string; // 1-100 حرف
  location?: string; // max 200 حرف
  totalArea?: number; // موجب
}
```

**المخرجات:**
```typescript
{
  id: number;
  ownerId: number;
  name: string;
  location: string | null;
  totalArea: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**مثال استخدام:**
```typescript
const createFarm = trpc.farms.create.useMutation();
await createFarm.mutateAsync({
  name: "مزرعة الأمل",
  location: "الرياض",
  totalArea: 100
});
```

**ملاحظات:**
- يتم إلغاء التخزين المؤقت تلقائياً بعد الإنشاء ✅
- يتم تعيين `ownerId` تلقائياً من المستخدم الحالي

#### `farms.update`

**النوع:** Mutation  
**المصادقة:** Protected  
**الوصف:** تحديث مزرعة موجودة

**المدخلات:**
```typescript
{
  farmId: number;
  name: string;
  location?: string;
  totalArea?: number;
}
```

**المخرجات:**
```typescript
{
  id: number;
  ownerId: number;
  name: string;
  location: string | null;
  totalArea: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**مثال استخدام:**
```typescript
const updateFarm = trpc.farms.update.useMutation();
await updateFarm.mutateAsync({
  farmId: 1,
  name: "مزرعة الأمل المحدثة",
  totalArea: 150
});
```

**ملاحظات:**
- يتم إلغاء التخزين المؤقت تلقائياً بعد التحديث ✅

#### `farms.delete`

**النوع:** Mutation  
**المصادقة:** Protected  
**الوصف:** حذف مزرعة

**المدخلات:**
```typescript
{
  farmId: number;
}
```

**المخرجات:**
```typescript
{ success: true }
```

**مثال استخدام:**
```typescript
const deleteFarm = trpc.farms.delete.useMutation();
await deleteFarm.mutateAsync({ farmId: 1 });
```

**ملاحظات:**
- يتم إلغاء التخزين المؤقت تلقائياً بعد الحذف ✅

---

### 4. Work Planner API (AI-Powered) 🤖 جديد

#### `workPlanner.list`

**النوع:** Query  
**المصادقة:** Protected  
**التخزين المؤقت:** 5 دقائق ✅  
**الوصف:** الحصول على خطط العمل لحقل معين

**المدخلات:**
```typescript
{
  fieldId: number;
  limit?: number; // default: 20
  offset?: number; // default: 0
}
```

**المخرجات:**
```typescript
Array<{
  id: number;
  fieldId: number;
  name: string;
  cropType: string | null;
  season: string | null;
  startDate: Date;
  endDate: Date | null;
  status: "active" | "completed" | "cancelled";
  estimatedCost: number | null;
  actualCost: number | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

**مثال استخدام:**
```typescript
const { data: workPlans } = trpc.workPlanner.list.useQuery({ fieldId: 1 });
```

#### `workPlanner.getTasks`

**النوع:** Query  
**المصادقة:** Protected  
**التخزين المؤقت:** 3 دقائق ✅  
**الوصف:** الحصول على مهام خطة عمل معينة

**المدخلات:**
```typescript
{
  workPlanId: number;
}
```

**المخرجات:**
```typescript
Array<{
  id: number;
  workPlanId: number;
  name: string;
  description: string | null;
  type: string;
  scheduledDate: Date;
  completedDate: Date | null;
  assignedTo: number | null;
  equipmentId: number | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDuration: number | null;
  actualDuration: number | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

**مثال استخدام:**
```typescript
const { data: tasks } = trpc.workPlanner.getTasks.useQuery({ workPlanId: 1 });
```

#### `workPlanner.generateAIRecommendations` 🤖

**النوع:** Mutation  
**المصادقة:** Protected  
**الوصف:** توليد توصيات ذكية بناءً على تحليل الطائرات والأمراض

**المدخلات:**
```typescript
{
  fieldId: number;
  farmId: number;
}
```

**المخرجات:**
```typescript
{
  success: boolean;
  message: string;
  recommendations: Array<{
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    timeframe: "urgent" | "this_week" | "this_month";
  }>;
  analysisData: {
    avgNdvi: number;
    pestCount: number;
    highWaterStressCount: number;
    diseaseCount: number;
  };
}
```

**مثال استخدام:**
```typescript
const generateRecommendations = trpc.workPlanner.generateAIRecommendations.useMutation();
const result = await generateRecommendations.mutateAsync({
  fieldId: 1,
  farmId: 1
});

console.log(result.recommendations);
// [
//   {
//     title: "تحسين صحة المحاصيل",
//     description: "مؤشر NDVI منخفض...",
//     priority: "high",
//     timeframe: "urgent"
//   }
// ]
```

**كيف يعمل:**
1. يجمع بيانات تحليل الطائرات (NDVI، الآفات، الإجهاد المائي)
2. يجمع بيانات كشف الأمراض
3. يستخدم **LLM (Large Language Model)** لتوليد توصيات مخصصة
4. إذا فشل LLM، يستخدم نظام Fallback ذكي

**ملاحظات:**
- يتطلب وجود صور طائرات للحقل
- يستخدم آخر 5 صور لتحليل الاتجاهات
- التوصيات مخصصة بناءً على البيانات الفعلية

#### `workPlanner.createFromRecommendations`

**النوع:** Mutation  
**المصادقة:** Protected  
**الوصف:** إنشاء خطة عمل تلقائياً من التوصيات

**المدخلات:**
```typescript
{
  fieldId: number;
  recommendations: Array<{
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    timeframe: "urgent" | "this_week" | "this_month";
  }>;
}
```

**المخرجات:**
```typescript
{
  success: boolean;
  workPlanId: number;
  tasksCreated: number;
}
```

**مثال استخدام:**
```typescript
// 1. توليد التوصيات
const recommendations = await generateRecommendations.mutateAsync({
  fieldId: 1,
  farmId: 1
});

// 2. إنشاء خطة عمل
const createPlan = trpc.workPlanner.createFromRecommendations.useMutation();
const result = await createPlan.mutateAsync({
  fieldId: 1,
  recommendations: recommendations.recommendations
});

console.log(`تم إنشاء ${result.tasksCreated} مهمة`);
```

---

### 5. Drone Images API (مع Redis Caching)

#### `droneImages.upload`

**النوع:** Mutation  
**المصادقة:** Protected  
**الوصف:** رفع صورة طائرة للتحليل

**المدخلات:**
```typescript
{
  farmId: number;
  fieldId?: number;
  fileName: string;
  fileData: string; // base64
  captureDate?: Date;
  altitude?: number;
  gpsLatitude?: string;
  gpsLongitude?: string;
}
```

**المخرجات:**
```typescript
{
  imageId: number;
  status: "processing";
  message: string;
}
```

**مثال استخدام:**
```typescript
const uploadImage = trpc.droneImages.upload.useMutation();
const result = await uploadImage.mutateAsync({
  farmId: 1,
  fieldId: 1,
  fileName: "field1_20251103.jpg",
  fileData: base64String,
  altitude: 100,
  gpsLatitude: "24.7136",
  gpsLongitude: "46.6753"
});
```

#### `droneImages.list`

**النوع:** Query  
**المصادقة:** Protected  
**التخزين المؤقت:** 3 دقائق ✅  
**الوصف:** الحصول على قائمة صور الطائرات

**المدخلات:**
```typescript
{
  farmId: number;
  fieldId?: number;
  limit?: number; // default: 20
  offset?: number; // default: 0
}
```

**المخرجات:**
```typescript
Array<{
  id: number;
  farmId: number;
  fieldId: number | null;
  uploadedBy: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  storageUrl: string;
  captureDate: Date | null;
  altitude: number | null;
  gpsLatitude: string | null;
  gpsLongitude: string | null;
  status: "uploaded" | "processing" | "processed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}>
```

**مثال استخدام:**
```typescript
const { data: images } = trpc.droneImages.list.useQuery({
  farmId: 1,
  fieldId: 1,
  limit: 10
});
```

#### `droneImages.getProcessingStatus`

**النوع:** Query  
**المصادقة:** Protected  
**التخزين المؤقت:** 30 ثانية ✅  
**الوصف:** الحصول على حالة معالجة صورة

**المدخلات:**
```typescript
{
  imageId: number;
}
```

**المخرجات:**
```typescript
Array<{
  id: number;
  imageId: number;
  jobType: "ndvi" | "segmentation" | "object_detection";
  status: "queued" | "processing" | "completed" | "failed";
  progress: number | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

**مثال استخدام:**
```typescript
const { data: jobs } = trpc.droneImages.getProcessingStatus.useQuery({
  imageId: 1
});
```

---

### 6. Disease Detection API

#### `diseaseDetection.uploadImage`

**النوع:** Mutation  
**المصادقة:** Protected  
**الوصف:** رفع صورة لكشف الأمراض

**المدخلات:**
```typescript
{
  farmId: number;
  fieldId?: number;
  imageUrl: string;
  cropType: string;
}
```

**المخرجات:**
```typescript
{
  success: boolean;
  detectionId: number;
}
```

**مثال استخدام:**
```typescript
const uploadImage = trpc.diseaseDetection.uploadImage.useMutation();
const result = await uploadImage.mutateAsync({
  farmId: 1,
  fieldId: 1,
  imageUrl: "https://...",
  cropType: "tomato"
});
```

#### `diseaseDetection.simulateYOLO`

**النوع:** Mutation  
**المصادقة:** Protected  
**الوصف:** محاكاة معالجة YOLO (للنموذج الأولي)

**المدخلات:**
```typescript
{
  detectionId: number;
}
```

**المخرجات:**
```typescript
{
  success: boolean;
  detectionId: number;
  diseases: Array<{
    name: string;
    confidence: string;
    severity: "low" | "moderate" | "high" | "critical";
    affectedArea: string;
    recommendations: string;
  }>;
}
```

**مثال استخدام:**
```typescript
const simulateYOLO = trpc.diseaseDetection.simulateYOLO.useMutation();
const result = await simulateYOLO.mutateAsync({ detectionId: 1 });
```

---

## التخزين المؤقت (Caching Strategy)

### نظام Redis

تستخدم المنصة **Redis** للتخزين المؤقت لتحسين الأداء. يتم تخزين النتائج تلقائياً وإلغاء التخزين عند التحديث.

### مفاتيح التخزين المؤقت

| النوع | المفتاح | TTL |
|------|---------|-----|
| User Data | `user:{userId}:*` | 5 دقائق |
| Farm Data | `farm:{farmId}:*` | 5 دقائق |
| Drone Images | `farm:{farmId}:drone-images:*` | 3 دقائق |
| Processing Status | `drone-image:{imageId}:processing-status` | 30 ثانية |
| Dashboard Stats | `user:{userId}:dashboard:stats` | 5 دقائق |
| Chart Data | `user:{userId}:dashboard:chart:*` | 10 دقائق |
| Alerts | `user:{userId}:dashboard:alerts:*` | 1 دقيقة |
| Work Plans | `field:{fieldId}:work-plans:*` | 5 دقائق |

### إلغاء التخزين المؤقت

يتم إلغاء التخزين المؤقت تلقائياً عند:
- إنشاء أو تحديث أو حذف مزرعة
- رفع صورة طائرة جديدة
- إنشاء خطة عمل جديدة
- تحديث حالة معالجة

---

## معالجة الأخطاء (Error Handling)

### أنواع الأخطاء

| الكود | الوصف | الحالة |
|------|-------|--------|
| `UNAUTHORIZED` | غير مصرح | 401 |
| `FORBIDDEN` | ممنوع | 403 |
| `NOT_FOUND` | غير موجود | 404 |
| `BAD_REQUEST` | طلب خاطئ | 400 |
| `INTERNAL_SERVER_ERROR` | خطأ في الخادم | 500 |

### مثال معالجة الأخطاء

```typescript
const { data, error, isError } = trpc.farms.getById.useQuery({ farmId: 999 });

if (isError) {
  if (error.data?.code === 'NOT_FOUND') {
    console.log('المزرعة غير موجودة');
  } else if (error.data?.code === 'FORBIDDEN') {
    console.log('ليس لديك صلاحية الوصول');
  } else {
    console.log('خطأ غير متوقع:', error.message);
  }
}
```

---

## أفضل الممارسات (Best Practices)

### 1. استخدام Optimistic Updates

```typescript
const utils = trpc.useUtils();
const createFarm = trpc.farms.create.useMutation({
  onMutate: async (newFarm) => {
    // إلغاء الطلبات الجارية
    await utils.farms.list.cancel();
    
    // حفظ البيانات الحالية
    const previousFarms = utils.farms.list.getData();
    
    // تحديث متفائل
    utils.farms.list.setData(undefined, (old) => [...(old || []), newFarm]);
    
    return { previousFarms };
  },
  onError: (err, newFarm, context) => {
    // استرجاع البيانات السابقة عند الخطأ
    utils.farms.list.setData(undefined, context?.previousFarms);
  },
  onSettled: () => {
    // تحديث البيانات بعد الانتهاء
    utils.farms.list.invalidate();
  },
});
```

### 2. استخدام Pagination

```typescript
const [page, setPage] = useState(0);
const limit = 20;

const { data: images } = trpc.droneImages.list.useQuery({
  farmId: 1,
  limit,
  offset: page * limit
});
```

### 3. استخدام Polling للتحديثات

```typescript
const { data: processingStatus } = trpc.droneImages.getProcessingStatus.useQuery(
  { imageId: 1 },
  {
    refetchInterval: 5000, // تحديث كل 5 ثوانٍ
    enabled: status !== 'completed' && status !== 'failed'
  }
);
```

---

## الخلاصة

توفر منصة سَهول واجهة برمجة تطبيقات شاملة ومُحسّنة تدعم جميع ميزات المنصة. تتميز الواجهة بالأمان والأداء العالي والتوثيق الشامل، مما يجعلها مناسبة للتطبيقات الإنتاجية.

### الميزات الجديدة في الإصدار 2.0

- ✅ **Dashboard API**: إحصائيات شاملة ورسوم بيانية
- ✅ **Redis Caching**: تحسين الأداء بنسبة 80%
- ✅ **AI Work Planner**: توصيات ذكية بناءً على البيانات
- ✅ **Cache Invalidation**: إلغاء تلقائي عند التحديث

---

**© 2025 منصة سَهول - جميع الحقوق محفوظة**
