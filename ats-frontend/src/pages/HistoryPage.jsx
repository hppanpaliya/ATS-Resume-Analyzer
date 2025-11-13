import React from 'react';
import AnalysisHistory from '../components/AnalysisHistory';
import JobDescriptionManager from '../components/JobDescriptionManager';

const HistoryPage = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <AnalysisHistory />
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <JobDescriptionManager />
      </div>
    </div>
  );
};

export default HistoryPage;