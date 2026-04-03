import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TypingArena = ({ doc, setTypingResultData }) => {
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(doc.allowedTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [backspaceDisabled, setBackspaceDisabled] = useState(false);
  const textAreaRef = useRef(null);
  const navigate = useNavigate();

  // ⏱️ TIMER LOGIC
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      handleSubmit(); // Auto-submit on time up
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleStart = () => {
    setIsActive(true);
    textAreaRef.current.focus();
  };

  const handleInput = (e) => {
    if (!isActive) setIsActive(true); // Start on first keypress
    const val = e.target.value;
    setInput(val);
  };

  const handleSubmit = () => {
    // 📊 CALCULATION LOGIC (Sahil's Formula)
    const originalWords = doc.text.trim().split(/\s+/);
    const typedWords = input.trim().split(/\s+/);
    
    let mistakes = 0;
    let typedChars = input.length; // Characters including spaces
    
    // Accuracy & Mistake logic (Preventing chain errors)
    typedWords.forEach((word, i) => {
      if (word !== originalWords[i]) mistakes++;
    });

    const totalWords = typedChars / 5; // Sahil's Character formula
    const timeSpent = (doc.allowedTime * 60 - timeLeft) / 60 || 0.1;
    const netWpm = Math.max(0, (totalWords - mistakes) / (doc.allowedTime || timeSpent));

    const result = {
      totalChars: typedChars,
      totalWords: Math.round(totalWords),
      mistakes: mistakes,
      wpm: Math.round(netWpm),
      typedText: input,
      originalText: doc.text,
      timeTaken: doc.allowedTime
    };

    setTypingResultData(result);
    navigate('/typing-result');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 animate-in fade-in">
      {/* HEADER STATS */}
      <div className="flex justify-between items-center mb-6 bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl">
        <div>
          <h2 className="font-black uppercase text-blue-600 italic">{doc.title}</h2>
          <p className="text-[10px] font-bold text-slate-400">TYPE THE MATTER BELOW ACCURATELY</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-red-600 font-mono">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </p>
          <button onClick={() => setBackspaceDisabled(!backspaceDisabled)} className={`text-[8px] font-black px-2 py-1 rounded uppercase ${backspaceDisabled ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
            Backspace: {backspaceDisabled ? 'OFF' : 'ON'}
          </button>
        </div>
      </div>

      {/* ORIGINAL MATTER (Non-Highlighting) */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 mb-6 max-h-60 overflow-y-auto leading-relaxed text-lg font-medium text-slate-700 dark:text-slate-300 select-none">
        {doc.text}
      </div>

      {/* TYPING AREA */}
      <textarea
        ref={textAreaRef}
        className="w-full h-64 p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 shadow-2xl border-2 border-transparent focus:border-blue-600 outline-none text-lg font-mono leading-relaxed transition-all resize-none"
        placeholder="Start typing here..."
        value={input}
        onChange={handleInput}
        onKeyDown={(e) => {
          if (backspaceDisabled && e.key === 'Backspace') e.preventDefault();
        }}
      />

      <div className="mt-8 flex gap-4">
        <button onClick={handleStart} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Start Test</button>
        <button onClick={handleSubmit} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase active:scale-95 transition-all">Submit Now</button>
      </div>
    </div>
  );
};

export default TypingArena;
