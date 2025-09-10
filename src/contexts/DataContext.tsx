import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useEffect } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Project, Phase, Task, Team, ProjectAnalytics, TeamAnalytics, DashboardStats, Activity } from '../types';
import { differenceInDays, isAfter } from 'date-fns';
import toast from 'react-hot-toast';

interface DataContextType {
   projects: Project[];
   teams: Team[];
   tasks: Task[];
   phases: Phase[];
   activities: Activity[];
   isLoading: boolean;
   isDataLoaded: boolean;

  // CRUD operations
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTeam: (team: Omit<Team, 'id' | 'createdAt'>) => Promise<any | null>;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => void;
  addPhase: (phase: Omit<Phase, 'id' | 'createdAt'>) => Promise<void>;
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
  
  // Helper function to get all members from all teams
  getAllMembers: () => Array<{ id: string; name: string; email?: string; teamName: string; teamId: string; department?: string; jobTitle?: string; salary?: number; idPhotoUrl?: string; pdfFileUrl?: string }>;

  // Update member function
  updateMember: (memberId: string, updates: Partial<any>) => void;
  
  // متتبع المهام المحسن
  logDailyAchievement: (taskId: string, achievement: any) => Promise<void>;
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  calculateTaskProgress: (task: Task) => number;
  getTaskRiskLevel: (task: Task) => 'low' | 'medium' | 'high' | 'critical';
  updatePhaseProgress: (phaseId: string) => void;
  saveAllPendingChanges: () => Promise<void>;
  loadDailyAchievementsForTask: (taskId: string) => Promise<void>;
  getPendingChangesCount: () => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Empty arrays for clean start - no mock data
const emptyTeams: Team[] = [];
const emptyProjects: Project[] = [];
const emptyPhases: Phase[] = [];
const emptyTasks: Task[] = [];
const emptyActivities: Activity[] = [];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
   const { user } = useAuth();
   const [projects, setProjects] = useState<Project[]>(emptyProjects);
   const [teams, setTeams] = useState<Team[]>(emptyTeams);
   const [tasks, setTasks] = useState<Task[]>(emptyTasks);
   const [phases, setPhases] = useState<Phase[]>(emptyPhases);
   const [activities, setActivities] = useState<Activity[]>(emptyActivities);
   const [isDataLoaded, setIsDataLoaded] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [autoSaveEnabled] = useState(true);
   const [pendingChanges, setPendingChanges] = useState<Map<string, any>>(new Map());

  // تحميل البيانات من Supabase - محسن للأداء
  useEffect(() => {
    if (user && !isDataLoaded && !isLoading) {
      loadAllData();
    }
  }, [user, isDataLoaded, isLoading]);

  // Auto-save functionality - محسن للأداء
  useEffect(() => {
    if (!autoSaveEnabled || pendingChanges.size === 0 || isLoading) return;

    const autoSaveTimer = setTimeout(async () => {
      // تحقق من وجود تغييرات معلقة قبل الحفظ
      if (pendingChanges.size > 0 && !isLoading) {
        await savePendingChanges();
      }
    }, 5000); // زيادة الوقت إلى 5 ثوانٍ لتقليل التكرار

    return () => clearTimeout(autoSaveTimer);
  }, [pendingChanges, autoSaveEnabled, isLoading]);

