import React, { useState, useEffect, useRef } from 'react';
import { siteConfig } from './config';
import { auth, db, storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';

const App = () => {
  // --- ADMIN SETTINGS (SAHIL CHAHAL) ---
  const ADMIN_EMAIL = "sahilchahalkuk@gmail.com";
  const ADMIN_NAME = "SAHIL CHAHAL";

  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [selectedCat, setSelectedCat] = useState(null);
  const [dictations, setDictations] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [showAdmin, setShowAdmin] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [comparisonData, setComparisonData] = useState([]);
  const [stats, setStats] = useState({ errors: 0, percentage: 0, status: '' });
  
  const [adminForm, setAdminForm] = useState({ title: '', cat: 'kc', text: '', time: 10, errorLimit: 5 });
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const isAdmin = user && user.email === ADMIN_EMAIL;

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };

  useEffect(() => {
    if (view === 'list' && selectedCat) {
      const q = query(collection(db, "dictations"), where("category", "==", selectedCat.id), orderBy("createdAt", "desc"));
      return onSnapshot(q, (s) => setDictations(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [view, selectedCat]);

  useEffect(() => {
    if (view === 'typing' && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && view === 'typing') {
      finishTest();
    }
    return () => clearInterval(timerRef.current);
  }, [view, timeLeft]);

  const clean = (word) => word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase().trim();

  const finishTest = () => {
    clearInterval(timerRef.current);
    const originalWords = activeDoc.text.trim().split(/\s+/);
    const typedWords = typedText.trim().split(/\s+/);
    
    let report = [];
    let fullErrors = 0;
    const maxLen = Math.max(originalWords.length, typedWords.length);

    for (let i = 0; i < maxLen; i++) {
      const ori = originalWords[i] || null;
      const typ = typedWords[i] || null;

      if (ori && typ) {
        if (clean(ori) === clean(typ)) {
          report.push({ type: 'correct', word: typ });
        } else {
          report.push({ type: 'wrong', word: typ, original: ori });
          fullErrors++;
        }
      } else if (ori && !typ) {
        report.push({ type: 'missing', word: `(${ori})` });
        fullErrors++;
      } else if (!ori && typ) {
        report.push({ type: 'extra', word: typ });
        fullErrors++;
      }
    }

    const errPercent = ((fullErrors / originalWords.length) * 100).toFixed(2);
    setStats({
      errors: fullErrors,
      percentage: errPercent,
      status: errPercent <= activeDoc.errorLimit ? 'QUALIFIED ✅' : 'DISQUALIFIED ❌'
    });
    setComparisonData(report);
    setView('result');
  };

  const handleAdminUpload = async (e) => {
    e.preventDefault();
    if (!audioFile) return alert("Select MP3!");
    setUploading(true);
    try {
      const sRef = ref(storage, `audios/${Date.now()}_${audioFile.name}`);
      const uploadTask = await uploadBytesResumable(sRef, audioFile);
      const url = await getDownloadURL(uploadTask.ref);
      await addDoc(collection(db, "dictations"), { ...adminForm, audioUrl: url, createdAt: serverTimestamp(), allowedTime: Number(adminForm.time), errorLimit: Number(adminForm.errorLimit) });
      alert("Dictation Published Successfully!"); setShowAdmin(false);
    } catch (err) { alert(err.message); }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      <header className="bg-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <h1 onClick={() => setView('home')} className="text-2xl font-black text-blue-700 italic cursor-pointer tracking-tighter uppercase">StenoPulse</h1>
        <div className="flex items-center gap-2">
          {!user && <button onClick={loginWithGoogle} className="text-xs font-bold text-blue-600 border border-blue-600 px-3 py-1 rounded-lg">Login</button>}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-xl font-bold text-slate-400">⋮</button>
        </div>
        {isMenuOpen && (
          <div className="absolute right-4 top-14 bg-white shadow-2xl rounded-2xl py-3 w-52 border z-[100]">
            {user && <div className="px-5 py-2 text-[10px] font-black text-gray-400 uppercase border-b mb-2 truncate">{user.displayName}</div>}
            {isAdmin && <button onClick={() => {setShowAdmin(true); setIsMenuOpen(false);}} className="w-full text-left px-5 py-3 text-green-600 font-bold hover:bg-green-50">🛠 Admin Panel</button>}
            {user && <button onClick={() => {signOut(auth); setIsMenuOpen(false);}} className="w-full text-left px-5 py-3 text-red-500 font-semibold">Logout</button>}
          </div>
        )}
      </header>

      <div className="max-w-3xl mx-auto p-4">
        {view === 'home' && (
          <div className="grid grid-cols-2 gap-4 mt-8 animate-in fade-in zoom-in duration-300">
            {siteConfig.categories.map(c => (
              <div key={c.id} onClick={() => {setSelectedCat(c); setView('list');}} className="bg-white p-10 rounded-[2.5rem] shadow-sm border-b-4 border-blue-200 text-center cursor-pointer active:scale-95 transition-all">
                <span className="text-5xl">{c.icon}</span>
                <h2 className="font-black mt-4 uppercase text-[10px] tracking-widest text-slate-600">{c.name}</h2>
              </div>
            ))}
          </div>
        )}

        {view === 'list' && (
          <div className="animate-in slide-in-from-right duration-300">
            <button onClick={() => setView('home')} className="mb-6 font-black text-blue-600 text-[10px] uppercase tracking-widest flex items-center">← Back</button>
            <h2 className="text-3xl font-black uppercase italic mb-6 text-slate-800 border-l-8 border-blue-600 pl-4">{selectedCat.name}</h2>
            {dictations.length > 0 ? dictations.map(d => (
              <div key={d.id} onClick={() => {setActiveDoc(d); setTimeLeft(d.allowedTime * 60); setTypedText(''); setView('typing');}} className="bg-white p-6 rounded-3xl mb-4 shadow-sm border flex justify-between items-center cursor-pointer hover:border-blue-500 transition-all">
                <div><h3 className="font-black text-slate-700">{d.title}</h3><p className="text-[10px] font-bold text-slate-400 uppercase">{d.allowedTime} MINS | {d.errorLimit}% LIMIT</p></div>
                <span className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase italic">Start</span>
              </div>
            )) : <div className="text-center py-20 text-slate-300 font-black italic uppercase">No Dictations Yet</div>}
          </div>
        )}

        {view === 'typing' && (
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border-t-8 border-blue-600">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-blue-700 uppercase tracking-tighter">{activeDoc.title}</h2>
              <div className="bg-red-500 text-white px-5 py-2 rounded-2xl font-black text-xl shadow-lg animate-pulse">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <audio src={activeDoc.audioUrl} controls className="w-full mb-8 shadow-inner rounded-xl" />
            <textarea autoFocus className="w-full h-96 bg-slate-50 p-6 rounded-3xl border-2 outline-none focus:border-blue-500 font-medium text-lg leading-relaxed shadow-inner" placeholder="Start transcribing..." value={typedText} onChange={(e) => setTypedText(e.target.value)} />
            <button onClick={finishTest} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black mt-8 uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Submit Exam</button>
          </div>
        )}

        {view === 'result' && (
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl animate-in zoom-in duration-500">
            <h2 className={`text-4xl font-black mb-4 text-center ${stats.status.includes('QUALIFIED') ? 'text-green-600' : 'text-red-600'}`}>{stats.status}</h2>
            <div className="grid grid-cols-3 gap-3 mb-10">
              <div className="bg-slate-50 p-4 rounded-2xl text-center shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase">Errors</p><p className="text-xl font-black">{stats.errors}</p></div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase">Mistake %</p><p className="text-xl font-black">{stats.percentage}%</p></div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase">Limit</p><p className="text-xl font-black text-blue-600">{activeDoc.errorLimit}%</p></div>
            </div>
            
            <div className="border-t pt-8">
              <h3 className="font-black uppercase tracking-widest text-slate-300 text-[10px] mb-6 text-center italic">Detailed Comparison Report</h3>
              <div className="bg-slate-50 p-8 rounded-[2rem] leading-[3] font-medium text-lg text-justify shadow-inner border border-slate-100 overflow-hidden">
                {comparisonData.map((item, idx) => (
                  <span key={idx} className="inline-block mr-2">
                    {item.type === 'correct' && <span className="text-green-600">{item.word}</span>}
                    {item.type === 'wrong' && <span className="text-red-700 font-black border-b-2 border-red-200">{item.word}</span>}
                    {item.type === 'missing' && <span className="text-slate-900 font-black opacity-100 bg-slate-200 px-1 rounded">{item.word}</span>}
                    {item.type === 'extra' && <span className="text-blue-600 font-bold underline decoration-wavy decoration-blue-300">{item.word}</span>}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => setView('home')} className="w-full mt-12 bg-slate-100 py-4 rounded-2xl text-slate-600 font-black uppercase text-[10px] tracking-widest">Return to Dashboard</button>
          </div>
        )}
      </div>

      {/* ADMIN PANEL MODAL */}
      {showAdmin && (
        <div className="fixed inset-0 bg-black/90 z-[200] p-6 overflow-y-auto backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative border-t-8 border-green-500">
            <h2 className="text-2xl font-black mb-8 uppercase italic tracking-tighter">Admin Control</h2>
            <form onSubmit={handleAdminUpload} className="space-y-4">
              <input type="text" placeholder="Exercise Title (e.g. KC No. 1)" className="w-full border-2 border-slate-50 p-4 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none" value={adminForm.title} onChange={e=>setAdminForm({...adminForm, title: e.target.value})} required />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2 rounded-2xl"><label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Time (Min)</label>
                <input type="number" className="w-full bg-transparent p-2 font-bold outline-none" value={adminForm.time} onChange={e=>setAdminForm({...adminForm, time: e.target.value})} required /></div>
                <div className="bg-slate-50 p-2 rounded-2xl"><label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Error Limit %</label>
                <input type="number" className="w-full bg-transparent p-2 font-bold outline-none" value={adminForm.errorLimit} onChange={e=>setAdminForm({...adminForm, errorLimit: e.target.value})} required /></div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-[10px] font-black text-slate-400 mb-2 uppercase italic">Select MP3 Audio</p>
                <input type="file" accept="audio/*" className="w-full text-xs font-bold" onChange={e=>setAudioFile(e.target.files[0])} required />
              </div>
              <textarea placeholder="Paste Original Text Matter Here..." className="w-full border-2 border-slate-50 p-5 rounded-2xl h-60 font-medium bg-slate-50 focus:bg-white outline-none" value={adminForm.text} onChange={e=>setAdminForm({...adminForm, text: e.target.value})} required />
              <button disabled={uploading} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase shadow-xl active:scale-95 transition-all">
                {uploading ? "Uploading Audio..." : "Publish Dictation"}
              </button>
            </form>
            <button onClick={() => setShowAdmin(false)} className="w-full mt-6 text-slate-300 font-black text-[10px] tracking-widest uppercase">Close Panel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
