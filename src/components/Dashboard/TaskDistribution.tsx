import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Task } from '../../types';

interface TaskDistributionProps {
  tasks: Task[];
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981'];

export const TaskDistribution: React.FC<TaskDistributionProps> = ({ tasks }) => {
  const todoTasks = tasks.filter(task => task.status === 'todo').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;

  const data = [
    { name: 'To Do', value: todoTasks },
    { name: 'In Progress', value: inProgressTasks },
    { name: 'Completed', value: completedTasks },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};