import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const TypingAdmin = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // upload, manage, results
  const [form, setForm] = useState({ title: '', text: '', status: 'published' });
  const [typingMatters, setTypingMatters] = useState([]);
  const [typingResults, setTypingResults] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const auth = getAuth();
  const ADMIN_EMAIL = "sahilchahalkuk@gmail.com";

  // 🔐 Security & Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  // 📡 Fetch Typing Data (Real-time)
  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      const unsubMatters = onSnapshot(query(collection(db, "typing_matters"), orderBy("createdAt", "desc")), (snap) => {
        setTypingMatters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubResults = onSnapshot(query(collection(db, "typing_results"), orderBy("createdAt", "desc")), (snap) => {
        setTypingResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => { unsubMatters(); unsubResults(); };
    }
  }, [user]);

  const handlePublish = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        ...form, 
        updatedAt: serverTimestamp() 
      };

      if (editId) {
        await updateDoc(doc(db, "typing_matters", editId), payload);
        alert("Matter Updated! ✅");
        setEditId(null);
      } else {
        await addDoc(collection(db, "typing_matters"), { ...payload, createdAt: serverTimestamp() });
        alert(form.status === 'published' ? "Published Live! 🚀" : "Saved to Drafts 📁");
      }
      setForm({ title: '', text: '', status: 'published' });
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  const deleteMatter = async (id) => {
    if(window.confirm("Delete this matter forever?")) {
      await deleteDoc(doc(db, "typing_matters", id));
    }
  };

  if (authLoading) return <div className="p-10 text-center font-bold">Verifying Admin...</div>;

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center border-b-8 border-red-500">
          <h1 className="text-5xl mb-4">🚫</h1>
          <h2 className="text-2xl font-black text-gray-800 uppercase">Unauthorized Access</h2>
          <p className="text-gray-500 mt-2">Only Sahil Chahal can manage typing tools.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-blue-600 uppercase italic">Typing Master Admin</h1>
            <p className="text-xs text-gray-400 font-bold uppercase">{user.email}</p>
          </div>
          <div className="flex gap-2">
            {['upload', 'manage', 'results'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 1. UPLOAD / EDIT TAB */}
        {activeTab === 'upload' && (
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-black text-gray-700 mb-6 uppercase tracking-tight">
              {editId ? '📝 Edit Typing Matter' : '📤 Add New Matter'}
            </h3>
            <form onSubmit={handlePublish} className="space-y-4">
              <input 
                type="text" 
                placeholder="Matter Name (e.g. HSSC Set-1)" 
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-gray-900" 
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                required
              />
              <textarea 
                placeholder="Enter Typing Material content here..." 
                className="w-full h-80 p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-blue-500 font-medium leading-relaxed text-gray-900"
                value={form.text}
                onChange={e => setForm({...form, text: e.target.value})}
                required
              />
              <div className="flex gap-4">
                <select 
                  className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-600 outline-none"
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value})}
                >
                  <option value="published">Publish Direct</option>
                  <option value="draft">Save as Draft</option>
                </select>
                <button 
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : editId ? 'Update Matter' : 'Deploy Matter 🚀'}
                </button>
              </div>
              {editId && (
                <button onClick={() => {setEditId(null); setForm({title:'', text:'', status:'published'})}} className="w-full text-red-500 font-bold uppercase text-xs mt-2 underline">Cancel Edit</button>
              )}
            </form>
          </div>
        )}

        {/* 2. MANAGE TAB (Edit/Delete) */}
        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {typingMatters.map(m => (
              <div key={m.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <h4 className="font-black text-gray-800 uppercase text-sm truncate max-w-[200px]">{m.title}</h4>
                  <p className={`text-[10px] font-bold uppercase ${m.status === 'published' ? 'text-green-500' : 'text-orange-500'}`}>{m.status}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {setEditId(m.id); setForm({title:m.title, text:m.text, status:m.status}); setActiveTab('upload');}} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">📝</button>
                  <button onClick={() => deleteMatter(m.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. PERFORMANCE / RESULTS TAB */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Student</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Matter</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Speed</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {typingResults.map(r => (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-800 text-sm">{r.userName || 'Anonymous'}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase">{r.userEmail}</div>
                      </td>
                      <td className="p-4 text-xs font-bold text-gray-500 uppercase">{r.matterTitle}</td>
                      <td className="p-4 font-black text-blue-600">{r.netWpm} WPM</td>
                      <td className="p-4 font-black text-green-600">{r.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {typingResults.length === 0 && <div className="p-10 text-center text-gray-400 font-bold uppercase text-xs">No performances recorded yet</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TypingAdmin;
