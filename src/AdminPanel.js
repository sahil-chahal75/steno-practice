import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";

const AdminPanel = ({ setShowAdmin, user }) => {
  const [activeTab, setActiveTab] = useState('upload'); 
  const [form, setForm] = useState({ title: '', cat: 'kc', text: '', time: 10, errorLimit: 8, audioUrl: '' });
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (activeTab === 'users') {
      const fetchUsers = async () => {
        try {
          const q = query(collection(db, "results"), orderBy("submittedAt", "desc"));
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllUsers(data);
        } catch (err) { console.error(err); }
      };
      fetchUsers();
    }
  }, [activeTab]);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!form.audioUrl.startsWith('http')) return alert("Please enter a valid Audio Link!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "dictations"), {
        ...form,
        allowedTime: Number(form.time),
        errorLimit: Number(form.errorLimit),
        createdAt: serverTimestamp()
      });
      alert("🚀 Dictation Published Successfully via Link!");
      setLoading(false);
      setShowAdmin(false);
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] p-4 flex items-center justify-center overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-[3rem] p-8 shadow-2xl relative border-t-8 border-green-500 min-h-[80vh]">
        
        {/* HEADER TABS */}
        <div className="flex gap-4 mb-8 border-b dark:border-slate-700 pb-4">
          <button onClick={() => setActiveTab('upload')} className={`px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest ${activeTab === 'upload' ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-100 dark:bg-slate-900 dark:text-slate-400'}`}>Upload Dictation</button>
          <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 dark:bg-slate-900 dark:text-slate-400'}`}>Student Records</button>
          <button onClick={() => setShowAdmin(false)} className="ml-auto text-slate-400 font-bold text-xs uppercase hover:text-red-500 transition-colors">Close ✕</button>
        </div>

        {activeTab === 'upload' ? (
          <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div className="group">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Exercise Title</label>
                <input type="text" placeholder="e.g. KC No. 481 (Front)" className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white p-4 rounded-2xl outline-none border-2 border-transparent focus:border-green-500 font-bold transition-all" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required />
              </div>

              <div className="group">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Magazine Category</label>
                <select className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500" value={form.cat} onChange={e=>setForm({...form, cat: e.target.value})}>
                  <option value="kc">📘 KC Magazine</option>
                  <option value="prog">📈 Progressive</option>
                  <option value="speed">⚡ Speedography</option>
                  <option value="misc">📁 Miscellaneous</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border-2 border-transparent focus-within:border-green-500">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Time (Min)</label>
                  <input type="number" className="w-full bg-transparent p-1 font-bold dark:text-white outline-none" value={form.time} onChange={e=>setForm({...form, time: e.target.value})} required />
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border-2 border-transparent focus-within:border-green-500">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Error % Limit</label>
                  <input type="number" className="w-full bg-transparent p-1 font-bold dark:text-white outline-none" value={form.errorLimit} onChange={e=>setForm({...form, errorLimit: e.target.value})} required />
                </div>
              </div>

              <div className="group">
                <label className="text-[9px] font-black text-blue-500 uppercase ml-2 italic">Audio Direct Link (Google Drive/Dropbox)</label>
                <input type="url" placeholder="https://..." className="w-full bg-blue-50/50 dark:bg-blue-900/20 dark:text-white p-4 rounded-2xl outline-none border-2 border-blue-100 dark:border-blue-900 focus:border-blue-500 font-bold" value={form.audioUrl} onChange={e=>setForm({...form, audioUrl: e.target.value})} required />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1">Original Text Matter</label>
              <textarea placeholder="Paste dictation text here..." className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white p-5 rounded-3xl flex-1 font-medium outline-none border-2 border-transparent focus:border-green-500 resize-none shadow-inner" value={form.text} onChange={e=>setForm({...form, text: e.target.value})} required />
              <button disabled={loading} className="w-full bg-slate-900 dark:bg-green-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] mt-4 shadow-xl active:scale-95 transition-all">
                {loading ? 'Publishing...' : 'Publish Dictation'}
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: USER RECORDS (Clean Table) */
          <div className="animate-in slide-in-from-bottom duration-300">
            <div className="overflow-x-auto bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-inner">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase text-left border-b dark:border-slate-800">
                    <th className="p-4">Student Details</th>
                    <th className="p-4">Exercise</th>
                    <th className="p-4">Error %</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {allUsers.map((rec) => (
                    <tr key={rec.id} className="hover:bg-white dark:hover:bg-slate-800 transition-colors">
                      <td className="p-4 text-sm">
                        <div className="font-black dark:text-slate-200 uppercase">{rec.userName}</div>
                        <div className="text-[9px] text-slate-400 font-bold italic">{rec.userEmail}</div>
                      </td>
                      <td className="p-4 font-bold text-xs dark:text-slate-400">{rec.exerciseTitle}</td>
                      <td className="p-4 font-black text-blue-600">{rec.errorPercent}%</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${rec.status.includes('QUALIFIED') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-4 text-[10px] font-bold text-slate-400 italic">
                        {rec.submittedAt?.toDate().toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
