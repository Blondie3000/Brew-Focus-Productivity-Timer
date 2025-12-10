import React, { useState, useEffect } from 'react';
import { getBaristaMessage } from '../services/geminiService';

interface BaristaBotProps {
  show: boolean;
  isBreak: boolean;
}

export const BaristaBot: React.FC<BaristaBotProps> = ({ show, isBreak }) => {
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setLoading(true);
      getBaristaMessage(isBreak).then((msg) => {
        setMessage(msg);
        setLoading(false);
      });
    }
  }, [show, isBreak]);

  if (!show) return null;

  return (
    <div className="mt-6 mx-auto max-w-md animate-bounce-slow">
      <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-coffee-200 relative">
        {/* Speech Bubble Tail */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-t-2 border-l-2 border-coffee-200 rotate-45"></div>
        
        <div className="flex items-center gap-3">
          <div className="text-2xl">🤖☕</div>
          <div className="flex-1">
             <h4 className="font-bold text-coffee-800 text-sm uppercase tracking-wide mb-1">
               {loading ? "Brewing thoughts..." : "Barista Bot Says:"}
             </h4>
             <p className="text-coffee-600 font-hand text-lg leading-tight">
               {loading ? "..." : `"${message}"`}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
