define('modules/selection/selectionManager',
    ['modules/selection/selectionCache',
        //'modules/diagram/flowNode',
        //'modules/diagram/flowLink',
        'modules/graph/graphConstants',
        'modules/settings/config'],
    function(SelectionCache,
             //FlowNode,
             //FlowLink,
             constants,
             config) {

        function SelectionManager(manager) {
            var self = this,
                _flowManager = manager,
                _cache = new SelectionCache(this),
                _selectionList = [];

            self.hasSelections = function() {
                return _selectionList.length > 0;
            };

            self.getSelections = function() {
                return _selectionList;
            };

            self.getSelectionsOfType = function(id) {
                var items = [];
                for (var i = 0; i < _selectionList.length; i++) {
                    if (_selectionList[i].getId() === id) {
                        items.push(_selectionList[i]);
                    }
                }
                return items;
            };

            self.clearSelections = function() {
                for (var i = 0; i < _selectionList.length; i++) {
                    _selectionList[i].setSelected(false);
                }
                _selectionList = [];
                _flowManager.getFlowDiagram().clearSelectionRectangle();
                _flowManager.getFlowDiagram().clearPasteTooltip();
                _cache.resetCaches();
            };

            self.addToSelections = function(item) {
                if (!containsSelection(item)) {
                    item.setSelected(true);
                    _selectionList.push(item);
                }
            };

            self.addMultipleToSelections = function(items) {
                for (var i = 0; i < items.length; i++) {
                    self.addToSelections(items[i]);
                }
            };

            self.removeFromSelection = function(item) {
                var i = _selectionList.indexOf(item);
                if (i > -1) {
                    item.setSelected(false);
                    _selectionList.splice(i, 1);
                }
            };

            self.removeMultipleFromSelections = function(items) {
                for (var i = 0; i < items.length; i++) {
                    self.removeFromSelection(items[i]);
                }
            };

            self.addOrToggleSelection = function(item, toggle) {
                if (!toggle) {
                    self.addToSelections(item);
                } else {
                    if (containsSelection(item)) {
                        self.removeFromSelection(item);
                    } else {
                        self.addToSelections(item);
                    }
                }
            };

            self.addOrToggleMultipleSelections = function(items, toggle) {
                if (!toggle) {
                    self.addMultipleToSelections(items);
                } else {
                    for (var i = 0; i < items.length; i++) {
                        if (containsSelection(items[i])) {
                            self.removeFromSelection(items[i]);
                        } else {
                            self.addToSelections(items[i]);
                        }
                    }
                }
            };

            self.hasAcceptedNodes = function() {
                var accepted = false;
                for (var i = 0; i < _selectionList.length; i++) {
                    if (_selectionList[i].getFlowType() === constants.flowType().CONTAINER &&
                        _selectionList[i].isExpanded()
                        ||
                        _selectionList[i].getId() === constants.elementType().NODE &&
                        _selectionList[i].getContainerReference() ) {
                        // not accepted to copy
                        return false;
                    }
                    else if (
                        _selectionList[i].getId() === constants.elementType().NODE) {
                        accepted = true;
                    }
                }
                return accepted;
            };

            self.cacheSelections = function() {
                _cache.cacheSelections(_flowManager.getModelHandler().getFlowModel());
            };

            self.restoreSelections = function() {
                self.clearSelections();
                _cache.restoreSelections(_flowManager.getModelHandler().getFlowModel());
            };

            //self.resetCache = function() {
            //    _cache.resetCaches();
            //};

            function containsSelection(item) {
                for (var i = 0; i < _selectionList.length; i++) {
                    if (_selectionList[i].getName() === item.getName()) {
                        return true;
                    }
                }
                return false;
            }

        }
        return SelectionManager;
    }
);
