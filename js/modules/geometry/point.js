define('modules/geometry/point',
	function() {
		function Point(x,y) {
			var self = this;
			self.x = x;
			self.y = y;

			self.print = function() {
				return self.constructor.name + ": x=" + self.x + ", y=" + self.y;
			};
			self.showXY = function() {
				return "x=" + self.x + ", y=" + self.y;
			};
			self.toString = function() { return "point: "+self.showXY(); };

			self.moveToXY = function(x, y) {
				self.x = x;
				self.y = y;
			};

			self.moveToPoint = function(point) {
				self.x = point.x;
				self.y = point.y;
			};

			self.translate = function(dx, dy) {
				self.x += dx;
				self.y += dy;
			};

			self.multiplyBy = function(factor) {
				return new Point(self.x * factor, self.y * factor);
			};

			self.divideBy = function(factor) {
				return new Point(self.x / factor, self.y / factor);
			};

			self.clone = function() {
				return new Point(self.x, self.y);
			};

			self.equals = function(another) {
				if (!another) {
					return false;
				}
				return self.x === another.x && self.y === another.y;
			};
		}
		return Point;
	}
);