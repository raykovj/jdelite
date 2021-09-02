define('modules/model/addLinkUndoableAction',
    ['modules/diagram/diagramUtils'],
    function(diagramUtils) {

        function AddLinkUndoableAction(model, linkObject) {
            var self = this,
                _modelHandler = model,
                _linkObj = linkObject;

            self.getName = function() { return diagramUtils.getLinkObjectName(_linkObj); };

            self.execute = function() {
                _modelHandler.addLinkToModel(_linkObj);
            };

            self.undo = function() {
                _modelHandler.removeLinkFromModel(_linkObj);
            };

            self.redo = function() {
                _modelHandler.addLinkToModel(_linkObj);
            };

        }
        return AddLinkUndoableAction;
    }
);
