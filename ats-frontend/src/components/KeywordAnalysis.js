import React from 'react';

const KeywordAnalysis = ({ analysis }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Keyword Analysis</h3>
      
      <div className="mb-4">
        <h4 className="font-medium text-green-700 mb-2">✓ Found Keywords</h4>
        <div className="flex flex-wrap gap-2">
          {analysis.foundKeywords.map((keyword, idx) => (
            <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              {keyword}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-red-700 mb-2">✗ Missing Keywords</h4>
        <div className="flex flex-wrap gap-2">
          {analysis.missingKeywords.map((keyword, idx) => (
            <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeywordAnalysis;