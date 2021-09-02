define('modules/diagram/flowNode',
	['modules/graph/graphNode',
		'modules/draw/draw',
		'modules/draw/drawUtils',
		'modules/geometry/rectangle',
		'modules/geometry/point',
		'modules/graph/graphConstants',
		'modules/graph/modelUtils',
		'modules/diagram/diagramUtils',
		'modules/flow/flowUtils',
		'modules/settings/config',
		'modules/html/iconLoader',
		'modules/gallery/iconOptionsPicker',
		'modules/core/jsUtils'],
	function(GraphNode,
	         draw,
			 drawUtils,
	         Rectangle,
	         Point,
	         constants,
			 modelUtils,
			 diagramUtils,
			 flowUtils,
	         config,
			 loader,
			 iconPicker,
	         jsUtils) {
		function FlowNode(name, flowType, flowManager) {
			GraphNode.call(this, name, flowType);

			var self = this,
				_flowManager = flowManager;

			var NAME_LENGTH = 10, //self.width,
				ARC_COMMON = 2,
				ARC_TERM = 12,
				_ARC = flowType === constants.flowType().START || flowType === constants.flowType().END ?
					ARC_TERM : ARC_COMMON,
				_SKEW = 4,
				_SHADE = constants.nodeSurface().SHADE,
				_FRAME = constants.nodeSurface().FRAME;

			var nColor = constants.colors().NODE,
				hltColor = constants.colors().NODE_HLT,
				selColor = constants.colors().NODE_SEL,
				tooltip,
				nameTooltip,
				_drawState = constants.drawState().NONE;

			// use in subclasses
			self.nodeIconKey = config.getFlowIconKey();
			if (self.getNodeCategory() === constants.nodeCategory().FLAG) {
				self.nodeIconKey = config.getFlagIconKey();
			} else if (self.getNodeCategory() === constants.nodeCategory().QUIZ) {
				self.nodeIconKey = config.getQuizIconKey();
			}

			self.useMyIcon = false;
			self.myDefIconKey = self.getNodeCategory() === constants.nodeCategory().FLOW ?
					config.getFlowDefIconKey() : config.getFlagDefIconKey();
			self.nodeIcon = iconPicker.getIconImage(self.nodeIconKey);
			//
			self.getNodeIconKey = function() { return self.nodeIconKey; };
			self.setNodeIconKey = function(key) {
				if (key) {
					self.nodeIconKey = key;
					self.nodeIcon = iconPicker.getIconImage(key);
				}
				self.useMyIcon = true;
			};
			self.resetNodeIconKey = function() {
				self.nodeIconKey = self.myDefIconKey;
				self.nodeIcon = iconPicker.getIconImage(self.myDefIconKey);
				self.useMyIcon = false;
			};

			////
			var _myBgnColor,
				_useMyBgnColor,
				_myDefBgnColor,
				_myFgnColor,
				_useMyFgnColor,
				_myDefFgnColor,
				_myTextColor = config.getTextFgnColor();

			if (self.flowType === constants.flowType().START || self.flowType === constants.flowType().END) {
				_myBgnColor = config.getSEBgnColor();
				_myFgnColor = config.getSEFgnColor();
				_myDefBgnColor = config.getSEBgnDefColor();
				_myDefFgnColor = config.getSEFgnDefColor();
			} else if (self.flowType === constants.flowType().IN_OUT) {
				_myBgnColor = config.getIOBgnColor();
				_myFgnColor = config.getIOFgnColor();
				_myDefBgnColor = config.getIOBgnDefColor();
				_myDefFgnColor = config.getIOFgnDefColor();
			} else if (self.flowType === constants.flowType().LEFT_TOP ||
				self.flowType === constants.flowType().RIGHT_BOTTOM) {
				_myBgnColor = config.getSideBgnColor();
				_myFgnColor = config.getSideFgnColor();
				_myDefBgnColor = config.getSideBgnDefColor();
				_myDefFgnColor = config.getSideFgnDefColor();
			} else {
				_myBgnColor = config.getProcBgnColor();
				_myFgnColor = config.getProcFgnColor();
				_myDefBgnColor = config.getProcBgnDefColor();
				_myDefFgnColor = config.getProcFgnDefColor();
			}
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
				_myFgnColor = _myDefFgnColor;
				_useMyFgnColor = false;
			};
			self.getDefFgnColor = function() { return _myDefFgnColor; };

			//////

			var _hideName = false;
			self.isHideName = function() { return _hideName; };
			self.setHideName = function(b) { _hideName = b; };

			var _showIcon = constants.settings().SHOW_NODE_ICONS;
			self.isShowIcon = function() { return _showIcon === constants.bValue().TRUE; };
			self.getShowIcon = function() { return _showIcon; };
			self.setShowIcon = function(bvalue) {
				_showIcon = constants.getBValue(bvalue);
			};

			//////

			self.getTextDefaults = function() {
				return {
					//maxWidth: constants.contentSize().WIDTH,
					maxWidth: constants.contentSize().WIDTH + 2*self.getResizeW(),
					maxHeight: constants.contentSize().HEIGHT + 2*self.getResizeH(),
					maxLines: constants.contentSize().MAX_LINES,
					extentWidth: constants.contentViewExt().WIDTH,
					extentHeight: constants.contentViewExt().HEIGHT
				}
			};

			//////

			var _containerName;
			self.setContainerName = function(name) { _containerName = name; };
			self.getContainerName = function() { return _containerName; };

			var _containerRef;
			self.setContainerReference = function(container) {
				_containerRef = container;
				_containerName = container.getName();
			};
			self.getContainerReference = function() { return _containerRef; };

			//////

			self.nameRect = new Rectangle(0,0,0,0);
			self.initNode = function() {
				//_myDefBgnColor = _myBgnColor;
				if (self.flowType === constants.flowType().START) {
					self.createMarkupOutPort(self.getPreferredOutputSide());
				} else if (self.flowType === constants.flowType().END) {
					self.createMarkupInPort(self.getPreferredInputSide());
				} else if (self.flowType === constants.flowType().PROCESS ||
						self.flowType === constants.flowType().CONTAINER ||
						self.flowType === constants.flowType().IN_OUT) {
					self.createMarkupInPort(constants.nodeSide().BACK);
					self.createMarkupInAuxPort(constants.nodeSide().FRONT);
					self.createMarkupOutPort(constants.nodeSide().FRONT);
					self.createMarkupOutAuxPort(constants.nodeSide().BACK);
					if (config.hasShowRefHandles()) {
						self.createRefInPort(constants.portNames().REF_IN_PORT_LEFT_NAME, constants.nodeSide().LEFT);
						self.createRefInPort(constants.portNames().REF_IN_PORT_RIGHT_NAME, constants.nodeSide().RIGHT);
						self.createRefOutPort(constants.portNames().REF_OUT_PORT_LEFT_NAME, constants.nodeSide().LEFT);
						self.createRefOutPort(constants.portNames().REF_OUT_PORT_RIGHT_NAME, constants.nodeSide().RIGHT);
					}
				} else if (self.flowType === constants.flowType().LEFT_TOP) {
					self.createMarkupInPort(self.getPreferredInputSide());
					self.createMarkupOutPort(self.getPreferredOutputSide());
					if (config.hasShowRefHandles()) {
						if (config.getFlowDirection() === constants.flow().VERTICAL) {
							self.createRefInPort(constants.portNames().REF_IN_PORT_LEFT_NAME, constants.nodeSide().LEFT);
							self.createRefOutPort(constants.portNames().REF_OUT_PORT_LEFT_NAME, constants.nodeSide().LEFT);
						} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
							self.createRefInPort(constants.portNames().REF_IN_PORT_RIGHT_NAME, constants.nodeSide().RIGHT);
							self.createRefOutPort(constants.portNames().REF_OUT_PORT_RIGHT_NAME, constants.nodeSide().RIGHT);
						}
					}
				} else if (self.flowType === constants.flowType().RIGHT_BOTTOM) {
					self.createMarkupInPort(self.getPreferredInputSide());
					self.createMarkupOutPort(self.getPreferredOutputSide());
					if (config.hasShowRefHandles()) {
						if (config.getFlowDirection() === constants.flow().VERTICAL) {
							self.createRefInPort(constants.portNames().REF_IN_PORT_RIGHT_NAME, constants.nodeSide().RIGHT);
							self.createRefOutPort(constants.portNames().REF_OUT_PORT_RIGHT_NAME, constants.nodeSide().RIGHT);
						} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
							self.createRefInPort(constants.portNames().REF_IN_PORT_LEFT_NAME, constants.nodeSide().LEFT);
							self.createRefOutPort(constants.portNames().REF_OUT_PORT_LEFT_NAME, constants.nodeSide().LEFT);
						}
					}
				}
			};

			self.getNodeObject = function() {
				return self.getNodeObjectToSave();
			};

			self.getNodeObjectToSave = function() {
				var node = {};
				node.id = constants.elementType().NODE;
				node.name = self.getName();
				node.hideName = self.isHideName();
				//node.iconKey = self.nodeIconKey;
				node.showIcon = self.getShowIcon();
				node.type = self.getFlowType();
				node.levelNum = self.getLevelNumber();
				node.laneNum = self.getLaneNumber();

				node.containerName = self.getContainerName();

				node.width = self.getNodeWidth();
				node.height = self.getNodeHeight();
				node.resizeW = self.getResizeW();
				node.resizeH = self.getResizeH();

				if (self.getContentText().length > 0) { node.contentText = self.getContentText(); }
				if (self.getContentTextAbove().length > 0) { node.textAbove = self.getContentTextAbove(); }
				if (self.getContentTextBelow().length > 0) { node.textBelow = self.getContentTextBelow(); }

				self.getColorsToSave(node);
				self.getIconKeyToSave(node);
				addPortInfo(node);
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

			self.getIconKeyToSave = function(node) {
				if (self.useMyIcon) {
					node.iconKey = self.nodeIconKey;
				} else {
					node.iconKey = self.myDefIconKey;
				}
			};

			function addPortInfo(nodeObj) {
				var cnxIns = self.getInputCnxPorts(),
					cnxOuts = self.getOutputCnxPorts(),
					refIns = self.getInputRefPorts(),
					refOuts = self.getOutputRefPorts();
				if (cnxIns.length > 0) {
					nodeObj.cnxInPorts = [];
					loadFullNames(nodeObj.cnxInPorts, self.getInputPortsFullNames());
				}
				if (cnxOuts.length > 0) {
					nodeObj.cnxOutPorts = [];
					loadFullNames(nodeObj.cnxOutPorts, self.getOutputPortsFullNames());
				}
				if (refIns.length > 0) {
					nodeObj.refInPorts = [];
					loadFullNames(nodeObj.refInPorts, self.getRefInPortsFullNames());
				}
				if (refOuts.length > 0) {
					nodeObj.refOutPorts = [];
					loadFullNames(nodeObj.refOutPorts, self.getRefOutPortsFullNames());
				}
			}

			function loadFullNames(entry, portNames) {
				portNames.forEach(function(item) {
					entry.push({name: item.name, label: item.label})
				});
			}

			self.allowsResize = function() { return true; };

			self.getAllLinks = function() {
				var i, links = [],
					inputs = self.getInputEdges(),
					outputs = self.getOutputEdges();
				for (i = 0; i < inputs.length; i++) {
					links.push(inputs[i]);
				}
				for (i = 0; i < outputs.length; i++) {
					links.push(outputs[i]);
				}
				return links;
			};

			self.getCellContainerOffsets = function() {
				var container = self.getContainerReference(),
					allNodes = _flowManager.getModelHandler().getFlowNodes(),
					levelsNum = flowUtils.getNestedContainersNumberAtNodeLevel(self, allNodes),
					lanesNum = flowUtils.getNestedContainersNumberAtNodeLane(self, allNodes),
					offsets = config.getFlowDirection() === constants.flow().VERTICAL ?
					{
						front: 	constants.cellGap().HEIGHT + levelsNum * (constants.cellGap().HEIGHT/2),
						back: 	constants.cellGap().HEIGHT + levelsNum * (constants.cellGap().HEIGHT/2),
						left: 	constants.cellGap().WIDTH + lanesNum * constants.cellGap().WIDTH,
						right: 	constants.cellGap().WIDTH + lanesNum  * constants.cellGap().WIDTH
					} :
					{
						front: 	constants.cellGap().WIDTH/2 + levelsNum * (constants.cellGap().WIDTH/2),
						back: 	constants.cellGap().WIDTH/2 + levelsNum * (constants.cellGap().WIDTH/2),
						left: 	constants.cellGap().HEIGHT + lanesNum * constants.cellGap().HEIGHT,
						right: 	constants.cellGap().HEIGHT + lanesNum  * constants.cellGap().HEIGHT
					} ;
				if (container && container.isExpanded()) {
					if (config.getFlowDirection() === constants.flow().VERTICAL) {
						// VERTICAL
						if (self.getLevelNumber() === container.getStartLevelNumber()) {
							offsets.front = container.getOutlineSteps().back + constants.cellGap().CTR_HEIGHT;
						}
						if (self.getLevelNumber() === container.getEndLevelNumber()) {
							offsets.front = container.getOutlineSteps().front + 2*constants.cellGap().CTR_HEIGHT;
						}
						if (self.getLaneNumber() === container.getStartLaneNumber()) {
							offsets.right = container.getOutlineSteps().right; // + constants.cellGap().WIDTH;
						}
						if (self.getLaneNumber() === container.getEndLaneNumber()) {
							offsets.left = container.getOutlineSteps().left; // + constants.cellGap().WIDTH;
						}
					} else {
						// HORIZONTAL
						if (self.getLevelNumber() === container.getStartLevelNumber()) {
							offsets.front = container.getOutlineSteps().back + constants.cellGap().CTR_WIDTH;
						}
						if (self.getLevelNumber() === container.getEndLevelNumber()) {
							offsets.front = container.getOutlineSteps().front + constants.cellGap().CTR_WIDTH;
						}
						if (self.getLaneNumber() === container.getStartLaneNumber()) {
							offsets.left = container.getOutlineSteps().left; // + constants.cellGap().HEIGHT;
						}
						if (self.getLaneNumber() === container.getEndLaneNumber()) {
							offsets.right = container.getOutlineSteps().right; // + constants.cellGap().HEIGHT;
						}
					}
				}
				return offsets;
			};

			self.getNodeBounds = function() {
				var r = self.clone();
				return new Rectangle(r.x-_SHADE, r.y-_SHADE, r.width+2*_SHADE, r.height+2*_SHADE);
			};

			self.getInnerShape = function() {
				var r = self.clone();
				return new Rectangle(r.x+_FRAME, r.y+_FRAME, r.width-2*_FRAME, r.height-2*_FRAME);
			};

			self.containsPoint = function(point) {
				var inside = self.getNodeBounds().hasPointInside(point) && self.isVisible();
				if (inside) {
				//	var allPorts = self.getAllPorts();
				//	for (var j = 0; j < allPorts.length; j++) {
				//		var port = allPorts[j];
				//		if (port.isVisible() && port.containsPoint(point)) {
				//			return false;
				//		}
				//	}
				}
				return inside;
			};

			self.getSelectedAtPoint = function(point) {
				// TODO: ports may not need to be selectable
				if (self.containsPoint(point)) {
					return self;
				}
				return undefined;
			};

			self.setHighlightedAtPoint = function(point) {
				//console.log("setHighlightedAtPoint - "+self.showBounds()+", point - "+point.showXY());
				var b = self.containsPoint(point);
				self.showMarkupPorts(b, point);
				if (config.hasShowRefHandles()) {
					self.showRefPorts(b, point);
				}

				self.locateMarkupPorts(point);
				if (config.hasShowRefHandles()) {
					self.locateRefPorts();
				}

				var port, i, found = false,
					allPorts = self.getConnectionPorts();
				for (i = 0; i < allPorts.length; i++) {
					port = allPorts[i];
					if (port.isVisible() && port.containsPoint(point)) {
						port.setHighlighted(true);
						tooltip = port.getTooltip();
						found = true;
					} else {
						port.setHighlighted(false);
					}
				}
				allPorts = self.getMarkupPorts();
				for (i = 0; i < allPorts.length; i++) {
					port = allPorts[i];
					if (port.isVisible() && port.hasPoint(point)) {
						port.setHighlighted(true);
						tooltip = port.getTooltip();
						found = true;
					} else {
						port.setHighlighted(false);
					}
				}
				allPorts = self.getRefPorts();
				for (i = 0; i < allPorts.length; i++) {
					port = allPorts[i];
					if (port.isVisible() && port.hasPoint(point)) {
						port.setHighlighted(true);
						tooltip = port.getTooltip();
						found = true;
					} else {
						port.setHighlighted(false);
					}
				}
				if (self.containsPoint(point)) {
					self.setHighlighted(!found);
					if (!found) {
						tooltip = config.hasShowTooltip() ? self.getName() : undefined;
						if (self.nameRect.hasPointInside(point)) {
							nameTooltip = self.getName();
						} else {
							nameTooltip = undefined;
						}
						found = true;
					}
				} else {
					self.setHighlighted(false);
					tooltip = undefined;
					nameTooltip = undefined;
				}
				return found;
			};

			self.getTooltip = function() { return tooltip; };

			self.getNameTooltip = function() {
				//if (nameTooltip) {
				//	return nameTooltip + " ends: "+self.getEnds();
				//}
				return nameTooltip;
			};

			self.getCnxRestrictions = function() {
				var cnxSides = {};
				cnxSides.front = true;
				cnxSides.back = true;
				cnxSides.left = true;
				cnxSides.right = true;
				if (!self.getContainerReference()) {
					return cnxSides;
				} else {
					var container = self.getContainerReference();
					if (self.getLevelNumber() === container.getEndLevelNumber()) { cnxSides.front = false; }
					if (self.getLevelNumber() === container.getStartLevelNumber()) { cnxSides.back = false; }
					if (self.getLaneNumber() === container.getStartLaneNumber()) { cnxSides.right = false; }
					if (self.getLaneNumber() === container.getEndLaneNumber()) { cnxSides.left = false; }
					return cnxSides;
				}
			};

			self.locateMarkupPorts = function(pnt) {
				var factor = config.getScale();
				var isVertical = config.getFlowDirection() === constants.flow().VERTICAL,

					backShift =
						(self.getPortsForSide(constants.nodeSide().BACK).length === 0 ?
						(isVertical ? self.getNodeWidth()/2-6 : self.getNodeHeight()/2-6) : 4),

					frontShift =
						(self.getPortsForSide(constants.nodeSide().FRONT).length === 0 ?
						(isVertical ? self.getNodeWidth()/2-6 : self.getNodeHeight()/2-6) : 4),

					sInBack =
						(!self.isLeftLaneNode() ? backShift : -6 +
						(isVertical ? self.getNodeWidth() : self.getNodeHeight() )),

					sInFront =
						(!self.isLeftLaneNode() ? frontShift : -6 +
						(isVertical ? self.getNodeWidth() : self.getNodeHeight() )),

					sOut =
						((!self.isLeftLaneNode() && !self.isRightLaneNode()) ? 8 : 6);

				if (self.isRightLaneNode()) {
					var rnFix = constants.portDefSize().WIDTH;
					if (isVertical) {
						sInBack -= self.getNodeWidth()/2 - rnFix;
						sInFront -= self.getNodeWidth()/2 - rnFix;
					} else {
						sInBack -= self.getNodeHeight()/2 - rnFix;
						sInFront -= self.getNodeHeight()/2 - rnFix;
					}
				}

				if (self.markupInPort) {
					if (isVertical) {
						self.markupInPort.getConnector().moveToXY(sInBack, -sOut);
					} else {
						self.markupInPort.getConnector().moveToXY(-sOut, sInBack);
					}
				}
				if (self.markupOutAuxPort) {
					if (isVertical) {
						self.markupOutAuxPort.getConnector().moveToXY(self.getNodeWidth()-sInBack, -sOut);
					} else {
						self.markupOutAuxPort.getConnector().moveToXY(-sOut, self.getNodeHeight()-sInBack);
					}
				}
				if (self.markupOutPort) {
					if (isVertical) {
						self.markupOutPort.getConnector().moveToXY(sInFront, self.getNodeHeight()+sOut);
					} else {
						self.markupOutPort.getConnector().moveToXY(self.getNodeWidth()+sOut, sInFront);
					}
				}
				if (self.markupInAuxPort) {
					if (isVertical) {
						self.markupInAuxPort.getConnector().moveToXY(self.getNodeWidth()-sInFront, self.getNodeHeight()+sOut);
					} else {
						self.markupInAuxPort.getConnector().moveToXY(self.getNodeWidth()+sOut, self.getNodeHeight()-sInFront);
					}
				}
			};

			function getMarkupInPortForPoint(pnt) {
				var factor = config.getScale(),
					cnxSides = self.getCnxRestrictions();
				var okIn = !self.isDecisionNode() || !self.hasInputConnections();
				if (!okIn) {
					return undefined;
				}
				if (!self.isLeftLaneNode() && !self.isRightLaneNode()) {
					return cnxSides.back ? self.markupInPort : undefined;
				} else {
					if (config.getFlowDirection() === constants.flow().VERTICAL) {
						if (pnt.x < self.x*factor + Math.floor(self.getNodeWidth()/2)) {
							if (self.isLeftLaneNode()) {
								self.markupInPort.setVisible(false);
								return undefined;
							} else {
								return self.markupInPort;
							}
						} else {
							if (self.isLeftLaneNode()) {
								return self.markupInPort;
							} else {
								self.markupInPort.setVisible(false);
								return undefined;
							}
						}
					} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						if (pnt.y < self.y*factor + Math.floor(self.getNodeHeight()/2)) {
							if (self.isLeftLaneNode()) {
								self.markupInPort.setVisible(false);
								return undefined;
							} else {
								return self.markupInPort;
							}
						} else {
							if (self.isLeftLaneNode()) {
								return self.markupInPort;
							} else {
								self.markupInPort.setVisible(false);
								return undefined;
							}
						}
					}
				}
				return undefined;
			}
			function getMarkupInAuxPortForPoint(pnt) {
				var cnxSides = self.getCnxRestrictions();
				//if (!self.containsPoint(pnt)) { return undefined; };
				return cnxSides.front ? self.markupInAuxPort : undefined;
			}

			function getMarkupOutPortForPoint(pnt) {
				var factor = config.getScale(),
					cnxSides = self.getCnxRestrictions();
				if (!self.isLeftLaneNode() && !self.isRightLaneNode()) {
					return cnxSides.front ? self.markupOutPort : undefined;
				} else {
					if (config.getFlowDirection() === constants.flow().VERTICAL) {
						if (pnt.x < self.x*factor + Math.floor(self.getNodeWidth()/2)) {
							if (self.isLeftLaneNode()) {
								self.markupOutPort.setVisible(false);
								return undefined;
							} else {
								return self.markupOutPort;
							}
						} else {
							if (self.isLeftLaneNode()) {
								return self.markupOutPort;
							} else {
								self.markupOutPort.setVisible(false);
								return undefined;
							}
						}
					} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						if (pnt.y < self.y*factor + Math.floor(self.getNodeHeight()/2)) {
							if (self.isLeftLaneNode()) {
								self.markupOutPort.setVisible(false);
								return undefined;
							} else {
								return self.markupOutPort;
							}
						} else {
							if (self.isLeftLaneNode()) {
								return self.markupOutPort;
							} else {
								self.markupOutPort.setVisible(false);
								return undefined;
							}
						}
					}
				}
				return undefined;
			}
			function getMarkupOutAuxPortForPoint(pnt) {
				var cnxSides = self.getCnxRestrictions();
				return cnxSides.back ? self.markupOutAuxPort : undefined;
			}

			self.showMarkupPorts = function(b, pnt) {
				if (!pnt || !config.isEditMode()) {
					// assuming false
					var mkPorts = self.getMarkupPorts();
					for (var i = 0; i < mkPorts.length; i++) {
						mkPorts[i].setVisible(false);
					}
					return;
				}
				var factor = config.getScale(),
					cnxSides = self.getCnxRestrictions();
				if (!self.isLeftLaneNode() && !self.isRightLaneNode()) {
					var showUpper = config.getFlowDirection() === constants.flow().VERTICAL ?
						pnt.y < self.y*factor + Math.floor(self.getNodeHeight()*factor/2) : pnt.x < self.x*factor + Math.floor(self.getNodeWidth()*factor/2);

					if (self.markupInPort) { self.markupInPort.setVisible(cnxSides.back && (showUpper ? b : false)); }
					if (self.markupInAuxPort) { self.markupInAuxPort.setVisible(cnxSides.front && (showUpper ? false : b)); }
					if (self.markupOutPort) { self.markupOutPort.setVisible(cnxSides.front && (showUpper ? false : b)); }
					if (self.markupOutAuxPort) { self.markupOutAuxPort.setVisible(cnxSides.back && (showUpper ? b : false)); }

				} else {
					if (config.getFlowDirection() === constants.flow().VERTICAL) {
						if (pnt.x < self.x*factor + Math.floor(self.getNodeWidth()*factor/2)) {
							if (self.markupInPort)  { self.markupInPort.setVisible(self.isLeftLaneNode() ? false : b); }
							if (self.markupOutPort)  { self.markupOutPort.setVisible(self.isLeftLaneNode() ? false : b); }
						} else {
							if (self.markupInPort)  { self.markupInPort.setVisible(self.isLeftLaneNode() ? b : false); }
							if (self.markupOutPort)  { self.markupOutPort.setVisible(self.isLeftLaneNode() ? b : false); }
						}
					} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						if (pnt.y < self.y*factor + Math.floor(self.getNodeHeight()*factor/2)) {
							if (self.markupInPort)  { self.markupInPort.setVisible(self.isLeftLaneNode() ? false : b); }
							if (self.markupOutPort)  { self.markupOutPort.setVisible(self.isLeftLaneNode() ? false : b); }
						} else {
							if (self.markupInPort)  { self.markupInPort.setVisible(self.isLeftLaneNode() ? b : false); }
							if (self.markupOutPort)  { self.markupOutPort.setVisible(self.isLeftLaneNode() ? b : false); }
						}
					}
				}
			};

			self.locateRefPorts = function() {
				var sOut = 6,
					sIn = (!self.isLeftLaneNode() && !self.isRightLaneNode()) ? 6 : 4,
					leftInPort = self.getRefInPortForName(constants.portNames().REF_IN_PORT_LEFT_NAME),
					leftOutPort = self.getRefOutPortForName(constants.portNames().REF_OUT_PORT_LEFT_NAME),
					rightInPort = self.getRefInPortForName(constants.portNames().REF_IN_PORT_RIGHT_NAME),
					rightOutPort = self.getRefOutPortForName(constants.portNames().REF_OUT_PORT_RIGHT_NAME);
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					//if (!self.isLeftLaneNode() && !self.isRightLaneNode()) {
						if (leftInPort)   { leftInPort.getConnector().moveToXY(self.getNodeWidth()+sOut, sIn); }
						if (leftOutPort)  { leftOutPort.getConnector().moveToXY(self.getNodeWidth()+sOut, self.getNodeHeight()-sIn); }
						if (rightInPort)  { rightInPort.getConnector().moveToXY(-sOut, sIn); }
						if (rightOutPort) { rightOutPort.getConnector().moveToXY(-sOut, self.getNodeHeight()-sIn); }
					//}
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					//if (!self.isLeftLaneNode() && !self.isRightLaneNode())  {
						if (leftInPort)   { leftInPort.getConnector().moveToXY(sIn, -sOut); }
						if (leftOutPort)  { leftOutPort.getConnector().moveToXY(self.getNodeWidth()-sIn, -sOut); }
						if (rightInPort)  { rightInPort.getConnector().moveToXY(sIn, self.getNodeHeight()+sOut); }
						if (rightOutPort) { rightOutPort.getConnector().moveToXY(self.getNodeWidth()-sIn, self.getNodeHeight()+sOut); }
					//}
				}
			};

			self.showRefPorts = function(b, pnt) {
				if (!pnt || !config.isEditMode()) {
					// assuming false
					var refPorts = self.getRefPorts();
					for (var i = 0; i < refPorts.length; i++) {
						refPorts[i].setVisible(false);
					}
					return;
				}
				var leftInPort = self.getRefInPortForName(constants.portNames().REF_IN_PORT_LEFT_NAME),
					leftOutPort = self.getRefOutPortForName(constants.portNames().REF_OUT_PORT_LEFT_NAME),
					rightInPort = self.getRefInPortForName(constants.portNames().REF_IN_PORT_RIGHT_NAME),
					rightOutPort = self.getRefOutPortForName(constants.portNames().REF_OUT_PORT_RIGHT_NAME),
					cnxSides = self.getCnxRestrictions();
				var factor = config.getScale();
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					//if (!self.isLeftLaneNode() && !self.isRightLaneNode()) {
						if (pnt.x < self.x*factor + Math.floor(self.getNodeWidth()*factor/2)) {
							if (rightInPort)  { rightInPort.setVisible(cnxSides.right && b); }
							if (rightOutPort) { rightOutPort.setVisible(cnxSides.right && b); }
							setPortsVisible(self.getRefLeftPorts(), false);
						} else {
							if (leftInPort)   { leftInPort.setVisible(cnxSides.left && b); }
							if (leftOutPort)  { leftOutPort.setVisible(cnxSides.left && b); }
							setPortsVisible(self.getRefRightPorts(), false);
						}
					//}
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					//if (!self.isLeftLaneNode() && !self.isRightLaneNode())  {
						if (pnt.y < self.y*factor + Math.floor(self.getNodeHeight()*factor/2)) {
							if (leftInPort)   { leftInPort.setVisible(cnxSides.left && b); }
							if (leftOutPort)  { leftOutPort.setVisible(cnxSides.left && b); }
							setPortsVisible(self.getRefRightPorts(), false);
						} else {
							if (rightInPort)  { rightInPort.setVisible(cnxSides.right && b); }
							if (rightOutPort) { rightOutPort.setVisible(cnxSides.right && b); }
							setPortsVisible(self.getRefLeftPorts(), false);
						}
					//}
				}
			};

			function getRefInPortForPoint(pnt) {
				var leftInPort = self.getRefInPortForName(constants.portNames().REF_IN_PORT_LEFT_NAME),
					rightInPort = self.getRefInPortForName(constants.portNames().REF_IN_PORT_RIGHT_NAME),
					factor = config.getScale(),
					cnxSides = self.getCnxRestrictions();
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					if (pnt.x < self.x*factor + Math.floor(self.getNodeWidth()/2)) {
						if (rightInPort)  {  return cnxSides.right ? rightInPort : undefined; }
					} else {
						if (leftInPort)   { return cnxSides.left ? leftInPort : undefined; }
					}
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					if (pnt.y < self.y*factor + Math.floor(self.getNodeHeight()/2)) {
						if (leftInPort)   { return cnxSides.left ? leftInPort : undefined; }
					} else {
						if (rightInPort)  { return cnxSides.right ? rightInPort : undefined; }
					}
				}
				return undefined;
			}

			function getRefOutPortForPoint(pnt) {
				var leftOutPort = self.getRefOutPortForName(constants.portNames().REF_OUT_PORT_LEFT_NAME),
					rightOutPort = self.getRefOutPortForName(constants.portNames().REF_OUT_PORT_RIGHT_NAME),
					factor = config.getScale(),
					cnxSides = self.getCnxRestrictions();
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					if (pnt.x < self.x*factor + Math.floor(self.getNodeWidth()/2)) {
						if (rightOutPort) { return cnxSides.right ? rightOutPort : undefined; }
					} else {
						if (leftOutPort)  { return cnxSides.left ? leftOutPort : undefined; }
					}
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					if (pnt.y < self.y*factor + Math.floor(self.getNodeHeight()/2)) {
						if (leftOutPort)  { return cnxSides.left ? leftOutPort : undefined; }
					} else {
						if (rightOutPort) { return cnxSides.right ? rightOutPort : undefined; }
					}
				}
				return undefined;
			}

			function setPortsVisible(ports, b) {
				for (var i = 0; i < ports.length; i++) {
					if (!ports[i].hasEdges()) {
						ports[i].setVisible(b);
					}
					ports[i].setVisible(b);
				}
			}

			self.hideRefPorts = function() {
				var refPorts = self.getRefPorts();
				for (var i = 0; i < refPorts.length; i++) {
					refPorts[i].setVisible(false);
				}
			};

			self.hasSelections = function() {
				var i, inPorts = self.getInputPorts(), outPorts = self.getOutputPorts();
				for (i = 0; i < inPorts.length; i++) {
					if (inPorts[i].isSelected()) {
						return true;
					}
				}
				for (i = 0; i < outPorts.length; i++) {
					if (outPorts[i].isSelected()) {
						return true;
					}
				}
				return false;
			};

			self.isMarkupPortValid = function(port) {
				// subclass needs parent call
				return true;
			};


			self.setDNDAcceptingPorts = function(originPort, dragPoint) {
				var originDirection = originPort.getDirection(),
					acceptingPorts = [];
				if (originPort.getType() === constants.portType().LINK_CNX ||
						originPort.getType() === constants.portType().MARKUP ) {
					if (originDirection === constants.portDirection().OUT ||
						originDirection === constants.portDirection().MARK_OUT ||
						originDirection === constants.portDirection().MARK_OUT_AUX) {
						var inPort = getMarkupInPortForPoint(dragPoint);
						if (inPort) {
							acceptingPorts.push(inPort);
						}
						var inAuxPort = getMarkupInAuxPortForPoint(dragPoint);
						if (inAuxPort) {
							acceptingPorts.push(inAuxPort);
						}
						//acceptingPorts = self.getAllUnconnectedInputPorts();
					} else if (originDirection == constants.portDirection().IN ||
						originDirection == constants.portDirection().MARK_IN ||
						originDirection === constants.portDirection().MARK_IN_AUX) {
						var outPort = getMarkupOutPortForPoint(dragPoint);
						if (outPort) {
							acceptingPorts.push(outPort);
						}
						var outAuxPort = getMarkupOutAuxPortForPoint(dragPoint);
						if (outAuxPort) {
							acceptingPorts.push(outAuxPort);
						}
						//acceptingPorts = self.getAllUnconnectedOutputPorts();
					}
				} else if (originPort.getType() === constants.portType().LINK_REF ||
						originPort.getType() === constants.portType().REF ) {
					if (originDirection === constants.portDirection().REF_OUT ||
						originDirection === constants.portDirection().OUT  ) {
					//if (originDirection === constants.portDirection().OUT ) {
						var refInPort = getRefInPortForPoint(dragPoint);
						if (refInPort) {
							acceptingPorts.push(refInPort);
						}
					} else if (originDirection == constants.portDirection().REF_IN ||
						originDirection == constants.portDirection().IN) {
					//} else if (originDirection == constants.portDirection().IN) {
						var refOutPort = getRefOutPortForPoint(dragPoint);
						if (refOutPort) {
							acceptingPorts.push(refOutPort);
						}
					}
				}
				for (var i = 0; i < acceptingPorts.length; i++) {
					var port = acceptingPorts[i];
					port.setDNDMode(constants.dndMode().DESTINATION);
					port.setVisible(true);
				}
			};

			self.resetDNDFlags = function() {
				var ports = self.getAllPorts();
				for (var i = 0; i < ports.length; i++) {
					ports[i].setDNDMode(constants.dndMode().NONE);
				}
			};

			self.getAcceptingPortForPoint = function(originPort, dragPoint) {
				var originDirection = originPort.getDirection(),
					acceptingPorts = [];
				self.locateMarkupPorts(dragPoint);
				if (originDirection === constants.portDirection().OUT ||
					originDirection === constants.portDirection().MARK_OUT ||
					originDirection === constants.portDirection().MARK_OUT_AUX ||
					originDirection === constants.portDirection().REF_OUT) {
					var inPort = getMarkupInPortForPoint(dragPoint);
					if (inPort) {
						acceptingPorts.push(inPort);
					}
					var inAuxPort = getMarkupInAuxPortForPoint(dragPoint);
					if (inAuxPort) {
						acceptingPorts.push(inAuxPort);
					}
					//acceptingPorts = self.getAllUnconnectedInputPorts();
					//
					if (originPort.getType() == constants.portType().LINK_REF || originPort.getType() == constants.portType().REF ) {
						var refInPort = getRefInPortForPoint(dragPoint);
						if (refInPort) {
							acceptingPorts.push(refInPort);
						}
					}
				} else if (originDirection === constants.portDirection().IN ||
					originDirection === constants.portDirection().MARK_IN ||
					originDirection === constants.portDirection().MARK_IN_AUX ||
					originDirection === constants.portDirection().REF_IN) {
					var outPort = getMarkupOutPortForPoint(dragPoint);
					if (outPort) {
						acceptingPorts.push(outPort);
					}
					var outAuxPort = getMarkupOutAuxPortForPoint(dragPoint);
					if (outAuxPort) {
						acceptingPorts.push(outAuxPort);
					}
					//acceptingPorts = self.getAllUnconnectedOutputPorts();
					//
					if (originPort.getType() == constants.portType().LINK_REF || originPort.getType() == constants.portType().REF ) {
						var refOutPort = getRefOutPortForPoint(dragPoint);
						if (refOutPort) {
							acceptingPorts.push(refOutPort);
						}
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

			self.setDrawState = function(state) {
				_drawState = state;
				if (state === constants.drawState().DRAGGED) {
					setLinksDrawMode(constants.drawMode().LINE);
				} else if (state === constants.drawState().IN_LAYOUT ||
					state === constants.drawState().RESIZED) {
					setLinksDrawMode(constants.drawMode().SEGMENTS);
				} else {  // DrawState.FOOTPRINT
					setLinksDrawMode(constants.drawMode().NO_DRAW);
				}
			};

			self.getDrawState = function() {
				return _drawState;
			};

			function setLinksDrawMode(drawMode) {
				var ports = self.getConnectionPorts();
				for (var i = 0; i < ports.length; i++) {
					var links = ports[i].getEdgesList();
					for (var j = 0; j < links.length; j++) {
						links[j].setDrawMode(drawMode);
					}
				}
			}

			self.setSelected = function(b) {
				if (b) {
					self.highlighted = false;
				}
				self.selected = b;
			};

			self.drawGraphics = function(ctx) {
				if (!self.isVisible()) {
					return;
				}
				ctx.lineWidth = 2;
				ctx.setLineDash([0,0]);
				var outlineColor = nColor;
				if (self.isHighlighted()) {
					outlineColor = hltColor;
				}
				if (self.isSelected()) {
					outlineColor = selColor;
				}
				ctx.strokeStyle = outlineColor;
				//ctx.font = "12px Arial";
				ctx.font = constants.font().TEXT;

				ctx.fillStyle = _myBgnColor;

				if (self.flowType === constants.flowType().IN_OUT) {
					draw.roundParallelogram(ctx, self.x, self.y, self.getNodeWidth(), self.getNodeHeight(), _ARC, _SKEW);
				} else {
					draw.roundRect(ctx, self.x, self.y, self.getNodeWidth(), self.getNodeHeight(), _ARC);
				}

				//draw.drawLine(ctx, nColor, 1, self.x+20, self.y+10, self.x+self.getNodeWidth()-6, self.y+10);
				if (self.isShowIcon() || config.hasShowNodeIcons()) {
					ctx.drawImage(self.nodeIcon, self.x+4, self.y+4);
				}

				if (!drawContentText(ctx)) {
					if (!_hideName && !config.hasHideNodeNames())
						self.drawName(ctx, self.getNodeWidth()-8, null, _myFgnColor);
				} else {
					if (!_hideName && !config.hasHideNodeNames())
						self.drawName(ctx, self.getNodeWidth()-20, self.y+15, _myFgnColor);
				}

				self.drawPorts(ctx);
				self.drawTextAbove(ctx, 12);
				self.drawTextBelow(ctx, 12);

				if (_drawState === constants.drawState().RESIZED) {
					draw.selectedNodeFrame(
						ctx, self.x, self.y, self.getNodeWidth(), self.getNodeHeight(), self.getResizeDeltaW(), self.getResizeDeltaH(),
						config.getSelectFrameColor(), self);
				}
			};

			function drawContentText(ctx) {
				//console.log("+++ drawContent NODE: "+self.getName()+", "+self.getContentText());
				var cntSize = self.getContentSize();
				if (!cntSize.isNull()) {
					var x, y,
						textDms = self.getTextRectangle(),
						cntW = textDms.width,
						cntH = textDms.height,
						//cvExt = constants.contentViewExt().WIDTH,
						fontHeight = constants.font().HEIGHT, //self.getFontHeight(ctx),
						leading = constants.textLeading().HEIGHT;
					if (config.hasShowTitleOnContent()) {
						// add a line for title -  NOP!
						//cntH += fontHeight + leading;
					}
					x = self.x + Math.floor((self.getNodeWidth() - cntW)/2);
					//y = self.y + Math.floor((self.getNodeHeight() - cntH)/2);
					y = self.y+16;
					//ctx.fillStyle = constants.colors().CONTENT_TEXT;
					ctx.fillStyle = _myFgnColor;
					var lines = self.getContentArray().slice();
					//console.log("+++ drawContent NODE: "+self.getName()+", lines: "+JSON.stringify(lines));
					if (config.hasShowTitleOnContent()) {
						//var name = drawUtils.getTextTruncated(self.getName(), ctx, constants.contentSize().WIDTH);
						lines.splice(0, 0, "");
					}
					for (var i = 0; i < lines.length; i++) {
						var line = lines[i],
							lineLen = Math.floor(ctx.measureText(line).width),
							//vX = x + Math.floor((cntW - lineLen)/2),
							vX = x + Math.floor(2),

							//vY = y + fontHeight -2 + (fontHeight + leading) * i;
							vY = y + (fontHeight + leading) * i;
						//console.log(">>> "+line);
						ctx.fillText(line, vX, vY);
						if (i == 0) {
							//ctx.strokeRect(vX, vY-fontHeight, lineLen, fontHeight + leading);
							self.nameRect.setRectBounds(self.x, vY-fontHeight, self.getNodeWidth(), fontHeight + leading);
						}
					}
					return true;
				}
				return false;
			}

			self.drawTextAbove = function(ctx, vOff) {
				//var textSize = self.getContentSizeAbove();
				if (!self.getContentSizeAbove().isNull()) {
					ctx.font = constants.font().TEXT;
					var x, y,
						textDms = self.getTextRectangleAbove(),
						cntW = textDms.width,
						cntH = textDms.height,
						fontHeight = constants.font().HEIGHT, //self.getFontHeight(ctx),
						leading = constants.textLeading().HEIGHT,
						lineHeight = fontHeight + leading;
					x = self.getX() + Math.floor((self.getNodeWidth() - cntW)/2);
					y = self.getY() - vOff - cntH;
					draw.paintRectangle(ctx, new Rectangle(x, y, cntW, cntH), '#FFF', null, 0, 1);
					ctx.fillStyle = _myTextColor;
					var lines = self.getContentArrayAbove().slice();
					for (var i = 0; i < lines.length; i++) {
						var line = lines[i],
							lineLen = Math.floor(ctx.measureText(line).width),
							vX = x + Math.floor((cntW - lineLen)/2),
							vY = y + lineHeight * i + 10;
						ctx.fillText(line, vX, vY);
					}
					return true;
				}
			};

			self.drawTextBelow = function(ctx, vOff) {
				//var textSize = self.getContentSizeAbove();
				if (!self.getContentSizeBelow().isNull()) {
					ctx.font = constants.font().TEXT;
					var x, y,
						textDms = self.getTextRectangleBelow(),
						cntW = textDms.width,
						cntH = textDms.height,
						fontHeight = constants.font().HEIGHT, //self.getFontHeight(ctx),
						leading = constants.textLeading().HEIGHT,
						lineHeight = fontHeight + leading;
					x = self.getX() + Math.floor((self.getNodeWidth() - cntW)/2);
					y = self.getY() + self.getNodeHeight() + vOff;
					draw.paintRectangle(ctx, new Rectangle(x, y, cntW, cntH), '#FFF', null, 0, 1);
					ctx.fillStyle = _myTextColor;
					var lines = self.getContentArrayBelow().slice();
					for (var i = 0; i < lines.length; i++) {
						var line = lines[i],
							lineLen = Math.floor(ctx.measureText(line).width),
							vX = x + Math.floor((cntW - lineLen)/2),
							vY = y + lineHeight * i + 10;
						ctx.fillText(line, vX, vY);
					}
					return true;
				}
			};

			self.drawName = function(ctx, maxLen, textY, color) {
				var name = self.getName();
				// TODO: here min size is square, need to monitor the width for dynamic text drawing
				//if (name.length > maxLen) {
				//	name = name.substring(0, maxLen)+"..";
				//}
				ctx.fillStyle = !color ? 'blue' : color;
				//ctx.fillStyle = constants.colors().CONTENT_TEXT;

				var charWidth = ctx.measureText("W").width,
					maxChars = maxLen/charWidth;
				if (name.length > maxChars) {
				//if (name.length > maxLen) {
					name = name.substring(0, maxChars)+"..";
				}

				var tw = ctx.measureText(name).width;
				var tx = Math.round(self.x + Math.floor(self.getNodeWidth()/2) - Math.floor(tw/2));
				//var ty = Math.round(self.y + Math.floor(self.getNodeHeight()/2) + Math.floor(th/2));

				//var ty = Math.round(self.y + thPos + Math.floor(th/2));
				//var ty = self.y + Math.floor((self.getNodeHeight() - self.getFontHeight(ctx))/2);
				th = constants.font().HEIGHT; //self.getFontHeight(ctx);
				var ty = textY ? textY : self.y + Math.floor((self.getNodeHeight() + th/2)/2);

				//ctx.strokeRect(tx, ty-10, tw, 10);
				self.nameRect.setRectBounds(tx, ty-10, tw, 10);
				if (!config.hasHideNodeNames()) {
					ctx.fillText(name, tx, ty);
				}
			};

			self.drawPorts = function(ctx) {
				var i, inPorts = self.getInputPorts();
				for (i = 0; i < inPorts.length; i++) {
					inPorts[i].drawPort(ctx);
				}
				var outPorts = self.getOutputPorts();
				for (i = 0; i < outPorts.length; i++) {
					outPorts[i].drawPort(ctx);
				}
				if (self.markupInPort) {
					self.markupInPort.drawPort(ctx);
				}
				if (self.markupInAuxPort) {
					self.markupInAuxPort.drawPort(ctx);
				}
				if (self.markupOutPort) {
					self.markupOutPort.drawPort(ctx);
				}
				if (self.markupOutAuxPort) {
					self.markupOutAuxPort.drawPort(ctx);
				}
				for(i = 0; i < self.getRefInPorts().length; i++) {
					self.getRefInPorts()[i].drawPort(ctx);
				}
				for(i = 0; i < self.getRefOutPorts().length; i++) {
					self.getRefOutPorts()[i].drawPort(ctx);
				}
			};

			self.initNode();

		}
		jsUtils.inherit(FlowNode, GraphNode);
		return FlowNode;
	}
);