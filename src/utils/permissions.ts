// Team IDs from database
export const TEAM_IDS = {
  MEASUREMENTS: '0962dc99-7414-4976-b7fc-6002ca7f9111', // فريق المقاسات
  PROJECT_MANAGER: '4ef42924-e08e-4656-8be4-3e63588e8516', // مدير المشروع
  INSTALLATION: '573e7fd6-2ae2-48f0-8894-987179634d68', // فريق التركيبات
  PRODUCTION: '7454113d-0e95-4881-8e87-b2f85e8f9b90', // فريق الانتاج
  FINANCIAL: '9be41b39-58f1-4605-8604-a9df08433371', // الادارة الماليه
  DESIGN: 'a3e46172-5bef-4153-87c1-c9f7c84a8e96', // فريق التصميم
} as const;

export type TeamId = typeof TEAM_IDS[keyof typeof TEAM_IDS];

// Check if user can access financial pages
export const canAccessFinancialPages = (teamId?: string): boolean => {
  // Project manager cannot access financial pages
  return teamId !== TEAM_IDS.PROJECT_MANAGER;
};

// Check if user can access archive
export const canAccessArchive = (teamId?: string): boolean => {
  // Project manager cannot access archive
  return teamId !== TEAM_IDS.PROJECT_MANAGER;
};

// Check if user can update tasks
export const canUpdateTasks = (teamId?: string): boolean => {
  // Financial team cannot update tasks
  return teamId !== TEAM_IDS.FINANCIAL;
};

// Get allowed pages for a team
export const getAllowedPages = (teamId?: string): string[] => {
  const allPages = [
    'لوحة التحكم',
    'حاسبة المشاريع',
    'المشاريع',
    'مراحل المشاريع',
    'الفرق',
    'الأعضاء',
    'المهام',
    'متتبع المهام',
    'مخطط جانت',
    'التحليلات',
    'التقارير',
    'معرض الصور',
    'التخطيط والإدارة المالية',
    'تقرير التحقق الفني',
    'أرشيف المشاريع',
    'الإعدادات'
  ];

  // Admin/manager can access all
  if (!teamId) return allPages;

  // Project manager restrictions
  if (teamId === TEAM_IDS.PROJECT_MANAGER) {
    return allPages.filter(page =>
      page !== 'التخطيط والإدارة المالية' &&
      page !== 'أرشيف المشاريع'
    );
  }

  // Other teams: only tasks and task tracker
  return ['المهام', 'متتبع المهام'];
};

// Check if user is from restricted team
export const isRestrictedTeam = (teamId?: string): boolean => {
  return teamId === TEAM_IDS.PROJECT_MANAGER ||
         teamId === TEAM_IDS.FINANCIAL ||
         !!teamId && !Object.values(TEAM_IDS).includes(teamId as TeamId);
};