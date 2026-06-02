import React, { useState, useMemo } from 'react';
import { User, Transaction, Product, PaymentRequest, WithdrawalRequest, ChatMessage, BankDetails } from '../types';
import { compressImage } from '../services/utils';
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
  ChevronDown
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

  const myDownline = useMemo(() => {
    const findDownline = (uId: string): User[] => {
      const directs = users.filter(u => u.sponsor_id === uId);
      let fullList = [...directs];
      directs.forEach(d => fullList = [...fullList, ...findDownline(d.id)]);
      return fullList;
    };
    return findDownline(user.id);
  }, [users, user.id]);

  const activeDownlineCount = useMemo(() => {
    return myDownline.filter(u => u.is_active || u.isActivated).length;
  }, [myDownline]);

  const shareText = `Join SmartPay 360 and earn from 10 levels of referrals! Use my referral code: ${(user.referralCode || user.id.slice(0,8))}. Sign up now!`;
  const shareUrl = window.location.origin;

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
    <div className="space-y-4 max-w-4xl mx-auto px-2 sm:px-4 pb-12 font-sans text-slate-900 selection:bg-violet-100 selection:text-violet-900">
      
      {/* 🚀 HEADER: Paytm/PhonePe style Premium Dynamic Header Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-[#1a1438] to-[#120e2e] text-white p-4.5 rounded-2xl sm:rounded-3xl border border-violet-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5f259f] rounded-full blur-[110px] opacity-25 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#00baf2] rounded-full blur-[40px] opacity-20 pointer-events-none"></div>

        <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
          <div className="relative shrink-0">
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#5f259f] via-violet-600 to-[#00baf2] flex items-center justify-center border-2 border-white/20 text-white font-extrabold text-lg uppercase shadow-md">
              {user.email[0]}
            </div>
            <div className="absolute -bottom-1 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#1a1438] flex items-center justify-center text-[10px]" title="Network Active Status">
              {user.is_active ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <AlertCircle className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">{user.username || user.email.split('@')[0]}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0 ${
                user.is_active ? 'bg-amber-400 text-slate-900 shadow-sm' : 'bg-slate-700 text-slate-300'
              }`}>
                {user.is_active ? '🌟 Premium' : 'Basic'}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-violet-200 mt-0.5 font-semibold truncate">{user.email}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Sponsor: {user.sponsor_id || "None"}</p>
          </div>
        </div>

        {/* Dynamic Balance Badging */}
        <div className="flex mt-1.5 sm:mt-0 w-full sm:w-auto gap-3.5 self-stretch sm:self-center border-t border-white/5 sm:border-0 pt-3 sm:pt-0 justify-around sm:justify-end">
          <div className="text-center sm:text-right">
            <p className="text-[8px] font-bold text-violet-300 uppercase tracking-widest">Main Wallet</p>
            <p className="text-lg sm:text-2xl font-black text-white mt-0.5">₹{(user.wallet_balance || 0).toFixed(2)}</p>
          </div>
          <div className="h-8 w-[1px] bg-white/10 self-center"></div>
          <div className="text-center sm:text-right">
            <p className="text-[8px] font-bold text-[#00baf2] uppercase tracking-widest">E-Wallet</p>
            <p className="text-lg sm:text-2xl font-black text-amber-400 mt-0.5">₹{(user.recharge_wallet || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* ⚠️ INACTIVE ACTION PROMPT */}
      {!user.is_active && (
        <div className="bg-gradient-to-r from-violet-950 to-indigo-950 text-white p-4 rounded-2xl border border-violet-500/20 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <h3 className="font-extrabold text-sm tracking-tight text-white">Unlock Rank Earnings & Premium Recharges</h3>
            </div>
            <p className="text-[10px] sm:text-xs text-violet-200 leading-normal max-w-xl">
              Purchase our lifetime membership license bundle for just <strong className="text-amber-400 font-black">₹{packagePrice}</strong>. Unlock multilevel network binary ranking and direct cashouts.
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => onActivate(user.id)} 
            className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg transition-transform active:scale-98 whitespace-nowrap block text-center"
          >
            Activate Instant Bundle
          </button>
        </div>
      )}

      {/* 💳 MOBILE APP COGNITIVE WALLET CARDS - Sleek Dual Column Grid on Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* Passbook Commission Card */}
        <div className="bg-gradient-to-tr from-[#5f259f] to-indigo-900 text-white p-4.5 rounded-2xl border border-white/15 shadow-md relative overflow-hidden">
          <div className="absolute top-[-30%] right-[-20%] w-32 h-32 bg-[#00baf2] rounded-full blur-[40px] opacity-35"></div>
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-violet-200 uppercase tracking-wider">A/C Commission</p>
            <ArrowUpRight className="w-4 h-4 text-violet-200" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-1.5">₹{(user.earning_wallet || 0).toFixed(2)}</p>
          <div className="mt-3.5 flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 pt-2 border-t border-white/10">
            <span className="text-[8px] text-violet-200 font-bold truncate">Premium ready</span>
            <button 
              type="button" 
              onClick={() => setTab('withdraw')} 
              className="px-2.5 py-1 bg-white hover:bg-violet-50 text-violet-700 text-[9px] font-black rounded-lg uppercase tracking-wider transition-all shadow-xs"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Passbook Recharge Wallet Card as E-Wallet */}
        <div className="bg-gradient-to-tr from-[#053c5e] to-slate-950 text-white p-4.5 rounded-2xl border border-white/10 shadow-md relative overflow-hidden">
          <div className="absolute bottom-[-30%] right-[-10%] w-32 h-32 bg-[#00baf2] rounded-full blur-[40px] opacity-25"></div>
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-blue-300 uppercase tracking-wider">E-Wallet Balance</p>
            <Smartphone className="w-4 h-4 text-[#00baf2]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1.5 font-mono">₹{(user.recharge_wallet || 0).toFixed(2)}</p>
          <div className="mt-3.5 flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 pt-2 border-t border-white/5">
            <span className="text-[8px] text-slate-300 font-bold truncate">Instant Trigger</span>
            <button 
              type="button" 
              onClick={() => setTab('add_money')} 
              className="px-2.5 py-1 bg-gradient-to-r from-[#00baf2] to-[#120e2e] text-white text-[9px] font-black rounded-lg uppercase tracking-wider transition-transform active:scale-95 shadow-md"
            >
              Add Cash
            </button>
          </div>
        </div>

        {/* Network & Downline Size Card - Full width span on mobile or beautifully padded */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-tr from-slate-900 to-slate-950 text-white p-4.5 rounded-2xl border border-white/5 shadow-md relative overflow-hidden">
          <div className="absolute top-[-30%] left-[-20%] w-32 h-32 bg-amber-500 rounded-full blur-[40px] opacity-15"></div>
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider">My Network</p>
            <Network className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-1.5">{myDownline.length} <span className="text-[9px] text-slate-400 font-bold tracking-normal uppercase">Members</span></p>
          <div className="mt-3.5 flex flex-row items-center justify-between gap-1 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[8px] text-emerald-400 font-black">{activeDownlineCount} Active</span>
            </div>
            <button 
              type="button" 
              onClick={() => setTab('mlm')} 
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-black rounded-lg uppercase tracking-wider transition-colors shadow-xs"
            >
              My Tree
            </button>
          </div>
        </div>
      </div>

      {/* 🔮 PHONEPE MOBILE QUICK ACTIONS INTERACTIVE CORES */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2.5xl border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Settle & Transfer Cash</h3>
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            { id: 'add_money', name: 'Add Money', desc: 'Scan QR & load', color: 'from-[#0b081c] to-[#120e2e] text-[#00baf2] ring-[#00baf2]/10', icon: <ArrowDownToLine className="w-5 h-5" /> },
            { id: 'transfer', name: 'To Wallet', desc: 'Instant peer key', color: 'from-[#1a1438] to-[#110c24] text-[#a78bfa] ring-[#a78bfa]/10', icon: <Send className="w-5 h-5" /> },
            { id: 'withdraw', name: 'To Bank', desc: 'Direct payout A/C', color: 'from-[#231a4c] to-[#1a1438] text-amber-400 ring-amber-500/10', icon: <Landmark className="w-5 h-5" /> },
            { id: 'mlm', name: 'Downlines', desc: '10 level layout', color: 'from-slate-900 to-slate-950 text-emerald-400 ring-emerald-500/10', icon: <Network className="w-5 h-5" /> }
          ].map(action => (
            <button 
              type="button"
              key={action.id} 
              onClick={() => setTab(action.id as any)}
              className="flex flex-col items-center group transition-transform active:scale-95"
            >
              <div className={`w-11 h-11 xs:w-12 xs:h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-1.5 shadow-sm ring-3 group-hover:scale-103 transition-transform`}>
                {action.icon}
              </div>
              <p className="text-[10px] sm:text-[11px] font-black text-slate-800 leading-tight truncate w-full px-0.5">{action.name}</p>
              <p className="text-[7.5px] text-slate-400 mt-0.5 hidden xs:block">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 🧭 PREMIUM FLAT APP NAV/TAB SLIDER */}
      <div className="bg-[#110c24] p-1.5 rounded-2xl border border-white/[0.05] block overflow-x-auto no-scrollbar shadow-inner">
        <div className="flex gap-1.5 float-none">
          {[
            { id: 'home', name: '🏠 Home / Logs' },
            { id: 'add_money', name: '📥 Add Cash' },
            { id: 'withdraw', name: '🏛️ Withdraw' },
            { id: 'utility', name: '⚡ Recharges' },
            { id: 'shop', name: '🛍️ Shop Items' },
            { id: 'transfer', name: '💸 Transfers' },
            { id: 'mlm', name: '👥 Network MLM' },
            { id: 'support', name: '💬 Helpdesk' },
          ].map(t => (
            <button 
              type="button"
              key={t.id} 
              onClick={() => setTab(t.id as any)}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${
                tab === t.id 
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {t.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ⚡ TAB VIEW CONTROLLERS */}

      {/* VIEW: HOME & BANKING PASSBOOK LOGS */}
      {tab === 'home' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Transaction Logs (Passbook Feed) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-violet-600 shrink-0" />
                  Banking Transaction History
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Live passbook stream updates</p>
              </div>
              <span className="text-[10px] bg-slate-100 font-bold px-3 py-1 text-slate-600 rounded-full">
                {transactions.length} Logs
              </span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
              {transactions.map(tx => {
                const isCredit = tx.amount > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-black text-slate-800 leading-tight">
                          {tx.description || tx.remark || 'Internal Transfer log'}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1 font-semibold">
                          {new Date(tx.createdAt || tx.created_at || Date.now()).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs sm:text-sm font-black ${isCredit ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {isCredit ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <span className="text-[8px] uppercase tracking-wider font-extrabold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded mt-1 inline-block">
                        SUCCESS
                      </span>
                    </div>
                  </div>
                );
              })}
              {transactions.length === 0 && (
                <div className="text-center py-24 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-xs font-bold leading-normal">No recent transactions processed.</p>
                  <p className="text-[10px] text-slate-300 uppercase font-black mt-1">Initiate utility pay or add money to start</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel Widgets (Promo and share) */}
          <div className="space-y-6">
            
            {/* Refer & Earn Premium Banner */}
            <div className="bg-[#110c24] text-white p-6 rounded-3xl border border-white/[0.05] shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 rounded-full blur-[70px] opacity-25"></div>
              
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h4 className="font-extrabold text-sm uppercase tracking-wide text-amber-400">Refer & Earn Big</h4>
              </div>
              <p className="text-xs text-violet-200 leading-normal">
                Share your unique code to build your own 10-level binary matrix network tree. Earn points on every activation log.
              </p>

              <div className="bg-[#1e1742] p-4 rounded-2xl border border-white/5 mt-4 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">My Referral Code</p>
                  <span className="font-mono font-black text-base text-white tracking-widest mt-1 block">
                    {(user.referralCode || user.id.slice(0,8))}
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    navigator.clipboard.writeText((user.referralCode || user.id.slice(0,8))); 
                    alert('Referral identity copied to system successfully.');
                  }} 
                  className="px-3.5 py-2 hover:opacity-90 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-opacity shadow-sm"
                >
                  COPY CODE
                </button>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-[9px] font-black text-slate-400 text-center uppercase tracking-wider mb-3">Instant Social Sharing</p>
                <div className="flex items-center gap-3 justify-center">
                   <button 
                     type="button"
                     onClick={() => handleShare('whatsapp')} 
                     className="w-10 h-10 bg-[#25D366] hover:scale-105 transition-transform flex items-center justify-center rounded-2xl text-white shadow-md shadow-green-900/10"
                   >
                     <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .015 5.398.015 12.03c0 2.123.553 4.197 1.603 6.034L0 24l6.135-1.61a11.787 11.787 0 005.912 1.64h.005c6.635 0 12.034-5.399 12.034-12.03 0-3.212-1.25-6.232-3.52-8.504z"/></svg>
                   </button>
                   <button 
                     type="button"
                     onClick={() => handleShare('telegram')} 
                     className="w-10 h-10 bg-[#0088cc] hover:scale-105 transition-transform flex items-center justify-center rounded-2xl text-white shadow-md shadow-blue-900/10"
                   >
                     <svg className="w-5.5 h-5.5 fill-white" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.891 8.146l-2.003 9.464c-.149.659-.539.822-1.091.511l-3.051-2.25-1.47 1.416c-.163.163-.3.298-.615.298l.221-3.137 5.711-5.159c.247-.22-.054-.341-.383-.122l-7.06 4.444-3.041-.951c-.661-.204-.674-.661.139-.98l11.879-4.579c.55-.204 1.03.127.859.936z"/></svg>
                   </button>
                   <button 
                     type="button"
                     onClick={() => handleShare('facebook')} 
                     className="w-10 h-10 bg-[#1877F2] hover:scale-105 transition-transform flex items-center justify-center rounded-2xl text-white shadow-md shadow-indigo-900/10"
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
          {/* QR Code display */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Direct Merchant QR Pay</h3>
            {qrCode ? (
              <div className="p-4 bg-white border-2 border-dashed border-violet-100 rounded-2xl shadow-xs mb-5">
                 <img src={qrCode} alt="Receiver payment wallet code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
              </div>
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 bg-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-400 text-xs font-bold border border-dashed mb-5 p-4 text-center">
                 <ShieldAlert className="w-8 h-8 text-slate-300 mb-2" />
                 Admin receiver QR isn't configured yet. Please request help desk.
              </div>
            )}
            <p className="text-[11px] text-slate-500 font-extrabold max-w-xs leading-relaxed uppercase tracking-wider">
               Instantly Scan the QR with GPay, PhonePe or Paytm. Submit the payment reference to receive immediate wallet replenishment.
            </p>
          </div>

          {/* Form proof submission */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-black text-[#110c24] mb-4">Submit Payment Reference</h3>
            <form onSubmit={handleAddMoneySubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-0.5">Amount Transferred (₹) *</label>
                <input 
                  type="number" required placeholder="E.g. 500" min="1"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white text-slate-800 font-extrabold text-sm outline-none transition-all placeholder:text-slate-400"
                  value={addMoneyData.amount} onChange={e => setAddMoneyData({...addMoneyData, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-0.5">UTR / UPI Transaction ID (Optional)</label>
                <input 
                  type="text" placeholder="12-digit payment index code"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#673ab7] focus:bg-white text-slate-800 font-bold text-xs outline-none transition-all placeholder:text-slate-505"
                  value={addMoneyData.utr} onChange={e => setAddMoneyData({...addMoneyData, utr: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Proof Screenshot (Optional)</label>
                <input 
                  type="file" accept="image/*"
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                  onChange={handleScreenshotChange}
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-800 hover:opacity-95 text-white font-black rounded-xl shadow-lg shadow-violet-950/20 uppercase tracking-widest text-xs"
              >
                SUBMIT FOR ADMIN AUDIT
              </button>
            </form>

            {/* Recent deposit timeline requests logs */}
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Recent Cash Flow Orders</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1 no-scrollbar">
                {paymentRequests.filter(r => r.userId === user.id).map(r => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center text-[10px] border-slate-100">
                    <div>
                      <p className="font-extrabold text-slate-700">₹{r.amount} - Ref: {r.utr || 'N/A'}</p>
                      <p className="text-slate-400 font-bold">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[8px] tracking-wider ${
                      r.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                      r.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
                {paymentRequests.filter(r => r.userId === user.id).length === 0 && <p className="text-center text-slate-400 text-[9px] py-4 italic uppercase tracking-wider font-bold">No previous deposits found.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: WITHDRAW SYSTEM SETTLEMENTS */}
      {tab === 'withdraw' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Bank updates form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-black text-[#110c24] mb-4">Settle Bank Account Credentials</h3>
            <form className="space-y-3.5" onSubmit={(e) => { e.preventDefault(); onUpdateBankDetails(bankForm); alert('Settle bank details configured successfully!'); }}>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-0.5">Account holder Name</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-violet-500 outline-none" value={bankForm.holderName} onChange={e => setBankForm({...bankForm, holderName: e.target.value})} required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-0.5">Bank Name</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-violet-500 outline-none" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-0.5">Account Number</label>
                  <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-violet-500 outline-none" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-0.5">IFSC Code</label>
                  <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:border-violet-500 outline-none" value={bankForm.ifscCode} onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})} required />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-slate-900 shadow-md text-white text-xs font-black rounded-xl hover:bg-black transition-all uppercase tracking-widest"
              >
                SAVE BANK CONFIGURATION
              </button>
            </form>
          </div>

          {/* Settle Money transfer block */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-black text-slate-800 mb-1">Instant Bank Cash-out</h3>
            <p className="text-[10px] text-slate-400 mb-4 uppercase font-black tracking-widest">Commission Wallet | Min ₹50 settlement</p>
            
            <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-0.5">Withdrawal Amount (₹)</label>
                <input type="number" min="50" className="w-full px-4 py-2.5 bg-slate-50 border-2 border-violet-100 rounded-xl focus:border-violet-500 focus:bg-white font-extrabold text-[#110c24] outline-none" value={withdrawalAmount} onChange={e => setWithdrawalAmount(e.target.value)} required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-0.5">Secure Transaction Pin</label>
                <input 
                  type="password" maxLength={4} inputMode="numeric" pattern="\d{4}" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white font-black text-center tracking-[0.4em] outline-none" 
                  placeholder="0000" value={withdrawalPin} onChange={e => setWithdrawalPin(e.target.value.replace(/\D/g, '').slice(0, 4))} required 
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white font-black rounded-xl shadow-lg shadow-violet-900/30 hover:opacity-95 uppercase tracking-widest text-xs"
              >
                DISPATCH SETTLEMENT REQUEST
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW: PEER TRANSFER */}
      {tab === 'transfer' && (
        <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-black mb-1 text-slate-800 text-center">To Wallet Transfer</h3>
          <p className="text-[10px] text-slate-400 mb-6 text-center uppercase font-black tracking-widest">Main Wallet to Main Wallet instant lookup</p>
          
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-0.5">Recipient Account Email</label>
              <input type="email" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" value={transferData.email} onChange={e => setTransferData({...transferData, email: e.target.value})} placeholder="E.g. member@spay.com" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-0.5">Transfer Amount (₹)</label>
              <input type="number" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-0.5">4-digit Secure Transaction PIN</label>
              <input 
                type="password" maxLength={4} inputMode="numeric" pattern="\d{4}" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-center tracking-[0.4em] text-xs" 
                value={transferData.pin} onChange={e => setTransferData({...transferData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})} placeholder="0000" required 
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black rounded-xl shadow-lg uppercase tracking-widest text-xs"
            >
              COMPLETE PEER TRANSFER
            </button>
          </form>
        </div>
      )}

      {/* VIEW: UTILITY RECHARGES */}
      {tab === 'utility' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Recharges & Utility Bills</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { name: 'Mobile', desc: 'Prepaid/Postpaid', icon: <Smartphone className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
                { name: 'DTH', desc: 'Satellite TV', icon: <Tv className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600' },
                { name: 'Electricity', desc: 'Power grids', icon: <Zap className="w-5 h-5" />, color: 'bg-amber-50 text-amber-500' },
                { name: 'Water', desc: 'Sewer/Tap', icon: <Droplet className="w-5 h-5" />, color: 'bg-cyan-50 text-cyan-600' },
                { name: 'FASTag', desc: 'Toll highway', icon: <Car className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
                { name: 'Broadband', desc: 'FTTH fiber', icon: <Globe className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600' },
              ].map(s => (
                <button 
                  type="button"
                  key={s.name} 
                  disabled={!user.is_active} 
                  onClick={() => initiateRecharge(s.name)}
                  className={`p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 text-center flex flex-col items-center justify-center transition-all ${
                    !user.is_active ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-violet-300 active:scale-95'
                  }`}
                >
                  <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-2.5 shadow-xs`}>
                    {s.icon}
                  </div>
                  <p className="text-[11px] font-black text-slate-800 leading-tight">{s.name}</p>
                  <p className="text-[7.5px] text-slate-400 mt-0.5 tracking-tight">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: E-COMMERCE PRODUCTS */}
      {tab === 'shop' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
            <h3 className="font-extrabold text-sm text-[#110c24] flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-violet-600" />
              Member Direct Products Shop
            </h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase">Redeem via E-Wallet funds</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-2.5xl border border-slate-100 overflow-hidden shadow-sm hover:border-violet-200 transition-all flex flex-col justify-between group">
                <div className="h-32 bg-slate-50 flex items-center justify-center text-3xl group-hover:scale-103 transition-transform">{p.image}</div>
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-xs text-slate-800 leading-tight">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-snug">{p.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <span className="text-xs font-black text-indigo-700">₹{p.price}</span>
                    <button 
                      type="button"
                      onClick={() => onOrder(user.id, p.id)} 
                      className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[9px] font-extrabold rounded-lg tracking-wider transition-colors"
                    >
                      REDEEM
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
               <div className="col-span-full text-center py-16 bg-slate-50 rounded-3xl border border-dashed text-slate-400 text-xs font-bold uppercase tracking-wider">
                  No Direct partner products listed.
               </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: HELPDESK CHAT */}
      {tab === 'support' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[480px] overflow-hidden">
          <div className="p-4 border-b bg-slate-50 border-slate-150 flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-xs flex items-center gap-2 uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              24x7 Customer Assist Chat
            </h3>
            <span className="text-[8px] bg-slate-200 px-2 py-0.5 rounded font-black text-slate-500">SECURE SHELL</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar bg-slate-50/50">
            {chatMessages.map(m => (
              <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-semibold shadow-xs ${
                  m.senderId === user.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  <p className="mb-0.5 opacity-65 text-[8px] uppercase font-bold tracking-widest">
                    {m.senderName || (m.senderId === 'admin-0' ? 'ADMIN' : 'REPRESENTATIVE')}
                  </p>
                  <p className="leading-relaxed">{m.message}</p>
                  <p className="mt-1 opacity-50 text-[7px] text-right">
                    {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            ))}
            {chatMessages.length === 0 && (
               <div className="text-center py-24 text-slate-400 text-[11px] font-extrabold uppercase tracking-widest leading-loose">
                 <ChatEmptyState />
               </div>
            )}
          </div>

          <form 
            className="p-3 border-t bg-white flex gap-2 border-slate-100" 
            onSubmit={(e) => { e.preventDefault(); if(!chatInput.trim()) return; onSendMessage(chatInput, 'admin-0'); setChatInput(''); }}
          >
             <input type="text" className="flex-1 px-4 py-2.5 bg-slate-50 focus:bg-white border rounded-xl text-xs focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none font-bold" placeholder="Discuss balance queries or UTR confirmations here..." value={chatInput} onChange={e => chatInput.length < 220 && setChatInput(e.target.value)} />
             <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-black rounded-xl transition-all text-xs uppercase tracking-widest">SEND</button>
          </form>
        </div>
      )}

      {/* VIEW: MULTILEVEL NETWORK TREE */}
      {tab === 'mlm' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-black text-slate-800">10-Level Downline Business Matrix</h3>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">Expand your network to unlock passive residuals</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] bg-slate-100 font-black px-3 py-1 text-slate-600 rounded-full block sm:inline">
                TOTAL TEAM: {myDownline.length} MEMBER(S)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[...Array(10)].map((_, i) => {
              const levelMembers = myDownline.filter(u => (u.level || 1) === ((user.level || 1) + i + 1));
              const activeCount = levelMembers.filter(u => u.is_active || u.isActivated).length;
              const percentActive = levelMembers.length ? Math.round((activeCount / levelMembers.length) * 100) : 0;
              
              return (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/55 rounded-2xl border border-slate-100 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-violet-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      L{i+1}
                    </span>
                    <div>
                      <span className="font-extrabold text-xs text-slate-800">Level {i+1} tier</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">PV volume accumulation</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-black text-xs text-slate-800">{levelMembers.length} <span className="text-[9px] text-slate-400 font-bold">Users</span></p>
                    <p className="text-[9.5px] text-emerald-600 font-black mt-0.5">{activeCount} Premium Active ({percentActive}%)</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

// Simple visual assist icon for support
const ChatEmptyState = () => (
  <div className="flex flex-col items-center justify-center text-center p-8">
    <HelpCircle className="w-12 h-12 text-slate-300 mb-2 animate-bounce" />
    <span className="text-slate-400 text-xs font-bold block">No support issues submitted.</span>
    <span className="text-[9px] text-slate-300 font-semibold uppercase tracking-wider block mt-1">Our support staff is ready to assist you instantly.</span>
  </div>
);

export default Dashboard;
