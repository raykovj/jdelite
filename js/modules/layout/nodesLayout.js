define('modules/layout/nodesLayout',
	['modules/geometry/point',
		'modules/graph/xPoint',
		'modules/graph/cell',
		'modules/graph/nodeCell',
		'modules/graph/graphNode',
		'modules/graph/graphPort',
		'modules/graph/connector',
		'modules/graph/level',
		'modules/graph/levelPipe',
		'modules/graph/lane',
		'modules/graph/lanePipe',
		'modules/layout/nodesLayoutUtils',
		'modules/layout/nodesCollector',
		'modules/common/commonUtils',
		'modules/graph/segment',
		'modules/graph/graphConstants',
		'modules/settings/config'],
	function(Point,
	         XPoint,
	         Cell,
	         NodeCell,
	         GraphNode,
	         GraphPort,
	         Connector,
	         Level,
	         LevelPipe,
	         Lane,
	         LanePipe,
			 nodesLayoutUtl,
	         NodesCollector,
	         Utils,
	         Segment,
	         constants,
	         config) {

		function NodesLayout(layout) {

			var self = this,
				DEBUG = false,
				_flowLayout = layout;

			self.initialize = function() {
				//console.log("** NodesLayout initialize");
			};

			/**
			 * //////////////////////////////////
			 * Before layout only:
			 * adjustments for side swim lanes and start/end lanes(levels) to hide/unhide corresponding nodes
			 * //////////////////////////////////
			 */
			self.adjustGraphNodesLocations = function() {
				var i, nodesList = _flowLayout.getNodesList();

				if (config.getLayoutMode() != constants.layoutMode().MANUAL) {
					var suppressSide = !config.hasSideSwimLanes();
					var sideNodes = nodesLayoutUtl.getLeftLaneNodes(nodesList);
					sideNodes = sideNodes.concat(nodesLayoutUtl.getRightLaneNodes(nodesList));
					for (i = 0; i < sideNodes.length; i++) {
						sideNodes[i].setSuppressed(suppressSide);
					}
					var suppressStartEnd = !config.hasStartEndLevels();
					var startEndNodes = nodesLayoutUtl.getStartNodes(nodesList);
					startEndNodes = startEndNodes.concat(nodesLayoutUtl.getEndNodes(nodesList));
					for (i = 0; i < startEndNodes.length; i++) {
						startEndNodes[i].setSuppressed(suppressStartEnd);
					}
					return;
				}
				////////////////////
				// across: hasSideSwimLanes
				////////////////////
				var message, shift,
					leftNodes = nodesLayoutUtl.getLeftLaneNodes(nodesList),
					rightNodes = nodesLayoutUtl.getRightLaneNodes(nodesList),
					centerNodes = Utils.subtractArrays(nodesList, leftNodes);
				centerNodes = Utils.subtractArrays(centerNodes, rightNodes);
				var acrossRange = nodesLayoutUtl.getNodesLaneRange(centerNodes),
					rightRange =  nodesLayoutUtl.getNodesLaneRange(rightNodes);
				var leftIdx = acrossRange[0], rightIdx = acrossRange[1];
				if (centerNodes.length > 0) {
					console.log("################ NODE [0]: level: "+centerNodes[0].getLevelNumber()+", lane: "+centerNodes[0].getLevelNumber());
					console.log("################ RANGE: 0: "+acrossRange[0]+", 1: "+acrossRange[1]);
				}
				// for both vertical or horizontal orientation, lane 0 is on the left/top
				if (config.hasSideSwimLanes()) {
					shift = 0;
					// extra first lane
					if (config.hasExtraFirstLane()) {
						if (leftIdx == 0) {
							shift = 2;
						} else if (leftIdx == 1) {
							shift = 1;
						} else if (leftIdx > 2) {
							shift = -(leftIdx-2);
						}
						message = "has side swim lanes, has extra first lane, shift = "+Math.abs(shift);
					} else {
						if (leftIdx == 0) {
							shift = 1;
						} else if (leftIdx > 1) {
							shift = -(leftIdx-1);
						}
						message = "has side swim lanes, no extra first lane, shift = "+Math.abs(shift);
					}
					if (shift != 0 && (centerNodes.length > 0 || rightNodes.length > 0)) {
						 //centerNodes, if any, need to be shifted right/down to leave room for lane nodes
						for (i = 0; i < centerNodes.length; i++) {
							if (centerNodes[i].getLaneNumber() != GraphNode.LANE_UNDEF) {
								centerNodes[i].setLaneNumber(centerNodes[i].getLaneNumber() + shift);
							}
						}
						for (i = 0; i < rightNodes.length; i++) {
							if (rightNodes[i].getLaneNumber() != GraphNode.LANE_UNDEF) {
								rightNodes[i].setLaneNumber(rightNodes[i].getLaneNumber() + shift);
							}
						}
						//if (DEBUG)
							console.log(message);
					}
					// extra last lane
					if (rightNodes.length > 0) {
						shift = 0;
						var rightEnd = rightRange[0];
						var rightGap = rightEnd - rightIdx;
						if (config.hasExtraLastLane()) {
							if (rightGap != 2) {
								shift = rightIdx + 2 - rightEnd;
							}
							message = "has side swim lanes, has extra last lane, shift = "+Math.abs(shift);
						} else {
							if (rightGap != 1) {
								shift = rightIdx + 1 - rightEnd;
							}
							message = "has side swim lanes, no extra last lane, shift = "+Math.abs(shift);
						}
						if (shift != 0) {
							for (i = 0; i < rightNodes.length; i++) {
								if (rightNodes[i].getLaneNumber() != GraphNode.LANE_UNDEF) {
									rightNodes[i].setLaneNumber(rightNodes[i].getLaneNumber() + shift);
								}
							}
							//if (DEBUG)
								console.log(message);
						}
					}
					// left/right lane nodes need to be un-suppressed, in case they have been suppressed before
					for (i = 0; i < leftNodes.length; i++) {
						leftNodes[i].setSuppressed(false);
					}
					for (i = 0; i < rightNodes.length; i++) {
						rightNodes[i].setSuppressed(false);
					}
				} else { // no sideSwimLanes
					shift = 0;
					if (config.hasExtraFirstLane()) {
						if (leftIdx > 1) {
							shift = leftIdx-1;
						} else if (leftIdx == 0) {
							shift = -1; // advance
						}
						message = "no side swim lanes, has extra first lane, shift = "+Math.abs(shift);
					} else {
						if (leftIdx > 0) {
							shift = leftIdx;
						}
						message = "no side swim lanes, no extra first lane, shift = "+Math.abs(shift);
					}
					// NOT TOO MUCH
					if (shift != 0 && centerNodes.length > 0) {
						// centerNodes, if any, need to be shifted left/up
						for (i = 0; i < centerNodes.length; i++) {
							if (centerNodes[i].getLaneNumber() != GraphNode.LANE_UNDEF) {
								centerNodes[i].setLaneNumber(centerNodes[i].getLaneNumber() - shift);
							}
						}
					}
					//if (DEBUG)
						console.log(message);
					// left/right lane nodes need to be suppressed
					for (i = 0; i < leftNodes.length; i++) {
						leftNodes[i].setSuppressed(true);
					}
					for (i = 0; i < rightNodes.length; i++) {
						rightNodes[i].setSuppressed(true);
					}
				}
				////////////////////
				// along: hasStartEndLanes
				////////////////////
				var startNodes = nodesLayoutUtl.getStartNodes(nodesList),
					endNodes = nodesLayoutUtl.getEndNodes(nodesList);
				centerNodes = Utils.subtractArrays(nodesList, startNodes);
				centerNodes = Utils.subtractArrays(centerNodes, endNodes);
				var alongRange = nodesLayoutUtl.getNodesLevelRange(centerNodes),
					endRange =  nodesLayoutUtl.getNodesLevelRange(endNodes);
				var alongStartIdx = alongRange[0], alongEndIdx = alongRange[1];
				// for both horizontal or vertical orientation, level 0 is on the left/top
				if (config.hasStartEndLevels()) {
					shift = 0;
					if (config.hasExtraFirstLevel()) {
						if (alongStartIdx == 0) {
							shift = 2;
						} else if (alongStartIdx == 1) {
							shift = 1;
						} else if (alongStartIdx > 2) {
							shift = -(alongStartIdx-2);
						}
						message = "has start/end levels, has extra first level, shift = "+Math.abs(shift);
					} else {
						if (alongStartIdx == 0) {
							shift = 1;
						} else if (alongStartIdx > 1) {
							shift = -(alongStartIdx-1);
						}
						message = "has start/end levels, no extra first level, shift = "+Math.abs(shift);
					}
					if (shift != 0 && (centerNodes.length > 0 || endNodes.length > 0)) {
						// centerNodes, if any, need to be shifted down to leave room for lane nodes
						for (i = 0; i < centerNodes.length; i++) {
							if (centerNodes[i].getLevelNumber() != GraphNode.LEVEL_UNDEF) {
								centerNodes[i].setLevelNumber(centerNodes[i].getLevelNumber() + shift);
							}
						}
						for (i = 0; i < endNodes.length; i++) {
							if (endNodes[i].getLevelNumber() != GraphNode.LEVEL_UNDEF) {
								endNodes[i].setLevelNumber(endNodes[i].getLevelNumber() + shift);
							}
						}
						//if (DEBUG)
							console.log(message);
					}
					// extra last level
					if (endNodes.length > 0) {
						shift = 0;
						var endRangeIdx = endRange[0];
						var endGap = endRangeIdx - alongEndIdx;
						if (config.hasExtraLastLevel()) {
							if (endGap != 2) {
								shift = alongEndIdx + 2 - endRangeIdx;
							}
							message = "has start/end levels, has extra last level, shift = "+Math.abs(shift);
						} else {
							if (endGap != 1) {
								shift = alongEndIdx + 1 - endRangeIdx;
							}
							message = "has start/end levels, no extra last level, shift = "+Math.abs(shift);
						}
						if (shift != 0) {
							for (i = 0; i < endNodes.length; i++) {
								if (endNodes[i].getLevelNumber() != GraphNode.LEVEL_UNDEF) {
									endNodes[i].setLevelNumber(endNodes[i].getLevelNumber() + shift);
								}
							}
							//if (DEBUG)
								console.log(message);
						}
					}
					// start/end nodes need to be un-suppressed, in case they have been suppressed before
					for (i = 0; i < startNodes.length; i++) {
						startNodes[i].setSuppressed(false);
					}
					for (i = 0; i < endNodes.length; i++) {
						endNodes[i].setSuppressed(false);
					}
				} else { // no hasStartEndLanes
					shift = 0;
					if (config.hasExtraFirstLevel()) {
						if (alongStartIdx > 1) {
							shift = alongStartIdx-1;
						} else if (alongStartIdx == 0) {
							shift = -1; // advance
						}
						message = "no start/end levels, has extra first level, shift = "+Math.abs(shift);
					} else {
						if (alongStartIdx > 0) {
							shift = alongStartIdx;
						}
						message = "no start/end levels, no extra first level, shift = "+Math.abs(shift);
					}
					// NOT TOO MUCH
					if (shift != 0 && centerNodes.length > 0) {
						// centerNodes, if any, need to be shifted left/up
						for (i = 0; i < centerNodes.length; i++) {
							if (centerNodes[i].getLevelNumber() != GraphNode.LEVEL_UNDEF) {
								centerNodes[i].setLevelNumber(centerNodes[i].getLevelNumber() - shift);
							}
						}
					}
					//if (DEBUG)
						console.log(message);
					// start/end lane nodes need to be suppressed
					for (i = 0; i < startNodes.length; i++) {
						startNodes[i].setSuppressed(true);
					}
					for (i = 0; i < endNodes.length; i++) {
						endNodes[i].setSuppressed(true);
					}
				}
			};

			////////////////////////////////////////////////////////////////////////////
			// NEW !!! MANUAL ONLY
			////////////////////////////////////////////////////////////////////////////

			self.adjustNodesInCanvas = function() {
				var i, nodesList = _flowLayout.getNodesList();
				////////////////////
				// across: hasSideSwimLanes
				////////////////////
				var leftNodes = nodesLayoutUtl.getLeftLaneNodes(nodesList),
					rightNodes = nodesLayoutUtl.getRightLaneNodes(nodesList);
				// for both vertical or horizontal orientation, lane 0 is on the left/top
				if (config.hasSideSwimLanes()) {
					// left/right lane nodes need to be un-suppressed
					for (i = 0; i < leftNodes.length; i++) {
						leftNodes[i].setSuppressed(false);
					}
					for (i = 0; i < rightNodes.length; i++) {
						rightNodes[i].setSuppressed(false);
					}
				} else { // no sideSwimLanes
					// left/right lane nodes need to be suppressed
					for (i = 0; i < leftNodes.length; i++) {
						leftNodes[i].setSuppressed(true);
					}
					for (i = 0; i < rightNodes.length; i++) {
						rightNodes[i].setSuppressed(true);
					}
				}
				////////////////////
				// along: hasStartEndLanes
				////////////////////
				var startNodes = nodesLayoutUtl.getStartNodes(nodesList),
					endNodes = nodesLayoutUtl.getEndNodes(nodesList);
				// for both horizontal or vertical orientation, level 0 is on the left/top
				if (config.hasStartEndLevels()) {
					// start/end nodes need to be un-suppressed
					for (i = 0; i < startNodes.length; i++) {
						startNodes[i].setSuppressed(false);
					}
					for (i = 0; i < endNodes.length; i++) {
						endNodes[i].setSuppressed(false);
					}
				} else { // no hasStartEndLanes
					// start/end lane nodes need to be suppressed
					for (i = 0; i < startNodes.length; i++) {
						startNodes[i].setSuppressed(true);
					}
					for (i = 0; i < endNodes.length; i++) {
						endNodes[i].setSuppressed(true);
					}
				}
			};

			/***************************************
			 * COMMON
			 ***************************************/

			self.createNewCellToLevel = function(node, level) {
				//console.log("+++ createNewCellToLevel: level="+level.getOrder()+", node="+node.getName());
				var oldCell = _flowLayout.getNodeToCellMap().get(node.getName());
				if (oldCell) {
					var message = "##+++ createNewCellToLevel: already exists: "+node.getName();
					if (DEBUG) console.log(message);
					return oldCell;
				}
				var cell = new NodeCell(node);
				_flowLayout.getNodeToCellMap().put(node.getName(), cell);
				level.addCell(cell);
				return cell;
			};

			self.reassignCellToLevel = function(node, newLevel) {
				var cell = _flowLayout.getNodeToCellMap().get(node.getName());
				if (!cell) {
					console.log("Cell cannot be found for level reallocation");
					return;
				}
				var oldLevel = _flowLayout.getLevels()[node.getLevelNumber()];
				oldLevel.removeCell(cell);
				newLevel.addCell(cell);
			};

			self.reassignCellToLane = function(node, newLane) {
				var cell = _flowLayout.getNodeToCellMap().get(node.getName());
				if (!cell) {
					console.log("Cell cannot be found for lane reallocation");
					return;
				}
				var oldLane = _flowLayout.getLanes()[node.getLaneNumber()];
				oldLane.removeCell(cell);
				newLane.addCell(cell);
			};

			self.attemptToAssignToLevel = function(node, level) {
				var targetCell = _flowLayout.getNodeToCellMap().get(node.getName());
				if (!targetCell) {
					self.createNewCellToLevel(node, level);
					return true;
				} else {
					return false;
				}
			};

			//////////////////////////////////////////
			/***************************************
			 * MANUAL, do layout using nodes locations
			 ***************************************/
			//////////////////////////////////////////

			self.layoutNodesManual = function() {
				if (DEBUG) console.log("#### Layout fix mode: MANUAL");
				// accept the existing positions of nodes
				self.assignNodesToLevelsManual();
				self.assignNodesToLanesManual();
			};

			/*********************************************** OK
			 *  MANUAL: LEVELS:
			 ***********************************************/
			/**
			 *
			 */
			self.assignNodesToLevelsManual = function() {
				var i, level, startLevel, endLevel,
					initLevelsNum = config.getCanvasLevels();
				var nonSuppressedNodes = _flowLayout.getNonSuppressedNodes();
				var startNodes = nodesLayoutUtl.getStartNodes(nonSuppressedNodes);
				var endNodes = nodesLayoutUtl.getEndNodes(nonSuppressedNodes);
				var remainingNodes = Utils.subtractArrays(nonSuppressedNodes, startNodes);
				remainingNodes = Utils.subtractArrays(remainingNodes, endNodes);
				// need to preserve enclosing empty levels unless there are template settings
				// start
				if (config.hasStartEndLevels()) {
					startLevel = new Level(0);
					startLevel.setStartLevel(true);
					_flowLayout.getLevels().push(startLevel);
					for (i = 0; i < startNodes.length; i++) {
						self.createNewCellToLevel(startNodes[i], startLevel);
					}
				} else {
					if (startNodes.length > 0) {
						startLevel = new Level(0);
						for (i = 0; i < startNodes.length; i++) {
							self.createNewCellToLevel(startNodes[i], startLevel);
						}
						_flowLayout.getLevels().push(startLevel);
					}
				}

				var range = nodesLayoutUtl.getNodesLevelRange(remainingNodes);
				var minIdx = range[0], maxIdx = range[1];

				// this index will account for possible insertion level
				var currIdx = _flowLayout.getLevels().length;
				// this index is to traverse the existing node levels
				if (remainingNodes.length === 0) {
					for (i = 0; i < initLevelsNum; i++) {
						level = new Level(currIdx++);
						_flowLayout.getLevels().push(level);
					}
				} else {
					// if there are empty levels (before minIdx) at the beginning, keep them
					//while (currIdx < minIdx) {
					//	level = new Level(currIdx++);
					//	_flowLayout.getLevels().push(level);
					//}
					for (var rangeIdx = _flowLayout.getLevels().length ; rangeIdx <= maxIdx; rangeIdx++) {
						level = new Level(currIdx++);
						_flowLayout.getLevels().push(level);
						var nodes = nodesLayoutUtl.getNodesAtLevel(remainingNodes, rangeIdx);
						for (i = 0; i < nodes.length; i++) {
							self.createNewCellToLevel(nodes[i], level);
						}
						remainingNodes = Utils.subtractArrays(remainingNodes, nodes);
					}
					if (config.hasExtraLastLevel()) {
						// this should be an empty level
						level = new Level(currIdx++);
						_flowLayout.getLevels().push(level);
					}
					var centralLevelsNum = nodesLayoutUtl.getCentralLevelsNumber(_flowLayout.getLevels());
					if (centralLevelsNum < initLevelsNum) {
						for (i = centralLevelsNum; i < initLevelsNum; i++) {
							level = new Level(currIdx++);
							_flowLayout.getLevels().push(level);
						}
					}
				}
				// force end nodes on the same (last) level and add any empty levels
				if (config.hasStartEndLevels()) {
					endLevel = new Level(currIdx);
					endLevel.setEndLevel(true);
					_flowLayout.getLevels().push(endLevel);
					for (i = 0; i < endNodes.length; i++) {
						self.createNewCellToLevel(endNodes[i], endLevel);
					}
				} else {
					if (endNodes.length > 0) {
						endLevel = new Level(currIdx);
						for (i = 0; i < endNodes.length; i++) {
							self.createNewCellToLevel(endNodes[i], endLevel);
						}
						_flowLayout.getLevels().push(endLevel);
					}
				}
			};

			/*********************************************** OK
			 *  MANUAL: LANES:
			 ***********************************************/
			/**
			 * lanes are ordered left-to-right or top-to-bottom /////////////
			 */
			self.assignNodesToLanesManual = function() {
				var i, lane, cell,
					initLanesNum = config.getCanvasLanes();
				var nonSuppressedNodes = _flowLayout.getNonSuppressedNodes();
				var leftNodes = nodesLayoutUtl.getLeftLaneNodes(nonSuppressedNodes);
				var rightNodes = nodesLayoutUtl.getRightLaneNodes(nonSuppressedNodes);
				var remainingNodes = Utils.subtractArrays(nonSuppressedNodes, leftNodes);
				remainingNodes = Utils.subtractArrays(remainingNodes, rightNodes);

				var lanesRange = nodesLayoutUtl.getNodesLaneRange(remainingNodes);
				if (config.hasSideSwimLanes()) {
					var leftLane = new Lane(0);
					leftLane.setLeftLane(true);
					_flowLayout.getLanes().push(leftLane);
					// if any
					for (i = 0; i < leftNodes.length; i++) {
						leftNodes[i].setLaneNumber(0);
						cell = _flowLayout.getNodeToCellMap().get(leftNodes[i].getName());
						if (cell) {
							leftLane.addCell(cell);
						} else {
							//_flowLayout.getFlowManager().getCaller().showInfoMessage(
							console.log(
								"ERROR: No cell assigned for node: "+leftNodes[i].getName());
						}
					}
				} else {
					// do not add lane, left nodes are suppressed
				}
				// this index will account for possible insertion lane
				var currIdx = _flowLayout.getLanes().length; //hasSideSwimLanes ? 1 : 0;
				// if there are empty lanes (before minIdx) at the beginning, keep them
				var maxRangeIdx = lanesRange[1];
				if (remainingNodes.length === 0) {
					for (i = 0; i < initLanesNum; i++) {
						lane = new Lane(currIdx++);
						_flowLayout.getLanes().push(lane);
					}
				} else {
					// go over the full range
					for (var rangeIdx = _flowLayout.getLanes().length; rangeIdx <= maxRangeIdx; rangeIdx++) {
						lane = new Lane(currIdx++);
						_flowLayout.getLanes().push(lane);
						var nodes = nodesLayoutUtl.getNodesAtLane(remainingNodes, rangeIdx);
						for (i = 0; i < nodes.length; i++) {
							//newCellToLevel(node, level);
							cell = _flowLayout.getNodeToCellMap().get(nodes[i].getName());
							if (cell) {
								lane.addCell(cell);
							} else {
								//throw new IllegalArgumentException("No cell assigned for node "+node.getName());
							}
						}
						remainingNodes = Utils.subtractArrays(remainingNodes, nodes);
					}
					if (config.hasExtraLastLane()) {
						// this should be an empty lane
						lane = new Lane(currIdx++);
						_flowLayout.getLanes().push(lane);
					}
					var centralLanesNum = nodesLayoutUtl.getCentralLanesNumber(_flowLayout.getLanes());
					if (centralLanesNum < initLanesNum) {
						for (i = centralLanesNum; i < initLanesNum; i++) {
							lane = new Lane(currIdx++);
							_flowLayout.getLanes().push(lane);
						}
					}
				}
				// TODO? add any empty lanes
				// right lane
				if (config.hasSideSwimLanes()) {
					var rightLane = new Lane(currIdx);
					rightLane.setRightLane(true);
					_flowLayout.getLanes().push(rightLane);
					for (i = 0; i < rightNodes.length; i++) {
						rightNodes[i].setLaneNumber(currIdx);
						cell = _flowLayout.getNodeToCellMap().get(rightNodes[i].getName());
						if (cell) {
							rightLane.addCell(cell);
						}
					}
				} else  {
					// do not add lane, right nodes are suppressed
				}

			};

			//////////////////////////////////////////
			/***************************************
			 * AUTO_LAYOUT, ignore previous locations
			 ***************************************/
			//////////////////////////////////////////

			self.layoutNodesAutoLayout = function() {
				if (DEBUG) console.log("#### Layout fix mode: AUTO-LAYOUT");
				// ignore any existing positions, assign new cells
				// reset level & lane numbers
				self.assignNodesToLevelsAutoLayout();
				//self.printCells("@@@ layoutNodesAutoLayout");
				var unAllocNodes = self.getLevelUnallocatedNodes();
				if (unAllocNodes.length === 0) {
					self.assignNewLanesAutoLayout();
					if (DEBUG) console.log("layoutNodes done, mode=AUTO-LAYOUT, levels="+
						_flowLayout.getLevels().length+", lanes="+ _flowLayout.getLanes().length);
					//printNodes();
					return true;
				} else {
					printUnallocatedNodes(unAllocNodes);
					return false;
				}
			};

			self.getLevelUnallocatedNodes = function() {
				var unAllocNodes = [];
				var nonSuppressedNodes = _flowLayout.getNonSuppressedNodes();
				for (var i = 0; i < nonSuppressedNodes.length; i++) {
					var node = nonSuppressedNodes[i];
					if (!node.isLevelAssigned()) {
						unAllocNodes.push(node);
					}
				}
				return unAllocNodes;
			};

			//var printNodes = function() {
			//	var nodesCollector = _flowLayout.getNodesCollector(),
			//		nodes = nodesCollector.getAllNodes();
			//	for (var i = 0; i < nodes.length; i++) {
			//		console.log("+++ layoutNodesAutoLayout: : "+nodes[i].print1());
			//	}
			//};

			var printUnallocatedNodes = function(nodes) {
				for (var i = 0; i < nodes.length; i++) {
					console.log("???? layoutNodesAutoLayout: node level not assigned: "+nodes[i].getName());
				}
			};

			self.printCells = function(token) {
				console.log("@@ print cells: "+token);
				var cells = _flowLayout.getNodeToCellMap().values();
				for (var i = 0; i < cells.length; i++) {
					console.log(" -- "+cells[i].print());
				}
			};



			////////////////////////////////////
			//////////  LEVELS /////////////////
			////////////////////////////////////

			/** AUTO START */
			self.assignNodesToLevelsAutoLayout = function() {
				if (DEBUG) console.log("start assignNodesToLevelsUnallocated...");

				var i, nodesCollector = _flowLayout.getNodesCollector();

				var startNodes = nodesCollector.getStartNodes();
				// start nodes, if any
				if (config.hasStartEndLevels()) {
					var startLevel = new Level(0);
					startLevel.setStartLevel(true);
					_flowLayout.getLevels().push(startLevel);
					for (i = 0; i < startNodes.length; i++) {
						self.createNewCellToLevel(startNodes[i], startLevel);
					}
				}
				var allAssignedNodes = [];
				allAssignedNodes = allAssignedNodes.concat(startNodes);

				// between start and end
				var candidates = nodesCollector.getFirstLevelCandidates();
				//printCandidates();
				if (candidates.length != 0) {
					var assignedNodes = self.assignNodesToFirstLevelsAutoLayout(candidates);
					//printSteps();
					while (assignedNodes.length > 0) {
						allAssignedNodes = allAssignedNodes.concat(assignedNodes);
						assignedNodes = self.assignNodesToNextLevelAutoLayout(allAssignedNodes);
						//printSteps();
					}
				}

				// all unconnected
				var startLevelIdx = _flowLayout.getLevels().length;
				self.assignUnconnectedNodesToLevelsAutoLayout(startLevelIdx);

				// in case there are no other nodes, add an empty middle level
				var remainingNodes = Utils.subtractArrays(_flowLayout.getNonSuppressedNodes(), startNodes);
				if (remainingNodes.length == 0) {
					var firstLevel = new Level(_flowLayout.getLevels().length);
					_flowLayout.getLevels().push(firstLevel);
				}

				// end nodes, if any
				var endNodes = nodesCollector.getEndNodes();
				if (config.hasStartEndLevels()) {
					var endLevel = new Level(_flowLayout.getLevels().length);
					endLevel.setEndLevel(true);
					_flowLayout.getLevels().push(endLevel);
					for (i = 0; i < endNodes.length; i++) {
						self.createNewCellToLevel(endNodes[i], endLevel);
					}
				}
				//printSteps();
			};

			/**
			 * NEW 1
			 * assign in order:
			 * - start nodes side targets
			 * - side sources to first level candidates
			 * - first level candidates
			 */
			self.assignNodesToFirstLevelsAutoLayout = function(candidates) {
				var nodesCollector = _flowLayout.getNodesCollector();

				var i, node, rm, nextLevel, startLevelIdx = _flowLayout.getLevels().length;
				var candidatesCopy = candidates.slice(0);
				var assignedNodes = [];
				// first assign side nodes
				//////////////
				// get a copy of left/top nodes
				var leftTopNodes = nodesCollector.getLeftTopNodes().slice(0);
				// left/top start targets
				var leftStartTargets = nodesCollector.getStartNodesLeftTargets();
				if (leftStartTargets.length > 0) {
					for (i = 0; i < leftStartTargets.length; i++) {
						node = leftStartTargets[i];
						nextLevel = new Level(_flowLayout.getLevels().length);
						self.createNewCellToLevel(node, nextLevel);
						assignedNodes.push(node);
						rm = candidatesCopy.indexOf(node);
						candidatesCopy.splice(rm, 1);
						rm = leftTopNodes.indexOf(node);
						leftTopNodes.splice(rm, 1);
						_flowLayout.getLevels().push(nextLevel);
					}
				}
				// left/top sources to first levels
				var leftSources =
					leftTopNodes.length === 0 ? [] : nodesCollector.getConnectedSources(leftTopNodes, candidates);
				leftSources = leftSources.concat(nodesCollector.getLeftNoInputNodes());
				if (leftSources.length > 0) {
					for (i = 0; i < leftSources.length; i++) {
						node = leftSources[i];
						nextLevel = new Level(_flowLayout.getLevels().length);
						self.createNewCellToLevel(node, nextLevel);
						assignedNodes.push(node);
						rm = candidatesCopy.indexOf(node);
						candidatesCopy.splice(rm, 1);
						rm = leftTopNodes.indexOf(node);
						leftTopNodes.splice(rm, 1);
						_flowLayout.getLevels().push(nextLevel);
					}
				}
				///////////
				// get a copy of right/bottom nodes
				var rightBottomNodes = nodesCollector.getRightBottomNodes().slice(0);
				// right/bottom start targets
				var idx = startLevelIdx;
				var rightStartTargets = nodesCollector.getStartNodesRightTargets();
				if (rightStartTargets.length > 0) {
					for (i = 0; i < rightStartTargets.length; i++) {
						node = rightStartTargets[i];
						if (idx < _flowLayout.getLevels().length) {
							nextLevel = _flowLayout.getLevels()[idx];
							self.createNewCellToLevel(node, nextLevel);
							assignedNodes.push(node);
							rm = candidatesCopy.indexOf(node);
							candidatesCopy.splice(rm, 1);
						} else {
							nextLevel = new Level(_flowLayout.getLevels().length);
							self.createNewCellToLevel(node, nextLevel);
							assignedNodes.push(node);
							rm = candidatesCopy.indexOf(node);
							candidatesCopy.splice(rm, 1);
							_flowLayout.getLevels().push(nextLevel);
						}
						idx++;
						//rightBottomNodes.remove(node);
						rm = rightBottomNodes.indexOf(node);
						rightBottomNodes.splice(rm, 1);

					}
				}
				// right/bottom sources to first levels
				var rightSources =
					rightBottomNodes.length === 0 ? [] : nodesCollector.getConnectedSources(rightBottomNodes, candidates);
				rightSources = rightSources.concat(nodesCollector.getRightNoInputNodes());
				if (rightSources.length > 0) {
					for (i = 0; i < rightSources.length; i++) {
						node = rightSources[i];
						if (idx < _flowLayout.getLevels().length) {
							nextLevel = _flowLayout.getLevels()[idx];
							self.createNewCellToLevel(node, nextLevel);
							assignedNodes.push(node);
							rm = candidatesCopy.indexOf(node);
							candidatesCopy.splice(rm, 1);
						} else {
							nextLevel = new Level(_flowLayout.getLevels().length);
							self.createNewCellToLevel(node, nextLevel);
							assignedNodes.push(node);
							rm = candidatesCopy.indexOf(node);
							candidatesCopy.splice(rm, 1);
							_flowLayout.getLevels().push(nextLevel);
						}
						idx++;
						//rightBottomNodes.remove(node);
						rm = rightBottomNodes.indexOf(node);
						rightBottomNodes.splice(rm, 1);
					}
				}
				///////////
				// now add first levels candidates at the start level
				if (candidatesCopy.length > 0) {
					nextLevel = startLevelIdx < _flowLayout.getLevels().length ?
						_flowLayout.getLevels()[startLevelIdx] : new Level(startLevelIdx);
		            for (i = candidatesCopy.length-1; i >= 0; i--) {
						node = candidatesCopy[i];
		                self.createNewCellToLevel(node, nextLevel);
		                assignedNodes.push(node);
			            candidatesCopy.splice(i, 1);
		            }
					if (startLevelIdx === _flowLayout.getLevels().length) {
						_flowLayout.getLevels().push(nextLevel);
					}
				}

				// last assign decision nodes, if any
				// TODO: all candidates should be assigned already, test it!!!
				if (candidatesCopy.length > 0) {
					if (DEBUG) console.log("??? first level candidates left: "+candidatesCopy.length);
					var decisionNodes = self.assignDecisionNodesToLevelsAutoLayout(
													assignedNodes, candidatesCopy, startLevelIdx);
					assignedNodes = assignedNodes.concat(decisionNodes);
				}
				return assignedNodes;
			};

			/**
			 * NEW 2
			 * parentNodes - all assigned so far in previous steps
			 */
			self.assignNodesToNextLevelAutoLayout = function(parentNodes) {
				var nodesCollector = _flowLayout.getNodesCollector();

				var i, startLevelIdx = _flowLayout.getLevels().length;
				var firstEmptyCenterLevelIndex = nodesLayoutUtl.getFirstCenterEmptyLevelIndex(_flowLayout.getLevels());
				if (firstEmptyCenterLevelIndex === GraphNode.LEVEL_UNDEF) {
					firstEmptyCenterLevelIndex = startLevelIdx;
				}

				var assignedNodes = [];
				var allTargets = [];
				// get the targets
				for (i = 0; i < parentNodes.length; i++) {
					allTargets = allTargets.concat(nodesLayoutUtl.getCentralTargets(parentNodes[i], allTargets));
				}
				// assign external side sources to allTargets
				var leftTopSources =
					nodesCollector.getConnectedSources(nodesCollector.getLeftTopNodes(), allTargets);
				var rightBottomSources =
					nodesCollector.getConnectedSources(nodesCollector.getRightBottomNodes(), allTargets);
				var sideSources = self.assignSideNodesToLevelsAutoLayout(
											leftTopSources, rightBottomSources, startLevelIdx);
				assignedNodes = assignedNodes.concat(sideSources);
				// get side targets
				var sideNodesAtLevel = nodesLayoutUtl.getNodesAtLevel(sideSources, startLevelIdx);
				for (i = 0; i < sideNodesAtLevel.length; i++) {
					allTargets = allTargets.concat(nodesLayoutUtl.getCentralTargets(sideNodesAtLevel[i], allTargets));
				}

				// assign internal side targets
				var leftTopTargets = nodesLayoutUtl.getLeftLaneNodes(allTargets);
				var rightBottomTargets = nodesLayoutUtl.getRightLaneNodes(allTargets);
				var sideTargets = self.assignSideNodesToLevelsAutoLayout(
											leftTopTargets, rightBottomTargets, startLevelIdx);
				//assignedNodes.addAll(sideTargets);
				assignedNodes = Utils.mergeArrays(assignedNodes, sideTargets);
				// update allTargets
				allTargets = Utils.subtractArrays(allTargets, leftTopTargets);
				allTargets = Utils.subtractArrays(allTargets, rightBottomTargets);

				// now assign remaining nodes
				if (allTargets.length > 0) {
					var node, nextLevel;
					if (firstEmptyCenterLevelIndex < _flowLayout.getLevels().length) {
						nextLevel = _flowLayout.getLevels()[firstEmptyCenterLevelIndex];
						var levelNodes = nextLevel.getNodes().slice(0);
						//levelNodes.addAll(allTargets);
						levelNodes = Utils.mergeArrays(levelNodes, allTargets);
						for (i = 0; i < allTargets.length; i++) {
							node = allTargets[i];
							if (node.isLevelAssigned()) {
								continue;
							}
							// TODO: case of closed loop !!!
							if (nodesLayoutUtl.isNodeTargetOf(node, levelNodes)) {
								//continue;
							}
							self.createNewCellToLevel(node, nextLevel);
							assignedNodes.push(node);
						}

					} else {
						nextLevel = new Level(_flowLayout.getLevels().length);
						for (i = 0; i < allTargets.length; i++) {
							node = allTargets[i];
							if (node.isLevelAssigned()) {
								continue;
							}
							self.createNewCellToLevel(node, nextLevel);
							assignedNodes.push(node);
						}
						if (nextLevel.getNodes().length > 0) {
							_flowLayout.getLevels().push(nextLevel);
						}
					}
				}

				return assignedNodes;
			};

			/**
			 * NEW 4
			 */
			self.assignDecisionNodesToLevelsAutoLayout = function(assignedNodes, targetNodes, levelToStartIdx) {

				var leftAssigned = nodesLayoutUtl.getLeftLaneNodes(assignedNodes),
					rightAssigned = nodesLayoutUtl.getRightLaneNodes(assignedNodes),
					assignedDecisionNodes = [], i, idx, node, nextLevel, leftTargets, rightTargets;

				var decisionNodes = nodesLayoutUtl.getDecisionNodes(targetNodes);
				// first assign decision nodes connected to sides
				for (i = 0; i < decisionNodes.length; i++) {
					node = decisionNodes[i];
					leftTargets = nodesLayoutUtl.getConnectedNodes(leftAssigned, node);
					rightTargets = nodesLayoutUtl.getConnectedNodes(rightAssigned, node);
					if (leftTargets.length > 0) {
						var leftNode = leftTargets[0];
						idx = leftNode.getLevelNumber();
						// should be assigned, but just in case:
						if (idx > GraphNode.LEVEL_UNDEF) {
							nextLevel = _flowLayout.getLevels()[idx];
							self.createNewCellToLevel(node, nextLevel);
							assignedDecisionNodes.push(node);
						}
					} else if (rightTargets.length > 0) {
						var rightNode = rightTargets[0];
						idx = rightNode.getLevelNumber();
						// should be assigned, but just in case:
						if (idx > GraphNode.LEVEL_UNDEF) {
							nextLevel = _flowLayout.getLevels()[idx];
							self.createNewCellToLevel(node, nextLevel);
							assignedDecisionNodes.push(node);
						}
					}
				}
				// next assign unconnected decision nodes
				for (i = 0; i < decisionNodes.length; i++) {
					node = decisionNodes[i];
					if (node.isLevelAssigned()) {
						continue;
					}
					leftTargets = nodesLayoutUtl.getConnectedNodes(leftAssigned, node);
					rightTargets = nodesLayoutUtl.getConnectedNodes(rightAssigned, node);
					if (leftTargets.length === 0 && rightTargets.length === 0) {
						nextLevel = new Level(_flowLayout.getLevels().length);
						self.createNewCellToLevel(node, nextLevel);
						assignedDecisionNodes.push(node);
						_flowLayout.getLevels().push(nextLevel);
					}
				}
				return assignedDecisionNodes;
			};

			/**
			 * NEW 3
			 */
			self.assignSideNodesToLevelsAutoLayout = function(leftTopNodes, rightBottomNodes, levelToStartIdx) {
				var assignedNodes = [];
				// left/top
				var i, node, nextLevel, idx = levelToStartIdx;
				for (i = 0; i < leftTopNodes.length; i++) {
					node = leftTopNodes[i];
					if (node.isLevelAssigned()) {
						continue;
					}
					if (idx < _flowLayout.getLevels().length) {
						nextLevel = _flowLayout.getLevels()[idx];
						self.createNewCellToLevel(node, nextLevel);
						assignedNodes.push(node);
						idx++;
					} else {
						nextLevel = new Level(_flowLayout.getLevels().length);
						self.createNewCellToLevel(node, nextLevel);
						assignedNodes.push(node);
						_flowLayout.getLevels().push(nextLevel);
						idx++;
					}

				}
				// right/bottom
				idx = levelToStartIdx;
				for (i = 0; i < rightBottomNodes.length; i++) {
					node = rightBottomNodes[i];
					if (node.isLevelAssigned()) {
						continue;
					}
					if (idx < _flowLayout.getLevels().length) {
						nextLevel = _flowLayout.getLevels()[idx];
						self.createNewCellToLevel(node, nextLevel);
						assignedNodes.push(node);
						idx++;
					} else {
						nextLevel = new Level(_flowLayout.getLevels().length);
						self.createNewCellToLevel(node, nextLevel);
						assignedNodes.push(node);
						_flowLayout.getLevels().push(nextLevel);
						idx++;
					}
				}
				return assignedNodes;
			};

			/**
			 * both center and side unconnected nodes start atlayout.getLevels().length
			 */
			self.assignUnconnectedNodesToLevelsAutoLayout = function(startLevelIdx) {
				var nodesCollector = _flowLayout.getNodesCollector();

				var centerNoCnxNodes = nodesCollector.getCenterNoCnxNodes();
				// assign all to one level, will reassign levels when lanes get assigned
				if (centerNoCnxNodes.length > 0) {
					var nextLevel = new Level(startLevelIdx);
					for (var i = 0; i < centerNoCnxNodes.length; i++) {
						self.createNewCellToLevel(centerNoCnxNodes[i], nextLevel);
					}
					_flowLayout.getLevels().push(nextLevel);
				}

				var leftNoCnxNodes = nodesCollector.getLeftTopNoCnxNodes();
				var rightNoCnxNodes = nodesCollector.getRightBottomNoCnxNodes();
				self.assignSideNodesToLevelsAutoLayout(leftNoCnxNodes, rightNoCnxNodes, startLevelIdx);
			};

			/**
			 *
			 * @param noCnxNodes
			 * @returns {number}
			 */
			self.getUnconnectedNodesSquareSize = function(noCnxNodes) {
				return Math.ceil(Math.sqrt(noCnxNodes.length));
			};


			/***************************************  OK
			 *  START LANES UNFIXED, assign lanes from scratch
			 ***************************************/
			self.assignNewLanesAutoLayout = function() {
				if (_flowLayout.getLevels().length === 0) {
					console.log("WARNING: assignNewLanesAutoLayout - NO LEVELS");
					return;
				}

				var nodesCollector = _flowLayout.getNodesCollector(), i, level, endLevel;
				//////////////////////////////////////////
				// maxLanesNum will be the number of lanes
				// it should be odd number and never < 3
				//////////////////////////////////////////
				// TODO: make sure this is not needed
				var useSideLanes = config.hasSideSwimLanes(),
					useStartEndLevels = config.hasStartEndLevels();
				var maxLanesNum = 1;
				//maxLanesNum += useSideLanes ? 2 : 0;
				var endLevelSize = nodesCollector.getEndNodes().length + (useSideLanes ? 2 : 0);

				var centerNoCnxNodes = nodesCollector.getCenterNoCnxNodes();
				var leftNoCnxNodes = nodesCollector.getLeftTopNoCnxNodes();
				var rightNoCnxNodes = nodesCollector.getRightBottomNoCnxNodes();
				var allConnectedNodes = Utils.subtractArrays(_flowLayout.getNonSuppressedNodes(), centerNoCnxNodes);
				allConnectedNodes = Utils.subtractArrays(allConnectedNodes, leftNoCnxNodes);
				allConnectedNodes = Utils.subtractArrays(allConnectedNodes, rightNoCnxNodes);
				var unconnectedSquareSize = self.getUnconnectedNodesSquareSize(centerNoCnxNodes);

				var minCentralLanesNum = Math.max(nodesCollector.getEndNodes().length, unconnectedSquareSize);

				// IMPORTANT: here we calculate nodes footprints BY LEVEL !!!
				maxLanesNum += useStartEndLevels ?
					nodesLayoutUtl.getDescendantsTreeWidthByLevel(_flowLayout.getLevels()[0]) +
					nodesLayoutUtl.getDescendantsTreeWidthByLevel(_flowLayout.getLevels()[1])
					:
					nodesLayoutUtl.getDescendantsTreeWidthByLevel(_flowLayout.getLevels()[0]);
				// there might be duplicates, that's fine
				maxLanesNum += nodesLayoutUtl.getDescendantsTreeWidth(nodesCollector.getLeftTopNodes());
				maxLanesNum += nodesLayoutUtl.getDescendantsTreeWidth(nodesCollector.getRightBottomNodes());
				// just in case, doesn't hurt, but might help, define a larger number of lanes ???
				// maxLanesNum *= 2;

				maxLanesNum = Math.max(maxLanesNum, unconnectedSquareSize);
				maxLanesNum = Math.max(maxLanesNum, endLevelSize);
				maxLanesNum += useSideLanes ? 2 : 0;

				// initialize lanes: order corresponds to coordinate axes directions
				for (i = 0; i < maxLanesNum; i++) {
					var lane = new Lane(i);
					_flowLayout.getLanes().push(lane);
				}

				if (config.hasSideSwimLanes()) {
					_flowLayout.getLanes()[0].setLeftLane(true);
					_flowLayout.getLanes()[_flowLayout.getLanes().length-1].setRightLane(true);
				}
				var hasStartLevelNodes = useStartEndLevels && _flowLayout.getLevels()[0].getNodes().length > 0;
				if (hasStartLevelNodes) {
					// start nodes, if any
					self.assignLanesForLevelAutoLayout(_flowLayout.getLevels()[0], useSideLanes, true);
				}
				var startNodes = nodesLayoutUtl.getStartNodes(_flowLayout.getNonSuppressedNodes());
				allConnectedNodes = Utils.subtractArrays(allConnectedNodes, startNodes);
				var currentLevelNum = useStartEndLevels ? 1 : 0;
				var nextLevelNum = currentLevelNum;
				var lastInLevelIdx = useStartEndLevels ?
					_flowLayout.getLevels().length-2 : _flowLayout.getLevels().length-1;

				var doneLastLevel = false;
				// start nodes are already taken care of
				if (allConnectedNodes.length > 0) {
					if (nodesLayoutUtl.hasAssignedLevels(_flowLayout.getLevels())) {
						// get the first non-empty level, levels size is expected to be always > 0 ???
						while (_flowLayout.getLevels().length > currentLevelNum &&
								_flowLayout.getLevels()[currentLevelNum].getCells().length === 0) {
							currentLevelNum++;
						}
						// stop: where unconnected nodes are found, or last level before end, if there
						var currentLevel = _flowLayout.getLevels()[currentLevelNum];
						// IMPORTANT: account for first level
						self.assignLanesForLevelAutoLayout(currentLevel, useSideLanes, !hasStartLevelNodes);
						nextLevelNum++;
						// remaining levels
						var levels = _flowLayout.getLevels();
						for (i = 0; i < levels.length; i++) {
							level = levels[i];
							//printLanes("level="+level.getOrder());
							if (level.getOrder() > currentLevelNum &&
								level.getOrder() <= lastInLevelIdx) {
								// TODO: only center nodes
								if (nodesLayoutUtl.areAllUnconnected(level.getNodes())) {
									break;
								}
								self.assignLanesForLevelAutoLayout(level, useSideLanes, false);
								nextLevelNum++;
							}
						}
					}
					//printLanes("connected levels 1");
					var currentNodes = allConnectedNodes.slice(0);
					currentNodes = Utils.subtractArrays(currentNodes, nodesCollector.getEndNodes());
					removeEmptyLanesUnallocated(currentNodes, minCentralLanesNum);
					//printLanes("connected levels 2");

					if (useStartEndLevels) {
						endLevel = _flowLayout.getLevels()[_flowLayout.getLevels().length-1];
						// first connected only
						self.assignLanesForEndLevelAutoLayout(endLevel, true, useSideLanes);
						// then unconnected only
						self.assignLanesForEndLevelAutoLayout(endLevel, false, useSideLanes);
						doneLastLevel = true;
					}
				}

				//
				if (centerNoCnxNodes.length > 0 || leftNoCnxNodes.length > 0 || rightNoCnxNodes.length > 0) {
					// range is incremented to account for existing lanes
					var laneRange = self.getCurrentLaneRange(0)+1;
					var centerSize = Math.max(laneRange, self.getUnconnectedNodesSquareSize(centerNoCnxNodes));
					// this is the first level with no-connections nodes
					var currIdx = nextLevelNum;
					// update needed ??
					lastInLevelIdx = useStartEndLevels ?
						_flowLayout.getLevels().length-2 : _flowLayout.getLevels().length-1;
					// assumption is that all centerNoCnxNodes are assigned to a single level
					// and we need to reassign levels
					//printLanes("before noCnx");
					for (i = 0; i < centerNoCnxNodes.length; ) {
						//Level nextLevel = currIdx == nextLevelNum ?
						var nextLevel = currIdx <= lastInLevelIdx ?
							_flowLayout.getLevels()[currIdx] :
							new Level(currIdx);
						var cnt = 0;
						while (cnt < centerSize &&  i < centerNoCnxNodes.length) {
							if (currIdx != nextLevelNum) {
								var node = centerNoCnxNodes[i];
								self.reassignCellToLevel(node, nextLevel);
							}
							i++;
							cnt++;
						}
						if (currIdx > lastInLevelIdx) {
							_flowLayout.getLevels().splice(currIdx, 0, nextLevel);
						}
						currIdx++;
					}
					// update needed
					lastInLevelIdx = useStartEndLevels ?
						_flowLayout.getLevels().length-2 : _flowLayout.getLevels().length-1;

					for (var idx = nextLevelNum; idx <= lastInLevelIdx; idx++) {
						level = _flowLayout.getLevels()[idx];
						self.assignLanesForLevelAutoLayout(level, useSideLanes, false);
						//printLanes("level="+level.getOrder());
					}

					// TODO: see if this is ok when there are more levels on the sides
					if (useStartEndLevels && nextLevelNum < lastInLevelIdx) {
						// reassign end level index
						endLevel = _flowLayout.getLevels()[_flowLayout.getLevels().length-1];
						endLevel.setOrder(currIdx);
						var endNodes = endLevel.getNodes();
						for (i = 0; i < endNodes.length; i++) {
							self.reassignCellToLevel(endNodes[i], endLevel);
						}
					}

				}

				// last end nodes
				if (useStartEndLevels && !doneLastLevel) {
					var lastIdx = _flowLayout.getLevels().length-1;
					var lastLevel = _flowLayout.getLevels()[lastIdx];
					self.assignLanesForLevelAutoLayout(lastLevel, useSideLanes, false);
				}

				self.removeEmptyLanes();

			};

			self.getCurrentLaneRange = function(minRange) {
				var minLaneIdx = nodesLayoutUtl.getFirstNonEmptyCentralLaneIndex(_flowLayout.getLanes());
				var maxLaneIdx = nodesLayoutUtl.getLastNonEmptyCentralLaneIndex(_flowLayout.getLanes());
				var range = maxLaneIdx - minLaneIdx;
				return Math.max(range, minRange);
			};

			/***************************************  OK
			 *  UNFIXED, do layout from scratch
			 ***************************************/
			self.assignLanesForLevelAutoLayout = function(level, useSideLanes, isStartLevel)  {
				if (DEBUG) console.log("$ assignLanesForLevelAutoLayout: "+level.getOrder()+", "+useSideLanes+", "+isStartLevel);
				var levelNodes = level.getNodes().slice(0);
				var leftNode = level.getLeftLaneNode(),
					rightNode = level.getRightLaneNode(),
					i, node, rm, cell, idx, lanePos;
				if (leftNode) {
					cell = _flowLayout.getNodeToCellMap().get(leftNode.getName());
					if (cell) {
						_flowLayout.getLanes()[0].addCell(cell);
						idx = levelNodes.indexOf(leftNode);
						levelNodes.splice(idx, 1);
					} else {
						if (DEBUG) console.log(
							"assignLanesForLevelUnallocated: Could not find cell for node "+leftNode.getName());
					}
				}
				if (rightNode) {
					cell = _flowLayout.getNodeToCellMap().get(rightNode.getName());
					if (cell) {
						_flowLayout.getLanes()[_flowLayout.getLanes().length-1].addCell(cell);
						//levelNodes.remove(rightNode);
						rm = levelNodes.indexOf(rightNode);
						levelNodes.splice(rm, 1);
					} else {
						if (DEBUG) console.log(
							"assignLanesForLevelUnallocated: Could not find cell for node "+rightNode.getName());
					}
				}
				if (levelNodes.length === 0) {
					return;
				}
				//
				var off = useSideLanes ? 1 : 0,
					minIdx = useSideLanes ? 1 : 0,
					maxIdx = useSideLanes ? _flowLayout.getLanes().length-2 : _flowLayout.getLanes().length-1;

				if (isStartLevel) {
					// start level
					var currPos = minIdx;
					for (i = 0; i < levelNodes.length; i++) {
						node = levelNodes[i];
						var footPrint = node.getLaneFootprint();
						if (currPos + Math.floor(footPrint/2) > maxIdx) {
							if (DEBUG) console.log("Could not allocate lane for node "+node.getName());
							continue;
						}
						cell = _flowLayout.getNodeToCellMap().get(node.getName());
						if (cell) {
							_flowLayout.getLanes()[currPos + Math.floor(footPrint/2)].addCell(cell);
						} else {
							if (DEBUG) console.log("Could not find cell for node "+node.getName());
						}
						currPos += footPrint;
					}
				} else {
					// look for parents lanes
					// TODO
					var nodes = levelNodes.slice(0);

					// first look at decision children
					for (i = nodes.length-1; i >= 0; i--) {
						node = nodes[i];
						var decisionParent = nodesLayoutUtl.getDecisionParent(node);
						if (decisionParent) {
							if (!decisionParent.isAllocated()) {
								continue;
							}
							var position = nodesLayoutUtl.getDecisionChildPosition(
								decisionParent, node, config.getFlowDirection());
							lanePos = nodesLayoutUtl.getNewLanePosition(level, position, minIdx, maxIdx);
							if (lanePos === GraphNode.LANE_UNDEF) {
								if (DEBUG) console.log(
									"[assignLanesForLevelAutoLayout]: Failed to find lane position for node: "
									+node.getName()+" at level: "+level.getOrder());
								nodes.splice(i, 1);
								continue;
							}
							cell = _flowLayout.getNodeToCellMap().get(node.getName());
							if (cell) {
								_flowLayout.getLanes()[lanePos].addCell(cell);
							} else {
								if (DEBUG) console.log("Could not find cell for node "+node.getName());
							}
							nodes.splice(i, 1);
						}
					}
					// continue for the rest
					for (i = nodes.length-1; i >= 0; i--) {
						node = nodes[i];
						var parents = nodesLayoutUtl.getSourceNodes(node);
						if (parents.length > 0) {
							var preferredPos = nodesLayoutUtl.getAverageLanePosition(parents);
							lanePos = nodesLayoutUtl.getNewLanePosition(level, preferredPos, minIdx, maxIdx);
							if (lanePos === GraphNode.LANE_UNDEF) {
								if (DEBUG) console.log(
									"[assignLanesForLevelAutoLayout]: Failed to find lane position for node: "
									+node.getName()+" at level: "+level.getOrder());
								// TODO ??
								nodes.splice(i, 1);
								continue;
							}
							cell = _flowLayout.getNodeToCellMap().get(node.getName());
							if (cell) {
								_flowLayout.getLanes()[lanePos].addCell(cell);
							} else {
								if (DEBUG) console.log("Could not find cell for node "+node.getName());
							}
							nodes.splice(i, 1);
						}
					}
					if (nodes.length > 0) {
						// some nodes without input connections ???
						// TODO : currently this is left adjusted
						for (i = 0; i < nodes.length; i++) {
							node = nodes[i];
							lanePos = nodesLayoutUtl.getNextLanePositionInLevel(level, node, minIdx, maxIdx);
							if (lanePos >= 0 && lanePos < _flowLayout.getLanes().length) {
								cell = _flowLayout.getNodeToCellMap().get(node.getName());
								if (cell) {
									_flowLayout.getLanes()[lanePos].addCell(cell);
								} else {
									if (DEBUG) console.log("Could not find cell for node "+node.getName());
								}
							} else {
								if (DEBUG) console.log("Calculated position out of range: "+
									lanePos+" ["+0+","+_flowLayout.getLanes().length+"]");
							}
						}
					}
				}
			};

			self.assignLanesForEndLevelAutoLayout = function(level, connectedOnly, useSideLanes) {
				var allNodes = level.getNodes();
				if (allNodes.length === 0) {
					return;
				}
				var minIdx = useSideLanes ? 1 : 0,
					maxIdx = useSideLanes ? _flowLayout.getLanes().length-2 : _flowLayout.getLanes().length- 1,
					i, nodes, node, cell, lanePos;

				if (connectedOnly) {
					nodes = nodesLayoutUtl.getNodesWithConnections(allNodes);
					// first look at decision children
					for (i = nodes.length-1; i >= 0; i--) {
						node = nodes[i];
						var decisionParent = nodesLayoutUtl.getDecisionParent(node);
						if (decisionParent) {
							var position = nodesLayoutUtl.getDecisionChildPosition(
								decisionParent, node, config.getFlowDirection());
							lanePos = nodesLayoutUtl.getNewLanePosition(level, position, minIdx, maxIdx);
							if (lanePos === GraphNode.LANE_UNDEF) {
								if (DEBUG) console.log(
									"[assignLanesForEndLevelUnallocated]: Failed to find lane position for node: "
									+node.getName()+" at level: "+level.getOrder());
								nodes.splice(i, 1);
								continue;
							}
							cell = _flowLayout.getNodeToCellMap().get(node.getName());
							if (cell) {
								_flowLayout.getLanes()[lanePos].addCell(cell);
							} else {
								if (DEBUG) console.log("Could not find cell for node "+node.getName());
							}
							nodes.splice(i, 1);
						}
					}
					// continue for the rest
					for (i = nodes.length-1; i >= 0; i--) {
						node = nodes[i];
						var parents = nodesLayoutUtl.getSourceNodes(node);
						if (parents.length > 0) {
							var preferredPos = nodesLayoutUtl.getAverageLanePosition(parents);
							lanePos = nodesLayoutUtl.getNewLanePosition(level, preferredPos, minIdx, maxIdx);
							if (lanePos === GraphNode.LANE_UNDEF) {
								if (DEBUG) console.log(
									"[assignLanesForEndLevelUnallocated]: Failed to find lane position for node: "
									+node.getName()+" at level: "+level.getOrder());
								nodes.splice(i, 1);
								continue;
							}
							cell = _flowLayout.getNodeToCellMap().get(node.getName());
							if (cell) {
								_flowLayout.getLanes()[lanePos].addCell(cell);
							} else {
								if (DEBUG) console.log("Could not find cell for node "+node.getName());
							}
							nodes.splice(i, 1);
						}
					}

				} else {
					// unconnected
					nodes = nodesLayoutUtl.getUnconnectedNodes(allNodes);
					for (i = 0; i < nodes.length; i++) {
						node = nodes[i];
						lanePos = nodesLayoutUtl.getNextLanePositionInLevel(level, node, minIdx, maxIdx);
						if (lanePos >= 0 && lanePos < _flowLayout.getLanes().length) {
							cell = _flowLayout.getNodeToCellMap().get(node.getName());
							if (cell) {
								_flowLayout.getLanes()[lanePos].addCell(cell);
							} else {
								if (DEBUG) console.log("Could not find cell for node "+node.getName());
							}
						} else {
							if (DEBUG) console.log("Calculated position out of range: "+
								lanePos+" ["+0+","+_flowLayout.getLanes().length+"]");
						}
					}
				}
			};


			/**
			 * trim empty lanes not below toSize AUTO
			 */
			function removeEmptyLanesUnallocated(connectedNodes, toSize) {
				if (!doRemoveEmptyLanes()) {
					return;
				}
				var startTotalLanes = config.hasSideSwimLanes() ?
					_flowLayout.getLanes().length-2 : _flowLayout.getLanes().length;
				if (startTotalLanes <= toSize) {
					return;
				}
				//NodesCollector nodesCollector = _layout.getNodesCollector();
				var lanesToTrim = startTotalLanes - toSize,
					i, lanes;
				// used lanes, exclude side lane nodes
				var leftNodes = nodesLayoutUtl.getLeftLaneNodes(connectedNodes);
				var rightNodes = nodesLayoutUtl.getRightLaneNodes(connectedNodes);
				var centerNodes = Utils.subtractArrays(connectedNodes, leftNodes);
				centerNodes = Utils.subtractArrays(centerNodes, rightNodes);
				// get the leftmost lane index, excluding left/top lane, if available
				var leftMostIdx = config.hasSideSwimLanes() ? 1 : 0;
				var minLaneIdx = nodesLayoutUtl.getMinLaneIndex(centerNodes);
				var maxLaneIdx = nodesLayoutUtl.getMaxLaneIndex(centerNodes);
				var middleEmptyNumber = nodesLayoutUtl.getEmptyLanesNumber(_flowLayout.getLanes(), minLaneIdx, maxLaneIdx);
				// max number of lanes to be removed on middle, left and right, wherever needed
				//int middleTrim = 0, leftTrim = 0, rightTrim = 0;
				if (middleEmptyNumber === 0) {
					//leftTrim = rightTrim = lanesToTrim%2 == 0 ? lanesToTrim/2 : lanesToTrim/2+1;
					//leftTrim = rightTrim = lanesToTrim/2;
				} else {
					if (middleEmptyNumber >= lanesToTrim) {
						//middleTrim = lanesToTrim;
					} else {
						//middleTrim = middleEmptyNumber;
						//int sideTrim = lanesToTrim - middleEmptyNumber;
						//leftTrim = rightTrim = sideTrim%2 == 0 ? sideTrim/2 : sideTrim/2+1;
						//leftTrim = rightTrim = sideTrim/2;
					}
				}
				//// LEFT
				// remove empty lanes on the left but no more than lanesToTrim
				if (minLaneIdx - leftMostIdx > 0) {
					// shift left/top
					lanes = _flowLayout.getLanes();
					for (i = lanes.length-1; i >= 0; i--) {
						var lane = lanes[i];
						if (lane.getOrder() >= leftMostIdx &&
								lane.getNodes().length == 0 &&
								lane.getOrder() < minLaneIdx && lanesToTrim > 0) {
							lanes.splice(i,1);
							lanesToTrim--;
						}
					}
				}
				self.readjustLanesOrders();

				//// MIDDLE
				// remove empty lanes anywhere in the middle, but no more than lanesToTrim
				minLaneIdx = nodesLayoutUtl.getMinLaneIndex(centerNodes);
				maxLaneIdx = nodesLayoutUtl.getMaxLaneIndex(centerNodes);
				if (middleEmptyNumber > 0) {
					var midStartIdx = nodesLayoutUtl.getFirstEmptyLaneIndex(_flowLayout.getLanes(), minLaneIdx, maxLaneIdx);
					lanes = _flowLayout.getLanes();
					for (i = lanes.length-1; i >= 0; i--) {
						lane = lanes[i];
						if (lane.getOrder() < midStartIdx) {
							continue;
						}
						if (lane.getNodes().length === 0 && lane.getOrder() < maxLaneIdx && lanesToTrim > 0) {
							lanes.splice(i,1);
							lanesToTrim--;
						}
					}
					self.readjustLanesOrders();
				}

				//// RIGHT
				// remove empty lanes on the right side, but no more than lanesToTrim
				maxLaneIdx = nodesLayoutUtl.getMaxLaneIndex(centerNodes);
				var rightMostIdx = config.hasSideSwimLanes() ?
					_flowLayout.getLanes().length-2 : _flowLayout.getLanes().length-1;
				if (maxLaneIdx < rightMostIdx) {
					lanes = _flowLayout.getLanes();
					for (i = lanes.length-1; i >= 0; i--) {
						lane = lanes[i];
						if (lane.getOrder() <= maxLaneIdx) {
							continue;
						}
						if (lane.getNodes().length === 0 && lane.getOrder() <= rightMostIdx && lanesToTrim > 0) {
							lanes.splice(i,1);
							lanesToTrim--;
						}
					}
					self.readjustLanesOrders();
				}
			};

			self.readjustLanesOrders = function() {
				for (var i = 0; i < _flowLayout.getLanes().length; i++) {
					var lane = _flowLayout.getLanes()[i];
					if (lane.getOrder() != i) {
						lane.setOrder(i);
						var nodes = lane.getNodes();
						for (var j = 0; j < nodes.length; j++) {
							nodes[j].setLaneNumber(lane.getOrder());
						}
					}
				}
			};

			self.removeEmptyLanes = function() {
				if (!doRemoveEmptyLanes()) {
					return;
				}
				var i, lanes, lane, nodes;
				// used lanes, exclude side lane nodes
				var leftNodes = nodesLayoutUtl.getLeftLaneNodes(_flowLayout.getNonSuppressedNodes());
				var rightNodes = nodesLayoutUtl.getRightLaneNodes(_flowLayout.getNonSuppressedNodes());
				var centerNodes = Utils.subtractArrays(_flowLayout.getNonSuppressedNodes(), leftNodes);
				centerNodes = Utils.subtractArrays(centerNodes, rightNodes);
				var minLaneNum = nodesLayoutUtl.getMinLaneIndex(centerNodes);
				// existing lanes
				var leftMostNum =  config.hasSideSwimLanes() ? 1 : 0;
				// on the left
				var leftDelta = minLaneNum - leftMostNum;
				if (leftDelta > 0) {
					// shift left/top
					lanes = _flowLayout.getLanes();
					for (i = lanes.length-1; i >= 0; i--) {
						lane = lanes[i];
						if (lane.getOrder() >= leftMostNum && lane.getOrder() < minLaneNum) {
							lanes.splice(i,1);
						} else if (lane.getOrder() >= minLaneNum) {
							lane.setOrder(lane.getOrder()-leftDelta);
							nodes = lane.getNodes();
							for (i = 0; i < nodes.length; i++) {
								nodes[i].setLaneNumber(lane.getOrder());
							}
						}
					}
				}
				// anywhere in the middle
				if (!doRemoveEmptyLanes()) {
					return;
				}
				var maxLaneNum = nodesLayoutUtl.getMaxLaneIndex(centerNodes);
				var idx = nodesLayoutUtl.getFirstEmptyLaneIndex(_flowLayout.getLanes(),leftMostNum, maxLaneNum);
				while (idx > leftMostNum) {
					lanes = _flowLayout.getLanes();
					for (i = lanes.length-1; i >= 0; i--) {
						lane = lanes[i];
						if (lane.getOrder() == idx) {
							lanes.splice(i,1);
						} else if (lane.getOrder() > idx) {
							lane.setOrder(lane.getOrder()-1);
							nodes = lane.getNodes();
							for (i = 0; i < nodes.length; i++) {
								nodes[i].setLaneNumber(lane.getOrder());
							}
						}
					}
					maxLaneNum = nodesLayoutUtl.getMaxLaneIndex(centerNodes);
					idx = nodesLayoutUtl.getFirstEmptyLaneIndex(_flowLayout.getLanes(),leftMostNum, maxLaneNum);
				}

				// on the right side
				if (!doRemoveEmptyLanes()) {
					return;
				}
				maxLaneNum = nodesLayoutUtl.getMaxLaneIndex(centerNodes);
				var rightMostNum = config.hasSideSwimLanes() ?
					_flowLayout.getLanes().length-2 : _flowLayout.getLanes().length-1;
				var rightDelta = rightMostNum - maxLaneNum;
				if (rightDelta > 0) {
					//
					var trimmed = false;
					lanes = _flowLayout.getLanes();
					for (i = lanes.length-1; i >= 0; i--) {
						lane = lanes[i];
						if (lane.getOrder() > maxLaneNum &&
							lane.getOrder() <= rightMostNum &&
							doRemoveEmptyLanes()) {
							lanes.splice(i,1);
							trimmed = true;
						} else if (trimmed &&
								config.hasSideSwimLanes() &&
								lane.getOrder() === _flowLayout.getLanes().length) {
							lane.setOrder(lane.getOrder()-rightDelta);
							nodes = lane.getNodes();
							for (i = 0; i < nodes.length; i++) {
								nodes[i].setLaneNumber(lane.getOrder());
							}
						}
					}
				}

				// right/bottom lane, if any
				if (config.hasSideSwimLanes()) {
					var lastOrder = _flowLayout.getLanes().length-1;
					lane = _flowLayout.getLanes()[lastOrder];
					if (lane.isRightLane()) {
						lane.setOrder(lastOrder);
						nodes = lane.getNodes();
						for (i = 0; i < nodes.length; i++) {
							nodes[i].setLaneNumber(lane.getOrder());
						}
					}
				}
			};

			//////////////

			function doRemoveEmptyLanes() {
				var laneNum = config.hasSideSwimLanes() ?
					_flowLayout.getLanes().length-2 : _flowLayout.getLanes().length;
				return laneNum >= constants.lanesRange().MIN;
			}



			self.initialize();

		}
		return NodesLayout;
	}
);