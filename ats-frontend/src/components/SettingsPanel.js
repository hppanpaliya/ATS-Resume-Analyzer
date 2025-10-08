import React, { useState } from 'react';

const SettingsPanel = ({ 
  showModelSelector, 
  onToggleModelSelector, 
  onReset 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = () => {
    if (window.confirm('This will reset all settings to default. Continue?')) {
      onReset();
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 right-6 z-40 p-3 glass rounded-full transition-all duration-200 hover:scale-105 group"
        aria-label="Open settings"
      >
        <svg 
          className={`w-6 h-6 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-45' : 'group-hover:rotate-12'}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 fade-in"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Settings Panel */}
          <div className="fixed top-20 right-20 w-80 max-w-[calc(100vw-2rem)] z-40 slide-up">
            <div className="glass-strong rounded-3xl p-6 border border-white/25 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-xl mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  Settings
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="glass p-2 rounded-full hover:bg-red-100/20 dark:hover:bg-red-900/20 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Settings Options */}
              <div className="space-y-4">
                {/* Model Selector Toggle */}
                <div className="p-4 glass rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 dark:text-white mb-1">
                        🤖 AI Model Selection
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Choose from different free AI models for analysis
                      </p>
                    </div>
                    <button
                      onClick={onToggleModelSelector}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        showModelSelector 
                          ? 'bg-blue-600' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showModelSelector ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Model Selection Status */}
                <div className="p-3 glass rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      showModelSelector ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Model selection is {showModelSelector ? 'enabled' : 'disabled'}
                    </span>
                  </div>
                  {!showModelSelector && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Using default model: Gemini 2.0 Flash
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-white/10"></div>

                {/* Additional Settings */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 dark:text-white text-sm">
                    Quick Actions
                  </h4>
                  
                  {/* Reset Button */}
                  <button
                    onClick={handleReset}
                    className="w-full p-3 glass rounded-2xl hover:bg-red-100/20 dark:hover:bg-red-900/20 transition-colors duration-200 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white text-sm">Reset Settings</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Restore default configuration</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SettingsPanel;