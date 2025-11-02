import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { MapPin, Plus, Search, Trash2, Edit, TrendingUp } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { NoFarmsEmptyState } from "@/components/EmptyStates";

// تحسين 1: Types منفصلة
interface Farm {
  id: number;
  name: string;
  location: string | null;
  totalArea: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FarmCardProps {
  farm: Farm;
  onDelete: (id: number) => void;
  onEdit: (farm: Farm) => void;
}

// تحسين 2: مكون منفصل لبطاقة المزرعة
function FarmCard({ farm, onDelete, onEdit }: FarmCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف ${farm.name}؟`)) return;

    setIsDeleting(true);
    try {
      await onDelete(farm.id);
      toast.success('تم حذف المزرعة بنجاح');
    } catch (error) {
      toast.error('فشل حذف المزرعة');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">{farm.name}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(farm)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {farm.location || 'لم يتم تحديد الموقع'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">المساحة الإجمالية</p>
            <p className="text-lg font-semibold">
              {farm.totalArea ? `${farm.totalArea} هكتار` : 'غير محدد'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">تاريخ الإنشاء</p>
            <p className="text-lg font-semibold">
              {new Date(farm.createdAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// تحسين 3: مكون Skeleton منفصل
function FarmsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// تحسين 4: مكون Empty State
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold mb-2">لا توجد مزارع</h3>
        <p className="text-gray-500 mb-6">
          ابدأ بإضافة أول مزرعة لك لإدارة عملياتك الزراعية
        </p>
        <Button onClick={onAddClick} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          إضافة مزرعة جديدة
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Farms() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'area' | 'date'>('name');

  // تحسين 5: استخدام tRPC مع optimistic updates
  const utils = trpc.useUtils();
  const {
    data: farms,
    isLoading,
    error,
  } = trpc.farms.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = trpc.farms.delete.useMutation({
    // تحسين 6: Optimistic update
    onMutate: async (deletedId) => {
      await utils.farms.list.cancel();
      const previousFarms = utils.farms.list.getData();

      utils.farms.list.setData(undefined, (old) =>
        old?.filter((farm) => farm.id !== deletedId.farmId)
      );

      return { previousFarms };
    },
    onError: (err, deletedId, context) => {
      utils.farms.list.setData(undefined, context?.previousFarms);
      toast.error('فشل حذف المزرعة');
    },
    onSuccess: () => {
      toast.success('تم حذف المزرعة بنجاح');
    },
  });

  // تحسين 7: استخدام useMemo للفلترة والترتيب
  const filteredAndSortedFarms = useMemo(() => {
    if (!farms) return [];

    let filtered = farms;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (farm) =>
          farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          farm.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'ar');
        case 'area':
          return (b.totalArea || 0) - (a.totalArea || 0);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [farms, searchQuery, sortBy]);

  // تحسين 8: استخدام useCallback
  const handleDelete = useCallback(
    (id: number) => {
      deleteMutation.mutate({ farmId: id });
    },
    [deleteMutation]
  );

  const handleEdit = useCallback((farm: Farm) => {
    // TODO: Open edit dialog
    console.log('Edit farm:', farm);
    toast.info('ميزة التعديل قيد التطوير');
  }, []);

  const handleAddFarm = useCallback(() => {
    // TODO: Open add dialog
    toast.info('ميزة الإضافة قيد التطوير');
  }, []);

  if (error) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">خطأ في تحميل المزارع</CardTitle>
            <CardDescription>
              {error.message || 'حدث خطأ غير متوقع'}
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">المزارع</h1>
            <p className="text-gray-500 mt-1">
              إدارة جميع مزارعك في مكان واحد
            </p>
          </div>
          <Button
            onClick={handleAddFarm}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            إضافة مزرعة
          </Button>
        </div>

        {/* Stats */}
        {farms && farms.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>إجمالي المزارع</CardDescription>
                <CardTitle className="text-3xl">{farms.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>المساحة الإجمالية</CardDescription>
                <CardTitle className="text-3xl">
                  {farms.reduce((sum, farm) => sum + (farm.totalArea || 0), 0)} هكتار
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>متوسط المساحة</CardDescription>
                <CardTitle className="text-3xl">
                  {Math.round(
                    farms.reduce((sum, farm) => sum + (farm.totalArea || 0), 0) /
                      farms.length
                  )}{' '}
                  هكتار
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="ابحث عن مزرعة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              onClick={() => setSortBy('name')}
              size="sm"
            >
              الاسم
            </Button>
            <Button
              variant={sortBy === 'area' ? 'default' : 'outline'}
              onClick={() => setSortBy('area')}
              size="sm"
            >
              المساحة
            </Button>
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              onClick={() => setSortBy('date')}
              size="sm"
            >
              التاريخ
            </Button>
          </div>
        </div>

        {/* Farms Grid */}
        {isLoading ? (
          <FarmsSkeleton />
        ) : filteredAndSortedFarms.length === 0 ? (
          searchQuery ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-500">
                  لم يتم العثور على نتائج لـ "{searchQuery}"
                </p>
              </CardContent>
            </Card>
          ) : (
            <NoFarmsEmptyState onAddFarm={handleAddFarm} />
          )
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedFarms.map((farm) => (
              <FarmCard
                key={farm.id}
                farm={farm}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
