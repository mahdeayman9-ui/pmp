import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend: string;
}

const colorClasses = {
  blue: 'bg-blue-500 text-blue-100',
  green: 'bg-green-500 text-green-100',
  purple: 'bg-purple-500 text-purple-100',
  orange: 'bg-orange-500 text-orange-100',
};

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{value}</p>
          <p className="text-sm text-green-600 mt-2 font-medium">{trend}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};