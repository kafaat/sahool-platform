# دليل المطورين - منصة سَهول

**الإصدار:** 2.0  
**التاريخ:** نوفمبر 2025  
**المؤلف:** Manus AI

---

## مقدمة

يهدف هذا الدليل إلى مساعدة المطورين على فهم البنية التقنية لمنصة سَهول والمساهمة في تطويرها. تعتمد المنصة على تقنيات حديثة ومعايير صناعية لضمان قابلية التوسع والصيانة.

---

## البنية التقنية (Tech Stack)

### Frontend

تعتمد واجهة المستخدم على مجموعة من التقنيات الحديثة التي توفر تجربة مستخدم سلسة وسريعة. **React 19** هو إطار العمل الأساسي الذي يوفر مكونات قابلة لإعادة الاستخدام وإدارة حالة فعالة. **TypeScript** يضمن سلامة الأنواع ويقلل من الأخطاء البرمجية. **Vite 7** يوفر بيئة تطوير سريعة مع Hot Module Replacement. **TailwindCSS 4** يوفر نظام تصميم utility-first مع إمكانيات تخصيص واسعة. **shadcn/ui** توفر مكونات UI جاهزة ومصممة بشكل احترافي. **tRPC React Query** يوفر تكامل سلس مع Backend مع Type Safety كامل. **Chart.js** و **react-chartjs-2** لإنشاء رسوم بيانية تفاعلية. **Wouter** للتوجيه (Routing) بديل خفيف لـ React Router.

### Backend

يعتمد الخادم على **Node.js 22** مع **Express 4** كإطار عمل أساسي. **tRPC 11** يوفر واجهة برمجة تطبيقات Type-Safe بدون الحاجة لـ REST. **Drizzle ORM** للتعامل مع قاعدة البيانات بطريقة Type-Safe. **Zod** للتحقق من صحة البيانات في وقت التشغيل. **Redis** للتخزين المؤقت وتحسين الأداء. **JWT** للمصادقة والجلسات.

### Database

تستخدم المنصة **MySQL/TiDB** كقاعدة بيانات رئيسية، مع **Drizzle Kit** لإدارة الهجرات (Migrations).

### DevOps

**pnpm** لإدارة الحزم بكفاءة عالية. **TypeScript Compiler** للتحقق من الأنواع. **ESLint** لفحص جودة الكود. **Git** لإدارة الإصدارات.

---

## هيكل المشروع (Project Structure)

```
sahool_ui_enhanced/
├── client/                 # Frontend (React)
│   ├── public/            # ملفات ثابتة
│   └── src/
│       ├── components/    # مكونات React قابلة لإعادة الاستخدام
│       │   ├── ui/       # مكونات shadcn/ui
│       │   └── DashboardLayout.tsx
│       ├── pages/        # صفحات التطبيق
│       │   ├── Dashboard.tsx
│       │   ├── WorkPlanner.tsx
│       │   ├── Farms.tsx
│       │   └── ...
│       ├── lib/          # مكتبات مساعدة
│       │   └── trpc.ts   # tRPC client
│       ├── contexts/     # React contexts
│       ├── hooks/        # Custom hooks
│       ├── App.tsx       # التوجيه الرئيسي
│       ├── main.tsx      # نقطة الدخول
│       └── index.css     # أنماط عامة
│
├── server/               # Backend (Node.js + Express)
│   ├── _core/           # وظائف أساسية
│   │   ├── trpc.ts      # إعداد tRPC
│   │   ├── context.ts   # سياق tRPC
│   │   ├── redis.ts     # Redis client
│   │   ├── llm.ts       # تكامل LLM
│   │   └── ...
│   ├── routers/         # tRPC routers
│   │   ├── dashboard.ts
│   │   ├── workPlanner.ts
│   │   ├── droneImages.ts
│   │   └── diseaseDetection.ts
│   ├── db.ts            # وظائف قاعدة البيانات
│   └── routers.ts       # Router رئيسي
│
├── drizzle/             # Database schema & migrations
│   └── schema.ts        # تعريف الجداول
│
├── shared/              # كود مشترك بين Frontend و Backend
│   └── const.ts
│
└── storage/             # تكامل S3
    └── index.ts
```

---

## إعداد بيئة التطوير (Development Setup)

### المتطلبات الأساسية

قبل البدء، تأكد من تثبيت **Node.js 22+** و **pnpm 10+** و **MySQL/TiDB** و **Redis** (اختياري، للتخزين المؤقت).

### خطوات التثبيت

أولاً، استنسخ المشروع:
```bash
git clone <repository-url>
cd sahool_ui_enhanced
```

