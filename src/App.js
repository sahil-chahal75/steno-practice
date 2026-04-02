import React, { useState, useEffect } from 'react';
import { siteConfig } from './config';
import { auth } from './firebase';
import { 
  signInWithRedirect, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword 
} from 'firebase/auth';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };

  const loginWithEmail = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLoginModal(false);
    } catch (error) {
      alert("Email ya Password galat hai!");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10">
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-50 p-4 flex justify-between items-center shadow-sm">
        <div className="flex-1 text-center font-extrabold text-2xl text-blue-700 tracking-tight">
          {siteConfig.name}
        </div>
        <div className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-2xl p-1 text-gray-600">⋮</button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl py-2 z-50">
              {!user ? (
                <button onClick={() => setShowLoginModal(true)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600 font-bold">Login / Sign Up</button>
              ) : (
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-medium">Logout</button>
              )}
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 border-t">Admin Panel</button>
            </div>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="p-8 text-center bg-white border-b">
        <h2 className="text-xl font-medium text-gray-700">Namaste, <span className="text-blue-600 font-bold">{user ? user.displayName || 'Student' : "Student"}</span>!</h2>
        <p className="text-gray-500 mt-1 italic text-sm">{siteConfig.heroMessage}</p>
      </section>

      {/* CATEGORIES GRID */}
      <main className="p-4 grid grid-cols-2 gap-4 max-w-lg mx-auto">
        {siteConfig.categories.map((cat) => (
          <button key={cat.id} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center justify-center hover:shadow-lg active:scale-95 transition-all">
            <span className="text-4xl mb-2">{cat.icon}</span>
            <h3 className="font-bold text-gray-800 text-sm">{cat.name}</h3>
          </button>
        ))}
      </main>

      {/* QUICK ACTIONS */}
      <div className="px-4 py-2 grid grid-cols-2 gap-4 max-w-lg mx-auto mt-4">
        <button className="bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700">📊 My Progress</button>
        <button className="bg-amber-500 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-amber-600">🏆 Leaderboard</button>
      </div>

      {/* HIGHLIGHTED FEATURES */}
      <section className="mt-10 px-6 max-w-lg mx-auto">
        <h4 className="text-xs uppercase tracking-widest text-blue-500 font-black mb-4">Site Features</h4>
        <div className="space-y-3">
          {siteConfig.features.map((feature, index) => (
            <div key={index} className="bg-blue-50 px-4 py-4 rounded-2xl border-l-4 border-blue-600 flex items-center shadow-sm">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] mr-3 font-bold">{index + 1}</span>
              <span className="text-sm font-bold text-blue-900">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4 text-center">Student Login</h3>
            <button onClick={loginWithGoogle} className="w-full bg-white border-2 border-gray-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-4 hover:bg-gray-50">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5" />
              Continue with Google
            </button>
            <div className="text-center text-gray-400 text-xs mb-4">OR USE EMAIL</div>
            <form onSubmit={loginWithEmail} className="space-y-3">
              <input type="email" placeholder="Email Address" className="w-full border p-3 rounded-xl outline-blue-500" value={email} onChange={(e)=>setEmail(e.target.value)} />
              <input type="password" placeholder="Password" className="w-full border p-3 rounded-xl outline-blue-500" value={password} onChange={(e)=>setPassword(e.target.value)} />
              <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold">Login with Email</button>
            </form>
            <button onClick={() => setShowLoginModal(false)} className="w-full mt-4 text-gray-500 text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
