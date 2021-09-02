define('modules/graph/nodeCell',
		['modules/geometry/rectangle',
			'modules/graph/cell',
			'modules/settings/config',
			'modules/graph/graphConstants',
			'modules/core/jsUtils'],
	function(Rectangle,
	         Cell,
			 config,
	         constants,
	         jsUtils) {

		function NodeCell(node) {
			Cell.call(this, node.getLevelNumber(), node.getLaneNumber());
			var self = this;

			var _offsets = node.getCellContainerOffsets(),
				_widthGap,
				_heightGap;

			//_widthGap = node.getContainerReference() ? constants.cellGap().CTR_WIDTH : constants.cellGap().WIDTH;
			//_heightGap = node.getContainerReference() ? constants.cellGap().CTR_HEIGHT : constants.cellGap().HEIGH;

			function initCell() {
				self.node.setCell(self);
				if (node.getName() === "T1") {
					//console.log("==   T1 NodeCell: initCell "+_offsets);
				}
				if (node.getContainerReference()) {
					_widthGap = 2*constants.cellGap().CTR_WIDTH;
					_heightGap = 2*constants.cellGap().CTR_HEIGHT;
				} else {
					_widthGap = 2*constants.cellGap().WIDTH;
					_heightGap = 2*constants.cellGap().HEIGHT;
				}
				//_widthGap += _offsets.left + _offsets.right;
				//_heightGap += _offsets.front + _offsets.back;
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					_widthGap += Math.floor((_offsets.left + _offsets.right)/2);
					_heightGap += Math.floor((_offsets.front + _offsets.back)/2);
				} else {
					_widthGap += Math.floor((_offsets.front + _offsets.back)/2);
					_heightGap += Math.floor((_offsets.left + _offsets.right)/2);
				}

				//if (self.node.getName() === "P9") {
				//	var fd = config.getFlowDirection() === constants.flow().VERTICAL ? "V" : "H";
				//	console.log("$$ cell node: P9 "+fd+", offsets: "+JSON.stringify(_offsets)+
				//		", widthGap="+_widthGap+", heightGap="+_heightGap);
				//}
			}
			self.cellType = function() {
				return Cell.TYPE.NODE;
			};

			self.node = node;
			self.getNode = function() { return self.node; };

			self.getLevelNumber = function() { return self.node.getLevelNumber(); };
			self.getLaneNumber = function() { return self.node.getLaneNumber(); };

			//self.widthGap = node.getContainerReference() ?
			//	constants.cellGap().CTR_WIDTH : constants.cellGap().WIDTH;
			//self.heightGap = node.getContainerReference() ?
			//	constants.cellGap().CTR_HEIGHT : constants.cellGap().HEIGHT;

			//self.adjustCellSize = function(newWidth, newHeight) {
			//	self.setRectSize(newWidth + _widthGap, newHeight + _heightGap);
			//	adjustNodeLocation();
			//};

			self.adjustWidth = function(newWidth) {
				if (node.getName() === "T1") {
					//console.log("**   T1 NodeCell: adjustWidth newWidth="+newWidth);
				}
				if (self.node.isVisible() || self.node.getFlowType() === constants.flowType().CONTAINER) {
					self.setRectSize(newWidth + _widthGap, self.height);
					//adjustNodeLocation();
				} else {
					self.setRectSize(newWidth, self.height);
				}
				//console.log("** adjust width");
				adjustNodeLocation();
			};

			self.adjustHeight = function(newHeight) {
				if (self.node.isVisible() || self.node.getFlowType() === constants.flowType().CONTAINER) {
					self.setRectSize(self.width, newHeight + _heightGap);
					//adjustNodeLocation();
				} else {
					self.setRectSize(self.width, newHeight);
				}
				//console.log("** adjust height");
				adjustNodeLocation();
			};

			self.setCellLocation = function(x, y) {
				self.setRectLocation(x, y);
				adjustNodeLocation();
			};

			self.adjustCellLocation = function(x, y) {
				self.setRectLocation(x, y);
				adjustNodeLocation();
			};

			function adjustNodeLocation() {
				//if (self.node.getName() === 'P10') {
				//	console.log("** P10: width="+self.width+", "+self.node.width+", "+self.node.getNodeWidth()+
				//		", height="+self.height+", "+self.node.height+", "+self.node.getNodeHeight());
				//}
				//if (self.node.getName() === "SW1") {
				//	var fd = config.getFlowDirection() === constants.flow().VERTICAL ? "V" : "H";
				//	console.log("$$ cell node: SW1 "+fd+", offsets: "+JSON.stringify(_offsets)+
				//		", width = "+self.width+", "+self.node.width+", "+self.node.getNodeWidth()+
				//		", height = "+self.height+", "+self.node.height+", "+self.node.getNodeHeight()+
				//		", widthGap="+_widthGap+", heightGap="+_heightGap);
				//}
				//if (self.node.getName() === "B1") {
				//	var fd = config.getFlowDirection() === constants.flow().VERTICAL ? "V" : "H";
				//	console.log("$$ cell node: B1 "+fd+", offsets: "+JSON.stringify(_offsets)+
				//		", width="+self.width+", "+self.node.width+", "+self.node.getNodeWidth()+
				//		", widthGap="+_widthGap+", heightGap="+_heightGap);
				//}
				//if (node.getName() === "T1") {
				//	console.log("** 1 T1 NodeCell: "+node.getNodeWidth()+", "+node.getNodeHeight());
				//}
				var dx, dy;
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					//dx = Math.floor((self.width - self.node.width)/2) + _offsets.right;
					//dy = Math.floor((self.height - self.node.height)/2) + _offsets.back;

					dx = Math.floor((self.width - self.node.width)/2);
					dy = Math.floor((self.height - self.node.height)/2); // + _offsets.back;
					if (self.node.getFlowType() === constants.flowType().ENDPOINT) {
						dy += _offsets.back;
					}
				} else {
					//dx = Math.floor((self.width - self.node.width)/2) + _offsets.back;
					//dy = Math.floor((self.height - self.node.height)/2) + _offsets.left;

					dx = Math.floor((self.width - self.node.width)/2); // + _offsets.back;
					if (self.node.getFlowType() === constants.flowType().ENDPOINT) {
						dx += _offsets.back;
					}
					dy = Math.floor((self.height - self.node.height)/2);
				}
				self.node.setLocation(self.x + dx, self.y + dy);
				//if (node.getName() === "T1") {
				//	console.log("** 2 T1 NodeCell: x="+self.x+", dx="+dx+", y="+self.y+", dy="+dy);
				//}
			}

			self.equals = function(another) {
				if (another != null && another instanceof NodeCell) {
					return self.node.equals(another.node);
				} else {
					return false;
				}
			};

			self.print = function() {
				return self.constructor.name + ": "+self.showBounds()+", level="+self.levelNum+", lane="+self.laneNum;
			};

			self.printNodeCell = function() {
				return "$$ cell node: "+self.node.getName()+", offsets: "+JSON.stringify(_offsets)+
					", widthGap="+_widthGap+", heightGap="+_heightGap;
			};

			initCell();
		}
		jsUtils.inherit(NodeCell, Cell);
		return NodeCell;
	}
);