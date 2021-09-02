define('modules/layout/pipeUtils',
	['modules/geometry/rectangle',
		'modules/graph/pipe',
		'modules/graph/cell',
		'modules/graph/segmentChannel',
		'modules/graph/graphConstants',
		'modules/layout/layoutUtils',
		'modules/layout/nodesLayoutUtils',
		'modules/layout/edgesLayoutUtils',
		'modules/diagram/diagramUtils',
		'modules/settings/config'],
	function(Rectangle,
	         Pipe,
	         Cell,
	         SegmentChannel,
	         constants,
	         layoutUtl,
			 nodesLayoutUtl,
			 edgesLayoutUtl,
	         dgmUtl,
	         config) {

		function PipeUtils(layout) {

			var self = this;
			self.layout = layout;

			var MAX_JOINT_SGM_CHECKS = 20,
				MAX_CROSSING_SGM_CHECKS = 10,
				MAX_CROSSINGS_CHECK = 20,
				CLEARANCE = Math.floor(constants.segmentsGap().MIN/2),
				DEBUG = false;

////////////////////////

			self.isFixOrRetry = function(result) {
				return result === constants.result().HAS_FIX ||
					result === constants.result().RETRY_FIX ||
					result === constants.result().FAILED;
			};

			self.isRetryRedoOrFail = function(result) {
				return result === constants.result().RETRY_FIX ||
					result === constants.result().REDO_LAYOUT ||
					result === constants.result().FAILED;
			};

			// replaced
			//self.checkAllCrossingsAtProcessNodes = function() {
			//	var i, node, nodeLevel, levelPipeToTest, check,
			//		result = constants.result().OK,
			//		bValue = false;
			//	// FRONT
			//	for (i = 0; i < self.layout.getNonSuppressedNodes().length; i++) {
			//		node = self.layout.getNonSuppressedNodes()[i];
			//		if (!node.isAllocated()) {
			//			continue;
			//		}
			//		nodeLevel = node.getLevelNumber();
			//		if (node.getFlowType() === constants.flowType().PROCESS ||
			//			node.getFlowType() === constants.flowType().CONTAINER ||
			//			node.getFlowType() === constants.flowType().TEXT ||
			//			node.getFlowType() === constants.flowType().IN_OUT ||
			//			node.getFlowType() === constants.flowType().START) {
			//			levelPipeToTest = self.layout.levelPipes[nodeLevel + 1];
			//			check = checkFrontSegmentsCrossingsAtNode(node, levelPipeToTest);
			//			if (self.isFixOrRetry(check)) {
			//				result = check;
			//				if (DEBUG)
			//					console.log(" RESULT at FRONT for " + node.getName() + ": " + result);
			//				bValue = true;
			//				//break;
			//			}
			//		}
			//	}
			//	if (bValue) {
			//		//return result;
			//	}
			//	// BACK
			//	for (i = 0; i < self.layout.getNonSuppressedNodes().length; i++) {
			//		node = self.layout.getNonSuppressedNodes()[i];
			//		if (!node.isAllocated()) {
			//			continue;
			//		}
			//		nodeLevel = node.getLevelNumber();
			//		if (node.getFlowType() ===  constants.flowType().PROCESS ||
			//			node.getFlowType() === constants.flowType().CONTAINER ||
			//			node.getFlowType() ===  constants.flowType().IN_OUT ||
			//			node.getFlowType() === constants.flowType().TEXT ||
			//			node.getFlowType() ===  constants.flowType().END) {
			//			levelPipeToTest = self.layout.levelPipes[nodeLevel];
			//			check = checkBackSegmentsCrossingsAtNode(node, levelPipeToTest);
			//			if (self.isFixOrRetry(check)) {
			//				result = check;
			//				if (DEBUG)
			//					console.log(" RESULT at BACK for " + node.getName() + ": " + result);
			//				//break;
			//			}
			//		}
			//	}
			//	return result;
			//};

			var checkFrontSegmentsCrossingsAtNode = function(node, pipeToTest) {
				var result = constants.result().OK;
				var outEdges = [];
				var outPorts = node.getOutputPorts();
				for (var i = 0; i < outPorts.length; i++) {
					if (outPorts[i].getSide() === constants.nodeSide().FRONT) {
						outEdges = outEdges.concat(outPorts[i].getEdgesList());
					}
				}
				if (outEdges.length > 1) {
					//if (node.getName() == "N3") {
					//	console.log(" ??? checkFrontSegmentsCrossingsAtNode: "+node.getName());
					//}
					var max = 0;
					while (max < MAX_CROSSINGS_CHECK) {
						result = layoutUtl.checkFrontCrossings(node, outEdges, pipeToTest);
						if (result === constants.result().OK) {
                            if (DEBUG)
								console.log(
									"!!! Resolved FRONT crossings, attempts=" + max + ", " + node.getName());
							return result;
						} else if (result === constants.result().FAILED) {
							if (DEBUG)
								console.log("##BAD## checkFrontSegmentsCrossingsAtNode FAILED, attempts=" +
									max + ", " + node.getName());
							break;
						} else if (result === constants.result().HAS_FIX || result === constants.result().RETRY_FIX) {
							if (DEBUG)
								console.log("## checkFrontSegmentsCrossingsAtNode HAS FIX, attempts=" +
									max + ", " + node.getName());
							//break;
						}
						max++;
					}
					if (result === constants.result().FAILED || max == MAX_CROSSINGS_CHECK) {
						// either failed or max attempts exceeded
						if (DEBUG)
							console.log("## EXIT: Attempts to resolve front crossings at node " + node.getName() + ", attempts=" +max);
						result = constants.result().FAILED;
					}
				}
				return result;
			};

			//MAIN NEXT
			self.checkAllCrossingsAtProcessNodesNEXT = function() {

				if (DEBUG)
					console.log("*** pipeUtils: checkAllCrossingsAtProcessNodes");
				var i, node, nodeLevel, levelPipeToTest, check,
					result = constants.result().OK,
					bValue = false;
				// FRONT
				for (i = 0; i < self.layout.getNonSuppressedNodes().length; i++) {
					node = self.layout.getNonSuppressedNodes()[i];
					if (!node.isAllocated()) {
						continue;
					}
					nodeLevel = node.getLevelNumber();
					if (node.getFlowType() === constants.flowType().PROCESS ||
						node.getFlowType() === constants.flowType().CONTAINER ||
						node.getFlowType() === constants.flowType().SWITCH ||
						node.getFlowType() === constants.flowType().TEXT ||
						node.getFlowType() === constants.flowType().IN_OUT ||
						node.getFlowType() === constants.flowType().START) {
						levelPipeToTest = self.layout.levelPipes[nodeLevel + 1];
						check = checkFrontSegmentsCrossingsAtNodeNEXT(node, levelPipeToTest);
						if (self.isFixOrRetry(check)) {
							result = check;
							if (DEBUG)
								console.log(" RESULT at FRONT for " + node.getName() + ": " + result);
							bValue = true;
							//break;
						}
					}
				}
				if (bValue) {
					//return result;
				}
				// BACK
				for (i = 0; i < self.layout.getNonSuppressedNodes().length; i++) {
					node = self.layout.getNonSuppressedNodes()[i];
					if (!node.isAllocated()) {
						continue;
					}
					nodeLevel = node.getLevelNumber();
					if (node.getFlowType() ===  constants.flowType().PROCESS ||
						node.getFlowType() === constants.flowType().DECISION ||
						node.getFlowType() === constants.flowType().SWITCH ||
						node.getFlowType() === constants.flowType().CONTAINER ||
						node.getFlowType() === constants.flowType().TEXT ||
						node.getFlowType() ===  constants.flowType().IN_OUT ||
						node.getFlowType() ===  constants.flowType().END) {
						levelPipeToTest = self.layout.levelPipes[nodeLevel];
						check = checkBackSegmentsCrossingsAtNodeNEXT(node, levelPipeToTest);
						if (self.isFixOrRetry(check)) {
							result = check;
							if (DEBUG)
								console.log(" RESULT at BACK for " + node.getName() + ": " + result);
							//break;
						}
					}
				}
				return result;
			};

			// in/out FRONT NEXT
			var checkFrontSegmentsCrossingsAtNodeNEXT = function(node, pipeToTest) {
				var result = constants.result().OK, i;
				var outEdges = [],
					inEdges = [],
					outPorts = node.getOutputPorts(),
					inPorts = node.getInputPorts();
				for (i = 0; i < outPorts.length; i++) {
					if (outPorts[i].getSide() === constants.nodeSide().FRONT) {
						outEdges = outEdges.concat(outPorts[i].getEdgesList());
					}
				}
				for (i = 0; i < inPorts.length; i++) {
					if (inPorts[i].getSide() === constants.nodeSide().FRONT) {
						inEdges = inEdges.concat(inPorts[i].getEdgesList());
					}
				}
				if (outEdges.length > 1 || inEdges.length > 1) {
					var max = 0;
					while (max < MAX_CROSSINGS_CHECK) {
						result = layoutUtl.checkFrontCrossingsNEXT(node, outEdges, inEdges, pipeToTest);
						if (result === constants.result().OK) {
                            if (DEBUG)
								console.log(
									"!!! Resolved FRONT crossings, attempts=" + max + ", " + node.getName());
							return result;
						} else if (result === constants.result().FAILED) {
							if (DEBUG)
								console.log("##BAD## checkFrontSegmentsCrossingsAtNodeNEXT FAILED, attempts=" +
									max + ", " + node.getName());
							break;
						} else if (result === constants.result().HAS_FIX || result === constants.result().RETRY_FIX) {
							if (DEBUG)
								console.log("## checkFrontSegmentsCrossingsAtNodeNEXT HAS FIX, attempts=" +
									max + ", " + node.getName());
							//break;
						}
						max++;
					}
					if (result === constants.result().FAILED || max == MAX_CROSSINGS_CHECK) {
						// either failed or max attempts exceeded
						if (DEBUG)
							console.log("## EXIT: Attempts to resolve front crossings at node " + node.getName() + ", attempts=" +max);
						result = constants.result().FAILED;
					}
				}
				return result;
			};

			// in/out BACK NEXT
			var checkBackSegmentsCrossingsAtNodeNEXT = function(node, pipeToTest) {
				var result = constants.result().OK, i;
				var outEdges = [],
					inEdges = [],
					outPorts = node.getOutputPorts(),
					inPorts = node.getInputPorts();
				for (i = 0; i < outPorts.length; i++) {
					if (outPorts[i].getSide() === constants.nodeSide().BACK) {
						outEdges = outEdges.concat(outPorts[i].getEdgesList());
					}
				}
				for (i = 0; i < inPorts.length; i++) {
					if (inPorts[i].getSide() === constants.nodeSide().BACK) {
						inEdges = inEdges.concat(inPorts[i].getEdgesList());
					}
				}
				if (outEdges.length > 1 || inEdges.length > 1) {
					var max = 0;
					while (max < MAX_CROSSINGS_CHECK) {
						result = layoutUtl.checkBackCrossingsNEXT(node, inEdges, outEdges, pipeToTest);
						if (result === constants.result().OK) {
							if (DEBUG)
							//if (node.getName() === "P1")
								console.log("!!! Resolved back crossings NEXT, attempts=" + max + ", " + node.getName());
							return result;
						} else if (result === constants.result().FAILED) {
							if (DEBUG)
							//if (node.getName() === "P1")
								console.log("## checkBackSegmentsCrossingsAtNodeNEXT FAILED, attempts=" +
									max + ", " + node.getName());
							break;
						} else if (result === constants.result().HAS_FIX || result === constants.result().RETRY_FIX) {
							if (DEBUG)
								console.log("## checkBackSegmentsCrossingsAtNodeNEXT HAS FIX, attempts=" +
									max + ", " + node.getName());
							break;
						}
						max++;
					}
					if (result === constants.result().FAILED || max === MAX_CROSSINGS_CHECK) {
						if (DEBUG)
							console.log("## EXIT: FAILED to resolve back crossings at node " + node.getName() + ", attempts=" +max);
						result = constants.result().FAILED;
					}
				}
				return result;
			};

			/**
			 * back == node inputs
			 */
			var checkBackSegmentsCrossingsAtNode = function(node, pipeToTest) {
				var result = constants.result().OK;
				var inEdges = [];
				var inPorts = node.getInputPorts();
				for (var i = 0; i < inPorts.length; i++) {
					if (inPorts[i].getSide() === constants.nodeSide().BACK) {
						inEdges = inEdges.concat(inPorts[i].getEdgesList());
					}
				}
				if (inEdges.length > 1) {
					var max = 0;
					while (max < MAX_CROSSINGS_CHECK) {
						result = layoutUtl.checkBackCrossings(node, inEdges, pipeToTest);
						if (result === constants.result().OK) {
							if (DEBUG)
							//if (node.getName() === "P1")
								console.log("!!! Resolved back crossings, attempts=" + max + ", " + node.getName());
							return result;
						} else if (result === constants.result().FAILED) {
							if (DEBUG)
							//if (node.getName() === "P1")
								console.log("## checkBackSegmentsCrossingsAtNode FAILED, attempts=" +
									max + ", " + node.getName());
							break;
						} else if (result === constants.result().HAS_FIX || result === constants.result().RETRY_FIX) {
							if (DEBUG)
								console.log("##### checkBackSegmentsCrossingsAtNode HAS FIX, attempts=" +
									max + ", " + node.getName()+", "+printInPortsOrder(node));
							//break;
						}
						max++;
					}
					if (result === constants.result().FAILED || max === MAX_CROSSINGS_CHECK) {
						if (DEBUG)
							console.log("## EXIT: FAILED to resolve back crossings at node " + node.getName() + ", attempts=" +max);
						result = constants.result().FAILED;
					}
				}
				return result;
			};

			function printInPortsOrder(node) {
				var ports = node.getInputPorts(), msg = "ports: ";
				for (var i = 0; i < ports.length; i++) {
					msg += ports[i].getName()+"("+ports[i].getOrder()+"), ";
				}
				return msg;
			}

			//self.checkAllCrossingsAtSideNodes = function() {
			//	// from flowLayout
			//	if (DEBUG)
			//		console.log("============@@@@@@@@@@@@@@@@@ pipeUtils: checkAllCrossingsAtSideNodes");
			//	var result = constants.result().OK,
			//		bValue,
			//		side,
			//		lanePipeToTest;
			//	for (var i = 0; i < self.layout.getNonSuppressedNodes().length; i++) {
			//		var node = self.layout.getNonSuppressedNodes()[i];
			//		if (!node.isAllocated()) {
			//			continue;
			//		}
			//		//console.log("============@@@@@@@@@ pipeUtils: node: "+node.getName()+", "+node.isSuppressed());
			//		// RIGHT (H) or LEFT (V)
			//		if (node.getFlowType() === constants.flowType().PROCESS ||
			//			node.getFlowType() === constants.flowType().CONTAINER ||
			//			node.getFlowType() === constants.flowType().TEXT ||
			//			node.getFlowType() === constants.flowType().IN_OUT ||
			//			node.getFlowType() === constants.flowType().LEFT_TOP) {
			//			if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
			//				side = constants.nodeSide().RIGHT;
			//				lanePipeToTest = self.layout.lanePipes[node.getLaneNumber()+1];
			//			} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
			//				side = constants.nodeSide().LEFT;
			//				lanePipeToTest = self.layout.lanePipes[node.getLaneNumber()+1];
			//			}
			//			result = checkSideSegmentsCrossingsAtNode(node, side, lanePipeToTest);
			//			if (self.isFixOrRetry(result)) {
			//				if (DEBUG)
			//					console.log(" RESULT at checkSideSegmentsCrossingsAtNode: "+
			//					node.getName()+", side: "+dgmUtl.getNodeSideName(side)+": "+result);
			//				bValue = true;
			//				break;
			//			}
			//		}
			//		if (bValue) {
			//			return result;
			//		}
			//		// LEFT (H) or RIGHT (V)
			//		if (node.getFlowType() === constants.flowType().PROCESS ||
			//			node.getFlowType() === constants.flowType().CONTAINER ||
			//			node.getFlowType() === constants.flowType().TEXT ||
			//			node.getFlowType() === constants.flowType().IN_OUT ||
			//			node.getFlowType() === constants.flowType().RIGHT_BOTTOM) {
			//			if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
			//				side = constants.nodeSide().LEFT;
			//				lanePipeToTest = self.layout.lanePipes[node.getLaneNumber()];
			//			} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
			//				side = constants.nodeSide().RIGHT;
			//				lanePipeToTest = self.layout.lanePipes[node.getLaneNumber()];
			//			}
			//			result = checkSideSegmentsCrossingsAtNode(node, side, lanePipeToTest);
			//			if (self.isFixOrRetry(result)) {
			//				if (DEBUG)
			//					console.log(" RESULT at checkSideSegmentsCrossingsAtNode: "+
			//					node.getName()+", side: "+dgmUtl.getNodeSideName(side)+": "+result);
			//				bValue = true;
			//				break;
			//			}
			//		}
			//	}
			//	return result;
			//};

			self.checkAllCrossingsAtSideNodesNEXT = function() {
				// from flowLayout
				if (DEBUG) console.log("==== pipeUtils: checkAllCrossingsAtSideNodes");
				var result = constants.result().OK, bValue;
				for (var i = 0; i < self.layout.getNonSuppressedNodes().length; i++) {
					var node = self.layout.getNonSuppressedNodes()[i];
					if (!node.isAllocated()) {
						continue;
					}
					var name = node.getName();
					var side, lanePipeToTest;
					// RIGHT (H) or LEFT (V)
					if (node.getFlowType() === constants.flowType().PROCESS ||
						node.getFlowType() === constants.flowType().CONTAINER ||
						node.getFlowType() === constants.flowType().TEXT ||
						node.getFlowType() === constants.flowType().IN_OUT ||
						node.getFlowType() === constants.flowType().LEFT_TOP) {
						if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
							side = constants.nodeSide().RIGHT;
							lanePipeToTest = self.layout.lanePipes[node.getLaneNumber()+1];
						} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
							side = constants.nodeSide().LEFT;
							lanePipeToTest = self.layout.lanePipes[node.getLaneNumber()+1];
						}
						result = checkSideSegmentsCrossingsAtNodeNEXT(node, side, lanePipeToTest);
						if (self.isFixOrRetry(result)) {
							if (DEBUG)
								console.log(" RESULT at checkSideSegmentsCrossingsAtNodeNEXT: "+
								node.getName()+", side: "+dgmUtl.getNodeSideName(side)+": "+result);
							bValue = true;
							break;
						}
					}
					if (bValue) {
						return result;
					}
					// LEFT (H) or RIGHT (V)
					if (node.getFlowType() === constants.flowType().PROCESS ||
						node.getFlowType() === constants.flowType().CONTAINER ||
						node.getFlowType() === constants.flowType().TEXT ||
						node.getFlowType() === constants.flowType().IN_OUT ||
						node.getFlowType() === constants.flowType().RIGHT_BOTTOM) {
						if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
							side = constants.nodeSide().LEFT;
							lanePipeToTest = self.layout.lanePipes[node.getLaneNumber()];
						} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
							side = constants.nodeSide().RIGHT;
							lanePipeToTest = self.layout.lanePipes[node.getLaneNumber()];
						}
						result = checkSideSegmentsCrossingsAtNodeNEXT(node, side, lanePipeToTest);
						if (self.isFixOrRetry(result)) {
							if (DEBUG)
								console.log(" RESULT at checkSideSegmentsCrossingsAtNodeNEXT: "+
								node.getName()+", side: "+dgmUtl.getNodeSideName(side)+": "+result);
							bValue = true;
							break;
						}
					}
				}
				return result;
			};

			// TBD ???
			// side === left or right
			//var getLanePipesToTest = function(lanePipe, side) {
			//	var i, testPipes = [],
			//		order = lanePipe.getOrder();
			//	testPipes.push(lanePipe);
			//	if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
			//		if (side === constants.nodeSide().LEFT) {
			//			for (i = 0; i < order; i++) {
            //
			//			}
			//		} else if (side === constants.nodeSide().RIGHT) {
            //
			//		}
			//		//laneToTest = self.layout.lanePipes[node.getLaneNumber()];
			//	} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
			//		if (side === constants.nodeSide().LEFT) {
            //
			//		} else if (side === constants.nodeSide().RIGHT) {
            //
			//		}
			//		//side = constants.nodeSide().RIGHT;
			//		//laneToTest = self.layout.lanePipes[node.getLaneNumber()];
			//	}
			//	return testPipes;
			//};

			//var checkSideSegmentsCrossingsAtNode = function(node, side, pipeToTest) {
			//	var result = constants.result().OK,
			//		sidePorts = node.getPortsForSide(side),
			//		sideRefPorts = node.getRefPortsForSide(side);
			//	//sidePorts = sidePorts.concat(sideRefPorts);
			//	if (sidePorts.length <= 1) {
			//		return result;
			//	}
            //
			//	var outsA = nodesLayoutUtl.getNodeStartSegmentsAtSide(node, side),
			//		insA = nodesLayoutUtl.getNodeEndSegmentsAtSide(node, side),
			//		sideSegments = outsA.concat(insA);
            //
			//	if (sideSegments.length <= 1) {
			//		return result;
			//	}
			//	var max = 0;
			//	while (max < MAX_CROSSINGS_CHECK) {
			//		result = layoutUtl.checkSideCrossings(node, sideSegments, pipeToTest);
			//		if (result === constants.result().OK) {
			//			var msg = MAX_CROSSINGS_CHECK == max ? "--- Not found" : "!!! Resolved";
             //           if (DEBUG)
			//				console.log("  "+msg+" SIDE crossings, attempts="+max+", "+node.getName());
			//			break;
			//		} else if (result === constants.result().FAILED) {
             //           if (DEBUG)
			//				console.log("*** FAILED: SIDE crossings, attempts="+max+", "+node.getName());
			//			break;
			//		} else if (result === constants.result().HAS_FIX || result === constants.result().RETRY_FIX) {
			//			break;
			//		}
			//		max++;
			//	}
			//	if (result == constants.result().FAILED || max == MAX_CROSSINGS_CHECK) {
             //       if (DEBUG)
			//		console.log("**** Attempts to resolve SIDE crossings at node "+
			//			node.getName()+" failed or exceeded "+MAX_CROSSINGS_CHECK+":\n");
			//		result = constants.result().FAILED;
			//	}
			//	return result;
			//};

			var checkSideSegmentsCrossingsAtNodeNEXT = function(node, side, pipeToTest) {
				var result = constants.result().OK;
				var sidePorts = node.getPortsForSide(side),
					sideRefPorts = node.getRefPortsForSide(side);
				sidePorts = sidePorts.concat(sideRefPorts);
				if (sidePorts.length <= 1) {
					return result;
				}

				var outsA = nodesLayoutUtl.getNodeStartSegmentsAtSide(node, side),
					insA = nodesLayoutUtl.getNodeEndSegmentsAtSide(node, side),
					sideSegments = outsA.concat(insA);

				if (sideSegments.length <= 1) {
					return result;
				}
				var max = 0;
				while (max < MAX_CROSSINGS_CHECK) {
					result = layoutUtl.checkSideCrossingsNEXT(node, side, sideSegments, pipeToTest);
					if (result === constants.result().OK) {
						var msg = MAX_CROSSINGS_CHECK == max ? "--- Not found" : "!!! Resolved";
                        if (DEBUG)
							console.log("  "+msg+" SIDE crossings, attempts="+max+", "+node.getName());
						break;
					} else if (result === constants.result().FAILED) {
                        if (DEBUG)
							console.log("*** FAILED: SIDE crossings, attempts="+max+", "+node.getName());
						break;
					} else if (result === constants.result().HAS_FIX || result === constants.result().RETRY_FIX) {
						break;
					}
					max++;
				}
				if (result == constants.result().FAILED || max == MAX_CROSSINGS_CHECK) {
                    if (DEBUG)
					console.log("**** Attempts to resolve SIDE crossings at node "+
						node.getName()+" failed or exceeded "+MAX_CROSSINGS_CHECK+":\n");
					result = constants.result().FAILED;
				}
				return result;
			};


			self.checkAllOverlappingSegments = function() {
				if (DEBUG) console.log("============@@@@@@@@@@@@@@@@@ pipeUtils: checkAllOverlappingSegments");
				var i, result = constants.result().OK, bValue;
				for (i = 0; i < self.layout.levelPipes.length; i++) {
					var levelPipe = self.layout.levelPipes[i];
					result = self.checkForOverlappingSegment(levelPipe);
					if (self.isFixOrRetry(result)) {
						if (DEBUG)
							console.log(" RESULT at checkAllOverlappingSegments, levelPipe: "+levelPipe.getOrder()+": "+result);
						bValue = true;
						break;
					}
				}
				if (bValue) {
					return result;
				}
				for (i = 0; i < self.layout.lanePipes.length; i++) {
					var lanePipe = self.layout.lanePipes[i];
					result = self.checkForOverlappingSegment(lanePipe);
					if (self.isFixOrRetry(result)) {
						if (DEBUG)
							console.log(" RESULT at checkAllOverlappingSegments, lanePipe: "+lanePipe.getOrder()+": "+result);
						bValue = true;
						break;
					}
				}
				return result;
			};

			// NEW: side box
			self.checkAllSideBoxSegments = function() {
				if (DEBUG)
					console.log("============@@@@@@@@@@@@@@@@@ pipeUtils: checkAllSideBoxSegments");
				//boolean shouldFix = false;
				var i, result = constants.result().OK, bValue;
				for (i = 0; i < self.layout.levelPipes.length; i++) {
					var levelPipe = self.layout.levelPipes[i];
					result = self.checkForCrossingSegmentsInPipe(levelPipe, constants.pipeXing().SIDE_BOX);
					if (self.isFixOrRetry(result)) {
						if (DEBUG)
							console.log(" RESULT at checkAllSideBoxSegments SIDE_BOX: levelPipe: "+
							levelPipe.getOrder()+": "+dgmUtl.getResultName(result));
						bValue = true;
						break;
					}
				}
				if (bValue) {
					return result;
				}
				for (i = 0; i < self.layout.lanePipes.length; i++) {
					var lanePipe = self.layout.lanePipes[i];
					result = self.checkForCrossingSegmentsInPipe(lanePipe, constants.pipeXing().SIDE_BOX);
					if (self.isFixOrRetry(result)) {
						if (DEBUG)
							console.log(" RESULT at checkAllSideBoxSegments SIDE_BOX: lanePipe: "+
							lanePipe.getOrder()+": "+dgmUtl.getResultName(result));
						bValue = true;
						break;
					}
				}
				return result;
			};

			// NEW: cross box
			self.checkAllCrossBoxSegments = function() {
				if (DEBUG) console.log("============@@@@@@@@@@@@@@@@@ pipeUtils: checkAllCrossBoxSegments");
				var shouldFix = false, i, result, bValue;
				for (i = 0; i < self.layout.levelPipes.length; i++) {
					var levelPipe = self.layout.levelPipes[i];
					result = self.checkForCrossingSegmentsInPipe(levelPipe, constants.pipeXing().CROSS_BOX);
					if (self.isFixOrRetry(result)) {
						if (DEBUG)
							console.log(" RESULT at checkAllCrossBoxSegments CROSS_BOX: levelPipe: "+
							levelPipe.getOrder()+": "+dgmUtl.getResultName(result));
						bValue = true;
						break;
					}
				}
				if (bValue) {
					return result;
				}
				for (i = 0; i < self.layout.lanePipes.length; i++) {
					var lanePipe = self.layout.lanePipes[i];
					result = self.checkForCrossingSegmentsInPipe(lanePipe, constants.pipeXing().CROSS_BOX);
					if (self.isFixOrRetry(result)) {
						if (DEBUG)
							console.log("*** RESULT at checkAllCrossBoxSegments CROSS_BOX: lanePipe: "+
							lanePipe.getOrder()+": "+dgmUtl.getResultName(result));
						bValue = true;
						break;
					}
				}
				return result;
			};

			//self.checkSegmentsForAdjacentViolations = function() {
			//	if (DEBUG) console.log("============@@@@@@@@@@@@@@@@@ pipeUtils: checkSegmentsForAdjacentViolations");
			//	var i, result = constants.result().OK;
			//	for (i = 0; i < self.layout.levelPipes.length; i++) {
			//		var levelPipe = self.layout.levelPipes[i];
			//		result = self.checkSegmentsForAdjacentViolationsInPipe(levelPipe);
			//		if (result === constants.result().FAILED || result === constants.result().HAS_FIX) {
			//			levelPipe.addAuxChannel();
			//			result = constants.result().RETRY_FIX;
			//			break;
			//		} else if (result === constants.result().REDO_LAYOUT) {
			//			break;
			//		}
			//	}
			//	if (result != constants.result().RETRY_FIX && result != constants.result().REDO_LAYOUT) {
			//		for (i = 0; i < self.layout.lanePipes.length; i++) {
			//			var lanePipe = self.layout.lanePipes[i];
			//			result = self.checkSegmentsForAdjacentViolationsInPipe(lanePipe);
			//			if (result === constants.result().FAILED || result === constants.result().HAS_FIX) {
			//				lanePipe.addAuxChannel();
			//				result = constants.result().RETRY_FIX;
			//				break;
			//			} else if (result === constants.result().REDO_LAYOUT) {
			//				break;
			//			}
			//		}
			//	}
			//	return result;
			//};

			self.checkCorridorsForSegmentsViolations = function() {
				var hasFixes = false, i;
				for (i = 0; i < self.layout.levels.length; i++) {
					var level = self.layout.levels[i];
					if (level.hasSegmentsViolations()) {
						hasFixes = true;
					}
				}
				for (i = 0; i < self.layout.lanes.length; i++) {
					var lane = self.layout.lanes[i];
					if (lane.hasSegmentsViolations()) {
						hasFixes = true;
					}
				}
				return hasFixes;
			};


