import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, onSnapshot, limit, doc, getDoc } from 'firebase/firestore';
import { siteConfig } from './config';
import { useNavigate } from 'react-router-dom';

const Home = ({ setActiveDoc }) => {
  // --- Naya State: Selection Mode (steno / typing / null) ---
  const [hubMode, setHubMode] = useState(null); 
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [dictations, setDictations] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  
  const navigate = useNavigate();

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

  useEffect(() => {
    if (selectedCat && hubMode) {
      // 🚨 Logic Fix: HubMode ke hisab se query change hogi
      let queryConstraints = [
        where("cat", "==", selectedCat.id),
        where("status", "==", "published"),
        where("type", "==", hubMode) // 'steno' or 'typing'
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
      } else {
        setDictations([]);
      }
    }
  }, [selectedCat, selectedYear, selectedMonth, hubMode]);

  const handleBack = () => {
    if (selectedMonth) setSelectedMonth(null);
    else if (selectedYear) setSelectedYear(null);
    else if (selectedCat) setSelectedCat(null);
    else setHubMode(null); // Back to Hub Selection
  };

  if (isBlocked) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-2xl border-2 border-red-500">
        <h1 className="text-4xl font-black text-red-600 uppercase mb-4">Access Restricted</h1>
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Your account is suspended. Contact Support.</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden">
      <div className="fixed inset-0 z-0 opacity-20 dark:opacity-25 pointer-events-none" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }} />

      <div className="relative z-10 p-4">
        
        {announcement && (
          <div className="mb-6 bg-blue-600 text-white p-3 rounded-2xl shadow-lg overflow-hidden relative">
            <div className="whitespace-nowrap animate-marquee font-black uppercase text-[10px] tracking-widest">📢 NOTICE: {announcement}</div>
          </div>
        )}

        {/* --- STEP 0: HUB SELECTION (Side-by-Side Cards) --- */}
        {!hubMode ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="mb-10 text-center">
              <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">STENO<span className="text-blue-600">PULSE</span></h1>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Select Training Mode</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* STENO CARD */}
              <div onClick={() => setHubMode('steno')} className="group cursor-pointer">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-10 rounded-[3rem] shadow-xl border-t border-white/50 dark:border-slate-700 text-center transition-all hover:scale-105 hover:bg-blue-600 group-hover:text-white">
                  <span className="text-7xl block mb-6">🎙️</span>
                  <h2 className="font-black uppercase text-2xl tracking-tighter">Steno Hub</h2>
                  <p className="text-[9px] font-bold uppercase opacity-60 mt-2 tracking-widest">Shorthand & Transcription</p>
                </div>
              </div>

              {/* TYPING CARD */}
              <div onClick={() => setHubMode('typing')} className="group cursor-pointer">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-10 rounded-[3rem] shadow-xl border-t border-white/50 dark:border-slate-700 text-center transition-all hover:scale-105 hover:bg-green-600 group-hover:text-white">
                  <span className="text-7xl block mb-6">⌨️</span>
                  <h2 className="font-black uppercase text-2xl tracking-tighter">Typing Arena</h2>
                  <p className="text-[9px] font-bold uppercase opacity-60 mt-2 tracking-widest">Speed & Accuracy Focus</p>
                </div>
              </div>
            </div>
          </div>
        ) : !selectedCat ? (
          /* --- STEP 1: CATEGORY SELECTION --- */
          <div className="animate-in slide-in-from-bottom-4">
            <button onClick={handleBack} className="mb-6 font-black text-blue-600 text-[10px] uppercase">← Back to Hub</button>
            <h2 className="text-3xl font-black uppercase italic mb-8">{hubMode === 'steno' ? '🎙️ Shorthand Folders' : '⌨️ Typing Exercises'}</h2>
            <div className="grid grid-cols-2 gap-6">
              {siteConfig.categories.map((cat) => (
                <div key={cat.id} onClick={() => setSelectedCat(cat)} className="bg-white/80 dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl text-center cursor-pointer active:scale-95 transition-all">
                  <span className="text-5xl block mb-4">{cat.icon}</span>
                  <h2 className="font-black uppercase text-[11px] tracking-widest">{cat.name}</h2>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* --- STEP 2: FOLDER & EXERCISE LIST --- */
          <div className="animate-in slide-in-from-right duration-500">
            <button onClick={handleBack} className="mb-8 font-black text-blue-600 text-[10px] uppercase">← Return</button>
            <h2 className="text-4xl font-black uppercase italic mb-10 text-slate-900 dark:text-white">{selectedMonth || selectedYear || selectedCat.name}</h2>

            {selectedCat.hasSubfolders && !selectedYear && (
              <div className="grid grid-cols-2 gap-6">
                {selectedCat.years.map(year => (
                  <div key={year} onClick={() => setSelectedYear(year)} className="bg-white/90 dark:bg-slate-800/90 p-8 rounded-[2rem] shadow-xl text-center font-black text-blue-600 cursor-pointer transition-all hover:bg-blue-600 hover:text-white">📅 {year}</div>
                ))}
              </div>
            )}

            {selectedYear && !selectedMonth && (
              <div className="grid grid-cols-2 gap-4">
                {selectedCat.months.map(month => (
                  <div key={month} onClick={() => setSelectedMonth(month)} className="bg-white/90 dark:bg-slate-800/90 p-6 rounded-[1.5rem] shadow-lg text-center font-black text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-blue-50 transition-all">{month}</div>
                ))}
              </div>
            )}

            {(!selectedCat.hasSubfolders || (selectedYear && selectedMonth)) && (
              <div className="space-y-6">
                {dictations.length > 0 ? dictations.map((d) => (
                  <div 
                    key={d.id} 
                    onClick={() => { 
                      setActiveDoc(d); 
                      // 🚨 Navigation Choice
                      navigate(hubMode === 'steno' ? '/typing' : '/typing-arena'); 
                    }} 
                    className="bg-white/90 dark:bg-slate-800/90 p-7 rounded-[2.5rem] shadow-xl flex justify-between items-center cursor-pointer group hover:bg-blue-600"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black group-hover:bg-white group-hover:text-blue-600">{d.title.charAt(0)}</div>
                      <div>
                        <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase group-hover:text-white">{d.title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-white/70">{d.allowedTime} Mins | {hubMode === 'steno' ? 'Steno' : 'Typing'}</p>
                      </div>
                    </div>
                    <div className="bg-blue-600 text-white p-3 rounded-2xl group-hover:bg-white group-hover:text-blue-600 transition-transform">🚀</div>
                  </div>
                )) : (
                  <div className="text-center py-20 text-slate-400 font-black uppercase text-[10px]">No Active Tests in this Mode</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
