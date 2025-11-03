# 🔑 دليل الحصول على API Keys - منصة سَهول

## 📋 نظرة عامة

هذا الدليل يشرح كيفية الحصول على جميع API Keys المطلوبة لتشغيل منصة سَهول بكامل ميزاتها.

---

## 🎯 ملخص سريع

| API | الحالة | التكلفة | الوقت | الأولوية |
|-----|--------|---------|-------|----------|
| **Open-Meteo** | ✅ لا يحتاج key | مجاني | 0 دقيقة | عالية |
| **IQAir** | ⚠️ يحتاج key | مجاني محدود | 5 دقائق | متوسطة |
| **NREL (PVWatts)** | ⚠️ يحتاج key | مجاني | 5 دقائق | متوسطة |
| **OpenWeatherMap** | ⚠️ يحتاج key | مجاني محدود | 3 دقائق | عالية |
| **Sentinel Hub** | ⚠️ يحتاج credentials | مجاني محدود | 10 دقائق | منخفضة |
| **Google Maps** | ✅ مدمج | مجاني | 0 دقيقة | عالية |

---

## 1️⃣ Open-Meteo API (الطقس المتقدم)

### ✅ لا يحتاج API Key!

**الميزات:**
- توقعات 16 يوم
- بيانات تاريخية منذ 1940
- مؤشرات زراعية (GDD, ET0, رطوبة التربة)
- مجاني 100% بدون حدود

**الإعداد:**
```env
# لا يحتاج أي إعداد - يعمل مباشرة!
```

**الوثائق:**
- https://open-meteo.com/en/docs

---

## 2️⃣ IQAir API (جودة الهواء)

### 📝 خطوات الحصول على API Key:

#### 1. إنشاء حساب:
- اذهب إلى: https://www.iqair.com/dashboard/api
- اضغط **"Get API Key"**
- املأ النموذج:
  - الاسم
  - البريد الإلكتروني
  - نوع الاستخدام: **Personal/Research**

#### 2. تفعيل الحساب:
- افتح بريدك الإلكتروني
- اضغط على رابط التفعيل

#### 3. الحصول على API Key:
- سجّل الدخول إلى: https://www.iqair.com/dashboard/api
- انسخ **API Key** من لوحة التحكم

#### 4. إضافة إلى `.env`:
```env
IQAIR_API_KEY=your-iqair-api-key-here
```

### 📊 الحدود المجانية:
- **10,000 طلب/شهر** مجاناً
- كافية لـ ~300 طلب/يوم

### 🔗 الروابط:
- التسجيل: https://www.iqair.com/dashboard/api
- الوثائق: https://api-docs.iqair.com/

---

## 3️⃣ NREL API (الطاقة الشمسية - PVWatts)

### 📝 خطوات الحصول على API Key:

#### 1. إنشاء حساب:
- اذهب إلى: https://developer.nrel.gov/signup/
- املأ النموذج:
  - الاسم الأول
  - الاسم الأخير
  - البريد الإلكتروني
  - الموافقة على الشروط

#### 2. الحصول على API Key:
- سيتم إرسال API Key **فوراً** إلى بريدك الإلكتروني
- أو يظهر مباشرة في الصفحة بعد التسجيل

#### 3. إضافة إلى `.env`:
```env
NREL_API_KEY=your-nrel-api-key-here
```

### 📊 الحدود المجانية:
- **1,000 طلب/ساعة**
- **غير محدود** يومياً/شهرياً
- كافي جداً للاستخدام

### 🔗 الروابط:
- التسجيل: https://developer.nrel.gov/signup/
- الوثائق: https://developer.nrel.gov/docs/solar/pvwatts/v8/

---

## 4️⃣ OpenWeatherMap API (الطقس الزراعي)

### 📝 خطوات الحصول على API Key:

#### 1. إنشاء حساب:
- اذهب إلى: https://home.openweathermap.org/users/sign_up
- املأ النموذج:
  - اسم المستخدم
  - البريد الإلكتروني
  - كلمة المرور
- وافق على الشروط

#### 2. تفعيل الحساب:
- افتح بريدك الإلكتروني
- اضغط على رابط التفعيل

#### 3. الحصول على API Key:
- سجّل الدخول
- اذهب إلى: https://home.openweathermap.org/api_keys
- انسخ **API Key** (يتم إنشاؤه تلقائياً)
- ⏱️ **انتظر 10-120 دقيقة** حتى يتم تفعيل الـ key

