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
  AlertCircle 
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4 md:p-8 relative overflow-hidden font-sans">
      
      {/* Decorative ambient background blur vectors */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] opacity-20 bg-gradient-to-tr from-sky-400 to-indigo-600 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] opacity-15 bg-gradient-to-br from-indigo-500 to-purple-800 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-md px-6 py-10 md:px-12 md:py-14 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.1)] border border-slate-100 relative z-10">
        
        {/* Upper Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-block transition-transform duration-500 hover:scale-[1.02]">
            <Logo size="lg" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-6 mb-1 text-center font-sans">
            {view === 'login' ? 'Welcome Back!' : 
             view === 'signup' ? 'Create Your Account' :
             view === 'recover-password' ? 'Recover Password' : 'Recover PIN'}
          </h2>
          <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mt-1">
            {view === 'login' ? 'Login to access your high-speed gateway' : 
             view === 'signup' ? 'Register and jump into the earning network' :
             'Verify your network details to proceed'}
          </p>
        </div>

        {/* Tab Selection (only show when not in recovery) */}
        {(view === 'login' || view === 'signup') && (
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button
              onClick={() => setView('login')}
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all duration-300 ${
                view === 'login' 
                  ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Secure Login
            </button>
            <button
              onClick={() => setView('signup')}
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all duration-300 ${
                view === 'signup' 
                  ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up / Register
            </button>
          </div>
        )}

        {recoveryResult ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-emerald-50/50 to-emerald-50/10 p-6 md:p-8 rounded-3xl border border-emerald-100 text-center shadow-inner">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">Identity Verified</p>
              <p className="text-slate-400 text-xs mb-4">Please note your digital credential securely:</p>
              <div className="bg-white px-6 py-4 rounded-2xl border border-dashed border-emerald-200 inline-block shadow-sm">
                <span className="text-3xl font-extrabold text-indigo-600 font-mono tracking-wider select-all">{recoveryResult}</span>
              </div>
            </div>
            
            <button 
              onClick={() => { setView('login'); setRecoveryResult(null); }}
              className="w-full py-4 text-center bg-slate-900 hover:bg-black text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all duration-200 outline-none shadow-md hover:shadow-lg hover:shadow-slate-200"
            >
              Back to Secure Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name (Sign Up only) */}
            {view === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <User className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-5 py-4 bg-slate-50/50 border border-slate-200 focus:bg-white text-slate-800 font-semibold text-sm rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Email Field (Required for all flows) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider ml-1">Email / Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail className="w-5 h-5 stroke-[1.8]" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-5 py-4 bg-slate-50/50 border border-slate-200 focus:bg-white text-slate-800 font-semibold text-sm rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="name@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* Mobile / State (Signup or password / PIN recovery) */}
            {(view === 'signup' || view === 'recover-password' || view === 'recover-pin') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Mobile */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider ml-1">Mobile Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Smartphone className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <input
                      type="tel"
                      required
                      className="w-full pl-11 pr-5 py-4 bg-slate-50/50 border border-slate-200 focus:bg-white text-slate-800 font-semibold text-sm rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                      placeholder="10-digit number"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                {/* State Dropdown (Only on signup) */}
                {view === 'signup' && (
                  <div className="space-y-1.5 relative">
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider ml-1">State</label>
                    <div 
                      className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 hover:bg-slate-100/50 text-slate-800 rounded-2xl cursor-pointer font-bold text-sm truncate flex items-center justify-between shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all select-none"
                      onClick={() => setIsStateOpen(!isStateOpen)}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {formData.state ? <span className="text-slate-800">{formData.state}</span> : <span className="text-slate-400">Select State</span>}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isStateOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isStateOpen && (
                      <div className="absolute top-[102%] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                        <input 
                          type="text"
                          className="w-full px-4 py-3 border-b border-slate-100 text-xs focus:outline-none bg-slate-50 text-slate-800 font-bold"
                          placeholder="Search state..."
                          value={stateSearch}
                          onChange={(e) => setStateSearch(e.target.value)}
                          autoFocus
                        />
                        <div className="max-h-44 overflow-y-auto no-scrollbar scroll-smooth">
                          {filteredStates.map(s => (
                            <div 
                              key={s} 
                              className="px-5 py-3.5 hover:bg-indigo-50 hover:text-indigo-700 text-xs font-bold cursor-pointer transition-colors text-slate-600"
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
                            <div className="px-5 py-3 text-xs text-slate-400 italic">No states found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Password input group (only for login or signup) */}
            {(view === 'login' || view === 'signup') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Lock className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-11 pr-12 py-4 bg-slate-50/50 border border-slate-200 focus:bg-white text-slate-800 font-semibold text-sm rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Transaction PIN & Sponsor ID (Signup only) */}
            {view === 'signup' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Transaction PIN */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider ml-1">Trans. PIN (4 Digits)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <KeyRound className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <input
                      type={showPin ? "text" : "password"}
                      required
                      inputMode="numeric"
                      pattern="\d{4}"
                      className="w-full pl-11 pr-12 py-4 bg-slate-50/50 border border-slate-200 focus:bg-white text-slate-800 font-bold text-sm rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 tracking-[0.2em]"
                      placeholder="0000"
                      value={formData.transactionPin}
                      onChange={handlePinChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sponsoring / Referral Code */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider ml-1">Referral / Sponsor ID</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <UserPlus className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <input
                      type="text"
                      className="w-full pl-11 pr-5 py-4 bg-slate-50/50 border border-slate-200 focus:bg-white text-slate-800 font-semibold text-sm rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                      placeholder="Optional Code"
                      value={formData.referralCode}
                      onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                    />
                  </div>
                </div>

              </div>
            )}

            {/* Helper link buttons for Login Screen */}
            {view === 'login' && (
              <div className="flex justify-between items-center px-1 py-1">
                <button 
                  type="button" 
                  onClick={() => setView('recover-password')}
                  className="text-xs font-extrabold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                >
                  Forgot Password?
                </button>
                <span className="text-slate-200">|</span>
                <button 
                  type="button" 
                  onClick={() => setView('recover-pin')}
                  className="text-xs font-extrabold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                >
                  Forgot Trans. PIN?
                </button>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              className="w-full py-4.5 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl shadow-indigo-200/50 active:scale-[0.98] transition-all uppercase tracking-widest text-xs md:text-sm mt-5"
            >
              {view === 'login' ? 'Access Portal Securely' : 
               view === 'signup' ? 'Complete Registrations' : 'Verify My Identity'}
            </button>
          </form>
        )}

        {/* Alternate Navigation back links */}
        {(view === 'recover-password' || view === 'recover-pin' || recoveryResult) && (
          <div className="mt-8 text-center">
            <button
              onClick={() => { setView('login'); setRecoveryResult(null); }}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-xs font-extrabold uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Secure Login
            </button>
          </div>
        )}

        {/* Prompt at the base of card */}
        {view === 'login' && (
          <div className="mt-8 text-center">
            <button
              onClick={() => { setView('signup'); setRecoveryResult(null); }}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
            >
              <span>Don't have an account?</span>
              <span className="text-indigo-700 underline underline-offset-4 font-black">Register Now</span>
            </button>
          </div>
        )}

        {view === 'signup' && (
          <div className="mt-8 text-center">
            <button
              onClick={() => { setView('login'); setRecoveryResult(null); }}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
            >
              <span>Already registered?</span>
              <span className="text-indigo-700 underline underline-offset-4 font-black">Secure Login</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Auth;
