import React, { useState, useCallback } from 'react';

const FileUpload = ({ onFileSelect, onFileError, selectedFile }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFile = useCallback((file) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      onFileError('Please upload a PDF or DOCX file');
      return;
    }
    onFileSelect(file);
  }, [onFileError, onFileSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="glass-strong rounded-3xl p-4 sm:p-8 hover-glass transition-all duration-200 gpu-optimized">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center text-gray-900 dark:text-white">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl mr-3 gpu-optimized">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        Upload Resume
      </h2>
      <div
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all duration-200 gpu-optimized ${
          dragActive 
            ? 'dropzone-active border-purple-400 dark:border-purple-300 bg-purple-50/20 dark:bg-purple-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-300 glass'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="resume-upload"
          className="hidden"
          accept=".pdf,.docx"
          onChange={handleFileInput}
        />
        <label htmlFor="resume-upload" className="cursor-pointer">
          <div className="relative gpu-optimized">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-purple-400 dark:text-purple-300 transition-transform duration-200 hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center gpu-optimized">
              <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
            Drop your resume here
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 text-base sm:text-lg">
            or click to browse your files
          </p>
          <div className="flex justify-center space-x-2 sm:space-x-4 mb-3 sm:mb-4">
            <span className="keyword-badge px-3 sm:px-4 py-2 bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium">
              PDF
            </span>
            <span className="keyword-badge px-3 sm:px-4 py-2 bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs sm:text-sm font-medium">
              DOCX
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Maximum file size: 3MB
          </p>
        </label>
        
        {selectedFile && (
          <div className="mt-6 slide-up gpu-optimized">
            <div className="glass-strong rounded-2xl p-4 inline-flex items-center space-x-3 max-w-xs gpu-optimized">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center gpu-optimized">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;