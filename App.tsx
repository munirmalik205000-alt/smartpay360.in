
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Transaction, Product, Order, MLMConfig, Wallets, PaymentRequest, WithdrawalRequest, ChatMessage, KYCDetails, RewardTarget, Package } from './types';
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
  qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=smartpay360@okaxis%26pn=SmartPay360%26am=999%26cu=INR',
  levelRupeeRates: [...DEFAULT_LEVEL_PERCENTAGES_20],
  levelCoinRates: [...DEFAULT_LEVEL_PERCENTAGES_20]
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
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = safeLocalStorage.getItem('spay_current_user', '');
      if (saved) {
        const u = JSON.parse(saved) as User;
        if (u.role === UserRole.ADMIN) return 'admin';
        if (u.role === UserRole.VENDOR) return 'vendor';
      }
    } catch {}
    return 'home';
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return safeLocalStorage.getItem('spay_theme', 'dark') === 'dark';
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const parsed = JSON.parse(safeLocalStorage.getItem('spay_users', '[]'));
      if (Array.isArray(parsed)) {
        return parsed.filter((u: any) => u && u.id && !u.id.startsWith('MOCK-') && !(u.email && u.email.toLowerCase().includes('sponsor_')) && !(u.name && u.name.toLowerCase().includes('sponsor partner')));
      }
    } catch {}
    return [];
  });
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(safeLocalStorage.getItem('spay_products', JSON.stringify(INITIAL_PRODUCTS))));
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(safeLocalStorage.getItem('spay_orders', '[]')));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(safeLocalStorage.getItem('spay_tx', '[]')));
  const [mlmConfig, setMlmConfig] = useState<MLMConfig>(() => {
    try {
      const saved = safeLocalStorage.getItem('spay_config', '');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_MLM_CONFIG,
          ...parsed,
          levelRupeeRates: parsed.levelRupeeRates || [...DEFAULT_LEVEL_PERCENTAGES_20],
          levelCoinRates: parsed.levelCoinRates || [...DEFAULT_LEVEL_PERCENTAGES_20]
        };
      }
    } catch {}
    return DEFAULT_MLM_CONFIG;
  });
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => JSON.parse(safeLocalStorage.getItem('spay_payments', '[]')));
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => JSON.parse(safeLocalStorage.getItem('spay_withdrawals', '[]')));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => JSON.parse(safeLocalStorage.getItem('spay_chats', '[]')));
  
  const [packages, setPackages] = useState<Package[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('spay_pkgs', '');
      return saved ? JSON.parse(saved) : [
        { id: 'pkg_starter', name: 'Starter Node Package', price: 999, pv: 100, coin: 250, coinUsablePercent: 10 },
        { id: 'pkg_booster', name: 'Premium Royal Booster', price: 2999, pv: 400, coin: 800, coinUsablePercent: 15 },
        { id: 'pkg_elite', name: 'Elite Global Franchise Node', price: 9999, pv: 1500, coin: 3000, coinUsablePercent: 20 }
      ];
    } catch {
      return [
        { id: 'pkg_starter', name: 'Starter Node Package', price: 999, pv: 100, coin: 250, coinUsablePercent: 10 },
        { id: 'pkg_booster', name: 'Premium Royal Booster', price: 2999, pv: 400, coin: 800, coinUsablePercent: 15 },
        { id: 'pkg_elite', name: 'Elite Global Franchise Node', price: 9999, pv: 1500, coin: 3000, coinUsablePercent: 20 }
      ];
    }
  });

  const isSyncingFromServer = useRef(false);
  const lastServerDbStringRef = useRef<string>("");
  const [isLoadedFromServer, setIsLoadedFromServer] = useState(false);

  // Sync state from server on component mount and poll periodically
  useEffect(() => {
    const fetchDb = async () => {
      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          const text = await response.text();
          if (text && text !== lastServerDbStringRef.current) {
            const data = JSON.parse(text);
            lastServerDbStringRef.current = text;

            // Flag that we are syncing from server to bypass save POST
            isSyncingFromServer.current = true;

            if (data && data.users && data.users.length > 0) {
              setUsers(data.users);
              if (data.products) setProducts(data.products);
              if (data.orders) setOrders(data.orders);
              if (data.transactions) setTransactions(data.transactions);
              if (data.paymentRequests) setPaymentRequests(data.paymentRequests);
              if (data.withdrawalRequests) setWithdrawalRequests(data.withdrawalRequests);
              if (data.chatMessages) setChatMessages(data.chatMessages);
              if (data.packages) setPackages(data.packages);

              // Sync current session state with updated credentials from server
              const localSaved = safeLocalStorage.getItem('spay_current_user', '');
              if (localSaved) {
                const u = JSON.parse(localSaved);
                const freshUser = (data.users as User[]).find(f => f.id === u.id);
                if (freshUser) {
                  setCurrentUser(freshUser);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching system database:', err);
      } finally {
        setIsLoadedFromServer(true);
      }
    };

    fetchDb();

    // Poll every 3 seconds to keep website & app fully in sync
    const interval = setInterval(fetchDb, 3000);
    return () => clearInterval(interval);
  }, []);

  // Synchronous config-updating pipeline to maintain full robustness
  const handleUpdateConfig = (newConfig: MLMConfig) => {
    setMlmConfig(newConfig);
    safeLocalStorage.setItem('spay_config', JSON.stringify(newConfig));
    
    // Direct server persistent save
    fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newConfig)
    }).catch(err => console.error('Failed to save configuration permanently:', err));

    setTimeout(() => {
      window.dispatchEvent(new Event('spay-logo-updated'));
    }, 50);
  };

  // Register global direct logo update endpoint to resolve async race-conditions
  useEffect(() => {
    (window as any).spay_update_logo = (logoBase64: string | undefined) => {
      setMlmConfig(prev => {
        const updated = { ...prev, customLogo: logoBase64 };
        safeLocalStorage.setItem('spay_config', JSON.stringify(updated));
        
        fetch('/api/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updated)
        }).catch(err => console.error('Failed to save configuration permanently:', err));

        return updated;
      });

      setTimeout(() => {
        window.dispatchEvent(new Event('spay-logo-updated'));
      }, 50);
    };

    return () => {
      delete (window as any).spay_update_logo;
    };
  }, []);

  // Load and sync configuration from the full-stack server and poll periodically
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const serverConfig = await response.json();
          if (serverConfig && (serverConfig.customLogo || serverConfig.systemName || serverConfig.qrCode)) {
            // Merge with local config
            const localConfigStr = safeLocalStorage.getItem('spay_config', '{}');
            const localConfig = JSON.parse(localConfigStr);
            const merged = { ...localConfig, ...serverConfig };
            safeLocalStorage.setItem('spay_config', JSON.stringify(merged));
            
            // Also update the MLMConfig state
            setMlmConfig(prev => {
              if (
                prev.customLogo === serverConfig.customLogo &&
                prev.systemName === serverConfig.systemName &&
                prev.qrCode === serverConfig.qrCode
              ) {
                return prev;
              }
              return {
                ...prev,
                ...serverConfig,
                levelRupeeRates: serverConfig.levelRupeeRates || prev.levelRupeeRates,
                levelCoinRates: serverConfig.levelCoinRates || prev.levelCoinRates
              };
            });
            
            // Trigger instant reactive logo and text updates
            window.dispatchEvent(new Event('spay-logo-updated'));
          }
        }
      } catch (err) {
        console.error('Error fetching global brand configuration:', err);
      }
    };
    fetchConfig();
    const interval = setInterval(fetchConfig, 4000);
    return () => clearInterval(interval);
  }, []);

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
      window.dispatchEvent(new Event('spay-logo-updated'));
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
        wallets: { main: 5000000, commission: 0, cashback: 0, recharge: 5000000, shopping: 5000000, reward: 1000000, ewallet: 50000, coinwallet: 100000 },
        totalEarned: 0,
        status: 'active',
        level: 0,
        joinedAt: new Date().toISOString(),
        isActivated: true,
        selfPV: 500,
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
            reward: 25 * i,
            ewallet: 1500,
            coinwallet: 100 * i
          },
          totalEarned: 240 * (21 - i),
          status: 'active',
          level: i,
          joinedAt: new Date(Date.now() - (i * 24 * 3600 * 1000)).toISOString(),
          isActivated: true,
          selfPV: i * 10,
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

  // Save changes locally and to the server's disk database
  useEffect(() => {
    if (!isLoadedFromServer) return; // Prevent overwriting database with empty states on initial load

    // If this update was triggered by fetching remote changes, do not post it back to server
    if (isSyncingFromServer.current) {
      isSyncingFromServer.current = false;

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
      safeLocalStorage.setItem('spay_pkgs', JSON.stringify(packages));
      return;
    }

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
    safeLocalStorage.setItem('spay_pkgs', JSON.stringify(packages));

    const payload = {
      users,
      products,
      orders,
      transactions,
      paymentRequests,
      withdrawalRequests,
      chatMessages,
      packages
    };
    const payloadStr = JSON.stringify(payload);

    // If local state matches current server state, skip network post
    if (payloadStr === lastServerDbStringRef.current) {
      return;
    }

    // Update the ref to match the new local state payload we are sending out
    lastServerDbStringRef.current = payloadStr;

    // Synchronize to unified backend JSON database
    fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payloadStr
    }).catch(err => console.error('Failed to sync changes with backend:', err));
  }, [users, products, orders, transactions, mlmConfig, paymentRequests, withdrawalRequests, chatMessages, packages, isLoadedFromServer]);

  // Sync state when direct logo uploaded
  useEffect(() => {
    const handleLogoStateUpdate = () => {
      try {
        const saved = safeLocalStorage.getItem('spay_config', '');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.customLogo !== mlmConfig.customLogo) {
            setMlmConfig(prev => ({
              ...prev,
              customLogo: parsed.customLogo
            }));
          }
        }
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('spay-logo-updated', handleLogoStateUpdate);
    return () => {
      window.removeEventListener('spay-logo-updated', handleLogoStateUpdate);
    };
  }, [mlmConfig.customLogo]);

  // Dispatch logo-updated event to update all visible Logo components on customLogo or systemName change
  useEffect(() => {
    window.dispatchEvent(new Event('spay-logo-updated'));
  }, [mlmConfig.customLogo, mlmConfig.systemName]);

  // Helper helper to distribute commissions up to 20 levels deep
  const distributeMLMCommissions = (startUserId: string, baseAmount: number, commissionType: 'package' | 'recharge' | 'product') => {
    const transactionList: Transaction[] = [];
    let currentReferrerId = users.find(u => u.id === startUserId)?.referrerId;
    let currentLevel = 1;

    // Commission Rates or Absolute values depending on type
    const percentages = commissionType === 'recharge' ? mlmConfig.rechargeCommission : mlmConfig.productCommission;

    const updatedUsersMap = new Map<string, User>();
    users.forEach(u => updatedUsersMap.set(u.id, { ...u }));

    while (currentReferrerId && currentLevel <= 20) {
      const parentUser = updatedUsersMap.get(currentReferrerId);
      if (!parentUser) break;

      // Calculate commission amount
      let earning = 0;
      let coinEarning = 0;

      if (commissionType === 'package') {
        // Direct Package Commissions (using dynamic level rate splits)
        const rupeeRate = (mlmConfig.levelRupeeRates && mlmConfig.levelRupeeRates[currentLevel - 1] !== undefined)
          ? mlmConfig.levelRupeeRates[currentLevel - 1]
          : (DEFAULT_LEVEL_PERCENTAGES_20[currentLevel - 1] || 0.005);

        const coinRate = (mlmConfig.levelCoinRates && mlmConfig.levelCoinRates[currentLevel - 1] !== undefined)
          ? mlmConfig.levelCoinRates[currentLevel - 1]
          : (DEFAULT_LEVEL_PERCENTAGES_20[currentLevel - 1] || 0.005);

        // Rupees Referral Income from ID Activation (rupeeRate * package activation price)
        earning = parseFloat((baseAmount * rupeeRate).toFixed(2));
        // Coin Referral Income from ID Activation (calculated from 500 base active coins * coinRate)
        coinEarning = parseFloat((500 * coinRate).toFixed(2));
      } else {
        // Percentage based on BV / Amount
        const rate = percentages[currentLevel - 1] || 0.001;
        earning = parseFloat((baseAmount * rate).toFixed(2));
      }

      if (parentUser.isActivated) {
        let finalNetEarning = 0;
        let tds = 0;
        let service = 0;

        if (earning > 0) {
          // TDS + Admin deduction (5% TDS, e.g.)
          tds = parseFloat((earning * mlmConfig.tdsRate).toFixed(2));
          service = parseFloat((earning * mlmConfig.serviceCharge).toFixed(2));
          finalNetEarning = parseFloat((earning - tds - service).toFixed(2));

          // Update wallets - Add to main cash wallet per request
          parentUser.wallets.main = parseFloat(((parentUser.wallets.main || 0) + finalNetEarning).toFixed(2));
          parentUser.totalEarned = parseFloat((parentUser.totalEarned + finalNetEarning).toFixed(2));
        }

        if (coinEarning > 0) {
          parentUser.wallets.coinwallet = parseFloat(((parentUser.wallets.coinwallet || 0) + coinEarning).toFixed(2));
        }

        if (earning > 0) {
          // Generate Transaction details
          transactionList.push({
            id: `COMM-${Date.now()}-${currentLevel}-${Math.random().toString(36).substr(2, 4)}`,
            userId: parentUser.id,
            amount: finalNetEarning,
            walletType: 'main',
            type: 'commission',
            description: `Level ${currentLevel} ${commissionType} Income (Gross ₹${earning.toFixed(2)}, TDS ₹${tds.toFixed(2)}, Dev ₹${service.toFixed(2)})`,
            status: 'success',
            createdAt: new Date().toISOString()
          });
        }

        if (coinEarning > 0) {
          transactionList.push({
            id: `ACTCOINC-${Date.now()}-${currentLevel}-${Math.random().toString(36).substr(2, 4)}`,
            userId: parentUser.id,
            amount: coinEarning,
            walletType: 'coinwallet',
            type: 'coin_commission',
            description: `Level ${currentLevel} Active Team Coins Commission reward (+${coinEarning} Coins)`,
            status: 'success',
            createdAt: new Date().toISOString()
          });
        }

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
    if (user.wallets.main < amount) return alert('🚨 Insufficient Main Wallet Balance');

    const newRequest: WithdrawalRequest = {
      id: `WITH${Date.now()}`,
      userId: user.id,
      userName: user.name,
      amount,
      status: 'pending',
      bankDetails: user.bankDetails,
      createdAt: new Date().toISOString()
    };
    
    handleTransaction(user.id, -amount, 'main', 'withdrawal', `TDS-deducted bank payout request filed for ₹${amount}`);
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
    alert('✅ Payment proof submitted to core admin logs. E-Wallet/Main Wallet is topped up as soon as UTR is verified!');
  };

  const handleApprovePayment = (requestId: string) => {
    const req = paymentRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return;
    handleTransaction(req.userId, req.amount, 'ewallet', 'add_funds', `Funds Loaded: UTR Verification ${req.utr}`);
    setPaymentRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
    alert('✅ UTR validated successfully. E-Wallet loaded!');
  };

  const handleCreatePackage = (name: string, price: number, pv: number, coin: number, coinUsablePercent: number = 10) => {
    const newPkg: Package = {
      id: `pkg_${Date.now()}`,
      name,
      price,
      pv,
      coin,
      coinUsablePercent
    };
    setPackages(prev => [...prev, newPkg]);
    alert(`🎉 Package '${name}' created successfully with PV: ${pv}, Coins: ${coin}, and Coins Usable limit: ${coinUsablePercent}%!`);
  };

  const handleDeletePackage = (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
    alert('✅ Custom package deleted successfully.');
  };

  const handleBuyPackage = (userId: string, packageId: string) => {
    const user = users.find(u => u.id === userId);
    const pkg = packages.find(p => p.id === packageId);
    if (!user || !pkg) return alert('🚨 Subscriber or Package configuration mismatch.');

    const price = pkg.price;
    if ((user.wallets?.ewallet || 0) < price) {
      alert(`🚨 Insufficient E-Wallet balance! Cost is ₹${price}, current balance is ₹${(user.wallets?.ewallet || 0)}.`);
      return;
    }

    const transactionList: Transaction[] = [];
    const updatedUsersMap = new Map<string, User>();
    users.forEach(u => updatedUsersMap.set(u.id, { ...u }));

    const buyer = updatedUsersMap.get(userId);
    if (buyer) {
      buyer.wallets.ewallet = parseFloat((buyer.wallets.ewallet - price).toFixed(2));
      buyer.isActivated = true;
      buyer.status = 'active';
      buyer.selfPV = (buyer.selfPV || 0) + pkg.pv;
      buyer.wallets.coinwallet = parseFloat(((buyer.wallets.coinwallet || 0) + pkg.coin).toFixed(2));
      buyer.coinUsablePercent = pkg.coinUsablePercent || 10;

      // 1. Cost Transaction
      transactionList.push({
        id: `PKGBUY-${Date.now()}`,
        userId: buyer.id,
        amount: -price,
        walletType: 'ewallet',
        type: 'package_buy',
        description: `Purchased Upgrade: ${pkg.name} (PV +${pkg.pv})`,
        status: 'success',
        createdAt: new Date().toISOString()
      });

      // 2. Direct coin credit Transaction
      transactionList.push({
        id: `COINREWD-${Date.now()}`,
        userId: buyer.id,
        amount: pkg.coin,
        walletType: 'coinwallet',
        type: 'coin_reward',
        description: `Staked Coin Reward from Upgrade Node ${pkg.name}`,
        status: 'success',
        createdAt: new Date().toISOString()
      });
    }

    // Level-wise Cash and Level-wise Coin Dynamic Split cascade up to 20 levels deep
    let currentReferrerId = buyer?.referrerId;
    let currentLevel = 1;

    while (currentReferrerId && currentLevel <= 20) {
      const parentUser = updatedUsersMap.get(currentReferrerId);
      if (!parentUser) break;

      // level commission percentage rate from admin system configs if present
      const rupeeRate = (mlmConfig.levelRupeeRates && mlmConfig.levelRupeeRates[currentLevel - 1] !== undefined)
        ? mlmConfig.levelRupeeRates[currentLevel - 1]
        : (DEFAULT_LEVEL_PERCENTAGES_20[currentLevel - 1] || 0.005);

      const coinRate = (mlmConfig.levelCoinRates && mlmConfig.levelCoinRates[currentLevel - 1] !== undefined)
        ? mlmConfig.levelCoinRates[currentLevel - 1]
        : (DEFAULT_LEVEL_PERCENTAGES_20[currentLevel - 1] || 0.005);

      // Rupees Level Income (rupeeRate * price)
      const rupeeEarning = parseFloat((price * rupeeRate).toFixed(2));
      // Coin Level Reward (coinRate * pkg.coin)
      const coinEarning = parseFloat((pkg.coin * coinRate).toFixed(2));
      // PV Level Reward (using rupeeRate * pkg.pv or standard rate)
      const pvEarning = parseFloat((pkg.pv * rupeeRate).toFixed(2));

      if (parentUser.isActivated) {
        // Calculate TDS and administration fee deductions
        const tds = parseFloat((rupeeEarning * mlmConfig.tdsRate).toFixed(2));
        const service = parseFloat((rupeeEarning * mlmConfig.serviceCharge).toFixed(2));
        const finalNetRupee = parseFloat((rupeeEarning - tds - service).toFixed(2));

        // Credit parents wallets - Main wallet preferred instead of commission
        parentUser.wallets.main = parseFloat(((parentUser.wallets.main || 0) + finalNetRupee).toFixed(2));
        parentUser.totalEarned = parseFloat((parentUser.totalEarned + finalNetRupee).toFixed(2));
        parentUser.wallets.coinwallet = parseFloat(((parentUser.wallets.coinwallet || 0) + coinEarning).toFixed(2));
        parentUser.selfPV = parseFloat(((parentUser.selfPV || 0) + pvEarning).toFixed(2));

        // Rupee transaction entry (walletType changed to 'main')
        transactionList.push({
          id: `PKGM-${Date.now()}-${currentLevel}-${Math.random().toString(36).substr(2, 4)}`,
          userId: parentUser.id,
          amount: finalNetRupee,
          walletType: 'main',
          type: 'commission',
          description: `Level ${currentLevel} Package Income from node ${buyer?.name} (Base ₹${rupeeEarning.toFixed(2)}, TDS ₹${tds.toFixed(2)})`,
          status: 'success',
          createdAt: new Date().toISOString()
        });

        // Coin transaction entry
        transactionList.push({
          id: `PKGC-${Date.now()}-${currentLevel}-${Math.random().toString(36).substr(2, 4)}`,
          userId: parentUser.id,
          amount: coinEarning,
          walletType: 'coinwallet',
          type: 'coin_commission',
          description: `Level ${currentLevel} Team Coin Reward from ${buyer?.name} (+${coinEarning} Coins)`,
          status: 'success',
          createdAt: new Date().toISOString()
        });
      }

      currentReferrerId = parentUser.referrerId;
      currentLevel++;
    }

    const nextUsers = Array.from(updatedUsersMap.values());
    setUsers(nextUsers);
    if (transactionList.length > 0) {
      setTransactions(prev => [...transactionList, ...prev]);
    }

    // Sync active state update to local session if same as active user
    if (currentUser && currentUser.id === userId) {
      const liveUser = nextUsers.find(u => u.id === userId);
      if (liveUser) setCurrentUser(liveUser);
    }

    alert(`🎉 Purchase completed successfully! Upgrade complete. You received ${pkg.coin} Coins & PV ${pkg.pv} counts towards your selfPV metrics! 20-Level Cascade split has been completed!`);
  };

  const handleSignup = (data: any) => {
    const signupEmail = String(data.email || '').trim().toLowerCase();
    if (users.some(u => u && u.email && u.email.toLowerCase().trim() === signupEmail)) {
      return alert('🚨 Error: Email registered with another account.');
    }

    // Check sponsor ID - strictly require valid & active code
    const inputReferralCode = String(data.referralCode || '').trim().toUpperCase();
    if (!inputReferralCode) {
      return alert('🚨 Error: Referral Code is required to sign up.');
    }

    const ref = users.find(u => {
      if (!u || !u.referralCode) return false;
      const idStr = String(u.id || '');
      const emailStr = String(u.email || '').toLowerCase();
      const nameStr = String(u.name || '').toLowerCase();
      
      const isMock = idStr.startsWith('MOCK-') || emailStr.includes('sponsor_') || nameStr.includes('sponsor partner');
      return String(u.referralCode).trim().toUpperCase() === inputReferralCode && u.status === 'active' && !isMock;
    });

    if (!ref) {
      return alert('🚨 Error: The sponsor referral code is invalid, inactive, or suspended.');
    }
    
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
      wallets: { main: 0, commission: 0, cashback: 0, recharge: 0, shopping: 0, reward: 0, ewallet: 2000, coinwallet: 0 },
      totalEarned: 0, 
      status: 'pending', 
      isActivated: false, 
      selfPV: 0,
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
      if (u.role === UserRole.ADMIN) {
        setActiveTab('admin');
      } else if (u.role === UserRole.VENDOR) {
        setActiveTab('vendor');
      } else {
        setActiveTab('home');
      }
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
  const handleRecharge = (userId: string, amount: number, service: string, pin: string, operator: string, useCoins: boolean = false) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.isActivated) return alert('🚨 MLM Warning: Please activate your account first with the active package to start earning cashback.');
    if (user.transactionPin !== pin) return alert('🚨 Security Error: Transaction PIN incorrect.');
    
    let coinsToDeduct = 0;
    if (useCoins && user.wallets.coinwallet > 0) {
      const percentageLimit = user.coinUsablePercent || 10;
      const maxCoins = parseFloat((amount * (percentageLimit / 100)).toFixed(2));
      coinsToDeduct = parseFloat(Math.min(maxCoins, user.wallets.coinwallet).toFixed(2));
    }

    const netAmountToDebit = parseFloat((amount - coinsToDeduct).toFixed(2));

    // Choose wallets: deduct from ewallet first, or fallback to main wallet
    let walletToDebit: 'ewallet' | 'main' = 'ewallet';
    if ((user.wallets.ewallet || 0) >= netAmountToDebit) {
      walletToDebit = 'ewallet';
    } else if (user.wallets.main >= netAmountToDebit) {
      walletToDebit = 'main';
    } else {
      return alert(`🚨 Wallet Error: Insufficient funds. Payment requires ₹${netAmountToDebit.toFixed(2)} (after utilizing ${coinsToDeduct} Coins for ₹${coinsToDeduct} discount). Your E-Wallet has ₹${(user.wallets.ewallet || 0).toFixed(2)} and Main Wallet has ₹${user.wallets.main.toFixed(2)}.`);
    }

    // Deduct coins if used
    if (coinsToDeduct > 0) {
      handleTransaction(userId, -coinsToDeduct, 'coinwallet', 'recharge', `Used ${coinsToDeduct} Coins in Utility Recharge`);
    }

    // Process recharge
    handleTransaction(userId, -netAmountToDebit, walletToDebit, 'recharge', `${operator} ${service} Recharge of ₹${amount} (${coinsToDeduct} Coins utilized)`);
    
    // Instant 2% cashback
    const cashback = parseFloat((amount * 0.02).toFixed(2));
    handleTransaction(userId, cashback, 'cashback', 'recharge', `Instant 2% Cashback on ${operator} ${service}`);

    // Distribute 20 Level commissions!
    distributeMLMCommissions(userId, amount, 'recharge');
    alert(`🎉 ${operator} ${service} payment of ₹${amount} successful! ₹${coinsToDeduct} discount applied from Coins. Cashback of ₹${cashback} credited. Debited from your ${walletToDebit === 'ewallet' ? 'E-Wallet' : 'Main Wallet'}.`);
  };

  // Upgraded Place Order with shopping cashback + rewards logic and 20 level BV (BV distribution)
  const placeOrder = (userId: string, productId: string, useCoins: boolean = false) => {
    const user = users.find(u => u.id === userId);
    const product = products.find(p => p.id === productId);
    if (!user || !user.isActivated) return alert('🚨 MLM Warning: Activate your package first.');
    if (!product) return;
    
    let coinsToDeduct = 0;
    if (useCoins && user.wallets.coinwallet > 0) {
      const percentageLimit = user.coinUsablePercent || 10;
      const maxCoins = parseFloat((product.price * (percentageLimit / 100)).toFixed(2));
      coinsToDeduct = parseFloat(Math.min(maxCoins, user.wallets.coinwallet).toFixed(2));
    }

    const netAmountToDebit = parseFloat((product.price - coinsToDeduct).toFixed(2));

    // Choose wallets (user can buy from Main Wallet OR Shopping Wallet)
    const availableFund = user.wallets.main + user.wallets.shopping;
    if (availableFund < netAmountToDebit) return alert(`🚨 Insufficient balance in both Cash & Shopping Wallets. Net required: ₹${netAmountToDebit} (discounted by ${coinsToDeduct} Coins)`);

    // Deduct coins if used
    if (coinsToDeduct > 0) {
      handleTransaction(userId, -coinsToDeduct, 'coinwallet', 'shopping', `Used ${coinsToDeduct} Coins in Store purchase of ${product.name}`);
    }

    // Deduct cash
    if (user.wallets.shopping >= netAmountToDebit) {
      handleTransaction(userId, -netAmountToDebit, 'shopping', 'shopping', `E-commerce checkout: ${product.name}`);
    } else {
      const rem = netAmountToDebit - user.wallets.shopping;
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
    alert(`🛒 Order placed! ₹${coinsToDeduct} discount applied from Coins. ${product.mlmPoints} BV Added to Genealogy.`);
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

  // Transfer Main Wallet balance to E-Wallet self top-up
  const handleMainToEWalletTransfer = (userId: string, amount: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (user.wallets.main < amount) {
      alert(`🚨 Balance Error: Insufficient main wallet balance! Requires ₹${amount.toFixed(2)}, available ₹${user.wallets.main.toFixed(2)}.`);
      return;
    }
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updatedWallets = {
          ...u.wallets,
          main: parseFloat((u.wallets.main - amount).toFixed(2)),
          ewallet: parseFloat(((u.wallets.ewallet || 0) + amount).toFixed(2))
        };
        const updated = { ...u, wallets: updatedWallets };
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(updated);
        }
        return updated;
      }
      return u;
    }));

    const tx: Transaction = {
      id: `MEW-${Date.now()}`,
      userId: userId,
      amount: amount,
      walletType: 'ewallet',
      type: 'transfer',
      description: `Transferred ₹${amount.toFixed(2)} from Main to E-Wallet`,
      status: 'success',
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [tx, ...prev]);
    alert(`✅ ₹${amount} successfully transferred to your E-Wallet!`);
  };

  // Transfer E-Wallet to E-Wallet peer fund transfer
  const handleEWalletToEWalletTransfer = (senderId: string, recipientEmail: string, amount: number) => {
    const sender = users.find(u => u.id === senderId);
    if (!sender) return;
    const recipient = users.find(u => u.email.toLowerCase().trim() === recipientEmail.toLowerCase().trim());
    if (!recipient) {
      alert(`🚨 Error: Recipient with email '${recipientEmail}' not found.`);
      return;
    }
    if (recipient.id === senderId) {
      alert(`🚨 Error: Cannot transfer e-wallet to yourself.`);
      return;
    }
    if ((sender.wallets.ewallet || 0) < amount) {
      alert(`🚨 Balance Error: Insufficient E-Wallet balance! Requires ₹${amount.toFixed(2)}, available ₹${(sender.wallets.ewallet || 0).toFixed(2)}.`);
      return;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === senderId) {
        const updated = {
          ...u,
          wallets: {
            ...u.wallets,
            ewallet: parseFloat(((u.wallets.ewallet || 0) - amount).toFixed(2))
          }
        };
        if (currentUser && currentUser.id === senderId) {
          setCurrentUser(updated);
        }
        return updated;
      }
      if (u.id === recipient.id) {
        return {
          ...u,
          wallets: {
            ...u.wallets,
            ewallet: parseFloat(((u.wallets.ewallet || 0) + amount).toFixed(2))
          }
        };
      }
      return u;
    }));

    const txSender: Transaction = {
      id: `EWE-${Date.now()}-S`,
      userId: senderId,
      amount: -amount,
      walletType: 'ewallet',
      type: 'transfer',
      description: `Transferred ₹${amount.toFixed(2)} to ${recipient.name}`,
      status: 'success',
      createdAt: new Date().toISOString()
    };

    const txRecipient: Transaction = {
      id: `EWE-${Date.now()}-R`,
      userId: recipient.id,
      amount: amount,
      walletType: 'ewallet',
      type: 'transfer',
      description: `Received ₹${amount.toFixed(2)} from ${sender.name}`,
      status: 'success',
      createdAt: new Date().toISOString()
    };

    setTransactions(prev => [txSender, txRecipient, ...prev]);
    alert(`✅ ₹${amount} transferred successfully to ${recipient.name}'s E-Wallet!`);
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
    setUsers(prev => prev.map(u => u.id === userId ? { 
      ...u, 
      isActivated: true, 
      status: 'active',
      wallets: {
        ...u.wallets,
        coinwallet: parseFloat(((u.wallets.coinwallet || 0) + 500).toFixed(2))
      }
    } : u));

    // Record user's stake coins bonus transaction
    setTransactions(prev => [{
      id: `ACTCOIN-${Date.now()}`,
      userId,
      amount: 500,
      walletType: 'coinwallet',
      type: 'coin_reward',
      description: `S360 Elite Activation Stake Coins Reward`,
      status: 'success',
      createdAt: new Date().toISOString()
    }, ...prev]);

    // Distribute core Level Package commissions up to 20 levels!
    distributeMLMCommissions(userId, mlmConfig.packagePrice, 'package');
    alert(`🎉 Congratulations! Your active core MLM distribution portfolio is online now. You received 500 Coins stake bonus! Debited from your ${walletToDebit === 'recharge' ? 'Recharge' : 'Main'} Wallet.`);
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
        {activeUser.role === UserRole.ADMIN && activeTab === 'admin' ? (
          <AdminPanel 
            users={users} 
            transactions={transactions} 
            config={mlmConfig} 
            onUpdateConfig={handleUpdateConfig}
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
            onSwitchTab={setActiveTab}
            packages={packages}
            onCreatePackage={handleCreatePackage}
            onDeletePackage={handleDeletePackage}
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
            transactions={transactions} 
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
            packages={packages}
            onBuyPackage={handleBuyPackage}
            onMainToEWalletTransfer={handleMainToEWalletTransfer}
            onEWalletToEWalletTransfer={handleEWalletToEWalletTransfer}
            onLogout={() => setCurrentUser(null)}
          />
        )}
      </Layout>
    </ErrorBoundary>
  );
};

export default App;
