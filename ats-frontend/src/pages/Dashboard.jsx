import React, { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../stores/authStore';
import { authService } from '../services/authService';
import { analyzeResume, testConnection } from '../services/api';
import FileUpload from '../components/FileUpload';
import JobDescriptionInput from '../components/JobDescriptionInput';
import ModelSelector from '../components/ModelSelector';
import ModelParameters from '../components/ModelParameters';
import AnalysisResults from '../components/AnalysisResults';
import ResumeList from '../components/ResumeList';
import ResumeForm from '../components/ResumeForm';
import ResumeDetail from '../components/ResumeDetail';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import SettingsPanel from '../components/SettingsPanel';
import ThemeToggle from '../components/ThemeToggle';
import useTheme from '../hooks/useTheme';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const { clearAuth } = useAuthStore();

  // ATS Analysis state
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showModelSelector, setShowModelSelector] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const saved = localStorage.getItem('showModelSelector');

    if (saved === null) {
      return false;
    }

    try {
      return JSON.parse(saved);
    } catch (err) {
      console.warn('Failed to parse stored showModelSelector value:', err);
      return false;
    }
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const saved = localStorage.getItem('selectedModel');
    return saved || null;
  });

  // Model Parameters state
  const [modelParameters, setModelParameters] = useState({
    temperature: 0.15,
    max_tokens: 4000,
    include_reasoning: false
  });

  // Resume Management state
  const [currentView, setCurrentView] = useState('analysis'); // 'analysis', 'resumes', 'resume-detail', 'resume-form'
  const [selectedResume, setSelectedResume] = useState(null);
  const [editingResume, setEditingResume] = useState(null);

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const loadUser = async () => {
      try {
        await authService.getCurrentUser();
        // User is authenticated, continue to dashboard
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Check backend connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await testConnection();
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Connection check failed:', error);
        setConnectionStatus('error');
      }
    };

    checkConnection();
  }, []);

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  // ATS Analysis handlers
  const handleFileSelect = useCallback((file) => {
    setResumeFile(file);
    setError('');
    setAnalysisResult(null);
  }, []);

  const handleFileError = useCallback((errorMessage) => {
    setError(errorMessage);
    setAnalysisResult(null);
  }, []);

  const handleJobDescriptionChange = useCallback((value) => {
    setJobDescription(value);
    if (analysisResult) {
      setAnalysisResult(null);
    }
  }, [analysisResult]);

  const handleModelSelect = useCallback((modelId) => {
    setSelectedModel(modelId);
    if (analysisResult) {
      setAnalysisResult(null);
    }
  }, [analysisResult]);

  const handleToggleModelSelector = useCallback(() => {
    setShowModelSelector(prev => !prev);
  }, []);

  const handleResetSettings = useCallback(() => {
    setShowModelSelector(false);
    setSelectedModel(null);
    localStorage.removeItem('showModelSelector');
    localStorage.removeItem('selectedModel');
    setAnalysisResult(null);
  }, []);

  // Resume Management handlers
  const handleCreateResume = useCallback(() => {
    setEditingResume(null);
    setCurrentView('resume-form');
  }, []);

  const handleEditResume = useCallback((resume) => {
    setEditingResume(resume);
    setCurrentView('resume-form');
  }, []);

  const handleViewResume = useCallback((resume) => {
    setSelectedResume(resume);
    setCurrentView('resume-detail');
  }, []);

  const handleSaveResume = useCallback((savedResume) => {
    setCurrentView('resumes');
    setEditingResume(null);
    setSelectedResume(null);
    // Could refresh resume list here if needed
  }, []);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('showModelSelector', JSON.stringify(showModelSelector));
  }, [showModelSelector]);

  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('selectedModel', selectedModel);
    }
  }, [selectedModel]);

  // Persist model parameters to localStorage
  useEffect(() => {
    localStorage.setItem('modelParameters', JSON.stringify(modelParameters));
  }, [modelParameters]);

  // Load model parameters from localStorage on mount
  useEffect(() => {
    const savedParameters = localStorage.getItem('modelParameters');
    if (savedParameters) {
      try {
        const parsedParameters = JSON.parse(savedParameters);
        setModelParameters({
          temperature: parsedParameters.temperature ?? 0.15,
          max_tokens: parsedParameters.max_tokens ?? 4000,
          include_reasoning: parsedParameters.include_reasoning ?? false
        });
      } catch (err) {
        console.error('Failed to load saved parameters:', err);
      }
    }
  }, []);

  const handleModelParametersChange = useCallback((newParameters) => {
    setModelParameters(newParameters);
    if (analysisResult) {
      setAnalysisResult(null);
    }
  }, [analysisResult]);

  const handleAnalyze = async () => {
    if (!resumeFile || !jobDescription) {
      setError('Please provide both a resume and job description');
      return;
    }

    if (connectionStatus !== 'connected') {
      setError('Backend server is not available. Please check your connection.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      const result = await analyzeResume(
        resumeFile,
        jobDescription,
        showModelSelector ? selectedModel : null,
        modelParameters
      );
      setAnalysisResult(result);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'checking':
        return {
          color: 'bg-yellow-400',
          text: 'Connecting...',
          icon: '⏳'
        };
      case 'connected':
        return {
          color: 'bg-green-400',
          text: 'Connected',
          icon: '✅'
        };
      case 'error':
        return {
          color: 'bg-red-400',
          text: 'Disconnected',
          icon: '❌'
        };
      default:
        return {
          color: 'bg-gray-400',
          text: 'Unknown',
          icon: '❓'
        };
    }
  };

  const connectionInfo = getConnectionStatusDisplay();

  if (loading) {
    return (
      <div className="min-h-screen animated-bg paper-texture flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading...</p>
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
      <SettingsPanel
        showModelSelector={showModelSelector}
        onToggleModelSelector={handleToggleModelSelector}
        onReset={handleResetSettings}
      />

      <div className="container mx-auto px-4 py-8 relative z-10 fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="glass-strong rounded-3xl p-8 mx-auto max-w-4xl hover-glass">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
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
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
            <p className="text-xl text-gray-700 dark:text-gray-300 font-light">
              Get AI-powered insights on how well your resume matches the job description
            </p>
            <div className="mt-6 flex justify-center space-x-4 flex-wrap">
              {/* Connection Status */}
              <div className="flex items-center space-x-2 glass px-4 py-2 rounded-full">
                <div className={`w-2 h-2 ${connectionInfo.color} rounded-full ${connectionStatus === 'checking' ? 'animate-pulse' : ''}`}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{connectionInfo.text}</span>
              </div>

              <div className="flex items-center space-x-2 glass px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">AI-Powered Analysis</span>
              </div>
              <div className="flex items-center space-x-2 glass px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-500"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Instant Results</span>
              </div>
              {showModelSelector && (
                <div className="flex items-center space-x-2 glass px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-1000"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Dynamic AI Models</span>
                </div>
              )}
            </div>

            {/* Connection retry button */}
            {connectionStatus === 'error' && (
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="glass-strong rounded-2xl p-2 flex space-x-2">
            <button
              onClick={() => setCurrentView('analysis')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                currentView === 'analysis'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
              }`}
            >
              ATS Analysis
            </button>
            <button
              onClick={() => setCurrentView('resumes')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                currentView === 'resumes'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
              }`}
            >
              Resume Management
            </button>
          </div>
        </div>

        {/* Main Content */}
        {currentView === 'analysis' && (
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
                onChange={handleJobDescriptionChange}
              />
              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!resumeFile || !jobDescription || isLoading || connectionStatus !== 'connected'}
                className={`w-full py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                  !resumeFile || !jobDescription || isLoading || connectionStatus !== 'connected'
                    ? 'bg-gray-300/50 text-gray-500 cursor-not-allowed'
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
                    <span>
                      {connectionStatus !== 'connected' ? 'Connecting...' : 'Analyze Resume'}
                    </span>
                    {showModelSelector && selectedModel && connectionStatus === 'connected' && (
                      <span className="text-sm opacity-80">
                        with AI
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* Model Parameters - ABOVE Model Selector */}
              <ModelParameters
                parameters={modelParameters}
                onParametersChange={handleModelParametersChange}
                disabled={connectionStatus !== 'connected' || isLoading}
              />

              {/* Model Selector */}
              <ModelSelector
                onModelSelect={handleModelSelect}
                selectedModel={selectedModel}
                disabled={!showModelSelector || connectionStatus !== 'connected'}
              />

              

              {error && <ErrorMessage message={error} />}
            </div>

            {/* Results Column */}
            <div className="space-y-8 slide-up" style={{ animationDelay: '0.2s' }}>
              <AnalysisResults results={analysisResult} />

              {/* Model Info Display */}
              {analysisResult && analysisResult.modelUsed && (
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        Analysis by: {analysisResult.modelUsed.name}
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        Provider: {analysisResult.modelUsed.provider} • Model: {analysisResult.modelUsed.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'resumes' && (
          <ResumeList
            onViewResume={handleViewResume}
            onEditResume={handleEditResume}
            onCreateResume={handleCreateResume}
          />
        )}

        {currentView === 'resume-detail' && selectedResume && (
          <ResumeDetail
            resume={selectedResume}
            onBack={() => setCurrentView('resumes')}
            onEdit={() => handleEditResume(selectedResume)}
          />
        )}

        {currentView === 'resume-form' && (
          <ResumeForm
            resume={editingResume}
            onSave={handleSaveResume}
            onCancel={() => setCurrentView('resumes')}
          />
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="glass rounded-2xl p-6 mx-auto max-w-2xl">
            <p className="text-gray-700 dark:text-gray-300 font-light">
              Powered by advanced AI algorithms to help you land your dream job
            </p>
            {showModelSelector && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Dynamic model selection with real-time updates
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;