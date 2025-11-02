import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Tractor, MapPin, AlertTriangle, Users, TrendingUp, Activity, Loader2 } from "lucide-react";
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
        {[1, 2, 3, 4].map((i) => (
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

  // تحسين 5: استخدام enabled للتحكم في الطلبات
  const {
    data: farms,
    isLoading: farmsLoading,
    error: farmsError,
    refetch: refetchFarms,
  } = trpc.farms.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: equipment,
    isLoading: equipmentLoading,
    error: equipmentError,
  } = trpc.equipment.list.useQuery(
    { farmId: farms?.[0]?.id || 0 },
    {
      enabled: !!farms?.[0]?.id,
      staleTime: 5 * 60 * 1000,
    }
  );

  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
  } = trpc.alerts.list.useQuery(undefined, {
    staleTime: 1 * 60 * 1000, // 1 minute for alerts
  });

  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = trpc.users.list.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // تحسين 6: استخدام useMemo للحسابات
  const stats = useMemo<Stat[]>(() => {
    const activeAlerts = alerts?.filter((a) => a.status === "active").length || 0;
    const activeEquipment = equipment?.filter((e) => e.status === "active").length || 0;

    return [
      {
        title: "المزارع النشطة",
        value: farms?.length || 0,
        icon: MapPin,
        description: "إجمالي المزارع المسجلة",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "#367C2B",
        trend: {
          value: 12,
          isPositive: true,
        },
      },
      {
        title: "المعدات النشطة",
        value: activeEquipment,
        icon: Tractor,
        description: "معدات قيد التشغيل",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "#2196F3",
        trend: {
          value: 8,
          isPositive: true,
        },
      },
      {
        title: "التنبيهات النشطة",
        value: activeAlerts,
        icon: AlertTriangle,
        description: "تنبيهات تحتاج إلى اهتمام",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "#F44336",
        trend: {
          value: 5,
          isPositive: false,
        },
      },
      {
        title: "المستخدمين",
        value: users?.length || 1,
        icon: Users,
        description: "مستخدمين نشطين",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "#9C27B0",
        trend: {
          value: 3,
          isPositive: true,
        },
      },
    ];
  }, [farms, equipment, alerts, users]);

  // تحسين 7: معالجة الأخطاء بشكل أفضل
  const isLoading = farmsLoading || equipmentLoading || alertsLoading || usersLoading;
  const hasError = farmsError || equipmentError || alertsError || usersError;

  if (hasError) {
    return (
      <DashboardLayout>
        <DashboardError
          error={farmsError || equipmentError || alertsError || usersError || new Error('Unknown error')}
          onRetry={() => {
            refetchFarms();
          }}
        />
      </DashboardLayout>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
            <p className="text-gray-500 mt-1">
              مرحباً {user?.name}، إليك نظرة عامة على مزارعك
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Activity className="h-4 w-4" />
            <span>آخر تحديث: الآن</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>النشاط الأخير</CardTitle>
            <CardDescription>آخر الأحداث في مزارعك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts?.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-gray-500">{alert.message}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(alert.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              ))}
              {(!alerts || alerts.length === 0) && (
                <p className="text-center text-gray-500 py-8">
                  لا توجد تنبيهات حديثة
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
