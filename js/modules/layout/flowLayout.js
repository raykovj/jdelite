define('modules/layout/flowLayout',
	['modules/geometry/rectangle',
		'modules/geometry/dimension',
		'modules/common/map',
		'modules/common/commonUtils',
		'modules/graph/cell',
		'modules/graph/gridCell',
		'modules/graph/nodeCell',
		'modules/graph/level',
		'modules/graph/levelPipe',
		'modules/graph/lane',
		'modules/graph/lanePipe',
		'modules/graph/pipeCrossing',
		'modules/graph/graphNode',
		'modules/graph/graphConstants',
		'modules/flow/flowUtils',
		'modules/graph/modelUtils',
		'modules/layout/pipeUtils',
		'modules/layout/nodesLayoutUtils',
		'modules/layout/edgesLayoutUtils',
		'modules/layout/nodesLayout',
		'modules/layout/edgesLayout',
		'modules/layout/nodesCollector',
		'modules/settings/config',
		'modules/diagram/diagramUtils'],
	function(Rectangle,
	         Dimension,
	         Map,
	         Utils,
	         Cell,
	         GridCell,
	         NodeCell,
	         Level,
	         LevelPipe,
	         Lane,
	         LanePipe,
			 PipeCrossing,
	         GraphNode,
	         constants,
			 flowUtils,
	         modelUtils,
	         PipeUtils,
			 nodesLayoutUtils,
			 edgesLayoutUtl,
			 NodesLayout,
	         EdgesLayout,
	         NodesCollector,
	         config,
			 dgmUtl) {

		function FlowLayout(flowManager) {
			var self = this;
			var DEBUG = false;

			var _pipeUtl = new PipeUtils(this),
				_flowManager = flowManager,
				_nodesCollector,
				_nonSuppressedNodes;

			self.getFlowManager = function() { return _flowManager; };
			self.getNodesCollector = function() { return _nodesCollector; };
			self.getNonSuppressedNodes = function() { return _nonSuppressedNodes; };

			self.levels = [];
			self.getLevels = function() { return self.levels; };

			self.lanes = [];
			self.getLanes = function() { return self.lanes; };

			self.levelPipes = [];
			self.getLevelPipes = function() { return self.levelPipes; };

			self.lanePipes = [];
			self.getLanePipes = function() { return self.lanePipes; };

			//self.getNodesNumberAtLevel = function(levelNum) {
			//	if (levelNum < 0 || levelNum >= self.levels.length) {
			//		return 0;
			//	}
			//	return self.levels[levelNum].getNodes().length;
			//};

			//self.getNodesNumberAtLane = function(laneNum) {
			//	if (laneNum < 0 || laneNum >= self.lanes.length) {
			//		return 0;
			//	}
			//	return self.lanes[laneNum].getNodes().length;
			//};

			self.getStartLevel = function() {
				return config.hasStartEndLevels() && self.levels.length > 0 && self.levelPipes.length > 0 ?
					self.levels[0].union(self.levelPipes[0]) :
					undefined;
			};

			self.getEndLevel = function() {
				return config.hasStartEndLevels() && self.levels.length > 0 && self.levelPipes.length > 0 ?
					self.levels[self.levels.length-1].union(self.levelPipes[self.levelPipes.length-1]) :
					undefined;
			};

			self.getLeftSwimLane = function() {
				return config.hasSideSwimLanes() && self.lanes.length > 0 && self.lanePipes.length > 0 ?
					self.lanes[0].union(self.lanePipes[0]) :
					undefined;
			};

			self.getRightSwimLane = function() {
				return config.hasSideSwimLanes() && self.lanes.length > 0 && self.lanePipes.length > 0 ?
					self.lanes[self.lanes.length-1].union(self.lanePipes[self.lanePipes.length-1]) :
					undefined;
			};


			self.nodesList = [];
			self.getNodesList = function() { return _flowManager.getModelHandler().getFlowNodes(); };

			self.edgesList = [];
			self.getEdgesList = function() { return _flowManager.getModelHandler().getFlowLinks(); };

			self.layoutSize = new Dimension(0,0);
			// set to a Dimension during the layout phases
			self.getLayoutSize = function() { return self.layoutSize; };

			self.layoutInProgress = false;
			self.isLayoutInProgress = function() { return self.layoutInProgress; };

			self.nodeToCellMap = new Map();
			self.getNodeToCellMap = function() { return self.nodeToCellMap; };

			var _finalRun = false;
			self.isFinalRun = function() { return _finalRun; };

			self.getPipesCrossings = function() {
				var rects = [],
					levelPipes = self.getLevelPipes(),
					lanePipes = self.getLanePipes(),
					minLevelPipeNum = config.hasStartEndLevels() ? 1 : 0,
					maxLevelPipeNum = config.hasStartEndLevels() ? levelPipes.length - 2 : levelPipes.length - 1,
					minLanePipeNum = config.hasSideSwimLanes() ? 1 : 0,
					maxLanePipeNum = config.hasSideSwimLanes() ? lanePipes.length - 2 : lanePipes.length - 1;
				for (var i = minLevelPipeNum; i <= maxLevelPipeNum; i++) {
					for (var j = minLanePipeNum; j <= maxLanePipeNum; j++) {
						//var r = levelPipes[i].intersection(lanePipes[j]);
						var r = new PipeCrossing(levelPipes[i].getOrder(), lanePipes[j].getOrder(), this);
						rects.push(r);
					}
				}
				return rects;
			};

			// both src and trg are either outside or in the same container
			self.getCurrentExpandedContainers = function(parentContainer) {
				return flowUtils.getExpandedContainers(_flowManager, parentContainer);
			};

			// for the purpose of edge layout
			// assuming containers includes switches
			self.getBlockedCells = function(containers) {
				var cells = [];
				//try {
					containers.forEach(function(container) {
						cells = cells.concat(container.getCellsWithVisibleNodes());
					});
				//} catch (err) {
				//	console.log("### ERROR getBlockedCells: "+err);
				//}
				return cells;
			};

			function updateExpandedContainers() {
				// TODO: call setInitialBounds on all expanded containers
			}

			//////////////////////////////

			_nodesCollector = new NodesCollector();
			var nodesLayout = new NodesLayout(this);
			var edgesLayout = new EdgesLayout(this);

			var LAYOUT_LOOPS = 10,
				OPTIMIZE_OUTER = 10,
				OPTIMIZE_INNER = 10;

			self.doLayout = function() {
				//console.log("- DO LAYOUT: nodes = "+_flowManager.getModelHandler().getFlowNodes().length);

				var startMillis = Date.now();
				document.body.style.cursor  = 'wait';
				//$("body").css("cursor", "progress");
				//$('body').addClass('waiting');
				//_nodesCollector = new NodesCollector();
				//var nodesLayout = new NodesLayout(this);
				//var edgesLayout = new EdgesLayout(this);
				_finalRun = false;

				if (DEBUG)
					console.log("========= DO LAYOUT =========");
				var kk = 0,
					proceed = true;

				while (kk < LAYOUT_LOOPS && proceed) {

					//console.log("=========== MAIN layout loop "+kk+" =========");
					proceed = false;

					self.nodesList = _flowManager.getModelHandler().getFlowNodes();
					self.edgesList = _flowManager.getModelHandler().getFlowLinks();

					// flag suppressed nodes
					nodesLayout.adjustNodesInCanvas();

					_nodesCollector.collectNodes(self.nodesList);
					_nonSuppressedNodes = _nodesCollector.getAllNodes();

					//printEdges(" **** START **** MAIN");
					//printNodes(" **** START ****", self.nodesList);
					//printNodesShort(" *** START ***", self.nodesList);
					//printNodesShort(" *** START ***", _nonSuppressedNodes);
					self.levels = [];
					self.lanes = [];
					self.levelPipes = [];
					self.lanePipes = [];
					self.nodeToCellMap.clear();

					//for (var i = 0; i < self.nodesList.length; i++) {
					//	modelUtils.adjustSize(self.nodesList[i]);
					//}

					var ii = 0, jj = 0, doOptimize = true, result;

					var resultLN = layoutNodes(nodesLayout);
					if (!resultLN) {
						console.log("############ layoutNodes FAILED");
						// TODO !!!???
					}

					//utils.printMillis("start layoutEdges");
					/////////////
					// first pass
					/////////////
					layoutEdges(edgesLayout, true);
					var dms = adjustCorridorsAndPipes();
					//console.log("**** layout first pass: w="+dms.width+", h="+dms.height);
					chainAllSegments();
					reassignAllSegmentsToChannels();
					adjustGridSize(dms);
					adjustGridPositions();

					/////////////
					// second pass
					/////////////
					layoutEdges(edgesLayout, false);
					adjustGridSize(dms);
					adjustGridPositions();
					adjustEdgesToPorts();
					//allocateAllSegments();
					_finalRun = true;
					dms = adjustEdgesLayout(edgesLayout, "before loops");
					adjustAllSegments();
					//edgesLayoutUtl.testPrint(self.getEdgesList(), self.getLevelPipes(), self.getLanePipes(), 1);

					while (ii < OPTIMIZE_OUTER && doOptimize) {
						jj = 0;
						while (jj < OPTIMIZE_INNER && doOptimize) {

							doOptimize = false;
							if (DEBUG)
								console.log("%%% BEGIN OPTIMIZE_INNER " + ii + "/" + jj + "/"+kk);

							// group1
							result = _pipeUtl.checkAllCrossingsAtProcessNodesNEXT();
							if (isFixOrRetry(result)) {
								if (DEBUG)
								console.log("  +++===@@ checkAllCrossingsAtProcessNodes 1, result: "+
									dgmUtl.getResultName(result)+", "+ii+"/"+jj);
								doOptimize = true;
								//break;
							}
							result = _pipeUtl.checkAllCrossingsAtSideNodesNEXT();
							// TODO: need to revisit: loop is unbroken
							if (isFixOrRetry(result)) {
								if (DEBUG)
								console.log("  +++===@@ checkAllCrossingsAtSideNodes 1, result: "+
									dgmUtl.getResultName(result)+", "+ii+"/"+jj);
								doOptimize = true;
								//break;
							}
							result = _pipeUtl.checkAllOverlappingSegments();
							if (isFixOrRetry(result)) {
								if (DEBUG)
									console.log("  +++===@@ checkAllOverlappingSegments 1, result: "+
										dgmUtl.getResultName(result)+", "+ii+"/"+jj);
								doOptimize = true;
								//break;
							}

							// group2: first
							result = _pipeUtl.checkAllSideBoxSegments();
							if (isFixOrRetry(result)) {
								if (DEBUG)
								console.log("   +++====@@@ checkAllSideBoxSegments 1, result: "+
									dgmUtl.getResultName(result)+", "+ii+"/"+jj);
								doOptimize = true;
								//break;
								adjustAllSegments();
								dms = recalculateDimension();
								adjustGridSize(dms);
							}
							result = _pipeUtl.checkAllCrossBoxSegments();
							if (isFixOrRetry(result)) {
								if (DEBUG)
								console.log("   +++====@@@ checkAllCrossBoxSegments 1, result: "+
									dgmUtl.getResultName(result)+", "+ii+"/"+jj);
								doOptimize = true;
								//break;
								adjustAllSegments();
								dms = recalculateDimension();
								adjustGridSize(dms);
							}
							//printEdgeByName();

							// second !!!
							result = _pipeUtl.checkAllOverlappingSegments();
							if (isFixOrRetry(result)) {
								if (DEBUG)
								console.log("  +++===@@ checkAllOverlappingSegments 2, result: "+
									dgmUtl.getResultName(result)+", "+ii+"/"+jj);
								//doOptimize = true;
								//break;
								//proceed = true;
								//break;
							}


							//result = _pipeUtl.checkAllCrossingsAtProcessNodesNEXT();
							//result = _pipeUtl.checkAllCrossingsAtProcessNodes();
							//if (isFixOrRetry(result)) {
							//	//if (DEBUG)
							//	console.log("  +++===@@ checkAllCrossingsAtProcessNodesNEXT 1, result: "+
							//		dgmUtl.getResultName(result)+", "+ii+"/"+jj);
							//	doOptimize = true;
							//	//break;
							//}

							//result = _pipeUtl.checkAllCrossingsAtSideNodesNEXT();
							//if (isFixOrRetry(result)) {
							//	//if (DEBUG)
							//	console.log("  +++===@@ checkAllCrossingsAtSideNodesNEXT 1, result: "+
							//		dgmUtl.getResultName(result)+", "+ii+"/"+jj);
							//	doOptimize = true;
							//	//break;
							//}

							///////////////////////////////////

							if (DEBUG) console.log("#### CALL checkOverlappingSegmentsAtNodes ");
							result = _pipeUtl.checkOverlappingSegmentsAtNodes(_nonSuppressedNodes);
							if (isRetryRedoOrFail(result)) {
								if (DEBUG)
								console.log("  +++===@@ checkOverlappingSegmentsAcrossNodes 1, result: "+
									dgmUtl.getResultName(result)+", "+ii+"/"+jj);

								//printNodes("REDO LAYOUT layout", self.nodesList);
								_flowManager.getFlowDiagram().clearCanvas();
								//printNodes("REDO LAYOUT model BEFORE", _flowManager.getModelHandler().getFlowNodes());
								_flowManager.getModelHandler().cachePortOrders(self.edgesList);
								var content =
									_flowManager.getModelHandler().getModelObjectUpdated(self.nodesList, self.edgesList);
									//_flowManager.getModelHandler().getModelObjectUpdated(_nonSuppressedNodes, self.edgesList);
								_flowManager.getModelHandler().buildContentModel(content, false);
								//printFullEdges(_flowManager.getModelHandler().getFlowLinks(), "REDO LAYOUT");

								_flowManager.getModelHandler().updatePortsLayout(self.nodesList);
								//printNodes("REDO LAYOUT model AFTER", _flowManager.getModelHandler().getFlowNodes());

								proceed = true;
								break;
							}

							if (doOptimize && jj < OPTIMIZE_INNER-1) {
								if (DEBUG)
									console.log("###########  OPTIMIZE_INNER: "+ii+"/"+jj);
								adjustAllSegments();
								jj++;
							} else {
								if (DEBUG)
									console.log("##### ??? BREAK ??? OPTIMIZE_INNER: "+ii+"/"+jj+", doOptimize="+doOptimize+", proceed="+proceed);
								break;
							}

						} // while INNER
						if (proceed) {
						//if (doOptimize) {
							if (DEBUG)
								console.log("###### proceed,   REDO LAYOUT: " + ii + "/" + jj + "/" + kk);
							//	//dms = self.adjustDimension(""+ii+"/"+jj);
							//dms = self.recalculateDimension();
							//console.log("**** on proceed: w="+dms.width+", h="+dms.height);
							break;
						}

						//if (_pipeUtl.checkAllOverlappingSegments()) {
						//	//if (DEBUG)
						//		console.log("  +++===@@ checkAllOverlappingSegments = OUTER: " + ii);
						//	doOptimize = true;
						//}

						if (doOptimize && ii < OPTIMIZE_OUTER-1) {
							if (DEBUG)
								console.log("###########  OPTIMIZE_OUTER: " + ii + "/" + jj);
							adjustAllSegments();
							//dms = self.adjustDimension(""+ii+"/"+jj);
							adjustAllSegments();
							dms = recalculateDimension();
							adjustGridSize(dms);
						}

						ii++;
					} // while OUTER

					//if (proceed) {
					kk++;
					if (DEBUG)
						console.log("%%%%====%%%% LAST PROCEED: " + ii + "/" + jj + "/" + kk + " ========\n");
						//break;
					//} else {
						// FINISH
						/////////////////////////////
						// two iterations are needed
						/////////////////////////////
					adjustCellSizes();
					compactGrid();
					adjustAllSegments();
					dms = recalculateDimension();
					adjustGridSize(dms);
					/////////////////////////////
					// optimize
					/////////////////////////////
					optimizePipes();
					adjustCellSizes();
					compactGrid();
					adjustAllSegments();
					dms = recalculateDimension();
					adjustGridSize(dms);
					//printEdgeByName();

					if (DEBUG)
						console.log("======== FINAL LAYOUT DONE: optimize steps = " + ii + "/" + jj + "/" + kk + " ========\n\n");
					//}

					//console.log("=========== END of layout loop "+kk+" =========");

				}

				_flowManager.getModelHandler().updateFlowNodes(self.nodesList);
				_flowManager.getModelHandler().updateFlowLinks(self.edgesList);
				//adjustAllCellSizes();


				//printFullEdges(_flowManager.getModelHandler().getFlowLinks(), "FINAL");
				//printNodes("FINAL", _flowManager.getModelHandler().getFlowNodes());

				self.layoutSize = dms;
				//utils.printMillis("end proceed");
				//printEdgesDetails("END");

				//if (self.nodesList.length > 0)
				//	console.log("========= END  ======== NODE[0]: "+self.nodesList[0].getName()+
				//	", level: "+self.nodesList[0].getLevelNumber()+", lane: "+self.nodesList[0].getLaneNumber());
				//if (DEBUG)

				//console.log("TOTAL DURATION: "+(Date.now() - startMillis)+" msec");

				document.body.style.cursor  = 'default';
				//$("body").css("cursor", "default");
				//$('body').removeClass('waiting');
			};

			function isFixOrRetry(result) {
				return _pipeUtl.isFixOrRetry(result);
			}

			function isRetryRedoOrFail(result) {
				return _pipeUtl.isRetryRedoOrFail(result);
			}

			/**************************************************************************
			 *      LAYOUT NODES
			 **************************************************************************
			 * Levels are across flow direction, lanes are along flow direction
			 * Lane indexing is left-to-right or top-to-bottom
			 **************************************************************************/
			function layoutNodes(nodesLayout) {
				var result = false;
				if (DEBUG) console.log("*** start layoutNodes, fix mode = "+config.getLayoutMode()+", orientation="+config.getFlowDirection());

				if (config.getLayoutMode() === constants.layoutMode().MANUAL) {
					var i, list,
						unAllocNodes = nodesLayoutUtils.getUnallocatedNodes(_nonSuppressedNodes);
					
					if (unAllocNodes.length > 0) {
						//_nonSuppressedNodes = Utils.subtractArrays(_nonSuppressedNodes, unAllocNodes);
						//console.log("!!! Found unallocated nodes, excluded from dataflow:\n"+unAllocNodes);
						self.nodesList = Utils.subtractArrays(self.nodesList, unAllocNodes);
						_flowManager.getModelHandler().updateFlowNodes(self.nodesList);
						_flowManager.resetUndoManager();
						list = [];
						for (i = 0; i < unAllocNodes.length; i++) {
							unAllocNodes[i].setVisible(false);
							list += "\n\t"+unAllocNodes[i].printShort();
						}
						// TODO: add a setting to activate this type of messages
						_flowManager.getCaller().showInfoMessage("Found unallocated nodes, excluded nodes:"+list);
					}
					var overlapNodes = nodesLayoutUtils.getOverlappingNodes(_nonSuppressedNodes);
					if (overlapNodes.length > 0) {
						self.nodesList = Utils.subtractArrays(self.nodesList, overlapNodes);
						_flowManager.getModelHandler().updateFlowNodes(self.nodesList);
						_flowManager.resetUndoManager();
						list = [];
						for (i = 0; i < overlapNodes.length; i++) {
							overlapNodes[i].setVisible(false);
							list += "\n\t"+overlapNodes[i].printShort();
						}
						// TODO: add a setting to activate this type of messages
						_flowManager.getCaller().showInfoMessage("Found overlapping nodes, excluded nodes:"+list);
					}
					nodesLayout.layoutNodesManual();
					result = true;
				} else if (config.getLayoutMode() == constants.layoutMode().AUTO) {
					nodesLayoutUtils.detachAll(_nonSuppressedNodes);
					result = nodesLayout.layoutNodesAutoLayout();
				}
				// done with layout nodes
				adjustCellSizes();
				return result;
			}
			/* end LAYOUT NODES */

			function adjustCellSizes() {
				var i;
				for (i = 0; i < self.nodesList.length; i++) {
					if ((self.nodesList[i].getFlowType() === constants.flowType().CONTAINER ||
						self.nodesList[i].getFlowType() === constants.flowType().SWITCH)
						&&
						self.nodesList[i].isExpanded()) {
						self.nodesList[i].setInitialBounds();
					}
					modelUtils.adjustSize(self.nodesList[i]);
				}
				for (i = 0; i < self.levels.length; i++) {
					self.levels[i].adjustSize();
				}
				for (i = 0; i < self.lanes.length; i++) {
					self.lanes[i].adjustSize();
				}
				//for (i = 0; i < self.nodesList.length; i++) {
				//	if (self.nodesList[i].getFlowType() === constants.flowType().CONTAINER && self.nodesList[i].isExpanded()) {
				//		self.nodesList[i].setInitialBounds();
				//	}
				//	modelUtils.adjustSize(self.nodesList[i]);
				//}
			}

			function adjustAllCellSizes() {
				var i;
				for (i = 0; i < self.levels.length; i++) {
					self.levels[i].adjustSize();
					var emptyCells = self.levels[i].getEmptyCellsInRange(self, 0, self.lanes.length-1);
					for (var j = 0; j < emptyCells.length; j++) {
						var rect = self.levels[i].intersection(self.lanes[emptyCells[j].getLaneNumber()]);
						emptyCells[j].setRectBounds(rect.x, rect.y, rect.width, rect.height);
					}
				}
			}

			function removeAnyDuplicateSegments() {
				self.edgesList.forEach(function(edge) {
					edge.removeDuplicateSegments();
				});
			}

			/**************************************************************************
			 *      LAYOUT EDGES
			 **************************************************************************/

			function adjustEdgesLayout(edgesLayout, step) {
				if (DEBUG)
					console.log("======= adjustEdgesLayout: "+step);
				//var dms = reAdjustCorridorsAndPipes();
				//adjustGridSize(dms);
				//adjustGridPositions();

				layoutEdges(edgesLayout, false);

				reassignAllSegmentsToChannels();
				//self.printPipes("&&& adjustEdges 1 ");

				adjustEdgesToPorts();
				allocateAllSegments();

				// NEW: important fix !!!
				adjustAllSegments();
				reassignAllSegmentsToChannels();
				//self.printPipes("&&& adjustEdges 2 ");

				var dms = reAdjustCorridorsAndPipes();
				adjustGridSize(dms);
				adjustGridPositions();

				return dms;
			}

			function shiftSegments() {
				for (var i = 0; i < self.edgesList.length; i++) {
					//var link = self.edgesList[i];
					//if (link.getName() === "[L1/OUT-0]-[R1/IN-0]") {
					//	console.log("** 1 *************** shiftSegments 1: "+link.printLink());
					//}
					var link = self.edgesList[i],
						segmentShifts = link.getTotalShifts();
					if (segmentShifts.length > 0) {
						link.chainSegments();
					}
					for (var j = 0; j < segmentShifts.length; j++) {
						var shiftObj = segmentShifts[j],
							order = shiftObj.order,
							pipeShift = shiftObj.pipeShift;
						if (link.getSegments().length > 0 && order >= 0 && order < link.getSegments().length &&
							pipeShift && pipeShift !== 0) {
							var segment = link.getSegments()[order],
								fromPipe = segment.getPipe(),
								fromIndex = fromPipe.getOrder(),
								toIndex = fromIndex + pipeShift,
								toPipe;
							if (fromPipe.getType() === constants.pipeType().LEVEL_PIPE &&
								toIndex >= 0 && toIndex < self.levelPipes.length) {
								toPipe = self.levelPipes[toIndex];
							} else if (fromPipe.getType() === constants.pipeType().LANE_PIPE &&
								toIndex >= 0 && toIndex < self.lanePipes.length) {
								toPipe = self.lanePipes[toIndex];
							}
							if (toPipe) {
								fromPipe.removeSegmentFromPipe(segment);
								toPipe.addSegmentToPipe(segment);
								segment.setPipe(toPipe);
								//segment.getEdge().adjustSegmentsLocations();
							} else {
								alert("Index out of bound for link: "+link.getName()+", segment order: "+order);
							}
						}
					}
				}
			}

			//function getAssignedEdges(edgesList) {
			//	var edges = [];
			//	for (var i = 0; i < edgesList.length; i++) {
			//		var edge = edgesList[i];
			//		console.log("############# edge: "+edge.getName()+", "+edge.isVisible());
			//		if (edge.isValid() && edge.isVisible()) {
			//			edges.push(edge);
			//		}
			//	}
			//	return edges;
			//}

			//////////////////////////////

			function layoutEdges(edgesLayout, isFirstPass){
				if (DEBUG)
					console.log("******************************* start layoutEdges: "+isFirstPass);
				var i;
				for (i = 0; i < self.levelPipes.length; i++) {
					self.levelPipes[i].clearChannels();
					self.levelPipes[i].clearSegmentsCache();
				}
				for (i = 0; i < self.lanePipes.length; i++) {
					self.lanePipes[i].clearChannels();
					self.lanePipes[i].clearSegmentsCache();
				}
				for (i = 0; i < self.levels.length; i++) {
					self.levels[i].clearSegments();
				}
				for (i = 0; i < self.lanes.length; i++) {
					self.lanes[i].clearSegments();
				}

				//self.edgesList = self.getAssignedEdges();

				for (i = 0; i < self.edgesList.length; i++) {
					self.edgesList[i].clearSegments();
				}

				// levelPipe's enclose all levels
				// levelPipes.length is 1 more than levels.length
				if (self.levels.length > 0 && self.levelPipes.length === 0) {
					// first pass only
					for (i = 0; i <= self.levels.length; i++) {
						self.levelPipes.push(new LevelPipe(i));
					}
				}
				// lanePipe's enclose all lanes
				// lanePipes.length is one more than lanes.length
				if (self.lanes.length > 0 && self.lanePipes.length === 0) {
					// first pass only
					for (i = 0; i <= self.lanes.length; i++) {
						self.lanePipes.push(new LanePipe(i));
					}
				}

				if (isFirstPass) {
					preAdjustGridPositions();
				}

				for (i = 0; i < self.edgesList.length; i++) {
					if (self.edgesList[i].isValid() && self.edgesList[i].isVisible()) {
						edgesLayout.traceEdge(self.edgesList[i]);
					}
				}

				///////////////////////
				// shift segments
				shiftSegments();
				///////////////////////

			}


			//////////////////////////////

			function printEdges(msg) {
				var names = [];
				for (var i = 0; i < self.edgesList.length; i++) {
					names.push("\n\t"+self.edgesList[i].getName()+
						", SF: "+self.edgesList[i].getSourceShift()+
						", TF: "+self.edgesList[i].getTargetShift()+
						", PO: "+self.edgesList[i].hasPipesOnly());
				}
				console.log("printEdges ("+msg+"):"+names);
			}

			function printFullEdges(edges, msg) {
				var names = [];
				for (var i = 0; i < edges.length; i++) {
					//if (edges[i].getName().indexOf("D4") > 0)
						names.push("\n\t"+edges[i].printEdge());
				}
				console.log("printFullEdges ("+msg+"):"+names);
			}

			var printNodes = function(msg, nodes) {
				var list = [];
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].getName() === ("L1") )
					list.push("\n\t"+nodes[i].printNode());
				}
				console.log("printNodes ("+msg+"): "+list);
			};

			var printNodesShort = function(msg, nodes) {
				var list = [];
				for (var i = 0; i < nodes.length; i++) {
					//if (nodes[i].getName() === ("D4"))
					list.push("\n\t"+nodes[i].printShort());
				}
				console.log("printNodesShort ("+msg+"): "+list);
			};

