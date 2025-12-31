import React, { useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3-hierarchy';

// Node Component
const Node = ({ node, isSelected, isHovered, isRelated, onClick, onHover, onEdit }) => {
  return (
    <div
      className={`relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 pointer-events-auto ${
        isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/50' :
        isHovered ? 'border-purple-400 shadow-lg shadow-purple-400/50' :
        isRelated ? 'border-gray-400' : 'border-gray-600'
      }`}
      style={{ 
        width: '200px',
        minHeight: '60px',
        transform: isHovered || isSelected ? 'scale(1.05)' : 'scale(1)'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(node);
      }}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="text-white text-sm font-medium break-words">
        {node.label || node.name || 'Node'}
      </div>
      {node.children && node.children.length > 0 && (
        <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
          {node.expanded ? '−' : '+'}
        </div>
      )}
    </div>
  );
};

const MindMap = ({
  data,
  selectedNode,
  hoveredNode,
  onNodeClick,
  onNodeHover,
  onNodeEdit,
  expanded
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize expanded state - only root expanded by default
  const initializeExpandedState = (node, isRoot = false) => {
    return {
      ...node,
      expanded: isRoot || expanded,
      children: node.children?.map(child => initializeExpandedState(child, false))
    };
  };

  const [mindMapData, setMindMapData] = useState(() =>
    initializeExpandedState(data, true)
  );

  // Calculate layout for visible nodes with improved spacing
  const layoutData = useMemo(() => {
    if (!mindMapData) return { nodes: [], links: [] };

    // Create hierarchy
    const root = d3.hierarchy(mindMapData, d => d.expanded ? d.children : []);

    // Create tree layout with better spacing
    const treeLayout = d3.tree()
      .nodeSize([120, 250]) // Increased vertical spacing significantly
      .separation((a, b) => {
        // Better separation based on depth and sibling relationship
        if (a.parent === b.parent) {
          return 1.5; // More space between siblings
        }
        return 2; // Even more space between different branches
      });

    // Calculate positions
    treeLayout(root);

    // Convert to flat array with positions
    const nodes = [];
    const links = [];

    root.each(node => {
      nodes.push({
        ...node.data,
        x: node.y, // Swap x and y for horizontal layout
        y: node.x,
        depth: node.depth
      });

      if (node.parent) {
        links.push({
          source: { 
            x: node.parent.y, // Swap for horizontal layout
            y: node.parent.x 
          },
          target: { 
            x: node.y, // Swap for horizontal layout
            y: node.x 
          },
          sourceId: node.parent.data.id,
          targetId: node.data.id
        });
      }
    });

    return { nodes, links };
  }, [mindMapData]);

  // Calculate related nodes for highlighting
  const relatedNodeIds = useMemo(() => {
    if (!hoveredNode || !layoutData.nodes.length) return new Set();

    const related = new Set([hoveredNode.id]);

    // Find parent
    const parentLink = layoutData.links.find(link => link.targetId === hoveredNode.id);
    if (parentLink) {
      related.add(parentLink.sourceId);
    }

    // Find children
    const childLinks = layoutData.links.filter(link => link.sourceId === hoveredNode.id);
    childLinks.forEach(link => related.add(link.targetId));

    return related;
  }, [hoveredNode, layoutData]);

  // Handle node expansion toggle
  const handleNodeToggle = (nodeId) => {
    const toggleNode = (node) => {
      if (node.id === nodeId) {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(toggleNode)
        };
      }
      return node;
    };

    setMindMapData(toggleNode);
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Update expand all functionality
  useEffect(() => {
    const updateExpansion = (node, shouldExpand, isRoot = false) => {
      return {
        ...node,
        expanded: isRoot ? true : shouldExpand,
        children: node.children?.map(child => updateExpansion(child, shouldExpand, false))
      };
    };
    setMindMapData(updateExpansion(data, expanded, true));
  }, [expanded, data]);

  // Center the view on mount
  useEffect(() => {
    if (layoutData.nodes.length > 0) {
      const rootNode = layoutData.nodes[0];
      setPosition({
        x: window.innerWidth / 2 - rootNode.x,
        y: window.innerHeight / 2 - rootNode.y
      });
    }
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-900 to-black"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.3s ease'
        }}
      >
        {/* SVG for connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#64748b"
              />
            </marker>
            <marker
              id="arrowhead-related"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#60a5fa"
              />
            </marker>
          </defs>
          {layoutData.links.map((link, index) => {
            const isRelatedLink = relatedNodeIds.has(link.sourceId) && relatedNodeIds.has(link.targetId);
            
            // Calculate control points for smoother curves (horizontal flow)
            const dx = link.target.x - link.source.x;
            const midX = link.source.x + dx * 0.5;
            
            return (
              <path
                key={`${link.sourceId}-${link.targetId}-${index}`}
                d={`M ${link.source.x} ${link.source.y} C ${midX} ${link.source.y}, ${midX} ${link.target.y}, ${link.target.x} ${link.target.y}`}
                stroke={isRelatedLink ? "#60a5fa" : "#64748b"}
                strokeWidth={isRelatedLink ? "3" : "2"}
                fill="none"
                className="transition-all duration-300"
                markerEnd={`url(#arrowhead${isRelatedLink ? '-related' : ''})`}
                opacity={isRelatedLink ? 1 : 0.6}
              />
            );
          })}
        </svg>

        {/* Render nodes */}
        {layoutData.nodes.map(node => (
          <div
            key={node.id}
            className="absolute pointer-events-none"
            style={{
              left: node.x,
              top: node.y,
              transform: 'translate(-50%, -50%)',
              transition: 'all 0.3s ease'
            }}
          >
            <Node
              node={node}
              isSelected={selectedNode?.id === node.id}
              isHovered={hoveredNode?.id === node.id}
              isRelated={relatedNodeIds.has(node.id)}
              onClick={(clickedNode) => {
                onNodeClick(clickedNode);
                handleNodeToggle(clickedNode.id);
              }}
              onHover={onNodeHover}
              onEdit={onNodeEdit}
            />
          </div>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-gray-800 bg-opacity-50 p-2 rounded-lg">
        <button
          onClick={() => setZoom(prev => Math.max(0.5, prev * 0.9))}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
        >
          −
        </button>
        <span className="text-white text-sm">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(prev => Math.min(3, prev * 1.1))}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
        >
          +
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-80 p-3 rounded-lg text-white text-sm">
        <div>• Drag to pan</div>
        <div>• Ctrl + Scroll to zoom</div>
        <div>• Click nodes to expand/collapse</div>
      </div>
    </div>
  );
};

// Demo wrapper
export default function App() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const sampleData = {
    id: '1',
    label: 'Root Concept',
    children: [
      {
        id: '2',
        label: 'Branch 1',
        children: [
          { id: '5', label: 'Leaf 1.1' },
          { id: '6', label: 'Leaf 1.2' },
          { id: '7', label: 'Leaf 1.3' }
        ]
      },
      {
        id: '3',
        label: 'Branch 2',
        children: [
          { id: '8', label: 'Leaf 2.1' },
          { id: '9', label: 'Leaf 2.2' }
        ]
      },
      {
        id: '4',
        label: 'Branch 3',
        children: [
          { id: '10', label: 'Leaf 3.1' },
          { id: '11', label: 'Leaf 3.2' },
          { id: '12', label: 'Leaf 3.3' },
          { id: '13', label: 'Leaf 3.4' }
        ]
      }
    ]
  };

  return (
    <div className="w-full h-screen">
      <MindMap
        data={sampleData}
        selectedNode={selectedNode}
        hoveredNode={hoveredNode}
        onNodeClick={setSelectedNode}
        onNodeHover={setHoveredNode}
        onNodeEdit={() => {}}
        expanded={expanded}
      />
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        {expanded ? 'Collapse All' : 'Expand All'}
      </button>
    </div>
  );
}