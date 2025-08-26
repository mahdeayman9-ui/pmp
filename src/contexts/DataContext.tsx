import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Project, Phase, Task, Team, ProjectAnalytics, TeamAnalytics, DashboardStats, Activity } from '../types';
import { addDays, subDays, differenceInDays, isAfter, isBefore } from 'date-fns';

interface DataContextType {
  projects: Project[];
  teams: Team[];
  tasks: Task[];
  phases: Phase[];
  activities: Activity[];
  
  // CRUD operations
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTeam: (team: Omit<Team, 'id' | 'createdAt'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addPhase: (phase: Omit<Phase, 'id' | 'createdAt'>) => void;
  updatePhase: (id: string, updates: Partial<Phase>) => void;
  deletePhase: (id: string) => void;
  
  // Helper functions
  getAllTeams: () => Array<{ id: string; name: string; description: string; memberCount: number }>;
  getProjectAnalytics: (projectId: string) => ProjectAnalytics;
  getTeamAnalytics: (teamId: string) => TeamAnalytics;
  getDashboardStats: () => DashboardStats;
  getTasksByTeam: (teamId: string) => Task[];
  getOverdueTasks: () => Task[];
  getRecentActivities: (limit?: number) => Activity[];
  getPhasesByProject: (projectId: string) => Phase[];
  
  // متتبع المهام المحسن
  logDailyAchievement: (taskId: string, achievement: any) => void;
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  calculateTaskProgress: (task: Task) => number;
  getTaskRiskLevel: (task: Task) => 'low' | 'medium' | 'high' | 'critical';
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data محسن
const mockTeams: Team[] = [
  {
    id: '1',
    name: 'فريق التطوير',
    description: 'مطورو الواجهة الأمامية والخلفية',
    members: [
      { id: '1', userId: '1', name: 'أحمد المدير', email: 'admin@demo.com', role: 'lead', joinedAt: subDays(new Date(), 30) },
      { id: '2', userId: '3', name: 'محمد العضو', email: 'member@demo.com', role: 'member', joinedAt: subDays(new Date(), 15) },
      { id: '4', userId: '4', name: 'علياء المطورة', email: 'alice@demo.com', role: 'member', joinedAt: subDays(new Date(), 20) }
    ],
    createdAt: subDays(new Date(), 30)
  },
  {
    id: '2',
    name: 'فريق التصميم',
    description: 'مصممو واجهات المستخدم والفنانون البصريون',
    members: [
      { id: '3', userId: '2', name: 'سارة المديرة', email: 'manager@demo.com', role: 'lead', joinedAt: subDays(new Date(), 25) },
      { id: '5', userId: '5', name: 'بوب المصمم', email: 'bob@demo.com', role: 'member', joinedAt: subDays(new Date(), 12) }
    ],
    createdAt: subDays(new Date(), 25)
  }
];

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'منصة التجارة الإلكترونية',
    description: 'بناء منصة تجارة إلكترونية حديثة باستخدام React و Node.js',
    startDate: subDays(new Date(), 20),
    endDate: addDays(new Date(), 40),
    status: 'in-progress',
    progress: 65,
    teamId: '1',
    phases: [],
    createdAt: subDays(new Date(), 20)
  },
  {
    id: '2',
    name: 'إعادة تصميم التطبيق المحمول',
    description: 'إعادة تصميم كاملة لتطبيق الهاتف المحمول',
    startDate: subDays(new Date(), 10),
    endDate: addDays(new Date(), 30),
    status: 'in-progress',
    progress: 35,
    teamId: '2',
    phases: [],
    createdAt: subDays(new Date(), 10)
  }
];

