import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";

const AdminPanel = ({ setShowAdmin, user }) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'users'
  const [form, setForm] = useState({ title: '', cat: 'kc', text: '', time: 10, errorLimit: 5 });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserRecords, setSelectedUserRecords] = useState(null);

  // Users aur unke records fetch karna
  useEffect(() => {
    if (activeTab === 'users') {
      const fetchUsers = async () => {
        const q = query(collection(db, "results"), orderBy("submittedAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(data);
      };
      fetchUsers();
    }
  }, [activeTab]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select MP3 first!");
    setLoading(true);
    try {
      const storageRef = ref(storage, `audios/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed', (snap) => setProgress(Math.round((snap.bytesTransferred/snap.totalBytes)*100)), 
      (err) => alert(err.message), 
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(db, "dictations"), {
          ...form, audioUrl: url, allowedTime: Number(form.time), 
          errorLimit: Number(form.errorLimit), createdAt: serverTimestamp()
        });
        alert("Published!"); setLoading(false); setShowAdmin(false);
      });
    } catch (err) { alert(err.message); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] p-4 flex items-center justify-center overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-[3rem] p-8 shadow-2xl relative border-t-8 border-green-500 min-h-[80vh]">
        
        {/* TABS HEADER */}
        <div className="flex gap-4 mb-8 border-b dark:border-slate-700 pb-4">
          <button onClick={() => setActiveTab('upload')} className={`px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest ${activeTab === 'upload' ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-900 dark:text-slate-400'}`}>Upload Dictation</button>
          <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-900 dark:text-slate-400'}`}>User Records & Progress</button>
          <button onClick={() => setShowAdmin(false)} className="ml-auto text-slate-400 font-bold text-xs uppercase">Close ✕</button>
        </div>

        {/* TAB 1: UPLOAD FORM */}
        {activeTab === 'upload' && (
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="space-y-4">
              <input type="text" placeholder="Exercise Title" className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white p-4 rounded-2xl outline-none border-2 border-transparent focus:border-green-500 font-bold" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required />
              <select className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white p-4 rounded-2xl font-bold outline-none" value={form.cat} onChange={e=>setForm({...form, cat: e.target.value})}>
                <option value="kc">📘 KC Magazine</option>
                <option value="prog">📈 Progressive</option>
                <option value="speed">⚡ Speedography</option>
                <option value="misc">📁 Miscellaneous</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Timer (Min)</label>
                  <input type="number" className="w-full bg-transparent p-1 font-bold dark:text-white outline-none" value={form.time} onChange={e=>setForm({...form, time: e.target.value})} required />
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Error Limit %</label>
                  <input type="number" className="w-full bg-transparent p-1 font-bold dark:text-white outline-none" value={form.errorLimit} onChange={e=>setForm({...form, errorLimit: e.target.value})} required />
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border-2 border-dashed border-slate-200">
                <input type="file" accept="audio/*" className="w-full text-xs font-bold dark:text-slate-400" onChange={e=>setFile(e.target.files[0])} required />
              </div>
            </div>
            <div className="flex flex-col">
              <textarea placeholder="Paste Original Text Matter..." className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white p-5 rounded-2xl flex-1 font-medium outline-none border-2 border-transparent focus:border-green-500 resize-none" value={form.text} onChange={e=>setForm({...form, text: e.target.value})} required />
              <button disabled={loading} className="w-full bg-slate-900 dark:bg-green-600 text-white py-5 rounded-3xl font-black uppercase mt-4 shadow-xl">
                {loading ? `Uploading ${progress}%` : 'Publish Exercise'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: USER RECORDS */}
        {activeTab === 'users' && (
          <div className="animate-in slide-in-from-bottom duration-300">
            <h3 className="text-xl font-black mb-6 dark:text-white uppercase italic tracking-tighter">Student Performance Records</h3>
            <div className="overflow-x-auto bg-slate-50 dark:bg-slate-900 rounded-3xl p-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase border-b dark:border-slate-800">
                    <li className="p-4">Student Name</li>
                    <li className="p-4">Exercise</li>
                    <li className="p-4">Errors</li>
                    <li className="p-4">Result</li>
                    <li className="p-4">Date</li>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {allUsers.map((rec) => (
                    <tr key={rec.id} className="text-sm font-bold dark:text-slate-300">
                      <td className="p-4"><div>{rec.userName}</div><div className="text-[9px] font-medium opacity-50">{rec.userEmail}</div></td>
                      <td className="p-4">{rec.exerciseTitle}</td>
                      <td className="p-4 text-blue-600">{rec.errorPercent}%</td>
                      <td className={`p-4 ${rec.status.includes('QUALIFIED') ? 'text-green-500' : 'text-red-500'}`}>{rec.status}</td>
                      <td className="p-4 text-[10px]">{rec.submittedAt?.toDate().toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allUsers.length === 0 && <p className="text-center py-10 text-slate-400 italic">No student records found yet.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
