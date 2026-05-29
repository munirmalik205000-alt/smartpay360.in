
import React, { useState, useMemo } from 'react';
import { User, Transaction, Product, PaymentRequest, WithdrawalRequest, ChatMessage, BankDetails, RewardTarget } from '../types';
import { Wallet, Bell, LogOut, ShieldCheck, MessageSquare, Share2, Copy, CheckCircle2, AlertCircle, TrendingUp, Users, ShoppingBag, ArrowRight, UserCheck, HelpCircle, Trophy, Sparkles, Landmark, FileText, Compass, Search, Tag, Eye, EyeOff, Heart, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../services/utils';

interface DashboardProps {
  user: User;
  users: User[];
  products: Product[];
  transactions: Transaction[];
  onRecharge: (userId: string, amt: number, service: string, pin: string, operator: string) => void;
  onOrder: (userId: string, pId: string) => void;
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
  tab, setTab, onSubmitKYC, onClaimReward
}) => {
  const [transferData, setTransferData] = useState({ email: '', amount: '', pin: '' });
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

  // KYC States
  const [kycAadhaar, setKycAadhaar] = useState(user.kycDetails?.aadhaarNumber || '');
  const [kycPan, setKycPan] = useState(user.kycDetails?.panNumber || '');
  const [kycGst, setKycGst] = useState(user.kycDetails?.gstNumber || '');

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
    { label: 'Recharge Bal', val: `₹${user.wallets.recharge.toFixed(2)}`, color: 'text-emerald-500', icon: Wallet, desc: 'Used for bills' },
    { label: 'Royal Cash', val: `₹${user.wallets.main.toFixed(2)}`, color: 'text-violet-600 dark:text-violet-400', icon: TrendingUp, desc: 'Main balance' },
    { label: 'MLM Income', val: `₹${user.wallets.commission.toFixed(2)}`, color: 'text-emerald-600', icon: Trophy, desc: 'Locked earnings' },
    { label: 'Direct Referrals', val: users.filter(u => u.referrerId === user.id).length.toString(), color: 'text-violet-500 dark:text-violet-400', icon: Users, desc: 'Direct Team' },
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
    if (!addMoneyData.screenshot) return alert('🚨 Verification screenshot required to process ledger load.');
    onAddMoney({ amount: amt, utr: addMoneyData.utr, screenshot: addMoneyData.screenshot });
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
    
    onRecharge(user.id, amt, `${selectedUtility.name} (${customerNumber})`, rechargePin, rechargeProvider);
    
    // reset
    setSelectedUtility(null);
    setRechargeAmt('');
    setCustomerNumber('');
    setRechargePin('');
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
    <div className="space-y-6 md:pb-6 relative">
      {/* Decorative Multi-Color Spectrum bar for White, Blue, Purple, Green, Red, Orange */}
      <div className="h-1.5 w-full rounded-full flex overflow-hidden shadow-sm">
        <div className="w-[16%] h-full bg-white dark:bg-slate-300"></div>
        <div className="w-[17%] h-full bg-blue-500"></div>
        <div className="w-[17%] h-full bg-purple-600"></div>
        <div className="w-[17%] h-full bg-emerald-500"></div>
        <div className="w-[17%] h-full bg-rose-500"></div>
        <div className="w-[16%] h-full bg-orange-500"></div>
      </div>
      
      {/* Beautiful Home Header & Balance Cards replacing previous bento stats/sliders */}
      {tab === 'home' && (
        <div className="space-y-6">
          {/* 1. Header Greetings in high UX design */}
          <div className="text-left py-2">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest pl-0.5 leading-none font-mono">Welcome back,</p>
            <h1 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight mt-1 flex items-center gap-1.5 leading-tight">
              {user.name}
            </h1>
          </div>

          {/* 2. Unified Premium Gradient Balance Card */}
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-[#9a62fc] via-[#6e4afd] to-[#36d8b7] p-6 text-white shadow-xl overflow-hidden text-left transition-all duration-300 border border-white/10">
            {/* Soft overlay */}
            <div className="absolute inset-0 bg-black/5 mix-blend-overlay pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col gap-6">
              
              {/* Row 1: TOTAL BALANCE pill + Eye Toggle */}
              <div className="flex items-center justify-between">
                <span className="px-3.5 py-1.5 bg-white/15 border border-white/20 rounded-full text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 shadow-inner leading-none font-mono">
                  ✨ Total Balance
                </span>
                <button 
                  onClick={toggleShowBalances} 
                  className="p-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-full transition-all border border-white/10 shadow-sm"
                  title={showBalances ? "Hide details" : "Show details"}
                >
                  {showBalances ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>

              {/* Row 2: Heavy visual balance amount */}
              <div>
                <p className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-0.5 leading-none">
                  ₹{showBalances ? (user.wallets.recharge + user.wallets.main + user.wallets.commission).toFixed(2) : "•••••"}
                </p>
              </div>

              {/* Row 3: Sub-balances Row styled in custom Blue, Purple, Green glass tags */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-600/35 border border-blue-400/30 p-3 flex flex-col justify-between shadow-inner rounded-2xl relative overflow-hidden backdrop-blur-sm">
                  <span className="text-[8px] font-black text-blue-100 uppercase tracking-wider pl-0.5 font-mono">MAIN</span>
                  <span className="text-xs md:text-sm font-black tracking-tight mt-1 truncate text-white">
                    ₹{showBalances ? user.wallets.recharge.toFixed(2) : "•••••"}
                  </span>
                </div>

                <div className="bg-purple-600/35 border border-purple-400/30 p-3 flex flex-col justify-between shadow-inner rounded-2xl relative overflow-hidden backdrop-blur-sm">
                  <span className="text-[8px] font-black text-purple-100 uppercase tracking-wider pl-0.5 font-mono font-mono">E-WALLET</span>
                  <span className="text-xs md:text-sm font-black tracking-tight mt-1 truncate text-white">
                    ₹{showBalances ? user.wallets.main.toFixed(2) : "•••••"}
                  </span>
                </div>

                <div className="bg-emerald-600/35 border border-emerald-400/30 p-3 flex flex-col justify-between shadow-inner rounded-2xl relative overflow-hidden backdrop-blur-sm">
                  <span className="text-[8px] font-black text-emerald-100 uppercase tracking-wider pl-0.5 font-mono">COINS</span>
                  <span className="text-xs md:text-sm font-black tracking-tight mt-1 truncate text-white">
                    {showBalances ? Math.floor(user.wallets.commission) : "•••••"}
                  </span>
                </div>
              </div>

              {/* Row 4: Action helper navigation buttons (Added Money + Withdraw - REMOVED Invest) */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <button 
                  onClick={() => setTab('add_money')}
                  className="py-3.5 bg-white text-violet-700 hover:bg-slate-50 font-black rounded-full text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all text-center animate-pulse"
                >
                  + Add Money
                </button>
                <button 
                  onClick={() => setTab('withdraw')}
                  className="py-3.5 bg-white/15 hover:bg-white/25 text-white font-black rounded-full text-xs uppercase tracking-widest border border-white/25 hover:border-white/40 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
                >
                  🏦 Withdraw
                </button>
              </div>

              {/* Row 5: Referral sponsor portfolio bar */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/10 mt-1 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-white text-sm">
                    👥
                  </div>
                  <div>
                    <span className="text-[7.5px] font-black text-white/70 uppercase tracking-widest block leading-none">Your Referral Code</span>
                    <span className="font-mono font-black text-xs tracking-widest mt-0.5 block leading-none">{user.referralCode}</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const signupUrl = `${window.location.origin}?ref=${user.referralCode}`;
                    navigator.clipboard.writeText(signupUrl); 
                    alert('Referral Sign-up Link Copied Successfully!');
                  }} 
                  className="p-2 bg-white/15 hover:bg-white/25 rounded-xl transition-all border border-white/10 hover:border-white/20 active:scale-90 text-white"
                  title="Copy Refer Link"
                >
                  <Copy size={12} />
                </button>
              </div>

            </div>
          </div>

          {/* 3. Activation Banner (rendered inline if not activated) */}
          {!user.isActivated && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-purple-505/10 border-2 border-dashed border-purple-500/20 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 text-left bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-2xl flex items-center justify-center text-purple-605 dark:text-purple-400 shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-purple-900 dark:text-[#a855f7] font-extrabold text-base tracking-tight">Ecosystem Locked</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Activate account for ₹{packagePrice} to claim downline 20-level commission structures!</p>
                </div>
              </div>
              <button 
                onClick={() => onActivate(user.id)} 
                className="w-full md:w-auto bg-[#36d8b7] hover:bg-[#28c2a3] text-slate-900 font-black px-8 py-3.5 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-[10px] shadow-lg shadow-teal-400/20"
              >
                Activate Now
              </button>
            </motion.div>
          )}

          {/* 4. Highly Polished "Quick Actions" Section */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/60">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 mb-6 text-left flex items-center gap-2">
              <span className="w-1.5 h-3 bg-violet-600 rounded-full inline-block"></span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-4 gap-3 md:gap-4">
              {[
                { id: 'utility', icon: Wallet, label: 'Utility Pay', color: 'from-violet-500 to-purple-600 shadow-violet-500/10' },
                { id: 'add_money', icon: Landmark, label: 'Add Cash', color: 'from-emerald-500 to-green-600 shadow-emerald-500/10' },
                { id: 'transfer', icon: Share2, label: 'Send Cash', color: 'from-purple-500 to-indigo-600 shadow-purple-500/10' },
                { id: 'withdraw', icon: ShieldCheck, label: 'Payout', color: 'from-emerald-600 to-teal-500 shadow-emerald-600/10' },
              ].map((action) => (
                <button
                  key={action.id}
                  onClick={() => setTab(action.id)}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className={cn("w-14 h-14 md:w-16 md:h-16 rounded-[1.8rem] flex items-center justify-center text-white shadow-lg transition-all group-hover:scale-105 group-active:scale-95 bg-gradient-to-br", action.color)}>
                    <action.icon size={22} className="md:size-[26px]" />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Promotion / Ads banners Grid to complement combination layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-gradient-to-br from-violet-950 to-purple-900 rounded-[2rem] border border-white/5 text-white flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] font-black bg-purple-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">ECOMMERCE BENEFIT</span>
                    <h4 className="font-extrabold text-lg mt-2">Repurchase Scheme</h4>
                    <p className="text-slate-300 text-xs mt-1">Get MLM Points (BV) on every purchase and earn level commissions deep in your genealogy.</p>
                  </div>
                  <button onClick={() => setTab('shop')} className="text-purple-300 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 mt-4 text-left hover:underline">
                    Shop Marketplace <ArrowRight size={14} />
                  </button>
                </div>

                <div className="p-6 bg-gradient-to-br from-emerald-950 to-teal-900 rounded-[2rem] border border-white/5 text-white flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">REWARDS CLASH</span>
                    <h4 className="font-extrabold text-lg mt-2">Achiever Rewards</h4>
                    <p className="text-slate-300 text-xs mt-1">Claim laptops, bikes and luxury sports BMW cars as downlines activate contracts.</p>
                  </div>
                  <button onClick={() => setTab('rewards')} className="text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 mt-4 text-left hover:underline">
                    Track Rewards <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Transactions list */}
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Security Audit Logs</h3>
                <button onClick={() => setTab('activity')} className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">Full Ledger</button>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/80 overflow-hidden">
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {transactions.slice(0, 6).map(tx => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={tx.id} 
                      className="flex items-center justify-between p-6 hover:bg-slate-55/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner",
                          tx.amount > 0 ? 'bg-green-50 text-green-600 dark:bg-green-950/20' : 'bg-red-50 text-red-600 dark:bg-red-950/20'
                        )}>
                          {tx.type === 'recharge' ? '📱' : tx.type === 'add_funds' ? '💰' : tx.type === 'activation' ? '⚡' : '💸'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-850 dark:text-slate-200">{tx.description}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-base font-black tracking-tight", tx.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                          {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] mt-0.5">{tx.walletType}</p>
                      </div>
                    </motion.div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="py-20 text-center">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <Wallet className="text-slate-200" size={32} />
                      </div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">No transactions logged</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Complete KYC Details Status Card inside Dashboard */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl flex items-center justify-center text-indigo-500">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200">KYC Status Audit</h4>
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-black rounded-full uppercase tracking-wider inline-block mt-0.5",
                      user.kycDetails?.status === 'approved' ? 'bg-green-100 text-green-700' :
                      user.kycDetails?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    )}>
                      {user.kycDetails?.status || "NOT SUBMITTED"}
                    </span>
                  </div>
                </div>

                {(!user.kycDetails || user.kycDetails.status === 'not_submitted') ? (
                  <form onSubmit={(e) => { e.preventDefault(); if (onSubmitKYC) onSubmitKYC(kycAadhaar, kycPan, kycGst); }} className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-medium">Verify your citizenship details to allow heavy cash withdrawals.</p>
                    <input type="text" placeholder="Aadhaar Card (12 Digits)" pattern="\d{12}" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold dark:bg-slate-800 dark:border-slate-700" value={kycAadhaar} onChange={e => setKycAadhaar(e.target.value.replace(/\D/g, ''))} />
                    <input type="text" placeholder="PAN Number (10 Alphanumeric)" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase dark:bg-slate-800 dark:border-slate-700" value={kycPan} onChange={e => setKycPan(e.target.value)} />
                    <input type="text" placeholder="GST Registration (Optional)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase dark:bg-slate-800 dark:border-slate-700" value={kycGst} onChange={e => setKycGst(e.target.value)} />
                    <button type="submit" className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">Submit Documents</button>
                  </form>
                ) : user.kycDetails.status === 'pending' ? (
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl text-center border">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">📄 KYC Verification Active</p>
                    <p className="text-[10px] text-slate-400 mt-1">Audit team is checking Aadhaar & PAN details. Expect verification shortly.</p>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-2xl text-center border border-green-200">
                    <p className="text-xs font-bold text-green-700 dark:text-green-400">✅ Merchant Account Verified</p>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Standard commission withdrawal enabled</p>
                  </div>
                )}
              </div>

              {/* Referral Code Box */}
              <div className="bg-violet-500/10 border border-violet-500/20 p-8 rounded-[3rem] text-slate-900 dark:text-white relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <h4 className="font-extrabold text-xl mb-1 flex items-center gap-2 text-violet-900 dark:text-violet-200">Referrals Portfolio</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">Build business cascades and earn passive direct & matrix commissions.</p>
                  
                  <div className="bg-white/80 dark:bg-slate-805 backdrop-blur-xl p-5 rounded-3xl border border-violet-500/10 mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sponsor Code</p>
                      <p className="font-mono font-black text-xl tracking-[0.1em] text-violet-700 dark:text-violet-300">{user.referralCode}</p>
                    </div>
                    <button 
                      onClick={() => {
                        const signupUrl = `${window.location.origin}?ref=${user.referralCode}`;
                        navigator.clipboard.writeText(signupUrl); 
                        alert('Sponsor Referral Sign-up Link Copied!');
                      }} 
                      className="p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl transition-all"
                      title="Copy Refer Link"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')} className="py-3 bg-[#25D366] text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm uppercase tracking-wider">WhatsApp</button>
                    <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(shareText)}`, '_blank')} className="py-3 bg-[#0088cc] text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm uppercase tracking-wider">Telegram</button>
                    <button onClick={() => setTab('mlm')} className="py-3 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm uppercase tracking-wider dark:bg-slate-800">My Team</button>
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
              { name: 'Prepaid Recharge', icon: '📱', color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-105' },
              { name: 'Postpaid Bill', icon: '🧾', color: 'bg-orange-50 dark:bg-orange-950/20 border-orange-105' },
              { name: 'DTH TV Recharge', icon: '📡', color: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-105' },
              { name: 'Electricity Bill', icon: '⚡', color: 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-105' },
              { name: 'Water Pipe Bill', icon: '💧', color: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-105' },
              { name: 'Broadband Wifi', icon: '🌐', color: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-105' },
              { name: 'FASTag RFID', icon: '🚗', color: 'bg-pink-50 dark:bg-pink-950/20 border-pink-105' },
              { name: 'LPG Cooking Gas', icon: '🔥', color: 'bg-rose-50 dark:bg-rose-950/20 border-rose-105' },
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
                    "bg-white dark:bg-slate-900 p-6 rounded-[2rem] border shadow-sm text-center transition-all cursor-pointer",
                    !user.isActivated ? 'border-amber-500/10 hover:border-amber-500/35 bg-amber-50/5 dark:bg-amber-950/5' : 'hover:border-blue-400'
                  )}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl bg-slate-50 dark:bg-slate-800">{u.icon}</div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 uppercase tracking-wider">{u.name}</p>
                  <p className="text-[9px] font-black text-emerald-500 uppercase mt-0.5">2% CASHBACK + 20-L MLM</p>
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
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1 mb-2">Select Operator Service Provider</label>
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
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">Mobile / Connection / Consumer ID</label>
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
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">Recharge Amount (₹)</label>
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
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">Transaction 4-Digit Security PIN</label>
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
            <h2 className="text-3xl font-black text-slate-850 dark:text-white tracking-tight">Load Cash Wallet</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Instant loading via UPI QR scanner verification</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-805 space-y-8 shadow-md">
            <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 dark:bg-slate-850 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
              <span className="px-3 py-1 bg-violet-100 dark:bg-violet-950/40 text-brand-primary text-[8px] font-black rounded-full uppercase tracking-wider">SECURE INSTANT PAY</span>
              <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center border">
                {qrCode ? (
                  <img src={qrCode} alt="Admin QR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-slate-300 flex flex-col items-center gap-2">
                    <ShieldCheck size={48} strokeWidth={1} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">QR UNCONFIGURED</span>
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Scan to pay with Paytm, PhonePe, Bhim or GPay</p>
            </div>

            <form onSubmit={handleAddMoneySubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Top-Up Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-black text-lg"
                    placeholder="0.00"
                    value={addMoneyData.amount}
                    onChange={e => setAddMoneyData({...addMoneyData, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">12-Digit Reference/UTR ID</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 focus:outline-none transition-all font-bold text-sm"
                    placeholder="Enter Payment UPI UTR"
                    value={addMoneyData.utr}
                    onChange={e => setAddMoneyData({...addMoneyData, utr: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attach Transfer Screenshot</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleScreenshotChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full px-6 py-8 bg-slate-50 border-2 border-dashed border-slate-200 dark:bg-slate-80 y-8 border-slate-700 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                    {addMoneyData.screenshot ? (
                      <div className="text-center">
                        <img src={addMoneyData.screenshot} alt="Preview" className="h-24 rounded-lg shadow-md mx-auto" referrerPolicy="no-referrer" />
                        <p className="text-[9px] text-green-500 font-semibold mt-1 uppercase">Screenshot loaded successfully</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm text-slate-400">
                          <Compass size={24} />
                        </div>
                        <p className="text-xs font-bold text-slate-500">Tap here to choose transfer image proof</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-gradient-to-r from-blue-700 to-[#0077C0] text-white font-black rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-widest text-xs">
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
            <h2 className="text-3xl font-black text-slate-850 dark:text-white tracking-tight">Payout & Bank Settlements</h2>
            <p className="text-xs text-[#0077C0] font-bold uppercase tracking-widest mt-2">Durable settlement and payout engine</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#0077C0]/10 rounded-2xl flex items-center justify-center text-[#0077C0]">
                  <Landmark size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-850 dark:text-white uppercase tracking-wider">Settlement Node</h3>
              </div>
              
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onUpdateBankDetails(bankForm); }}>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">A/C Legal Holder Name</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold text-sm" value={bankForm.holderName} onChange={e => setBankForm({...bankForm, holderName: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">Bank Name</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold text-sm" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">Account Number</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold text-sm" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">IFSC SWIFT Code</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold text-sm" value={bankForm.ifscCode} onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">UPI ID for settlements (Paytm/BHIM)</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold text-sm" placeholder="username@upi" value={bankForm.upiId || ''} onChange={e => setBankForm({...bankForm, upiId: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-4 bg-slate-800 hover:bg-black text-white text-xs font-black rounded-xl uppercase tracking-widest transition-all">
                  Apply Bank Details
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                  <Trophy size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-850 dark:text-white uppercase tracking-wider">Settlement Request</h3>
              </div>

              <div className="p-5 bg-amber-500/10 rounded-[2rem] flex items-center justify-between border border-amber-500/20">
                <div>
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Commission Wallet Ledger</p>
                  <p className="text-3xl font-black text-amber-500">₹{user.wallets.commission.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Limit minimum</p>
                  <p className="text-xs font-black text-slate-600">₹50.00</p>
                </div>
              </div>

              <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">Settlement Pay (₹)</label>
                  <input 
                    type="number" 
                    min="50" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black text-2xl"
                    placeholder="0.00"
                    value={withdrawalAmount}
                    onChange={e => setWithdrawalAmount(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">Type 4-Digit Security PIN</label>
                  <input 
                    type="password" 
                    maxLength={4} 
                    inputMode="numeric" 
                    pattern="\d{4}" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black text-center tracking-[1em]"
                    placeholder="0000"
                    value={withdrawalPin}
                    onChange={e => setWithdrawalPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required 
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-[#0077C0] hover:bg-[#003B73] text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all">
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
            <h2 className="text-3xl font-black text-slate-850 dark:text-white tracking-tight">Peer Transfer</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Zero-fee instant peer transfer</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <div className="p-6 bg-[#003B73] rounded-3xl text-white shadow-lg">
              <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Available Coin Wallet</p>
              <p className="text-3xl font-black">₹{user.wallets.main.toFixed(2)}</p>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">Beneficiary Member Email</label>
                <input 
                  type="email" 
                  required 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold text-sm"
                  placeholder="name@spay.com"
                  value={transferData.email}
                  onChange={e => setTransferData({...transferData, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">Cash Value (₹)</label>
                <input 
                  type="number" 
                  required 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-705 rounded-2xl font-black text-xl"
                  placeholder="0.00"
                  value={transferData.amount}
                  onChange={e => setTransferData({...transferData, amount: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest pl-1">Confirm Security PIN</label>
                <input 
                  type="password" 
                  maxLength={4} 
                  inputMode="numeric" 
                  pattern="\d{4}" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-705 rounded-2xl font-black text-center tracking-[1em]"
                  placeholder="0000"
                  value={transferData.pin}
                  onChange={e => setTransferData({...transferData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                  required 
                />
              </div>
              <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-transform">
                Initiate Instant Share
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complete and Corrected 20-Level Matrix Referral Team View */}
      {tab === 'mlm' && (
        <div className="space-y-8 text-left">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-3xl font-black text-slate-850 dark:text-white tracking-tight">Active Matrix Team</h2>
            <p className="text-xs text-[#0077C0] font-black uppercase tracking-widest mt-2">{activeDownlineCount} Active of {myDownline.length} Total Members</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(20)].map((_, i) => {
              // Level details up to level 20 cascading
              const levelMembers = myDownline.filter(u => u.level === (user.level + i + 1));
              const activeCount = levelMembers.filter(u => u.isActivated).length;
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(1.5, i * 0.04) }}
                  key={i} 
                  className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-805 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl flex items-center justify-center font-black text-indigo-500 text-xs border border-indigo-200 dark:border-indigo-900">
                      LVL {i+1}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Level Structure</p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-200">{levelMembers.length} Members</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-wider">{activeCount} Activated</p>
                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${levelMembers.length ? (activeCount / levelMembers.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

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
                        r.status === 'claimed' ? 'bg-slate-200 text-slate-450 cursor-not-allowed' :
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
                  className="bg-white dark:bg-slate-900 rounded-[2rem] border shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  <div className="h-44 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-6xl relative">
                    {p.image}
                    <div className="absolute top-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-sm">
                      <p className="text-[10px] font-black text-brand-secondary uppercase tracking-widest">{p.category}</p>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-205 mb-1 text-sm line-clamp-1">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-tight">{p.description}</p>
                      
                      {p.vendorName && (
                        <span className="text-[8px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-wider block mt-2">🏪 {p.vendorName}</span>
                      )}
                    </div>
                    
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-black text-slate-900 dark:text-slate-100">₹{adjustedPrice.toFixed(0)}</p>
                          <p className="text-[10px] text-slate-400 line-through font-bold">MRP ₹{p.mrp}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">{p.mlmPoints} BV</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">MLM points</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { onOrder(user.id, p.id); }}
                        className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-[10px] font-black rounded-lg uppercase tracking-wider transition-all"
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
    </div>
  );
};

export default Dashboard;
