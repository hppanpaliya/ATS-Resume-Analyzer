/**
 * useModelSelector Hook
 * Custom hook that encapsulates all model selection logic
 * Handles fetching models, filtering, sorting, and state management
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAvailableModels } from '../services/api';

const DEFAULT_MODEL = 'openrouter/free';

export const useModelSelector = (selectedModel, onModelSelect, disabled = false) => {
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

  /**
   * Fetch models from backend
   */
  const fetchModels = useCallback(async () => {
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
        name: 'OpenRouter Free',
        provider: 'OpenRouter',
        description: 'OpenRouter route that automatically selects an available free model.',
        created: Math.floor(Date.now() / 1000),
        context_length: 128000,
        recommended: true
      };
      setModels([fallbackModel]);
      onModelSelect(DEFAULT_MODEL);
    } finally {
      setLoading(false);
    }
  }, [selectedModel, onModelSelect]);

  useEffect(() => {
    if (!disabled) {
      fetchModels();
    }
  }, [disabled, fetchModels]);

  /**
   * Detect mobile screen size
   */
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is typical tablet breakpoint
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  /**
   * Context length filter options
   */
  const contextLengthOptions = useMemo(() => [
    { value: 'all', label: 'All Context Lengths' },
    { value: 'small', label: '< 32K tokens', min: 0, max: 32000 },
    { value: 'medium', label: '32K - 128K tokens', min: 32000, max: 128000 },
    { value: 'large', label: '128K+ tokens', min: 128000, max: Infinity }
  ], []);

  /**
   * Filtered and sorted models based on current filters
   */
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

  /**
   * Refresh models from backend
   */
  const handleRefreshModels = async () => {
    await fetchModels();
  };

  /**
   * Clear all active filters
   */
  const clearFilters = () => {
    setSearchQuery('');
    setShowRecommendedOnly(false);
    setContextLengthFilter('all');
    setSortBy('created');
    setSortOrder('desc');
  };

  /**
   * Toggle expanded/collapsed state for a model description
   */
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

  /**
   * Get current selected model info
   */
  const currentModel = models.find(model => model.id === selectedModel) || 
                      models.find(model => model.id === DEFAULT_MODEL) || 
                      models[0];

  return {
    // State
    models,
    loading,
    error,
    searchQuery,
    showRecommendedOnly,
    contextLengthFilter,
    sortBy,
    sortOrder,
    showAdvancedFilters,
    expandedDescriptions,
    isMobile,
    currentModel,
    contextLengthOptions,
    filteredAndSortedModels,
    
    // Setters
    setSearchQuery,
    setShowRecommendedOnly,
    setContextLengthFilter,
    setSortBy,
    setSortOrder,
    setShowAdvancedFilters,
    
    // Actions
    handleRefreshModels,
    clearFilters,
    toggleDescription
  };
};
