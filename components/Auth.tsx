import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Share2, 
  ArrowRight, 
  CheckCircle2, 
  Key, 
  Terminal, 
  LockKeyhole,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../services/utils';
import { Logo } from './Logo';
import { User as UserType } from '../types';

interface AuthProps {
  onLogin: (phoneOrEmail: string, password?: string) => void;
  onSignup: (data: any) => void;
  onRecover: (email: string, phone: string, type: 'password' | 'pin') => string | null;
  users: UserType[];
}

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const Auth: React.FC<AuthProps> = ({ onLogin, onSignup, onRecover, users }) => {
  const [view, setView] = useState<'login' | 'signup' | 'recover-password' | 'recover-pin'>('login');
  const [stateSearch, setStateSearch] = useState('');
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode.toUpperCase() }));
      setView('signup');
    }
  }, []);

  const filteredStates = useMemo(() => {
    return STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));
  }, [stateSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryResult(null);

    if (view === 'login') {
      onLogin(formData.phone, formData.password);
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
        alert('Verification failed. No user registered with the specified details.');
      }
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setFormData({ ...formData, transactionPin: val });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: val });
  };

  const foundUpline = useMemo(() => {
    const code = formData.referralCode.trim().toUpperCase();
    if (!code) return null;
    return users.find(u => u.referralCode && typeof u.referralCode === 'string' && u.referralCode.toUpperCase() === code);
  }, [formData.referralCode, users]);

  return (
    <div className="h-[100dvh] w-full overflow-y-auto no-scrollbar flex flex-col items-center justify-center p-6 relative bg-[#040814] text-slate-100 font-sans">
      {/* Liquid Electric Dark Blue Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-600/15 rounded-full blur-[160px] transition-all"></div>
        <div className="absolute top-[30%] right-[-15%] w-[60%] h-[60%] bg-sky-500/10 rounded-full blur-[180px] transition-all"></div>
        <div className="absolute bottom-[-10%] left-[15%] w-[55%] h-[55%] bg-indigo-600/15 rounded-full blur-[150px] transition-all"></div>
      </div>

      {/* Main Authentication Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm p-10 rounded-[2.5rem] bg-[#0a1226]/90 backdrop-blur-3xl border border-blue-500/20 shadow-[0_0_50px_rgba(29,78,216,0.2)] shadow-blue-950/60 relative z-10"
      >
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" lightText={true} className="justify-center" />
          <p className="text-[9px] text-sky-400 font-bold uppercase tracking-[0.2em] mt-3">
            Unified Portal Gateway
          </p>
        </div>

        {/* View Switches (Login Profile vs Create Account) */}
        <div className="flex gap-1 bg-[#050b18]/80 p-1.5 rounded-xl mb-6 border border-blue-900/40">
          {[
            { id: 'login', label: 'Login Profile' },
            { id: 'signup', label: 'Create Account' }
          ].map(t => (
            <button 
              type="button"
              key={t.id} 
              onClick={() => { setView(t.id as any); setRecoveryResult(null); }}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest",
                (view === t.id || (view.startsWith('recover') && t.id === 'login')) 
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-950/40 border border-blue-400/20" 
                  : "text-sky-200/50 hover:text-sky-250 hover:bg-[#0c1630]/30"
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
              <div className="p-8 rounded-[2rem] border border-blue-900/50 bg-[#050b18] text-center">
                 <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                   <CheckCircle2 size={24} />
                 </div>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Verification Successful</p>
                 <p className="text-sky-300 text-[10px] font-bold uppercase tracking-wider mb-2">Security credentials recovered:</p>
                 <p className="text-2xl font-black text-white select-all font-mono tracking-tight">{recoveryResult}</p>
              </div>
              <button 
                type="button"
                onClick={() => { setView('login'); setRecoveryResult(null); }}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg transition-transform active:scale-95 border border-blue-500/20"
              >
                Return to Login
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key={view}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              {view === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-sky-400 uppercase tracking-wider ml-1">Referral Code (Sponsor Code)</label>
                  <div className="relative">
                    <Share2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/60" />
                    <input
                      type="text"
                      className="w-full pl-11 pr-5 py-3.5 bg-[#050b18]/80 border border-blue-900/50 focus:border-blue-400 text-white focus:ring-4 focus:ring-blue-400/10 focus:outline-none transition-all font-bold text-xs rounded-xl uppercase text-slate-200"
                      placeholder="ENTER REFERRAL CODE"
                      value={formData.referralCode}
                      onChange={(e) => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
                    />
                  </div>
                  {/* Real-time Upline Sponsor Verification preview */}
                  {formData.referralCode.trim() && (
                    <div 
                      className={cn(
                        "mt-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-2 transition-all duration-300",
                        foundUpline 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      )}
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full animate-ping", foundUpline ? "bg-emerald-400" : "bg-rose-400")}></div>
                      <span>
                        {foundUpline ? `✅ Sponsor Active: ${foundUpline.name}` : `❌ Invalid/Unknown Referral Code`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {view === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-sky-400 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/60" />
                    <input
                      type="text"
                      required
                      className="w-full pl-11 pr-5 py-3.5 bg-[#050b18]/80 border border-blue-900/50 focus:border-blue-400 text-white focus:ring-4 focus:ring-blue-400/10 focus:outline-none transition-all font-bold text-xs rounded-xl"
                      placeholder="Enter legal state name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {view === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-sky-400 uppercase tracking-wider ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/60" />
                    <input
                      type="email"
                      required
                      className="w-full pl-11 pr-5 py-3.5 bg-[#050b18]/80 border border-blue-900/50 focus:border-blue-400 text-white focus:ring-4 focus:ring-blue-400/10 focus:outline-none transition-all font-bold text-xs rounded-xl"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {view === 'login' && (
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-sky-400 uppercase tracking-wider ml-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/60" />
                    <input
                      type="text"
                      required
                      className="w-full pl-11 pr-5 py-3.5 bg-[#050b18]/80 border border-blue-900/50 focus:border-blue-400 text-white focus:ring-4 focus:ring-blue-400/10 focus:outline-none transition-all font-bold text-xs rounded-xl"
                      placeholder="Enter 10-digit Mobile Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {(view === 'signup' || view.startsWith('recover')) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-sky-400 uppercase tracking-wider ml-1">Mobile</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400/60" />
                      <input
                        type="tel"
                        required
                        className="w-full pl-9 pr-3.5 py-3 bg-[#050b18]/80 border border-blue-900/50 focus:border-blue-400 text-white focus:ring-4 focus:ring-blue-400/10 focus:outline-none transition-all font-bold text-xs rounded-xl"
                        placeholder="10-digit number"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                      />
                    </div>
                  </div>
                  {view === 'signup' && (
                    <div className="space-y-1 relative">
                      <label className="block text-[9px] font-black text-sky-400 tracking-wider ml-1">State</label>
                      <div 
                        className="w-full px-3.5 py-3 bg-[#050b18]/80 border border-blue-900/50 text-slate-350 cursor-pointer font-bold text-xs truncate flex items-center justify-between rounded-xl"
                        onClick={() => setIsStateOpen(!isStateOpen)}
                      >
                        <span className="truncate">{formData.state || "Select State"}</span>
                        <MapPin size={12} className="text-blue-400/60 shrink-0" />
                      </div>
                      <AnimatePresence>
                        {isStateOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 w-full mb-2 border border-blue-900/50 rounded-xl shadow-2xl z-50 overflow-hidden bg-[#0d162a]"
                          >
                            <input 
                              type="text"
                              className="w-full px-3.5 py-2.5 border-b border-blue-950 bg-[#050b18] text-white text-xs focus:outline-none font-bold"
                              placeholder="Search state..."
                              value={stateSearch}
                              onChange={(e) => setStateSearch(e.target.value)}
                              autoFocus
                            />
                            <div className="max-h-36 overflow-y-auto no-scrollbar">
                              {filteredStates.map(s => (
                                <div 
                                  key={s} 
                                  className="px-3.5 py-2 text-xs font-bold cursor-pointer transition-colors hover:bg-blue-600/30 text-slate-200"
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
                  <label className="block text-[9px] font-black text-sky-400 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/60" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full pl-11 pr-11 py-3.5 bg-[#050b18]/80 border border-blue-900/50 focus:border-blue-400 text-white focus:ring-4 focus:ring-blue-400/10 focus:outline-none transition-all font-bold text-xs rounded-xl"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-sky-350 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  
                  <div className="flex justify-between px-1 pt-1">
                     <button 
                      type="button" 
                      onClick={() => setView('recover-password')}
                      className="text-[8px] font-black text-slate-405 hover:text-sky-400 transition-colors uppercase tracking-widest"
                     >
                       Forgot Password?
                     </button>
                     <button 
                      type="button" 
                      onClick={() => setView('recover-pin')}
                      className="text-[8px] font-black text-slate-405 hover:text-sky-400 transition-colors uppercase tracking-widest"
                     >
                       Forgot PIN?
                     </button>
                  </div>
                </div>
              )}

              {view === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-sky-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400/60" />
                      <input
                        type="password"
                        required
                        className="w-full pl-9 pr-3.5 py-3 bg-[#050b18]/80 border border-blue-900/50 focus:border-blue-400 text-white focus:ring-4 focus:ring-blue-400/10 focus:outline-none transition-all font-bold text-xs rounded-xl"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-sky-400 uppercase tracking-wider ml-1">Trans. PIN</label>
                    <div className="relative">
                      <Key size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400/60" />
                      <input
                        type="password"
                        required
                        inputMode="numeric"
                        pattern="\d{4}"
                        className="w-full pl-9 pr-3 py-3 bg-[#050b18]/80 border border-blue-900/50 focus:border-blue-400 text-white focus:ring-4 focus:ring-blue-400/10 focus:outline-none transition-all font-bold text-xs text-center tracking-[0.4em] rounded-xl"
                        placeholder="0000"
                        value={formData.transactionPin}
                        onChange={handlePinChange}
                      />
                    </div>
                  </div>
                </div>
              )}



              <button
                type="submit"
                className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] mt-4 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-95 transition-all cursor-pointer border border-blue-500/20"
              >
                {view === 'login' ? 'Access Account Engine' : 
                 view === 'signup' ? 'Create Account' : 'Execute Recovery Pipeline'}
                <ArrowRight size={15} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Dynamic View Toggler */}
        <div className="mt-6 text-center border-t border-blue-900/40 pt-4">
          <button
            type="button"
            onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setRecoveryResult(null); }}
            className="text-sky-300 text-[8px] font-black hover:text-sky-400 transition-colors uppercase tracking-[0.15em]"
          >
            {view === 'login' ? "New Partner? Register Network node →" : "← Already Registered? Return to login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