ثانياً، ثبت الحزم:
```bash
pnpm install
```

ثالثاً، أنشئ ملف `.env` وأضف المتغيرات البيئية:
```env
DATABASE_URL=mysql://user:password@localhost:3306/sahool
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

رابعاً، شغّل الهجرات (Migrations):
```bash
pnpm db:push
```

خامساً، ابدأ خادم التطوير:
```bash
pnpm dev
```

سادساً، افتح المتصفح على `http://localhost:3000`.

---

## العمل مع tRPC

### إنشاء Procedure جديد

لإنشاء procedure جديد، افتح الملف المناسب في `server/routers/` أو أنشئ ملف جديد.

**مثال: إنشاء procedure للحصول على قائمة المهام**

```typescript
// server/routers/tasks.ts
import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { tasks } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const tasksRouter = router({
  list: protectedProcedure
    .input(z.object({
      workPlanId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(tasks)
        .where(eq(tasks.workPlanId, input.workPlanId));
    }),
});
```

ثم أضف الـ router إلى `server/routers.ts`:

```typescript
import { tasksRouter } from './routers/tasks';

export const appRouter = router({
  // ... routers أخرى
  tasks: tasksRouter,
});
```

### استخدام Procedure في Frontend

```typescript
// في أي مكون React
import { trpc } from '@/lib/trpc';

function TasksList({ workPlanId }: { workPlanId: number }) {
  const { data: tasks, isLoading } = trpc.tasks.list.useQuery({
    workPlanId
  });

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <ul>
      {tasks?.map(task => (
        <li key={task.id}>{task.name}</li>
      ))}
    </ul>
  );
}
```

---

## Redis Caching

### إضافة Cache لـ Procedure

استخدم `withCache` helper من `server/_core/redis.ts`:

```typescript
import { withCache, invalidateFarmCache } from '../_core/redis';

export const exampleRouter = router({
  getData: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const cacheKey = `data:${input.id}`;
      
      return await withCache(cacheKey, 300, async () => {
        // جلب البيانات من قاعدة البيانات
        const db = await getDb();
        return await db.select().from(table).where(eq(table.id, input.id));
      });
    }),

  updateData: protectedProcedure
    .input(z.object({ id: z.number(), data: z.any() }))
    .mutation(async ({ input }) => {
      // تحديث البيانات
      const db = await getDb();
      await db.update(table).set(input.data).where(eq(table.id, input.id));
      
      // إلغاء Cache
      await invalidateFarmCache(input.id);
      
      return { success: true };
    }),
});
```

### مفاتيح Cache المستخدمة

| النوع | المفتاح | TTL |
|------|---------|-----|
| User Data | `user:{userId}:*` | 5 دقائق |
| Farm Data | `farm:{farmId}:*` | 5 دقائق |
| Drone Images | `farm:{farmId}:drone-images:*` | 3 دقائق |
| Dashboard Stats | `user:{userId}:dashboard:stats` | 5 دقائق |
| Work Plans | `field:{fieldId}:work-plans:*` | 5 دقائق |

---

## تكامل AI (LLM)

### استخدام LLM في Backend

```typescript
import { invokeLLM } from '../_core/llm';

export const aiRouter = router({
  generateSuggestions: protectedProcedure
    .input(z.object({ context: z.string() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'أنت خبير زراعي متخصص.'
          },
          {
            role: 'user',
            content: input.context
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'suggestions',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' }
                    },
                    required: ['title', 'description'],
                    additionalProperties: false
                  }
                }
              },
              required: ['suggestions'],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0]?.message?.content;
      return JSON.parse(content || '{}');
    })
});
```

---

## قاعدة البيانات (Database)

### إضافة جدول جديد

أولاً، عدّل `drizzle/schema.ts`:

```typescript
export const newTable = mysqlTable('new_table', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type NewTable = typeof newTable.$inferSelect;
export type InsertNewTable = typeof newTable.$inferInsert;
```

ثانياً، شغّل الهجرة:

```bash
pnpm db:push
```

ثالثاً، أضف وظائف في `server/db.ts`:

```typescript
export async function getNewTableItems() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(newTable);
}
```

### أفضل الممارسات

**استخدم Drizzle ORM دائماً** - لا تكتب SQL يدوياً إلا للاستعلامات المعقدة جداً.

**استخدم Transactions للعمليات المترابطة**:
```typescript
await db.transaction(async (tx) => {
  await tx.insert(table1).values(data1);
  await tx.insert(table2).values(data2);
});
```

