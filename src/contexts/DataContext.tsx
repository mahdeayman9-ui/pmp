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
      { id: '2', userId: '3', name: 'Mike Member', email: 'member@demo.com', role: 'member', joinedAt: subDays(new Date(), 15) }
    ],
    createdAt: subDays(new Date(), 30)
  },
  {
    id: '2',
    name: 'Design Team',
    description: 'UI/UX designers and visual artists',
    members: [
      { id: '3', userId: '2', name: 'Sarah Manager', email: 'manager@demo.com', role: 'lead', joinedAt: subDays(new Date(), 25) }
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
    assignedTo: ['1'],
    startDate: subDays(new Date(), 15),
    endDate: subDays(new Date(), 5),
    progress: 100,
    phaseId: '2',
    createdAt: subDays(new Date(), 15)
  },
  {
    id: '2',
    title: 'Design product catalog',
    description: 'Create responsive product listing and detail pages',
    status: 'in-progress',
    priority: 'high',
    assignedTo: ['3'],
    startDate: subDays(new Date(), 8),
    endDate: addDays(new Date(), 5),
    progress: 60,
    phaseId: '2',
    createdAt: subDays(new Date(), 8)
  },
  {
    id: '3',
    title: 'Implement shopping cart',
    description: 'Add to cart functionality and cart management',
    status: 'todo',
    priority: 'medium',
    assignedTo: ['1', '3'],
    startDate: new Date(),
    endDate: addDays(new Date(), 10),
    progress: 0,
    phaseId: '2',
    createdAt: subDays(new Date(), 3)
  }
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

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
      deleteTask
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