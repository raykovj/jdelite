define('modules/view/dndTracker',
	['modules/geometry/point',
		'modules/graph/graphConstants',
		'modules/settings/config',
		'modules/view/dndUtils',
		'modules/diagram/diagramUtils',
		'modules/flow/flowUtils'],
	function(Point,
	         constants,
	         config,
			 dndUtils,
	         diagramUtils,
			 flowUtils) {

		function DnDTracker(flowManager) {

			var self = this;
			var _manager = flowManager,
				_dragMode = constants.dragMode().NONE,
				_galleryIcon = undefined;

			self.setDragMode = function(mode) {
				_dragMode = mode;
			};
			self.getDragMode = function() {
				return _dragMode;
			};

			self.setGalleryIcon = function(icon) {
				_galleryIcon = icon;
			};
			self.getGalleryIcon = function() {
				return _galleryIcon;
			};

			self.clearTracking = function() {
				_dragMode = constants.dragMode().NONE;
				self.resetNodesDNDFlags();
			};

			self.getAcceptingPipes = function(link, dragSegment, sgmStartPoint, sgmEndPoint, segmentPipe) {
				var i, accPipes = [],
					minLevelPipeNumber = flowUtils.getMinLevelPipeNumber(),
					maxLevelPipeNumber = flowUtils.getMaxLevelPipeNumber(_manager.getFlowLayout()),
					minLanePipeNumber = flowUtils.getMinLanePipeNumber(),
					maxLanePipeNumber = flowUtils.getMaxLanePipeNumber(_manager.getFlowLayout());

				if (segmentPipe.getType() === constants.pipeType().LEVEL_PIPE) {
					var levelPipes = _manager.getFlowLayout().getLevelPipes();
					for (i = minLevelPipeNumber; i <= maxLevelPipeNumber; i++) {
						if (self.isSegmentDropOnPipeAllowed(link, dragSegment, sgmStartPoint, sgmEndPoint, segmentPipe, levelPipes[i])) {
							accPipes.push(levelPipes[i]);
						}
					}
				} else if (segmentPipe.getType() === constants.pipeType().LANE_PIPE) {
					var lanePipes = _manager.getFlowLayout().getLanePipes();
					for (i = minLanePipeNumber; i <= maxLanePipeNumber; i++) {
						if (self.isSegmentDropOnPipeAllowed(link, dragSegment, sgmStartPoint, sgmEndPoint, segmentPipe, lanePipes[i])) {
							accPipes.push(lanePipes[i]);
						}
					}
				}
				return accPipes;
			};

			///////////////////////

			self.isSegmentDropOnPipeAllowed = function(link, dragSegment, sgmStartPoint, sgmEndPoint, segmentPipe, pipeToDrop) {
				var levels = _manager.getFlowLayout().getLevels(),
					lanes = _manager.getFlowLayout().getLanes(),
					levelPipes = _manager.getFlowLayout().getLevelPipes(),
					lanePipes = _manager.getFlowLayout().getLanePipes(),
					startLevelIdx, endLevelIdx,minLevelIdx, maxLevelIdx,
					startLaneIdx, endLaneIdx, minLaneIdx, maxLaneIdx,
					startLevelPipeIdx, endLevelPipeIdx,minLevelPipeIdx, maxLevelPipeIdx,
					startLanePipeIdx, endLanePipeIdx, minLanePipeIdx, maxLanePipeIdx,
					i, j;
				if (segmentPipe.getType() === constants.pipeType().LEVEL_PIPE) {

					startLevelPipeIdx = segmentPipe.getOrder();
					endLevelPipeIdx = pipeToDrop.getOrder();
					minLevelIdx = Math.min(startLevelPipeIdx, endLevelPipeIdx);
					maxLevelIdx = Math.max(startLevelPipeIdx, endLevelPipeIdx);
					if (startLevelPipeIdx > endLevelPipeIdx) {
						maxLevelIdx -= 1;
					}
					// check the case when one or both segment ends are at side anchor points,
					// then the adjacent segments will lay through level(s)
					startLaneIdx = flowUtils.getLaneIndexAtPoint(sgmStartPoint, lanes);
					endLaneIdx = flowUtils.getLaneIndexAtPoint(sgmEndPoint, lanes);
					for (i = minLevelIdx; i <= maxLevelIdx; i++) {
						if (startLaneIdx >= 0 && levels[i].getCellAtLane(startLaneIdx) ||
							endLaneIdx >= 0 && levels[i].getCellAtLane(endLaneIdx)) {
							return false;
						}
					}
					// check if segment would intersect a container
					if (startLaneIdx === -1) {
						startLaneIdx = flowUtils.getLanePipeIndexAtPoint(sgmStartPoint, lanePipes);
					}
					if (endLaneIdx === -1) {
						endLaneIdx = flowUtils.getLanePipeIndexAtPoint(sgmEndPoint, lanePipes);
					}
					minLaneIdx = Math.min(startLaneIdx, endLaneIdx);
					maxLaneIdx = Math.max(startLaneIdx, endLaneIdx);

					for (j = minLaneIdx; j <= maxLaneIdx; j++) {
						if (lanes[j].hasContainerIntersectionInRange(_manager, minLevelIdx, maxLevelIdx)) {
							return false;
						}
					}

				} else if (segmentPipe.getType() === constants.pipeType().LANE_PIPE) {

					startLanePipeIdx = segmentPipe.getOrder();
					endLanePipeIdx = pipeToDrop.getOrder();
					minLaneIdx = Math.min(startLanePipeIdx, endLanePipeIdx);
					maxLaneIdx = Math.max(startLanePipeIdx, endLanePipeIdx);
					if (startLanePipeIdx > endLanePipeIdx) {
						maxLaneIdx -= 1;
					}
					// check the case when one or both segment ends are at side anchor points,
					// then the adjacent segments will lay through level(s)
					startLevelIdx = flowUtils.getLevelIndexAtPoint(sgmStartPoint, levels);
					endLevelIdx = flowUtils.getLevelIndexAtPoint(sgmEndPoint, levels);
					for (i = minLaneIdx; i <= maxLaneIdx; i++) {
						if (startLevelIdx >= 0 && lanes[i].getCellAtLevel(startLevelIdx) ||
							endLevelIdx >= 0 && lanes[i].getCellAtLevel(endLevelIdx)) {
							return false;
						}
					}
					// check if segment would intersect a container
					if (startLevelIdx === -1) {
						startLevelIdx = flowUtils.getLevelPipeIndexAtPoint(sgmStartPoint, levelPipes);
					}
					if (endLevelIdx === -1) {
						endLevelIdx = flowUtils.getLevelPipeIndexAtPoint(sgmEndPoint, levelPipes);
					}
					minLevelIdx = Math.min(startLevelIdx, endLevelIdx);
					maxLevelIdx = Math.max(startLevelIdx, endLevelIdx);

					for (j = minLevelIdx; j <= maxLevelIdx; j++) {
						if (levels[j].hasContainerIntersectionInRange(_manager, minLaneIdx, maxLaneIdx)) {
							return false;
						}
					}

				}
				// exclude some pipes
				var segments = link.getSegments();
				for (i = 0; i < segments.length; i++) {
					if (segments[i].getOrder() === dragSegment.getOrder()) {
						continue;
					}
					if (segments[i].getType() === constants.segmentType().IN_PIPE) {
						if (segments[i].getPipe().equals(pipeToDrop)) {
							return false;
						}
						// exclude loops
						if (segments[i].getPipe().getType() === segmentPipe.getType() ) {
							if (pipeToDrop.getOrder() > segmentPipe.getOrder() &&
								segments[i].getPipe().getOrder() > segmentPipe.getOrder() &&
								pipeToDrop.getOrder() > segments[i].getPipe().getOrder()) {
								return false;
							}
							if (pipeToDrop.getOrder() < segmentPipe.getOrder() &&
								segments[i].getPipe().getOrder() < segmentPipe.getOrder() &&
								pipeToDrop.getOrder() < segments[i].getPipe().getOrder()) {
								return false;
							}
						}
					}
				}
				// so far ok
				return true;
			};


			///////////////////////

			self.setAcceptedDestinations = function(originPort, draggedPoint) {
				var originNode = originPort.getNode(),
					flowNodes = _manager.getModelHandler().getFlowNodes(),
					nodes = []; //dndUtils.getNodesInScope(originNode, _manager.getModelHandler());
				if (originNode.getContainerName()) {
					var container = flowUtils.getNodeByName(
						_manager.getModelHandler().getFlowModel(), originNode.getContainerName());
					// check for existence just in case
					nodes = container ? container.getContentNodes() : flowNodes;
				} else {
					// highest scope
					flowNodes.forEach(function(node) {
						if (node.getHashName() !== originNode.getHashName() && !node.getContainerName()) {
							nodes.push(node);
						}
					});
				}

				for (var i = 0; i < nodes.length; i++) {
					nodes[i].hideRefPorts();
					if (nodes[i].equals(originNode)) {
						continue;
					}
					nodes[i].setDNDAcceptingPorts(originPort, draggedPoint);
				}
				return true;
			};

			self.resetNodesDNDFlags = function() {
				var nodes = _manager.getModelHandler().getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					nodes[i].resetDNDFlags();
				}
			};


			self.getAcceptingPortForPoint2 = function(originPort, dragPoint) {
				var originNode = originPort.getNode(),
					flowNodes = _manager.getModelHandler().getFlowNodes(),
					nodes = []; //dndUtils.getNodesInScope(originNode, _manager.getModelHandler());
				if (originNode.getContainerName()) {
					var container = flowUtils.getNodeByName(
						_manager.getModelHandler().getFlowModel(), originNode.getContainerName());
					// check for existence just in case
					nodes = container ? container.getContentNodes() : flowNodes;
				} else {
					// highest scope
					flowNodes.forEach(function(node) {
						if (node.getHashName() !== originNode.getHashName() && !node.getContainerName()) {
							nodes.push(node);
						}
					});
				}

				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].equals(originNode)) {
						continue;
					}
					var port = nodes[i].getAcceptingPortForPoint(originPort, dragPoint);
					if (port) {
						return port;
					}
				}
				return undefined;
			};

			self.getAcceptingPortForPoint3 = function(originPort, dragPoint, detachedPort) {
				if (detachedPort && detachedPort.getType() === constants.portType().LINK_CNX ?
						detachedPort.containsPoint(dragPoint) : detachedPort.containsPoint(dragPoint)) {
					return detachedPort;
				}
				return self.getAcceptingPortForPoint2(originPort, dragPoint);
			};

			self.canDropOnLink = function(itemId) {
				var flowType = itemId; //diagramUtils.getFlowTypeForGalleryId(itemId);
				return flowType === constants.flowType().PROCESS ||
					//flowType === constants.flowType().CONTAINER ||
					flowType === constants.flowType().DECISION ||
					flowType === constants.flowType().IN_OUT;
			};

			self.getDragOverTooltip = function(paletteId, levelPipe, lanePipe) {
				var flowType = paletteId, //diagramUtils.getFlowTypeForGalleryId(paletteId),
					retMsg = [],
					msg = " Drop at highlighted areas in ";
				if (flowType === constants.flowType().START) {
					msg += "start layer ";
				} else if (flowType === constants.flowType().END) {
					msg += "end layer ";
				} else if (flowType === constants.flowType().LEFT_TOP) {
					msg += config.getFlowDirection() === constants.flow().VERTICAL ?
						"left swim lane " : "top swim lane ";
				} else if (flowType === constants.flowType().RIGHT_BOTTOM) {
					msg += config.getFlowDirection() === constants.flow().VERTICAL ?
						"right swim lane " : "bottom swim lane ";
				} else  {
					msg += "main canvas ";
				}
				retMsg.push(msg);
				if (levelPipe) {
					retMsg.push(" Will insert a new layer on drop");
				}
				if (lanePipe) {
					retMsg.push(" Will insert a new lane on drop");
				}
				return retMsg;
			};

		}
		return DnDTracker;
	}
);