import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface DroneImageUploaderProps {
  farmId: number;
  fieldId?: number;
  onImageUploaded?: (imageId: number) => void;
}

interface UploadingFile {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  imageId?: number;
}

export default function DroneImageUploader({
  farmId,
  fieldId,
  onImageUploaded,
}: DroneImageUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = trpc.droneImages.upload.useMutation({
    onSuccess: (data, variables, context: any) => {
      // تحديث حالة الملف
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === context.file
            ? { ...f, status: 'success', progress: 100, imageId: data.imageId }
            : f
        )
      );

      toast.success('تم رفع الصورة بنجاح', {
        description: 'جاري معالجة الصورة...',
      });

      if (onImageUploaded) {
        onImageUploaded(data.imageId);
      }
    },
    onError: (error, variables, context: any) => {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === context.file
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      );

      toast.error('فشل رفع الصورة', {
        description: error.message,
      });
    },
  });

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const validFiles: UploadingFile[] = [];

      Array.from(files).forEach((file) => {
        // التحقق من نوع الملف
        if (!file.type.startsWith('image/')) {
          toast.error('نوع ملف غير مدعوم', {
            description: `${file.name} ليس صورة`,
          });
          return;
        }

        // التحقق من حجم الملف (100 MB max)
        if (file.size > 100 * 1024 * 1024) {
          toast.error('حجم الملف كبير جداً', {
            description: `${file.name} يجب أن يكون أقل من 100 ميجابايت`,
          });
          return;
        }

        // إنشاء معاينة
        const preview = URL.createObjectURL(file);

        validFiles.push({
          file,
          preview,
          progress: 0,
          status: 'pending',
        });
      });

      if (validFiles.length > 0) {
        setUploadingFiles((prev) => [...prev, ...validFiles]);

        // بدء الرفع
        validFiles.forEach((uploadingFile) => {
          uploadFile(uploadingFile);
        });
      }
    },
    [farmId, fieldId]
  );

  const uploadFile = async (uploadingFile: UploadingFile) => {
    try {
      // تحديث الحالة إلى "uploading"
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === uploadingFile.file
            ? { ...f, status: 'uploading', progress: 10 }
            : f
        )
      );

      // قراءة الملف كـ base64
      const reader = new FileReader();
      reader.readAsDataURL(uploadingFile.file);

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 50); // 0-50%
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === uploadingFile.file ? { ...f, progress } : f
            )
          );
        }
      };

      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // إزالة "data:image/jpeg;base64,"

        // تحديث التقدم إلى 50%
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === uploadingFile.file ? { ...f, progress: 50 } : f
          )
        );

        // رفع إلى السيرفر
        await uploadMutation.mutateAsync(
          {
            farmId,
            fieldId,
            fileName: uploadingFile.file.name,
            fileData: base64Data,
            captureDate: new Date(uploadingFile.file.lastModified),
          },
          {
            context: { file: uploadingFile.file },
          } as any
        );
      };

      reader.onerror = () => {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === uploadingFile.file
              ? { ...f, status: 'error', error: 'فشل قراءة الملف' }
              : f
          )
        );
      };
    } catch (error: any) {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === uploadingFile.file
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      );
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (file: File) => {
    setUploadingFiles((prev) => {
      const updated = prev.filter((f) => f.file !== file);
      // تنظيف URL
      const removed = prev.find((f) => f.file === file);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const clearCompleted = () => {
    setUploadingFiles((prev) => {
      const completed = prev.filter((f) => f.status === 'success' || f.status === 'error');
      completed.forEach((f) => URL.revokeObjectURL(f.preview));
      return prev.filter((f) => f.status !== 'success' && f.status !== 'error');
    });
  };

  return (
    <div className="space-y-4">
      {/* منطقة الرفع */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            اسحب وأفلت صور الطائرات هنا
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            أو انقر لاختيار الملفات
          </p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              اختر الصور
            </label>
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            الحد الأقصى لحجم الملف: 100 ميجابايت
            <br />
            التنسيقات المدعومة: JPG, PNG, TIFF, GeoTIFF
          </p>
        </div>
      </Card>

      {/* قائمة الملفات */}
      {uploadingFiles.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              الصور ({uploadingFiles.length})
            </h3>
            {uploadingFiles.some((f) => f.status === 'success' || f.status === 'error') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
              >
                مسح المكتملة
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {uploadingFiles.map((uploadingFile, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                {/* معاينة الصورة */}
                <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                  <img
                    src={uploadingFile.preview}
                    alt={uploadingFile.file.name}
                    className="h-full w-full object-cover"
                  />
                  {uploadingFile.status === 'success' && (
                    <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  )}
                  {uploadingFile.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>

                {/* معلومات الملف */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadingFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} ميجابايت
                  </p>

                  {/* شريط التقدم */}
                  {uploadingFile.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={uploadingFile.progress} className="h-1" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadingFile.progress}%
                      </p>
                    </div>
                  )}

                  {/* رسالة الخطأ */}
                  {uploadingFile.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1">
                      {uploadingFile.error}
                    </p>
                  )}

                  {/* رسالة النجاح */}
                  {uploadingFile.status === 'success' && (
                    <p className="text-xs text-green-500 mt-1">
                      تم الرفع بنجاح - جاري المعالجة...
                    </p>
                  )}
                </div>

                {/* زر الحذف */}
                {(uploadingFile.status === 'pending' ||
                  uploadingFile.status === 'error') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(uploadingFile.file)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
