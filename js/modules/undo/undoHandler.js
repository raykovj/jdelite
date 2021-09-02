define('modules/undo/undoHandler',
	['modules/undo/undoableStack',
		'modules/model/startUndoAction',
		'modules/model/endUndoAction'],
	function(UndoableStack,
	         StartUndoAction,
	         EndUndoAction) {

		function UndoHandler(modelHandler, undoManager) {
			var self = this;

			var _modelHandler = modelHandler,
				_undoManager = undoManager,
				_stack;

			function begin(name) {
				_stack = new UndoableStack(name);
				var startAction = new StartUndoAction(_modelHandler, name);
				_stack.addAction(startAction);
				startAction.execute();
			}

			function end() {
				var endAction = new EndUndoAction(_modelHandler);
				_stack.addAction(endAction);
				endAction.execute();
				_undoManager.addStack(_stack);
			}

			// post
			self.createUndoStack = function(name, actions) {
				begin(name);
				for (var i = 0; i < actions.length; i++) {
					_stack.addAction(actions[i]);
					actions[i].execute();
				}
				end();
			};

		}
		return UndoHandler;
	}
);
