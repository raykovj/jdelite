define('modules/model/resizeContainerUndoableAction',
    ['modules/graph/graphConstants'],
    function(constants) {

        function ResizeContainerUndoableAction(flowManager, containerObj, resizeParam) {
            var self = this,
                _modelHandler = flowManager.getModelHandler(),
                _flowLayout = flowManager.getFlowLayout(),
                _containerObj = containerObj,
                _resizeParam = resizeParam,
                _reverseParam,
                _undoParam;
            // undoParam is needed when container auto-resize is implemented
            // TODO: revisit the initial settings

            self.getName = function() { return _containerObj.name; };

            self.execute = function() {
                _modelHandler.resizeExpandedContainer(_containerObj, _flowLayout, _resizeParam, _undoParam);
            };

            self.undo = function() {
                _modelHandler.resizeExpandedContainer(_containerObj, _flowLayout, _reverseParam, _undoParam);
            };

            self.redo = function() {
                _modelHandler.resizeExpandedContainer(_containerObj, _flowLayout, _resizeParam, _undoParam);
            };

            function setReverseParam() {
                if (_resizeParam === constants.blockResize().EXTEND_ALONG) {
                    _reverseParam = constants.blockResize().SHRINK_ALONG;
                    _undoParam = true;
                }
                if (_resizeParam === constants.blockResize().SHRINK_ALONG) {
                    _reverseParam = constants.blockResize().EXTEND_ALONG;
                    _undoParam = true;
                }
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
        return ResizeContainerUndoableAction;
    }
);
