import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { canAccessFinancialPages } from '../../utils/permissions';
import {
  Chart as ChartJS,
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import RevenueModal from './RevenueModal';
import CostModal from './CostModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend
);

console.log('📊 Chart.js تم تحميله بنجاح:', ChartJS);

interface RevenueData {
  id: string;
  item: string;
  planned_revenue: number;
  actual_revenue: number;
  planned_date: string | null;
  actual_date: string | null;
  amount_variance: number;
  days_variance: number;
  collection_status: boolean;
  created_at: string;
}

interface CostData {
  id: string;
  item: string;
  planned_cost: number;
  actual_cost: number;
  planned_date: string | null;
  actual_date: string | null;
  amount_variance: number;
  days_variance: number;
  created_at: string;
}

const Page2: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useData();

  // Check if user can access financial pages
  if (!canAccessFinancialPages(user?.teamId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-soft border border-primary-200/30 p-8 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">غير مسموح بالوصول</h1>
            <p className="text-gray-600">ليس لديك صلاحية للوصول إلى صفحة التخطيط والإدارة المالية.</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('🔄 Page2 component mounted');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [costData, setCostData] = useState<CostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'revenue' | 'cost'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchRevenue, setSearchRevenue] = useState('');
  const [searchCost, setSearchCost] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Modal states
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<RevenueData | null>(null);
  const [editingCost, setEditingCost] = useState<CostData | null>(null);

  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const costChartRef = useRef<HTMLCanvasElement>(null);
  const varianceChartRef = useRef<HTMLCanvasElement>(null);

  const revenueChart = useRef<Chart | null>(null);
  const costChart = useRef<Chart | null>(null);
  const varianceChart = useRef<Chart | null>(null);

  // Load data from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 بدء تحميل البيانات...');
      console.log('👤 المستخدم الحالي:', user);

      // Check if user is authenticated
      if (!user) {
        console.warn('⚠️ المستخدم غير مصدق عليه');
        setError('يرجى تسجيل الدخول أولاً لعرض البيانات.');
        return;
      }

      // Get user's company ID
      console.log('🔍 جاري البحث عن ملف المستخدم...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ خطأ في ملف المستخدم:', profileError);
        setError('لم يتم العثور على ملف المستخدم. يرجى تسجيل الدخول مرة أخرى.');
        return;
      }

      console.log('✅ تم العثور على الملف الشخصي:', profile);
      const companyId = profile?.company_id;

      if (!companyId) {
        console.warn('⚠️ لم يتم العثور على شركة مرتبطة بالمستخدم');
        setError('لم يتم العثور على شركة مرتبطة بحسابك. يرجى التواصل مع الإدارة.');
        return;
      }

      console.log('🏢 معرف الشركة:', companyId);

      // Load revenue data
      console.log('📊 جاري تحميل بيانات الإيرادات...');
      let revenueQuery = supabase
        .from('revenues')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      // Filter by project if selected
      if (selectedProjectId) {
        revenueQuery = revenueQuery.eq('project_id', selectedProjectId);
      }

      const { data: revenue, error: revenueError } = await revenueQuery;

      if (revenueError) {
        console.error('❌ خطأ في بيانات الإيرادات:', revenueError);
        if (revenueError.code === 'PGRST116') {
          setError('جدول الإيرادات غير متوفر. يرجى التواصل مع الإدارة لإعداد قاعدة البيانات.');
        } else if (revenueError.code === '42P01') {
          setError('جدول الإيرادات غير موجود. يرجى إنشاء الجداول المطلوبة أولاً.');
        } else {
          setError(`حدث خطأ أثناء تحميل بيانات الإيرادات: ${revenueError.message}`);
        }
        return;
      }

      console.log('✅ تم تحميل بيانات الإيرادات:', revenue?.length || 0, 'سجل');

      // Load cost data
      console.log('📊 جاري تحميل بيانات التكاليف...');
      let costQuery = supabase
        .from('costs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      // Filter by project if selected
      if (selectedProjectId) {
        costQuery = costQuery.eq('project_id', selectedProjectId);
      }

      const { data: costs, error: costError } = await costQuery;

      if (costError) {
        console.error('❌ خطأ في بيانات التكاليف:', costError);
        if (costError.code === 'PGRST116') {
          setError('جدول التكاليف غير متوفر. يرجى التواصل مع الإدارة لإعداد قاعدة البيانات.');
        } else if (costError.code === '42P01') {
          setError('جدول التكاليف غير موجود. يرجى إنشاء الجداول المطلوبة أولاً.');
        } else {
          setError(`حدث خطأ أثناء تحميل بيانات التكاليف: ${costError.message}`);
        }
        return;
      }

      console.log('✅ تم تحميل بيانات التكاليف:', costs?.length || 0, 'سجل');

      setRevenueData(revenue || []);
      setCostData(costs || []);

      // Update charts with real data only
      const finalRevenue = revenue || [];
      const finalCosts = costs || [];

      console.log('📈 جاري تحديث الرسوم البيانية بالبيانات الحقيقية...');
      updateCharts(finalRevenue, finalCosts);

      console.log('🎉 تم تحميل البيانات بنجاح!');
    } catch (err: any) {
      console.error('💥 خطأ عام في تحميل البيانات:', err);
      setError(`حدث خطأ أثناء تحميل البيانات: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  // Update charts
  const updateCharts = (revenue: RevenueData[], costs: CostData[]) => {
    try {
      console.log('📊 تحديث الرسوم البيانية...');
      console.log('📈 بيانات الإيرادات:', revenue.length, 'عنصر');
      console.log('📉 بيانات التكاليف:', costs.length, 'عنصر');

      // Revenue Chart
      if (revenueChartRef.current) {
        console.log('📈 إنشاء رسم بياني الإيرادات...');
        if (revenueChart.current) {
          revenueChart.current.destroy();
          revenueChart.current = null;
        }

        const ctx = revenueChartRef.current.getContext('2d');
        if (ctx) {
          // Clear the canvas before creating new chart
          ctx.clearRect(0, 0, revenueChartRef.current.width, revenueChartRef.current.height);

          console.log('📊 إنشاء رسم بياني الإيرادات مع البيانات:', {
            labels: revenue.map(item => item.item || 'غير محدد'),
            plannedData: revenue.map(item => item.planned_revenue || 0),
            actualData: revenue.map(item => item.actual_revenue || 0)
          });

          revenueChart.current = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: revenue.map(item => item.item || 'غير محدد'),
              datasets: [
                {
                  label: 'الإيرادات المخططة',
                  data: revenue.map(item => item.planned_revenue || 0),
                  backgroundColor: 'rgba(95, 151, 157, 0.5)',
                  borderColor: 'rgba(95, 151, 157, 1)',
                  borderWidth: 1
                },
                {
                  label: 'الإيرادات الفعلية',
                  data: revenue.map(item => item.actual_revenue || 0),
                  backgroundColor: 'rgba(67, 160, 71, 0.5)',
                  borderColor: 'rgba(67, 160, 71, 1)',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value: any) {
                      return Number(value).toLocaleString('ar-EG');
                    }
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context: any) {
                      return context.dataset.label + ': ' + Number(context.raw || 0).toLocaleString('ar-EG');
                    }
                  }
                }
              }
            }
          });
          console.log('✅ تم إنشاء رسم بياني الإيرادات بنجاح');
        } else {
          console.warn('⚠️ تعذر الحصول على سياق الرسم البياني للإيرادات');
        }
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء رسم بياني الإيرادات:', error);
    }

    try {
      // Cost Chart
      if (costChartRef.current) {
        console.log('📈 إنشاء رسم بياني التكاليف...');
        if (costChart.current) {
          costChart.current.destroy();
          costChart.current = null;
        }

        const ctx = costChartRef.current.getContext('2d');
        if (ctx) {
          // Clear the canvas before creating new chart
          ctx.clearRect(0, 0, costChartRef.current.width, costChartRef.current.height);

          costChart.current = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: costs.map(item => item.item || 'غير محدد'),
              datasets: [
                {
                  label: 'التكاليف المخططة',
                  data: costs.map(item => item.planned_cost || 0),
                  backgroundColor: 'rgba(95, 151, 157, 0.5)',
                  borderColor: 'rgba(95, 151, 157, 1)',
                  borderWidth: 1
                },
                {
                  label: 'التكاليف الفعلية',
                  data: costs.map(item => item.actual_cost || 0),
                  backgroundColor: 'rgba(229, 57, 53, 0.5)',
                  borderColor: 'rgba(229, 57, 53, 1)',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value: any) {
                      return Number(value).toLocaleString('ar-EG');
                    }
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context: any) {
                      return context.dataset.label + ': ' + Number(context.raw || 0).toLocaleString('ar-EG');
                    }
                  }
                }
              }
            }
          });
          console.log('✅ تم إنشاء رسم بياني التكاليف بنجاح');
        } else {
          console.warn('⚠️ تعذر الحصول على سياق الرسم البياني للتكاليف');
        }
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء رسم بياني التكاليف:', error);
    }

    try {
      // Variance Chart
      if (varianceChartRef.current) {
        console.log('📈 إنشاء رسم بياني الانحرافات...');
        if (varianceChart.current) {
          varianceChart.current.destroy();
          varianceChart.current = null;
        }

        const ctx = varianceChartRef.current.getContext('2d');
        if (ctx) {
          // Clear the canvas before creating new chart
          ctx.clearRect(0, 0, varianceChartRef.current.width, varianceChartRef.current.height);

          varianceChart.current = new Chart(ctx, {
            type: 'line',
            data: {
              labels: [...revenue.map(item => item.item || 'غير محدد'), ...costs.map(item => item.item || 'غير محدد')],
              datasets: [
                {
                  label: 'انحراف الإيرادات',
                  data: [...revenue.map(item => item.amount_variance || 0), ...Array(costs.length).fill(null)],
                  backgroundColor: 'rgba(67, 160, 71, 0.2)',
                  borderColor: 'rgba(67, 160, 71, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(67, 160, 71, 1)',
                  tension: 0.3
                },
                {
                  label: 'انحراف التكاليف',
                  data: [...Array(revenue.length).fill(null), ...costs.map(item => item.amount_variance || 0)],
                  backgroundColor: 'rgba(229, 57, 53, 0.2)',
                  borderColor: 'rgba(229, 57, 53, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(229, 57, 53, 1)',
                  tension: 0.3
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  ticks: {
                    callback: function(value: any) {
                      return Number(value).toLocaleString('ar-EG');
                    }
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context: any) {
                      return context.dataset.label + ': ' + Number(context.raw || 0).toLocaleString('ar-EG');
                    }
                  }
                }
              }
            }
          });
          console.log('✅ تم إنشاء رسم بياني الانحرافات بنجاح');
        } else {
          console.warn('⚠️ تعذر الحصول على سياق الرسم البياني للانحرافات');
        }
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء رسم بياني الانحرافات:', error);
    }

    console.log('🎉 تم تحديث جميع الرسوم البيانية بنجاح');
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalPlannedRevenue = revenueData.reduce((sum, item) => sum + item.planned_revenue, 0);
    const totalActualRevenue = revenueData.reduce((sum, item) => sum + item.actual_revenue, 0);
    const revenueVariance = totalActualRevenue - totalPlannedRevenue;
    const revenueVariancePercent = totalPlannedRevenue > 0 ? (revenueVariance / totalPlannedRevenue * 100).toFixed(2) : '0';

    // New calculations for collection metrics
    const totalActualRevenueSum = revenueData.reduce((sum, item) => sum + item.actual_revenue, 0);
    const collections = revenueData
      .filter(item => item.collection_status)
      .reduce((sum, item) => sum + item.actual_revenue, 0);
    const remainingAmount = totalActualRevenueSum - collections;

    const totalPlannedCost = costData.reduce((sum, item) => sum + item.planned_cost, 0);
    const totalActualCost = costData.reduce((sum, item) => sum + item.actual_cost, 0);
    const costVariance = totalActualCost - totalPlannedCost;
    const costVariancePercent = totalPlannedCost > 0 ? (costVariance / totalPlannedCost * 100).toFixed(2) : '0';

    const netVariance = revenueVariance - costVariance;
    const netVariancePercent = (totalPlannedRevenue - totalPlannedCost) > 0 ?
      (netVariance / (totalPlannedRevenue - totalPlannedCost) * 100).toFixed(2) : '0';

    const totalItems = revenueData.length + costData.length;
    const avgDaysVariance = totalItems > 0 ?
      ((revenueData.reduce((sum, item) => sum + item.days_variance, 0) +
        costData.reduce((sum, item) => sum + item.days_variance, 0)) / totalItems).toFixed(1) : '0';

    return {
      totalRevenue: totalActualRevenue,
      totalCost: totalActualCost,
      revenueVariance,
      costVariance,
      netVariance,
      avgDaysVariance,
      revenueVariancePercent,
      costVariancePercent,
      netVariancePercent,
      totalActualRevenueSum,
      collections,
      remainingAmount
    };
  };

  const summary = calculateSummary();

  // Filter data
  const applyFilters = () => {
    loadData(); // Reload data (in a real app, you'd filter on the client side)
  };

  // Reset filters
  const resetFilters = () => {
    setFilterType('all');
    setStartDate('');
    setEndDate('');
    loadData();
  };

  // Print page function
  const handlePrint = () => {
    // Hide sidebar during print (if it exists)
    const sidebar = document.querySelector('.w-64, aside, [class*="sidebar"], nav') as HTMLElement;
    if (sidebar) {
      sidebar.style.display = 'none';
    }

    // Hide header during print
    const header = document.querySelector('header') as HTMLElement;
    if (header) {
      header.style.display = 'none';
    }

    // Ensure main content takes full width
    const main = document.querySelector('main') as HTMLElement;
    if (main) {
      main.style.width = '100%';
      main.style.maxWidth = 'none';
    }

    // Print the page
    window.print();

    // Show sidebar and header again after print dialog closes
    setTimeout(() => {
      if (sidebar) {
        sidebar.style.display = 'block';
      }
      if (header) {
        header.style.display = 'block';
      }
      if (main) {
        main.style.width = '';
        main.style.maxWidth = '';
      }
    }, 100);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  // Filter revenue data for display
  const filteredRevenueData = revenueData.filter(item =>
    item.item.toLowerCase().includes(searchRevenue.toLowerCase())
  );

  // Filter cost data for display
  const filteredCostData = costData.filter(item =>
    item.item.toLowerCase().includes(searchCost.toLowerCase())
  );

  // CRUD Functions
  const handleAddRevenue = () => {
    if (error) {
      alert('لا يمكن إضافة بيانات جديدة بسبب مشكلة في قاعدة البيانات. يرجى التواصل مع الإدارة.');
      return;
    }
    setEditingRevenue(null);
    setRevenueModalOpen(true);
  };

  const handleEditRevenue = (revenue: RevenueData) => {
    if (error) {
      alert('لا يمكن تعديل البيانات بسبب مشكلة في قاعدة البيانات. يرجى التواصل مع الإدارة.');
      return;
    }
    setEditingRevenue(revenue);
    setRevenueModalOpen(true);
  };

  const handleDeleteRevenue = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإيراد؟')) return;

    try {
      const { error } = await supabase
        .from('revenues')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting revenue:', error);
        alert('حدث خطأ أثناء حذف الإيراد. يرجى المحاولة مرة أخرى.');
        return;
      }

      loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting revenue:', error);
      alert('حدث خطأ أثناء حذف الإيراد. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleAddCost = () => {
    if (error) {
      alert('لا يمكن إضافة بيانات جديدة بسبب مشكلة في قاعدة البيانات. يرجى التواصل مع الإدارة.');
      return;
    }
    setEditingCost(null);
    setCostModalOpen(true);
  };

  const handleEditCost = (cost: CostData) => {
    if (error) {
      alert('لا يمكن تعديل البيانات بسبب مشكلة في قاعدة البيانات. يرجى التواصل مع الإدارة.');
      return;
    }
    setEditingCost(cost);
    setCostModalOpen(true);
  };

  const handleDeleteCost = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;

    try {
      const { error } = await supabase
        .from('costs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting cost:', error);
        alert('حدث خطأ أثناء حذف المصروف. يرجى المحاولة مرة أخرى.');
        return;
      }

      loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting cost:', error);
      alert('حدث خطأ أثناء حذف المصروف. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleModalSave = () => {
    loadData(); // Reload data after save
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      if (revenueChart.current) {
        revenueChart.current.destroy();
        revenueChart.current = null;
      }
      if (costChart.current) {
        costChart.current.destroy();
        costChart.current = null;
      }
      if (varianceChart.current) {
        varianceChart.current.destroy();
        varianceChart.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!loading && (revenueData.length > 0 || costData.length > 0)) {
      console.log('🔄 تحديث الرسوم البيانية بعد تحميل البيانات...');
      updateCharts(revenueData, costData);
    } else if (!loading) {
      console.log('ℹ️ لا توجد بيانات لعرضها في الرسوم البيانية');
    }
  }, [revenueData, costData, loading]);

  // Chart updates are handled by the data change effect above

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-700">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-6 print:bg-white print:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm rounded-xl shadow-soft border border-primary-200/30 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary-800 flex items-center gap-3">
                <i className="fas fa-chart-line text-primary-600 text-2xl"></i>
                التخطيط والإدارة المالية
              </h1>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">المشروع:</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    // Reload data when project changes
                    setTimeout(() => loadData(), 100);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  <option value="">جميع المشاريع</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                className="btn-secondary flex items-center gap-2"
              >
                <i className="fas fa-sync-alt"></i>
                تحديث البيانات
              </button>
              <button
                onClick={() => updateCharts(revenueData, costData)}
                className="btn-secondary flex items-center gap-2"
              >
                <i className="fas fa-chart-bar"></i>
                تحديث الرسوم البيانية
              </button>
            </div>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-r-4 border-red-500 p-6 rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-4">
              <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
              <h3 className="text-lg font-semibold text-red-800">خطأ في تحميل البيانات</h3>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="btn-primary"
            >
              <i className="fas fa-redo mr-2"></i>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="card-professional mb-6 print:hidden" id="filters-section">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-primary-800 flex items-center gap-2">
              <i className="fas fa-sliders-h text-primary-600 text-xl"></i>
              فلاتر البيانات
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع البيانات:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'revenue' | 'cost')}
                className="select-professional"
              >
                <option value="all">الكل</option>
                <option value="revenue">الإيرادات فقط</option>
                <option value="cost">التكاليف فقط</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-professional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-professional"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={resetFilters} className="btn-secondary">
              <i className="fas fa-redo mr-2"></i>
              إعادة تعيين
            </button>
            <button onClick={applyFilters} className="btn-primary">
              <i className="fas fa-check mr-2"></i>
              تطبيق الفلتر
            </button>
            <button onClick={handlePrint} className="btn-secondary">
              <i className="fas fa-print mr-2"></i>
              طباعة الصفحة
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6 print:grid-cols-4 print:gap-3 print:mb-8">
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center border border-green-300">
                <i className="fas fa-chart-line text-green-600 text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-medium truncate">إجمالي الإيرادات</p>
                <p className="text-sm font-bold text-gray-800">{summary.totalRevenue.toLocaleString('ar-EG')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border border-blue-300">
                <i className="fas fa-coins text-blue-600 text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-medium truncate">إجمالي الإيرادات الفعلية</p>
                <p className="text-sm font-bold text-gray-800">{summary.totalActualRevenueSum.toLocaleString('ar-EG')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center border border-purple-300">
                <i className="fas fa-money-check text-purple-600 text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-medium truncate">التحصيلات</p>
                <p className="text-sm font-bold text-gray-800">{summary.collections.toLocaleString('ar-EG')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center border border-orange-300">
                <i className="fas fa-calculator text-orange-600 text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-medium truncate">الباقي المستحق</p>
                <p className="text-sm font-bold text-gray-800">{summary.remainingAmount.toLocaleString('ar-EG')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center border border-red-300">
                <i className="fas fa-chart-column text-red-600 text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-medium truncate">إجمالي التكاليف</p>
                <p className="text-sm font-bold text-gray-800">{summary.totalCost.toLocaleString('ar-EG')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center border border-emerald-300">
                <i className="fas fa-chart-area text-emerald-600 text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-medium truncate">انحراف الإيرادات</p>
                <p className="text-sm font-bold text-gray-800">{summary.revenueVariance.toLocaleString('ar-EG')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-rose-200 rounded-lg flex items-center justify-center border border-rose-300">
                <i className="fas fa-chart-bar text-rose-600 text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-medium truncate">انحراف التكاليف</p>
                <p className="text-sm font-bold text-gray-800">{summary.costVariance.toLocaleString('ar-EG')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border border-blue-300">
                <i className="fas fa-chart-pie text-blue-600 text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-medium truncate">صافي الانحراف</p>
                <p className="text-sm font-bold text-gray-800">{summary.netVariance.toLocaleString('ar-EG')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center border border-amber-300">
                <i className="fas fa-chart-line text-amber-600 text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-medium truncate">متوسط الانحراف الزمني</p>
                <p className="text-sm font-bold text-gray-800">{summary.avgDaysVariance} يوم</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 print:grid-cols-1 print:gap-4 print:hidden" id="charts-section">
          <div className="card-professional">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary-800 flex items-center gap-2">
                <i className="fas fa-chart-column text-primary-600 text-xl"></i>
                الإيرادات (مخطط vs فعلي)
              </h3>
            </div>
            <div className="h-64 relative bg-gray-50 rounded-lg">
              {revenueData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <i className="fas fa-chart-bar text-4xl mb-2 text-gray-300"></i>
                    <p>لا توجد بيانات إيرادات للعرض</p>
                  </div>
                </div>
              ) : (
                <canvas
                  ref={revenueChartRef}
                  className="w-full h-full block"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: '100% !important',
                    height: '100% !important'
                  }}
                ></canvas>
              )}
            </div>
          </div>

          <div className="card-professional">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary-800 flex items-center gap-2">
                <i className="fas fa-chart-bar text-primary-600 text-xl"></i>
                التكاليف (مخطط vs فعلي)
              </h3>
            </div>
            <div className="h-64 relative bg-gray-50 rounded-lg">
              {costData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <i className="fas fa-chart-pie text-4xl mb-2 text-gray-300"></i>
                    <p>لا توجد بيانات تكاليف للعرض</p>
                  </div>
                </div>
              ) : (
                <canvas
                  ref={costChartRef}
                  className="w-full h-full block"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: '100% !important',
                    height: '100% !important'
                  }}
                ></canvas>
              )}
            </div>
          </div>
        </div>

        <div className="card-professional mb-6 print:hidden" id="variance-chart-section">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-primary-800 flex items-center gap-2">
              <i className="fas fa-chart-line text-primary-600 text-xl"></i>
              تحليل الانحرافات (إيرادات وتكاليف)
            </h3>
          </div>
          <div className="h-64 relative bg-gray-50 rounded-lg">
            {(revenueData.length === 0 && costData.length === 0) ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <i className="fas fa-chart-line text-4xl mb-2 text-gray-300"></i>
                  <p>لا توجد بيانات لتحليل الانحرافات</p>
                </div>
              </div>
            ) : (
              <canvas
                ref={varianceChartRef}
                className="w-full h-full block"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: '100% !important',
                  height: '100% !important'
                }}
              ></canvas>
            )}
          </div>
        </div>

        {/* Revenue Table */}
        <div className="card-professional mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-primary-800 flex items-center gap-2">
              <i className="fas fa-money-bill-trend-up text-green-600 text-xl"></i>
              بيانات الإيرادات التفصيلية
            </h3>
            <button
              onClick={handleAddRevenue}
              className="btn-primary flex items-center gap-2 print:hidden"
            >
              <i className="fas fa-plus"></i>
              إضافة إيراد
            </button>
          </div>
          <div className="mb-4 print:hidden">
            <input
              type="text"
              placeholder="ابحث في جدول الإيرادات..."
              value={searchRevenue}
              onChange={(e) => setSearchRevenue(e.target.value)}
              className="input-professional"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="table-professional min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    البند
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    الإيرادات المخططة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    الإيرادات الفعلية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    التاريخ المخطط
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    التاريخ الفعلي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    الانحراف (المبلغ)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    الانحراف (الأيام)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    حالة التحصيل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-primary-200/30">
                {filteredRevenueData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500 print:col-span-7">
                      لا توجد بيانات للإيرادات
                    </td>
                  </tr>
                ) : (
                  filteredRevenueData.map((item) => (
                    <tr key={item.id} className="hover:bg-primary-50/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.item}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.planned_revenue.toLocaleString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.actual_revenue.toLocaleString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.planned_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.actual_date)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        item.amount_variance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.amount_variance.toLocaleString('ar-EG')}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        item.days_variance >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.days_variance} يوم
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.collection_status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <i className={`fas ${item.collection_status ? 'fa-check-circle' : 'fa-times-circle'} mr-1`}></i>
                          {item.collection_status ? 'تم التحصيل' : 'لم يتم التحصيل'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium print:hidden">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditRevenue(item)}
                            className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 rounded-md border border-blue-200 hover:border-blue-300 transition-all duration-200 flex items-center justify-center"
                            title="تعديل"
                          >
                            <i className="fas fa-edit text-sm"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteRevenue(item.id)}
                            className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 rounded-md border border-red-200 hover:border-red-300 transition-all duration-200 flex items-center justify-center"
                            title="حذف"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Table */}
        <div className="card-professional">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-primary-800 flex items-center gap-2">
              <i className="fas fa-money-bill-transfer text-red-600 text-xl"></i>
              بيانات التكاليف التفصيلية
            </h3>
            <button
              onClick={handleAddCost}
              className="btn-primary flex items-center gap-2 print:hidden"
            >
              <i className="fas fa-plus"></i>
              إضافة مصروف
            </button>
          </div>
          <div className="mb-4 print:hidden">
            <input
              type="text"
              placeholder="ابحث في جدول التكاليف..."
              value={searchCost}
              onChange={(e) => setSearchCost(e.target.value)}
              className="input-professional"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="table-professional min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    البند
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    التكاليف المخططة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    التكاليف الفعلية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    التاريخ المخطط
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    التاريخ الفعلي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    الانحراف (المبلغ)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    الانحراف (الأيام)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-primary-200/30">
                {filteredCostData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500 print:col-span-7">
                      لا توجد بيانات للتكاليف
                    </td>
                  </tr>
                ) : (
                  filteredCostData.map((item) => (
                    <tr key={item.id} className="hover:bg-primary-50/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.item}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.planned_cost.toLocaleString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.actual_cost.toLocaleString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.planned_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.actual_date)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        item.amount_variance <= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.amount_variance.toLocaleString('ar-EG')}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        item.days_variance >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.days_variance} يوم
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium print:hidden">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditCost(item)}
                            className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 rounded-md border border-blue-200 hover:border-blue-300 transition-all duration-200 flex items-center justify-center"
                            title="تعديل"
                          >
                            <i className="fas fa-edit text-sm"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteCost(item.id)}
                            className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 rounded-md border border-red-200 hover:border-red-300 transition-all duration-200 flex items-center justify-center"
                            title="حذف"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        <RevenueModal
          isOpen={revenueModalOpen}
          onClose={() => setRevenueModalOpen(false)}
          onSave={handleModalSave}
          editingRevenue={editingRevenue}
        />

        <CostModal
          isOpen={costModalOpen}
          onClose={() => setCostModalOpen(false)}
          onSave={handleModalSave}
          editingCost={editingCost}
        />
      </div>
    </div>
  );
};

export default Page2;