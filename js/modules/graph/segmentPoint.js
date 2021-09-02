define('modules/graph/segmentPoint',
	['modules/geometry/point',
		'modules/graph/graphConstants',
		'modules/graph/segment'],
	function(Point,
	         constants,
	         Segment) {
		function SegmentPoint(segment, pointDef) {
			var self = this;
			self.segment = segment;
			self.point = pointDef === constants.segmentPointDef.START ? segment.getStartPoint() : segment.getEndPoint();

			self.getSegment = function() { return self.segment; };
			self.getPoint = function() { return self.point; };
		}
		return SegmentPoint;
	}
);