//////////////////////////

			// layoutUtl duplicate
			//self.checkSegmentsForCrossings = function(pipe, xing) {
			//	var result = constants.result().OK;
			//	var bValue = false;
			//	if (pipe.getChannels().length > 1) {
			//		// outer loop - channels
			//		for (var i = 0; i < pipe.getChannels().length; i++) {
			//			var iChannel = pipe.getChannels()[i];
			//			// outer loop - segments in channel i
			//			for (var ii = 0; ii < iChannel.getSegments().length; ii++) {
			//				var iiSegment = iChannel.getSegments()[ii];
			//				// inner loop - continue in channels
			//				for (var j = i+1; j < pipe.getChannels().length; j++) {
			//					var jChannel = pipe.getChannels()[j];
			//					// inner loop - segments in channel j
			//					for (var jj = 0; jj < jChannel.getSegments().length; jj++) {
			//						var jjSegment = jChannel.getSegments()[jj];
            //
			//						// check projections overlapping - may have conflicts
			//						var areOver = layoutUtl.areSegmentsProjectionsOverlapping(iiSegment, jjSegment, 0);
			//						if (areOver) {
			//							if (xing === constants.pipeXing().SIDE_BOX) {
			//								// "side box": both adjacent sgms of one sgm intersect the other, or vice versa
			//								if (layoutUtl.areSegmentsInSideBox(iiSegment, jjSegment)) {
			//									// side box detected
             //                                   //if (DEBUG)
			//										console.log("****** SIDE BOX crossing: \n" +
	         //                                       iiSegment.print()+"\n" +
	         //                                       jjSegment.print());
			//									if (layoutUtl.hasChannelConflicts(iChannel, iiSegment, jjSegment, CLEARANCE) ||
			//										layoutUtl.hasChannelConflicts(jChannel, jjSegment, iiSegment, CLEARANCE)) {
			//										pipe.incrementChannels();
			//										result = layoutUtl.attemptToMoveSegmentInSideBox(
			//											pipe, iChannel, iiSegment, jChannel, jjSegment, CLEARANCE);
			//										//console.log("???? hasChannelConflicts 1, result = "+result);
			//									} else if (iiSegment.isSwappable() && jjSegment.isSwappable()) {
			//										pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
			//										var stillOver = layoutUtl.areSegmentsInSideBox(iiSegment, jjSegment);
			//										if (stillOver) {
			//											result = constants.result().FAILED;
			//											if (iiSegment.getEdge().isOptimizationBlocked() &&
			//												jjSegment.getEdge().isOptimizationBlocked()) {
			//												if (DEBUG)
			//													console.log("++++ checkSegmentsForCrossings");
			//												//console.log("++++ blocked, offset ports: "+iiSegment.getEdge().print()+", "+jjSegment.getEdge().print());
			//												if (DEBUG)
			//													console.log("++++ blocked, offset ports: "+
			//													iiSegment.getEdge().getName()+" <> "+jjSegment.getEdge().getName());
			//												iiSegment.getEdge().getSourcePort().setOffsetStep(1);
			//												jjSegment.getEdge().getSourcePort().setOffsetStep(1);
			//												result = constants.result().REDO_LAYOUT;
			//												bValue = true;
			//												break;
			//											} else {
			//												console.log("???? hasChannelConflicts still over, result = "+result);
			//											}
			//											var conflictSegments = layoutUtl.areAdjacentSegmentsOverlapping(iiSegment, jjSegment);
			//											if (conflictSegments.length == 2) {
			//												if (!iiSegment.getEdge().isOptimizationBlocked()) {
			//													iiSegment.getEdge().setOptimizationBlocked(true);
			//													if (DEBUG)
			//														console.log("++++ checkSegmentsForCrossings:");
			//													//console.log("++++ block optimization: " + iiSegment.getEdge().print());
			//													if (DEBUG)
			//														console.log("++++ block optimization: " + iiSegment.getEdge().getName());
			//													result = constants.result().REDO_LAYOUT;
			//													bValue = true;
			//													break;
			//												} else if (!jjSegment.getEdge().isOptimizationBlocked()) {
			//													jjSegment.getEdge().setOptimizationBlocked(true);
			//													if (DEBUG)
			//														console.log("++++ checkSegmentsForCrossings:");
			//													if (DEBUG)
			//														console.log("++++ block optimization: " + jjSegment.getEdge().print());
			//													result = constants.result().REDO_LAYOUT;
			//													bValue = true;
			//													break;
			//												}
			//											}
			//										} else {
			//											result = constants.result().HAS_FIX;
			//										}
			//									}
			//									bValue = true;
			//									break;
			//								}
			//							} else if (xing === constants.pipeXing().CROSS_BOX) {
			//								// "cross box": one each adjacent sgm of both sgms intersects the other
			//								if (layoutUtl.areSegmentsInCrossBox(iiSegment, jjSegment)) {
			//									if (DEBUG)
			//										console.log("****** CROSS BOX crossing: \n" +
			//										iiSegment.print()+"\n" +
			//										jjSegment.print());
			//									if (layoutUtl.hasChannelConflicts(iChannel, iiSegment, jjSegment, CLEARANCE) ||
			//										layoutUtl.hasChannelConflicts(jChannel, jjSegment, iiSegment, CLEARANCE)) {
			//										pipe.incrementChannels();
			//										result = layoutUtl.attemptToMoveSegmentInCrossBox(pipe, iChannel, iiSegment, jChannel, jjSegment, CLEARANCE);
			//									}
			//									else {
			//										if (iiSegment.isSwappable() && jjSegment.isSwappable()) {
			//											pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
			//											result = constants.result().HAS_FIX;
			//										}
			//									}
			//									bValue = true;
			//									break;
			//								}
			//							}
			//						}
			//					}
			//					if (bValue) {
			//						break;
			//					}
			//				}
			//				if (bValue) {
			//					break;
			//				}
			//			}
			//			if (bValue) {
			//				break;
			//			}
			//		}
			//	}
			//	return result;
			//};

			//self.checkPipeForAdjacentViolations = function(pipe) {
			//	var result = constants.result().OK,
			//		bValue = false;
			//	if (pipe.getChannels().length > 1) {// && pipe.getType() == Pipe.Type.LEVEL_PIPE && pipe.getOrder() == 2) {
			//		// outer loop - channels
			//		for (var i = 0; i < pipe.getChannels().length; i++) {
			//			var iChannel = pipe.getChannels()[i];
			//			// outer loop - segments in channel i
			//			for (var ii = 0; ii < iChannel.getSegments().length; ii++) {
			//				var iiSegment = iChannel.getSegments()[ii];
			//				// inner loop - continue in channels
			//				for (var j = i+1; j < pipe.getChannels().length; j++) {
			//					var jChannel = pipe.getChannels()[j];
			//					// inner loop - segments i channel j
			//					for (var jj = 0; jj < jChannel.getSegments().length; jj++) {
			//						var jjSegment = jChannel.getSegments()[jj];
			//						// check projections overlapping - may have conflicts
            //
			//						var areOver = layoutUtl.areSegmentsProjectionsOverlapping(iiSegment, jjSegment, 0);
			//						if (areOver) {
			//							var conflictSegments = layoutUtl.areAdjacentSegmentsOverlapping(iiSegment, jjSegment);
			//							if (conflictSegments.length == 2) {
			//								if (iiSegment.getEdge().isOptimizationBlocked() && jjSegment.getEdge().isOptimizationBlocked()) {
			//									console.log("++++ checkPipeForAdjacentViolations (2segments)");
			//									//console.log("++++ blocked, offset ports: \n"+iiSegment.getEdge().print()+", \n"+jjSegment.getEdge().print());
			//									//System.out.println("+++++++++++++++++++++++++++");
			//									iiSegment.getEdge().getSourcePort().setOffsetStep(1);
			//									jjSegment.getEdge().getSourcePort().setOffsetStep(1);
			//									result = constants.result().REDO_LAYOUT;
			//									bValue = true;
			//									break;
			//								} else {
			//									if (!iiSegment.getEdge().isOptimizationBlocked()) {
			//										console.log("++++ checkPipeForAdjacentViolations");
			//										//console.log("++++ block optimization: "+iiSegment.getEdge().print());
			//										//System.out.println("+++++++++++++++++++++++++++");
			//										iiSegment.getEdge().setOptimizationBlocked(true);
			//										result = constants.result().REDO_LAYOUT;
			//										bValue = true;
			//										break;
			//									} else if (!jjSegment.getEdge().isOptimizationBlocked()) {
			//										console.log("++++ checkPipeForAdjacentViolations");
			//										//console.log("++++ block optimization: "+jjSegment.getEdge().print());
			//										//System.out.println("+++++++++++++++++++++++++++");
			//										jjSegment.getEdge().setOptimizationBlocked(true);
			//										result = constants.result().REDO_LAYOUT;
			//										bValue = true;
			//										break;
			//									}
			//								}
			//							}
			//						}
			//					}
			//					if (bValue) {
			//						break;
			//					}
			//				}
			//				if (bValue) {
			//					break;
			//				}
			//			}
			//			if (bValue) {
			//				break;
			//			}
			//		}
			//	}
			//	return result;
			//};


			//self.attemptToMoveSegmentToOtherChannel = function(pipe, channel, iiSegment) {
			//	var ncChannels = layoutUtl.getAcceptingChannels(pipe.getChannels(), iiSegment, CLEARANCE);
			//	if (ncChannels.length > 0) {
			//		var found = false;
			//		for (var i = 0; i < ncChannels.length; i++) {
			//			var newChannel = ncChannels[i];
			//			pipe.moveSegment(iiSegment, channel, newChannel);
			//			if (layoutUtl.hasSegmentConflicts(pipe.getChannels(), newChannel, iiSegment, CLEARANCE)) {
			//				// roll back
			//				pipe.moveSegment(iiSegment, newChannel, channel);
			//			} else {
			//				found = true;
			//				break;
			//			}
			//		}
			//		if (found) {
			//			//return Status.Result.HAS_FIX;
			//			return constants.result().OK;
			//		}
			//	}
			//	return constants.result().FAILED;
			//};



			self.checkForOverlappingSegment = function (pipe) {
				var max = 0,
					result = constants.result().OK;
				while (max < MAX_JOINT_SGM_CHECKS) {
					result = layoutUtl.checkOverlappingSegmentsInChannel(pipe);
					if (result === constants.result().OK) {
						if (DEBUG)
							//console.log("OK: overlapping, attempts="+(MAX_JOINT_SGM_CHECKS-max)+", "+pipe.print()+":\n");
							console.log("++++ OK: NO overlapping: pipe="+pipe.getOrder());
						break;
					} else if (result === constants.result().FAILED) {
						if (DEBUG)
							console.log("FAILED: overlapping, attempts="+max+", pipe: "+pipe.print()+":\n");
						break;
					} else if (result === constants.result().HAS_FIX || result === constants.result().RETRY_FIX) {
						if (DEBUG)
						console.log("HAS OR RETRY FIX: overlapping, attempts="+max+", "+pipe.print()+":\n");
						break;
					}
					max++;
				}
				if (result == constants.result().FAILED || max == MAX_JOINT_SGM_CHECKS) {
					// either failed or max attempts is not successful
					if (DEBUG) console.log("\n*** FAILED to resolve pipe overlapping segments:\n"+pipe.print()+"\n");
					result = constants.result().FAILED;
				}
				return result;
			};

			self.checkForCrossingSegmentsInPipe = function(pipe, xing) {
				var max = 0;
				var result = constants.result().OK;
				while (max < MAX_CROSSING_SGM_CHECKS) {
					result = layoutUtl.checkSegmentsForCrossings(pipe, xing);
					if (result === constants.result().OK) {
						if (DEBUG)
							console.log("OK: crossings, attempts="+max+
								", type:"+pipe.getType()+", order:"+pipe.getOrder());
						break;
					} else if (result ===constants.result().FAILED) {
						if (DEBUG)
							console.log("FAILED: crossings, attempts="+max+
								", type:"+pipe.getType()+", order:"+pipe.getOrder()+", xing: "+xing);
						break;
					} else if (result === constants.result().HAS_FIX || result === constants.result().RETRY_FIX) {
						if (DEBUG)
							console.log(dgmUtl.getResultName(result)+": crossings, attempts="+max+
								", type:"+pipe.getType()+", order:"+pipe.getOrder()+", "+dgmUtl.getCrossingName(xing));
						//break;
					}
					max++;
				}
				if (result === constants.result().FAILED || max === MAX_CROSSING_SGM_CHECKS) {
					// either failed or max attempts is not successful
					if (DEBUG)
						console.log("******* ATTENTION: Failed to resolve pipe crossings, attempts="+max+
							", type:"+pipe.getType()+", order:"+pipe.getOrder()+", xing: "+xing+", result: "+
							dgmUtl.getResultName(result));
					result = constants.result().FAILED;
				}
				return result;
			};

			//self.checkSegmentsForAdjacentViolationsInPipe = function(pipe) {
			//	var maxAdjacentChecks = pipe.getChannels().length * 2,
			//	    max = maxAdjacentChecks;
			//	var result = constants.result().OK;
			//	while (max > 0) {
			//		//result = self.checkPipeForAdjacentViolations(pipe);
			//		result = checkAdjacentOverlappingSegmentsForPipe(pipe);
			//		if (result === constants.result().OK) {
			//			if (DEBUG)
			//				console.log("OK: checkSegmentsForAdjacentViolationsInPipe, attempts="+(maxAdjacentChecks-max)+", "+pipe.print()+"\n");
			//			break;
			//		} else if (result === constants.result().FAILED) {
			//			if (DEBUG)
			//				console.log("FAILED: checkSegmentsForAdjacentViolationsInPipe, runs left="+max+", "+pipe.print()+"\n");
			//			break;
			//		} else if (result === constants.result().HAS_FIX) {
			//			if (DEBUG)
			//				console.log("HAS_FIX checkSegmentsForAdjacentViolationsInPipe, runs left="+max+", "+pipe.print()+"\n");
			//			max--;
			//			// has to break for this check
			//			//break;
			//		} else if (result === constants.result().REDO_LAYOUT) {
			//			// break: need to restart
			//			return result;
			//		}
			//	}
			//	if (result === constants.result().FAILED || max == 0) {
			//		// either failed or max attempts is not successful
			//		if (DEBUG)
			//			console.log("\n*** Failed to resolve pipe adjacent violations:\n"+pipe.print()+"\n");
			//		result = constants.result().FAILED;
			//	}
			//	return result;
			//};

			///////// NEW START ////////////
			///////// NEW START ////////////
			///////// NEW START ////////////

			//var checkAdjacentOverlappingSegmentsForPipe = function (pipe) {
			//	var result = constants.result().OK,
			//		bValue = false;
			//	CHECKIT = pipe.getType() === constants.pipeType().LANE_PIPE && pipe.getOrder() === 1;
			//	if (CHECKIT) {
			//		//console.log("*******========= checkAdjacentOverlappingSegmentsForPipe: "+pipe.getType()+", "+pipe.getOrder());
			//	}
			//	if (pipe.getChannels().length > 1) {
			//		// outer loop - channels
			//		for (var i = 0; i < pipe.getChannels().length; i++) {
			//			var iChannel = pipe.getChannels()[i];
			//			// outer loop - segments in channel i
			//			for (var ii = 0; ii < iChannel.getSegments().length; ii++) {
			//				var iiSegment = iChannel.getSegments()[ii],
			//					iiPrev = iiSegment.getEdge().getPreviousSegment(iiSegment),
			//					iiNext = iiSegment.getEdge().getNextSegment(iiSegment);
            //
			//				for (j = i+1; j < pipe.getChannels().length; j++) {
			//					var jChannel = pipe.getChannels()[j];
			//					// inner loop - segments in channel j
			//					for (var jj = 0; jj < jChannel.getSegments().length; jj++) {
			//						var jjSegment = jChannel.getSegments()[jj],
			//							jjPrev = jjSegment.getEdge().getPreviousSegment(jjSegment),
			//							jjNext = jjSegment.getEdge().getNextSegment(jjSegment);
            //
			//						var areOver1 = layoutUtl.areOverlapping(iiNext, jjPrev);
			//							//layoutUtl.areSegmentsInClearanceViolation(iiSegment, jjSegment, CLEARANCE);
			//						if (areOver1) {
			//							console.log("@@@@ adjacentOverlapping 1 (next - prev): "+
			//								iiNext.getEdge().getName()+" <> "+jjPrev.getEdge().getName()+
			//								", pipe type:"+pipe.getType()+", order:"+pipe.getOrder());
			//							console.log("	@@@@ adjacentOverlapping 1: "+
			//								jjPrev.getEdge().getName()+" ->> "+jjPrev.getEdge().print());
			//							//pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
			//							//if (layoutUtl.areOverlapping(iiNext, jjPrev)) {
			//							//	// rollback
			//							//	pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
			//							//}
			//						}
			//						var areOver2 = layoutUtl.areOverlapping(iiNext, jjNext);
			//							//layoutUtl.areSegmentsInClearanceViolation(iiSegment, jjSegment, CLEARANCE);
			//						if (areOver2) {
			//							console.log("@@@@ adjacentOverlapping 2 (next - next): "+
			//								iiNext.getEdge().getName()+" <> "+jjNext.getEdge().getName());
			//							//pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
			//							//if (layoutUtl.areOverlapping(iiNext, jjNext)) {
			//							//	// rollback
			//							//	pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
			//							//}
			//						}
			//						var areOver3 = layoutUtl.areOverlapping(iiPrev, jjPrev);
			//							//layoutUtl.areSegmentsInClearanceViolation(iiSegment, jjSegment, CLEARANCE);
			//						if (areOver3) {
			//							console.log("@@@@ adjacentOverlapping 3 (prev - prev): "+
			//								iiPrev.getEdge().getName()+" <> "+jjPrev.getEdge().getName());
			//							//pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
			//							//if (layoutUtl.areOverlapping(iiPrev, jjPrev)) {
			//							//	// rollback
			//							//	pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
			//							//}
			//						}
			//						var areOver4 = layoutUtl.areOverlapping(iiPrev, jjNext);
			//							//layoutUtl.areSegmentsInClearanceViolation(iiSegment, jjSegment, CLEARANCE);
			//						if (areOver4) {
			//							console.log("@@@@ adjacentOverlapping 4 (prev - next): "+
			//								iiPrev.getEdge().getName()+" <> "+jjNext.getEdge().getName());
			//							pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
			//							if (layoutUtl.areOverlapping(iiPrev, jjNext)) {
			//								// rollback
			//								pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
			//							}
			//						}
            //
			//						//if (areOver1 || areOver2 || areOver3 || areOver4) {
			//						if (areOver4) {
			//						//	pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
			//							//result = constants.result().HAS_FIX;
			//							//bValue = true;
			//							console.log("*******==== HAS FIX ===== checkAdjacentOverlappingSegmentsForPipe: "+pipe.getType()+", "+pipe.getOrder());
			//							//break;
			//						}
			//					}
			//					if (bValue) {
			//						//break;
			//					}
			//				}
			//				if (bValue) {
			//					//break;
			//				}
            //
            //
			//				// inner loop - continue in channels
			//				//for (var jj = ii + 1; jj < iChannel.getSegments().length; jj++) {
			//				//	var jjSegment = iChannel.getSegments()[jj];
			//				//	if (iiSegment.isSiblingWith(jjSegment)) {
			//				//		continue;
			//				//	}
			//				//	// check projections overlapping - may have conflicts
			//				//	var areOver = areOverlapping(iiSegment, jjSegment) ||
			//				//		areSegmentsInClearanceViolation(iiSegment, jjSegment, CLEARANCE);
			//				//	if (areOver) {
			//				//		//if (DEBUG)
			//				//		if (CHECKIT)
			//				//			console.log("**** CHECK PIPE: SEGMENTS overlap on proximity: " + pipe.print() + "\n" +
			//				//				iiSegment.print() + "\n" + jjSegment.print() + "\n");
             //               //
			//				//		result = attemptToMoveSegmentToOtherChannel(pipe, iChannel, iiSegment, CLEARANCE);
			//				//		//result = constants.result().FAILED;
			//				//		console.log("???? attemptToMoveSegmentToOtherChannel: "+result);
			//				//		bValue = true;
			//				//		break;
			//				//	}
			//				//}
			//				//if (bValue) {
			//				//	break;
			//				//}
			//			}
			//			if (bValue) {
			//				//break;
			//			}
			//		}
			//	}
			//	return result;
			//};

			///////// NEW   END ////////////
			///////// NEW   END ////////////
			///////// NEW   END ////////////

			//self.checkOverlappingSegmentsAcrossPipes = function(pipeA, pipeB) {
			//	var result = constants.result().OK;
			//	var bValue = false;
			//	var channelsA = pipeA.getChannels(),
			//		channelsB = pipeB.getChannels();
			//	if (channelsA.length > 1) {
			//		// outer loop - channelsA
			//		for (var i = 0; i < channelsA.length; i++) {
			//			var iChannel = channelsA[i];
			//			// outer loop - segments in channel i
			//			for (var ii = 0; ii < iChannel.getSegments().length; ii++) {
			//				var iiSegment = iChannel.getSegments()[ii];
			//				// inner loop - channelsB
			//				for (var j = 0; j < channelsB.length; j++) {
			//					var jChannel = channelsB[j];
			//					// inner loop - segments in channel j
			//					for (var jj = 0; jj < jChannel.getSegments().length; jj++) {
			//						var jjSegment = jChannel.getSegments()[jj];
			//						if (iiSegment.getEdge().equals(jjSegment.getEdge())) {
			//							continue;
			//						}
			//						// check projections overlapping - may have conflicts
			//						var areOver = layoutUtl.areSegmentsProjectionsOverlapping(iiSegment, jjSegment, 0);
			//						if (areOver) {
			//							var conflictSegments = layoutUtl.areAdjacentSegmentsOverlapping(iiSegment, jjSegment);
			//							if (conflictSegments.length == 2) {
			//								if (iiSegment.getEdge().isOptimizationBlocked() && jjSegment.getEdge().isOptimizationBlocked()) {
			//									console.log("++++ checkOverlappingSegmentsAcrossPipes");
			//									console.log("++++ blocked, offset ports: "+iiSegment.print1()+", "+jjSegment.print1());
			//									//System.out.println("+++++++++++++++++++++++++++");
			//									iiSegment.getEdge().getSourcePort().setOffsetStep(1);
			//									jjSegment.getEdge().getSourcePort().setOffsetStep(1);
			//									result = constants.result().REDO_LAYOUT;
			//									bValue = true;
			//									break;
			//								} else {
			//									if (!iiSegment.getEdge().isOptimizationBlocked()) {
			//										console.log("++++ checkOverlappingSegmentsAcrossPipes");
			//										console.log("++++ block optimization: "+iiSegment.getEdge());
			//										//System.out.println("+++++++++++++++++++++++++++");
			//										iiSegment.getEdge().setOptimizationBlocked(true);
			//										result = constants.result().REDO_LAYOUT;
			//										bValue = true;
			//										break;
			//									} else if (!jjSegment.getEdge().isOptimizationBlocked()) {
			//										console.log("++++ checkOverlappingSegmentsAcrossPipes");
			//										console.log("++++ block optimization: "+jjSegment.getEdge());
			//										//System.out.println("+++++++++++++++++++++++++++");
			//										jjSegment.getEdge().setOptimizationBlocked(true);
			//										result = constants.result().REDO_LAYOUT;
			//										bValue = true;
			//										break;
			//									}
			//								}
			//							}
			//						}
			//						bValue = true;
			//						break;
			//					}
			//					if (bValue) {
			//						break;
			//					}
			//				}
			//				if (bValue) {
			//					break;
			//				}
			//			}
			//			if (bValue) {
			//				break;
			//			}
			//		}
			//	}
			//	return result;
			//};

			self.checkOverlappingSegmentsAtNodes = function(nodes) {
				/////////////////////////////////////////
				// find connected nodes facing each other
				/////////////////////////////////////////
				var sideA, sideB, check, result = constants.result().OK;
				for (var i = 0; i < nodes.length; i++) {
					var nodeA = nodes[i],
						levelANum = nodeA.getLevelNumber(),
						laneANum = nodeA.getLaneNumber(),
						parentContainer = nodeA.getContainerReference(),
						expandedContainers = layout.getCurrentExpandedContainers(parentContainer),
						blockedCells = layout.getBlockedCells(expandedContainers);
					for (var j = i+1; j < nodes.length; j++) {
						var nodeB = nodes[j],
							levelBNum = nodeB.getLevelNumber(),
							laneBNum = nodeB.getLaneNumber();
						if (levelANum === levelBNum) {
							var areApartInLevel = false;
							var startLaneIdx = laneANum < laneBNum ? laneANum+1 : laneBNum+1,
								endLaneIdx = laneANum < laneBNum ? laneBNum-1 : laneANum-1;
							if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
									self.layout.lanes, levelANum, startLaneIdx, endLaneIdx, blockedCells)) {
								areApartInLevel = true;
							} else if (Math.abs(laneANum - laneBNum) === 1) {
								areApartInLevel = true;
							}
							if (areApartInLevel) {
								if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
									sideA = laneANum < laneBNum ?
										constants.nodeSide().RIGHT : constants.nodeSide().LEFT;
									sideB = laneANum < laneBNum ?
										constants.nodeSide().LEFT : constants.nodeSide().RIGHT;
								} else { // VERTICAL
									sideA = laneANum < laneBNum ?
										constants.nodeSide().LEFT : constants.nodeSide().RIGHT;
									sideB = laneANum < laneBNum ?
										constants.nodeSide().RIGHT : constants.nodeSide().LEFT;
								}
								//console.log("@@@@@@@@@@@@@@@@@@@@@@ APART IN LEVEL");
								check = checkOverlappingSegmentsAcrossNodesApartInLevel(nodeA, sideA, nodeB, sideB);
								if (self.isRetryRedoOrFail(check)) {
									result = check;
									//return check;
								}
							}
						}
						else if (laneANum === laneBNum && levelANum !== levelBNum) {
							var areNextInLane = false;
							var startLevelIdx = levelANum < levelBNum ? levelANum+1 : levelBNum+1,
								endLevelIdx = levelANum < levelBNum ? levelBNum-1 : levelANum-1;
							if (edgesLayoutUtl.isLevelRangeEmptyForLane(
									self.layout.levels, laneANum, startLevelIdx, endLevelIdx, blockedCells)) {
								areNextInLane = true;
							} else if (Math.abs(levelANum - levelBNum) === 1) {
								areNextInLane = true;
							}
							if (areNextInLane) {
								if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
									sideA = levelANum < levelBNum ?
										constants.nodeSide().FRONT : constants.nodeSide().BACK;
									sideB = levelANum < levelBNum ?
										constants.nodeSide().BACK : constants.nodeSide().FRONT;
								} else { // VERTICAL
									sideA = levelANum < levelBNum ?
										constants.nodeSide().FRONT : constants.nodeSide().BACK;
									sideB = levelANum < levelBNum ?
										constants.nodeSide().BACK : constants.nodeSide().FRONT;
								}
								//console.log("@@@@@@@@@@@@@@@@@@@@@@ NEXT IN LANE");
								check = checkOverlappingSegmentsAcrossNodesNextInLane(nodeA, sideA, nodeB, sideB);
								if (self.isRetryRedoOrFail(check)) {
									result = check;
									//return check;
								}
							}
						}
					}
				}
				//return constants.result().OK;
				return result;
			};

			function checkOverlappingSegmentsAcrossNodesApartInLevel(nodeA, sideA, nodeB, sideB) {
				var i, found, result = constants.result().OK,
					outsA = nodesLayoutUtl.getNodeStartSegmentsAtSide(nodeA, sideA),
					insA = nodesLayoutUtl.getNodeEndSegmentsAtSide(nodeA, sideA),
					segmentsA = outsA.concat(insA),
					outsB = nodesLayoutUtl.getNodeStartSegmentsAtSide(nodeB, sideB),
					insB = nodesLayoutUtl.getNodeEndSegmentsAtSide(nodeB, sideB),
					segmentsB = outsB.concat(insB);
				if (segmentsA.length === 0 || segmentsB.length === 0) {
					return result;
				}
				var levelANum = nodeA.getLevelNumber(),
					levelBNum = nodeB.getLevelNumber();
				if (levelANum !== levelBNum) {
					return result;
				}
				for (i = 0; i < segmentsA.length; i++) {
					var sgmA = segmentsA[i],
						edgeA = sgmA.getEdge();
					for (var j = 0; j < segmentsB.length; j++) {
						var sgmB = segmentsB[j],
							edgeB = sgmB.getEdge();
						if (edgeA.equals(edgeB)) {
							continue;
						}

						if (layoutUtl.areOverlapping(sgmA, sgmB)) {
							//console.log("++++++++++++++++?? checkOverlappingSegmentsAcrossNodesApartInLevel: A="+nodeA.getName()+", B="+nodeB.getName());
							//console.log("++++++++++++++++?? segments:"+"\n\t"+ "sgmA = "+sgmA.print()+""+"\n\t"+ "sgmB  ="+sgmB.print());
							//console.log("++++++++++++++++?? edges:"+"\n\t"+ "edgeA = "+edgeA.print()+"\n\t"+"edgeB = "+edgeB.print());
							////	console.log("++++ ATTEMPT to offset ports: \n\t" + sgmA.print()+" \n\t"+sgmB.print());
							var srcNodeA = edgeA.getSourceNode(),
								trgNodeA = edgeA.getTargetNode(),
								srcNodeB = edgeB.getSourceNode(),
								trgNodeB = edgeB.getTargetNode();
							//console.log("++++++++++ IN LEVEL APART **###########"+
							//	"\n srcA: "+srcNodeA.getName()+
							//	", type: "+dgmUtl.getFlowTypeName(srcNodeA.getFlowType())+
							//	", side: "+dgmUtl.getNodeSideName(sideA)+
							//	"\n trgA: "+trgNodeA.getName()+
							//	", type: "+dgmUtl.getFlowTypeName(trgNodeA.getFlowType())+
							//	", side: "+dgmUtl.getNodeSideName(sideA)+
							//	", edgeA: "+edgeA.getName()+
							//	"\n srcB: "+srcNodeB.getName()+
							//	", type: "+dgmUtl.getFlowTypeName(srcNodeB.getFlowType())+
							//	", side: "+dgmUtl.getNodeSideName(sideB)+
							//	"\n trgB: "+trgNodeB.getName()+
							//	", type: "+dgmUtl.getFlowTypeName(trgNodeB.getFlowType())+
							//	", side: "+dgmUtl.getNodeSideName(sideB)+
							//	", edgeB: "+edgeB.getName()
							//);

							if (srcNodeA.isDecisionNode() || trgNodeA.isDecisionNode()) {
								edgeA.setPipesOnly(true);
							}
							if (srcNodeB.isDecisionNode() || trgNodeB.isDecisionNode()) {
								edgeB.setPipesOnly(true);
							}

							if ((sideA === constants.nodeSide().RIGHT || sideA === constants.nodeSide().LEFT) &&
									srcNodeA.isDecisionNode()) {
								srcNodeA.modifyEnds();
							} else if ((sideB === constants.nodeSide().RIGHT || sideB === constants.nodeSide().LEFT) &&
									srcNodeB.isDecisionNode()) {
								srcNodeB.modifyEnds();
							} else {
								if (edgeA.isStartSegment(sgmA)) {
									edgeA.setSourceShift(constants.portShift().UP);
								} else {
									edgeA.setTargetShift(constants.portShift().UP);
								}

								if (edgeB.isStartSegment(sgmB)) {
									edgeB.setSourceShift(constants.portShift().DOWN);
								} else {
									edgeB.setTargetShift(constants.portShift().DOWN);
								}
							}

							result = constants.result().REDO_LAYOUT;
							//console.log("    ++++++++ REDO_LAYOUT ");
							if (DEBUG)
								console.log("++?? APART IN LEVEL: edges:"+"\n\t"+
								"edgeA = "+edgeA.getName()+", srcSh="+edgeA.getSourceShift()+", trgSh="+edgeA.getTargetShift()+"\n\t"+
								"edgeB = "+edgeB.getName()+", srcSh="+edgeB.getSourceShift()+", trgSh="+edgeB.getTargetShift());
							found = true;
							break;
						}

					}
					//if (found) {
					//	break;
					//}
				}
				return result;
			}

			function checkOverlappingSegmentsAcrossNodesNextInLane(nodeA, sideA, nodeB, sideB) {
				var i, found, result = constants.result().OK,
					outsA = nodesLayoutUtl.getNodeStartSegmentsAtSide(nodeA, sideA),
					insA = nodesLayoutUtl.getNodeEndSegmentsAtSide(nodeA, sideA),
					segmentsA = outsA.concat(insA),
					outsB = nodesLayoutUtl.getNodeStartSegmentsAtSide(nodeB, sideB),
					insB = nodesLayoutUtl.getNodeEndSegmentsAtSide(nodeB, sideB),
					segmentsB = outsB.concat(insB);
				if (segmentsA.length === 0 || segmentsB.length === 0) {
					return result;
				}
				var levelANum = nodeA.getLevelNumber(),
					laneANum = nodeA.getLaneNumber(),
					levelBNum = nodeB.getLevelNumber(),
					laneBNum = nodeB.getLaneNumber();
				if (laneANum !== laneBNum) {
					return result;
				}
				//console.log("@@@@@@@@@@ AcrossNodesNext:"+
				//	" A: "+nodeA.getName()+
				//	", sideA: "+sideA+
				//	", segmentsA: "+segmentsA.length+
				//	", B: "+nodeB.getName()+
				//	", sideB: "+sideB,
				//	", segmentsB: "+segmentsB.length
				//);
				for (i = 0; i < segmentsA.length; i++) {
					var sgmA = segmentsA[i],
						edgeA = sgmA.getEdge();
					for (var j = 0; j < segmentsB.length; j++) {
						var sgmB = segmentsB[j],
							edgeB = sgmB.getEdge();
						if (edgeA.equals(edgeB)) {
							continue;
						}
						//console.log("???????? before overlapping test: A="+nodeA.getName()+", B="+nodeB.getName());
						//console.log("++++++?? segments: sgmA = "+sgmA.print()+", sgmB = "+sgmB.print());
						//console.log("++++++++++++++++?? edges:"+"\n\t"+ "edgeA = "+edgeA.print()+"\n\t"+"edgeB = "+edgeB.print());
						if (layoutUtl.areOverlapping(sgmA, sgmB)) {
							//console.log("++++++++++++++++?? checkOverlappingSegmentsAcrossNodesNextInLane: A="+nodeA.getName()+", B="+nodeB.getName());
							//console.log("++++++++++++++++?? segments: sgmA="+sgmA.print()+", sgmB="+sgmB.print());
							//console.log("++++++++++++++++?? edges:"+"\n\t"+ "edgeA = "+edgeA.print()+"\n\t"+"edgeB = "+edgeB.print());
							//	console.log("++++ ATTEMPT to offset ports: \n\t" + sgmA.print2()+" \n\t"+sgmB.print2());

							var srcNodeA = edgeA.getSourceNode(),
								trgNodeA = edgeA.getTargetNode(),
								srcNodeB = edgeB.getSourceNode(),
								trgNodeB = edgeB.getTargetNode();
							//console.log("++++++++++ IN LANE NEXT **###########"+
							//		"\n srcA: "+srcNodeA.getName()+
							//		", type: "+dgmUtl.getFlowTypeName(srcNodeA.getFlowType())+
							//		", side: "+dgmUtl.getNodeSideName(sideA)+
							//		"\n trgA: "+trgNodeA.getName()+
							//		", type: "+dgmUtl.getFlowTypeName(trgNodeA.getFlowType())+
							//		", side: "+dgmUtl.getNodeSideName(sideA)+
							//		", edgeA: "+edgeA.getName()+
							//		"\n srcB: "+srcNodeB.getName()+
							//		", type: "+dgmUtl.getFlowTypeName(srcNodeB.getFlowType())+
							//		", side: "+dgmUtl.getNodeSideName(sideB)+
							//		"\n trgB: "+trgNodeB.getName()+
							//		", type: "+dgmUtl.getFlowTypeName(trgNodeB.getFlowType())+
							//		", side: "+dgmUtl.getNodeSideName(sideB)+
							//		", edgeB: "+edgeB.getName()
							//);

							if (srcNodeA.isDecisionNode() || trgNodeA.isDecisionNode()) {
								edgeA.setPipesOnly(true);
							}
							if (srcNodeB.isDecisionNode() || trgNodeB.isDecisionNode()) {
								edgeB.setPipesOnly(true);
							}

							if (sideA === constants.nodeSide().FRONT && srcNodeA.isDecisionNode()) {
								srcNodeA.modifyEnds();
							} else if (sideB === constants.nodeSide().FRONT && srcNodeB.isDecisionNode()) {
								srcNodeB.modifyEnds();
							}
							else {
								if (edgeA.isStartSegment(sgmA)) {
									edgeA.setSourceShift(constants.portShift().UP);
								} else {
									edgeA.setTargetShift(constants.portShift().UP);
								}

								if (edgeB.isStartSegment(sgmB)) {
									edgeB.setSourceShift(constants.portShift().DOWN);
								} else {
									edgeB.setTargetShift(constants.portShift().DOWN);
								}
							}

							result = constants.result().REDO_LAYOUT;
							//console.log("    ++++++++ REDO_LAYOUT ");
							if (DEBUG)
								console.log("++?? NEXT IN LANE: edges:"+"\n\t"+
								"edgeA = "+edgeA.getName()+", srcSh="+edgeA.getSourceShift()+", trgSh="+edgeA.getTargetShift()+"\n\t"+
								"edgeB = "+edgeB.getName()+", srcSh="+edgeB.getSourceShift()+", trgSh="+edgeB.getTargetShift());
							found = true;
							//break;
						}
					}
					//if (found) {
					//	break;
					//}
				}
				return result;
			}

			function getBlockedCellsAlongLane(laneNum, startLevelNum, endLevelNum) {
				var minLevelNum = Math.min(startLevelNum, endLevelNum),
					maxLevelNum = Math.max(startLevelNum, endLevelNum),
					cells = [];
				if (maxLevelNum - minLevelNum <= 1) { return cells; }
				for (var k = minLevelNum+1; k < maxLevelNum; k++) {
					var cell = new Cell(k, laneNum);
					cells.push(cell);
				}
				return cells;
			}

			function getBlockedCellsAlongLevel(levelNum, startLaneNum, endLaneNum) {
				var minLaneNum = Math.min(startLaneNum, endLaneNum),
					maxLaneNum = Math.max(startLaneNum, endLaneNum),
					cells = [];
				if (maxLaneNum - minLaneNum <= 1) { return cells; }
				for (var k = minLaneNum+1; k < maxLaneNum; k++) {
					var cell = new Cell(k, levelNum);
					cells.push(cell);
				}
				return cells;
			}

			// the segment is assumed to be in a lanePipe, so it is along the flow direction
			function attemptToMoveSegmentAcrossPipes(nodeA, nodeB, segment) {
				var inPipes = getPipesBetween(nodeA, nodeB),
					fromPipe, toPipe, found;
				for (var k = 0; k < inPipes.length; k++) {
					if (!inPipes[k].hasSegment(segment)) {
						if (!found) {
							toPipe = inPipes[k];
							found = true;
						}
					}
					if (inPipes[k].equals(segment.getPipe())) {
						fromPipe = inPipes[k];
					}
				}
				if (fromPipe && toPipe) {
					var delta, from, to;
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						from = segment.getStartPoint().y;
					} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
						from = segment.getStartPoint().x;
					}

					fromPipe.removeSegmentFromPipe(segment);
					toPipe.addSegmentToPipe(segment);
					segment.setPipe(toPipe);
					segment.getEdge().adjustSegmentsLocations();
				}
			}

			function getPipesBetween(nodeA, nodeB) {
				var laneANum = nodeA.getLaneNumber(),
					laneBNum = nodeB.getLaneNumber(),
					laneMinNum = Math.min(laneANum, laneBNum),
					laneMaxNum = Math.max(laneANum, laneBNum),
					pipesIn = [],
					currPipeNum = laneMinNum+1;
				while (currPipeNum <= laneMaxNum) {
					pipesIn.push(self.layout.lanePipes[currPipeNum++]);
				}
				return pipesIn;
			}


		}
		return PipeUtils;
	}
);

