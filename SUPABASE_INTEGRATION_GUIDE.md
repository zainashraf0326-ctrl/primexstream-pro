# 🚀 SUPABASE INTEGRATION SETUP GUIDE

## Step 1: Create Supabase Project (5 minutes)

### Create Free Account
1. Go to https://supabase.com
2. Sign up with Email or GitHub
3. Click "New Project"
4. Fill in:
   - **Organization**: Create new (or select existing)
   - **Project Name**: `primexstream-pro`
   - **Database Password**: Strong password (save it!)
   - **Region**: Pick closest to your users (e.g., `us-east-1`)
5. Click "Create new project" and wait 2-3 minutes

### Get API Keys
1. After project loads, click "Settings" (⚙️) → "API"
2. Under "Project API keys", you'll see:
   - **Project URL** (starts with `https://`)
   - **anon public** (long JWT token)
3. Copy both and paste into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 2: Create Database Tables (5 minutes)

### Run SQL Setup Script
1. In Supabase Dashboard, click "SQL Editor"
2. Click "+ New Query"
3. Open file: `SUPABASE_SETUP.sql` in your project
4. Copy **ALL** the SQL code
5. Paste into the SQL editor
6. Click "Run" (blue button, bottom right)

**Wait for success message** ✅

Your database is now ready with all tables!

---

## Step 3: Set Up Authentication (5 minutes)

### Enable Email/Password Auth
1. In Supabase, go to "Authentication" → "Providers"
2. Click on "Email"
3. Toggle ON the email provider
4. Configure email settings if needed

### Enable Google OAuth (Optional)
1. Go to "Authentication" → "Providers"
2. Click "Google"
3. You'll need:
   - Google Cloud credentials (optional for development)
   - For now, you can skip this

---

## Step 4: Use Supabase in Your App

### Example 1: Create a User

```typescript
import { signupWithEmail, loginWithEmail } from '@/lib/supabase-auth-service';

// In your form component:
const handleSignup = async (email: string, password: string, name: string) => {
  const result = await signupWithEmail(email, password, name);
  
  if (result.success) {
    console.log('✅ User created:', result.user);
    console.log('Profile saved to DB:', result.profile);
  } else {
    console.error('❌ Error:', result.error);
  }
};
```

### Example 2: Save an Order

```typescript
import { createOrder } from '@/lib/supabase-data-service';

const handleBuyIPTV = async (userId: string) => {
  const result = await createOrder(userId, {
    order_type: 'iptv',
    service_name: 'IPTV Premium 1 Month',
    amount: 5,
    duration_days: 30,
    payment_method: 'credit_card',
  });

  if (result.success) {
    console.log('✅ Order created:', result.data);
    // Order automatically creates:
    // - Order record in DB
    // - Notification to user
  } else {
    console.error('❌ Error:', result.error);
  }
};
```

### Example 3: Get User's Orders

```typescript
import { getUserOrders } from '@/lib/supabase-data-service';

const fetchMyOrders = async (userId: string) => {
  const result = await getUserOrders(userId);
  
  if (result.success) {
    console.log('📦 Your orders:', result.data);
    // result.data = [
    //   {
    //     id: "uuid",
    //     service_name: "IPTV Premium 1 Month",
    //     amount: 5,
    //     status: "completed",
    //     created_at: "2024-01-15T10:00:00Z"
    //   }
    // ]
  }
};
```

### Example 4: Send Notification

```typescript
import { createNotification } from '@/lib/supabase-data-service';

// When user buys something, auto-notify them:
await createNotification(userId, {
  title: 'Purchase Successful!',
  message: 'Your IPTV plan is now active',
  type: 'success',
  action_url: '/orders/123',
});
```

### Example 5: Update Wallet Balance

```typescript
import { updateWalletBalance } from '@/lib/supabase-data-service';

// Add ₹50 to user's wallet (e.g., referral reward)
const result = await updateWalletBalance(userId, 50, 'credit');

if (result.success) {
  console.log('✅ New balance:', result.newBalance);
}

// Deduct from wallet (e.g., purchase)
const deductResult = await updateWalletBalance(userId, 5, 'debit');
```

### Example 6: Use React Hook for Auto-Save

