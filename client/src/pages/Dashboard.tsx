import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Tractor, MapPin, AlertTriangle, Users, TrendingUp, Activity } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: farms } = trpc.farms.list.useQuery();
  const { data: equipment } = trpc.equipment.list.useQuery({ farmId: farms?.[0]?.id || 0 }, { enabled: !!farms?.[0]?.id });
  const { data: alerts } = trpc.alerts.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();

  const activeAlerts = alerts?.filter((a) => a.status === "active").length || 0;
  const activeEquipment = equipment?.filter((e) => e.status === "active").length || 0;

  const stats = [
    {
      title: "المزارع النشطة",
      value: farms?.length || 0,
      icon: MapPin,
      description: "إجمالي المزارع المسجلة",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "#367C2B",
    },
    {
      title: "المعدات النشطة",
      value: activeEquipment,
      icon: Tractor,
      description: "معدات قيد التشغيل",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "#2196F3",
    },
    {
      title: "التنبيهات النشطة",
      value: activeAlerts,
      icon: AlertTriangle,
      description: "تنبيهات تحتاج إلى اهتمام",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "#F44336",
    },
    {
      title: "المستخدمين",
      value: users?.length || 1,
      icon: Users,
      description: "مستخدمين نشطين",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "#9C27B0",
    },
  ];

  // بيانات تجريبية للرسوم البيانية
  const recentActivity = [
    { label: "تم إضافة معدة جديدة", time: "منذ ساعتين", type: "success" },
    { label: "تنبيه: مستوى وقود منخفض", time: "منذ 3 ساعات", type: "warning" },
    { label: "تم إكمال خطة عمل", time: "منذ 5 ساعات", type: "success" },
    { label: "صيانة مجدولة قريباً", time: "منذ يوم", type: "info" },
  ];

  const performanceMetrics = [
    { label: "كفاءة التشغيل", value: 87, color: "bg-green-600" },
    { label: "استخدام المعدات", value: 72, color: "bg-blue-600" },
    { label: "إنجاز المهام", value: 94, color: "bg-purple-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">مرحباً، {user?.name || "مزارع"}</h1>
          <p className="text-muted-foreground mt-2">
            نظرة عامة على مزارعك ومعداتك
          </p>
        </div>

        {/* Stats Grid - John Deere Style */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-l-4" style={{ borderLeftColor: stat.borderColor }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold mt-2 text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Performance Metrics - Farmonaut Style */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                مؤشرات الأداء
              </CardTitle>
              <CardDescription>متوسط الأداء خلال آخر 30 يوم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{metric.label}</span>
                      <span className="font-bold">{metric.value}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${metric.color} transition-all duration-500`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                النشاط الأخير
              </CardTitle>
              <CardDescription>آخر التحديثات والأحداث</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === "success"
                          ? "bg-green-600"
                          : activity.type === "warning"
                          ? "bg-yellow-600"
                          : "bg-blue-600"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - John Deere Style */}
        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
            <CardDescription>الوصول السريع إلى الميزات الأكثر استخداماً</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors text-center">
                <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">إضافة مزرعة</p>
              </button>
              <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors text-center">
                <Tractor className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">إضافة معدة</p>
              </button>
              <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors text-center">
                <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">مراقبة حية</p>
              </button>
              <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">التقارير</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
