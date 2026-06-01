
import React, { useState } from 'react';
import { User, Transaction, MLMConfig, UserRole, PaymentRequest, WithdrawalRequest, ChatMessage } from '../types';

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
    <div className="space-y-6">
      <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border w-fit overflow-x-auto max-w-full no-scrollbar">
        {['stats', 'payments', 'withdrawals', 'support', 'config'].map(t => (
          <button 
            key={t} onClick={() => setActiveTab(t as any)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { l: 'Platform Revenue', v: `₹${(totalVolume * 0.05).toFixed(2)}`, c: 'text-green-600' },
            { l: 'System Volume', v: `₹${totalVolume.toFixed(2)}`, c: 'text-blue-600' },
            { l: 'Total Active Users', v: activeUsers.toString(), c: 'text-slate-900' },
            { l: 'Pending Withdrawals', v: withdrawalRequests.filter(r => r.status === 'pending').length.toString(), c: 'text-orange-500' },
          ].map(s => (
            <div key={s.l} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{s.l}</p>
              <p className={`text-2xl font-black mt-1 ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
             <h3 className="font-bold text-slate-800">Pending Fund Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Screenshot</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paymentRequests.filter(r => r.status === 'pending').map(req => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 font-bold">{req.userName}</td>
                    <td className="px-6 py-4 text-green-600 font-black">₹{req.amount}</td>
                    <td className="px-6 py-4">
                      {req.receiptImage ? <a href={req.receiptImage} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">View proof</a> : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-[10px]">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => onApprovePayment(req.id)} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-600">APPROVE</button>
                    </td>
                  </tr>
                ))}
                {paymentRequests.filter(r => r.status === 'pending').length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No pending fund requests.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
             <h3 className="font-bold text-slate-800">Pending Withdrawal Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Bank Details</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {withdrawalRequests.filter(r => r.status === 'pending').map(req => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 font-bold">{req.userName}</td>
                    <td className="px-6 py-4 text-green-600 font-black">₹{req.amount}</td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] leading-tight">
                        <p><strong>A/C:</strong> {req.bankDetails.accountNumber}</p>
                        <p><strong>Bank:</strong> {req.bankDetails.bankName}</p>
                        <p><strong>IFSC:</strong> {req.bankDetails.ifscCode}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px]">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => onApproveWithdrawal(req.id)} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-600">APPROVE</button>
                    </td>
                  </tr>
                ))}
                {withdrawalRequests.filter(r => r.status === 'pending').length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No pending withdrawals.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
          <div className="bg-white border rounded-2xl overflow-y-auto no-scrollbar">
            <div className="p-4 border-b bg-slate-50 font-bold text-xs">Conversations</div>
            {uniqueChatUsers.map(uid => {
              const user = users.find(u => u.id === uid);
              return (
                <button key={uid} onClick={() => setSelectedChatUser(uid)} className={`w-full text-left p-4 border-b hover:bg-slate-50 transition-colors ${selectedChatUser === uid ? 'bg-blue-50' : ''}`}>
                   <p className="font-bold text-sm">{user?.name || 'Unknown User'}</p>
                   <p className="text-[10px] text-slate-400">{user?.email}</p>
                </button>
              );
            })}
            {uniqueChatUsers.length === 0 && <p className="p-8 text-center text-slate-400 text-xs italic">No support messages yet.</p>}
          </div>
          
          <div className="lg:col-span-2 bg-white border rounded-2xl flex flex-col overflow-hidden">
            {selectedChatUser ? (
              <>
                <div className="p-4 border-b bg-slate-50 font-bold text-xs flex justify-between items-center">
                  <span>Chat with {users.find(u => u.id === selectedChatUser)?.name}</span>
                  <button onClick={() => setSelectedChatUser(null)} className="text-[10px] text-slate-400">Close</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                   {chatMessages.filter(m => m.senderId === selectedChatUser || m.receiverId === selectedChatUser).map(m => (
                     <div key={m.id} className={`flex ${m.senderId === 'admin-0' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-2 rounded-xl text-[11px] ${m.senderId === 'admin-0' ? 'bg-blue-600 text-white' : 'bg-slate-100 border'}`}>
                           {m.message}
                        </div>
                     </div>
                   ))}
                </div>
                <form className="p-3 border-t bg-slate-50 flex gap-2" onSubmit={(e) => { e.preventDefault(); if(!adminReply.trim()) return; onSendMessage(adminReply, selectedChatUser!); setAdminReply(''); }}>
                  <input type="text" className="flex-1 px-3 py-1.5 border rounded-lg text-sm" placeholder="Type a reply..." value={adminReply} onChange={e => setAdminReply(e.target.value)} />
                  <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700">REPLY</button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic font-medium">Select a conversation to start chatting</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              Business Profile & Logo
            </h3>
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500">Business Logo / QR Code</label>
              <div className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300 relative overflow-hidden max-h-48">
                {config.qrCode ? <img src={config.qrCode} alt="Admin QR" className="w-full h-full object-contain" /> : <span className="text-slate-400 text-xs font-bold">No Image Uploaded</span>}
              </div>
              <input type="file" accept="image/*" onChange={handleQRUpload} className="hidden" id="qr-input" />
              <label htmlFor="qr-input" className="block text-center w-full py-3 bg-blue-600 text-white font-bold rounded-xl cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                {config.qrCode ? 'Update Image' : 'Upload Image'}
              </label>
            </div>
            
            <div className="space-y-3 pt-4 border-t">
              <label className="text-xs font-bold text-slate-500">Business Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border rounded-xl font-bold bg-slate-50 outline-none"
                value={config.businessName || 'SmartPay 360'}
                onChange={(e) => onUpdateConfig({...config, businessName: e.target.value})}
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500">Support Contact</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border rounded-xl font-bold bg-slate-50 outline-none"
                value={config.supportContact || ''}
                placeholder="e.g. support@smartpay.com"
                onChange={(e) => onUpdateConfig({...config, supportContact: e.target.value})}
              />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-purple-600 rounded-full"></span>
              Level & Coin Setup
            </h3>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500">System Coin Value (₹)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={config.systemCoinValue || 1}
                onChange={(e) => onUpdateConfig({...config, systemCoinValue: Number(e.target.value)})}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500">Level Commissions (%)</label>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border">
                    <span className="text-[10px] font-black text-slate-400 w-12">LVL {i+1}</span>
                    <input 
                      type="number" 
                      className="flex-1 px-3 py-1 border rounded bg-white text-sm font-bold"
                      value={config.levels?.[i] || 0}
                      onChange={(e) => {
                        const newLevels = [...(config.levels || [])];
                        newLevels[i] = Number(e.target.value);
                        onUpdateConfig({...config, levels: newLevels});
                      }}
                    />
                    <span className="text-slate-400 font-bold text-xs">%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
