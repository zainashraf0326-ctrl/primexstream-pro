import {
  get,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from 'firebase/database';
import {
  createOrder as legacyCreateOrder,
  getAllOrders as legacyGetAllOrders,
  getUserOrders as legacyGetUserOrders,
  listenToAllOrders as legacyListenToAllOrders,
  listenToUserOrders as legacyListenToUserOrders,
  updateOrder as legacyUpdateOrder,
} from '@/lib/supabase-service';
import {
  createNotification,
  getAdminUserId,
  notifyOrderCreated,
} from '@/lib/supabase-notifications';
import { isFirebaseConfigured } from './firebaseClient';
import { assertFirebaseConfigured, database } from './firebaseClient';

function getDatabaseRef(path) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured for Realtime Database access.');
  }

  assertFirebaseConfigured();
  return ref(database, path);
}

function ensureObject(value) {
  return value && typeof value === 'object' ? value : {};
}

function sortByCreatedAtDesc(items) {
  return [...items].sort((first, second) => {
    const firstTime = new Date(first.createdAt || 0).getTime();
    const secondTime = new Date(second.createdAt || 0).getTime();
    return secondTime - firstTime;
  });
}

function generateReferralCode() {
  return `REF${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function formatErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error && typeof error === 'object') {
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== '{}') {
        return serialized;
      }
    } catch {}
  }

  return fallbackMessage;
}

function buildDefaultUserData(profile = {}) {
  return {
    name: profile.name || 'User',
    email: profile.email || '',
    referralCode: profile.referralCode || generateReferralCode(),
    referredBy: profile.referredBy || '',
    totalReferrals: Number(profile.totalReferrals || 0),
    credits: Number(profile.credits || 0),
    walletBalance: Number(profile.walletBalance || 0),
    usableBalance: Number(profile.usableBalance || 0),
    createdAt: profile.createdAt || new Date().toISOString(),
    orders: {},
    notifications: {},
    adminReplies: {},
  };
}

function isGuestUid(uid) {
  return typeof uid === 'string' && uid.startsWith('guest_');
}

async function notifyAdminOnly(order, orderOwnerName) {
  const adminId = await getAdminUserId();
  if (!adminId) return;

  await createNotification(
    adminId,
    'admin',
    'New Order',
    `${orderOwnerName} ordered ${order.planName || order.plan || 'Plan'} for ${Number(
      order.finalPrice || order.amount || 0
    )}`,
    {
      orderId: order.id,
      orderAmount: Number(order.finalPrice || order.amount || 0),
      orderPlan: order.planName || order.plan || 'Plan',
    },
    '/admin/orders'
  );
}

async function notifyOrderCreatedForFlow(uid, order, orderOwnerName) {
  if (!uid || isGuestUid(uid) || order.isGuest) {
    await notifyAdminOnly(order, orderOwnerName);
    return;
  }

  await notifyOrderCreated(uid, orderOwnerName, {
    orderId: order.id,
    planName: order.planName || order.plan || 'Plan',
    amount: Number(order.finalPrice || order.amount || 0),
  });
}

function queueOrderCreatedNotification(uid, order, orderOwnerName) {
  void notifyOrderCreatedForFlow(uid, order, orderOwnerName).catch((error) => {
    console.warn(
      'Order notification failed:',
      formatErrorMessage(error, 'Unknown order notification error')
    );
  });
}

function normalizeOrder(uid, orderId, order, userProfile = {}) {
  const credentials = order.credentials || null;

  return {
    id: orderId,
    userId: uid,
    userEmail: order.userEmail || order.email || userProfile.email || '',
    planId: order.planId || order.plan_id || '',
    planName: order.planName || order.plan || '',
    plan: order.planName || order.plan || '',
    amount: Number(order.amount || order.finalPrice || order.final_price || 0),
    finalPrice: Number(order.finalPrice || order.final_price || order.amount || 0),
    status: order.status || 'pending',
    paymentMethod: order.paymentMethod || order.payment_method || '',
    paymentProof: order.paymentProof || order.paymentProofUrl || order.payment_proof_url || '',
    paymentProofPath: order.paymentProofPath || order.payment_proof_path || '',
    transactionId: order.transactionId || order.transaction_id || '',
    rejectReason: order.rejectReason || order.reject_reason || '',
    username: order.username || credentials?.username || '',
    password: order.password || credentials?.password || '',
    url: order.url || credentials?.url || '',
    expiryDate: order.expiryDate || order.expiry_date || credentials?.expiryDate || '',
    credentials,
    description: order.description || '',
    isGuest: Boolean(order.isGuest || order.is_guest),
    guestEmail: order.guestEmail || '',
    guestName: order.guestName || '',
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
  };
}

function normalizeReply(replyId, reply) {
  return {
    id: replyId,
    title: reply.title || 'Admin reply',
    message: reply.message || '',
    status: reply.status || 'info',
    orderId: reply.orderId || '',
    createdAt: reply.createdAt || new Date().toISOString(),
  };
}

function mapCollection(collection = {}, mapper) {
  return sortByCreatedAtDesc(
    Object.entries(ensureObject(collection)).map(([id, value]) => mapper(id, value))
  );
}

export async function ensureUserProfile(uid, profile = {}) {
  if (!isFirebaseConfigured) {
    return buildDefaultUserData(profile);
  }

  const userRef = getDatabaseRef(`users/${uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    const nextUser = buildDefaultUserData(profile);
    await set(userRef, nextUser);
    return nextUser;
  }

  const existingUser = ensureObject(snapshot.val());
  const nextUser = {
    name: existingUser.name || profile.name || 'User',
    email: existingUser.email || profile.email || '',
    referralCode:
      existingUser.referralCode || profile.referralCode || generateReferralCode(),
    referredBy: existingUser.referredBy || profile.referredBy || '',
    totalReferrals: Number(existingUser.totalReferrals || profile.totalReferrals || 0),
    credits: Number(existingUser.credits || profile.credits || 0),
    walletBalance: Number(existingUser.walletBalance || profile.walletBalance || 0),
    usableBalance: Number(existingUser.usableBalance || profile.usableBalance || 0),
    createdAt: existingUser.createdAt || profile.createdAt || new Date().toISOString(),
    orders: ensureObject(existingUser.orders),
    notifications: ensureObject(existingUser.notifications),
    adminReplies: ensureObject(existingUser.adminReplies),
  };

  await update(userRef, nextUser);
  return nextUser;
}

