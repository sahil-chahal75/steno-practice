import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Result = ({ result, doc, setView, darkMode }) => {
  const [showOriginal, setShowOriginal] = useState(false); // Toggle for Original Matter
  const originalText = doc.text;
  const typedText = result || "";

  // 1. CLEANING LOGIC (No changes)
  const clean = (word) => {
    if (!word) return "";
    return word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase().trim();
  };

  // 2. COMPARISON ENGINE (Calculation method exactly same)
  const calculateResult = () => {
    const oriArr = originalText.trim().split(/\s+/);
    const typArr = typedText.trim().split(/\s+/);
    let report = [];
    let fullMistakes = 0;
    let halfMistakes = 0;
    let tIdx = 0;

    for (let i = 0; i < oriArr.length; i++) {
      const ori = oriArr[i];
      const typ = typArr[tIdx];
      if (typ && clean(ori) === clean(typ)) {
        report.push({ type: 'correct', word: typ });
        tIdx++;
      } else if (typ && oriArr[i+1] && clean(oriArr[i+1]) === clean(typ)) {
        report.push({ type: 'missing', word: `(${ori})` });
        fullMistakes++;
      } else if (typ && typArr[tIdx+1] && clean(ori) === clean(typArr[tIdx+1])) {
        report.push({ type: 'extra', word: typ });
        fullMistakes++;
        tIdx++;
        i--; 
      } else if (typ) {
        if (ori.toLowerCase() === typ.toLowerCase() || ori.replace(/s$/,'') === typ.replace(/s$/,'')) {
          report.push({ type: 'half', word: typ, original: ori });
          halfMistakes += 0.5;
        } else {
          report.push({ type: 'wrong', word: typ, original: ori });
          fullMistakes++;
        }
        tIdx++;
      } else {
        report.push({ type: 'missing', word: `(${ori})` });
        fullMistakes++;
      }
    }
    while (tIdx < typArr.length) {
      report.push({ type: 'extra', word: typArr[tIdx] });
      fullMistakes++;
      tIdx++;
    }
    const totalErrors = fullMistakes + halfMistakes;
    const errorPercent = ((totalErrors / oriArr.length) * 100).toFixed(2);
    const isQualified = errorPercent <= doc.errorLimit;
    return { report, fullMistakes, halfMistakes, totalErrors, errorPercent, isQualified, totalWords: oriArr.length, typedWords: typArr.length };
  };

  const data = calculateResult();

  // 3. SAVE TO FIREBASE
  useEffect(() => {
    const saveToDB = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          await addDoc(collection(db, "results"), {
            userId: user.uid,
            userName: user.displayName || "Student",
            userEmail: user.email,
            exerciseTitle: doc.title,
            fullMistakes: data.fullMistakes,
            halfMistakes: data.halfMistakes,
            errorPercent: data.errorPercent,
            status: data.isQualified ? 'QUALIFIED ✅' : 'DISQUALIFIED ❌',
            submittedAt: serverTimestamp()
          });
        } catch (err) { console.error("Error saving result:", err); }
      }
    };
    saveToDB();
  }, []);

  const handlePrint = () => { window.print(); };

  return (
    <div className="bg-white min-h-screen p-4 md:p-8 font-sans transition-colors duration-500">
      
      {/* 🛑 PRINT OPTIMIZATION CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .print-container { box-shadow: none !important; border: 1px solid #ddd !important; margin-bottom: 10px !important; padding: 15px !important; page-break-inside: avoid; }
          .report-text { font-size: 14px !important; line-height: 1.6 !important; }
        }
      `}} />

      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* SUMMARY SECTION */}
        <div className="print-container bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6 no-print">
            <h1 className="text-xl font-black text-blue-600 uppercase italic">StenoPulse Report</h1>
            <div className="flex gap-2">
              <button onClick={() => setShowOriginal(!showOriginal)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold text-[10px] uppercase border hover:bg-slate-200 transition-all">
                {showOriginal ? "Hide Original" : "Show Original Matter"}
              </button>
              <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase shadow-lg active:scale-95 transition-all">
                🖨️ Download / Print
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">{doc.title}</h2>
             <h3 className={`text-3xl font-black italic mt-2 ${data.isQualified ? 'text-green-600' : 'text-red-600'}`}>
                {data.isQualified ? 'QUALIFIED ✅' : 'DISQUALIFIED ❌'}
             </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 border rounded-xl text-center bg-slate-50">
              <p className="text-[9px] font-black text-slate-400 uppercase">Total Words</p>
              <p className="text-xl font-black">{data.totalWords}</p>
            </div>
            <div className="p-3 border rounded-xl text-center bg-blue-50 border-blue-100">
              <p className="text-[9px] font-black text-blue-500 uppercase">Error %</p>
              <p className="text-xl font-black text-blue-600">{data.errorPercent}%</p>
            </div>
            <div className="p-3 border rounded-xl text-center bg-red-50 border-red-100">
              <p className="text-[9px] font-black text-red-500 uppercase">Full Mistake</p>
              <p className="text-xl font-black text-red-600">{data.fullMistakes}</p>
            </div>
            <div className="p-3 border rounded-xl text-center bg-orange-50 border-orange-100">
              <p className="text-[9px] font-black text-orange-500 uppercase">Half Mistake</p>
              <p className="text-xl font-black text-orange-600">{data.halfMistakes}</p>
            </div>
          </div>
        </div>

        {/* ORIGINAL MATTER (Only shows when button is clicked) */}
        {showOriginal && (
          <div className="no-print bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in slide-in-from-top duration-300">
            <h4 className="text-xs font-black text-slate-500 uppercase mb-4 italic">Original Matter Text</h4>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap select-all">{originalText}</p>
          </div>
        )}

        {/* ANALYSIS SECTION */}
        <div className="print-container bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Evaluation Detail</h4>
            <div className="text-[9px] font-black uppercase text-slate-500 space-x-2">
              <span>(Correct: Green)</span>
              <span>(Wrong: Red)</span>
              <span>(Half: Orange)</span>
              <span>(Missing: Brackets)</span>
              <span>(Extra: Blue)</span>
            </div>
          </div>

          <div className="report-text leading-[2.2] text-justify text-slate-800 font-medium text-base p-2 border-t pt-4">
            {data.report.map((item, idx) => (
              <span key={idx} className="inline-block mr-1.5">
                {item.type === 'correct' && <span className="text-green-600">{item.word}</span>}
                {item.type === 'wrong' && <span className="text-red-600 font-bold border-b-2 border-red-200">{item.word}</span>}
                {item.type === 'half' && <span className="text-orange-500 underline decoration-dotted">{item.word}</span>}
                {item.type === 'missing' && <span className="text-slate-400 font-bold px-1 rounded">{item.word}</span>}
                {item.type === 'extra' && <span className="text-blue-600 font-bold italic underline">{item.word}</span>}
              </span>
            ))}
          </div>
          
          <div className="mt-8 border-t pt-4 text-center">
             <button 
                onClick={() => setView('home')} 
                className="no-print bg-slate-900 text-white px-10 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
             >
                Back to Dashboard
             </button>
             <p className="mt-4 text-[8px] font-black text-slate-300 uppercase tracking-widest">
               StenoPulse Evaluation Engine • Generated for {auth.currentUser?.displayName || 'Student'}
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Result;
