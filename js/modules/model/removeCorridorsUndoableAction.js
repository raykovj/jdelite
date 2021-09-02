define('modules/model/removeCorridorsUndoableAction',
    ['modules/common/map'],
    function(Map) {

        function RemoveCorridorsUndoableAction(model, levelNum, laneNum, name) {
            var self = this,
                _modelHandler = model,
                _levelNum = levelNum,
                _laneNum = laneNum,
                _shiftsMap = new Map(),
                _crossingsMap = new Map();

            self.getName = function() { return name; };

            self.execute = function() {
                _modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
                _modelHandler.removeEmptyCorridors(_levelNum, _laneNum, true);
            };

            self.undo = function() {
                _modelHandler.restoreSegmentEditsToLinks(_shiftsMap, _crossingsMap);
                _modelHandler.addCorridors(_levelNum, _laneNum, true);
            };

            self.redo = function() {
                _modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
                _modelHandler.removeEmptyCorridors(_levelNum, _laneNum, true);
            };

            function getShifts() {
                var links = _modelHandler.getFlowLinks();
                for (var i = 0; i < links.length; i++) {
                    if (links[i].hasSegmentShifts()) {
                        _shiftsMap.put(links[i].getName(), links[i].getSegmentShifts());
                    }
                }
            }
            function getCrossings() {
                var links = _modelHandler.getFlowLinks();
                for (var i = 0; i < links.length; i++) {
                    if (links[i].hasForcedCrossings()) {
                        _crossingsMap.put(links[i].getName(), links[i].getForcedCrossings());
                    }
                }
            }
            getShifts();
            getCrossings();

        }
        return RemoveCorridorsUndoableAction;
    }
);