export async function getUserData(uid) {
  if (!isFirebaseConfigured) {
    return {
      name: 'User',
      email: '',
      orders: {},
      notifications: {},
      adminReplies: {},
    };
  }

  const snapshot = await get(getDatabaseRef(`users/${uid}`));
  if (!snapshot.exists()) return null;

  const user = ensureObject(snapshot.val());
  return {
    name: user.name || 'User',
    email: user.email || '',
    referralCode: user.referralCode || '',
    referredBy: user.referredBy || '',
    totalReferrals: Number(user.totalReferrals || 0),
    orders: ensureObject(user.orders),
    notifications: ensureObject(user.notifications),
    adminReplies: ensureObject(user.adminReplies),
  };
}

export async function updateUserProfile(uid, updates = {}) {
  if (!isFirebaseConfigured) {
    return;
  }

  await ensureUserProfile(uid, updates);
  await update(getDatabaseRef(`users/${uid}`), {
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.email !== undefined ? { email: updates.email } : {}),
  });
}

export async function createOrder(uid, orderData) {
  if (!isFirebaseConfigured) {
    const order = await legacyCreateOrder(uid, orderData);
    const normalizedOrder = normalizeOrder(uid, order.id, order, {
      email: orderData.userEmail || orderData.email || orderData.guestEmail || '',
    });

    queueOrderCreatedNotification(
      uid,
      normalizedOrder,
      orderData.userName || orderData.user || orderData.guestName || 'User'
    );

    return normalizedOrder;
  }

  const profile = await ensureUserProfile(uid, {
    name: orderData.user || orderData.userName || orderData.guestName || 'User',
    email: orderData.userEmail || orderData.email || orderData.guestEmail || '',
  });

  const ordersRef = getDatabaseRef(`users/${uid}/orders`);
  const orderRef = push(ordersRef);
  const timestamp = new Date().toISOString();

  const normalizedOrder = {
    ...orderData,
    id: orderRef.key,
    status: orderData.status || 'pending',
    paymentProof:
      orderData.paymentProof ||
      orderData.paymentProofUrl ||
      orderData.payment_proof_url ||
      '',
    paymentProofPath:
      orderData.paymentProofPath || orderData.payment_proof_path || '',
    createdAt: orderData.createdAt || timestamp,
    updatedAt: timestamp,
  };

  await set(orderRef, normalizedOrder);
  const createdOrder = normalizeOrder(uid, orderRef.key, normalizedOrder, {
    email:
      orderData.userEmail ||
      orderData.email ||
      orderData.guestEmail ||
      profile.email ||
      '',
  });

  queueOrderCreatedNotification(
    uid,
    createdOrder,
    orderData.userName || orderData.user || orderData.guestName || profile.name || 'User'
  );

  return createdOrder;
}

