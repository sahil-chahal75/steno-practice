import React, { useState, useEffect, useRef } from 'react';

const TypingTool = ({ doc, setView, setTestResult }) => {
  const [typedText, setTypedText] = useState('');
  const [timeLeft, setTimeLeft] = useState(doc.allowedTime * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  // ⏱️ Timer Logic (Pehle wala hi hai)
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerActive, timeLeft]);

  // 📜 Auto-Scroll Logic (Pehle wala hi hai)
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
    if (window.confirm("Are you sure you want to submit your transcription?")) {
      clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
      setTestResult(typedText);
      setView('result');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-900 pb-10 font-sans transition-colors">
      
      <div className="max-w-4xl mx-auto pt-6 px-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          
          <h1 className="text-2xl font-semibold text-center text-slate-800 dark:text-white mb-6">
            Steno Dictation Practice
          </h1>

          <div className="flex flex-col gap-4">
            
            <div className="text-slate-600 dark:text-slate-300 font-medium">
              Time Left: <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>

            <div className="bg-[#e9ecef] dark:bg-slate-700 p-3 rounded text-slate-700 dark:text-slate-200 font-medium border border-slate-300 dark:border-slate-600">
              {doc.title}
            </div>

            {/* 🎧 AUDIO PLAYER (Only Buffering Fix Added) */}
            <div className="w-full">
              <audio 
                ref={audioRef} 
                src={doc.audioUrl} 
                controls 
                preload="auto" 
                className="w-full h-12"
                onPlay={() => {}} 
              />
              <p className="text-[11px] text-slate-500 mt-2 italic">
                Note: Audio pre-loading enabled for better performance. Please wait up to 10 second for better audio .
              </p>
            </div>

            <textarea 
              ref={textareaRef}
              className="w-full h-[350px] p-4 border-2 border-slate-300 dark:border-slate-600 rounded outline-none focus:border-blue-500 text-lg md:text-xl leading-relaxed dark:bg-slate-900 dark:text-white resize-none shadow-inner overflow-y-auto"
              placeholder="Type your transcription here..."
              value={typedText}
              spellCheck="false"
              autoFocus
              onChange={(e) => {
                setTypedText(e.target.value);
                if (!isTimerActive && e.target.value.length > 0) {
                  setIsTimerActive(true);
                }
              }}
            />

            <div className="flex flex-col gap-2 mt-2">
              <button 
                onClick={() => setIsTimerActive(true)}
                className="w-full bg-[#3b71ca] hover:bg-[#3462b0] text-white py-3 rounded font-medium transition-colors uppercase text-sm tracking-wide"
              >
                Start
              </button>
              
              <button 
                onClick={handleSubmit}
                className="w-full bg-[#3b71ca] hover:bg-[#3462b0] text-white py-3 rounded font-medium transition-colors uppercase text-sm tracking-wide"
              >
                Submit
              </button>
            </div>

            <div className="w-full bg-[#e9ecef] h-4 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-[#d1e7dd] h-full transition-all duration-500" 
                style={{ width: `${(typedText.length / 500) * 100}%` }}
              ></div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingTool;
