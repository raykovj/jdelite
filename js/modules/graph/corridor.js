define('modules/graph/corridor',
		['modules/geometry/rectangle',
			'modules/core/jsUtils',
			'modules/graph/graphConstants',
			'modules/graph/nodeCell',
			'modules/layout/layoutUtils'],
	function(Rectangle,
	         jsUtils,
	         constants,
	         NodeCell,
	         layoutUtl) {

		function Corridor(order) {
			Rectangle.call(this, 0, 0, 0, 0);

			Corridor.TYPE = { UNDEF: 0, LEVEL: 1, LANE: 2 };

			Corridor.MIN_COR_WIDTH    = constants.corridorMinSize().WIDTH;
			Corridor.MIN_COR_HEIGHT   = constants.corridorMinSize().HEIGHT;

			var self = this;
			//var layoutUtl = new LayoutUtils();

			self.order = order;
			self.setOrder = function(n) { self.order = n; };
			self.getOrder = function() { return self.order; };

			self.cells = []; // NodeCell's
			self.getCells = function() { return self.cells; };

			self.containsNodes = function() {
				//return self.cells.length > 0;
				return self.getVisibleNodes().length > 0;
			};

			self.extendedSegments = [];

			self.getType = function() {
				return Corridor.TYPE.UNDEF;
			};

			self.getExtent = function() {
				// TODO: in subclasses
				return 0;
			};

			self.getNodes = function() {
				var nodes = [];
				for (var i = 0; i < self.cells.length; i++) {
					if (self.cells[i] instanceof NodeCell && self.cells[i].getNode()) {
						nodes.push(self.cells[i].getNode());
					}
				}
				return nodes;
			};

			self.getVisibleNodes = function() {
				var nodes = [];
				for (var i = 0; i < self.cells.length; i++) {
					if (self.cells[i] instanceof NodeCell &&
						self.cells[i].getNode() &&
						(self.cells[i].getNode().isVisible())) { //} || self.cells[i].getNode().getFlowType() === constants.flowType().CONTAINER)) {
							nodes.push(self.cells[i].getNode());
					}
				}
				return nodes;
			};

			self.containsCell = function(cell) {
				for (var i = 0; i < self.cells.length; i++) {
					if (self.cells[i].equals(cell)) {
						return true;
					}
				}
				return false;
			};


			self.containsSegment = function(segment) {
				for (var i = 0; i < self.extendedSegments.length; i++) {
					if (self.extendedSegments[i].equals(segment)) {
						return true;
					}
				}
				return false;
			};

			self.addExtendedSegment = function(sgm) {
				if (!self.containsSegment(sgm)) {
					self.extendedSegments.push(sgm);
				}
			};

			self.clearSegments = function() { self.extendedSegments = []; };

			self.hasSegmentsViolations = function() {
				var hasViolations = false;
				for (var i = 0; i < self.extendedSegments.length-1; i++) {
					var si = self.extendedSegments[i];
					for (var k = i+1; k < self.extendedSegments.length; k++) {
						var sk = self.extendedSegments[k];
						if (layoutUtl.areSegmentsInClearanceViolation(si, sk, Math.floor(constants.segmentsGap.MIN/2))) {
							si.getEdge().setOptimizationBlocked(true);
							hasViolations = true;
						}
					}
				}
				return hasViolations;
			};

			self.print = function() {
				return self.constructor.name + ": "+self.showBounds()+", order="+self.order+", type="+self.getType();
			};
			self.printShort = function() {
				return "" +
					self.constructor.name + ": order="+self.order+", nodes: "+self.getNodes().length+", "+self.showBounds();
			};

		}
		jsUtils.inherit(Corridor, Rectangle);
		return Corridor;
	}
);