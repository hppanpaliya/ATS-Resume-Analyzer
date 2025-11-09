import React from 'react';
import ScoreRing from './ScoreRing';
import KeywordAnalysis from './KeywordAnalysis';
import ExperienceRelevance from './ExperienceRelevance';
import FormattingScore from './FormattingScore';
import ActionableAdvice from './ActionableAdvice';
import EmptyState from './EmptyState';

const AnalysisResults = ({ results }) => {
  if (!results) {
    return <EmptyState />;
  }

  const getScoreText = (score) => {
    if (score >= 80) return { text: 'Excellent', color: 'from-green-400 to-emerald-500', emoji: '🎉' };
    if (score >= 60) return { text: 'Good', color: 'from-yellow-400 to-orange-500', emoji: '👍' };
    return { text: 'Needs Improvement', color: 'from-red-400 to-pink-500', emoji: '💪' };
  };

  const scoreInfo = getScoreText(results.overallScore);

  return (
    <div className="space-y-8">
      {/* Overall Score */}
      <div className="glass-strong rounded-3xl p-8 hover-glass transition-all duration-300 slide-up">
        <h3 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          Overall Match Score
        </h3>
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <ScoreRing score={results.overallScore} />
            <div className="absolute -top-2 -right-2">
              <span className="text-2xl">{scoreInfo.emoji}</span>
            </div>
          </div>
          <div className="text-center space-y-3">
            <div className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${scoreInfo.color} text-white font-semibold text-lg shadow-lg`}>
              {scoreInfo.text} Match
            </div>
            <p className="text-gray-600 dark:text-gray-300 max-w-sm mx-auto leading-relaxed">
              Your resume shows a <strong>{scoreInfo.text.toLowerCase()}</strong> alignment with this position. 
              {results.overallScore >= 80 && " You're well-positioned for this role!"}
              {results.overallScore >= 60 && results.overallScore < 80 && " Some improvements could boost your chances."}
              {results.overallScore < 60 && " Focus on the suggestions below to improve your match."}
            </p>
          </div>
        </div>
        
        {/* Score breakdown preview */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 glass rounded-2xl">
            <div className="text-2xl font-bold text-blue-500 dark:text-blue-400">
              {results.skillsAnalysis?.matchedKeywords?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Keywords Found</div>
          </div>
          <div className="text-center p-4 glass rounded-2xl">
            <div className="text-2xl font-bold text-purple-500 dark:text-purple-400">
              {results.formattingScore?.score || 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">ATS Friendly</div>
          </div>
          <div className="text-center p-4 glass rounded-2xl">
            <div className="text-2xl font-bold text-green-500 dark:text-green-400">
              {results.experienceRelevance?.score || 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Strong Matches</div>
          </div>
        </div>
      </div>

      <KeywordAnalysis analysis={results.skillsAnalysis} />
      <ExperienceRelevance relevance={results.experienceRelevance} />
      <FormattingScore formatting={results.formattingScore} />
      <ActionableAdvice advice={results.actionableAdvice} />
    </div>
  );
};

export default AnalysisResults;