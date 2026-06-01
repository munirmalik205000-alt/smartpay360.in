import { supabase } from '../services/supabaseClient';
import { Logo } from './Logo';
import React, { useState, useMemo } from 'react';
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
  Sparkle
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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-2 sm:p-4 md:p-8 relative overflow-hidden font-sans">
      
      {/* Premium Visual Dynamic Background Blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] opacity-30 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[75%] h-[75%] opacity-25 bg-gradient-to-br from-indigo-500 via-purple-700 to-pink-600 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Floating stars or nodes for fintech ambiance */}
      <div className="absolute top-[10%] right-[15%] text-purple-400 opacity-20 animate-pulse hidden sm:block">
        <Sparkle className="w-8 h-8" />
      </div>
      <div className="absolute bottom-[15%] left-[10%] text-blue-400 opacity-20 animate-pulse hidden sm:block">
        <Sparkle className="w-6 h-6 animate-bounce" />
      </div>

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl px-4 py-8 sm:px-8 sm:py-10 rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800 relative z-10 mx-auto my-auto overflow-hidden">
        
        {/* Glow accent effect on top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        {/* Brand Section */}
        <div className="text-center mb-6">
          <div className="inline-block transform scale-90 sm:scale-100 transition-transform duration-500 hover:scale-[1.03]">
            <Logo size="lg" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-4 mb-1 text-center font-sans">
            {view === 'login' ? 'Welcome Back!' : 
             view === 'signup' ? 'Create Your Account' :
             view === 'recover-password' ? 'Recover Password' : 'Recover PIN'}
          </h2>
          <p className="text-slate-400 text-[10px] sm:text-xs font-semibold tracking-wider uppercase mt-1">
            {view === 'login' ? 'Login to access your premium portal' : 
             view === 'signup' ? 'Register and unlock unlimited earnings' :
             'Verify your credentials to reset credentials'}
          </p>
        </div>

        {/* Tab Selection */}
        {(view === 'login' || view === 'signup') && (
          <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => setView('login')}
              className={`flex-1 py-2 sm:py-2.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                view === 'login' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Secure Login
            </button>
            <button
              type="button"
              onClick={() => setView('signup')}
              className={`flex-1 py-2 sm:py-2.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                view === 'signup' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up / Register
            </button>
          </div>
        )}

        {recoveryResult ? (
          <div className="space-y-4">
            <div className="bg-emerald-950/40 p-5 rounded-2xl border border-emerald-800 text-center shadow-inner">
              <div className="w-10 h-10 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-sm">
                <ShieldCheck className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Identity Verified</p>
              <p className="text-slate-300 text-xs mb-3 font-medium">Please note your credential securely:</p>
              <div className="bg-slate-950 px-5 py-3 rounded-xl border border-dashed border-emerald-700 inline-block shadow-sm">
                <span className="text-2xl font-extrabold text-blue-400 font-mono tracking-wider select-all">{recoveryResult}</span>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => { setView('login'); setRecoveryResult(null); }}
              className="w-full py-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all duration-200 outline-none shadow-md"
            >
              Back to Secure Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            {view === 'signup' && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                    <User className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 focus:bg-slate-900 text-white font-medium text-xs sm:text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email / Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <Mail className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 focus:bg-slate-900 text-white font-medium text-xs sm:text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="name@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* Mobile / State (Stacked/Responsive grid to never stretch) */}
            {(view === 'signup' || view === 'recover-password' || view === 'recover-pin') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Mobile */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mobile Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                      <Smartphone className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <input
                      type="tel"
                      required
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 focus:bg-slate-900 text-white font-medium text-xs sm:text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                      placeholder="10-digit number"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                {/* State Dropdown (Only on signup) */}
                {view === 'signup' && (
                  <div className="space-y-1 relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">State</label>
                    <div 
                      className="w-full px-4 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-white rounded-xl cursor-pointer font-semibold text-xs sm:text-sm truncate flex items-center justify-between shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all select-none"
                      onClick={() => setIsStateOpen(!isStateOpen)}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                        {formData.state ? <span className="text-white truncate">{formData.state}</span> : <span className="text-slate-600">Select State</span>}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${isStateOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isStateOpen && (
                      <div className="absolute top-[102%] left-0 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <input 
                          type="text"
                          className="w-full px-3 py-2 border-b border-slate-850 text-xs focus:outline-none bg-slate-950 text-white font-bold"
                          placeholder="Search state..."
                          value={stateSearch}
                          onChange={(e) => setStateSearch(e.target.value)}
                          autoFocus
                        />
                        <div className="max-h-36 overflow-y-auto no-scrollbar scroll-smooth">
                          {filteredStates.map(s => (
                            <div 
                              key={s} 
                              className="px-4 py-2.5 hover:bg-blue-600 hover:text-white text-xs font-bold cursor-pointer transition-colors text-slate-300"
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
                            <div className="px-4 py-2 text-xs text-slate-500 italic">No states found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Password input group */}
            {(view === 'login' || view === 'signup') && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                    <Lock className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 focus:bg-slate-900 text-white font-medium text-xs sm:text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Transaction PIN & Sponsor ID */}
            {view === 'signup' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Transaction PIN */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Pin (4 Digits)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                      <KeyRound className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <input
                      type={showPin ? "text" : "password"}
                      required
                      inputMode="numeric"
                      pattern="\d{4}"
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 focus:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 tracking-[0.2em]"
                      placeholder="0000"
                      value={formData.transactionPin}
                      onChange={handlePinChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sponsor ID */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 text-ellipsis overflow-hidden whitespace-nowrap">Referral Code</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                      <UserPlus className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 focus:bg-slate-900 text-white font-medium text-xs sm:text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                      placeholder="Optional"
                      value={formData.referralCode}
                      onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                    />
                  </div>
                </div>

              </div>
            )}

            {/* Helper links */}
            {view === 'login' && (
              <div className="flex justify-between items-center px-1 text-[10px] sm:text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                <button 
                  type="button" 
                  onClick={() => setView('recover-password')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Forgot Password?
                </button>
                <span className="text-slate-800">|</span>
                <button 
                  type="button" 
                  onClick={() => setView('recover-pin')}
                  className="hover:text-purple-400 transition-colors"
                >
                  Forgot PIN?
                </button>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-black rounded-xl shadow-lg shadow-blue-900/30 active:scale-[0.98] transition-all uppercase tracking-widest text-xs mt-3 h-[44px] sm:h-[48px] flex items-center justify-center"
            >
              {view === 'login' ? 'Access Portal Securely' : 
               view === 'signup' ? 'Complete Registration' : 'Verify Identity'}
            </button>
          </form>
        )}

        {/* Alternate Navigation */}
        {(view === 'recover-password' || view === 'recover-pin' || recoveryResult) && (
          <div className="mt-6 text-center border-t border-slate-850 pt-4">
            <button
              type="button"
              onClick={() => { setView('login'); setRecoveryResult(null); }}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Secure Login
            </button>
          </div>
        )}

        {/* Footer Prompts */}
        {view === 'login' && (
          <div className="mt-6 text-center border-t border-slate-850 pt-4">
            <button
              type="button"
              onClick={() => { setView('signup'); setRecoveryResult(null); }}
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors uppercase tracking-wider"
            >
              <span>Don't have an account?</span>
              <span className="text-blue-400 underline underline-offset-4 font-black">Register Now</span>
            </button>
          </div>
        )}

        {view === 'signup' && (
          <div className="mt-6 text-center border-t border-slate-850 pt-4">
            <button
              type="button"
              onClick={() => { setView('login'); setRecoveryResult(null); }}
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors uppercase tracking-wider"
            >
              <span>Already registered?</span>
              <span className="text-blue-400 underline underline-offset-4 font-black">Secure Login</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Auth;
