# 🗄️ دليل ربط قاعدة البيانات والنشر

## 📋 الخطوات التالية لتطوير المشروع

### 🎯 **المرحلة الأولى: إعداد قاعدة البيانات**

#### **1. اختيار قاعدة البيانات:**

**الخيار الأول: Supabase (الأسهل والأسرع)**
```bash
# إنشاء مشروع جديد في Supabase
# 1. اذهب إلى https://supabase.com
# 2. أنشئ حساب جديد
# 3. أنشئ مشروع جديد
# 4. احصل على URL و API Keys
```

**الخيار الثاني: PostgreSQL محلي**
```bash
# تثبيت PostgreSQL
# Windows: تحميل من postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql
```

#### **2. إعداد متغيرات البيئة:**
```env
# .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# أو للقاعدة المحلية
DATABASE_URL=postgresql://username:password@localhost:5432/project_management
```

#### **3. إنشاء جداول قاعدة البيانات:**

**جدول المستخدمين:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  username VARCHAR(100) UNIQUE,
  generated_password VARCHAR(255),
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**جدول الفرق:**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**جدول أعضاء الفرق:**
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW()
);
```

**جدول المشاريع:**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'planning',
  progress INTEGER DEFAULT 0,
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**جدول المراحل:**
```sql
CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_target INTEGER DEFAULT 100,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'not-started',
  progress INTEGER DEFAULT 0,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**جدول المهام:**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to_team_id UUID REFERENCES teams(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0,
  phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  total_target INTEGER DEFAULT 100,
  actual_start_date TIMESTAMP,
  actual_end_date TIMESTAMP,
  planned_effort_hours INTEGER DEFAULT 40,
  actual_effort_hours INTEGER DEFAULT 0,
  risk_level VARCHAR(50) DEFAULT 'low',
  completion_rate INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  is_overdue BOOLEAN DEFAULT FALSE,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**جدول الإنجازات اليومية:**
```sql
CREATE TABLE daily_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  check_in_time TIMESTAMP,
  check_in_location JSONB,
  check_out_time TIMESTAMP,
  check_out_location JSONB,
  work_hours DECIMAL(4,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**جدول الوسائط:**
```sql
CREATE TABLE media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id UUID REFERENCES daily_achievements(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  size INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

**جدول التسجيلات الصوتية:**
```sql
CREATE TABLE voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id UUID REFERENCES daily_achievements(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration INTEGER,
  transcription TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**جدول الإشعارات:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**جدول إعدادات الشركة:**
```sql
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL DEFAULT 'إدارة المشاريع',
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#5f979d',
  secondary_color VARCHAR(7) DEFAULT '#b4e1e6',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 🔧 **المرحلة الثانية: تحديث الكود**

#### **1. تثبيت المكتبات المطلوبة:**
```bash
npm install @supabase/supabase-js
npm install @types/uuid uuid
npm install bcryptjs @types/bcryptjs
npm install jsonwebtoken @types/jsonwebtoken
```

#### **2. إنشاء ملف إعداد Supabase:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### **3. تحديث AuthContext:**
```typescript
// استبدال المصادقة الوهمية بـ Supabase Auth
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data.user
}
```

#### **4. تحديث DataContext:**
```typescript
// استبدال البيانات الوهمية بـ API calls
const fetchTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      phases(*),
      projects(*),
      teams(*)
    `)
  
  if (error) throw error
  return data
}
```

### 🚀 **المرحلة الثالثة: النشر**

#### **خيارات النشر:**

**1. Vercel (الأسهل للـ Frontend):**
```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel

# ربط المتغيرات
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

**2. Netlify:**
```bash
# تثبيت Netlify CLI
npm install -g netlify-cli

# بناء المشروع
npm run build

# النشر
netlify deploy --prod --dir=dist
```

**3. AWS Amplify:**
```bash
# تثبيت Amplify CLI
npm install -g @aws-amplify/cli

# إعداد Amplify
amplify init
amplify add hosting
amplify publish
```

**4. Docker (للنشر المخصص):**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### 📱 **المرحلة الرابعة: تطبيق الموبايل (اختياري)**

#### **React Native Expo:**
```bash
# إنشاء تطبيق Expo
npx create-expo-app ProjectManagementApp

# تثبيت المكتبات
npm install @supabase/supabase-js
npm install @react-navigation/native
npm install expo-camera expo-media-library
```

### 🔐 **المرحلة الخامسة: الأمان والحماية**

#### **1. إعداد Row Level Security (RLS):**
```sql
-- تفعيل RLS على جميع الجداول
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Team members can view team tasks" ON tasks
  FOR SELECT USING (
    assigned_to_team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );
```

#### **2. إعداد المصادقة:**
```typescript
// تشفير كلمات المرور
import bcrypt from 'bcryptjs'

const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12)
}
```

### 📊 **المرحلة السادسة: المراقبة والتحليلات**

#### **1. إضافة Google Analytics:**
```bash
npm install gtag
```

#### **2. إعداد Sentry للأخطاء:**
```bash
npm install @sentry/react
```

#### **3. مراقبة الأداء:**
```typescript
// إضافة Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
```

### 🧪 **المرحلة السابعة: الاختبارات**

#### **1. اختبارات الوحدة:**
```bash
npm install --save-dev vitest @testing-library/react
```

#### **2. اختبارات التكامل:**
```bash
npm install --save-dev cypress
```

### 📈 **المرحلة الثامنة: التحسينات**

#### **1. تحسين الأداء:**
- Code Splitting
- Lazy Loading
- Service Workers
- CDN للملفات الثابتة

#### **2. SEO:**
- Meta Tags
- Sitemap
- Structured Data

### 💰 **تقدير التكاليف الشهرية:**

**البداية (مجاني):**
- Supabase: مجاني حتى 50,000 مستخدم
- Vercel: مجاني للمشاريع الشخصية
- **التكلفة: 0$**

**النمو المتوسط:**
- Supabase Pro: $25/شهر
- Vercel Pro: $20/شهر
- **التكلفة: $45/شهر**

**المؤسسات:**
- Supabase Team: $599/شهر
- AWS/Azure: $200-500/شهر
- **التكلفة: $800-1100/شهر**

### 🎯 **الخطوات العملية للبدء:**

1. **اليوم الأول**: إنشاء حساب Supabase وإعداد قاعدة البيانات
2. **الأسبوع الأول**: تحديث الكود للعمل مع قاعدة البيانات الحقيقية
3. **الأسبوع الثاني**: اختبار شامل وإصلاح الأخطاء
4. **الأسبوع الثالث**: النشر على Vercel وإعداد النطاق
5. **الأسبوع الرابع**: إضافة الميزات الإضافية والتحسينات

### 📞 **الدعم والمساعدة:**

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs

---

## 🚀 **مشروعك جاهز للانطلاق!**

اتبع هذه الخطوات تدريجياً وستحصل على نظام إدارة مشاريع احترافي وقابل للاستخدام التجاري! 💪