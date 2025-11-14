import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeResume, testConnection } from '../services/api';
import FileUpload from '../components/FileUpload';
import JobDescriptionInput from '../components/JobDescriptionInput';
import ModelSelector from '../components/ModelSelector';
import ModelParameters from '../components/ModelParameters';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const AnalysisDashboard = ({ showModelSelector, selectedModel, modelParameters, connectionStatus, setConnectionStatus, onModelSelect, onModelParametersChange }) => {
  const navigate = useNavigate();

  // ATS Analysis state
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

    if (connectionStatus === 'checking') {
      checkConnection();
    }
  }, [connectionStatus, setConnectionStatus]);

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
    onModelSelect(modelId);
    if (analysisResult) {
      setAnalysisResult(null);
    }
  }, [analysisResult, onModelSelect]);

  const handleModelParametersChange = useCallback((newParameters) => {
    onModelParametersChange(newParameters);
    if (analysisResult) {
      setAnalysisResult(null);
    }
  }, [analysisResult, onModelParametersChange]);

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
      // Extract job title from the job description - look for common patterns
      const extractJobTitle = (jd) => {
        const lines = jd.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Look for lines that might be job titles (short, title case, etc.)
        for (const line of lines.slice(0, 5)) {
          if (line.length > 3 && line.length < 100 &&
              (line.includes('Engineer') || line.includes('Developer') || line.includes('Manager') ||
               line.includes('Analyst') || line.includes('Specialist') || line.includes('Director') ||
               line.includes('Senior') || line.includes('Lead') || line.includes('Principal'))) {
            return line;
          }
        }

        // Fallback to first non-empty line
        return lines[0] || 'Untitled Position';
      };

      const jobTitle = extractJobTitle(jobDescription);
      const result = await analyzeResume(
        resumeFile,
        jobDescription,
        showModelSelector ? selectedModel : null,
        modelParameters,
        jobTitle
      );
      setAnalysisResult(result);

      // Redirect to analysis page with the result
      navigate(`/analysis/${result.savedAnalysisId || 'new'}`, {
        state: { analysis: result }
      });
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Input Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 slide-up mb-8">
        <FileUpload
          onFileSelect={handleFileSelect}
          onFileError={handleFileError}
          selectedFile={resumeFile}
        />

        <JobDescriptionInput
          value={jobDescription}
          onChange={handleJobDescriptionChange}
        />
      </div>

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      
      {/* Analyze Button - Full Width */}
      <div className="mb-8">
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
                  (using {selectedModel})
                </span>
              )}
            </div>
          )}
        </button>
        {showModelSelector && !selectedModel && connectionStatus === 'connected' && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            No AI model selected. Using default model.
          </p>
        )}
        {connectionStatus !== 'connected' && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            {connectionStatus === 'error' ? 'Connection failed. Please check your backend.' : 'Checking connection...'}
          </p>
        )}
      </div>

      {/* Model Selector and Parameters */}
      {showModelSelector && (
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ModelSelector
              selectedModel={selectedModel}
              onModelSelect={handleModelSelect}
            />
            <ModelParameters
              parameters={modelParameters}
              onParametersChange={handleModelParametersChange}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default AnalysisDashboard;