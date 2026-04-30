'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { useAdmin } from '@/components/providers/admin-provider';
import AdminLayout from '@/components/admin-layout';
import { supabase } from '@/lib/supabase-config';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Share2,
  Mail,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  uid: string;
  joinDate?: string;
  walletBalance?: number;
}

interface OrderData {
  id: string;
  userId: string;
  userEmail?: string;
  amount: number;
  status: string;
  createdAt?: any;
  planId?: string;
}

interface ReferralData {
  id: string;
  referrerId: string;
  referredUserId: string;
  purchasedPlan?: boolean;
  status?: string;
}

interface NotificationData {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
}

export default function AdminDashboardPage() {
  const { isLoggedIn, isLoading, user } = useApp();
  const { isAdmin } = useAdmin();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalReferrals: 0,
    purchasedReferrals: 0,
  });

  const [users, setUsers] = useState<UserData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'orders' | 'referrals' | 'notifications'>('stats');

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn || !isAdmin) {
      router.push('/admin/login');
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const client = supabase;
      if (!client) throw new Error('Supabase is not configured');

      const { data: usersRows } = await client.from('users').select('*');
      const usersData: UserData[] = (usersRows || []).map((row: any) => ({
        id: row.id,
        email: row.email || '',
        uid: row.id,
        joinDate: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A',
        walletBalance: row.wallet_balance || row.usable_balance || 0,
      }));
      setUsers(usersData);

      const { data: orderRows } = await client.from('orders').select('*');
      const ordersData: OrderData[] = (orderRows || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id || '',
        userEmail: row.user_email || '',
        amount: row.amount || row.final_price || 0,
        status: row.status || 'unknown',
        createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A',
        planId: row.plan_id || row.plan || '',
      }));
      setOrders(ordersData);

      const { data: referralRows } = await client.from('referrals').select('*');
      const referralsData: ReferralData[] = (referralRows || []).map((row: any) => ({
        id: row.id,
        referrerId: row.referrer_uid || '',
        referredUserId: row.referred_uid || '',
        purchasedPlan: row.purchased_plan || false,
        status: row.status || 'pending',
      }));
      setReferrals(referralsData);

      const { data: notificationRows } = await client.from('notifications').select('*');
      const notificationsData: NotificationData[] = (notificationRows || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id || '',
        title: row.title || '',
        message: row.message || '',
        type: row.type || 'info',
      }));
      setNotifications(notificationsData);

      // Calculate stats
      const totalRevenue = ordersData.reduce((sum, order) => sum + (order.amount || 0), 0);
      const purchasedCount = referralsData.filter((r) => r.purchasedPlan).length;

      setStats({
        totalUsers: usersData.length,
        totalOrders: ordersData.length,
        totalRevenue,
        totalReferrals: referralsData.length,
        purchasedReferrals: purchasedCount,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchAllData();
    }
  }, [isLoggedIn, isAdmin]);

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Users</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalUsers}</p>
              </div>
              <Users className="w-10 h-10 text-emerald-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Orders</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalOrders}</p>
              </div>
              <ShoppingCart className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">${stats.totalRevenue}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Referrals</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalReferrals}</p>
              </div>
              <Share2 className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Purchased</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.purchasedReferrals}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'referrals'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400'
            }`}
          >
            Referrals ({referrals.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400'
            }`}
          >
            Notifications ({notifications.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">Loading data...</p>
          </Card>
        ) : activeTab === 'users' ? (
          <Card className="p-6 overflow-x-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">All Users</h3>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left p-2 font-semibold text-slate-900 dark:text-white">Email</th>
                  <th className="text-left p-2 font-semibold text-slate-900 dark:text-white">UID</th>
                  <th className="text-left p-2 font-semibold text-slate-900 dark:text-white">Join Date</th>
                  <th className="text-right p-2 font-semibold text-slate-900 dark:text-white">Wallet</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="p-2 text-slate-700 dark:text-slate-300">{user.email}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-400 font-mono text-xs">{user.uid.slice(0, 8)}...</td>
                    <td className="p-2 text-slate-600 dark:text-slate-400">{user.joinDate}</td>
                    <td className="p-2 text-right text-slate-700 dark:text-slate-300">${user.walletBalance || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : activeTab === 'orders' ? (
          <Card className="p-6 overflow-x-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">All Orders</h3>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left p-2 font-semibold text-slate-900 dark:text-white">User Email</th>
                  <th className="text-left p-2 font-semibold text-slate-900 dark:text-white">Plan</th>
                  <th className="text-right p-2 font-semibold text-slate-900 dark:text-white">Amount</th>
                  <th className="text-left p-2 font-semibold text-slate-900 dark:text-white">Status</th>
                  <th className="text-left p-2 font-semibold text-slate-900 dark:text-white">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="p-2 text-slate-700 dark:text-slate-300">{order.userEmail}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-400">{order.planId}</td>
                    <td className="p-2 text-right text-slate-700 dark:text-slate-300 font-semibold">${order.amount}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        order.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-2 text-slate-600 dark:text-slate-400">{order.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : activeTab === 'referrals' ? (
          <Card className="p-6 overflow-x-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">All Referrals</h3>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left p-2 font-semibold text-slate-900 dark:text-white">Referrer ID</th>
                  <th className="text-left p-2 font-semibold text-slate-900 dark:text-white">Referred User ID</th>
                  <th className="text-left p-2 font-semibold text-slate-900 dark:text-white">Status</th>
                  <th className="text-center p-2 font-semibold text-slate-900 dark:text-white">Purchased</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="p-2 text-slate-700 dark:text-slate-300 font-mono text-xs">{ref.referrerId.slice(0, 8)}...</td>
                    <td className="p-2 text-slate-700 dark:text-slate-300 font-mono text-xs">{ref.referredUserId.slice(0, 8)}...</td>
                    <td className="p-2 text-slate-600 dark:text-slate-400">{ref.status}</td>
                    <td className="p-2 text-center">
                      {ref.purchasedPlan ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <AlertCircle className="w-4 h-4 text-orange-600 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : activeTab === 'notifications' ? (
          <Card className="p-6 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">All Notifications</h3>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400">No notifications yet</p>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{notif.title}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notif.message}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">User: {notif.userId.slice(0, 8)}...</p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">
                        {notif.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Total Orders</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalOrders}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Total Revenue</span>
                  <span className="text-2xl font-bold text-emerald-600">${stats.totalRevenue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Average Order</span>
                  <span className="text-xl font-semibold text-slate-900 dark:text-white">
                    ${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : 0}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Referral Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Total Referrals</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalReferrals}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Purchased Plans</span>
                  <span className="text-2xl font-bold text-purple-600">{stats.purchasedReferrals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Conversion Rate</span>
                  <span className="text-xl font-semibold text-slate-900 dark:text-white">
                    {stats.totalReferrals > 0 ? ((stats.purchasedReferrals / stats.totalReferrals) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
