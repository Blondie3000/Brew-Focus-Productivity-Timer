import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CoffeeIllustration } from './components/CoffeeIllustration';
import { BaristaBot } from './components/BaristaBot';
import { RoastToggle } from './components/RoastToggle';
import { TimerMode, MODES, RoastType } from './types';
import { Play, Pause, RotateCcw, Coffee, Zap } from 'lucide-react';

const ROAST_THEMES = {
  light: {
    50: '#fdf8f6',
    100: '#f2e8e5',
    200: '#eaddd7',
    300: '#e0c2b2',
    400: '#d2a58e',
    500: '#b5836a',
    600: '#96664e',
    700: '#7d523e',
    800: '#664234',
    900: '#54362c',
    liquid: '#b5836a' // Light brown
  },
  medium: {
    50: '#f7f3e8',
    100: '#efe5d5',
    200: '#e0cfbb',
    300: '#d0b49f',
    400: '#c09a84',
    500: '#b08069',
    600: '#90604c',
    700: '#704535',
    800: '#553325',
    900: '#3b2117',
    liquid: '#7d523e' // Medium brown
  },
  dark: {
    // Inverted logic for Dark Mode
    50: '#1a1614', // Very dark background
    100: '#2c2420', // Card background
    200: '#3e322c',
    300: '#5a463d',
    400: '#7c6052',
    500: '#a48272',
    600: '#cbb0a1',
    700: '#dfccc1',
    800: '#ede0d8',
    900: '#f7f2ef', // Light text
    liquid: '#3e2723' // Deep dark brown
  }
};

// Inline Worker Code to avoid URL resolution issues in some environments
const WORKER_SCRIPT = `
let timerId = null;
let endTime = null;
let remainingTime = 0;

self.onmessage = function(e) {
  const { type, payload } = e.data;

  switch (type) {
    case 'START':
      if (timerId) clearInterval(timerId);
      // We use a target end time rather than just decrementing a counter.
      // This prevents drift if the thread sleeps.
      remainingTime = payload;
      endTime = Date.now() + (remainingTime * 1000);
      
      timerId = setInterval(() => {
        if (!endTime) return;
        const now = Date.now();
        const timeLeft = Math.ceil((endTime - now) / 1000);
        
        if (timeLeft <= 0) {
          clearInterval(timerId);
          timerId = null;
          self.postMessage({ type: 'COMPLETE' });
        } else {
          self.postMessage({ type: 'TICK', payload: timeLeft });
        }
      }, 100);
      break;
      
    case 'PAUSE':
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      if (endTime) {
        const now = Date.now();
        remainingTime = Math.ceil((endTime - now) / 1000);
      }
      break;
      
    case 'RESET':
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      remainingTime = 0;
      endTime = null;
      break;
  }
};
`;

