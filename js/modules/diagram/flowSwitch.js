define('modules/diagram/flowSwitch',
    ['modules/graph/graphNode',
        'modules/diagram/flowNode',
        'modules/draw/draw',
        'modules/draw/drawUtils',
        'modules/geometry/rectangle',
        'modules/geometry/point',
        'modules/graph/graphConstants',
        'modules/graph/modelUtils',
        'modules/diagram/diagramUtils',
        'modules/flow/flowUtils',
        'modules/settings/config',
        'modules/gallery/iconOptionsPicker',
        'modules/common/map',
        'modules/html/iconLoader',
        'modules/core/jsUtils'],
    function(GraphNode,
             FlowNode,
             draw,
             drawUtils,
             Rectangle,
             Point,
             constants,
             modelUtils,
             diagramUtils,
             flowUtils,
             config,
             iconPicker,
             Map,
             loader,
             jsUtils) {
        function FlowSwitch(name, flowManager, isFootprint) {
            FlowNode.call(this, name, constants.flowType().SWITCH, flowManager);

            var self = this,
                _flowManager = flowManager,
                _flowLayout = flowManager.getFlowLayout();

            var NAME_LENGTH = 10,
                _ARC = 2,
                _SHADE = constants.nodeSurface().SHADE,
                _FRAME = constants.nodeSurface().FRAME;

            self.nodeIcon = iconPicker.getIconImage(config.getQuizDefIconKey());

            var _nColor = constants.colors().NODE_D,
                _hltColor = constants.colors().NODE_HLT_D,
                _selColor = constants.colors().NODE_SEL_D,
                tooltip,
                _nameTooltip,
                _drawState = constants.drawState().NONE;

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
                _useMyBgnColor = true;
            };
            self.getDefBgnColor = function() { return _myDefBgnColor; };
            ////
            self.setFgnColor = function(color) {
                _myFgnColor = color;
                _useMyFgnColor = true;
            };
            self.getFgnColor = function() { return _myFgnColor; };
            self.resetFgnColor = function() {
                self.setFgnColor(_myDefFgnColor);
            };
            self.getDefFgnColor = function() { return _myDefFgnColor; };

            ///////////////////////////

            //var _expanded = isFootprint ? false: true,
            var _expanded = true,
                _hooksNumber = 1,
                _hooksPositions = [],
                _startLevelNum,
                _endLevelNum,
                _startLaneNum,
                _endLaneNum,
                _allowEdit = config.isEditMode();

            self.isExpanded = function() { return _expanded; };
            self.getContentNodes = function() { return []; };

            //////

            self.getTextDefaults = function() {
                return {
                    maxWidth: constants.contentSize().WIDTH,
                    maxHeight: constants.contentSize().HEIGHT,
                    maxLines: constants.contentSize().MAX_LINES,
                    extentWidth: constants.contentViewExt().WIDTH,
                    extentHeight: constants.contentViewExt().HEIGHT
                }
            };

            self.getEffectiveWidth = function(w, h) {
                return w;
            };

            self.getEffectiveHeight = function(w, h) {
                return h;
            };

            //////

            self.setSwitchInitialSize = function(w, h) {
                self.calculateContentParams();
                self.setSize(
                    w ? w : config.getGlobalSwitchWidth(),
                    h ? h : config.getGlobalSwitchHeight());
                modelUtils.adjustSize(self);
            };

            //////
            //self.getGridAcross = function() { return _gridAcross; };
            //self.setGridAcross = function(n) {
            //    if (n >= 0) { _gridAcross = n; }
            //    else {
            //        _gridAcross = 0;
            //        //console.log("Bad value for grid ACROSS: "+n);
            //    }
            //};

            self.getHooksNumber = function() { return _hooksNumber; };
            self.setHooksNumber = function(n) {
                if (n >= 1) { _hooksNumber = n; }
                else { _hooksNumber = 1; }
            };

            self.getStartLevelNumber = function() { return _startLevelNum; };
            self.setStartLevelNumber = function(n) { _startLevelNum = n; };

            self.getEndLevelNumber = function() { return _endLevelNum; };
            self.setEndLevelNumber = function(n) { _endLevelNum = n; };

            self.getStartLaneNumber = function() { return _startLaneNum; };
            self.setStartLaneNumber = function(n) { _startLaneNum = n; };

            self.getEndLaneNumber = function() { return _endLaneNum; };
            self.setEndLaneNumber = function(n) { _endLaneNum = n; };


            // TODO !!!
            self.canExtendAcross = function() {
                var //prevStartLane = _flowLayout.getLanes()[_startLaneNum - 1],
                    //nextEndLane = _flowLayout.getLanes()[_endLaneNum + 1],
                    testOffsets = flowUtils.getSwitchHookOffsets(_hooksNumber+1),
                    parentContainer = self.getContainerReference();
                if (parentContainer) {
                    //return _startLaneNum > parentContainer.getStartLaneNumber() &&
                    //    prevStartLane.hasLevelRangeEmpty(_startLevelNum, _endLevelNum) &&
                    //    _endLaneNum < parentContainer.getEndLaneNumber() &&
                    //    nextEndLane.hasLevelRangeEmpty(_startLaneNum, _endLaneNum);
                    return (self.laneNum - testOffsets.startLaneOffset) >= parentContainer.getStartLaneNumber() &&
                            (self.laneNum + testOffsets.endLaneOffset) <= parentContainer.getEndLaneNumber();
                } else {
                    return (self.laneNum - testOffsets.startLaneOffset) >= flowUtils.getMinLaneNumber() &&
                        (self.laneNum + testOffsets.endLaneOffset) <= flowUtils.getMaxLaneNumber(_flowLayout) &&
                        !flowUtils.hasSwitchConflictToSiblingAcross(
                            _flowManager.getModelHandler().getFlowModel(), self.getNodeObject(), testOffsets) &&
                        !flowUtils.hasSwitchStartEndLanesConflictAcross(
                            _flowManager.getModelHandler().getFlowModel(), self.getNodeObject(), testOffsets);
                }
            };

            self.canShrinkAcross = function() {
                return _endLaneNum > _startLaneNum &&
                        _hooksNumber > self.outputPorts.length;
            };

            self.resizeOutline = function(resizeParam) {
                _flowManager.getFlowController().resizeSwitchOutline(self, resizeParam);
            };

            function printExpandedOutline() {
                console.log("*** container: "+self.getName()+
                    ":\n_startLevelNum = "+_startLevelNum+
                    ", _endLevelNum = "+_endLevelNum+
                    ", _startLaneNum = "+_startLaneNum+
                    ", _endLaneNum = "+_endLaneNum
                );
            }

            // WARNING: changes will affect expanded outline
            self.getOutlineSteps = function() {
                var container = self.getContainerReference(),
                    allNodes = _flowManager.getModelHandler().getFlowNodes(),
                    levelsNum = flowUtils.getNestedContainersNumberAtNodeLevel(self, allNodes),
                    lanesNum = flowUtils.getNestedContainersNumberAtNodeLane(self, allNodes),
                    offsets = //config.getFlowDirection() === constants.flow().VERTICAL ?
                    {
                        front: 	constants.cellGap().HEIGHT, //*2 + levelsNum * (constants.cellGap().HEIGHT/2), // 14
                        back: 	constants.cellGap().HEIGHT, //*2 + levelsNum * (constants.cellGap().HEIGHT/2), // 14
                        left: 	constants.cellGap().WIDTH, //*2 + lanesNum * constants.cellGap().WIDTH, // 24
                        right: 	constants.cellGap().WIDTH //*2 + lanesNum  * constants.cellGap().WIDTH // 24
                    }; //:
                    //{
                    //    front: 	constants.cellGap().WIDTH, //*2 + levelsNum * (constants.cellGap().WIDTH/2), // 24
                    //    back: 	constants.cellGap().WIDTH, //*2 + levelsNum * (constants.cellGap().WIDTH/2), // 24
                    //    left: 	constants.cellGap().HEIGHT, //*2 + lanesNum * constants.cellGap().HEIGHT, // 14
                    //    right: 	constants.cellGap().HEIGHT //*2 + lanesNum  * constants.cellGap().HEIGHT // 14
                    //} ;
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

            function getSwitchBarRect() {
                var barX, barY, barW, barH,
                    startLane = _flowLayout.getLanes()[_startLaneNum],
                    endLane = _flowLayout.getLanes()[_endLaneNum],
                    outline = getExpandedOutline(),
                    barStart = config.getFlowDirection() === constants.flow().VERTICAL ?
                        //startLane.x + Math.floor(startLane.width/2) : startLane.y + Math.floor(startLane.height/2),
                        startLane.x + startLane.width/2 : startLane.y + startLane.height/2,
                    barEnd = config.getFlowDirection() === constants.flow().VERTICAL ?
                        //endLane.x + Math.floor(endLane.width/2) : endLane.y + Math.floor(endLane.height/2),
                        endLane.x + endLane.width/2 : endLane.y + endLane.height/2,
                    off = 10,
                    thickness = 2;
                if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    barX = _hooksNumber === 1 ? outline.x + Math.floor(outline.width/2) - off : barStart;
                    barY = outline.y + outline.height;
                    barW = _hooksNumber === 1 ? 2*off : barEnd - barStart;
                    barH = thickness;
                } else {
                    barX = outline.x + outline.width;
                    barY = _hooksNumber === 1 ? outline.y + Math.floor(outline.height/2) - off : barStart;
                    barW = thickness;
                    barH = _hooksNumber === 1 ? 2*off : barEnd - barStart;
                }
                return new Rectangle(barX, barY, barW, barH);
            }

            /////////////////////////////
            function getExpandedOutline() {
                var ctrX, ctrY, ctrW, ctrH,
                    steps = self.getOutlineSteps();
                //console.log("exp outline: start="+_startLaneNum+", end="+_endLaneNum);
                if (_startLevelNum === _endLevelNum && _startLaneNum === _endLaneNum) {
                    var ctrCell = diagramUtils.getCellRectAt(_flowManager, _startLevelNum, _startLaneNum);
                    //console.log("B1: cell rect at: "+ctrCell.showBounds());
                    ctrX = ctrCell.x;
                    ctrY = ctrCell.y;
                    ctrW = ctrCell.width < self.width ? self.width : ctrCell.width;
                    ctrH = ctrCell.height < self.height ? self.height : ctrCell.height;
                } else {
                    var startTopCell = diagramUtils.getCellRectAt(_flowManager, _startLevelNum, _startLaneNum),
                        endBottomCell = diagramUtils.getCellRectAt(_flowManager, _endLevelNum, _endLaneNum);
                    ctrX = startTopCell.x;
                    ctrY = startTopCell.y;
                    ctrW = endBottomCell.x + endBottomCell.width - startTopCell.x;
                    ctrH = endBottomCell.y + endBottomCell.height - startTopCell.y;
                }

                //var offsetX = Math.floor((ctrW - self.width)/2),
                //    offsetY = Math.floor((ctrH - self.height)/2);
                var offsetX = (ctrW - self.width)/2,
                    offsetY = (ctrH - self.height)/2;

                if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    ctrX += Math.floor((steps.right + steps.left)/2); //steps.right;
                    ctrY += offsetY; //steps.back;
                    ctrW -= (steps.right + steps.left);
                    ctrH -= 2*offsetY;
                    //ctrH -= (steps.back + steps.front);
                    //ctrW -= 2*offsetX;
                } else {
                    ctrX += offsetX; //steps.back;
                    ctrY += Math.floor((steps.right + steps.left)/2); //steps.left;
                    ctrW -= 2*offsetX;
                    ctrH -= (steps.left + steps.right);
                    //ctrW -= (steps.back + steps.front);
                    //ctrH -= 2*offsetY;
                }

                //console.log("SW1: outline: "+ctrX+", "+ctrY+", "+ctrW+", "+ctrH);
                return new Rectangle(ctrX, ctrY, ctrW, ctrH);
            }

            var _menuImg = loader.menu20x16,
                _menuImgSize = 20;
            function getMenuShape() {
                var outline = getExpandedOutline();
                return new Rectangle(getDiamondX(outline) - 2, getDiamondY(outline) - 16, _menuImgSize, _menuImgSize);
            }

            //////
            self.nameRect = new Rectangle(0,0,0,0);
            //
            self.initNode = function() {};

            self.getPortLayout = function() {
                //return constants.portLayout().ALIGN_CENTER;
                return constants.portLayout().ALIGN_ON_LANES;
            };

            self.setInitialBounds = function() {
                // ALONG
                _startLevelNum = self.getLevelNumber();
                _endLevelNum = self.getLevelNumber();

                // ACROSS
                // TODO: decouple left and right ???
                var laneOffsets = flowUtils.getSwitchHookOffsets(_hooksNumber);
                _startLaneNum = self.getLaneNumber() - laneOffsets.startLaneOffset;
                _endLaneNum = self.getLaneNumber() + laneOffsets.endLaneOffset;

                _hooksPositions = self.getHooksPositions();

                self.createMarkupInPort(constants.nodeSide().BACK);
                // TODO: visible only on empty hooks
                self.markupOutputPorts = [];
                for (var i = 0; i < _hooksNumber; i++) {
                    self.createMarkupOutPort(constants.nodeSide().FRONT, i);
                }
                //console.log("init: hooks="+_hooksNumber+", mkOutPorts="+self.markupOutputPorts.length);
                //console.log("==== markupOutputPorts");
                //for (i = 0; i < self.markupOutputPorts.length; i++) {
                //    console.log(" - mkport: "+self.markupOutputPorts[i].getName());
                //}
            };

            self.getHooksParams = function() {
                // output locations
                var outputPorts = self.getOutputPorts();

            };

            self.getHooksPositions = function() {
                var positions = [],
                    outline = getExpandedOutline(),
                    offset;
                for (var i = _startLaneNum; i <= _endLaneNum; i++) {
                    if (i === 0 && _hooksNumber === 1) {
                        offset = config.getFlowDirection() === constants.flow().VERTICAL ?
                            outline.x + outline.width/2 : outline.y + outline.height/2;
                        positions.push(Math.floor(offset));
                        break;
                    }
                    var lane = _flowLayout.getLanes()[i];
                    if (config.getFlowDirection() === constants.flow().VERTICAL) {
                        offset = lane.x + Math.floor(lane.width/2) - outline.x;
                    } else {
                        offset = lane.y + Math.floor(lane.height/2) - outline.y;
                    }
                    if ( i > 0 || i < _endLaneNum-1) {
                        offset -= 1;
                    }
                    //else {
                    //    offset += 10;
                    //}
                    positions.push(offset);
                }
                return positions;
            };


            self.initGroupNode = function() {
                // ???
            };

            self.getX = function() {
                if (!_expanded) { return self.x; }
                else { return getExpandedOutline().x; }
            };

            self.getY = function() {
                if (!_expanded) { return self.y; }
                else { return getExpandedOutline().y; }
            };

            self.getNodeWidth = function() {
                if (!_expanded) {
                    return self.width;
                }
                else { return getExpandedOutline().width; }
            };

            self.getNodeHeight = function() {
                if (!_expanded) {
                    return self.height;
                }
                else { return getExpandedOutline().height; }
            };

            ///////
            self.getContainerLevelNumberForPort = function(port) {
                if (!_expanded) {
                    return self.getLevelNumber();
                } else {
                    if (port.getSide() === constants.nodeSide().BACK) {
                        return _startLevelNum;
                    } else
                    if (port.getSide() === constants.nodeSide().FRONT) {
                        return _endLevelNum;
                    } else
                    if (port.getSide() === constants.nodeSide().RIGHT) {
                        return self.getLevelNumber();
                    } else
                    if (port.getSide() === constants.nodeSide().LEFT) {
                        return self.getLevelNumber();
                    }
                }
            };

            self.getContainerLaneNumberForPort = function(port) {
                if (!_expanded) {
                    return self.getLaneNumber();
                } else {
                    if (port.getSide() === constants.nodeSide().RIGHT) {
                        return config.getFlowDirection() === constants.flow().VERTICAL ?
                            _startLaneNum : _endLaneNum;
                    } else
                    if (port.getSide() === constants.nodeSide().LEFT) {
                        return config.getFlowDirection() === constants.flow().VERTICAL ?
                            _endLaneNum : _startLaneNum;
                    }
                    if (port.getSide() === constants.nodeSide().BACK) {
                        return self.getLaneNumber();
                    } else
                    if (port.getSide() === constants.nodeSide().FRONT) {
                        return self.getLaneNumber();
                    }
                }
            };

            ///////
            self.getNodeObject = function() {
                var node = self.getNodeObjectToSave();

                node.width = self.getNodeWidth();
                node.height = self.getNodeHeight();

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

                node.expanded = _expanded;
                node.containerName = self.getContainerName();
                //node.gridAcross = _gridAcross;
                node.hooks = _hooksNumber;

                node.startLevelNum = _startLevelNum;
                node.endLevelNum = _endLevelNum;
                node.startLaneNum = _startLaneNum;
                node.endLaneNum = _endLaneNum;

                //node.resizeW = self.getResizeW();
                //node.resizeH = self.getResizeH();

                if (self.getContentText().length > 0) { node.contentText = self.getContentText(); }
                if (self.getContentTextAbove().length > 0) { node.textAbove = self.getContentTextAbove(); }
                if (self.getContentTextBelow().length > 0) { node.textBelow = self.getContentTextBelow(); }

                if (_useMyBgnColor && _myBgnColor.localeCompare(_myDefBgnColor) != 0 ||
                    _useMyFgnColor && _myFgnColor.localeCompare(_myDefFgnColor) != 0) {
                    node.bgnColor = _myBgnColor;
                    node.fgnColor = _myFgnColor;
                }
                return node;
            };

            // used for edge layout restrictions
            // return list of all cells
            self.getCellsWithVisibleNodes = function() {
                var startLevel = _flowLayout.getLevels()[_startLevelNum],
                    cells  = startLevel.getCellsInRange(_startLaneNum, _endLaneNum);
                    //emptyCells = startLevel.getEmptyCellsInRange(_flowLayout, _startLaneNum, _endLaneNum);
                //cells = cells.concat(emptyCells);
                return cells;
            };

            self.getContainerEmptyCells = function() {
                //var startLevel = _flowLayout.getLevels()[_startLevelNum],
                //    emptyCells = startLevel.getEmptyCellsInRange(_flowLayout, _startLaneNum, _endLaneNum);

                return [];
            };

            self.getCellContainerOffsets = function() {
                var container = self.getContainerReference(),
                    allNodes = _flowManager.getModelHandler().getFlowNodes(),
                    levelsNum = flowUtils.getNestedContainersNumberAtNodeLevel(self, allNodes),
                    lanesNum = flowUtils.getNestedContainersNumberAtNodeLane(self, allNodes),
                    offsets = {
                        //front:  constants.cellGap().HEIGHT + levelsNum * constants.cellGap().HEIGHT,
                        //back:   constants.cellGap().HEIGHT + levelsNum * constants.cellGap().HEIGHT,
                        //left:   constants.cellGap().WIDTH + lanesNum * constants.cellGap().WIDTH,
                        //right:  constants.cellGap().WIDTH + lanesNum * constants.cellGap().WIDTH
                        front:  levelsNum * constants.cellGap().HEIGHT,
                        back:   levelsNum * constants.cellGap().HEIGHT,
                        left:   lanesNum * constants.cellGap().WIDTH,
                        right:  lanesNum * constants.cellGap().WIDTH
                    };
                if (container) {
                    if (config.getFlowDirection() === constants.flow().VERTICAL) {
                        // VERTICAL
                        if (self.getLevelNumber() === container.getEndLevelNumber()) {
                            offsets.front = container.getOutlineSteps().front + constants.cellGap().HEIGHT;
                        }
                        if (self.getLaneNumber() === container.getStartLaneNumber()) {
                            offsets.right = container.getOutlineSteps().right; // + constants.cellGap().WIDTH;
                        }
                        if (self.getLaneNumber() === container.getEndLaneNumber()) {
                            offsets.left = container.getOutlineSteps().left; // + constants.cellGap().WIDTH;
                        }
                    } else {
                        // HORIZONTAL
                        if (self.getLevelNumber() === container.getEndLevelNumber()) {
                            offsets.front = container.getOutlineSteps().front + constants.cellGap().WIDTH;
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

            function isCellInContainer(cell, container) {
                return 	cell.getLevelNumber() >= container.getStartLevelNumber() &&
                    cell.getLevelNumber() <= container.getEndLevelNumber() &&
                    cell.getLaneNumber() >= container.getStartLaneNumber() &&
                    cell.getLaneNumber() <= container.getEndLaneNumber();
            }

            self.containsCell = function(cell) {
                return isCellInContainer(cell, self);
            };

            // in & out link for this container node
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

            self.isSizeAdjustable = function() {
                return !_expanded;
            };

            self.getWrapper = function() {
                return new Rectangle(self.x, self.y, self.width, self.height);
            };

            self.getNodeBounds = function() {
                var r = !_expanded ? self : getExpandedOutline();
                return new Rectangle(r.x-2*_SHADE, r.y-2*_SHADE, r.width+4*_SHADE, r.height+4*_SHADE);
            };

            self.getInnerShape = function() {
                var r = !_expanded ? self : getExpandedOutline();
                return new Rectangle(r.x+_FRAME, r.y+_FRAME, r.width-2*_FRAME, r.height-2*_FRAME);
            };

            self.getExpandedShape = function() {
                return getExpandedOutline();
            };

            self.containsPoint = function(point) {
                return self.getNodeBounds().hasPointInside(point);
            };

            self.getSelectedAtPoint = function(point, fromInside) {
                if (!self.containsPoint(point)) {
                    return undefined;
                }
                var menuShape = getMenuShape();
                if (_allowEdit && menuShape.containsXY(point.x, point.y)) {
                    _flowManager.getCaller().showSwitchResizeBar(self);
                }
                return self;
            };

            self.setHighlightedAtPoint = function(point) {
                //console.log("setHighlightedAtPoint - "+self.showBounds()+", point - "+point.showXY());
                var b = self.containsPoint(point);
                self.showMarkupPorts(b, point);

                if (config.hasShowRefHandles()) {
                    self.showRefPorts(b, point);
                    self.locateRefPorts();
                }

                self.locateMarkupPorts(point);

                var port, i, found = false;
                var allPorts = self.getConnectionPorts();
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
                    if (self.nameRect.hasPointInside(point)) {
                        _nameTooltip = self.getName();
                    } else {
                        _nameTooltip = undefined;
                    }
                    if (!found) {
                        tooltip = config.hasShowTooltip() ? self.getName() : undefined;
                        found = true;
                    }
                } else {
                    self.setHighlighted(false);
                    tooltip = undefined;
                    _nameTooltip = undefined;
                }
                return found;
            };

            self.getTooltip = function() { return tooltip; };

            self.getNameTooltip = function() {
                //if (_nameTooltip) {
                //	return _nameTooltip + " ends: "+self.getEnds();
                //}
                return _nameTooltip;
            };

            self.getCnxRestrictions = function() {
                var cnxSides = {};
                cnxSides.front = true;
                cnxSides.back = self.getPortsForSide(constants.nodeSide().BACK).length === 0;
                cnxSides.left = true;
                cnxSides.right = true;
                if (!self.getContainerReference()) {
                    return cnxSides;
                } else {
                    var container = self.getContainerReference();
                    if (config.getFlowDirection() === constants.flow().VERTICAL) {
                        if (self.getEndLevelNumber() === container.getEndLevelNumber()) { cnxSides.front = false; }
                        if (self.getStartLevelNumber() === container.getStartLevelNumber()) { cnxSides.back = false; }
                        if (self.getStartLaneNumber() === container.getStartLaneNumber()) { cnxSides.right = false; }
                        if (self.getEndLaneNumber() === container.getEndLaneNumber()) { cnxSides.left = false; }
                    } else {
                        if (self.getEndLevelNumber() === container.getEndLevelNumber()) { cnxSides.front = false; }
                        if (self.getStartLevelNumber() === container.getStartLevelNumber()) { cnxSides.back = false; }
                        if (self.getStartLaneNumber() === container.getStartLaneNumber()) { cnxSides.left = false; }
                        if (self.getEndLaneNumber() === container.getEndLaneNumber()) { cnxSides.right = false; }
                    }
                    return cnxSides;
                }
            };

            self.locateMarkupPorts = function(pnt) {
                var outline = getExpandedOutline(),
                    isVertical = config.getFlowDirection() === constants.flow().VERTICAL,
                    hookSteps = self.getHooksPositions(),
                    inShift = getInMarkupCentralPosition(outline),
                    sOut = 6;

                if (isVertical) {
                    self.markupInPort.getConnector().moveToXY(inShift, -sOut);
                } else {
                    self.markupInPort.getConnector().moveToXY(-sOut, inShift);
                }
                ////
                for (var i = 0; i < self.markupOutputPorts.length; i++) {
                    if (isVertical) {
                        self.markupOutputPorts[i].getConnector().moveToXY(hookSteps[i], outline.height + sOut);
                    } else {
                        self.markupOutputPorts[i].getConnector().moveToXY(outline.width + sOut, hookSteps[i]);
                    }
                    //console.log("markupOutPort 2: x="+self.markupOutputPorts[i].x+", "+self.markupOutputPorts[i].y+
                    //    ", visible="+self.markupOutputPorts[i].isVisible()+", length="+self.markupOutputPorts.length+", hooks="+hookSteps.length);
                }
            };

            self.getInPortCentralPosition = function() {
                var offset,
                    outline = getExpandedOutline(),
                    medianHookNum = Math.floor(_hooksNumber/2),
                    medianHookOffset = self.getHooksPositions()[medianHookNum]; // ignored for even number of hooks
                if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    offset = _hooksNumber%2 === 0 ? Math.floor(outline.width/2) : medianHookOffset;
                } else {
                    offset = _hooksNumber%2 === 0 ? Math.floor(outline.height/2) : medianHookOffset;
                }
                return offset;
            };

            function getDrawCentralPosition(outline) {
                var offset,
                    medianHookNum = Math.floor(_hooksNumber/2),
                    medianHookOffset = self.getHooksPositions()[medianHookNum]; // ignored for even number of hooks
                if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    offset = _hooksNumber%2 === 0 ?
                    outline.x + (outline.width-self.width)/2 : outline.x + medianHookOffset - self.width/2;
                } else {
                    offset = _hooksNumber%2 === 0 ?
                    outline.y + (outline.height - self.height)/2 : outline.y + medianHookOffset - self.height/2;
                }
                return offset;
            }

            function getDiamondX(outline) {
                return config.getFlowDirection() === constants.flow().VERTICAL ? getDrawCentralPosition(outline) : outline.x;
            }
            function getDiamondY(outline) {
                return config.getFlowDirection() === constants.flow().VERTICAL ? outline.y : getDrawCentralPosition(outline);
            }

            self.getMenuBarPosition = function() {
                var outline = getExpandedOutline();
                return new Point(getDiamondX(outline)-2, getDiamondY(outline)-8);
            };

            function getInMarkupCentralPosition(outline) {
                var offset,
                    medianHookNum = Math.floor(_hooksNumber/2),
                    medianHookOffset = self.getHooksPositions()[medianHookNum]; // ignored for even number of hooks
                if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    offset = _hooksNumber%2 === 0 ? (outline.width)/2 : medianHookOffset;
                } else {
                    offset = _hooksNumber%2 === 0 ? (outline.height)/2 : medianHookOffset;
                }
                return offset;
            }

            function getInMarkupBackShift(pnt, outline) {
                var step = getInMarkupStep(),
                    side = getInMarkupShowSide(pnt, outline);
                if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    return self.getNodeWidth()/2 + (side === constants.nodeSide().RIGHT ? -step : step);
                } else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
                    return self.getNodeHeight()/2 + (side === constants.nodeSide().LEFT ? -step : step);
                }
            }

            function getInMarkupShowSide(pnt, outline) {
                if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    return outline.x + outline.width/2 > pnt.x ? constants.nodeSide().RIGHT : constants.nodeSide().LEFT;
                } else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
                    return outline.y + outline.height/2 > pnt.y ? constants.nodeSide().LEFT : constants.nodeSide().RIGHT;
                }
            }

            function getInMarkupStep() {
                var idx = self.getPortsForSide(constants.nodeSide().BACK).length,
                    step = constants.portStep().MIN;
                if (idx === 0) { return 0; }
                else { return step + Math.floor((idx-1)*step/2); }
            }

            function getInPortBarLength(hasMarkup) {
                var inMarkNumber = self.getPortsForSide(constants.nodeSide().BACK).length,
                    step = constants.portStep().MIN;
                if (inMarkNumber === 0) { return 0; }
                else { return (hasMarkup ? step : 0) + Math.floor((inMarkNumber-1)*step/2); }
            }

            function getMarkupInPortForPoint(pnt) {
                var cnxSides = self.getCnxRestrictions();
                return cnxSides.back ? self.markupInPort : undefined;
            }

            function getMarkupOutputPortsForPoint(pnt) {
                var cnxSides = self.getCnxRestrictions(),
                    mkOutPorts = [];
                if (cnxSides.front) {
                    for (var i = 0; i < self.markupOutputPorts.length; i++) {
                        mkOutPorts.push(self.markupOutputPorts[i]);
                    }
                }
                return mkOutPorts;
            }

            self.showMarkupPorts = function(b, pnt) {
                var barVisible = document.getElementById("blockResizeId").style.visibility === 'visible',
                    mkPorts = self.getMarkupPorts(), i;
                if (barVisible) {
                    for (i = 0; i < mkPorts.length; i++) {
                        mkPorts[i].setVisible(false);
                    }
                    return;
                }
                if (!pnt || !config.isEditMode()) {
                    for (i = 0; i < mkPorts.length; i++) {
                        mkPorts[i].setVisible(false);
                    }
                    return;
                }
                var factor = config.getScale(),
                    cnxSides = self.getCnxRestrictions();

                var showUpper = config.getFlowDirection() === constants.flow().VERTICAL ?
                pnt.y < self.getY()*factor + Math.floor(self.getNodeHeight()*factor/2) :
                pnt.x < self.getX()*factor + Math.floor(self.getNodeWidth()*factor/2);

                if (self.markupInPort) {
                    if (self.getPortsForSide(constants.nodeSide().BACK).length) {
                        self.markupInPort.setVisible(false);
                    } else {
                        self.markupInPort.setVisible(cnxSides.back && (showUpper ? b : false));
                    }
                }

                for (i = 0; i < self.markupOutputPorts.length; i++) {
                    var connected = hasCnxAtPortOrder(self.markupOutputPorts[i].getName());
                    self.markupOutputPorts[i].setVisible(cnxSides.front && (showUpper ? false : b && !connected));
                }
            };

            function hasCnxAtPortOrder(mkPortName) {
                var mkOrder = getPortOrderFromName(mkPortName);
                if (self.outputPorts.length === 0) { return false; }
                for (var i = 0; i < self.outputPorts.length; i++) {
                    var order = getPortOrderFromName(self.outputPorts[i].getName());
                    if (mkOrder === order) {
                        return true;
                    }
                }
                return false;
            }

            function getPortOrderFromName(portName) {
                var token = 'OUT-',
                    idx = portName.indexOf(token)+token.length,
                    orderStr = portName.slice(idx);
                return parseInt(orderStr);
            }

            self.locateRefPorts = function() {
                //var sOut = 6,
                //    sIn = (!self.isLeftLaneNode() && !self.isRightLaneNode()) ? 6 : 4,
                //    leftInPort = self.getRefInPortForName(constants.portNames().REF_IN_PORT_LEFT_NAME),
                //    leftOutPort = self.getRefOutPortForName(constants.portNames().REF_OUT_PORT_LEFT_NAME),
                //    rightInPort = self.getRefInPortForName(constants.portNames().REF_IN_PORT_RIGHT_NAME),
                //    rightOutPort = self.getRefOutPortForName(constants.portNames().REF_OUT_PORT_RIGHT_NAME);
                //if (config.getFlowDirection() === constants.flow().VERTICAL) {
                //    //if (!self.isLeftLaneNode() && !self.isRightLaneNode()) {
                //    if (leftInPort)   { leftInPort.getConnector().moveToXY(self.getNodeWidth()+sOut, sIn); }
                //    if (leftOutPort)  { leftOutPort.getConnector().moveToXY(self.getNodeWidth()+sOut, self.getNodeHeight()-sIn); }
                //    if (rightInPort)  { rightInPort.getConnector().moveToXY(-sOut, sIn); }
                //    if (rightOutPort) { rightOutPort.getConnector().moveToXY(-sOut, self.getNodeHeight()-sIn); }
                //    //}
                //} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
                //    //if (!self.isLeftLaneNode() && !self.isRightLaneNode())  {
                //    if (leftInPort)   { leftInPort.getConnector().moveToXY(sIn, -sOut); }
                //    if (leftOutPort)  { leftOutPort.getConnector().moveToXY(self.getNodeWidth()-sIn, -sOut); }
                //    if (rightInPort)  { rightInPort.getConnector().moveToXY(sIn, self.getNodeHeight()+sOut); }
                //    if (rightOutPort) { rightOutPort.getConnector().moveToXY(self.getNodeWidth()-sIn, self.getNodeHeight()+sOut); }
                //    //}
                //}
            };

            self.showRefPorts = function(b, pnt) {
                var //barVisible = document.getElementById("blockResizeId").style.visibility === 'visible',
                    refPorts = self.getRefPorts(), i;
                //if (barVisible || !config.isEditMode()) {
                    for (i = 0; i < refPorts.length; i++) {
                        refPorts[i].setVisible(false);
                    }
                //}
            };

            //function getRefInPortForPoint(pnt) {
            //    var leftInPort = self.getRefInPortForName(constants.portNames().REF_IN_PORT_LEFT_NAME),
            //        rightInPort = self.getRefInPortForName(constants.portNames().REF_IN_PORT_RIGHT_NAME),
            //        factor = config.getScale(),
            //        cnxSides = self.getCnxRestrictions();
            //    if (config.getFlowDirection() === constants.flow().VERTICAL) {
            //        if (pnt.x < self.getX()*factor + Math.floor(self.getNodeWidth()/2)) {
            //            if (rightInPort)  {  return cnxSides.right ? rightInPort : undefined; }
            //        } else {
            //            if (leftInPort)   { return cnxSides.left ? leftInPort : undefined; }
            //        }
            //    } else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
            //        if (pnt.y < self.getY()*factor + Math.floor(self.getNodeHeight()/2)) {
            //            if (leftInPort)   { return cnxSides.left ? leftInPort : undefined; }
            //        } else {
            //            if (rightInPort)  { return cnxSides.right ? rightInPort : undefined; }
            //        }
            //    }
            //    return undefined;
            //}

            //function getRefOutPortForPoint(pnt) {
            //    var leftOutPort = self.getRefOutPortForName(constants.portNames().REF_OUT_PORT_LEFT_NAME),
            //        rightOutPort = self.getRefOutPortForName(constants.portNames().REF_OUT_PORT_RIGHT_NAME),
            //        factor = config.getScale(),
            //        cnxSides = self.getCnxRestrictions();
            //    if (config.getFlowDirection() === constants.flow().VERTICAL) {
            //        if (pnt.x < self.getX()*factor + Math.floor(self.getNodeWidth()/2)) {
            //            if (rightOutPort) { return cnxSides.right ? rightOutPort : undefined; }
            //        } else {
            //            if (leftOutPort)  { return cnxSides.left ? leftOutPort : undefined; }
            //        }
            //    } else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
            //        if (pnt.y < self.getY()*factor + Math.floor(self.getNodeHeight()/2)) {
            //            if (leftOutPort)  { return cnxSides.left ? leftOutPort : undefined; }
            //        } else {
            //            if (rightOutPort) { return cnxSides.right ? rightOutPort : undefined; }
            //        }
            //    }
            //    return undefined;
            //}

            function setPortsVisible(ports, b) {
                for (var i = 0; i < ports.length; i++) {
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
                    acceptingPorts = [], i;
                if (originPort.getType() === constants.portType().LINK_CNX ||
                    originPort.getType() === constants.portType().MARKUP ) {
                    if (originDirection === constants.portDirection().OUT ||
                        originDirection === constants.portDirection().MARK_OUT ||
                        originDirection === constants.portDirection().MARK_OUT_AUX) {
                        var inPort = getMarkupInPortForPoint(dragPoint);
                        if (inPort) {
                            acceptingPorts.push(inPort);
                        }
                    } else if (originDirection == constants.portDirection().IN ||
                        originDirection == constants.portDirection().MARK_IN ||
                        originDirection === constants.portDirection().MARK_IN_AUX) {
                        var mkOutPorts = getMarkupOutputPortsForPoint(dragPoint);
                        for (i = 0; i < mkOutPorts.length; i++) {
                            acceptingPorts.push(mkOutPorts[i]);
                        }
                    }
                } else if (originPort.getType() === constants.portType().LINK_REF ||
                    originPort.getType() === constants.portType().REF ) {
                }
                for (i = 0; i < acceptingPorts.length; i++) {
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
                    acceptingPorts = [], i;
                self.locateMarkupPorts(dragPoint);
                if (originDirection === constants.portDirection().OUT ||
                    originDirection === constants.portDirection().MARK_OUT ||
                    originDirection === constants.portDirection().MARK_OUT_AUX ||
                    originDirection === constants.portDirection().REF_OUT) {
                    var inPort = getMarkupInPortForPoint(dragPoint);
                    if (inPort) {
                        acceptingPorts.push(inPort);
                    }
                } else if (originDirection === constants.portDirection().IN ||
                    originDirection === constants.portDirection().MARK_IN ||
                    originDirection === constants.portDirection().MARK_IN_AUX ||
                    originDirection === constants.portDirection().REF_IN) {
                    var mkOutPorts = getMarkupOutputPortsForPoint(dragPoint);
                    for (i = 0; i < mkOutPorts.length; i++) {
                        acceptingPorts.push(mkOutPorts[i]);
                    }
                }
                for (i = 0; i < acceptingPorts.length; i++) {
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
                // not visible if expanded
                if (!self.isVisible()) {
                    //return;
                    console.log("!!! SWITCH not visible");
                }
                ctx.lineWidth = 2;
                ctx.setLineDash([0,0]);
                var outlineColor = _nColor;
                if (self.isHighlighted()) {
                    outlineColor = _hltColor;
                }
                if (self.isSelected()) {
                    outlineColor = _selColor;
                }
                ctx.strokeStyle = outlineColor;
                //ctx.font = "12px Arial";
                ctx.font = constants.font().TEXT;

                ctx.fillStyle = _myBgnColor;

                var outline = getExpandedOutline(),
                    barRect = getSwitchBarRect(),
                    showX = getDiamondX(outline),
                    showY = getDiamondY(outline);
                //console.log("DRAW SWITCH x="+showX+", y="+showY);

                draw.decisionPolygon(ctx, showX, showY, self.width, self.height, _ARC);
                draw.paintRectangle(ctx, barRect, outlineColor, outlineColor, 1, 1);

                //draw.paintRectangle(ctx, outline, null, outlineColor, 1, 1); // for test only

                if (_allowEdit && self.isHighlighted() && !_flowManager.getCaller().isSwitchResizeBarVisible()) {
                    //ctx.drawImage(_menuImg, outline.x + 8, outline.y-10);
                    ctx.drawImage(_menuImg, showX - 2, showY - 16);
                }
                if (!config.hasHideNodeNames()) {
                    //self.drawName(ctx, outline.width-16, 1, _myFgnColor);
                }

                if (self.isShowIcon() || config.hasShowNodeIcons()) {
                    ctx.drawImage(self.nodeIcon,
                        showX + self.width/2 - 6,
                        showY + self.height/2 - 6 );
                }

                //if (!drawContentText(ctx)) {
                //    self.drawName(ctx, self.width-8, null, _myFgnColor);
                //} else {
                //    self.drawName(ctx, self.width-20, self.y+15, _myFgnColor);
                //}

                self.drawPorts(ctx, outlineColor, showX, showY);
                self.drawTextAbove(ctx, 12);
                //self.drawTextBelow(ctx, 12);

                if (!_expanded && _drawState === constants.drawState().RESIZED) {
                    draw.selectedNodeFrame(
                        ctx, self.x, self.y, self.width, self.height, self.getResizeDeltaW(), self.getResizeDeltaH(),
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
                    x = self.x + Math.floor((self.width - cntW)/2);
                    //y = self.y + Math.floor((self.height - cntH)/2);
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
                            vX = x + Math.floor((cntW - lineLen)/2),
                        //vY = y + fontHeight -2 + (fontHeight + leading) * i;
                            vY = y + (fontHeight + leading) * i;
                        //console.log(">>> "+line);
                        ctx.fillText(line, vX, vY);
                        if (i == 0) {
                            //ctx.strokeRect(vX, vY-fontHeight, lineLen, fontHeight + leading);
                            self.nameRect.setRectBounds(self.x, vY-fontHeight, self.width, fontHeight + leading);
                        }
                    }
                    return true;
                }
                return false;
            }

            self.drawName = function(ctx, maxLen, textY, color) {
                ctx.save();
                var name = self.getName();
                // TODO: here min size is square, need to monitor the width for dynamic text drawing
                //if (name.length > maxLen) {
                //	name = name.substring(0, maxLen)+"..";
                //}
                ctx.fillStyle = !color ? 'blue' : color;
                //ctx.fillStyle = constants.colors().CONTENT_TEXT;

                var charWidth = ctx.measureText("W").width+1,
                    maxChars = maxLen/charWidth;
                if (name.length > maxChars) {
                    //if (name.length > maxLen) {
                    name = name.substring(0, maxChars)+"..";
                }
                var tw = Math.ceil(ctx.measureText(name).width), tx, ty;

                if (_expanded) {
                    //var tx = Math.round(self.getX() + Math.floor(self.getNodeWidth()/2) - Math.floor(tw/2));
                    tx = self.getX() + _expandImgSize + _menuImgSize + 12; // inline
                    //var tx = self.getX() + 6; // below
                    var th = constants.font().HEIGHT;
                    //var ty = !_expanded ? self.getY() + th - 4 : self.getY() + 6 + _expandImgSize; // below
                    ty = !_expanded ? self.getY() + th - 4 : self.getY() + 5; // inline
                } else {
                    tx = Math.round(self.getX() + Math.floor(self.getNodeWidth()/2) - Math.floor(tw/2));
                    th = constants.font().HEIGHT; //self.getFontHeight(ctx);
                    ty = self.y + Math.floor((self.getNodeHeight() + th/2)/2);
                }
                if (!config.hasHideNodeNames()) {
                    var gx = Math.ceil(self.getX() + self.getNodeWidth()/2 - tw);
                    if (_expanded) {
                        ctx.fillStyle = _nColor; //'#3673C3';
                        //ctx.fillRect(tx-2, self.getY()+1, tw+4, 14);
                        ctx.fillRect(tx-2, ty, tw+4, 14);
                        ctx.fillStyle = 'white';
                        ctx.fillText(name, tx, ty+th);
                        //self.nameRect.setRectBounds(tx-2, self.getY()+1, tw+4, 14);
                        self.nameRect.setRectBounds(tx-2, ty, tw+4, 14);
                    } else {
                        //ctx.fillStyle = color;
                        //ctx.fillText(name, tx, ty+14);
                        //self.nameRect.setRectBounds(gx, ty, tw*2, 14);
                        self.nameRect.setRectBounds(tx, ty-10, tw, 10);
                        ctx.fillText(name, tx, ty);
                    }
                    //ctx.fillStyle = 'white';
                    //ctx.fillText(name, tx, ty);
                }
                //self.nameRect.setRectBounds(gx, self.getY()+1, tw*2, 14);
                //self.nameRect.setRectBounds(gx, ty, tw*2, 14);
                ctx.restore();
            };

            self.drawPorts = function(ctx, outlineColor, showX, showY) {
                var i, len, off = 2,
                    inPorts = self.getInputPorts();
                for (i = 0; i < inPorts.length; i++) {
                    inPorts[i].drawPort(ctx);
                    //len = getInPortBarLength(false);
                    //if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    //    draw.drawLine(ctx, outlineColor, 2,
                    //        showX + self.width/2 - len - off,
                    //        self.y - off,
                    //        showX + self.width/2 + len + off,
                    //        self.y - off);
                    //} else {
                    //    draw.drawLine(ctx, outlineColor, 2,
                    //        self.x,
                    //        showY + self.height/2 - len - off,
                    //        self.x,
                    //        showY + self.height/2 + len + off);
                    //}
                }
                var outPorts = self.getOutputPorts();
                for (i = 0; i < outPorts.length; i++) {
                    outPorts[i].drawPort(ctx);
                }
                if (self.markupInPort && self.markupInPort.isVisible()) {
                    self.markupInPort.drawPort(ctx);
                    //len = getInPortBarLength(true);
                    //if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    //    draw.drawLine(ctx, outlineColor, 2,
                    //        showX + self.width/2 - len,
                    //        self.y - off,
                    //        showX + self.width/2 + len,
                    //        self.y - off);
                    //} else {
                    //    draw.drawLine(ctx, outlineColor, 2,
                    //        self.x,
                    //        showY + self.height/2 - len,
                    //        self.x,
                    //        showY + self.height/2 + len);
                    //}
                }
                for (i = 0; i < self.markupOutputPorts.length; i++) {
                    self.markupOutputPorts[i].drawPort(ctx);
                }
            };

            self.initGroupNode();

        }
        jsUtils.inherit(FlowSwitch, FlowNode);
        return FlowSwitch;
    }
);