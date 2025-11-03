import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getRedis } from "../_core/redis";
import { TRPCError } from "@trpc/server";

/**
 * PVWatts API Router (NREL)
 * Solar energy potential calculator for farms
 * 
 * Features:
 * - Solar energy production estimates
 * - Cost savings calculations
 * - ROI analysis
 * - Best panel placement recommendations
 * 
 * Note: Requires NREL_API_KEY environment variable (free from https://developer.nrel.gov/signup/)
 */

const BASE_URL = "https://developer.nrel.gov/api/pvwatts/v8.json";

// Helper function to fetch from NREL PVWatts
async function fetchPVWatts(params: Record<string, any>) {
  const apiKey = process.env.NREL_API_KEY;
  if (!apiKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "NREL API key not configured. Get free key from https://developer.nrel.gov/signup/",
    });
  }

  const url = new URL(BASE_URL);
  url.searchParams.append("api_key", apiKey);
  url.searchParams.append("format", "json");
  
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
      message: `NREL PVWatts API error: ${error.message || response.statusText}`,
    });
  }
  return response.json();
}

export const solarEnergyRouter = router({
  /**
   * Calculate solar potential for a location
   */
  calculatePotential: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        systemCapacity: z.number().positive().default(10), // kW
        moduleType: z.enum(["0", "1", "2"]).default("1"), // 0=Standard, 1=Premium, 2=Thin film
        arrayType: z.enum(["0", "1", "2", "3", "4"]).default("1"), // 0=Fixed Open Rack, 1=Fixed Roof, 2=1-Axis, 3=1-Axis Backtrack, 4=2-Axis
        tilt: z.number().min(0).max(90).optional(), // degrees (default: latitude)
        azimuth: z.number().min(0).max(360).default(180), // degrees (180=south)
        losses: z.number().min(0).max(99).default(14), // system losses %
      })
    )
    .query(async ({ input }) => {
      const redis = await getRedis();
      const cacheKey = `pvwatts:${input.latitude}:${input.longitude}:${input.systemCapacity}:${input.moduleType}:${input.arrayType}`;

      // Try cache first (24 hours - solar data doesn't change often)
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const data = await fetchPVWatts({
        lat: input.latitude,
        lon: input.longitude,
        system_capacity: input.systemCapacity,
        module_type: input.moduleType,
        array_type: input.arrayType,
        tilt: input.tilt || input.latitude, // Use latitude as default tilt
        azimuth: input.azimuth,
        losses: input.losses,
      });

      const outputs = data.outputs;
      const station = data.station_info;

      // Calculate monthly averages
      const monthlyProduction = [];
      const monthNames = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
      ];

      for (let i = 0; i < 12; i++) {
        monthlyProduction.push({
          month: monthNames[i],
          monthNumber: i + 1,
          production: outputs.ac_monthly[i], // kWh
          solarRadiation: outputs.solrad_monthly[i], // kWh/m²/day
          dcProduction: outputs.dc_monthly[i], // kWh
        });
      }

      const result = {
        location: {
          latitude: station.lat,
          longitude: station.lon,
          city: station.city,
          state: station.state,
          elevation: station.elev,
          timezone: station.tz,
        },
        system: {
          capacity: input.systemCapacity, // kW
          moduleType: input.moduleType === "0" ? "Standard" : input.moduleType === "1" ? "Premium" : "Thin Film",
          arrayType: 
            input.arrayType === "0" ? "Fixed Open Rack" :
            input.arrayType === "1" ? "Fixed Roof" :
            input.arrayType === "2" ? "1-Axis Tracking" :
            input.arrayType === "3" ? "1-Axis Backtracking" : "2-Axis Tracking",
          tilt: input.tilt || input.latitude,
          azimuth: input.azimuth,
          losses: input.losses,
        },
        annual: {
          production: outputs.ac_annual, // kWh/year
          solarRadiation: outputs.solrad_annual, // kWh/m²/day average
          dcProduction: outputs.dc_annual, // kWh/year
          capacityFactor: outputs.capacity_factor, // %
        },
        monthly: monthlyProduction,
        performance: {
          acLosses: outputs.ac_losses, // %
          dcLosses: outputs.dc_losses, // %
          efficiency: ((outputs.ac_annual / outputs.dc_annual) * 100).toFixed(2), // %
        },
      };

      // Cache for 24 hours
      if (redis) {
        await redis.setex(cacheKey, 86400, JSON.stringify(result));
      }

      return result;
    }),

  /**
   * Calculate cost savings and ROI
   */
  calculateSavings: publicProcedure
    .input(
      z.object({
        annualProduction: z.number().positive(), // kWh/year
        electricityRate: z.number().positive().default(0.15), // $/kWh (default: $0.15)
        systemCost: z.number().positive(), // $ total system cost
        maintenanceCost: z.number().nonnegative().default(100), // $/year
        incentives: z.number().nonnegative().default(0), // $ government incentives
        degradationRate: z.number().min(0).max(5).default(0.5), // %/year
        years: z.number().int().min(1).max(30).default(25), // analysis period
      })
    )
    .query(async ({ input }) => {
      const netSystemCost = input.systemCost - input.incentives;
      
      // Calculate year-by-year savings
      const yearlyAnalysis = [];
      let cumulativeSavings = 0;
      let cumulativeCost = netSystemCost;

      for (let year = 1; year <= input.years; year++) {
        // Production degrades over time
        const degradationFactor = Math.pow(1 - input.degradationRate / 100, year - 1);
        const production = input.annualProduction * degradationFactor;
        
        // Savings (electricity cost avoided)
        const savings = production * input.electricityRate;
        
        // Costs (maintenance)
        const costs = input.maintenanceCost;
        
        // Net benefit this year
        const netBenefit = savings - costs;
        cumulativeSavings += netBenefit;
        cumulativeCost = netSystemCost - cumulativeSavings;

        yearlyAnalysis.push({
          year,
          production: Math.round(production),
          savings: Math.round(savings),
          costs: Math.round(costs),
          netBenefit: Math.round(netBenefit),
          cumulativeSavings: Math.round(cumulativeSavings),
          cumulativeCost: Math.round(cumulativeCost),
          paybackAchieved: cumulativeSavings >= netSystemCost,
        });
      }

      // Find payback period
      const paybackYear = yearlyAnalysis.find(y => y.paybackAchieved);
      const paybackPeriod = paybackYear ? paybackYear.year : null;

      // Calculate ROI
      const totalSavings = yearlyAnalysis[yearlyAnalysis.length - 1].cumulativeSavings;
      const roi = ((totalSavings - netSystemCost) / netSystemCost) * 100;

      // Calculate levelized cost of energy (LCOE)
      const totalProduction = yearlyAnalysis.reduce((sum, y) => sum + y.production, 0);
      const totalCosts = netSystemCost + (input.maintenanceCost * input.years);
      const lcoe = totalCosts / totalProduction;

      return {
        summary: {
          systemCost: input.systemCost,
          incentives: input.incentives,
          netSystemCost,
          totalSavings: Math.round(totalSavings),
          netProfit: Math.round(totalSavings - netSystemCost),
          roi: roi.toFixed(2),
          paybackPeriod: paybackPeriod ? `${paybackPeriod} سنة` : `أكثر من ${input.years} سنة`,
          lcoe: lcoe.toFixed(3), // $/kWh
        },
        yearlyAnalysis,
        recommendations: {
          worthIt: roi > 0,
          message: 
            roi > 100 ? "استثمار ممتاز! عائد مرتفع جداً" :
            roi > 50 ? "استثمار جيد جداً" :
            roi > 20 ? "استثمار جيد" :
            roi > 0 ? "استثمار مقبول" :
            "قد لا يكون مجدياً اقتصادياً",
          tips: [
            paybackPeriod && paybackPeriod <= 10 ? "فترة استرداد ممتازة" : "فكر في زيادة الحوافز أو تقليل التكاليف",
            lcoe < input.electricityRate ? "تكلفة الطاقة أقل من سعر الكهرباء" : "تكلفة الطاقة مرتفعة نسبياً",
            "فكر في بطاريات لتخزين الطاقة الفائضة",
            "صيانة منتظمة تحافظ على الكفاءة",
          ],
        },
      };
    }),

  /**
   * Get recommendations for farm solar installation
   */
  getFarmRecommendations: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        farmArea: z.number().positive(), // hectares
        monthlyElectricityBill: z.number().positive(), // $
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

      // Estimate electricity consumption
      const annualConsumption = input.monthlyElectricityBill * 12 / 0.15; // Assuming $0.15/kWh

      // Calculate recommended system size (cover 80% of consumption)
      const recommendedCapacity = (annualConsumption * 0.8) / 1500; // Assuming 1500 kWh/kW/year

      // Get solar potential
      const solarData = await fetchPVWatts({
        lat: latitude,
        lon: longitude,
        system_capacity: recommendedCapacity,
        module_type: 1, // Premium
        array_type: 2, // 1-Axis tracking (better for farms)
        tilt: latitude,
        azimuth: 180,
        losses: 14,
      });

      const outputs = solarData.outputs;

      // Calculate available roof/ground space
      const availableSpace = input.farmArea * 10000; // m² (1 hectare = 10,000 m²)
      const usableSpace = availableSpace * 0.1; // Use 10% of farm area
      const maxSystemSize = usableSpace / 7; // Assuming 7 m²/kW

      return {
        farmId: input.farmId,
        farmName: farm[0].name,
        analysis: {
          annualConsumption: Math.round(annualConsumption), // kWh
          monthlyBill: input.monthlyElectricityBill, // $
          recommendedSystemSize: Math.round(recommendedCapacity * 10) / 10, // kW
          maxSystemSize: Math.round(maxSystemSize * 10) / 10, // kW
          coveragePercentage: 80, // %
        },
        solarPotential: {
          annualProduction: Math.round(outputs.ac_annual), // kWh
          monthlySavings: Math.round((outputs.ac_annual / 12) * 0.15), // $
          annualSavings: Math.round(outputs.ac_annual * 0.15), // $
          capacityFactor: outputs.capacity_factor, // %
        },
        recommendations: {
          systemType: "1-Axis Tracking",
          reason: "أفضل للمزارع - يتتبع الشمس ويزيد الإنتاج بنسبة 25-35%",
          placement: [
            "ضع الألواح على أسطح المباني أولاً",
            "استخدم الأراضي غير المزروعة",
            "تجنب المناطق المظللة بالأشجار",
            "اترك مسافة 3-4 أمتار بين الصفوف",
          ],
          benefits: [
            "تقليل فاتورة الكهرباء بنسبة 80%",
            "طاقة نظيفة ومستدامة",
            "استقلالية عن شبكة الكهرباء",
            "زيادة قيمة المزرعة",
            "حوافز حكومية متاحة",
          ],
          considerations: [
            `التكلفة المقدرة: $${Math.round(recommendedCapacity * 2000)} - $${Math.round(recommendedCapacity * 3000)}`,
            "فترة الاسترداد: 7-10 سنوات",
            "العمر الافتراضي: 25-30 سنة",
            "الصيانة: منخفضة (تنظيف دوري)",
          ],
        },
        nextSteps: [
          "احصل على عروض أسعار من 3-5 مقاولين",
          "تحقق من الحوافز الحكومية المتاحة",
          "فكر في بطاريات لتخزين الطاقة",
          "خطط لتوسيع النظام مستقبلاً",
        ],
      };
    }),
});