const App: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [timeLeft, setTimeLeft] = useState(MODES[TimerMode.FOCUS].duration);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // sessionCount tracks TOTAL completed focus sessions for stats
  const [sessionCount, setSessionCount] = useState(0);
  
  // cycleCount tracks the 1-4 progress towards a long break
  const [cycleCount, setCycleCount] = useState(0); 

  const [customDuration, setCustomDuration] = useState(20 * 60);
  const [roast, setRoast] = useState<RoastType>('light');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker using Blob (Robust against URL resolution errors)
  useEffect(() => {
    const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  // Apply Theme CSS Variables
  useEffect(() => {
    const theme = ROAST_THEMES[roast];
    const root = document.documentElement;
    
    Object.keys(theme).forEach((key) => {
      if (key !== 'liquid') {
        root.style.setProperty(`--coffee-${key}`, theme[key as keyof typeof theme]);
      }
    });
  }, [roast]);

  // Calculate progress for the coffee fill (0 to 1)
  const totalTime = mode === TimerMode.CUSTOM ? customDuration : MODES[mode].duration;
  const progress = isComplete ? 1 : (totalTime - timeLeft) / totalTime;

  // --- CORE STATE MACHINE LOGIC ---
  const handleTimerComplete = useCallback(() => {
    playNotification();
    setIsComplete(true);

    // If Custom mode, just stop.
    if (mode === TimerMode.CUSTOM) {
      setIsActive(false);
      setSessionCount(c => c + 1);
      return;
    }

    // For automated modes, wait 2 seconds to show "Complete" state, then transition
    setTimeout(() => {
      let nextMode: TimerMode = TimerMode.FOCUS;
      let shouldResetCycle = false;
      let shouldIncrementTotal = false;

      // Determine Next State based on Current State
      if (mode === TimerMode.FOCUS) {
        shouldIncrementTotal = true;
        const nextCycle = cycleCount + 1;
        setCycleCount(nextCycle);

        // Logic: 4th completed focus session triggers Long Break
        if (nextCycle === 4) {
          nextMode = TimerMode.LONG_BREAK;
        } else {
          nextMode = TimerMode.SHORT_BREAK;
        }
      } 
      else if (mode === TimerMode.SHORT_BREAK) {
        nextMode = TimerMode.FOCUS;
      } 
      else if (mode === TimerMode.LONG_BREAK) {
        nextMode = TimerMode.FOCUS;
        shouldResetCycle = true;
      }

      // Apply State Changes
      if (shouldIncrementTotal) setSessionCount(prev => prev + 1);
      if (shouldResetCycle) setCycleCount(0);
      
      setMode(nextMode);
      const newDuration = MODES[nextMode].duration;
      setTimeLeft(newDuration);
      setIsComplete(false);
      setIsActive(true); // Auto-start the next phase
      
      // Start the worker for the new phase
      workerRef.current?.postMessage({ type: 'START', payload: newDuration });
    }, 2000);
  }, [mode, cycleCount, customDuration]);

  // Listen to Worker Messages
  useEffect(() => {
    if (!workerRef.current) return;

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === 'TICK') {
        setTimeLeft(payload);
      } else if (type === 'COMPLETE') {
        setTimeLeft(0);
        handleTimerComplete();
      }
    };
  }, [handleTimerComplete]); // Re-bind when state logic changes

  const toggleTimer = () => {
    if (timeLeft === 0 && !isActive) return;

    if (isActive) {
      // Pause
      workerRef.current?.postMessage({ type: 'PAUSE' });
    } else {
      // Start
      workerRef.current?.postMessage({ type: 'START', payload: timeLeft });
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    workerRef.current?.postMessage({ type: 'RESET' });
    setIsActive(false);
    setIsComplete(false);
    setTimeLeft(mode === TimerMode.CUSTOM ? customDuration : MODES[mode].duration);
  };

  const changeMode = (newMode: TimerMode) => {
    workerRef.current?.postMessage({ type: 'RESET' });
    setMode(newMode);
    setIsActive(false);
    setIsComplete(false);
    setTimeLeft(newMode === TimerMode.CUSTOM ? customDuration : MODES[newMode].duration);
  };

  const handleCustomHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    val = Math.max(0, Math.min(23, val));
    
    const currentMinutes = Math.floor((customDuration % 3600) / 60);
    const newDuration = (val * 3600) + (currentMinutes * 60);
    
    setCustomDuration(newDuration);
    setTimeLeft(newDuration);
  };

  const handleCustomMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    val = Math.max(0, Math.min(59, val));
    
    const currentHours = Math.floor(customDuration / 3600);
    const newDuration = (currentHours * 3600) + (val * 60);
    
    setCustomDuration(newDuration);
    setTimeLeft(newDuration);
  };

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed interaction required", e));
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-coffee-50 flex flex-col items-center justify-center p-4 font-sans text-coffee-900 transition-colors duration-700">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/221/221-preview.mp3" />
      
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-coffee-800 tracking-tight flex items-center justify-center gap-3">
          <Coffee size={40} className="text-coffee-600" />
          Brew & Focus
        </h1>
        <p className="text-coffee-500 mt-2 font-hand text-xl">Fill your cup with productivity</p>
      </header>

      {/* Roast Toggle */}
      <RoastToggle currentRoast={roast} onRoastChange={setRoast} />

      {/* Main Card */}
      <main className="bg-coffee-100 w-full max-w-lg rounded-[3rem] shadow-2xl p-8 border-4 border-coffee-200 relative overflow-hidden transition-colors duration-700">
        
        {/* Background decorative beans (subtle) */}
        <div className="absolute top-4 left-4 text-coffee-200 opacity-30 rotate-12">
          <Coffee size={60} />
        </div>
        <div className="absolute bottom-4 right-4 text-coffee-200 opacity-30 -rotate-12">
          <Coffee size={80} />
        </div>

        {/* Mode Toggles */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 relative z-10">
          {(Object.keys(MODES) as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => changeMode(m)}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                mode === m 
                  ? 'bg-coffee-600 text-coffee-50 shadow-md transform scale-105' 
                  : 'bg-coffee-200 text-coffee-700 hover:bg-coffee-300'
              }`}
            >
              {MODES[m].label}
            </button>
          ))}
        </div>

        {/* Visual Timer */}
        <div className="relative z-10">
          <CoffeeIllustration 
            progress={progress} 
            isRunning={isActive} 
            isComplete={isComplete} 
            liquidColor={ROAST_THEMES[roast].liquid}
          />
        </div>

        {/* Cycle Progress Dots (Only visible in standard modes) */}
        {mode !== TimerMode.CUSTOM && (
          <div className="relative z-10 flex justify-center items-center gap-2 mt-4">
             <span className="text-xs font-bold text-coffee-400 uppercase tracking-widest">Cycle Progress</span>
             <div className="flex gap-1">
               {[1, 2, 3, 4].map((i) => (
                 <div 
                   key={i} 
                   className={`w-3 h-3 rounded-full border border-coffee-400 transition-all duration-300 ${
                     cycleCount >= i ? 'bg-coffee-600 scale-110' : 'bg-transparent'
                   }`}
                   title={`Session ${i}`}
                 />
               ))}
             </div>
          </div>
        )}

        {/* Time Display */}
        <div className="text-center mt-2 relative z-10 h-24 flex flex-col items-center justify-center">
          {mode === TimerMode.CUSTOM && !isActive && !isComplete ? (
             <div className="flex items-center justify-center gap-2 animate-bounce-slow">
               {/* Hours */}
               <div className="flex flex-col items-center">
                 <input 
                   type="number" 
                   min="0" 
                   max="23"
                   value={Math.floor(customDuration / 3600)}
                   onChange={handleCustomHoursChange}
                   className="text-5xl md:text-6xl font-bold text-coffee-800 font-mono bg-transparent w-24 text-center focus:outline-none focus:border-b-4 focus:border-coffee-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-coffee-300"
                   placeholder="0"
                 />
                 <span className="text-sm font-hand text-coffee-500 mt-1">hrs</span>
               </div>
               
               <span className="text-4xl md:text-6xl font-bold text-coffee-400 mb-6">:</span>
               
               {/* Minutes */}
               <div className="flex flex-col items-center">
                 <input 
                   type="number" 
                   min="0" 
                   max="59"
                   value={Math.floor((customDuration % 3600) / 60)}
                   onChange={handleCustomMinutesChange}
                   className="text-5xl md:text-6xl font-bold text-coffee-800 font-mono bg-transparent w-24 text-center focus:outline-none focus:border-b-4 focus:border-coffee-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-coffee-300"
                   placeholder="00"
                 />
                 <span className="text-sm font-hand text-coffee-500 mt-1">mins</span>
               </div>
             </div>
          ) : (
            <div className={`font-bold text-coffee-800 font-mono tracking-wider tabular-nums ${timeLeft >= 3600 ? 'text-5xl md:text-6xl' : 'text-6xl md:text-7xl'}`}>
              {formatTime(timeLeft)}
            </div>
          )}
          
          <div className="text-coffee-500 font-hand text-lg mt-2 flex items-center gap-2">
            {isActive && <Zap size={16} className="animate-pulse text-coffee-400" />}
            {isActive 
              ? (mode === TimerMode.SHORT_BREAK || mode === TimerMode.LONG_BREAK ? "Relaxing..." : "Focusing...") 
              : (isComplete ? "Brew Complete!" : (mode === TimerMode.CUSTOM ? "Set time & brew" : "Ready to brew?"))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-6 mt-6 relative z-10">
          <button 
            onClick={toggleTimer}
            disabled={timeLeft === 0 && !isActive}
            className={`w-16 h-16 rounded-full text-coffee-50 flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95 ${timeLeft === 0 && !isActive ? 'bg-coffee-300 cursor-not-allowed' : 'bg-coffee-600 hover:bg-coffee-700 hover:scale-110'}`}
          >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          
          <button 
            onClick={resetTimer}
            className="w-12 h-12 rounded-full bg-coffee-200 text-coffee-600 flex items-center justify-center hover:bg-coffee-300 hover:rotate-90 transition-all duration-300"
          >
            <RotateCcw size={24} />
          </button>
        </div>

        {/* Gemini Integration */}
        <BaristaBot 
          show={isActive || isComplete} 
          isBreak={mode === TimerMode.SHORT_BREAK || mode === TimerMode.LONG_BREAK} 
        />

      </main>

      {/* Stats Footer */}
      <footer className="mt-8 text-center text-coffee-400">
        <p className="font-hand text-lg">
          Cups brewed today: <span className="font-bold text-coffee-600 text-2xl mx-1">{sessionCount}</span> ☕
        </p>
      </footer>
    </div>
  );
};

export default App;