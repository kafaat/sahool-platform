import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Plus, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function Farms() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");
  const [totalArea, setTotalArea] = useState("");

  const { data: farms, isLoading } = trpc.farms.list.useQuery();
  const utils = trpc.useUtils();
  
  const createFarm = trpc.farms.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المزرعة بنجاح");
      utils.farms.list.invalidate();
      setIsDialogOpen(false);
      setFarmName("");
      setLocation("");
      setTotalArea("");
    },
    onError: (error) => {
      toast.error("فشل إضافة المزرعة: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFarm.mutate({
      name: farmName,
      location: location || undefined,
      totalArea: totalArea ? parseInt(totalArea) : undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">المزارع</h1>
            <p className="text-muted-foreground mt-2">
              إدارة المزارع والحقول الخاصة بك
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 ml-2" />
            إضافة مزرعة
          </Button>
        </div>

        {isLoading ? (
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
        ) : farms && farms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => (
              <Card key={farm.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle>{farm.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {farm.location || "الموقع غير محدد"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المساحة الكلية:</span>
                      <span className="font-medium">
                        {farm.totalArea ? `${farm.totalArea} هكتار` : "غير محدد"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                      <span className="font-medium">
                        {new Date(farm.createdAt).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="bg-green-50 p-4 rounded-full mb-4">
                <MapPin className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">لا توجد مزارع مسجلة</h3>
              <p className="text-sm text-muted-foreground mb-4">
                ابدأ بإضافة مزرعتك الأولى
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 ml-2" />
                إضافة مزرعة
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مزرعة جديدة</DialogTitle>
              <DialogDescription>
                أدخل معلومات المزرعة الجديدة
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المزرعة *</Label>
                  <Input
                    id="name"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="مثال: مزرعة النخيل"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">الموقع</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="مثال: الرياض، المملكة العربية السعودية"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalArea">المساحة الكلية (هكتار)</Label>
                  <Input
                    id="totalArea"
                    type="number"
                    value={totalArea}
                    onChange={(e) => setTotalArea(e.target.value)}
                    placeholder="مثال: 100"
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
                <Button type="submit" disabled={createFarm.isPending}>
                  {createFarm.isPending ? "جاري الإضافة..." : "إضافة"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
