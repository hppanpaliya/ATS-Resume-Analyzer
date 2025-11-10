import React, { useState } from 'react';
import { analyzeResume, downloadResumeFile } from '../services/api';
import useAuthStore from '../stores/authStore';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import AnalysisResults from './AnalysisResults';

const ResumeDetail = ({ resume: initialResume, onBack, onEdit }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description to analyze against');
      return;
    }

    try {
      setAnalyzing(true);
      setError('');

      // Create a File object from the resume content for analysis
      const resumeBlob = new Blob([initialResume.content], { type: 'text/plain' });
      const resumeFile = new File([resumeBlob], `${initialResume.title}.txt`, { type: 'text/plain' });

      const result = await analyzeResume(resumeFile, jobDescription);
      setAnalysisResult(result);
      setShowAnalysis(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`http://localhost:3001/api/resumes/${initialResume.id}/export/${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to export as ${format.toUpperCase()}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${initialResume.id}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(`Failed to export resume: ${err.message}`);
    }
  };

  const handleDownloadOriginal = async () => {
    try {
      await downloadResumeFile(initialResume.id, initialResume.originalFileName || `resume-${initialResume.id}`);
    } catch (err) {
      setError(`Failed to download original file: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error && !initialResume) {
    return <ErrorMessage message={error} />;
  }

  if (!initialResume) {
    return <div>Resume not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors self-start"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Resumes
        </button>
        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          {initialResume.originalFileId && (
            <button
              onClick={handleDownloadOriginal}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              title="Download Original File"
            >
              <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Original
            </button>
          )}
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            title="Export as PDF"
          >
            <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
          <button
            onClick={() => handleExport('word')}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            title="Export as Word"
          >
            <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Word
          </button>
          <button
            onClick={() => onEdit(initialResume)}
            className="btn-glass text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* Resume Header */}
      <div className="glass-strong rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {initialResume.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Created {formatDate(initialResume.createdAt)}</span>
              {initialResume.updatedAt !== initialResume.createdAt && (
                <span className="hidden sm:inline">•</span>
              )}
              {initialResume.updatedAt !== initialResume.createdAt && (
                <span>Updated {formatDate(initialResume.updatedAt)}</span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                initialResume.status === 'published'
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
              }`}>
                {initialResume.status || 'Draft'}
              </span>
            </div>
          </div>
          {initialResume.templateId && (
            <div className="text-left sm:text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Template</div>
              <div className="font-medium text-gray-900 dark:text-white capitalize">
                {initialResume.templateId}
              </div>
            </div>
          )}
        </div>

        {/* Resume Content */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
          <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans text-sm leading-relaxed">
            {initialResume.content}
          </pre>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="glass-strong rounded-3xl p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Resume Analysis
        </h2>

        {!showAnalysis ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="jobDescription" className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Job Description
              </label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description you want to analyze this resume against..."
                rows={6}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white resize-vertical"
              />
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="flex justify-center">
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !jobDescription.trim()}
                className="btn-glass text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <div className="flex items-center">
                    <LoadingSpinner />
                    <span className="ml-3">Analyzing Resume...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Analyze Resume Match
                  </div>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Analysis Results
              </h3>
              <button
                onClick={() => setShowAnalysis(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors self-start sm:self-auto"
              >
                Analyze Different Job
              </button>
            </div>
            <AnalysisResults results={analysisResult} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeDetail;