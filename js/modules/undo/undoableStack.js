define('modules/undo/undoableStack',
	['modules/graph/graphConstants',
		'modules/settings/config'],
	function(constants,
	         config) {

		function UndoableStack(name) {
			var self = this;

			self.name = name;
			self.getName = function() { return name; };
			self.getUndoName = function() { return "Undo "+name; };
			self.getRedoName = function() { return "Redo "+name; };

			var _actions = [],
				done = true;

			self.addAction = function(action) {
				_actions.push(action);
			};

			self.undo = function() {
				done = false;
				for (var i = _actions.length-1; i >= 0; i--) {
					_actions[i].undo();
				}
			};

			self.redo = function() {
				done = true;
				for (var i = 0; i < _actions.length-1; i++) {
					_actions[i].redo();
				}
			};

			self.clear = function() { _actions = []; };

		}
		return UndoableStack;
	}
);