  // Save pending changes to database
  const savePendingChanges = async () => {
    if (pendingChanges.size === 0) return;

    try {
      for (const [taskId, changes] of pendingChanges) {
        if (changes.dailyAchievements) {
          for (const achievement of changes.dailyAchievements) {
            try {
              // First, try to find if the record already exists
              const { data: existingRecord, error: fetchError } = await supabase
                .from('daily_achievements')
                .select('id')
                .eq('task_id', taskId)
                .eq('date', achievement.date)
                .eq('user_id', user?.id)
                .single();

              let result;
              if (existingRecord && !fetchError) {
                // Update existing record
                result = await supabase
                  .from('daily_achievements')
                  .update({
                    value: achievement.value || 0,
                    check_in_time: achievement.checkIn?.timestamp || null,
                    check_in_location: achievement.checkIn?.location || null,
                    check_out_time: achievement.checkOut?.timestamp || null,
                    check_out_location: achievement.checkOut?.location || null,
                    work_hours: achievement.workHours || 0,
                    notes: achievement.notes || null,
                    media: achievement.media || [],
                    voice_notes: achievement.voiceNotes || []
                  })
                  .eq('id', existingRecord.id);
              } else {
                // Insert new record
                result = await supabase
                  .from('daily_achievements')
                  .insert({
                    task_id: taskId,
                    user_id: user?.id,
                    date: achievement.date,
                    value: achievement.value || 0,
                    check_in_time: achievement.checkIn?.timestamp || null,
                    check_in_location: achievement.checkIn?.location || null,
                    check_out_time: achievement.checkOut?.timestamp || null,
                    check_out_location: achievement.checkOut?.location || null,
                    work_hours: achievement.workHours || 0,
                    notes: achievement.notes || null,
                    media: achievement.media || [],
                    voice_notes: achievement.voiceNotes || []
                  });
              }

              if (result.error) {
                console.error('Auto-save error for task', taskId, 'achievement', achievement.date, ':', result.error);

                // If it's still a duplicate key error, try to update instead
                if (result.error.code === '23505' && result.error.message?.includes('duplicate key')) {
                  console.log('Attempting to resolve duplicate key error by updating existing record...');

                  // Try to find and update the existing record
                  const { data: conflictRecord } = await supabase
                    .from('daily_achievements')
                    .select('id')
                    .eq('task_id', taskId)
                    .eq('date', achievement.date)
                    .eq('user_id', user?.id)
                    .single();

                  if (conflictRecord) {
                    const updateResult = await supabase
                      .from('daily_achievements')
                      .update({
                        value: achievement.value || 0,
                        check_in_time: achievement.checkIn?.timestamp || null,
                        check_in_location: achievement.checkIn?.location || null,
                        check_out_time: achievement.checkOut?.timestamp || null,
                        check_out_location: achievement.checkOut?.location || null,
                        work_hours: achievement.workHours || 0,
                        notes: achievement.notes || null,
                        media: achievement.media || [],
                        voice_notes: achievement.voiceNotes || []
                      })
                      .eq('id', conflictRecord.id);

                    if (updateResult.error) {
                      console.error('Failed to resolve duplicate key error:', updateResult.error);
                    } else {
                      console.log('Successfully resolved duplicate key error');
                    }
                  }
                }
              } else {
                console.log('Successfully saved achievement for task', taskId, 'date', achievement.date);
              }
            } catch (achievementError) {
              console.error('Error processing achievement for task', taskId, 'date', achievement.date, ':', achievementError);
            }
          }
        }
      }

      setPendingChanges(new Map());
      console.log('Auto-saved pending changes');
    } catch (error) {
      console.error('Error during auto-save:', error);
    }
  };

