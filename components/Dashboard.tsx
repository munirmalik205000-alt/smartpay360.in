
import React, { useState, useMemo, useEffect } from 'react';
import { User, Transaction, Product, PaymentRequest, WithdrawalRequest, ChatMessage, BankDetails, RewardTarget, UserRole, Package } from '../types';
import { Wallet, Bell, LogOut, ShieldCheck, MessageSquare, Share2, Copy, CheckCircle2, AlertCircle, TrendingUp, Users, ShoppingBag, ArrowRight, UserCheck, HelpCircle, Trophy, Sparkles, Landmark, FileText, Compass, Search, Tag, Eye, EyeOff, Heart, Check, Trash2, ShieldAlert, User as UserIcon, Menu as MenuIcon, X as XIcon, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../services/utils';
import { safeLocalStorage } from '../services/storage';

interface DashboardProps {
  user: User;
  users: User[];
  products: Product[];
  transactions: Transaction[];
  onRecharge: (userId: string, amt: number, service: string, pin: string, operator: string, useCoins?: boolean) => void;
  onOrder: (userId: string, pId: string, useCoins?: boolean) => void;
  onTransfer: (senderId: string, recipientEmail: string, amount: number, pin: string) => void;
  onActivate: (userId: string) => void;
  packagePrice: number;
  qrCode: string;
  onAddMoney: (data: { amount: number, utr: string, screenshot: string }) => void;
  paymentRequests: PaymentRequest[];
  withdrawalRequests: WithdrawalRequest[];
  onWithdrawal: (amount: number, pin: string) => void;
  onUpdateBankDetails: (details: BankDetails) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (msg: string, receiverId: string) => void;
  tab: string;
  setTab: (tab: any) => void;
  onSubmitKYC?: (aadhaar: string, pan: string, gst?: string) => void;
  onClaimReward?: (rewardId: string) => void;
  packages?: Package[];
  onBuyPackage?: (userId: string, packageId: string) => void;
  onMainToEWalletTransfer?: (userId: string, amount: number) => void;
  onEWalletToEWalletTransfer?: (senderId: string, recipientEmail: string, amount: number) => void;
  onLogout?: () => void;
}

const INDIAN_OPERATORS = [
  { name: 'Reliance Jio', logo: '📶', rating: '4.8' },
  { name: 'Bharti Airtel', logo: '🔴', rating: '4.7' },
  { name: 'Vodafone Idea (Vi)', logo: '🟡', rating: '4.5' },
  { name: 'BSNL', logo: '🔵', rating: '4.2' }
];

const PROMPT_REC_AMOUNTS = [199, 299, 666, 749, 999, 1499, 2999];

const Dashboard: React.FC<DashboardProps> = ({ 
  user, users, products, transactions, onRecharge, onOrder, onTransfer, 
  onActivate, packagePrice, qrCode, onAddMoney, paymentRequests,
  withdrawalRequests, onWithdrawal, onUpdateBankDetails, chatMessages, onSendMessage,
  tab, setTab, onSubmitKYC, onClaimReward,
  packages = [], onBuyPackage, onMainToEWalletTransfer, onEWalletToEWalletTransfer,
  onLogout
}) => {
  const [transferData, setTransferData] = useState({ email: '', amount: '', pin: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'main' | 'ewallet' | 'coinwallet' | 'commission' | 'recharge'>('all');

  const filteredLedger = useMemo(() => {
    return transactions.filter(tx => {
      if (ledgerFilter === 'all') return true;
      if (ledgerFilter === 'recharge') return tx.type === 'recharge';
      if (ledgerFilter === 'coinwallet') return tx.walletType?.toLowerCase() === 'coinwallet' || tx.walletType?.toLowerCase() === 'coin';
      if (tx.walletType?.toLowerCase() === ledgerFilter.toLowerCase()) return true;
      if (tx.type?.toLowerCase() === ledgerFilter.toLowerCase()) return true;
      return false;
    });
  }, [transactions, ledgerFilter]);

  const [transferSubTab, setTransferSubTab] = useState<'main' | 'ewallet' | 'self_conversion'>('main');
  const [ewalletTransfer, setEwalletTransfer] = useState({ email: '', amount: '', pin: '' });
  const [selfEwalletConversion, setSelfEwalletConversion] = useState({ amount: '', pin: '' });

  const handleEwalletTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(ewalletTransfer.amount);
    if (isNaN(amt) || amt <= 0) return alert('🚨 Provide a valid positive currency amount.');
    if (!ewalletTransfer.email) return alert('🚨 Provide recipient email ID.');
    if (ewalletTransfer.pin.length !== 4) return alert('🚨 Confirm your 4 digit secure PIN code.');
    if (ewalletTransfer.pin !== user.transactionPin) return alert('🚨 Wrong secure PIN code submitted.');

    if (onEWalletToEWalletTransfer) {
      onEWalletToEWalletTransfer(user.id, ewalletTransfer.email, amt);
      setEwalletTransfer({ email: '', amount: '', pin: '' });
    }
  };

  const handleSelfEwalletConversionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(selfEwalletConversion.amount);
    if (isNaN(amt) || amt <= 0) return alert('🚨 Please input a valid conversions amount.');
    if (selfEwalletConversion.pin.length !== 4) return alert('🚨 Provide your secure 4 digit PIN.');
    if (selfEwalletConversion.pin !== user.transactionPin) return alert('🚨 Security Error: Pin code incorrect.');

    if (onMainToEWalletTransfer) {
      onMainToEWalletTransfer(user.id, amt);
      setSelfEwalletConversion({ amount: '', pin: '' });
    }
  };
  const [addMoneyData, setAddMoneyData] = useState({ amount: '', utr: '', screenshot: '' });
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalPin, setWithdrawalPin] = useState('');
  const [bankForm, setBankForm] = useState<BankDetails>(user.bankDetails || { bankName: '', accountNumber: '', ifscCode: '', holderName: '', upiId: '' });
  const [chatInput, setChatInput] = useState('');
  const [showBalances, setShowBalances] = useState<boolean>(() => {
    try {
      const persisted = localStorage.getItem('s360_show_balances');
      return persisted !== 'false';
    } catch {
      return true;
    }
  });

  const toggleShowBalances = () => {
    setShowBalances(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem('s360_show_balances', String(newVal));
      } catch {}
      return newVal;
    });
  };

  // Search & Categories for Shop
  const [shopCategory, setShopCategory] = useState<string>('All');
  const [shopSearch, setShopSearch] = useState('');
  const [shopCoupon, setShopCoupon] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  // Recharge Modal States
  const [selectedUtility, setSelectedUtility] = useState<{name: string, icon: string} | null>(null);
  const [rechargeAmt, setRechargeAmt] = useState('');
  const [rechargeProvider, setRechargeProvider] = useState('Reliance Jio');
  const [customerNumber, setCustomerNumber] = useState('');
  const [rechargePin, setRechargePin] = useState('');
  const [useCoinsForRecharge, setUseCoinsForRecharge] = useState(false);

  // KYC States
  const [kycAadhaar, setKycAadhaar] = useState(user.kycDetails?.aadhaarNumber || '');
  const [kycPan, setKycPan] = useState(user.kycDetails?.panNumber || '');
  const [kycGst, setKycGst] = useState(user.kycDetails?.gstNumber || '');

  // Slide-out menu event listener
  useEffect(() => {
    const handleOpenMenu = () => {
      setIsSidebarOpen(true);
    };
    window.addEventListener('spay-open-menu', handleOpenMenu);
    return () => {
      window.removeEventListener('spay-open-menu', handleOpenMenu);
    };
  }, []);

  // Calculate my downlines recursively up to 20 levels deep!
  const myDownline = useMemo(() => {
    const findDownline = (uId: string): User[] => {
      const directs = users.filter(u => u.referrerId === uId);
      let fullList = [...directs];
      directs.forEach(d => {
        fullList = [...fullList, ...findDownline(d.id)];
      });
      return fullList;
    };
    return findDownline(user.id);
  }, [users, user.id]);

  const activeDownlineCount = useMemo(() => {
    return myDownline.filter(u => u.isActivated).length;
  }, [myDownline]);

  const stats = [
    { label: 'E-Wallet Balance', val: `₹${(user.wallets.ewallet || 0).toFixed(2)}`, color: 'text-indigo-600 dark:text-indigo-400', icon: Wallet, desc: 'Used for package activation & utility' },
    { label: 'Coin Wallet', val: `${(user.wallets.coinwallet || 0).toLocaleString()} Coins`, color: 'text-amber-500', icon: Sparkles, desc: 'Staked Coin rewards & discounts' },
    { label: 'Self P.V.', val: `${(user.selfPV || 0)} PV`, color: 'text-fuchsia-500', icon: Trophy, desc: 'Accumulated Self Point Value' },
    { label: 'Main Wallet', val: `₹${user.wallets.main.toFixed(2)}`, color: 'text-emerald-600 dark:text-emerald-400', icon: TrendingUp, desc: 'Direct bank withdraw & transfer' },
    { label: 'MLM Income', val: `₹${user.wallets.commission.toFixed(2)}`, color: 'text-teal-600 dark:text-teal-400', icon: Trophy, desc: 'Genealogy commission balance' },
  ];

  const signupUrl = `${window.location.origin}?ref=${user.referralCode}`;
  const shareText = `🚀 Start earning passive income with SmartPay360! Utility payments, Recharge, Multi-vendor Marketplace & 20 Level Income distribution! Join using my referral signup link: ${signupUrl}`;
  
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAddMoneyData({ ...addMoneyData, screenshot: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleAddMoneySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(addMoneyData.amount);
    if (isNaN(amt) || amt <= 0) return alert('🚨 Valid numerical amount is required.');
    if (!addMoneyData.utr) return alert('🚨 Transaction ID / UTR verification number required.');
    const cleanUtr = addMoneyData.utr.trim();
    if (!/^\d+$/.test(cleanUtr)) {
      return alert('🚨 UTR number holds numeric digits only. कृपया केवल अंकों का UTR नंबर दर्ज करें।');
    }
    // Screenshot is optional, defaulting to empty string if not attached
    onAddMoney({ amount: amt, utr: cleanUtr, screenshot: addMoneyData.screenshot || '' });
    setAddMoneyData({ amount: '', utr: '', screenshot: '' });
  };

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawalAmount);
    if (isNaN(amt) || amt < 50) return alert('🚨 Minimum withdrawal standard is set to ₹50');
    if (withdrawalPin.length !== 4) return alert('🚨 4-Digit Security PIN is required.');
    onWithdrawal(amt, withdrawalPin);
    setWithdrawalAmount('');
    setWithdrawalPin('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferData.amount);
    if (isNaN(amt) || amt <= 0) return alert('Enter valid amount');
    if (!transferData.email) return alert('Enter recipient email');
    if (transferData.pin.length !== 4) return alert('Enter a valid 4-digit PIN');
    onTransfer(user.id, transferData.email, amt, transferData.pin);
    setTransferData({ email: '', amount: '', pin: '' });
  };

  const executeRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUtility) return;
    const amt = parseFloat(rechargeAmt);
    if (isNaN(amt) || amt <= 0) return alert('🚨 Please provide a valid transaction numerical amount.');
    if (!customerNumber) return alert('🚨 Please provide your connection / mobile identity number.');
    if (rechargePin.length !== 4) return alert('🚨 Transaction authorization requires your 4 PIN digits.');
    
    onRecharge(user.id, amt, `${selectedUtility.name} (${customerNumber})`, rechargePin, rechargeProvider, useCoinsForRecharge);
    
    // reset
    setSelectedUtility(null);
    setRechargeAmt('');
    setCustomerNumber('');
    setRechargePin('');
    setUseCoinsForRecharge(false);
  };

  const handleApplyCoupon = () => {
    if (shopCoupon.toUpperCase() === 'S360WELCOME') {
      setAppliedDiscount(100);
      alert('🎉 S360WELCOME Applied! ₹100 Flat discount credited on checkout.');
    } else if (shopCoupon.toUpperCase() === 'SUPERFINTECH') {
      setAppliedDiscount(250);
      alert('🎉 SUPERFINTECH Applied! ₹250 Super discount credited!');
    } else {
      alert('🚨 Invalid coupon code.');
    }
  };

  // Filter products by category and search term
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = shopCategory === 'All' || p.category === shopCategory;
      const matchSearch = p.name.toLowerCase().includes(shopSearch.toLowerCase()) || p.description.toLowerCase().includes(shopSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, shopCategory, shopSearch]);

  return (
    <div className="space-y-6 md:pb-6 relative text-black bg-white dark:bg-slate-900 font-sans transition-colors duration-200">
      {/* Decorative spectrum bar */}
      <div className="h-1.5 w-full rounded-full flex overflow-hidden shadow-sm animate-pulse shrink-0">
        <div className="w-[50%] h-full bg-blue-700"></div>
        <div className="w-[50%] h-full bg-white border dark:border-slate-805"></div>
      </div>

      {/* 0. Top Navigation & Smart Menu Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-blue-50/70 dark:bg-purple-950/40 p-4 rounded-3xl border-2 border-blue-200 dark:border-purple-900/40">
        <div className="flex flex-wrap items-center gap-3 w-full">
          <span className="text-[9.5px] font-black uppercase text-blue-900 dark:text-blue-300 tracking-wider bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/40 shadow-sm w-full text-center md:text-left">
            Current Section: {
              tab === 'home' ? '🏠 Overview' :
              tab === 'activity' ? '📋 Ledger History' :
              tab === 'income' ? '💰 Income History' :
              tab === 'profile' ? '👤 My Profile' :
              tab === 'mlm' ? '👥 Team Tree' :
              tab === 'utility' ? '📶 Recharge option' :
              tab === 'shop' ? '🛍️ Shop REP' :
              tab === 'rewards' ? '🏆 Achiever rewards' :
              tab === 'support' ? '💬 Customer Help' : 
              tab === 'add_money' ? '💳 Add Money' :
              tab === 'withdraw' ? '💸 Withdrawal' :
              tab === 'transfer' ? '🔁 Money Transfer' : tab
            }
          </span>
        </div>
      </div>

      {/* 1. Left Side Slide-out Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[100] overflow-hidden">
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-purple-950/70 backdrop-blur-sm transition-opacity"
            />
            
            {/* Drawer body */}
            <div className="absolute inset-y-0 left-0 max-w-full flex">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', duration: 0.45, bounce: 0.05 }}
                className="w-screen max-w-xs md:max-w-sm bg-white dark:bg-purple-950 flex flex-col shadow-2xl border-r-4 border-purple-600"
              >
                {/* Header of Drawer */}
                <div className="px-6 py-5 bg-gradient-to-br from-purple-800 to-purple-950 border-b border-purple-900 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-left text-white">
                    <span className="text-xl">⚡</span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider leading-none">SmartPay 360</h4>
                      <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest mt-1">Ecosystem Navigation</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 rounded-lg bg-indigo-950 hover:bg-red-950 text-indigo-400 hover:text-white transition-colors cursor-pointer border border-indigo-805"
                  >
                    <XIcon size={18} />
                  </button>
                </div>

                {/* User quick badge in drawer */}
                <div className="bg-blue-50/80 dark:bg-slate-900/85 p-5 border-b border-blue-100 dark:border-blue-950 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg font-black uppercase shadow-inner shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate tracking-wide leading-none">{user.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-blue-300 truncate mt-1">{user.email}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 text-[8px] font-extrabold rounded uppercase tracking-wider">
                      ★ Level {user.level || 0} Leader
                    </span>
                  </div>
                </div>

                {/* Menu items list */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 text-left no-scrollbar">
                  {/* Category: accounts */}
                  <p className="text-[8.5px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest pl-3 py-1">Identity & Wallets</p>
                  
                  <button
                    type="button"
                    onClick={() => { setTab('home'); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer text-left",
                      tab === 'home' ? "bg-blue-50 dark:bg-slate-900 border-blue-200 dark:border-blue-900/40" : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded-lg">
                        <Compass size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Home Dashboard</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Wallets & money operations</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setTab('profile'); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer text-left",
                      tab === 'profile' ? "bg-blue-50 dark:bg-slate-900 border-blue-200 dark:border-blue-900/40" : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded-lg">
                        <UserIcon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">My Profile Settings</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">KYC status, bank accounts</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  {/* Category: Networking */}
                  <p className="text-[8.5px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest pl-3 py-1 pt-3">MLM Network</p>

                  <button
                    type="button"
                    onClick={() => { setTab('mlm'); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer text-left",
                      tab === 'mlm' ? "bg-blue-50 dark:bg-slate-900 border-blue-250 dark:border-blue-900/40" : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded-lg">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Team Tree (Downline)</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Genealogy leads matrix</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setTab('rewards'); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer text-left",
                      tab === 'rewards' ? "bg-blue-50 dark:bg-slate-900 border-blue-200 dark:border-blue-900/40" : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded-lg">
                        <Trophy size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Achiever Rewards</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Laptops, motorbikes, BMW</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  {/* Category: ledger */}
                  <p className="text-[8.5px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest pl-3 py-1 pt-3">Ledgers & Accounts</p>

                  <button
                    type="button"
                    onClick={() => { setTab('activity'); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer text-left",
                      tab === 'activity' ? "bg-blue-50 dark:bg-slate-900 border-blue-200 dark:border-blue-900/40" : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded-lg">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Transaction History</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Secure ledger timelines</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setTab('income'); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer text-left",
                      tab === 'income' ? "bg-blue-50 dark:bg-slate-900 border-blue-200 dark:border-blue-900/40" : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded-lg">
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Income History</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Matrix level distribution royalty</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  {/* Category: Purchases */}
                  <p className="text-[8.5px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest pl-3 py-1 pt-3">Recharges & Shop</p>

                  <button
                    type="button"
                    onClick={() => { setTab('utility'); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer text-left",
                      tab === 'utility' ? "bg-blue-50 dark:bg-slate-900 border-blue-200 dark:border-blue-900/40" : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded-lg">
                        <Wallet size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Recharge Option</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Instant utility operator payments</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setTab('shop'); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer text-left",
                      tab === 'shop' ? "bg-blue-50 dark:bg-slate-900 border-blue-200 dark:border-blue-900/40" : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded-lg">
                        <ShoppingBag size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Shop Repurchase</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Buy physical products & claim BV</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  {/* Category: Support */}
                  <p className="text-[8.5px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest pl-3 py-1 pt-3">Helpdesk</p>

                  <button
                    type="button"
                    onClick={() => { setTab('support'); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer text-left",
                      tab === 'support' ? "bg-blue-50 dark:bg-slate-900 border-blue-200 dark:border-blue-900/40" : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded-lg">
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Customer Support</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Open active lead support chats</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                </div>

                {/* Footer segment of Drawer with Logout fallback */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      if (onLogout) {
                        onLogout();
                      } else {
                        // Safe client fallback
                        safeLocalStorage.removeItem('spay_current_user');
                        window.location.reload();
                      }
                    }}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider border border-red-200/50 cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Secure Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {user.role === UserRole.ADMIN && (
        <div className="bg-blue-50 border-2 border-blue-400 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md text-left text-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 border border-blue-300 flex items-center justify-center text-xl shrink-0">
              🛡️
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-red-700 tracking-wider font-mono">🛡️ ADMINISTRATOR CONTROL VIEW ACTIVATED</p>
              <p className="text-xs text-black font-semibold leading-relaxed">You are exploring the live <b>User Dashboard</b> of SmartPay 360 using your single unified ID.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setTab('admin')}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-[10px] uppercase tracking-wider rounded-2xl border-2 border-blue-400 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
          >
            🛡️ Go Back to Admin Panel
          </button>
        </div>
      )}
      
      {/* Beautiful Home Header & Balance Cards replacing previous bento stats/sliders */}
      {tab === 'home' && (
        <div className="space-y-6">
          {/* 1. Header Greetings in high UX design */}
          <div className="bg-gradient-to-r from-purple-800 to-indigo-900 px-6 py-5 rounded-[2rem] text-white border-2 border-purple-500/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-md text-left">
            <div>
              <p className="text-[10px] font-black text-purple-200 uppercase tracking-widest pl-0.5 leading-none font-mono animate-pulse">
                ⚡ NODE ID SYSTEM ENABLED
              </p>
              <h1 className="text-3xl font-black text-white tracking-tight mt-1.5 flex items-center gap-1.5 leading-tight">
                {user.name} <Sparkles size={18} className="text-amber-400 animate-spin" />
              </h1>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 flex items-center gap-3 self-start md:self-auto shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
              <p className="text-[9px] font-black uppercase tracking-widest text-white font-mono">
                SECURE PLATFORM LIVE
              </p>
            </div>
          </div>

          {/* 2. Unified Premium Balance Card - Crisp White and Blue */}
          <div className="relative rounded-[2.5rem] bg-white p-8 text-black shadow-lg overflow-hidden text-left transition-all duration-300 border-4 border-blue-700">
            {/* Dynamic visual ambient lights inside card */}
            <div className="absolute top-[-20%] right-[-10%] w-[180px] h-[180px] bg-blue-100 rounded-full blur-[60px] pointer-events-none animate-pulse"></div>
            
            <div className="relative z-10 flex flex-col gap-6">
              
              {/* Row 1: TOTAL BALANCE pill + Eye Toggle */}
              <div className="flex items-center justify-between">
                <span className="px-3.5 py-1.5 bg-blue-100 border-2 border-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-900 flex items-center gap-1.5 shadow-inner leading-none font-mono">
                  ✨ Combined Wallet Ledger
                </span>
                <button 
                  type="button"
                  onClick={toggleShowBalances} 
                  className="p-2.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-900 rounded-2xl transition-all border-2 border-blue-300 shadow-sm cursor-pointer"
                  title={showBalances ? "Hide details" : "Show details"}
                >
                  {showBalances ? <Eye size={18} className="text-blue-700" /> : <EyeOff size={18} className="text-slate-500" />}
                </button>
              </div>

              {/* Row 2: Heavy visual balance amount with beveled shadow */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-blue-100 pb-4">
                <div>
                  <p className="text-4xl md:text-5xl font-black text-black tracking-tight flex items-center gap-0.5 leading-none">
                    ₹{showBalances ? user.wallets.main.toFixed(2) : "•••••"}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-905 mt-2 ml-1">MAIN WALLET BALANCE</p>
                </div>
                {/* Self PV shown next to Main Wallet */}
                <div className="bg-purple-50 border-2 border-purple-200 px-4 py-2.5 rounded-2xl text-left shadow-inner shrink-0">
                  <p className="text-lg font-black text-purple-950 leading-tight">✨ {user.selfPV || 0} PV</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-purple-705 font-mono mt-0.5">SELF P.V. (MAIN ACCOUNT)</p>
                </div>
              </div>

              {/* Row 3: Sub-balances Row styled in custom Blue, Purple, Green glass tags */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border-2 border-blue-300 p-4 flex flex-col justify-between shadow-sm rounded-2xl relative overflow-hidden">
                  <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest font-mono font-black">E-WALLET BALANCE</span>
                  <span className="text-xl font-black tracking-tight mt-1 text-black">
                    ₹{showBalances ? (user.wallets.ewallet || 0).toFixed(2) : "•••••"}
                  </span>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full absolute top-2 right-2 animate-ping"></div>
                </div>

                <div className="bg-violet-50 border-2 border-violet-200 p-4 flex flex-col justify-between shadow-sm rounded-2xl relative overflow-hidden">
                  <span className="text-[9px] font-black text-violet-900 uppercase tracking-widest font-mono font-black">MAIN INCOME WALLET</span>
                  <span className="text-xl font-black tracking-tight mt-1 text-black font-black">
                    ₹{showBalances ? user.wallets.main.toFixed(2) : "•••••"}
                  </span>
                  <div className="w-1.5 h-1.5 bg-violet-500 rounded-full absolute top-2 right-2 animate-ping"></div>
                </div>

                <div className="bg-green-50 border-2 border-green-300 p-4 flex flex-col justify-between shadow-sm rounded-2xl relative overflow-hidden">
                  <span className="text-[9px] font-black text-green-800 uppercase tracking-widest font-mono font-black">COIN WALLET (🎯 {user.coinUsablePercent || 10}% Usable)</span>
                  <span className="text-xl font-black tracking-tight mt-1 text-green-800 font-extrabold flex items-center gap-1">
                    🪙 {showBalances ? (user.wallets.coinwallet || 0).toLocaleString() : "•••••"}
                  </span>
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full absolute top-2 right-2 animate-ping"></div>
                </div>
              </div>

              {/* Row 4: Action helper navigation buttons (Added Money + Withdraw) */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <button 
                  type="button"
                  onClick={() => setTab('add_money')}
                  className="py-4 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-full text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all text-center border border-blue-600 cursor-pointer animate-pulse"
                >
                  ➕ Add Money
                </button>
                <button 
                  type="button"
                  onClick={() => setTab('withdraw')}
                  className="py-4 bg-white hover:bg-blue-50 text-blue-900 font-bold rounded-full text-xs uppercase tracking-widest border-2 border-blue-700 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  🏦 Pay Out
                </button>
              </div>

              {/* Row 5: Referral sponsor portfolio bar */}
              <div className="bg-blue-50 rounded-2xl p-4 flex items-center justify-between border-2 border-blue-300 mt-1 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 border border-blue-300">
                    👥
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-black uppercase tracking-widest block leading-none">Your Sponsor Code</span>
                    <span className="font-mono font-black text-sm tracking-widest mt-1 block leading-none text-blue-800">{user.referralCode}</span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const signupUrl = `${window.location.origin}?ref=${user.referralCode}`;
                    navigator.clipboard.writeText(signupUrl); 
                    alert('Referral Sign-up Link Copied Successfully!');
                  }} 
                  className="p-2.5 bg-blue-100 hover:bg-blue-200 rounded-xl transition-all border border-blue-300 active:scale-90 text-blue-900 cursor-pointer"
                  title="Copy Refer Link"
                >
                  <Copy size={13} />
                </button>
              </div>

            </div>
          </div>

          {/* 3. Franchise Upgrade & Activation Packages Grid */}
          <div className="space-y-4 text-left border-0">
            {!user.isActivated && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-2 border-red-300 p-5 rounded-2xl flex items-center gap-3.5 text-left"
              >
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-700 shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-red-700 font-extrabold text-sm tracking-tight">ID Activation Required</h3>
                  <p className="text-black text-[10px] font-bold uppercase tracking-wider mt-0.5 leading-relaxed">
                    Aapka account active nahi hai. Please buy any Franchise Package below using your <b>E-Wallet balance</b> to activate your ID for recharges and other services!
                  </p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map(p => {
                const isAffordable = (user.wallets?.ewallet || 0) >= p.price;
                return (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={p.id}
                    className={cn(
                      "p-6 rounded-3xl border-2 bg-white shadow-md flex flex-col justify-between relative overflow-hidden transition-all",
                      !user.isActivated && p.price === 999 
                        ? "border-red-500 ring-2 ring-red-500/10" 
                        : "border-blue-200"
                    )}
                  >
                    {!user.isActivated && p.price === 999 && (
                      <span className="absolute top-4 right-4 px-2.5 py-1 bg-red-650 text-white rounded-lg text-[8px] font-black uppercase tracking-widest leading-none">
                        Recommended
                      </span>
                    )}
                    
                    <div>
                      <h4 className="text-xs font-black text-black mb-2">{p.name}</h4>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-2xl font-black text-blue-800">₹{p.price}</span>
                        <span className="text-[10px] text-red-750 font-bold uppercase tracking-wider font-mono">E-Wallet</span>
                      </div>
                      
                      <div className="space-y-2 bg-blue-50 p-3.5 rounded-2xl border-2 border-blue-200 mb-5 text-[10px] font-bold text-black">
                        <div className="flex justify-between items-center">
                          <span>PV self count:</span>
                          <span className="text-blue-900 font-black font-mono">+{p.pv} PV</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Instant Coins:</span>
                          <span className="text-amber-600 font-black font-mono">🪙 {p.coin} Coins</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-105 px-1 py-0.5 rounded-md text-blue-900">
                          <span>20-Level Income:</span>
                          <span className="text-blue-900 font-black uppercase font-mono">Cascade Active</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => { if(onBuyPackage) { onBuyPackage(user.id, p.id); } }}
                      className={cn(
                        "w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer active:scale-98 transition-all shadow-sm",
                        isAffordable 
                          ? "bg-blue-700 hover:bg-blue-850 text-white font-black" 
                          : "bg-blue-50 text-slate-500 cursor-not-allowed border-2 border-blue-200"
                      )}
                    >
                      {isAffordable ? "⚡ Buy with E-Wallet" : "🔒 Low E-Wallet"}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 4. Highly Polished "Quick Actions" Section */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border-2 border-blue-200 dark:border-blue-900/30">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-black dark:text-white mb-6 text-left flex items-center gap-2">
              <span className="w-1.5 h-3 bg-blue-700 dark:bg-blue-500 rounded-full inline-block"></span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-4 gap-3 md:gap-4 justify-items-center">
              {[
                { id: 'utility', icon: Wallet, label: 'Utility Pay' },
                { id: 'add_money', icon: Landmark, label: 'Add Cash' },
                { id: 'transfer', icon: Share2, label: 'Send Cash' },
                { id: 'withdraw', icon: ShieldCheck, label: 'Payout' },
              ].map((action) => (
                <button
                  type="button"
                  key={action.id}
                  onClick={() => setTab(action.id)}
                  className="group flex flex-col items-center cursor-pointer transition-all active:scale-95 gap-3"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white shadow-[0_10px_20px_rgba(29,78,216,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.6)] border-2 border-blue-400/40 group-hover:border-blue-300 transition-all group-hover:scale-110 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 group-hover:shadow-[0_12px_24px_rgba(37,99,235,0.4)]">
                    <action.icon size={22} className="md:size-[26px] text-white transition-transform group-hover:rotate-6" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest text-center leading-tight select-none transition-colors group-hover:text-blue-605">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Promotion / Ads banners Grid to complement combination layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-[2rem] border-2 border-blue-400 text-white flex flex-col justify-between shadow-md">
                  <div>
                    <span className="text-[8px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">ECOMMERCE BENEFIT</span>
                    <h4 className="font-extrabold text-lg mt-2 text-white">Repurchase Scheme</h4>
                    <p className="text-blue-50 text-xs mt-1">Get MLM Points (BV) on every purchase and earn level commissions deep in your genealogy.</p>
                  </div>
                  <button type="button" onClick={() => setTab('shop')} className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 mt-4 text-left hover:underline">
                    Shop Marketplace <ArrowRight size={14} />
                  </button>
                </div>

                <div className="p-6 bg-gradient-to-br from-indigo-700 to-slate-900 rounded-[2rem] border-2 border-blue-400 text-white flex flex-col justify-between shadow-md">
                  <div>
                    <span className="text-[8px] font-black bg-green-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">REWARDS CLASH</span>
                    <h4 className="font-extrabold text-lg mt-2 text-white">Achiever Rewards</h4>
                    <p className="text-blue-50 text-xs mt-1">Claim laptops, bikes and luxury sports BMW cars as downlines activate contracts.</p>
                  </div>
                  <button type="button" onClick={() => setTab('rewards')} className="text-blue-200 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 mt-4 text-left hover:underline">
                    Track Rewards <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Transactions list */}
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black">Security Audit Logs</h3>
                <button type="button" onClick={() => setTab('activity')} className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Full Ledger</button>
              </div>
              <div className="bg-white rounded-[2.5rem] shadow-sm border-2 border-blue-200 overflow-hidden">
                <div className="divide-y divide-blue-105">
                  {transactions.slice(0, 6).map(tx => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={tx.id} 
                      className="flex items-center justify-between p-6 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner",
                          tx.amount > 0 ? 'bg-green-50 text-green-800 border-2 border-green-200' : 'bg-red-50 text-red-700 border-2 border-red-200'
                        )}>
                          {tx.type === 'recharge' ? '📱' : tx.type === 'add_funds' ? '💰' : tx.type === 'activation' ? '⚡' : '💸'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-black">{tx.description}</p>
                          <p className="text-[10px] text-black font-bold uppercase tracking-widest mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-base font-black tracking-tight", tx.amount > 0 ? 'text-green-800 font-extrabold' : 'text-red-705 font-extrabold')}>
                          {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-[8px] font-black text-black uppercase tracking-[0.2em] mt-0.5">{tx.walletType}</p>
                      </div>
                    </motion.div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="py-20 text-center bg-white">
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-blue-200">
                        <Wallet className="text-blue-500" size={32} />
                      </div>
                      <p className="text-black text-[10px] font-black uppercase tracking-[0.2em]">No transactions logged</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Complete KYC Details Status Card inside Dashboard */}
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border-2 border-blue-200 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-700 font-extrabold border border-blue-200">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-black">KYC Status Audit</h4>
                    <span className={cn(
                      "px-2.5 py-0.5 text-[8px] font-black rounded-full uppercase tracking-wider inline-block mt-0.5",
                      user.kycDetails?.status === 'approved' ? 'bg-green-100 text-green-850 border border-green-300' :
                      user.kycDetails?.status === 'pending' ? 'bg-amber-100 text-amber-850 border border-amber-300' : 'bg-red-100 text-red-800 border border-red-300'
                    )}>
                      {user.kycDetails?.status || "NOT SUBMITTED"}
                    </span>
                  </div>
                </div>

                {(!user.kycDetails || user.kycDetails.status === 'not_submitted') ? (
                  <form onSubmit={(e) => { e.preventDefault(); if (onSubmitKYC) onSubmitKYC(kycAadhaar, kycPan, kycGst); }} className="space-y-3">
                    <p className="text-[10px] text-black font-semibold">Verify your citizenship details immediately to allow unlimited, heavy instant cash withdrawals.</p>
                    <input type="text" placeholder="Aadhaar Card (12 Digits)" pattern="\d{12}" required className="w-full px-4 py-3 bg-slate-50 border-2 border-blue-150 rounded-xl text-xs font-bold text-black placeholder-slate-400 focus:border-blue-500 outline-none" value={kycAadhaar} onChange={e => setKycAadhaar(e.target.value.replace(/\D/g, ''))} />
                    <input type="text" placeholder="PAN Number (10 Alphanumeric)" required className="w-full px-4 py-3 bg-slate-50 border-2 border-blue-150 rounded-xl text-xs font-bold uppercase text-black placeholder-slate-400 focus:border-blue-500 outline-none" value={kycPan} onChange={e => setKycPan(e.target.value)} />
                    <input type="text" placeholder="GST Registration (Optional)" className="w-full px-4 py-3 bg-slate-50 border-2 border-blue-150 rounded-xl text-xs font-bold uppercase text-black placeholder-slate-400 focus:border-blue-500 outline-none" value={kycGst} onChange={e => setKycGst(e.target.value)} />
                    <button type="submit" className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md cursor-pointer">Submit Documents</button>
                  </form>
                ) : user.kycDetails.status === 'pending' ? (
                  <div className="bg-blue-50 p-4 rounded-2xl text-center border-2 border-blue-200">
                    <p className="text-xs font-black text-blue-900">📄 KYC Verification Active</p>
                    <p className="text-[10px] text-black font-semibold mt-1">Audit team is checking Aadhaar & PAN details. Expect verification shortly.</p>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-2xl text-center border border-green-200">
                    <p className="text-xs font-bold text-green-800">✅ Merchant Account Verified</p>
                    <p className="text-[9px] text-black mt-1 uppercase font-bold">Standard commission withdrawal enabled</p>
                  </div>
                )}
              </div>

              {/* Referral Code Box */}
              <div className="bg-blue-50/95 dark:bg-blue-900/10 border-4 border-blue-400 p-8 rounded-[3rem] text-black relative overflow-hidden text-left shadow-md">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-100 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <h4 className="font-extrabold text-xl mb-1 flex items-center gap-2 text-black dark:text-white uppercase tracking-tight">Referrals Portfolio</h4>
                  <p className="text-xs text-neutral-800 dark:text-neutral-200 mb-6 font-semibold">Build business cascades and earn passive direct & matrix commissions daily.</p>
                  
                  <div className="bg-white/95 p-5 rounded-3xl border-2 border-blue-200 mb-4 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[8px] font-black text-black uppercase tracking-widest">Sponsor Code</p>
                      <p className="font-mono font-black text-xl tracking-[0.1em] text-green-700">{user.referralCode}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const signupUrl = `${window.location.origin}?ref=${user.referralCode}`;
                        navigator.clipboard.writeText(signupUrl); 
                        alert('Sponsor Referral Sign-up Link Copied!');
                      }} 
                      className="p-3 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl transition-all active:scale-90 cursor-pointer"
                      title="Copy Refer Link"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-black">
                    <button type="button" onClick={() => window.open(`https://wa.me/?text=${shareText}`, '_blank')} className="py-3 bg-[#25D366] text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm uppercase tracking-wider cursor-pointer">WhatsApp</button>
                    <button type="button" onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(shareText)}`, '_blank')} className="py-3 bg-[#0088cc] text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm uppercase tracking-wider cursor-pointer">Telegram</button>
                    <button type="button" onClick={() => setTab('mlm')} className="py-3 bg-blue-800 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm uppercase tracking-wider cursor-pointer">My Team</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Utility Payments and Operator Selection Tab */}
      {tab === 'utility' && (
        <div className="space-y-8 text-left">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-3xl font-black text-slate-850 dark:text-slate-100 tracking-tight">Utility Hub</h2>
            <p className="text-xs text-[#0077C0] font-black uppercase tracking-widest mt-2">Claim instant 2% cashback + matrix downline share</p>
          </div>

          {!user.isActivated && (
            <div className="p-6 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-[#8b5cf6]/10 border border-purple-500/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/15 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h4 className="text-slate-800 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider">Recharge Portals Locked</h4>
                  <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Activate your premium contractor ID pack for ₹{packagePrice} to perform utility bill pay actions.</p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setTab('add_money')}
                  className="w-full md:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-2xl text-[9px] uppercase tracking-wider hover:bg-slate-200 transition-all text-center shrink-0 cursor-pointer"
                >
                  ⚡ Deposit Funds
                </button>
                <button
                  type="button"
                  onClick={() => onActivate(user.id)}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black rounded-2xl text-[9px] uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  🔋 Activate ID Now
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Prepaid Recharge', icon: '📱' },
              { name: 'Postpaid Bill', icon: '🧾' },
              { name: 'DTH TV Recharge', icon: '📡' },
              { name: 'Electricity Bill', icon: '⚡' },
              { name: 'Water Pipe Bill', icon: '💧' },
              { name: 'Broadband Wifi', icon: '🌐' },
              { name: 'FASTag RFID', icon: '🚗' },
              { name: 'LPG Cooking Gas', icon: '🔥' },
            ].map(u => {
              const handleSelect = () => {
                if (!user.isActivated) {
                  alert(`🔒 Services Restricted: Please activate your account first to unlock Prepaid, electricity & bills payments! You can activate right from the top of this page using 'Activate ID Now'.`);
                  return;
                }
                setSelectedUtility(u);
              };
              return (
                <motion.button 
                  whileHover={{ scale: user.isActivated ? 1.02 : 1 }}
                  whileTap={{ scale: user.isActivated ? 0.98 : 1 }}
                  key={u.name} 
                  onClick={handleSelect}
                  className={cn(
                    "bg-blue-50/95 dark:bg-blue-900/20 p-6 rounded-[2rem] border border-blue-200 shadow-sm text-center transition-all cursor-pointer hover:border-blue-500"
                  )}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl bg-white dark:bg-slate-800 border border-blue-150 shadow-inner">{u.icon}</div>
                  <p className="text-xs font-black text-black dark:text-white mt-1 uppercase tracking-wider">{u.name}</p>
                  <p className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase mt-0.5">2% CASHBACK + 20-L MLM</p>
                  {!user.isActivated && (
                    <span className="inline-block mt-2 px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/20 text-[7px] text-amber-500 font-extrabold uppercase rounded-full tracking-wider">
                      🔒 Locked
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Dedicated Operator Selection / Recharge Interface (combining PhonePe feel) */}
          <AnimatePresence>
            {selectedUtility && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-violet-500/30 max-w-xl mx-auto space-y-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedUtility.icon}</span>
                    <h3 className="text-lg font-black text-slate-850 dark:text-white uppercase tracking-wider">{selectedUtility.name}</h3>
                  </div>
                  <button onClick={() => setSelectedUtility(null)} className="p-2 text-slate-400 hover:text-red-500 rounded-xl">✕</button>
                </div>

                <form onSubmit={executeRechargeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest pl-1 mb-2">Select Operator Service Provider</label>
                    <div className="grid grid-cols-4 gap-2">
                      {INDIAN_OPERATORS.map(op => (
                        <div 
                          key={op.name}
                          onClick={() => setRechargeProvider(op.name)}
                          className={cn(
                            "p-3 rounded-2xl border text-center cursor-pointer transition-all",
                            rechargeProvider === op.name ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/25 font-black' : 'border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-800'
                          )}
                        >
                          <span className="text-base block mb-0.5">{op.logo}</span>
                          <span className="text-[8px] font-bold block uppercase leading-none mt-1 truncate">{op.name.replace('Reliance ', '').replace('Bharti ', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest pl-1">Mobile / Connection / Consumer ID</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold text-sm" 
                      placeholder="e.g. 10-Digit Mobile/Service Code"
                      value={customerNumber}
                      onChange={e => setCustomerNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest pl-1">Recharge Amount (₹)</label>
                    <input 
                      type="number" 
                      required 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black text-xl" 
                      placeholder="0"
                      value={rechargeAmt}
                      onChange={e => setRechargeAmt(e.target.value)}
                    />
                    
                    {/* Recommended plans chips like PhonePe */}
                    <div className="flex gap-1 overflow-x-auto no-scrollbar pt-2 font-black">
                      {PROMPT_REC_AMOUNTS.map(plan => (
                        <div 
                          key={plan}
                          onClick={() => setRechargeAmt(plan.toString())}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] rounded-full cursor-pointer hover:bg-violet-500 hover:text-white shrink-0"
                        >
                          ₹{plan}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest pl-1">Transaction 4-Digit Security PIN</label>
                    <input 
                      type="password" 
                      maxLength={4}
                      pattern="\d{4}"
                      required 
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black text-center tracking-[1em]" 
                      placeholder="0000"
                      value={rechargePin}
                      onChange={e => setRechargePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                  </div>

                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl">
                    Pay Account Bill
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Add Money Tab */}
      {tab === 'add_money' && (
        <div className="max-w-2xl mx-auto space-y-8 text-left">
          <div className="text-center">
            <h2 className="text-3xl font-black text-black tracking-tight font-sans">Load Cash Wallet</h2>
            <p className="text-xs text-blue-700 font-extrabold uppercase tracking-widest mt-2 font-mono">Instant loading via UPI QR scanner verification</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-200 space-y-8 shadow-md">
            <div className="flex flex-col items-center gap-4 p-6 bg-blue-50 rounded-[2rem] border-2 border-dashed border-blue-300">
              <span className="px-3 py-1.5 bg-blue-100 border border-blue-300 text-blue-900 text-[8px] font-black rounded-full uppercase tracking-wider font-mono">SECURE INSTANT PAY</span>
              <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center border-2 border-blue-200">
                {qrCode ? (
                  <img src={qrCode} alt="Admin QR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center gap-2">
                    <ShieldCheck size={48} strokeWidth={1} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">QR UNCONFIGURED</span>
                  </div>
                )}
              </div>
              <p className="text-xs font-black text-black">Scan to pay with Paytm, PhonePe, BHIM or GPay</p>
            </div>

            <form onSubmit={handleAddMoneySubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest ml-1">Top-Up Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-6 py-4 bg-white border-2 border-blue-150 rounded-2xl focus:border-blue-500 focus:outline-none transition-all font-black text-lg text-black placeholder-slate-400"
                    placeholder="0.00"
                    value={addMoneyData.amount}
                    onChange={e => setAddMoneyData({...addMoneyData, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-2 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest ml-1">12-Digit Reference/UTR ID</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-6 py-4 bg-white border-2 border-blue-150 rounded-2xl focus:border-blue-500 focus:outline-none transition-all font-bold text-sm text-black placeholder-slate-400"
                    placeholder="Enter Payment UPI UTR"
                    value={addMoneyData.utr}
                    onChange={e => setAddMoneyData({...addMoneyData, utr: e.target.value.replace(/\D/g, '')})}
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest ml-1">Attach Transfer Screenshot (Optional / वैकल्पिक)</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleScreenshotChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full px-6 py-8 bg-blue-50 border-2 border-dashed border-blue-300 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover:bg-blue-100 transition-colors">
                    {addMoneyData.screenshot ? (
                      <div className="text-center">
                        <img src={addMoneyData.screenshot} alt="Preview" className="h-24 rounded-lg shadow-md mx-auto" referrerPolicy="no-referrer" />
                        <p className="text-[9px] text-green-700 font-extrabold mt-1">✓ Screenshot loaded successfully</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 border border-blue-200">
                          <Compass size={24} />
                        </div>
                        <p className="text-xs font-black text-black">Tap here to choose transfer image proof</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-2xl shadow-md active:scale-[0.99] transition-all uppercase tracking-widest text-xs cursor-pointer">
                Submit Deposit proof
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal and Payout Request Tab */}
      {tab === 'withdraw' && (
        <div className="max-w-5xl mx-auto space-y-8 text-left">
          <div className="text-center">
            <h2 className="text-3xl font-black text-black tracking-tight font-sans">Payout & Bank Settlements</h2>
            <p className="text-xs text-blue-800 font-extrabold uppercase tracking-widest mt-2 font-mono">Durable settlement and payout engine</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-200 shadow-md space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-55 rounded-2xl flex items-center justify-center text-blue-700 border border-blue-200">
                  <Landmark size={20} />
                </div>
                <h3 className="text-lg font-black text-black uppercase tracking-wider">Settlement Node</h3>
              </div>
              
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onUpdateBankDetails(bankForm); }}>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">A/C Legal Holder Name</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-bold text-sm text-black outline-none focus:border-blue-500" value={bankForm.holderName} onChange={e => setBankForm({...bankForm, holderName: e.target.value})} required />
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">Bank Name</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-bold text-sm text-black outline-none focus:border-blue-500" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">Account Number</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-bold text-sm text-black outline-none focus:border-blue-500" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} required />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">IFSC SWIFT Code</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-bold text-sm text-black outline-none focus:border-blue-500" value={bankForm.ifscCode} onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})} required />
                  </div>
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">UPI ID for settlements (Paytm/BHIM)</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-bold text-sm text-black outline-none focus:border-blue-500" placeholder="username@upi" value={bankForm.upiId || ''} onChange={e => setBankForm({...bankForm, upiId: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-2xl uppercase tracking-widest transition-all shadow-md cursor-pointer">
                  Apply Bank Details
                </button>
              </form>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-200 shadow-md space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center text-green-700 border border-green-200">
                  <Trophy size={20} />
                </div>
                <h3 className="text-lg font-black text-black uppercase tracking-wider">Settlement Request</h3>
              </div>

              <div className="p-5 bg-blue-50 rounded-[2rem] flex items-center justify-between border-2 border-blue-250">
                <div>
                  <p className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Main Wallet Balance</p>
                  <p className="text-3xl font-black text-green-800">₹{user.wallets.main.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-red-700 uppercase">Limit minimum</p>
                  <p className="text-sm font-black text-black">₹50.00</p>
                </div>
              </div>

              <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">Settlement Pay (₹)</label>
                  <input 
                    type="number" 
                    min="50" 
                    className="w-full px-6 py-4 bg-white border-2 border-blue-150 rounded-2xl font-black text-2xl text-black outline-none focus:border-blue-500"
                    placeholder="0.00"
                    value={withdrawalAmount}
                    onChange={e => setWithdrawalAmount(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">Type 4-Digit Security PIN</label>
                  <input 
                    type="password" 
                    maxLength={4} 
                    inputMode="numeric" 
                    pattern="\d{4}" 
                    className="w-full px-6 py-4 bg-white border-2 border-blue-150 rounded-2xl font-black text-center tracking-[1em] text-black outline-none focus:border-blue-500"
                    placeholder="0000"
                    value={withdrawalPin}
                    onChange={e => setWithdrawalPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required 
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all cursor-pointer">
                  Confirm TDS Settlement
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Transfer Tab */}
      {tab === 'transfer' && (
        <div className="max-w-md mx-auto space-y-8 text-left">
          <div className="text-center">
            <h2 className="text-3xl font-black text-black tracking-tight font-sans">Wallet Operations</h2>
            <p className="text-xs text-blue-700 font-extrabold uppercase tracking-widest mt-2 font-mono">Convert balances or transfer peer-to-peer</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-200 space-y-6 shadow-md">
            {/* Toggle buttons to switch transfer modes */}
            <div className="flex bg-blue-50 p-1 rounded-2xl border border-blue-150">
              <button 
                type="button"
                onClick={() => setTransferSubTab('main')}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  transferSubTab === 'main'
                    ? "bg-blue-700 text-white shadow-md font-black"
                    : "text-blue-900 hover:text-blue-755"
                )}
              >
                Main Wallet
              </button>
              <button 
                type="button"
                onClick={() => setTransferSubTab('ewallet')}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  transferSubTab === 'ewallet'
                    ? "bg-blue-700 text-white shadow-md font-black"
                    : "text-blue-900 hover:text-blue-755"
                )}
              >
                E-Wallet Peer
              </button>
              <button 
                type="button"
                onClick={() => setTransferSubTab('self_conversion')}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  transferSubTab === 'self_conversion'
                    ? "bg-blue-700 text-white shadow-md font-black"
                    : "text-blue-900 hover:text-blue-755"
                )}
              >
                Self Topup
              </button>
            </div>

            {/* Display Wallet Balance Box dynamically */}
            {transferSubTab === 'main' && (
              <div className="p-6 bg-blue-700 rounded-3xl text-white shadow-md">
                <p className="text-[9px] font-black text-blue-105 uppercase tracking-widest mb-1">Source: Active Main Wallet</p>
                <p className="text-3xl font-black">₹{user.wallets.main.toFixed(2)}</p>
              </div>
            )}

            {transferSubTab === 'ewallet' && (
              <div className="p-6 bg-blue-900 rounded-3xl text-white shadow-md">
                <p className="text-[9px] font-black text-blue-105 uppercase tracking-widest mb-1">Source: E-Wallet Balance</p>
                <p className="text-3xl font-black">₹{(user.wallets.ewallet || 0).toFixed(2)}</p>
              </div>
            )}

            {transferSubTab === 'self_conversion' && (
              <div className="p-6 bg-blue-955 rounded-3xl text-white shadow-md">
                <p className="text-[9px] font-black text-blue-105 uppercase tracking-widest mb-1">Source: Main Wallet ➔ E-Wallet Conversion</p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[8px] text-blue-200 font-bold uppercase tracking-widest">Main</span>
                    <p className="text-lg font-black">₹{user.wallets.main.toFixed(2)}</p>
                  </div>
                  <span className="text-xl">➔</span>
                  <div>
                    <span className="text-[8px] text-blue-200 font-bold uppercase tracking-widest">E-Wallet</span>
                    <p className="text-lg font-black">₹{(user.wallets.ewallet || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Render selected form */}
            {transferSubTab === 'main' && (
              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">Recipient Member Email</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-bold text-sm text-black outline-none focus:border-blue-500"
                    placeholder="name@spay.com"
                    value={transferData.email}
                    onChange={e => setTransferData({...transferData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">Transfer Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-black text-xl text-black outline-none focus:border-blue-500"
                    placeholder="0.00"
                    value={transferData.amount}
                    onChange={e => setTransferData({...transferData, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">Security PIN</label>
                  <input 
                    type="password" 
                    maxLength={4} 
                    inputMode="numeric" 
                    pattern="\d{4}" 
                    className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-black text-center tracking-[1em] text-black outline-none focus:border-blue-500"
                    placeholder="0000"
                    value={transferData.pin}
                    onChange={e => setTransferData({...transferData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                    required 
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all cursor-pointer">
                  Send Main Wallet Funds
                </button>
              </form>
            )}

            {transferSubTab === 'ewallet' && (
              <form onSubmit={handleEwalletTransferSubmit} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">Beneficiary E-Wallet Email</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-bold text-sm text-black outline-none focus:border-blue-500"
                    placeholder="recipient@spay.com"
                    value={ewalletTransfer.email}
                    onChange={e => setEwalletTransfer({...ewalletTransfer, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">Transfer Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-black text-xl text-black outline-none focus:border-blue-500"
                    placeholder="0.00"
                    value={ewalletTransfer.amount}
                    onChange={e => setEwalletTransfer({...ewalletTransfer, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">Security PIN</label>
                  <input 
                    type="password" 
                    maxLength={4} 
                    inputMode="numeric" 
                    pattern="\d{4}" 
                    className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-black text-center tracking-[1em] text-black outline-none focus:border-blue-500"
                    placeholder="0000"
                    value={ewalletTransfer.pin}
                    onChange={e => setEwalletTransfer({...ewalletTransfer, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                    required 
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all cursor-pointer font-sans">
                  Send E-Wallet Cash
                </button>
              </form>
            )}

            {transferSubTab === 'self_conversion' && (
              <form onSubmit={handleSelfEwalletConversionSubmit} className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 text-[10px] text-blue-900 font-bold uppercase rounded-2xl leading-relaxed">
                  💡 main wallet se e-wallet me topup self ke liye instant zero charges block configuration node call.
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">Amount to Transfer to E-Wallet (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-black text-xl text-black outline-none focus:border-blue-500"
                    placeholder="0.00"
                    value={selfEwalletConversion.amount}
                    onChange={e => setSelfEwalletConversion({...selfEwalletConversion, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest pl-1">Security PIN</label>
                  <input 
                    type="password" 
                    maxLength={4} 
                    inputMode="numeric" 
                    pattern="\d{4}" 
                    className="w-full px-5 py-3.5 bg-white border-2 border-blue-150 rounded-2xl font-black text-center tracking-[1em] text-black outline-none focus:border-blue-500"
                    placeholder="0000"
                    value={selfEwalletConversion.pin}
                    onChange={e => setSelfEwalletConversion({...selfEwalletConversion, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                    required 
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-800 hover:bg-blue-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all cursor-pointer font-sans">
                  Activate Self Convert Topup
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Complete and Corrected 20-Level Matrix Referral Team View */}
      {tab === 'mlm' && (() => {
        // dynamic level calculation
        const levelStats = [...Array(20)].map((_, i) => {
          const levelNum = i + 1;
          const cashEarned = transactions
            .filter(t => t.userId === user.id && t.walletType === 'commission' && t.description.includes(`Level ${levelNum} `))
            .reduce((sum, t) => sum + Math.max(0, t.amount), 0);
          const coinsEarned = transactions
            .filter(t => t.userId === user.id && t.walletType === 'coinwallet' && t.description.includes(`Level ${levelNum} `))
            .reduce((sum, t) => sum + Math.max(0, t.amount), 0);
          return { cashEarned, coinsEarned };
        });

        return (
          <div className="space-y-8 text-left border-0">
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-3xl font-black text-black dark:text-white tracking-tight">Active Matrix Team</h2>
              <p className="text-xs text-[#0077C0] font-black uppercase tracking-widest mt-2 font-mono">{activeDownlineCount} Active of {myDownline.length} Total Members</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(20)].map((_, i) => {
                const levelMembers = myDownline.filter(u => u.level === (user.level + i + 1));
                const activeCount = levelMembers.filter(u => u.isActivated).length;
                const statsObj = levelStats[i] || { cashEarned: 0, coinsEarned: 0 };
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(1.5, i * 0.04) }}
                    key={i} 
                    className="bg-blue-50/95 dark:bg-blue-900/10 p-6 rounded-3xl border-2 border-blue-200 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 text-green-700 font-extrabold border-2 border-green-200 rounded-2xl flex items-center justify-center font-mono shrink-0">
                          LVL {i+1}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-black uppercase tracking-widest block leading-none">Team Count</p>
                          <p className="text-sm font-black text-black dark:text-white mt-1 block leading-none">{levelMembers.length} Members</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-green-700 dark:text-green-400 uppercase tracking-wider block leading-none">{activeCount} Active</p>
                        <div className="w-16 h-1 mt-1.5 bg-blue-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-600 rounded-full" 
                            style={{ width: `${levelMembers.length ? (activeCount / levelMembers.length) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-white/80 dark:bg-slate-950/50 p-3 rounded-2xl border-2 border-blue-150">
                      <div className="text-left">
                        <span className="text-[8px] font-black text-black uppercase tracking-widest font-mono">Commission</span>
                        <p className="text-xs font-black text-green-600 dark:text-green-400 mt-1 block leading-none">₹{statsObj.cashEarned.toFixed(2)}</p>
                      </div>
                      <div className="text-right border-l border-blue-150 pl-2">
                        <span className="text-[8px] font-black text-black uppercase tracking-widest font-mono">Coins Reward</span>
                        <p className="text-xs font-black text-green-750 dark:text-green-400 mt-1 block leading-none">🪙 {statsObj.coinsEarned.toLocaleString()}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Support Chat Interface */}
      {tab === 'support' && (
        <div className="max-w-4xl mx-auto h-[550px] flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border shadow-md overflow-hidden text-left">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0077C0]/10 rounded-full flex items-center justify-center text-[#0077C0]">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">SmartPay Interactive Support</h3>
                <p className="text-[9px] text-green-600 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Service Center Live
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/20 dark:bg-slate-850/20">
            {chatMessages.map(msg => (
              <div key={msg.id} className={cn("flex flex-col", msg.senderId === user.id ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[75%] p-4 rounded-3xl text-xs font-semibold shadow-sm",
                  msg.senderId === user.id ? "bg-[#003B73] text-white rounded-tr-none" : "bg-white dark:bg-slate-800 dark:text-slate-100 text-slate-800 rounded-tl-none border dark:border-slate-750"
                )}>
                  {msg.message}
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {chatMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <MessageSquare size={48} className="text-slate-300 mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type your query below. Our team is responsive of critical issues.</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <form onSubmit={(e) => { e.preventDefault(); if(chatInput.trim()) { onSendMessage(chatInput, 'admin'); setChatInput(''); } }} className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-violet-500 font-medium text-sm"
                placeholder="Type your payment/referral query..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button type="submit" className="px-6 bg-slate-800 hover:bg-black text-white rounded-xl flex items-center justify-center shadow-lg uppercase text-xs font-black tracking-widest">
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rewards Target/Claim Tracker Module */}
      {tab === 'rewards' && (
        <div className="space-y-8 text-left">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-3xl font-black text-slate-850 dark:text-white tracking-tight font-black">Achievers Club Bounties</h2>
            <p className="text-xs text-[#0077C0] font-black uppercase tracking-widest mt-2">Active downlines unlocked rewards targets</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(user.rewards || []).map(r => {
              const progress = Math.min(100, (activeDownlineCount / r.targetSalesCount) * 100);
              const isLocked = activeDownlineCount < r.targetSalesCount;
              
              return (
                <div key={r.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-150 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-3xl font-black mb-4">
                        {r.image}
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 text-[8px] font-black rounded-full uppercase tracking-widest",
                        r.status === 'approved' ? 'bg-green-150 text-green-700' :
                        r.status === 'claimed' ? 'bg-blue-150 text-blue-700' :
                        isLocked ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-700'
                      )}>
                        {r.status === 'approved' ? 'Dispatched' : r.status === 'claimed' ? 'Reviewing' : isLocked ? 'Locked' : 'Achieved'}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-800 dark:text-slate-100 mt-2 uppercase tracking-tight">{r.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Requires {r.targetSalesCount} Active Matrix Members</p>

                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Current Active Matrix</span>
                        <span>{activeDownlineCount} / {r.targetSalesCount}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-600" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                    <button 
                      disabled={isLocked || r.status !== 'locked'}
                      onClick={() => onClaimReward && onClaimReward(r.id)}
                      className={cn(
                        "w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        r.status === 'claimed' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' :
                        r.status === 'approved' ? 'bg-green-600 text-white cursor-not-allowed' :
                        isLocked ? 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/15'
                      )}
                    >
                      {r.status === 'claimed' ? 'Claim Request Lodged' : r.status === 'approved' ? 'Reward Redeemed' : 'Claim Reward Target'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shopping Tab Segment with categories, search and order coupon codes */}
      {tab === 'shop' && (
        <div className="space-y-6 text-left">
          <div className="text-center max-w-sm mx-auto">
            <h2 className="text-3xl font-black text-slate-850 dark:text-white tracking-tight font-black">Super Shop</h2>
            <p className="text-xs text-violet-600 dark:text-violet-400 font-black uppercase tracking-widest mt-2">Earn extreme commission multipliers on point items</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products, brands, groceries..." 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-850 dark:border-slate-700 border rounded-2xl font-semibold text-sm focus:outline-none focus:border-violet-500"
                value={shopSearch}
                onChange={e => setShopSearch(e.target.value)}
              />
            </div>

            {/* Category selection */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar font-black py-1">
              {['All', 'Electronics', 'Mobile', 'Fashion', 'Grocery', 'Healthcare', 'Home Appliances', 'Beauty', 'Books'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setShopCategory(cat)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl uppercase tracking-wider text-[10px] whitespace-nowrap transition-all border shrink-0",
                    shopCategory === cat ? 'bg-violet-600 text-white border-transparent' : 'bg-slate-50 dark:bg-slate-800 dark:border-slate-800 text-slate-500'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            {/* Coupon input */}
            <div className="p-4 bg-violet-50 dark:bg-violet-950/20 data-theme rounded-2xl flex flex-col md:flex-row gap-2 justify-between items-center border border-violet-100 dark:border-violet-900/30">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-violet-600 dark:text-violet-400" />
                <p className="text-xs font-semibold text-violet-900 dark:text-violet-200 uppercase tracking-wide">
                  Offer: Apply Code <span className="font-mono font-black border-2 border-dashed border-violet-500/40 px-1 py-0.5 rounded text-xs">S360WELCOME</span> for ₹100 flat savings on items.
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                <input type="text" placeholder="PROMO CODE" className="px-3 py-2 border rounded-xl font-bold uppercase text-xs w-full md:w-32 bg-white text-slate-900" value={shopCoupon} onChange={e => setShopCoupon(e.target.value)} />
                <button onClick={handleApplyCoupon} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black uppercase rounded-xl">Apply</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map(p => {
              const adjustedPrice = Math.max(1, p.price - (appliedDiscount > 0 ? (appliedDiscount / filteredProducts.length) : 0));
              return (
                <motion.div 
                  whileHover={{ y: -5 }}
                  key={p.id} 
                  className="bg-blue-50/95 dark:bg-blue-900/20 rounded-[2rem] border-2 border-blue-200 overflow-hidden flex flex-col justify-between"
                >
                  <div className="h-44 bg-white dark:bg-slate-800 flex items-center justify-center text-6xl relative border-b border-blue-100">
                    {p.image}
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-blue-150 shadow-sm">
                      <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">{p.category}</p>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-black dark:text-white mb-1 text-sm line-clamp-1">{p.name}</h4>
                      <p className="text-[10px] text-neutral-800 dark:text-neutral-200 font-bold line-clamp-2 leading-tight">{p.description}</p>
                      
                      {p.vendorName && (
                        <span className="text-[8px] font-black text-green-700 dark:text-green-400 uppercase tracking-wider block mt-2">🏪 {p.vendorName}</span>
                      )}
                    </div>
                    
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-black text-green-700 dark:text-green-400">₹{adjustedPrice.toFixed(0)}</p>
                          <p className="text-[10px] text-black line-through font-extrabold">MRP ₹{p.mrp}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider">{p.mlmPoints} BV</p>
                          <p className="text-[8px] font-black text-black uppercase">MLM points</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { onOrder(user.id, p.id); }}
                        className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Checkout Order
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                <ShoppingBag size={48} className="text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No matching products found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction History Section */}
      {tab === 'activity' && (
        <div className="space-y-6 text-left animate-fade-in">
          <div className="bg-gradient-to-r from-purple-800 to-purple-950 p-8 rounded-[2.5rem] text-white border-2 border-purple-400 relative overflow-hidden shadow-sm">
            <span className="text-[8px] font-black bg-blue-500 text-white px-2.5 py-1 rounded-full uppercase tracking-widest font-mono font-sans">FINANCIAL AUDIT DECK</span>
            <h2 className="text-2xl font-black uppercase tracking-tight mt-3">Transaction ledger history</h2>
            <p className="text-blue-200 text-xs mt-1">Sleek real-time ledger of deposit receipts, wallet transfers, MLM commissions, and utility recharges.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 border-blue-105 dark:border-blue-900/30 shadow-sm space-y-6">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[9px] font-black uppercase text-slate-400 mr-2">Filter Wallet:</span>
              {(['all', 'main', 'ewallet', 'coinwallet', 'commission', 'recharge'] as const).map(wType => (
                <button
                  key={wType}
                  type="button"
                  onClick={() => setLedgerFilter(wType)}
                  className={cn(
                    "px-4 py-2 border-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    ledgerFilter === wType
                      ? "bg-blue-700 text-white border-transparent shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-205 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750"
                  )}
                >
                  {wType} Account
                </button>
              ))}
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-950 rounded-3xl border-2 border-blue-50 dark:border-blue-950/40 overflow-hidden divide-y divide-blue-50 dark:divide-blue-950/40">
              {filteredLedger.map(tx => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={tx.id} 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 hover:bg-blue-50/50 dark:hover:bg-slate-900/20 gap-4 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner shrink-0",
                      tx.amount > 0 ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-905' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-350 border border-red-200 dark:border-red-905'
                    )}>
                      {tx.type === 'recharge' ? '📱' : tx.type === 'add_funds' ? '💰' : tx.type === 'activation' ? '⚡' : tx.type === 'commission' ? '👑' : '💸'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-955 dark:text-white leading-tight">{tx.description}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        TX: {tx.id} • {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto self-end sm:self-center">
                    <p className={cn("text-lg font-black tracking-tight", tx.amount > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-650 dark:text-red-400')}>
                      {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <span className="inline-block px-2.5 py-0.5 mt-1 bg-blue-50 dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-[8px] font-black uppercase rounded tracking-wider border border-blue-100 dark:border-blue-900/10">
                      {tx.walletType} wallet
                    </span>
                  </div>
                </motion.div>
              ))}
              {filteredLedger.length === 0 && (
                <div className="py-20 text-center bg-white dark:bg-slate-950">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-blue-200 dark:border-blue-900/30">
                    <Wallet className="text-blue-500" size={32} />
                  </div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">No logs match your filter</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Income History Section */}
      {tab === 'income' && (() => {
        const commissionTxs = transactions.filter(tx => tx.walletType?.toLowerCase() === 'commission' || tx.type === 'commission' || tx.description.toLowerCase().includes('commission') || tx.description.toLowerCase().includes('royalty') || tx.description.toLowerCase().includes('bonus') || tx.description.toLowerCase().includes('points'));
        const totalCommissionEarned = commissionTxs.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
        
        const levelIncome = commissionTxs.filter(t => t.description.toLowerCase().includes('level')).reduce((acc, t) => acc + t.amount, 0);
        const repurchaseIncome = commissionTxs.filter(t => t.description.toLowerCase().includes('repurchase') || t.description.toLowerCase().includes('purchase') || t.description.toLowerCase().includes('order')).reduce((acc, t) => acc + t.amount, 0);
        
        return (
          <div className="space-y-6 text-left animate-fade-in">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-950 p-8 rounded-[2.5rem] text-white border-2 border-emerald-400 relative overflow-hidden shadow-sm">
              <span className="text-[8px] font-black bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">FINANCIAL GENEALOGY REPORTS</span>
              <h2 className="text-2xl font-black uppercase tracking-tight mt-3">My MLM Income Audit</h2>
              <p className="text-emerald-200 text-xs mt-1">Real-time audit track of cumulative matrix royalties, product repurchase commissions, and direct node expansion bonuses.</p>
            </div>

            {/* Income cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-900/30 rounded-[2rem] text-left">
                <p className="text-gray-455 dark:text-gray-500 font-extrabold text-[9px] uppercase tracking-wider">Level commissions</p>
                <p className="text-3xl font-black text-emerald-800 dark:text-emerald-400 mt-1">₹{levelIncome.toFixed(2)}</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold mt-1.5 leading-relaxed">Direct cascading 20-level downline commissions</p>
              </div>
              <div className="p-6 bg-teal-50/50 dark:bg-teal-950/20 border-2 border-teal-200 dark:border-teal-900/30 rounded-[2rem] text-left">
                <p className="text-gray-455 dark:text-gray-500 font-extrabold text-[9px] uppercase tracking-wider">Repurchase BV Profits</p>
                <p className="text-3xl font-black text-teal-800 dark:text-teal-400 mt-1">₹{repurchaseIncome.toFixed(2)}</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold mt-1.5 leading-relaxed">Commissions calculated from downline purchases</p>
              </div>
              <div className="p-6 bg-amber-50/50 dark:bg-amber-950/10 border-2 border-amber-200 dark:border-amber-900/20 rounded-[2rem] text-left">
                <p className="text-gray-455 dark:text-gray-500 font-extrabold text-[9px] uppercase tracking-wider">Staked Coin wallet</p>
                <p className="text-3xl font-black text-amber-800 dark:text-amber-400 mt-1">{(user.wallets?.coinwallet || 0).toLocaleString()} Coins</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold mt-1.5 leading-relaxed">Cryptographic yield reward assets</p>
              </div>
            </div>

            {/* Income Ledger */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 border-blue-105 dark:border-blue-900/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white font-sans">Direct & Matrix Commission Logs</h3>
                <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded">
                  Cumulative: ₹{totalCommissionEarned.toFixed(2)}
                </span>
              </div>
              
              <div className="bg-white dark:bg-slate-950 rounded-3xl border-2 border-blue-50 dark:border-blue-950/40 overflow-hidden divide-y divide-blue-50 dark:divide-blue-950/40">
                {commissionTxs.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center p-6 hover:bg-emerald-50/20 dark:hover:bg-slate-900/20 transition-colors">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-center text-lg shadow-sm font-black">
                        👑
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-955 dark:text-white leading-tight">{tx.description}</p>
                        <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                          Ref: {tx.id} • {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-emerald-700 dark:text-emerald-400">+₹{tx.amount.toFixed(2)}</p>
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Processed successfully</span>
                    </div>
                  </div>
                ))}
                {commissionTxs.length === 0 && (
                  <div className="py-20 text-center bg-white dark:bg-slate-950">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-emerald-200 dark:border-emerald-900/30">
                      <Trophy className="text-emerald-500" size={32} />
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">No commission entries found yet</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold leading-relaxed px-6">Refer users using your referral code {user.referralCode} to build your live team and earn massive passive royalties up to 20 levels deep!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* profile View Section */}
      {tab === 'profile' && (
        <div className="space-y-6 text-left animate-fade-in">
          <div className="bg-gradient-to-r from-purple-900 to-indigo-950 p-8 rounded-[2.5rem] text-white border-2 border-purple-400 relative overflow-hidden shadow-sm">
            <span className="text-[8px] font-black bg-blue-650 text-white px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">SECURE REPRESENTATIVE DESK</span>
            <h2 className="text-2xl font-black uppercase tracking-tight mt-3">Representative profile hub</h2>
            <p className="text-blue-200 text-xs mt-1">Complete your identity validations, configure e-wallet direct deposits, edit bank forms, and monitor secure nodes.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Identity Card and Sponsor */}
            <div className="p-8 bg-white dark:bg-slate-955 border-2 border-blue-105 dark:border-blue-900/20 rounded-[2.5rem] space-y-6 text-left shadow-sm">
              <div className="flex items-center gap-4 border-b border-blue-50 dark:border-blue-50 pb-4">
                <div className="w-14 h-14 bg-blue-650 rounded-3xl flex items-center justify-center text-white text-2xl font-black uppercase shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-950 dark:text-white text-base leading-tight uppercase truncate">{user.name}</h4>
                  <p className="text-[10px] text-slate-500 font-extrabold truncate mt-0.5">{user.email}</p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-semibold font-sans">
                <div>
                  <p className="text-[8px] font-black text-slate-450 uppercase tracking-widest">Phone Contact</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">{user.phone}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-450 uppercase tracking-widest">Regional State</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">{user.state}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-450 uppercase tracking-widest">Genealogy Level Depth</p>
                  <p className="font-black text-blue-700 dark:text-blue-300 mt-1 uppercase">Node Row #{user.level || 0}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-450 uppercase tracking-widest">Membership status</p>
                  <span className={cn(
                    "inline-block px-2.5 py-0.5 mt-1 text-[8px] font-black rounded uppercase tracking-wider",
                    user.isActivated ? "bg-green-100 text-green-800 dark:bg-green-950 border border-green-300" : "bg-red-100 text-red-800 dark:bg-red-950 border border-red-300"
                  )}>
                    {user.isActivated ? '✅ Active Member' : '🚫 Inactive'}
                  </span>
                </div>
              </div>

              {/* Referral code copy */}
              <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-550">
                <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest mb-1">Downline signup link</p>
                <div className="flex items-center justify-between mt-2 gap-2 bg-white dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-205 dark:border-slate-800">
                  <p className="font-mono text-xs font-black text-green-700 dark:text-green-400 truncate">{user.referralCode}</p>
                  <button 
                    type="button"
                    onClick={() => {
                      const signupUrl = `${window.location.origin}?ref=${user.referralCode}`;
                      navigator.clipboard.writeText(signupUrl); 
                      alert('Sponsor Referral Sign-up Link Copied!');
                    }} 
                    className="p-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-all active:scale-90 cursor-pointer"
                    title="Copy Link"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2: Citizenship KYC Card */}
            <div className="p-8 bg-white dark:bg-slate-955 border-2 border-blue-105 dark:border-blue-900/20 rounded-[2.5rem] space-y-5 text-left shadow-sm">
              <div className="flex items-center gap-3 border-b border-blue-50 dark:border-blue-900/20 pb-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-blue-700 dark:text-blue-300 border border-blue-150">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-black dark:text-white leading-none">Citizenship KYC</h4>
                  <span className={cn(
                    "px-2 py-0.5 text-[8.0px] font-black rounded uppercase tracking-wider inline-block mt-2",
                    user.kycDetails?.status === 'approved' ? 'bg-green-100 text-green-700' :
                    user.kycDetails?.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  )}>
                    {user.kycDetails?.status || "NOT SUBMITTED"}
                  </span>
                </div>
              </div>

              {(!user.kycDetails || user.kycDetails.status === 'not_submitted') ? (
                <form onSubmit={(e) => { e.preventDefault(); if (onSubmitKYC) onSubmitKYC(kycAadhaar, kycPan, kycGst); }} className="space-y-4">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal">Submit UID/Aadhaar and PAN details below for corporate verification to allow heavy commission settlements & banking conversions.</p>
                  <div>
                    <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest pl-1 mb-1">Aadhaar Card Number (12 digit)</label>
                    <input type="text" placeholder="Aadhaar Card (12 Digits)" pattern="\d{12}" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-blue-150 dark:border-blue-900/40 rounded-xl text-xs font-bold text-black dark:text-white focus:border-blue-500 outline-none" value={kycAadhaar} onChange={e => setKycAadhaar(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest pl-1 mb-1">Permanent Account PAN (10 chars)</label>
                    <input type="text" placeholder="PAN Number" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-blue-150 dark:border-blue-900/40 rounded-xl text-xs font-bold uppercase text-black dark:text-white focus:border-blue-500 outline-none" value={kycPan} onChange={e => setKycPan(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest pl-1 mb-1">GST Registration (Optional)</label>
                    <input type="text" placeholder="GST Registration" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-blue-150 dark:border-blue-900/40 rounded-xl text-xs font-bold uppercase text-black dark:text-white focus:border-blue-500 outline-none" value={kycGst} onChange={e => setKycGst(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer">Submit Documents</button>
                </form>
              ) : user.kycDetails.status === 'pending' ? (
                <div className="bg-amber-50 dark:bg-amber-955/20 p-5 rounded-2xl border-2 border-dashed border-amber-300 text-slate-800 dark:text-slate-200">
                  <p className="text-xs font-black">📄 Verification Active</p>
                  <p className="text-[10px] font-bold mt-1.5 leading-relaxed">Compliance audit desk is actively checking Aadhaar, GST and PAN. Expect account verification shortly.</p>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-955/25 p-5 rounded-2xl border-2 border-green-300 text-green-900 dark:text-green-300">
                  <p className="text-xs font-black">✅ KYC Account Verified</p>
                  <p className="text-[10.5px] font-bold mt-1.5 leading-relaxed">Corporate KYC verified on file. Unlimited banking disbursements and repurchase commissions enabled.</p>
                </div>
              )}
            </div>

            {/* Column 3: Direct Banking Details Card */}
            <div className="p-8 bg-white dark:bg-slate-955 border-2 border-blue-105 dark:border-blue-900/20 rounded-[2.5rem] space-y-4 text-left shadow-sm">
              <div className="flex items-center gap-3 border-b border-blue-50 dark:border-blue-50 pb-4">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 border border-blue-150">
                  <Landmark size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-black dark:text-white leading-none">Bank Accounts</h4>
                  <p className="text-[8.5px] text-slate-400 uppercase font-black tracking-wider mt-2.5">Disbursement accounts</p>
                </div>
              </div>

              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  onUpdateBankDetails(bankForm); 
                  alert('🏦 Standard banking ledger details updated successfully!'); 
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest pl-1 mb-1">Bank Name</label>
                  <input type="text" placeholder="State Bank of India / HDFC" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-blue-150 dark:border-blue-900/40 rounded-xl text-xs font-bold text-black dark:text-white focus:border-blue-500 outline-none" value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-455 uppercase tracking-widest pl-1 mb-1">Account Holder Full Name</label>
                  <input type="text" placeholder="Full name of beneficiary" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-blue-150 dark:border-blue-900/40 rounded-xl text-xs font-bold text-black dark:text-white focus:border-blue-500 outline-none" value={bankForm.holderName} onChange={e => setBankForm({ ...bankForm, holderName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest pl-1 mb-1">Account Number (8 to 18 digits)</label>
                  <input type="text" placeholder="Beneficiary Account Number" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-blue-150 dark:border-blue-900/40 rounded-xl text-xs font-bold text-black dark:text-white focus:border-blue-500 outline-none" value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })} />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest pl-1 mb-1">IFSC Code Route (11 chars)</label>
                  <input type="text" placeholder="IFSC Code" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-blue-150 dark:border-blue-900/40 rounded-xl text-xs font-bold uppercase text-black dark:text-white focus:border-blue-500 outline-none" value={bankForm.ifscCode} onChange={e => setBankForm({ ...bankForm, ifscCode: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest pl-1 mb-1">UPI Address (Recipient UPI Id)</label>
                  <input type="text" placeholder="UPI Handle (name@upi)" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-blue-150 dark:border-blue-900/40 rounded-xl text-xs font-bold text-black dark:text-white focus:border-blue-500 outline-none" value={bankForm.upiId} onChange={e => setBankForm({ ...bankForm, upiId: e.target.value })} />
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-700 hover:bg-indigo-805 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer">Update bank settings</button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
