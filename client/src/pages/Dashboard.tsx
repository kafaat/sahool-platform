import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, Tractor, Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: farms } = trpc.farms.list.useQuery();
  const { data: alerts } = trpc.alerts.list.useQuery();
  
  const activeAlerts = alerts?.filter(a => a.status === "active") || [];
  const totalFarms = farms?.length || 0;

  const stats = [
    {
      title: "المزارع النشطة",
      value: totalFarms,
      icon: Tractor,
      description: "إجمالي المزارع المسجلة",
      color: "text-green-600",
    },
    {
      title: "التنبيهات النشطة",
      value: activeAlerts.length,
      icon: AlertTriangle,
      description: "تنبيهات تحتاج إلى اهتمام",
      color: "text-red-600",
    },
    {
      title: "المعدات",
      value: 0,
      icon: Activity,
      description: "معدات قيد التشغيل",
      color: "text-blue-600",
    },
    {
      title: "المستخدمين",
      value: 1,
      icon: Users,
      description: "مستخدمين نشطين",
      color: "text-purple-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">مرحباً، {user?.name || "مزارع"}</h1>
          <p className="text-muted-foreground mt-2">
            نظرة عامة على مزارعك ومعداتك
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>المزارع</CardTitle>
              <CardDescription>
                قائمة المزارع المسجلة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalFarms === 0 ? (
                <p className="text-sm text-muted-foreground">
                  لا توجد مزارع مسجلة بعد
                </p>
              ) : (
                <div className="space-y-2">
                  {farms?.map((farm) => (
                    <div
                      key={farm.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium">{farm.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {farm.totalArea ? `${farm.totalArea} هكتار` : "غير محدد"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>التنبيهات الأخيرة</CardTitle>
              <CardDescription>
                آخر التنبيهات والإشعارات
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  لا توجد تنبيهات نشطة
                </p>
              ) : (
                <div className="space-y-2">
                  {activeAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent"
                    >
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
