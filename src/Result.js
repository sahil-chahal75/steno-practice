import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Result = ({ result, doc, setView, darkMode }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [filterType, setFilterType] = useState(null); // Mistakes filter karne ke liye
  const originalText = doc.text;
  const typedText = result || "";

  // 1. CLEANING LOGIC (UNCHANGED)
  const clean = (word) => {
    if (!word) return "";
    return word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase().trim();
  };

  // 2. COMPARISON ENGINE (UNCHANGED)
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

  // 3. SAVE TO FIREBASE (UNCHANGED)
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
        } catch (err) {
          console.error("Error saving result:", err);
        }
      }
    };
    saveToDB();
  }, []);

  // Filter Logic for buttons
  const filteredWords = data.report.filter(item => {
    if (filterType === 'full') return ['wrong', 'missing', 'extra'].includes(item.type);
    if (filterType === 'half') return item.type === 'half';
    return false;
  });

  const handlePrint = () => { window.print(); };

  return (
    <div className="max-w-4xl mx-auto pb-10 bg-white min-h-screen p-4">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .print-container { box-shadow: none !important; border: 1px solid #eee !important; border-radius: 10px !important; page-break-inside: avoid; margin-bottom: 10px !important; padding: 15px !important; }
          .report-text { font-size: 14px !important; line-height: 1.6 !important; }
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl text-center border">
            <p className="text-[9px] font-black text-slate-400 uppercase">Original Words</p>
            <p className="text-xl font-black text-slate-800">{data.totalWords}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-center border border-blue-100">
            <p className="text-[9px] font-black text-blue-500 uppercase">Error %</p>
            <p className="text-xl font-black text-blue-600">{data.errorPercent}%</p>
          </div>
          {/* MISTAKE BUTTONS */}
          <button onClick={() => setFilterType(filterType === 'full' ? null : 'full')} className={`p-3 rounded-xl text-center border transition-all no-print ${filterType === 'full' ? 'bg-red-600 text-white shadow-inner' : 'bg-slate-50'}`}>
            <p className={`text-[9px] font-black uppercase ${filterType === 'full' ? 'text-white' : 'text-slate-400'}`}>Full Mistake</p>
            <p className="text-xl font-black">{data.fullMistakes}</p>
          </button>
          <button onClick={() => setFilterType(filterType === 'half' ? null : 'half')} className={`p-3 rounded-xl text-center border transition-all no-print ${filterType === 'half' ? 'bg-orange-500 text-white shadow-inner' : 'bg-slate-50'}`}>
            <p className={`text-[9px] font-black uppercase ${filterType === 'half' ? 'text-white' : 'text-slate-400'}`}>Half Mistake</p>
            <p className="text-xl font-black">{data.halfMistakes}</p>
          </button>
        </div>
      </div>

      {/* FILTERED WORDS LIST (Only shows on tap) */}
      {filterType && (
        <div className="no-print bg-white border border-slate-200 rounded-[2rem] p-6 mb-6 animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-black text-slate-500 uppercase italic">
              Listing: {filterType === 'full' ? 'Full Mistakes' : 'Half Mistakes'}
            </h4>
            <button onClick={() => setFilterType(null)} className="text-[10px] font-bold text-red-500 uppercase">Clear Filter ✕</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredWords.map((item, idx) => (
              <span key={idx} className={`px-3 py-1 rounded-lg text-sm font-bold border ${filterType === 'full' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                {item.word} {item.original && <span className="text-[10px] opacity-60">({item.original})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {showOriginal && (
        <div className="print-container bg-white border border-slate-200 rounded-[2rem] p-6 mb-6">
          <h3 className="font-black uppercase tracking-widest text-slate-400 text-[10px] mb-4 italic">Original Matter Reference</h3>
          <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-medium p-4 bg-slate-50 rounded-xl border">{originalText}</div>
        </div>
      )}

      {/* DETAILED REVIEW */}
      <div className="print-container bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="font-black uppercase tracking-widest text-slate-400 text-[10px] italic">Detailed Analysis</h3>
          <div className="text-[9px] font-bold text-slate-500 uppercase space-x-2">
            <span>Correct: Green</span> | <span>Wrong: Red</span> | <span>Half: Orange</span> | <span>Extra: Blue</span> | <span>Missing: Brackets</span>
          </div>
        </div>
        
        <div className="report-text bg-white leading-[2.5] font-medium text-lg text-justify">
          {data.report.map((item, idx) => (
            <span key={idx} className="inline-block mr-2">
              {item.type === 'correct' && <span className="text-green-600">{item.word}</span>}
              {item.type === 'wrong' && <span className="text-red-700 font-bold border-b-2 border-red-200">{item.word}</span>}
              {item.type === 'half' && <span className="text-orange-500 underline decoration-dotted">{item.word}</span>}
              {item.type === 'missing' && <span className="text-slate-400 font-black bg-slate-100 px-1 rounded">{item.word}</span>}
              {item.type === 'extra' && <span className="text-blue-600 font-bold italic underline">{item.word}</span>}
            </span>
          ))}
        </div>

        <button onClick={() => setView('home')} className="no-print w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all">Back to Dashboard</button>
      </div>
    </div>
  );
};

export default Result;
