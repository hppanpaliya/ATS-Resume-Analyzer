import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalyses } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const AnalysisHistory = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const handleViewAnalysis = (analysisId) => {
    navigate(`/analysis/${analysisId}`);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Analysis History</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {analyses.length} analyses
        </div>
      </div>

      {analyses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No analyses yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Run your first resume analysis to see results here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="glass-strong rounded-2xl p-6 hover-glass transition-all duration-300 cursor-pointer"
              onClick={() => handleViewAnalysis(analysis.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {analysis.jobTitle || 'Untitled Analysis'}
                    </h3>
                    {analysis.overallScore && (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        analysis.overallScore >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        analysis.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {analysis.overallScore}/100
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Resume:</span> {analysis.resume?.title || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {formatDate(analysis.createdAt)}
                    </div>
                    <div>
                      <span className="font-medium">Model:</span> {analysis.modelUsed || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          <button
            onClick={() => loadAnalyses(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 glass rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-300"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => loadAnalyses(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 glass rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalysisHistory;