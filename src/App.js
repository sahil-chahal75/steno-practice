import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Existing Steno Components
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Login from './Login';
import Home from './Home';
import TypingTool from './TypingTool';
import Result from './Result';
import AdminPanel from './AdminPanel';

// New Typing System Components
import TypingHome from './TypingSystem/TypingHome';
import TypingArena from './TypingSystem/TypingArena';
import TypingResult from './TypingSystem/TypingResult';
import TypingAdmin from './TypingSystem/TypingAdmin';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // New Typing System States
  const [typingView, setTypingView] = useState('list'); // list, arena, result
  const [selectedTypingMatter, setSelectedTypingMatter] = useState(null);
  const [typingResults, setTypingResults] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
              {/* STENO SYSTEM ROUTES (UNCHANGED) */}
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

              {/* NEW TYPING SYSTEM ROUTES */}
              <Route 
                path="/typing-practice" 
                element={user ? (
                  typingView === 'list' ? (
                    <TypingHome onSelectMatter={(m) => { setSelectedTypingMatter(m); setTypingView('arena'); }} />
                  ) : typingView === 'arena' ? (
                    <TypingArena 
                      matter={selectedTypingMatter} 
                      setView={setTypingView} 
                      setResults={setTypingResults} 
                      userEmail={user?.email} 
                      userName={user?.displayName} 
                    />
                  ) : (
                    <TypingResult results={typingResults} onBack={() => setTypingView('list')} />
                  )
                ) : <Navigate to="/login" />} 
              />

              <Route 
                path="/typing-admin" 
                element={user?.email === "sahilchahalkuk@gmail.com" ? <TypingAdmin /> : <Navigate to="/" />} 
              />

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
