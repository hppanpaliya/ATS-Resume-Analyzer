import React from 'react';

const sizeClassMap = {
  sm: 'h-4 w-4 mr-2',
  md: 'h-5 w-5 mr-3',
  lg: 'h-6 w-6 mr-3',
};

const LoadingSpinner = ({ size = 'md', label = 'Loading...', inline = true }) => {
  const spinnerSize = sizeClassMap[size] || sizeClassMap.md;
  const accessibleLabel = label || 'Loading...';

  return (
    <span
      className={`flex items-center justify-center gpu-optimized ${inline ? '' : 'w-full'}`}
      role="status"
      aria-live="polite"
      aria-label={accessibleLabel}
    >
      <svg className={`animate-spin gpu-optimized ${spinnerSize}`} viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
        <path className="opacity-75" fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
      {label}
    </span>
  );
};

export default LoadingSpinner;
