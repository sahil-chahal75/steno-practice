import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TypingArena = ({ doc, setTypingResultData }) => {
  const [input, setInput] = useState('');
  const [selectedTime, setSelectedTime] = useState(10); // Default 10 min
  const [timeLeft, setTimeLeft] = useState(600);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [backspaceDisabled, setBackspaceDisabled] = useState(false);
  
  const textAreaRef = useRef(null);
  const navigate = useNavigate();

  // Formal Exit Warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isActive && !isFinished) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to exit the examination? Your progress will not be saved.";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive, isFinished]);

  // Timer Logic
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      clearInterval(interval);
      calculateAndSubmit();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimeChange = (mins) => {
    if (!isActive) {
      setSelectedTime(mins);
      setTimeLeft(mins * 60);
    }
  };

  const handleStart = () => {
    if (!isActive) {
      setIsActive(true);
      setTimeout(() => textAreaRef.current?.focus(), 100);
    }
  };

  const calculateAndSubmit = () => {
    setIsFinished(true);
    const typedText = input.trim();
    if (typedText.length === 0) {
      alert("Evaluation failed: No input detected.");
      return;
    }

    // SAHIL'S PROFESSIONAL FORMULA
    const totalChars = input.length; 
    const totalWords = totalChars / 5;
    
    // Looping Logic: Hum original text ko repeat karenge check karne ke liye
    const originalWords = doc.text.trim().split(/\s+/);
    const typedWords = typedText.split(/\s+/);
    
    let mistakes = 0;
    typedWords.forEach((word, i) => {
      // Logic for infinite loop comparison
      const originalWord = originalWords[i % originalWords.length];
      if (word !== originalWord) mistakes++;
    });

    const netWpm = Math.max(0, (totalWords - mistakes) / selectedTime);

    setTypingResultData({
      totalChars,
      totalWords: Math.round(totalWords),
      mistakes,
      wpm: Math.round(netWpm),
      typedText: input,
      originalText: doc.text,
      timeTaken: selectedTime
    });

    navigate('/typing-result');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 animate-in fade-in duration-700">
      
      {/* 📊 HEADER & TIME SELECTION */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-2xl mb-6 border-b-8 border-green-600 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">{doc.title}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Formal Assessment Arena</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-700 p-2 rounded-2xl">
          {[1, 3, 5, 10].map(m => (
            <button 
              key={m} 
              onClick={() => handleTimeChange(m)}
              disabled={isActive}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedTime === m ? 'bg-green-600 text-white shadow-md' : 'text-slate-400'}`}
            >
              {m} MIN
            </button>
          ))}
        </div>

        <div className="text-center md:text-right min-w-[120px]">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Countdown</p>
          <p className={`text-4xl font-black font-mono ${timeLeft < 60 ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </p>
        </div>
      </div>

      {/* 📄 MATTER DISPLAY (FULL VIEW) */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[3rem] border-2 border-slate-200 dark:border-slate-800 mb-6 shadow-inner overflow-y-auto max-h-[400px]">
        <p className="text-xl leading-relaxed text-slate-700 dark:text-slate-200 font-medium select-none text-justify">
          {doc.text}
        </p>
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-black text-blue-600 uppercase italic">
            Note: If you finish the text before time ends, please restart from the first word.
          </p>
        </div>
      </div>

      {/* ⌨️ INPUT BOX */}
      <div className="relative">
        <textarea
          ref={textAreaRef}
          className="w-full h-80 p-10 rounded-[3.5rem] bg-white dark:bg-slate-800 shadow-2xl border-4 border-transparent focus:border-green-600 outline-none text-xl font-mono leading-loose dark:text-white transition-all resize-none"
          placeholder="Examination is ready. Click 'Start Arena' to begin typing."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!isActive || isFinished}
          onKeyDown={(e) => {
            if (backspaceDisabled && e.key === 'Backspace') e.preventDefault();
          }}
        />
        
        {!isActive && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[3.5rem] flex items-center justify-center z-10">
            <button onClick={handleStart} className="bg-green-600 text-white px-12 py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
              Start Arena
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between items-center">
        <button 
          onClick={() => setBackspaceDisabled(!backspaceDisabled)}
          className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${backspaceDisabled ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}
        >
          Backspace: {backspaceDisabled ? 'LOCKED' : 'ENABLED'}
        </button>

        <button onClick={calculateAndSubmit} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-12 py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl">
          Submit Assessment
        </button>
      </div>
    </div>
  );
};

export default TypingArena;
