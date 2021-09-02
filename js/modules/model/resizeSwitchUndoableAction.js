define('modules/model/resizeSwitchUndoableAction',
    ['modules/graph/graphConstants'],
    function(constants) {

        function ResizeSwitchUndoableAction(flowManager, switchObj, resizeParam) {
            var self = this,
                _modelHandler = flowManager.getModelHandler(),
                _flowLayout = flowManager.getFlowLayout(),
                _switchObj = switchObj,
                _resizeParam = resizeParam,
                _reverseParam,
                _undoParam;
            // undoParam is needed when container auto-resize is implemented
            // TODO: revisit the initial settings

            self.getName = function() { return _switchObj.name; };

            self.execute = function() {
                _modelHandler.resizeSwitch(_switchObj, _flowLayout, _resizeParam, _undoParam);
            };

            self.undo = function() {
                _modelHandler.resizeSwitch(_switchObj, _flowLayout, _reverseParam, _undoParam);
            };

            self.redo = function() {
                _modelHandler.resizeSwitch(_switchObj, _flowLayout, _resizeParam, _undoParam);
            };

            function setReverseParam() {
                if (_resizeParam === constants.blockResize().EXTEND_ACROSS) {
                    _reverseParam = constants.blockResize().SHRINK_ACROSS;
                    _undoParam = true;
                }
                if (_resizeParam === constants.blockResize().SHRINK_ACROSS) {
                    _reverseParam = constants.blockResize().EXTEND_ACROSS;
                    _undoParam = true;
                }
            }

            function setUndoParam() {

            }

            setReverseParam();
        }
        return ResizeSwitchUndoableAction;
    }
);
