import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const Sidebar = ({ isOpen, setIsOpen, user }) => {
  const [activeTab, setActiveTab] = useState('menu'); 
  const [profile, setProfile] = useState({ phone: '', edu: '', gender: 'Male', city: '', pin: '' });
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState('');

  // ✨ BACK BUTTON FIX: Agar Sidebar khula hai aur back dabaya, to sirf menu close ho
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ sidebar: 'open' }, '');
    }

    const handleBack = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setProfile(docSnap.data());
    };
    if (activeTab === 'profile') fetchProfile();
  }, [activeTab, user]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      const q = query(collection(db, "results"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(data.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)));
    };
    if (activeTab === 'progress') fetchHistory();
  }, [activeTab, user]);

  const saveProfile = async () => {
    try {
      await setDoc(doc(db, "users", user.uid), { 
        ...profile, 
        name: user.displayName, 
        email: user.email 
      }, { merge: true });
      alert("Profile Updated! ✅");
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const sendMessage = async () => {
    if (!msg) return;
    try {
      await setDoc(doc(collection(db, "messages")), { 
        sender: user.displayName, 
        email: user.email, 
        text: msg, 
        time: new Date(), 
        read: false 
      });
      alert("Message sent to Admin! 📩");
      setMsg('');
    } catch (e) { alert(e.message); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
      <div className="relative w-80 max-w-[85%] bg-white dark:bg-slate-900 h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-300 overflow-y-auto">
        
        <div className="flex justify-between items-center mb-10">
          <h2 className="font-black italic text-blue-600 uppercase tracking-tighter text-xl">Pulse Menu</h2>
          <button onClick={() => setIsOpen(false)} className="text-2xl font-bold dark:text-white">✕</button>
        </div>

        {activeTab === 'menu' && (
          <div className="space-y-4">
            <button onClick={() => setActiveTab('profile')} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold uppercase text-[10px] tracking-widest dark:text-white border dark:border-slate-700">👤 My Profile</button>
            <button onClick={() => setActiveTab('progress')} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold uppercase text-[10px] tracking-widest dark:text-white border dark:border-slate-700">📈 My Progress</button>
            <button onClick={() => setActiveTab('message')} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold uppercase text-[10px] tracking-widest dark:text-white border dark:border-slate-700">💬 Message Admin</button>
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-4"></div>
            <button onClick={() => auth.signOut()} className="w-full text-left p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 font-black uppercase text-[10px] tracking-widest">Logout</button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-3">
            <button onClick={() => setActiveTab('menu')} className="text-[10px] font-black text-blue-600 mb-4 uppercase">← Back</button>
            <input placeholder="Phone" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-sm dark:text-white" value={profile.phone} onChange={e=>setProfile({...profile, phone: e.target.value})} />
            <input placeholder="Qualification" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-sm dark:text-white" value={profile.edu} onChange={e=>setProfile({...profile, edu: e.target.value})} />
            <input placeholder="City" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-sm dark:text-white" value={profile.city} onChange={e=>setProfile({...profile, city: e.target.value})} />
            <input placeholder="Pin" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-sm dark:text-white" value={profile.pin} onChange={e=>setProfile({...profile, pin: e.target.value})} />
            <button onClick={saveProfile} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest mt-4">Update Details</button>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-3">
            <button onClick={() => setActiveTab('menu')} className="text-[10px] font-black text-blue-600 mb-4 uppercase">← Back</button>
            {history.map(h => (
              <div key={h.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-l-4 border-blue-500">
                <p className="text-[10px] font-black uppercase dark:text-white">{h.exerciseTitle}</p>
                <p className="text-[10px] text-blue-600 font-bold">{h.errorPercent}% Errors</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'message' && (
          <div className="space-y-4">
            <button onClick={() => setActiveTab('menu')} className="text-[10px] font-black text-blue-600 uppercase">← Back</button>
            <textarea placeholder="Write message..." className="w-full h-32 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-sm dark:text-white" value={msg} onChange={e=>setMsg(e.target.value)} />
            <button onClick={sendMessage} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Send</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
