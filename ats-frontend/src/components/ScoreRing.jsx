import React, { useEffect, useState } from 'react';

const ScoreRing = ({ score, size = 180 }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - 20) / 2;
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 200);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 score-ring" width={size} height={size}>
        <defs>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="10"
          fill="none"
          className="backdrop-blur-sm"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getGradient(score)}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#glow)"
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        
        {/* Animated dots */}
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={size / 2 + Math.cos((animatedScore / 100) * 2 * Math.PI - Math.PI / 2 + (i * 0.1)) * radius}
            cy={size / 2 + Math.sin((animatedScore / 100) * 2 * Math.PI - Math.PI / 2 + (i * 0.1)) * radius}
            r="2"
            fill={getColor(score)}
            opacity={1 - (i * 0.3)}
            className="animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
          {animatedScore}%
        </span>
        <div className="mt-1 px-3 py-1 glass rounded-full">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {animatedScore >= 80 ? 'Excellent' : animatedScore >= 60 ? 'Good' : 'Fair'}
          </span>
        </div>
      </div>
      
      {/* Floating particles */}
      {score >= 80 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-green-400 rounded-full animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ScoreRing;