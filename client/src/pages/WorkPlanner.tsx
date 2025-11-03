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
import { Calendar, Plus, CheckCircle, Clock, XCircle, Sparkles, TrendingUp, AlertTriangle, Droplet, Bug } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-300",
  medium: "bg-blue-100 text-blue-800 border-blue-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  urgent: "bg-red-100 text-red-800 border-red-300",
};

const priorityLabels = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

const timeframeLabels = {
  urgent: "عاجل (خلال 24 ساعة)",
  this_week: "هذا الأسبوع",
  this_month: "هذا الشهر",
};

export default function WorkPlanner() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [planName, setPlanName] = useState("");
  const [cropType, setCropType] = useState("");
  const [season, setSeason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);

  const { data: farms } = trpc.farms.list.useQuery();
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  const { data: fields } = trpc.fields.list.useQuery(
    { farmId: selectedFarmId! },
    { enabled: selectedFarmId !== null }
  );

  const { data: workPlans, isLoading } = trpc.workPlanner.list.useQuery(
    { fieldId: selectedFieldId! },
    { enabled: selectedFieldId !== null }
  );

  const utils = trpc.useUtils();

  const createWorkPlan = trpc.workPlans.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء خطة العمل بنجاح");
      utils.workPlanner.list.invalidate();
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

  const generateAIRecommendations = trpc.workPlanner.generateAIRecommendations.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setAiRecommendations(data);
        setIsAIDialogOpen(true);
        toast.success("تم توليد التوصيات الذكية بنجاح");
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error("فشل توليد التوصيات: " + error.message);
    },
  });

  const createFromRecommendations = trpc.workPlanner.createFromRecommendations.useMutation({
    onSuccess: (data) => {
      toast.success(`تم إنشاء خطة عمل مع ${data.tasksCreated} مهمة`);
      utils.workPlanner.list.invalidate();
      setIsAIDialogOpen(false);
      setAiRecommendations(null);
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

  const handleGenerateAI = () => {
    if (!selectedFieldId || !selectedFarmId) {
      toast.error("يجب اختيار مزرعة وحقل");
      return;
    }
    generateAIRecommendations.mutate({
      fieldId: selectedFieldId,
      farmId: selectedFarmId,
    });
  };

  const handleCreateFromAI = () => {
    if (!selectedFieldId || !aiRecommendations) {
      return;
    }
    createFromRecommendations.mutate({
      fieldId: selectedFieldId,
      recommendations: aiRecommendations.recommendations,
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
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateAI}
              disabled={!selectedFieldId || generateAIRecommendations.isPending}
              variant="outline"
              className="gap-2"
            >
              {generateAIRecommendations.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  توصيات ذكية بالـ AI
                </>
              )}
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} disabled={!selectedFieldId}>
              <Plus className="h-4 w-4 ml-2" />
              خطة عمل جديدة
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>المزرعة</Label>
            <Select
              value={selectedFarmId?.toString()}
              onValueChange={(value) => {
                setSelectedFarmId(parseInt(value));
                setSelectedFieldId(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المزرعة" />
              </SelectTrigger>
              <SelectContent>
                {farms?.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id.toString()}>
                    {farm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>الحقل</Label>
            <Select
              value={selectedFieldId?.toString()}
              onValueChange={(value) => setSelectedFieldId(parseInt(value))}
              disabled={!selectedFarmId}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحقل" />
              </SelectTrigger>
              <SelectContent>
                {fields?.map((field) => (
                  <SelectItem key={field.id} value={field.id.toString()}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Work Plans List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !selectedFieldId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">اختر حقلاً لعرض خطط العمل</p>
              <p className="text-sm text-muted-foreground mt-2">
                قم باختيار مزرعة وحقل من الأعلى
              </p>
            </CardContent>
          </Card>
        ) : workPlans && workPlans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">لا توجد خطط عمل</p>
              <p className="text-sm text-muted-foreground mt-2">
                ابدأ بإنشاء خطة عمل جديدة أو استخدم التوصيات الذكية
              </p>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleGenerateAI} variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  توصيات ذكية
                </Button>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  خطة جديدة
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {workPlans?.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {plan.cropType && `المحصول: ${plan.cropType}`}
                        {plan.season && ` • الموسم: ${plan.season}`}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[plan.status as keyof typeof statusColors]}>
                      {statusLabels[plan.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">تاريخ البدء</p>
                      <p className="font-medium">
                        {new Date(plan.startDate).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                    {plan.endDate && (
                      <div>
                        <p className="text-muted-foreground">تاريخ الانتهاء</p>
                        <p className="font-medium">
                          {new Date(plan.endDate).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                    )}
                    {plan.estimatedCost && (
                      <div>
                        <p className="text-muted-foreground">التكلفة المقدرة</p>
                        <p className="font-medium">{plan.estimatedCost} ريال</p>
                      </div>
                    )}
                    {plan.actualCost && (
                      <div>
                        <p className="text-muted-foreground">التكلفة الفعلية</p>
                        <p className="font-medium">{plan.actualCost} ريال</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Work Plan Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>خطة عمل جديدة</DialogTitle>
              <DialogDescription>
                أنشئ خطة عمل جديدة للحقل المحدد
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="planName">اسم الخطة</Label>
                  <Input
                    id="planName"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="مثال: خطة موسم الشتاء 2025"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cropType">نوع المحصول</Label>
                  <Input
                    id="cropType"
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    placeholder="مثال: قمح"
                  />
                </div>
                <div>
                  <Label htmlFor="season">الموسم</Label>
                  <Input
                    id="season"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="مثال: شتاء 2025"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">تاريخ البدء</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
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

        {/* AI Recommendations Dialog */}
        <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                التوصيات الذكية بالـ AI
              </DialogTitle>
              <DialogDescription>
                بناءً على تحليل البيانات، إليك التوصيات المقترحة
              </DialogDescription>
            </DialogHeader>

            {aiRecommendations && (
              <div className="space-y-6">
                {/* Analysis Data */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">متوسط NDVI</p>
                          <p className="text-lg font-bold">
                            {aiRecommendations.analysisData.avgNdvi.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">الآفات</p>
                          <p className="text-lg font-bold">
                            {aiRecommendations.analysisData.pestCount}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Droplet className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">إجهاد مائي</p>
                          <p className="text-lg font-bold">
                            {aiRecommendations.analysisData.highWaterStressCount}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">الأمراض</p>
                          <p className="text-lg font-bold">
                            {aiRecommendations.analysisData.diseaseCount}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <h3 className="font-semibold">التوصيات ({aiRecommendations.recommendations.length})</h3>
                  {aiRecommendations.recommendations.map((rec: any, index: number) => (
                    <Card key={index} className="border-r-4" style={{
                      borderRightColor: rec.priority === 'high' ? '#f97316' : 
                                       rec.priority === 'medium' ? '#3b82f6' : '#6b7280'
                    }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{rec.title}</CardTitle>
                          <div className="flex gap-2">
                            <Badge className={priorityColors[rec.priority as keyof typeof priorityColors]}>
                              {priorityLabels[rec.priority as keyof typeof priorityLabels]}
                            </Badge>
                            <Badge variant="outline">
                              {timeframeLabels[rec.timeframe as keyof typeof timeframeLabels]}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAIDialogOpen(false)}
              >
                إغلاق
              </Button>
              <Button
                onClick={handleCreateFromAI}
                disabled={createFromRecommendations.isPending}
                className="gap-2"
              >
                {createFromRecommendations.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    إنشاء خطة عمل من التوصيات
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
