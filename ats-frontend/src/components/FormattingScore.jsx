import React, { useEffect, useState } from 'react';

const FormattingScore = ({ formatting }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (formatting && formatting.score) {
      const timer = setTimeout(() => {
        setAnimatedScore(formatting.score);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [formatting]);

  // Handle case where formatting data is not available
  if (!formatting || !formatting.score) {
    return (
      <div className="glass-strong rounded-3xl p-8 hover-glass transition-all duration-300 slide-up">
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            ATS Formatting Analysis
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Formatting analysis data is not available yet.
          </p>
        </div>
      </div>
    );
  }

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

      {/* Score description */}
      <div className="mb-6 text-center">
        <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
          {formatting.score >= 80 ? 'Excellent ATS Compatibility' : formatting.score >= 60 ? 'Good ATS Compatibility' : 'Needs ATS Improvements'}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          Based on ATS parsing compatibility and formatting best practices
        </p>
      </div>

      {/* Issues and Suggestions */}
      {(formatting.issues?.length > 0 || formatting.suggestions?.length > 0) && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Formatting Issues & Fixes
          </h4>
          <div className="space-y-3">
            {formatting.issues?.map((issue, idx) => (
              <div key={idx} className="p-4 glass rounded-2xl border border-orange-200/50 dark:border-orange-700/50 bg-orange-50/50 dark:bg-orange-900/10">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-orange-700 dark:text-orange-300 font-medium mb-2">{issue}</p>
                    {formatting.suggestions?.[idx] && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                        <div className="flex items-start space-x-2">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-300 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h5 className="font-medium text-green-700 dark:text-green-300 text-sm mb-1">Suggested Fix</h5>
                            <p className="text-green-600 dark:text-green-400 text-sm">{formatting.suggestions[idx]}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formatting checklist based on score */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">ATS Compatibility Checklist</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center space-x-3 p-3 glass rounded-xl transition-all duration-300">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              formatting.score >= 70 ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
            }`}>
              {formatting.score >= 70 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${formatting.score >= 70 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
              Clear section headers
            </span>
          </div>

          <div className="flex items-center space-x-3 p-3 glass rounded-xl transition-all duration-300">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              formatting.score >= 60 ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
            }`}>
              {formatting.score >= 60 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${formatting.score >= 60 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
              Consistent formatting
            </span>
          </div>

          <div className="flex items-center space-x-3 p-3 glass rounded-xl transition-all duration-300">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              formatting.score >= 50 ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
            }`}>
              {formatting.score >= 50 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${formatting.score >= 50 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
              ATS-friendly fonts
            </span>
          </div>

          <div className="flex items-center space-x-3 p-3 glass rounded-xl transition-all duration-300">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              formatting.score >= 80 ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
            }`}>
              {formatting.score >= 80 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${formatting.score >= 80 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
              Proper spacing
            </span>
          </div>
        </div>
      </div>

      {/* Improvement tips */}
      {formatting.score < 90 && (
        <div className="mt-6 p-4 glass rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">💡 Key ATS Formatting Tips</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-600 dark:text-blue-400">Use standard fonts (Arial, Calibri, Times New Roman)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-600 dark:text-blue-400">Clear section headers in ALL CAPS</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-600 dark:text-blue-400">Consistent date format (MM/YYYY)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-600 dark:text-blue-400">Avoid tables, columns, and graphics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-600 dark:text-blue-400">Save as PDF for submission</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-600 dark:text-blue-400">Keep resume to 1-2 pages</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success message for high scores */}
      {formatting.score >= 90 && (
        <div className="mt-6 p-4 glass rounded-2xl border border-green-200/50 dark:border-green-700/50 bg-green-50/50 dark:bg-green-900/10">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">🎉 Excellent ATS Formatting!</h4>
              <p className="text-green-600 dark:text-green-400 text-sm">
                Your resume formatting is highly ATS-compatible. Focus on optimizing your content and keywords for even better results.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormattingScore;