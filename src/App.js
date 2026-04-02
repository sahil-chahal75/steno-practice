import React, { useState } from 'react';
import { siteConfig } from './config';
import { auth } from './firebase';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // User name display logic
  const userName = auth.currentUser ? auth.currentUser.displayName : "Student";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* 1. HEADER & SITE NAME */}
      <header className="bg-white border-b sticky top-0 z-50 p-4 flex justify-between items-center shadow-sm">
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-extrabold text-blue-700 tracking-tight">
            {siteConfig.name}
          </h1>
        </div>
        
        {/* 3-Dot Menu */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-2xl p-1 font-bold text-gray-600 focus:outline-none"
          >
            ⋮
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl py-2 z-50">
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100">User Login</button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b">Admin Login</button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100">Toggle Dark Mode</button>
            </div>
          )}
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="p-8 text-center bg-white border-b">
        <h2 className="text-xl font-medium">Hello, <span className="text-blue-600 font-bold">{userName}</span>!</h2>
        <p className="text-gray-500 mt-1 italic text-sm">{siteConfig.heroMessage}</p>
      </section>

      {/* 3. MAIN 4 SECTIONS (Grid) */}
      <main className="p-4 grid grid-cols-2 gap-4 max-w-lg mx-auto">
        {siteConfig.categories.map((cat) => (
          <button key={cat.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:bg-blue-50 active:scale-95 transition-all">
            <span className="text-4xl mb-2">{cat.icon}</span>
            <h3 className="font-bold text-gray-700 text-xs sm:text-sm">{cat.name}</h3>
          </button>
        ))}
      </main>

      {/* 4. PROGRESS & LEADERBOARD */}
      <div className="px-4 py-2 grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <button className="bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md">📊 My Progress</button>
        <button className="bg-amber-500 text-white py-3 rounded-xl font-bold shadow-md">🏆 Leaderboard</button>
      </div>

      {/* 5. MAIN FEATURES SECTION */}
      <section className="mt-10 px-6 pb-24 max-w-lg mx-auto">
        <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4">Core Features</h4>
        <div className="grid grid-cols-1 gap-2">
          {siteConfig.features.map((feature, index) => (
            <div key={index} className="bg-white px-4 py-3 rounded-xl border border-gray-200 flex items-center shadow-sm">
              <span className="text-blue-500 mr-3">✔</span>
              <span className="text-sm font-medium text-gray-600">{feature}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default App;
              
