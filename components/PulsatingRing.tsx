
import React from 'react';

interface PulsatingRingProps {
  scale: number;
  rotation: number;
  color: string;
  opacity: number;
  glowStrength: number;
  emoji?: string;
  isHit?: boolean;
  isGuide?: boolean;
  outlineOnly?: boolean;
}

const PulsatingRing: React.FC<PulsatingRingProps> = ({ 
  scale, 
  rotation, 
  color, 
  opacity, 
  glowStrength, 
  emoji, 
  isHit, 
  isGuide,
  outlineOnly 
}) => {
  const style: React.CSSProperties = {
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    opacity: isGuide ? opacity : (outlineOnly ? opacity * 0.6 : opacity),
    filter: isHit ? `drop-shadow(0 0 ${glowStrength * 1.5}px ${color})` : `drop-shadow(0 0 ${glowStrength}px ${color})`,
    transition: isHit ? 'all 0.15s ease-out' : 'none',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: isGuide ? 5 : 20,
    userSelect: 'none',
  };

  const textStyle: React.CSSProperties = {
    fontSize: '110px',
    // If outlineOnly is true, we use a very thin stroke and no fill.
    // If it's a guide, it's always an outline.
    WebkitTextStroke: (isGuide || outlineOnly) ? `1.5px ${color}` : '0px',
    color: (isGuide || outlineOnly) ? 'transparent' : 'inherit',
    fontWeight: 'bold',
    lineHeight: 1,
    transition: 'all 0.5s ease-in-out',
  };

  return (
    <div style={style}>
      {emoji ? (
        <span style={textStyle}>{emoji}</span>
      ) : (
        <div
          style={{
            width: '180px',
            height: '180px',
            border: (isGuide || outlineOnly) ? `1.5px dashed ${color}` : `3px solid ${color}`,
            borderRadius: '12px',
          }}
        />
      )}
    </div>
  );
};

export default PulsatingRing;
