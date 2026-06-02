import { supabase } from '../services/supabaseClient';
import { Logo } from './Logo';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Smartphone, 
  MapPin, 
  Lock, 
  KeyRound, 
  UserPlus, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles,
  CreditCard,
  Send,
  SmartphoneNfc
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [sponsorName, setSponsorName] = useState<string>('');
  const [isSearchingSponsor, setIsSearchingSponsor] = useState(false);
  
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
    const delayDebounce = setTimeout(async () => {
      const code = formData.referralCode?.trim();
      if (!code) {
        setSponsorName('');
        return;
      }
      setIsSearchingSponsor(true);
      try {
        const searchVal = code.toLowerCase();
        // Look up all profiles to do an accurate client-side mapping for search flexibility
        const { data, error } = await supabase
          .from('users')
          .select('id, username, email');
          
        if (data && data.length > 0) {
          const matched = data.find(u => 
            u.id.toLowerCase().startsWith(searchVal) || 
            (u.username && u.username.toLowerCase() === searchVal) || 
            (u.email && u.email.toLowerCase().includes(searchVal)) ||
            (u.email && u.email.split('@')[0].toLowerCase() === searchVal)
          );
          if (matched) {
            setSponsorName(matched.username || matched.email.split('@')[0]);
          } else {
            setSponsorName('Invalid Sponsor');
          }
        } else {
          setSponsorName('Invalid Sponsor');
        }
      } catch (err) {
        console.error("Referral Lookup failed:", err);
        setSponsorName('');
      } finally {
        setIsSearchingSponsor(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [formData.referralCode]);

  const filteredStates = useMemo(() => {
    return STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));
  }, [stateSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'login') {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password || ''
        });
        if (error) throw error;
      } catch (err: any) {
        alert("Login failed: " + err.message);
      }
    } else if (view === 'signup') {
      if (formData.transactionPin.length !== 4) {
        alert('Transaction PIN must be exactly 4 digits.');
        return;
      }
      if (!formData.state) {
        alert('Please select your state.');
        return;
      }
      try {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.name
            }
          }
        });
        if (error) throw error;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('users').update({
            mobile: formData.phone,
            sponsor_id: formData.referralCode || null,
            rank_name: 'Starter',
            wallet_balance: 0,
            earning_wallet: 0,
            recharge_wallet: 0,
            self_pv: 0,
            team_pv: 0,
            direct_count: 0,
            is_active: false
          }).eq('id', user.id);
        }
        alert('Registration successful! Check your email or try logging in.');
        setView('login');
      } catch (err: any) {
        alert("Signup failed: " + err.message);
      }
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#110c24] via-[#090518] to-[#04020a] p-3 sm:p-5 relative overflow-y-auto font-sans">
      
      {/* PhonePe Inspired Interactive Cyber Aura */}
      <div className="absolute top-[-30%] left-[-20%] w-[90%] h-[90%] opacity-40 bg-gradient-to-tr from-[#673ab7] via-[#5f259f] to-[#00baf2] rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-[-35%] right-[-20%] w-[90%] h-[90%] opacity-35 bg-gradient-to-br from-[#120e2e] via-[#4f46e5] to-[#7c3aed] rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Decorative Brand Vectors */}
      <div className="absolute top-[8%] left-[8%] text-purple-500/20 animate-pulse hidden lg:block">
        <SmartphoneNfc className="w-14 h-14 stroke-[1]" />
      </div>
      <div className="absolute bottom-[8%] right-[8%] text-[#00baf2]/20 animate-pulse hidden lg:block">
        <CreditCard className="w-14 h-14 stroke-[1]" />
      </div>

      <div className="w-full max-w-[390px] bg-[#1a1438]/90 backdrop-blur-2xl px-4.5 py-5 sm:px-8 sm:py-7 rounded-2.5xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-violet-500/25 relative z-10 mx-auto my-auto overflow-hidden">
        
        {/* PhonePe/Paytm Classic Golden Accent Stroke on Top & Bottom */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#5f259f] via-violet-600 to-[#00baf2]" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ffffff05]" />

        {/* Brand Section */}
        <div className="text-center mb-4.5">
          <div className="inline-block transform scale-[0.80] sm:scale-95 transition-transform duration-500 hover:scale-[1.01]">
            <Logo size="sm" />
          </div>
          
          <div className="mt-2 flex items-center justify-center gap-1 bg-[#231a4c] w-fit mx-auto px-3 py-1 rounded-full border border-violet-500/30 shadow-inner">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span className="text-[9px] text-[#00baf2] font-black uppercase tracking-widest">
              {view === 'login' ? 'WELCOME TO SMARTPAY360' : view === 'signup' ? 'EARN LEVEL PENALTIES & CASH' : 'CREDENTIALS LOOKUP'}
            </span>
          </div>

          <p className="text-slate-400 text-[10px] font-semibold tracking-wide mt-1.5 leading-snug">
            {view === 'login' ? 'Pay bills, recharges & manage your downline network instantly.' : 
             view === 'signup' ? 'Complete fast 10-level binary business matrix signup.' :
             'Secure recovery using authenticated database ledger keys.'}
          </p>
        </div>

        {/* Tab Selection */}
        {(view === 'login' || view === 'signup') && (
          <div className="flex bg-[#0b081c] p-0.5 rounded-xl mb-4.5 border border-white/[0.04]">
            <button
              type="button"
              onClick={() => setView('login')}
              className={`flex-1 py-1.5 sm:py-2 text-[11px] font-black rounded-lg transition-all duration-300 ${
                view === 'login' 
                  ? 'bg-gradient-to-r from-[#5f259f] to-[#00baf2] text-white shadow-md' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              Secure Login
            </button>
            <button
              type="button"
              onClick={() => setView('signup')}
              className={`flex-1 py-1.5 sm:py-2 text-[11px] font-black rounded-lg transition-all duration-300 ${
                view === 'signup' 
                  ? 'bg-gradient-to-r from-[#5f259f] to-[#00baf2] text-white shadow-md' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              New Sign Up
            </button>
          </div>
        )}

        {recoveryResult ? (
          <div className="space-y-3.5">
            <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800 text-center shadow-inner">
              <div className="w-9 h-9 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-400 shadow-sm">
                <ShieldCheck className="w-4 h-4 animate-pulse" />
              </div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Identity Verified</p>
              <p className="text-slate-300 text-xs mb-2 font-medium">Please note your digital credential securely:</p>
              <div className="bg-slate-950 px-5 py-2 rounded-xl border border-dashed border-emerald-700 inline-block shadow-sm">
                <span className="text-xl font-extrabold text-[#00baf2] font-mono tracking-wider select-all">{recoveryResult}</span>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => { setView('login'); setRecoveryResult(null); }}
              className="w-full py-2 bg-gradient-to-r from-[#5f259f] to-[#00baf2] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all duration-200 outline-none shadow-md"
            >
              Back to Secure Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2.5">
            
            {/* Referral Code (Sponsor ID) at absolute top */}
            {view === 'signup' && (
              <div className="space-y-0.5">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Referral Code (Sponsor ID)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-violet-400/70 group-focus-within:text-[#00baf2] transition-colors">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-8.5 pr-24 py-1.5 bg-[#0b081c] border border-violet-500/10 focus:border-[#00baf2] text-white font-medium text-xs rounded-xl focus:ring-2 focus:ring-[#00baf2]/20 outline-none transition-all placeholder:text-slate-700 shadow-inner"
                    placeholder="Sponsor ID / Referral Code"
                    value={formData.referralCode}
                    onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                  />
                  {formData.referralCode && (
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none z-10">
                      {isSearchingSponsor ? (
                        <span className="text-[9px] text-[#00baf2] font-semibold animate-pulse">Checking...</span>
                      ) : sponsorName ? (
                        <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded truncate max-w-[90px] ${
                          sponsorName === 'Invalid Sponsor' ? 'text-rose-400 bg-rose-950/40 border border-rose-900/30' : 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/30'
                        }`}>
                          👤 {sponsorName}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Full Name */}
            {view === 'signup' && (
              <div className="space-y-0.5">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-violet-400/70 group-focus-within:text-[#00baf2] transition-colors">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-8.5 pr-4 py-1.5 bg-[#0b081c] border border-violet-500/10 focus:border-[#00baf2] text-white font-medium text-xs rounded-xl focus:ring-2 focus:ring-[#00baf2]/20 outline-none transition-all placeholder:text-slate-700 shadow-inner"
                    placeholder="E.g. Munir Malik"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-0.5">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email / Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-violet-400/70 group-focus-within:text-[#00baf2] transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-8.5 pr-4 py-1.5 bg-[#0b081c] border border-violet-500/10 focus:border-[#00baf2] text-white font-medium text-xs rounded-xl focus:ring-2 focus:ring-[#00baf2]/20 outline-none transition-all placeholder:text-slate-700 shadow-inner"
                  placeholder="name@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* Mobile / State (Stacked tightly or grouped) */}
            {(view === 'signup' || view === 'recover-password' || view === 'recover-pin') && (
              <div className="grid grid-cols-2 gap-2">
                
                {/* Mobile */}
                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mobile</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-violet-400/70 group-focus-within:text-[#00baf2] transition-colors">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      required
                      className="w-full pl-7.5 pr-2 py-1.5 bg-[#0b081c] border border-violet-500/10 focus:border-[#00baf2] text-white font-medium text-xs rounded-xl focus:ring-2 focus:ring-[#00baf2]/20 outline-none transition-all placeholder:text-slate-700 shadow-inner"
                      placeholder="10-digit"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                {/* State Dropdown (Only on signup) */}
                {view === 'signup' && (
                  <div className="space-y-0.5 relative">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">State</label>
                    <div 
                      className="w-full px-2.5 py-1.5 bg-[#0b081c] border border-violet-500/10 hover:border-violet-500/30 text-white rounded-xl cursor-pointer font-semibold text-xs truncate flex items-center justify-between shadow-inner focus:ring-2 focus:ring-[#00baf2]/20 transition-all select-none"
                      onClick={() => setIsStateOpen(!isStateOpen)}
                    >
                      <span className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-[#00baf2] shrink-0" />
                        {formData.state ? <span className="text-white truncate">{formData.state}</span> : <span className="text-slate-500">Pick State</span>}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${isStateOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isStateOpen && (
                      <div className="absolute top-[102%] left-0 w-full bg-[#161033] border border-violet-900/50 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <input 
                          type="text"
                          className="w-full px-2 py-1 border-b border-violet-950 text-[10px] focus:outline-none bg-[#0b081c] text-white font-bold"
                          placeholder="Search..."
                          value={stateSearch}
                          onChange={(e) => setStateSearch(e.target.value)}
                          autoFocus
                        />
                        <div className="max-h-28 overflow-y-auto no-scrollbar scroll-smooth">
                          {filteredStates.map(s => (
                            <div 
                              key={s} 
                              className="px-2.5 py-1.5 hover:bg-[#5f259f] hover:text-white text-[10px] font-bold cursor-pointer transition-colors text-slate-300"
                              onClick={() => {
                                setFormData({...formData, state: s});
                                setIsStateOpen(false);
                                setStateSearch('');
                              }}
                            >
                              {s}
                            </div>
                          ))}
                          {filteredStates.length === 0 && (
                            <div className="px-2 py-1.5 text-[10px] text-slate-500 italic">None found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Password input */}
            {(view === 'login' || view === 'signup') && (
              <div className="space-y-0.5">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-violet-400/70 group-focus-within:text-[#00baf2] transition-colors">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-8.5 pr-8 py-1.5 bg-[#0b081c] border border-violet-500/10 focus:border-[#00baf2] text-white font-medium text-xs rounded-xl focus:ring-2 focus:ring-[#00baf2]/20 outline-none transition-all placeholder:text-slate-700 shadow-inner"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Transaction PIN */}
            {view === 'signup' && (
              <div className="space-y-0.5">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">UPI PIN (4 digit)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-violet-400/70 group-focus-within:text-[#00baf2] transition-colors">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPin ? "text" : "password"}
                    required
                    inputMode="numeric"
                    pattern="\d{4}"
                    className="w-full pl-8.5 pr-8 py-1.5 bg-[#0b081c] border border-violet-500/10 focus:border-[#00baf2] text-white font-bold text-xs rounded-xl focus:ring-2 focus:ring-[#00baf2]/20 outline-none transition-all placeholder:text-slate-700 tracking-[0.2em] shadow-inner text-center"
                    placeholder="0000"
                    value={formData.transactionPin}
                    onChange={handlePinChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Helper links */}
            {view === 'login' && (
              <div className="flex justify-between items-center px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide py-0.5">
                <button 
                  type="button" 
                  onClick={() => setView('recover-password')}
                  className="hover:text-[#00baf2] transition-colors"
                >
                  Forgot Password?
                </button>
                <span className="text-violet-900/40">|</span>
                <button 
                  type="button" 
                  onClick={() => setView('recover-pin')}
                  className="hover:text-[#00baf2] transition-colors"
                >
                  Forgot PIN?
                </button>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-[#5f259f] to-[#00baf2] hover:opacity-95 text-white font-black rounded-xl shadow-lg active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] mt-2 h-[38px] flex items-center justify-center gap-2 border border-white/10"
            >
              <span>{view === 'login' ? 'Proceed To Secure Login' : 
                     view === 'signup' ? 'Complete Fast Sign Up' : 'Verify My Identity'}</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        )}

        {/* Alternate Navigation back link */}
        {(view === 'recover-password' || view === 'recover-pin' || recoveryResult) && (
          <div className="mt-4 text-center border-t border-violet-900/30 pt-3">
            <button
              type="button"
              onClick={() => { setView('login'); setRecoveryResult(null); }}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Secure Login
            </button>
          </div>
        )}

        {/* Footer prompts */}
        {view === 'login' && (
          <div className="mt-4 text-center border-t border-violet-900/30 pt-3">
            <button
              type="button"
              onClick={() => { setView('signup'); setRecoveryResult(null); }}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-[#00baf2] transition-colors uppercase tracking-wider"
            >
              <span>Welcome To Smartpay360?</span>
              <span className="text-amber-400 underline underline-offset-4 font-black">Open account</span>
            </button>
          </div>
        )}

        {view === 'signup' && (
          <div className="mt-4 text-center border-t border-violet-900/30 pt-3">
            <button
              type="button"
              onClick={() => { setView('login'); setRecoveryResult(null); }}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-[#00baf2] transition-colors uppercase tracking-wider"
            >
              <span>Already registered?</span>
              <span className="text-[#00baf2] underline underline-offset-4 font-black">Login securely</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Auth;