```typescript
'use client';

import { useSupabaseAutoSave } from '@/lib/useSupabase';

export function MyForm() {
  const { saveData, isSaving, error } = useSupabaseAutoSave('orders', userId);

  const handleFormChange = (formData: any) => {
    // Auto-saves after 1 second of inactivity
    saveData(formData, 1000);
  };

  return (
    <form onChange={(e) => handleFormChange(new FormData(e.currentTarget))}>
      {/* Form fields */}
      {isSaving && <p>💾 Saving...</p>}
      {error && <p style={{color: 'red'}}>❌ {error}</p>}
    </form>
  );
}
```

### Example 7: Listen to Real-Time Updates

```typescript
'use client';

import { useSupabaseRealtime } from '@/lib/useSupabase';

export function NotificationsList() {
  const { data: notifications, loading } = useSupabaseRealtime(
    'notifications',
    { column: 'user_id', value: userId }
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {notifications.map((notif) => (
        <div key={notif.id}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          {!notif.is_read && <span>🔴 NEW</span>}
        </div>
      ))}
    </div>
  );
}
```

### Example 8: Create Referral

```typescript
import { createReferral, getReferrals } from '@/lib/supabase-data-service';

// When user signs up with referral code:
await createReferral(referrerId, newUserId);

// Get all referrals for a user:
const result = await getReferrals(userId);
console.log('My referrals:', result.data);
```

### Example 9: Submit Social Media Task

```typescript
import { submitSocialMediaTask } from '@/lib/supabase-data-service';

const handleSocialTaskSubmit = async (userId: string, platform: string) => {
  const result = await submitSocialMediaTask(userId, {
    platform: 'youtube', // or 'instagram', 'tiktok', etc
    username: '@myaccount',
    proof_image_url: 'https://storage.com/proof.jpg',
  });

  if (result.success) {
    console.log('✅ Task submitted for review!');
  }
};
```

### Example 10: Create Support Ticket

```typescript
import { createSupportTicket } from '@/lib/supabase-data-service';

const handleContactSupport = async (userId: string) => {
  const result = await createSupportTicket(userId, {
    subject: 'My IPTV not working',
    message: 'The service stopped working after 2 days',
    priority: 'high',
  });

  if (result.success) {
    console.log('✅ Ticket created:', result.data.id);
  }
};
```

---

## Step 5: Admin Dashboard Integration

### Approve Orders
```typescript
import { updateOrderStatus } from '@/lib/supabase-data-service';

// Admin approves an order
await updateOrderStatus(orderId, 'completed', 'Account verified');
// ✅ Auto-sends notification to user
// ✅ Logs action in order_history
```

### View All Orders (Admin)
```typescript
// In admin component
const { data: allOrders } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
```

---

## Step 6: Upload Images to Storage (Optional)

### Create Storage Bucket
1. In Supabase, go to "Storage"
2. Click "+ New bucket"
3. Name it `task-proofs`
4. Make it **Public** ✅

### Upload from Client
```typescript
import { supabase } from '@/lib/supabase-config';

const uploadProofImage = async (userId: string, file: File) => {
  const fileName = `${userId}-${Date.now()}.jpg`;
  
  const { data, error } = await supabase.storage
    .from('task-proofs')
    .upload(fileName, file);

  if (error) {
    console.error('Upload failed:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('task-proofs')
    .getPublicUrl(fileName);

  return urlData.publicUrl; // Use this in DB
};
```

---

## Troubleshooting

### ❌ "SUPABASE_URL not configured"
- Make sure `.env.local` is in your project root
- Add your API keys from Supabase
- Restart dev server: `npm run dev`

### ❌ "Table doesn't exist"
- Run the SQL from `SUPABASE_SETUP.sql` again
- Check Supabase SQL Editor for errors

### ❌ "Authentication failed"
- Make sure Email provider is enabled in Auth settings
- Check that user email is verified

### ❌ "RLS policy denied"
- Row Level Security is blocking access
- Admin must set up proper RLS policies (see SUPABASE_SETUP.sql)

---

## What Gets Saved Automatically

✅ **Users** - Name, email, wallet, referral code  
✅ **Orders** - All purchase history with status  
✅ **Notifications** - All alerts and messages  
✅ **Wallet Transactions** - Every credit/debit  
✅ **Referrals** - All referral relationships  
✅ **Social Tasks** - Platform follows + approval status  
✅ **Support Tickets** - All help requests  
✅ **Order History** - Complete audit trail  

---

## Next Steps

1. ✅ Create Supabase project
2. ✅ Run SQL setup
3. ✅ Add API keys to .env.local
4. ✅ Use services in your components
5. Go to "admin" dashboard to verify data is saved!

**Questions?** Check the example code above or Supabase docs: https://supabase.com/docs
