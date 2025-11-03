import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Tractor, MapPin, AlertTriangle, TrendingUp, Loader2, Sprout, Bug, Droplet, BarChart3, Clock } from "lucide-react";
import { useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// تسجيل مكونات Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

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

  const {
    data: dashboardStats,
    isLoading,
    error,
    refetch,
  } = trpc.dashboard.getStats.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const {
    data: recentAlerts,
    isLoading: alertsLoading,
  } = trpc.dashboard.getRecentAlerts.useQuery(
    { limit: 5 },
    {
      staleTime: 1 * 60 * 1000,
      refetchInterval: 30 * 1000,
    }
  );

  // الحصول على بيانات الرسوم البيانية
  const {
    data: ndviChartData,
  } = trpc.dashboard.getChartData.useQuery(
    { type: "ndvi", period: "month" },
    { staleTime: 10 * 60 * 1000 }
  );

  const {
    data: diseasesChartData,
  } = trpc.dashboard.getChartData.useQuery(
    { type: "diseases", period: "month" },
    { staleTime: 10 * 60 * 1000 }
  );

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

  // إعداد بيانات رسم NDVI
  const ndviChartConfig = useMemo(() => {
    if (!ndviChartData) return null;

    return {
      data: {
        labels: ndviChartData.map((item) => item.date),
        datasets: [
          {
            label: "متوسط NDVI",
            data: ndviChartData.map((item) => item.value),
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index" as const,
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
          },
        },
      },
    };
  }, [ndviChartData]);

  // إعداد بيانات رسم الأمراض
  const diseasesChartConfig = useMemo(() => {
    if (!diseasesChartData) return null;

    return {
      data: {
        labels: diseasesChartData.map((item) => item.date),
        datasets: [
          {
            label: "الأمراض المكتشفة",
            data: diseasesChartData.map((item) => item.value),
            backgroundColor: "#FF9800",
            borderColor: "#F57C00",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index" as const,
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    };
  }, [diseasesChartData]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardError error={error} onRetry={refetch} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-2">
            مرحباً {user?.name || "مستخدم"}، إليك نظرة عامة على مزارعك
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* NDVI Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                اتجاه NDVI (آخر 30 يوم)
              </CardTitle>
              <CardDescription>
                مؤشر صحة المحاصيل عبر الزمن
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: "300px" }}>
                {ndviChartConfig ? (
                  <Line data={ndviChartConfig.data} options={ndviChartConfig.options} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Diseases Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                كشف الأمراض (آخر 30 يوم)
              </CardTitle>
              <CardDescription>
                عدد الأمراض المكتشفة يومياً
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: "300px" }}>
                {diseasesChartConfig ? (
                  <Bar data={diseasesChartConfig.data} options={diseasesChartConfig.options} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              آخر التنبيهات
            </CardTitle>
            <CardDescription>
              التنبيهات الأخيرة من جميع المصادر
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentAlerts && recentAlerts.length > 0 ? (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="mt-1">
                      {alert.priority === "critical" || alert.priority === "high" ? (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.createdAt).toLocaleString("ar-SA")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد تنبيهات حالياً</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last Updated */}
        {dashboardStats && (
          <div className="text-xs text-muted-foreground text-center">
            آخر تحديث: {new Date(dashboardStats.lastUpdated).toLocaleString("ar-SA")}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
