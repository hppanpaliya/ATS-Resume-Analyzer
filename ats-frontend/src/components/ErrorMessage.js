import React from 'react';

const ErrorMessage = ({ message }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
      {message}
    </div>
  );
};

export default ErrorMessage;