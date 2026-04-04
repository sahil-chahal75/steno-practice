import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ✅ Added setTestResult and setView in props to match your App.js
const Result = ({ result, doc, setView, setTestResult, darkMode }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [filterType, setFilterType] = useState(null); 
  
  // Safety check for original text
  const originalText = doc?.text || "";
  const typedText = result || "";

  const clean = (word) => {
    if (!word) return "";
    return word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase().trim();
  };

  const calculateResult = () => {
    // If no text, return empty stats to prevent crash
    if (!originalText) return null;

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
    const isQualified = parseFloat(errorPercent) <= (doc?.errorLimit || 5);

    return { 
      report, 
      fullMistakes, 
      halfMistakes, 
      totalErrors, 
      errorPercent, 
      isQualified,
      totalWords: oriArr.length,
      typedWords: typArr.length 
    };
  };

  const data = calculateResult();

  // 🚀 FIXED: Saving Logic with proper checks
  useEffect(() => {
    const saveToDB = async () => {
      const user = auth.currentUser;
      // Only save if we have all data and it's a fresh result
      if (user && data && doc?.title) {
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
          console.log("Result saved successfully!");
        } catch (err) {
          console.error("Error saving result:", err);
        }
      }
    };
    saveToDB();
  }, [data, doc]); // Runs when data is ready

  if (!data) return <div className="p-20 text-center font-black">Calculating Results...</div>;

  const filteredWords = data.report.filter(item => {
    if (filterType === 'full') return ['wrong', 'missing', 'extra'].includes(item.type);
    if (filterType === 'half') return item.type === 'half';
    return false;
  });

  const handlePrint = () => { window.print(); };

  // ✅ Fixed Dashboard button logic
  const handleBackToDashboard = () => {
    if (setTestResult) setTestResult(null); 
    // Navigation is handled by App.js based on testResult state
  };

  return (
    <div className="max-w-4xl mx-auto pb-10 bg-white min-h-screen p-4">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .print-container { box-shadow: none !important; border: 1px solid #ddd !important; border-radius: 10px !important; page-break-inside: avoid; margin-bottom: 10px !important; padding: 15px !important; }
        }
      `}} />

      {/* SUMMARY CARD */}
      <div className="print-container bg-white rounded-[2rem] p-6 shadow-lg border-t-8 border-blue-600 mb-6">
        <div className="flex justify-between items-center mb-6 no-print">
          <h1 className="text-lg font-black italic text-slate-400 uppercase tracking-widest">StenoPulse Report</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowOriginal(!showOriginal)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-[10px] uppercase border hover:bg-slate-200 transition-all">{showOriginal ? "Hide Original" : "Show Original Matter"}</button>
            <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg transition-all active:scale-95">🖨️ Download / Print</button>
          </div>
        </div>

        <h2 className={`text-3xl font-black mb-6 text-center italic ${data.isQualified ? 'text-green-600' : 'text-red-600'}`}>{data.isQualified ? 'QUALIFIED ✅' : 'DISQUALIFIED ❌'}</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl text-center border">
            <p className="text-[9px] font-black text-slate-500 uppercase">Original Words</p>
            <p className="text-xl font-black text-slate-900">{data.totalWords}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl text-center border">
            <p className="text-[9px] font-black text-slate-500 uppercase">Typed Words</p>
            <p className="text-xl font-black text-slate-900">{data.typedWords}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-center border border-blue-100">
            <p className="text-[9px] font-black text-blue-500 uppercase">Error %</p>
            <p className="text-xl font-black text-blue-600">{data.errorPercent}%</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl text-center border">
            <p className="text-[9px] font-black text-slate-500 uppercase">Full Mistake</p>
            <p className="text-xl font-black text-red-600">{data.fullMistakes}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl text-center border">
            <p className="text-[9px] font-black text-slate-500 uppercase">Half Mistake</p>
            <p className="text-xl font-black text-orange-600">{data.halfMistakes}</p>
          </div>
        </div>
      </div>

      {/* MISTAKE FILTER BUTTONS */}
      <div className="flex gap-4 mb-6 no-print">
        <button 
          onClick={() => setFilterType(filterType === 'full' ? null : 'full')} 
          className={`flex-1 py-3 rounded-xl font-black uppercase text-[11px] border transition-all ${filterType === 'full' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}
        >
          Check Full Mistakes
        </button>
        <button 
          onClick={() => setFilterType(filterType === 'half' ? null : 'half')} 
          className={`flex-1 py-3 rounded-xl font-black uppercase text-[11px] border transition-all ${filterType === 'half' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'}`}
        >
          Check Half Mistakes
        </button>
      </div>

      {filterType && (
        <div className="no-print bg-slate-50 border-2 border-slate-200 rounded-[2rem] p-6 mb-6 animate-in slide-in-from-top duration-300">
          <div className="flex flex-wrap gap-2">
            {filteredWords.map((item, idx) => (
              <span key={idx} className={`px-4 py-2 rounded-lg text-sm font-black border-2 ${filterType === 'full' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                {item.word} {item.original && <span className="text-[10px] opacity-70">({item.original})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {showOriginal && (
        <div className="print-container bg-white border border-slate-200 rounded-[2rem] p-6 mb-6">
          <h3 className="font-black uppercase tracking-widest text-slate-500 text-[10px] mb-4 italic">Original Matter Reference</h3>
          <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-bold p-4 bg-slate-50 rounded-xl border">{originalText}</div>
        </div>
      )}

      {/* DETAILED ANALYSIS */}
      <div className="print-container bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100">
        <div className="flex justify-between items-center mb-6 border-b-2 border-slate-100 pb-4">
          <h3 className="font-black uppercase tracking-widest text-slate-500 text-[10px] italic">Evaluation Analysis</h3>
        </div>
        
        <div className="leading-[2.8] font-bold text-lg text-justify px-2">
          {data.report.map((item, idx) => (
            <span key={idx} className="inline-block mr-2">
              {item.type === 'correct' && <span className="text-green-700">{item.word}</span>}
              {item.type === 'wrong' && <span className="text-red-700 font-black border-b-4 border-red-200">{item.word}</span>}
              {item.type === 'half' && <span className="text-orange-700 underline decoration-2">{item.word}</span>}
              {item.type === 'missing' && <span className="text-slate-900 font-black bg-slate-200 px-1 rounded">{item.word}</span>}
              {item.type === 'extra' && <span className="text-blue-700 font-black italic underline decoration-2">{item.word}</span>}
            </span>
          ))}
        </div>

        <button onClick={handleBackToDashboard} className="no-print w-full mt-8 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl">Back to Dashboard</button>
      </div>
    </div>
  );
};

export default Result;
