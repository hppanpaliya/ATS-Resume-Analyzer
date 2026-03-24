import React, { useState, useCallback } from 'react';
import ResumeList from '../components/ResumeList';
import ResumeForm from '../components/ResumeForm';
import ResumeDetail from '../components/ResumeDetail';
import { getResumeById } from '../services/api';

const ResumeManagementPage = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'detail', 'form'
  const [selectedResume, setSelectedResume] = useState(null);
  const [editingResume, setEditingResume] = useState(null);
  const [viewError, setViewError] = useState('');

  const handleCreateResume = useCallback(() => {
    setEditingResume(null);
    setCurrentView('form');
  }, []);

  const handleEditResume = useCallback(async (resume) => {
    try {
      setViewError('');
      const fullResume = await getResumeById(resume.id);
      setEditingResume(fullResume);
      setCurrentView('form');
    } catch (error) {
      setViewError(error.message || 'Failed to load resume for editing');
    }
  }, []);

  const handleViewResume = useCallback(async (resume) => {
    try {
      setViewError('');
      const fullResume = await getResumeById(resume.id);
      setSelectedResume(fullResume);
      setCurrentView('detail');
    } catch (error) {
      setViewError(error.message || 'Failed to load resume details');
    }
  }, []);

  const handleSaveResume = useCallback((savedResume) => {
    setCurrentView('list');
    setEditingResume(null);
    setSelectedResume(null);
    // Could refresh resume list here if needed
  }, []);

  const handleBackToList = useCallback(() => {
    setCurrentView('list');
    setSelectedResume(null);
    setEditingResume(null);
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {viewError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {viewError}
        </div>
      )}

      {currentView === 'list' && (
        <ResumeList
          onViewResume={handleViewResume}
          onEditResume={handleEditResume}
          onCreateResume={handleCreateResume}
        />
      )}

      {currentView === 'detail' && selectedResume && (
        <ResumeDetail
          resume={selectedResume}
          onBack={handleBackToList}
          onEdit={() => handleEditResume(selectedResume)}
        />
      )}

      {currentView === 'form' && (
        <ResumeForm
          resume={editingResume}
          isEditing={Boolean(editingResume)}
          onSave={handleSaveResume}
          onCancel={handleBackToList}
        />
      )}
    </div>
  );
};

export default ResumeManagementPage;
