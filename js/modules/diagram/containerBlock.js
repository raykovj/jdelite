define('modules/diagram/containerBlock',
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
             Map,
             loader,
             jsUtils) {
        function ContainerBlock(name, flowManager) {
            FlowNode.call(this, name, constants.flowType().CONTAINER);

            var self = this,
                _flowManager = flowManager,
                _flowLayout = flowManager.getFlowLayout(),
                _blockBarElem = document.getElementById("blockResizeId");

            var NAME_LENGTH = 10, //self.width,
                ARC_COMMON = 2,
                ARC_TERM = 12,
                _ARC = self.flowType === constants.flowType().START || self.flowType === constants.flowType().END ?
                    ARC_TERM : ARC_COMMON,
                _SKEW = 4,
                _SHADE = constants.nodeSurface().SHADE,
                _FRAME = constants.nodeSurface().FRAME;

            var nColor = constants.colors().BLOCK,
                hltColor = constants.colors().BLOCK_HLT,
                selColor = constants.colors().BLOCK_SEL,
                tooltip,
                _nameTooltip,
                _drawState = constants.drawState().NONE;

            var _myBgnColor,
                _useMyBgnColor,
                _myDefBgnColor,
                _myFgnColor,
                _useMyFgnColor,
                _myDefFgnColor;

            _myBgnColor = config.getBlockColor();
            _myFgnColor = config.getBlockOutlineColor();
            _myDefBgnColor = config.getBlockDefColor();
            _myDefFgnColor = _myFgnColor;
            ////
            self.setBgnColor = function(color) {
                _myBgnColor = color;
                _useMyBgnColor = true;
            };
            self.getBgnColor = function() { return _myBgnColor; };
            self.resetBgnColor = function() {
                self.setBgnColor(_myDefBgnColor);
                _useMyBgnColor = true;
            };
            self.getDefBgnColor = function() { return _myDefBgnColor; };
            //////
            self.setFgnColor = function(color) {
                _myFgnColor = color;
                _useMyFgnColor = true;
            };
            self.getFgnColor = function() { return _myFgnColor; };
            self.resetFgnColor = function() {
                self.setFgnColor(constants.colors().NODE_FORCOLOR_DRK);
            };
            self.getDefFgnColor = function() { return _myDefFgnColor; };

            ///////////////////////////

            var _expanded = false,
                _expandChange,
                _gridAcross = 0, // lanes: only even numbers
                _gridAlong = 0,  // levels
                _startLevelNum,
                _endLevelNum,
                _startLaneNum,
                _endLaneNum,
                _nodeNames = [],
                _contentNodes = [],
                _locatorsMap = new Map(),
                _allowEdit = config.isEditMode();

            self.isExpanded = function() { return _expanded; };
            self.setExpanded = function(b) {
                if (_expandChange) {
                    self.resetResize();
                    if (b) {
                        _flowManager.getModelHandler().doContainerExpand(
                            self,
                            _flowLayout,
                            _startLevelNum,
                            _endLevelNum,
                            _startLaneNum,
                            _endLaneNum);
                    } else {
                        _flowManager.getModelHandler().doContainerCollapse(
                            self,
                            _flowLayout,
                            _startLevelNum,
                            _endLevelNum,
                            _startLaneNum,
                            _endLaneNum);
                    }
                }
                _expanded = b;
                self.setVisible(!b);
                setContentVisible(b);
                if (!b) {
                    flowUtils.collapseContainersRecursively(self);
                }
            };

            function setContentVisible(b) {
                _contentNodes.forEach(function(node) {
                    node.setVisible(b);
                });
            }

            // new: from parser
            self.addContentNode = function(node) {
                if (node.getFlowType() === constants.flowType().CONTAINER) {
                    node.setVisible(!node.isExpanded() && _expanded);
                } else {
                    node.setVisible(_expanded);
                }
                var locator = _locatorsMap.get(node.getName());
                if (locator) {
                    var levelNum = self.getLevelNumber() + locator.levelShift,
                        laneNum = self.getLaneNumber() + locator.laneShift;
                    node.setLevelNumber(levelNum);
                    node.setLaneNumber(laneNum);
                }
                _contentNodes.push(node);
            };

            self.removeContentNode = function(node) {
                if (node) {
                    for (var i = 0; i < _contentNodes.length; i++) {
                        if (_contentNodes[i].getName() === node.getName()) {
                            _contentNodes.splice(i, 1);
                            _locatorsMap.delete(node.getName());
                        }
                    }
                }
            };

            self.getContentNodes = function() { return _contentNodes; };

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
                return config.getFlowDirection() === constants.flow().VERTICAL ? w : h;
            };

            self.getEffectiveHeight = function(w, h) {
                return config.getFlowDirection() === constants.flow().VERTICAL ? h : w;
            };

            //////

            // from parser
            self.setContentLocators = function(nodeLocators) {
                _locatorsMap.clear();
                if (nodeLocators) {
                    nodeLocators.forEach(function(item) {
                        var locator = {};
                        locator.levelShift = item.levelShift;
                        locator.laneShift = item.laneShift;
                        _locatorsMap.put(item.name, locator);
                    });
                }
            };

            //////
            self.setNodeNames = function(names) { _nodeNames = names; };
            self.getNodeNames = function() { return _nodeNames; };

            self.addNodeName = function(name) { _nodeNames.push(name); };
            self.removeNodeName = function(name) {
                for (i = 0; i < _nodeNames.length; i++) {
                    if (_nodeNames[i] === name) {
                        _nodeNames.splice(i, 1);
                    }
                }
            };
            //////

            self.hasExpandChange = function() { return _expandChange; };
            self.resetExpandChange = function() { _expandChange = false; };

            self.getGridAcross = function() { return _gridAcross; };
            self.setGridAcross = function(n) {
                if (n >= 0 && n%2 === 0) { _gridAcross = n; }
                else {
                    _gridAcross = 0;
                    //console.log("Bad value for grid ACROSS: "+n);
                }
            };

            self.getGridAlong = function() { return _gridAlong; };
            self.setGridAlong = function(n) {
                if (n >= 0) { _gridAlong = n; }
                else {
                    _gridAlong = 0;
                    //console.log("Bad value for grid ALONG: "+n);
                }
            };

            self.getStartLevelNumber = function() { return _startLevelNum; };
            self.setStartLevelNumber = function(n) { _startLevelNum = n; };

            self.getEndLevelNumber = function() { return _endLevelNum; };
            self.setEndLevelNumber = function(n) { _endLevelNum = n; };

            self.getStartLaneNumber = function() { return _startLaneNum; };
            self.setStartLaneNumber = function(n) { _startLaneNum = n; };

            self.getEndLaneNumber = function() { return _endLaneNum; };
            self.setEndLaneNumber = function(n) { _endLaneNum = n; };

            self.canExtendAlong = function() {
                var nextEndLevel = _flowLayout.getLevels()[_endLevelNum + 1],
                    parentContainer = self.getContainerReference();
                if (parentContainer) {
                    return _endLevelNum < parentContainer.getEndLevelNumber() &&
                            nextEndLevel.hasLaneRangeEmpty(_startLaneNum, _endLaneNum);
                } else {
                    // TODO ??
                    return _endLevelNum < flowUtils.getMaxLevelNumber(_flowLayout) &&
                        !flowUtils.hasConflictToSiblingAlong(_flowManager.getModelHandler().getFlowModel(), self.getNodeObject()) &&
                        !flowUtils.hasStartEndLevelsConflictAlong(_flowManager.getModelHandler().getFlowModel(), self.getNodeObject());
                }
            };

            self.canExtendAcross = function() {
                var prevStartLane = _flowLayout.getLanes()[_startLaneNum - 1],
                    nextEndLane = _flowLayout.getLanes()[_endLaneNum + 1],
                    parentContainer = self.getContainerReference(),
                    expanded = flowUtils.getExpandedContainers(_flowManager, parentContainer);
                if (parentContainer) {
                    return _startLaneNum > parentContainer.getStartLaneNumber() &&
                        prevStartLane.hasLevelRangeEmpty(_startLevelNum, _endLevelNum) &&
                        _endLaneNum < parentContainer.getEndLaneNumber() &&
                        nextEndLane.hasLevelRangeEmpty(_startLaneNum, _endLaneNum);
                } else {
                    // TODO ??
                    return _startLaneNum > flowUtils.getMinLaneNumber() &&
                        _endLaneNum < flowUtils.getMaxLaneNumber(_flowLayout) &&
                        !flowUtils.hasConflictToSiblingAcross(_flowManager.getModelHandler().getFlowModel(), self.getNodeObject()) &&
                        !flowUtils.hasStartEndLanesConflictAcross(_flowManager.getModelHandler().getFlowModel(), self.getNodeObject());
                }
            };

            self.canShrinkAlong = function() {
                var endLevel = _flowLayout.getLevels()[_endLevelNum];
                return _endLevelNum > _startLevelNum &&
                    endLevel.hasLaneRangeEmpty(_startLaneNum, _endLaneNum) &&
                    flowUtils.canShrinkOuterContainerAlong(self);
            };

            self.canShrinkAcross = function() {
                var startLane = _flowLayout.getLanes()[_startLaneNum],
                    endLane = _flowLayout.getLanes()[_endLaneNum];
                return _endLaneNum > _startLaneNum &&
                    startLane.hasLevelRangeEmpty(_startLevelNum, _endLevelNum) &&
                    endLane.hasLevelRangeEmpty(_startLevelNum, _endLevelNum) && flowUtils.canShrinkOuterContainerAcross(self);
            };

            self.resizeOutline = function(resizeParam) {
                _flowManager.getFlowController().resizeContainerOutline(self, resizeParam);
            };

            function canExpand() {
                var parentContainer = self.getContainerReference(),
                    nodes, i;
                if (parentContainer) {
                    if (_endLevelNum > parentContainer.getEndLevelNumber() ||
                        _startLaneNum < parentContainer.getStartLaneNumber() ||
                        _endLaneNum > parentContainer.getEndLaneNumber() ) {
                        return false;
                    }
                    nodes = parentContainer.getContentNodes();
                    for (i = 0; i < nodes.length; i++) {
                        if (nodes[i].equals(self)) {
                            continue;
                        }
                        if (nodes[i].getFlowType() !== constants.flowType().CONTAINER &&
                            flowUtils.isNodeInsideContainer(nodes[i], self)) {
                            return false;
                        }
                        else if (nodes[i].getFlowType() === constants.flowType().CONTAINER &&
                            flowUtils.areContainersIntersecting(nodes[i], self)) {
                            return false;
                        }
                    }
                } else {
                    nodes = _flowManager.getModelHandler().getFlowNodes();
                    for (i = 0; i < nodes.length; i++) {
                        if (nodes[i].equals(self) || nodes[i].getContainerReference()) {
                            continue;
                        }
                        if (nodes[i].getFlowType() !== constants.flowType().CONTAINER &&
                            flowUtils.isNodeInsideContainer(nodes[i], self)) {
                            return false;
                        }
                        else if (nodes[i].getFlowType() === constants.flowType().CONTAINER &&
                            flowUtils.areContainersIntersecting(nodes[i], self)) {
                            return false;
                        }
                    }
                }
                return true;
            }

            //function updateGridBoundary() {
            //    var minLevelNum = self.getLevelNumber(),
            //        maxLevelNum = self.getLevelNumber(),
            //        minLaneNum = self.getLaneNumber(),
            //        maxLaneNum = self.getLaneNumber();
            //    _contentNodes.forEach(function(node) {
            //        minLevelNum = Math.min(minLevelNum, node.getLevelNumber());
            //        maxLevelNum = Math.max(maxLevelNum, node.getLevelNumber());
            //        minLaneNum = Math.min(minLaneNum, node.getLaneNumber());
            //        maxLaneNum = Math.max(maxLaneNum, node.getLaneNumber());
            //    });
            //    _startLevelNum = Math.min(minLevelNum, _startLevelNum);
            //    _endLevelNum = Math.max(maxLevelNum, _endLevelNum);
            //    _gridAlong = _endLevelNum - _startLevelNum;
            //
            //    var offsetAcross = Math.max(self.getLaneNumber()-minLaneNum, maxLaneNum-self.getLaneNumber());
            //    _gridAcross = offsetAcross*2+1;
            //    _startLaneNum = self.getLaneNumber() - Math.floor(_gridAcross/2);
            //    _endLaneNum = self.getLaneNumber() + Math.floor(_gridAcross/2);
            //}

            function printExpandedOutline() {
                console.log("*** container: "+self.getName()+
                    ":\n_startLevelNum = "+_startLevelNum+
                        ", _endLevelNum = "+_endLevelNum+
                        ", _startLaneNum = "+_startLaneNum+
                        ", _endLaneNum = "+_endLaneNum
                );
            }

            self.getOutlineSteps = function() {
                var steps = {
                    front: constants.cellGap().CTR_GAP,
                    back: constants.cellGap().CTR_GAP,
                    left: constants.cellGap().CTR_GAP,
                    right: constants.cellGap().CTR_GAP };

                if (self.getContainerReference()) {
                    var container = self.getContainerReference(),
                        parentSteps = container.getOutlineSteps();
                    if (_startLevelNum === container.getStartLevelNumber()) {
                        steps.back += parentSteps.back;
                        if (config.getFlowDirection() === constants.flow().VERTICAL) {
                            steps.back += parentSteps.back;
                        }
                    }
                    if (_endLevelNum === container.getEndLevelNumber()) {
                        steps.front += parentSteps.front;
                    }
                    if (config.getFlowDirection() === constants.flow().VERTICAL) {
                        // VERTICAL
                        if (_startLaneNum === container.getStartLaneNumber()) {
                            steps.right += parentSteps.right;
                        }
                        if (_endLaneNum === container.getEndLaneNumber()) {
                            steps.left += parentSteps.left;
                        }
                    } else {
                        // HORIZONTAL
                        if (_startLaneNum === container.getStartLaneNumber()) {
                            steps.left += parentSteps.left;
                        }
                        if (_endLaneNum === container.getEndLaneNumber()) {
                            steps.right += parentSteps.right;
                        }
                    }
                }
                return steps;
            };

            function getExpandedOutline() {
                var ctrX, ctrY, ctrW, ctrH,
                    steps = self.getOutlineSteps();
                if (_startLevelNum === _endLevelNum && _startLaneNum === _endLaneNum) {
                    var ctrCell = diagramUtils.getCellRectAt(_flowManager, _startLevelNum, _startLaneNum);
                    //console.log("B1: cell rect at: "+ctrCell.showBounds());
                    ctrX = ctrCell.x;
                    ctrY = ctrCell.y;
                    ctrW = ctrCell.width;
                    ctrH = ctrCell.height;
                } else {
                    var startTopCell = diagramUtils.getCellRectAt(_flowManager, _startLevelNum, _startLaneNum),
                        endBottomCell = diagramUtils.getCellRectAt(_flowManager, _endLevelNum, _endLaneNum);
                    ctrX = startTopCell.x;
                    ctrY = startTopCell.y;
                    ctrW = endBottomCell.x + endBottomCell.width - startTopCell.x;
                    ctrH = endBottomCell.y + endBottomCell.height - startTopCell.y;
                }
                //return new Rectangle(ctrX+, ctrY+, ctrW-2*, ctrH-2*);
                if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    //console.log("B1: outline: "+(ctrW - (steps.right + steps.left)-2)+", "+(ctrH - (steps.back + steps.front)));
                    return new Rectangle(
                        ctrX + steps.right,
                        ctrY + steps.back,
                        ctrW - (steps.right + steps.left)-2, // fix for a skew
                        ctrH - (steps.back + steps.front));
                } else {
                    return new Rectangle(
                        ctrX + steps.back,
                        ctrY + steps.left,
                        ctrW - (steps.back + steps.front),
                        ctrH - (steps.left + steps.right)-2); // fix for a skew
                }
            }

            ////
            var _expandImg = loader.expand14,
                _collapseImg = loader.collapse14,
                _stop12Img = loader.stop12,
                _expandImgSize = 16,
                _collapseImgSize = 16,
                _extendH20 = loader.extendH20,
                _extendH20dis = loader.extendH20dis,
                _extendV20 = loader.extendV20,
                _extendV20dis = loader.extendV20dis,
                _shrinkH20 = loader.shrinkH20,
                _shrinkH20dis = loader.shrinkH20dis,
                _shrinkV20 = loader.shrinkV20,
                _shrinkV20dis = loader.shrinkV20dis;

            function getSignShape() {
                if (!_expanded) {
                    return new Rectangle(self.x + self.width-_expandImgSize-2, self.y+2, _expandImgSize, _expandImgSize);
                } else {
                    var rect = getExpandedOutline();
                    //return new Rectangle(rect.x +  _collapseImgSize + 12, rect.y+3, _collapseImgSize, _collapseImgSize);
                    return new Rectangle(rect.x +  _collapseImgSize + 12 + 4, rect.y+3 - 10, _collapseImgSize, _collapseImgSize);
                }
            }

            var _menuImg = loader.menu20x16,
                _menuImgSize = 20;
            function getMenuShape() {
                var rect = getExpandedOutline();
                return new Rectangle(rect.x + 4 + 4, rect.y+2 - 10, 20, 20);
            }

            //////
            self.nameRect = new Rectangle(0,0,0,0);
            //
            self.initNode = function() {};

            self.setInitialBounds = function() {
                // ALONG
                _startLevelNum = self.getLevelNumber();
                _endLevelNum = self.getLevelNumber() + _gridAlong;

                // ACROSS
                _startLaneNum = self.getLaneNumber() - _gridAcross/2;
                _endLaneNum = self.getLaneNumber() + _gridAcross/2;
            };

            self.initGroupNode = function() {
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
                    //return config.getGlobalNodeWidth(constants.flowType().CONTAINER);
                }
                else { return getExpandedOutline().width; }
            };

            self.getNodeHeight = function() {
                if (!_expanded) {
                    return self.height;
                    //return config.getGlobalNodeHeight(constants.flowType().CONTAINER);
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
                node.type = self.getFlowType();
                node.levelNum = self.getLevelNumber();
                node.laneNum = self.getLaneNumber();

                node.expanded = _expanded;
                node.contentNodes = _nodeNames.join();
                node.containerName = self.getContainerName();
                node.gridAcross = _gridAcross;
                node.gridAlong = _gridAlong;
                node.locators = getLocatorsToSave();

                node.startLevelNum = _startLevelNum;
                node.endLevelNum = _endLevelNum;
                node.startLaneNum = _startLaneNum;
                node.endLaneNum = _endLaneNum;

                node.resizeW = self.getResizeW();
                node.resizeH = self.getResizeH();

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

            function getLocatorsToSave() {
                var locators = [], keys = _locatorsMap.keys();
                keys.forEach(function(key) {
                    var locator = {}, value = _locatorsMap.get(key);
                    locator.name = key;
                    locator.levelShift = value.levelShift;
                    locator.laneShift = value.laneShift;
                    locators.push(locator);
                });
                return locators;
            }

            // used for edge layout restrictions
            self.getCellsWithVisibleNodes = function() {
                var nodes = _flowManager.getModelHandler().getFlowNodes(),
                    cells = [];
                for (var i = _startLevelNum; i <= _endLevelNum; i++) {
                    var level = _flowLayout.getLevels()[i],
                        cellsInRange = level.getCellsInRange(_startLaneNum, _endLaneNum),
                        visibleCells = [];
                    cellsInRange.forEach(function(cell) {
                        if (isCellBlocking(nodes, cell.getLevelNumber(), cell.getLaneNumber())) {
                            visibleCells.push(cell);
                        }
                    });
                    cells = cells.concat(visibleCells);
                }
                return cells;
            };

            function isCellBlocking(nodes, levelNum, laneNum) {
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i].getFlowType() !== constants.flowType().CONTAINER &&
                        nodes[i].getLevelNumber() === levelNum && nodes[i].getLaneNumber() === laneNum &&
                        nodes[i].isVisible()) {
                        return true;
                    }
                }
                return false;
            }

            self.getCellContainerOffsets = function() {
                var container = self.getContainerReference(),
                    allNodes = _flowManager.getModelHandler().getFlowNodes(),
                    levelsNum = flowUtils.getNestedContainersNumberAtNodeLevel(self, allNodes),
                    lanesNum = flowUtils.getNestedContainersNumberAtNodeLane(self, allNodes),
                    offsets = {
                        front:  constants.cellGap().HEIGHT + levelsNum * constants.cellGap().HEIGHT,
                        back:   constants.cellGap().HEIGHT + levelsNum * constants.cellGap().HEIGHT,
                        left:   constants.cellGap().WIDTH + lanesNum * constants.cellGap().WIDTH,
                        right:  constants.cellGap().WIDTH + lanesNum * constants.cellGap().WIDTH
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

            // timing sensitive !!
            self.getContainerEmptyCells = function() {
                var cells = [],
                    expCtrs = getExpandedInnerContainers();
                for (var i = _startLevelNum; i <= _endLevelNum; i++) {
                    var level = _flowLayout.getLevels()[i],
                        cellsInRange = level.getEmptyCellsInRange(_flowLayout, _startLaneNum, _endLaneNum);
                    expCtrs.forEach(function(ctr) {
                        cellsInRange = cellsInRange.filter(function(cell) {
                            return !isCellInContainer(cell, ctr);
                        });
                    });
                    cells = cells.concat(cellsInRange);
                }
                return cells;
            };

            function getExpandedInnerContainers() {
                var containers = [];
                _contentNodes.forEach(function(node) {
                    if (node.getFlowType() === constants.flowType().CONTAINER && node.isExpanded()) {
                        containers.push(node);
                    }
                });
                return containers;
            }

            function isCellInContainer(cell, container) {
                return 	cell.getLevelNumber() >= container.getStartLevelNumber() &&
                    cell.getLevelNumber() <= container.getEndLevelNumber() &&
                    cell.getLaneNumber() >= container.getStartLaneNumber() &&
                    cell.getLaneNumber() <= container.getEndLaneNumber();
            }

            self.containsCell = function(cell) {
                return isCellInContainer(cell, self);
            };

            self.getContentLinks = function() {
                var links = [];
                _contentNodes.forEach(function(node) {
                    var nodeLinks = node.getAllLinks();
                    nodeLinks.forEach(function(nodeLink) {
                        if (links.some(function(link) {
                                return link.getHashName() === nodeLink.getHashName();
                            }) )
                        { return; }
                        links.push(nodeLink);
                    });
                });
                return links;
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

            self.getNodeBounds = function() {
                var r = !_expanded ? self : getExpandedOutline();
                return new Rectangle(r.x-_SHADE, r.y-_SHADE, r.width+2*_SHADE, r.height+2*_SHADE);
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
                if (!self.containsPoint(point) || !self.isExpanded() && !self.isVisible()) {
                    return undefined;
                }
                //console.log("# "+self.getName()+": expanded: "+_expanded+", x="+self.x+", y="+self.y+", getX="+self.getX()+", getY="+self.getY());
                var signShape = getSignShape(),
                    menuShape = getMenuShape();
                if (_allowEdit && menuShape.containsXY(point.x, point.y)) {
                    _flowManager.getCaller().showBlockResizeBar(self);
                    return self;
                }
                if (signShape.containsXY(point.x, point.y)) {
                    _expandChange = true;
                    if (_expanded || !_expanded && canExpand()) {
                        self.setExpanded(!_expanded);
                    }
                    return self;
                }
                if (fromInside) {
                    return self;
                }
                var nodeInside = flowUtils.getNodeInsideContainerAtPoint(self, point),
                    linkInside = flowUtils.getLinkInsideContainerAtPoint(self, point);
                if (linkInside) {
                    return linkInside;
                }
                if (nodeInside) {
                    if (nodeInside.getFlowType() === constants.flowType().CONTAINER ||
                        nodeInside.getFlowType() === constants.flowType().SWITCH) {
                        return nodeInside.getSelectedAtPoint(point, true);
                    } else {
                        return nodeInside;
                    }
                } else {
                    return self;
                }
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
                cnxSides.back = true;
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
                var factor = config.getScale(),
                    baseRect = self.getRectBounds(),
                    expRect = getExpandedOutline(),
                    backPortsNum = self.getPortsForSide(constants.nodeSide().BACK).length,
                    frontPortsNum = self.getPortsForSide(constants.nodeSide().FRONT).length,
                    isVertical = config.getFlowDirection() === constants.flow().VERTICAL,
                    // legacy: collapsed node follows flowNode rules
                    middleShift = !_expanded ?
                        (self.getPortsForSide(constants.nodeSide().BACK).length === 0 ?
                            (isVertical ? self.width/2-6 : self.height/2-6) : 4) :
                        // expanded:
                        (self.getPortsForSide(constants.nodeSide().BACK).length === 0 ?
                            (isVertical ? self.width/2-6 : self.height/2-6) : 4),
                    shiftAcross = !_expanded ?
                        (!self.isLeftLaneNode() ? middleShift : -6 +
                        (isVertical ? self.getNodeWidth() : self.getNodeHeight()) ) :
                        // expanded:
                        (!self.isLeftLaneNode() ? middleShift : -6 +
                        (isVertical ? self.getNodeWidth() : self.getNodeHeight()) ),
                    shiftAlong = !_expanded ?
                        ((!self.isLeftLaneNode() && !self.isRightLaneNode()) ? 8 : 6) :
                        // expanded:
                        ((!self.isLeftLaneNode() && !self.isRightLaneNode()) ? 8 : 6);
                if (_expanded) {
                    //////////////
                    // EXPANDED
                    //////////////
                    if (self.markupInPort) {
                        if (backPortsNum === 0) {
                            if (isVertical) {
                                self.markupInPort.getConnector().moveToXY(expRect.width/2-6, -shiftAlong); // * DONE
                            } else {
                                self.markupInPort.getConnector().moveToXY(-shiftAlong, expRect.height/2-6); // * DONE
                            }
                        } else {
                            if (isVertical) {
                                self.markupInPort.getConnector().moveToXY(4, -shiftAlong); // * DONE
                            } else {
                                self.markupInPort.getConnector().moveToXY(-shiftAlong, 4);  // * DONE
                            }
                        }
                    }
                    if (self.markupOutAuxPort) {
                        if (backPortsNum === 0) {
                            if (isVertical) {
                                self.markupOutAuxPort.getConnector().moveToXY(expRect.width/2+6, -shiftAlong); // * DONE
                            } else {
                                self.markupOutAuxPort.getConnector().moveToXY(-shiftAlong, expRect.height/2+6); // * DONE
                            }
                        } else {
                            if (isVertical) {
                                self.markupOutAuxPort.getConnector().moveToXY(expRect.width -4, -shiftAlong);  // * DONE
                            } else {
                                self.markupOutAuxPort.getConnector().moveToXY(-shiftAlong, expRect.height-4);  // * DONE
                            }
                        }
                    }
                    if (self.markupOutPort) {
                        if (frontPortsNum === 0) {
                            if (isVertical) {
                                self.markupOutPort.getConnector().moveToXY(
                                    expRect.width/2-6, self.getNodeHeight()+ shiftAlong); // * DONE
                            } else {
                                self.markupOutPort.getConnector().moveToXY(
                                    self.getNodeWidth()+shiftAlong, expRect.height/2-6);  // * DONE
                            }
                        } else {
                            if (isVertical) {
                                self.markupOutPort.getConnector().moveToXY(4, self.getNodeHeight()+shiftAlong); // * DONE
                            } else {
                                self.markupOutPort.getConnector().moveToXY(self.getNodeWidth()+shiftAlong, 4);   // * DONE
                            }
                        }
                    }
                    if (self.markupInAuxPort) {
                        if (frontPortsNum === 0) {
                            if (isVertical) {
                                self.markupInAuxPort.getConnector().moveToXY(
                                    expRect.width/2+6, self.getNodeHeight()+shiftAlong); // * DONE
                            } else {
                                self.markupInAuxPort.getConnector().moveToXY(
                                    self.getNodeWidth()+shiftAlong, expRect.height/2+6);  // * DONE
                            }
                        } else {
                            if (isVertical) {
                                self.markupInAuxPort.getConnector().moveToXY(
                                    expRect.width -4, self.getNodeHeight()+shiftAlong); // * DONE
                            } else {
                                self.markupInAuxPort.getConnector().moveToXY(
                                    self.getNodeWidth()+shiftAlong, expRect.height -4);   // * DONE
                            }
                        }
                    }
                } else {
                    //////////////
                    // COLLAPSED
                    //////////////
                    if (self.markupInPort) {
                        if (isVertical) {
                            self.markupInPort.getConnector().moveToXY(shiftAcross, -shiftAlong);
                        } else {
                            self.markupInPort.getConnector().moveToXY(-shiftAlong, shiftAcross);
                        }
                    }
                    if (self.markupOutAuxPort) {
                        if (isVertical) {
                            self.markupOutAuxPort.getConnector().moveToXY(self.width-shiftAcross, -shiftAlong);
                        } else {
                            self.markupOutAuxPort.getConnector().moveToXY(-shiftAlong, self.height-shiftAcross);
                        }
                    }
                    if (self.markupOutPort) {
                        if (isVertical) {
                            self.markupOutPort.getConnector().moveToXY(
                                shiftAcross, self.getNodeHeight()+ (!_expanded ? shiftAlong : -shiftAlong/4));
                        } else {
                            self.markupOutPort.getConnector().moveToXY(
                                self.getNodeWidth()+(!_expanded ? shiftAlong : -shiftAlong+6), shiftAcross);
                        }
                    }
                    if (self.markupInAuxPort) {
                        if (isVertical) {
                            self.markupInAuxPort.getConnector().moveToXY(
                                self.width-shiftAcross, self.getNodeHeight()+shiftAlong);
                        } else {
                            self.markupInAuxPort.getConnector().moveToXY(
                                self.getNodeWidth()+shiftAlong, self.height-shiftAcross);
                        }
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
                        if (pnt.x < self.getX()*factor + Math.floor(self.getNodeWidth()/2)) {
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
                        if (pnt.y < self.getY()*factor + Math.floor(self.getNodeHeight()/2)) {
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
                return cnxSides.front ? self.markupInAuxPort : undefined;
            }

            function getMarkupOutPortForPoint(pnt) {
                var factor = config.getScale(),
                    cnxSides = self.getCnxRestrictions();
                if (!self.isLeftLaneNode() && !self.isRightLaneNode()) {
                    return cnxSides.front ? self.markupOutPort : undefined;
                } else {
                    if (config.getFlowDirection() === constants.flow().VERTICAL) {
                        if (pnt.x < self.getX()*factor + Math.floor(self.getNodeWidth()/2)) {
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
                        if (pnt.y < self.getY()*factor + Math.floor(self.getNodeHeight()/2)) {
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
                if (!self.isLeftLaneNode() && !self.isRightLaneNode()) {
                    var showUpper = config.getFlowDirection() === constants.flow().VERTICAL ?
                        pnt.y < self.getY()*factor + Math.floor(self.getNodeHeight()*factor/2) :
                        pnt.x < self.getX()*factor + Math.floor(self.getNodeWidth()*factor/2);

                    if (self.markupInPort) { self.markupInPort.setVisible(cnxSides.back && (showUpper ? b : false)); }
                    if (self.markupInAuxPort) { self.markupInAuxPort.setVisible(cnxSides.front && (showUpper ? false : b)); }
                    if (self.markupOutPort) { self.markupOutPort.setVisible(cnxSides.front && (showUpper ? false : b)); }
                    if (self.markupOutAuxPort) { self.markupOutAuxPort.setVisible(cnxSides.back && (showUpper ? b : false)); }

                } else {
                    if (config.getFlowDirection() === constants.flow().VERTICAL) {
                        if (pnt.x < self.getX()*factor + Math.floor(self.getNodeWidth()*factor/2)) {
                            if (self.markupInPort)  { self.markupInPort.setVisible(self.isLeftLaneNode() ? false : b); }
                            if (self.markupOutPort)  { self.markupOutPort.setVisible(self.isLeftLaneNode() ? false : b); }
                        } else {
                            if (self.markupInPort)  { self.markupInPort.setVisible(self.isLeftLaneNode() ? b : false); }
                            if (self.markupOutPort)  { self.markupOutPort.setVisible(self.isLeftLaneNode() ? b : false); }
                        }
                    } else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
                        if (pnt.y < self.getY()*factor + Math.floor(self.getNodeHeight()*factor/2)) {
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
                var barVisible = document.getElementById("blockResizeId").style.visibility === 'visible',
                    refPorts = self.getRefPorts(), i;
                if (barVisible || !config.isEditMode() ||
                    !self.isExpanded() && !self.isVisible()) {
                    for (i = 0; i < refPorts.length; i++) {
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
                    if (pnt.x < self.getX()*factor + Math.floor(self.getNodeWidth()*factor/2)) {
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
                    if (pnt.y < self.getY()*factor + Math.floor(self.getNodeHeight()*factor/2)) {
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
                    if (pnt.x < self.getX()*factor + Math.floor(self.getNodeWidth()/2)) {
                        if (rightInPort)  {  return cnxSides.right ? rightInPort : undefined; }
                    } else {
                        if (leftInPort)   { return cnxSides.left ? leftInPort : undefined; }
                    }
                } else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
                    if (pnt.y < self.getY()*factor + Math.floor(self.getNodeHeight()/2)) {
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
                    if (pnt.x < self.getX()*factor + Math.floor(self.getNodeWidth()/2)) {
                        if (rightOutPort) { return cnxSides.right ? rightOutPort : undefined; }
                    } else {
                        if (leftOutPort)  { return cnxSides.left ? leftOutPort : undefined; }
                    }
                } else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
                    if (pnt.y < self.getY()*factor + Math.floor(self.getNodeHeight()/2)) {
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

            var _extendAcrossBlockSltr = $("#extendBlockAcrossId"),
                _extendAlongBlockSltr = $("#extendBlockAlongId"),
                _shrinkAcrossBlockSltr = $("#shrinkBlockAcrossId"),
                _shrinkAlongBlockSltr = $("#shrinkBlockAlongId");


            self.drawGraphics = function(ctx) {
                // not visible if expanded
                //if (!self.isVisible()) {
                //    return;
                //}
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

                self.drawPorts(ctx);
                self.drawTextAbove(ctx, 12);
                self.drawTextBelow(ctx, 12);

                ctx.fillStyle = _myBgnColor;

                var rect = getExpandedOutline();
                if (!_expanded) {
                    if (self.isVisible()) {
                        draw.roundRect(ctx, self.x, self.y, self.width, self.height, _ARC);
                        if (_allowEdit) {
                            ctx.drawImage(_expandImg, self.x + self.width-_expandImgSize, self.y);
                            if (!canExpand()) {
                                ctx.drawImage(_stop12Img, self.x + self.width-_expandImgSize+2, self.y+2);
                            }
                        }
                    }
                } else {
                    draw.paintRectangle(ctx, rect, _myBgnColor, null, 2, .3); // background
                    draw.paintRectangle(ctx, rect, null, outlineColor, 2, 1);
                    //draw.paintRectangle(ctx, self, null, nColor, 2); // TODO: temp
                    if (_allowEdit && self.isHighlighted() && !_flowManager.getCaller().isBlockResizeBarVisible()) {
                        //ctx.drawImage(_menuImg, rect.x + 4, rect.y);
                        ctx.drawImage(_menuImg, rect.x + 8, rect.y-10);
                    }
                    if (_allowEdit && self.isHighlighted() && !_flowManager.getCaller().isBlockResizeBarVisible()) {
                        //ctx.drawImage(_collapseImg, rect.x + rect.width-_collapseImgSize-4, rect.y+4);
                        //ctx.drawImage(_collapseImg, rect.x + _collapseImgSize + 11, rect.y+2);
                        ctx.drawImage(_collapseImg, rect.x + _collapseImgSize + 15, rect.y-8);
                    }
                    if (self.isSelected() && _flowManager.getCaller().isBlockResizeBarVisible()) {
                        var factor = config.getScale(), rx = rect.x*factor, ry = rect.y*factor;
                        ctx.save();
                        ctx.setTransform(1,0,0,1,0,0);
                        ctx.drawImage(!config.isEditMode() || !self.canExtendAcross() ? _extendH20dis : _extendH20,
                            rx + 2, ry-23);
                        ctx.drawImage(!config.isEditMode() || !self.canExtendAlong() ? _extendV20dis : _extendV20,
                            rx + 22, ry-23);
                        ctx.drawImage(!config.isEditMode() || !self.canShrinkAcross() ? _shrinkH20dis : _shrinkH20,
                            rx + 45, ry-23);
                        ctx.drawImage(!config.isEditMode() || !self.canShrinkAlong() ? _shrinkV20dis : _shrinkV20,
                            rx + 66, ry-23);
                        ctx.restore();
                    }
                }

                if (!_expanded) {
                    if (self.isVisible() && !self.isHideName() && !config.hasHideNodeNames()) {
                        self.drawName(ctx, self.width-8, 1, _myFgnColor);
                    }
                } else {
                    // hide name ??
                    //self.drawName(ctx, rect.width-16, 1, _myFgnColor);
                }

                //if (!drawContentText(ctx)) {
                //    self.drawName(ctx, self.width-8, null, _myFgnColor);
                //} else {
                //    self.drawName(ctx, self.width-20, self.y+15, _myFgnColor);
                //}

                //self.drawPorts(ctx);
                //self.drawTextAbove(ctx, 12);
                //self.drawTextBelow(ctx, 12);

                //if (_allowEdit && getMenuShape().containsXY(point.x, point.y)) {
                if (_flowManager.getCaller().isBlockResizeBarVisible()) {
                    //$("#extendBlockAcrossId").refresh();
                    //$("#extendBlockAlongId").refresh();
                    //$("#shrinkBlockAcrossId").refresh();
                    //$("#shrinkBlockAlongId").refresh();
                }

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
                        ctx.fillStyle = nColor; //'#3673C3';
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

            self.initGroupNode();

        }
        jsUtils.inherit(ContainerBlock, FlowNode);
        return ContainerBlock;
    }
);