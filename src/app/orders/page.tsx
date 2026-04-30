'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/components/providers/app-provider';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, XCircle, Eye, X, Copy, Smartphone } from 'lucide-react';
import {
  subscribeToAdminReplies,
  subscribeToUserOrders,
} from '@/services/dbService';
import { ADMIN_APP_TASK_TITLE, listenToUserAdminAppTaskSubmissions, type AdminAppTaskSubmission } from '@/lib/admin-app-task';

interface Order {
  id: string;
  userId: string;
  plan: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'expired' | 'active';
  username?: string;
  password?: string;
  url?: string;
  expiryDate?: string;
  rejectReason?: string;
  paymentMethod?: string;
  finalPrice?: number;
  createdAt: any;
  isGuest?: boolean;
  guestEmail?: string;
  guestName?: string;
}

interface Credentials {
  username: string;
  password: string;
  url?: string;
  expiryDate?: string;
}

interface HistoryItem {
  id: string;
  itemType: 'order' | 'task';
  plan: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'expired' | 'active';
  username?: string;
  password?: string;
  url?: string;
  expiryDate?: string;
  rejectReason?: string;
  finalPrice?: number;
  createdAt: any;
  isGuest?: boolean;
  subtitle: string;
}

interface AdminReply {
  id: string;
  title: string;
  message: string;
  status: string;
  orderId?: string;
  createdAt: string;
}

const getStatusIcon = (status: string) => {
  const normalizedStatus = status?.toLowerCase() || 'pending';
  switch (normalizedStatus) {
    case 'approved':
    case 'active':
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    case 'pending':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case 'expired':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'rejected':
      return <XCircle className="w-5 h-5 text-red-600" />;
    default:
      return <Clock className="w-5 h-5 text-blue-500" />;
  }
};

const getStatusColor = (status: string) => {
  const normalizedStatus = status?.toLowerCase() || 'pending';
  switch (normalizedStatus) {
    case 'approved':
    case 'active':
      return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/30';
    case 'completed':
      return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    case 'pending':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/30';
    case 'expired':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/30';
    case 'rejected':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/30';
    default:
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30';
  }
};

