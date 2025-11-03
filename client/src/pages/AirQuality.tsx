import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Wind,
  AlertTriangle,
  Leaf,
  RefreshCw,
  Loader2,
  Info,
  Activity,
  Shield,
} from "lucide-react";

/**
 * Air Quality Page (IQAir API)
 * Monitor air quality and its impact on crops and farm workers
 */
export default function AirQuality() {
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [selectedPollutant, setSelectedPollutant] = useState<string>("pm25");

  // Fetch farms
  const { data: farms, isLoading: farmsLoading } = trpc.farms.list.useQuery();

  // Fetch air quality data
  const { data: airQualityData, isLoading: airQualityLoading, refetch } = trpc.airQuality.getFarmAirQuality.useQuery(
    { farmId: selectedFarmId! },
    { enabled: !!selectedFarmId, refetchInterval: 1800000 } // Refetch every 30 minutes
  );

  // Fetch pollutant info
  const { data: pollutantInfo } = trpc.airQuality.getPollutantInfo.useQuery(
    { pollutant: selectedPollutant as any },
    { enabled: !!selectedPollutant }
  );

  const isLoading = farmsLoading || airQualityLoading;

  // Helper: Get AQI color
  const getAQIColor = (color: string) => {
    const colors: Record<string, string> = {
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      orange: "bg-orange-500",
      red: "bg-red-500",
      purple: "bg-purple-500",
      maroon: "bg-red-900",
    };
    return colors[color] || "bg-gray-500";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">جودة الهواء</h1>
          <p className="text-muted-foreground mt-1">
            مراقبة جودة الهواء وتأثيرها على المحاصيل والعمال (IQAir)
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
          <CardDescription>اختر مزرعة لعرض جودة الهواء</CardDescription>
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

      {/* Air Quality Data */}
      {!isLoading && airQualityData && (
        <div className="space-y-6">
          {/* AQI Card */}
          <Card>
            <CardHeader>
              <CardTitle>مؤشر جودة الهواء (AQI)</CardTitle>
              <CardDescription>
                {airQualityData.location.city}, {airQualityData.location.state}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-5xl font-bold">{airQualityData.airQuality.aqi}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    الملوث الرئيسي: {airQualityData.airQuality.mainPollutant.toUpperCase()}
                  </div>
                </div>
                <Badge
                  className={`${getAQIColor(airQualityData.airQuality.color)} text-white text-lg px-4 py-2`}
                >
                  {airQualityData.airQuality.level}
                </Badge>
              </div>
              <Progress
                value={(airQualityData.airQuality.aqi / 300) * 100}
                className="h-3"
              />
              <p className="text-sm">{airQualityData.airQuality.description}</p>
            </CardContent>
          </Card>

          {/* Alerts */}
          {airQualityData.alerts.length > 0 && (
            <div className="space-y-2">
              {airQualityData.alerts.map((alert, index) => (
                <Alert key={index} variant={alert.severity === "high" ? "destructive" : "default"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          <Tabs defaultValue="recommendations" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
              <TabsTrigger value="cropImpact">تأثير المحاصيل</TabsTrigger>
              <TabsTrigger value="pollutants">الملوثات</TabsTrigger>
            </TabsList>

            {/* Recommendations */}
            <TabsContent value="recommendations" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      العمال الزراعيون
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{airQualityData.recommendations.farmWorkers}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wind className="h-5 w-5" />
                      الرش
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{airQualityData.recommendations.spraying}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      الري
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{airQualityData.recommendations.irrigation}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="h-5 w-5" />
                      الحصاد
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{airQualityData.recommendations.harvesting}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Crop Impact */}
            <TabsContent value="cropImpact" className="space-y-4">
              {airQualityData.cropImpact.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Leaf className="h-12 w-12 text-green-500 mb-4" />
                    <p className="text-lg font-medium">جودة الهواء جيدة</p>
                    <p className="text-sm text-muted-foreground">لا تأثير سلبي على المحاصيل</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {airQualityData.cropImpact.map((impact, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{impact.description}</CardTitle>
                          <Badge variant={
                            impact.severity === "high" ? "destructive" :
                            impact.severity === "medium" ? "secondary" : "outline"
                          }>
                            {impact.severity === "high" ? "عالي" :
                             impact.severity === "medium" ? "متوسط" : "منخفض"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{impact.recommendation}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Pollutants */}
            <TabsContent value="pollutants" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>اختر ملوث لمعرفة التفاصيل</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedPollutant}
                    onValueChange={setSelectedPollutant}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pm25">PM2.5 - الجسيمات الدقيقة</SelectItem>
                      <SelectItem value="pm10">PM10 - الجسيمات الخشنة</SelectItem>
                      <SelectItem value="o3">O₃ - الأوزون</SelectItem>
                      <SelectItem value="no2">NO₂ - ثاني أكسيد النيتروجين</SelectItem>
                      <SelectItem value="so2">SO₂ - ثاني أكسيد الكبريت</SelectItem>
                      <SelectItem value="co">CO - أول أكسيد الكربون</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {pollutantInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle>{pollutantInfo.name}</CardTitle>
                    <CardDescription>{pollutantInfo.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">المصادر:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {pollutantInfo.sources.map((source: string, i: number) => (
                          <li key={i}>{source}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">التأثيرات الصحية:</h4>
                      <p className="text-sm text-muted-foreground">{pollutantInfo.healthEffects}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">التأثيرات على المحاصيل:</h4>
                      <p className="text-sm text-muted-foreground">{pollutantInfo.cropEffects}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">التوصيات:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {pollutantInfo.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Info className="h-4 w-4" />
                      <span className="text-sm">
                        المستوى الآمن: {pollutantInfo.safeLevel} {
                          selectedPollutant.startsWith("pm") ? "μg/m³" :
                          selectedPollutant === "co" ? "ppm" : "ppb"
                        }
                      </span>
                    </div>

                    {pollutantInfo.sensitiveCrops && (
                      <div>
                        <h4 className="font-medium mb-2">المحاصيل الحساسة:</h4>
                        <div className="flex flex-wrap gap-2">
                          {pollutantInfo.sensitiveCrops.map((crop: string, i: number) => (
                            <Badge key={i} variant="outline">{crop}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Empty State */}
      {!selectedFarmId && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wind className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">اختر مزرعة لعرض جودة الهواء</p>
            <p className="text-sm text-muted-foreground">مراقبة تأثير الهواء على المحاصيل والعمال</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
