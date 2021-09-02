define('modules/controller/flowController',
	['modules/undo/undoHandler',
		'modules/model/addNodeUndoableAction',
		'modules/model/insertNodeUndoableAction',
		'modules/model/moveNodeToCellUndoableAction',
		'modules/model/moveNodeToPipeUndoableAction',
		'modules/model/addLinkUndoableAction',
		'modules/model/removeLinkUndoableAction',
		'modules/model/removeMultipleUndoableAction',
		'modules/model/renameNodeUndoableAction',
		'modules/model/changeDecisionEndsUndoableAction',
		'modules/model/modifyContentUndoableAction',
		'modules/model/addCorridorsUndoableAction',
		'modules/model/removeCorridorsUndoableAction',
		'modules/model/addCornerToLinkUndoableAction',
		'modules/model/setSegmentShiftUndoableAction',
		'modules/model/removeSegmentShiftsUndoableAction',
		'modules/model/removeNodesResizeValuesUndoableAction',
		//'modules/model/setNodeResizeUndoableAction',
		'modules/model/resizeContainerUndoableAction',
		'modules/model/resizeSwitchUndoableAction',
		'modules/model/changeCanvasSettingsUndoableAction',
		'modules/model/copyPasteUndoableAction',
		'modules/layout/nodesLayoutUtils',
		'modules/gallery/decisionEnds',
		'modules/diagram/diagramUtils',
		'modules/graph/graphConstants',
		'modules/dialogs/messageDialog',
		'modules/settings/config',
		'modules/flow/flowUtils',
		'modules/controller/flowCache'],
	function(UndoHandler,
			 AddNodeUndoableAction,
			 InsertNodeUndoableAction,
			 MoveNodeToCellUndoableAction,
			 MoveNodeToPipeUndoableAction,
			 AddLinkUndoableAction,
			 RemoveLinkUndoableAction,
			 RemoveMultipleUndoableAction,
			 RenameNodeUndoableAction,
			 ChangeDecisionEndsUndoableAction,
			 ModifyContentUndoableAction,
			 AddCorridorsUndoableAction,
			 RemoveCorridorsUndoableAction,
			 AddCornerToLinkUndoableAction,
			 SetSegmentShiftUndoableAction,
			 RemoveSegmentShiftsUndoableAction,
			 RemoveNodesResizeValuesUndoableAction,
			 //SetNodeResizeUndoableAction,
			 ResizeContainerUndoableAction,
			 ResizeSwitchUndoableAction,
			 ChangeCanvasSettingsUndoableAction,
			 CopyPasteUndoableAction,
			 nodesUtl,
			 decisionEnds,
	         diagramUtils,
	         constants,
	         messageDialog,
	         config,
			 flowUtils,
			 flowCache) {

		function FlowController(flowManager) {
			var self = this,
				_flowManager = flowManager,
				_modelHandler = flowManager.getModelHandler(),
				_flowModel = _modelHandler.getFlowModel(),
				_flowLayout = flowManager.getFlowDiagram().getFlowLayout(),
				_undoHandler = new UndoHandler(_modelHandler, _flowManager.getUndoManager());

			/** AUTO */
			self.addNodeByType = function(flowType, nodeNamesMap) {
				var nodeObject = createNodeObject(flowType, nodeNamesMap);
				if (nodeObject) {
					addNewNode(nodeObject, undefined);
				}
			};

			// callback from create node dialog
			self.addNodeByName = function(name, decisionInput, decisionEnds) {
				var nodeObj = {};
				nodeObj.name = name;
				var flowType = flowCache.getSelectedFlowType();
				//nodeObj.type = diagramUtils.getFlowTypeName(flowType);
				nodeObj.type = flowType;
				if (decisionInput) {
					nodeObj.decisionInput = decisionInput;
				}
				if (decisionEnds) {
					nodeObj.decisionEnds = decisionEnds;
				}
				var link = flowCache.getLink(),
					cell = flowCache.getCell(),
					insert = flowCache.isInsert(),
					nodeLevelNum = flowCache.getNodeLevel(),
					nodeLaneNum = flowCache.getNodeLane(),
					insertLevelNum = flowCache.getPipeLevel(),
					insertLaneNum = flowCache.getPipeLane();
				if (link && !insert) {
					addNodeOverLink(nodeObj, link);
				} else if (cell) {
					addNodeByTypeOnCell(nodeObj, cell);
				} else if (insert && !link) {
					insertNodeInPipe(nodeObj, nodeLevelNum, nodeLaneNum, insertLevelNum, insertLaneNum);
				} else if (insert && link) {
					insertNodeInLink(nodeObj, link, nodeLevelNum, nodeLaneNum, insertLevelNum, insertLaneNum);
				} else {
					addNewNode(nodeObj, cell);
				}
				flowCache.clear();
			};

			function addNewNode(nodeObject, cell) {
				if (nodeObject) {
					var actions = [];
					actions.push(new AddNodeUndoableAction(_modelHandler, nodeObject, cell));
					_undoHandler.createUndoStack(
						"add node "+nodeObject.name, actions);
				} else {
					//messageDialog.showMessage('Warning', 'addNodeByType failed, node object undefined');
				}
			}

			/** */
			self.addNodeOnCell = function(flowType, nodeNamesMap, cell, container) {
				//console.log("++++ addNodeOnCell, cell="+cell.print());
				flowCache.setCell(cell);
				var nodeObject = createNodeObject(flowType, nodeNamesMap);
				if (container) {
					nodeObject.containerName = container.getName();
				}
				if (nodeObject) {
					addNodeByTypeOnCell(nodeObject, cell);
				}
			};


			/** */
			function addNodeByTypeOnCell(nodeObj, cell) {
				//console.log("+++++ addNodeByTypeOnCell: "+nodeObj.name+", type: "+nodeObj.type+", cell: "+cell.print());
				nodeObj.levelNum = cell.getLevelNumber();
				nodeObj.laneNum = cell.getLaneNumber();

				var actions = [];
				actions.push(new AddNodeUndoableAction(_modelHandler, nodeObj, cell));
				_undoHandler.createUndoStack(
					"add node "+nodeObj.name, actions);
			}

			/** AUTO */
			self.addNodeOnDropOverLink = function(flowType, nodeNamesMap, link) {
				flowCache.setLink(link);
				var nodeObject = createNodeObject(flowType, nodeNamesMap);
				if (nodeObject) {
					addNodeOverLink(nodeObject, link);
				}
			};

			/** AUTO */
			function addNodeOverLink(nodeObject, link) {
				var newSrcLinkObj = createNewInputLinkObject(nodeObject, link);
				var newTrgLinkObj = createNewOutputLinkObject(nodeObject, link);
				var actions = [];
				actions.push(new RemoveLinkUndoableAction(_modelHandler, link.getLinkObject()));
				actions.push(new AddNodeUndoableAction(_modelHandler, nodeObject, undefined));
				actions.push(new AddLinkUndoableAction(_modelHandler, newSrcLinkObj));
				actions.push(new AddLinkUndoableAction(_modelHandler, newTrgLinkObj));
				_undoHandler.createUndoStack(
					"insert "+nodeObject.name+" to "+link.getName(),
					actions);
			}

			// MANUAL
			self.insertNodeOnDropOnPipe = function(flowType,
												   nodeNamesMap,
												   nodeLevelNum,
												   nodeLaneNum,
												   insertLevelNum,
												   insertLaneNum) {
				flowCache.setInsert(true);
				flowCache.setNodeLevel(nodeLevelNum);
				flowCache.setNodeLane(nodeLaneNum);
				flowCache.setPipeLevel(insertLevelNum);
				flowCache.setPipeLane(insertLaneNum);
				var nodeObject = createNodeObject(flowType, nodeNamesMap);
				if (nodeObject) {
					insertNodeInPipe(nodeObject, nodeLevelNum, nodeLaneNum, insertLevelNum, insertLaneNum);
				}
			};
			// MANUAL
			function insertNodeInPipe(nodeObj,
									  nodeLevelNum,
									  nodeLaneNum,
									  insertLevelNum,
									  insertLaneNum) {
				nodeObj.levelNum = nodeLevelNum;
				nodeObj.laneNum = nodeLaneNum;
				//nodeObj.levelNum = nodeLevelNum >= 0 ? nodeLevelNum : insertLevelNum;
				//nodeObj.laneNum = nodeLaneNum >= 0 ? nodeLaneNum : insertLaneNum;
				var rect = _modelHandler.getPipeXSection(nodeLevelNum, nodeLaneNum, insertLevelNum, insertLaneNum);
				var actions = [];
				actions.push(new InsertNodeUndoableAction(_modelHandler, nodeObj, insertLevelNum, insertLaneNum, rect));
				_undoHandler.createUndoStack(
					"insert node "+nodeObj.name,
					actions);
			}

			// MANUAL
			self.insertNodeOnDropOverLink = function(flowType,
													 nodeNamesMap,
													 link,
													 nodeLevelNum,
													 nodeLaneNum,
													 insertLevelNum,
													 insertLaneNum,
													 toCell) {
				flowCache.setLink(link);
				flowCache.setInsert(true);
				flowCache.setNodeLevel(nodeLevelNum);
				flowCache.setNodeLane(nodeLaneNum);
				flowCache.setPipeLevel(insertLevelNum);
				flowCache.setPipeLane(insertLaneNum);
				var nodeObject = createNodeObject(flowType, nodeNamesMap);
				if (nodeObject) {
					insertNodeInLink(nodeObject, link, nodeLevelNum, nodeLaneNum, insertLevelNum, insertLaneNum, toCell);
				}
			};
			// MANUAL
			function insertNodeInLink(nodeObj,
									  link,
									  nodeLevelNum,
									  nodeLaneNum,
									  insertLevelNum,
									  insertLaneNum,
									  toCell) {
				nodeObj.levelNum = nodeLevelNum >= 0 ? nodeLevelNum : insertLevelNum;
				nodeObj.laneNum = nodeLaneNum >= 0 ? nodeLaneNum : insertLaneNum;
				var newSrcLinkObj = createNewInputLinkObject(nodeObj, link);
				var newTrgLinkObj = createNewOutputLinkObject(nodeObj, link);
				var actions = [];
				actions.push(new RemoveLinkUndoableAction(_modelHandler, link.getLinkObject()));
				actions.push(new InsertNodeUndoableAction(_modelHandler, nodeObj, insertLevelNum, insertLaneNum, toCell));
				actions.push(new AddLinkUndoableAction(_modelHandler, newSrcLinkObj));
				actions.push(new AddLinkUndoableAction(_modelHandler, newTrgLinkObj));
				_undoHandler.createUndoStack(
					"insert "+nodeObj.name+" into "+link.getName(),
					actions);
			}

			// MANUAL
			self.moveNodeToNewCell = function(node,
											  fromCell,
											  toCell,
											  container) {
				var actions = [];
				if (container) {
					node.setContainerName(container.getName());
				}
				actions.push(new MoveNodeToCellUndoableAction(
					_modelHandler,
					node,
					fromCell,
					toCell));
				_undoHandler.createUndoStack(
					"move "+node.getName(),
					actions);
			};

			self.moveNodeToPipe = function(footprintNode,
										   currentNode,
										   newLevelNum,
										   newLaneNum,
										   insertLevelNum,
										   insertLaneNum) {
				//console.log("&&&& moveNodeToPipe: newLevelNum="+newLevelNum+", newLaneNum="+newLaneNum+
				//			", insertLevelNum="+insertLevelNum+", insertLaneNum="+insertLaneNum);
				var rect = _modelHandler.getPipeXSection(newLevelNum, newLaneNum, insertLevelNum, insertLaneNum);
				var actions = [];
				actions.push(new MoveNodeToPipeUndoableAction(
					_modelHandler,
					footprintNode,
					currentNode,
					newLevelNum,
					newLaneNum,
					insertLevelNum,
					insertLaneNum,
					rect));
				_undoHandler.createUndoStack(
					"move "+currentNode.getName(),
					actions);
			};

			self.renameNode = function(node, newNodeName) {
				var cnxMap = _modelHandler.getSelectionsMapForItem(node);
				var actionName = "rename from "+node.getName()+" to "+newNodeName;
				var actions = [];
				actions.push(new RenameNodeUndoableAction(_modelHandler, cnxMap, actionName, node.getName(), newNodeName));
				_undoHandler.createUndoStack(
					actionName, actions);
			};

			self.modifyContent = function(node, text, textAbove, textBelow) {
				//console.log("########  ModifyContentUndoableAction ####  text: ["+text+"]");
				var actions = [];
				actions.push(new ModifyContentUndoableAction(_modelHandler, node, text, textAbove, textBelow));
				_undoHandler.createUndoStack(
					"edit content text for "+node.getName(), actions);
			};

			self.changeNodeDecisionEnds = function(node, newInput, newEnds) {
				var nodeObj = node.getNodeObject();
				var actions = [];
				actions.push(new ChangeDecisionEndsUndoableAction(_modelHandler, nodeObj, newInput, newEnds));
				_undoHandler.createUndoStack(
					"change decision layout for "+node.getName(), actions);
			};

			self.removeNode = function(node) {
				//console.log("----------------- REMOVE NODE: "+node.printNode());
				var cnxMap;
				if (node.getFlowType() === constants.flowType().CONTAINER) {
					var allItems = flowUtils.getContainerFullContent(node);
					_flowManager.getSelectionManager().addMultipleToSelections(allItems);
					cnxMap = _modelHandler.getSelectionObjectsMap(allItems);
				} else {
					cnxMap = _modelHandler.getSelectionsMapForItem(node);
				}
				_flowManager.copySelections();
				var actions = [];
				actions.push(new RemoveMultipleUndoableAction(_modelHandler, cnxMap, node.getName()));
				_undoHandler.createUndoStack(
					"remove node "+node.getName(), actions);
			};

			self.addLink = function(originPort, destinationPort) {
				var linkObject = createNewLinkObject(originPort, destinationPort);
				if (linkObject) {
					var actions = [];
					actions.push(new AddLinkUndoableAction(_modelHandler, linkObject));
					_undoHandler.createUndoStack(
						//"add link "+JSON.stringify(linkObject), actions);
						"add link "+linkObject.name, actions);
				}
			};

			self.removeLink = function(link) {
				// TODO: handle link object
				//var itemsMap = _modelHandler.getSelectionsMapForItem(link);
				var linkObject = link.getLinkObject();
				var actions = [];
				actions.push(new RemoveLinkUndoableAction(_modelHandler, linkObject));
				_undoHandler.createUndoStack(
					//"remove link "+JSON.stringify(linkObject), actions);
					"remove link "+linkObject.name, actions);
			};

			self.moveLinkPort = function(link, anchorPort, newPort) {
				var newLinkObj = createNewLinkObject(anchorPort, newPort);
				var actions = [];
				actions.push(new RemoveLinkUndoableAction(_modelHandler, link.getLinkObject()));
				actions.push(new AddLinkUndoableAction(_modelHandler, newLinkObj));
				_undoHandler.createUndoStack(
					"move from "+anchorPort.getName()+" to "+newPort.getName(),
					actions);
			};

			self.removeSelections = function() {
				if (!config.isEditMode()) {
					return;
				}
				var selections = _flowManager.getSelectionManager().getSelections(),
					allItems = selections.concat(flowUtils.getFullContainersContent(selections));
				_flowManager.getSelectionManager().addMultipleToSelections(allItems);
				_flowManager.copySelections();
				var cnxMap = _modelHandler.getSelectionObjectsMap(allItems);
				var actions = [];
				var undoName = allItems.length == 1 ? " selected item" : " selected items";
				actions.push(new RemoveMultipleUndoableAction(_modelHandler, cnxMap, "remove "+allItems.length+undoName));
				_undoHandler.createUndoStack(
					"remove "+allItems.length+undoName, actions);
			};

			self.addCorridor = function(levelNum, laneNum) {
				if (levelNum === -1 && laneNum === -1) {
					return;
				}
				var sb = "add ";
				if (levelNum > -1 && laneNum > -1) {
					sb += "level & lane";
				} else if (levelNum > -1 && laneNum < 0) {
					sb += "level";
				} else if (levelNum < 0 && laneNum > -1) {
					sb += "lane";
				}
				var actions = [];
				actions.push(new AddCorridorsUndoableAction(_modelHandler, levelNum, laneNum, sb));
				_undoHandler.createUndoStack(sb, actions);
			};

			self.removeCorridor = function(levelNum, laneNum) {
				if (levelNum == -1 && laneNum == -1) {
					return;
				}
				var sb = "remove ";
				if (levelNum > -1 && laneNum > -1) {
					sb += "level & lane";
				} else if (levelNum > -1 && laneNum < 0) {
					sb += "level";
				} else if (levelNum < 0 && laneNum > -1) {
					sb += "lane";
				}
				var actions = [];
				actions.push(new RemoveCorridorsUndoableAction(_modelHandler, levelNum, laneNum, sb));
				_undoHandler.createUndoStack(sb, actions);
			};

			self.copyPaste = function(
					startLevelIdx,
					newLevelsNum,
					startLaneIdx,
					newLanesNum,
					newNodeObjects,
					newLinkObjects) {
				var actions = [];
				actions.push(new CopyPasteUndoableAction(
					_modelHandler,
					startLevelIdx,
					newLevelsNum,
					startLaneIdx,
					newLanesNum,
					newNodeObjects,
					newLinkObjects,
					name));
				_undoHandler.createUndoStack("copy/paste ", actions);
			};

			self.insertForcedCorner = function(dLink, pipeXing, cornerType) {
				var actions = [];
				actions.push(new AddCornerToLinkUndoableAction(_modelHandler, dLink, pipeXing, cornerType));
				_undoHandler.createUndoStack("add corner to link ", actions);
			};

			// obsolete: implement segment shift using a pair of forced corners
			//self.insertForcedCornersArrayToLink = function(dLink, pipeXings) {
			//	var actions = [];
			//	for (var i = 0; i < pipeXings.length; i++) {
			//		actions.push(new AddCornerToLinkUndoableAction(_modelHandler, dLink, pipeXings[i], constants.cornerType().PAIR));
			//	}
			//	_undoHandler.createUndoStack("add corners to link ", actions);
			//};


			self.processSegmentShift = function(link, segmentOrder, shift) {
				var actions = [];
				actions.push(new SetSegmentShiftUndoableAction(_modelHandler, link, segmentOrder, shift));
				_undoHandler.createUndoStack("shift segment ", actions);
			};

			self.clearSegmentShifts = function(links) {
				var actions = [];
				actions.push(new RemoveSegmentShiftsUndoableAction(_modelHandler, links));
				_undoHandler.createUndoStack("remove segment shifts", actions);
			};

			self.clearAllShifts = function() {
				var links = _modelHandler.getFlowLinks(),
					actions = [];
				actions.push(new RemoveSegmentShiftsUndoableAction(_modelHandler, links));
				_undoHandler.createUndoStack("remove segment shifts", actions);
			};

			// this is obsolete:
			//self.resizeNodeToValues = function(node, resizeW, resizeH) {
			//	var actions = [];
			//	actions.push(new SetNodeResizeUndoableAction(_modelHandler, node, resizeW, resizeH));
			//	_undoHandler.createUndoStack("resize node ", actions);
			//};

			self.resizeContainerOutline = function(container, resizeParam) {
				var containerObj = container.getNodeObject(),
					actions = [];
				actions.push(new ResizeContainerUndoableAction(_flowManager, containerObj, resizeParam));
				_undoHandler.createUndoStack("resize container ", actions);
			};

			self.resizeSwitchOutline = function(switchNode, resizeParam) {
				var switchObj = switchNode.getNodeObject(),
					actions = [];
				actions.push(new ResizeSwitchUndoableAction(_flowManager, switchObj, resizeParam));
				_undoHandler.createUndoStack("resize switch ", actions);
			};

			self.clearAllResizeValues = function() {
				var nodes = _modelHandler.getFlowNodes(),
					actions = [];
				actions.push(new RemoveNodesResizeValuesUndoableAction(_modelHandler, nodes));
				_undoHandler.createUndoStack("remove all resize values", actions);
			};

			self.changeCanvasSettings = function(isLevels, levelsValue, isLanes, lanesValue) {
				var areLevelsToRemove = isLevels && levelsValue === constants.change().DOWN &&
					(nodesUtl.getStartNodes(_modelHandler.getFlowNodes()).length > 0 ||
						nodesUtl.getEndNodes(_modelHandler.getFlowNodes()).length > 0),
					areLanesToRemove = isLanes && lanesValue === constants.change().DOWN &&
						(nodesUtl.getLeftLaneNodes(_modelHandler.getFlowNodes()).length > 0 ||
							nodesUtl.getRightLaneNodes(_modelHandler.getFlowNodes()).length > 0);
				var msg;
				if (areLevelsToRemove && areLanesToRemove) {
					msg = "Do you want to remove all start/end and side nodes?";
				} else if (areLevelsToRemove && !areLanesToRemove) {
					msg = "Do you want to remove all start/end nodes?";
				} else if (!areLevelsToRemove && areLanesToRemove) {
					msg = "Do you want to remove all side nodes?";
				}
				flowCache.clear();
				flowCache.setIsLevels(isLevels);
				flowCache.setLevelsValue(levelsValue);
				flowCache.setIsLanes(isLanes);
				flowCache.setLanesValue(lanesValue);
				if (msg) {
					_flowManager.getCaller().showConfirmMessage(msg, "Confirm");
					$("#confirmDialogId").on("dialogclose", function(event, ui) {
						changeCanvasSettingsCallback(_flowManager.getCaller().getConfirmFlag());
					});
				} else {
					changeCanvasSettingsCallback(constants.bValue().TRUE);
				}
			};

			function changeCanvasSettingsCallback(bVal) {
				if (bVal === constants.bValue().TRUE) {
					var actions = [];
					actions.push(new ChangeCanvasSettingsUndoableAction(
						_modelHandler,
						flowCache.isLevels(),
						flowCache.levelsValue(),
						flowCache.isLanes(),
						flowCache.lanesValue()));
					_undoHandler.createUndoStack("change canvas settings", actions);
				}
				flowCache.clear();
				_flowManager.getCaller().setConfirmFlag(constants.bValue().FALSE);
			}

			////////////////////////

			self.editDecisionNode = function(node) {
				_flowManager.getCaller().setDecisionRun(node, constants.decisionRun().EDIT);
				$("#newNodeDialogId").dialog("open");
			};

			function createNodeObject(flowType, nodeNamesMap) {
				if (config.hasAutoGenNodeNames()) {
					var name = diagramUtils.generateNextNodeName(nodeNamesMap, flowType);
					var nodeObj = {};
					nodeObj.id = constants.elementType().NODE;
					nodeObj.name = name;
					//nodeObj.type = diagramUtils.getFlowTypeName(flowType);
					nodeObj.type = flowType;
					if (flowType === constants.flowType().DECISION) {
						nodeObj.decisionInput = decisionEnds.getCurrentDecisionInput();
						nodeObj.decisionEnds = decisionEnds.getCurrentDecisionEnds();
					}
					return nodeObj;
				} else {
					flowCache.setSelectedFlowType(flowType);
					_flowManager.getCaller().setDecisionRun(undefined, constants.decisionRun().CREATE);
					$("#newNodeDialogId").dialog("open");
					return undefined;
				}
			}

			function createNewLinkObject(originPort, destinationPort) {
				if (!originPort || !destinationPort) {
					return undefined;
				}
				//console.log("======== createNewLink: \n"+originPort.print()+"\n"+destinationPort.print());
				var originNode = originPort.getNode();
				var destinationNode = destinationPort.getNode();
				if (originNode && destinationNode) {
					var newOriginPort, // temp object
						newDestinationPort, // temp object
						isOriginRef,
						isDestinationRef,
						side,
						newName,
						newSide;

					if (isMarkOut(originPort.getConnector().getDirection())) {
						if (originNode.isDecisionNode()) {
							if (originPort.getName().indexOf(constants.portNames().TRUE) > 0) {
								side = diagramUtils.getDecisionTruePortSide(originNode);
								newName = originNode.getPortNameTrue();
							} else if (originPort.getName().indexOf(constants.portNames().FALSE) > 0) {
								side = diagramUtils.getDecisionFalsePortSide(originNode);
								newName = originNode.getPortNameFalse();
							}
							if (side) {
								newOriginPort = originNode.createOutputPort(newName, side);
							}
						} else {
							newOriginPort = originNode.createOutputPort(undefined, originPort.getSide());
						}
					} else if (isMarkIn(originPort.getConnector().getDirection())) {
						newOriginPort =  originNode.createInputPort(undefined, originPort.getSide());
					} else if (originPort.getConnector().getDirection() === constants.portDirection().REF_OUT) {
						newSide = originPort.getSide();
						newName = originNode.generateRefNextName(constants.portDirection().OUT, newSide);
						newOriginPort =  originNode.createOutputPort(newName, newSide);
						isOriginRef = true;
					} else if (originPort.getConnector().getDirection() === constants.portDirection().REF_IN) {
						newSide = originPort.getSide();
						newName = originNode.generateRefNextName(constants.portDirection().IN, newSide);
						newOriginPort =  originNode.createInputPort(newName, newSide);
						isOriginRef = true;
					}

					if (isMarkOut(destinationPort.getConnector().getDirection())) {
						if (destinationNode.isDecisionNode()) {
							if (destinationPort.getName().indexOf(constants.portNames().TRUE) > 0) {
								side = diagramUtils.getDecisionTruePortSide(destinationNode);
								newName = destinationNode.getPortNameTrue();
							} else if (destinationPort.getName().indexOf(constants.portNames().FALSE) > 0) {
								side = diagramUtils.getDecisionFalsePortSide(destinationNode);
								newName = destinationNode.getPortNameFalse();
							}
							if (side) {
								newDestinationPort = destinationNode.createOutputPort(newName, side);
							}
						} else {
							newDestinationPort = destinationNode.createOutputPort(undefined, destinationPort.getSide());
						}
					} else if (isMarkIn(destinationPort.getConnector().getDirection())) {
						newDestinationPort =  destinationNode.createInputPort(undefined, destinationPort.getSide());
					} else if (destinationPort.getConnector().getDirection() === constants.portDirection().REF_OUT) {
						newSide = destinationPort.getSide();
						newName = destinationNode.generateRefNextName(constants.portDirection().OUT, newSide);
						newDestinationPort =  destinationNode.createOutputPort(newName, newSide);
						isDestinationRef = true;
					} else if (destinationPort.getConnector().getDirection() === constants.portDirection().REF_IN) {
						newSide = destinationPort.getSide();
						newName = destinationNode.generateRefNextName(constants.portDirection().IN, newSide);
						newDestinationPort =  destinationNode.createInputPort(newName, newSide);
						isDestinationRef = true;
					}

					// URI's have to be fully defined
					var srcURI, srcSide, trgURI, trgSide;

					if (originPort.getConnector().getDirection() === constants.portDirection().OUT) {
						srcURI = originNode.getName()+"/"+ originPort.getName();
						srcSide = originPort.getSide();
					} else if (isMarkOut(originPort.getConnector().getDirection()) ||
							originPort.getConnector().getDirection() === constants.portDirection().REF_OUT) {
						if (newOriginPort) {
							srcURI = originNode.getName()+"/"+ newOriginPort.getName();
							srcSide = originPort.getSide();
						}
					} else if (destinationPort.getConnector().getDirection() === constants.portDirection().OUT) {
						srcURI = destinationNode.getName()+"/"+destinationPort.getName();
						srcSide = destinationPort.getSide();
					} else if (isMarkOut(destinationPort.getConnector().getDirection()) ||
							destinationPort.getConnector().getDirection() === constants.portDirection().REF_OUT) {
						if (newDestinationPort) {
							srcURI = destinationNode.getName()+"/"+newDestinationPort.getName();
							srcSide = destinationPort.getSide();
						}
					}

					if (destinationPort.getConnector().getDirection() === constants.portDirection().IN) {
						trgURI = destinationNode.getName()+"/"+ destinationPort.getName();
						trgSide = destinationPort.getSide();
					} else if (isMarkIn(destinationPort.getConnector().getDirection()) ||
							destinationPort.getConnector().getDirection() === constants.portDirection().REF_IN) {
						if (newDestinationPort) {
							trgURI = destinationNode.getName()+"/"+ newDestinationPort.getName();
							trgSide = destinationPort.getSide();
						}
					} else if (originPort.getConnector().getDirection() === constants.portDirection().IN) {
						trgURI = originNode.getName()+"/"+ originPort.getName();
						trgSide = originPort.getSide();
					} else if (isMarkIn(originPort.getConnector().getDirection()) ||
							originPort.getConnector().getDirection() === constants.portDirection().REF_IN) {
						if (newOriginPort) {
							trgURI = originNode.getName()+"/"+ newOriginPort.getName();
							trgSide = originPort.getSide();
						}
					}
					// make sure the link is created only with full URI's
					if (srcURI && trgURI) {
						var link = {};
						link.id = constants.elementType().EDGE;
						link.source = srcURI;
						link.srcSide = srcSide;
						link.target = trgURI;
						link.trgSide = trgSide;
						link.name = "["+link.source+"]-["+link.target+"]";
						if (isOriginRef || isDestinationRef) {
							link.type = constants.linkType().REF_LINK;
						} else {
							link.type = constants.linkType().CNX_LINK;
						}
						return link;
					} else {
						return undefined;
					}
				} else {
					return undefined;
				}
			}

			function isMarkIn(direction) {
				return direction === constants.portDirection().MARK_IN || direction === constants.portDirection().MARK_IN_AUX;
			}

			function isMarkOut(direction) {
				return direction === constants.portDirection().MARK_OUT || direction === constants.portDirection().MARK_OUT_AUX;
			}

			function createNewInputLinkObject(nodeObject, oldLink) {
				var srcPort = oldLink.getSourcePort();
				var srcNode = srcPort.getNode();
				var srcURI = srcNode.getName()+"/"+srcPort.getName();
				//var trgPortName = nodeObject.type === diagramUtils.getFlowTypeName(constants.flowType().DECISION) ?
				var trgPortName = nodeObject.type === constants.flowType().DECISION ?
					constants.portNames().D_IN : "IN-0";
				var trgURI = nodeObject.name+"/"+trgPortName;
				var link = {};
				link.id = constants.elementType().EDGE;
				link.source = srcURI;
				link.target = trgURI;
				link.name = "["+link.source+"]-["+link.target+"]";
				link.type = oldLink.getType();
				return link;
			}

			function createNewOutputLinkObject(nodeObject, oldLink) {
				//var srcPortName = nodeObject.type === diagramUtils.getFlowTypeName(constants.flowType().DECISION) ?
				var srcPortName = nodeObject.type === constants.flowType().DECISION ?
					constants.portNames().D_TRUE : "OUT-0";
				var srcURI = nodeObject.name+"/"+srcPortName;
				var trgPort = oldLink.getTargetPort();
				var trgNode = trgPort.getNode();
				var trgURI = trgNode.getName()+"/"+trgPort.getName();
				var link = {};
				link.id = constants.elementType().EDGE;
				link.source = srcURI;
				link.target = trgURI;
				link.name = "["+link.source+"]-["+link.target+"]";
				link.type = oldLink.getType();
				return link;
			}

		}
		return FlowController;
	}
);
