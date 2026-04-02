import React, { useState, useEffect } from 'react';
import { siteConfig } from './config';
import { auth } from './firebase';
import { 
  signInWithRedirect, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

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

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'signup') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: fullName });
        await sendEmailVerification(res.user);
        alert("Registration Successful! Please verify your email via the link sent to your inbox.");
        await signOut(auth);
      } else if (authMode === 'login') {
        const res = await signInWithEmailAndPassword(auth, email, password);
        if (!res.user.emailVerified) {
          alert("Please verify your email first! Check your inbox.");
          await signOut(auth);
        }
      } else if (authMode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset link sent to your email!");
        setAuthMode('login');
      }
      setShowModal(false);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 text-[16px]">
      <header className="bg-white border-b sticky top-0 z-50 p-4 flex justify-between items-center shadow-sm">
        <div className="flex-1 text-center font-black text-2xl text-blue-700 tracking-tighter uppercase italic">{siteConfig.name}</div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-2xl p-1 text-gray-400 font-bold">⋮</button>
        {isMenuOpen && (
          <div className="absolute right-4 top-16 w-52 bg-white border rounded-2xl shadow-2xl py-3 z-[100] animate-in fade-in zoom-in duration-200">
            {!user ? (
              <button onClick={() => {setShowModal(true); setAuthMode('login'); setIsMenuOpen(false);}} className="w-full text-left px-5 py-3 hover:bg-gray-50 text-blue-600 font-bold tracking-tight">Login / Register</button>
            ) : (
              <button onClick={() => {signOut(auth); setIsMenuOpen(false);}} className="w-full text-left px-5 py-3 text-red-500 font-semibold italic">Logout</button>
            )}
            <div className="border-t mt-2 pt-2 px-5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Admin Control</div>
            <button className="w-full text-left px-5 py-2 hover:bg-gray-50 text-gray-600 text-sm">Dashboard</button>
          </div>
        )}
      </header>

      <section className="py-10 px-6 text-center bg-white border-b relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-amber-400"></div>
        <h2 className="text-2xl font-light text-gray-500 italic">Welcome, <span className="text-blue-600 font-black not-italic">{user ? user.displayName : "Stenographer"}</span></h2>
        <p className="text-gray-400 mt-2 text-xs font-bold tracking-widest uppercase">{siteConfig.heroMessage}</p>
      </section>

      <main className="p-4 grid grid-cols-2 gap-4 max-w-lg mx-auto mt-4">
        {siteConfig.categories.map((cat) => (
          <button key={cat.id} className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-xl active:scale-95 transition-all duration-300 group">
            <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</span>
            <h3 className="font-black text-gray-700 text-[11px] uppercase tracking-tighter">{cat.name}</h3>
          </button>
        ))}
      </main>

      <div className="px-4 py-4 grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <button className="bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 active:bg-blue-800 transition-colors">📊 Progress</button>
        <button className="bg-amber-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100 active:bg-amber-600 transition-colors">🏆 Ranking</button>
      </div>

      <section className="mt-12 px-6 max-w-lg mx-auto">
        <h4 className="text-[10px] uppercase tracking-[0.3em] text-gray-300 font-black mb-6 text-center">Engine Features</h4>
        <div className="space-y-4">
          {siteConfig.features.map((feature, index) => (
            <div key={index} className="bg-white px-5 py-4 rounded-2xl border border-gray-100 flex items-center shadow-sm group hover:border-blue-200 transition-colors">
              <div className="bg-blue-50 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-xs font-black mr-4">{index + 1}</div>
              <span className="text-sm font-bold text-gray-600">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-3xl font-black mb-8 text-center text-gray-800 tracking-tighter">
              {authMode === 'signup' ? "Create Profile" : authMode === 'reset' ? "Reset Password" : "Welcome Back"}
            </h3>
            
            {authMode !== 'reset' && (
              <button onClick={loginWithGoogle} className="w-full bg-gray-50 border-2 border-gray-100 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 mb-8 hover:bg-white hover:border-blue-200 transition-all">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5" />
                Continue with Google
              </button>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <input type="text" placeholder="Full Name" className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold" value={fullName} onChange={(e)=>setFullName(e.target.value)} required />
              )}
              <input type="email" placeholder="Email Address" className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold" value={email} onChange={(e)=>setEmail(e.target.value)} required />
              
              {authMode !== 'reset' && (
                <input type="password" placeholder="Password" className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold" value={password} onChange={(e)=>setPassword(e.target.value)} required />
              )}

              <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-lg uppercase shadow-xl active:scale-95 transition-all">
                {authMode === 'signup' ? "Register Now" : authMode === 'reset' ? "Send Reset Link" : "Sign In"}
              </button>
            </form>

            <div className="mt-8 flex flex-col gap-3 text-center">
              {authMode === 'login' ? (
                <>
                  <button onClick={() => setAuthMode('signup')} className="text-blue-600 font-black text-sm uppercase tracking-wider">New here? Sign Up</button>
                  <button onClick={() => setAuthMode('reset')} className="text-gray-400 font-bold text-xs uppercase">Forgot Password?</button>
                </>
              ) : (
                <button onClick={() => setAuthMode('login')} className="text-blue-600 font-black text-sm uppercase tracking-wider italic">Back to Login</button>
              )}
            </div>
            <button onClick={() => setShowModal(false)} className="w-full mt-6 text-gray-300 font-black text-[10px] uppercase tracking-widest">Close Panel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
