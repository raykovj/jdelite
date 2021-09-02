define('modules/settings/style',
	['modules/graph/graphConstants'],
	function(constants) {
		function Style(side) {
			var self = this;
			self.side = side;

			self.print = function() {
				return self.constructor.name +
					": front=" + self.hasFront() +
					", back=" + self.hasBack() +
					", left=" + self.hasLeft() +
					", right=" + self.hasRight();
			};

			self.setFront = function(b) {
				if (b) { self.side |= constants.nodeSide().FRONT; }
				else { self.side &= ~constants.nodeSide().FRONT}
			};
			self.setBack = function(b) {
				if (b) { self.side |= constants.nodeSide().BACK; }
				else { self.side &= ~constants.nodeSide().BACK}
			};
			self.setLeft = function(b) {
				if (b) { self.side |= constants.nodeSide().LEFT; }
				else { self.side &= ~constants.nodeSide().LEFT}
			};
			self.setRight = function(b) {
				if (b) { self.side |= constants.nodeSide().RIGHT; }
				else { self.side &= ~constants.nodeSide().RIGHT}
			};

			self.hasFront = function() { return (self.side & constants.nodeSide().FRONT) != 0; };
			self.hasBack  = function() { return (self.side & constants.nodeSide().BACK) != 0; };
			self.hasLeft  = function() { return (self.side & constants.nodeSide().LEFT) != 0; };
			self.hasRight = function() { return (self.side & constants.nodeSide().RIGHT) != 0; };
		}
		return Style;
	}
);