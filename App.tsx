
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { User, UserRole, Transaction, Product, WithdrawalRequest, PaymentRequest, ChatMessage } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { Logo } from './components/Logo';
import { Menu, X, Home, PlusCircle, ArrowUpRight, Zap, ShoppingBag, Send, Users, MessageSquare, LogOut } from 'lucide-react';

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', vendorId: 'v1', name: 'Premium Herbal Tea', description: 'Natural detox tea', price: 499, mrp: 699, category: 'Herbal', stock: 100, image: '☕', mlmPoints: 100 },
  { id: 'p2', vendorId: 'v1', name: 'Aloe Vera Gel', description: 'Pure organic aloe', price: 299, mrp: 399, category: 'Wellness', stock: 50, image: '🌿', mlmPoints: 50 },
];

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Fallback states for Dashboard UI compatibility (simulated backend for non-core features)
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [config, setConfig] = useState<any>({ qrCode: '', systemCoinValue: 1, levels: [] });
  const [joiningPackages, setJoiningPackages] = useState<any[]>([{ id: '1', name: 'Starter', price: 249, coin: 50, pv: 10 }]);
  const [dashboardTab, setDashboardTab] = useState<'home' | 'utility' | 'shop' | 'transfer' | 'mlm' | 'add_money' | 'withdraw' | 'support'>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    // Fetch persistent configurations
    fetch('/api/config')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Config load error');
      })
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setConfig(prev => ({ ...prev, ...data }));
          if (data.joiningPackages) {
            setJoiningPackages(data.joiningPackages);
          }
        }
      })
      .catch(err => console.warn("Error fetching configuration on mount:", err));

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) throw error;
      setSession(session);
      if (session?.user) fetchUserProfile(session.user);
      else setLoading(false);
    }).catch(err => {
      console.error("Auth error:", err);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchUserProfile(session.user);
      else { setUserProfile(null); setLoading(false); }
    });
    
    // Load local users fallback to avoid breaking UI (if needed)
    try {
      const localUsers = JSON.parse(localStorage.getItem('spay_users') || '[]');
      setUsers(localUsers);
    } catch (e) {}

    return () => {
      clearTimeout(safetyTimeout);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (authUser: any) => {
    try {
      setProfileError(null);
      const { data, error } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      
      if (error && error.code === 'PGRST116') {
         // Auto-create missing profile
         const { data: newData, error: insertError } = await supabase
          .from('users')
          .insert([{ 
             id: authUser.id,
             email: authUser.email,
             username: authUser.user_metadata?.username || 'User',
             role: 'USER',
             is_active: true
          }])
          .select()
          .single();
          
         if (!insertError && newData) {
           setUserProfile(newData as User);
           setUsers(prev => prev.find(u => u.id === newData.id) ? prev : [...prev, newData as User]);
         } else {
           console.error("Auto-create profile failed:", insertError);
           setProfileError("Could not auto-create your user profile. Please contact support.");
         }
      } else if (data) {
        setUserProfile(data as User);
        setUsers(prev => prev.find(u => u.id === data.id) ? prev.map(u => u.id === data.id ? data : u) : [...prev, data]);
      } else if (error) {
        console.error("Profile fetch error:", error);
        setProfileError(error.message);
      }
    } catch (err: any) {
      console.error(err);
      setProfileError(err.message || 'An error occurred loading your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // 1. Instantly nullify React session and profile states so UI logged out immediately
    setSession(null);
    setUserProfile(null);
    setSidebarOpen(false);

    // 2. Robust clearance of local storage and Supabase keys
    try {
      const keysToClear = Object.keys(localStorage);
      for (const key of keysToClear) {
        if (key.includes('supabase') || key.startsWith('sb-') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      }
      localStorage.removeItem('supabase.auth.token');
    } catch (storageErr) {
      console.warn('LocalStorage clear error:', storageErr);
    }

    // 3. Dispatch sign out to Supabase asynchronously inside try/catch (non-blocking)
    try {
      supabase.auth.signOut().catch(e => console.warn("Supabase async signOut error:", e));
    } catch (err) {
      console.error('Logout error:', err);
    }

    // 4. Reload page after a brief timeout to secure a fresh clean environment
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-900 font-bold">Loading...</div>;
  }

  if (!session) {
    return <Auth onLogin={() => {}} onSignup={() => {}} onRecover={() => null} />; // Auth is now handling its own Supabase logic
  }

  // Fallback dashboard if userProfile is not found or failed to load
  const activeUserProfile = userProfile || {
    id: session?.user?.id || 'guest',
    email: session?.user?.email || 'guest@spay.com',
    username: session?.user?.user_metadata?.username || 'Guest User',
    role: 'USER',
    wallet_balance: 0,
    earning_wallet: 0,
    recharge_wallet: 0,
    total_pv: 0,
    self_pv: 0,
    team_pv: 0,
    direct_count: 0,
    team_count: 0,
    rank_name: 'Starter',
    is_active: true,
    sponsor_id: null,
    mobile: '',
    created_at: new Date().toISOString()
  } as User;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             {!(activeUserProfile.email === 'admin@spay.com' || activeUserProfile.role === 'ADMIN') && (
               <button 
                 onClick={() => setSidebarOpen(true)}
                 className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                 title="Toggle Navigation Menu"
               >
                 <Menu className="w-5 h-5" />
               </button>
             )}
             <Logo size="sm" lightText={false} />
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{activeUserProfile.username}</p>
              <p className="text-xs text-slate-500 font-medium">{activeUserProfile.email}</p>
            </div>
            <button onClick={handleLogout} className="px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl border transition-all uppercase tracking-wider">Logout</button>
          </div>
        </div>
      </header>
      
      {profileError && (
         <div className="bg-red-50 border-b border-red-200 p-4 text-center">
            <p className="text-sm font-bold text-red-600">Warning: Profile synchronization issue - {profileError}</p>
         </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(activeUserProfile.email === 'admin@spay.com' || activeUserProfile.role === 'ADMIN') ? (
          <AdminPanel
            users={users}
            transactions={transactions}
            config={config}
            onUpdateConfig={setConfig}
            paymentRequests={paymentRequests}
            onApprovePayment={(id) => {
              setPaymentRequests(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
              alert('Payment Approved!');
            }}
            withdrawalRequests={withdrawalRequests}
            onApproveWithdrawal={(id) => {
              setWithdrawalRequests(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
              alert('Withdrawal Approved!');
            }}
            chatMessages={chatMessages}
            onSendMessage={() => {}}
            joiningPackages={joiningPackages}
            onUpdatePackages={setJoiningPackages}
          />
        ) : (
          <Dashboard 
            user={activeUserProfile}
            users={users}
            products={products}
            transactions={transactions}
            paymentRequests={paymentRequests}
            withdrawalRequests={withdrawalRequests}
            chatMessages={chatMessages}
            packagePrice={249}
            qrCode={config?.qrCode || ""}
            onRecharge={() => alert('Simulated Recharge')}
            onOrder={() => alert('Simulated Order')}
            onTransfer={() => alert('Simulated Transfer')}
            onActivate={() => alert('Simulated Activate')}
            onAddMoney={() => alert('Simulated Add Money')}
            onWithdrawal={() => alert('Simulated Withdrawal')}
            onUpdateBankDetails={() => alert('Simulated Update Bank')}
            onSendMessage={() => alert('Simulated Chat')}
            activeTab={dashboardTab}
            setActiveTab={setDashboardTab}
          />
        )}
      </main>

      {/* Sliding Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out"
            onClick={() => setSidebarOpen(false)}
          ></div>

          <div className="absolute inset-y-0 left-0 max-w-full flex">
            {/* Panel */}
            <div className="w-80 max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 ease-in-out animate-slide-in-left">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <Logo size="sm" lightText={false} />
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content - Menu List */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                {[
                  { id: 'home', label: 'Ecosystem Dashboard', icon: Home },
                  { id: 'add_money', label: 'Add Money / Deposit', icon: PlusCircle },
                  { id: 'withdraw', label: 'Withdrawal Request', icon: ArrowUpRight },
                  { id: 'utility', label: 'Utility Bill Recharges', icon: Zap },
                  { id: 'shop', label: 'Product Shopping Mall', icon: ShoppingBag },
                  { id: 'transfer', label: 'P2P Wallet Transfer', icon: Send },
                  { id: 'mlm', label: 'MLM Referral Tree & Family', icon: Users },
                  { id: 'support', label: 'Contact Support Helpdesk', icon: MessageSquare },
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = dashboardTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setDashboardTab(item.id as any);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span className="uppercase">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* User Profile Card Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-xl border border-slate-200/60 shadow-xs mb-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate max-w-[150px]">
                      {activeUserProfile.username || activeUserProfile.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                      {activeUserProfile.email}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-[8px] font-black rounded ${activeUserProfile.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {activeUserProfile.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-200/50"
                >
                  <LogOut className="w-4 h-4" />
                  LOGOUT ACCOUNT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
