define('modules/model/moveNodeToCellUndoableAction',
    ['modules/common/map',
        'modules/flow/flowUtils',
        'modules/graph/graphConstants'],
    function(Map,
             flowUtils,
             constants) {

        function MoveNodeToCellUndoableAction(model,
                                              node,
                                              fromCell,
                                              toCell) {
            var self = this,
                _modelHandler = model,
                _node = node,
                _nodeObj = node.getNodeObject(),
                _fromCell = fromCell,
                _toCell = toCell,
                _shiftsMap = new Map(),
                _crossingsMap = new Map();

            self.getName = function() { return "["+_nodeObj.name+"]"; };

            self.execute = function() {
                _modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
                _modelHandler.moveNodeToCell(_nodeObj, _toCell);
                //moveContentObjects(_toCell.getLevelNumber(), _toCell.getLaneNumber());
            };

            self.undo = function() {
                _modelHandler.restoreSegmentEditsToLinks(_shiftsMap, _crossingsMap);
                _modelHandler.moveNodeToCell(_nodeObj, _fromCell);
                //moveContentObjects(_fromCell.getLevelNumber(), _fromCell.getLaneNumber());
            };

            self.redo = function() {
                _modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
                _modelHandler.moveNodeToCell(_nodeObj, _toCell);
                //moveContentObjects(_toCell.getLevelNumber(), _toCell.getLaneNumber());
            };

            function getShifts() {
                var links = node.getAllLinks(), i;
                for (i = 0; i < links.length; i++) {
                    if (links[i].hasSegmentShifts()) {
                        _shiftsMap.put(links[i].getName(), links[i].getSegmentShifts());
                    }
                }
                if (_toCell) {
                    links = _modelHandler.getLinksCrossingCell(_toCell);
                    for (i = 0; i < links.length; i++) {
                        if (links[i].hasSegmentShifts()) {
                            _shiftsMap.put(links[i].getName(), links[i].getSegmentShifts());
                        }
                    }
                }
            }
            function getCrossings() {
                var links = _node.getAllLinks(), i;
                for (i = 0; i < links.length; i++) {
                    if (links[i].hasForcedCrossings()) {
                        _crossingsMap.put(links[i].getName(), links[i].getForcedCrossings());
                    }
                }
                if (_toCell) {
                    links = _modelHandler.getLinksCrossingCell(_toCell);
                    for (i = 0; i < links.length; i++) {
                        if (links[i].hasForcedCrossings()) {
                            _crossingsMap.put(links[i].getName(), links[i].getForcedCrossings());
                        }
                    }
                }
            }

            //function moveContentObjects(levelNum, laneNum) {
            //    if (_node.getFlowType() === constants.flowType().CONTAINER) {
            //        flowUtils.moveRecursivelyContainersContent(_node, _modelHandler.getFlowModel(), levelNum, laneNum);
            //    }
            //}

            getShifts();
            getCrossings();

        }
        return MoveNodeToCellUndoableAction;
    }
);
