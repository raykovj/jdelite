define('modules/model/changeDecisionEndsUndoableAction',
    ['modules/common/map'],
    function(Map) {
        function ChangeDecisionEndsUndoableAction(model, nodeObject, newInput, newEnds) {
            var self = this,
                _modelHandler = model,
                _nodeObj = nodeObject,
                _oldInput = nodeObject.decisionInput,
                _newInput = newInput,
                _oldEnds = nodeObject.decisionEnds,
                _newEnds = newEnds,
                _shiftsMap = new Map(),
                _crossingsMap = new Map();

            self.getName = function() { return _nodeObj.name; };

            self.execute = function() {
                //_modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
                _modelHandler.changeDecisionEnds(_nodeObj, _newInput, _newEnds);
            };

            self.undo = function() {
                //_modelHandler.restoreSegmentEditsToLinks(_shiftsMap, _crossingsMap);
                _modelHandler.changeDecisionEnds(_nodeObj, _oldInput, _oldEnds);
            };

            self.redo = function() {
                //_modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
                _modelHandler.changeDecisionEnds(_nodeObj, _newInput, _newEnds);
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
        return ChangeDecisionEndsUndoableAction;
    }
);
