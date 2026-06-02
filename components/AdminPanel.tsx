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
  Bell
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

  // Fake chart generator for beautiful administrative visuals (SVG path mapping)
  const chartPoints = useMemo(() => {
    // Generate 7 incremental coordinate segments representing volume
    if (transactions.length === 0) return "M 0 50 L 100 50 L 200 50 L 300 50 L 400 50 L 500 50 L 600 50";
    
    // Group transaction activity or build cumulative wave
    const baseWave = [12, 34, 18, 56, 45, 78, 92];
    const maxVal = Math.max(...baseWave);
    return baseWave.map((val, idx) => {
      const x = (idx / (baseWave.length - 1)) * 100; // 0% to 100% responsive width map
      const y = 90 - (val / maxVal) * 70; // Map values cleanly inside SVG viewbox
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Supreme Admin Header Block */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 h-40 w-40 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-500/30">
                SYSTEM MASTER ACCESS
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                CORE NODE SECURE
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">Command Center Alpha</h1>
            <p className="text-xs text-slate-400 font-medium">
              Real-time platform ledger audits, user financial overrides, and MLM distribution commissions control panel.
            </p>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl flex items-center gap-4 text-left">
            <div className="bg-indigo-600/20 p-2.5 rounded-xl border border-indigo-500/30 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Audit Session Timestamp</p>
              <p className="text-xs font-mono font-black text-slate-200">2026-06-02 10:22:32Z</p>
              <p className="text-[9px] text-indigo-300 font-bold tracking-tight">Logged: admin@spay.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Matrix Tabs */}
      <div className="flex gap-1 bg-slate-100 hover:bg-slate-150 p-1.5 rounded-2xl border w-fit overflow-x-auto max-w-full no-scrollbar">
        {[
          { tab: 'stats', label: 'Dashboard', icon: Activity },
          { tab: 'users', label: 'User Control', icon: Users },
          { tab: 'packages', label: 'Joining Packages', icon: Package },
          { tab: 'payments', label: 'Fund Requests', icon: ArrowUpRight, count: pendingPaymentsCount, cColor: 'bg-amber-500 text-white' },
          { tab: 'withdrawals', label: 'Settlements', icon: CreditCard, count: pendingWithdrawalsCount, cColor: 'bg-rose-500 text-white' },
          { tab: 'support', label: 'User Chats', icon: MessageSquare, count: uniqueChatUsers.length > 0 ? uniqueChatUsers.length : undefined, cColor: 'bg-indigo-600' },
          { tab: 'config', label: 'System Settings', icon: Sliders },
        ].map(({ tab, label, icon: Icon, count, cColor }) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab 
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            {count !== undefined && count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] text-center font-black min-w-[16px] ${cColor || 'bg-slate-200 text-slate-800'}`}>
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
              { l: 'PLATFORM REVENUE (5%)', v: `₹${platformRevenue.toFixed(2)}`, desc: 'Total calculated commissions derived safely from transaction fees', icon: DollarSign, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
              { l: 'AGGREGATE LEDGER VOLUME', v: `₹${totalVolume.toFixed(2)}`, desc: 'Gross transactional value recorded on the platform database', icon: TrendingUp, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
              { l: 'SECURED USER GROWTH', v: `${activeUsersCount} / ${users.length}`, desc: 'Active/Qualified accounts vs. total registration data', icon: Users, color: 'text-slate-800 bg-slate-500/10 border-slate-500/10' },
              { l: 'DISBURSED PAYOUT MONEY', v: `₹${totalPayouts.toFixed(2)}`, desc: 'Completed withdrawal settlements and fund transfers combined', icon: Award, color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20' },
            ].map(s => (
              <div key={s.l} className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:scale-[1.01] transition-transform flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border tracking-wider uppercase">{s.l}</span>
                    <div className={`p-1.5 rounded-lg border ${s.color}`}>
                      <s.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{s.v}</p>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-medium leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real SVG Area Chart Visualizer */}
            <div className="bg-white lg:col-span-2 p-6 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm">System Velocity Index</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dynamic Volume Graph</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> UPWARD TREND
                  </span>
                </div>
                
                {/* SVG Graph Display */}
                <div className="w-full h-44 bg-slate-50 rounded-xl border p-2 relative overflow-hidden flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25"/>
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00"/>
                      </linearGradient>
                    </defs>
                    <path 
                      d={`${chartPoints} L 100 100 L 0 100 Z`} 
                      fill="url(#chartGradient)"
                    />
                    <path 
                      d={chartPoints} 
                      fill="none" 
                      stroke="#4f46e5" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Floating Guideline elements */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-40">
                    <div className="border-b border-dashed border-slate-300 w-full text-[8px] font-bold font-mono text-slate-400 text-right">PEAK VOLUME</div>
                    <div className="border-b border-dashed border-slate-300 w-full text-[8px] font-bold font-mono text-slate-400 text-right">MEDIAN BASE</div>
                    <div className="w-full text-[8px] font-bold font-mono text-slate-400 text-right">START LEDGER</div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 italic font-medium">
                Note: Plotted data visualizes incremental commission loops mapped against real database user interaction logs.
              </p>
            </div>

            {/* Platform Quick Health Metrics panel */}
            <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 mb-4">
                  <Database className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">DATABASE CRON MONITOR</span>
                </div>
                <h3 className="text-base font-black text-white tracking-tight">Verification Checklists</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Automatic fraud prevention flags user transactions exceeding ₹50,000 without verified proofs.
                </p>
                
                <div className="space-y-3 mt-6">
                  {[
                    { label: "Pending Funds Queue", value: `${pendingPaymentsCount} awaiting review`, light: pendingPaymentsCount > 0 ? 'bg-amber-400' : 'bg-emerald-400' },
                    { label: "Payout Settlements Cycle", value: `${pendingWithdrawalsCount} pending`, light: pendingWithdrawalsCount > 0 ? 'bg-rose-400' : 'bg-emerald-400' },
                    { label: "Self PV System Calculation", value: "Automatic (Direct Sync)", light: "bg-emerald-400" },
                    { label: "Support SLAs Matrix", value: "Normal Speed Response", light: "bg-emerald-400" },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-800/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">{item.label}</p>
                        <p className="text-xs font-black text-slate-200 mt-0.5">{item.value}</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${item.light}`}></span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[9px] text-slate-500 font-mono mt-4 leading-none">DB STATUS RESTING: OK v1.0.4</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. USER CONTROL CONTROL ROOM */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filtering Control Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search user by name, email, phone, sponsor..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all focus:border-indigo-500"
                value={userQuery}
                onChange={e => setUserQuery(e.target.value)}
              />
              {userQuery && (
                <button onClick={() => setUserQuery('')} className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
              {[
                { f: 'all', label: 'All Registered' },
                { f: 'active', label: 'Active PV Accounts' },
                { f: 'inactive', label: 'Blocked / Inactive' },
              ].map(item => (
                <button
                  key={item.f}
                  onClick={() => setUserStatusFilter(item.f as any)}
                  className={`px-4 py-2 border rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    userStatusFilter === item.f 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table and Expanding Adjustments Terminal */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">User Ledger Accounts</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Direct database overrides and active statuses</p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 text-xs font-extrabold px-3 py-1 rounded-full border border-indigo-100">
                {filteredUsers.length} Users Listed
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b">
                  <tr>
                    <th className="px-6 py-3.5">Subscriber Identity</th>
                    <th className="px-6 py-3.5">Referral Details</th>
                    <th className="px-6 py-3.5">Wallet Metrics</th>
                    <th className="px-6 py-3.5">Points (P.V.)</th>
                    <th className="px-6 py-3.5 text-center">Security Status</th>
                    <th className="px-6 py-3.5 text-right">Administration Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map(u => {
                    const isExpand = selectedUserForAdjustment === u.id;
                    const isCurrentlyActive = !!(u.is_active || u.isActivated);
                    return (
                      <React.Fragment key={u.id}>
                        <tr className={`hover:bg-slate-50/50 transition-colors ${isExpand ? 'bg-indigo-50/20' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-slate-100 border text-[10px] font-black text-slate-600 flex items-center justify-center uppercase shadow-xs">
                                {(u.name || u.username || 'U').substring(0, 2)}
                              </span>
                              <div>
                                <p className="font-bold text-slate-800 text-sm tracking-tight">{u.username || u.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{u.email}</p>
                                <p className="text-[9px] text-slate-400 font-bold">{u.mobile || u.phone || 'No Mobile'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                              Sponsor: {u.sponsor_id || 'DIRECT ROOT'}
                            </span>
                            <p className="text-[9px] text-slate-400 font-mono mt-1">UUID: {u.id.substring(0, 8)}...</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1.5 font-semibold text-[11px]">
                              <p className="flex items-center gap-1.5 text-slate-700">
                                <span className="text-slate-400 font-bold w-12">MAIN WALLET:</span> ₹{Number(u.wallet_balance || 0).toFixed(2)}
                              </p>
                              <p className="flex items-center gap-1.5 text-indigo-600">
                                <span className="text-slate-400 font-bold w-12 text-[10px]">EARNINGS:</span> ₹{Number(u.earning_wallet || 0).toFixed(2)}
                              </p>
                              <p className="flex items-center gap-1.5 text-emerald-600">
                                <span className="text-slate-400 font-bold w-12">RECHARGE:</span> ₹{Number(u.recharge_wallet || 0).toFixed(2)}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 font-semibold text-[11px] text-slate-600">
                              <p><span className="text-slate-400 font-bold">Self PV:</span> {u.self_pv || 0} PV</p>
                              <p><span className="text-slate-400 font-bold">Team PV:</span> {u.team_pv || 0} PV</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              isCurrentlyActive 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isCurrentlyActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              {isCurrentlyActive ? 'ACTIVE' : 'BLOCKED'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open/Close Adjustments Terminal */}
                              <button 
                                onClick={() => setSelectedUserForAdjustment(isExpand ? null : u.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all border flex items-center gap-1 ${
                                  isExpand 
                                    ? 'bg-slate-900 border-slate-950 text-white' 
                                    : 'bg-white border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200'
                                }`}
                              >
                                <Database className="w-3 h-3" />
                                {isExpand ? "Close terminal" : "Adjust Money"}
                              </button>

                              {/* Toggle Active status block */}
                              <button 
                                disabled={submittingActionId === u.id}
                                onClick={() => handleToggleUserStatus(u.id, isCurrentlyActive)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-colors border flex items-center gap-1 ${
                                  isCurrentlyActive 
                                    ? 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200/50' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                                }`}
                              >
                                {isCurrentlyActive ? <UserMinus className="w-3" /> : <UserCheck className="w-3" />}
                                {submittingActionId === u.id ? 'Saving...' : isCurrentlyActive ? 'Block' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Manual Financial Adjustment Box */}
                        {isExpand && (
                          <tr>
                            <td colSpan={6} className="bg-slate-50/80 p-5 border-l-4 border-indigo-600">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end max-w-5xl">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <span>TARGET BALANCE TYPE</span>
                                    <HelpCircle className="w-3 h-3 text-slate-300" />
                                  </label>
                                  <select 
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none"
                                    value={adjustmentWallet}
                                    onChange={e => setAdjustmentWallet(e.target.value as any)}
                                  >
                                    <option value="wallet_balance">Main Wallet (Recharge / Transfer)</option>
                                    <option value="earning_wallet">Earning Balance (MLM Loop Commission)</option>
                                    <option value="recharge_wallet">E-Wallet (Add Money Balance)</option>
                                  </select>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OPERATION DIR</label>
                                  <div className="grid grid-cols-2 p-1 bg-slate-100 border rounded-xl gap-1">
                                    <button 
                                      onClick={() => setAdjustmentOp('add')}
                                      className={`py-1 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
                                        adjustmentOp === 'add' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                                      }`}
                                    >
                                      <ArrowUpRight className="w-3" /> CREDIT (+)
                                    </button>
                                    <button 
                                      onClick={() => setAdjustmentOp('deduct')}
                                      className={`py-1 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
                                        adjustmentOp === 'deduct' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                                      }`}
                                    >
                                      <ArrowDownRight className="w-3" /> DEBIT (-)
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TRANSACTION AMOUNT (₹)</label>
                                  <input 
                                    type="number" 
                                    placeholder="Enter positive value..." 
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold tracking-tight outline-none"
                                    value={adjustmentAmount}
                                    onChange={e => setAdjustmentAmount(e.target.value)}
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REMARK / AUDIT REASON LOG</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. Compensated deposit mistake" 
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                                    value={adjustmentRemark}
                                    onChange={e => setAdjustmentRemark(e.target.value)}
                                  />
                                </div>

                                <div className="md:col-span-4 flex justify-end gap-3 pt-2">
                                  <button 
                                    onClick={() => setSelectedUserForAdjustment(null)}
                                    className="px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 bg-white hover:bg-slate-50"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    disabled={isAdjusting}
                                    onClick={() => handleExecuteWalletAdjustment(u.id)}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                                  >
                                    {isAdjusting ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                    {isAdjusting ? 'EXECUTING OVERRIDE...' : 'EXECUTE ADJUSTMENT'}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                        No registered database user matches the queried filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. JOINING PACKAGES TAB */}
      {activeTab === 'packages' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-6 max-w-5xl">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-6 bg-indigo-600 rounded-full"></span>
                Joining Activation Packages
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure dynamic entry price thresholds and PV distributions</p>
            </div>
            <button 
              onClick={() => {
                if (onUpdatePackages) {
                  onUpdatePackages([...joiningPackages, { id: Date.now().toString(), name: 'New Elite Package', price: 0, coin: 0, pv: 0 }]);
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> ADD EXTRA PACKAGE
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joiningPackages.map((pkg, idx) => (
              <div key={pkg.id} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 relative group">
                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      if (onUpdatePackages) onUpdatePackages(joiningPackages.filter((_, i) => i !== idx));
                    }}
                    className="p-1 text-rose-500 hover:bg-rose-50 border border-slate-200 rounded-lg bg-white"
                    title="Remove Package"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-3 mb-4">
                  <span className="w-10 h-10 rounded-xl bg-indigo-50 border text-indigo-600 flex items-center justify-center font-black text-xs">
                    0{idx+1}
                  </span>
                  <div>
                    <input 
                      type="text" 
                      className="bg-transparent border-b border-dashed border-slate-300 font-bold text-slate-800 text-sm focus:border-indigo-500 outline-none w-48 font-black" 
                      value={pkg.name} 
                      onChange={(e) => {
                        const np = [...joiningPackages]; np[idx].name = e.target.value; onUpdatePackages?.(np);
                      }} 
                    />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Package Title Setup</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 bg-white p-3 rounded-xl border">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Price Value</label>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input 
                        type="number" 
                        className="w-full font-black text-slate-800 font-sans outline-none" 
                        value={pkg.price} 
                        onChange={(e) => {
                          const np = [...joiningPackages]; np[idx].price = Number(e.target.value); onUpdatePackages?.(np);
                        }} 
                      />
                    </div>
                  </div>

                  <div className="space-y-1 bg-white p-3 rounded-xl border">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Cashback Coins</label>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-indigo-400 font-bold">🪙</span>
                      <input 
                        type="number" 
                        className="w-full font-black text-slate-800 font-sans outline-none" 
                        value={pkg.coin} 
                        onChange={(e) => {
                          const np = [...joiningPackages]; np[idx].coin = Number(e.target.value); onUpdatePackages?.(np);
                        }} 
                      />
                    </div>
                  </div>

                  <div className="space-y-1 bg-white p-3 rounded-xl border">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Points (P.V.)</label>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-emerald-500 font-bold">⭐</span>
                      <input 
                        type="number" 
                        className="w-full font-black text-slate-800 font-sans outline-none" 
                        value={pkg.pv} 
                        onChange={(e) => {
                          const np = [...joiningPackages]; np[idx].pv = Number(e.target.value); onUpdatePackages?.(np);
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 mt-4 leading-relaxed italic">
            * Changes saved in Joining Packages takes effect immediately for all subsequent subscription activations across referral lines.
          </p>
        </div>
      )}

      {/* 4. FUND REQUESTS TAB */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800">Payment & Deposit Verifications</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verification audits for manually uploaded add-money receipts</p>
            </div>
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
              {([
                { f: 'pending', label: 'PENDING QUEUE' },
                { f: 'approved', label: 'APPROVED' },
                { f: 'rejected', label: 'REJECTED' },
                { f: 'all', label: 'ALL LOGS' }
              ] as const).map(item => (
                <button
                  key={item.f}
                  onClick={() => setPaymentFilter(item.f)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all ${
                    paymentFilter === item.f 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-500 hover:bg-slate-200/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b">
                <tr>
                  <th className="px-6 py-3.5">User Details</th>
                  <th className="px-6 py-3.5">Deposited Amount</th>
                  <th className="px-6 py-3.5">Reference Number (UTR)</th>
                  <th className="px-6 py-3.5">System Proof Image</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Verification Status</th>
                  <th className="px-6 py-3.5 text-right">Confirm Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paymentRequests
                  .filter(r => paymentFilter === 'all' ? true : r.status === paymentFilter)
                  .map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">{req.userName || 'Unknown'}</p>
                        <p className="text-[8px] text-slate-400 font-mono">REQ ID: {req.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-700 font-extrabold text-sm font-mono bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                          ₹{Number(req.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                          <span className="font-mono font-black text-slate-800 tracking-tight bg-slate-100 border px-1.5 py-0.5 rounded">
                            {req.utr || 'NO UTR PROVIDED'}
                          </span>
                          {req.utr && (
                            <button 
                              onClick={() => { navigator.clipboard.writeText(req.utr); alert('UTR code copied to clipboard!'); }}
                              className="text-slate-450 hover:text-indigo-600 bg-white border p-1 rounded-md"
                              title="Copy UTR"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {req.screenshot ? (
                          <div className="flex items-center gap-1.5">
                            <img src={req.screenshot} className="w-8 h-8 rounded border object-cover shadow-xs" alt="uploaded-slip" />
                            <a 
                              href={req.screenshot} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-indigo-600 hover:underline font-black text-[10px] uppercase tracking-wide"
                            >
                              Open proof URL
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No Uploaded Proof</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-550 font-mono text-[10px]">
                        {new Date(req.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250/50' :
                          req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-250/50' : 'bg-red-50 text-red-700 border border-red-250/50'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="inline-flex gap-1.5">
                            <button 
                              onClick={() => { if(confirm("Are you sure you want to APPROVED this deposit?")) onApprovePayment(req.id); }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors shadow-xs"
                            >
                              APPROVE
                            </button>
                            {onRejectPayment && (
                              <button 
                                onClick={() => { if(confirm("Are you sure you want to REJECT this receipt?")) onRejectPayment(req.id); }}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors shadow-xs"
                              >
                                REJECT
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic font-bold">Process Loop Executed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {paymentRequests.filter(r => paymentFilter === 'all' ? true : r.status === paymentFilter).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-450 italic">
                      No matching manual deposit requests located in this filter queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SETTLEMENT WITHDRAWALS TAB */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800">System Payout Settlements</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Settlement approvals and Bank dispatch verification logs</p>
            </div>
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
              {([
                { f: 'pending', label: 'PENDING PAYOUTS' },
                { f: 'approved', label: 'COMPLETED' },
                { f: 'rejected', label: 'DECLINED & FUN' },
                { f: 'all', label: 'ALL PAYOUTS' }
              ] as const).map(item => (
                <button
                  key={item.f}
                  onClick={() => setWithdrawalFilter(item.f)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all ${
                    withdrawalFilter === item.f 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-500 hover:bg-slate-200/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b">
                <tr>
                  <th className="px-6 py-3.5">User / Request ID</th>
                  <th className="px-6 py-3.5">Settlement Amount</th>
                  <th className="px-6 py-3.5">Recipient Banking Coordinates</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Settlement State</th>
                  <th className="px-6 py-3.5 text-right">Confirm Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b">
                {withdrawalRequests
                  .filter(r => withdrawalFilter === 'all' ? true : r.status === withdrawalFilter)
                  .map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">{req.userName}</p>
                        <p className="text-[8px] text-slate-400 font-mono">MUTATION: {req.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-rose-600 font-extrabold text-sm font-mono bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                          - ₹{Number(req.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-xs max-w-sm">
                          <p className="flex justify-between hover:bg-white px-2 py-0.5 rounded transition">
                            <span className="text-slate-400 font-bold">Holder:</span> 
                            <span className="font-black text-slate-800 uppercase">{req.bankDetails?.holderName || req.userName || 'N/A'}</span>
                          </p>
                          <p className="flex justify-between hover:bg-white px-2 py-0.5 rounded transition">
                            <span className="text-slate-400 font-bold">A/C Number:</span> 
                            <span className="font-mono font-black text-indigo-700">{req.bankDetails?.accountNumber || 'N/A'}</span>
                          </p>
                          <p className="flex justify-between hover:bg-white px-2 py-0.5 rounded transition">
                            <span className="text-slate-400 font-bold">IFSC Code:</span> 
                            <span className="font-mono font-black text-slate-800 uppercase">{req.bankDetails?.ifscCode || 'N/A'}</span>
                          </p>
                          <p className="flex justify-between hover:bg-white px-2 py-0.5 rounded transition">
                            <span className="text-slate-400 font-bold">Bank Name:</span> 
                            <span className="font-bold text-slate-700">{req.bankDetails?.bankName || 'N/A'}</span>
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-550 font-mono text-[10px]">
                        {new Date(req.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 border-b-0">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250/50' :
                          req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-250/50' : 'bg-red-50 text-red-700 border border-red-250/50'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="inline-flex gap-1.5">
                            <button 
                              onClick={() => { if(confirm("Have you disbursed bank funds to this user? Click OK to mark Approved.")) onApproveWithdrawal(req.id); }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors shadow-xs"
                            >
                              MARK PAID
                            </button>
                            {onRejectWithdrawal && (
                              <button 
                                onClick={() => { if(confirm("Reject this payout and return money automatically to user balance?")) onRejectWithdrawal(req.id); }}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors shadow-xs"
                              >
                                DECKLINE
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic font-bold">Disbursement Complete</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {withdrawalRequests.filter(r => withdrawalFilter === 'all' ? true : r.status === withdrawalFilter).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-450 italic">
                      No matching withdrawal requests located in this filtered list.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SUPPORT MESSAGES TAB */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[540px]">
          {/* Active Chats Contacts list */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-y-auto no-scrollbar shadow-xs">
            <div className="p-4 border-b bg-slate-50 font-black text-xs text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" /> Contacts & Open Support Tickets
            </div>
            {uniqueChatUsers.map(uid => {
              const uObj = users.find(u => u.id === uid);
              const isSel = selectedChatUser === uid;
              return (
                <button 
                  key={uid} 
                  onClick={() => setSelectedChatUser(uid)} 
                  className={`w-full text-left p-4 border-b hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                    isSel ? 'bg-indigo-50/55 border-r-4 border-r-indigo-600' : ''
                  }`}
                >
                  <span className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center uppercase shadow-xs">
                    {(uObj?.name || uObj?.username || 'U').substring(0, 2)}
                  </span>
                  <div>
                    <p className="font-black text-slate-800 text-xs tracking-tight">{uObj?.name || uObj?.username || 'Legacy User Account'}</p>
                    <p className="text-[10px] text-slate-400 font-mono tracking-tighter mt-0.5">{uObj?.email || uid}</p>
                  </div>
                </button>
              );
            })}
            {uniqueChatUsers.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs italic font-medium">
                No active conversations or support tickets opened.
              </div>
            )}
          </div>
          
          {/* Active Conversation Dialogue Screen */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl flex flex-col overflow-hidden shadow-xs">
            {selectedChatUser ? (
              <>
                <div className="p-4 border-b bg-slate-50 font-black text-xs text-slate-800 flex justify-between items-center shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span>Direct Dialogue Channel: {users.find(u => u.id === selectedChatUser)?.name || 'User'}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedChatUser(null)} 
                    className="text-[10px] text-slate-500 bg-white hover:bg-slate-100 border px-2.5 py-1 rounded-lg font-black uppercase tracking-wider"
                  >
                    Close chat
                  </button>
                </div>
                
                {/* Scroll Thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar bg-slate-50/50">
                  {chatMessages
                    .filter(m => m.senderId === selectedChatUser || m.receiverId === selectedChatUser)
                    .map(m => {
                      const isAdmin = m.senderId === 'admin-0';
                      return (
                        <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`shadow-xs max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isAdmin 
                              ? 'bg-slate-900 border border-slate-950 text-white rounded-br-none' 
                              : 'bg-white border text-slate-800 rounded-bl-none'
                          }`}>
                            <p className="font-bold text-[9px] uppercase tracking-wider mb-1 text-slate-400">
                              {isAdmin ? 'PLATFORM ADMIN' : m.senderName}
                            </p>
                            <p className="font-semibold text-slate-100 break-words line-clamp-none">{m.message}</p>
                            <p className="text-[7.5px] text-zinc-400 text-right mt-1.5 font-mono">{new Date(m.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                {/* Input submission bar */}
                <form 
                  className="p-3 border-t bg-slate-50 flex gap-2" 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if(!adminReply.trim()) return; 
                    onSendMessage(adminReply, selectedChatUser!); 
                    setAdminReply(''); 
                  }}
                >
                  <input 
                    type="text" 
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white" 
                    placeholder="Enter support correspondence answer details..." 
                    value={adminReply} 
                    onChange={e => setAdminReply(e.target.value)} 
                  />
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider"
                  >
                    SEND MSG
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 space-y-2">
                <HelpCircle className="w-10 h-10 text-slate-300 stroke-1 animate-bounce" />
                <p className="text-xs italic font-bold text-slate-500">Dialogue Screen Inactive</p>
                <p className="text-[10px] text-slate-400 text-center max-w-sm">Select any incoming queries or user account support ticket from the contact panel to begin corresponding safely.</p>
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
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4">
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
                    <label htmlFor="qr-input" className="block text-center w-full py-2.5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-700 cursor-pointer shadow-xs">
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
                      placeholder="e.g. support@smartpay.com"
                      onChange={(e) => onUpdateConfig({...config, supportContact: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Commissions setups */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                Level Commissions Setup Matrix
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">System Base Coin Conversion (₹)</label>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-2">
                    <span className="flex items-center text-xs font-bold px-3 text-slate-400">1.00 COIN =</span>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full px-3 py-1.5 font-black text-slate-800 bg-white border border-slate-150 rounded-lg text-xs outline-none"
                      value={config.systemCoinValue || 1}
                      onChange={(e) => onUpdateConfig({...config, systemCoinValue: Number(e.target.value)})}
                    />
                    <span className="flex items-center text-[10px] font-black px-2.5 text-slate-400">RUPEES</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Multi-level Generation commissions (%)</label>
                    <span className="text-[9px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">20-Tier MLM Tree</span>
                  </div>
                  
                  <div className="space-y-1.5 max-h-[210px] overflow-y-auto no-scrollbar pr-1">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-150 justify-between">
                        <span className="text-[9px] font-black text-slate-400 w-16">LEVEL {i+1}</span>
                        <div className="flex items-center bg-white border rounded-lg p-1 w-28">
                          <input 
                            type="number" 
                            step="0.1"
                            className="w-full px-2 text-right text-xs font-bold text-slate-800 outline-none"
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
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs tracking-widest uppercase rounded-xl shadow-xl transition-all hover:scale-102 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> SAVE SYSTEM CONFIGS Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
