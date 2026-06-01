export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VENDOR = 'VENDOR'
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  holderName: string;
}

export interface User {
  id: string; // uuid from supabase auth
  username: string; // maps to old 'name'
  mobile: string; // maps to old 'phone'
  email: string;
  sponsor_id: string | null; // maps to old 'referrerId'
  
  wallet_balance: number; // main wallet
  earning_wallet: number; // commission wallet
  recharge_wallet: number; // recharge wallet
  
  total_pv: number;
  self_pv: number;
  team_pv: number;
  direct_count: number;
  team_count: number;
  rank_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  
  // legacy missing fields
  bankDetails?: BankDetails;
  referralCode?: string;
  level?: number;
}

export interface Transaction {
  id: string | number; // Bigserial or string
  user_id: string;
  amount: number;
  transaction_type: string;
  remark: string;
  created_at: string;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  category: 'Herbal' | 'Electronics' | 'Wellness' | 'Utility';
  stock: number;
  image: string;
  mlmPoints: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  bankDetails: BankDetails;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  utr: string;
  screenshot: string; // Base64
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string; // 'admin' or userId
  message: string;
  createdAt: string;
}
