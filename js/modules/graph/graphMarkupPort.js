define('modules/graph/graphMarkupPort',
	['modules/geometry/rectangle',
		'modules/graph/graphPort',
		'modules/graph/graphNode',
		'modules/graph/connector',
		'modules/draw/draw',
		'modules/graph/graphConstants',
		'modules/graph/modelUtils',
		'modules/settings/config',
		'modules/html/iconLoader',
		'modules/core/jsUtils'],
	function(Rectangle,
	         GraphPort,
	         GraphNode,
	         Connector,
	         draw,
	         constants,
	         modelUtils,
	         config,
			 loader,
	         jsUtils) {

		function GraphMarkupPort(connector, inverse) {
			GraphPort.call(this, connector);

			var self = this;
			var hltColor = constants.colors().EDGE,
				acceptColor = constants.colors().ACCEPT_PORT,
				ARC = 4,
				HLT_EXT = 1;
			var tooltip = "";

			self.getType = function() {
				return constants.portType().MARKUP;
			};

			var _markupOrder;
			self.setMarkupOrder = function(order) {
				_markupOrder = order;
				self.setOrder(order);
			};
			self.getMarkupOrder = function() { return _markupOrder; };

			self.inverse = inverse;

			self.init = function() {
				// at this point some values are off, they are adjusted later
				self.setRectSize(constants.portDefSize().WIDTH, constants.portDefSize().HEIGHT);
				self.setRectLocation(
					self.connector.globalX() - Math.floor(self.width/2),
					self.connector.globalY() - Math.floor(self.height/2));
				self.setVisible(false);
			};

			self.getAttachmentPoint = function() {
				return modelUtils.getEdgeConnectionPoint(self);
			};

			//self.getPortBounds = function() {
			//	return getDNDShape();
			//};

			function getDNDShape() {
				return new Rectangle(
					self.connector.globalX() - Math.floor(self.width/2) - HLT_EXT,
					self.connector.globalY() - Math.floor(self.height/2) - HLT_EXT,
					self.width + 2* HLT_EXT,
					self.height + 2* HLT_EXT);
			}

			self.containsPoint = function(point) {
				var b = self.isVisible() && getDNDShape().containsXY(point.x, point.y);
				tooltip = b ? getTooltipProperty() : undefined;
				return b;
			};

			self.hasPoint = function(point) {
				var b =  getDNDShape().containsXY(point.x, point.y);
				tooltip = b ? getTooltipProperty() : undefined;
				return b;
			};

			self.getTooltip = function() {
				return tooltip;
			};

			function getTooltipProperty() {
				if (config.hasShowTooltip()) {
				//if (true) {
					return self.getPath();
				} else {
					if (self.getDirection() === constants.portDirection().MARK_OUT ||      // 5
						self.getDirection() === constants.portDirection().MARK_OUT_AUX) {  // 6
						return "Drag to create new output connection";
					}
					else if (self.getDirection() === constants.portDirection().MARK_IN ||  // 3
						self.getDirection() === constants.portDirection().MARK_IN_AUX) {   // 4
						return "Drag to create new input connection";
					}
				}
			}

			self.getIcon = function() {
				var direction = self.getDirection(),
					image;
				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					if (isMatchingSide(constants.nodeSide().FRONT)) {
						image = isMarkOut(direction) ? loader.eastNewIcon : loader.westNewIcon;
					} else if (isMatchingSide(constants.nodeSide().BACK)) {
						image = isMarkOut(direction) ? loader.westNewIcon : loader.eastNewIcon;
					} else if (isMatchingSide(constants.nodeSide().LEFT)) {
						image = isMarkOut(direction) ? loader.northNewIcon : loader.southNewIcon;
					} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
						image = isMarkOut(direction) ? loader.southNewIcon : loader.northNewIcon;
					}
				} else {
					if (isMatchingSide(constants.nodeSide().FRONT)) {
						image = isMarkOut(direction) ? loader.southNewIcon : loader.northNewIcon;
					} else if (isMatchingSide(constants.nodeSide().BACK)) {
						image = isMarkOut(direction) ? loader.northNewIcon : loader.southNewIcon;
					} else if (isMatchingSide(constants.nodeSide().LEFT)) {
						image = isMarkOut(direction) ? loader.eastNewIcon : loader.westNewIcon;
					} else if (isMatchingSide(constants.nodeSide().RIGHT)) {
						image = isMarkOut(direction) ? loader.westNewIcon : loader.eastNewIcon;
					}
				}
				self.setRectSize(image.width, image.height);
				return image;
			};

			function isMarkIn(direction) {
				return direction === constants.portDirection().MARK_IN || direction === constants.portDirection().MARK_IN_AUX;
			}

			function isMarkOut(direction) {
				return direction === constants.portDirection().MARK_OUT || direction === constants.portDirection().MARK_OUT_AUX;
			}

			function isMatchingSide(value) {
				return ((self.getSide() & value) > 0);
			}

			//self.getSelectedIcon = function() {
			//	var side = self.getSide(), direction = self.getDirection(), image;
			//	if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
			//		if (side === constants.nodeSide().FRONT) {
			//			image = direction === constants.portDirection().OUT ? self.eastSelIcon : self.westSelIcon;
			//		} else if (side === constants.nodeSide().BACK) {
			//			image =  direction === constants.portDirection().OUT ? self.westSelIcon : self.eastSelIcon;
			//		} else if (side === constants.nodeSide().LEFT) {
			//			image =  direction === constants.portDirection().OUT ? self.northSelIcon : self.southSelIcon;
			//		} else if (side === constants.nodeSide().RIGHT) {
			//			image =  direction === constants.portDirection().OUT ? self.southSelIcon : self.northSelIcon;
			//		}
			//	} else {
			//		if (side === constants.nodeSide().FRONT) {
			//			image =  direction === constants.portDirection().OUT ? self.southSelIcon : self.northSelIcon;
			//		} else if (side === constants.nodeSide().BACK) {
			//			image =  direction === constants.portDirection().OUT ? self.northSelIcon : self.southSelIcon;
			//		} else if (side === constants.nodeSide().LEFT) {
			//			image =  direction === constants.portDirection().OUT ? self.eastSelIcon : self.westSelIcon;
			//		} else if (side === constants.nodeSide().RIGHT) {
			//			image =  direction === constants.portDirection().OUT ? self.westSelIcon : self.eastSelIcon;
			//		}
			//	}
			//	self.setRectSize(image.width, image.height);
			//	return image;
			//};

			self.drawPort = function(ctx) {
				if (!self.isVisible()) {
					return;
				}
				if (self.isHighlighted() ||
						self.dndMode === constants.dndMode().ORIGIN ||
						self.dndMode === constants.dndMode().DESTINATION) {
					drawHighlightedShape(ctx);
				}
				var x = self.connector.globalX() - Math.floor(self.width/2);
				var y = self.connector.globalY() - Math.floor(self.height/2);
				//ctx.drawImage(self.isSelected() ? self.getSelectedIcon() : self.getIcon(), x, y);
				ctx.drawImage(self.getIcon(), x, y);
			};

			var drawHighlightedShape = function(ctx) {
				ctx.strokeStyle = hltColor;
				ctx.fillStyle = self.dragMode === constants.dragMode().ACCEPT_PORT ? acceptColor : hltColor;
				var dndShape = getDNDShape();
				var x = dndShape.x;
				var y = dndShape.y;
				var w = dndShape.width;
				var h = dndShape.height;
				//var x = self.connector.globalX() - Math.floor(self.width/2) - HLT_EXT;
				//var y = self.connector.globalY() - Math.floor(self.height/2) - HLT_EXT;
				//var w = self.width + 2*HLT_EXT;
				//var h = self.height + 2*HLT_EXT;
				draw.roundRect(ctx, x, y, w, h, ARC);
			};

			self.init();

		}
		jsUtils.inherit(GraphMarkupPort, GraphPort);
		return GraphMarkupPort;
	}
);