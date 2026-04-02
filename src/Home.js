import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { siteConfig } from './config';

// Features ke liye Icons map
const featureIcons = {
  "Real Exam Interface": "🖥️",
  "Auto-Mistake Calculator": "📊",
  "Download PDF Result": "📄",
  "Global Leaderboard": "🏆"
};

const Home = ({ setView, setActiveDoc }) => {
  const [selectedCat, setSelectedCat] = useState(null);
  const [dictations, setDictations] = useState([]);

  // Firestore se Live Data khinchna
  useEffect(() => {
    if (selectedCat) {
      const q = query(
        collection(db, "dictations"),
        where("cat", "==", selectedCat.id),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDictations(data);
      });
      return () => unsubscribe();
    }
  }, [selectedCat]);

  return (
    <div className="relative animate-in fade-in duration-500 pb-20 min-h-[85vh]">
      
      {/* 🖼️ LIGHT STENO BACKGROUND PHOTO (Opacity set to 5% - Light and Dark match) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.05] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "url('https://cdn.pixabay.com/photo/2016/03/27/19/27/steno-1283838_1280.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'grayscale(100%)' // Thoda light background ke liye
        }}
      />

      {/* Main Content (relative z-10 taaki photo ke upar dikhe) */}
      <div className="relative z-10 px-2">
        
        {!selectedCat ? (
          <>
            {/* 👋 HERO SECTION */}
            <header className="text-center py-10 mt-2 mb-10 bg-white/30 dark:bg-slate-800/20 backdrop-blur-sm rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner">
              <h1 className="text-4xl md:text-5xl font-black italic text-slate-950 dark:text-white tracking-tighter uppercase">
                {siteConfig.name} <span className="text-blue-600 dark:text-blue-500">Hub</span>
              </h1>
              <p className="mt-3 text-slate-500 dark:text-slate-400 font-bold text-sm max-w-lg mx-auto uppercase tracking-widest">
                {siteConfig.heroMessage}
              </p>
            </header>

            {/* 🟦 MAGAZINE BOXES (Updated Style) */}
            <div className="grid grid-cols-2 gap-5 mt-6 mb-16">
              {siteConfig.categories.map((cat) => (
                <div 
                  key={cat.id} 
                  onClick={() => setSelectedCat(cat)}
                  className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-lg border-b-8 border-slate-100 dark:border-slate-950 text-center cursor-pointer active:scale-95 transition-all hover:scale-[1.03] group hover:border-blue-300 dark:hover:border-blue-900"
                >
                  <span className="text-6xl group-hover:scale-110 block transition-transform">{cat.icon}</span>
                  <h2 className="font-black mt-5 uppercase text-[11px] tracking-widest text-slate-700 dark:text-slate-200">
                    {cat.name}
                  </h2>
                </div>
              ))}
            </div>

            {/* ✨ PREMIUM FEATURES SECTION (New Graph Cards Style) */}
            <section className="mt-16 bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] uppercase tracking-[0.4em] text-blue-600 dark:text-blue-500 font-black mb-10 text-center italic">
                Advanced Practice System
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {siteConfig.features.map((featureName, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center shadow-inner hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                    <div className="bg-white dark:bg-slate-800 text-3xl p-4 rounded-2xl shadow-md mr-5">
                      {featureIcons[featureName] || "✨"}
                    </div>
                    <div>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide truncate block">
                        {featureName}
                      </span>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1">StenoPulse Premium</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* 📝 LIST VIEW (Dictations) */
          <div className="animate-in slide-in-from-right duration-300">
            <button 
              onClick={() => setSelectedCat(null)} 
              className="mb-8 font-black text-blue-600 dark:text-blue-400 text-[10px] uppercase tracking-widest flex items-center group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Academy Hub
            </button>
            
            <h2 className="text-3xl font-black uppercase italic mb-8 text-slate-900 dark:text-white border-l-8 border-blue-600 dark:border-blue-500 pl-4">
              {selectedCat.name}
            </h2>

            <div className="space-y-5">
              {dictations.length > 0 ? dictations.map((d) => (
                <div 
                  key={d.id} 
                  onClick={() => { setActiveDoc(d); setView('typing'); }}
                  className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center cursor-pointer hover:scale-[1.02] transition-all group"
                >
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{d.title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1">
                      {d.allowedTime || d.time} Mins | {d.errorLimit}% Error Limit
                    </p>
                  </div>
                  <span className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase italic tracking-wider active:scale-95">
                    Start Test
                  </span>
                </div>
              )) : (
                <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                  <span className="text-6xl block mb-6">📂</span>
                  <p className="text-slate-400 dark:text-slate-600 font-black italic uppercase tracking-widest text-xs">
                    No Exercises Found in {selectedCat.name}
                  </p>
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
