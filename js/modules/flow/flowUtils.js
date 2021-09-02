define('modules/flow/flowUtils',
	['modules/graph/graphConstants',
		'modules/settings/config'],
	function(constants,
			 config) {

		var	getRectangle4Point = function(point, rects) {
				//var factor = config.getScale();
				for (var i = 0; i < rects.length; i++) {
					if (rects[i].hasPointInside(point)) {
					//if (rects[i].containsXY(point.x*factor, point.y*factor)) {
						return rects[i];
					}
				}
				return undefined;
			},
			getRectangleIndex4Point = function(point, rects) {
				//var factor = config.getScale();
				for (var i = 0; i < rects.length; i++) {
					if (rects[i].hasPointInside(point)) {
					//if (rects[i].containsXY(point.x*factor, point.y*factor)) {
						return i;
					}
				}
				return -1;
			},
			getRectangleIndex4ScalePoint = function(point, rects) {
				var factor = config.getScale();
				for (var i = 0; i < rects.length; i++) {
					if (rects[i].containsXY(point.x*factor, point.y*factor)) {
						return i;
					}
				}
				return -1;
			},
			moveContainersContent = function(container, flowModel, levelNum, laneNum) {
				var contentNodes = container.getContentNodes();
				for (var i = 0; i < contentNodes.length; i++) {
					flowModel.moveNodeObject(contentNodes[i].getNodeObject(), levelNum, laneNum);
					if (contentNodes[i].getFlowType() === constants.flowType().CONTAINER ||
						contentNodes[i][i].getFlowType() === constants.flowType().SWITCH) {
						moveContainersContent(contentNodes[i], flowModel, levelNum, laneNum);
					}
				}
			},
			collapseInnerContainers = function(container) {
				var contentNodes = container.getContentNodes();
				for (var i = 0; i < contentNodes.length; i++) {
					if (contentNodes[i].getFlowType() === constants.flowType().CONTAINER) {
						contentNodes[i].setExpanded(false);
						collapseInnerContainers(contentNodes[i]);
					}
				}
			},
			getInnermostContainer = function(container, point) {
				var nodes = container.getContentNodes();
				for (var i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded() &&
						nodes[i].containsPoint(point)) {
						return getInnermostContainer(nodes[i], point);
					}
				}
				return container;
			},
			getInsideNode = function(nodes, point) {
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].getFlowType() === constants.flowType().CONTAINER
						&&
						nodes[i].isExpanded() &&
						nodes[i].containsPoint(point)) {
						return getInsideNode(nodes[i].getContentNodes(), point);
					} else if (nodes[i].isVisible() && nodes[i].containsPoint(point)) {
						return nodes[i];
					}
				}
				return undefined;
			},
			getNodeInsideContainer = function(container, point) {
				var nodes = container.getContentNodes();
				for (var i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded() &&
						nodes[i].containsPoint(point)) {
						return getNodeInsideContainer(nodes[i], point);
					} else if (nodes[i].isVisible() && nodes[i].containsPoint(point)) {
						return nodes[i];
					}
				}
				return container;
			},
			getLinkInsideContainer = function(container, point) {
				var links = container.getContentLinks();
				for (var i = 0; i < links.length; i++) {
					if (links[i].containsPoint(point)) {
						return links[i];
					}
				}
				var nodes = container.getContentNodes();
				for (i = 0; i < nodes.length; i++) {
					if (nodes[i].getFlowType() === constants.flowType().CONTAINER &&
						nodes[i].isExpanded() &&
						nodes[i].containsPoint(point)) {
						return getLinkInsideContainer(nodes[i], point);
					}
				}
				return undefined;
			},
			// true if cell outside start level or allowed on start level
			isCellInContainerAndAccessible = function(container, cell, startLevelAccepted) {
				//console.log("** c.name="+container.getName()+", cell="+cell.getLevelNumber()+","+cell.getLaneNumber()+", allowed="+startLevelAccepted);
				if (cell.getLevelNumber() === container.getStartLevelNumber() &&
					cell.getLaneNumber() >= container.getStartLaneNumber() &&
					cell.getLaneNumber() <= container.getEndLaneNumber() &&
					startLevelAccepted) {
					return true;
				}
				return cell.getLevelNumber() >= container.getStartLevelNumber()+1 &&
					cell.getLevelNumber() <= container.getEndLevelNumber() &&
					cell.getLaneNumber() >= container.getStartLaneNumber() &&
					cell.getLaneNumber() <= container.getEndLaneNumber();
			},
			// node cell is where the collapsed container is
			isContainerNodeCellAccessible = function(container, cell, startLevelAccepted) {
				if (cell.getLevelNumber() === container.getStartLevelNumber() &&
					cell.getLaneNumber() >= container.getStartLaneNumber() &&
					cell.getLaneNumber() <= container.getEndLaneNumber()) {
					return startLevelAccepted;
				}
				return false;
			},
			// cell is known to be in this container
			isContainerCellAccessible = function(container, cell, startLevelAccepted) {
				if (cell.getLevelNumber() === container.getStartLevelNumber()) {
					if (cell.getLaneNumber() === container.getLaneNumber()) {
						return false;
					} else return startLevelAccepted;
				} else { return true; }
			},
			// true if cell is at least in one of the containers
			isCellInAnyContainer = function(cell, containers) {
				for (var i = 0; i < containers.length; i++) {
					if (cell.getLevelNumber() >= containers[i].getStartLevelNumber() &&
						cell.getLevelNumber() <= containers[i].getEndLevelNumber() &&
						cell.getLaneNumber() >= containers[i].getStartLaneNumber() &&
						cell.getLaneNumber() <= containers[i].getEndLaneNumber()) {
						return true;
					}
				}
				return false;
			},
			getTopCellsOutsideAnyContainers = function(nodes, cells) {
				var outsiders = [],
					containers = [], i;
				for (i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						!nodes[i].getContainerReference() &&
						nodes[i].isExpanded()) {
						containers.push(nodes[i]);
					}
				}
				for (i = 0; i < cells.length; i++) {
					if (!isCellInAnyContainer(cells[i], containers)) {
						outsiders.push(cells[i]);
					}
				}
				return outsiders;
			},
			findCell = function(cell, cells) {
				for (var i = 0; i < cells.length; i++) {
					if (cell.equals(cells[i])) {
						return true;
					}
				}
				return false;
			},
			isCellInContainer = function(cell, container) {
				return 	cell.getLevelNumber() >= container.getStartLevelNumber() &&
						cell.getLevelNumber() <= container.getEndLevelNumber() &&
						cell.getLaneNumber() >= container.getStartLaneNumber() &&
						cell.getLaneNumber() <= container.getEndLaneNumber();
			},
			isCellAllowedForDrop = function(cell, nodes, startLevelAccepted) {
				var containers = [], i;
				for (i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded()) {
						containers.push(nodes[i]);
					}
				}
				// ??

			},
			getContainmentDepth = function(node) {
				var cNum = 0,
					container = node.getContainerReference();
				if (container) {
					cNum = 1;
					cNum += getContainmentDepth(container);
				}
				return cNum;
			},
			getMaxNestedContainersNumberAtLevel = function(levelIdx, nodes) {
				var xNum = 0,
					containers = [], i;
				for (i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded()) {
						containers.push(nodes[i]);
					}
				}
				for (i = 0; i < containers.length; i++) {
					if (levelIdx >= containers[i].getStartLevelNumber() &&
						levelIdx <= containers[i].getEndLevelNumber() ) {
						if (xNum === 0)  xNum++;
						var n = getMaxNestedContainersNumberAtLevel(levelIdx, containers[i].getContentNodes());
						xNum = Math.max(xNum, n+1);
					}
				}
				return xNum;
			},
			getMaxNestedContainersNumberAtLane = function(laneIdx, nodes) {
				var xNum = 0,
					containers = [], i;
				for (i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded()) {
						containers.push(nodes[i]);
					}
				}
				for (i = 0; i < containers.length; i++) {
					if (laneIdx >= containers[i].getStartLaneNumber() &&
						laneIdx <= containers[i].getEndLaneNumber() ) {
						if (xNum === 0)  xNum++;
						var n = getMaxNestedContainersNumberAtLane(laneIdx, containers[i].getContentNodes());
						xNum = Math.max(xNum, n+1);
					}
				}
				return xNum;
			},
			getRecursiveContainerContent = function(container) {
				var content = [],
					nodes = container.getContentNodes();
				for (var i = 0; i < nodes.length; i++) {
					content.push(nodes[i]);
					if (nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH) {
						content = content.concat(getRecursiveContainerContent(nodes[i]));
					}
				}
				return content;
			},
			getAllExpandedContainers = function(nodes, allContainers) {
				var containers = [], i;
				for (i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						 nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded()) {
						containers.push(nodes[i]);
						allContainers.push(nodes[i]);
					}
				}
				for (i = 0; i < containers.length; i++) {
					getAllExpandedContainers(containers[i].getContentNodes, allContainers);
				}
			},
			getExpandedSiblingContainerObjects = function(flowModel, containerObj) {
				var nodeObjects = flowModel.getNodeObjects(),
					siblings = [];
				for (var i = 0; i < nodeObjects.length; i++) {
					if (nodeObjects[i].name === containerObj.name) {
						continue;
					}
					if ((nodeObjects[i].type === constants.flowType().CONTAINER ||
						nodeObjects[i].type === constants.flowType().SWITCH)
						&&
						nodeObjects[i].expanded === true &&
						(!nodeObjects[i].containerName && !containerObj.containerName ||
							nodeObjects[i].containerName === containerObj.containerName)
					) {
						siblings.push(nodeObjects[i]);
					}
				}
				return siblings;
			};


		return {
			getMinLevelNumber: function() {
				return config.hasStartEndLevels() ? 1 : 0;
			},
			getMinLevel: function(flowLayout) {
				var levels = flowLayout.getLevels(),
					minLevelNum = config.hasStartEndLevels() ? 1 : 0;
				return levels[minLevelNum];
			},
			getMaxLevelNumber: function(flowLayout) {
				var levelNum = flowLayout.getLevels().length;
				return config.hasStartEndLevels() ? levelNum-2 : levelNum-1;
			},
			getTotalMaxLevelNumber: function(flowLayout) {
				var levelNum = flowLayout.getLevels().length;
				return levelNum-1;
			},
			getMaxLevel: function(flowLayout) {
				var levels = flowLayout.getLevels(),
					levelNum = flowLayout.getLevels().length,
					maxLevelNum = config.hasStartEndLevels() ? levelNum-2 : levelNum-1;
				return levels[maxLevelNum];
			},
			getMinLevelPipeNumber: function() {
				return config.hasStartEndLevels() ? 1 : 0;
			},
			getMaxLevelPipeNumber: function(flowLayout) {
				var levelNum = flowLayout.getLevelPipes().length;
				return config.hasStartEndLevels() ? levelNum-2 : levelNum-1;
			},

			getMinLaneNumber: function() {
				return config.hasSideSwimLanes() ? 1 : 0;
			},
			getMinLane: function(flowLayout) {
				var lanes = flowLayout.getLanes(),
					minLaneNum = config.hasSideSwimLanes() ? 1 : 0;
				return lanes[minLaneNum];
			},
			getMaxLaneNumber: function(flowLayout) {
				var laneNum = flowLayout.getLanes().length;
				return config.hasSideSwimLanes() ? laneNum-2 : laneNum-1;
			},
			getTotalMaxLaneNumber: function(flowLayout) {
				var laneNum = flowLayout.getLanes().length;
				return laneNum-1;
			},
			getMaxLane: function(flowLayout) {
				var lanes = flowLayout.getLanes(),
					laneNum = flowLayout.getLanes().length,
					maxLaneNum = config.hasSideSwimLanes() ? laneNum-2 : laneNum-1;
				return lanes[maxLaneNum];
			},
			getMinLanePipeNumber: function() {
				return config.hasSideSwimLanes() ? 1 : 0;
			},
			getMaxLanePipeNumber: function(flowLayout) {
				var laneNum = flowLayout.getLanePipes().length;
				return config.hasSideSwimLanes() ? laneNum-2 : laneNum-1;
			},
			// ???
			getContentLevelsNumber: function(jsonContent) {
				var num = 0, min = Number.MAX_VALUE, max = 0,
					nodes = jsonContent.nodes;
				for (var i = 0; i < nodes.length; i++) {

					num = Math.max(num, nodes[i].levelNum);
				}
				return num;
			},
			// ???
			getContentLanesNumber: function(jsonContent) {
				var num = 0,
					nodes = jsonContent.nodes;
				for (var i = 0; i < nodes.length; i++) {
					num = Math.max(num, nodes[i].laneNum);
				}
				return num+1;
			},
			// use JSON content from file ??? not tested
			getCanvasLevelsNumber: function(jsonContent) {
				var nodes = jsonContent.nodes,
					min = Number.MAX_VALUE,
					max = 0;
				for (var i = 0; i < nodes.length; i++) {
					var node = nodes[i];
					if (node.type === constants.flowType().START ||
						node.type === constants.flowType().END) {
						continue;
					}
					min = Math.min(node.levelNum, min);
					max = Math.max(node.levelNum, max);
				}
				min = min < Number.MAX_VALUE ? min : 0;
				return max - min + config.hasStartEndLevels() ? 0 : 1;
			},
			getTotalCanvasLevels: function(jsonContent) {
				var nodes = jsonContent.nodes,
					max = 0;
				for (var i = 0; i < nodes.length; i++) {
					var node = nodes[i];
					if (node.type === constants.flowType().START ||
						node.type === constants.flowType().END) {
						continue;
					}
					max = Math.max(node.levelNum, max);
				}
				max += config.hasStartEndLevels() ? 0 : 1;
				return max;
			},
			// use JSON content from file ??? not tested
			getCanvasLanesNumber: function(jsonContent) {
				var nodes = jsonContent.nodes,
					min = Number.MAX_VALUE,
					max = 0;
				for (var i = 0; i < nodes.length; i++) {
					var node = nodes[i];
					if (node.type === constants.flowType().LEFT_TOP ||
						node.type === constants.flowType().RIGHT_BOTTOM) {
						continue;
					}
					min = Math.min(node.laneNum, min);
					max = Math.max(node.laneNum, max);
				}
				min = min < Number.MAX_VALUE ? min : 0;
				return max - min + config.hasSideSwimLanes() ? 0 : 1;
			},
			getTotalCanvasLanes: function(jsonContent) {
				var nodes = jsonContent.nodes,
					max = 0;
				for (var i = 0; i < nodes.length; i++) {
					var node = nodes[i];
					if (node.type === constants.flowType().LEFT_TOP ||
						node.type === constants.flowType().RIGHT_BOTTOM) {
						continue;
					}
					max = Math.max(node.laneNum, max);
				}
				max += config.hasSideSwimLanes() ? 0 : 1;
				return max;
			},
			decrementStringValue: function(strValue) {
				var intValue = parseInt(strValue);
				return (--intValue).toString();
			},
			incrementStringValue: function(strValue) {
				var intValue = parseInt(strValue);
				return (++intValue).toString();
			},
			getRectangleAtPoint: function(point, rects) {
				return getRectangle4Point(point, rects);
			},
			getLevelAtPoint: function(point, levels) {
				return getRectangle4Point(point, levels);
			},
			getLevelIndexAtPoint: function(point, levels) {
				return getRectangleIndex4Point(point, levels);
			},
			getLevelPipeAtPoint: function(point, levelPipes) {
				return getRectangle4Point(point, levelPipes);
			},
			getLevelPipeIndexAtPoint: function(point, levelPipes) {
				return getRectangleIndex4Point(point, levelPipes);
			},
			getLaneAtPoint: function(point, lanes) {
				return getRectangle4Point(point, lanes);
			},
			getLaneIndexAtPoint: function(point, lanes) {
				return getRectangleIndex4Point(point, lanes);
			},
			getLanePipeAtPoint: function(point, lanePipes) {
				return getRectangle4Point(point, lanePipes);
			},
			getLanePipeIndexAtPoint: function(point, lanePipes) {
				return getRectangleIndex4Point(point, lanePipes);
			},
			////
			// rect is the container expanded outline or the union of intersecting expanded outlines
			getRectSidesToGridLocation: function(rect, flowLayout) {
				if (!rect) { return undefined; }
				var sidesLocator = {},
					startCorner = rect.getLocation(),
					endCorner = rect.getOppositeLocation(),
					levels = flowLayout.getLevels(),
					lanes = flowLayout.getLanes();
				sidesLocator.startLevelIdx = getRectangleIndex4ScalePoint(startCorner, levels);
				sidesLocator.startLevelPipeIdx = sidesLocator.startLevelIdx;
				sidesLocator.endLevelIdx = getRectangleIndex4ScalePoint(endCorner, levels);
				sidesLocator.endLevelPipeIdx = sidesLocator.endLevelIdx+1;
				sidesLocator.startLaneIdx = getRectangleIndex4ScalePoint(startCorner, lanes);
				sidesLocator.startLanePipeIdx = sidesLocator.startLaneIdx;
				sidesLocator.endLaneIdx = getRectangleIndex4ScalePoint(endCorner, lanes);
				sidesLocator.endLanePipeIdx = sidesLocator.endLaneIdx+1;
				return sidesLocator;
			},
			isLevelPipeCrossingOutline: function(sidesLocator, levelPipeNum) {
				return levelPipeNum > sidesLocator.startLevelPipeIdx && levelPipeNum < sidesLocator.endLevelPipeIdx;
			},
			isLanePipeCrossingOutline: function(sidesLocator, lanePipeNum) {
				return lanePipeNum > sidesLocator.startLanePipeIdx && lanePipeNum < sidesLocator.endLanePipeIdx;
			},
			getNodeToRectPosition: function(node, rect, flowLayout, flowDir) {
				var nodeLevelIdx = node.getLevelNumber(),
					nodeLaneIdx = node.getLaneNumber(),
					startCorner = rect.getLocation(),
					endCorner = rect.getOppositeLocation(),
					levels = flowLayout.getLevels(),
					lanes = flowLayout.getLanes(),
					startLevelIdx = getRectangleIndex4ScalePoint(startCorner, levels),
					endLevelIdx = getRectangleIndex4ScalePoint(endCorner, levels),
					startLaneIdx = getRectangleIndex4ScalePoint(startCorner, lanes),
					endLaneIdx = getRectangleIndex4ScalePoint(endCorner, lanes);
				if (flowDir === constants.flow().VERTICAL) {
					if (nodeLevelIdx < startLevelIdx) {
						if (nodeLaneIdx < startLaneIdx) { return constants.orientation().NW; }
						else if (nodeLaneIdx > endLaneIdx) { return constants.orientation().NE; }
						else { return constants.orientation().N; }
					}
					else if (nodeLevelIdx > endLevelIdx) {
						if (nodeLaneIdx < startLaneIdx) { return constants.orientation().SW; }
						else if (nodeLaneIdx > endLaneIdx) { return constants.orientation().SE; }
						else { return constants.orientation().S; }
					}
					else {
						if (nodeLaneIdx < startLaneIdx) { return constants.orientation().W; }
						else if (nodeLaneIdx > endLaneIdx) { return constants.orientation().E; }
					}
				} else {
					if (nodeLevelIdx < startLevelIdx) {
						if (nodeLaneIdx < startLaneIdx) { return constants.orientation().NE; }
						else if (nodeLaneIdx > endLaneIdx) { return constants.orientation().NW; }
						else { return constants.orientation().N; }
					}
					else if (nodeLevelIdx > endLevelIdx) {
						if (nodeLaneIdx < startLaneIdx) { return constants.orientation().SE; }
						else if (nodeLaneIdx > endLaneIdx) { return constants.orientation().SW; }
						else { return constants.orientation().S; }
					}
					else {
						if (nodeLaneIdx < startLaneIdx) { return constants.orientation().E; }
						else if (nodeLaneIdx > endLaneIdx) { return constants.orientation().W; }
					}
				}
			},
			isNodeToRectPositionNorth: function(pos) {
				return pos | constants.orientation().N;
			},
			isNodeToRectPositionSouth: function(pos) {
				return pos | constants.orientation().S;
			},
			isNodeToRectPositionEast: function(pos) {
				return pos | constants.orientation().E;
			},
			isNodeToRectPositionWest: function(pos) {
				return pos | constants.orientation().W;
			},
			////
			hasNodeAtPoint: function(nodes, point) {
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].containsPoint(point)) {
						return nodes[i];
					}
				}
				return undefined;
			},
			hasLinkAtPoint: function(links, point) {
				for (var i = 0; i < links.length; i++) {
					if (links[i].containsPoint(point)) {
						return links[i];
					}
				}
				return undefined;
			},
			//////
			getNodeByName: function(flowModel, name) {
				var theNodes = flowModel.getFlowNodes();
				for (var i = 0; i < theNodes.length; i++) {
					if (theNodes[i].getName() === name) {
						return theNodes[i];
					}
				}
				return undefined;
			},
			getNodeByHashName: function(flowModel, hashName) {
				var theNodes = flowModel.getFlowNodes();
				for (var i = 0; i < theNodes.length; i++) {
					if (theNodes[i].getHashName() === hashName) {
						return theNodes[i];
					}
				}
				return undefined;
			},
			getNodeByNameAndType: function(flowModel, name, type) {
				var theNodes = flowModel.getFlowNodes();
				for (var i = 0; i < theNodes.length; i++) {
					if (theNodes[i].getName() === name && theNodes[i].getFlowType() === type) {
						return theNodes[i];
					}
				}
				return undefined;
			},
			getNodeByHashNameAndType: function(flowModel, hashName, type) {
				var theNodes = flowModel.getFlowNodes();
				for (var i = 0; i < theNodes.length; i++) {
					if (theNodes[i].getHashName() === hashName && theNodes[i].getFlowType() === type) {
						return theNodes[i];
					}
				}
				return undefined;
			},
			////// CONTAINERS ////
			isNodeInsideContainer: function(node, container) {
				if (node.getLevelNumber() >= container.getStartLevelNumber() &&
					node.getLevelNumber() <= container.getEndLevelNumber()
					&&
					node.getLaneNumber() >= container.getStartLaneNumber() &&
					node.getLaneNumber() <= container.getEndLaneNumber()
				) {
					return true;
				}
				return false;
			},
			areContainersIntersecting: function(cA, cB) {
				if (cA.getStartLevelNumber() >= cB.getStartLevelNumber() &&
					cA.getStartLevelNumber() <= cB.getEndLevelNumber() &&
					(
					cA.getStartLaneNumber() >= cB.getStartLaneNumber() &&
					cA.getStartLaneNumber() <= cB.getEndLaneNumber()
					||
					cA.getEndLaneNumber() >= cB.getStartLaneNumber() &&
					cA.getEndLaneNumber() <= cB.getEndLaneNumber()
					||
					cA.getStartLaneNumber() < cB.getStartLaneNumber() &&
					cA.getEndLaneNumber() > cB.getEndLaneNumber()
					)
				) { return true; }
				if (cA.getEndLevelNumber() >= cB.getStartLevelNumber() &&
					cA.getEndLevelNumber() <= cB.getEndLevelNumber() &&
					(
					cA.getStartLaneNumber() >= cB.getStartLaneNumber() &&
					cA.getStartLaneNumber() <= cB.getEndLaneNumber()
					||
					cA.getEndLaneNumber() >= cB.getStartLaneNumber() &&
					cA.getEndLaneNumber() <= cB.getEndLaneNumber()
					||
					cA.getStartLaneNumber() < cB.getStartLaneNumber() &&
					cA.getEndLaneNumber() > cB.getEndLaneNumber()
					)
				) { return true; }
				return false;
			},
			isLevelCrossingAnyContainer: function(modelHandler, levelIdx) {
				var nodes = modelHandler.getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded()) {
						if (levelIdx >= nodes[i].getStartLevelNumber() &&
							levelIdx <= nodes[i].getEndLevelNumber()) {
							return true;
						}
					}
				}
				return false;
			},
			isLevelPipeCrossingAnyContainer: function(modelHandler, levelPipeIdx) {
				var nodes = modelHandler.getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded()) {
						if (levelPipeIdx >= nodes[i].getStartLevelNumber()+1 &&
							levelPipeIdx <= nodes[i].getEndLevelNumber()) {
							return true;
						}
					}
				}
				return false;
			},
			isLaneCrossingAnyContainer: function(modelHandler, laneIdx) {
				var nodes = modelHandler.getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded()) {
						if (laneIdx >= nodes[i].getStartLaneNumber() &&
							laneIdx <= nodes[i].getEndLaneNumber()) {
							return true;
						}
					}
				}
				return false;
			},
			isLanePipeCrossingAnyContainer: function(modelHandler, lanePipeIdx) {
				var nodes = modelHandler.getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded()) {
						if (lanePipeIdx >= nodes[i].getStartLaneNumber()+1 &&
							lanePipeIdx <= nodes[i].getEndLaneNumber()) {
							return true;
						}
					}
				}
				return false;
			},
			getContainerFullContent: function(container) {
				return getRecursiveContainerContent(container);
			},
			getFullContainersContent: function(selections) {
				var fullContent = [];
				for (var i = 0; i < selections.length; i++) {
					if (selections[i].getFlowType() === constants.flowType().CONTAINER) {
						fullContent = fullContent.concat(getRecursiveContainerContent(selections[i]));
					}
				}
				return fullContent;
			},
			// resize
			canShrinkOuterContainerAlong: function(container) {
				var nodes = container.getContentNodes();
				// look for inner containers
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].getFlowType() === constants.flowType().CONTAINER &&
						nodes[i].getContainerReference() &&
						nodes[i].getContainerReference().getHashName() === container.getHashName()) {
						if (nodes[i].getEndLevelNumber() === container.getEndLevelNumber()) {
							return false;
						}
					}
				}
				return true;
			},
			canShrinkOuterContainerAcross: function(container) {
				var nodes = container.getContentNodes();
				// look for inner containers
				for (var i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].getContainerReference() &&
						nodes[i].getContainerReference().getHashName() === container.getHashName()) {
						if (nodes[i].getStartLaneNumber() === container.getStartLaneNumber() ||
							nodes[i].getEndLaneNumber() === container.getEndLaneNumber()) {
							return false;
						}
					}
				}
				return true;
			},
			getExpandedContainers: function(manager, parentContainer) {
				var containers = [],
					nodes = parentContainer ?
						parentContainer.getContentNodes() : manager.getModelHandler().getFlowNodes();
				nodes.forEach(function(node) {
					if ((node.getFlowType() === constants.flowType().CONTAINER ||
						node.getFlowType() === constants.flowType().SWITCH)
						&&
						node.isExpanded()) {
						if (parentContainer && node.getContainerReference() !== parentContainer) {
							return;
						}
						containers.push(node);
					}
				});
				return containers;
			},
			getAllContainers: function(manager, parentContainer) {
				var containers = [],
					nodes = parentContainer ?
						parentContainer.getContentNodes() : manager.getModelHandler().getFlowNodes();
				nodes.forEach(function(node) {
					if (node.getFlowType() === constants.flowType().CONTAINER ||
						node.getFlowType() === constants.flowType().SWITCH) {
						if (parentContainer && node.getContainerReference() !== parentContainer) {
							return;
						}
						containers.push(node);
					}
				});
				return containers;
			},
			// siblings are all other expanded containers at the container level
			hasConflictToSiblingAcross: function(flowModel, containerObj) {
				var siblings = getExpandedSiblingContainerObjects(flowModel, containerObj);
				for (var i = 0; i < siblings.length; i++) {
					if ((containerObj.startLevelNum >= siblings[i].startLevelNum &&
						containerObj.startLevelNum <= siblings[i].endLevelNum ||
						containerObj.endLevelNum >= siblings[i].startLevelNum &&
						containerObj.endLevelNum <= siblings[i].endLevelNum)
						&&
						(containerObj.startLaneNum-1 === siblings[i].endLaneNum ||
						containerObj.endLaneNum+1 === siblings[i].startLaneNum)
					) {
						return true;
					}
				}
				return false;
			},
			hasSwitchConflictToSiblingAcross: function(flowModel, switchObj, offsets) {
				var siblings = getExpandedSiblingContainerObjects(flowModel, switchObj);
				for (var i = 0; i < siblings.length; i++) {
					if (switchObj.startLevelNum >= siblings[i].startLevelNum &&
						switchObj.startLevelNum <= siblings[i].endLevelNum
						&&
						(switchObj.laneNum - offsets.startLaneOffset === siblings[i].endLaneNum ||
						switchObj.laneNum + offsets.endLaneOffset === siblings[i].startLaneNum)
					) {
						return true;
					}
				}
				return false;
			},
			hasStartEndLevelsConflictAlong: function(flowModel, containerObj) {
				//var siblings = getExpandedSiblingContainerObjects(flowModel, containerObj);
				//for (var i = 0; i < siblings.length; i++) {
				//	if (containerObj.startLaneNum >= siblings[i].startLaneNum &&
				//		containerObj.startLaneNum <= siblings[i].endLaneNum ||
				//		containerObj.endLaneNum >= siblings[i].startLaneNum &&
				//		containerObj.endLaneNum <= siblings[i].endLaneNum
				//	) {
				//		return true;
				//	}
				//}
				var nodeObjects = flowModel.getNodeObjects();
				for (var i = 0; i < nodeObjects.length; i++) {
					if (nodeObjects[i].name === containerObj.name ||
						nodeObjects[i].containerName === containerObj.name ||
						nodeObjects[i].type === constants.flowType().CONTAINER && nodeObjects[i].expanded === true ||
						nodeObjects[i].containerName && nodeObjects[i].containerName !== containerObj.containerName) {
						continue;
					}
					if (nodeObjects[i].laneNum >= containerObj.startLaneNum &&
						nodeObjects[i].laneNum <= containerObj.endLaneNum &&
						(//nodeObjects[i].laneNum === containerObj.startLaneNum-1 ||
						nodeObjects[i].levelNum === containerObj.endLevelNum+1) ) {
						return true;
					}
				}
				return false;
			},
			hasConflictToSiblingAlong: function(flowModel, containerObj) {
				var siblings = getExpandedSiblingContainerObjects(flowModel, containerObj);
				for (var i = 0; i < siblings.length; i++) {
					if ((containerObj.startLaneNum >= siblings[i].startLaneNum &&
						containerObj.startLaneNum <= siblings[i].endLaneNum ||
						containerObj.endLaneNum >= siblings[i].startLaneNum &&
						containerObj.endLaneNum <= siblings[i].endLaneNum)
						&&
						containerObj.endLevelNum+1 === siblings[i].startLevelNum
					) {
						return true;
					}
				}
				return false;
			},
			hasStartEndLanesConflictAcross: function(flowModel, containerObj) {
				var nodeObjects = flowModel.getNodeObjects();
				for (var i = 0; i < nodeObjects.length; i++) {
					if (nodeObjects[i].name === containerObj.name ||
						nodeObjects[i].containerName === containerObj.name ||
						(nodeObjects[i].type === constants.flowType().CONTAINER ||
						nodeObjects[i].type === constants.flowType().SWITCH)
						&&
						nodeObjects[i].expanded === true ||
						nodeObjects[i].containerName && nodeObjects[i].containerName !== containerObj.containerName) {
						continue;
					}
					if (nodeObjects[i].levelNum >= containerObj.startLevelNum &&
						nodeObjects[i].levelNum <= containerObj.endLevelNum &&
						(nodeObjects[i].laneNum === containerObj.startLaneNum-1 ||
						nodeObjects[i].laneNum === containerObj.endLaneNum+1) ) {
						return true;
					}
				}
				return false;
			},
			// look for conflicts with non-container objects
			hasSwitchStartEndLanesConflictAcross: function(flowModel, switchObj, offsets) {
				var nodeObjects = flowModel.getNodeObjects();
				for (var i = 0; i < nodeObjects.length; i++) {
					if (nodeObjects[i].name === switchObj.name ||
						nodeObjects[i].containerName && nodeObjects[i].containerName !== switchObj.containerName) {
						continue;
					}
					if (nodeObjects[i].levelNum === switchObj.startLevelNum &&
						(nodeObjects[i].laneNum === switchObj.laneNum - offsets.startLaneOffset ||
						nodeObjects[i].laneNum === switchObj.laneNum + offsets.endLaneOffset) ) {
						return true;
					}
				}
				return false;
			},

			//canExtendAcrossSiblings: function(container, siblings) {
			//	for (var i = 0; i < siblings.length; i++) {
			//		if (container.getStartLevelNumber() >= siblings.getStartLevelNumber() &&
			//			container.getStartLevelNumber() <= siblings.getEndLevelNumber() &&
			//			container.getStartLaneNumber() >= siblings.getStartLevelNumber())
			//	}
			//},
			getInnermostContainerAtPoint: function(nodes, point) {
				for (var i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded() &&
						nodes[i].containsPoint(point)) {
						return getInnermostContainer(nodes[i], point);
					}
				}
				return undefined;
			},
			getInsideNodeAtPoint: function(nodes, point) {
				return getInsideNode(nodes, point);
			},
			getNodeInsideContainerAtPoint: function(container, point) {
				return getNodeInsideContainer(container, point);
			},
			getLinkInsideContainerAtPoint: function(container, point) {
				return getLinkInsideContainer(container, point);
			},
			moveRecursivelyContainersContent: function(container, flowModel, levelNum, laneNum) {
				moveContainersContent(container, flowModel, levelNum, laneNum);
			},
			collapseContainersRecursively: function(container) {
				collapseInnerContainers(container);
			},
			getCellsInsideContainer: function(thisContainer, cells, startLevelAccepted) {
				var contained = [],
					nodes = thisContainer.getContentNodes(),
					containers = [], i;
				for (i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded()) {
						containers.push(nodes[i]);
					}
				}
				for (i = 0; i < cells.length; i++) {
					if (isCellInContainerAndAccessible(thisContainer, cells[i], startLevelAccepted) &&
						!isCellInAnyContainer(cells[i], containers)) {
						contained.push(cells[i]);
					}
				}
				return contained;
			},
			getCellsOutsideContainers: function(nodes, cells) {
				//return getTopCellsOutsideAnyContainers(nodes, cells);
				var outsiders = [],
					containers = [], i;
				for (i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						!nodes[i].getContainerReference() &&
						nodes[i].isExpanded()) {
						containers.push(nodes[i]);
					}
				}
				for (i = 0; i < cells.length; i++) {
					if (!isCellInAnyContainer(cells[i], containers)) {
						outsiders.push(cells[i]);
					}
				}
				return outsiders;
			},
			getAllDropCellsByTypeRestriction: function(allCells, nodes, startLevelAccepted) {
				var cells = allCells.slice(),
					accepted = [],
					remaining = [],
					//topContainers = [],
					allContainers = [],
					i, j;
				getAllExpandedContainers(nodes, allContainers);

				//for (i = 0; i < nodes.length; i++) {
				//	if (nodes[i].getFlowType() === constants.flowType().CONTAINER &&
				//		!nodes[i].getContainerReference() &&
				//		nodes[i].isExpanded()) {
				//		topContainers.push(nodes[i]);
				//	}
				//}
				for (i = 0; i < cells.length; i++) {
					if (!isCellInAnyContainer(cells[i], allContainers)) {
						accepted.push(cells[i]);
					}
				}

				//cells = cells.filter(function(cell) {
				//	return !findCell(cell, accepted);
				//});
				for (i = 0; i < allContainers.length; i++) {
					var ctrCells = allContainers[i].getContainerEmptyCells();
					//var rejected = false;
					for (j = 0; j < ctrCells.length; j++) {
						//console.log("** "+allContainers[i].getName()+": "+ ctrCells[j].getLevelNumber()+", "+ctrCells[j].getLaneNumber());
						if (isContainerCellAccessible(allContainers[i], ctrCells[j], startLevelAccepted) ) {
							accepted.push(ctrCells[j]);
						}
					}
					//if (!rejected) {
                    //
                    //}
				}
				//for (i = 0; i < accepted.length; i++) {
				//	if (accepted[i].getLevelNumber() === 2 && accepted[i].getLaneNumber() === 3) {
				//		console.log("??? accepted: found 2/3");
				//	}
				//}
				return accepted;
			},
			getNodeCellsByTypeRestriction: function(allCells, nodes, startLevelAccepted) {
				var cells = allCells.slice(),
					accepted = [],
					allContainers = [],
					i, j;
				getAllExpandedContainers(nodes, allContainers);

				for (i = 0; i < allContainers.length; i++) {
					for (j = 0; j < cells.length; j++) {
						//console.log("** "+allContainers[i].getName()+": "+ ctrCells[j].getLevelNumber()+", "+ctrCells[j].getLaneNumber());
						if (isContainerNodeCellAccessible(allContainers[i], cells[j], startLevelAccepted) ) {
							accepted.push(cells[j]);
						}
					}
				}
				return accepted;
			},
			allowDropToStartLevel: function(flowType) {
				return flowType && flowType >= constants.flowType().PROCESS;
			},
			//
			getNodeContainmentDepth: function(node) {
				return getContainmentDepth(node);
			},
			getNestedContainersNumberAtNodeLevel: function(node, nodes) {
				var levelIdx = node.getLevelNumber(),
					allNodes = [];
				//get all nodes at the same containment level
				if (node.getContainerReference()) {
					allNodes = node.getContainerReference().getContentNodes();
				} else {
					for (var i = 0; i < nodes.length; i++) {
						if (nodes[i].equals(node)) {
							continue;
						}
						if (!nodes[i].getContainerReference()) {
							allNodes.push(nodes[i]);
						}
					}
				}
				var n = getMaxNestedContainersNumberAtLevel(levelIdx, allNodes);
				return n;
			},
			getNestedContainersNumberAtNodeLane: function(node, nodes) {
				var laneIdx = node.getLaneNumber(),
					allNodes = [];
				//get all nodes at the same containment level
				if (node.getContainerReference()) {
					allNodes = node.getContainerReference().getContentNodes();
				} else {
					for (var i = 0; i < nodes.length; i++) {
						if (nodes[i].equals(node)) {
							continue;
						}
						if (!nodes[i].getContainerReference()) {
							allNodes.push(nodes[i]);
						}
					}
				}
				var n = getMaxNestedContainersNumberAtLane(laneIdx, allNodes);
				return n;
			},
			getSwitchHookOffsets: function(hooksNumber) {
				var div = Math.floor(hooksNumber/2),
					rem = hooksNumber%2,
					laneShifts = {};
				if (hooksNumber === 1) {
					laneShifts.startLaneOffset = 0;
					laneShifts.endLaneOffset = 0;
				} else {
					laneShifts.startLaneOffset = div;
					laneShifts.endLaneOffset = rem === 0 ? div-1 : div;
				}
				return laneShifts;
			}


		}
	}
);
