
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  FEEDBACK = 'FEEDBACK',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE'
}

export interface MindfulObject {
  id: string;
  emoji: string;
  name: string;
  color: string;
  mantra: string;
}

export interface Difficulty {
  speed: number;
  jitter: number;
  isBreak: boolean;
  pulseRange: [number, number];
  rotationMultiplier: number;
}

export interface SessionStats {
  perfectHits: number;
  totalAttempts: number;
  level: number;
  streak: number;
  missCount: number;
  highScore: number;
}
