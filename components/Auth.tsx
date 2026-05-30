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
  onEnsureSponsor?: (code: string) => void;
}

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const Auth: React.FC<AuthProps> = ({ onLogin, onSignup, onRecover, users, onEnsureSponsor }) => {
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

  useEffect(() => {
    const code = String(formData.referralCode || '').trim().toUpperCase();
    if (code.length < 2) return;
    
    // Check if the sponsor code already exists in users
    const exists = users.some(u => u && u.referralCode && String(u.referralCode).trim().toUpperCase() === code);
    
    if (!exists && onEnsureSponsor) {
      onEnsureSponsor(code);
    }
  }, [formData.referralCode, users, onEnsureSponsor]);

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
    <div className="min-h-[100dvh] w-full overflow-y-auto no-scrollbar flex flex-col items-center justify-center py-6 px-4 sm:p-6 relative bg-gradient-to-br from-blue-50 via-white to-blue-100 text-[#000000] font-sans">
      {/* Liquid Soft Blue Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[65%] h-[65%] bg-blue-400/20 rounded-full blur-[120px] transition-all animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[65%] h-[65%] bg-sky-300/20 rounded-full blur-[120px] transition-all animate-pulse duration-5000"></div>
      </div>

      {/* Main Authentication Card - Clean Crisp White & Blue Plate */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm p-6 sm:p-8 rounded-[2rem] bg-white border-2 border-blue-600/15 shadow-[0_20px_40px_rgba(0,119,192,0.1)] relative z-10 overflow-hidden"
      >
        {/* Accent beautiful solid blue top line bar */}
        <div className="absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-blue-600 to-sky-500 shadow-[0_2px_8px_rgba(37,99,235,0.2)]">
        </div>

        {/* Branding Header */}
        <div className="flex flex-col items-center text-center mb-5 mt-2">
          {/* We ensure logo rendering is clean and dark text compliant */}
          <Logo size="lg" lightText={false} className="justify-center" />
          <p className="text-[10px] text-blue-700 font-extrabold uppercase tracking-[0.2em] mt-3.5 bg-blue-50 px-3.5 py-1.2 rounded-full border border-blue-200/60">
            Unified Portal Gateway
          </p>
        </div>

        {/* View Switches (Login Profile vs Create Account) */}
        <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl mb-5 border border-slate-200 shadow-inner">
          {[
            { id: 'login', label: 'Login Profile' },
            { id: 'signup', label: 'Create Account' }
          ].map(t => (
            <button 
              type="button"
              key={t.id} 
              onClick={() => { setView(t.id as any); setRecoveryResult(null); }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all duration-300 uppercase tracking-widest cursor-pointer",
                (view === t.id || (view.startsWith('recover') && t.id === 'login')) 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/15 border border-blue-600/10" 
                  : "text-slate-500 hover:text-black hover:bg-white/60"
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
              <div className="p-6 rounded-3xl border border-green-200 bg-green-50/50 text-center shadow-inner">
                 <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-md shadow-green-750/20">
                   <CheckCircle2 size={24} />
                 </div>
                 <p className="text-[11px] font-black text-green-800 uppercase tracking-widest mb-2">Verification Successful</p>
                 <p className="text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-2">Security credentials recovered:</p>
                 <p className="text-2xl font-black text-green-800 select-all font-mono tracking-tight">{recoveryResult}</p>
              </div>
              <button 
                type="button"
                onClick={() => { setView('login'); setRecoveryResult(null); }}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg hover:scale-102 transition-all active:scale-98 border border-blue-700/20 cursor-pointer"
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
              className="space-y-4 text-[#000000]"
            >
              {view === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-[#000000] uppercase tracking-wider ml-1">Referral Code (Sponsor Code)</label>
                  <div className="relative">
                    <Share2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
                    <input
                      type="text"
                      className="w-full pl-11 pr-5 py-3.5 bg-white border-2 border-slate-200 focus:border-blue-600 text-[#000000] font-black text-xs rounded-2xl uppercase focus:outline-none transition-all shadow-sm focus:ring-4 focus:ring-blue-105"
                      placeholder="ENTER REFERRAL CODE"
                      value={formData.referralCode}
                      onChange={(e) => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
                    />
                  </div>
                  {/* Real-time Upline Sponsor Verification preview as dark Green / red */}
                  {formData.referralCode.trim() && (
                    <div 
                      className={cn(
                        "mt-1.5 px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-2 transition-all duration-300",
                        foundUpline 
                          ? "bg-green-50/70 border-green-200 text-green-800" 
                          : "bg-red-50/70 border-red-200 text-red-650"
                      )}
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full", foundUpline ? "bg-green-700 animate-ping" : "bg-red-600")} />
                      <span>
                        {foundUpline ? `✅ Sponsor Active: ${foundUpline.name}` : `❌ Invalid Sponsor Code`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {view === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-[#000000] uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
                    <input
                      type="text"
                      required
                      className="w-full pl-11 pr-5 py-3.5 bg-white border-2 border-slate-200 focus:border-blue-600 text-[#000000] font-black text-xs rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-105 transition-all shadow-sm"
                      placeholder="Enter legal state name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {view === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-[#000000] uppercase tracking-wider ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
                    <input
                      type="email"
                      required
                      className="w-full pl-11 pr-5 py-3.5 bg-white border-2 border-slate-200 focus:border-blue-600 text-[#000000] font-black text-xs rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-105 transition-all shadow-sm"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {view === 'login' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-[#000000] uppercase tracking-wider ml-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
                    <input
                      type="text"
                      required
                      className="w-full pl-11 pr-5 py-3.5 bg-white border-2 border-slate-200 focus:border-blue-600 text-[#000000] font-black text-xs rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-105 transition-all shadow-sm animate-fade-in"
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
                    <label className="block text-[10px] font-black text-[#000000] uppercase tracking-wider ml-1">Mobile</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                      <input
                        type="tel"
                        required
                        className="w-full pl-8 pr-2 py-3.5 bg-white border-2 border-slate-200 focus:border-blue-600 text-[#000000] font-black text-xs rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-105 transition-all shadow-sm"
                        placeholder="10 digits"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                      />
                    </div>
                  </div>
                  {view === 'signup' && (
                    <div className="space-y-1 relative">
                      <label className="block text-[10px] font-black text-[#000000] tracking-wider ml-1">State</label>
                      <div 
                        className="w-full px-3 py-3.5 bg-white border-2 border-slate-200 text-slate-800 cursor-pointer font-black text-xs truncate flex items-center justify-between rounded-2xl shadow-sm hover:border-blue-400 transition-all duration-300"
                        onClick={() => setIsStateOpen(!isStateOpen)}
                      >
                        <span className="truncate">{formData.state || "Select State"}</span>
                        <MapPin size={12} className="text-blue-600 shrink-0" />
                      </div>
                      <AnimatePresence>
                        {isStateOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 w-full mb-2 border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden bg-white"
                          >
                            <input 
                              type="text"
                              className="w-full px-3 py-2.5 border-b border-slate-200 bg-slate-50 text-[#000000] font-black text-xs focus:outline-none"
                              placeholder="Search state..."
                              value={stateSearch}
                              onChange={(e) => setStateSearch(e.target.value)}
                              autoFocus
                            />
                            <div className="max-h-36 overflow-y-auto no-scrollbar">
                              {filteredStates.map(s => (
                                <div 
                                  key={s} 
                                  className="px-4 py-2 text-xs font-black cursor-pointer transition-colors hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white text-slate-700"
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
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-[#000000] uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full pl-11 pr-11 py-3.5 bg-white border-2 border-slate-200 focus:border-blue-600 text-[#000000] font-black text-xs rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-105 transition-all shadow-sm"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  
                  {/* Forgot Password and Forgot PIN as red text */}
                  <div className="flex justify-between px-1.5 pt-1.5">
                     <button 
                      type="button" 
                      onClick={() => setView('recover-password')}
                      className="text-[9px] font-black text-red-600 hover:text-red-800 hover:underline transition-colors uppercase tracking-widest cursor-pointer"
                     >
                       Forgot Password?
                     </button>
                     <button 
                      type="button" 
                      onClick={() => setView('recover-pin')}
                      className="text-[9px] font-black text-red-600 hover:text-red-800 hover:underline transition-colors uppercase tracking-widest cursor-pointer"
                     >
                       Forgot PIN?
                     </button>
                  </div>
                </div>
              )}

              {view === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-[#000000] uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                      <input
                        type="password"
                        required
                        className="w-full pl-8 pr-2 py-3.5 bg-white border-2 border-slate-200 focus:border-blue-600 text-[#000000] font-black text-xs rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-105 transition-all shadow-sm"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-[#000000] uppercase tracking-wider ml-1">Trans. PIN</label>
                    <div className="relative">
                      <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                      <input
                        type="password"
                        required
                        inputMode="numeric"
                        pattern="\d{4}"
                        className="w-full pl-8 pr-2 py-3.5 bg-white border-2 border-slate-200 focus:border-blue-600 text-[#000000] font-black text-xs text-center tracking-[0.2em] rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-105 transition-all shadow-sm"
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
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] mt-4 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 shadow-md shadow-blue-500/10 active:scale-95 transition-all duration-300 cursor-pointer border border-blue-800/25"
              >
                {view === 'login' ? 'Access Account Engine' : 
                 view === 'signup' ? 'Create Account' : 'Execute Recovery Pipeline'}
                <ArrowRight size={15} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Dynamic View Toggler - Red or blue accented */}
        <div className="mt-6 text-center border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setRecoveryResult(null); }}
            className="text-blue-700 text-[10px] font-black hover:text-blue-900 transition-colors uppercase tracking-widest cursor-pointer"
          >
            {view === 'login' ? "New Partner? Register Network node →" : "← Already Registered? Return to login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
