import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExportOptions {
  title: string;
  data: any[];
  columns: { header: string; dataKey: string }[];
  companyName: string;
  companyLogo?: string;
  filename: string;
}


// تصدير Excel بسيط وبدون تعقيد
export const exportToExcel = (options: ExportOptions) => {
  const { title, data, columns, companyName, filename } = options;

  // إنشاء workbook جديد
  const wb = XLSX.utils.book_new();

  // تحويل البيانات إلى تنسيق Excel بسيط
  const exportData = data.map(row => {
    const newRow: any = {};
    columns.forEach(col => {
      newRow[col.header] = row[col.dataKey] || '';
    });
    return newRow;
  });

  // إنشاء worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // إضافة الورقة إلى الكتاب
  XLSX.utils.book_append_sheet(wb, ws, title);

  // تصدير الملف
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

// دالة مساعدة لتحضير بيانات التقرير
export const prepareReportData = (rawData: any[], type: string) => {
  switch (type) {
    case 'productivity':
      return {
        columns: [
          { header: 'التاريخ', dataKey: 'date' },
          { header: 'إجمالي الإنجازات', dataKey: 'totalAchievements' },
          { header: 'المهام المنجزة', dataKey: 'tasksWorked' },
          { header: 'ساعات العمل', dataKey: 'totalWorkHours' },
          { header: 'مرات الحضور', dataKey: 'totalCheckIns' },
          { header: 'الوسائط', dataKey: 'mediaUploaded' },
        ],
        data: rawData.map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('en-US'),
          totalWorkHours: `${item.totalWorkHours.toFixed(1)} ساعة`,
        }))
      };
      
    case 'teams':
      return {
        columns: [
          { header: 'الفريق', dataKey: 'teamName' },
          { header: 'إجمالي المهام', dataKey: 'totalTasks' },
          { header: 'المكتملة', dataKey: 'completedTasks' },
          { header: 'المتأخرة', dataKey: 'overdueTasks' },
          { header: 'الإنجازات', dataKey: 'totalAchievements' },
          { header: 'الكفاءة', dataKey: 'efficiency' },
          { header: 'متوسط التقدم', dataKey: 'avgProgress' },
        ],
        data: rawData.map(item => ({
          ...item,
          efficiency: `${item.efficiency}%`,
          avgProgress: `${item.avgProgress}%`,
        }))
      };
      
    case 'attendance':
      return {
        columns: [
          { header: 'التاريخ', dataKey: 'date' },
          { header: 'الفريق', dataKey: 'teamName' },
          { header: 'المهمة', dataKey: 'taskTitle' },
          { header: 'المشروع', dataKey: 'projectName' },
          { header: 'مرات الحضور', dataKey: 'checkIns' },
          { header: 'مرات الانصراف', dataKey: 'checkOuts' },
          { header: 'ساعات العمل', dataKey: 'totalWorkHours' },
        ],
        data: rawData.map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('en-US'),
          totalWorkHours: `${item.totalWorkHours} ساعة`,
        }))
      };
      
    default:
      return { columns: [], data: [] };
  }
};

// وظيفة الطباعة
export const printReport = (options: ExportOptions) => {
  const { title, data, columns, companyName, companyLogo } = options;

  // إنشاء نافذة طباعة جديدة
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بفتح النوافذ المنبثقة للطباعة');
    return;
  }

  // إنشاء محتوى HTML للطباعة
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @media print {
          body { font-family: 'Arial', sans-serif; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #5F979D; padding-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #5F979D; margin-bottom: 10px; }
          .report-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .report-info { font-size: 12px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 11px; }
          th { background-color: #5F979D; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8f9fa; }
          .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
          .logo { max-width: 80px; max-height: 80px; margin-bottom: 10px; }
          @page { margin: 1cm; }
        }
        @media screen {
          body { font-family: 'Arial', sans-serif; direction: rtl; padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${companyLogo ? `<img src="${companyLogo}" alt="شعار الشركة" class="logo">` : ''}
        <div class="company-name">${companyName}</div>
        <div class="report-title">${title}</div>
        <div class="report-info">
          تاريخ التقرير: ${new Date().toLocaleDateString('en-US')} |
          عدد السجلات: ${data.length}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => {
                const value = row[col.dataKey];
                let displayValue = value || '';
                // تنسيق القيم العددية
                if (typeof value === 'number') {
                  displayValue = value.toLocaleString('en-US');
                }
                return `<td>${displayValue}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        تم إنشاء هذا التقرير بواسطة نظام إدارة المشاريع |
        تاريخ الطباعة: ${new Date().toLocaleString('en-US')}
      </div>
    </body>
    </html>
  `;

  // كتابة المحتوى في النافذة
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // انتظار تحميل المحتوى ثم الطباعة
  printWindow.onload = () => {
    printWindow.print();
    // إغلاق النافذة بعد الطباعة (اختياري)
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  };
};
