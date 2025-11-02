import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DiseaseDetectionUploader from '@/components/DiseaseDetectionUploader';
import DetectionResults from '@/components/DetectionResults';
import DetectionHistory from '@/components/DetectionHistory';
import DiseaseDatabase from '@/components/DiseaseDatabase';
import {
  Microscope,
  Upload,
  History,
  BookOpen,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';

export default function DiseaseDetection() {
  const { user } = useAuth();
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>();
  const [selectedDetectionId, setSelectedDetectionId] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState('upload');

  // جلب المزارع
  const { data: farms } = trpc.farms.list.useQuery();

  // جلب الإحصائيات
  const { data: stats } = trpc.diseaseDetection.getStatistics.useQuery({
    farmId: selectedFarmId,
  });

  const handleUploadComplete = (detectionId: number) => {
    setSelectedDetectionId(detectionId);
    setActiveTab('results');
  };

  const handleViewDetails = (detectionId: number) => {
    setSelectedDetectionId(detectionId);
    setActiveTab('results');
  };

  return (
    <div className="container py-6 space-y-6">
      {/* الرأس */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Microscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">الكشف عن أمراض المحاصيل</h1>
            <p className="text-muted-foreground">
              نظام ذكي للكشف المبكر عن الأمراض باستخدام تقنية YOLO
            </p>
          </div>
        </div>
      </div>

      {/* اختيار المزرعة */}
      {farms && farms.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">المزرعة:</label>
            <Select
              value={selectedFarmId?.toString()}
              onValueChange={(value) => setSelectedFarmId(parseInt(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="جميع المزارع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المزارع</SelectItem>
                {farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id.toString()}>
                    {farm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {/* الإحصائيات */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التحليلات</p>
                <p className="text-2xl font-bold">{stats.totalDetections}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">التحليلات المكتملة</p>
                <p className="text-2xl font-bold">{stats.completedDetections}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الأمراض المكتشفة</p>
                <p className="text-2xl font-bold">{stats.totalDiseases}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">الأكثر شيوعاً</p>
              {stats.mostCommonDiseases.length > 0 ? (
                <div className="space-y-1">
                  {stats.mostCommonDiseases.slice(0, 2).map((disease) => (
                    <div key={disease.name} className="flex items-center justify-between text-xs">
                      <span className="truncate">{disease.name}</span>
                      <Badge variant="outline" className="ml-1">{disease.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            رفع صورة
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Microscope className="h-4 w-4" />
            النتائج
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            السجل
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            قاعدة البيانات
          </TabsTrigger>
        </TabsList>

        {/* تبويب الرفع */}
        <TabsContent value="upload" className="space-y-4">
          {selectedFarmId ? (
            <DiseaseDetectionUploader
              farmId={selectedFarmId}
              onUploadComplete={handleUploadComplete}
            />
          ) : (
            <Card className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>يرجى اختيار مزرعة أولاً</p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* تبويب النتائج */}
        <TabsContent value="results" className="space-y-4">
          {selectedDetectionId ? (
            <DetectionResults detectionId={selectedDetectionId} />
          ) : (
            <Card className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                <Microscope className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد نتائج لعرضها</p>
                <p className="text-sm mt-1">قم برفع صورة أولاً أو اختر من السجل</p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* تبويب السجل */}
        <TabsContent value="history" className="space-y-4">
          <DetectionHistory
            farmId={selectedFarmId}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        {/* تبويب قاعدة البيانات */}
        <TabsContent value="database" className="space-y-4">
          <DiseaseDatabase />
        </TabsContent>
      </Tabs>

      {/* معلومات إضافية */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Microscope className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-medium text-blue-900">كيف يعمل النظام؟</p>
            <ul className="space-y-1 text-blue-800">
              <li>• ارفع صورة واضحة للنبات المصاب</li>
              <li>• يقوم النظام بتحليل الصورة باستخدام نموذج YOLO المتقدم</li>
              <li>• يتم اكتشاف الأمراض مع نسبة الثقة ومستوى الخطورة</li>
              <li>• تحصل على توصيات فورية للعلاج والوقاية</li>
              <li>• دقة الكشف: 90%+ للأمراض الشائعة</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
