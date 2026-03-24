/**
 * ModelFilters Component
 * Sub-component for advanced model filtering controls
 * Handles search, recommended filter, context length filter, and sorting
 */

import React from 'react';

const ModelFilters = ({
  searchQuery,
  onSearchChange,
  showRecommendedOnly,
  onRecommendedChange,
  contextLengthFilter,
  onContextLengthChange,
  contextLengthOptions,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
  isActive
}) => {
  if (!isActive) return null;

  return (
    <div className="mb-4 p-4 glass rounded-2xl space-y-4 fade-in">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search models by name, provider, or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 glass rounded-xl border-0 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 focus:outline-none text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
        />
        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
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
              onChange={(e) => onRecommendedChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="recommended-filter" className="text-sm text-gray-700 dark:text-gray-300">
              ⭐ Recommended only
            </label>
          </div>

          {/* Context Length Filter */}
          <select
            value={contextLengthFilter}
            onChange={(e) => onContextLengthChange(e.target.value)}
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
            onChange={(e) => onSortByChange(e.target.value)}
            className="glass rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 focus:outline-none flex-1"
          >
            <option value="created">Sort by Date</option>
            <option value="context_length">Sort by Context</option>
            <option value="name">Sort by Name</option>
            <option value="provider">Sort by Provider</option>
          </select>
          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
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
            onClick={onClearFilters}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ModelFilters;
