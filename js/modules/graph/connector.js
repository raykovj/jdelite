define('modules/graph/connector',
	['modules/geometry/point',
		'modules/graph/graphConstants',
		'modules/core/jsUtils'],
	function(Point, constants, jsUtils) {

		function Connector(point, name, node, side, direction) {
			Point.call(this, point.x, point.y);

			Connector.ORDER_UNDEF = -1;

			var self = this;
			self.name = name;
			self.node = node;
			self.side = side; // graphConstants.nodeSide
			self.direction = direction; // graphConstants.portDirection
			self.order = Connector.ORDER_UNDEF;
			self.offsetStep = 0;
			self.fixed = false;

			//self.globalX = function() { return self.x + node.x; };
			//self.globalY = function() { return self.y + node.y; };
			self.globalX = function() { return self.x + node.getX(); };
			self.globalY = function() { return self.y + node.getY(); };
			self.globalLocation = function() { return new Point(self.globalX(), self.globalY()); };

			self.getName = function() { return self.name; };
			self.getNode = function() { return self.node; };

			self.getSide = function() { return self.side; };
			self.setSide = function(side) { self.side = side; };

			self.getDirection = function() { return self.direction; };

			self.setFixed = function(b) { self.fixed = b; };
			self.isFixed = function() { return self.fixed; };

			self.setOrder = function(order) { self.order = order; };
			self.getOrder = function() { return self.order; };

			self.setOffsetStep = function(step) { self.offsetStep = step; };
			self.getOffsetStep = function() { return self.offsetStep; };

			self.equals = function(other) {
				if (self === other) { return true; }
				if (other instanceof Connector) {
					return self.node.getHashName() === other.node.getHashName() &&
							self.name === other.name &&
							//self.globalX() === other.globalX() &&
							//self.globalY() === other.globalY() &&
							self.side === other.side &&
							self.direction === other.direction;
				}
				return false;
			};

			self.path = function() { return "["+self.node.name+"/"+self.name+"]"; };
			self.showGlobalXY = function() {
				return "X=" + self.globalX() + ", Y=" + self.globalY();
			};

			self.print = function() {
				return self.constructor.name + ": local: "+self.showXY()+", global: "+self.showGlobalXY()+", name="+self.name+
					", side="+self.side+", direction="+self.direction+", path="+self.path();
			};

			function init() {
				self.order = Connector.ORDER_UNDEF;
			}

			self.initConnector = function() {
				init();
			}

		}
		jsUtils.inherit(Connector, Point);
		return Connector;
	}
);