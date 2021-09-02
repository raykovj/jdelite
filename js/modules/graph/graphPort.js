define('modules/graph/graphPort',
	['modules/geometry/rectangle',
		'modules/geometry/point',
		'modules/graph/graphElement',
		'modules/diagram/diagramUtils',
		'modules/draw/draw',
		'modules/graph/graphConstants',
		'modules/graph/modelUtils',
		'modules/settings/config',
		'modules/html/iconLoader',
		'modules/core/jsUtils'],
	function(Rectangle,
			 Point,
	         GraphElement,
	         diagramUtils,
	         draw,
	         constants,
	         modelUtils,
	         config,
			 loader,
	         jsUtils) {

		function GraphPort(connector) {
			GraphElement.call(this, new Rectangle(0,0,0,0));

			var self = this,
				hltColor = constants.colors().EDGE,
				acceptColor = constants.colors().ACCEPT_PORT,
				ARC = 4,
				tooltip = "";
				//OFF_IN = config.getLinkStyle() === constants.linkStyle().DOUBLE_ARROW ? 3 : 6;

			self.setId(constants.elementType().PORT);
			self.connector = connector;
			self.getConnector = function() { return self.connector; };

			self.setName(connector.getName());
			self.mode = constants.portMode().NONE;

			self.node = connector.getNode();
			self.getNode = function() { return self.node; };

			self.getDirection = function() { return self.connector.getDirection(); }; // constants.portDirection
			self.getSide = function() { return self.connector.getSide(); }; // constants.nodeSide
			self.setSide = function(side) { return self.connector.setSide(side); };

			// not visible to subclasses, default is LINK_CNX
			var _type = constants.portType().LINK_CNX;
			self.getType = function() { return _type; };
			self.setType = function(type) { _type = type; };

			var _portLabel = "";
			self.getPortLabel = function() { return _portLabel; };
			self.setPortLabel = function(label) { _portLabel = label; };

			// on the node side opposite to the preferred input or output side
			self.inverse = false;
			self.setInverse = function(b) { self.inverse = b; };
			self.isInverse = function() { return self.inverse; };

			var _dummyParentName;
			self.getDummyParentName = function() { return _dummyParentName; };
			self.setDummyParentName = function(portName) { _dummyParentName = portName; };

			self.getDisplayName = function() {
				//return diagramUtils.getPortDisplayName(self);
				return self.getName();
			};

			self.getPortBounds = function() {
				return self.getDNDShape();
			};

			self.getDNDShape = function() {
				var HLT_EXT = config.getLinkStyle() === constants.linkStyle().DOUBLE_ARROW ? 1 :
					(self.getDirection() === constants.portDirection().OUT ? 4 : 1);
				return new Rectangle(
					self.connector.globalX() - getXShift() - HLT_EXT,
					self.connector.globalY() - getYShift() - HLT_EXT,
					self.width + 2* HLT_EXT,
					self.height + 2* HLT_EXT);
			};

			function getXShift() {
				var invShift = self.inverse ? 6 : 0;
				if (config.getLinkStyle() === constants.linkStyle().DOUBLE_ARROW) {
					return Math.floor(self.width/2);
				} else if (config.getLinkStyle() === constants.linkStyle().SINGLE_ARROW) {
					if (isMatchingSide(constants.nodeSide().FRONT)) {
						return config.getFlowDirection() === constants.flow().HORIZONTAL ?
							Math.floor(self.width/2) - invShift : Math.floor(self.width/2);
					} else if (isMatchingSide(constants.nodeSide().BACK)) {
						return config.getFlowDirection() === constants.flow().HORIZONTAL ?
							Math.floor(self.width) - invShift: Math.floor(self.width/2);
					} else if (isMatchingSide(constants.nodeSide().LEFT)) {
						return config.getFlowDirection() === constants.flow().HORIZONTAL ?
							Math.floor(self.width/2) : 0;
					} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
						return config.getFlowDirection() === constants.flow().HORIZONTAL ?
							Math.floor(self.width/2) : Math.floor(self.width);
					}
				} else {
					return 0;
				}
			}
			function getYShift() {
				var invShift = self.inverse ? 6 : 0;
				if (config.getLinkStyle() === constants.linkStyle().DOUBLE_ARROW) {
					return Math.floor(self.height/2);
				} else if (config.getLinkStyle() === constants.linkStyle().SINGLE_ARROW) {
					if (isMatchingSide(constants.nodeSide().FRONT)) {
						return config.getFlowDirection() === constants.flow().HORIZONTAL ?
							Math.floor(self.height/2) : Math.floor(self.height/2) - invShift ;
					} else if (isMatchingSide(constants.nodeSide().BACK)) {
						return config.getFlowDirection() === constants.flow().HORIZONTAL ?
							Math.floor(self.height/2) : Math.floor(self.height) - invShift ;
					} else if (isMatchingSide(constants.nodeSide().LEFT)) {
						return config.getFlowDirection() === constants.flow().HORIZONTAL ?
							Math.floor(self.height) : Math.floor(self.height/2);
					} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
						return config.getFlowDirection() === constants.flow().HORIZONTAL ?
							0 : Math.floor(self.height/2);
					}
				} else {
					return 0;
				}
			}

			self.shiftCnxPortUp = function(step) {
				self.getConnector().setOrder(self.getConnector().getOrder()+1);
				if (self.getSide() === constants.nodeSide().FRONT) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						self.getConnector().translate(0, step);
					} else {
						self.getConnector().translate(step, 0);
					}
				} else if (self.getSide() === constants.nodeSide().BACK) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						self.getConnector().translate(0, step);
					} else {
						self.getConnector().translate(step, 0);
					}
				} else if (self.getSide() === constants.nodeSide().LEFT) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						self.getConnector().translate(step, 0);
					} else {
						self.getConnector().translate(0, step);
					}
				} else if (self.getSide() === constants.nodeSide().RIGHT) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						self.getConnector().translate(step, 0);
					} else {
						self.getConnector().translate(0, step);
					}
				}
			};

			self.isPortVisible = function() {
				var isEdgeVisible = self.edgeList.length > 0 &&
					(self.dndMode === constants.dndMode().ORIGIN ? true : self.edgeList[0].isLinkVisible());
				return self.isVisible() && isEdgeVisible && self.getType() !== constants.portType().DUMMY;
			};

			self.containsPoint = function(point) {
				var b = self.isPortVisible() && self.getPortBounds().containsXY(point.x, point.y);
				tooltip = b ? getTooltipProperty() : undefined;
				return b;
			};

			self.getTooltip = function() {
				return tooltip;
				//return config.hasShowTooltip() ? tooltip : undefined;
			};

			function getTooltipProperty() {
				if (config.hasShowTooltip()) {
					return self.getPath();
				} else {
					if (self.getDirection() === constants.portDirection().OUT) {
						if (self.getType() === constants.portType().LINK_CNX) {
							return "Drag to different output";
						} else if (self.getType() === constants.portType().LINK_REF) {
							return "Drag to different association output";
						}
					}
					else if (self.getDirection() === constants.portDirection().IN) {
						if (self.getType() === constants.portType().LINK_CNX) {
							return "Drag to different input";
						} else if (self.getType() === constants.portType().LINK_REF) {
							return "Drag to different association input";
						}
					}
				}
			}

			self.init = function() {
				// at this point some values are off, they are adjusted later
				//if (self.getDirection() === constants.portDirection().IN) {
					self.setRectSize(constants.portDefSize().WIDTH, constants.portDefSize().HEIGHT);
				//} else {
				//	self.setRectSize(0, 0);
				//}
				self.setRectLocation(
					self.connector.globalX() - Math.floor(self.width/2),
					self.connector.globalY() - Math.floor(self.height/2));

			};

			self.getIcon = function() {
				var direction = self.getDirection(),
					linkStyle = config.getLinkStyle(),
					image;
				if (_type === constants.portType().LINK_CNX) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						if (isMatchingSide(constants.nodeSide().FRONT)) {
							image = direction === constants.portDirection().OUT ? getEastOutIcon(linkStyle) : getWestInIcon(linkStyle);
						} else if (isMatchingSide(constants.nodeSide().BACK)) {
							image =  direction === constants.portDirection().OUT ? getWestOutIcon(linkStyle) : getEastInIcon(linkStyle);
						} else if (isMatchingSide(constants.nodeSide().LEFT)) {
							image =  direction === constants.portDirection().OUT ? getNorthOutIcon(linkStyle) : getSouthInIcon(linkStyle);
						} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
							image =  direction === constants.portDirection().OUT ? getSouthOutIcon(linkStyle) : getNorthInIcon(linkStyle);
						}
					} else {
						if (isMatchingSide(constants.nodeSide().FRONT)) {
							image =  direction === constants.portDirection().OUT ? getSouthOutIcon(linkStyle) : getNorthInIcon(linkStyle);
						} else if (isMatchingSide(constants.nodeSide().BACK)) {
							image =  direction === constants.portDirection().OUT ? getNorthOutIcon(linkStyle) : getSouthInIcon(linkStyle);
						} else if (isMatchingSide(constants.nodeSide().LEFT)) {
							image =  direction === constants.portDirection().OUT ? getEastOutIcon(linkStyle) : getWestInIcon(linkStyle);
						} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
							image =  direction === constants.portDirection().OUT ? getWestOutIcon(linkStyle) : getEastInIcon(linkStyle);
						}
					}
				} else if (_type === constants.portType().LINK_REF) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						if (isMatchingSide(constants.nodeSide().FRONT)) {
							image = direction === constants.portDirection().OUT ? getEastOutRefIcon(linkStyle) : loader.westRefIcon;
						} else if (isMatchingSide(constants.nodeSide().BACK)) {
							image =  direction === constants.portDirection().OUT ? getWestOutRefIcon(linkStyle) : loader.eastRefIcon;
						} else if (isMatchingSide(constants.nodeSide().LEFT)) {
							image =  direction === constants.portDirection().OUT ? getNorthOutRefIcon(linkStyle) : loader.southRefIcon;
						} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
							image =  direction === constants.portDirection().OUT ? getSouthOutRefIcon(linkStyle) : loader.northRefIcon;
						}
					} else {
						if (isMatchingSide(constants.nodeSide().FRONT)) {
							image =  direction === constants.portDirection().OUT ? getSouthOutRefIcon(linkStyle) : loader.northRefIcon;
						} else if (isMatchingSide(constants.nodeSide().BACK)) {
							image =  direction === constants.portDirection().OUT ? getNorthOutRefIcon(linkStyle) : loader.southRefIcon;
						} else if (isMatchingSide(constants.nodeSide().LEFT)) {
							image =  direction === constants.portDirection().OUT ? getEastOutRefIcon(linkStyle) : loader.westRefIcon;
						} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
							image =  direction === constants.portDirection().OUT ? getWestOutRefIcon(linkStyle) : loader.eastRefIcon;
						}
					}
				}
				if (!image) {
					image = loader.emptyPort;
				}
				self.setRectSize(image.width, image.height);
				return image;
			};

			function isMatchingSide(value) { return ((self.getSide() & value) > 0); }

			// IN
			function getEastInIcon(linkStyle) {
				if (linkStyle === constants.linkStyle().DOUBLE_ARROW) {return loader.eastIcon; }
				else if (linkStyle === constants.linkStyle().SINGLE_ARROW) {return loader.eastArrowIcon; }
				else return undefined;
			}
			function getWestInIcon(linkStyle) {
				if (linkStyle === constants.linkStyle().DOUBLE_ARROW) {return loader.westIcon; }
				else if (linkStyle === constants.linkStyle().SINGLE_ARROW) {return loader.westArrowIcon; }
				else return undefined;
			}
			function getNorthInIcon(linkStyle) {
				if (linkStyle === constants.linkStyle().DOUBLE_ARROW) {return loader.northIcon; }
				else if (linkStyle === constants.linkStyle().SINGLE_ARROW) {return loader.northArrowIcon; }
				else return undefined;
			}
			function getSouthInIcon(linkStyle) {
				if (linkStyle === constants.linkStyle().DOUBLE_ARROW) {return loader.southIcon; }
				else if (linkStyle === constants.linkStyle().SINGLE_ARROW) {return loader.southArrowIcon; }
				else return undefined;
			}
			// OUT
			function getEastOutIcon(linkStyle) {
				if (linkStyle === constants.linkStyle().DOUBLE_ARROW) {return loader.eastIcon; }
				else if (linkStyle === constants.linkStyle().SINGLE_ARROW &&
					self.isHighlighted())
					{ return loader.eastArrowIcon; }
				else return undefined;
			}
			function getWestOutIcon(linkStyle) {
				if (linkStyle === constants.linkStyle().DOUBLE_ARROW) {return loader.westIcon; }
				else if (linkStyle === constants.linkStyle().SINGLE_ARROW &&
					self.isHighlighted())
					{ return loader.westArrowIcon; }
				else return undefined;
			}
			function getNorthOutIcon(linkStyle) {
				if (linkStyle === constants.linkStyle().DOUBLE_ARROW) {return loader.northIcon; }
				else if (linkStyle === constants.linkStyle().SINGLE_ARROW &&
					self.isHighlighted())
					{ return loader.northArrowIcon; }
				else return undefined;
			}
			function getSouthOutIcon(linkStyle) {
				if (linkStyle === constants.linkStyle().DOUBLE_ARROW) {return loader.southIcon; }
				else if (linkStyle === constants.linkStyle().SINGLE_ARROW &&
					self.isHighlighted())
					{ return loader.southArrowIcon; }
				else return undefined;
			}
			// OUT REF
			function getEastOutRefIcon(linkStyle) {
				if (linkStyle === constants.linkStyle().DOUBLE_ARROW) {return loader.eastRefIcon; }
				else if (linkStyle === constants.linkStyle().SINGLE_ARROW &&
					self.isHighlighted())
				{ return loader.eastArrowIcon; }
				else return undefined;
			}
			function getWestOutRefIcon(linkStyle) {
				if (linkStyle === constants.linkStyle().DOUBLE_ARROW) {return loader.westRefIcon; }
				else if (linkStyle === constants.linkStyle().SINGLE_ARROW &&
					self.isHighlighted())
				{ return loader.westArrowIcon; }
				else return undefined;
			}
			function getNorthOutRefIcon(linkStyle) {
				if (linkStyle === constants.linkStyle().DOUBLE_ARROW) {return loader.northRefIcon; }
				else if (linkStyle === constants.linkStyle().SINGLE_ARROW &&
					self.isHighlighted())
				{ return loader.northArrowIcon; }
				else return undefined;
			}
			function getSouthOutRefIcon(linkStyle) {
				if (linkStyle === constants.linkStyle().DOUBLE_ARROW) {return loader.southRefIcon; }
				else if (linkStyle === constants.linkStyle().SINGLE_ARROW &&
					self.isHighlighted())
				{ return loader.southArrowIcon; }
				else return undefined;
			}

			self.getHighlightedShape = function() {
				var HLT_EXT = 4;
				return new Rectangle(
					self.connector.globalX() - getXShift() - HLT_EXT,
					self.connector.globalY() - getYShift() - HLT_EXT,
					self.width + 2* HLT_EXT,
					self.height + 2* HLT_EXT);
			};

			self.drawPort = function(ctx) {
				if (!self.isPortVisible()) {
					return;
				}
				var icon = self.getIcon();
				if (self.isHighlighted() || self.dndMode === constants.dndMode().DESTINATION) {
					drawHighlightedShape(ctx);
				}
				var x = self.connector.globalX() - getXShift();
				var y = self.connector.globalY() - getYShift();
				ctx.drawImage(icon, x, y);
			};

			var drawHighlightedShape = function(ctx) {
				ctx.strokeStyle = hltColor;
				ctx.fillStyle = self.dragMode === constants.dragMode().ACCEPT_PORT ? acceptColor : hltColor;
				var dndShape = self.getHighlightedShape();
				var x = dndShape.x;
				var y = dndShape.y;
				var w = dndShape.width;
				var h = dndShape.height;
				draw.roundRect(ctx, x, y, w, h, ARC);
			};

			self.setFixed = function(b) { self.connector.setFixed(b); };
			self.isFixed = function() { return self.connector.isFixed(); };

			self.setOrder = function(order) { return self.connector.setOrder(order); };
			self.getOrder = function() { return self.connector.getOrder(); };

			/**
			 * Positive offset value is a shift of the geometric center of the port
			 * from its connector along the corresponding axis in outward direction.
			 * Negative offset value is a shift in inward direction
			 */
			self.nodeOffset = 0;
			self.setOffset = function(offset) { self.nodeOffset = offset; };
			self.getOffset = function() { return self.nodeOffset; };

			self.setOffsetStep = function(step) {
				if (self.node.getFlowType() !== constants.flowType().DECISION) {
					self.connector.setOffsetStep(step);
				}
			};
			self.getOffsetStep = function() {
				return self.connector.getOffsetStep();
			};

			self.edgeList = [];
			self.addEdgeOnInit = function(edge) {
				self.edgeList = [];
				self.edgeList.push(edge);
			};
			self.addEdge = function(edge) {
				if (self.getDirection() !== constants.portDirection().NONE &&
					self.edgeList.length === 0) { // && edge.isValid())
					self.edgeList.push(edge);
				}
			};
			self.removeEdge = function(edge) {
				var i = self.edgeList.indexOf(edge);
				if ( i >= 0 && i < self.edgeList.length) {
					self.edgeList.splice(i, 1);
				}
			};
			self.getEdgesList = function() {
				return self.edgeList;
			};
			self.hasEdges = function() {
				return self.edgeList.length > 0;
			};

			self.getConnectionPoint = function() {
				return modelUtils.getEdgeConnectionPoint(self);
			};

			self.updateEdgesSourceSide = function(side) {
				for (i = 0; i < self.edgeList.length; i++) {
					self.edgeList[i].setSourceSide(side);
				}
			};

			self.updateEdgesSourcePort = function() {
				for (i = 0; i < self.edgeList.length; i++) {
					self.edgeList[i].setSourcePort(this);
				}
			};

			self.getAttachmentPoint = function() {
				var point = modelUtils.getEdgeConnectionPoint(self),
					newPnt = new Point(point.x, point.y),
					node = self.getNode(),
				// TODO: OFF_IN is very touchy for single arrow !!!
					OFF_IN = config.getLinkStyle() === constants.linkStyle().DOUBLE_ARROW ? 3 : -2,
					OFF = config.getLinkStyle() === constants.linkStyle().DOUBLE_ARROW ? 3 : 6;

				//if (self.getName() === "OUT-0" && self.getNode().getName() === "L1") {
				//	console.log("$$$$$$$$ getEdgeConnectionPoint: x="+point.x+", y="+point.y);
				//}
				// DOUBLE ARROW
				if (self.getDirection() === constants.portDirection().IN) { //} &&
					//config.getLinkStyle() === constants.linkStyle().DOUBLE_ARROW) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						if (node.getFlowType() === constants.flowType().LEFT_TOP) {
							newPnt.translate(0, -OFF_IN);
						} else if (node.getFlowType() === constants.flowType().RIGHT_BOTTOM) {
							newPnt.translate(0, OFF_IN);
						} else if (self.getType() === constants.portType().LINK_REF) {
							if (isMatchingSide(constants.nodeSide().LEFT)) {
								newPnt.translate(0, OFF_IN);
							} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
								newPnt.translate(0, -OFF_IN);
							}
						} else if (node.getFlowType() === constants.flowType().DECISION) {
							if (node.getInput() === constants.decisionInputs().BACK) {
								newPnt.translate(OFF_IN, 0);
							} else if (node.getInput() === constants.decisionInputs().LEFT) {
								newPnt.translate(0, OFF_IN);
							} else if (node.getInput() === constants.decisionInputs().RIGHT) {
								newPnt.translate(0, -OFF_IN);
							}
						} else {
							newPnt.translate(OFF_IN, 0);
						}
					} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
						if (node.getFlowType() === constants.flowType().LEFT_TOP) {
							newPnt.translate(-OFF_IN, 0);
						} else if (node.getFlowType() === constants.flowType().RIGHT_BOTTOM) {
							newPnt.translate(OFF_IN, 0);
						} else if (self.getType() === constants.portType().LINK_REF) {
							if (isMatchingSide(constants.nodeSide().LEFT)) {
								newPnt.translate(-OFF_IN, 0);
							} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
								newPnt.translate(OFF_IN, 0);
							}
						} else if (node.getFlowType() === constants.flowType().DECISION) {
							if (node.getInput() === constants.decisionInputs().BACK) {
								newPnt.translate(0, OFF_IN);
							} else if (node.getInput() === constants.decisionInputs().LEFT) {
								newPnt.translate(-OFF_IN, 0);
							} else if (node.getInput() === constants.decisionInputs().RIGHT) {
								newPnt.translate(OFF_IN, 0);
							}
						} else {
							newPnt.translate(0, OFF_IN);
						}
					}

				// SINGLE ARROW
				} else if (self.getDirection() === constants.portDirection().OUT &&
					config.getLinkStyle() === constants.linkStyle().SINGLE_ARROW) {

					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						if (self.getType() === constants.portType().LINK_REF) {
							if (isMatchingSide(constants.nodeSide().LEFT)) {
								newPnt.translate(0, OFF);
							} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
								newPnt.translate(0, -OFF);
							}
						} else if (node.getFlowType() === constants.flowType().LEFT_TOP) {
							newPnt.translate(0, -OFF);
						} else if (node.getFlowType() === constants.flowType().RIGHT_BOTTOM) {
							newPnt.translate(0, OFF);
						} else if (node.getFlowType() === constants.flowType().DECISION) {
							if (isMatchingSide(constants.nodeSide().FRONT)) {
								newPnt.translate(-OFF, 0);
							} else if (isMatchingSide(constants.nodeSide().BACK)) {
								newPnt.translate(OFF, 0);
							} else if (isMatchingSide(constants.nodeSide().LEFT)) {
								newPnt.translate(0, OFF);
							} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
								newPnt.translate(0, -OFF);
							}
						} else {
							if (self.isInverse()) {
								newPnt.translate(OFF, 0);
							} else {
								newPnt.translate(-OFF, 0);
							}
						}
					} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
						if (self.getType() === constants.portType().LINK_REF) {
							if (isMatchingSide(constants.nodeSide().LEFT)) {
								newPnt.translate(-OFF, 0);
							} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
								newPnt.translate(OFF, 0);
							}
						} else if (node.getFlowType() === constants.flowType().LEFT_TOP) {
							newPnt.translate(-OFF, 0);
						} else if (node.getFlowType() === constants.flowType().RIGHT_BOTTOM) {
							newPnt.translate(OFF, 0);
						} else if (node.getFlowType() === constants.flowType().DECISION) {
							if (isMatchingSide(constants.nodeSide().FRONT)) {
								newPnt.translate(0, -OFF);
							} else if (isMatchingSide(constants.nodeSide().BACK)) {
								newPnt.translate(0, OFF);
							} else if (isMatchingSide(constants.nodeSide().LEFT)) {
								newPnt.translate(-OFF, 0);
							} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
								newPnt.translate(OFF, 0);
							}
						} else {
							//newPnt.translate(0, -OFF);
							if (self.isInverse()) {
								newPnt.translate(0, OFF);
							} else {
								newPnt.translate(0, -OFF);
							}
						}
					}

				}
				return newPnt;
			};

			self.dndMode = constants.dndMode().NONE;
			self.setDNDMode = function(mode) { self.dndMode = mode; };
			self.getDNDMode = function() { return self.dndMode; };

			self.dragMode = constants.dragMode().NONE;
			self.setDragMode = function(mode) { self.dragMode = mode; };

			self.equals = function(another) {
				return another instanceof GraphPort &&
						self.getPath() === another.getPath();
			};

			self.getPath = function() {
				return "["+self.getNode().getName()+"/"+self.getName()+"]";
			};


			self.print = function() {
				return self.constructor.name +
					": "+self.getPath()+
					", type="+self.getType()+
					", direction="+self.getDirection()+
					", side="+self.getSide(); //+
					//", "+self.connector.print()+
					//", "+self.getPortBounds().showBounds();
			};

			self.printPort = function() {
				return self.getName()+
					", x="+(self.connector.globalX() - getXShift())+
					", y="+(self.connector.globalY() - getYShift())+
					", type="+self.getType()+
					", order="+self.getOrder()+
					", side="+self.getSide(); //+
					//", "+self.connector.showXY()+
					//", "+self.connector.showGlobalXY()+
					//", "+self.connector.getOrder();
					//", "+self.getPortBounds().showBounds();
			};

			self.init();

		}
		jsUtils.inherit(GraphPort, GraphElement);
		return GraphPort;
	}
);