/**
 * Firebase Test Data Helper
 * Use this to populate Firebase with sample data for testing
 * 
 * How to use:
 * 1. Import this file in a browser console or create a temporary page
 * 2. Call seedTestData() to populate with sample users and orders
 * 3. Call cleanTestData() to remove all test data
 */

import { database, db } from '@/lib/firebase-config';
import { ref, set, push, child } from 'firebase/database';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Test user IDs (use real Firebase user IDs if testing)
const TEST_USER_1 = 'test_user_001';
const TEST_USER_2 = 'test_user_002';
const ADMIN_ID = 'admin_user_001';

/**
 * Seed Firebase with test data
 */
export async function seedTestData() {
  try {
    console.log('🌱 Starting to seed test data...');

    // 1. Create test users in Realtime Database
    await seedUsers();

    // 2. Create test orders in Realtime Database
    await seedOrders();

    // 3. Create test notifications in Firestore
    await seedNotifications();

    console.log('✅ Test data seeding completed!');
    console.log('Test User 1 ID:', TEST_USER_1);
    console.log('Test User 2 ID:', TEST_USER_2);
    console.log('You can now log in with these user IDs');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

/**
 * Seed test users
 */
async function seedUsers() {
  try {
    const usersRef = ref(database, 'users');

    const users = {
      [TEST_USER_1]: {
        id: TEST_USER_1,
        name: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        referralCode: 'AHMED123',
        totalReferrals: 2,
        credits: 500,
        createdAt: new Date().toISOString(),
        appliedReferralCode: undefined,
      },
      [TEST_USER_2]: {
        id: TEST_USER_2,
        name: 'Fatima Khan',
        email: 'fatima@example.com',
        referralCode: 'FATIMA456',
        totalReferrals: 1,
        credits: 250,
        createdAt: new Date().toISOString(),
        appliedReferralCode: 'AHMED123',
      },
      [ADMIN_ID]: {
        id: ADMIN_ID,
        name: 'Admin User',
        email: 'zainashraf0326@gmail.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
    };

    await set(usersRef, users);
    console.log('✅ Test users created');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}

/**
 * Seed test orders
 */
async function seedOrders() {
  try {
    const ordersRef = ref(database, 'orders');

    const orders = {
      [TEST_USER_1]: {
        order_pending_001: {
          plan: 'Premium - 30 Days',
          planId: 'plan_001',
          status: 'pending',
          amount: 499,
          originalPrice: 699,
          finalPrice: 499,
          paymentMethod: 'bank_transfer',
          transactionId: 'TXN123456789',
          paymentProof: 'https://example.com/proof.jpg',
          paymentProofPath: 'proofs/test_user_001/proof.jpg',
          date: new Date().toLocaleDateString(),
          user: 'Ahmed Hassan',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        },
        order_approved_001: {
          plan: 'Standard - 15 Days',
          planId: 'plan_002',
          status: 'approved',
          amount: 299,
          originalPrice: 399,
          finalPrice: 299,
          paymentMethod: 'bank_transfer',
          transactionId: 'TXN987654321',
          paymentProof: 'https://example.com/proof2.jpg',
          username: 'ahmeduser123',
          password: 'pass123456',
          url: 'http://iptv.example.com',
          expiryDate: '2025-05-17',
          date: new Date().toLocaleDateString(),
          user: 'Ahmed Hassan',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        },
        order_rejected_001: {
          plan: 'Basic - 7 Days',
          planId: 'plan_003',
          status: 'rejected',
          amount: 149,
          originalPrice: 199,
          finalPrice: 149,
          paymentMethod: 'bank_transfer',
          transactionId: 'TXN111222333',
          rejectReason: 'Invalid payment proof - unclear transaction',
          date: new Date().toLocaleDateString(),
          user: 'Ahmed Hassan',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        },
      },
      [TEST_USER_2]: {
        order_pending_002: {
          plan: 'Premium - 30 Days',
          planId: 'plan_001',
          status: 'pending',
          amount: 499,
          originalPrice: 699,
          finalPrice: 499,
          paymentMethod: 'upi',
          transactionId: 'TXN555666777',
          paymentProof: 'https://example.com/proof3.jpg',
          date: new Date().toLocaleDateString(),
          user: 'Fatima Khan',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
        order_approved_002: {
          plan: 'Premium - 30 Days',
          planId: 'plan_001',
          status: 'approved',
          amount: 499,
          originalPrice: 699,
          finalPrice: 499,
          paymentMethod: 'upi',
          transactionId: 'TXN888999000',
          paymentProof: 'https://example.com/proof4.jpg',
          username: 'fatimauser456',
          password: 'pass654321',
          url: 'http://iptv.example.com',
          expiryDate: '2025-06-17',
          date: new Date().toLocaleDateString(),
          user: 'Fatima Khan',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        },
      },
    };

    await set(ordersRef, orders);
    console.log('✅ Test orders created');
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    throw error;
  }
}

/**
 * Seed test notifications in Firestore
 */
async function seedNotifications() {
  try {
    // Create notifications in the correct path: users/{userId}/notifications
    const notifications = [
      // User 1 notifications
      {
        userId: TEST_USER_1,
        title: '✅ Order Created Successfully',
        message: 'Your order for Premium - 30 Days (₹499) has been created and is pending. Your order will be processed shortly.',
        type: 'order_created',
        read: false,
        deleted: false,
        createdAt: Timestamp.now(),
        data: {
          orderId: 'order_pending_001',
          orderAmount: 499,
          orderPlan: 'Premium - 30 Days',
        },
      },
      {
        userId: TEST_USER_1,
        title: '🎉 Order Approved!',
        message: 'Your order for Standard - 15 Days has been approved! Your credentials are ready.',
        type: 'order_accepted',
        read: true,
        deleted: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
        data: {
          orderId: 'order_approved_001',
          orderAmount: 299,
          orderPlan: 'Standard - 15 Days',
          credentials: {
            username: 'ahmeduser123',
            password: 'pass123456',
            url: 'http://iptv.example.com',
            expiryDate: '2025-05-17',
          },
        },
      },
      {
        userId: TEST_USER_1,
        title: '❌ Order Rejected',
        message: 'Your order for Basic - 7 Days has been rejected. Reason: Invalid payment proof - unclear transaction',
        type: 'order_rejected',
        read: true,
        deleted: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
        data: {
          orderId: 'order_rejected_001',
          orderAmount: 149,
          rejectionReason: 'Invalid payment proof - unclear transaction',
        },
      },
      // User 2 notifications
      {
        userId: TEST_USER_2,
        title: '✅ Order Created Successfully',
        message: 'Your order for Premium - 30 Days (₹499) has been created and is pending. Your order will be processed shortly.',
        type: 'order_created',
        read: false,
        deleted: false,
        createdAt: Timestamp.now(),
        data: {
          orderId: 'order_pending_002',
          orderAmount: 499,
          orderPlan: 'Premium - 30 Days',
        },
      },
      {
        userId: TEST_USER_2,
        title: '💰 Referral Reward!',
        message: 'Ahmed Hassan purchased through your referral link! You earned ₹50 reward.',
        type: 'referral',
        read: false,
        deleted: false,
        createdAt: Timestamp.now(),
        data: {
          referrerName: 'Ahmed Hassan',
          referralReward: 50,
        },
      },
    ];

    // Add notifications to each user's notifications collection (correct path)
    for (const notif of notifications) {
      const notifCollection = collection(db, 'users', notif.userId, 'notifications');
      await addDoc(notifCollection, notif);
    }

    console.log('✅ Test notifications created');
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    throw error;
  }
}

/**
 * Clean test data (CAUTION: This will delete test data)
 */
export async function cleanTestData() {
  try {
    console.log('🗑️ Cleaning test data...');

    // Clear test users
    const usersRef = ref(database, `users/${TEST_USER_1}`);
    await set(usersRef, null);

    const usersRef2 = ref(database, `users/${TEST_USER_2}`);
    await set(usersRef2, null);

    // Clear test orders
    const ordersRef = ref(database, `orders/${TEST_USER_1}`);
    await set(ordersRef, null);

    const ordersRef2 = ref(database, `orders/${TEST_USER_2}`);
    await set(ordersRef2, null);

    console.log('✅ Test data cleaned');
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
    throw error;
  }
}

/**
 * Get test data info
 */
export function getTestDataInfo() {
  return {
    users: [
      { id: TEST_USER_1, name: 'Ahmed Hassan', email: 'ahmed@example.com' },
      { id: TEST_USER_2, name: 'Fatima Khan', email: 'fatima@example.com' },
    ],
    testUserIds: [TEST_USER_1, TEST_USER_2],
    adminId: ADMIN_ID,
    adminEmail: 'zainashraf0326@gmail.com',
  };
}
