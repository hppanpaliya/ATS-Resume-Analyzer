import React, { useState } from 'react';

const KeywordAnalysis = ({ analysis }) => {
  const [activeTab, setActiveTab] = useState('found');

  if (!analysis) return null;

  const foundCount = analysis.matchedKeywords?.length || 0;
  const missingCount = analysis.missingKeywords?.length || 0;
  const recommendationsCount = analysis.recommendations?.length || 0;
  const totalCount = foundCount + missingCount;

  return (
    <div className="glass-strong rounded-3xl p-8 hover-glass transition-all duration-300 slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-xl mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </div>
          Keyword Analysis
        </h3>
        
        {/* Statistics */}
        <div className="flex items-center space-x-4">
          <div className="glass px-4 py-2 rounded-full">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Match Rate: <span className="font-bold text-blue-500">{totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0}%</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('found')}
          className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
            activeTab === 'found'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : 'glass text-gray-600 dark:text-gray-300 hover:bg-green-100/20 dark:hover:bg-green-900/20'
          }`}
        >
          ✓ Found ({foundCount})
        </button>
        <button
          onClick={() => setActiveTab('missing')}
          className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
            activeTab === 'missing'
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
              : 'glass text-gray-600 dark:text-gray-300 hover:bg-red-100/20 dark:hover:bg-red-900/20'
          }`}
        >
          ✗ Missing ({missingCount})
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
            activeTab === 'recommendations'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'glass text-gray-600 dark:text-gray-300 hover:bg-blue-100/20 dark:hover:bg-blue-900/20'
          }`}
        >
          💡 Recommendations ({recommendationsCount})
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[200px]">
        {activeTab === 'found' && (
          <div className="space-y-4 fade-in">
            {foundCount > 0 ? (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Great! Your resume contains these important keywords:
                </p>
                <div className="flex flex-wrap gap-3">
                  {analysis.matchedKeywords.map((keyword, idx) => (
                    <span 
                      key={idx} 
                      className="keyword-badge px-4 py-2 bg-gradient-to-r from-green-100/80 to-emerald-100/80 dark:from-green-900/40 dark:to-emerald-900/40 text-green-700 dark:text-green-300 rounded-full text-sm font-medium border border-green-200/50 dark:border-green-700/50 hover:scale-105 transition-all duration-200"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">No keywords found in your resume.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'missing' && (
          <div className="space-y-4 fade-in">
            {missingCount > 0 ? (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Consider adding these keywords to improve your match:
                </p>
                <div className="flex flex-wrap gap-3">
                  {analysis.missingKeywords.map((keyword, idx) => (
                    <span 
                      key={idx} 
                      className="keyword-badge px-4 py-2 bg-gradient-to-r from-red-100/80 to-pink-100/80 dark:from-red-900/40 dark:to-pink-900/40 text-red-700 dark:text-red-300 rounded-full text-sm font-medium border border-red-200/50 dark:border-red-700/50 hover:scale-105 transition-all duration-200 cursor-pointer"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                      title="Click to copy to clipboard"
                      onClick={() => {
                        navigator.clipboard.writeText(keyword);
                        // You could add a toast notification here
                      }}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="mt-4 p-4 glass rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Tip:</strong> Integrate these keywords naturally into your experience descriptions, skills section, and summary. Click on any keyword to copy it.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-600 dark:text-green-400 font-medium">Perfect! Your resume contains all the important keywords.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4 fade-in">
            {recommendationsCount > 0 ? (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Specific recommendations for improving your skills section:
                </p>
                <div className="space-y-3">
                  {analysis.recommendations.map((recommendation, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 glass rounded-2xl border-l-4 border-blue-500 hover:bg-white/5 transition-all duration-200"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                          {recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">Your skills section looks well-organized!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeywordAnalysis;