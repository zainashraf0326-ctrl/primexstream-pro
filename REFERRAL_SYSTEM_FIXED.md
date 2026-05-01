# Referral System - Testing & Setup Guide

## 🎯 What Was Fixed

The referral system now works properly between User A and User B:
- ✅ Users get unique referral codes on signup
- ✅ Codes are stored in Supabase with proper UUIDs
- ✅ Referral codes can be applied between users
- ✅ Rewards are tracked correctly

## ⚙️ Required Configuration

### Supabase Setup
Ensure these environment variables are set:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database Tables Required
Run this SQL in Supabase to ensure tables exist:
```sql
-- Users table with referral support
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'User',
  email TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  credits NUMERIC(12,2) NOT NULL DEFAULT 0,
  usable_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  wallet_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_uid UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referrer_name TEXT,
  referrer_email TEXT,
  referred_uid UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_name TEXT,
  referred_email TEXT,
  referral_code TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purchased_plan BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_at TIMESTAMPTZ,
  purchased_plan_name TEXT,
  reward_amount NUMERIC(12,2) NOT NULL DEFAULT 5,
  reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined','purchased','claimed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_unique_pair ON public.referrals(referrer_uid, referred_uid);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_uid);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_uid);
```

## 🧪 Testing Steps

### Step 1: Create User A (Referrer)
1. **Incognito Window 1** - Open http://localhost:3000/login
2. Click **"Create an account"**
3. Fill in:
   - Name: "User A"
   - Email: "usera@test.com"
   - Password: "Test@123456"
4. Click **"Create account"**
5. ✅ **Verify**: Redirected to dashboard
6. Go to **Earn** page (left menu)
7. **Note**: Your referral code (format: REF + 8 uppercase alphanumeric characters)
8. **Example**: REF7K9M2X5B

### Step 2: Create User B (Referee)
1. **Incognito Window 2** - Open http://localhost:3000/login
2. Click **"Create an account"**
3. Fill in:
   - Name: "User B"
   - Email: "userb@test.com"
   - Password: "Test@123456"
4. Go to **Earn** page immediately after signup
5. In the **"Apply Referral Code"** section:
   - Paste User A's code (e.g., REF7K9M2X5B)
6. Click **"Apply Code"**
7. ✅ **Expected Result**: Success message "You're now part of [User A's name] team!"

### Step 3: Verify in User A's Dashboard
1. **Switch to Window 1** (User A)
2. Go to **Earn** page
3. **In "Your Referrals" section**:
   - Should see User B listed under "Joined" status
   - Shows: Name, Email, Status badge

### Step 4: Verify in Database (Optional)
```sql
-- Check User A's profile
SELECT id, email, referral_code, total_referrals FROM users WHERE email = 'usera@test.com';

-- Check User B's profile
SELECT id, email, referred_by FROM users WHERE email = 'userb@test.com';

-- Check referral record
SELECT * FROM referrals WHERE referrer_uid = (SELECT id FROM users WHERE email = 'usera@test.com');
```

## 🐛 Troubleshooting

### Issue: "Invalid referral code"
- **Cause**: Code not found in Supabase users table
- **Fix**: Ensure User A's profile exists with referral_code field populated
- **Check**: `SELECT id, referral_code FROM users WHERE email = 'usera@test.com';`

### Issue: "Failed to apply referral code"
- **Cause**: User B's profile doesn't exist in Supabase yet
- **Fix**: Clear browser cache and try again, or check auth is creating user profile
- **Check console**: Look for error logs in browser DevTools Console tab

### Issue: "A referral code has already been applied to this account"
- **Expected**: User B can only apply ONE referral code ever
- **To reset**: Delete the referral record from the database

### Issue: User not found in Supabase
- **Cause**: Auth user exists but profile not created
- **Fix**: Check that `signUpWithSupabase` is being called (not old Firebase auth)
- **Log**: Check server logs for "User synced to Supabase" message

## 📋 Changed Files

1. **src/services/supabaseAuthWrapper.ts** (NEW)
   - Supabase-based auth with automatic profile creation
   
2. **src/app/login/page.tsx**
   - Switched from Firebase to Supabase auth
   
3. **src/components/modals/PostPaymentSignupModal.tsx**
   - Updated to Supabase auth
   
4. **src/lib/supabase-referral-service.ts**
   - Improved error handling and validation
   - Better referral code generation
   
5. **src/services/authService.js**
   - Added Supabase sync for backward compatibility

## 🚀 Next Steps (Optional)

- [ ] Update admin login to use Supabase auth
- [ ] Add referral reward claiming workflow
- [ ] Add email notifications for successful referrals
- [ ] Add referral statistics dashboard
- [ ] Migrate existing Firebase users to Supabase

## 📞 Support

If referral codes still don't work:
1. Check browser console (F12) for error messages
2. Check server logs for sync issues
3. Verify Supabase credentials in .env.local
4. Ensure database tables exist (run SQL above)
5. Check that you're using NEW signup (not old Firebase auth)
