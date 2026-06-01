import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { User } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin'>('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.warn("Supabase auth offline or unconfigured:", err);
      setProfileError("Could not connect to Supabase database. Please check your URL and API Key.");
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    }
  }, []);

  const fetchUserProfile = async (user: any) => {
    try {
      setProfileError(null);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Not found, attempt to create
        const { data: newData, error: insertError } = await supabase
          .from('users')
          .insert([{ 
             id: user.id,
             email: user.email,
             username: user.user_metadata?.username || 'User'
          }])
          .select()
          .single();
          
        if (!insertError && newData) {
          setUserProfile(newData as User);
        } else {
          console.error('Error auto-creating profile:', insertError);
          setProfileError(insertError?.message || 'Failed to auto-create profile. Missing INSERT permissions or table?');
        }
      } else if (error) {
        console.error('Error fetching profile:', error);
        setProfileError(error.message);
      } else if (data) {
        setUserProfile(data as User);
      }
    } catch (error: any) {
      console.error('Exception fetching profile:', error);
      setProfileError(error.message);
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
        <p className="text-xl mb-2">Setting up your profile...</p>
        {profileError && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mt-4 max-w-md">
            <p className="font-bold">Error loading profile:</p>
            <p className="font-mono text-sm mt-2">{profileError}</p>
            <p className="text-sm mt-4 text-red-300">
              Note: Make sure you have executed the schema.sql script in your Supabase SQL Editor. 
              If the 'users' table is missing or lacks the correct RLS policies, this will fail.
            </p>
          </div>
        )}
        <div className="flex gap-4 mt-6">
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded">Retry</button>
          <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 border border-red-600 text-red-400 rounded hover:bg-red-900/30">Sign Out</button>
        </div>
      </div>
    );
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
