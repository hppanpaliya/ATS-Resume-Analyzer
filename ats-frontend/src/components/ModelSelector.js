import React, { useState, useEffect, useMemo } from 'react';
import { getAvailableModels } from '../services/api';

const ModelSelector = ({ onModelSelect, selectedModel, disabled = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
  const [contextLengthFilter, setContextLengthFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);
  
  // Default fallback model
  const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';

  // Fetch models from backend
  const fetchModels = React.useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const models = await getAvailableModels();
      // Sort by created date (desc) by default
      const sortedModels = (models || []).sort((a, b) => {
        return new Date(b.created * 1000) - new Date(a.created * 1000);
      });
      
      setModels(sortedModels);
      
      // Set default model if none selected and models are available
      if (!selectedModel && sortedModels.length > 0) {
        const defaultModel = sortedModels.find(m => m.id === DEFAULT_MODEL) || sortedModels[0];
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
        created: Math.floor(Date.now() / 1000),
        context_length: 32768,
        recommended: true
      };
      setModels([fallbackModel]);
      onModelSelect(DEFAULT_MODEL);
    } finally {
      setLoading(false);
    }
  }, [selectedModel, onModelSelect, DEFAULT_MODEL]);

  useEffect(() => {
    if (!disabled) {
      fetchModels();
    }
  }, [disabled, fetchModels]);

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is typical tablet breakpoint
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Context length filter options
  const contextLengthOptions = useMemo(() => [
    { value: 'all', label: 'All Context Lengths' },
    { value: 'small', label: '< 32K tokens', min: 0, max: 32000 },
    { value: 'medium', label: '32K - 128K tokens', min: 32000, max: 128000 },
    { value: 'large', label: '128K+ tokens', min: 128000, max: Infinity }
  ], []);

  // Filtered and sorted models
  const filteredAndSortedModels = useMemo(() => {
    let filtered = [...models];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(model => 
        model.name.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query)
      );
    }

    // Apply recommended filter
    if (showRecommendedOnly) {
      filtered = filtered.filter(model => model.recommended);
    }

    // Apply context length filter
    if (contextLengthFilter !== 'all') {
      const filterOption = contextLengthOptions.find(opt => opt.value === contextLengthFilter);
      if (filterOption) {
        filtered = filtered.filter(model => {
          const contextLength = model.context_length || 0;
          return contextLength >= filterOption.min && contextLength < filterOption.max;
        });
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'created') {
        compareValue = (a.created || 0) - (b.created || 0);
      } else if (sortBy === 'context_length') {
        compareValue = (a.context_length || 0) - (b.context_length || 0);
      } else if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortBy === 'provider') {
        compareValue = a.provider.localeCompare(b.provider);
      }
      
      return sortOrder === 'desc' ? -compareValue : compareValue;
    });

    return filtered;
  }, [models, searchQuery, showRecommendedOnly, contextLengthFilter, sortBy, sortOrder, contextLengthOptions]);

  const handleRefreshModels = async () => {
    await fetchModels();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setShowRecommendedOnly(false);
    setContextLengthFilter('all');
    setSortBy('created');
    setSortOrder('desc');
  };

  const toggleDescription = (modelId, event) => {
    event.stopPropagation(); // Prevent model selection
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modelId)) {
        newSet.delete(modelId);
      } else {
        newSet.add(modelId);
      }
      return newSet;
    });
  };

  const truncateDescription = (description) => {
    const maxLength = isMobile ? 120 : 260;
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatContextLength = (length) => {
    if (!length) return 'Unknown';
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
    return length.toString();
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
            {filteredAndSortedModels.length}/{models.length} Models
          </span>
        </h3>
        
        <div className="flex items-center space-x-2">
          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`glass p-2 rounded-full transition-colors duration-200 ${
              showAdvancedFilters ? 'bg-blue-100/20 dark:bg-blue-900/20' : 'hover:bg-blue-100/20 dark:hover:bg-blue-900/20'
            }`}
            title="Advanced filters"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
          </button>
          
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

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mb-4 p-4 glass rounded-2xl space-y-4 fade-in">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search models by name, provider, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 glass rounded-xl border-0 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 focus:outline-none text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="space-y-3">
            {/* First Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Recommended Filter */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recommended-filter"
                  checked={showRecommendedOnly}
                  onChange={(e) => setShowRecommendedOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="recommended-filter" className="text-sm text-gray-700 dark:text-gray-300">
                  ⭐ Recommended only
                </label>
              </div>

              {/* Context Length Filter */}
              <select
                value={contextLengthFilter}
                onChange={(e) => setContextLengthFilter(e.target.value)}
                className="glass rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 focus:outline-none w-full sm:w-auto"
              >
                {contextLengthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Second Row - Sort Controls */}
            <div className="flex gap-2 items-stretch">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="glass rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 focus:outline-none flex-1"
              >
                <option value="created">Sort by Date</option>
                <option value="context_length">Sort by Context</option>
                <option value="name">Sort by Name</option>
                <option value="provider">Sort by Provider</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="glass rounded-xl px-3 py-2 text-sm text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-blue-100/20 dark:hover:bg-blue-900/20 transition-colors duration-200 flex-shrink-0"
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                aria-label={`Toggle sort order to ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                <svg 
                  className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
                    sortOrder === 'desc' ? 'rotate-180' : ''
                  }`} 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Active Filters & Clear */}
          {(searchQuery || showRecommendedOnly || contextLengthFilter !== 'all' || sortBy !== 'created' || sortOrder !== 'desc') && (
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <span className="px-2 py-1 bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    Search: "{searchQuery}"
                  </span>
                )}
                {showRecommendedOnly && (
                  <span className="px-2 py-1 bg-yellow-100/50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs">
                    ⭐ Recommended
                  </span>
                )}
                {contextLengthFilter !== 'all' && (
                  <span className="px-2 py-1 bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                    {contextLengthOptions.find(opt => opt.value === contextLengthFilter)?.label}
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
              >
                Clear all filters
              </button>
            </div>
          )}
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
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {currentModel.description}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>Provider: {currentModel.provider}</span>
                {currentModel.context_length && (
                  <span>Context: {formatContextLength(currentModel.context_length)} tokens</span>
                )}
                {currentModel.created && (
                  <span>Released: {formatDate(currentModel.created)}</span>
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
        <div className="space-y-2 overflow-y-auto fade-in" style={{ maxHeight: '500px' }}>
          {loading && models.length > 0 && (
            <div className="text-center py-2">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Refreshing models...</span>
              </div>
            </div>
          )}
          
          {filteredAndSortedModels.length === 0 && !loading ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">No models match your filters</p>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear filters to see all models
              </button>
            </div>
          ) : (
            filteredAndSortedModels.map((model, idx) => {
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
                      <div className="text-sm mb-2">
                        <p className={`${
                          isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {expandedDescriptions.has(model.id) 
                            ? model.description 
                            : truncateDescription(model.description)
                          }
                        </p>
                        {model.description.length > (isMobile ? 120 : 260) && (
                          <button
                            onClick={(e) => toggleDescription(model.id, e)}
                            className={`text-xs mt-1 transition-colors duration-200 ${
                              isSelected 
                                ? 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300' 
                                : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
                            }`}
                          >
                            {expandedDescriptions.has(model.id) ? 'See less' : 'See more'}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{model.provider}</span>
                        {model.context_length && (
                          <span>{formatContextLength(model.context_length)} tokens</span>
                        )}
                        {model.created && (
                          <span>{formatDate(model.created)}</span>
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
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;