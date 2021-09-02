define('modules/graph/graphEdge',
	['modules/graph/graphElement',
		'modules/geometry/rectangle',
		'modules/settings/config',
		'modules/graph/graphConstants',
		'modules/core/jsUtils'],
	function(GraphElement,
	         Rectangle,
	         config,
			 constants,
			 jsUtils) {

		function GraphEdge(name) {
			GraphElement.call(this, new Rectangle(0,0,0,0));

			var self = this;

			self.setName(name);
			self.setId(constants.elementType().EDGE);

			self.type = undefined;
			self.setType = function(type) { self.type = type; };
			self.getType = function() { return self.type; };

			self.drawMode = constants.drawMode().SEGMENTS;
			self.setDrawMode = function(mode) { self.drawMode = mode; };
			self.getDrawMode = function() { return self.drawMode; };

			self.segments = [];
			self.getSegments = function() { return self.segments; };
			self.hasSegmentsChained = false;

			var _srcShift = constants.portShift().NONE,
				_trgShift = constants.portShift().NONE,
				_srcPortOrder = -1,
				_trgPortOrder = -1,
			// no short cuts:
				_pipesOnly = false;

			var _sourcePort = undefined;
			self.setSourcePort = function(newSrcPort) {
				if (!_sourcePort) {
					// first time
					_sourcePort = newSrcPort;
					_sourcePort.addEdgeOnInit(self);
				} else {
					var dx = newSrcPort.getAttachmentPoint().x - _sourcePort.getAttachmentPoint().x;
					var dy = newSrcPort.getAttachmentPoint().y - _sourcePort.getAttachmentPoint().y;
					var startSgm = self.getSourceSegment();
					_sourcePort.removeEdge(self);
					_sourcePort = newSrcPort;
					_sourcePort.addEdge(self);
					_sourceSide = newSrcPort.getSide();
					_sourcePort.addEdgeOnInit(self);
					if (startSgm) {
						startSgm.adjustStartPoint(dx, dy);
						startSgm.adjustEndPoint(dx, dy);
					}
				}
				self.setName(self.getName());
			};
			self.getSourcePort = function() { return _sourcePort; };

			var _targetPort = undefined;
			self.setTargetPort = function(newTrgPort) {
				if (!_targetPort) {
					// first time
					_targetPort = newTrgPort;
					_targetPort.addEdgeOnInit(self);
				} else {
					var dx = newTrgPort.getAttachmentPoint().x - _targetPort.getAttachmentPoint().x;
					var dy = newTrgPort.getAttachmentPoint().y - _targetPort.getAttachmentPoint().y;
					var endSgm = self.getTargetSegment();
					_targetPort.removeEdge(self);
					_targetPort = newTrgPort;
					_targetPort.addEdge(self);
					_targetPort.addEdgeOnInit(self);
					if (endSgm) {
						endSgm.adjustStartPoint(dx, dy);
						endSgm.adjustEndPoint(dx, dy);
					}
				}
				self.setName(self.getName());
			};
			self.getTargetPort = function() { return _targetPort; };

			self.getSourceNode = function() { return _sourcePort ? _sourcePort.getNode() : undefined; };
			self.getTargetNode = function() { return _targetPort ? _targetPort.getNode() : undefined; };

			var _sourceSide, _targetSide;
			self.getSourceSide = function() { return _sourceSide; };
			self.setSourceSide = function(side) { _sourceSide = side; };
			self.getTargetSide = function() { return _targetSide; };
			self.setTargetSide = function(side) { _targetSide = side; };

			self.showSourceSymbol = true;
			self.sourceIcon = "";
			self.showTargetSymbol = true;
			self.targetIcon = "";

			self.thickness = 1;
			self.setThickness = function(n) { self.thickness = n; };
			self.getThickness = function() { return self.thickness; };

			self.setSourceShift = function(iValue) { _srcShift = iValue; };
			self.getSourceShift = function() { return _srcShift; };

			self.setTargetShift = function(iValue) { _trgShift = iValue; };
			self.getTargetShift = function() { return _trgShift; };

			self.setSrcPortOrder = function(iValue) { _srcPortOrder = iValue; };
			self.getSrcPortOrder = function() { return _srcPortOrder; };

			self.setTrgPortOrder = function(iValue) { _trgPortOrder = iValue; };
			self.getTrgPortOrder = function() { return _trgPortOrder; };

			self.setPipesOnly = function(bValue) { _pipesOnly = bValue; };
			self.hasPipesOnly = function() { return _pipesOnly; };

			self.resetToDefaults = function() {
				_srcShift = constants.portShift().NONE;
				_trgShift = constants.portShift().NONE;
				_pipesOnly = false;
			};

			self.optimizationBlocked = false;
			self.setOptimizationBlocked = function(b) { self.optimizationBlocked = b; };
			self.isOptimizationBlocked = function() { return self.optimizationBlocked; };
			//self.isOptimizationBlocked = function() { return false; };
			self.isDummyOptimization = function() { return false; }; // see edgesLayout.js

			var _shortCuts = [];
			self.addShortCut = function(segment) { _shortCuts.push(segment); };
			self.getShortCuts = function() {
				return _shortCuts;
			};

			self.isValid = function() {
				return _sourcePort && _sourcePort.getNode() && !_sourcePort.getNode().isSuppressed() &&
					_targetPort && _targetPort.getNode() && !_targetPort.getNode().isSuppressed();
				//return _sourcePort && _sourcePort.getNode() &&
				//	_targetPort && _targetPort.getNode();
			};

			self.getOtherSidePort = function(port) {
				if (_sourcePort.equals(port)) {
					return _targetPort;
				} else if (_targetPort.equals(port)) {
					return _sourcePort;
				} else {
					return null;
				}
			};

			self.getLength = function() {
				var length = 0;
				for (var i = 0; i < self.segments.length; i++) {
					length += self.segments[i].getLength();
				}
				return length;
			};

			self.getName = function() {
				var srcStr = _sourcePort ?
				"["+_sourcePort.getNode().getName()+"/"+_sourcePort.getName()+"]" :
					"[null/null]";
				var trgStr = _targetPort ?
				"["+_targetPort.getNode().getName()+"/"+_targetPort.getName()+"]" :
					"[null/null]";
				return srcStr +"-"+ trgStr;
			};

			self.getSourceSegment = function() {
				for (var i = 0; i < self.segments.length; i++) {
					if (_sourcePort.getAttachmentPoint().equals(self.segments[i].getStartPoint())) {
						return self.segments[i];
					}
				}
				return null;
			};

			self.getTargetSegment = function() {
				for (var i = 0; i < self.segments.length; i++) {
					if (_targetPort.getAttachmentPoint().equals(self.segments[i].getEndPoint())) {
						return self.segments[i];
					}
				}
				return null;
			};

			self.getStartSegment = function() {
				if (self.segments.length > 0) {
					return self.segments[0];
				}
				return null;
			};
			self.isStartSegment = function(segment) {
				var startSgm = self.getStartSegment();
				return startSgm.equals(segment);
			};

			self.getEndSegment = function() {
				if (self.segments.length > 0) {
					return self.segments[self.segments.length-1];
				}
				return null;
			};
			self.isEndSegment = function(segment) {
				var endSegment = self.getEndSegment();
				return endSegment.equals(segment);
			};

			self.isDraggableSegment = function(segment) {
				return !self.isStartSegment(segment) && !self.isEndSegment(segment);
			};

			self.isAllocated = function() {
				if (!_sourcePort || !_sourcePort.getNode()) {
					return false;
				}
				if (!_targetPort || !_targetPort.getNode()) {
					return false;
				}
				return _sourcePort.getNode().isAllocated() && _targetPort.getNode().isAllocated();
			};

			self.contains = function(segment) {
				for (var i = 0; i < self.segments.length; i++) {
					if (self.segments[i].equals(segment)) {
						return true;
					}
				}
				return false;
			};

			self.getSegmentOrder = function(segment) {
				for (var i = 0; i < self.segments.length; i++) {
					if (self.segments[i].equals(segment)) {
						return i;
					}
				}
				return -1;
			};

			self.containsPoint = function(point) {
				return getSegmentsAtPointLocal(point, false).length > 0;
			};

			self.getSegmentsAtPoint = function(point) {
				return getSegmentsAtPointLocal(point, true);
			};

			function getSegmentsAtPointLocal(pnt, multiple) {
				var delta = 6, segments = [];
				if (pnt) {
					for (var i = 0; i < self.segments.length; i++) {
						var p1 = self.segments[i].getStartPoint(),
							p2 = self.segments[i].getEndPoint();
						if (p1.y === p2.y) {
							// horizontal
							var xmin = Math.min(p1.x, p2.x),
								xmax = Math.max(p1.x, p2.x),
								rectH = new Rectangle(xmin-delta, p1.y-delta, Math.abs(xmin - xmax) + delta*2, delta*2);
							if (rectH.containsXY(pnt.x, pnt.y)) {
								segments.push(self.segments[i]);
								if (!multiple) { return segments; }
							}
						} else if (p1.x === p2.x) {
							// vertical
							var ymin = Math.min(p1.y, p2.y),
								ymax = Math.max(p1.y, p2.y),
								rectY = new Rectangle(p1.x-delta, ymin-delta, delta*2, Math.abs(ymin - ymax) + delta*2);
							if (rectY.containsXY(pnt.x, pnt.y)) {
								segments.push(self.segments[i]);
								if (!multiple) { return segments; }
							}
						}
					}
				}
				return segments;
			}

			//self.isSelectionForEdit = function(segment, pnt) {
			//	var delta = 8,
			//		p1 = segment.getStartPoint(),
			//		p2 = segment.getEndPoint(),
			//		r1 = new Rectangle(p1.x-delta, p1.y-delta, delta*2, delta*2),
			//		r2 = new Rectangle(p2.x-delta, p2.y-delta, delta*2, delta*2);
			//		return !r1.containsXY(pnt.x, pnt.y) && !r2.containsXY(pnt.x, pnt.y);
			//};

			self.addSegment = function(segment) {
				if (!self.contains(segment)) {
					self.segments.push(segment);
				}
			};

			self.addSegmentAt = function(idx, segment) {
				if (!self.contains(segment)) {
					if (idx >= 0 && idx < self.segments.length) {
						self.segments.splice(idx, 0, segment);
					}
				}
			};

			self.replaceStartSegment = function(newSegment) {
				if (self.hasSegmentsChained) {
					//throw new IllegalArgumentException("GraphEdge: cannot remove/replace segments after chaining");
					return;
				}
				if (self.segments.length > 0) {
					self.segments.splice(0, 1, newSegment);
				} else {
					self.segments.push(newSegment);
				}
			};

			self.replaceEndSegment = function(newSegment) {
				if (self.hasSegmentsChained) {
					//throw new IllegalArgumentException("GraphEdge: cannot remove/replace segments after chaining");
					return;
				}
				if (self.segments.length > 0) {
					var lastIdx = self.segments.length-1;
					var lastSgm = self.segments[lastIdx];
					//console.log("### replace: "+lastSgm.print1()+
					//			"\n      with: "+newSegment.print1());
					self.segments.splice(self.segments.length-1, 1, newSegment);
				} else {
					self.segments.push(newSegment);
				}
			};

			// translate all segments
			self.updateEdgeLocations = function() {
				if (self.getStartSegment() != null && self.getEndSegment() != null) {
					var oldSP = self.getStartSegment().getStartPoint();
					var newSP = _sourcePort.getAttachmentPoint();
					var dx = oldSP.x - newSP.x;
					var dy = oldSP.y - newSP.y;
					for (var i = 0; i < self.segments.length; i++) {
						if (i === 0) {
							self.segments[i].adjustStartPoint(dx, dy);
						}
						self.segments[i].adjustEndPoint(dx, dy);
					}
				}
			};

			self.updateEdgeLocationsOnDrag = function() {
				// do nothing !!!
			};

			function testPrint(call) {
				if (self.getName() === "[L1/OUT-0]-[R1/IN-0]") {
					//console.log("======= "+call+" ======== testPrint EDGE: "+self.print());
				}
			}

			// Adjust all segments individually at last stage
			self.adjustSegmentsLocations = function() {
				if (self.segments.length > 0) {
					//testPrint("1A");
					var orientation = config.getFlowDirection();
					var startSgm = self.getStartSegment();
					if (startSgm != null) {
						orientation = startSgm.getStartPoint().x === startSgm.getEndPoint().x ?
							constants.flow().VERTICAL : constants.flow().HORIZONTAL;
						startSgm.getStartPoint().moveToPoint(_sourcePort.getAttachmentPoint());
						if (orientation == constants.flow().VERTICAL) {
							startSgm.getEndPoint().moveToXY(_sourcePort.getAttachmentPoint().x, startSgm.getEndPoint().y);
						} else {
							startSgm.getEndPoint().moveToXY(startSgm.getEndPoint().x, _sourcePort.getAttachmentPoint().y);
						}
					}
					var endSgm = self.getEndSegment();
					if (endSgm != null) {
						orientation = endSgm.getStartPoint().x === endSgm.getEndPoint().x ?
							constants.flow().VERTICAL : constants.flow().HORIZONTAL;
						endSgm.getEndPoint().moveToPoint(_targetPort.getAttachmentPoint());
						if (orientation == constants.flow().VERTICAL) {
							endSgm.getStartPoint().moveToXY(_targetPort.getAttachmentPoint().x, endSgm.getStartPoint().y);
						} else {
							endSgm.getStartPoint().moveToXY(endSgm.getStartPoint().x, _targetPort.getAttachmentPoint().y);
						}
					}
					for (var i = 1; i < self.segments.length-1; i++) {
						if (self.segments[i].getPipe() != null) {
							self.segments[i].getPipe().adjustSegment(self.segments[i]);
						}
					}
					//testPrint("2A");
				}
			};

			self.removeDuplicateSegments = function() {
				var found = removeDuplicates();
				while (found) {
					found = removeDuplicates();
				}
			};

			function removeDuplicates() {
				var found = false;
				if (self.getName() === "[P3/OUT-0]-[T2/IN-0]") {
					console.log("$$$ link [P3/OUT-0]-[T2/IN-0], segments="+self.segments.length);
				}
				if (self.segments.length >= 4) {
					for (var i = 1; i < self.segments.length-2; i++) {
						if (self.segments[i].getStartPoint().equals(self.segments[i+1].getEndPoint())) {
							self.segments.splice(i, 2);
							found = true;
							break;
						}
					}
				}
				return found;
			}

			self.translateSegment = function(segment, dx, dy) {
				if (self.getStartSegment().equals(segment) || self.getEndSegment().equals(segment)) {
					console.log("ERROR: can't translate start or end segment");
				} else {
					var previous = self.getPreviousSegment(segment);
					var next = self.getNextSegment(segment);
					if (!previous || !next) {
						console.log("ERROR: can't locate previous or next to translate");
					} else {
						segment.adjustStartPoint(dx, dy);
						segment.adjustEndPoint(dx, dy);
						// THIS IS WRONG!!!
						//next.adjustStartPoint(dx, dy);
						//previous.adjustEndPoint(dx, dy);
					}
				}
			};

			function getSegmentsByStartPoint(segments, xPoint) {
				var newList = [];
				for (var i = 0; i < segments.length; i++) {
					if (segments[i].getStartPoint().equals(xPoint)) {
						newList.push(segments[i]);
					}
				}
				return newList;
			}

			function getSegmentIndex(segments, sgm) {
				for (var i = 0; i < segments.length; i++) {
					if (segments[i].equals(sgm)) {
						return i;
					}
				}
				return -1;
			}

			function getZeroLengthSegment(segments) {
				for (var i = 0; i < segments.length; i++) {
					if (segments[i].getStartPoint().equals(segments[i].getEndPoint())) {
						return segments[i];
					}
				}
				return undefined;
			}

			self.clearSegments = function() {
				self.segments = [];
				self.hasSegmentsChained = false;
			};

			self.chainSegments = function() {
				//if (self.getName() === "[P1/OUT-1]-[P5/IN-0]") {
					//console.log("### chainSegments start: "+self.print());
				//}
				self.hasSegmentsChained = false;
				if (self.segments.length === 0) {
					return false;
				}
				var hasErrors = false;
				// first segment is expected to be the start segment, see layout traceEdge()
				var newList = [],
					workList = self.segments.slice(),
					currPoint = workList[0].getEndPoint();
				var startSgm = self.segments[0];
				newList.push(startSgm);
				workList.splice(0,1);

				while (workList.length > 0) {
					var attached = getSegmentsByStartPoint(workList, currPoint);
					if (attached.length === 0) {
						console.log("##### ERROR chainSegments: no attached segments to point "+currPoint.print()+", "+self.getName());
						console.log("===== testPrint EDGE: "+self.print());
						hasErrors = true;
						break;
					} else if (attached.length === 1) {
						var currSgm = attached[0],
							currIdx = getSegmentIndex(workList, currSgm);
						//if (self.getName() === "[L1/OUT-0]-[R1/IN-0]") {
							//console.log("### chainSegments current: "+currSgm.print0());
						//}
						newList.push(currSgm);
						currPoint = currSgm.getEndPoint();
						workList.splice(currIdx, 1);
					} else { // > 1, but no more than one zero length segment
						var zeroSgm = getZeroLengthSegment(attached),
							zeroIdx = getSegmentIndex(attached, zeroSgm),
							workListIdx = getSegmentIndex(workList, zeroSgm);
						newList.push(zeroSgm);
						workList.splice(workListIdx, 1);
						attached.splice(zeroIdx, 1);

						currSgm = attached[0];
						currIdx = getSegmentIndex(workList, currSgm);
						newList.push(currSgm);
						currPoint = currSgm.getEndPoint();
						workList.splice(currIdx, 1);
					}
				}

				if (!hasErrors) {
					self.segments = newList;
					self.hasSegmentsChained = true;
				}

				//if (self.getName() === "[P1/OUT-1]-[P5/IN-0]") {
					//console.log("### chainSegments 2: "+self.print());
				//}
				return self.hasSegmentsChained;
			};

			var _edgeRectBounds;
			self.getEdgeRectBounds = function() {
				if (!_edgeRectBounds) {
					_edgeRectBounds = calculateEdgeRectBounds();
				}
				return _edgeRectBounds;
			};
			function calculateEdgeRectBounds() {
				var points = [];
				if (self.hasSegmentsChained) {
					for (var i = 0; i < self.segments.length; i++) {
						if (i == 0) {
							points.push(self.segments[i].getStartPoint());
						}
						points.push(self.segments[i].getEndPoint());
					}
				}
				if (points.length === 0) {
					return new Rectangle(0,0,0,0);
				}
				var minX = Number.MAX_VALUE, minY = Number.MAX_VALUE;
				var maxX = 0, maxY = 0;
				for (var j = 0; j < points.length; j++) {
					minX = Math.min(minX, points[j].x);
					minY = Math.min(minY, points[j].y);
					maxX = Math.max(maxX, points[j].x);
					maxY = Math.max(maxY, points[j].y);
				}
				return new Rectangle(minX, minY, maxX-minX, maxY-minY);
			}

			self.getSourceAnchorPoint = function() {
				return self.getStartSegment().getEndPoint();
			};

			self.getTargetAnchorPoint = function() {
				return self.getEndSegment().getStartPoint();
			};

			// between anchor points
			self.getTracingRectangle = function() {
				var points = [];
				if (self.hasSegmentsChained) {
					for (var i = 1; i < self.segments.length-1; i++) {
						if (i == 0) {
							points.push(self.segments[i].self.getStartPoint());
						}
						points.push(self.segments[i].self.getEndPoint());
					}
				}
				if (points.length === 0) {
					return new Rectangle(0,0,0,0);
				}
				var minX = Number.MAX_VALUE, minY = Number.MAX_VALUE;
				var maxX = 0, maxY = 0;
				for (var j = 0; j < points.length; j++) {
					minX = Math.min(minX, points[j].x);
					minY = Math.min(minY, points[j].y);
					maxX = Math.max(maxX, points[j].x);
					maxY = Math.max(maxY, points[j].y);
				}
				return new Rectangle(minX, minY, maxX-minX, maxY-minY);
			};

			// point - start or end point of this segment
			// TODO: replace with one of the next functions
			self.getAdjacentSegment = function(segment, point) {
				for (var i = 0; i < self.segments.length; i++) {
					if (self.segments[i].equals(segment)) {
						if (self.segments[i].getStartPoint().equals(point) && i > 0) {
							return self.segments[i-1];
						} else if (self.segments[i].getEndPoint().equals(point) && i < self.segments.length-1) {
							return self.segments[i+1];
						}
					}
				}
				return undefined;
			};

			self.getPreviousSegment = function(segment) {
				if (self.hasSegmentsChained) {
					for (var i = 0; i < self.segments.length; i++) {
						if (self.segments[i].equals(segment) && i > 0) {
							return self.segments[i - 1];
						}
					}
				}
				return undefined;
			};

			self.getPreviousSegmentFromList = function(segment, list) {
				for (var i = 0; i < list.length; i++) {
					if (list[i].equals(segment) && i > 0) {
						return list[i - 1];
					}
				}
				return undefined;
			};

			self.getNextSegment = function(segment) {
				if (self.hasSegmentsChained) {
					for (var i = 0; i < self.segments.length; i++) {
						if (self.segments[i].equals(segment) && i < self.segments.length - 1) {
							return self.segments[i + 1];
						}
					}
				}
				return undefined;
			};

			self.getNextSegmentFromList = function(segment, list) {
				for (var i = 0; i < list.length; i++) {
					if (list[i].equals(segment) && i < list.length - 1) {
						return list[i + 1];
					}
				}
				return undefined;
			};

			self.getSiblingSegments = function(segment) {
				var siblings = [];
				if (self.hasSegmentsChained) {
					for (var i = 0; i < self.segments.length; i++) {
						if (self.segments[i].equals(segment)) {
							if (i > 0) {
								siblings.push(self.segments[i-1]);
							}
							if (i < self.segments.length - 1) {
								siblings.push(self.segments[i+1]);
							}
						}
					}
				}
				return siblings;
			};

			//self.drawGraphics = function(ctx) {
			//	if (!self.isVisible()) {
			//		return;
			//	}
			//	ctx.lineWidth = 1;
			//	ctx.setLineDash([0,0]);
			//	ctx.strokeStyle = 'blue';
			//	for (var i = 0; i < self.segments.length; i++) {
			//		self.segments[i].drawGraphics(ctx);
			//	}
			//};

			self.equals = function(another) {
				//return _sourcePort && _sourcePort.equals(another.getSourcePort()) &&
				//		_targetPort && _targetPort.equals(another.getTargetPort());
				return another && another.getName() === self.getName();
			};

			self.print = function() {
				var retVal = self.getName()+", segments="+self.segments.length;
				for (var i = 0; i < self.segments.length; i++) {
					retVal += "\n\t"+self.segments[i].print();
				}
				return retVal;
			};

			self.printEdge = function() {
				//return  self.getName()+", srcSide = "+self.getSourceSide()+", trgSide = "+self.getTargetSide();
				return  self.getName()+", srcPO = "+self.getSourcePort().getOrder()+", trgPO = "+self.getTargetPort().getOrder();
			};

		}
		jsUtils.inherit(GraphEdge, GraphElement);
		return GraphEdge;
	}
);