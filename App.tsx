
import React, { useState, useEffect } from 'react';
import { User, UserRole, Transaction, Product, Order, MLMConfig, Wallets, PaymentRequest, WithdrawalRequest, ChatMessage } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import VendorPanel from './components/VendorPanel';
import { Layout } from './components/Layout';

const DEFAULT_MLM_CONFIG: MLMConfig = {
  rechargeCommission: [0.05, 0.02, 0.01, 0.005, 0.005, 0.002, 0.002, 0.001, 0.001, 0.001],
  productCommission: [0.10, 0.05, 0.03, 0.02, 0.01, 0.01, 0.01, 0.005, 0.005, 0.005],
  packageCommission: [50, 20, 10, 5, 5, 2, 2, 1, 1, 1],
  packagePrice: 249,
  tdsRate: 0.05,
  serviceCharge: 0.05,
  qrCode: ''
};

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', vendorId: 'v1', name: 'Premium Herbal Tea', description: 'Natural detox tea', price: 499, mrp: 699, category: 'Herbal', stock: 100, image: '☕', mlmPoints: 100 },
  { id: 'p2', vendorId: 'v1', name: 'Aloe Vera Gel', description: 'Pure organic aloe', price: 299, mrp: 399, category: 'Wellness', stock: 50, image: '🌿', mlmPoints: 50 },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('spay_users') || '[]'));
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('spay_products') || JSON.stringify(INITIAL_PRODUCTS)));
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(localStorage.getItem('spay_orders') || '[]'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('spay_tx') || '[]'));
  const [mlmConfig, setMlmConfig] = useState<MLMConfig>(() => JSON.parse(localStorage.getItem('spay_config') || JSON.stringify(DEFAULT_MLM_CONFIG)));
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => JSON.parse(localStorage.getItem('spay_payments') || '[]'));
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => JSON.parse(localStorage.getItem('spay_withdrawals') || '[]'));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => JSON.parse(localStorage.getItem('spay_chats') || '[]'));

  useEffect(() => {
    const adminEmail = 'admin@spay.com';
    if (!users.some(u => u.email.toLowerCase() === adminEmail)) {
      const admin: User = {
        id: 'admin-0',
        name: 'System Admin',
        email: adminEmail,
        password: 'admin123',
        transactionPin: '1234',
        phone: '0000000000',
        state: 'Delhi',
        referralCode: 'SPAY001',
        referrerId: null,
        role: UserRole.ADMIN,
        wallets: { main: 1000000, commission: 0, cashback: 0, recharge: 1000000 },
        totalEarned: 0,
        status: 'active',
        level: 0,
        joinedAt: new Date().toISOString(),
        isActivated: true
      };
      setUsers(prev => [admin, ...prev.filter(u => u.email.toLowerCase() !== adminEmail)]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('spay_users', JSON.stringify(users));
    localStorage.setItem('spay_products', JSON.stringify(products));
    localStorage.setItem('spay_orders', JSON.stringify(orders));
    localStorage.setItem('spay_tx', JSON.stringify(transactions));
    localStorage.setItem('spay_config', JSON.stringify(mlmConfig));
    localStorage.setItem('spay_payments', JSON.stringify(paymentRequests));
    localStorage.setItem('spay_withdrawals', JSON.stringify(withdrawalRequests));
    localStorage.setItem('spay_chats', JSON.stringify(chatMessages));
  }, [users, products, orders, transactions, mlmConfig, paymentRequests, withdrawalRequests, chatMessages]);

  const handleTransaction = (userId: string, amount: number, wallet: keyof Wallets, type: Transaction['type'], desc: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newWallets = { ...u.wallets, [wallet]: (u.wallets[wallet] || 0) + amount };
        return { ...u, wallets: newWallets, totalEarned: (amount > 0 && (wallet === 'commission' || wallet === 'cashback')) ? u.totalEarned + amount : u.totalEarned };
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
    if (user.transactionPin !== pin) return alert('Invalid Transaction PIN');
    if (!user.bankDetails) return alert('Please add bank details first');
    if (user.wallets.commission < amount) return alert('Insufficient commission balance');

    const newRequest: WithdrawalRequest = {
      id: `WITH${Date.now()}`,
      userId: user.id,
      userName: user.name,
      amount,
      status: 'pending',
      bankDetails: user.bankDetails,
      createdAt: new Date().toISOString()
    };
    
    handleTransaction(user.id, -amount, 'commission', 'withdrawal', `Withdrawal Request for ₹${amount}`);
    setWithdrawalRequests(prev => [newRequest, ...prev]);
    alert('Withdrawal request submitted successfully!');
  };

  const handleApproveWithdrawal = (id: string) => {
    setWithdrawalRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    alert('Withdrawal approved!');
  };

  const handleUpdateBankDetails = (details: any) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, bankDetails: details } : u));
    alert('Bank details updated!');
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
    alert('Request submitted! Funds will be added after admin verification.');
  };

  const handleApprovePayment = (requestId: string) => {
    const req = paymentRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return;
    handleTransaction(req.userId, req.amount, 'recharge', 'add_funds', `Approved Add Money: UTR ${req.utr}`);
    setPaymentRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
    alert('Payment Approved!');
  };

  const handleLogin = (email: string, password?: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password?.trim();
    const u = users.find(user => 
      user.email.toLowerCase() === trimmedEmail && 
      user.password === trimmedPassword
    );
    if (u) setCurrentUser(u);
    else alert('Invalid credentials. Check email and password.');
  };

  const handleSignup = (data: any) => {
    if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase().trim())) return alert('Email taken');
    const ref = users.find(u => u.referralCode === data.referralCode.trim()) || users[0];
    const newUser: User = {
      ...data, 
      email: data.email.trim(),
      password: data.password.trim(),
      transactionPin: data.transactionPin.trim(),
      state: data.state || 'Unknown',
      id: `U${Date.now()}`, role: UserRole.USER, 
      referralCode: `SP${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      referrerId: ref.id, level: ref.level + 1, wallets: { main: 0, commission: 0, cashback: 0, recharge: 0 },
      totalEarned: 0, status: 'pending', isActivated: false, joinedAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
  };

  const handleRecover = (email: string, phone: string, type: 'password' | 'pin'): string | null => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const user = users.find(u => u.email.toLowerCase() === trimmedEmail && u.phone === trimmedPhone);
    if (!user) return null;
    return type === 'password' ? (user.password || null) : user.transactionPin;
  };

  const handleRecharge = (userId: string, amount: number, service: string, pin: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.isActivated) return alert('Please activate your account first.');
    if (user.transactionPin !== pin) return alert('Invalid Transaction PIN');
    if (user.wallets.recharge < amount) return alert('Insufficient Recharge Wallet balance');
    
    handleTransaction(userId, -amount, 'recharge', 'recharge', `${service} Payment`);
    const cashback = amount * 0.02;
    handleTransaction(userId, cashback, 'cashback', 'recharge', `Cashback for ${service}`);
    alert(`${service} recharge successful!`);
  };

  const placeOrder = (userId: string, productId: string) => {
    const user = users.find(u => u.id === userId);
    const product = products.find(p => p.id === productId);
    if (!user || !user.isActivated) return alert('Please activate your account first.');
    if (!product || user.wallets.main < product.price) return alert('Insufficient Main Wallet balance');

    handleTransaction(userId, -product.price, 'main', 'shopping', `Purchase: ${product.name}`);
    alert('Order placed successfully!');
  };

  const handleTransfer = (senderId: string, recipientEmail: string, amount: number, pin: string) => {
    const sender = users.find(u => u.id === senderId);
    if (!sender) return;
    if (sender.transactionPin !== pin) return alert('Invalid Transaction PIN');
    
    const recipient = users.find(u => u.email.toLowerCase() === recipientEmail.toLowerCase().trim());
    if (!recipient) return alert('Recipient not found');
    if (senderId === recipient.id) return alert('Cannot transfer to yourself');
    if (sender.wallets.main < amount) return alert('Insufficient balance');

    handleTransaction(senderId, -amount, 'main', 'withdrawal', `Transfer to ${recipient.name}`);
    handleTransaction(recipient.id, amount, 'main', 'add_funds', `Transfer from ${sender.name}`);
    alert('Transfer successful!');
  };

  const handleActivateAccount = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (user.wallets.recharge < mlmConfig.packagePrice) return alert('Insufficient Recharge Wallet balance');

    handleTransaction(userId, -mlmConfig.packagePrice, 'recharge', 'activation', `Package Activation Fee`);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActivated: true, status: 'active' } : u));
    alert('Account Activated Successfully!');
  };

  if (!currentUser) return <Auth onLogin={handleLogin} onSignup={handleSignup} onRecover={handleRecover} />;

  const activeUser = users.find(u => u.id === currentUser.id) || currentUser;

  return (
    <Layout user={activeUser} onLogout={() => setCurrentUser(null)} activeTab={activeTab} onTabChange={setActiveTab}>
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
        />
      ) : (
        <Dashboard 
          user={activeUser} 
          users={users} 
          products={products}
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
        />
      )}
    </Layout>
  );
};

export default App;
