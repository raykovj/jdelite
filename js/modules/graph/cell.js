define('modules/graph/cell',
		['modules/geometry/rectangle',
		'modules/core/jsUtils'],
	function(Rectangle, jsUtils) {

		function Cell(levelNum, laneNum) {
			Rectangle.call(this, 0, 0, 0, 0);

			Cell.TYPE = { UNDEF: 0, GRID: 1, NODE: 2 };

			var self = this;

			self.levelNum = levelNum;
			//self.setLevelNumber = function(n) { self.levelNum = n; };
			self.getLevelNumber = function() { return self.levelNum; };

			self.laneNum = laneNum;
			//self.setLaneNumber = function(n) { self.laneNum = n; };
			self.getLaneNumber = function() { return self.laneNum; };

			self.cellType = function() {
				return Cell.TYPE.UNDEF;
			};

			self.equals = function(another) {
				return another && self.levelNum === another.levelNum && self.laneNum === another.laneNum;
			};

			self.print = function() {
				return self.constructor.name + ": "+self.showBounds()+", level="+self.levelNum+", lane="+self.laneNum;
			};

		}
		jsUtils.inherit(Cell, Rectangle);
		return Cell;
	}
);