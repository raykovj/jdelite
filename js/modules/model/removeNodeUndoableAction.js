define('modules/model/removeNodeUndoableAction',
    function() {
        // obsolete
        function RemoveNodeUndoableAction(model, nodeObject) {
            var self = this,
                _modelHandler = model,
                _nodeObj = nodeObject,
                _order;

            self.getName = function() { return "["+_nodeObj.name+"]"; };

            self.execute = function() {
                _order = _modelHandler.removeNodeFromModel(_nodeObj);
                _nodeObj.order = _order;
            };

            self.undo = function() {
                _modelHandler.addNodeToModel(_nodeObj);
            };

            self.redo = function() {
                _order = _modelHandler.removeNodeFromModel(_nodeObj);
                _nodeObj.order = _order;
            };

        }
        return RemoveNodeUndoableAction;
    }
);
