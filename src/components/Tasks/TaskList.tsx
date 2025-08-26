import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Filter, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { TaskModal } from './TaskModal';

export const TaskList: React.FC = () => {
  const { tasks, projects, teams } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTasks = tasks.filter(task => 
    statusFilter === 'all' || task.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectName = (phaseId: string) => {
    for (const project of projects) {
      for (const phase of project.phases) {
        if (phase.id === phaseId) {
          return `${project.name} - ${phase.name}`;
        }
      }
    }
    return 'Unknown Project';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-gray-600">Manage and track all your tasks</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Tasks</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                    {task.status.replace('-', ' ')}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority} priority
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{task.description}</p>
                <div className="text-sm text-gray-500">
                  <span>{getProjectName(task.phaseId)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {format(task.startDate, 'MMM dd')} - {format(task.endDate, 'MMM dd, yyyy')}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <User className="h-4 w-4 mr-2" />
                <span>{task.assignedTo.length} assignee(s)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Progress</span>
                <span className="text-sm font-medium text-gray-900">{task.progress}%</span>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};