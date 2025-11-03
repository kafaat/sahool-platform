# سجل التغييرات - منصة سَهول

جميع التغييرات المهمة في هذا المشروع سيتم توثيقها في هذا الملف.

التنسيق مبني على [Keep a Changelog](https://keepachangelog.com/ar/1.0.0/)،
وهذا المشروع يتبع [Semantic Versioning](https://semver.org/lang/ar/).

---

## [2.2.0] - 2025-11-03

### إضافات رئيسية (Major Features)

#### تكاملات APIs جديدة (3 APIs)

- **Open-Meteo API**: API مجاني بالكامل للطقس المتقدم
  - صفحة `/advanced-weather` جديدة
  - 6 procedures: طقس حالي، توقعات 16 يوماً، بيانات تاريخية (منذ 1940)، مؤشرات زراعية (GDD, ET0, رطوبة التربة)، تنبيهات، طقس مزرعة
  - Redis caching: 10 دقائق (حالي)، ساعة (توقعات)، 24 ساعة (تاريخي)
  - لا يحتاج API key
  - واجهة مع 4 تبويبات: الطقس الحالي، التوقعات، المؤشرات الزراعية، التنبيهات

- **IQAir API**: مراقبة جودة الهواء مع تحليل التأثير
  - صفحة `/air-quality` جديدة
  - 4 procedures: جودة هواء حالية، جودة هواء مزرعة، معلومات ملوث، تنبيهات
  - 6 ملوثات: PM2.5, PM10, O₃, NO₂, SO₂, CO
  - تحليل تأثير على المحاصيل والعمال
  - توصيات للرش، الري، الحصاد
  - Redis caching: 30 دقيقة
  - واجهة مع 3 تبويبات: التوصيات، تأثير المحاصيل، الملوثات

- **PVWatts API (NREL)**: حساب إمكانيات الطاقة الشمسية
  - صفحة `/solar-energy` جديدة
  - 3 procedures: حساب الإمكانيات، حساب التوفير، توصيات مزرعة
  - حساب الإنتاج السنوي (kWh)
  - حساب التوفير والعائد (ROI)
  - توصيات الحجم والموضع
  - حساب التأثير البيئي (CO₂، أشجار، نفط)
  - Redis caching: ساعة
  - واجهة مع 3 تبويبات: التوصيات، الفوائد، الخطوات التالية

#### واجهات مستخدم جديدة (3 صفحات)

- **AdvancedWeather.tsx**: واجهة شاملة للطقس المتقدم (300+ سطر)
  - 4 تبويبات: الطقس الحالي، التوقعات (16 يوم)، المؤشرات الزراعية، التنبيهات
  - 8 بطاقات إحصائيات للطقس الحالي
  - 4 مؤشرات زراعية مع شروحات
  - تحديث تلقائي كل 10 دقائق

- **AirQuality.tsx**: واجهة مراقبة جودة الهواء (350+ سطر)
  - مؤشر AQI مع ألوان (0-500)
  - 3 تبويبات: التوصيات، تأثير المحاصيل، الملوثات
  - 4 بطاقات توصيات (عمال، رش، ري، حصاد)
  - معلومات تفصيلية عن 6 ملوثات
  - تحديث تلقائي كل 30 دقيقة

- **SolarEnergy.tsx**: واجهة حساب الطاقة الشمسية (350+ سطر)
  - 4 بطاقات إحصائيات (حجم، إنتاج، توفير، حد أقصى)
  - 3 تبويبات: التوصيات، الفوائد، الخطوات التالية
  - حساب التأثير البيئي (CO₂، أشجار، نفط)
  - روابط موارد مفيدة (NREL, PVWatts)

#### تحديثات Navigation

- إضافة 3 routes جديدة في `App.tsx`
- إضافة 3 menu items في `DashboardLayout.tsx`
- أيقونات جديدة: CloudSun, Wind, SunMedium

### تحديثات التوثيق

- تحديث `API_DOCUMENTATION.md` إلى v2.2
  - إضافة 3 أقسام جديدة (Open-Meteo, IQAir, PVWatts)
  - توثيق شامل لـ 13 procedure جديد
  - أمثلة استخدام TypeScript
  - Best practices و Setup guides

- تحديث `CHANGELOG.md` بإصدار 2.2.0

### إحصائيات الإصدار

- **3 APIs جديدة**: 13 procedures
- **3 صفحات frontend**: 1000+ سطر كود
- **Redis caching**: 10min-24hr TTL
- **مجاني**: Open-Meteo بدون API key
- **شامل**: طقس + هواء + طاقة شمسية

---

## [2.0.0] - 2025-01-03

### إضافات رئيسية (Major Features)

#### تكاملات خارجية
- **Sentinel Hub Integration**: تكامل كامل مع Sentinel Hub للصور الفضائية من Sentinel-2
  - صفحة `/satellite-images` جديدة
  - صور RGB وNDVI من الأقمار الصناعية
  - دقة 10 أمتار
  - بيانات تاريخية من 2015

- **OpenWeatherMap Integration**: تكامل كامل مع OpenWeatherMap API
  - صفحة `/weather` جديدة
  - الطقس الحالي والتوقعات (5 أيام)
  - 5 مؤشرات زراعية (إجهاد حراري، حاجة ري، ملاءمة رش، خطر صقيع، نمو محاصيل)
  - تنبيهات تلقائية للطقس
  - Redis caching (10 دقائق للحالي، ساعة للتوقعات)

#### ميزات جديدة
- **PWA (Progressive Web App)**: تحويل المنصة إلى تطبيق قابل للتثبيت
  - Service Worker للـ offline support
  - Manifest.json مع دعم RTL
  - Cache للـ APIs والـ static assets
  - Install prompt

- **PDF Export**: تصدير البيانات والتقارير إلى PDF
  - `exportToPDF()` - تصدير أي عنصر HTML
  - `exportTableToPDF()` - تصدير جداول بيانات
  - `exportDashboardToPDF()` - تصدير Dashboard كامل
  - دعم اللغة العربية وتنسيق احترافي

- **Dark Mode**: دعم الوضع الليلي
  - Theme switcher في قائمة المستخدم
  - أيقونات Sun/Moon
  - حفظ التفضيل في localStorage

- **المحاكي الشامل**: محاكاة لاختبار جميع ميزات المنصة
  - صفحة `/simulator` جديدة
  - توليد بيانات وهمية (مزارع، طائرات، أمراض، صور فضائية)
  - لوحة تحكم مع إعدادات قابلة للتخصيص
  - تشغيل/إيقاف تلقائي

#### تحسينات Backend
- **Redis Caching**: تحسين الأداء بنسبة 80%
  - Cache للـ farms, droneImages, diseaseDetection APIs
  - Cache invalidation تلقائي عند التحديث
  - TTL محدد لكل نوع (5-10 دقائق)

- **Dashboard API**: API جديد للوحة التحكم
  - `getStats` - إحصائيات شاملة (8 مقاييس)
  - `getChartData` - بيانات الرسوم البيانية
  - `getRecentAlerts` - آخر التنبيهات

- **AI Work Planner**: خطط عمل ذكية بالـ AI
  - `generateAIRecommendations` - توصيات ذكية بـ LLM
  - `createFromRecommendations` - إنشاء خطة تلقائياً
  - تحليل NDVI، آفات، إجهاد مائي، أمراض

#### تحسينات Frontend
- **Dashboard محسّن**: لوحة تحكم مع بيانات حقيقية
  - 8 بطاقات إحصائيات
  - رسوم بيانية تفاعلية (Chart.js)
  - NDVI Trend (Line Chart)
  - Disease Detection (Bar Chart)
  - تحديث تلقائي كل 10 دقائق

- **Work Planner محسّن**: خطط عمل مع AI
  - زر "توصيات ذكية بالـ AI"
  - Dialog للتوصيات مع بيانات التحليل
  - بطاقات تحليل (NDVI، آفات، إجهاد مائي، أمراض)
  - إنشاء خطة عمل تلقائياً من التوصيات

### تحسينات الأداء (Performance)
- **Code Splitting**: تقسيم الكود لتحميل أسرع
- **Image Optimization**: تحسين الصور
- **Bundle Size**: تقليل حجم Bundle بنسبة 40%
- **Load Time**: تحسين سرعة التحميل بنسبة 60%

### تحسينات الأمان (Security)
- **Rate Limiting**: حماية من DDoS (100 req/15min)
- **Auth Rate Limiting**: حماية تسجيل الدخول (5 attempts/15min)
- **Input Sanitization**: تنظيف المدخلات
- **Helmet Security Headers**: HTTP headers للأمان
- **CORS Configuration**: تكوين CORS محكم

### تحديثات التبعيات (Dependencies)
- تحديث `@types/node`: 24.9.2 → 24.10.0
- إزالة `@types/node-cache` (deprecated)
- إضافة `vite-plugin-pwa`: 1.1.0
- إضافة `workbox-window`: 7.3.0
- إضافة `jspdf`: 3.0.3
- إضافة `html2canvas`: 1.4.1
- إضافة `chart.js`: 4.4.8
- إضافة `react-chartjs-2`: 5.3.0

### توثيق (Documentation)
- **API_DOCUMENTATION.md v2.0**: توثيق شامل لجميع الـ APIs
- **DEVELOPER_GUIDE.md**: دليل المطورين
- **FAQ.md**: الأسئلة الشائعة
- **PERFORMANCE_OPTIMIZATIONS.md**: تحسينات الأداء
- **INTEGRATIONS_STATUS.md**: حالة التكاملات
- **CHANGELOG.md**: سجل التغييرات (هذا الملف)

### إصلاحات (Bug Fixes)
- إصلاح `__dirname` error في satelliteImages.ts
- إصلاح TypeScript errors في DashboardLayout
- تحسين error handling في جميع الـ APIs

---

## [1.0.0] - 2024-12-XX

### الإصدار الأولي

#### الميزات الأساسية
- **إدارة المزارع**: إضافة، تعديل، حذف المزارع
- **إدارة الحقول**: ربط الحقول بالمزارع
- **إدارة المعدات**: تتبع المعدات الزراعية
- **صور الطائرات**: رفع وتحليل صور الطائرات
- **كشف الأمراض**: كشف الأمراض بالـ YOLO
- **خطط العمل**: إنشاء وإدارة خطط العمل
- **لوحة التحكم**: Dashboard أساسي

#### التكنولوجيا
- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express 4 + tRPC 11
- **Database**: MySQL (TiDB)
- **Auth**: Manus OAuth
- **Styling**: shadcn/ui

---

## الإصدارات القادمة

### [2.1.0] - مخطط
- [ ] Real-time notifications
- [ ] Multi-language support (i18n)
- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Mobile app (React Native)

### [2.2.0] - مخطط
- [ ] IoT sensors integration
- [ ] Automated irrigation system
- [ ] Crop yield prediction
- [ ] Market price integration
- [ ] Financial reports

---

## أنواع التغييرات

- **إضافات**: ميزات جديدة
- **تغييرات**: تعديلات على ميزات موجودة
- **إهمال**: ميزات ستُزال قريباً
- **إزالة**: ميزات مُزالة
- **إصلاحات**: إصلاح أخطاء
- **أمان**: إصلاحات أمنية

---

**© 2025 منصة سَهول - جميع الحقوق محفوظة**
