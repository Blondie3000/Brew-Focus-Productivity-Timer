import React, { useState, useEffect, useRef } from 'react';
import { CoffeeIllustration } from './components/CoffeeIllustration';
import { BaristaBot } from './components/BaristaBot';
import { RoastToggle } from './components/RoastToggle';
import { TimerMode, MODES, RoastType } from './types';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';

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

const App: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [timeLeft, setTimeLeft] = useState(MODES[TimerMode.FOCUS].duration);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [customDuration, setCustomDuration] = useState(20 * 60);
  const [roast, setRoast] = useState<RoastType>('light');

  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsComplete(true);
      playNotification();
      if (mode === TimerMode.FOCUS || mode === TimerMode.CUSTOM) {
        setSessionCount(c => c + 1);
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => {
    if (timeLeft === 0 && !isActive) return;
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsComplete(false);
    setTimeLeft(mode === TimerMode.CUSTOM ? customDuration : MODES[mode].duration);
  };

  const changeMode = (newMode: TimerMode) => {
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
      {/* Changed to a melodic, bubbly marimba ringtone vibe */}
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

        {/* Time Display */}
        <div className="text-center mt-6 relative z-10 h-24 flex flex-col items-center justify-center">
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
          
          <div className="text-coffee-500 font-hand text-lg mt-2">
            {isActive 
              ? (mode === TimerMode.SHORT_BREAK || mode === TimerMode.LONG_BREAK ? "Enjoy your sip..." : "Brewing focus...") 
              : (isComplete ? "Brew Complete!" : (mode === TimerMode.CUSTOM ? "Set time & brew" : "Ready to brew?"))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-6 mt-8 relative z-10">
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