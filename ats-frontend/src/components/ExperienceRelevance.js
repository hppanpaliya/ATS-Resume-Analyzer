import React from 'react';

const ExperienceRelevance = ({ relevance }) => {
  if (!relevance) return null;

  const gapCount = relevance.gaps?.length || 0;

  return (
    <div className="glass-strong rounded-3xl p-8 hover-glass transition-all duration-300 slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-xl mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8" />
            </svg>
          </div>
          Experience Relevance
        </h3>
        
        {/* Score display */}
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{relevance.score >= 80 ? '🎯' : relevance.score >= 60 ? '⚡' : '💪'}</span>
          <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${relevance.score >= 80 ? 'from-green-400 to-emerald-500' : relevance.score >= 60 ? 'from-yellow-400 to-orange-500' : 'from-red-400 to-pink-500'} text-white font-bold text-lg`}>
            {relevance.score}%
          </div>
        </div>
      </div>

      {/* Relevant Experience */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Relevant Experience Found
        </h4>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {relevance.relevantExperience}
        </p>
      </div>

      {/* Gaps */}
      {gapCount > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Areas for Improvement ({gapCount})
          </h4>
          <div className="space-y-3">
            {relevance.gaps.map((gap, idx) => (
              <div 
                key={idx} 
                className="flex items-start space-x-3 p-4 glass rounded-xl border-l-4 border-yellow-400"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <span className="text-yellow-500 mt-0.5">⚠️</span>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {gap}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceRelevance;
