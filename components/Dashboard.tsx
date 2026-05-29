
import React, { useState, useMemo } from 'react';
import { User, Transaction, Product, PaymentRequest, WithdrawalRequest, ChatMessage, BankDetails } from '../types';
import { Wallet, Bell, LogOut, ShieldCheck, MessageSquare, Share2, Copy, CheckCircle2, AlertCircle, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../services/utils';

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
  tab: string;
  setTab: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, users, products, transactions, onRecharge, onOrder, onTransfer, 
  onActivate, packagePrice, qrCode, onAddMoney, paymentRequests,
  withdrawalRequests, onWithdrawal, onUpdateBankDetails, chatMessages, onSendMessage,
  tab, setTab
}) => {
  const [transferData, setTransferData] = useState({ email: '', amount: '', pin: '' });
  const [addMoneyData, setAddMoneyData] = useState({ amount: '', utr: '', screenshot: '' });
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalPin, setWithdrawalPin] = useState('');
  const [bankForm, setBankForm] = useState<BankDetails>(user.bankDetails || { bankName: '', accountNumber: '', ifscCode: '', holderName: '' });
  const [chatInput, setChatInput] = useState('');

  const myDownline = useMemo(() => {
    const findDownline = (uId: string): User[] => {
      const directs = users.filter(u => u.referrerId === uId);
      let fullList = [...directs];
      directs.forEach(d => fullList = [...fullList, ...findDownline(d.id)]);
      return fullList;
    };
    return findDownline(user.id);
  }, [users, user.id]);

  const stats = [
    { label: 'Recharge', val: `₹${user.wallets.recharge.toFixed(2)}`, color: 'text-blue-600', icon: Wallet },
    { label: 'Main', val: `₹${user.wallets.main.toFixed(2)}`, color: 'text-slate-900', icon: TrendingUp },
    { label: 'Commission', val: `₹${user.wallets.commission.toFixed(2)}`, color: 'text-green-600', icon: CheckCircle2 },
    { label: 'Team', val: myDownline.length.toString(), color: 'text-orange-600', icon: Users },
  ];

  const shareText = `Join SmartPay 360 and earn from 10 levels of referrals! Use my referral code: ${user.referralCode}. Sign up now!`;
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
      reader.onloadend = () => setAddMoneyData({ ...addMoneyData, screenshot: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleAddMoneySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(addMoneyData.amount);
    if (isNaN(amt) || amt <= 0) return alert('Enter valid amount');
    if (!addMoneyData.utr) return alert('Enter UTR Number');
    if (!addMoneyData.screenshot) return alert('Upload payment screenshot');
    onAddMoney({ amount: amt, utr: addMoneyData.utr, screenshot: addMoneyData.screenshot });
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
    const amt = prompt(`Enter ${service} amount:`);
    if (!amt) return;
    const pin = prompt(`Enter 4-digit Transaction PIN to confirm:`);
    if (!pin || pin.length !== 4) return alert('Valid Transaction PIN is required for recharges.');
    onRecharge(user.id, parseFloat(amt), service, pin);
  };

  return (
    <div className="space-y-8">
      {/* Activation Banner */}
      {!user.isActivated && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border-2 border-dashed border-orange-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6"
        >
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-orange-800 font-black text-lg tracking-tight">Account Inactive</h3>
                <p className="text-orange-600 text-xs font-bold uppercase tracking-widest">Activate for ₹{packagePrice} to unlock rewards</p>
              </div>
           </div>
           <button 
            onClick={() => onActivate(user.id)} 
            className="w-full md:w-auto bg-orange-500 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95 uppercase tracking-widest text-xs"
           >
            Activate Now
           </button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-2">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", s.color.replace('text', 'bg') + '/10')}>
                <s.icon size={16} className={s.color} />
              </div>
              <TrendingUp size={12} className="text-slate-300" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className={cn("text-xl font-black tracking-tight", s.color)}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Main Content Areas */}
      {tab === 'home' && (
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { id: 'utility', icon: Wallet, label: 'Recharge', color: 'bg-blue-500' },
              { id: 'add_money', icon: Bell, label: 'Add Cash', color: 'bg-green-500' },
              { id: 'transfer', icon: Share2, label: 'Send', color: 'bg-purple-500' },
              { id: 'withdraw', icon: ShieldCheck, label: 'Withdraw', color: 'bg-orange-500' },
            ].map((action) => (
              <button
                key={action.id}
                onClick={() => setTab(action.id)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={cn("w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-slate-200 transition-all group-hover:scale-110 group-active:scale-95", action.color)}>
                  <action.icon size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Recent Activity</h3>
                <button className="text-[10px] font-black text-brand-secondary uppercase tracking-widest">View History</button>
              </div>
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-50">
                  {transactions.slice(0, 6).map(tx => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={tx.id} 
                      className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner",
                          tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        )}>
                          {tx.type === 'recharge' ? '📱' : tx.type === 'add_funds' ? '💰' : '💸'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{tx.description}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-base font-black tracking-tight", tx.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                          {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-0.5">{tx.walletType}</p>
                      </div>
                    </motion.div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="py-20 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                        <Wallet className="text-slate-200" size={32} />
                      </div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">No transactions yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Referral Card */}
              <div className="gradient-brand p-8 rounded-[3rem] text-white shadow-2xl shadow-brand-secondary/30 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-brand-accent/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                    <Users size={24} />
                  </div>
                  <h4 className="font-black text-2xl tracking-tight mb-2">Invite & Earn</h4>
                  <p className="text-xs text-white/70 mb-8 font-bold uppercase tracking-widest leading-relaxed">Build your empire across 10 levels of referrals</p>
                  
                  <div className="bg-black/20 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 mb-8">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-3">Your Referral Code</p>
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-black text-2xl tracking-[0.2em]">{user.referralCode}</span>
                      <button 
                        onClick={() => {navigator.clipboard.writeText(user.referralCode); alert('Copied!');}} 
                        className="p-3 bg-white text-brand-primary rounded-2xl hover:scale-110 transition-transform shadow-lg"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => handleShare('whatsapp')} className="flex-1 py-4 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                      <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .015 5.398.015 12.03c0 2.123.553 4.197 1.603 6.034L0 24l6.135-1.61a11.787 11.787 0 005.912 1.64h.005c6.635 0 12.034-5.399 12.034-12.03 0-3.212-1.25-6.232-3.52-8.504z"/></svg>
                    </button>
                    <button onClick={() => handleShare('telegram')} className="flex-1 py-4 bg-[#0088cc] rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                      <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.891 8.146l-2.003 9.464c-.149.659-.539.822-1.091.511l-3.051-2.25-1.47 1.416c-.163.163-.3.298-.615.298l.221-3.137 5.711-5.159c.247-.22-.054-.341-.383-.122l-7.06 4.444-3.041-.951c-.661-.204-.674-.661.139-.98l11.879-4.579c.55-.204 1.03.127.859.936z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'utility' && (
        <div className="space-y-8">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Utility Payments</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Fast, Secure & Rewarding</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { name: 'Mobile', icon: '📱', color: 'bg-blue-50', textColor: 'text-blue-600' },
              { name: 'DTH', icon: '📡', color: 'bg-orange-50', textColor: 'text-orange-600' },
              { name: 'Electricity', icon: '⚡', color: 'bg-yellow-50', textColor: 'text-yellow-600' },
              { name: 'Water', icon: '💧', color: 'bg-cyan-50', textColor: 'text-cyan-600' },
              { name: 'FASTag', icon: '🚗', color: 'bg-emerald-50', textColor: 'text-emerald-600' },
              { name: 'Broadband', icon: '🌐', color: 'bg-indigo-50', textColor: 'text-indigo-600' },
              { name: 'Gas', icon: '🔥', color: 'bg-red-50', textColor: 'text-red-600' },
              { name: 'Insurance', icon: '🛡️', color: 'bg-purple-50', textColor: 'text-purple-600' },
            ].map(s => (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={s.name} 
                disabled={!user.isActivated} 
                onClick={() => initiateRecharge(s.name)}
                className={cn(
                  "bg-white p-8 rounded-[2.5rem] border-2 border-transparent shadow-sm text-center transition-all",
                  !user.isActivated ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-brand-secondary hover:shadow-xl hover:shadow-slate-200'
                )}
              >
                <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner", s.color)}>{s.icon}</div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.name}</p>
                <p className="text-[9px] font-bold text-green-600 uppercase mt-1 tracking-widest">2% Cashback</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {tab === 'add_money' && (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Add Funds</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Instant Wallet Top-up</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-8">
            <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scan to Pay</p>
              <div className="w-48 h-48 bg-white p-4 rounded-2xl shadow-inner flex items-center justify-center border">
                {qrCode ? (
                  <img src={qrCode} alt="Admin QR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-slate-300 flex flex-col items-center gap-2">
                    <ShieldCheck size={48} strokeWidth={1} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">QR NOT SET</span>
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-slate-600">Pay via any UPI App</p>
            </div>

            <form onSubmit={handleAddMoneySubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-black text-lg"
                    placeholder="0.00"
                    value={addMoneyData.amount}
                    onChange={e => setAddMoneyData({...addMoneyData, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">UTR / Ref Number</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-bold text-sm"
                    placeholder="12-digit UTR"
                    value={addMoneyData.utr}
                    onChange={e => setAddMoneyData({...addMoneyData, utr: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Screenshot</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleScreenshotChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full px-6 py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover:bg-slate-100 transition-colors">
                    {addMoneyData.screenshot ? (
                      <img src={addMoneyData.screenshot} alt="Preview" className="h-20 rounded-lg shadow-md" referrerPolicy="no-referrer" />
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400">
                          <Bell size={24} />
                        </div>
                        <p className="text-xs font-bold text-slate-500">Tap to upload screenshot</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-5 gradient-brand text-white font-black rounded-3xl shadow-xl shadow-brand-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm">
                Submit Payment Request
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'withdraw' && (
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Withdrawal</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Cash out your earnings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-800">Bank Account</h3>
              </div>
              
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onUpdateBankDetails(bankForm); }}>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Holder</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:border-brand-secondary" value={bankForm.holderName} onChange={e => setBankForm({...bankForm, holderName: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:border-brand-secondary" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:border-brand-secondary" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IFSC Code</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:border-brand-secondary" value={bankForm.ifscCode} onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})} required />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-slate-800 text-white text-xs font-black rounded-2xl hover:bg-black transition-all uppercase tracking-widest shadow-lg shadow-slate-200">
                  Update Bank Details
                </button>
              </form>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                  <Wallet size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-800">Request Payout</h3>
              </div>

              <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-green-800 uppercase tracking-widest">Available Balance</p>
                  <p className="text-2xl font-black text-green-600">₹{user.wallets.commission.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Min Payout</p>
                  <p className="text-xs font-black text-slate-600">₹50.00</p>
                </div>
              </div>

              <form onSubmit={handleWithdrawalSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount to Withdraw (₹)</label>
                  <input 
                    type="number" 
                    min="50" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-black text-xl"
                    placeholder="0.00"
                    value={withdrawalAmount}
                    onChange={e => setWithdrawalAmount(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transaction PIN</label>
                  <input 
                    type="password" 
                    maxLength={4} 
                    inputMode="numeric" 
                    pattern="\d{4}" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-black text-center tracking-[1em] text-lg"
                    placeholder="0000"
                    value={withdrawalPin}
                    onChange={e => setWithdrawalPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required 
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-brand-primary text-white font-black rounded-3xl shadow-xl shadow-brand-primary/20 hover:bg-brand-secondary transition-all uppercase tracking-widest text-sm">
                  Submit Withdrawal Request
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {tab === 'transfer' && (
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Fund Transfer</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Wallet to Wallet Transfer</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-8">
            <div className="p-6 bg-brand-primary rounded-3xl text-white shadow-lg shadow-brand-primary/20">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Main Wallet Balance</p>
              <p className="text-3xl font-black">₹{user.wallets.main.toFixed(2)}</p>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recipient Email</label>
                <input 
                  type="email" 
                  required 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-bold text-sm"
                  placeholder="user@smartpay.com"
                  value={transferData.email}
                  onChange={e => setTransferData({...transferData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (₹)</label>
                <input 
                  type="number" 
                  required 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-black text-xl"
                  placeholder="0.00"
                  value={transferData.amount}
                  onChange={e => setTransferData({...transferData, amount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transaction PIN</label>
                <input 
                  type="password" 
                  maxLength={4} 
                  inputMode="numeric" 
                  pattern="\d{4}" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-black text-center tracking-[1em] text-lg"
                  placeholder="0000"
                  value={transferData.pin}
                  onChange={e => setTransferData({...transferData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                  required 
                />
              </div>
              <button type="submit" className="w-full py-5 gradient-brand text-white font-black rounded-3xl shadow-xl shadow-brand-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm">
                Transfer Funds Now
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'mlm' && (
        <div className="space-y-8">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">My Network</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">10-Level Referral Tree</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(10)].map((_, i) => {
              const levelMembers = myDownline.filter(u => u.level === (user.level + i + 1));
              const activeCount = levelMembers.filter(u => u.isActivated).length;
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={i} 
                  className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xs border">
                      L{i+1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{levelMembers.length} Members</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Team</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-green-600">{activeCount} Active</p>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${levelMembers.length ? (activeCount / levelMembers.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'support' && (
        <div className="max-w-4xl mx-auto h-[600px] flex flex-col bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-brand rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-secondary/20">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Support Center</h3>
                <p className="text-[9px] text-green-600 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/30">
            {chatMessages.filter(m => m.senderId === user.id || m.receiverId === user.id).map(msg => (
              <div key={msg.id} className={cn("flex flex-col", msg.senderId === user.id ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm",
                  msg.senderId === user.id ? "bg-brand-primary text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border"
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
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Start a conversation with support</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t">
            <form onSubmit={(e) => { e.preventDefault(); if(chatInput.trim()) { onSendMessage(chatInput, 'admin'); setChatInput(''); } }} className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-secondary font-medium text-sm"
                placeholder="Type your message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button type="submit" className="w-14 h-14 gradient-brand text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-secondary/20 hover:scale-105 transition-transform">
                <LogOut size={20} className="rotate-180" />
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'shop' && (
        <div className="space-y-8">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Smart Shop</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Exclusive Products & Rewards</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(p => (
              <motion.div 
                whileHover={{ y: -5 }}
                key={p.id} 
                className="bg-white rounded-[2rem] border shadow-sm overflow-hidden flex flex-col"
              >
                <div className="h-48 bg-slate-50 flex items-center justify-center text-6xl relative">
                  {p.image}
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-sm">
                    <p className="text-[10px] font-black text-brand-secondary uppercase tracking-widest">{p.category}</p>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h4 className="font-black text-slate-800 mb-1">{p.name}</h4>
                  <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-2">{p.description}</p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-black text-slate-900">₹{p.price}</p>
                        <p className="text-[10px] text-slate-400 line-through font-bold">MRP ₹{p.mrp}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest">{p.mlmPoints} Points</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">MLM Benefit</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onOrder(user.id, p.id)}
                      className="w-full py-3 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-black transition-all uppercase tracking-widest"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {products.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <ShoppingBag size={48} className="text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No products available in shop</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
