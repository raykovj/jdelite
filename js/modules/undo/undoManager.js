define('modules/undo/undoManager',
	['modules/undo/undoableStack',
		'modules/graph/graphConstants',
		'modules/settings/config',
		'modules/core/jsUtils'],
	function(UndoableStack,
	         constants,
	         config,
	         jsUtils) {

		function UndoManager(flowManager) {
			//UndoableStack.call("");
			var self = this;

			var _undoStacks = [],
				_flowManager = flowManager,
				_undoIndex = 0;


			self.addStack = function(stack) {
				cleanToIndex();
				_undoStacks.push(stack);
				_undoIndex = _undoStacks.length;
				_flowManager.setUndoName(stack.getUndoName());
				_flowManager.setRedoName(stack.getRedoName());
				_flowManager.setDirty(true);
			};

			function cleanToIndex() {
				var size = _undoStacks.length;
				if (size > 0 && _undoIndex < size) {
					var toRemove = size - _undoIndex;
					_undoStacks.splice(_undoIndex, toRemove);
				}
			}

			self.undo = function() {
				if (_undoIndex > 0) {
					var stack = _undoStacks[--_undoIndex];
					stack.undo();
					_flowManager.refreshDiagramOnEdit();
					if (_undoIndex === 0) {
						_flowManager.resetUndoProperties();
						_flowManager.setDirty(false);
					}
				}
			};

			self.redo = function() {
				if (_undoIndex < _undoStacks.length) {
					var stack = _undoStacks[_undoIndex++];
					stack.redo();
					_flowManager.setDirty(true);
					_flowManager.refreshDiagramOnEdit();
				}
			};

			self.canUndo = function() {
				return _undoIndex > 0;
			};

			self.canRedo = function() {
				return _undoIndex < _undoStacks.length;
			};

			self.isUndoBufferEmpty = function() {
				return _undoStacks.length === 0;
			};

			self.clearAll = function() {
				for (var i = 0; i < _undoStacks.length; i++) {
					_undoStacks[i].clear();
				}
				_undoStacks = [];
				_undoIndex = 0;
				_flowManager.setUndoName("");
				_flowManager.setRedoName("");
			};


		}
		//jsUtils.inherit(UndoManager, UndoableStack);
		return UndoManager;
	}
);
