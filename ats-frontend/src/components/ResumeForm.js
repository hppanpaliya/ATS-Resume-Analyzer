import React, { useState, useEffect } from 'react';
import { createResume, updateResume } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import useAuthStore from '../stores/authStore';

const ResumeForm = ({ resume, onSave, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    templateId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    if (resume) {
      setFormData({
        title: resume.title || '',
        content: resume.content || '',
        templateId: resume.templateId || ''
      });
    }
  }, [resume]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Please enter a title for your resume');
      return;
    }

    if (!formData.content.trim()) {
      setError('Please enter resume content');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let result;
      if (isEditing && resume) {
        result = await updateResume(resume.id, formData);
      } else {
        result = await createResume(formData.title, formData.content, formData.templateId || undefined);
      }

      onSave(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleParseWithAI = async () => {
    if (!formData.content.trim()) {
      setError('Please enter resume content to parse');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:3001/api/resumes/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({ text: formData.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse resume with AI');
      }

      const result = await response.json();
      setFormData(prev => ({
        ...prev,
        content: JSON.stringify(result.data, null, 2),
      }));
    } catch (err) {
      setError(`AI parsing failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!formData.content.trim()) {
      setError('Please enter resume content to preview');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // For preview, we'll create a temporary structured format
      let structuredContent;
      try {
        structuredContent = JSON.parse(formData.content);
      } catch {
        // If not JSON, create basic structure
        structuredContent = {
          personalInfo: { fullName: 'Your Name' },
          summary: formData.content.substring(0, 200) + '...',
          experience: [],
          education: [],
          skills: [],
        };
      }

      // Generate preview HTML
      const response = await fetch('http://localhost:3001/api/resumes/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({
          content: structuredContent,
          templateId: formData.templateId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const html = await response.text();
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (err) {
      setError(`Preview failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    { id: '', name: 'Blank Template', description: 'Start with a clean slate' },
    { id: 'modern', name: 'Modern Professional', description: 'Clean and contemporary design' },
    { id: 'classic', name: 'Classic Corporate', description: 'Traditional business format' },
    { id: 'creative', name: 'Creative Portfolio', description: 'Showcase your creative work' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-strong rounded-3xl p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            {isEditing ? 'Edit Resume' : 'Create New Resume'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors self-end sm:self-auto"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Resume Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Software Engineer Resume - 2024"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Choose Template (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.map((template) => (
                <label
                  key={template.id}
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                    formData.templateId === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="templateId"
                    value={template.id}
                    checked={formData.templateId === template.id}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-start">
                    <div className={`w-4 h-4 rounded-full border-2 mt-1 mr-3 flex-shrink-0 ${
                      formData.templateId === template.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {formData.templateId === template.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{template.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{template.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Resume Content
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Paste your resume content here, or write it directly..."
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white font-mono text-sm resize-vertical h-48 sm:h-80"
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Tip: You can paste content from your existing resume or write it directly here.
              Use clear formatting with sections like Experience, Education, Skills, etc.
            </p>
          </div>

          {/* AI Tools */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleParseWithAI}
              disabled={loading || !formData.content.trim()}
              className="flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Parse with AI
            </button>
            <button
              type="button"
              onClick={handlePreview}
              disabled={loading || !formData.content.trim()}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M9 9h6M9 15h6" />
              </svg>
              Preview Resume
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 btn-glass text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Saving...</span>
                </div>
              ) : (
                isEditing ? 'Update Resume' : 'Create Resume'
              )}
            </button>
          </div>
        </form>

        {/* Preview Button - only shown when editing */}
        {isEditing && (
          <div className="mt-6">
            <button
              onClick={handlePreview}
              className="w-full px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M9 9h6M9 15h6" />
              </svg>
              Preview Resume
            </button>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
                    Resume Preview
                  </h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="resume-preview max-h-[60vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
              <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeForm;