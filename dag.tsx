import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';

const NODE_DIMENSIONS = {
  width: 160,
  height: 40,
  rx: 8,
  textPadding: 16,
  buttonSpacing: 32, // Increased from 24 to 32 for more gap between buttons
  horizontalGap: 100,
  verticalGap: 80
};

const CircularButton = React.memo(({ x, y, onClick, icon: Icon, label, isActive }) => (
  <g
    transform={`translate(${x-12},${y-12})`}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`cursor-pointer transition-all duration-200 ${
      isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'
    }`}
    role="button"
    aria-label={label}
  >
    <circle
      cx="12"
      cy="12"
      r="12"
      className={`${
        isActive ? 'fill-blue-100' : 'fill-gray-100'
      } transition-colors duration-200`}
    />
    
    <g transform="translate(6, 6)">
      <Icon 
        className={`w-12 h-12 ${isActive ? 'text-blue-500' : 'text-gray-500'}`}
        size={12}
      />
    </g>
  </g>
));

const ColumnDropdown = React.memo(({ x, y, onClose, columns = ['id', 'name', 'value', 'timestamp'] }) => (
  <g transform={`translate(${x},${y})`}>
    <rect
      x={-NODE_DIMENSIONS.width/2} // Changed to align with node width
      y={0}
      width={NODE_DIMENSIONS.width}
      height={120}
      rx={8}
      className="fill-white shadow-lg stroke-gray-200 stroke-1"
    />
    <foreignObject 
      x={-NODE_DIMENSIONS.width/2} // Changed to align with node width
      y={0} 
      width={NODE_DIMENSIONS.width}
      height={120}
    >
      <div className="p-2">
        <div className="text-sm font-medium text-gray-700 mb-2">Columns</div>
        {columns.map((column) => (
          <div
            key={column}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onClose(column);
            }}
          >
            {column}
          </div>
        ))}
      </div>
    </foreignObject>
  </g>
));

