/**
 * COMPREHENSIVE NOTIFICATION SYSTEM
 * 
 * Features:
 * - Order notifications (create, accept, reject)
 * - Referral notifications with personalized messages
 * - Admin notifications for all new orders
 * - Read/Unread status tracking
 * - Persistent notification deletion
 * - Real-time updates with Firestore
 * - Notification history
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  deleteDoc,
  orderBy,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { sendNotification } from '@/lib/firebase-service';

// ===== ADMIN CONFIG =====
const ADMIN_EMAIL = 'zainashraf0326@gmail.com';

/**
 * Get admin user ID from their email
 * This ensures notifications are sent to the correct admin user ID, not the email string
 */
async function getAdminUserId(): Promise<string | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', ADMIN_EMAIL));
    const snapshot = await getDocs(q);
    if (snapshot.docs.length > 0) {
      const adminDoc = snapshot.docs[0];
      console.log(`✅ Found admin user ID: ${adminDoc.id}`);
      return adminDoc.id;
    }
    console.warn(`⚠️ No admin user found with email: ${ADMIN_EMAIL}`);
    return null;
  } catch (error) {
    console.error('Error getting admin user ID:', error);
    return null;
  }
}

// ===== TYPES =====

export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order_created' | 'order_accepted' | 'order_rejected' | 'referral' | 'reminder' | 'general';
  isRead: boolean;
  isDeleted: boolean;
  createdAt: Timestamp;
  data?: {
    orderId?: string;
    orderAmount?: number;
    orderPlan?: string;
    referrerName?: string;
    referrerId?: string;
    referredName?: string;
    referredId?: string;
    rejectionReason?: string;
    link?: string;
  };
}

export interface AdminConfig {
  email: string;
  name: string;
}

// Admin configuration

const ADMIN_CONFIG: AdminConfig = {
  email: ADMIN_EMAIL,
  name: 'Admin',
};

// ===== NOTIFICATION CREATION FUNCTIONS =====

/**
 * Send order created notification to user
 */
