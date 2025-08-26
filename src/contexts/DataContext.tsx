import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, Phase, Task, Team } from '../types';
import { addDays, subDays } from 'date-fns';

interface DataContextType {
  projects: Project[];
  teams: Team[];
  tasks: Task[];
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTeam: (team: Omit<Team, 'id' | 'createdAt'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getAllMembers: () => Array<{ id: string; name: string; email: string; teamId: string; teamName: string; role: string }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data
const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Development Team',
    description: 'Frontend and backend developers',
    members: [
      { id: '1', userId: '1', name: 'John Admin', email: 'admin@demo.com', role: 'lead', joinedAt: subDays(new Date(), 30) },
      { id: '2', userId: '3', name: 'Mike Member', email: 'member@demo.com', role: 'member', joinedAt: subDays(new Date(), 15) },
      { id: '4', userId: '4', name: 'Alice Developer', email: 'alice@demo.com', role: 'member', joinedAt: subDays(new Date(), 20) }
    ],
    createdAt: subDays(new Date(), 30)
  },
  {
    id: '2',
    name: 'Design Team',
    description: 'UI/UX designers and visual artists',
    members: [
      { id: '3', userId: '2', name: 'Sarah Manager', email: 'manager@demo.com', role: 'lead', joinedAt: subDays(new Date(), 25) },
      { id: '5', userId: '5', name: 'Bob Designer', email: 'bob@demo.com', role: 'member', joinedAt: subDays(new Date(), 12) }
    ],
    createdAt: subDays(new Date(), 25)
  }
];

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'E-commerce Platform',
    description: 'Building a modern e-commerce platform with React and Node.js',
    startDate: subDays(new Date(), 20),
    endDate: addDays(new Date(), 40),
    status: 'in-progress',
    progress: 65,
    teamId: '1',
    phases: [
      {
        id: '1',
        name: 'Planning & Design',
        description: 'Initial planning and UI/UX design phase',
        startDate: subDays(new Date(), 20),
        endDate: subDays(new Date(), 10),
        status: 'completed',
        progress: 100,
        tasks: [],
        projectId: '1'
      },
      {
        id: '2',
        name: 'Development',
        description: 'Core development phase',
        startDate: subDays(new Date(), 10),
        endDate: addDays(new Date(), 20),
        status: 'in-progress',
        progress: 70,
        tasks: [],
        projectId: '1'
      },
      {
        id: '3',
        name: 'Testing & Deployment',
        description: 'Testing and deployment phase',
        startDate: addDays(new Date(), 20),
        endDate: addDays(new Date(), 40),
        status: 'not-started',
        progress: 0,
        tasks: [],
        projectId: '1'
      }
    ],
    createdAt: subDays(new Date(), 20)
  },
  {
    id: '2',
    name: 'Mobile App Redesign',
    description: 'Complete redesign of the mobile application',
    startDate: subDays(new Date(), 10),
    endDate: addDays(new Date(), 30),
    status: 'in-progress',
    progress: 35,
    teamId: '2',
    phases: [
      {
        id: '4',
        name: 'Research',
        description: 'User research and competitor analysis',
        startDate: subDays(new Date(), 10),
        endDate: new Date(),
        status: 'in-progress',
        progress: 80,
        tasks: [],
        projectId: '2'
      },
      {
        id: '5',
        name: 'Design Phase',
        description: 'Create new UI/UX designs',
        startDate: new Date(),
        endDate: addDays(new Date(), 15),
        status: 'not-started',
        progress: 0,
        tasks: [],
        projectId: '2'
      }
    ],
    createdAt: subDays(new Date(), 10)
  }
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Create user authentication system',
    description: 'Implement login, logout, and user management',
    status: 'completed',
    priority: 'high',
    assignedToUserId: '1',
    assignedToName: 'John Admin',
    startDate: subDays(new Date(), 15),
    endDate: subDays(new Date(), 5),
    progress: 100,
    phaseId: '2',
    projectId: '1',
    createdAt: subDays(new Date(), 15)
  },
  {
    id: '2',
    title: 'Design product catalog',
    description: 'Create responsive product listing and detail pages',
    status: 'in-progress',
    priority: 'high',
    assignedToUserId: '4',
    assignedToName: 'Alice Developer',
    startDate: subDays(new Date(), 8),
    endDate: addDays(new Date(), 5),
    progress: 60,
    phaseId: '2',
    projectId: '1',
    createdAt: subDays(new Date(), 8)
  },
  {
    id: '3',
    title: 'Implement shopping cart',
    description: 'Add to cart functionality and cart management',
    status: 'todo',
    priority: 'medium',
    assignedToUserId: '3',
    assignedToName: 'Mike Member',
    startDate: new Date(),
    endDate: addDays(new Date(), 10),
    progress: 0,
    phaseId: '2',
    projectId: '1',
    createdAt: subDays(new Date(), 3)
  },
  {
    id: '4',
    title: 'User research interviews',
    description: 'Conduct interviews with target users',
    status: 'completed',
    priority: 'high',
    assignedToUserId: '2',
    assignedToName: 'Sarah Manager',
    startDate: subDays(new Date(), 10),
    endDate: subDays(new Date(), 3),
    progress: 100,
    phaseId: '4',
    projectId: '2',
    createdAt: subDays(new Date(), 10)
  },
  {
    id: '5',
    title: 'Competitor analysis',
    description: 'Analyze competitor mobile apps and features',
    status: 'in-progress',
    priority: 'medium',
    assignedToUserId: '5',
    assignedToName: 'Bob Designer',
    startDate: subDays(new Date(), 5),
    endDate: addDays(new Date(), 2),
    progress: 75,
    phaseId: '4',
    projectId: '2',
    createdAt: subDays(new Date(), 5)
  }
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const getAllMembers = () => {
    return teams.flatMap(team => 
      team.members.map(member => ({
        id: member.userId,
        name: member.name,
        email: member.email,
        teamId: team.id,
        teamName: team.name,
        role: member.role
      }))
    );
  };

  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    // Also delete related tasks
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
    // Also delete related projects and tasks
    const projectsToDelete = projects.filter(p => p.teamId === id).map(p => p.id);
    setProjects(prev => prev.filter(p => p.teamId !== id));
    setTasks(prev => prev.filter(t => !projectsToDelete.includes(t.projectId)));
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <DataContext.Provider value={{
      projects,
      teams,
      tasks,
      addProject,
      updateProject,
      deleteProject,
      addTeam,
      updateTeam,
      deleteTeam,
      addTask,
      updateTask,
      deleteTask,
      getAllMembers
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