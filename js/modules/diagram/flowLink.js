define('modules/diagram/flowLink',
	['modules/graph/graphEdge',
		'modules/draw/draw',
		'modules/geometry/rectangle',
		'modules/geometry/point',
		'modules/graph/pipeCrossing',
		'modules/graph/segment',
		'modules/graph/edgeCorner',
		'modules/graph/graphConstants',
		'modules/diagram/diagramUtils',
		'modules/view/dndUtils',
		'modules/flow/flowUtils',
		'modules/util/utils',
		'modules/layout/edgesLayoutUtils',
		'modules/settings/config',
		'modules/core/jsUtils'],
	function(GraphEdge,
	         draw,
			 Rectangle,
			 Point,
			 PipeCrossing,
			 Segment,
			 EdgeCorner,
			 constants,
			 diagramUtils,
			 dndUtils,
			 flowUtils,
			 utils,
			 edgesLayoutUtl,
			 config,
	         jsUtils) {
		function FlowLink(name) {
			GraphEdge.call(this, name);

			var self = this,
				_tooltip;

			// colors are generated later based on the drawColor
			var _drawColor = constants.colors().EDGE,
				_defDrawColor = constants.colors().EDGE,
				_lightColor = constants.colors().EDGE_LIGHT,
				_hltColor = constants.colors().EDGE_HLT,
				//_dragColor = constants.colors().SGM_DRAGGED,
				_selColor = constants.colors().EDGE_SEL,
				_lineColor = constants.colors().EDGE_LINE;
				//_shadeColor = constants.colors().EDGE_SHADE;

			self.getFlowType = function() { return constants.flowType().LINK; };

			self.getDrawColor = function() { return _drawColor; };
			self.getDefDrawColor = function() { return _defDrawColor; };
			self.setDrawColor = function(color) {
				_drawColor = color;
				_hltColor = utils.changeHexColor(color, -25);
				_selColor = utils.changeHexColor(color, -35);
				_lineColor = utils.changeHexColor(color, -35);
				_lightColor = color;
			};

			var _order = -1;
			self.setOrder = function(order) { _order = order; };
			self.getOrder = function() { return _order; };

			var _linkLabel = "";
			self.setLinkLabel = function(label) { _linkLabel = label; };
			self.getLinkLabel = function() { return _linkLabel; };

			// dragging segments or corners
			var _selectedSegments = [];
			self.addToSelectedSegments = function(sgm) {
				//if (!self.isStartSegment(sgm) && !self.isEndSegment(sgm)) {
					_selectedSegments.push(sgm);
				//}
			};
			self.addGroupToSelectedSegments = function(sgmList) {
				for (var i = 0; i < sgmList.length; i++) {
					self.addToSelectedSegments(sgmList[i]);
				}
			};
			self.getSelectedSegments = function() { return _selectedSegments; };
			self.resetSelectedSegments = function() { _selectedSegments = []; };

			//////////////

			var _segmentShifts = [];
			self.getSegmentShifts = function() { return _segmentShifts; };
			self.getSegmentShiftsToSave = function() {
				return getResultingShifts();
			};

			self.setSegmentShifts = function(shifts) {
				_segmentShifts = [];
				for (var i = 0; i < shifts.length; i++) {
					var shiftObj = {};
					shiftObj.order = shifts[i].order;
					shiftObj.pipeShift = shifts[i].pipeShift;
					_segmentShifts.push(shiftObj);
				}
			};

			self.setSegmentShift = function(segmentOrder, shift) {
				var shiftObj = {};
				shiftObj.order = segmentOrder;
				shiftObj.pipeShift = shift;
				_segmentShifts.push(shiftObj);
			};

			self.getSegmentShift = function(segmentOrder) {
				for (var i = 0; i < _segmentShifts.length; i++) {
					if (_segmentShifts[i].order === segmentOrder) {
						return _segmentShifts[i].pipeShift;
					}
				}
				return 0;
			};

			self.hasSegmentShifts = function() {
				return getResultingShifts().length > 0;
			};

			self.clearSegmentShifts = function() {
				_segmentShifts = [];
			};

			self.getTotalShifts = function() {
				return getResultingShifts();
			};

			function getResultingShifts() {
				var lastShifts = [],
					resultingShifts = [];
				for (var i = 0; i < _segmentShifts.length; i++) {
					var current = _segmentShifts[i],
						found = false;
					for (var j = 0; j < lastShifts.length; j++) {
						if (lastShifts[j].order === current.order) {
							lastShifts[j].pipeShift += current.pipeShift;
							found = true;
							break;
						}
					}
					if (!found) {
						var last = {};
						last.order = current.order;
						last.pipeShift = current.pipeShift;
						lastShifts.push(last);
					}
				}
				for (var k = 0; k < lastShifts.length; k++) {
					if (lastShifts[k].pipeShift != 0) {
						resultingShifts.push(lastShifts[k]);
					}
				}
				return resultingShifts;
			}

			/////////////

			var _forcedCrossings = [],
				_forcedCrossingsNum = 0,
				MAX_FORCED_CROSSINGS = 4;

			self.getForcedCrossings = function() { return _forcedCrossings; };
			self.hasForcedCrossings = function() { return _forcedCrossings.length > 0; };

			// TODO: identify the accepting locations
			self.addForcedCrossing = function(pipeXing, cornerType) {
				if (!hasForcedCrossing(pipeXing) &&
						_forcedCrossingsNum <= MAX_FORCED_CROSSINGS &&
						!isNewCrossingInCorner(pipeXing) &&
						!isNewCrossingOnSegment(pipeXing, cornerType)) {
					var idx = edgesLayoutUtl.getIndexForCrossing(self, pipeXing);
					if (idx >= 0) {
						_forcedCrossings.splice(idx, 0, pipeXing);
					} else {
						_forcedCrossings.push(pipeXing);
					}
					_forcedCrossingsNum++;
				}
			};

			self.removeForcedCrossing = function(pipeXing) {
				var fcIdx = -1;
				for (var i = 0; i < _forcedCrossings.length; i++) {
					if (_forcedCrossings[i].equals(pipeXing)) {
						fcIdx = i;
						break;
					}
				}
				if (fcIdx > -1) {
					_forcedCrossings.splice(fcIdx, 1);
					_forcedCrossingsNum--;
				}
				return fcIdx;
			};

			self.setForcedCrossing = function(pipeXing, idx) {
				if (idx && idx >= 0) {
					_forcedCrossings.splice(idx, 0, pipeXing);
				} else {
					_forcedCrossings.push(pipeXing);
				}
				_forcedCrossingsNum++;
			};

			self.setForcedCrossings = function(xings) {
				_forcedCrossings = [];
				for (var i = 0; i < xings.length; i++) {
					_forcedCrossings.push(xings[i]);
				}
				_forcedCrossingsNum = xings.length;
			};

			self.clearForcedCrossings = function() {
				_forcedCrossings = [];
				_forcedCrossingsNum = 0;
			};

			self.isDraggableCorner = function(corner) {
				return _forcedCrossingsNum <= MAX_FORCED_CROSSINGS &&
					isInnerEdgeCorner(corner.firstSegment(), corner.secondSegment()) &&
					!dndUtils.isPointInPipeCrossing(corner.cornerPoint(), _forcedCrossings);
			};

			function isInnerEdgeCorner(sgm1, sgm2) {
				return sgm1 && !self.isStartSegment(sgm1) && !self.isEndSegment(sgm1) &&
					sgm2 && !self.isStartSegment(sgm2) && !self.isEndSegment(sgm2);
			}

			function hasForcedCrossing(pipeXing) {
				for (var i = 0; i < _forcedCrossings.length; i++) {
					if (_forcedCrossings[i].equals(pipeXing)) {
						return true;
					}
				}
				return false;
			}

			// check if attempted xing is at its corner
			function isNewCrossingInCorner(pipeXing) {
				if (pipeXing.getXCorner()) {
					var corner = pipeXing.getXCorner(),
						sgm1 = corner.firstSegment(),
						sgm2 = corner.secondSegment(),
						levelPipeIdx = pipeXing.getLevelPipeOrder(),
						lanePipeIdx = pipeXing.getLanePipeOrder();
					if (((sgm1.getPipe().getType() === constants.pipeType().LEVEL_PIPE && sgm1.getPipe().getOrder() === levelPipeIdx) &&
						(sgm2.getPipe().getType() === constants.pipeType().LANE_PIPE && sgm2.getPipe().getOrder() === lanePipeIdx))
						||
						((sgm1.getPipe().getType() === constants.pipeType().LANE_PIPE && sgm1.getPipe().getOrder() === lanePipeIdx) &&
						(sgm2.getPipe().getType() === constants.pipeType().LEVEL_PIPE && sgm2.getPipe().getOrder() === levelPipeIdx))
					) {
						return true;
					}
				}
				return false;
			}

			// check if attempted crossing is on a segment
			function isNewCrossingOnSegment(pipeXing, cornerType) {
				if (cornerType === constants.cornerType().PAIR) {
					return false;
				}
				if (pipeXing.getXCorner()) {
					var levelPipeIdx = pipeXing.getLevelPipeOrder(),
						lanePipeIdx = pipeXing.getLanePipeOrder(),
						centerPnt = pipeXing.getCenterPoint(),
						//allSegments = self.segments.concat(_copySegments);
						allSegments = _copySegments;
					for (var i = 0; i < allSegments.length; i++) {
						var sgm = allSegments[i],
							pipe = sgm.getPipe();
						if (pipe.getType() === constants.pipeType().LEVEL_PIPE && pipe.getOrder() === levelPipeIdx ||
							pipe.getType() === constants.pipeType().LANE_PIPE && pipe.getOrder() === lanePipeIdx) {
							if (edgesLayoutUtl.isPointProjectionOnSegment(centerPnt, sgm)) {
								return true;
							}
						}
					}
				}
				return false;
			}

			//function getLinkCrossings(flowLayout) {
			//	var crossings = [];
			//	for (var i = 1; i < self.segments.length-2; i++) {
			//		var sgm = self.segments[i],
			//			levelPipe = flowUtils.getLevelPipeAtPoint(sgm.getEndPoint(), flowLayout.getLevelPipes()),
			//			lanePipe = flowUtils.getLanePipeAtPoint(sgm.getEndPoint(), flowLayout.getLanePipes()),
			//			xing = new PipeCrossing(levelPipe.getOrder(), lanePipe.getOrder, flowLayout);
			//		xing.setXCorner(new EdgeCorner(sgm.getEndPoint(), sgm, sgm.getNext()));
			//		crossings.push(xing);
			//	}
			//	return crossings;
			//}

			// segment under an existing xing
			//function getSegmentForCrossing(crossings, pipeXing) {
			//	for (var i = 0; i < crossings.length; i++) {
			//		var corner = crossings[i].getXCorner();
			//		if (corner.firstSegment().getPipe().equals(pipeXing.getLevelPipe(pipeXing.getFlowLayout())) ||
			//			corner.firstSegment().getPipe().equals(pipeXing.getLanePipe(pipeXing.getFlowLayout())) ) {
			//			return corner.firstSegment();
			//		}
			//		if (corner.secondSegment().getPipe().equals(pipeXing.getLevelPipe(pipeXing.getFlowLayout())) ||
			//			corner.secondSegment().getPipe().equals(pipeXing.getLanePipe(pipeXing.getFlowLayout())) ) {
			//			return corner.secondSegment();
			//		}
			//	}
			//	return undefined;
			//}

			/////////////

			self.getLinkSourcePortName = function() {
				return self.getSourcePort().getNode().getName()+"/"+self.getSourcePort().getName();
			};
			self.getLinkSourcePortLabel = function() {
				return self.getSourcePort().getPortLabel();
			};

			self.getLinkTargetPortName = function() {
				return self.getTargetPort().getNode().getName()+"/"+self.getTargetPort().getName();
			};
			self.getLinkTargetPortLabel = function() {
				return self.getTargetPort().getPortLabel();
			};
			self.getLinkInfo = function() {
				var linkInfo = [];
				var srcInfo = "Source: "+self.getLinkSourcePortName();
				if (self.getLinkSourcePortLabel()) {
					srcInfo = srcInfo.concat(" > "+self.getLinkSourcePortLabel());
				}
				linkInfo.push(srcInfo);
				var trgInfo = "Target: "+self.getLinkTargetPortName();
				if (self.getLinkTargetPortLabel()) {
					trgInfo = trgInfo.concat(" > "+self.getLinkTargetPortLabel());
				}
				linkInfo.push(trgInfo);
				if (self.getLinkLabel()) {
					linkInfo.push("Label: "+self.getLinkLabel());
				}
				return linkInfo;
			};

			self.getLinkObject = function() {
				var link = self.getLinkObjectToSave(false);
				link.order = self.getOrder();
				link.srcShift = self.getSourceShift();
				link.trgShift = self.getTargetShift();
				link.srcPortOrder = self.getSrcPortOrder();
				link.trgPortOrder = self.getTrgPortOrder();
				link.pipesOnly = self.hasPipesOnly();
				return link;
			};

			self.getLinkObjectToSave = function(toSave) {
				var link = {};
				link.id = constants.elementType().EDGE;
				link.source = self.getLinkSourcePortName();
				link.target = self.getLinkTargetPortName();
				link.name = "["+link.source+"]-["+link.target+"]";
				link.srcSide = self.getSourceSide();
				link.trgSide = self.getTargetSide();
				link.type = self.getType();
				link.label = self.getLinkLabel();
				var shifts = toSave ? self.getSegmentShiftsToSave() : self.getSegmentShifts();
				if (shifts.length > 0) {
					link.segmentShifts = shifts;
				}
				if (self.getForcedCrossings().length > 0) {
					var corners = [], allCorners = self.getForcedCrossings();
					for (var i = 0; i < allCorners.length; i++) {
						var corner = {};
						corner.levelPipeOrder = allCorners[i].getLevelPipeOrder();
						corner.lanePipeOrder = allCorners[i].getLanePipeOrder();
						corners.push(corner);
					}
					link.corners = corners;
				}
				link.drawColor = _drawColor;
				return link;
			};

			self.isLinkVisible = function() {
				var srcNode = self.getSourcePort().getNode(),
					trgNode = self.getTargetPort().getNode();
				return self.isVisible() &&
					(srcNode.isVisible() || srcNode.getFlowType() === constants.flowType().CONTAINER) &&
					(trgNode.isVisible() || trgNode.getFlowType() === constants.flowType().CONTAINER);
			};

			self.highlightOnMouseMove = function(pnt) {
				if (self.containsPoint(pnt)) {
					self.setHighlighted(true);
					return true;
				} else {
					self.setHighlighted(false);
					return false;
				}
			};

			self.highlightOnMouseDrag = function(pnt) {
				var found = false;
				if (self.containsPoint(pnt)) {
					self.setSelected(true);
					found = true;
				} else {
					self.setSelected(false);
				}
				return found;
			};

			self.getTooltip = function() {
				return config.hasShowTooltip() ? _tooltip : undefined;
				//return _tooltip;
			};

			var _copySegments = [];
			self.copySegments = function() {
				_copySegments = [];
				for (var i = 0; i < self.segments.length; i++) {
					var startPnt = new Point(self.segments[i].getStartPoint().x, self.segments[i].getStartPoint().y),
						endPnt = new Point(self.segments[i].getEndPoint().x, self.segments[i].getEndPoint().y),
						copySgm = new Segment(this, self.segments[i].getPipe(), null, self.segments[i].getType(), startPnt, endPnt);
					_copySegments.push(copySgm);
				}
			};
			self.getCopySegments = function() { return _copySegments; };

			self.printLink = function() {
				//var sgmShifts = self.getTotalShifts(),
				var sgmShifts = self.getSegmentShifts(),
					type = diagramUtils.getLinkTypeName(self.getType()),
					out = self.getName();
				out += "\ntype: "+type;
				out += "\nsource port order = "+self.getSourcePort().getOrder()+", side = "+self.getSourcePort().getSide();
				out += "\ntarget port order = "+self.getTargetPort().getOrder()+", side = "+self.getTargetPort().getSide();
				out += "\nforced crossings("+_forcedCrossings.length+")";
				for (var j = 0; j < _forcedCrossings.length; j++) {
					out += "\n\t"+ _forcedCrossings[j].printPipeXing();
				}
				out += "\nsegments("+self.segments.length+"):";
				for (var i = 0; i < self.segments.length; i++) {
					out += "\n\t"+self.segments[i].print0();
				}

				//out += "\n- segments: "+self.getSegments().length;
				out += "\nsegment shifts("+sgmShifts.length+")";
				if (sgmShifts.length > 0) {
					for (var i = 0; i < sgmShifts.length; i++) {
						out += "\n - segment order: "+sgmShifts[i].order+", shift: "+sgmShifts[i].pipeShift;
					}
				}
				//out += "\n- source port: "+self.getSourcePort().getName()+", order="+self.getSourcePort().getOrder();
				//out += "\n- target port: "+self.getTargetPort().getName()+", order="+self.getTargetPort().getOrder();
				return out;
			};

			function getSegmentsCommonPoint(sgm1, sgm2) {
				if (sgm1.getStartPoint().equals(sgm2.getEndPoint())) {
					return sgm1.getStartPoint();
				} else if (sgm2.getStartPoint().equals(sgm1.getEndPoint())) {
					return sgm2.getStartPoint();
				} else {
					return undefined;
				}
			}

			self.drawGraphics = function(ctx) {
				if (!self.isLinkVisible()) {
					return;
				}
				ctx.save();
				if (self.drawMode === constants.drawMode().SEGMENTS) {
					var color = _drawColor;
					if (self.isHighlighted()) {
						color = _hltColor;
					}
					if (self.isSelected()) {
						color = _selColor;
					}
					//ctx.lineWidth = 1;
					ctx.lineWidth = self.isSelected() ? 2 : 1;
					ctx.setLineDash(self.getType() === constants.linkType().REF_LINK ? [4,2] : [0,0]);
					//ctx.setLineDash(self.getType() === constants.linkType().REF_LINK ? [0,0] : [0,0]);
					ctx.strokeStyle = color;
					for (var i = 0; i < self.segments.length; i++) {
						//ctx.strokeStyle = !self.segments[i].isShortCut() ? color : '#ff0000'; //i % 2 === 0 ? '#ff0000' : '#00ff00';
						//ctx.strokeStyle = i % 2 === 0 ? '#ff0000' : '#00ff00';
						self.segments[i].drawGraphics(ctx);
					}
					if (self.isSelected()) {
						//ctx.lineWidth = 2;
						//var selectedSgm = self.segments[_selectedSegmentOrder];
						if (_selectedSegments.length === 1 &&
							!self.isStartSegment(_selectedSegments[0]) && !self.isEndSegment(_selectedSegments[0])) {
							var selectedSgm = _selectedSegments[0],
								p1 = selectedSgm.getStartPoint(),
								p2 = selectedSgm.getEndPoint(),
								dd = 2,
								rect1 = new Rectangle(p1.x-dd, p1.y-dd, dd*2, dd*2),
								rect2 = new Rectangle(p2.x-dd, p2.y-dd, dd*2, dd*2);
							draw.paintRectangle(ctx, rect1, color, color, 1);
							draw.paintRectangle(ctx, rect2, color, color, 1);
						} else if (_selectedSegments.length === 2 &&
								isInnerEdgeCorner(_selectedSegments[0], _selectedSegments[1])) {
							var p1 = getSegmentsCommonPoint(_selectedSegments[0], _selectedSegments[1]),
								dd = 2;
							if (p1) {
								rect1 = new Rectangle(p1.x-dd, p1.y-dd, dd*2, dd*2);
								draw.paintRectangle(ctx, rect1, color, color, 1);
							}
						}
					}

				} else if (self.drawMode === constants.drawMode().LINE) {
					ctx.lineWidth = 1;
					ctx.setLineDash(self.getType() === constants.linkType().REF_LINK ? [4,2] : [0,0]);
					ctx.strokeStyle = _lineColor;
					ctx.beginPath();
					var startCnxPnt = self.getSourcePort().getConnectionPoint(),
						//endCnxPnt = self.getTargetPort().getConnectionPoint(),
						startPnt = self.getSourcePort().getAttachmentPoint(),
						endPnt = self.getTargetPort().getAttachmentPoint(),
						startX = config.getLinkStyle() === constants.linkStyle().DOUBLE_ARROW ?
							startPnt.x : startCnxPnt.x,
						startY = config.getLinkStyle() === constants.linkStyle().DOUBLE_ARROW ?
							startPnt.y : startCnxPnt.y;
					ctx.moveTo(startX, startY);
					ctx.lineTo(endPnt.x, endPnt.y);
					ctx.stroke();
				} else if (self.drawMode === constants.drawMode().SEGMENT_DRAGGED) {
					if (_selectedSegments.length === 1 &&
						!self.isStartSegment(_selectedSegments[0]) && !self.isEndSegment(_selectedSegments[0])) {
						ctx.lineWidth = 2;
						ctx.setLineDash(self.getType() === constants.linkType().REF_LINK ? [4,2] : [0,0]);

						// light copy
						ctx.strokeStyle = _lightColor;
						for (var j = 0; j < _copySegments.length; j++) {
							_copySegments[j].drawGraphics(ctx);
						}

						var draggedSgm = _selectedSegments[0];
						ctx.strokeStyle = _hltColor;
						ctx.beginPath();
						var startPnt1 = draggedSgm.getPrevious().getStartPoint(),
							endPnt1 = draggedSgm.getStartPoint();
						ctx.moveTo(startPnt1.x, startPnt1.y);
						ctx.lineTo(endPnt1.x, endPnt1.y);
						ctx.stroke();

						ctx.beginPath();
						var startPnt2 = draggedSgm.getEndPoint(),
							endPnt2 = draggedSgm.getNext().getEndPoint();
						ctx.moveTo(startPnt2.x, startPnt2.y);
						ctx.lineTo(endPnt2.x, endPnt2.y);
						ctx.stroke();

						draggedSgm.drawGraphics(ctx);

						//ctx.lineWidth = 2;
						var p1 = endPnt1,
							p2 = startPnt2,
							dd = 2,
							rect1 = new Rectangle(p1.x-dd, p1.y-dd, dd*2, dd*2),
							rect2 = new Rectangle(p2.x-dd, p2.y-dd, dd*2, dd*2);

						ctx.lineWidth = 1;
						draw.paintRectangle(ctx, rect1, _lineColor, _lineColor, 1);
						draw.paintRectangle(ctx, rect2, _lineColor, _lineColor, 1);
					}
					else if (_selectedSegments.length === 2) {
						ctx.lineWidth = 2;
						ctx.setLineDash(self.getType() === constants.linkType().REF_LINK ? [4,2] : [0,0]);

						// light copy
						ctx.strokeStyle = _lightColor;
						for (var j = 0; j < _copySegments.length; j++) {
							_copySegments[j].drawGraphics(ctx);
						}

						var draggedPnt = getSegmentsCommonPoint(_selectedSegments[0], _selectedSegments[1]);
						ctx.strokeStyle = _hltColor;
						ctx.beginPath();
						var startPnt = _selectedSegments[0].getStartPoint(),
							endPnt = _selectedSegments[1].getEndPoint();
						ctx.moveTo(startPnt.x, startPnt.y);
						ctx.lineTo(draggedPnt.x, draggedPnt.y);
						ctx.lineTo(endPnt.x, endPnt.y);
						ctx.stroke();

						ctx.lineWidth = 1;
						var p1 = draggedPnt,
							dd = 2,
							rect1 = new Rectangle(p1.x-dd, p1.y-dd, dd*2, dd*2);
						draw.paintRectangle(ctx, rect1, _lineColor, _lineColor, 1);

					}
				}

				//for (k = 0; k < _forcedCrossings.length; k++) {
				//	draw.paintRectangle(ctx, _forcedCrossings[k], null, '#0000FF', 1);
				//}

				ctx.restore();
			};

		}
		jsUtils.inherit(FlowLink, GraphEdge);
		return FlowLink;
	}
);