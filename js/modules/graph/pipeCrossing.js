define('modules/graph/pipeCrossing',
	['modules/geometry/rectangle',
		'modules/geometry/point',
		'modules/graph/edgeCorner',
		'modules/graph/graphConstants',
		'modules/settings/config',
		'modules/core/jsUtils'
	],
	function(Rectangle,
			 Point,
			 Corner,
	         constants,
	         config,
	         jsUtils) {

		function PipeCrossing(levelPipeOrder, lanePipeOrder, flowLayout) {
			Rectangle.call(this, 0, 0, 0, 0);

			var self = this;
			var _levelPipeIdx = levelPipeOrder,
				_lanePipeIdx = lanePipeOrder,
				_flowLayout = flowLayout,
				_edgeCorner;
			self.levelPipeIndex = levelPipeOrder;
			self.lanePipeIndex = lanePipeOrder;

			self.getFlowLayout = function() { return _flowLayout; };

			self.updateLocation = function(flowLayout) {
				//_flowLayout = flowLayout;
				self.initCrossing(flowLayout);
			};
			self.getLevelPipe = function(flowLayout) {
				//self.initCrossing(flowLayout);
				var levelPipes = flowLayout.getLevelPipes();
				return _levelPipeIdx <= levelPipes.length-1 ? levelPipes[_levelPipeIdx] : levelPipes[levelPipes.length-1];
			};
			self.getLanePipe = function(flowLayout) {
				//self.initCrossing(flowLayout);
				var lanePipes = flowLayout.getLanePipes();
				return _lanePipeIdx <= lanePipes.length-1 ? lanePipes[_lanePipeIdx] : lanePipes[lanePipes.length-1];
			};

			self.getLevelPipeOrder = function() { return _levelPipeIdx; };
			self.getLanePipeOrder = function() { return _lanePipeIdx; };

			self.initCrossing = function(flowLayout) {
				//_flowLayout = flowLayout;
				if (flowLayout) { //} && !_ready) {
					//_ready = true;
					var levelPipe = self.getLevelPipe(flowLayout),
						lanePipe = self.getLanePipe(flowLayout);
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						self.setRectBounds(levelPipe.x, lanePipe.y, levelPipe.width, lanePipe.height);
					} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
						self.setRectBounds(lanePipe.x, levelPipe.y, lanePipe.width, levelPipe.height);
					}
				}
			};

			self.getCenterPoint = function() {
				//if (_flowLayout) {
				//	var levelPipe = self.getLevelPipe(_flowLayout),
				//		lanePipe = self.getLanePipe(_flowLayout);
				//	if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
				//		self.setRectBounds(levelPipe.x, lanePipe.y, levelPipe.width, lanePipe.height);
				//	} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
				//		self.setRectBounds(lanePipe.x, levelPipe.y, lanePipe.width, levelPipe.height);
				//	}
                //
				//}
				return new Point(self.x+Math.floor(self.width/2), self.y+Math.floor(self.height/2));
			};

			// the original corner at drag start
			self.setXCorner = function(edgeCorner) { _edgeCorner = edgeCorner; };
			self.getXCorner = function() { return _edgeCorner; };

			self.equals = function(another) {
				return another &&
					another.getLevelPipeOrder() === _levelPipeIdx &&
					another.getLanePipeOrder() === _lanePipeIdx;
			};

			self.printPipeXing = function() {
				var pVal = "PipeXing: ";
				pVal += "LEVEL PIPE: ["+_levelPipeIdx+"]";
				pVal += ", ";
				pVal += "LANE PIPE: ["+_lanePipeIdx+"]";
				//pVal += ", RECT: x="+self.x+", y="+self.y+", w="+self.width+", h="+self.height;
				return pVal;
			};

			self.initCrossing(flowLayout);
		}
		jsUtils.inherit(PipeCrossing, Rectangle);
		return PipeCrossing;
	}
);