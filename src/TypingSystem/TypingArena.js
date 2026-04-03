import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const TypingArena = ({ matter, setView, setResults, userEmail, userName }) => {
  const [typedText, setTypedText] = useState('');
  const [selectedTime, setSelectedTime] = useState(5); // Default 5 Mins
  const [timeLeft, setTimeLeft] = useState(300); // 5 * 60
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

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

  // Handle Time Selection (Before starting)
  const handleTimeChange = (mins) => {
    if (!isStarted) {
      setSelectedTime(mins);
      setTimeLeft(mins * 60);
    }
  };

  // ⌨️ Start Timer on First Key Stroke
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
    
    // 🚩 Professional Error Calculation
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
    <div className="min-h-screen bg-slate-50 font-sans select-none">
      
      {/* 🏛️ TOP FORMAL HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-wrap justify-between items-center gap-4">
          
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest transition-colors">← Exit</button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <div>
              <h1 className="text-sm font-black text-slate-800 uppercase italic leading-none">{matter.title}</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Official Examination Mode</p>
            </div>
          </div>

          {/* TIMER OPTIONS (Visible only before start) */}
          <div className="flex items-center gap-3">
            {!isStarted && !isFinished && (
              <div className="flex bg-slate-100 p-1 rounded-xl mr-6">
                {[5, 10, 15].map(m => (
                  <button 
                    key={m} 
                    onClick={() => handleTimeChange(m)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${selectedTime === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {m} Min
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Time Remaining</span>
              <div className={`text-3xl font-mono font-black leading-none ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 gap-6">
        
        {/* 📄 ORIGINAL MATTER BOX (FULL WIDTH) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 flex justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Source Text Block</span>
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic">Passage Mode Active</span>
          </div>
          <div className="p-8 text-xl md:text-2xl leading-[1.8] text-slate-400 font-medium whitespace-pre-wrap text-justify select-none pointer-events-none max-h-[40vh] overflow-y-auto">
            {matter.text}
          </div>
        </div>

        {/* ⌨️ INPUT AREA */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            className="w-full h-[45vh] p-8 rounded-3xl border-2 border-slate-200 text-xl md:text-2xl leading-relaxed outline-none focus:border-blue-500 bg-white shadow-xl font-mono text-slate-800 transition-all resize-none"
            placeholder={isStarted ? "" : "CLICK HERE AND START TYPING TO BEGIN THE TIMER..."}
            value={typedText}
            spellCheck="false"
            autoComplete="off"
            onChange={handleTyping}
            onPaste={(e) => e.preventDefault()} // No cheating!
          />
          
          {/* Bottom Action */}
          <div className="absolute bottom-6 right-6">
            <button 
              onClick={() => { if(window.confirm("CONFIRM SUBMISSION: Are you sure you want to end the test now?")) finishTest(); }} 
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
            >
              Submit Examination 🚀
            </button>
          </div>
        </div>

        {/* USER INFO FOOTER */}
        <div className="flex justify-between items-center px-4">
          <div className="flex gap-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate: <span className="text-slate-800">{userName}</span></p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Words Typed: <span className="text-blue-600">{typedText.trim() === "" ? 0 : typedText.trim().split(/\s+/).length}</span></p>
          </div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">© STENOPULSE EXAMINATION SYSTEM V2.0</p>
        </div>

      </div>
    </div>
  );
};

export default TypingArena;
