import React, { useState, useEffect } from 'react';
import { getJobDescriptions, createJobDescription, updateJobDescription, deleteJobDescription } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const JobDescriptionManager = () => {
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  const loadJobDescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getJobDescriptions();
      setJobDescriptions(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load job descriptions');
      console.error('Error loading job descriptions:', err);
      setJobDescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobDescriptions();
  }, []);

  const handleCreate = () => {
    setEditingJob(null);
    setFormData({ title: '', description: '' });
    setShowForm(true);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingJob(null);
    setFormData({ title: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (editingJob) {
        await updateJobDescription(editingJob.id, formData);
      } else {
        await createJobDescription(formData);
      }

      await loadJobDescriptions();
      handleCancel();
    } catch (err) {
      setError(err.message || 'Failed to save job description');
      console.error('Error saving job description:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job description?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteJobDescription(jobId);
      await loadJobDescriptions();
    } catch (err) {
      setError(err.message || 'Failed to delete job description');
      console.error('Error deleting job description:', err);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && (!Array.isArray(jobDescriptions) || jobDescriptions.length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="glass-strong rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Job Description Manager
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Save and manage job descriptions for quick access during analysis
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Job Description</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {showForm && (
        <div className="glass-strong rounded-2xl p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            {editingJob ? 'Edit Job Description' : 'Create New Job Description'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Paste the full job description here..."
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : (editingJob ? 'Update' : 'Create')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {(!Array.isArray(jobDescriptions) || jobDescriptions.length === 0) && !loading ? (
        <div className="glass rounded-2xl p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            No Job Descriptions Saved
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Save job descriptions to quickly access them during resume analysis.
          </p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            Add Your First Job Description
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(jobDescriptions) && jobDescriptions.map((job) => (
            <div key={job.id} className="glass rounded-2xl p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex-1 pr-2">
                  {job.title}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(job)}
                    className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
                {job.description}
              </p>

              <div className="text-xs text-gray-500 dark:text-gray-500">
                Created: {formatDate(job.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobDescriptionManager;