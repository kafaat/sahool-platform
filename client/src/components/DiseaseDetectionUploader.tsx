import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { storagePut } from '../../../server/storage';

interface DiseaseDetectionUploaderProps {
  farmId: number;
  fieldId?: number;
  onUploadComplete?: (detectionId: number) => void;
}

export default function DiseaseDetectionUploader({
  farmId,
  fieldId,
  onUploadComplete,
}: DiseaseDetectionUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropType, setCropType] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const uploadMutation = trpc.diseaseDetection.uploadImage.useMutation();
  const simulateMutation = trpc.diseaseDetection.simulateYOLO.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    // التحقق من حجم الملف (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 10MB');
      return;
    }

    setSelectedFile(file);

    // إنشاء معاينة
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !cropType) {
      toast.error('يرجى اختيار صورة ونوع المحصول');
      return;
    }

    try {
      setUploading(true);

      // رفع الصورة إلى S3
      const fileBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(fileBuffer);
      
      // إنشاء مفتاح فريد للملف
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `disease-detection/${farmId}/${timestamp}-${randomSuffix}.${selectedFile.name.split('.').pop()}`;

      // رفع إلى S3 (ملاحظة: هذا يحتاج تنفيذ من جانب السيرفر)
      // في الوقت الحالي، سنستخدم URL محلي مؤقت
      const imageUrl = previewUrl || '';

      // إنشاء سجل في قاعدة البيانات
      const result = await uploadMutation.mutateAsync({
        farmId,
        fieldId,
        imageUrl,
        cropType,
      });

      toast.success('تم رفع الصورة بنجاح');

      // بدء المعالجة التلقائية
      setProcessing(true);
      await simulateMutation.mutateAsync({
        detectionId: result.detectionId,
      });

      toast.success('اكتملت المعالجة بنجاح!');
      
      if (onUploadComplete) {
        onUploadComplete(result.detectionId);
      }

      // إعادة تعيين النموذج
      setSelectedFile(null);
      setPreviewUrl(null);
      setCropType('');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'فشل في رفع الصورة');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const cropTypes = [
    { value: 'tomato', label: 'طماطم' },
    { value: 'potato', label: 'بطاطس' },
    { value: 'corn', label: 'ذرة' },
    { value: 'grape', label: 'عنب' },
    { value: 'apple', label: 'تفاح' },
    { value: 'pepper', label: 'فلفل' },
    { value: 'strawberry', label: 'فراولة' },
    { value: 'peach', label: 'خوخ' },
    { value: 'other', label: 'أخرى' },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">رفع صورة للتحليل</h3>

      <div className="space-y-4">
        {/* اختيار نوع المحصول */}
        <div>
          <Label htmlFor="cropType">نوع المحصول *</Label>
          <Select value={cropType} onValueChange={setCropType}>
            <SelectTrigger id="cropType">
              <SelectValue placeholder="اختر نوع المحصول" />
            </SelectTrigger>
            <SelectContent>
              {cropTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* رفع الصورة */}
        <div>
          <Label htmlFor="image">الصورة *</Label>
          <div className="mt-2">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading || processing}
            />
          </div>
        </div>

        {/* معاينة الصورة */}
        {previewUrl && (
          <div className="mt-4">
            <Label>معاينة الصورة</Label>
            <div className="mt-2 border rounded-lg overflow-hidden">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-contain bg-muted"
              />
            </div>
          </div>
        )}

        {/* حالة المعالجة */}
        {processing && (
          <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">جاري التحليل...</p>
              <p className="text-sm text-blue-700">
                يتم تحليل الصورة باستخدام نموذج YOLO. قد يستغرق هذا بضع ثوانٍ.
              </p>
            </div>
          </div>
        )}

        {/* زر الرفع */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !cropType || uploading || processing}
          className="w-full"
        >
          {uploading || processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploading ? 'جاري الرفع...' : 'جاري التحليل...'}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              رفع وتحليل
            </>
          )}
        </Button>

        {/* معلومات إضافية */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• الحد الأقصى لحجم الصورة: 10MB</p>
          <p>• الصيغ المدعومة: JPG, PNG, JPEG</p>
          <p>• سيتم تحليل الصورة تلقائياً بعد الرفع</p>
          <p>• وقت التحليل المتوقع: 3-5 ثوانٍ</p>
        </div>
      </div>
    </Card>
  );
}
