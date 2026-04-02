import React from 'react';

const Result = ({ result, doc, setView, darkMode }) => {
  const originalText = doc.text;
  const typedText = result || "";

  // 1. CLEANING LOGIC (Punctuation & Special Cases Ignore)
  const clean = (word) => {
    if (!word) return "";
    return word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase().trim();
  };

  // 2. COMPARISON ENGINE (Anti-Chain Error Logic)
  const calculateResult = () => {
    const oriArr = originalText.trim().split(/\s+/);
    const typArr = typedText.trim().split(/\s+/);
    
    let report = [];
    let fullMistakes = 0;
    let halfMistakes = 0;
    let tIdx = 0;

    // Word-to-Word Matching with Look-ahead (to prevent chain errors)
    for (let i = 0; i < oriArr.length; i++) {
      const ori = oriArr[i];
      const typ = typArr[tIdx];

      if (typ && clean(ori) === clean(typ)) {
        // Case 1: Perfect Match
        report.push({ type: 'correct', word: typ });
        tIdx++;
      } else if (typ && clean(oriArr[i+1]) === clean(typ)) {
        // Case 2: Omission (Bacha ek word kha gaya)
        report.push({ type: 'missing', word: `(${ori})` });
        fullMistakes++;
        // tIdx nahi badhayenge kyunki agla typed word agle original se match ho gaya
      } else if (typ && clean(ori) === clean(typArr[tIdx+1])) {
        // Case 3: Addition (Bache ne extra word likh diya)
        report.push({ type: 'extra', word: typ });
        fullMistakes++;
        tIdx++;
        i--; // Original word wahi rahega agle round ke liye
      } else if (typ) {
        // Case 4: Substitution (Galat word likha)
        // Check for Half Mistake (Singular/Plural or Capitalization)
        if (ori.toLowerCase() === typ.toLowerCase() || ori.replace(/s$/,'') === typ.replace(/s$/,'')) {
          report.push({ type: 'half', word: typ, original: ori });
          halfMistakes += 0.5;
        } else {
          report.push({ type: 'wrong', word: typ, original: ori });
          fullMistakes++;
        }
        tIdx++;
      } else {
        // Case 5: Leftover original words
        report.push({ type: 'missing', word: `(${ori})` });
        fullMistakes++;
      }
    }

    // Extra typed words at the end
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

  return (
    <div className="animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto pb-20">
      {/* SUMMARY CARD */}
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 shadow-2xl border-t-8 border-blue-600 mb-8">
        <h2 className={`text-4xl font-black mb-6 text-center italic ${data.isQualified ? 'text-green-600' : 'text-red-600'}`}>
          {data.isQualified ? 'QUALIFIED ✅' : 'DISQUALIFIED ❌'}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase">Original Words</p>
            <p className="text-2xl font-black dark:text-white">{data.totalWords}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase">Typed Words</p>
            <p className="text-2xl font-black dark:text-white">{data.typedWords}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase">Full Mistake</p>
            <p className="text-2xl font-black text-red-600">{data.fullMistakes}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase">Half Mistake</p>
            <p className="text-2xl font-black text-orange-500">{data.halfMistakes}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center border-2 border-blue-100 dark:border-blue-900">
            <p className="text-[10px] font-black text-blue-500 uppercase">Error %</p>
            <p className="text-2xl font-black text-blue-600">{data.errorPercent}%</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase">Limit Set</p>
            <p className="text-2xl font-black dark:text-slate-300">{doc.errorLimit}%</p>
          </div>
        </div>
      </div>

      {/* DETAILED REVIEW */}
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 shadow-xl">
        <h3 className="font-black uppercase tracking-widest text-slate-400 text-xs mb-6 text-center italic">Detailed Review (Word by Word)</h3>
        
        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2rem] leading-[3] font-medium text-lg text-justify shadow-inner dark:text-slate-200">
          {data.report.map((item, idx) => (
            <span key={idx} className="inline-block mr-2">
              {item.type === 'correct' && <span className="text-green-600">{item.word}</span>}
              {item.type === 'wrong' && <span className="text-red-700 font-bold border-b-2 border-red-200">{item.word}</span>}
              {item.type === 'half' && <span className="text-orange-500 underline decoration-dotted">{item.word}</span>}
              {item.type === 'missing' && <span className="text-black dark:text-white font-black bg-slate-200 dark:bg-slate-700 px-1 rounded">{item.word}</span>}
              {item.type === 'extra' && <span className="text-blue-600 font-bold italic underline">{item.word}</span>}
            </span>
          ))}
        </div>

        {/* INSTRUCTIONS BOX */}
        <div className="mt-10 grid grid-cols-2 gap-4 p-6 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl">
          <div className="flex items-center gap-2 text-[10px] font-bold"><span className="w-3 h-3 bg-green-600 rounded-full"></span> <span className="dark:text-slate-400">RIGHT WORD</span></div>
          <div className="flex items-center gap-2 text-[10px] font-bold"><span className="w-3 h-3 bg-red-700 rounded-full"></span> <span className="dark:text-slate-400">WRONG WORD (FULL)</span></div>
          <div className="flex items-center gap-2 text-[10px] font-bold"><span className="w-3 h-3 bg-slate-400 rounded-full"></span> <span className="dark:text-slate-400">MISSING WORD (BLACK BOX)</span></div>
          <div className="flex items-center gap-2 text-[10px] font-bold"><span className="w-3 h-3 bg-blue-600 rounded-full"></span> <span className="dark:text-slate-400">EXTRA WORD (BLUE)</span></div>
          <div className="flex items-center gap-2 text-[10px] font-bold"><span className="w-3 h-3 bg-orange-500 rounded-full"></span> <span className="dark:text-slate-400">SINGULAR/PLURAL (HALF)</span></div>
        </div>

        <button 
          onClick={() => setView('home')} 
          className="w-full mt-10 bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Result;
          
