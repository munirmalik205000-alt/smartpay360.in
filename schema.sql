-- PostgreSQL Database Schema for SmartPay 360 (Supabase)
-- Execute this script in the SQL Editor of your Supabase Dashboard to create all required tables.

-- 1. Create USERS Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR,
  sponsor_id VARCHAR,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  transaction_pin VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  mobile VARCHAR,
  state VARCHAR NOT NULL,
  referral_code VARCHAR NOT NULL,
  referrer_id VARCHAR,
  role VARCHAR NOT NULL DEFAULT 'USER',
  wallets JSONB NOT NULL,
  wallet_balance NUMERIC DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  status VARCHAR NOT NULL DEFAULT 'pending',
  level INTEGER NOT NULL DEFAULT 1,
  rank VARCHAR DEFAULT 'Level 1 Partner',
  joined_at VARCHAR NOT NULL,
  is_activated BOOLEAN NOT NULL DEFAULT FALSE,
  self_pv NUMERIC NOT NULL DEFAULT 0,
  coin_usable_percent NUMERIC NOT NULL DEFAULT 10,
  bank_details JSONB,
  kyc_details JSONB,
  rewards JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1b. Create REFERRALS Table
CREATE TABLE IF NOT EXISTS referrals (
  id VARCHAR PRIMARY KEY,
  referrer_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  referred_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1c. Create MLM_INCOME Table
CREATE TABLE IF NOT EXISTS mlm_income (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  from_user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  commission_type VARCHAR NOT NULL,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create TRANSACTIONS Table
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  wallet_type VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending',
  created_at VARCHAR NOT NULL
);

-- 3. Create WITHDRAWAL_REQUESTS Table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  created_at VARCHAR NOT NULL,
  bank_details JSONB NOT NULL
);

-- 3b. Create WITHDRAWALS Table (Explicit alternate table)
CREATE TABLE IF NOT EXISTS withdrawals (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  created_at VARCHAR NOT NULL,
  bank_details JSONB NOT NULL
);

-- 4. Create PRODUCTS Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR PRIMARY KEY,
  vendor_id VARCHAR NOT NULL,
  vendor_name VARCHAR,
  name VARCHAR NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  mrp NUMERIC NOT NULL,
  category VARCHAR NOT NULL,
  stock INTEGER NOT NULL,
  image TEXT,
  mlm_points NUMERIC NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create ORDERS Table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR,
  vendor_id VARCHAR NOT NULL,
  product_id VARCHAR NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR,
  amount NUMERIC NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  created_at VARCHAR NOT NULL
);

-- 6. Create PAYMENT_REQUESTS Table
CREATE TABLE IF NOT EXISTS payment_requests (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR NOT NULL,
  amount NUMERIC NOT NULL,
  utr VARCHAR NOT NULL,
  screenshot TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending',
  created_at VARCHAR NOT NULL
);

-- 7. Create CHAT_MESSAGES Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR PRIMARY KEY,
  sender_id VARCHAR NOT NULL,
  sender_name VARCHAR NOT NULL,
  receiver_id VARCHAR NOT NULL,
  message TEXT NOT NULL,
  created_at VARCHAR NOT NULL
);

-- 8. Create PACKAGES Table
CREATE TABLE IF NOT EXISTS packages (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  price NUMERIC NOT NULL,
  pv NUMERIC NOT NULL,
  coin NUMERIC NOT NULL,
  coin_usable_percent NUMERIC NOT NULL DEFAULT 10
);

-- 9. Create WALLETS Table (Explicit Individual Table)
CREATE TABLE IF NOT EXISTS wallets (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  main NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  cashback NUMERIC DEFAULT 0,
  recharge NUMERIC DEFAULT 0,
  shopping NUMERIC DEFAULT 0,
  reward NUMERIC DEFAULT 0,
  ewallet NUMERIC DEFAULT 0,
  coinwallet NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create RECHARGES Table
CREATE TABLE IF NOT EXISTS recharges (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  service VARCHAR NOT NULL,
  operator VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'success',
  created_at VARCHAR NOT NULL
);

-- 11. Create RANKS Table
CREATE TABLE IF NOT EXISTS ranks (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  rank_name VARCHAR NOT NULL,
  achieved_at VARCHAR NOT NULL,
  bonus NUMERIC NOT NULL DEFAULT 0
);

-- 12. Create REWARDS Table (Explicit Individual Table)
CREATE TABLE IF NOT EXISTS rewards (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  reward_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  target_sales INTEGER NOT NULL,
  current_sales INTEGER NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'locked',
  achieved_at VARCHAR
);

-- Enable indexes to maximize performance across query lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_recharges_user_id ON recharges(user_id);
CREATE INDEX IF NOT EXISTS idx_ranks_user_id ON ranks(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);
