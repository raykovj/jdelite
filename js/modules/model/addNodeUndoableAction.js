define('modules/model/addNodeUndoableAction',
	['modules/common/map'],
	function(Map) {

		function AddNodeUndoableAction(model, nodeObject, cell) {
			var self = this,
				_modelHandler = model,
				_nodeObj = nodeObject,
				_cell = cell,
				_levelNumber = cell.getLevelNumber(),
				_laneNumber = cell.getLaneNumber(),
				_shiftsMap = new Map(),
				_crossingsMap = new Map();

			self.getName = function() { return "["+_nodeObj.name+"]"; };

			self.execute = function() {
				_modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
				_modelHandler.addNodeToModel(_nodeObj);
			};

			self.undo = function() {
				_modelHandler.restoreSegmentEditsToLinks(_shiftsMap, _crossingsMap);
				_modelHandler.removeNodeFromModel(_nodeObj);
			};

			self.redo = function() {
				_modelHandler.clearSegmentEditsToLinks(_shiftsMap.keys(), _crossingsMap.keys());
				_modelHandler.addNodeToModel(_nodeObj);
			};

			function getShifts() {
				if (_cell) {
					var links = _modelHandler.getLinksCrossingCell(_cell);
					for (var i = 0; i < links.length; i++) {
						if (links[i].hasSegmentShifts()) {
							_shiftsMap.put(links[i].getName(), links[i].getSegmentShifts());
						}
					}
				}
			}
			function getCrossings() {
				var links = _modelHandler.getFlowLinks();
				for (var i = 0; i < links.length; i++) {
					if (links[i].hasForcedCrossings()) {
						_crossingsMap.put(links[i].getName(), links[i].getForcedCrossings());
					}
				}
			}
			getShifts();
			getCrossings();
		}
		return AddNodeUndoableAction;
	}
);
