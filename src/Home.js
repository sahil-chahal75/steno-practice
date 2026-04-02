import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { siteConfig } from './config';

const Home = ({ setView, setActiveDoc }) => {
  const [selectedCat, setSelectedCat] = useState(null);
  const [allDictations, setAllDictations] = useState([]);

  // 📡 DATABASE SE SARA DATA EK BAAR MEIN KHINCHNA
  useEffect(() => {
    const q = query(collection(db, "dictations"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched Data:", data); // Browser Console mein check karne ke liye
      setAllDictations(data);
    });
    return () => unsubscribe();
  }, []);

  // Filter logic: Jo category select ki hai sirf wahi dikhao
  const filteredDictations = allDictations.filter(d => 
    d.cat?.toLowerCase() === selectedCat?.id?.toLowerCase()
  );

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      {!selectedCat ? (
        <div className="grid grid-cols-2 gap-4 mt-6">
          {siteConfig.categories.map((cat) => (
            <div key={cat.id} onClick={() => setSelectedCat(cat)} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border-b-4 border-blue-200 dark:border-blue-900 text-center cursor-pointer active:scale-95 transition-all hover:border-blue-500">
              <span className="text-5xl">{cat.icon}</span>
              <h2 className="font-black mt-4 uppercase text-[10px] tracking-widest text-slate-600 dark:text-slate-300">{cat.name}</h2>
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-in slide-in-from-right duration-300">
          <button onClick={() => setSelectedCat(null)} className="mb-6 font-black text-blue-600 text-[10px] uppercase tracking-widest flex items-center">← Back</button>
          <h2 className="text-3xl font-black uppercase italic mb-6 text-slate-800 dark:text-white border-l-8 border-blue-600 pl-4">{selectedCat.name}</h2>

          <div className="space-y-4">
            {filteredDictations.length > 0 ? filteredDictations.map((d) => (
              <div key={d.id} onClick={() => { setActiveDoc(d); setView('typing'); }} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm flex justify-between items-center cursor-pointer hover:border-blue-500 transition-all border border-transparent">
                <div>
                  <h3 className="font-black text-slate-700 dark:text-slate-200">{d.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                    {d.allowedTime || d.time} Mins | {d.errorLimit}% Limit
                  </p>
                </div>
                <span className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase italic">Start</span>
              </div>
            )) : (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-700">
                <p className="text-slate-400 font-black italic uppercase text-xs">No Dictations Found in {selectedCat.name}</p>
                <p className="text-[9px] text-slate-300 mt-2 font-bold uppercase tracking-widest">Double check category IDs in config.js</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
