# 📚 SUPABASE FUNCTIONS QUICK REFERENCE

## Auth Functions (`supabase-auth-service.ts`)

```typescript
import { 
  signupWithEmail, 
  loginWithEmail, 
  loginWithGoogle,
  logout,
  getCurrentSession,
  sendPasswordResetEmail,
  updatePassword,
  getUserWithProfile
} from '@/lib/supabase-auth-service';

// Signup
const result = await signupWithEmail(email, password, name, phone?);
// Returns: { success, user, profile, message }

// Login with email
const result = await loginWithEmail(email, password);
// Returns: { success, user, session }

// Google Login
const result = await loginWithGoogle();
// Returns: { success, url }

// Logout
await logout();

// Get current session
const { session, user } = await getCurrentSession();

// Send password reset email
await sendPasswordResetEmail(email);

// Update password
await updatePassword(newPassword);

// Get user profile with stats
const { user } = await getUserWithProfile(userId);
```

---

## Data Functions (`supabase-data-service.ts`)

### Users
```typescript
import { 
  createUser,
  getUserById,
  updateUserProfile,
  updateWalletBalance
} from '@/lib/supabase-data-service';

// Create user
await createUser(email, name, phone?);

// Get user by ID
const { data } = await getUserById(userId);

// Update profile
await updateUserProfile(userId, { name, phone, avatar_url });

// Update wallet
await updateWalletBalance(userId, amount, 'credit' | 'debit');
```

### Orders
```typescript
import { 
  createOrder,
  getUserOrders,
  updateOrderStatus
} from '@/lib/supabase-data-service';

// Create order
const { data } = await createOrder(userId, {
  order_type: 'iptv',
  service_name: 'Premium Plan',
  amount: 99.99,
  duration_days: 30,
  payment_method: 'credit_card'
});

// Get all orders for user
const { data: orders } = await getUserOrders(userId, limit?);

// Update order status
await updateOrderStatus(orderId, 'completed', notes?);
```

### Notifications
```typescript
import { 
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount
} from '@/lib/supabase-data-service';

// Create notification
await createNotification(userId, {
  title: 'Order Approved',
  message: 'Your order is ready',
  type: 'success',
  action_url: '/orders/123'
});

// Get user's notifications
const { data } = await getUserNotifications(userId, unreadOnly?);

// Mark as read
await markNotificationAsRead(notificationId);

// Count unread
const { count } = await getUnreadNotificationCount(userId);
```

### Wallet
```typescript
import { getWalletTransactions } from '@/lib/supabase-data-service';

// Get transaction history
const { data } = await getWalletTransactions(userId, limit?);
```

### Referrals
```typescript
import { 
  createReferral,
  getReferrals,
  claimReferralReward
} from '@/lib/supabase-data-service';

// Create referral
await createReferral(referrerId, referredUserId);

// Get all referrals
const { data } = await getReferrals(userId);

// Claim reward (auto-adds to wallet)
await claimReferralReward(referrerId, referralId, amount);
```

### Social Tasks
```typescript
import { 
  submitSocialMediaTask,
  getSocialMediaTasks
} from '@/lib/supabase-data-service';

// Submit task
await submitSocialMediaTask(userId, {
  platform: 'youtube',
  username: '@user',
  proof_image_url: 'https://...'
});

// Get user's tasks
const { data } = await getSocialMediaTasks(userId);
```

### Support
```typescript
import { createSupportTicket } from '@/lib/supabase-data-service';

// Create ticket
await createSupportTicket(userId, {
  subject: 'My issue',
  message: 'Description',
  priority: 'high'
});
```

---

## React Hooks (`useSupabase.ts`)

