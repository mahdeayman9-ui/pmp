// Core database entity types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'member';
  teamId?: string;
  username?: string;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'lead' | 'member';
  joinedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  progress: number;
  teamId: string;
  phases: Phase[];
  createdAt: Date;
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  totalTarget?: number;
  startDate: Date;
  endDate: Date;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  projectId: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedToTeamId: string | null;
  assignedToTeamName?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  phaseId: string;
  projectId: string;
  createdAt: Date;
  totalTarget?: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  plannedEffortHours?: number;
  actualEffortHours?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  completionRate?: number;
  timeSpent?: number;
  isOverdue?: boolean;
  lastActivity?: Date;
}

// Supporting types
export interface DailyAchievement {
  date: string;
  value: number;
  checkIn?: {
    timestamp: string;
    location: {
      latitude: number;
      longitude: number;
    };
  };
  checkOut?: {
    timestamp: string;
    location: {
      latitude: number;
      longitude: number;
    };
  };
  workHours?: number;
  notes?: string;
}

export interface Activity {
  id: string;
  type: 'task_created' | 'task_completed' | 'project_started' | 'member_added';
  description: string;
  userId: string;
  userName: string;
  entityId: string;
  entityType: 'task' | 'project' | 'team';
  timestamp: Date;
}

// Analytics types
export interface ProjectAnalytics {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  teamProductivity: number;
  riskScore: number;
}

export interface TeamAnalytics {
  teamId: string;
  memberCount: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  averageTaskCompletion: number;
  workloadDistribution: { memberId: string; taskCount: number }[];
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalMembers: number;
  activeMembers: number;
  recentActivities: Activity[];
}

// Form types for creating/updating entities
export interface CreateTeamData {
  name: string;
  description: string;
  members?: TeamMember[];
}

export interface CreateProjectData {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  teamId: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  phaseId: string;
  projectId: string;
  assignedToTeamId?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface CreatePhaseData {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  projectId: string;
  totalTarget?: number;
}