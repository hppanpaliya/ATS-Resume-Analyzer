import React from 'react';

const ErrorMessage = ({ message }) => {
  return (
    <div className="glass-strong border border-red-300/50 dark:border-red-700/50 rounded-2xl p-6 card-enter">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-red-600 dark:text-red-400 font-medium">
            {message}
          </p>
          <p className="text-sm text-red-500 dark:text-red-500 mt-2 opacity-80">
            Please try again or contact support if the issue persists.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;