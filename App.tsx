
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { User, UserRole, Transaction, Product, WithdrawalRequest, PaymentRequest, ChatMessage } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';

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

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

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
    await supabase.auth.signOut();
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
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-800">SmartPay 360</span>
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
          />
        )}
      </main>
    </div>
  );
}
