import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, X, Trash2, Upload, FileText, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { canAccessArchive } from '../../utils/permissions';

interface ProjectDocument {
  id: string;
  title: string;
  description: string;
  document_url: string;
  file_name: string;
  file_size: number;
  project_id: string;
  uploaded_by: string;
  company_id: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
}

const ProjectArchive: React.FC = () => {
  const { user } = useAuth();

  // Check if user can access archive
  if (!canAccessArchive(user?.teamId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-soft border border-primary-200/30 p-8 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">غير مسموح بالوصول</h1>
            <p className="text-gray-600">ليس لديك صلاحية للوصول إلى أرشيف المشاريع.</p>
          </div>
        </div>
      </div>
    );
  }
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    projectId: '',
    file: null as File | null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects
  const loadProjects = async () => {
    if (!user) return;

    try {
      // Get user's profile to find their team_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile query error:', profileError);
        return;
      }

      if (!profile?.team_id) {
        console.warn('User is not assigned to any team');
        return;
      }

      // Get projects for user's team
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, status, team_id')
        .eq('team_id', profile.team_id)
        .order('name');

      if (error) {
        console.error('Projects query error:', error);
        return;
      }

      setProjects(data || []);
    } catch (err: any) {
      console.error('Error loading projects:', err);
    }
  };

  // Load documents from database
  const loadDocuments = async () => {
    try {
      setLoading(true);

      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's company ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // Load documents for the company
      let query = supabase
        .from('project_documents')
        .select(`
          *,
          projects:project_id (
            id,
            name,
            status
          )
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      // Filter by project if selected
      if (filterProjectId) {
        query = query.eq('project_id', filterProjectId);
      }

      const { data: documentsData, error } = await query;

      if (error) {
        console.error('Error loading documents:', error);
        toast.error('حدث خطأ في تحميل الملفات');
      } else {
        setDocuments(documentsData || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('حدث خطأ في تحميل الملفات');
    } finally {
      setLoading(false);
    }
  };

  // Upload document to Supabase Storage
  const uploadDocument = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);

        // Handle specific bucket not found error
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error('خطأ في التخزين: الـ bucket "project-documents" غير موجود في Supabase Storage. يرجى إنشاء bucket باسم "project-documents" في لوحة تحكم Supabase.');
        }

        throw uploadError;
      }

      const { data } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading to storage:', error);

      // Provide specific error messages
      if (error.message?.includes('Bucket not found')) {
        throw new Error('خطأ في التخزين: الـ bucket "project-documents" غير موجود. يرجى إنشاء bucket باسم "project-documents" في Supabase Storage.');
      }

      throw error;
    }
  };

  // Handle document upload
  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title.trim() || !uploadForm.projectId) {
      toast.error('يرجى اختيار ملف وإدخال عنوان واختيار مشروع');
      return;
    }

    try {
      setUploading(true);

      if (!user) {
        toast.error('يرجى تسجيل الدخول أولاً');
        return;
      }

      // Get user's company ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        toast.error('لم يتم العثور على شركة مرتبطة بحسابك');
        return;
      }

      // Upload document to storage
      const documentUrl = await uploadDocument(uploadForm.file);

      // Save document data to database
      const { error } = await supabase
        .from('project_documents')
        .insert({
          title: uploadForm.title,
          description: uploadForm.description,
          document_url: documentUrl,
          file_name: uploadForm.file.name,
          file_size: uploadForm.file.size,
          project_id: uploadForm.projectId,
          uploaded_by: user.id,
          company_id: profile.company_id
        });

      if (error) {
        console.error('Error saving document:', error);
        toast.error('حدث خطأ في حفظ الملف');
        return;
      }

      toast.success('تم رفع الملف بنجاح');
      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', projectId: '', file: null });
      loadDocuments();

    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('حدث خطأ في رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  // Delete document
  const handleDelete = async (documentId: string, documentUrl: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('Error deleting document from database:', dbError);
        toast.error('حدث خطأ في حذف الملف من قاعدة البيانات');
        return;
      }

      // Delete from storage
      const fileName = documentUrl.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('project-documents')
          .remove([`documents/${fileName}`]);

        if (storageError) {
          console.error('Error deleting document from storage:', storageError);
        }
      }

      toast.success('تم حذف الملف بنجاح');
      loadDocuments();

    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('حدث خطأ في حذف الملف');
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('يرجى اختيار ملف PDF فقط');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('حجم الملف يجب أن يكون أقل من 10 ميجابايت');
        return;
      }
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  // Download document
  const handleDownload = async (doc: ProjectDocument) => {
    try {
      // Create a temporary link to download the file
      const link = window.document.createElement('a');
      link.href = doc.document_url;
      link.download = doc.file_name;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      toast.success('بدء تحميل الملف');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('حدث خطأ في تحميل الملف');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    loadProjects();
  }, [user]);

  useEffect(() => {
    loadDocuments();
  }, [user, filterProjectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-700">جاري تحميل أرشيف المشاريع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-soft border border-primary-200/30 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary-800 flex items-center gap-3">
                <FileText className="text-primary-600 text-3xl" />
                أرشيف المشاريع
              </h1>
              <p className="text-primary-600 mt-2">إدارة وأرشفة ملفات PDF الخاصة بالمشاريع</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Plus className="h-5 w-5" />
              رفع ملف جديد
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-soft border border-primary-200/30 p-6 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-primary-600" />
            <span className="font-medium text-gray-700">فلترة حسب المشروع:</span>
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">جميع المشاريع</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} {project.status === 'completed' ? '(مكتمل)' : project.status === 'in-progress' ? '(قيد التنفيذ)' : '(مخطط)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-soft border border-primary-200/30 p-12 text-center">
            <FileText className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد ملفات في الأرشيف</h3>
            <p className="text-gray-500 mb-6">ابدأ برفع ملفات PDF الخاصة بمشاريعك</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary"
            >
              رفع أول ملف
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {documents.map((document) => {
              const project = projects.find(p => p.id === document.project_id);
              return (
                <div
                  key={document.id}
                  className="bg-white rounded-xl shadow-soft border border-primary-200/30 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="p-6 text-center">
                    <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-800 mb-2 truncate" title={document.title}>
                      {document.title}
                    </h3>
                    {document.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={document.description}>
                        {document.description}
                      </p>
                    )}
                    <div className="space-y-1 mb-4">
                      <p className="text-xs text-gray-500">
                        📁 {project?.name || 'مشروع غير محدد'}
                      </p>
                      <p className="text-xs text-gray-500">
                        📄 {document.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        📏 {formatFileSize(document.file_size)}
                      </p>
                      <p className="text-xs text-gray-400">
                        📅 {new Date(document.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(document)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                        title="تحميل الملف"
                      >
                        <Download className="h-4 w-4" />
                        تحميل
                      </button>
                      <button
                        onClick={() => handleDelete(document.id, document.document_url)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                        title="حذف الملف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">رفع ملف PDF جديد</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان الملف *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="أدخل عنوان الملف"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف الملف (اختياري)
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="أدخل وصف الملف"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختر المشروع *
                  </label>
                  <select
                    value={uploadForm.projectId}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- اختر مشروعاً --</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name} {project.status === 'completed' ? '(مكتمل)' : project.status === 'in-progress' ? '(قيد التنفيذ)' : '(مخطط)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختر ملف PDF *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {uploadForm.file ? (
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 text-red-500 mx-auto" />
                        <p className="text-sm font-medium text-gray-800">{uploadForm.file.name}</p>
                        <p className="text-xs text-gray-600">{formatFileSize(uploadForm.file.size)}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">انقر لاختيار ملف PDF أو اسحب الملف هنا</p>
                        <p className="text-xs text-gray-400">PDF حتى 10MB</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 btn-secondary text-sm"
                    >
                      اختر ملف PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={uploading}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadForm.file || !uploadForm.title.trim() || !uploadForm.projectId}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'جاري الرفع...' : 'رفع الملف'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectArchive;