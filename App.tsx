
import React, { useState, useEffect } from 'react';
import { User, UserRole, Transaction, Product, Order, MLMConfig, Wallets, PaymentRequest, WithdrawalRequest, ChatMessage, KYCDetails, RewardTarget } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import VendorPanel from './components/VendorPanel';
import { Layout } from './components/Layout';
import { safeLocalStorage } from './services/storage';
import { ErrorBoundary } from './components/ErrorBoundary';

const DEFAULT_LEVEL_PERCENTAGES_20 = [
  0.15, 0.08, 0.05, 0.03, 0.02, 0.02, 0.01, 0.01, 0.01, 0.01,
  0.005, 0.005, 0.005, 0.005, 0.005, 0.002, 0.002, 0.002, 0.002, 0.002
];

const DEFAULT_PACKAGE_COMMISSION_20 = [
  100, 50, 30, 20, 10, 10, 5, 5, 5, 5,
  4, 4, 3, 3, 2, 2, 1, 1, 1, 1
];

const DEFAULT_MLM_CONFIG: MLMConfig = {
  rechargeCommission: DEFAULT_LEVEL_PERCENTAGES_20.map(p => p * 0.1), // Recharge API commission is lower, e.g. 1.5% down to 0.02%
  productCommission: DEFAULT_LEVEL_PERCENTAGES_20,
  packageCommission: DEFAULT_PACKAGE_COMMISSION_20,
  packagePrice: 999, // Premium Activation Package
  tdsRate: 0.05,
  serviceCharge: 0.05,
  qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=smartpay360@okaxis%26pn=SmartPay360%26am=999%26cu=INR'
};

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p_mob_1', vendorId: 'v_sys', vendorName: 'S360 Official Store', name: 'Flagship Neo Phone 14 Pro', description: '5G, 256GB Golden Edition with extreme performance', price: 64999, mrp: 74999, category: 'Mobile', stock: 45, image: '📱', mlmPoints: 1200, isApproved: true },
  { id: 'p_elec_1', vendorId: 'v_sys', vendorName: 'S360 Official Store', name: 'Ultra HD 4K Smart Android TV 55"', description: 'Vibrant Colors, Dolby Vision audio, seamless casting', price: 28999, mrp: 39999, category: 'Electronics', stock: 20, image: '📺', mlmPoints: 900, isApproved: true },
  { id: 'p_home_1', vendorId: 'v_sys', vendorName: 'S360 Official Store', name: 'Premium Air Purifier Pro Max', description: 'HEPA carbon active filters, removes 99.9% dust', price: 8999, mrp: 12999, category: 'Home Appliances', stock: 150, image: '🍃', mlmPoints: 450, isApproved: true },
  { id: 'p_beauty_1', vendorId: 'v_sys', vendorName: 'S360 Official Store', name: 'Red Sandalwood Anti-Aging Cream', description: '100% Organic, Ayurvedic rejuvenation essence', price: 699, mrp: 999, category: 'Beauty', stock: 500, image: '🧴', mlmPoints: 35, isApproved: true },
  { id: 'p_health_1', vendorId: 'v_sys', vendorName: 'S360 Official Store', name: 'Multivitamin Superfood Capsules', description: 'Pack of 90 high-potency immunity booster capsules', price: 499, mrp: 799, category: 'Healthcare', stock: 800, image: '💊', mlmPoints: 20, isApproved: true },
  { id: 'p_fash_1', vendorId: 'v_sys', vendorName: 'S360 Official Store', name: 'Gold Trim Premium Silk Kurtas', description: 'Traditional fit, pure silk festive collection', price: 2199, mrp: 3499, category: 'Fashion', stock: 120, image: '👔', mlmPoints: 80, isApproved: true },
  { id: 'p_groc_1', vendorId: 'v_sys', vendorName: 'S360 Official Store', name: 'Premium Basmati Rice 5KG Double-A', description: 'Exquisite aroma, long grain, double aged', price: 950, mrp: 1200, category: 'Grocery', stock: 1000, image: '🌾', mlmPoints: 40, isApproved: true }
];

const INITIAL_REWARDS = [
  { id: 'rew_1', name: 'Enterprise Premium Laptop', image: '💻', targetSalesCount: 15, currentSalesCount: 0, status: 'locked' as const },
  { id: 'rew_2', name: 'Luxury AMOLED Mobile Phone', image: '📱', targetSalesCount: 50, currentSalesCount: 0, status: 'locked' as const },
  { id: 'rew_3', name: 'Super Dolby Smart TV 55"', image: '📺', targetSalesCount: 120, currentSalesCount: 0, status: 'locked' as const },
  { id: 'rew_4', name: 'Royal Enfield Classic 350', image: '🏍️', targetSalesCount: 400, currentSalesCount: 0, status: 'locked' as const },
  { id: 'rew_5', name: 'Hyundai Venue Turbo SUV', image: '🚗', targetSalesCount: 1500, currentSalesCount: 0, status: 'locked' as const },
  { id: 'rew_6', name: 'Mahindra Scorpio-N Custom', image: '🚙', targetSalesCount: 4500, currentSalesCount: 0, status: 'locked' as const },
  { id: 'rew_7', name: 'BMW 3-Series Luxury Sedan', image: '🏎️', targetSalesCount: 12000, currentSalesCount: 0, status: 'locked' as const }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = safeLocalStorage.getItem('spay_current_user', '');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return safeLocalStorage.getItem('spay_theme', 'dark') === 'dark';
  });

  const [users, setUsers] = useState<User[]>(() => JSON.parse(safeLocalStorage.getItem('spay_users', '[]')));
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(safeLocalStorage.getItem('spay_products', JSON.stringify(INITIAL_PRODUCTS))));
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(safeLocalStorage.getItem('spay_orders', '[]')));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(safeLocalStorage.getItem('spay_tx', '[]')));
  const [mlmConfig, setMlmConfig] = useState<MLMConfig>(() => JSON.parse(safeLocalStorage.getItem('spay_config', JSON.stringify(DEFAULT_MLM_CONFIG))));
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => JSON.parse(safeLocalStorage.getItem('spay_payments', '[]')));
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => JSON.parse(safeLocalStorage.getItem('spay_withdrawals', '[]')));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => JSON.parse(safeLocalStorage.getItem('spay_chats', '[]')));

  // Theme support
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      safeLocalStorage.setItem('spay_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      safeLocalStorage.setItem('spay_theme', 'light');
    }
  }, [darkMode]);

  // Persist current session
  useEffect(() => {
    try {
      if (currentUser) {
        safeLocalStorage.setItem('spay_current_user', JSON.stringify(currentUser));
      } else {
        safeLocalStorage.removeItem('spay_current_user');
      }
    } catch {}
  }, [currentUser]);

  // Seed default admin and high level structure on load
  useEffect(() => {
    const adminEmail = 'admin@spay.com';
    const hasAdmin = users.some(u => u && u.email && u.email.toLowerCase() === adminEmail);
    if (!hasAdmin) {
      const admin: User = {
        id: 'admin-0',
        name: 'SmartPay360 Admin',
        email: adminEmail,
        password: 'admin123',
        transactionPin: '1234',
        phone: '1800360360',
        state: 'Delhi',
        referralCode: 'SPAY001',
        referrerId: null,
        role: UserRole.ADMIN,
        wallets: { main: 5000000, commission: 0, cashback: 0, recharge: 5000000, shopping: 5000000, reward: 1000000 },
        totalEarned: 0,
        status: 'active',
        level: 0,
        joinedAt: new Date().toISOString(),
        isActivated: true,
        rewards: INITIAL_REWARDS.map(r => ({ ...r, currentSalesCount: 15000, status: 'achieved' }))
      };

      // Seed a few default Dummy mock referral users at cascading 20 levels to demonstrate hierarchy instantly (Genealogy demonstration)
      const cachedUsers = [admin];
      let lastReferrerId: string | null = 'admin-0';
      let lastReferralCode = 'SPAY001';
      
      const seedStates = ['Delhi', 'Punjab', 'Maharashtra', 'Karnataka', 'Gujarat', 'Uttar Pradesh', 'Rajasthan', 'Bihar'];
      for (let i = 1; i <= 21; i++) {
        const dummyEmail = `level${i}@spay.com`;
        const dummyCode = `LVL${i}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
        const dummyUser: User = {
          id: `LVL-${i}`,
          name: `Leader Level ${i}`,
          email: dummyEmail,
          password: 'password123',
          transactionPin: '1111',
          phone: `98765${10000 + i}`,
          state: seedStates[i % seedStates.length],
          referralCode: dummyCode,
          referrerId: lastReferrerId,
          role: UserRole.USER,
          wallets: { 
            main: 5000 + (1000 * i), 
            commission: 2400 * (21 - i), 
            cashback: 120 * i, 
            recharge: 3000, 
            shopping: 1500, 
            reward: 25 * i 
          },
          totalEarned: 240 * (21 - i),
          status: 'active',
          level: i,
          joinedAt: new Date(Date.now() - (i * 24 * 3600 * 1000)).toISOString(),
          isActivated: true,
          rewards: INITIAL_REWARDS.map(r => ({
            ...r,
            currentSalesCount: Math.max(0, 10000 - (i * 450)),
            status: Math.max(0, 10000 - (i * 450)) >= r.targetSalesCount ? 'achieved' : 'locked'
          }))
        };
        cachedUsers.push(dummyUser);
        lastReferrerId = dummyUser.id;
        lastReferralCode = dummyUser.referralCode;
      }
      
      setUsers(prev => {
        const merged = [...cachedUsers];
        prev.forEach(u => {
          if (u && u.email && !merged.some(m => m.email.toLowerCase() === u.email.toLowerCase())) {
            merged.push(u);
          }
        });
        return merged;
      });
    }
  }, []);

  // Save changes locally
  useEffect(() => {
    if (users.length > 0) {
      safeLocalStorage.setItem('spay_users', JSON.stringify(users));
    }
    safeLocalStorage.setItem('spay_products', JSON.stringify(products));
    safeLocalStorage.setItem('spay_orders', JSON.stringify(orders));
    safeLocalStorage.setItem('spay_tx', JSON.stringify(transactions));
    safeLocalStorage.setItem('spay_config', JSON.stringify(mlmConfig));
    safeLocalStorage.setItem('spay_payments', JSON.stringify(paymentRequests));
    safeLocalStorage.setItem('spay_withdrawals', JSON.stringify(withdrawalRequests));
    safeLocalStorage.setItem('spay_chats', JSON.stringify(chatMessages));
  }, [users, products, orders, transactions, mlmConfig, paymentRequests, withdrawalRequests, chatMessages]);

  // Helper helper to distribute commissions up to 20 levels deep
  const distributeMLMCommissions = (startUserId: string, baseAmount: number, commissionType: 'package' | 'recharge' | 'product') => {
    const transactionList: Transaction[] = [];
    let currentReferrerId = users.find(u => u.id === startUserId)?.referrerId;
    let currentLevel = 1;

    // Commission Rates or Absolute values depending on type
    const percentages = commissionType === 'recharge' ? mlmConfig.rechargeCommission : mlmConfig.productCommission;
    const directPackageRates = mlmConfig.packageCommission;

    const updatedUsersMap = new Map<string, User>();
    users.forEach(u => updatedUsersMap.set(u.id, { ...u }));

    while (currentReferrerId && currentLevel <= 20) {
      const parentUser = updatedUsersMap.get(currentReferrerId);
      if (!parentUser) break;

      // Calculate commission amount
      let earning = 0;
      if (commissionType === 'package') {
        // Direct Package Commissions (Flat reward per level)
        earning = directPackageRates[currentLevel - 1] || 1;
      } else {
        // Percentage based on BV / Amount
        const rate = percentages[currentLevel - 1] || 0.001;
        earning = parseFloat((baseAmount * rate).toFixed(2));
      }

      if (earning > 0 && parentUser.isActivated) {
        // TDS + Admin deduction (5% TDS, e.g.)
        const tds = parseFloat((earning * mlmConfig.tdsRate).toFixed(2));
        const service = parseFloat((earning * mlmConfig.serviceCharge).toFixed(2));
        const finalNetEarning = parseFloat((earning - tds - service).toFixed(2));

        // Update wallets
        parentUser.wallets.commission = parseFloat((parentUser.wallets.commission + finalNetEarning).toFixed(2));
        parentUser.totalEarned = parseFloat((parentUser.totalEarned + finalNetEarning).toFixed(2));

        // Generate Transaction details
        transactionList.push({
          id: `COMM-${Date.now()}-${currentLevel}-${Math.random().toString(36).substr(2, 4)}`,
          userId: parentUser.id,
          amount: finalNetEarning,
          walletType: 'commission',
          type: 'commission',
          description: `Level ${currentLevel} ${commissionType} income (Gross ₹${earning}, TDS ₹${tds}, Dev ₹${service})`,
          status: 'success',
          createdAt: new Date().toISOString()
        });

        // Trigger updates to dynamic rewards progress count at Level 1 up to level 20
        if (parentUser.rewards) {
          parentUser.rewards = parentUser.rewards.map(rew => {
            const nextCount = rew.currentSalesCount + 1;
            const updatedUnlock = nextCount >= rew.targetSalesCount ? 'achieved' as const : rew.status;
            return {
              ...rew,
              currentSalesCount: nextCount,
              status: rew.status === 'locked' ? updatedUnlock : rew.status
            };
          });
        }
      }

      currentReferrerId = parentUser.referrerId;
      currentLevel++;
    }

    // Save and flush
    const nextUsers = Array.from(updatedUsersMap.values());
    setUsers(nextUsers);
    if (transactionList.length > 0) {
      setTransactions(prev => [...transactionList, ...prev]);
    }
  };

  const handleTransaction = (userId: string, amount: number, wallet: keyof Wallets, type: Transaction['type'], desc: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const value = (u.wallets[wallet] || 0) + amount;
        const rounded = parseFloat(value.toFixed(2));
        const newWallets = { ...u.wallets, [wallet]: rounded };
        return { 
          ...u, 
          wallets: newWallets, 
          totalEarned: (amount > 0 && (wallet === 'commission' || wallet === 'cashback')) ? parseFloat((u.totalEarned + amount).toFixed(2)) : u.totalEarned 
        };
      }
      return u;
    }));
    setTransactions(prev => [{
      id: `TX${Date.now()}`, userId, amount, walletType: wallet, type, description: desc, status: 'success', createdAt: new Date().toISOString()
    }, ...prev]);
  };

  const handleSendMessage = (msg: string, receiverId: string) => {
    if (!currentUser) return;
    const newMessage: ChatMessage = {
      id: `MSG${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      receiverId,
      message: msg,
      createdAt: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleWithdrawalRequest = (amount: number, pin: string) => {
    if (!currentUser) return;
    const user = users.find(u => u.id === currentUser.id);
    if (!user) return;
    if (user.transactionPin !== pin) return alert('🚨 Security Error: Invalid 4-Digit Security PIN');
    if (!user.bankDetails) return alert('🚨 Bank Details not found. Please complete bank update first.');
    if (user.wallets.commission < amount) return alert('🚨 Insufficient Earnings Balance');

    const newRequest: WithdrawalRequest = {
      id: `WITH${Date.now()}`,
      userId: user.id,
      userName: user.name,
      amount,
      status: 'pending',
      bankDetails: user.bankDetails,
      createdAt: new Date().toISOString()
    };
    
    handleTransaction(user.id, -amount, 'commission', 'withdrawal', `TDS-deducted bank payout request filed for ₹${amount}`);
    setWithdrawalRequests(prev => [newRequest, ...prev]);
    alert('✅ Payout Request Submitted Successfully! Approved by SmartPay Admin under TDS scheme.');
  };

  const handleApproveWithdrawal = (id: string) => {
    setWithdrawalRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    const req = withdrawalRequests.find(r => r.id === id);
    if (req) {
      // Also credit actual vendor or user state if required
    }
    alert('✅ Withdrawal Approved & Settled instantly to User registered UPI/Bank!');
  };

  const handleUpdateBankDetails = (details: any) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, bankDetails: details } : u));
    alert('✅ Payment UPI & Bank settlement details updated!');
  };

  const handleAddMoneyRequest = (data: { amount: number, utr: string, screenshot: string }) => {
    if (!currentUser) return;
    const newRequest: PaymentRequest = {
      id: `PAY${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      amount: data.amount,
      utr: data.utr,
      screenshot: data.screenshot,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setPaymentRequests(prev => [newRequest, ...prev]);
    alert('✅ Payment proof submitted to core admin logs. Main/Recharge Wallet is topped up as soon as UTR is verified!');
  };

  const handleApprovePayment = (requestId: string) => {
    const req = paymentRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return;
    handleTransaction(req.userId, req.amount, 'recharge', 'add_funds', `Funds Loaded: UTR Verification ${req.utr}`);
    setPaymentRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
    alert('✅ UTR validated successfully. Recharge Wallet loaded!');
  };

  const handleSignup = (data: any) => {
    const signupEmail = String(data.email || '').trim().toLowerCase();
    if (users.some(u => u && u.email && u.email.toLowerCase().trim() === signupEmail)) {
      return alert('🚨 Error: Email registered with another account.');
    }

    // Check sponsor ID
    const inputReferralCode = String(data.referralCode || '').trim().toUpperCase();
    const ref = users.find(u => {
      if (!u || !u.referralCode) return false;
      return String(u.referralCode).trim().toUpperCase() === inputReferralCode;
    }) || users[0]; // defaults to admin-0 if empty
    
    const initialRewardsList: RewardTarget[] = INITIAL_REWARDS.map(r => ({ ...r, currentSalesCount: 0 }));

    const newUser: User = {
      ...data, 
      email: data.email.trim(),
      password: data.password.trim(),
      transactionPin: data.transactionPin.trim(),
      state: data.state || 'Delhi',
      id: `U${Date.now()}`, 
      role: UserRole.USER, 
      referralCode: `SP360${Math.floor(1000 + Math.random() * 9000)}`,
      referrerId: ref.id, 
      level: ref.level + 1, 
      wallets: { main: 0, commission: 0, cashback: 0, recharge: 0, shopping: 0, reward: 0 },
      totalEarned: 0, 
      status: 'pending', 
      isActivated: false, 
      joinedAt: new Date().toISOString(),
      rewards: initialRewardsList,
      kycDetails: { aadhaarNumber: '', panNumber: '', status: 'not_submitted' }
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
  };

  const handleLogin = (phoneOrEmail: string, password?: string) => {
    const trimmedInput = phoneOrEmail.trim().toLowerCase();
    const trimmedPassword = password?.trim();
    const u = users.find(user => 
      (user.email.toLowerCase() === trimmedInput || user.phone === trimmedInput) && 
      user.password === trimmedPassword
    );
    if (u) {
      setCurrentUser(u);
    } else {
      alert('🚨 Secure Auth Failed. Please ensure password and Mobile number / Email are correct.');
    }
  };

  const handleRecover = (email: string, phone: string, type: 'password' | 'pin'): string | null => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const user = users.find(u => u.email.toLowerCase() === trimmedEmail && u.phone === trimmedPhone);
    if (!user) return null;
    return type === 'password' ? (user.password || null) : user.transactionPin;
  };

  // Upgraded Mobile / Bill Utility Recharge with 20 levels commission
  const handleRecharge = (userId: string, amount: number, service: string, pin: string, operator: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.isActivated) return alert('🚨 MLM Warning: Please activate your account first with the active package to start earning cashback.');
    if (user.transactionPin !== pin) return alert('🚨 Security Error: Transaction PIN incorrect.');
    
    // Choose wallets: deduct from recharge wallet first, or fallback to main wallet
    let walletToDebit: 'recharge' | 'main' = 'recharge';
    if (user.wallets.recharge >= amount) {
      walletToDebit = 'recharge';
    } else if (user.wallets.main >= amount) {
      walletToDebit = 'main';
    } else {
      return alert(`🚨 Wallet Error: Insufficient funds. Payment requires ₹${amount.toFixed(2)}. Your Recharge Wallet has ₹${user.wallets.recharge.toFixed(2)} and Main Wallet has ₹${user.wallets.main.toFixed(2)}.`);
    }

    // Process recharge
    handleTransaction(userId, -amount, walletToDebit, 'recharge', `${operator} ${service} Recharge of ₹${amount}`);
    
    // Instant 2% cashback
    const cashback = parseFloat((amount * 0.02).toFixed(2));
    handleTransaction(userId, cashback, 'cashback', 'recharge', `Instant 2% Cashback on ${operator} ${service}`);

    // Distribute 20 Level commissions!
    distributeMLMCommissions(userId, amount, 'recharge');
    alert(`🎉 ${operator} ${service} payment of ₹${amount} successful! Cashback of ₹${cashback} credited. Debited from your ${walletToDebit === 'recharge' ? 'Recharge' : 'Main'} Wallet.`);
  };

  // Upgraded Place Order with shopping cashback + rewards logic and 20 level BV (BV distribution)
  const placeOrder = (userId: string, productId: string) => {
    const user = users.find(u => u.id === userId);
    const product = products.find(p => p.id === productId);
    if (!user || !user.isActivated) return alert('🚨 MLM Warning: Activate your package first.');
    if (!product) return;
    
    // Choose wallets (user can buy from Main Wallet OR Shopping Wallet)
    const availableFund = user.wallets.main + user.wallets.shopping;
    if (availableFund < product.price) return alert('🚨 Insufficient balance in both Cash & Shopping Wallets');

    // Deduct
    if (user.wallets.shopping >= product.price) {
      handleTransaction(userId, -product.price, 'shopping', 'shopping', `E-commerce checkout: ${product.name}`);
    } else {
      const rem = product.price - user.wallets.shopping;
      if (user.wallets.shopping > 0) {
        handleTransaction(userId, -user.wallets.shopping, 'shopping', 'shopping', `Partial part: ${product.name}`);
      }
      handleTransaction(userId, -rem, 'main', 'shopping', `E-commerce checkout: ${product.name}`);
    }

    // Add Reward / BV points to buyer
    handleTransaction(userId, product.mlmPoints, 'reward', 'reward', `BV (Business Volume) rewards points from ${product.name}`);

    // Create tracking order
    const nextOrder: Order = {
      id: `ORD${Date.now()}`,
      userId: user.id,
      userName: user.name,
      vendorId: product.vendorId,
      productId: product.id,
      productName: product.name,
      amount: product.price,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setOrders(prev => [nextOrder, ...prev]);

    // Distribute Brand commissions up to 20 levels deep on BV (mlmPoints * Level commission multiplier)
    distributeMLMCommissions(userId, product.mlmPoints, 'product');
    alert(`🛒 Order placed! ${product.mlmPoints} BV Added to Genealogy.`);
  };

  // Fund Peer-to-Peer Transfer handler
  const handleTransfer = (senderId: string, recipientEmail: string, amount: number, pin: string) => {
    const sender = users.find(u => u.id === senderId);
    if (!sender) return;
    if (sender.transactionPin !== pin) return alert('🚨 Security Error: Security PIN incorrect.');
    if (sender.wallets.main < amount) return alert('🚨 Balance Error: Insufficient funds in Coin/Main wallet.');
    
    const recipient = users.find(u => u.email.toLowerCase() === recipientEmail.trim().toLowerCase());
    if (!recipient) return alert('🚨 Operator Error: Recipient member email not registered on S360.');
    if (recipient.id === senderId) return alert('🚨 Operator Error: Cannot transfer funds to self.');

    // Deduct sender & credit recipient
    handleTransaction(senderId, -amount, 'main', 'transfer', `Fund transfer to ${recipient.name} (${recipient.email})`);
    handleTransaction(recipient.id, amount, 'main', 'transfer', `Fund transfer received from ${sender.name} (${sender.email})`);
    
    alert(`🎉 Fund transfer of ₹${amount} successful to ${recipient.name}!`);
  };

  // Complete MLM Activation with automatic level commission distribution
  const handleActivateAccount = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Check if either recharge or main wallet has enough funds
    let walletToDebit: 'recharge' | 'main' = 'recharge';
    if (user.wallets.recharge >= mlmConfig.packagePrice) {
      walletToDebit = 'recharge';
    } else if (user.wallets.main >= mlmConfig.packagePrice) {
      walletToDebit = 'main';
    } else {
      return alert(`🚨 activation requires ₹${mlmConfig.packagePrice} in Recharge Wallet or Main Cash Wallet. Your Recharge Wallet has ₹${user.wallets.recharge.toFixed(2)} and Main Wallet has ₹${user.wallets.main.toFixed(2)}.`);
    }

    handleTransaction(userId, -mlmConfig.packagePrice, walletToDebit, 'activation', `S360 Elite Active Member Package Joining fee`);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActivated: true, status: 'active' } : u));

    // Distribute core Level Package commissions up to 20 levels!
    distributeMLMCommissions(userId, mlmConfig.packagePrice, 'package');
    alert(`🎉 Congratulations! Your active core MLM distribution portfolio is online now. Debited from your ${walletToDebit === 'recharge' ? 'Recharge' : 'Main'} Wallet.`);
  };

  // Submit KYC
  const handleSubmitKYC = (aadhaar: string, pan: string, gst?: string) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          kycDetails: {
            aadhaarNumber: aadhaar,
            panNumber: pan,
            gstNumber: gst,
            status: 'pending'
          }
        };
      }
      return u;
    }));
    alert('📄 KYC documents uploaded and logged for pending Admin audit!');
  };

  // Vendor Action: Add Product
  const handleAddProduct = (prod: Product) => {
    setProducts(prev => [prod, ...prev]);
  };

  // Claim Rewards
  const handleClaimReward = (rewardId: string) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id && u.rewards) {
        return {
          ...u,
          rewards: u.rewards.map(r => r.id === rewardId ? { ...r, status: 'claimed' } : r)
        };
      }
      return u;
    }));
    alert('🎁 Reward claim request logged successfully! S360 rewards dispatch team will contact you.');
  };

  // Admin Actions to fast-forward simulate items
  const handleApproveKYC = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId && u.kycDetails) {
        return { ...u, kycDetails: { ...u.kycDetails, status: 'approved' } };
      }
      return u;
    }));
    alert('✅ KYC Approved and activated!');
  };

  const handleApproveProduct = (prodId: string) => {
    setProducts(prev => prev.map(p => p.id === prodId ? { ...p, isApproved: true } : p));
    alert('✅ Multi-Vendor Product Approved & launched to S360 Store!');
  };

  const handleApproveReward = (userId: string, rewardId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId && u.rewards) {
        return {
          ...u,
          rewards: u.rewards.map(r => r.id === rewardId ? { ...r, status: 'approved' as const } : r)
        };
      }
      return u;
    }));
    alert('✅ Reward target verified! Dispatched instantly to achiever!');
  };

  const handleToggleUserRole = (userId: string) => {
    if (currentUser?.id === userId) {
      alert('⚠️ Security Guard: You cannot change your own Administrator permissions!');
      return;
    }
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newRole = u.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;
        return { ...u, role: newRole };
      }
      return u;
    }));
    alert('🛡️ Member administrative group privileges updated successfully!');
  };

  const activeUser = users.find(u => u.id === (currentUser ? currentUser.id : '')) || currentUser;

  if (!currentUser || !activeUser) {
    return (
      <ErrorBoundary>
        <Auth onLogin={handleLogin} onSignup={handleSignup} onRecover={handleRecover} users={users} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Layout 
        user={activeUser} 
        onLogout={() => setCurrentUser(null)} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      >
        {activeUser.role === UserRole.ADMIN ? (
          <AdminPanel 
            users={users} 
            transactions={transactions} 
            config={mlmConfig} 
            onUpdateConfig={setMlmConfig}
            paymentRequests={paymentRequests}
            onApprovePayment={handleApprovePayment}
            withdrawalRequests={withdrawalRequests}
            onApproveWithdrawal={handleApproveWithdrawal}
            chatMessages={chatMessages}
            onSendMessage={handleSendMessage}
            products={products}
            onAddProduct={handleAddProduct}
            onApproveKYC={handleApproveKYC}
            onApproveReward={handleApproveReward}
            onToggleUserRole={handleToggleUserRole}
          />
        ) : activeUser.role === UserRole.VENDOR ? (
          <VendorPanel 
            user={activeUser}
            products={products}
            orders={orders}
            onAddProduct={handleAddProduct}
          />
        ) : (
          <Dashboard 
            user={activeUser} 
            users={users} 
            products={products.filter(p => p.isApproved !== false)}
            transactions={transactions.filter(t => t.userId === activeUser.id)} 
            onRecharge={handleRecharge}
            onOrder={placeOrder}
            onTransfer={handleTransfer}
            onActivate={handleActivateAccount}
            packagePrice={mlmConfig.packagePrice}
            qrCode={mlmConfig.qrCode}
            onAddMoney={handleAddMoneyRequest}
            paymentRequests={paymentRequests.filter(r => r.userId === activeUser.id)}
            withdrawalRequests={withdrawalRequests.filter(r => r.userId === activeUser.id)}
            onWithdrawal={handleWithdrawalRequest}
            onUpdateBankDetails={handleUpdateBankDetails}
            chatMessages={chatMessages.filter(m => m.senderId === activeUser.id || m.receiverId === activeUser.id)}
            onSendMessage={handleSendMessage}
            tab={activeTab}
            setTab={setActiveTab}
            onSubmitKYC={handleSubmitKYC}
            onClaimReward={handleClaimReward}
          />
        )}
      </Layout>
    </ErrorBoundary>
  );
};

export default App;
