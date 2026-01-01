import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const prevExpandedRef = useRef(expanded);
  const dataIdRef = useRef(JSON.stringify(data));

  // Calculate layout for visible nodes
  const layoutData = useMemo(() => {
    if (!mindMapData) return { nodes: [], links: [] };

    // Create hierarchy
    const root = d3.hierarchy(mindMapData, d => d.expanded ? d.children : []);

    // Node dimensions - nodes have min-width of 250px, but can be wider with content and padding (p-4 = 16px each side)
    // Account for nodes potentially being 350-400px wide with content
    const NODE_WIDTH = 400; // Conservative estimate for node width including content
    const NODE_HEIGHT = 80; // Node height estimate
    // For horizontal layout: horizontal spacing is between levels (depth), vertical spacing is between siblings
    const HORIZONTAL_SPACING = 800; // Spacing between levels (left to right)
    const VERTICAL_SPACING = 90; // Spacing between siblings (top to bottom)

    // Create tree layout - default is vertical (top to bottom)
    // For horizontal layout, we'll swap x and y coordinates after calculation
    const treeLayout = d3.tree()
      .nodeSize([VERTICAL_SPACING, HORIZONTAL_SPACING]) // [vertical between siblings, horizontal between levels]
      .separation((a, b) => {
        // For siblings (same parent), use very large multiplier to ensure no overlaps
        // 90 * 2.5 = 225px between centers vertically, providing adequate spacing
        if (a.parent === b.parent) {
          return 2.5;
        }
        // For nodes at different levels, use standard spacing
        return 1.0;
      });

    // Calculate positions (this gives us vertical layout)
    treeLayout(root);

    // Convert to flat array with positions and swap x/y for horizontal layout
    const nodes = [];
    const links = [];

    root.each(node => {
      // Swap x and y to make it horizontal (left to right)
      // In d3.tree: x is horizontal position, y is vertical position
      // For horizontal tree: we want depth to go left-right, siblings to go top-bottom
      nodes.push({
        ...node.data,
        x: node.y, // Swap: use y (depth) as horizontal position
        y: node.x, // Swap: use x (sibling position) as vertical position
        depth: node.depth
      });

      if (node.parent) {
        links.push({
          source: { x: node.parent.y, y: node.parent.x }, // Swap coordinates
          target: { x: node.y, y: node.x }, // Swap coordinates
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

  // Handle data and expanded state changes
  useEffect(() => {
    const currentDataId = JSON.stringify(data);
    const expandedChanged = prevExpandedRef.current !== expanded;
    const dataChanged = dataIdRef.current !== currentDataId;

    // If expanded prop changed (expand all/collapse all), update all expanded states
    if (expandedChanged) {
      const updateExpansion = (node, shouldExpand, isRoot = false) => {
        return {
          ...node,
          expanded: isRoot ? true : shouldExpand,
          children: node.children?.map(child => updateExpansion(child, shouldExpand, false))
        };
      };
      setMindMapData(updateExpansion(data, expanded, true));
      prevExpandedRef.current = expanded;
      dataIdRef.current = currentDataId;
      return;
    }

    // If only data changed (add/edit node), preserve existing expanded states
    if (dataChanged) {
      setMindMapData(prevData => {
        // Create a map of existing expanded states by node ID
        const expandedStateMap = new Map();
        const collectExpandedStates = (node) => {
          if (node?.id !== undefined) {
            expandedStateMap.set(node.id, node.expanded);
          }
          if (node?.children) {
            node.children.forEach(collectExpandedStates);
          }
        };
        collectExpandedStates(prevData);

        // Merge new data with existing expanded states
        const mergeExpandedStates = (node, isRoot = false) => {
          const preservedExpanded = expandedStateMap.has(node.id) 
            ? expandedStateMap.get(node.id)
            : (isRoot ? true : false);

          return {
            ...node,
            expanded: preservedExpanded,
            children: node.children?.map(child => mergeExpandedStates(child, false))
          };
        };

        return mergeExpandedStates(data, true);
      });
      dataIdRef.current = currentDataId;
    }
  }, [data, expanded]);

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
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
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
            // Create a smooth quadratic curve for clearer edge display
            const dx = link.target.x - link.source.x;
            const dy = link.target.y - link.source.y;
            const midX = link.source.x + dx * 0.5;
            const midY = link.source.y + dy * 0.5;
            // Small perpendicular offset for subtle curve
            const perpX = -dy * 0.15;
            const perpY = dx * 0.15;
            return (
              <path
                key={`${link.sourceId}-${link.targetId}-${index}`}
                d={`M ${link.source.x} ${link.source.y} Q ${midX + perpX} ${midY + perpY} ${link.target.x} ${link.target.y}`}
                stroke={isRelatedLink ? "#9ca3af" : "#64748b"}
                strokeWidth={isRelatedLink ? "3" : "2.5"}
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
              left: `${node.x}px`,
              top: `${node.y}px`,
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