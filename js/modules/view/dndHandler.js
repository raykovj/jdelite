define('modules/view/dndHandler',
	['modules/view/dndTracker',
		'modules/geometry/point',
		'modules/geometry/rectangle',
		'modules/draw/draw',
		'modules/graph/pipeCrossing',
		'modules/graph/graphConstants',
		'modules/html/iconLoader',
		'modules/settings/config',
		'modules/diagram/diagramUtils',
		'modules/view/dndUtils',
		'modules/flow/flowUtils',
		'modules/dialogs/messageDialog'],
	function(DNDTracker,
	         Point,
			 Rectangle,
	         draw,
			 PipeCrossing,
	         constants,
			 loader,
	         config,
	         diagramUtils,
	         dndUtils,
			 flowUtils,
			 messageDialog) {

		function DnDHandler(flowManager) {

			var self = this;
			var _manager = flowManager,
				_flowLayout = _manager.getFlowDiagram().getFlowLayout(),
				_modelHandler = _manager.getModelHandler(),
				//_canvas = _manager.getCanvas(),
				_canvas = document.getElementById('canvasId'),
				_canvasRect,
				_canvasTh = document.getElementById('canvasThId'),
				_canvasThRect,
				_ratioTh,
				_container = document.getElementById('containerId'),
				_context = _manager.getCanvasContext(),
				_draggedFlowType, // dragged palette flow type
				_draggedNode,
				_footprintNode,
				_draggedNodeContainer,
				_resizeRect,
				_startPort,
				_draggedPort,
				_movedLink,
				_draggedLink,
				_draggedSegment,
				_draggedSegmentCopy,
				//_draggedLinkPoint,
				_draggedCorner,
				_originLinkPoint,
				_sgmStartPnt,
				_sgmEndPnt,
				_sgmPipe,
				_startPoint,
				_startEventPoint,
				_currEventPoint,
				_currThEventPoint,
				_startAttachmentPoint,
				_isDragging,
				_isOutOfView,
				_draggingNodeType, // dragging flavor: flow type
				_draggingPoint,
				_cellsAcceptingDrop = [],
				_acceptingPort,
				_dropLevelPipe,
				_dropLevelPipeIdx,
				_dropLanePipe,
				_dropLanePipeIdx,
				_dropOnLinkLevelIdx,
				_dropOnLinkLaneIdx,
				_doScroll,
				//_initialScrollLeft,
				//_initialScrollTop,
				_doSelect,
				_crossings,
				_selectionRect,
				//_hasRefHandles,
				_tracker = new DNDTracker(flowManager),
				_firstDragOK;


			/**
			 *
			 * @param event
			 */
			self.dragStarted = function(event) {
				var allowEdit = config.isEditMode();
				_canvasRect = _canvas.getBoundingClientRect();
				var factor = config.getScale(),
					x = Math.floor(event.clientX - _canvasRect.left),
					y = Math.floor(event.clientY - _canvasRect.top);
				_startPoint = new Point(x, y);
				_startEventPoint = new Point(event.clientX, event.clientY);
				_currEventPoint = new Point(event.clientX, event.clientY);
				_draggingPoint = _startPoint;
				_draggedNode = undefined;
				_firstDragOK = false;
				//console.log("*** dragStarted - point: "+_startPoint.showXY());
				var port = getPortAtPoint(_startPoint),
					node = getNodeAtPoint(_startPoint),
					link = getLinkAtPoint(_startPoint),
					segments = link ? link.getSelectedSegments() : [];
				if (allowEdit && port) {
					var img = document.createElement("img");
					img.src = port.getIcon().getAttribute('src');
					event.dataTransfer.setDragImage(img, 2,6);
					//console.log("### drag PORT : "+port.getPath()+", type="+port.getType());
					_startAttachmentPoint = port.getAttachmentPoint();

					//if (port.hasEdges()) {
					var edges = port.getEdgesList();
					if (port.getType() === constants.portType().LINK_CNX) {
						_movedLink = edges[0];
						_movedLink.setVisible(false);
						_startPort = port;
						_draggedPort = _movedLink.getOtherSidePort(port);
						_draggedPort.setDNDMode(constants.dndMode().ORIGIN);
						_tracker.setDragMode(constants.dragMode().LINK_PORT);
						//console.log(" ---dragStarted - link: "+_movedLink.getName()+", _draggedPort: "+_draggedPort.getPath());
					} else if (port.getType() === constants.portType().LINK_REF) {
						_movedLink = edges[0];
						_movedLink.setVisible(false);
						//console.log("**** DRAG REF PORT, link type = "+_movedLink.getType());
						_startPort = port;
						_draggedPort = _movedLink.getOtherSidePort(port);
						_draggedPort.setDNDMode(constants.dndMode().ORIGIN);
						_tracker.setDragMode(constants.dragMode().LINK_PORT);
						//console.log(" ---dragStarted - ref: "+_movedLink.getName()+", _draggedPort: "+_draggedPort.getPath());
					} else if (port.getType() === constants.portType().MARKUP) {
						if (!node ||
							!node.isMarkupPortValid(port)) {
							//node.getFlowType() === constants.flowType().SWITCH && port.getDirection() === constants.portDirection().MARK_OUT) {
							event.preventDefault();
							self.resetDrag();
							return;
						}
						_draggedPort = port;
						_draggedPort.setVisible(true);
						_draggedPort.setDNDMode(constants.dndMode().ORIGIN);
						_tracker.setDragMode(constants.dragMode().MARKUP_PORT);
						//console.log(" ---dragStarted, markup _draggedPort: "+_draggedPort.getPath()+", type="+port.getType());
					} else if (port.getType() === constants.portType().REF) {
						_draggedPort = port;
						_draggedPort.setVisible(true);
						_draggedPort.setDNDMode(constants.dndMode().ORIGIN);
						_tracker.setDragMode(constants.dragMode().REF_PORT);
						//console.log(" ---dragStarted, REF _draggedPort: "+_draggedPort.getPath()+", type="+port.getType());
					}
					//console.log("DnDHandler DRAG START: x="+x+", y="+y+", "+port.getIcon().getAttribute('src'));
				} else if (allowEdit && node) {
					if (node.getFlowType() === constants.flowType().CONTAINER && node.isExpanded()) {
						event.preventDefault();
						//messageDialog.showMessage(
						//	"Warning", "Moving nodes not accepted");
						self.resetDrag();
						return;
					}
					if (node.getFlowType() === constants.flowType().SWITCH) {
						event.preventDefault();
						self.resetDrag();
						return;
					}
					_draggedNode = node;
					_draggedNodeContainer = getInnerContainerAtPoint(_startPoint);
					//_draggingNodeType = node.getFlowType();
					_draggedFlowType = node.getFlowType();
					_draggedNode.showMarkupPorts(false);
					_draggedNode.hideRefPorts();
					_resizeRect = diagramUtils.getResizeRectangle(node, _startPoint);
					if (_resizeRect) {
						_draggedNode.setDrawState(constants.drawState().RESIZED);
						_tracker.setDragMode(constants.dragMode().NODE_RESIZE);
					} else {
						_draggedNode.setDrawState(constants.drawState().DRAGGED);
						_tracker.setDragMode(constants.dragMode().NODE);
					}
					_footprintNode = dndUtils.getNodeFootprint(node, _manager);
					//var image = new Image();
					//image.src = diagramUtils.getFlowTypeImageURL(node.getFlowType());
					var imageNode = _canvas.cloneNode(true);
					imageNode.style.display = "none";
					event.dataTransfer.setDragImage(imageNode, 16, 16);
					//event.target.style.cursor = "ns-resize";
					//_canvas.style.cursor = "ns-resize";
				} else if (allowEdit && link) {
					link.copySegments();
					if (segments.length === 1) {
						// SEGMENT
						if (!link.isDraggableSegment(segments[0])) {
							event.preventDefault();
							self.resetDrag();
							return;
						}
						//if (link.hasForcedCrossings()) {
						//	event.preventDefault();
						//	self.resetDrag();
						//	messageDialog.showMessage(
						//		"Warning", "Clear shifted link corners before dragging segments ");
						//	return;
						//}
						//var sgmOrder = link.getSegmentOrder(segment);
						//if (sgmOrder > 0 && sgmOrder < link.getSegments().length-1) {
							//link.copySegments();
						_draggedLink = link;
						//console.log("****************** DRAGGED: "+link.getName());
						_draggedSegment = segments[0];
						_draggedSegmentCopy = link.getCopySegments()[_draggedSegment.getOrder()];
						//_draggedLink.addToSelectedSegments(segments[0]);
						_draggedLink.setDrawMode(constants.drawMode().SEGMENT_DRAGGED);
						_sgmPipe = _draggedSegment.getPipe();
						_sgmStartPnt = new Point(_draggedSegment.getStartPoint().x, _draggedSegment.getStartPoint().y);
						_sgmEndPnt = new Point(_draggedSegment.getEndPoint().x, _draggedSegment.getEndPoint().y);
						//console.log("DRAGGED: "+_sgmStartPnt.showXY()+" || "+_sgmEndPnt.showXY());
						_tracker.setDragMode(constants.dragMode().SEGMENT);

						var imageLink = _canvas.cloneNode(true);
						imageLink.style.display = "none";
						event.dataTransfer.setDragImage(imageLink, 5, 5);
						// prevent link info tooltip
						_manager.showLinkLabelAsTooltip(null);
					} else if (segments.length === 2) {
						// CORNER
						_draggedLink = link;
						_draggedCorner = dndUtils.getXCorner(segments[0], segments[1]);
						if (!_draggedCorner || !link.isDraggableCorner(_draggedCorner)) {
							event.preventDefault();
							self.resetDrag();
							return;
						}
						//if (link.hasSegmentShifts()) {
						//	event.preventDefault();
						//	self.resetDrag();
						//	messageDialog.showMessage(
						//		"Warning", "Clear segment shifts before dragging edge corners ");
						//	return;
						//}
						_draggedLink.setDrawMode(constants.drawMode().SEGMENT_DRAGGED);
						//_originLinkPoint = new Point(_draggedLinkPoint.x, _draggedLinkPoint.y);
						_originLinkPoint = new Point(_draggedCorner.cornerPoint().x, _draggedCorner.cornerPoint().y);

						_tracker.setDragMode(constants.dragMode().LINK_POINT);
						_crossings = dndUtils.getPipesCrossingsExcludePoint(_flowLayout, _originLinkPoint);

						var pointImage = _canvas.cloneNode(true);
						pointImage.style.display = "none";
						event.dataTransfer.setDragImage(pointImage, 5, 5);
					} else {
						event.preventDefault();
						self.resetDrag();
						return;
					}
				} else if (_manager.isShiftPressed()) {
					_tracker.setDragMode(constants.dragMode().SELECT);
					_selectionRect = undefined;
					_doSelect = true;
					var selectImage = _canvas.cloneNode(true);
					selectImage.style.display = "none";
					event.dataTransfer.setDragImage(selectImage, 5, 5);
				} else {
					var hand = loader.handGrab;
					event.dataTransfer.setDragImage(hand, 10, 10);
					_doScroll = true;
				}
				//_hasRefHandles = config.hasShowRefHandles();
				//if (!_hasRefHandles) {
					//config.setShowRefHandles(true);
				//}
				repaint();
			};

			self.dragThStarted = function(event) {
				_canvasRect = _canvas.getBoundingClientRect();
				_canvasThRect = _canvasTh.getBoundingClientRect();
				var factor = config.getScale(),
					canvasThContainer = document.getElementById("thumbnailViewId"),
					rth = canvasThContainer.getBoundingClientRect(),
					cvsMax = Math.max(_canvasRect.width, _canvasRect.height),
					rthMax = Math.max(rth.width, rth.height);
				_ratioTh = rthMax*factor/cvsMax;
				_currThEventPoint = new Point(event.clientX, event.clientY);
				var hand = loader.handGrab;
				event.dataTransfer.setDragImage(hand, 10, 10);
			};

			self.dragEnter = function(event) {
				if (_doScroll) {
					//event.preventDefault();
					//event.dataTransfer.dropEffect = 'none';
				}
			};

			/**
			 *
			 * @param event
			 * @param draggedPaletteId - undefined if not from palette
			 */
			self.dragOver = function(event, draggedPaletteId) {
				var allowEdit = config.isEditMode();
				_canvasRect = _canvas.getBoundingClientRect(); // mandatory
				var factor = config.getScale(),
					x = Math.floor(event.clientX - _canvasRect.left),
					y = Math.floor(event.clientY - _canvasRect.top),
					tooltip;
				_draggingPoint = new Point(x, y);
				//console.log("_draggingPoint: x="+x+", y="+y);
				_isDragging = true;
				_isOutOfView = false;
				// reset any previous acceptingPort
				if (_acceptingPort) {
					_acceptingPort.setDragMode(constants.dragMode().NONE);
				}
				_acceptingPort = undefined;

				if (_doScroll) {
					//// SCROLL ////
					event.stopPropagation();
					var dragX = event.clientX - _currEventPoint.x,
						dragY = event.clientY - _currEventPoint.y;
					if (dragX !== 0) {
						_container.scrollLeft += dragX*2;
					}
					if (dragY !== 0) {
						_container.scrollTop += dragY*2;
						//window.scroll(window.scrollX, window.scrollY += dragY*2);
					}
					_currEventPoint.moveToXY(event.clientX, event.clientY);
					return;
				} else if (_tracker.getDragMode() === constants.dragMode().SELECT) {
					repaint();
					return;

				} else if (allowEdit && !_draggedNode && draggedPaletteId) {
					///// GALLERY /////
					if (!_draggedFlowType) {
						//_draggedFlowType = diagramUtils.getFlowTypeForGalleryId(draggedPaletteId);
						_draggedFlowType = parseInt(draggedPaletteId);
					}
					_tracker.setDragMode(constants.dragMode().GALLERY);
					//var overLink = false;
					//if (_tracker.canDropOnLink(_draggedFlowType)) {
					//	overLink = highlightLinkAtPoint(_draggingPoint);
					//}
					//highlightContainerAtPoint(_draggingPoint);
					//
					//if (config.getLayoutMode() === constants.layoutMode().MANUAL && !overLink) {
						setDNDDropPipes(_draggingPoint, _draggedFlowType);
						//console.log("@@ dropLevel="+_dropLevelPipeIdx+", dropLane="+_dropLanePipeIdx);
					//}
					var isAllowed = isDropAllowed(_draggingPoint);
					if (!isAllowed) {
						event.dataTransfer.dropEffect = "none";
					} else {
						event.dataTransfer.dropEffect = "move";
					}
					tooltip = _tracker.getDragOverTooltip(_draggedFlowType, _dropLevelPipe, _dropLanePipe);
					//console.log("---- DRAG 2: x="+_draggingPoint.x+", y="+_draggingPoint.y);
				} else if (allowEdit && !_resizeRect && _draggedNode && _footprintNode) {
					//// DRAG NODE ////
					if (!_draggedFlowType) {
						_draggedFlowType = _draggedNode.getFlowType();
					}
					//console.log("*** dragOver: W = "+_draggedNode.width+", H = "+_draggedNode.height);
					var dx = (_draggingPoint.x - _startPoint.x) / factor,
						dy = (_draggingPoint.y - _startPoint.y) / factor;
					//console.log("*** dragOver: dx = "+dx+", dy = "+dy);

					_draggedNode.setLocationOnDrag(_footprintNode.x+dx, _footprintNode.y+dy);
					//
					if (config.getLayoutMode() == constants.layoutMode().MANUAL) {
						//setDNDDropPipes(_draggingPoint, _draggingNodeType);
						setDNDDropPipes(_draggingPoint, _draggedFlowType);
					}
					//
					tooltip = "Drag node to a new location";
				} else if (allowEdit && _draggedNode && _resizeRect) {
					//// RESIZE NODE ////
					diagramUtils.setResizeValues(_draggedNode, _resizeRect.getOrientation(), _draggingPoint, _startPoint);
					//console.log("*** dragOver: W = "+_draggedNode.width+", H = "+_draggedNode.height);

				} else if (allowEdit && _draggedPort) {
					//// DRAG PORT ////
					if (!_firstDragOK) {
						_firstDragOK = _tracker.setAcceptedDestinations(_draggedPort, _draggingPoint);
					}
					_draggedPort.setVisible(true);
					if (_startPort) {
						_startPort.setVisible(true);
					}
					//if (_tracker.getDragMode() === constants.dragMode().LINK_PORT) {
					//	//(_movedLink.getOtherSidePort(_draggedPort)).setDNDMode(constants.dndMode().ORIGIN);
					//}
					_acceptingPort = _tracker.getDragMode() === constants.dragMode().LINK_PORT ?
						_tracker.getAcceptingPortForPoint3(
							_draggedPort, _draggingPoint, _movedLink.getOtherSidePort(_draggedPort)) :
						_tracker.getAcceptingPortForPoint2(_draggedPort, _draggingPoint);
					if (_acceptingPort) {
						_acceptingPort.setDragMode(constants.dragMode().ACCEPT_PORT);
						//console.log("### DRAG: _acceptingPort: "+_acceptingPort.getName());
					}
					//tooltip = "Drag to an accepting port";

				} else if (allowEdit && _draggedLink && !_draggedCorner) {
					//// DRAG SEGMENT ////
					var dlx = (_draggingPoint.x - _startPoint.x) / factor,
						dly = (_draggingPoint.y - _startPoint.y) / factor,
						startX = _sgmStartPnt.x + dlx,
						startY = _sgmStartPnt.y + dly,
						endX = _sgmEndPnt.x + dlx,
						endY = _sgmEndPnt.y + dly;
					_draggedSegment.setStartPoint(startX, startY);
					_draggedSegment.setEndPoint(endX, endY);
					//
					setPipesForMenus(_draggingPoint);
					var pipes = _tracker.getAcceptingPipes(
						_draggedLink, _draggedSegment, _sgmStartPnt.multiplyBy(factor), _sgmEndPnt.multiplyBy(factor), _sgmPipe);
					if (pipes.length > 0) {
						tooltip = "Drag segment to an accepting pipe";
					} else {
						tooltip = "No accepting pipes";
					}

				} else if (allowEdit && _draggedCorner) {
					//// DRAG CORNER ////
					var dlx = (_draggingPoint.x - _startPoint.x) / factor,
						dly = (_draggingPoint.y - _startPoint.y) / factor,
						startX = _originLinkPoint.x + dlx,
						startY = _originLinkPoint.y + dly;
					_draggedCorner.cornerPoint().moveToXY(startX, startY);
				}
				repaint();
				if (allowEdit && tooltip) {
					_manager.getCaller().setTooltipBox(tooltip, _draggingPoint);
				}
			};

			self.dragThOver = function(event) {
				event.stopPropagation();
				var dragX = (event.clientX - _currThEventPoint.x)*2,
					dragY = (event.clientY - _currThEventPoint.y)*2;
				if (dragX !== 0) {
					_container.scrollLeft += dragX/_ratioTh;
				}
				if (dragY !== 0) {
					_container.scrollTop += dragY/_ratioTh;
					//window.scroll(window.scrollX, window.scrollY += dragY/_ratioTh);
				}
				_currThEventPoint.moveToXY(event.clientX, event.clientY);
			};

			/**
			 *
			 * @param event
			 */
			self.dragLeave = function(event) {
				if (!_doScroll && _tracker.getDragMode() !== constants.dragMode().SELECT) {
					self.resetDrag();
					_manager.getCaller().setTooltipBox("");
					_manager.refreshDiagramOnEdit();
				}
			};

			/**
			 *
			 * @param event
			 */
			self.dragEnd = function(event) {
				_canvasRect = _canvas.getBoundingClientRect();
				var data = event.dataTransfer.getData("text"),
					x = Math.floor(event.clientX - _canvasRect.left),
					y = Math.floor(event.clientY - _canvasRect.top);
				//console.log("++ onMouseDragEnd: x="+x+", y="+y+", DATA: "+data);

				self.resetDrag();
				//_manager.refreshDiagram();
			};

			/**
			 *
			 * @param event
			 */
			self.drop = function(event) {
				if (!config.isEditMode()) { return; }
				_canvasRect = _canvas.getBoundingClientRect();
				var draggedPaletteId = event.dataTransfer.getData("text"),
					x = Math.floor(event.clientX - _canvasRect.left),
					y = Math.floor(event.clientY - _canvasRect.top),
					factor = config.getScale(),
					doRefresh = false;
				//console.log("++++++ DROP: x="+x+", y="+y+", draggedPaletteId: "+draggedPaletteId);
				//console.log("++++++ DROP: x="+x+", y="+y);
				//_draggedFlowType = diagramUtils.getFlowTypeForGalleryId(draggedPaletteId);
				_draggedFlowType = parseInt(draggedPaletteId);
				var dropPoint = new Point(x, y),
					link = getLinkAtPoint(dropPoint),
					acceptingCell = self.getAcceptingCellAtPoint(dropPoint),
					container;

				if (_tracker.getDragMode() === constants.dragMode().SELECT) {
					_selectionRect = getSelectionRect();
					var selItems = diagramUtils.getItemsToSelect(
						_selectionRect, _manager.getModelHandler().getFlowNodes(), _manager.getModelHandler().getFlowLinks());
					_manager.getSelectionManager().addMultipleToSelections(selItems);
					_manager.getSelectionManager().cacheSelections();

				} else if (!_draggedNode && _draggedFlowType) {
					///// GALLERY /////
					if (link &&
						!link.hasSegmentShifts() &&
						_tracker.canDropOnLink(draggedPaletteId)) {
						//// drop node over link
						if (config.getLayoutMode() === constants.layoutMode().MANUAL) {
							//setDNDDropOnLinkPipes(link);
							var dropLevelIdx = flowUtils.getLevelIndexAtPoint(dropPoint, _flowLayout.getLevels()),
								dropLaneIdx = flowUtils.getLaneIndexAtPoint(dropPoint, _flowLayout.getLanes()),
								dropLevelPipeIdx = flowUtils.getLevelPipeIndexAtPoint(dropPoint, _flowLayout.getLevelPipes()),
								dropLanePipeIdx = flowUtils.getLanePipeIndexAtPoint(dropPoint, _flowLayout.getLanePipes());
							container = getInnerContainerAtPoint(dropPoint);
							if (container) {
								console.log("REJECTED: DROP ON CONTAINER: "+container.getName());
								// TODO: CONTAINER ???
								self.resetDrag();
								return;
							}
							_manager.getFlowController().insertNodeOnDropOverLink(
								_draggedFlowType,
								_manager.getNodeNamesMap(),
								link,
								dropLevelIdx,
								dropLaneIdx,
								dropLevelPipeIdx,
								dropLanePipeIdx,
								acceptingCell);
							doRefresh = true;
						} else {
							//_manager.getFlowController().addNodeOnDropOverLink(
							//	_draggedFlowType,
							//	_manager.getNodeNamesMap(),
							//	link);
						}
					} else {
						// elsewhere
						if (config.getLayoutMode() === constants.layoutMode().MANUAL) {
							if (acceptingCell) {
								container = getInnerContainerAtPoint(dropPoint);
								_manager.getFlowController().addNodeOnCell(
									_draggedFlowType,
									_manager.getNodeNamesMap(),
									acceptingCell,
									container);
							} else {
								setDNDDropPipes(dropPoint, _draggedFlowType);
								if (_dropLevelPipeIdx > -1 || _dropLanePipeIdx > -1) {
									var newNodeLevel = getDropNodeLevel(dropPoint, _draggedFlowType);
									var newNodeLane = getDropNodeLane(dropPoint, _draggedFlowType);
									container = getInnerContainerAtPoint(dropPoint);
									if (container) {
										console.log("REJECTED: DROP ON CONTAINER: "+container.getName());
										// TODO: CONTAINER ???
										self.resetDrag();
										return;
									}
									_manager.getFlowController().insertNodeOnDropOnPipe(
										_draggedFlowType,
										_manager.getNodeNamesMap(),
										newNodeLevel,
										newNodeLane,
										_dropLevelPipeIdx,
										_dropLanePipeIdx);
								}
							}
							doRefresh = true;
						} else {
							// AUTO
							//_manager.getFlowController().addNodeByType(
							//	_draggedFlowType,
							//	_manager.getNodeNamesMap());
						}
					}
					//
				} else if (!_resizeRect && _draggedNode && _footprintNode) {
					//// NODE //// MANUAL ONLY
					// move-insert(drop on link) for no-linked nodes only: as for gallery
					if (acceptingCell) {
						var currentCell = _flowLayout.getCellForNode(_draggedNode);
						container = getInnerContainerAtPoint(dropPoint);
						_manager.getFlowController().moveNodeToNewCell(_draggedNode, currentCell, acceptingCell, container);
						_draggedNode.setVisible(false);
						doRefresh = true;
					} else {
						setDNDDropPipes(dropPoint, _draggedNode.getFlowType());
						if (_dropLevelPipeIdx > -1 || _dropLanePipeIdx > -1) {
							var newLevel = getDropNodeLevel(dropPoint, _draggedNode.getFlowType()),
								newLane =  getDropNodeLane(dropPoint, _draggedNode.getFlowType());
							// TODO: CONTAINER ???
							container = getInnerContainerAtPoint(dropPoint);
							if (container) {
								console.log("REJECTED: DROP ON PIPE: "+container.getName());
								// TODO: CONTAINER ???
								self.resetDrag();
								return;
							}
							_manager.getFlowController().moveNodeToPipe(
								_footprintNode,
								_draggedNode,
								newLevel,
								newLane,
								_dropLevelPipeIdx,
								_dropLanePipeIdx);
							_draggedNode.setVisible(false);
							doRefresh = true;
						}
					}
				} else if (_resizeRect && _draggedNode) {

					var values = diagramUtils.getResizeValues(_resizeRect.getOrientation(), dropPoint, _startPoint);
					_modelHandler.setNodeResize(_draggedNode, values.resizeW, values.resizeH);
					// this is obsolete:
					//_manager.getFlowController().resizeNodeToValues(_draggedNode, values.resizeW, values.resizeH);

					doRefresh = true;
				} else if (_draggedPort) {
					//// PORT //// OK
					_acceptingPort = _tracker.getDragMode() === constants.dragMode().LINK_PORT ?
						_tracker.getAcceptingPortForPoint3(
							_draggedPort, dropPoint, _movedLink.getOtherSidePort(_draggedPort)) :
						_tracker.getAcceptingPortForPoint2(_draggedPort, dropPoint);
					if (_acceptingPort) {
						if (_tracker.getDragMode() === constants.dragMode().LINK_PORT && _movedLink != null) {
							if (_acceptingPort === _draggedPort) {
								self.resetDrag();
							} else {
								_manager.getFlowController().moveLinkPort(
									_movedLink,
									_draggedPort,
									_acceptingPort);
							}
						} else {
							_manager.getFlowController().addLink(_draggedPort, _acceptingPort);
						}
						doRefresh = true;
					}
				} else if (_draggedLink && !_draggedCorner) {
					//// SEGMENT ////
					var dropPipe;
					if (_sgmPipe.getType() === constants.pipeType().LEVEL_PIPE) {
						dropPipe = _dropLevelPipe ? flowUtils.getLevelPipeAtPoint(dropPoint, _flowLayout.getLevelPipes()) : undefined;
					} else if (_sgmPipe.getType() === constants.pipeType().LANE_PIPE) {
						dropPipe = _dropLanePipe ? flowUtils.getLanePipeAtPoint(dropPoint, _flowLayout.getLanePipes()) : undefined;
					}
					if (dropPipe && dropPipe.getOrder() != _sgmPipe.getOrder() &&
						_tracker.isSegmentDropOnPipeAllowed(
							_draggedLink, _draggedSegment, _sgmStartPnt.multiplyBy(factor), _sgmEndPnt.multiplyBy(factor), _sgmPipe, dropPipe)) {
						var shift = dropPipe.getOrder() - _sgmPipe.getOrder();
						_manager.getFlowController().processSegmentShift(_draggedLink, _draggedSegment.getOrder(), shift);
						doRefresh = true;
					}

				} else if (_draggedCorner) {
					//// LINK CORNER ////
					var dropLevelPipe = flowUtils.getLevelPipeAtPoint(dropPoint, _flowLayout.getLevelPipes()),
						dropLanePipe = flowUtils.getLanePipeAtPoint(dropPoint, _flowLayout.getLanePipes());
					if (dropLevelPipe && dropLanePipe) {
						var xing = new PipeCrossing(dropLevelPipe.getOrder(), dropLanePipe.getOrder(), _flowLayout);
						xing.setXCorner(_draggedCorner);
						//console.log("DROP: "+xing.printPipeXing());
						_manager.getFlowController().insertForcedCorner(_draggedLink, xing);
						doRefresh = true;
					}
				}

				self.resetDrag();
				if (doRefresh) {
					_manager.refreshDiagramOnEdit();
				} else {
					_manager.getCaller().updateWindow();
					_manager.paintDiagram();
				}
			};

			self.getSelectionRectangle = function() { return _selectionRect; };
			self.resetSelectionRectangle = function() { _selectionRect = undefined; };

			self.resetDrag = function() {
				_isDragging = false;
				_draggedFlowType = undefined;
				_draggingPoint = undefined;
				_draggedPort = undefined;
				_firstDragOK = false;
				_cellsAcceptingDrop = [];
				if (_movedLink) {
					_movedLink.setVisible(true);
					// TODO
					//_editor.getSelectionManager().addToSelections(_movedLink);
					_movedLink = undefined;
				}
				if (_startPort) {
					_startPort.setVisible(true);
					_startPort = undefined;
				}
				if (_acceptingPort) {
					_acceptingPort.setDragMode(constants.dragMode().NONE);
				}
				_acceptingPort = undefined;
				_draggingNodeType = undefined;
				//updateTransferableObject(false);
				if (_draggedNode) {
					_draggedNode.setDrawState(constants.drawState().IN_LAYOUT);
					if (_footprintNode) {
						_draggedNode.setLocationOnDrag(_footprintNode.x, _footprintNode.y);
					}
				}
				//if (_draggedLink && !_draggedCorner) {
				if (_draggedLink) {
					_draggedLink.setDrawMode(constants.drawMode().SEGMENTS);
					_draggedLink.resetSelectedSegments();
					if (_draggedSegment) {
						_draggedSegment.setStartPoint(_sgmStartPnt.x, _sgmStartPnt.y);
						_draggedSegment.setEndPoint(_sgmEndPnt.x, _sgmEndPnt.y);
						_draggedSegment = undefined;
					}
					_draggedLink = undefined;
					_sgmPipe = undefined;
					if (_draggedCorner) {
						_draggedCorner = undefined;
						_originLinkPoint = undefined;
					}
				}
				//if (_draggedCorner) {
				//	_draggedCorner = undefined;
				//	_originLinkPoint = undefined;
				//}
				_draggedNode = undefined;
				_draggedNodeContainer = undefined;
				_footprintNode = undefined;
				//clearDropZones();
				_dropLevelPipe = undefined;
				_dropLevelPipeIdx = -1;
				_dropLanePipe = undefined;
				_dropLanePipeIdx = -1;
				_tracker.clearTracking();
				//_manager.getSelectionManager().clearSelections();
				_manager.getCaller().setTooltipBox("");
				_doScroll = false;
				_doSelect = false;
				_manager.resetHighlights();
				_manager.getCaller().setTooltipBox("");
				//config.setShowRefHandles(_hasRefHandles);
				repaint();
			};

			function repaint() {
				//self.drawAcceptingLocations();
				_manager.paintDiagram();
				paintDND();
			}

			function paintDND() {
				var ctx = _context,
					factor = config.getScale(),
					dragIcon;
				ctx.save();
				if (_tracker.getDragMode() === constants.dragMode().SELECT) {
					//console.log("++ start select draw: "+Date.now());
					var rect = getSelectionRect();
					draw.paintRectangle(ctx, rect, constants.colors().DRAG_FILL, constants.colors().DRAG_BORDER, 1, 0.4);
					//console.log("-- end * select draw: "+Date.now());
				} else if (_tracker.getDragMode() === constants.dragMode().MARKUP_PORT ||
						_tracker.getDragMode() === constants.dragMode().REF_PORT) {
					ctx.lineWidth = 2;
					ctx.setLineDash([0, 0]);
					ctx.strokeStyle = constants.colors().DND_LINE;
					ctx.beginPath();
					ctx.moveTo(_startAttachmentPoint.x * factor, _startAttachmentPoint.y * factor);
					ctx.lineTo(_draggingPoint.x, _draggingPoint.y);
					ctx.stroke();
					dragIcon = _draggedPort.getIcon();
					ctx.drawImage(dragIcon, _draggingPoint.x-6, _draggingPoint.y-6);
				} else if (_tracker.getDragMode() === constants.dragMode().LINK_PORT) {
					if (_draggedPort && _draggingPoint) {
						var refPnt = config.getLinkStyle() === constants.linkStyle().DOUBLE_ARROW ?
							_draggedPort.getAttachmentPoint() : _draggedPort.getConnectionPoint();
						ctx.lineWidth = 2;
						if (_draggedPort.getType() === constants.portType().LINK_REF) {
							ctx.setLineDash([4,2]);
						} else {
							ctx.setLineDash([0,0]);
						}
						ctx.strokeStyle = constants.colors().DND_LINE;
						ctx.beginPath();
						ctx.moveTo(refPnt.x * factor, refPnt.y * factor);
						ctx.lineTo(_draggingPoint.x, _draggingPoint.y);
						ctx.stroke();
						dragIcon = _startPort.getIcon();
						ctx.drawImage(dragIcon, _draggingPoint.x-6, _draggingPoint.y-6);
					}
				}
				ctx.restore();
			}

			function getSelectionRect() {
				var factor = config.getScale(),
					sx = Math.min(_startPoint.x, _draggingPoint.x), // * factor,
					sy = Math.min(_startPoint.y, _draggingPoint.y), // * factor,
					sw = Math.abs(sx - Math.max(_startPoint.x, _draggingPoint.x)),
					sh = Math.abs(sy - Math.max(_startPoint.y, _draggingPoint.y));
				return new Rectangle(sx, sy, sw, sh);
			}

			function isDropAllowed(point) {
				var acceptingCell = self.getAcceptingCellAtPoint(point);
				if (acceptingCell) {
					return true;
				} else {
					setDNDDropPipes(point, _draggedFlowType);
					if (_dropLevelPipeIdx > -1 || _dropLanePipeIdx > -1) {
						return true;
					}
				}
				return false;
			}

			self.drawAcceptingLocations = function(ctx) {
				var isPainted = false,
					factor = config.getScale();
				if (config.getLayoutMode() == constants.layoutMode().MANUAL &&
					(_tracker.getDragMode() === constants.dragMode().NODE ||
					 _tracker.getDragMode() === constants.dragMode().GALLERY)) {

					var rects = getAcceptingCells(_draggingPoint);
					paintRectangles(ctx, rects, constants.colors().EMPTY_CELL);

					var cell = self.getAcceptingCellAtPoint(_draggingPoint);
					if (cell) {
						paintDnDRectangle(ctx, cell, constants.colors().ACCEPT_DROP_COLOR);
					}
					// corridors for gallery drag only
					if (!_draggedNode && _draggedFlowType) {
						if (_dropLevelPipe) {
							paintDnDRectangle(ctx, _dropLevelPipe, constants.colors().ACCEPT_DROP_COLOR, .8);
						}
						if (_dropLanePipe) {
							paintDnDRectangle(ctx, _dropLanePipe, constants.colors().ACCEPT_DROP_COLOR, .8);
						}
					} else if (_draggedNode &&
						!_draggedNodeContainer &&
						!getInnerContainerAtPoint(_draggingPoint) &&
						config.hasEnableAddCorridors()) {
						// DRAG NODE
						if (_dropLevelPipe) {
							paintDnDRectangle(ctx, _dropLevelPipe, constants.colors().ACCEPT_DROP_COLOR, .8);
							isPainted = true;
						}
						if (_dropLanePipe) {
							paintDnDRectangle(ctx, _dropLanePipe, constants.colors().ACCEPT_DROP_COLOR, .8);
							isPainted = true;
						}
					}
				} else if (config.getLayoutMode() == constants.layoutMode().MANUAL &&
						_tracker.getDragMode() === constants.dragMode().NONE &&
						config.hasEnableAddCorridors()) {
					// MENUS
					// show on mouse move when insert/remove level/lane is enabled, no drag
					var menuPoint = _manager.getFlowDiagram().getMousePoint();
					if (menuPoint) {
						setPipesForMenus(menuPoint);
						if (_dropLevelPipe) {
							paintDragOverRectangle(ctx, _dropLevelPipe, .8);
							isPainted = true;
						}
						if (_dropLanePipe) {
							paintDragOverRectangle(ctx, _dropLanePipe, .8);
							isPainted = true;
						}
						// highlite level/lane to remove
						var level = flowUtils.getLevelAtPoint(menuPoint, _flowLayout.getLevels()),
							minLevelNum = flowUtils.getMinLevelNumber(),
							maxLevelNum = flowUtils.getMaxLevelNumber(_flowLayout);
						paintDnDRectangle(ctx, level, constants.colors().EMPTY_CORRIDOR, .8);
						var lane = flowUtils.getLaneAtPoint(menuPoint, _flowLayout.getLanes()),
							minLaneNum = flowUtils.getMinLaneNumber(),
							maxLaneNum = flowUtils.getMaxLaneNumber(_flowLayout);
						paintDnDRectangle(ctx, lane, constants.colors().EMPTY_CORRIDOR, .8);
						// draw borders only
						paintDnDRectangle(ctx, level, null, .8);
						// this is not needed at this point
						var menuCell = self.getAcceptingCellAtPoint(menuPoint);
						if (menuCell) {
							//paintDnDRectangle(ctx, menuCell, constants.colors().EMPTY_CELL);
							isPainted = true;
						}
					}
				} else if (_tracker.getDragMode() === constants.dragMode().SEGMENT) {
					setPipesForMenus(_draggingPoint);
					var pipes = _tracker.getAcceptingPipes(
						_draggedLink, _draggedSegment, _sgmStartPnt.multiplyBy(factor), _sgmEndPnt.multiplyBy(factor), _sgmPipe);
					paintRectangles(ctx, pipes, constants.colors().EMPTY_CELL);
					if (_sgmPipe.getType() === constants.pipeType().LEVEL_PIPE) {

						if (_dropLevelPipe && _dropLevelPipe.getOrder() !== _sgmPipe.getOrder() &&
							_tracker.isSegmentDropOnPipeAllowed(
								_draggedLink, _draggedSegment, _sgmStartPnt.multiplyBy(factor), _sgmEndPnt.multiplyBy(factor), _sgmPipe, _dropLevelPipe)) {
							paintDnDRectangle(ctx, _dropLevelPipe, constants.colors().ACCEPT_DROP_COLOR);
						}
					} else if (_sgmPipe.getType() === constants.pipeType().LANE_PIPE) {
						if (_dropLanePipe && _dropLanePipe.getOrder() !== _sgmPipe.getOrder() &&
							_tracker.isSegmentDropOnPipeAllowed(
								_draggedLink, _draggedSegment, _sgmStartPnt.multiplyBy(factor), _sgmEndPnt.multiplyBy(factor), _sgmPipe, _dropLanePipe)) {
							paintDnDRectangle(ctx, _dropLanePipe, constants.colors().ACCEPT_DROP_COLOR);
						}
					}
					isPainted = true;
				} else if (_tracker.getDragMode() === constants.dragMode().LINK_POINT) {
					paintRectangles(ctx, _crossings, constants.colors().EMPTY_CELL);
					var r4pnt = flowUtils.getRectangleAtPoint(_draggingPoint, _crossings);
					if (r4pnt) {
						paintDnDRectangle(ctx, r4pnt, constants.colors().PIPE_DROP);
					}
					isPainted = true;
				}
				return isPainted;
			};

			function paintDragOverRectangle(ctx, rect, alpha) {
				draw.paintRectangle(ctx, rect, constants.colors().EMPTY_CORRIDOR, constants.colors().GRID, 1, alpha ? alpha : 1);
			}

			function paintDnDRectangle(ctx, rect, color, alpha) {
				draw.paintRectangle(ctx, rect, color, constants.colors().GRID, 1, alpha ? alpha : 1);
			}

			function paintRectangles(ctx, rects, color, alpha) {
				for (var i = 0; i < rects.length; i++) {
					draw.paintRectangle(ctx, rects[i], color, constants.colors().GRID, 1, alpha ? alpha : 1);
				}
			}

			// include expanded container
			function getNodeAtPoint(point) {
				var nodes = _manager.getModelHandler().getFlowNodes();
				var node = flowUtils.getInsideNodeAtPoint(nodes, point);
				if (node) {
					return node;
				}
				return dndUtils.getContainerAtPoint(nodes, point);
			}

			function getInnerContainerAtPoint(point) {
				var nodes = _manager.getModelHandler().getFlowNodes();
				return flowUtils.getInnermostContainerAtPoint(nodes, point);
			}

			function getPortAtPoint(point) {
				var nodes = _manager.getModelHandler().getFlowNodes();
				return dndUtils.getPortAtPoint(nodes, point);
			}

			function getLinkAtPoint(point) {
				var links = _manager.getModelHandler().getFlowLinks();
				return dndUtils.getLinkAtPoint(links, point);
			}

			//function getSegmentsAtPoint(point) {
			//	var link = getLinkAtPoint(point);
			//	if (link) {
			//		var segments = link.getSegmentsAtPoint(point);
			//		if (segments.length === 1) {
			//			if (link.isSelectionForEdit(segments[0], point)) {
			//				return segments;
			//			} else {
			//				return [];
			//			}
			//		} else {
			//			return segments;
			//		}
			//	}
			//	//return link ? link.getSegmentsAtPoint(point) : undefined;
			//	return undefined;
			//}

			//function highlightLinkAtPoint(point) {
			//	var links = _manager.getFlowDiagram().getFlowLinks();
			//	for (var i = 0; i < links.length; i++) {
			//		if (!links[i].hasSegmentShifts()) {
			//			links[i].highlightOnMouseMove(point);
			//		}
			//	}
			//}

			function getAcceptingCells(point) {
				if (_cellsAcceptingDrop.length === 0) {
					_cellsAcceptingDrop = calculateAcceptingCells(point);
				}
				return _cellsAcceptingDrop;
			}

			function calculateAcceptingCells(point) {
				var acceptingCells = [], i;
				var cells = _flowLayout.getEmptyCells(),
					nodeCells = _flowLayout.getNodeCells();
				for (i = 0; i < cells.length; i++) {
					if (isCellAcceptingDrop(cells[i].getLevelNumber(), cells[i].getLaneNumber())) {
						acceptingCells.push(cells[i]);
					}
				}
				for (i = 0; i < nodeCells.length; i++) {
					if (!nodeCells[i].getNode().isVisible() && nodeCells[i].getNode().getFlowType() !== constants.flowType().CONTAINER) {
						acceptingCells.push(nodeCells[i]);
					}
				}
				if (point) {
					if (_tracker.getDragMode() !== constants.dragMode().GALLERY) {
						if (_draggedNodeContainer) {
							acceptingCells = flowUtils.getCellsInsideContainer(
								_draggedNodeContainer, acceptingCells, flowUtils.allowDropToStartLevel(_draggedFlowType));
						} else {
							acceptingCells = flowUtils.getCellsOutsideContainers(
								_modelHandler.getFlowNodes(), acceptingCells);
						}
					} else {
						acceptingCells = flowUtils.getAllDropCellsByTypeRestriction(
							acceptingCells, _modelHandler.getFlowNodes(), flowUtils.allowDropToStartLevel(_draggedFlowType));
					}
				}
				return acceptingCells;
			}

			self.getAcceptingCellAtPoint = function(point) {
				if (_draggedFlowType === constants.flowType().CONTAINER) {
					var container = getInnerContainerAtPoint(point);
					if (container && container.getContainerReference()) {
						return undefined;
					}
				}
				var cells, i;
				if (_tracker.getDragMode() === constants.dragMode().NODE ||
					_tracker.getDragMode() === constants.dragMode().GALLERY) {
					cells = getAcceptingCells(point);
				} else if (_tracker.getDragMode() === constants.dragMode().NONE) {
					cells = getUsableCells();
				}
				if (!cells) {
					// call out of context
					return undefined;
				}
				if (cells) {
					for (i = 0; i < cells.length; i++) {
						if (cells[i].hasPointInside(point)) {
							return cells[i];
						}
					}
				}
				var nodeCells = _flowLayout.getNodeCells();
				if (nodeCells) {
					nodeCells = flowUtils.getNodeCellsByTypeRestriction(
						nodeCells, _modelHandler.getFlowNodes(),flowUtils.allowDropToStartLevel(_draggedFlowType));
					for (i = 0; i < nodeCells.length; i++) {
						//if (!nodeCells[i].getNode().isVisible() && nodeCells[i].hasPointInside(point)) {
						if (!nodeCells[i].getNode().isVisible() &&
							!hasAnotherNodeAtLocation(nodeCells[i].getNode(), nodeCells[i].getLevelNumber(), nodeCells[i].getLaneNumber()) &&
							nodeCells[i].hasPointInside(point)) {
							return nodeCells[i];
						}
					}
				}
				return undefined;
			};

			function hasAnotherNodeAtLocation(cellNode, levelNum, laneNum) {
				var nodes = _manager.getModelHandler().getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].equals(cellNode)) {
						continue;
					}
					if (nodes[i].getLevelNumber() === levelNum && nodes[i].getLaneNumber() === laneNum && nodes[i].isVisible()) {
						return true;
					}
				}
				return false;
			}

			function getUsableCells() {
				// exclude corner cells
				var cells = [],
					allCells = _flowLayout.getEmptyCells(),
					maxLevelIdx = _flowLayout.getLevels().length- 1,
					maxLaneIdx = _flowLayout.getLanes().length- 1,
					excludeCorners = config.hasSideSwimLanes() && config.hasStartEndLevels();
				for (var i = 0; i < allCells.length; i++) {
					var levelNum = allCells[i].getLevelNumber(),
						laneNum = allCells[i].getLaneNumber();
					if (excludeCorners &&
						(levelNum === 0 && laneNum === 0 ||
						levelNum === 0 && laneNum === maxLaneIdx ||
						levelNum === maxLevelIdx && laneNum === 0 ||
						levelNum === maxLevelIdx && laneNum === maxLaneIdx)
						) {
						continue;
					}
					cells.push(allCells[i]);
				}
				return cells;
			}

			function isCellAcceptingDrop(levelNum, laneNum) {
				var maxLevelIdx = _flowLayout.getLevels().length- 1,
					maxLaneIdx = _flowLayout.getLanes().length-1;

				if (_draggedNode && _draggedNode.getFlowType() === constants.flowType().START ||
					_draggedFlowType === constants.flowType().START) {
					// first level is always ok, no matter hasStartEndLanes()
					return levelNum === 0 && config.hasStartEndLevels() &&
						(!config.hasSideSwimLanes() || laneNum > 0 && laneNum < maxLaneIdx);
				} else if (_draggedNode &&_draggedNode.getFlowType() === constants.flowType().END ||
					_draggedFlowType === constants.flowType().END) {
					// last level is always ok, no matter hasStartEndLanes()
					return levelNum === maxLevelIdx && config.hasStartEndLevels() &&
						(!config.hasSideSwimLanes() || laneNum > 0 && laneNum < maxLaneIdx);
				} else if (
					(_draggedNode && _draggedNode.getFlowType() === constants.flowType().PROCESS ||
					_draggedFlowType === constants.flowType().PROCESS)
					||
					(_draggedNode && _draggedNode.getFlowType() === constants.flowType().IN_OUT ||
					_draggedFlowType === constants.flowType().IN_OUT)
					||
					(_draggedNode && _draggedNode.getFlowType() === constants.flowType().CONTAINER ||
					_draggedFlowType === constants.flowType().CONTAINER)
					||
					(_draggedNode && _draggedNode.getFlowType() === constants.flowType().SWITCH ||
					_draggedFlowType === constants.flowType().SWITCH)
					||
					(_draggedNode && _draggedNode.getFlowType() === constants.flowType().TEXT ||
					_draggedFlowType === constants.flowType().TEXT)
					||
					(_draggedNode && _draggedNode.getFlowType() === constants.flowType().ENDPOINT ||
					_draggedFlowType === constants.flowType().ENDPOINT)
					||
					(_draggedNode && _draggedNode.getFlowType() === constants.flowType().DECISION ||
					_draggedFlowType === constants.flowType().DECISION)) {
					if (config.hasStartEndLevels()) {
						return levelNum > 0 && levelNum < maxLevelIdx &&
							(!config.hasSideSwimLanes() || laneNum > 0 && laneNum < maxLaneIdx);
					} else {
						return !config.hasSideSwimLanes() || laneNum > 0 && laneNum < maxLaneIdx;
					}
				} else if (_draggedNode &&_draggedNode.getFlowType() === constants.flowType().LEFT_TOP ||
					_draggedFlowType === constants.flowType().LEFT_TOP) {
					return config.hasSideSwimLanes() && laneNum == 0 &&
						(!config.hasStartEndLevels() || levelNum > 0 && levelNum < maxLevelIdx);
				} else if (_draggedNode &&_draggedNode.getFlowType() === constants.flowType().RIGHT_BOTTOM ||
					_draggedFlowType === constants.flowType().RIGHT_BOTTOM) {
					return config.hasSideSwimLanes() && laneNum == maxLaneIdx &&
						(!config.hasStartEndLevels() || levelNum > 0 && levelNum < maxLevelIdx);
				}
				return false;
			}

			function setDNDDropOnLinkPipes(link) {
				var srcPort = link.getSourcePort(),
					srcNode = srcPort.getNode(),
					srcLevel = srcNode.getLevelNumber(),
					srcLane  = srcNode.getLaneNumber();

				var trgPort = link.getTargetPort(),
					trgNode = trgPort.getNode(),
					trgLevel = trgNode.getLevelNumber(),
					trgLane  = trgNode.getLaneNumber();

				if (srcLevel > trgLevel) { // 1
					_dropLevelPipeIdx = trgLevel+1;
					_dropLanePipeIdx = -1;
					_dropOnLinkLevelIdx = trgLevel+1;
					if (srcLane > trgLane) { // 1-1
						_dropOnLinkLaneIdx = trgLane+1;
					} else if (srcLane < trgLane) { // 1-2
						_dropOnLinkLaneIdx = srcLane+1;
					} else { // srcLane == trgLane  1-3
						_dropOnLinkLaneIdx = srcLane;
					}
				} else if (srcLevel < trgLevel) { // 2
					_dropLevelPipeIdx = srcLevel+1;
					_dropLanePipeIdx = -1;
					_dropOnLinkLevelIdx = srcLevel+1;
					if (srcLane > trgLane) { // 2-1
						_dropOnLinkLaneIdx = trgLane+1;
					} else if (srcLane < trgLane) { // 2-2
						_dropOnLinkLaneIdx = srcLane+1;
					} else { // srcLane == trgLane  2-3
						_dropOnLinkLaneIdx = srcLane;
					}
				} else { // srcLevel == trgLevel 3
					_dropLevelPipeIdx = -1;
					_dropOnLinkLevelIdx = srcLevel;
					if (srcLane > trgLane) { // 3-1
						_dropLanePipeIdx = trgLane+1;
						_dropOnLinkLaneIdx = trgLane+1;
					} else if (srcLane < trgLane) { // 3-2
						_dropLanePipeIdx = srcLane+1;
						_dropOnLinkLaneIdx = srcLane+1;
					} else { // srcLane == trgLane  3-3
						_dropLanePipeIdx = srcLane+1;
						_dropOnLinkLaneIdx = srcLane+1;
					}
				}
			}

			function setPipesForMenus(menuPoint) {
				var levelPipes = _flowLayout.getLevelPipes(),
					lanePipes = _flowLayout.getLanePipes();

				var minLevelIdx = flowUtils.getMinLevelNumber(); //config.hasStartEndLevels() ? 1: 0;
				var maxLevelIdx = flowUtils.getMaxLevelNumber(_flowLayout); //_flowLayout.getLevelPipes().length-1;

				var minLaneIdx = flowUtils.getMinLaneNumber(); //config.hasSideSwimLanes() ? 1 : 0;
				var maxLaneIdx = flowUtils.getMaxLaneNumber(_flowLayout); //_flowLayout.getLanePipes().length-1;

				_dropLevelPipe = flowUtils.getRectangleAtPoint(menuPoint, levelPipes);
				var levelPipeIdx = _dropLevelPipe ? _dropLevelPipe.getOrder() : -1;
				if (levelPipeIdx < minLevelIdx || levelPipeIdx > maxLevelIdx+1) {
					_dropLevelPipe = undefined;
				}

				_dropLanePipe =  flowUtils.getRectangleAtPoint(menuPoint, lanePipes);
				var lanePipeIdx = _dropLanePipe ? _dropLanePipe.getOrder() : -1;
				if (lanePipeIdx < minLaneIdx || lanePipeIdx > maxLaneIdx+1) {
					_dropLanePipe = undefined;
				}
			}

			function setDNDDropPipes(dropPoint, dragFlavor) {
				var levels = _flowLayout.getLevels(),
					levelPipes = _flowLayout.getLevelPipes(),
					lanes = _flowLayout.getLanes(),
					lanePipes = _flowLayout.getLanePipes();

				_dropLevelPipe = flowUtils.getRectangleAtPoint(dropPoint, levelPipes);
				_dropLevelPipeIdx = _dropLevelPipe ? _dropLevelPipe.getOrder() : -1;

				_dropLanePipe =  flowUtils.getRectangleAtPoint(dropPoint, lanePipes);
				_dropLanePipeIdx = _dropLanePipe ? _dropLanePipe.getOrder() : -1;

				var level = flowUtils.getRectangleAtPoint(dropPoint, levels);
				var levelIdx = level ? level.getOrder() : -1;

				var lane =  flowUtils.getRectangleAtPoint(dropPoint, lanes);
				var laneIdx = lane ? lane.getOrder() : -1;

				// exclude some cases
				var excludeLevelPipe = false;
				var excludeLanePipe = false;

				var maxLevelIdx = flowUtils.getMaxLevelNumber(_flowLayout); //_flowLayout.getLevelPipes().length-1;
				var maxLaneIdx = flowUtils.getMaxLaneNumber(_flowLayout); //_flowLayout.getLanePipes().length-1;

				var minLevelIdx = flowUtils.getMinLevelNumber(); //config.hasStartEndLevels() ? 1: 0;
				var minLaneIdx = flowUtils.getMinLaneNumber(); //config.hasSideSwimLanes() ? 1 : 0;

				if (dragFlavor === constants.flowType().START) {
					excludeLevelPipe = true;
					if (!config.hasStartEndLevels()) {
						excludeLanePipe = true;
					} else if (levelIdx != 0) {
						excludeLanePipe = true;
					} else {  // levelPipe == 0
						if (config.hasSideSwimLanes() &&
							(_dropLanePipeIdx < minLaneIdx || _dropLanePipeIdx > maxLaneIdx+1)) {
							excludeLanePipe = true;
						}
					}
				} else if (dragFlavor === constants.flowType().END) {
					excludeLevelPipe = true;
					if (!config.hasStartEndLevels()) {
						excludeLanePipe = true;
					} else if (levelIdx != maxLevelIdx+1) {
						excludeLanePipe = true;
					} else { // levelPipe == maxLevelPipeIdx
						if (config.hasSideSwimLanes() &&
							(_dropLanePipeIdx < minLaneIdx || _dropLanePipeIdx > maxLaneIdx+1)) {
							excludeLanePipe = true;
						}
					}
				} else if (dragFlavor === constants.flowType().PROCESS ||
					dragFlavor === constants.flowType().CONTAINER ||
					dragFlavor === constants.flowType().SWITCH ||
					dragFlavor === constants.flowType().ENDPOINT ||
					dragFlavor === constants.flowType().TEXT ||
					dragFlavor === constants.flowType().DECISION ||
					dragFlavor === constants.flowType().IN_OUT) {

					if (config.hasStartEndLevels() &&
						(_dropLevelPipeIdx == 0 || _dropLevelPipeIdx > maxLevelIdx+1)) {
						excludeLevelPipe = true;
						excludeLanePipe = true;
					}
					if (config.hasSideSwimLanes() &&
						(_dropLanePipeIdx == 0 || _dropLanePipeIdx > maxLaneIdx+1)) {
						excludeLevelPipe = true;
						excludeLanePipe = true;
					}

				} else if (dragFlavor === constants.flowType().LEFT_TOP) {
					excludeLanePipe = true;
					if (!config.hasSideSwimLanes()) { // || _dropLanePipeIdx != 0) {
						excludeLevelPipe = true;
					} else if (laneIdx != 0) {
						excludeLevelPipe = true;
					} else {
						if (config.hasStartEndLevels() &&
							(_dropLevelPipeIdx < minLevelIdx || _dropLevelPipeIdx > maxLevelIdx+1)) {
							excludeLevelPipe = true;
						}
					}
				} else if (dragFlavor === constants.flowType().RIGHT_BOTTOM) {
					excludeLanePipe = true;
					if (!config.hasSideSwimLanes()) { // || _dropLanePipeIdx <= maxLaneIdx) {
						excludeLevelPipe = true;
					} else if (laneIdx != maxLaneIdx+1) {
						excludeLevelPipe = true;
					} else {
						if (config.hasStartEndLevels() &&
							(_dropLevelPipeIdx < minLevelIdx || _dropLevelPipeIdx > maxLevelIdx+1)) {
							excludeLevelPipe = true;
						}
					}
				}
				if (excludeLevelPipe) {
					_dropLevelPipe = undefined;
					_dropLevelPipeIdx = -1;
				}
				if (excludeLanePipe) {
					_dropLanePipe = undefined;
					_dropLanePipeIdx = -1;
				}
			}

			function getLevelAtDrop(dropPoint) {

			}
			/////
			function getDropNodeLevel(dropPoint, dragFlavor) {
				var minLevelIdx = config.hasStartEndLevels() ? 1: 0,
					maxLevelIdx = config.hasStartEndLevels() ?
						_flowLayout.getLevels().length-2 :
						_flowLayout.getLevels().length- 1,
					dropNodeLevel = -1;

				if (dragFlavor == constants.flowType().START) {
					dropNodeLevel = 0;
				} else if (dragFlavor == constants.flowType().END) {
					dropNodeLevel = _flowLayout.getLevels().length-1;
				} else if (dragFlavor == constants.flowType().PROCESS ||
						dragFlavor === constants.flowType().CONTAINER ||
						dragFlavor === constants.flowType().TEXT ||
						dragFlavor === constants.flowType().ENDPOINT ||
						dragFlavor == constants.flowType().DECISION ||
						dragFlavor == constants.flowType().SWITCH ||
						dragFlavor == constants.flowType().IN_OUT) {
					if (_dropLevelPipeIdx > -1) {
						dropNodeLevel = _dropLevelPipeIdx;
					} else {
						var levelIdx = flowUtils.getLevelIndexAtPoint(dropPoint, _flowLayout.getLevels());
						dropNodeLevel = levelIdx >= minLevelIdx && levelIdx <= maxLevelIdx ?
							levelIdx : minLevelIdx;
					}
				} else if (dragFlavor == constants.flowType().LEFT_TOP ||
						dragFlavor == constants.flowType().RIGHT_BOTTOM) {
					dropNodeLevel = _dropLevelPipeIdx;
				}
				return dropNodeLevel;
			}

			function getDropNodeLane(dropPoint, dragFlavor) {
				var minLaneIdx = config.hasSideSwimLanes() ? 1 : 0,
					maxLaneIdx = config.hasSideSwimLanes() ?
						_flowLayout.getLanes().length-2 :
						_flowLayout.getLanes().length- 1,
					dropNodeLane = -1;

				if (dragFlavor == constants.flowType().START ||
						dragFlavor == constants.flowType().END) {
					dropNodeLane = _dropLanePipeIdx;
				} else if (dragFlavor === constants.flowType().PROCESS ||
						dragFlavor === constants.flowType().CONTAINER ||
						dragFlavor === constants.flowType().TEXT ||
						dragFlavor === constants.flowType().ENDPOINT ||
						dragFlavor == constants.flowType().DECISION ||
						dragFlavor == constants.flowType().SWITCH ||
						dragFlavor == constants.flowType().IN_OUT) {
					if (_dropLanePipeIdx > -1) {
						dropNodeLane = _dropLanePipeIdx;
					} else {
						var laneIdx = flowUtils.getLaneIndexAtPoint(dropPoint, _flowLayout.getLanes());
						dropNodeLane = laneIdx >= minLaneIdx && laneIdx <= maxLaneIdx ?
							laneIdx : minLaneIdx;
					}
				} else if (dragFlavor == constants.flowType().LEFT_TOP) {
					dropNodeLane = 0;
				} else if (dragFlavor == constants.flowType().RIGHT_BOTTOM) {
					dropNodeLane = _flowLayout.getLanes().length-1;
				}
				return dropNodeLane;
			}

		}
		return DnDHandler;
	}
);