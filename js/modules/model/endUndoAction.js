define('modules/model/endUndoAction',
	['modules/graph/graphConstants',
		'modules/settings/config'],
	function(constants,
	         config) {

		function EndUndoAction(model) {
			var self = this;
			self.floModel = model;

			self.execute = function() {
				//console.log("EndUndoAction execute");
			};

			self.undo = function() {
				//console.log("EndUndoAction undo");
			};

			self.redo = function() {
				//console.log("EndUndoAction redo");
			};

		}
		return EndUndoAction;
	}
);
