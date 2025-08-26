import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  FileText, Download, Calendar, Clock, Target, TrendingUp, 
  Users, AlertTriangle, CheckCircle, MapPin, Mic, Camera,
  Filter, RefreshCw, Eye
} from 'lucide-react';
import { format, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const Reports: React.FC = () => {
  const { tasks, teams, projects, getAllMembers } = useData();
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');

  // فلترة البيانات حسب الاختيارات
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (selectedTeam !== 'all') {
      const teamProjects = projects.filter(p => p.teamId === selectedTeam).map(p => p.id);
      filtered = filtered.filter(t => teamProjects.includes(t.projectId));
    }

    if (selectedProject !== 'all') {
      filtered = filtered.filter(t => t.projectId === selectedProject);
    }

    return filtered;
  }, [tasks, selectedTeam, selectedProject, projects]);

  // تقرير الإنتاجية اليومية
  const dailyProductivityReport = useMemo(() => {
    const dailyData = new Map();
    
    filteredTasks.forEach(task => {
      if (task.dailyAchievements) {
        task.dailyAchievements.forEach(achievement => {
          const date = achievement.date;
          if (!dailyData.has(date)) {
            dailyData.set(date, {
              date,
              totalAchievements: 0,
              tasksWorked: 0,
              totalCheckIns: 0,
              totalWorkHours: 0,
              mediaUploaded: 0,
              voiceNotes: 0
            });
          }
          
          const dayData = dailyData.get(date);
          dayData.totalAchievements += achievement.value || 0;
          dayData.tasksWorked += 1;
          dayData.totalCheckIns += achievement.checkIn ? 1 : 0;
          dayData.mediaUploaded += achievement.media?.length || 0;
          dayData.voiceNotes += achievement.voiceNotes?.length || 0;
          
          // حساب ساعات العمل
          if (achievement.checkIn && achievement.checkOut) {
            const duration = new Date(achievement.checkOut.timestamp).getTime() - 
                           new Date(achievement.checkIn.timestamp).getTime();
            dayData.totalWorkHours += duration / (1000 * 60 * 60);
          }
        });
      }
    });

    return Array.from(dailyData.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredTasks]);

  // تقرير أداء الفرق
  const teamPerformanceReport = useMemo(() => {
    const teamData = teams.map(team => {
      const teamProjects = projects.filter(p => p.teamId === team.id);
      const teamTasks = filteredTasks.filter(t => teamProjects.some(p => p.id === t.projectId));
      
      const completedTasks = teamTasks.filter(t => t.status === 'completed');
      const overdueTasks = teamTasks.filter(t => t.isOverdue);
      const totalAchievements = teamTasks.reduce((sum, task) => 
        sum + (task.dailyAchievements?.reduce((s, a) => s + (a.value || 0), 0) || 0), 0);
      
      const avgProgress = teamTasks.length > 0 
        ? teamTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / teamTasks.length 
        : 0;

      return {
        teamName: team.name,
        totalTasks: teamTasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        totalAchievements,
        avgProgress: Math.round(avgProgress),
        memberCount: team.members.length,
        efficiency: teamTasks.length > 0 ? Math.round((completedTasks.length / teamTasks.length) * 100) : 0
      };
    });

    return teamData;
  }, [teams, projects, filteredTasks]);

  // تقرير المهام عالية المخاطر
  const riskAnalysisReport = useMemo(() => {
    const riskData = {
      low: filteredTasks.filter(t => t.riskLevel === 'low').length,
      medium: filteredTasks.filter(t => t.riskLevel === 'medium').length,
      high: filteredTasks.filter(t => t.riskLevel === 'high').length,
      critical: filteredTasks.filter(t => t.riskLevel === 'critical').length
    };

    const riskTasks = filteredTasks
      .filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical')
      .map(task => ({
        taskTitle: task.title,
        projectName: projects.find(p => p.id === task.projectId)?.name || 'مشروع غير معروف',
        assignedTo: task.assignedToName || 'غير محدد',
        riskLevel: task.riskLevel,
        progress: task.progress || 0,
        daysOverdue: task.isOverdue ? differenceInDays(new Date(), new Date(task.endDate)) : 0
      }));

    return { riskData, riskTasks };
  }, [filteredTasks, projects]);

  // تقرير الحضور والانصراف
  const attendanceReport = useMemo(() => {
    const attendanceData = new Map();
    const members = getAllMembers();

    members.forEach(member => {
      const memberTasks = filteredTasks.filter(t => t.assignedToUserId === member.id);
      let totalCheckIns = 0;
      let totalWorkHours = 0;
      let daysWorked = 0;
      let overtimeHours = 0;

      memberTasks.forEach(task => {
        if (task.dailyAchievements) {
          task.dailyAchievements.forEach(achievement => {
            if (achievement.checkIn) {
              totalCheckIns++;
              daysWorked++;
              
              if (achievement.checkOut) {
                const duration = new Date(achievement.checkOut.timestamp).getTime() - 
                               new Date(achievement.checkIn.timestamp).getTime();
                const hours = duration / (1000 * 60 * 60);
                totalWorkHours += hours;
                
                // حساب الوقت الإضافي (أكثر من 8 ساعات)
                if (hours > 8) {
                  overtimeHours += hours - 8;
                }
              }
            }
          });
        }
      });

      attendanceData.set(member.id, {
        memberName: member.name,
        teamName: member.teamName,
        totalCheckIns,
        totalWorkHours: Math.round(totalWorkHours * 100) / 100,
        daysWorked,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        avgHoursPerDay: daysWorked > 0 ? Math.round((totalWorkHours / daysWorked) * 100) / 100 : 0
      });
    });

    return Array.from(attendanceData.values());
  }, [filteredTasks, getAllMembers]);

  // تقرير الوسائط والملاحظات الصوتية
  const mediaReport = useMemo(() => {
    let totalMedia = 0;
    let totalVoiceNotes = 0;
    let mediaByType = { image: 0, video: 0 };
    const mediaByTask = [];

    filteredTasks.forEach(task => {
      let taskMedia = 0;
      let taskVoiceNotes = 0;

      if (task.dailyAchievements) {
        task.dailyAchievements.forEach(achievement => {
          const mediaCount = achievement.media?.length || 0;
          const voiceCount = achievement.voiceNotes?.length || 0;
          
          taskMedia += mediaCount;
          taskVoiceNotes += voiceCount;
          totalMedia += mediaCount;
          totalVoiceNotes += voiceCount;

          achievement.media?.forEach(media => {
            mediaByType[media.type]++;
          });
        });
      }

      if (taskMedia > 0 || taskVoiceNotes > 0) {
        mediaByTask.push({
          taskTitle: task.title,
          projectName: projects.find(p => p.id === task.projectId)?.name || 'مشروع غير معروف',
          mediaCount: taskMedia,
          voiceNotesCount: taskVoiceNotes
        });
      }
    });

    return {
      totalMedia,
      totalVoiceNotes,
      mediaByType,
      mediaByTask: mediaByTask.sort((a, b) => (b.mediaCount + b.voiceNotesCount) - (a.mediaCount + a.voiceNotesCount))
    };
  }, [filteredTasks, projects]);

  // تقرير الإنجازات والأهداف
  const achievementsReport = useMemo(() => {
    const achievementData = filteredTasks.map(task => {
      const totalTarget = task.totalTarget || 0;
      const totalAchieved = task.dailyAchievements?.reduce((sum, a) => sum + (a.value || 0), 0) || 0;
      const completionRate = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;

      return {
        taskTitle: task.title,
        projectName: projects.find(p => p.id === task.projectId)?.name || 'مشروع غير معروف',
        assignedTo: task.assignedToName || 'غير محدد',
        totalTarget,
        totalAchieved,
        completionRate: Math.round(completionRate),
        status: task.status,
        daysRemaining: differenceInDays(new Date(task.endDate), new Date())
      };
    });

    const summary = {
      totalTasks: filteredTasks.length,
      completedTasks: filteredTasks.filter(t => t.status === 'completed').length,
      onTrackTasks: achievementData.filter(t => t.completionRate >= 80 && t.status !== 'completed').length,
      behindTasks: achievementData.filter(t => t.completionRate < 50 && t.status !== 'completed').length
    };

    return { achievementData, summary };
  }, [filteredTasks, projects]);

  const exportReport = (reportType: string) => {
    // هنا يمكن إضافة منطق تصدير التقرير
    console.log(`تصدير تقرير: ${reportType}`);
  };

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* إحصائيات عامة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي المهام</p>
              <p className="text-3xl font-bold text-blue-600">{filteredTasks.length}</p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">المهام المكتملة</p>
              <p className="text-3xl font-bold text-green-600">
                {filteredTasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">المهام المتأخرة</p>
              <p className="text-3xl font-bold text-red-600">
                {filteredTasks.filter(t => t.isOverdue).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">معدل الإنجاز</p>
              <p className="text-3xl font-bold text-purple-600">
                {filteredTasks.length > 0 
                  ? Math.round((filteredTasks.filter(t => t.status === 'completed').length / filteredTasks.length) * 100)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* الإنتاجية اليومية */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">الإنتاجية اليومية</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyProductivityReport.slice(-30)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'dd/MM')} />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), 'dd MMMM yyyy', { locale: ar })}
                formatter={(value, name) => [value, name === 'totalAchievements' ? 'إجمالي الإنجازات' : 'المهام المنجزة']}
              />
              <Area type="monotone" dataKey="totalAchievements" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="tasksWorked" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* أداء الفرق */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">أداء الفرق</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamPerformanceReport}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="teamName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="efficiency" fill="#3B82F6" name="الكفاءة %" />
              <Bar dataKey="avgProgress" fill="#10B981" name="متوسط التقدم %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderProductivityReport = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">تفاصيل الإنتاجية اليومية</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyProductivityReport}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'dd/MM')} />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), 'dd MMMM yyyy', { locale: ar })}
              />
              <Line type="monotone" dataKey="totalAchievements" stroke="#3B82F6" name="الإنجازات" />
              <Line type="monotone" dataKey="totalWorkHours" stroke="#10B981" name="ساعات العمل" />
              <Line type="monotone" dataKey="totalCheckIns" stroke="#F59E0B" name="مرات الحضور" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">توزيع ساعات العمل</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dailyProductivityReport.map(d => ({ name: d.date, value: d.totalWorkHours }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${format(new Date(name), 'dd/MM')}: ${value.toFixed(1)}س`}
                >
                  {dailyProductivityReport.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">الوسائط المرفوعة يومياً</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyProductivityReport}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'dd/MM')} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="mediaUploaded" fill="#8B5CF6" name="الوسائط" />
                <Bar dataKey="voiceNotes" fill="#06B6D4" name="التسجيلات الصوتية" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeamReport = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">مقارنة أداء الفرق</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={teamPerformanceReport}>
              <PolarGrid />
              <PolarAngleAxis dataKey="teamName" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="الكفاءة" dataKey="efficiency" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Radar name="التقدم" dataKey="avgProgress" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">تفاصيل أداء الفرق</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفريق</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجمالي المهام</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المكتملة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المتأخرة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإنجازات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكفاءة</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamPerformanceReport.map((team, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.teamName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.totalTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{team.completedTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{team.overdueTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{team.totalAchievements}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      team.efficiency >= 80 ? 'bg-green-100 text-green-800' :
                      team.efficiency >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {team.efficiency}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRiskReport = () => {
    const { riskData, riskTasks } = riskAnalysisReport;
    const pieData = [
      { name: 'منخفض', value: riskData.low, color: '#10B981' },
      { name: 'متوسط', value: riskData.medium, color: '#F59E0B' },
      { name: 'عالي', value: riskData.high, color: '#F97316' },
      { name: 'حرج', value: riskData.critical, color: '#EF4444' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">توزيع مستويات المخاطر</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">إحصائيات المخاطر</h3>
            <div className="space-y-4">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">المهام عالية المخاطر</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المهمة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المشروع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المُكلف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">مستوى المخاطر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التقدم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">أيام التأخير</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {riskTasks.map((task, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.taskTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.projectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignedTo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        task.riskLevel === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {task.riskLevel === 'critical' ? 'حرج' : 'عالي'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.progress}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {task.daysOverdue > 0 ? `${task.daysOverdue} يوم` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAttendanceReport = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">تقرير الحضور والانصراف</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفريق</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">أيام العمل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجمالي الساعات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">متوسط الساعات/يوم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوقت الإضافي</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceReport.map((member, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.memberName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.teamName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.daysWorked}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{member.totalWorkHours}س</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.avgHoursPerDay}س</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{member.overtimeHours}س</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">توزيع ساعات العمل حسب الموظف</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceReport}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="memberName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalWorkHours" fill="#3B82F6" name="إجمالي الساعات" />
              <Bar dataKey="overtimeHours" fill="#F59E0B" name="الوقت الإضافي" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderMediaReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الوسائط</p>
              <p className="text-3xl font-bold text-blue-600">{mediaReport.totalMedia}</p>
            </div>
            <Camera className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">التسجيلات الصوتية</p>
              <p className="text-3xl font-bold text-green-600">{mediaReport.totalVoiceNotes}</p>
            </div>
            <Mic className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">الصور</p>
              <p className="text-3xl font-bold text-purple-600">{mediaReport.mediaByType.image}</p>
              <p className="text-sm text-gray-500">الفيديوهات: {mediaReport.mediaByType.video}</p>
            </div>
            <Camera className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">الوسائط حسب المهمة</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المهمة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المشروع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوسائط</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التسجيلات الصوتية</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mediaReport.mediaByTask.map((task, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.taskTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.projectName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{task.mediaCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{task.voiceNotesCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {task.mediaCount + task.voiceNotesCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAchievementsReport = () => {
    const { achievementData, summary } = achievementsReport;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المهام</p>
                <p className="text-3xl font-bold text-blue-600">{summary.totalTasks}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المكتملة</p>
                <p className="text-3xl font-bold text-green-600">{summary.completedTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">على المسار الصحيح</p>
                <p className="text-3xl font-bold text-blue-600">{summary.onTrackTasks}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متأخرة</p>
                <p className="text-3xl font-bold text-red-600">{summary.behindTasks}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">تفاصيل الإنجازات والأهداف</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المهمة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المشروع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المُكلف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهدف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المُنجز</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نسبة الإنجاز</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {achievementData.map((task, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.taskTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.projectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignedTo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{task.totalTarget}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{task.totalAchieved}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(task.completionRate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{task.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status === 'completed' ? 'مكتملة' :
                         task.status === 'in-progress' ? 'قيد التنفيذ' : 'لم تبدأ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">توزيع معدلات الإنجاز</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={achievementData}>
                <CartesianGrid />
                <XAxis dataKey="totalTarget" name="الهدف" />
                <YAxis dataKey="totalAchieved" name="المُنجز" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="المهام" data={achievementData} fill="#3B82F6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const reportTypes = [
    { id: 'overview', name: 'نظرة عامة', icon: Eye },
    { id: 'productivity', name: 'الإنتاجية', icon: TrendingUp },
    { id: 'teams', name: 'أداء الفرق', icon: Users },
    { id: 'risks', name: 'تحليل المخاطر', icon: AlertTriangle },
    { id: 'attendance', name: 'الحضور والانصراف', icon: Clock },
    { id: 'media', name: 'الوسائط والتسجيلات', icon: Camera },
    { id: 'achievements', name: 'الإنجازات والأهداف', icon: Target }
  ];

  const renderReport = () => {
    switch (selectedReport) {
      case 'overview': return renderOverviewReport();
      case 'productivity': return renderProductivityReport();
      case 'teams': return renderTeamReport();
      case 'risks': return renderRiskReport();
      case 'attendance': return renderAttendanceReport();
      case 'media': return renderMediaReport();
      case 'achievements': return renderAchievementsReport();
      default: return renderOverviewReport();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">التقارير والتحليلات</h2>
          <p className="text-gray-600">تقارير شاملة ومفصلة من متتبع المهام</p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => exportReport(selectedReport)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 space-x-reverse"
          >
            <Download className="h-5 w-5" />
            <span>تصدير التقرير</span>
          </button>
        </div>
      </div>

      {/* فلاتر التقارير */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع التقرير</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الفترة الزمنية</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="quarter">هذا الربع</option>
              <option value="year">هذا العام</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الفريق</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الفرق</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع المشاريع</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* قائمة أنواع التقارير */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-wrap gap-2">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-colors ${
                  selectedReport === type.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{type.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* محتوى التقرير */}
      {renderReport()}
    </div>
  );
};