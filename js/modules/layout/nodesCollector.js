define('modules/layout/nodesCollector',
	['modules/layout/nodesLayoutUtils',
		'modules/common/commonUtils',
		'modules/graph/graphNode',
		'modules/graph/connector',
		'modules/graph/graphConstants'],
	function(nodesLayoutUtl,
	         Utils,
	         GraphNode,
	         Connector,
	         graphConstants) {
		function NodesCollector() {

			var self = this;

			self.nodes = [];

			self.allNodes               = [];
			self.getAllNodes = function() { return self.allNodes; };

			self.startNodes             = [];
			self.getStartNodes = function() { return self.startNodes; };

			self.startNodesCenterTargets = [];
			self.getStartNodesCenterTargets = function() { return self.startNodesCenterTargets; };

			self.startNodesLeftTargets  = [];
			self.getStartNodesLeftTargets = function() { return self.startNodesLeftTargets; };

			self.startNodesRightTargets = [];
			self.getStartNodesRightTargets = function() { return self.startNodesRightTargets; };

			self.endNodes               = [];
			self.getEndNodes = function() { return self.endNodes; };

			self.leftTopNodes           = [];
			self.getLeftTopNodes = function() { return self.leftTopNodes; };

			self.rightBottomNodes       = [];
			self.getRightBottomNodes = function() { return self.rightBottomNodes; };

			self.middleNodes            = [];
			self.getMiddleNodes = function() { return self.middleNodes; };

			self.centerNodes            = [];
			self.getCenterNodes = function() { return self.centerNodes; };

			self.leftNoInputNodes       = [];
			self.getLeftNoInputNodes = function() { return self.leftNoInputNodes; };

			self.rightNoInputNodes      = [];
			self.getRightNoInputNodes = function() { return self.rightNoInputNodes; };

			self.centerNoInputNodes     = [];
			self.getCenterNoInputNodes = function() { return self.centerNoInputNodes; };

			self.centerNoCnxNodes       = [];
			self.getCenterNoCnxNodes = function() { return self.centerNoCnxNodes; };

			self.leftNoCnxNodes         = [];
			self.getLeftTopNoCnxNodes = function() { return self.leftNoCnxNodes; };

			self.rightNoCnxNodes        = [];
			self.getRightBottomNoCnxNodes = function() { return self.rightNoCnxNodes; };

			self.groupsRootNodes        = [];
			//self.getAlienGroupsRootNodes = function() { return self.groupsRootNodes; };


			self.collectNodes = function(nodes) {
				self.nodes = nodes;
				self.allNodes = nodesLayoutUtl.getNonSuppressedNodes(self.nodes);
				self.startNodes = nodesLayoutUtl.getStartNodes(self.allNodes);
				self.endNodes   = nodesLayoutUtl.getEndNodes(self.allNodes);
				self.leftTopNodes = nodesLayoutUtl.getLeftLaneNodes(self.allNodes);
				self.rightBottomNodes = nodesLayoutUtl.getRightLaneNodes(self.allNodes);

				self.middleNodes = Utils.subtractArrays(self.allNodes, self.startNodes);
				self.middleNodes = Utils.subtractArrays(self.middleNodes, self.endNodes);

				self.centerNodes = Utils.subtractArrays(self.middleNodes, self.leftTopNodes);
				self.centerNodes = Utils.subtractArrays(self.centerNodes, self.rightBottomNodes);

				self.centerNoCnxNodes = nodesLayoutUtl.getUnconnectedNodes(self.centerNodes);
				self.leftNoCnxNodes = nodesLayoutUtl.getUnconnectedNodes(self.leftTopNodes);
				self.rightNoCnxNodes = nodesLayoutUtl.getUnconnectedNodes(self.rightBottomNodes);

				self.centerNodes = Utils.subtractArrays(self.centerNodes, self.centerNoCnxNodes);

				self.startNodesCenterTargets = self.collectStartNodesCenterTargets(self.centerNodes);
				self.startNodesLeftTargets = self.collectStartNodesSideTargets(graphConstants.flowType().LEFT_TOP);
				self.startNodesRightTargets = self.collectStartNodesSideTargets(graphConstants.flowType().RIGHT_BOTTOM);

				self.centerNoInputNodes = nodesLayoutUtl.getNodesWithNoInputs(self.centerNodes);
				self.leftNoInputNodes = nodesLayoutUtl.getNodesNoInputsWithOutputs(self.leftTopNodes);
				self.rightNoInputNodes = nodesLayoutUtl.getNodesNoInputsWithOutputs(self.rightBottomNodes);

				var standaloneNodes = self.getStandaloneNodes(self.centerNodes);
				if (standaloneNodes.length > 0) {
					var standaloneGroups = self.getStandaloneGroups(standaloneNodes);
					self.groupsRootNodes = self.getCommonGroupsRoots(standaloneGroups);
				}
			};

			self.getFirstLevelCandidates = function() {
				var candidates = [];
				candidates = candidates.concat(self.startNodesCenterTargets);
				candidates = candidates.concat(self.startNodesLeftTargets);
				candidates = candidates.concat(self.startNodesRightTargets);
				candidates = Utils.mergeArrays(candidates, self.centerNoInputNodes);
				candidates = Utils.mergeArrays(candidates, self.leftNoInputNodes);
				candidates = Utils.mergeArrays(candidates, self.rightNoInputNodes);
				if (candidates.length === 0 && self.centerNodes.length > 0) {
					candidates.push(self.centerNodes[0]);
				}
				candidates = Utils.mergeArrays(candidates, self.groupsRootNodes);
				//candidates = self.getNodesWithoutUpwardConnections(candidates);
				return candidates;
			};


			self.getConnectedSources = function(fromNodes, toNodes) {
				var nodes = [];
				for (var i = 0; i < fromNodes.length; i++) {
					var fromNode = fromNodes[i];
					var targetNodes = nodesLayoutUtl.getTargetNodesOfNode(fromNode);
					for (var j = 0; j < targetNodes.length; j++) {
						if (toNodes.indexOf(targetNodes[j]) >= 0 && nodes.indexOf(fromNode) < 0) {
							nodes.push(fromNode);
						}
					}
				}
				return nodes;
			};

			self.collectStartNodesCenterTargets = function(centerNodes) {
				var nodes = [];
				var allStartNodes = nodesLayoutUtl.getStartNodes(self.allNodes);
				for (var i = 0; i < allStartNodes.length; i++) {
					var targetNodes = nodesLayoutUtl.getTargetNodesOfNode(allStartNodes[i]);
					for (var j = 0; j < targetNodes.length; j++) {
						var targetNode = targetNodes[j];
						if (centerNodes.indexOf(targetNode) >= 0 && nodes.indexOf(targetNode) < 0) {
							nodes.push(targetNode);
						}
					}
				}
				return nodes;
			};

			self.collectStartNodesSideTargets = function(flowType) {
				var nodes = [];
				var allStartNodes = nodesLayoutUtl.getStartNodes(self.allNodes);
				for (var i = 0; i < allStartNodes.length; i++) {
					var targetNodes = nodesLayoutUtl.getTargetNodesOfNode(allStartNodes[i]);
					for (var j = 0; j < targetNodes.length; j++) {
						var targetNode = targetNodes[j];
						if (targetNode.getFlowType() === flowType) {
							nodes.push(targetNode);
						}
					}
				}
				return nodes;
			};

			// TODO: exclude nodes with upward connections ????
			self.getNodesWithoutUpwardConnections = function(group) {
				var newGroup = [];
				for (var i = 0; i < group.length; i++) {
					var node = group[i], found = false;
					for (var j = 0; j < group.length; j++) {
						if (i === j) {
							continue;
						}
						var groupNode = group[j];
						if (nodesLayoutUtl.hasFlowConnectionFromTo(groupNode, node) &&
								!nodesLayoutUtl.hasFlowConnectionFromTo(node, groupNode)) { // added lately, not tested
							found = true;
							break;
						}
					}
					if (!found) {
						newGroup.push(node);
					}
				}
				return newGroup;
			};

			self.getStandaloneNodes = function(centerNodes) {
				var standaloneNodes = [], sourceNodes = [];
				sourceNodes = sourceNodes.concat(self.startNodes);
				sourceNodes = sourceNodes.concat(self.startNodesCenterTargets);
				// use all nodes is ok
				sourceNodes = sourceNodes.concat(self.leftTopNodes);
				sourceNodes = sourceNodes.concat(self.rightBottomNodes);

				for (var i = 0; i < centerNodes.length; i++) {
					var centerNode = centerNodes[i];
					var found = false;
					for (var j = 0; j < sourceNodes.length; j++) {
						if (nodesLayoutUtl.areNodesInSameTree(sourceNodes[j], centerNode)) {
							found = true;
							break;
						}
					}
					if (!found) {
						standaloneNodes.push(centerNode);
					}
				}
				return standaloneNodes;
			};

			self.getStandaloneGroups = function(nodes) {
				var groups = [];
				for (var i = 0; i < nodes.length; i++) {
					var first = nodes[i];
					var group = [];
					group.push(first);
					for (var j = 0; j < nodes.length; j++) {
						if (i === j) {
							continue;
						}
						var next = nodes[j];
						if (nodesLayoutUtl.areNodesInSameTree(first, next) && group.indexOf(next) < 0) {
							group.push(next);
						}
					}
					groups.push(group);
				}
				return groups;
			};

			self.getCommonGroupsRoots = function(commonGroups) {
				var allRoots = [];
				for (var i = 0; i < commonGroups.length; i++) {
					var group = commonGroups[i];
					if (group.length > 0) {
						var roots = [];
						var noInputNodes = nodesLayoutUtl.getNodesWithNoInputs(group);
						if (noInputNodes.length > 0) {
							roots = roots.concat(noInputNodes);
						}
						for (var j = 0; j < group.length; j++) {
							var node = group[j];
							if (roots.indexOf(node) < 0 && !nodesLayoutUtl.isNodeInSameNodesTree(node, roots)) {
								roots.push(node);
							}
						}
						if (roots.length === 0) {
							roots.push(group[0]);
						}
						allRoots = allRoots.concat(roots);
					}
				}
				return allRoots;
			};

			self.getContentString = function(title, nodes) {
				var sb = "";
				sb += (title+": ");
				for (var i = 0; i < nodes.length; i++) {
					if (i > 0) {
						sb += (", ");
					}
					sb += (nodes[i].getName());
				}
				sb += ("\n");
				return sb;
			};

			self.print = function() {
				var sb = [];
				sb.push("== NODES COLLECTOR:\n");
				sb.push(getContentString("TOTAL", self.allNodes));

				sb.push(getContentString("- startNodes", self.startNodes));
				sb.push(getContentString("- startNodesCenterTargets", self.startNodesCenterTargets));
				sb.push(getContentString("- startNodesLeftTargets", self.startNodesLeftTargets));
				sb.push(getContentString("- startNodesRightTargets", self.startNodesRightTargets));
				sb.push(getContentString("- endNodes", self.endNodes));

				sb.push(getContentString("- leftTopNodes", self.leftTopNodes));
				sb.push(getContentString("- rightBottomNodes", self.rightBottomNodes));
				sb.push(getContentString("- centerNodes", self.centerNodes));
				sb.push(getContentString("- centerNoInputNodes", self.centerNoInputNodes));
				sb.push(getContentString("- centerNoCnxNodes", self.centerNoCnxNodes));
				sb.push(getContentString("- leftNoInputNodes", self.leftNoInputNodes));
				sb.push(getContentString("- leftNoCnxNodes", self.leftNoCnxNodes));
				sb.push(getContentString("- rightNoInputNodes", self.rightNoInputNodes));
				sb.push(getContentString("- rightNoCnxNodes", self.rightNoCnxNodes));
				sb.push(getContentString("- groupRootsNodes", self.groupsRootNodes));

				return sb.toString();
			};

		}
		return NodesCollector;
	}
);
