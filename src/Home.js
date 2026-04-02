import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { siteConfig } from './config';

const Home = ({ setView, setActiveDoc }) => {
  const [selectedCat, setSelectedCat] = useState(null);
  const [dictations, setDictations] = useState([]);

  // 📡 FIREBASE SE LIVE DATA KHINCHNA
  useEffect(() => {
    if (selectedCat) {
      const q = query(
        collection(db, "dictations"),
        where("cat", "==", selectedCat.id), // 'cat' field match kar raha hai
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDictations(data);
      }, (error) => {
        console.error("Firestore Error:", error);
      });

      return () => unsubscribe();
    }
  }, [selectedCat]);

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      {!selectedCat ? (
        <>
          {/* MAGAZINE BOXES */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            {siteConfig.categories.map((cat) => (
              <div 
                key={cat.id} 
                onClick={() => setSelectedCat(cat)}
                className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border-b-4 border-blue-200 dark:border-blue-900 text-center cursor-pointer active:scale-95 transition-all hover:border-blue-500 group"
              >
                <span className="text-5xl group-hover:scale-110 block transition-transform">{cat.icon}</span>
                <h2 className="font-black mt-4 uppercase text-[10px] tracking-widest text-slate-600 dark:text-slate-300">
                  {cat.name}
                </h2>
              </div>
            ))}
          </div>

          {/* SITE FEATURES */}
          <section className="mt-12 px-2">
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 font-black mb-6 text-center italic">
              Premium Features
            </h4>
            <div className="space-y-4">
              {siteConfig.features.map((f, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 px-5 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center shadow-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center text-xs font-black mr-4">{i+1}</div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 italic">{f}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        /* LIST VIEW (Yahan dikhegi apki exercise) */
        <div className="animate-in slide-in-from-right duration-300">
          <button 
            onClick={() => setSelectedCat(null)} 
            className="mb-6 font-black text-blue-600 dark:text-blue-400 text-[10px] uppercase tracking-widest flex items-center"
          >
            ← Back to Magazines
          </button>
          
          <h2 className="text-3xl font-black uppercase italic mb-6 text-slate-800 dark:text-white border-l-8 border-blue-600 pl-4">
            {selectedCat.name}
          </h2>

          <div className="space-y-4">
            {dictations.length > 0 ? dictations.map((d) => (
              <div 
                key={d.id} 
                onClick={() => { setActiveDoc(d); setView('typing'); }}
                className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-transparent dark:border-slate-700 flex justify-between items-center cursor-pointer hover:border-blue-500 transition-all group"
              >
                <div>
                  <h3 className="font-black text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{d.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                    {d.allowedTime || d.time} Mins | {d.errorLimit}% Limit
                  </p>
                </div>
                <span className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase italic">
                  Start Practice
                </span>
              </div>
            )) : (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-700">
                <p className="text-slate-300 dark:text-slate-600 font-black italic uppercase tracking-widest">
                  No Exercises Found in this category
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
