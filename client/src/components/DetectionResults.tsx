import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Streamdown } from 'streamdown';

interface DetectionResultsProps {
  detectionId: number;
}

export default function DetectionResults({ detectionId }: DetectionResultsProps) {
  const { data, isLoading, error } = trpc.diseaseDetection.getResults.useQuery({
    detectionId,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p>فشل في تحميل النتائج: {error.message}</p>
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { detection, diseases } = data;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'منخفض';
      case 'moderate':
        return 'متوسط';
      case 'high':
        return 'عالي';
      case 'critical':
        return 'حرج';
      default:
        return severity;
    }
  };

  return (
    <div className="space-y-6">
      {/* معلومات الاكتشاف */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">نتائج التحليل</h3>
            <p className="text-sm text-muted-foreground">
              نوع المحصول: <span className="font-medium">{detection.cropType}</span>
            </p>
          </div>
          <Badge
            variant={detection.status === 'completed' ? 'default' : 'secondary'}
          >
            {detection.status === 'completed' ? 'مكتمل' : detection.status}
          </Badge>
        </div>

        {/* الصورة */}
        {detection.imageUrl && (
          <div className="mb-4">
            <img
              src={detection.imageUrl}
              alt="Analyzed crop"
              className="w-full h-64 object-contain bg-muted rounded-lg"
            />
          </div>
        )}

        {/* ملخص النتائج */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">عدد الأمراض المكتشفة</p>
            <p className="text-2xl font-bold">{diseases.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">تاريخ التحليل</p>
            <p className="text-sm font-medium">
              {detection.processedAt
                ? new Date(detection.processedAt).toLocaleDateString('ar-EG')
                : 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {/* الأمراض المكتشفة */}
      {diseases.length === 0 ? (
        <Card className="p-6">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">لم يتم اكتشاف أي أمراض! المحصول يبدو صحياً.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <h4 className="font-semibold">الأمراض المكتشفة ({diseases.length})</h4>
          {diseases.map((disease) => (
            <Card key={disease.id} className="p-6">
              <div className="space-y-4">
                {/* رأس البطاقة */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-semibold text-lg">{disease.diseaseName}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getSeverityColor(disease.severity)}>
                        الخطورة: {getSeverityLabel(disease.severity)}
                      </Badge>
                      <Badge variant="outline">
                        الثقة: {disease.confidence}%
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* المعلومات التفصيلية */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {disease.affectedArea && (
                    <div>
                      <p className="text-muted-foreground">المساحة المتأثرة</p>
                      <p className="font-medium">{disease.affectedArea} هكتار</p>
                    </div>
                  )}
                  {disease.bboxX !== null && (
                    <div>
                      <p className="text-muted-foreground">الموقع في الصورة</p>
                      <p className="font-medium text-xs">
                        X: {disease.bboxX}, Y: {disease.bboxY}
                      </p>
                    </div>
                  )}
                </div>

                {/* التوصيات */}
                {disease.recommendations && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900 mb-1">التوصيات</p>
                        <Streamdown className="text-sm text-blue-800">
                          {disease.recommendations}
                        </Streamdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
