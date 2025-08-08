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
    <div className="min-h-screen futuristic-bg paper-texture relative overflow-hidden">
      {/* Floating Orbs for Futuristic Effect */}
      <div className="floating-orbs">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
      </div>

      {/* Theme Toggle */}
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 pt-20 sm:pt-24 relative z-10 page-transition">
        {/* Hero Header */}
        <div className="text-center mb-16">
          <div className="glass-strong rounded-[2rem] p-8 sm:p-12 mx-auto max-w-5xl hover-lift transition-all duration-500">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-2xl blur-md opacity-75 animate-pulse-slow"></div>
                <div className="relative bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 p-4 rounded-2xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 neon-text leading-tight">
              ATS Resume Analyzer
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-light mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Unlock your career potential with AI-powered resume analysis that reveals hidden insights and optimization opportunities
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <div className="glass px-6 py-3 rounded-full hover-glow transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">AI-Powered Analysis</span>
                </div>
              </div>
              <div className="glass px-6 py-3 rounded-full hover-glow transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Instant Results</span>
                </div>
              </div>
              <div className="glass px-6 py-3 rounded-full hover-glow transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Actionable Insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Application Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Input Column */}
          <div className="space-y-8 card-enter">
            <FileUpload 
              onFileSelect={handleFileSelect}
              onFileError={handleFileError}
              selectedFile={resumeFile}
            />
            
            <JobDescriptionInput 
              value={jobDescription}
              onChange={setJobDescription}
            />

            {/* Enhanced Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!resumeFile || !jobDescription || isLoading}
              className={`w-full py-6 px-8 rounded-2xl font-bold text-lg transition-all duration-300 relative overflow-hidden group ${
                !resumeFile || !jobDescription || isLoading
                  ? 'bg-gray-400/30 text-gray-500 cursor-not-allowed backdrop-blur-md border border-gray-300/20'
                  : 'btn-futuristic text-white shadow-2xl hover:shadow-purple-500/25'
              }`}
            >
              {!isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              )}
              
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <LoadingSpinner />
                  <span>Analyzing Resume...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3 relative z-10">
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
          <div className="space-y-8 card-enter" style={{ animationDelay: '0.3s' }}>
            <AnalysisResults results={analysisResult} />
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="mt-20 text-center">
          <div className="glass rounded-3xl p-8 mx-auto max-w-3xl hover-glow">
            <div className="flex items-center justify-center mb-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
              Powered by advanced AI algorithms to help you land your dream job
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Built with modern glassmorphism design and futuristic aesthetics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;