#### 4. إضافة إلى `.env`:
```env
OPENWEATHER_API_KEY=your-openweather-api-key-here
```

### 📊 الحدود المجانية:
- **60 طلب/دقيقة**
- **1,000,000 طلب/شهر**
- كافي جداً للاستخدام

### 🔗 الروابط:
- التسجيل: https://home.openweathermap.org/users/sign_up
- API Keys: https://home.openweathermap.org/api_keys
- الوثائق: https://openweathermap.org/api

---

## 5️⃣ Sentinel Hub (صور الأقمار الصناعية)

### 📝 خطوات الحصول على Credentials:

#### 1. إنشاء حساب:
- اذهب إلى: https://www.sentinel-hub.com/
- اضغط **"Sign Up"** أو **"Start Free Trial"**
- املأ النموذج:
  - البريد الإلكتروني
  - كلمة المرور
  - الاسم
  - الشركة (اختياري)

#### 2. تفعيل الحساب:
- افتح بريدك الإلكتروني
- اضغط على رابط التفعيل

#### 3. إنشاء OAuth Client:
- سجّل الدخول إلى: https://apps.sentinel-hub.com/dashboard/
- اذهب إلى **"User Settings"** → **"OAuth clients"**
- اضغط **"Create new"**
- اختر:
  - Name: `Sahool Platform`
  - Grant Type: `Client Credentials`
- اضغط **"Create"**

#### 4. الحصول على Credentials:
- انسخ:
  - **Client ID**
  - **Client Secret**

#### 5. إضافة إلى `.env`:
```env
SENTINEL_HUB_CLIENT_ID=your-client-id-here
SENTINEL_HUB_CLIENT_SECRET=your-client-secret-here
```

### 📊 الحدود المجانية (Trial):
- **30 يوم** تجربة مجانية
- **10,000 Processing Units** مجاناً
- كافي لـ ~1000 صورة

### 💰 بعد التجربة:
- يمكن الاستمرار بخطة مدفوعة
- أو استخدام ميزات أخرى في المنصة

### 🔗 الروابط:
- التسجيل: https://www.sentinel-hub.com/
- Dashboard: https://apps.sentinel-hub.com/dashboard/
- الوثائق: https://docs.sentinel-hub.com/

---

## 6️⃣ Google Maps API

### ✅ مدمج مع Manus - لا يحتاج إعداد!

**الميزات:**
- خرائط تفاعلية
- Places API
- Geocoding
- Directions
- Drawing Tools

**الإعداد:**
```env
# لا يحتاج أي إعداد - يعمل تلقائياً عبر Manus Proxy
```

---

## 📦 ملف `.env` الكامل

بعد الحصول على جميع API Keys، ملف `.env` يجب أن يكون:

```env
# ═══════════════════════════════════════════════════════════
# منصة سَهول - ملف البيئة
# ═══════════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# قاعدة البيانات (إلزامي)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE_URL=mysql://sahool_user:your-password@localhost:3306/sahool

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# الأمان (إلزامي)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JWT_SECRET=generate-a-strong-random-secret-at-least-32-characters-long

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# التطبيق
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NODE_ENV=production
PORT=3000

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# معلومات المالك
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OWNER_OPEN_ID=admin
OWNER_NAME=مدير النظام

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# إعدادات التطبيق
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VITE_APP_TITLE=منصة سَهول
VITE_APP_LOGO=/logo.png

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Redis (اختياري - للـ caching)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REDIS_URL=redis://localhost:6379

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# APIs - الطقس والبيئة
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Open-Meteo (الطقس المتقدم) - لا يحتاج key ✅
# يعمل مباشرة بدون إعداد

# IQAir (جودة الهواء) - مجاني: 10k طلب/شهر
IQAIR_API_KEY=your-iqair-api-key-here

# NREL PVWatts (الطاقة الشمسية) - مجاني: 1k طلب/ساعة
NREL_API_KEY=your-nrel-api-key-here

# OpenWeatherMap (الطقس الزراعي) - مجاني: 1M طلب/شهر
OPENWEATHER_API_KEY=your-openweather-api-key-here

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# APIs - الاستشعار عن بعد
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Sentinel Hub (صور الأقمار الصناعية) - تجربة 30 يوم
SENTINEL_HUB_CLIENT_ID=your-sentinel-client-id-here
SENTINEL_HUB_CLIENT_SECRET=your-sentinel-client-secret-here

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ملاحظات:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# - Google Maps: مدمج مع Manus - لا يحتاج key
# - يمكن ترك API keys فارغة والمنصة ستعمل بدونها
# - الميزات المرتبطة بـ API معين لن تعمل إذا لم يتم إضافة key
# ═══════════════════════════════════════════════════════════
```

