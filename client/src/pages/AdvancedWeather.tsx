import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  Eye,
  Gauge,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Leaf,
  RefreshCw,
  Loader2,
} from "lucide-react";

/**
 * Advanced Weather Page (Open-Meteo API)
 * Free weather data with 70+ years of historical data
 */
export default function AdvancedWeather() {
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  // Fetch farms
  const { data: farms, isLoading: farmsLoading } = trpc.farms.list.useQuery();

  // Fetch weather data
  const { data: weatherData, isLoading: weatherLoading, refetch } = trpc.openMeteo.getFarmWeather.useQuery(
    { farmId: selectedFarmId! },
    { enabled: !!selectedFarmId, refetchInterval: 300000 } // Refetch every 5 minutes
  );

  const isLoading = farmsLoading || weatherLoading;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">الطقس المتقدم</h1>
          <p className="text-muted-foreground mt-1">
            بيانات طقس مجانية مع 70+ سنة من البيانات التاريخية (Open-Meteo)
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={!selectedFarmId || isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Farm Selection */}
      <Card>
        <CardHeader>
          <CardTitle>اختر المزرعة</CardTitle>
          <CardDescription>اختر مزرعة لعرض بيانات الطقس المتقدمة</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedFarmId?.toString() || ""}
            onValueChange={(value) => setSelectedFarmId(Number(value))}
            disabled={farmsLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر مزرعة..." />
            </SelectTrigger>
            <SelectContent>
              {farms?.map((farm) => (
                <SelectItem key={farm.id} value={farm.id.toString()}>
                  {farm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && selectedFarmId && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Weather Data */}
      {!isLoading && weatherData && (
        <Tabs defaultValue="current" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="current">الطقس الحالي</TabsTrigger>
            <TabsTrigger value="forecast">التوقعات</TabsTrigger>
            <TabsTrigger value="agricultural">المؤشرات الزراعية</TabsTrigger>
            <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
          </TabsList>

          {/* Current Weather */}
          <TabsContent value="current" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Temperature */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">درجة الحرارة</CardTitle>
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{weatherData.current.temperature}°C</div>
                  <p className="text-xs text-muted-foreground">
                    الإحساس: {weatherData.current.apparentTemperature}°C
                  </p>
                </CardContent>
              </Card>

              {/* Humidity */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الرطوبة</CardTitle>
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{weatherData.current.humidity}%</div>
                  <p className="text-xs text-muted-foreground">
                    نقطة الندى: {weatherData.current.dewPoint}°C
                  </p>
                </CardContent>
              </Card>

              {/* Wind */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الرياح</CardTitle>
                  <Wind className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{weatherData.current.windSpeed} كم/س</div>
                  <p className="text-xs text-muted-foreground">
                    الاتجاه: {weatherData.current.windDirection}°
                  </p>
                </CardContent>
              </Card>

              {/* Pressure */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الضغط الجوي</CardTitle>
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{weatherData.current.pressure} hPa</div>
                  <p className="text-xs text-muted-foreground">
                    الغيوم: {weatherData.current.cloudCover}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">الأمطار</div>
                  <div className="text-2xl font-bold">{weatherData.current.precipitation} مم</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">الرؤية</div>
                  <div className="text-2xl font-bold">{(weatherData.current.visibility / 1000).toFixed(1)} كم</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">الأشعة فوق البنفسجية</div>
                  <div className="text-2xl font-bold">{weatherData.current.uvIndex}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecast */}
          <TabsContent value="forecast" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>توقعات 7 أيام</CardTitle>
                <CardDescription>توقعات الطقس للأيام القادمة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weatherData.forecast.map((day, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{day.date}</div>
                          <div className="text-sm text-muted-foreground">{day.dayName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">الحرارة</div>
                          <div className="font-medium">
                            {day.temperatureMax}° / {day.temperatureMin}°
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">الأمطار</div>
                          <div className="font-medium">{day.precipitationSum} مم</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">الرياح</div>
                          <div className="font-medium">{day.windSpeedMax} كم/س</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agricultural Indices */}
          <TabsContent value="agricultural" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weatherData.agriculturalIndices.map((index, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="h-5 w-5" />
                      {index.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">القيمة:</span>
                      <Badge variant={
                        index.level === "good" ? "default" :
                        index.level === "moderate" ? "secondary" :
                        index.level === "poor" ? "destructive" : "outline"
                      }>
                        {index.value}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">المستوى:</span>
                      <span className="text-sm font-medium">{index.levelDescription}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{index.description}</p>
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium mb-1">التوصية:</div>
                      <div className="text-sm">{index.recommendation}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Alerts */}
          <TabsContent value="alerts" className="space-y-4">
            {weatherData.alerts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CloudSun className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">لا توجد تنبيهات حالياً</p>
                  <p className="text-sm text-muted-foreground">الطقس مستقر</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {weatherData.alerts.map((alert, index) => (
                  <Alert key={index} variant={alert.severity === "high" ? "destructive" : "default"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!selectedFarmId && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CloudSun className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">اختر مزرعة لعرض بيانات الطقس</p>
            <p className="text-sm text-muted-foreground">بيانات مجانية مع 70+ سنة من التاريخ</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
