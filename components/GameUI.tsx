
import React, { useState } from 'react';
import { SessionStats } from '../types';
import { zenAudio } from '../services/audioEngine';

interface GameUIProps {
  stats: SessionStats;
  message: string;
  showOverlay: boolean;
  onStart: () => void;
  gameStarted: boolean;
}

const GameUI: React.FC<GameUIProps> = ({ stats, message, showOverlay, onStart, gameStarted }) => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMute = !isMuted;
    setIsMuted(newMute);
    zenAudio.setMute(newMute);
  };

  const handleBegin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!gameStarted) zenAudio.start();
    onStart();
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-50">
      {/* HUD info */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="text-white/40 uppercase tracking-[0.3em] text-[10px] space-y-2">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
            Level <span className="text-white/80 font-bold">{stats.level}</span>
          </p>
          <p className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${stats.missCount > 7 ? 'bg-red-500 animate-pulse' : 'bg-white/40'}`}></span>
            Stability <span className={`font-bold ${stats.missCount > 7 ? 'text-red-400' : 'text-white/80'}`}>{10 - stats.missCount}/10</span>
          </p>
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
              Streak <span className="text-white/80 font-bold">{stats.streak}</span>
            </p>
            <p className="flex items-center gap-2 opacity-60">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50"></span>
              Best <span className="text-white/80 font-bold">{stats.highScore}</span>
            </p>
          </div>
        </div>
        
        <button 
          onClick={toggleMute}
          className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md active:scale-90"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.38.28-.81.52-1.25.7v2.06c.99-.19 1.91-.58 2.71-1.12l2.02 2.02L21 20.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
          ) : (
            <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          )}
        </button>
      </div>

      {/* Start Overlay only */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {showOverlay && (
          <div className="bg-black/60 backdrop-blur-2xl p-16 rounded-[60px] border border-white/5 text-center pointer-events-auto max-w-lg animate-in fade-in zoom-in duration-1000 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <h1 className="text-4xl font-light text-white mb-4 tracking-tighter">ZenPulse</h1>
            <h2 className="text-xl font-light text-white/60 mb-10 italic leading-relaxed font-serif">
              {message}
            </h2>
            <button 
              onClick={handleBegin}
              className="px-12 py-5 bg-white text-black rounded-full text-[10px] font-bold tracking-[0.4em] uppercase hover:bg-white/90 hover:tracking-[0.5em] transition-all active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.15)]"
            >
              Begin Journey
            </button>
          </div>
        )}
      </div>

      {/* Persistent subtle footer when playing */}
      {!showOverlay && (
        <div className="text-center text-white/10 text-[8px] tracking-[0.5em] uppercase animate-pulse pb-6 font-semibold">
          Focus is the anchor in the storm
        </div>
      )}
    </div>
  );
};

export default GameUI;
