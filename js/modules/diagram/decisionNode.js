define('modules/diagram/decisionNode',
	['modules/graph/graphNode',
		'modules/diagram/flowNode',
		'modules/draw/draw',
		'modules/draw/drawUtils',
		'modules/geometry/rectangle',
		'modules/geometry/dimension',
		'modules/graph/graphConstants',
		'modules/diagram/diagramUtils',
		'modules/html/iconLoader',
		'modules/settings/config',
		'modules/gallery/iconOptionsPicker',
		'modules/graph/modelUtils',
		'modules/core/jsUtils'],
	function(GraphNode,
			 FlowNode,
	         draw,
			 drawUtils,
	         Rectangle,
	         Dimension,
	         constants,
			 diagramUtils,
			 loader,
	         config,
	         iconPicker,
			 modelUtils,
	         jsUtils) {
		function DecisionNode(name, input, ends, flowManager) {
			FlowNode.call(this, name, constants.flowType().DECISION, flowManager);

			var self = this;

			//var _input = input ? input : constants.decisionInputs().BACK;
			var _input = constants.decisionInputs().BACK;
			self.getInput = function() { return _input; };
			self.setInput = function(input) { _input = input; };

			var _inputsWidth,
				_trueMarkupPort,
				_falseMarkupPort,
				_ends = ends ? ends : constants.decisionEnds().TRUE_EMPTY_FALSE;
			self.getEnds = function() { return _ends; };
			self.setEnds = function(ends) {
				_ends = ends;
				updateMarkupPortsSides();
			};

			var ARC = 2,
				SHADE = 10;

			////

			self.nodeIconKey = config.getQuizDefIconKey();
			//self.nodeIcon = iconPicker.getIconImage(self.nodeIconKey);
			self.myDefIconKey = config.getFlagDefIconKey();

			////
			var _nodeColor = constants.colors().NODE_D,
				hltColor = constants.colors().NODE_HLT_D,
				selColor = constants.colors().NODE_SEL_D,
				TRUE = constants.portNames().TRUE,
				FALSE = constants.portNames().FALSE;

			var _myBgnColor = config.getDecBgnColor(),
				_useMyBgnColor,
				_myDefBgnColor = config.getDecBgnDefColor(),
				_myFgnColor = config.getDecFgnColor(),
				_useMyFgnColor,
				_myDefFgnColor = config.getDecFgnDefColor(),
				_myTextColor = config.getTextFgnColor();
			////
			self.setBgnColor = function(color) {
				_myBgnColor = color;
				_useMyBgnColor = true;
			};
			self.getBgnColor = function() { return _myBgnColor; };
			self.resetBgnColor = function() {
				_myBgnColor = _myDefBgnColor;
				_useMyBgnColor = false;
			};
			self.getDefBgnColor = function() { return _myDefBgnColor; };
			////
			self.setFgnColor = function(color) {
				_myFgnColor = color;
				_useMyFgnColor = true;
			};
			self.getFgnColor = function() { return _myFgnColor; };
			self.resetFgnColor = function() {
				self.setFgnColor(constants.colors().NODE_FORCOLOR_DRK);
				_useMyFgnColor = false;
			};
			self.getDefFgnColor = function() { return _myDefFgnColor; };


			self.initNode = function() {}; // hide parent
			self.initDecisionNode = function() {
				_myDefBgnColor = _myBgnColor;
				self.setRectSize(config.getGlobalDecisionWidth(), config.getGlobalDecisionHeight());
				if (_input === constants.decisionInputs().BACK) {
					self.createMarkupDecisionInPort(constants.nodeSide().BACK);
				} else if (_input === constants.decisionInputs().LEFT) {
					self.createMarkupDecisionInPort(constants.nodeSide().LEFT);
				} else if (_input === constants.decisionInputs().RIGHT) {
					self.createMarkupDecisionInPort(constants.nodeSide().RIGHT);
				}

				_trueMarkupPort = self.createMarkupDecisionOutPort(GraphNode.MARK_D_TRUE,  constants.nodeSide().FRONT);
				_falseMarkupPort = self.createMarkupDecisionOutPort(GraphNode.MARK_D_FALSE, constants.nodeSide().FRONT);

				// HORIZONTAL: clockwise
				// VERTICAL:   counter clockwise
				updateMarkupPortsSides();
			};

			//////

			self.getTextDefaults = function() {
				return {
					maxWidth: constants.contentDecisionSize().WIDTH,
					maxHeight: constants.contentDecisionSize().HEIGHT,
					maxLines: constants.contentDecisionSize().MAX_LINES,
					extentWidth: constants.contentDecisionViewExt().WIDTH,
					extentHeight: constants.contentDecisionViewExt().HEIGHT
				}
			};

			//////

			// DECISION: to keep the shape orientation:
			// - config...
			// - draw.js
			// - modelUtils.js
			// - flowModel.js !!!
			// - and below...

			// initial size, set on parsing
			self.setDecisionInitialSize = function(w, h) {
				self.calculateContentParams();
				self.setSize(
					w ? w : config.getGlobalDecisionWidth(),
					h ? h : config.getGlobalDecisionHeight());
				if (self.getName() === "D1") {
					//console.log("++ 1 "+self.getName()+": "+w+", "+h+", text: "+box.width+", "+box.height+", cnt size: "+cntSize.width+", "+cntSize.height);
				}

				modelUtils.adjustSize(self);
				if (self.getName() === "D1") {
					//console.log("++ 2 "+self.getName()+": "+self.width+", "+self.height+", text: "+box.width+", "+box.height+", cnt size: "+cntSize.width+", "+cntSize.height);
				}
			};

			//self.setInputBounds = function() {
			//	_inputsWidth = getInPortBarLength(true);
			//};

			//self.getNodeWidth = function() {
			//	return Math.max(self.width, _inputsWidth);
			//};

			self.getEffectiveWidth = function(w, h) {
				return w;
				//return config.getFlowDirection() === constants.flow().VERTICAL ? w : h;
			};

			self.getEffectiveHeight = function(w, h) {
				return h;
				//return config.getFlowDirection() === constants.flow().VERTICAL ? h : w;
			};

			self.setResizeW = function(d) {
				var eWidth = self.getEffectiveWidth(config.getGlobalDecisionWidth(), config.getGlobalDecisionHeight()),
					diffW = self.width - eWidth;
				if (d < 0 && diffW/2 < Math.abs(d)) {
					//_resizeW = 0;
				} else {
					self.resizeW += d;
					self.resizeW = self.resizeW > 0 ? self.resizeW : 0;
				}
			};

			self.setResizeDeltaW = function(d) {
				var eWidth = self.getEffectiveWidth(config.getGlobalDecisionWidth(), config.getGlobalDecisionHeight()),
					diffW = self.width - eWidth;
				if (d < 0 && diffW/2 < Math.abs(d)) {
					//self.resizeW = 0;
				} else {
					self.resizeDeltaW = d;
				}
			};

			self.setResizeH = function(d) {
				var eHeight = self.getEffectiveHeight(config.getGlobalDecisionWidth(), config.getGlobalDecisionHeight()),
					diffH = self.height - eHeight;
				if (d < 0 && diffH/2 < Math.abs(d)) {
					//_resizeH = 0;
				} else {
					self.resizeH += d;
					self.resizeH = self.resizeH > 0 ? self.resizeH : 0;
				}
			};

			self.setResizeDeltaH = function(d) {
				//console.log("--- setResizeH: "+d+", H = "+self.height);
				var eHeight = self.getEffectiveHeight(config.getGlobalDecisionWidth(), config.getGlobalDecisionHeight()),
					diffH = self.height - eHeight;
				if (d < 0 && diffH/2 < Math.abs(d)) {
					//self.resizeH = 0;
				} else {
					self.resizeDeltaH = d;
				}
			};

			self.setResize = function(rW, rH) {
				//console.log("+++ setResize: "+self.resizeW+", "+self.resizeH+", "+rW+", "+rH+", "+self.width+", "+self.height);
				self.setResizeW(rW);
				self.setResizeH(rH);
				var eWidth = self.getEffectiveWidth(config.getGlobalDecisionWidth(), config.getGlobalDecisionHeight()),
					eHeight = self.getEffectiveHeight(config.getGlobalDecisionWidth(), config.getGlobalDecisionHeight()),
					ww = self.width + 2*rW > eWidth ? self.width + 2*rW : eWidth,
					hh = self.height + 2*rH > eHeight ? self.height + 2*rH : eHeight;
				self.setSize(ww, hh);
				//console.log("=== setResize: "+self.resizeW+", "+self.resizeH+", "+rW+", "+rH+", "+self.width+", "+self.height);
			};

			self.resetResize = function() {
				self.resizeW = 0;
				self.resizeH = 0;
				self.setSize(
					self.getEffectiveWidth(config.getGlobalDecisionWidth(), config.getGlobalDecisionHeight()),
					self.getEffectiveHeight(config.getGlobalDecisionWidth(), config.getGlobalDecisionHeight()));
			};

			self.getNodeObject = function() {
				var node = self.getNodeObjectToSave();

				node.width = self.width;
				node.height = self.height;

				return node;
			};

			self.getNodeObjectToSave = function() {
				var node = {};
				node.id = constants.elementType().NODE;
				node.name = self.getName();
				node.hideName = self.isHideName();
				node.iconKey = self.nodeIconKey;
				node.showIcon = self.getShowIcon();
				node.type = self.getFlowType();
				node.levelNum = self.getLevelNumber();
				node.laneNum = self.getLaneNumber();
				node.resizeW = self.getResizeW();
				node.resizeH = self.getResizeH();

				node.containerName = self.containerName;

				if (self.getContentText().length > 0) { node.contentText = self.getContentText(); }
				if (self.getContentTextAbove().length > 0) { node.textAbove = self.getContentTextAbove(); }
				if (self.getContentTextBelow().length > 0) { node.textBelow = self.getContentTextBelow(); }

				if (_ends && _ends !== constants.decisionEnds().UNDEF) {
					node.decisionEnds = _ends;
				} else {
					node.decisionEnds = constants.decisionEnds().TRUE_EMPTY_FALSE;
				}

				// input is only supported for the default BACK !!!
				//if (_input) {
				//	node.decisionInput = _input;
				//} else {
				//	node.decisionInput = constants.decisionInputs().BACK;
				//}
				self.getColorsToSave(node);
				self.getIconKeyToSave(node);
				return node;
			};

			self.getColorsToSave = function(node) {
				if (_useMyBgnColor) {
					node.bgnColor = _myBgnColor;
				} else {
					node.bgnColor = _myDefBgnColor;
				}
				if (_useMyFgnColor) {
					node.fgnColor = _myFgnColor;
				} else {
					node.fgnColor = _myDefFgnColor;
				}
			};


			function updateMarkupPortsSides() {
				var orientation = config.getFlowDirection();
				if (_input === constants.decisionInputs().BACK) {
					updateMarkupSidesForBack(orientation);
				} else if (_input === constants.decisionInputs().LEFT) {
					updateMarkupSidesForLeft(orientation);
				} else if (_input === constants.decisionInputs().RIGHT) {
					updateMarkupSidesForRight(orientation);
				}
			}

			// BACK
			function updateMarkupSidesForBack(orientation) {
				if (_ends === constants.decisionEnds().TRUE_FALSE_EMPTY) {
					_trueMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().RIGHT : constants.nodeSide().LEFT);
					_falseMarkupPort.setSide(constants.nodeSide().FRONT);
				} else if (_ends === constants.decisionEnds().FALSE_TRUE_EMPTY) {
					_trueMarkupPort.setSide(constants.nodeSide().FRONT);
					_falseMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().RIGHT : constants.nodeSide().LEFT);
				} else if (_ends === constants.decisionEnds().TRUE_EMPTY_FALSE) {
					_trueMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().RIGHT : constants.nodeSide().LEFT);
					_falseMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().LEFT : constants.nodeSide().RIGHT);
				} else if (_ends === constants.decisionEnds().FALSE_EMPTY_TRUE) {
					_trueMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().LEFT : constants.nodeSide().RIGHT);
					_falseMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().RIGHT : constants.nodeSide().LEFT);
				} else if (_ends === constants.decisionEnds().EMPTY_TRUE_FALSE) {
					_trueMarkupPort.setSide(constants.nodeSide().FRONT);
					_falseMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().LEFT : constants.nodeSide().RIGHT);
				} else if (_ends === constants.decisionEnds().EMPTY_FALSE_TRUE) {
					_trueMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().LEFT : constants.nodeSide().RIGHT);
					_falseMarkupPort.setSide(constants.nodeSide().FRONT);
				}
			}

			// LEFT - BLOCKED: only BACK
			function updateMarkupSidesForLeft(orientation) {
				if (_ends === constants.decisionEnds().TRUE_FALSE_EMPTY) {
					_trueMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().BACK : constants.nodeSide().FRONT);
					_falseMarkupPort.setSide(constants.nodeSide().RIGHT);
				} else if (_ends === constants.decisionEnds().FALSE_TRUE_EMPTY) {
					_trueMarkupPort.setSide(constants.nodeSide().RIGHT);
					_falseMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().BACK : constants.nodeSide().FRONT);
				} else if (_ends === constants.decisionEnds().TRUE_EMPTY_FALSE) {
					_trueMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().BACK : constants.nodeSide().FRONT);
					_falseMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().FRONT : constants.nodeSide().BACK);
				} else if (_ends === constants.decisionEnds().FALSE_EMPTY_TRUE) {
					_trueMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().FRONT : constants.nodeSide().BACK);
					_falseMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().BACK : constants.nodeSide().FRONT);
				} else if (_ends === constants.decisionEnds().EMPTY_TRUE_FALSE) {
					_trueMarkupPort.setSide(constants.nodeSide().RIGHT);
					_falseMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().FRONT : constants.nodeSide().BACK);
				} else if (_ends === constants.decisionEnds().EMPTY_FALSE_TRUE) {
					_trueMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().FRONT : constants.nodeSide().BACK);
					_falseMarkupPort.setSide(constants.nodeSide().RIGHT);
				}
			}

			// RIGHT - BLOCKED: only BACK
			function updateMarkupSidesForRight(orientation) {
				if (_ends === constants.decisionEnds().TRUE_FALSE_EMPTY) {
					_trueMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().FRONT : constants.nodeSide().BACK);
					_falseMarkupPort.setSide(constants.nodeSide().LEFT);
				} else if (_ends === constants.decisionEnds().FALSE_TRUE_EMPTY) {
					_trueMarkupPort.setSide(constants.nodeSide().LEFT);
					_falseMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().FRONT : constants.nodeSide().BACK);
				} else if (_ends === constants.decisionEnds().TRUE_EMPTY_FALSE) {
					_trueMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().FRONT : constants.nodeSide().BACK);
					_falseMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().BACK : constants.nodeSide().FRONT);
				} else if (_ends === constants.decisionEnds().FALSE_EMPTY_TRUE) {
					_trueMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().BACK : constants.nodeSide().FRONT);
					_falseMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().FRONT : constants.nodeSide().BACK);
				} else if (_ends === constants.decisionEnds().EMPTY_TRUE_FALSE) {
					_trueMarkupPort.setSide(constants.nodeSide().LEFT);
					_falseMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().BACK : constants.nodeSide().FRONT);
				} else if (_ends === constants.decisionEnds().EMPTY_FALSE_TRUE) {
					_trueMarkupPort.setSide(orientation === constants.flow().VERTICAL ?
						constants.nodeSide().BACK : constants.nodeSide().FRONT);
					_falseMarkupPort.setSide(constants.nodeSide().LEFT);
				}
			}

			function updatePortSides() {
				var side;
				var outPorts = self.getOutputPorts();
				for (var i = 0; i < outPorts.length; i++) {
					if (outPorts[i].getName().indexOf(TRUE) > 1) {
						side = diagramUtils.getDecisionTruePortSide(self);
						outPorts[i].setSide(side);
						outPorts[i].updateEdgesSourcePort();
					}
					else if (outPorts[i].getName().indexOf(FALSE) > 1) {
						side = diagramUtils.getDecisionFalsePortSide(self);
						outPorts[i].setSide(side);
						outPorts[i].updateEdgesSourcePort();
					}
				}
			}

			self.modifyEnds = function(){
				if (_ends === constants.decisionEnds().TRUE_FALSE_EMPTY) {
					self.setEnds(constants.decisionEnds().FALSE_TRUE_EMPTY);

				} else if (_ends === constants.decisionEnds().FALSE_TRUE_EMPTY) {
					self.setEnds(constants.decisionEnds().TRUE_EMPTY_FALSE);

				} else if (_ends === constants.decisionEnds().TRUE_EMPTY_FALSE) {
					self.setEnds(constants.decisionEnds().FALSE_EMPTY_TRUE);

				} else if (_ends === constants.decisionEnds().FALSE_EMPTY_TRUE) {
					self.setEnds(constants.decisionEnds().EMPTY_TRUE_FALSE);

				} else if (_ends === constants.decisionEnds().EMPTY_TRUE_FALSE) {
					self.setEnds(constants.decisionEnds().EMPTY_FALSE_TRUE);

				} else if (_ends === constants.decisionEnds().EMPTY_FALSE_TRUE) {
					self.setEnds(constants.decisionEnds().TRUE_FALSE_EMPTY);

				}
				updatePortSides();
				//updateMarkupPortsSides();
			};

			self.editParameters = function(point) {
				// TODO
			};

			self.getNodeBounds = function() {
				var r = self.clone();
				var width = self.getNodeWidth(), height = self.getNodeHeight();
				return new Rectangle(r.x-SHADE, r.y-SHADE, width+2*SHADE, height+2*SHADE);
			};

			self.getInnerShape = function() {
				var r = self.getNodeBounds();
				return diagramUtils.getDiamondCentralRect(r);
			};

			self.containsPoint = function(point) {
				var r = self.getNodeBounds();
				return 	diagramUtils.getDiamondCentralRect(r).hasPointInside(point) ||
						diagramUtils.getDiamondNorthRect(r).hasPointInside(point) ||
						//diagramUtils.getDiamondNorthEastRect(this).hasPointInside(point) ||
						diagramUtils.getDiamondEastRect(r).hasPointInside(point) ||
						//diagramUtils.getDiamondSouthEastRect(this).hasPointInside(point) ||
						diagramUtils.getDiamondSouthRect(r).hasPointInside(point) ||
						//diagramUtils.getDiamondSouthWestRect(this).hasPointInside(point) ||
						diagramUtils.getDiamondWestRect(r).hasPointInside(point); // ||
						//diagramUtils.getDiamondNorthWestRect(this).hasPointInside(point);
			};

			function getMarkupInPortForPoint(pnt) {
				var cnxSides = self.getCnxRestrictions();
				return cnxSides.back ? self.markupInPort : undefined;
			}


			self.setDNDAcceptingPorts = function(originPort, dragPoint) {
				//console.log("********** DECISION: setDNDAcceptingPorts");
				var originDirection = originPort.getDirection(),
					truePort = self.getOutputPortForName(GraphNode.D_TRUE),
					falsePort = self.getOutputPortForName(GraphNode.D_FALSE),
					acceptingPorts = [];
				if (originPort.getType() === constants.portType().LINK_CNX ||
					originPort.getType() === constants.portType().MARKUP ) {
					if (originDirection === constants.portDirection().OUT ||
						originDirection === constants.portDirection().MARK_OUT ||
						originDirection === constants.portDirection().MARK_OUT_AUX) {
						//if (self.getInputPorts().length === 0 && self.markupInPort) {
						//	acceptingPorts.push(self.markupInPort);
						//}
						var inPort = getMarkupInPortForPoint(dragPoint);
						if (inPort) {
							acceptingPorts.push(inPort);
						}
					} else if (originDirection == constants.portDirection().IN ||
						originDirection == constants.portDirection().MARK_IN ||
						originDirection === constants.portDirection().MARK_IN_AUX) {
						if (_trueMarkupPort && !truePort) {
							acceptingPorts.push(_trueMarkupPort);
						}
						if (_falseMarkupPort && !falsePort) {
							acceptingPorts.push(_falseMarkupPort);
						}
					}
				}
				for (var i = 0; i < acceptingPorts.length; i++) {
					var port = acceptingPorts[i];
					port.setDNDMode(constants.dndMode().DESTINATION);
					port.setVisible(true);
				}
			};

			self.getAcceptingPortForPoint = function(originPort, dragPoint) {
				//console.log("********** DECISION: getAcceptingPortForPoint");
				var originDirection = originPort.getDirection(),
					truePort = self.getOutputPortForName(GraphNode.D_TRUE),
					falsePort = self.getOutputPortForName(GraphNode.D_FALSE),
					acceptingPorts = [];
				self.locateMarkupPorts(dragPoint);
				if (originDirection === constants.portDirection().OUT ||
					originDirection === constants.portDirection().MARK_OUT ||
					originDirection === constants.portDirection().MARK_OUT_AUX ||
					originDirection === constants.portDirection().REF_OUT) {
					//if (self.getInputPorts().length === 0 && self.markupInPort) {
					//	acceptingPorts.push(self.markupInPort);
					//}
					var inPort = getMarkupInPortForPoint(dragPoint);
					if (inPort) {
						acceptingPorts.push(inPort);
					}
				} else if (originDirection === constants.portDirection().IN ||
					originDirection === constants.portDirection().MARK_IN ||
					originDirection === constants.portDirection().MARK_IN_AUX ||
					originDirection === constants.portDirection().REF_IN) {
					if (_trueMarkupPort && !truePort) {
						acceptingPorts.push(_trueMarkupPort);
					}
					if (_falseMarkupPort && !falsePort) {
						acceptingPorts.push(_falseMarkupPort);
					}
				}
				for (var i = 0; i < acceptingPorts.length; i++) {
					var port = acceptingPorts[i];
					if (port.getDNDShape().hasPointInside(dragPoint)) {
						return port;
					}
				}
				return undefined;
			};


			self.locateMarkupPorts = function(pnt) {
				var width = self.width, //getNodeWidth(),
					height = self.height, //getNodeHeight(),
					orientation = config.getFlowDirection();

				if (_input === constants.decisionInputs().BACK) {
					var isVertical = config.getFlowDirection() === constants.flow().VERTICAL,
						backShift = getInMarkupBackShift(pnt),
						sOut = 8;
					if (isVertical) {
						self.markupInPort.getConnector().moveToXY(backShift, -sOut);
					} else {
						self.markupInPort.getConnector().moveToXY(-sOut, backShift);
					}
					////
					locateMarkupPortsForBack(width, height, orientation);
				} else if (_input === constants.decisionInputs().LEFT) {
					// most likely obsolete
					if (config.getFlowDirection() === constants.flow().VERTICAL) {
						self.markupInPort.getConnector().moveToXY(width, height/2);
					} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						self.markupInPort.getConnector().moveToXY(width/2, 0);
					}
					locateMarkupPortsForLeft(width, height, orientation);
				} else if (_input === constants.decisionInputs().RIGHT) {
					// most likely obsolete
					if (config.getFlowDirection() === constants.flow().VERTICAL) {
						self.markupInPort.getConnector().moveToXY(0, height/2);
					} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						self.markupInPort.getConnector().moveToXY(width/2, height);
					}
					locateMarkupPortsForRight(width, height, orientation);
				}
			};

			function getInMarkupBackShift(pnt) {
				var step = getInMarkupStep(),
					side = getInMarkupNodeSide(pnt);
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					return self.width/2 + (side === constants.nodeSide().RIGHT ? -step : step);
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					return self.height/2 + (side === constants.nodeSide().LEFT ? -step : step);
				}
			}

			function getInMarkupNodeSide(pnt) {
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					return self.x + self.width/2 > pnt.x ? constants.nodeSide().RIGHT : constants.nodeSide().LEFT;
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					return self.y + self.height/2 > pnt.y ? constants.nodeSide().LEFT : constants.nodeSide().RIGHT;
				}
			}

			function getInMarkupStep() {
				var idx = self.getPortsForSide(constants.nodeSide().BACK).length,
					step = constants.portStep().MIN;
				if (idx === 0) { return 0; }
				else { return step + Math.floor((idx-1)*step/2); }
			}

			function getInPortBarLength(hasMarkup) {
				var idx = self.getPortsForSide(constants.nodeSide().BACK).length,
					step = constants.portStep().MIN;
				if (idx === 0) { return 0; }
				else { return (hasMarkup ? step : 0) + Math.floor((idx-1)*step/2); }
			}

			// BACK
			function locateMarkupPortsForBack (width, height, orientation) {
				var sOut = 6;
				if (_ends === constants.decisionEnds().TRUE_FALSE_EMPTY) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(-sOut, height/2);
						_falseMarkupPort.getConnector().moveToXY(width/2, height+sOut);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, -sOut);
						_falseMarkupPort.getConnector().moveToXY(width+sOut, height/2);
					}
				} else if (_ends === constants.decisionEnds().FALSE_TRUE_EMPTY) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, height+sOut);
						_falseMarkupPort.getConnector().moveToXY(-sOut, height/2);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width+sOut, height/2);
						_falseMarkupPort.getConnector().moveToXY(width/2, -sOut);
					}
				} else if (_ends === constants.decisionEnds().TRUE_EMPTY_FALSE) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(-sOut, height/2);
						_falseMarkupPort.getConnector().moveToXY(width+sOut, height/2);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, -sOut);
						_falseMarkupPort.getConnector().moveToXY(width/2, height+sOut);
					}
				} else if (_ends === constants.decisionEnds().FALSE_EMPTY_TRUE) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width+sOut, height/2);
						_falseMarkupPort.getConnector().moveToXY(-sOut, height/2);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, height+sOut);
						_falseMarkupPort.getConnector().moveToXY(width/2, -sOut);
					}
				} else if (_ends === constants.decisionEnds().EMPTY_TRUE_FALSE) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, height+sOut);
						_falseMarkupPort.getConnector().moveToXY(width+sOut, height/2);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width+sOut, height/2);
						_falseMarkupPort.getConnector().moveToXY(width/2, height+sOut);
					}
				} else if (_ends === constants.decisionEnds().EMPTY_FALSE_TRUE) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width+sOut, height/2);
						_falseMarkupPort.getConnector().moveToXY(width/2, height+sOut);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, height+sOut);
						_falseMarkupPort.getConnector().moveToXY(width+sOut, height/2);
					}
				}
			}
			// LEFT - BLOCKED
			//			 HORIZONTAL			 VERTICAL
			// BACK		0, height/2			width/2, 0
			// LEFT		width/2, 0			width, height/2
			// FRONT	width, height/2		width/2, height
			// RIGHT	width/2, height		0, height/2
			function locateMarkupPortsForLeft (width, height, orientation) {
				if (_ends === constants.decisionEnds().TRUE_FALSE_EMPTY) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, 0);
						_falseMarkupPort.getConnector().moveToXY(0, height/2);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width, height/2);
						_falseMarkupPort.getConnector().moveToXY(width/2, height);
					}
				} else if (_ends === constants.decisionEnds().FALSE_TRUE_EMPTY) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(0, height/2);
						_falseMarkupPort.getConnector().moveToXY(width/2, 0);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, height);
						_falseMarkupPort.getConnector().moveToXY(width, height/2);
					}
				} else if (_ends === constants.decisionEnds().TRUE_EMPTY_FALSE) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, 0);
						_falseMarkupPort.getConnector().moveToXY(width/2, height);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width, height/2);
						_falseMarkupPort.getConnector().moveToXY(0, height/2);
					}
				} else if (_ends === constants.decisionEnds().FALSE_EMPTY_TRUE) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, height);
						_falseMarkupPort.getConnector().moveToXY(width/2, 0);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(0, height/2);
						_falseMarkupPort.getConnector().moveToXY(width, height/2);
					}
				} else if (_ends === constants.decisionEnds().EMPTY_TRUE_FALSE) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(0, height/2);
						_falseMarkupPort.getConnector().moveToXY(width/2, height);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, height);
						_falseMarkupPort.getConnector().moveToXY(0, height/2);
					}
				} else if (_ends === constants.decisionEnds().EMPTY_FALSE_TRUE) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, height);
						_falseMarkupPort.getConnector().moveToXY(0, height/2);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(0, height/2);
						_falseMarkupPort.getConnector().moveToXY(width/2, height);
					}
				}
			}
			// RIGHT - BLOCKED
			//			 HORIZONTAL			 VERTICAL
			// BACK		0, height/2			width/2, 0
			// LEFT		width/2, 0			width, height/2
			// FRONT	width, height/2		width/2, height
			// RIGHT	width/2, height		0, height/2
			function locateMarkupPortsForRight (width, height, orientation) {
				if (_ends === constants.decisionEnds().TRUE_FALSE_EMPTY) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, height);
						_falseMarkupPort.getConnector().moveToXY(width, height/2);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(0, height/2);
						_falseMarkupPort.getConnector().moveToXY(width/2, 0);
					}
				} else if (_ends === constants.decisionEnds().FALSE_TRUE_EMPTY) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width, height/2);
						_falseMarkupPort.getConnector().moveToXY(width/2, height);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, 0);
						_falseMarkupPort.getConnector().moveToXY(0, height/2);
					}
				} else if (_ends === constants.decisionEnds().TRUE_EMPTY_FALSE) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, height);
						_falseMarkupPort.getConnector().moveToXY(width/2, 0);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(0, height/2);
						_falseMarkupPort.getConnector().moveToXY(width, height/2);
					}
				} else if (_ends === constants.decisionEnds().FALSE_EMPTY_TRUE) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, 0);
						_falseMarkupPort.getConnector().moveToXY(width/2, height);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width, height/2);
						_falseMarkupPort.getConnector().moveToXY(0, height/2);
					}
				} else if (_ends === constants.decisionEnds().EMPTY_TRUE_FALSE) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width, height/2);
						_falseMarkupPort.getConnector().moveToXY(width/2, 0);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, 0);
						_falseMarkupPort.getConnector().moveToXY(0, height/2);
					}
				} else if (_ends === constants.decisionEnds().EMPTY_FALSE_TRUE) {
					if (orientation === constants.flow().VERTICAL) {
						_trueMarkupPort.getConnector().moveToXY(width/2, 0);
						_falseMarkupPort.getConnector().moveToXY(width, height/2);
					} else if (orientation === constants.flow().HORIZONTAL) {
						_trueMarkupPort.getConnector().moveToXY(width, height/2);
						_falseMarkupPort.getConnector().moveToXY(width/2, 0);
					}
				}
			}

			self.showMarkupPorts = function(b) {
				if (!config.isEditMode()) {
					if (self.markupInPort) { self.markupInPort.setVisible(false); }
					if (_trueMarkupPort) { _trueMarkupPort.setVisible(false); }
					if (_falseMarkupPort) { _falseMarkupPort.setVisible(false); }
					return;
				}
				if (self.markupInPort) {
					//self.markupInPort.setVisible(b && self.getInputConnections() === 0);
					self.markupInPort.setVisible(b);
				}
				var truePort = self.getOutputPortForName(GraphNode.D_TRUE),
					falsePort = self.getOutputPortForName(GraphNode.D_FALSE);
				if (_trueMarkupPort) {
					_trueMarkupPort.setVisible(b && !truePort);
				}
				if (_falseMarkupPort) {
					_falseMarkupPort.setVisible(b && !falsePort);
				}
			};

			self.isMarkupPortValid = function(port) {
				if (self.markupInPort && self.markupInPort.equals(port)) {
					//return self.getInputConnections() === 0;
					return true;
				}
				var truePort = self.getOutputPortForName(GraphNode.D_TRUE),
					falsePort = self.getOutputPortForName(GraphNode.D_FALSE);
				if (_trueMarkupPort && _trueMarkupPort.equals(port)) {
					return !truePort;
				}
				if (_falseMarkupPort && _falseMarkupPort.equals(port)) {
					return !falsePort;
				}
				return true;
			};

			self.resetDNDFlags = function() {
				var ports = self.getAllPorts();
				for (var i = 0; i < ports.length; i++) {
					ports[i].setDNDMode(constants.dndMode().NONE);
				}
			};

			self.drawGraphics = function(ctx) {
				if (!self.isVisible()) {
					return;
				}
				ctx.lineWidth = 2;
				ctx.setLineDash([0,0]);
				var outlineColor = _nodeColor;
				if (self.isHighlighted()) {
					outlineColor = hltColor;
				}
				if (self.isSelected()) {
					outlineColor = selColor;
				}
				ctx.strokeStyle = outlineColor;
				//ctx.font = "12px Arial";
				ctx.font = constants.font().TEXT;

				//ctx.fillStyle = constants.colors().NODE_BGNCOLOR; //'#c9dec1';
				ctx.fillStyle = _myBgnColor;
				draw.decisionPolygon(ctx, self.x, self.y, self.width, self.height, ARC);

				var hOff = Math.floor(self.height/10);

				if (!drawContent(ctx)) {
					if (!self.isHideName() && !config.hasHideNodeNames()) {
						self.drawName(ctx, self.width-16, null, _myFgnColor);
					}
				}
				if (self.isShowIcon() || config.hasShowNodeIcons()) {
					ctx.drawImage(self.nodeIcon, self.x+self.width/2-6, self.y+hOff);
				}

				drawPorts(ctx, outlineColor);
				drawPortsText(ctx);
				self.drawTextAbove(ctx, 12);
				self.drawTextBelow(ctx, 12);

				if (self.getDrawState() === constants.drawState().RESIZED) {
					draw.selectedNodeFrame(
						ctx, self.x, self.y, self.width, self.height, self.getResizeDeltaW(), self.getResizeDeltaH(),
						config.getSelectFrameColor(), self);
				}
				//draw.paintRectangle(ctx, diagramUtils.getDiamondNorthRect(this), constants.colors().NODE_BGNCOLOR, selColor,1);
				//draw.paintRectangle(ctx, diagramUtils.getDiamondEastRect(this), constants.colors().NODE_BGNCOLOR, selColor,1);
				//draw.paintRectangle(ctx, diagramUtils.getDiamondSouthRect(this), constants.colors().NODE_BGNCOLOR, selColor,1);
				//draw.paintRectangle(ctx, diagramUtils.getDiamondWestRect(this), constants.colors().NODE_BGNCOLOR, selColor,1);
				//draw.paintRectangle(ctx, diagramUtils.getDiamondCentralRect(this), constants.colors().NODE_BGNCOLOR, selColor,1);
			};

			function drawContent(ctx) {
				//console.log("+++ drawContent NODE: "+self.getName()+", "+self.getContentText());
				//var cntSize = self.getContentDecisionSize();
				var cntSize = self.getContentSize();
				if (!cntSize.isNull()) {
					var x, y,
						//textDms = self.getTextDecisionRectangle(),
						textDms = self.getTextRectangle(),
						cntW = textDms.width,
						cntH = textDms.height,
						//cvExt = constants.contentDecisionViewExt().WIDTH,
						fontHeight = constants.font().HEIGHT, //self.getFontHeight(ctx),
						leading = constants.textLeading().HEIGHT;
					x = self.x + Math.floor((self.width - cntW)/2);
					y = self.y + Math.floor((self.height - cntH)/2);
					ctx.fillStyle = _myFgnColor;
					//var lines = self.getContentDecisionArray();
					var lines = self.getContentArray();
					if (config.hasShowTitleOnContent()) {
						//var name = drawUtils.getTextTruncated(self.getName(), ctx, constants.contentDecisionSize().WIDTH/2);
						//lines.splice(0, 0, ");
					}
					for (var i = 0; i < lines.length; i++) {
						var line = lines[i],
							lineLen = Math.floor(ctx.measureText(line).width),
							vX = x + Math.floor((cntW - lineLen)/2),
							vY = y + fontHeight -2 + (fontHeight + leading) * i;
						ctx.fillText(line, vX, vY);
						if (i == 0) {
							//ctx.strokeRect(vX, vY-fontHeight, lineLen, fontHeight + leading);
							self.nameRect.setRectBounds(vX, vY-fontHeight, lineLen, fontHeight + leading);
						}
					}

					return true;
				}
				return false;
			}

			//function drawName(ctx) {
			//	var name = self.getName();
			//	ctx.fillStyle = 'blue';
			//	ctx.font = "12px Arial";
			//	var tw = ctx.measureText(name).width;
			//	var th = 5; // half of font height
			//	var thPos = config.getFlowDirection() === constants.flow().HORIZONTAL ?
			//		Math.floor(constants.portStep().MIN * 1.5) : Math.floor(constants.portStep().MIN * 1.2);
			//	var width = self.getNodeWidth(), height = self.getNodeHeight();
			//	var tx = Math.round(self.x + Math.floor(width/2) - Math.floor(tw/2));
			//	//var ty = Math.round(self.y + Math.floor(height/2) + Math.floor(th/2));
			//	var ty = Math.round(self.y +thPos + Math.floor(th/2));
			//	ctx.fillText(name, tx, ty);
			//}

			function drawPorts(ctx, outlineColor) {
				ctx.save();
				var i, len, off = 2,
					inPorts = self.getInputPorts();
				for (i = 0; i < inPorts.length; i++) {
					inPorts[i].drawPort(ctx);
					len = getInPortBarLength(false);
					if (config.getFlowDirection() === constants.flow().VERTICAL) {
						draw.drawLine(ctx, outlineColor, 2,
							self.x + self.width/2 - len - off,
							self.y,
							self.x + self.width/2 + len + off,
							self.y);
					} else {
						draw.drawLine(ctx, outlineColor, 2,
							self.x,
							self.y + self.height/2 - len - off,
							self.x,
							self.y + self.height/2 + len + off);
					}
				}
				var outPorts = self.getOutputPorts();
				for (i = 0; i < outPorts.length; i++) {
					outPorts[i].drawPort(ctx);
				}
				if (self.markupInPort && self.markupInPort.isVisible()) {
					self.markupInPort.drawPort(ctx);
					len = getInPortBarLength(true);
					if (config.getFlowDirection() === constants.flow().VERTICAL) {
						draw.drawLine(ctx, outlineColor, 2,
							self.x + self.width/2 - len,
							self.y,
							self.x + self.width/2 + len,
							self.y);
					} else {
						draw.drawLine(ctx, outlineColor, 2,
							self.x,
							self.y + self.height/2 - len,
							self.x,
							self.y + self.height/2 + len);
					}
				}
				if (self.markupOutPort) {
					self.markupOutPort.drawPort(ctx);
				}
				var trueMarkupPort = self.getMarkupOutPortForName(GraphNode.MARK_D_TRUE),
					falseMarkupPort = self.getMarkupOutPortForName(GraphNode.MARK_D_FALSE);
				if (trueMarkupPort) {
					trueMarkupPort.drawPort(ctx);
				}
				if (falseMarkupPort) {
					falseMarkupPort.drawPort(ctx);
				}
				ctx.restore();
			}

			function drawPortsText(ctx) {
				var width = self.getNodeWidth(),
					height = self.getNodeHeight(),
					dX = 4, dY = 6,
					tX = self.x, tY = self.y+dY, tW = ctx.measureText(TRUE).width,   // TRUE/YES
					fX = self.x, fY = self.y+dY, fW = ctx.measureText(FALSE).width,  // FALSE/NO
					orientation = config.getFlowDirection();
				if (_ends === constants.decisionEnds().TRUE_FALSE_EMPTY) {		// 1
					if (orientation === constants.flow().VERTICAL) {
						if (_input === constants.decisionInputs().BACK) {
							tX -= tW - dX; tY += height/2 + dY;
							fX += width/2 + dX; fY += height;
						} else if (_input === constants.decisionInputs().LEFT) {
							tX += width/2 + dX; tY -= dY;
							fX -= fW - dX; fY += height/2 + dY;
						} else if (_input === constants.decisionInputs().RIGHT) {
							tX += width/2 + dX; tY += height;
							fX += width; fY += height/2 + dY;
						}
						//tX -= tW - dX; tY += height/2 + dY;
						//fX += width/2 + dX; fY += height;
					} else if (orientation === constants.flow().HORIZONTAL) {
						if (_input === constants.decisionInputs().BACK) {
							tX += width/2 + dX; tY -= dY;
							fX += width; fY += height/2 + dY;
						} else if (_input === constants.decisionInputs().LEFT) {
							tX += width; tY += height/2 + dY;
							fX += width/2 + dX; fY += height;
						} else if (_input === constants.decisionInputs().RIGHT) {
							tX -= tW - dX; tY += height/2 + dY;
							fX += width/2 + dX; fY -= dY;
						}
						//tX += width/2 + dX; tY -= dY;
						//fX += width; fY += height/2 + dY;
					}
				} else if (_ends === constants.decisionEnds().FALSE_TRUE_EMPTY) {    // 2
					if (orientation === constants.flow().VERTICAL) {
						if (_input === constants.decisionInputs().BACK) {
							tX += width/2 + dX; tY += height;
							fX -= fW - dX; fY += height/2 + dY;
						} else if (_input === constants.decisionInputs().LEFT) {
							tX -= tW - dX; tY += height/2 + dY;
							fX += width/2 + dX; fY -= dY;
						} else if (_input === constants.decisionInputs().RIGHT) {
							tX += width; tY += height/2 + dY;
							fX += width/2 + dX; fY += height;
						}
						//tX += width/2 + dX; tY += height;
						//fX -= fW - dX; fY += height/2 + dY;
					} else if (orientation === constants.flow().HORIZONTAL) {
						if (_input === constants.decisionInputs().BACK) {
							tX += width; tY += height/2 + dY;
							fX += width/2 + dX; fY -= dY;
						} else if (_input === constants.decisionInputs().LEFT) {
							tX += width/2 + dX; tY += height;
							fX += width; fY += height/2 + dY;
						} else if (_input === constants.decisionInputs().RIGHT) {
							tX += width/2 + dX; tY -= dY;
							fX -= fW - dX; fY += height/2 + dY;
						}
						//tX += width; tY += height/2 + dY;
						//fX += width/2 + dX; fY -= dY;
					}
				} else if (_ends === constants.decisionEnds().TRUE_EMPTY_FALSE) {   // 3
					if (orientation === constants.flow().VERTICAL) {
						if (_input === constants.decisionInputs().BACK) {
							tX -= tW - dX; tY += height/2 + dY;
							fX += width; fY += height/2 + dY;
						} else if (_input === constants.decisionInputs().LEFT) {
							tX += width/2 + dX; tY -= dY;
							fX += width/2 + dX; fY += height;
						} else if (_input === constants.decisionInputs().RIGHT) {
							tX += width/2 + dX; tY += height;
							fX += width/2 + dX; fY -= dY;
						}
						//tX -= tW - dX; tY += height/2 + dY;
						//fX += width; fY += height/2 + dY;
					} else if (orientation === constants.flow().HORIZONTAL) {
						if (_input === constants.decisionInputs().BACK) {
							tX += width/2 + dX; tY -= dY;
							fX += width/2 + dX; fY += height;
						} else if (_input === constants.decisionInputs().LEFT) {
							tX += width; tY += height/2 + dY;
							fX -= fW - dX; fY += height/2 + dY;
						} else if (_input === constants.decisionInputs().RIGHT) {
							tX -= tW - dX; tY += height/2 + dY;
							fX += width; fY += height/2 + dY;
						}
						//tX += width/2 + dX; tY -= dY;
						//fX += width/2 + dX; fY += height;
					}
				} else if (_ends === constants.decisionEnds().FALSE_EMPTY_TRUE) {  // 4
					if (orientation === constants.flow().VERTICAL) {
						if (_input === constants.decisionInputs().BACK) {
							tX += width; tY += height/2 + dY;
							fX -= fW - dX; fY += height/2 + dY;
						} else if (_input === constants.decisionInputs().LEFT) {
							tX += width/2 + dX; tY += height;
							fX += width/2 + dX; fY -= dY;
						} else if (_input === constants.decisionInputs().RIGHT) {
							tX += width/2 + dX; tY -= dY;
							fX += width/2 + dX; fY += height;
						}
						//tX += width; tY += height/2 + dY;
						//fX -= fW - dX; fY += height/2 + dY;
					} else if (orientation === constants.flow().HORIZONTAL) {
						if (_input === constants.decisionInputs().BACK) {
							tX += width/2 + dX; tY += height;
							fX += width/2 + dX; fY -= dY;
						} else if (_input === constants.decisionInputs().LEFT) {
							tX -= tW - dX; tY += height/2 + dY;
							fX += width; fY += height/2 + dY;
						} else if (_input === constants.decisionInputs().RIGHT) {
							tX += width; tY += height/2 + dY;
							fX -= fW - dX; fY += height/2 + dY;
						}
						//tX += width/2 + dX; tY += height;
						//fX += width/2 + dX; fY -= dY;
					}
				} else if (_ends === constants.decisionEnds().EMPTY_TRUE_FALSE) {    // 5
					if (orientation === constants.flow().VERTICAL) {
						if (_input === constants.decisionInputs().BACK) {
							tX += width/2 + dX; tY += height;
							fX += width; fY += height/2 + dY;
						} else if (_input === constants.decisionInputs().LEFT) {
							tX -= tW - dX; tY += height/2 + dY;
							fX += width/2 + dX; fY += height;
						} else if (_input === constants.decisionInputs().RIGHT) {
							tX += width; tY += height/2 + dY;
							fX += width/2 + dX; fY -= dY;
						}
						//tX += width/2 + dX; tY += height;
						//fX += width; fY += height/2 + dY;
					} else if (orientation === constants.flow().HORIZONTAL) {
						if (_input === constants.decisionInputs().BACK) {
							tX += width; tY += height/2 + dY;
							fX += width/2 + dX; fY += height;
						} else if (_input === constants.decisionInputs().LEFT) {
							tX += width/2 + dX; tY += height;
							fX -= fW - dX; fY += height/2 + dY;
						} else if (_input === constants.decisionInputs().RIGHT) {
							tX += width/2 + dX; tY -= dY;
							fX += width; fY += height/2 + dY;
						}
						//tX += width; tY += height/2 + dY;
						//fX += width/2 + dX; fY += height;
					}
				} else if (_ends === constants.decisionEnds().EMPTY_FALSE_TRUE) {   // 6
					if (orientation === constants.flow().VERTICAL) {
						if (_input === constants.decisionInputs().BACK) {
							tX += width; tY += height/2 + dY;
							fX += width/2 + dX; fY += height;
						} else if (_input === constants.decisionInputs().LEFT) {
							tX += width/2 + dX; tY += height;
							fX -= fW - dX; fY += height/2 + dY;
						} else if (_input === constants.decisionInputs().RIGHT) {
							tX += width/2 + dX; tY -= dY;
							fX += width; fY += height/2 + dY;
						}
						//tX += width; tY += height/2 + dY;
						//fX += width/2 + dX; fY += height;
					} else if (orientation === constants.flow().HORIZONTAL) {
						if (_input === constants.decisionInputs().BACK) {
							tX += width/2 + dX; tY += height;
							fX += width; fY += height/2 + dY;
						} else if (_input === constants.decisionInputs().LEFT) {
							tX -= tW - dX; tY += height/2 + dY;
							fX += width/2 + dX; fY += height;
						} else if (_input === constants.decisionInputs().RIGHT) {
							tX += width; tY += height/2 + dY;
							fX += width/2 + dX; fY -= dY;
						}
						//tX += width/2 + dX; tY += height;
						//fX += width; fY += height/2 + dY;
					}
				}
				//console.log("####### drawPortsText, ends = "+_ends);
				ctx.font = "10px Arial";
				//ctx.fillStile = constants.colors().NODE_D_ENDS;
				ctx.fillStyle = _myTextColor;
				if (showTrueText()) {
					ctx.fillText(TRUE, tX, tY);
				}
				if (showFalseText()) {
					ctx.fillText(FALSE, fX, fY);
				}
			}

			function showTrueText() {
				var draggedMarkup = _trueMarkupPort && _trueMarkupPort.isHighlighted(),
					truePort = self.getOutputPortForName(GraphNode.D_TRUE);
				return truePort || self.isHighlighted() || draggedMarkup;
			}
			function showFalseText() {
				var draggedMarkup = _falseMarkupPort && _falseMarkupPort.isHighlighted(),
					falsePort = self.getOutputPortForName(GraphNode.D_FALSE);
				return falsePort || self.isHighlighted() || draggedMarkup;
			}

			self.initDecisionNode();

		}
		jsUtils.inherit(DecisionNode, FlowNode);
		return DecisionNode;
	}
);