define('modules/model/changeCanvasSettingsUndoableAction',
    ['modules/graph/graphConstants',
        'modules/settings/config'],
    function(constants, config) {

        function ChangeCanvasSettingsUndoableAction(model, isLevels, levelsValue, isLanes, lanesValue) {
            var self = this,
                _modelHandler = model,
                _isLevels = isLevels,
                _levelsValue = levelsValue,
                _isLanes = isLanes,
                _lanesValue = lanesValue;

            self.getName = function() { return "[change canvas settings]"; };

            self.execute = function() {
                if (_isLevels) {
                    setStartEndLevels(_levelsValue);
                    _modelHandler.changeStartEndLevels(_levelsValue);
                }
                if (_isLanes) {
                    setSideSwimLanes(_lanesValue);
                    _modelHandler.changeSideSwimLanes(_lanesValue);
                }
            };

            self.undo = function() {
                if (_isLevels) {
                    setStartEndLevels(getInverseChangeValue(_levelsValue));
                    _modelHandler.changeStartEndLevels(getInverseChangeValue(_levelsValue));
                }
                if (_isLanes) {
                    setSideSwimLanes(getInverseChangeValue(_lanesValue));
                    _modelHandler.changeSideSwimLanes(getInverseChangeValue(_lanesValue));
                }
            };

            self.redo = function() {
                if (_isLevels) {
                    setStartEndLevels(_levelsValue);
                    _modelHandler.changeStartEndLevels(_levelsValue);
                }
                if (_isLanes) {
                    setSideSwimLanes(_lanesValue);
                    _modelHandler.changeSideSwimLanes(_lanesValue);
                }
            };

            function setStartEndLevels(value) {
                if (value === constants.change().UP) {
                    config.setStartEndLevels(constants.bValue().TRUE);
                } else {
                    config.setStartEndLevels(constants.bValue().FALSE);
                }
            }
            function setSideSwimLanes(value) {
                if (value === constants.change().UP) {
                    config.setSideSwimLanes(constants.bValue().TRUE);
                } else {
                    config.setSideSwimLanes(constants.bValue().FALSE);
                }
            }
            function getInverseChangeValue(value) {
                if (value === constants.change().UP) {
                    return constants.change().DOWN;
                } else if (value === constants.change().DOWN) {
                    return constants.change().UP;
                } else {
                    return constants.change().NONE;
                }
            }
        }
        return ChangeCanvasSettingsUndoableAction;
    }
);