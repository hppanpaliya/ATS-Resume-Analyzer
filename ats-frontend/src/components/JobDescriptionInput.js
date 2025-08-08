import React from 'react';

const JobDescriptionInput = ({ value, onChange }) => {
  return (
    <div className="glass-strong rounded-3xl p-8 hover-glass transition-all duration-300">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800 dark:text-white">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-xl mr-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        Job Description
      </h2>
      
      <div className="relative">
        <textarea
          className="w-full h-80 p-6 glass rounded-2xl border-0 focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-300 focus:outline-none resize-none text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
          placeholder="Paste the complete job description here...

• Include required skills and qualifications
• Add preferred experience details  
• Copy any specific requirements mentioned
• Include company culture information

The more detailed the job description, the better our AI can analyze your resume match!"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        
        {/* Character counter */}
        <div className="absolute bottom-4 right-4 glass px-3 py-1 rounded-full">
          <span className="text-xs text-gray-500 dark:text-gray-100">
            {value.length} characters
          </span>
        </div>
        
        {/* Helper text */}
        {!value && (
          <div className="absolute bottom-16 left-6 pointer-events-none">
            <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">Tip: Include all requirements and qualifications</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Quick actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onChange('')}
          className="glass px-4 py-2 rounded-full text-sm text-gray-600 dark:text-gray-300 hover:bg-red-100/20 dark:hover:bg-red-900/20 transition-colors duration-200"
        >
          Clear
        </button>
        <button
          className="glass px-4 py-2 rounded-full text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-100/20 dark:hover:bg-blue-900/20 transition-colors duration-200"
          onClick={() => {
            const sampleJD = `We are seeking a Senior Software Engineer to join our dynamic team. 

Required Skills:
• 5+ years of experience in software development
• Proficiency in JavaScript, React, and Node.js
• Experience with cloud platforms (AWS, Azure)
• Strong problem-solving abilities
• Bachelor's degree in Computer Science or related field

Preferred Qualifications:
• Experience with TypeScript and GraphQL
• Knowledge of containerization (Docker, Kubernetes)
• Previous work in agile development environments
• Leadership and mentoring experience

This role offers competitive compensation, flexible work arrangements, and opportunities for professional growth.`;
            onChange(sampleJD);
          }}
        >
          Try Sample
        </button>
      </div>
    </div>
  );
};

export default JobDescriptionInput;