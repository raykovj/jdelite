define('modules/graph/graphRefPort',
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

        function GraphRefPort(connector) {
            GraphPort.call(this, connector);

            var self = this;
            var hltColor = constants.colors().EDGE,
                acceptColor = constants.colors().ACCEPT_PORT,
                ARC = 4,
                HLT_EXT = 1;
            var tooltip = "";

            self.getType = function() {
                return constants.portType().REF;
            };

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
                tooltip = b ? self.getPath() : undefined;
                return b;
            };

            self.hasPoint = function(point) {
                var b =  getDNDShape().containsXY(point.x, point.y);
                //tooltip = b ? self.getPath() : undefined;
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
                    if (self.getDirection() === constants.portDirection().REF_OUT) { return "Drag to create an association"; }
                    else if (self.getDirection() === constants.portDirection().REF_IN) { return "Drag to create an association"; }
                }
            }


            self.getIcon = function() {
                var direction = self.getDirection(),
                    image;
                if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
                    if (isMatchingSide(constants.nodeSide().FRONT)) {
                        image = direction === constants.portDirection().REF_OUT ? loader.eastRefNewIcon : loader.westRefNewIcon;
                    } else if (isMatchingSide(constants.nodeSide().BACK)) {
                        image =  direction === constants.portDirection().REF_OUT ? loader.westRefNewIcon : loader.eastRefNewIcon;
                    } else if (isMatchingSide(constants.nodeSide().LEFT)) {
                        image =  direction === constants.portDirection().REF_OUT ? loader.northRefNewIcon : loader.southRefNewIcon;
                    } else if (isMatchingSide(constants.nodeSide().RIGHT)) {
                        image =  direction === constants.portDirection().REF_OUT ? loader.southRefNewIcon : loader.northRefNewIcon;
                    }
                } else {
                    if (isMatchingSide(constants.nodeSide().FRONT)) {
                        image =  direction === constants.portDirection().REF_OUT ? loader.southRefNewIcon : loader.northRefNewIcon;
                    } else if (isMatchingSide(constants.nodeSide().BACK)) {
                        image =  direction === constants.portDirection().REF_OUT ? loader.northRefNewIcon : loader.southRefNewIcon;
                    } else if (isMatchingSide(constants.nodeSide().LEFT)) {
                        image =  direction === constants.portDirection().REF_OUT ? loader.eastRefNewIcon : loader.westRefNewIcon;
                    } else if (isMatchingSide(constants.nodeSide().RIGHT)) {
                        image =  direction === constants.portDirection().REF_OUT ? loader.westRefNewIcon : loader.eastRefNewIcon;
                    }
                }
                self.setRectSize(image.width, image.height);
                return image;
            };

            function isMatchingSide(value) {
                return ((self.getSide() & value) > 0);
            }

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

            //self.setFixed = function(b) { self.connector.setFixed(b); };
            //self.isFixed = function() { return self.connector.isFixed(); };
            //self.getOrder = function() { return self.connector.getOrder(); };

            /**
             * Positive offset value is a shift of the geometric center of the port
             * from its connector along the corresponding axis in outward direction.
             * Negative offset value is a shift in inward direction
             */
                //self.nodeOffset = 0;
                //self.setOffset = function(offset) { self.nodeOffset = offset; };
                //self.getOffset = function() { return self.nodeOffset; };

                //self.setOffsetStep = function(step) {
                //	if (self.node.getFlowType() !== constants.flowType().DECISION) {
                //		self.connector.setOffsetStep(step);
                //	}
                //};
                //self.getOffsetStep = function() {
                //	return self.connector.getOffsetStep();
                //};

                //self.edgeList = [];
                //self.addEdgeOnInit = function(edge) {
                //	self.edgeList = [];
                //	self.edgeList.push(edge);
                //};
                //self.addEdge = function(edge) {
                //	if (self.getDirection() !== constants.portDirection().NONE &&
                //		self.edgeList.length === 0) { // && edge.isValid()) {
                //		self.edgeList.push(edge);
                //	}
                //};
                //self.removeEdge = function(edge) {
                //	var i = self.edgeList.indexOf(edge);
                //	if ( i <= 0 && i < self.edgeList.length) {
                //		self.edgeList.splice(i, 1);
                //	}
                //};
                //self.getEdgesList = function() {
                //	return self.edgeList;
                //};
                //self.hasEdges = function() {
                //	return self.edgeList.length > 0;
                //};

                //self.getAttachmentPoint = function() {
                //	return modelUtils.getEdgeConnectionPoint(self);
                //};

                //self.equals = function(another) {
                //	return another instanceof GraphPort &&
                //		self.node === another.node &&
                //		self.name === another.name &&
                //		self.connector.equals(another.connector);
                //};

                //self.getPath = function() {
                //	return "";
                //};


                //self.print = function() {
                //	return self.constructor.name +
                //		": "+self.getName()+
                //		", node:"+self.node.getName()+
                //		", "+self.connector.print()+
                //		", "+self.getPortBounds().showBounds();
                //};

            self.init();

        }
        jsUtils.inherit(GraphRefPort, GraphPort);
        return GraphRefPort;
    }
);