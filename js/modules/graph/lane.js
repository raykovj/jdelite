define('modules/graph/lane',
	['modules/graph/corridor',
		'modules/core/jsUtils',
		'modules/graph/graphConstants',
		'modules/graph/nodeCell',
		'modules/graph/gridCell',
		'modules/graph/graphNode',
		'modules/graph/modelUtils',
		'modules/settings/config'],
	function(Corridor,
	         jsUtils,
	         constants,
	         NodeCell,
	         GridCell,
	         GraphNode,
	         modelUtils,
	         config) {

		function Lane(order) {
			Corridor.call(this, order);

			var self = this;

			self.getType = function() {
				return Corridor.TYPE.LANE;
			};


			self.leftLane = false;
			self.rightLane = false;

			self.setLeftLane = function(b) {
				if (b && self.order === 0) {
					self.leftLane = true;
					self.rightLane = false;
				} else if (!b) {
					self.leftLane = false;
				}
			};
			self.isLeftLane = function() { return self.leftLane; };

			self.setRightLane = function(b) {
				if (b && self.order > 0) {
					self.rightLane = true;
					self.leftLane = false;
				} else if (!b) {
					self.rightLane = false;
				}
			};
			self.isRightLane = function() { return self.rightLane; };



			self.addCell = function(cell) {
				if (!self.containsCell(cell)) {
					self.cells.push(cell);
				}
				cell.getNode().setLaneNumber(self.order);
			};

			self.removeCell = function(cell) {
				if (self.containsCell(cell)) {
					cell.getNode().setLaneNumber(GraphNode.LANE_UNDEF);
					var k = self.cells.indexOf(cell);
					if (k >= 0 && k < self.cells.length) {
						self.cells.splice(k, 1);
					}
				}
			};

			self.getCellAtLevel = function(levelNum) {
				for (var i = 0; i < self.cells.length; i++) {
					if (self.cells[i].getLevelNumber() === levelNum) {
						return self.cells[i];
					}
				}
				return null;
			};

			self.getNodeAtLevel = function(levelNum) {
				var cell = self.getCellAtLevel(levelNum);
				if (cell) {
					return cell.getNode();
				}
				return null;
			};

			self.getCellsInRange = function(startLevelNum, endLevelNum) {
				var range = [];
				for (var i = startLevelNum; i <= endLevelNum; i++) {
					var cell = self.getCellAtLevel(i);
					if (cell) {
						range.push(cell);
					} else {
						range.push(new GridCell(i, self.getOrder()));
					}
				}
				return range;
			};

			self.getEmptyCellsInRange = function(flowLayout, startLevelNum, endLevelNum) {
				var range = [];
				for (var i = startLevelNum; i <= endLevelNum; i++) {
					var cell = self.getCellAtLevel(i);
					if (cell) {
						if (!cell.getNode().isVisible()) {
							range.push(cell);
						}
					} else {
						//range.push(new GridCell(i, self.getOrder()));
						var gridCell = new GridCell(i, self.getOrder()),
							level = flowLayout.getLevels()[i],
							rect = self.intersection(level);
						gridCell.setRectBounds(rect.x, rect.y, rect.width, rect.height);
						range.push(gridCell);
					}
				}
				return range;
			};

			self.hasLevelRangeEmpty = function(startLevelNum, endLevelNum) {
				for (var i = 0; i < self.cells.length; i++) {
					var cellNode = self.cells[i].getNode();
					if (cellNode.isVisible() ||
						cellNode.getFlowType() === constants.flowType().CONTAINER && cellNode.isExpanded() ||
						cellNode.getContainerReference() && cellNode.getContainerReference().isExpanded()) {
						var cellLevel = self.cells[i].getLevelNumber();
						if (cellLevel >= startLevelNum && cellLevel <= endLevelNum) {
							return false;
						}
					}
				}
				return true;
			};

			self.hasContainerIntersection = function(flowManager) {
				var nodes = flowManager.getModelHandler().getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&& nodes[i].isExpanded()) {
						if (self.getOrder() >= nodes[i].getStartLaneNumber() && self.getOrder() <= nodes[i].getEndLaneNumber()) {
							return true;
						}
					}
				}
				return false;
			};

			self.hasContainerIntersectionInRange = function(flowManager, minLevelIdx, maxLevelIdx) {
				var nodes = flowManager.getModelHandler().getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&& nodes[i].isExpanded()) {
						if (self.getOrder() >= nodes[i].getStartLaneNumber() && self.getOrder() <= nodes[i].getEndLaneNumber() &&
							minLevelIdx && minLevelIdx >= nodes[i].getStartLevelNumber() &&
							maxLevelIdx && maxLevelIdx <= nodes[i].getEndLevelNumber()
						) {
							return true;
						}
					}
				}
				return false;
			};

			self.adjustSize = function() {
				var i = 0;
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					var maxWidth = Math.max(modelUtils.getMaxNodeWidth(self.getVisibleNodes()), Corridor.MIN_COR_WIDTH);
					for (i = 0; i < self.cells.length; i++) {
						self.cells[i].adjustWidth(maxWidth);
					}
					var maxCellWidth = Math.max(modelUtils.getMaxCellWidth(self.cells), Corridor.MIN_COR_WIDTH);
					self.setRectSize(maxCellWidth, self.height);
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					var maxHeight = Math.max(modelUtils.getMaxNodeHeight(self.getVisibleNodes()), Corridor.MIN_COR_HEIGHT);
					for (i = 0; i < self.cells.length; i++) {
						self.cells[i].adjustHeight(maxHeight);
					}
					var maxCellHeight = Math.max(modelUtils.getMaxCellHeight(self.cells), Corridor.MIN_COR_HEIGHT);
					self.setRectSize(self.width, maxCellHeight);
				}
			};

			self.adjustGlobalSize = function(length) {
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					self.setRectSize(self.width, length);
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					self.setRectSize(length, self.height);
				}
			};


			self.getExtent = function() {
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					return self.width;
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					return self.height;
				} else {
					return 0;
				}
			};


			self.print = function() {
				return self.constructor.name + ": "+self.showBounds()+", order="+self.order+", type="+self.getType();
			};

		}
		jsUtils.inherit(Lane, Corridor);
		return Lane;
	}
);