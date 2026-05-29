
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, Lock, User, Phone, MapPin, Share2, ArrowRight, CheckCircle2, AlertCircle, Key } from 'lucide-react';
import { cn } from '../services/utils';

interface AuthProps {
  onLogin: (email: string, password?: string) => void;
  onSignup: (data: any) => void;
  onRecover: (email: string, phone: string, type: 'password' | 'pin') => string | null;
}

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const Auth: React.FC<AuthProps> = ({ onLogin, onSignup, onRecover }) => {
  const [view, setView] = useState<'login' | 'signup' | 'recover-password' | 'recover-pin'>('login');
  const [stateSearch, setStateSearch] = useState('');
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    transactionPin: '',
    phone: '',
    state: '',
    referralCode: ''
  });

  const filteredStates = useMemo(() => {
    return STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));
  }, [stateSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'login') {
      onLogin(formData.email, formData.password);
    } else if (view === 'signup') {
      if (formData.transactionPin.length !== 4) {
        alert('Transaction PIN must be exactly 4 digits.');
        return;
      }
      if (!formData.state) {
        alert('Please select your state.');
        return;
      }
      onSignup({ ...formData, transactionPin: formData.transactionPin });
    } else {
      const result = onRecover(formData.email, formData.phone, view === 'recover-password' ? 'password' : 'pin');
      if (result) {
        setRecoveryResult(result);
      } else {
        alert('Verification failed. No user found with these details.');
      }
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setFormData({ ...formData, transactionPin: val });
  };

  return (
    <div className="h-[100dvh] w-full overflow-y-auto no-scrollbar flex flex-col items-center justify-center bg-slate-50 p-6 relative">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-2xl p-10 rounded-[3rem] shadow-2xl border border-white/20 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 gradient-brand rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-secondary/20 rotate-12">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 -rotate-12">
              <span className="text-white font-black text-2xl tracking-tighter">S360</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">SmartPay 360</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">The Future of Payments</p>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl mb-8">
          {[
            { id: 'login', label: 'Login' },
            { id: 'signup', label: 'Sign Up' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => { setView(t.id as any); setRecoveryResult(null); }}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest",
                (view === t.id || (view.startsWith('recover') && t.id === 'login')) ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {recoveryResult ? (
            <motion.div 
              key="recovery-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6"
            >
              <div className="bg-green-50 p-8 rounded-[2.5rem] border-2 border-dashed border-green-200">
                 <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-green-100">
                   <CheckCircle2 size={24} />
                 </div>
                 <p className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-4">Verification Successful</p>
                 <p className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-tighter">Your requested credential is:</p>
                 <p className="text-3xl font-black text-brand-primary select-all font-mono tracking-tight">{recoveryResult}</p>
              </div>
              <button 
                onClick={() => { setView('login'); setRecoveryResult(null); }}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl hover:bg-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95"
              >
                Back to Login
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key={view}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              {view === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-bold text-sm"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-bold text-sm"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              {(view === 'signup' || view.startsWith('recover')) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        required
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-bold text-sm"
                        placeholder="+91"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  {view === 'signup' && (
                    <div className="space-y-1 relative">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                      <div 
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer font-bold text-xs truncate flex items-center justify-between"
                        onClick={() => setIsStateOpen(!isStateOpen)}
                      >
                        <span className="truncate">{formData.state || "Select State"}</span>
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                      </div>
                      <AnimatePresence>
                        {isStateOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 w-full mb-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                          >
                            <input 
                              type="text"
                              className="w-full px-4 py-3 border-b border-slate-100 text-xs focus:outline-none bg-slate-50 font-bold"
                              placeholder="Search state..."
                              value={stateSearch}
                              onChange={(e) => setStateSearch(e.target.value)}
                              autoFocus
                            />
                            <div className="max-h-48 overflow-y-auto no-scrollbar">
                              {filteredStates.map(s => (
                                <div 
                                  key={s} 
                                  className="px-4 py-2.5 hover:bg-blue-50 text-xs font-bold cursor-pointer transition-colors text-slate-700"
                                  onClick={() => {
                                    setFormData({...formData, state: s});
                                    setIsStateOpen(false);
                                    setStateSearch('');
                                  }}
                                >
                                  {s}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}

              {view === 'login' && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-bold text-sm"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-between px-1">
                     <button 
                      type="button" 
                      onClick={() => setView('recover-password')}
                      className="text-[9px] font-black text-slate-400 hover:text-brand-secondary transition-colors uppercase tracking-widest"
                     >
                       Forgot Password?
                     </button>
                     <button 
                      type="button" 
                      onClick={() => setView('recover-pin')}
                      className="text-[9px] font-black text-slate-400 hover:text-brand-secondary transition-colors uppercase tracking-widest"
                     >
                       Forgot PIN?
                     </button>
                  </div>
                </div>
              )}

              {view === 'signup' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-bold text-sm"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trans. PIN</label>
                    <div className="relative">
                      <Key size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        inputMode="numeric"
                        pattern="\d{4}"
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-bold text-sm text-center tracking-[0.5em]"
                        placeholder="0000"
                        value={formData.transactionPin}
                        onChange={handlePinChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {view === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referral Code</label>
                  <div className="relative">
                    <Share2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-secondary/10 focus:border-brand-secondary focus:outline-none transition-all font-bold text-sm"
                      placeholder="SPAY123"
                      value={formData.referralCode}
                      onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-5 gradient-brand text-white font-black rounded-3xl shadow-xl shadow-brand-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm mt-4 flex items-center justify-center gap-2"
              >
                {view === 'login' ? 'Access Account' : 
                 view === 'signup' ? 'Register Now' : 'Verify Identity'}
                <ArrowRight size={18} />
              </button>

              {view === 'login' && (
                <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                     <ShieldCheck size={14} className="text-brand-primary" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Access</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-700 font-bold">Email: <span className="text-brand-primary select-all font-mono">admin@spay.com</span></p>
                    <p className="text-xs text-slate-700 font-bold">Pass: <span className="text-brand-primary select-all font-mono">admin123</span></p>
                  </div>
                </div>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setRecoveryResult(null); }}
            className="text-slate-400 text-[10px] font-black hover:text-brand-secondary transition-colors uppercase tracking-[0.2em]"
          >
            {view === 'login' ? "Join the network → Sign Up" : "Back to Security → Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
