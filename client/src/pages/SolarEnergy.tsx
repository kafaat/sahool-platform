import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Sun,
  DollarSign,
  TrendingUp,
  Zap,
  Calendar,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Line } from "react-chartjs-2";

/**
 * Solar Energy Page (PVWatts API)
 * Calculate solar potential and ROI for farms
 */
export default function SolarEnergy() {
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [monthlyBill, setMonthlyBill] = useState<number>(500);

  // Fetch farms
  const { data: farms, isLoading: farmsLoading } = trpc.farms.list.useQuery();

  // Get selected farm details
  const selectedFarm = farms?.find(f => f.id === selectedFarmId);

  // Fetch solar recommendations
  const { data: solarData, isLoading: solarLoading } = trpc.solarEnergy.getFarmRecommendations.useQuery(
    {
      farmId: selectedFarmId!,
      farmArea: selectedFarm?.area || 10, // hectares
      monthlyElectricityBill: monthlyBill,
    },
    { enabled: !!selectedFarmId && !!selectedFarm }
  );

  const isLoading = farmsLoading || solarLoading;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">الطاقة الشمسية</h1>
          <p className="text-muted-foreground mt-1">
            احسب إمكانيات الطاقة الشمسية والعائد على الاستثمار (PVWatts)
          </p>
        </div>
      </div>

      {/* Farm Selection */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>اختر المزرعة</CardTitle>
            <CardDescription>اختر مزرعة لحساب الإمكانيات الشمسية</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle>فاتورة الكهرباء الشهرية</CardTitle>
            <CardDescription>أدخل متوسط فاتورتك الشهرية ($)</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="number"
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="500"
              min="0"
            />
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && selectedFarmId && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Solar Data */}
      {!isLoading && solarData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الحجم الموصى به</CardTitle>
                <Sun className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{solarData.analysis.recommendedSystemSize} kW</div>
                <p className="text-xs text-muted-foreground">
                  يغطي {solarData.analysis.coveragePercentage}% من الاستهلاك
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الإنتاج السنوي</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {solarData.solarPotential.annualProduction.toLocaleString()} kWh
                </div>
                <p className="text-xs text-muted-foreground">
                  معامل السعة: {solarData.solarPotential.capacityFactor}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">التوفير السنوي</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${solarData.solarPotential.annualSavings.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  شهرياً: ${solarData.solarPotential.monthlySavings}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الحد الأقصى</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{solarData.analysis.maxSystemSize} kW</div>
                <p className="text-xs text-muted-foreground">
                  المساحة المتاحة
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="recommendations" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
              <TabsTrigger value="benefits">الفوائد</TabsTrigger>
              <TabsTrigger value="nextSteps">الخطوات التالية</TabsTrigger>
            </TabsList>

            {/* Recommendations */}
            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>نوع النظام الموصى به</CardTitle>
                  <CardDescription>{solarData.recommendations.systemType}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <p className="text-sm">{solarData.recommendations.reason}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>موضع الألواح</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {solarData.recommendations.placement.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>اعتبارات مهمة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {solarData.recommendations.considerations.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Benefits */}
            <TabsContent value="benefits" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {solarData.recommendations.benefits.map((benefit, i) => (
                  <Card key={i}>
                    <CardContent className="flex items-start gap-3 pt-6">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{benefit}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>التأثير البيئي</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(solarData.solarPotential.annualProduction * 0.0007)} طن
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">تقليل CO₂ سنوياً</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(solarData.solarPotential.annualProduction * 0.0003)} شجرة
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">ما يعادل زراعة</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(solarData.solarPotential.annualProduction * 0.001)} برميل
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">توفير نفط سنوياً</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Next Steps */}
            <TabsContent value="nextSteps" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>الخطوات التالية</CardTitle>
                  <CardDescription>ابدأ رحلتك نحو الطاقة الشمسية</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {solarData.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm font-medium">{step}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>موارد مفيدة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <a
                      href="https://www.nrel.gov/pv/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <Sun className="h-5 w-5" />
                      <div>
                        <div className="font-medium text-sm">NREL - المختبر الوطني للطاقة المتجددة</div>
                        <div className="text-xs text-muted-foreground">معلومات وأدوات الطاقة الشمسية</div>
                      </div>
                    </a>
                    <a
                      href="https://pvwatts.nrel.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <Zap className="h-5 w-5" />
                      <div>
                        <div className="font-medium text-sm">PVWatts Calculator</div>
                        <div className="text-xs text-muted-foreground">حاسبة الطاقة الشمسية المتقدمة</div>
                      </div>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Empty State */}
      {!selectedFarmId && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sun className="h-12 w-12 text-yellow-500 mb-4" />
            <p className="text-lg font-medium">اختر مزرعة لحساب الإمكانيات الشمسية</p>
            <p className="text-sm text-muted-foreground">وفّر المال وساعد البيئة</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
