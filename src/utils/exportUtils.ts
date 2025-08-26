import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// تحديد نوع jsPDF مع autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ExportOptions {
  title: string;
  data: any[];
  columns: { header: string; dataKey: string }[];
  companyName: string;
  companyLogo?: string;
  filename: string;
}

// تصدير PDF
export const exportToPDF = async (options: ExportOptions) => {
  const { title, data, columns, companyName, companyLogo, filename } = options;
  
  const doc = new jsPDF();
  
  // إعداد الخط العربي (يمكن تحسينه لاحقاً)
  doc.setFont('helvetica');
  
  let yPosition = 20;
  
  // إضافة اللوجو إذا كان متوفراً
  if (companyLogo) {
    try {
      doc.addImage(companyLogo, 'PNG', 15, 10, 30, 30);
      yPosition = 50;
    } catch (error) {
      console.error('خطأ في إضافة اللوجو:', error);
    }
  }
  
  // عنوان الشركة
  doc.setFontSize(16);
  doc.text(companyName, companyLogo ? 50 : 15, companyLogo ? 25 : 20);
  
  // عنوان التقرير
  doc.setFontSize(14);
  doc.text(title, 15, yPosition);
  
  // تاريخ التقرير
  doc.setFontSize(10);
  doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, 15, yPosition + 10);
  
  // الجدول
  doc.autoTable({
    startY: yPosition + 20,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] || '')),
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [95, 151, 157], // اللون الأساسي
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [180, 225, 230, 0.3], // اللون الثانوي بشفافية
    },
    margin: { top: 10, right: 15, bottom: 10, left: 15 },
  });
  
  // حفظ الملف
  doc.save(`${filename}.pdf`);
};

// تصدير Excel
export const exportToExcel = (options: ExportOptions) => {
  const { title, data, columns, companyName, filename } = options;
  
  // إنشاء workbook جديد
  const wb = XLSX.utils.book_new();
  
  // إعداد البيانات للتصدير
  const exportData = data.map(row => {
    const newRow: any = {};
    columns.forEach(col => {
      newRow[col.header] = row[col.dataKey] || '';
    });
    return newRow;
  });
  
  // إنشاء worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);
  
  // إضافة معلومات الشركة والتقرير في الأعلى
  const headerData = [
    [companyName],
    [title],
    [`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`],
    [], // سطر فارغ
  ];
  
  // دمج البيانات
  const finalData = [...headerData, ...XLSX.utils.sheet_to_json(ws, { header: 1 })];
  const finalWs = XLSX.utils.aoa_to_sheet(finalData);
  
  // تنسيق العرض
  const range = XLSX.utils.decode_range(finalWs['!ref'] || 'A1');
  finalWs['!cols'] = [];
  for (let i = 0; i <= range.e.c; i++) {
    finalWs['!cols'][i] = { wch: 15 };
  }
  
  // إضافة الورقة إلى الكتاب
  XLSX.utils.book_append_sheet(wb, finalWs, 'التقرير');
  
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
          date: new Date(item.date).toLocaleDateString('ar-SA'),
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
          date: new Date(item.date).toLocaleDateString('ar-SA'),
          totalWorkHours: `${item.totalWorkHours} ساعة`,
        }))
      };
      
    default:
      return { columns: [], data: [] };
  }
};