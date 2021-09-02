define('modules/graph/graphNode',
	['modules/geometry/rectangle',
		'modules/geometry/dimension',
		'modules/common/map',
		'modules/graph/graphElement',
		'modules/graph/graphPort',
		'modules/graph/graphMarkupPort',
		'modules/graph/graphRefPort',
		'modules/graph/graphConstants',
		'modules/graph/modelUtils',
		'modules/settings/config',
		'modules/diagram/diagramUtils',
		'modules/draw/drawUtils',
		'modules/settings/style',
		'modules/core/jsUtils'],
	function(Rectangle,
			 Dimension,
			 Map,
	         GraphElement,
	         GraphPort,
	         GraphMarkupPort,
	         GraphRefPort,
	         constants,
	         modelUtils,
	         config,
			 diagramUtils,
			 drawUtils,
	         Style,
	         jsUtils) {

		function GraphNode(name, flowType) {
			GraphElement.call(this, new Rectangle(0,0,0,0));

			GraphNode.LEVEL_UNDEF = -1;
			GraphNode.LANE_UNDEF = -1;

			GraphNode.D_IN 			= constants.portNames().D_IN;
			GraphNode.D_TRUE 		= constants.portNames().D_TRUE;
			GraphNode.D_FALSE 		= constants.portNames().D_FALSE;
			GraphNode.MARK_D_IN 	= constants.portNames().MARK_D_IN;
			GraphNode.MARK_D_TRUE 	= constants.portNames().MARK_D_TRUE;
			GraphNode.MARK_D_FALSE 	= constants.portNames().MARK_D_FALSE;

			var self = this;

			self.setName(name);
			self.setId(constants.elementType().NODE);

			self.flowType = flowType;
			self.setFlowType = function(flowType) { self.flowType = flowType; };
			self.getFlowType = function() { return self.flowType; };

			var _group = diagramUtils.getNodeGroup(flowType);
			self.getNodeGroup  = function() { return _group; };

			var _category = diagramUtils.getNodeCategory(flowType);
			self.getNodeCategory = function() { return _category; };

			self.isExpanded = function() { return false; };

			var _cell;
			self.setCell = function(cell) { _cell = cell; };
			self.getCell = function() { return _cell; };

			self.getPortNameTrue = function() { return GraphNode.D_TRUE; };
			self.getPortNameFalse = function() { return GraphNode.D_FALSE; };
			self.getMarkupNameTrue = function() { return GraphNode.MARK_D_TRUE; };
			self.getMarkupNameFalse = function() { return GraphNode.MARK_D_FALSE; };

			var _contentText = "",
				_contentTextAbove = "",
				_contentTextBelow = "",
				_contentSize = new Dimension(0, 0), // maximal size of the text box
				_contentSizeAbove = new Dimension(0, 0),
				_contentSizeBelow = new Dimension(0, 0),
				_textRect = new Dimension(0, 0), // calculated size of the text box
				_textRectAbove = new Dimension(0, 0),
				_textRectBelow = new Dimension(0, 0),
				_contentLines = [],
				_contentLinesAbove = [],
				_contentLinesBelow = [];

			self.setContentText = function(text) { _contentText = text; };
			self.getContentText = function() { return _contentText; };
			self.setContentTextAbove = function(text) { _contentTextAbove = text; };
			self.getContentTextAbove = function() { return _contentTextAbove; };
			self.setContentTextBelow = function(text) { _contentTextBelow = text; };
			self.getContentTextBelow = function() { return _contentTextBelow; };

			self.getContentSize = function(){ return _contentSize; };
			self.getContentSizeAbove = function(){ return _contentSizeAbove; };
			self.getContentSizeBelow = function(){ return _contentSizeBelow; };

			self.getTextRectangle = function(){ return _textRect; };
			self.getTextRectangleAbove = function(){ return _textRectAbove; };
			self.getTextRectangleBelow = function(){ return _textRectBelow; };

			self.getContentArray = function(){ return _contentLines; };
			self.getContentArrayAbove = function(){ return _contentLinesAbove; };
			self.getContentArrayBelow = function(){ return _contentLinesBelow; };

			self.getTextDefaults = function() { return {}; };

			function calculateTextParams(text) {
				if (text.length > 0) {
					var ctx = config.getContextReference(),
						textDefaults = self.getTextDefaults();
						//cvExt = textDefaults.extentWidth; //constants.contentViewExt().WIDTH;
					ctx.font = constants.font().TEXT; //"12px Arial";
					var fontHeight = parseInt(ctx.font),
						leading = constants.textLeading().HEIGHT,
						textRect = drawUtils.getTextBoxLines(
							text,
							ctx,
							fontHeight,
							leading,
							textDefaults),
						contentLines = drawUtils.getContentLines(),
						contentSize,
						maxLines = textDefaults.maxLines, //constants.contentSize().MAX_LINES,
						linesNum = contentLines.length < maxLines ? contentLines.length : maxLines;
					if (config.hasShowTitleOnContent()) {
						linesNum++;
					}
					ctx.font = constants.font().TEXT; //"12px Arial";
					var width = textDefaults.maxWidth + 2 * textDefaults.extentWidth,
						height = linesNum * (fontHeight+leading) +  2 * textDefaults.extentHeight;
					contentSize = new Dimension(width, height);
				} else {
					textRect = new Dimension(0, 0);
					contentLines = [];
					contentSize = new Dimension(0, 0);
				}
				return {
					rect: textRect,
					lines: contentLines,
					size: contentSize
				};
			}

			self.calculateContentParams = function() {
				var params = calculateTextParams(self.getContentText());
				_textRect = params.rect;
				_contentLines = params.lines;
				_contentSize = params.size;

				params = calculateTextParams(self.getContentTextAbove());
				_textRectAbove = params.rect;
				_contentLinesAbove = params.lines;
				_contentSizeAbove = params.size;

				params = calculateTextParams(self.getContentTextBelow());
				_textRectBelow = params.rect;
				_contentLinesBelow = params.lines;
				_contentSizeBelow = params.size;
			};

			self.init = function() {
				if (self.flowType === constants.flowType().START) {
					self.setStartNode(true);
				} else if (self.flowType === constants.flowType().END) {
					self.setEndNode(true);
				} else if (self.flowType === constants.flowType().DECISION) {
					self.setDecisionNode();
				} else if (self.flowType === constants.flowType().SWITCH) {
					self.setSwitchNode();
				} else if (self.flowType === constants.flowType().LEFT_TOP) {
					self.setLeftLaneNode(true);
				} else if (self.flowType === constants.flowType().RIGHT_BOTTOM) {
					self.setRightLaneNode(true);
				} else {
					// PROCESS, I/O
					self.inCnxStyle.setBack(true);
					self.inCnxStyle.setLeft(true);
					self.inCnxStyle.setRight(true);

					self.outCnxStyle.setFront(true);
					self.outCnxStyle.setLeft(true);
					self.outCnxStyle.setRight(true);
				}
			};

			/**
			 * The rectangle parameters 'width' and 'height' are related to the vertical orientation.
			 */
			self.setInitialSize = function(w, h) {
				self.calculateContentParams();
				//if (self.getName() === "SW1") {
				//	console.log("+++ 1: "+self.getName()+" setInitialSize: "+w+", "+h+", text: "+_textRect.width+", "+_textRect.height);
				//}
				self.setSize(
					w ? w : self.getEffectiveWidth(
						config.getGlobalNodeWidth(self.getFlowType()), config.getGlobalNodeHeight(self.getFlowType())),
					h ? h : self.getEffectiveHeight(
						config.getGlobalNodeWidth(self.getFlowType()), config.getGlobalNodeHeight(self.getFlowType())));

				modelUtils.adjustSize(self);
				//self.updatePortsLocations();
			};

			self.getEffectiveWidth = function(w, h) {
				return _contentText ? w : (config.getFlowDirection() === constants.flow().VERTICAL ? w : h);
			};

			self.getEffectiveHeight = function(w, h) {
				return _contentText ? h : (config.getFlowDirection() === constants.flow().VERTICAL ? h : w);
			};

			self.getX = function() {
				return self.x;
			};

			self.getY = function() {
				return self.y;
			};

			self.getNodeWidth = function() {
				return self.width;
			};

			self.getNodeHeight = function() {
				return self.height;
			};

			self.setLocation = function(x, y) {
				self.setRectLocation(x,y);
				self.updatePortsLocations();
			};

			self.setLocationOnDrag = function(x, y) {
				self.setRectLocation(x,y);
				self.updatePortsLocationsOnDrag();
			};

			self.resizeW = 0;
			self.resizeH = 0;
			self.resizeDeltaW = 0;
			self.resizeDeltaH = 0;

			self.setResizeW = function(d) {
				var eWidth = self.getEffectiveWidth(
					config.getGlobalNodeWidth(self.getFlowType()), config.getGlobalNodeHeight(self.getFlowType())),
					diffW = self.getNodeWidth() - eWidth;
				if (d < 0 && diffW/2 < Math.abs(d)) {
					// ?
				} else {
					self.resizeW += d;
					self.resizeW = self.resizeW > 0 ? self.resizeW : 0;
				}
			};
			self.getResizeW = function() { return self.resizeW; };

			self.setResizeDeltaW = function(d) {
				var eWidth = self.getEffectiveWidth(
					config.getGlobalNodeWidth(self.getFlowType()), config.getGlobalNodeHeight(self.getFlowType())),
					diffW = self.getNodeWidth() - eWidth;
				if (d < 0 && diffW/2 < Math.abs(d)) {
					// ?
				} else {
					self.resizeDeltaW = d;
				}
			};
			self.getResizeDeltaW = function() { return self.resizeDeltaW; };

			self.setResizeH = function(d) {
				var eHeight = self.getEffectiveHeight(
					config.getGlobalNodeWidth(self.getFlowType()), config.getGlobalNodeHeight(self.getFlowType())),
					diffH = self.getNodeHeight() - eHeight;
				if (d < 0 && diffH/2 < Math.abs(d)) {
					// ?
				} else {
					self.resizeH += d;
					self.resizeH = self.resizeH > 0 ? self.resizeH : 0;
				}
			};
			self.getResizeH = function() { return self.resizeH; };

			self.setResizeDeltaH = function(d) {
				var eHeight = self.getEffectiveHeight(
					config.getGlobalNodeWidth(self.getFlowType()), config.getGlobalNodeHeight(self.getFlowType())),
					diffH = self.getNodeHeight() - eHeight;
				if (d < 0 && diffH/2 < Math.abs(d)) {
					// ?
				} else {
					self.resizeDeltaH = d;
				}
			};
			self.getResizeDeltaH = function() { return self.resizeDeltaH; };

			self.setResize = function(rW, rH) {
				self.setResizeW(rW);
				self.setResizeH(rH);
				var eWidth = self.getEffectiveWidth(
					config.getGlobalNodeWidth(self.getFlowType()), config.getGlobalNodeHeight(self.getFlowType())),
					eHeight = self.getEffectiveHeight(
						config.getGlobalNodeWidth(self.getFlowType()), config.getGlobalNodeHeight(self.getFlowType())),
					ww = self.getNodeWidth() + 2*rW > eWidth ? self.getNodeWidth() + 2*rW : eWidth,
					hh = self.getNodeHeight() + 2*rH > eHeight ? self.getNodeHeight() + 2*rH : eHeight;
				self.setSize(ww, hh);
				//console.log("### setResize: "+rW+", "+rH+", NEW SIZE: "+ww+", "+hh);
			};

			self.hasResizeValues = function() {
				var adjSize = modelUtils.getAdjustedSize(this);
				return self.resizeW > 0 && self.getNodeWidth() > adjSize.width ||
					self.resizeH > 0 && self.getNodeHeight() > adjSize.height;
			};

			self.resetResize = function() {
				self.resizeW = 0;
				self.resizeH = 0;
				self.setSize(
					self.getEffectiveWidth(
						config.getGlobalNodeWidth(self.getFlowType()), config.getGlobalNodeHeight(self.getFlowType())),
					self.getEffectiveHeight(
						config.getGlobalNodeWidth(self.getFlowType()), config.getGlobalNodeHeight(self.getFlowType())));
			};


			self.setSize = function(iw, ih) {
				self.setRectSize(iw, ih);
				self.updatePortsLocations();
			};

			self.isSizeAdjustable = function() { return true; };

			self.getWrapper = function() {
				return new Rectangle(self.x, self.y, self.width, self.height);
			};

			self.updatePortsLocations = function() {
				modelUtils.adjustConnectors(self);
				var ports = self.getConnectionPorts();
				for (var i = 0; i < ports.length; i++) {
					var edges = ports[i].getEdgesList();
					for (var j = 0; j < edges.length; j++) {
						edges[j].updateEdgeLocations();
					}
				}
			};

			self.updatePortsLocationsOnDrag = function() {
				modelUtils.adjustConnectors(self);
				var ports = self.getConnectionPorts();
				for (var i = 0; i < ports.length; i++) {
					var edges = ports[i].getEdgesList();
					for (var j = 0; j < edges.length; j++) {
						edges[j].updateEdgeLocationsOnDrag();
					}
				}
				if (self.isDecisionNode()) {
					//updateDecisionPortsLocations();
				}
			};

			//function updateDecisionPortsLocations() {
			//	var width = self.getNodeWidth(), height = self.getNodeHeight();
			//	var inPort = self.getInputPortForName(GraphNode.D_IN);
			//	if (inPort) {
			//		if (config.getFlowDirection() === constants.flow().VERTICAL) {
			//			//inPort.getConnector().moveToXY(width/2, 0);
			//		} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
			//			//inPort.getConnector().moveToXY(0, height/2);
			//		}
			//		var edges = inPort.getEdgesList();
			//		for (var j = 0; j < edges.length; j++) {
			//			edges[j].updateEdgeLocations();
			//		}
			//	}
			//	// TODO
			//}

			// common

			self.inCnxStyle = new Style(constants.nodeSide().NONE);
			self.getInputStyle = function() { return self.inCnxStyle; };

			self.outCnxStyle = new Style(constants.nodeSide().NONE);
			self.getOutputStyle = function() { return self.outCnxStyle; };

			self.levelNum = GraphNode.LEVEL_UNDEF;
			self.setLevelNumber = function(levelNum) {
				self.levelNum = levelNum;
			};
			self.getLevelNumber = function() { return self.levelNum; };
			self.isLevelAssigned = function() { return self.levelNum > GraphNode.LEVEL_UNDEF; };

			self.laneNum = GraphNode.LANE_UNDEF;
			self.setLaneNumber = function(laneNum) { self.laneNum = laneNum; };
			self.getLaneNumber = function() { return self.laneNum; };
			self.isLaneAssigned = function() { return self.laneNum > GraphNode.LANE_UNDEF; };

			self.laneFootprint = 0;
			self.setLaneFootprint = function(n) { self.laneFootprint = n; };
			self.getLaneFootprint = function() { return self.laneFootprint; };

			self.fixed = false;
			self.isFixed = function() { return self.fixed; };
			self.setFixed = function(b) {
				self.fixed = b && self.isAllocated();
			};
			self.isAllocated = function() {
				return self.levelNum > GraphNode.LEVEL_UNDEF && self.laneNum > GraphNode.LANE_UNDEF;
			};

			self.detach = function() {
				self.levelNum = GraphNode.LEVEL_UNDEF;
				self.laneNum = GraphNode.LANE_UNDEF;
				self.fixed = false;
			};

			self.dummy = false;
			self.setDummy = function(b) { self.dummy = b; };
			self.isDummy = function() { return self.dummy; };

			self.portStep = constants.portStep().MIN;
			self.getPortStep = function() { return self.portStep; };

			self.startNode = false;
			self.setStartNode = function(b) {
				self.startNode = b;
				self.outCnxStyle.setFront(b);
			};
			self.isStartNode = function() {
				return self.startNode;
			};

			self.endNode = false;
			self.setEndNode = function(b) {
				self.endNode = b;
				self.inCnxStyle.setBack(b);
			};
			self.isEndNode = function() {
				return self.endNode;
			};

			self.leftNode = false;
			self.setLeftLaneNode = function(b) {
				self.leftNode = b;
				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					self.inCnxStyle.setRight(b);
					self.outCnxStyle.setRight(b);
				} else {
					self.inCnxStyle.setLeft(b);
					self.outCnxStyle.setLeft(b);
				}
			};
			self.isLeftLaneNode = function() {
				return self.leftNode;
			};

			self.rightNode = false;
			self.setRightLaneNode = function(b) {
				self.rightNode = b;
				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					self.inCnxStyle.setLeft(b);
					self.outCnxStyle.setLeft(b);
				} else {
					self.inCnxStyle.setRight(b);
					self.outCnxStyle.setRight(b);
				}
			};
			self.isRightLaneNode = function() {
				return self.rightNode;
			};

			self.decisionNode = false;
			self.setDecisionNode = function() {
				self.decisionNode = true;
				self.inCnxStyle.setBack(true);
				self.inCnxStyle.setLeft(true);
				self.inCnxStyle.setRight(true);
				self.outCnxStyle.setBack(true);
				self.outCnxStyle.setLeft(true);
				self.outCnxStyle.setFront(true);
				self.outCnxStyle.setRight(true);
			};
			self.isDecisionNode = function() {
				return self.decisionNode;
			};

			self.setSwitchNode = function() {
				self.inCnxStyle.setBack(true);
				self.outCnxStyle.setFront(true);
			};
			self.isSwitchNode = function() {
				return self.flowType === constants.flowType().SWITCH;
			};

			self.getPreferredInputSide = function() {
				if (self.startNode && self.inCnxStyle.hasFront()) {
					return constants.nodeSide().FRONT;
				}
				if (self.endNode && self.inCnxStyle.hasBack()) {
					return constants.nodeSide().BACK;
				}
				if (self.decisionNode && self.inCnxStyle.hasBack()) {
					return constants.nodeSide().BACK;
				}
				if (self.leftNode) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) { // && self.inCnxStyle.hasRight()) {
						return constants.nodeSide().RIGHT;
					} else if (config.getFlowDirection() === constants.flow().VERTICAL) { // && self.inCnxStyle.hasLeft()) {
						return constants.nodeSide().LEFT;
					}
				} else if (self.rightNode) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) { // && self.inCnxStyle.hasLeft()) {
						return constants.nodeSide().LEFT;
					} else if (config.getFlowDirection() === constants.flow().VERTICAL) { // && self.inCnxStyle.hasRight()) {
						return constants.nodeSide().RIGHT;
					}
				}
				//if (!self.inCnxStyle.hasBack()) {
				//	self.inCnxStyle.setBack(true);
				//}
				//return constants.nodeSide().PROCESS_IN;
				return constants.nodeSide().BACK;
			};

			self.getPreferredOutputSide = function() {
				if (self.startNode && self.outCnxStyle.hasFront()) {
					return constants.nodeSide().FRONT;
				}
				if (self.endNode && self.outCnxStyle.hasBack()) {
					return constants.nodeSide().BACK;
				}
				if (self.decisionNode) {
					return constants.nodeSide().ANY;
				}
				if (self.leftNode) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) { // && self.inCnxStyle.hasRight()) {
						return constants.nodeSide().RIGHT;
					} else if (config.getFlowDirection() === constants.flow().VERTICAL) { // && self.inCnxStyle.hasLeft()) {
						return constants.nodeSide().LEFT;
					}
				} else if (self.rightNode) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) { // && self.inCnxStyle.hasLeft()) {
						return constants.nodeSide().LEFT;
					} else if (config.getFlowDirection() === constants.flow().VERTICAL) { // && self.inCnxStyle.hasRight()) {
						return constants.nodeSide().RIGHT;
					}
				}
				//if (!self.outCnxStyle.hasFront()) {
				//	self.outCnxStyle.setFront(true);
				//}
				//return constants.nodeSide().PROCESS_OUT;
				return constants.nodeSide().FRONT;
			};

			self.getPortLayout = function() {
				return self.flowType === constants.flowType().DECISION ?
					constants.portLayout().ALIGN_CENTER : config.getPortLayout();
			};



