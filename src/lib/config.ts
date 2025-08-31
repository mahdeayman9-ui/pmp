// Database configuration and constants
export const DB_CONFIG = {
  // Table names
  TABLES: {
    COMPANIES: 'companies',
    TEAMS: 'teams',
    PROFILES: 'profiles',
    TEAM_MEMBERS: 'team_members',
    PROJECTS: 'projects',
    PHASES: 'phases',
    TASKS: 'tasks',
    DAILY_ACHIEVEMENTS: 'daily_achievements'
  },

  // Default values
  DEFAULTS: {
    COMPANY_NAME: 'إدارة المشاريع',
    PRIMARY_COLOR: '#5f979d',
    SECONDARY_COLOR: '#b4e1e6',
    TASK_PRIORITY: 'medium',
    TASK_STATUS: 'todo',
    PROJECT_STATUS: 'planning',
    PHASE_STATUS: 'not-started',
    USER_ROLE: 'member',
    TEAM_MEMBER_ROLE: 'member'
  },

  // Status options
  STATUSES: {
    TASK: ['todo', 'in-progress', 'completed'],
    PROJECT: ['planning', 'in-progress', 'completed', 'on-hold'],
    PHASE: ['not-started', 'in-progress', 'completed'],
    USER: ['admin', 'manager', 'member'],
    TEAM_MEMBER: ['lead', 'member']
  },

  // Priority levels
  PRIORITIES: ['low', 'medium', 'high'],

  // Risk levels
  RISK_LEVELS: ['low', 'medium', 'high', 'critical']
};

// API endpoints (if needed for future API integration)
export const API_ENDPOINTS = {
  TEAMS: '/api/teams',
  PROJECTS: '/api/projects',
  TASKS: '/api/tasks',
  USERS: '/api/users'
};

// Cache configuration
export const CACHE_CONFIG = {
  TEAMS_TTL: 5 * 60 * 1000, // 5 minutes
  PROJECTS_TTL: 10 * 60 * 1000, // 10 minutes
  TASKS_TTL: 2 * 60 * 1000 // 2 minutes
};