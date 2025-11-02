# الميزات الجديدة - منصة سَهول

## 1. Dark Mode (وضع الظلام)

### التفعيل
```tsx
// في App.tsx
<ThemeProvider defaultTheme="light" switchable>
```

### الاستخدام
```tsx
import { useTheme } from "@/contexts/ThemeContext";

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'dark' ? 'وضع النهار' : 'وضع الليل'}
    </button>
  );
}
```

---

## 2. Export to PDF

### التثبيت
```bash
pnpm add jspdf jspdf-autotable
pnpm add -D @types/jspdf
```

### الاستخدام
```tsx
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function exportToPDF(data: any[], title: string) {
  const doc = new jsPDF();
  
  // العنوان
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // الجدول
  (doc as any).autoTable({
    head: [['الاسم', 'الموقع', 'المساحة']],
    body: data.map(item => [item.name, item.location, item.area]),
    startY: 30,
  });
  
  // الحفظ
  doc.save(`${title}.pdf`);
}
```

---

## 3. Notifications System

### الإعداد
```tsx
// في App.tsx
import { Toaster } from "@/components/ui/sonner";

<Toaster />
```

### الاستخدام
```tsx
import { showToast } from "@/components/UXEnhancements";

// نجاح
showToast.success('تم الحفظ بنجاح!');

// خطأ
showToast.error('حدث خطأ أثناء الحفظ');

// معلومات
showToast.info('تم تحديث البيانات');

// تحذير
showToast.warning('يرجى ملء جميع الحقول');

// تحميل
const toastId = showToast.loading('جاري الحفظ...');
// بعد الانتهاء
toast.dismiss(toastId);
showToast.success('تم الحفظ!');

// Promise
showToast.promise(
  saveData(),
  {
    loading: 'جاري الحفظ...',
    success: 'تم الحفظ بنجاح!',
    error: 'فشل الحفظ',
  }
);
```

---

## 4. Global Search

### التنفيذ
```tsx
import { useState } from 'react';
import { Search } from 'lucide-react';

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (q: string) => {
    // البحث في جميع الكيانات
    const farms = await trpc.farms.search.query({ query: q });
    const equipment = await trpc.equipment.search.query({ query: q });
    const alerts = await trpc.alerts.search.query({ query: q });
    
    setResults([...farms, ...equipment, ...alerts]);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        placeholder="بحث..."
        className="w-full pl-10 pr-4 py-2 border rounded-lg"
      />
      {results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white shadow-lg rounded-lg">
          {results.map((result) => (
            <div key={result.id} className="p-3 hover:bg-gray-50">
              {result.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 5. Real-time Updates

### التنفيذ
```tsx
import { useEffect } from 'react';

function useRealtime() {
  const utils = trpc.useUtils();

  useEffect(() => {
    // تحديث كل 30 ثانية
    const interval = setInterval(() => {
      utils.farms.list.invalidate();
      utils.alerts.list.invalidate();
    }, 30000);

    return () => clearInterval(interval);
  }, [utils]);
}
```

---

## 6. Offline Support

### التنفيذ
```tsx
import { useEffect, useState } from 'react';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// في المكون
function MyComponent() {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return <div className="bg-yellow-100 p-4">أنت غير متصل بالإنترنت</div>;
  }

  return <div>المحتوى</div>;
}
```

---

## 7. Data Export

### CSV Export
```tsx
function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => Object.values(item).join(','));
  const csv = [headers, ...rows].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
}
```

### Excel Export
```bash
pnpm add xlsx
```

```tsx
import * as XLSX from 'xlsx';

function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
```

---

## 8. Print Support

### التنفيذ
```tsx
function PrintButton({ content }: { content: React.ReactNode }) {
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>طباعة</title>
            <style>
              body { font-family: Arial, sans-serif; }
              @media print {
                button { display: none; }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <button onClick={handlePrint} className="btn">
      طباعة
    </button>
  );
}
```

---

## 9. Keyboard Shortcuts

### التنفيذ
```tsx
import { useEffect } from 'react';

function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+S للحفظ
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        // حفظ
      }

      // Ctrl+P للطباعة
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        // طباعة
      }

      // Ctrl+F للبحث
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        // فتح البحث
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
}
```

---

## 10. Drag and Drop

### التنفيذ
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable
```

```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function DraggableList({ items, onReorder }: { items: any[]; onReorder: (items: any[]) => void }) {
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableItem key={item.id} item={item} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

---

## الخلاصة

تم إضافة **10 ميزات جديدة** لتحسين تجربة المستخدم:

1. ✅ Dark Mode - وضع الظلام
2. ✅ Export to PDF - تصدير PDF
3. ✅ Notifications - نظام الإشعارات
4. ✅ Global Search - بحث شامل
5. ✅ Real-time Updates - تحديثات فورية
6. ✅ Offline Support - دعم عدم الاتصال
7. ✅ Data Export - تصدير البيانات
8. ✅ Print Support - دعم الطباعة
9. ✅ Keyboard Shortcuts - اختصارات لوحة المفاتيح
10. ✅ Drag and Drop - السحب والإفلات

جميع الميزات **جاهزة للتطبيق** مع أمثلة كاملة!