---

## 🚀 سكريبت التحقق من API Keys

احفظ هذا السكريبت باسم `check-apis.sh`:

```bash
#!/bin/bash

# ═══════════════════════════════════════════════════════════
# سكريبت التحقق من API Keys
# ═══════════════════════════════════════════════════════════

echo "🔍 التحقق من API Keys..."
echo ""

# قراءة ملف .env
if [ ! -f .env ]; then
    echo "❌ ملف .env غير موجود"
    exit 1
fi

source .env

# دالة التحقق
check_api() {
    local name=$1
    local key=$2
    local test_url=$3
    
    if [ -z "$key" ]; then
        echo "⚠️  $name: غير موجود"
        return 1
    fi
    
    if [ -n "$test_url" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$test_url")
        if [ "$response" == "200" ] || [ "$response" == "401" ]; then
            echo "✅ $name: موجود"
            return 0
        else
            echo "❌ $name: موجود لكن قد يكون غير صالح"
            return 1
        fi
    else
        echo "✅ $name: موجود"
        return 0
    fi
}

# التحقق من كل API
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "الطقس والبيئة:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "✅ Open-Meteo: لا يحتاج key (مجاني)"
check_api "IQAir" "$IQAIR_API_KEY" "https://api.airvisual.com/v2/nearest_city?key=$IQAIR_API_KEY"
check_api "NREL PVWatts" "$NREL_API_KEY" "https://developer.nrel.gov/api/pvwatts/v8.json?api_key=$NREL_API_KEY&lat=24&lon=46&system_capacity=4&azimuth=180&tilt=20&array_type=1&module_type=1&losses=10"
check_api "OpenWeatherMap" "$OPENWEATHER_API_KEY" "https://api.openweathermap.org/data/2.5/weather?lat=24&lon=46&appid=$OPENWEATHER_API_KEY"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "الاستشعار عن بعد:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_api "Sentinel Hub Client ID" "$SENTINEL_HUB_CLIENT_ID"
check_api "Sentinel Hub Client Secret" "$SENTINEL_HUB_CLIENT_SECRET"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "الخرائط:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "✅ Google Maps: مدمج مع Manus (لا يحتاج key)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ التحقق مكتمل"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

**الاستخدام:**
```bash
chmod +x check-apis.sh
bash check-apis.sh
```

---

## 📊 جدول الأولويات

### الأولوية العالية (ابدأ بهذه):
1. ✅ **Open-Meteo** - لا يحتاج شيء
2. ⚠️ **OpenWeatherMap** - 3 دقائق
3. ✅ **Google Maps** - مدمج

### الأولوية المتوسطة:
4. ⚠️ **IQAir** - 5 دقائق
5. ⚠️ **NREL** - 5 دقائق

### الأولوية المنخفضة:
6. ⚠️ **Sentinel Hub** - 10 دقائق (تجربة 30 يوم)

---

## ⏱️ الوقت الإجمالي

- **الحد الأدنى**: 0 دقيقة (Open-Meteo + Google Maps)
- **موصى به**: 15 دقيقة (جميع APIs المجانية)
- **كامل**: 25 دقيقة (مع Sentinel Hub)

---

## 🎯 الخلاصة

### بدون أي API Keys:
- ✅ المنصة تعمل
- ✅ Dashboard
- ✅ إدارة المزارع
- ✅ الطقس المتقدم (Open-Meteo)
- ✅ الخرائط (Google Maps)

### مع جميع API Keys:
- ✅ كل ما سبق +
- ✅ جودة الهواء
- ✅ الطاقة الشمسية
- ✅ الطقس الزراعي
- ✅ صور الأقمار الصناعية

---

## 📞 الدعم

إذا واجهت مشكلة في الحصول على أي API Key:
- GitHub Issues: https://github.com/kafaat/sahool-platform/issues
- التوثيق: https://github.com/kafaat/sahool-platform

---

**آخر تحديث: 2025-11-03**
**الإصدار: 2.2.0**
