import React, { useState, useEffect } from 'react';
import { getAnalyses, getAnalysisById } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import AnalysisResults from './AnalysisResults';

const AnalysisHistory = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingDetails, setViewingDetails] = useState(false);

  const loadAnalyses = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await getAnalyses(pageNum, 10);
      setAnalyses(response.analyses);
      setTotalPages(response.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err.message || 'Failed to load analysis history');
      console.error('Error loading analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  const handleViewDetails = async (analysisId) => {
    try {
      setLoading(true);
      const analysis = await getAnalysisById(analysisId);
      setSelectedAnalysis(analysis);
      setViewingDetails(true);
    } catch (err) {
      setError(err.message || 'Failed to load analysis details');
      console.error('Error loading analysis details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedAnalysis(null);
    setViewingDetails(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && analyses.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (viewingDetails && selectedAnalysis) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBackToList}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to History</span>
          </button>
        </div>

        <div className="glass-strong rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Analysis Details
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Job Title</p>
              <p className="font-medium text-gray-800 dark:text-white">
                {selectedAnalysis.jobTitle || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Analyzed On</p>
              <p className="font-medium text-gray-800 dark:text-white">
                {formatDate(selectedAnalysis.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resume</p>
              <p className="font-medium text-gray-800 dark:text-white">
                {selectedAnalysis.resume?.title || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overall Score</p>
              <p className="font-medium text-gray-800 dark:text-white">
                {selectedAnalysis.overallScore ? `${selectedAnalysis.overallScore}/100` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <AnalysisResults results={selectedAnalysis} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="glass-strong rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Analysis History
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          View your past resume analyses and results
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {analyses.length === 0 && !loading ? (
        <div className="glass rounded-2xl p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            No Analysis History
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You haven't performed any resume analyses yet. Start by analyzing a resume to see your history here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <div key={analysis.id} className="glass rounded-2xl p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {analysis.jobTitle || 'Untitled Analysis'}
                    </h3>
                    {analysis.overallScore && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        analysis.overallScore >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        analysis.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {analysis.overallScore}/100
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Resume: {analysis.resume?.title || 'N/A'}</span>
                    <span>•</span>
                    <span>{formatDate(analysis.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleViewDetails(analysis.id)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => loadAnalyses(page - 1)}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Previous
          </button>

          <span className="text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => loadAnalyses(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalysisHistory;