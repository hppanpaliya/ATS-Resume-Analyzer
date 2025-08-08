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
    <div className="glass-strong rounded-3xl p-8 hover-lift transition-all duration-500 relative overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 animate-gradient-x"></div>
      
      <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-800 dark:text-white">
        <div className="relative mr-4">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-md opacity-75 animate-pulse-slow"></div>
          <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        Upload Resume
      </h2>
      
      <div
        className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-500 relative overflow-hidden group ${
          dragActive 
            ? 'dropzone-active border-purple-400 dark:border-purple-300 bg-gradient-to-br from-purple-50/30 to-blue-50/30 dark:from-purple-900/30 dark:to-blue-900/30' 
            : 'border-gray-300/50 dark:border-gray-600/50 hover:border-purple-400/70 dark:hover:border-purple-300/70 glass backdrop-blur-xl'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Animated border effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-gradient-x"></div>
        
        <input
          type="file"
          id="resume-upload"
          className="hidden"
          accept=".pdf,.docx"
          onChange={handleFileInput}
        />
        
        <label htmlFor="resume-upload" className="cursor-pointer relative z-10">
          <div className="relative mb-8">
            <div className="relative group">
              {/* Glowing orb behind icon */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-xl scale-150"></div>
              
              <svg className="w-20 h-20 mx-auto text-purple-400 dark:text-purple-300 transition-all duration-500 hover:scale-110 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              {/* Plus icon overlay */}
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold neon-text mb-4">
            Drop your resume here
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg font-light">
            or click to browse your files
          </p>
          
          <div className="flex justify-center space-x-4 mb-6">
            <span className="glass px-5 py-2 rounded-full text-blue-600 dark:text-blue-400 text-sm font-semibold border border-blue-200/50 dark:border-blue-700/50 hover-glow transition-all duration-300">
              PDF
            </span>
            <span className="glass px-5 py-2 rounded-full text-green-600 dark:text-green-400 text-sm font-semibold border border-green-200/50 dark:border-green-700/50 hover-glow transition-all duration-300">
              DOCX
            </span>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
            Maximum file size: 10MB • Secure upload
          </p>
        </label>
        
        {selectedFile && (
          <div className="mt-8 card-enter">
            <div className="glass-strong rounded-2xl p-6 inline-flex items-center space-x-4 max-w-sm hover-glow">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
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