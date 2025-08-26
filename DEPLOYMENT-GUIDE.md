# 🚀 دليل النشر السريع - خطوة بخطوة

## 📋 **الطريقة الأسهل والأسرع**

### **المرحلة الأولى: إعداد قاعدة البيانات (15 دقيقة)**

#### **1. إنشاء حساب Supabase:**
1. اذهب إلى [supabase.com](https://supabase.com)
2. اضغط "Start your project"
3. سجل دخول بـ GitHub
4. اضغط "New Project"
5. اختر اسم المشروع: `project-management-system`
6. اختر كلمة مرور قوية لقاعدة البيانات
7. اختر المنطقة الأقرب لك
8. اضغط "Create new project"

#### **2. إعداد قاعدة البيانات:**
1. انتظر حتى يكتمل إنشاء المشروع (2-3 دقائق)
2. اذهب إلى "SQL Editor" من الشريط الجانبي
3. انسخ والصق الكود التالي:

```sql
-- إنشاء جدول الشركات
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL DEFAULT 'إدارة المشاريع',
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#5f979d',
  secondary_color VARCHAR(7) DEFAULT '#b4e1e6',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول الفرق
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول الملفات الشخصية
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  username VARCHAR(100) UNIQUE,
  team_id UUID REFERENCES teams(id),
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول أعضاء الفرق
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- إنشاء جدول المشاريع
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'planning',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  team_id UUID REFERENCES teams(id),
  company_id UUID REFERENCES companies(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول المراحل
CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_target INTEGER DEFAULT 100,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'not-started',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول المهام
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to_team_id UUID REFERENCES teams(id),
  assigned_to_user_id UUID REFERENCES profiles(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  total_target INTEGER DEFAULT 100,
  actual_start_date TIMESTAMP,
  actual_end_date TIMESTAMP,
  planned_effort_hours INTEGER DEFAULT 40,
  actual_effort_hours DECIMAL(6,2) DEFAULT 0,
  risk_level VARCHAR(50) DEFAULT 'low',
  completion_rate INTEGER DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  time_spent INTEGER DEFAULT 0,
  is_overdue BOOLEAN DEFAULT FALSE,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول الإنجازات اليومية
CREATE TABLE daily_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  check_in_time TIMESTAMP,
  check_in_location JSONB,
  check_out_time TIMESTAMP,
  check_out_location JSONB,
  work_hours DECIMAL(4,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, date)
);

-- إنشاء جدول الوسائط
CREATE TABLE media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id UUID REFERENCES daily_achievements(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول التسجيلات الصوتية
CREATE TABLE voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id UUID REFERENCES daily_achievements(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration INTEGER,
  transcription TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول الإشعارات
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول الأنشطة
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  entity_id UUID,
  entity_type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- تفعيل Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للملفات الشخصية
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- سياسات الأمان للفرق
CREATE POLICY "Team members can view their team" ON teams
  FOR SELECT USING (id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ));

-- سياسات الأمان للمشاريع
CREATE POLICY "Team members can view team projects" ON projects
  FOR SELECT USING (team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ));

-- سياسات الأمان للمهام
CREATE POLICY "Users can view assigned tasks" ON tasks
  FOR SELECT USING (
    assigned_to_user_id = auth.uid() OR 
    assigned_to_team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assigned tasks" ON tasks
  FOR UPDATE USING (
    assigned_to_user_id = auth.uid() OR 
    assigned_to_team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- سياسات الأمان للإنجازات اليومية
CREATE POLICY "Users can manage own achievements" ON daily_achievements
  FOR ALL USING (user_id = auth.uid());

-- سياسات الأمان للوسائط
CREATE POLICY "Users can manage own media" ON media_items
  FOR ALL USING (uploaded_by = auth.uid());

-- سياسات الأمان للتسجيلات الصوتية
CREATE POLICY "Users can manage own voice notes" ON voice_notes
  FOR ALL USING (uploaded_by = auth.uid());

-- سياسات الأمان للإشعارات
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- سياسات الأمان للأنشطة
CREATE POLICY "Users can view team activities" ON activities
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IN (
      SELECT tm.user_id FROM team_members tm
      JOIN team_members my_teams ON tm.team_id = my_teams.team_id
      WHERE my_teams.user_id = auth.uid()
    )
  );

-- إنشاء فهارس للأداء
CREATE INDEX idx_profiles_team_id ON profiles(team_id);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_projects_team_id ON projects(team_id);
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_phase_id ON tasks(phase_id);
CREATE INDEX idx_tasks_assigned_to_team_id ON tasks(assigned_to_team_id);
CREATE INDEX idx_tasks_assigned_to_user_id ON tasks(assigned_to_user_id);
CREATE INDEX idx_daily_achievements_task_id ON daily_achievements(task_id);
CREATE INDEX idx_daily_achievements_user_id ON daily_achievements(user_id);
CREATE INDEX idx_daily_achievements_date ON daily_achievements(date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);

-- إدراج بيانات أولية
INSERT INTO companies (name, primary_color, secondary_color) 
VALUES ('إدارة المشاريع', '#5f979d', '#b4e1e6');

-- دوال مساعدة لتحديث التواريخ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء triggers لتحديث updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_phases_updated_at BEFORE UPDATE ON phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- دوال لحساب التقدم التلقائي
CREATE OR REPLACE FUNCTION calculate_project_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects 
    SET progress = (
        SELECT COALESCE(AVG(progress), 0)
        FROM tasks 
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    )
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION calculate_phase_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE phases 
    SET progress = (
        SELECT COALESCE(AVG(progress), 0)
        FROM tasks 
        WHERE phase_id = COALESCE(NEW.phase_id, OLD.phase_id)
    )
    WHERE id = COALESCE(NEW.phase_id, OLD.phase_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- إنشاء triggers لحساب التقدم
CREATE TRIGGER update_project_progress_on_task_change 
    AFTER INSERT OR UPDATE OR DELETE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION calculate_project_progress();

CREATE TRIGGER update_phase_progress_on_task_change 
    AFTER INSERT OR UPDATE OR DELETE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION calculate_phase_progress();
```

4. اضغط "RUN" لتنفيذ الكود
5. تأكد من عدم وجود أخطاء

#### **3. الحصول على مفاتيح API:**
1. اذهب إلى "Settings" → "API"
2. انسخ:
   - **Project URL**
   - **anon public key**
   - **service_role key** (احتفظ به سرياً)

---

### **المرحلة الثانية: إعداد المشروع للنشر (10 دقائق)**

#### **1. إنشاء ملف متغيرات البيئة:**
```bash
# في مجلد المشروع، أنشئ ملف .env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### **2. تحديث package.json:**
تأكد من وجود هذه الأوامر:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

#### **3. اختبار البناء محلياً:**
```bash
npm run build
npm run preview
```

---

### **المرحلة الثالثة: النشر على Vercel (5 دقائق)**

#### **1. إنشاء حساب GitHub:**
1. اذهب إلى [github.com](https://github.com)
2. أنشئ حساب جديد إذا لم يكن لديك
3. أنشئ repository جديد باسم `project-management-system`

#### **2. رفع الكود إلى GitHub:**
```bash
# في terminal مجلد المشروع
git init
git add .
git commit -m "Initial commit: Project Management System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/project-management-system.git
git push -u origin main
```

#### **3. النشر على Vercel:**
1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط "Sign up" وسجل دخول بـ GitHub
3. اضغط "New Project"
4. اختر repository الذي أنشأته
5. اضغط "Deploy"

#### **4. إضافة متغيرات البيئة في Vercel:**
1. بعد النشر، اذهب إلى Project Settings
2. اختر "Environment Variables"
3. أضف:
   - `VITE_SUPABASE_URL` = قيمة URL من Supabase
   - `VITE_SUPABASE_ANON_KEY` = قيمة anon key من Supabase
4. اضغط "Redeploy" لإعادة النشر

---

### **المرحلة الرابعة: إعداد المصادقة (5 دقائق)**

#### **1. تفعيل Email Auth في Supabase:**
1. اذهب إلى "Authentication" → "Settings"
2. تأكد من تفعيل "Enable email confirmations" = OFF (للتبسيط)
3. في "Site URL" ضع رابط موقعك من Vercel

#### **2. إنشاء مستخدم تجريبي:**
1. اذهب إلى "Authentication" → "Users"
2. اضغط "Add user"
3. أدخل:
   - Email: `admin@demo.com`
   - Password: `password123`
4. اضغط "Create user"

---

## ✅ **تم! موقعك الآن منشور ويعمل!**

### **🔗 روابط مهمة:**
- **موقعك**: `https://your-project-name.vercel.app`
- **Supabase Dashboard**: لإدارة قاعدة البيانات
- **Vercel Dashboard**: لمراقبة الموقع

### **🧪 اختبار النظام:**
1. اذهب إلى موقعك
2. سجل دخول بـ: `admin@demo.com` / `password123`
3. جرب إنشاء مشروع جديد
4. أضف فريق ومهام
5. اختبر متتبع المهام

### **📞 إذا واجهت مشاكل:**
- تحقق من console المتصفح للأخطاء
- تأكد من صحة متغيرات البيئة
- راجع logs في Vercel Dashboard
- تأكد من تفعيل RLS policies في Supabase

**مبروك! لديك الآن نظام إدارة مشاريع احترافي منشور على الإنترنت! 🎉**