#!/bin/bash

# ═══════════════════════════════════════════════════════════
# سكريبت التحقق من API Keys - منصة سَهول
# ═══════════════════════════════════════════════════════════

set -e

# الألوان
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         التحقق من API Keys - منصة سَهول                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# قراءة ملف .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ ملف .env غير موجود${NC}"
    echo "قم بإنشاء ملف .env أولاً"
    exit 1
fi

source .env

# دالة التحقق
check_api() {
    local name=$1
    local key=$2
    local test_url=$3
    
    if [ -z "$key" ]; then
        echo -e "${YELLOW}⚠️  $name: غير موجود${NC}"
        return 1
    fi
    
    if [ -n "$test_url" ]; then
        echo -n "   اختبار الاتصال... "
        response=$(curl -s -o /dev/null -w "%{http_code}" "$test_url" 2>/dev/null)
        if [ "$response" == "200" ]; then
            echo -e "${GREEN}✅ يعمل${NC}"
            return 0
        elif [ "$response" == "401" ] || [ "$response" == "403" ]; then
            echo -e "${RED}❌ Key غير صالح${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠️  غير متأكد (HTTP $response)${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✅ $name: موجود${NC}"
        return 0
    fi
}

# عداد النجاح
success_count=0
total_count=0

# التحقق من قاعدة البيانات
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}قاعدة البيانات:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}✅ DATABASE_URL: موجود${NC}"
    ((success_count++))
else
    echo -e "${RED}❌ DATABASE_URL: غير موجود (إلزامي!)${NC}"
fi
((total_count++))

echo ""

# التحقق من الأمان
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}الأمان:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$JWT_SECRET" ]; then
    if [ ${#JWT_SECRET} -ge 32 ]; then
        echo -e "${GREEN}✅ JWT_SECRET: موجود وقوي${NC}"
        ((success_count++))
    else
        echo -e "${YELLOW}⚠️  JWT_SECRET: موجود لكن قصير (يفضل 32+ حرف)${NC}"
    fi
else
    echo -e "${RED}❌ JWT_SECRET: غير موجود (إلزامي!)${NC}"
fi
((total_count++))

echo ""

# التحقق من APIs - الطقس
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}APIs - الطقس والبيئة:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${GREEN}✅ Open-Meteo: لا يحتاج key (مجاني 100%)${NC}"
((success_count++))
((total_count++))

echo -n "IQAir (جودة الهواء): "
if check_api "IQAir" "$IQAIR_API_KEY" "https://api.airvisual.com/v2/nearest_city?lat=24&lon=46&key=$IQAIR_API_KEY"; then
    ((success_count++))
fi
((total_count++))

echo -n "NREL PVWatts (طاقة شمسية): "
if check_api "NREL" "$NREL_API_KEY" "https://developer.nrel.gov/api/pvwatts/v8.json?api_key=$NREL_API_KEY&lat=24&lon=46&system_capacity=4&azimuth=180&tilt=20&array_type=1&module_type=1&losses=10"; then
    ((success_count++))
fi
((total_count++))

echo -n "OpenWeatherMap (طقس زراعي): "
if check_api "OpenWeather" "$OPENWEATHER_API_KEY" "https://api.openweathermap.org/data/2.5/weather?lat=24&lon=46&appid=$OPENWEATHER_API_KEY"; then
    ((success_count++))
fi
((total_count++))

echo ""

# التحقق من APIs - الاستشعار
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}APIs - الاستشعار عن بعد:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$SENTINEL_HUB_CLIENT_ID" ] && [ -n "$SENTINEL_HUB_CLIENT_SECRET" ]; then
    echo -e "${GREEN}✅ Sentinel Hub: موجود (Client ID + Secret)${NC}"
    ((success_count++))
else
    echo -e "${YELLOW}⚠️  Sentinel Hub: غير موجود${NC}"
fi
((total_count++))

echo ""

# التحقق من الخرائط
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}الخرائط:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${GREEN}✅ Google Maps: مدمج مع Manus (لا يحتاج key)${NC}"
((success_count++))
((total_count++))

echo ""

# النتيجة النهائية
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}النتيجة:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

percentage=$((success_count * 100 / total_count))

if [ $percentage -eq 100 ]; then
    echo -e "${GREEN}✅ ممتاز! جميع APIs جاهزة ($success_count/$total_count)${NC}"
elif [ $percentage -ge 70 ]; then
    echo -e "${GREEN}✅ جيد! معظم APIs جاهزة ($success_count/$total_count)${NC}"
elif [ $percentage -ge 50 ]; then
    echo -e "${YELLOW}⚠️  متوسط. بعض APIs ناقصة ($success_count/$total_count)${NC}"
else
    echo -e "${RED}❌ ضعيف. الكثير من APIs ناقصة ($success_count/$total_count)${NC}"
fi

echo ""
echo "الميزات المتاحة:"
echo "  - Dashboard: ✅"
echo "  - إدارة المزارع: ✅"
echo "  - الطقس المتقدم: ✅"
echo "  - الخرائط: ✅"

if [ -n "$IQAIR_API_KEY" ]; then
    echo "  - جودة الهواء: ✅"
else
    echo "  - جودة الهواء: ❌"
fi

if [ -n "$NREL_API_KEY" ]; then
    echo "  - الطاقة الشمسية: ✅"
else
    echo "  - الطاقة الشمسية: ❌"
fi

if [ -n "$OPENWEATHER_API_KEY" ]; then
    echo "  - الطقس الزراعي: ✅"
else
    echo "  - الطقس الزراعي: ❌"
fi

if [ -n "$SENTINEL_HUB_CLIENT_ID" ]; then
    echo "  - صور الأقمار: ✅"
else
    echo "  - صور الأقمار: ❌"
fi

echo ""
echo "لمزيد من المعلومات: راجع API_KEYS_GUIDE.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 0
