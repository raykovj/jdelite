define('modules/model/removeMultipleUndoableAction',
    ['modules/common/map'],
    function(Map) {

        function RemoveMultipleUndoableAction(model, selectionsMap, name) {
            var self = this,
                _modelHandler = model,
                _selectionsMap = selectionsMap,
                _name = name,
                _emptyCorridorsMap = new Map(); // TODO: not used

            self.getName = function() { return "["+_name+"]"; };

            self.execute = function() {
                _modelHandler.removeMultipleFromModel(_selectionsMap, _emptyCorridorsMap);
            };

            self.undo = function() {
                _modelHandler.addMultipleToModel(_selectionsMap, _emptyCorridorsMap);
            };

            self.redo = function() {
                _modelHandler.removeMultipleFromModel(_selectionsMap, _emptyCorridorsMap);
            };

        }
        return RemoveMultipleUndoableAction;
    }
);
