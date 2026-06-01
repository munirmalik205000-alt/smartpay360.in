import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { User, Transaction } from '../types';
import { Search, Edit, Trash2, CheckCircle, XCircle, Activity } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    
    const sub = supabase.channel('admin_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, loadUsers)
      .subscribe();
      
    return () => { sub.unsubscribe(); }
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as User[]);
    setLoading(false);
  };

  const handleUpdate = async (id: string, updates: Partial<User>) => {
    setLoading(true);
    await supabase.from('users').update(updates).eq('id', id);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setLoading(true);
    await supabase.from('users').delete().eq('id', id);
    setLoading(false);
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.mobile?.includes(search)
  );

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 min-h-[70vh]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Admin Console - User Management</h2>
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 p-2 pl-10 rounded text-white"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-900 text-gray-400 border-y border-gray-700">
            <tr>
              <th className="p-3 font-semibold">User</th>
              <th className="p-3 font-semibold">Sponsor</th>
              <th className="p-3 font-semibold">Wallets (Bal/Earn/Rech)</th>
              <th className="p-3 font-semibold">PVs (Self/Team/Tot)</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading && <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>}
            {!loading && filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-750">
                <td className="p-3">
                  <div className="font-bold">{user.username || 'Unknown'}</div>
                  <div className="text-xs text-gray-400">{user.email} • {user.mobile}</div>
                </td>
                <td className="p-3 font-mono text-gray-400">{user.sponsor_id || '-'}</td>
                <td className="p-3 font-mono">
                  ${user.wallet_balance} / ${user.earning_wallet} / ${user.recharge_wallet}
                </td>
                <td className="p-3 font-mono">
                  {user.self_pv} / {user.team_pv} / {user.total_pv}
                </td>
                <td className="p-3">
                  <button 
                    onClick={() => handleUpdate(user.id, { is_active: !user.is_active })}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${user.is_active ? 'border-green-800 text-green-400 bg-green-900/30 hover:bg-green-900/50' : 'border-red-800 text-red-400 bg-red-900/30 hover:bg-red-900/50'}`}
                  >
                    {user.is_active ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                    {user.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        const amountStr = prompt(`Add amount to ${user.username}'s Wallet Balance:\n(Use negative value to deduct)`);
                        if(amountStr) {
                          const amt = Number(amountStr);
                          if(!isNaN(amt)) {
                            handleUpdate(user.id, { wallet_balance: (user.wallet_balance || 0) + amt });
                            // In real world, log to transactions table too
                          }
                        }
                      }}
                      className="p-2 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50"
                      title="Adjust Wallet"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        const pvStr = prompt(`Update Self PV for ${user.username}:\nCurrent: ${user.self_pv}`);
                        if(pvStr) {
                          const pvVal = Number(pvStr);
                          if(!isNaN(pvVal)) {
                            handleUpdate(user.id, { self_pv: pvVal, total_pv: pvVal + (user.team_pv || 0) });
                          }
                        }
                      }}
                      className="p-2 bg-orange-900/30 text-orange-400 rounded hover:bg-orange-900/50"
                      title="Adjust PV"
                    >
                      <Activity size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