export async function updateOrder(uid, orderId, updates = {}) {
  if (!isFirebaseConfigured) {
    await legacyUpdateOrder(uid, orderId, updates);
    return;
  }

  const payload = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (payload.credentials) {
    payload.username = payload.credentials.username || '';
    payload.password = payload.credentials.password || '';
    payload.url = payload.credentials.url || '';
    payload.expiryDate = payload.credentials.expiryDate || '';
  }

  await update(getDatabaseRef(`users/${uid}/orders/${orderId}`), payload);
}

export async function getUserOrders(uid) {
  if (!isFirebaseConfigured) {
    return legacyGetUserOrders(uid);
  }

  const userData = await getUserData(uid);
  if (!userData) return [];
  return mapCollection(userData.orders, (orderId, order) =>
    normalizeOrder(uid, orderId, order, userData)
  );
}

export function subscribeToUserData(uid, callback) {
  if (!isFirebaseConfigured) {
    callback({
      name: 'User',
      email: '',
      orders: {},
      notifications: {},
      adminReplies: {},
    });
    return () => {};
  }

  const userRef = getDatabaseRef(`users/${uid}`);

  const unsubscribe = onValue(userRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const user = ensureObject(snapshot.val());
    callback({
      name: user.name || 'User',
      email: user.email || '',
      referralCode: user.referralCode || '',
      referredBy: user.referredBy || '',
      totalReferrals: Number(user.totalReferrals || 0),
      orders: ensureObject(user.orders),
      notifications: ensureObject(user.notifications),
      adminReplies: ensureObject(user.adminReplies),
    });
  });

  return unsubscribe;
}

export function subscribeToUserOrders(uid, callback) {
  if (!isFirebaseConfigured) {
    return legacyListenToUserOrders(uid, callback);
  }

  const ordersRef = getDatabaseRef(`users/${uid}/orders`);

  const unsubscribe = onValue(ordersRef, async (snapshot) => {
    const userData = (await getUserData(uid)) || { email: '', orders: {} };
    const orders = mapCollection(snapshot.val(), (orderId, order) =>
      normalizeOrder(uid, orderId, order, userData)
    );
    callback(orders);
  });

  return unsubscribe;
}

export async function addNotification(uid, notification) {
  if (!isFirebaseConfigured) {
    return { id: `${Date.now()}`, ...notification };
  }

  const notificationsRef = getDatabaseRef(`users/${uid}/notifications`);
  const notificationRef = push(notificationsRef);
  const payload = {
    ...notification,
    createdAt: notification.createdAt || new Date().toISOString(),
  };

  await set(notificationRef, payload);
  return { id: notificationRef.key, ...payload };
}

