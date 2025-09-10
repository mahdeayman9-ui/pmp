import React from 'react';
import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';

export const GanttChart: React.FC = () => {
  const { projects, teams, phases } = useData();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Filter phases based on selected project
  const filteredPhases = (selectedProjectId === 'all'
    ? phases
    : phases.filter(phase => phase.projectId === selectedProjectId))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  // Calculate the overall timeline from phases
  const allDates = filteredPhases.flatMap(p => [p.startDate, p.endDate]);
  if (allDates.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">مخطط جانت</h2>
          <p className="text-gray-600">عرض الجدول الزمني لمراحل المشاريع</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">جميع المشاريع</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">لا توجد مراحل متاحة لعرضها في مخطط جانت</p>
        </div>
      </div>
    );
  }

  const minDate = startOfMonth(new Date(Math.min(...allDates.map(d => d.getTime()))));
  const maxDate = endOfMonth(new Date(Math.max(...allDates.map(d => d.getTime()))));
  
  const timelineData = eachDayOfInterval({ start: minDate, end: maxDate });
  const totalDays = differenceInDays(maxDate, minDate) + 1;

  const getPhasePosition = (startDate: Date, endDate: Date) => {
    const startOffset = differenceInDays(startDate, minDate);
    const duration = differenceInDays(endDate, startDate) + 1;
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'on-hold':
        return 'bg-yellow-500';
      case 'planning':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتملة';
      case 'in-progress':
        return 'قيد التنفيذ';
      case 'not-started':
        return 'لم تبدأ';
      default:
        return status;
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'مشروع غير معروف';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">مخطط جانت</h2>
        <p className="text-gray-600">عرض الجدول الزمني لمراحل المشاريع</p>
      </div>

      {/* Project Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <label className="text-sm font-medium text-gray-700">فلترة حسب المشروع:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">جميع المشاريع</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Timeline Header */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <div className="w-80 px-4 py-3 font-medium text-gray-900 border-l border-gray-200">
              تفاصيل المرحلة
            </div>
            <div className="flex-1 relative">
              <div className="flex h-12">
                {timelineData.filter((_, index) => index % 7 === 0).map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 px-2 py-3 text-xs text-center text-gray-600 border-l border-gray-200"
                    style={{ minWidth: '100px' }}
                  >
                    {format(date, 'dd MMM', { locale: ar })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Phase Bars */}
        <div className="divide-y divide-gray-200">
          {filteredPhases.map((phase) => (
            <div key={phase.id} className="flex">
              <div className="w-80 px-4 py-4 border-l border-gray-200">
                <div>
                  <h3 className="font-medium text-gray-900">{phase.name}</h3>
                  <p className="text-sm text-gray-600">{getProjectName(phase.projectId)}</p>
                  <p className="text-sm text-gray-500">{phase.progress}% مكتملة</p>
                  <div className="flex items-center mt-1">
                    <span className={`inline-block w-2 h-2 rounded-full ml-2 ${getStatusColor(phase.status).replace('bg-', 'bg-')}`} />
                    <span className="text-xs text-gray-500">{getStatusText(phase.status)}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 relative py-4 px-2">
                <div className="relative h-8">
                  {/* Background bar */}
                  <div
                    className="absolute top-1 h-6 bg-gray-200 rounded"
                    style={getPhasePosition(phase.startDate, phase.endDate)}
                  />
                  
                  {/* Progress bar */}
                  <div
                    className={`absolute top-1 h-6 rounded transition-all duration-300 ${getStatusColor(phase.status)}`}
                    style={{
                      ...getPhasePosition(phase.startDate, phase.endDate),
                      width: `${((differenceInDays(phase.endDate, phase.startDate) + 1) / totalDays) * (phase.progress / 100) * 100}%`,
                    }}
                  />
                </div>
                
                {/* Phase info tooltip */}
                <div className="absolute top-12 left-2 text-xs text-gray-600">
                  {format(phase.startDate, 'dd MMM', { locale: ar })} - {format(phase.endDate, 'dd MMM yyyy', { locale: ar })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">مفتاح الألوان</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 rounded mr-2" />
            <span className="text-sm text-gray-600">المدة الإجمالية</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-500 rounded mr-2" />
            <span className="text-sm text-gray-600">لم تبدأ</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2" />
            <span className="text-sm text-gray-600">قيد التنفيذ</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2" />
            <span className="text-sm text-gray-600">مكتملة</span>
          </div>
        </div>
      </div>
    </div>
  );
};