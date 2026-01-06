
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, MindfulObject, Difficulty, SessionStats } from './types';
import { MINDFUL_OBJECTS, BASE_DIFFICULTY } from './constants';
import { getZenFeedback, generateMindfulObject } from './services/geminiService';
import PulsatingRing from './components/PulsatingRing';
import GameUI from './components/GameUI';
import { zenAudio } from './services/audioEngine';

const HIGH_SCORE_KEY = 'zenpulse_highscore';

// Fixed errors:
// 1. Removed manual Window interface augmentation for 'aistudio' which conflicted with existing definitions.
// 2. Used type assertion (window as any).aistudio to bypass strict type checks for environment-injected objects.

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [currentObject, setCurrentObject] = useState<MindfulObject>(MINDFUL_OBJECTS[0]);
  const [nextObject, setNextObject] = useState<MindfulObject | null>(null);
  const [seenEmojis, setSeenEmojis] = useState<string[]>([MINDFUL_OBJECTS[0].emoji]);
  const [apiStatus, setApiStatus] = useState<'ready' | 'loading' | 'quota_hit' | 'local'>('ready');
  
  const [stats, setStats] = useState<SessionStats>(() => {
    const savedHighScore = localStorage.getItem(HIGH_SCORE_KEY);
    return { 
      perfectHits: 0, 
      totalAttempts: 0, 
      level: 1, 
      streak: 0, 
      missCount: 0,
      highScore: savedHighScore ? parseInt(savedHighScore, 10) : 0
    };
  });

  const [difficulty, setDifficulty] = useState<Difficulty>(BASE_DIFFICULTY);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isHitAnim, setIsHitAnim] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [inZone, setInZone] = useState(false);
  const [outlineOnly, setOutlineOnly] = useState(false);
  
  const [userSpeedMultiplier, setUserSpeedMultiplier] = useState(1.0);
  const [rotationDirection, setRotationDirection] = useState(1);
  const [missSpeedBoost, setMissSpeedBoost] = useState(1.0);

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const progressRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);

  const targetScale = 1.0;
  const HIT_THRESHOLD = 0.18;

  const handleSelectKey = async () => {
    try {
      // Use type assertion to access the injected aistudio object
      await (window as any).aistudio.openSelectKey();
      setApiStatus('ready');
      setNextObject(null); // Trigger re-fetch with new key
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };

  // Pre-fetch the next object
  useEffect(() => {
    if (!nextObject && gameState === GameState.PLAYING) {
      setApiStatus('loading');
      generateMindfulObject(seenEmojis)
        .then(obj => {
          if (obj) {
            setNextObject(obj);
            setApiStatus('ready');
          } else {
            throw new Error('FALLBACK');
          }
        })
        .catch(err => {
          if (err.message === 'QUOTA_EXCEEDED') {
            setApiStatus('quota_hit');
          } else {
            setApiStatus('local');
          }
          
          // Fallback logic
          const fallbackOptions = MINDFUL_OBJECTS.filter(o => !seenEmojis.includes(o.emoji));
          const fallback = fallbackOptions.length > 0 
            ? fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)]
            : MINDFUL_OBJECTS[Math.floor(Math.random() * MINDFUL_OBJECTS.length)];
          setNextObject(fallback);
        });
    }
  }, [nextObject, seenEmojis, gameState]);

  const prepareDifficulty = useCallback((lvl: number) => {
    const isBreak = lvl > 1 && (lvl % 7 === 0);
    return {
      speed: isBreak ? 0.0008 : 0.0016 + (lvl * 0.0001),
      jitter: lvl < 10 ? 0 : Math.min((lvl - 10) * 0.02, 0.25),
      isBreak,
      pulseRange: [0.4, 1.8 + Math.min(lvl * 0.02, 0.6)],
      rotationMultiplier: lvl <= 5 ? 0 : 1,
    };
  }, []);

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = time - lastTimeRef.current;
      const effectiveSpeed = difficulty.speed * missSpeedBoost * userSpeedMultiplier;
      const baseDelta = effectiveSpeed * deltaTime;
      const jitterFactor = Math.sin(time * 0.0015) * difficulty.jitter;
      
      progressRef.current += baseDelta * (1 + jitterFactor);
      
      const rotationSpeed = (0.005 + (effectiveSpeed * 2)) * difficulty.rotationMultiplier;
      rotationRef.current = (rotationRef.current + rotationSpeed * rotationDirection * deltaTime) % 360;

      const primarySin = Math.sin(progressRef.current);
      const normalize = (val: number) => (val + 1) / 2;
      const [min, max] = difficulty.pulseRange;
      
      const currentScale = min + normalize(primarySin) * (max - min);
      
      setScale(currentScale);
      setRotation(rotationRef.current);
      setInZone(Math.abs(currentScale - targetScale) < HIT_THRESHOLD);
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [difficulty, missSpeedBoost, userSpeedMultiplier, rotationDirection, targetScale]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, animate]);

  const resetGame = useCallback(() => {
    setIsFading(true);
    setFeedback("Stability lost. Returning to silence.");
    setTimeout(() => {
      const startObj = MINDFUL_OBJECTS[0];
      setStats(prev => ({ ...prev, perfectHits: 0, totalAttempts: 0, level: 1, streak: 0, missCount: 0 }));
      setDifficulty(prepareDifficulty(1));
      setCurrentObject(startObj);
      setSeenEmojis([startObj.emoji]);
      setNextObject(null);
      setMissSpeedBoost(1.0);
      setUserSpeedMultiplier(1.0);
      setRotationDirection(1);
      setOutlineOnly(false);
      progressRef.current = -Math.PI / 2;
      setIsFading(false);
      setTimeout(() => setFeedback(null), 3000);
    }, 800);
  }, [prepareDifficulty]);

  const handleTap = async () => {
    if (gameState !== GameState.PLAYING || isFading || isHitAnim) return;

    const distance = Math.abs(scale - targetScale);
    const isSuccess = distance < HIT_THRESHOLD;
    const accuracy = Math.max(0, 1 - (distance / HIT_THRESHOLD));

    if (isSuccess) {
      setIsHitAnim(true);
      setMissSpeedBoost(1.0);
      zenAudio.playSuccessTone();

      if ('vibrate' in navigator) {
        navigator.vibrate([40, 20, 40]);
      }
      
      const newStreak = stats.streak + 1;
      const newHighScore = Math.max(stats.highScore, newStreak);
      
      if (newHighScore > stats.highScore) {
        localStorage.setItem(HIGH_SCORE_KEY, newHighScore.toString());
      }

      const nextLevelStats = {
        ...stats,
        perfectHits: stats.perfectHits + 1,
        totalAttempts: stats.totalAttempts + 1,
        streak: newStreak,
        highScore: newHighScore,
        level: stats.level + 1
      };
      
      getZenFeedback(accuracy, nextLevelStats.level - 1).then(msg => {
        setFeedback(msg);
      }).catch(() => {
        setFeedback(accuracy > 0.9 ? "Perfect Focus." : "Continue.");
      });

      setTimeout(() => {
        setIsHitAnim(false);
        setIsFading(true);
        
        setTimeout(() => {
          setStats(nextLevelStats);
          setDifficulty(prepareDifficulty(nextLevelStats.level));
          
          if (nextObject) {
            setCurrentObject(nextObject);
            setSeenEmojis(prev => [...prev, nextObject.emoji]);
            setNextObject(null);
          } else {
            const fallbackIdx = nextLevelStats.level % MINDFUL_OBJECTS.length;
            setCurrentObject(MINDFUL_OBJECTS[fallbackIdx]);
          }

          setOutlineOnly(nextLevelStats.level % 3 === 0);
          progressRef.current = -Math.PI / 2; 
          setIsFading(false);
          setTimeout(() => setFeedback(null), 3000);
        }, 600);
      }, 400);

    } else {
      const newMissCount = stats.missCount + 1;
      if (newMissCount >= 10) {
        resetGame();
        return;
      }

      setStats(prev => ({ ...prev, totalAttempts: prev.totalAttempts + 1, streak: 0, missCount: newMissCount }));
      setMissSpeedBoost(prev => prev + 0.2);

      const container = document.getElementById('root-container');
      if (container) {
        container.classList.add('shake');
        setTimeout(() => { container.classList.remove('shake'); }, 300);
      }
    }
  };

  const startSession = () => {
    setIsFading(true);
    setTimeout(() => {
      setGameState(GameState.PLAYING);
      setIsFading(false);
    }, 600);
  };

  return (
    <div 
      id="root-container"
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center cursor-pointer bg-[#050505] transition-colors duration-1000"
      onClick={handleTap}
    >
      {/* AI Connection Tooltip */}
      {apiStatus === 'quota_hit' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-700">
          <button 
            onClick={(e) => { e.stopPropagation(); handleSelectKey(); }}
            className="px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full backdrop-blur-xl group hover:bg-amber-500/20 transition-all pointer-events-auto"
          >
            <span className="text-[10px] text-amber-200 uppercase tracking-[0.3em] font-bold group-hover:tracking-[0.4em] transition-all">
              Quota Limit Reached • Use Personal Key
            </span>
          </button>
        </div>
      )}

      {/* Main Aura */}
      <div 
        className="absolute inset-0 transition-all duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${currentObject.color}22 0%, transparent 70%)`,
          opacity: inZone ? 1 : 0.4
        }}
      />

      {/* Center Objects */}
      <div className={`relative flex items-center justify-center z-10 select-none transition-all duration-700 ${isFading ? 'opacity-0 scale-90 blur-2xl' : 'opacity-100 scale-100 blur-0'}`}>
        <PulsatingRing 
          scale={1.0} 
          rotation={0}
          color={currentObject.color} 
          opacity={inZone ? 0.8 : 0.15} 
          emoji={currentObject.emoji}
          isGuide={true}
          glowStrength={inZone ? 40 : 0}
        />

        <div 
          className="text-9xl transition-all duration-700 transform"
          style={{ 
            textShadow: inZone ? `0 0 60px ${currentObject.color}aa` : `0 0 30px ${currentObject.color}44`,
            filter: isHitAnim ? 'brightness(3) scale(1.2)' : 'none',
            fontSize: '110px',
            lineHeight: 1
          }}
        >
          {currentObject.emoji}
        </div>

        <PulsatingRing 
          scale={scale} 
          rotation={rotation}
          color={currentObject.color} 
          opacity={outlineOnly ? 0.9 : 0.6} 
          glowStrength={inZone ? 50 : 25} 
          emoji={currentObject.emoji}
          isHit={isHitAnim}
          outlineOnly={outlineOnly}
        />
      </div>

      {/* Feedback Text */}
      {feedback && (
        <div className="absolute top-1/4 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-1000 z-[60]">
          <p className="text-white/60 font-serif italic text-xl tracking-wide text-center px-8 max-w-md mx-auto">
            {feedback}
          </p>
        </div>
      )}

      {/* HUD & Particles */}
      <GameUI 
        stats={stats} 
        message={currentObject.mantra}
        showOverlay={gameState === GameState.START}
        onStart={startSession}
        gameStarted={gameState !== GameState.START}
      />

      {/* Speed Controls (Subtle) */}
      {gameState === GameState.PLAYING && !isFading && (
        <div className="absolute bottom-12 flex gap-4 items-center pointer-events-auto z-[70] px-4 py-2 rounded-full bg-white/5 border border-white/10" onClick={e => e.stopPropagation()}>
           <button onClick={() => setUserSpeedMultiplier(prev => Math.max(0.2, prev - 0.1))} className="text-white/20 hover:text-white/60 text-[10px] uppercase tracking-widest px-2">Slower</button>
           <div className="h-3 w-px bg-white/10" />
           <button onClick={() => setRotationDirection(p => p * -1)} className="text-white/20 hover:text-white/60 text-[10px] uppercase tracking-widest px-2">Reverse</button>
           <div className="h-3 w-px bg-white/10" />
           <button onClick={() => setUserSpeedMultiplier(prev => Math.min(3.0, prev + 0.1))} className="text-white/20 hover:text-white/60 text-[10px] uppercase tracking-widest px-2">Faster</button>
        </div>
      )}

      <style>{`
        .shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(1px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-2px, 0, 0); }
          40%, 60% { transform: translate3d(2px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default App;
