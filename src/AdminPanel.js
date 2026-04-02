import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";

const AdminPanel = ({ setShowAdmin, user }) => {
  const [activeTab, setActiveTab] = useState('upload'); 
  const [form, setForm] = useState({ title: '', cat: 'kc', text: '', time: 10, errorLimit: 8, audioUrl: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // States for new features
  const [allUsers, setAllUsers] = useState([]);
  const [dictations, setDictations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState([]);

  // 📡 Data Fetching Logic
  useEffect(() => {
    const fetchData = async () => {
      if (activeTab === 'users') {
        const q = query(collection(db, "results"), orderBy("submittedAt", "desc"));
        const snap = await getDocs(q);
        setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    };
    fetchData();
  }, [activeTab]);

  const handlePublish = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "dictations", editId), {
          ...form, allowedTime: Number(form.time), errorLimit: Number(form.errorLimit)
        });
        alert("Updated! ✅");
      } else {
        await addDoc(collection(db, "dictations"), {
          ...form, allowedTime: Number(form.time), errorLimit: Number(form.errorLimit), createdAt: serverTimestamp()
        });
        alert("Published! 🚀");
      }
      setForm({ title: '', cat: 'kc', text: '', time: 10, errorLimit: 8, audioUrl: '' });
      setEditId(null);
      setActiveTab('manage');
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  const deleteDictation = async (id) => {
    if (window.confirm("Delete kar dein?")) {
      await deleteDoc(doc(db, "dictations", id));
      setDictations(dictations.filter(d => d.id !== id));
    }
  };

  const startEdit = (d) => {
    setForm({ title: d.title, cat: d.cat, text: d.text, time: d.allowedTime, errorLimit: d.errorLimit, audioUrl: d.audioUrl });
    setEditId(d.id);
    setActiveTab('upload');
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[500] p-2 md:p-6 flex items-center justify-center overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[2.5rem] shadow-2xl relative border-t-8 border-blue-600 flex flex-col h-[90vh]">
        
        {/* 📱 SCROLLABLE NAVBAR */}
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar border-b dark:border-slate-800 shrink-0">
          {[
            {id:'upload', n:'Upload', c:'bg-green-500'},
            {id:'manage', n:'Manage Tests', c:'bg-amber-500'},
            {id:'users', n:'Results', c:'bg-blue-600'},
            {id:'profiles', n:'Students', c:'bg-purple-600'},
            {id:'messages', n:'Inbox', c:'bg-red-500'}
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest whitespace-nowrap transition-all ${activeTab === t.id ? `${t.c} text-white shadow-lg` : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              {t.n}
            </button>
          ))}
          <button onClick={() => setShowAdmin(false)} className="ml-auto bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">Exit ✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {/* 1. UPLOAD / EDIT FORM */}
          {activeTab === 'upload' && (
            <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <div className="space-y-4">
                <h3 className="text-blue-600 font-black italic uppercase text-xs">{editId ? 'Editing Mode 📝' : 'New Dictation ✨'}</h3>
                <input type="text" placeholder="Title" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white font-bold" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required />
                <select className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white" value={form.cat} onChange={e=>setForm({...form, cat: e.target.value})}>
                  <option value="kc">📘 KC Magazine</option>
                  <option value="prog">📈 Progressive</option>
                  <option value="speed">⚡ Speedography</option>
                  <option value="misc">📁 Miscellaneous</option>
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Min" className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white" value={form.time} onChange={e=>setForm({...form, time: e.target.value})} required />
                  <input type="number" placeholder="Error %" className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white" value={form.errorLimit} onChange={e=>setForm({...form, errorLimit: e.target.value})} required />
                </div>
                <input type="url" placeholder="Audio URL" className="w-full bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl font-bold dark:text-white" value={form.audioUrl} onChange={e=>setForm({...form, audioUrl: e.target.value})} required />
              </div>
              <div className="flex flex-col">
                <textarea placeholder="Paste Text Matter..." className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl flex-1 font-medium dark:text-white outline-none min-h-[200px]" value={form.text} onChange={e=>setForm({...form, text: e.target.value})} required />
                <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase mt-4 shadow-xl">
                  {loading ? 'Processing...' : (editId ? 'Update Now' : 'Publish Test')}
                </button>
              </div>
            </form>
          )}

          {/* 2. MANAGE TESTS (Edit/Delete) */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              {dictations.map(d => (
                <div key={d.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-black dark:text-white uppercase italic text-sm">{d.title}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{d.cat} | {d.allowedTime} Mins</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(d)} className="bg-blue-100 text-blue-600 p-2 rounded-lg text-[9px] font-black uppercase">Edit</button>
                    <button onClick={() => deleteDictation(d.id)} className="bg-red-100 text-red-600 p-2 rounded-lg text-[9px] font-black uppercase">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. INBOX MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              {messages.map(m => (
                <div key={m.id} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-[2rem] border-l-8 border-red-500">
                  <div className="flex justify-between mb-2">
                    <span className="font-black text-xs dark:text-white uppercase">{m.sender}</span>
                    <span className="text-[9px] text-slate-400">{m.time?.toDate().toLocaleString()}</span>
                  </div>
                  <p className="text-sm dark:text-slate-300 italic">"{m.text}"</p>
                  <p className="text-[9px] mt-2 font-bold text-blue-500">{m.email}</p>
                </div>
              ))}
            </div>
          )}

          {/* 4. STUDENT PROFILES */}
          {activeTab === 'profiles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map(p => (
                <div key={p.id} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border dark:border-slate-700">
                  <p className="font-black uppercase text-blue-600">{p.name || 'No Name'}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] font-bold text-slate-500 uppercase">
                    <span>📞 {p.phone || 'N/A'}</span>
                    <span>📍 {p.city || 'N/A'}</span>
                    <span>🎓 {p.edu || 'N/A'}</span>
                    <span>📫 {p.pin || 'N/A'}</span>
                  </div>
                  <p className="text-[9px] mt-2 italic truncate opacity-50">{p.email}</p>
                </div>
              ))}
            </div>
          )}

          {/* 5. USER RESULTS (Pichla wala same) */}
          {activeTab === 'users' && (
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <tr className="text-[9px] font-black text-slate-400 uppercase border-b dark:border-slate-800">
                    <th className="p-3">Student</th><th className="p-3">Exercise</th><th className="p-3">Error</th><th className="p-3">Status</th>
                  </tr>
                  {allUsers.map(rec => (
                    <tr key={rec.id} className="text-xs border-b dark:border-slate-800">
                      <td className="p-3 font-bold dark:text-white">{rec.userName}</td>
                      <td className="p-3 text-slate-500">{rec.exerciseTitle}</td>
                      <td className="p-3 font-black text-blue-600">{rec.errorPercent}%</td>
                      <td className={`p-3 font-black ${rec.status.includes('QUALIFIED') ? 'text-green-500' : 'text-red-500'}`}>{rec.status}</td>
                    </tr>
                  ))}
               </table>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
