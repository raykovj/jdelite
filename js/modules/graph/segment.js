define('modules/graph/segment',
	['modules/geometry/point'
		//'modules/graph/xPoint',
		//'modules/graph/pipeCrossing',
		//'modules/graph/corridor',
		//'modules/graph/pipe',
		//'modules/graph/graphEdge'
	],
	function(Point
	         //XPoint,
			 //PipeCrossing,
	         //Corridor,
	         //Pipe,
	         //GraphEdge
		) {
		function Segment(edge, pipe, corridor, type, startPoint, endPoint) {

			var self = this;

			self.edge = edge;
			self.getEdge = function() { return self.edge; };

			self.pipe = pipe;
			self.setPipe = function(pipe) { self.pipe = pipe; };
			self.getPipe = function() { return self.pipe; };

			self.corridor = corridor;
			self.getCorridor = function() { return self.corridor; };

			self.type = type; // constants.segmentType()
			self.getType = function() { return self.type; };

			self.startPoint = startPoint;
			//self.startPoint = new Point(Math.floor(startPoint.x), Math.floor(startPoint.y));
			self.getStartPoint = function() { return self.startPoint; };
			self.setStartPoint = function(x, y) { self.startPoint.moveToXY(x, y); };
			self.adjustStartPoint = function(dx, dy) { self.startPoint.translate(dx, dy); };

			self.endPoint = endPoint;
			//self.endPoint = new Point(Math.floor(endPoint.x), Math.floor(endPoint.y));
			self.getEndPoint = function() { return self.endPoint; };
			self.setEndPoint = function(x, y) { self.endPoint.moveToXY(x, y); };
			self.adjustEndPoint = function(dx, dy) { self.endPoint.translate(dx, dy); };

			self.getMinX = function() { return Math.min(self.startPoint.x, self.endPoint.x); };
			self.getMinY = function() { return Math.min(self.startPoint.y, self.endPoint.y); };
			self.getMaxX = function() { return Math.max(self.startPoint.x, self.endPoint.x); };
			self.getMaxY = function() { return Math.max(self.startPoint.y, self.endPoint.y); };

			var _isShortCut;
			self.setShortCut = function(b) { _isShortCut = b; };
			self.isShortCut = function() { return _isShortCut; };

			function registerToPipe() {
				if (self.pipe) {
					self.pipe.registerSegment(self);
				}
			}

			var _pipeShift;
			self.setPipeShift = function(shift) { _pipeShift = shift; };
			self.getPipeShift = function() { return _pipeShift; };

			var _swappable = true;
			//self.setSwappable = function(b) { _swappable = b; };
			self.isSwappable = function() {
				//return _swappable;
				return !self.getEdge().isStartSegment(self) && !self.getEdge().isEndSegment(self);
			};

			self.channelIdx = -1;
			self.setChannelIndex = function(n) {
				self.channelIdx = n;
				//if (self.edge.getName() === "[P4/OUT-0]-[P3/IN-0]" || self.edge.getName() === "[P1/OUT-0]-[P5/IN-0]") {
				//	console.log("********* setChannelIndex: "+self.print());
				//}
			};
			self.getChannelIndex = function() { return self.channelIdx; };

			self.getLength = function() {
				if (self.startPoint.x === self.endPoint.x) {
					return Math.abs(self.startPoint.y - self.endPoint.y);
				} else if (self.startPoint.y === self.endPoint.y) {
					return Math.abs(self.startPoint.x - self.endPoint.x);
				} else {
					return 0;
				}
			};

			self.getMidPoint = function() {
				var dx = self.endPoint.x - self.startPoint.x;
				var dy = self.endPoint.y - self.startPoint.y;
				return new Point(self.startPoint.x + Math.floor(dx/2), self.startPoint.y + Math.floor(dy/2));
			};

			self.getOrder = function() {
				return self.getEdge().getSegmentOrder(self);
			};

			self.getThickness = function() { return self.edge.getThickness(); };

			self.getPrevious = function() { return self.edge.getPreviousSegment(self); };
			self.getNext = function() { return self.edge.getNextSegment(self); };

			self.getPreviousFromList = function(list) { return self.edge.getPreviousSegmentFromList(self, list); };
			self.getNextFromList = function(list) { return self.edge.getNextSegmentFromList(self, list); };

			self.isSiblingWith = function(another) {
				var previous = self.edge.getPreviousSegment(self);
				if (previous && previous.equals(another)) {
					return true;
				}
				var next = self.edge.getNextSegment(self);
				if (next && next.equals(another)) {
					return true;
				}
				return false;
			};

			self.drawGraphics = function(context) {
				context.beginPath();
				context.moveTo(self.startPoint.x, self.startPoint.y);
				context.lineTo(self.endPoint.x, self.endPoint.y);
				context.stroke();
			};

			self.equals = function(another) {
				if (!another) {
					return false;
				}
				return another instanceof Segment &&
					self.edge.equals(another.getEdge()) &&
					self.startPoint.equals(another.getStartPoint()) &&
					self.endPoint.equals(another.getEndPoint());
			};

			self.print = function() {
				return "start: " + self.startPoint.showXY() + ", end: " + self.endPoint.showXY()+
					", edge: "+self.edge.getName()+
					", channel idx: "+self.channelIdx;
					//", SF: "+self.edge.getSourceShift()+
					//", TF: "+self.edge.getTargetShift();

				//", order: " + self.getOrder(); //+", channel order: "+self.getChannelIndex();
			};
			self.print0 = function() {
				//return self.edge.getName()+": " + self.startPoint.showXY() + " <> " + self.endPoint.showXY()
				return "" + self.startPoint.showXY() + " <> " + self.endPoint.showXY()
			};
			self.print1 = function() {
				return "start: " + self.startPoint.showXY() + ", end: " + self.endPoint.showXY()+
					", type: "+self.type+
					", pipe: "+(self.pipe ? self.pipe.getOrder() : "undef")+
					", corridor: "+(self.corridor ? self.corridor.getOrder() : "undef")+
					", order: "+self.getOrder()+
					", edge: "+self.edge.getName();
			};
			self.print2 = function() {
				return self.edge.getName()+", sgm order: " + self.getOrder()+", chn order: "+self.getChannelIndex();
			};

			registerToPipe();
		}
		return Segment;
	}
);