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

  return (
    <>
      {/* Overall Score */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Overall Match Score</h3>
        <div className="flex items-center justify-center">
          <ScoreRing score={results.overallScore} />
        </div>
        <p className="text-center text-gray-600 mt-4">
          Your resume is a <strong>{
            results.overallScore >= 80 ? 'strong' :
            results.overallScore >= 60 ? 'good' : 'fair'
          }</strong> match for this position
        </p>
      </div>

      <KeywordAnalysis analysis={results.keywordAnalysis} />
      <ExperienceRelevance relevance={results.experienceRelevance} />
      <FormattingScore formatting={results.atsFormattingScore} />
      <ActionableAdvice advice={results.actionableAdvice} />
    </>
  );
};

export default AnalysisResults;