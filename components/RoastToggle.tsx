import React, { useState, useRef, useEffect } from 'react';
import { RoastType } from '../types';

interface RoastToggleProps {
  currentRoast: RoastType;
  onRoastChange: (roast: RoastType) => void;
}

export const RoastToggle: React.FC<RoastToggleProps> = ({ currentRoast, onRoastChange }) => {
  const roasts: RoastType[] = ['light', 'medium', 'dark'];
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPct, setDragPct] = useState(50);

  const POSITIONS = {
    light: 15,
    medium: 50,
    dark: 85
  };

  useEffect(() => {
    if (!isDragging) {
      setDragPct(POSITIONS[currentRoast]);
    }
  }, [currentRoast, isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();

    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let pct = (x / rect.width) * 100;
    
    // Clamp between 0 and 100
    pct = Math.max(0, Math.min(100, pct));
    setDragPct(pct);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);

    // Snap to nearest roast
    let closestRoast: RoastType = 'medium';
    // Thresholds: (15+50)/2 = 32.5, (50+85)/2 = 67.5
    if (dragPct < 32.5) closestRoast = 'light';
    else if (dragPct > 67.5) closestRoast = 'dark';
    else closestRoast = 'medium';
    
    onRoastChange(closestRoast);
  };

  const handleZoneClick = (roast: RoastType) => {
    if (!isDragging) {
      onRoastChange(roast);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 mb-8 w-full max-w-xs z-20">
      <div className="text-coffee-600 font-bold text-xs uppercase tracking-wider mb-2">Roast Level</div>
      
      {/* Track Container */}
      <div 
        ref={trackRef}
        className="relative w-full h-12 flex items-center justify-center select-none touch-none"
      >
        
        {/* Track Line */}
        <div className="absolute left-0 right-0 h-3 bg-coffee-200 rounded-full shadow-inner mx-2 overflow-hidden pointer-events-none">
             {/* Progress Bar reflecting current position */}
             <div 
                className="h-full bg-coffee-300 opacity-50"
                style={{ 
                    width: `${dragPct}%`,
                    transition: isDragging ? 'none' : 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)'
                }}
             />
        </div>

        {/* Click Zones (Underneath the bean) */}
        <div className="absolute inset-0 z-10 flex w-full h-full">
            <div onClick={() => handleZoneClick('light')} className="flex-1 cursor-pointer" title="Light Roast" />
            <div onClick={() => handleZoneClick('medium')} className="flex-1 cursor-pointer" title="Medium Roast" />
            <div onClick={() => handleZoneClick('dark')} className="flex-1 cursor-pointer" title="Dark Roast" />
        </div>

        {/* The Draggable Bean (Thumb) */}
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute top-1/2 -translate-y-1/2 w-10 h-10 z-30 cursor-grab active:cursor-grabbing drop-shadow-lg touch-none"
          style={{ 
            left: `${dragPct}%`, 
            transform: 'translate(-50%, -50%)',
            transition: isDragging ? 'none' : 'left 0.5s cubic-bezier(0.34,1.56,0.64,1)'
          }}
        >
          {/* Vector Coffee Bean Illustration */}
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible pointer-events-none">
            <g transform="rotate(-25, 50, 50)">
              {/* Bean Body */}
              <ellipse 
                cx="50" 
                cy="50" 
                rx="45" 
                ry="32" 
                fill="#8D6E63" 
                className="stroke-coffee-900" 
                strokeWidth="3"
              />
              {/* Shading */}
              <path 
                d="M15,65 Q30,85 50,85 T85,65" 
                fill="none" 
                stroke="#5D4037" 
                strokeWidth="0" 
                fillOpacity="0.2"
                className="fill-current text-coffee-900 mix-blend-multiply" 
              />
              <path 
                d="M20,60 Q50,90 80,60 C80,75 70,82 50,82 C30,82 20,75 20,60" 
                fill="#3E2723" 
                opacity="0.2"
              />
              {/* Crack */}
              <path 
                d="M15,50 Q35,35 50,50 T85,50" 
                fill="none" 
                stroke="#3E2723" 
                strokeWidth="5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              {/* Highlights */}
              <path 
                d="M18,52 Q36,38 50,52 T82,52" 
                fill="none" 
                stroke="#D7CCC8" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                opacity="0.4"
              />
              <ellipse cx="35" cy="35" rx="12" ry="6" transform="rotate(-10 35 35)" fill="#D7CCC8" opacity="0.3" />
            </g>
          </svg>
        </div>

      </div>

      {/* Labels below the slider */}
      <div className="flex justify-between w-full px-2 mt-1">
        {roasts.map((roast) => (
          <button
            key={roast}
            onClick={() => onRoastChange(roast)}
            className={`
              w-1/3 text-center font-hand text-lg transition-colors duration-300
              ${currentRoast === roast ? 'text-coffee-800 font-bold scale-110' : 'text-coffee-500 hover:text-coffee-700'}
            `}
          >
            {roast.charAt(0).toUpperCase() + roast.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};