export async function addAdminReply(uid, reply) {
  if (!isFirebaseConfigured) {
    return normalizeReply(`${Date.now()}`, reply);
  }

  const repliesRef = getDatabaseRef(`users/${uid}/adminReplies`);
  const replyRef = push(repliesRef);
  const payload = {
    ...reply,
    createdAt: reply.createdAt || new Date().toISOString(),
  };

  await set(replyRef, payload);
  return normalizeReply(replyRef.key, payload);
}

export function subscribeToAdminReplies(uid, callback) {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const repliesRef = getDatabaseRef(`users/${uid}/adminReplies`);

  const unsubscribe = onValue(repliesRef, (snapshot) => {
    callback(mapCollection(snapshot.val(), normalizeReply));
  });

  return unsubscribe;
}

export async function getAllOrders() {
  if (!isFirebaseConfigured) {
    return legacyGetAllOrders();
  }

  const snapshot = await get(getDatabaseRef('users'));
  if (!snapshot.exists()) return [];

  const users = ensureObject(snapshot.val());
  const orders = [];

  Object.entries(users).forEach(([uid, userData]) => {
    const profile = ensureObject(userData);
    const userOrders = ensureObject(profile.orders);

    Object.entries(userOrders).forEach(([orderId, order]) => {
      orders.push(normalizeOrder(uid, orderId, order, profile));
    });
  });

  return sortByCreatedAtDesc(orders);
}

export function subscribeToAllOrders(callback) {
  if (!isFirebaseConfigured) {
    return legacyListenToAllOrders(callback);
  }

  const usersRef = getDatabaseRef('users');

  const unsubscribe = onValue(usersRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const users = ensureObject(snapshot.val());
    const orders = [];

    Object.entries(users).forEach(([uid, userData]) => {
      const profile = ensureObject(userData);
      const userOrders = ensureObject(profile.orders);

      Object.entries(userOrders).forEach(([orderId, order]) => {
        orders.push(normalizeOrder(uid, orderId, order, profile));
      });
    });

    callback(sortByCreatedAtDesc(orders));
  });

  return unsubscribe;
}

export async function getOrderById(orderId, userId) {
  if (!isFirebaseConfigured) {
    const orders = await legacyGetAllOrders();
    return (
      orders.find((order) =>
        userId ? order.id === orderId && order.userId === userId : order.id === orderId
      ) || null
    );
  }

  if (userId) {
    const userData = await getUserData(userId);
    const order = userData?.orders?.[orderId];
    return order ? normalizeOrder(userId, orderId, order, userData) : null;
  }

  const orders = await getAllOrders();
  return orders.find((order) => order.id === orderId) || null;
}

export async function transferUserData(sourceUid, targetUid, targetProfile = {}) {
  if (!isFirebaseConfigured) {
    return buildDefaultUserData(targetProfile);
  }

  if (!sourceUid || !targetUid || sourceUid === targetUid) {
    return ensureUserProfile(targetUid, targetProfile);
  }

  const [sourceSnapshot, targetSnapshot] = await Promise.all([
    get(getDatabaseRef(`users/${sourceUid}`)),
    get(getDatabaseRef(`users/${targetUid}`)),
  ]);

  const sourceUser = sourceSnapshot.exists()
    ? ensureObject(sourceSnapshot.val())
    : buildDefaultUserData(targetProfile);
  const targetUser = targetSnapshot.exists()
    ? ensureObject(targetSnapshot.val())
    : buildDefaultUserData(targetProfile);

  const mergedUser = {
    name: targetProfile.name || targetUser.name || sourceUser.name || 'User',
    email: targetProfile.email || targetUser.email || sourceUser.email || '',
    orders: {
      ...ensureObject(sourceUser.orders),
      ...ensureObject(targetUser.orders),
    },
    notifications: {
      ...ensureObject(sourceUser.notifications),
      ...ensureObject(targetUser.notifications),
    },
    adminReplies: {
      ...ensureObject(sourceUser.adminReplies),
      ...ensureObject(targetUser.adminReplies),
    },
  };

  await set(getDatabaseRef(`users/${targetUid}`), mergedUser);
  await remove(getDatabaseRef(`users/${sourceUid}`));

  return mergedUser;
}
