
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VENDOR = 'VENDOR'
}

export interface Wallets {
  main: number;        // Active Cash Wallet
  commission: number;  // Income Wallet (20 Levels, Direct Income, etc)
  cashback: number;    // Reward/Cashback wallet
  recharge: number;    // Recharge Wallet (used for bill payments)
  shopping: number;    // Shopping Wallet (used for store)
  reward: number;      // Loyalty/Reward Points
  vendor?: number;     // Earnings for Vendors
  ewallet: number;     // E-Wallet for package purchase & transfer
  coinwallet: number;  // Coin Wallet
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  holderName: string;
  upiId?: string;
}

export interface KYCDetails {
  aadhaarNumber: string;
  panNumber: string;
  gstNumber?: string;
  documentImage?: string; // Base64
  status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
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

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string; // 'admin' or userId
  message: string;
  createdAt: string;
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

export interface RewardTarget {
  id: string;
  name: string;
  image: string; // emoji or icon
  targetSalesCount: number; // Downline target active members
  currentSalesCount: number;
  status: 'locked' | 'achieved' | 'claimed' | 'approved';
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  transactionPin: string; // 4-digit PIN for sensitive actions
  phone: string;
  state: string; // User's state location
  referralCode: string;
  referrerId: string | null;
  role: UserRole;
  wallets: Wallets;
  totalEarned: number;
  status: 'active' | 'suspended' | 'pending';
  level: number;
  joinedAt: string;
  isActivated: boolean;
  selfPV?: number; // Self package points value
  bankDetails?: BankDetails;
  kycDetails?: KYCDetails;
  rewards?: RewardTarget[];
}

export interface Package {
  id: string;
  name: string;
  price: number; // bought from ewallet
  pv: number;    // Point Value contribution
  coin: number;  // Coin amount rewarded to buyer
}

export interface Product {
  id: string;
  vendorId: string;
  vendorName?: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  category: 'Electronics' | 'Mobile' | 'Fashion' | 'Grocery' | 'Healthcare' | 'Home Appliances' | 'Beauty' | 'Books';
  stock: number;
  image: string;
  mlmPoints: number; // BV (Business Volume)
  isApproved?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  userName?: string;
  vendorId: string;
  productId: string;
  productName?: string;
  amount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  walletType: keyof Wallets;
  type: 'recharge' | 'commission' | 'shopping' | 'withdrawal' | 'add_funds' | 'activation' | 'reward' | 'transfer' | 'coin_commission' | 'coin_reward' | 'package_buy';
  description: string;
  status: 'success' | 'pending' | 'failed';
  createdAt: string;
}

export interface MLMConfig {
  rechargeCommission: number[]; // up to 20 levels
  productCommission: number[];  // up to 20 levels
  packageCommission: number[];  // up to 20 levels
  packagePrice: number;
  tdsRate: number;      // e.g. 0.05
  serviceCharge: number; // e.g. 0.05
  qrCode: string; // Admin QR for Add Money
  customLogo?: string; // Admin uploaded platform logo (Base64)
  activationFee?: number;
}
