import React from 'react';

const Toolbar = ({
  onExpandAll,
  onCollapseAll,
  onFitView,
  onAddNode,
  onToggleFullDocumentation,
  onDownload
}) => {
  const buttons = [
    { label: 'Expand All', icon: '↕️', onClick: onExpandAll },
    { label: 'Collapse All', icon: '↔️', onClick: onCollapseAll },
    { label: 'Fit View', icon: '🔍', onClick: onFitView },
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
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white"
          >
            Download
          </button>
          <div className="text-sm text-gray-400">
            <span className="text-green-400">●</span> Interactive Visualization
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
