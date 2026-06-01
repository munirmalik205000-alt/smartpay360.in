import React, { useEffect, useState } from 'react';
import { User, Transaction } from '../types';
import { supabase } from '../services/supabaseClient';
import { ArrowUpRight, ArrowDownRight, Wallet, Users, Activity } from 'lucide-react';

export default function Dashboard({ userProfile }: { userProfile: User }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Load realtime transactions
    loadTransactions();

    const subs = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userProfile.id}` }, () => {
        // App.tsx already syncs the user profile for us
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userProfile.id}` }, () => {
        loadTransactions();
      })
      .subscribe();

    return () => {
      subs.unsubscribe();
    };
  }, [userProfile.id]);

  const loadTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setTransactions(data as Transaction[]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Card */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 col-span-1 md:col-span-2 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-white mb-1">Welcome back, {userProfile.username || 'User'}!</h2>
          <p className="text-gray-400">ID: {userProfile.id.slice(0, 8).toUpperCase()}</p>
          <div className="flex gap-4 mt-4 text-sm">
            <span className="bg-gray-700 px-3 py-1 rounded-full border border-gray-600">Rank: {userProfile.rank_name}</span>
            <span className="bg-green-900/50 text-green-400 px-3 py-1 rounded-full border border-green-800">
              {userProfile.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <StatCard icon={<Wallet className="text-blue-400" />} label="Wallet Balance" value={`$${userProfile.wallet_balance}`} />
        <StatCard icon={<Wallet className="text-purple-400" />} label="Earning Wallet" value={`$${userProfile.earning_wallet}`} />
        <StatCard icon={<Wallet className="text-emerald-400" />} label="Recharge Wallet" value={`$${userProfile.recharge_wallet}`} />
        
        <StatCard icon={<Activity className="text-amber-400" />} label="Self PV" value={userProfile.self_pv} />
        <StatCard icon={<Activity className="text-orange-400" />} label="Team PV" value={userProfile.team_pv} />
        <StatCard icon={<Activity className="text-rose-400" />} label="Total PV" value={userProfile.total_pv} />
        
        <StatCard icon={<Users className="text-sky-400" />} label="Direct Team" value={userProfile.direct_count} />
        <StatCard icon={<Users className="text-indigo-400" />} label="Total Team" value={userProfile.team_count} />
      </div>

      {/* Transactions */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-bold text-lg">Recent Transactions</h3>
        </div>
        <div className="p-4">
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No recent transactions</p>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.transaction_type === 'CREDIT' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {tx.transaction_type === 'CREDIT' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <p className="font-medium">{tx.remark || tx.transaction_type}</p>
                      <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.transaction_type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.transaction_type === 'CREDIT' ? '+' : '-'}${tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col justify-between h-32">
      <div className="flex justify-between items-start mb-2">
        <p className="text-gray-400 font-medium">{label}</p>
        {icon}
      </div>
      <h4 className="text-3xl font-bold">{value}</h4>
    </div>
  );
}
