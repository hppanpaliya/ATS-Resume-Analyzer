import React, { useState, useCallback } from 'react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import JobDescriptionInput from './components/JobDescriptionInput';
import AnalysisResults from './components/AnalysisResults';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { analyzeResume } from './services/api';

function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ATS Resume Analyzer
          </h1>
          <p className="text-gray-600">
            Get AI-powered insights on how well your resume matches the job description
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Input Column */}
          <div className="space-y-6">
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
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                !resumeFile || !jobDescription || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? <LoadingSpinner /> : 'Analyze Resume'}
            </button>

            {error && <ErrorMessage message={error} />}
          </div>

          {/* Results Column */}
          <div className="space-y-6">
            <AnalysisResults results={analysisResult} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;