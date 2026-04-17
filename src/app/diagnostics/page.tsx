'use client';

import { useState, useEffect } from 'react';
import { database, db } from '@/lib/firebase-config';
import { ref, get, onValue } from 'firebase/database';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useApp } from '@/components/providers/app-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DiagnosticsPage() {
  const { user, isLoggedIn } = useApp();
  const [realtimeUsers, setRealtimeUsers] = useState<any[]>([]);
  const [realtimeOrders, setRealtimeOrders] = useState<any[]>([]);
  const [firestoreUsers, setFirestoreUsers] = useState<any[]>([]);
  const [firestoreNotifications, setFirestoreNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkData = async () => {
      try {
        // Check Realtime Database - Users
        const usersRef = ref(database, 'users');
        const usersSnapshot = await get(usersRef);
        if (usersSnapshot.exists()) {
          const users = usersSnapshot.val();
          setRealtimeUsers(Object.entries(users).map(([id, data]: any) => ({ id, ...data })));
        }

        // Check Realtime Database - Orders
        const ordersRef = ref(database, 'orders');
        const ordersSnapshot = await get(ordersRef);
        if (ordersSnapshot.exists()) {
          const orders = ordersSnapshot.val();
          const allOrders: any[] = [];
          Object.entries(orders).forEach(([userId, userOrders]: any) => {
            Object.entries(userOrders).forEach(([orderId, orderData]: any) => {
              allOrders.push({
                userId,
                orderId,
                ...orderData,
              });
            });
          });
          setRealtimeOrders(allOrders);
        }

        // Check Firestore - Users
        const usersCol = collection(db, 'users');
        const usersSnap = await getDocs(usersCol);
        setFirestoreUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Check Firestore - Notifications (if user logged in)
        if (user?.id) {
          try {
            const notifsCol = collection(db, 'users', user.id, 'notifications');
            const notifsSnap = await getDocs(notifsCol);
            setFirestoreNotifications(notifsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          } catch (error) {
            console.error('Error fetching notifications:', error);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Diagnostics error:', error);
        setLoading(false);
      }
    };

    checkData();
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
        <h1 className="text-4xl font-bold mb-2">🔍 Firebase Diagnostics</h1>
        <p className="text-gray-600 mb-8">Check what data is actually in Firebase</p>

        {/* Current User */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">👤 Current User</h2>
            {isLoggedIn && user ? (
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p>✅ Logged in as: <strong>{user.email}</strong></p>
                <p>UID: {user.id}</p>
                <p>Name: {user.name}</p>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded border border-red-200">
                <p>❌ Not logged in</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Realtime Database - Users */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">📊 Realtime DB - Users ({realtimeUsers.length})</h2>
            {realtimeUsers.length > 0 ? (
              <div className="bg-green-50 p-4 rounded border border-green-200">
                {realtimeUsers.map((u: any) => (
                  <div key={u.id} className="mb-3 p-2 bg-white rounded border">
                    <strong>{u.name}</strong> ({u.id})
                    <br />
                    <small>{u.email}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded border border-red-200">
                ❌ No users found in Realtime DB
              </div>
            )}
          </CardContent>
        </Card>

        {/* Realtime Database - Orders */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">📋 Realtime DB - Orders ({realtimeOrders.length})</h2>
            {realtimeOrders.length > 0 ? (
              <div className="bg-green-50 p-4 rounded border border-green-200">
                {realtimeOrders.map((order: any) => (
                  <div key={order.orderId} className="mb-3 p-2 bg-white rounded border">
                    <strong>{order.plan}</strong> - Status: {order.status}
                    <br />
                    <small>User: {order.userId} | Amount: ₹{order.amount || order.finalPrice}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                ⚠️ No orders found in Realtime DB. Try placing an order to test.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Firestore - Users */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">📊 Firestore - Users ({firestoreUsers.length})</h2>
            {firestoreUsers.length > 0 ? (
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                {firestoreUsers.map((u: any) => (
                  <div key={u.id} className="mb-3 p-2 bg-white rounded border">
                    <strong>{u.name}</strong> ({u.id})
                    <br />
                    <small>{u.email}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                ⚠️ No users in Firestore
              </div>
            )}
          </CardContent>
        </Card>

        {/* Firestore - Notifications */}
        {user && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">🔔 Firestore - Your Notifications ({firestoreNotifications.length})</h2>
              {firestoreNotifications.length > 0 ? (
                <div className="bg-purple-50 p-4 rounded border border-purple-200">
                  {firestoreNotifications.map((notif: any) => (
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
                  ⚠️ No notifications yet
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">📝 What to Check</h2>
            <ul className="space-y-2 text-gray-700">
              <li>✅ <strong>Current User:</strong> Should show your email</li>
              <li>✅ <strong>Realtime DB Users:</strong> Should show at least 1 user</li>
              <li>✅ <strong>Realtime DB Orders:</strong> Should show orders after you place one</li>
              <li>✅ <strong>Firestore Users:</strong> Should match Realtime DB users</li>
              <li>✅ <strong>Notifications:</strong> Should show after orders are created</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
