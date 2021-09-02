define('modules/diagram/flowDiagram',
	['modules/graph/graphNode',
		'modules/diagram/flowNode',
		'modules/diagram/flowLink',
		'modules/layout/flowLayout',
		'modules/graph/graphElement',
		'modules/geometry/rectangle',
		'modules/geometry/point',
		'modules/geometry/dimension',
		'modules/diagram/diagramUtils',
		'modules/graph/graphConstants',
		'modules/draw/draw',
		'modules/settings/config',
		'modules/core/jsUtils'],
	function(GraphNode,
	         FlowNode,
	         FlowLink,
	         FlowLayout,
			 GraphElement,
	         Rectangle,
			 Point,
			 Dimension,
	         diagramUtils,
	         constants,
			 draw,
	         config,
			 jsUtils) {
		function FlowDiagram(flowManager) {
			GraphElement.call(this, new Rectangle(0,0,0,0));

			var self = this,
				DEBUG = false,
				_flowManager = flowManager,
				_flowLayout = flowManager.getFlowLayout(),
				_modelHandler = _flowManager.getModelHandler(),
				_ctrElem = document.getElementById('containerId'),
				_topCtrElem = document.getElementById('topContainerId'),
				_canvas = flowManager.getCanvas(),
				_canvasElem = document.getElementById('canvasId'),
				_canvasContainer = _flowManager.getCaller().getCanvasContainer(),
				_canvasTh = flowManager.getCanvasTh(),
				_context = flowManager.getCanvasContext(),
				_contextTh = flowManager.getCanvasThContext(),
				_canvasThContainer = document.getElementById("thumbnailViewId"),
				_mouseLocation,
				_selectionRect,
				_pasteLocation,
				_showPasteMessage,
				_linkLabelTooltip;

			self.getFlowLayout = function() { return _flowLayout; };

			self.setMousePoint = function(point) { _mouseLocation = point; };
			self.getMousePoint = function() { return _mouseLocation; };

			self.adjustGraphics = function(size) {
				self.setRectSize(size.width, size.height);
			};

			self.performLayout = function() {
				//document.body.style.cursor = 'wait';
				//$("#body").addClass("waiting");
				//$("#canvasId").addClass("waiting");
				//document.getElementById("topContainerId").style.cursor = "wait";
				//$('*').css('cursor','wait');
				//config.setLayoutOn(true);

				_flowLayout.doLayout();
				self.adjustGraphics(_flowLayout.getLayoutSize());

				//document.body.style.cursor = 'auto';
				//$("#body").removeClass("waiting");
				//$("#canvasId").removeClass("waiting");
				//document.getElementById("topContainerId").style.cursor = "default";
				//$('*').css('cursor','auto');
				//config.setLayoutOn(false);

			};

			// get visible nodes
			self.getFlowNodes = function() {
				return _modelHandler.getFlowNodes();
			};

			// get visible links
			self.getFlowLinks = function() {
				return _modelHandler.getFlowLinks();
			};

			self.clear = function() {
				//
			};

			self.clearCanvas = function() {
				var factor = config.getScale();
				_context.clearRect(0, 0, _canvas.width, _canvas.height);
				_contextTh.clearRect(0, 0, _canvasTh.width, _canvasTh.height);
			};

			//self.clearCanvasTh = function() {
			//	_contextTh.clearRect(0, 0, _canvasTh.width, _canvasTh.height);
			//};

			self.clearMarkups = function() {
				var nodes = _flowManager.getModelHandler().getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					nodes[i].showMarkupPorts(false);
					nodes[i].hideRefPorts();
				}
			};

			self.showSelectionRectangle = function(rect) { _selectionRect = rect; };
			self.clearSelectionRectangle = function() { _selectionRect = undefined; };

			self.showPasteTooltip = function(point) { _pasteLocation = point; };
			self.clearPasteTooltip = function() { _pasteLocation = undefined; };

			self.showPasteMessage = function(b) { _showPasteMessage = b; };

			self.showLinkLabelTooltip = function(linkInfo) { _linkLabelTooltip = linkInfo; };

			self.paintDiagram = function(ctx) {
				var factor = config.getScale(),
					allowEdit = config.isEditMode(),
					cvsViewArea = getCanvasViewArea(),
					r1 = new Rectangle(0, 0, _canvas.width, _canvas.height);
				ctx.clearRect(0, 0, _canvas.width, _canvas.height);
				paintSpecialAreas(ctx, cvsViewArea);
				if (allowEdit) {
					_flowManager.getDnDHandler().drawAcceptingLocations(ctx);
				}
				if (config.hasShowGrid()) {
					//drawGrid(ctx);
					drawGridTitles(ctx);
				}
				drawBorder(ctx);

				var edges = _flowManager.getModelHandler().getFlowLinks();
				for (i = 0; i < edges.length; i++) {
					if (edges[i].getEdgeRectBounds().intersects(cvsViewArea)) {
						edges[i].drawGraphics(ctx);
					}
				}

				var nodes = _flowManager.getModelHandler().getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					if ((nodes[i].getFlowType() === constants.flowType().CONTAINER ||
						nodes[i].getFlowType() === constants.flowType().SWITCH)
						&&
						nodes[i].isExpanded() &&
						nodes[i].getExpandedShape().intersects(cvsViewArea)
						||
						nodes[i].intersects(cvsViewArea))
					{
						nodes[i].drawGraphics(ctx);
					}
				}

				// selection
				if (_selectionRect) {
					ctx.setLineDash([2,2]);
					draw.paintRectangle(ctx, _selectionRect, constants.colors().DRAG_FILL, constants.colors().NODE_SEL, 1, 0.45);
				}
				ctx.setLineDash([0,0]);
				if (allowEdit && _showPasteMessage && _selectionRect) {
					var msgPnt = new Point(_selectionRect.x-4, _selectionRect.y+4);
					draw.drawTooltip(ctx, _canvas.getBoundingClientRect(), msgPnt,
						["Mouse click to select paste location, or", "Press Escape to cancel"]);
				}
				if (allowEdit && _pasteLocation) {
					var pnt = _pasteLocation.clone();
					pnt.translate(-4*factor, 12*factor);
					pnt = pnt.divideBy(factor);
					draw.drawTooltip(ctx, _canvas.getBoundingClientRect(), pnt,
						["Paste HERE !", "<<<", "Escape to cancel"]);
				}
				if (_linkLabelTooltip) {
					var linkPoint = _linkLabelTooltip.point.clone();
					linkPoint = linkPoint.divideBy(factor);
					draw.drawTooltip(ctx, _canvas.getBoundingClientRect(), linkPoint, _linkLabelTooltip.linkInfo);
				}
				//draw.paintRectangle(ctx, r1, null, "green", 2);
			};

			function getCanvasViewArea() {
				var factor = config.getScale(),
					//cvs = _canvas.getBoundingClientRect(),
					//_ctrElem = document.getElementById('containerId'),
				//cvsThCtr = document.getElementById('thumbnailViewId'),
				//cvsTh = _canvasTh.getBoundingClientRect(),
				//cvsThRect = new Rectangle(0, 0, _canvasTh.width, _canvasTh.height),

					ctrElemHBarVisible = _ctrElem.scrollWidth > _ctrElem.offsetWidth,
					ctrElemVBarVisible = _ctrElem.scrollHeight > _ctrElem.offsetHeight,

					cvsCtrElemHBar = !ctrElemHBarVisible ? _ctrElem.offsetHeight - _ctrElem.clientHeight : 0,
					cvsCtrElemVBar = !ctrElemVBarVisible ? _ctrElem.offsetWidth - _ctrElem.clientWidth : 0,

					cvsRect = new Rectangle(
						-_canvas.offsetLeft - cvsCtrElemHBar +4,
						-_canvas.offsetTop - cvsCtrElemVBar +4,
						_canvas.offsetWidth + _canvas.offsetLeft -6,
						_canvas.offsetHeight + _canvas.offsetTop -8),

					cvsCtrRect = new Rectangle(
						_ctrElem.scrollLeft,
						_ctrElem.scrollTop,
						_ctrElem.clientWidth,
						_ctrElem.clientHeight),

					cvsXArea = cvsCtrRect.intersection(cvsRect),
					cvsViewArea = new Rectangle(
						cvsXArea.x/factor,
						cvsXArea.y/factor,
						cvsXArea.width/factor,
						cvsXArea.height/factor);

				return cvsViewArea;
			}

			//////
			self.paintDiagramTh = function(ctxTh) {
				var factor = config.getScale(),
					cvs = _canvas.getBoundingClientRect(),
					cvsViewArea = getCanvasViewArea(),
					ctrElemHBarVisible = _ctrElem.scrollWidth > _ctrElem.offsetWidth,
					ctrElemVBarVisible = _ctrElem.scrollHeight > _ctrElem.offsetHeight,
					cvsCtrElemHBar = !ctrElemHBarVisible ? _ctrElem.offsetHeight - _ctrElem.clientHeight : 0,
					cvsCtrElemVBar = !ctrElemVBarVisible ? _ctrElem.offsetWidth - _ctrElem.clientWidth : 0,
					cvsRect = new Rectangle(
						-_canvas.offsetLeft - cvsCtrElemHBar +4,
						-_canvas.offsetTop - cvsCtrElemVBar +4,
						_canvas.offsetWidth + _canvas.offsetLeft -6,
						_canvas.offsetHeight + _canvas.offsetTop -8),
					rthCtr = _canvasThContainer.getBoundingClientRect(),
					rth = new Rectangle(rthCtr.x, rthCtr.y, rthCtr.width, rthCtr.height-40),
					cvsMax = Math.max(cvs.width, cvs.height),
					rthMax = Math.max(rth.width, rth.height), //assuming width and height are equal
					ratio = rthMax*factor/cvsMax;

				//draw.paintRectangle(_context, cvsViewArea, null, "red", 1, 0.0);

				ctxTh.clearRect(0, 0, _canvasTh.width, _canvasTh.height);
				_canvasTh.width = _canvas.width * ratio / factor;
				_canvasTh.height = _canvas.height * ratio / factor;

				ctxTh.save();
				ctxTh.setTransform(ratio, 0, 0, ratio, 0, 0);

				draw.paintRectangle(_contextTh, cvsRect, constants.colors().GRID, null, 1, .5);
				//draw.paintRectangle(_contextTh, cvsRect, "blue", "lightgray", 1, .5);
				//_contextTh.globalCompositeOperation = "source-over";
				//draw.paintRectangle(_contextTh, cvsViewArea, constants.colors().GRID, "blue", 4, .3);
				draw.paintRectangle(_contextTh, cvsViewArea, "white", "blue", 2, 1.);

				var nodes = _flowManager.getModelHandler().getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					nodes[i].drawGraphics(ctxTh);
				}

				var edges = _flowManager.getModelHandler().getFlowLinks();
				for (i = 0; i < edges.length; i++) {
					edges[i].drawGraphics(ctxTh);
				}

				//drawBorderTh(ctxTh);
				ctxTh.restore();

			};

			// obsolete !!!
			function getWindowViewArea() {
				var factor = config.getScale(),

					//ctrElemHBarVisible = _ctrElem.scrollWidth > _ctrElem.offsetWidth,
					//ctrElemVBarVisible = _ctrElem.scrollHeight > _ctrElem.offsetHeight,

					//cvsCtrElemHBar = !ctrElemHBarVisible ? _ctrElem.offsetHeight - _ctrElem.clientHeight : 0,
					//cvsCtrElemVBar = !ctrElemVBarVisible ? _ctrElem.offsetWidth - _ctrElem.clientWidth : 0,

					//cvsRect = new Rectangle(
					//	-_canvas.offsetLeft - cvsCtrElemHBar +4,
					//	-_canvas.offsetTop - cvsCtrElemVBar +4,
					//	_canvas.offsetWidth + _canvas.offsetLeft -6,
					//	_canvas.offsetHeight + _canvas.offsetTop -8),

					windowRect = new Rectangle(
						window.pageXOffset || document.documentElement.scrollLeft,
						window.pageYOffset || document.documentElement.scrollTop,
						document.documentElement.clientWidth,
						document.documentElement.clientHeight
					),


					windowRectA = new Rectangle(
						window.scrollX,
						window.scrollY,
						document.documentElement.clientWidth,
						document.documentElement.clientHeight
					),

					topCtrRect = new Rectangle(
						_topCtrElem.scrollLeft,
						_topCtrElem.scrollTop,
						_topCtrElem.clientWidth,
						_topCtrElem.clientHeight
					),

					ctrRect = new Rectangle(
						_ctrElem.scrollLeft,
						_ctrElem.scrollTop,
						_ctrElem.clientWidth,
						_ctrElem.clientHeight
					),

					canvasRect = new Rectangle(
						_canvasElem.scrollLeft,
						_canvasElem.scrollTop,
						_canvasElem.clientWidth,
						_canvasElem.clientHeight
					),

					cvsXArea = ctrRect.intersection(windowRectA),
					cvsViewArea = new Rectangle(
						cvsXArea.x/factor,
						cvsXArea.y/factor,
						cvsXArea.width/factor,
						cvsXArea.height/factor);
				//console.log("*** window:  "+windowRect.showBounds()+", ctr: "+ctrRect.showBounds());
				//console.log("*** windowA: "+windowRectA.showBounds());
				return cvsViewArea;
			}

			///////
			self.showTooltip = function(point) {
				if (!config.isEditMode()) {
					return;
				}
				var tooltip, nameTooltip, i;
				var nodes = _flowManager.getModelHandler().getFlowNodes();
				for (i = 0; i < nodes.length; i++) {
					if (nodes[i].isVisible() || nodes[i].getFlowType() === constants.flowType().CONTAINER) {
						tooltip = nodes[i].getTooltip();
						nameTooltip = nodes[i].getNameTooltip();
						if (tooltip || nameTooltip && !config.hasShowTooltip()) {
							break;
						}
					}
				}
				if (!tooltip) {
					var edges = _flowManager.getModelHandler().getFlowLinks();
					for (i = 0; i < edges.length; i++) {
						if (edges[i].isVisible()) {
							tooltip = edges[i].getTooltip();
							//nameTooltip = edges[i].getTooltip();
							if (tooltip) {
								break;
							}
						}
					}
				}
				if (tooltip) {
					if (config.hasShowTooltip()) {
						// uncomment to show
						drawTooltipText(point, tooltip);
					}
					_flowManager.getCaller().showTooltipBox(!config.hasShowTooltip());
					_flowManager.getCaller().setTooltipBox(tooltip, point);
				} else if (nameTooltip) {
					drawTooltipText(point, nameTooltip);
					//_flowManager.getCaller().tooltipProperty("");
				} else {
					_flowManager.getCaller().setTooltipBox("");
				}
			};

			function drawTooltipText(point, tooltip) {
				if (config.isEditMode()) {
					draw.drawTooltip(_context, _canvas.getBoundingClientRect(), point, tooltip);
				}

				//var ctx = _canvas.getContext('2d'),
				//	rect = _canvas.getBoundingClientRect(); // rect is DOMRect object
				//var x = point.x, y = point.y;
				//var hd = 2, vd = 2; // padding
				//var width = Math.floor(ctx.measureText(tooltip).width);
				//var dd = Math.floor(rect.width) - (x+width+2*hd);
				//if (dd < 0) {
				//	x += dd;
				//}
				////console.log("CLICK: x="+x+", y="+y+", l="+rect.left+", r="+rect.right+", w="+rect.width+", h="+rect.height);
				//ctx.font = '12px arial';
				//var height = 12+2*vd;
				//ctx.fillStyle = '#fff';
				//ctx.fillRect(x, y-height, width+2*hd, height);
				//ctx.fillStyle = '#000';
				//ctx.strokeRect(x, y-height, width+2*hd, height);
				//ctx.fillText(tooltip, x + hd, y-2*vd, width);
			}

			function paintSpecialAreas(ctx, cvsViewArea) {
				if (config.hasSideSwimLanes()) {
					paintRect(ctx, _flowLayout.getLeftSwimLane(), constants.colors().SIDE_LANES_COLOR);
					paintRect(ctx, _flowLayout.getRightSwimLane(), constants.colors().SIDE_LANES_COLOR);
				}
				if (config.hasStartEndLevels()) {
					paintRect(ctx, _flowLayout.getStartLevel(), constants.colors().START_END_COLOR);
					paintRect(ctx, _flowLayout.getEndLevel(), constants.colors().START_END_COLOR);
				}
			}

			function paintBackground(ctx) {
				var i;
				var levelPipes = _flowLayout.getLevelPipes();
				for (i = 0; i < levelPipes.length; i++) {
					paintRect(ctx, levelPipes[i], 'pink');
				}
				var lanePipes = _flowLayout.getLanePipes();
				for (i = 0; i < lanePipes.length; i++) {
					paintRect(ctx, lanePipes[i], 'pink');
				}
				var levels = _flowLayout.getLevels();
				for (i = 0; i < levels.length; i++) {
					paintRect(ctx, levels[i], 'white');
				}
				var lanes = _flowLayout.getLanes();
				for (i = 0; i < lanes.length; i++) {
					paintRect(ctx, lanes[i], 'white');
				}
			}

			function paintRect(ctx, rect, color) {
				if (rect) {
					ctx.fillStyle = color;
					ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
				}
			}

			function drawGrid(ctx) {
				ctx.strokeStyle = constants.colors().GRID;
				//if (config.hasShowGrid()) {
					ctx.setLineDash([3,2]);
					//ctx.lineWidth = 1;
					var levelPipes = _flowLayout.getLevelPipes();
					for (var i = 0; i < levelPipes.length; i++) {
						var r = levelPipes[i].clone();
						r.translate(1,1);
						if (config.getFlowDirection() === constants.flow().VERTICAL) {
							ctx.beginPath();
							ctx.moveTo(r.x, r.y);
							ctx.lineTo(r.x+r.width, r.y);
							ctx.moveTo(r.x, r.y+r.height);
							ctx.lineTo(r.x+r.width, r.y+r.height);
							ctx.stroke();
						} else {
							ctx.beginPath();
							ctx.moveTo(r.x, r.y);
							ctx.lineTo(r.x, r.y+r.height);
							ctx.moveTo(r.x+r.width, r.y);
							ctx.lineTo(r.x+r.width, r.y+r.height);
							ctx.stroke();
						}
						//if (_graphSettings.getOrientation() == LayoutConstants.VERTICAL) {
						//	g2.drawLine(r.x, r.y, r.x+r.width, r.y);
						//	g2.drawLine(r.x, r.y+r.height, r.x+r.width, r.y+r.height);
						//} else {
						//	g2.drawLine(r.x, r.y, r.x, r.y+r.height);
						//	g2.drawLine(r.x+r.width, r.y, r.x+r.width, r.y+r.height);
						//}
					}
					var lanePipes = _flowLayout.getLanePipes();
					for (i = 0; i < lanePipes.length; i++) {
						r = lanePipes[i].clone();
						r.translate(1,1);
						if (config.getFlowDirection() === constants.flow().VERTICAL) {
							ctx.beginPath();
							ctx.moveTo(r.x, r.y);
							ctx.lineTo(r.x, r.y+r.height);
							ctx.moveTo(r.x+r.width, r.y);
							ctx.lineTo(r.x+r.width, r.y+r.height);
							ctx.stroke();
						} else {
							ctx.beginPath();
							ctx.moveTo(r.x, r.y);
							ctx.lineTo(r.x+r.width, r.y);
							ctx.moveTo(r.x, r.y+r.height);
							ctx.lineTo(r.x+r.width, r.y+r.height);
							ctx.stroke();
						}
						//if (_graphSettings.getOrientation() == LayoutConstants.VERTICAL) {
						//	g2.drawLine(r.x, r.y, r.x, r.y+r.height);
						//	g2.drawLine(r.x+r.width, r.y, r.x+r.width, r.y+r.height);
						//} else {
						//	g2.drawLine(r.x, r.y, r.x+r.width, r.y);
						//	g2.drawLine(r.x, r.y+r.height, r.x+r.width, r.y+r.height);
						//}
					}

				//}
				//else {
				//	ctx.strokeStyle = '#A40FBA';
				//	ctx.setLineDash([0,0]);
				//	r = self.getRectBounds().clone();
				//	r.translate(1,1);
				//	ctx.strokeRect(r.x, r.y, r.width, r.height);
				//}
			}

			function drawGridTitles(ctx) {
				var levels = _flowLayout.getLevels(),
					lanes = _flowLayout.getLanes(),
					i, rect = _canvas.getBoundingClientRect();

				var bckgnd = '#E1F5FF', wh = 16;
				ctx.save();
				ctx.fillStyle = bckgnd;
				var r = self.getRectBounds();
				r.translate(1,1);
				ctx.fillRect(r.x, r.y, r.width, wh);
				ctx.fillRect(r.x, r.y, wh, r.height);
				ctx.fillRect(r.x, r.y + r.height - wh - 1, r.width, wh);
				ctx.fillRect(r.x + r.width - wh - 1, r.y, wh, r.height);
				ctx.restore();

				for (i = 0; i < levels.length; i++) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						draw.drawGridTitle(ctx, rect,
							new Point(levels[i].x + levels[i].width/2, 2),
							constants.gridDir().TOP, "Layer "+i);
						draw.drawGridTitle(ctx, rect,
							new Point(levels[i].x + levels[i].width/2 -2, levels[i].y + levels[i].height),
							constants.gridDir().BOTTOM, "Layer "+i);
					} else {
						draw.drawGridTitle(ctx, rect,
							new Point(levels[i].x + 2, levels[i].y + levels[i].height/2),
							constants.gridDir().LEFT, "Layer "+i);
						draw.drawGridTitle(ctx, rect,
							new Point(levels[i].x + levels[i].width, levels[i].y + levels[i].height/2),
							constants.gridDir().RIGHT, "Layer "+i);
					}
				}
				for (i = 0; i < lanes.length; i++) {
					if (config.getFlowDirection() === constants.flow().VERTICAL) {
						draw.drawGridTitle(ctx, rect,
							new Point(lanes[i].x + lanes[i].width/2, 2),
							constants.gridDir().TOP, "Lane "+i);
						draw.drawGridTitle(ctx, rect,
							new Point(lanes[i].x + lanes[i].width/2 -2, lanes[i].y + lanes[i].height),
							constants.gridDir().BOTTOM, "Lane "+i);
					} else {
						draw.drawGridTitle(ctx, rect,
							new Point(lanes[i].x + 2, lanes[i].y + lanes[i].height/2),
							constants.gridDir().LEFT, "Lane "+i);
						draw.drawGridTitle(ctx, rect,
							new Point(lanes[i].x + lanes[i].width, lanes[i].y + lanes[i].height/2),
							constants.gridDir().RIGHT, "Lane "+i);
					}
				}

			}

			function drawBorder(ctx) {
				ctx.strokeStyle = constants.colors().BORDER;
				ctx.setLineDash([0,0]);
				var r = self.getRectBounds();
				r.translate(1,1);
				ctx.strokeRect(r.x, r.y, r.width, r.height);
			}

			function drawBorderTh(ctxTh) {
				ctxTh.save();
				ctxTh.strokeStyle = "blue";
				ctxTh.setLineDash([0,0]);
				ctxTh.lineWidth = 2;
				var r = self.getRectBounds();
				r.translate(1,1);
				ctxTh.strokeRect(r.x, r.y, r.width-4, r.height-2);
				ctxTh.restore();
			}

			function drawDashedRect(ctx, rect) {
				ctx.setLineDash([3,2]);
				ctx.beginPath();
				ctx.moveTo(rect.x, rect.y);
				ctx.lineTo(rect.x+rect.width, rect.y);
				ctx.lineTo(rect.x+rect.width, rect.y+rect.height);
				ctx.lineTo(rect.x, rect.y+rect.height);
				ctx.lineTo(rect.x, rect.y);
				ctx.stroke();
			}

			// test only
			self.printDiagramContent = function(s){
				console.log("---- diagram: "+s+" ----");
				var i, nodes = _flowLayout.getNodesList();
				//var i;
				//for (i = 0; i < nodes.length; i++) {
				//	console.log(nodes[i].print1());
				//}
				//var edges = _flowLayout.getEdgesList();
				//for (i = 0; i < edges.length; i++) {
				//	console.log(edges[i].print());
				//}

				var levels = _flowLayout.getLevels();
				console.log("LEVELS:");
				for (i = 0; i < levels.length; i++) {
					console.log(levels[i].showBounds());
				}
				var levelPipes = _flowLayout.getLevelPipes();
				console.log("LEVEL PIPES:");
				for (i = 0; i < levelPipes.length; i++) {
					console.log(levelPipes[i].showBounds());
				}
				var lanes = _flowLayout.getLanes();
				console.log("LANES:");
				for (i = 0; i < lanes.length; i++) {
					console.log(lanes[i].showBounds());
				}
				var lanePipes = _flowLayout.getLanePipes();
				console.log("LANE PIPES:");
				for (i = 0; i < lanePipes.length; i++) {
					console.log(lanePipes[i].showBounds());
				}
			};


			//self.init();
		}
		jsUtils.inherit(FlowDiagram, GraphElement);
		return FlowDiagram;
	}
);
