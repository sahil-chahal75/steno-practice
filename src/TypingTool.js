import React, { useState, useEffect, useRef } from 'react';

const TypingTool = ({ doc, setView, setTestResult }) => {
  const [typedText, setTypedText] = useState('');
  const [timeLeft, setTimeLeft] = useState(doc.allowedTime * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const textareaRef = useRef(null); // Auto-scroll ke liye

  // ⏱️ Timer Logic
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerActive, timeLeft]);

  // 📜 Auto-Scroll Logic: Jab bhi text change ho, niche scroll karo
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [typedText]);

  const formatTime = (time) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    if (window.confirm("Are you sure you want to submit?")) {
      clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
      setTestResult(typedText);
      setView('result');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 pb-10 animate-in fade-in duration-500">
      
      {/* 🟢 TOP BAR: Simple & Slim */}
      <div className="flex justify-between items-center mb-4 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border dark:border-slate-700">
        <h2 className="font-black text-xs uppercase tracking-tighter text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
          {doc.title}
        </h2>
        <div className="flex items-center gap-4">
          <span className={`font-mono text-xl font-black ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
            {formatTime(timeLeft)}
          </span>
          <button 
            onClick={() => setView('home')} 
            className="text-[10px] font-black uppercase text-red-500 border border-red-200 px-2 py-1 rounded-md"
          >
            Exit
          </button>
        </div>
      </div>

      {/* 🎧 MINIMAL PLAYER */}
      <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-2xl mb-4 border dark:border-slate-800 flex flex-wrap items-center gap-3">
        <audio 
          ref={audioRef} 
          src={doc.audioUrl} 
          controls 
          className="h-10 flex-1 min-w-[200px]"
          onPlay={() => setIsTimerActive(true)}
        />
        <p className="text-[9px] font-bold text-slate-400 uppercase italic">
          Timer starts automatically on Play
        </p>
      </div>

      {/* ⌨️ TYPING AREA: Optimized for Focus */}
      <div className="relative group">
        <textarea 
          ref={textareaRef}
          className="w-full h-[60vh] md:h-[65vh] bg-white dark:bg-slate-800 p-5 md:p-8 rounded-3xl border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-xl md:text-2xl leading-relaxed shadow-2xl dark:text-white resize-none transition-all overflow-y-auto"
          placeholder="Start transcribing here..."
          value={typedText}
          onChange={(e) => {
            setTypedText(e.target.value);
            if (!isTimerActive) setIsTimerActive(true);
          }}
          spellCheck="false"
          autoFocus
        />
        
        {/* Floating Word Count (Optional but helpful) */}
        <div className="absolute bottom-5 right-5 bg-blue-600/10 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black">
          {typedText.trim() ? typedText.trim().split(/\s+/).length : 0} WORDS
        </div>
      </div>

      {/* 🔵 SUBMIT BUTTON: Full Width & Large */}
      <button 
        onClick={handleSubmit} 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] mt-6 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <span>Submit Final Transcription</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7" />
        </svg>
      </button>

      {/* Footer Info */}
      <p className="text-center mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
        StenoPulse Exam Mode • Keyboard typing enabled
      </p>

    </div>
  );
};

export default TypingTool;
