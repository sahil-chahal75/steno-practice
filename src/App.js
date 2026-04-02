import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Saare components ko import kar rahe hain
import Navbar from './Navbar';
import Login from './Login';
import Home from './Home';
import TypingTool from './TypingTool';
import Result from './Result';
import AdminPanel from './AdminPanel';

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); // home, typing, result
  const [activeDoc, setActiveDoc] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Bina login ke kuch nahi dikhega
  if (!user) {
    return <Login darkMode={darkMode} toggleTheme={toggleTheme} />;
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        
        {/* Navbar hamesha upar rahega */}
        <Navbar 
          user={user} 
          setView={setView} 
          toggleTheme={toggleTheme} 
          darkMode={darkMode} 
          setShowAdmin={setShowAdmin}
        />

        <main className="max-w-4xl mx-auto p-4">
          {view === 'home' && (
            <Home setView={setView} setActiveDoc={setActiveDoc} />
          )}

          {view === 'typing' && (
            <TypingTool 
              doc={activeDoc} 
              setView={setView} 
              setTestResult={setTestResult} 
            />
          )}

          {view === 'result' && (
            <Result 
              result={testResult} 
              doc={activeDoc} 
              setView={setView} 
            />
          )}
        </main>

        {/* Admin Panel sirf pop-up ki tarah khulega */}
        {showAdmin && (
          <AdminPanel setShowAdmin={setShowAdmin} user={user} />
        )}
        
      </div>
    </div>
  );
};

export default App;
