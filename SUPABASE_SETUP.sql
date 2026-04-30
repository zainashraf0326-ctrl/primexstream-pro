-- ============================================
-- SUPABASE DATABASE SCHEMA FOR PRIMEXSTREAM PRO
-- ============================================
-- Copy all code below and paste into Supabase SQL Editor
-- Path: supabase.com → Project → SQL Editor → New Query

-- ============ USERS TABLE ============
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  auth_provider TEXT DEFAULT 'email', -- 'email', 'google', etc
  auth_id TEXT UNIQUE, -- For OAuth (Google ID, etc)
  password_hash TEXT, -- Only for email/password auth
  wallet_balance DECIMAL(10, 2) DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by_code TEXT, -- Code of who referred them
  is_admin BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active', -- 'active', 'suspended', 'deleted'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- ============ ORDERS TABLE ============
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL, -- 'iptv', 'payment', 'app_installation', 'social_media'
  service_name TEXT, -- e.g., 'IPTV Premium 1 Month'
  amount DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER, -- For subscriptions
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'expired'
  payment_method TEXT, -- 'credit_card', 'wallet', 'paypal', etc
  transaction_id TEXT,
  credentials TEXT, -- JSON: {"username": "...", "password": "..."}
  metadata JSONB, -- Extra data specific to order type
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- ============ NOTIFICATIONS TABLE ============
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error', 'order', 'referral'
  action_url TEXT, -- Link user can click
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

-- ============ ORDER HISTORY TABLE ============
CREATE TABLE IF NOT EXISTS order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'completed', 'failed', 'refunded', etc
  old_status TEXT,
  new_status TEXT,
  notes TEXT,
  admin_id UUID REFERENCES users(id), -- Admin who performed action
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============ REFERRALS TABLE ============
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'joined', -- 'joined', 'purchased', 'reward_claimed'
  reward_amount DECIMAL(10, 2) DEFAULT 5,
  reward_claimed BOOLEAN DEFAULT FALSE,
  claim_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ WALLET TRANSACTIONS TABLE ============
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_type TEXT NOT NULL, -- 'credit', 'debit', 'refund', 'referral_reward'
  description TEXT,
  related_order_id UUID REFERENCES orders(id),
  balance_before DECIMAL(10, 2),
  balance_after DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============ SOCIAL MEDIA TASKS TABLE ============
CREATE TABLE IF NOT EXISTS social_media_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'youtube', 'instagram', 'tiktok', 'facebook', 'twitter', 'telegram'
  username TEXT NOT NULL,
  proof_image_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id)
);

-- ============ APP INSTALLATION TASKS TABLE ============
CREATE TABLE IF NOT EXISTS app_installation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_type TEXT NOT NULL, -- 'admin_app', 'mobile_app', etc
  account_email TEXT,
  account_uid TEXT,
  proof_image_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  credentials_username TEXT,
  credentials_password TEXT,
  reward_given BOOLEAN DEFAULT FALSE,
  attempts_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id)
);

-- ============ SUPPORT TICKETS TABLE ============
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  assigned_to UUID REFERENCES users(id), -- Admin assigned
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- ============ SUPPORT REPLIES TABLE ============
CREATE TABLE IF NOT EXISTS support_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachment_url TEXT,
  is_admin_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============ SUBSCRIPTION PLANS TABLE ============
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  features JSONB, -- {"channels": 10000, "hd": true, ...}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ PAYMENT METHODS TABLE ============
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL, -- 'credit_card', 'upi', 'bank_transfer', 'wallet'
  payment_provider TEXT, -- 'stripe', 'razorpay', 'paypal', etc
  reference_id TEXT, -- Provider's payment method ID
  last_four TEXT, -- Last 4 digits (for cards)
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ AUDIT LOG TABLE ============
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- What happened
  table_name TEXT, -- Which table was affected
  record_id UUID, -- Which record
  old_data JSONB, -- Before values
  new_data JSONB, -- After values
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============ CREATE INDEXES ============
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_social_tasks_user_id ON social_media_tasks(user_id);
CREATE INDEX idx_app_tasks_user_id ON app_installation_tasks(user_id);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- ============ ENABLE ROW LEVEL SECURITY ============
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_installation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- ============ ROW LEVEL SECURITY POLICIES ============

-- Users: Users can only see their own data + admin can see all
CREATE POLICY "Users can view own data" ON users 
  FOR SELECT USING (auth.uid()::text = id::text OR (SELECT is_admin FROM users WHERE id = auth.uid()::uuid) = true);

-- Orders: Users see their own, admin sees all
CREATE POLICY "Users can view own orders" ON orders 
  FOR SELECT USING (auth.uid()::text = user_id::text OR (SELECT is_admin FROM users WHERE id = auth.uid()::uuid) = true);

-- Notifications: Users see their own
CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications" ON notifications 
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Wallet Transactions: Users see their own
CREATE POLICY "Users can view own wallet transactions" ON wallet_transactions 
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- DONE! 
-- After pasting this SQL, proceed to step 2 to create service functions
