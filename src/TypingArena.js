import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TypingArena = ({ doc, setTypingResultData }) => {
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(doc.allowedTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [backspaceDisabled, setBackspaceDisabled] = useState(false);
  const textAreaRef = useRef(null);
  const navigate = useNavigate();

  // 🛡️ ACCIDENTAL EXIT WARNING (Sahil's Pro Feature)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isActive && timeLeft > 0) {
        e.preventDefault();
        e.returnValue = "Your test is in progress. Leaving will lose all data!";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive, timeLeft]);

  // ⏱️ TIMER LOGIC
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      handleSubmit(); 
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleStart = () => {
    setIsActive(true);
    if (textAreaRef.current) textAreaRef.current.focus();
  };

  const handleInput = (e) => {
    if (!isActive && e.target.value.length > 0) setIsActive(true);
    setInput(e.target.value);
  };

  const handleSubmit = () => {
    if (input.length === 0) return alert("Please type something first!");
    
    const originalText = doc.text.trim();
    const typedText = input.trim();
    
    // 📊 PROFESSIONAL FORMULA
    const totalChars = input.length; // Including spaces
    const totalWords = totalChars / 5; 
    
    const originalWords = originalText.split(/\s+/);
    const typedWords = typedText.split(/\s+/);
    
    let mistakes = 0;
    // Word-by-word comparison (Prevents chain error)
    typedWords.forEach((word, i) => {
      if (word !== originalWords[i]) mistakes++;
    });

    const netWpm = Math.max(0, (totalWords - mistakes) / doc.allowedTime);

    setTypingResultData({
      totalChars,
      totalWords: Math.round(totalWords),
      mistakes,
      wpm: Math.round(netWpm),
      typedText: input,
      originalText: doc.text,
      timeTaken: doc.allowedTime
    });

    setIsActive(false); // Stop timer before navigating
    navigate('/typing-result');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 animate-in fade-in duration-500">
      
      {/* 📊 TOP DASHBOARD */}
      <div className="flex justify-between items-center mb-6 bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-2xl border-b-4 border-blue-600">
        <div>
          <h2 className="font-black uppercase text-blue-600 italic tracking-tighter text-xl">{doc.title}</h2>
          <p className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">Examination Mode: No Highlights</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Time Remaining</p>
            <p className={`text-3xl font-black font-mono ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
          </div>
          <button 
            onClick={() => setBackspaceDisabled(!backspaceDisabled)}
            className={`p-3 rounded-2xl transition-all active:scale-90 ${backspaceDisabled ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}
          >
            <span className="text-[10px] font-black uppercase tracking-tighter">Backspace: {backspaceDisabled ? 'OFF' : 'ON'}</span>
          </button>
        </div>
      </div>

      {/* 📄 ORIGINAL MATTER (STATIC) */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 mb-6 max-h-72 overflow-y-auto leading-relaxed text-xl font-medium text-slate-700 dark:text-slate-200 select-none no-scrollbar">
        {doc.text}
      </div>

      {/* ⌨️ TYPING INPUT AREA */}
      <div className="relative group">
        <textarea
          ref={textAreaRef}
          className="w-full h-72 p-10 rounded-[3.5rem] bg-white dark:bg-slate-800 shadow-2xl border-4 border-transparent focus:border-blue-600 outline-none text-xl font-mono leading-loose transition-all resize-none dark:text-white"
          placeholder="Type the matter as seen above..."
          value={input}
          onChange={handleInput}
          onKeyDown={(e) => {
            if (backspaceDisabled && e.key === 'Backspace') e.preventDefault();
          }}
          disabled={timeLeft === 0}
        />
        {!isActive && input.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[2px] rounded-[3.5rem] pointer-events-none">
                <p className="bg-blue-600 text-white px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest animate-bounce">Start typing to begin</p>
            </div>
        )}
      </div>

      {/* 🚀 ACTION BUTTONS */}
      <div className="mt-8 flex gap-6">
        <button onClick={handleStart} className="flex-1 bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all">Start Arena</button>
        <button onClick={handleSubmit} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all">Submit Assignment</button>
      </div>
    </div>
  );
};

export default TypingArena;
