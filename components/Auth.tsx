import { supabase } from '../services/supabaseClient';

import React, { useState, useMemo } from 'react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'login') {
      
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password || ''
        });
        if (error) throw error;
      } catch (err:any) {
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
      } catch (err:any) {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-100 relative overflow-hidden">
        {/* Abstract background element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-10 relative z-10">
          <div className="mb-6 flex justify-center">
             <div className="relative w-24 h-24">
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                 <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="#0077C0" />
                 <path d="M30 40 C 30 30, 70 30, 70 40 L 70 45 C 70 55, 30 55, 30 65 L 30 70 C 30 80, 70 80, 70 70" fill="none" stroke="white" strokeWidth="12" strokeLinecap="round" transform="translate(0, -2)"/>
               </svg>
             </div>
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-black text-[#003B73] tracking-tight leading-none">SmartPay</h1>
            <span className="text-2xl font-bold text-[#4DB8E5] tracking-[0.1em] mt-1">360</span>
          </div>
          <p className="text-slate-400 mt-4 font-bold text-[10px] uppercase tracking-[0.2em]">
            {view === 'login' ? 'Secure Network Login' : 
             view === 'signup' ? 'Create Network Account' :
             view === 'recover-password' ? 'Password Recovery' : 'Transaction PIN Recovery'}
          </p>
        </div>

        {recoveryResult ? (
          <div className="text-center space-y-6 relative z-10">
            <div className="bg-green-50 p-8 rounded-3xl border-2 border-dashed border-green-200">
               <p className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-4">Verification Successful</p>
               <p className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-tighter">Your requested credential is:</p>
               <p className="text-3xl font-black text-blue-600 select-all font-mono tracking-tight">{recoveryResult}</p>
            </div>
            <button 
              onClick={() => { setView('login'); setRecoveryResult(null); }}
              className="w-full py-5 bg-slate-800 text-white font-black rounded-3xl hover:bg-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {view === 'signup' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all font-bold text-sm"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">User ID / Email</label>
              <input
                type="email"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all font-bold text-sm"
                placeholder="user@smartpay.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            {(view === 'signup' || view === 'recover-password' || view === 'recover-pin') && (
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Mobile</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all font-bold text-sm"
                    placeholder="+91"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                {view === 'signup' && (
                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">State</label>
                    <div 
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer font-bold text-xs truncate"
                      onClick={() => setIsStateOpen(!isStateOpen)}
                    >
                      {formData.state || "Select State"}
                    </div>
                    {isStateOpen && (
                      <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {view === 'login' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all font-bold text-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div className="flex justify-between px-1">
                   <button 
                    type="button" 
                    onClick={() => setView('recover-password')}
                    className="text-[9px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                   >
                     Forgot Password?
                   </button>
                   <button 
                    type="button" 
                    onClick={() => setView('recover-pin')}
                    className="text-[9px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                   >
                     Forgot PIN?
                   </button>
                </div>
              </div>
            )}

            {view === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all font-bold text-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Trans. PIN</label>
                  <input
                    type="password"
                    required
                    inputMode="numeric"
                    pattern="\d{4}"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all font-bold text-sm text-center tracking-[0.5em]"
                    placeholder="0000"
                    value={formData.transactionPin}
                    onChange={handlePinChange}
                  />
                </div>
              </div>
            )}

            {view === 'signup' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Referral Code</label>
                <input
                  type="text"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all font-bold text-sm"
                  placeholder="SPAY123"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl hover:bg-blue-700 active:scale-[0.97] transition-all shadow-2xl shadow-blue-200 mt-4 uppercase tracking-widest text-sm"
            >
              {view === 'login' ? 'Access Account' : 
               view === 'signup' ? 'Register Now' : 'Verify Identity'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center relative z-10">
          <button
            onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setRecoveryResult(null); }}
            className="text-slate-400 text-[10px] font-black hover:text-blue-600 transition-colors uppercase tracking-[0.2em]"
          >
            {view === 'login' ? "Join the network → Sign Up" : "Back to Security → Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
