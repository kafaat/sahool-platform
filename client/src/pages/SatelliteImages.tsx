import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Satellite, Download, Calendar, MapPin, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function SatelliteImages() {
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [imageType, setImageType] = useState<"true_color" | "ndvi">("true_color");
  const [satelliteImage, setSatelliteImage] = useState<any>(null);

  const { data: farms } = trpc.farms.list.useQuery();

  const { data: fields } = trpc.fields.list.useQuery(
    { farmId: selectedFarmId! },
    { enabled: selectedFarmId !== null }
  );

  const getFieldImage = trpc.satelliteImages.getFieldSatelliteImage.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSatelliteImage(data);
        toast.success("تم جلب الصورة الفضائية بنجاح");
      } else {
        toast.error(data.error || "فشل جلب الصورة");
      }
    },
    onError: (error) => {
      toast.error("خطأ: " + error.message);
    },
  });

  // تعيين التواريخ الافتراضية (آخر 7 أيام)
  if (!dateFrom && !dateTo) {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(weekAgo.toISOString().split('T')[0]);
  }

  // اختيار أول مزرعة وحقل تلقائياً
  if (farms && farms.length > 0 && selectedFarmId === null) {
    setSelectedFarmId(farms[0].id);
  }

  if (fields && fields.length > 0 && selectedFieldId === null) {
    setSelectedFieldId(fields[0].id);
  }

  const handleFetchImage = () => {
    if (!selectedFieldId) {
      toast.error("يجب اختيار حقل");
      return;
    }

    if (!dateFrom || !dateTo) {
      toast.error("يجب اختيار التواريخ");
      return;
    }

    getFieldImage.mutate({
      fieldId: selectedFieldId,
      dateFrom,
      dateTo,
      imageType,
      resolution: 10,
    });
  };

  const handleDownloadImage = () => {
    if (!satelliteImage || !satelliteImage.imageBase64) {
      toast.error("لا توجد صورة للتحميل");
      return;
    }

    // تحويل base64 إلى blob وتحميله
    const byteCharacters = atob(satelliteImage.imageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `satellite_${imageType}_${dateTo}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("تم تحميل الصورة");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Satellite className="h-8 w-8" />
              الصور الفضائية
            </h1>
            <p className="text-muted-foreground mt-2">
              صور الأقمار الصناعية من Sentinel-2 مع تحليل NDVI
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الصورة</CardTitle>
            <CardDescription>
              اختر المزرعة والحقل والتواريخ لجلب الصور الفضائية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>المزرعة</Label>
                <Select
                  value={selectedFarmId?.toString()}
                  onValueChange={(value) => {
                    setSelectedFarmId(parseInt(value));
                    setSelectedFieldId(null);
                    setSatelliteImage(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المزرعة" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms?.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id.toString()}>
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>الحقل</Label>
                <Select
                  value={selectedFieldId?.toString()}
                  onValueChange={(value) => {
                    setSelectedFieldId(parseInt(value));
                    setSatelliteImage(null);
                  }}
                  disabled={!selectedFarmId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحقل" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields?.map((field) => (
                      <SelectItem key={field.id} value={field.id.toString()}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>نوع الصورة</Label>
                <Select
                  value={imageType}
                  onValueChange={(value: "true_color" | "ndvi") => {
                    setImageType(value);
                    setSatelliteImage(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true_color">صورة حقيقية (RGB)</SelectItem>
                    <SelectItem value="ndvi">NDVI (صحة المحاصيل)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <Label>إلى تاريخ</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleFetchImage}
                  disabled={!selectedFieldId || getFieldImage.isPending}
                  className="w-full"
                >
                  {getFieldImage.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الجلب...
                    </>
                  ) : (
                    <>
                      <Satellite className="h-4 w-4 ml-2" />
                      جلب الصورة
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Display */}
        {satelliteImage && satelliteImage.success && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {satelliteImage.fieldName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {satelliteImage.date}
                    </span>
                    <Badge variant="outline">
                      دقة: {satelliteImage.resolution}م
                    </Badge>
                    {imageType === "true_color" ? (
                      <Badge className="bg-blue-500">صورة حقيقية</Badge>
                    ) : (
                      <Badge className="bg-green-500">NDVI</Badge>
                    )}
                  </CardDescription>
                </div>
                <Button onClick={handleDownloadImage} variant="outline">
                  <Download className="h-4 w-4 ml-2" />
                  تحميل
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* NDVI Stats */}
                {imageType === "ndvi" && satelliteImage.ndviStats && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">متوسط NDVI</p>
                            <p className="text-2xl font-bold">
                              {satelliteImage.ndviStats.mean.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">أدنى NDVI</p>
                            <p className="text-2xl font-bold">
                              {satelliteImage.ndviStats.min.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">أعلى NDVI</p>
                            <p className="text-2xl font-bold">
                              {satelliteImage.ndviStats.max.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Image */}
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={`data:image/png;base64,${satelliteImage.imageBase64}`}
                    alt="Satellite Image"
                    className="w-full h-auto"
                  />
                </div>

                {/* Legend for NDVI */}
                {imageType === "ndvi" && (
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-sm">مفتاح الألوان (NDVI)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#808080' }}></div>
                          <span>ماء/غيوم (&lt; -0.2)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#CC9966' }}></div>
                          <span>تربة عارية (-0.2 - 0.0)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFFF99' }}></div>
                          <span>نباتات ضعيفة (0.0 - 0.2)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#CCFF66' }}></div>
                          <span>نباتات متوسطة (0.2 - 0.4)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#66CC33' }}></div>
                          <span>نباتات جيدة (0.4 - 0.6)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#339919' }}></div>
                          <span>نباتات صحية (0.6 - 0.8)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#006600' }}></div>
                          <span>نباتات ممتازة (&gt; 0.8)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Info */}
                <Card className="bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-2">
                      <Satellite className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">معلومات</p>
                        <p className="text-blue-700 mt-1">
                          الصور من القمر الصناعي Sentinel-2 التابع لوكالة الفضاء الأوروبية (ESA).
                          الدقة المكانية: 10 أمتار. يتم تحديث الصور كل 5 أيام تقريباً.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!satelliteImage && !getFieldImage.isPending && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Satellite className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">لا توجد صورة فضائية</p>
              <p className="text-sm text-muted-foreground mt-2">
                اختر مزرعة وحقل وتواريخ، ثم انقر على "جلب الصورة"
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
