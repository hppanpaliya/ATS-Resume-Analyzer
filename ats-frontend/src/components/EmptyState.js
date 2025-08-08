import React from 'react';

const EmptyState = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        Ready to Analyze
      </h3>
      <p className="text-gray-500">
        Upload your resume and paste the job description to get started
      </p>
    </div>
  );
};

export default EmptyState;