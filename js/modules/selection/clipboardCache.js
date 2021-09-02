define('modules/selection/clipboardCache',
    ['modules/common/map',
        'modules/geometry/rectangle',
        'modules/flow/flowUtils',
        'modules/settings/config',
        'modules/diagram/diagramUtils',
        'modules/util/utils',
        'modules/graph/graphConstants'],
    function(Map,
             Rectangle,
             flowUtils,
             config,
             diagramUtils,
             utils,
             constants) {

        function ClipboardCache(manager) {
            var self = this,
                _manager = manager,
                _flowLayout = manager.getFlowLayout(),
                _copyMap = new Map(),
                _canPaste = false,
                _readyToPaste = false,
                _nodeObjects = [],
                _linkObjects = [],
                _minLevelNum,
                _maxLevelNum,
                _minLaneNum,
                _maxLaneNum,
                _pasteLocation,
                _pastePoint,
                NODES_KEY = constants.selections().NODES,
                LINKS_KEY = constants.selections().LINKS;

            self.doCopy = function(map) {
                _canPaste = false;
                _readyToPaste = false;
                var selectionManager = manager.getSelectionManager();
                _nodeObjects = map.get(NODES_KEY);
                _linkObjects = map.get(LINKS_KEY);
                selectionManager.clearSelections();
                if (_nodeObjects && _nodeObjects.length > 0) {
                    _minLevelNum = _nodeObjects[0].levelNum;
                    _maxLevelNum = _nodeObjects[0].levelNum;
                    _minLaneNum = _nodeObjects[0].laneNum;
                    _maxLaneNum = _nodeObjects[0].laneNum;

                    var nodes = _manager.getModelHandler().getFlowNodes();
                    _nodeObjects.forEach(function(obj) {
                        _minLevelNum = Math.min(_minLevelNum, obj.levelNum);
                        _maxLevelNum = Math.max(_maxLevelNum, obj.levelNum);
                        _minLaneNum = Math.min(_minLaneNum, obj.laneNum);
                        _maxLaneNum = Math.max(_maxLaneNum, obj.laneNum);

                        for (var i = 0; i < nodes.length; i++) {
                            if (nodes[i].getName() === obj.name) {
                                selectionManager.addToSelections(nodes[i]);
                                break;
                            }
                        }
                    });
                    if (_linkObjects && _linkObjects.length > 0) {
                        var links = _manager.getModelHandler().getFlowLinks();
                        _linkObjects.forEach(function(obj) {
                            for (var i = 0; i < links.length; i++) {
                                if (links[i].getName() === obj.name) {
                                    selectionManager.addToSelections(links[i]);
                                    break;
                                }
                            }
                        });
                    }
                    _copyMap = map;
                    //map.print();
                    _canPaste = true;
                }
            };

            self.getSelectionWrapper = function() {
                //var factor = config.getScale();
                if (_minLevelNum === _maxLevelNum && _minLaneNum === _maxLaneNum) {
                    return diagramUtils.getCellRectAt(_manager, _minLevelNum, _minLaneNum);
                } else {
                    var startTopCell = diagramUtils.getCellRectAt(_manager, _minLevelNum, _minLaneNum),
                        endBottomCell = diagramUtils.getCellRectAt(_manager, _maxLevelNum, _maxLaneNum),
                        x = startTopCell.x,
                        y = startTopCell.y,
                        width = endBottomCell.x + endBottomCell.width - startTopCell.x,
                        height = endBottomCell.y + endBottomCell.height - startTopCell.y;
                    return new Rectangle(x, y, width, height);
                }
            };

            self.isPasteLocationOk = function(point) {
                _pasteLocation = getPasteLocation(point);
                if (_pasteLocation) {
                    //console.log("*** location: ***\n" + "targetCell=" + _pasteLocation.targetCell +
                    //    ", levelNum=" + _pasteLocation.levelNum + ", laneNum=" + _pasteLocation.laneNum +
                    //    ", levelPipeNum=" + _pasteLocation.levelPipeNum + ", lanePipeNum=" + _pasteLocation.lanePipeNum);
                }
                var retValue = _pasteLocation && _pasteLocation.levelNum >= 0 && _pasteLocation.laneNum >= 0;
                if (retValue) {
                    _pastePoint = point;
                    _readyToPaste = true;
                } else {
                    _pastePoint = undefined;
                    _readyToPaste = false;
                }
                return retValue;
            };


            function getPasteLocation(point) {
                if (config.hasSideSwimLanes()) {
                    if (_flowLayout.getLeftSwimLane().hasPointInside(point) ||
                        _flowLayout.getRightSwimLane().hasPointInside(point)) {
                        return undefined;
                    }
                }
                if (config.hasStartEndLevels()) {
                    if (_flowLayout.getStartLevel().hasPointInside(point) ||
                        _flowLayout.getEndLevel().hasPointInside(point)) {
                        return undefined;
                    }
                }
                var cells = _flowLayout.getNodeToCellMap().values();
                for (var k = 0; k < cells.length; k++) {
                    if (cells[k].hasPointInside(point)) {
                        return undefined;
                    }
                }

                var location = { levelNum: -1, levelPipeNum: -1, laneNum: -1, lanePipeNum: -1 };

                var levels = _flowLayout.getLevels(),
                    lanes = _flowLayout.getLanes(),
                    minLevelNumber = flowUtils.getMinLevelNumber(),
                    maxLevelNumber = flowUtils.getMaxLevelNumber(_flowLayout),
                    minLaneNumber = flowUtils.getMinLaneNumber(),
                    maxLaneNumber = flowUtils.getMaxLaneNumber(_flowLayout),
                    i;
                for (i = minLevelNumber; i <= maxLevelNumber; i++) {
                    if (levels[i].hasPointInside(point)) {
                        location.levelNum = i;
                        break;
                    }
                }
                for (i = minLaneNumber; i <= maxLaneNumber; i++) {
                    if (lanes[i].hasPointInside(point)) {
                        location.laneNum = i;
                        break;
                    }
                }

                var levelPipes = _flowLayout.getLevelPipes(),
                    lanePipes = _flowLayout.getLanePipes(),
                    minLevelPipeNumber = flowUtils.getMinLevelPipeNumber(),
                    maxLevelPipeNumber = flowUtils.getMaxLevelPipeNumber(_flowLayout),
                    minLanePipeNumber = flowUtils.getMinLanePipeNumber(),
                    maxLanePipeNumber = flowUtils.getMaxLanePipeNumber(_flowLayout);
                for (i = minLevelPipeNumber; i <= maxLevelPipeNumber; i++) {
                    if (levelPipes[i].hasPointInside(point)) {
                        location.levelPipeNum = i;
                        location.levelNum = i;
                        break;
                    }
                }
                for (i = minLanePipeNumber; i <= maxLanePipeNumber; i++) {
                    if (lanePipes[i].hasPointInside(point)) {
                        location.lanePipeNum = i;
                        location.laneNum = i;
                        break;
                    }
                }

                var emptyCells = _flowLayout.getEmptyCells();
                for (i = 0; i < emptyCells.length; i++) {
                    if (emptyCells[i].hasPointInside(point)) {
                        location.targetCell = emptyCells[i];
                        location.levelNum = emptyCells[i].getLevelNumber();
                        location.laneNum = emptyCells[i].getLaneNumber();
                        break;
                    }
                }
                return location;
            }

            self.canPaste = function() {
                return _canPaste;
            };

            self.readyToPaste = function() {
                return _canPaste && _readyToPaste;
            };

            self.clearCopyPaste = function() {
                _canPaste = false;
                _readyToPaste = false;
                _copyMap = new Map();
                _pasteLocation = undefined;
                // TODO
            };

            self.doPaste = function() {
                if (!_pasteLocation || _pasteLocation.levelNum < 0 || _pasteLocation.laneNum < 0) {
                    // TODO: paste failed
                    return false;
                }
                var newNodeObjects = [],
                    newLinkObjects = [],
                    levelShift = _pasteLocation.levelNum - _minLevelNum,
                    laneShift = _pasteLocation.laneNum - _minLaneNum,
                    nodeNamesMap = _manager.getNodeNamesMap(),
                    relMap = new Map(),
                    i;
                for (i = 0; i < _nodeObjects.length; i++) {
                    var oldObj = _nodeObjects[i],
                        newNodeObj = Object.assign({}, oldObj),
                        flowType = oldObj.type,
                        newName = diagramUtils.generateNextNodeName(nodeNamesMap, flowType);
                    newNodeObj.name = newName;
                    newNodeObj.levelNum = newNodeObj.levelNum + levelShift;
                    newNodeObj.laneNum = newNodeObj.laneNum + laneShift;
                    newNodeObjects.push(newNodeObj);
                    utils.addToNamesMap(nodeNamesMap, newName, flowType);
                    relMap.put(oldObj.name, newName);
                }
                for (i = 0; i < newNodeObjects.length; i++) {
                    var ctrName = newNodeObjects[i].containerName;
                    if (ctrName) {
                        newNodeObjects[i].containerName = relMap.get(ctrName);
                    }
                }
                for (i = 0; i < newNodeObjects.length; i++) {
                    if (newNodeObjects[i].type === constants.flowType().CONTAINER) {
                        var names = newNodeObjects[i].contentNodes;
                        if (names && names.length > 0) {
                            var namesArr = names.split(','),
                                newNamesArr = [];
                            namesArr.forEach(function(name) {
                                newNamesArr.push(relMap.get(name));
                            });
                            newNodeObjects[i].contentNodes = newNamesArr.join();
                        }
                    }
                }
                for (i = 0; i < _linkObjects.length; i++) {
                    var link = _linkObjects[i],
                        newLinkObj = Object.assign({}, link),
                        srcDel = link.source.indexOf("/"),
                        srcNodeName = link.source.slice(0, srcDel),
                        newSrcNodeName = relMap.get(srcNodeName),
                        srcPortName = link.source.slice(srcDel+1),
                        trgDel = link.target.indexOf("/"),
                        trgNodeName = link.target.slice(0, trgDel),
                        newTrgNodeName = relMap.get(trgNodeName),
                        trgPortName = link.target.slice(trgDel+1);

                    newLinkObj.source = newSrcNodeName+"/"+srcPortName;
                    newLinkObj.target = newTrgNodeName+"/"+trgPortName;
                    newLinkObj.name = "["+newLinkObj.source+"]-["+newLinkObj.target+"]";
                    newLinkObj.segmentShifts = [];
                    newLinkObj.corners = [];
                    newLinkObjects.push(newLinkObj);
                }

                var levelContext = getNewLevelsContext(),
                    laneContext = getNewLanesContext();
                _manager.getFlowController().copyPaste(
                    levelContext.startToCopy,
                    levelContext.levelsNeeded,
                    laneContext.startToCopy,
                    laneContext.lanesNeeded,
                    newNodeObjects,
                    newLinkObjects);

            };

            function getNewLevelsContext() {
                var levels = _flowLayout.getLevels(),
                    maxLevelNumber = flowUtils.getMaxLevelNumber(_flowLayout),
                    levelsDiff = _maxLevelNum - _minLevelNum,
                    lanesDiff = _maxLaneNum - _minLaneNum,
                    levelsNeeded = levelsDiff + 1,
                    startNewLevelNum = -1,
                    context = {};
                if (_pasteLocation.levelNum + levelsDiff > maxLevelNumber) {
                    context.startToCopy = _pasteLocation.levelNum;
                    context.levelsNeeded = levelsNeeded;
                } else {
                    for (var i = _pasteLocation.levelNum; i <= _pasteLocation.levelNum + levelsDiff; i++) {
                        if (levels[i].hasLaneRangeEmpty(_pasteLocation.laneNum, _pasteLocation.laneNum + lanesDiff)) {
                            levelsNeeded--;
                        } else {
                            if (startNewLevelNum < 0) { startNewLevelNum = i; }
                            break;
                        }
                    }
                    context.startToCopy = startNewLevelNum;
                    context.levelsNeeded = levelsNeeded;
                }
                return context;
            }

            function getNewLanesContext() {
                var lanes = _flowLayout.getLanes(),
                    maxLaneNumber = flowUtils.getMaxLaneNumber(_flowLayout),
                    levelsDiff = _maxLevelNum - _minLevelNum,
                    lanesDiff = _maxLaneNum - _minLaneNum,
                    lanesNeeded = lanesDiff + 1,
                    startNewLaneNum = -1,
                    context = {};
                if (_pasteLocation.laneNum + lanesDiff > maxLaneNumber) {
                    context.startToCopy = _pasteLocation.laneNum;
                    context.lanesNeeded = lanesNeeded;
                } else {
                    for (var i = _pasteLocation.laneNum; i <= _pasteLocation.laneNum + lanesDiff; i++) {
                        if (lanes[i].hasLevelRangeEmpty(_pasteLocation.levelNum, _pasteLocation.levelNum + levelsDiff)) {
                            lanesNeeded--;
                        } else {
                            if (startNewLaneNum < 0) { startNewLaneNum = i; }
                            break;
                        }
                    }
                    context.startToCopy = startNewLaneNum;
                    context.lanesNeeded = lanesNeeded;
                }
                return context;
            }

        }
        return ClipboardCache;
    }
);
