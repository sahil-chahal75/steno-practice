import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const TypingArena = ({ matter, setView, setResults, userEmail, userName }) => {
  const [typedText, setTypedText] = useState('');
  const [selectedTime, setSelectedTime] = useState(5);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const timerRef = useRef(null);
  const textareaRef = useRef(null);
  const matterBoxRef = useRef(null);

  // ⏱️ Countdown Logic
  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isStarted) {
      finishTest();
    }
    return () => clearInterval(timerRef.current);
  }, [isStarted, timeLeft]);

  // 🔄 Smart Auto-Scroll Logic for Original Matter
  useEffect(() => {
    if (isStarted && matterBoxRef.current) {
      const typedWordsCount = typedText.trim().split(/\s+/).length;
      const totalWords = matter.text.split(/\s+/).length;
      
      // Calculate percentage of progress
      const progress = typedWordsCount / totalWords;
      const scrollHeight = matterBoxRef.current.scrollHeight;
      const clientHeight = matterBoxRef.current.clientHeight;

      // Agar bacha 30% se zyada type kar chuka hai toh smooth scroll shuru karega
      if (progress > 0.2) {
        matterBoxRef.current.scrollTo({
          top: (scrollHeight - clientHeight) * progress,
          behavior: 'smooth'
        });
      }
    }
  }, [typedText, isStarted, matter.text]);

  const handleTimeChange = (mins) => {
    if (!isStarted) {
      setSelectedTime(mins);
      setTimeLeft(mins * 60);
    }
  };

  const handleTyping = (e) => {
    if (!isStarted && !isFinished && e.target.value.length > 0) {
      setIsStarted(true);
    }
    setTypedText(e.target.value);
  };

  const finishTest = async () => {
    setIsStarted(false);
    setIsFinished(true);
    clearInterval(timerRef.current);

    const originalText = matter.text.trim();
    const originalWords = originalText.split(/\s+/);
    const typedWords = typedText.trim().split(/\s+/);
    
    let errors = 0;
    typedWords.forEach((word, index) => {
      if (word !== originalWords[index]) {
        errors++;
      }
    });

    const totalChars = typedText.length;
    const timeSpentInMins = selectedTime - (timeLeft / 60);
    const actualTime = timeSpentInMins > 0 ? timeSpentInMins : selectedTime;

    const grossWpm = Math.round((totalChars / 5) / actualTime);
    const netWpm = Math.max(0, Math.round(((totalChars / 5) - errors) / actualTime));
    const accuracy = typedWords.length > 0 
      ? Math.max(0, Math.round(((typedWords.length - errors) / typedWords.length) * 100)) 
      : 0;

    const finalData = {
      matterTitle: matter.title,
      grossWpm,
      netWpm,
      accuracy,
      totalErrors: errors,
      typedContent: typedText,
      originalContent: originalText,
      timeSpent: selectedTime,
      userEmail: userEmail || "Anonymous",
      userName: userName || "Student",
      submittedAt: new Date().toLocaleString()
    };

    try {
      await addDoc(collection(db, "typing_results"), {
        ...finalData,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Database Save Error:", e);
    }

    setResults(finalData);
    setView('result');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans select-none overflow-hidden h-screen flex flex-col">
      
      {/* 🏛️ FIXED TOP HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 shadow-sm z-50">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="text-slate-400 hover:text-blue-600 font-bold text-[10px] uppercase tracking-widest">← Exit</button>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <h1 className="text-sm font-black text-slate-800 uppercase italic truncate max-w-[300px]">{matter.title}</h1>
          </div>

          <div className="flex items-center gap-6">
            {!isStarted && !isFinished && (
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {[5, 10, 15].map(m => (
                  <button key={m} onClick={() => handleTimeChange(m)}
                    className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${selectedTime === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  > {m} Min </button>
                ))}
              </div>
            )}
            <div className="text-right">
              <span className="text-[8px] font-black text-red-500 uppercase block tracking-tighter">Time Left</span>
              <div className="text-2xl font-mono font-black text-slate-800 leading-none">{formatTime(timeLeft)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🧩 MAIN EXAM AREA (FULL SCREEN NO SCROLL ON BODY) */}
      <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 overflow-hidden">
        
        {/* 📄 ORIGINAL MATTER BOX (Dynamic height) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 max-h-[45%]">
          <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 flex justify-between">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Source Text (Auto-Scrolling Enabled)</span>
          </div>
          <div 
            ref={matterBoxRef}
            className="p-6 md:p-8 text-lg md:text-xl leading-[1.8] text-slate-400 font-medium whitespace-pre-wrap text-justify overflow-y-auto scroll-smooth"
            style={{ fontSize: matter.text.length > 1000 ? '1.1rem' : '1.4rem' }}
          >
            {matter.text}
          </div>
        </div>

        {/* ⌨️ INPUT AREA */}
        <div className="flex-1 flex flex-col min-h-[45%]">
          <textarea
            ref={textareaRef}
            className="flex-1 w-full p-8 rounded-2xl border-2 border-slate-200 text-xl md:text-2xl leading-relaxed outline-none focus:border-blue-500 bg-white shadow-lg font-mono text-slate-800 resize-none transition-all"
            placeholder={isStarted ? "" : "START TYPING HERE TO BEGIN THE TEST..."}
            value={typedText}
            spellCheck="false"
            autoComplete="off"
            onChange={handleTyping}
            onPaste={(e) => e.preventDefault()}
          />
        </div>

        {/* 🛠️ FOOTER ACTIONS */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex gap-6 items-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">User: <span className="text-slate-800">{userName}</span></p>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Words: <span className="text-blue-600">{typedText.trim() === "" ? 0 : typedText.trim().split(/\s+/).length}</span></p>
          </div>
          <button 
            onClick={() => { if(window.confirm("SUBMIT TEST?")) finishTest(); }} 
            className="bg-blue-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-700 transition-all active:scale-95"
          >
            Submit Now 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default TypingArena;
