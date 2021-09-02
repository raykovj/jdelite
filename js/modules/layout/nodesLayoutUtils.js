define('modules/layout/nodesLayoutUtils',
	['modules/geometry/point',
		'modules/graph/xPoint',
		'modules/geometry/rectangle',
		'modules/graph/cell',
		'modules/graph/nodeCell',
		'modules/graph/graphElement',
		'modules/graph/graphNode',
		'modules/graph/connector',
		'modules/graph/corridor',
		'modules/graph/pipe',
		'modules/graph/segment',
		'modules/diagram/diagramUtils',
		'modules/graph/graphConstants'],
	function(Point,
	         XPoint,
	         Rectangle,
	         Cell,
	         NodeCell,
	         GraphElement,
	         GraphNode,
	         Connector,
	         Corridor,
	         Pipe,
	         Segment,
			 dgmUtils,
	         graphConstants) {

		var containsNodeCollection = function(nodes, theNode) {
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].equals(theNode)) {
					return true;
				}
			}
			return false;
		};

		var getInputNodes = function(thisNode) {
			var sourceNodes = [], inPorts = thisNode.getInputPorts();
			for (var i = 0; i < inPorts.length; i++) {
				var edges = inPorts[i].getEdgesList();
				for (var j = 0; j < edges.length; j++) {
					if (edges[j].getSourcePort().getNode()) {
						sourceNodes.push(edges[j].getSourcePort().getNode());
					}
				}
			}
			return sourceNodes;
		};

		var getOutputNodes = function(thisNode) {
			var targetNodes = [],
				outPorts = thisNode.getOutputPorts();
			for (var i = 0; i < outPorts.length; i++) {
				var edges = outPorts[i].getEdgesList();
				for (var j = 0; j < edges.length; j++) {
					if (edges[j].getTargetPort().getNode()) {
						targetNodes.push(edges[j].getTargetPort().getNode());
					}
				}
			}
			return targetNodes;
		};

		var areConnectedFromTo = function(fromNode, toNode) {
			if (!fromNode || !toNode) {
				return false;
			}
			var nodes = getOutputNodes(fromNode);
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].equals(toNode)) {
					return true;
				}
			}
			return false;
		};

		var getTargetNodes = function(node) {
			var trgNodes = [];
			var outPorts = node.getOutputPorts();
			for (var i = 0; i < outPorts.length; i++) {
				var edges = outPorts[i].getEdgesList();
				for (var j = 0; j < edges.length; j++) {
					var trgPort = edges[j].getTargetPort();
					if (trgPort && trgPort.getNode() && trgNodes.indexOf(trgPort.getNode()) < 0) {
						trgNodes.push(trgPort.getNode());
					}
				}
			}
			return trgNodes;
		};

		var getOutputNodesForSide = function(thisNode, side) {
			var targetNodes = [],
				outPorts = thisNode.getOutputPorts();
			for (var i = 0; i < outPorts.length; i++) {
				if (outPorts[i].getSide() === side) {
					var edges = outPorts[i].getEdgesList();
					for (var j = 0; j < edges.length; j++) {
						if (edges[j].getTargetPort().getNode()) {
							targetNodes.push(edges[j].getTargetPort().getNode());
						}
					}
				}
			}
			return targetNodes;
		};

		var getInputNodesForSide = function(thisNode, side) {
			var sourceNodes = [],
				inPorts = thisNode.getInputPorts();
			for (var i = 0; i < inPorts.length; i++) {
				if (inPorts[i].getSide() === side) {
					var edges = inPorts[i].getEdgesList();
					for (var j = 0; j < edges.length; j++) {
						if (edges[j].getSourcePort().getNode()) {
							sourceNodes.push(edges[j].getSourcePort().getNode());
						}
					}
				}
			}
			return sourceNodes;
		};

		var hasFlowTreeConnection = function(startNode, thisNode, anotherNode, visitedNodes) {
			var targetNodes = getTargetNodes(thisNode);
			for (var i = 0; i < targetNodes.length; i++) {
				var targetNode = targetNodes[i];
				if (targetNode.equals(startNode) || visitedNodes.indexOf(targetNode) >= 0) {
					continue;
				}
				if (targetNode.equals(anotherNode)) {
					return true;
				}
				visitedNodes.push(targetNode);
				if (hasFlowTreeConnection(startNode, targetNode, anotherNode, visitedNodes)) {
					return true;
				}
			}
			return false;
		};

		var containsNode = function(nodes, aNode) {
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].equals(aNode)) {
					return true;
				}
			}
			return false;
		};

		var getNodeDownwardFootprint = function(thisNode) {
			var targetNodes = getTargetNodes(thisNode);
			if (targetNodes.length == 0) {
				return 1;
			}
			var width = 1;
			if (thisNode.getFlowType() === graphConstants.flowType().DECISION) {
				width += 2;//thisNode.getOutputConnections()+1;
			}
			for (var i = 0; i < targetNodes.length; i++) {
				if (targetNodes[i].getLevelNumber() > thisNode.getLevelNumber()) {
					width += getNodeDownwardFootprint(targetNodes[i]);
				}
			}
			if (width > 1) {
				if (thisNode.getFlowType() === graphConstants.flowType().START ||
					thisNode.getFlowType() === graphConstants.flowType().CONTAINER ||
					thisNode.getFlowType() === graphConstants.flowType().SWITCH ||
					thisNode.getFlowType() === graphConstants.flowType().PROCESS ||
					thisNode.getFlowType() === graphConstants.flowType().TEXT ||
					thisNode.getFlowType() === graphConstants.flowType().IN_OUT) {
					// compensate for itself
					width--;
				}
			}
			thisNode.setLaneFootprint(width);
			return width;
		};

		var getDescendantsTreeWidth = function(nodes) {
			var width = 0;
			for (var i = 0; i < nodes.length; i++) {
				width += getNodeDownwardFootprint(nodes[i]);
			}
			return width;
		};

		var isMatchingSide = function(side, value) {
			return (side & value) > 0;
		};

		var isNodeTargetOfNode = function(thisNode, parentNode) {
			var children = getTargetNodes(parentNode);
			for (var i = 0; i < children.length; i++) {
				if (children[i].equals(thisNode)) {
					return true;
				}
			}
			return false;
		};

		var getMaxLaneIndexVar = function(nodes) {
			if (nodes.length === 0) {
				return 0;
			}
			var maxLane = 0;
			for (var i = 0; i < nodes.length; i++) {
				maxLane = Math.max(maxLane, nodes[i].getLaneNumber());
			}
			return maxLane;
		};

		var getMinLaneIndexVar = function(nodes) {
			if (nodes.length === 0) {
				return 0;
			}
			var minLane = getMaxLaneIndexVar(nodes);
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].getLaneNumber() >= 0) {
					minLane = Math.min(minLane, nodes[i].getLaneNumber());
				}
			}
			return minLane;
		};

		var hasAllocatedNodes = function(nodes) {
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].getLevelNumber() >= 0 && nodes[i].getLaneNumber() >= 0) {
					return true;
				}
			}
			return false;
		};

		var hasFlowConnectionFromToVar = function(fromNode, toNode) {
			var targetNodes = getTargetNodes(fromNode);
			var visitedNodes = [];
			for (var i = 0; i < targetNodes.length; i++) {
				var targetNode = targetNodes[i];
				if (targetNode.equals(fromNode)) {
					continue;
				}
				if (targetNode.equals(toNode)) {
					return true;
				}
				visitedNodes.push(targetNode);
				if (hasFlowTreeConnection(fromNode, targetNode, toNode, visitedNodes)) {
					return true;
				}
			}
			return false;
		};


		return {
			getLeftLaneNodes: function(nodes) {
				var leftNodes = [];
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].isLeftLaneNode()) {
						leftNodes.push(nodes[i]);
						//	console.log("************************* NODE: "+nodes[i].getName()+", type="+
						//		dgmUtils.getFlowTypeName(nodes[i].getFlowType())+", lane="+nodes[i].getLaneNumber());
					}
				}
				return leftNodes;
			},
			getRightLaneNodes: function(nodes) {
				var rightNodes = [];
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].isRightLaneNode()) {
						rightNodes.push(nodes[i]);
					}
				}
				return rightNodes;
			},
			hasAssignedLevels: function(levels) {
				for (var i = 0; i < levels.length; i++) {
					if (levels[i].getNodes().length > 0) {
						return true;
					}
				}
				return false;
			},
			getCentralTargets: function(parent, allTargets) {
				var targetNodes = getTargetNodes(parent),
					moreTargets = allTargets.slice(0);
				for (var i = 0; i < targetNodes.length; i++) {
					var node = targetNodes[i];
					if (!node.isEndNode() &&
							!node.isLevelAssigned() &&
							//(parent.getFlowType() != LayoutConstants.FlowType.DECISION || parent.isLevelAssigned()) &&
							moreTargets.indexOf(node) < 0) {
						moreTargets.push(node);
					}
				}
				return moreTargets;
			},
			isAncestorNode: function(thisNode, otherNode) {
				if (!thisNode || !otherNode) {
					return false;
				}
				if (thisNode === otherNode) {
					return false;
				}
				var inPorts = thisNode.getInputPorts();
				for (var i = 0; i < inPorts.length; i++) {
					var edges = inPorts[i].getEdgesList();
					for (var j = 0; j < edges.length; j++) {
						var srcNode = edges[j].getSourcePort().getNode();
						if (srcNode && srcNode.equals(otherNode)) {
							return true;
						}
					}
				}
				return false;
			},
			hasDecisionAncestor: function(thisNode, otherNodes) {
				for (var i = 0; i < otherNodes.length; i++) {
					var node = otherNodes[i];
					if (isAncestorNode(thisNode, node) &&
							node.getFlowType() === graphConstants.flowType().DECISION) {
						return node;
					}
				}
				return null;
			},
			getDecisionParent: function(thisNode) {
				var inPorts = thisNode.getInputPorts();
				for (var i = 0; i < inPorts.length; i++) {
					var edges = inPorts[i].getEdgesList();
					for (var j = 0; j < edges.length; j++) {
						var srcNode = edges[j].getSourcePort().getNode();
						if (srcNode && srcNode.getFlowType()  === graphConstants.flowType().DECISION) {
							return srcNode;
						}
					}
				}
				return null;
			},
			/**
			 * Return nodes from fromNodes that are connected to toNode
			 * @param fromNodes
			 * @param toNode
			 * @return
			 */
			getConnectedNodes: function(fromNodes, toNode) {
				var nodes = [];
				for (var i = 0; i < fromNodes.length; i++) {
					if (areConnectedFromTo(fromNodes[i], toNode)) {
						nodes.push(node);
					}
				}
				return nodes;
			},
			areNodesConnected: function(nodeA, nodeB) {
				return areConnectedFromTo(nodeA, nodeB) || areConnectedFromTo(nodeB, nodeA);
			},
			areNodesConnectedSideToSide: function(nodeA, sideA, nodeB, sideB) {
				var insA = getInputNodesForSide(nodeA, sideA);
				if (containsNodeCollection(insA, nodeB)) {
					return true;
				}
				var outsA = getOutputNodesForSide(nodeA, sideA);
				if (containsNodeCollection(outsA, nodeB)) {
					return true;
				}
				var insB = getInputNodesForSide(nodeB, sideB);
				if (containsNodeCollection(insB, nodeA)) {
					return true;
				}
				var outsB = getOutputNodesForSide(nodeB, sideB);
				if (containsNodeCollection(outsB, nodeA)) {
					return true;
				}
				return false;
			},
			getStartNodes: function(graphNodes) {
				var startNodes = [];
				for (var i = 0; i < graphNodes.length; i++) {
					if (graphNodes[i].isStartNode()) {
						startNodes.push(graphNodes[i]);
					}
				}
				return startNodes;
			},
			getEndNodes: function(graphNodes) {
				var endNodes = [];
				for (var i = 0; i < graphNodes.length; i++) {
					if (graphNodes[i].isEndNode()) {
						endNodes.push(graphNodes[i]);
					}
				}
				return endNodes;
			},
			getNodeStartSegmentsAtSide: function(node, side) {
				var outPorts = node.getOutputPorts(),
					sideSegments = [];
				outPorts = outPorts.concat(node.getRefOutPorts());
				for (var i = 0; i < outPorts.length; i++) {
					if (outPorts[i].getSide() === side) {
						var edges = outPorts[i].getEdgesList();
						for (var j = 0; j < edges.length; j++) {
							if (edges[j].getStartSegment()) {
								sideSegments.push(edges[j].getStartSegment());
							}
						}
					}
				}
				return sideSegments;
			},
			getNodeEndSegmentsAtSide: function(node, side) {
				var inPorts = node.getInputPorts(),
					sideSegments = [];
				inPorts = inPorts.concat(node.getRefInPorts());
				for (var i = 0; i < inPorts.length; i++) {
					if (inPorts[i].getSide() === side) {
						var edges = inPorts[i].getEdgesList();
						for (var j = 0; j < edges.length; j++) {
							if (edges[j].getEndSegment()) {
								sideSegments.push(edges[j].getEndSegment());
							}
						}
					}
				}
				return sideSegments;
			},
			getUnconnectedNodes: function(nodes) {
				var unCnxNodes = [];
				for (var i = 0; i < nodes.length; i++) {
					if (!nodes[i].hasConnections()) {
						unCnxNodes.push(nodes[i]);
					}
				}
				return unCnxNodes;
			},
			areAllUnconnected: function(nodes) {
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].hasConnections()) {
						return false;
					}
				}
				return true;
			},
			getNodesWithConnections: function(nodes) {
				var cnxNodes = [];
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].hasConnections()) {
						cnxNodes.push(nodes[i]);
					}
				}
				return cnxNodes;
			},
			getNodesWithNoInputs: function(nodes) {
				var noInNodes = [];
				for (var i = 0; i < nodes.length; i++) {
					if (getInputNodes(nodes[i]).length === 0) {
						noInNodes.push(nodes[i]);
					}
				}
				return noInNodes;
			},
			getNodesNoInputsWithOutputs: function(nodes) {
				var noInNodes = [];
				for (var i = 0; i < nodes.length; i++) {
					if (getInputNodes(nodes[i]).length === 0 && getOutputNodes(nodes[i]).length > 0) {
						noInNodes.push(nodes[i]);
					}
				}
				return noInNodes;
			},
			getSourceNodes: function(node) {
				var srcNodes = [];
				var inPorts = node.getInputPorts();
				for (var i = 0; i < inPorts.length; i++) {
					var edges = inPorts[i].getEdgesList();
					for (var j = 0; j < edges.length; j++) {
						var srcPort = edges[j].getSourcePort();
						if (srcPort && srcPort.getNode() && srcNodes.indexOf(srcPort.getNode()) < 0) {
							srcNodes.push(srcPort.getNode());
						}
					}
				}
				return srcNodes;
			},
			getTargetNodesOfNode: function(node) {
				return getTargetNodes(node);
			},
			getDecisionNodes: function(nodes) {
				var decisionNodes = [];
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].getFlowType() === graphConstants.flowType().DECISION) {
						decisionNodes.push(nodes[i]);
					}
				}
				return decisionNodes;
			},
			areNodesInSameTree: function(node1, node2) {
				if (hasFlowConnectionFromToVar(node1, node2) || hasFlowConnectionFromToVar(node2, node1)) {
					return true;
				}
				// TODO: obsolete, risky
				//return isNodeInSameNodesTree(node2, getSourceNodes(node1));
				return false;
			},
			isNodeInSameNodesTree: function(node2, sourceGroup) {
				for (var i = 0; i < sourceGroup.length; i++) {
					var srcNode = sourceGroup[i];
					if (hasFlowConnectionFromToVar(srcNode, node2) || hasFlowConnectionFromToVar(node2, srcNode)) {
						return true;
					}
					// TODO: obsolete, risky
					//if isNodeInSameNodesTree(node2, getSourceNodes(srcNode))) {
					//	return true;
					//}
				}
				return false;
			},
			/**
			 * Check if toNode is descendant of fromNode
			 * Because of the possibility of closed loops, we need to avoid visiting the same node again
			 * param fromNode - the root
			 * param toNode - potential descendant
			 * return true if toNode is descendant of fromNode
			 */
			hasFlowConnectionFromTo: function(fromNode, toNode) {
				return hasFlowConnectionFromToVar(fromNode, toNode);
			},
			getLevelUnallocatedTargetNodes: function(node) {
				var trgNodes = [];
				var outPorts = node.getOutputPorts();
				for (var i = 0; i < outPorts.length; i++) {
					var edges = outPorts[i].getEdgesList();
					for (var j = 0; j < edges.length; j++) {
						var trgPort = edges[j].getTargetPort();
						if (trgPort.getNode().getLevelNumber() === GraphNode.LEVEL_UNDEF) {
							if (!containsNode(trgNodes, trgPort.getNode())) {
								trgNodes.push(trgPort.getNode());
							}
						}
					}
				}
				return trgNodes;
			},
			getLaneUnallocatedTargetNodes: function(node) {
				var trgNodes = [];
				var outPorts = node.getOutputPorts();
				for (var i = 0; i < outPorts.length; i++) {
					var edges = outPorts[i].getEdgesList();
					for (var j = 0; j < edges.length; j++) {
						var trgPort = edges[j].getTargetPort();
						if (trgPort.getNode().getLaneNumber() === GraphNode.LANE_UNDEF) {
							if (!containsNode(trgNodes, trgPort.getNode())) {
								trgNodes.push(trgPort.getNode());
							}
						}
					}
				}
				return trgNodes;
			},
			/**
			 * param graphNodes
			 * return list of overlapping nodes
			 */
			getOverlappingNodes: function(graphNodes) {
				var list = [];
				for (var i = 0; i < graphNodes.length-1; i++) {
					var node = graphNodes[i];
					if (!node.isVisible()) {
						continue;
					}
					for (var j = i+1; j < graphNodes.length; j++) {
						var nextNode = graphNodes[j];
						if (!nextNode.isVisible()) {
							continue;
						}
						if (node.getLevelNumber() === nextNode.getLevelNumber() &&
							node.getLaneNumber() === nextNode.getLaneNumber())  {
							list.push(nextNode);
						}
					}
				}
				return list;
			},
			getUnallocatedNodes: function(nodes) {
				var unAllocNodes = [];
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].getLevelNumber() < 0 || nodes[i].getLaneNumber() < 0) {
						unAllocNodes.push(nodes[i]);
					}
				}
				return unAllocNodes;
			},
			getStringListOfNodes: function(nodes) {
				var sb = [];
				for (var i = 0; i < nodes.length; i++) {
					var node = nodes[i];
					if (i > 0) { sb.push("\n"); }
					sb.push(node.getName()+"("+node.getLevelNumber()+", "+node.getLaneNumber()+")");
				}
				return sb.valueOf();
			},
			getNonSuppressedNodes: function(nodes) {
				var nonSuppNodes = [];
				for (var i = 0; i < nodes.length; i++) {
					if (!nodes[i].isSuppressed()) {
						nonSuppNodes.push(nodes[i]);
					}
				}
				return nonSuppNodes;
			},
			getNodesAtLevel: function(nodes, levelNum) {
				var nodesAtLevel = [];
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].getLevelNumber() === levelNum) {
						nodesAtLevel.push(nodes[i]);
					}
				}
				return nodesAtLevel;
			},
			getNodesAtLane: function(nodes, laneNum) {
				var nodesAtLane = [];
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].getLaneNumber() === laneNum) {
						nodesAtLane.push(nodes[i]);
					}
				}
				return nodesAtLane;
			},
			getNodesLevelRange: function(nodes) {
				if (nodes.length === 0) {
					return [0, 0];
				}
				var min = Number.MAX_VALUE, max = 0;
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].getLevelNumber() >= 0) {
						min = Math.min(min, nodes[i].getLevelNumber());
						max = Math.max(max, nodes[i].getLevelNumber());
					}
				}
				return min < Number.MAX_VALUE ? [min, max] : [0, max];
			},
			getNodesLaneRange: function(nodes) {
				if (nodes.length === 0) {
					return [0, 0];
				}
				var min = Number.MAX_VALUE, max = 0;
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].getLaneNumber() >= 0) {
						min = Math.min(min, nodes[i].getLaneNumber());
						max = Math.max(max, nodes[i].getLaneNumber());
					}
				}
				return min < Number.MAX_VALUE ? [min, max] : [0, max];
			},
			getMaxLaneIndex: function(nodes) {
				return getMaxLaneIndexVar(nodes);
			},
			getMinLaneIndex: function(nodes) {
				return getMinLaneIndexVar(nodes);
			},
			getFirstEmptyLaneIndex: function(lanes, minLaneNum, maxLaneNum) {
				for (var i = minLaneNum; i < maxLaneNum; i++) {
					if (lanes[i].getNodes().length === 0) {
						return i;
					}
				}
				return -1;
			},
			// use only when non-empty center lanes
			getFirstNonEmptyCentralLaneIndex: function(lanes) {
				for (var idx = 0; idx < lanes.length; idx++) {
					var lane = lanes[idx];
					if (lane.isLeftLane()) {
						continue;
					}
					if (lane.getNodes().length > 0 && hasAllocatedNodes(lane.getNodes())) {
						return idx;
					}
				}
				return -1;
			},
			// use only when non-empty center lanes
			getLastNonEmptyCentralLaneIndex: function(lanes) {
				for (var idx = lanes.length-1; idx >= 0; idx--) {
					var lane = lanes[idx];
					if (lane.isRightLane()) {
						continue;
					}
					if (lane.getNodes().length > 0 && hasAllocatedNodes(lane.getNodes())) {
						return idx;
					}
				}
				return -1;
			},
			getEmptyLanesNumber: function(lanes, minLaneNum, maxLaneNum) {
				var num = 0;
				for (var i = minLaneNum; i <= maxLaneNum; i++) {
					if (lanes[i].getNodes().length === 0) {
						num++;
					}
				}
				return num;
			},
			getCentralLevelsNumber: function(levels) {
				var num = 0;
				for (var i = 0; i < levels.length; i++) {
					if (!levels[i].isStartLevel() && !levels[i].isEndLevel()) {
						num++;
					}
				}
				return num;
			},
			getCentralLanesNumber: function(lanes) {
				var num = 0;
				for (var i = 0; i < lanes.length; i++) {
					if (!lanes[i].isLeftLane() && !lanes[i].isRightLane()) {
						num++;
					}
				}
				return num;
			},
			detachAll: function(nodes) {
				for (var i = 0; i < nodes.length; i++) {
					nodes[i].detach();
				}
			},
			getDescendantsTreeWidthByLevel: function(level) {
				var nodes = level.getNodes();
				return getDescendantsTreeWidth(nodes);
			},
			getAverageLanePosition: function(nodes) {
				var aggr = 0, cnt = 0;
				for (var i = 0; i < nodes.length; i++) {
					var laneNum = nodes[i].getLaneNumber();
					if (laneNum > GraphNode.LANE_UNDEF) {
						aggr += laneNum;
						cnt++;
					}
				}
				if (cnt > 0) {
					return Math.floor(aggr / cnt);
				} else {
					return 0;
				}
			},
			getNewLanePosition: function(level, preferredPos,minIdx, maxIdx) {
				if (!level.getNodeAtLane(preferredPos) &&
					preferredPos >= minIdx && preferredPos <= maxIdx) {
					return preferredPos;
				}
				var i = 1;
				while (i <= maxIdx - preferredPos || i <= preferredPos - minIdx) {
					if (i <= maxIdx - preferredPos) {
						if (!level.getNodeAtLane(preferredPos + i)) {
							return preferredPos+i;
						}
					}
					if (i <= preferredPos - minIdx) {
						if (!level.getNodeAtLane(preferredPos - i)) {
							return preferredPos-i;
						}
					}
					i++;
				}
				return GraphNode.LANE_UNDEF;
			},
			getDecisionChildPosition: function(parent, child, orientation) {
				var lanePos = parent.getLaneNumber();
				if (!parent.isDecisionNode()) {
					return lanePos;
				}
				var outPorts = parent.getOutputPorts();
				for (var i = 0; i < outPorts.length; i++) {
					var port = outPorts[i];
					var edges = port.getEdgesList();
					for (var j = 0; j < edges.length; j++) {
						var trgNode = edges[j].getTargetPort().getNode();
						if (child.equals(trgNode)) {
							// here we are
							var side = port.getSide();
							if (isMatchingSide(side, graphConstants.nodeSide().FRONT)) {
								return lanePos;
							} else {
								var offset = 1;
								var footPrint = child.getLaneFootprint();
								//var delta = Math.floor(footPrint/2);
								//int delta = footPrint%2 == 0 ? Math.floor(footPrint/2) : Math.floor(footPrint/2)+1;
								offset += Math.floor(footPrint/2);
								if (orientation == graphConstants.flow().VERTICAL) {
									return isMatchingSide(side, graphConstants.nodeSide().LEFT) ? lanePos + offset : lanePos - offset;
								} else {
									return isMatchingSide(side, graphConstants.nodeSide().LEFT) ? lanePos - offset : lanePos + offset;
								}
							}
						}
					}
				}
				return lanePos;
			},
			getNextLanePositionInLevel: function(level, node, minIdx, maxIdx) {
				var cells = level.getCells();
				var positions = []; //new int[cells.size()];
				for (var i = 0; i < cells.length; i++) {
					positions.push(cells[i].getLaneNumber());
				}
				for (var k = minIdx; k <= maxIdx; k++) {
					var found = false;
					for (i = 0; i < positions.length; i++) {
						if (k === positions[i]) {
							found = true;
							break;
						}
					}
					if (!found) {
						return k;
					}
				}
				return GraphNode.LANE_UNDEF;
			},
			isNodeTargetOf: function(thisNode, nodes) {
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].equals(thisNode)) {
						continue;
					}
					if (isNodeTargetOfNode(thisNode, nodes[i])) {
						return true;
					}
				}
				return false;
			},
			getFirstCenterEmptyLevelIndex: function(levels) {
				for (var i = 0; i < levels.length; i++) {
					var level = levels[i];
					if (level.isStartLevel()) {
						continue;
					}
					var nodes = level.getNodes();
					if (nodes.length === 0) {
						return level.getOrder();
					} else {
						var cnt = 0;
						for (var j = 0; j < nodes.length; j++) {
							if (nodes[j].getFlowType() != graphConstants.flowType().LEFT_TOP &&
								nodes[j].getFlowType() != graphConstants.flowType().RIGHT_BOTTOM) {
								cnt++;
							}
						}
						if (cnt === 0) {
							return level.getOrder();
						}
					}
				}
				return GraphNode.LEVEL_UNDEF;
			}

		}
	}
);
