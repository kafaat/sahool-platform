import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getRedis } from "../_core/redis";
import { TRPCError } from "@trpc/server";

/**
 * IQAir API Router
 * Air quality data for agricultural health monitoring
 * 
 * Features:
 * - Current air quality (AQI, PM2.5, PM10, O3, NO2, SO2, CO)
 * - Historical data
 * - Health recommendations for farm workers
 * - Crop impact analysis
 * 
 * Note: Requires IQAIR_API_KEY environment variable
 */

const BASE_URL = "https://api.airvisual.com/v2";

// Helper function to fetch from IQAir
async function fetchIQAir(endpoint: string, params: Record<string, any>) {
  const apiKey = process.env.IQAIR_API_KEY;
  if (!apiKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "IQAir API key not configured. Please add IQAIR_API_KEY to environment variables.",
    });
  }

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.append("key", apiKey);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `IQAir API error: ${error.message || response.statusText}`,
    });
  }
  return response.json();
}

// Helper: Get AQI level and description
function getAQILevel(aqi: number) {
  if (aqi <= 50) {
    return { level: "good", color: "green", description: "جيد - آمن للعمل الزراعي" };
  } else if (aqi <= 100) {
    return { level: "moderate", color: "yellow", description: "معتدل - مقبول للعمل الزراعي" };
  } else if (aqi <= 150) {
    return { level: "unhealthy_sensitive", color: "orange", description: "غير صحي للحساسين - احذر عند العمل الطويل" };
  } else if (aqi <= 200) {
    return { level: "unhealthy", color: "red", description: "غير صحي - قلل ساعات العمل الخارجي" };
  } else if (aqi <= 300) {
    return { level: "very_unhealthy", color: "purple", description: "غير صحي جداً - تجنب العمل الخارجي" };
  } else {
    return { level: "hazardous", color: "maroon", description: "خطر - أوقف العمل الخارجي" };
  }
}

// Helper: Get crop impact
function getCropImpact(aqi: number, pollutant: string) {
  const impacts = [];

  if (aqi > 100) {
    impacts.push({
      severity: aqi > 150 ? "high" : "medium",
      description: "تلوث الهواء قد يؤثر على نمو المحاصيل",
      recommendation: "راقب المحاصيل الحساسة",
    });
  }

  if (pollutant === "pm25" && aqi > 100) {
    impacts.push({
      severity: "medium",
      description: "الجسيمات الدقيقة قد تسد مسام الأوراق",
      recommendation: "فكر في غسل الأوراق بالرش المائي",
    });
  }

  if (pollutant === "o3" && aqi > 100) {
    impacts.push({
      severity: "high",
      description: "الأوزون يضر بالأوراق ويقلل التمثيل الضوئي",
      recommendation: "المحاصيل الحساسة: الطماطم، الفاصوليا، القمح",
    });
  }

  if (pollutant === "so2" && aqi > 100) {
    impacts.push({
      severity: "high",
      description: "ثاني أكسيد الكبريت يسبب حروق الأوراق",
      recommendation: "راقب علامات الاصفرار على الأوراق",
    });
  }

  return impacts;
}

