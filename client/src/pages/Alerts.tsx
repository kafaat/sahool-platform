import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const priorityColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const priorityLabels = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  critical: "حرجة",
};

const statusIcons = {
  active: AlertTriangle,
  acknowledged: Clock,
  resolved: CheckCircle,
};

const statusLabels = {
  active: "نشط",
  acknowledged: "تم الإقرار",
  resolved: "تم الحل",
};

export default function Alerts() {
  const { data: alerts, isLoading } = trpc.alerts.list.useQuery();
  const utils = trpc.useUtils();

  const acknowledgeAlert = trpc.alerts.acknowledge.useMutation({
    onSuccess: () => {
      toast.success("تم الإقرار بالتنبيه");
      utils.alerts.list.invalidate();
    },
    onError: (error) => {
      toast.error("فشل الإقرار بالتنبيه: " + error.message);
    },
  });

  const activeAlerts = alerts?.filter((a) => a.status === "active") || [];
  const acknowledgedAlerts = alerts?.filter((a) => a.status === "acknowledged") || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">التنبيهات</h1>
          <p className="text-muted-foreground mt-2">
            مراقبة وإدارة التنبيهات والإشعارات
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    تنبيهات نشطة
                  </p>
                  <p className="text-2xl font-bold">{activeAlerts.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    تم الإقرار بها
                  </p>
                  <p className="text-2xl font-bold">{acknowledgedAlerts.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    إجمالي التنبيهات
                  </p>
                  <p className="text-2xl font-bold">{alerts?.length || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const StatusIcon = statusIcons[alert.status as keyof typeof statusIcons];
              return (
                <Card
                  key={alert.id}
                  className={`hover:shadow-md transition-shadow ${
                    alert.status === "active" ? "border-l-4 border-l-red-500" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <StatusIcon
                          className={`h-5 w-5 mt-0.5 ${
                            alert.status === "active"
                              ? "text-red-600"
                              : alert.status === "acknowledged"
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge
                              className={
                                priorityColors[alert.priority as keyof typeof priorityColors]
                              }
                            >
                              {priorityLabels[alert.priority as keyof typeof priorityLabels]}
                            </Badge>
                            <Badge variant="outline">
                              {statusLabels[alert.status as keyof typeof statusLabels]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {alert.message || "لا يوجد وصف"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString("ar-SA")}
                          </p>
                        </div>
                      </div>
                      {alert.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert.mutate({ alertId: alert.id })}
                          disabled={acknowledgeAlert.isPending}
                        >
                          إقرار
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد تنبيهات</h3>
              <p className="text-sm text-muted-foreground">
                جميع الأمور تسير بشكل جيد!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
