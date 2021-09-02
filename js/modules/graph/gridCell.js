define('modules/graph/gridCell',
		['modules/graph/cell',
		'modules/core/jsUtils'],
	function(Cell, jsUtils) {

		function GridCell(levelNum, laneNum) {
			Cell.call(this, levelNum, laneNum);
			var self = this;

			self.cellType = function() {
				return Cell.TYPE.GRID;
			};

			self.print = function() {
				return self.constructor.name + ": "+self.showBounds()+", level="+self.levelNum+", lane="+self.laneNum;
			};

			self.getLevelNumber = function() { return self.levelNum; };
			self.getLaneNumber = function() { return self.laneNum; };
		}
		jsUtils.inherit(GridCell, Cell);
		return GridCell;
	}
);