///////////////

			self.inputPorts = [];
			self.getInputPorts = function() { return self.inputPorts; };

			self.outputPorts = [];
			self.getOutputPorts = function() { return self.outputPorts; };

			self.markupInPort = undefined;
			self.getMarkupInPort = function() { return self.markupInPort; };
			self.markupInAuxPort = undefined;
			self.getMarkupInAuxPort = function() { return self.markupInAuxPort; };

			//self.markupInputPorts = [];
			//self.getMarkupInputPorts = function() { return self.markupInputPorts; };

			self.markupOutPort = undefined;
			self.getMarkupOutPort = function() { return self.markupOutPort; };
			self.markupOutAuxPort = undefined;
			self.getMarkupOutAuxPort = function() { return self.markupOutAuxPort; };

			self.markupOutputPorts = [];
			self.getMarkupOutputPorts = function() { return self.markupOutputPorts; };

			self.getMarkupPorts = function() {
				var ports = [];
				if (self.markupInPort) { ports.push(self.markupInPort); }
				if (self.markupInAuxPort) { ports.push(self.markupInAuxPort); }
				if (self.markupOutPort) { ports.push(self.markupOutPort); }
				if (self.markupOutAuxPort) { ports.push(self.markupOutAuxPort); }
				if (self.markupOutputPorts.length > 0) {
					ports = ports.concat(self.markupOutputPorts);
				}
				return ports;
			};

			var _refInPorts = [];
			self.getRefInPorts = function() { return _refInPorts; };

			var _refOutPorts = [];
			self.getRefOutPorts = function() { return _refOutPorts; };

			self.getRefPorts = function() {
				var ports = [];
				ports = ports.concat(_refInPorts);
				ports = ports.concat(_refOutPorts);
				return ports;
			};

			var _refLeftPorts = [];
			self.getRefLeftPorts = function() { return _refLeftPorts; };

			var _refRightPorts = [];
			self.getRefRightPorts = function() { return _refRightPorts; };

			var _cnxInPortsMap = new Map(),
				_cnxOutPortsMap = new Map(),
				_refInPortsMap = new Map(),
				_refOutPortsMap = new Map();

			var _frontConnectors = [],
				_backConnectors = [],
				_leftConnectors = [],
				_rightConnectors = [];

			self.getConnectionPorts = function() {
				var ports = [];
				ports = ports.concat(self.inputPorts);
				ports = ports.concat(self.outputPorts);
				return ports;
			};

			// cnxInPorts
			self.getInputCnxPorts = function() {
				var ins = [];
				self.inputPorts.forEach(function(item) {
					if (item.getDirection() === constants.portDirection().IN &&
						item.getType() === constants.portType().LINK_CNX) {
						ins.push(item);
					}
				});
				return ins;
			};
			self.getInputPortsFullNames = function() {
				return getPortsFullNames(self.getInputCnxPorts());
			};
			self.loadCnxInPortsMap = function(portNames) {
				loadPortsMap(_cnxInPortsMap, portNames);
			};
			self.getCnxInPortsMap = function() {
				return _cnxInPortsMap;
			};

			// cnxOutPorts
			self.getOutputCnxPorts = function() {
				var outs = [];
				self.outputPorts.forEach(function(item) {
					if (item.getDirection() === constants.portDirection().OUT &&
						item.getType() === constants.portType().LINK_CNX) {
						outs.push(item);
					}
				});
				return outs;
			};
			self.getOutputPortsFullNames = function() {
				return getPortsFullNames(self.getOutputCnxPorts());
			};
			self.loadCnxOutPortsMap = function(portNames) {
				loadPortsMap(_cnxOutPortsMap, portNames);
			};
			self.getCnxOutPortsMap = function() {
				return _cnxOutPortsMap;
			};

			// refInPorts
			self.getInputRefPorts = function() {
				var refIns = [];
				self.inputPorts.forEach(function(item) {
					if (item.getDirection() === constants.portDirection().IN &&
						item.getType() === constants.portType().LINK_REF) {
						refIns.push(item);
					}
				});
				return refIns;
			};
			self.getRefInPortsFullNames = function() {
				return getPortsFullNames(self.getInputRefPorts());
			};
			self.loadRefInPortsMap = function(portNames) {
				loadPortsMap(_refInPortsMap, portNames);
			};
			self.getRefInPortsMap = function() {
				return _refInPortsMap;
			};

			// refOutPorts
			self.getOutputRefPorts = function() {
				var refOuts = [];
				self.outputPorts.forEach(function(item) {
					if (item.getDirection() === constants.portDirection().OUT &&
						item.getType() === constants.portType().LINK_REF) {
						refOuts.push(item);
					}
				});
				return refOuts;
			};
			self.getRefOutPortsFullNames = function() {
				return getPortsFullNames(self.getOutputRefPorts());
			};
			self.loadRefOutPortsMap = function(portNames) {
				loadPortsMap(_refOutPortsMap, portNames);
			};
			self.getRefOutPortsMap = function() {
				return _refOutPortsMap;
			};

			function getPortsFullNames(ports) {
				var fullNames = [];
				//ports.sort(function(a, b) {
				//	a.getOrder() - b.getOrder();
				//});
				for (var i = 0; i < ports.length; i++) {
					fullNames.push({
						name: ports[i].getDisplayName(),
						label: ports[i].getPortLabel() ? ports[i].getPortLabel() : ""});
				}
				return fullNames;
			}

			function loadPortsMap(portsMap, portNames) {
				//portsMap.clear();
				portNames.forEach(function(item) {
					portsMap.put(item.name, item.label);
				});
			}

			/////
			self.updateInputPortsLabels = function(newNames) {
				updatePortsLabels(self.getInputCnxPorts(), newNames);
			};

			self.updateOutputPortsLabels = function(newNames) {
				updatePortsLabels(self.getOutputCnxPorts(), newNames);
			};

			self.updateRefInPortsLabels = function(newNames) {
				updatePortsLabels(self.getInputRefPorts(), newNames);
			};

			self.updateRefOutPortsLabels = function(newNames) {
				updatePortsLabels(self.getOutputRefPorts(), newNames);
			};

			function updatePortsLabels(ports, newNames) {
				for (var i = 0; i < ports.length; i++) {
					ports[i].setPortLabel(newNames[i].label);
				}
			}

			////
			self.getUnconnectedInputPorts = function() {
				var ports = [];
				for (var i = 0; i < self.inputPorts.length; i++) {
					if (!self.inputPorts[i].hasEdges()) {
						ports.push(self.inputPorts[i]);
					}
				}
				return ports;
			};
			self.getUnconnectedOutputPorts = function() {
				var ports = [];
				for (var i = 0; i < self.outputPorts.length; i++) {
					if (!self.outputPorts[i].hasEdges()) {
						ports.push(self.outputPorts[i]);
					}
				}
				return ports;
			};

			self.getInputEdges = function() {
				var edges = [];
				for (var i = 0; i < self.inputPorts.length; i++) {
					edges = edges.concat(self.inputPorts[i].getEdgesList());
				}
				return edges;
			};
			self.getOutputEdges = function() {
				var edges = [];
				for (var i = 0; i < self.outputPorts.length; i++) {
					edges = edges.concat(self.outputPorts[i].getEdgesList());
				}
				return edges;
			};

			self.getStartSegments = function() {
				var segments = [];
				var edges = self.getOutputEdges();
				for (var i = 0; i < edges.length; i++) {
					if (edges[i].getStartSegment()) {
						segments.push(edges[i].getStartSegment());
					}
				}
				return segments;
			};
			self.getEndSegments = function() {
				var segments = [];
				var edges = self.getInputEdges();
				for (var i = 0; i < edges.length; i++) {
					if (edges[i].getEndSegment()) {
						segments.push(edges[i].getEndSegment());
					}
				}
				return segments;
			};

			//self.getAllUnconnectedInputPorts = function() {
			//	var ports = self.getUnconnectedInputPorts();
			//	var okIn = !self.isDecisionNode() || !self.hasInputConnections();
			//	if (okIn && self.markupInPort) { ports.push(self.markupInPort); }
			//	return ports;
			//};

			//self.getAllUnconnectedOutputPorts = function() {
			//	var ports = self.getUnconnectedOutputPorts();
			//	if (self.markupOutPort) {
			//		ports.push(self.markupOutPort);
			//	} else if (self.markupOutputPorts.length > 0) {
			//		// decision node
			//		var truePort = self.getOutputPortForName(GraphNode.D_TRUE),
			//			falsePort = self.getOutputPortForName(GraphNode.D_FALSE),
			//			trueMarkupPort = self.getMarkupOutPortForName(GraphNode.MARK_D_TRUE),
			//			falseMarkupPort = self.getMarkupOutPortForName(GraphNode.MARK_D_FALSE);
			//		if (!truePort || !truePort.hasEdges()) {
			//			ports.push(trueMarkupPort);
			//		}
			//		if (!falsePort || !falsePort.hasEdges()) {
			//			ports.push(falseMarkupPort);
			//		}
			//	}
			//	return ports;
			//};

			self.getAllPorts = function() {
				var ports = [];
				ports = ports.concat(self.inputPorts);
				ports = ports.concat(self.outputPorts);

				if (self.markupInPort) { ports.push(self.markupInPort); }
				if (self.markupInAuxPort) { ports.push(self.markupInAuxPort); }
				if (self.markupOutPort) { ports.push(self.markupOutPort); }
				if (self.markupOutAuxPort) { ports.push(self.markupOutAuxPort); }
				if (self.markupOutputPorts.length > 0) {
					ports = ports.concat(self.markupOutputPorts);
				}

				ports = ports.concat(_refInPorts);
				ports = ports.concat(_refOutPorts);
				return ports;
			};

			self.getInputConnections = function() {
				var num = 0;
				for (var i = 0; i < self.inputPorts.length; i++) {
					num += self.inputPorts[i].getEdgesList().length;
				}
				return num;
			};

			self.hasInputConnections = function() {
				return self.getInputConnections() > 0;
			};

			self.getOutputConnections = function() {
				var num = 0;
				for (var i = 0; i < self.outputPorts.length; i++) {
					num += self.outputPorts[i].getEdgesList().length;
				}
				return num;
			};

			self.hasOutputConnections = function() {
				return self.getOutputConnections() > 0;
			};

			self.hasConnections = function() {
				return self.hasInputConnections() || self.hasOutputConnections();
			};

			self.setSuppressed = function(b) {
				self.suppressed = b;
				var ports = self.getAllPorts();
				for (var i = 0; i < ports.length; i++) {
					ports[i].setSuppressed(b);
				}
			};

			self.getPortsForSide = function(side) {
				var i, ports = [];
				var cnxPorts = self.getConnectionPorts();
				for (i = 0; i < cnxPorts.length; i++) {
					if ((cnxPorts[i].getSide() & side) > 0) {
						ports.push(cnxPorts[i]);
					}
				}

				//if (side === constants.nodeSide().LEFT) {
				//	console.log("------{{{{{{{{ NODE: "+self.getName()+" getPortsForSide LEFT }}}}}}}");
				//	for (i = 0; i < ports.length; i++) {
				//		console.log("     [[[ "+ports[i].getPath()+", "+ports[i].getOrder()+" ]]]");
				//	}
				//}
				return ports;
			};

			self.getAllPortsForSide = function(side) {
				var i, ports = self.getPortsForSide(side);
				var refPorts = self.getRefPorts();
				for (i = 0; i < refPorts.length; i++) {
					if ((refPorts[i].getSide() & side) > 0) {
						ports.push(refPorts[i]);
					}
				}
				return ports;
			};

			self.getDummyPortsForSide = function(side) {
				var dummies = [],
					sidePorts = self.getPortsForSide(side);
				for (var i = 0; i < sidePorts.length; i++) {
					if (sidePorts[i].getType() === constants.portType().DUMMY) {
						dummies.push(sidePorts[i]);
					}
				}
				return dummies;
			};

			self.getRefPortsForSide = function(side) {
				var i, ports = [];
				var refPorts = self.getRefPorts();
				for (i = 0; i < refPorts.length; i++) {
					if ((refPorts[i].getSide() & side) > 0) {
						ports.push(refPorts[i]);
					}
				}
				return ports;
			};

			self.getConnectorsForSide = function(side) {
				var connectors = [];
				var ports = self.getPortsForSide(side);
				for (var i = 0; i < ports.length; i++) {
					connectors.push(ports[i].getConnector());
				}
				return connectors;
			};

			self.getFrontConnectors = function() {
				return _frontConnectors;
			};
			self.getBackConnectors = function() {
				return _backConnectors;
			};
			self.getRightConnectors = function() {
				return _rightConnectors;
			};
			self.getLeftConnectors = function() {
				return _leftConnectors;
			};

			self.getSideConnectorsNum = function() {
				return self.getRightConnectors().length + self.getLeftConnectors().length;
			};



			self.resetPortsOffsets = function() {
				for (var i = 0; i < self.inputPorts.length; i++) {
					self.inputPorts[i].setOffsetStep(0);
				}
				for (var j = 0; j < self.outputPorts.length; j++) {
					self.outputPorts[j].setOffsetStep(0);
				}
			};

			self.getNumOfInputConnections = function() {
				var numCnx = 0;
				for (var i = 0; i < self.inputPorts.length; i++) {
					numCnx += self.inputPorts[i].getEdgesList().length;
				}
				return numCnx;
			};

			self.getNumOfOutputConnections = function() {
				var numCnx = 0;
				for (var i = 0; i < self.outputPorts.length; i++) {
					numCnx += self.outputPorts[i].getEdgesList().length;
				}
				return numCnx;
			};

			self.getNumOfConnections = function() {
				return self.getNumOfInputConnections() + self.getNumOfOutputConnections();
			};

			self.getInputPortForName = function(name) {
				for (var i = 0; i < self.inputPorts.length; i++) {
					if (self.inputPorts[i].getName() === name) {
						return self.inputPorts[i];
					}
				}
				return null;
			};

			self.getOutputPortForName = function(name) {
				for (var i = 0; i < self.outputPorts.length; i++) {
					if (self.outputPorts[i].getName() === name) {
						return self.outputPorts[i];
					}
				}
				return null;
			};

			self.getMarkupInPortForName = function(name) {
				if (self.markupInPort && self.markupInPort.getName() === name) {
					return self.markupInPort;
				} else if (self.markupInAuxPort && self.markupInAuxPort.getName() === name) {
					return self.markupInAuxPort;
				}
				return null;
			};

			self.getMarkupOutPortForName = function(name) {
				if (self.markupOutPort && self.markupOutPort.getName() === name) {
					return self.markupOutPort;
				} else if (self.markupOutAuxPort && self.markupOutAuxPort.getName() === name) {
					return self.markupOutAuxPort;
				} else {
					for (var i = 0; i < self.markupOutputPorts.length; i++) {
						if (self.markupOutputPorts[i].getName() === name) {
							return self.markupOutputPorts[i];
						}
					}
				}
				return null;
			};

			self.getRefInPortForName = function(name) {
				for (var i = 0; i < _refInPorts.length; i++) {
					if (_refInPorts[i].getName() === name) {
						return _refInPorts[i];
					}
				}
				return null;
			};

			self.getRefOutPortForName = function(name) {
				for (var i = 0; i < _refOutPorts.length; i++) {
					if (_refOutPorts[i].getName() === name) {
						return _refOutPorts[i];
					}
				}
				return null;
			};

			self.sortSideConnectors = function(side) {
				if (side === constants.nodeSide().FRONT) {
					sortConnectors(self.getFrontConnectors());
				} else if (side === constants.nodeSide().BACK) {
					sortConnectors(self.getBackConnectors());
				} else if (side === constants.nodeSide().LEFT ) {
					sortConnectors(self.getLeftConnectors());
				} else if (side === constants.nodeSide().RIGHT) {
					sortConnectors(self.getRightConnectors());
				}
			};

			function sortConnectors(connectors) {
				connectors.sort(function(a, b) {
					return a.getOrder() - b.getOrder();
				});
			}

			self.getSortedConnectors = function(side) {
				//console.log("&&&---&&&---&&&---&&& getSortedConnectors for: "+self.getName()+", side = "+diagramUtils.getNodeSideName(side));
				if (side === constants.nodeSide().FRONT) {
					return getConnectorsSorted(self.getFrontConnectors());
				} else if (side === constants.nodeSide().BACK) {
					return getConnectorsSorted(self.getBackConnectors());
				} else if (side === constants.nodeSide().LEFT ) {
					return getConnectorsSorted(self.getLeftConnectors());
				} else if (side === constants.nodeSide().RIGHT) {
					return getConnectorsSorted(self.getRightConnectors());
				}
				return null;
			};

			function getConnectorsSorted(cnxList)  {
				//var sortedList = cnxList.splice(0);
				var sortedList = cnxList.slice();
				sortedList.sort(function(a, b) {
					return a.getOrder() - b.getOrder();
				});
				return sortedList;
			}

			self.areConnectorsOrdered = function(side) {
				if (side === constants.nodeSide().FRONT) {
					return areOrderedConnections(self.getFrontConnectors());
				} else if (side === constants.nodeSide().BACK) {
					return areOrderedConnections(self.getBackConnectors());
				} else if (side === constants.nodeSide().LEFT ) {
					return areOrderedConnections(self.getLeftConnectors());
				} else if (side === constants.nodeSide().RIGHT) {
					return areOrderedConnections(self.getRightConnectors());
				}
				return false;
			};

			function areOrderedConnections(cnxList) {
				for (var i = 0; i < cnxList.length; i++) {
					if (cnxList[i].getOrder() !== i) {
						return false;
					}
				}
				return true;
			}

			/////////////////
			// create ports
			/////////////////
			self.createInputPort = function(name, side, type) {
				return getOrCreatePort(
					name,
					side,
					constants.portDirection().IN,
					type);
			};

			self.createMarkupInPort = function(side) {
				return getOrCreatePort(
					constants.portNames().MARK_IN_PORT_BASE_NAME,
					side,
					constants.portDirection().MARK_IN);
			};

			self.createMarkupInAuxPort = function(side) {
				return getOrCreatePort(
					constants.portNames().MARK_IN_AUX_PORT_BASE_NAME,
					side,
					constants.portDirection().MARK_IN_AUX);
			};

			self.createRefInPort = function(name, side) {
				return getOrCreatePort(
					name,
					side,
					constants.portDirection().REF_IN);
			};

			self.createMarkupDecisionInPort = function(side) {
				return getOrCreatePort(
					constants.portNames().MARK_D_IN,
					side,
					constants.portDirection().MARK_IN);
			};

			self.createOutputPort = function(name, side, type) {
				return getOrCreatePort(
					name,
					side,
					constants.portDirection().OUT,
					type);
			};

			self.createMarkupOutPort = function(side, markupOrder) {
				//if (!markupOrder || markupOrder < 0) {
				//	alert("createMarkupOutPort needs markupOrder!");
				//}
				return getOrCreatePort(
					undefined, //constants.portNames().MARK_OUT_PORT_BASE_NAME, > needed for SWITCH' multiple ports
					side,
					constants.portDirection().MARK_OUT,
					markupOrder);
			};

			self.createMarkupOutAuxPort = function(side) {
				return getOrCreatePort(
					constants.portNames().MARK_OUT_AUX_PORT_BASE_NAME,
					side,
					constants.portDirection().MARK_OUT_AUX);
			};

			self.createRefOutPort = function(name, side) {
				return getOrCreatePort(
					name,
					side,
					constants.portDirection().REF_OUT);
			};

			self.createMarkupDecisionOutPort = function(name, side) {
				return getOrCreatePort(
					name,
					side,
					constants.portDirection().MARK_OUT);
			};

			function getOrCreatePort(portName, side, direction, type, markupOrder) {
				var port = undefined;
				var cnxName = "";
				if (direction === constants.portDirection().IN) {
					port = self.getInputPortForName(portName);
					if (port) {
						modelUtils.adjustSize(self);
						return port;
					}
					//cnxName = portName && portName.length > 0 ?
					//	portName :
					//	generateNextName(constants.portNames().IN_PORT_BASE_NAME, self.inputPorts);
					if (portName && portName.length > 0) {
						cnxName = portName;
					} else if (type !== constants.portType().DUMMY) {
						cnxName = generateNextName(constants.portNames().IN_PORT_BASE_NAME, self.inputPorts);
					} else {
						cnxName = generateNextName(constants.portNames().DUMMY_IN_PORT_NAME, self.inputPorts);
					}
				} else if (direction === constants.portDirection().OUT) {
					port = self.getOutputPortForName(portName);
					if (port) {
						modelUtils.adjustSize(self);
						return port;
					}
					//cnxName = portName && portName.length > 0 ?
					//	portName :
					//	generateNextName(constants.portNames().OUT_PORT_BASE_NAME, self.outputPorts);
					if (portName && portName.length > 0) {
						cnxName = portName;
					} else if (type !== constants.portType().DUMMY) {
						cnxName = generateNextName(constants.portNames().OUT_PORT_BASE_NAME, self.outputPorts);
					} else {
						cnxName = generateNextName(constants.portNames().DUMMY_OUT_PORT_NAME, self.outputPorts);
					}
				} else if (direction === constants.portDirection().MARK_IN) {
					port = self.getMarkupInPortForName(portName);
					if (port) {
						modelUtils.adjustSize(self);
						return port;
					}
					cnxName = portName && portName.length > 0 ?
						portName : constants.portNames().MARK_IN_PORT_BASE_NAME;
				} else if (direction === constants.portDirection().MARK_IN_AUX) {
					port = self.getMarkupInPortForName(portName);
					if (port) {
						modelUtils.adjustSize(self);
						return port;
					}
					cnxName = portName && portName.length > 0 ?
						portName : constants.portNames().MARK_IN_AUX_PORT_BASE_NAME;
				} else if (direction == constants.portDirection().MARK_OUT) {
					port = self.getMarkupOutPortForName(portName);
					if (port) {
						modelUtils.adjustSize(self);
						return port;
					}
					//cnxName = portName && portName.length > 0 ?
					//	portName : constants.portNames().MARK_OUT_PORT_BASE_NAME;
					if (portName && portName.length > 0) {
						cnxName = portName;
					} else {
						cnxName = generateNextName(constants.portNames().MARK_OUT_PORT_BASE_NAME, self.markupOutputPorts);
					}
				} else if (direction == constants.portDirection().MARK_OUT_AUX) {
					port = self.getMarkupOutPortForName(portName);
					if (port) {
						modelUtils.adjustSize(self);
						return port;
					}
					cnxName = portName && portName.length > 0 ?
						portName : constants.portNames().MARK_OUT_AUX_PORT_BASE_NAME;
				} else if (direction === constants.portDirection().REF_IN) {
					port = self.getRefInPortForName(portName);
					if (port) {
						modelUtils.adjustSize(self);
						return port;
					}
					cnxName = portName;
				} else if (direction == constants.portDirection().REF_OUT) {
					port = self.getRefOutPortForName(portName);
					if (port) {
						modelUtils.adjustSize(self);
						return port;
					}
					cnxName = portName;
				} else {
					//console.log("Cannot create port: invalid direction = "+direction);
					return null;
				}
				// proceed
				var cnx = modelUtils.createConnector(self, cnxName, side, direction);
				if (direction === constants.portDirection().IN) {
					port = new GraphPort(cnx);
					port.setType(type);
					self.inputPorts.push(port);
				} else if (direction === constants.portDirection().OUT) {
					port = new GraphPort(cnx);
					port.setType(type);
					self.outputPorts.push(port);
				} else if (direction === constants.portDirection().MARK_IN) {
					port = new GraphMarkupPort(cnx);
					self.markupInPort = port;
				} else if (direction === constants.portDirection().MARK_IN_AUX) {
					port = new GraphMarkupPort(cnx, true);
					self.markupInAuxPort = port;
				} else if (direction === constants.portDirection().MARK_OUT) {
					port = new GraphMarkupPort(cnx);
					if (self.isDecisionNode()) {
						self.markupOutputPorts.push(port);
					} else if (self.isSwitchNode()) {
						port.setMarkupOrder(markupOrder);
						self.markupOutputPorts.push(port);
					} else {
						self.markupOutPort = port;
					}
				} else if (direction === constants.portDirection().MARK_OUT_AUX) {
					port = new GraphMarkupPort(cnx, true);
					self.markupOutAuxPort = port;
				} else if (direction === constants.portDirection().REF_IN) {
					port = new GraphRefPort(cnx);
					_refInPorts.push(port);
					if (port.getSide() === constants.nodeSide().LEFT) {
						_refLeftPorts.push(port);
					} else if (port.getSide() === constants.nodeSide().RIGHT) {
						_refRightPorts.push(port);
					}
				} else if (direction === constants.portDirection().REF_OUT) {
					port = new GraphRefPort(cnx);
					_refOutPorts.push(port);
					if (port.getSide() === constants.nodeSide().LEFT) {
						_refLeftPorts.push(port);
					} else if (port.getSide() === constants.nodeSide().RIGHT) {
						_refRightPorts.push(port);
					}
				}
				modelUtils.adjustSize(self);
				addPortToSideCollection(port);
				return port;
			}

			function addPortToSideCollection(port) {
				if (port.getDirection() < constants.portDirection().CNX) {
					if (port.getSide() === constants.nodeSide().FRONT) {
						if (!hasConnector(_frontConnectors, port.getConnector())) {
							_frontConnectors.push(port.getConnector());
						}
					} else
					if (port.getSide() === constants.nodeSide().BACK) {
						if (!hasConnector(_backConnectors, port.getConnector())) {
							_backConnectors.push(port.getConnector());
						}
					} else
					if (port.getSide() === constants.nodeSide().LEFT) {
						if (port.getType() === constants.portType().REF) {
							if (hasReferenceConnection(port)) {
								console.log("REF: "+port.getName());
								_leftConnectors.push(port.getConnector());
							}
						} else if (!hasConnector(_leftConnectors, port.getConnector())) {
							_leftConnectors.push(port.getConnector());
						}
					} else
					if (port.getSide() === constants.nodeSide().RIGHT) {
						if (port.getType() === constants.portType().REF) {
							if (hasReferenceConnection(port)) {
								console.log("REF: "+port.getName());
								_rightConnectors.push(port.getConnector());
							}
						} else if (!hasConnector(_rightConnectors, port.getConnector())) {
							_rightConnectors.push(port.getConnector());
						}
					}
				}
			}

			function hasConnector(connectors, cnx) {
				for (var i = 0; i < connectors.length; i++) {
					if (connectors[i].equals(cnx)) {
						return true;
					}
				}
				return false;
			}

			// compare with prefix only
			function hasReferenceConnection(port) {
				return !(port.getName().localeCompare(constants.portNames().REF_IN_PORT_LEFT_NAME) === 0 ||
						port.getName().localeCompare(constants.portNames().REF_IN_PORT_RIGHT_NAME) === 0 ||
						port.getName().localeCompare(constants.portNames().REF_OUT_PORT_LEFT_NAME) === 0 ||
						port.getName().localeCompare(constants.portNames().REF_OUT_PORT_RIGHT_NAME) === 0 ) ;
			}

			//self.generatePortNextName = function(direction) {
			//	var name;
			//	if (direction === constants.portDirection().IN) {
			//		name = generateNextName(constants.portNames().IN_PORT_BASE_NAME, self.inputPorts);
			//	} else if (direction === constants.portDirection().OUT) {
			//		name = generateNextName(constants.portNames().OUT_PORT_BASE_NAME, self.outputPorts);
			//	}
			//	return name;
			//};

			self.generateRefNextName = function(direction, side) {
				var name;
				if (direction === constants.portDirection().IN) {
					if (side === constants.nodeSide().LEFT) {
						name = generateNextName(constants.portNames().REF_IN_PORT_LEFT_NAME, self.inputPorts);
					} else if (side === constants.nodeSide().RIGHT) {
						name = generateNextName(constants.portNames().REF_IN_PORT_RIGHT_NAME, self.inputPorts);
					}
				} else if (direction === constants.portDirection().OUT) {
					if (side === constants.nodeSide().LEFT) {
						name = generateNextName(constants.portNames().REF_OUT_PORT_LEFT_NAME, self.outputPorts);
					} else if (side === constants.nodeSide().RIGHT) {
						name = generateNextName(constants.portNames().REF_OUT_PORT_RIGHT_NAME, self.outputPorts);
					}
				}
				return name;
			};

			function generateNextName(base, ports) {
				var intNames = [];
				var baseLength = base.length;
				for (var i = 0; i < ports.length; i++) {
					var portName = ports[i].getName();
					if (portName.indexOf(base) === 0 && portName.length > baseLength) {
						var suffix = portName.substring(baseLength);
						var intVal = parseInt(suffix);
						if (isNaN(intVal)) {
							continue;
						}
						intNames.push(intVal);
					}
				}
				intNames.sort(function(a,b) { return a-b; } );
				var k = 0;
				while (k < intNames.length) {
					var j = intNames[k];
					if (j !== k) {
						return base.concat(k);
					}
					k++;
				}
				return base.concat(k);
			}

			self.insertDummyPort = function(ports, dummyPort) {
				var i, found,
					direction = dummyPort.getDirection(),
					dummyOrder = dummyPort.getConnector().getOrder(),
					dummyParentName = dummyPort.getDummyParentName();
				for (i = 0; i < ports.length; i++) {
					if (ports[i].getConnector().getOrder() === dummyOrder) {
						if (ports[i].getType() === constants.portType().DUMMY) {
							// found dummy at this position, do not duplicate
							return;
						}
						found = true;
						break;
					}
					if (ports[i].getName() === dummyParentName) {
						var link = ports[i].getEdgesList()[0],
							portDirection = ports[i].getDirection(),
							portOrder = ports[i].getOrder(),
							portShift = portDirection === constants.portDirection().OUT ?
								link.getSourceShift() : link.getTargetShift();
						if (portShift === constants.portShift().UP) {
                			dummyOrder = portOrder--;
						} else if (portShift === constants.portShift().DOWN) {
							dummyOrder = portOrder++;
						}
						found = true;
						break;
					}
				}
				//for (i = 0; i < ports.length; i++) {
				//	if (ports[i].getConnector().getOrder() === dummyOrder) {
				//		if (ports[i].getType() === constants.portType().DUMMY) {
				//			// found dummy at this position, do not duplicate
				//			return;
				//		}
				//		found = true;
				//		break;
				//	}
				//}
				if (direction === constants.portDirection().IN) {
					insertDummyToPorts(self.inputPorts, dummyOrder, dummyPort, found);
				} else if (direction === constants.portDirection().OUT) {
					insertDummyToPorts(self.outputPorts, dummyOrder, dummyPort, found);
				} else if (direction === constants.portDirection().REF_IN) {
					insertDummyToPorts(_refInPorts, dummyOrder, dummyPort, found);
					if (dummyPort.getSide() === constants.nodeSide().LEFT) {
						insertDummyToPorts(_refLeftPorts, dummyOrder, dummyPort, found);
					} else if (dummyPort.getSide() === constants.nodeSide().RIGHT) {
						insertDummyToPorts(_refRightPorts, dummyOrder, dummyPort, found);
					}
				} else if (direction === constants.portDirection().REF_OUT) {
					insertDummyToPorts(_refOutPorts, dummyOrder, dummyPort, found);
					if (dummyPort.getSide() === constants.nodeSide().LEFT) {
						insertDummyToPorts(_refLeftPorts, dummyOrder, dummyPort, found);
					} else if (dummyPort.getSide() === constants.nodeSide().RIGHT) {
						insertDummyToPorts(_refRightPorts, dummyOrder, dummyPort, found);
					}
				}
				modelUtils.adjustSize(self);
			};

			function insertDummyToPorts(ports, order, dummy, found) {
				if (found) {
					ports.splice(order, 0, dummy);
					for (i = order; i < ports.length; i++) {
						ports[i].shiftCnxPortUp(self.getPortStep());
						//console.log("  -- @@ INSERT: "+dummy.getName());
					}
				} else {
					// on the far end
					ports.push(dummy);
					//console.log("  -- @@ APPEND: "+dummy.getName());
				}
			}

			self.equals = function(another) {
				return another && self.getName() === another.getName() && self.flowType === another.flowType;
			};

			var printPorts = function() {
				//noinspection JSUnusedAssignment
				var i = 0, out = "PORTS:\n";
				for (i = 0; i < self.inputPorts.length > 0; i++) {
					out += "IN: "+self.inputPorts[i].print()+"\n";
				}
				for (i = 0; i < self.outputPorts.length > 0; i++) {
					out += "OUT: "+self.outputPorts[i].print()+"\n";
				}
				console.log(out);
			};

			self.print = function() {
				return self.constructor.name + ": "+self.name+", "+self.showBounds()+
					", \n\tflow type="+self.flowType+
					", is left="+self.isLeftLaneNode()+
					", is right="+self.isRightLaneNode()+
					", is start="+self.isStartNode()+
					", is end="+self.isEndNode()+
					", is decision="+self.isDecisionNode()+
					", \n\tlevel="+self.levelNum+", lane="+self.laneNum+
					", port layout="+config.portLayout()+
					", \n\tinStyle="+self.inCnxStyle.print()+", \n\toutStyle="+self.outCnxStyle.print();
			};

			self.print1 = function() {
				return self.constructor.name + ": "+self.name+", "+self.showBounds()+
					", x="+self.x+", y="+self.y+", level="+self.getLevelNumber()+", lane="+self.getLaneNumber();
			};

			self.printShort = function() {
				return self.name+//", "+self.showBounds()+
					//", x="+self.x+", y="+self.y+", level="+self.getLevelNumber()+", lane="+self.getLaneNumber();
					", level="+self.getLevelNumber()+", lane="+self.getLaneNumber();
			};

			self.getEnds = function() { return "NO ENDS"; };
			self.printNode = function() {
				var ports = [], allPorts = self.getConnectionPorts();
				ports.push("\tends = "+self.getEnds());
				for (var i = 0; i < allPorts.length; i++) {
					ports.push("\n\t\t"+allPorts[i].printPort());
				}
				return self.name+", ports:"+ports;
			};

			self.init();

		}
		jsUtils.inherit(GraphNode, GraphElement);
		return GraphNode;
	}
);