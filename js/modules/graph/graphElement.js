define('modules/graph/graphElement',
		['modules/geometry/rectangle',
			'modules/graph/graphConstants',
			'modules/core/jsUtils'],
	function(Rectangle,
			 constants,
			 jsUtils) {

		function GraphElement(rect) {
			Rectangle.call(this, rect.x, rect.y, rect.width, rect.height);

			var self = this;
			self.id = constants.elementType().UNDEF;
			self.name = '';
			self.tooltip = '';
			self.visible = true;
			self.suppressed = false;
			self.selected = false;
			self.highlighted = false;
			self.backgroundColor = 0;
			self.foregroundColor = 0;
			self.children = [];

			var _hashCode;

			self.setName = function(name) {
				self.name = name;
				_hashCode = jsUtils.hashCode(name);
			};
			self.getName = function() { return self.name; };
			self.getHashName = function() { return _hashCode; };

			self.setId = function(id) { self.id = id; };
			self.getId = function() { return self.id; };

			self.setTooltip = function(tooltip) { self.tooltip = tooltip; };
			self.getTooltip = function() { return self.tooltip; };

			self.setVisible = function(value) {
				self.visible = value;
				for (var i = 0; i < self.children.length; i++) {
					if (self.children[i] instanceof GraphElement) {
						self.children[i].setVisible(value);
					}
				}
			};
			self.isVisible = function() { return self.visible && !self.suppressed; };

			self.setSuppressed = function(value) {
				self.suppressed = value;
				for (var i = 0; i < self.children.length; i++) {
					if (self.children[i] instanceof GraphElement) {
						self.children[i].setSuppressed(value);
					}
				}
			};
			self.isSuppressed = function() { return self.suppressed; };

			self.setSelected = function(value) {
				self.selected = value;
				for (var i = 0; i < self.children.length; i++) {
					if (self.children[i] instanceof GraphElement) {
						self.children[i].setSelected(value);
					}
				}
			};
			self.isSelected = function() { return self.selected; };

			self.setHighlighted = function(value) {
				self.highlighted = value;
				for (var i = 0; i < self.children.length; i++) {
					if (self.children[i] instanceof GraphElement) {
						self.children[i].setHighlighted(value);
					}
				}
			};
			self.isHighlighted = function() { return self.highlighted; };

			self.setBackground = function(value) { self.backgroundColor = value; };
			self.getBackground = function() { return self.backgroundColor; };

			self.setForeground = function(value) { self.foregroundColor = value; };
			self.getForeground = function() { return self.foregroundColor; };

			self.contains = function(child) {
				for (var i = 0; i < self.children.length; i++) {
					if (self.children[i] === child) { return true; }
				}
				return false;
			};

			self.addChild = function(child) {
				if (!self.contains(child)) { self.children.push(child); }
			};

			self.drawGraphics = function(context) {
				// implementation specific
				for (var i = 0; i < self.children.length; i++) {
					self.children[i].drawGraphics(context);
				}
			};

			self.print = function() {
				return self.constructor.name + ": "+self.showBounds();
			};

		}
		jsUtils.inherit(GraphElement, Rectangle);
		return GraphElement;
	}
);