export default function OrdersPage() {
  const { isLoading, user } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [taskSubmissions, setTaskSubmissions] = useState<AdminAppTaskSubmission[]>([]);
  const [adminReplies, setAdminReplies] = useState<AdminReply[]>([]);
  const [showCredentials, setShowCredentials] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState<Credentials | null>(null);
  const [showRejectionReason, setShowRejectionReason] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const unsubscribeOrders = subscribeToUserOrders(user.id, (ordersData: Order[]) => {
      setOrders(ordersData);
      setLoading(false);
    });

    const unsubscribeReplies = subscribeToAdminReplies(user.id, (replyRows: AdminReply[]) => {
      setAdminReplies(replyRows as AdminReply[]);
    });

    const unsubscribeTasks = listenToUserAdminAppTaskSubmissions(user.id, (rows) => {
      setTaskSubmissions(
        rows.filter(
          (submission) =>
            submission.approvalStatus === 'approved' ||
            submission.approvalStatus === 'rejected'
        )
      );
    });

    return () => {
      unsubscribeOrders && unsubscribeOrders();
      unsubscribeReplies && unsubscribeReplies();
      unsubscribeTasks && unsubscribeTasks();
    };
  }, [user?.id]);

  const historyItems: HistoryItem[] = [
    ...orders.map((order) => ({
      ...order,
      itemType: 'order' as const,
      subtitle: `IPTV service • ID: ${order.id.slice(0, 8)}...`,
    })),
    ...taskSubmissions.map((submission) => ({
      id: submission.id,
      itemType: 'task' as const,
      plan: ADMIN_APP_TASK_TITLE,
      status: submission.approvalStatus,
      username: submission.credentials?.username,
      password: submission.credentials?.password,
      url: undefined,
      expiryDate: undefined,
      rejectReason: submission.adminNotes || '',
      finalPrice: 0,
      createdAt: submission.createdAt,
      isGuest: false,
      subtitle: `Admin app task • Account: ${submission.details.accountEmail || 'No email'}`,
    })),
  ].sort((first, second) => {
    const firstDate =
      typeof first.createdAt === 'string'
        ? new Date(first.createdAt).getTime()
        : first.createdAt?.toDate?.()?.getTime?.() || 0;
    const secondDate =
      typeof second.createdAt === 'string'
        ? new Date(second.createdAt).getTime()
        : second.createdAt?.toDate?.()?.getTime?.() || 0;
    return secondDate - firstDate;
  });

  const handleViewCredentials = (item: HistoryItem) => {
    if (item.username && item.password) {
      setSelectedCredentials({
        username: item.username,
        password: item.password,
        url: item.url || (item.itemType === 'task' ? 'Task credentials only' : undefined),
        expiryDate:
          item.expiryDate ||
          (item.itemType === 'task'
            ? new Date().toISOString()
            : undefined),
      });
      setShowCredentials(true);
    }
  };

  const handleViewRejectionReason = (reason: string) => {
    setSelectedRejectionReason(reason);
    setShowRejectionReason(true);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <AppLayout title="Orders">
      {/* Credentials Modal */}
      {showCredentials && selectedCredentials && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <Card className="glass max-w-sm w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex items-start justify-between mb-4 sticky top-0 bg-gradient-to-b from-white/50 dark:from-slate-900/50 pb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Your Access Details</h3>
              <button
                onClick={() => setShowCredentials(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Close credentials"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <CardContent className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Username
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    title="Service username"
                    value={selectedCredentials.username}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono"
                  />
                  <button
                    onClick={() => handleCopy(selectedCredentials.username, 'username')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Copy username"
                  >
                    {copiedField === 'username' ? '✓' : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    title="Service password"
                    value={selectedCredentials.password}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono"
                  />
                  <button
                    onClick={() => handleCopy(selectedCredentials.password, 'password')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Copy password"
                  >
                    {copiedField === 'password' ? '✓' : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Streaming URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    title="Service streaming URL"
                    value={selectedCredentials.url || ''}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm break-all"
                  />
                  <button
                    onClick={() => handleCopy(selectedCredentials.url || '', 'url')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                    title="Copy URL"
                  >
                    {copiedField === 'url' ? '✓' : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Expiry Date
                </label>
                <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono">
                  {new Date(selectedCredentials.expiryDate || Date.now()).toLocaleDateString()}
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-500 mt-4 text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                Keep your credentials safe. Don&apos;t share with others.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionReason && selectedRejectionReason && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <Card className="glass max-w-sm w-full animate-fade-in-up">
            <div className="flex items-start justify-between mb-4 sticky top-0 bg-gradient-to-b from-white/50 dark:from-slate-900/50 pb-4">
              <h3 className="font-bold text-red-700 dark:text-red-400">Rejection Details</h3>
              <button
                onClick={() => setShowRejectionReason(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700/30">
                <p className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">{selectedRejectionReason}</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
                Your order was rejected. Please contact support if you need assistance.
              </p>
              <Button
                onClick={() => setShowRejectionReason(false)}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="w-full">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-6 md:py-6">
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="glass">
                <CardContent className="pt-4 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Active</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {historyItems.filter(
                  (o) =>
                    o.status === 'active' || o.status === 'approved'
                ).length}
              </p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {historyItems.filter((o) => o.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                Total
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {historyItems.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {loading ? (
            <Card className="glass text-center py-12">
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">Loading your orders...</p>
              </CardContent>
            </Card>
          ) : historyItems.length === 0 ? (
            <Card className="glass text-center py-12">
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  No orders or task results yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            historyItems.map((order) => {
                const orderDate =
                  order.createdAt?.toDate?.() ||
                  (typeof order.createdAt === 'string'
                    ? new Date(order.createdAt)
                    : new Date());

                return (
                  <Card
                    key={order.id}
                    className={`glass border ${getStatusColor(order.status)}`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {order.plan}
                            </p>
                            {order.itemType === 'task' && (
                              <div className="px-2 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-xs font-semibold text-cyan-700 dark:text-cyan-300 inline-flex items-center gap-1">
                                <Smartphone className="w-3.5 h-3.5" />
                                Task
                              </div>
                            )}
                            {order.isGuest && (
                              <div className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-semibold text-blue-700 dark:text-blue-400">
                                Guest Order
                              </div>
                            )}
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white dark:bg-slate-800 text-xs font-semibold">
                              {getStatusIcon(order.status)}
                              <span
                                className={
                                  order.status === 'active' || order.status === 'approved'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : order.status === 'completed'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : order.status === 'pending'
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : order.status === 'expired' || order.status === 'rejected'
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-slate-600 dark:text-slate-400'
                                }
                              >
                                {order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            IPTV Service • ID: {order.id.slice(0, 8)}...
                          </p>
                          {order.itemType === 'task' && (
                            <p className="text-sm text-cyan-700 dark:text-cyan-300 mb-2">
                              {order.subtitle}
                            </p>
                          )}

                          {/* Rejection Reason */}
                          {order.status === 'rejected' && order.rejectReason && (
                            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700/30">
                              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                                ❌ Order Rejected
                              </p>
                              <p className="text-xs text-red-600 dark:text-red-300">
                                {order.rejectReason.substring(0, 100)}...
                              </p>
                            </div>
                          )}

                          {/* Pending Status */}
                          {order.status === 'pending' && (
                            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700/30">
                              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                                ⏳ Waiting for admin approval...
                              </p>
                              <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                                Admin will verify your payment and provide credentials.
                              </p>
                            </div>
                          )}

                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                            Ordered: {orderDate.toLocaleDateString()}
                            {order.expiryDate &&
                              ` • Expires: ${new Date(
                                order.expiryDate
                              ).toLocaleDateString()}`}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            ${order.finalPrice || 0}
                          </p>
                          {(order.status === 'active' ||
                            order.status === 'approved') &&
                            order.username &&
                            order.password && (
                              <Button
                                onClick={() => handleViewCredentials(order)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            )}
                          {order.status === 'rejected' && order.rejectReason && (
                            <Button
                              onClick={() => handleViewRejectionReason(order.rejectReason!)}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 whitespace-nowrap"
                            >
                              <AlertCircle className="w-4 h-4 mr-1" />
                              View Reason
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
            </div>
            {adminReplies.length > 0 && (
              <div className="space-y-3 pt-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Admin Replies
                </h2>
                {adminReplies.map((reply) => (
                  <Card
                    key={reply.id}
                    className="glass border border-blue-200 dark:border-blue-800/40"
                  >
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {reply.title}
                        </p>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                        {reply.message}
                      </p>
                      {reply.orderId && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Linked order: {reply.orderId.slice(0, 8)}...
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
