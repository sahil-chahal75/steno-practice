import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Components Import
import Navbar from './Navbar';
import Sidebar from './Sidebar'; // Naya Sidebar import
import Login from './Login';
import Home from './Home';
import TypingTool from './TypingTool';
import Result from './Result';
import AdminPanel from './AdminPanel';

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [activeDoc, setActiveDoc] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar control state

  // 📡 LOGIN STATUS CHECK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // 🌙 DARK MODE ENGINE
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  if (!user) {
    return <Login darkMode={darkMode} toggleTheme={toggleTheme} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      
      <div className="dark:text-slate-100 text-slate-900">
        
        {/* Navbar mein setIsSidebarOpen pass kiya hai */}
        <Navbar 
          user={user} 
          setView={setView} 
          toggleTheme={toggleTheme} 
          darkMode={darkMode} 
          setShowAdmin={setShowAdmin}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Naya Sidebar Component */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          user={user} 
          setView={setView} 
          darkMode={darkMode} 
        />

        <main className="max-w-4xl mx-auto p-4 pt-8">
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

        {showAdmin && (
          <AdminPanel setShowAdmin={setShowAdmin} user={user} />
        )}
        
      </div>
    </div>
  );
};

export default App;
