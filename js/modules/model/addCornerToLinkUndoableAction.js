define('modules/model/addCornerToLinkUndoableAction',
    ['modules/diagram/diagramUtils'],
    function(diagramUtils) {

        function AddCornerToLinkUndoableAction(model, link, pipeXing, cornerType) {
            var self = this,
                _modelHandler = model,
                _link = link,
                _pipeXing = pipeXing,
                _cornerType = cornerType,
                _index = -1;

            self.getName = function() { return _link.getName(); };

            self.execute = function() {
                _modelHandler.addForcedCrossingToLink(_link, _pipeXing, _cornerType);
            };

            self.undo = function() {
                _index = _modelHandler.removeForcedCrossingFromLink(_link, _pipeXing);
            };

            self.redo = function() {
                _modelHandler.setForcedCrossingToLink(_link, _pipeXing, _index);
            };

        }
        return AddCornerToLinkUndoableAction;
    }
);
