define('modules/model/removeSegmentShiftsUndoableAction',
    ['modules/common/map'],
    function(Map) {

        function RemoveSegmentShiftsUndoableAction(model, links) {
            var self = this,
                _modelHandler = model,
                _links = links,
                _shiftsMap = new Map(),
                _crossingsMap = new Map();

            self.getName = function() { return "[remove segment shifts]"; };

            self.execute = function() {
                _modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
            };

            self.undo = function() {
                _modelHandler.restoreSegmentEditsToLinks(_shiftsMap, _crossingsMap);
            };

            self.redo = function() {
                _modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
            };

            function getShifts() {
                for (var i = 0; i < _links.length; i++) {
                    _shiftsMap.put(_links[i].getName(), _links[i].getSegmentShifts());
                }
            }
            function getCrossings() {
                for (var i = 0; i < _links.length; i++) {
                    if (links[i].hasForcedCrossings()) {
                        _crossingsMap.put(_links[i].getName(), _links[i].getForcedCrossings());
                    }
                }
            }
            getShifts();
            getCrossings();
        }
        return RemoveSegmentShiftsUndoableAction;
    }
);
