import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AnalysisResults from '../components/AnalysisResults';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ThemeToggle from '../components/ThemeToggle';
import useTheme from '../hooks/useTheme';
import { getAnalysisById } from '../services/api';

const AnalysisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError('');

        // Check if analysis data was passed via navigation state
        if (location.state?.analysis) {
          setAnalysis(location.state.analysis);
          setLoading(false);
          return;
        }

        // If no data in state but we have an ID, fetch from API
        if (id) {
          const analysisData = await getAnalysisById(id);
          setAnalysis(analysisData);
        } else {
          setError('No analysis ID provided');
        }
      } catch (err) {
        setError(err.message || 'Failed to load analysis');
        console.error('Error loading analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id, location.state]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-bg paper-texture flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-700 dark:text-gray-300 mt-4">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen animated-bg paper-texture">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <ErrorMessage message={error} />
            <div className="text-center mt-8">
              <button
                onClick={handleBackToDashboard}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg paper-texture relative overflow-hidden">
      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
      </div>

      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center space-x-3 px-4 py-2 glass rounded-xl hover:bg-white/10 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Analysis Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Detailed ATS compatibility analysis
            </p>
          </div>

          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Analysis Content */}
        <div className="max-w-6xl mx-auto">
          <AnalysisResults results={analysis} />
        </div>

        {/* Footer Actions */}
        <div className="text-center mt-12">
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleBackToDashboard}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
            >
              New Analysis
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 glass text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-white/10 transition-all duration-300"
            >
              Print Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;