import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { siteConfig } from './config';

const Navbar = ({ user, setView, toggleTheme, darkMode, setShowAdmin, setIsSidebarOpen }) => {
  const isAdmin = user && user.email === siteConfig.adminEmail;

  return (
    <nav className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-md p-4 sticky top-0 z-50 transition-colors border-b dark:border-slate-700">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        
        {/* LEFT SECTION: Menu + Brand */}
        <div className="flex items-center gap-4">
          {/* ☰ HAMBURGER MENU BUTTON */}
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 
            onClick={() => { setView('home'); setIsSidebarOpen(false); }} 
            className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400 italic cursor-pointer uppercase tracking-tighter select-none"
          >
            {siteConfig.name}
          </h1>
        </div>

        {/* RIGHT SECTION: Toggles & Logout */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-lg hover:scale-110 transition-transform"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Admin Panel (Desktop Only, Mobile par Sidebar mein dikhega) */}
          {isAdmin && (
            <button 
              onClick={() => setShowAdmin(true)}
              className="hidden md:block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-100 dark:shadow-none transition-all"
            >
              Admin Panel
            </button>
          )}

          {/* Quick Logout Icon (Optional, keeping it clean) */}
          <button 
            onClick={() => signOut(auth)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            title="Logout"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
