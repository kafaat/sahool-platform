import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getRedis } from "../_core/redis";

/**
 * Open-Meteo API Router
 * Free weather API with 70+ years of historical data
 * No API key required!
 * 
 * Features:
 * - Current weather
 * - 7-day forecast
 * - Historical data (1940-present)
 * - Agricultural indices
 * - Weather alerts
 */

const BASE_URL = "https://api.open-meteo.com/v1";

// Helper function to fetch from Open-Meteo
async function fetchOpenMeteo(endpoint: string, params: Record<string, any>) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.statusText}`);
  }
  return response.json();
}

export const openMeteoRouter = router({
  /**
   * Get current weather
   */
  getCurrentWeather: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        timezone: z.string().optional().default("auto"),
      })
    )
    .query(async ({ input }) => {
      const redis = await getRedis();
      const cacheKey = `openmeteo:current:${input.latitude}:${input.longitude}`;

      // Try cache first (10 minutes)
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const data = await fetchOpenMeteo("forecast", {
        latitude: input.latitude,
        longitude: input.longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
        timezone: input.timezone,
      });

      const result = {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        elevation: data.elevation,
        current: {
          time: data.current.time,
          temperature: data.current.temperature_2m,
          apparentTemperature: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          precipitation: data.current.precipitation,
          rain: data.current.rain,
          weatherCode: data.current.weather_code,
          cloudCover: data.current.cloud_cover,
          pressure: data.current.pressure_msl,
          surfacePressure: data.current.surface_pressure,
          windSpeed: data.current.wind_speed_10m,
          windDirection: data.current.wind_direction_10m,
          windGusts: data.current.wind_gusts_10m,
        },
      };

      // Cache for 10 minutes
      if (redis) {
        await redis.setex(cacheKey, 600, JSON.stringify(result));
      }

      return result;
    }),

  /**
   * Get 7-day forecast
   */
  getForecast: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        days: z.number().min(1).max(16).optional().default(7),
        timezone: z.string().optional().default("auto"),
      })
    )
    .query(async ({ input }) => {
      const redis = await getRedis();
      const cacheKey = `openmeteo:forecast:${input.latitude}:${input.longitude}:${input.days}`;

      // Try cache first (1 hour)
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const data = await fetchOpenMeteo("forecast", {
        latitude: input.latitude,
        longitude: input.longitude,
        daily: "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,rain_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration",
        timezone: input.timezone,
        forecast_days: input.days,
      });

      const forecast = data.daily.time.map((time: string, index: number) => ({
        date: time,
        weatherCode: data.daily.weather_code[index],
        temperatureMax: data.daily.temperature_2m_max[index],
        temperatureMin: data.daily.temperature_2m_min[index],
        apparentTemperatureMax: data.daily.apparent_temperature_max[index],
        apparentTemperatureMin: data.daily.apparent_temperature_min[index],
        sunrise: data.daily.sunrise[index],
        sunset: data.daily.sunset[index],
        precipitationSum: data.daily.precipitation_sum[index],
        rainSum: data.daily.rain_sum[index],
        precipitationHours: data.daily.precipitation_hours[index],
        precipitationProbability: data.daily.precipitation_probability_max[index],
        windSpeedMax: data.daily.wind_speed_10m_max[index],
        windGustsMax: data.daily.wind_gusts_10m_max[index],
        windDirection: data.daily.wind_direction_10m_dominant[index],
        solarRadiation: data.daily.shortwave_radiation_sum[index],
        evapotranspiration: data.daily.et0_fao_evapotranspiration[index],
      }));

      const result = {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        elevation: data.elevation,
        forecast,
      };

      // Cache for 1 hour
      if (redis) {
        await redis.setex(cacheKey, 3600, JSON.stringify(result));
      }

      return result;
    }),

  /**
   * Get historical weather data
   */
  getHistoricalWeather: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        timezone: z.string().optional().default("auto"),
      })
    )
    .query(async ({ input }) => {
      const redis = await getRedis();
      const cacheKey = `openmeteo:historical:${input.latitude}:${input.longitude}:${input.startDate}:${input.endDate}`;

      // Try cache first (24 hours - historical data doesn't change)
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const data = await fetchOpenMeteo("archive", {
        latitude: input.latitude,
        longitude: input.longitude,
        start_date: input.startDate,
        end_date: input.endDate,
        daily: "weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,apparent_temperature_max,apparent_temperature_min,apparent_temperature_mean,precipitation_sum,rain_sum,snowfall_sum,precipitation_hours,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration",
        timezone: input.timezone,
      });

      const historical = data.daily.time.map((time: string, index: number) => ({
        date: time,
        weatherCode: data.daily.weather_code[index],
        temperatureMax: data.daily.temperature_2m_max[index],
        temperatureMin: data.daily.temperature_2m_min[index],
        temperatureMean: data.daily.temperature_2m_mean[index],
        apparentTemperatureMax: data.daily.apparent_temperature_max[index],
        apparentTemperatureMin: data.daily.apparent_temperature_min[index],
        apparentTemperatureMean: data.daily.apparent_temperature_mean[index],
        precipitationSum: data.daily.precipitation_sum[index],
        rainSum: data.daily.rain_sum[index],
        snowfallSum: data.daily.snowfall_sum[index],
        precipitationHours: data.daily.precipitation_hours[index],
        windSpeedMax: data.daily.wind_speed_10m_max[index],
        windGustsMax: data.daily.wind_gusts_10m_max[index],
        windDirection: data.daily.wind_direction_10m_dominant[index],
        solarRadiation: data.daily.shortwave_radiation_sum[index],
        evapotranspiration: data.daily.et0_fao_evapotranspiration[index],
      }));

      const result = {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        elevation: data.elevation,
        historical,
      };

      // Cache for 24 hours
      if (redis) {
        await redis.setex(cacheKey, 86400, JSON.stringify(result));
      }

      return result;
    }),

  /**
   * Get agricultural indices
   */
  getAgriculturalIndices: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        days: z.number().min(1).max(16).optional().default(7),
        timezone: z.string().optional().default("auto"),
      })
    )
    .query(async ({ input }) => {
      const redis = await getRedis();
      const cacheKey = `openmeteo:agricultural:${input.latitude}:${input.longitude}:${input.days}`;

      // Try cache first (1 hour)
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const data = await fetchOpenMeteo("forecast", {
        latitude: input.latitude,
        longitude: input.longitude,
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration,soil_temperature_0_to_7cm,soil_moisture_0_to_7cm,shortwave_radiation_sum",
        timezone: input.timezone,
        forecast_days: input.days,
      });

      const indices = data.daily.time.map((time: string, index: number) => {
        const tempMax = data.daily.temperature_2m_max[index];
        const tempMin = data.daily.temperature_2m_min[index];
        const tempMean = (tempMax + tempMin) / 2;
        const precipitation = data.daily.precipitation_sum[index];
        const et0 = data.daily.et0_fao_evapotranspiration[index];
        const soilTemp = data.daily.soil_temperature_0_to_7cm[index];
        const soilMoisture = data.daily.soil_moisture_0_to_7cm[index];
        const solarRadiation = data.daily.shortwave_radiation_sum[index];

        // Calculate agricultural indices
        const growingDegreeDays = Math.max(0, tempMean - 10); // Base temperature 10°C
        const waterDeficit = Math.max(0, et0 - precipitation);
        const heatStress = tempMax > 35 ? "high" : tempMax > 30 ? "medium" : "low";
        const frostRisk = tempMin < 0 ? "high" : tempMin < 5 ? "medium" : "low";
        const irrigationNeed = waterDeficit > 5 ? "high" : waterDeficit > 2 ? "medium" : "low";

        return {
          date: time,
          temperatureMax: tempMax,
          temperatureMin: tempMin,
          temperatureMean: tempMean,
          precipitation: precipitation,
          evapotranspiration: et0,
          soilTemperature: soilTemp,
          soilMoisture: soilMoisture,
          solarRadiation: solarRadiation,
          growingDegreeDays: growingDegreeDays,
          waterDeficit: waterDeficit,
          heatStress: heatStress,
          frostRisk: frostRisk,
          irrigationNeed: irrigationNeed,
        };
      });

      const result = {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        elevation: data.elevation,
        indices,
      };

      // Cache for 1 hour
      if (redis) {
        await redis.setex(cacheKey, 3600, JSON.stringify(result));
      }

      return result;
    }),

  /**
   * Get weather alerts (based on forecast)
   */
  getWeatherAlerts: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        timezone: z.string().optional().default("auto"),
      })
    )
    .query(async ({ input }) => {
      // Get 7-day forecast
      const data = await fetchOpenMeteo("forecast", {
        latitude: input.latitude,
        longitude: input.longitude,
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max",
        timezone: input.timezone,
        forecast_days: 7,
      });

      const alerts = [];

      for (let i = 0; i < data.daily.time.length; i++) {
        const date = data.daily.time[i];
        const tempMax = data.daily.temperature_2m_max[i];
        const tempMin = data.daily.temperature_2m_min[i];
        const precipitation = data.daily.precipitation_sum[i];
        const windSpeed = data.daily.wind_speed_10m_max[i];
        const windGusts = data.daily.wind_gusts_10m_max[i];

        // High temperature alert
        if (tempMax > 40) {
          alerts.push({
            date,
            type: "extreme_heat",
            severity: "high",
            title: "تحذير: حرارة شديدة",
            description: `درجة الحرارة المتوقعة ${tempMax}°C. خطر على المحاصيل.`,
            value: tempMax,
          });
        } else if (tempMax > 35) {
          alerts.push({
            date,
            type: "high_temperature",
            severity: "medium",
            title: "تنبيه: حرارة عالية",
            description: `درجة الحرارة المتوقعة ${tempMax}°C. قد تحتاج المحاصيل لري إضافي.`,
            value: tempMax,
          });
        }

        // Frost alert
        if (tempMin < 0) {
          alerts.push({
            date,
            type: "frost",
            severity: "high",
            title: "تحذير: صقيع",
            description: `درجة الحرارة المتوقعة ${tempMin}°C. خطر الصقيع على المحاصيل.`,
            value: tempMin,
          });
        } else if (tempMin < 5) {
          alerts.push({
            date,
            type: "cold",
            severity: "medium",
            title: "تنبيه: برودة",
            description: `درجة الحرارة المتوقعة ${tempMin}°C. قد تتأثر بعض المحاصيل.`,
            value: tempMin,
          });
        }

        // Heavy rain alert
        if (precipitation > 50) {
          alerts.push({
            date,
            type: "heavy_rain",
            severity: "high",
            title: "تحذير: أمطار غزيرة",
            description: `أمطار متوقعة ${precipitation}mm. خطر الفيضانات.`,
            value: precipitation,
          });
        } else if (precipitation > 20) {
          alerts.push({
            date,
            type: "rain",
            severity: "medium",
            title: "تنبيه: أمطار",
            description: `أمطار متوقعة ${precipitation}mm. قد تحتاج لتأجيل الرش.`,
            value: precipitation,
          });
        }

        // Strong wind alert
        if (windGusts > 70) {
          alerts.push({
            date,
            type: "strong_wind",
            severity: "high",
            title: "تحذير: رياح قوية",
            description: `رياح متوقعة ${windGusts}km/h. خطر على المحاصيل والمعدات.`,
            value: windGusts,
          });
        } else if (windSpeed > 40) {
          alerts.push({
            date,
            type: "wind",
            severity: "medium",
            title: "تنبيه: رياح",
            description: `رياح متوقعة ${windSpeed}km/h. قد تحتاج لتأجيل الرش.`,
            value: windSpeed,
          });
        }
      }

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        alerts,
        alertCount: alerts.length,
      };
    }),

  /**
   * Get farm weather (combines current + forecast + agricultural indices)
   */
  getFarmWeather: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Get farm coordinates from database
      const { getDb } = await import("../db");
      const { farms } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const farm = await db.select().from(farms).where(eq(farms.id, input.farmId)).limit(1);
      if (farm.length === 0) {
        throw new Error("Farm not found");
      }

      const latitude = farm[0].latitude;
      const longitude = farm[0].longitude;

      if (!latitude || !longitude) {
        throw new Error("Farm coordinates not set");
      }

      // Get all weather data
      const [current, forecast, agricultural, alerts] = await Promise.all([
        fetchOpenMeteo("forecast", {
          latitude,
          longitude,
          current: "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
          timezone: "auto",
        }),
        fetchOpenMeteo("forecast", {
          latitude,
          longitude,
          daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration",
          timezone: "auto",
          forecast_days: 7,
        }),
        fetchOpenMeteo("forecast", {
          latitude,
          longitude,
          daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration,soil_moisture_0_to_7cm",
          timezone: "auto",
          forecast_days: 7,
        }),
        // Generate alerts from forecast
        (async () => {
          const data = await fetchOpenMeteo("forecast", {
            latitude,
            longitude,
            daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
            timezone: "auto",
            forecast_days: 7,
          });

          const alerts = [];
          for (let i = 0; i < data.daily.time.length; i++) {
            const tempMax = data.daily.temperature_2m_max[i];
            const tempMin = data.daily.temperature_2m_min[i];
            const precipitation = data.daily.precipitation_sum[i];
            const windSpeed = data.daily.wind_speed_10m_max[i];

            if (tempMax > 35 || tempMin < 5 || precipitation > 20 || windSpeed > 40) {
              alerts.push({
                date: data.daily.time[i],
                tempMax,
                tempMin,
                precipitation,
                windSpeed,
              });
            }
          }
          return alerts;
        })(),
      ]);

      return {
        farmId: input.farmId,
        farmName: farm[0].name,
        latitude,
        longitude,
        current: {
          temperature: current.current.temperature_2m,
          humidity: current.current.relative_humidity_2m,
          precipitation: current.current.precipitation,
          weatherCode: current.current.weather_code,
          windSpeed: current.current.wind_speed_10m,
        },
        forecast: forecast.daily.time.slice(0, 7).map((time: string, i: number) => ({
          date: time,
          temperatureMax: forecast.daily.temperature_2m_max[i],
          temperatureMin: forecast.daily.temperature_2m_min[i],
          precipitation: forecast.daily.precipitation_sum[i],
          weatherCode: forecast.daily.weather_code[i],
        })),
        agricultural: agricultural.daily.time.slice(0, 7).map((time: string, i: number) => ({
          date: time,
          evapotranspiration: agricultural.daily.et0_fao_evapotranspiration[i],
          soilMoisture: agricultural.daily.soil_moisture_0_to_7cm[i],
          irrigationNeed:
            agricultural.daily.et0_fao_evapotranspiration[i] - agricultural.daily.precipitation_sum[i] > 5
              ? "high"
              : agricultural.daily.et0_fao_evapotranspiration[i] - agricultural.daily.precipitation_sum[i] > 2
              ? "medium"
              : "low",
        })),
        alerts: alerts.length,
        hasAlerts: alerts.length > 0,
      };
    }),
});
