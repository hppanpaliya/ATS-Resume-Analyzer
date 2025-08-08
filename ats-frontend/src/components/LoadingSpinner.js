import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center space-x-3">
      {/* Futuristic multi-ring spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div className="w-8 h-8 border-2 border-transparent border-t-purple-500 border-r-blue-500 rounded-full animate-spin"></div>
        {/* Middle ring */}
        <div className="absolute inset-1 w-6 h-6 border-2 border-transparent border-t-cyan-400 border-l-pink-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        {/* Inner ring */}
        <div className="absolute inset-2 w-4 h-4 border-2 border-transparent border-b-emerald-400 border-r-yellow-400 rounded-full animate-spin" style={{ animationDuration: '0.6s' }}></div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Loading text with animated gradient */}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 font-medium animate-pulse">
        Analyzing...
      </span>
    </div>
  );
};

export default LoadingSpinner;