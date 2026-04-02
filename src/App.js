import React, { useState, useEffect } from 'react';
import { siteConfig } from './config';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Login Error:", error);
      alert("Login failed! Firebase check karein.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b sticky top-0 z-50 p-4 flex justify-between items-center shadow-sm">
        <div className="flex-1 text-center font-extrabold text-2xl text-blue-700 tracking-tight">
          {siteConfig.name}
        </div>
        <div className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-2xl p-1 font-bold text-gray-600 focus:outline-none">⋮</button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl py-2 z-50">
              {!user ? (
                <button onClick={loginWithGoogle} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600 font-bold italic">Login with Google</button>
              ) : (
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600">Logout</button>
              )}
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 border-t">Dark Mode</button>
            </div>
          )}
        </div>
      </header>

      <section className="p-8 text-center bg-white border-b">
        <h2 className="text-xl font-medium">Hello, <span className="text-blue-600 font-bold">{user ? user.displayName : "Student"}</span>!</h2>
        <p className="text-gray-500 mt-1 italic text-sm">{siteConfig.heroMessage}</p>
      </section>

      <main className="p-4 grid grid-cols-2 gap-4 max-w-lg mx-auto">
        {siteConfig.categories.map((cat) => (
          <button key={cat.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:bg-blue-50 active:scale-95 transition-all">
            <span className="text-4xl mb-2">{cat.icon}</span>
            <h3 className="font-bold text-gray-700 text-xs sm:text-sm text-center">{cat.name}</h3>
          </button>
        ))}
      </main>

      <div className="px-4 py-2 grid grid-cols-2 gap-4 max-w-lg mx-auto pb-24">
        <button className="bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors">📊 My Progress</button>
        <button className="bg-amber-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-amber-600 transition-colors">🏆 Leaderboard</button>
      </div>
    </div>
  );
};

export default App;
