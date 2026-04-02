import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { siteConfig } from './config';

const Navbar = ({ user, setView, toggleTheme, darkMode, setShowAdmin }) => {
  const isAdmin = user && user.email === siteConfig.adminEmail;

  return (
    <nav className="bg-white dark:bg-slate-800 shadow-md p-4 sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 
          onClick={() => setView('home')} 
          className="text-2xl font-black text-blue-600 italic cursor-pointer uppercase tracking-tighter"
        >
          {siteConfig.name}
        </h1>

        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle Button */}
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-xl"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Admin Button */}
          {isAdmin && (
            <button 
              onClick={() => setShowAdmin(true)}
              className="hidden md:block bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase"
            >
              Admin Panel
            </button>
          )}

          {/* Logout */}
          <button 
            onClick={() => signOut(auth)}
            className="text-red-500 font-bold text-xs uppercase border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