```typescript
'use client';

import { 
  useSupabaseAutoSave,
  useSupabaseRealtime,
  useSupabaseUpdate,
  useSupabaseDelete
} from '@/lib/useSupabase';

// Auto-save form data (with debounce)
const { saveData, isSaving, error } = useSupabaseAutoSave('orders', userId);
await saveData(formData, 1000); // debounce 1s

// Real-time subscription
const { data, loading, error } = useSupabaseRealtime(
  'notifications',
  { column: 'user_id', value: userId }
);

// Update single record
const { updateRecord, isUpdating, error } = useSupabaseUpdate('users');
await updateRecord(userId, { name: 'New Name' });

// Delete record
const { deleteRecord, isDeleting, error } = useSupabaseDelete('orders');
await deleteRecord(orderId);
```

---

## Database Queries (Direct Supabase)

```typescript
import { supabase } from '@/lib/supabase-config';

// Read
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);

// Insert
const { data } = await supabase
  .from('notifications')
  .insert([{ user_id, title, message }])
  .select();

// Update
const { data } = await supabase
  .from('users')
  .update({ wallet_balance: 100 })
  .eq('id', userId);

// Delete
await supabase
  .from('support_tickets')
  .delete()
  .eq('id', ticketId);

// Complex query
const { data } = await supabase
  .from('orders')
  .select(`
    id,
    status,
    amount,
    user_id,
    users(name, email),
    order_history(count)
  `)
  .eq('status', 'pending');
```

---

## File Upload

```typescript
import { supabase } from '@/lib/supabase-config';

// Upload file
const { data, error } = await supabase.storage
  .from('task-proofs')
  .upload(`${userId}/${filename}`, file);

// Get public URL
const { data } = supabase.storage
  .from('task-proofs')
  .getPublicUrl(filepath);

console.log(data.publicUrl); // https://...
```

---

## Error Handling Pattern

```typescript
import { createOrder } from '@/lib/supabase-data-service';

try {
  const result = await createOrder(userId, orderData);
  
  if (!result.success) {
    console.error('Error:', result.error);
    // Show error toast/alert
    return;
  }
  
  console.log('Order created:', result.data);
  // Show success message
} catch (error) {
  console.error('Unexpected error:', error);
}
```

---

## Data Structure Examples

### User Object
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "wallet_balance": 150.50,
  "referral_code": "REF1A2B3C",
  "referred_by_code": "REF9X8Y7Z",
  "is_admin": false,
  "status": "active",
  "created_at": "2024-01-15T10:00:00Z",
  "last_login": "2024-01-20T15:30:00Z"
}
```

### Order Object
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "order_type": "iptv",
  "service_name": "IPTV Premium 1 Month",
  "amount": 99.99,
  "status": "completed",
  "payment_method": "credit_card",
  "duration_days": 30,
  "credentials": {
    "username": "user123",
    "password": "****"
  },
  "created_at": "2024-01-15T10:00:00Z",
  "expires_at": "2024-02-15T10:00:00Z"
}
```

### Notification Object
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Order Approved",
  "message": "Your IPTV order is ready to use",
  "type": "success",
  "is_read": false,
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

## Common Patterns

### Auto-save form field
```typescript
const { saveData } = useSupabaseAutoSave('orders', userId);

const handleInputChange = (e) => {
  const value = e.target.value;
  saveData({ field_name: value });
};
```

### Check if user is logged in
```typescript
const { user, session } = await getCurrentSession();
if (!user) redirect('/login');
```

### Show user's notifications
```typescript
const { data: notifications } = await useSupabaseRealtime(
  'notifications',
  { column: 'user_id', value: userId }
);
return notifications.map(n => <NotificationCard key={n.id} notif={n} />);
```

### Handle payment and save
```typescript
// Process payment...
const order = await createOrder(userId, {
  order_type: 'iptv',
  amount: price,
  // ...
});
// ✅ Auto-creates notification, saves to DB, logs history
```

---

## What Automatically Happens

When you call these functions, they automatically:
- ✅ Save to database
- ✅ Create notifications to user
- ✅ Log actions in audit trail
- ✅ Update related records (wallet, status, etc)
- ✅ Validate data before saving
- ✅ Handle errors gracefully

**You don't need to write extra code - it's all built in!** 🚀
