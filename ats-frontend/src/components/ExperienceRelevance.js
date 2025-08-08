import React, { useState } from 'react';

const ExperienceRelevance = ({ relevance }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());

  if (!relevance) return null;

  const getMatchColor = (strength) => {
    switch(strength) {
      case 'Strong': 
        return {
          bg: 'bg-gradient-to-r from-green-100/80 to-emerald-100/80 dark:from-green-900/40 dark:to-emerald-900/40',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-300 dark:border-green-600',
          icon: '🎯'
        };
      case 'Partial': 
        return {
          bg: 'bg-gradient-to-r from-yellow-100/80 to-orange-100/80 dark:from-yellow-900/40 dark:to-orange-900/40',
          text: 'text-yellow-700 dark:text-yellow-300',
          border: 'border-yellow-300 dark:border-yellow-600',
          icon: '⚡'
        };
      case 'Weak': 
        return {
          bg: 'bg-gradient-to-r from-red-100/80 to-pink-100/80 dark:from-red-900/40 dark:to-pink-900/40',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-300 dark:border-red-600',
          icon: '💪'
        };
      default: 
        return {
          bg: 'bg-gray-100/80 dark:bg-gray-800/40',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-300 dark:border-gray-600',
          icon: '📋'
        };
    }
  };

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const strongMatches = relevance.details?.filter(d => d.matchStrength === 'Strong').length || 0;
  const partialMatches = relevance.details?.filter(d => d.matchStrength === 'Partial').length || 0;
  const weakMatches = relevance.details?.filter(d => d.matchStrength === 'Weak').length || 0;

  return (
    <div className="glass-strong rounded-3xl p-8 hover-glass transition-all duration-300 slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-xl mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          Experience Relevance
        </h3>

        {/* Quick stats */}
        <div className="flex space-x-2">
          <div className="glass px-3 py-1 rounded-full flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="text-xs text-gray-600 dark:text-gray-300">{strongMatches}</span>
          </div>
          <div className="glass px-3 py-1 rounded-full flex items-center space-x-1">
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            <span className="text-xs text-gray-600 dark:text-gray-300">{partialMatches}</span>
          </div>
          <div className="glass px-3 py-1 rounded-full flex items-center space-x-1">
            <span className="w-2 h-2 bg-red-400 rounded-full"></span>
            <span className="text-xs text-gray-600 dark:text-gray-300">{weakMatches}</span>
          </div>
        </div>
      </div>
      
      {/* Summary */}
      <div className="mb-6 p-4 glass rounded-2xl">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {relevance.summary}
        </p>
      </div>
      
      {/* Details */}
      <div className="space-y-4">
        {relevance.details?.map((detail, idx) => {
          const matchStyle = getMatchColor(detail.matchStrength);
          const isExpanded = expandedItems.has(idx);
          
          return (
            <div key={idx} className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div 
                className="p-5 cursor-pointer"
                onClick={() => toggleExpanded(idx)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-xl">{matchStyle.icon}</span>
                      <h4 className="font-semibold text-gray-800 dark:text-white text-lg">
                        {detail.jdRequirement}
                      </h4>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4 space-y-3 fade-in">
                        <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Your Experience:</strong> {detail.resumeEvidence}
                          </p>
                        </div>
                        
                        {detail.suggestions && (
                          <div className="p-3 glass rounded-xl">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              <strong>💡 Suggestion:</strong> {detail.suggestions}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${matchStyle.bg} ${matchStyle.text} border ${matchStyle.border}`}>
                      {detail.matchStrength} Match
                    </span>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Action prompt */}
      {weakMatches > 0 && (
        <div className="mt-6 p-4 glass rounded-2xl border border-orange-200/50 dark:border-orange-700/50">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-1">Areas for Improvement</h4>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Consider strengthening your experience descriptions to better align with the job requirements highlighted above.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceRelevance;
