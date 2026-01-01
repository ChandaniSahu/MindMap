import React from 'react';

// Documentation Content Component
const DocumentationContent = ({ data, level = 0 }) => {
  if (!data) return null;

  return (
    <div className="mb-6" style={{ marginLeft: `${level * 1.5}rem` }}>
      <h3 className="text-xl font-bold text-white mb-2">{data.label}</h3>
      {data.summary && (
        <p className="text-gray-300 mb-3">{data.summary}</p>
      )}
      {data.description && (
        <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 mb-3">
          <p className="text-gray-200 whitespace-pre-wrap">{data.description}</p>
        </div>
      )}
      {data.metadata && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Metadata:</h4>
          <pre className="bg-gray-700 bg-opacity-50 rounded p-3 text-xs text-gray-300 overflow-x-auto">
            {JSON.stringify(data.metadata, null, 2)}
          </pre>
        </div>
      )}
      {data.type && (
        <span className="inline-block px-3 py-1 bg-blue-600 bg-opacity-30 text-blue-300 rounded-full text-xs mb-3">
          {data.type}
        </span>
      )}
      {data.children && data.children.length > 0 && (
        <div className="mt-4 border-l-2 border-gray-600 pl-4">
          {data.children.map((child, index) => (
            <DocumentationContent key={child.id || index} data={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const DocumentationModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        // Close if clicking on the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">📄 Full Documentation</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-white"
          >
            ✕ Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <DocumentationContent data={data} />
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;

