define('modules/model/setSegmentShiftUndoableAction',
    ['modules/graph/graphConstants'],
    function(constants) {

        function SetSegmentShiftUndoableAction(model, link, segmentOrder, newShift) {
            var self = this,
                _modelHandler = model,
                _link = link,
                _segmentOrder = segmentOrder,
                _oldShift = link.getSegmentShift(segmentOrder),
                _newShift = newShift;

            self.getName = function() { return "[shift to step] "; };

            self.execute = function() {
                //console.log("EXECUTE segment shift: "+_segmentOrder+", "+_newShift);
                _modelHandler.setSegmentShift(_link, _segmentOrder, _newShift);
            };

            self.undo = function() {
                //console.log("UNDO segment shift: "+_segmentOrder+", "+_newShift);
                _modelHandler.resetSegmentShift(_link, _segmentOrder, -_newShift);
            };

            self.redo = function() {
                _modelHandler.setSegmentShift(_link, _segmentOrder, _newShift);
            };

        }
        return SetSegmentShiftUndoableAction;
    }
);
