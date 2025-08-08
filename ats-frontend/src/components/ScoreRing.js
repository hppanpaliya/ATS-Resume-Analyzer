import React, { useEffect, useState } from 'react';

const ScoreRing = ({ score, size = 160 }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const getColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getGradient = (score) => {
    if (score >= 80) return 'url(#greenGradient)';
    if (score >= 60) return 'url(#yellowGradient)';
    return 'url(#redGradient)';
  };

  const getGlowColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 score-ring transition-all duration-500 hover:scale-105" width={size} height={size}>
        <defs>
          {/* Enhanced gradients */}
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
          <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fcd34d" />
          </linearGradient>
          <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#fca5a5" />
          </linearGradient>
          
          {/* Enhanced glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Outer glow filter */}
          <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 6}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Main background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="12"
          fill="none"
          className="backdrop-blur-sm"
        />
        
        {/* Progress circle with enhanced effects */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getGradient(score)}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#glow)"
          style={{
            transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        
        {/* Animated progress indicator */}
        <circle
          cx={size / 2 + Math.cos((animatedScore / 100) * 2 * Math.PI - Math.PI / 2) * radius}
          cy={size / 2 + Math.sin((animatedScore / 100) * 2 * Math.PI - Math.PI / 2) * radius}
          r="6"
          fill={getColor(score)}
          filter="url(#outerGlow)"
          className="animate-pulse"
        />
        
        {/* Trailing particles */}
        {[0, 1, 2, 3].map((i) => (
          <circle
            key={i}
            cx={size / 2 + Math.cos((animatedScore / 100) * 2 * Math.PI - Math.PI / 2 - (i * 0.15)) * radius}
            cy={size / 2 + Math.sin((animatedScore / 100) * 2 * Math.PI - Math.PI / 2 - (i * 0.15)) * radius}
            r={3 - i * 0.5}
            fill={getColor(score)}
            opacity={0.8 - (i * 0.2)}
            className="animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </svg>
      
      {/* Enhanced center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative">
          {/* Glowing background for score */}
          <div 
            className="absolute inset-0 blur-lg rounded-full opacity-30"
            style={{ 
              background: `radial-gradient(circle, ${getGlowColor(score)}40, transparent)`,
              width: '120%',
              height: '120%',
              left: '-10%',
              top: '-10%'
            }}
          ></div>
          
          <span className="relative text-5xl font-black neon-text">
            {animatedScore}%
          </span>
        </div>
        
        <div className="mt-2 glass-strong px-4 py-2 rounded-2xl shadow-lg">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {animatedScore >= 80 ? 'Excellent' : animatedScore >= 60 ? 'Good' : 'Needs Work'}
          </span>
        </div>
      </div>
      
      {/* Enhanced floating particles for excellent scores */}
      {score >= 80 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                background: `linear-gradient(135deg, ${getColor(score)}60, ${getColor(score)}90)`,
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Pulsing outer ring for high scores */}
      {score >= 70 && (
        <div 
          className="absolute inset-0 rounded-full border-2 border-opacity-30 animate-ping"
          style={{ 
            borderColor: getGlowColor(score),
            animationDuration: '3s'
          }}
        ></div>
      )}
    </div>
  );
};

export default ScoreRing;