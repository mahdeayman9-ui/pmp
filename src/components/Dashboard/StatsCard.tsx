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
  blue: 'bg-gradient-to-br from-accent-dark to-primary-600 text-white',
  green: 'bg-green-500 text-green-100',
  purple: 'bg-purple-500 text-purple-100',
  orange: 'bg-orange-500 text-orange-100',
};

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  return (
    <div className="card-professional p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-accent-dark/80">{title}</p>
          <p className="text-3xl font-semibold gradient-text mt-2">{value}</p>
          <p className="text-sm text-green-600 mt-2 font-medium">{trend}</p>
        </div>
        <div className={`p-3 rounded-lg shadow-soft ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};