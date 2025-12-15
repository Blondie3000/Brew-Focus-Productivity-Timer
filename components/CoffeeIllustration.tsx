import React from 'react';

interface CoffeeIllustrationProps {
  progress: number; // 0 to 1
  isRunning: boolean;
  isComplete: boolean;
  liquidColor: string;
}

export const CoffeeIllustration: React.FC<CoffeeIllustrationProps> = ({ progress, isRunning, isComplete, liquidColor }) => {
  // Mug liquid logic
  // The liquid fills the mug body. 
  // Mug bottom is approx y=350, Top of liquid area is y=200
  const MAX_LIQUID_HEIGHT = 150; 
  const LIQUID_BASE_Y = 350; 
  const currentLiquidHeight = MAX_LIQUID_HEIGHT * progress;
  const currentY = LIQUID_BASE_Y - currentLiquidHeight;

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 mx-auto transition-all duration-500">
      <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-xl overflow-visible">
        <defs>
            {/* Clip path for the liquid inside the rounded mug */}
            <clipPath id="mugInterior">
                {/* U-shape matching the mug body */}
                <path d="M110,200 L110,280 Q110,360 200,360 Q290,360 290,280 L290,200 Z" />
            </clipPath>
            
            {/* Soft Shadow Filter */}
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="2" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2"/>
              </feComponentTransfer>
              <feMerge> 
                <feMergeNode in="offsetblur"/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
        </defs>

        {/* --- Mug Handle (Behind) --- */}
        <path d="M290,230 Q360,230 360,280 Q360,330 290,330" 
              fill="none" stroke="#F8BBD0" strokeWidth="22" strokeLinecap="round" />

        {/* --- Mug Body --- */}
        <g filter="url(#softShadow)">
            <path d="M100,200 L100,280 Q100,370 200,370 Q300,370 300,280 L300,200 Z" 
                  fill="#FFF0F5" stroke="#F48FB1" strokeWidth="3" />
        </g>
        
        {/* --- Liquid Content --- */}
        <g clipPath="url(#mugInterior)">
           {/* Background of inside mug (empty) */}
           <rect x="0" y="0" width="400" height="400" fill="#FCE4EC" />
           
           {/* Rising Liquid */}
           <rect x="0" y={currentY} width="400" height="400" fill={liquidColor} className="transition-all duration-700 ease-in-out" />
           
           {/* Glossy Surface Line (Meniscus) */}
           <ellipse cx="200" cy={currentY} rx="95" ry="12" fill="#FFFFFF" fillOpacity="0.3" />
           
           {/* Internal Shine/Reflection in Liquid */}
           {progress > 0.2 && (
             <path d="M130,320 Q200,340 270,320" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeOpacity="0.2" strokeLinecap="round" />
           )}
        </g>

        {/* --- Mug Highlights (Anime Style) --- */}
        {/* Vertical gloss on the side */}
        <path d="M115,220 Q115,320 145,340" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeOpacity="0.7" strokeLinecap="round" />
        {/* Small dot highlight */}
        <circle cx="280" cy="230" r="4" fill="#FFFFFF" fillOpacity="0.9" />

        {/* --- Kawaii Face (Subtle & Cute) --- */}
        <g transform="translate(0, 40)" opacity="0.8">
             {/* Left Eye */}
             <ellipse cx="165" cy="270" rx="4" ry="6" fill="#5D4037" />
             {/* Right Eye */}
             <ellipse cx="235" cy="270" rx="4" ry="6" fill="#5D4037" />
             {/* Tiny Mouth */}
             <path d="M195,272 Q200,278 205,272" fill="none" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
             {/* Blush */}
             <ellipse cx="155" cy="278" rx="7" ry="4" fill="#F48FB1" opacity="0.5" />
             <ellipse cx="245" cy="278" rx="7" ry="4" fill="#F48FB1" opacity="0.5" />
        </g>

        {/* --- Steam Animation (Appears when complete) --- */}
        {isComplete && (
           <g transform="translate(0, -10)">
             {/* Middle Large Wriggle */}
             <path 
               d="M200,200 Q220,170 200,150 T200,100" 
               stroke="#FFFFFF" 
               strokeWidth="12" 
               fill="none" 
               strokeLinecap="round"
               opacity="0.8"
               className="animate-steam" 
               style={{ animationDelay: '0.5s' }} 
             />
             
             {/* Left Small Wriggle */}
             <path 
               d="M165,210 Q175,190 165,170 T165,140" 
               stroke="#FFFFFF" 
               strokeWidth="8" 
               fill="none" 
               strokeLinecap="round"
               opacity="0.6"
               className="animate-steam" 
               style={{ animationDelay: '1.2s' }} 
             />

              {/* Right Small Wriggle */}
             <path 
               d="M235,210 Q225,190 235,170 T235,140" 
               stroke="#FFFFFF" 
               strokeWidth="8" 
               fill="none" 
               strokeLinecap="round"
               opacity="0.6"
               className="animate-steam" 
               style={{ animationDelay: '0.8s' }} 
             />
           </g>
        )}

        {/* --- Pour Over Filter Cone (Fades out quickly when complete) --- */}
        <g 
            transform={isComplete ? "translate(0, -50)" : "translate(0, -10)"} 
            style={{ 
                opacity: isComplete ? 0 : 1, 
                transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                pointerEvents: 'none'
            }}
        >
            {/* Filter Holder (Blue Pastel) */}
            <path d="M130,200 L110,120 L290,120 L270,200 Z" 
                  fill="#E3F2FD" stroke="#90CAF9" strokeWidth="3" strokeLinejoin="round" />
            
            {/* Filter Rim */}
            <path d="M105,120 L295,120" stroke="#90CAF9" strokeWidth="3" strokeLinecap="round" />

            {/* Filter Paper (White) */}
            <path d="M135,120 L150,180 L250,180 L265,120 Z" fill="#FFFFFF" opacity="0.9" />
            
            {/* Coffee Grounds (Mound) */}
            <path d="M140,120 Q200,90 260,120" fill="#6D4C41" />

            {/* Filter Highlight */}
            <path d="M125,130 L135,180" stroke="#FFFFFF" strokeWidth="4" strokeOpacity="0.6" strokeLinecap="round" />
        </g>

        {/* --- Drip Animation --- */}
        {isRunning && !isComplete && (
            <g className="animate-drip">
                {/* Teardrop shape */}
                <path 
                  d="M200,190 Q207,200 207,206 A7,7 0 1,1 193,206 Q193,200 200,190 Z" 
                  fill={liquidColor} 
                />
            </g>
        )}
      </svg>
    </div>
  );
};