import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  TrendingUp,
  Database,
  Activity,
  Settings,
  CheckCircle2,
} from "lucide-react";

/**
 * صفحة المحاكي الشامل
 * Comprehensive Simulator Control Panel
 */
export default function Simulator() {
  const [isGenerating, setIsGenerating] = useState(false);

  // الحصول على حالة المحاكاة
  const { data: status, refetch: refetchStatus } = trpc.simulator.getStatus.useQuery(undefined, {
    refetchInterval: 2000, // تحديث كل ثانيتين
  });

  // Mutations
  const updateSettings = trpc.simulator.updateSettings.useMutation();
  const generateFarmData = trpc.simulator.generateFarmData.useMutation();
  const generateDroneImages = trpc.simulator.generateDroneImages.useMutation();
  const generateDiseaseDetections = trpc.simulator.generateDiseaseDetections.useMutation();
  const generateSatelliteImages = trpc.simulator.generateSatelliteImages.useMutation();
  const generateAll = trpc.simulator.generateAll.useMutation();
  const start = trpc.simulator.start.useMutation();
  const stop = trpc.simulator.stop.useMutation();
  const reset = trpc.simulator.reset.useMutation();

  // معالجات الأحداث
  const handleUpdateSettings = async (key: string, value: any) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
      toast.success("تم تحديث الإعدادات");
      refetchStatus();
    } catch (error: any) {
      toast.error("فشل تحديث الإعدادات: " + error.message);
    }
  };

  const handleGenerateFarmData = async () => {
    setIsGenerating(true);
    try {
      const result = await generateFarmData.mutateAsync({});
      toast.success(`تم توليد ${result.generated.farms.length} مزرعة بنجاح`);
      refetchStatus();
    } catch (error: any) {
      toast.error("فشل توليد بيانات المزارع: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDroneImages = async () => {
    setIsGenerating(true);
    try {
      const result = await generateDroneImages.mutateAsync({ count: 10 });
      toast.success(`تم توليد ${result.generated.length} صورة طائرة`);
      refetchStatus();
    } catch (error: any) {
      toast.error("فشل توليد صور الطائرات: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDiseaseDetections = async () => {
    setIsGenerating(true);
    try {
      const result = await generateDiseaseDetections.mutateAsync({ count: 5 });
      toast.success(`تم توليد ${result.generated.length} كشف مرض`);
      refetchStatus();
    } catch (error: any) {
      toast.error("فشل توليد كشف الأمراض: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSatelliteImages = async () => {
    setIsGenerating(true);
    try {
      const result = await generateSatelliteImages.mutateAsync({ count: 3 });
      toast.success(`تم توليد ${result.generated.length} صورة فضائية`);
      refetchStatus();
    } catch (error: any) {
      toast.error("فشل توليد الصور الفضائية: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    try {
      await generateAll.mutateAsync();
      toast.success("تم توليد جميع البيانات بنجاح!");
      refetchStatus();
    } catch (error: any) {
      toast.error("فشل توليد البيانات: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStart = async () => {
    try {
      await start.mutateAsync();
      toast.success("تم تشغيل المحاكاة التلقائية");
      refetchStatus();
    } catch (error: any) {
      toast.error("فشل تشغيل المحاكاة: " + error.message);
    }
  };

  const handleStop = async () => {
    try {
      await stop.mutateAsync();
      toast.success("تم إيقاف المحاكاة التلقائية");
      refetchStatus();
    } catch (error: any) {
      toast.error("فشل إيقاف المحاكاة: " + error.message);
    }
  };

  const handleReset = async () => {
    try {
      await reset.mutateAsync();
      toast.success("تم إعادة تعيين الإحصائيات");
      refetchStatus();
    } catch (error: any) {
      toast.error("فشل إعادة التعيين: " + error.message);
    }
  };

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">جاري تحميل المحاكي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* العنوان */}
      <div>
        <h1 className="text-3xl font-bold mb-2">المحاكي الشامل</h1>
        <p className="text-muted-foreground">
          توليد بيانات وهمية لاختبار جميع ميزات المنصة
        </p>
      </div>

      {/* حالة المحاكاة */}
      <Card className={status.isRunning ? "border-green-500" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className={status.isRunning ? "animate-pulse text-green-500" : ""} />
                حالة المحاكاة
              </CardTitle>
              <CardDescription>
                {status.isRunning ? "المحاكاة التلقائية قيد التشغيل" : "المحاكاة متوقفة"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!status.isRunning ? (
                <Button onClick={handleStart} size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  تشغيل
                </Button>
              ) : (
                <Button onClick={handleStop} variant="destructive" size="sm">
                  <Pause className="w-4 h-4 mr-2" />
                  إيقاف
                </Button>
              )}
              <Button onClick={handleReset} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            آخر تشغيل: {status.lastRun ? new Date(status.lastRun).toLocaleString("ar-SA") : "لم يتم التشغيل بعد"}
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              بيانات المزارع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المزارع:</span>
                <span className="font-bold">{status.stats.farmsGenerated}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الحقول:</span>
                <span className="font-bold">{status.stats.fieldsGenerated}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المعدات:</span>
                <span className="font-bold">{status.stats.equipmentGenerated}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              صور الطائرات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{status.stats.droneImagesGenerated}</div>
            <p className="text-xs text-muted-foreground mt-1">صورة مولّدة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" />
              كشف الأمراض
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{status.stats.diseaseDetectionsGenerated}</div>
            <p className="text-xs text-muted-foreground mt-1">كشف مولّد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              الصور الفضائية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{status.stats.satelliteImagesGenerated}</div>
            <p className="text-xs text-muted-foreground mt-1">صورة مولّدة</p>
          </CardContent>
        </Card>
      </div>

      {/* أزرار التوليد السريع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            توليد سريع
          </CardTitle>
          <CardDescription>توليد بيانات وهمية بنقرة واحدة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              onClick={handleGenerateFarmData}
              disabled={isGenerating}
              variant="outline"
              className="w-full"
            >
              <Database className="w-4 h-4 mr-2" />
              توليد مزارع
            </Button>
            <Button
              onClick={handleGenerateDroneImages}
              disabled={isGenerating}
              variant="outline"
              className="w-full"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              توليد صور طائرات
            </Button>
            <Button
              onClick={handleGenerateDiseaseDetections}
              disabled={isGenerating}
              variant="outline"
              className="w-full"
            >
              <Activity className="w-4 h-4 mr-2" />
              توليد كشف أمراض
            </Button>
            <Button
              onClick={handleGenerateSatelliteImages}
              disabled={isGenerating}
              variant="outline"
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              توليد صور فضائية
            </Button>
            <Button
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="w-full md:col-span-2"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isGenerating ? "جاري التوليد..." : "توليد كل شيء"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* الإعدادات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إعدادات المحاكاة
          </CardTitle>
          <CardDescription>تخصيص معدلات التوليد والإعدادات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="farmCount">عدد المزارع</Label>
              <Input
                id="farmCount"
                type="number"
                min={1}
                max={20}
                value={status.settings.farmCount}
                onChange={(e) => handleUpdateSettings("farmCount", parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">عدد المزارع المولّدة في كل مرة</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldPerFarm">الحقول لكل مزرعة</Label>
              <Input
                id="fieldPerFarm"
                type="number"
                min={1}
                max={10}
                value={status.settings.fieldPerFarm}
                onChange={(e) => handleUpdateSettings("fieldPerFarm", parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">عدد الحقول لكل مزرعة</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentPerFarm">المعدات لكل مزرعة</Label>
              <Input
                id="equipmentPerFarm"
                type="number"
                min={1}
                max={10}
                value={status.settings.equipmentPerFarm}
                onChange={(e) => handleUpdateSettings("equipmentPerFarm", parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">عدد المعدات لكل مزرعة</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="droneImageInterval">فترة صور الطائرات (ثانية)</Label>
              <Input
                id="droneImageInterval"
                type="number"
                min={10}
                value={status.settings.droneImageInterval / 1000}
                onChange={(e) => handleUpdateSettings("droneImageInterval", parseInt(e.target.value) * 1000)}
              />
              <p className="text-xs text-muted-foreground">الفترة بين توليد صور الطائرات</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="satelliteImageInterval">فترة الصور الفضائية (ثانية)</Label>
              <Input
                id="satelliteImageInterval"
                type="number"
                min={60}
                value={status.settings.satelliteImageInterval / 1000}
                onChange={(e) => handleUpdateSettings("satelliteImageInterval", parseInt(e.target.value) * 1000)}
              />
              <p className="text-xs text-muted-foreground">الفترة بين توليد الصور الفضائية</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diseaseDetectionInterval">فترة كشف الأمراض (ثانية)</Label>
              <Input
                id="diseaseDetectionInterval"
                type="number"
                min={30}
                value={status.settings.diseaseDetectionInterval / 1000}
                onChange={(e) => handleUpdateSettings("diseaseDetectionInterval", parseInt(e.target.value) * 1000)}
              />
              <p className="text-xs text-muted-foreground">الفترة بين توليد كشف الأمراض</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="autoGenerate">التوليد التلقائي</Label>
              <p className="text-xs text-muted-foreground">
                توليد البيانات تلقائياً بناءً على الفترات المحددة
              </p>
            </div>
            <Switch
              id="autoGenerate"
              checked={status.settings.autoGenerate}
              onCheckedChange={(checked) => handleUpdateSettings("autoGenerate", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
