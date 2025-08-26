export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'member';
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
  startDate: Date;
  endDate: Date;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  tasks: Task[];
  projectId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string[];
  startDate: Date;
  endDate: Date;
  progress: number;
  phaseId: string;
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}