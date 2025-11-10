import React, { useState, useEffect } from 'react';

const ModelParameters = ({ 
  parameters = {}, 
  onParametersChange,
  disabled = false 
}) => {
  const [localParameters, setLocalParameters] = useState(() => {
    // Load from localStorage on initial render
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('modelParameters');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            temperature: parsed.temperature ?? 0.15,
            max_tokens: parsed.max_tokens ?? 4000,
            include_reasoning: parsed.include_reasoning ?? false,
            ...parameters // Override with props if provided
          };
        }
      }
    } catch (err) {
      console.warn('Failed to load saved model parameters:', err);
    }
    return {
      temperature: 0.15,
      max_tokens: 4000,
      include_reasoning: false,
      ...parameters
    };
  });

  // Save to localStorage whenever localParameters change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('modelParameters', JSON.stringify(localParameters));
      }
    } catch (err) {
      console.error('Failed to save model parameters:', err);
    }
  }, [localParameters]);

  // Update local state when props change (for external updates)
  useEffect(() => {
    setLocalParameters(prev => ({
      ...prev,
      ...parameters
    }));
  }, [parameters]);

  const handleParameterChange = (paramName, value) => {
    const updatedParams = {
      ...localParameters,
      [paramName]: value
    };
    setLocalParameters(updatedParams);
    onParametersChange(updatedParams);
  };

  return (
    <div className="glass-strong rounded-3xl p-6 hover-glass transition-all duration-300">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        Advanced Parameters
      </h3>

      <div className="space-y-6">
        {/* Show Reasoning Toggle - TOP */}
        <div className="p-4 glass rounded-2xl border border-amber-200/50 dark:border-amber-700/50">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-800 dark:text-gray-300 flex items-center flex-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-bold mr-2">
                💭
              </span>
              Show Reasoning
            </label>
            <button
              onClick={() => handleParameterChange('include_reasoning', !localParameters.include_reasoning)}
              disabled={disabled}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ${
                localParameters.include_reasoning 
                  ? 'bg-amber-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                  localParameters.include_reasoning ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-400 mt-3 ml-8">
            {localParameters.include_reasoning 
              ? 'Model will show step-by-step reasoning and explanations for its analysis.'
              : 'Model will provide results without detailed reasoning (faster response).'}
          </p>
        </div>

        {/* Max Tokens Control */}
        <div className="p-4 glass rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-800 dark:text-gray-300 flex items-center">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold mr-2">📝
                
              </span>
              Max Tokens
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {localParameters.max_tokens ?? 4000} / 16000
            </span>
          </div>
          <input
            type="range"
            min="500"
            max="16000"
            step="100"
            value={localParameters.max_tokens ?? 4000}
            onChange={(e) => handleParameterChange('max_tokens', parseInt(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: disabled 
                ? '#d1d5db' 
                : `linear-gradient(to right, #60a5fa 0%, #60a5fa ${((localParameters.max_tokens ?? 4000) / 16000) * 100}%, #e5e7eb ${((localParameters.max_tokens ?? 4000) / 16000) * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
            <span>Min: 500</span>
            <span>Max: 16000</span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-400 mt-3 leading-relaxed">
            Controls the maximum length of the generated response. Higher values allow for longer, more detailed analyses.
          </p>
        </div>

        {/* Temperature Control */}
        <div className="p-4 glass rounded-2xl border border-purple-200/50 dark:border-purple-700/50">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-800 dark:text-gray-300 flex items-center">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-bold mr-2">🌡️
              
              </span>
              Temperature
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {(localParameters.temperature ?? 0.15).toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={localParameters.temperature ?? 0.15}
            onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: disabled 
                ? '#d1d5db' 
                : `linear-gradient(to right, #a78bfa 0%, #a78bfa ${(localParameters.temperature ?? 0.15) * 50}%, #e5e7eb ${(localParameters.temperature ?? 0.15) * 50}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
            <span>Deterministic</span>
            <span>Creative</span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-400 mt-3 leading-relaxed">
            Lower values (0.0-0.5) produce more consistent, focused results. Higher values (1.5-2.0) generate more creative, varied responses.
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              <p className="font-medium mb-1">About these parameters:</p>
              <p>Customize how the AI model analyzes your resume. Settings are saved automatically to your browser.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelParameters;
