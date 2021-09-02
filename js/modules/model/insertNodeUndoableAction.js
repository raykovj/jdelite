define('modules/model/insertNodeUndoableAction',
    ['modules/common/map'],
    function(Map) {

        // obsolete: MANUAL ???
        function InsertNodeUndoableAction(model, nodeObject, insertLevelNum, insertLaneNum, rect) {
            var self = this,
                _modelHandler = model,
                _nodeObj = nodeObject,
                _insertLevelNum = insertLevelNum,
                _insertLaneNum = insertLaneNum,
                _rect = rect,
                _shiftsMap = new Map(),
                _crossingsMap = new Map();

            self.getName = function() { return "["+_nodeObj.name+"]"; };

            self.execute = function() {
                //console.log("++++ INSERT NODE: level="+insertLevelNum+", levelNum="+_nodeObj.levelNum);
                _modelHandler.addCorridors(_insertLevelNum, _insertLaneNum, true);
                _modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
                _modelHandler.addNodeToModel(_nodeObj);
            };

            self.undo = function() {
                _modelHandler.removeNodeFromModel(_nodeObj);
                _modelHandler.removeEmptyCorridors(_insertLevelNum, _insertLaneNum, false);
                _modelHandler.restoreSegmentEditsToLinks(_shiftsMap, _crossingsMap);
            };

            self.redo = function() {
                _modelHandler.addCorridors(_insertLevelNum, _insertLaneNum, true);
                _modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
                _modelHandler.addNodeToModel(_nodeObj);
            };

            function getShifts() {
                if (_rect) {
                    var links = _modelHandler.getLinksCrossingCell(_rect);
                    for (var i = 0; i < links.length; i++) {
                        if (links[i].hasSegmentShifts()) {
                            _shiftsMap.put(links[i].getName(), links[i].getSegmentShifts());
                        }
                    }
                }
            }
            function getCrossings() {
                if (_rect) {
                    var links = _modelHandler.getLinksCrossingCell(_rect);
                    for (var i = 0; i < links.length; i++) {
                        if (links[i].hasForcedCrossings()) {
                            _crossingsMap.put(links[i].getName(), links[i].getForcedCrossings());
                        }
                    }
                }
            }
            getShifts();
            getCrossings();
        }
        return InsertNodeUndoableAction;
    }
);
