import React, { useState, useEffect } from 'react';
import { getAvailableModels } from '../services/api';

const ModelSelector = ({ onModelSelect, selectedModel, disabled = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cacheInfo, setCacheInfo] = useState(null);
  
  // Default fallback model
  const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';

  // Fetch models from backend
  useEffect(() => {
    if (!disabled) {
      fetchModels();
    }
  }, [disabled]);

  const fetchModels = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getAvailableModels();
      setModels(response.models || []);
      setCacheInfo(response.cacheInfo);
      
      // Set default model if none selected and models are available
      if (!selectedModel && response.models && response.models.length > 0) {
        const defaultModel = response.models.find(m => m.id === response.default) || response.models[0];
        onModelSelect(defaultModel.id);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setError('Failed to load AI models. Using default model.');
      
      // Fallback to default model
      const fallbackModel = {
        id: DEFAULT_MODEL,
        name: 'Gemini 2.0 Flash',
        provider: 'Google',
        description: 'Google\'s latest Gemini model with excellent reasoning capabilities',
        recommended: true
      };
      setModels([fallbackModel]);
      onModelSelect(DEFAULT_MODEL);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshModels = async () => {
    await fetchModels();
  };

  // Get current model info
  const currentModel = models.find(model => model.id === selectedModel) || 
                     models.find(model => model.id === DEFAULT_MODEL) || 
                     models[0];

  if (disabled) {
    return null;
  }

  if (loading && models.length === 0) {
    return (
      <div className="glass-strong rounded-3xl p-6 hover-glass transition-all duration-300">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-300">Loading AI models...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-3xl p-6 hover-glass transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-xl mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          AI Model Selection
          <span className="ml-3 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
            {models.length} Free Models
          </span>
        </h3>
        
        <div className="flex items-center space-x-2">
          {/* Refresh button */}
          <button
            onClick={handleRefreshModels}
            disabled={loading}
            className="glass p-2 rounded-full hover:bg-blue-100/20 dark:hover:bg-blue-900/20 transition-colors duration-200 disabled:opacity-50"
            title="Refresh models"
          >
            <svg 
              className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          {/* Expand/Collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="glass px-3 py-1 rounded-full text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-100/20 dark:hover:bg-blue-900/20 transition-colors duration-200"
          >
            {isExpanded ? 'Hide' : 'Show'} Models
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-yellow-100/50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-2xl">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-300 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">{error}</p>
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      {currentModel && (
        <div className="mb-4 p-4 glass rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-gray-800 dark:text-white">
                  {currentModel.name}
                </span>
                {currentModel.recommended && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                    ⭐ Recommended
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {currentModel.description}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Provider: {currentModel.provider}</span>
                {currentModel.context_length && (
                  <span>Context: {currentModel.context_length.toLocaleString()} tokens</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Model List */}
      {isExpanded && (
        <div className="space-y-2 max-h-80 overflow-y-auto fade-in">
          {loading && models.length > 0 && (
            <div className="text-center py-2">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Refreshing models...</span>
              </div>
            </div>
          )}
          
          {models.map((model, idx) => {
            const isSelected = model.id === selectedModel;
            return (
              <button
                key={model.id}
                onClick={() => onModelSelect(model.id)}
                className={`w-full p-4 rounded-2xl text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-100/50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600'
                    : 'glass hover:bg-blue-50/30 dark:hover:bg-blue-900/20'
                }`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`font-medium ${
                        isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-white'
                      }`}>
                        {model.name}
                      </span>
                      {model.recommended && (
                        <span className="text-xs">⭐</span>
                      )}
                    </div>
                    <p className={`text-sm mb-2 ${
                      isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {model.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{model.provider}</span>
                      {model.context_length && (
                        <span>{model.context_length.toLocaleString()} tokens</span>
                      )}
                      {model.architecture?.modality && (
                        <span>{model.architecture.modality}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full ml-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          
          {models.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">No models available</p>
            </div>
          )}
        </div>
      )}

      {/* Cache Info */}
      {cacheInfo && (
        <div className="mt-4 p-3 glass rounded-2xl">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                <strong>Models loaded from OpenRouter:</strong> {models.length} free models available.
                {cacheInfo.lastFetched && (
                  <span className="block mt-1">
                    Last updated: {new Date(cacheInfo.lastFetched).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;