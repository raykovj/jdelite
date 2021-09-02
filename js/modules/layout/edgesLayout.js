define('modules/layout/edgesLayout',
	['modules/geometry/point',
		'modules/graph/xPoint',
		'modules/graph/cell',
		'modules/graph/graphNode',
		'modules/layout/edgesLayoutUtils',
		'modules/geometry/rectangle',
		'modules/geometry/geomUtils',
		'modules/flow/flowUtils',
		'modules/graph/pipe',
		'modules/graph/pipeCrossing',
		'modules/graph/segment',
		'modules/graph/graphConstants',
		'modules/settings/config'],
	function(Point,
	         XPoint,
	         Cell,
	         GraphNode,
			 edgesLayoutUtl,
			 Rectangle,
			 geomUtils,
			 flowUtils,
	         Pipe,
	         PipeCrossing,
	         Segment,
	         constants,
	         config) {

		function EdgesLayout(layout) {

			var self = this,
				_flowLayout = layout;

			/**
			 * First & last segments are from port to adjacent pipe - level or lane
			 */
			self.traceEdge = function(edge) {
				//console.log("--- traceEdge: "+edge.getName()+", levels: "+_flowLayout.getLevels().length);
				//console.log("--- traceEdge: "+edge.getName());
				var flowDirection = config.getFlowDirection();
				//
				if (!edge.getSourcePort().getNode().isAllocated() || !edge.getTargetPort().getNode().isAllocated()) {
					console.log("[traceEdge]: Unallocated nodes, edge skipped: "+edge.toString());
					return;
				}
				if (!edge.getSourcePort()) {
					console.log("[traceEdge]: source node undefined for edge "+edge.getName());
					return;
				}
				if (!edge.getTargetPort()) {
					console.log("[traceEdge]: target node undefined for edge "+edge.getName());
					return;
				}

				//if (edge.getName() === "[L1/OUT-0]-[R1/IN-0]") {
				if (edge.getName() === "[[P1/OUT-1]-[P5/IN-0]]") {
					//console.log("### START "+edge.getName());
				}
				var srcInPipePoint = traceSourceHandle(edge),
					trgInPipePoint = traceTargetHandle(edge),
					forcedCrossings = edge.getForcedCrossings();
				if (forcedCrossings.length === 0) {
					connectTracePoints(edge, srcInPipePoint, trgInPipePoint);
				} else {
					//console.log("### HANDLE CROSSINGS for "+edge.getName());
					var crossXPoint = connectSourceToCrossing(edge, srcInPipePoint, forcedCrossings[0]);
					var idx = 0;
					while (idx < forcedCrossings.length-1) {
						crossXPoint = connectSourceToCrossing(edge, crossXPoint, forcedCrossings[++idx]);
					}
					connectCrossingToTarget(edge, crossXPoint, trgInPipePoint);

				}

				//if (edge.getName() === "[L1/OUT-0]-[R1/IN-0]") {
				//if (edge.getName() === "[P1/OUT-1]-[P5/IN-0]") {
				//	console.log("### EDGE 1: "+edge.print());
				//}

				if (forcedCrossings.length > 0) {
					joinInlineSegments(edge);
					joinInlineSegments(edge);
					if (_flowLayout.isFinalRun() && hasCrossingSegments(edge)) {
						console.log("++++++++++++++++++++++ hasCrossingSegments");
						removeTracedSegments(edge);
						_flowLayout.getFlowManager().getFlowController().clearSegmentShifts([edge]);
						//edge.clearForcedCrossings();
						//removeTracedSegments(edge);
						connectTracePoints(edge, srcInPipePoint, trgInPipePoint);
					}
				}

				//if (edge.getName() === "[L1/OUT-0]-[R1/IN-0]") {
				//if (edge.getName() === "[P1/OUT-1]-[P5/IN-0]") {
				//	console.log("### EDGE 2: "+edge.print());
				//}

			};

			function traceSourceHandle(edge) {
				//var name = edge.getName();
				//console.log("--- traceEdge: "+edge.getName()+", levels: "+_flowLayout.getLevels().length);
				var flowDirection = config.getFlowDirection();
				//
				var srcNode = edge.getSourcePort().getNode(),
					srcLevelIdx = isContainerOrSwitch(srcNode.getFlowType()) ?
						srcNode.getContainerLevelNumberForPort(edge.getSourcePort()) : srcNode.getLevelNumber(),
					srcLaneIdx  = isContainerOrSwitch(srcNode.getFlowType()) ?
						srcNode.getContainerLaneNumberForPort(edge.getSourcePort()) : srcNode.getLaneNumber(),
					srcSide = edge.getSourcePort().getSide();
				if (srcSide === constants.nodeSide().ANY) {
					console.log("[traceEdge]: source side undefined for edge "+edge.getName());
					return;
				}

				// first segment - from source
				var srcLevelPipe;
				if (edgesLayoutUtl.isMatchingSide(srcSide, constants.nodeSide().FRONT)) {
					srcLevelPipe = _flowLayout.getLevelPipes()[srcLevelIdx+1];
					// TODO - currently only for Side.FRONT:
				} else if (edgesLayoutUtl.isMatchingSide(srcSide, constants.nodeSide().BACK)) {
					srcLevelPipe = _flowLayout.getLevelPipes()[srcLevelIdx];
				}
				var scrLanePipe;
				if (edgesLayoutUtl.isMatchingSide(srcSide, constants.nodeSide().LEFT)) {
					scrLanePipe = flowDirection === constants.flow().VERTICAL ?
						_flowLayout.getLanePipes()[srcLaneIdx+1] : _flowLayout.getLanePipes()[srcLaneIdx];
				} else if (edgesLayoutUtl.isMatchingSide(srcSide, constants.nodeSide().RIGHT)) {
					scrLanePipe = flowDirection === constants.flow().VERTICAL ?
						_flowLayout.getLanePipes()[srcLaneIdx] : _flowLayout.getLanePipes()[srcLaneIdx+1];
				} else {
					scrLanePipe = flowDirection === constants.flow().VERTICAL ?
						_flowLayout.getLanePipes()[srcLaneIdx+1] : _flowLayout.getLanePipes()[srcLaneIdx];
				}
				if (!srcLevelPipe && !scrLanePipe) {
					console.log("[traceEdge]: no source pipe found");
					return;
				}
				var srcPipe = srcLevelPipe  ? srcLevelPipe : scrLanePipe,
					srcXPoint = edgesLayoutUtl.getPipeXSideCenter(srcPipe, edge.getSourcePort().getAttachmentPoint(), flowDirection),
					srcAtPortPoint = new XPoint(edge.getSourcePort().getAttachmentPoint(), srcPipe),
					srcInPipePoint = new XPoint(srcXPoint, srcPipe, undefined, srcLevelPipe, scrLanePipe),
					srcSegment = new Segment(edge, srcPipe, null, constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, srcInPipePoint);
				edge.addSegment(srcSegment);

				return srcInPipePoint;
			}

			function traceTargetHandle(edge) {
				//var name = edge.getName();
				//console.log("--- traceEdge: "+edge.getName()+", levels: "+_flowLayout.getLevels().length);
				var flowDirection = config.getFlowDirection();
				//
				var trgNode = edge.getTargetPort().getNode(),
					trgLevelIdx = isContainerOrSwitch(trgNode.getFlowType()) ?
						trgNode.getContainerLevelNumberForPort(edge.getTargetPort()) : trgNode.getLevelNumber(),
					trgLaneIdx  = isContainerOrSwitch(trgNode.getFlowType()) ?
						trgNode.getContainerLaneNumberForPort(edge.getTargetPort()) : trgNode.getLaneNumber(),
					trgSide = edge.getTargetPort().getSide();
				if (trgSide === constants.nodeSide().ANY) {
					console.log("[traceEdge]: target side undefined for edge "+edge.getName());
					return;
				}

				// last segment - to target
				var trgLevelPipe;
				if (edgesLayoutUtl.isMatchingSide(trgSide, constants.nodeSide().FRONT)) {
					trgLevelPipe = _flowLayout.getLevelPipes()[trgLevelIdx+1];
				} else if (edgesLayoutUtl.isMatchingSide(trgSide, constants.nodeSide().BACK)) {
					trgLevelPipe = _flowLayout.getLevelPipes()[trgLevelIdx];
				}
				var trgLanePipe;
				if (edgesLayoutUtl.isMatchingSide(trgSide, constants.nodeSide().LEFT)) {
					trgLanePipe = flowDirection === constants.flow().VERTICAL ?
						_flowLayout.getLanePipes()[trgLaneIdx+1] : _flowLayout.getLanePipes()[trgLaneIdx];
				} else if (edgesLayoutUtl.isMatchingSide(trgSide, constants.nodeSide().RIGHT)) {
					trgLanePipe = flowDirection === constants.flow().VERTICAL ?
						_flowLayout.getLanePipes()[trgLaneIdx] : _flowLayout.getLanePipes()[trgLaneIdx+1];
				} else {
					trgLanePipe = flowDirection === constants.flow().VERTICAL ?
						_flowLayout.getLanePipes()[trgLaneIdx] : _flowLayout.getLanePipes()[trgLaneIdx+1];
				}
				if (!trgLevelPipe && !trgLanePipe) {
					console.log("[traceEdge] no target pipe found");
					return;
				}
				var trgPipe = trgLevelPipe ? trgLevelPipe : trgLanePipe,
					trgXPoint = edgesLayoutUtl.getPipeXSideCenter(trgPipe, edge.getTargetPort().getAttachmentPoint(), flowDirection),
					trgInPipePoint = new XPoint(trgXPoint, trgPipe, undefined, trgLevelPipe, trgLanePipe),
					trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgPipe),
					trgSegment = new Segment(edge, trgPipe, null, constants.segmentType().PIPE_TO_NODE, trgInPipePoint, trgAtPortPoint);
				edge.addSegment(trgSegment);

				return trgInPipePoint;
			}

			function isContainerOrSwitch(type) {
				return type === constants.flowType().CONTAINER || type === constants.flowType().SWITCH;
			}

			///////
			function connectTracePoints(edge, srcXPoint, trgXPoint) {
				//if (edge.getName() === "[P3/REF-OUT-R-1]-[P1/REF-IN-L-1]") {
				//if (edge.getName() === "[D1/OUT-NO]-[SW1/IN-0]") {
				//if (edge.getName() === "[B1/OUT-0]-[TERRA/IN-0]") {
				//	console.log("$$ GOT IT: "+edge.getName());
				//}
				var srcNode = edge.getSourcePort().getNode(),
					srcLevelIdx = isContainerOrSwitch(srcNode.getFlowType()) ?
						srcNode.getContainerLevelNumberForPort(edge.getSourcePort()) : srcNode.getLevelNumber(),
					srcLaneIdx  = isContainerOrSwitch(srcNode.getFlowType()) ?
						srcNode.getContainerLaneNumberForPort(edge.getSourcePort()) : srcNode.getLaneNumber(),
					srcSide = edge.getSourcePort().getSide(),
					trgNode = edge.getTargetPort().getNode(),
					trgLevelIdx = isContainerOrSwitch(trgNode.getFlowType()) ?
						trgNode.getContainerLevelNumberForPort(edge.getTargetPort()) : trgNode.getLevelNumber(),
					trgLaneIdx  = isContainerOrSwitch(trgNode.getFlowType()) ?
						trgNode.getContainerLaneNumberForPort(edge.getTargetPort()) : trgNode.getLaneNumber(),
					trgSide = edge.getTargetPort().getSide(),
					flowDirection = config.getFlowDirection(),
					edgeRect = get2PointRectangle(srcXPoint, trgXPoint),
					parentContainer = srcNode.getContainerReference(),
					// this also includes switches
					allContainers = flowUtils.getAllContainers(_flowLayout.getFlowManager(), parentContainer),
					expandedContainers = flowUtils.getExpandedContainers(_flowLayout.getFlowManager(), parentContainer),
					//expandedContainers = excludeAnchorNodes(expContainers, srcNode, trgNode),
					//expandedContainers = _flowLayout.getCurrentExpandedContainers(parentContainer),
					//crossContainer = getCrossingContainer(expandedContainers, edgeRect),
					crossContainers = getXContainers(expandedContainers, edgeRect),
					//crossOutline = getCrossingsOutline(expandedContainers, crossContainer),
					crossOutline = getXShape(crossContainers),
					sidesLocator = flowUtils.getRectSidesToGridLocation(crossOutline, _flowLayout),
					blockedCells = _flowLayout.getBlockedCells(allContainers);

				if (srcXPoint.getFirstPipe().equals(trgXPoint.getFirstPipe()) && !edgeRect.intersects(crossOutline)) {
					var tSgm;
					if (srcXPoint.getFirstPipe().getType() === constants.pipeType().LEVEL_PIPE) {
						tSgm = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, trgXPoint);
						edge.addSegment(tSgm);
						srcXPoint.getFirstPipe().addSegment(tSgm);
						//return;
					} else if (srcXPoint.getFirstPipe().getType() === constants.pipeType().LANE_PIPE) {
						tSgm = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, trgXPoint);
						edge.addSegment(tSgm);
						srcXPoint.getFirstPipe().addSegment(tSgm);
						//return;
					}
				} else {
					// in different pipes
					var isTraced, acrossPnt, xTPoint, newXSegment, srcAtPortPoint, trgAtPortPoint, rplSrcSegment, rplTrgSegment,
						sXing, tXing, sPoint, tPoint, sxSegment, xxSegment, xx1Segment, xx2Segment, txSegment, startLaneIdx, endLaneIdx;

					if (srcXPoint.getFirstPipe().getType() === trgXPoint.getFirstPipe().getType() || edgeRect.intersects(crossOutline)) {
						// same pipe type - level or lane
						if (srcXPoint.getFirstPipe().getType() === constants.pipeType().LEVEL_PIPE) {
							// the trg pipe type is the same
							isTraced = false;
							//if (srcSide != trgSide && trgLevelIdx - srcLevelIdx > 1 && !edge.isOptimizationBlocked()) {
							if (srcSide != trgSide && trgLevelIdx - srcLevelIdx > 1 &&
									!edge.isDummyOptimization() && !edge.hasPipesOnly() && !edgeRect.intersects(crossOutline)) {
								// look for empty cell range in lane 'trgLaneIdx'
								if (edgesLayoutUtl.isLevelRangeEmptyForLane(
										_flowLayout.getLevels(), trgLaneIdx, srcLevelIdx+1, trgLevelIdx-1, blockedCells)) {
									// this is an empty lane range in 'trgLaneIdx', get the center point of smallest level pipe: srcLevelIdx+1
									acrossPnt = edgesLayoutUtl.getPipeXSideCenter(_flowLayout.getLevelPipes()[srcLevelIdx+1], trgXPoint, flowDirection);
									xTPoint = new XPoint(acrossPnt, _flowLayout.getLevelPipes()[srcLevelIdx + 1]);
									// trace to target lane
									newXSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, xTPoint);
									edge.addSegmentAt(1, newXSegment);
									_flowLayout.getLevelPipes()[srcLevelIdx + 1].addSegment(newXSegment);

									trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
									rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									edge.replaceEndSegment(rplTrgSegment);
									_flowLayout.getLanes()[srcNode.getLaneNumber()].addExtendedSegment(rplTrgSegment);

									isTraced = true;
								}
								// look for empty cell range in lane 'srcLaneIdx'
								else if (edgesLayoutUtl.isLevelRangeEmptyForLane(
										_flowLayout.getLevels(), srcLaneIdx, srcLevelIdx+1, trgLevelIdx-1, blockedCells)) {
									// this is right across
									// this is an empty lane range in 'srcLaneIdx', get the center point of biggest level pipe: trgLevelIdx
									acrossPnt = edgesLayoutUtl.getPipeXSideCenter(_flowLayout.getLevelPipes()[trgLevelIdx], srcXPoint, flowDirection);
									xTPoint = new XPoint(acrossPnt, _flowLayout.getLevelPipes()[trgLevelIdx]);

									srcAtPortPoint = new XPoint(edge.getSourcePort().getAttachmentPoint(), srcXPoint.getFirstPipe());
									rplSrcSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									edge.replaceStartSegment(rplSrcSegment);
									_flowLayout.getLanes()[srcNode.getLaneNumber()].addExtendedSegment(rplSrcSegment);

									// finish to trgXPoint in its pipe
									var stLSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, xTPoint, trgXPoint);
									edge.addSegment(stLSegment);
									_flowLayout.getLevelPipes()[trgLevelIdx].addSegment(stLSegment);

									isTraced = true;
								}
							}
							if (!isTraced) {
								// use this level, find the crossing LanePipe next to target
								var trgLanePipeIdx = -1,
									hasNoCrossing = expandedContainers.length === 0 || crossContainers.length === 0;
								if (hasNoCrossing) {
									if (trgLaneIdx > srcLaneIdx) {
										trgLanePipeIdx = trgLaneIdx;
									} else if (trgLaneIdx < srcLaneIdx) {
										trgLanePipeIdx = trgLaneIdx + 1;
									} else {
										var left = _flowLayout.getLanePipes()[srcLaneIdx].getSegmentsNumber();
										var right = _flowLayout.getLanePipes()[srcLaneIdx + 1].getSegmentsNumber();
										trgLanePipeIdx = left <= right ? trgLaneIdx : trgLaneIdx + 1;
									}

									var xLanePipe = _flowLayout.getLanePipes()[trgLanePipeIdx];

									sXing = new PipeCrossing(srcXPoint.getFirstPipe().getOrder(), xLanePipe.getOrder(), _flowLayout);
									sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

									tXing = new PipeCrossing(trgXPoint.getFirstPipe().getOrder(), xLanePipe.getOrder(), _flowLayout);
									tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

									sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
									edge.addSegment(sxSegment);
									srcXPoint.getFirstPipe().addSegment(sxSegment);

									xxSegment = new Segment(edge, xLanePipe, null, constants.segmentType().IN_PIPE, sPoint, tPoint);
									edge.addSegment(xxSegment);
									xLanePipe.addSegment(xxSegment);

									txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
									edge.addSegment(txSegment);
									trgXPoint.getFirstPipe().addSegment(txSegment);

								} else {

									if (!sidesLocator) {
										alert("sidesLocator undefined");
									}
									// firstPipe is expected to be levelPipe
									var cnxLevelPipeIdx, sideLanePipeIdx,
										srcCnxXing, srcCnxPoint, trgCnxXing, trgCnxPoint;
									if (Math.abs(srcXPoint.getFirstPipe().getOrder() - sidesLocator.startLevelPipeIdx) +
										Math.abs(trgXPoint.getFirstPipe().getOrder() - sidesLocator.startLevelPipeIdx)
										<=
										Math.abs(srcXPoint.getFirstPipe().getOrder() - sidesLocator.endLevelPipeIdx) +
										Math.abs(trgXPoint.getFirstPipe().getOrder() - sidesLocator.endLevelPipeIdx) ) {
										cnxLevelPipeIdx = sidesLocator.startLevelPipeIdx;
									} else {
										cnxLevelPipeIdx = sidesLocator.endLevelPipeIdx;
									}

									if (Math.abs(srcLaneIdx - sidesLocator.startLanePipeIdx) +
										Math.abs(trgLaneIdx - sidesLocator.startLanePipeIdx)
										<
										Math.abs(srcLaneIdx - sidesLocator.endLanePipeIdx) +
										Math.abs(trgLaneIdx - sidesLocator.endLanePipeIdx) ) {
										sideLanePipeIdx = sidesLocator.startLanePipeIdx;
									} else {
										sideLanePipeIdx = sidesLocator.endLanePipeIdx;
									}

									// 1l1
									if (flowUtils.isLevelPipeCrossingOutline(sidesLocator, srcXPoint.getLevelPipe().getOrder()) &&
										flowUtils.isLevelPipeCrossingOutline(sidesLocator, trgXPoint.getLevelPipe().getOrder())
										//||
										//flowUtils
									) {

										if (srcLaneIdx < trgLaneIdx) {

											sXing = new PipeCrossing(srcXPoint.getFirstPipe().getOrder(), sidesLocator.startLanePipeIdx, _flowLayout);
											sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

											srcCnxXing = new PipeCrossing(cnxLevelPipeIdx, sidesLocator.startLanePipeIdx, _flowLayout);
											srcCnxPoint = new XPoint(srcCnxXing.getCenterPoint(), _flowLayout.getLevelPipes()[cnxLevelPipeIdx]);

											trgCnxXing = new PipeCrossing(cnxLevelPipeIdx, sidesLocator.endLanePipeIdx, _flowLayout);
											trgCnxPoint = new XPoint(trgCnxXing.getCenterPoint(), _flowLayout.getLevelPipes()[cnxLevelPipeIdx]);

											tXing = new PipeCrossing(trgXPoint.getFirstPipe().getOrder(), sidesLocator.endLanePipeIdx, _flowLayout);
											tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

											///
											sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
											edge.addSegment(sxSegment);
											srcXPoint.getFirstPipe().addSegment(sxSegment);

											xx1Segment = new Segment(
												edge, _flowLayout.getLanePipes()[sidesLocator.startLanePipeIdx], null, constants.segmentType().IN_PIPE, sPoint, srcCnxPoint);
											edge.addSegment(xx1Segment);
											_flowLayout.getLanePipes()[sidesLocator.startLanePipeIdx].addSegment(xx1Segment);

											xxSegment = new Segment(
												edge, _flowLayout.getLevelPipes()[cnxLevelPipeIdx], null, constants.segmentType().IN_PIPE, srcCnxPoint, trgCnxPoint);
											edge.addSegment(xxSegment);
											_flowLayout.getLevelPipes()[cnxLevelPipeIdx].addSegment(xxSegment);

											xx2Segment = new Segment(
												edge, _flowLayout.getLanePipes()[sidesLocator.endLanePipeIdx], null, constants.segmentType().IN_PIPE, trgCnxPoint, tPoint);
											edge.addSegment(xx2Segment);
											_flowLayout.getLanePipes()[sidesLocator.endLanePipeIdx].addSegment(xx2Segment);

											txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
											edge.addSegment(txSegment);
											trgXPoint.getFirstPipe().addSegment(txSegment);

										} else {

											sXing = new PipeCrossing(srcXPoint.getFirstPipe().getOrder(), sidesLocator.endLanePipeIdx, _flowLayout);
											sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

											srcCnxXing = new PipeCrossing(cnxLevelPipeIdx, sidesLocator.endLanePipeIdx, _flowLayout);
											srcCnxPoint = new XPoint(srcCnxXing.getCenterPoint(), _flowLayout.getLevelPipes()[cnxLevelPipeIdx]);

											trgCnxXing = new PipeCrossing(cnxLevelPipeIdx, sidesLocator.startLanePipeIdx, _flowLayout);
											trgCnxPoint = new XPoint(trgCnxXing.getCenterPoint(), _flowLayout.getLevelPipes()[cnxLevelPipeIdx]);

											tXing = new PipeCrossing(trgXPoint.getFirstPipe().getOrder(), sidesLocator.startLanePipeIdx, _flowLayout);
											tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

											///
											sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
											edge.addSegment(sxSegment);
											srcXPoint.getFirstPipe().addSegment(sxSegment);

											xx1Segment = new Segment(
												edge, _flowLayout.getLanePipes()[sidesLocator.endLanePipeIdx], null, constants.segmentType().IN_PIPE, sPoint, srcCnxPoint);
											edge.addSegment(xx1Segment);
											_flowLayout.getLanePipes()[sidesLocator.endLanePipeIdx].addSegment(xx1Segment);

											xxSegment = new Segment(
												edge, _flowLayout.getLevelPipes()[cnxLevelPipeIdx], null, constants.segmentType().IN_PIPE, srcCnxPoint, trgCnxPoint);
											edge.addSegment(xxSegment);
											_flowLayout.getLevelPipes()[cnxLevelPipeIdx].addSegment(xxSegment);

											xx2Segment = new Segment(
												edge, _flowLayout.getLanePipes()[sidesLocator.startLanePipeIdx], null, constants.segmentType().IN_PIPE, trgCnxPoint, tPoint);
											edge.addSegment(xx2Segment);
											_flowLayout.getLanePipes()[sidesLocator.startLanePipeIdx].addSegment(xx2Segment);

											txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
											edge.addSegment(txSegment);
											trgXPoint.getFirstPipe().addSegment(txSegment);

										}
									}
									// 2l1
									else if (flowUtils.isLevelPipeCrossingOutline(sidesLocator, srcXPoint.getLevelPipe().getOrder())) {
										if (srcLaneIdx < trgLaneIdx) {

											sXing = new PipeCrossing(srcXPoint.getFirstPipe().getOrder(), sidesLocator.startLanePipeIdx, _flowLayout);
											sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

											tXing = new PipeCrossing(trgXPoint.getFirstPipe().getOrder(), sidesLocator.endLanePipeIdx, _flowLayout);
											tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

											///
											sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
											edge.addSegment(sxSegment);
											srcXPoint.getFirstPipe().addSegment(sxSegment);

											xxSegment = new Segment(
												edge, _flowLayout.getLanePipes()[sidesLocator.startLanePipeIdx], null, constants.segmentType().IN_PIPE, sPoint, tPoint);
											edge.addSegment(xxSegment);
											_flowLayout.getLanePipes()[sidesLocator.startLanePipeIdx].addSegment(xxSegment);

											txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
											edge.addSegment(txSegment);
											trgXPoint.getFirstPipe().addSegment(txSegment);

										} else {

											sXing = new PipeCrossing(srcXPoint.getFirstPipe().getOrder(), sidesLocator.endLanePipeIdx, _flowLayout);
											sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

											tXing = new PipeCrossing(trgXPoint.getFirstPipe().getOrder(), sidesLocator.startLanePipeIdx, _flowLayout);
											tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

											///
											sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
											edge.addSegment(sxSegment);
											srcXPoint.getFirstPipe().addSegment(sxSegment);

											xxSegment = new Segment(
												edge, _flowLayout.getLanePipes()[sidesLocator.endLanePipeIdx], null, constants.segmentType().IN_PIPE, sPoint, tPoint);
											edge.addSegment(xxSegment);
											_flowLayout.getLanePipes()[sidesLocator.endLanePipeIdx].addSegment(xxSegment);

											txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
											edge.addSegment(txSegment);
											trgXPoint.getFirstPipe().addSegment(txSegment);

										}

									}
									// 3l1
									else if (flowUtils.isLevelPipeCrossingOutline(sidesLocator, trgXPoint.getLevelPipe().getOrder())) {
										if (srcLaneIdx < trgLaneIdx) {

											sXing = new PipeCrossing(srcXPoint.getFirstPipe().getOrder(), sidesLocator.endLanePipeIdx, _flowLayout);
											sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

											tXing = new PipeCrossing(trgXPoint.getFirstPipe().getOrder(), sidesLocator.startLanePipeIdx, _flowLayout);
											tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

											///
											sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
											edge.addSegment(sxSegment);
											srcXPoint.getFirstPipe().addSegment(sxSegment);

											xxSegment = new Segment(
												edge, _flowLayout.getLanePipes()[sidesLocator.endLanePipeIdx], null, constants.segmentType().IN_PIPE, sPoint, tPoint);
											edge.addSegment(xxSegment);
											_flowLayout.getLanePipes()[sidesLocator.endLanePipeIdx].addSegment(xxSegment);

											txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
											edge.addSegment(txSegment);
											trgXPoint.getFirstPipe().addSegment(txSegment);

										} else {

											sXing = new PipeCrossing(srcXPoint.getFirstPipe().getOrder(), sidesLocator.startLanePipeIdx, _flowLayout);
											sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

											tXing = new PipeCrossing(trgXPoint.getFirstPipe().getOrder(), sidesLocator.endLanePipeIdx, _flowLayout);
											tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

											///
											sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
											edge.addSegment(sxSegment);
											srcXPoint.getFirstPipe().addSegment(sxSegment);

											xxSegment = new Segment(
												edge, _flowLayout.getLanePipes()[sidesLocator.startLanePipeIdx], null, constants.segmentType().IN_PIPE, sPoint, tPoint);
											edge.addSegment(xxSegment);
											_flowLayout.getLanePipes()[sidesLocator.startLanePipeIdx].addSegment(xxSegment);

											txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
											edge.addSegment(txSegment);
											trgXPoint.getFirstPipe().addSegment(txSegment);

										}

									}
									// 4l1: no first pipe crossing outline
									else {

										sXing = new PipeCrossing(srcXPoint.getFirstPipe().getOrder(), sideLanePipeIdx, _flowLayout);
										sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

										tXing = new PipeCrossing(trgXPoint.getFirstPipe().getOrder(), sideLanePipeIdx, _flowLayout);
										tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

										///
										sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
										edge.addSegment(sxSegment);
										srcXPoint.getFirstPipe().addSegment(sxSegment);

										xxSegment = new Segment(
											edge, _flowLayout.getLanePipes()[sideLanePipeIdx], null, constants.segmentType().IN_PIPE, sPoint, tPoint);
										edge.addSegment(xxSegment);
										_flowLayout.getLanePipes()[sideLanePipeIdx].addSegment(xxSegment);

										txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
										edge.addSegment(txSegment);
										trgXPoint.getFirstPipe().addSegment(txSegment);

									}
								}
							}
						} else if (srcXPoint.getFirstPipe().getType() === constants.pipeType().LANE_PIPE) {
							// start-end are facing each other across lanes: look for empty level
							isTraced = false;
							//if (!edge.isOptimizationBlocked()) {
							if (!edge.isDummyOptimization() && !edge.hasPipesOnly() && !edgeRect.intersects(crossOutline)) {
								if (flowDirection === constants.flow().VERTICAL &&
									srcLaneIdx < trgLaneIdx &&
									edgesLayoutUtl.isSourceMatchingSide(edge, constants.nodeSide().LEFT) &&
									edgesLayoutUtl.isTargetMatchingSide(edge, constants.nodeSide().RIGHT)) {
									// 1., V, L to R, src < trg
									if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
											_flowLayout.getLanes(), trgLevelIdx, srcLaneIdx+1, trgLaneIdx-1, blockedCells) &&
										edgesLayoutUtl.isLaneRangeEmptyForLevel(
											_flowLayout.getLanes(), srcLevelIdx, srcLaneIdx+1, trgLaneIdx-1, blockedCells)) {

										acrossPnt = edgesLayoutUtl.getPipeXSideCenter(_flowLayout.getLanePipes()[srcLaneIdx+1], trgXPoint, flowDirection);
										xTPoint = new XPoint(acrossPnt, _flowLayout.getLanePipes()[srcLaneIdx+1]);

										// trace to ...
										newXSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, xTPoint);
										edge.addSegmentAt(1, newXSegment);
										_flowLayout.getLanePipes()[srcLaneIdx+1].addSegment(newXSegment);

										trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
										rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
										edge.replaceEndSegment(rplTrgSegment);
										_flowLayout.getLevels()[trgNode.getLevelNumber()].addExtendedSegment(rplTrgSegment);

										isTraced = true;
									}
								} else if (flowDirection === constants.flow().HORIZONTAL &&
									srcLaneIdx < trgLaneIdx &&
									edgesLayoutUtl.isSourceMatchingSide(edge, constants.nodeSide().RIGHT) &&
									edgesLayoutUtl.isTargetMatchingSide(edge, constants.nodeSide().LEFT)) {
									// 2., H, R to L, src < trg  HERE WE ARE !!!
									if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
											_flowLayout.getLanes(), srcLevelIdx, srcLaneIdx+1, trgLaneIdx-1, blockedCells) &&
										edgesLayoutUtl.isLaneRangeEmptyForLevel(
											_flowLayout.getLanes(), trgLevelIdx, srcLaneIdx+1, trgLaneIdx-1, blockedCells)) {

										acrossPnt = edgesLayoutUtl.getPipeXSideCenter(_flowLayout.getLanePipes()[srcLaneIdx+1], trgXPoint, flowDirection);
										xTPoint = new XPoint(acrossPnt, _flowLayout.getLanePipes()[trgLaneIdx]);

										// trace to ...
										newXSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, xTPoint);
										edge.addSegmentAt(1, newXSegment);
										_flowLayout.getLanePipes()[srcLaneIdx+1].addSegment(newXSegment);

										trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
										rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
										edge.replaceEndSegment(rplTrgSegment);
										_flowLayout.getLevels()[trgNode.getLevelNumber()].addExtendedSegment(rplTrgSegment);

										isTraced = true;
									}
								} else if (flowDirection === constants.flow().VERTICAL &&
									srcLaneIdx > trgLaneIdx &&
									edgesLayoutUtl.isSourceMatchingSide(edge, constants.nodeSide().RIGHT) &&
									edgesLayoutUtl.isTargetMatchingSide(edge, constants.nodeSide().LEFT)) {
									// 3., V, R to L, src > trg
									if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
											_flowLayout.getLanes(), trgLevelIdx, trgLaneIdx+1, srcLaneIdx-1, blockedCells) &&
										edgesLayoutUtl.isLaneRangeEmptyForLevel(
											_flowLayout.getLanes(), srcLevelIdx, trgLaneIdx+1, srcLaneIdx-1, blockedCells)) {

										acrossPnt = edgesLayoutUtl.getPipeXSideCenter(_flowLayout.getLanePipes()[srcLaneIdx], trgXPoint, flowDirection);
										xTPoint = new XPoint(acrossPnt, _flowLayout.getLanePipes()[srcLaneIdx]);

										// trace to ...
										newXSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, xTPoint);
										edge.addSegmentAt(1, newXSegment);
										_flowLayout.getLanePipes()[srcLaneIdx].addSegment(newXSegment);

										trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
										rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
										edge.replaceEndSegment(rplTrgSegment);
										_flowLayout.getLevels()[trgNode.getLevelNumber()].addExtendedSegment(rplTrgSegment);

										isTraced = true;
									}
								} else if (flowDirection === constants.flow().HORIZONTAL &&
									srcLaneIdx > trgLaneIdx &&
									edgesLayoutUtl.isSourceMatchingSide(edge, constants.nodeSide().LEFT) &&
									edgesLayoutUtl.isTargetMatchingSide(edge, constants.nodeSide().RIGHT)) {
									// 4.,  H, L to R, src > trg
									if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
											_flowLayout.getLanes(), srcLevelIdx, trgLaneIdx+1, srcLaneIdx-1, blockedCells) &&
										edgesLayoutUtl.isLaneRangeEmptyForLevel(
											_flowLayout.getLanes(), trgLevelIdx, trgLaneIdx+1, srcLaneIdx-1, blockedCells)) {

										acrossPnt = edgesLayoutUtl.getPipeXSideCenter(_flowLayout.getLanePipes()[trgLaneIdx+1], trgXPoint, flowDirection);
										xTPoint = new XPoint(acrossPnt, _flowLayout.getLanePipes()[trgLaneIdx+1]);

										// trace to ...
										newXSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, xTPoint);
										edge.addSegmentAt(1, newXSegment);
										_flowLayout.getLanePipes()[srcLaneIdx].addSegment(newXSegment);

										trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
										rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
										edge.replaceEndSegment(rplTrgSegment);
										_flowLayout.getLevels()[trgNode.getLevelNumber()].addExtendedSegment(rplTrgSegment);

										isTraced = true;
									}
								}
							}
							if (!isTraced) {
								// no empty level section
								var pipeLevelIdx,
									pipeLaneIdx,
									hasNoCrossing = expandedContainers.length === 0 || crossContainers.length === 0;
								if (hasNoCrossing) {
									if (trgLevelIdx > srcLevelIdx) {
										pipeLevelIdx = srcLevelIdx+1;
									} else if (trgLevelIdx < srcLevelIdx) {
										pipeLevelIdx = trgLevelIdx+1;
									} else {
										var top = _flowLayout.getLevelPipes()[srcLevelIdx].getSegmentsNumber();
										var bottom = _flowLayout.getLevelPipes()[srcLevelIdx+1].getSegmentsNumber();
										pipeLevelIdx = top <= bottom ? srcLevelIdx : srcLevelIdx+1;
									}
									pipeLaneIdx = srcXPoint.getFirstPipe().getOrder();

									var xLevelPipe = _flowLayout.getLevelPipes()[pipeLevelIdx];

									sXing = new PipeCrossing(xLevelPipe.getOrder(), srcXPoint.getFirstPipe().getOrder());
									sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

									tXing = new PipeCrossing(xLevelPipe.getOrder(), trgXPoint.getFirstPipe().getOrder());
									tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

									sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
									edge.addSegment(sxSegment);
									srcXPoint.getFirstPipe().addSegment(sxSegment);

									xxSegment = new Segment(edge, xLevelPipe, null, constants.segmentType().IN_PIPE, sPoint, tPoint);
									edge.addSegment(xxSegment);
									xLevelPipe.addSegment(xxSegment);

									txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
									edge.addSegment(txSegment);
									trgXPoint.getFirstPipe().addSegment(txSegment);

								} else {

									// firstPipe is expected to be lanePipe
									var cnxLanePipeIdx, sideLevelPipeIdx,
										srcCnxXing, srcCnxPoint, trgCnxXing, trgCnxPoint;
									if (Math.abs(srcXPoint.getFirstPipe().getOrder() - sidesLocator.startLanePipeIdx) +
										Math.abs(trgXPoint.getFirstPipe().getOrder() - sidesLocator.startLanePipeIdx)
										<
										Math.abs(srcXPoint.getFirstPipe().getOrder() - sidesLocator.endLanePipeIdx) +
										Math.abs(trgXPoint.getFirstPipe().getOrder() - sidesLocator.endLanePipeIdx) ) {
										cnxLanePipeIdx = sidesLocator.startLanePipeIdx;
									} else {
										cnxLanePipeIdx = sidesLocator.endLanePipeIdx;
									}

									if (Math.abs(srcLevelIdx - sidesLocator.startLevelPipeIdx) +
										Math.abs(trgLevelIdx - sidesLocator.startLevelPipeIdx)
										<=
										Math.abs(srcLevelIdx - sidesLocator.endLevelPipeIdx) +
										Math.abs(trgLevelIdx - sidesLocator.endLevelPipeIdx) ) {
										sideLevelPipeIdx = sidesLocator.startLevelPipeIdx;
									} else {
										sideLevelPipeIdx = sidesLocator.endLevelPipeIdx;
									}
									/////////////////////////

									//cnxLanePipeIdx = sidesLocator.endLanePipeIdx;
									//sideLevelPipeIdx = sidesLocator.endLevelPipeIdx;


									// 1l2
									if (flowUtils.isLanePipeCrossingOutline(sidesLocator, srcXPoint.getLanePipe().getOrder()) &&
										flowUtils.isLanePipeCrossingOutline(sidesLocator, trgXPoint.getLanePipe().getOrder())) {

										if (srcLevelIdx < trgLevelIdx) {

											sXing = new PipeCrossing(sidesLocator.startLevelPipeIdx, srcXPoint.getFirstPipe().getOrder(), _flowLayout);
											sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

											srcCnxXing = new PipeCrossing(sidesLocator.startLevelPipeIdx, cnxLanePipeIdx, _flowLayout);
											srcCnxPoint = new XPoint(srcCnxXing.getCenterPoint(), _flowLayout.getLanePipes()[cnxLanePipeIdx]);

											trgCnxXing = new PipeCrossing(sidesLocator.endLevelPipeIdx, cnxLanePipeIdx, _flowLayout);
											trgCnxPoint = new XPoint(trgCnxXing.getCenterPoint(), _flowLayout.getLanePipes()[cnxLanePipeIdx]);

											tXing = new PipeCrossing(sidesLocator.endLevelPipeIdx, trgXPoint.getFirstPipe().getOrder(), _flowLayout);
											tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

											///
											sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
											edge.addSegment(sxSegment);
											srcXPoint.getFirstPipe().addSegment(sxSegment);

											xx1Segment = new Segment(
												edge, _flowLayout.getLevelPipes()[sidesLocator.startLevelPipeIdx], null, constants.segmentType().IN_PIPE, sPoint, srcCnxPoint);
											edge.addSegment(xx1Segment);
											_flowLayout.getLevelPipes()[sidesLocator.startLevelPipeIdx].addSegment(xx1Segment);

											xxSegment = new Segment(
												edge, _flowLayout.getLanePipes()[cnxLanePipeIdx], null, constants.segmentType().IN_PIPE, srcCnxPoint, trgCnxPoint);
											edge.addSegment(xxSegment);
											_flowLayout.getLanePipes()[cnxLanePipeIdx].addSegment(xxSegment);

											xx2Segment = new Segment(
												edge, _flowLayout.getLevelPipes()[sidesLocator.endLevelPipeIdx], null, constants.segmentType().IN_PIPE, trgCnxPoint, tPoint);
											edge.addSegment(xx2Segment);
											_flowLayout.getLevelPipes()[sidesLocator.endLevelPipeIdx].addSegment(xx2Segment);

											txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
											edge.addSegment(txSegment);
											trgXPoint.getFirstPipe().addSegment(txSegment);

										} else {

											sXing = new PipeCrossing(sidesLocator.endLevelPipeIdx, srcXPoint.getFirstPipe().getOrder(), _flowLayout);
											sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

											srcCnxXing = new PipeCrossing(sidesLocator.endLevelPipeIdx, cnxLanePipeIdx, _flowLayout);
											srcCnxPoint = new XPoint(srcCnxXing.getCenterPoint(), _flowLayout.getLanePipes()[cnxLanePipeIdx]);

											trgCnxXing = new PipeCrossing(sidesLocator.startLevelPipeIdx, cnxLanePipeIdx, _flowLayout);
											trgCnxPoint = new XPoint(trgCnxXing.getCenterPoint(), _flowLayout.getLanePipes()[cnxLanePipeIdx]);

											tXing = new PipeCrossing(sidesLocator.startLevelPipeIdx, trgXPoint.getFirstPipe().getOrder(), _flowLayout);
											tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

											///
											sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
											edge.addSegment(sxSegment);
											srcXPoint.getFirstPipe().addSegment(sxSegment);

											xx1Segment = new Segment(
												edge, _flowLayout.getLevelPipes()[sidesLocator.endLevelPipeIdx], null, constants.segmentType().IN_PIPE, sPoint, srcCnxPoint);
											edge.addSegment(xx1Segment);
											_flowLayout.getLevelPipes()[sidesLocator.endLevelPipeIdx].addSegment(xx1Segment);

											xxSegment = new Segment(
												edge, _flowLayout.getLanePipes()[cnxLanePipeIdx], null, constants.segmentType().IN_PIPE, srcCnxPoint, trgCnxPoint);
											edge.addSegment(xxSegment);
											_flowLayout.getLanePipes()[cnxLanePipeIdx].addSegment(xxSegment);

											//xx2Segment = new Segment(
											//	edge, _flowLayout.getLevelPipes()[sidesLocator.startLevelPipeIdx], null, constants.segmentType().IN_PIPE, trgCnxPoint, tPoint);
											//edge.addSegment(xx2Segment);
											//_flowLayout.getLevelPipes()[sidesLocator.startLevelPipeIdx].addSegment(xx2Segment);

											//txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
											txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, trgCnxPoint, trgXPoint);
											edge.addSegment(txSegment);
											trgXPoint.getFirstPipe().addSegment(txSegment);

										}
									}
									// 2l2
									else if (flowUtils.isLanePipeCrossingOutline(sidesLocator, srcXPoint.getLanePipe().getOrder())) {
										if (srcLevelIdx < trgLevelIdx) {

											sXing = new PipeCrossing(sidesLocator.startLevelPipeIdx, srcXPoint.getFirstPipe().getOrder(), _flowLayout);
											sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

											tXing = new PipeCrossing(sidesLocator.startLevelPipeIdx, trgXPoint.getFirstPipe().getOrder(), _flowLayout);
											tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

											///
											sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
											edge.addSegment(sxSegment);
											srcXPoint.getFirstPipe().addSegment(sxSegment);

											xxSegment = new Segment(
												edge, _flowLayout.getLevelPipes()[sidesLocator.startLevelPipeIdx], null, constants.segmentType().IN_PIPE, sPoint, tPoint);
											edge.addSegment(xxSegment);
											_flowLayout.getLevelPipes()[sidesLocator.startLevelPipeIdx].addSegment(xxSegment);

											txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
											edge.addSegment(txSegment);
											trgXPoint.getFirstPipe().addSegment(txSegment);

										} else {

											sXing = new PipeCrossing(sidesLocator.endLevelPipeIdx, srcXPoint.getFirstPipe().getOrder(),_flowLayout);
											sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

											tXing = new PipeCrossing(sidesLocator.endLevelPipeIdx, trgXPoint.getFirstPipe().getOrder(), _flowLayout);
											tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

											///
											sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
											edge.addSegment(sxSegment);
											srcXPoint.getFirstPipe().addSegment(sxSegment);

											xxSegment = new Segment(
												edge, _flowLayout.getLevelPipes()[sidesLocator.endLevelPipeIdx], null, constants.segmentType().IN_PIPE, sPoint, tPoint);
											edge.addSegment(xxSegment);
											_flowLayout.getLevelPipes()[sidesLocator.endLevelPipeIdx].addSegment(xxSegment);

											txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
											edge.addSegment(txSegment);
											trgXPoint.getFirstPipe().addSegment(txSegment);

										}

									}
									// 3l2
									else if (flowUtils.isLanePipeCrossingOutline(sidesLocator, trgXPoint.getLanePipe().getOrder())) {
										if (srcLevelIdx < trgLevelIdx) {

											sXing = new PipeCrossing(sidesLocator.endLevelPipeIdx, srcXPoint.getFirstPipe().getOrder(), _flowLayout);
											sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

											tXing = new PipeCrossing(sidesLocator.endLevelPipeIdx, trgXPoint.getFirstPipe().getOrder(), _flowLayout);
											tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

											///
											sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
											edge.addSegment(sxSegment);
											srcXPoint.getFirstPipe().addSegment(sxSegment);

											xxSegment = new Segment(
												edge, _flowLayout.getLevelPipes()[sidesLocator.endLevelPipeIdx], null, constants.segmentType().IN_PIPE, sPoint, tPoint);
											edge.addSegment(xxSegment);
											_flowLayout.getLevelPipes()[sidesLocator.endLevelPipeIdx].addSegment(xxSegment);

											txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
											edge.addSegment(txSegment);
											trgXPoint.getFirstPipe().addSegment(txSegment);

										} else {

											sXing = new PipeCrossing(sidesLocator.startLevelPipeIdx, srcXPoint.getFirstPipe().getOrder(), _flowLayout);
											sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

											tXing = new PipeCrossing(sidesLocator.startLevelPipeIdx, trgXPoint.getFirstPipe().getOrder(), _flowLayout);
											tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

											///
											sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
											edge.addSegment(sxSegment);
											srcXPoint.getFirstPipe().addSegment(sxSegment);

											//xxSegment = new Segment(
											//	edge, _flowLayout.getLevelPipes()[sidesLocator.startLevelPipeIdx], null, constants.segmentType().IN_PIPE, sPoint, tPoint);
											//edge.addSegment(xxSegment);
											//_flowLayout.getLevelPipes()[sidesLocator.startLevelPipeIdx].addSegment(xxSegment);

											//txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
											txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, sPoint, trgXPoint);
											edge.addSegment(txSegment);
											trgXPoint.getFirstPipe().addSegment(txSegment);

										}

									}
									// 4l2: no first pipe crossing outline
									else {

										sXing = new PipeCrossing(sideLevelPipeIdx, srcXPoint.getFirstPipe().getOrder(), _flowLayout);
										sPoint = new XPoint(sXing.getCenterPoint(), srcXPoint.getFirstPipe());

										tXing = new PipeCrossing(sideLevelPipeIdx, trgXPoint.getFirstPipe().getOrder(), _flowLayout);
										tPoint = new XPoint(tXing.getCenterPoint(), trgXPoint.getFirstPipe());

										///
										sxSegment = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, sPoint);
										edge.addSegment(sxSegment);
										srcXPoint.getFirstPipe().addSegment(sxSegment);

										//////////////////////
										// get back ???
										//////////////////////
										xxSegment = new Segment(
											edge, _flowLayout.getLevelPipes()[sideLevelPipeIdx], null, constants.segmentType().IN_PIPE, sPoint, tPoint);
										edge.addSegment(xxSegment);
										_flowLayout.getLevelPipes()[sideLevelPipeIdx].addSegment(xxSegment);

										txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, tPoint, trgXPoint);
										//txSegment = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, sPoint, trgXPoint);
										edge.addSegment(txSegment);
										trgXPoint.getFirstPipe().addSegment(txSegment);

									}
								}
							}
						}
					} else {
						// different pipe types - one crossing
						// check for free corridors in case of src side connections
						isTraced = false;
						//if (!edge.isOptimizationBlocked()) {
						if (!edge.isDummyOptimization() && !edge.hasPipesOnly()) {
							//var xing;
							//if (srcXPoint.getFirstPipe().getType() === Pipe.TYPE.LEVEL_PIPE) {
							//	xing = new PipeCrossing(srcXPoint.getFirstPipe().getOrder(), trgXPoint.getFirstPipe().getOrder(), _flowLayout);
							//} else {
							//	xing = new PipeCrossing(trgXPoint.getFirstPipe().getOrder(), srcXPoint.getFirstPipe().getOrder(), _flowLayout);
							//}
							/////
							if (edgesLayoutUtl.isSourceMatchingSide(edge, constants.nodeSide().LEFT) &&
								edgesLayoutUtl.isTargetMatchingSide(edge, constants.nodeSide().FRONT) &&
								srcLevelIdx > trgLevelIdx &&
								(flowDirection === constants.flow().VERTICAL ? srcLaneIdx < trgLaneIdx : srcLaneIdx > trgLaneIdx)) {
								startLaneIdx = flowDirection === constants.flow().VERTICAL ? srcLaneIdx+1 : trgLaneIdx;
								endLaneIdx =   flowDirection === constants.flow().VERTICAL ? trgLaneIdx : srcLaneIdx-1;
								if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
										_flowLayout.getLanes(), srcLevelIdx, startLaneIdx, endLaneIdx, blockedCells) &&
									edgesLayoutUtl.isLevelRangeEmptyForLane(
										_flowLayout.getLevels(), trgLaneIdx, trgLevelIdx+1, srcLevelIdx, blockedCells)) {
									acrossPnt = flowDirection === constants.flow().VERTICAL ?
										new Point(trgXPoint.x, srcXPoint.y) : new Point(srcXPoint.x, trgXPoint.y);
									xTPoint = new Point(acrossPnt.x, acrossPnt.y);

									srcAtPortPoint = new XPoint(edge.getSourcePort().getAttachmentPoint(), srcXPoint.getFirstPipe());
									//rplSrcSegment = new Segment(edge, null, _flowLayout.getLevels()[srcLevelIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									rplSrcSegment = new Segment(edge, srcXPoint.getFirstPipe(), _flowLayout.getLevels()[srcLevelIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									edge.replaceStartSegment(rplSrcSegment);
									_flowLayout.getLevels()[srcLevelIdx].addExtendedSegment(rplSrcSegment);

									trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
									//rplTrgSegment = new Segment(edge, null, _flowLayout.getLanes()[trgLaneIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), _flowLayout.getLanes()[trgLaneIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									edge.replaceEndSegment(rplTrgSegment);
									_flowLayout.getLanes()[trgLaneIdx].addExtendedSegment(rplTrgSegment);

									isTraced = true;
								}
							}
							else if (edgesLayoutUtl.isSourceMatchingSide(edge, constants.nodeSide().FRONT) &&
								edgesLayoutUtl.isTargetMatchingSide(edge, constants.nodeSide().LEFT) &&
								srcLevelIdx < trgLevelIdx &&
								(flowDirection === constants.flow().VERTICAL ? srcLaneIdx > trgLaneIdx : srcLaneIdx < trgLaneIdx)) {
								startLaneIdx = flowDirection === constants.flow().VERTICAL ? trgLaneIdx+1 : srcLaneIdx;
								endLaneIdx =   flowDirection === constants.flow().VERTICAL ? srcLaneIdx : trgLaneIdx-1;
								if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
										_flowLayout.getLanes(), trgLevelIdx, startLaneIdx, endLaneIdx, blockedCells) &&
									edgesLayoutUtl.isLevelRangeEmptyForLane(
										_flowLayout.getLevels(), srcLaneIdx, srcLevelIdx+1, trgLevelIdx, blockedCells)) {
									acrossPnt = flowDirection === constants.flow().VERTICAL ?
										new Point(srcXPoint.x, trgXPoint.y) : new Point(trgXPoint.x, srcXPoint.y);
									xTPoint = new Point(acrossPnt.x, acrossPnt.y);

									srcAtPortPoint = new XPoint(edge.getSourcePort().getAttachmentPoint(), srcXPoint.getFirstPipe());
									//rplSrcSegment = new Segment(edge, null, _flowLayout.getLanes()[srcLaneIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									rplSrcSegment = new Segment(edge, srcXPoint.getFirstPipe(), _flowLayout.getLanes()[srcLaneIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									edge.replaceStartSegment(rplSrcSegment);
									_flowLayout.getLanes()[srcLaneIdx].addExtendedSegment(rplSrcSegment);

									trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
									//rplTrgSegment = new Segment(edge, null, _flowLayout.getLevels()[trgLevelIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), _flowLayout.getLevels()[trgLevelIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									edge.replaceEndSegment(rplTrgSegment);
									_flowLayout.getLevels()[trgLevelIdx].addExtendedSegment(rplTrgSegment);

									isTraced = true;
								}
							}
							/////
							else if (edgesLayoutUtl.isSourceMatchingSide(edge, constants.nodeSide().RIGHT) &&
								edgesLayoutUtl.isTargetMatchingSide(edge, constants.nodeSide().FRONT) &&
								srcLevelIdx > trgLevelIdx &&
								(flowDirection === constants.flow().VERTICAL ? srcLaneIdx > trgLaneIdx : srcLaneIdx < trgLaneIdx)) {
								startLaneIdx = flowDirection === constants.flow().VERTICAL ? trgLaneIdx : srcLaneIdx+1;
								endLaneIdx =   flowDirection === constants.flow().VERTICAL ? srcLaneIdx-1 : trgLaneIdx;
								if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
										_flowLayout.getLanes(), srcLevelIdx, startLaneIdx, endLaneIdx, blockedCells) &&
									edgesLayoutUtl.isLevelRangeEmptyForLane(
										_flowLayout.getLevels(), trgLaneIdx, trgLevelIdx+1, srcLevelIdx, blockedCells)) {
									acrossPnt = flowDirection === constants.flow().VERTICAL ?
										new Point(trgXPoint.x, srcXPoint.y) : new Point(srcXPoint.x, trgXPoint.y);
									xTPoint = new Point(acrossPnt.x, acrossPnt.y);

									srcAtPortPoint = new XPoint(edge.getSourcePort().getAttachmentPoint(), srcXPoint.getFirstPipe());
									//rplSrcSegment = new Segment(edge, null, _flowLayout.getLevels()[srcLevelIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									rplSrcSegment = new Segment(edge, srcXPoint.getFirstPipe(), _flowLayout.getLevels()[srcLevelIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									edge.replaceStartSegment(rplSrcSegment);
									_flowLayout.getLevels()[srcLevelIdx].addExtendedSegment(rplSrcSegment);

									trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
									//rplTrgSegment = new Segment(edge, null, _flowLayout.getLanes()[trgLaneIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), _flowLayout.getLanes()[trgLaneIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									edge.replaceEndSegment(rplTrgSegment);
									_flowLayout.getLanes()[trgLaneIdx].addExtendedSegment(rplTrgSegment);

									isTraced = true;
								}
							}
							else if (edgesLayoutUtl.isSourceMatchingSide(edge, constants.nodeSide().FRONT) &&
								edgesLayoutUtl.isTargetMatchingSide(edge, constants.nodeSide().RIGHT) &&
								srcLevelIdx < trgLevelIdx &&
								(flowDirection === constants.flow().VERTICAL ? srcLaneIdx < trgLaneIdx : srcLaneIdx > trgLaneIdx)) {
								startLaneIdx = flowDirection === constants.flow().VERTICAL ? srcLaneIdx : trgLaneIdx+1;
								endLaneIdx =   flowDirection === constants.flow().VERTICAL ? trgLaneIdx-1 : srcLaneIdx;
								if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
										_flowLayout.getLanes(), trgLevelIdx, startLaneIdx, endLaneIdx, blockedCells) &&
									edgesLayoutUtl.isLevelRangeEmptyForLane(
										_flowLayout.getLevels(), srcLaneIdx, srcLevelIdx+1, trgLevelIdx, blockedCells)) {
									acrossPnt = flowDirection === constants.flow().VERTICAL ?
										new Point(srcXPoint.x, trgXPoint.y) : new Point(trgXPoint.x, srcXPoint.y);
									xTPoint = new Point(acrossPnt.x, acrossPnt.y);

									srcAtPortPoint = new XPoint(edge.getSourcePort().getAttachmentPoint(), srcXPoint.getFirstPipe());
									//rplSrcSegment = new Segment(edge, null, _flowLayout.getLanes()[srcLaneIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									rplSrcSegment = new Segment(edge, srcXPoint.getFirstPipe(), _flowLayout.getLanes()[srcLaneIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									edge.replaceStartSegment(rplSrcSegment);
									_flowLayout.getLanes()[srcLaneIdx].addExtendedSegment(rplSrcSegment);

									trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
									//rplTrgSegment = new Segment(edge, null, _flowLayout.getLevels()[trgLevelIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), _flowLayout.getLevels()[trgLevelIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									edge.replaceEndSegment(rplTrgSegment);
									_flowLayout.getLevels()[trgLevelIdx].addExtendedSegment(rplTrgSegment);

									isTraced = true;
								}
							}
							/////
							else if (edgesLayoutUtl.isSourceMatchingSide(edge, constants.nodeSide().LEFT) &&
								edgesLayoutUtl.isTargetMatchingSide(edge, constants.nodeSide().BACK) &&
								srcLevelIdx < trgLevelIdx &&
								(flowDirection === constants.flow().VERTICAL ? srcLaneIdx < trgLaneIdx : srcLaneIdx > trgLaneIdx)) {
								startLaneIdx = flowDirection === constants.flow().VERTICAL ? srcLaneIdx+1 : trgLaneIdx;
								endLaneIdx =   flowDirection === constants.flow().VERTICAL ? trgLaneIdx : srcLaneIdx-1;
								if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
										_flowLayout.getLanes(), srcLevelIdx, startLaneIdx, endLaneIdx, blockedCells) &&
										//edgesLayoutUtl.isLevelRangeEmptyForLane(layout.getLevels(), trgLaneIdx, trgLevelIdx+1, srcLevelIdx)) {
									edgesLayoutUtl.isLevelRangeEmptyForLane(
										_flowLayout.getLevels(), trgLaneIdx, trgLevelIdx-1, srcLevelIdx, blockedCells)) {
									acrossPnt = flowDirection === constants.flow().VERTICAL ?
										new Point(trgXPoint.x, srcXPoint.y) : new Point(srcXPoint.x, trgXPoint.y);
									xTPoint = new Point(acrossPnt.x, acrossPnt.y);

									srcAtPortPoint = new XPoint(edge.getSourcePort().getAttachmentPoint(), srcXPoint.getFirstPipe());
									//rplSrcSegment = new Segment(edge, null, _flowLayout.getLevels()[srcLevelIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									rplSrcSegment = new Segment(edge, srcXPoint.getFirstPipe(), _flowLayout.getLevels()[srcLevelIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									edge.replaceStartSegment(rplSrcSegment);
									_flowLayout.getLevels()[srcLevelIdx].addExtendedSegment(rplSrcSegment);

									trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
									//rplTrgSegment = new Segment(edge, null, _flowLayout.getLanes()[trgLaneIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), _flowLayout.getLanes()[trgLaneIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									edge.replaceEndSegment(rplTrgSegment);
									_flowLayout.getLanes()[trgLaneIdx].addExtendedSegment(rplTrgSegment);

									isTraced = true;
								}
							}
							else if (edgesLayoutUtl.isSourceMatchingSide(edge, constants.nodeSide().BACK) &&
								edgesLayoutUtl.isTargetMatchingSide(edge, constants.nodeSide().LEFT) &&
								srcLevelIdx > trgLevelIdx &&
								(flowDirection === constants.flow().VERTICAL ? srcLaneIdx > trgLaneIdx : srcLaneIdx < trgLaneIdx)) {
								startLaneIdx = flowDirection === constants.flow().VERTICAL ? trgLaneIdx+1 : srcLaneIdx;
								endLaneIdx =   flowDirection === constants.flow().VERTICAL ? srcLaneIdx : trgLaneIdx-1;
								if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
										_flowLayout.getLanes(), trgLevelIdx, startLaneIdx, endLaneIdx, blockedCells) &&
									edgesLayoutUtl.isLevelRangeEmptyForLane(
										_flowLayout.getLevels(), srcLaneIdx, trgLevelIdx, srcLevelIdx-1, blockedCells)) {
									acrossPnt = flowDirection === constants.flow().VERTICAL ?
										new Point(srcXPoint.x, trgXPoint.y) : new Point(trgXPoint.x, srcXPoint.y);
									xTPoint = new Point(acrossPnt.x, acrossPnt.y);

									srcAtPortPoint = new XPoint(edge.getSourcePort().getAttachmentPoint(), srcXPoint.getFirstPipe());
									//rplSrcSegment = new Segment(edge, null, _flowLayout.getLanes()[srcLaneIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									rplSrcSegment = new Segment(edge, srcXPoint.getFirstPipe(), _flowLayout.getLanes()[srcLaneIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									edge.replaceStartSegment(rplSrcSegment);
									_flowLayout.getLanes()[srcLaneIdx].addExtendedSegment(rplSrcSegment);

									trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
									//rplTrgSegment = new Segment(edge, null, _flowLayout.getLevels()[trgLevelIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), _flowLayout.getLevels()[trgLevelIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									edge.replaceEndSegment(rplTrgSegment);
									_flowLayout.getLevels()[trgLevelIdx].addExtendedSegment(rplTrgSegment);

									isTraced = true;
								}
							}
							/////
							else if (edgesLayoutUtl.isSourceMatchingSide(edge, constants.nodeSide().RIGHT) &&
								edgesLayoutUtl.isTargetMatchingSide(edge, constants.nodeSide().BACK) &&
								srcLevelIdx < trgLevelIdx &&
								(flowDirection === constants.flow().VERTICAL ? srcLaneIdx > trgLaneIdx : srcLaneIdx < trgLaneIdx)) {
								startLaneIdx = flowDirection === constants.flow().VERTICAL ? trgLaneIdx : srcLaneIdx+1;
								endLaneIdx =   flowDirection == constants.flow().VERTICAL ? srcLaneIdx-1 : trgLaneIdx;
								if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
										_flowLayout.getLanes(), srcLevelIdx, startLaneIdx, endLaneIdx, blockedCells) &&
									edgesLayoutUtl.isLevelRangeEmptyForLane(
										_flowLayout.getLevels(), trgLaneIdx, srcLevelIdx, trgLevelIdx-1, blockedCells)) {
									acrossPnt = flowDirection === constants.flow().VERTICAL ?
										new Point(trgXPoint.x, srcXPoint.y) : new Point(srcXPoint.x, trgXPoint.y);
									xTPoint = new Point(acrossPnt.x, acrossPnt.y);

									srcAtPortPoint = new XPoint(edge.getSourcePort().getAttachmentPoint(), srcXPoint.getFirstPipe());
									//rplSrcSegment = new Segment(edge, null, _flowLayout.getLevels()[srcLevelIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									rplSrcSegment = new Segment(edge, srcXPoint.getFirstPipe(), _flowLayout.getLevels()[srcLevelIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									edge.replaceStartSegment(rplSrcSegment);
									_flowLayout.getLevels()[srcLevelIdx].addExtendedSegment(rplSrcSegment);

									trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
									//rplTrgSegment = new Segment(edge, null, _flowLayout.getLanes()[trgLaneIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), _flowLayout.getLanes()[trgLaneIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									edge.replaceEndSegment(rplTrgSegment);
									_flowLayout.getLanes()[trgLaneIdx].addExtendedSegment(rplTrgSegment);

									isTraced = true;
								}
							}
							else if (edgesLayoutUtl.isSourceMatchingSide(edge, constants.nodeSide().BACK) &&
								edgesLayoutUtl.isTargetMatchingSide(edge, constants.nodeSide().RIGHT) &&
								srcLevelIdx > trgLevelIdx &&
								(flowDirection === constants.flow().VERTICAL ? srcLaneIdx < trgLaneIdx : srcLaneIdx > trgLaneIdx)) {
								startLaneIdx = flowDirection === constants.flow().VERTICAL ? srcLaneIdx : trgLaneIdx+1;
								endLaneIdx =   flowDirection === constants.flow().VERTICAL ? trgLaneIdx-1 : srcLaneIdx;
								if (edgesLayoutUtl.isLaneRangeEmptyForLevel(
										_flowLayout.getLanes(), trgLevelIdx, startLaneIdx, endLaneIdx, blockedCells) &&
									edgesLayoutUtl.isLevelRangeEmptyForLane(
										_flowLayout.getLevels(), srcLaneIdx, srcLevelIdx+1, trgLevelIdx, blockedCells)) {
									acrossPnt = flowDirection === constants.flow().VERTICAL ?
										new Point(srcXPoint.x, trgXPoint.y) : new Point(trgXPoint.x, srcXPoint.y);
									xTPoint = new Point(acrossPnt.x, acrossPnt.y);

									srcAtPortPoint = new XPoint(edge.getSourcePort().getAttachmentPoint(), srcXPoint.getFirstPipe());
									//rplSrcSegment = new Segment(edge, null, _flowLayout.getLanes()[srcLaneIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									rplSrcSegment = new Segment(edge, srcXPoint.getFirstPipe(), _flowLayout.getLanes()[srcLaneIdx], constants.segmentType().NODE_TO_PIPE, srcAtPortPoint, xTPoint);
									edge.replaceStartSegment(rplSrcSegment);
									_flowLayout.getLanes()[srcLaneIdx].addExtendedSegment(rplSrcSegment);

									trgAtPortPoint = new XPoint(edge.getTargetPort().getAttachmentPoint(), trgXPoint.getFirstPipe());
									//rplTrgSegment = new Segment(edge, null, _flowLayout.getLevels()[trgLevelIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									rplTrgSegment = new Segment(edge, trgXPoint.getFirstPipe(), _flowLayout.getLevels()[trgLevelIdx], constants.segmentType().PIPE_TO_NODE, xTPoint, trgAtPortPoint);
									edge.replaceEndSegment(rplTrgSegment);
									_flowLayout.getLevels()[trgLevelIdx].addExtendedSegment(rplTrgSegment);

									isTraced = true;
								}
							}

						}

						if (!isTraced) {
							// trivial case
							var xing;
							if (srcXPoint.getFirstPipe().getType() === constants.pipeType().LEVEL_PIPE) {
								xing = new PipeCrossing(srcXPoint.getFirstPipe().getOrder(), trgXPoint.getFirstPipe().getOrder(), _flowLayout);
							} else {
								xing = new PipeCrossing(trgXPoint.getFirstPipe().getOrder(), srcXPoint.getFirstPipe().getOrder(), _flowLayout);
							}
							var xPoint = new Point(xing.getCenterPoint().x, xing.getCenterPoint().y);

							var sx = new Segment(edge, srcXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, srcXPoint, xPoint);
							edge.addSegment(sx);
							srcXPoint.getFirstPipe().addSegment(sx);

							var tx = new Segment(edge, trgXPoint.getFirstPipe(), null, constants.segmentType().IN_PIPE, xPoint, trgXPoint);
							edge.addSegment(tx);
							trgXPoint.getFirstPipe().addSegment(tx);
						}
					}
				}
			}

			///////
			///////
			function connectSourceToCrossing(edge, srcXPoint, nextCrossing) {

				//console.log("=== connectSourceToCrossing, go to : "+nextCrossing.printPipeXing());
				var flowDirection = config.getFlowDirection(),
					//centerPoint = nextCrossing.getCenterPoint(),
					//xLevelPipe = nextCrossing.getLevelPipe(_flowLayout),
					xLanePipe = nextCrossing.getLanePipe(_flowLayout),
					srcFirstPipe = srcXPoint.getFirstPipe(),
					secondPipe = srcFirstPipe.equals(nextCrossing.getLevelPipe(_flowLayout)) ?
						nextCrossing.getLanePipe(_flowLayout) : nextCrossing.getLevelPipe(_flowLayout),
					crossXPoint,
					middleXing,
					midPoint,
					nextPoint,
					middleXPoint,
					segment1,
					segment2;

				nextCrossing.updateLocation(_flowLayout);
				if (srcFirstPipe.equals(nextCrossing.getLevelPipe(_flowLayout)) || srcFirstPipe.equals(nextCrossing.getLanePipe(_flowLayout)) ) { //||
					//secondPipe.equals(nextCrossing.getLevelPipe(_flowLayout)) || secondPipe.equals(nextCrossing.getLanePipe(_flowLayout)) ) {
					// 1 ok
					var endPoint = edgesLayoutUtl.getPointInCrossing(srcFirstPipe, srcXPoint, nextCrossing, _flowLayout, flowDirection);
					crossXPoint = new XPoint(endPoint, srcFirstPipe, secondPipe);
					var tSgm = new Segment(edge, srcFirstPipe, null, constants.segmentType().IN_PIPE, srcXPoint, crossXPoint);
					edge.addSegment(tSgm);
					srcFirstPipe.addSegment(tSgm);
					//console.log("ADDED SEGMENT s-c1: "+tSgm.print());
				}  else {
					if (srcFirstPipe.getType() === constants.pipeType().LEVEL_PIPE) {
						middleXing = new PipeCrossing(srcFirstPipe.getOrder(), nextCrossing.getLanePipe(_flowLayout).getOrder(), _flowLayout);

						midPoint = edgesLayoutUtl.getPointInCrossingPipes(
							srcFirstPipe, srcXPoint, middleXing.getLevelPipe(_flowLayout), middleXing.getLanePipe(_flowLayout), flowDirection);
						//middleXPoint =  new XPoint(middleXing.getCenterPoint(), srcFirstPipe);
						middleXPoint =  new XPoint(midPoint, srcFirstPipe);

						nextPoint = edgesLayoutUtl.getPointInCrossingPipes(
							nextCrossing.getLanePipe(_flowLayout), midPoint, nextCrossing.getLevelPipe(_flowLayout), nextCrossing.getLanePipe(_flowLayout), flowDirection);
						//crossXPoint = new XPoint(nextPoint, nextCrossing.getLanePipe(_flowLayout), nextCrossing.getLevelPipe(_flowLayout));
						crossXPoint = new XPoint(nextPoint, nextCrossing.getLevelPipe(_flowLayout), nextCrossing.getLanePipe(_flowLayout));

						segment1 = new Segment(edge, srcFirstPipe, null, constants.segmentType().IN_PIPE, srcXPoint, middleXPoint);
						segment2 = new Segment(edge, nextCrossing.getLanePipe(_flowLayout), null, constants.segmentType().IN_PIPE, middleXPoint, crossXPoint);
						edge.addSegment(segment1);
						srcFirstPipe.addSegment(segment1);
						//console.log("ADDED SEGMENT s-c2: "+segment1.print());
						edge.addSegment(segment2);
						nextCrossing.getLanePipe(_flowLayout).addSegment(segment2);
						//console.log("ADDED SEGMENT s-c3: "+segment2.print());
					} else if (srcFirstPipe.getType() === constants.pipeType().LANE_PIPE) {
						middleXing = new PipeCrossing(nextCrossing.getLevelPipe(_flowLayout).getOrder(), srcFirstPipe.getOrder(), _flowLayout);

						midPoint = edgesLayoutUtl.getPointInCrossingPipes(
							srcFirstPipe, srcXPoint, middleXing.getLevelPipe(_flowLayout), middleXing.getLanePipe(_flowLayout), flowDirection);
						//middleXPoint =  new XPoint(middleXing.getCenterPoint(), srcFirstPipe);
						middleXPoint =  new XPoint(midPoint, srcFirstPipe);

						nextPoint = edgesLayoutUtl.getPointInCrossingPipes(
							nextCrossing.getLevelPipe(_flowLayout), midPoint, nextCrossing.getLevelPipe(_flowLayout), nextCrossing.getLanePipe(_flowLayout), flowDirection);
						//crossXPoint = new XPoint(nextPoint, nextCrossing.getLevelPipe(_flowLayout), nextCrossing.getLanePipe(_flowLayout));
						crossXPoint = new XPoint(nextPoint, nextCrossing.getLanePipe(_flowLayout), nextCrossing.getLevelPipe(_flowLayout));

						segment1 = new Segment(edge, srcFirstPipe, null, constants.segmentType().IN_PIPE, srcXPoint, middleXPoint);
						segment2 = new Segment(edge, nextCrossing.getLevelPipe(_flowLayout), null, constants.segmentType().IN_PIPE, middleXPoint, crossXPoint);
						edge.addSegment(segment1);
						srcFirstPipe.addSegment(segment1);
						//console.log("ADDED SEGMENT s-c4: "+segment1.print());
						edge.addSegment(segment2);
						nextCrossing.getLevelPipe(_flowLayout).addSegment(segment2);
						//console.log("ADDED SEGMENT s-c5: "+segment2.print());
					}
				}
				//console.log("=== connectSourceToCrossing, nextCrossing point: "+crossXPoint.print());
				return crossXPoint;
			}

			///////
			///////
			function connectCrossingToTarget(edge, srcXPoint, trgXPoint) {

				//console.log("=== connectCrossingToTarget, srcXPoint point: "+srcXPoint.print());
				var flowDirection = config.getFlowDirection(),
					srcFirstPipe = srcXPoint.getFirstPipe(),
					srcSecondPipe = srcXPoint.getSecondPipe(),
					trgFirstPipe = trgXPoint.getFirstPipe(),
					trgSecondPipe = trgXPoint.getSecondPipe(),
					middleXing,
					midPoint,
					middleXPoint,
					segment1,
					segment2;

				if (srcFirstPipe.equals(trgFirstPipe) || srcFirstPipe.equals(trgSecondPipe)) {
					// X2T
					var tSgm = new Segment(edge, srcFirstPipe, null, constants.segmentType().IN_PIPE, srcXPoint, trgXPoint);
					//crossXPoint = new XPoint(trgXPoint, srcFirstPipe, srcSecondPipe);
					edge.addSegment(tSgm);
					srcFirstPipe.addSegment(tSgm);
					//console.log("ADDED SEGMENT c-t1: "+tSgm.print());
				} else {
					if (srcFirstPipe.getType() === constants.pipeType().LEVEL_PIPE) {
						// X2T
						if (trgFirstPipe.getType() === constants.pipeType().LEVEL_PIPE) {
							middleXing = new PipeCrossing(trgFirstPipe.getOrder(), srcSecondPipe.getOrder(), _flowLayout);
							midPoint = edgesLayoutUtl.getPointInCrossing(srcSecondPipe, srcXPoint, middleXing, _flowLayout, flowDirection);

							middleXPoint =  new XPoint(midPoint, srcFirstPipe, srcSecondPipe);
							segment1 = new Segment(edge, srcSecondPipe, null, constants.segmentType().IN_PIPE, srcXPoint, middleXPoint);
							segment2 = new Segment(edge, trgFirstPipe, null, constants.segmentType().IN_PIPE, middleXPoint, trgXPoint);
							edge.addSegment(segment1);
							srcSecondPipe.addSegment(segment1);
							//console.log("ADDED SEGMENT c-t2: "+segment1.print());
							edge.addSegment(segment2);
							trgFirstPipe.addSegment(segment2);
							//console.log("ADDED SEGMENT c-t3: "+segment2.print());
						} else {
							middleXing = new PipeCrossing(srcFirstPipe.getOrder(), trgFirstPipe.getOrder(), _flowLayout);
							 //2 ok
							midPoint = edgesLayoutUtl.getPointInCrossing(srcFirstPipe, srcXPoint, middleXing, _flowLayout, flowDirection);

							middleXPoint =  new XPoint(midPoint, srcFirstPipe, srcSecondPipe);
							segment1 = new Segment(edge, srcFirstPipe, null, constants.segmentType().IN_PIPE, srcXPoint, middleXPoint);
							segment2 = new Segment(edge, trgFirstPipe, null, constants.segmentType().IN_PIPE, middleXPoint, trgXPoint);
							edge.addSegment(segment1);
							srcFirstPipe.addSegment(segment1);
							//console.log("ADDED SEGMENT c-t4: "+segment1.print());
							edge.addSegment(segment2);
							trgFirstPipe.addSegment(segment2);
							//console.log("ADDED SEGMENT c-t5: "+segment2.print());
						}

						//middleXPoint =  new XPoint(midPoint, srcFirstPipe, srcSecondPipe);
						//segment1 = new Segment(edge, srcFirstPipe, null, constants.segmentType().IN_PIPE, srcXPoint, middleXPoint);
						//segment2 = new Segment(edge, trgFirstPipe, null, constants.segmentType().IN_PIPE, middleXPoint, trgXPoint);
						//edge.addSegment(segment1);
						//srcFirstPipe.addSegment(segment1);
						////console.log("ADDED SEGMENT: "+segment1.print());
						//edge.addSegment(segment2);
						//trgFirstPipe.addSegment(segment2);
						////console.log("ADDED SEGMENT: "+segment2.print());
					} else if (srcFirstPipe.getType() === constants.pipeType().LANE_PIPE) {
						// X2T
						if (trgFirstPipe.getType() === constants.pipeType().LANE_PIPE) {
							middleXing = new PipeCrossing(srcSecondPipe.getOrder(), trgFirstPipe.getOrder(), _flowLayout);
							midPoint = edgesLayoutUtl.getPointInCrossing(srcSecondPipe, srcXPoint, middleXing, _flowLayout, flowDirection);

							middleXPoint =  new XPoint(midPoint, srcSecondPipe);
							segment1 = new Segment(edge, srcSecondPipe, null, constants.segmentType().IN_PIPE, srcXPoint, middleXPoint);
							segment2 = new Segment(edge, trgFirstPipe, null, constants.segmentType().IN_PIPE, middleXPoint, trgXPoint);
							edge.addSegment(segment1);
							srcSecondPipe.addSegment(segment1);
							//console.log("ADDED SEGMENT c-t6: "+segment1.print());
							edge.addSegment(segment2);
							trgFirstPipe.addSegment(segment2);
							//console.log("ADDED SEGMENT c-t7: "+segment2.print());
						} else {
							middleXing = new PipeCrossing(trgFirstPipe.getOrder(), srcFirstPipe.getOrder(), _flowLayout);
							//midPoint = edgesLayoutUtl.getPointInCrossing(trgFirstPipe, srcXPoint, middleXing, _flowLayout, flowDirection);
							midPoint = edgesLayoutUtl.getPointInCrossing(srcFirstPipe, srcXPoint, middleXing, _flowLayout, flowDirection);

							middleXPoint =  new XPoint(midPoint, srcSecondPipe);
							segment1 = new Segment(edge, srcFirstPipe, null, constants.segmentType().IN_PIPE, srcXPoint, middleXPoint);
							segment2 = new Segment(edge, trgFirstPipe, null, constants.segmentType().IN_PIPE, middleXPoint, trgXPoint);
							edge.addSegment(segment1);
							srcFirstPipe.addSegment(segment1);
							//console.log("ADDED SEGMENT c-t8: "+segment1.print());
							edge.addSegment(segment2);
							trgFirstPipe.addSegment(segment2);
							//console.log("ADDED SEGMENT c-t9: "+segment2.print());
						}
						////middleXing = new PipeCrossing(srcSecondPipe.getOrder(), trgFirstPipe.getOrder(), _flowLayout);
						////midPoint = edgesLayoutUtl.getPointInCrossing(srcSecondPipe, srcXPoint, middleXing, _flowLayout, flowDirection);
						//middleXPoint =  new XPoint(midPoint, srcSecondPipe);
						//segment1 = new Segment(edge, srcSecondPipe, null, constants.segmentType().IN_PIPE, srcXPoint, middleXPoint);
						//segment2 = new Segment(edge, trgFirstPipe, null, constants.segmentType().IN_PIPE, middleXPoint, trgXPoint);
						//edge.addSegment(segment1);
						//srcSecondPipe.addSegment(segment1);
						////console.log("ADDED SEGMENT: "+segment1.print());
						//edge.addSegment(segment2);
						//trgFirstPipe.addSegment(segment2);
						////console.log("ADDED SEGMENT: "+segment2.print());
					}
				}
			}

			function joinInlineSegments(edge) {
				var allSgms = edge.getSegments(),
					groups = [], group, n = 0;
				// remove zero length segments
				while (n < allSgms.length) {
					var sgm = allSgms[n];
					if (sgm.getLength() === 0) {
						allSgms.splice(n, 1);
					} else {
						n++;
					}
				}

				for (var i = 1; i < allSgms.length-1; i++) {
					group = [];
					var firstIdx = i,
						found = edgesLayoutUtl.areSegmentsInline(allSgms[i], allSgms[i+1]);
					while (found) {
						if (i === firstIdx) {
							group.push(allSgms[i]);
						}
						group.push(allSgms[i+1]);
						i++;
						if (i < allSgms.length-1) {
							found = edgesLayoutUtl.areSegmentsInline(allSgms[i], allSgms[i+1]);
						} else {
							break;
						}
					}
					if (group.length > 0) {
						groups.push(group);
					}
				}
				if (groups.length > 0) {
					for (var j = 0; j < groups.length; j++) {
						group = groups[j];
						var firstSgm = group[0],
							pipe = firstSgm.getPipe(),
							idx = edge.getSegmentOrder(firstSgm),
							channelIdx = firstSgm.getChannelIndex(),
							channel = pipe.getChannels()[channelIdx],

							startPnt = firstSgm.getStartPoint(),
							endPnt = group[group.length-1].getEndPoint(),

							newSgm = new Segment(edge, pipe, null, constants.segmentType().IN_PIPE, startPnt, endPnt),
							logPrint = [];
						for (var k = 0; k < group.length; k++) {
							pipe.removeSegmentFromPipe(group[k]);
							logPrint.push("\n -- "+group[k].print());
						}
						logPrint.push("\n ++ "+newSgm.print());
						if (newSgm.getLength() > 0) {
							channel.addSegment(newSgm);
							allSgms.splice(idx, group.length, newSgm);
						}
						else {
							allSgms.splice(idx, group.length);
						}
						//console.log("------------------ FIXED INLINE GROUP:"+logPrint);
					}
				}
			}

			function hasCrossingSegments(edge) {
				var segments = edge.getSegments();
				for (var i = 0; i < segments.length; i++) {
					for (var j = i+1; j < segments.length; j++) {
						if (edgesLayoutUtl.areSegmentsCrossing(segments[i], segments[j])) {
							//console.log("++++++++ SEGMENTS CROSSING:\n\t"+segments[i].print()+"\n\t"+segments[j].print());
							return true;
						}
					}
				}
				return false;
			}

			function removeTracedSegments(edge) {
				var segments = edge.getSegments();
				while (segments.length > 2) {
					var sgm = segments[1],
						pipe = sgm.getPipe();
					pipe.removeSegmentFromPipe(sgm);
					segments.splice(1, 1);
				}
			}

			///////////////
			function getCrossingsOutline(expandedContainers, crossContainer) {
				if (!crossContainer) {
					return undefined;
				}
				var outline = crossContainer.getExpandedShape();
				for (var i = 0; i < expandedContainers.length; i++) {
					if (expandedContainers[i].getHashName() === crossContainer.getHashName()) {
						continue;
					}
					var shape = expandedContainers[i].getExpandedShape();
					if (outline.intersects(shape)) {
						outline = outline.union(shape);
					}
				}
				return outline;
			}

			function getXShape(crossingContainers) {
				if (crossingContainers.length === 0) {
					return new Rectangle(0,0,0,0); //undefined;
				}
				var xFirst = crossingContainers[0],
					outline = xFirst.getExpandedShape();
				for (var i = 0; i < crossingContainers.length; i++) {
					if (crossingContainers[i].getHashName() === xFirst.getHashName()) {
						continue;
					}
					outline = outline.union(crossingContainers[i].getExpandedShape());
				}
				return outline;
			}

			/////////////////////////
			// get the first crossing container, if any
			function getCrossingContainer(expContainers, edgeRect) {
				for (var i = 0; i < expContainers.length; i++) {
					var ctrOutline = expContainers[i].getExpandedShape();
					if (ctrOutline.intersects(edgeRect)) {
						return expContainers[i];
					}
				}
				return undefined;
			}

			function getXContainers(expContainers, edgeRect) {
				var xContainers = [],
					outsiders = [],
					enclosure = edgeRect.clone();
				for (var i = 0; i < expContainers.length; i++) {
					var ctrOutline = expContainers[i].getExpandedShape();
					if (ctrOutline.intersects(edgeRect)) {
						xContainers.push(expContainers[i]);
					} else {
						outsiders.push(expContainers[i]);
					}
				}
				if (xContainers.length > 0) {
					xContainers.forEach(function(ctr) {
						enclosure = enclosure.union(ctr.getExpandedShape());
					});
					outsiders.forEach(function(ctr) {
						if (enclosure.intersects(ctr.getExpandedShape())) {
							xContainers.push(ctr);
						}
					});
				}
				return xContainers;
			}

			function get2PointRectangle(p1, p2) {
				var minX = Math.min(p1.x, p2.x),
					minY = Math.min(p1.y, p2.y),
					maxX = Math.max(p1.x, p2.x),
					maxY = Math.max(p1.y, p2.y);
				return new Rectangle(minX, minY, maxX - minX, maxY - minY);
			}

			function excludeAnchorNodes(containers, srcNode, trgNode) {
				var filtered = [];
				containers.forEach(function(ctr) {
					if (!ctr.equals(srcNode) && !ctr.equals(trgNode)) {
						filtered.push(ctr);
					}
				});
				return filtered;
			}
		}
		return EdgesLayout;
	}
);