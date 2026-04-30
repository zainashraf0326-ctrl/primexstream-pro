'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-config';
import { useApp } from '@/components/providers/app-provider';
import { Card, CardContent } from '@/components/ui/card';

export default function DiagnosticsPage() {
  const { user, isLoggedIn } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkData = async () => {
      try {
        const [usersRes, ordersRes, notificationsRes] = await Promise.all([
          supabase.from('users').select('*').order('created_at', { ascending: false }),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          user?.id
            ? supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('deleted', false)
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [] as any[] }),
        ]);

        setUsers(usersRes.data || []);
        setOrders(ordersRes.data || []);
        setNotifications(notificationsRes.data || []);
      } catch (error) {
        console.error('Diagnostics error:', error);
      } finally {
        setLoading(false);
      }
    };

    void checkData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading diagnostics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Supabase Diagnostics</h1>
        <p className="text-gray-600 mb-8">Check what data is available in Supabase</p>

        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Current User</h2>
            {isLoggedIn && user ? (
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p>Logged in as: <strong>{user.email}</strong></p>
                <p>UID: {user.id}</p>
                <p>Name: {user.name}</p>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded border border-red-200">
                <p>Not logged in</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Users ({users.length})</h2>
            {users.length > 0 ? (
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                {users.map((u: any) => (
                  <div key={u.id} className="mb-3 p-2 bg-white rounded border">
                    <strong>{u.name}</strong> ({u.id})
                    <br />
                    <small>{u.email}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                No users found
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Orders ({orders.length})</h2>
            {orders.length > 0 ? (
              <div className="bg-green-50 p-4 rounded border border-green-200">
                {orders.map((order: any) => (
                  <div key={order.id} className="mb-3 p-2 bg-white rounded border">
                    <strong>{order.plan_name || order.plan}</strong> - Status: {order.status}
                    <br />
                    <small>User: {order.user_id} | Amount: {order.amount || order.final_price}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                No orders found. Try placing an order to test.
              </div>
            )}
          </CardContent>
        </Card>

        {user && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Your Notifications ({notifications.length})</h2>
              {notifications.length > 0 ? (
                <div className="bg-purple-50 p-4 rounded border border-purple-200">
                  {notifications.map((notif: any) => (
                    <div key={notif.id} className="mb-3 p-2 bg-white rounded border">
                      <strong>{notif.title}</strong>
                      <br />
                      <small>{notif.message}</small>
                      <br />
                      <span className="text-xs">Type: {notif.type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                  No notifications yet
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
