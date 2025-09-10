import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ChecklistItem {
  id: number;
  item: string;
  status: string;
  note: string;
}

interface TechnicalAuditReport {
  id: string;
  submitted_to: string;
  prepared_by: string;
  audited_entity: string;
  project_id?: string;
  executing_entity: string;
  report_date: string;
  signature_data?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface ChecklistItemData {
  id: string | number; // Allow both for React keys and database IDs
  report_id: string;
  section_id: number;
  item_id: number;
  item_text: string;
  status: string;
  note: string;
}

interface MediaFile {
  id: string;
  report_id: string;
  section_id: number;
  file_name: string;
  file_type: string;
  file_url: string;
}

const TechnicalAuditReport: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [submittedTo, setSubmittedTo] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [auditedEntity, setAuditedEntity] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [executingEntity, setExecutingEntity] = useState('');
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Projects data
  const [projects, setProjects] = useState<Project[]>([]);

  // Checklist data
  const [checklistData, setChecklistData] = useState<ChecklistItemData[]>([]);

  // Media files
  const [mediaFiles, setMediaFiles] = useState<{[key: number]: File[]}>({});

  // Audio recordings
  const [audioRecordings, setAudioRecordings] = useState<{[key: number]: Blob | null}>({});

  // Signature
  const [signatureData, setSignatureData] = useState<string>('');
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Reports list for dropdown
  const [savedReports, setSavedReports] = useState<TechnicalAuditReport[]>([]);

  // Audio recording state
  const [recordingStates, setRecordingStates] = useState<{[key: number]: boolean}>({});
  const mediaRecorders = useRef<{[key: number]: MediaRecorder | null}>({});
  const audioChunks = useRef<{[key: number]: Blob[]}>({});

