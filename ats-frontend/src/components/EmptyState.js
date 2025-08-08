import React from 'react';

const EmptyState = () => {
  return (
    <div className="glass-strong rounded-3xl p-12 text-center hover-lift transition-all duration-500 relative overflow-hidden">
      {/* Animated top border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x"></div>
      
      <div className="relative mb-10">
        <div className="w-36 h-36 mx-auto mb-8 relative">
          {/* Enhanced animated background circles */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full animate-pulse blur-sm"></div>
          <div className="absolute inset-2 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full animate-pulse blur-sm" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute inset-4 bg-gradient-to-r from-pink-400/30 to-cyan-400/30 rounded-full animate-pulse blur-sm" style={{ animationDelay: '1s' }}></div>
          
          {/* Main icon with enhanced styling */}
          <div className="absolute inset-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          
          {/* Rotating orbit ring */}
          <div className="absolute inset-0 border-2 border-dashed border-purple-300/50 rounded-full animate-spin" style={{ animationDuration: '10s' }}></div>
        </div>
        
        {/* Enhanced floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: `${4 + Math.random() * 6}px`,
                height: `${4 + Math.random() * 6}px`,
                background: `linear-gradient(135deg, ${
                  ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 6)]
                }40, ${
                  ['#A855F7', '#60A5FA', '#22D3EE', '#34D399', '#FBBF24', '#F87171'][Math.floor(Math.random() * 6)]
                }60)`,
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      <h3 className="text-4xl font-black neon-text mb-6">
        Ready to Analyze
      </h3>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-lg mx-auto leading-relaxed font-light">
        Upload your resume and paste the job description to get comprehensive AI-powered insights and boost your chances
      </p>
      
      {/* Enhanced feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="glass p-6 rounded-2xl hover-glow transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h4 className="font-bold text-gray-800 dark:text-white mb-2">Smart Analysis</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">AI-powered resume evaluation</p>
        </div>
        
        <div className="glass p-6 rounded-2xl hover-glow transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4 className="font-bold text-gray-800 dark:text-white mb-2">Instant Results</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">Get feedback in seconds</p>
        </div>
        
        <div className="glass p-6 rounded-2xl hover-glow transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </div>
          <h4 className="font-bold text-gray-800 dark:text-white mb-2">ATS Friendly</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">Optimized for job systems</p>
        </div>
      </div>
      
      {/* Call to action hint */}
      <div className="mt-10 glass px-6 py-4 rounded-2xl inline-flex items-center space-x-3">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Start by uploading your resume above</span>
      </div>
    </div>
  );
};

export default EmptyState;