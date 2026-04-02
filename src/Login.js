import React, { useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, // 👈 Popup use karenge redirect nahi
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { auth } from './firebase';
import { siteConfig } from './config';

const Login = ({ darkMode, toggleTheme }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // 🛠️ GOOGLE LOGIN FINAL FIX
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Isse user ko har baar account select karne ka option milega
    provider.setCustomParameters({ prompt: 'select_account' }); 
    
    try {
      // Chrome Mobile ke liye popup sabse best hai
      await signInWithPopup(auth, provider);
      console.log("Google Login Success! ✅");
    } catch (err) {
      console.error("Google Error:", err.code);
      if (err.code === 'auth/popup-blocked') {
        alert("Mobile settings mein Pop-ups allow karein!");
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User ne khud window band ki, no action needed
      } else {
        alert("Login Error: " + err.message);
      }
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'signup') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });
        alert("Account Created! ✅");
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        alert("Reset link sent to your email!");
        setMode('login');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 transition-colors">
      <button onClick={toggleTheme} className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg text-xl">
        {darkMode ? '☀️' : '🌙'}
      </button>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border-t-8 border-blue-600">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600 italic uppercase tracking-tighter">{siteConfig.name}</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Focus, Type, Conquer</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <h2 className="text-xl font-black dark:text-white uppercase text-center mb-4">
            {mode === 'signup' ? 'Join Us' : mode === 'reset' ? 'Password Reset' : 'Welcome Back'}
          </h2>

          {mode === 'signup' && (
            <input type="text" placeholder="Full Name" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none border-2 border-transparent focus:border-blue-500 font-bold" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          
          <input type="email" placeholder="Email Address" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none border-2 border-transparent focus:border-blue-500 font-bold" value={email} onChange={(e) => setEmail(e.target.value)} required />
          
          {mode !== 'reset' && (
            <input type="password" placeholder="Password" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none border-2 border-transparent focus:border-blue-500 font-bold" value={password} onChange={(e) => setPassword(e.target.value)} required />
          )}

          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
            {mode === 'signup' ? 'Sign Up' : mode === 'reset' ? 'Send Reset Link' : 'Login'}
          </button>
        </form>

        <div className="relative my-8">
          <hr className="border-slate-100 dark:border-slate-700" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 px-3 text-[10px] font-black text-slate-400 uppercase">OR</span>
        </div>

        <button onClick={loginWithGoogle} className="w-full border-2 border-slate-100 dark:border-slate-700 dark:text-white py-4 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt="G" />
          Continue with Google
        </button>

        <div className="mt-8 text-center flex flex-col gap-2">
          {mode === 'login' ? (
            <>
              <button onClick={() => setMode('signup')} className="text-blue-600 text-xs font-black uppercase underline">New Student? Register</button>
              <button onClick={() => setMode('reset')} className="text-slate-400 text-[10px] font-bold uppercase">Forgot Password?</button>
            </>
          ) : (
            <button onClick={() => setMode('login')} className="text-blue-600 text-xs font-black uppercase underline">Back to Login</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
