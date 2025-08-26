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
  assignedToUserId: string | null; // Changed: now assigns to individual user
  assignedToName?: string; // Helper field for display
  startDate: Date;
  endDate: Date;
  progress: number;
  phaseId: string;
  projectId: string; // Added: direct reference to project
  createdAt: Date;
  // Enhanced task tracking fields
  dailyAchievements?: DailyAchievement[];
  totalTarget?: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  plannedEffortHours?: number;
  actualEffortHours?: number;
}

export interface DailyAchievement {
  date: string; // ISO date string (YYYY-MM-DD)
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
  media?: MediaItem[];
  voiceNotes?: VoiceNote[];
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  timestamp: string;
}

export interface VoiceNote {
  audioUrl: string;
  timestamp: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}