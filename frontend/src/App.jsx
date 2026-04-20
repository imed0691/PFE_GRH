import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import './App.css'
import Login from './pages/Login'
import Signup from './pages/Register'

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login' ou 'signup'

  if (!user) {
    return (
      <>
        <Toaster position="top-center" />
        {view === 'login' ? (
          <Login 
            onLoginSuccess={(u) => setUser(u)} 
            onSwitchToSignup={() => setView('signup')} 
          />
        ) : (
          <Signup 
            onSignupSuccess={() => setView('login')} 
            onSwitchToLogin={() => setView('login')} 
          />
        )}
      </>
    );
  }

  return (
    <div className="container">
      <Toaster position="top-right" />

      <div className="content">
        <h2>Hello, world</h2>
      </div>

      <button onClick={() => setUser(null)}>Logout</button>
    </div>
  )
}

export default App
