import React, { useState, useCallback } from 'react';
import ResumeList from '../components/ResumeList';
import ResumeForm from '../components/ResumeForm';
import ResumeDetail from '../components/ResumeDetail';

const ResumeManagementPage = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'detail', 'form'
  const [selectedResume, setSelectedResume] = useState(null);
  const [editingResume, setEditingResume] = useState(null);

  const handleCreateResume = useCallback(() => {
    setEditingResume(null);
    setCurrentView('form');
  }, []);

  const handleEditResume = useCallback((resume) => {
    setEditingResume(resume);
    setCurrentView('form');
  }, []);

  const handleViewResume = useCallback((resume) => {
    setSelectedResume(resume);
    setCurrentView('detail');
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
          onSave={handleSaveResume}
          onCancel={handleBackToList}
        />
      )}
    </div>
  );
};

export default ResumeManagementPage;