define('modules/model/copyPasteUndoableAction',
    ['modules/common/map'],
    function(Map) {

        function CopyPasteUndoableAction(
                model,
                startLevelIdx,
                newLevelsNum,
                startLaneIdx,
                newLanesNum,
                newNodeObjects,
                newLinkObjects,
                name) {
            var self = this,
                _modelHandler = model,
                _startLevelIdx = startLevelIdx,
                _newLevelsNum = newLevelsNum,
                _startLaneIdx = startLaneIdx,
                _newLanesNum = newLanesNum,
                _newNodeObjects = newNodeObjects,
                _newLinkObjects = newLinkObjects,
                _shiftsMap = new Map(),
                _crossingsMap = new Map();

            self.getName = function() { return name; };

            self.execute = function() {
                _modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
                _modelHandler.addCopyPaste(
                    _startLevelIdx, _newLevelsNum,
                    _startLaneIdx, _newLanesNum,
                    _newNodeObjects, _newLinkObjects);
            };

            self.undo = function() {
                _modelHandler.restoreSegmentEditsToLinks(_shiftsMap, _crossingsMap);
                _modelHandler.removeCopyPaste(
                    _startLevelIdx, _newLevelsNum,
                    _startLaneIdx, _newLanesNum,
                    _newNodeObjects, _newLinkObjects);
            };

            self.redo = function() {
                _modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
                _modelHandler.addCopyPaste(
                    _startLevelIdx, _newLevelsNum,
                    _startLaneIdx, _newLanesNum,
                    _newNodeObjects, _newLinkObjects);
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
        return CopyPasteUndoableAction;
    }
);
