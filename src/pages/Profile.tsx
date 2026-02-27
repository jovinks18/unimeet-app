import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  
  // Theme state synced with localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Constants for consistent styling based on target design
  const theme = {
    bg: isDarkMode ? '#051124' : '#F8FAFC',
    card: isDarkMode ? '#121E31' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#1E293B',
    subText: isDarkMode ? '#64748b' : '#94A3B8',
    border: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
    accent: '#3B82F6',
    innerInput: isDarkMode ? '#0A1628' : '#F1F5F9'
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleUpload = async (event: any) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const filePath = `${user?.id}/avatar-${Date.now()}`;
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: filePath }).eq('id', user?.id);
      if (updateError) throw updateError;

      window.location.reload();
    } catch (e) {
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-fade" style={{ backgroundColor: theme.bg, minHeight: '100vh', width: '100%', color: theme.text, padding: '20px', display: 'flex', justifyContent: 'center', transition: '0.3s' }}>
      <div style={{ width: '100%', maxWidth: '450px' }}>
        
        {/* TOP NAVIGATION */}
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: theme.text, fontSize: '24px', cursor: 'pointer', marginBottom: '20px', display: 'block' }}>←</button>
        
        {/* PROFILE HEADER SECTION */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
           <div onClick={() => fileInputRef.current?.click()} style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: theme.card, margin: '0 auto 20px', cursor: 'pointer', border: `4px solid ${theme.accent}`, padding: '5px', position: 'relative', transition: '0.2s' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: theme.innerInput, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {profile?.avatar_url ? (
                  <img src={supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                ) : (
                  <span style={{ fontSize: '40px' }}>{uploading ? '⏳' : '👤'}</span>
                )}
              </div>
              <div style={{ position: 'absolute', bottom: '5px', right: '5px', backgroundColor: theme.accent, width: '30px', height: '30px', borderRadius: '50%', border: `3px solid ${theme.bg}`, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '16px' }}>+</div>
           </div>
           <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={handleUpload} accept="image/*" />
           
           <h2 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 'bold' }}>{profile?.full_name || 'User'}</h2>
           <p style={{ color: theme.subText, margin: 0, fontSize: '15px', fontWeight: '500' }}>📍 Global • Student</p>
        </div>

        {/* APPEARANCE SECTION LABEL */}
        <div style={{ fontSize: '11px', fontWeight: '900', color: theme.text, letterSpacing: '1.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>☀️ APPEARANCE</span>
        </div>

        {/* APPEARANCE CARD */}
        <div style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '24px', border: `1px solid ${theme.border}`, marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ backgroundColor: theme.innerInput, padding: '12px', borderRadius: '14px', fontSize: '20px' }}>
                {isDarkMode ? '🌙' : '☀️'}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Dark mode</div>
                <div style={{ fontSize: '12px', color: theme.subText }}>Easy on the eyes</div>
              </div>
            </div>
            
            {/* TOGGLE SWITCH */}
            <div onClick={toggleTheme} style={{ width: '52px', height: '28px', backgroundColor: isDarkMode ? theme.accent : '#CBD5E1', borderRadius: '14px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
              <div style={{ width: '22px', height: '22px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: isDarkMode ? '27px' : '3px', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS SECTION LABEL */}
        <div style={{ fontSize: '11px', fontWeight: '900', color: theme.text, letterSpacing: '1.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔔 NOTIFICATIONS</span>
        </div>

        {/* NOTIFICATIONS CARD */}
        <div style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '24px', border: `1px solid ${theme.border}`, marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ backgroundColor: theme.innerInput, padding: '12px', borderRadius: '14px', fontSize: '20px' }}>🔔</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Notification Settings</div>
                <div style={{ fontSize: '12px', color: theme.subText }}>Manage your alerts</div>
              </div>
            </div>
            <span style={{ color: theme.subText, fontSize: '20px' }}>›</span>
          </div>
        </div>

        {/* LOGOUT BUTTON */}
        <button onClick={() => signOut()} style={{ width: '100%', backgroundColor: '#EF444410', color: '#EF4444', border: '1px solid #EF444430', padding: '18px', borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s' }}>
          Logout Account
        </button>

      </div>
    </div>
  );
};

export default Profile;