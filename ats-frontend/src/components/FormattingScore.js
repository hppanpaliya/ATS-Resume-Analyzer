import React, { useEffect, useState } from 'react';

const FormattingScore = ({ formatting }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(formatting.score);
    }, 300);
    return () => clearTimeout(timer);
  }, [formatting.score]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return '🎯';
    if (score >= 60) return '⚡';
    return '🔧';
  };

  const formatChecks = [
    { label: 'Clear section headers', passed: formatting.score >= 70 },
    { label: 'Consistent formatting', passed: formatting.score >= 60 },
    { label: 'ATS-friendly fonts', passed: formatting.score >= 50 },
    { label: 'Proper spacing', passed: formatting.score >= 80 },
    { label: 'Standard file format', passed: true },
  ];

  return (
    <div className="glass-strong rounded-3xl p-8 hover-glass transition-all duration-300 slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-xl mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          ATS Formatting Score
        </h3>
        
        {/* Score display */}
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getScoreIcon(formatting.score)}</span>
          <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getScoreColor(formatting.score)} text-white font-bold text-lg`}>
            {animatedScore}%
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
          <span>ATS Compatibility</span>
          <span>{animatedScore}% Optimized</span>
        </div>
        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getScoreColor(formatting.score)} rounded-full transition-all duration-1000 ease-out relative`}
            style={{ width: `${animatedScore}%` }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="mb-6 p-4 glass rounded-2xl">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {formatting.feedback}
        </p>
      </div>

      {/* Formatting checklist */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">ATS Compatibility Checklist</h4>
        {formatChecks.map((check, idx) => (
          <div 
            key={idx} 
            className="flex items-center space-x-3 p-3 glass rounded-xl transition-all duration-300 hover:scale-[1.02]"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              check.passed 
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' 
                : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
            }`}>
              {check.passed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${check.passed ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
              {check.label}
            </span>
            {check.passed && (
              <span className="ml-auto text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-2 py-1 rounded-full">
                ✓ Pass
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Improvement tips */}
      {formatting.score < 80 && (
        <div className="mt-6 p-4 glass rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">💡 Quick Formatting Tips</h4>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Use standard fonts like Arial, Calibri, or Times New Roman</li>
                <li>• Maintain consistent formatting throughout</li>
                <li>• Use clear section headers (Experience, Education, Skills)</li>
                <li>• Avoid graphics, tables, and complex layouts</li>
                <li>• Save as PDF to preserve formatting</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormattingScore;