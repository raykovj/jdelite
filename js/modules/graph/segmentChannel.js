define('modules/graph/segmentChannel',
	['modules/graph/segment'],
	function(Segment) {
		function SegmentChannel() {

			var self = this;

			self.segments = [];
			self.getSegments = function() { return self.segments; };

			self.order = 0;
			self.setOrder = function(n) {
				self.order = n;
				for (var i = 0; i < self.segments.length; i++) {
					self.segments[i].setChannelIndex(n);
				}
			};
			self.getOrder = function() { return self.order; };

			self.offset = 0;
			self.setOffset = function(n) { self.offset = n; };
			self.getOffset = function() { return self.offset; };

			self.contains = function(sgm) {
				for (var i = 0; i < self.segments.length; i++) {
					if (self.segments[i].equals(sgm)) {
						return true;
					}
				}
				return false;
			};

			self.addSegment = function(sgm) {
				if (!self.contains(sgm)) {
					self.segments.push(sgm);
					sgm.setChannelIndex(self.order);
				}
			};

			self.addSegments = function(moreSegments) {
				self.segments = self.segments.concat(moreSegments);
			};

			self.clear = function() { self.segments = []; };

			self.removeSegment = function(sgm) {
				var k = self.segments.indexOf(sgm);
				if (k >= 0 && k < self.segments.length) {
					self.segments.splice(k, 1);
				}
			};

			self.getTotalLength = function() {
				var tl = 0;
				for (var i = 0; i < self.segments.length; i++) {
					tl += self.segments[i].getLength();
				}
				return tl;
			};

			self.print = function() {
				var info = self.constructor.name + ": order="+self.order;
				for (var i = 0; i < self.segments.length; i++) {
					info += "\n\t\t"+self.segments[i].print();
				}
				return info;
			};

		}
		return SegmentChannel;
	}
);