import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [emailFocused, setEmailFocused] = useState(false);

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0F172A', color: 'white', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '448px', backgroundColor: '#1E293B', padding: '32px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid #334155' }}>

        <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '8px', color: '#3B82F6', textAlign: 'center' }}>UniMeet</h1>
        <p style={{ color: '#94A3B8', textAlign: 'center', marginBottom: '32px' }}>Sign in with your campus email</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="email"
            placeholder="name@university.edu"
            style={{
              width: '100%', padding: '16px', borderRadius: '12px',
              backgroundColor: '#334155',
              border: emailFocused ? '1px solid #3B82F6' : '1px solid #475569',
              outline: 'none', color: 'white', fontSize: '15px',
              transition: 'border-color 0.2s',
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', backgroundColor: '#2563EB', color: 'white',
              padding: '16px', borderRadius: '12px', fontWeight: '700',
              fontSize: '18px', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60A5FA', textAlign: 'center', fontSize: '14px' }}>
            {message}
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
