import React, { useState, useEffect, useRef } from 'react';

const TypingTool = ({ doc, setView, setTestResult }) => {
  const [typedText, setTypedText] = useState('');
  const [timeLeft, setTimeLeft] = useState(doc.allowedTime * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // Timer Logic
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerActive, timeLeft]);

  // Audio Progress & Metadata
  const onTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) setAudioProgress((current / duration) * 100);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) setAudioDuration(audioRef.current.duration);
  };

  // 🎧 FORCE PLAY LOGIC
  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Force reload if stuck
      if (audioRef.current.readyState === 0) {
        audioRef.current.load();
      }
      
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Playback Error:", err);
          // Try one more time after interaction
          setIsPlaying(false);
        });
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
    <div className="max-w-3xl mx-auto mt-4 px-2 pb-20 animate-in zoom-in duration-300">
      {/* Timer Display */}
      <div className="flex justify-end mb-6 text-right">
        <div className="bg-white dark:bg-slate-800 px-6 py-2 rounded-2xl shadow-xl border-b-4 border-blue-500">
          <span className={`text-2xl font-black ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
            {formatTime(timeLeft)}
          </span>
          <p className="text-[8px] font-black uppercase text-slate-400">Time Remaining</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-6 md:p-10 shadow-2xl transition-all">
        <h2 className="text-center font-black text-blue-600 uppercase italic mb-8 border-b dark:border-slate-700 pb-4">
          {doc.title}
        </h2>

        {/* 🎧 THE PLAYER BOX */}
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2.5rem] mb-10 shadow-inner border border-slate-100 dark:border-slate-700">
          <audio 
            ref={audioRef} 
            src={doc.audioUrl} 
            onTimeUpdate={onTimeUpdate} 
            onLoadedMetadata={onLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            preload="auto"
          />
          
          <div className="flex items-center gap-5">
            <button 
              onClick={toggleAudio} 
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transition-transform active:scale-90 ${isPlaying ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <div className="flex-1 space-y-2">
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 shadow-[0_0_10px_blue]" 
                  style={{ width: `${audioProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase italic">
                <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                <span>{formatTime(audioDuration || 0)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <button 
              onClick={() => setIsTimerActive(true)} 
              className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-tighter shadow-md transition-all ${isTimerActive ? 'bg-green-100 text-green-600' : 'bg-green-500 text-white animate-bounce'}`}
            >
              {isTimerActive ? 'Clock Started' : 'Start Typing Clock'}
            </button>
            <p className="text-[9px] font-bold text-slate-400 italic">Play audio first then start clock</p>
          </div>
        </div>

        <textarea 
          className="w-full h-80 bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-transparent focus:border-blue-500 outline-none font-medium text-lg leading-relaxed shadow-inner dark:text-white resize-none"
          placeholder="Transcription area..."
          value={typedText}
          onChange={(e) => {
            setTypedText(e.target.value);
            if (!isTimerActive) setIsTimerActive(true);
          }}
          spellCheck="false"
        />

        <button 
          onClick={handleSubmit} 
          className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] mt-8 shadow-2xl active:scale-95 transition-all"
        >
          Submit Final Exam
        </button>
      </div>
    </div>
  );
};

export default TypingTool;
