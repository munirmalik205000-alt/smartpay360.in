import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { User } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin'>('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    }
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserProfile(data as User);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  if (!userProfile) {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <p>Setting up your profile...</p>
      <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 rounded">Refresh</button>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <nav className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          SmartPay MLM
        </h1>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-blue-400' : 'text-gray-400'}>
            Dashboard
          </button>
          {userProfile.role === 'ADMIN' && (
            <button onClick={() => setActiveTab('admin')} className={activeTab === 'admin' ? 'text-blue-400' : 'text-gray-400'}>
              Admin Panel
            </button>
          )}
          <button onClick={() => supabase.auth.signOut()} className="text-red-400 font-medium">Log out</button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {activeTab === 'dashboard' ? (
          <Dashboard userProfile={userProfile} />
        ) : (
          <AdminPanel />
        )}
      </main>
    </div>
  );
}
