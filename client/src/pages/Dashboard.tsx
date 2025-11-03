import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Tractor, MapPin, AlertTriangle, TrendingUp, Loader2, Sprout, Bug, Droplet, BarChart3 } from "lucide-react";
import { useMemo } from "react";

// تحسين 1: إضافة type للإحصائيات
interface Stat {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// تحسين 2: مكون منفصل للبطاقات
function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;

  return (
    <Card
      className="relative overflow-hidden transition-all hover:shadow-lg"
      style={{ borderTopColor: stat.borderColor, borderTopWidth: '4px' }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {stat.title}
        </CardTitle>
        <div className={`${stat.bgColor} p-3 rounded-full`}>
          <Icon className={`h-5 w-5 ${stat.color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{stat.value}</div>
        <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
        {stat.trend && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-4 w-4 ${!stat.trend.isPositive && 'rotate-180'}`} />
            <span>{stat.trend.value}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// تحسين 3: مكون Loading منفصل
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// تحسين 4: مكون Error منفصل
function DashboardError({ error, onRetry }: { error: any; onRetry: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-600">خطأ في تحميل البيانات</CardTitle>
        <CardDescription>{error.message}</CardDescription>
      </CardHeader>
      <CardContent>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  // استخدام dashboard router الجديد
  const {
    data: dashboardStats,
    isLoading,
    error,
    refetch,
  } = trpc.dashboard.getStats.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // تحديث كل دقيقة
  });

  // الحصول على آخر التنبيهات
  const {
    data: recentAlerts,
    isLoading: alertsLoading,
  } = trpc.dashboard.getRecentAlerts.useQuery(
    { limit: 5 },
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 30 * 1000, // تحديث كل 30 ثانية
    }
  );

  // حساب الإحصائيات
  const stats = useMemo<Stat[]>(() => {
    if (!dashboardStats) return [];

    return [
      {
        title: "المزارع النشطة",
        value: dashboardStats.farms.totalFarms,
        icon: MapPin,
        description: `إجمالي المساحة: ${dashboardStats.farms.totalArea.toFixed(1)} هكتار`,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "#367C2B",
      },
      {
        title: "الحقول",
        value: dashboardStats.fields.totalFields,
        icon: Sprout,
        description: "إجمالي الحقول المسجلة",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "#10B981",
      },
      {
        title: "المعدات النشطة",
        value: dashboardStats.equipment.activeEquipment,
        icon: Tractor,
        description: `من أصل ${dashboardStats.equipment.totalEquipment} معدة`,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "#2196F3",
      },
      {
        title: "صور الطائرات",
        value: dashboardStats.droneAnalysis.totalImages,
        icon: BarChart3,
        description: `معالج: ${dashboardStats.droneAnalysis.processedImages}`,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "#9C27B0",
      },
      {
        title: "متوسط NDVI",
        value: parseFloat(dashboardStats.droneAnalysis.avgNdvi.toFixed(2)),
        icon: Sprout,
        description: "مؤشر صحة المحاصيل",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "#4CAF50",
        trend: {
          value: 5,
          isPositive: dashboardStats.droneAnalysis.avgNdvi > 0.5,
        },
      },
      {
        title: "الآفات المكتشفة",
        value: dashboardStats.droneAnalysis.totalPests,
        icon: Bug,
        description: "تحتاج إلى معالجة",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "#F44336",
        trend: {
          value: 12,
          isPositive: false,
        },
      },
      {
        title: "إجهاد مائي عالٍ",
        value: dashboardStats.droneAnalysis.highWaterStress,
        icon: Droplet,
        description: "مناطق تحتاج ري",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "#FF9800",
      },
      {
        title: "كشف الأمراض",
        value: dashboardStats.diseaseDetection.completedDetections,
        icon: AlertTriangle,
        description: `من أصل ${dashboardStats.diseaseDetection.totalDetections}`,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "#FFC107",
      },
    ];
  }, [dashboardStats]);

  // معالجة الأخطاء
  if (error) {
    return (
      <DashboardLayout>
        <DashboardError error={error} onRetry={refetch} />
      </DashboardLayout>
    );
  }

  // معالجة التحميل
  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              مرحباً، {user?.name || "مستخدم"}
            </h1>
            <p className="text-gray-500 mt-1">
              آخر تحديث: {dashboardStats?.lastUpdated ? new Date(dashboardStats.lastUpdated).toLocaleString('ar-SA') : ''}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>

        {/* Recent Alerts */}
        {recentAlerts && recentAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                آخر التنبيهات
              </CardTitle>
              <CardDescription>تنبيهات تحتاج إلى اهتمام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.priority === 'high'
                        ? 'border-red-500 bg-red-50'
                        : 'border-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
            <CardDescription>الوصول السريع إلى الميزات الرئيسية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <a
                href="/farms"
                className="p-4 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all"
              >
                <MapPin className="h-6 w-6 text-green-600 mb-2" />
                <h4 className="font-semibold text-sm">إدارة المزارع</h4>
                <p className="text-xs text-gray-500 mt-1">عرض وإدارة المزارع</p>
              </a>
              <a
                href="/drone-analysis"
                className="p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <BarChart3 className="h-6 w-6 text-purple-600 mb-2" />
                <h4 className="font-semibold text-sm">تحليل الطائرات</h4>
                <p className="text-xs text-gray-500 mt-1">رفع وتحليل الصور</p>
              </a>
              <a
                href="/disease-detection"
                className="p-4 rounded-lg border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all"
              >
                <Bug className="h-6 w-6 text-red-600 mb-2" />
                <h4 className="font-semibold text-sm">كشف الأمراض</h4>
                <p className="text-xs text-gray-500 mt-1">تحليل أمراض المحاصيل</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
