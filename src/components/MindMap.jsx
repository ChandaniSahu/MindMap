import React, { useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3-hierarchy';
import Node from './Node';

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

  // Calculate layout for visible nodes
  const layoutData = useMemo(() => {
    if (!mindMapData) return { nodes: [], links: [] };

    // Create hierarchy
    const root = d3.hierarchy(mindMapData, d => d.expanded ? d.children : []);

    // Create tree layout
    const treeLayout = d3.tree()
      .nodeSize([200, 150]) // [width, height] between nodes
      .separation((a, b) => a.parent === b.parent ? 1 : 1.2);

    // Calculate positions
    treeLayout(root);

    // Convert to flat array with positions
    const nodes = [];
    const links = [];

    root.each(node => {
      nodes.push({
        ...node.data,
        x: node.x,
        y: node.y,
        depth: node.depth
      });

      if (node.parent) {
        links.push({
          source: { x: node.parent.x, y: node.parent.y },
          target: { x: node.x, y: node.y },
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
        expanded: isRoot ? true : shouldExpand, // Keep root always expanded initially
        children: node.children?.map(child => updateExpansion(child, shouldExpand, false))
      };
    };
    setMindMapData(updateExpansion(data, expanded, true));
  }, [expanded, data]);

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
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.3s ease'
        }}
      >
        {/* SVG for connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
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
                fill="#9ca3af"
              />
            </marker>
          </defs>
          {layoutData.links.map((link, index) => {
            const isRelatedLink = relatedNodeIds.has(link.sourceId) && relatedNodeIds.has(link.targetId);
            return (
              <path
                key={`${link.sourceId}-${link.targetId}-${index}`}
                d={`M ${link.source.x} ${link.source.y} Q ${(link.source.x + link.target.x) / 2} ${(link.source.y + link.target.y) / 2} ${link.target.x} ${link.target.y}`}
                stroke={isRelatedLink ? "#9ca3af" : "#64748b"}
                strokeWidth={isRelatedLink ? "3" : "2"}
                fill="none"
                className="transition-all duration-300"
                markerEnd={`url(#arrowhead${isRelatedLink ? '-related' : ''})`}
              />
            );
          })}
        </svg>

        {/* Render nodes */}
        {layoutData.nodes.map(node => (
          <div
            key={node.id}
            className="absolute"
            style={{
              left: node.x - 125, // Center node horizontally (assuming 250px width / 2)
              top: node.y - 40,   // Center node vertically (assuming 80px height / 2)
              transform: 'translate(-50%, -50%)'
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
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
        >
          −
        </button>
        <span className="text-white text-sm">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(prev => Math.min(3, prev * 1.1))}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default MindMap;
