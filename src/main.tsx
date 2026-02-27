import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx' // This looks for "export default" in App.tsx
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'; // or './App.css' - whichever file has the @tailwind rules

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)