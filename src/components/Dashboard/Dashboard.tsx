import React from 'react';
import { useData } from '../../contexts/DataContext';
import { StatsCard } from './StatsCard';
import { ProjectProgress } from './ProjectProgress';
import { TaskDistribution } from './TaskDistribution';
import { FolderKanban, Users, CheckSquare, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { projects, teams, tasks } = useData();

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressProjects = projects.filter(project => project.status === 'in-progress').length;
  const totalMembers = teams.reduce((acc, team) => acc + team.members.length, 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Projects"
          value={projects.length}
          icon={FolderKanban}
          color="blue"
          trend="+12%"
        />
        <StatsCard
          title="Active Teams"
          value={teams.length}
          icon={Users}
          color="green"
          trend="+5%"
        />
        <StatsCard
          title="Completed Tasks"
          value={completedTasks}
          icon={CheckSquare}
          color="purple"
          trend="+18%"
        />
        <StatsCard
          title="In Progress"
          value={inProgressProjects}
          icon={TrendingUp}
          color="orange"
          trend="+8%"
        />
      </div>

      {/* Charts and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectProgress projects={projects} />
        <TaskDistribution tasks={tasks} />
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
        <div className="space-y-4">
          {projects.slice(0, 3).map((project) => (
            <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{project.name}</h4>
                <p className="text-sm text-gray-600">{project.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12">
                  {project.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};