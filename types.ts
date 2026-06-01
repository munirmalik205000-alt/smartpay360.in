export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VENDOR = 'VENDOR'
}

export interface Wallets {
  main: number;
  commission: number;
  cashback: number;
  recharge: number;
  vendor?: number;
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  holderName: string;
}

export interface Order {
  id: string;
  userId: string;
  vendorId: string;
  productId: string;
  amount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface MLMConfig {
  rechargeCommission: number[];
  productCommission: number[];
  packageCommission: number[];
  packagePrice: number;
  tdsRate: number;
  serviceCharge: number;
  qrCode: string; // Admin QR for Add Money
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
  name?: string;
  phone?: string;
  totalEarned?: number;
  bankDetails?: BankDetails;
  referralCode?: string;
  level?: number;
  isActivated?: boolean;
  wallets?: Wallets;
}

export interface Transaction {
  id: string | number; // Bigserial or string
  user_id: string;
  amount: number;
  transaction_type: string;
  remark: string;
  created_at: string;

  // legacy fields
  type?: 'recharge' | 'commission' | 'shopping' | 'withdrawal' | 'add_funds' | 'activation';
  description?: string;
  createdAt?: string;
  walletType?: 'main' | 'commission' | 'recharge' | 'cashback';
  status?: string;
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