  // Get current date in Arabic
  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory',
      numberingSystem: 'arab'
    };
    return today.toLocaleDateString('ar-SA', options);
  };

  // Initialize checklist data structure
  const initializeChecklistData = () => {
    const sections = [
      {
        sectionId: 1,
        items: [
          { id: 1, text: 'توفير نظام تهوية أو تبريد مناسب لطبيعة العمل داخل الموقع (حسب درجة الحرارة والرطوبة المطلوبة).' },
          { id: 2, text: 'تأمين مصدر طاقة كهربائي كافٍ (بمعدل الجهد والقدرة المطلوبة) في كل دور يشمله العمل.' }
        ]
      },
      {
        sectionId: 2,
        items: [
          { id: 1, text: 'لا توجد ورش عمل أو أنشطة لمقاولين آخرين داخل مساحات العمل المخصصة لرفع القياسات أو تركيب الخزائن (ضمان بيئة عمل آمنة ومنظمة)' },
          { id: 2, text: 'تم إصدار تصريح دخول دائم لفريق العمل التابع للمنفذ خلال ساعات الدوام الرسمي (مع تضمين أسماء وأرقام الموظفين)' }
        ]
      },
      {
        sectionId: 3,
        items: [
          { id: 1, text: 'هل تم رفع تقرير مبدئي خلال 48 ساعة من بدء التركيب؟ (للتحقق من الشروط المطلوبة قبل التنفيذ)' },
          { id: 2, text: 'في حال وجود ملاحظات في الموقع، تم إعداد تقرير مفصل وتوثيقه رسميًا ورفعه للجهة المعنية.' },
          { id: 3, text: 'يرفع التقرير إلى الإدارة التنفيذية مع الجهة صاحبة المشروع خلال 24 ساعة كحد أقصى لطلب الرد على التقرير والملاحظات المرفقة.' }
        ]
      },
      {
        sectionId: 4,
        items: [
          { id: 1, text: 'هل الموقع جاهز لبدء العمل؟' },
          { id: 2, text: 'ما هي الإجراءات المطلوبة (إن وُجدت)؟' }
        ]
      }
    ];

    const initialData: ChecklistItemData[] = [];
    sections.forEach(section => {
      section.items.forEach(item => {
        initialData.push({
          id: `${section.sectionId}-${item.id}`, // Use a simple string ID for React keys
          report_id: '',
          section_id: section.sectionId,
          item_id: item.id,
          item_text: item.text,
          status: '',
          note: ''
        });
      });
    });

    setChecklistData(initialData);
  };

  // Load projects
  const loadProjects = async () => {
    if (!user) {
      console.log('No user found');
      return;
    }

    try {
      console.log('Loading projects for user:', user.id);

      // Get user's profile to find their team_id and role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile query error:', profileError);
        throw profileError;
      }

      console.log('User profile:', profile);
      console.log('User role:', profile.role);

      // Load all projects (same as DataContext)
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, status, team_id')
        .order('name');

      if (error) {
        console.error('Projects query error:', error);
        throw error;
      }

      console.log('Projects loaded:', data?.length || 0, 'projects');
      setProjects(data || []);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError('فشل في تحميل قائمة المشاريع: ' + err.message);
    }
  };

  // Load saved reports list
  const loadSavedReports = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('technical_audit_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedReports(data || []);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      setError('فشل في تحميل قائمة التقارير المحفوظة');
    }
  };

  // Load report data
  const loadReport = async (reportId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load main report data
      const { data: report, error: reportError } = await supabase
        .from('technical_audit_reports')
        .select('*')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

      if (reportError) throw reportError;

      // Load checklist items
      const { data: items, error: itemsError } = await supabase
        .from('technical_audit_checklist_items')
        .select('*')
        .eq('report_id', reportId)
        .order('section_id, item_id');

      if (itemsError) throw itemsError;

      // Load media files
      const { data: media, error: mediaError } = await supabase
        .from('technical_audit_media')
        .select('*')
        .eq('report_id', reportId);

      if (mediaError) throw mediaError;

      // Populate form
      setSubmittedTo(report.submitted_to || '');
      setPreparedBy(report.prepared_by || '');
      setAuditedEntity(report.audited_entity || '');
      setSelectedProjectId(report.project_id || '');
      setExecutingEntity(report.executing_entity || '');
      setCurrentReportId(reportId);
      setIsReadOnly(true);

      if (items) {
        setChecklistData(items);
      }

      if (report.signature_data) {
        setSignatureData(report.signature_data);
      }

      // Populate media files
      if (media) {
        const mediaFilesMap: {[key: number]: File[]} = {};
        const audioRecordingsMap: {[key: number]: Blob | null} = {};

        for (const mediaItem of media) {
          const sectionId = mediaItem.section_id;

          if (mediaItem.file_type.startsWith('audio/')) {
            // Handle audio files
            try {
              const response = await fetch(mediaItem.file_url);
              const blob = await response.blob();
              audioRecordingsMap[sectionId] = blob;
            } catch (error) {
              console.error('Error loading audio file:', error);
            }
          } else {
            // Handle image/video files - create File objects for preview
            try {
              const response = await fetch(mediaItem.file_url);
              const blob = await response.blob();
              const file = new File([blob], mediaItem.file_name, { type: mediaItem.file_type });

              if (!mediaFilesMap[sectionId]) {
                mediaFilesMap[sectionId] = [];
              }
              mediaFilesMap[sectionId].push(file);
            } catch (error) {
              console.error('Error loading media file:', error);
            }
          }
        }

        setMediaFiles(mediaFilesMap);
        setAudioRecordings(audioRecordingsMap);
      }

      setSuccess('تم تحميل التقرير بنجاح!');
    } catch (err: any) {
      console.error('Error loading report:', err);
      setError('فشل في تحميل التقرير: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save report
  const saveReport = async () => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const reportData = {
        submitted_to: submittedTo,
        prepared_by: preparedBy,
        audited_entity: auditedEntity,
        project_id: selectedProjectId || null,
        executing_entity: executingEntity,
        signature_data: signatureData,
        user_id: user.id
      };

      console.log('Saving report with data:', {
        selectedProjectId,
        selectedProjectIdType: typeof selectedProjectId,
        reportData
      });

      let reportId = currentReportId;

      if (currentReportId) {
        // Update existing report
        const { error: updateError } = await supabase
          .from('technical_audit_reports')
          .update(reportData)
          .eq('id', currentReportId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Delete existing checklist items
        await supabase
          .from('technical_audit_checklist_items')
          .delete()
          .eq('report_id', currentReportId);
      } else {
        // Create new report
        const { data: newReport, error: insertError } = await supabase
          .from('technical_audit_reports')
          .insert([reportData])
          .select()
          .single();

        if (insertError) throw insertError;
        reportId = newReport.id;
        setCurrentReportId(reportId);
      }

      // Save checklist items
      const checklistItemsToSave = checklistData.map(item => ({
        report_id: reportId!,
        section_id: item.section_id,
        item_id: item.item_id,
        item_text: item.item_text,
        status: item.status,
        note: item.note
      }));

      const { error: checklistError } = await supabase
        .from('technical_audit_checklist_items')
        .insert(checklistItemsToSave);

      if (checklistError) throw checklistError;

      // Upload media files
      for (const [sectionId, files] of Object.entries(mediaFiles)) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${reportId}/section_${sectionId}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('technical-audit-files')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('technical-audit-files')
            .getPublicUrl(fileName);

          const { error: mediaError } = await supabase
            .from('technical_audit_media')
            .insert([{
              report_id: reportId!,
              section_id: parseInt(sectionId),
              file_name: file.name,
              file_type: file.type,
              file_url: publicUrl
            }]);

          if (mediaError) throw mediaError;
        }
      }

      // Upload audio recordings
      for (const [sectionId, audioBlob] of Object.entries(audioRecordings)) {
        if (audioBlob) {
          const fileName = `${user.id}/${reportId}/section_${sectionId}/audio_${Date.now()}.webm`;

          const { error: uploadError } = await supabase.storage
            .from('technical-audit-files')
            .upload(fileName, audioBlob);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('technical-audit-files')
            .getPublicUrl(fileName);

          const { error: mediaError } = await supabase
            .from('technical_audit_media')
            .insert([{
              report_id: reportId!,
              section_id: parseInt(sectionId),
              file_name: `تسجيل صوتي - القسم ${sectionId}`,
              file_type: 'audio/webm',
              file_url: publicUrl
            }]);

          if (mediaError) throw mediaError;
        }
      }

      await loadSavedReports();
      setSuccess('تم حفظ التقرير بنجاح!');
    } catch (err: any) {
      console.error('Error saving report:', err);
      setError('فشل في حفظ التقرير: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Clear form for new report
  const clearForm = () => {
    setSubmittedTo('');
    setPreparedBy('');
    setAuditedEntity('');
    setSelectedProjectId('');
    setExecutingEntity('');
    setCurrentReportId(null);
    setIsReadOnly(false);
    setSignatureData('');
    setMediaFiles({});
    setAudioRecordings({});
    initializeChecklistData();
    setError(null);
    setSuccess(null);
  };

  // Handle checklist item change
  const handleChecklistChange = (itemId: string | number, field: 'status' | 'note', value: string) => {
    setChecklistData(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  // Handle file upload
  const handleFileUpload = (sectionId: number, files: FileList | null) => {
    if (files) {
      setMediaFiles(prev => ({
        ...prev,
        [sectionId]: [...(prev[sectionId] || []), ...Array.from(files)]
      }));
    }
  };

  // Start audio recording
  const startRecording = async (sectionId: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setAudioRecordings(prev => ({ ...prev, [sectionId]: audioBlob }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorders.current[sectionId] = mediaRecorder;
      audioChunks.current[sectionId] = chunks;
      setRecordingStates(prev => ({ ...prev, [sectionId]: true }));
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('فشل في بدء التسجيل الصوتي');
    }
  };

  // Stop audio recording
  const stopRecording = (sectionId: number) => {
    const mediaRecorder = mediaRecorders.current[sectionId];
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setRecordingStates(prev => ({ ...prev, [sectionId]: false }));
    }
  };

  // Signature pad functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isReadOnly) return;
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (isReadOnly) return;
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureData('');
  };

  const saveSignature = () => {
    if (isReadOnly) return;
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const signature = canvas.toDataURL('image/png');
      setSignatureData(signature);
      setSuccess('تم حفظ التوقيع!');
    }
  };

  // Print function
  const handlePrint = () => {
    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير التحقق الفني - ${auditedEntity || 'غير محدد'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Tajawal', Arial, sans-serif;
            direction: rtl;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
            line-height: 1.6;
          }

          .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #5f979d;
          }

          .print-title {
            font-size: 28px;
            color: #5f979d;
            margin-bottom: 10px;
            font-weight: bold;
          }

          .print-subtitle {
            font-size: 16px;
            color: #666;
          }

          .print-date {
            font-size: 14px;
            color: #888;
            margin-top: 10px;
          }

          .info-section {
            display: table;
            width: 100%;
            margin: 30px 0;
            border-collapse: collapse;
          }

          .info-row {
            display: table-row;
          }

          .info-label {
            display: table-cell;
            width: 25%;
            font-weight: bold;
            padding: 12px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
          }

          .info-value {
            display: table-cell;
            padding: 12px;
            border: 1px solid #dee2e6;
          }

          .section {
            margin: 30px 0;
            page-break-inside: avoid;
          }

          .section-title {
            font-size: 20px;
            color: #5f979d;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #5f979d;
          }

          .subsection-title {
            font-size: 16px;
            color: #666;
            margin: 20px 0 10px 0;
            font-weight: 500;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 12px;
          }

          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: right;
            vertical-align: top;
          }

          th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
          }

          tr:nth-child(even) {
            background-color: #f9f9fa;
          }

          .status-cell {
            text-align: center;
            font-weight: bold;
          }

          .status-available { color: #28a745; }
          .status-unavailable { color: #dc3545; }
          .status-pending { color: #ffc107; }

          .notes-cell {
            font-size: 11px;
            color: #666;
          }

          .signature-section {
            margin-top: 50px;
            text-align: center;
            border-top: 2px solid #dee2e6;
            padding-top: 30px;
            page-break-inside: avoid;
          }

          .signature-title {
            font-weight: bold;
            margin-bottom: 20px;
            font-size: 16px;
          }

          .signature-placeholder {
            width: 200px;
            height: 80px;
            border: 2px dashed #dee2e6;
            margin: 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c757d;
            font-size: 14px;
          }

          .media-section {
            margin: 20px 0;
            page-break-inside: avoid;
          }

          .media-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #666;
          }

          .media-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin: 15px 0;
          }

          .media-item {
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px;
            text-align: center;
            font-size: 11px;
            color: #666;
          }

          .page-break {
            page-break-before: always;
          }

          @media print {
            body { print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1 class="print-title">تقرير التحقق الفني</h1>
          <div class="print-subtitle">نظام متابعة الجودة والسلامة في مواقع العمل</div>
          <div class="print-date">تاريخ التقرير: ${getCurrentDate()}</div>
        </div>

        <table class="info-section">
          <tbody>
            <tr class="info-row">
              <td class="info-label">تُقدم إلى:</td>
              <td class="info-value">${submittedTo || 'غير محدد'}</td>
              <td class="info-label">اسم معد التقرير:</td>
              <td class="info-value">${preparedBy || 'غير محدد'}</td>
            </tr>
            <tr class="info-row">
              <td class="info-label">الجهة المُدقَّق عليها:</td>
              <td class="info-value">${auditedEntity || 'غير محدد'}</td>
              <td class="info-label">الجهة المنفذة:</td>
              <td class="info-value">${executingEntity || 'غير محدد'}</td>
            </tr>
          </tbody>
        </table>

        ${[1, 2, 3, 4].map(sectionId => {
          const sectionItems = checklistData.filter(item => item.section_id === sectionId);
          const sectionTitle = sectionId === 1 ? 'أولاً: المتطلبات الأساسية' :
                              sectionId === 2 ? 'ثانيًا: المتطلبات اللوجستية' :
                              sectionId === 3 ? 'ثالثًا: إجراءات المتابعة والتوثيق' :
                              'رابعًا: التقييم النهائي';
          const subsectionTitle = sectionId === 1 ? 'البنية التحتية والتجهيزات' :
                                 sectionId === 2 ? 'تنظيم موقع العمل' :
                                 sectionId === 3 ? 'المتابعة والتقارير' :
                                 'جاهزية الموقع للعمل';

          return `
            <div class="section">
              <h2 class="section-title">${sectionTitle}</h2>
              <h3 class="subsection-title">${subsectionTitle}</h3>

              <table>
                <thead>
                  <tr>
                    <th style="width: 5%;">م</th>
                    <th style="width: 55%;">البند</th>
                    <th style="width: 20%;">الحالة</th>
                    <th style="width: 20%;">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  ${sectionItems.map(item => `
                    <tr>
                      <td style="text-align: center;">${item.item_id}</td>
                      <td>${item.item_text}</td>
                      <td class="status-cell">
                        <span class="status-${item.status === 'متوفر' ? 'available' :
                                              item.status === 'غير متوفر' ? 'unavailable' : 'pending'}">
                          ${item.status || 'غير محدد'}
                        </span>
                      </td>
                      <td class="notes-cell">${item.note || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              ${mediaFiles[sectionId] && mediaFiles[sectionId].length > 0 ? `
                <div class="media-section">
                  <div class="media-title">الملفات المرفقة (${mediaFiles[sectionId].length} ملف):</div>
                  <div class="media-grid">
                    ${mediaFiles[sectionId].map((file, index) => `
                      <div class="media-item">
                        ${file.type.startsWith('image/') ? '📷 صورة' :
                          file.type.startsWith('video/') ? '🎥 فيديو' : '📄 ملف'}
                        <br>${file.name}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              ${audioRecordings[sectionId] ? `
                <div class="media-section">
                  <div class="media-title">تسجيل صوتي مرفق:</div>
                  <div class="media-item">🎵 تسجيل صوتي - القسم ${sectionId}</div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}

        <div class="signature-section">
          <div class="signature-title">التوقيع الرقمي لممثل الجهة المدقق عليها:</div>
          ${signatureData ? `
            <img src="${signatureData}" alt="التوقيع الرقمي"
                 style="max-width: 200px; max-height: 80px; border: 1px solid #ddd; margin: 20px auto; display: block;">
          ` : `
            <div class="signature-placeholder">
              لم يتم توقيع التقرير
            </div>
          `}
        </div>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };


  useEffect(() => {
    initializeChecklistData();
    loadProjects();
    loadSavedReports();

    // Initialize signature canvas
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  if (loading && !currentReportId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-700">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-6 print:bg-white print:p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-soft border border-primary-200/30 p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-sm text-primary-600 mb-2">{getCurrentDate()}</div>
            <h1 className="text-3xl font-bold text-primary-800">تقرير التحقق الفني</h1>
            <div className="text-lg text-primary-600 mt-2">نظام متابعة الجودة والسلامة في مواقع العمل</div>
          </div>

          {/* Load Report Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-file-invoice ml-2"></i>
              تحميل تقرير محفوظ:
            </label>
            <select
              value={currentReportId || ''}
              onChange={(e) => {
                if (e.target.value) {
                  loadReport(e.target.value);
                } else {
                  clearForm();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">-- اختر تقريراً --</option>
              {savedReports.map(report => {
                const projectName = report.project_id ?
                  projects.find(p => p.id === report.project_id)?.name || report.audited_entity :
                  report.audited_entity;
                return (
                  <option key={report.id} value={report.id}>
                    {projectName} - {new Date(report.created_at).toLocaleDateString('ar-EG')}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-user-tie ml-2"></i>
                تُقدم إلى:
              </label>
              <input
                type="text"
                value={submittedTo}
                onChange={(e) => setSubmittedTo(e.target.value)}
                readOnly={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="المدير التنفيذي / اسم المدير"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-pen-fancy ml-2"></i>
                اسم معد التقرير:
              </label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                readOnly={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="اسم المسؤول عن إعداد القائمة"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-building ml-2"></i>
                الجهة المُدقَّق عليها (المشروع):
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  const projectId = e.target.value;
                  setSelectedProjectId(projectId);
                  // Auto-fill audited entity with project name
                  const selectedProject = projects.find(p => p.id === projectId);
                  setAuditedEntity(selectedProject ? selectedProject.name : '');
                }}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">-- اختر مشروعاً --</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.status === 'completed' ? '(مكتمل)' : project.status === 'in-progress' ? '(قيد التنفيذ)' : '(مخطط)'}
                  </option>
                ))}
              </select>
              {auditedEntity && (
                <p className="text-sm text-gray-600 mt-1">
                  المشروع المحدد: {auditedEntity}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-industry ml-2"></i>
                الجهة المنفذة:
              </label>
              <input
                type="text"
                value={executingEntity}
                onChange={(e) => setExecutingEntity(e.target.value)}
                readOnly={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="اسم الجهة المنفذة للتدقيق"
              />
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-red-500"></i>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-r-4 border-green-500 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <i className="fas fa-check-circle text-green-500"></i>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Checklist Sections */}
        {[1, 2, 3, 4].map(sectionId => (
          <div key={sectionId} className="bg-white rounded-xl shadow-soft border border-primary-200/30 p-6 mb-6">
            <h2 className="text-2xl font-bold text-primary-800 mb-4">
              {sectionId === 1 && 'أولاً: المتطلبات الأساسية'}
              {sectionId === 2 && 'ثانيًا: المتطلبات اللوجستية'}
              {sectionId === 3 && 'ثالثًا: إجراءات المتابعة والتوثيق'}
              {sectionId === 4 && 'رابعًا: التقييم النهائي'}
            </h2>

            {sectionId === 1 && <h3 className="text-lg font-semibold text-primary-700 mb-4">البنية التحتية والتجهيزات</h3>}
            {sectionId === 2 && <h3 className="text-lg font-semibold text-primary-700 mb-4">تنظيم موقع العمل</h3>}
            {sectionId === 3 && <h3 className="text-lg font-semibold text-primary-700 mb-4">المتابعة والتقارير</h3>}
            {sectionId === 4 && <h3 className="text-lg font-semibold text-primary-700 mb-4">جاهزية الموقع للعمل</h3>}

            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-primary-50">
                    <th className="border border-gray-300 px-4 py-2 text-right">م</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">البند</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">الحالة</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {checklistData
                    .filter(item => item.section_id === sectionId)
                    .map(item => (
                      <tr key={item.id}>
                        <td className="border border-gray-300 px-4 py-2 text-center">{item.item_id}</td>
                        <td className="border border-gray-300 px-4 py-2">{item.item_text}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex justify-center gap-2">
                            {['متوفر', 'غير متوفر', 'معلق'].map(status => (
                              <label key={status} className="flex items-center">
                                <input
                                  type="radio"
                                  name={`status-${item.id}`}
                                  value={status}
                                  checked={item.status === status}
                                  onChange={(e) => handleChecklistChange(item.id, 'status', e.target.value)}
                                  disabled={isReadOnly}
                                  className="ml-1"
                                />
                                {status}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="text"
                            value={item.note}
                            onChange={(e) => handleChecklistChange(item.id, 'note', e.target.value)}
                            readOnly={isReadOnly}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            placeholder="أدخل الملاحظات هنا..."
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Media Upload Section */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold mb-3">
                <i className="fas fa-paperclip ml-2"></i>
                إرفاق ملفات إضافية (صور / فيديوهات)
              </h4>
              {!isReadOnly && (
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleFileUpload(sectionId, e.target.files)}
                  className="mb-2"
                />
              )}
              {mediaFiles[sectionId] && mediaFiles[sectionId].length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {mediaFiles[sectionId].map((file, index) => {
                    const fileUrl = URL.createObjectURL(file);
                    return (
                      <div key={index} className="border rounded p-2 text-center">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={fileUrl}
                            alt={file.name}
                            className="w-full h-20 object-cover rounded mb-2"
                          />
                        ) : file.type.startsWith('video/') ? (
                          <video
                            src={fileUrl}
                            className="w-full h-20 object-cover rounded mb-2"
                            controls={false}
                          />
                        ) : (
                          <i className="fas fa-file text-2xl text-gray-500 mb-2"></i>
                        )}
                        <p className="text-xs text-gray-600 truncate">{file.name}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Audio Recording Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">
                <i className="fas fa-microphone-alt ml-2"></i>
                تسجيل ملاحظة صوتية
              </h4>
              {!isReadOnly && (
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => startRecording(sectionId)}
                    disabled={recordingStates[sectionId]}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    <i className="fas fa-microphone ml-2"></i>
                    تسجيل
                  </button>
                  <button
                    onClick={() => stopRecording(sectionId)}
                    disabled={!recordingStates[sectionId]}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
                  >
                    <i className="fas fa-stop-circle ml-2"></i>
                    إيقاف
                  </button>
                </div>
              )}
              {recordingStates[sectionId] && (
                <p className="text-red-600 mb-2">جاري التسجيل...</p>
              )}
              {audioRecordings[sectionId] && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">التسجيل الصوتي المحفوظ:</p>
                  <audio controls className="w-full">
                    <source src={URL.createObjectURL(audioRecordings[sectionId]!)} type="audio/webm" />
                  </audio>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Signature Section */}
        <div className="bg-white rounded-xl shadow-soft border border-primary-200/30 p-6 mb-6">
          <h3 className="text-lg font-semibold text-primary-800 mb-4">
            <i className="fas fa-signature ml-2"></i>
            التوقيع الرقمي لممثل الجهة المدقق عليها:
          </h3>
          <div className="border-2 border-primary-300 rounded-lg p-4 mb-4">
            <canvas
              ref={signatureCanvasRef}
              width={600}
              height={200}
              className="border border-gray-300 rounded cursor-crosshair w-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={clearSignature}
              disabled={isReadOnly}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
            >
              <i className="fas fa-eraser ml-2"></i>
              مسح التوقيع
            </button>
            <button
              onClick={saveSignature}
              disabled={isReadOnly}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
            >
              <i className="fas fa-save ml-2"></i>
              حفظ التوقيع
            </button>
          </div>
          {signatureData && (
            <div className="mt-4 text-center">
              <p className="mb-2">التوقيع المحفوظ:</p>
              <img src={signatureData} alt="التوقيع" className="border border-gray-300 rounded mx-auto max-w-xs" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <button
            onClick={saveReport}
            disabled={loading || isReadOnly}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            <i className="fas fa-hdd"></i>
            حفظ البيانات
          </button>
          <button
            onClick={clearForm}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <i className="fas fa-file-alt"></i>
            تقرير جديد
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <i className="fas fa-print"></i>
            طباعة التقرير
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechnicalAuditReport;