import React from "react";

const JobDescriptionInput = ({ value, onChange }) => {
  return (
    <div className="glass-strong rounded-3xl p-8 hover-lift transition-all duration-500 relative overflow-hidden">
      {/* Animated top border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-gradient-x"></div>

      <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-800 dark:text-white">
        <div className="relative mr-4">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur-md opacity-75 animate-pulse-slow"></div>
          <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        Job Description
      </h2>

      <div className="relative group">
        <textarea
          className="w-full h-80 p-6 pb-20 glass rounded-2xl border-0 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-300 focus:outline-none resize-none text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-500 focus:scale-[1.01] focus:shadow-xl focus:shadow-emerald-500/20"
          placeholder="Paste the complete job description here...

• Include required skills and qualifications
• Add preferred experience details  
• Copy any specific requirements mentioned
• Include company culture information

The more detailed the job description, the better our AI can analyze your resume match!"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        {/* Enhanced helper text - positioned outside textarea */}
        {!value && (
          <div className="pt-2 top-2 left-2 right-2 pointer-events-none z-10">
            <div className="glass-strong rounded-xl p-3 border border-emerald-200/50 dark:border-emerald-700/50">
              <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
                <div className="w-5 h-5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium">💡 Include all requirements for better analysis</span>
              </div>
            </div>
          </div>
        )}

        {/* Character counter - properly positioned outside textarea
        <div className="absolute bottom-4 right-4 glass-strong px-4 py-2 rounded-full shadow-lg z-10">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{value.length.toLocaleString()} characters</span>
        </div> */}

        <div className=" pt-2 top-2 left-2 right-2 pointer-events-none z-10">
          <div className="glass-strong rounded-xl p-3 border border-emerald-200/50 dark:border-emerald-700/50">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{value.length.toLocaleString()} characters</span>  
          </div>
        </div>

        {/* Progress indicator - positioned outside textarea */}
        {value.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((value.length / 1000) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-medium">
                {value.length < 500 ? "Add more details" : value.length < 1000 ? "Good length" : "Excellent detail"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced quick actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => onChange("")}
          className="glass px-6 py-3 rounded-2xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-red-100/30 dark:hover:bg-red-900/30 transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Clear</span>
          </div>
        </button>

        <button
          className="glass px-6 py-3 rounded-2xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-blue-100/30 dark:hover:bg-blue-900/30 transition-all duration-300 hover:scale-105 hover:shadow-lg"
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
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span>Try Sample</span>
          </div>
        </button>

        <button
          className="glass px-6 py-3 rounded-2xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-purple-100/30 dark:hover:bg-purple-900/30 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          onClick={() => {
            if (navigator.clipboard && value) {
              navigator.clipboard.writeText(value);
            }
          }}
          disabled={!value}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>Copy</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default JobDescriptionInput;
