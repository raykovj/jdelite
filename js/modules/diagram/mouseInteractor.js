define('modules/diagram/mouseInteractor',
	['modules/flow/flowManager',
		'modules/diagram/flowNode',
		'modules/graph/graphEdge',
		'modules/geometry/point',
		'modules/graph/graphConstants',
		'modules/settings/config',
		'modules/html/iconLoader',
		'modules/flow/flowUtils',
		'modules/graph/modelUtils',
		'modules/draw/draw',
		'modules/diagram/diagramUtils',
		'jqueryui',
		'jqueryuictxm'],
	function(FlowManager,
	         FlowNode,
	         GraphEdge,
	         Point,
	         constants,
	         config,
			 loader,
			 flowUtils,
			 modelUtils,
			 draw,
			 dgmUtils) {
		function MouseInteractor(flowManager) {

			var self = this;
			var _manager = flowManager,
				_selectionManager = _manager.getSelectionManager(),
				_canvas = _manager.getCanvas(),
				_context = _manager.getCanvasContext(),
				STEP = 1,
				_movedX = 0,
				_movedY = 0,
				_isSelectionOnClick = false,
				_editingNode,
				_editingLink,
				_canvasSelector = $("#canvasId"),
				_editNameSelector = $("#editNameId"),
				_linkLabelSelector = $("#linkLabelId"),
				_editContentSelector = $("#editContentId"),
				_contentSaveSelector = $("#contentSaveId"),
				_editContentElem = document.getElementById('editContentId'),
				_clickPoint,
				_isEmptyMenu;

			self.getContextMenu = function() {
				if (!config.isEditMode()) {
					return;
				}
				return {
					menu: getCanvasDiagramMenu(),
					uiMenuOptions: { classes: { "ui-menu" : "ui-menu ctx-menu" } },
					beforeOpen: function(event, ui) {
						var slx = getSelected();
						if (slx && slx.getId() === constants.elementType().NODE && _isSelectionOnClick) {
							if (slx.getFlowType() === constants.flowType().DECISION) {
								_canvasSelector.contextmenu("replaceMenu", getDecisionMenu(slx));
							} else { // may list different flow types
								_canvasSelector.contextmenu("replaceMenu", getNodeMenu(slx));
							}
						} else if (slx && slx.getId() === constants.elementType().EDGE && _isSelectionOnClick) {
							_canvasSelector.contextmenu("replaceMenu", getLinkMenu(slx));
						} else {
							//if (config.getLayoutMode() === constants.layoutMode().MANUAL) {
								_canvasSelector.contextmenu("replaceMenu", getCanvasEditMenu());
							//} else {
							//	_canvasSelector.contextmenu("replaceMenu", getCanvasDiagramMenu());
							//}
						}
						_canvasSelector.contextmenu("enableEntry", "undoCmd", _manager.canUndo());
						_canvasSelector.contextmenu("enableEntry", "redoCmd", _manager.canRedo());
						_canvasSelector.contextmenu("enableEntry", "removeSelected", _manager.getSelectionManager().hasSelections());
					}
				}
			};

			function getNodeMenu(slx) {
				return [
					{title: "----"},
					{title: "Remove node", action: function(event, ui) {
						_manager.getFlowController().removeNode(slx);
						_manager.refreshDiagramOnEdit();
					}, disabled: !config.isEditMode()},
					//{title: "----"},
					//{title: "Properties...", action: function(event, ui) {
					//	var rect = _canvas.getBoundingClientRect();
					//	var x = rect.left + slx.x * config.getScale(),
					//		y = rect.top + (slx.y + slx.height) * config.getScale() + 2;
					//	_manager.getCaller().showNodeProps(slx);
					//}},
					{title: "----"},
					{title: "Reset to default size", action: function(event, ui) {
						_manager.getModelHandler().resetNodeResize(slx);
						_manager.refreshDiagramOnEdit();
					}, disabled: !slx.hasResizeValues() || !config.isEditMode()},
					{title: "----"},
					{title: "Properties...", action: function(event, ui) {
						var rect = _canvas.getBoundingClientRect();
						var x = rect.left + slx.x * config.getScale(),
							y = rect.top + (slx.y + slx.height) * config.getScale() + 2;
						_manager.getCaller().showNodeProps(slx);
					}}//,
					//{title: "----"},
					//{title: "Remove node", action: function(event, ui) {
					//	_manager.getFlowController().removeNode(slx);
					//	_manager.refreshDiagramOnEdit();
					//}, disabled: !config.isEditMode()}//,
					//{title: "----"},
					//{title: "Show node info", action: function(event, ui) {
					//	var adjSize = modelUtils.getAdjustedSize(slx);
					//	var msg = "NODE: "+slx.getName()+",  type: "+dgmUtils.getFlowTypeName(slx.getFlowType()) +
					//		"\nlevel: "+slx.getLevelNumber()+", lane: "+slx.getLaneNumber() +
					//		"\nx: "+slx.x+", y: "+slx.y +
					//		"\nsize: W = "+slx.width+", H =  "+slx.height +
					//		"\nadjusted: W = "+adjSize.width+", H =  "+adjSize.height +
					//		"\nresizeW: "+slx.getResizeW()+", resizeH: "+slx.getResizeH();
					//	if (slx.getContainerReference()) {
					//		msg +="\ncontainer: "+slx.getContainerName();
					//		var offsets = slx.getCellContainerOffsets();
					//		msg +=
					//			"\nfront = "+offsets.front+
					//			"\nback = "+offsets.back+
					//			"\nleft = "+offsets.left+
					//			"\nright = "+offsets.right;
					//	}
					//	if (slx.getFlowType() === constants.flowType().CONTAINER) {
					//		msg +=
					//			"\ngrid across = "+slx.getGridAcross()+
					//			"\ngrid along = "+slx.getGridAlong()+
					//			"\n startLevelIdx = "+slx.getStartLevelNumber()+
					//			"\n endLevelIdx = "+slx.getEndLevelNumber()+
					//			"\n startLaneIdx = "+slx.getStartLaneNumber()+
					//			"\n endLaneIdx = "+slx.getEndLaneNumber();
					//	}
					//	if (slx.getFlowType() === constants.flowType().SWITCH) {
					//		msg +=
					//			"\nout hooks = "+slx.getHooksNumber()+
					//			"\n startLevelIdx = "+slx.getStartLevelNumber()+
					//			//"\n endLevelIdx = "+slx.getEndLevelNumber()+
					//			"\n startLaneIdx = "+slx.getStartLaneNumber()+
					//			"\n endLaneIdx = "+slx.getEndLaneNumber();
					//	}
					//	_manager.getCaller().showInfoMessage(msg, "Node Info");
					//}}
				];
			}

			function getDecisionMenu(slx) {
				return [
					{title: "----"},
					{title: "Remove node", action: function(event, ui) {
						_manager.getFlowController().removeNode(slx);
						_manager.refreshDiagramOnEdit();
					}, disabled: !config.isEditMode()},
					{title: "----"},
					{title: "Configure...", action: function(event, ui) {
						_manager.getFlowController().editDecisionNode(slx);
					}, disabled: !config.isEditMode()},
					{title: "----"},
					{title: "Reset to default size", action: function(event, ui) {
						_manager.getModelHandler().resetNodeResize(slx);
						_manager.refreshDiagramOnEdit();
					}, disabled: !slx.hasResizeValues() || !config.isEditMode()},
					{title: "----"},
					{title: "Properties...", action: function(event, ui) {
						var rect = _canvas.getBoundingClientRect();
						var x = rect.left + slx.x * config.getScale(),
							y = rect.top + (slx.y + slx.height) * config.getScale() + 2;
						_manager.getCaller().showNodeProps(slx);
					}}//,
					//{title: "Show node info", action: function(event, ui) {
					//	var adjSize = modelUtils.getAdjustedSize(slx);
					//	var msg = "NODE: "+slx.getName()+",  type: "+dgmUtils.getFlowTypeName(slx.getFlowType()) +
					//		"\nlevel: "+slx.getLevelNumber()+", lane: "+slx.getLaneNumber() +
					//		"\nx: "+slx.x+", y: "+slx.y +
					//		"\nsize: W = "+slx.width+", H =  "+slx.height +
					//		"\nadjusted: W = "+adjSize.width+", H =  "+adjSize.height +
					//		"\nresizeW: "+slx.getResizeW()+", resizeH: "+slx.getResizeH();
					//	_manager.getCaller().showInfoMessage(msg, "Node Info");
					//}}
				];
			}

			function disableEdit(slx) {
				return slx.getFlowType() !== constants.flowType().DECISION;
			}

			function getLinkMenu(slx) {
				return [
					{title: "Remove link", action: function(event, ui) {
						_manager.getFlowController().removeLink(slx);
						_manager.refreshDiagramOnEdit();
					}, disabled: !config.isEditMode()},
					{title: "----"},
					{title: "Clear segment edits", action: function(event, ui) {
						_manager.getFlowController().clearSegmentShifts([slx]);
						_manager.refreshDiagramOnEdit();
						//}, disabled: slx.getTotalShifts().length === 0}
					}, disabled: !slx.hasSegmentShifts() && !slx.hasForcedCrossings()},
					//{title: "----"},
					//{title: "Show link info", action: function(event, ui) {
					//	var msg = "LINK: "+slx.printLink();
					//	_manager.getCaller().showInfoMessage(msg, "Link Info");
					//}},
					{title: "----"},
					{title: "Properties...", action: function(event, ui) {
						//var rect = _canvas.getBoundingClientRect();
						//var x = rect.left + slx.x * config.getScale(),
						//	y = rect.top + (slx.y + slx.height) * config.getScale() + 2;
						_manager.getCaller().showLinkProps(slx);
					}}//,
				];
			}

			// placeholder
			function getCanvasDiagramMenu() {
				return [
					{title: "Add node<kbd/>", children:
					//config.getLayoutMode() === constants.layoutMode().AUTO ?
					//	getAddNodeMenuAuto() : getAddNodeMenuManual(), disabled: _isEmptyMenu},
					getAddNodeMenuManual(), disabled: _isEmptyMenu},
					{title: "----"},
					{title: "Undo<kbd>Ctrl+Z</kbd>", cmd: "undoCmd", action: function(event, ui) {
						_manager.getUndoManager().undo(); },
						disabled: true
					},
					//{title: "----"},
					{title: "Redo<kbd>Ctrl+Shift+Z</kbd>", cmd: "redoCmd", action: function(event, ui) {
						_manager.getUndoManager().redo(); },
						disabled: true
					},
					{title: "----"},
					{title: "Remove selections", cmd: "removeSelected", action: function(event, ui) {
						_manager.getFlowController().removeSelections();
						_manager.getSelectionManager().clearSelections();
						_manager.refreshDiagramOnEdit();
					}, disabled: true}
				];
			}

			function getCanvasEditMenu() {
				return [
					{title: "Add node<kbd/>", children: getAddNodeMenuManual(), disabled: _isEmptyMenu || !config.isEditMode()},
					{title: "----"},
					{title: "Insert layer", action: function(event, ui) {
						var levelIdx = flowUtils.getLevelPipeIndexAtPoint(_clickPoint, _manager.getFlowLayout().getLevelPipes());
						_manager.getFlowController().addCorridor(levelIdx, -1);
						_manager.refreshDiagramOnEdit();
					}, disabled: disableAddLevel() || !config.isEditMode()},
					{title: "Insert lane", action: function(event, ui) {
						var laneIdx = flowUtils.getLanePipeIndexAtPoint(_clickPoint, _manager.getFlowLayout().getLanePipes());
						_manager.getFlowController().addCorridor(-1, laneIdx);
						_manager.refreshDiagramOnEdit();
					}, disabled: disableAddLane() || !config.isEditMode()},
					{title: "----"},
					{title: "Remove layer", action: function(event, ui) {
						var levelIdx = flowUtils.getLevelIndexAtPoint(_clickPoint, _manager.getFlowLayout().getLevels());
						_manager.getFlowController().removeCorridor(levelIdx, -1);
						_manager.refreshDiagramOnEdit();
					}, disabled: disableRemoveLevel() || !config.isEditMode()},
					{title: "Remove lane", action: function(event, ui) {
						var laneIdx = flowUtils.getLaneIndexAtPoint(_clickPoint, _manager.getFlowLayout().getLanes());
						_manager.getFlowController().removeCorridor(-1, laneIdx);
						_manager.refreshDiagramOnEdit();
					}, disabled: disableRemoveLane() || !config.isEditMode()},
					{title: "----"},
					{title: "Reset all resize values", action: function(event, ui) {
						_manager.getFlowController().clearAllResizeValues();
						_manager.refreshDiagramOnEdit();
					}, disabled: !_manager.getModelHandler().haveNodesResizeValues() || !config.isEditMode()},
					{title: "----"},
					{title: "Clear all segment edits", action: function(event, ui) {
						_manager.getFlowController().clearAllShifts();
						_manager.refreshDiagramOnEdit();
					}, disabled: !_manager.getModelHandler().haveLinksSegmentShifts() &&
								 !_manager.getModelHandler().haveLinksForcedCrossings() || !config.isEditMode()},
					{title: "----"},
					{title: "Undo<kbd>Ctrl+Z</kbd>", cmd: "undoCmd", action: function(event, ui) {
						_manager.getUndoManager().undo(); },
						disabled: true
					},
					{title: "Redo<kbd>Ctrl+Shift+Z</kbd>", cmd: "redoCmd", action: function(event, ui) {
						_manager.getUndoManager().redo(); },
						disabled: true
					}
				];
			}

			function getAddNodeMenuManual() {
				var cell = _manager.getDnDHandler().getAcceptingCellAtPoint(_clickPoint);
				if (!cell) {
					_isEmptyMenu = true;
					return [];
				}
				var items = [];

				if (isCellAcceptingNode(cell, constants.flowType().START)) {
					items.push({title: "Start", action: function(event, ui) {
						addNode(constants.flowType().START);
					}});
				}
				if (isCellAcceptingNode(cell, constants.flowType().PROCESS)) {
					items.push({title: "Process", action: function(event, ui) {
						addNode(constants.flowType().PROCESS);
					}});
				}
				if (isCellAcceptingNode(cell, constants.flowType().IN_OUT)) {
					items.push({title: "Input/Output", action: function(event, ui) {
						addNode(constants.flowType().IN_OUT);
					}});
				}
				if (isCellAcceptingNode(cell, constants.flowType().DECISION)) {
					items.push({title: "Decision", action: function(event, ui) {
						addNode(constants.flowType().DECISION);
					}});
				}
				if (isCellAcceptingNode(cell, constants.flowType().SWITCH)) {
					items.push({title: "Switch", action: function(event, ui) {
						addNode(constants.flowType().SWITCH);
					}});
				}
				if (isCellAcceptingNode(cell, constants.flowType().ENDPOINT)) {
					items.push({title: "Endpoint", action: function(event, ui) {
						addNode(constants.flowType().ENDPOINT);
					}});
				}
				if (config.hasSideSwimLanes()) {
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						if (isCellAcceptingNode(cell, constants.flowType().LEFT_TOP)) {
							items.push({title: "Top Lane", action: function(event, ui) {
								addNode(constants.flowType().LEFT_TOP);
							}});
						}
						if (isCellAcceptingNode(cell, constants.flowType().RIGHT_BOTTOM)) {
							items.push({title: "Bottom Lane", action: function(event, ui) {
								addNode(constants.flowType().RIGHT_BOTTOM);
							}});
						}
					} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
						if (isCellAcceptingNode(cell, constants.flowType().LEFT_TOP)) {
							items.push({title: "Left Lane", action: function(event, ui) {
								addNode(constants.flowType().LEFT_TOP);
							}});
						}
						if (isCellAcceptingNode(cell, constants.flowType().RIGHT_BOTTOM)) {
							items.push({title: "Right Lane", action: function(event, ui) {
								addNode(constants.flowType().RIGHT_BOTTOM);
							}});
						}
					}
				}
				if (isCellAcceptingNode(cell, constants.flowType().END)) {
					items.push({title: "End Node", action: function(event, ui) {
						addNode(constants.flowType().END);
					}});
				}
				if (isCellAcceptingNode(cell, constants.flowType().CONTAINER)) {
					items.push({title: "Container Block", action: function(event, ui) {
						addNode(constants.flowType().CONTAINER);
					}});
				}
				if (isCellAcceptingNode(cell, constants.flowType().TEXT)) {
					items.push({title: "Text", action: function(event, ui) {
						addNode(constants.flowType().TEXT);
					}});
				}
				_isEmptyMenu = items.length == 0;
				return items;
			}

			function isCellAcceptingNode(cell, flowType) {
				var flowLayout = _manager.getFlowDiagram().getFlowLayout(),
					levelNum = cell.getLevelNumber(),
					laneNum = cell.getLaneNumber(),
					maxLevelIdx = flowLayout.getLevels().length- 1,
					maxLaneIdx = flowLayout.getLanes().length-1;

				if (flowType === constants.flowType().START) {
					return levelNum === 0 && config.hasStartEndLevels() &&
						(!config.hasSideSwimLanes() || laneNum > 0 && laneNum < maxLaneIdx);
				} else if (flowType=== constants.flowType().END) {
					return levelNum === maxLevelIdx && config.hasStartEndLevels() &&
						(!config.hasSideSwimLanes() || laneNum > 0 && laneNum < maxLaneIdx);
				} else if (flowType === constants.flowType().PROCESS ||
					flowType === constants.flowType().CONTAINER ||
					flowType === constants.flowType().ENDPOINT ||
					flowType === constants.flowType().TEXT ||
					flowType === constants.flowType().DECISION ||
					flowType === constants.flowType().SWITCH ||
					flowType === constants.flowType().IN_OUT) {
					if (config.hasStartEndLevels()) {
						return levelNum > 0 && levelNum < maxLevelIdx &&
							(!config.hasSideSwimLanes() || laneNum > 0 && laneNum < maxLaneIdx);
					} else {
						return !config.hasSideSwimLanes() || laneNum > 0 && laneNum < maxLaneIdx;
					}
				} else if (flowType === constants.flowType().LEFT_TOP) {
					return config.hasSideSwimLanes() && laneNum == 0 &&
						(!config.hasStartEndLevels() || levelNum > 0 && levelNum < maxLevelIdx);
				} else if (flowType === constants.flowType().RIGHT_BOTTOM) {
					return config.hasSideSwimLanes() && laneNum == maxLaneIdx &&
						(!config.hasStartEndLevels() || levelNum > 0 && levelNum < maxLevelIdx);
				}
				return false;
			}


			function addNode(flowType) {
				if (config.getLayoutMode() === constants.layoutMode().AUTO) {
					_manager.getFlowController().addNodeByType(flowType, _manager.getNodeNamesMap());
				} else if (config.getLayoutMode() === constants.layoutMode().MANUAL) {
					var cell = _manager.getDnDHandler().getAcceptingCellAtPoint(_clickPoint);
					if (cell) {
						_manager.getFlowController().addNodeOnCell(flowType, _manager.getNodeNamesMap(), cell);
					}
				}
				_manager.refreshDiagramOnEdit();
			}

			self.resetMouseMove = function() {
				setMouseOver(new Point(-1, -1));
			};

			self.onMouseMove = function(event) {
				//if (config.isLayoutOn()) {
				//	//_canvas.style.cursor = 'move';
				//	window.document.body.style.cursor = "wait";
				//} else {
				//	//_canvas.style.cursor = 'auto';
				//	window.document.body.style.cursor = "auto";
				//}
				var //eventX = event.clientX * 1.5, eventY = event.clientY * 1.5,
					rect = _canvas.getBoundingClientRect(),
					x = Math.floor(event.clientX - rect.left),
					y = Math.floor(event.clientY - rect.top);
				//console.log("###  XY: x="+x+", y="+y);
				if (Math.abs(_movedX - x) > STEP || Math.abs(_movedY - y) > STEP) {
					//console.log("_movedX-x="+(Math.abs(_movedX - x))+", _movedY-y="+(Math.abs(_movedY - y)));
					_movedX = x;
					_movedY = y;
					//console.log("XY: x="+x+", y="+y);
					var point = getPoint(event);
					//console.log("** point: x="+x+", y="+y);
					setMouseOver(point);
					// used to paint corridors in dndHandler
					_manager.getFlowDiagram().setMousePoint(point);
					_manager.paintDiagram();
					//_manager.showTooltip(point);
				}
			};

			function setMouseOver(point) {
				var nodes = _manager.getModelHandler().getFlowNodes(),
					isOver,
					node,
					inner;
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].setHighlightedAtPoint(point)) {
						isOver = true;
						node = nodes[i];
						inner = nodes[i].getInnerShape();
						break;
					}
				}
				if (isOver && node.isSelected()) {
					if (!node.isExpanded()) {
						var inRect = node.hasPointInside(point),
							inInner = inner.hasPointInside(point);
						if (inInner) {
							_canvas.style.cursor = 'move';
						} else if (inRect && node.allowsResize()) {
							var rszRect = dgmUtils.getResizeRectangle(node, point),
								crsValue = dgmUtils.getResizeCursor(rszRect);
							_canvas.style.cursor = crsValue;
						} else {
							_canvas.style.cursor = 'auto';
						}
					}
					if (node.getFlowType() === constants.flowType().CONTAINER) {
						// TODO
					}
				} else {
					_canvas.style.cursor = 'auto';
				}

				var links = _manager.getModelHandler().getFlowLinks(),
					link;
				for (i = 0; i < links.length; i++) {
					if (links[i].highlightOnMouseMove(point)) {
						link = links[i];
					}
				}
				_manager.showLinkLabelAsTooltip(null);
				if (link && link.isSelected() && link.getDrawMode() === constants.drawMode().SEGMENTS) {
					var info = {};
					info.linkInfo = link.getLinkInfo();
					info.point = point;
					_manager.showLinkLabelAsTooltip(info);
				}
			}

			self.onMousePress = function(event) {
				//console.log("MOUSE PRESSED");
				var point = getPoint(event),
					selected = [],
					isMultiple = _manager.isControlPressed(),
					selItems = _manager.getSelectionManager().getSelections();
				//if (isOverElement(point) || !_manager.canPaste() && !_manager.readyToPaste()) {
				if (isOverElement(point) || selItems.length > 0) {
					//_manager.resetCopyPaste();
					if (!isMultiple || event.button === 2) {
						_selectionManager.clearSelections();
						_manager.getDnDHandler().resetSelectionRectangle();
					}
					selected = nodeSingleClick(point, isMultiple);
					if (selected.length === 0) {
						selected = linkSingleClick(point, isMultiple);
					}
					if (selected.length > 0) {
						// TODO: scroll to selection
						_isSelectionOnClick = true;
					} else {
						_isSelectionOnClick = false;
						if (event.button === 2 && selItems.length > 0) {
							_manager.getSelectionManager().addMultipleToSelections(selItems);
						}
					}
				}
				//console.log("$$$ onMousePress");
				if (selected.length === 0 && _manager.canPaste() && _manager.isClipboardPasteLocationOk(point)) {
					_manager.getFlowDiagram().showPasteTooltip(point);
					_manager.getFlowDiagram().showPasteMessage(false);
				} else {
					_manager.getFlowDiagram().clearPasteTooltip();
				}
				_manager.getCaller().updateWindow();
				_manager.paintDiagram();
				if (!_manager.canPaste() && selected.length === 0) {
					_manager.getCaller().setTooltipBox(["Drag to scroll, or", "[Shift] + Drag to select"], point);
				}
				//_manager.getCaller().updateWindow();
				//_manager.paintDiagram();
				if (selected.length > 0  &&
					selected[0].getFlowType() === constants.flowType().CONTAINER) {
					//_manager.getSelectionManager().clearSelections();
					if (selected[0].hasExpandChange()) {
						selected[0].resetExpandChange();
						_manager.getModelHandler().updateFlowNodesModel();
						_manager.refreshDiagramOnEdit();
					}
				}
				////////////////
				//showXY(event);
				////////////////
			};

			function isOverElement(point) {
				var nodes = _manager.getModelHandler().getFlowNodes(),
					links = _manager.getModelHandler().getFlowLinks();
				return flowUtils.hasNodeAtPoint(nodes, point) || flowUtils.hasLinkAtPoint(links, point);
			}

			self.onMouseRelease = function(event) {
				_isEmptyMenu = false;
				_clickPoint = getPoint(event);
				_manager.getCaller().setTooltipBox("");
			};

			self.onMouseClick = function(event) {
				_clickPoint = getPoint(event);
				var theLink, links = _manager.getModelHandler().getFlowLinks();
				for (var i = 0; i < links.length; i++) {
					if (links[i].isVisible() && links[i].containsPoint(_clickPoint)) {
						theLink = links[i];
						break;
					}
				}
				// obsolete
				//if (theLink) {
				//	setLinkLabelEditing(_clickPoint.x, _clickPoint.y, theLink);
				//} else {
				//	clearLinkLabelEditing();
				//}
			};

			self.onMouseDoubleClick = function(event) {
				var point = getPoint(event), node, i;
				var nodes = _manager.getModelHandler().getFlowNodes();
				for (i = 0; i < nodes.length; i++) {
					if (nodes[i].containsPoint(point)) {
						if (!nodes[i].isVisible() &&  nodes[i].getFlowType() === constants.flowType().CONTAINER) {
							node = flowUtils.getNodeInsideContainerAtPoint(nodes[i], _clickPoint);
						} else {
							node = nodes[i];
						}
						break;
					}
				}
				if (node) {
					_manager.getCaller().showNodeProps(node);
				} else {
					var theLink, links = _manager.getModelHandler().getFlowLinks();
					for (i = 0; i < links.length; i++) {
						if (links[i].isVisible() && links[i].containsPoint(_clickPoint)) {
							theLink = links[i];
							break;
						}
					}
					if (theLink) {
						_manager.getCaller().showLinkProps(theLink);
					}
				}
			};

			self.onMouseExit = function(event) {
				_manager.getFlowDiagram().setMousePoint(undefined);
				_manager.getFlowDiagram().clearMarkups();
				_manager.paintDiagram();
				//console.log("### exit canvas");
				//$("#canvasId").contextmenu("close");
				//if ($('.ctx-menu'))
				//console.log("### menu height="+	$('.ctx-menu').innerHeight());
				//console.log("### menu is open: "+$("#canvasId").contextmenu("isOpen"));
				//var rect = _canvas.getBoundingClientRect(),
				//	x = Math.floor(event.clientX - rect.left),
				//	y = Math.floor(event.clientY - rect.top);
				//console.log("### canvas: "+rect.left+", "+rect.top+", "+rect.width+", "+rect.height+" *** "+
				//	event.clientX+", "+event.clientY);
				_manager.getCaller().setTooltipBox("");
			};

			self.getEditingNode = function() {
				return _editingNode;
			};

			self.getEditingLink = function() {
				return _editingLink;
			};

			self.isOverCanvas = function(event) {
				var rect = _canvas.getBoundingClientRect(),
					x = Math.floor(rect.left),
					y = Math.floor(rect.top),
					w = Math.floor(rect.width),
					h = Math.floor(rect.height),
					eX = Math.floor(event.clientX),
					eY = Math.floor(event.clientY);
				return eX >= x && eX <= x+w && eY >= y && eY <= y+h;
			};

			function getPoint(event) {
				var rect = _canvas.getBoundingClientRect(),
					x = Math.floor(event.clientX - rect.left),
					y = Math.floor(event.clientY - rect.top);
				return new Point(x, y);
			}

			function getSelected() {
				var items = _manager.getSelectionManager().getSelections();
				if (items.length > 0) {
					if (items[0].isVisible()) {
						return items[0];
					} else if (items[0].getFlowType() === constants.flowType().CONTAINER) {
						return flowUtils.getNodeInsideContainerAtPoint(items[0], _clickPoint);
					} else {
						return undefined;
					}
				} else {
					return undefined;
				}
			}

			function nodeSingleClick(point, isMultiple) {
				var selected = [],
					nodes = _manager.getFlowDiagram().getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					var node = nodes[i];
					//if (!node.isVisible()) {
					//	continue;
					//}
					var slx = node.getSelectedAtPoint(point, false);
					if (slx) {
						_manager.getSelectionManager().addOrToggleSelection(slx, isMultiple);
						selected.push(slx);
						if (!isMultiple) break;
					}
				}
				return selected;
			}

			function linkSingleClick(point, isMultiple) {
				var links = _manager.getFlowDiagram().getFlowLinks(),
					selected = [];
				for (var i = 0; i < links.length; i++) {
					var link = links[i];
					if (!link.isVisible()) {
						continue;
					}
					link.resetSelectedSegments();
					var segments = link.getSegmentsAtPoint(point);
					//if (segments.length === 1) {
					//	_manager.getSelectionManager().addOrToggleSelection(link, isMultiple);
					//	//if (link.isSelectionForEdit(segments[0], point)) {
					//		link.addToSelectedSegments(segments[0]);
					//	//}
					//	return link;
					//} else if (segments.length === 2) {
					//	_manager.getSelectionManager().addOrToggleSelection(link, isMultiple);
					//	link.addToSelectedSegments(segments[0]);
					//	link.addToSelectedSegments(segments[1]);
					//	return link;
					//}
					if (segments.length > 0) {
						_manager.getSelectionManager().addOrToggleSelection(link, isMultiple);
						link.addGroupToSelectedSegments(segments);
						selected.push(link);
					}
				}
				return selected;
			}

			// link label show/edit
			//function setLinkLabelEditing(x, y, link) {
			//	_linkLabelSelector.show();
			//	_linkLabelSelector.val(link.getLinkLabel());
			//	_manager.getCaller().setOldLinkLabel(link.getLinkLabel());
			//	_linkLabelSelector.offset({top: y, left: x});
			//	_linkLabelSelector.focus();
			//	_editingLink = link;
			//	_manager.getSelectionManager().clearSelections();
			//}
			//function clearLinkLabelEditing() {
			//	_linkLabelSelector.hide();
			//	_linkLabelSelector.val('');
			//	_editingLink = undefined;
			//}

			// test only
			function showXY(event) {
				var ctx = _context,
					rect = _canvas.getBoundingClientRect(),
					factor = config.getScale();
				var x = Math.floor(event.clientX - rect.left), y = Math.floor(event.clientY - rect.top);
				// SHOW ORIGINAL COORDINATES:
				var str = 'x = ' + Math.floor(x/factor) + ', ' + 'y = ' + Math.floor(y/factor);
				_manager.paintDiagram();
				ctx.fillStyle = '#ddd';
				ctx.fillRect(x, y, 80, 25);
				ctx.fillStyle = '#000';
				ctx.strokeRect(x, y, 80, 25);
				ctx.font = 'bold 16px arial';
				ctx.fillText(str, x + 10, y + 20, 60);
			}

			function disableAddLevel() {
				var flowLayout = _manager.getFlowDiagram().getFlowLayout(),
					minLevel = flowUtils.getMinLevel(flowLayout),
					minLevelNum = flowUtils.getMinLevelNumber(),
					maxLevel = flowUtils.getMaxLevel(flowLayout),
					maxLevelNum = flowUtils.getMaxLevelNumber(flowLayout),
					levelPipeIdx = flowUtils.getLevelPipeIndexAtPoint(_clickPoint, flowLayout.getLevelPipes()),
					isAdjacentEmpty = false;
				//console.log("////// disableAddLevel: levelPipeIdx="+levelPipeIdx+", minLevelNum="+minLevelNum+
				//	", maxLevelNum="+maxLevelNum);
						//(levelPipeIdx == minLevelNum || levelPipeIdx == minLevelNum+1) && minLevel.getNodes().length == 0
						//||
						//(levelPipeIdx == maxLevelNum || levelPipeIdx == maxLevelNum+1) && maxLevel.getNodes().length == 0;
				return isAdjacentEmpty || levelPipeIdx < minLevelNum || levelPipeIdx > maxLevelNum+1 ||
					flowUtils.isLevelPipeCrossingAnyContainer(_manager.getModelHandler(), levelPipeIdx);
			}

			function disableAddLane() {
				var flowLayout = _manager.getFlowDiagram().getFlowLayout(),
					minLane = flowUtils.getMinLane(flowLayout),
					minLaneNum = flowUtils.getMinLaneNumber(),
					maxLane = flowUtils.getMaxLane(flowLayout),
					maxLaneNum = flowUtils.getMaxLaneNumber(flowLayout),
					lanePipeIdx = flowUtils.getLanePipeIndexAtPoint(_clickPoint, flowLayout.getLanePipes()),
					isAdjacentEmpty = false;
						//(lanePipeIdx == minLaneNum || lanePipeIdx == minLaneNum+1) && minLane.getNodes().length == 0
						//||
						//(lanePipeIdx == maxLaneNum || lanePipeIdx == maxLaneNum+1) && maxLane.getNodes().length == 0;
				return isAdjacentEmpty || lanePipeIdx < minLaneNum || lanePipeIdx > maxLaneNum+1 ||
					flowUtils.isLanePipeCrossingAnyContainer(_manager.getModelHandler(), lanePipeIdx);
			}

			function disableRemoveLevel() {
				var flowLayout = _manager.getFlowDiagram().getFlowLayout(),
					minLevelNum = flowUtils.getMinLevelNumber(),
					maxLevelNum = flowUtils.getMaxLevelNumber(flowLayout),
					//level = _manager.getDnDHandler().getLevelAtPoint(_clickPoint);
					level = flowUtils.getLevelAtPoint(_clickPoint, flowLayout.getLevels());
				if (level && level.getOrder() >= minLevelNum && level.getOrder() <= maxLevelNum) {
					return level.getVisibleNodes().length > 0 ||
						flowUtils.isLevelCrossingAnyContainer(_manager.getModelHandler(), level.getOrder());
				}
				return true;
			}

			function disableRemoveLane() {
				var flowLayout = _manager.getFlowDiagram().getFlowLayout(),
					minLaneNum = flowUtils.getMinLaneNumber(),
					maxLaneNum = flowUtils.getMaxLaneNumber(flowLayout),
					lane = flowUtils.getLaneAtPoint(_clickPoint, flowLayout.getLanes());
				if (lane && lane.getOrder() >= minLaneNum && lane.getOrder() <= maxLaneNum) {
					return lane.getVisibleNodes().length > 0 ||
						flowUtils.isLaneCrossingAnyContainer(_manager.getModelHandler(), lane.getOrder());
				}
				return true;
			}


		}
		return MouseInteractor;
	}
);
