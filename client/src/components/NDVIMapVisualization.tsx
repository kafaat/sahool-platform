import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Leaf, AlertTriangle } from 'lucide-react';
import type { NdviAnalysis } from '../../../drizzle/schema';

interface NDVIMapVisualizationProps {
  analysis: NdviAnalysis;
}

export default function NDVIMapVisualization({ analysis }: NDVIMapVisualizationProps) {
  const avgNdvi = parseFloat(analysis.avgNdvi || '0');
  const minNdvi = parseFloat(analysis.minNdvi || '0');
  const maxNdvi = parseFloat(analysis.maxNdvi || '0');
  const healthScore = analysis.healthScore || 0;

  // تحديد مستوى الصحة
  const getHealthLevel = (score: number) => {
    if (score >= 80) return { label: 'ممتاز', color: 'bg-green-500', icon: Leaf };
    if (score >= 60) return { label: 'جيد', color: 'bg-lime-500', icon: TrendingUp };
    if (score >= 40) return { label: 'متوسط', color: 'bg-yellow-500', icon: Minus };
    if (score >= 20) return { label: 'ضعيف', color: 'bg-orange-500', icon: TrendingDown };
    return { label: 'ضعيف جداً', color: 'bg-red-500', icon: AlertTriangle };
  };

  const healthLevel = getHealthLevel(healthScore);
  const HealthIcon = healthLevel.icon;

  // تحديد لون شريط التقدم
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-lime-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* نظرة عامة */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold mb-1">
              صحة المحاصيل: {healthScore}%
            </h3>
            <div className="flex items-center gap-2">
              <Badge className={`${healthLevel.color} text-white`}>
                <HealthIcon className="mr-1 h-3 w-3" />
                {healthLevel.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                NDVI: {avgNdvi.toFixed(3)}
              </span>
            </div>
          </div>
          <div className={`h-16 w-16 rounded-full ${healthLevel.color} flex items-center justify-center`}>
            <HealthIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* شريط التقدم */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">مستوى الصحة</span>
            <span className="font-medium">{healthScore}%</span>
          </div>
          <Progress value={healthScore} className="h-3" />
        </div>
      </Card>

      {/* الإحصائيات التفصيلية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* متوسط NDVI */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">متوسط NDVI</span>
            <Leaf className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{avgNdvi.toFixed(3)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            المتوسط الحسابي لمؤشر النبات
          </div>
        </Card>

        {/* أدنى NDVI */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">أدنى NDVI</span>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold">{minNdvi.toFixed(3)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            المناطق الأقل صحة
          </div>
        </Card>

        {/* أعلى NDVI */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">أعلى NDVI</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{maxNdvi.toFixed(3)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            المناطق الأكثر صحة
          </div>
        </Card>
      </div>

      {/* مقياس الألوان */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">مقياس صحة المحاصيل</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-red-500" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">ضعيف جداً</span>
                <span className="text-xs text-muted-foreground">NDVI &lt; 0.2</span>
              </div>
              <p className="text-xs text-muted-foreground">يحتاج إلى تدخل فوري</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-orange-500" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">ضعيف</span>
                <span className="text-xs text-muted-foreground">0.2 - 0.4</span>
              </div>
              <p className="text-xs text-muted-foreground">يحتاج إلى مراقبة</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-yellow-500" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">متوسط</span>
                <span className="text-xs text-muted-foreground">0.4 - 0.6</span>
              </div>
              <p className="text-xs text-muted-foreground">صحة مقبولة</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-lime-500" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">جيد</span>
                <span className="text-xs text-muted-foreground">0.6 - 0.8</span>
              </div>
              <p className="text-xs text-muted-foreground">صحة جيدة</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-green-500" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">ممتاز</span>
                <span className="text-xs text-muted-foreground">NDVI &gt; 0.8</span>
              </div>
              <p className="text-xs text-muted-foreground">صحة ممتازة</p>
            </div>
          </div>
        </div>
      </Card>

      {/* التوصيات */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">التوصيات</h4>
        <div className="space-y-3">
          {healthScore >= 80 && (
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Leaf className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">المحاصيل في حالة ممتازة</p>
                <p className="text-xs text-muted-foreground">
                  استمر في نفس نظام الري والتسميد الحالي
                </p>
              </div>
            </div>
          )}

          {healthScore >= 60 && healthScore < 80 && (
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-lime-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-lime-600" />
              </div>
              <div>
                <p className="text-sm font-medium">المحاصيل في حالة جيدة</p>
                <p className="text-xs text-muted-foreground">
                  راقب المناطق ذات NDVI المنخفض وزد الري إذا لزم الأمر
                </p>
              </div>
            </div>
          )}

          {healthScore >= 40 && healthScore < 60 && (
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Minus className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">المحاصيل في حالة متوسطة</p>
                <p className="text-xs text-muted-foreground">
                  يُنصح بزيادة الري والتسميد في المناطق الضعيفة
                </p>
              </div>
            </div>
          )}

          {healthScore < 40 && (
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">المحاصيل تحتاج إلى تدخل فوري</p>
                <p className="text-xs text-muted-foreground">
                  افحص نظام الري والتسميد، وتحقق من وجود آفات أو أمراض
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