export async function notifyOrderCreated(
  userId: string,
  userName: string,
  orderData: {
    orderId: string;
    planName: string;
    amount: number;
    status: string;
  }
): Promise<string | null> {
  try {
    // Use correct Firestore path: users/{userId}/notifications
    const notifRef = collection(db, 'users', userId, 'notifications');
    const docRef = await addDoc(notifRef, {
      userId,
      title: '✅ Order Created Successfully',
      message: `Your order for ${orderData.planName} (₹${orderData.amount}) has been created and is ${orderData.status}. Your order will be processed shortly.`,
      type: 'order_created',
      read: false,
      deleted: false,
      createdAt: Timestamp.now(),
      data: {
        orderId: orderData.orderId,
        orderAmount: orderData.amount,
        orderPlan: orderData.planName,
      },
    });

    console.log(`✅ Notification sent to user ${userId} for order ${orderData.orderId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error sending order created notification:', error);
    return null;
  }
}

/**
 * Send order accepted notification to user
 */
export async function notifyOrderAccepted(
  userId: string,
  orderData: {
    orderId: string;
    planName: string;
    credentials?: {
      username: string;
      password: string;
      url: string;
      expiryDate: string;
    };
  }
): Promise<string | null> {
  try {
    const credentialsText = orderData.credentials
      ? `\n📱 Username: ${orderData.credentials.username}\n🔐 Password: ${orderData.credentials.password}\n🌐 URL: ${orderData.credentials.url}\n📅 Expires: ${orderData.credentials.expiryDate}`
      : '';

    // Use correct Firestore path: users/{userId}/notifications
    const notifRef = collection(db, 'users', userId, 'notifications');
    const docRef = await addDoc(notifRef, {
      userId,
      title: '🎉 Order Approved!',
      message: `Your order for ${orderData.planName} has been approved!${credentialsText}\n\nYou can now enjoy all services!`,
      type: 'order_accepted',
      isRead: false,
      isDeleted: false,
      createdAt: Timestamp.now(),
      data: {
        orderId: orderData.orderId,
        orderPlan: orderData.planName,
      },
    });

    console.log(`✅ Approval notification sent to user ${userId} for order ${orderData.orderId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error sending order accepted notification:', error);
    return null;
  }
}

/**
 * Send order rejected notification to user
 */
export async function notifyOrderRejected(
  userId: string,
  orderData: {
    orderId: string;
    planName: string;
    rejectionReason: string;
  }
): Promise<string | null> {
  try {
    const notifRef = collection(db, 'users', userId, 'notifications');
    const docRef = await addDoc(notifRef, {
      userId,
      title: '❌ Order Rejected',
      message: `Your order for ${orderData.planName} has been rejected.\n\n📝 Reason: ${orderData.rejectionReason}\n\nPlease try again or contact support for assistance.`,
      type: 'order_rejected',
      isRead: false,
      isDeleted: false,
      createdAt: Timestamp.now(),
      data: {
        orderId: orderData.orderId,
        orderPlan: orderData.planName,
        rejectionReason: orderData.rejectionReason,
      },
    });

    console.log(`✅ Rejection notification sent to user ${userId} for order ${orderData.orderId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error sending order rejected notification:', error);
    return null;
  }
}

/**
 * Send referral notification to referrer (person who referred)
 * Message: "Noor is your new referral, encourage to buy subscription..."
 */
export async function notifyReferrerNewSignup(
  referrerId: string,
  referrerName: string,
  referredUserData: {
    referredId: string;
    referredName: string;
    referralCount: number;
  }
): Promise<string | null> {
  try {
    // Use correct Firestore path: users/{userId}/notifications
    const notifRef = collection(db, 'users', referrerId, 'notifications');
    const docRef = await addDoc(notifRef, {
      userId: referrerId,
      title: '🎯 New Referral Signup!',
      message: `${referredUserData.referredName} is your new referral! 🎉\n\nEncourage them to buy a subscription to enjoy all features. You'll earn rewards when they purchase!\n\nYou now have ${referredUserData.referralCount} referrals total.`,
      type: 'referral',
      read: false,
      deleted: false,
      createdAt: Timestamp.now(),
      data: {
        referrerId,
        referrerName,
        referredId: referredUserData.referredId,
        referredName: referredUserData.referredName,
      },
    });

    console.log(`✅ Referral notification sent to referrer ${referrerId} for new user ${referredUserData.referredId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error sending referrer notification:', error);
    return null;
  }
}

/**
 * Send referral welcome notification to referred user (person who was referred)
 * Message: "Welcome to Zain team, please buy subscription..."
 */
export async function notifyReferredUserWelcome(
  referredUserId: string,
  referrerName: string,
  subscriptionDiscount: number = 10
): Promise<string | null> {
  try {
    // Use correct Firestore path: users/{userId}/notifications
    const notifRef = collection(db, 'users', referredUserId, 'notifications');
    const docRef = await addDoc(notifRef, {
      userId: referredUserId,
      title: `👋 Welcome to ${referrerName}'s Team!`,
      message: `Welcome! You've been referred by ${referrerName}. 🌟\n\n💝 Special Offer: Get ${subscriptionDiscount}% discount on your first subscription!\n\nVisit the Earn section to see your benefits and complete your purchase.`,
      type: 'referral',
      read: false,
      deleted: false,
      createdAt: Timestamp.now(),
      data: {
        referrerId: referrerName,
        link: '/earn',
      },
    });

    console.log(`✅ Welcome notification sent to referred user ${referredUserId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error sending referred user welcome notification:', error);
    return null;
  }
}

/**
 * Send notification to all admins about new order
 */
export async function notifyAdminNewOrder(
  orderData: {
    orderId: string;
    userId: string;
    userName: string;
    userEmail: string;
    planName: string;
    amount: number;
  }
): Promise<string | null> {
  try {
    // Get actual admin user ID instead of using email string
    const adminUserId = await getAdminUserId();
    if (!adminUserId) {
      console.warn('⚠️ Could not send admin notification: No admin user found');
      return null;
    }

    // Use correct Firestore path: users/{userId}/notifications
    const notifRef = collection(db, 'users', adminUserId, 'notifications');
    const docRef = await addDoc(notifRef, {
      userId: adminUserId, // Use actual admin user ID, not email
      title: '📋 New Order Received',
      message: `New order pending approval!\n\n👤 Customer: ${orderData.userName}\n📧 Email: ${orderData.userEmail}\n📱 Plan: ${orderData.planName}\n💰 Amount: ₹${orderData.amount}\n\nClick "Go to Orders" button to review and approve/reject this order.`,
      type: 'order_created',
      read: false,
      deleted: false,
      createdAt: Timestamp.now(),
      data: {
        orderId: orderData.orderId,
        orderAmount: orderData.amount,
        orderPlan: orderData.planName,
        link: '/admin/orders',
      },
    });

    console.log(`✅ Admin notification sent for new order ${orderData.orderId} to admin user ${adminUserId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return null;
  }
}

/**
 * Send subscription reminder notification
 */
export async function notifySubscriptionReminder(
  userId: string,
  userName: string,
  message: string = 'Buy a subscription to unlock all features!'
): Promise<string | null> {
  try {
    // Use correct Firestore path: users/{userId}/notifications
    const notifRef = collection(db, 'users', userId, 'notifications');
    const docRef = await addDoc(notifRef, {
      userId,
      title: '🛍️ Subscription Reminder',
      message,
      type: 'reminder',
      read: false,
      deleted: false,
      createdAt: Timestamp.now(),
      data: {
        link: '/iptv',
      },
    });

    console.log(`✅ Reminder notification sent to user ${userId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error sending reminder notification:', error);
    return null;
  }
}

// ===== NOTIFICATION MANAGEMENT FUNCTIONS =====

/**
 * Get all active (non-deleted) notifications for a user
 */
export async function getActiveNotifications(userId: string): Promise<NotificationData[]> {
  try {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as NotificationData));
  } catch (error) {
    console.error('Error fetching active notifications:', error);
    return [];
  }
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isDeleted', '==', false),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      isRead: true,
      updatedAt: Timestamp.now(),
    });
    console.log(`✅ Notification ${notificationId} marked as read`);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark multiple notifications as read
 */
export async function markMultipleAsRead(notificationIds: string[]): Promise<boolean> {
  try {
    for (const notifId of notificationIds) {
      await markNotificationAsRead(notifId);
    }
    return true;
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    return false;
  }
}

/**
 * Soft delete notification (mark as deleted, don't remove from DB)
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      isDeleted: true,
      deletedAt: Timestamp.now(),
    });
    console.log(`✅ Notification ${notificationId} deleted`);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

/**
 * Delete multiple notifications
 */
export async function deleteMultipleNotifications(notificationIds: string[]): Promise<boolean> {
  try {
    for (const notifId of notificationIds) {
      await deleteNotification(notifId);
    }
    return true;
  } catch (error) {
    console.error('Error deleting multiple notifications:', error);
    return false;
  }
}

/**
 * Real-time listener for active notifications
 */
export function onActiveNotificationsChange(
  userId: string,
  callback: (notifications: NotificationData[]) => void
): () => void {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as NotificationData));
        callback(notifications);
      },
      (error) => {
        console.error('Error listening to notifications:', error);
        // Don't clear notifications on error - keep showing existing ones
        // This prevents notifications from disappearing when Firestore has issues
        console.warn('⚠️ Notification listener error - maintaining current state');
      }
    );
  } catch (error) {
    console.error('Error setting up notifications listener:', error);
    return () => {};
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(userId: string): Promise<{
  total: number;
  unread: number;
  byType: Record<string, number>;
}> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isDeleted', '==', false)
    );

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map((doc) => doc.data() as NotificationData);

    const stats = {
      total: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      byType: {} as Record<string, number>,
    };

    notifications.forEach((n) => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return { total: 0, unread: 0, byType: {} };
  }
}

export const NotificationService = {
  // Creation functions
  notifyOrderCreated,
  notifyOrderAccepted,
  notifyOrderRejected,
  notifyReferrerNewSignup,
  notifyReferredUserWelcome,
  notifyAdminNewOrder,
  notifySubscriptionReminder,

  // Management functions
  getActiveNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markMultipleAsRead,
  deleteNotification,
  deleteMultipleNotifications,
  onActiveNotificationsChange,
  getNotificationStats,
};
