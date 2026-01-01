import React from 'react';

const SummaryPanel = ({
  node,
  isEditing,
  editData,
  onEditChange,
  onSave,
  onCancel
}) => {
  if (!node) {
    return (
      <div className="w-80 bg-gradient-to-b from-gray-800 to-gray-900 border-l border-gray-700 p-6 overflow-y-auto">
        <div className="text-center text-gray-400 mt-20">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-xl font-semibold mb-2">Mind Map Explorer</h3>
          <p>Select a node to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gradient-to-b from-gray-800 to-gray-900 border-l border-gray-700 p-6 overflow-y-auto">
      {isEditing ? (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={editData.label || ''}
              onChange={(e) => onEditChange('label', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>


          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={editData.description || ''}
              onChange={(e) => onEditChange('description', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-32"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{node.label}</h2>
            </div>
            <div className="text-sm text-gray-300 mb-2">
              ID: <code className="bg-gray-700 px-2 py-1 rounded">{node.id}</code>
            </div>
          </div>


          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
            <p className="text-gray-300 leading-relaxed">{node.description}</p>
          </div>

          {node.children && node.children.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Children</h3>
              <div className="space-y-2">
                {node.children.map(child => (
                  <div
                    key={child.id}
                    className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 transition cursor-pointer"
                  >
                    <div className="font-medium text-white">{child.label}</div>
                    <div className="text-sm text-gray-300 truncate">{child.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SummaryPanel;
