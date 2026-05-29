
import React, { useState } from 'react';
import { User, Transaction, MLMConfig, UserRole, PaymentRequest, WithdrawalRequest, ChatMessage } from '../types';
import { TrendingUp, Users, Wallet, ShieldCheck, MessageSquare, Settings, CheckCircle2, XCircle, Clock, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../services/utils';

interface AdminProps {
  users: User[];
  transactions: Transaction[];
  config: MLMConfig;
  onUpdateConfig: (c: MLMConfig) => void;
  paymentRequests: PaymentRequest[];
  onApprovePayment: (id: string) => void;
  withdrawalRequests: WithdrawalRequest[];
  onApproveWithdrawal: (id: string) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (msg: string, receiverId: string) => void;
}

const AdminPanel: React.FC<AdminProps> = ({ 
  users, transactions, config, onUpdateConfig, paymentRequests, 
  onApprovePayment, withdrawalRequests, onApproveWithdrawal,
  chatMessages, onSendMessage
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'payments' | 'withdrawals' | 'support' | 'config'>('stats');
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');

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

  const uniqueChatUsers = Array.from(new Set(chatMessages.map(m => m.senderId === 'admin-0' ? m.receiverId : m.senderId))).filter(id => id !== 'admin-0');

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Admin Control Center</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Platform Management & Oversight</p>
        </div>
        <nav className="flex gap-1 bg-white p-1 rounded-2xl shadow-sm border overflow-x-auto no-scrollbar">
          {[
            { id: 'stats', icon: TrendingUp, label: 'Stats' },
            { id: 'payments', icon: Wallet, label: 'Payments' },
            { id: 'withdrawals', icon: ShieldCheck, label: 'Payouts' },
            { id: 'support', icon: MessageSquare, label: 'Support' },
            { id: 'config', icon: Settings, label: 'Config' },
          ].map(t => (
            <button 
              key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest",
                activeTab === t.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
              )}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { l: 'Platform Revenue', v: `₹${(totalVolume * 0.05).toFixed(2)}`, c: 'text-green-600', i: TrendingUp, bg: 'bg-green-50' },
              { l: 'System Volume', v: `₹${totalVolume.toFixed(2)}`, c: 'text-blue-600', i: Wallet, bg: 'bg-blue-50' },
              { l: 'Active Users', v: activeUsers.toString(), c: 'text-slate-900', i: Users, bg: 'bg-slate-50' },
              { l: 'Pending Payouts', v: withdrawalRequests.filter(r => r.status === 'pending').length.toString(), c: 'text-orange-500', i: Clock, bg: 'bg-orange-50' },
            ].map(s => (
              <div key={s.l} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", s.bg)}>
                  <s.i size={24} className={s.c} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.l}</p>
                <p className={`text-3xl font-black mt-1 tracking-tight ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Platform Activity</h3>
              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Transaction ID</th>
                    <th className="px-8 py-4">User</th>
                    <th className="px-8 py-4">Type</th>
                    <th className="px-8 py-4">Amount</th>
                    <th className="px-8 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.slice(0, 10).map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 font-mono text-[10px] text-slate-400">#{tx.id.slice(-8)}</td>
                      <td className="px-8 py-4 font-bold text-slate-700">{users.find(u => u.id === tx.userId)?.name || 'System'}</td>
                      <td className="px-8 py-4">
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-tighter">{tx.type}</span>
                      </td>
                      <td className={cn("px-8 py-4 font-black", tx.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                        {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-1.5 text-green-600 font-black text-[10px] uppercase">
                          <CheckCircle2 size={12} /> Success
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

      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto mb-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Payment Approvals</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Verify and approve fund requests</p>
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
                    <button onClick={() => window.open(req.screenshot, '_blank')} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">View Full Size</button>
                  </div>
                </div>
                <div className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-lg font-black text-slate-900">₹{req.amount}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Requested</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-800">{req.userName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">UTR Number</p>
                    <p className="text-xs font-mono font-black text-slate-700 tracking-wider">{req.utr}</p>
                  </div>
                  <div className="mt-auto pt-4 flex gap-2">
                    <button onClick={() => onApprovePayment(req.id)} className="flex-1 py-3 bg-green-500 text-white text-[10px] font-black rounded-xl hover:bg-green-600 transition-all uppercase tracking-widest shadow-lg shadow-green-100">Approve</button>
                    <button className="px-4 py-3 bg-red-50 text-red-600 text-[10px] font-black rounded-xl hover:bg-red-100 transition-all uppercase tracking-widest">Reject</button>
                  </div>
                </div>
              </motion.div>
            ))}
            {paymentRequests.filter(r => r.status === 'pending').length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <CheckCircle2 size={48} className="text-green-200 mx-auto mb-4" />
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">All payments processed</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
          <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
             <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Pending Payouts</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Process withdrawal requests</p>
             </div>
             <div className="flex gap-2">
               <div className="relative">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Search user..." className="pl-9 pr-4 py-2 bg-white border rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500" />
               </div>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">User Details</th>
                  <th className="px-8 py-5">Amount</th>
                  <th className="px-8 py-5">Bank Information</th>
                  <th className="px-8 py-5">Requested On</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {withdrawalRequests.filter(r => r.status === 'pending').map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-800">{req.userName}</p>
                      <p className="text-[10px] text-slate-400 font-bold">UID: {req.userId.slice(-6)}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-lg font-black text-green-600">₹{req.amount}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{req.bankDetails.bankName}</p>
                        <p className="text-[11px] font-mono font-bold text-slate-500">{req.bankDetails.accountNumber}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IFSC: {req.bankDetails.ifscCode}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[10px] font-black text-slate-500 uppercase">{new Date(req.createdAt).toLocaleDateString()}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => onApproveWithdrawal(req.id)} 
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
                      >
                        Approve Payout
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
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No pending withdrawals</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[650px]">
          <div className="bg-white border rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
            <div className="p-6 border-b bg-slate-50">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Active Chats</h3>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-50">
              {uniqueChatUsers.map(uid => {
                const chatUser = users.find(u => u.id === uid);
                const lastMsg = chatMessages.filter(m => m.senderId === uid || m.receiverId === uid).slice(-1)[0];
                return (
                  <button 
                    key={uid} 
                    onClick={() => setSelectedChatUser(uid)} 
                    className={cn(
                      "w-full text-left p-6 hover:bg-slate-50 transition-all flex items-center gap-4",
                      selectedChatUser === uid ? 'bg-blue-50/50 border-r-4 border-blue-600' : ''
                    )}
                  >
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-sm">
                      {chatUser?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="font-black text-sm text-slate-800 truncate">{chatUser?.name || 'Unknown User'}</p>
                       <p className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-tight">{lastMsg?.message || 'No messages'}</p>
                    </div>
                    {selectedChatUser !== uid && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                  </button>
                );
              })}
              {uniqueChatUsers.length === 0 && (
                <div className="p-12 text-center opacity-50">
                  <MessageSquare size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No support tickets</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-white border rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm">
            {selectedChatUser ? (
              <>
                <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xs">
                      {users.find(u => u.id === selectedChatUser)?.name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{users.find(u => u.id === selectedChatUser)?.name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{users.find(u => u.id === selectedChatUser)?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedChatUser(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <XCircle size={20} className="text-slate-300" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-slate-50/30">
                   {chatMessages.filter(m => m.senderId === selectedChatUser || m.receiverId === selectedChatUser).map(m => (
                     <div key={m.id} className={cn("flex flex-col", m.senderId === 'admin-0' ? "items-end" : "items-start")}>
                        <div className={cn(
                          "max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm",
                          m.senderId === 'admin-0' ? "bg-slate-900 text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border"
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
                      placeholder="Type your reply..." 
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
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                <Settings size={20} />
              </div>
              Platform Configuration
            </h3>
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment QR Code</label>
                <div className="aspect-square max-w-[300px] mx-auto bg-slate-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 relative overflow-hidden group">
                  {config.qrCode ? (
                    <img src={config.qrCode} alt="Admin QR" className="w-full h-full object-contain p-8" />
                  ) : (
                    <div className="text-center">
                      <Wallet size={48} className="text-slate-200 mx-auto mb-2" />
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No QR Uploaded</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label htmlFor="qr-input" className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-transform">
                      Change QR
                    </label>
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={handleQRUpload} className="hidden" id="qr-input" />
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">MLM Settings</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600">Activation Fee</span>
                    <span className="text-sm font-black text-slate-900">₹{config.activationFee}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600">Referral Levels</span>
                    <span className="text-sm font-black text-slate-900">10 Levels</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
