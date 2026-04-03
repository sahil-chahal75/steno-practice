import React from 'react';
import { useNavigate } from 'react-router-dom';

const TypingResult = ({ result, doc }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black italic text-slate-900 dark:text-white uppercase">STENO<span className="text-blue-600">PLUS</span></h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Typing Performance Analysis</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { l: 'Net Speed', v: `${result.wpm} WPM`, c: 'text-blue-600' },
          { l: 'Total Words', v: result.totalWords, c: 'text-slate-800 dark:text-white' },
          { l: 'Mistakes', v: result.mistakes, c: 'text-red-500' },
          { l: 'Accuracy', v: `${Math.round(((result.totalWords - result.mistakes) / result.totalWords) * 100 || 0)}%`, c: 'text-green-600' }
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl text-center border border-slate-100 dark:border-slate-700">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-1">{s.l}</p>
            <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* COMPARISON AREA */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl mb-8">
        <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6">Error Analysis (Mistakes Highlighted Red)</h3>
        <div className="leading-loose text-lg font-mono">
          {result.typedText.split(' ').map((word, i) => {
            const originalWords = result.originalText.split(' ');
            const isError = word !== originalWords[i];
            return (
              <span key={i} className={`${isError ? 'bg-red-100 text-red-600 border-b-2 border-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                {word}{' '}
              </span>
            );
          })}
        </div>
      </div>

      <button onClick={() => navigate('/')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl">Back to Training Hub</button>
    </div>
  );
};

export default TypingResult;

