import React, { useState, useMemo } from 'react';
import { 
  User, 
  Transaction, 
  MLMConfig, 
  PaymentRequest, 
  WithdrawalRequest, 
  ChatMessage, 
  JoiningPackage 
} from '../types';
import { getApiUrl, compressImage } from '../services/utils';
import { supabase } from '../services/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Hourglass, 
  Activity, 
  DollarSign, 
  Award, 
  Package, 
  Settings, 
  MessageSquare, 
  Search, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  RefreshCw, 
  UploadCloud, 
  Check, 
  X, 
  CreditCard, 
  UserCheck, 
  UserMinus, 
  Database,
  Building,
  HelpCircle,
  Copy,
  Sliders,
  Bell,
  Clock,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileText
} from 'lucide-react';

interface AdminProps {
  users: User[];
  transactions: Transaction[];
  config: MLMConfig;
  onUpdateConfig: (c: MLMConfig) => void;
  paymentRequests: PaymentRequest[];
  onApprovePayment: (id: string) => void;
  onRejectPayment?: (id: string) => void;
  withdrawalRequests: WithdrawalRequest[];
  onApproveWithdrawal: (id: string) => void;
  onRejectWithdrawal?: (id: string) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (msg: string, receiverId: string) => void;
  joiningPackages?: JoiningPackage[];
  onUpdatePackages?: (packages: JoiningPackage[]) => void;
}

