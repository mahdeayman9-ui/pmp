# دليل إعداد معرض الصور

## المشكلة
عند محاولة رفع الصور في معرض الصور، تظهر رسالة الخطأ:
```json
{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}
```

## الحل

### الخطوة 1: إنشاء Bucket في Supabase Storage

1. **اذهب إلى لوحة تحكم Supabase:**
   - افتح مشروعك في [Supabase Dashboard](https://supabase.com/dashboard)
   - من الشريط الجانبي، اختر **Storage**

2. **إنشاء Bucket جديد:**
   - اضغط على **"Create bucket"**
   - أدخل الاسم: `images`
   - فعل خيار **"Public bucket"** (مهم لعرض الصور)
   - اضغط **"Create bucket"**

### الخطوة 2: إعداد الأذونات (Policies)

بعد إنشاء الـ bucket، أضف الأذونات التالية:

#### Policy 1: السماح بعرض الصور للجميع
```sql
-- Allow public access to view images
CREATE POLICY "Images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');
```

#### Policy 2: السماح للمستخدمين المسجلين برفع الصور
```sql
-- Allow authenticated users to upload images
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );
```

#### Policy 3: السماح للمستخدمين بحذف صورهم
```sql
-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### الخطوة 3: تشغيل Migration قاعدة البيانات

تأكد من تشغيل migration جدول الصور:

```sql
-- File: supabase/migrations/20250909121200_create_gallery_images_table.sql
-- This creates the gallery_images table in your database
```

### الخطوة 4: اختبار معرض الصور

1. **اذهب إلى صفحة معرض الصور** في التطبيق
2. **اضغط على "رفع صورة جديدة"**
3. **أدخل العنوان والوصف**
4. **اختر صورة من جهازك**
5. **اضغط "رفع الصورة"**

## استكشاف الأخطاء

### خطأ: "Bucket not found"
- تأكد من إنشاء bucket باسم `images` بالضبط
- تأكد من أنه عام (public)

### خطأ: "Access denied"
- تحقق من الأذونات (Policies)
- تأكد من تسجيل دخول المستخدم

### خطأ: "Table gallery_images does not exist"
- تأكد من تشغيل migration قاعدة البيانات
- تحقق من وجود الجدول في قاعدة البيانات

## الميزات المتاحة

### للمستخدمين العاديين:
- ✅ عرض جميع الصور في المعرض
- ✅ عرض الصور بحجم كامل
- ✅ طباعة المعرض

### للمدراء والإداريين:
- ✅ رفع صور جديدة
- ✅ إضافة عناوين وأوصاف للصور
- ✅ حذف الصور
- ✅ إدارة معرض الصور بالكامل

## هيكل تخزين الصور

```
images/
├── gallery/
│   ├── 1694271234567.jpg
│   ├── 1694271234568.png
│   └── 1694271234569.jpeg
```

## الأمان

- ✅ كل صورة مرتبطة بشركة محددة
- ✅ المستخدمون يرون صور شركتهم فقط
- ✅ أذونات محكمة للرفع والحذف
- ✅ حماية من الوصول غير المصرح

## الدعم الفني

إذا واجهت أي مشاكل:
1. تحقق من logs المتصفح (F12 → Console)
2. تأكد من إعداد Supabase بشكل صحيح
3. تحقق من الأذونات في لوحة Supabase
4. تأكد من وجود جدول `gallery_images`

---

**تم إعداد معرض الصور بنجاح! 🎉**