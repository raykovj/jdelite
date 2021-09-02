define('modules/flow/modelHandler',
	['modules/flow/flowModel',
		'modules/flow/flowUtils',
		'modules/common/map',
		'modules/diagram/diagramUtils',
		'modules/graph/graphConstants',
		'modules/graph/modelUtils',
		'modules/settings/settingsActions',
		'modules/settings/config'],
	function(FlowModel,
			 flowUtils,
			 Map,
			 diagramUtils,
	         constants,
			 modelUtils,
			 settingsActions,
	         config) {

		function ModelHandler(manager) {
			var self = this,
				_manager = manager,
				_flowModel = new FlowModel(manager),
				//_flowLayout = _manager.getFlowDiagram().getFlowLayout(),
				NODES_KEY = constants.selections().NODES,
				LINKS_KEY = constants.selections().LINKS;

			self.getFlowModel = function() { return _flowModel; };

			self.clearModel = function() {
				_flowModel.clearFlowModel();
			};

			self.buildContentModel = function(content, onOpen) {
				if (onOpen) {
					normalizeStartEndLevels(content);
					normalizeSideSwimLanes(content);
				} else {
					self.updateFlowNodes(self.getFlowNodes());
					self.updateFlowLinks(self.getFlowLinks());
				}
				_flowModel.buildFlowModel(content, onOpen);
				_manager.getCaller().resetFlowDirectionChange();
			};

			self.getFlowNodes = function() { return _flowModel.getFlowNodes(); };
			self.getFlowLinks = function() { return _flowModel.getFlowLinks(); };

			self.updateFlowNodes = function(nodes) { return _flowModel.updateFlowNodes(nodes); };
			self.updateFlowLinks = function(links) { return _flowModel.updateFlowLinks(links); };

			self.updateFlowNodesModel = function() {
				self.updateFlowNodes(self.getFlowNodes());
			};
			self.updateFlowLinksModel = function() {
				self.updateFlowLinks(self.getFlowLinks());
			};


			self.getModelObject = function() {
				var model = {};
				model.nodes = _flowModel.getNodeObjects();
				model.links = _flowModel.getLinkObjects();
				model.settings = self.getSettings();
				// ...
				return model;
			};

			self.getModelObjectUpdated = function(flowNodes, flowLinks) {
				_flowModel.updateFlowNodes(flowNodes);
				_flowModel.updateFlowLinks(flowLinks);
					//console.log("%%% MODEL UPDATE node: "+flowNodes[i].getName()+", "+flowNodes[i].getEnds());
				return self.getModelObject();
			};

			self.cachePortOrders = function(links) {
				//var links = _flowModel.getFlowLinks();
				for (var i = 0; i < links.length; i++) {
					links[i].setSrcPortOrder(links[i].getSourcePort().getOrder());
					links[i].setTrgPortOrder(links[i].getTargetPort().getOrder());
				}
			};

			self.updatePortsLayout = function(nodesToUpdate) {
				var modelNodes = _flowModel.getFlowNodes();
				for (var i = 0; i < modelNodes.length; i++) {
					for (var j = 0; j < nodesToUpdate.length; j++) {
						if (modelNodes[i].equals(nodesToUpdate[j])) {
							updateDummyPorts(modelNodes[i], nodesToUpdate[j], constants.nodeSide().FRONT);
							updateDummyPorts(modelNodes[i], nodesToUpdate[j], constants.nodeSide().BACK);
							updateDummyPorts(modelNodes[i], nodesToUpdate[j], constants.nodeSide().LEFT);
							updateDummyPorts(modelNodes[i], nodesToUpdate[j], constants.nodeSide().RIGHT);
							break;
						}
					}
				}
			};

			function updateDummyPorts(modelNode, nodeToUpdate, side) {
				var dummies = modelNode.getDummyPortsForSide(side);
				if (dummies.length > 0) {
					//console.log("@@ FOUND DUMMIES: node = "+modelNode.getName());
					for (var k = 0; k < dummies.length; k++) {
						var sidePorts = nodeToUpdate.getAllPortsForSide(side);
						nodeToUpdate.insertDummyPort(sidePorts, dummies[k]);
					}
				}
			}

			self.resetLinksToDefaults = function() {
				var links = self.getFlowLinks();
				for (var i = 0; i < links.length; i++) {
					links[i].resetToDefaults();
				}
				var linkObjects = _flowModel.getLinkObjects();
				for (var j = 0; j < linkObjects.length; j++) {
					if (linkObjects[j].srcShift) linkObjects[j].srcShift = constants.portShift().NONE;
					if (linkObjects[j].trgShift) linkObjects[j].trgShift = constants.portShift().NONE;
					if (linkObjects[j].pipesOnly) linkObjects[j].pipesOnly = false;
				}
			};

			self.getModelObjectToSave = function() {
				var model = {}, nodes = [], links = [];
				//model.nodes = _flowModel.getNodeObjects();
				var flowNodes = _flowModel.getFlowNodes();
				for (var j = 0; j < flowNodes.length; j++) {
					nodes.push(flowNodes[j].getNodeObjectToSave());
				}
				model.nodes = nodes;
				var flowLinks = _flowModel.getFlowLinks();
				for (var i = 0; i < flowLinks.length; i++) {
					links.push(flowLinks[i].getLinkObjectToSave(true));
				}
				model.links = links;
				model.settings = self.getSettings();

				/// DIMENSIONS ///
				if (config.hasGlobalFlowWidth()) {
					model.settings.globalFlowWidth = config.getGlobalFlowWidth();
				}
				if (config.hasGlobalFlowHeight()) {
					model.settings.globalFlowHeight = config.getGlobalFlowHeight();
				}
				if (config.hasGlobalSEWidth()) {
					model.settings.globalSEWidth = config.getGlobalSEWidth();
				}
				if (config.hasGlobalSEHeight()) {
					model.settings.globalSEHeight = config.getGlobalSEHeight();
				}
				if (config.hasGlobalDecisionWidth()) {
					model.settings.globalDecisionWidth = config.getGlobalDecisionWidth();
				}
				if (config.hasGlobalDecisionHeight()) {
					model.settings.globalDecisionHeight = config.getGlobalDecisionHeight();
				}
				/// COLORS ///
				if (config.hasProcBgnColorChanged()) { model.settings.processBgnColor = config.getProcBgnColor(); }
				if (config.hasProcFgnColorChanged()) { model.settings.processFgnColor = config.getProcFgnColor(); }

				if (config.hasDecBgnColorChanged()) { model.settings.decisionBgnColor = config.getDecBgnColor(); }
				if (config.hasDecFgnColorChanged()) { model.settings.decisionFgnColor = config.getDecFgnColor(); }

				if (config.hasIOBgnColorChanged()) { model.settings.ioBgnColor = config.getIOBgnColor(); }
				if (config.hasIOFgnColorChanged()) { model.settings.ioFgnColor = config.getIOFgnColor(); }

				if (config.hasSEBgnColorChanged()) { model.settings.seBgnColor = config.getSEBgnColor(); }
				if (config.hasSEFgnColorChanged()) { model.settings.seFgnColor = config.getSEFgnColor(); }

				if (config.hasSideBgnColorChanged()) { model.settings.sideBgnColor = config.getSideBgnColor(); }
				if (config.hasSideFgnColorChanged()) { model.settings.sideFgnColor = config.getSideFgnColor(); }

				if (config.hasTermBgnColorChanged()) { model.settings.termBgnColor = config.getTermBgnColor(); }
				if (config.hasTermFgnColorChanged()) { model.settings.termFgnColor = config.getTermFgnColor(); }

				/// ICONS ///
				if (config.hasFlowIconKeyChanged()) { model.settings.flowIconKey = config.getFlowIconKey(); }
				if (config.hasFlagIconKeyChanged()) { model.settings.flagIconKey = config.getFlagIconKey(); }
				if (config.hasQuizIconKeyChanged()) { model.settings.quizIconKey = config.getQuizIconKey(); }


				// ...
				return model;
			};

			self.isDiagramEmpty = function() {
				//var diagram = flowManager.getFlowDiagram();
				return self.getFlowNodes().length === 0;
			};

			self.getSettings = function() {
				var settings = {};
				settings.editMode = config.getEditMode();
				settings.flowDirection = config.getFlowDirection();
				settings.layoutMode = config.getLayoutMode();
				settings.canvasLevels = config.getCanvasLevels();
				settings.canvasLanes = config.getCanvasLanes();
				settings.startEndLevels = config.getStartEndLevels();
				settings.sideSwimLanes = config.getSideSwimLanes();
				//settings.showGrid = config.hasShowGrid();
				settings.autoGenNodeNames = config.hasAutoGenNodeNames();
				settings.hideNodeNames = config.hasHideNodeNames();
				settings.showNodeIcons = config.getShowNodeIcons();
				settings.showRefHandles = config.hasShowRefHandles();
				//settings.enableAddCorridors = config.hasEnableAddCorridors();
				settings.linkStyle = config.getLinkStyle();
				// ...
				return settings;
			};

			self.updateSettings = function(content, onOpen) {
				if (content && content.settings) {
					var settings = content.settings;
					//console.log("## updateSettings:\n"+JSON.stringify(settings));

					config.setEditMode(
						settings.editMode ? settings.editMode : constants.editMode().EDIT_ALL);
					config.setFlowDirection(
						settings.flowDirection ? settings.flowDirection : constants.flow().VERTICAL);
					config.setLayoutMode(
						settings.layoutMode ? settings.layoutMode : constants.layoutMode().MANUAL);

					config.setStartEndLevels(constants.getBValue(settings.startEndLevels));
					config.setSideSwimLanes(constants.getBValue(settings.sideSwimLanes));

					if (_manager.isInitialResizeMode()) {
						config.setCanvasLevels(constants.initial().LEVELS);
						config.setCanvasLanes(constants.initial().LANES);
					} else {
						var canvasLevels = settings.canvasLevels,
							canvasLevelsNum = flowUtils.getTotalCanvasLevels(content);
						//console.log("*** canvasLevels="+canvasLevels+", integer? "+Number.isInteger(canvasLevels));
						//console.log("***************** canvasLevelsNum="+canvasLevelsNum);
						if (canvasLevelsNum <= 0) { canvasLevelsNum = constants.levelsRange().MIN; }
						if (canvasLevels && Number.isInteger(canvasLevels)) {
							if (canvasLevels <= canvasLevelsNum) {
								canvasLevels = canvasLevelsNum;
							} else if (canvasLevels > constants.levelsRange().MAX) {
								canvasLevels = constants.levelsRange().MAX;
							}
							config.setCanvasLevels(canvasLevels);
						} else {
							config.setCanvasLevels(canvasLevelsNum);
						}

						var canvasLanes = settings.canvasLanes,
							canvasLanesNum = flowUtils.getTotalCanvasLanes(content);
						//console.log("***************** canvasLanesNum="+canvasLanesNum);
						if (canvasLanesNum <= 0) { canvasLanesNum = constants.lanesRange().MIN; }
						if (canvasLanes && Number.isInteger(canvasLanes)) {
							if (canvasLanes <= canvasLanesNum) {
								canvasLanes = canvasLanesNum;
							} else if (canvasLanes > constants.lanesRange().MAX) {
								canvasLanes = constants.lanesRange().MAX;
							}
							config.setCanvasLanes(canvasLanes);
						} else {
							config.setCanvasLanes(canvasLanesNum);
						}
					}

					//config.setShowGrid(settings.showGrid);
					config.setAutoGenNodeNames(settings.autoGenNodeNames);
					config.setHideNodeNames(settings.hideNodeNames);
					config.setShowNodeIcons(constants.getBValue(settings.showNodeIcons));
					config.setShowRefHandles(settings.showRefHandles);
					config.setLinkStyle(getNormalizedLinkStyle(settings.linkStyle));

					if (onOpen) {
						/// DIMENSIONS ///
						if (settings.globalFlowWidth) { config.setGlobalFlowWidth(settings.globalFlowWidth); }
						else { config.resetGlobalFlowWidth(); }
						$("#spinnerNodeWidthId").spinner("value", config.getGlobalFlowWidth());

						if (settings.globalFlowHeight) { config.setGlobalFlowHeight(settings.globalFlowHeight); }
						else { config.resetGlobalFlowHeight(); }
						$("#spinnerNodeHeightId").spinner("value", config.getGlobalFlowHeight());

						if (settings.globalSEWidth) { config.setGlobalSEWidth(settings.globalSEWidth); }
						else { config.resetGlobalSEWidth(); }
						$("#spinnerSEWidthId").spinner("value", config.getGlobalSEWidth());

						if (settings.globalSEHeight) { config.setGlobalSEHeight(settings.globalSEHeight); }
						else { config.resetGlobalSEHeight(); }
						$("#spinnerSEHeightId").spinner("value", config.getGlobalSEHeight());

						if (settings.globalDecisionWidth) { config.setGlobalDecisionWidth(settings.globalDecisionWidth); }
						else { config.resetGlobalDecisionWidth(); }
						$("#spinnerDecisionWidthId").spinner("value", config.getGlobalDecisionWidth());

						if (settings.globalDecisionHeight) { config.setGlobalDecisionHeight(settings.globalDecisionHeight); }
						else { config.resetGlobalDecisionHeight(); }
						$("#spinnerDecisionHeightId").spinner("value", config.getGlobalDecisionHeight());

						/// COLORS ///
						if (settings.processBgnColor) { config.setProcBgnColor(settings.processBgnColor); }
						else { config.resetProcBgnColor(); }
						if (settings.processFgnColor) { config.setProcFgnColor(settings.processFgnColor); }
						else { config.resetProcFgnColor(); }

						if (settings.decisionBgnColor) { config.setDecBgnColor(settings.decisionBgnColor); }
						else { config.resetDecBgnColor(); }
						if (settings.decisionFgnColor) { config.setDecFgnColor(settings.decisionFgnColor); }
						else { config.resetDecFgnColor(); }

						if (settings.ioBgnColor) { config.setIOBgnColor(settings.ioBgnColor); }
						else { config.resetIOBgnColor(); }
						if (settings.ioFgnColor) { config.setIOFgnColor(settings.ioFgnColor); }
						else { config.resetIOFgnColor(); }

						if (settings.seBgnColor) { config.setSEBgnColor(settings.seBgnColor); }
						else { config.resetSEBgnColor(); }
						if (settings.seFgnColor) { config.setSEFgnColor(settings.seFgnColor); }
						else { config.resetSEFgnColor(); }

						if (settings.sideBgnColor) { config.setSideBgnColor(settings.sideBgnColor); }
						else { config.resetSideBgnColor(); }
						if (settings.sideFgnColor) { config.setSideFgnColor(settings.sideFgnColor); }
						else { config.resetSideFgnColor(); }

						if (settings.termBgnColor) { config.setTermBgnColor(settings.termBgnColor); }
						else { config.resetTermBgnColor(); }
						if (settings.termFgnColor) { config.setTermFgnColor(settings.termFgnColor); }
						else { config.resetTermFgnColor(); }

						/// ICONS ///
						if (settings.flowIconKey) { config.setFlowIconKey(settings.flowIconKey); }
						else { config.resetFlowIconKey(); }

						if (settings.flagIconKey) { config.setFlagIconKey(settings.flagIconKey); }
						else { config.resetFlowIconKey(); }

						if (settings.quizIconKey) { config.setQuizIconKey(settings.quizIconKey); }
						else { config.resetQuizIconKey(); }

					}
				}
			};

			// TODO: optimize
			function getNormalizedLinkStyle(value) {
				if (value === constants.linkStyle().SINGLE_ARROW || value === constants.linkStyle().DOUBLE_ARROW) {
					return value;
				} else {
					return constants.linkStyle().SINGLE_ARROW;
				}
			}

			self.getDefaultSettings = function() {
				var settings = {};
				settings.editMode = constants.editMode().EDIT_ALL;
				settings.flowDirection = constants.flow().VERTICAL;
				settings.layoutMode = constants.layoutMode().MANUAL;
				settings.canvasLevels = constants.initial().LEVELS;
				settings.canvasLanes = constants.initial().LANES;
				settings.startEndLevels = constants.settings().SWIM_LEVELS;
				settings.sideSwimLanes = constants.settings().SWIM_LANES;
				settings.showGrid = constants.settings().SHOW_GRID;
				settings.autoGenNodeNames = constants.settings().AUTO_GEN;
				settings.hideNodeNames = constants.settings().HIDE_NAMES;
				settings.showNodeIcons = constants.settings().SHOW_NODE_ICONS;
				settings.showRefHandles = constants.settings().SHOW_REFS;
				//settings.enableAddCorridors = constants.settings().ADD_CORRIDORS;
				settings.linkStyle = constants.linkStyle().SINGLE_ARROW;
				// ...
				return settings;
			};


			/////////////////
			//  descriptors
			/////////////////

			self.addNodeToModel = function(nodeObject) {
				_flowModel.addNodeObject(nodeObject);
			};

			self.removeNodeFromModel = function(nodeObject) {
				_flowModel.removeNodeObject(nodeObject);
			};

			self.addLinkToModel = function(linkObject) {
				_flowModel.addLinkObject(linkObject);
			};

			self.removeLinkFromModel = function(linkObject) {
				//adjustLinkNodes(linkObject);
				return _flowModel.removeLinkObject(linkObject);
			};

			//function adjustLinkNodes(linkObj) {
			//	var links = self.getFlowLinks();
			//	for (var i = 0; i < links.length; i++) {
			//		if (links[i].getName() === linkObj.name) {
			//			var srcNode = links[i].getSourcePort().getNode(),
			//				trgNode = links[i].getTargetPort().getNode();
			//			modelUtils.adjustSize(srcNode);
			//			//srcNode.resetResize();
			//			modelUtils.adjustSize(trgNode);
			//			//trgNode.resetResize();
			//			_flowModel.updateFlowNodes(self.getFlowNodes());
			//			break;
			//		}
			//	}
			//}

			//self.setIndexProperties = function() {
			//	_flowModel.enableIndexProperties();
			//};
			self.setNodeIndexProperty = function(nodeObj) {
				_flowModel.setNodeIndexProperty(nodeObj);
			};

			self.setLinkIndexProperty = function(linkObj) {
				_flowModel.setLinkIndexProperty(linkObj);
			};


			self.clearIndexProperties = function() {
				_flowModel.removeIndexProperties();
			};

			self.removeMultipleFromModel = function(selObjectsMap, emptyCorridorsMap) {
				var i, ii,
					linksList = selObjectsMap.get(LINKS_KEY),
					nodesList = selObjectsMap.get(NODES_KEY);
				if (linksList) {
					for (i = 0; i < linksList.length; i++) {
						self.removeLinkFromModel(linksList[i]);
					}
				}
				if (nodesList) {
					for (i = 0; i < nodesList.length; i++) {
						self.removeNodeFromModel(nodesList[i]);
					}
				}
			};

			self.addMultipleToModel = function(selObjectsMap, emptyCorridorsMap) {
				var i, ii,
					nodesList = selObjectsMap.get(NODES_KEY),
					linksList = selObjectsMap.get(LINKS_KEY);
				if (nodesList) {
					for (i = 0; i < nodesList.length; i++) {
						self.addNodeToModel(nodesList[i]);
					}
				}
				if (linksList) {
					for (i = 0; i < linksList.length; i++) {
						self.addLinkToModel(linksList[i]);
					}
				}
			};

			self.moveNodeToCell = function(nodeObj, toCell) {
				_flowModel.moveNodeObject(nodeObj, toCell.getLevelNumber(), toCell.getLaneNumber())
			};

			self.moveNodeToPipe = function(nodeObj, levelNum, laneNum) {
				//console.log("##&&** modelHandler.moveNodeToPipe: levelNum="+levelNum+", laneNum="+laneNum);
				_flowModel.moveNodeObject(nodeObj, levelNum, laneNum)
			};

			self.renameNodeInModel = function(selObjectsMap, oldNodeName, newNodeName) {
				var i, idx, nodeName,
					newSource, newTarget,
					linksList = selObjectsMap.get(LINKS_KEY);
				var newNodesList = [], newLinksList = [];
				if (linksList) {
					for (i = 0; i < linksList.length; i++) {
						newSource = undefined;
						newTarget = undefined;
						var linkObj = linksList[i];
						var source = linkObj.source;
						idx = source.indexOf('/');
						nodeName = source.substring(0, idx);
						if (nodeName == oldNodeName) {
							newSource = source.replace(oldNodeName, newNodeName);
						}
						var target = linkObj.target;
						idx = target.indexOf('/');
						nodeName = target.substring(0, idx);
						if (nodeName === oldNodeName) {
							newTarget = target.replace(oldNodeName, newNodeName);
						}
						var newLinkObj = _flowModel.renameLinkObject(linkObj, newSource, newTarget);
						newLinksList.push(newLinkObj);
					}
				}
				var nodesList = selObjectsMap.get(NODES_KEY);
				if (nodesList) {
					for (i = 0; i < nodesList.length; i++) {
						var nodeObj = nodesList[i];
						if (nodeObj.name === oldNodeName) {
							var newNodeObj = _flowModel.renameNodeObject(nodeObj, newNodeName);
							newNodesList.push(newNodeObj);
						}
					}
				}
				//_flowModel.updateFlowNodes(self.getFlowNodes());
				//_flowModel.updateFlowLinks(self.getFlowLinks());
				var newMap = new Map();
				newMap.put(NODES_KEY, newNodesList);
				newMap.put(LINKS_KEY, newLinksList);
				return newMap;
			};

			self.changeDecisionEnds = function(nodeObj, newInput, newEnds) {
				_flowModel.changeDecisionEnds(nodeObj, newInput, newEnds);
			};

			self.modifyNodeContentText = function(node, text, textAbove, textBelow) {
				var nodes = self.getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].equals(node)) {
						nodes[i].setContentText(text);
						nodes[i].setContentTextAbove(textAbove);
						nodes[i].setContentTextBelow(textBelow);
						modelUtils.adjustSize(nodes[i]);
						_manager.setDirty(true);
						break;
					}
				}
				_flowModel.updateFlowNodes(nodes);
				//_flowModel.modifyNodeContent(nodeObj, text);
			};

			self.getSelectionsMapForItem = function(item) {
				var list = [];
				list.push(item);
				return self.getSelectionObjectsMap(list);
			};

			self.getSelectionObjectsMap = function(selections) {
				var nodesList = [], linksList = [];
				// append containers content: WRONG !!!
				//selections.forEach(function(item) {
				//	if (item.getId() === constants.elementType().NODE &&
				//		item.getFlowType() === constants.flowType().CONTAINER) {
				//		var contentNames = item.getNodeNames();
				//		contentNames.forEach(function(name) {
				//			var node = flowUtils.getNodeByName(_flowModel, name);
				//			selections.push(node);
				//		});
				//	}
				//});
				for (var i = 0; i < selections.length; i++) {
					var item = selections[i], linkObj;
					if (item.getId() === constants.elementType().NODE) {
						var nodeObj = item.getNodeObject();
						self.setNodeIndexProperty(nodeObj);
						//console.log("  ?? selected node: "+nodeObj.order);
						nodesList.push(nodeObj);
						var ports = item.getConnectionPorts();
						for (var j = 0; j < ports.length; j++) {
							var links = ports[j].getEdgesList();
							for (var k = 0; k < links.length; k++) {
								linkObj = links[k].getLinkObject();
								self.setLinkIndexProperty(linkObj);
								linksList.push(linkObj);
							}
						}
					} else if (item.getId() === constants.elementType().EDGE) {
						linkObj = item.getLinkObject();
						self.setLinkIndexProperty(linkObj);
						//console.log("  ?? selected link: "+linkObj.order);
						linksList.push(linkObj);
					}
				}
				var selMap = new Map();
				if (nodesList.length > 0) {
					selMap.put(NODES_KEY, nodesList);
				}
				if (linksList.length > 0) {
					selMap.put(LINKS_KEY, linksList);
				}
				return selMap;
			};

			self.getClipboardObjectsMap = function(selections) {
				var nodesList = [], linksList = [];
				selections.forEach(function(item) {
					if (item.getId() === constants.elementType().NODE)
					//	item.getId() === constants.elementType().CONTAINER) {
					//if ((item.getFlowType() === constants.flowType().PROCESS ||
					//	item.getFlowType() === constants.flowType().DECISION ||
					//	item.getFlowType() === constants.flowType().IN_OUT ||
					//	item.getFlowType() === constants.flowType().CONTAINER)
					{
						var nodeObj = item.getNodeObject();
						nodesList.push(nodeObj);
						if (item.getFlowType() === constants.flowType().CONTAINER) {
							var nodeNames = item.getNodeNames();
							nodeNames.forEach(function(name) {
								var node = flowUtils.getNodeByName(_flowModel, name);
								if (node) {
									nodesList.push(node.getNodeObject());
								}
							});
						}
					}
				});
				selections.forEach(function(item) {
					if (item.getId() === constants.elementType().EDGE) {
						var srcNode = item.getSourceNode(),
							trgNode = item.getTargetNode(),
							hasSource = false, hasTarget = false;
						for (var i = 0; i < nodesList.length; i++) {
							var node = nodesList[i];
							if (srcNode.getName() === node.name) { hasSource = true; }
							if (trgNode.getName() === node.name) { hasTarget = true; }
							if (hasSource && hasTarget) { break; }
						}
						if (hasSource && hasTarget) {
							var linkObj = item.getLinkObject();
							linksList.push(linkObj);
						}
					}
				});
				var selMap = new Map();
				selMap.put(NODES_KEY, nodesList);
				selMap.put(LINKS_KEY, linksList);
				return selMap;
			};

			self.printClipboard = function(map) {
				var nodes = map.get(NODES_KEY),
					links = map.get(LINKS_KEY);
				nodes.forEach(function(item) {
					console.log("node: "+item.name);
				});
				links.forEach(function(item) {
					console.log("link: "+item.name);
				});
			};


			// REMOVE EMPTY CORRIDORS
			self.removeEmptyCorridors = function(levelIdx, laneIdx, isTotal) {
				var i, nObj, nodeObjects = _flowModel.getNodeObjects(),
					flowLayout = _manager.getFlowDiagram().getFlowLayout();
				var levelEmpty = _flowModel.isLevelEmpty(levelIdx);
				if (levelIdx >= 0 && levelEmpty) {
					//var minLevelNum = flowUtils.getMinLevelNumber();
					var maxLevelNum = flowUtils.getMaxLevelNumber(flowLayout);
					if (levelIdx <= maxLevelNum) {
						for (i = 0; i < nodeObjects.length; i++) {
							nObj = nodeObjects[i];
							if (nObj.levelNum > levelIdx) {
								nObj.levelNum--;
							}
						}
					}
					config.removeCanvasLevel();
				}
				var laneEmpty = _flowModel.isLaneEmpty(laneIdx);
				if (laneIdx >= 0 && laneEmpty) {
					//var minLaneNum = flowUtils.getMinLaneNumber();
					var maxLaneNum = flowUtils.getMaxLaneNumber(flowLayout);
					if (laneIdx <= maxLaneNum) {
						for (i = 0; i < nodeObjects.length; i++) {
							nObj = nodeObjects[i];
							if (nObj.laneNum > laneIdx) {
								nObj.laneNum--;
							}
						}
					}
					config.removeCanvasLane();
				}
			};

			// ADD CORRIDORS: isTotal is always true
			self.addCorridors = function(levelIdx, laneIdx, isTotal) {
				var i, nObj, nodeObjects = _flowModel.getNodeObjects(),
					flowLayout = _manager.getFlowDiagram().getFlowLayout();
				if (levelIdx >= 0) {
					//var minLevelNum = flowUtils.getMinLevelNumber();
					var maxLevelNum = isTotal ?
						flowUtils.getTotalMaxLevelNumber(flowLayout) : flowUtils.getMaxLevelNumber(flowLayout);
					if (levelIdx  <= maxLevelNum) {
						for (i = 0; i < nodeObjects.length; i++) {
							nObj = nodeObjects[i];
							if (nObj.levelNum >= levelIdx) {
								nObj.levelNum++;
							}
						}
					}
					config.addCanvasLevel();
				}
				if (laneIdx >= 0) {
					//var minLaneNum = flowUtils.getMinLaneNumber();
					var maxLaneNum = isTotal ?
						flowUtils.getTotalMaxLaneNumber(flowLayout) : flowUtils.getMaxLaneNumber(flowLayout);
					if (laneIdx <= maxLaneNum) {
						for (i = 0; i < nodeObjects.length; i++) {
							nObj = nodeObjects[i];
							if (nObj.laneNum >= laneIdx) {
								nObj.laneNum++;
							}
						}
					}
					config.addCanvasLane();
				}
			};

			////////////
			// EXPAND
			self.doContainerExpand = function(container, flowLayout,
											  startLevelIdx, endLevelIdx,
											  startLaneIdx, endLaneIdx) {

				var nodes = _flowModel.getFlowNodes(),
					nodeLevelIdx = container.getLevelNumber(),
					nodeLaneIdx = container.getLaneNumber(),
					stepsAlong = 0, alongIdx,
					stepsAcrossMin = 0, acrossMinIdx,
					stepsAcrossMax = 0, acrossMaxIdx,
					i;
				// ALONG: only downward
				if (endLevelIdx > nodeLevelIdx) {
					for (i = nodeLevelIdx+1; i <= endLevelIdx; i++) {
						var currLevel = flowLayout.getLevels()[i];
						if (!currLevel.hasLaneRangeEmpty(startLaneIdx, endLaneIdx)) {
						//if (getOutsideNodesAtLevel(currLevel.getNodes(), container).length > 0) {
						//	stepsAlong = endLevelIdx - i + 1;
							stepsAlong++;
							alongIdx = i;
							break;
						}
					}
					if (stepsAlong > 0) {
						for (i = 0; i < nodes.length; i++) {
							if (nodes[i].getLevelNumber() >= alongIdx &&
								(!nodes[i].getContainerName() || nodes[i].getContainerName() !== container.getName())) {
								// not in any other container block
								nodes[i].setLevelNumber(nodes[i].getLevelNumber()+stepsAlong);
							}
						}
						for (i = 0; i < stepsAlong; i++) {
							//config.addCanvasLevel();
						}
					}
				}
				// ACROSS: both left and right
				// left
				if (startLaneIdx < nodeLaneIdx) {
					for (i = nodeLaneIdx-1; i >= startLaneIdx; i--) {
						var leftLane = flowLayout.getLanes()[i];
						if (!leftLane.hasLevelRangeEmpty(startLevelIdx, endLevelIdx)) {
							stepsAcrossMin = i - startLaneIdx + 1;
							acrossMinIdx = i;
							break;
						}
					}
					if (stepsAcrossMin > 0) {
						for (i = 0; i < nodes.length; i++) {
							if (nodes[i].getLaneNumber() >= acrossMinIdx &&
								(!nodes[i].getContainerName() || nodes[i].getContainerName() !== container.getName())) {
								// not in any other container block
								nodes[i].setLaneNumber(nodes[i].getLaneNumber()+stepsAcrossMin);
							}
						}
						for (i = 0; i < stepsAcrossMin; i++) {
							//config.addCanvasLane();
						}
					}
				}
				// right
				if (endLaneIdx > nodeLaneIdx) {
					for (i = nodeLaneIdx+1; i <= endLaneIdx; i++) {
						var rightLane = flowLayout.getLanes()[i];
						if (!rightLane.hasLevelRangeEmpty(startLevelIdx, endLevelIdx)) {
							stepsAcrossMax = endLaneIdx - i + 1;
							acrossMaxIdx = i;
							break;
						}
					}
					if (stepsAcrossMax > 0) {
						for (i = 0; i < nodes.length; i++) {
							if (nodes[i].getLaneNumber() >= acrossMaxIdx &&
								(!nodes[i].getContainerName() || nodes[i].getContainerName() !== container.getName())) {
								// not in any other container block
								nodes[i].setLaneNumber(nodes[i].getLaneNumber()+stepsAcrossMax);
							}
						}
						for (i = 0; i < stepsAcrossMax; i++) {
							//config.addCanvasLane();
						}
					}
				}
			};

			//////////////
			// COLLAPSE
			self.doContainerCollapse = function(container, flowLayout,
												startLevelIdx, endLevelIdx,
												startLaneIdx, endLaneIdx) {

				var nodes = _flowModel.getFlowNodes(),
					nodeLevelIdx = container.getLevelNumber(),
					nodeLaneIdx = container.getLaneNumber(),
					stepsAlong = 0, alongIdx,
					stepsAcrossMin = 0, acrossMinIdx,
					stepsAcrossMax = 0, acrossMaxIdx,
					i;
				// ALONG: only bottom up
				if (endLevelIdx > nodeLevelIdx) {
					stepsAlong = endLevelIdx - nodeLevelIdx;
					for (i = nodeLevelIdx+1; i <= endLevelIdx; i++) {
						var currLevel = flowLayout.getLevels()[i],
							outerNodes = getOutsideNodesAtLevel(currLevel.getNodes(), container);
						if (outerNodes.length > 0) {
							//stepsAlong = i - nodeLevelIdx - 1;
							stepsAlong--;
							alongIdx = i;
							break;
						}
					}
					if (stepsAlong > 0) {
						// TODO: do we need to shrink the whole diagram
						//for (i = 0; i < nodes.length; i++) {
						//	if (nodes[i].getLevelNumber() >= alongIdx &&
						//		(!nodes[i].getContainerName() || nodes[i].getContainerName() !== container.getName())) {
						//		// not in any other container block
						//		nodes[i].setLevelNumber(nodes[i].getLevelNumber()-stepsAlong);
						//	}
						//}
						//for (i = 0; i < stepsAlong; i++) {
						//	//config.removeCanvasLevel();
						//}
					}
				}
				// ACROSS: both left and right
				// left
				if (startLaneIdx < nodeLaneIdx) {
					for (i = nodeLaneIdx-1; i >= startLaneIdx; i--) {
						var leftLane = flowLayout.getLanes()[i],
							leftNodes = excludeContainerNodes(leftLane.getNodes(), container);
						//if (!leftLane.hasLevelRangeEmpty(startLevelIdx, endLevelIdx)) {
						if (leftNodes.length > 0) {
							stepsAcrossMin = i - nodeLaneIdx - 1;
							acrossMinIdx = i;
							break;
						}
					}
					if (stepsAcrossMin > 0) {
						// TODO: do we need to shrink the whole diagram
						//for (i = 0; i < nodes.length; i++) {
						//	if (nodes[i].getLaneNumber() > acrossMinIdx) { //} &&
						//		//(!nodes[i].getContainerName() || nodes[i].getContainerName() !== container.getName())) {
						//		// not in any other container block
						//		nodes[i].setLaneNumber(nodes[i].getLaneNumber()-stepsAcrossMin);
						//	}
						//}
						//for (i = 0; i < stepsAcrossMin; i++) {
						//	config.removeCanvasLane();
						//}
					}
				}
				// right
				if (endLaneIdx > nodeLaneIdx) {
					for (i = nodeLaneIdx+1; i <= endLaneIdx; i++) {
						var rightLane = flowLayout.getLanes()[i],
							rightNodes = excludeContainerNodes(rightLane.getNodes(), container);
						//if (!rightLane.hasLevelRangeEmpty(startLevelIdx, endLevelIdx)) {
						if (rightNodes.length > 0) {
							stepsAcrossMax = endLaneIdx - i + 1;
							acrossMaxIdx = i;
							break;
						}
					}
					if (stepsAcrossMax > 0) {
						// TODO: do we need to shrink the whole diagram
						//for (i = 0; i < nodes.length; i++) {
						//	if (nodes[i].getLaneNumber() >= acrossMaxIdx) { //} &&
						//		//(!nodes[i].getContainerName() || nodes[i].getContainerName() !== container.getName())) {
						//		// not in any other container block
						//		nodes[i].setLaneNumber(nodes[i].getLaneNumber()-stepsAcrossMax);
						//	}
						//}
						//for (i = 0; i < stepsAcrossMax; i++) {
						//	config.removeCanvasLane();
						//}
					}
				}
			};

			////////////
			// get all nodes that are not inside this container
			function excludeContainerNodes(nodes, container) {
				var filtered = [];
				for (var i = 0; i < nodes.length; i++) {
					if (!nodes[i].getContainerName() || nodes[i].getContainerName() !== container.getName()) {
						filtered.push(nodes[i]);
					}
				}
				return filtered;
			}

			function getOutsideNodesAtLevel(nodes, container) {
				var outsiders = [],
					startLaneIdx = container.getStartLaneNumber(),
					endLaneIdx = container.getEndLaneNumber();
				for (var i = 0; i < nodes.length; i++) {
					var laneIdx = nodes[i].getLaneNumber();
					if (laneIdx < startLaneIdx || laneIdx > endLaneIdx) {
						outsiders.push(nodes[i]);
					}
				}
				return outsiders;
			}

			function getOutsideNodesAtLane(nodes, container) {
				var outsiders = [],
					startLevelIdx = container.getStartLevelNumber(),
					endLevelIdx = container.getEndLevelNumber();
				for (var i = 0; i < nodes.length; i++) {
					var levelIdx = nodes[i].getLevelNumber();
					if (levelIdx < startLevelIdx || levelIdx > endLevelIdx) {
						outsiders.push(nodes[i]);
					}
				}
				return outsiders;
			}

			/////////////
			// expanded container resized

			self.resizeExpandedContainer = function(containerObj, flowLayout, resizeParam, undoParam) {

				var nodeObjects = _flowModel.getNodeObjects(),
					i,
					startLevelIdx = containerObj.startLevelNum,
					endLevelIdx = containerObj.endLevelNum,
					startLaneIdx = containerObj.startLaneNum,
					endLaneIdx = containerObj.endLaneNum;

				if (resizeParam === constants.blockResize().EXTEND_ALONG) {
					//if (undoParam) {
					// TODO: only when auto-resize is implemented, needs to be revisited
					var nextEndLevel = flowLayout.getLevels()[endLevelIdx + 1];
						if (!nextEndLevel.hasLaneRangeEmpty(startLaneIdx, endLaneIdx) ||
							nextEndLevel.hasContainerIntersection(_manager) ||
							flowUtils.hasConflictToSiblingAlong(_flowModel, containerObj, endLevelIdx)) {
							for (i = 0; i < nodeObjects.length; i++) {
								if (nodeObjects[i].levelNum > endLevelIdx &&
									(!nodeObjects[i].containerName || nodeObjects[i].containerName !== containerObj.name)) {
									// not in another container block
									nodeObjects[i].levelNum = nodeObjects[i].levelNum + 1;
								}
							}
							//config.addCanvasLevel();
						}
					//}
					containerObj.endLevelNum = endLevelIdx+1;
				} else if (resizeParam === constants.blockResize().SHRINK_ALONG) {
					//if (undoParam) {
					// TODO: only when auto-resize is implemented, needs to be revisited
					var endLevel = flowLayout.getLevels()[endLevelIdx];
						if (!endLevel.containsNodes() &&
							!flowUtils.hasStartEndLevelsConflictAlong(_flowModel, containerObj)) {
							for (i = 0; i < nodeObjects.length; i++) {
								if (nodeObjects[i].levelNum > endLevelIdx) {
									// not in another container block
									nodeObjects[i].levelNum = nodeObjects[i].levelNum-1;
								}
							}
							//config.removeCanvasLevel();
						}
					//}
					containerObj.endLevelNum = endLevelIdx-1;
				}

				if (resizeParam === constants.blockResize().EXTEND_ACROSS) {
					//if (undoParam) {
					//	var prevStartLane = flowLayout.getLanes()[startLaneIdx - 1],
					//		nextEndLane = flowLayout.getLanes()[endLaneIdx + 1],
					//		shift = 0;
					//	if (!prevStartLane.hasLevelRangeEmpty(startLevelIdx, endLevelIdx) ||
					//		flowUtils.hasConflictToSiblingAcross(_flowModel, containerObj)) {
					//		for (i = 0; i < nodeObjects.length; i++) {
					//			if (nodeObjects[i].laneNum >= startLaneIdx) {
					//				nodeObjects[i].laneNum = nodeObjects[i].laneNum + 1;
					//			}
					//		}
					//		shift++;
					//		config.addCanvasLane();
					//	} else {
					//		containerObj.startLaneNum = startLaneIdx - 1;
					//	}
					//	if (!nextEndLane.hasLevelRangeEmpty(startLevelIdx, endLevelIdx) ||
					//		flowUtils.hasConflictToSiblingAcross(_flowModel, containerObj)) {
					//		for (i = 0; i < nodeObjects.length; i++) {
					//			if (nodeObjects[i].laneNum > endLaneIdx + shift) {
					//				nodeObjects[i].laneNum = nodeObjects[i].laneNum + 1;
					//			}
					//		}
					//		shift++;
					//		config.addCanvasLane();
					//	} else {
					//		shift++;
					//	}
					//	containerObj.endLaneNum = endLaneIdx+shift;
					//} else {
						containerObj.startLaneNum = startLaneIdx-1;
						containerObj.endLaneNum = endLaneIdx+1;
					//}

				} else if (resizeParam === constants.blockResize().SHRINK_ACROSS) {
					//if (undoParam) {
					//	var startLane = flowLayout.getLanes()[startLaneIdx],
					//		endLane = flowLayout.getLanes()[endLaneIdx],
					//		shift = 0;
					//	if (!startLane.containsNodes() &&
					//		!flowUtils.hasStartEndLanesConflictAcross(_flowModel, containerObj)) {
					//		for (i = 0; i < nodeObjects.length; i++) {
					//			//if (nodes[i].getLaneNumber() > startLaneIdx && nodes[i].getLaneNumber() < endLaneIdx) {
					//			if (nodeObjects[i].laneNum > startLaneIdx) {
					//				nodeObjects[i].laneNum = nodeObjects[i].laneNum-1;
					//			}
					//		}
					//		shift++;
					//		config.removeCanvasLane();
					//	} else {
					//		containerObj.startLaneNum = startLaneIdx+1;
					//	}
					//	if (!endLane.containsNodes() &&
					//		!flowUtils.hasStartEndLanesConflictAcross(_flowModel, containerObj)) {
					//		for (i = 0; i < nodeObjects.length; i++) {
					//			if (nodeObjects[i].laneNum > endLaneIdx-shift) {
					//				nodeObjects[i].laneNum = nodeObjects[i].laneNum-1;
					//			}
					//		}
					//		shift++;
					//		config.removeCanvasLane();
					//	}
					//	containerObj.endLaneNum = endLaneIdx-1;
					//} else {
						containerObj.startLaneNum = startLaneIdx+1;
						containerObj.endLaneNum = endLaneIdx-1;
					//}
				}
				//console.log("## resize: "+containerObj.name+", across="+(containerObj.endLaneNum - containerObj.startLaneNum)+
				//			", along="+(containerObj.endLevelNum - containerObj.startLevelNum));
				_flowModel.resizeContainerOutline(
					containerObj,
					containerObj.endLaneNum - containerObj.startLaneNum,
					containerObj.endLevelNum - containerObj.startLevelNum);
				_manager.refreshDiagramOnEdit();

			};

			/////////////

			self.resizeSwitch = function(switchObj, flowLayout, resizeParam, undoParam) {

				var startLaneIdx = switchObj.startLaneNum,
					endLaneIdx = switchObj.endLaneNum,
					currHooks = switchObj.hooks; //endLaneIdx - startLaneIdx + 1;

				if (resizeParam === constants.blockResize().EXTEND_ACROSS) {
					currHooks++;

				} else if (resizeParam === constants.blockResize().SHRINK_ACROSS) {
					currHooks = currHooks > 1 ? currHooks-1 : 1;
				}
				//console.log("## resize: "+switchObj.name+", across="+(switchObj.endLaneNum - switchObj.startLaneNum)+
				//			", along="+(switchObj.endLevelNum - switchObj.startLevelNum));

				var laneOffsets = flowUtils.getSwitchHookOffsets(currHooks);
				switchObj.startLaneNum = startLaneIdx - laneOffsets.startLaneOffset;
				switchObj.endLaneNum = endLaneIdx + laneOffsets.endLaneOffset;
				switchObj.hooks = currHooks;
				_flowModel.resizeSwitchOutline(switchObj);
				_manager.refreshDiagramOnEdit();

			};

			/////////////

			self.addCopyPaste = function(
				startLevelIdx, newLevelsNum,
				startLaneIdx, newLanesNum,
				newNodeObjects, newLinkObjects) {

				var nodeObjects = _flowModel.getNodeObjects(),
					linkObjects = _flowModel.getLinkObjects(), i;

				for (i = 0; i < nodeObjects.length; i++) {
					if (nodeObjects[i].levelNum >= startLevelIdx) {
						nodeObjects[i].levelNum += newLevelsNum;
					}
				}
				for (i = 0; i < nodeObjects.length; i++) {
					if (nodeObjects[i].laneNum >= startLaneIdx) {
						nodeObjects[i].laneNum += newLanesNum;
					}
				}

				_flowModel.setNodeObjects(nodeObjects.concat(newNodeObjects));
				_flowModel.setLinkObjects(linkObjects.concat(newLinkObjects));

				for (i = 0; i < newLevelsNum; i++) {
					config.addCanvasLevel();
				}
				for (i = 0; i < newLanesNum; i++) {
					config.addCanvasLane();
				}
				_manager.refreshDiagramOnEdit();
			};

			//
			self.removeCopyPaste = function(
				startLevelIdx, newLevelsNum,
				startLaneIdx, newLanesNum,
				newNodeObjects, newLinkObjects) {

				var nodeObjects = _flowModel.getNodeObjects(),
					linkObjects = _flowModel.getLinkObjects(),
					i, j;

				for (i = nodeObjects.length-1; i >= 0; i--) {
					for (j = 0; j < newNodeObjects.length; j++) {
						if (nodeObjects[i].name === newNodeObjects[j].name) {
							nodeObjects.splice(i, 1);
							break;
						}
					}
				}
				for (i = linkObjects.length-1; i >= 0; i--) {
					for (j = 0; j < newLinkObjects.length; j++) {
						if (linkObjects[i].name === newLinkObjects[j].name) {
							linkObjects.splice(i, 1);
							break;
						}
					}
				}

				for (i = 0; i < nodeObjects.length; i++) {
					if (nodeObjects[i].levelNum > startLevelIdx) {
						nodeObjects[i].levelNum -= newLevelsNum;
					}
				}
				for (i = 0; i < nodeObjects.length; i++) {
					if (nodeObjects[i].laneNum > startLaneIdx) {
						nodeObjects[i].laneNum -= newLanesNum;
					}
				}

				for (i = 0; i < newLevelsNum; i++) {
					config.removeCanvasLevel();
				}
				for (i = 0; i < newLanesNum; i++) {
					config.removeCanvasLane();
				}
				_manager.refreshDiagramOnEdit();
			};

			///////////////

			self.addForcedCrossingToLink = function(link, pipeXing, cornerType) {
				var links = self.getFlowLinks();
				for (var i = 0; i < links.length; i++){
					if (links[i].equals(link)) {
						links[i].addForcedCrossing(pipeXing, cornerType);
						break;
					}
				}
				_flowModel.updateFlowLinks(links);
			};

			self.setForcedCrossingToLink = function(link, pipeXing, idx) {
				var links = self.getFlowLinks();
				for (var i = 0; i < links.length; i++){
					if (links[i].equals(link)) {
						links[i].setForcedCrossing(pipeXing, idx);
						break;
					}
				}
				_flowModel.updateFlowLinks(links);
			};

			self.removeForcedCrossingFromLink = function(link, pipeXing) {
				var links = self.getFlowLinks(), rmIdx = -1;
				for (var i = 0; i < links.length; i++){
					if (links[i].equals(link)) {
						rmIdx = links[i].removeForcedCrossing(pipeXing);
						break;
					}
				}
				_flowModel.updateFlowLinks(links);
				return rmIdx;
			};

			self.clearAllForcedCrossings = function() {
				var links = self.getFlowLinks();
				for (var i = 0; i < links.length; i++){
					links[i].clearForcedCrossings();
				}
				_flowModel.updateFlowLinks(links);
			};

			self.haveLinksForcedCrossings = function() {
				var links = self.getFlowLinks();
				for (var i = 0; i < links.length; i++){
					if (links[i].hasForcedCrossings()) {
						return true;
					}
				}
				return false;
			};

			///////////////

			self.setSegmentShift = function(link, segmentOrder, shift) {
				var links = self.getFlowLinks();
				for (var i = 0; i < links.length; i++){
					if (links[i].equals(link)) {
						links[i].setSegmentShift(segmentOrder, shift);
					}
				}
				_flowModel.updateFlowLinks(links);
			};

			self.resetSegmentShift = function(link, segmentOrder, shift) {
				var links = self.getFlowLinks();
				for (var i = 0; i < links.length; i++){
					if (links[i].equals(link) && links[i].hasSegmentShifts()) {
						links[i].setSegmentShift(segmentOrder, shift);
					}
				}
				_flowModel.updateFlowLinks(links);
			};

			self.clearAllSegmentShifts = function() {
				var links = self.getFlowLinks();
				for (var i = 0; i < links.length; i++){
					links[i].clearSegmentShifts();
				}
				_flowModel.updateFlowLinks(links);
			};

			self.haveLinksSegmentShifts = function() {
				var links = self.getFlowLinks();
				for (var i = 0; i < links.length; i++){
					if (links[i].getTotalShifts().length > 0) {
						return true;
					}
				}
				return false;
			};

			///////////////

			self.clearSegmentEditsToLinks = function(shiftsNames, crossingsNames) {
				var links = self.getFlowLinks();
				for (var i = 0; i < links.length; i++){
					for (var j = 0; j < shiftsNames.length; j++) {
						if (links[i].getName().localeCompare(shiftsNames[j]) === 0) {
							links[i].clearSegmentShifts();
						}
					}
					for (var k = 0; k < crossingsNames.length; k++) {
						if (links[i].getName().localeCompare(crossingsNames[k]) === 0) {
							links[i].clearForcedCrossings();
						}
					}
				}
				_flowModel.updateFlowLinks(links);
			};

			self.restoreSegmentEditsToLinks = function(shiftsMap, crossingsMap) {
				var links = self.getFlowLinks(),
					shiftsKeys = shiftsMap.keys(),
					crossingsKeys = crossingsMap.keys();
				for (var i = 0; i < links.length; i++){
					for (var j = 0; j < shiftsKeys.length; j++) {
						if (links[i].getName().localeCompare(shiftsKeys[j]) === 0) {
							links[i].setSegmentShifts(shiftsMap.get(shiftsKeys[j]));
						}
					}
					for (var k = 0; k < shiftsKeys.length; k++) {
						if (links[i].getName().localeCompare(crossingsKeys[k]) === 0) {
							links[i].setForcedCrossings(crossingsMap.get(crossingsKeys[k]));
						}
					}
				}
				_flowModel.updateFlowLinks(links);
			};

			///////////////

			self.setNodeResize = function(node, resizeW, resizeH) {
				var nodes = self.getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].equals(node)) {
						nodes[i].setResize(resizeW, resizeH);
						_manager.setDirty(true);
						break;
					}
				}
				_flowModel.updateFlowNodes(nodes);
			};

			self.resetNodeResize = function(node) {
				node.resetResize();
				_manager.setDirty(true);
				_flowModel.updateFlowNodes(self.getFlowNodes());
				_manager.refreshDiagramOnEdit();
			};

			self.haveNodesResizeValues = function() {
				var nodes = self.getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].hasResizeValues()) {
						return true;
					}
				}
				return false;
			};

			self.clearNodesResizeValues = function(resizeNames) {
				var nodes = self.getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					for (var j = 0; j < resizeNames.length; j++) {
						if (nodes[i].getName().localeCompare(resizeNames[j]) === 0) {
							nodes[i].resetResize();
						}
					}
				}
				_flowModel.updateFlowNodes(nodes);
			};

			self.restoreNodesResizeValues = function(resizeMap) {
				var nodes = self.getFlowNodes(),
					names = resizeMap.keys();
				for (var i = 0; i < nodes.length; i++) {
					for (var j = 0; j < names.length; j++) {
						if (nodes[i].getName().localeCompare(names[j]) === 0) {
							var params = resizeMap.get(names[j]);
							nodes[i].setResize(params.rW, params.rH);
						}
					}
				}
				_flowModel.updateFlowNodes(nodes);
			};

			///////////////

			self.getPipeXSection = function(nodeLevelNum, nodeLaneNum, insertLevelNum, insertLaneNum) {
				if (insertLaneNum > 0 && nodeLevelNum > 0) {
					var level = _manager.getFlowLayout().getLevels()[nodeLevelNum],
						lanePipe = _manager.getFlowLayout().getLanePipes()[insertLaneNum];
					return lanePipe.intersection(level);
				} else if (insertLevelNum > 0 && nodeLaneNum > 0) {
					var lane = _manager.getFlowLayout().getLanes()[nodeLaneNum],
						levelPipe = _manager.getFlowLayout().getLevelPipes()[insertLevelNum];
					return levelPipe.intersection(lane);
				}
				return undefined;
			};

			function getLinksWithSegmentShifts() {
				var links = self.getFlowLinks(),
					dirtyLinks = [];
				for (var i = 0; i < links.length; i++){
					if (links[i].hasSegmentShifts()) {
						dirtyLinks.push(links[i]);
					}
				}
				return dirtyLinks;
			}

			self.getLinksCrossingCell = function(cell) {
				var xLinks = [];
				if (cell) {
					var dirtyLinks = getLinksWithSegmentShifts();
					for (var i = 0; i < dirtyLinks.length; i++) {
						var link = dirtyLinks[i],
							segments = dirtyLinks[i].getSegments();
						for (var j = 0; j < segments.length; j++) {
							if (cell.isLineIntersecting(segments[j].getStartPoint(), segments[j].getEndPoint())) {
								xLinks.push(link);
								break;
							}
						}
					}
				}
				return xLinks;
			};

			self.changeStartEndLevels = function(change) {
				var i, nodes = self.getFlowNodes();
				for (i = 0; i < nodes.length; i++) {
					if (nodes[i].getFlowType() === constants.flowType().START ||
							nodes[i].getFlowType() === constants.flowType().END) {
						continue;
					}
					if (change === constants.change().UP) {
						nodes[i].levelNum++;
					} else if (change === constants.change().DOWN) {
						nodes[i].levelNum--;
					}
				}
				_flowModel.updateFlowNodes(nodes);
				_manager.getCaller().updateWindow();
				_manager.refreshDiagramOnEdit();
			};

			self.changeSideSwimLanes = function(change) {
				var i, nodes = self.getFlowNodes();
				for (i = 0; i < nodes.length; i++) {
					if (nodes[i].getFlowType() === constants.flowType().LEFT_TOP ||
						nodes[i].getFlowType() === constants.flowType().RIGHT_BOTTOM) {
						continue;
					}
					if (change === constants.change().UP) {
						nodes[i].laneNum++;
					} else if (change === constants.change().DOWN) {
						nodes[i].laneNum--;
					}
				}
				_flowModel.updateFlowNodes(nodes);
				_manager.getCaller().updateWindow();
				_manager.refreshDiagramOnEdit();
			};

			function normalizeStartEndLevels(content) {
				if (config.hasStartEndLevels() && hasZeroLevels(content)) {
					var nodes = content.nodes;
					for (var i = 0; i < nodes.length; i++) {
						nodes[i].levelNum++;
					}
				}
			}
			function normalizeSideSwimLanes(content) {
				if (config.hasSideSwimLanes() && hasZeroLanes(content)) {
					var nodes = content.nodes;
					for (var i = 0; i < nodes.length; i++) {
						nodes[i].laneNum++;
					}
				}
			}

			function hasZeroLevels(content) {
				var nodes = content.nodes;
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].type === constants.flowType().START ||
						nodes[i].type === constants.flowType().END) {
						continue;
					}
					if (nodes[i].levelNum === 0) {
						return true;
					}
				}
				return false;
			}
			function hasZeroLanes(content) {
				var nodes = content.nodes;
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].type === constants.flowType().LEFT_TOP ||
						nodes[i].type === constants.flowType().RIGHT_BOTTOM) {
						continue;
					}
					if (nodes[i].laneNum === 0) {
						return true;
					}
				}
				return false;
			}
			//function getEmptyLevelNumbers() {
			//	var elNums = [],
			//		flowLayout = _manager.getFlowDiagram().getFlowLayout();
			//	var min = flowUtils.getMinLevelNumber();
			//	var max = flowUtils.getMaxLevelNumber(flowLayout);
			//	for (var i = min; i <= max; i++) {
			//		if (_flowModel.isLevelEmpty(i)) {
			//			elNums.push(i);
			//		}
			//	}
			//	return elNums;
			//}

			//function getEmptyLaneNumbers() {
			//	var elNums = [],
			//		flowLayout = _manager.getFlowDiagram().getFlowLayout();
			//	var min = flowUtils.getMinLaneNumber();
			//	var max = flowUtils.getMaxLaneNumber(flowLayout);
			//	for (var i = min; i <= max; i++) {
			//		if (_flowModel.isLaneEmpty(i)) {
			//			elNums.push(i);
			//		}
			//	}
			//	return elNums;
			//}
		}
		return ModelHandler;
	}
);
