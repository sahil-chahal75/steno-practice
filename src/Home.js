import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, onSnapshot, limit, doc, getDoc } from 'firebase/firestore';
import { siteConfig } from './config';
import { useNavigate } from 'react-router-dom';

const Home = ({ setActiveDoc }) => {
  const [hubMode, setHubMode] = useState('steno'); 
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [dictations, setDictations] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  
  const navigate = useNavigate();

  const typingCategories = [
    { id: 'gen', name: 'General Typing', icon: '📄' },
    { id: 'legal', name: 'Legal Matter', icon: '⚖️' },
    { id: 'tech', name: 'Technology', icon: '💻' },
    { id: 'essay', name: 'Essay Typing', icon: '✍️' },
    { id: 'poly', name: 'Political Matter', icon: '🏛️' },
    { id: 'misc_type', name: 'Miscellaneous', icon: '📂' }
  ];

  useEffect(() => {
    const unsubNotice = onSnapshot(doc(db, "settings", "announcement"), (doc) => {
      if (doc.exists()) setAnnouncement(doc.data().text);
    });

    const checkUserStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().isBlocked) setIsBlocked(true);
      }
    };
    checkUserStatus();
    return () => unsubNotice();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const q = query(collection(db, "results"), where("userId", "==", user.uid), limit(10));
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const sorted = snap.docs.map(d => d.data()).sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
          setUserStats(sorted[0]);
        }
      });
      return () => unsub();
    }
  }, []);

  // 📡 REPAIRED FETCH LOGIC (To bring back KC & others)
  useEffect(() => {
    if (selectedCat) {
      let queryConstraints = [
        where("cat", "==", selectedCat.id),
        where("status", "==", "published"),
        where("type", "==", hubMode)
      ];
      
      if (selectedCat.hasSubfolders) {
        if (selectedYear) queryConstraints.push(where("year", "==", selectedYear));
        if (selectedMonth) queryConstraints.push(where("month", "==", selectedMonth));
      }

      if (!selectedCat.hasSubfolders || (selectedYear && selectedMonth)) {
        const q = query(collection(db, "dictations"), ...queryConstraints);
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setDictations(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        });
        return () => unsubscribe();
      }
    }
  }, [selectedCat, selectedYear, selectedMonth, hubMode]);

  const handleBack = () => {
    if (selectedMonth) setSelectedMonth(null);
    else if (selectedYear) setSelectedYear(null);
    else setSelectedCat(null);
  };

  if (isBlocked) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-10 rounded-[3rem] shadow-2xl border-2 border-red-500 text-center">
        <h1 className="text-4xl font-black text-red-600 uppercase mb-4">Access Restricted</h1>
        <p className="text-slate-400 font-bold uppercase text-xs">Please contact administrator.</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen pb-20 overflow-x-hidden">
      {/* 🖼️ COMPUTER BACKGROUND (Fixed & Subtle) */}
      <div className="fixed inset-0 z-0 opacity-10 dark:opacity-20 pointer-events-none" 
           style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=2070&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }} />

      <div className="relative z-10 p-4 max-w-5xl mx-auto">
        
        {announcement && (
          <div className="mb-6 bg-red-600 text-white p-3 rounded-2xl shadow-lg overflow-hidden relative">
            <div className="whitespace-nowrap animate-marquee font-black uppercase text-[10px] tracking-widest">⚠️ NOTICE: {announcement}</div>
          </div>
        )}

        {/* 👋 WELCOME CARD */}
        <div className="mb-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl flex justify-between items-center border-t border-white/20">
            <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic leading-tight">Hello, {auth.currentUser?.displayName?.split(' ')[0] || 'Warrior'}!</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Practice makes a man perfect.</p>
            </div>
            {userStats && (
                <div className="text-right">
                    <p className="text-[8px] font-black text-blue-600 uppercase">Recent Performance</p>
                    <p className="text-xl font-black dark:text-white">{userStats.wpm || userStats.errorPercent + '%'} <span className="text-[10px] opacity-50">{userStats.wpm ? 'WPM' : 'Err'}</span></p>
                </div>
            )}
        </div>

        {/* 🚀 SELECTION TAB SYSTEM */}
        <div className="flex bg-slate-200 dark:bg-slate-800/80 p-1.5 rounded-full mb-10 shadow-inner max-w-md mx-auto border border-slate-300 dark:border-slate-700">
          <button 
            onClick={() => { setHubMode('steno'); setSelectedCat(null); }}
            className={`flex-1 py-3.5 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${hubMode === 'steno' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-slate-500'}`}
          >
            ✏️ STENO HUB
          </button>
          <button 
            onClick={() => { setHubMode('typing'); setSelectedCat(null); }}
            className={`flex-1 py-3.5 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${hubMode === 'typing' ? 'bg-green-600 text-white shadow-lg scale-105' : 'text-slate-500'}`}
          >
            ⌨️ TYPING ARENA
          </button>
        </div>

        {!selectedCat ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-20">
              {(hubMode === 'steno' ? siteConfig.categories : typingCategories).map((cat) => (
                <div key={cat.id} onClick={() => setSelectedCat(cat)} className="group cursor-pointer active:scale-95 transition-all">
                  <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-8 rounded-[3rem] shadow-xl text-center border-b-4 border-transparent group-hover:border-blue-500 transition-all">
                    <span className="text-5xl block mb-4">{cat.icon}</span>
                    <h2 className="font-black uppercase text-[11px] tracking-widest text-slate-800 dark:text-slate-100">{cat.name}</h2>
                  </div>
                </div>
              ))}
            </div>

            {/* ✨ DYNAMIC VIBRANT FEATURE GRID */}
            <div className="mt-10 pt-10 border-t-2 border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* STENO FEATURES */}
                    <div className="bg-blue-600 p-8 rounded-[3rem] shadow-2xl text-white transform hover:-translate-y-2 transition-all">
                        <h4 className="text-xl font-black uppercase italic mb-6 border-b border-blue-400 pb-2">Steno Hub Features</h4>
                        <ul className="space-y-4 font-bold text-[11px] uppercase tracking-wider">
                            <li className="flex items-center gap-3">⭐ Modern Dictation Typing Tool</li>
                            <li className="flex items-center gap-3">⭐ Modern Automatic Calculator</li>
                            <li className="flex items-center gap-3">⭐ Detailed Result (Full & Half Mistake)</li>
                            <li className="flex items-center gap-3">⭐ Download Original & Typed Result</li>
                        </ul>
                    </div>

                    {/* TYPING FEATURES */}
                    <div className="bg-green-600 p-8 rounded-[3rem] shadow-2xl text-white transform hover:-translate-y-2 transition-all">
                        <h4 className="text-xl font-black uppercase italic mb-6 border-b border-green-400 pb-2">Typing Arena Features</h4>
                        <ul className="space-y-4 font-bold text-[11px] uppercase tracking-wider">
                            <li className="flex items-center gap-3">⚡ Type at your pace - select Timing</li>
                            <li className="flex items-center gap-3">⚡ Modern Typing Interface</li>
                            <li className="flex items-center gap-3">⚡ Zero-Highlight word practice</li>
                            <li className="flex items-center gap-3">⚡ Accurate NET WPM Logic</li>
                            <li className="flex items-center gap-3">⚡ Detailed Performance Result</li>
                        </ul>
                    </div>
                </div>
                <p className="text-center mt-12 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">STENOPLUS Ecosystem © 2026</p>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-500">
            <button onClick={handleBack} className="mb-8 font-black text-blue-600 text-[10px] uppercase tracking-widest flex items-center gap-2">
              <span className="text-lg">←</span> Return to {hubMode.toUpperCase()} Hub
            </button>
            <h2 className="text-4xl font-black uppercase italic mb-10 text-slate-900 dark:text-white">{selectedCat.name}</h2>
            <div className="space-y-4">
                {dictations.length > 0 ? dictations.map((d) => (
                  <div key={d.id} onClick={() => { setActiveDoc(d); navigate(hubMode === 'steno' ? '/typing' : '/typing-arena'); }} className="bg-white/90 dark:bg-slate-800/90 p-6 rounded-[2.5rem] shadow-lg flex justify-between items-center cursor-pointer group hover:bg-blue-600 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center font-black group-hover:bg-white group-hover:text-blue-600">{d.title.charAt(0)}</div>
                      <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase group-hover:text-white italic">{d.title}</h3>
                    </div>
                    <div className="bg-blue-600 text-white p-2.5 rounded-xl group-hover:bg-white group-hover:text-blue-600">🚀</div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-[3rem] text-slate-400 font-black uppercase text-[10px] tracking-widest">No active matter found in this category</div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
