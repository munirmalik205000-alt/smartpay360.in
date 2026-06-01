import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            }
          }
        });
        if (error) throw error;
        
        // Let's assume the user was created in auth and handle_new_user trigger worked.
        // We now update missing meta properties natively:
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('users').update({
            mobile,
            sponsor_id: sponsorId || null
          }).eq('id', user.id);
        }
        
        alert('Registration successful! You are now logged in.');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-xl max-w-sm w-full border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">
          {isLogin ? 'Login to SmartPay' : 'Register for SmartPay'}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <input 
                type="text" 
                placeholder="Username" 
                required 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="bg-gray-900 border border-gray-700 p-3 rounded"
              />
              <input 
                type="text" 
                placeholder="Mobile Number" 
                required 
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                className="bg-gray-900 border border-gray-700 p-3 rounded"
              />
              <input 
                type="text" 
                placeholder="Sponsor ID (Optional)" 
                value={sponsorId}
                onChange={e => setSponsorId(e.target.value)}
                className="bg-gray-900 border border-gray-700 p-3 rounded"
              />
            </>
          )}
          
          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-gray-900 border border-gray-700 p-3 rounded"
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-gray-900 border border-gray-700 p-3 rounded"
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 bg-blue-600 hover:bg-blue-500 font-bold p-3 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
        
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="mt-6 text-sm text-gray-400 hover:text-white w-full text-center"
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}