// START
			function adjustCorridorsAndPipes() {
				if (DEBUG) console.log("***/// adjustCorridorsAndPipes:");
				//printEdges();
				// along
				var i, extentAlong = 0, extentAcross = 0;
				for (i = 0; i < self.levels.length; i++) {
					var level = self.levels[i];
					extentAlong += config.getFlowDirection() === constants.flow().HORIZONTAL ? level.width : level.height;
				}
				for (i = 0; i < self.levelPipes.length; i++) {
					var levelPipe = self.levelPipes[i];
					levelPipe.reassignSegmentsToChannels();
					extentAlong += levelPipe.getExtent();
				}

				// across
				for (i = 0; i < self.lanes.length; i++) {
					var lane = self.lanes[i];
					extentAcross += config.getFlowDirection() === constants.flow().HORIZONTAL ? lane.height : lane.width;
				}
				for (i = 0; i < self.lanePipes.length; i++) {
					var lanePipe = self.lanePipes[i];
					lanePipe.reassignSegmentsToChannels();
					extentAcross += lanePipe.getExtent();
				}

				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					return new Dimension(extentAlong, extentAcross);
				} else {
					return new Dimension(extentAcross, extentAlong);
				}
			}

			function reAdjustCorridorsAndPipes() {
				if (DEBUG) console.log("@@@@ Flowlayout: reAdjustCorridorsAndPipes");
				// along
				var i, extentAlong = 0;
				for (i = 0; i < self.levels.length; i++) {
					var level = self.levels[i];
					extentAlong += config.getFlowDirection() === constants.flow().HORIZONTAL ? level.width : level.height;
				}
				for (i = 0; i < self.levelPipes.length; i++) {
					var levelPipe = self.levelPipes[i];
					levelPipe.reassignSegmentsToChannels();
					extentAlong += levelPipe.getExtent();
				}

				// across
				var  extentAcross = 0;
				for (i = 0; i < self.lanes.length; i++) {
					var lane = self.lanes[i];
					extentAcross += config.getFlowDirection() === constants.flow().HORIZONTAL ? lane.height : lane.width;
				}
				for (i = 0; i < self.lanePipes.length; i++) {
					var lanePipe = self.lanePipes[i];
					lanePipe.reassignSegmentsToChannels();
					extentAcross += lanePipe.getExtent();
				}

				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					return new Dimension(extentAlong, extentAcross);
				} else {
					return new Dimension(extentAcross, extentAlong);
				}
			}

			// last step
			function recalculateDimension() {
				//if (DEBUG) console.log("@@@@@ FlowLayout: recalculateDimension");
				// along
				var i, extentAlong = 0, extentAcross = 0;;
				for (i = 0; i < self.levels.length; i++) {
					var level = self.levels[i];
					extentAlong += config.getFlowDirection() === constants.flow().HORIZONTAL ? level.width : level.height;
				}
				for (i = 0; i < self.levelPipes.length; i++) {
					var levelPipe = self.levelPipes[i];
					//levelPipe.adjustLocalSize();
					extentAlong += levelPipe.getExtent();
				}
				// across
				for (i = 0; i < self.lanes.length; i++) {
					var lane = self.lanes[i];
					extentAcross += config.getFlowDirection() === constants.flow().HORIZONTAL ? lane.height : lane.width;
				}
				for (i = 0; i < self.lanePipes.length; i++) {
					var lanePipe = self.lanePipes[i];
					//lanePipe.adjustLocalSize();
					extentAcross += lanePipe.getExtent();
				}

				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					return new Dimension(extentAlong, extentAcross);
				} else {
					return new Dimension(extentAcross, extentAlong);
				}
			}

			function adjustGridSize(dms) {
				// adjust corridors and pipes
				var i;
				for (i = 0; i < self.levels.length; i++) {
					self.levels[i].adjustGlobalSize(
						config.getFlowDirection() === constants.flow().HORIZONTAL ? dms.height : dms.width);
				}
				for (i = 0; i < self.lanes.length; i++) {
					self.lanes[i].adjustGlobalSize(
						config.getFlowDirection() === constants.flow().HORIZONTAL ? dms.width : dms.height);
				}
				for (i = 0; i < self.levelPipes.length; i++) {
					self.levelPipes[i].adjustGlobalSize(
						config.getFlowDirection() === constants.flow().HORIZONTAL ? dms.height : dms.width);
				}
				for (i = 0; i < self.lanePipes.length; i++) {
					self.lanePipes[i].adjustGlobalSize(
						config.getFlowDirection() === constants.flow().HORIZONTAL ? dms.width : dms.height);
				}
			}

			function preAdjustGridPositions() {
				if (DEBUG) console.log("@ FlowLayout: preAdjustGridPositions");
				// allocate corridors and pipes
				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					var i = 0;
					if (self.levels.length > 0) {
						while (i < self.levels.length) {
							self.levelPipes[i].setRectLocation(i > 0 ? self.levels[i-1].x + self.levels[i-1].width : 0, 0);
							self.levels[i].setRectLocation(self.levelPipes[i].x + self.levelPipes[i].width, 0);
							i++;
						}
						self.levelPipes[i].setRectLocation(self.levels[i-1].x + self.levels[i-1].width, 0);
					}
					i = 0;
					if (self.lanes.length > 0) {
						while(i < self.lanes.length) {
							self.lanePipes[i].setRectLocation(0, i > 0 ? self.lanes[i-1].y + self.lanes[i-1].height : 0);
							self.lanes[i].setRectLocation(0, self.lanePipes[i].y + self.lanePipes[i].height);
							i++;
						}
						self.lanePipes[i].setRectLocation(0, self.lanes[i-1].y + self.lanes[i-1].height);
					}
				} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
					i = 0;
					if ( self.levels.length > 0) {
						while(i < self.levels.length) {
							self.levelPipes[i].setRectLocation(0, i > 0 ? self.levels[i-1].y + self.levels[i-1].height : 0);
							self.levels[i].setRectLocation(0, self.levelPipes[i].y + self.levelPipes[i].height);
							i++;
						}
						self.levelPipes[i].setRectLocation(0, self.levels[i-1].y + self.levels[i-1].height);
					}
					i = 0;
					if ( self.lanes.length > 0) {
						while (i < self.lanes.length) {
							self.lanePipes[i].setRectLocation(i > 0 ? self.lanes[i-1].x + self.lanes[i-1].width : 0, 0);
							self.lanes[i].setRectLocation(self.lanePipes[i].x + self.lanePipes[i].width, 0);
							i++;
						}
						self.lanePipes[i].setRectLocation(self.lanes[i-1].x + self.lanes[i-1].width, 0);
					}
				}
			}

			function adjustGridPositions() {
				//if (DEBUG) console.log("@@@@ FlowLayout: adjustGridPositions: x=" + orgX + ", y=" + orgY + "\n");
				// allocate corridors and pipes
				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					var i = 0;
					if ( self.levels.length > 0 && self.levelPipes.length > 0) {
						while (i < self.levels.length) {
							self.levelPipes[i].setRectLocation(i > 0 ? self.levels[i-1].x + self.levels[i-1].width : 0, 0);
							self.levels[i].setRectLocation(self.levelPipes[i].x + self.levelPipes[i].width, 0);
							i++;
						}
						self.levelPipes[i].setRectLocation(self.levels[i-1].x + self.levels[i-1].width, 0);
					}
					i = 0;
					if ( self.lanes.length > 0 && self.lanePipes.length > 0) {
						while(i < self.lanes.length) {
							self.lanePipes[i].setRectLocation(0, i > 0 ? self.lanes[i-1].y + self.lanes[i-1].height : 0);
							self.lanes[i].setRectLocation(0, self.lanePipes[i].y + self.lanePipes[i].height);
							i++;
						}
						self.lanePipes[i].setRectLocation(0, self.lanes[i-1].y + self.lanes[i-1].height);
					}
				} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
					i = 0;
					if ( self.levels.length > 0 && self.levelPipes.length > 0) {
						while(i < self.levels.length) {
							self.levelPipes[i].setRectLocation(0, i > 0 ? self.levels[i-1].y + self.levels[i-1].height : 0);
							self.levels[i].setRectLocation(0, self.levelPipes[i].y + self.levelPipes[i].height);
							i++;
						}
						self.levelPipes[i].setRectLocation(0, self.levels[i-1].y + self.levels[i-1].height);
					}
					i = 0;
					if ( self.lanes.length > 0 && self.lanePipes.length > 0) {
						while (i < self.lanes.length) {
							self.lanePipes[i].setRectLocation(i > 0 ? self.lanes[i-1].x + self.lanes[i-1].width : 0, 0);
							self.lanes[i].setRectLocation(self.lanePipes[i].x + self.lanePipes[i].width, 0);
							i++;
						}
						self.lanePipes[i].setRectLocation(self.lanes[i-1].x + self.lanes[i-1].width, 0);
					}
				}
				// translate all
				//for (i = 0; i < self.levels; i++) {
				//	self.levels[i].translate(orgX, orgY);
				//}
				//for (i = 0; i < self.levelPipes; i++) {
				//	self.levelPipes[i].translate(orgX, orgY);
				//}
				//for (i = 0; i < self.lanes; i++) {
				//	self.lanes[i].translate(orgX, orgY);
				//}
				//for (i = 0; i < self.lanePipes; i++) {
				//	self.lanePipes[i].translate(orgX, orgY);
				//}
				// allocate cells/nodes
				for (i = 0; i < self.levels.length; i++) {
					var level = self.levels[i];
					var cells = level.getCells();
					for (var j = 0; j < cells.length; j++) {
						var cell = cells[j];
						var laneNum = cell.getLaneNumber();
						if (laneNum < 0 || laneNum > self.lanes.length-1) {
							console.log("ERROR: Invalid lane index, cannot allocate cell: "+cell.getNode().getName()+
										", laneNum="+laneNum);
						} else {
							var lane = self.lanes[laneNum];
							if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
								cell.setCellLocation(level.x, lane.y);
							} else {
								cell.setCellLocation(lane.x, level.y);
							}
						}
					}
				}
			}

			function compactGrid() {
				//if (DEBUG) console.log("@@@@@ FlowLayout: compactGrid");
				var i;
				for (i = 0; i < self.levelPipes.length; i++) {
					self.levelPipes[i].adjustPipeExtend();
				}
				for (i = 0; i < self.lanePipes.length; i++) {
					self.lanePipes[i].adjustPipeExtend();
				}
				// allocate corridors and pipes
				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					i = 0;
					if ( self.levels.length > 0 && self.levelPipes.length > 0) {
						while (i < self.levels.length) {
							self.levelPipes[i].setRectLocation(i > 0 ? self.levels[i-1].x + self.levels[i-1].width : 0, 0);
							self.levels[i].setRectLocation(self.levelPipes[i].x + self.levelPipes[i].width, 0);
							i++;
						}
						self.levelPipes[i].setRectLocation(self.levels[i-1].x + self.levels[i-1].width, 0);
					}
					i = 0;
					if ( self.lanes.length > 0 && self.lanePipes.length > 0) {
						while(i < self.lanes.length) {
							self.lanePipes[i].setRectLocation(0, i > 0 ? self.lanes[i-1].y + self.lanes[i-1].height : 0);
							self.lanes[i].setRectLocation(0, self.lanePipes[i].y + self.lanePipes[i].height);
							i++;
						}
						self.lanePipes[i].setRectLocation(0, self.lanes[i-1].y + self.lanes[i-1].height);
					}
				} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
					i = 0;
					if ( self.levels.length > 0 && self.levelPipes.length > 0) {
						while(i < self.levels.length) {
							self.levelPipes[i].setRectLocation(0, i > 0 ? self.levels[i-1].y + self.levels[i-1].height : 0);
							self.levels[i].setRectLocation(0, self.levelPipes[i].y + self.levelPipes[i].height);
							i++;
						}
						self.levelPipes[i].setRectLocation(0, self.levels[i-1].y + self.levels[i-1].height);
					}
					i = 0;
					if ( self.lanes.length > 0 && self.lanePipes.length > 0) {
						while (i < self.lanes.length) {
							self.lanePipes[i].setRectLocation(i > 0 ? self.lanes[i-1].x + self.lanes[i-1].width : 0, 0);
							self.lanes[i].setRectLocation(self.lanePipes[i].x + self.lanePipes[i].width, 0);
							i++;
						}
						self.lanePipes[i].setRectLocation(self.lanes[i-1].x + self.lanes[i-1].width, 0);
					}
				}

				// allocate cells/nodes
				for (i = 0; i < self.levels.length; i++) {
					var level = self.levels[i];
					var cells = level.getCells();
					for (var j = 0; j < cells.length; j++) {
						var cell = cells[j];
						var laneNum = cell.getLaneNumber();
						if (laneNum < 0 || laneNum > self.lanes.length-1) {
							console.log("ERROR: Invalid lane index, cannot allocate cell: "+cell.getNode().getName()+
										", laneNum="+laneNum);
						} else {
							var lane = self.lanes[laneNum];
							if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
								cell.adjustCellLocation(level.x, lane.y);
							} else {
								cell.adjustCellLocation(lane.x, level.y);
							}
						}
					}
				}
			}

			function reassignAllSegmentsToChannels() {
				if (DEBUG) console.log("@@@@ Flowlayout: reassignAllSegmentsToChannels");
				var i;
				for (i = 0; i < self.levelPipes.length; i++) {
					self.levelPipes[i].reassignSegmentsToChannels();
				}
				for (i = 0; i < self.lanePipes.length; i++) {
					self.lanePipes[i].reassignSegmentsToChannels();
				}
			}

			function chainAllSegments() {
				var edges = self.edgesList;
				for (var i = 0; i < edges.length; i++) {
					var edge = edges[i];
					if (!edge.chainSegments()) {
						//console.log("##### PROBLEM: edge not chained: " + edge.getName());
					}
				}
			}

			function adjustEdgesToPorts() {
				var edges = self.edgesList;
				for (var i = 0; i < edges.length; i++) {
					var edge = edges[i];
					//console.log("adjustEdgesToPorts "+edge.print());
					if (!edge.chainSegments()) {
						//console.log("##### PROBLEM: edge not chained: "+edge.getName());
						continue;
					}
					var segments = edge.getSegments();
					//if (segments.length === 0) {
					//	continue;
					//}
					var leadSegment = segments[0];
					//console.log("##### PROBLEM: leadSegment: "+leadSegment.print());
					var leadP = leadSegment.getStartPoint();
					var attP = edge.getSourcePort().getAttachmentPoint();
					var dx = attP.x - leadP.x;
					var dy = attP.y - leadP.y;
					for (var j = 0; j < segments.length; j++) {
						if (j == 0) {
							segments[j].adjustStartPoint(dx, dy);
						}
						segments[j].adjustEndPoint(dx, dy);
					}
				}
			}

			function allocateAllSegments() {
				if (DEBUG)
					console.log("@@@@ Flowlayout: allocateAllSegments");
				var i;
				for (i = 0; i < self.levelPipes.length; i++) {
					self.levelPipes[i].allocateSegments();
				}
				for (i = 0; i < self.lanePipes.length; i++) {
					self.lanePipes[i].allocateSegments();
				}
			}

			function optimizePipes() {
				var i;
				for (i = 0; i < self.levelPipes.length; i++) {
					self.levelPipes[i].optimizePipe();
				}
				for (i = 0; i < self.lanePipes.length; i++) {
					self.lanePipes[i].optimizePipe();
				}
			}


			function adjustAllSegments() {
				for (var i = 0; i < self.edgesList.length; i++) {
					self.edgesList[i].adjustSegmentsLocations();
				}
			}

			self.getEmptyCells = function() {
				var emptyCells = [];
				var cells = self.nodeToCellMap.values();
				for (var i = 0; i < self.levels.length; i++) {
					var level = self.levels[i];
					for (var j = 0; j < self.lanes.length; j++) {
						var lane = self.lanes[j];
						var found = false;
						for (var k = 0; k < cells.length; k++) {
							var cell = cells[k];
							if (cell.getLevelNumber() === level.getOrder() &&
								cell.getLaneNumber() === lane.getOrder()) {
								found = true;
								break;
							}
						}
						if (!found) {
							var xCell = new GridCell(level.getOrder(), lane.getOrder());
							var cr = level.intersection(lane);
							xCell.setRectBounds(cr.x, cr.y, cr.width, cr.height);
							emptyCells.push(xCell);
						}
					}
				}
				return emptyCells;
			};

			self.getNodeCells = function() {
				return self.nodeToCellMap.values();
			};

			self.getCellForNode = function(node) {
				var cells = self.nodeToCellMap.values();
				for (var i = 0; i < cells.length; i++) {
					if (cells[i].getLevelNumber() == node.getLevelNumber() &&
						cells[i].getLaneNumber() == node.getLaneNumber()) {
						return cells[i];
					}
				}
				return undefined;
			};

		}
		return FlowLayout;
	}
);