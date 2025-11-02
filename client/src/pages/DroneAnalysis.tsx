import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Map, Bug, Droplet, Ruler, FileText } from 'lucide-react';
import DroneImageUploader from '@/components/DroneImageUploader';
import NDVIMapVisualization from '@/components/NDVIMapVisualization';
import PestDetectionVisualization from '@/components/PestDetectionVisualization';
import WaterStressVisualization from '@/components/WaterStressVisualization';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function DroneAnalysis() {
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  const { data: farms, isLoading: farmsLoading } = trpc.farms.list.useQuery();
  const { data: fields } = trpc.fields.list.useQuery(
    { farmId: selectedFarmId! },
    { enabled: !!selectedFarmId }
  );
  const { data: images } = trpc.droneImages.list.useQuery(
    { farmId: selectedFarmId!, fieldId: selectedFieldId },
    { enabled: !!selectedFarmId }
  );
  const { data: processingStatus } = trpc.droneImages.getProcessingStatus.useQuery(
    { imageId: selectedImageId! },
    { enabled: !!selectedImageId, refetchInterval: 5000 }
  );
  const { data: analysisResults } = trpc.droneImages.getAnalysisResults.useQuery(
    { imageId: selectedImageId! },
    { enabled: !!selectedImageId }
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* العنوان */}
      <div>
        <h1 className="text-3xl font-bold mb-2">تحليل صور الطائرات بدون طيار</h1>
        <p className="text-muted-foreground">
          ارفع صور الطائرات وقم بتحليلها للحصول على معلومات دقيقة عن صحة المحاصيل والآفات والري
        </p>
      </div>

      {/* تنبيه النظام */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>نظام الاستشعار عن بعد (Beta)</AlertTitle>
        <AlertDescription>
          هذا النظام في مرحلة التطوير. يمكنك رفع الصور الآن، وسيتم إضافة ميزات التحليل التلقائي قريباً.
          <br />
          <strong>الميزات القادمة:</strong> خرائط NDVI، كشف الآفات، تحليل الإجهاد المائي، قياس المساحات التلقائي.
        </AlertDescription>
      </Alert>

      {/* اختيار المزرعة والحقل */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* اختيار المزرعة */}
          <div>
            <label className="block text-sm font-medium mb-2">المزرعة</label>
            {farmsLoading ? (
              <div className="h-10 bg-muted animate-pulse rounded" />
            ) : (
              <select
                className="w-full p-2 border rounded-md"
                value={selectedFarmId || ''}
                onChange={(e) => {
                  setSelectedFarmId(Number(e.target.value) || null);
                  setSelectedFieldId(null);
                  setSelectedImageId(null);
                }}
              >
                <option value="">-- اختر مزرعة --</option>
                {farms?.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* اختيار الحقل */}
          <div>
            <label className="block text-sm font-medium mb-2">
              الحقل (اختياري)
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedFieldId || ''}
              onChange={(e) => {
                setSelectedFieldId(Number(e.target.value) || null);
                setSelectedImageId(null);
              }}
              disabled={!selectedFarmId}
            >
              <option value="">-- كل الحقول --</option>
              {fields?.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* المحتوى الرئيسي */}
      {selectedFarmId ? (
        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              رفع الصور
            </TabsTrigger>
            <TabsTrigger value="ndvi" disabled={!selectedImageId}>
              <Map className="mr-2 h-4 w-4" />
              صحة المحاصيل
            </TabsTrigger>
            <TabsTrigger value="pests" disabled={!selectedImageId}>
              <Bug className="mr-2 h-4 w-4" />
              الآفات
            </TabsTrigger>
            <TabsTrigger value="water" disabled={!selectedImageId}>
              <Droplet className="mr-2 h-4 w-4" />
              الإجهاد المائي
            </TabsTrigger>
            <TabsTrigger value="area" disabled={!selectedImageId}>
              <Ruler className="mr-2 h-4 w-4" />
              قياس المساحات
            </TabsTrigger>
            <TabsTrigger value="report" disabled={!selectedImageId}>
              <FileText className="mr-2 h-4 w-4" />
              التقارير
            </TabsTrigger>
          </TabsList>

          {/* رفع الصور */}
          <TabsContent value="upload" className="space-y-4">
            <DroneImageUploader
              farmId={selectedFarmId}
              fieldId={selectedFieldId || undefined}
              onImageUploaded={(imageId) => {
                setSelectedImageId(imageId);
              }}
            />

            {/* قائمة الصور المرفوعة */}
            {images && images.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  الصور المرفوعة ({images.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <Card
                      key={image.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedImageId === image.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedImageId(image.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{image.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(image.createdAt).toLocaleDateString('ar-SA')}
                          </p>
                          <div className="mt-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                image.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : image.status === 'processing'
                                  ? 'bg-blue-100 text-blue-700'
                                  : image.status === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {image.status === 'completed'
                                ? 'مكتمل'
                                : image.status === 'processing'
                                ? 'جاري المعالجة'
                                : image.status === 'failed'
                                ? 'فشل'
                                : 'تم الرفع'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* صحة المحاصيل (NDVI) */}
          <TabsContent value="ndvi">
            {analysisResults?.ndvi ? (
              <NDVIMapVisualization analysis={analysisResults.ndvi} />
            ) : (
              <Card className="p-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    لا توجد نتائج تحليل NDVI بعد. قم برفع صورة وانتظر اكتمال المعالجة.
                  </AlertDescription>
                </Alert>
              </Card>
            )}
          </TabsContent>

          {/* الآفات */}
          <TabsContent value="pests">
            <PestDetectionVisualization detections={analysisResults?.pests || []} />
          </TabsContent>

          {/* الإجهاد المائي */}
          <TabsContent value="water">
            <WaterStressVisualization analysis={analysisResults?.waterStress || null} />
          </TabsContent>

          {/* قياس المساحات */}
          <TabsContent value="area">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">قياس المساحات التلقائي</h3>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  ميزة قياس المساحات التلقائي قيد التطوير. ستتمكن قريباً من:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>كشف حدود الحقول تلقائياً</li>
                    <li>حساب المساحة بالهكتار والدونم</li>
                    <li>تعديل الحدود يدوياً</li>
                    <li>تصدير البيانات (Shapefile, GeoJSON)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </Card>
          </TabsContent>

          {/* التقارير */}
          <TabsContent value="report">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">التقارير التلقائية</h3>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  ميزة التقارير التلقائية قيد التطوير. ستتمكن قريباً من:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>إنشاء تقرير شامل (PDF)</li>
                    <li>ملخص تنفيذي</li>
                    <li>خرائط وإحصائيات</li>
                    <li>توصيات مفصلة</li>
                    <li>مقارنة مع الفترات السابقة</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="p-12 text-center">
          <Upload className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">اختر مزرعة للبدء</h3>
          <p className="text-sm text-muted-foreground">
            اختر مزرعة من القائمة أعلاه لبدء رفع وتحليل صور الطائرات
          </p>
        </Card>
      )}
    </div>
  );
}
