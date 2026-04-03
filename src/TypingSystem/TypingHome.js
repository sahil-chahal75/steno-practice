import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot } from "firebase/firestore";

const TypingHome = ({ onSelectMatter }) => {
  const [matters, setMatters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🎯 Simple query to avoid Indexing issues on mobile/Vercel
    const q = query(collection(db, "typing_matters"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mattersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 🛠️ Manual Filter: Only show published matters
      // 🛠️ Manual Sort: Newest matters first (descending by createdAt)
      const filteredAndSorted = mattersData
        .filter(m => m.status === 'published')
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setMatters(filteredAndSorted);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-widest text-gray-400 italic animate-pulse">Loading Examination Matters...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter mb-2">Typing Practice Arena</h1>
          <div className="h-1 w-20 bg-blue-600 mx-auto mb-4 rounded-full"></div>
          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest italic">Select a matter to start your examination</p>
        </div>

        {/* Matters Grid */}
        {matters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matters.map((m) => (
              <div 
                key={m.id} 
                onClick={() => onSelectMatter(m)}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all cursor-pointer group active:scale-95"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                    <span className="text-2xl">⌨️</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic block">Official Mode</span>
                    <span className="text-[9px] font-black text-green-500 uppercase tracking-tighter">● Online</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-gray-800 uppercase truncate mb-1 italic tracking-tight">
                  {m.title}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-8 tracking-widest">
                  {m.text ? m.text.trim().split(/\s+/).length : 0} Words Total
                </p>

                <div className="flex items-center justify-between text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] border-t border-gray-50 pt-4">
                  Start Examination 
                  <span className="text-lg group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-inner">
            <div className="text-4xl mb-4 opacity-20">📂</div>
            <p className="text-gray-400 font-black uppercase text-xs tracking-widest italic">No published matters available yet</p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-20 border-t border-gray-100 pt-8 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] italic">
            StenoPulse Examination System
          </p>
        </div>

      </div>
    </div>
  );
};

export default TypingHome;
