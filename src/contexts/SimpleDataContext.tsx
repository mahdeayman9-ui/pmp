import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { TeamsService } from '../services/teams.service';
import { ProjectsService } from '../services/projects.service';
import { TasksService } from '../services/tasks.service';
import { Team, Project, Task, Phase } from '../types/database';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface SimpleDataContextType {
  // State
  teams: Team[];
  projects: Project[];
  tasks: Task[];
  phases: Phase[];
  loading: boolean;

  // Actions
  refreshData: () => Promise<void>;
  createTeam: (team: { name: string; description: string }) => Promise<void>;
  createProject: (project: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    teamId: string;
  }) => Promise<void>;
  createTask: (task: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    phaseId: string;
    projectId: string;
    assignedToTeamId?: string;
  }) => Promise<void>;
}

const SimpleDataContext = createContext<SimpleDataContextType | undefined>(undefined);

export const SimpleDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [teamsData, projectsData, tasksData] = await Promise.all([
        TeamsService.getAll(),
        ProjectsService.getAll(),
        TasksService.getAll()
      ]);

      setTeams(teamsData);
      setProjects(projectsData);
      setTasks(tasksData);
      // Phases will be loaded when needed for specific projects
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (teamData: { name: string; description: string }) => {
    try {
      await TeamsService.create(teamData);
      await refreshData();
      toast.success('تم إنشاء الفريق بنجاح');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('فشل في إنشاء الفريق');
    }
  };

  const createProject = async (projectData: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    teamId: string;
  }) => {
    try {
      await ProjectsService.create(projectData);
      await refreshData();
      toast.success('تم إنشاء المشروع بنجاح');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('فشل في إنشاء المشروع');
    }
  };

  const createTask = async (taskData: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    phaseId: string;
    projectId: string;
    assignedToTeamId?: string;
  }) => {
    try {
      await TasksService.create(taskData);
      await refreshData();
      toast.success('تم إنشاء المهمة بنجاح');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('فشل في إنشاء المهمة');
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  return (
    <SimpleDataContext.Provider value={{
      teams,
      projects,
      tasks,
      phases,
      loading,
      refreshData,
      createTeam,
      createProject,
      createTask
    }}>
      {children}
    </SimpleDataContext.Provider>
  );
};

export const useSimpleData = () => {
  const context = useContext(SimpleDataContext);
  if (context === undefined) {
    throw new Error('useSimpleData must be used within a SimpleDataProvider');
  }
  return context;
};