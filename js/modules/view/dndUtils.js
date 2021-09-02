define(
	['modules/view/dndUtils',
		'modules/diagram/flowNode',
		'modules/diagram/flowSwitch',
		'modules/graph/segment',
		'modules/geometry/point',
		'modules/geometry/rectangle',
		//'modules/diagram/decisionNode',
		'modules/graph/edgeCorner',
		//'modules/flow/flowUtils',
		'modules/settings/config',
		'modules/graph/graphConstants'],
	function(diagramUtils,
			 FlowNode,
			 FlowSwitch,
			 Segment,
			 Point,
			 Rectangle,
			 EdgeCorner,
			 //flowUtils,
	         config,
	         constants) {

		return {
			getNodeFootprint: function(node, flowManager) {
				var newNode;
				if (node.getFlowType() === constants.flowType().SWITCH) {
					newNode = new FlowSwitch(node.getName(), flowManager);
				} else {
					newNode = new FlowNode(node.getName(), node.getFlowType(), flowManager);
				}
				newNode.x = node.x;
				newNode.y = node.y;
				newNode.width = node.width;
				newNode.height = node.height;
				newNode.levelNum = node.getLevelNumber();
				newNode.laneNum = node.getLaneNumber();
				if (node.getFlowType() === constants.flowType().SWITCH) {
					newNode.setSwitchInitialSize(node.width, node.height);
				}
				return newNode;
			},
			// exclude expanded container
			getNodeAtPoint: function(nodes, point) {
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].isVisible() && nodes[i].containsPoint(point)) {
						return nodes[i];
					}
				}
				return undefined;
			},
			getContainerAtPoint: function(nodes, point) {
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].getFlowType() === constants.flowType().CONTAINER && nodes[i].containsPoint(point)) {
						return nodes[i];
					}
				}
				return undefined;
			},
			//getNodesInScope: function(originNode, modelHandler) {
			//	var flowNodes = modelHandler.getFlowNodes(),
			//		nodes = [];
			//	if (originNode.getContainerName()) {
			//		var container = flowUtils.getNodeByName(
			//			modelHandler.getFlowModel(), originNode.getContainerName());
			//		// check for existence just in case
			//		nodes = container ? container.getContentNodes() : flowNodes;
			//	} else {
			//		// highest scope
			//		flowNodes.forEach(function(node) {
			//			if (node.getName() !== originNode.getName() && !node.getContainerName()) {
			//				nodes.push(node);
			//			}
			//		});
			//	}
			//	return nodes;
			//},
			getSegmentsCommonPoint: function(sgm1, sgm2) {
				if (sgm1.getStartPoint().equals(sgm2.getEndPoint())) {
					return sgm1.getStartPoint();
				} else if (sgm2.getStartPoint().equals(sgm1.getEndPoint())) {
					return sgm2.getStartPoint();
				} else {
					return undefined;
				}
			},
			getXCorner: function(sgm1, sgm2) {
				if (sgm1.getStartPoint().equals(sgm2.getEndPoint())) {
					return new EdgeCorner(sgm1.getStartPoint(), sgm2, sgm1);
				} else if (sgm2.getStartPoint().equals(sgm1.getEndPoint())) {
					return new EdgeCorner(sgm2.getStartPoint(), sgm1, sgm2);
				} else {
					return undefined;
				}
			},
			getPortAtPoint: function(nodes, point) {
				for (var i = 0; i < nodes.length; i++) {
					//if (nodes[i].isVisible() && nodes[i].containsPoint(point)) {
					if (nodes[i].isVisible() || nodes[i].getFlowType() === constants.flowType().CONTAINER) {
						//console.log("### node at point: "+nodes[i].getName());
						var allPorts = nodes[i].getAllPorts();
						for (var j = 0; j < allPorts.length; j++) {
							var port = allPorts[j];
							if (port.getType() === constants.portType().LINK_CNX && port.containsPoint(point)) {
								return port;
							}
							if (port.getType() === constants.portType().LINK_REF && port.containsPoint(point)) {
								return port;
							}
							if (port.getType() === constants.portType().MARKUP && port.hasPoint(point)) {
								return port;
							}
							if (port.getType() === constants.portType().REF && port.hasPoint(point)) {
								return port;
							}
						}
					}
				}
				return undefined;
			},
			isPointInPipeCrossing: function(point, crossings) {
				for (var i = 0; i < crossings.length; i++) {
					if (crossings[i].hasPointInside(point)) {
						return true;
					}
				}
				return false;
			},
			getPipeCrossingForPoint: function(point, crossings) {
				for (var i = 0; i < crossings.length; i++) {
					if (crossings[i].hasPointInside(point)) {
						return crossings[i];
					}
				}
				return undefined;
			},
			getLinkAtPoint: function(links, point) {
				for (var i = 0; i < links.length; i++) {
					if (links[i].isVisible() && links[i].containsPoint(point)) {
						return links[i];
					}
				}
				return undefined;
			},
			//getRectangleAtPoint: function(point, rects) {
			//	console.log("&&& dndUtils");
			//	for (var i = 0; i < rects.length; i++) {
			//		if (rects[i].hasPointInside(point)) {
			//			return rects[i];
			//		}
			//	}
			//	return undefined;
			//},
			getRectangleIndexAtPoint: function(point, rects) {
				for (var i = 0; i < rects.length; i++) {
					if (rects[i].hasPointInside(point)) {
						return i;
					}
				}
				return -1;
			},
			getRectangleIndex: function(rect, rects) {
				for (var i = 0; i < rects.length; i++) {
					if (rects[i].equals(rect)) {
						return i;
					}
				}
				return -1;
			},
			getPipesCrossingsExcludePoint: function(flowLayout, point) {
				var rects = [],
					xings = flowLayout.getPipesCrossings();
				for (var i = 0; i < xings.length; i++) {
					if (!xings[i].containsXY(point.x, point.y)) {
						rects.push(xings[i]);
					}
				}
				return rects;
			}

		}
	}
);