const mockPhases: Phase[] = [
  {
    id: '1',
    name: 'التخطيط والتصميم',
    description: 'مرحلة التخطيط الأولي وتصميم واجهة المستخدم',
    startDate: subDays(new Date(), 20),
    endDate: subDays(new Date(), 10),
    status: 'completed',
    progress: 100,
    projectId: '1',
    createdAt: subDays(new Date(), 20)
  },
  {
    id: '2',
    name: 'التطوير',
    description: 'مرحلة التطوير الأساسية',
    startDate: subDays(new Date(), 10),
    endDate: addDays(new Date(), 20),
    status: 'in-progress',
    progress: 70,
    projectId: '1',
    createdAt: subDays(new Date(), 15)
  },
  {
    id: '3',
    name: 'الاختبار والنشر',
    description: 'مرحلة الاختبار والنشر',
    startDate: addDays(new Date(), 20),
    endDate: addDays(new Date(), 40),
    status: 'not-started',
    progress: 0,
    projectId: '1',
    createdAt: subDays(new Date(), 10)
  },
  {
    id: '4',
    name: 'البحث',
    description: 'بحث المستخدمين وتحليل المنافسين',
    startDate: subDays(new Date(), 10),
    endDate: new Date(),
    status: 'in-progress',
    progress: 80,
    projectId: '2',
    createdAt: subDays(new Date(), 10)
  },
  {
    id: '5',
    name: 'مرحلة التصميم',
    description: 'إنشاء تصاميم واجهة المستخدم الجديدة',
    startDate: new Date(),
    endDate: addDays(new Date(), 15),
    status: 'not-started',
    progress: 0,
    projectId: '2',
    createdAt: subDays(new Date(), 5)
  }
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'إنشاء نظام المصادقة',
    description: 'تنفيذ تسجيل الدخول والخروج وإدارة المستخدمين',
    status: 'completed',
    priority: 'high',
    assignedToTeamId: '1',
    assignedToTeamName: 'فريق التطوير',
    startDate: subDays(new Date(), 15),
    endDate: subDays(new Date(), 5),
    progress: 100,
    phaseId: '1',
    projectId: '1',
    createdAt: subDays(new Date(), 15),
    dailyAchievements: [
      {
        date: subDays(new Date(), 10).toISOString().split('T')[0],
        value: 25,
        checkIn: {
          timestamp: subDays(new Date(), 10).toISOString(),
          location: { latitude: 24.7136, longitude: 46.6753 }
        },
        checkOut: {
          timestamp: new Date(subDays(new Date(), 10).getTime() + 8 * 60 * 60 * 1000).toISOString(),
          location: { latitude: 24.7136, longitude: 46.6753 }
        },
        media: [],
        voiceNotes: [],
        workHours: 8
      }
    ],
    totalTarget: 100,
    actualStartDate: subDays(new Date(), 15),
    actualEndDate: subDays(new Date(), 5),
    plannedEffortHours: 40,
    actualEffortHours: 38,
    riskLevel: 'low',
    completionRate: 100,
    timeSpent: 2280,
    isOverdue: false,
    lastActivity: subDays(new Date(), 5)
  },
  {
    id: '2',
    title: 'تصميم كتالوج المنتجات',
    description: 'إنشاء صفحات قائمة المنتجات وتفاصيل المنتج المتجاوبة',
    status: 'in-progress',
    priority: 'high',
    assignedToTeamId: '1',
    assignedToTeamName: 'فريق التطوير',
    startDate: subDays(new Date(), 8),
    endDate: addDays(new Date(), 5),
    progress: 60,
    phaseId: '2',
    projectId: '1',
    createdAt: subDays(new Date(), 8),
    dailyAchievements: [
      {
        date: subDays(new Date(), 5).toISOString().split('T')[0],
        value: 30,
        checkIn: {
          timestamp: subDays(new Date(), 5).toISOString(),
          location: { latitude: 24.7136, longitude: 46.6753 }
        },
        media: [],
        voiceNotes: [],
        workHours: 6
      }
    ],
    totalTarget: 50,
    actualStartDate: subDays(new Date(), 8),
    plannedEffortHours: 32,
    actualEffortHours: 20,
    riskLevel: 'medium',
    completionRate: 60,
    timeSpent: 1200,
    isOverdue: false,
    lastActivity: subDays(new Date(), 1)
  },
  {
    id: '3',
    title: 'تنفيذ سلة التسوق',
    description: 'إضافة وظيفة إضافة إلى السلة وإدارة السلة',
    status: 'todo',
    priority: 'medium',
    assignedToTeamId: '2',
    assignedToTeamName: 'فريق التصميم',
    startDate: new Date(),
    endDate: addDays(new Date(), 10),
    progress: 0,
    phaseId: '2',
    projectId: '1',
    createdAt: subDays(new Date(), 3),
    dailyAchievements: [],
    totalTarget: 75,
    plannedEffortHours: 50,
    actualEffortHours: 0,
    riskLevel: 'low',
    completionRate: 0,
    timeSpent: 0,
    isOverdue: false,
    lastActivity: subDays(new Date(), 3)
  }
];

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'task_completed',
    description: 'تم إكمال مهمة "إنشاء نظام المصادقة"',
    userId: '1',
    userName: 'أحمد المدير',
    entityId: '1',
    entityType: 'task',
    timestamp: subDays(new Date(), 5)
  },
  {
    id: '2',
    type: 'achievement_logged',
    description: 'تم تسجيل إنجاز يومي لمهمة "تصميم كتالوج المنتجات"',
    userId: '4',
    userName: 'علياء المطورة',
    entityId: '2',
    entityType: 'task',
    timestamp: subDays(new Date(), 1)
  }
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [phases, setPhases] = useState<Phase[]>(mockPhases);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);

  // Helper functions محسنة
  const getAllTeams = () => {
    return teams.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team.members.length
    }));
  };

  const calculateTaskProgress = (task: Task): number => {
    if (!task.dailyAchievements || task.dailyAchievements.length === 0) return 0;
    if (!task.totalTarget || task.totalTarget === 0) return task.status === 'completed' ? 100 : 0;
    
    const totalAchieved = task.dailyAchievements.reduce((sum, achievement) => sum + (achievement.value || 0), 0);
    return Math.min(100, Math.round((totalAchieved / task.totalTarget) * 100));
  };

  const getTaskRiskLevel = (task: Task): 'low' | 'medium' | 'high' | 'critical' => {
    const today = new Date();
    const endDate = new Date(task.endDate);
    const startDate = new Date(task.startDate);
    const progress = calculateTaskProgress(task);
    
    // إذا كانت المهمة متأخرة
    if (isAfter(today, endDate) && task.status !== 'completed') {
      return 'critical';
    }
    
    // إذا كانت المهمة قريبة من الانتهاء والتقدم منخفض
    const totalDays = differenceInDays(endDate, startDate);
    const remainingDays = differenceInDays(endDate, today);
    const expectedProgress = totalDays > 0 ? ((totalDays - remainingDays) / totalDays) * 100 : 0;
    
    if (progress < expectedProgress - 20) return 'high';
    if (progress < expectedProgress - 10) return 'medium';
    
    return 'low';
  };

  const getProjectAnalytics = (projectId: string): ProjectAnalytics => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const completedTasks = projectTasks.filter(t => t.status === 'completed');
    const inProgressTasks = projectTasks.filter(t => t.status === 'in-progress');
    const overdueTasks = projectTasks.filter(t => t.isOverdue);
    
    const averageCompletionTime = completedTasks.length > 0 
      ? completedTasks.reduce((sum, task) => sum + (task.actualEffortHours || 0), 0) / completedTasks.length
      : 0;
    
    const teamProductivity = projectTasks.length > 0 
      ? (completedTasks.length / projectTasks.length) * 100
      : 0;
    
    const riskScore = projectTasks.reduce((score, task) => {
      const riskValues = { low: 1, medium: 2, high: 3, critical: 4 };
      return score + riskValues[getTaskRiskLevel(task)];
    }, 0) / projectTasks.length;

    return {
      projectId,
      totalTasks: projectTasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      overdueTasks: overdueTasks.length,
      averageCompletionTime,
      teamProductivity,
      riskScore
    };
  };

  const getTeamAnalytics = (teamId: string): TeamAnalytics => {
    const team = teams.find(t => t.id === teamId);
    const teamProjects = projects.filter(p => p.teamId === teamId);
    const teamTasks = tasks.filter(t => teamProjects.some(p => p.id === t.projectId));
    
    const workloadDistribution = team?.members.map(member => ({
      memberId: member.userId,
      taskCount: teamTasks.filter(t => t.assignedToUserId === member.userId).length
    })) || [];

    return {
      teamId,
      memberCount: team?.members.length || 0,
      activeProjects: teamProjects.filter(p => p.status === 'in-progress').length,
      completedProjects: teamProjects.filter(p => p.status === 'completed').length,
      totalTasks: teamTasks.length,
      averageTaskCompletion: teamTasks.length > 0 
        ? teamTasks.reduce((sum, task) => sum + calculateTaskProgress(task), 0) / teamTasks.length
        : 0,
      workloadDistribution
    };
  };

  const getDashboardStats = (): DashboardStats => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const overdueTasks = tasks.filter(t => t.isOverdue);
    const activeTeams = getAllTeams().filter(team => 
      tasks.some(t => t.assignedToTeamId === team.id && t.status === 'in-progress')
    );

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'in-progress').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      totalMembers: teams.reduce((acc, team) => acc + team.members.length, 0),
      activeMembers: activeTeams.length,
      recentActivities: activities.slice(0, 10)
    };
  };

  const getTasksByTeam = (teamId: string): Task[] => {
    return tasks.filter(t => t.assignedToTeamId === teamId);
  };

  const getOverdueTasks = (): Task[] => {
    return tasks.filter(t => t.isOverdue);
  };

  const getRecentActivities = (limit: number = 10): Activity[] => {
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  const getPhasesByProject = (projectId: string): Phase[] => {
    return phases.filter(phase => phase.projectId === projectId);
  };
  // متتبع المهام المحسن
  const logDailyAchievement = (taskId: string, achievement: any) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedAchievements = task.dailyAchievements || [];
        const existingIndex = updatedAchievements.findIndex(a => a.date === achievement.date);
        
        if (existingIndex >= 0) {
          updatedAchievements[existingIndex] = achievement;
        } else {
          updatedAchievements.push(achievement);
        }
        
        const newProgress = calculateTaskProgress({ ...task, dailyAchievements: updatedAchievements });
        const newRiskLevel = getTaskRiskLevel({ ...task, progress: newProgress });
        
        // إضافة نشاط جديد
        const newActivity: Activity = {
          id: Date.now().toString(),
          type: 'achievement_logged',
          description: `تم تسجيل إنجاز يومي لمهمة "${task.title}"`,
          userId: task.assignedToUserId || '',
          userName: task.assignedToName || '',
          entityId: taskId,
          entityType: 'task',
          timestamp: new Date()
        };
        setActivities(prev => [newActivity, ...prev]);
        
        return {
          ...task,
          dailyAchievements: updatedAchievements,
          progress: newProgress,
          riskLevel: newRiskLevel,
          lastActivity: new Date()
        };
      }
      return task;
    }));
  };

  const startTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newActivity: Activity = {
          id: Date.now().toString(),
          type: 'task_created',
          description: `تم بدء مهمة "${task.title}"`,
          userId: task.assignedToUserId || '',
          userName: task.assignedToName || '',
          entityId: taskId,
          entityType: 'task',
          timestamp: new Date()
        };
        setActivities(prev => [newActivity, ...prev]);
        
        return {
          ...task,
          status: 'in-progress' as const,
          actualStartDate: new Date(),
          lastActivity: new Date()
        };
      }
      return task;
    }));
  };

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newActivity: Activity = {
          id: Date.now().toString(),
          type: 'task_completed',
          description: `تم إكمال مهمة "${task.title}"`,
          userId: task.assignedToUserId || '',
          userName: task.assignedToName || '',
          entityId: taskId,
          entityType: 'task',
          timestamp: new Date()
        };
        setActivities(prev => [newActivity, ...prev]);
        
        return {
          ...task,
          status: 'completed' as const,
          actualEndDate: new Date(),
          progress: 100,
          completionRate: 100,
          lastActivity: new Date()
        };
      }
      return task;
    }));
  };

  // CRUD operations محسنة
  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setProjects(prev => [...prev, newProject]);
    
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'project_started',
      description: `تم إنشاء مشروع جديد "${project.name}"`,
      userId: 'current-user',
      userName: 'المستخدم الحالي',
      entityId: newProject.id,
      entityType: 'project',
      timestamp: new Date()
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
  };

  const addTeam = (team: Omit<Team, 'id' | 'createdAt'>) => {
    const newTeam: Team = {
      ...team,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setTeams(prev => [...prev, newTeam]);
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTeam = (id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    const projectsToDelete = projects.filter(p => p.teamId === id).map(p => p.id);
    setProjects(prev => prev.filter(p => p.teamId !== id));
    setTasks(prev => prev.filter(t => !projectsToDelete.includes(t.projectId)));
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date(),
      dailyAchievements: [],
      riskLevel: 'low',
      completionRate: 0,
      timeSpent: 0,
      isOverdue: false,
      lastActivity: new Date()
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const updatedTask = { ...t, ...updates, lastActivity: new Date() };
        
        // إعادة حساب التقدم ومستوى المخاطر
        if (updates.dailyAchievements) {
          updatedTask.progress = calculateTaskProgress(updatedTask);
          updatedTask.riskLevel = getTaskRiskLevel(updatedTask);
        }
        
        return updatedTask;
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // حساب الإحصائيات المحسنة
  const enhancedProjects = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const projectPhases = phases.filter(p => p.projectId === project.id);
      const completedTasks = projectTasks.filter(t => t.status === 'completed');
      const overdueTasks = projectTasks.filter(t => t.isOverdue);
      
      return {
        ...project,
        phases: projectPhases,
        totalTasks: projectTasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        progress: projectTasks.length > 0 
          ? Math.round(projectTasks.reduce((sum, task) => sum + calculateTaskProgress(task), 0) / projectTasks.length)
          : 0
      };
    });
  }, [projects, tasks, phases]);

  const enhancedTasks = useMemo(() => {
    return tasks.map(task => ({
      ...task,
      progress: calculateTaskProgress(task),
      riskLevel: getTaskRiskLevel(task),
      isOverdue: isAfter(new Date(), new Date(task.endDate)) && task.status !== 'completed'
    }));
  }, [tasks]);

  return (
    <DataContext.Provider value={{
      projects: enhancedProjects,
      teams,
      tasks: enhancedTasks,
      phases,
      activities,
      addProject,
      updateProject,
      deleteProject,
      addTeam,
      updateTeam,
      deleteTeam,
      addTask,
      updateTask,
      deleteTask,
      addPhase,
      updatePhase,
      deletePhase,
      addPhase,
      updatePhase,
      deletePhase,
      getAllTeams,
      getProjectAnalytics,
      getTeamAnalytics,
      getDashboardStats,
      getTasksByTeam,
      getOverdueTasks,
      getRecentActivities,
      getPhasesByProject,
      logDailyAchievement,
      startTask,
      completeTask,
      calculateTaskProgress,
      getTaskRiskLevel
    }
    }
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};