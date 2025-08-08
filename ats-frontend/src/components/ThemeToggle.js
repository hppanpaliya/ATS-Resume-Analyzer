import React from 'react';

const ThemeToggle = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle fixed top-4 right-4 sm:top-6 sm:right-6 z-50 p-3 sm:p-4 rounded-2xl transition-all duration-300 hover:scale-110 group"
      aria-label="Toggle theme"
    >
      <div className="relative">
        {theme === 'dark' ? (
          <div className="flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-300 transition-all duration-300 group-hover:rotate-180" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
            </svg>
            <div className="absolute inset-0 bg-yellow-300/20 rounded-full animate-ping"></div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400 transition-all duration-300 group-hover:-rotate-12" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
            </svg>
            <div className="absolute inset-0 bg-purple-400/20 rounded-full animate-ping"></div>
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-3 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
        Switch to {theme === 'dark' ? 'light' : 'dark'} mode
      </div>
    </button>
  );
};

export default ThemeToggle;
