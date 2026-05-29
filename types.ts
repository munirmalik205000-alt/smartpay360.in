
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
  bankDetails?: BankDetails;
  kycData?: {
    pan: string;
    aadhaar: string;
  };
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

export interface Order {
  id: string;
  userId: string;
  vendorId: string;
  productId: string;
  amount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  walletType: keyof Wallets;
  type: 'recharge' | 'commission' | 'shopping' | 'withdrawal' | 'add_funds' | 'activation';
  description: string;
  status: 'success' | 'pending' | 'failed';
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
