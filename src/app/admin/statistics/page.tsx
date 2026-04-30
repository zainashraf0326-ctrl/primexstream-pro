'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/providers/admin-provider';
import AdminLayout from '@/components/admin-layout';
import { Card } from '@/components/ui/card';
import {
  Users,
  ShoppingCart,
  DollarSign,
  Share2,
  TrendingUp,
  Zap,
  CheckCircle2,
  Clock,
  BarChart3,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-config';

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalReferrals: number;
  purchasedReferrals: number;
  socialSubmissions: number;
  approvedSubmissions: number;
  adminNotifications: number;
  adminOrders: number;
  adminReferrals: number;
}

interface StatCard {
  title: string;
  value: string | number;
  icon: any;
  color: 'emerald' | 'blue' | 'purple' | 'orange' | 'pink' | 'cyan';
  description?: string;
}

export default function AdminStatsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [authLoading, user, router]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [usersRes, ordersRes, referralsRes, submissionsRes, notificationsRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('referrals').select('*'),
        supabase.from('social_task_submissions').select('*'),
        supabase.from('notifications').select('*'),
      ]);

      const users = usersRes.data || [];
      const orders = ordersRes.data || [];
      const referrals = referralsRes.data || [];
      const submissions = submissionsRes.data || [];
      const notifications = notificationsRes.data || [];

      const totalUsers = users.length;
      const totalOrders = orders.length;
      const totalRevenue =
        orders.reduce((sum, data: any) => {
          const normalizedStatus = (data.status || '').toString().toLowerCase();
          if (normalizedStatus !== 'approved') return sum;
          return sum + Number(data.amount || data.final_price || 0);
        }, 0);

      const totalReferrals = referrals.length;
      const purchasedReferrals =
        referrals.filter((referral: any) => referral.purchased_plan === true).length;

      const socialSubmissions = submissions.length;
      const approvedSubmissions =
        submissions.filter((submission: any) => (submission.approval_status || '').toLowerCase() === 'approved').length;

      const adminNotifications = notifications.length;

      // All orders for admin (no filter)
      const adminOrders = totalOrders;

      // All referrals for admin (no filter)
      const adminReferrals = totalReferrals;

      setStats({
        totalUsers,
        totalOrders,
        totalRevenue,
        totalReferrals,
        purchasedReferrals,
        socialSubmissions,
        approvedSubmissions,
        adminNotifications,
        adminOrders,
        adminReferrals,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      alert('Failed to load statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchStats();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return null;
  }

  const statCards: StatCard[] = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'emerald',
      description: 'Active users in system',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'blue',
      description: 'All orders placed',
    },
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'purple',
      description: 'Combined order value',
    },
    {
      title: 'Total Referrals',
      value: stats?.totalReferrals || 0,
      icon: Share2,
      color: 'orange',
      description: 'Referral conversions',
    },
    {
      title: 'Purchased Referrals',
      value: stats?.purchasedReferrals || 0,
      icon: CheckCircle2,
      color: 'cyan',
      description: 'Successful purchases',
    },
    {
      title: 'Social Submissions',
      value: stats?.socialSubmissions || 0,
      icon: Zap,
      color: 'pink',
      description: 'Task submissions received',
    },
  ];

  const colorClasses = {
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-600 dark:text-orange-400',
    },
    pink: {
      bg: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
      border: 'border-pink-200 dark:border-pink-800',
      icon: 'text-pink-600 dark:text-pink-400',
    },
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20',
      border: 'border-cyan-200 dark:border-cyan-800',
      icon: 'text-cyan-600 dark:text-cyan-400',
    },
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-emerald-600" />
              System Statistics
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Overview of all system activity and metrics
            </p>
          </div>

          <Button
            onClick={fetchStats}
            disabled={loading}
            className="gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Refresh
              </>
            )}
          </Button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            const colors = colorClasses[card.color];

            return (
              <Card
                key={idx}
                className={`p-6 ${colors.bg} border ${colors.border} hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-white dark:bg-slate-900/30 ${colors.icon}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-slate-400" />
                </div>

                <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">
                  {card.title}
                </h3>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {card.value}
                </p>
                {card.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {card.description}
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-800"></div>

        {/* Admin's Personal Stats */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-emerald-600" />
            Your Admin Activity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin Notifications */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Your Notifications
                  </h3>
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {stats?.adminNotifications || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Unread notifications for your account
                </p>
              </div>
            </Card>

            {/* Admin Orders */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Your Orders
                  </h3>
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {stats?.adminOrders || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Orders placed under your account
                </p>
              </div>
            </Card>

            {/* Admin Referrals */}
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Your Referrals
                  </h3>
                  <Share2 className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  {stats?.adminReferrals || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  People you&apos;ve referred to the system
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Social Tasks Overview */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-pink-600" />
            Social Task Submissions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Submissions */}
            <Card className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Total Submissions
                  </h3>
                  <Zap className="w-5 h-5 text-pink-600" />
                </div>
                <p className="text-3xl font-bold text-pink-600">
                  {stats?.socialSubmissions || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  All social task submissions received
                </p>
              </div>
            </Card>

            {/* Approved Submissions */}
            <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Approved Submissions
                  </h3>
                  <CheckCircle2 className="w-5 h-5 text-cyan-600" />
                </div>
                <p className="text-3xl font-bold text-cyan-600">
                  {stats?.approvedSubmissions || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Successfully approved submissions
                </p>
                {stats && stats.socialSubmissions > 0 && (
                  <div className="pt-2 border-t border-cyan-200 dark:border-cyan-700">
                    <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                      Approval Rate:{' '}
                      {(
                        ((stats.approvedSubmissions || 0) /
                          (stats.socialSubmissions || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Info Box */}
        <Card className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <h3 className="font-bold text-emerald-900 dark:text-emerald-200 mb-2">
            ✓ Dashboard Features
          </h3>
          <ul className="space-y-1 text-sm text-emerald-800 dark:text-emerald-300">
            <li>• View complete system statistics and analytics</li>
            <li>• Track your personal orders, notifications, and referrals</li>
            <li>• Monitor social task submissions and approval rates</li>
            <li>
              • Click &quot;Refresh&quot; button to reload the latest data from Supabase
            </li>
            <li>
              • Use the Debug panel (/admin/debug) to test system functionality
            </li>
          </ul>
        </Card>
      </div>
    </AdminLayout>
  );
}
