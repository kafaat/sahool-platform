import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bug, AlertTriangle, CheckCircle2, MapPin, TrendingUp } from 'lucide-react';
import type { PestDetection } from '../../../drizzle/schema';

interface PestDetectionVisualizationProps {
  detections: PestDetection[];
}

export default function PestDetectionVisualization({ detections }: PestDetectionVisualizationProps) {
  if (detections.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">لا توجد آفات مكتشفة</AlertTitle>
        <AlertDescription className="text-green-700">
          لم يتم اكتشاف أي آفات أو أمراض في الصورة المحللة. المحاصيل في حالة جيدة.
        </AlertDescription>
      </Alert>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'شديد' };
      case 'moderate':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'متوسط' };
      case 'low':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', label: 'خفيف' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: 'غير محدد' };
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'high') return AlertTriangle;
    if (severity === 'moderate') return Bug;
    return CheckCircle2;
  };

  // حساب الإحصائيات
  const totalAffectedArea = detections.reduce(
    (sum, d) => sum + parseFloat(d.affectedArea || '0'),
    0
  );
  const avgConfidence =
    detections.reduce((sum, d) => sum + parseFloat(d.confidence || '0'), 0) / detections.length;
  const highSeverityCount = detections.filter((d) => d.severity === 'high').length;

  return (
    <div className="space-y-6">
      {/* نظرة عامة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">عدد الآفات</span>
            <Bug className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold">{detections.length}</div>
          <div className="text-xs text-muted-foreground mt-1">آفة مكتشفة</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">المساحة المتأثرة</span>
            <MapPin className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold">{totalAffectedArea.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">هكتار</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">متوسط الثقة</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{avgConfidence.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-1">دقة الكشف</div>
        </Card>
      </div>

      {/* تنبيه للآفات الشديدة */}
      {highSeverityCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">تحذير: آفات شديدة</AlertTitle>
          <AlertDescription className="text-red-700">
            تم اكتشاف {highSeverityCount} آفة شديدة تحتاج إلى تدخل فوري. يُرجى مراجعة التفاصيل أدناه.
          </AlertDescription>
        </Alert>
      )}

      {/* قائمة الآفات */}
      <div className="space-y-4">
        <h4 className="font-semibold">الآفات المكتشفة</h4>
        {detections.map((detection) => {
          const severityStyle = getSeverityColor(detection.severity);
          const SeverityIcon = getSeverityIcon(detection.severity);

          return (
            <Card
              key={detection.id}
              className={`p-6 border-2 ${severityStyle.border}`}
            >
              <div className="flex items-start gap-4">
                {/* أيقونة */}
                <div className={`h-12 w-12 rounded-full ${severityStyle.bg} flex items-center justify-center flex-shrink-0`}>
                  <SeverityIcon className={`h-6 w-6 ${severityStyle.text}`} />
                </div>

                {/* المحتوى */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-lg">{detection.pestType}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${severityStyle.bg} ${severityStyle.text}`}>
                          {severityStyle.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ثقة: {parseFloat(detection.confidence || '0').toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* التفاصيل */}
                  <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">المساحة المتأثرة</p>
                      <p className="font-medium">
                        {parseFloat(detection.affectedArea || '0').toFixed(2)} هكتار
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">تاريخ الكشف</p>
                      <p className="font-medium">
                        {new Date(detection.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>

                  {/* التوصيات */}
                  {detection.recommendations && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        التوصيات
                      </p>
                      <p className="text-sm text-blue-700">
                        {detection.recommendations}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* نصائح عامة */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-semibold mb-3 text-blue-900">نصائح عامة لمكافحة الآفات</h4>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>راقب المحاصيل بانتظام للكشف المبكر عن الآفات</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>استخدم المبيدات الحيوية كخيار أول قبل المبيدات الكيميائية</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>احرص على التناوب الزراعي لتقليل انتشار الآفات</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>تخلص من النباتات المصابة بشدة لمنع انتشار العدوى</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>استشر مهندساً زراعياً قبل استخدام أي مبيدات</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
