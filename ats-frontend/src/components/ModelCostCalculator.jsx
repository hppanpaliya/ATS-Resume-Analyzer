/**
 * ModelCostCalculator Component
 * Displays estimated costs and performance metrics for selected models
 * Helps users understand pricing and capability trade-offs
 */

import React, { useMemo } from 'react';

/**
 * Utility functions for formatting and calculating model metrics
 */
const formatContextLength = (length) => {
  if (!length) return 'Unknown';
  if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
  if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
  return length.toString();
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp * 1000).toLocaleDateString();
};

/**
 * ModelCostCalculator Component
 * Shows performance and cost information for a model
 */
const ModelCostCalculator = ({ model, isSelected = false }) => {
  if (!model) {
    return null;
  }

  /**
   * Calculate estimated cost based on tokens and model pricing
   * Note: Actual pricing varies, this is for UI estimation only
   */
  const estimatedCostPerMillion = useMemo(() => {
    // Fallback pricing estimates (in USD per million tokens)
    const pricingEstimates = {
      'google/gemini': 0.075,
      'openai/gpt-4': 3.0,
      'openai/gpt-3.5': 0.5,
      'anthropic/claude': 1.0,
      'meta/llama': 0.1,
      'default': 0.1
    };

    const modelId = (model.id || '').toLowerCase();
    for (const [key, price] of Object.entries(pricingEstimates)) {
      if (modelId.includes(key)) {
        return price;
      }
    }
    return pricingEstimates.default;
  }, [model.id]);

  /**
   * Estimate cost for typical resume analysis (2000 tokens)
   */
  const estimatedAnalysisCost = useMemo(() => {
    const inputTokens = 2000; // Typical resume + job description
    const outputTokens = 500; // Typical analysis output
    const totalTokens = inputTokens + outputTokens;
    const costInDollars = (totalTokens / 1000000) * estimatedCostPerMillion;
    return costInDollars.toFixed(4);
  }, [estimatedCostPerMillion]);

  /**
   * Determine performance tier based on model characteristics
   */
  const performanceTier = useMemo(() => {
    if (model.recommended) return 'Recommended';
    if (model.context_length >= 100000) return 'Premium';
    if (model.context_length >= 32000) return 'Advanced';
    return 'Standard';
  }, [model.context_length, model.recommended]);

  return (
    <div className={`p-3 rounded-lg transition-all duration-200 ${
      isSelected 
        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
        : 'bg-gray-50 dark:bg-gray-800/50'
    }`}>
      <div className="space-y-2 text-xs">
        {/* Performance Tier */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Tier:</span>
          <span className={`font-semibold ${
            isSelected 
              ? 'text-blue-700 dark:text-blue-300' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {performanceTier}
          </span>
        </div>

        {/* Context Length */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Context:</span>
          <span className={isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}>
            {formatContextLength(model.context_length)}
          </span>
        </div>

        {/* Estimated Cost */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">Est. Cost/Analysis:</span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            ${estimatedAnalysisCost}
          </span>
        </div>

        {/* Release Date */}
        {model.created && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Released:</span>
            <span className="text-gray-500 dark:text-gray-400">{formatDate(model.created)}</span>
          </div>
        )}

        {/* Provider Badge */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">Provider:</span>
          <span className="inline-block px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
            {model.provider || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ModelCostCalculator;
