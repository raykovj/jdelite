define('modules/geometry/rectangle',
	['modules/geometry/point',
	 'modules/geometry/dimension',
	 'modules/geometry/geomUtils',
		'modules/settings/config',
		'modules/core/jsUtils'],
	function(
		Point,
		Dimension,
		geomUtl,
		config,
		jsUtils) {

		function Rectangle(x,y,w,h) {
			Dimension.call(this, w,h);
			var self = this;
			self.x = x;
			self.y = y;

			var _orientation; // constants.orientation
			self.setOrientation = function(value) { _orientation = value; };
			self.getOrientation = function() { return _orientation; };

			self.showBounds = function() {
				return "x="+self.x+", y="+self.y+", w="+self.width+", h="+self.height;
			};

			self.isEmpty = function() {
				return self.width <= 0 || self.height <= 0;
			};

			self.getLocation = function() {
				return new Point(self.x, self.y);
			};

			self.getOppositeLocation = function() {
				return new Point(self.x+self.width, self.y+self.height);
			};

			self.getRectBounds = function() {
				return new Rectangle(self.x, self.y, self.width, self.height);
			};

			self.clone = function() {
				return new Rectangle(self.x, self.y, self.width, self.height);
			};

			self.multiplyBy = function(factor) {
				return new Rectangle(self.x*factor, self.y*factor, self.width*factor, self.height*factor);
			};

			self.divideBy = function(factor) {
				return new Rectangle(self.x/factor, self.y/factor, self.width/factor, self.height/factor);
			};

			self.setRectLocation = function(x, y) {
				self.x = x;
				self.y = y;
			};

			self.translate = function(dx, dy) {
				self.x += dx;
				self.y += dy;
			};

			self.setWidth = function(w) {
				self.width = w;
			};

			self.setHeight = function(h) {
				self.height = h;
			};

			self.setRectSize = function(w, h) {
				self.width = w;
				self.height = h;
			};

			self.setRectBounds = function(x, y, w, h) {
				self.x = x;
				self.y = y;
				self.width = w;
				self.height = h;
			};

			self.hasPointInside = function (point) {
				if (!point) {
					return false;
				}
				return self.containsXY(point.x, point.y);
			};

			self.containsXY = function(x, y) {
				var factor = config.getScale(), retVal;
				retVal =
					self.x * factor < x &&
					(self.x + self.width) * factor > x &&
					self.y * factor < y &&
					(self.y + self.height) * factor > y;
				return retVal;
			};

			self.isLineIntersecting = function(lp1, lp2) {
				var factor = config.getScale();
				var p1 = new Point(self.x, self.y),
					p2 = new Point(self.x + self.width, self.y),
					p3 = new Point(self.x, self.y + self.height),
					p4 = new Point(self.x + self.width, self.y + self.height);
				return 	geomUtl.areIntersecting(lp1, lp2, p1, p2) ||
						geomUtl.areIntersecting(lp1, lp2, p1, p3) ||
						geomUtl.areIntersecting(lp1, lp2, p2, p4) ||
						geomUtl.areIntersecting(lp1, lp2, p3, p4);
			};

			/**
			 *
			 * @param r - another Rectangle
			 * @returns {boolean} true: overflow or intersect
			 */
			self.intersects = function(r) {
				if (!r) {
					return false;
				}
				var tw = self.width;
				var th = self.height;
				//if (tw <= 0 || th <= 0) {
				//	return false;
				//}
				var rw = r.width;
				var rh = r.height;
				//if (rw <= 0 || rh <= 0) {
				//	return false;
				//}
				var tx = self.x;
				var ty = self.y;

				var rx = r.x;
				var ry = r.y;

				tw += tx;
				th += ty;
				rw += rx;
				rh += ry;

				return ((rw < rx || rw > tx) &&
						(rh < ry || rh > ty) &&
						(tw < tx || tw > rx) &&
						(th < ty || th > ry));
			};

			/**
			 * the resulting rectangle may have width or height or both zero
			 * @param r -  another Rectangle
			 * returns - the intersecting rectangle
			 */
			self.intersection = function(r) {
				if (!r) {
					return undefined;
				}
				var tx1 = self.x;
				var ty1 = self.y;
				var tx2 = tx1 + self.width;
				var ty2 = ty1 + self.height;

				var rx1 = r.x;
				var ry1 = r.y;
				var rx2 = rx1 + r.width;
				var ry2 = ry1 + r.height;

				if (tx1 < rx1) { tx1 = rx1; } //left
				if (ty1 < ry1) { ty1 = ry1; } //top
				if (tx2 > rx2) { tx2 = rx2; }
				if (ty2 > ry2) { ty2 = ry2; }

				tx2 -= tx1;
				tx2 = Math.max(tx2, 0);
				ty2 -= ty1;
				ty2 = Math.max(ty2, 0);
				return new Rectangle(tx1, ty1, tx2, ty2);
			};

			/**
			 *
			 * @param r - another Rectangle
			 * returns the wrapper Rectangle
			 */
			self.union = function(r) {
				if (!r) {
					return undefined;
				}
				var tw = self.width;
				var th = self.height;
				var rw = r.width;
				var rh = r.height;
				if ((rw || rh) < 0) {
					return new Rectangle(self.x, self.y, self.width, self.height);
				}
				var tx = self.x;
				var ty = self.y;
				tw += tx;
				th += ty;
				var rx = r.x;
				var ry = r.y;
				rw += rx;
				rh += ry;
				if (tx > rx) tx = rx;
				if (ty > ry) ty = ry;
				if (tw < rw) tw = rw;
				if (th < rh) th = rh;
				tw -= tx;
				th -= ty;
				return new Rectangle(tx, ty, tw, th);
			};

			self.equals = function(another) {
				if (another && another instanceof Rectangle) {
					return self.x === another.x &&
						self.y === another.y &&
						self.width === another.width &&
						self.height === another.height;
				}
				return false;
			};

			self.print = function() {
				return self.constructor.name + ": "+self.showBounds();
			};

		}
		jsUtils.inherit(Rectangle, Dimension);
		return Rectangle;
	}
);