import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
// 1. Router Imports
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Components Import
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Login from './Login';
import Home from './Home';
import TypingTool from './TypingTool';
import Result from './Result';
import AdminPanel from './AdminPanel';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // LOGIN STATUS CHECK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // DARK MODE ENGINE
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
        <div className="dark:text-slate-100 text-slate-900">
          
          {/* Navbar aur Sidebar hamesha dikhenge agar user login hai */}
          {user && (
            <>
              <Navbar 
                user={user} 
                toggleTheme={toggleTheme} 
                darkMode={darkMode} 
                setShowAdmin={setShowAdmin}
                setIsSidebarOpen={setIsSidebarOpen}
              />
              <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
                user={user} 
                darkMode={darkMode} 
              />
            </>
          )}

          <main className="max-w-4xl mx-auto p-4 pt-8">
            <Routes>
              {/* 2. Routing Logic */}
              <Route 
                path="/" 
                element={user ? <Home setActiveDoc={setActiveDoc} /> : <Navigate to="/login" />} 
              />
              
              <Route 
                path="/login" 
                element={!user ? <Login darkMode={darkMode} toggleTheme={toggleTheme} /> : <Navigate to="/" />} 
              />

              <Route 
                path="/typing" 
                element={user && activeDoc ? <TypingTool doc={activeDoc} setTestResult={setTestResult} /> : <Navigate to="/" />} 
              />

              <Route 
                path="/result" 
                element={user && testResult ? <Result result={testResult} doc={activeDoc} /> : <Navigate to="/" />} 
              />

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {showAdmin && user && (
            <AdminPanel setShowAdmin={setShowAdmin} user={user} />
          )}
          
        </div>
      </div>
    </Router>
  );
};

export default App;
