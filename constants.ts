
import { MindfulObject, Difficulty } from './types';

export const MINDFUL_OBJECTS: MindfulObject[] = [
  { id: '1', emoji: '🍎', name: 'Crimson Apple', color: '#ff4d4d', mantra: 'Mindful Alignment' },
  { id: '2', emoji: '💠', name: 'Crystal Lozenge', color: '#00d2ff', mantra: 'Clarity is the byproduct of pressure.' },
  { id: '3', emoji: '🍋', name: 'Citrine Lemon', color: '#fef250', mantra: 'Every sourness holds a hidden vitality.' },
  { id: '4', emoji: '⚪', name: 'Infinite Circle', color: '#ffffff', mantra: 'Only the present truly exists.' },
  { id: '5', emoji: '🍑', name: 'Velvet Peach', color: '#ff9a9e', mantra: 'Softness is a strength rarely understood.' },
  { id: '6', emoji: '🍊', name: 'Golden Orange', color: '#ffa500', mantra: 'Radiate the warmth you wish to find.' },
  { id: '7', emoji: '🔺', name: 'Primal Triangle', color: '#ff5e62', mantra: 'Stability is found in balanced focus.' },
  { id: '8', emoji: '🍇', name: 'Royal Grapes', color: '#9370db', mantra: 'Connection flows in clusters of grace.' },
  { id: '9', emoji: '🍓', name: 'Wild Strawberry', color: '#ff69b4', mantra: 'Cherish the sweetness of the fleeting moment.' },
  { id: '10', emoji: '★', name: 'Radiant Star', color: '#f6d365', mantra: 'Light travels far when the heart is clear.' },
  { id: '11', emoji: '🍈', name: 'Dew Melon', color: '#90ee90', mantra: 'Growth happens in the quiet hours.' },
  { id: '12', emoji: '💎', name: 'Pure Diamond', color: '#e0ffff', mantra: 'A steady heart reflects everything.' },
  { id: '13', emoji: '🍍', name: 'Golden Pine', color: '#ffd700', mantra: 'Stand tall, wear your own crown.' },
  { id: '14', emoji: '🟢', name: 'Zen Sphere', color: '#00ff7f', mantra: 'Balance is not something you find, it is something you create.' },
  { id: '15', emoji: '🫐', name: 'Blueberry', color: '#4169e1', mantra: 'Small moments create a grand life.' }
];

export const BASE_DIFFICULTY: Difficulty = {
  speed: 0.0015,
  jitter: 0,
  isBreak: false,
  pulseRange: [0.5, 1.8],
  rotationMultiplier: 0,
};
