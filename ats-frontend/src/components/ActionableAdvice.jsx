import React, { useState } from 'react';

const ActionableAdvice = ({ advice }) => {
  const [completedItems, setCompletedItems] = useState(new Set());

  if (!advice || !Array.isArray(advice)) return null;

  const toggleCompleted = (index) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedItems(newCompleted);
  };

  const getAdviceIcon = (index) => {
    const icons = ['🎯', '💡', '⚡', '🚀', '🔥', '💎', '⭐', '🎉'];
    return icons[index % icons.length];
  };

  const getPriorityColor = (index) => {
    if (index < 2) return 'from-red-400 to-pink-500'; // High priority
    if (index < 4) return 'from-yellow-400 to-orange-500'; // Medium priority
    return 'from-blue-400 to-purple-500'; // Lower priority
  };

  const completedCount = completedItems.size;
  const progressPercentage = advice.length > 0 ? (completedCount / advice.length) * 100 : 0;

  return (
    <div className="glass-strong rounded-3xl p-8 hover-glass transition-all duration-300 slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          Actionable Improvements
        </h3>
        
        {/* Progress indicator */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {completedCount}/{advice.length} completed
          </span>
          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress summary */}
      {completedCount > 0 && (
        <div className="mb-6 p-4 glass rounded-2xl bg-green-50/20 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-700 dark:text-green-300 font-medium">
              Great progress! You've completed {completedCount} improvement{completedCount !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>
      )}

      {/* Advice list */}
      <div className="space-y-4">
        {advice.map((item, idx) => {
          const isCompleted = completedItems.has(idx);
          const priorityColor = getPriorityColor(idx);
          
          return (
            <div 
              key={idx} 
              className={`glass rounded-2xl transition-all duration-300 hover:shadow-lg ${
                isCompleted ? 'opacity-75' : ''
              }`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="p-5">
                <div className="flex items-start space-x-4">
                  {/* Priority indicator and checkbox */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${priorityColor} flex items-center justify-center text-white font-bold text-sm`}>
                      {idx + 1}
                    </div>
                    <button
                      onClick={() => toggleCompleted(idx)}
                      className={`w-6 h-6 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-400 dark:border-gray-400 hover:border-green-400 dark:hover:border-green-500 bg-white dark:bg-gray-800'
                      }`}
                    >
                      {isCompleted && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{getAdviceIcon(idx)}</span>
                        <div className="flex-1">
                          <p className={`text-gray-700 dark:text-gray-300 leading-relaxed ${
                            isCompleted ? 'line-through text-gray-500 dark:text-gray-200' : ''
                          }`}>
                            {item}
                          </p>
                          
                          {/* Priority badge */}
                          <div className="mt-2 flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              idx < 2 
                                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                : idx < 4
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            }`}>
                              {idx < 2 ? 'High Priority' : idx < 4 ? 'Medium Priority' : 'Low Priority'}
                            </span>
                            
                            {isCompleted && (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                ✓ Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion celebration */}
      {completedCount === advice.length && advice.length > 0 && (
        <div className="mt-6 p-6 glass rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50 text-center slide-up">
          <div className="text-4xl mb-3">🎉</div>
          <h4 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
            Congratulations!
          </h4>
          <p className="text-green-600 dark:text-green-400">
            You've completed all improvement suggestions. Your resume is now optimized for this position!
          </p>
        </div>
      )}

      {/* Tips section */}
      <div className="mt-6 p-4 glass rounded-2xl">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">Implementation Tips</h4>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Focus on high-priority items first. Each improvement can significantly increase your chances of getting past ATS systems and landing interviews.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionableAdvice;