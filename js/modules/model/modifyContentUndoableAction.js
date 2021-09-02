define('modules/model/modifyContentUndoableAction',
    ['modules/common/map'],
    function(Map) {

        function ModifyContentUndoableAction(model, node, newText, newTextAbove, newTextBelow) {
            var self = this,
                _modelHandler = model,
                _node = node,
                _oldText = node.getContentText(),
                _oldTextAbove = node.getContentTextAbove(),
                _oldTextBelow = node.getContentTextBelow(),
                _newText = newText,
                _newTextAbove = newTextAbove,
                _newTextBelow = newTextBelow;

            self.getName = function() { return _node.getName(); };

            self.execute = function() {
                _modelHandler.modifyNodeContentText(_node, _newText, _newTextAbove, _newTextBelow);
            };

            self.undo = function() {
                _modelHandler.modifyNodeContentText(_node, _oldText, _oldTextAbove, _oldTextBelow);
            };

            self.redo = function() {
                _modelHandler.modifyNodeContentText(_node, _newText, _newTextAbove, _newTextBelow);
            };

        }
        return ModifyContentUndoableAction;
    }
);
