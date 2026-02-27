import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';

function App() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black italic text-2xl">UniMeet...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        {/* Onboarding - Only for users without profiles */}
        <Route 
          path="/onboarding" 
          element={user && !profile ? <Onboarding /> : <Navigate to="/" />} 
        />

        {/* Private Routes - Need both User and Profile */}
        <Route 
          path="/home" 
          element={user && profile ? <Home /> : <Navigate to="/onboarding" />} 
        />
        <Route 
          path="/profile" 
          element={user && profile ? <Profile /> : <Navigate to="/login" />} 
        />

        {/* Smart Redirect */}
        <Route path="/" element={
          !user ? <Navigate to="/login" /> : 
          (!profile ? <Navigate to="/onboarding" /> : <Navigate to="/home" />)
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;