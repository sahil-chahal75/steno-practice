import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, onSnapshot, query, orderBy } from "firebase/firestore";

const AdminPanel = ({ setShowAdmin }) => {
  const [activeTab, setActiveTab] = useState('upload'); 
  const [managementMode, setManagementMode] = useState('steno'); // 'steno' or 'typing'
  const [form, setForm] = useState({ 
    title: '', cat: 'kc', text: '', time: 10, errorLimit: 8, audioUrl: '', 
    status: 'published', type: 'steno'
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const [allResults, setAllResults] = useState([]);
  const [dictations, setDictations] = useState([]);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const unsubResults = onSnapshot(query(collection(db, "results"), orderBy("submittedAt", "desc")), (snap) => {
      setAllResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubDicts = onSnapshot(query(collection(db, "dictations"), orderBy("createdAt", "desc")), (snap) => {
      setDictations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubNotice = onSnapshot(doc(db, "settings", "announcement"), (doc) => {
      if (doc.exists()) setAnnouncement(doc.data().text);
    });
    return () => { unsubResults(); unsubDicts(); unsubUsers(); unsubNotice(); };
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        ...form, 
        type: managementMode, // Force type based on active management tab
        allowedTime: Number(form.time), 
        updatedAt: serverTimestamp() 
      };
      if (editId) {
        await updateDoc(doc(db, "dictations", editId), payload);
        alert("Update Successful! ✅");
      } else {
        await addDoc(collection(db, "dictations"), { ...payload, createdAt: serverTimestamp() });
        alert(form.status === 'draft' ? "Stored in Drafts ✅" : "Published Live 🚀");
      }
      resetForm();
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ title: '', cat: managementMode === 'steno' ? 'kc' : 'gen', text: '', time: 10, errorLimit: 8, audioUrl: '', status: 'published', type: managementMode });
    setEditId(null);
  };

  const startEdit = (d) => {
    setManagementMode(d.type || 'steno');
    setForm({ ...d, time: d.allowedTime || 10 });
    setEditId(d.id);
    setActiveTab('upload');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl z-[500] p-4 flex items-center justify-center overflow-hidden">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[94vh] rounded-[3rem] shadow-2xl flex flex-col border dark:border-slate-800">
        
        {/* 🏢 TOP NAV - Mode Selection */}
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-2 rounded-t-[3rem] border-b dark:border-slate-800">
          <button onClick={() => {setManagementMode('steno'); setActiveTab('upload');}} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${managementMode === 'steno' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>🎙️ Steno Management</button>
          <button onClick={() => {setManagementMode('typing'); setActiveTab('upload');}} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${managementMode === 'typing' ? 'bg-green-600 text-white' : 'text-slate-400'}`}>⌨️ Typing Management</button>
          <button onClick={() => setShowAdmin(false)} className="px-6 text-red-500 font-black">EXIT ✕</button>
        </div>

        {/* 📑 SUB NAV - Actions */}
        <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/20 border-b dark:border-slate-800">
          {[
            {id:'upload', n: editId ? 'Edit Entry' : 'Add New'}, 
            {id:'manage', n:'Inventory'}, 
            {id:'results', n:'Performance'}
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-6 py-2 rounded-xl font-bold uppercase text-[9px] tracking-widest ${activeTab === t.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-400'}`}>{t.n}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          
          {/* 1. UPLOAD FORM */}
          {activeTab === 'upload' && (
            <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
              <div className="space-y-5">
                <h3 className="text-xs font-black uppercase text-slate-400 italic">Configuration for {managementMode.toUpperCase()}</h3>
                <input type="text" placeholder="Passage Title" className="w-full bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-blue-500" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required />
                
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl font-bold dark:text-white" value={form.cat} onChange={e=>setForm({...form, cat: e.target.value})}>
                    {managementMode === 'steno' ? (
                      <>
                        <option value="kc">KC Magazine</option>
                        <option value="prog">Progressive</option>
                        <option value="speed">Speedography</option>
                      </>
                    ) : (
                      <>
                        <option value="gen">General Typing</option>
                        <option value="legal">Legal Matter</option>
                        <option value="tech">Technology</option>
                        <option value="essay">Essay Matter</option>
                        <option value="poly">Political Matter</option>
                        <option value="misc_type">Miscellaneous</option>
                      </>
                    )}
                  </select>
                  <select className="bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl font-bold dark:text-white" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
                    <option value="published">Live</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                {managementMode === 'steno' && (
                   <input type="url" placeholder="Audio URL" className="w-full bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl font-bold dark:text-white" value={form.audioUrl} onChange={e=>setForm({...form, audioUrl: e.target.value})} required />
                )}
              </div>

              <div className="flex flex-col h-full">
                <textarea placeholder="Paste Passage Content Here..." className="w-full bg-slate-100 dark:bg-slate-800 p-6 rounded-[2rem] flex-1 font-medium dark:text-white min-h-[300px] outline-none border-2 border-transparent focus:border-blue-500" value={form.text} onChange={e=>setForm({...form, text: e.target.value})} required />
                <div className="flex gap-4 mt-4">
                   <button type="button" onClick={resetForm} className="px-8 bg-slate-200 dark:bg-slate-700 py-5 rounded-2xl font-black uppercase text-[10px]">Cancel</button>
                   <button className={`flex-1 py-5 rounded-2xl font-black uppercase text-[10px] text-white shadow-xl ${managementMode === 'steno' ? 'bg-blue-600' : 'bg-green-600'}`}>
                    {loading ? 'Processing...' : (editId ? 'Update Entry' : 'Publish Matter')}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. INVENTORY (Edit/Delete Logic) */}
          {activeTab === 'manage' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dictations.filter(d => d.type === managementMode).map(d => (
                <div key={d.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border dark:border-slate-800 flex justify-between items-center group hover:border-blue-500 transition-all">
                  <div>
                    <h4 className="font-black text-sm dark:text-white uppercase italic">{d.title}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{d.cat} • {d.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(d)} className="p-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase">Edit</button>
                    <button onClick={() => {if(window.confirm("Delete permanently?")) deleteDoc(doc(db, "dictations", d.id))}} className="p-3 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase">Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. PERFORMANCE / RESULTS */}
          {activeTab === 'results' && (
            <div className="overflow-x-auto rounded-[2rem] border dark:border-slate-800">
              <table className="w-full text-left bg-white dark:bg-slate-900">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[9px] font-black uppercase text-slate-400">
                  <tr><th className="p-5">Student</th><th className="p-5">Matter Title</th><th className="p-5">Score/WPM</th><th className="p-5 text-right">Date</th></tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {allResults.filter(r => (managementMode === 'steno' ? r.errorPercent : r.wpm)).map(r => (
                    <tr key={r.id} className="text-xs dark:text-slate-300">
                      <td className="p-5 font-bold uppercase">{r.userName}</td>
                      <td className="p-5 uppercase italic text-slate-500">{r.exerciseTitle}</td>
                      <td className={`p-5 font-black ${managementMode === 'steno' ? 'text-blue-600' : 'text-green-600'}`}>
                        {managementMode === 'steno' ? r.errorPercent + '%' : r.wpm + ' WPM'}
                      </td>
                      <td className="p-5 text-right text-[10px] text-slate-400">
                        {r.submittedAt?.toDate().toLocaleDateString('en-GB')}
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
