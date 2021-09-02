define('modules/layout/layoutUtils',
	['modules/geometry/point',
		'modules/graph/xPoint',
		'modules/geometry/rectangle',
		'modules/graph/cell',
		'modules/graph/graphElement',
		'modules/graph/graphNode',
		'modules/graph/connector',
		'modules/graph/corridor',
		'modules/graph/segment',
		'modules/graph/segmentChannel',
		'modules/graph/segmentPoint',
		'modules/diagram/diagramUtils',
		'modules/graph/graphConstants'],
	function(Point,
	         XPoint,
	         Rectangle,
	         Cell,
	         GraphElement,
	         GraphNode,
	         Connector,
	         Corridor,
	         Segment,
	         SegmentChannel,
	         SegmentPoint,
			 dgmUtl,
	         constants) {

		//function LayoutUtils() {
			//var self = this;

			var //MAX_JOINT_SGM_CHECKS = 10,
				//MAX_CROSSING_SGM_CHECKS = 10,
				DEBUG = false,
				CLEARANCE = Math.floor(constants.segmentsGap().MIN);

			var areProjectionsOverlapping = function (s1p1, s1p2, s2p1, s2p2, ds1, ds2, delta) {
				if (s1p1.y == s1p2.y && s1p1.x != s1p2.x &&
					s2p1.y == s2p2.y && s2p1.x != s2p2.x) {
					// both horizontal and may or may not be inlined
					var s1minX = Math.min(s1p1.x, s1p2.x);
					var s1maxX = Math.max(s1p1.x, s1p2.x);
					// check if at least one of s2 ends is close to s1 ends by delta
					if (s2p1.x + ds2 + delta >= s1minX - ds1 && s2p1.x - ds2 - delta <= s1maxX + ds1 ||
						s2p2.x + ds2 + delta >= s1minX - ds1 && s2p2.x - ds2 - delta <= s1maxX + ds1) {
						// overlapping
						return true;
					}
					var s2minX = Math.min(s2p1.x, s2p2.x);
					var s2maxX = Math.max(s2p1.x, s2p2.x);
					// check if at least one of s1 ends is close to s2 ends by delta
					if (s1p1.x + ds1 + delta >= s2minX - ds2 && s1p1.x - ds1 - delta <= s2maxX + ds2 ||
						s1p2.x + ds1 + delta >= s2minX - ds2 && s1p2.x - ds1 - delta <= s2maxX + ds2) {
						// overlapping
						return true;
					}
				} else if (s1p1.y != s1p2.y && s1p1.x == s1p2.x &&
					s2p1.y != s2p2.y && s2p1.x == s2p2.x) {
					// both vertical and may or may not be inlined
					var s1minY = Math.min(s1p1.y, s1p2.y);
					var s1maxY = Math.max(s1p1.y, s1p2.y);
					// check if at least one of s2 ends is close to s1 ends by delta
					if (s2p1.y + ds2 + delta >= s1minY - ds1 && s2p1.y - ds2 - delta <= s1maxY + ds1 ||
						s2p2.y + ds2 + delta >= s1minY - ds1 && s2p2.y - ds2 - delta <= s1maxY + ds1) {
						// overlapping
						return true;
					}
					var s2minY = Math.min(s2p1.y, s2p2.y);
					var s2maxY = Math.max(s2p1.y, s2p2.y);
					// check if at least one of s1 ends is close to s2 ends by delta
					if (s1p1.y + ds1 + delta >= s2minY - ds2 && s1p1.y - ds1 - delta <= s2maxY + ds2 ||
						s1p2.y + ds1 + delta >= s2minY - ds2 && s1p2.y - ds1 - delta <= s2maxY + ds2) {
						// overlapping
						return true;
					}
				}
				return false;
			};

			var areIntersecting = function (sgm1, sgm2) {
				if (!sgm1 || !sgm2) {
					return false;
				}
				var s1p1 = sgm1.getStartPoint(),
					s1p2 = sgm1.getEndPoint(),
					s1minX = Math.min(s1p1.x, s1p2.x),
					s1minY = Math.min(s1p1.y, s1p2.y),
					s1maxX = Math.max(s1p1.x, s1p2.x),
					s1maxY = Math.max(s1p1.y, s1p2.y),
					s2p1 = sgm2.getStartPoint(),
					s2p2 = sgm2.getEndPoint(),
					s2minX = Math.min(s2p1.x, s2p2.x),
					s2minY = Math.min(s2p1.y, s2p2.y),
					s2maxX = Math.max(s2p1.x, s2p2.x),
					s2maxY = Math.max(s2p1.y, s2p2.y),
					ds1 = Math.floor(sgm1.getThickness() / 2) > 0 ? Math.floor(sgm1.getThickness() / 2) : 1,
					ds2 = Math.floor(sgm2.getThickness() / 2) > 0 ? Math.floor(sgm2.getThickness() / 2) : 1;

				if (s1minY === s1maxY && s1minX !== s1maxX) {
					// s1 is horizontal
					if (s2minX === s2maxX && s2minY !== s2maxY) {
						// s2 is vertical
						if (s2minY - ds2 > s1minY + ds1 && s2maxY - ds2 > s1minY + ds1 ||
							s2minY + ds2 < s1minY - ds1 && s2maxY + ds2 < s1minY - ds1) {
							// both ends of s2 are on same side of s1 vertically
							return false;
						} else if (s1minX - ds1 > s2minX + ds2 && s1maxX - ds1 > s2minX + ds2 ||
							s1minX + ds1 < s2minX - ds2 && s1maxX + ds1 < s2minX - ds2) {
							// both ends of s1 are on same side of s2 horizontally
							return false;
						} else {
							// x-ing
							return true;
						}
					}
				} else if (s1minX === s1maxX && s1minY !== s1maxY) {
					// s1 is vertical
					if (s2minY === s2maxY && s2minX !== s2maxX) {
						// s2 is horizontal
						if (s2minX - ds2 > s1minX + ds1 && s2maxX - ds2 > s1minX + ds1 ||
							s2minX + ds2 < s1minX - ds1 && s2maxX + ds2 < s1minX - ds1) {
							// both ends of s2 are on same side of s1
							return false;
						} else if (s1minY - ds1 > s2minY + ds2 && s1maxY - ds1 > s2minY + ds2 ||
							s1minY + ds1 < s2minY - ds2 && s1maxY + ds1 < s2minY - ds2) {
							// both ends of s1 are on same side of s2
							return false;
						} else {
							// x-ing
							return true;
						}
					}
				}
				//if (s1p1.y == s1p2.y && s1p1.x != s1p2.x) {
				//	// s1 is horizontal
				//	if (s2p1.x == s2p2.x && s2p1.y != s2p2.y) {
				//		// s2 is vertical
				//
				//		if (s2p1.y - ds2 > s1p1.y + ds1 && s2p2.y - ds2 > s1p1.y + ds1 ||
				//			s2p1.y + ds2 < s1p1.y - ds1 && s2p2.y + ds2 < s1p1.y - ds1) {
				//			// both ends of s2 are on same side of s1 vertically
				//			return false;
				//		} else if (s1p1.x - ds1 > s2p1.x + ds2 && s1p2.x - ds1 > s2p1.x + ds2 ||
				//			s1p1.x + ds1 < s2p1.x - ds2 && s1p2.x + ds1 < s2p1.x - ds2) {
				//			// both ends of s1 are on same side of s2 horizontally
				//			return false;
				//		} else {
				//			// x-ing
				//			return true;
				//		}
				//	}
				//} else if (s1p1.x == s1p2.x && s1p1.y != s1p2.y) {
				//	// s1 is vertical
				//	if (s2p1.y == s2p2.y && s2p1.x != s2p2.x) {
				//		// s2 is horizontal
				//		if (s2p1.x - ds2 > s1p1.x + ds1 && s2p2.x - ds2 > s1p1.x + ds1 ||
				//			s2p1.x + ds2 < s1p1.x - ds1 && s2p2.x + ds2 < s1p1.x - ds1) {
				//			// both ends of s2 are on same side of s1
				//			return false;
				//		} else if (s1p1.y - ds1 > s2p1.y + ds2 && s1p2.y - ds1 > s2p1.y + ds2 ||
				//			s1p1.y + ds1 < s2p1.y - ds2 && s1p2.y + ds1 < s2p1.y - ds2) {
				//			// both ends of s1 are on same side of s2
				//			return false;
				//		} else {
				//			// x-ing
				//			return true;
				//		}
				//	}
				//}
				// either parallel, or inline, or non-perpendicular ?
				return false;
			};

		/**
		 * check if segments are closer than clearance
		 * @param sgm1
		 * @param sgm2
		 * @param delta
		 * @returns {boolean}
		 */
		var arePipeSegmentsInProximityViolation = function (sgm1, sgm2, delta) {
			return isSegmentInViolationToSegment(sgm1, sgm2, delta) ||
				isSegmentInViolationToSegment(sgm2, sgm1, delta);
		};

		/**
			 * check if the first of two parallel segments is closer than clearance to the second
			 * needs to be called twice with different segments order
			 * sgm1 - first segment, whose ends are tested
			 * sgm2 - second segment
			 * delta - the clearance
			 */
			var isSegmentInViolationToSegment = function (sgm1, sgm2, delta) {
				var sR1 = Math.floor(sgm1.getThickness() / 2) > 0 ? Math.floor(sgm1.getThickness() / 2) : 1;
				return isPointInViolation(sgm1.getStartPoint(), sR1, sgm2, delta) ||
					isPointInViolation(sgm1.getEndPoint(), sR1, sgm2, delta);
			};

			/**
			 * pnt - the point
			 * pR  - the point radius
			 * sgm  - the segment
			 * delta - the clearance
			 */
			var isPointInViolation = function (pnt, pR, sgm, delta) {
				var sp1 = sgm.getStartPoint();
				var sp2 = sgm.getEndPoint();
				var sR = Math.floor(sgm.getThickness() / 2) > 0 ? Math.floor(sgm.getThickness() / 2) : 1;

				if (sp1.y == sp2.y) {
					// horizontal segment
					var sminX = Math.min(sp1.x, sp2.x) - sR;
					var smaxX = Math.max(sp1.x, sp2.x) + sR;
					if (pnt.x + pR + delta >= sminX && pnt.x - pR - delta <= smaxX) {
						// projection on X axis within delta boundaries
						if (pnt.y == sp1.y) {
							return true;
						} else if (pnt.y > sp1.y) {
							// below
							if (pnt.y - pR - delta < sp1.y + sR) {
								return true;
							}
						} else if (pnt.y < sp1.y) {
							// above
							if (pnt.y + pR + delta > sp1.y - sR) {
								return true;
							}
						}
					}
				} else if (sp1.x == sp2.x) {
					// vertical segment
					var sminY = Math.min(sp1.y, sp2.y) - sR;
					var smaxY = Math.max(sp1.y, sp2.y) + sR;
					if (pnt.y + pR + delta >= sminY && pnt.y - pR - delta <= smaxY) {
						// projection on Y axis within delta boundaries
						if (pnt.x == sp1.x) {
							return true;
						} else if (pnt.x > sp1.x) {
							// to the right
							if (pnt.x - pR - delta < sp1.x + sR) {
								return true;
							}
						} else if (pnt.x < sp1.x) {
							// to the left
							if (pnt.x + pR + delta > sp1.x - sR) {
								return true;
							}
						}
					}
				}
				return false;
			};

			var areOverlapping = function (segment1, segment2) {
				var s1p1 = segment1.getStartPoint(),
					s1p2 = segment1.getEndPoint(),
					s2p1 = segment2.getStartPoint(),
					s2p2 = segment2.getEndPoint(),
					ds1 = Math.floor(segment1.getThickness() / 2),
					ds2 = Math.floor(segment2.getThickness() / 2);

				if (s1p1.y == s1p2.y && //s1p1.x != s1p2.x &&
					s2p1.y == s2p2.y && //s2p1.x != s2p2.x &&
					s1p1.y == s2p1.y) {
					// both horizontal and inlined
					var s1minX = Math.min(s1p1.x, s1p2.x);
					var s1maxX = Math.max(s1p1.x, s1p2.x);
					// check if at least one of s2 ends is between s1 ends
					if (s2p1.x + ds2 >= s1minX - ds1 && s2p1.x - ds2 <= s1maxX + ds1 ||
						s2p2.x + ds2 >= s1minX - ds1 && s2p2.x - ds2 <= s1maxX + ds1) {
						// overlapping
						return true;
					}
					var s2minX = Math.min(s2p1.x, s2p2.x);
					var s2maxX = Math.max(s2p1.x, s2p2.x);
					// check if at least one of s1 ends is between s2 ends
					if (s1p1.x + ds1 >= s2minX - ds2 && s1p1.x - ds1 <= s2maxX + ds2 ||
						s1p2.x + ds1 >= s2minX - ds2 && s1p2.x - ds1 <= s2maxX + ds2) {
						// overlapping
						return true;
					}
				} else if (s1p1.x == s1p2.x && //s1p1.y != s1p2.y &&
					s2p1.x == s2p2.x && //s2p1.y != s2p2.y &&
					s1p1.x == s2p1.x) {
					// both vertical and inlined
					var s1minY = Math.min(s1p1.y, s1p2.y);
					var s1maxY = Math.max(s1p1.y, s1p2.y);
					// check if at least one of s2 ends is between s1 ends
					if (s2p1.y + ds2 >= s1minY - ds1 && s2p1.y - ds2 <= s1maxY + ds1 ||
						s2p2.y + ds2 >= s1minY - ds1 && s2p2.y - ds2 <= s1maxY + ds1) {
						// overlapping
						return true;
					}
					var s2minY = Math.min(s2p1.y, s2p2.y);
					var s2maxY = Math.max(s2p1.y, s2p2.y);
					// check if at least one of s1 ends is between s2 ends
					if (s1p1.y + ds1 >= s2minY - ds2 && s1p1.y - ds1 <= s2maxY + ds2 ||
						s1p2.y + ds1 >= s2minY - ds2 && s1p2.y - ds1 <= s2maxY + ds2) {
						// overlapping
						return true;
					}
				}
				return false;
			};

			// used in pipe merge
			var haveChannelsProjectionsOverlapping = function (iChannel, jChannel, clearance) {
				for (var i = 0; i < iChannel.getSegments().length; i++) {
					for (var j = 0; j < jChannel.getSegments().length; j++) {
						if (areSegmentsProjectionsOverlapping(iChannel.getSegments()[i], jChannel.getSegments()[j], clearance)) {
							return true;
						}
					}
				}
				return false;
			};

			var areSegmentsInClearanceViolation = function (segment1, segment2, delta) {
				var s1p1 = segment1.getStartPoint();
				var s1p2 = segment1.getEndPoint();
				var s2p1 = segment2.getStartPoint();
				var s2p2 = segment2.getEndPoint();
				var ds1 = Math.floor(segment1.getThickness() / 2);
				var ds2 = Math.floor(segment2.getThickness() / 2);
				var offset = ds1 + delta + ds2;

				if (s1p1.y == s1p2.y && s2p1.y == s2p2.y) {
					// both horizontal
					if (Math.abs(s1p1.y - s2p1.y) < offset) {
						return areProjectionsOverlapping(s1p1, s1p2, s2p1, s2p2, ds1, ds2, delta);
					}
				} else if (s1p1.x == s1p2.x && s2p1.x == s2p2.x) {
					// both vertical
					if (Math.abs(s1p1.x - s2p1.x) < offset) {
						return areProjectionsOverlapping(s1p1, s1p2, s2p1, s2p2, ds1, ds2, delta);
					}
				}
				return false;
			};

			var hasSegmentConflicts = function (channels, thisChannel, thisSegment) {
				for (var i = 0; i < channels.length; i++) {
					var channel = channels[i];
					if (channel.getOrder() === thisChannel.getOrder()) {
						continue;
					}
					var segments = channel.getSegments();
					for (var j = 0; j < segments.length; j++) {
						var sgm = segments[j];
						if (!sgm.isSiblingWith(thisSegment) &&
							areSegmentsInProximityViolation(sgm, thisSegment, CLEARANCE)) {
							return true;
						}
					}
				}
				return false;
			};

			var areSegmentsInProximityViolation = function (iiSegment, jjSegment, jointDistance) {
				var spPair = getEndsWithinProximity(iiSegment, jjSegment, jointDistance);
				if (spPair && spPair.length > 1) {
					var s1 = spPair[0].getSegment();
					var s2 = spPair[1].getSegment();
					// get adjacent segments
					var s11 = s1.getEdge().getAdjacentSegment(s1, spPair[0].getPoint());
					var s22 = s2.getEdge().getAdjacentSegment(s2, spPair[1].getPoint());
					// check if adjacent segments are in conflict
					if (s11 && s22 &&
						areSegmentsInClearanceViolation(s11, s22, jointDistance)) {
						return true;
					}
				}
				return false;
			};

			var getEndsWithinProximity = function (s1, s2, delta) {
				var s1p1 = s1.getStartPoint();
				var s1p2 = s1.getEndPoint();
				var s2p1 = s2.getStartPoint();
				var s2p2 = s2.getEndPoint();
				var ds1 = Math.floor(s1.getThickness() / 2);
				var ds2 = Math.floor(s2.getThickness() / 2);
				var offset = ds1 + delta + ds2;

				if (Math.abs(s2p1.x - s1p1.x) < offset || Math.abs(s2p1.y - s1p1.y) < offset) {
					return [new SegmentPoint(s1, constants.segmentPointDef.START), new SegmentPoint(s2, constants.segmentPointDef.START)];
				} else if (Math.abs(s2p2.x - s1p1.x) < offset || Math.abs(s2p2.y - s1p1.y) < offset) {
					return [new SegmentPoint(s1, constants.segmentPointDef.START), new SegmentPoint(s2, constants.segmentPointDef.END)];
				} else if (Math.abs(s2p1.x - s1p2.x) < offset || Math.abs(s2p1.y - s1p2.y) < offset) {
					return [new SegmentPoint(s1, constants.segmentPointDef.END), new SegmentPoint(s2, constants.segmentPointDef.START)];
				} else if (Math.abs(s2p2.x - s1p2.x) < offset || Math.abs(s2p2.y - s1p2.y) < offset) {
					return [new SegmentPoint(s1, constants.segmentPointDef.END), new SegmentPoint(s2, constants.segmentPointDef.END)];
				} else {
					return null;
				}
			};

			//var canChannelAcceptSegment = function (iChannel, iiSegment, clearance) {
			//	var segments = iChannel.getSegments();
			//	for (var i = 0; i < segments.length; i++) {
			//		var sgm = segments[i];
			//		if (sgm.equals(iiSegment)) {
			//			continue;
			//		}
			//		areSegmentsProjectionsOverlapping())
			//		if (isSegmentInViolationToSegment(sgm, iiSegment, clearance)) {
			//		//if (isSegmentInViolationToSegment(sgm, iiSegment, clearance)) {
			//			return false;
			//		}
			//	}
			//	return true;
			//};

		// used for merge
			var areSegment2ChannelSideBox = function (iiSegment, kChannel, b) {
				var segments = kChannel.getSegments();
				//if (b) {
				//	console.log("		SIDE BOX  i == 5 && j == 6 && k == 5: length = "+segments.length);
				//}
				for (var i = 0; i < segments.length; i++) {
					if (segments[i].equals(iiSegment)) {
						continue;
					}
					//if (b) {
					//	console.log("		- segment: "+segments[i].print());
					//}
					if (areSegmentsInSideBox(iiSegment, segments[i])) {
						//console.log("		- SIDE BOX segments: \n"+segments[i].print()+"   X\n"+iiSegment.print());
						return true;
					}
				}
				return false;
			};

			var areSegmentsInSideBox = function (iiSegment, jjSegment) {
				var iiSegmentPrev = iiSegment.getEdge().getPreviousSegment(iiSegment);
				var iiSegmentNext = iiSegment.getEdge().getNextSegment(iiSegment);
				if (!iiSegmentPrev || !iiSegmentNext) {
					return false;
				}
				var jjSegmentPrev = jjSegment.getEdge().getPreviousSegment(jjSegment);
				var jjSegmentNext = jjSegment.getEdge().getNextSegment(jjSegment);
				if (!jjSegmentPrev || !jjSegmentNext) {
					return false;
				}
				return (areIntersecting(iiSegment, jjSegmentPrev) ||
					areIntersecting(iiSegment, jjSegmentNext))
					&&
					(areIntersecting(jjSegment, iiSegmentPrev) ||
					areIntersecting(jjSegment, iiSegmentNext));
			};

			var areAdjacentSegmentsOverlapping = function (iiSegment, jjSegment) {
				var iiSegmentPrev = iiSegment.getEdge().getPreviousSegment(iiSegment);
				var iiSegmentNext = iiSegment.getEdge().getNextSegment(iiSegment);
				if (!iiSegmentPrev || !iiSegmentNext) {
					return false;
				}
				var jjSegmentPrev = jjSegment.getEdge().getPreviousSegment(jjSegment);
				var jjSegmentNext = jjSegment.getEdge().getNextSegment(jjSegment);
				if (!jjSegmentPrev || !jjSegmentNext) {
					return false;
				}
				return (areOverlapping(iiSegmentPrev, jjSegmentPrev) ||
					areOverlapping(iiSegmentNext, jjSegmentNext) ||
					areOverlapping(iiSegmentNext, jjSegmentPrev) ||
					areOverlapping(iiSegmentPrev, jjSegmentNext));
			};

			var areSegment2ChannelCrossBox = function (iiSegment, kChannel, b) {
				var segments = kChannel.getSegments();
				//if (b) {
				//	console.log("		CROSS BOX i == 5 && j == 6 && k == 5: length = "+segments.length);
				//}
				for (var i = 0; i < segments.length; i++) {
					if (segments[i].equals(iiSegment)) {
						continue;
					}
					//if (b) {
					//	console.log("		- segment: "+segments[i].print());
					//}
					if (areSegmentsInCrossBox(iiSegment, segments[i])) {
						//console.log("		- CROSS BOX segments: \n"+segments[i].print()+"   X\n"+iiSegment.print());
						return true;
					}
				}
				return false;
			};

			var areSegmentsInCrossBox = function(iiSegment, jjSegment) {
				var iiSegmentPrev = iiSegment.getEdge().getPreviousSegment(iiSegment);
				var iiSegmentNext = iiSegment.getEdge().getNextSegment(iiSegment);
				if (!iiSegmentPrev || !iiSegmentNext) {
					return false;
				}
				var jjSegmentPrev = jjSegment.getEdge().getPreviousSegment(jjSegment);
				var jjSegmentNext = jjSegment.getEdge().getNextSegment(jjSegment);
				if (!jjSegmentPrev || !jjSegmentNext) {
					return false;
				}
				return areIntersecting(iiSegment, jjSegmentPrev) &&
					areIntersecting(iiSegment, jjSegmentNext)
					||
					areIntersecting(jjSegment, iiSegmentPrev) &&
					areIntersecting(jjSegment, iiSegmentNext);
			};

			var getCrossBoxSegment = function(iiSegment, jjSegment) {
				var iiSegmentPrev = iiSegment.getEdge().getPreviousSegment(iiSegment);
				var iiSegmentNext = iiSegment.getEdge().getNextSegment(iiSegment);
				if (!iiSegmentPrev || !iiSegmentNext) {
					return undefined;
				}
				var jjSegmentPrev = jjSegment.getEdge().getPreviousSegment(jjSegment);
				var jjSegmentNext = jjSegment.getEdge().getNextSegment(jjSegment);
				if (!jjSegmentPrev || !jjSegmentNext) {
					return undefined;
				}
				if (areIntersecting(iiSegment, jjSegmentPrev) &&
					areIntersecting(iiSegment, jjSegmentNext)) {
					return jjSegment;
				} else if (areIntersecting(jjSegment, iiSegmentPrev) &&
					areIntersecting(jjSegment, iiSegmentNext)) {
					return iiSegment;
				} else {
					return undefined;
				}
			};

			var hasChannelConflicts = function (iChannel, iiSegment, jjSegment, clearance) {
				var segments = iChannel.getSegments();
				for (var i = 0; i < segments.length; i++) {
					var sgm = segments[i];
					if (sgm.equals(iiSegment)) {
						continue;
					}
					//if (areOverlapping(sgm, jjSegment) || areSegmentsInProximityViolation(sgm, jjSegment, clearance)) {
					//if (!sgm.isSiblingWith(jjSegment) &&
					//		areSegmentsProjectionsOverlapping(sgm, jjSegment, clearance)) {
					if (areSegmentsProjectionsOverlapping(sgm, jjSegment, clearance)) {
						return true;
					}
				}
				return false;
			};

			var getNoConflictChannels = function (channels, segment, clearance) {
				var ncChannels = [];
				for (var i = 0; i < channels.length; i++) {
					var channel = channels[i];
					if (!hasSegmentConflictsInChanel(channel, segment, clearance)) {
						ncChannels.push(channel);
					}
				}
				return ncChannels;
			};

			var hasSegmentConflictsInChanel = function(channel, segment, clearance) {
				var segments = channel.getSegments();
				for (var i = 0; i < segments.length; i++) {
					var sgm = segments[i];
					if (areSegmentsProjectionsOverlapping(sgm, segment,clearance)) {
						return true;
					}
					//if (areOverlapping(sgm, segment) ||
					//	areSegmentsInProximityViolation(sgm, segment, clearance) ||
					//	areSegmentsProjectionsOverlapping(sgm, segment,clearance)) {
					//	return true;
					//}
				}
				return false;
			};

			var areSegmentsProjectionsOverlapping = function (sgm1, sgm2, delta) {
				//var s1p1 = sgm1.getStartPoint();
				//var s1p2 = sgm1.getEndPoint();
				//var s2p1 = sgm2.getStartPoint();
				//var s2p2 = sgm2.getEndPoint();
				//var ds1 = Math.floor(sgm1.getThickness() / 2) > 0 ? Math.floor(sgm1.getThickness() / 2) : 1;
				//var ds2 = Math.floor(sgm2.getThickness() / 2) > 0 ? Math.floor(sgm2.getThickness() / 2) : 1;

				var s1p1 = sgm1.getStartPoint(),
					s1p2 = sgm1.getEndPoint(),
					s1minX = Math.min(s1p1.x, s1p2.x),
					s1minY = Math.min(s1p1.y, s1p2.y),
					s1pMin = new Point(s1minX, s1minY),
					s1maxX = Math.max(s1p1.x, s1p2.x),
					s1maxY = Math.max(s1p1.y, s1p2.y),
					s1pMax = new Point(s1maxX, s1maxY),
					s2p1 = sgm2.getStartPoint(),
					s2p2 = sgm2.getEndPoint(),
					s2minX = Math.min(s2p1.x, s2p2.x),
					s2minY = Math.min(s2p1.y, s2p2.y),
					s2pMin = new Point(s2minX, s2minY),
					s2maxX = Math.max(s2p1.x, s2p2.x),
					s2maxY = Math.max(s2p1.y, s2p2.y),
					s2pMax = new Point(s2maxX, s2maxY),
					ds1 = Math.floor(sgm1.getThickness() / 2) > 0 ? Math.floor(sgm1.getThickness() / 2) : 1,
					ds2 = Math.floor(sgm2.getThickness() / 2) > 0 ? Math.floor(sgm2.getThickness() / 2) : 1;

				//return areProjectionsOverlapping(s1p1, s1p2, s2p1, s2p2, ds1, ds2, delta);
				return areProjectionsOverlapping(s1pMin, s1pMax, s2pMin, s2pMax, ds1, ds2, delta);
			};

			// step # 3
			var checkOverlappingSegmentsInChannel = function (pipe) {
				var result = constants.result().OK,
					CHECKIT = pipe.getType() === constants.pipeType().LEVEL_PIPE && pipe.getOrder() === 2;
				if (CHECKIT) {
					//console.log("************************************ CHECK PIPE: "+pipe.print());
					//console.log("************************************ CHECK PIPE: LEVEL, 2");
				}
				var bValue = false;
				if (pipe.getChannels().length > 0) {
					// outer loop - channels
					for (var i = 0; i < pipe.getChannels().length; i++) {
						var iChannel = pipe.getChannels()[i];
						// outer loop - segments in channel i
						for (var ii = 0; ii < iChannel.getSegments().length; ii++) {
							var iiSegment = iChannel.getSegments()[ii];
							// inner loop - continue in channels
							for (var jj = ii + 1; jj < iChannel.getSegments().length; jj++) {
								var jjSegment = iChannel.getSegments()[jj];
								if (iiSegment.isSiblingWith(jjSegment)) {
									continue;
								}
								// check projections overlapping - may have conflicts
								var areOver = areOverlapping(iiSegment, jjSegment) ||
									areSegmentsInClearanceViolation(iiSegment, jjSegment, CLEARANCE);
								if (areOver) {
									if (DEBUG)
									//if (CHECKIT)
										//console.log("**** CHECK PIPE: SEGMENTS overlap on proximity: " + pipe.print() + "\n" +
										console.log("**** CHECK PIPE: SEGMENTS overlap on proximity: " + "\n" +
										iiSegment.print() + "\n" + jjSegment.print() + "\n");

									//result = attemptToMoveSegmentToOtherChannel(pipe, iChannel, iiSegment, CLEARANCE);
									result = attemptToMoveSegmentToOtherChannel(pipe, iChannel, jjSegment);
									if (result === constants.result().OK) {
										result = constants.result().HAS_FIX;
									}
									if (DEBUG)
									//result = constants.result().FAILED;
									console.log("???? attemptToMoveSegmentToOtherChannel: "+result);
									bValue = true;
									//break;
								}
								if (bValue) {
									break;
								}
							}
							if (bValue) {
								break;
							}
						}
						if (bValue) {
							break;
						}
					}
				}
				return result;
			};

			// SIDE_BOX or CROSS_BOX
			var checkSegmentsForCrossingsLocal = function(pipe, xing) {
				var result = constants.result().OK;
				var bValue = false;
				var CHECKIT = pipe.getType() === constants.pipeType().LEVEL_PIPE && pipe.getOrder() === 2;
				if (CHECKIT) {
					//console.log("--------------------------------- CROSSING, level pipe 2, "+dgmUtl.getCrossingName(xing));
					//console.log("                                  CHANNELS: "+pipe.getChannels().length);
				}
				if (pipe.getChannels().length > 1) {
					// outer loop - channels
					for (var i = 0; i < pipe.getChannels().length; i++) {
						var iChannel = pipe.getChannels()[i];
						// outer loop - segments in channel i
						for (var ii = 0; ii < iChannel.getSegments().length; ii++) {
							var iiSegment = iChannel.getSegments()[ii];
							// inner loop - continue in channels
							for (var j = i+1; j < pipe.getChannels().length; j++) {
								var jChannel = pipe.getChannels()[j];
								// inner loop - segments in channel j
								for (var jj = 0; jj < jChannel.getSegments().length; jj++) {
									var jjSegment = jChannel.getSegments()[jj];

									if (iiSegment.getEdge().equals(jjSegment.getEdge())) {
										continue;
									}

									// check projections overlapping - may have conflicts
									// NOTE: DO NOT !!! exclude overlapping of adjacent segments because
									// it messes up with across node check later on
									var areOver = //!areAdjacentSegmentsOverlapping(iiSegment, jjSegment) &&
												//areAdjacentSegmentsOverlapping(iiSegment, jjSegment) ||
													areSegmentsProjectionsOverlapping(iiSegment, jjSegment, 0);
									if (areOver) {
										//console.log("********** areOver");
										if (xing === constants.pipeXing().SIDE_BOX) {
											// "side box": one adjacent sgm of each of the two segments intersects the other
											if (areSegmentsInSideBox(iiSegment, jjSegment)) {
												//if (CHECKIT)
												if (DEBUG)
													console.log("****** SIDE BOX crossing, pipe type: "+pipe.getType()+", order: "+pipe.getOrder()+"\n" +
														iiSegment.print2()+"\n" + jjSegment.print2());
														//iiSegment.getEdge().getName()+" <> " + jjSegment.getEdge().getName());
												if (hasSegmentConflictsInChanel(iChannel, jjSegment, CLEARANCE) ||
													hasSegmentConflictsInChanel(jChannel, iiSegment, CLEARANCE)) {
													//moveSegmentOutOfBoxLocal(pipe, i, iiSegment, j, jjSegment);
													moveSegmentOutOfCrossBox(pipe, i, iiSegment, j, jjSegment);
													//if (CHECKIT)
														if (DEBUG)
														console.log("		**** SIDE BOX MOVE OUT ");
													result = constants.result().RETRY_FIX;
												} else { //if (iiSegment.isSwappable() && jjSegment.isSwappable()) {
													pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
													//if (CHECKIT)
														if (DEBUG)
														console.log("		**** SIDE BOX SWAP ");
													result = constants.result().HAS_FIX;
												}
												bValue = true;
												break;
											}

										} else if (xing === constants.pipeXing().CROSS_BOX) {
											// "cross box": both adjacent sgms of one sgm intersect the other, or vice versa
											if (areSegmentsInCrossBox(iiSegment, jjSegment)) {
												// side box detected
												//if (CHECKIT)
												if (DEBUG)
													console.log("****** CROSS BOX crossing, pipe type: "+pipe.getType()+", order: "+pipe.getOrder()+"\n" +
														iiSegment.print2()+"\n" + jjSegment.print2());
														//iiSegment.getEdge().getName()+" <> " + jjSegment.getEdge().getName());
												if (hasSegmentConflictsInChanel(iChannel, jjSegment, CLEARANCE) ||
													hasSegmentConflictsInChanel(jChannel, iiSegment, CLEARANCE)) {
													//moveSegmentOutOfBoxLocal(pipe, i, iiSegment, j, jjSegment);
													moveSegmentOutOfCrossBox(pipe, i, iiSegment, j, jjSegment);
													//if (CHECKIT)
														if (DEBUG)
														console.log("		**** CROSS BOX MOVE OUT ");
													result = constants.result().RETRY_FIX;
												} else { //if (iiSegment.isSwappable() && jjSegment.isSwappable()) {
													pipe.swapSegments(iChannel, iiSegment, jChannel, jjSegment);
													//if (CHECKIT)
														if (DEBUG)
														console.log("		**** CROSS BOX SWAP ");
													result = constants.result().HAS_FIX;
												}
												bValue = true;
												break;
											}
										}
									}
								}
								if (bValue) {
									break;
								}
							}
							if (bValue) {
								break;
							}
						}
						if (bValue) {
							break;
						}
					}
				}
				return result;
			};

			var moveSegmentOutOfBoxLocal = function(pipe, ii, iiSegment, jj, jjSegment) {
				var iChannel = pipe.getSegmentChannel(iiSegment),//pipe.getChannels()[ii],
					jChannel = pipe.getSegmentChannel(jjSegment),// pipe.getChannels()[jj]
					i = iiSegment.getChannelIndex(),
					j = jjSegment.getChannelIndex(),
					newIdx = Math.max(i,j)+ 1;
				//if (newIdx == 5 && pipe.getChannels().length === 5) {
				//	console.log("%%% HERE WE ARE !!!");
				//}
				pipe.insertEmptyChannelAtIndex(newIdx);
				var newChannel = pipe.getChannels()[newIdx];
				//var CHECKIT = pipe.getType() === constants.pipeType().LEVEL_PIPE && pipe.getOrder() === 2;
				//if (CHECKIT) {
					//console.log("&&&&& PIPE: moveSegmentOutOfBoxLocal: "+pipe.getChannels().length); //print());
				//}
				if (i < j) {
					pipe.moveSegment(iiSegment, iChannel, newChannel);
				} else if (i > j) {
					pipe.moveSegment(jjSegment, jChannel, newChannel);
				}
			};

			var moveSegmentOutOfCrossBox = function(pipe, i, iiSegment, j, jjSegment) {
				var iChannel = pipe.getSegmentChannel(iiSegment),//pipe.getChannels()[ii],
					jChannel = pipe.getSegmentChannel(jjSegment),// pipe.getChannels()[jj]
					newIdx = Math.max(i,j)+ 1;
				//console.log("		++++++ BEFORE "+iiSegment.print0());
				if (newIdx < pipe.getChannels().length &&
						!hasSegmentConflictsInChanel(pipe.getChannels()[newIdx], iiSegment, CLEARANCE)) {
					pipe.moveSegment(iiSegment, iChannel, pipe.getChannels()[newIdx]);
					if (DEBUG)
						console.log("		++++++ MOVE OUT "+iiSegment.print2()+
						", from chn = "+iChannel.getOrder()+
						", new chn = "+pipe.getChannels()[newIdx].getOrder());
				} else {
					pipe.insertEmptyChannelAtIndex(newIdx);
					var newChannel = pipe.getChannels()[newIdx];
					pipe.moveSegment(iiSegment, iChannel, newChannel);
					if (DEBUG)
						console.log("		++++++ MOVE OUT "+iiSegment.print2()+
						", from chn = "+iChannel.getOrder()+
						", new chn = "+newChannel.getOrder());
				}
				//console.log("		++++++ AFTER  "+iiSegment.print0());
			};

			var attemptToMoveSegmentInSideBox = function (pipe, iChannel, iiSegment, jChannel, jjSegment, clearance) {
				if (DEBUG) console.log("---- attemptToMoveSegmentInSideBox");
				var ncjjChannels = getNoConflictChannels(pipe.getChannels(), jjSegment, clearance),
					i = 0, found = false, newChannel = null;
				if (ncjjChannels.length > 0) {
					found = false;
					for (i = 0; i < ncjjChannels.length; i++) {
						newChannel = ncjjChannels[i];
						pipe.moveSegment(jjSegment, jChannel, newChannel);
						if (hasSegmentConflicts(pipe.getChannels(), newChannel, jjSegment, clearance) ||
							areSegmentsInSideBox(iiSegment, jjSegment) ||
							areSegmentsInCrossBox(iiSegment, jjSegment)) {
							// roll back
							pipe.moveSegment(jjSegment, newChannel, jChannel);
						} else {
							found = true;
							break;
						}
					}
					if (found) {
						return constants.result().OK;
					}
				}
				var nciiChannels = getNoConflictChannels(pipe.getChannels(), iiSegment, clearance);
				if (nciiChannels.length > 0) {
					found = false;
					for (i = 0; i < nciiChannels.length; i++) {
						newChannel = nciiChannels[i];
						pipe.moveSegment(iiSegment, iChannel, newChannel);
						if (hasSegmentConflicts(pipe.getChannels(), newChannel, iiSegment, clearance) ||
							areSegmentsInSideBox(iiSegment, jjSegment) ||
							areSegmentsInCrossBox(iiSegment, jjSegment)) {
							// roll back
							pipe.moveSegment(iiSegment, newChannel, iChannel);
						} else {
							found = true;
							break;
						}
					}
					if (found) {
						return constants.result().OK;
					}
				}
				return constants.result().FAILED;
			};

			//DUPLICATE !!!
			//var areAdjacentSegmentsOverlapping = function (iiSegment, jjSegment) {
			//	var iiSegmentPrev = iiSegment.getEdge().getPreviousSegment(iiSegment);
			//	var iiSegmentNext = iiSegment.getEdge().getNextSegment(iiSegment);
			//	if (!iiSegmentPrev || !iiSegmentNext) {
			//		return [];
			//	}
			//	var jjSegmentPrev = jjSegment.getEdge().getPreviousSegment(jjSegment);
			//	var jjSegmentNext = jjSegment.getEdge().getNextSegment(jjSegment);
			//	if (!jjSegmentPrev || !jjSegmentNext) {
			//		return [];
			//	}
			//	if (areOverlapping(iiSegmentPrev, jjSegmentPrev)) {
			//		return [iiSegmentPrev, jjSegmentPrev];
			//	} else if (areOverlapping(iiSegmentPrev, jjSegmentNext)) {
			//		return [iiSegmentPrev, jjSegmentNext];
			//	} else if (areOverlapping(iiSegmentNext, jjSegmentPrev)) {
			//		return [iiSegmentNext, jjSegmentPrev];
			//	} else if (areOverlapping(iiSegmentNext, jjSegmentNext)) {
			//		return [iiSegmentNext, jjSegmentNext];
			//	} else {
			//		return [];
			//	}
			//};

			var attemptToMoveSegmentInCrossBox = function (pipe, iChannel, iiSegment, jChannel, jjSegment, clearance) {
				var ncjjChannels = getNoConflictChannels(pipe.getChannels(), jjSegment, clearance),
					i = 0, found = false, newChannel = null;
				if (ncjjChannels.length > 0) {
					found = false;
					for (i = 0; i < ncjjChannels.length; i++) {
						newChannel = ncjjChannels[i];
						pipe.moveSegment(jjSegment, jChannel, newChannel);
						if (hasSegmentConflicts(pipe.getChannels(), newChannel, jjSegment, clearance) ||
							areSegmentsInCrossBox(iiSegment, jjSegment)) {
							// roll back
							pipe.moveSegment(jjSegment, newChannel, jChannel);
						} else {
							found = true;
							break;
						}
					}
					if (found) {
						return constants.result().OK;
					}
				}
				var nciiChannels = getNoConflictChannels(pipe.getChannels(), iiSegment, clearance);
				if (nciiChannels.length > 0) {
					found = false;
					for (i = 0; i < nciiChannels.length; i++) {
						newChannel = nciiChannels[i];
						pipe.moveSegment(iiSegment, iChannel, newChannel);
						if (hasSegmentConflicts(pipe.getChannels(), newChannel, iiSegment, clearance) ||
							areSegmentsInCrossBox(iiSegment, jjSegment)) {
							// roll back
							pipe.moveSegment(iiSegment, newChannel, iChannel);
						} else {
							found = true;
							break;
						}
					}
					if (found) {
						return constants.result().OK;
					}
				}
				return constants.result().FAILED;
			};

		// not used
		//	var checkPipeForAdjacentViolations = function (pipe) {
		//		var result = constants.result().OK,
		//			bValue = false;
		//		if (pipe.getChannels().length > 1) {// && pipe.getType() == Pipe.Type.LEVEL_PIPE && pipe.getOrder() == 2) {
		//			// outer loop - channels
		//			for (var i = 0; i < pipe.getChannels().length; i++) {
		//				var iChannel = pipe.getChannels()[i];
		//				// outer loop - segments in channel i
		//				for (var ii = 0; ii < iChannel.getSegments().length; ii++) {
		//					var iiSegment = iChannel.getSegments()[ii];
		//					// inner loop - continue in channels
		//					for (var j = i + 1; j < pipe.getChannels().length; j++) {
		//						var jChannel = pipe.getChannels()[j];
		//						// inner loop - segments i channel j
		//						for (var jj = 0; jj < jChannel.getSegments().length; jj++) {
		//							var jjSegment = jChannel.getSegments()[jj];
		//							// check projections overlapping - may have conflicts
        //
		//							var areOver = areSegmentsProjectionsOverlapping(iiSegment, jjSegment, 0);
		//							if (areOver) {
		//								var conflictSegments = areAdjacentSegmentsOverlapping(iiSegment, jjSegment);
		//								if (conflictSegments.length == 2) {
		//									if (iiSegment.getEdge().isOptimizationBlocked() && jjSegment.getEdge().isOptimizationBlocked()) {
		//										console.log("++++ checkPipeForAdjacentViolations");
		//										console.log("++++ blocked, offset ports: " + iiSegment.getEdge().print() + ", " + jjSegment.getEdge().print());
		//										//System.out.println("+++++++++++++++++++++++++++");
		//										iiSegment.getEdge().getSourcePort().setOffsetStep(1);
		//										jjSegment.getEdge().getSourcePort().setOffsetStep(1);
		//										result = constants.result().REDO_LAYOUT;
		//										bValue = true;
		//										break;
		//									} else {
		//										if (!iiSegment.getEdge().isOptimizationBlocked()) {
		//											console.log("++++ checkPipeForAdjacentViolations");
		//											console.log("++++ block optimization: " + iiSegment.getEdge().print());
		//											//System.out.println("+++++++++++++++++++++++++++");
		//											iiSegment.getEdge().setOptimizationBlocked(true);
		//											result = constants.result().REDO_LAYOUT;
		//											bValue = true;
		//											break;
		//										} else if (!jjSegment.getEdge().isOptimizationBlocked()) {
		//											console.log("++++ checkPipeForAdjacentViolations");
		//											console.log("++++ block optimization: " + jjSegment.getEdge().print());
		//											//System.out.println("+++++++++++++++++++++++++++");
		//											jjSegment.getEdge().setOptimizationBlocked(true);
		//											result = constants.result().REDO_LAYOUT;
		//											bValue = true;
		//											break;
		//										}
		//									}
		//								}
		//							}
		//						}
		//						if (bValue) {
		//							break;
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
		//		}
		//		return result;
		//	};

			//var getAcceptingChannels = function (channels, segment, clearance) {
			//	var ncChannels = [];
			//	for (var i = 0; i < channels.length; i++) {
			//		var channel = channels[i];
			//		if (canChannelAcceptSegment(channel, segment, clearance)) {
			//			ncChannels.push(channel);
			//		}
			//	}
			//	return ncChannels;
			//};

			//var checkForCrossingSegmentsInPipe = function (pipe, xing) {
			//	var max = MAX_CROSSING_SGM_CHECKS;
			//	var result = constants.result().OK;
			//	while (max > 0) {
			//		result = checkSegmentsForCrossings(pipe, xing);
			//		if (result === constants.result().OK) {
			//			if (DEBUG)
			//				console.log("OK: crossings, attempts=" + (MAX_JOINT_SGM_CHECKS - max) + ", " + pipe.print() + ":\n");
			//			break;
			//		} else if (result === constants.result().FAILED) {
			//			if (DEBUG)
			//				console.log("FAILED: crossings, attempts=" + (MAX_JOINT_SGM_CHECKS - max) + ", " + pipe.print() + ":\n");
			//			break;
			//		} else if (result === constants.result().HAS_FIX) {
			//			// continue
			//			max--;
			//		} else if (result === constants.result().REDO_LAYOUT) {
			//			// break: need to restart
			//			return result;
			//		}
			//	}
			//	if (result === constants.result().FAILED || max === 0) {
			//		// either failed or max attempts is not successful
			//		console.log("\n*** Failed to resolve pipe crossing segments:\n" + pipe.print() + "\n");
			//		result = constants.result().FAILED;
			//	}
			//	return result;
			//};

		// not used
		//	var checkSegmentsForAdjacentViolations = function (pipe) {
		//		var maxAdjacentChecks = pipe.getChannels().length * 2,
		//			max = maxAdjacentChecks;
		//		var result = constants.result().OK;
		//		while (max > 0) {
		//			result = checkPipeForAdjacentViolations(pipe);
		//			if (result === constants.result().OK) {
		//				if (DEBUG)
		//					console.log("OK: checkSegmentsForAdjacentViolations, attempts=" + (maxAdjacentChecks - max) + ", " + pipe.print() + "\n");
		//				break;
		//			} else if (result === constants.result().FAILED) {
		//				console.log("FAILED: checkSegmentsForAdjacentViolations, runs left=" + max + ", " + pipe.print() + "\n");
		//				break;
		//			} else if (result === constants.result().HAS_FIX) {
		//				console.log("HAS_FIX checkSegmentsForAdjacentViolations, runs left=" + max + ", " + pipe.print() + "\n");
		//				max--;
		//				// has to break for this check
		//				break;
		//			} else if (result === constants.result().REDO_LAYOUT) {
		//				// break: need to restart
		//				return result;
		//			}
		//		}
		//		if (result === constants.result().FAILED || max === 0) {
		//			// either failed or max attempts is not successful
		//			if (DEBUG)
		//				console.log("\n*** Failed to resolve pipe adjacent violations:\n" + pipe.print() + "\n");
		//			result = constants.result().FAILED;
		//		}
		//		return result;
		//	};

			var swapPortsLocations = function (iiPort, iiSgm, jjPort, jjSgm, node, side) {
				// swap ports
				var iiCnx = iiPort.getConnector();
				var iiOrder = iiCnx.getOrder();

				var jjCnx = jjPort.getConnector();
				var jjOrder = jjCnx.getOrder();

				var dx = jjCnx.x - iiCnx.x;
				var dy = jjCnx.y - iiCnx.y;

				iiCnx.translate(dx, dy);
				iiSgm.adjustStartPoint(dx, dy);
				iiSgm.adjustEndPoint(dx, dy);
				iiCnx.setOrder(jjOrder);

				jjCnx.translate(-dx, -dy);
				jjSgm.adjustStartPoint(-dx, -dy);
				jjSgm.adjustEndPoint(-dx, -dy);
				jjCnx.setOrder(iiOrder);

				if (node) {
					node.sortSideConnectors(side);
				}
			};

			// outputs = front ports
			var checkFrontCrossings = function (node, outEdges, pipeToTest) {
				var result = constants.result().OK;
				var bValue = false;
				var startSegments = [];
				for (var i = 0; i < outEdges.length; i++) {
					var startSgm = outEdges[i].getSourceSegment();
					if (startSgm) {
						startSegments.push(startSgm);
					}
				}
				if (startSegments.length < 2) {
					return result;
				}
				for (var ii = 0; ii < startSegments.length; ii++) {
					var iiSgm = startSegments[ii];
					for (var jj = ii + 1; jj < startSegments.length; jj++) {
						var jjSgm = startSegments[jj];
						if (iiSgm.getStartPoint().equals(jjSgm.getStartPoint())) {
							// TODO: this is fan-out, do we need to lookup in settings ?
							continue;
						}
						var iiEdge = iiSgm.getEdge();
						var jjEdge = jjSgm.getEdge();
						var iiSgmNext = iiEdge.getNextSegment(iiSgm);
						var iiSgmNext1 = iiSgmNext ? iiEdge.getNextSegment(iiSgmNext) : null;
						var jjSgmNext = jjEdge.getNextSegment(jjSgm);
						var jjSgmNext1 = jjSgmNext ? jjEdge.getNextSegment(jjSgmNext) : null;
						if (areIntersecting(iiSgm, jjSgmNext) ||
							areIntersecting(jjSgm, iiSgmNext) ) {
							// this often reverts the swap that solves the above intersection
							//areIntersecting(iiSgmNext, jjSgmNext1) ||
							//areIntersecting(jjSgmNext, iiSgmNext1)) {
							// swap ports on edges
							var iiPort = iiSgm.getEdge().getSourcePort();
							var jjPort = jjSgm.getEdge().getSourcePort();
							swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, constants.nodeSide().FRONT);
							if (DEBUG)
								console.log("   ??*** FRONT CROSSING AT NODE, swap ports at node: " +
								iiPort.getPath() + " <> " + jjPort.getPath());
							if (areOverlapping(iiSgmNext, jjSgmNext)) {
								// swap failed
								swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, constants.nodeSide().FRONT);
								var iiChannel = pipeToTest.getSegmentChannel(iiSgmNext);
								var jjChannel = pipeToTest.getSegmentChannel(jjSgmNext);
								if (iiChannel && jjChannel) {
									result = attemptToMoveSegmentToOtherChannel(
										//pipeToTest, iiChannel, iiSgmNext, jjChannel, jjSgmNext, CLEARANCE);
										pipeToTest, jjChannel, jjSgmNext);
									if (result === constants.result().OK) {
										result = constants.result().HAS_FIX;
									}
									if (DEBUG)
										console.log("    -##- checkFrontCrossings: overlapping, move to other channel: " + result);
								}
							} else {
								result = constants.result().HAS_FIX;
							}
							bValue = true;
							break;
						}
						if (bValue) {
							break;
						}
					}
					if (bValue) {
						break;
					}
				}
				return result;
			};

		// front NEXT
		var checkFrontCrossingsNEXT = function (node, outEdges, inEdges,  pipeToTest) {
			var result = constants.result().OK, i,
				bValue = false,
				frontSegments = [];
			for (i = 0; i < outEdges.length; i++) {
				var outSgm = outEdges[i].getSourceSegment();
				if (outSgm) {
					frontSegments.push(outSgm);
				}
			}
			for (i = 0; i < inEdges.length; i++) {
				var inSgm = inEdges[i].getTargetSegment();
				if (inSgm) {
					frontSegments.push(inSgm);
				}
			}
			if (frontSegments.length < 2) {
				return result;
			}
			//var CHECKIT = pipeToTest.getType() === constants.pipeType().LEVEL_PIPE && pipeToTest.getOrder() === 2;
			//if (CHECKIT) {
			//	//console.log("---------NEXT-------- FRONT CROSSINGS, level pipe, order = 2 ");
			//}
			for (var ii = 0; ii < frontSegments.length; ii++) {
				var iiSgm = frontSegments[ii];
				for (var jj = ii + 1; jj < frontSegments.length; jj++) {
					var jjSgm = frontSegments[jj];

					var iiEdge = iiSgm.getEdge(),
						jjEdge = jjSgm.getEdge();
					//var iiSgmNext = iiEdge.getNextSegment(iiSgm);
					//var jjSgmNext = jjEdge.getNextSegment(jjSgm);

					var iiSgmSbl = iiEdge.isStartSegment(iiSgm) ? iiEdge.getNextSegment(iiSgm) : iiEdge.getPreviousSegment(iiSgm);
					var jjSgmSbl = jjEdge.isStartSegment(jjSgm) ? jjEdge.getNextSegment(jjSgm) : jjEdge.getPreviousSegment(jjSgm);

					var iiSgmSblA = iiEdge.isStartSegment(iiSgm) ? iiEdge.getNextSegment(iiSgmSbl) : iiEdge.getPreviousSegment(iiSgmSbl);
					var jjSgmSblA = jjEdge.isStartSegment(jjSgm) ? jjEdge.getNextSegment(jjSgmSbl) : jjEdge.getPreviousSegment(jjSgmSbl);

					var iiPort = iiEdge.isStartSegment(iiSgm) ? iiSgm.getEdge().getSourcePort() : iiSgm.getEdge().getTargetPort();
					var jjPort = jjEdge.isStartSegment(jjSgm) ? jjSgm.getEdge().getSourcePort() : jjSgm.getEdge().getTargetPort();

					if (areIntersecting(iiSgm, jjSgmSbl) ||
						areIntersecting(jjSgm, iiSgmSbl) ) {
						// swap ports on edges
						swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, constants.nodeSide().FRONT);
						if (DEBUG)
							console.log("   ??*** FRONT CROSSING AT NODE, swap ports at node: " +
								iiPort.getPath() + " <> " + jjPort.getPath());
						if (areOverlapping(iiSgmSbl, jjSgmSbl)) {
							// swap failed
							swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, constants.nodeSide().FRONT);
							var iiChannel = pipeToTest.getSegmentChannel(iiSgmSbl);
							var jjChannel = pipeToTest.getSegmentChannel(jjSgmSbl);
							if (iiChannel && jjChannel) {
								result = attemptToMoveSegmentToOtherChannel(
									//pipeToTest, iiChannel, iiSgmNext, jjChannel, jjSgmNext, CLEARANCE);
									pipeToTest, jjChannel, jjSgmSbl);
								if (result === constants.result().OK) {
									result = constants.result().HAS_FIX;
								}
								if (DEBUG)
									console.log("    -##- checkFrontCrossingsNEXT: overlapping, move to other channel: " + result);
							}
						} else {
							result = constants.result().HAS_FIX;
						}
						bValue = true;
						break;
					}

					if (areIntersecting(iiSgmSbl, jjSgmSblA) || areIntersecting(iiSgm, jjSgmSblA) ||
						areIntersecting(jjSgmSbl, iiSgmSblA) || areIntersecting(jjSgm, iiSgmSblA) ) {
						// swap ports on edges
						swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, constants.nodeSide().FRONT);
						if (DEBUG)
							console.log("   ??*** FRONT CROSSING AT NODE, swap ports at node: " +
								iiPort.getPath() + " <> " + jjPort.getPath());
						////////////
						// TODO: looks like needs the above code
						////////////
						result = constants.result().HAS_FIX;
						bValue = true;
						break;
					}

					if (bValue) {
						break;
					}
				}
				if (bValue) {
					break;
				}
			}
			return result;
		};

		// back NEXT
		var checkBackCrossingsNEXT = function(node, inEdges, outEdges, pipeToTest) {
			var result = constants.result().OK, i,
				bValue = false,
				backSegments = [];
			for (i = 0; i < inEdges.length; i++) {
				var inSgm = inEdges[i].getTargetSegment();
				if (inSgm) {
					backSegments.push(inSgm);
				}
			}
			for (i = 0; i < outEdges.length; i++) {
				var outSgm = outEdges[i].getSourceSegment();
				if (outSgm) {
					backSegments.push(outSgm);
				}
			}
			if (backSegments.length < 2) {
				return result;
			}

			for (var ii = 0; ii < backSegments.length; ii++) {
				var iiSgm = backSegments[ii];
				for (var jj = ii + 1; jj < backSegments.length; jj++) {
					var jjSgm = backSegments[jj];

					var iiEdge = iiSgm.getEdge(),
						jjEdge = jjSgm.getEdge();
					//var iiSgmNext = iiEdge.getNextSegment(iiSgm);
					//var jjSgmNext = jjEdge.getNextSegment(jjSgm);

					var iiSgmSbl = iiEdge.isStartSegment(iiSgm) ? iiEdge.getNextSegment(iiSgm) : iiEdge.getPreviousSegment(iiSgm);
					var jjSgmSbl = jjEdge.isStartSegment(jjSgm) ? jjEdge.getNextSegment(jjSgm) : jjEdge.getPreviousSegment(jjSgm);

					var iiSgmSblA = iiEdge.isStartSegment(iiSgm) ? iiEdge.getNextSegment(iiSgmSbl) : iiEdge.getPreviousSegment(iiSgmSbl);
					var jjSgmSblA = jjEdge.isStartSegment(jjSgm) ? jjEdge.getNextSegment(jjSgmSbl) : jjEdge.getPreviousSegment(jjSgmSbl);

					var iiPort = iiEdge.isStartSegment(iiSgm) ? iiSgm.getEdge().getSourcePort() : iiSgm.getEdge().getTargetPort();
					var jjPort = jjEdge.isStartSegment(jjSgm) ? jjSgm.getEdge().getSourcePort() : jjSgm.getEdge().getTargetPort();

					if (areIntersecting(iiSgm, jjSgmSbl) ||
						areIntersecting(jjSgm, iiSgmSbl) ) {
						// swap ports on edges
						swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, constants.nodeSide().BACK);
						if (DEBUG)
							console.log("   ??*** BACK CROSSING AT NODE "+node.getName()+", swap ports at node: " +
								iiPort.getPath() + " <> " + jjPort.getPath());
						if (areOverlapping(iiSgmSbl, jjSgmSbl)) {
							// swap failed
							swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, constants.nodeSide().BACK);
							var iiChannel = pipeToTest.getSegmentChannel(iiSgmSbl);
							var jjChannel = pipeToTest.getSegmentChannel(jjSgmSbl);
							if (iiChannel && jjChannel) {
								result = attemptToMoveSegmentToOtherChannel(
									//pipeToTest, iiChannel, iiSgmNext, jjChannel, jjSgmNext, CLEARANCE);
									pipeToTest, jjChannel, jjSgmSbl);
								if (result === constants.result().OK) {
									result = constants.result().HAS_FIX;
								}
								if (DEBUG)
									console.log("    -##- checkBackCrossingsNEXT: overlapping, move to other channel: " + result);
							}
						} else {
							result = constants.result().HAS_FIX;
						}
						bValue = true;
						break;
					}

					if (areIntersecting(iiSgmSbl, jjSgmSblA) ||
						areIntersecting(jjSgmSbl, iiSgmSblA) ) {
						// swap ports on edges
						swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, constants.nodeSide().BACK);
						if (DEBUG)
							console.log("   ??*** BACK CROSSING AT NODE 2, swap ports at node: " +
								iiPort.getPath() + " <> " + jjPort.getPath());
						if (areOverlapping(iiSgmSbl, jjSgmSbl) || areOverlapping(iiSgmSblA, jjSgm) || areOverlapping(iiSgm, jjSgmSblA)) {
							// swap failed
							swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, constants.nodeSide().BACK);
							var iiChannel = pipeToTest.getSegmentChannel(iiSgmSbl);
							var jjChannel = pipeToTest.getSegmentChannel(jjSgmSbl);
							if (iiChannel && jjChannel) {
								result = attemptToMoveSegmentToOtherChannel(
									//pipeToTest, iiChannel, iiSgmNext, jjChannel, jjSgmNext, CLEARANCE);
									pipeToTest, jjChannel, jjSgmSbl);
								if (result === constants.result().OK) {
									result = constants.result().HAS_FIX;
								}
								if (DEBUG)
								console.log("    -##- checkBackCrossingsNEXT: overlapping, move to other channel: " + result);
							}
						} else {
							result = constants.result().HAS_FIX;
						}

						//result = constants.result().HAS_FIX;
						bValue = true;
						break;
					}

					if (bValue) {
						break;
					}
				}
				if (bValue) {
					break;
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

			// inputs = back ports
			var checkBackCrossings = function(node, inEdges, pipeToTest) {
				var result = constants.result().OK;
				var bValue = false;
				var endSegments = [];
				for (var i = 0; i < inEdges.length; i++) {
					var endSgm = inEdges[i].getEndSegment();
					if (endSgm) {
						endSegments.push(endSgm);
					}
				}
				if (endSegments.length <= 1) {
					return result;
				}
				//var CHECKIT = node.getName() === "P1";
				//if (CHECKIT) {
				//	console.log("--------------layout------ node P1 BACK ("+endSegments.length+")------------");
				//}
				for (var ii = 0; ii < endSegments.length; ii++) {
					var iiSgm = endSegments[ii];
					for (var jj = ii+1; jj < endSegments.length; jj++) {
						var jjSgm = endSegments[jj];
						if (iiSgm.getEndPoint().equals(jjSgm.getEndPoint())) {
							// TODO: this is fan-in, do we need to lookup in settings ?
							//continue;
						}
						var iiEdge = iiSgm.getEdge();
						var jjEdge = jjSgm.getEdge();
						var iiSgmPrev = iiSgm.getEdge().getPreviousSegment(iiSgm);
						var iiSgmPrev1 = iiSgmPrev ? iiEdge.getPreviousSegment(iiSgmPrev) : null;
						var jjSgmPrev = jjSgm.getEdge().getPreviousSegment(jjSgm);
						var jjSgmPrev1 = jjSgmPrev ? jjEdge.getPreviousSegment(jjSgmPrev) : null;
						//boolean swapped = iiPort.getNode().hasPortsSwapped(iiPort, jjPort);
						if (areIntersecting(iiSgm, jjSgmPrev) ||
							areIntersecting(jjSgm, iiSgmPrev) ) { // ||
							// swap ports on edges
							var iiPort = iiSgm.getEdge().getTargetPort();
							var jjPort = jjSgm.getEdge().getTargetPort();
							//if (CHECKIT) console.log("	----------- intersecting: "+iiPort.getPath()+" <> "+jjPort.getPath()+
							//	", "+printInPortsOrder(node));
							swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, constants.nodeSide().BACK);
							if (DEBUG)
								console.log("   ??***** BACK CROSSING AT NODE, swap ports at node "+node.getName()+": "+
								iiPort.getPath()+" <> "+jjPort.getPath());
							if (areOverlapping(iiSgmPrev, jjSgmPrev)) {
								// swap failed
								swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, constants.nodeSide().BACK);
								var iiChannel = pipeToTest.getSegmentChannel(iiSgmPrev);
								var jjChannel = pipeToTest.getSegmentChannel(jjSgmPrev);
								if (iiChannel && jjChannel) {
									result = attemptToMoveSegmentToOtherChannel(
										//pipeToTest, iiChannel, iiSgmPrev, jjChannel, jjSgmPrev, CLEARANCE);
										pipeToTest, jjChannel, jjSgmPrev);
									if (result === constants.result().OK) {
										result = constants.result().HAS_FIX;
									}
									if (DEBUG)
									console.log("    -##- checkBackCrossings: overlapping, move to other channel: " + result);
								}
							} else {
								result = constants.result().HAS_FIX;
								//if (CHECKIT) console.log("   !!!!!!!!!***** BACK CROSSING AT NODE, swap ports at node "+node.getName()+": "+
								//	iiPort.getPath()+" <> "+jjPort.getPath());
							}
							bValue = true;
							break;
						}
						if (bValue) {
							break;
						}
					}
					if (bValue) {
						break;
					}
				}
				return result;
			};

			var checkPipeSegmentsForAdjacentViolations = function(pipe) {
				var listN2P = pipe.getNode2PipeSegments();
				var listP2N = pipe.getPipe2NodeSegments();
				//console.log("@@@@@@ listN2P="+listN2P.length+", listP2N="+listP2N.length+", pipe: "+
				//	pipe.getType()+", "+pipe.getOrder());
				for (var i = 0; i < listN2P.length; i++) {
					var n2pSgm = listN2P[i];
					for (var j = 0; j < listP2N.length; j++) {
						var p2nSgm = listP2N[j];
						if (n2pSgm.getEdge().equals(p2nSgm.getEdge())) {
							continue;
						}
						//if (arePipeSegmentsInProximityViolation(n2pSgm, p2nSgm, Math.floor(CLEARANCE/2))) {
						if (areSegmentsInClearanceViolation(n2pSgm, p2nSgm, Math.floor(CLEARANCE/2))) {
							var srcPort = n2pSgm.getEdge().getSourcePort();
							srcPort.setOffsetStep(1);
							//console.log("@@@@@@ listN2P="+listN2P.length+", listP2N="+listP2N.length+", pipe: "+
							//	pipe.getType()+", "+pipe.getOrder());
							//console.log("@#@#@#@# VIOLATION:\n"+
							//	n2pSgm.print()+"\n<>\n"+p2nSgm.print());
							return true;
						}
					}
				}
				return false;
			};

			// TODO: currently not used
			//var checkSideCrossings = function(node, sideSegments, pipeToTest) {
			//	var result = constants.result().OK;
			//	var bValue = false;
			//	if (sideSegments.length <= 1) {
			//		return result;
			//	}
			//	//var CHECKIT = pipeToTest.getType() === constants.pipeType().LANE_PIPE && pipeToTest.getOrder() === 4;
			//	//if (node.getName() === "R1") {
			//	//	console.log("********* checkSideCrossings, pipe type:"+pipeToTest.getType()+", order: "+pipeToTest.getOrder());
			//	//	console.log("----------------- CHECKING SIDE CROSSINGS FOR NODE: R1 ");
			//	//}
			//	//console.log("************* checkSideCrossings, pipe type:"+pipeToTest.getType()+", order: "+pipeToTest.getOrder());
			//	for (var ii = 0; ii < sideSegments.length; ii++) {
			//		var iiSgm = sideSegments[ii],
			//			iiEdge = iiSgm.getEdge(),
			//			iiSgmOther, iiSgmOther1, iiPort;
			//		if (iiSgm.getType() === constants.segmentType().NODE_TO_PIPE) {
			//			iiSgmOther = iiEdge.getNextSegment(iiSgm);
			//			iiSgmOther1 = iiSgmOther ? iiEdge.getNextSegment(iiSgmOther) : null;
			//			iiPort = iiEdge.getSourcePort();
			//		} else if (iiSgm.getType() === constants.segmentType().PIPE_TO_NODE) {
			//			iiSgmOther = iiEdge.getPreviousSegment(iiSgm);
			//			iiSgmOther1 = iiSgmOther ? iiEdge.getPreviousSegment(iiSgmOther) : null;
			//			iiPort = iiEdge.getTargetPort();
			//		} else {
			//			continue;
			//		}
			//		var iiChannel = pipeToTest.getSegmentChannel(iiSgmOther);
			//		for (var jj = ii+1; jj < sideSegments.length; jj++) {
			//			var jjSgm = sideSegments[jj],
			//				jjEdge = jjSgm.getEdge(),
			//				jjSgmOther, jjSgmOther1, jjPort;
			//			if (jjSgm.getType() === constants.segmentType().NODE_TO_PIPE) {
			//				jjSgmOther = jjEdge.getNextSegment(jjSgm);
			//				jjSgmOther1 = jjSgmOther ? jjEdge.getNextSegment(jjSgmOther) : null;
			//				jjPort = jjEdge.getSourcePort();
			//			} else if (jjSgm.getType() === constants.segmentType().PIPE_TO_NODE) {
			//				jjSgmOther = jjEdge.getPreviousSegment(jjSgm);
			//				jjSgmOther1 = jjSgmOther ? jjEdge.getPreviousSegment(jjSgmOther) : null;
			//				jjPort = jjEdge.getTargetPort();
			//			} else {
			//				continue;
			//			}
			//			var jjChannel = pipeToTest.getSegmentChannel(jjSgmOther);
			//			//var CHECKIT = pipeToTest.getType() === constants.pipeType().LANE_PIPE && pipeToTest.getOrder() === 4;
			//				//iiEdge.getName() === "[L1/OUT-0]-[R1/IN-0]";
			//			//var CHECKIT = iiEdge.getName() === "[L1/OUT-0]-[R1/IN-0]" && jjEdge.getName() === "[D1/OUT-YES]-[R1/IN-1]" ||
			//			//			iiEdge.getName() === "[D1/OUT-YES]-[R1/IN-1]" && jjEdge.getName() === "[L1/OUT-0]-[R1/IN-0]";
			//			//if (CHECKIT) {
			//			//	console.log("--------********* checkSideCrossings, pipe type:"+pipeToTest.getType()+", order: "+pipeToTest.getOrder());
			//			//}
			//			//if (!pipeToTest.getSegmentChannel(jjSgmOther)) {
			//			//	continue;
			//			//}
			//			if ((areIntersecting(iiSgm, jjSgmOther) ||
			//				areIntersecting(jjSgm, iiSgmOther))) {// &&
			//				//if (CHECKIT)
			//				if (DEBUG)
			//					console.log("********* SIDE CROSSING AT NODE, intersecting, swap ports, node: "+node.getName()+":\n"+
			//						iiPort.getName()+"/"+iiPort.getOrder()+" <> "+jjPort.getName()+"/"+jjPort.getOrder()+"\n");
			//						//iiSgm.print()+"\nX\n"+
			//						//jjSgmOther.print()+"\n\n"+
			//						//jjSgm.print()+"\nX\n"+
			//						//iiSgmOther.print() );
			//				// swap ports
			//				swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm);
            //
			//				//if (areSegmentsInSideBox(iiSgmOther, jjSgmOther) ||
			//				//	areSegmentsInCrossBox(iiSgmOther, jjSgmOther) ) {
			//				//	//if (CHECKIT)
			//				//	if (DEBUG)
			//				//		console.log("****** SIDE BOX NEXT crossing, pipe type: "+pipeToTest.getType()+", order: "+pipeToTest.getOrder()+
			//				//			", channels: "+pipeToTest.getChannels().length+
			//				//			"\n" +
			//				//				//iiSegment.print()+"\n" + jjSegment.print());
			//				//			iiSgmOther.getEdge().getName()+" <> " + jjSgmOther.getEdge().getName());
			//				//	if (hasSegmentConflictsInChanel(iiChannel, jjSgmOther, CLEARANCE) ||
			//				//		hasSegmentConflictsInChanel(jjChannel, iiSgmOther, CLEARANCE)) {
			//				//		moveSegmentOutOfBoxLocal(pipeToTest, ii, iiSgmOther, jj, jjSgmOther);
			//				//		if (DEBUG)
			//				//			console.log("		**** SIDE BOX MOVE OUT ");
			//				//		result = constants.result().RETRY_FIX;
			//				//	} else { //if (iiSegment.isSwappable() && jjSegment.isSwappable()) {
			//				//		pipeToTest.swapSegments(iiChannel, iiSgmOther, jjChannel, jjSgmOther);
			//				//		if (DEBUG)
			//				//			console.log("		**** SIDE BOX SWAP ");
			//				//		result = constants.result().HAS_FIX;
			//				//	}
			//				//	bValue = true;
			//				//	break;
			//				//}
            //
			//				//if (areOverlapping(iiSgmOther, jjSgmOther)) {
			//				if (areSegmentsInSideBox(iiSgmOther, jjSgmOther) ||
			//					areSegmentsInCrossBox(iiSgmOther, jjSgmOther) ) {
			//					// attempt to swap failed
			//					//if (CHECKIT)
			//					if (DEBUG)
			//					//console.log("********* checkSideCrossings, pipe type:"+pipeToTest.getType()+", order: "+pipeToTest.getOrder());
			//					console.log("********* SIDE CROSSING AT NODE, found segments overlapping after swapping ports:"+
			//						" pipe type:"+pipeToTest.getType()+", order: "+pipeToTest.getOrder()+
			//							iiPort.getName()+"/"+iiPort.getOrder()+" <> "+jjPort.getName()+"/"+jjPort.getOrder());
			//							//iiSgm.print()+"\n"+jjSgm.print() );
			//					// attempt to swap
			//					iiChannel = pipeToTest.getSegmentChannel(iiSgmOther);
			//					jjChannel = pipeToTest.getSegmentChannel(jjSgmOther);
			//					if (iiChannel && jjChannel) {
			//						if (DEBUG)
			//							console.log("****** SIDE CROSSING AT NODE, will move segments, node: "+node.getName()+":\n"+
			//							iiSgmOther.print()+"\n"+jjSgmOther.print() );
			//						//pipeToTest.incrementChannels();
			//						result = attemptToMoveSegmentToOtherChannel(
			//							//pipeToTest, iiChannel, iiSgmOther, jjChannel, jjSgmOther, CLEARANCE);
			//							pipeToTest, jjChannel, jjSgmOther);
			//						if (result === constants.result().OK) {
			//							result = constants.result().HAS_FIX;
			//						}
			//						if (DEBUG)
			//						console.log("****** SIDE CROSSING AT NODE, move segment result: "+dgmUtl.getResultName(result));
			//					}
			//				} else {
			//					// TODO: need to revisit
			//					//result = constants.result().HAS_FIX;
			//				}
			//				// TODO: need to revisit
			//				//bValue = true;
			//				//break;
			//			}
			//			if (bValue) {
			//				break;
			//			}
			//		}
			//		if (bValue) {
			//			break;
			//		}
			//	}
			//	return result;
			//};

			var checkSideCrossingsNEXT = function(node, side, sideSegments, pipeToTest) {
				var result = constants.result().OK;
				var bValue = false, ii, jj;
				if (sideSegments.length <= 1) {
					return result;
				}
				var CHECKIT = pipeToTest.getType() === constants.pipeType().LANE_PIPE && pipeToTest.getOrder() === 2;
				//if (node.getName() === "R1") {
				//	console.log("********* checkSideCrossingsNEXT, pipe type:"+pipeToTest.getType()+", order: "+pipeToTest.getOrder());
				//console.log("----------------- CHECKING SIDE CROSSINGS FOR NODE: R1 ");
				//}
				for (ii = 0; ii < sideSegments.length; ii++) {
					var iiSgm = sideSegments[ii],
						iiEdge = iiSgm.getEdge(),
						iiSgmOther, iiSgmOther1, iiPort;
					if (iiSgm.getType() === constants.segmentType().NODE_TO_PIPE) {
						iiSgmOther = iiEdge.getNextSegment(iiSgm);
						iiSgmOther1 = iiSgmOther ? iiEdge.getNextSegment(iiSgmOther) : null;
						iiPort = iiEdge.getSourcePort();
					} else if (iiSgm.getType() === constants.segmentType().PIPE_TO_NODE) {
						iiSgmOther = iiEdge.getPreviousSegment(iiSgm);
						iiSgmOther1 = iiSgmOther ? iiEdge.getPreviousSegment(iiSgmOther) : null;
						iiPort = iiEdge.getTargetPort();
					} else {
						continue;
					}
					var iiChannel = pipeToTest.getSegmentChannel(iiSgmOther);
					if (!iiChannel) {
						//console.log("\t---- iiChannel undefined: "+iiSgmOther.print());
						continue;
					}
					for (jj = ii+1; jj < sideSegments.length; jj++) {
						var jjSgm = sideSegments[jj],
							jjEdge = jjSgm.getEdge(),
							jjSgmOther, jjSgmOther1, jjPort;
						if (jjSgm.getType() === constants.segmentType().NODE_TO_PIPE) {
							jjSgmOther = jjEdge.getNextSegment(jjSgm);
							jjSgmOther1 = jjSgmOther ? jjEdge.getNextSegment(jjSgmOther) : null;
							jjPort = jjEdge.getSourcePort();
						} else if (jjSgm.getType() === constants.segmentType().PIPE_TO_NODE) {
							jjSgmOther = jjEdge.getPreviousSegment(jjSgm);
							jjSgmOther1 = jjSgmOther ? jjEdge.getPreviousSegment(jjSgmOther) : null;
							jjPort = jjEdge.getTargetPort();
						} else {
							continue;
						}
						var jjChannel = pipeToTest.getSegmentChannel(jjSgmOther);
						if (!jjChannel) {
							//console.log("\t---- jjChannel undefined: "+jjSgmOther.print());
							continue;
						}
						//var CHECKIT = iiEdge.getName() === "[L1/OUT-0]-[R1/IN-0]" && jjEdge.getName() === "[D1/OUT-YES]-[R1/IN-1]" ||
						//	iiEdge.getName() === "[D1/OUT-YES]-[R1/IN-1]" && jjEdge.getName() === "[L1/OUT-0]-[R1/IN-0]";
						//if (iiEdge.getName() === "[R1/OUT-0]-[L1/IN-0]" && jjEdge.getName() === "[D1/OUT-YES]-[R1/IN-1]") {
						//	console.log("   -----NEXT iiSgmOther: "+iiSgmOther.print());
						//	console.log("   -----NEXT jjSgmOther1: "+jjSgmOther1.print());
						//}
						//if ((areIntersecting(iiSgmOther, jjSgmOther1) ||
						//	 areIntersecting(jjSgmOther, iiSgmOther1))) {
						if ((areIntersecting(iiSgm, jjSgmOther) ||
							 areIntersecting(jjSgm, iiSgmOther))) {
							//if (CHECKIT)
							if (DEBUG)
								console.log("********* SIDE CROSSING AT NODE, intersecting, swap ports, node: "+node.getName()+":"+
									iiPort.getName()+"/"+iiPort.getOrder()+" <> "+jjPort.getName()+"/"+jjPort.getOrder());
									//iiSgm.print()+"\n"+jjSgm.print() );
							// swap ports
							swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, side);

							//
							if (areSegmentsInSideBox(iiSgmOther, jjSgmOther) ||
								areSegmentsInCrossBox(iiSgmOther, jjSgmOther) ) {
								// swap failed
								swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm, node, side);
								//if (CHECKIT)
								if (DEBUG)
									console.log("****** SIDE BOX NEXT crossing, pipe type: "+pipeToTest.getType()+", order: "+pipeToTest.getOrder()+
											", channels: "+pipeToTest.getChannels().length+
										"\n" +
											//iiSegment.print()+"\n" + jjSegment.print());
										iiSgmOther.getEdge().getName()+" <> " + jjSgmOther.getEdge().getName());
								if (hasSegmentConflictsInChanel(iiChannel, jjSgmOther, CLEARANCE) ||
									hasSegmentConflictsInChanel(jjChannel, iiSgmOther, CLEARANCE)) {
									moveSegmentOutOfBoxLocal(pipeToTest, ii, iiSgmOther, jj, jjSgmOther);
									if (DEBUG)
										console.log("		**** SIDE BOX MOVE OUT ");
									result = constants.result().RETRY_FIX;
								} else { //if (iiSegment.isSwappable() && jjSegment.isSwappable()) {
									pipeToTest.swapSegments(iiChannel, iiSgmOther, jjChannel, jjSgmOther);
									if (DEBUG)
										console.log("		**** SIDE BOX SWAP ");
									result = constants.result().HAS_FIX;
								}
								bValue = true;
								break;
							}

							//if (areOverlapping(iiSgmOther, jjSgmOther)) {
							//	if (CHECKIT)
							//	//if (DEBUG)
							//	//console.log("********* checkSideCrossingsNEXT, pipe type:"+pipeToTest.getType()+", order: "+pipeToTest.getOrder());
							//	console.log("********* SIDE CROSSING AT NODE, found segments overlapping after swapping ports:"+
							//			iiPort.getName()+"/"+iiPort.getOrder()+" <> "+jjPort.getName()+"/"+jjPort.getOrder());
							//			//iiSgm.print()+"\n"+jjSgm.print() );
							//	// attempt to swap
							//	var iiChannel = pipeToTest.getSegmentChannel(iiSgmOther);
							//	var jjChannel = pipeToTest.getSegmentChannel(jjSgmOther);
							//	if (iiChannel && jjChannel) {
							//		if (DEBUG)
							//			console.log("****** SIDE CROSSING AT NODE, will move segments, node: "+node.getName()+":\n"+
							//			iiSgmOther.print()+"\n"+jjSgmOther.print() );
							//		//pipeToTest.incrementChannels();
							//		result = attemptToMoveSegmentToOtherChannel(
							//			//pipeToTest, iiChannel, iiSgmOther, jjChannel, jjSgmOther, CLEARANCE);
							//			pipeToTest, jjChannel, jjSgmOther);
							//		if (result === constants.result().OK) {
							//			result = constants.result().HAS_FIX;
							//		}
							//		if (DEBUG)
							//		console.log("****** SIDE CROSSING AT NODE, move segment result: "+dgmUtl.getResultName(result));
							//	}
							//} else {
							//	result = constants.result().HAS_FIX;
							//}
							bValue = true;
							break;
						}
						if (bValue) {
							break;
						}
					}
					if (bValue) {
						break;
					}
				}
				return result;
			};

			/**
			 * iiSegment and jjSegment are in conflict, try to find a no-conflict channel
			 * and test if in the new location the segment doesn't violate the base rules.
			 * This is used in checkOverlappingSegments and checkXXXCrossings.
			 */
			var attemptToMoveSegmentToOtherChannel = function(pipe, channel, segment) {
				var newChannel,
					result;
				var ncChannels = getNoConflictChannels(pipe.getChannels(), segment, CLEARANCE);
				if (ncChannels.length === 0) {
					newChannel = pipe.incrementChannels();
					result = constants.result().RETRY_FIX;
				} else {
					newChannel = ncChannels[0];
					result = constants.result().OK;
				}
				pipe.moveSegment(segment, channel, newChannel);
				//segment.getEdge().adjustSegmentsLocations();
				return result;
			};


		return {
				areProjectionsOverlapping: function(s1p1, s1p2, s2p1, s2p2, ds1, ds2, delta) {
					return areProjectionsOverlapping(s1p1, s1p2, s2p1, s2p2, ds1, ds2, delta);
				},
				areIntersecting: function (sgm1, sgm2) {
					return areIntersecting(sgm1, sgm2);
				},
				isSegmentInViolationToSegment: function (sgm1, sgm2, delta) {
					return isSegmentInViolationToSegment(sgm1, sgm2, delta);
				},
				isPointInViolation: function (pnt, pR, sgm, delta) {
					return isPointInViolation(pnt, pR, sgm, delta);
				},
				areOverlapping: function(segment1, segment2) {
					return areOverlapping(segment1, segment2);
				},
				haveChannelsProjectionsOverlapping: function (iChannel, jChannel, clearance) {
					return haveChannelsProjectionsOverlapping(iChannel, jChannel, clearance);
				},
				hasSegmentConflictsInChanel: function (channel, segment, clearance) {
					return hasSegmentConflictsInChanel(channel, segment, clearance);
				},
				areSegmentsInClearanceViolation: function (segment1, segment2, delta) {
					return areSegmentsInClearanceViolation(segment1, segment2, delta);
				},
				hasSegmentConflicts: function (channels, thisChannel, thisSegment) {
					return hasSegmentConflicts(channels, thisChannel, thisSegment);
				},
				areSegmentsInProximityViolation: function (iiSegment, jjSegment, jointDistance) {
					return areSegmentsInProximityViolation(iiSegment, jjSegment, jointDistance);
				},
				getEndsWithinProximity: function (s1, s2, delta) {
					return getEndsWithinProximity(s1, s2, delta);
				},
				areSegment2ChannelSideBox: function (iiSegment, kChannel, b) {
					return areSegment2ChannelSideBox(iiSegment, kChannel, b);
				},
				areSegmentsInSideBox: function (iiSegment, jjSegment) {
					return areSegmentsInSideBox(iiSegment, jjSegment);
				},
				areSegment2ChannelCrossBox: function (iiSegment, kChannel, b) {
					return areSegment2ChannelCrossBox(iiSegment, kChannel, b);
				},
				areSegmentsInCrossBox: function (iiSegment, jjSegment) {
					return areSegmentsInCrossBox(iiSegment, jjSegment);
				},
				hasChannelConflicts: function (iChannel, iiSegment, jjSegment, clearance) {
					return hasChannelConflicts(iChannel, iiSegment, jjSegment, clearance);
				},
				getNoConflictChannels: function (channels, segment, clearance) {
					return getNoConflictChannels(channels, segment, clearance);
				},
				areSegmentsProjectionsOverlapping: function (sgm1, sgm2, delta) {
					return areSegmentsProjectionsOverlapping(sgm1, sgm2, delta);
				},
				checkOverlappingSegmentsInChannel: function (pipe) {
					return checkOverlappingSegmentsInChannel(pipe);
				},
				checkSegmentsForCrossings: function (pipe, xing) {
					return checkSegmentsForCrossingsLocal(pipe, xing);
				},
				//attemptToMoveSegmentInSideBox: function (pipe, iChannel, iiSegment, jChannel, jjSegment, clearance) {
				//	return attemptToMoveSegmentInSideBox(pipe, iChannel, iiSegment, jChannel, jjSegment, clearance);
				//},
				//areAdjacentSegmentsOverlapping: function (iiSegment, jjSegment) {
				//	return areAdjacentSegmentsOverlapping(iiSegment, jjSegment);
				//},
				//attemptToMoveSegmentInCrossBox: function (pipe, iChannel, iiSegment, jChannel, jjSegment, clearance) {
				//	return attemptToMoveSegmentInCrossBox(pipe, iChannel, iiSegment, jChannel, jjSegment, clearance);
				//},
				//moveSegmentOutOfBox: function(pipe, ii, iiSegment, jj, jjSegment) {
				//	return moveSegmentOutOfBoxLocal(pipe, ii, iiSegment, jj, jjSegment);
				//},
				//checkPipeForAdjacentViolations: function (pipe) {
				//	return checkPipeForAdjacentViolations(pipe);
				//},
				//checkForOverlappingSegment: function (pipe) {
				//	return checkForOverlappingSegment(pipe);
				//},
				//checkForCrossingSegmentsInPipe: function (pipe, xing) {
				//	return checkForCrossingSegmentsInPipe(pipe, xing);
				//},
				//checkSegmentsForAdjacentViolations: function (pipe) {
				//	return checkSegmentsForAdjacentViolations(pipe);
				//},
				//swapPortsLocations: function (iiPort, iiSgm, jjPort, jjSgm) {
				//	return swapPortsLocations(iiPort, iiSgm, jjPort, jjSgm);
				//},
				checkFrontCrossings: function (node, outEdges, pipeToTest) {
					return checkFrontCrossings(node, outEdges, pipeToTest);
				},
				checkFrontCrossingsNEXT: function (node, outEdges, inEdges, pipeToTest) {
					return checkFrontCrossingsNEXT(node, outEdges, inEdges, pipeToTest);
				},
				checkBackCrossings: function (node, inEdges, pipeToTest) {
					return checkBackCrossings(node, inEdges, pipeToTest);
				},
				checkBackCrossingsNEXT: function (node, inEdges, outEdges, pipeToTest) {
					return checkBackCrossingsNEXT(node, inEdges, outEdges, pipeToTest);
				},
				//checkSideCrossings: function(node, sideSegments, pipeToTest) {
				//	return checkSideCrossings(node, sideSegments, pipeToTest);
				//},
				checkSideCrossingsNEXT: function(node, side, sideSegments, pipeToTest) {
					return checkSideCrossingsNEXT(node, side, sideSegments, pipeToTest);
				}
			};
		//}
		//return LayoutUtils;
	}
);