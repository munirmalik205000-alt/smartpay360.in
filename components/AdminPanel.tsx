
import React, { useState } from 'react';
import { User, Transaction, MLMConfig, UserRole, PaymentRequest, WithdrawalRequest, ChatMessage, Product } from '../types';
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
}

const AdminPanel: React.FC<AdminProps> = ({ 
  users, transactions, config, onUpdateConfig, products, onAddProduct, paymentRequests, 
  onApprovePayment, withdrawalRequests, onApproveWithdrawal,
  chatMessages, onSendMessage, onApproveKYC, onApproveReward
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'kyc' | 'payments' | 'withdrawals' | 'rewards' | 'support' | 'products' | 'config'>('stats');
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');

  // Add product form states
  const [newProdName, setNewProdName] = useState('');
  const [newProdMrp, setNewProdMrp] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCat, setNewProdCat] = useState('Electronics');
  const [newProdMlmPoints, setNewProdMlmPoints] = useState('');
  const [newProdIcon, setNewProdIcon] = useState('📱');

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
        category: newProdCat,
        mlmPoints: parseFloat(newProdMlmPoints),
        image: newProdIcon,
        stock: 100,
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
    <div className="space-y-6 text-left">
      {/* Admin Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Admin Console Area</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Super App Platform Ledger Controls</p>
        </div>
        <nav className="flex gap-1 bg-white p-1 rounded-2xl shadow-sm border overflow-x-auto no-scrollbar">
          {[
            { id: 'stats', icon: TrendingUp, label: 'Stats' },
            { id: 'kyc', icon: FileText, label: 'Audit KYC' },
            { id: 'payments', icon: Wallet, label: 'Loads' },
            { id: 'withdrawals', icon: Landmark, label: 'Payouts' },
            { id: 'rewards', icon: Award, label: 'Bounties' },
            { id: 'products', icon: Smartphone, label: 'Shop List' },
            { id: 'support', icon: MessageSquare, label: 'Inbox' },
            { id: 'config', icon: Settings, label: 'Matrix' },
          ].map(t => (
            <button 
              key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest",
                activeTab === t.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              )}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { l: 'Platform Fee (5%)', v: `₹${(totalVolume * 0.05).toFixed(2)}`, c: 'text-[#0077C0]', i: TrendingUp, bg: 'bg-[#0077C0]/10' },
              { l: 'Transaction Volume', v: `₹${totalVolume.toFixed(2)}`, c: 'text-violet-600', i: Wallet, bg: 'bg-violet-50' },
              { l: 'Total Active Franchise', v: activeUsers.toString() + ' Members', c: 'text-emerald-600', i: Users, bg: 'bg-emerald-50' },
              { l: 'Pending Bank Settlements', v: withdrawalRequests.filter(r => r.status === 'pending').length.toString(), c: 'text-amber-600', i: Clock, bg: 'bg-amber-50' },
            ].map(s => (
              <div key={s.l} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", s.bg)}>
                  <s.i size={24} className={s.c} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{s.l}</p>
                  <p className={`text-2xl font-black mt-2 tracking-tight ${s.c}`}>{s.v}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Platform Activity Ledger Log</h3>
              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Download report.csv</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">TX REF ID</th>
                    <th className="px-8 py-4">Legal Member</th>
                    <th className="px-8 py-4">Audit Action</th>
                    <th className="px-8 py-4">Total Amount</th>
                    <th className="px-8 py-4">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.slice(0, 10).map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 font-mono text-[10px] text-slate-400">#{tx.id.toUpperCase()}</td>
                      <td className="px-8 py-4 font-bold text-slate-700">{users.find(u => u.id === tx.userId)?.name || 'Central Ledger'}</td>
                      <td className="px-8 py-4">
                        <span className="px-3 py-1 bg-slate-150 rounded-full text-[10px] font-black uppercase tracking-tighter">{tx.type}</span>
                      </td>
                      <td className={cn("px-8 py-4 font-black", tx.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                        {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-1 text-green-600 font-extrabold text-[10px] uppercase">
                          <CheckCircle2 size={12} /> VERIFIED
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* KYC Auditing Tab */}
      {activeTab === 'kyc' && (
        <div className="space-y-6">
          <div className="text-center max-w-sm mx-auto mb-4">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide">KYC Verification Inbox</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Audit merchant legal identity and credentials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {users.filter(u => u.kycDetails && u.kycDetails.status === 'pending').map(kUser => (
              <div key={kUser.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-4">
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[8px] font-black rounded-full uppercase tracking-widest">PENDING VERIFICATION</span>
                <div>
                  <p className="font-black text-slate-800 text-sm">{kUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">UID: {kUser.id}</p>
                </div>
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Aadhaar:</span>
                    <span className="font-mono text-slate-700">{kUser.kycDetails?.aadhaarNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">PAN Card:</span>
                    <span className="font-mono text-slate-700 uppercase">{kUser.kycDetails?.panNumber}</span>
                  </div>
                  {kUser.kycDetails?.gstNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">GST Registration:</span>
                      <span className="font-mono text-slate-700 uppercase">{kUser.kycDetails?.gstNumber}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => onApproveKYC && onApproveKYC(kUser.id, 'approved')} className="flex-1 py-3 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-600">Approve</button>
                  <button onClick={() => onApproveKYC && onApproveKYC(kUser.id, 'rejected')} className="flex-1 py-3 bg-red-105 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200">Reject</button>
                </div>
              </div>
            ))}
            {users.filter(u => u.kycDetails && u.kycDetails.status === 'pending').length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <FileText size={48} className="text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No pending KYC files awaiting verification</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Load cash deposits approvals */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto mb-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">CASH INFLOW LEDGER APPROVALS</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Verify payment references and screen captures</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentRequests.filter(r => r.status === 'pending').map(req => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={req.id} 
                className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden flex flex-col"
              >
                <div className="h-48 bg-slate-100 relative group">
                  <img src={req.screenshot} alt="Proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => window.open(req.screenshot, '_blank')} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">View Full Proof</button>
                  </div>
                </div>
                <div className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-lg font-black text-slate-900">₹{req.amount}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Load Value</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-850">{req.userName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Member Name</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">UPI TX REFERENCE UTR</p>
                    <p className="text-xs font-mono font-black text-slate-705 tracking-wider truncate">{req.utr}</p>
                  </div>
                  <div className="mt-auto pt-4 flex gap-2">
                    <button onClick={() => onApprovePayment(req.id)} className="flex-1 py-3 bg-green-500 text-white text-[10px] font-black rounded-xl hover:bg-green-600 transition-all uppercase tracking-widest">Approve Load</button>
                    <button className="px-4 py-3 bg-red-50 text-red-650 text-[10px] font-black rounded-xl hover:bg-red-100 transition-all uppercase tracking-widest">Decline</button>
                  </div>
                </div>
              </motion.div>
            ))}
            {paymentRequests.filter(r => r.status === 'pending').length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <CheckCircle2 size={48} className="text-green-200 mx-auto mb-4" />
                <p className="text-slate-405 text-xs font-black uppercase tracking-widest">All ledger loads fully credited</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payout settlements tab */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
          <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
             <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Active Bank Settlements</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Settle commission wallet requesting members</p>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Verified User</th>
                  <th className="px-8 py-5">Settlement Out</th>
                  <th className="px-8 py-5">Settlement Bank Credentials</th>
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5 text-right">Approve Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {withdrawalRequests.filter(r => r.status === 'pending').map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-extrabold text-slate-850">{req.userName}</p>
                      <p className="text-[10px] text-slate-400 font-bold">UID: {req.userId}</p>
                    </td>
                    <td className="px-8 py-5 font-black text-green-600">
                      ₹{req.amount}
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{req.bankDetails?.bankName}</p>
                        <p className="text-[11px] font-mono font-bold text-slate-500">{req.bankDetails?.accountNumber}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IFSC: {req.bankDetails?.ifscCode}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[10px] font-black text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => onApproveWithdrawal(req.id)} 
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                      >
                        Settle & Close Ledger
                      </button>
                    </td>
                  </tr>
                ))}
                {withdrawalRequests.filter(r => r.status === 'pending').length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="text-slate-200" size={32} />
                      </div>
                      <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No pending payouts found in settlement queue</p>
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
        <div className="space-y-6 text-left">
          <div className="text-center max-w-sm mx-auto mb-4">
            <h3 className="text-xl font-black text-slate-850 uppercase tracking-wide">Achievers Claims Dispatch</h3>
            <p className="text-xs text-slate-450 font-bold uppercase tracking-widest mt-1">Review downlines targets and dispatch incentives</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {users.filter(u => u.rewards && u.rewards.some(r => r.status === 'claimed')).map(valUser => (
              <div key={valUser.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-4">
                <span className="px-2.5 py-1 bg-blue-105 text-blue-700 text-[8px] font-black rounded-full uppercase tracking-widest">CLAIM REQUEST FILED</span>
                <div>
                  <p className="font-black text-slate-800 text-sm">{valUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Total Matrix: {users.filter(m => m.referrerId === valUser.id).length} direct nodes</p>
                </div>
                
                <div className="space-y-3">
                  {valUser.rewards?.filter(r => r.status === 'claimed').map(claim => (
                    <div key={claim.id} className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{claim.image}</span>
                        <div>
                          <p className="text-xs font-black text-slate-700 uppercase">{claim.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold">Target reached</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onApproveReward && onApproveReward(valUser.id, claim.id)}
                        className="px-4 py-2 bg-[#0077C0] text-white text-[9px] font-black uppercase rounded-lg shadow"
                      >
                        Approve Dispatch
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {users.filter(u => u.rewards && u.rewards.some(r => r.status === 'claimed')).length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <Award size={48} className="text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No active reward claims logged</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product administration list */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Smartphone className="text-blue-600" size={18} /> Publish Central Product
            </h3>
            <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Item Title</label>
                <input type="text" placeholder="Title" className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={newProdName} onChange={e => setNewProdName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Price (₹)</label>
                  <input type="number" placeholder="₹" className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">MRP Value (₹)</label>
                  <input type="number" placeholder="₹" className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={newProdMrp} onChange={e => setNewProdMrp(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">BV Points Value</label>
                <input type="number" placeholder="Points" className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={newProdMlmPoints} onChange={e => setNewProdMlmPoints(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Central Category Filter</label>
                <select className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold bg-white text-slate-800" value={newProdCat} onChange={e => setNewProdCat(e.target.value)}>
                  {['Electronics', 'Mobile', 'Fashion', 'Grocery', 'Healthcare', 'Home Appliances', 'Beauty', 'Books'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Display Emoji Icon</label>
                <select className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold bg-white text-slate-800" value={newProdIcon} onChange={e => setNewProdIcon(e.target.value)}>
                  {['📱', '💻', '👞', '🍿', '🧪', '❄️', '💈', '📄', '📦'].map(ic => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Short Description</label>
                <textarea rows={3} placeholder="Describe item spec, refund and delivery info..." className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} />
              </div>
              <button type="submit" className="w-full py-3.5 bg-slate-900 border text-white rounded-xl uppercase tracking-wider text-[10px] font-black">Publish Product Item</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Active Catalog Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(p => (
                <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.image}</span>
                    <div>
                      <p className="font-extrabold text-[#003B73]">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.category} • ₹{p.price}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-[8px] font-black rounded">{p.mlmPoints} BV</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Support Conversation Hub */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
          <div className="bg-white border rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
            <div className="p-6 border-b bg-slate-50">
              <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">Active Support Live Queues</h3>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100">
              {uniqueChatUsers.map(uid => {
                const chatUser = users.find(u => u.id === uid);
                const lastMsg = chatMessages.filter(m => m.senderId === uid || m.receiverId === uid).slice(-1)[0];
                return (
                  <button 
                    key={uid} 
                    onClick={() => setSelectedChatUser(uid)} 
                    className={cn(
                      "w-full text-left p-6 hover:bg-slate-50 transition-all flex items-center gap-4",
                      selectedChatUser === uid ? 'bg-sky-50 border-r-4 border-[#0077C0]' : ''
                    )}
                  >
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-sm">
                      {chatUser?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="font-black text-sm text-slate-800 truncate">{chatUser?.name || 'Franchise Member'}</p>
                       <p className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-tight">{lastMsg?.message || 'Empty thread'}</p>
                    </div>
                  </button>
                );
              })}
              {uniqueChatUsers.length === 0 && (
                <div className="p-12 text-center opacity-55">
                  <MessageSquare size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-black">All tickets closed</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-white border rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm">
            {selectedChatUser ? (
              <>
                <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#003B73] rounded-2xl flex items-center justify-center text-white font-black text-xs">
                      {users.find(u => u.id === selectedChatUser)?.name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{users.find(u => u.id === selectedChatUser)?.name}</h4>
                      <p className="text-[9px] text-slate-450 font-bold uppercase tracking-widest">{users.find(u => u.id === selectedChatUser)?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-slate-50/20">
                   {chatMessages.filter(m => m.senderId === selectedChatUser || m.receiverId === selectedChatUser).map(m => (
                     <div key={m.id} className={cn("flex flex-col", m.senderId === 'admin' ? "items-end" : "items-start")}>
                        <div className={cn(
                          "max-w-[80%] p-4 rounded-3xl text-xs font-semibold shadow-sm",
                          m.senderId === 'admin' ? "bg-slate-900 text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border"
                        )}>
                           {m.message}
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                   ))}
                </div>
                <div className="p-4 bg-white border-t">
                  <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if(!adminReply.trim()) return; onSendMessage(adminReply, selectedChatUser!); setAdminReply(''); }}>
                    <input 
                      type="text" 
                      className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 font-medium text-sm" 
                      placeholder="Type admin reply..." 
                      value={adminReply} 
                      onChange={e => setAdminReply(e.target.value)} 
                    />
                    <button type="submit" className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-black transition-all">
                      <CheckCircle2 size={20} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <MessageSquare size={64} className="text-slate-300 mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Select active support thread</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic 20 Levels Commission Configurer tab */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
            <h3 className="text-xl font-black text-slate-850 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                <Settings size={20} />
              </div>
              Platform settings Setup
            </h3>
            <div className="space-y-6 text-xs font-extrabold text-slate-750">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Configure UPI Gateway QR image</label>
                  <div className="aspect-square max-w-[200px] border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center relative overflow-hidden group mx-auto p-4 bg-white shadow-sm">
                    {config.qrCode ? (
                      <img src={config.qrCode} alt="QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <p className="text-slate-400 text-center">No QR uploaded</p>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                      <label htmlFor="qr-file" className="px-4 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer">Choose Photo</label>
                    </div>
                  </div>
                  <input type="file" accept="image/*" id="qr-file" className="hidden" onChange={handleQRUpload} />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Configure Custom Platform Logo</label>
                  <div className="aspect-square max-w-[200px] border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group mx-auto p-4 bg-white shadow-sm">
                    {config.customLogo ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <img src={config.customLogo} alt="Custom Logo" className="w-20 h-20 object-contain rounded-xl p-1" />
                        <button type="button" onClick={handleLogoReset} className="text-[10px] text-red-500 hover:underline font-black mt-2">Reset to Default</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-base mb-1.5">🖼️</div>
                        <p className="text-slate-400 text-[10px] uppercase font-black leading-tight">Default Isometric Loop</p>
                        <p className="text-slate-300 text-[8px] mt-0.5 leading-tight font-extrabold uppercase tracking-wide">Hover to upload custom</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                      <label htmlFor="logo-file" className="px-4 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer">Choose Logo</label>
                    </div>
                  </div>
                  <input type="file" accept="image/*" id="logo-file" className="hidden" onChange={handleLogoUpload} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Activation Package (₹)</label>
                  <input type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold" value={config.activationFee} onChange={e => onUpdateConfig({...config, activationFee: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Matrix Commission Split (%)</label>
                  <input type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold" value={10} disabled />
                </div>
              </div>

              <div className="p-5 bg-blue-50/40 rounded-2xl border">
                <p className="text-[10px] font-extrabold text-blue-800 uppercase tracking-widest mb-2">20-Level Cascade split ratio details</p>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">Levels 1-5 credit 2% each. Levels 6-20 credit 0.5% cascade distribution. Admin deducts 5% TD & platform service maintenance fee securely during each cashout settlements node execution.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
