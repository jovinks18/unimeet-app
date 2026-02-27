import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    major: '',
    gradYear: '2026'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .upsert([
        {
          id: user?.id,
          full_name: formData.fullName,
          major: formData.major,
          grad_year: formData.gradYear
        }
      ]);

    if (!error) navigate('/home');
    else alert(error.message);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <h2 className="text-3xl font-black text-blue-500 mb-2">Welcome!</h2>
        <p className="text-slate-400 mb-8">Let's set up your campus profile.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input 
              required
              className="w-full bg-slate-700 p-4 rounded-xl outline-none focus:ring-2 ring-blue-500"
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Major</label>
            <input 
              required
              placeholder="e.g. Computer Science"
              className="w-full bg-slate-700 p-4 rounded-xl outline-none focus:ring-2 ring-blue-500"
              onChange={(e) => setFormData({...formData, major: e.target.value})}
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-blue-600 py-4 rounded-xl font-bold text-lg hover:bg-blue-500 transition"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;