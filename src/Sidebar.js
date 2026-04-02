import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const Sidebar = ({ isOpen, setIsOpen, user, darkMode }) => {
  const [activeTab, setActiveTab] = useState('menu'); 
  const [profile, setProfile] = useState({ phone: '', edu: '', gender: 'Male', city: '', pin: '' });
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState('');

  // 👤 Profile Data Load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setProfile(docSnap.data());
      } catch (e) { console.error(e); }
    };
    if (activeTab === 'profile') fetchProfile();
  }, [activeTab, user.uid]);

  // 📈 Progress History Load
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, "results"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setHistory(data.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)));
      } catch (e) { console.error(e); }
    };
    if (activeTab === 'progress') fetchHistory();
  }, [activeTab, user.uid]);

  const saveProfile = async () => {
    await setDoc(doc(db, "users", user.uid), { ...profile, name: user.displayName, email: user.email }, { merge: true });
    alert("Profile Updated! ✅");
  };

  const sendMessage = async () => {
    if (!msg) return;
    await setDoc(doc(collection(db, "messages")), { 
      sender: user.displayName, email: user.email, text: msg, time: new Date(), read: false 
    });
    alert("Message sent to Sahil Sir! 📩");
    setMsg('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex">
      {/* Overlay: Bahar click karne par band ho jaye */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
      
      {/* Sidebar Content */}
      <div className="relative w-80 max-w-[85%] bg-white dark:bg-slate-900 h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-300">
        <div className="flex justify-between items-center mb-10">
          <h2 className="font-black italic text-blue-600 uppercase tracking-tighter text-xl">Pulse Menu</h2>
          <button onClick={() => setIsOpen(false)} className="text-2xl font-bold dark:text-white">✕</button>
        </div>

        {activeTab === 'menu' && (
          <div className="space-y-4">
            <button onClick={() => setActiveTab('profile')} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold uppercase text-[10px] tracking-widest flex items-center gap-3 dark:text-white border dark:border-slate-700">👤 My Profile</button>
            <button onClick={() => setActiveTab('progress')} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold uppercase text-[10px] tracking-widest flex items-center gap-3 dark:text-white border dark:border-slate-700">📈 My Progress</button>
            <button onClick={() => setActiveTab('message')} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold uppercase text-[10px] tracking-widest flex items-center gap-3 dark:text-white border dark:border-slate-700">💬 Message Admin</button>
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-4"></div>
            <button onClick={() => auth.signOut()} className="w-full text-left p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 font-black uppercase text-[10px] tracking-widest">Logout</button>
          </div>
        )}

        {/* 👤 PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div className="space-y-3 overflow-y-auto pr-2">
            <button onClick={() => setActiveTab('menu')} className="text-[10px] font-black text-blue-600 mb-4 uppercase">← Back to Menu</button>
            <div className="mb-4">
               <p className="text-[10px] font-bold text-slate-400 uppercase">Name</p>
               <p className="text-sm font-black dark:text-white">{user.displayName}</p>
            </div>
            <input placeholder="Mobile No." className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none border dark:border-slate-700 text-sm dark:text-white" value={profile.phone} onChange={e=>setProfile({...profile, phone: e.target.value})} />
            <input placeholder="Qualification" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none border dark:border-slate-700 text-sm dark:text-white" value={profile.edu} onChange={e=>setProfile({...profile, edu: e.target.value})} />
            <select className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none border dark:border-slate-700 text-sm dark:text-white" value={profile.gender} onChange={e=>setProfile({...profile, gender: e.target.value})}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
            <input placeholder="City" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none border dark:border-slate-700 text-sm dark:text-white" value={profile.city} onChange={e=>setProfile({...profile, city: e.target.value})} />
            <input placeholder="Pin Code" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none border dark:border-slate-700 text-sm dark:text-white" value={profile.pin} onChange={e=>setProfile({...profile, pin: e.target.value})} />
            <button onClick={saveProfile} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest mt-4 shadow-lg">Update Profile</button>
          </div>
        )}

        {/* 📈 PROGRESS VIEW */}
        {activeTab === 'progress' && (
          <div className="space-y-3 overflow-y-auto">
            <button onClick={() => setActiveTab('menu')} className="text-[10px] font-black text-blue-600 mb-4 uppercase">← Back to Menu</button>
            {history.map(h => (
              <div key={h.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-l-4 border-blue-500 shadow-sm">
                <p className="text-[10px] font-black uppercase truncate dark:text-white">{h.exerciseTitle}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-bold text-blue-600">{h.errorPercent}% Mistakes</span>
                  <span className={`text-[10px] font-black ${h.status?.includes('QUALIFIED') ? 'text-green-500' : 'text-red-500'}`}>{h.status}</span>
                </div>
              </div>
            ))}
            {history.length === 0 && <p className="text-center text-xs italic text-slate-400 py-10">No practice history yet.</p>}
          </div>
        )}

        {/* 💬 MESSAGE VIEW */}
        {activeTab === 'message' && (
          <div className="space-y-4">
            <button onClick={() => setActiveTab('menu')} className="text-[10px] font-black text-blue-600 uppercase">← Back to Menu</button>
            <textarea placeholder="Ask a question or report an issue..." className="w-full h-40 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 outline-none border dark:border-slate-700 text-sm resize-none dark:text-white" value={msg} onChange={e=>setMsg(e.target.value)} />
            <button onClick={sendMessage} className="w-full bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Send to Admin</button>
          </div>
        )}

        <div className="mt-auto pt-6 text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">StenoPulse v2.0 • Powered by Sahil Chahal</p>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;
          
