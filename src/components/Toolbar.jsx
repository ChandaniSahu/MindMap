import React, { useState, useRef, useEffect } from 'react';


const Toolbar = ({
  onExpandAll,
  onCollapseAll,
  onFitView,
  onAddNode,
  onToggleFullDocumentation,
  onDownloadJSON,
  onDownloadPDF,
  isFitView
}) => {
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDownloadDropdown(false);
      }
    };

    if (showDownloadDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

  const handleDownloadClick = (format) => {
    if (format === 'json') {
      onDownloadJSON();
    } else if (format === 'pdf') {
      onDownloadPDF();
    }
    setShowDownloadDropdown(false);
  };
  const buttons = [
    { label: 'Expand All', icon: '↕️', onClick: onExpandAll },
    { label: 'Collapse All', icon: '↔️', onClick: onCollapseAll },
    { 
      label: isFitView ? 'Reset View' : 'Fit View', 
      icon: isFitView ? '↺' : '🔍', 
      onClick: onFitView 
    },
    { label: 'Add Node', icon: '➕', onClick: onAddNode },
    { label: 'Full Documentation', icon: '📄', onClick: onToggleFullDocumentation },
  ];

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-white text-2xl font-bold mr-4">
            🧠 MindMap Explorer
          </div>
          <div className="flex items-center space-x-2">
            {buttons.map((button) => (
              <button
                key={button.label}
                onClick={button.onClick}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-white"
              >
                <span>{button.icon}</span>
                <span className="hidden md:inline">{button.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white flex items-center space-x-2"
            >
             {/* <FiDownload/> */}
             <span>Download</span>

              <span className="text-xs">▼</span>
            </button>
            {showDownloadDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <button
                  onClick={() => handleDownloadClick('json')}
                  className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-t-lg flex items-center space-x-2"
                >
                  <span>📄</span>
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => handleDownloadClick('pdf')}
                  className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-b-lg flex items-center space-x-2"
                >
                  <span>📑</span>
                  <span>PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
