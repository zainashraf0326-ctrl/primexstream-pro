# ✅ SUPABASE INTEGRATION - COMPLETE SETUP

## What You Now Have

Your Next.js app now has **complete Supabase integration** to save:
- ✅ **Users** - Profiles, wallet, referral codes
- ✅ **Orders** - IPTV purchases, service history
- ✅ **Notifications** - All alerts to users
- ✅ **Wallet** - Balance & transaction history
- ✅ **Referrals** - All referral relationships & rewards
- ✅ **Social Tasks** - Platform follow submissions
- ✅ **Support Tickets** - Help requests & replies
- ✅ **Order History** - Complete audit trail

---

## 📋 QUICK START (3 Simple Steps)

### Step 1: Get Supabase API Keys (5 min)
1. Go to https://supabase.com → Create project
2. Wait for project to initialize
3. Go to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Paste into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 2: Create Database (5 min)
1. In Supabase → SQL Editor → New Query
2. Copy **ALL** code from `SUPABASE_SETUP.sql`
3. Paste in editor
4. Click "Run" ✅

### Step 3: Start Using (Immediately!)
```typescript
import { createOrder } from '@/lib/supabase-data-service';

// Wherever user buys something:
const result = await createOrder(userId, {
  order_type: 'iptv',
  service_name: 'Premium Plan',
  amount: 99.99,
  duration_days: 30,
});
// ✅ Auto-saves to DB + sends notification!
```

---

## 📁 Files Created

### Database Setup
- `SUPABASE_SETUP.sql` - Complete database schema (11 tables)

### Service Functions
- `src/lib/supabase-auth-service.ts` - User authentication
- `src/lib/supabase-data-service.ts` - All CRUD operations
- `src/lib/useSupabase.ts` - React hooks for data

### Configuration
- `.env.local.example` - Environment variables template
- `SUPABASE_INTEGRATION_GUIDE.md` - Step-by-step guide
- `SUPABASE_FUNCTIONS_REFERENCE.md` - Complete API reference

---

## 🚀 Usage Examples

### User Signup
```typescript
import { signupWithEmail } from '@/lib/supabase-auth-service';

const result = await signupWithEmail(
  'user@example.com',
  'password123',
  'John Doe',
  '+1234567890'
);

if (result.success) {
  console.log('✅ User created and profile saved!');
}
```

### Create Order
```typescript
import { createOrder } from '@/lib/supabase-data-service';

await createOrder(userId, {
  order_type: 'iptv',
  service_name: 'IPTV Premium 1 Month',
  amount: 5,
  duration_days: 30,
  payment_method: 'credit_card'
});
// ✅ Order + notification auto-created
```

### Send Notification
```typescript
import { createNotification } from '@/lib/supabase-data-service';

await createNotification(userId, {
  title: 'Order Approved!',
  message: 'Your IPTV is ready to use',
  type: 'success'
});
```

### Get User's Orders
```typescript
import { getUserOrders } from '@/lib/supabase-data-service';

const { data: orders } = await getUserOrders(userId);
```

### Update Wallet
```typescript
import { updateWalletBalance } from '@/lib/supabase-data-service';

// Add ₹50 to wallet
await updateWalletBalance(userId, 50, 'credit');

// Deduct ₹5 from wallet
await updateWalletBalance(userId, 5, 'debit');
```

### React Hook - Real-time Updates
```typescript
'use client';
import { useSupabaseRealtime } from '@/lib/useSupabase';

export function Notifications() {
  const { data: notifications } = useSupabaseRealtime(
    'notifications',
    { column: 'user_id', value: userId }
  );

  return notifications.map(n => (
    <div key={n.id}>{n.message}</div>
  ));
}
```

### React Hook - Auto-save Form
```typescript
'use client';
import { useSupabaseAutoSave } from '@/lib/useSupabase';

export function MyForm() {
  const { saveData, isSaving } = useSupabaseAutoSave('orders', userId);

  const handleChange = (formData) => {
    saveData(formData); // Auto-saves after 1 second
  };

  return (
    <form onChange={handleChange}>
      {isSaving && <p>💾 Saving...</p>}
    </form>
  );
}
```

---

## 📊 Database Tables (11 Tables)

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **users** | User profiles | email, name, wallet_balance, referral_code |
| **orders** | All purchases | user_id, status, amount, service_name |
| **notifications** | Alerts to users | user_id, title, message, is_read |
| **order_history** | Audit trail | order_id, action, old_status, new_status |
| **referrals** | Referral rewards | referrer_id, status, reward_amount |
| **wallet_transactions** | Money movements | user_id, amount, type (credit/debit) |
| **social_media_tasks** | Social follow tasks | user_id, platform, status |
| **app_installation_tasks** | App install tasks | user_id, app_type, status |
| **support_tickets** | Help requests | user_id, subject, status |
| **support_replies** | Support messages | ticket_id, message, is_admin_reply |
| **subscription_plans** | IPTV plans | name, duration_days, price |

---

## 🔒 Security Features

✅ **Row Level Security (RLS)** - Users only see their own data
✅ **Audit Logging** - All actions tracked
✅ **Password Hashing** - Secure storage
✅ **Email Verification** - Verify user ownership
✅ **Rate Limiting** - Built into Supabase (free tier)

---

## 🧪 Testing Checklist

- [ ] Add `.env.local` with API keys
- [ ] Run SQL setup in Supabase
- [ ] Start dev server: `npm run dev`
- [ ] Try user signup
- [ ] Create an order
- [ ] Check Supabase dashboard → see new data
- [ ] Get user's orders
- [ ] Update wallet balance
- [ ] Send notification

---

## ❓ Common Questions

**Q: Do I need to write SQL?**
A: No! Just copy-paste the SQL setup once. All data operations use pre-built functions.

**Q: Is this production-ready?**
A: Yes! All security best practices included.

**Q: How much does Supabase cost?**
A: Free tier includes 500MB DB + 1GB storage. Perfect for getting started.

**Q: Can I add more tables later?**
A: Yes! Just add to the SQL and run it. Your app functions will still work.

**Q: How do I display user data in components?**
A: Use the React hooks (`useSupabaseRealtime`, etc) or call service functions.

---

## 📖 Documentation

1. **Setup Guide**: `SUPABASE_INTEGRATION_GUIDE.md`
2. **API Reference**: `SUPABASE_FUNCTIONS_REFERENCE.md`
3. **Database Schema**: `SUPABASE_SETUP.sql`

---

## 🎯 Next Steps

1. Create Supabase project
2. Add API keys to `.env.local`
3. Run SQL setup
4. Start calling functions in your components
5. Check Supabase dashboard to see data being saved

**Everything is ready to use!** 🚀

---

## Support

- Supabase Docs: https://supabase.com/docs
- This app uses Supabase v2 with Next.js 14+
- All functions are in `src/lib/`

**Happy coding!** ✨
