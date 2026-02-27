import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); 
    
    // .edu Validator
    if (!email.toLowerCase().endsWith('.edu')) {
      setMessage('Access Denied: Please use a valid university (.edu) email.');
      return; 
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Check your university email for the magic link!');
      }
    } catch (err) {
      setMessage('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
        <h1 className="text-4xl font-black mb-2 text-blue-500 text-center">UniMeet</h1>
        <p className="text-slate-400 text-center mb-8">Sign in with your campus email</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="name@university.edu" 
            className="w-full p-4 rounded-xl bg-slate-700 border border-slate-600 focus:border-blue-500 outline-none transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold text-lg transition shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
        
        {message && (
          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-center text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;