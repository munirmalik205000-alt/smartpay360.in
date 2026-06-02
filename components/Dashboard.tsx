import React, { useState, useMemo } from 'react';
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
  Check,
  MessageCircle,
  Clock,
  Layers
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

  const [transferData, setTransferData] = useState({ email: '', amount: '', pin: '' });
  const [addMoneyData, setAddMoneyData] = useState({ amount: '', utr: '', screenshot: '' });
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalPin, setWithdrawalPin] = useState('');
  const [bankForm, setBankForm] = useState<BankDetails>(user.bankDetails || { bankName: '', accountNumber: '', ifscCode: '', holderName: '' });
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
    if (isNaN(amt) || amt <= 0) return alert('Enter valid amount');
    
    const finalUtr = addMoneyData.utr.trim() || 'N/A';
    const finalScreenshot = addMoneyData.screenshot || '';
    
    onAddMoney({ amount: amt, utr: finalUtr, screenshot: finalScreenshot });
    setAddMoneyData({ amount: '', utr: '', screenshot: '' });
  };

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawalAmount);
    if (isNaN(amt) || amt < 50) return alert('Minimum withdrawal is ₹50');
    if (withdrawalPin.length !== 4) return alert('Enter a valid 4-digit PIN');
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

  const initiateRecharge = (service: string) => {
    const amt = prompt(`Enter ${service} recharge amount (₹):`);
    if (!amt) return;
    const pin = prompt(`Enter your 4-digit UPI Transaction PIN to confirm transaction:`);
    if (!pin || pin.length !== 4) return alert('Valid 4-digit Transaction PIN is required.');
    onRecharge(user.id, parseFloat(amt), service, pin);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4 pb-16 font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900">
      
      {/* 🚀 DYNAMIC NEON HEADER & DEBIT CARD SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: DYNAMIC PREMIUM BANNER & STATS */}
        <div className="md:col-span-7 bg-gradient-to-tr from-[#110c24] via-[#1a1438] to-[#120e2e] text-white p-6 rounded-3xl border border-purple-500/15 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600 rounded-full blur-[130px] opacity-30 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-500 rounded-full blur-[90px] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4.5">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-violet-600 to-cyan-400 flex items-center justify-center p-[2px] shadow-lg">
                  <div className="w-full h-full rounded-full bg-[#110c24] flex items-center justify-center text-white font-black text-xl uppercase tracking-wider">
                    {user.email[0]}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#110c24] flex items-center justify-center text-white" title="Account Status">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black tracking-tight text-white truncate">
                    {user.username || user.email.split('@')[0]}
                  </h2>
                  <motion.span 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 shadow-md ${
                      user.is_active ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {user.is_active ? '✨ PREMIUM USER' : 'BASIC USER'}
                  </motion.span>
                </div>
                <p className="text-xs text-purple-200 mt-0.5 font-medium truncate opacity-80">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-slate-300 font-mono">
                    ID: {user.id.slice(0, 10).toUpperCase()}
                  </span>
                  <span className="text-[9px] text-purple-300">
                    Sponsor: <span className="font-bold text-white">{user.sponsor_id || "None"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* QUICK STATS IN HEADER */}
            <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/10 pt-5">
              <div>
                <p className="text-[10px] font-semibold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-purple-400" />
                  Main Passbook
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-1 leading-none tracking-tight">
                  ₹{(user.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                  E-Recharge Wallet
                </p>
                <p className="text-2xl sm:text-3xl font-black text-cyan-300 mt-1 leading-none tracking-tight">
                  ₹{(user.recharge_wallet || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Level commissions</p>
                <p className="text-xs font-bold text-slate-100">₹{(user.earning_wallet || 0).toFixed(2)} Available</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setTab('withdraw')} 
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-[10px] font-black rounded-xl uppercase tracking-wider transition-all shadow-md"
            >
              Payout
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE VIRTUAL 3D SMART CARD */}
        <div className="md:col-span-5 flex items-center justify-center">
          <motion.div 
            whileHover={{ y: -5, rotateX: 6, rotateY: -6 }}
            style={{ perspective: 1000 }}
            className="w-full h-56 max-w-[360px] rounded-3xl bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 p-6 text-white border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between cursor-pointer select-none group"
          >
            {/* Ambient glows on card */}
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-cyan-400 rounded-full blur-[50px] opacity-35 group-hover:opacity-50 transition-opacity"></div>
            <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-pink-500 rounded-full blur-[50px] opacity-35 group-hover:opacity-50 transition-opacity"></div>
            
            {/* Card top banner */}
            <div className="flex justify-between items-start relative z-10">
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tighter text-white">SmartPay 360</span>
                <span className="text-[7px] text-cyan-300 font-extrabold tracking-[0.3em] uppercase">Digital Ledger Card</span>
              </div>
              <div className="relative w-8 h-8 opacity-90">
                {/* Custom glowing chip SVG */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-amber-400">
                  <rect x="10" y="10" width="80" height="80" rx="15" fill="currentColor" opacity="0.15" />
                  <rect x="25" y="25" width="50" height="50" rx="8" fill="none" stroke="currentColor" strokeWidth="6" />
                  <line x1="10" y1="50" x2="25" y2="50" stroke="currentColor" strokeWidth="6" />
                  <line x1="75" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="6" />
                  <line x1="50" y1="10" x2="50" y2="25" stroke="currentColor" strokeWidth="6" />
                  <line x1="50" y1="75" x2="50" y2="90" stroke="currentColor" strokeWidth="6" />
                </svg>
              </div>
            </div>

            {/* Custom Contactless Wave indicator list */}
            <div className="absolute top-1/2 left-6 transform -translate-y-1/2 opacity-30 group-hover:opacity-60 transition-opacity">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            {/* Card Info details */}
            <div className="relative z-10 space-y-3">
              <p className="text-lg font-mono tracking-[0.2em] font-bold text-slate-100 p-0.5 bg-black/10 rounded-lg inline-block">
                8830 5291 {user.id.slice(0,4).toUpperCase()} {user.id.slice(4,8).toUpperCase()}
              </p>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[7px] text-slate-400 uppercase tracking-widest">Card Holder</p>
                  <p className="text-xs font-black tracking-wide truncate max-w-[170px]">
                    {user.username ? user.username.toUpperCase() : user.email.split('@')[0].toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] text-slate-400 uppercase tracking-widest">Security Pin</p>
                  <p className="text-xs font-mono font-bold tracking-widest text-[#00baf2]">
                    [ AUTHENTICATED ]
                  </p>
                </div>
                {/* Mastercard-style circles logo overlay */}
                <div className="flex -space-x-3 opacity-90">
                  <div className="w-8 h-8 rounded-full bg-red-500/80"></div>
                  <div className="w-8 h-8 rounded-full bg-amber-400/80 mix-blend-screen"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ⚠️ INACTIVE PROMPT CONTAINER AS AN ELEGANT PREMIUM MEMBRANE */}
      {!user.is_active && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#1e1742] via-[#241245] to-[#12052e] text-white p-6 rounded-3xl border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-[-40%] right-[-10%] w-60 h-60 bg-amber-500 rounded-full blur-[100px] opacity-15 pointer-events-none"></div>
          
          <div className="flex gap-4 items-start relative z-10">
            <div className="p-3.5 bg-amber-500/15 rounded-2xl border border-amber-500/20 text-amber-400 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-black uppercase bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2.5 py-0.5 rounded-full tracking-widest">LIMITED BUNDLE</span>
                <h3 className="font-extrabold text-base tracking-tight text-white">Activate Full Lifetime Premium Membership</h3>
              </div>
              <p className="text-xs text-purple-200 mt-1.5 leading-relaxed max-w-xl">
                Unlock all <strong className="text-amber-400">10 levels of multi-level commission payouts</strong>, dynamic network binary trees, premium digital product orders, and instant helper features. Complete your license block for only <strong className="text-amber-400 font-extrabold text-sm">₹{packagePrice}</strong>.
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
            Activate License now
          </button>
        </motion.div>
      )}

      {/* 🧭 PHONEPE PREMIUM CYBER QUICK SHORTCUTS GRID */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Settle & Recharge Channels</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { id: 'add_money', name: 'Add Cash', desc: 'Scan & instant load', color: 'from-[#0b081c] to-[#1d143c] text-[#00baf2] ring-[#00baf2]/10', icon: <ArrowDownToLine className="w-5 h-5" /> },
            { id: 'transfer', name: 'To Wallet', desc: 'Secure peer send', color: 'from-[#1a1438] to-[#2d1b54] text-purple-400 ring-purple-400/10', icon: <Send className="w-5 h-5" /> },
            { id: 'withdraw', name: 'To Bank', desc: 'Instant bank settle', color: 'from-[#231a4c] to-[#40135d] text-amber-400 ring-amber-400/10', icon: <Landmark className="w-5 h-5" /> },
            { id: 'mlm', name: 'My Network', desc: '10 level matrix tree', color: 'from-slate-900 to-slate-950 text-emerald-400 ring-emerald-500/10', icon: <Network className="w-5 h-5" /> }
          ].map(action => (
            <button 
              type="button"
              key={action.id} 
              onClick={() => setTab(action.id as any)}
              className="flex flex-col items-center group transition-all duration-200"
            >
              <div className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 shadow-sm ring-4 group-hover:scale-105 transition-transform duration-200`}>
                {action.icon}
              </div>
              <p className="text-[11px] font-black text-slate-800 leading-tight group-hover:text-purple-700 transition-colors">{action.name}</p>
              <p className="text-[8px] text-slate-400 mt-0.5 hidden xs:block font-medium">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 🧭 SLIDER TAB NAVIGATION SELECTOR */}
      <div className="bg-[#110c24] p-1.5 rounded-2xl border border-white/[0.05] block overflow-x-auto no-scrollbar shadow-inner relative">
        <div className="flex gap-1">
          {[
            { id: 'home', name: '🏠 Passbook Logs' },
            { id: 'add_money', name: '📥 Add Cash' },
            { id: 'withdraw', name: '🏛️ Withdraw' },
            { id: 'utility', name: '⚡ Recharges' },
            { id: 'shop', name: '🛍️ Shop Items' },
            { id: 'transfer', name: '💸 Transfers' },
            { id: 'mlm', name: '👥 Network MLM' },
            { id: 'support', name: '💬 Helpdesk Help' },
          ].map(t => (
            <button 
              type="button"
              key={t.id} 
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${
                tab === t.id 
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-xl scale-[1.02]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {t.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 🔮 ANIMATED VIEWS ROOT CONTAINER */}
      <div className="relative overflow-visible">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            
            {/* VIEW: HOME & BANKING PASSBOOK LOGS */}
            {tab === 'home' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* TRANSACTION LOGS */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6.5 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                          <History className="w-5 h-5 text-purple-600 shrink-0" />
                          Ledger Audit Passbook
                        </h3>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">Secure transactions verified on-ledger</p>
                      </div>
                      <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-100 font-black px-3 py-1 rounded-full">
                        {transactions.length} Logs
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
                      {transactions.map(tx => {
                        const isCredit = tx.amount > 0;
                        return (
                          <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50/40 hover:bg-slate-50/90 transition-colors rounded-2xl border border-slate-100/80">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                                isCredit ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-100'
                              }`}>
                                {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800 leading-tight">
                                  {tx.description || tx.remark || 'Internal Wallet Ledger'}
                                </p>
                                <p className="text-[9.5px] text-slate-400 mt-1.5 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-300" />
                                  {new Date(tx.createdAt || tx.created_at || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-xs sm:text-sm font-black ${isCredit ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {isCredit ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                              </p>
                              <span className="text-[8px] uppercase tracking-wider font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-100 rounded inline-block mt-1">
                                SUCCESS
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {transactions.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                          <HelpCircle className="w-10 h-10 text-slate-300 mb-2" />
                          <p className="text-slate-400 text-xs font-bold leading-normal">No recent transactions processed.</p>
                          <p className="text-[10px] text-slate-300 uppercase font-black mt-1">Initiate utility pay or add money to start</p>
                        </div>
                      )}
                    </div>
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
                        <h4 className="font-extrabold text-sm uppercase tracking-wide text-amber-400">Refer & Earn residuals</h4>
                      </div>
                      <p className="text-[11px] text-violet-200 leading-relaxed opacity-85">
                        Build your exclusive 10-level matrix downline. Receive residual points on every license activation from your direct and indirect referrals.
                      </p>

                      <div className="bg-[#1e1742] p-4 rounded-2xl border border-white/5 mt-4">
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Your Private referral ID</p>
                        <div className="flex items-center justify-between gap-1.5 mt-1.5">
                          <span className="font-mono font-black text-sm text-white tracking-widest">
                            {user.referralCode || user.id.slice(0,8)}
                          </span>
                          <button 
                            type="button" 
                            onClick={handleCopyCode} 
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-[9px] font-black rounded-lg uppercase tracking-wider transition-all"
                          >
                            {copiedCode ? 'COPIED!' : 'COPY ID'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 bg-[#1e1742] p-3 rounded-xl border border-white/5">
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Share Fast Link</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-[#00baf2] font-semibold truncate max-w-[130px] font-mono">
                            {shareUrl.replace('https://', '')}/?ref=...
                          </span>
                          <button 
                            type="button"
                            onClick={handleCopyLink}
                            className="text-[9px] text-amber-400 font-extrabold hover:underline select-none ml-1 shrink-0"
                          >
                            {copiedLink ? 'COPIED!' : 'COPY LINK'}
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
                    <div className="p-5.5 bg-gradient-to-tr from-purple-50 via-indigo-50/20 to-white border-2 border-dashed border-purple-200 rounded-3xl shadow-inner mb-6 relative group overflow-hidden">
                       <img src={qrCode} alt="GPay PhonePe merchant scan code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain relative z-10 transition-transform duration-300 group-hover:scale-103" />
                       <div className="absolute top-0 left-0 w-full h-[3px] bg-purple-500 animate-[pulse_1.5s_infinite]"></div>
                    </div>
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 text-xs font-bold mb-6 p-4 text-center">
                       <ShieldAlert className="w-10 h-10 text-rose-400 mb-2 animate-bounce" />
                       <span className="font-bold">No active QR configuration</span>
                       <span className="text-[9px] text-slate-400 font-medium mt-1">Please reach out to helpdesk admin to activate receiver gateway.</span>
                    </div>
                  )}

                  <div className="space-y-3.5 max-w-sm text-left">
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                        Scan with <strong className="text-slate-800">GPay, PhonePe, Paytm, or BHIM</strong> app and pay.
                      </p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                        Verify the transaction complete. Copy the <strong className="text-slate-800">12-digit UTR</strong> ID and save the proof attachment.
                      </p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                        Submit the reference block to the right. Admin verifies and confirms credit within minutes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Proof submission */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black text-[#110c24] mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      Submit Pay Proof Verification
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-5">Double validation accelerates validation</p>
                    
                    <form onSubmit={handleAddMoneySubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Amount Sent (₹) *</label>
                        <input 
                          type="number" required placeholder="E.g. 500" min="1"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 focus:bg-white text-slate-800 font-extrabold text-sm outline-none transition-all"
                          value={addMoneyData.amount} onChange={e => setAddMoneyData({...addMoneyData, amount: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">UPI 12-digit UTR ID *</label>
                        <input 
                          type="text" required placeholder="Paste transaction UPI reference number"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 focus:bg-white text-slate-800 font-bold text-xs outline-none transition-all font-mono"
                          value={addMoneyData.utr} onChange={e => setAddMoneyData({...addMoneyData, utr: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Receipt Attachment (Recommended)</label>
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
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3.5 tracking-widest">My Recent deposit filings</h4>
                    <div className="space-y-2.5 max-h-32 overflow-y-auto pr-1 no-scrollbar">
                      {paymentRequests.filter(r => r.userId === user.id).map(r => (
                        <div key={r.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex justify-between items-center text-[10px]">
                          <div>
                            <p className="font-extrabold text-slate-700">₹{r.amount} - UTR: <span className="font-mono">{r.utr || 'N/A'}</span></p>
                            <p className="text-slate-400 font-bold mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                          </div>
                          <span className={`px-3 py-0.5 rounded-full font-black uppercase text-[8px] tracking-wider ${
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
                      Payout Bank Config
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-5 tracking-widest">Verify credentials carefully before saving</p>
                    
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onUpdateBankDetails(bankForm); alert('Your withdrawal banking credentials have been saved!'); }}>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Beneficiary Holder Name</label>
                        <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-purple-500 outline-none" value={bankForm.holderName} onChange={e => setBankForm({...bankForm, holderName: e.target.value})} required placeholder="E.g. MUNIR MALIK" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Bank Name</label>
                        <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-purple-500 outline-none" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} required placeholder="E.g. State Bank of India" />
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Account Number</label>
                          <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-purple-500 outline-none" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} required placeholder="Account index" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">IFSC Code</label>
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
                    <p className="text-[10px] text-slate-400 mb-5 uppercase font-black tracking-widest">Settle balance instantly to bank | Min ₹50</p>
                    
                    <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Discharge Amount (₹)</label>
                        <input type="number" min="50" className="w-full px-4 py-3 bg-slate-50 border-2 border-purple-100 rounded-xl focus:border-purple-500 focus:bg-white font-extrabold text-[#110c24] outline-none" value={withdrawalAmount} onChange={e => setWithdrawalAmount(e.target.value)} required placeholder="50.00" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">4-digit SPI secure authorization code</label>
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
                <p className="text-[10px] text-slate-400 mb-6 text-center uppercase font-black tracking-widest">Main passbook to Peer passbook | Safe transfer</p>
                
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Recipient SmartPay ID (Email)</label>
                    <input type="email" required className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-purple-500 outline-none text-xs font-bold" value={transferData.email} onChange={e => setTransferData({...transferData, email: e.target.value})} placeholder="E.g. partner@spay.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Transfer Amount (₹)</label>
                    <input type="number" required className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-purple-500 outline-none text-xs font-extrabold" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Secure Transaction PIN (4 digits)</label>
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

            {/* VIEW: UTILITY BILL REMITTANCE SERVICES */}
            {tab === 'utility' && (
              <div className="space-y-4">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
                  <div className="flex justify-between items-center mb-5 border-b pb-3.5 border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-800">Utility Bill Settlement Portal</h3>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">Debit balance from your E-Wallet funds</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 pt-1.5">
                    {[
                      { name: 'Mobile', desc: 'Prepaid-Postpaid', icon: <Smartphone className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 hover:border-blue-300' },
                      { name: 'DTH Satellite', desc: 'Direct TV recharges', icon: <Tv className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600 hover:border-orange-300' },
                      { name: 'Electricity', desc: 'Power boards', icon: <Zap className="w-5 h-5" />, color: 'bg-amber-50 text-amber-500 hover:border-amber-300' },
                      { name: 'Water Grid', desc: 'Civil pipelines', icon: <Droplet className="w-5 h-5" />, color: 'bg-cyan-50 text-cyan-600 hover:border-cyan-300' },
                      { name: 'FASTag Auto', desc: 'Toll barrier locks', icon: <Car className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600 hover:border-emerald-300' },
                      { name: 'Broadband', desc: 'Secure high FTTH', icon: <Globe className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600 hover:border-indigo-300' },
                    ].map(s => (
                      <motion.button 
                        whileHover={{ scale: 1.03, y: -2 }}
                        type="button"
                        key={s.name} 
                        disabled={!user.is_active} 
                        onClick={() => initiateRecharge(s.name)}
                        className={`p-4 bg-slate-50 hover:bg-slate-100/60 rounded-2xl border border-slate-100 text-center flex flex-col items-center justify-center transition-all ${
                          !user.is_active ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:shadow-md cursor-pointer border'
                        } ${s.color}`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-2.5 shadow-xs shrink-0">
                          {s.icon}
                        </div>
                        <p className="text-[11px] font-black text-slate-800 leading-tight">{s.name}</p>
                        <p className="text-[8px] text-slate-400 mt-1 font-semibold leading-normal">{s.desc}</p>
                      </motion.button>
                    ))}
                  </div>

                  {!user.is_active && (
                    <div className="mt-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
                      <p className="text-[10px] font-black uppercase tracking-wide">
                        Basic user recharges disabled. Activate premium license bundle to initiate immediate utilities setup.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW: PREMIUM SHOPPING GALLERY */}
            {tab === 'shop' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-purple-600" />
                    <div>
                      <h3 className="font-extrabold text-sm text-[#110c24]">Exotic Direct Partner Store</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider font-mono">Redeeem items using accumulated E-Wallet cash</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {products.map(p => (
                    <motion.div 
                      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                      key={p.id} 
                      className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:border-purple-200 transition-all flex flex-col justify-between group"
                    >
                      <div className="h-32.5 bg-slate-50 flex items-center justify-center text-4xl group-hover:scale-104 transition-transform duration-300">
                        {p.image}
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-xs text-slate-850 leading-snug">{p.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{p.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-50">
                          <span className="text-xs font-black text-purple-700">₹{p.price}</span>
                          <button 
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Initiate redeem checkout for ${p.name} at ₹${p.price}?`)) {
                                onOrder(user.id, p.id);
                              }
                            }} 
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black rounded-lg tracking-wider uppercase cursor-pointer"
                          >
                            REDEEM
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {products.length === 0 && (
                     <div className="col-span-full text-center py-16 bg-slate-50 rounded-3xl border border-dashed text-slate-400 text-xs font-bold uppercase tracking-wider">
                        No Direct partner products listed.
                     </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW: HELPDESK CHAT ASSISTANT TERMINAL */}
            {tab === 'support' && (
              <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-md flex flex-col h-[480px] overflow-hidden">
                <div className="p-4.5 border-b bg-slate-50 border-slate-150 flex items-center justify-between relative">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                    <h3 className="font-black text-slate-805 text-xs uppercase tracking-wider">
                      24x7 Customer Help Desk Matrix
                    </h3>
                  </div>
                  <span className="text-[8px] bg-slate-200 px-2.5 py-1 rounded-md font-mono text-slate-500">SECURE CONGESTION BLOCK</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-50/50">
                  {chatMessages.map(m => (
                    <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-semibold shadow-xs ${
                        m.senderId === user.id ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                      }`}>
                        <p className="mb-0.5 opacity-60 text-[8px] uppercase font-black tracking-widest text-[#00baf2]">
                          {m.senderName || (m.senderId === 'admin-0' ? 'GATEWAY ADMIN' : 'COMPLIANCE AUDIT')}
                        </p>
                        <p className="leading-relaxed">{m.message}</p>
                        <p className="mt-1.5 opacity-50 text-[7px] text-right font-mono font-bold">
                          {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))}
                  {chatMessages.length === 0 && (
                     <div className="text-center py-20 text-slate-400 text-[11px] font-extrabold uppercase tracking-widest leading-loose">
                       <ChatEmptyState />
                     </div>
                  )}
                </div>

                <form 
                  className="p-3 border-t bg-white flex gap-2 border-slate-100" 
                  onSubmit={(e) => { e.preventDefault(); if(!chatInput.trim()) return; onSendMessage(chatInput, 'admin-0'); setChatInput(''); }}
                >
                   <input type="text" className="flex-1 px-4.5 py-3 bg-slate-50 focus:bg-white border focus:border-purple-500 outline-none rounded-xl text-xs font-bold shadow-inner" placeholder="Pleaase paste reference UTR or ask deposit queries..." value={chatInput} onChange={e => chatInput.length < 220 && setChatInput(e.target.value)} />
                   <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-black rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer shadow-md">SEND</button>
                </form>
              </div>
            )}

            {/* VIEW: MULTILEVEL NETWORK BINARY MATRIX TREE */}
            {tab === 'mlm' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4.5 border-slate-100 gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                      <Network className="w-5 h-5 text-purple-600" />
                      10-Level Downline Business Hierarchy
                    </h3>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">Accumulating Point Volume (PV) down multiple tier blocks</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-100 font-black px-3.5 py-1 rounded-full block sm:inline">
                      TEAM SIZE: {myDownline.length} REGISTERED
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(10)].map((_, i) => {
                    const levelMembers = myDownline.filter(u => (u.level || 1) === ((user.level || 1) + i + 1));
                    const activeCount = levelMembers.filter(u => u.is_active || u.isActivated).length;
                    const percentActive = levelMembers.length ? Math.round((activeCount / levelMembers.length) * 100) : 0;
                    
                    return (
                      <div key={i} className="p-4 bg-slate-50/50 hover:bg-slate-100/40 rounded-2.5xl border border-slate-100 transition-colors flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                              L{i+1}
                            </span>
                            <div>
                              <span className="font-extrabold text-xs text-slate-800">Tier Level {i+1}</span>
                              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 font-mono">Commission Volume block</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-black text-xs text-slate-800">{levelMembers.length} <span className="text-[9px] text-slate-400 font-bold">Agents</span></p>
                            <p className="text-[9px] text-emerald-600 font-black mt-0.5">{activeCount} Premium Active</p>
                          </div>
                        </div>

                        {/* Visual performance bar graph of each level */}
                        <div className="space-y-1">
                          <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                             <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${percentActive}%` }}></div>
                          </div>
                          <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-400 uppercase">
                             <span>BASIC LICENSE</span>
                             <span>{percentActive}% PREMIUM</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};

const ChatEmptyState = () => (
  <div className="flex flex-col items-center justify-center text-center p-8">
    <HelpCircle className="w-12 h-12 text-slate-300 mb-2 animate-bounce" />
    <span className="text-slate-400 text-xs font-bold block">No support issues submitted.</span>
    <span className="text-[9px] text-slate-300 font-semibold uppercase tracking-wider block mt-1">Our support staff is ready to assist you instantly.</span>
  </div>
);

export default Dashboard;
