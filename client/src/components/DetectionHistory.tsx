import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, Calendar, Image as ImageIcon } from 'lucide-react';

interface DetectionHistoryProps {
  farmId?: number;
  limit?: number;
  onViewDetails?: (detectionId: number) => void;
}

export default function DetectionHistory({
  farmId,
  limit = 20,
  onViewDetails,
}: DetectionHistoryProps) {
  const { data: detections, isLoading } = trpc.diseaseDetection.getHistory.useQuery({
    farmId,
    limit,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!detections || detections.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>لا توجد عمليات كشف سابقة</p>
        </div>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">مكتمل</Badge>;
      case 'processing':
        return <Badge variant="secondary">جاري المعالجة</Badge>;
      case 'failed':
        return <Badge variant="destructive">فشل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">سجل الكشف</h3>
      <div className="space-y-3">
        {detections.map((detection) => (
          <div
            key={detection.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              {/* صورة مصغرة */}
              {detection.imageUrl && (
                <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={detection.imageUrl}
                    alt="Detection"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* المعلومات */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">{detection.cropType}</p>
                  {getStatusBadge(detection.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(detection.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                  {detection.fieldId && (
                    <span>الحقل #{detection.fieldId}</span>
                  )}
                </div>
              </div>
            </div>

            {/* زر العرض */}
            {detection.status === 'completed' && onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(detection.id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                عرض
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
