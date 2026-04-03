import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, updateDoc, deleteDoc, setDoc, onSnapshot } from "firebase/firestore";
import { siteConfig } from './config';

const AdminPanel = ({ setShowAdmin }) => {
  const [activeTab, setActiveTab] = useState('upload'); 
  const [form, setForm] = useState({ 
    title: '', cat: 'kc', text: '', time: 10, errorLimit: 8, audioUrl: '', 
    year: '2026', month: 'January', status: 'published',
    type: 'steno' // 🆕 New Field: steno or typing
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyMsg, setReplyMsg] = useState({ id: '', text: '' });
  const [announcement, setAnnouncement] = useState('');

  const [allResults, setAllResults] = useState([]);
  const [dictations, setDictations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState([]);

  // 📡 REAL-TIME DATA FETCHING
  useEffect(() => {
    const unsubResults = onSnapshot(query(collection(db, "results"), orderBy("submittedAt", "desc")), (snap) => {
      setAllResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubDicts = onSnapshot(query(collection(db, "dictations"), orderBy("createdAt", "desc")), (snap) => {
      setDictations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubMsgs = onSnapshot(query(collection(db, "messages"), orderBy("time", "desc")), (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubNotice = onSnapshot(doc(db, "settings", "announcement"), (doc) => {
      if (doc.exists()) setAnnouncement(doc.data().text);
    });

    return () => { unsubResults(); unsubDicts(); unsubMsgs(); unsubUsers(); unsubNotice(); };
  }, []);

  // 📝 PUBLISH / DRAFT LOGIC
  const handlePublish = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        ...form, 
        allowedTime: Number(form.time), 
        errorLimit: Number(form.errorLimit), 
        updatedAt: serverTimestamp() 
      };
      if (editId) {
        await updateDoc(doc(db, "dictations", editId), payload);
        alert("Update Successful! ✅");
      } else {
        await addDoc(collection(db, "dictations"), { ...payload, createdAt: serverTimestamp() });
        alert(form.status === 'draft' ? "Stored in Drafts ✅" : "Published Live 🚀");
      }
      setForm({ title: '', cat: 'kc', text: '', time: 10, errorLimit: 8, audioUrl: '', year: '2026', month: 'January', status: 'published', type: 'steno' });
      setEditId(null);
      setActiveTab('manage');
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  };

  const deleteRecord = async (col, id) => {
    if (window.confirm("Confirm Permanent Deletion?")) {
      try {
        await deleteDoc(doc(db, col, id));
        alert("Deleted Successfully! 🗑️");
      } catch (e) { alert("Permission Error!"); }
    }
  };

  const postNotice = async () => {
    await setDoc(doc(db, "settings", "announcement"), { text: announcement, updatedAt: new Date() });
    alert("Notice Broadcasted!");
  };

  const clearNotice = async () => {
    await setDoc(doc(db, "settings", "announcement"), { text: "", updatedAt: new Date() });
    setAnnouncement("");
    alert("Notice Removed!");
  };

  const startEdit = (d) => {
    setForm({ 
      title: d.title, cat: d.cat, text: d.text, time: d.allowedTime || d.time, 
      errorLimit: d.errorLimit, audioUrl: d.audioUrl, 
      year: d.year || '2026', month: d.month || 'January', status: d.status || 'published',
      type: d.type || 'steno'
    });
    setEditId(d.id);
    setActiveTab('upload');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl z-[500] p-2 md:p-4 flex items-center justify-center overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[92vh] rounded-[2.5rem] shadow-2xl flex flex-col border dark:border-slate-800 overflow-hidden">
        
        {/* NAV BAR */}
        <div className="flex gap-2 p-4 border-b dark:border-slate-800 overflow-x-auto no-scrollbar bg-slate-50 dark:bg-slate-800/40">
          {[
            {id:'upload', n:'Deployment'}, {id:'manage', n:'Inventory'}, 
            {id:'results', n:'Analysis'}, {id:'profiles', n:'Users'}, 
            {id:'messages', n:'Support'}, {id:'notice', n:'Notices'}
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-5 py-2.5 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              {t.n}
            </button>
          ))}
          <button onClick={() => setShowAdmin(false)} className="ml-auto bg-red-500 text-white px-4 py-2 rounded-xl text-[9px] font-black">EXIT ✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {/* 1. DEPLOYMENT HUB */}
          {activeTab === 'upload' && (
            <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <div className="space-y-4">
                <h3 className="text-blue-600 font-black uppercase text-xs italic">{editId ? 'Modify Assignment' : 'Create New Test'}</h3>
                
                {/* 🆕 TEST TYPE SELECTION */}
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <button type="button" onClick={()=>setForm({...form, type: 'steno'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${form.type === 'steno' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>🎙️ Steno Hub</button>
                    <button type="button" onClick={()=>setForm({...form, type: 'typing'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${form.type === 'typing' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400'}`}>⌨️ Typing Arena</button>
                </div>

                <input type="text" placeholder="Entry Title" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl dark:text-white font-bold outline-none border-2 border-transparent focus:border-blue-600" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required />
                
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white" value={form.cat} onChange={e=>setForm({...form, cat: e.target.value})}>
                    <option value="kc">KC Magazine</option>
                    <option value="prog">Progressive</option>
                    <option value="speed">Speedography</option>
                    <option value="misc">Miscellaneous</option>
                  </select>
                  <select className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 p-4 rounded-2xl font-bold" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
                    <option value="published">Status: Live</option>
                    <option value="draft">Status: Draft</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-bold text-slate-400 ml-2 uppercase">Time (Mins)</label>
                    <input type="number" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white" value={form.time} onChange={e=>setForm({...form, time: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-slate-400 ml-2 uppercase">Max Error %</label>
                    <input type="number" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white" value={form.errorLimit} onChange={e=>setForm({...form, errorLimit: e.target.value})} />
                  </div>
                </div>

                {/* Audio URL only for Steno */}
                <div className={form.type === 'typing' ? 'opacity-30 pointer-events-none' : ''}>
                    <label className="text-[8px] font-bold text-slate-400 ml-2 uppercase">Audio URL (Only for Steno)</label>
                    <input type="url" placeholder="Audio Stream URL" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl dark:text-white font-bold" value={form.audioUrl} onChange={e=>setForm({...form, audioUrl: e.target.value})} required={form.type === 'steno'} />
                </div>
              </div>
              <div className="flex flex-col">
                <textarea placeholder="Paste Content Matter..." className="w-full bg-slate-100 dark:bg-slate-800 p-5 rounded-3xl flex-1 dark:text-white font-medium outline-none border-2 border-transparent focus:border-blue-600" value={form.text} onChange={e=>setForm({...form, text: e.target.value})} required />
                <button className={`w-full text-white py-5 rounded-2xl font-black uppercase mt-4 shadow-xl ${form.type === 'steno' ? 'bg-blue-600' : 'bg-green-600'}`}>
                  {loading ? 'Processing...' : (editId ? 'Commit Update' : 'Launch Assignment')}
                </button>
              </div>
            </form>
          )}

          {/* 2. INVENTORY (Steno vs Typing Icons) */}
          {activeTab === 'manage' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dictations.map(d => (
                <div key={d.id} className={`p-5 rounded-3xl border ${d.status === 'draft' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200' : 'bg-slate-50 dark:bg-slate-800 border-slate-200'} flex justify-between items-center`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{d.type === 'typing' ? '⌨️' : '🎙️'}</span>
                    <div>
                        <h4 className="font-black dark:text-white uppercase text-xs">{d.title}</h4>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">{d.cat} | {d.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(d)} className="p-2 bg-blue-600 text-white rounded-lg text-[8px] font-bold">EDIT</button>
                    <button onClick={() => deleteRecord('dictations', d.id)} className="p-2 bg-red-500 text-white rounded-lg text-[8px] font-bold">DEL</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ANALYSIS, SUPPORT, NOTICES, PROFILES (Same as before) */}
          {/* ... Rest of your tabs code here ... */}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
