import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { siteConfig } from './config';

const AdminPanel = ({ setShowAdmin }) => {
  const [activeTab, setActiveTab] = useState('upload'); 
  const [managementMode, setManagementMode] = useState('steno'); 
  const [inventoryTab, setInventoryTab] = useState('published');
  
  const [form, setForm] = useState({ 
    title: '', cat: 'kc', text: '', time: 10, errorLimit: 8, audioUrl: '', 
    status: 'published', type: 'steno', year: '2026', month: 'January'
  });
  
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [replyMsg, setReplyMsg] = useState({ id: '', text: '' });

  const [allResults, setAllResults] = useState([]);
  const [dictations, setDictations] = useState([]);
  const [messages, setMessages] = useState([]);

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
    const unsubNotice = onSnapshot(doc(db, "settings", "announcement"), (doc) => {
      if (doc.exists()) setAnnouncement(doc.data().text);
    });
    return () => { unsubResults(); unsubDicts(); unsubNotice(); unsubMsgs(); };
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        ...form, 
        type: managementMode,
        allowedTime: Number(form.time), 
        updatedAt: serverTimestamp() 
      };

      // 🛡️ Logic: Steno vs Typing Payload Clean-up
      if (managementMode === 'steno') {
        payload.errorLimit = Number(form.errorLimit);
      } else {
        // Remove Steno-only fields for Typing Mode
        delete payload.errorLimit;
        delete payload.audioUrl;
      }

      // Remove Year/Month if not Progressive
      if (form.cat !== 'prog') {
        delete payload.year;
        delete payload.month;
      }

      if (editId) {
        await updateDoc(doc(db, "dictations", editId), payload);
        alert("Assignment Updated! ✅");
      } else {
        await addDoc(collection(db, "dictations"), { ...payload, createdAt: serverTimestamp() });
        alert(form.status === 'draft' ? "Saved to Drafts ✅" : "Launched to Public Folder 🚀");
      }
      resetForm();
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ title: '', cat: managementMode === 'steno' ? 'kc' : 'gen', text: '', time: 10, errorLimit: 8, audioUrl: '', status: 'published', type: managementMode, year: '2026', month: 'January' });
    setEditId(null);
  };

  const startEdit = (d) => {
    setManagementMode(d.type || 'steno');
    setForm({ ...d, time: d.allowedTime || 10, errorLimit: d.errorLimit || 8 });
    setEditId(d.id);
    setActiveTab('upload');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl z-[500] p-2 flex items-center justify-center overflow-hidden">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[95vh] rounded-[2.5rem] shadow-2xl flex flex-col border dark:border-slate-800">
        
        {/* TOP MODE SWITCHER */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-2 rounded-t-[2.5rem] border-b dark:border-slate-800">
          <button onClick={() => {setManagementMode('steno'); resetForm();}} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${managementMode === 'steno' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>🎙️ Steno Management</button>
          <button onClick={() => {setManagementMode('typing'); resetForm();}} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${managementMode === 'typing' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400'}`}>⌨️ Typing Management</button>
          <button onClick={() => setShowAdmin(false)} className="px-6 text-red-500 font-black text-xs">EXIT ✕</button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-800/30 border-b dark:border-slate-800 overflow-x-auto no-scrollbar">
          {[{id:'upload', n:'Deployment'}, {id:'manage', n:'Inventory'}, {id:'results', n:'Analysis'}, {id:'support', n:'Messages'}, {id:'notice', n:'Notices'}].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-5 py-2.5 rounded-xl font-bold uppercase text-[8px] tracking-widest transition-all ${activeTab === t.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-400'}`}>{t.n}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          
          {/* UPLOAD FORM SECTION */}
          {activeTab === 'upload' && (
            <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in">
              <div className="space-y-6">
                <h3 className={`text-[10px] font-black uppercase italic ${managementMode === 'steno' ? 'text-blue-600' : 'text-green-600'}`}>Configuration Hub: {managementMode}</h3>
                
                <input type="text" placeholder="Passage Title" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-blue-500" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required />
                
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl font-bold dark:text-white text-xs" value={form.cat} onChange={e=>setForm({...form, cat: e.target.value})}>
                    {managementMode === 'steno' ? (
                      <><option value="kc">KC Magazine</option><option value="prog">Progressive</option><option value="speed">Speedography</option><option value="misc">Miscellaneous</option></>
                    ) : (
                      <><option value="gen">General</option><option value="legal">Legal</option><option value="tech">Technology</option><option value="essay">Essay</option><option value="poly">Political</option><option value="misc_type">Misc</option></>
                    )}
                  </select>
                  <select className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl font-bold text-blue-600 text-xs" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
                    <option value="published">Status: Public</option>
                    <option value="draft">Status: Draft</option>
                  </select>
                </div>

                {/* Progressive Subfolders (Steno Only) */}
                {form.cat === 'prog' && managementMode === 'steno' && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <select className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl font-bold text-amber-600 text-xs" value={form.year} onChange={e=>setForm({...form, year: e.target.value})}>
                      {siteConfig.categories.find(c => c.id === 'prog')?.years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl font-bold text-amber-600 text-xs" value={form.month} onChange={e=>setForm({...form, month: e.target.value})}>
                      {siteConfig.categories.find(c => c.id === 'prog')?.months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                )}

                {/* 🎯 CONDITIONAL FIELDS: Only for Steno */}
                {managementMode === 'steno' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 ml-2 uppercase tracking-widest">Time (Min)</label>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl font-bold dark:text-white" value={form.time} onChange={e=>setForm({...form, time: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 ml-2 uppercase tracking-widest">Error Limit (%)</label>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl font-bold dark:text-white" value={form.errorLimit} onChange={e=>setForm({...form, errorLimit: e.target.value})} />
                      </div>
                    </div>
                    <input type="url" placeholder="Audio Streaming URL" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl font-bold dark:text-white" value={form.audioUrl} onChange={e=>setForm({...form, audioUrl: e.target.value})} required />
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <textarea placeholder="Paste matter content..." className="w-full bg-slate-50 dark:bg-slate-800 p-6 rounded-[2.5rem] flex-1 font-medium dark:text-white min-h-[350px] outline-none border-2 border-transparent focus:border-blue-500" value={form.text} onChange={e=>setForm({...form, text: e.target.value})} required />
                <button className={`w-full py-5 rounded-2xl font-black uppercase text-xs text-white shadow-xl mt-6 transition-all active:scale-95 ${managementMode === 'steno' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                    {loading ? 'Processing...' : (editId ? 'Commit Update' : 'Launch Assignment')}
                </button>
              </div>
            </form>
          )}

          {/* INVENTORY SECTION (Public/Draft Separation) */}
          {activeTab === 'manage' && (
            <div className="animate-in fade-in">
              <div className="flex gap-4 mb-8">
                  <button onClick={() => setInventoryTab('published')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase transition-all ${inventoryTab === 'published' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>Public Folder</button>
                  <button onClick={() => setInventoryTab('draft')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase transition-all ${inventoryTab === 'draft' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>Draft Folder</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dictations.filter(d => d.type === managementMode && d.status === inventoryTab).map(d => (
                  <div key={d.id} className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border dark:border-slate-800 flex justify-between items-center group hover:border-blue-500">
                    <div>
                      <h4 className="font-black text-sm dark:text-white uppercase italic">{d.title}</h4>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">{d.cat} {d.year ? `• ${d.year} ${d.month}` : ''}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(d)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase">Edit</button>
                      <button onClick={() => {if(window.confirm("Confirm deletion?")) deleteDoc(doc(db, "dictations", d.id))}} className="px-4 py-2 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase">Del</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Tabs: Analysis, Support, Notice - Logic simplified but complete */}
          {activeTab === 'results' && (
            <div className="overflow-x-auto rounded-[2rem] border dark:border-slate-800">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[9px] font-black uppercase text-slate-400"><tr className="border-b dark:border-slate-800"><th className="p-5">Student</th><th className="p-5">Matter</th><th className="p-5">Score</th><th className="p-5 text-right">Action</th></tr></thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {allResults.filter(r => (managementMode === 'steno' ? r.errorPercent !== undefined : r.wpm !== undefined)).map(r => (
                    <tr key={r.id} className="text-xs dark:text-slate-300">
                      <td className="p-5 font-bold uppercase">{r.userName}</td>
                      <td className="p-5 uppercase text-slate-500 italic">{r.exerciseTitle}</td>
                      <td className="p-5 font-black">{managementMode === 'steno' ? r.errorPercent + '%' : r.wpm + ' WPM'}</td>
                      <td className="p-5 text-right"><button onClick={() => {if(window.confirm("Delete record?")) deleteDoc(doc(db, "results", r.id))}} className="text-red-500 font-black uppercase text-[8px]">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-4">
              {messages.map(m => (
                <div key={m.id} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border dark:border-slate-800">
                  <div className="flex justify-between mb-4"><span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase">{m.sender}</span><span className="text-[8px] text-slate-400">{m.time?.toDate().toLocaleString()}</span></div>
                  <p className="text-sm dark:text-white italic mb-6">"{m.text}"</p>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Response..." className="flex-1 bg-white dark:bg-slate-700 p-3 rounded-xl text-xs outline-none border dark:border-slate-600" value={replyMsg.id === m.id ? replyMsg.text : ''} onChange={e => setReplyMsg({ id: m.id, text: e.target.value })} />
                    <button onClick={async () => { await updateDoc(doc(db, "messages", m.id), { replyText: replyMsg.text, read: true }); alert("Response Sent!"); setReplyMsg({ id: '', text: '' }); }} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase">Send</button>
                    <button onClick={() => deleteDoc(doc(db, "messages", m.id))} className="bg-red-500 text-white px-3 py-2 rounded-xl text-[9px] font-black">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notice' && (
            <div className="max-w-2xl mx-auto py-10 space-y-8 text-center">
              <h3 className="font-black uppercase text-xs tracking-widest text-blue-600 italic underline">Announcement Broadcast</h3>
              <textarea placeholder="Write text here..." className="w-full h-40 bg-slate-50 dark:bg-slate-800 p-6 rounded-[2.5rem] dark:text-white outline-none border-2 border-transparent focus:border-blue-600 shadow-inner" value={announcement} onChange={e=>setAnnouncement(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={async () => { await setDoc(doc(db, "settings", "announcement"), { text: announcement }); alert("Live! 📢"); }} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Broadcast</button>
                <button onClick={async () => { await setDoc(doc(db, "settings", "announcement"), { text: "" }); setAnnouncement(""); alert("Cleared!"); }} className="bg-red-500 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Clear</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
