define(
	['modules/graph/graphConstants',
		'modules/settings/config'],
	function(constants, config) {

		return {
			initActions: function (caller) {
				var _canvas = caller.getCanvas(),
					_canvasTh = caller.getCanvasTh(),
					_interactor = caller.getFlowManager().getMouseInteractor(),
					_dndHandler = caller.getFlowManager().getDnDHandler(),
					_manager = caller.getFlowManager();

				// mouse
				_canvas.addEventListener('mousemove', function(event) {
					_interactor.onMouseMove(event);
				}, false);
				_canvas.addEventListener('mousedown', function(event) {
					_interactor.onMousePress(event);
				}, false);
				_canvas.addEventListener('mouseup', function(event) {
					_interactor.onMouseRelease(event);
				}, false);
				_canvas.addEventListener('mouseout',  function(event) {
					_interactor.onMouseExit(event);
				}, false);
				_canvas.addEventListener('click', function(event) {
					_interactor.onMouseClick(event);
				}, false);
				_canvas.addEventListener('dblclick', function(event) {
					_interactor.onMouseDoubleClick(event);
				}, false);

				// D-N-D canvas
				_canvas.addEventListener('dragstart', function(event) {
					caller.setDraggedPaletteId(undefined);
					event.dataTransfer.setData('text', 'anything');
					_dndHandler.dragStarted(event);
				}, false);
				_canvas.addEventListener('dragenter', function(event) {
					event.preventDefault();
					_dndHandler.dragEnter(event);
				}, false);
				_canvas.addEventListener('dragover', function(event) {
					event.preventDefault();
					_dndHandler.dragOver(event, caller.getDraggedPaletteId());
				}, false);
				_canvas.addEventListener('dragleave', function(event) {
					_dndHandler.dragLeave(event);
				}, false);
				_canvas.addEventListener('dragend', function(event) {
					_dndHandler.dragEnd(event);
				}, false);
				_canvas.addEventListener('drop', function(event) {
					event.preventDefault();
					_dndHandler.drop(event);
				}, false);

				// D-N-D canvasTh
				_canvasTh.addEventListener('dragstart', function(event) {
					_dndHandler.dragThStarted(event);
				}, false);
				_canvasTh.addEventListener('dragover', function(event) {
					event.preventDefault();
					_dndHandler.dragThOver(event);
				}, false);

				// key down
				_canvas.addEventListener('keydown', function(event) {
					//console.log("KEY DOWN: "+event.key+", code: "+event.code);
					if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
						caller.setControlPressed(true);
					} else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
						caller.setShiftPressed(true);
					} else if (event.code == 'KeyZ' && caller.isControlPressed() && !caller.isShiftPressed()) {
						_manager.getUndoManager().undo();
					} else if (event.code == 'KeyY' && caller.isControlPressed() && !caller.isShiftPressed() ||
						event.code == 'KeyZ' && caller.isControlPressed() && caller.isShiftPressed()) {
						_manager.getUndoManager().redo();
					} else if (event.code == "Delete") {
						_manager.getFlowController().removeSelections();
						_manager.getSelectionManager().clearSelections();
						_manager.refreshDiagramOnEdit();
					} else if (event.code == 'KeyS' && caller.isControlPressed() && !caller.isShiftPressed()) {
						_manager.saveFlowData();
						event.preventDefault();
					} else if (event.code == 'KeyS' && caller.isControlPressed() && caller.isShiftPressed()) {
						_manager.getCaller().setFSDialogMode(constants.fsDialogMode().SAVE);
						$("#openFlowDialogId").dialog("open");
					} else if (event.code == 'KeyC' && caller.isControlPressed()) {
						_manager.copySelections();
					} else if (event.code == 'KeyV' && caller.isControlPressed()) {
						_manager.pasteSelections();
					} else if (event.code == 'Escape') {
						_manager.clearClipboard();
					}
				}, false);
				// key up
				_canvas.addEventListener('keyup', function(event) {
					//console.log("KEY UP: "+event.key+", code: "+event.code);
					if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
						caller.setControlPressed(false);
					} else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
						caller.setShiftPressed(false);
					}
				}, false);

				// edit content key down
				$("#editContentId").keydown(function(event) {
					//console.log("KEY DOWN: "+event.key);
					if (event.key === "Control") {
						caller.setEditControlPressed(true);
					}
				});
				// edit content key up
				$("#editContentId").keyup(function(event) {
					//console.log("KEY UP: "+event.key);
					if (event.key === "Control") {
						caller.setEditControlPressed(false);
					}
				});
			}
		}
	}
);
