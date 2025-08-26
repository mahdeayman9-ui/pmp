import React from 'react';
import { useData } from '../../contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export const Analytics: React.FC = () => {
  const { projects, tasks, teams } = useData();

  // Project status distribution
  const projectStatusData = [
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length },
    { name: 'In Progress', value: projects.filter(p => p.status === 'in-progress').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length },
    { name: 'On Hold', value: projects.filter(p => p.status === 'on-hold').length },
  ].filter(item => item.value > 0);

  // Task completion trend (mock data for demonstration)
  const taskTrendData = [
    { month: 'Jan', completed: 12, created: 15 },
    { month: 'Feb', completed: 18, created: 20 },
    { month: 'Mar', completed: 25, created: 28 },
    { month: 'Apr', completed: 22, created: 25 },
    { month: 'May', completed: 30, created: 32 },
    { month: 'Jun', completed: 35, created: 38 },
  ];

  // Team productivity
  const teamProductivityData = teams.map(team => {
    const teamProjects = projects.filter(p => p.teamId === team.id);
    const avgProgress = teamProjects.length > 0 
      ? teamProjects.reduce((acc, p) => acc + p.progress, 0) / teamProjects.length 
      : 0;
    
    return {
      name: team.name,
      productivity: Math.round(avgProgress),
      projects: teamProjects.length,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-600">Insights and metrics for your projects and teams</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <div className="w-6 h-6 bg-blue-500 rounded" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Progress</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)}%
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <div className="w-6 h-6 bg-green-500 rounded" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <div className="w-6 h-6 bg-purple-500 rounded" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-3xl font-bold text-gray-900">
                {teams.reduce((acc, team) => acc + team.members.length, 0)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <div className="w-6 h-6 bg-orange-500 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Productivity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Productivity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamProductivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="productivity" fill="#3B82F6" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Task Completion Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={taskTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={3} />
              <Line type="monotone" dataKey="created" stroke="#3B82F6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center mt-4 space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2" />
            <span className="text-sm text-gray-600">Tasks Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2" />
            <span className="text-sm text-gray-600">Tasks Created</span>
          </div>
        </div>
      </div>
    </div>
  );
};