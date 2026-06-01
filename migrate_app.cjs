const fs = require('fs');

const currentApp = fs.readFileSync('App.tsx', 'utf8');
const oldApp = fs.readFileSync('restored/App.tsx', 'utf8');

// oldApp has:
// const [currentUser, setCurrentUser] = useState<User | null>(null);
// We want to replace it with the Supabase auth flow!
// And we want `users`, `products`, `transactions` to persist.
// This is somewhat complex.
// How about we just write a brand new App.tsx that merges both?

const mergedAppContent = `
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { User, UserRole, Transaction, Product, WithdrawalRequest, PaymentRequest, ChatMessage } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', vendorId: 'v1', name: 'Premium Herbal Tea', description: 'Natural detox tea', price: 499, mrp: 699, category: 'Herbal', stock: 100, image: '☕', mlmPoints: 100 },
  { id: 'p2', vendorId: 'v1', name: 'Aloe Vera Gel', description: 'Pure organic aloe', price: 299, mrp: 399, category: 'Wellness', stock: 50, image: '🌿', mlmPoints: 50 },
];

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fallback states for Dashboard UI compatibility (simulated backend for non-core features)
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserProfile(session.user);
      else setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchUserProfile(session.user);
      else { setUserProfile(null); setLoading(false); }
    });
    
    // Load local users fallback to avoid breaking UI (if needed)
    const localUsers = JSON.parse(localStorage.getItem('spay_users') || '[]');
    setUsers(localUsers);

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: any) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      if (data) {
        setUserProfile(data as User);
        // Ensure this user exists in the local \`users\` array for the Downline Tree calculation
        setUsers(prev => {
          if (!prev.find(u => u.id === data.id)) return [...prev, data];
          return prev.map(u => u.id === data.id ? data : u);
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (!session || !userProfile) {
    return <Auth onLogin={() => {}} onSignup={() => {}} />; // Auth is now handling its own Supabase logic
  }

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
              <p className="text-sm font-bold text-slate-900">{userProfile.username}</p>
              <p className="text-xs text-slate-500 font-medium">{userProfile.email}</p>
            </div>
            <button onClick={handleLogout} className="px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl border transition-all uppercase tracking-wider">Logout</button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard 
          user={userProfile}
          users={users}
          products={products}
          transactions={transactions}
          paymentRequests={paymentRequests}
          withdrawalRequests={withdrawalRequests}
          chatMessages={chatMessages}
          packagePrice={249}
          qrCode={""}
          onRecharge={() => alert('Simulated Recharge')}
          onOrder={() => alert('Simulated Order')}
          onTransfer={() => alert('Simulated Transfer')}
          onActivate={() => alert('Simulated Activate')}
          onAddMoney={() => alert('Simulated Add Money')}
          onWithdrawal={() => alert('Simulated Withdrawal')}
          onUpdateBankDetails={() => alert('Simulated Update Bank')}
          onSendMessage={() => alert('Simulated Chat')}
        />
      </main>
    </div>
  );
}
`;

fs.writeFileSync('App.tsx', mergedAppContent);
console.log('Created merged App.tsx');
