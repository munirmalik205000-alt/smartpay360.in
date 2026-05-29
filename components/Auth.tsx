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
    const code = String(formData.referralCode || '').trim().toUpperCase();
    if (!code) return null;
    return users.find(u => {
      if (!u || !u.referralCode) return false;
      return String(u.referralCode).trim().toUpperCase() === code;
    });
  }, [formData.referralCode, users]);

  return (
    <div className="min-h-[100dvh] w-full overflow-y-auto no-scrollbar flex flex-col items-center justify-center py-6 px-4 sm:p-6 relative bg-[#030611] text-slate-100 font-sans">
      {/* Liquid Electric Glowing Orbs: White base, Blue, Purple, Green, Red, Orange */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dynamic Glowing 3D backdrop blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/15 rounded-full blur-[150px] transition-all animate-pulse"></div>
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/15 rounded-full blur-[150px] transition-all animate-pulse duration-5000"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[140px] transition-all"></div>
        <div className="absolute top-[40%] left-[25%] w-[40%] h-[40%] bg-rose-500/8 rounded-full blur-[130px] transition-all animate-bounce duration-[8000ms]"></div>
        <div className="absolute bottom-[5%] right-[10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[140px] transition-all"></div>
      </div>

      {/* Main Authentication Card - 3D Engineered Floating Glass */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm p-5 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-slate-900/75 backdrop-blur-3xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8),_inset_0_1px_2px_rgba(255,255,255,0.15)] relative z-10 overflow-hidden"
      >
        {/* Accent spectrum top bar (White, Blue, Purple, Green, Red, Orange) with beautiful 3D glow */}
        <div className="absolute top-0 left-0 right-0 h-[5px] flex shadow-[0_3px_12px_rgba(37,99,235,0.4)]">
          <div className="w-[16%] h-full bg-white"></div>
          <div className="w-[17%] h-full bg-blue-500"></div>
          <div className="w-[17%] h-full bg-purple-600"></div>
          <div className="w-[17%] h-full bg-emerald-500"></div>
          <div className="w-[17%] h-full bg-rose-500"></div>
          <div className="w-[16%] h-full bg-orange-500"></div>
        </div>
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center mb-4 sm:mb-6 mt-1 sm:mt-2">
          <Logo size="lg" lightText={true} className="justify-center" />
          <p className="text-[9px] text-sky-400 font-extrabold uppercase tracking-[0.25em] mt-2.5 sm:mt-3 bg-blue-950/45 px-3 py-1 rounded-full border border-blue-900/40">
            Unified Portal Gateway
          </p>
        </div>

        {/* View Switches (Login Profile vs Create Account) */}
        <div className="flex gap-1 bg-slate-950/80 p-1 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 border border-white/5 shadow-inner">
          {[
            { id: 'login', label: 'Login Profile' },
            { id: 'signup', label: 'Create Account' }
          ].map(t => (
            <button 
              type="button"
              key={t.id} 
              onClick={() => { setView(t.id as any); setRecoveryResult(null); }}
              className={cn(
                "flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] font-extrabold transition-all duration-300 uppercase tracking-widest cursor-pointer",
                (view === t.id || (view.startsWith('recover') && t.id === 'login')) 
                  ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-[0_8px_20px_rgba(139,92,246,0.3)] border border-white/10" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
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
              <div className="p-8 rounded-[2.5rem] border border-white/10 bg-slate-950/90 text-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
                 <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                   <CheckCircle2 size={24} />
                 </div>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Verification Successful</p>
                 <p className="text-sky-300 text-[10px] font-bold uppercase tracking-wider mb-2">Security credentials recovered:</p>
                 <p className="text-2xl font-black text-white select-all font-mono tracking-tight">{recoveryResult}</p>
              </div>
              <button 
                type="button"
                onClick={() => { setView('login'); setRecoveryResult(null); }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 border border-white/15"
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
              className="space-y-3 sm:space-y-4"
            >
              {view === 'signup' && (
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-[9px] font-extrabold text-sky-400 uppercase tracking-wider ml-1">Referral Code (Sponsor Code)</label>
                  <div className="relative">
                    <Share2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/80" />
                    <input
                      type="text"
                      className="w-full pl-11 pr-5 py-2.5 sm:py-3.5 bg-slate-950/80 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white focus:outline-none transition-all font-bold text-xs rounded-xl sm:rounded-2xl uppercase text-slate-100 shadow-inner"
                      placeholder="ENTER REFERRAL CODE"
                      value={formData.referralCode}
                      onChange={(e) => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
                    />
                  </div>
                  {/* Real-time Upline Sponsor Verification preview */}
                  {formData.referralCode.trim() && (
                    <div 
                      className={cn(
                        "mt-1 px-3 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider border flex items-center gap-2 transition-all duration-300",
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
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-[9px] font-extrabold text-sky-400 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/80" />
                    <input
                      type="text"
                      required
                      className="w-full pl-11 pr-5 py-2.5 sm:py-3.5 bg-slate-950/80 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white focus:outline-none transition-all font-bold text-xs rounded-xl sm:rounded-2xl shadow-inner"
                      placeholder="Enter legal state name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {view === 'signup' && (
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-[9px] font-extrabold text-sky-400 uppercase tracking-wider ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/80" />
                    <input
                      type="email"
                      required
                      className="w-full pl-11 pr-5 py-2.5 sm:py-3.5 bg-slate-950/80 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white focus:outline-none transition-all font-bold text-xs rounded-xl sm:rounded-2xl shadow-inner"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {view === 'login' && (
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-[9px] font-extrabold text-sky-400 uppercase tracking-wider ml-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/80" />
                    <input
                      type="text"
                      required
                      className="w-full pl-11 pr-5 py-2.5 sm:py-3.5 bg-slate-950/80 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-white focus:outline-none transition-all font-bold text-xs rounded-xl sm:rounded-2xl shadow-inner animate-fade-in"
                      placeholder="Enter 10-digit Mobile Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {(view === 'signup' || view.startsWith('recover')) && (
                <div className="grid grid-cols-2 gap-2 sm:gap-3.5">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-[9px] font-extrabold text-sky-400 uppercase tracking-wider ml-1">Mobile</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/80" />
                      <input
                        type="tel"
                        required
                        className="w-full pl-8 pr-2 py-2.5 sm:py-3.5 bg-slate-950/80 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-white focus:outline-none transition-all font-bold text-xs rounded-xl sm:rounded-2xl shadow-inner"
                        placeholder="10 digits"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                      />
                    </div>
                  </div>
                  {view === 'signup' && (
                    <div className="space-y-1 sm:space-y-1.5 relative">
                      <label className="block text-[9px] font-extrabold text-sky-400 tracking-wider ml-1">State</label>
                      <div 
                        className="w-full px-3 py-2.5 sm:py-3.5 bg-slate-950/85 border border-white/10 text-slate-200 cursor-pointer font-bold text-xs truncate flex items-center justify-between rounded-xl sm:rounded-2xl shadow-inner hover:border-white/20 transition-all duration-300"
                        onClick={() => setIsStateOpen(!isStateOpen)}
                      >
                        <span className="truncate">{formData.state || "Select State"}</span>
                        <MapPin size={12} className="text-blue-400/85 shrink-0" />
                      </div>
                      <AnimatePresence>
                        {isStateOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 w-full mb-2 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl z-50 overflow-hidden bg-slate-900"
                          >
                            <input 
                              type="text"
                              className="w-full px-3 py-2 sm:px-4 sm:py-3 border-b border-white/10 bg-slate-950 text-white text-xs focus:outline-none font-bold"
                              placeholder="Search state..."
                              value={stateSearch}
                              onChange={(e) => setStateSearch(e.target.value)}
                              autoFocus
                            />
                            <div className="max-h-28 sm:max-h-36 overflow-y-auto no-scrollbar">
                              {filteredStates.map(s => (
                                <div 
                                  key={s} 
                                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold cursor-pointer transition-colors hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white text-slate-200"
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
                <div className="space-y-1 sm:space-y-2">
                  <label className="block text-[9px] font-extrabold text-sky-400 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/80" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full pl-11 pr-11 py-2.5 sm:py-3.5 bg-slate-950/80 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-white focus:outline-none transition-all font-bold text-xs rounded-xl sm:rounded-2xl shadow-inner"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-sky-300 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  
                  <div className="flex justify-between px-1.5 pt-1">
                     <button 
                      type="button" 
                      onClick={() => setView('recover-password')}
                      className="text-[8px] font-black text-slate-400 hover:text-sky-400 transition-colors uppercase tracking-widest cursor-pointer"
                     >
                       Forgot Password?
                     </button>
                     <button 
                      type="button" 
                      onClick={() => setView('recover-pin')}
                      className="text-[8px] font-black text-slate-400 hover:text-sky-400 transition-colors uppercase tracking-widest cursor-pointer"
                     >
                       Forgot PIN?
                     </button>
                  </div>
                </div>
              )}

              {view === 'signup' && (
                <div className="grid grid-cols-2 gap-2 sm:gap-3.5">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-[9px] font-extrabold text-sky-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/80" />
                      <input
                        type="password"
                        required
                        className="w-full pl-8 pr-2 py-2.5 sm:py-3.5 bg-slate-950/80 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-white focus:outline-none transition-all font-bold text-xs rounded-xl sm:rounded-2xl shadow-inner"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-[9px] font-extrabold text-sky-400 uppercase tracking-wider ml-1">Trans. PIN</label>
                    <div className="relative">
                      <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/80" />
                      <input
                        type="password"
                        required
                        inputMode="numeric"
                        pattern="\d{4}"
                        className="w-full pl-8 pr-2 py-2.5 sm:py-3.5 bg-slate-950/80 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 text-white focus:outline-none transition-all font-bold text-xs text-center tracking-[0.2em] rounded-xl sm:rounded-2xl shadow-inner"
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
                className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] mt-2 sm:mt-4 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-550 hover:to-purple-505 shadow-[0_4px_25px_rgba(37,99,235,0.4)] hover:shadow-[0_4px_30px_rgba(139,92,246,0.6)] active:scale-95 transition-all duration-300 cursor-pointer border border-white/10"
              >
                {view === 'login' ? 'Access Account Engine' : 
                 view === 'signup' ? 'Create Account' : 'Execute Recovery Pipeline'}
                <ArrowRight size={15} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Dynamic View Toggler */}
        <div className="mt-4 sm:mt-6 text-center border-t border-white/5 pt-3 sm:pt-4">
          <button
            type="button"
            onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setRecoveryResult(null); }}
            className="text-sky-305 text-[8.5px] font-extrabold hover:text-sky-300 transition-colors uppercase tracking-[0.15em] cursor-pointer"
          >
            {view === 'login' ? "New Partner? Register Network node →" : "← Already Registered? Return to login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
