
import React, { useState } from 'react';
import { User, Transaction, MLMConfig, UserRole, PaymentRequest, WithdrawalRequest, ChatMessage, Product, Package } from '../types';
import { TrendingUp, Users, Wallet, ShieldCheck, MessageSquare, Settings, CheckCircle2, XCircle, Clock, Search, Filter, FileText, Gift, Award, Check, Trash2, Landmark, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../services/utils';

interface AdminProps {
  users: User[];
  transactions: Transaction[];
  config: MLMConfig;
  onUpdateConfig: (c: MLMConfig) => void;
  products: Product[];
  onAddProduct?: (p: Product) => void;
  paymentRequests: PaymentRequest[];
  onApprovePayment: (id: string) => void;
  withdrawalRequests: WithdrawalRequest[];
  onApproveWithdrawal: (id: string) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (msg: string, receiverId: string) => void;
  onApproveKYC?: (userId: string, status: 'approved' | 'rejected') => void;
  onApproveReward?: (userId: string, rewardId: string) => void;
  onToggleUserRole?: (userId: string) => void;
  onSwitchTab?: (tab: string) => void;
  packages?: Package[];
  onCreatePackage?: (name: string, price: number, pv: number, coin: number, coinUsablePercent: number) => void;
  onDeletePackage?: (id: string) => void;
}

const AdminPanel: React.FC<AdminProps> = ({ 
  users, transactions, config, onUpdateConfig, products, onAddProduct, paymentRequests, 
  onApprovePayment, withdrawalRequests, onApproveWithdrawal,
  chatMessages, onSendMessage, onApproveKYC, onApproveReward, onToggleUserRole,
  onSwitchTab, packages = [], onCreatePackage, onDeletePackage
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'members' | 'kyc' | 'payments' | 'withdrawals' | 'rewards' | 'support' | 'products' | 'config' | 'packages'>('stats');
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [rateTab, setRateTab] = useState<'rupee' | 'coin'>('rupee');

  // Manage members states
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'USER' | 'ADMIN' | 'VENDOR'>('all');

  // Add product form states
  const [newProdName, setNewProdName] = useState('');
  const [newProdMrp, setNewProdMrp] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCat, setNewProdCat] = useState('Electronics');
  const [newProdMlmPoints, setNewProdMlmPoints] = useState('');
  const [newProdIcon, setNewProdIcon] = useState('📱');

  // Package creation inputs
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgPV, setPkgPV] = useState('');
  const [pkgCoin, setPkgCoin] = useState('');
  const [pkgCoinUsable, setPkgCoinUsable] = useState('10');

  const handleCreatePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName || !pkgPrice || !pkgPV || !pkgCoin || !pkgCoinUsable) {
      alert('Kindly fill in all package fields: Name, Price, PV, Coins and Coin % Limit!');
      return;
    }
    if (onCreatePackage) {
      onCreatePackage(pkgName, parseFloat(pkgPrice), parseFloat(pkgPV), parseFloat(pkgCoin), parseFloat(pkgCoinUsable));
      setPkgName('');
      setPkgPrice('');
      setPkgPV('');
      setPkgCoin('');
      setPkgCoinUsable('10');
    }
  };

  const totalVolume = transactions.reduce((a, b) => a + Math.abs(b.amount), 0);
  const activeUsers = users.filter(u => u.isActivated).length;

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateConfig({ ...config, qrCode: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateConfig({ ...config, customLogo: reader.result as string });
        alert('Platform custom logo uploaded and updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoReset = () => {
    onUpdateConfig({ ...config, customLogo: undefined });
    alert('Platform custom logo reset to default SVG logo.');
  };

  const DEFAULT_LEVEL_PERCENTAGES = [
    0.15, 0.08, 0.05, 0.03, 0.02, 0.02, 0.01, 0.01, 0.01, 0.01,
    0.005, 0.005, 0.005, 0.005, 0.005, 0.002, 0.002, 0.002, 0.002, 0.002
  ];

  const handleUpdateLevelRupeeRate = (index: number, val: number) => {
    const current = [...(config.levelRupeeRates || DEFAULT_LEVEL_PERCENTAGES)];
    current[index] = parseFloat((val / 100).toFixed(5));
    onUpdateConfig({ ...config, levelRupeeRates: current });
  };

  const handleUpdateLevelCoinRate = (index: number, val: number) => {
    const current = [...(config.levelCoinRates || DEFAULT_LEVEL_PERCENTAGES)];
    current[index] = parseFloat((val / 100).toFixed(5));
    onUpdateConfig({ ...config, levelCoinRates: current });
  };

  const applyPresetRupee = (type: 'default' | 'flat1' | 'flat2') => {
    let preset: number[] = [];
    if (type === 'default') {
      preset = [...DEFAULT_LEVEL_PERCENTAGES];
    } else if (type === 'flat1') {
      preset = Array(20).fill(0.01);
    } else {
      preset = Array(20).fill(0.02);
    }
    onUpdateConfig({ ...config, levelRupeeRates: preset });
    alert('💰 Rupee Level Rates preset applied successfully!');
  };

  const applyPresetCoin = (type: 'default' | 'flat1' | 'flat2') => {
    let preset: number[] = [];
    if (type === 'default') {
      preset = [...DEFAULT_LEVEL_PERCENTAGES];
    } else if (type === 'flat1') {
      preset = Array(20).fill(0.01);
    } else {
      preset = Array(20).fill(0.02);
    }
    onUpdateConfig({ ...config, levelCoinRates: preset });
    alert('🪙 Coin Level Rates preset applied successfully!');
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdMlmPoints) return alert('Provide required product parameters.');
    if (onAddProduct) {
      onAddProduct({
        id: 'prod_' + Date.now(),
        name: newProdName,
        mrp: parseFloat(newProdMrp) || parseFloat(newProdPrice) * 1.2,
        price: parseFloat(newProdPrice),
        description: newProdDesc || 'Brand new item',
        category: newProdCat as any,
        mlmPoints: parseFloat(newProdMlmPoints),
        image: newProdIcon,
        stock: 100,
        vendorId: 'admin',
        vendorName: 'SMARTPAY CENTRAL'
      });
      // reset
      setNewProdName('');
      setNewProdMrp('');
      setNewProdPrice('');
      setNewProdDesc('');
      setNewProdCat('Electronics');
      setNewProdMlmPoints('');
      setNewProdIcon('📱');
      alert('Product published to user shop catalog.');
    }
  };

  const uniqueChatUsers = Array.from(new Set(chatMessages.map(m => m.senderId === 'admin' ? m.receiverId : m.senderId))).filter(id => id !== 'admin');

  return (
    <div className="space-y-8 text-left relative bg-white min-h-screen p-1 text-black">
      {/* Decorative 3D Blue Accented Bar */}
      <div className="h-2 w-full rounded-full flex overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div className="w-[30%] h-full bg-blue-700"></div>
        <div className="w-[30%] h-full bg-blue-500"></div>
        <div className="w-[20%] h-full bg-emerald-600"></div>
        <div className="w-[20%] h-full bg-red-600"></div>
      </div>
      
      {/* Admin Header with 3D elements - White and Blue theme */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-8 rounded-[2.5rem] border-2 border-blue-400 shadow-xl relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-6 text-white">
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-white/15 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 bg-red-600/30 border border-red-500/40 rounded-full text-[9px] font-black uppercase tracking-widest text-[#FFDFDF] flex items-center gap-1.5 w-max shadow-inner leading-none font-mono">
              🛡️ Centralized Control Node
            </span>
            {onSwitchTab && (
              <button
                onClick={() => onSwitchTab('home')}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-white border border-white/40 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:shadow-md"
                title="Switch to user view mode"
              >
                🔄 Switch to User Dashboard Mode
              </button>
            )}
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mt-3">Admin Console Area</h2>
          <p className="text-[10px] text-blue-150 font-bold uppercase tracking-widest mt-1.5">Super App Platform Ledger Controls & System Audits</p>
        </div>
        
        <nav className="flex gap-1.5 bg-blue-950/90 p-2 rounded-2xl border border-blue-400 shadow-inner overflow-x-auto no-scrollbar relative z-10">
          {[
            { id: 'stats', icon: TrendingUp, label: 'Stats' },
            { id: 'members', icon: Users, label: 'Members' },
            { id: 'kyc', icon: FileText, label: 'Audit KYC' },
            { id: 'payments', icon: Wallet, label: 'Loads' },
            { id: 'withdrawals', icon: Landmark, label: 'Payouts' },
            { id: 'rewards', icon: Award, label: 'Bounties' },
            { id: 'products', icon: Smartphone, label: 'Shop List' },
            { id: 'packages', icon: Gift, label: 'Packages' },
            { id: 'support', icon: MessageSquare, label: 'Inbox' },
            { id: 'config', icon: Settings, label: 'Matrix' },
          ].map(t => (
            <button 
              key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest cursor-pointer border",
                activeTab === t.id 
                  ? 'bg-white text-blue-900 border-white shadow-md font-black' 
                  : 'text-slate-300 hover:text-white hover:bg-white/10 border-transparent'
              )}
            >
              {React.createElement(t.icon, { size: 12 })}
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { l: 'Platform Fee (5%)', v: `₹${(totalVolume * 0.05).toFixed(2)}`, c: 'text-black', i: TrendingUp, bg: 'bg-blue-50 border-blue-300 text-blue-700' },
              { l: 'Transaction Volume', v: `₹${totalVolume.toFixed(2)}`, c: 'text-black font-black', i: Wallet, bg: 'bg-blue-100 border-blue-300 text-blue-800' },
              { l: 'Total Active Franchise', v: activeUsers.toString() + ' Members', c: 'text-emerald-800 font-extrabold', i: Users, bg: 'bg-green-50 border-emerald-300 text-emerald-800' },
              { l: 'Pending Bank Settlements', v: withdrawalRequests.filter(r => r.status === 'pending').length.toString() + ' Payouts', c: 'text-red-700 font-extrabold', i: Clock, bg: 'bg-red-50 border-red-300 text-red-700' },
            ].map(s => (
              <div key={s.l} className="bg-white p-8 rounded-[2rem] shadow-md border-2 border-blue-100 flex flex-col justify-between transition-all duration-300 hover:scale-102">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border-2", s.bg)}>
                  <s.i size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-black uppercase tracking-widest leading-none mb-2">{s.l}</p>
                  <p className={`text-2xl font-black tracking-tight ${s.c}`}>{s.v}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[2.5rem] border-2 border-blue-100 shadow-[0_10px_30px_rgba(0,119,192,0.03)] overflow-hidden">
            <div className="p-6 border-b-2 border-blue-50 bg-blue-50/50 flex items-center justify-between">
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Platform Activity Ledger Log</h3>
              <button className="text-[10px] font-black text-blue-700 hover:text-blue-800 uppercase tracking-widest hover:underline transition-colors">Download report.csv</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-black">
                <thead className="bg-blue-50 text-blue-900 font-extrabold text-[10px] uppercase tracking-widest border-b-2 border-blue-100">
                  <tr>
                    <th className="px-8 py-4">TX REF ID</th>
                    <th className="px-8 py-4">Legal Member</th>
                    <th className="px-8 py-4">Audit Action</th>
                    <th className="px-8 py-4">Total Amount</th>
                    <th className="px-8 py-4">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-blue-50">
                  {transactions.slice(0, 10).map(tx => (
                    <tr key={tx.id} className="hover:bg-blue-50/20 transition-all">
                      <td className="px-8 py-4 font-mono text-[10px] text-black font-bold">#{tx.id.toUpperCase()}</td>
                      <td className="px-8 py-4 font-black text-black">{users.find(u => u.id === tx.userId)?.name || 'Central Ledger'}</td>
                      <td className="px-8 py-4">
                        <span className="px-3 py-1 bg-blue-50 text-blue-900 rounded-full text-[10px] font-black uppercase tracking-tighter border border-blue-200">{tx.type}</span>
                      </td>
                      <td className={cn("px-8 py-4 font-black text-base", tx.amount > 0 ? 'text-emerald-800' : 'text-red-700')}>
                        {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="px-8 py-4">
                        <span className="flex items-center gap-1 text-emerald-800 font-black text-[10px] uppercase">
                          <CheckCircle2 size={12} className="text-emerald-700" /> VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

              {/* Manage Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-black uppercase tracking-wide">Manage Franchise Members</h3>
              <p className="text-xs text-blue-900 font-bold uppercase tracking-widest mt-1.5">Audit profiles, verify activations and toggle administrative access roles</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-700" />
                <input 
                  type="text" 
                  placeholder="Query Name, Email, ID..." 
                  className="pl-10 pr-4 py-3 bg-white border-2 border-blue-150 rounded-2xl text-xs font-black w-56 focus:outline-none focus:border-blue-600 text-black placeholder-neutral-505"
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                />
              </div>
              <select 
                className="px-4 py-3 bg-white border-2 border-blue-150 rounded-2xl text-xs font-black uppercase text-blue-900 focus:outline-none font-sans"
                value={memberRoleFilter}
                onChange={e => setMemberRoleFilter(e.target.value as any)}
              >
                <option value="all">ANY ROLE</option>
                <option value="USER">ROLE: USER</option>
                <option value="ADMIN">ROLE: ADMIN</option>
                <option value="VENDOR">ROLE: VENDOR</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border-2 border-blue-100 shadow-[0_10px_30px_rgba(0,119,192,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-black">
                <thead className="bg-blue-50 text-blue-900 font-black text-[10px] uppercase tracking-widest border-b-2 border-blue-100">
                  <tr>
                    <th className="px-8 py-4">Node Profile</th>
                    <th className="px-8 py-4">UPI & Contact info</th>
                    <th className="px-8 py-4 text-center">Status</th>
                    <th className="px-8 py-4">Total Earnings</th>
                    <th className="px-8 py-4 text-right">Access Controls & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {users
                    .filter(u => {
                      const q = memberSearch.toLowerCase().trim();
                      const matchQuery = q ? (
                        u.name.toLowerCase().includes(q) ||
                        u.email.toLowerCase().includes(q) ||
                        u.id.toLowerCase().includes(q) ||
                        (u.phone && u.phone.includes(q))
                      ) : true;
                      
                      const matchRole = memberRoleFilter === 'all' ? true : u.role === memberRoleFilter;
                      return matchQuery && matchRole;
                    })
                    .map(u => (
                      <tr key={u.id} className="hover:bg-blue-50/20 transition-all">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center border-2 border-blue-200 uppercase shrink-0">
                              {u.name ? u.name[0] : 'U'}
                            </div>
                            <div>
                              <p className="font-extrabold text-black text-[13px] tracking-tight">{u.name}</p>
                              <p className="text-[10px] font-mono text-neutral-605 select-all">Email: {u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-xs font-black text-black">{u.phone || 'No phone'}</p>
                          <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mt-0.5">UPI: {u.bankDetails?.upiId || 'Not linked'}</p>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            {u.isActivated ? (
                              <span className="px-3 py-1 bg-green-50 text-emerald-800 border-2 border-emerald-205 text-[9px] font-black rounded-full uppercase tracking-widest leading-none">
                                Activated
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-red-50 text-red-650 border-2 border-red-200 text-[9px] font-black rounded-full uppercase tracking-widest leading-none">
                                Pending
                              </span>
                            )}
                            <span className="text-[9px] font-black text-black uppercase tracking-widest mt-1.5 leading-none">Level {u.level}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-xs font-black text-black">₹{(u.totalEarned || 0).toFixed(2)}</p>
                          <p className="text-[8px] font-black text-blue-700 uppercase tracking-tighter mt-0.5">Main: ₹{u.wallets?.main.toFixed(2)}</p>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="inline-flex gap-2 items-center">
                            <div className="flex flex-col items-end mr-2">
                              <span className={cn(
                                "px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-lg border-2",
                                u.role === UserRole.ADMIN ? "bg-purple-100 text-purple-750 border-purple-200" :
                                u.role === UserRole.VENDOR ? "bg-blue-105 text-blue-700 border-blue-200" :
                                "bg-slate-100 text-slate-800 border-slate-200"
                              )}>
                                {u.role}
                              </span>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                if (onToggleUserRole) {
                                  onToggleUserRole(u.id);
                                }
                              }}
                              className={cn(
                                "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:shadow active:scale-95 border-2",
                                u.role === UserRole.ADMIN 
                                  ? "bg-amber-100 border-amber-300 text-amber-900" 
                                  : "bg-blue-700 text-white hover:bg-blue-800 border-transparent shadow-md"
                              )}
                            >
                              {u.role === UserRole.ADMIN ? "Demote user" : "Make Admin"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-black text-xs font-black uppercase tracking-widest">
                        No franchise users loaded or matched query
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* KYC Auditing Tab */}
      {activeTab === 'kyc' && (
        <div className="space-y-6 text-black bg-white">
          <div className="text-center max-w-sm mx-auto mb-4">
            <h3 className="text-xl font-black text-black uppercase tracking-wide">KYC Verification Inbox</h3>
            <p className="text-xs text-blue-900 font-bold uppercase tracking-widest mt-1">Audit merchant legal identity and credentials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {users.filter(u => u.kycDetails && u.kycDetails.status === 'pending').map(kUser => (
              <div key={kUser.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-blue-150 shadow-sm space-y-4">
                <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 text-[8px] font-black rounded-full uppercase tracking-widest">PENDING VERIFICATION</span>
                <div>
                  <p className="font-black text-black text-sm">{kUser.name}</p>
                  <p className="text-[10px] text-blue-900 font-black">UID: {kUser.id}</p>
                </div>
                <div className="space-y-2 p-4 bg-blue-50/50 rounded-2xl text-xs font-black border border-blue-100">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Aadhaar:</span>
                    <span className="font-mono text-black">{kUser.kycDetails?.aadhaarNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">PAN Card:</span>
                    <span className="font-mono text-black uppercase">{kUser.kycDetails?.panNumber}</span>
                  </div>
                  {kUser.kycDetails?.gstNumber && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">GST Registration:</span>
                      <span className="font-mono text-black uppercase">{kUser.kycDetails?.gstNumber}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => onApproveKYC && onApproveKYC(kUser.id, 'approved')} className="flex-1 py-3 bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-emerald-800 cursor-pointer">Approve</button>
                  <button onClick={() => onApproveKYC && onApproveKYC(kUser.id, 'rejected')} className="flex-1 py-3 bg-red-50 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-250 hover:bg-red-100 cursor-pointer">Reject</button>
                </div>
              </div>
            ))}
            {users.filter(u => u.kycDetails && u.kycDetails.status === 'pending').length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-blue-150">
                <FileText size={48} className="text-blue-200 mx-auto mb-4" />
                <p className="text-blue-905 text-xs font-black uppercase tracking-widest">No pending KYC files awaiting verification</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Load cash deposits approvals */}
      {activeTab === 'payments' && (
        <div className="space-y-6 text-black bg-white">
          <div className="text-center max-w-md mx-auto mb-8">
            <h3 className="text-xl font-black text-black tracking-tight">CASH INFLOW LEDGER APPROVALS</h3>
            <p className="text-xs text-blue-900 font-bold uppercase tracking-widest mt-1">Verify payment references and screen captures</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentRequests.filter(r => r.status === 'pending').map(req => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={req.id} 
                className="bg-white rounded-[2.5rem] border-2 border-blue-150 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="h-48 bg-blue-50 relative group flex items-center justify-center border-b border-blue-150">
                  {req.screenshot ? (
                    <>
                      <img src={req.screenshot} alt="Proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-blue-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => window.open(req.screenshot, '_blank')} className="bg-white text-blue-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 cursor-pointer">View Full Proof</button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-1">
                      <p className="text-neutral-500 font-extrabold text-[11px] uppercase tracking-wider">No Screenshot Uploaded</p>
                      <p className="text-neutral-400 font-bold text-[9px] uppercase tracking-wider">वैकल्पिक (Optional UTR Verification)</p>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-lg font-black text-emerald-800 font-mono">₹{req.amount}</p>
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Load Value</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-black">{req.userName}</p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Member Name</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <p className="text-[9px] font-black text-blue-900 uppercase tracking-widest mb-1">UPI TX REFERENCE UTR</p>
                    <p className="text-xs font-mono font-black text-black tracking-wider truncate">{req.utr}</p>
                  </div>
                  <div className="mt-auto pt-4 flex gap-2">
                    <button onClick={() => onApprovePayment(req.id)} className="flex-1 py-3 bg-blue-700 text-white text-[10px] font-black rounded-xl hover:bg-blue-800 transition-all uppercase tracking-widest cursor-pointer shadow-md">Approve Load</button>
                    <button className="px-4 py-3 bg-red-50 text-red-700 text-[10px] font-black rounded-xl border border-red-200 hover:bg-red-100 transition-all uppercase tracking-widest cursor-pointer">Decline</button>
                  </div>
                </div>
              </motion.div>
            ))}
            {paymentRequests.filter(r => r.status === 'pending').length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-blue-150">
                <CheckCircle2 size={48} className="text-emerald-700 mx-auto mb-4" />
                <p className="text-emerald-800 text-xs font-black uppercase tracking-widest">All ledger loads fully credited</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payout settlements tab */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-[2.5rem] border-2 border-blue-105 shadow-sm overflow-hidden text-black">
          <div className="p-8 border-b-2 border-blue-55 bg-blue-50/50 flex items-center justify-between">
             <div>
              <h3 className="text-lg font-black text-blue-900 tracking-tight">Active Bank Settlements</h3>
              <p className="text-[10px] text-blue-805 font-bold uppercase tracking-widest mt-1">Settle commission wallet requesting members</p>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-black">
              <thead className="bg-blue-50 text-blue-900 font-black text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Verified User</th>
                  <th className="px-8 py-5">Settlement Out</th>
                  <th className="px-8 py-5">Settlement Bank Credentials</th>
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5 text-right">Approve Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {withdrawalRequests.filter(r => r.status === 'pending').map(req => (
                  <tr key={req.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-extrabold text-black">{req.userName}</p>
                      <p className="text-[10px] text-neutral-500 font-bold">UID: {req.userId}</p>
                    </td>
                    <td className="px-8 py-5 font-black text-red-700 text-base">
                      ₹{req.amount}
                    </td>
                    <td className="px-8 py-5 text-black">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-blue-900 uppercase tracking-tight">{req.bankDetails?.bankName}</p>
                        <p className="text-[11px] font-mono font-bold text-black">{req.bankDetails?.accountNumber}</p>
                        <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">IFSC: {req.bankDetails?.ifscCode}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[10px] font-black text-black">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => onApproveWithdrawal(req.id)} 
                        className="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-850 transition-all cursor-pointer shadow-md font-sans"
                      >
                        Settle & Close Ledger
                      </button>
                    </td>
                  </tr>
                ))}
                {withdrawalRequests.filter(r => r.status === 'pending').length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
                        <Clock className="text-blue-700" size={32} />
                      </div>
                      <p className="text-blue-900 text-xs font-black uppercase tracking-widest">No pending payouts found in settlement queue</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rewards Approvals / Dispatches Bounties tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-6 text-left text-black bg-white">
          <div className="text-center max-w-sm mx-auto mb-4">
            <h3 className="text-xl font-black text-black uppercase tracking-wide">Achievers Claims Dispatch</h3>
            <p className="text-xs text-blue-900 font-bold uppercase tracking-widest mt-1">Review downlines targets and dispatch incentives</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {users.filter(u => u.rewards && u.rewards.some(r => r.status === 'claimed')).map(valUser => (
              <div key={valUser.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-blue-150 shadow-sm space-y-4">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-900 text-[8px] font-black rounded-full uppercase tracking-widest border border-blue-200">CLAIM REQUEST FILED</span>
                <div>
                  <p className="font-black text-black text-sm">{valUser.name}</p>
                  <p className="text-[10px] text-neutral-500 font-bold">Total Matrix: {users.filter(m => m.referrerId === valUser.id).length} direct nodes</p>
                </div>
                
                <div className="space-y-3">
                  {valUser.rewards?.filter(r => r.status === 'claimed').map(claim => (
                    <div key={claim.id} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{claim.image}</span>
                        <div>
                          <p className="text-xs font-black text-black uppercase">{claim.name}</p>
                          <p className="text-[9px] text-neutral-500 font-bold">Target reached</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onApproveReward && onApproveReward(valUser.id, claim.id)}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-[9px] font-black uppercase rounded-lg shadow-md cursor-pointer transition-all"
                      >
                        Approve Dispatch
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {users.filter(u => u.rewards && u.rewards.some(r => r.status === 'claimed')).length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-blue-150">
                <Award size={48} className="text-blue-100 mx-auto mb-4" />
                <p className="text-blue-900 text-xs font-black uppercase tracking-widest font-sans">No active reward claims logged</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product administration list */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-black bg-white">
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-100/80 shadow-sm">
            <h3 className="text-lg font-black text-black mb-6 flex items-center gap-2">
              <Smartphone className="text-blue-700" size={18} /> Publish Central Product
            </h3>
            <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs font-black">
              <div>
                <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest pl-1 mb-1">Item Title</label>
                <input type="text" placeholder="Title" className="w-full px-4 py-3 bg-blue-50/40 border rounded-xl text-black" value={newProdName} onChange={e => setNewProdName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest pl-1 mb-1">Price (₹)</label>
                  <input type="number" placeholder="₹" className="w-full px-4 py-3 bg-blue-50/40 border rounded-xl text-black font-semibold" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest pl-1 mb-1">MRP Value (₹)</label>
                  <input type="number" placeholder="₹" className="w-full px-4 py-3 bg-blue-50/40 border rounded-xl text-black font-semibold" value={newProdMrp} onChange={e => setNewProdMrp(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest pl-1 mb-1">BV Points Value</label>
                <input type="number" placeholder="Points" className="w-full px-4 py-3 bg-blue-50/40 border rounded-xl text-black font-semibold" value={newProdMlmPoints} onChange={e => setNewProdMlmPoints(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest pl-1 mb-1">Central Category Filter</label>
                <select className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl font-bold text-black" value={newProdCat} onChange={e => setNewProdCat(e.target.value)}>
                  {['Electronics', 'Mobile', 'Fashion', 'Grocery', 'Healthcare', 'Home Appliances', 'Beauty', 'Books'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest pl-1 mb-1">Display Emoji Icon</label>
                <select className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl font-bold text-black" value={newProdIcon} onChange={e => setNewProdIcon(e.target.value)}>
                  {['📱', '💻', '👞', '🍿', '🧪', '❄️', '💈', '📄', '📦'].map(ic => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest pl-1 mb-1">Short Description</label>
                <textarea rows={3} placeholder="Describe item spec, refund and delivery info..." className="w-full px-4 py-3 bg-blue-50/40 border rounded-xl text-black font-semibold" value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} />
              </div>
              <button type="submit" className="w-full py-3.5 bg-blue-700 text-white rounded-xl uppercase tracking-wider text-[10px] font-black hover:bg-blue-800 transition-all cursor-pointer shadow-md">Publish Product Item</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border-2 border-blue-100/80 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-900 mb-6">Active Catalog Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(p => (
                <div key={p.id} className="p-4 bg-blue-50/50 rounded-2xl border-2 border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.image}</span>
                    <div>
                      <p className="font-extrabold text-blue-950">{p.name}</p>
                      <p className="text-[10px] text-neutral-500 font-bold">{p.category} • ₹{p.price}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-900 text-[10px] font-black rounded border border-blue-200">{p.mlmPoints} BV</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Support Conversation Hub */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px] text-black bg-white">
          <div className="bg-white border-2 border-blue-150 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
            <div className="p-6 border-b-2 border-blue-50 bg-blue-50/50">
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Active Support Live Queues</h3>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-blue-50">
               {uniqueChatUsers.map(uid => {
                const chatUser = users.find(u => u.id === uid);
                const lastMsg = chatMessages.filter(m => m.senderId === uid || m.receiverId === uid).slice(-1)[0];
                return (
                  <button 
                    key={uid} 
                    onClick={() => setSelectedChatUser(uid)} 
                    className={cn(
                      "w-full text-left p-6 hover:bg-blue-50/50 transition-all flex items-center gap-4 cursor-pointer",
                      selectedChatUser === uid ? 'bg-blue-50 border-r-4 border-blue-700' : ''
                    )}
                  >
                    <div className="w-12 h-12 bg-blue-105 border border-blue-200 rounded-2xl flex items-center justify-center font-black text-blue-900 text-sm uppercase">
                      {chatUser?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="font-black text-sm text-black truncate">{chatUser?.name || 'Franchise Member'}</p>
                       <p className="text-[10px] text-neutral-500 font-bold truncate uppercase tracking-tight">{lastMsg?.message || 'Empty thread'}</p>
                    </div>
                  </button>
                );
              })}
              {uniqueChatUsers.length === 0 && (
                <div className="p-12 text-center opacity-75">
                  <MessageSquare size={32} className="mx-auto mb-3 text-blue-300" />
                  <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-none">All tickets closed</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-white border-2 border-blue-150 rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm">
            {selectedChatUser ? (
              <>
                <div className="p-6 border-b-2 border-blue-50 bg-blue-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-700 rounded-2xl flex items-center justify-center text-white font-black text-xs uppercase shadow-sm">
                      {users.find(u => u.id === selectedChatUser)?.name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-black">{users.find(u => u.id === selectedChatUser)?.name}</h4>
                      <p className="text-[9px] text-[#0077C0] font-bold uppercase tracking-widest">{users.find(u => u.id === selectedChatUser)?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-blue-50/10">
                   {chatMessages.filter(m => m.senderId === selectedChatUser || m.receiverId === selectedChatUser).map(m => (
                     <div key={m.id} className={cn("flex flex-col", m.senderId === 'admin' ? "items-end" : "items-start")}>
                        <div className={cn(
                          "max-w-[80%] p-4 rounded-3xl text-xs font-black shadow-sm",
                          m.senderId === 'admin' ? "bg-blue-700 text-white rounded-tr-none" : "bg-neutral-100 text-black rounded-tl-none border-2 border-neutral-200"
                        )}>
                           {m.message}
                        </div>
                        <span className="text-[8px] font-black text-neutral-500 uppercase mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                </div>
                <div className="p-4 bg-white border-t-2 border-blue-50">
                  <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if(!adminReply.trim()) return; onSendMessage(adminReply, selectedChatUser!); setAdminReply(''); }}>
                    <input 
                      type="text" 
                      className="flex-1 px-6 py-4 bg-blue-50/30 border-2 border-blue-150 rounded-2xl focus:outline-none focus:border-blue-700 font-extrabold text-sm text-black" 
                      placeholder="Type admin reply..." 
                      value={adminReply} 
                      onChange={e => setAdminReply(e.target.value)} 
                    />
                    <button type="submit" className="w-14 h-14 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all cursor-pointer">
                      <CheckCircle2 size={20} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                <MessageSquare size={64} className="text-blue-200 mb-4" />
                <p className="text-sm font-black text-blue-905 uppercase tracking-widest leading-none">Select active support thread</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic 20 Levels Commission Configurer tab */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-black bg-white">
          <div className="bg-white p-10 rounded-[3rem] border-2 border-blue-150 shadow-sm">
            <h3 className="text-xl font-black text-black mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-700 rounded-2xl flex items-center justify-center text-white">
                <Settings size={20} />
              </div>
              Platform Admin settings Setup
            </h3>
            <div className="space-y-6 text-xs font-black text-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/20 p-6 rounded-3xl border border-blue-100">
                <div>
                  <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest pl-1 mb-2">Configure UPI Gateway QR image</label>
                  <div className="aspect-square max-w-[200px] border-2 border-dashed border-blue-200 rounded-[2rem] flex items-center justify-center relative overflow-hidden group mx-auto p-4 bg-white shadow-sm">
                    {config.qrCode ? (
                      <img src={config.qrCode} alt="QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <p className="text-blue-900 text-center font-bold">No QR uploaded</p>
                    )}
                    <div className="absolute inset-0 bg-blue-900/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                      <label htmlFor="qr-file" className="px-4 py-2 bg-white text-blue-900 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer">Choose Photo</label>
                    </div>
                  </div>
                  <input type="file" accept="image/*" id="qr-file" className="hidden" onChange={handleQRUpload} />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest pl-1 mb-2">Configure Custom Platform Logo</label>
                  <div className="aspect-square max-w-[200px] border-2 border-dashed border-blue-200 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group mx-auto p-4 bg-white shadow-sm">
                    {config.customLogo ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <img src={config.customLogo} alt="Custom Logo" className="w-20 h-20 object-contain rounded-xl p-1" />
                        <button type="button" onClick={handleLogoReset} className="text-[10px] text-red-600 hover:underline font-black mt-2">Reset to Default</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <div className="w-10 h-10 bg-blue-105 rounded-2xl flex items-center justify-center text-blue-900 text-lg mb-1.5">🖼️</div>
                        <p className="text-blue-900 text-[10px] uppercase font-black leading-tight">Default Isometric Logo</p>
                        <p className="text-neutral-500 text-[8px] mt-0.5 leading-tight font-black uppercase tracking-wide">Hover to upload custom</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-blue-900/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                      <label htmlFor="logo-file" className="px-4 py-2 bg-white text-blue-900 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer">Choose Logo</label>
                    </div>
                  </div>
                  <input type="file" accept="image/*" id="logo-file" className="hidden" onChange={handleLogoUpload} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1 pl-1">Activation Package (₹)</label>
                  <input type="number" className="w-full px-4 py-3 bg-blue-50/40 border-2 border-blue-150 rounded-xl font-bold text-black" value={config.activationFee} onChange={e => onUpdateConfig({...config, activationFee: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1 pl-1">Matrix Commission Split (%)</label>
                  <input type="number" className="w-full px-4 py-3 bg-neutral-100 border rounded-xl font-bold text-neutral-500" value={10} disabled />
                </div>
              </div>

              <div className="p-5 bg-blue-50/60 rounded-2xl border-2 border-blue-100">
                <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-2">20-Level Cascade split ratio details</p>
                <p className="text-[11px] font-bold text-neutral-800 leading-relaxed">Levels 1-5 credit 2% each. Levels 6-20 credit 0.5% cascade distribution. Admin deducts 5% TD & platform service maintenance fee securely during each cashout settlements node execution.</p>
              </div>
            </div>
          </div>

          {/* Column 2: 20-Level Income Chart Rate & Coin Distribution Configuration */}
          <div className="bg-white p-10 rounded-[3rem] border-2 border-blue-150 shadow-sm flex flex-col">
            <h3 className="text-xl font-black text-black mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span className="p-1 px-2.5 bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-900 text-sm">📊</span>
                20-Level MLM Split Rates
              </span>
              <div className="flex bg-neutral-150 p-1.5 rounded-2xl border border-neutral-250 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRateTab('rupee')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${rateTab === 'rupee' ? 'bg-indigo-705 text-white shadow-sm' : 'text-neutral-500 hover:text-indigo-900'}`}
                >
                  💰 Rupee (%)
                </button>
                <button
                  type="button"
                  onClick={() => setRateTab('coin')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${rateTab === 'coin' ? 'bg-indigo-750 text-white shadow-sm' : 'text-neutral-500 hover:text-indigo-900'}`}
                >
                  🪙 Coin (%)
                </button>
              </div>
            </h3>

            {/* Presets Button Row */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-[9px] font-black text-neutral-400 self-center uppercase tracking-widest mr-2">Presets:</span>
              <button
                type="button"
                onClick={() => rateTab === 'rupee' ? applyPresetRupee('default') : applyPresetCoin('default')}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg text-[9px] font-black text-black uppercase tracking-wider transition-all cursor-pointer"
              >
                🔄 Default System
              </button>
              <button
                type="button"
                onClick={() => rateTab === 'rupee' ? applyPresetRupee('flat1') : applyPresetCoin('flat1')}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg text-[9px] font-black text-black uppercase tracking-wider transition-all cursor-pointer"
              >
                📊 Flat 1%
              </button>
              <button
                type="button"
                onClick={() => rateTab === 'rupee' ? applyPresetRupee('flat2') : applyPresetCoin('flat2')}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg text-[9px] font-black text-black uppercase tracking-wider transition-all cursor-pointer"
              >
                📊 Flat 2%
              </button>
            </div>

            {/* Rates Sub-panel grid */}
            <div className="flex-1 overflow-y-auto pr-2 max-h-[360px] bg-neutral-50/50 p-5 rounded-[2rem] border border-neutral-200 space-y-4">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">
                {rateTab === 'rupee' 
                  ? '💰 Enter generation percentage rate (e.g. 15 for 15%) for level-wise Rupee commissions'
                  : '🪙 Enter generation percentage rate (e.g. 15 for 15%) for level-wise Coin distributions'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                {Array(20).fill(0).map((_, i) => {
                  const val = rateTab === 'rupee'
                    ? ((config.levelRupeeRates ? config.levelRupeeRates[i] : undefined) ?? DEFAULT_LEVEL_PERCENTAGES[i] ?? 0) * 100
                    : ((config.levelCoinRates ? config.levelCoinRates[i] : undefined) ?? DEFAULT_LEVEL_PERCENTAGES[i] ?? 0) * 100;
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 bg-white border border-neutral-200 rounded-2xl shadow-sm">
                      <span className="text-[10px] font-black text-neutral-500 uppercase w-7 text-right">L{i + 1}</span>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="w-full pl-2 pr-6 py-1.5 bg-neutral-50 border rounded-lg font-black text-xs text-black focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-700"
                          value={parseFloat(val.toFixed(3))}
                          onChange={e => {
                            const num = parseFloat(e.target.value) || 0;
                            if (rateTab === 'rupee') {
                              handleUpdateLevelRupeeRate(i, num);
                            } else {
                              handleUpdateLevelCoinRate(i, num);
                            }
                          }}
                        />
                        <span className="absolute right-2 top-2 text-[10px] font-bold text-neutral-500">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-[10px] font-black text-indigo-900 leading-relaxed uppercase tracking-wider">
              💡 Updates to the rates are autosaved instantly and applied immediately during next product upgrade nodes.
            </div>
          </div>
        </div>
      )}

      {/* Packages Management Section */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-black bg-white">
          {/* Create Package Column */}
          <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border-2 border-blue-150 shadow-sm">
            <h3 className="text-lg font-black text-black mb-6 flex items-center gap-2">
              <span className="p-2 bg-blue-100 border border-blue-200 rounded-xl text-blue-900 animate-bounce">🎁</span>
              Create New Package
            </h3>
            
            <form onSubmit={handleCreatePackageSubmit} className="space-y-4 text-xs font-black">
              <div>
                <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5 ml-1">Package Name</label>
                <input 
                  type="text" 
                  value={pkgName} 
                  onChange={e => setPkgName(e.target.value)} 
                  placeholder="e.g. Starter Node, Golden Booster" 
                  className="w-full px-4 py-3 bg-blue-50/40 border-2 border-blue-155 rounded-xl text-black font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-600" 
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5 ml-1">E-Wallet Cost (₹ Price)</label>
                <input 
                  type="number" 
                  value={pkgPrice} 
                  onChange={e => setPkgPrice(e.target.value)} 
                  placeholder="Price paid from E-Wallet" 
                  className="w-full px-4 py-3 bg-blue-50/40 border-2 border-blue-155 rounded-xl text-black font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-600" 
                  required
                  min="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5 ml-1">P.V (Point Value)</label>
                  <input 
                    type="number" 
                    value={pkgPV} 
                    onChange={e => setPkgPV(e.target.value)} 
                    placeholder="PV" 
                    className="w-full px-4 py-3 bg-blue-50/40 border-2 border-blue-155 rounded-xl text-black font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-600" 
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5 ml-1">Coins Received</label>
                  <input 
                    type="number" 
                    value={pkgCoin} 
                    onChange={e => setPkgCoin(e.target.value)} 
                    placeholder="Coins" 
                    className="w-full px-4 py-3 bg-blue-50/40 border-2 border-blue-155 rounded-xl text-black font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-600" 
                    required
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5 ml-1">% Coin Usable Limit</label>
                <input 
                  type="number" 
                  value={pkgCoinUsable} 
                  onChange={e => setPkgCoinUsable(e.target.value)} 
                  placeholder="e.g. 10" 
                  className="w-full px-4 py-3 bg-blue-50/40 border-2 border-blue-155 rounded-xl text-black font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-600" 
                  required
                  min="0"
                  max="100"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-[10px] uppercase font-black tracking-widest shadow-md transition-all cursor-pointer"
              >
                💾 Publish Franchise Package Node
              </button>
            </form>
          </div>

          {/* Packages List Column */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border-2 border-blue-150 shadow-sm flex flex-col">
            <h3 className="text-lg font-black text-black mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-800">📊</span>
                Active Franchise Packages
              </span>
              <span className="text-[9px] font-black uppercase text-blue-900 px-3 py-1 bg-blue-100 rounded-full border border-blue-200 leading-none">
                {packages.length} Packages
              </span>
            </h3>

            <div className="border border-neutral-250 rounded-3xl overflow-hidden flex-1 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-black">
                  <thead className="bg-blue-50/50 font-black text-[9px] uppercase tracking-wider text-blue-900 border-b-2 border-blue-100">
                    <tr>
                      <th className="px-6 py-4">Package Name</th>
                      <th className="px-6 py-4">Price (E-Wallet)</th>
                      <th className="px-6 py-4 text-purple-700">P.V (Point Value)</th>
                      <th className="px-6 py-4 text-emerald-850">Coins Col.</th>
                      <th className="px-6 py-4 text-indigo-700">% Coin Usable</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {packages.map(p => (
                      <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-6 py-4 font-black text-black">{p.name}</td>
                        <td className="px-6 py-4 font-mono font-black text-neutral-800">₹{p.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-905 rounded-lg text-[10px] font-black border border-blue-200 font-mono">
                            {p.pv} PV
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg text-[10px] font-black border border-emerald-250 font-mono">
                            🪙 {p.coin} Coins
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 rounded-lg text-[10px] font-black border border-indigo-250 font-mono">
                            🎯 {p.coinUsablePercent || 10}% Usable
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            type="button" 
                            onClick={() => { if(onDeletePackage) { onDeletePackage(p.id); } }}
                            className="p-2 text-red-600 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center border border-transparent shadow-none border-0"
                            title="Delete custom package"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {packages.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-neutral-500 font-extrabold uppercase tracking-widest opacity-80">
                          No packages available. Use the form to create package nodes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-4 p-4.5 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-center gap-3">
              <span className="text-xl">💡</span>
              <p className="text-[10px] text-blue-900 font-bold leading-relaxed">
                When a user purchases any of these packages using their <b>E-Wallet balance</b>, their membership ID is automatically activated for services (recharge, payouts, e-commerce)! Level commissions and Coins are distributed up to <b>20 cascade downline nodes</b>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
