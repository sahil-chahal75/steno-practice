import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Importing our new components
import Login from './Login';
import Home from './Home';
import TypingTool from './TypingTool';
import Result from './Result';

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); // home, typing, result
  const [activeDoc, setActiveDoc] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Theme Toggle
  const toggleTheme = () => setDarkMode(!darkMode);

  // 1. If not logged in, always show Login Page
  if (!user) {
    return <Login darkMode={darkMode} toggleTheme={toggleTheme} />;
  }

  // 2. Navigation Logic (Switching between pages)
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        
        {view === 'home' && (
          <Home 
            user={user} 
            setView={setView} 
            setActiveDoc={setActiveDoc} 
            darkMode={darkMode} 
            toggleTheme={toggleTheme} 
          />
        )}

        {view === 'typing' && (
          <TypingTool 
            doc={activeDoc} 
            setView={setView} 
            setTestResult={setTestResult} 
            darkMode={darkMode} 
          />
        )}

        {view === 'result' && (
          <Result 
            result={testResult} 
            doc={activeDoc} 
            setView={setView} 
            darkMode={darkMode} 
          />
        )}

      </div>
    </div>
  );
};

export default App;
