/**
 * Example: useJobStatus Hook
 * 
 * A custom React hook for polling job status from the backend.
 * Handles automatic polling, retry logic, and cleanup.
 * 
 * Usage:
 * const { status, progress, isLoading, error, cancel } = useJobStatus(jobId);
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface JobStatusData {
  jobId: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  progress: number;
  result?: {
    analysisId: string;
    resumeId: string;
    jobDescriptionId: string;
    overallScore?: number;
    status: 'completed' | 'failed';
  };
  error?: string;
  attempt?: number;
  startedAt?: string;
  finishedAt?: string;
}

interface UseJobStatusOptions {
  pollInterval?: number; // milliseconds, default 2000
  autoStop?: boolean; // stop polling on completion, default true
  onComplete?: (result: JobStatusData['result']) => void;
  onError?: (error: string) => void;
  token?: string; // JWT token for authentication
}

export function useJobStatus(
  jobId: string | null,
  options: UseJobStatusOptions = {}
) {
  const {
    pollInterval = 2000,
    autoStop = true,
    onComplete,
    onError,
    token
  } = options;

  const [status, setStatus] = useState<JobStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch job status
  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      setError(null);
      const response = await fetch(`/api/analysis/${jobId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job not found');
        } else if (response.status === 403) {
          throw new Error('Unauthorized access to job');
        } else {
          throw new Error(`Failed to fetch job status: ${response.statusText}`);
        }
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      setStatus(data.data);

      // Handle completion
      if (data.data.state === 'completed') {
        onComplete?.(data.data.result);
        if (autoStop && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }

      // Handle failure
      if (data.data.state === 'failed') {
        const errorMsg = data.data.error || 'Job failed';
        setError(errorMsg);
        onError?.(errorMsg);
        if (autoStop && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [jobId, token, autoStop, onComplete, onError]);

  // Setup polling
  useEffect(() => {
    if (!jobId) return;

    setIsLoading(true);
    
    // Fetch immediately
    fetchJobStatus();

    // Set up polling
    intervalRef.current = setInterval(fetchJobStatus, pollInterval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jobId, pollInterval, fetchJobStatus]);

  // Cancel job
  const cancel = useCallback(async (): Promise<boolean> => {
    if (!jobId || !token) return false;

    try {
      const response = await fetch(`/api/analysis/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [jobId, token]);

  return {
    status,
    progress: status?.progress ?? 0,
    isLoading,
    error,
    isComplete: status?.state === 'completed',
    isFailed: status?.state === 'failed',
    cancel
  };
}

/**
 * Example: AnalysisForm Component
 * 
 * Form for uploading resume and queuing analysis
 */

import React, { useRef, useState } from 'react';

interface AnalysisFormProps {
  token: string;
  onJobSubmitted: (jobId: string) => void;
  onError: (error: string) => void;
}

export function AnalysisForm({ token, onJobSubmitted, onError }: AnalysisFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formRef.current || !fileInputRef.current?.files?.[0]) {
      onError('Please select a resume file');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(formRef.current);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 202) {
        const data = await response.json();
        onJobSubmitted(data.data.jobId);
        // Reset form
        formRef.current.reset();
      } else if (!response.ok) {
        const errorData = await response.json();
        onError(errorData.error || 'Failed to submit analysis');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="resume">Resume (PDF or DOCX)</label>
        <input
          ref={fileInputRef}
          type="file"
          id="resume"
          name="resume"
          accept=".pdf,.docx"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="jobDescription">Job Description</label>
        <textarea
          id="jobDescription"
          name="jobDescription"
          required
          minLength={30}
          placeholder="Paste the job description here..."
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="jobTitle">Job Title (optional)</label>
        <input
          type="text"
          id="jobTitle"
          name="jobTitle"
          placeholder="e.g., Senior Software Engineer"
          disabled={isSubmitting}
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Analyze Resume'}
      </button>
    </form>
  );
}

/**
 * Example: JobProgress Component
 * 
 * Displays job progress and results
 */

interface JobProgressProps {
  jobId: string;
  token: string;
}

export function JobProgress({ jobId, token }: JobProgressProps) {
  const { status, progress, isLoading, error, isComplete, isFailed, cancel } = 
    useJobStatus(jobId, { token });

  if (isLoading && !status) {
    return <div>Loading job status...</div>;
  }

  return (
    <div className="job-progress">
      <h3>Analysis Progress</h3>
      
      {/* Status Badge */}
      <div className="status-badge">
        {status?.state}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="progress-text">{progress}%</div>

      {/* State-specific content */}
      {status?.state === 'waiting' && (
        <p>Your analysis is queued. Waiting for a worker to process it...</p>
      )}

      {status?.state === 'active' && (
        <p>Processing your resume analysis...</p>
      )}

      {isComplete && status?.result && (
        <div className="results">
          <h4>Analysis Complete!</h4>
          <p>Overall Score: {status.result.overallScore}%</p>
          {/* Display more results here */}
        </div>
      )}

      {isFailed && (
        <div className="error">
          <p>Analysis failed: {error}</p>
          <p>Attempted {status?.attempt} time(s)</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="actions">
        {!isComplete && !isFailed && (
          <button onClick={cancel}>Cancel Analysis</button>
        )}
      </div>

      {/* Timestamps */}
      {status?.startedAt && (
        <p>Started: {new Date(status.startedAt).toLocaleString()}</p>
      )}
      {status?.finishedAt && (
        <p>Finished: {new Date(status.finishedAt).toLocaleString()}</p>
      )}
    </div>
  );
}

/**
 * Example: Complete Analysis Page
 */

export function AnalysisPage({ token }: { token: string }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (jobId) {
    return (
      <div>
        <JobProgress jobId={jobId} token={token} />
        <button onClick={() => setJobId(null)}>Start New Analysis</button>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      <AnalysisForm
        token={token}
        onJobSubmitted={setJobId}
        onError={setError}
      />
    </div>
  );
}
