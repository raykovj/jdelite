define('modules/layout/edgesLayoutUtils',
	['modules/geometry/point',
		'modules/graph/xPoint',
		'modules/graph/corridor',
		'modules/graph/pipe',
		'modules/graph/pipeCrossing',
		'modules/graph/segment',
		'modules/graph/graphConstants'],
	function(Point,
	         XPoint,
	         Corridor,
	         Pipe,
	         PipeCrossing,
	         Segment,
	         constants) {

		var isPipeUsed = function(edge, pipe) {
			var segments = edge.getSegments();
			for (var i = 0; i < segments.length; i++) {
				//if (pipe.hasPointInside(segments[i].getStartPoint()) && pipe.hasPointInside(segments[i].getEndPoint())) {
				//	return true;
				//}
				if (segments[i].getPipe().equals(pipe)) {
					return true;
				}
			}
			return false;
		},
		getXPoint = function(pipe, refPnt, xLevelPipe, xLanePipe, orientation) {
			var pnt;
			if (orientation === constants.flow().VERTICAL) {
				if (pipe.getType() === constants.pipeType().LANE_PIPE) {
					pnt = new Point(refPnt.x, xLevelPipe.y + Math.floor(xLevelPipe.height/2));
				} else if (pipe.getType() === constants.pipeType().LEVEL_PIPE) {
					pnt = new Point(xLanePipe.x + Math.floor(xLanePipe.width/2), refPnt.y);
				}
			} else if (orientation === constants.flow().HORIZONTAL) {
				if (pipe.getType() === constants.pipeType().LANE_PIPE) {
					//pnt = new Point(refPnt.x, pipe.y + Math.floor(pipe.height/2));
					pnt = new Point(xLevelPipe.x + Math.floor(xLevelPipe.width/2), refPnt.y);
				} else if (pipe.getType() === constants.pipeType().LEVEL_PIPE) {
					//pnt = new Point(pipe.x + Math.floor(pipe.width/2), refPnt.y);
					pnt = new Point(refPnt.x, xLanePipe.y + Math.floor(xLanePipe.height/2));
				}
			} else {
				pnt = new Point(0, 0);
			}
			//console.log("**** getPipeXSideCenter: "+pnt.showXY());
			return pnt;
		},
		getSegmentForCrossing = function(crossings, pipeXing) {
			for (var i = 0; i < crossings.length; i++) {
				var corner = crossings[i].getXCorner();
				if (corner.firstSegment().getPipe().equals(pipeXing.getLevelPipe(pipeXing.getFlowLayout())) ||
					corner.firstSegment().getPipe().equals(pipeXing.getLanePipe(pipeXing.getFlowLayout())) ) {
					return corner.firstSegment();
				}
				if (corner.secondSegment().getPipe().equals(pipeXing.getLevelPipe(pipeXing.getFlowLayout())) ||
					corner.secondSegment().getPipe().equals(pipeXing.getLanePipe(pipeXing.getFlowLayout())) ) {
					return corner.secondSegment();
				}
			}
			return undefined;
		};

		return {

			getPointInCrossing: function(pipe, refPnt, crossing, flowLayout, orientation) {
				var xLevelPipe = crossing.getLevelPipe(flowLayout),
					xLanePipe = crossing.getLanePipe(flowLayout);
				return getXPoint(pipe, refPnt, xLevelPipe, xLanePipe, orientation);
			},

			getPointInCrossingPipes: function(pipe, refPnt, xLevelPipe, xLanePipe, orientation) {
				return getXPoint(pipe, refPnt, xLevelPipe, xLanePipe, orientation);
			},

			getPipeXSideCenter: function(pipe, refPnt, orientation) {
				//console.log("---- getPipeXSideCenter refPnt: "+refPnt.showXY());
				var pnt;
				if (orientation === constants.flow().HORIZONTAL) {
					if (pipe.getType() === constants.pipeType().LEVEL_PIPE) {
						pnt = new Point(pipe.x + Math.floor(pipe.width/2), refPnt.y);
					} else if (pipe.getType() === constants.pipeType().LANE_PIPE) {
						pnt = new Point(refPnt.x, pipe.y + Math.floor(pipe.height/2));
					}
				} else if (orientation === constants.flow().VERTICAL) {
					if (pipe.getType() === constants.pipeType().LEVEL_PIPE) {
						pnt = new Point(refPnt.x, pipe.y + Math.floor(pipe.height/2));
					} else if (pipe.getType() === constants.pipeType().LANE_PIPE) {
						pnt = new Point(pipe.x + Math.floor(pipe.width/2), refPnt.y);
					}
				} else {
					pnt = new Point(0, 0);
				}
				//console.log("**** getPipeXSideCenter: "+pnt.showXY());
				return pnt;
			},

			getCorridorXSideCenter: function(corridor, refPnt, orientation) {
				var pnt;
				if (orientation === constants.flow().HORIZONTAL) {
					if (corridor.getType() === Corridor.TYPE.LEVEL) {
						pnt = new Point(corridor.x + Math.floor(corridor.width/2), refPnt.y);
					} else if (corridor.getType() === Corridor.TYPE.LANE) {
						pnt = new Point(refPnt.x, corridor.y + Math.floor(corridor.height/2));
					}
				} else if (orientation === constants.flow().VERTICAL) {
					if (corridor.getType() === Corridor.TYPE.LEVEL) {
						pnt = new Point(refPnt.x, corridor.y + Math.floor(corridor.height/2));
					} else if (corridor.getType() === Corridor.TYPE.LANE) {
						pnt = new Point(corridor.x + Math.floor(corridor.width/2), refPnt.y);
					}
				} else {
					pnt = new Point(0, 0);
				}
				return pnt;
			},

			/**
			 * Use to make sure the lane defined by laneIdx does not contain nodes in the specified level range
			 * (inclusive-exclusive)
			 *  levels - levels list
			 *  laneIdx - lane to check
			 *  startLevelIdx - next to src node level
			 *  endLevelIdx - trg node level
			 */
			isLevelRangeEmptyForLane: function(levels, laneIdx, startLevelIdx, endLevelIdx, blockedCells) {
				var i, start = startLevelIdx, end = endLevelIdx;
				if (startLevelIdx > endLevelIdx) {
					start = endLevelIdx;
					end = startLevelIdx;
				}
				start = start >= 0 ? start : 0;
				end = end <= levels.length-1 ? end : levels.length-1;
				if (blockedCells) {
					for (i = 0; i < blockedCells.length; i++) {
						if (blockedCells[i].laneNum === laneIdx &&
							blockedCells[i].levelNum >= start && blockedCells[i].levelNum <= end) {
							return false;
						}
					}
				}
				for (i = start; i <= end; i++) {
					var level = levels[i],
						cell = level.getCellAtLane(laneIdx);
					if (cell && cell.getNode() && cell.getNode().isVisible()) {
						return false;
					}
				}
				return true;
			},

			/**
			 * Use to make sure the level defined by levelIdx does not contain nodes in the specified lane range
			 * (inclusive-inclusive)
			 *  lanes - lanes list
			 *  levelIdx - level to check
			 *  startLaneIdx - next to src node lane
			 *  endLaneIdx - trg node lane
			 */
			isLaneRangeEmptyForLevel: function(lanes, levelIdx, startLaneIdx, endLaneIdx, blockedCells) {
				var i, start = startLaneIdx, end = endLaneIdx;
				if (startLaneIdx > endLaneIdx) {
					start = endLaneIdx;
					end = startLaneIdx;
				}
				start = start >= 0 ? start : 0;
				end = end <= lanes.length-1 ? end : lanes.length-1;
				if (blockedCells) {
					for (i = 0; i < blockedCells.length; i++) {
						if (blockedCells[i].levelNum === levelIdx &&
							blockedCells[i].laneNum >= start && blockedCells[i].laneNum <= end) {
							return false;
						}
					}
				}
				for (i = start; i <= end; i++) {
					var lane = lanes[i],
						cell = lane.getCellAtLevel(levelIdx);
					if (cell && cell.getNode() && cell.getNode().isVisible()) {
						return false;
					}
				}
				return true;
			},
			isMatchingSide: function(side, value) {
				return (side & value) > 0;
			},
			isSourceMatchingSide: function(edge, value) {
				return (edge.getSourcePort().getSide() & value) > 0;
			},
			isTargetMatchingSide: function(edge, value) {
				return (edge.getTargetPort().getSide() & value) > 0;
			},
			testPrint: function(edges, levelPipes, lanePipes, call) {
				for (var i = 0; i < edges.length; i++) {
					if (edges[i].getName() === "[L1/OUT-0]-[R1/IN-0]") {
						console.log("======= "+call+" ======== testPrint EDGE: "+edges[i].print());
					}
				}
				if (levelPipes)
				for (var j = 0; j < levelPipes.length; j++) {
					if (levelPipes[j].getType() === constants.pipeType().LEVEL_PIPE && levelPipes[j].getOrder() === 1) {
						console.log("======= "+call+" ======== testPrint LEVEL PIPE: "+levelPipes[j].print());
					}
				}
				if (lanePipes)
				for (var j = 0; j < lanePipes.length; j++) {
					if (lanePipes[j].getType() === constants.pipeType().LANE_PIPE && lanePipes[j].getOrder() === 2) {
						console.log("======= "+call+" ======== testPrint LANE PIPE: "+lanePipes[j].print());
					}
				}
			},
			areSegmentsInline: function(sgm1, sgm2) {
				var s1p1 = sgm1.getStartPoint(),
					s1p2 = sgm1.getEndPoint(),
					s2p1 = sgm2.getStartPoint(),
					s2p2 = sgm2.getEndPoint();

				if (s1p1.y == s1p2.y && //s1p1.x != s1p2.x &&
					s2p1.y == s2p2.y && //s2p1.x != s2p2.x &&
					s1p1.y == s2p1.y) {
					// both horizontal and inline
					return true;
				} else if (s1p1.x == s1p2.x && //s1p1.y != s1p2.y &&
					s2p1.x == s2p2.x && //s2p1.y != s2p2.y &&
					s1p1.x == s2p1.x) {
					// both vertical and inline
					return true;
				}
				return false;
			},
			areSegmentsCrossing: function(sgm1, sgm2) {
				var s1p1 = sgm1.getStartPoint(),
					s1p2 = sgm1.getEndPoint(),
					s2p1 = sgm2.getStartPoint(),
					s2p2 = sgm2.getEndPoint();
				if (s1p1.equals(s2p2) || s1p2.equals(s2p1)) {
					// joined
					return false;
				}
				var s1minX = Math.min(s1p1.x, s1p2.x),
					s1minY = Math.min(s1p1.y, s1p2.y),
					s1maxX = Math.max(s1p1.x, s1p2.x),
					s1maxY = Math.max(s1p1.y, s1p2.y),
					s2minX = Math.min(s2p1.x, s2p2.x),
					s2minY = Math.min(s2p1.y, s2p2.y),
					s2maxX = Math.max(s2p1.x, s2p2.x),
					s2maxY = Math.max(s2p1.y, s2p2.y);

				if (s1minY === s1maxY && s1minX !== s1maxX) {
					// s1 is horizontal
					if (s2minX === s2maxX && s2minY !== s2maxY) {
						// s2 is vertical
						return (s2minX > s1minX && s2minX < s1maxX &&
								s1minY > s2minY && s1minY < s2maxY);
					}
				} else if (s1minX === s1maxX && s1minY !== s1maxY) {
					// s1 is vertical
					if (s2minY === s2maxY && s2minX !== s2maxX) {
						// s2 is horizontal
						return (s1minX > s2minX && s1minX < s2maxX &&
								s2minY > s1minY && s2minY < s1maxY);
					}
				}
				// either parallel, or inline, or non-perpendicular ?
				return false;
			},
			isPointProjectionOnSegment: function(pnt, sgm) {
				var p1 = sgm.getStartPoint(),
					p2 = sgm.getEndPoint(),
					minX = Math.min(p1.x, p2.x),
					minY = Math.min(p1.y, p2.y),
					maxX = Math.max(p1.x, p2.x),
					maxY = Math.max(p1.y, p2.y);
				if (minY === maxY && minX != maxX) {
					// horizontal
					return pnt.x > minX && pnt.x < maxX;
				} else if (minX === maxX && minY != maxY) {
					// vertical
					return pnt.y > minY && pnt.y < maxY;
				}
				return false;
			},
			getIndexForCrossing: function(edge, pipeXing) {
				if (edge.getForcedCrossings().length === 0) {
					// push, otherwise splice
					return -1;
				}
				var forcedCrossings = edge.getForcedCrossings(),
					corner = pipeXing.getXCorner(),
					levelPipeIdx = corner.firstSegment().getPipe().getType() === constants.pipeType().LEVEL_PIPE ?
						corner.firstSegment().getPipe().getOrder() : corner.secondSegment().getPipe().getOrder(),
					lanePipeIdx = corner.firstSegment().getPipe().getType() === constants.pipeType().LANE_PIPE ?
						corner.firstSegment().getPipe().getOrder() : corner.secondSegment().getPipe().getOrder();

				for (var i = 0; i < forcedCrossings.length; i++) {
					if (levelPipeIdx === forcedCrossings[i].getLevelPipeOrder()) {
						if (lanePipeIdx < forcedCrossings[i].getLanePipeOrder()) {
							return i;
						} else if (lanePipeIdx > forcedCrossings[i].getLanePipeOrder()) {
							return i+1;
						}
					} else if (lanePipeIdx === forcedCrossings[i].getLanePipeOrder()) {
						if (levelPipeIdx < forcedCrossings[i].getLevelPipeOrder()) {
							return i;
						} else if (levelPipeIdx > forcedCrossings[i].getLevelPipeOrder()) {
							return i+1;
						}
					}
				}
				return -1;
			}

			//getUnusedPipe: function(edge, crossing) {
			//	var levelPipe = crossing.getLevelPipe(),
			//		lanePipe = crossing.getLanePipe(),
			//		segments = edge.getSegments(),
			//		found;
			//	for (var i = 0; i < segments.length; i++) {
			//		if (!crossing.hasPointInside(segments[i].getStartPoint()) && !crossing.hasPointInside(segments[i].getEndPoint())) {
			//			continue;
			//		}
			//		if (segments[i].getPipe().equals(lanePipe)) {
			//			found = true;
			//			break;
			//		}
			//	}
			//	if (!found) {
			//		return lanePipe;
			//	}
			//	found = false;
			//	for (var j = 0; j < segments.length; j++) {
			//		if (!crossing.hasPointInside(segments[i].getStartPoint()) && !crossing.hasPointInside(segments[i].getEndPoint())) {
			//			continue;
			//		}
			//		if (segments[j].getPipe().equals(levelPipe)) {
			//			found = true;
			//			break;
			//		}
			//	}
			//	if (!found) {
			//		return levelPipe;
			//	}
			//	//return undefined;
			//	return lanePipe;
			//}
			//getNearestCrossing: function(edge, cnxPnt, node, corner, layout) {
			//	var cnxPipe = cnxPnt.getFirstPipe(),
			//		xLevelPipe, xLanePipe;
			//	if (cnxPipe.getType() === constants.pipeType().LEVEL_PIPE) {
			//		//xLanePipe = corner.getLanePipe().getOrder() <= node.getLaneNumber() ?
			//		//	layout.getLanePipes()[node.getLaneNumber()] : layout.getLanePipes()[node.getLaneNumber()+1];
			//		var leftLanePipe = layout.getLanePipes()[node.getLaneNumber()],
			//			leftUsed = isPipeUsed(edge, leftLanePipe),
			//			rightLanePipe = layout.getLanePipes()[node.getLaneNumber()+1],
			//			rightUsed = isPipeUsed(edge, rightLanePipe);
			//		if (corner.getLanePipe().getOrder() <= node.getLaneNumber()) {
			//			// left
			//			if (!leftUsed) { xLanePipe = leftLanePipe; }
			//			else if (!rightUsed) { xLanePipe = rightLanePipe; }
			//		} else {
			//			// right
			//			if (!rightUsed) { xLanePipe = rightLanePipe; }
			//			else if (!leftUsed) { xLanePipe = leftLanePipe; }
			//		}
			//		if (xLanePipe) {
			//			return new PipeCrossing(cnxPipe, xLanePipe);
			//		}
			//	} else if (cnxPipe.getType() === constants.pipeType().LANE_PIPE) {
			//		//xLevelPipe = corner.getLevelPipe().getOrder() <= node.getLevelNumber() ?
			//		//	layout.getLevelPipes()[node.getLevelNumber()] : layout.getLevelPipes()[node.getLevelNumber()+1];
            //
			//		var topLevelPipe = layout.getLevelPipes()[node.getLevelNumber()],
			//			topUsed = isPipeUsed(edge, topLevelPipe),
			//			bottomLevelPipe = layout.getLevelPipes()[node.getLevelNumber()+1],
			//			bottomUsed = isPipeUsed(edge, bottomLevelPipe);
			//		if (corner.getLevelPipe().getOrder() <= node.getLevelNumber()) {
			//			// top
			//			if (!topUsed) { xLevelPipe = topLevelPipe; }
			//			else if (!bottomUsed) { xLevelPipe = bottomLevelPipe; }
			//		} else {
			//			// bottom
			//			if (!bottomUsed) { xLevelPipe = bottomLevelPipe; }
			//			else if (!topUsed) { xLevelPipe = topLevelPipe; }
			//		}
			//		if (xLevelPipe) {
			//			return new PipeCrossing(xLevelPipe, cnxPipe);
			//		}
			//	}
			//	return undefined;
			//}

	}
	}
);
