import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { MapPin, Activity, Fuel, Thermometer, RefreshCw } from "lucide-react";
import { MapView } from "@/components/Map";

// بيانات تجريبية للمعدات النشطة
const generateMockEquipmentData = (equipment: any[]) => {
  return equipment.map((eq) => ({
    ...eq,
    location: {
      lat: 24.7136 + (Math.random() - 0.5) * 0.1,
      lng: 46.6753 + (Math.random() - 0.5) * 0.1,
    },
    speed: Math.floor(Math.random() * 20) + 5,
    fuelLevel: Math.floor(Math.random() * 100),
    engineTemp: Math.floor(Math.random() * 30) + 70,
    isMoving: Math.random() > 0.3,
  }));
};

export default function LiveMonitoring() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);

  const { data: farms } = trpc.farms.list.useQuery();
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  const { data: equipment } = trpc.equipment.list.useQuery(
    { farmId: selectedFarmId! },
    { enabled: selectedFarmId !== null }
  );

  // اختيار أول مزرعة تلقائياً
  if (farms && farms.length > 0 && selectedFarmId === null) {
    setSelectedFarmId(farms[0].id);
  }

  const activeEquipment = equipment ? generateMockEquipmentData(equipment) : [];

  // تحديث تلقائي كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleMapReady = (map: any) => {
    // إضافة علامات للمعدات على الخريطة
    activeEquipment.forEach((eq: any) => {
      // @ts-ignore
      const marker = new google.maps.Marker({
        position: eq.location,
        map: map,
        title: eq.name,
        icon: {
          // @ts-ignore
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: eq.isMoving ? "#22c55e" : "#ef4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        setSelectedEquipment(eq.id);
      });
    });

    // تمركز الخريطة على أول معدة
    if (activeEquipment.length > 0) {
      map.setCenter(activeEquipment[0].location);
      map.setZoom(12);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">المراقبة الحية</h1>
            <p className="text-muted-foreground mt-2">
              تتبع المعدات في الوقت الفعلي
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
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

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    معدات نشطة
                  </p>
                  <p className="text-2xl font-bold">
                    {activeEquipment.filter((e: any) => e.isMoving).length}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    معدات خاملة
                  </p>
                  <p className="text-2xl font-bold">
                    {activeEquipment.filter((e: any) => !e.isMoving).length}
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    متوسط السرعة
                  </p>
                  <p className="text-2xl font-bold">
                    {activeEquipment.length > 0
                      ? Math.floor(
                          activeEquipment.reduce((sum: number, e: any) => sum + e.speed, 0) /
                            activeEquipment.length
                        )
                      : 0}{" "}
                    كم/س
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    آخر تحديث
                  </p>
                  <p className="text-sm font-bold">
                    {new Date().toLocaleTimeString("ar-SA")}
                  </p>
                </div>
                <RefreshCw className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>خريطة المواقع</CardTitle>
              <CardDescription>مواقع المعدات في الوقت الفعلي</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] rounded-lg overflow-hidden border">
                <MapView onMapReady={handleMapReady} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>المعدات النشطة</CardTitle>
              <CardDescription>حالة المعدات الحالية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {activeEquipment.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    لا توجد معدات نشطة
                  </p>
                ) : (
                  activeEquipment.map((eq: any) => (
                    <Card
                      key={eq.id}
                      className={`cursor-pointer transition-all ${
                        selectedEquipment === eq.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedEquipment(eq.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{eq.name}</h4>
                            <p className="text-xs text-muted-foreground">{eq.type}</p>
                          </div>
                          <Badge
                            className={eq.isMoving ? "bg-green-500" : "bg-gray-500"}
                          >
                            {eq.isMoving ? "نشط" : "خامل"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            <span>{eq.speed} كم/س</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Fuel className="h-3 w-3" />
                            <span>{eq.fuelLevel}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Thermometer className="h-3 w-3" />
                            <span>{eq.engineTemp}°C</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {eq.location.lat.toFixed(4)}, {eq.location.lng.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
