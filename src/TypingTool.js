import React, { useState, useEffect, useRef } from 'react';

const TypingTool = ({ doc, setView, setTestResult, darkMode }) => {
  const [typedText, setTypedText] = useState('');
  const [timeLeft, setTimeLeft] = useState(doc.allowedTime * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // 1. Timer Logic
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerActive, timeLeft]);

  // 2. Audio Progress Logic
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setCurrentTime(current);
      if (duration) setAudioProgress((current / duration) * 100);
    }
  };

  const handleMetadata = () => {
    if (audioRef.current) setAudioDuration(audioRef.current.duration);
  };

  // 3. Optimized Toggle (No Alert Pop-up)
  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.log("Audio loading or blocked by browser. Retrying...");
            // Manual retry logic without alert
            setTimeout(() => {
              audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }, 1000);
          });
      }
    }
  };

  const formatTime = (time) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    clearInterval(timerRef.current);
    if (audioRef.current) audioRef.current.pause();
    setTestResult(typedText);
    setView('result');
  };

  return (
    <div className="animate-in zoom-in duration-300 max-w-3xl mx-auto mt-4 px-2 pb-20">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setView('home')} className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 transition-colors">
          ← Exit Exam
        </button>
        
        <div className="text-right">
          <div className={`px-6 py-2 rounded-2xl font-black text-2xl shadow-lg ${isTimerActive ? (timeLeft < 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-slate-800 text-blue-600') : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">{isTimerActive ? 'Clock Running' : 'Timer Paused'}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-6 md:p-10 shadow-2xl border-t-8 border-blue-600 transition-colors">
        <h2 className="text-xl font-black text-blue-600 dark:text-blue-400 mb-6 uppercase text-center italic tracking-tighter">
          {doc.title}
        </h2>

        {/* 🎧 ADVANCED AUDIO PLAYER - Fixed for Drive Links */}
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2.5rem] mb-8 border border-slate-100 dark:border-slate-700 shadow-inner">
          <audio 
            ref={audioRef} 
            src={doc.audioUrl} 
            crossOrigin="anonymous" 
            preload="auto"
            onTimeUpdate={handleTimeUpdate} 
            onLoadedMetadata={handleMetadata}
            onEnded={() => setIsPlaying(false)}
          />
          
          <div className="flex items-center gap-4">
            <button onClick={toggleAudio} className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-xl transition-all active:scale-90 shrink-0 ${isPlaying ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}`}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            <div className="w-full space-y-2">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(audioDuration || 0)}</span>
              </div>
              
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                  style={{ width: `${audioProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center px-2">
             <button onClick={() => setIsTimerActive(true)} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${isTimerActive ? 'bg-green-100 text-green-600 opacity-50 cursor-default' : 'bg-green-500 text-white shadow-lg shadow-green-200 animate-bounce'}`}>
               {isTimerActive ? 'Timer Started' : 'Start Typing Now'}
             </button>
             <p className="text-[9px] font-bold text-slate-400 italic">Audio controls won't stop the clock</p>
          </div>
        </div>

        <textarea 
          className="w-full h-80 bg-slate-50 dark:bg-slate-900 dark:text-slate-100 p-6 rounded-[2rem] border-2 border-transparent focus:border-blue-500 outline-none font-medium text-lg leading-relaxed shadow-inner transition-all resize-none"
          placeholder="Start typing your transcription here..."
          value={typedText}
          onChange={(e) => {
            setTypedText(e.target.value);
            if (!isTimerActive) setIsTimerActive(true);
          }}
          spellCheck="false"
        />

        <button 
          onClick={handleSubmit}
          className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] mt-8 shadow-xl active:scale-95 transition-all"
        >
          Submit Final Exam
        </button>
      </div>
    </div>
  );
};

export default TypingTool;
