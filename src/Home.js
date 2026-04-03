import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, onSnapshot, limit, doc, getDoc } from 'firebase/firestore';
import { siteConfig } from './config';
import { useNavigate } from 'react-router-dom';

const Home = ({ setActiveDoc }) => {
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [dictations, setDictations] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [announcement, setAnnouncement] = useState(''); 
  const [isBlocked, setIsBlocked] = useState(false); 
  
  const navigate = useNavigate();

  // 📡 FETCH ANNOUNCEMENT & USER STATUS
  useEffect(() => {
    const unsubNotice = onSnapshot(doc(db, "settings", "announcement"), (doc) => {
      if (doc.exists()) setAnnouncement(doc.data().text);
    });

    const checkUserStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().isBlocked) {
          setIsBlocked(true);
        }
      }
    };
    checkUserStatus();

    return () => unsubNotice();
  }, []);

  // 📡 FETCH USER PERFORMANCE
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

  // 📡 FETCH DICTATIONS (Published Only)
  useEffect(() => {
    if (selectedCat) {
      let queryConstraints = [
        where("cat", "==", selectedCat.id),
        where("status", "==", "published") 
      ];
      
      if (selectedCat.hasSubfolders) {
        if (selectedYear) queryConstraints.push(where("year", "==", selectedYear));
        if (selectedMonth) queryConstraints.push(where("month", "==", selectedMonth));
      }

      if (!selectedCat.hasSubfolders || (selectedYear && selectedMonth)) {
        const q = query(collection(db, "dictations"), ...queryConstraints);
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const sortedData = data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setDictations(sortedData);
        });
        return () => unsubscribe();
      } else {
        setDictations([]);
      }
    }
  }, [selectedCat, selectedYear, selectedMonth]);

  const handleBack = () => {
    if (selectedMonth) setSelectedMonth(null);
    else if (selectedYear) setSelectedYear(null);
    else setSelectedCat(null);
  };

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-2xl border-2 border-red-500">
          <h1 className="text-4xl font-black text-red-600 uppercase mb-4">Access Restricted</h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
            Your account has been suspended by the administrator. <br/> 
            Please contact support for further information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden">
      <div className="fixed inset-0 z-0 opacity-20 dark:opacity-25 pointer-events-none" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }} />

      <div className="relative z-10 p-4">
        
        {announcement && (
          <div className="mb-6 bg-blue-600 text-white p-3 rounded-2xl shadow-lg overflow-hidden relative">
            <div className="whitespace-nowrap animate-marquee font-black uppercase text-[10px] tracking-widest">
              📢 NOTICE: {announcement} — {announcement}
            </div>
          </div>
        )}

        {!selectedCat ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="mb-10 text-center">
              <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">
                STENO<span className="text-blue-600">PULSE</span>
              </h1>
              <div className="h-1 w-20 bg-blue-600 mx-auto mt-2 rounded-full"></div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">
                {siteConfig.heroMessage}
              </p>
            </div>

            {/* Performance Card */}
            <div className="mb-8 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-80 italic">Recent Performance</h3>
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
                <p className="font-bold italic text-sm">Welcome to StenoPulse! Start your training journey today. 🚀</p>
              )}
            </div>

            {/* ✨ NEW: TYPING EXAMINATION SECTION */}
            <div 
              onClick={() => navigate('/typing-practice')}
              className="mb-10 bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-xl border-2 border-blue-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl group-hover:rotate-12 transition-transform">⌨️</div>
                <div>
                  <h2 className="font-black uppercase text-[12px] tracking-widest text-slate-800 dark:text-white italic">Typing Examination Hall</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Improve your speed with real-time test simulations</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black group-hover:translate-x-2 transition-transform">
                →
              </div>
            </div>

            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 ml-4">Training Departments</h4>
            <div className="grid grid-cols-2 gap-6 mb-16">
              {siteConfig.categories.map((cat) => (
                <div key={cat.id} onClick={() => setSelectedCat(cat)} className="relative group cursor-pointer active:scale-95 transition-transform">
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl text-center border-t border-white/50 dark:border-slate-700">
                    <span className="text-6xl block mb-4">{cat.icon}</span>
                    <h2 className="font-black uppercase text-[11px] tracking-widest text-slate-800 dark:text-slate-100">{cat.name}</h2>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-500">
            <button onClick={handleBack} className="mb-8 font-black text-blue-600 dark:text-blue-400 text-[10px] uppercase tracking-widest flex items-center">
              ← Return to Hub
            </button>
            
            <h2 className="text-4xl font-black uppercase italic mb-10 text-slate-900 dark:text-white leading-none">
              {selectedMonth || selectedYear || selectedCat.name}
            </h2>

            {selectedCat.hasSubfolders && !selectedYear && (
              <div className="grid grid-cols-2 gap-6">
                {selectedCat.years.map(year => (
                  <div key={year} onClick={() => setSelectedYear(year)} className="bg-white/90 dark:bg-slate-800/90 p-8 rounded-[2rem] shadow-xl text-center font-black text-blue-600 cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all">
                    📅 {year}
                  </div>
                ))}
              </div>
            )}

            {selectedYear && !selectedMonth && (
              <div className="grid grid-cols-2 gap-4">
                {selectedCat.months.map(month => (
                  <div key={month} onClick={() => setSelectedMonth(month)} className="bg-white/90 dark:bg-slate-800/90 p-6 rounded-[1.5rem] shadow-lg text-center font-black text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-blue-50 transition-all">
                    {month}
                  </div>
                ))}
              </div>
            )}

            {(!selectedCat.hasSubfolders || (selectedYear && selectedMonth)) && (
              <div className="space-y-6">
                {dictations.length > 0 ? dictations.map((d) => (
                  <div key={d.id} onClick={() => { setActiveDoc(d); navigate('/typing'); }} className="bg-white/90 dark:bg-slate-800/90 p-7 rounded-[2.5rem] shadow-xl flex justify-between items-center cursor-pointer group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black">
                        {d.title.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase italic">{d.title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{d.allowedTime} Mins | {d.errorLimit}% Limit</p>
                      </div>
                    </div>
                    <div className="bg-blue-600 text-white p-3 rounded-2xl group-hover:scale-110 transition-transform">🚀</div>
                  </div>
                )) : (
                  <div className="text-center py-20 text-slate-400 font-black uppercase text-[10px]">
                    No Active Tests Found In This Directory
                  </div>
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
