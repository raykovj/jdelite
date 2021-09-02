define('modules/model/removeNodesResizeValuesUndoableAction',
    ['modules/common/map'],
    function(Map) {

        function RemoveNodesResizeValuesUndoableAction(model, nodes) {
            var self = this,
                _modelHandler = model,
                _nodes = nodes,
                _resizeMap = new Map();

            self.getName = function() { return "[remove resize values]"; };

            self.execute = function() {
                _modelHandler.clearNodesResizeValues(_resizeMap.keys());
            };

            self.undo = function() {
                _modelHandler.restoreNodesResizeValues(_resizeMap);
            };

            self.redo = function() {
                _modelHandler.clearNodesResizeValues(_resizeMap.keys());
            };

            function getResizeValues() {
                for (var i = 0; i < _nodes.length; i++) {
                    if (_nodes[i].hasResizeValues()) {
                        var params = {};
                        params.rW = _nodes[i].getResizeW();
                        params.rH = _nodes[i].getResizeH();
                        _resizeMap.put(_nodes[i].getName(), params);
                    }
                }
            }
            getResizeValues();
        }
        return RemoveNodesResizeValuesUndoableAction;
    }
);
