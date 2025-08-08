import React from 'react';

const FormattingScore = ({ formatting }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">ATS Formatting Score</h3>
      <div className="flex items-center mb-4">
        <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
          <div 
            className={`h-4 rounded-full ${
              formatting.score >= 80 ? 'bg-green-500' :
              formatting.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${formatting.score}%` }}
          />
        </div>
        <span className="font-semibold">{formatting.score}%</span>
      </div>
      <p className="text-gray-700">{formatting.feedback}</p>
    </div>
  );
};

export default FormattingScore;