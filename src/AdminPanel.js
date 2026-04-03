import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, updateDoc, deleteDoc, setDoc, onSnapshot } from "firebase/firestore";
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
      setForm({ title: '', cat: 'kc', text: '', time: 10, errorLimit: 8, audioUrl: '', year: '2026', month: 'January', status: 'published' });
      setEditId(null);
      setActiveTab('manage');
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  };

  // 🗑️ GLOBAL DELETE HANDLER (Fixed Permission Issues)
  const deleteRecord = async (col, id) => {
    if (window.confirm("Confirm Permanent Deletion?")) {
      try {
        await deleteDoc(doc(db, col, id));
        alert("Deleted Successfully! 🗑️");
      } catch (e) { alert("Permission Error: Please check Firebase Rules or try again."); }
    }
  };

  // 📢 ANNOUNCEMENT HANDLERS
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
      year: d.year || '2026', month: d.month || 'January', status: d.status || 'published' 
    });
    setEditId(d.id);
    setActiveTab('upload');
  };

  const exportResults = () => {
    const csvContent = "data:text/csv;charset=utf-8," + "Student,Exercise,Error %,Status\n" + 
      allResults.map(r => `${r.userName},${r.exerciseTitle},${r.errorPercent}%,${r.status}`).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "steno_results.csv");
    link.click();
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
          <button onClick={() => setShowAdmin(false)} className="ml-auto bg-red-500 text-white px-4 py-2 rounded-xl text-[9px] font-bold">EXIT ✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {/* 1. UPLOAD (Now with Time & Error Fields) */}
          {activeTab === 'upload' && (
            <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <div className="space-y-4">
                <h3 className="text-blue-600 font-black uppercase text-xs italic">{editId ? 'Modify Assignment' : 'Create New Test'}</h3>
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
                <input type="url" placeholder="Audio URL" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl dark:text-white font-bold" value={form.audioUrl} onChange={e=>setForm({...form, audioUrl: e.target.value})} required />
              </div>
              <div className="flex flex-col">
                <textarea placeholder="Paste Content..." className="w-full bg-slate-100 dark:bg-slate-800 p-5 rounded-3xl flex-1 dark:text-white font-medium outline-none border-2 border-transparent focus:border-blue-600" value={form.text} onChange={e=>setForm({...form, text: e.target.value})} required />
                <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase mt-4 shadow-xl">
                  {loading ? 'Processing...' : (editId ? 'Commit Update' : 'Publish Deployment')}
                </button>
              </div>
            </form>
          )}

          {/* 2. INVENTORY (Drafts & Live List) */}
          {activeTab === 'manage' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dictations.map(d => (
                <div key={d.id} className={`p-5 rounded-3xl border ${d.status === 'draft' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10' : 'bg-slate-50 dark:bg-slate-800 border-slate-200'} flex justify-between items-center`}>
                  <div>
                    <h4 className="font-black dark:text-white uppercase text-sm">{d.title} {d.status === 'draft' && '📂'}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{d.cat} | {d.year || 'Standard'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(d)} className="p-2 bg-blue-600 text-white rounded-lg text-[9px] font-bold">EDIT</button>
                    <button onClick={() => deleteRecord('dictations', d.id)} className="p-2 bg-red-500 text-white rounded-lg text-[9px] font-bold">DEL</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. ANALYSIS & EXPORT */}
          {activeTab === 'results' && (
             <div className="flex flex-col">
               <div className="flex justify-between items-center mb-4">
                  <input type="text" placeholder="Search Students..." className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-xs font-bold dark:text-white w-64" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <button onClick={exportResults} className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">📊 Export CSV</button>
               </div>
               <div className="overflow-x-auto rounded-3xl border dark:border-slate-800">
                 <table className="w-full text-left bg-white dark:bg-slate-900">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[9px] font-black text-slate-400 uppercase">
                      <tr><th className="p-4">Student</th><th className="p-4">Exercise</th><th className="p-4">Error</th><th className="p-4 text-right">Action</th></tr>
                    </thead>
                    <tbody>
                      {allResults.filter(r => r.userName?.toLowerCase().includes(searchQuery.toLowerCase())).map(rec => (
                        <tr key={rec.id} className="text-xs border-b dark:border-slate-800">
                          <td className="p-4 font-bold dark:text-white">{rec.userName}</td>
                          <td className="p-4 text-slate-500 uppercase">{rec.exerciseTitle}</td>
                          <td className="p-4 font-black text-blue-600">{rec.errorPercent}%</td>
                          <td className="p-4 text-right"><button onClick={() => deleteRecord('results', rec.id)} className="text-red-500 font-bold uppercase text-[9px]">Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
             </div>
          )}

          {/* 4. SUPPORT (Messages with Reply) */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              {messages.map(m => (
                <div key={m.id} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem] relative group border dark:border-slate-700">
                  <div className="flex justify-between mb-2">
                    <span className="font-black text-xs text-blue-600 uppercase">{m.sender}</span>
                    <button onClick={() => deleteRecord('messages', m.id)} className="text-red-500 text-[9px] font-bold">DELETE</button>
                  </div>
                  <p className="text-sm dark:text-slate-200 italic mb-4">"{m.text}"</p>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type reply..." className="flex-1 bg-white dark:bg-slate-700 p-2 rounded-xl text-xs dark:text-white outline-none" value={replyMsg.id === m.id ? replyMsg.text : ''} onChange={e => setReplyMsg({ id: m.id, text: e.target.value })} />
                    <button onClick={async () => {
                      await updateDoc(doc(db, "messages", m.id), { replyText: replyMsg.text, read: true });
                      alert("Reply Dispatched!");
                      setReplyMsg({ id: '', text: '' });
                    }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black">REPLY</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. NOTICES */}
          {activeTab === 'notice' && (
            <div className="max-w-xl mx-auto space-y-6 text-center py-10">
              <h3 className="font-black uppercase text-sm tracking-widest text-blue-600">Global Announcement Hub</h3>
              <textarea placeholder="Urgent message for all students..." className="w-full h-32 bg-slate-100 dark:bg-slate-800 p-5 rounded-3xl dark:text-white outline-none border-2 border-transparent focus:border-blue-600" value={announcement} onChange={e=>setAnnouncement(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={postNotice} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg">Broadcast</button>
                <button onClick={clearNotice} className="bg-red-500 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg">Clear</button>
              </div>
            </div>
          )}

          {/* 6. USERS */}
          {activeTab === 'profiles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map(p => (
                <div key={p.id} className={`p-5 rounded-3xl border ${p.isBlocked ? 'border-red-500 bg-red-50' : 'dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black uppercase text-blue-600 text-sm">{p.name || 'Anonymous'}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase italic">{p.email}</p>
                    </div>
                    <button onClick={async () => {
                      const newStatus = !p.isBlocked;
                      await updateDoc(doc(db, "users", p.id), { isBlocked: newStatus });
                    }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${p.isBlocked ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                      {p.isBlocked ? 'Restore' : 'Block'}
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
