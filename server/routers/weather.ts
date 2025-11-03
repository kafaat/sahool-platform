import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { getRedis } from '../_core/redis';

/**
 * Weather Router - OpenWeatherMap API Integration
 * تكامل مع OpenWeatherMap للحصول على بيانات الطقس
 */

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const OPENWEATHER_ONECALL_URL = 'https://api.openweathermap.org/data/3.0/onecall';

// دالة مساعدة لجلب البيانات من OpenWeatherMap
async function fetchWeatherData(endpoint: string, params: Record<string, any>) {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OPENWEATHER_API_KEY is not configured');
  }

  const url = new URL(endpoint);
  url.searchParams.append('appid', OPENWEATHER_API_KEY);
  url.searchParams.append('units', 'metric'); // درجة مئوية
  url.searchParams.append('lang', 'ar'); // اللغة العربية

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`OpenWeatherMap API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

export const weatherRouter = router({
  /**
   * الحصول على الطقس الحالي
   */
  getCurrentWeather: protectedProcedure
    .input(z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      farmId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const redis = await getRedis();
        const cacheKey = `weather:current:${input.lat}:${input.lon}`;

        // محاولة الحصول من cache
        if (redis) {
          const cached = await redis.get(cacheKey);
          if (cached) {
            return JSON.parse(cached);
          }
        }

        // جلب من API
        const data = await fetchWeatherData(`${OPENWEATHER_BASE_URL}/weather`, {
          lat: input.lat,
          lon: input.lon,
        });

        const result = {
          success: true,
          farmId: input.farmId,
          location: {
            name: data.name,
            lat: data.coord.lat,
            lon: data.coord.lon,
          },
          current: {
            temp: data.main.temp,
            feelsLike: data.main.feels_like,
            tempMin: data.main.temp_min,
            tempMax: data.main.temp_max,
            pressure: data.main.pressure,
            humidity: data.main.humidity,
            visibility: data.visibility / 1000, // تحويل إلى كيلومتر
            windSpeed: data.wind.speed,
            windDeg: data.wind.deg,
            clouds: data.clouds.all,
            weather: {
              main: data.weather[0].main,
              description: data.weather[0].description,
              icon: data.weather[0].icon,
            },
            sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
            sunset: new Date(data.sys.sunset * 1000).toISOString(),
          },
          timestamp: new Date().toISOString(),
        };

        // حفظ في cache لمدة 10 دقائق
        if (redis) {
          await redis.setex(cacheKey, 600, JSON.stringify(result));
        }

        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل الحصول على بيانات الطقس: ' + error.message,
        });
      }
    }),

  /**
   * الحصول على توقعات الطقس (5 أيام)
   */
  getForecast: protectedProcedure
    .input(z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      farmId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const redis = await getRedis();
        const cacheKey = `weather:forecast:${input.lat}:${input.lon}`;

        // محاولة الحصول من cache
        if (redis) {
          const cached = await redis.get(cacheKey);
          if (cached) {
            return JSON.parse(cached);
          }
        }

        // جلب من API
        const data = await fetchWeatherData(`${OPENWEATHER_BASE_URL}/forecast`, {
          lat: input.lat,
          lon: input.lon,
        });

        // تجميع التوقعات حسب اليوم
        const dailyForecasts: any[] = [];
        const processedDates = new Set<string>();

        data.list.forEach((item: any) => {
          const date = new Date(item.dt * 1000).toISOString().split('T')[0];
          
          if (!processedDates.has(date)) {
            processedDates.add(date);
            dailyForecasts.push({
              date,
              temp: {
                min: item.main.temp_min,
                max: item.main.temp_max,
                avg: item.main.temp,
              },
              humidity: item.main.humidity,
              pressure: item.main.pressure,
              windSpeed: item.wind.speed,
              clouds: item.clouds.all,
              rain: item.rain?.['3h'] || 0,
              weather: {
                main: item.weather[0].main,
                description: item.weather[0].description,
                icon: item.weather[0].icon,
              },
            });
          }
        });

        const result = {
          success: true,
          farmId: input.farmId,
          location: {
            name: data.city.name,
            lat: data.city.coord.lat,
            lon: data.city.coord.lon,
          },
          forecast: dailyForecasts.slice(0, 5), // أول 5 أيام
          timestamp: new Date().toISOString(),
        };

        // حفظ في cache لمدة ساعة
        if (redis) {
          await redis.setex(cacheKey, 3600, JSON.stringify(result));
        }

        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل الحصول على توقعات الطقس: ' + error.message,
        });
      }
    }),

  /**
   * الحصول على المؤشرات الزراعية
   */
  getAgricultural: protectedProcedure
    .input(z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      farmId: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        // الحصول على الطقس الحالي
        const currentWeather = await weatherRouter.createCaller({ user: ctx.user, req: ctx.req, res: ctx.res })
          .getCurrentWeather({ lat: input.lat, lon: input.lon, farmId: input.farmId });

        // حساب المؤشرات الزراعية
        const temp = currentWeather.current.temp;
        const humidity = currentWeather.current.humidity;
        const windSpeed = currentWeather.current.windSpeed;

        // مؤشر الإجهاد الحراري (Heat Stress Index)
        // HSI = 0.8 * T + (RH / 100) * (T - 14.4) + 46.4
        const heatStressIndex = 0.8 * temp + (humidity / 100) * (temp - 14.4) + 46.4;

        // مؤشر الري (Irrigation Index)
        // بناءً على الحرارة والرطوبة
        let irrigationNeed = 'low';
        if (temp > 35 && humidity < 30) {
          irrigationNeed = 'high';
        } else if (temp > 30 || humidity < 40) {
          irrigationNeed = 'medium';
        }

        // مؤشر ملاءمة الرش (Spraying Suitability)
        let sprayingSuitability = 'good';
        if (windSpeed > 15 || currentWeather.current.weather.main === 'Rain') {
          sprayingSuitability = 'poor';
        } else if (windSpeed > 10) {
          sprayingSuitability = 'moderate';
        }

        // مؤشر خطر الصقيع (Frost Risk)
        let frostRisk = 'none';
        if (temp < 5) {
          frostRisk = 'high';
        } else if (temp < 10) {
          frostRisk = 'moderate';
        }

        // مؤشر نمو المحاصيل (Crop Growth Index)
        // درجة الحرارة المثالية: 20-30 درجة، رطوبة: 50-70%
        let cropGrowthIndex = 100;
        if (temp < 15 || temp > 35) cropGrowthIndex -= 30;
        if (humidity < 40 || humidity > 80) cropGrowthIndex -= 20;
        if (windSpeed > 20) cropGrowthIndex -= 10;
        cropGrowthIndex = Math.max(0, cropGrowthIndex);

        return {
          success: true,
          farmId: input.farmId,
          location: currentWeather.location,
          agricultural: {
            heatStressIndex: {
              value: parseFloat(heatStressIndex.toFixed(1)),
              level: heatStressIndex > 32 ? 'high' : heatStressIndex > 27 ? 'moderate' : 'low',
              description: heatStressIndex > 32 
                ? 'إجهاد حراري عالٍ - تجنب العمل الشاق' 
                : heatStressIndex > 27 
                  ? 'إجهاد حراري متوسط - خذ احتياطاتك' 
                  : 'إجهاد حراري منخفض',
            },
            irrigationNeed: {
              level: irrigationNeed,
              description: irrigationNeed === 'high' 
                ? 'حاجة عالية للري - قم بالري فوراً' 
                : irrigationNeed === 'medium' 
                  ? 'حاجة متوسطة للري - راقب التربة' 
                  : 'حاجة منخفضة للري',
            },
            sprayingSuitability: {
              level: sprayingSuitability,
              description: sprayingSuitability === 'good' 
                ? 'مناسب للرش - ظروف ممتازة' 
                : sprayingSuitability === 'moderate' 
                  ? 'مناسب جزئياً للرش - انتبه للرياح' 
                  : 'غير مناسب للرش - رياح قوية أو أمطار',
            },
            frostRisk: {
              level: frostRisk,
              description: frostRisk === 'high' 
                ? 'خطر صقيع عالٍ - احمِ المحاصيل' 
                : frostRisk === 'moderate' 
                  ? 'خطر صقيع متوسط - راقب الحرارة' 
                  : 'لا يوجد خطر صقيع',
            },
            cropGrowthIndex: {
              value: cropGrowthIndex,
              level: cropGrowthIndex > 80 ? 'excellent' : cropGrowthIndex > 60 ? 'good' : cropGrowthIndex > 40 ? 'moderate' : 'poor',
              description: cropGrowthIndex > 80 
                ? 'ظروف ممتازة لنمو المحاصيل' 
                : cropGrowthIndex > 60 
                  ? 'ظروف جيدة لنمو المحاصيل' 
                  : cropGrowthIndex > 40 
                    ? 'ظروف متوسطة لنمو المحاصيل' 
                    : 'ظروف سيئة لنمو المحاصيل',
            },
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل حساب المؤشرات الزراعية: ' + error.message,
        });
      }
    }),

  /**
   * الحصول على الطقس لمزرعة محددة
   */
  getFarmWeather: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { getDb } = await import('../db');
        const { farms } = await import('../../drizzle/schema');
        const { eq } = await import('drizzle-orm');

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // الحصول على المزرعة
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId)).limit(1);

        if (!farm || farm.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'المزرعة غير موجودة',
          });
        }

        // استخراج coordinates من location
        // افتراض: location بصيغة "City - Region" أو coordinates
        // للتبسيط، سنستخدم coordinates الرياض كمثال
        const lat = 24.7136; // الرياض
        const lon = 46.6753;

        // الحصول على الطقس الحالي والتوقعات والمؤشرات الزراعية
        const [current, forecast, agricultural] = await Promise.all([
          weatherRouter.createCaller({ user: ctx.user, req: ctx.req, res: ctx.res })
            .getCurrentWeather({ lat, lon, farmId: input.farmId }),
          weatherRouter.createCaller({ user: ctx.user, req: ctx.req, res: ctx.res })
            .getForecast({ lat, lon, farmId: input.farmId }),
          weatherRouter.createCaller({ user: ctx.user, req: ctx.req, res: ctx.res })
            .getAgricultural({ lat, lon, farmId: input.farmId }),
        ]);

        return {
          success: true,
          farm: {
            id: farm[0].id,
            name: farm[0].name,
            location: farm[0].location,
          },
          current: current.current,
          forecast: forecast.forecast,
          agricultural: agricultural.agricultural,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل الحصول على طقس المزرعة: ' + error.message,
        });
      }
    }),

  /**
   * الحصول على تنبيهات الطقس
   */
  getAlerts: protectedProcedure
    .input(z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      farmId: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        // الحصول على الطقس الحالي والتوقعات
        const [current, forecast, agricultural] = await Promise.all([
          weatherRouter.createCaller({ user: ctx.user, req: ctx.req, res: ctx.res })
            .getCurrentWeather({ lat: input.lat, lon: input.lon, farmId: input.farmId }),
          weatherRouter.createCaller({ user: ctx.user, req: ctx.req, res: ctx.res })
            .getForecast({ lat: input.lat, lon: input.lon, farmId: input.farmId }),
          weatherRouter.createCaller({ user: ctx.user, req: ctx.req, res: ctx.res })
            .getAgricultural({ lat: input.lat, lon: input.lon, farmId: input.farmId }),
        ]);

        const alerts = [];

        // تنبيهات الحرارة
        if (current.current.temp > 40) {
          alerts.push({
            type: 'extreme_heat',
            severity: 'high',
            title: 'حرارة شديدة',
            description: `درجة الحرارة ${current.current.temp}°C - تجنب العمل في الظهيرة`,
            icon: '🔥',
          });
        }

        // تنبيهات الصقيع
        if (agricultural.agricultural.frostRisk.level === 'high') {
          alerts.push({
            type: 'frost',
            severity: 'high',
            title: 'خطر صقيع',
            description: agricultural.agricultural.frostRisk.description,
            icon: '❄️',
          });
        }

        // تنبيهات الرياح
        if (current.current.windSpeed > 20) {
          alerts.push({
            type: 'high_wind',
            severity: 'medium',
            title: 'رياح قوية',
            description: `سرعة الرياح ${current.current.windSpeed} كم/س - تجنب الرش`,
            icon: '💨',
          });
        }

        // تنبيهات الأمطار
        const rainInForecast = forecast.forecast.some((day: any) => day.rain > 0);
        if (rainInForecast) {
          alerts.push({
            type: 'rain',
            severity: 'low',
            title: 'أمطار متوقعة',
            description: 'أمطار متوقعة خلال الأيام القادمة',
            icon: '🌧️',
          });
        }

        // تنبيهات الري
        if (agricultural.agricultural.irrigationNeed.level === 'high') {
          alerts.push({
            type: 'irrigation',
            severity: 'medium',
            title: 'حاجة للري',
            description: agricultural.agricultural.irrigationNeed.description,
            icon: '💧',
          });
        }

        return {
          success: true,
          farmId: input.farmId,
          location: current.location,
          alerts,
          alertCount: alerts.length,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل الحصول على تنبيهات الطقس: ' + error.message,
        });
      }
    }),
});
