define('modules/graph/level',
	['modules/graph/corridor',
		'modules/graph/graphConstants',
		'modules/graph/nodeCell',
		'modules/graph/gridCell',
		'modules/graph/graphNode',
		'modules/graph/modelUtils',
		'modules/settings/config',
		'modules/core/jsUtils'],
	function(Corridor,
	         constants,
	         NodeCell,
	         GridCell,
	         GraphNode,
	         modelUtils,
	         config,
	         jsUtils) {

		function Level(order) {
			Corridor.call(this, order);

			var self = this;

			self.getType = function() {
				return Corridor.TYPE.LEVEL;
			};

			self.startLevel = false;
			self.endLevel = false;

			self.setStartLevel = function(b) {
				if (b && self.order === 0) {
					self.startLevel = true;
					self.endLevel = false;
				} else if (!b) {
					self.startLevel = false;
				}
			};
			self.isStartLevel = function() { return self.startLevel; };

			self.setEndLevel = function(b) {
				if (b && self.order > 0) {
					self.endLevel = true;
					self.startLevel = false;
				} else if (!b) {
					self.endLevel = false;
				}
			};
			self.isEndLevel = function() { return self.endLevel; };

			self.addCell = function(cell) {
				if (!self.containsCell(cell)) {
					self.cells.push(cell);
				}
				cell.getNode().setLevelNumber(self.order);
			};

			self.removeCell = function(cell) {
				if (self.containsCell(cell)) {
					cell.getNode().setLevelNumber(GraphNode.LEVEL_UNDEF);
					var k = self.cells.indexOf(cell);
					if (k >= 0 && k < self.cells.length) {
						self.cells.splice(k, 1);
					}
				}
			};

			self.getCellAtLane = function(laneNum) {
				for (var i = 0; i < self.cells.length; i++) {
					if (self.cells[i].getLaneNumber() === laneNum) {
						return self.cells[i];
					}
				}
				return null;
			};

			self.getNodeAtLane = function(laneNum) {
				var cell = self.getCellAtLane(laneNum);
				if (cell) {
					return cell.getNode();
				}
				return null;
			};

			self.getLeftLaneNode = function() {
				for (var i = 0; i < self.cells.length; i++) {
					if (self.cells[i].getNode().isLeftLaneNode()) {
						return self.cells[i].getNode();
					}
				}
				return null;
			};

			self.hasLeftLaneNode = function() {
				return self.getLeftLaneNode() ? true : false;
			};

			self.getRightLaneNode = function() {
				for (var i = 0; i < self.cells.length; i++) {
					if (self.cells[i].getNode().isRightLaneNode()) {
						return self.cells[i].getNode();
					}
				}
				return null;
			};

			self.hasRightLaneNode = function() {
				return self.getRightLaneNode() ? true : false;
			};

			self.getCellsInRange = function(startLaneNum, endLaneNum) {
				var range = [];
				for (var i = startLaneNum; i <= endLaneNum; i++) {
					var cell = self.getCellAtLane(i);
					if (cell) {
						range.push(cell);
					} else {
						range.push(new GridCell(self.getOrder(), i));
					}
				}
				return range;
			};

			self.getEmptyCellsInRange = function(flowLayout, startLaneNum, endLaneNum) {
				var range = [];
				for (var i = startLaneNum; i <= endLaneNum; i++) {
					var cell = self.getCellAtLane(i);
					if (cell) {
						if (!cell.getNode().isVisible()) {
							range.push(cell);
						}
					} else {
						var gridCell = new GridCell(self.getOrder(), i),
							lane = flowLayout.getLanes()[i],
							rect = self.intersection(lane);
						gridCell.setRectBounds(rect.x, rect.y, rect.width, rect.height);
						range.push(gridCell);
					}
				}
				return range;
			};

			self.hasLaneRangeEmpty = function(startLaneNum, endLaneNum) {
				for (var i = 0; i < self.cells.length; i++) {
					var cellNode = self.cells[i].getNode();
					if (cellNode.isVisible() ||
						cellNode.getFlowType() === constants.flowType().CONTAINER && cellNode.isExpanded() ||
						cellNode.getContainerReference() && cellNode.getContainerReference().isExpanded()) {
						var cellLane = self.cells[i].getLaneNumber();
						if (cellLane >= startLaneNum && cellLane <= endLaneNum) {
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
						if (self.getOrder() >= nodes[i].getStartLevelNumber() && self.getOrder() <= nodes[i].getEndLevelNumber()) {
							return true;
						}
					}
				}
				return false;
			};

			self.hasContainerIntersectionInRange = function(flowManager, minLaneIdx, maxLaneIdx) {
				var nodes = flowManager.getModelHandler().getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&& nodes[i].isExpanded()) {
						if (self.getOrder() >= nodes[i].getStartLevelNumber() && self.getOrder() <= nodes[i].getEndLevelNumber() &&
							minLaneIdx && minLaneIdx >= nodes[i].getStartLaneNumber() &&
							maxLaneIdx && maxLaneIdx <= nodes[i].getEndLaneNumber()
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
					var maxHeight = Math.max(modelUtils.getMaxNodeHeight(self.getVisibleNodes()), Corridor.MIN_COR_HEIGHT);
					for (i = 0; i < self.cells.length; i++) {
						self.cells[i].adjustHeight(maxHeight);
					}
					var maxCellHeight = Math.max(modelUtils.getMaxCellHeight(self.cells), Corridor.MIN_COR_HEIGHT);
					self.setRectSize(self.width, maxCellHeight);
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					var maxWidth = Math.max(modelUtils.getMaxNodeWidth(self.getVisibleNodes()), Corridor.MIN_COR_WIDTH);
					for (i = 0; i < self.cells.length; i++) {
						self.cells[i].adjustWidth(maxWidth);
					}
					var maxCellWidth = Math.max(modelUtils.getMaxCellWidth(self.cells), Corridor.MIN_COR_WIDTH);
					self.setRectSize(maxCellWidth, self.height);
				}
			};

			self.adjustGlobalSize = function(length) {
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					self.setRectSize(length, self.height);
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					self.setRectSize(self.width, length);
				}
			};

			self.getExtent = function() {
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					return self.height;
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					return self.width;
				} else {
					return 0;
				}
			};


			self.print = function() {
				return self.constructor.name + ": "+self.showBounds()+", order="+self.order+", type="+self.getType();
			};

		}
		jsUtils.inherit(Level, Corridor);
		return Level;
	}
);