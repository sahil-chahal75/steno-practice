import React, { useState, useEffect, useRef } from 'react';

const TypingTool = ({ doc, setView, setTestResult, darkMode }) => {
  const [typedText, setTypedText] = useState('');
  const [timeLeft, setTimeLeft] = useState(doc.allowedTime * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // 1. Timer Logic (Sirf tab chalega jab isTimerActive true hoga)
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerActive, timeLeft]);

  // 2. Audio Control (Ab ye timer ko touch nahi karega)
  const toggleAudio = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 3. Start Typing Function
  const startExamClock = () => {
    if (!isTimerActive) {
      setIsTimerActive(true);
    }
  };

  const handleSubmit = () => {
    clearInterval(timerRef.current);
    if (audioRef.current) audioRef.current.pause();
    setTestResult(typedText);
    setView('result');
  };

  return (
    <div className="animate-in zoom-in duration-300 max-w-3xl mx-auto mt-4">
      {/* Header with Countdown */}
      <div className="flex justify-between items-center mb-6 px-2">
        <button onClick={() => setView('home')} className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-blue-600 transition-colors">
          ← Exit Exam
        </button>
        
        <div className="flex flex-col items-end">
          <div className={`px-6 py-2 rounded-2xl font-black text-2xl shadow-lg ${isTimerActive ? (timeLeft < 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-slate-800 text-blue-600') : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          {!isTimerActive && <span className="text-[9px] font-black text-amber-500 uppercase mt-1">Timer Paused</span>}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 shadow-2xl border-t-8 border-blue-600 transition-colors">
        <h2 className="text-xl font-black text-blue-600 dark:text-blue-400 mb-6 uppercase text-center italic tracking-tighter">
          {doc.title}
        </h2>

        {/* Audio Box - No Timer Trigger Here */}
        <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-3xl mb-8 flex items-center justify-between border border-slate-100 dark:border-slate-700">
          <audio ref={audioRef} src={doc.audioUrl} onEnded={() => setIsPlaying(false)} />
          <div className="flex items-center gap-4">
            <button onClick={toggleAudio} className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transition-all active:scale-90 ${isPlaying ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}`}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black dark:text-slate-300 uppercase tracking-widest">{isPlaying ? 'Listening Mode' : 'Audio Paused'}</p>
              <p className="text-[9px] text-slate-400">Timer will not start with audio</p>
            </div>
          </div>
          
          {/* Start Typing Button */}
          {!isTimerActive && (
            <button 
              onClick={startExamClock}
              className="bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg animate-bounce"
            >
              Start Typing Now
            </button>
          )}
        </div>

        {/* Typing Area */}
        <textarea 
          className="w-full h-80 bg-slate-50 dark:bg-slate-900 dark:text-slate-100 p-6 rounded-[2rem] border-2 border-transparent focus:border-blue-500 outline-none font-medium text-lg leading-relaxed shadow-inner transition-all resize-none"
          placeholder="Type here... (Timer starts on first character)"
          value={typedText}
          onChange={(e) => {
            setTypedText(e.target.value);
            startExamClock(); // Pehla word likhte hi timer shuru
          }}
          spellCheck="false"
        />

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-4 mt-8">
          <button 
            onClick={handleSubmit}
            className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
          >
            Submit Final Exam
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-slate-400 font-bold text-[9px] uppercase tracking-widest px-10">
        Rules: Timer starts only when you click 'Start Typing' or begin typing. ✍️
      </div>
    </div>
  );
};

export default TypingTool;
            
