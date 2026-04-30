# ✅ SUPABASE SETUP CHECKLIST

## Phase 1: Supabase Project Setup (5 minutes)

- [ ] Go to https://supabase.com
- [ ] Create free account (GitHub or Email)
- [ ] Create new project
  - [ ] Project Name: `primexstream-pro`
  - [ ] Password: Create strong password (save it!)
  - [ ] Region: Pick closest to users
- [ ] Wait for project to initialize (2-3 minutes)
- [ ] Go to Settings → API
- [ ] Copy **Project URL** 
- [ ] Copy **anon public** key

## Phase 2: Add Environment Variables (2 minutes)

- [ ] Open `.env.local` file in project root
- [ ] Paste your API keys:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- [ ] Save file
- [ ] Restart dev server: `npm run dev`

## Phase 3: Create Database Schema (5 minutes)

- [ ] Go to Supabase Dashboard
- [ ] Click "SQL Editor"
- [ ] Click "+ New Query"
- [ ] Open file: `SUPABASE_SETUP.sql`
- [ ] Copy ALL the SQL code
- [ ] Paste into Supabase SQL editor
- [ ] Click "Run" (blue button)
- [ ] Wait for ✅ "Successfully executed" message
- [ ] Verify all 11 tables created:
  - [ ] users
  - [ ] orders
  - [ ] notifications
  - [ ] order_history
  - [ ] referrals
  - [ ] wallet_transactions
  - [ ] social_media_tasks
  - [ ] app_installation_tasks
  - [ ] support_tickets
  - [ ] support_replies
  - [ ] subscription_plans

## Phase 4: Enable Authentication (3 minutes)

- [ ] In Supabase, go to "Authentication"
- [ ] Click "Providers"
- [ ] Enable **Email** provider (toggle ON)
- [ ] Configure if needed (usually no changes needed)
- [ ] (Optional) Enable **Google** OAuth later

## Phase 5: Test Files Exist (1 minute)

Check these files were created:
- [ ] `src/lib/supabase-config.ts` ✅ (already exists)
- [ ] `src/lib/supabase-auth-service.ts` ✅ (new)
- [ ] `src/lib/supabase-data-service.ts` ✅ (new)
- [ ] `src/lib/useSupabase.ts` ✅ (new)
- [ ] `SUPABASE_SETUP.sql` ✅ (new)
- [ ] `SUPABASE_INTEGRATION_GUIDE.md` ✅ (new)
- [ ] `SUPABASE_FUNCTIONS_REFERENCE.md` ✅ (new)

## Phase 6: Verify App Works (5 minutes)

- [ ] Terminal: `npm run dev`
- [ ] Open http://localhost:3000
- [ ] App loads without errors ✅
- [ ] No "Supabase not configured" warnings

## Phase 7: Test Signup/Login (5 minutes)

- [ ] Try to sign up with test email
- [ ] Check Supabase → Authentication → Users (should see new user)
- [ ] Try to log in with same email/password
- [ ] Check Supabase → users table (should see profile data)

## Phase 8: Test Create Order (5 minutes)

- [ ] Log in to your app
- [ ] Buy IPTV subscription
- [ ] Go to Supabase → orders table
- [ ] Verify new order appears ✅
- [ ] Check notifications table for notification ✅

## Phase 9: Test Wallet (3 minutes)

- [ ] Go to Wallet page
- [ ] Add funds
- [ ] Go to Supabase → wallet_transactions table
- [ ] Verify transaction appears ✅

## Phase 10: Test Notifications (2 minutes)

- [ ] Go to Notifications
- [ ] Should see:
  - [ ] Signup notification (if new user)
  - [ ] Order notification
  - [ ] Wallet transaction notification
- [ ] Mark one as read
- [ ] Go to Supabase → notifications table → verify is_read = true

## Phase 11: View Admin Dashboard (3 minutes)

- [ ] Go to `/admin` dashboard (or login as admin)
- [ ] Go to Orders section
- [ ] Should see your test order ✅
- [ ] Approve the order
- [ ] Check user's notification → should get "approved" notification ✅

## Phase 12: Test Referrals (Optional, 5 minutes)

- [ ] Create referral code
- [ ] Share with another user
- [ ] Sign up with referral code
- [ ] Go to Supabase → referrals table
- [ ] Verify referral relationship ✅

## Phase 13: Test Social Tasks (Optional, 5 minutes)

- [ ] Go to Earn page → Social Media task
- [ ] Submit social task
- [ ] Go to Supabase → social_media_tasks table
- [ ] Verify task appears with status="pending" ✅

## Phase 14: Deploy (When Ready)

- [ ] Test everything works locally ✅
- [ ] Commit to Git
- [ ] Deploy to Vercel/hosting
- [ ] Update `NEXT_PUBLIC_APP_URL` for production
- [ ] Add Supabase to `.env.production`

---

## 🎯 Success Criteria

If all of these are checked ✅:
- ✅ Database schema created
- ✅ Users can sign up/login
- ✅ Orders appear in database
- ✅ Notifications appear in database
- ✅ Admin can see all data
- ✅ App builds without errors
- ✅ No console errors

**You're done! Supabase is fully integrated!** 🚀

---

## 📞 Troubleshooting

**Problem: "Supabase is not configured"**
- [ ] Check `.env.local` has both keys
- [ ] Restart dev server
- [ ] Check keys are correct (copy-paste again)

**Problem: SQL fails to run**
- [ ] Check you're in correct project
- [ ] Copy-paste entire SQL file again
- [ ] Try running line by line

**Problem: User signup fails**
- [ ] Check Email provider is enabled in Auth
- [ ] Check user email is valid format
- [ ] Check .env.local has correct keys

**Problem: No data in database**
- [ ] Check you're looking at correct table
- [ ] Check RLS policies (should be set in SQL)
- [ ] Check user_id matches actual user

---

## 💬 Questions?

1. Read: `SUPABASE_INTEGRATION_GUIDE.md`
2. Check: `SUPABASE_FUNCTIONS_REFERENCE.md`
3. Visit: https://supabase.com/docs

---

**Date Started**: [Fill in]
**Phase Completed**: [ ]
**Date Completed**: [Fill in]

Good luck! 🎉
