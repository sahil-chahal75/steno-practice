import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const Sidebar = ({ isOpen, setIsOpen, user }) => {
  const [activeTab, setActiveTab] = useState('menu'); 
  const [profile, setProfile] = useState({ phone: '', edu: '', gender: 'Male', city: '', pin: '' });
  const [history, setHistory] = useState([]); // Results history
  const [userMessages, setUserMessages] = useState([]); // 💬 Messages with Replies
  const [msg, setMsg] = useState('');

  // ✨ BACK BUTTON FIX
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ sidebar: 'open' }, '');
    }
    const handleBack = () => { if (isOpen) setIsOpen(false); };
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, [isOpen, setIsOpen]);

  // 👤 FETCH PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setProfile(docSnap.data());
    };
    if (activeTab === 'profile') fetchProfile();
  }, [activeTab, user]);

  // 📈 FETCH RESULTS HISTORY
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

  // 💬 FETCH MESSAGES & REPLIES
  useEffect(() => {
    const fetchUserMessages = async () => {
      if (!user) return;
      // Fetching latest 10 messages from this user
      const q = query(
        collection(db, "messages"), 
        where("email", "==", user.email),
        orderBy("time", "desc"),
        limit(10)
      );
      const snap = await getDocs(q);
      setUserMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    if (activeTab === 'message') fetchUserMessages();
  }, [activeTab, user]);

  const saveProfile = async () => {
    try {
      await setDoc(doc(db, "users", user.uid), { ...profile, name: user.displayName, email: user.email }, { merge: true });
      alert("Profile Updated! ✅");
    } catch (e) { alert("Error: " + e.message); }
  };

  const sendMessage = async () => {
    if (!msg) return;
    try {
      await addDoc(collection(db, "messages"), { 
        sender: user.displayName, 
        email: user.email, 
        text: msg, 
        time: new Date(), 
        read: false,
        replyText: null // Placeholder for Admin's reply
      });
      alert("Message sent to Admin! 📩");
      setMsg('');
      setActiveTab('menu'); // Go back after sending
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

        {/* --- MAIN MENU --- */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <button onClick={() => setActiveTab('profile')} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold uppercase text-[10px] tracking-widest dark:text-white border dark:border-slate-700">👤 My Profile</button>
            <button onClick={() => setActiveTab('progress')} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold uppercase text-[10px] tracking-widest dark:text-white border dark:border-slate-700">📈 My Progress</button>
            <button onClick={() => setActiveTab('message')} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold uppercase text-[10px] tracking-widest dark:text-white border dark:border-slate-700">💬 Message Admin</button>
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-4"></div>
            <button onClick={() => auth.signOut()} className="w-full text-left p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 font-black uppercase text-[10px] tracking-widest">Logout</button>
          </div>
        )}

        {/* --- PROFILE TAB --- */}
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

        {/* --- PROGRESS TAB --- */}
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

        {/* --- MESSAGE TAB (NEW: SHOWS REPLIES) --- */}
        {activeTab === 'message' && (
          <div className="space-y-4">
            <button onClick={() => setActiveTab('menu')} className="text-[10px] font-black text-blue-600 uppercase">← Back</button>
            
            <div className="max-h-64 overflow-y-auto space-y-3 mb-2 pr-1 custom-scrollbar">
              {userMessages.length > 0 ? userMessages.map((m, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                  <p className="text-[11px] font-bold dark:text-white">You: {m.text}</p>
                  {m.replyText && (
                    <div className="mt-2 pl-3 border-l-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-r-xl">
                      <p className="text-[9px] font-black text-blue-600 uppercase">Admin Reply:</p>
                      <p className="text-[10px] italic dark:text-slate-200">{m.replyText}</p>
                    </div>
                  )}
                </div>
              )) : <p className="text-[10px] text-slate-400 italic text-center py-4">No previous conversations.</p>}
            </div>

            <textarea placeholder="Write message to admin..." className="w-full h-24 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-sm dark:text-white outline-none" value={msg} onChange={e=>setMsg(e.target.value)} />
            <button onClick={sendMessage} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Send Message</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
