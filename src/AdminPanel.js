import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { siteConfig } from './config';

const AdminPanel = ({ setShowAdmin, user }) => {
  const [activeTab, setActiveTab] = useState('upload'); 
  const [form, setForm] = useState({ 
    title: '', cat: 'kc', text: '', time: 10, errorLimit: 8, audioUrl: '', 
    year: '2026', month: 'January', status: 'published' 
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyMsg, setReplyMsg] = useState({ id: '', text: '' });

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

  // 📝 PUBLISH / UPDATE LOGIC
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
        alert("Updated Successfully! ✅");
      } else {
        await addDoc(collection(db, "dictations"), { ...data, createdAt: serverTimestamp() });
        alert(form.status === 'draft' ? "Saved as Draft! 📁" : "Published Live! 🚀");
      }
      setForm({ title: '', cat: 'kc', text: '', time: 10, errorLimit: 8, audioUrl: '', year: '2026', month: 'January', status: 'published' });
      setEditId(null);
      setActiveTab('manage');
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  // 💬 REPLY TO USER
  const sendReply = async (msgId) => {
    if (!replyMsg.text) return;
    try {
      await updateDoc(doc(db, "messages", msgId), {
        replyText: replyMsg.text,
        replyTime: new Date(),
        read: true
      });
      alert("Reply Sent! 📩");
      setMessages(messages.map(m => m.id === msgId ? { ...m, replyText: replyMsg.text } : m));
      setReplyMsg({ id: '', text: '' });
    } catch (e) { alert(e.message); }
  };

  // 🗑️ DELETE HANDLER
  const deleteItem = async (col, id) => {
    if (window.confirm("Kyan aap ise pakka delete karna chahte hain?")) {
      await deleteDoc(doc(db, col, id));
      if (col === 'dictations') setDictations(dictations.filter(d => d.id !== id));
      if (col === 'messages') setMessages(messages.filter(m => m.id !== id));
      if (col === 'results') setAllResults(allResults.filter(r => r.id !== id));
      alert("Deleted! 🗑️");
    }
  };

  // 🚫 BLOCK / UNBLOCK
  const toggleBlock = async (p) => {
    const newStatus = !p.isBlocked;
    await updateDoc(doc(db, "users", p.id), { isBlocked: newStatus });
    setProfiles(profiles.map(user => user.id === p.id ? { ...user, isBlocked: newStatus } : user));
    alert(newStatus ? "User Blocked! 🚫" : "User Unblocked! ✅");
  };

  const startEdit = (d) => {
    setForm({ 
      title: d.title, cat: d.cat, text: d.text, time: d.allowedTime, 
      errorLimit: d.errorLimit, audioUrl: d.audioUrl, 
      year: d.year || '2026', month: d.month || 'January', status: d.status || 'published' 
    });
    setEditId(d.id);
    setActiveTab('upload');
  };

  // SEARCH FILTERS
  const filteredProfiles = profiles.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredResults = allResults.filter(r => r.userName?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[500] p-2 md:p-6 flex items-center justify-center overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[2.5rem] shadow-2xl relative border-t-8 border-blue-600 flex flex-col h-[90vh]">
        
        {/* TOP NAV */}
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar border-b dark:border-slate-800 shrink-0">
          {[
            {id:'upload', n:'Upload', c:'bg-green-500'},
            {id:'manage', n:'Manage', c:'bg-amber-500'},
            {id:'results', n:'Results', c:'bg-blue-600'},
            {id:'profiles', n:'Students', c:'bg-purple-600'},
            {id:'messages', n:'Inbox', c:'bg-red-500'}
          ].map(t => (
            <button key={t.id} onClick={() => {setActiveTab(t.id); setSearchQuery('');}} className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${activeTab === t.id ? `${t.c} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              {t.n}
            </button>
          ))}
          <button onClick={() => setShowAdmin(false)} className="ml-auto bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black">Exit ✕</button>
        </div>

        {/* SEARCH BAR */}
        {['results', 'profiles'].includes(activeTab) && (
          <div className="px-6 pt-4">
            <input type="text" placeholder="Search by name..." className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-xs font-bold dark:text-white outline-none border-2 border-transparent focus:border-blue-600" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          
          {/* 1. UPLOAD FORM */}
          {activeTab === 'upload' && (
            <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-blue-600 font-black uppercase text-xs italic">{editId ? 'Edit Mode' : 'New Test'}</h3>
                <input type="text" placeholder="Title" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl dark:text-white font-bold outline-none" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required />
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white outline-none" value={form.cat} onChange={e=>setForm({...form, cat: e.target.value})}>
                    <option value="kc">📘 KC Magazine</option>
                    <option value="prog">📈 Progressive</option>
                    <option value="speed">⚡ Speedography</option>
                    <option value="misc">📁 Miscellaneous</option>
                  </select>
                  <select className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white outline-none" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
                    <option value="published">🚀 Live Now</option>
                    <option value="draft">📁 Save Draft</option>
                  </select>
                </div>

                {form.cat === 'prog' && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <select className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl font-bold dark:text-white" value={form.year} onChange={e=>setForm({...form, year: e.target.value})}>
                      {siteConfig.categories.find(c => c.id === 'prog')?.years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl font-bold dark:text-white" value={form.month} onChange={e=>setForm({...form, month: e.target.value})}>
                      {siteConfig.categories.find(c => c.id === 'prog')?.months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Min" className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white" value={form.time} onChange={e=>setForm({...form, time: e.target.value})} />
                  <input type="number" placeholder="Error %" className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white" value={form.errorLimit} onChange={e=>setForm({...form, errorLimit: e.target.value})} />
                </div>
                <input type="url" placeholder="Audio URL" className="w-full bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl font-bold dark:text-white" value={form.audioUrl} onChange={e=>setForm({...form, audioUrl: e.target.value})} required />
              </div>
              <div className="flex flex-col">
                <textarea placeholder="Paste Text Matter..." className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl flex-1 font-medium dark:text-white min-h-[200px] outline-none" value={form.text} onChange={e=>setForm({...form, text: e.target.value})} required />
                <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase mt-4 shadow-xl active:scale-95 transition-all">
                  {loading ? 'Wait...' : (editId ? 'Update Test' : 'Publish Test')}
                </button>
              </div>
            </form>
          )}

          {/* 2. MANAGE TAB */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              {dictations.map(d => (
                <div key={d.id} className={`bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex justify-between items-center border-l-4 ${d.status === 'draft' ? 'border-amber-500' : 'border-green-500'}`}>
                  <div>
                    <p className="font-black dark:text-white uppercase italic text-sm">{d.title} {d.status === 'draft' && <span className="text-[7px] bg-amber-500 text-white px-2 py-0.5 rounded ml-1">DRAFT</span>}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{d.cat} | {d.year || ''} {d.month || ''} | {d.allowedTime} Mins</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(d)} className="bg-blue-100 text-blue-600 p-2 rounded-lg text-[9px] font-black uppercase">Edit</button>
                    <button onClick={() => deleteItem('dictations', d.id)} className="bg-red-100 text-red-600 p-2 rounded-lg text-[9px] font-black uppercase">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. INBOX WITH REPLY */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              {messages.map(m => (
                <div key={m.id} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-[2rem] border-l-8 border-red-500 relative group">
                  <button onClick={() => deleteItem('messages', m.id)} className="absolute top-4 right-4 text-red-500 font-bold text-[8px] uppercase">Delete</button>
                  <div className="flex justify-between mb-2">
                    <span className="font-black text-xs dark:text-white uppercase">{m.sender}</span>
                    <span className="text-[8px] text-slate-400">{m.time?.toDate().toLocaleString()}</span>
                  </div>
                  <p className="text-sm dark:text-slate-300 italic">"{m.text}"</p>
                  
                  {/* Reply UI */}
                  <div className="mt-4 pt-4 border-t dark:border-slate-700">
                    {m.replyText ? (
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="text-[8px] font-black text-blue-600 uppercase mb-1">Your Reply:</p>
                        <p className="text-xs dark:text-white">{m.replyText}</p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input type="text" placeholder="Type reply..." className="flex-1 bg-white dark:bg-slate-700 p-2 rounded-lg text-xs dark:text-white outline-none" value={replyMsg.id === m.id ? replyMsg.text : ''} onChange={e => setReplyMsg({ id: m.id, text: e.target.value })} />
                        <button onClick={() => sendReply(m.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[9px] font-black">Reply</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. STUDENTS */}
          {activeTab === 'profiles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProfiles.map(p => (
                <div key={p.id} className={`bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border ${p.isBlocked ? 'border-red-500' : 'dark:border-slate-700'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black uppercase text-blue-600">{p.name || 'Student'}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{p.email}</p>
                    </div>
                    <button onClick={() => toggleBlock(p)} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${p.isBlocked ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {p.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[9px] font-bold text-slate-500 uppercase">
                    <span>📞 {p.phone || 'N/A'}</span><span>📍 {p.city || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. RESULTS TABLE */}
          {activeTab === 'results' && (
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="text-[9px] font-black text-slate-400 uppercase border-b dark:border-slate-800">
                    <tr><th className="p-3">Student</th><th className="p-3">Exercise</th><th className="p-3">Error</th><th className="p-3 text-right">Action</th></tr>
                  </thead>
                  <tbody>
                    {filteredResults.map(rec => (
                      <tr key={rec.id} className="text-xs border-b dark:border-slate-800 group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold dark:text-white">{rec.userName}</td>
                        <td className="p-3 text-slate-500 uppercase text-[10px]">{rec.exerciseTitle}</td>
                        <td className="p-3 font-black text-blue-600">{rec.errorPercent}%</td>
                        <td className="p-3 text-right">
                          <button onClick={() => deleteItem('results', rec.id)} className="text-red-500 font-bold uppercase text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
