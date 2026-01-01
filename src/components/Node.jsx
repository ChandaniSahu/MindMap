import React from 'react';
import { FaEdit } from "react-icons/fa";

const Node = ({
  node,
  isSelected,
  isHovered,
  isRelated,
  onClick,
  onHover,
  onEdit
}) => {
  const nodeColors = {
    root: 'bg-gradient-to-r from-blue-600 to-blue-800',
    category: 'bg-gradient-to-r from-green-600 to-green-800',
    subcategory: 'bg-gradient-to-r from-purple-600 to-purple-800',
    detail: 'bg-gradient-to-r from-yellow-600 to-yellow-800',
    default: 'bg-gradient-to-r from-gray-700 to-gray-900'
  };

  const nodeType = node.type || 'default';
  const bgColor = nodeColors[nodeType] || nodeColors.default;

  return (
    <div
      className="relative transition-all duration-300"
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Node */}
      <div
        className={`relative p-4 rounded-lg shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl
          ${bgColor}
          ${isSelected ? 'ring-4 ring-yellow-700 ring-opacity-50' : ''}
          ${isHovered ? 'ring-2 ring-white ring-opacity-30' : ''}
          ${isRelated && !isHovered ? 'ring-1 ring-gray-400 ring-opacity-50' : ''}
          min-w-[300px]
        `}
        onClick={() => onClick(node)}
      >
        {/* Node content */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white truncate max-w-[200px]">{node.label}</h3>
          <div className="flex items-center space-x-2 absolute right-0 top-0">
            {node.children && node.children.length > 0 && (
              <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                {node.children.length} 
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(node);
              }}
              className="text-xs bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition cursor-pointer"
            >
              <FaEdit className='text-white w-6 h-6'/>
            </button>
          </div>
        </div>


        {/* Expand/collapse indicator */}
        {node.children && node.children.length > 0 && (
          <div className="absolute -right-2 -bottom-2 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
            <span className="text-gray-800 font-bold">
              {node.expanded ? '−' : '+'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Node;
