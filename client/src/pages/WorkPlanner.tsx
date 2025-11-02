import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Calendar, Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

const statusColors = {
  draft: "bg-gray-500",
  active: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const statusLabels = {
  draft: "مسودة",
  active: "نشط",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export default function WorkPlanner() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [planName, setPlanName] = useState("");
  const [cropType, setCropType] = useState("");
  const [season, setSeason] = useState("");
  const [startDate, setStartDate] = useState("");

  const { data: farms } = trpc.farms.list.useQuery();
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  const { data: fields } = trpc.fields.list.useQuery(
    { farmId: selectedFarmId! },
    { enabled: selectedFarmId !== null }
  );

  const { data: workPlans, isLoading } = trpc.workPlans.list.useQuery(
    { fieldId: selectedFieldId! },
    { enabled: selectedFieldId !== null }
  );

  const utils = trpc.useUtils();

  const createWorkPlan = trpc.workPlans.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء خطة العمل بنجاح");
      utils.workPlans.list.invalidate();
      setIsDialogOpen(false);
      setPlanName("");
      setCropType("");
      setSeason("");
      setStartDate("");
    },
    onError: (error) => {
      toast.error("فشل إنشاء خطة العمل: " + error.message);
    },
  });

  // اختيار أول مزرعة وحقل تلقائياً
  if (farms && farms.length > 0 && selectedFarmId === null) {
    setSelectedFarmId(farms[0].id);
  }

  if (fields && fields.length > 0 && selectedFieldId === null) {
    setSelectedFieldId(fields[0].id);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFieldId) {
      toast.error("يجب اختيار حقل");
      return;
    }
    createWorkPlan.mutate({
      fieldId: selectedFieldId,
      name: planName,
      cropType: cropType || undefined,
      season: season || undefined,
      startDate: new Date(startDate),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">مخطط العمل</h1>
            <p className="text-muted-foreground mt-2">
              تخطيط وإدارة الأنشطة الزراعية الموسمية
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} disabled={!selectedFieldId}>
            <Plus className="h-4 w-4 ml-2" />
            إنشاء خطة عمل
          </Button>
        </div>

        {farms && farms.length > 0 && (
          <div className="space-y-2">
            <Label>اختر المزرعة</Label>
            <div className="flex gap-2 flex-wrap">
              {farms.map((farm) => (
                <Button
                  key={farm.id}
                  variant={selectedFarmId === farm.id ? "default" : "outline"}
                  onClick={() => {
                    setSelectedFarmId(farm.id);
                    setSelectedFieldId(null);
                  }}
                >
                  {farm.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {fields && fields.length > 0 && (
          <div className="space-y-2">
            <Label>اختر الحقل</Label>
            <div className="flex gap-2 flex-wrap">
              {fields.map((field) => (
                <Button
                  key={field.id}
                  variant={selectedFieldId === field.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFieldId(field.id)}
                >
                  {field.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {!farms || farms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد مزارع</h3>
              <p className="text-sm text-muted-foreground">
                يجب إضافة مزرعة وحقل أولاً
              </p>
            </CardContent>
          </Card>
        ) : !fields || fields.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد حقول</h3>
              <p className="text-sm text-muted-foreground">
                يجب إضافة حقل للمزرعة أولاً
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : workPlans && workPlans.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {workPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {plan.name}
                      </CardTitle>
                      <CardDescription>{plan.cropType || "محصول غير محدد"}</CardDescription>
                    </div>
                    <Badge className={statusColors[plan.status as keyof typeof statusColors]}>
                      {statusLabels[plan.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الموسم:</span>
                      <span className="font-medium">{plan.season || "غير محدد"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ البدء:</span>
                      <span className="font-medium">
                        {new Date(plan.startDate).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                    {plan.estimatedCost && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">التكلفة المقدرة:</span>
                        <span className="font-medium">{plan.estimatedCost} ريال</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد خطط عمل</h3>
              <p className="text-sm text-muted-foreground mb-4">
                ابدأ بإنشاء خطة عمل للموسم
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء خطة عمل
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء خطة عمل جديدة</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل خطة العمل للموسم
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="planName">اسم الخطة *</Label>
                  <Input
                    id="planName"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="مثال: خطة زراعة القمح 2025"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cropType">نوع المحصول</Label>
                  <Input
                    id="cropType"
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    placeholder="مثال: قمح"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="season">الموسم</Label>
                  <Input
                    id="season"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="مثال: شتاء 2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">تاريخ البدء *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={createWorkPlan.isPending}>
                  {createWorkPlan.isPending ? "جاري الإنشاء..." : "إنشاء"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
