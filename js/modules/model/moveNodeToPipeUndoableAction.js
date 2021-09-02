define('modules/model/moveNodeToPipeUndoableAction',
    ['modules/common/map',
        'modules/flow/flowUtils',
        'modules/graph/graphConstants'],
    function(Map,
             flowUtils,
             constants) {

        function MoveNodeToPipeUndoableAction(model,
                                              oldNode,
                                              newNode,
                                              newLevelNum,
                                              newLaneNum,
                                              insertLevelNum,
                                              insertLaneNum,
                                              rect) {
            var self = this,
                _modelHandler = model,
                _newNode = newNode,
                _newNodeObj = newNode.getNodeObject(),
                _oldLevelNum = oldNode.getNodeObject().levelNum,
                _oldLaneNum = oldNode.getNodeObject().laneNum,
                _newLevelNum = newLevelNum,
                _newLaneNum = newLaneNum,
                _insertLevelNum = insertLevelNum,
                _insertLaneNum = insertLaneNum,
                _rect = rect,
                _shiftsMap = new Map(),
                _crossingsMap = new Map();

            self.getName = function() { return "["+_newNodeObj.name+"]"; };

            self.execute = function() {
                _modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
                _modelHandler.addCorridors(_insertLevelNum, _insertLaneNum, true);
                _modelHandler.moveNodeToPipe(_newNodeObj, _newLevelNum, _newLaneNum);
                //moveContentObjects(_newLevelNum, _newLaneNum);
            };

            self.undo = function() {
                _modelHandler.restoreSegmentEditsToLinks(_shiftsMap, _crossingsMap);
                _modelHandler.moveNodeToPipe(_newNodeObj, -1, -1);
                //moveContentObjects(-1, -1);
                _modelHandler.removeEmptyCorridors(_insertLevelNum, _insertLaneNum, false);
                _modelHandler.moveNodeToPipe(_newNodeObj, _oldLevelNum, _oldLaneNum);
                //moveContentObjects(_oldLevelNum, _oldLaneNum);
            };

            self.redo = function() {
                _modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
                _modelHandler.addCorridors(_insertLevelNum, _insertLaneNum, true);
                _modelHandler.moveNodeToPipe(_newNodeObj, _newLevelNum, _newLaneNum);
                //moveContentObjects(_newLevelNum, _newLaneNum);
            };

            function getShifts() {
                var links = newNode.getAllLinks();
                for (var i = 0; i < links.length; i++) {
                    if (links[i].hasSegmentShifts()) {
                        _shiftsMap.put(links[i].getName(), links[i].getSegmentShifts());
                    }
                }
                if (_rect) {
                    links = _modelHandler.getLinksCrossingCell(_rect);
                    for (i = 0; i < links.length; i++) {
                        if (links[i].hasSegmentShifts()) {
                            _shiftsMap.put(links[i].getName(), links[i].getSegmentShifts());
                        }
                    }
                }
            }
            function getCrossings() {
                var links = newNode.getAllLinks();
                for (var i = 0; i < links.length; i++) {
                    if (links[i].hasForcedCrossings()) {
                        _crossingsMap.put(links[i].getName(), links[i].getForcedCrossings());
                    }
                }
                if (_rect) {
                    links = _modelHandler.getLinksCrossingCell(_rect);
                    for (i = 0; i < links.length; i++) {
                        if (links[i].hasForcedCrossings()) {
                            _crossingsMap.put(links[i].getName(), links[i].getForcedCrossings());
                        }
                    }
                }
            }

            //function moveContentObjects(levelNum, laneNum) {
            //    if (_newNode.getFlowType() === constants.flowType().CONTAINER) {
            //        flowUtils.moveRecursivelyContainersContent(_newNode, _modelHandler.getFlowModel(), levelNum, laneNum);
            //    }
            //}

            getShifts();
            getCrossings();
        }
        return MoveNodeToPipeUndoableAction;
    }
);
