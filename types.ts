export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string; // uuid from supabase auth
  username: string;
  mobile: string;
  email: string;
  sponsor_id: string | null;
  wallet_balance: number;
  earning_wallet: number;
  recharge_wallet: number;
  total_pv: number;
  self_pv: number;
  team_pv: number;
  direct_count: number;
  team_count: number;
  rank_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: number; // Bigserial
  user_id: string;
  amount: number;
  transaction_type: 'CREDIT' | 'DEBIT';
  remark: string;
  created_at: string;
}

