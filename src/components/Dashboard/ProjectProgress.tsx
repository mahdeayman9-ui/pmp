import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Project } from '../../types';

interface ProjectProgressProps {
  projects: Project[];
}

export const ProjectProgress: React.FC<ProjectProgressProps> = ({ projects }) => {
  const data = projects.map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    progress: project.progress,
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">تقدم المشاريع</h3>
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="progress" fill="#3B82F6" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>لا توجد مشاريع لعرضها</p>
          </div>
        )}
      </div>
    </div>
  );
};