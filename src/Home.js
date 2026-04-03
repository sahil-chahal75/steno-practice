import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { siteConfig } from './config';
// 1. Navigation tool import karo
import { useNavigate } from 'react-router-dom';

const Home = ({ setActiveDoc }) => {
  const [selectedCat, setSelectedCat] = useState(null);
  const [dictations, setDictations] = useState([]);
  const [userStats, setUserStats] = useState(null);
  
  // 2. Navigate function initialize karo
  const navigate = useNavigate();

  // 📡 User Performance Fetch
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const q = query(
        collection(db, "results"),
        where("userId", "==", user.uid),
        limit(10)
      );
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const sorted = snap.docs
            .map(d => d.data())
            .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
          setUserStats(sorted[0]);
        }
      });
      return () => unsub();
    }
  }, []);

  // 📡 Dictations Fetch
  useEffect(() => {
    if (selectedCat) {
      const q = query(
        collection(db, "dictations"),
        where("cat", "==", selectedCat.id)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sortedData = data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setDictations(sortedData);
      });
      return () => unsubscribe();
    }
  }, [selectedCat]);

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden">
      
      {/* 🖼️ BACKGROUND */}
      <div 
        className="fixed inset-0 z-0 opacity-20 dark:opacity-25 pointer-events-none transition-opacity"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 p-4">
        {!selectedCat ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            
            {/* 👋 WELCOME HEADER */}
            <div className="mb-10 text-center">
              <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">
                STENO<span className="text-blue-600">PULSE</span>
              </h1>
              <div className="h-1 w-20 bg-blue-600 mx-auto mt-2 rounded-full"></div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">
                {siteConfig.heroMessage}
              </p>
            </div>

            {/* 📈 MINI-DASHBOARD */}
            <div className="mb-12 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 text-9xl opacity-10 group-hover:rotate-12 transition-transform">📊</div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-80 italic">Your Last Performance</h3>
              {userStats ? (
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-black italic">{userStats.errorPercent}% <span className="text-sm font-medium opacity-60">Errors</span></p>
                    <p className="text-[10px] mt-1 font-bold uppercase opacity-70 tracking-tighter">{userStats.exerciseTitle}</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-lg ${userStats.status?.includes('QUALIFIED') ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}`}>
                    {userStats.status}
                  </div>
                </div>
              ) : (
                <p className="font-bold italic text-sm">Welcome Sahil! Start your first test today. 🚀</p>
              )}
            </div>

            {/* 💠 CATEGORY GRID */}
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 ml-4">Training Centers</h4>
            <div className="grid grid-cols-2 gap-6 mb-16">
              {siteConfig.categories.map((cat) => (
                <div key={cat.id} onClick={() => setSelectedCat(cat)} className="relative group cursor-pointer">
                  <div className="absolute inset-0 bg-blue-600 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-20 transition-all"></div>
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl border-t border-l border-white/50 dark:border-slate-700 text-center active:scale-95 transition-all">
                    <span className="text-6xl block transform group-hover:scale-110 transition-transform mb-4">{cat.icon}</span>
                    <h2 className="font-black uppercase text-[11px] tracking-widest text-slate-800 dark:text-slate-100">{cat.name}</h2>
                    <div className="mt-3 w-8 h-1 bg-slate-200 dark:bg-slate-700 mx-auto rounded-full group-hover:w-16 group-hover:bg-blue-500 transition-all"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* ✨ FEATURES */}
            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-10 rounded-[3rem] border border-slate-200 dark:border-slate-700 mb-10">
               <h3 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 italic">Premium Advantages</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {siteConfig.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg text-xl">⚡</div>
                       <div>
                          <p className="text-xs font-black uppercase dark:text-slate-200 tracking-tight">{f}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Ready to Start</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

          </div>
        ) : (
          /* 📝 DICTATION LIST VIEW */
          <div className="animate-in slide-in-from-right duration-500">
            <button 
              onClick={() => setSelectedCat(null)} 
              className="mb-8 font-black text-blue-600 dark:text-blue-400 text-[10px] uppercase tracking-[0.2em] flex items-center hover:-translate-x-1 transition-transform"
            >
              ← Back to Hub
            </button>
            
            <h2 className="text-4xl font-black uppercase italic mb-10 text-slate-900 dark:text-white leading-none">
              {selectedCat.name} <br/>
              <span className="text-sm font-bold text-slate-400 tracking-[0.3em] not-italic">Available Exercises</span>
            </h2>

            <div className="space-y-6">
              {dictations.length > 0 ? dictations.map((d) => (
                <div 
                  key={d.id} 
                  // 3. setView ki jagah navigate('/typing') use kiya
                  onClick={() => { setActiveDoc(d); navigate('/typing'); }}
                  className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-7 rounded-[2.5rem] shadow-xl border border-white/50 dark:border-slate-700 flex justify-between items-center cursor-pointer hover:border-blue-500 transition-all hover:translate-y-[-4px] group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg">
                      {d.title.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors uppercase italic">{d.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">
                        {d.allowedTime || d.time} Mins | {d.errorLimit}% Limit
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-900 dark:bg-blue-600 text-white p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                  </div>
                </div>
              )) : (
                <div className="text-center py-24 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <p className="text-slate-400 font-black italic uppercase text-xs tracking-widest">No Tests Uploaded Yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
