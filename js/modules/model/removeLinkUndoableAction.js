define('modules/model/removeLinkUndoableAction',
    ['modules/diagram/diagramUtils'],
    function(diagramUtils) {

        // not used, removeMultiple... is used instead
        function RemoveLinkUndoableAction(model, linkObject) {
            var self = this,
                _modelHandler = model,
                _linkObj = linkObject;

            self.getName = function() { return diagramUtils.getLinkObjectName(_linkObj); };

            self.execute = function() {
                //console.log("@@@@@@@@@@@@@@@ execute removeLinkFromModel: "+_linkObj.name+", "+_linkObj.order);
                _modelHandler.removeLinkFromModel(_linkObj);
            };

            self.undo = function() {
                //console.log("@@@@@@@@@@@@@@@ UNDO addLinkToModel: "+_linkObj.name+", "+_linkObj.order);
                _modelHandler.addLinkToModel(_linkObj);
            };

            self.redo = function() {
                //console.log("@@@@@@@@@@@@@@@ REDO removeLinkFromModel: "+_linkObj.name+", "+_linkObj.order);
                _modelHandler.removeLinkFromModel(_linkObj);
            };

        }
        return RemoveLinkUndoableAction;
    }
);
