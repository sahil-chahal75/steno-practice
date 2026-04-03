import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

const TypingHome = ({ onSelectMatter }) => {
  const [matters, setMatters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🎯 Sirf 'published' status wale matters hi bacho ko dikhenge
    const q = query(
      collection(db, "typing_matters"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mattersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMatters(mattersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-widest text-gray-400">Loading Typing Matters...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter mb-2">Typing Practice Arena</h1>
          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Select a matter to start your examination</p>
        </div>

        {/* Matters Grid */}
        {matters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matters.map((m) => (
              <div 
                key={m.id} 
                onClick={() => onSelectMatter(m)}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span className="text-2xl">⌨️</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Exam Mode</span>
                </div>
                
                <h3 className="text-xl font-black text-gray-800 uppercase truncate mb-1">
                  {m.title}
                </h3>
                <p className="text-xs font-bold text-gray-400 uppercase mb-6 italic">
                  {m.text.split(' ').length} Words Total
                </p>

                <div className="flex items-center text-blue-600 font-black text-xs uppercase tracking-widest">
                  Start Test 
                  <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-black uppercase text-sm">No matters available right now. Check back later!</p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 border-t pt-8 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">
            Developed for Steno Students
          </p>
        </div>

      </div>
    </div>
  );
};

export default TypingHome;
                  
