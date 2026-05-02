'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { AdminUploadsList } from '@/components/admin-uploads-list';
import { useAdmin } from '@/components/providers/admin-provider';
import { listenToDashboardStats, listenToOrders, updateOrderStatus, listenToPlans, updatePlan, updateSettings, listenToUsers } from '@/lib/admin-supabase-service';
import { getAllUploads } from '@/lib/uploadImage';
import {
  ADMIN_APP_TASK_TITLE,
  getAllAdminAppTaskSubmissions,
  type AdminAppTaskSubmission,
} from '@/lib/admin-app-task';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  Users,
  Share2,
  Package,
  AlertCircle,
  Settings,
  DollarSign,
  UserCheck,
  Edit,
  Check,
  X,
  ImageIcon,
  ListChecks,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAdmin();
  
  // All useState hooks MUST be at the top level, before any returns
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    rejectedOrders: 0,
    totalRevenue: 0,
    totalSales: 0,
    totalMembers: 0,
    totalReferrals: 0,
    purchasedReferrals: 0,
    claimedReferralRewards: 0,
    activeReferralLinks: 0,
    activePlans: 0,
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orderFilter, setOrderFilter] = useState<'all' | 'sales' | 'approved' | 'pending' | 'rejected'>('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [taskSubmissions, setTaskSubmissions] = useState<AdminAppTaskSubmission[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // UI State
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editingCredentials, setEditingCredentials] = useState<any>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveOrderId, setApproveOrderId] = useState<string | null>(null);
  const [approveCredentials, setApproveCredentials] = useState({ username: '', password: '', url: '', expiryDate: '' });
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [adminSettings, setAdminSettings] = useState<any>(null);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [editingApprovedOrder, setEditingApprovedOrder] = useState<string | null>(null);
  const [editingApprovedCredentials, setEditingApprovedCredentials] = useState<any>(null);

  const referralUsers = useMemo(
    () => users.filter((item) => item.totalReferrals > 0),
    [users]
  );
  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (first, second) =>
          new Date(second.createdAt || 0).getTime() -
          new Date(first.createdAt || 0).getTime()
      ),
    [orders]
  );
  const approvedOrders = useMemo(
    () =>
      sortedOrders.filter(
        (item) =>
          item.status === 'approved' ||
          item.status === 'completed' ||
          item.status === 'active'
      ),
    [sortedOrders]
  );
  const pendingOrRejectedOrders = useMemo(
    () =>
      sortedOrders.filter(
        (item) => item.status === 'pending' || item.status === 'rejected'
      ),
    [sortedOrders]
  );
  const filteredOrders = useMemo(() => {
    switch (orderFilter) {
      case 'sales':
      case 'approved':
        return sortedOrders.filter((item) =>
          ['approved', 'completed', 'active'].includes(item.status)
        );
      case 'pending':
        return sortedOrders.filter((item) => item.status === 'pending');
      case 'rejected':
        return sortedOrders.filter((item) => item.status === 'rejected');
      default:
        return sortedOrders;
    }
  }, [orderFilter, sortedOrders]);
  const filteredOrderSales = useMemo(
    () =>
      filteredOrders.reduce(
        (sum, item) => sum + Number(item.finalPrice || item.amount || 0),
        0
      ),
    [filteredOrders]
  );
  const topReferringUsers = useMemo(
    () =>
      [...referralUsers]
        .sort(
          (first, second) =>
            (second.totalReferrals || 0) - (first.totalReferrals || 0)
        )
        .slice(0, 5),
    [referralUsers]
  );
  const taskStats = useMemo(
    () => ({
      total: taskSubmissions.length,
      pending: taskSubmissions.filter((item) => item.approvalStatus === 'pending')
        .length,
      approved: taskSubmissions.filter(
        (item) => item.approvalStatus === 'approved'
      ).length,
      rejected: taskSubmissions.filter(
        (item) => item.approvalStatus === 'rejected'
      ).length,
    }),
    [taskSubmissions]
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = listenToDashboardStats((data) => {
      setStats(data);
    });
    return () => unsubscribe && unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !['orders', 'pending'].includes(activeTab)) {
      return;
    }

    const unsubOrders = listenToOrders((data) => {
      setOrders(data);
    });
    return () => unsubOrders && unsubOrders();
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || activeTab !== 'settings') {
      return;
    }

    const unsubPlans = listenToPlans((data) => {
      setPlans(data);
    });
    return () => unsubPlans && unsubPlans();
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || !['users', 'referrals', 'earn'].includes(activeTab)) {
      return;
    }

    const unsubUsers = listenToUsers((data) => {
      setUsers(data);
    });
    return () => unsubUsers && unsubUsers();
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || !['dashboard', 'uploads'].includes(activeTab)) {
      return;
    }

    let active = true;

    const loadUploads = async () => {
      try {
        setLoadingUploads(true);
        const data = await getAllUploads();

        if (active) {
          setUploads(data);
        }
      } catch (error) {
        console.error('Error loading uploads for admin:', error);
      } finally {
        if (active) {
          setLoadingUploads(false);
        }
      }
    };

    void loadUploads();

    return () => {
      active = false;
    };
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || !['dashboard', 'tasks'].includes(activeTab)) {
      return;
    }

    let active = true;

    const loadTasks = async () => {
      try {
        setLoadingTasks(true);
        const data = await getAllAdminAppTaskSubmissions();

        if (active) {
          setTaskSubmissions(data);
        }
      } catch (error) {
        console.error('Error loading task submissions for admin:', error);
      } finally {
        if (active) {
          setLoadingTasks(false);
        }
      }
    };

    void loadTasks();

    return () => {
      active = false;
    };
  }, [user, activeTab]);

  if (authLoading) {
    return <AdminLayout><div>Loading...</div></AdminLayout>;
  }

  if (!user) {
    return null;
  }

  // Handlers
  const handleApproveOrder = (orderId: string) => {
    setApproveOrderId(orderId);
    setApproveCredentials({ username: '', password: '', url: '', expiryDate: '' });
    setApproveModalOpen(true);
  };

  const handleSaveApprovedOrder = async () => {
    if (!approveOrderId || !approveCredentials.username || !approveCredentials.password || !approveCredentials.url || !approveCredentials.expiryDate) {
      alert('Please fill in all credential fields');
      return;
    }
    try {
      setSavingOrder(true);
      // Find the order to get userId
      const order = orders.find(o => o.id === approveOrderId);
      const userId = order?.userId;
      
      if (!userId) {
        alert('User ID not found for this order');
        return;
      }
      
      // Store credentials in the appropriate format
      await updateOrderStatus(approveOrderId, 'approved', {
        username: approveCredentials.username,
        password: approveCredentials.password,
        url: approveCredentials.url,
        expiryDate: approveCredentials.expiryDate,
      } as any, userId);
      setApproveModalOpen(false);
      setApproveOrderId(null);
      setApproveCredentials({ username: '', password: '', url: '', expiryDate: '' });
      alert('Order approved.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error approving order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleRejectOrder = (orderId: string) => {
    setRejectOrderId(orderId);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleSaveRejection = async () => {
    if (!rejectOrderId || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      setSavingOrder(true);
      // Find the order to get userId
      const order = orders.find(o => o.id === rejectOrderId);
      const userId = order?.userId;
      
      if (!userId) {
        alert('User ID not found for this order');
        return;
      }
      
      await updateOrderStatus(rejectOrderId, 'rejected', {
        rejectReason: rejectionReason,
        status: 'rejected',
      }, userId);
      setRejectModalOpen(false);
      setRejectOrderId(null);
      setRejectionReason('');
      alert('Order rejected.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error rejecting order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleEditCredentials = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setEditingOrder(orderId);
      setEditingCredentials({
        username: order.username || '',
        password: order.password || '',
        url: order.url || '',
        expiryDate: order.expiryDate || '',
      });
    }
  };

  const handleViewProof = (proofUrl: string | null) => {
    if (proofUrl) {
      setProofImageUrl(proofUrl);
      setProofModalOpen(true);
    } else {
      alert('No proof image available for this order');
    }
  };

  const handleEditApprovedOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setEditingApprovedOrder(orderId);
      setEditingApprovedCredentials({
        username: order.username || '',
        password: order.password || '',
        url: order.url || '',
        expiryDate: order.expiryDate || '',
      });
    }
  };

  const handleSaveApprovedOrderEdit = async () => {
    if (editingApprovedOrder && editingApprovedCredentials) {
      try {
        setSavingOrder(true);
        const order = orders.find(o => o.id === editingApprovedOrder);
        if (!order?.userId) {
          alert('User ID not found');
          return;
        }
        await updateOrderStatus(editingApprovedOrder, 'approved', {
          username: editingApprovedCredentials.username,
          password: editingApprovedCredentials.password,
          url: editingApprovedCredentials.url,
          expiryDate: editingApprovedCredentials.expiryDate,
        } as any, order.userId);
        setEditingApprovedOrder(null);
        setEditingApprovedCredentials(null);
        alert('Credentials updated.');
      } catch (error) {
        console.error('Error:', error);
        alert('Error updating credentials');
      } finally {
        setSavingOrder(false);
      }
    }
  };

  const handleSaveCredentials = async () => {
    if (editingOrder && editingCredentials) {
      try {
        setSavingOrder(true);
        await updateOrderStatus(editingOrder, 'approved', {
          credentials: {
            username: editingCredentials.username,
            password: editingCredentials.password,
            url: editingCredentials.url,
            expiryDate: editingCredentials.expiryDate,
          },
        });
        setEditingOrder(null);
        setEditingCredentials(null);
        alert('Credentials updated.');
      } catch (error) {
        console.error('Error:', error);
        alert('Error saving credentials');
      } finally {
        setSavingOrder(false);
      }
    }
  };

  const handleSavePlan = async (planId: string, updates: any) => {
    try {
      setSavingPlan(true);
      await updatePlan(planId, updates);
      setEditingPlan(null);
      alert('Plan updated.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleUpdatePaymentMethod = async (methodName: string, instructions: string, accountInfo: string) => {
    try {
      await updateSettings({
        paymentInstructions: instructions,
      });
      alert('Payment instructions saved.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating payment method');
    }
  };

  const handleUpdateSocialMedia = async (socialMedia: any) => {
    try {
      const { updateAdminSettings } = await import('@/lib/supabase-service');
      await updateAdminSettings({
        socialMedia: {
          youtube: socialMedia.youtube,
          tiktok: socialMedia.tiktok,
          instagram: socialMedia.instagram,
          facebook: socialMedia.facebook,
          twitter: socialMedia.twitter,
          telegram: socialMedia.telegram,
        },
      });
      alert('Social media links saved.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating social media links');
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    if (tabId === 'orders') {
      setOrderFilter('all');
    }

    if (tabId === 'pending') {
      setOrderFilter('pending');
    }
  };

  const openOrderView = (
    tabId: 'orders' | 'pending',
    filter: 'all' | 'sales' | 'approved' | 'pending' | 'rejected'
  ) => {
    setOrderFilter(filter);
    setActiveTab(tabId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'approved':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400';
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }: any) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const DashboardTile = ({ className, onClick, children }: any) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
    >
      <Card
        className={`${className} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500`}
      >
        {children}
      </Card>
    </button>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-9">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'referrals', label: 'Referrals', icon: Share2 },
            { id: 'earn', label: 'Earn', icon: DollarSign },
            { id: 'uploads', label: 'Uploads', icon: ImageIcon, badge: uploads.length },
            { id: 'tasks', label: 'Tasks', icon: ListChecks, badge: taskStats.pending },
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'pending', label: 'Pending', icon: AlertCircle, badge: stats.pendingOrders },
            { id: 'settings', label: 'Plans', icon: Settings },
          ].map(({ id, label, icon: Icon, badge }: any) => (
            <button
              key={id}
              onClick={() => handleTabChange(id as any)}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl transition-all text-xs sm:text-sm relative ${
                activeTab === id
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {badge && badge > 0 && (
                <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {badge}
                </div>
              )}
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs font-semibold">{label}</span>
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DashboardTile
                onClick={() => openOrderView('orders', 'sales')}
                className="glass bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Total Sales</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">${(stats?.totalSales ?? 0).toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Approved order revenue from live payment records
                  </p>
                </CardContent>
              </DashboardTile>

              <DashboardTile
                onClick={() => handleTabChange('users')}
                className="glass bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Total Members</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.totalMembers ?? 0}</p>
                    </div>
                    <UserCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Total Firebase user profiles available to the app
                  </p>
                </CardContent>
              </DashboardTile>

              <DashboardTile
                onClick={() => openOrderView('orders', 'all')}
                className="glass bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">Total Orders</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.totalOrders ?? 0}</p>
                    </div>
                    <ShoppingCart className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    All customer orders across guest and logged-in checkout
                  </p>
                </CardContent>
              </DashboardTile>

              <DashboardTile
                onClick={() => openOrderView('pending', 'pending')}
                className="glass bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold">Pending Orders</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.pendingOrders ?? 0}</p>
                    </div>
                    <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Orders waiting for admin review
                  </p>
                </CardContent>
              </DashboardTile>

              <DashboardTile
                onClick={() => handleTabChange('referrals')}
                className="glass bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/30 dark:to-sky-900/30"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-cyan-600 dark:text-cyan-400 font-semibold">Purchased Referrals</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.purchasedReferrals ?? 0}</p>
                    </div>
                    <Share2 className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Referral purchases currently tracked in the database
                  </p>
                </CardContent>
              </DashboardTile>

              <DashboardTile
                onClick={() => handleTabChange('settings')}
                className="glass bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold">Active Plans</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.activePlans ?? 0}</p>
                    </div>
                    <Settings className="w-10 h-10 text-rose-600 dark:text-rose-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Plans currently enabled for checkout
                  </p>
                </CardContent>
              </DashboardTile>

              <DashboardTile
                onClick={() => handleTabChange('uploads')}
                className="glass bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">Uploaded Images</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                        {loadingUploads ? '...' : uploads.length}
                      </p>
                    </div>
                    <ImageIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Gallery images, payment proofs, and task proof files
                  </p>
                </CardContent>
              </DashboardTile>

              <DashboardTile
                onClick={() => handleTabChange('tasks')}
                className="glass bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-teal-600 dark:text-teal-400 font-semibold">Pending Tasks</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                        {loadingTasks ? '...' : taskStats.pending}
                      </p>
                    </div>
                    <ListChecks className="w-10 h-10 text-teal-600 dark:text-teal-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Admin app task submissions waiting for review
                  </p>
                </CardContent>
              </DashboardTile>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Total users: <span className="font-bold text-slate-900 dark:text-white">{users.length}</span>
            </p>
            {users.map((user) => (
              <Card key={user.id} className="glass">
                <CardContent className="pt-4">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{user.email}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Code: {user.referralCode}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded p-2">
                      <p className="text-slate-600 dark:text-slate-400">Referred</p>
                      <p className="font-bold text-slate-900 dark:text-white">{user.totalReferrals}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded p-2">
                      <p className="text-slate-600 dark:text-slate-400">Referred By</p>
                      <p className="font-bold text-slate-900 dark:text-white">{user.referredBy || 'Direct'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-3">
            {referralUsers.map((user) => (
              <Card key={user.id} className="glass border-l-4 border-l-blue-600">
                <CardContent className="pt-4">
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {user.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Code: <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{user.referralCode}</span>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Total: <span className="font-bold text-slate-900 dark:text-white">{user.totalReferrals}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
            {referralUsers.length === 0 && (
              <Card className="glass text-center py-8">
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400">No active referrals yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Earn Tab */}
        {activeTab === 'earn' && (
          <div className="space-y-4">
            {/* Earnings Summary */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Card className="glass bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Total Referrals</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.totalReferrals ?? 0}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Tracked referral records across the app</p>
                    </div>
                    <Share2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Claimed Referral Rewards</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">${Number(stats?.claimedReferralRewards ?? 0).toFixed(2)}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Sum of claimed reward amounts</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">Active Referral Links</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.activeReferralLinks ?? 0}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Users with referral codes</p>
                    </div>
                    <Share2 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Earners */}
            <Card className="glass">
              <CardContent className="pt-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Top Referring Users
                </h3>
                <div className="space-y-3">
                  {topReferringUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">{user.totalReferrals}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">referrals</p>
                      </div>
                    </div>
                  ))}
                  {topReferringUsers.length === 0 && (
                    <p className="text-center text-slate-600 dark:text-slate-400 py-4">No referrals yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Earn Information */}
            <Card className="glass border-l-4 border-l-orange-600">
              <CardContent className="pt-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">How Referral Earnings Work</h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex gap-2">
                    <span className="text-orange-600 dark:text-orange-400 font-bold">•</span>
                    <span>Users get a unique referral code to share with friends</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600 dark:text-orange-400 font-bold">•</span>
                    <span>Each successful referral earns 10% commission</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600 dark:text-orange-400 font-bold">•</span>
                    <span>Commission is calculated based on the final purchase amount</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600 dark:text-orange-400 font-bold">•</span>
                    <span>Earnings are credited instantly when orders are approved</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Uploads Tab */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            <Card className="glass border-l-4 border-l-indigo-600">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Upload Center
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Payment proofs, task proofs, and gallery images uploaded by users.
                    </p>
                  </div>
                  <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    {loadingUploads ? 'Loading uploads...' : `${uploads.length} files found`}
                  </div>
                </div>
              </CardContent>
            </Card>

            <AdminUploadsList />
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Card className="glass">
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Total Tasks</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {loadingTasks ? '...' : taskStats.total}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Pending Review</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {loadingTasks ? '...' : taskStats.pending}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Approved</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {loadingTasks ? '...' : taskStats.approved}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">Rejected</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {loadingTasks ? '...' : taskStats.rejected}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-l-4 border-l-teal-600">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {ADMIN_APP_TASK_TITLE}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Review the latest task submissions here, or open the full task review page for approvals.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/admin/social-tasks')}
                    className="bg-teal-600 text-white hover:bg-teal-700"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Full Review
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {taskSubmissions.slice(0, 8).map((submission) => (
                <Card
                  key={submission.id}
                  className={`glass border-l-4 ${
                    submission.approvalStatus === 'approved'
                      ? 'border-l-emerald-600'
                      : submission.approvalStatus === 'rejected'
                      ? 'border-l-red-600'
                      : 'border-l-amber-600'
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {submission.userName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {submission.userEmail}
                        </p>
                      </div>
                      <span className={`rounded px-2 py-1 text-xs font-bold ${getStatusColor(submission.approvalStatus)}`}>
                        {submission.approvalStatus}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                      <div className="rounded bg-slate-100 p-2 dark:bg-slate-800">
                        <p className="text-slate-600 dark:text-slate-400">Account Email</p>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {submission.details.accountEmail || 'Not provided'}
                        </p>
                      </div>
                      <div className="rounded bg-slate-100 p-2 dark:bg-slate-800">
                        <p className="text-slate-600 dark:text-slate-400">Submitted</p>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {new Date(submission.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {submission.adminNotes && (
                      <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                        {submission.adminNotes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {!loadingTasks && taskSubmissions.length === 0 && (
                <Card className="glass">
                  <CardContent className="pt-8 text-center pb-8">
                    <p className="text-slate-600 dark:text-slate-400">
                      No task submissions yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'sales', label: 'Sales Orders' },
                { id: 'pending', label: 'Pending' },
                { id: 'rejected', label: 'Rejected' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setOrderFilter(filter.id as any)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    orderFilter === filter.id
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <Card className="glass border-l-4 border-l-orange-600">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Visible Orders</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                      {filteredOrders.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Visible Sales</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${filteredOrderSales.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Current Filter</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-slate-900 dark:text-white">
                      {orderFilter === 'sales' ? 'Approved revenue orders' : orderFilter}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className={`glass border-l-4 ${
                  order.status === 'pending'
                    ? 'border-l-yellow-600'
                    : order.status === 'rejected'
                    ? 'border-l-red-600'
                    : 'border-l-emerald-600'
                }`}
              >
                <CardContent className="pt-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{order.plan}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">ID: {order.id}</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs font-bold ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Price</p>
                      <p className="font-bold text-slate-900 dark:text-white">${order.finalPrice || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">User</p>
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{order.userId}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Method</p>
                      <p className="font-bold text-slate-900 dark:text-white">{order.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>

                  {order.rejectReason && (
                    <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300">
                      {order.rejectReason}
                    </div>
                  )}

                  {order.paymentProof && (
                    <div className="mt-3">
                      <Button
                        onClick={() => handleViewProof(order.paymentProof)}
                        size="sm"
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      >
                        View Proof
                      </Button>
                    </div>
                  )}

                  {order.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <Button onClick={() => handleApproveOrder(order.id)} size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        <Check className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button onClick={() => handleRejectOrder(order.id)} size="sm" className="flex-1 bg-red-600 hover:bg-red-700">
                        <X className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {order.username && (
                    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                      {editingOrder === order.id && editingCredentials ? (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">Username</label>
                            <input
                              type="text"
                              placeholder="Enter username"
                              value={editingCredentials.username}
                              onChange={(e) => setEditingCredentials({ ...editingCredentials, username: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">Password</label>
                            <input
                              type="text"
                              placeholder="Enter password"
                              value={editingCredentials.password}
                              onChange={(e) => setEditingCredentials({ ...editingCredentials, password: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">URL</label>
                            <input
                              type="text"
                              placeholder="https://example.com"
                              value={editingCredentials.url}
                              onChange={(e) => setEditingCredentials({ ...editingCredentials, url: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">Expiry Date</label>
                            <input
                              type="date"
                              placeholder="Select expiry date"
                              value={editingCredentials.expiryDate}
                              onChange={(e) => setEditingCredentials({ ...editingCredentials, expiryDate: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button onClick={handleSaveCredentials} disabled={savingOrder} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700" size="sm">
                              <Check className="mr-1 h-4 w-4" />
                              {savingOrder ? 'Saving...' : 'Save'}
                            </Button>
                            <Button onClick={() => { setEditingOrder(null); setEditingCredentials(null); }} className="flex-1 bg-slate-600 text-white hover:bg-slate-700" size="sm">
                              <X className="mr-1 h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">Credentials</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded bg-slate-100 p-2 dark:bg-slate-800">
                              <p className="font-semibold text-slate-600 dark:text-slate-400">Username</p>
                              <p className="mt-1 truncate font-mono text-slate-900 dark:text-white">{order.username}</p>
                            </div>
                            <div className="rounded bg-slate-100 p-2 dark:bg-slate-800">
                              <p className="font-semibold text-slate-600 dark:text-slate-400">Password</p>
                              <p className="mt-1 truncate font-mono text-slate-900 dark:text-white">{order.password}</p>
                            </div>
                            <div className="col-span-2 rounded bg-slate-100 p-2 dark:bg-slate-800">
                              <p className="font-semibold text-slate-600 dark:text-slate-400">URL</p>
                              <p className="mt-1 break-all font-mono text-xs text-slate-900 dark:text-white">{order.url}</p>
                            </div>
                            <div className="col-span-2 rounded bg-slate-100 p-2 dark:bg-slate-800">
                              <p className="font-semibold text-slate-600 dark:text-slate-400">Expires</p>
                              <p className="mt-1 font-bold text-slate-900 dark:text-white">{order.expiryDate}</p>
                            </div>
                          </div>
                          <Button onClick={() => handleEditCredentials(order.id)} className="mt-2 w-full bg-blue-600 text-white hover:bg-blue-700" size="sm">
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                          <Button onClick={() => handleRejectOrder(order.id)} className="mt-2 w-full bg-red-600 text-white hover:bg-red-700" size="sm">
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredOrders.length === 0 && (
              <Card className="glass">
                <CardContent className="pb-8 pt-8 text-center">
                  <p className="text-slate-600 dark:text-slate-400">No orders match this filter right now.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Pending Orders Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-3">
            {pendingOrRejectedOrders.map((order) => (
              <Card key={order.id} className={`glass border-l-4 ${order.status === 'pending' ? 'border-l-yellow-600' : 'border-l-red-600'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">{order.plan}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">ID: {order.id}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Amount</p>
                      <p className="font-bold text-orange-600 dark:text-orange-400">${order.finalPrice || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Method</p>
                      <p className="font-bold text-slate-900 dark:text-white">{order.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>

                  {order.status === 'rejected' && order.rejectReason && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-700/50">
                      <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-1">Rejection Reason</p>
                      <p className="text-xs text-red-600 dark:text-red-400">{order.rejectReason}</p>
                    </div>
                  )}

                  {order.paymentProof && (
                    <div className="mb-3">
                      <Button onClick={() => handleViewProof(order.paymentProof)} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2">
                        View Proof
                      </Button>
                    </div>
                  )}

                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button onClick={() => handleApproveOrder(order.id)} size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button onClick={() => handleRejectOrder(order.id)} size="sm" className="flex-1 bg-red-600 hover:bg-red-700">
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Plans from Supabase</h3>
            {plans.length === 0 ? (
              <Card className="glass text-center py-8">
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400">No plans in Supabase. Create plans using the Supabase console.</p>
                </CardContent>
              </Card>
            ) : (
              plans.map((plan) => (
                <Card key={plan.id} className="glass hover:shadow-lg transition-all">
                  <CardContent className="pt-5 pb-5">
                    {editingPlan?.id === plan.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Plan Name</label>
                          <input
                            type="text"
                            placeholder="e.g., Premium 1 Month"
                            value={editingPlan.name}
                            onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Price</label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={editingPlan.price}
                              onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Sale Price</label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={editingPlan.salePrice}
                              onChange={(e) => setEditingPlan({ ...editingPlan, salePrice: parseFloat(e.target.value) })}
                              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleSavePlan(plan.id, editingPlan)}
                            disabled={savingPlan}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            size="sm"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            {savingPlan ? 'Saving...' : 'Save'}
                          </Button>
                          <Button onClick={() => setEditingPlan(null)} className="flex-1 bg-slate-600 hover:bg-slate-700" size="sm">
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 dark:text-white text-lg">{plan.name}</p>
                          <div className="flex gap-2 mt-4">
                            <div className="flex-1">
                              <p className="text-xs text-slate-500 font-semibold">Price</p>
                              <p className="text-xl font-bold text-slate-400 line-through">${plan.price}</p>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-500 font-semibold">Sale</p>
                              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">${plan.salePrice}</p>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-500 font-semibold">Save</p>
                              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${plan.discount}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setEditingPlan({
                              id: plan.id,
                              name: plan.name,
                              price: plan.price,
                              salePrice: plan.salePrice,
                              discount: plan.discount,
                            })
                          }
                          className="p-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          aria-label="Edit plan"
                        >
                          <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}

            {/* Payment Method Settings */}
            <div className="mt-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Payment Method</h3>
              <Card className="glass">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">Method Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Binance"
                      defaultValue={adminSettings?.payment?.methodName || 'Binance'}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                      id="methodName"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">Instructions</label>
                    <textarea
                      placeholder="Enter payment instructions..."
                      defaultValue={adminSettings?.payment?.instructions || ''}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm resize-none"
                      rows={3}
                      id="instructions"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">Account Info</label>
                    <textarea
                      placeholder="Enter account information..."
                      defaultValue={adminSettings?.payment?.accountInfo || ''}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm resize-none"
                      rows={3}
                      id="accountInfo"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const methodName = (document.getElementById('methodName') as HTMLInputElement).value;
                      const instructions = (document.getElementById('instructions') as HTMLTextAreaElement).value;
                      const accountInfo = (document.getElementById('accountInfo') as HTMLTextAreaElement).value;
                      handleUpdatePaymentMethod(methodName, instructions, accountInfo);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save to Supabase
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Social Media Links Settings */}
            <div className="mt-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Social Media Links</h3>
              <Card className="glass">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">YouTube</label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/..."
                        defaultValue={adminSettings?.socialMedia?.youtube || ''}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                        id="youtube"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">TikTok</label>
                      <input
                        type="url"
                        placeholder="https://tiktok.com/..."
                        defaultValue={adminSettings?.socialMedia?.tiktok || ''}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                        id="tiktok"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">Instagram</label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/..."
                        defaultValue={adminSettings?.socialMedia?.instagram || ''}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                        id="instagram"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">Facebook</label>
                      <input
                        type="url"
                        placeholder="https://facebook.com/..."
                        defaultValue={adminSettings?.socialMedia?.facebook || ''}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                        id="facebook"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">Twitter / X</label>
                      <input
                        type="url"
                        placeholder="https://x.com/..."
                        defaultValue={adminSettings?.socialMedia?.twitter || ''}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                        id="twitter"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">Telegram</label>
                      <input
                        type="url"
                        placeholder="https://t.me/..."
                        defaultValue={adminSettings?.socialMedia?.telegram || ''}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                        id="telegram"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const socialMedia = {
                        youtube: (document.getElementById('youtube') as HTMLInputElement).value,
                        tiktok: (document.getElementById('tiktok') as HTMLInputElement).value,
                        instagram: (document.getElementById('instagram') as HTMLInputElement).value,
                        facebook: (document.getElementById('facebook') as HTMLInputElement).value,
                        twitter: (document.getElementById('twitter') as HTMLInputElement).value,
                        telegram: (document.getElementById('telegram') as HTMLInputElement).value,
                      };
                      handleUpdateSocialMedia(socialMedia);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save Social Links
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Approve Modal */}
        {approveModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-50">
            <Card className="glass max-w-sm w-full">
              <div className="flex items-start justify-between mb-4 p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Approve Order</h3>
                <button
                  onClick={() => {
                    setApproveModalOpen(false);
                    setApproveOrderId(null);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  aria-label="Close approve modal"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Username</label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={approveCredentials.username}
                    onChange={(e) => setApproveCredentials({ ...approveCredentials, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={approveCredentials.password}
                    onChange={(e) => setApproveCredentials({ ...approveCredentials, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Service URL</label>
                  <input
                    type="text"
                    placeholder="Enter service URL"
                    value={approveCredentials.url}
                    onChange={(e) => setApproveCredentials({ ...approveCredentials, url: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Expiration Date</label>
                  <input
                    type="date"
                    placeholder="Select expiration date"
                    value={approveCredentials.expiryDate}
                    onChange={(e) => setApproveCredentials({ ...approveCredentials, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveApprovedOrder} disabled={savingOrder} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                    <Check className="w-4 h-4 mr-1" />
                    {savingOrder ? 'Saving...' : 'Approve'}
                  </Button>
                  <Button onClick={() => setApproveModalOpen(false)} className="flex-1 bg-slate-600 hover:bg-slate-700 text-white" size="sm">
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-50">
            <Card className="glass max-w-sm w-full">
              <div className="flex items-start justify-between mb-4 p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Reject Order</h3>
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  aria-label="Close reject modal"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Rejection Reason</label>
                  <textarea
                    placeholder="Enter reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm resize-none"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveRejection} disabled={savingOrder} className="flex-1 bg-red-600 hover:bg-red-700 text-white" size="sm">
                    <X className="w-4 h-4 mr-1" />
                    {savingOrder ? 'Rejecting...' : 'Reject'}
                  </Button>
                  <Button onClick={() => setRejectModalOpen(false)} className="flex-1 bg-slate-600 hover:bg-slate-700 text-white" size="sm">
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Proof Image Modal */}
        {proofModalOpen && proofImageUrl && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-50">
            <Card className="glass max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="flex items-start justify-between mb-4 sticky top-0 bg-gradient-to-b from-white/50 dark:from-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Payment Proof</h3>
                <button
                  onClick={() => {
                    setProofModalOpen(false);
                    setProofImageUrl(null);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Close proof modal"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              <CardContent className="p-6">
                <img
                  src={proofImageUrl}
                  alt="Payment proof"
                  className="w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700 object-contain"
                />
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-4 text-center">
                  Verify payment receipt before approving
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Approved Order Modal */}
        {editingApprovedOrder && editingApprovedCredentials && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-50">
            <Card className="glass max-w-sm w-full max-h-[90vh] overflow-auto">
              <div className="flex items-start justify-between mb-4 sticky top-0 bg-gradient-to-b from-white/50 dark:from-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Edit Credentials</h3>
                <button
                  onClick={() => {
                    setEditingApprovedOrder(null);
                    setEditingApprovedCredentials(null);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  title="Close edit modal"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={editingApprovedCredentials.username}
                    onChange={(e) => setEditingApprovedCredentials({ ...editingApprovedCredentials, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                    title="Service username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Password</label>
                  <input
                    type="text"
                    placeholder="Enter password"
                    value={editingApprovedCredentials.password}
                    onChange={(e) => setEditingApprovedCredentials({ ...editingApprovedCredentials, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                    title="Service password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={editingApprovedCredentials.url}
                    onChange={(e) => setEditingApprovedCredentials({ ...editingApprovedCredentials, url: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                    title="Streaming URL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={editingApprovedCredentials.expiryDate}
                    onChange={(e) => setEditingApprovedCredentials({ ...editingApprovedCredentials, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                    title="Account expiry date"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveApprovedOrderEdit} disabled={savingOrder} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                    <Check className="w-4 h-4 mr-1" />
                    {savingOrder ? 'Saving...' : 'Save'}
                  </Button>
                  <Button onClick={() => { setEditingApprovedOrder(null); setEditingApprovedCredentials(null); }} className="flex-1 bg-slate-600 hover:bg-slate-700 text-white" size="sm">
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
