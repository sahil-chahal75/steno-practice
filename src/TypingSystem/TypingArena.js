import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const TypingArena = ({ matter, setView, setResults, userEmail, userName }) => {
  const [typedText, setTypedText] = useState('');
  const [selectedTime, setSelectedTime] = useState(null); // 1, 3, 5, 10 Mins
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  // ⏱️ Timer Countdown Logic
  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isStarted) {
      calculateFinalResult();
    }
    return () => clearInterval(timerRef.current);
  }, [isStarted, timeLeft]);

  // 📜 Auto-Scroll Logic: Cursor hamesha dikhta rahega
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [typedText]);

  const startTest = (mins) => {
    setSelectedTime(mins);
    setTimeLeft(mins * 60);
    setIsStarted(true);
    setTypedText('');
    // Chhota sa delay focus ke liye taaki transition smooth ho
    setTimeout(() => textareaRef.current.focus(), 200);
  };

  const calculateFinalResult = async () => {
    setIsStarted(false);
    clearInterval(timerRef.current);

    const originalWords = matter.text.trim().split(/\s+/);
    const typedWords = typedText.trim().split(/\s+/);
    
    // 🚩 Full Error Logic: Punctuation, Case, Spelling = 1 Error
    let errors = 0;
    typedWords.forEach((word, index) => {
      if (word !== originalWords[index]) {
        errors++;
      }
    });

    // 📏 Word Calculation (Standard 5 Chars = 1 Word)
    const totalChars = typedText.length;
    const grossWpm = Math.round((totalChars / 5) / selectedTime);
    const netWpm = Math.max(0, Math.round(((totalChars / 5) - errors) / selectedTime));
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
      originalContent: matter.text,
      timeSpent: selectedTime,
      userEmail: userEmail || "Anonymous",
      userName: userName || "Student",
      submittedAt: new Date().toLocaleString()
    };

    // 📤 Save to Firebase for Admin Tracking
    try {
      await addDoc(collection(db, "typing_results"), {
        ...finalData,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Firebase Save Error:", e);
    }

    // 🚀 Switch to Result Page
    setResults(finalData);
    setView('result');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 🏁 Screen 1: Duration Selection
  if (!selectedTime) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest mb-8 italic">Select Test Duration</h2>
          <div className="grid grid-cols-2 gap-4">
            {[1, 3, 5, 10].map(m => (
              <button 
                key={m} 
                onClick={() => startTest(m)} 
                className="py-6 border-2 border-gray-100 rounded-2xl hover:border-blue-600 hover:bg-blue-50 font-black text-2xl text-gray-700 transition-all"
              >
                {m} MIN
              </button>
            ))}
          </div>
          <button onClick={() => setView('list')} className="mt-8 text-xs font-bold text-gray-400 uppercase underline">Back to Matters</button>
        </div>
      </div>
    );
  }

  // 🏁 Screen 2: Real Exam Interface
  return (
    <div className="min-h-screen bg-white p-4 md:p-8 font-sans select-none">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Bar: Title & Big Timer */}
        <div className="flex justify-between items-end mb-6 border-b-2 border-gray-100 pb-4">
          <div className="max-w-[70%]">
            <h1 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1 italic">Exam Matter</h1>
            <h2 className="text-xl font-bold text-gray-800 truncate uppercase">{matter.title}</h2>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-tighter">Time Remaining</p>
            <div className="text-4xl font-mono font-black text-red-600 leading-none">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Matter Box: Clean & Plain Text */}
        <div className="w-full h-56 p-6 bg-gray-50 border border-gray-200 rounded-2xl overflow-y-auto mb-6 text-2xl leading-relaxed text-gray-400 font-medium pointer-events-none">
          {matter.text}
        </div>

        {/* User Input Area */}
        <textarea
          ref={textareaRef}
          className="w-full h-80 p-8 border-2 border-gray-100 rounded-3xl text-2xl leading-relaxed outline-none focus:border-blue-600 bg-white shadow-sm font-mono text-gray-800 transition-all"
          placeholder="Start typing your examination matter here..."
          value={typedText}
          spellCheck="false"
          autoComplete="off"
          onChange={(e) => setTypedText(e.target.value)}
        />

        {/* Footer Actions */}
        <div className="mt-8 flex justify-between items-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Sahil's Steno Exam Mode Active</p>
          <button 
            onClick={() => { if(window.confirm("Are you sure you want to submit the test?")) calculateFinalResult(); }} 
            className="bg-black text-white px-12 py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-gray-800 transition-all"
          >
            Submit Test
          </button>
        </div>

      </div>
    </div>
  );
};

export default TypingArena;
  