const DAGNode = React.memo(({ 
  id, 
  x, 
  y, 
  label, 
  isSelected, 
  onClick, 
  isExpanded, 
  onToggleExpand, 
  onAdd,
  showDropdown,
  onToggleDropdown,
  onColumnSelect 
}) => {
  const { width, height, rx, textPadding, buttonSpacing } = NODE_DIMENSIONS;
  const buttonsStartX = width - (buttonSpacing + 20);
  
  return (
    <g 
      transform={`translate(${x - width/2},${y - height/2})`} 
      className={`transition-all duration-200 ${isSelected ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
    >
      <rect
        width={width}
        height={height}
        rx={rx}
        transform="translate(2, 2)"
        className="fill-gray-200/50"
      />
      
      <rect
        width={width}
        height={height}
        rx={rx}
        onClick={onClick}
        className={`${
          isSelected 
            ? 'fill-blue-50 stroke-blue-500' 
            : 'fill-white stroke-gray-200 hover:stroke-blue-400'
        } stroke-[1.5] cursor-pointer`}
      />
      
      <text 
        x={textPadding}
        y={height/2}
        dy=".35em" 
        onClick={onClick}
        className={`text-sm font-medium select-none cursor-pointer ${
          isSelected ? 'text-blue-600' : 'text-gray-600'
        }`}
      >
        {label}
      </text>

      <g>
        <CircularButton
          x={buttonsStartX}
          y={height/2}
          onClick={onToggleDropdown}
          icon={Plus}
          label="Add column"
          isActive={showDropdown}
        />
        <CircularButton
          x={buttonsStartX + buttonSpacing}
          y={height/2}
          onClick={onToggleExpand}
          icon={isExpanded ? ChevronUp : ChevronDown}
          label={isExpanded ? "Collapse" : "Expand"}
          isActive={isExpanded}
        />
      </g>

      {showDropdown && (
        <ColumnDropdown 
          x={width/2}  // Changed to center the dropdown
          y={height + 5}
          onClose={(column) => {
            onColumnSelect?.(id, column);
            onToggleDropdown();
          }}
        />
      )}
    </g>
  );
});

const DAGEdge = React.memo(({ sourceX, sourceY, targetX, targetY, isHighlighted }) => {
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const curvature = Math.min(80, Math.abs(targetX - sourceX) / 2);
  
  const path = `
    M ${sourceX} ${sourceY}
    C ${sourceX + curvature} ${sourceY},
      ${targetX - curvature} ${targetY},
      ${targetX} ${targetY}
  `;

  return (
    <g className="transition-all duration-200">
      <path
        d={path}
        fill="none"
        className={`${
          isHighlighted 
            ? 'stroke-blue-400 stroke-2' 
            : 'stroke-gray-300 stroke-[1.5]'
        } transition-all duration-200`}
        markerEnd={isHighlighted ? "url(#arrowhead-highlighted)" : "url(#arrowhead)"}
      />
    </g>
  );
});

const DAGGraph = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [dropdownNode, setDropdownNode] = useState(null);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [nodeColumns, setNodeColumns] = useState({});
  
  const nodes = [
    { id: 'source', label: 'Source', x: 100, y: 150 },
    { id: 'raw', label: 'Raw', x: 300, y: 80 },
    { id: 'stage', label: 'Stage', x: 300, y: 220 },
    { id: 'transform', label: 'Transform', x: 500, y: 150 },
    { id: 'target', label: 'Target', x: 700, y: 150 },
  ];

  const edges = [
    { source: 'source', target: 'raw' },
    { source: 'source', target: 'stage' },
    { source: 'raw', target: 'transform' },
    { source: 'stage', target: 'transform' },
    { source: 'transform', target: 'target' },
  ];

  const getNodeById = useCallback((id) => 
    nodes.find(node => node.id === id), [nodes]);

  const getNodeCoordinates = useCallback((node) => {
    const { width, height } = NODE_DIMENSIONS;
    // Always connect to the left side of the target node and right side of source node
    const isTarget = edges.some(edge => edge.target === node.id);
    const isSource = edges.some(edge => edge.source === node.id);
    
    if (isSource && !isTarget) {
      return { x: node.x + width/2, y: node.y };
    }
    if (isTarget && !isSource) {
      return { x: node.x - width/2, y: node.y };
    }
    // For nodes that are both source and target, use left side for incoming edges
    return { x: node.x - width/2, y: node.y };
  }, [edges]);

  const isEdgeHighlighted = useCallback((edge) => {
    if (!selectedNode) return false;
    return edge.source === selectedNode || edge.target === selectedNode;
  }, [selectedNode]);

  // Modified to only check immediate children
  const getImmediateChildren = useCallback((nodeId) => {
    return edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
  }, [edges]);

  const isNodeVisible = useCallback((nodeId) => {
    return !Array.from(collapsedNodes).some(collapsedId => {
      // Only check immediate children
      const children = getImmediateChildren(collapsedId);
      return children.includes(nodeId);
    });
  }, [collapsedNodes, getImmediateChildren]);

  const isEdgeVisible = useCallback((edge) => {
    return isNodeVisible(edge.source) && isNodeVisible(edge.target);
  }, [isNodeVisible]);

  const handleToggleExpand = useCallback((nodeId) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleToggleDropdown = useCallback((nodeId) => {
    setDropdownNode(dropdownNode === nodeId ? null : nodeId);
  }, [dropdownNode]);

  const handleColumnSelect = useCallback((nodeId, column) => {
    setNodeColumns(prev => ({
      ...prev,
      [nodeId]: [...(prev[nodeId] || []), column]
    }));
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setDropdownNode(null);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50/50 p-8 rounded-lg">
      <svg 
        width="800"
        height="300" 
        className="overflow-visible"
        onClick={handleBackgroundClick}
      >
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-gray-300" />
          </marker>
          <marker
            id="arrowhead-highlighted"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-blue-400" />
          </marker>
        </defs>

        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path 
            d="M 40 0 L 0 0 0 40" 
            fill="none" 
            stroke="currentColor" 
            className="stroke-gray-200" 
            strokeWidth="0.5"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" className="opacity-50" />

        {edges.filter(isEdgeVisible).map((edge, index) => {
          const sourceNode = getNodeById(edge.source);
          const targetNode = getNodeById(edge.target);
          const sourceCoords = getNodeCoordinates(sourceNode);
          const targetCoords = getNodeCoordinates(targetNode);
          return (
            <DAGEdge
              key={`edge-${index}`}
              sourceX={sourceCoords.x}
              sourceY={sourceCoords.y}
              targetX={targetCoords.x}
              targetY={targetCoords.y}
              isHighlighted={isEdgeHighlighted(edge)}
            />
          );
        })}

        {nodes.filter(node => isNodeVisible(node.id)).map(node => (
          <DAGNode
            key={node.id}
            {...node}
            isSelected={selectedNode === node.id}
            isExpanded={!collapsedNodes.has(node.id)}
            showDropdown={dropdownNode === node.id}
            onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
            onToggleExpand={() => handleToggleExpand(node.id)}
            onToggleDropdown={() => handleToggleDropdown(node.id)}
            onColumnSelect={handleColumnSelect}
          />
        ))}
      </svg>
    </div>
  );
};

export default DAGGraph;
