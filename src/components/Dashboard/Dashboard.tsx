import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { StatsCard } from './StatsCard';
import { ProjectProgress } from './ProjectProgress';
import { TaskDistribution } from './TaskDistribution';
import { FolderKanban, Users, CheckSquare, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const Dashboard: React.FC = React.memo(() => {
  const { getDashboardStats, getRecentActivities, getOverdueTasks, projects, tasks } = useData();

  // تحسين الأداء باستخدام useMemo للعمليات المكلفة
  const stats = useMemo(() => getDashboardStats(), [getDashboardStats]);
  const recentActivities = useMemo(() => getRecentActivities(5), [getRecentActivities]);
  const overdueTasks = useMemo(() => getOverdueTasks(), [getOverdueTasks]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'task_created':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'project_started':
        return <FolderKanban className="h-4 w-4 text-purple-600" />;
      case 'member_added':
        return <Users className="h-4 w-4 text-indigo-600" />;
      case 'achievement_logged':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="إجمالي المشاريع"
          value={stats.totalProjects}
          icon={FolderKanban}
          color="blue"
          trend="+12%"
        />
        <StatsCard
          title="المشاريع النشطة"
          value={stats.activeProjects}
          icon={TrendingUp}
          color="green"
          trend="+5%"
        />
        <StatsCard
          title="المهام المكتملة"
          value={stats.completedTasks}
          icon={CheckSquare}
          color="purple"
          trend="+18%"
        />
        <StatsCard
          title="المهام المتأخرة"
          value={stats.overdueTasks}
          icon={AlertTriangle}
          color="orange"
          trend={stats.overdueTasks > 0 ? "تحتاج متابعة" : "ممتاز"}
        />
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectProgress projects={projects} />
        <TaskDistribution tasks={tasks} />
      </div>

      {/* الأنشطة الحديثة والمهام المتأخرة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الأنشطة الحديثة */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الأنشطة الحديثة</h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 space-x-reverse">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>{activity.userName}</span>
                      <span className="mx-2">•</span>
                      <span>{format(activity.timestamp, 'dd MMM yyyy، HH:mm', { locale: ar })}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">لا توجد أنشطة حديثة</p>
            )}
          </div>
        </div>

        {/* المهام المتأخرة */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 ml-2" />
            المهام المتأخرة
          </h3>
          <div className="space-y-3">
            {overdueTasks.length > 0 ? (
              overdueTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-900">{task.title}</h4>
                      <p className="text-sm text-red-700">
                        مُكلف للفريق: {task.assignedToTeamName || 'غير محدد'}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-red-600">
                        تاريخ الانتهاء: {format(task.endDate, 'dd MMM', { locale: ar })}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="w-16 bg-red-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-red-600 mr-2">{task.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <CheckSquare className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 font-medium">ممتاز! لا توجد مهام متأخرة</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ملخص الفرق */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ملخص الأداء</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.activeMembers}</div>
            <div className="text-sm text-gray-600">الأعضاء النشطون</div>
            <div className="text-xs text-gray-500 mt-1">من أصل {stats.totalMembers} عضو</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">معدل إكمال المهام</div>
            <div className="text-xs text-gray-500 mt-1">{stats.completedTasks} من {stats.totalTasks}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {stats.totalProjects > 0 ? Math.round((stats.activeProjects / stats.totalProjects) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">المشاريع النشطة</div>
            <div className="text-xs text-gray-500 mt-1">{stats.activeProjects} من {stats.totalProjects}</div>
          </div>
        </div>
      </div>
    </div>
  );
});