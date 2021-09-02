define('modules/graph/xPoint',
		['modules/geometry/point',
		'modules/graph/corridor',
		'modules/graph/pipe',
		'modules/graph/graphConstants',
		'modules/core/jsUtils'],
	function(Point,
	         Corridor,
	         Pipe,
			 constants,
	         jsUtils) {

		function XPoint(point, firstPipe, secondPipe, levelPipe, lanePipe) {
			Point.call(this, point.x, point.y);

			var self = this,
				_firstPipe = firstPipe,
				_secondPipe = secondPipe;

			if (!secondPipe) {
				_secondPipe = firstPipe.getType() === constants.pipeType().LEVEL_PIPE ? lanePipe : levelPipe;
			}

			self.getFirstPipe = function() { return _firstPipe; };
			self.getSecondPipe = function() { return _secondPipe; };

			self.getLevelPipe = function() {
				return firstPipe.getType() === constants.pipeType().LEVEL_PIPE ? _firstPipe : _secondPipe;
			};
			self.getLanePipe = function() {
				return firstPipe.getType() === constants.pipeType().LANE_PIPE ? _firstPipe : _secondPipe;
			};

		}
		jsUtils.inherit(XPoint, Point);
		return XPoint;
	}
);