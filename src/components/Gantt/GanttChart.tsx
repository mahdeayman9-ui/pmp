import React from 'react';
import { useData } from '../../contexts/DataContext';
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export const GanttChart: React.FC = () => {
  const { projects, teams } = useData();

  // Calculate the overall timeline
  const allDates = projects.flatMap(p => [p.startDate, p.endDate]);
  if (allDates.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gantt Chart</h2>
          <p className="text-gray-600">Project timeline and progress visualization</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No projects available to display in Gantt chart</p>
        </div>
      </div>
    );
  }

  const minDate = startOfMonth(new Date(Math.min(...allDates.map(d => d.getTime()))));
  const maxDate = endOfMonth(new Date(Math.max(...allDates.map(d => d.getTime()))));
  
  const timelineData = eachDayOfInterval({ start: minDate, end: maxDate });
  const totalDays = differenceInDays(maxDate, minDate) + 1;

  const getProjectPosition = (startDate: Date, endDate: Date) => {
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

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gantt Chart</h2>
        <p className="text-gray-600">Project timeline and progress visualization</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Timeline Header */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <div className="w-80 px-4 py-3 font-medium text-gray-900 border-r border-gray-200">
              Project Details
            </div>
            <div className="flex-1 relative">
              <div className="flex h-12">
                {timelineData.filter((_, index) => index % 7 === 0).map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 px-2 py-3 text-xs text-center text-gray-600 border-r border-gray-200"
                    style={{ minWidth: '100px' }}
                  >
                    {format(date, 'MMM dd')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Project Bars */}
        <div className="divide-y divide-gray-200">
          {projects.map((project) => (
            <div key={project.id} className="flex">
              <div className="w-80 px-4 py-4 border-r border-gray-200">
                <div>
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-600">{getTeamName(project.teamId)}</p>
                  <p className="text-sm text-gray-500">{project.progress}% complete</p>
                  <div className="flex items-center mt-1">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getStatusColor(project.status).replace('bg-', 'bg-')}`} />
                    <span className="text-xs text-gray-500 capitalize">{project.status.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 relative py-4 px-2">
                <div className="relative h-8">
                  {/* Background bar */}
                  <div
                    className="absolute top-1 h-6 bg-gray-200 rounded"
                    style={getProjectPosition(project.startDate, project.endDate)}
                  />
                  
                  {/* Progress bar */}
                  <div
                    className={`absolute top-1 h-6 rounded transition-all duration-300 ${getStatusColor(project.status)}`}
                    style={{
                      ...getProjectPosition(project.startDate, project.endDate),
                      width: `${((differenceInDays(project.endDate, project.startDate) + 1) / totalDays) * (project.progress / 100) * 100}%`,
                    }}
                  />
                  
                  {/* Project phases */}
                  {project.phases.map((phase, index) => {
                    const phasePosition = getProjectPosition(phase.startDate, phase.endDate);
                    return (
                      <div
                        key={phase.id}
                        className="absolute top-0 h-2 bg-indigo-400 rounded-sm"
                        style={phasePosition}
                        title={`${phase.name}: ${phase.progress}%`}
                      />
                    );
                  })}
                </div>
                
                {/* Project info tooltip */}
                <div className="absolute top-12 left-2 text-xs text-gray-600">
                  {format(project.startDate, 'MMM dd')} - {format(project.endDate, 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 rounded mr-2" />
            <span className="text-sm text-gray-600">Total Duration</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-500 rounded mr-2" />
            <span className="text-sm text-gray-600">Planning</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2" />
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2" />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2" />
            <span className="text-sm text-gray-600">On Hold</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-2 bg-indigo-400 rounded-sm mr-2" />
            <span className="text-sm text-gray-600">Project Phases</span>
          </div>
        </div>
      </div>
    </div>
  );
};