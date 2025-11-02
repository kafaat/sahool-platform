import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Tractor, Activity, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const statusColors = {
  active: "bg-green-500",
  maintenance: "bg-yellow-500",
  idle: "bg-gray-500",
  retired: "bg-red-500",
};

const statusLabels = {
  active: "نشط",
  maintenance: "صيانة",
  idle: "خامل",
  retired: "متقاعد",
};

export default function Equipment() {
  const { data: farms } = trpc.farms.list.useQuery();
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  const { data: equipment, isLoading } = trpc.equipment.list.useQuery(
    { farmId: selectedFarmId! },
    { enabled: selectedFarmId !== null }
  );

  // اختيار أول مزرعة تلقائياً
  if (farms && farms.length > 0 && selectedFarmId === null) {
    setSelectedFarmId(farms[0].id);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">المعدات</h1>
            <p className="text-muted-foreground mt-2">
              إدارة ومراقبة المعدات الزراعية
            </p>
          </div>
          <Button onClick={() => toast.info("قريباً: إضافة معدة جديدة")}>
            <Tractor className="h-4 w-4 ml-2" />
            إضافة معدة
          </Button>
        </div>

        {farms && farms.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {farms.map((farm) => (
              <Button
                key={farm.id}
                variant={selectedFarmId === farm.id ? "default" : "outline"}
                onClick={() => setSelectedFarmId(farm.id)}
              >
                {farm.name}
              </Button>
            ))}
          </div>
        )}

        {!farms || farms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد مزارع</h3>
              <p className="text-sm text-muted-foreground">
                يجب إضافة مزرعة أولاً قبل إضافة المعدات
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : equipment && equipment.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {equipment.map((eq) => (
              <Card key={eq.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Tractor className="h-5 w-5" />
                        {eq.name}
                      </CardTitle>
                      <CardDescription>{eq.type}</CardDescription>
                    </div>
                    <Badge
                      className={statusColors[eq.status as keyof typeof statusColors]}
                    >
                      {statusLabels[eq.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الطراز:</span>
                      <span className="font-medium">{eq.model || "غير محدد"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الشركة المصنعة:</span>
                      <span className="font-medium">{eq.manufacturer || "غير محدد"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">السنة:</span>
                      <span className="font-medium">{eq.year || "غير محدد"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ساعات التشغيل:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {eq.totalHours} ساعة
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tractor className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد معدات مسجلة</h3>
              <p className="text-sm text-muted-foreground mb-4">
                ابدأ بإضافة معداتك الزراعية
              </p>
              <Button onClick={() => toast.info("قريباً: إضافة معدة جديدة")}>
                <Tractor className="h-4 w-4 ml-2" />
                إضافة معدة
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
