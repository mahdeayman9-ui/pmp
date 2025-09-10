import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, X, Eye, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface GalleryImage {
  id: string;
  title: string;
  description: string;
  image_url: string;
  uploaded_by: string;
  created_at: string;
  company_id: string;
}

const ImageGallery: React.FC = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null as File | null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load images from database
  const loadImages = async () => {
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

      // Load images for the company
      const { data: imagesData, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        toast.error('حدث خطأ في تحميل الصور');
      } else {
        setImages(imagesData || []);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('حدث خطأ في تحميل الصور');
    } finally {
      setLoading(false);
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `gallery/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);

        // Handle specific bucket not found error
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error('خطأ في التخزين: الـ bucket "images" غير موجود في Supabase Storage. يرجى إنشاء bucket باسم "images" في لوحة تحكم Supabase.');
        }

        throw uploadError;
      }

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading to storage:', error);

      // Provide specific error messages
      if (error.message?.includes('Bucket not found')) {
        throw new Error('خطأ في التخزين: الـ bucket "images" غير موجود. يرجى إنشاء bucket باسم "images" في Supabase Storage.');
      }

      throw error;
    }
  };

  // Handle image upload
  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title.trim()) {
      toast.error('يرجى اختيار صورة وإدخال عنوان');
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

      // Upload image to storage
      const imageUrl = await uploadImage(uploadForm.file);

      // Save image data to database
      const { error } = await supabase
        .from('gallery_images')
        .insert({
          title: uploadForm.title,
          description: uploadForm.description,
          image_url: imageUrl,
          uploaded_by: user.id,
          company_id: profile.company_id
        });

      if (error) {
        console.error('Error saving image:', error);
        toast.error('حدث خطأ في حفظ الصورة');
        return;
      }

      toast.success('تم رفع الصورة بنجاح');
      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', file: null });
      loadImages();

    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('حدث خطأ في رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  // Delete image
  const handleDelete = async (imageId: string, imageUrl: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('Error deleting image from database:', dbError);
        toast.error('حدث خطأ في حذف الصورة من قاعدة البيانات');
        return;
      }

      // Delete from storage
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('images')
          .remove([`gallery/${fileName}`]);

        if (storageError) {
          console.error('Error deleting image from storage:', storageError);
        }
      }

      toast.success('تم حذف الصورة بنجاح');
      loadImages();

    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('حدث خطأ في حذف الصورة');
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('يرجى اختيار ملف صورة فقط');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  useEffect(() => {
    loadImages();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-700">جاري تحميل معرض الصور...</p>
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
                <ImageIcon className="text-primary-600 text-3xl" />
                معرض الصور
              </h1>
              <p className="text-primary-600 mt-2">عرض وإدارة صور المشاريع والأعمال</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Plus className="h-5 w-5" />
              رفع صورة جديدة
            </button>
          </div>
        </div>

        {/* Images Grid */}
        {images.length === 0 ? (
          <div className="bg-white rounded-xl shadow-soft border border-primary-200/30 p-12 text-center">
            <ImageIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد صور في المعرض</h3>
            <p className="text-gray-500 mb-6">ابدأ برفع صور مشاريعك وأعمالك</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary"
            >
              رفع أول صورة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-xl shadow-soft border border-primary-200/30 overflow-hidden hover:shadow-lg transition-all duration-300 group"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => setSelectedImage(image)}
                        className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full transition-all duration-200"
                        title="عرض الصورة"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(image.id, image.image_url)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-all duration-200"
                        title="حذف الصورة"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 truncate">{image.title}</h3>
                  {image.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{image.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(image.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">رفع صورة جديدة</h2>
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
                    عنوان الصورة *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="أدخل عنوان الصورة"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف الصورة (اختياري)
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="أدخل وصف الصورة"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختر الصورة *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {uploadForm.file ? (
                      <div className="space-y-2">
                        <img
                          src={URL.createObjectURL(uploadForm.file)}
                          alt="Preview"
                          className="max-w-full max-h-32 mx-auto rounded"
                        />
                        <p className="text-sm text-gray-600">{uploadForm.file.name}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">انقر لاختيار صورة أو اسحب الصورة هنا</p>
                        <p className="text-xs text-gray-400">PNG, JPG, GIF حتى 5MB</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 btn-secondary text-sm"
                    >
                      اختر صورة
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
                  disabled={uploading || !uploadForm.file || !uploadForm.title.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'جاري الرفع...' : 'رفع الصورة'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <img
                src={selectedImage.image_url}
                alt={selectedImage.title}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
                <h3 className="text-lg font-semibold mb-1">{selectedImage.title}</h3>
                {selectedImage.description && (
                  <p className="text-sm opacity-90">{selectedImage.description}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;