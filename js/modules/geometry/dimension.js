define('modules/geometry/dimension',
	function() {
		function Dimension(w,h) {
			var self = this;
			self.width = w;
			self.height = h;

			self.isNull = function() {
				return self.width === 0 && self.height === 0;
			};

			self.print = function() {
				return self.constructor.name + ": w=" + self.width + ", h=" + self.height;
			};

			self.equals = function(another) {
				if (another && another instanceof Dimension) {
					return self.width === another.width && self.height === another.height;
				}
				return false;
			};
		}
		return Dimension;
	}
);