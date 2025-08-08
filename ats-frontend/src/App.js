import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import JobDescriptionInput from './components/JobDescriptionInput';
import AnalysisResults from './components/AnalysisResults';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import ThemeToggle from './components/ThemeToggle';
import { analyzeResume } from './services/api';
import useTheme from './hooks/useTheme';

function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const { theme, toggleTheme } = useTheme();

  const handleFileSelect = useCallback((file) => {
    setResumeFile(file);
    setError('');
  }, []);

  const handleFileError = useCallback((errorMessage) => {
    setError(errorMessage);
  }, []);

  const handleAnalyze = async () => {
    if (!resumeFile || !jobDescription) {
      setError('Please provide both a resume and job description');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      const result = await analyzeResume(resumeFile, jobDescription);
      setAnalysisResult(result);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg paper-texture relative overflow-hidden">
      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
      </div>

      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      
      <div className="container mx-auto px-4 py-8 relative z-10 fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="glass-strong rounded-3xl p-8 mx-auto max-w-4xl hover-glass">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl mr-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                ATS Resume Analyzer
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-light">
              Get AI-powered insights on how well your resume matches the job description
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <div className="flex items-center space-x-2 glass px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">AI-Powered Analysis</span>
              </div>
              <div className="flex items-center space-x-2 glass px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Instant Results</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Input Column */}
          <div className="space-y-8 slide-up">
            <FileUpload 
              onFileSelect={handleFileSelect}
              onFileError={handleFileError}
              selectedFile={resumeFile}
            />
            
            <JobDescriptionInput 
              value={jobDescription}
              onChange={setJobDescription}
            />

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!resumeFile || !jobDescription || isLoading}
              className={`w-full py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                !resumeFile || !jobDescription || isLoading
                  ? 'bg-gray-300/50 text-gray-500 cursor-not-allowed backdrop-blur-md'
                  : 'btn-glass text-white shadow-lg hover:shadow-2xl'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Analyze Resume</span>
                </div>
              )}
            </button>

            {error && <ErrorMessage message={error} />}
          </div>

          {/* Results Column */}
          <div className="space-y-8 slide-up" style={{ animationDelay: '0.2s' }}>
            <AnalysisResults results={analysisResult} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="glass rounded-2xl p-6 mx-auto max-w-2xl">
            <p className="text-gray-600 dark:text-gray-300 font-light">
              Powered by advanced AI algorithms to help you land your dream job
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;