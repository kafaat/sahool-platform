import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Droplet, AlertTriangle, CheckCircle2, TrendingDown, MapPin } from 'lucide-react';
import type { WaterStressAnalysis } from '../../../drizzle/schema';

interface WaterStressVisualizationProps {
  analysis: WaterStressAnalysis | null;
}

export default function WaterStressVisualization({ analysis }: WaterStressVisualizationProps) {
  if (!analysis) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>لا توجد بيانات إجهاد مائي</AlertTitle>
        <AlertDescription>
          لم يتم تحليل الإجهاد المائي لهذه الصورة بعد.
        </AlertDescription>
      </Alert>
    );
  }

  const getStressLevelStyle = (level: string) => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-200',
          label: 'شديد',
          icon: AlertTriangle,
          color: 'text-red-600',
        };
      case 'moderate':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-700',
          border: 'border-orange-200',
          label: 'متوسط',
          icon: TrendingDown,
          color: 'text-orange-600',
        };
      case 'low':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
          label: 'خفيف',
          icon: Droplet,
          color: 'text-yellow-600',
        };
      case 'none':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-200',
          label: 'لا يوجد',
          icon: CheckCircle2,
          color: 'text-green-600',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-200',
          label: 'غير محدد',
          icon: Droplet,
          color: 'text-gray-600',
        };
    }
  };

  const stressStyle = getStressLevelStyle(analysis.stressLevel);
  const StressIcon = stressStyle.icon;
  const avgNdwi = parseFloat(analysis.avgNdwi || '0');
  const affectedArea = parseFloat(analysis.affectedArea || '0');

  return (
    <div className="space-y-6">
      {/* نظرة عامة */}
      <Card className={`p-6 border-2 ${stressStyle.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">
              مستوى الإجهاد المائي
            </h3>
            <Badge className={`${stressStyle.bg} ${stressStyle.text}`}>
              <StressIcon className="mr-1 h-3 w-3" />
              {stressStyle.label}
            </Badge>
          </div>
          <div className={`h-16 w-16 rounded-full ${stressStyle.bg} flex items-center justify-center`}>
            <StressIcon className={`h-8 w-8 ${stressStyle.color}`} />
          </div>
        </div>

        {/* مؤشر NDWI */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">مؤشر المياه (NDWI)</span>
            <span className="text-lg font-bold">{avgNdwi.toFixed(3)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Normalized Difference Water Index
          </p>
        </div>
      </Card>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">المساحة المتأثرة</span>
            <MapPin className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold">{affectedArea.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">هكتار</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">تاريخ التحليل</span>
            <Droplet className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-lg font-bold">
            {new Date(analysis.createdAt).toLocaleDateString('ar-SA')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(analysis.createdAt).toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </Card>
      </div>

      {/* التنبيهات */}
      {(analysis.stressLevel === 'high' || analysis.stressLevel === 'moderate') && (
        <Alert className={`${stressStyle.border} ${stressStyle.bg}`}>
          <AlertTriangle className={`h-4 w-4 ${stressStyle.color}`} />
          <AlertTitle className={stressStyle.text}>
            {analysis.stressLevel === 'high' ? 'تحذير: إجهاد مائي شديد' : 'تنبيه: إجهاد مائي متوسط'}
          </AlertTitle>
          <AlertDescription className={stressStyle.text}>
            {analysis.stressLevel === 'high'
              ? 'المحاصيل تعاني من نقص حاد في المياه. يجب زيادة الري فوراً.'
              : 'المحاصيل تحتاج إلى مزيد من الري. راقب الوضع عن كثب.'}
          </AlertDescription>
        </Alert>
      )}

      {analysis.stressLevel === 'none' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">مستوى الري مثالي</AlertTitle>
          <AlertDescription className="text-green-700">
            المحاصيل تحصل على كمية مناسبة من المياه. استمر في نفس نظام الري الحالي.
          </AlertDescription>
        </Alert>
      )}

      {/* التوصيات */}
      {analysis.recommendations && (
        <Card className="p-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Droplet className="h-5 w-5 text-blue-500" />
            التوصيات
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analysis.recommendations}
          </p>
        </Card>
      )}

      {/* مقياس NDWI */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">مقياس مؤشر المياه (NDWI)</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-red-500" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">جفاف شديد</span>
                <span className="text-xs text-muted-foreground">NDWI &lt; -0.3</span>
              </div>
              <p className="text-xs text-muted-foreground">يحتاج إلى ري فوري</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-orange-500" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">جفاف متوسط</span>
                <span className="text-xs text-muted-foreground">-0.3 - 0</span>
              </div>
              <p className="text-xs text-muted-foreground">يحتاج إلى زيادة الري</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-yellow-500" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">رطوبة منخفضة</span>
                <span className="text-xs text-muted-foreground">0 - 0.2</span>
              </div>
              <p className="text-xs text-muted-foreground">راقب مستوى الري</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-green-500" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">رطوبة مناسبة</span>
                <span className="text-xs text-muted-foreground">0.2 - 0.4</span>
              </div>
              <p className="text-xs text-muted-foreground">مستوى مثالي</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-blue-500" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">رطوبة عالية</span>
                <span className="text-xs text-muted-foreground">NDWI &gt; 0.4</span>
              </div>
              <p className="text-xs text-muted-foreground">قد يكون هناك فائض في الري</p>
            </div>
          </div>
        </div>
      </Card>

      {/* نصائح عامة */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-semibold mb-3 text-blue-900">نصائح لإدارة الري</h4>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>استخدم أنظمة الري بالتنقيط لتوفير المياه</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>اروِ في الصباح الباكر أو المساء لتقليل التبخر</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>راقب رطوبة التربة بانتظام</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>استخدم أجهزة استشعار الرطوبة للري الذكي</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>اضبط كمية الري حسب نوع المحصول ومرحلة النمو</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
