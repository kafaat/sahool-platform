import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Search, BookOpen, AlertTriangle } from 'lucide-react';
import { Streamdown } from 'streamdown';

export default function DiseaseDatabase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDisease, setSelectedDisease] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: diseases, isLoading } = trpc.diseaseDetection.getAllDiseases.useQuery({});

  const filteredDiseases = diseases?.filter((disease) =>
    disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disease.cropType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'منخفض';
      case 'moderate':
        return 'متوسط';
      case 'high':
        return 'عالي';
      case 'critical':
        return 'حرج';
      default:
        return severity;
    }
  };

  const handleViewDetails = (disease: any) => {
    setSelectedDisease(disease);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          {/* رأس القسم */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              قاعدة بيانات الأمراض
            </h3>
            <Badge variant="outline">{diseases?.length || 0} مرض</Badge>
          </div>

          {/* البحث */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مرض أو محصول..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* قائمة الأمراض */}
          {!filteredDiseases || filteredDiseases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد أمراض مطابقة للبحث</p>
            </div>
          ) : (
            <div className="grid gap-3 max-h-[600px] overflow-y-auto">
              {filteredDiseases.map((disease) => (
                <div
                  key={disease.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(disease)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{disease.name}</h4>
                      {disease.scientificName && (
                        <p className="text-sm text-muted-foreground italic">
                          {disease.scientificName}
                        </p>
                      )}
                    </div>
                    <Badge className={getSeverityColor(disease.severity)}>
                      {getSeverityLabel(disease.severity)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{disease.cropType}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Dialog التفاصيل */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedDisease && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedDisease.name}</DialogTitle>
                {selectedDisease.scientificName && (
                  <p className="text-sm text-muted-foreground italic">
                    {selectedDisease.scientificName}
                  </p>
                )}
              </DialogHeader>

              <div className="space-y-4">
                {/* الصورة */}
                {selectedDisease.imageUrl && (
                  <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={selectedDisease.imageUrl}
                      alt={selectedDisease.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* المعلومات الأساسية */}
                <div className="flex gap-2">
                  <Badge variant="outline">{selectedDisease.cropType}</Badge>
                  <Badge className={getSeverityColor(selectedDisease.severity)}>
                    الخطورة: {getSeverityLabel(selectedDisease.severity)}
                  </Badge>
                </div>

                {/* الأعراض */}
                {selectedDisease.symptoms && (
                  <div>
                    <h4 className="font-semibold mb-2">الأعراض</h4>
                    <div className="p-3 bg-muted rounded-lg">
                      <Streamdown>{selectedDisease.symptoms}</Streamdown>
                    </div>
                  </div>
                )}

                {/* الأسباب */}
                {selectedDisease.causes && (
                  <div>
                    <h4 className="font-semibold mb-2">الأسباب</h4>
                    <div className="p-3 bg-muted rounded-lg">
                      <Streamdown>{selectedDisease.causes}</Streamdown>
                    </div>
                  </div>
                )}

                {/* العلاج */}
                {selectedDisease.treatment && (
                  <div>
                    <h4 className="font-semibold mb-2">العلاج</h4>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Streamdown>{selectedDisease.treatment}</Streamdown>
                    </div>
                  </div>
                )}

                {/* الوقاية */}
                {selectedDisease.prevention && (
                  <div>
                    <h4 className="font-semibold mb-2">الوقاية</h4>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <Streamdown>{selectedDisease.prevention}</Streamdown>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
