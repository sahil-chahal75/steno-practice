import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { siteConfig } from './config';

const AdminPanel = ({ setShowAdmin }) => {
  const [activeTab, setActiveTab] = useState('upload'); 
  const [form, setForm] = useState({ 
    title: '', cat: 'kc', text: '', time: 10, errorLimit: 8, audioUrl: '', 
    year: '2026', month: 'January', status: 'published' 
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

  // 📡 DATA FETCHING ENGINE
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === 'results') {
          const q = query(collection(db, "results"), orderBy("submittedAt", "desc"));
          const snap = await getDocs(q);
          setAllResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        if (activeTab === 'manage') {
          const q = query(collection(db, "dictations"), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          setDictations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        if (activeTab === 'messages') {
          const q = query(collection(db, "messages"), orderBy("time", "desc"));
          const snap = await getDocs(q);
          setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        if (activeTab === 'profiles') {
          const snap = await getDocs(collection(db, "users"));
          setProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (e) { console.error("Fetch Error:", e); }
    };
    fetchData();
  }, [activeTab]);

  // 📝 PUBLISH / DRAFT LOGIC
  const handlePublish = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { 
        ...form, 
        allowedTime: Number(form.time), 
        errorLimit: Number(form.errorLimit), 
        updatedAt: serverTimestamp() 
      };
      if (editId) {
        await updateDoc(doc(db, "dictations", editId), data);
        alert("Record updated successfully!");
      } else {
        await addDoc(collection(db, "dictations"), { ...data, createdAt: serverTimestamp() });
        alert(form.status === 'draft' ? "Stored in Drafts Folder ✅" : "Test Published Live 🚀");
      }
      setForm({ title: '', cat: 'kc', text: '', time: 10, errorLimit: 8, audioUrl: '', year: '2026', month: 'January', status: 'published' });
      setEditId(null);
      setActiveTab('manage');
    } catch (err) { alert("Operation Failed: " + err.message); }
    setLoading(false);
  };

  // 🗑️ DELETE HANDLER (FIXED)
  const deleteItem = async (col, id) => {
    if (window.confirm("Permanent Action: Are you sure you want to delete this record?")) {
      try {
        await deleteDoc(doc(db, col, id));
        if (col === 'dictations') setDictations(prev => prev.filter(d => d.id !== id));
        if (col === 'messages') setMessages(prev => prev.filter(m => m.id !== id));
        if (col === 'results') setAllResults(prev => prev.filter(r => r.id !== id));
        alert("Record purged from database.");
      } catch (e) { alert("Delete Error: " + e.message); }
    }
  };

  // 📊 EXCEL EXPORT TOOL (CSV Format)
  const exportToExcel = () => {
    const headers = ["Student Name,Exercise,Errors,Status,Date\n"];
    const rows = allResults.map(r => 
      `${r.userName},${r.exerciseTitle},${r.errorPercent}%,${r.status},${r.submittedAt?.toDate().toLocaleDateString()}\n`
    );
    const blob = new Blob([headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StenoPulse_Results_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  // 📢 ANNOUNCEMENT TOOL
  const postNotice = async () => {
    if (!announcement) return;
    await setDoc(doc(db, "settings", "announcement"), { text: announcement, updatedAt: new Date() });
    alert("Announcement broadcasted!");
  };

  const toggleBlock = async (p) => {
    const newStatus = !p.isBlocked;
    await updateDoc(doc(db, "users", p.id), { isBlocked: newStatus });
    setProfiles(profiles.map(user => user.id === p.id ? { ...user, isBlocked: newStatus } : user));
  };

  const filteredProfiles = profiles.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredResults = allResults.filter(r => r.userName?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[500] p-4 flex items-center justify-center overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[2rem] shadow-2xl relative flex flex-col h-[90vh] border border-slate-200 dark:border-slate-800">
        
        {/* DASHBOARD NAVIGATION */}
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar border-b dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800/50">
          {[
            {id:'upload', n:'Deployment Hub'}, {id:'manage', n:'Inventory'}, 
            {id:'results', n:'Analysis'}, {id:'profiles', n:'Users'}, 
            {id:'messages', n:'Support'}, {id:'notice', n:'Notices'}
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-5 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${activeTab === t.id ? `bg-blue-600 text-white shadow-lg` : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              {t.n}
            </button>
          ))}
          <button onClick={() => setShowAdmin(false)} className="ml-auto bg-red-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase">Exit ✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {/* 1. UPLOAD INTERFACE */}
          {activeTab === 'upload' && (
            <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
              <div className="space-y-5">
                <h3 className="text-blue-600 font-black uppercase text-xs tracking-tighter italic">{editId ? 'Modify Record' : 'Create New Assignment'}</h3>
                <input type="text" placeholder="Entry Title" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl dark:text-white font-bold outline-none border-2 border-transparent focus:border-blue-600" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required />
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white" value={form.cat} onChange={e=>setForm({...form, cat: e.target.value})}>
                    <option value="kc">KC Magazine</option>
                    <option value="prog">Progressive</option>
                  </select>
                  <select className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 p-4 rounded-2xl font-bold" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
                    <option value="published">Status: Live</option>
                    <option value="draft">Status: Draft</option>
                  </select>
                </div>
                {form.cat === 'prog' && (
                  <div className="grid grid-cols-2 gap-4">
                    <select className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl font-bold dark:text-white" value={form.year} onChange={e=>setForm({...form, year: e.target.value})}>
                      {siteConfig.categories.find(c => c.id === 'prog')?.years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl font-bold dark:text-white" value={form.month} onChange={e=>setForm({...form, month: e.target.value})}>
                      {siteConfig.categories.find(c => c.id === 'prog')?.months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                )}
                <input type="url" placeholder="Audio Cloud URL" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl dark:text-white font-bold" value={form.audioUrl} onChange={e=>setForm({...form, audioUrl: e.target.value})} required />
              </div>
              <div className="flex flex-col">
                <textarea placeholder="Paste Transcription Matter Here..." className="w-full bg-slate-100 dark:bg-slate-800 p-5 rounded-3xl flex-1 font-medium dark:text-white min-h-[250px] outline-none border-2 border-transparent focus:border-blue-600" value={form.text} onChange={e=>setForm({...form, text: e.target.value})} required />
                <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase mt-4 shadow-xl">
                  {loading ? 'Processing...' : (editId ? 'Commit Update' : 'Initialize Release')}
                </button>
              </div>
            </form>
          )}

          {/* 2. INVENTORY (DRAFTS & LIVE) */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Inventory</h3>
              </div>
              {dictations.map(d => (
                <div key={d.id} className={`p-5 rounded-2xl flex justify-between items-center border-l-8 ${d.status === 'draft' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500' : 'bg-slate-50 dark:bg-slate-800 border-green-500'}`}>
                  <div>
                    <p className="font-black dark:text-white uppercase text-sm">{d.title} {d.status === 'draft' && '📂'}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{d.cat} | {d.year || ''} | {d.status.toUpperCase()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(d)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase">Modify</button>
                    <button onClick={() => deleteItem('dictations', d.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase">Purge</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. ANALYSIS (EXCEL EXPORT) */}
          {activeTab === 'results' && (
             <div className="flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <input type="text" placeholder="Search result by name..." className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-xs font-bold dark:text-white w-64" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <button onClick={exportToExcel} className="bg-green-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">📊 Export to Excel</button>
               </div>
               <div className="overflow-x-auto rounded-2xl border dark:border-slate-800">
                 <table className="w-full text-left bg-white dark:bg-slate-900">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[9px] font-black text-slate-400 uppercase">
                      <tr><th className="p-4">Student</th><th className="p-4">Exercise</th><th className="p-4">Error</th><th className="p-4">Action</th></tr>
                    </thead>
                    <tbody>
                      {filteredResults.map(rec => (
                        <tr key={rec.id} className="text-xs border-b dark:border-slate-800">
                          <td className="p-4 font-bold dark:text-white">{rec.userName}</td>
                          <td className="p-4 text-slate-500">{rec.exerciseTitle}</td>
                          <td className="p-4 font-black text-blue-600">{rec.errorPercent}%</td>
                          <td className="p-4"><button onClick={() => deleteItem('results', rec.id)} className="text-red-500 font-bold uppercase text-[9px]">Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
             </div>
          )}

          {/* 4. NOTICES */}
          {activeTab === 'notice' && (
            <div className="max-w-xl mx-auto space-y-6 py-10">
              <h3 className="text-center font-black uppercase text-sm tracking-widest text-blue-600">Global Announcement Banner</h3>
              <textarea placeholder="Type urgent announcement here..." className="w-full h-32 bg-slate-100 dark:bg-slate-800 p-5 rounded-3xl dark:text-white outline-none border-2 border-transparent focus:border-blue-600" value={announcement} onChange={e=>setAnnouncement(e.target.value)} />
              <button onClick={postNotice} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg">Broadcast Announcement</button>
            </div>
          )}

          {/* 5. USER DIRECTORY */}
          {activeTab === 'profiles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProfiles.map(p => (
                <div key={p.id} className={`p-5 rounded-3xl border ${p.isBlocked ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black uppercase text-blue-600 text-sm">{p.name || 'Anonymous'}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase italic">{p.email}</p>
                    </div>
                    <button onClick={() => toggleBlock(p)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${p.isBlocked ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                      {p.isBlocked ? 'Authorize' : 'Restrict'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
