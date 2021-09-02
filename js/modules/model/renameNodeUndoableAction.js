define('modules/model/renameNodeUndoableAction',
    ['modules/common/map'],
    function(Map) {

        function RenameNodeUndoableAction(model, itemsMap, actionName, oldName, newName) {
            var self = this,
                _modelHandler = model,
                _itemsMap = itemsMap,
                _actionName = actionName,
                _oldName = oldName,
                _newName = newName;

            self.getName = function() { return "["+_actionName+"]"; };

            self.execute = function() {
                _itemsMap = _modelHandler.renameNodeInModel(_itemsMap, _oldName, _newName);
            };

            self.undo = function() {
                _itemsMap = _modelHandler.renameNodeInModel(_itemsMap, _newName, _oldName);
            };

            self.redo = function() {
                _itemsMap = _modelHandler.renameNodeInModel(_itemsMap, _oldName, _newName);
            };

        }
        return RenameNodeUndoableAction;
    }
);