const AdminPanel: React.FC<AdminProps> = ({ 
  users, 
  transactions, 
  config, 
  onUpdateConfig, 
  paymentRequests = [], 
  onApprovePayment, 
  onRejectPayment, 
  withdrawalRequests = [], 
  onApproveWithdrawal, 
  onRejectWithdrawal,
  chatMessages = [], 
  onSendMessage, 
  joiningPackages = [], 
  onUpdatePackages
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'packages' | 'payments' | 'withdrawals' | 'support' | 'config'>('stats');
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  
  // Searching & details toggles
  const [userQuery, setUserQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUserForAdjustment, setSelectedUserForAdjustment] = useState<string | null>(null);
  const [previewAddMoneyRequest, setPreviewAddMoneyRequest] = useState<PaymentRequest | null>(null);
  
  // Balance adjustment helper state
  const [adjustmentWallet, setAdjustmentWallet] = useState<'wallet_balance' | 'earning_wallet' | 'recharge_wallet'>('wallet_balance');
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>('');
  const [adjustmentOp, setAdjustmentOp] = useState<'add' | 'deduct'>('add');
  const [adjustmentRemark, setAdjustmentRemark] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [submittingActionId, setSubmittingActionId] = useState<string | null>(null);

  // Platform Stats Computations
  const totalVolume = useMemo(() => transactions.reduce((a, b) => a + Math.abs(b.amount || 0), 0), [transactions]);
  const platformRevenue = useMemo(() => totalVolume * 0.05, [totalVolume]);
  const activeUsersCount = useMemo(() => users.filter(u => u.is_active || u.isActivated).length, [users]);
  const pendingPaymentsCount = useMemo(() => paymentRequests.filter(r => r.status === 'pending').length, [paymentRequests]);
  const pendingWithdrawalsCount = useMemo(() => withdrawalRequests.filter(r => r.status === 'pending').length, [withdrawalRequests]);
  
  // Total Withdrawal volume (Approved only)
  const totalPayouts = useMemo(() => {
    return withdrawalRequests
      .filter(w => w.status === 'approved')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [withdrawalRequests]);

  // QR Code Upload Handlers
  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawResult = reader.result as string;
        try {
          const compressedResult = await compressImage(rawResult, 512, 512);
          onUpdateConfig({ ...config, qrCode: compressedResult });
          
          await fetch(getApiUrl('/api/config'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...config, qrCode: compressedResult })
          });
          alert('Scan QR updated successfully!');
        } catch (err) {
          console.error("Error auto-saving QR code:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Direct Status Toggle via Supabase
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean | undefined) => {
    const targetStatus = typeof currentStatus === 'boolean' ? !currentStatus : true;
    setSubmittingActionId(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: targetStatus })
        .eq('id', userId);
        
      if (error) {
        alert('DB Error updating status: ' + error.message);
      } else {
        alert(`User is now successfully ${targetStatus ? 'ACTIVE' : 'INACTIVE'}. Reloading changes...`);
        window.location.reload();
      }
    } catch (e: any) {
      console.error(e);
      alert('Network/Auth error toggling status.');
    } finally {
      setSubmittingActionId(null);
    }
  };

  // Direct Financial Adjustment Tool
  const handleExecuteWalletAdjustment = async (userId: string) => {
    const amt = parseFloat(adjustmentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a positive numeric value for wallet adjustment.');
      return;
    }
    const target = users.find(u => u.id === userId);
    if (!target) return;

    setIsAdjusting(true);
    try {
      const currentBalanceValue = Number(target[adjustmentWallet] || 0);
      const deltaAmount = adjustmentOp === 'add' ? amt : -amt;
      const finalVal = currentBalanceValue + deltaAmount;

      if (finalVal < 0) {
        alert('Operation rejected. Negative balances are prohibited on the platform.');
        setIsAdjusting(false);
        return;
      }

      const { error: updateErr } = await supabase
        .from('users')
        .update({ [adjustmentWallet]: finalVal })
        .eq('id', userId);

      if (updateErr) {
        alert('DB Error updating user balance: ' + updateErr.message);
        setIsAdjusting(false);
        return;
      }

      // Insert transaction logs for audit trail tracking
      await supabase.from('transactions').insert([{
        user_id: userId,
        amount: deltaAmount,
        transaction_type: adjustmentOp === 'add' ? 'admin_credit' : 'admin_debit',
        remark: adjustmentRemark.trim() || `Manual adjustment by admin (${adjustmentOp.toUpperCase()} of ₹${amt} in ${adjustmentWallet.toUpperCase()})`
      }]);

      alert(`Wallet adjusted successfully! Selected account has been ${adjustmentOp === 'add' ? 'credited' : 'debited'} with ₹${amt}.`);
      setAdjustmentAmount('');
      setAdjustmentRemark('');
      setSelectedUserForAdjustment(null);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert('System experienced issues executing manual adjustment.');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Filtered Users computation
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const uName = (u.username || u.name || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uPhone = (u.mobile || u.phone || '').toLowerCase();
      const uSponsor = (u.sponsor_id || '').toLowerCase();
      const term = userQuery.toLowerCase().trim();
      
      const matchesSearch = uName.includes(term) || uEmail.includes(term) || uPhone.includes(term) || uSponsor.includes(term);
      
      const isActiveStatus = !!(u.is_active || u.isActivated);
      const matchesFilter = userStatusFilter === 'all' ? true : 
                            userStatusFilter === 'active' ? isActiveStatus : !isActiveStatus;
                            
      return matchesSearch && matchesFilter;
    });
  }, [users, userQuery, userStatusFilter]);

  // Support Conversations List Filter
  const uniqueChatUsers = useMemo(() => {
    return Array.from(new Set(chatMessages.map(m => m.senderId === 'admin-0' ? m.receiverId : m.senderId))).filter(id => id !== 'admin-0');
  }, [chatMessages]);

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* Supreme Admin Header Block */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 h-40 w-40 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-305 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-500/30">
                SYSTEM MASTER ACCESS
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                CORE NODE SECURE
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">SmartPay 360 Business Console</h1>
            <p className="text-xs text-slate-400 font-medium">
              Real-time platform ledger audits, user financial overrides, and MLM distribution commissions control panel.
            </p>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl flex items-center gap-4 text-left">
            <div className="bg-indigo-600/20 p-2.5 rounded-xl border border-indigo-500/30 text-indigo-400">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Audit Security Log</p>
              <p className="text-xs font-mono font-black text-indigo-300">ADMIN@SPAY360.IN</p>
              <p className="text-[9px] text-[#00baf2] font-black uppercase tracking-wider">Gateway: ONLINE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Matrix Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl border w-fit overflow-x-auto max-w-full no-scrollbar shadow-inner select-none">
        {[
          { tab: 'stats', label: 'Dashboard', icon: Activity },
          { tab: 'users', label: 'Users Directory', icon: Users },
          { tab: 'packages', label: 'Joining Packages', icon: Package },
          { tab: 'payments', label: 'Verify Deposits', icon: ArrowUpRight, count: pendingPaymentsCount, cColor: 'bg-amber-500 text-white' },
          { tab: 'withdrawals', label: 'Verify Payouts', icon: CreditCard, count: pendingWithdrawalsCount, cColor: 'bg-rose-500 text-white' },
          { tab: 'support', label: 'Chats Ticket', icon: MessageSquare, count: uniqueChatUsers.length > 0 ? uniqueChatUsers.length : undefined, cColor: 'bg-indigo-600' },
          { tab: 'config', label: 'System Configurations', icon: Sliders },
        ].map(({ tab, label, icon: Icon, count, cColor }) => (
          <button 
            key={tab} 
            type="button"
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === tab 
                ? 'bg-slate-900 border border-slate-950 text-white shadow-xl' 
                : 'text-slate-550 hover:text-slate-905 hover:bg-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label.toUpperCase()}</span>
            {count !== undefined && count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] text-center font-black min-w-[16px] ${cColor || 'bg-slate-200 text-slate-800'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. STATS TAB */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Main Indicators Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { l: 'PLATFORM REVENUE (5%)', v: `₹${platformRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, desc: 'Total calculated commissions derived safely from transaction fees', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border border-emerald-100 hover:shadow-xs' },
              { l: 'AGGREGATE LEDGER VOLUME', v: `₹${totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, desc: 'Gross transactional value recorded on the platform database', icon: TrendingUp, color: 'text-blue-605 bg-blue-50 border border-blue-100 hover:shadow-xs' },
              { l: 'SECURED USER GROWTH', v: `${activeUsersCount} / ${users.length}`, desc: 'Active/VIP qualified accounts vs. total registration database', icon: Users, color: 'text-purple-700 bg-purple-50 border border-purple-100 hover:shadow-xs' },
              { l: 'DISBURSED PAYOUT MONEY', v: `₹${totalPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, desc: 'Completed withdrawal settlements and fund transfers combined', icon: Award, color: 'text-amber-700 bg-amber-50 border border-amber-100 hover:shadow-xs' },
            ].map(s => (
              <div key={s.l} className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border tracking-wider uppercase">{s.l}</span>
                    <div className={`p-2 rounded-xl border ${s.color}`}>
                      <s.icon className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{s.v}</p>
                </div>
                <p className="text-[10px] text-slate-400 mt-2.5 font-bold leading-normal">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white lg:col-span-2 p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5 border-b pb-3 border-slate-50">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800">Transactional History Flow Audit</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Aggregated recent digital ledger filings</p>
                  </div>
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full font-black uppercase">REALTIME</span>
                </div>

                <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1 no-scrollbar text-xs">
                  {transactions.slice(0, 10).map((tx, idx) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <div key={`${tx.id}-${idx}`} className="p-3 bg-slate-50/50 hover:bg-slate-55 rounded-2xl border border-slate-100 flex justify-between items-center transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center shrink-0 ${
                            isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isCredit ? '+' : '-'}
                          </span>
                          <div>
                            <p className="font-extrabold text-slate-800 font-sans leading-tight">{tx.remark || tx.description || 'Internal balance update'}</p>
                            <p className="text-[9px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              User UID: {tx.user_id?.slice(0, 10).toUpperCase() || 'SYSTEM'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-black ${isCredit ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {isCredit ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                          </p>
                          <p className="text-[8px] text-slate-350 mt-1 font-mono">{new Date(tx.created_at || tx.createdAt || Date.now()).toLocaleDateString()}</p>
                        </div>
                      </div>
                    );
                  })}
                  {transactions.length === 0 && (
                    <p className="text-center py-12 text-slate-400 italic">No platform ledger sync transactions yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#00baf2]" />
                  Operational Verification Checklists
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Real-time automated compliance indicators checking fund filings and active customer payout settlement states.
                </p>
                
                <div className="space-y-3 mt-6">
                  {[
                    { label: "Pending Deposits Queue", value: `${pendingPaymentsCount} Awaiting Verification`, light: pendingPaymentsCount > 0 ? 'bg-amber-400 shadow-amber-500/50' : 'bg-emerald-400 shadow-emerald-500/50' },
                    { label: "Pending Payout settlements", value: `${pendingWithdrawalsCount} Requests pending`, light: pendingWithdrawalsCount > 0 ? 'bg-rose-400 shadow-rose-500/50' : 'bg-emerald-400 shadow-emerald-500/50' },
                    { label: "Level Residual Sync engine", value: "Fully Operational (On-Ledger)", light: "bg-emerald-400 shadow-emerald-500/50" },
                    { label: "Helpdesk Tickets", value: `${uniqueChatUsers.length} Active channels`, light: "bg-emerald-400 shadow-emerald-500/50" },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-850 p-4 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
                        <p className="text-xs font-bold text-slate-100 mt-1">{item.value}</p>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full shadow-lg ${item.light}`}></span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[9px] text-slate-500 font-mono mt-4">Command Terminal Alpha v2.6.1</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. USER CONTROL */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filtering Control Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search users directory by name, email, phone, Sponsor..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all focus:border-indigo-500"
                value={userQuery}
                onChange={e => setUserQuery(e.target.value)}
              />
              {userQuery && (
                <button onClick={() => setUserQuery('')} className="absolute right-3.5 top-3 text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar">
              {[
                { f: 'all', label: 'All Registered' },
                { f: 'active', label: 'VIP License Active' },
                { f: 'inactive', label: 'Basic Accounts' },
              ].map(item => (
                <button
                  key={item.f}
                  type="button"
                  onClick={() => setUserStatusFilter(item.f as any)}
                  className={`px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    userStatusFilter === item.f 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-slate-50/55 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">SECURED USERS DIRECTORY</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Control VIP credentials and override balances</p>
              </div>
              <span className="bg-indigo-55 text-indigo-700 text-xs font-black px-3.5 py-1 rounded-full border border-indigo-100/70">
                {filteredUsers.length} Users Found
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs select-none">
                <thead className="bg-slate-50 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider border-b">
                  <tr>
                    <th className="px-5 py-3.5">Subscriber Identity</th>
                    <th className="px-5 py-3.5">Referral Details</th>
                    <th className="px-5 py-3.5">Wallet Metrics Balance</th>
                    <th className="px-5 py-3.5">Points Audit</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-705">
                  {filteredUsers.map(u => {
                    const isExpand = selectedUserForAdjustment === u.id;
                    const isCurrentlyActive = !!(u.is_active || u.isActivated);
                    return (
                      <React.Fragment key={u.id}>
                        <tr className={`hover:bg-slate-50/50 transition-colors ${isExpand ? 'bg-indigo-50/30' : ''}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-indigo-50 border text-[10px] font-black text-indigo-700 flex items-center justify-center uppercase shadow-xs">
                                {(u.username || u.email || 'U').substring(0, 2)}
                              </span>
                              <div>
                                <p className="font-black text-slate-800 text-xs tracking-tight">{u.username || u.email.split('@')[0]}</p>
                                <p className="text-[9.5px] text-slate-400 font-mono">{u.email}</p>
                                <p className="text-[9px] text-[#00baf2] font-black">{u.mobile || u.phone || 'No Mobile'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                              Sponsor: {u.sponsor_id || 'DIRECT ROOT'}
                            </span>
                            <p className="text-[8.5px] text-slate-450 font-mono mt-1 bg-slate-100 p-1 rounded inline-block">Index: {u.id.substring(0, 10).toUpperCase()}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="space-y-1.5 font-bold text-[10.5px]">
                              <p className="flex items-center gap-1 text-slate-700">
                                <span className="text-slate-400 font-bold w-12 text-[9px]">MAIN WALLET:</span> ₹{Number(u.wallet_balance || 0).toFixed(2)}
                              </p>
                              <p className="flex items-center gap-1 text-indigo-600">
                                <span className="text-slate-400 font-bold w-12 text-[9px]">COMMISSION:</span> ₹{Number(u.earning_wallet || 0).toFixed(2)}
                              </p>
                              <p className="flex items-center gap-1 text-emerald-600">
                                <span className="text-slate-400 font-bold w-12 text-[9px]">E-RECHARGE:</span> ₹{Number(u.recharge_wallet || 0).toFixed(2)}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="space-y-1 font-bold text-[10.5px] text-slate-600">
                              <p><span className="text-slate-400 font-bold text-[9px]">Self PV:</span> {u.self_pv || 0} PV</p>
                              <p><span className="text-slate-400 font-bold text-[9px]">Team PV:</span> {u.team_pv || 0} PV</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              isCurrentlyActive 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isCurrentlyActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                              {isCurrentlyActive ? 'ACTIVE VIP' : 'BASIC'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                type="button"
                                onClick={() => setSelectedUserForAdjustment(isExpand ? null : u.id)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                {isExpand ? 'Close Overwrite' : 'Adjust Funds 📝'}
                              </button>
                              
                              <button 
                                type="button"
                                disabled={submittingActionId === u.id}
                                onClick={() => handleToggleUserStatus(u.id, isCurrentlyActive)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-white shadow-xs cursor-pointer transition-colors ${
                                  isCurrentlyActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                              >
                                {submittingActionId === u.id ? 'Saving...' : isCurrentlyActive ? 'Deactivate VIP' : 'Activate VIP'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Adjust funds inline drawer */}
                        {isExpand && (
                          <tr>
                            <td colSpan={6} className="px-5 py-5 bg-gradient-to-tr from-slate-50 via-indigo-50/10 to-white border-t border-b">
                              <div className="max-w-2xl mx-auto space-y-4">
                                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                  <Sliders className="w-4 h-4 text-indigo-600" /> Overwrite Ledger Balances: {u.username || u.email}
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Target Account Vault</label>
                                    <select 
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                                      value={adjustmentWallet}
                                      onChange={e => setAdjustmentWallet(e.target.value as any)}
                                    >
                                      <option value="wallet_balance">Main Account Wallet (₹)</option>
                                      <option value="recharge_wallet">E-Recharge Wallet (₹)</option>
                                      <option value="earning_wallet">Passive Commission Wallet (₹)</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Operation Mode</label>
                                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                                      <button 
                                        type="button" onClick={() => setAdjustmentOp('add')}
                                        className={`py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                                          adjustmentOp === 'add' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
                                        }`}
                                      >
                                        CREDIT (+)
                                      </button>
                                      <button 
                                        type="button" onClick={() => setAdjustmentOp('deduct')}
                                        className={`py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                                          adjustmentOp === 'deduct' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'
                                        }`}
                                      >
                                        DEBIT (-)
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Amount Override (₹) *</label>
                                    <input 
                                      type="number" min="0.01" step="0.01" required placeholder="0.00"
                                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold outline-none text-slate-800"
                                      value={adjustmentAmount}
                                      onChange={e => setAdjustmentAmount(e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Audit Ledger Narrative / Remarks *</label>
                                  <input 
                                    type="text" required placeholder="E.g. Bonus addition reference promo or deposit settlement correction"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-800"
                                    value={adjustmentRemark}
                                    onChange={e => setAdjustmentRemark(e.target.value)}
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <button 
                                    type="button" onClick={() => setSelectedUserForAdjustment(null)}
                                    className="px-4 py-2 hover:bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    type="button" disabled={isAdjusting}
                                    onClick={() => handleExecuteWalletAdjustment(u.id)}
                                    className="px-6 py-2 bg-slate-900 border border-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black cursor-pointer shadow-sm disabled:opacity-50"
                                  >
                                    {isAdjusting ? 'Executing...' : 'EXECUTE TRANSACT OVERWRITE'}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. JOINING PACKAGES SYSTEM CONFIGS */}
      {activeTab === 'packages' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4 border-slate-50 flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-base text-slate-800">VIP Joining License Packages (Lifetime Benefits)</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Configure default product cost and virtual coin attributes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Quick Pricing Parameters Override */}
            <div className="border rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Primary License Fee Configuration</h4>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Primary Premium Package Price (₹)</label>
                <input 
                  type="number" 
                  step="1"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-black text-slate-800"
                  value={config.packagePrice || 480}
                  onChange={(e) => onUpdateConfig({...config, packagePrice: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">TDS Rate charge deduct (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-bold text-slate-800"
                  value={config.tdsRate || 5}
                  onChange={(e) => onUpdateConfig({...config, tdsRate: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Corporate Admin Service Fee charge (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-bold text-slate-800"
                  value={config.serviceCharge || 5}
                  onChange={(e) => onUpdateConfig({...config, serviceCharge: Number(e.target.value)})}
                />
              </div>
            </div>

            {/* Joining packages attributes directory listing */}
            <div className="border rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex justify-between items-center">
                <span>VIP Bundle Attributes</span>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">Standard Package</span>
              </h4>

              <div className="space-y-4 pt-2">
                {joiningPackages.map((pkg, idx) => {
                  return (
                    <div key={pkg.id || idx} className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                      <p className="text-xs font-black text-slate-800">Bundle Name: <span className="text-indigo-600 bg-white border rounded px-2 py-0.5 ml-1 inline-block text-[10px]">{pkg.name}</span></p>
                      
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Fee (₹)</label>
                          <input 
                            type="number" className="w-full bg-white border border-slate-200 rounded p-1 font-bold text-xs"
                            value={pkg.price} onChange={(e) => {
                              const newPkgs = [...joiningPackages];
                              newPkgs[idx].price = Number(e.target.value);
                              onUpdatePackages?.(newPkgs);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Token Coin reward</label>
                          <input 
                            type="number" className="w-full bg-white border border-slate-200 rounded p-1 font-bold text-xs"
                            value={pkg.coin} onChange={(e) => {
                              const newPkgs = [...joiningPackages];
                              newPkgs[idx].coin = Number(e.target.value);
                              onUpdatePackages?.(newPkgs);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Qualifying PV reward</label>
                          <input 
                            type="number" className="w-full bg-white border border-slate-200 rounded p-1 font-bold text-xs"
                            value={pkg.pv} onChange={(e) => {
                              const newPkgs = [...joiningPackages];
                              newPkgs[idx].pv = Number(e.target.value);
                              onUpdatePackages?.(newPkgs);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. VERIFY DEPOSITS (FUND REQUESTS) */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Verify Manual Added Cash Deposits</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Inspect reference UTR slips and confirm ledger balance additions</p>
            </div>

            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-250/50">
              {[
                { f: 'pending', label: 'Pending Queue 🟠' },
                { f: 'approved', label: 'Approved 🟢' },
                { f: 'rejected', label: 'Rejected 🔴' },
                { f: 'all', label: 'All Filings' },
              ].map(item => (
                <button
                  key={item.f}
                  type="button"
                  onClick={() => setPaymentFilter(item.f as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    paymentFilter === item.f 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs select-none">
                <thead className="bg-slate-50 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider border-b">
                  <tr>
                    <th className="px-5 py-3.5">Subscriber Identity</th>
                    <th className="px-5 py-3.5">Filing Amount</th>
                    <th className="px-5 py-3.5">Reference UPI (UTR ID)</th>
                    <th className="px-5 py-3.5">Receipt Reference attachment</th>
                    <th className="px-5 py-3.5">Filing Timestamp</th>
                    <th className="px-5 py-3.5">Verification Status</th>
                    <th className="px-5 py-3.5 text-right">Confirmation Decent Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-705">
                  {paymentRequests
                    .filter(r => paymentFilter === 'all' ? true : r.status === paymentFilter)
                    .map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/55">
                        <td className="px-5 py-4">
                          <p className="font-extrabold text-slate-800 text-xs">{req.userName || 'Subscriber Account'}</p>
                          <p className="text-[8.5px] text-slate-400 font-mono">REQ: {req.id.slice(0, 15).toUpperCase()}...</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-emerald-705 font-black text-sm bg-emerald-50 border border-emerald-100 px-3 py-0.5 rounded-xl">
                            ₹{Number(req.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-black text-slate-705 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10.5px]">
                              {req.utr || 'N/A'}
                            </span>
                            {req.utr && (
                              <button 
                                type="button"
                                onClick={() => { navigator.clipboard.writeText(req.utr); alert('Reference key code copied!'); }}
                                className="text-slate-400 hover:text-indigo-600 bg-white border p-1 rounded-md"
                              >
                                <Copy className="w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {req.screenshot ? (
                            <div className="flex items-center gap-2">
                              <img src={req.screenshot} className="w-8 h-8 rounded-lg border object-cover shadow-xs" alt="proof" />
                              <button
                                type="button"
                                onClick={() => setPreviewAddMoneyRequest(req)}
                                className="text-indigo-600 hover:underline font-black text-[9.5px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-500" /> Inspect Slip
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No Reference slip Uploaded</span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-[10px] text-slate-400">
                          {new Date(req.createdAt).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'medium' })}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-black text-[8.5px] uppercase tracking-wide border ${
                            req.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-250/50' :
                            req.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-250/50' : 'bg-rose-50 text-rose-800 border-rose-250/50'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {req.status === 'pending' ? (
                            <div className="inline-flex gap-1.5">
                              <button 
                                type="button"
                                onClick={() => { if(confirm(`Confirm transaction audit? Appending ₹${req.amount} credit to user balance.`)) onApprovePayment(req.id); }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider shadow-xs cursor-pointer"
                              >
                                APPROVE
                              </button>
                              {onRejectPayment && (
                                <button 
                                  type="button"
                                  onClick={() => { if(confirm("Are you sure you want to REJECT this receipt verification request?")) onRejectPayment(req.id); }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider shadow-xs cursor-pointer"
                                >
                                  REJECT
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic font-bold">Process Complete</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  {paymentRequests.filter(r => paymentFilter === 'all' ? true : r.status === paymentFilter).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400 italic font-medium">No matching deposits found under this queue.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. VERIFY PAYOUTS (WITHDRAWALS) */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Verify Bank Settlement Withdrawals</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Dispatch payout requests to Saved Banking accounts</p>
            </div>

            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-250/50">
              {[
                { f: 'pending', label: 'Pending Settlements 🟠' },
                { f: 'approved', label: 'Disbursed 🟢' },
                { f: 'rejected', label: 'Rejected / Refunded 🔴' },
                { f: 'all', label: 'All Settlements' },
              ].map(item => (
                <button
                  key={item.f}
                  type="button"
                  onClick={() => setWithdrawalFilter(item.f as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    withdrawalFilter === item.f 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-505 hover:text-slate-705'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto border-b-0">
              <table className="w-full text-left text-xs select-none">
                <thead className="bg-slate-50 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider border-b">
                  <tr>
                    <th className="px-5 py-3.5">Subscriber Identity</th>
                    <th className="px-5 py-3.5">Amount requested</th>
                    <th className="px-5 py-3.5">Recipient Bank Coordinates</th>
                    <th className="px-5 py-3.5">Request Timestamp</th>
                    <th className="px-5 py-3.5 font-bold text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Payout Dispatch Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-705">
                  {withdrawalRequests
                    .filter(r => withdrawalFilter === 'all' ? true : r.status === withdrawalFilter)
                    .map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/55">
                        <td className="px-5 py-4">
                          <p className="font-extrabold text-slate-800 text-xs">{req.userName || 'Account user'}</p>
                          <p className="text-[8.5px] text-slate-450 font-mono">SETTLE: {req.id.slice(0,10).toUpperCase()}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-rose-650 font-black text-sm bg-rose-50 border border-rose-100 px-3 py-0.5 rounded-xl">
                            - ₹{Number(req.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-[10px] bg-slate-50 p-3 rounded-2xl border max-w-xs space-y-1 my-1">
                            <p className="flex justify-between hover:bg-white px-1.5 py-0.5 rounded transition">
                              <span className="text-slate-405 font-bold">Holder:</span> 
                              <span className="font-black text-slate-800 uppercase">{req.bankDetails?.holderName || req.userName || 'N/A'}</span>
                            </p>
                            <p className="flex justify-between hover:bg-white px-1.5 py-0.5 rounded transition">
                              <span className="text-slate-405 font-bold">A/C Index:</span> 
                              <span className="font-mono font-black text-indigo-700">{req.bankDetails?.accountNumber || 'N/A'}</span>
                            </p>
                            <p className="flex justify-between hover:bg-white px-1.5 py-0.5 rounded transition">
                              <span className="text-slate-405 font-bold">IFSC Code:</span> 
                              <span className="font-mono font-black text-slate-890 uppercase">{req.bankDetails?.ifscCode || 'N/A'}</span>
                            </p>
                            <p className="flex justify-between hover:bg-white px-1.5 py-0.5 rounded transition">
                              <span className="text-slate-405 font-bold">Bank Brand:</span> 
                              <span className="font-bold text-slate-600 block truncate max-w-[150px]">{req.bankDetails?.bankName || 'N/A'}</span>
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-[10px] text-slate-400">
                          {new Date(req.createdAt).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'medium' })}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full font-black text-[8.5px] uppercase tracking-wide border ${
                            req.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-250/50' :
                            req.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-250/50' : 'bg-rose-50 text-rose-805 border-rose-250/50'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {req.status === 'pending' ? (
                            <div className="inline-flex gap-1.5">
                              <button 
                                type="button"
                                onClick={() => { if (confirm("Have you successfully sent bank funds to this member? Click OK to mark Approved.")) onApproveWithdrawal(req.id); }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider shadow-xs cursor-pointer"
                              >
                                MARK PAID
                              </button>
                              {onRejectWithdrawal && (
                                <button 
                                  type="button"
                                  onClick={() => { if (confirm("Reject settlement request and return money autonomously to user balance?")) onRejectWithdrawal(req.id); }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider shadow-xs cursor-pointer"
                                >
                                  REJECT
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic font-bold">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  {withdrawalRequests.filter(r => withdrawalFilter === 'all' ? true : r.status === withdrawalFilter).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400 italic font-medium">No matching settlement requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUPPORT MESSAGES TAB */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[540px]">
          {/* Active Chats Contacts list */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-y-auto no-scrollbar shadow-sm">
            <div className="p-4 border-b bg-slate-50/70 font-black text-[10px] text-slate-800 tracking-wider uppercase flex items-center gap-1.5 border-slate-100">
              <MessageSquare className="w-4.5 h-4.5 text-indigo-600" /> Active Customers Helpdesk Tickets
            </div>
            {uniqueChatUsers.map(uid => {
              const uObj = users.find(u => u.id === uid);
              const isSel = selectedChatUser === uid;
              return (
                <button 
                  key={uid} 
                  type="button"
                  onClick={() => setSelectedChatUser(uid)} 
                  className={`w-full text-left p-4 border-b hover:bg-slate-50 transition-colors flex items-center gap-3 cursor-pointer ${
                    isSel ? 'bg-indigo-50/50 border-r-4 border-r-indigo-600' : ''
                  }`}
                >
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center uppercase shadow-xs shrink-0">
                    {(uObj?.username || uObj?.email || 'U').substring(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 text-xs tracking-tight truncate">{uObj?.username || uObj?.email.split('@')[0]}</p>
                    <p className="text-[9.5px] text-slate-400 font-mono tracking-tight mt-0.5 truncate">{uObj?.email || uid}</p>
                  </div>
                </button>
              );
            })}
            {uniqueChatUsers.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs italic font-semibold">
                No support conversations or queries opened yet.
              </div>
            )}
          </div>
          
          {/* Active Conversation Dialogue Screen */}
          <div className="lg:col-span-2 bg-white border border-slate-150 rounded-3xl flex flex-col overflow-hidden shadow-sm">
            {selectedChatUser ? (
              <>
                <div className="p-4 border-b bg-slate-50 font-black text-xs text-slate-800 flex justify-between items-center shadow-xs border-slate-150">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="font-extrabold uppercase text-[10px]">Subscriber Code: {users.find(u => u.id === selectedChatUser)?.username || 'VIP ACCOUNT'}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedChatUser(null)} 
                    className="text-[10px] text-slate-500 bg-white hover:bg-slate-100 border px-3 py-1 rounded-xl font-black uppercase tracking-wider cursor-pointer"
                  >
                    Close Dialogue
                  </button>
                </div>
                
                {/* Scroll Thread */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3.5 no-scrollbar bg-slate-50/20">
                  {chatMessages
                    .filter(m => m.senderId === selectedChatUser || m.receiverId === selectedChatUser)
                    .map((m, idx) => {
                      const isAdmin = m.senderId === 'admin-0';
                      return (
                        <div key={`${m.id}-${idx}`} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`shadow-xs max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isAdmin 
                              ? 'bg-purple-600 text-white rounded-br-none' 
                              : 'bg-white border text-slate-800 rounded-bl-none'
                          }`}>
                            <p className="font-black text-[8.5px] uppercase tracking-wider mb-1 text-purple-200">
                              {isAdmin ? 'SUPPORT AGENT OVERRIDE' : m.senderName}
                            </p>
                            <p className="font-semibold break-words line-clamp-none">{m.message}</p>
                            <p className={`text-[7.5px] text-right mt-1.5 font-mono ${isAdmin ? 'text-purple-300' : 'text-slate-400'}`}>
                              {new Date(m.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                {/* Input submission bar */}
                <form 
                  className="p-3 border-t bg-slate-50 border-slate-150 flex gap-2" 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if(!adminReply.trim()) return; 
                    onSendMessage(adminReply.trim(), selectedChatUser!); 
                    setAdminReply(''); 
                  }}
                >
                  <input 
                    type="text" required
                    className="flex-grow px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500" 
                    placeholder="Type official assistance message..." 
                    value={adminReply} 
                    onChange={e => setAdminReply(e.target.value)} 
                  />
                  <button 
                    type="submit" 
                    className="bg-purple-600 text-white hover:bg-purple-700 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer"
                  >
                    SEND MSG
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 space-y-4">
                <HelpCircle className="w-12 h-12 text-slate-300 animate-pulse stroke-1" />
                <p className="text-xs italic font-black text-slate-500 uppercase tracking-widest">Select Ticket from Left Panel</p>
                <p className="text-[10px] text-slate-400 text-center max-w-sm leading-relaxed">Choose an open support channel to provide expert platform guidance directly to user.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. SYSTEM CONFIGURATIONS SETTING */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Branding Parameters */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-slate-850 text-sm flex items-center gap-2 mb-4">
                  <span className="w-2 h-6 bg-slate-900 rounded-full"></span>
                  Corporate Identity Configuration
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">System Business Logo</label>
                    <div className="aspect-video bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 relative overflow-hidden max-h-32">
                      {config.customLogo ? (
                        <img src={config.customLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="text-slate-400 text-[10px] font-bold">No Custom Brand Uploaded</span>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const rawResult = reader.result as string;
                            try {
                              const compressedLogo = await compressImage(rawResult, 360, 100);
                              onUpdateConfig({ ...config, customLogo: compressedLogo });
                              localStorage.setItem('spay_custom_logo', compressedLogo);
                              window.dispatchEvent(new Event('spay-logo-updated'));
                              
                              await fetch(getApiUrl('/api/config'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...config, customLogo: compressedLogo })
                              });
                              alert('Business logo updated successfully!');
                            } catch (err) {
                              console.error("Error auto-saving Logo:", err);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                      className="hidden" 
                      id="logo-input" 
                    />
                    <label htmlFor="logo-input" className="block text-center w-full py-2.5 bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-850 cursor-pointer shadow-xs">
                      Upload Landscape Logo
                    </label>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Direct Receiver QR Code</label>
                    <div className="aspect-video bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 relative overflow-hidden max-h-32">
                      {config.qrCode ? (
                        <img src={config.qrCode} alt="Admin QR" className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="text-slate-400 text-[10px] font-bold">No Scannable QR Uploaded</span>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleQRUpload} 
                      className="hidden" 
                      id="qr-input" 
                    />
                    <label htmlFor="qr-input" className="block text-center w-full py-2.5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-750 cursor-pointer shadow-xs">
                      Upload Deposit QR
                    </label>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t mt-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Building className="w-3.5" /> Corporate Business Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold bg-slate-50 hover:bg-slate-100/50 focus:bg-white outline-none text-xs"
                      value={config.businessName || 'SmartPay 360'}
                      onChange={(e) => onUpdateConfig({...config, businessName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><HelpCircle className="w-3.5" /> Legal Support Contact Email/URL</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold bg-slate-50 hover:bg-slate-100/50 focus:bg-white outline-none text-xs"
                      value={config.supportContact || ''}
                      placeholder="e.g. support@smartpay360.in"
                      onChange={(e) => onUpdateConfig({...config, supportContact: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Commissions setups */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                Level Commissions Setup Matrix Setup
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">System Base Coin Conversion (₹)</label>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-2">
                    <span className="flex items-center text-xs font-bold px-3 text-slate-405">1.00 COIN =</span>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full px-3 py-1.5 font-black text-slate-800 bg-white border border-slate-150 rounded-lg text-xs outline-none"
                      value={config.systemCoinValue || 1}
                      onChange={(e) => onUpdateConfig({...config, systemCoinValue: Number(e.target.value)})}
                    />
                    <span className="flex items-center text-[10px] font-black px-2.5 text-slate-400 font-mono">INR</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Multi-level Generation commissions (%)</label>
                    <span className="text-[9px] text-[#00baf2] font-black bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded tracking-wide uppercase">20-Tier Matrix</span>
                  </div>
                  
                  <div className="space-y-1.5 max-h-[210px] overflow-y-auto no-scrollbar pr-1">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-150 justify-between">
                        <span className="text-[9px] font-black text-slate-400 w-16">LEVEL {i+1}</span>
                        <div className="flex items-center bg-white border rounded-lg p-1 w-28">
                          <input 
                            type="number" 
                            step="0.1"
                            className="w-full px-2 text-right text-xs font-black text-slate-800 outline-none"
                            value={config.levels?.[i] || 0}
                            onChange={(e) => {
                              const newLevels = [...(config.levels || [])];
                              newLevels[i] = Number(e.target.value);
                              onUpdateConfig({...config, levels: newLevels});
                            }}
                          />
                          <span className="text-slate-400 font-bold text-[9px] px-1 font-mono">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              type="button"
              onClick={async () => {
                try {
                  const payload = {
                    ...config,
                    joiningPackages: joiningPackages
                  };
                  await fetch(getApiUrl('/api/config'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                } catch (err) {}
                
                if (config.customLogo) {
                  localStorage.setItem('spay_custom_logo', config.customLogo);
                }
                if (config.businessName) {
                  localStorage.setItem('spay_system_name', config.businessName);
                }
                
                if (typeof (window as any).spay_update_logo === 'function' && config.customLogo) {
                  (window as any).spay_update_logo(config.customLogo);
                }
                window.dispatchEvent(new Event('spay-logo-updated'));
                alert('All Platform Configuration matrix and packages saved successfully!');
              }}
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs tracking-widest uppercase rounded-xl shadow-xl transition-all hover:scale-102 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> SAVE SYSTEM CONFIGS
            </button>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT DEPOSIT SLIPS AND RECEIPT IMAGES */}
      <AnimatePresence>
        {previewAddMoneyRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden max-w-lg w-full border shadow-2xl flex flex-col justify-between"
            >
              <div className="px-5 py-4 border-b bg-slate-50 flex justify-between items-center bg-gradient-to-r from-purple-800 to-indigo-900 text-white">
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase">Inspect Deposit Slip Reference</h4>
                  <p className="text-[10px] text-purple-200 font-bold leading-none mt-1">UTR: {previewAddMoneyRequest.utr}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setPreviewAddMoneyRequest(null)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 flex flex-col items-center justify-center bg-slate-50/50">
                {previewAddMoneyRequest.screenshot ? (
                  <img 
                    src={previewAddMoneyRequest.screenshot} 
                    className="max-h-[350px] object-contain rounded-2xl shadow-md border bg-white p-1" 
                    alt="inspected slips" 
                  />
                ) : (
                  <p className="text-slate-400 italic">No image slip available</p>
                )}

                <div className="w-full mt-4 bg-white rounded-2xl border p-4.5 text-xs text-slate-800 font-black space-y-1">
                  <p className="flex justify-between"><span className="text-slate-450">Filing Subscriber:</span> {previewAddMoneyRequest.userName}</p>
                  <p className="flex justify-between"><span className="text-slate-455">Reference UTR ID:</span> <span className="font-mono text-indigo-700">{previewAddMoneyRequest.utr}</span></p>
                  <p className="flex justify-between items-center"><span className="text-slate-455">Asserted Amount:</span> <span className="text-emerald-650 bg-emerald-50 px-2 py-0.5 rounded text-sm font-mono font-black border border-emerald-100">₹{previewAddMoneyRequest.amount}</span></p>
                </div>
              </div>

              <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                {previewAddMoneyRequest.status === 'pending' ? (
                  <>
                    <button 
                      type="button"
                      onClick={() => {
                        if (confirm(`Approve this cash load of ₹${previewAddMoneyRequest.amount}?`)) {
                          onApprovePayment(previewAddMoneyRequest.id);
                          setPreviewAddMoneyRequest(null);
                        }
                      }}
                      className="px-5 py-2.5 bg-emerald-600 text-white font-black text-[10.5px] uppercase tracking-wider rounded-xl cursor-pointer hover:bg-emerald-700 shadow-sm"
                    >
                      APPROVE DEPOSIT
                    </button>
                    {onRejectPayment && (
                      <button 
                        type="button"
                        onClick={() => {
                          if (confirm(`Reject this verification slip?`)) {
                            onRejectPayment(previewAddMoneyRequest.id);
                            setPreviewAddMoneyRequest(null);
                          }
                        }}
                        className="px-5 py-2.5 bg-rose-650 text-white font-black text-[10.5px] uppercase tracking-wider rounded-xl cursor-pointer hover:bg-rose-700 shadow-xs"
                      >
                        REJECT DEPOSIT
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400 text-xs italic font-semibold py-1.5 px-3">Transaction processed: {previewAddMoneyRequest.status.toUpperCase()}</span>
                )}
                <button 
                  type="button" onClick={() => setPreviewAddMoneyRequest(null)}
                  className="px-4 py-2.5 bg-slate-100 font-black text-[10.5px] text-slate-500 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Close View
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminPanel;
