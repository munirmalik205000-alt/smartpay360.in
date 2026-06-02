
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

  // Compute UI legacy helper mappings
  if (activeUserProfile) {
    activeUserProfile.name = activeUserProfile.username;
    activeUserProfile.phone = activeUserProfile.mobile;
    activeUserProfile.isActivated = activeUserProfile.is_active;
    activeUserProfile.wallets = {
      main: Number(activeUserProfile.wallet_balance || 0),
      commission: Number(activeUserProfile.earning_wallet || 0),
      recharge: Number(activeUserProfile.recharge_wallet || 0),
      cashback: 0
    };
  }

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

    // Fetch persistent payment requests
    fetch('/api/payment-requests')
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        setPaymentRequests(Array.isArray(data) ? data : []);
      })
      .catch(err => console.warn("Error fetching payment-requests:", err));

    // Fetch persistent withdrawal requests
    fetch('/api/withdrawal-requests')
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        setWithdrawalRequests(Array.isArray(data) ? data : []);
      })
      .catch(err => console.warn("Error fetching withdrawal-requests:", err));

    // Fetch persistent chat messages
    fetch('/api/chat-messages')
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        setChatMessages(Array.isArray(data) ? data : []);
      })
      .catch(err => console.warn("Error fetching chat-messages:", err));

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
    
    return () => {
      clearTimeout(safetyTimeout);
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Poll server state every 3 key files/APIs to provide seamless real-time syncing across open admin and user tabs
  useEffect(() => {
    if (!session) return;

    const pollServerState = () => {
      // 1. Fetch payment requests
      fetch('/api/payment-requests')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) {
            setPaymentRequests(data);
          }
        })
        .catch(err => console.warn("Syncing payment requests failed:", err));

      // 2. Fetch withdrawal requests
      fetch('/api/withdrawal-requests')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) {
            setWithdrawalRequests(data);
          }
        })
        .catch(err => console.warn("Syncing withdrawal requests failed:", err));

      // 3. Fetch chat messages
      fetch('/api/chat-messages')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) {
            setChatMessages(data);
          }
        })
        .catch(err => console.warn("Syncing chat messages failed:", err));

      // 4. Also fetch users list and transaction logs if user is Admin
      const isAdminUser = activeUserProfile?.email === 'admin@spay.com' || activeUserProfile?.role === 'ADMIN';
      if (isAdminUser) {
        supabase.from('users').select('*').order('created_at', { ascending: false })
          .then(({ data: allUsers }) => {
            if (allUsers) {
              const mappedUsers = allUsers.map((u: any) => {
                try {
                  const localBank = localStorage.getItem(`spay_bank_${u.id}`);
                  if (localBank) u.bankDetails = JSON.parse(localBank);
                } catch (_) {}
                return u;
              });
              setUsers(prev => {
                // simple deep equivalence comparison to prevent unnecessary state triggers
                if (JSON.stringify(prev) === JSON.stringify(mappedUsers)) return prev;
                return mappedUsers;
              });
            }
          });

        supabase.from('transactions').select('*').order('created_at', { ascending: false })
          .then(({ data: allTx }) => {
            if (allTx) {
              setTransactions(prev => {
                if (JSON.stringify(prev) === JSON.stringify(allTx)) return prev;
                return allTx;
              });
            }
          });
      }
    };

    pollServerState();
    const pollId = setInterval(pollServerState, 3500);

    return () => clearInterval(pollId);
  }, [session, activeUserProfile?.id, activeUserProfile?.role]);

  const fetchUserProfile = async (authUser: any) => {
    try {
      setProfileError(null);
      const { data, error } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      
      let finalUser: User | null = null;

      if (error && error.code === 'PGRST116') {
         // Auto-create missing profile
         const { data: newData, error: insertError } = await supabase
          .from('users')
          .insert([{ 
             id: authUser.id,
             email: authUser.email,
             username: authUser.user_metadata?.username || 'User',
             role: authUser.email === 'admin@spay.com' ? 'ADMIN' : 'USER',
             is_active: true
          }])
          .select()
          .single();
          
         if (!insertError && newData) {
           finalUser = newData as User;
         } else {
           console.error("Auto-create profile failed:", insertError);
           setProfileError("Could not auto-create your user profile. Please contact support.");
         }
      } else if (data) {
        finalUser = data as User;
      } else if (error) {
        console.error("Profile fetch error:", error);
        setProfileError(error.message);
      }

      if (finalUser) {
        // Load bankDetails fallback from localStorage
        try {
          const localBank = localStorage.getItem(`spay_bank_${finalUser.id}`);
          if (localBank) {
            finalUser.bankDetails = JSON.parse(localBank);
          }
        } catch (_) {}

        setUserProfile(finalUser);

        // Load users & transactions depending on roles
        const isAdmin = finalUser.email === 'admin@spay.com' || finalUser.role === 'ADMIN';
        if (isAdmin) {
          // Fetch all users list for admin dashboard
          const { data: allUsers } = await supabase.from('users').select('*').order('created_at', { ascending: false });
          if (allUsers) {
            const mappedUsers = allUsers.map((u: any) => {
              try {
                const localBank = localStorage.getItem(`spay_bank_${u.id}`);
                if (localBank) u.bankDetails = JSON.parse(localBank);
              } catch (_) {}
              return u;
            });
            setUsers(mappedUsers);
          }

          // Fetch all transactions list for admin panel
          const { data: allTx } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
          if (allTx) setTransactions(allTx);
        } else {
          // Regular user: fetch own transactions
          const { data: myTx } = await supabase.from('transactions').select('*').eq('user_id', finalUser.id).order('created_at', { ascending: false });
          if (myTx) setTransactions(myTx);

          // Get other users for referral statistics/transfer search
          const { data: listUsers } = await supabase.from('users').select('*');
          if (listUsers) setUsers(listUsers);
        }
      }
    } catch (err: any) {
      console.error(err);
      setUserProfile(prev => prev);
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

  const handleAddMoney = async (data: { amount: number, utr: string, screenshot: string }) => {
    if (!session?.user) return;
    try {
      const response = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          userName: activeUserProfile.username || activeUserProfile.email || 'User',
          amount: Number(data.amount),
          utr: data.utr,
          screenshot: data.screenshot
        })
      });
      if (response.ok) {
        const newReq = await response.json();
        setPaymentRequests(prev => [newReq, ...prev]);
        alert('Deposit Request Submitted! The admin will verify and credit your wallet shortly.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit deposit request.');
    }
  };

  const handleApprovePayment = async (requestId: string) => {
    try {
      const req = paymentRequests.find(r => r.id === requestId);
      if (!req || req.status !== 'pending') return;

      const { data: targetUser, error: uErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.userId)
        .single();
      
      if (uErr || !targetUser) {
        alert('Could not locate target user profile in Supabase database.');
        return;
      }

      const newRecharge = Number(targetUser.recharge_wallet || 0) + Number(req.amount);
      const { error: updateErr } = await supabase
        .from('users')
        .update({ 
          recharge_wallet: newRecharge
        })
        .eq('id', req.userId);

      if (updateErr) {
        alert('DB Error: Failed to update e-wallet balance: ' + updateErr.message);
        return;
      }

      // Record transaction
      await supabase.from('transactions').insert([{
        user_id: req.userId,
        amount: Number(req.amount),
        transaction_type: 'add_funds',
        remark: `Approved Add Money: UTR ${req.utr}`
      }]);

      const updateRes = await fetch('/api/payment-requests/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: 'approved' })
      });

      if (updateRes.ok) {
        setPaymentRequests(prev => prev.map(p => p.id === requestId ? { ...p, status: 'approved' } : p));
        
        // Refresh users & transactions
        const { data: allUsers } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (allUsers) setUsers(allUsers);
        const { data: allTx } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        if (allTx) setTransactions(allTx);

        alert('Deposit request approved. User E-Wallet credited successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Error approving deposit payment.');
    }
  };

  const handleRejectPayment = async (requestId: string) => {
    try {
      const updateRes = await fetch('/api/payment-requests/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: 'rejected' })
      });

      if (updateRes.ok) {
        setPaymentRequests(prev => prev.map(p => p.id === requestId ? { ...p, status: 'rejected' } : p));
        alert('Deposit request rejected.');
      }
    } catch (err) {
      console.error(err);
      alert('Error rejecting deposit payment.');
    }
  };

  const handleWithdrawalRequestSubmit = async (amount: number, pin: string) => {
    if (!session?.user || !activeUserProfile) return;
    try {
      const currentBal = Number(activeUserProfile.wallet_balance || 0);
      if (currentBal < amount) {
        alert('Insufficient wallet balance!');
        return;
      }

      const newBalance = currentBal - amount;
      const { error: updateErr } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', session.user.id);

      if (updateErr) {
        alert('DB Error updating wallet balance: ' + updateErr.message);
        return;
      }

      await supabase.from('transactions').insert([{
        user_id: session.user.id,
        amount: -amount,
        transaction_type: 'withdrawal',
        remark: `Withdrawal request submitted: ₹${amount}`
      }]);

      const response = await fetch('/api/withdrawal-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          userName: activeUserProfile.username || activeUserProfile.email || 'User',
          amount,
          bankDetails: activeUserProfile.bankDetails || { accountNumber: '', bankName: '', ifscCode: '', holderName: '' }
        })
      });

      if (response.ok) {
        const newReq = await response.json();
        setWithdrawalRequests(prev => [newReq, ...prev]);
        fetchUserProfile(session.user);
        alert('Withdrawal request submitted successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit withdrawal request.');
    }
  };

  const handleApproveWithdrawal = async (requestId: string) => {
    try {
      const updateRes = await fetch('/api/withdrawal-requests/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: 'approved' })
      });

      if (updateRes.ok) {
        setWithdrawalRequests(prev => prev.map(p => p.id === requestId ? { ...p, status: 'approved' } : p));
        alert('Withdrawal approved successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Error approving withdrawal request.');
    }
  };

  const handleRejectWithdrawal = async (requestId: string) => {
    try {
      const req = withdrawalRequests.find(w => w.id === requestId);
      if (!req || req.status !== 'pending') return;

      const { data: targetUser, error: uErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.userId)
        .single();
      
      if (uErr || !targetUser) {
        alert('Could not locate target user profile inside database.');
        return;
      }

      const returnedBalance = Number(targetUser.wallet_balance || 0) + Number(req.amount);
      const { error: updateErr } = await supabase
        .from('users')
        .update({ wallet_balance: returnedBalance })
        .eq('id', req.userId);

      if (updateErr) {
        alert('Failed to return wallet balance: ' + updateErr.message);
        return;
      }

      await supabase.from('transactions').insert([{
        user_id: req.userId,
        amount: Number(req.amount),
        transaction_type: 'withdrawal_refund',
        remark: `Refunded: Rejected Withdrawal Request of ₹${req.amount}`
      }]);

      const updateRes = await fetch('/api/withdrawal-requests/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: 'rejected' })
      });

      if (updateRes.ok) {
        setWithdrawalRequests(prev => prev.map(p => p.id === requestId ? { ...p, status: 'rejected' } : p));
        
        const { data: allUsers } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (allUsers) setUsers(allUsers);
        const { data: allTx } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        if (allTx) setTransactions(allTx);

        alert('Withdrawal request rejected and amount refunded successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Error rejecting withdrawal request.');
    }
  };

  const handleUpdateBankDetails = async (details: any) => {
    if (!session?.user) return;
    try {
      localStorage.setItem(`spay_bank_${session.user.id}`, JSON.stringify(details));
      setUserProfile(prev => prev ? { ...prev, bankDetails: details } : null);
      alert('Bank details updated successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (msg: string, receiverId: string) => {
    if (!session?.user) return;
    try {
      const response = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: session.user.id,
          senderName: activeUserProfile.username || activeUserProfile.email || 'User',
          receiverId: receiverId,
          message: msg
        })
      });
      if (response.ok) {
        const newMsg = await response.json();
        setChatMessages(prev => [...prev, newMsg]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecharge = async (userId: string, amount: number, service: string, pin: string) => {
    if (!activeUserProfile) return;
    try {
      const currentRec = Number(activeUserProfile.recharge_wallet || 0);
      if (currentRec < amount) {
        alert('Insufficient E-Wallet balance. Please deposit funds first.');
        return;
      }

      const newRec = currentRec - amount;
      const { error: updateErr } = await supabase
        .from('users')
        .update({ recharge_wallet: newRec })
        .eq('id', userId);

      if (updateErr) {
        alert('DB Error: ' + updateErr.message);
        return;
      }

      await supabase.from('transactions').insert([{
        user_id: userId,
        amount: -amount,
        transaction_type: 'recharge',
        remark: `${service} Bill Payment for ₹${amount}`
      }]);

      fetchUserProfile(session?.user);
      alert(`${service} recharge successful!`);
    } catch (err) {
      console.error(err);
      alert('Failed to complete recharge.');
    }
  };

  const handleOrderProduct = async (userId: string, productId: string) => {
    if (!activeUserProfile) return;
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    try {
      const currentBal = Number(activeUserProfile.wallet_balance || 0);
      if (currentBal < targetProduct.price) {
        alert('Insufficient Main Wallet balance to complete purchase!');
        return;
      }

      const newBal = currentBal - targetProduct.price;
      const { error: updateErr } = await supabase
        .from('users')
        .update({ wallet_balance: newBal })
        .eq('id', userId);

      if (updateErr) {
        alert('DB Error processing order: ' + updateErr.message);
        return;
      }

      await supabase.from('transactions').insert([{
        user_id: userId,
        amount: -targetProduct.price,
        transaction_type: 'shopping',
        remark: `Purchased item: ${targetProduct.name}`
      }]);

      fetchUserProfile(session?.user);
      alert(`Order placed successfully for ${targetProduct.name}!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWalletTransfer = async (senderId: string, recipientEmail: string, amount: number, pin: string) => {
    if (!activeUserProfile) return;
    try {
      const currentBal = Number(activeUserProfile.wallet_balance || 0);
      if (currentBal < amount) {
        alert('Insufficient wallet balance!');
        return;
      }

      // Check recipient
      const { data: recipientUser, error: recErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', recipientEmail.trim().toLowerCase())
        .single();

      if (recErr || !recipientUser) {
        alert('Error: Recipient user not found inside database.');
        return;
      }

      if (recipientUser.id === senderId) {
        alert('Cannot transfer funds to yourself!');
        return;
      }

      // Subtract sender
      await supabase.from('users').update({ wallet_balance: currentBal - amount }).eq('id', senderId);

      // Add recipient
      await supabase.from('users').update({ wallet_balance: Number(recipientUser.wallet_balance || 0) + amount }).eq('id', recipientUser.id);

      // Log transactions
      await supabase.from('transactions').insert([
        {
          user_id: senderId,
          amount: -amount,
          transaction_type: 'transfer_sent',
          remark: `Transfer to ${recipientUser.username || recipientUser.email}`
        },
        {
          user_id: recipientUser.id,
          amount: amount,
          transaction_type: 'transfer_received',
          remark: `Received from ${activeUserProfile.username || activeUserProfile.email}`
        }
      ]);

      fetchUserProfile(session?.user);
      alert('P2P Wallet transfer successful!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivateAccount = async (userId: string) => {
    if (!activeUserProfile) return;
    try {
      const packageCost = 249;
      const currentRec = Number(activeUserProfile.recharge_wallet || 0);
      if (currentRec < packageCost) {
        alert('Insufficient E-Wallet balance. Please Deposit at least ₹249 first!');
        return;
      }

      // Update to active
      await supabase.from('users').update({
        is_active: true,
        recharge_wallet: currentRec - packageCost
      }).eq('id', userId);

      await supabase.from('transactions').insert([{
        user_id: userId,
        amount: -packageCost,
        transaction_type: 'activation',
        remark: 'System Package Activation Fee'
      }]);

      fetchUserProfile(session?.user);
      alert('Account Activated successfully! You are now a fully verified active participant.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {(activeUserProfile.email === 'admin@spay.com' || activeUserProfile.role === 'ADMIN') ? (
          <AdminPanel
            users={users}
            transactions={transactions}
            config={config}
            onUpdateConfig={setConfig}
            paymentRequests={paymentRequests}
            onApprovePayment={handleApprovePayment}
            onRejectPayment={handleRejectPayment}
            withdrawalRequests={withdrawalRequests}
            onApproveWithdrawal={handleApproveWithdrawal}
            onRejectWithdrawal={handleRejectWithdrawal}
            chatMessages={chatMessages}
            onSendMessage={handleSendMessage}
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
            onRecharge={handleRecharge}
            onOrder={handleOrderProduct}
            onTransfer={handleWalletTransfer}
            onActivate={handleActivateAccount}
            onAddMoney={handleAddMoney}
            onWithdrawal={handleWithdrawalRequestSubmit}
            onUpdateBankDetails={handleUpdateBankDetails}
            onSendMessage={handleSendMessage}
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
