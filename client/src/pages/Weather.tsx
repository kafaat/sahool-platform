import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Eye, Gauge, 
  Sunrise, Sunset, ThermometerSun, AlertTriangle, Loader2, TrendingUp,
  Sprout, Bug, Droplet, Flame, Snowflake, RefreshCw
} from "lucide-react";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// أيقونات الطقس
const weatherIcons: Record<string, any> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Snow: CloudSnow,
  Drizzle: CloudRain,
  Thunderstorm: CloudRain,
  Mist: Cloud,
  Smoke: Cloud,
  Haze: Cloud,
  Dust: Cloud,
  Fog: Cloud,
  Sand: Cloud,
  Ash: Cloud,
  Squall: Wind,
  Tornado: Wind,
};

export default function Weather() {
  const { user } = useAuth();
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // الحصول على قائمة المزارع
  const { data: farms } = trpc.farms.list.useQuery();

  // الحصول على طقس المزرعة المحددة
  const {
    data: weatherData,
    isLoading,
    error,
    refetch,
  } = trpc.weather.getFarmWeather.useQuery(
    { farmId: selectedFarmId! },
    {
      enabled: selectedFarmId !== null,
      staleTime: 10 * 60 * 1000, // 10 دقائق
      refetchInterval: autoRefresh ? 5 * 60 * 1000 : false, // 5 دقائق إذا كان التحديث التلقائي مفعل
    }
  );

  // الحصول على تنبيهات الطقس
  const { data: alerts } = trpc.weather.getAlerts.useQuery(
    {
      lat: 24.7136, // الرياض كمثال
      lon: 46.6753,
      farmId: selectedFarmId || undefined,
    },
    {
      enabled: selectedFarmId !== null,
      staleTime: 10 * 60 * 1000,
    }
  );

  // تعيين أول مزرعة كافتراضي
  useEffect(() => {
    if (farms && farms.length > 0 && selectedFarmId === null) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  const WeatherIcon = weatherData?.current.weather.main 
    ? weatherIcons[weatherData.current.weather.main] || Cloud
    : Cloud;

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">الطقس</h1>
            <p className="text-gray-500 mt-1">
              بيانات الطقس الحالية والتوقعات للمزارع
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedFarmId?.toString() || ""}
              onValueChange={(value) => setSelectedFarmId(parseInt(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="اختر مزرعة" />
              </SelectTrigger>
              <SelectContent>
                {farms?.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id.toString()}>
                    {farm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "إيقاف" : "تحديث تلقائي"}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">خطأ في تحميل بيانات الطقس</CardTitle>
              <CardDescription>{error.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => refetch()} variant="destructive">
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Weather Data */}
        {weatherData && (
          <>
            {/* تنبيهات الطقس */}
            {alerts && alerts.alerts.length > 0 && (
              <div className="grid gap-3">
                {alerts.alerts.map((alert, index) => (
                  <Card
                    key={index}
                    className={`border-l-4 ${
                      alert.severity === 'high'
                        ? 'border-l-red-500 bg-red-50'
                        : alert.severity === 'medium'
                        ? 'border-l-yellow-500 bg-yellow-50'
                        : 'border-l-blue-500 bg-blue-50'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{alert.icon}</span>
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{alert.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* الطقس الحالي */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WeatherIcon className="h-6 w-6" />
                  الطقس الحالي
                </CardTitle>
                <CardDescription>
                  {weatherData.farm.name} - {weatherData.farm.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* درجة الحرارة */}
                  <div className="text-center">
                    <ThermometerSun className="h-12 w-12 mx-auto text-orange-500 mb-2" />
                    <div className="text-4xl font-bold">
                      {weatherData.current.temp}°C
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {weatherData.current.weather.description}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      يشعر بـ {weatherData.current.feelsLike}°C
                    </div>
                  </div>

                  {/* الرطوبة */}
                  <div className="text-center">
                    <Droplets className="h-10 w-10 mx-auto text-blue-500 mb-2" />
                    <div className="text-3xl font-bold">
                      {weatherData.current.humidity}%
                    </div>
                    <div className="text-sm text-gray-500 mt-1">الرطوبة</div>
                  </div>

                  {/* الرياح */}
                  <div className="text-center">
                    <Wind className="h-10 w-10 mx-auto text-gray-500 mb-2" />
                    <div className="text-3xl font-bold">
                      {weatherData.current.windSpeed}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">كم/س</div>
                    <div className="text-xs text-gray-400 mt-2">
                      اتجاه: {weatherData.current.windDeg}°
                    </div>
                  </div>

                  {/* الضغط */}
                  <div className="text-center">
                    <Gauge className="h-10 w-10 mx-auto text-purple-500 mb-2" />
                    <div className="text-3xl font-bold">
                      {weatherData.current.pressure}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">هكتوباسكال</div>
                  </div>
                </div>

                {/* معلومات إضافية */}
                <div className="grid md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">الرؤية</div>
                      <div className="font-semibold">{weatherData.current.visibility} كم</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">الغيوم</div>
                      <div className="font-semibold">{weatherData.current.clouds}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sunrise className="h-5 w-5 text-orange-400" />
                    <div>
                      <div className="text-xs text-gray-500">الشروق</div>
                      <div className="font-semibold">
                        {new Date(weatherData.current.sunrise).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sunset className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="text-xs text-gray-500">الغروب</div>
                      <div className="font-semibold">
                        {new Date(weatherData.current.sunset).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* المؤشرات الزراعية */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* مؤشر الإجهاد الحراري */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Flame className="h-5 w-5 text-red-500" />
                    الإجهاد الحراري
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {weatherData.agricultural.heatStressIndex.value}
                  </div>
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                      weatherData.agricultural.heatStressIndex.level === 'high'
                        ? 'bg-red-100 text-red-700'
                        : weatherData.agricultural.heatStressIndex.level === 'moderate'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {weatherData.agricultural.heatStressIndex.level === 'high'
                      ? 'عالٍ'
                      : weatherData.agricultural.heatStressIndex.level === 'moderate'
                      ? 'متوسط'
                      : 'منخفض'}
                  </div>
                  <p className="text-sm text-gray-600">
                    {weatherData.agricultural.heatStressIndex.description}
                  </p>
                </CardContent>
              </Card>

              {/* حاجة الري */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Droplet className="h-5 w-5 text-blue-500" />
                    حاجة الري
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`inline-block px-4 py-2 rounded-full text-lg font-bold mb-2 ${
                      weatherData.agricultural.irrigationNeed.level === 'high'
                        ? 'bg-red-100 text-red-700'
                        : weatherData.agricultural.irrigationNeed.level === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {weatherData.agricultural.irrigationNeed.level === 'high'
                      ? 'عالية'
                      : weatherData.agricultural.irrigationNeed.level === 'medium'
                      ? 'متوسطة'
                      : 'منخفضة'}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {weatherData.agricultural.irrigationNeed.description}
                  </p>
                </CardContent>
              </Card>

              {/* ملاءمة الرش */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bug className="h-5 w-5 text-green-500" />
                    ملاءمة الرش
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`inline-block px-4 py-2 rounded-full text-lg font-bold mb-2 ${
                      weatherData.agricultural.sprayingSuitability.level === 'good'
                        ? 'bg-green-100 text-green-700'
                        : weatherData.agricultural.sprayingSuitability.level === 'moderate'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {weatherData.agricultural.sprayingSuitability.level === 'good'
                      ? 'مناسب'
                      : weatherData.agricultural.sprayingSuitability.level === 'moderate'
                      ? 'مناسب جزئياً'
                      : 'غير مناسب'}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {weatherData.agricultural.sprayingSuitability.description}
                  </p>
                </CardContent>
              </Card>

              {/* خطر الصقيع */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Snowflake className="h-5 w-5 text-cyan-500" />
                    خطر الصقيع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`inline-block px-4 py-2 rounded-full text-lg font-bold mb-2 ${
                      weatherData.agricultural.frostRisk.level === 'high'
                        ? 'bg-red-100 text-red-700'
                        : weatherData.agricultural.frostRisk.level === 'moderate'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {weatherData.agricultural.frostRisk.level === 'high'
                      ? 'عالٍ'
                      : weatherData.agricultural.frostRisk.level === 'moderate'
                      ? 'متوسط'
                      : 'لا يوجد'}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {weatherData.agricultural.frostRisk.description}
                  </p>
                </CardContent>
              </Card>

              {/* مؤشر نمو المحاصيل */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sprout className="h-5 w-5 text-green-600" />
                    مؤشر نمو المحاصيل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-bold text-green-600">
                      {weatherData.agricultural.cropGrowthIndex.value}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                        <div
                          className={`h-4 rounded-full ${
                            weatherData.agricultural.cropGrowthIndex.value > 80
                              ? 'bg-green-500'
                              : weatherData.agricultural.cropGrowthIndex.value > 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${weatherData.agricultural.cropGrowthIndex.value}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {weatherData.agricultural.cropGrowthIndex.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* توقعات الطقس */}
            <Card>
              <CardHeader>
                <CardTitle>توقعات الطقس (5 أيام)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {weatherData.forecast.map((day, index) => {
                    const DayWeatherIcon = weatherIcons[day.weather.main] || Cloud;
                    return (
                      <div
                        key={index}
                        className="text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="text-sm text-gray-500 mb-2">
                          {new Date(day.date).toLocaleDateString('ar-SA', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <DayWeatherIcon className="h-10 w-10 mx-auto mb-2 text-blue-500" />
                        <div className="text-xs text-gray-600 mb-2">
                          {day.weather.description}
                        </div>
                        <div className="flex justify-center items-center gap-2">
                          <span className="text-lg font-bold">{Math.round(day.temp.max)}°</span>
                          <span className="text-sm text-gray-400">{Math.round(day.temp.min)}°</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-500">
                          <Droplets className="h-3 w-3" />
                          <span>{day.humidity}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