export const airQualityRouter = router({
  /**
   * Get current air quality by coordinates
   */
  getCurrentByCoordinates: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
    )
    .query(async ({ input }) => {
      const redis = await getRedis();
      const cacheKey = `iqair:current:${input.latitude}:${input.longitude}`;

      // Try cache first (30 minutes)
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const data = await fetchIQAir("nearest_city", {
        lat: input.latitude,
        lon: input.longitude,
      });

      const current = data.data.current.pollution;
      const weather = data.data.current.weather;
      const aqiInfo = getAQILevel(current.aqius);
      const cropImpact = getCropImpact(current.aqius, current.mainus);

      const result = {
        location: {
          city: data.data.city,
          state: data.data.state,
          country: data.data.country,
          coordinates: {
            latitude: data.data.location.coordinates[1],
            longitude: data.data.location.coordinates[0],
          },
        },
        timestamp: current.ts,
        airQuality: {
          aqius: current.aqius, // US AQI
          mainus: current.mainus, // Main pollutant (US)
          aqicn: current.aqicn, // China AQI
          maincn: current.maincn, // Main pollutant (China)
        },
        level: aqiInfo,
        weather: {
          temperature: weather.tp,
          pressure: weather.pr,
          humidity: weather.hu,
          windSpeed: weather.ws,
          windDirection: weather.wd,
          iconCode: weather.ic,
        },
        cropImpact,
        healthRecommendations: {
          general: aqiInfo.description,
          farmWorkers:
            current.aqius > 150
              ? "ارتدِ كمامة N95 عند العمل الخارجي"
              : current.aqius > 100
              ? "قلل ساعات العمل الخارجي للعمال الحساسين"
              : "آمن للعمل الزراعي العادي",
          spraying:
            current.aqius > 100
              ? "تجنب الرش - قد يزيد التلوث من تأثير المبيدات"
              : "مناسب للرش",
        },
      };

      // Cache for 30 minutes
      if (redis) {
        await redis.setex(cacheKey, 1800, JSON.stringify(result));
      }

      return result;
    }),

  /**
   * Get current air quality by city
   */
  getCurrentByCity: publicProcedure
    .input(
      z.object({
        city: z.string().min(1),
        state: z.string().optional(),
        country: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const redis = await getRedis();
      const cacheKey = `iqair:city:${input.city}:${input.state || ""}:${input.country}`;

      // Try cache first (30 minutes)
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const params: Record<string, any> = {
        city: input.city,
        country: input.country,
      };
      if (input.state) {
        params.state = input.state;
      }

      const data = await fetchIQAir("city", params);

      const current = data.data.current.pollution;
      const weather = data.data.current.weather;
      const aqiInfo = getAQILevel(current.aqius);
      const cropImpact = getCropImpact(current.aqius, current.mainus);

      const result = {
        location: {
          city: data.data.city,
          state: data.data.state,
          country: data.data.country,
          coordinates: {
            latitude: data.data.location.coordinates[1],
            longitude: data.data.location.coordinates[0],
          },
        },
        timestamp: current.ts,
        airQuality: {
          aqius: current.aqius,
          mainus: current.mainus,
          aqicn: current.aqicn,
          maincn: current.maincn,
        },
        level: aqiInfo,
        weather: {
          temperature: weather.tp,
          pressure: weather.pr,
          humidity: weather.hu,
          windSpeed: weather.ws,
          windDirection: weather.wd,
          iconCode: weather.ic,
        },
        cropImpact,
        healthRecommendations: {
          general: aqiInfo.description,
          farmWorkers:
            current.aqius > 150
              ? "ارتدِ كمامة N95 عند العمل الخارجي"
              : current.aqius > 100
              ? "قلل ساعات العمل الخارجي للعمال الحساسين"
              : "آمن للعمل الزراعي العادي",
          spraying:
            current.aqius > 100
              ? "تجنب الرش - قد يزيد التلوث من تأثير المبيدات"
              : "مناسب للرش",
        },
      };

      // Cache for 30 minutes
      if (redis) {
        await redis.setex(cacheKey, 1800, JSON.stringify(result));
      }

      return result;
    }),

  /**
   * Get air quality for a farm
   */
  getFarmAirQuality: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
      })
    )
    .query(async ({ input }) => {
      // Get farm coordinates from database
      const { getDb } = await import("../db");
      const { farms } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const farm = await db.select().from(farms).where(eq(farms.id, input.farmId)).limit(1);
      if (farm.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Farm not found",
        });
      }

      const latitude = farm[0].latitude;
      const longitude = farm[0].longitude;

      if (!latitude || !longitude) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Farm coordinates not set",
        });
      }

      const redis = await getRedis();
      const cacheKey = `iqair:farm:${input.farmId}`;

      // Try cache first (30 minutes)
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const data = await fetchIQAir("nearest_city", {
        lat: latitude,
        lon: longitude,
      });

      const current = data.data.current.pollution;
      const aqiInfo = getAQILevel(current.aqius);
      const cropImpact = getCropImpact(current.aqius, current.mainus);

      const result = {
        farmId: input.farmId,
        farmName: farm[0].name,
        location: {
          city: data.data.city,
          state: data.data.state,
          country: data.data.country,
        },
        timestamp: current.ts,
        airQuality: {
          aqi: current.aqius,
          level: aqiInfo.level,
          color: aqiInfo.color,
          description: aqiInfo.description,
          mainPollutant: current.mainus,
        },
        cropImpact,
        recommendations: {
          farmWorkers:
            current.aqius > 150
              ? "ارتدِ كمامة N95 عند العمل الخارجي"
              : current.aqius > 100
              ? "قلل ساعات العمل الخارجي"
              : "آمن للعمل",
          spraying: current.aqius > 100 ? "تجنب الرش اليوم" : "مناسب للرش",
          irrigation: "جودة الهواء لا تؤثر على الري",
          harvesting:
            current.aqius > 150
              ? "أجّل الحصاد إن أمكن"
              : current.aqius > 100
              ? "احصد في الصباح الباكر"
              : "مناسب للحصاد",
        },
        alerts:
          current.aqius > 150
            ? [
                {
                  severity: "high",
                  title: "تحذير: جودة هواء سيئة",
                  message: "تجنب العمل الخارجي الطويل",
                },
              ]
            : current.aqius > 100
            ? [
                {
                  severity: "medium",
                  title: "تنبيه: جودة هواء معتدلة",
                  message: "احذر عند العمل الطويل",
                },
              ]
            : [],
      };

      // Cache for 30 minutes
      if (redis) {
        await redis.setex(cacheKey, 1800, JSON.stringify(result));
      }

      return result;
    }),

  /**
   * Get pollutant details
   */
  getPollutantInfo: publicProcedure
    .input(
      z.object({
        pollutant: z.enum(["pm25", "pm10", "o3", "no2", "so2", "co"]),
      })
    )
    .query(async ({ input }) => {
      const pollutantInfo: Record<string, any> = {
        pm25: {
          name: "الجسيمات الدقيقة (PM2.5)",
          description: "جسيمات دقيقة أصغر من 2.5 ميكرومتر",
          sources: ["حرق الوقود", "عوادم السيارات", "الغبار"],
          healthEffects: "تدخل الرئتين وتسبب مشاكل تنفسية",
          cropEffects: "تسد مسام الأوراق وتقلل التمثيل الضوئي",
          recommendations: ["غسل الأوراق بالرش المائي", "مراقبة المحاصيل الحساسة"],
          safeLevel: 35, // μg/m³
        },
        pm10: {
          name: "الجسيمات الخشنة (PM10)",
          description: "جسيمات أصغر من 10 ميكرومتر",
          sources: ["الغبار", "حبوب اللقاح", "الرمال"],
          healthEffects: "تهيج الجهاز التنفسي",
          cropEffects: "تغطي الأوراق وتقلل الضوء",
          recommendations: ["تنظيف الأوراق", "استخدام مصدات الرياح"],
          safeLevel: 150, // μg/m³
        },
        o3: {
          name: "الأوزون (O₃)",
          description: "غاز ينتج من تفاعل ضوء الشمس مع الملوثات",
          sources: ["عوادم السيارات", "المصانع"],
          healthEffects: "يهيج الرئتين ويسبب ضيق التنفس",
          cropEffects: "يحرق الأوراق ويقلل الإنتاجية بنسبة 10-30%",
          recommendations: ["تجنب الرش في الأيام المشمسة", "مراقبة الطماطم والقمح"],
          safeLevel: 100, // ppb
          sensitiveCrops: ["الطماطم", "الفاصوليا", "القمح", "البطاطس"],
        },
        no2: {
          name: "ثاني أكسيد النيتروجين (NO₂)",
          description: "غاز بني محمر من احتراق الوقود",
          sources: ["عوادم السيارات", "محطات الطاقة"],
          healthEffects: "يهيج الجهاز التنفسي",
          cropEffects: "يضر بالأوراق ويقلل النمو",
          recommendations: ["مراقبة المحاصيل القريبة من الطرق"],
          safeLevel: 100, // ppb
        },
        so2: {
          name: "ثاني أكسيد الكبريت (SO₂)",
          description: "غاز عديم اللون من حرق الفحم والنفط",
          sources: ["محطات الطاقة", "المصانع"],
          healthEffects: "يسبب مشاكل تنفسية",
          cropEffects: "يسبب حروق الأوراق واصفرارها",
          recommendations: ["مراقبة علامات الحروق", "تجنب المناطق الصناعية"],
          safeLevel: 75, // ppb
        },
        co: {
          name: "أول أكسيد الكربون (CO)",
          description: "غاز عديم اللون والرائحة",
          sources: ["عوادم السيارات", "الحرائق"],
          healthEffects: "يقلل الأكسجين في الدم",
          cropEffects: "تأثير محدود على المحاصيل",
          recommendations: ["تهوية جيدة للعمال"],
          safeLevel: 9, // ppm
        },
      };

      return pollutantInfo[input.pollutant];
    }),
});
