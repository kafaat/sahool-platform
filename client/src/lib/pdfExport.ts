import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * تصدير عنصر HTML إلى PDF
 * @param elementId - ID العنصر المراد تصديره
 * @param filename - اسم الملف (بدون .pdf)
 * @param options - خيارات إضافية
 */
export async function exportToPDF(
  elementId: string,
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'letter';
    quality?: number;
  }
): Promise<void> {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    // التقاط العنصر كصورة
    const canvas = await html2canvas(element, {
      scale: options?.quality || 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    
    // إنشاء PDF
    const pdf = new jsPDF({
      orientation: options?.orientation || 'portrait',
      unit: 'mm',
      format: options?.format || 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(
      imgData,
      'PNG',
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );

    // حفظ الملف
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
}

/**
 * تصدير جدول إلى PDF
 * @param data - البيانات (array of objects)
 * @param columns - الأعمدة المراد عرضها
 * @param filename - اسم الملف
 * @param title - عنوان التقرير
 */
export async function exportTableToPDF<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: keyof T; label: string; width?: number }>,
  filename: string,
  title?: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  let yPosition = margin;

  // إضافة العنوان
  if (title) {
    pdf.setFontSize(16);
    pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  }

  // إضافة التاريخ
  pdf.setFontSize(10);
  pdf.text(
    `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`,
    pageWidth - margin,
    yPosition,
    { align: 'right' }
  );
  yPosition += 10;

  // حساب عرض الأعمدة
  const totalWidth = pageWidth - 2 * margin;
  const columnWidths = columns.map(col => 
    col.width || totalWidth / columns.length
  );

  // رسم رأس الجدول
  pdf.setFillColor(22, 163, 74); // أخضر
  pdf.rect(margin, yPosition, totalWidth, 10, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  
  let xPosition = margin;
  columns.forEach((col, index) => {
    pdf.text(
      col.label,
      xPosition + columnWidths[index] / 2,
      yPosition + 7,
      { align: 'center' }
    );
    xPosition += columnWidths[index];
  });
  
  yPosition += 10;

  // رسم البيانات
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);

  data.forEach((row, rowIndex) => {
    // التحقق من الحاجة لصفحة جديدة
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = margin;
    }

    // رسم خلفية الصف (تبديل الألوان)
    if (rowIndex % 2 === 0) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, yPosition, totalWidth, 8, 'F');
    }

    xPosition = margin;
    columns.forEach((col, index) => {
      const value = String(row[col.key] || '-');
      pdf.text(
        value,
        xPosition + columnWidths[index] / 2,
        yPosition + 6,
        { align: 'center', maxWidth: columnWidths[index] - 2 }
      );
      xPosition += columnWidths[index];
    });

    yPosition += 8;
  });

  // إضافة رقم الصفحة
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.text(
      `صفحة ${i} من ${pageCount}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  pdf.save(`${filename}.pdf`);
}

/**
 * تصدير Dashboard إلى PDF
 */
export async function exportDashboardToPDF(
  stats: Record<string, any>,
  charts: Array<{ title: string; elementId: string }>,
  filename: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 10;
  let yPosition = margin;

  // العنوان
  pdf.setFontSize(18);
  pdf.text('تقرير لوحة التحكم', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // التاريخ
  pdf.setFontSize(10);
  pdf.text(
    `تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );
  yPosition += 15;

  // الإحصائيات
  pdf.setFontSize(14);
  pdf.text('الإحصائيات:', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(11);
  Object.entries(stats).forEach(([key, value]) => {
    pdf.text(`${key}: ${value}`, margin + 5, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // الرسوم البيانية
  for (const chart of charts) {
    const element = document.getElementById(chart.elementId);
    if (!element) continue;

    // صفحة جديدة للرسم البياني
    pdf.addPage();
    yPosition = margin;

    pdf.setFontSize(14);
    pdf.text(chart.title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
    } catch (error) {
      console.error(`Error capturing chart ${chart.title}:`, error);
    }
  }

  pdf.save(`${filename}.pdf`);
}
