define(['modules/geometry/point',
		'modules/graph/xPoint',
		'modules/geometry/rectangle',
		'modules/geometry/dimension',
		'modules/graph/cell',
		'modules/graph/graphElement',
		'modules/graph/graphNode',
		'modules/graph/connector',
		'modules/graph/corridor',
		'modules/graph/pipe',
		'modules/graph/graphConstants',
		'modules/settings/config'],
	function(Point,
	         XPoint,
	         Rectangle,
			 Dimension,
	         Cell,
	         GraphElement,
	         GraphNode,
	         Connector,
	         Corridor,
	         Pipe,
	         constants,
	         config) {

		var getOffsetSteps = function(connectors) {
			var num = 0;
			for (var i = 0; i < connectors.length; i++) {
				num += Math.abs(connectors[i].getOffsetStep());
			}
			return num;
		},

		// IN/OUT CONNECTORS
		createNewConnector = function(node, name, side, direction) {
			if (node.getName() === "T1") {
				//console.log("### T1 createNewConnector: "+node.getNodeWidth()+", "+node.getNodeHeight());
			}
			var newCnx = new Connector(new Point(0,0), name, node, side, direction),
				nodeWidth = node.getNodeWidth(),
				nodeHeight = node.getNodeHeight();
			var i = 0, cnx = "", cnxNum = 0, step = 0, newW = 0, newH = 0, autoStep = 0,
				offset = 0, sideXpos = 0, sideYpos = 0, sideConnectors = [];
			var portStep = node.getPortStep();
			if (config.getFlowDirection() === constants.flow().VERTICAL) {
				if (side == constants.nodeSide().FRONT || side == constants.nodeSide().BACK) {
					sideYpos = side === constants.nodeSide().FRONT ? nodeHeight : 0;
					sideConnectors =
						side == constants.nodeSide().FRONT ? node.getFrontConnectors() : node.getBackConnectors();
					cnxNum = sideConnectors.length;
					newCnx.setOrder(cnxNum);
					// side-length / num-of-ports + 1 + 1 (for the new port)
					step = Math.floor(nodeWidth / (cnxNum + 2));
					if (step < portStep) {
						newW = nodeWidth + step;//portStep * (cnxNum + 2);
						node.setSize(newW, nodeHeight);
					}
					if (node.getPortLayout() === constants.portLayout().AUTO_ARRANGE) {
						autoStep = Math.floor(nodeWidth / (cnxNum + 2));
						for (i = 0; i < cnxNum; i++) {
							cnx = sideConnectors[i];
							cnx.moveToXY(autoStep * (i+1), sideYpos);
						}
						newCnx.moveToXY(autoStep * (cnxNum+1), sideYpos);
						sideConnectors.push(newCnx);
					} else if (node.getPortLayout() === constants.portLayout().ALIGN_CENTER ||
						node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES ||
						node.getPortLayout() === constants.portLayout().ALIGN_TOP_LEFT) {
						offset = node.getPortLayout() === constants.portLayout().ALIGN_CENTER ?
							Math.floor((nodeWidth - portStep * (cnxNum-1)) / 2) : portStep;
						for (i = 0; i < cnxNum; i++) {
							cnx = sideConnectors[i];
							cnx.moveToXY(offset + portStep * i, sideYpos);
						}
						newCnx.moveToXY(offset + portStep * cnxNum, sideYpos);
						sideConnectors.push(newCnx);
					} else {
						console.log("createConnector: port layout needs additional data: "+node.getPortLayout());
					}
				} else if (side === constants.nodeSide().RIGHT || side === constants.nodeSide().LEFT) {
					sideXpos = side === constants.nodeSide().RIGHT ? 0 : nodeWidth;
					sideConnectors =
						side === constants.nodeSide().RIGHT ? node.getRightConnectors() : node.getLeftConnectors();
					cnxNum = sideConnectors.length;
					newCnx.setOrder(cnxNum);
					step = Math.floor(nodeHeight / (cnxNum + 2));
					if (step < portStep) {
						newH = nodeHeight + step; //portStep * (cnxNum + 2);
						node.setSize(nodeWidth, newH);
					}
					if (node.getPortLayout() == constants.portLayout().AUTO_ARRANGE) {
						autoStep = Math.floor(nodeHeight / (cnxNum + 2));
						for (i = 0; i < cnxNum; i++) {
							cnx = sideConnectors[i];
							cnx.moveToXY(sideXpos, autoStep * (i+1));
						}
						newCnx.moveToXY(sideXpos, autoStep * (cnxNum+1));
						sideConnectors.push(newCnx);
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
						node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES ||
						node.getPortLayout() == constants.portLayout().ALIGN_TOP_LEFT) {
						offset = node.getPortLayout() == constants.portLayout().ALIGN_CENTER ?
							Math.floor((nodeHeight - portStep * (cnxNum-1)) / 2) : portStep;
						for (i = 0; i < cnxNum; i++) {
							cnx = sideConnectors[i];
							cnx.moveToXY(sideXpos, offset + portStep * i);
						}
						newCnx.moveToXY(sideXpos, offset + portStep * cnxNum);
						sideConnectors.push(newCnx);
					} else {
						console.log("createConnector: port layout needs additional data: "+node.getPortLayout());
					}
				}
			} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
				if (side === constants.nodeSide().FRONT || side === constants.nodeSide().BACK) {
					sideXpos = side === constants.nodeSide().FRONT ? nodeWidth : 0;
					sideConnectors =
						side === constants.nodeSide().FRONT ? node.getFrontConnectors() : node.getBackConnectors();
					cnxNum = sideConnectors.length;
					newCnx.setOrder(cnxNum);
					step = Math.floor(nodeHeight / (cnxNum + 2));
					if (step < portStep) {
						newH = nodeHeight + step; //portStep * (cnxNum + 2);
						node.setSize(nodeWidth, newH);
					}
					if (node.getPortLayout() == constants.portLayout().AUTO_ARRANGE) {
						autoStep = Math.floor(nodeHeight / (cnxNum + 2));
						for (i = 0; i < cnxNum; i++) {
							cnx = sideConnectors[i];
							cnx.moveToXY(sideXpos, autoStep * (i+1));
						}
						newCnx.moveToXY(sideXpos, autoStep * (cnxNum+1));
						sideConnectors.push(newCnx);
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
						node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES ||
						node.getPortLayout() == constants.portLayout().ALIGN_TOP_LEFT) {
						offset = node.getPortLayout() == constants.portLayout().ALIGN_CENTER ?
							Math.floor((nodeHeight - portStep * (cnxNum-1)) / 2) : portStep;
						for (i = 0; i < cnxNum; i++) {
							cnx = sideConnectors[i];
							cnx.moveToXY(sideXpos, offset + portStep * i);
						}
						newCnx.moveToXY(sideXpos, offset + portStep * cnxNum);
						sideConnectors.push(newCnx);
					} else {
						console.log("createConnector: port layout needs additional data: "+node.getPortLayout());
					}
				} else if (side === constants.nodeSide().RIGHT || side === constants.nodeSide().LEFT) {
					sideYpos = side === constants.nodeSide().RIGHT ? nodeHeight : 0;
					sideConnectors =
						side === constants.nodeSide().RIGHT ? node.getRightConnectors() : node.getLeftConnectors();
					cnxNum = sideConnectors.length;
					newCnx.setOrder(cnxNum);
					step = Math.floor(nodeWidth / (cnxNum + 2));
					if (step < portStep) {
						newW = nodeWidth + step; //portStep * (cnxNum + 2);
						node.setSize(newW, nodeHeight);
					}
					if (node.getPortLayout() === constants.portLayout().AUTO_ARRANGE) {
						autoStep = Math.floor(nodeWidth / (cnxNum + 2));
						for (i = 0; i < cnxNum; i++) {
							cnx = sideConnectors[i];
							cnx.moveToXY(autoStep * (i+1), sideYpos);
						}
						newCnx.moveToXY(autoStep * (cnxNum+1), sideYpos);
						sideConnectors.push(newCnx);
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
						node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES ||
						node.getPortLayout() == constants.portLayout().ALIGN_TOP_LEFT) {
						offset = node.getPortLayout() == constants.portLayout().ALIGN_CENTER ?
							Math.floor((nodeWidth - portStep * (cnxNum-1)) / 2) : portStep;
						for (i = 0; i < cnxNum; i++) {
							cnx = sideConnectors[i];
							cnx.moveToXY(offset + portStep * i, sideYpos);
						}
						newCnx.moveToXY(offset + portStep * cnxNum, sideYpos);
						sideConnectors.push(newCnx);
					} else {
						console.log("createConnector: port layout needs additional data: "+node.getPortLayout());
					}
				}
			}
			return newCnx;
		},

		// MARK UP connectors
		createNewMarkupConnector = function(node, name, side, direction) {
			var newCnx = new Connector(new Point(0,0), name, node, side, direction),
				nodeWidth = node.getNodeWidth(),
				nodeHeight = node.getNodeHeight();
			var  sideXpos = 0, sideYpos = 0;
			if (config.getFlowDirection() === constants.flow().VERTICAL) {
				if (side === constants.nodeSide().FRONT || side === constants.nodeSide().BACK) {
					sideYpos = side === constants.nodeSide().FRONT ? nodeHeight : 0;
					newCnx.moveToXY(0, sideYpos);
				} else if (side === constants.nodeSide().RIGHT || side === constants.nodeSide().LEFT) {
					sideXpos = side === constants.nodeSide().RIGHT ? 0 : nodeWidth;
					newCnx.moveToXY(sideXpos, nodeHeight);
				}
			} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
				if (side === constants.nodeSide().FRONT || side === constants.nodeSide().BACK) {
					sideXpos = side === constants.nodeSide().FRONT ? nodeWidth : 0;
					newCnx.moveToXY(sideXpos, nodeHeight);
				} else if (side === constants.nodeSide().RIGHT || side === constants.nodeSide().LEFT) {
					sideYpos = side === constants.nodeSide().RIGHT ? nodeHeight : 0;
					newCnx.moveToXY(0, sideYpos);
				}
			}
			return newCnx;
		},

		// adjust all connectors
		adjustConnectorsToStep = function(node) {
			var portStep = node.getPortStep(),
				sideXpos = 0, sideYpos = 0, areOrdered = false, cnxNum = 0, totalCnxNum = 0,
				cnxList = [], autoStep = 0, prevOffStep = 0, i = 0, cnx = "", offset = 0,
				offsetStep = 0, totalSteps = 0,
				hookSteps,
				width = node.getNodeWidth(),
				height = node.getNodeHeight();
//if (node.getName() === "SW1") {
//	console.log("*** SW1");
//}
			if (config.getFlowDirection() === constants.flow().VERTICAL) {
				// FRONT
				sideYpos = height;
				areOrdered = node.areConnectorsOrdered(constants.nodeSide().FRONT);
				cnxList = areOrdered ?
					node.getSortedConnectors(constants.nodeSide().FRONT) :
					node.getFrontConnectors();
				cnxNum = cnxList.length;
				totalCnxNum = cnxNum + getOffsetSteps(cnxList);
				if (cnxNum > 0) {
					if (node.getPortLayout() == constants.portLayout().AUTO_ARRANGE) {
						autoStep = Math.floor(width / (totalCnxNum + 1));
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(autoStep * (i+1+totalSteps), sideYpos);
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES) {
						hookSteps = node.getHooksPositions();
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							cnx.moveToXY(hookSteps[i], sideYpos);
						}
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
						node.getPortLayout() == constants.portLayout().ALIGN_TOP_LEFT) {
						offset = node.getPortLayout() == constants.portLayout().ALIGN_CENTER ?
							Math.floor((width - portStep * (totalCnxNum-1)) / 2) :	portStep;
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(offset + portStep * (i + totalSteps), sideYpos);
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					}
				}
				// BACK
				sideYpos = 0;
				areOrdered = node.areConnectorsOrdered(constants.nodeSide().BACK);
				cnxList = areOrdered ?
					node.getSortedConnectors(constants.nodeSide().BACK) :
					node.getBackConnectors();
				cnxNum = cnxList.length;
				totalCnxNum = cnxNum + getOffsetSteps(cnxList);
				if (cnxNum > 0) {
					if (node.getPortLayout() == constants.portLayout().AUTO_ARRANGE) {
						autoStep = Math.floor(width / (totalCnxNum + 1));
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(autoStep * (i+1+totalSteps), sideYpos);
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES) {
						offset = node.getInPortCentralPosition();
						cnxList[0].moveToXY(offset, sideYpos);
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
						node.getPortLayout() == constants.portLayout().ALIGN_TOP_LEFT) {
						offset = node.getPortLayout() == constants.portLayout().ALIGN_CENTER ?
							Math.floor((width - portStep * (totalCnxNum-1)) / 2) : portStep;
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(offset + portStep * (i + totalSteps), sideYpos);
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					}
				}
				// RIGHT
				sideXpos = 0;
				areOrdered = node.areConnectorsOrdered(constants.nodeSide().RIGHT);
				cnxList = areOrdered ?
					node.getSortedConnectors(constants.nodeSide().RIGHT) :
					node.getRightConnectors();
				cnxNum = cnxList.length;
				totalCnxNum = cnxNum + getOffsetSteps(cnxList);
				if (cnxNum > 0) {
					if (node.getPortLayout() == constants.portLayout().AUTO_ARRANGE) {
						autoStep = Math.floor(height / (totalCnxNum + 1));
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(sideXpos, autoStep * (i+1+totalSteps));
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
						node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES ||
						node.getPortLayout() == constants.portLayout().ALIGN_TOP_LEFT) {
						offset = node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
								 node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES?
							Math.floor((height - portStep * (totalCnxNum-1)) / 2) : portStep;
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(sideXpos, offset + portStep * (i + totalSteps));
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					}
				}
				// LEFT
				//if (node.getName() === "L1") {
				//	console.log("L1: width="+width+", height="+height);
				//}
				sideXpos = width;
				areOrdered = node.areConnectorsOrdered(constants.nodeSide().LEFT);
				cnxList = areOrdered ?
					node.getSortedConnectors(constants.nodeSide().LEFT) :
					node.getLeftConnectors();
				cnxNum = cnxList.length;
				totalCnxNum = cnxNum + getOffsetSteps(cnxList);
				if (cnxNum > 0) {
					if (node.getPortLayout() == constants.portLayout().AUTO_ARRANGE) {
						autoStep = Math.floor(height / (totalCnxNum + 1));
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(sideXpos, autoStep * (i+1+totalSteps));
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
						node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES ||
						node.getPortLayout() == constants.portLayout().ALIGN_TOP_LEFT) {
						offset = node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
								 node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES?
							Math.floor((height - portStep * (totalCnxNum-1)) / 2) : portStep;
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(sideXpos, offset + portStep * (i + totalSteps));
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					}
				}
				// markup ports
				//if (node.getMarkupInPort() != null) {
				//	cnx = node.getMarkupInPort().getConnector();
				//	side = node.getPreferredInputSide();
				//	if (side == constants.nodeSide().FRONT || side == constants.nodeSide().BACK) {
				//		cnx.moveToXY(0, 0);
				//	} else if (side == constants.nodeSide().LEFT) {
				//		cnx.moveToXY(width, 0);
				//	} else if (side == constants.nodeSide().RIGHT) {
				//		cnx.moveToXY(0, 0);
				//	}
				//}
				//if (node.getMarkupOutPort() != null) {
				//	cnx = node.getMarkupOutPort().getConnector();
				//	side = node.getPreferredInputSide();
				//	if (side == constants.nodeSide().FRONT || side == constants.nodeSide().BACK) {
				//		cnx.moveToXY(0, height);
				//	} else if (side == constants.nodeSide().LEFT) {
				//		cnx.moveToXY(width, height);
				//	} else if (side == constants.nodeSide().RIGHT) {
				//		cnx.moveToXY(0, height);
				//	}
				//}
			}
			//
			else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
				// FRONT
				sideXpos = width;
				areOrdered = node.areConnectorsOrdered(constants.nodeSide().FRONT);
				cnxList = areOrdered ?
					node.getSortedConnectors(constants.nodeSide().FRONT) :
					node.getFrontConnectors();
				cnxNum = cnxList.length;
				totalCnxNum = cnxNum + getOffsetSteps(cnxList);
				if (cnxNum > 0) {
					if (node.getPortLayout() == constants.portLayout().AUTO_ARRANGE) {
						autoStep = Math.floor(height / (totalCnxNum + 1));
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(sideXpos, autoStep * (i+1+totalSteps));
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					}  else if (node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES) {
						hookSteps = node.getHooksPositions();
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							cnx.moveToXY(sideXpos, hookSteps[i]);
						}
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
						node.getPortLayout() == constants.portLayout().ALIGN_TOP_LEFT) {
						offset = node.getPortLayout() == constants.portLayout().ALIGN_CENTER ?
							Math.floor((height - portStep * (totalCnxNum-1)) / 2) : portStep;
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(sideXpos, offset + portStep * (i + totalSteps));
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					}
				}
				// BACK
				sideXpos = 0;
				areOrdered = node.areConnectorsOrdered(constants.nodeSide().BACK);
				cnxList = areOrdered ?
					node.getSortedConnectors(constants.nodeSide().BACK) :
					node.getBackConnectors();
				cnxNum = cnxList.length;
				totalCnxNum = cnxNum + getOffsetSteps(cnxList);
				if (cnxNum > 0) {
					if (node.getPortLayout() == constants.portLayout().AUTO_ARRANGE) {
						autoStep = Math.floor(height / (totalCnxNum + 1));
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(sideXpos, autoStep * (i+1+totalSteps));
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES) {
						offset = node.getInPortCentralPosition();
						cnxList[0].moveToXY(sideXpos, offset);
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
						node.getPortLayout() == constants.portLayout().ALIGN_TOP_LEFT) {
						offset = node.getPortLayout() == constants.portLayout().ALIGN_CENTER ?
							Math.floor((height - portStep * (totalCnxNum-1)) / 2) : portStep;
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(sideXpos, offset + portStep * (i + totalSteps));
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					}
				}
				// RIGHT
				sideYpos = height;
				areOrdered = node.areConnectorsOrdered(constants.nodeSide().RIGHT);
				cnxList = areOrdered ?
					node.getSortedConnectors(constants.nodeSide().RIGHT) :
					node.getRightConnectors();
				cnxNum = cnxList.length;
				totalCnxNum = cnxNum + getOffsetSteps(cnxList);
				if (cnxNum > 0) {
					if (node.getPortLayout() == constants.portLayout().AUTO_ARRANGE) {
						autoStep = Math.floor(width / (totalCnxNum + 1));
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(autoStep * (i+1+totalSteps), sideYpos);
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
						node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES ||
						node.getPortLayout() == constants.portLayout().ALIGN_TOP_LEFT) {
						offset = node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
								 node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES?
							Math.floor((width - portStep * (totalCnxNum-1)) / 2) : portStep;
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(offset + portStep * (i + totalSteps), sideYpos);
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					}
				}
				// LEFT
				sideYpos = 0;
				areOrdered = node.areConnectorsOrdered(constants.nodeSide().LEFT);
				cnxList = areOrdered ?
					node.getSortedConnectors(constants.nodeSide().LEFT) :
					node.getLeftConnectors();
				cnxNum = cnxList.length;
				totalCnxNum = cnxNum + getOffsetSteps(cnxList);
				if (cnxNum > 0) {
					if (node.getPortLayout() == constants.portLayout().AUTO_ARRANGE) {
						autoStep = Math.floor(width / (totalCnxNum + 1));
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(autoStep * (i+1+totalSteps), sideYpos);
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					} else if (node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
						node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES ||
						node.getPortLayout() == constants.portLayout().ALIGN_TOP_LEFT) {
						offset = node.getPortLayout() == constants.portLayout().ALIGN_CENTER ||
								 node.getPortLayout() == constants.portLayout().ALIGN_ON_LANES?
							Math.floor((width - portStep * (totalCnxNum-1)) / 2) : portStep;
						prevOffStep = 0; totalSteps = 0;
						for (i = 0; i < cnxNum; i++) {
							cnx = cnxList[i];
							offsetStep = cnx.getOffsetStep() > 0 ? 1 : 0;
							offsetStep += prevOffStep;
							totalSteps += offsetStep;
							prevOffStep = cnx.getOffsetStep() == -1 ? 1 : 0;
							cnx.moveToXY(offset + portStep * (i + totalSteps), sideYpos);
							if (!areOrdered) {
								cnx.setOrder(i);
							}
						}
					}
				}
				// markup ports
				//if (node.getMarkupInPort() != null) {
				//	cnx = node.getMarkupInPort().getConnector();
				//	side = node.getPreferredInputSide();
				//	if (side == constants.nodeSide().FRONT || side == constants.nodeSide().BACK) {
				//		cnx.moveToXY(0, height);
				//	} else if (side == constants.nodeSide().LEFT) {
				//		cnx.moveToXY(0, 0);
				//	} else if (side == constants.nodeSide().RIGHT) {
				//		cnx.moveToXY(0, height);
				//	}
				//}
				//if (node.getMarkupOutPort() != null) {
				//	cnx = node.getMarkupOutPort().getConnector();
				//	side = node.getPreferredInputSide();
				//	if (side == constants.nodeSide().FRONT || side == constants.nodeSide().BACK) {
				//		cnx.moveToXY(width, height);
				//	} else if (side == constants.nodeSide().LEFT) {
				//		cnx.moveToXY(width, 0);
				//	} else if (side == constants.nodeSide().RIGHT) {
				//		cnx.moveToXY(width, height);
				//	}
				//}
			}
		};

		//////
		return {
			getEdgeConnectionPoint: function(port) {
				var base = port.getConnector();
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					if (port.height === 0) {
						return new Point(base.globalX(), base.globalY());
					} else if (base.side === constants.nodeSide().FRONT) {
						return new Point(base.globalX(), base.globalY() + Math.floor(port.height/2) + port.getOffset());
					} else if (base.side === constants.nodeSide().BACK) {
						return new Point(base.globalX(), base.globalY() - Math.floor(port.height/2) - port.getOffset());
					} else if (base.side === constants.nodeSide().LEFT) {
						return new Point(base.globalX() + Math.floor(port.width/2) + port.getOffset(), base.globalY());
					} else if (base.side === constants.nodeSide().RIGHT) {
						return new Point(base.globalX() - Math.floor(port.width/2) - port.getOffset(), base.globalY());
					}
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					if (port.width === 0) {
						return new Point(base.globalX(), base.globalY());
					} else if (base.side === constants.nodeSide().FRONT) {
						return new Point(base.globalX() + Math.floor(port.width/2) + port.getOffset(), base.globalY());
					} else if (base.side === constants.nodeSide().BACK) {
						return new Point(base.globalX() - Math.floor(port.width/2) - port.getOffset(), base.globalY());
					} else if (base.side === constants.nodeSide().LEFT) {
						return new Point(base.globalX(), base.globalY() - Math.floor(port.height/2) - port.getOffset());
					} else if (base.side === constants.nodeSide().RIGHT) {
						return new Point(base.globalX(), base.globalY() + Math.floor(port.height/2) + port.getOffset());
					}
				}
				return new Point(0,0);
			},

			getEdgeConnectionInversePoint: function(port) {
				var base = port.getConnector();
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					if (port.height === 0) {
						return new Point(base.globalX(), base.globalY());
					} else if (base.side === constants.nodeSide().FRONT) {
						return new Point(base.globalX(), base.globalY() - Math.floor(port.height/2) - port.getOffset());
					} else if (base.side === constants.nodeSide().BACK) {
						return new Point(base.globalX(), base.globalY() + Math.floor(port.height/2) + port.getOffset());
					} else if (base.side === constants.nodeSide().LEFT) {
						return new Point(base.globalX() + Math.floor(port.width/2) + port.getOffset(), base.globalY());
					} else if (base.side === constants.nodeSide().RIGHT) {
						return new Point(base.globalX() - Math.floor(port.width/2) - port.getOffset(), base.globalY());
					}
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					if (port.width === 0) {
						return new Point(base.globalX(), base.globalY());
					} else if (base.side === constants.nodeSide().FRONT) {
						return new Point(base.globalX() - Math.floor(port.width/2) - port.getOffset(), base.globalY());
					} else if (base.side === constants.nodeSide().BACK) {
						return new Point(base.globalX() + Math.floor(port.width/2) + port.getOffset(), base.globalY());
					} else if (base.side === constants.nodeSide().LEFT) {
						return new Point(base.globalX(), base.globalY() - Math.floor(port.height/2) - port.getOffset());
					} else if (base.side === constants.nodeSide().RIGHT) {
						return new Point(base.globalX(), base.globalY() + Math.floor(port.height/2) + port.getOffset());
					}
				}
				return new Point(0,0);
			},


			///////////////////////////////////////
			adjustSize: function(node) {
				if (node.getFlowType() === constants.flowType().DECISION) { // not dependent from flow direction
					var geDWidth = node.getEffectiveWidth(config.getGlobalDecisionWidth(), config.getGlobalDecisionHeight()),
						geDHeight = node.getEffectiveHeight(config.getGlobalDecisionWidth(), config.getGlobalDecisionHeight()),
						textWidth = node.getEffectiveWidth(node.getContentSize().width, node.getContentSize().height),
						textHeight = node.getEffectiveHeight(node.getContentSize().width, node.getContentSize().height),
						newDWidth = Math.max(geDWidth, textWidth),
						newDHeight = Math.max(geDHeight, textHeight);
					newDWidth += 2*node.getResizeW();
					newDHeight += 2*node.getResizeH();
					node.setSize(newDWidth, newDHeight);
					return;
				} else if (node.getFlowType() === constants.flowType().SWITCH) { // not dependent from flow direction
					var swGWidth = node.getEffectiveWidth(config.getGlobalSwitchWidth(), config.getGlobalSwitchHeight()),
						swGHeight = node.getEffectiveHeight(config.getGlobalSwitchWidth(), config.getGlobalSwitchHeight()),
						swTextWidth = node.getEffectiveWidth(node.getContentSize().width, node.getContentSize().height),
						swTextHeight = node.getEffectiveHeight(node.getContentSize().width, node.getContentSize().height),
						swNewWidth = Math.max(swGWidth, swTextWidth),
						swNewHeight = Math.max(swGHeight, swTextHeight);
					swNewWidth += 2*node.getResizeW();
					swNewHeight += 2*node.getResizeH();
					node.setSize(swNewWidth, swNewHeight);
					return;
				} else if (node.getFlowType() === constants.flowType().ENDPOINT) { // not dependent from flow direction
					var epGWidth = node.getEffectiveWidth(config.getGlobalTerminatorWidth(), config.getGlobalTerminatorHeight()),
						epGHeight = node.getEffectiveHeight(config.getGlobalTerminatorWidth(), config.getGlobalTerminatorHeight()),
						epTextWidth = node.getEffectiveWidth(node.getContentSize().width, node.getContentSize().height),
						epTextHeight = node.getEffectiveHeight(node.getContentSize().width, node.getContentSize().height),
						epNewWidth = Math.max(epGWidth, epTextWidth),
						epNewHeight = Math.max(epGHeight, epTextHeight);
					epNewWidth += 2*node.getResizeW();
					epNewHeight += 2*node.getResizeH();
					node.setSize(epNewWidth, epNewHeight);
					return;
				}
				//if (node.getName() === "T1") {
				//	console.log("### T1 adjustSize 1: "+node.getNodeWidth()+", "+node.getNodeHeight()+", resize: "+node.getResizeW()+", "+node.getResizeH());
				//}
				var portStep = node.getPortStep(),
					flowType = node.getFlowType(),
					geWidth = node.getEffectiveWidth(config.getGlobalNodeWidth(flowType), config.getGlobalNodeHeight(flowType)),
					geHeight = node.getEffectiveHeight(config.getGlobalNodeWidth(flowType), config.getGlobalNodeHeight(flowType)),
					contentWidth = node.getEffectiveWidth(node.getContentSize().width, node.getContentSize().height),
					contentHeight = node.getEffectiveHeight(node.getContentSize().width, node.getContentSize().height),
					cnxNum, totalCnxNum, newLength, newWidth, newHeight,
					lengthAcross,
					lengthAlong;
				if (node.getFrontConnectors().length > 0 || node.getBackConnectors().length > 0 ||
					!node.getContentSize().isNull() || node.getContentText().length === 0) {
					var isFront = node.getFrontConnectors().length >= node.getBackConnectors().length;
					var alongConnectors = isFront ?
						node.getFrontConnectors() : node.getBackConnectors();
					cnxNum = alongConnectors.length;
					totalCnxNum = cnxNum + getOffsetSteps(alongConnectors);
					lengthAlong = portStep * (totalCnxNum + 1);
					if (config.getFlowDirection() === constants.flow().VERTICAL) {
						if (node.isSizeAdjustable()) {
							if (lengthAlong < geWidth) {
								lengthAlong = geWidth;
							}
							lengthAlong = Math.max(lengthAlong, contentWidth);
							if (node.getNodeWidth() > lengthAlong) {
								lengthAlong += 2*node.getResizeW();
								// correct the size on undo
								lengthAlong = Math.min(lengthAlong, node.getNodeWidth());
							}
							//newHeight = node.getContentSize().isNull() ? geHeight : contentHeight;
							//newHeight += 2*node.getResizeH();
							//node.setSize(newLength, newHeight);
						} else {
							lengthAlong = geWidth;
						}
					} else {
						if (node.isSizeAdjustable()) {
							if (lengthAlong < geHeight) {
								lengthAlong = geHeight;
							}
							lengthAlong = Math.max(lengthAlong, contentHeight);
							if (node.getNodeHeight() > lengthAlong) {
								lengthAlong += 2*node.getResizeH();
								lengthAlong = Math.min(lengthAlong, node.getNodeHeight());
							}
							//newWidth = node.getContentSize().isNull() ? geWidth : contentWidth;
							//newWidth += 2*node.getResizeW();
							//node.setSize(newWidth, newLength);
						} else {
							lengthAlong = geHeight;
						}
					}
				}
				//if (node.getName() === "T1") {
				//	console.log("%%% T1 adjustSize 1: "+node.getNodeWidth()+", "+node.getNodeHeight());
				//}
				if (node.getRightConnectors().length > 0 || node .getLeftConnectors().length > 0 ||
					!node.getContentSize().isNull() || node.getContentText().length === 0) {
					var isRight = node.getRightConnectors().length >= node.getLeftConnectors().length;
					var acrossConnectors = isRight ?
						node.getRightConnectors() : node.getLeftConnectors();
					cnxNum = acrossConnectors.length;
					totalCnxNum = cnxNum + getOffsetSteps(acrossConnectors);
					lengthAcross = portStep * (totalCnxNum + 1);
					if (config.getFlowDirection() === constants.flow().VERTICAL) {
						if (node.isSizeAdjustable()) {
							if (lengthAcross < geHeight) {
								lengthAcross = geHeight;
							}
							lengthAcross = Math.max(lengthAcross, contentHeight);
							if (node.getNodeHeight() > lengthAcross) {
								lengthAcross += 2*node.getResizeH();
								lengthAcross = Math.min(lengthAcross, node.getNodeHeight());
							}
							//newWidth = node.getContentSize().isNull() ? geWidth : contentWidth;
							//newWidth += 2*node.getResizeW();
							//node.setSize(newWidth, newLength);
						} else {
							lengthAcross = geHeight;
						}
					} else {
						if (node.isSizeAdjustable()) {
							if (lengthAcross < geWidth) {
								lengthAcross = geWidth;
							}
							lengthAcross = Math.max(lengthAcross, contentWidth);
							if (node.getNodeWidth() > lengthAcross) {
								lengthAcross += 2*node.getResizeW();
								lengthAcross = Math.min(lengthAcross, node.getNodeWidth());
							}
							//newHeight = node.getContentSize().isNull() ? geHeight : contentHeight;
							//newHeight += 2*node.getResizeH();
							//node.setSize(newLength, newHeight);
						} else {
							lengthAcross = geWidth;
						}
					}
				}
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					node.setSize(lengthAlong, lengthAcross);
				} else {
					node.setSize(lengthAcross, lengthAlong);
				}
				//if (node.getName() === "SW1") {
				//console.log("### SW1 adjustSize 2: "+node.getNodeWidth()+", "+node.getNodeHeight()+", resize: "+node.getResizeW()+", "+node.getResizeH());
				//}
			},
			/////////////////////////////

			getAdjustedSize: function(node) {
				if (node.getFlowType() === constants.flowType().DECISION) {
					return new Dimension(config.getGlobalDecisionWidth(), config.getGlobalDecisionHeight());
				} else if (node.getFlowType() === constants.flowType().SWITCH) {
					return new Dimension(config.getGlobalSwitchWidth(), config.getGlobalSwitchHeight());
				}
				var portStep = node.getPortStep(),
					flowType = node.getFlowType(),
					cnxNum, totalCnxNum, calcLength,
					lengthAcross = config.getGlobalNodeWidth(flowType),
					lengthAlong = config.getGlobalNodeHeight(flowType);
				if (node.getFrontConnectors().length > 0 || node.getBackConnectors().length > 0) {
					var isFront = node.getFrontConnectors().length >= node.getBackConnectors().length;
					var alongConnectors = isFront ?
						node.getFrontConnectors() : node.getBackConnectors();
					cnxNum = alongConnectors.length;
					totalCnxNum = cnxNum + getOffsetSteps(alongConnectors);
					calcLength = portStep * (totalCnxNum + 1);
					lengthAcross = Math.max(lengthAcross, calcLength);
				}
				if (node.getRightConnectors().length > 0 || node .getLeftConnectors().length > 0) {
					var isRight = node.getRightConnectors().length >= node.getLeftConnectors().length;
					var acrossConnectors = isRight ?
						node.getRightConnectors() : node.getLeftConnectors();
					cnxNum = acrossConnectors.length;
					totalCnxNum = cnxNum + getOffsetSteps(acrossConnectors);
					calcLength = portStep * (totalCnxNum + 1);
					lengthAlong = Math.max(lengthAlong, calcLength);
				}
				return config.getFlowDirection() === constants.flow().VERTICAL ?
					new Dimension(lengthAcross, lengthAlong) : new Dimension(lengthAlong, lengthAcross);
			},

			isInputConnectionAccepted: function(node, side) {
				return (node.getInputStyle().hasBack() && (side & constants.nodeSide().BACK) != 0 ||
						node.getInputStyle().hasFront() && (side & constants.nodeSide().FRONT) != 0 ||
						node.getInputStyle().hasLeft() && (side & constants.nodeSide().LEFT) != 0 ||
						node.getInputStyle().hasRight() && (side & constants.nodeSide().RIGHT) != 0);
			},

			isOutputConnectionAccepted: function(node, side) {
				return (node.getOutputStyle().hasBack() && (side & constants.nodeSide().BACK) != 0 ||
						node.getOutputStyle().hasFront() && (side & constants.nodeSide().FRONT) != 0 ||
						node.getOutputStyle().hasLeft() && (side & constants.nodeSide().LEFT) != 0 ||
						node.getOutputStyle().hasRight() && (side & constants.nodeSide().RIGHT) != 0);
			},

			createConnector: function(node, name, side, direction) {
				if (direction === constants.portDirection().IN || direction === constants.portDirection().OUT) {
					return createNewConnector(node, name, side, direction);
				} else {
					return createNewMarkupConnector(node, name, side, direction);
				}
			},

			adjustConnectors: function(node) {
				adjustConnectorsToStep(node);
			},

			getMaxNodeWidth: function(nodes) {
				var w = constants.nodeMinSize().WIDTH;
				for (var i = 0; i < nodes.length; i++) {
					if (!nodes[i].isVisible()) continue;
					var r = nodes[i].getWrapper();
					w = Math.max(w, r.width);
				}
				return w;
			},

			getMaxNodeHeight: function(nodes) {
				var h = constants.nodeMinSize().HEIGHT;
				for (var i = 0; i < nodes.length; i++) {
					//if (nodes[i].getName() === "P9") {
					//	console.log("##  max cell node: P9 visible = "+nodes[i].isVisible());
					//}
					if (!nodes[i].isVisible()) continue;
					var r = nodes[i].getWrapper();
					h = Math.max(h, r.height);
				}
				return h;
			},

			getMaxCellWidth: function(cells) {
				var w = 0;
				for (var i = 0; i < cells.length; i++) {
					w = Math.max(w, cells[i].width);
				}
				return w;
			},

			getMaxCellHeight: function(cells) {
				var h = 0;
				for (var i = 0; i < cells.length; i++) {
					h = Math.max(h, cells[i].height);
				}
				return h;
			}


		}
	}
);