**استخدم Indexes للأعمدة المستخدمة في WHERE**:
```typescript
export const table = mysqlTable('table', {
  // ...
}, (table) => ({
  nameIdx: index('name_idx').on(table.name),
}));
```

---

## Frontend Best Practices

### مكونات React

**استخدم TypeScript دائماً**:
```typescript
interface Props {
  title: string;
  count: number;
  onAction: () => void;
}

function Component({ title, count, onAction }: Props) {
  // ...
}
```

**استخدم Custom Hooks لإعادة استخدام المنطق**:
```typescript
function useAuth() {
  const { data: user } = trpc.auth.me.useQuery();
  return { user, isAuthenticated: !!user };
}
```

**استخدم Memo للمكونات الثقيلة**:
```typescript
const ExpensiveComponent = memo(({ data }: Props) => {
  // ...
});
```

### تحسين الأداء

**استخدم Optimistic Updates**:
```typescript
const utils = trpc.useUtils();
const mutation = trpc.data.update.useMutation({
  onMutate: async (newData) => {
    await utils.data.list.cancel();
    const previous = utils.data.list.getData();
    utils.data.list.setData(undefined, (old) => [...(old || []), newData]);
    return { previous };
  },
  onError: (err, newData, context) => {
    utils.data.list.setData(undefined, context?.previous);
  },
  onSettled: () => {
    utils.data.list.invalidate();
  },
});
```

**استخدم Pagination للقوائم الطويلة**:
```typescript
const [page, setPage] = useState(0);
const limit = 20;

const { data } = trpc.data.list.useQuery({
  limit,
  offset: page * limit
});
```

---

## الاختبار (Testing)

### اختبار tRPC Procedures

استخدم **Vitest** لاختبار الـ procedures:

```typescript
import { describe, it, expect } from 'vitest';
import { appRouter } from '../server/routers';

describe('Tasks Router', () => {
  it('should return tasks list', async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    const tasks = await caller.tasks.list({ workPlanId: 1 });
    expect(tasks).toBeInstanceOf(Array);
  });
});
```

### اختبار مكونات React

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

---

## النشر (Deployment)

### بناء المشروع

```bash
pnpm build
```

سينتج عن هذا:
- `client/dist/` - ملفات Frontend الثابتة
- `server/` - كود Backend مع TypeScript مُترجم

### متغيرات البيئة الإنتاجية

تأكد من تعيين جميع المتغيرات البيئية في بيئة الإنتاج:

```env
NODE_ENV=production
DATABASE_URL=<production-db-url>
JWT_SECRET=<strong-secret>
REDIS_URL=<redis-url>
```

### أفضل الممارسات

**استخدم Process Manager** مثل PM2 لإدارة العملية.

**فعّل HTTPS** في بيئة الإنتاج.

**استخدم CDN** لملفات الـ Frontend الثابتة.

**راقب الأداء** باستخدام أدوات مثل New Relic أو DataDog.

**احتفظ بنسخ احتياطية** من قاعدة البيانات بشكل دوري.

---

## المساهمة (Contributing)

### Git Workflow

أولاً، أنشئ فرع جديد:
```bash
git checkout -b feature/new-feature
```

ثانياً، اعمل على التغييرات وأضفها:
```bash
git add .
git commit -m "feat: add new feature"
```

ثالثاً، ادفع الفرع:
```bash
git push origin feature/new-feature
```

رابعاً، أنشئ Pull Request.

### Commit Message Convention

استخدم **Conventional Commits**:

- `feat:` - ميزة جديدة
- `fix:` - إصلاح خطأ
- `docs:` - تحديث التوثيق
- `style:` - تغييرات في التنسيق
- `refactor:` - إعادة هيكلة الكود
- `test:` - إضافة اختبارات
- `chore:` - مهام صيانة

---

## الأسئلة الشائعة (FAQ)

### كيف أضيف صفحة جديدة؟

أولاً، أنشئ مكون في `client/src/pages/NewPage.tsx`. ثانياً، أضف التوجيه في `client/src/App.tsx`:
```typescript
<Route path="/new-page" component={NewPage} />
```

### كيف أضيف مكون UI جديد من shadcn/ui؟

```bash
npx shadcn-ui@latest add <component-name>
```

### كيف أحل مشكلة TypeScript errors؟

شغّل TypeScript compiler:
```bash
pnpm tsc --noEmit
```

### كيف أنظف Cache؟

```bash
pnpm clean
rm -rf node_modules
pnpm install
```

---

## الموارد المفيدة

- [tRPC Documentation](https://trpc.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**© 2025 منصة سَهول - جميع الحقوق محفوظة**
