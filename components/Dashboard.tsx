
import React, { useState, useMemo } from 'react';
import { User, Transaction, Product, PaymentRequest, WithdrawalRequest, ChatMessage, BankDetails, RewardTarget, UserRole, Package } from '../types';
import { Wallet, Bell, LogOut, ShieldCheck, MessageSquare, Share2, Copy, CheckCircle2, AlertCircle, TrendingUp, Users, ShoppingBag, ArrowRight, UserCheck, HelpCircle, Trophy, Sparkles, Landmark, FileText, Compass, Search, Tag, Eye, EyeOff, Heart, Check, Trash2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../services/utils';

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
  packages = [], onBuyPackage, onMainToEWalletTransfer, onEWalletToEWalletTransfer
}) => {
  const [transferData, setTransferData] = useState({ email: '', amount: '', pin: '' });
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
    <div className="space-y-6 md:pb-6 relative text-black bg-white font-sans">
      {/* Decorative spectrum bar */}
      <div className="h-1.5 w-full rounded-full flex overflow-hidden shadow-sm animate-pulse">
        <div className="w-[50%] h-full bg-blue-700"></div>
        <div className="w-[50%] h-full bg-white border"></div>
      </div>

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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2 border-b-2 border-blue-200 pb-4">
            <div className="text-left">
              <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest pl-0.5 leading-none font-mono">
                ⚡ NODE ID SYSTEM ENABLED
              </p>
              <h1 className="text-3xl font-black text-black tracking-tight mt-1 flex items-center gap-1.5 leading-tight">
                {user.name} <Sparkles size={18} className="text-amber-600 animate-spin" />
              </h1>
            </div>
            
            <div className="bg-blue-50 px-4 py-2.5 rounded-2xl border-2 border-blue-200 flex items-center gap-3 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse"></span>
              <p className="text-[9px] font-black uppercase tracking-widest text-black font-mono">
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
                  🏦 Bank Withdrawal 
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
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border-2 border-blue-200">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-black mb-6 text-left flex items-center gap-2">
              <span className="w-1.5 h-3 bg-blue-700 rounded-full inline-block"></span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-4 gap-3 md:gap-4">
              {[
                { id: 'utility', icon: Wallet, label: 'Utility Pay', color: 'from-emerald-500 to-green-600 shadow-green-500/10' },
                { id: 'add_money', icon: Landmark, label: 'Add Cash', color: 'from-green-600 to-teal-600 shadow-emerald-500/10' },
                { id: 'transfer', icon: Share2, label: 'Send Cash', color: 'from-teal-600 to-emerald-600 shadow-teal-500/10' },
                { id: 'withdraw', icon: ShieldCheck, label: 'Payout', color: 'from-green-500 to-emerald-500 shadow-green-500/10' },
              ].map((action) => (
                <button
                  type="button"
                  key={action.id}
                  onClick={() => setTab(action.id)}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className={cn("w-14 h-14 md:w-16 md:h-16 rounded-[1.8rem] flex items-center justify-center text-white shadow-lg transition-all group-hover:scale-105 group-active:scale-95 bg-gradient-to-br", action.color)}>
                    <action.icon size={22} className="md:size-[26px]" />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black text-black uppercase tracking-wider text-center">{action.label}</span>
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
                    "bg-blue-50/95 dark:bg-blue-900/20 p-6 rounded-[2rem] border border-blue-200 shadow-sm text-center transition-all cursor-pointer hover:border-blue-450"
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
                    className="w-full px-6 py-4 bg-white border-2 border-blue-150 rounded-2xl focus:border-blue-500 focus:outline-none transition-all font-black text-lg text-black placeholder-slate-450"
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
                    className="w-full px-6 py-4 bg-white border-2 border-blue-150 rounded-2xl focus:border-blue-500 focus:outline-none transition-all font-bold text-sm text-black placeholder-slate-455"
                    placeholder="Enter Payment UPI UTR"
                    value={addMoneyData.utr}
                    onChange={e => setAddMoneyData({...addMoneyData, utr: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest ml-1">Attach Transfer Screenshot</label>
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
    </div>
  );
};

export default Dashboard;