  // تحميل جميع البيانات من قاعدة البيانات - محسن للأداء
  const loadAllData = async () => {
    if (isLoading) return; // Prevent multiple simultaneous loads

    try {
      setIsLoading(true);
      setIsDataLoaded(false);

      console.log('بدء تحميل البيانات...');

      // تحميل البيانات بشكل متتابع لتجنب التحميل الثقيل
      await loadTeams();
      await loadProjects();
      await loadPhases();
      await loadTasks();

      setIsDataLoaded(true);
      console.log('تم تحميل البيانات بنجاح');

    } catch (error) {
      console.error('Error loading data:', error);
      console.log('Starting with empty data due to error');
      // استخدام البيانات الفارغة في حالة الخطأ
      setTeams(emptyTeams);
      setProjects(emptyProjects);
      setPhases(emptyPhases);
      setTasks(emptyTasks);
      setIsDataLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل الفرق بشكل منفصل
  const loadTeams = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          simple_team_members (
            id,
            name,
            email,
            role,
            department,
            job_title,
            salary,
            id_photo_url,
            pdf_file_url,
            created_at
          )
        `)
        .limit(100); // تحديد الحد الأقصى

      if (teamsError) {
        console.error('Error loading teams:', teamsError);
        setTeams(emptyTeams);
      } else if (teamsData) {
        const formattedTeams = teamsData.map(team => ({
          id: team.id,
          name: team.name,
          description: team.description || '',
          members: team.simple_team_members?.map((member: any) => ({
            id: member.id,
            userId: member.id,
            name: member.name,
            email: member.email,
            role: member.role === 'lead' ? 'lead' : 'member',
            department: member.department,
            jobTitle: member.job_title,
            salary: member.salary,
            idPhotoUrl: member.id_photo_url,
            pdfFileUrl: member.pdf_file_url,
            joinedAt: new Date(member.created_at)
          })) || [],
          createdAt: new Date(team.created_at),
          loginEmail: team.login_email,
          loginPassword: team.login_password
        }));
        setTeams(formattedTeams);
      }
    } catch (error) {
      console.error('Error in loadTeams:', error);
      setTeams(emptyTeams);
    }
  };

  // تحميل المشاريع بشكل منفصل
  const loadProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .limit(200); // تحديد الحد الأقصى

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        setProjects(emptyProjects);
      } else if (projectsData) {
        const formattedProjects = projectsData.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
          startDate: new Date(project.start_date),
          endDate: new Date(project.end_date),
          status: project.status as any,
          progress: project.progress || 0,
          teamId: project.team_id || '',
          phases: [],
          createdAt: new Date(project.created_at)
        }));
        setProjects(formattedProjects);
      }
    } catch (error) {
      console.error('Error in loadProjects:', error);
      setProjects(emptyProjects);
    }
  };

  // تحميل المراحل بشكل منفصل
  const loadPhases = async () => {
    try {
      const { data: phasesData, error: phasesError } = await supabase
        .from('phases')
        .select('*')
        .limit(500); // تحديد الحد الأقصى

      if (phasesError) {
        console.error('Error loading phases:', phasesError);
        setPhases(emptyPhases);
      } else if (phasesData) {
        const formattedPhases = phasesData.map(phase => ({
          id: phase.id,
          name: phase.name,
          description: phase.description || '',
          totalTarget: phase.total_target || 100,
          startDate: new Date(phase.start_date),
          endDate: new Date(phase.end_date),
          status: phase.status as any,
          progress: phase.progress || 0,
          projectId: phase.project_id,
          createdAt: new Date(phase.created_at)
        }));
        setPhases(formattedPhases);
      }
    } catch (error) {
      console.error('Error in loadPhases:', error);
      setPhases(emptyPhases);
    }
  };

  // تحميل المهام بشكل منفصل
  const loadTasks = async () => {
    try {
      // تحميل المهام بدون JOIN معقد لتحسين الأداء
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .limit(1000); // تحديد الحد الأقصى

      if (tasksError) {
        console.error('Error loading tasks:', tasksError);
        setTasks(emptyTasks);
      } else if (tasksData) {
        const formattedTasks = tasksData.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as any,
          priority: task.priority as any,
          assignedToTeamId: task.assigned_to_team_id,
          assignedToTeamName: 'سيتم تحديثه لاحقاً', // سيتم تحديثه في useMemo
          startDate: new Date(task.start_date),
          endDate: new Date(task.end_date),
          progress: task.progress || 0,
          phaseId: task.phase_id,
          projectId: task.project_id,
          createdAt: new Date(task.created_at),
          dailyAchievements: [],
          totalTarget: task.total_target || 100,
          actualStartDate: task.actual_start_date ? new Date(task.actual_start_date) : undefined,
          actualEndDate: task.actual_end_date ? new Date(task.actual_end_date) : undefined,
          plannedEffortHours: task.planned_effort_hours || 40,
          actualEffortHours: task.actual_effort_hours || 0,
          riskLevel: task.risk_level as any || 'low',
          completionRate: task.completion_rate || 0,
          timeSpent: task.time_spent || 0,
          isOverdue: task.is_overdue || false,
          lastActivity: task.last_activity ? new Date(task.last_activity) : new Date(),
          assignedToUserId: task.assigned_to_user_id || undefined,
          assignedToName: '',
        }));
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Error in loadTasks:', error);
      setTasks(emptyTasks);
    }
  };

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

  const getAllMembers = () => {
    const allMembers: Array<{ id: string; name: string; email?: string; teamName: string; teamId: string; department?: string; jobTitle?: string; salary?: number; idPhotoUrl?: string; pdfFileUrl?: string }> = [];

    teams.forEach(team => {
      team.members.forEach(member => {
        allMembers.push({
          id: member.userId,
          name: member.name,
          email: member.email,
          teamName: team.name,
          teamId: team.id,
          department: (member as any).department,
          jobTitle: (member as any).jobTitle,
          salary: (member as any).salary,
          idPhotoUrl: (member as any).idPhotoUrl,
          pdfFileUrl: (member as any).pdfFileUrl,
        });
      });
    });

    return allMembers;
  };

  // Update member function
  const updateMember = (memberId: string, updates: Partial<any>) => {
    setTeams(prev => prev.map(team => ({
      ...team,
      members: team.members.map(member =>
        member.id === memberId ? { ...member, ...updates } : member
      )
    })));
  };

  // متتبع المهام المحسن
  const logDailyAchievement = async (taskId: string, achievement: any) => {
    try {
      // First, check if the record already exists
      const { data: existingRecord, error: fetchError } = await supabase
        .from('daily_achievements')
        .select('id')
        .eq('task_id', taskId)
        .eq('date', achievement.date)
        .eq('user_id', user?.id)
        .single();

      let result;
      if (existingRecord && !fetchError) {
        // Update existing record
        result = await supabase
          .from('daily_achievements')
          .update({
            value: achievement.value || 0,
            check_in_time: achievement.checkIn?.timestamp || null,
            check_in_location: achievement.checkIn?.location || null,
            check_out_time: achievement.checkOut?.timestamp || null,
            check_out_location: achievement.checkOut?.location || null,
            work_hours: achievement.workHours || 0,
            notes: achievement.notes || null,
            media: achievement.media || [],
            voice_notes: achievement.voiceNotes || [],
            assigned_members: achievement.assignedMembers || []
          })
          .eq('id', existingRecord.id);
      } else {
        // Insert new record
        result = await supabase
          .from('daily_achievements')
          .insert({
            task_id: taskId,
            user_id: user?.id,
            date: achievement.date,
            value: achievement.value || 0,
            check_in_time: achievement.checkIn?.timestamp || null,
            check_in_location: achievement.checkIn?.location || null,
            check_out_time: achievement.checkOut?.timestamp || null,
            check_out_location: achievement.checkOut?.location || null,
            work_hours: achievement.workHours || 0,
            notes: achievement.notes || null,
            media: achievement.media || [],
            voice_notes: achievement.voiceNotes || [],
            assigned_members: achievement.assignedMembers || []
          });
      }

      if (result.error) {
        // Handle duplicate key error specifically
        if (result.error.code === '23505' && result.error.message?.includes('duplicate key')) {
          console.log('Attempting to resolve duplicate key error...');

          // Try to find and update the existing record
          const { data: conflictRecord } = await supabase
            .from('daily_achievements')
            .select('id')
            .eq('task_id', taskId)
            .eq('date', achievement.date)
            .eq('user_id', user?.id)
            .single();

          if (conflictRecord) {
            const updateResult = await supabase
              .from('daily_achievements')
              .update({
                value: achievement.value || 0,
                check_in_time: achievement.checkIn?.timestamp || null,
                check_in_location: achievement.checkIn?.location || null,
                check_out_time: achievement.checkOut?.timestamp || null,
                check_out_location: achievement.checkOut?.location || null,
                work_hours: achievement.workHours || 0,
                notes: achievement.notes || null,
                media: achievement.media || [],
                voice_notes: achievement.voiceNotes || [],
                assigned_members: achievement.assignedMembers || []
              })
              .eq('id', conflictRecord.id);

            if (updateResult.error) {
              toast.error('فشل في حل تعارض البيانات');
              return;
            }
          }
        } else {
          toast.error(handleSupabaseError(result.error));
          return;
        }
      }

      // إعادة تحميل البيانات
      await loadAllData();
      toast.success('تم حفظ الإنجاز اليومي');

    } catch (error) {
      console.error('Error logging achievement:', error);
      toast.error('فشل في حفظ الإنجاز');
    }
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
        
        const updatedTask = {
          ...task,
          status: 'in-progress' as const,
          actualStartDate: new Date(),
          lastActivity: new Date()
        };
        
        // تحديث تقدم المرحلة
        updatePhaseProgress(task.phaseId);
        
        return updatedTask;
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
        
        const updatedTask = {
          ...task,
          status: 'completed' as const,
          actualEndDate: new Date(),
          progress: 100,
          completionRate: 100,
          lastActivity: new Date()
        };
        
        // تحديث تقدم المرحلة
        updatePhaseProgress(task.phaseId);
        
        return updatedTask;
      }
      return task;
    }));
  };

  // CRUD operations محسنة
  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: project.name,
          description: project.description,
          start_date: project.startDate.toISOString().split('T')[0],
          end_date: project.endDate.toISOString().split('T')[0],
          status: project.status,
          progress: project.progress,
          team_id: project.teamId || null,
          company_id: null,
          created_by: user?.id || null
        })
        .select()
        .single();

      if (error) {
        toast.error(handleSupabaseError(error));
        return;
      }

      if (data) {
        const newProject: Project = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          startDate: new Date(data.start_date),
          endDate: new Date(data.end_date),
          status: data.status,
          progress: data.progress || 0,
          teamId: data.team_id || '',
          phases: [],
          createdAt: new Date(data.created_at)
        };
        
        setProjects(prev => [...prev, newProject]);
        toast.success('تم إنشاء المشروع بنجاح');
      }
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error('فشل في إنشاء المشروع');
    }
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
  };

  const addTeam = async (team: Omit<Team, 'id' | 'createdAt'>) => {
    try {
      // إنشاء الفريق
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: team.name,
          description: team.description,
          company_id: null
        })
        .select()
        .single();

      if (teamError) {
        toast.error(handleSupabaseError(teamError));
        return null;
      }

      // إعادة تحميل البيانات لتحديث القائمة
      await loadAllData();
      toast.success('تم إنشاء الفريق بنجاح');

      // إرجاع بيانات الفريق الجديد
      return teamData;

    } catch (error) {
      console.error('Error adding team:', error);
      toast.error('فشل في إنشاء الفريق');
      return null;
    }
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

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to_team_id: task.assignedToTeamId,
          assigned_to_user_id: null,
          start_date: task.startDate.toISOString().split('T')[0],
          end_date: task.endDate.toISOString().split('T')[0],
          progress: task.progress,
          phase_id: task.phaseId,
          project_id: task.projectId,
          total_target: task.totalTarget || 100,
          planned_effort_hours: task.plannedEffortHours || 40,
          risk_level: 'low',
          completion_rate: 0,
          created_by: user?.id || null
        })
        .select()
        .single();

      if (error) {
        toast.error(handleSupabaseError(error));
        return;
      }

      if (data) {
        // إعادة تحميل البيانات
        await loadAllData();
        toast.success('تم إنشاء المهمة بنجاح');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('فشل في إنشاء المهمة');
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      // تحديث البيانات في قاعدة البيانات للحقول غير الإنجازات اليومية
      const updateData: any = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.progress !== undefined) updateData.progress = updates.progress;
      if (updates.actualStartDate !== undefined) updateData.actual_start_date = updates.actualStartDate?.toISOString();
      if (updates.actualEndDate !== undefined) updateData.actual_end_date = updates.actualEndDate?.toISOString();
      if (updates.totalTarget !== undefined) updateData.total_target = updates.totalTarget;
      if (updates.plannedEffortHours !== undefined) updateData.planned_effort_hours = updates.plannedEffortHours;
      if (updates.actualEffortHours !== undefined) updateData.actual_effort_hours = updates.actualEffortHours;
      if (updates.riskLevel !== undefined) updateData.risk_level = updates.riskLevel;
      if (updates.completionRate !== undefined) updateData.completion_rate = updates.completionRate;
      if (updates.timeSpent !== undefined) updateData.time_spent = updates.timeSpent;
      if (updates.isOverdue !== undefined) updateData.is_overdue = updates.isOverdue;
      updateData.last_activity = new Date().toISOString();

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', id);

        if (error) {
          toast.error(handleSupabaseError(error));
          return;
        }
      }

      // تحديث الحالة المحلية
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          const updatedTask = {
            ...t,
            ...updates,
            lastActivity: new Date(),
            // تحديث التقدم إذا تم تحديث الإنجازات اليومية
            progress: updates.dailyAchievements ?
              calculateTaskProgress({ ...t, ...updates }) :
              (updates.progress !== undefined ? updates.progress : t.progress)
          };

          // إعادة حساب مستوى المخاطر
          updatedTask.riskLevel = getTaskRiskLevel(updatedTask);
          updatedTask.isOverdue = isAfter(new Date(), new Date(updatedTask.endDate)) && updatedTask.status !== 'completed';

          // تحديث تقدم المرحلة المرتبطة
          updatePhaseProgress(updatedTask.phaseId);

          return updatedTask;
        }
        return t;
      }));

      // إذا تم تحديث الإنجازات اليومية، أضفها إلى التغييرات المعلقة للحفظ التلقائي
      if (updates.dailyAchievements) {
        setPendingChanges(prev => {
          const newMap = new Map(prev);
          newMap.set(id, { ...updates, timestamp: Date.now() });
          return newMap;
        });
      }

    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('فشل في تحديث المهمة');
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addPhase = async (phase: Omit<Phase, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('phases')
        .insert({
          name: phase.name,
          description: phase.description,
          total_target: phase.totalTarget || 100,
          start_date: phase.startDate.toISOString().split('T')[0],
          end_date: phase.endDate.toISOString().split('T')[0],
          status: phase.status,
          progress: phase.progress,
          project_id: phase.projectId
        })
        .select()
        .single();

      if (error) {
        toast.error(handleSupabaseError(error));
        return;
      }

      if (data) {
        // إعادة تحميل البيانات
        await loadAllData();
        toast.success('تم إنشاء المرحلة بنجاح');
      }
    } catch (error) {
      console.error('Error adding phase:', error);
      toast.error('فشل في إنشاء المرحلة');
    }
  };

  const updatePhase = (id: string, updates: Partial<Phase>) => {
    setPhases(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePhase = (id: string) => {
    setPhases(prev => prev.filter(p => p.id !== id));
  };

  // دالة لتحديث تقدم المرحلة بناءً على المهام المرتبطة بها
  const updatePhaseProgress = (phaseId: string) => {
    const phaseTasks = tasks.filter(t => t.phaseId === phaseId);
    if (phaseTasks.length === 0) return;

    const totalProgress = phaseTasks.reduce((sum, task) => sum + calculateTaskProgress(task), 0);
    const averageProgress = Math.round(totalProgress / phaseTasks.length);

    // تحديد حالة المرحلة بناءً على حالة المهام
    const completedTasks = phaseTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = phaseTasks.filter(t => t.status === 'in-progress').length;

    let phaseStatus: 'not-started' | 'in-progress' | 'completed' = 'not-started';

    if (completedTasks === phaseTasks.length) {
      phaseStatus = 'completed';
    } else if (inProgressTasks > 0 || completedTasks > 0) {
      phaseStatus = 'in-progress';
    }

    setPhases(prev => prev.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          progress: averageProgress,
          status: phaseStatus
        };
      }
      return phase;
    }));
  };

  // Manually save all pending changes
  const saveAllPendingChanges = async () => {
    if (pendingChanges.size === 0) {
      toast.success('No pending changes to save');
      return;
    }

    try {
      await savePendingChanges();
      toast.success('All changes saved successfully');
    } catch (error) {
      console.error('Error saving pending changes:', error);
      toast.error('Failed to save some changes');
    }
  };

  // Load daily achievements for a specific task
  const loadDailyAchievementsForTask = async (taskId: string) => {
    try {
      const { data: achievements, error } = await supabase
        .from('daily_achievements')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error loading daily achievements:', error);
        return;
      }

      if (achievements) {
        const transformedAchievements = achievements.map(ach => ({
          id: ach.id,
          date: ach.date,
          value: ach.value || 0,
          workHours: ach.work_hours || 0,
          notes: ach.notes,
          assignedMembers: ach.assigned_members || [],
          checkIn: ach.check_in_time ? {
            timestamp: ach.check_in_time,
            location: ach.check_in_location
          } : undefined,
          checkOut: ach.check_out_time ? {
            timestamp: ach.check_out_time,
            location: ach.check_out_location
          } : undefined,
          media: [], // Media will be handled separately if needed
          voiceNotes: [] // Voice notes will be handled separately if needed
        }));

        setTasks(prev => prev.map(task =>
          task.id === taskId
            ? { ...task, dailyAchievements: transformedAchievements }
            : task
        ));
      }
    } catch (error) {
      console.error('Error loading daily achievements for task:', error);
    }
  };

  // Get count of pending changes
  const getPendingChangesCount = () => {
    return pendingChanges.size;
  };

  // حساب الإحصائيات المحسنة - محسن للأداء
  const enhancedProjects = useMemo(() => {
    // تجنب إعادة الحساب إذا لم تتغير البيانات الأساسية
    if (!isDataLoaded) return projects;

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
          ? Math.round(projectTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / projectTasks.length)
          : 0
      };
    });
  }, [projects, tasks, phases, isDataLoaded]);

  const enhancedTasks = useMemo(() => {
    // تجنب إعادة الحساب إذا لم تتغير البيانات الأساسية
    if (!isDataLoaded) return tasks;

    return tasks.map(task => {
      const totalAchieved = (task.dailyAchievements || []).reduce((sum, achievement) => sum + (achievement.value || 0), 0);

      return {
        ...task,
        progress: task.progress || 0, // استخدام القيمة المحفوظة بدلاً من إعادة الحساب
        isOverdue: isAfter(new Date(), new Date(task.endDate)) && task.status !== 'completed',
        totalAchieved,
        // تحديث اسم الفريق المُكلف
        assignedToTeamName: teams.find(t => t.id === task.assignedToTeamId)?.name || 'غير محدد'
      };
    });
  }, [tasks, teams, isDataLoaded]);

  return (
    <DataContext.Provider value={{
      projects: enhancedProjects,
      teams,
      tasks: enhancedTasks,
      phases,
      activities,
      isLoading,
      isDataLoaded,
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
      getAllTeams,
      getProjectAnalytics,
      getTeamAnalytics,
      getDashboardStats,
      getTasksByTeam,
      getOverdueTasks,
      getRecentActivities,
      getPhasesByProject,
      getAllMembers,
      updateMember,
      logDailyAchievement,
      startTask,
      completeTask,
      calculateTaskProgress,
      getTaskRiskLevel,
      updatePhaseProgress,
      saveAllPendingChanges,
      loadDailyAchievementsForTask,
      getPendingChangesCount
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};