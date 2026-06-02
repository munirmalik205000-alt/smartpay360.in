import React, { useState, useMemo, useEffect } from 'react';
import { User, Transaction, Product, PaymentRequest, WithdrawalRequest, ChatMessage, BankDetails } from '../types';
import { compressImage } from '../services/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Smartphone, 
  Tv, 
  Zap, 
  Droplet, 
  Car, 
  Globe, 
  CreditCard, 
  Send, 
  Landmark, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Network, 
  MessageSquare, 
  ShoppingBag, 
  Copy, 
  Share2, 
  ShieldCheck, 
  ShieldAlert,
  ChevronRight, 
  History, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowDownToLine,
  ChevronDown,
  Coins,
  QrCode,
  Wallet,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Users,
  Check,
  MessageCircle,
  Clock,
  Layers,
  Search,
  Filter,
  Flame,
  Award,
  CircleAlert,
  X,
  FileText
} from 'lucide-react';

interface DashboardProps {
  user: User;
  users: User[];
  products: Product[];
  transactions: Transaction[];
  onRecharge: (userId: string, amt: number, service: string, pin: string) => void;
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
  activeTab?: 'home' | 'utility' | 'shop' | 'transfer' | 'mlm' | 'add_money' | 'withdraw' | 'support';
  setActiveTab?: (tab: 'home' | 'utility' | 'shop' | 'transfer' | 'mlm' | 'add_money' | 'withdraw' | 'support') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, users, products, transactions, onRecharge, onOrder, onTransfer, 
  onActivate, packagePrice, qrCode, onAddMoney, paymentRequests,
  withdrawalRequests, onWithdrawal, onUpdateBankDetails, chatMessages, onSendMessage,
  activeTab, setActiveTab
}) => {
  const [localTab, setLocalTab] = useState<'home' | 'utility' | 'shop' | 'transfer' | 'mlm' | 'add_money' | 'withdraw' | 'support'>('home');
  const tab = activeTab || localTab;
  const setTab = setActiveTab || setLocalTab;

  // --- Dynamic states ---
  const [transferData, setTransferData] = useState({ email: '', amount: '', pin: '' });
  const [addMoneyData, setAddMoneyData] = useState({ amount: '', utr: '', screenshot: '' });
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalPin, setWithdrawalPin] = useState('');
  const [bankForm, setBankForm] = useState<BankDetails>(user.bankDetails || { bankName: '', accountNumber: '', ifscCode: '', holderName: '' });
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // --- Paytm/PhonePe style custom recharges modal states ---
  const [selectedUtility, setSelectedUtility] = useState<{
    name: string;
    icon: React.ReactNode;
    color: string;
    placeholder: string;
    operators: string[];
    label: string;
  } | null>(null);

  const [utilityFormData, setUtilityFormData] = useState({
    connectionId: '',
    operator: '',
    amount: '',
    pin: '',
  });

  // --- Ledger filter & Realtime search states ---
  const [passbookSearch, setPassbookSearch] = useState('');
  const [passbookFilter, setPassbookFilter] = useState<'all' | 'credit' | 'debit' | 'recharge' | 'mlm_incentive' | 'peer_transfer'>('all');

  // Sync bank details if user prop changes
  useEffect(() => {
    if (user.bankDetails) {
      setBankForm(user.bankDetails);
    }
  }, [user.bankDetails]);

  // Downline calculations
  const myDownline = useMemo(() => {
    const findDownline = (uId: string): User[] => {
      const directs = users.filter(u => u.sponsor_id === uId);
      let fullList = [...directs];
      directs.forEach(d => {
        fullList = [...fullList, ...findDownline(d.id)];
      });
      return fullList;
    };
    return findDownline(user.id);
  }, [users, user.id]);

  const activeDownlineCount = useMemo(() => {
    return myDownline.filter(u => u.is_active || u.isActivated).length;
  }, [myDownline]);

  const shareText = `Join SmartPay 360 & unlock 10 Levels of instant commission, direct peer transfers & secure utilities! Sponsor key: ${(user.referralCode || user.id.slice(0,8))}`;
  const shareUrl = window.location.origin;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode || user.id.slice(0, 8));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareUrl}?ref=${user.referralCode || user.id.slice(0, 8)}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = (platform: 'whatsapp' | 'telegram' | 'facebook') => {
    let url = '';
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    switch (platform) {
      case 'whatsapp': url = `https://wa.me/?text=${encodedText}`; break;
      case 'telegram': url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`; break;
      case 'facebook': url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`; break;
    }
    window.open(url, '_blank');
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const comp = await compressImage(reader.result as string, 600, 600);
          setAddMoneyData((prev) => ({ ...prev, screenshot: comp }));
        } catch (err) {
          console.error("Compression abort:", err);
          setAddMoneyData((prev) => ({ ...prev, screenshot: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMoneySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(addMoneyData.amount);
    if (isNaN(amt) || amt <= 0) return alert('Enter a valid deposit amount (₹)');
    
    const finalUtr = addMoneyData.utr.trim();
    if (finalUtr.length < 8) return alert('Enter a valid UPI Reference / UTR ID');
    
    const finalScreenshot = addMoneyData.screenshot || '';
    
    onAddMoney({ amount: amt, utr: finalUtr, screenshot: finalScreenshot });
    setAddMoneyData({ amount: '', utr: '', screenshot: '' });
  };

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawalAmount);
    if (isNaN(amt) || amt < 50) return alert('Minimum withdrawal limit is ₹50');
    if (amt > user.wallet_balance) {
      return alert(`Insufficient wallet balance. You have ₹${user.wallet_balance.toFixed(2)}.`);
    }
    if (withdrawalPin.length !== 4) return alert('Enter a valid 4-digit UPI Security Transaction PIN');
    onWithdrawal(amt, withdrawalPin);
    setWithdrawalAmount('');
    setWithdrawalPin('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferData.amount);
    if (isNaN(amt) || amt <= 0) return alert('Enter a valid transfer amount (₹)');
    if (amt > user.wallet_balance) {
      return alert(`Insufficient funds to process transfer. Available: ₹${user.wallet_balance.toFixed(2)}.`);
    }
    if (!transferData.email) return alert('Enter recipient registered email');
    if (transferData.pin.length !== 4) return alert('Enter your 4-digit UPI Security PIN');
    onTransfer(user.id, transferData.email, amt, transferData.pin);
    setTransferData({ email: '', amount: '', pin: '' });
  };

  // Safe and modern Custom UI Utility recharges triggers
  const executePremiumUtilityRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.is_active && !user.isActivated) {
      alert('⚠️ Premium Membership Required!\nUtility recharges and bill settlements are reserved exclusively for Lifetime Premium Members. Please activate your license to unlock these features instantly.');
      return;
    }
    const amt = parseFloat(utilityFormData.amount);
    if (isNaN(amt) || amt <= 0) return alert('Please enter a valid recharge amount (₹)');
    
    const requiredMin = 10;
    if (amt < requiredMin) return alert(`Minimum recharge value is ₹${requiredMin}`);
    
    if (utilityFormData.connectionId.trim().length < 4) {
      return alert(`Please specify a valid connection number or customer reference index`);
    }

    if (!utilityFormData.operator) {
      return alert('Please select a service provider / operator to route the payment');
    }

    if (utilityFormData.pin.length !== 4) {
      return alert('Validation Failed: Your 4-digit security PIN is incorrect or empty');
    }

    // Call upstream action
    onRecharge(user.id, amt, `${selectedUtility?.name} (${utilityFormData.operator}) Ref: ${utilityFormData.connectionId.trim()}`, utilityFormData.pin);
    
    // Reset states and close modal
    setUtilityFormData({ connectionId: '', operator: '', amount: '', pin: '' });
    setSelectedUtility(null);
  };

  // --- Deeply categorized comprehensive transaction filters ---
  const processedLedgerList = useMemo(() => {
    // 1. Group direct database ledger transactions
    let combined: any[] = [];

    // Add standard on-chain transactions
    transactions.forEach(t => {
      combined.push({
        id: t.id,
        type: t.amount > 0 ? 'credit' : 'debit',
        category: t.transaction_type || t.type || 'wallet_ledger',
        amount: Number(t.amount),
        remark: t.remark || t.description || 'Internal Ledger Sync',
        createdAt: t.createdAt || t.created_at || new Date().toISOString(),
        status: 'SUCCESS'
      });
    });

    // Add pending / rejected paymentrequests for transparency
    paymentRequests.filter(r => r.userId === user.id).forEach(r => {
      if (r.status !== 'approved') { // Approved already captured in transactions
        combined.push({
          id: r.id,
          type: 'credit',
          category: 'add_money_request',
          amount: Number(r.amount),
          remark: `Load Vault (UTR: ${r.utr})`,
          createdAt: r.createdAt,
          status: r.status.toUpperCase()
        });
      }
    });

    // Add pending / rejected withdrawalrequests for transparency
    withdrawalRequests.filter(r => r.userId === user.id).forEach(r => {
      if (r.status !== 'approved') { // Approved already captured in transactions
        combined.push({
          id: r.id,
          type: 'debit',
          category: 'withdrawal_request',
          amount: -Number(r.amount),
          remark: `Bank Settle Request`,
          createdAt: r.createdAt,
          status: r.status.toUpperCase()
        });
      }
    });

    // Sort by chronological order
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply real-time search match
    return combined.filter(item => {
      const matchQuery = passbookSearch.toLowerCase().trim();
      const stringifiedMatch = `${item.remark} ${item.category} ${item.id} ${Math.abs(item.amount)} ${item.status}`.toLowerCase();
      const matchesSearch = stringifiedMatch.includes(matchQuery);

      // Filter chips mapping
      if (!matchesSearch) return false;

      if (passbookFilter === 'all') return true;
      if (passbookFilter === 'credit') return item.amount > 0;
      if (passbookFilter === 'debit') return item.amount < 0;
      if (passbookFilter === 'recharge') {
        return ['recharge', 'utility', 'recharge_wallet'].some(k => item.category.toLowerCase().includes(k)) || item.remark.toLowerCase().includes('recharge');
      }
      if (passbookFilter === 'mlm_incentive') {
        return ['level', 'commission', 'earning', 'mlm', 'downline'].some(k => item.category.toLowerCase().includes(k)) || item.remark.toLowerCase().includes('level') || item.remark.toLowerCase().includes('commission');
      }
      if (passbookFilter === 'peer_transfer') {
        return ['transfer', 'peer', 'send'].some(k => item.category.toLowerCase().includes(k)) || item.remark.toLowerCase().includes('transfer');
      }
      return true;
    });
  }, [transactions, paymentRequests, withdrawalRequests, user.id, passbookSearch, passbookFilter]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4 pb-16 font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900">
      
      {/* 🚀 DYNAMIC NEON HEADER SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* FULL WIDTH COLUMN: DYNAMIC PREMIUM BANNER & STATS */}
        <div className="md:col-span-12 bg-gradient-to-tr from-[#0a071f] via-[#120b30] to-[#060314] text-white p-6 sm:p-8 rounded-3xl border border-purple-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full blur-[140px] opacity-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500 rounded-full blur-[140px] opacity-15 pointer-events-none"></div>
          
          <div className="relative z-10 w-full space-y-6">
            
            {/* Top Row: User Avatar, Name, License tier badge, security badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 via-[#8200ff] to-[#00d0f2] flex items-center justify-center p-[2px] shadow-lg">
                    <div className="w-full h-full rounded-2xl bg-[#09051d] flex items-[#09051d] justify-center text-white font-black text-2xl uppercase tracking-wider">
                      <span className="leading-none m-auto">{user.email[0]}</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#0a071f] flex items-center justify-center text-white" title="Account Status Verified">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                      {user.username || user.email.split('@')[0]}
                    </h2>
                    <motion.span 
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0 shadow-md ${
                        user.is_active ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border border-amber-300/30' : 'bg-slate-800 text-slate-400 border border-white/5'
                      }`}
                    >
                      {user.is_active ? '✨ VIP PREMIUM' : 'BASIC USER'}
                    </motion.span>
                  </div>
                  
                  <p className="text-xs text-purple-200/85 font-medium truncate">{user.email}</p>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg text-slate-300 font-mono">
                      UPI ID: <span className="text-white font-bold">{user.email.split('@')[0]}@ybl</span>
                    </span>
                    <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/10 font-medium">
                      Sponsor Ref: <span className="font-mono font-black text-white">{user.sponsor_id || "DIRECT SYSTEM"}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Audit Badge */}
              <div className="hidden md:flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl self-end sm:self-center">
                <div className="p-2 bg-[#00baf2]/20 rounded-xl border border-[#00baf2]/30 text-[#00baf2]">
                  <ShieldCheck className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left font-sans">
                  <p className="text-[8px] font-black text-slate-450 uppercase tracking-widest leading-none">Security Node</p>
                  <p className="text-xs font-mono font-extrabold text-slate-200 mt-1">SSL-SHA256 SECURED</p>
                  <p className="text-[8px] text-[#00baf2] font-black uppercase tracking-wider leading-none mt-0.5">Status: Operational</p>
                </div>
              </div>
            </div>

            {/* THREE COLUMN PREMIUM BENTO FINANCIAL OVERVIEW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              
              {/* Card 1: Main Balance Wallet */}
              <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-15 group-hover:opacity-30 group-hover:scale-110 transition-all text-purple-400">
                  <Coins className="w-10 h-10" />
                </div>
                <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-purple-400" />
                  Main Wallet Balance
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-2 leading-none tracking-tight">
                  ₹{(user.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="mt-4 flex items-center justify-between text-[9px] text-slate-400 font-bold border-t border-white/5 pt-3">
                  <span>FUND PROTOCOL: LIVE</span>
                  <button onClick={() => setTab('add_money')} className="text-[#00baf2] hover:underline flex items-center gap-1 cursor-pointer">
                    Add Money <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Card 2: E-Recharge Wallet */}
              <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-15 group-hover:opacity-30 group-hover:scale-110 transition-all text-cyan-400">
                  <Zap className="w-10 h-10" />
                </div>
                <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                  E-Recharge Balance
                </p>
                <p className="text-2xl sm:text-3xl font-black text-[#00baf2] mt-2 leading-none tracking-tight">
                  ₹{(user.recharge_wallet || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="mt-4 flex items-center justify-between text-[9px] text-slate-400 font-bold border-t border-white/5 pt-3">
                  <span>BILL OVERREACH: OK</span>
                  <button onClick={() => setTab('utility')} className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer">
                    Pay Utility <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Card 3: Passive Network Commissions */}
              <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border border-white/10 rounded-2xl p-5 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-15 group-hover:opacity-30 group-hover:scale-110 transition-all text-emerald-400">
                  <TrendingUp className="w-10 h-10" />
                </div>
                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  Network Commissions
                </p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 leading-none tracking-tight">
                  ₹{(user.earning_wallet || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="mt-4 flex items-center justify-between text-[9px] text-slate-400 font-bold border-t border-white/5 pt-3">
                  <span>COMMISSIONS INSTANT</span>
                  <button onClick={() => setTab('withdraw')} className="text-emerald-400 hover:underline font-black flex items-center gap-1 cursor-pointer">
                    Withdraw Bank <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* ⚠️ INACTIVE PROMPT CONTAINER AS AN ELEGANT PREMIUM MEMBRANE */}
      {!user.is_active && !user.isActivated && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#170e30] via-[#1a0c3a] to-[#0b0322] text-white p-6 rounded-3xl border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-[-40%] right-[-10%] w-60 h-60 bg-amber-500 rounded-full blur-[100px] opacity-15 pointer-events-none"></div>
          
          <div className="flex gap-4 items-start relative z-10">
            <div className="p-3 bg-amber-500/15 rounded-2xl border border-amber-500/20 text-amber-400 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-black uppercase bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2.5 py-0.5 rounded-full tracking-widest">VIP RESIDUAL LICENSE</span>
                <h3 className="font-extrabold text-base tracking-tight text-white">Unlock Lifetime Residual Earnings & Utilities</h3>
              </div>
              <p className="text-xs text-purple-200 mt-1.5 leading-relaxed max-w-xl">
                Unlock all <strong className="text-amber-400">10 levels of multi-level commission payouts</strong>, referral dynamic network structures, utility bill recharges & settlements, and helper features. Activate your license block for only <strong className="text-amber-400 font-extrabold text-sm">₹{packagePrice}</strong>.
              </p>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={() => {
              if (window.confirm(`Are you sure you want to activate your lifetime premium membership bundle for ₹${packagePrice}?`)) {
                onActivate(user.id);
              }
            }} 
            className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:brightness-110 active:scale-95 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 whitespace-nowrap block text-center transition-all cursor-pointer"
          >
            Activate VIP License
          </button>
        </motion.div>
      )}

      {/* 🏛️ PHONEPE/PAYTM STYLE SERVICE MATRIX */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black text-purple-900/40 uppercase tracking-widest mb-4">Money Transfers & Account Settle</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { id: 'add_money', name: 'Add Cash', desc: 'Load Wallet via QR', color: 'bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100/70', icon: <ArrowDownToLine className="w-5 h-5 text-indigo-600" /> },
            { id: 'transfer', name: 'To Wallet', desc: 'Secure Peer transfer', color: 'bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100/70', icon: <Send className="w-5 h-5 text-emerald-600" /> },
            { id: 'withdraw', name: 'To Bank', desc: 'Settle directly to bank', color: 'bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100/70', icon: <Landmark className="w-5 h-5 text-amber-650" /> },
            { id: 'mlm', name: 'My Network', desc: 'Commission matrix tree', color: 'bg-purple-50 border border-purple-100 text-purple-700 hover:bg-purple-100/70', icon: <Network className="w-5 h-5 text-purple-600" /> }
          ].map(action => (
            <button 
              type="button"
              key={action.id} 
              onClick={() => setTab(action.id as any)}
              className="flex flex-col items-center group transition-all duration-200"
            >
              <div className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl ${action.color} flex items-center justify-center mb-2 shadow-sm transition-transform duration-200 group-hover:-translate-y-1`}>
                {action.icon}
              </div>
              <p className="text-[11px] font-black text-slate-800 leading-tight group-hover:text-purple-700 transition-colors">{action.name}</p>
              <p className="text-[8px] text-slate-400 mt-0.5 hidden xs:block font-bold">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 🧭 NAVIGATION SLIDERS BAR */}
      <div className="bg-[#110c24] p-1.5 rounded-2xl border border-white/[0.05] block overflow-x-auto no-scrollbar shadow-inner relative">
        <div className="flex gap-1">
          {[
            { id: 'home', name: '🏠 Passbook Ledger' },
            { id: 'utility', name: '⚡ Recharges & Utility' },
            { id: 'add_money', name: '📥 Add Cash' },
            { id: 'withdraw', name: '🏛️ Bank Settle' },
            { id: 'shop', name: '🛍️ Shop Items' },
            { id: 'transfer', name: '💸 Transfers' },
            { id: 'mlm', name: '👥 Network MLM' },
            { id: 'support', name: '💬 Helpdesk Chat' },
          ].map(t => (
            <button 
              type="button"
              key={t.id} 
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${
                tab === t.id 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl scale-[1.01]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {t.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 🔮 ANIMATED ACTIONS CONTAINER */}
      <div className="relative overflow-visible">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* VIEW: HOME PASSBOOK WITH REALTIME LEDGER SEARCH & DETAILED CHIP FILTERS */}
            {tab === 'home' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* DETAILED TRANSACTION LOGS MATRIX */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm">
                  
                  {/* Title and stats summary */}
                  <div className="flex justify-between items-start gap-4 mb-5 flex-wrap">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                        <History className="w-5 h-5 text-purple-600" />
                        Passbook Transaction Ledger
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                        Secure transaction filings processed by SmartPay 360
                      </p>
                    </div>
                    <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-100 font-black px-3 py-1 rounded-full shrink-0">
                      {processedLedgerList.length} Transactions
                    </span>
                  </div>

                  {/* Realtime filter input search bar */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search transactions by remark, amount, UTR..." 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:border-purple-500 focus:bg-white text-xs font-bold outline-none transition-all placeholder:text-slate-400"
                      value={passbookSearch}
                      onChange={e => setPassbookSearch(e.target.value)}
                    />
                    {passbookSearch && (
                      <button 
                        onClick={() => setPassbookSearch('')} 
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter tabs chips selection - PhonePe layout */}
                  <div className="flex gap-1.5 overflow-x-auto pb-3.5 no-scrollbar mb-4 border-b border-slate-100/70">
                    {[
                      { id: 'all', label: 'All Passbook' },
                      { id: 'credit', label: 'Received 🟢' },
                      { id: 'debit', label: 'Paid Out 🔴' },
                      { id: 'recharge', label: 'Recharges 📱' },
                      { id: 'mlm_incentive', label: 'Commissions 📈' },
                      { id: 'peer_transfer', label: 'Transfers 💸' },
                    ].map(chip => (
                      <button
                        type="button"
                        key={chip.id}
                        onClick={() => setPassbookFilter(chip.id as any)}
                        className={`px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                          passbookFilter === chip.id 
                            ? 'bg-purple-600 border-purple-600 text-white shadow-sm' 
                            : 'bg-slate-50 border-slate-200/50 text-slate-500 hover:bg-slate-100/50'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Transactions display scrollable tree */}
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
                    {processedLedgerList.map((tx, idx) => {
                      const isCredit = tx.amount > 0;
                      // Dynamic Icon Assignment
                      let txIcon = <ArrowUpRight className="w-5 h-5 text-rose-600" />;
                      let iconColorClass = "bg-rose-50 border border-rose-100";
                      
                      if (isCredit) {
                        txIcon = <ArrowDownLeft className="w-5 h-5 text-emerald-600" />;
                        iconColorClass = "bg-emerald-50 border border-emerald-100";
                      }
                      
                      const categoryLower = tx.category.toLowerCase();
                      if (categoryLower.includes('recharge') || categoryLower.includes('utility')) {
                        txIcon = <Smartphone className="w-5 h-5 text-blue-600" />;
                        iconColorClass = "bg-blue-50 border border-blue-100";
                      } else if (categoryLower.includes('commission') || categoryLower.includes('mlm')) {
                        txIcon = <TrendingUp className="w-5 h-5 text-purple-600" />;
                        iconColorClass = "bg-purple-50 border border-purple-100";
                      } else if (categoryLower.includes('withdrawal') || categoryLower.includes('settle')) {
                        txIcon = <Landmark className="w-5 h-5 text-amber-600" />;
                        iconColorClass = "bg-amber-50 border border-amber-100";
                      } else if (categoryLower.includes('transfer')) {
                        txIcon = <Send className="w-5 h-5 text-teal-600" />;
                        iconColorClass = "bg-teal-50 border border-teal-100";
                      } else if (categoryLower.includes('activation')) {
                        txIcon = <Award className="w-5 h-5 text-amber-500" />;
                        iconColorClass = "bg-amber-50 border border-amber-200";
                      }

                      return (
                        <div key={`${tx.id}-${idx}`} className="flex items-center justify-between p-4 bg-slate-50/40 hover:bg-slate-50/90 transition-colors rounded-2xl border border-slate-100/80">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${iconColorClass}`}>
                              {txIcon}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 leading-tight">
                                {tx.remark}
                              </p>
                              <div className="flex gap-2 items-center mt-1.5 text-[9.5px]">
                                <span className="text-slate-400 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-300" />
                                  {new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="bg-slate-200/50 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase font-mono text-[8px]">
                                  {tx.category.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0 ml-3">
                            <p className={`text-xs sm:text-sm font-black ${isCredit ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {isCredit ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                            </p>
                            <span className={`text-[8px] uppercase tracking-wider font-black px-2 py-0.5 border rounded-md inline-block mt-1 ${
                              tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              tx.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {processedLedgerList.length === 0 && (
                      <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                        <CircleAlert className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="text-slate-400 text-xs font-bold leading-normal">No corresponding ledger history found.</p>
                        <p className="text-[10px] text-slate-300 uppercase font-black mt-1">Change custom filters or adjust search phrase</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* PROMO, SHARE & BINARY INVITATION CARD */}
                <div className="space-y-6">
                  
                  {/* Referral invitation bento box */}
                  <div className="bg-[#110c24] text-white p-6 rounded-3xl border border-white/[0.05] shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 rounded-full blur-[70px] opacity-20"></div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <h4 className="font-extrabold text-sm uppercase tracking-wide text-amber-400">Refer & Earn Residuals</h4>
                      </div>
                      <p className="text-[11px] text-violet-200 leading-relaxed opacity-85">
                        Build your exclusive 10-level matrix tree. Receive residual commissions on every license activation from your direct and indirect downline referrals.
                      </p>

                      <div className="bg-[#1e1742] p-4 rounded-2xl border border-white/5 mt-4">
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Your Private Sponsor Code</p>
                        <div className="flex items-center justify-between gap-1.5 mt-1.5">
                          <span className="font-mono font-black text-sm text-white tracking-widest">
                            {user.referralCode || user.id.slice(0,8)}
                          </span>
                          <button 
                            type="button" 
                            onClick={handleCopyCode} 
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black rounded-lg uppercase tracking-wider transition-all"
                          >
                            {copiedCode ? 'COPIED!' : 'COPY CODE'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 bg-[#1e1742] p-3 rounded-xl border border-white/5">
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Your Joining Link</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-[#00baf2] font-semibold truncate max-w-[130px] font-mono">
                            {shareUrl.replace('https://', '')}/?ref=...
                          </span>
                          <button 
                            type="button"
                            onClick={handleCopyLink}
                            className="text-[9px] text-amber-400 font-extrabold hover:underline select-none ml-1 shrink-0"
                          >
                            {copiedLink ? 'COPIED!' : 'COPY'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="text-[9px] font-black text-slate-400 text-center uppercase tracking-wider mb-3">Quick Social Blast</p>
                      <div className="flex items-center gap-3 justify-center">
                         <button 
                           type="button"
                           onClick={() => handleShare('whatsapp')} 
                           className="w-10 h-10 bg-[#25D366] hover:scale-105 transition-transform flex items-center justify-center rounded-2xl text-white shadow-md cursor-pointer"
                         >
                           <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .015 5.398.015 12.03c0 2.123.553 4.197 1.603 6.034L0 24l6.135-1.61a11.787 11.787 0 005.912 1.64h.005c6.635 0 12.034-5.399 12.034-12.03 0-3.212-1.25-6.232-3.52-8.504z"/></svg>
                         </button>
                         <button 
                           type="button"
                           onClick={() => handleShare('telegram')} 
                           className="w-10 h-10 bg-[#0088cc] hover:scale-105 transition-transform flex items-center justify-center rounded-2xl text-white shadow-md cursor-pointer"
                         >
                           <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.891 8.146l-2.003 9.464c-.149.659-.539.822-1.091.511l-3.051-2.25-1.47 1.416c-.163.163-.3.298-.615.298l.221-3.137 5.711-5.159c.247-.22-.054-.341-.383-.122l-7.06 4.444-3.041-.951c-.661-.204-.674-.661.139-.98l11.879-4.579c.55-.204 1.03.127.859.936z"/></svg>
                         </button>
                         <button 
                           type="button"
                           onClick={() => handleShare('facebook')} 
                           className="w-10 h-10 bg-[#1877F2] hover:scale-105 transition-transform flex items-center justify-center rounded-2xl text-white shadow-md cursor-pointer"
                         >
                           <svg className="w-5.5 h-5.5 fill-white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                         </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* VIEW: UTILITY RECHARGE TILES GRID - PHONEPE / PAYTM COPIED LAYOUT */}
            {tab === 'utility' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-indigo-600" />
                      Utility Bill Remittances
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                      Processed directly from your secure E-Recharge Wallet
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4">
                  {[
                    { 
                      name: 'Mobile Recharge', 
                      desc: 'Prepaid & Postpaid', 
                      icon: <Smartphone className="w-6 h-6" />, 
                      color: 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100/50', 
                      placeholder: 'Enter 10-digit Mobile Number', 
                      label: 'Mobile No. / Subscriber Index',
                      operators: ['Jio Prepaid', 'Airtel Prepaid', 'Vi Prepaid', 'BSNL Prepaid'] 
                    },
                    { 
                      name: 'DTH Satellite', 
                      desc: 'Direct TV networks', 
                      icon: <Tv className="w-6 h-6" />, 
                      color: 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100/50', 
                      placeholder: 'Enter 11-digit Subscriber ID', 
                      label: 'DTH / Smartcard Index',
                      operators: ['Tata Play', 'Airtel Digital TV', 'Dish TV', 'Videocon d2h', 'Sun Direct'] 
                    },
                    { 
                      name: 'Electricity Bills', 
                      desc: 'State Energy boards', 
                      icon: <Zap className="w-6 h-6" />, 
                      color: 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100/50', 
                      placeholder: 'Enter Customer Account ID', 
                      label: 'Account Connection No.',
                      operators: ['BESCOM (Karnataka)', 'MSEB (Maharashtra)', 'UPPCL (Uttar Pradesh)', 'BSES Rajdhani', 'TNEB (Tamil Nadu)'] 
                    },
                    { 
                      name: 'Tap Water Grid', 
                      desc: 'Civil pipelines', 
                      icon: <Droplet className="w-6 h-6" />, 
                      color: 'bg-cyan-50 text-cyan-600 border border-cyan-100 hover:bg-cyan-100/50', 
                      placeholder: 'Enter Water Account Index', 
                      label: 'K-Number / Connection Ref',
                      operators: ['Delhi Jal Board', 'BWSSB (Bangalore)', 'MCG (Gurugram)', 'HMWSSB (Hyderabad)'] 
                    },
                    { 
                      name: 'FASTag Vehicle Tolling', 
                      desc: 'Auto barrier recharge', 
                      icon: <Car className="w-6 h-6" />, 
                      color: 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100/50', 
                      placeholder: 'Enter Vehicle Plate Index (E.g. KA01ML9999)', 
                      label: 'Vehicle Plate Number',
                      operators: ['Paytm Payments Bank FASTag', 'SBI FASTag', 'ICICI Bank FASTag', 'HDFC Bank FASTag'] 
                    },
                    { 
                      name: 'Broadband landlines', 
                      desc: 'Secure high FTTH', 
                      icon: <Globe className="w-6 h-6" />, 
                      color: 'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/50', 
                      placeholder: 'Enter fixed Landline number with STD', 
                      label: 'Subscriber Account ID',
                      operators: ['Airtel Xstream Fiber', 'JioFiber Broadband', 'BSNL Fiber', 'ACT Fibernet'] 
                    },
                    { 
                      name: 'Educational Fees Pay', 
                      desc: 'Schools & coaching institutions', 
                      icon: <Award className="w-6 h-6" />, 
                      color: 'bg-purple-50 text-purple-650 border border-purple-100 hover:bg-purple-100/50', 
                      placeholder: 'Enter student registration index', 
                      label: 'Student Register No.',
                      operators: ['FIITJEE Coaching', 'Allen Career Institute', 'Delhi Public School', 'Amity Web Portal'] 
                    },
                    { 
                      name: 'Google Play Gift Vouchers', 
                      desc: 'Direct play vouchers', 
                      icon: <ShoppingBag className="w-6 h-6" />, 
                      color: 'bg-pink-50 text-pink-650 border border-pink-100 hover:bg-pink-100/50', 
                      placeholder: 'Enter Gmail registered index', 
                      label: 'Google Registered Email',
                      operators: ['Google Play Gift Vouchers (₹10 - ₹5000)'] 
                    },
                  ].map(s => {
                    const activeState = user.is_active;
                    return (
                      <motion.button 
                        whileHover={{ scale: 1.02, y: -2 }}
                        type="button"
                        key={s.name} 
                        onClick={() => {
                          setSelectedUtility(s);
                          setUtilityFormData({
                            connectionId: '',
                            operator: s.operators[0] || '',
                            amount: '',
                            pin: ''
                          });
                        }}
                        className={`p-4 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${s.color}`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-3 shadow-xs shrink-0">
                          {s.icon}
                        </div>
                        <p className="text-[11.5px] font-black text-slate-800 leading-snug">{s.name}</p>
                        <p className="text-[8.5px] text-slate-400 mt-1 font-bold leading-normal">{s.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW: ADD MONEY SCREEN */}
            {tab === 'add_money' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* QR Display frame */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <QrCode className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Scan & Load Vault</h3>
                  </div>
                  
                  {qrCode ? (
                    <div className="p-5 bg-gradient-to-tr from-purple-50 via-indigo-50/20 to-white border-2 border-dashed border-purple-250 rounded-3xl shadow-inner mb-6 relative group overflow-hidden">
                       <img src={qrCode} alt="PhonePe Paytm merchant scan code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain relative z-10 transition-transform duration-300 group-hover:scale-103" />
                       <div className="absolute top-0 left-0 w-full h-[3px] bg-purple-500 animate-[pulse_1.5s_infinite]"></div>
                    </div>
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 text-xs font-bold mb-6 p-4 text-center">
                       <ShieldAlert className="w-10 h-10 text-rose-400 mb-2 animate-bounce" />
                       <span className="font-bold">No Active Scan QR Configuration</span>
                       <span className="text-[9px] text-slate-400 font-medium mt-1">Please reach out to the helpdesk admin to activate the gateway.</span>
                    </div>
                  )}

                  <div className="space-y-3 max-w-sm text-left">
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p className="text-[11px] text-slate-600 font-bold leading-normal">
                        Scan with <strong className="text-slate-800">GPay, PhonePe, Paytm, or BHIM</strong> app and pay.
                      </p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p className="text-[11px] text-slate-600 font-bold leading-normal">
                        Verify the transaction complete. Copy the <strong className="text-slate-800">12-digit UTR</strong> ID and save the proof attachment.
                      </p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <p className="text-[11px] text-slate-600 font-bold leading-normal">
                        Submit the reference block to the right. Admin verifies and confirms credit within minutes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Proof submission */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black text-[#110c24] mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      Submit Pay Proof Verification
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-5">Double validation accelerates validation</p>
                    
                    <form onSubmit={handleAddMoneySubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-0.5">Amount Sent (₹) *</label>
                        <input 
                          type="number" required placeholder="E.g. 500" min="1"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 focus:bg-white text-slate-800 font-extrabold text-sm outline-none transition-all"
                          value={addMoneyData.amount} onChange={e => setAddMoneyData({...addMoneyData, amount: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-0.5">UPI 12-digit UTR ID *</label>
                        <input 
                          type="text" required placeholder="Paste transaction UPI reference number"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 focus:bg-white text-slate-800 font-bold text-xs outline-none transition-all font-mono"
                          value={addMoneyData.utr} onChange={e => setAddMoneyData({...addMoneyData, utr: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-0.5">Receipt Attachment (Recommended)</label>
                        <input 
                          type="file" accept="image/*"
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                          onChange={handleScreenshotChange}
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 hover:brightness-105 text-white font-black rounded-xl shadow-lg uppercase tracking-wider text-xs transition-all cursor-pointer"
                      >
                        SUBMIT VERIFICATION BLOCK
                      </button>
                    </form>
                  </div>

                  {/* History List */}
                  <div className="mt-8 border-t border-slate-100 pt-5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3.5 tracking-widest">My Recent Deposit Filings</h4>
                    <div className="space-y-2.5 max-h-32 overflow-y-auto pr-1 no-scrollbar">
                      {paymentRequests.filter(r => r.userId === user.id).map(r => (
                        <div key={r.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex justify-between items-center text-[10px]">
                          <div>
                            <p className="font-extrabold text-slate-700">₹{r.amount} - UTR: <span className="font-mono">{r.utr || 'N/A'}</span></p>
                            <p className="text-slate-400 font-bold mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[8px] tracking-wider ${
                            r.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                            r.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      ))}
                      {paymentRequests.filter(r => r.userId === user.id).length === 0 && (
                        <p className="text-center text-slate-400 text-[9px] py-4 italic uppercase tracking-wider font-bold">No previous deposits found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: WITHDRAW SYSTEM SETTLEMENTS */}
            {tab === 'withdraw' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                
                {/* Bank credentials config */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black text-[#110c24] mb-1 flex items-center gap-1.5">
                      <Landmark className="w-5 h-5 text-purple-600" />
                      Payout Bank Configuration
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-5 tracking-widest">Verify credentials carefully before saving</p>
                    
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onUpdateBankDetails(bankForm); alert('Your withdrawal banking credentials have been saved!'); }}>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-0.5">Beneficiary Holder Name</label>
                        <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-purple-500 outline-none" value={bankForm.holderName} onChange={e => setBankForm({...bankForm, holderName: e.target.value})} required placeholder="E.g. MUNIR MALIK" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-0.5">Bank Name</label>
                        <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-purple-500 outline-none" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} required placeholder="E.g. State Bank of India" />
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-0.5">Account Number</label>
                          <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-purple-500 outline-none" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} required placeholder="Account index" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-0.5">IFSC Code</label>
                          <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-purple-500 outline-none" value={bankForm.ifscCode} onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})} required placeholder="SBIN000123" />
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        className="w-full py-3.5 bg-slate-900 hover:bg-black shadow-md text-white text-xs font-black rounded-xl uppercase tracking-widest transition-all cursor-pointer"
                      >
                        SAVE BANKING PROFILE
                      </button>
                    </form>
                  </div>
                </div>

                {/* Dispatch Cash withdrawals */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-800 mb-1 flex items-center gap-1.5">
                      <Send className="w-5 h-5 text-purple-600" />
                      Instant Bank Settlement
                    </h3>
                    <p className="text-[10px] text-slate-400 mb-5 uppercase font-bold tracking-widest">Settle balance instantly to bank | Min ₹50</p>
                    
                    <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-0.5">Discharge Amount (₹)</label>
                        <input type="number" min="50" className="w-full px-4 py-3 bg-slate-50 border-2 border-purple-100 rounded-xl focus:border-purple-500 focus:bg-white font-extrabold text-[#110c24] outline-none" value={withdrawalAmount} onChange={e => setWithdrawalAmount(e.target.value)} required placeholder="50.00" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-0.5">4-digit UPI Secure PIN</label>
                        <input 
                          type="password" maxLength={4} inputMode="numeric" pattern="\d{4}" 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 focus:bg-white font-black text-center tracking-[0.5em] text-sm outline-none" 
                          placeholder="••••" value={withdrawalPin} onChange={e => setWithdrawalPin(e.target.value.replace(/\D/g, '').slice(0, 4))} required 
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white font-black rounded-xl shadow-lg shadow-purple-900/10 hover:brightness-105 uppercase tracking-wide text-xs cursor-pointer transition-all"
                      >
                        DISPATCH BANK SETTLEMENT
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW: PEER WALLET TRANSFER */}
            {tab === 'transfer' && (
              <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-base font-black mb-1.5 text-slate-800 text-center flex items-center justify-center gap-1.5">
                  <Send className="w-5 h-5 text-purple-600" />
                  Peer Wallet Transfer
                </h3>
                <p className="text-[10px] text-slate-400 mb-6 text-center uppercase font-black tracking-widest">Main wallet to Peer Wallet transfer | SAFE</p>
                
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-0.5">Recipient SmartPay ID (Email)</label>
                    <input type="email" required className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-purple-500 outline-none text-xs font-bold" value={transferData.email} onChange={e => setTransferData({...transferData, email: e.target.value})} placeholder="E.g. partner@spay360.in" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-0.5">Transfer Amount (₹)</label>
                    <input type="number" required className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-purple-500 outline-none text-xs font-extrabold" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-0.5">Secure Transaction PIN (4 digits)</label>
                    <input 
                      type="password" maxLength={4} inputMode="numeric" pattern="\d{4}" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:border-purple-500 outline-none font-black text-center tracking-[0.5em] text-xs" 
                      value={transferData.pin} onChange={e => setTransferData({...transferData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})} placeholder="••••" required 
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-xl shadow-lg uppercase tracking-wider text-xs transition-all cursor-pointer"
                  >
                    CONFIRM PEER DISPATCH
                  </button>
                </form>
              </div>
            )}

            {/* VIEW: SHOP ITEMS */}
            {tab === 'shop' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-8 rounded-3xl text-white shadow-md relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-[70px]"></div>
                  <div className="relative z-10 max-w-lg">
                    <span className="text-[9px] bg-white/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">MEMBER BENEFITS</span>
                    <h3 className="text-xl font-black mt-2">VIP Digital Merchandising</h3>
                    <p className="text-xs text-purple-100 mt-1 leading-relaxed">
                      Redeem premium organic wellness formulations and high PV items. Every item purchased grants team placement points dynamically.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {products.map(p => (
                    <div 
                      key={p.id} 
                      className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:border-purple-200 transition-all flex flex-col justify-between group"
                    >
                      <div className="p-5">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-105 transition-transform">
                          {p.image || '🛍️'}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest bg-purple-50 text-purple-700 px-2 py-0.5 border border-purple-100 rounded-md inline-block">
                          {p.category}
                        </span>
                        <h4 className="text-sm font-black text-slate-800 mt-2 truncate">{p.name}</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-normal line-clamp-2">{p.description}</p>
                        
                        <div className="flex gap-4.5 mt-4 border-t border-slate-50 pt-3">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">MLM points</span>
                            <span className="font-mono text-xs font-black text-[#00baf2]">{p.mlmPoints} PV</span>
                          </div>
                          <div className="border-l border-slate-100 pl-4.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Stock Level</span>
                            <span className="text-xs font-black text-rose-500">{p.stock} units</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between gap-2.5">
                        <div>
                          <p className="text-sm font-black text-slate-800">₹{p.price}</p>
                          <p className="text-[9px] text-slate-400 font-bold line-through">MRP: ₹{p.mrp}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to purchase ${p.name} for ₹${p.price} to earn ${p.mlmPoints} PV?`)) {
                              onOrder(user.id, p.id);
                            }
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                        >
                          ORDER
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW: MLM MATRIX STRUCTURE */}
            {tab === 'mlm' && (
              <div className="space-y-6">
                
                {/* Visual overview KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Team Count</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{myDownline.length} Members</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-600 shrink-0">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Qualified (Activated)</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{activeDownlineCount} Active</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-150 flex items-center justify-center text-purple-[#8100ff] shrink-0">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Passive Team PV</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{user.team_pv || 0} PV</p>
                    </div>
                  </div>
                </div>

                {/* Sub-members directory table list */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 mb-1 flex items-center gap-1.5">
                    <Layers className="w-5 h-5 text-purple-600" />
                    My Direct & Indirect Referrals (10 Levels Matrix)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Chronological list of all team accounts registered under your hierarchy</p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider border-b">
                        <tr>
                          <th className="px-5 py-3">Identity</th>
                          <th className="px-5 py-3">Sponsor ID</th>
                          <th className="px-5 py-3">Join Date</th>
                          <th className="px-5 py-3 text-right">License Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-705">
                        {myDownline.map(subUser => {
                          const active = subUser.is_active || subUser.isActivated;
                          return (
                            <tr key={subUser.id} className="hover:bg-slate-50/50">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 font-black flex items-center justify-center uppercase text-xs">
                                    {(subUser.username || subUser.email)[0]}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 truncate max-w-[150px]">{subUser.username || subUser.email.split('@')[0]}</p>
                                    <p className="text-[9px] text-slate-400 font-mono">{subUser.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 font-mono text-[9.5px]">
                                {subUser.sponsor_id ? subUser.sponsor_id.slice(0, 15) : 'DIRECT'}
                              </td>
                              <td className="px-5 py-3.5 text-slate-400 text-[10px]">
                                {new Date(subUser.created_at || Date.now()).toLocaleDateString('en-IN')}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <span className={`px-2.5 py-0.5 rounded-full font-black text-[8px] tracking-wider uppercase inline-block ${
                                  active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}>
                                  {active ? 'ACTIVE' : 'BASIC'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {myDownline.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-12 text-slate-400 text-xs italic font-bold">
                              No downline accounts found. Invite partners under sponsor code {user.referralCode || user.id.slice(0,8)} to grow!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: SUPREME HELPDESK CHATS */}
            {tab === 'support' && (
              <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between h-[510px]">
                
                {/* Chat header */}
                <div className="p-4 border-b bg-slate-50/80 flex items-center gap-3.5 shadow-xs">
                  <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm relative">
                    <MessageSquare className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white"></span>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-800">Secure Helpdesk support</h3>
                    <p className="text-[10px] text-emerald-500 font-bold leading-none mt-1">● Online | Instant Assistant Sync</p>
                  </div>
                </div>

                {/* Chat logs scroll area */}
                <div className="p-4 space-y-3.5 overflow-y-auto pr-2 flex-grow bg-slate-50/20 no-scrollbar">
                  {chatMessages
                    .filter(m => m.senderId === user.id || m.receiverId === user.id)
                    .map((msg, idx) => {
                      const isMe = msg.senderId === user.id;
                      return (
                        <div key={`${msg.id}-${idx}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-3.5 max-w-sm rounded-2xl shadow-xs text-xs font-semibold leading-relaxed ${
                            isMe 
                              ? 'bg-purple-600 text-white rounded-br-none' 
                              : 'bg-white border text-slate-700 rounded-bl-none'
                          }`}>
                            <p>{msg.message}</p>
                            <span className={`text-[8px] uppercase mt-1 leading-none font-bold block ${
                              isMe ? 'text-purple-200 text-right' : 'text-slate-400 text-left'
                            }`}>
                              {new Date(msg.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {chatMessages.filter(m => m.senderId === user.id || m.receiverId === user.id).length === 0 && (
                    <div className="text-center py-24 flex flex-col items-center justify-center">
                      <MessageCircle className="w-12 h-12 text-slate-300 animate-bounce mb-3" />
                      <p className="text-slate-400 text-xs font-black uppercase tracking-wider">No history with Support Agent</p>
                      <p className="text-[10px] text-slate-350 mt-1 max-w-xs leading-relaxed font-bold">Ask about deposits, recharges, payouts, or sponsor placements. Answers arrive immediately.</p>
                    </div>
                  )}
                </div>

                {/* Chat text input area */}
                <form 
                  onSubmit={e => {
                    e.preventDefault();
                    if (!chatInput.trim()) return;
                    onSendMessage(chatInput.trim(), 'admin');
                    setChatInput('');
                  }}
                  className="p-3 border-t bg-slate-50/80 flex gap-2"
                >
                  <input 
                    type="text" 
                    placeholder="Describe your issue or ask query..."
                    className="flex-grow px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-purple-500 outline-none shadow-inner"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2.5 bg-purple-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-purple-700 transition-colors shrink-0 cursor-pointer shadow-sm flex items-center justify-center"
                  >
                    SEND
                  </button>
                </form>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* 🏛️ PHONEPE / PAYTM STYLE CUSTOM RECHARGES MODAL OVERLAY */}
      <AnimatePresence>
        {selectedUtility && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
            >
              
              {/* Modal header */}
              <div className="px-5 py-4 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex justify-between items-center relative">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
                    {selectedUtility.icon}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black">{selectedUtility.name}</h3>
                    <p className="text-[10px] text-purple-200 mt-0.5 leading-none">Instant E-Wallet Settlements Routing</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedUtility(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={executePremiumUtilityRechargeSubmit} className="p-5 space-y-4">
                
                {/* Operator Selector dropdown */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Select Service provider *</label>
                  <div className="relative">
                    <select
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 font-bold text-xs select-none outline-none appearance-none cursor-pointer"
                      value={utilityFormData.operator}
                      onChange={e => setUtilityFormData({ ...utilityFormData, operator: e.target.value })}
                    >
                      <option value="">-- Choose Operator --</option>
                      {selectedUtility.operators.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Connection Account input */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{selectedUtility.label} *</label>
                  <input
                    type="text"
                    required
                    placeholder={selectedUtility.placeholder}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 text-xs font-bold outline-none font-mono placeholder:text-slate-400/80"
                    value={utilityFormData.connectionId}
                    onChange={e => setUtilityFormData({ ...utilityFormData, connectionId: e.target.value })}
                  />
                </div>

                {/* Amount input + quick selectors */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Recharge Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    placeholder="Enter amount (Min ₹10)"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-purple-100 rounded-xl focus:border-purple-500 focus:bg-white text-sm font-extrabold outline-none"
                    value={utilityFormData.amount}
                    onChange={e => setUtilityFormData({ ...utilityFormData, amount: e.target.value })}
                  />
                  <div className="flex gap-1.5 overflow-x-auto pt-2 no-scrollbar">
                    {[99, 149, 199, 299, 499, 719, 1079].map(preset => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setUtilityFormData({ ...utilityFormData, amount: preset.toString() })}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-purple-50 hover:border-purple-300 rounded-lg text-[10px] font-mono font-black text-slate-600 transition-colors cursor-pointer shrink-0"
                      >
                        ₹{preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* UPI secure transaction pin */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase">4-digit UPI Security PIN *</label>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">SECURE INPUT</span>
                  </div>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    inputMode="numeric"
                    pattern="\d{4}"
                    placeholder="••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 text-center text-xs font-black tracking-[0.5em] outline-none"
                    value={utilityFormData.pin}
                    onChange={e => setUtilityFormData({ ...utilityFormData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  />
                </div>

                {/* Execute payout submit */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white font-black rounded-xl text-xs uppercase tracking-wider hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-purple-950/10 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4.5 h-4.5 text-[#00baf2]" />
                  PAY BILL SECURELY
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Dashboard;
