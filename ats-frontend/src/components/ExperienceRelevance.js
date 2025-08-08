import React from 'react';

const ExperienceRelevance = ({ relevance }) => {
  const getMatchColor = (strength) => {
    switch(strength) {
      case 'Strong': return 'text-green-600 bg-green-50';
      case 'Partial': return 'text-yellow-600 bg-yellow-50';
      case 'Weak': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Experience Relevance</h3>
      <p className="text-gray-700 mb-4">{relevance.summary}</p>
      
      <div className="space-y-3">
        {relevance.details.map((detail, idx) => (
          <div key={idx} className="border-l-4 border-gray-200 pl-4">
            <div className="font-medium text-gray-800 mb-1">
              {detail.jdRequirement}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              {detail.resumeEvidence}
            </div>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getMatchColor(detail.matchStrength)}`}>
              {detail.matchStrength} Match
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperienceRelevance;
