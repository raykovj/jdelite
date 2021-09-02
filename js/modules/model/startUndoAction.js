define('modules/model/startUndoAction',
	['modules/graph/graphConstants',
		'modules/settings/config'],
	function(constants,
	         config) {

		function StartUndoAction(model, name) {
			var self = this;
			self.floModel = model;
			self.name = name;

			self.getName = function() { return name; };

			self.execute = function() {
				//console.log("StartUndoAction execute: "+name);
			};

			self.undo = function() {
				//console.log("StartUndoAction undo: "+name);
			};

			self.redo = function() {
				//console.log("StartUndoAction redo: "+name);
			};

		}
		return StartUndoAction;
	}
);
