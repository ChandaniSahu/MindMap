import React, { useState, useEffect } from 'react';
import MindMap from './components/MindMap';
import SummaryPanel from './components/SummaryPanel';
import Toolbar from './components/Toolbar';
import ReactData from './data/ReactData.json';

const App = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [showFullDoc, setShowFullDoc] = useState(false);
  const [data, setData] = useState(ReactData);

  // Handle node click
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setIsEditing(false);
  };

  // Handle node edit
  const handleNodeEdit = (node) => {
    setSelectedNode(node);
    setEditData({
      label: node.label,
      summary: node.summary,
      description: node.description,
      metadata: node.metadata
    });
    setIsEditing(true);
  };

  // Handle edit save
  const handleSaveEdit = () => {
    if (selectedNode) {
      const updateNodeInTree = (node) => {
        if (node.id === selectedNode.id) {
          return { ...node, ...editData };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateNodeInTree)
          };
        }
        return node;
      };

      const updatedData = updateNodeInTree(data);
      setData(updatedData);
      setSelectedNode({ ...selectedNode, ...editData });
      setIsEditing(false);
    }
  };

  // Handle edit cancel
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  // Handle edit change
  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Toolbar actions
  const handleExpandAll = () => {
    setAllExpanded(true);
  };

  const handleCollapseAll = () => {
    setAllExpanded(false);
  };

  const handleFitView = () => {
    // In a real implementation, this would adjust zoom and position
    console.log('Fit view');
  };

  const handleAddNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      label: 'New Node',
      summary: 'Enter summary here',
      description: 'Enter description here',
      type: 'detail'
    };

    if (selectedNode) {
      const addNodeToTree = (node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            children: [...(node.children || []), newNode],
            expanded: true
          };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(addNodeToTree)
          };
        }
        return node;
      };

      setData(addNodeToTree(data));
    }
  };

  const handleToggleFullDocumentation = () => {
    setShowFullDoc(!showFullDoc);
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'mindmap-data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Hover effects
  useEffect(() => {
    if (hoveredNode) {
      console.log('Hovering over:', hoveredNode.label);
    }
  }, [hoveredNode]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black">
      <Toolbar
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onFitView={handleFitView}
        onAddNode={handleAddNode}
        onToggleFullDocumentation={handleToggleFullDocumentation}
        onDownload={handleDownload}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <MindMap
            data={data}
            selectedNode={selectedNode}
            hoveredNode={hoveredNode}
            onNodeClick={handleNodeClick}
            onNodeHover={setHoveredNode}
            onNodeEdit={handleNodeEdit}
            expanded={allExpanded}
          />
          
          {/* Hover Tooltip */}
          {hoveredNode && !isEditing && (
            <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 border border-gray-700 rounded-lg p-4 max-w-xs shadow-2xl">
              <h4 className="font-bold text-white mb-2">{hoveredNode.label}</h4>
              <p className="text-sm text-gray-300">{hoveredNode.summary}</p>
              <div className="mt-2 text-xs text-gray-400">
                Click for details • Hovering
              </div>
            </div>
          )}
        </div>

        <SummaryPanel
          node={selectedNode}
          isEditing={isEditing}
          editData={editData}
          onEditChange={handleEditChange}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-sm text-gray-400">
        <div className="flex justify-between">
          <div>
            {selectedNode ? `Selected: ${selectedNode.label}` : 'No node selected'}
          </div>
          <div>
            {hoveredNode ? `Hovering: ${hoveredNode.label}` : 'Move mouse over nodes'}
          </div>
          <div>
            Total Nodes: {data.children ? data.children.length + 1 : 1}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
