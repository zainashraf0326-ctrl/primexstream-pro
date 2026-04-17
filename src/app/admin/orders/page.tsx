'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { useAdmin } from '@/components/providers/admin-provider';
import AdminLayout from '@/components/admin-layout';
import {
  listenToOrders,
  listenToOrdersByStatus,
  updateOrderStatus,
  Order,
} from '@/lib/admin-firestore-service';
import { processOrderReward } from '@/lib/order-reward-hook';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Edit3, CheckCircle, AlertCircle, X, Calendar, DollarSign, User, Zap, Search, Settings } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';

type FilterStatus = 'pending' | 'approved' | 'rejected';

export default function AdminOrdersPage() {
  const { isLoggedIn, isLoading } = useApp();
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    url: '',
    expiryDate: '',
    status: 'pending' as 'approved' | 'pending' | 'rejected',
    rejectReason: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userLookup, setUserLookup] = useState<Record<string, { name?: string; email?: string }>>({});

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn || !isAdmin) {
      router.push('/admin/login');
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  useEffect(() => {
    let unsubscribe: any;
    // ADMIN CAN NOW READ ALL ORDERS - no filter needed
    unsubscribe = listenToOrders(setOrders);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const mapped: Record<string, { name?: string; email?: string }> = {};
        usersSnap.docs.forEach((snapshotDoc) => {
          const data = snapshotDoc.data() as any;
          mapped[snapshotDoc.id] = {
            name: data.name || data.fullName || data.displayName || '',
            email: data.email || '',
          };
        });
        setUserLookup(mapped);
      } catch (error) {
        console.warn('Could not load users collection for order display:', error);
      }
    };

    loadUsers();
  }, []);

  const handleSaveEdit = async () => {
    if (!editingOrder) return;

    setLoading(true);
    try {
      const updateData: any = {
        status: editForm.status,
      };

      // Always save credentials for any status
      updateData.credentials = {
        username: editForm.username,
        password: editForm.password,
        url: editForm.url,
        expiryDate: editForm.expiryDate,
      };

      // Add rejection reason if rejecting
      if (editForm.status === 'rejected' && editForm.rejectReason) {
        updateData.rejectReason = editForm.rejectReason;
      }

      await updateOrderStatus(editingOrder.id, editForm.status, updateData);
      
      // Process referral reward if order is approved
      if (editForm.status === 'approved' && editingOrder.userId) {
        try {
          await processOrderReward(editingOrder.userId, editingOrder.id);
          console.log('✅ Referral reward processed for order:', editingOrder.id);
        } catch (error) {
          console.warn('Referral reward processing failed:', error);
          // Don't fail the order approval if reward processing fails
        }
      }
      setMessage({ type: 'success', text: 'Order updated successfully!' });
      setEditingOrder(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating order:', error);
      setMessage({ type: 'error', text: 'Error updating order' });
    } finally {
      setLoading(false);
    }
  };

  const sortedOrders = [...orders]
    .sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    })
    .filter((order) => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt?.seconds * 1000 || 0);
      const formattedDate = orderDate.toLocaleDateString('en-US');
      
      const userProfile = order.userId ? userLookup[order.userId] : undefined;
      const displayName = userProfile?.name || order.userEmail || 'Unknown User';
      const displayEmail = userProfile?.email || order.userEmail || '';

      return (
        displayName.toLowerCase().includes(query) ||
        displayEmail.toLowerCase().includes(query) ||
        order.userId?.toLowerCase().includes(query) ||
        order.id?.toLowerCase().includes(query) ||
        order.paymentMethod?.toLowerCase().includes(query) ||
        order.planName?.toLowerCase().includes(query) ||
        formattedDate.includes(query) ||
        order.amount?.toString().includes(query)
      );
    });

  if (isLoading) {
    return (
      <AdminLayout title="Orders">
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Orders">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' : 'bg-red-50 dark:bg-red-900/20 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <p className={message.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>{message.text}</p>
          </div>
        )}

        {/* Filter Buttons & Search */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input
              type="text"
              placeholder="Search by email, user ID, order ID, payment method, date, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-2 w-full"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {(['pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => {
              const count = sortedOrders.filter((o) => o.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === status
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {status === 'pending' && '⏳'} {status === 'approved' && '✅'} {status === 'rejected' && '❌'} {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {sortedOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-slate-600 dark:text-slate-400">No {filter} orders found</p>
            </Card>
          ) : (
            sortedOrders.map((order, index) => {
              // Parse date properly from Firestore timestamp
              let orderDate = new Date();
              if (order.createdAt?.toDate && typeof order.createdAt.toDate === 'function') {
                orderDate = order.createdAt.toDate();
              } else if (order.createdAt?.seconds) {
                orderDate = new Date(order.createdAt.seconds * 1000);
              } else if (typeof order.createdAt === 'number') {
                orderDate = new Date(order.createdAt);
              }
              
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const month = monthNames[orderDate.getMonth()];
              const day = orderDate.getDate();
              const year = orderDate.getFullYear().toString().slice(-2);
              const formattedDate = `${month} ${day}, ${year}`;
              const formattedTime = orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
              
              const userProfile = order.userId ? userLookup[order.userId] : undefined;
              const displayName = userProfile?.name || order.userEmail || 'Unknown User';
              const displayEmail = userProfile?.email || order.userEmail || 'No email';

              return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:shadow-md transition-all"
              >
                {/* Order Header Row */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">Order #{order.id.substring(0, 8)}</span>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : order.status === 'approved'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {order.status === 'pending' && '⏳'} {order.status === 'approved' && '✅'} {order.status === 'rejected' && '❌'} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{displayEmail}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingOrder(order);
                      setEditForm({
                        username: order.credentials?.username || '',
                        password: order.credentials?.password || '',
                        url: order.credentials?.url || '',
                        expiryDate: order.credentials?.expiryDate || '',
                        status: order.status,
                        rejectReason: '',
                      });
                    }}
                    className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors text-emerald-600 dark:text-emerald-400"
                    title="Edit Order"
                  >
                    <Edit3 size={20} />
                  </button>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Plan</p>
                    <p className="text-slate-900 dark:text-white font-medium">{order.planName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Amount</p>
                    <p className="text-slate-900 dark:text-white font-medium">${(order.amount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Payment Method</p>
                    <p className="text-slate-900 dark:text-white font-medium">{order.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Date & Time</p>
                    <p className="text-slate-900 dark:text-white font-medium">{formattedDate} {formattedTime}</p>
                  </div>
                </div>
              </div>
            );}
            )
          )}
        </div>

        {/* Edit Modal */}
        {editingOrder && (() => {
          // Parse date properly from Firestore timestamp
          let editOrderDate = new Date();
          if (editingOrder.createdAt?.toDate && typeof editingOrder.createdAt.toDate === 'function') {
            editOrderDate = editingOrder.createdAt.toDate();
          } else if (editingOrder.createdAt?.seconds) {
            editOrderDate = new Date(editingOrder.createdAt.seconds * 1000);
          } else if (typeof editingOrder.createdAt === 'number') {
            editOrderDate = new Date(editingOrder.createdAt);
          }
          
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const editMonth = monthNames[editOrderDate.getMonth()];
          const editDay = editOrderDate.getDate();
          const editYear = editOrderDate.getFullYear();
          const editFormattedDate = `${editMonth} ${editDay}, ${editYear}`;
          const editFormattedTime = editOrderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
          
          return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Order</h2>
                  <button onClick={() => setEditingOrder(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                    <X size={24} />
                  </button>
                </div>

                {/* Order Identification */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-300 mb-1">ORDER ID</p>
                    <p className="text-sm font-mono bg-white dark:bg-slate-800 p-2 rounded border border-blue-200 dark:border-blue-700 text-slate-900 dark:text-white break-all">{editingOrder.id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-semibold text-blue-600 dark:text-blue-300 mb-1">USER ID</p>
                      <p className="text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-800 p-2 rounded border border-blue-200 dark:border-blue-700">{editingOrder.userId?.substring(0, 20) || 'N/A'}...</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-600 dark:text-blue-300 mb-1">PAYMENT METHOD</p>
                      <p className="text-slate-900 dark:text-white font-medium bg-white dark:bg-slate-800 p-2 rounded border border-blue-200 dark:border-blue-700">{editingOrder.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Customer Email</p>
                      <p className="text-slate-900 dark:text-white font-medium break-all">{editingOrder.userEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Amount</p>
                      <p className="text-slate-900 dark:text-white font-bold text-lg">${(editingOrder.amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Plan</p>
                      <p className="text-slate-900 dark:text-white font-medium">{editingOrder.planName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Order Date</p>
                      <p className="text-slate-900 dark:text-white font-medium">{editFormattedDate}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Order Time</p>
                    <p className="text-slate-900 dark:text-white font-medium">{editFormattedTime}</p>
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['pending', 'approved', 'rejected'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setEditForm({ ...editForm, status })}
                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                          editForm.status === status
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Credentials - Always editable */}
                <div className="space-y-3 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Streaming Credentials</p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1">Username</label>
                    <Input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} placeholder="Username" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1">Password</label>
                    <Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Password" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1">URL</label>
                    <Input value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} placeholder="Streaming URL" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1">Expiry Date</label>
                    <Input type="date" value={editForm.expiryDate} onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })} />
                  </div>
                </div>

                {/* Rejection Reason - Show only when rejecting */}
                {editForm.status === 'rejected' && (
                  <div className="space-y-3 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-300">Rejection Reason</p>
                    <textarea
                      value={editForm.rejectReason}
                      onChange={(e) => setEditForm({ ...editForm, rejectReason: e.target.value })}
                      placeholder="Explain why this order is being rejected..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                    />
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button onClick={handleSaveEdit} disabled={loading} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg transition-colors">
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditingOrder(null)} disabled={loading} className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          </div>
          );
        })()}
      </div>
    </AdminLayout>
  );
}

