define('modules/model/setNodeResizeUndoableAction',
    ['modules/settings/config'],
    function(config) {

        // not used, obsolete likely
        function SetNodeResizeUndoableAction(model, node, resizeW, resizeH) {
            var self = this,
                _modelHandler = model,
                _node = node,
                _nextResizeW = resizeW,
                _nextResizeH = resizeH,
                _prevResizeW = -resizeW,
                _prevResizeH = -resizeH,
                _flowDir = config.getFlowDirection();

            self.getName = function() { return _node.getName(); };

            self.execute = function() {
                _modelHandler.setNodeResize(_node, _nextResizeW, _nextResizeH);
            };

            self.undo = function() {
                var rszW = config.getFlowDirection() === _flowDir ? _prevResizeW : _prevResizeH,
                    rszH = config.getFlowDirection() === _flowDir ? _prevResizeH : _prevResizeW;
                _modelHandler.setNodeResize(_node, rszW, rszH);
            };

            self.redo = function() {
                var rszW = config.getFlowDirection() === _flowDir ? _nextResizeW : _nextResizeH,
                    rszH = config.getFlowDirection() === _flowDir ? _nextResizeH : _nextResizeW;
                _modelHandler.setNodeResize(_node, rszW, rszH);
            };

        }
        return SetNodeResizeUndoableAction;
    }
);
