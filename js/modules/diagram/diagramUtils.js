define('modules/diagram/diagramUtils',
	['modules/graph/graphConstants',
		'modules/geometry/rectangle',
		'modules/settings/config'],
	function(constants,
			 Rectangle,
			 config) {

		var START_PREFIX  = "S",
			END_PREFIX  = "E",
			CONTAINER_PREFIX  = "B",
			PROCESS_PREFIX  = "P",
			TEXT_PREFIX  = "A",
			INOUT_PREFIX  = "IO",
			DECISION_PREFIX  = "D",
			SWITCH_PREFIX  = "SW",
			PAGE_PREFIX  = "PG",
			PAGE_CNX_PREFIX  = "PGX",
			ENDPOINT_PREFIX  = "T",
			LEFTTOP_PREFIX  = "L",
			RIGHTBOTTOM_PREFIX  = "R",
			NO_PREFIX  = "NONE";

		var getNameBase = function(type) {
			if (type === constants.flowType().START) {
				return START_PREFIX;
			} else if (type === constants.flowType().END) {
				return END_PREFIX;
			} else if (type === constants.flowType().CONTAINER) {
				return CONTAINER_PREFIX;
			} else if (type === constants.flowType().PROCESS) {
				return PROCESS_PREFIX;
			} else if (type === constants.flowType().TEXT) {
				return TEXT_PREFIX;
			} else if (type === constants.flowType().IN_OUT) {
				return INOUT_PREFIX;
			} else if (type === constants.flowType().DECISION) {
				return DECISION_PREFIX;
			} else if (type === constants.flowType().SWITCH) {
				return SWITCH_PREFIX;
			} else if (type === constants.flowType().PAGE) {
				return PAGE_PREFIX;
			} else if (type === constants.flowType().PAGE_CNX) {
				return PAGE_CNX_PREFIX;
			} else if (type === constants.flowType().ENDPOINT) {
				return ENDPOINT_PREFIX;
			} else if (type === constants.flowType().LEFT_TOP) {
				return LEFTTOP_PREFIX;
			} else if (type === constants.flowType().RIGHT_BOTTOM) {
				return RIGHTBOTTOM_PREFIX;
			} else {
				return NO_PREFIX;
			}
		},
		getDiamondNRect = function(rect) {
			// NORTH
			var ww = rect.width/4,
				hh = rect.height/4;
			//return new Rectangle(rect.x+rect.width/2-ww/2, rect.y, ww, hh);
			return new Rectangle(rect.x+ww, rect.y, rect.width/2, hh);
		},
		//getDiamondNERect = function(rect) {
		//	// NORTH-EAST
		//	var ww = rect.width/4,
		//		hh = rect.height/4;
		//	return new Rectangle(rect.x+rect.width/2+ww/2, rect.y+hh/2, ww, hh);
		//},
		getDiamondERect = function(rect) {
			// EAST
			var ww = rect.width/4,
				hh = rect.height/4;
			return new Rectangle(rect.x+rect.width/2+ww, rect.y+hh, ww, rect.height/2);
		},
		//getDiamondSERect = function(rect) {
		//	// SOUTH-EAST
		//	var ww = rect.width/4,
		//		hh = rect.height/4;
		//	return new Rectangle(rect.x+rect.width/2+ww/2, rect.y+rect.height/2+hh/2, ww, hh);
		//},
		getDiamondSRect = function(rect) {
			// SOUTH
			var ww = rect.width/4,
				hh = rect.height/4;
			return new Rectangle(rect.x+ww, rect.y+rect.height/2+hh, rect.width/2, hh);
		},
		//getDiamondSWRect = function(rect) {
		//	// SOUTH-WEST
		//	var ww = rect.width/4,
		//		hh = rect.height/4;
		//	return new Rectangle(rect.x+ww/2, rect.y+rect.height/2+hh/2, ww, hh);
		//},
		getDiamondWRect = function(rect) {
			// WEST
			var ww = rect.width/4,
				hh = rect.height/4;
			return new Rectangle(rect.x, rect.y+hh, ww, rect.height/2);
		},
		//getDiamondNWRect = function(rect) {
		//	// NORTH-WEST
		//	var ww = rect.width/4,
		//		hh = rect.height/4;
		//	return new Rectangle(rect.x+ww/2, rect.y+hh/2, ww, hh);
		//},
		getDiamondCtrRect = function(rect) {
			// CENTRAL
			var ww = rect.width/4,
				hh = rect.height/4;
			return new Rectangle(rect.x+ww, rect.y+hh, rect.width/2, rect.height/2);
		};



		return {
			getNodeGroup: function(flowType) {
				if (flowType === constants.flowType().PROCESS) {
					return constants.nodeGroup().PROC;
				} else if (flowType === constants.flowType().DECISION ||
					flowType === constants.flowType().SWITCH) {
					return constants.nodeGroup().DEC;
				} else if (flowType === constants.flowType().IN_OUT) {
					return constants.nodeGroup().IO;
				} else if (flowType === constants.flowType().START ||
					flowType === constants.flowType().END) {
					return constants.nodeGroup().SE;
				} else if (flowType === constants.flowType().LEFT_TOP ||
					flowType === constants.flowType().RIGHT_BOTTOM) {
					return constants.nodeGroup().SIDE;
				} else if (flowType === constants.flowType().ENDPOINT) {
					return constants.nodeGroup().TERM;
				} else {
					return constants.nodeGroup().NONE;
				}
			},
			getNodeCategory: function(flowType) {
				if (flowType === constants.flowType().PROCESS ||
					flowType === constants.flowType().LEFT_TOP ||
					flowType === constants.flowType().RIGHT_BOTTOM ||
					flowType === constants.flowType().IN_OUT) {
					return constants.nodeCategory().FLOW;
				} else if (flowType === constants.flowType().START ||
					flowType === constants.flowType().END) {
					return constants.nodeCategory().FLAG;
				} else if (flowType === constants.flowType().DECISION ||
					flowType === constants.flowType().SWITCH) {
					return constants.nodeCategory().QUIZ;
				} else if (flowType === constants.flowType().PAGE) {
					return constants.nodeCategory().PAGE;
				} else {
					return constants.nodeCategory().NONE;
				}
			},
			generateNextNodeName: function(namesMap, flowType) {
				var base = getNameBase(flowType);
				var intList = [];
				var names = namesMap.get(flowType);
				if (names) {
					var baseLength = base.length;
					for (var i = 0; i < names.length; i++) {
						var name = names[i];
						if (name.startsWith(base) && name.length > baseLength) {
							var suffix = name.substring(baseLength);
							var intVal = parseInt(suffix);
							if (!isNaN(intVal)) {
								intList.push(intVal);
							}
						}
					}
				}
				if (intList.length > 0) {
					intList.sort(function (a, b) {  return a - b;  });
					var k = intList[intList.length-1];
					return base+(++k);
				} else {
					return base+1;
				}
			},
			getFlowType: function (s) {
				if (s === constants.flowId().START) {
					return constants.flowType().START;
				} else if (s === constants.flowId().END) {
					return constants.flowType().END;
				} else if (s === constants.flowId().PROCESS) {
					return constants.flowType().PROCESS;
				} else if (s === constants.flowId().IN_OUT) {
					return constants.flowType().IN_OUT;
				} else if (s === constants.flowId().LEFT_TOP) {
					return constants.flowType().LEFT_TOP;
				} else if (s === constants.flowId().RIGHT_BOTTOM) {
					return constants.flowType().RIGHT_BOTTOM;
				} else if (s === constants.flowId().DECISION) {
					return constants.flowType().DECISION;
				} else if (s === constants.flowId().ENDPOINT) {
					return constants.flowType().ENDPOINT;
				//} else if (s === constants.flowId().LINK) {
				//	return constants.flowType().LINK;
				//} else if (s === constants.flowId().REF_LINK) {
				//	return constants.flowType().REF_LINK;
				} else if (s === constants.flowId().PORT) {
					return constants.flowType().PORT;
				} else if (s === constants.flowId().CONTAINER) {
					return constants.flowType().CONTAINER;
				} else if (s === constants.flowId().SWITCH) {
					return constants.flowType().SWITCH;
				} else if (s === constants.flowId().PAGE) {
					return constants.flowType().PAGE;
				} else if (s === constants.flowId().PAGE_CNX) {
					return constants.flowType().PAGE_CNX;
				} else if (s === constants.flowId().TEXT) {
					return constants.flowType().TEXT;
				} else {
					return constants.flowType().NONE;
				}
			},
			getFlowTypeName: function (type) {
				if (type === constants.flowType().START) {
					return constants.flowId().START;
				} else if (type === constants.flowType().END) {
					return constants.flowId().END;
				} else if (type === constants.flowType().PROCESS) {
					return constants.flowId().PROCESS;
				} else if (type === constants.flowType().IN_OUT) {
					return constants.flowId().IN_OUT;
				} else if (type === constants.flowType().LEFT_TOP) {
					return constants.flowId().LEFT_TOP;
				} else if (type === constants.flowType().RIGHT_BOTTOM) {
					return constants.flowId().RIGHT_BOTTOM;
				} else if (type === constants.flowType().DECISION) {
					return constants.flowId().DECISION;
				} else if (type === constants.flowType().ENDPOINT) {
					return constants.flowId().ENDPOINT;
				//} else if (type === constants.flowType().LINK) {
				//	return constants.flowId().LINK;
				//} else if (type === constants.flowType().REF_LINK) {
				//	return constants.flowId().REF_LINK;
				} else if (type === constants.flowType().PORT) {
					return constants.flowId().PORT;
				} else if (type === constants.flowType().CONTAINER) {
					return constants.flowId().CONTAINER;
				} else if (type === constants.flowType().SWITCH) {
					return constants.flowId().SWITCH;
				} else if (type === constants.flowType().PAGE) {
					return constants.flowId().PAGE;
				} else if (type === constants.flowType().PAGE_CNX) {
					return constants.flowId().PAGE_CNX;
				} else if (type === constants.flowType().TEXT) {
					return constants.flowId().TEXT;
				} else {
					return "";
				}
			},
			//getFlowTypeForGalleryId: function (id) {
			//	if (id === constants.flowId().START) {
			//		return constants.flowType().START;
			//	} else if (id === constants.flowId().END) {
			//		return constants.flowType().END;
			//	} else if (id === constants.flowId().PROCESS) {
			//		return constants.flowType().PROCESS;
			//	} else if (id === constants.flowId().IN_OUT) {
			//		return constants.flowType().IN_OUT;
			//	} else if (id === constants.flowId().LEFT_TOP) {
			//		return constants.flowType().LEFT_TOP;
			//	} else if (id === constants.flowId().RIGHT_BOTTOM) {
			//		return constants.flowType().RIGHT_BOTTOM;
			//	} else if (id === constants.flowId().DECISION) {
			//		return constants.flowType().DECISION;
			//	} else if (id === constants.flowId().ENDPOINT) {
			//		return constants.flowType().ENDPOINT;
			//	} else if (id === constants.flowId().CONTAINER) {
			//		return constants.flowType().CONTAINER;
			//	} else if (id === constants.flowId().SWITCH) {
			//		return constants.flowType().SWITCH;
			//	} else if (id === constants.flowId().TEXT) {
			//		return constants.flowType().TEXT;
			//	} else {
			//		return constants.flowType().NONE;
			//	}
			//},
			getCrossingName: function(id) {
				if (id === constants.pipeXing().SIDE_BOX) {
					return "SIDE BOX";
				} else if (id === constants.pipeXing().CROSS_BOX) {
					return "CROSS BOX";
				} else {
					return "NONE";
				}
			},
			//getPortDirection: function(s) {
			//	if (s === "IN") {
			//		return constants.portDirection().IN;
			//	} else if (s === "OUT") {
			//		return constants.portDirection().OUT;
			//	} else if (s === "MARK_IN") {
			//		return constants.portDirection().MARK_IN;
			//	} else if (s === "MARK_OUT") {
			//		return constants.portDirection().MARK_OUT;
			//	} else {
			//		return constants.portDirection().NONE;
			//	}
			//},
			//getNodeSide: function(s) {
			//	if (s === "FRONT") {
			//		return constants.nodeSide().FRONT;
			//	} else if (s === "BACK") {
			//		return constants.nodeSide().BACK;
			//	} else if (s === "RIGHT") {
			//		return constants.nodeSide().RIGHT;
			//	} else if (s === "LEFT") {
			//		return constants.nodeSide().LEFT;
			//	} else if (s === "ANY") {
			//		return constants.nodeSide().ANY;
			//	} else {
			//		return constants.nodeSide().NONE;
			//	}
			//},
			getNodeSideName: function(side) {
				if (side === constants.nodeSide().FRONT) {
					return "FRONT";
				} else if (side === constants.nodeSide().BACK) {
					return "BACK";
				} else if (side === constants.nodeSide().RIGHT) {
					return "RIGHT";
				} else if (side === constants.nodeSide().LEFT) {
					return "LEFT";
				} else if (side === constants.nodeSide().ANY) {
					return "ANY";
				} else {
					return "";
				}
			},
			getResultName: function(result) {
				if (result === constants.result().OK) {
					return "OK";
				} else if (result === constants.result().HAS_FIX) {
					return "HAS_FIX";
				} else if (result === constants.result().RETRY_FIX) {
					return "RETRY_FIX";
				} else if (result === constants.result().REDO_LAYOUT) {
					return "REDO_LAYOUT";
				} else if (result === constants.result().FAILED) {
					return "FAILED";
				} else {
					return "";
				}
			},
			//getDecisionEndsName: function(ends) {
			//	if (ends === constants.decisionEnds().TRUE_FALSE_EMPTY) {
			//		return "TRUE_FALSE_EMPTY";
			//	} else if (ends === constants.decisionEnds().FALSE_TRUE_EMPTY) {
			//		return "FALSE_TRUE_EMPTY";
			//	} else if (ends === constants.decisionEnds().TRUE_EMPTY_FALSE) {
			//		return "TRUE_EMPTY_FALSE";
			//	} else if (ends === constants.decisionEnds().FALSE_EMPTY_TRUE) {
			//		return "FALSE_EMPTY_TRUE";
			//	} else if (ends === constants.decisionEnds().EMPTY_TRUE_FALSE) {
			//		return "EMPTY_TRUE_FALSE";
			//	} else if (ends === constants.decisionEnds().EMPTY_FALSE_TRUE) {
			//		return "EMPTY_FALSE_TRUE";
			//	} else if (ends === constants.decisionEnds().THREE_ENDS) {
			//		return "THREE_ENDS";
			//	} else {
			//		return "";
			//	}
			//},
			getLinkObjectName: function(linkObj) {
				return "["+linkObj.source+"]-["+linkObj.target+"]";
			},
			getLinkTypeName: function(linkType) {
				if (linkType === constants.linkType().CNX_LINK) {
					return "CONNECTION";
				} else if (linkType === constants.linkType().REF_LINK) {
					return "REFERENCE";
				}
				return "TBD";
			},
			getPortFootprint: function(port) {
				//not needed ?
			},
			getDecisionInputSide: function(input) {
				if (input === constants.decisionInputs().BACK) {
					return constants.nodeSide().BACK;
				} else if (input === constants.decisionInputs().LEFT) {
					return constants.nodeSide().LEFT;
				} else if (input === constants.decisionInputs().RIGHT) {
					return constants.nodeSide().RIGHT;
				}
				return constants.nodeSide().NONE;
			},
			// TRUE / YES
			getDecisionTruePortSide: function(node) {
				//var orientation = config.getFlowDirection();
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					if (node.getInput() === constants.decisionInputs().BACK) {
						if (node.getEnds() === constants.decisionEnds().TRUE_FALSE_EMPTY) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_TRUE_EMPTY) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().TRUE_EMPTY_FALSE) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_EMPTY_TRUE) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_TRUE_FALSE) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_FALSE_TRUE) {
							return constants.nodeSide().LEFT;
						}
					} else if (node.getInput() === constants.decisionInputs().LEFT) {
						if (node.getEnds() === constants.decisionEnds().TRUE_FALSE_EMPTY) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_TRUE_EMPTY) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().TRUE_EMPTY_FALSE) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_EMPTY_TRUE) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_TRUE_FALSE) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_FALSE_TRUE) {
							return constants.nodeSide().FRONT;
						}
					} else if (node.getInput() === constants.decisionInputs().RIGHT) {
						if (node.getEnds() === constants.decisionEnds().TRUE_FALSE_EMPTY) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_TRUE_EMPTY) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().TRUE_EMPTY_FALSE) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_EMPTY_TRUE) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_TRUE_FALSE) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_FALSE_TRUE) {
							return constants.nodeSide().BACK;
						}
					}
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					if (node.getInput() === constants.decisionInputs().BACK) {
						if (node.getEnds() === constants.decisionEnds().TRUE_FALSE_EMPTY) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_TRUE_EMPTY) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().TRUE_EMPTY_FALSE) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_EMPTY_TRUE) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_TRUE_FALSE) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_FALSE_TRUE) {
							return constants.nodeSide().RIGHT;
						}
					} else if (node.getInput() === constants.decisionInputs().LEFT) {
						if (node.getEnds() === constants.decisionEnds().TRUE_FALSE_EMPTY) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_TRUE_EMPTY) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().TRUE_EMPTY_FALSE) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_EMPTY_TRUE) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_TRUE_FALSE) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_FALSE_TRUE) {
							return constants.nodeSide().BACK;
						}
					} else if (node.getInput() === constants.decisionInputs().RIGHT) {
						if (node.getEnds() === constants.decisionEnds().TRUE_FALSE_EMPTY) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_TRUE_EMPTY) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().TRUE_EMPTY_FALSE) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_EMPTY_TRUE) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_TRUE_FALSE) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_FALSE_TRUE) {
							return constants.nodeSide().FRONT;
						}
					}
				}
				return constants.nodeSide().NONE;
			},
			// FALSE / NO
			getDecisionFalsePortSide: function(node) {
				//var orientation = config.getFlowDirection();
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					if (node.getInput() === constants.decisionInputs().BACK) {
						if (node.getEnds() === constants.decisionEnds().TRUE_FALSE_EMPTY) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_TRUE_EMPTY) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().TRUE_EMPTY_FALSE) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_EMPTY_TRUE) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_TRUE_FALSE) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_FALSE_TRUE) {
							return constants.nodeSide().FRONT;
						}
					} else if (node.getInput() === constants.decisionInputs().LEFT) {
						if (node.getEnds() === constants.decisionEnds().TRUE_FALSE_EMPTY) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_TRUE_EMPTY) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().TRUE_EMPTY_FALSE) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_EMPTY_TRUE) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_TRUE_FALSE) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_FALSE_TRUE) {
							return constants.nodeSide().RIGHT;
						}
					} else if (node.getInput() === constants.decisionInputs().RIGHT) {
						if (node.getEnds() === constants.decisionEnds().TRUE_FALSE_EMPTY) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_TRUE_EMPTY) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().TRUE_EMPTY_FALSE) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_EMPTY_TRUE) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_TRUE_FALSE) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_FALSE_TRUE) {
							return constants.nodeSide().LEFT;
						}
					}
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					if (node.getInput() === constants.decisionInputs().BACK) {
						if (node.getEnds() === constants.decisionEnds().TRUE_FALSE_EMPTY) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_TRUE_EMPTY) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().TRUE_EMPTY_FALSE) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_EMPTY_TRUE) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_TRUE_FALSE) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_FALSE_TRUE) {
							return constants.nodeSide().FRONT;
						}
					} else if (node.getInput() === constants.decisionInputs().LEFT) {
						if (node.getEnds() === constants.decisionEnds().TRUE_FALSE_EMPTY) {
							return constants.nodeSide().RIGHT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_TRUE_EMPTY) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().TRUE_EMPTY_FALSE) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_EMPTY_TRUE) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_TRUE_FALSE) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_FALSE_TRUE) {
							return constants.nodeSide().RIGHT;
						}
					} else if (node.getInput() === constants.decisionInputs().RIGHT) {
						if (node.getEnds() === constants.decisionEnds().TRUE_FALSE_EMPTY) {
							return constants.nodeSide().LEFT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_TRUE_EMPTY) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().TRUE_EMPTY_FALSE) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().FALSE_EMPTY_TRUE) {
							return constants.nodeSide().BACK;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_TRUE_FALSE) {
							return constants.nodeSide().FRONT;
						} else if (node.getEnds() === constants.decisionEnds().EMPTY_FALSE_TRUE) {
							return constants.nodeSide().LEFT;
						}
					}
				}
				return constants.nodeSide().NONE;
			},
			getPortDisplayName: function(port) {
				if (port.getName().startsWith(constants.portNames().REF_IN_PORT_LEFT_NAME) ||
					port.getName().startsWith(constants.portNames().REF_IN_PORT_RIGHT_NAME) ||
					port.getName().startsWith(constants.portNames().REF_OUT_PORT_LEFT_NAME) ||
					port.getName().startsWith(constants.portNames().REF_OUT_PORT_RIGHT_NAME)) {
					return port.getName().replace("REF", "A");
				} else {
					return port.getName();
				}
			},
			//getFlowTypeImageURL: function (type) {
			//	var isHorizontal = config.getFlowDirection() === constants.flow().HORIZONTAL;
			//	if (type === constants.flowType().START) {
			//		return isHorizontal ? 'images/dataflow/startH16.png' : 'images/dataflow/startV16.png';
			//	} else if (type === constants.flowType().END) {
			//		return isHorizontal ? 'images/dataflow/endH16.png' : 'images/dataflow/endV16.png';
			//	} else if (type === constants.flowType().PROCESS) {
			//		return isHorizontal ? 'images/dataflow/actionH16.png' : 'images/dataflow/actionV16.png';
			//	} else if (type === constants.flowType().IN_OUT) {
			//		return isHorizontal ? 'images/dataflow/actionSkewH16.png' : 'images/dataflow/actionSkewV16.png';
			//	} else if (type === constants.flowType().LEFT_TOP) {
			//		return isHorizontal ? 'images/dataflow/actionTopH16.png' : 'images/dataflow/actionLeftV16.png';
			//	} else if (type === constants.flowType().RIGHT_BOTTOM) {
			//		return isHorizontal ? 'images/dataflow/actionBottomH16.png' : 'images/dataflow/actionRightV16.png';
			//	} else if (type === constants.flowType().DECISION) {
			//		return isHorizontal ? 'images/dataflow/decisionH16.png' : 'images/dataflow/decisionV16.png';
			//	} else {
			//		return "";
			//	}
			//},
			getDiamondNorthRect: function(rect) {
				return getDiamondNRect(rect);
			},
			//getDiamondNorthEastRect: function(rect) {
			//	return getDiamondNERect(rect);
			//},
			getDiamondEastRect: function(rect) {
				return getDiamondERect(rect);
			},
			//getDiamondSouthEastRect: function(rect) {
			//	return getDiamondSERect(rect);
			//},
			getDiamondSouthRect: function(rect) {
				return getDiamondSRect(rect);
			},
			//getDiamondSouthWestRect: function(rect) {
			//	return getDiamondSWRect(rect);
			//},
			getDiamondWestRect: function(rect) {
				return getDiamondWRect(rect);
			},
			//getDiamondNorthWestRect: function(rect) {
			//	return getDiamondNWRect(rect);
			//},
			getDiamondCentralRect: function(rect) {
				return getDiamondCtrRect(rect);
			},
			getResizeRectangle: function(node, point) {
				if (!node.allowsResize()) {
					return undefined;
				}
				var r = node.clone();
				if (node.getFlowType() === constants.flowType().DECISION) {
					var n_rect = getDiamondNRect(node);
					if (n_rect.hasPointInside(point)) {
						n_rect.setOrientation(constants.orientation().N);
						return n_rect;
					}
					var e_rect = getDiamondERect(node);
					if (e_rect.hasPointInside(point)) {
						e_rect.setOrientation(constants.orientation().E);
						return e_rect;
					}
					var s_rect = getDiamondSRect(node);
					if (s_rect.hasPointInside(point)) {
						s_rect.setOrientation(constants.orientation().S);
						return s_rect;
					}
					var w_rect = getDiamondWRect(node);
					if (w_rect.hasPointInside(point)) {
						w_rect.setOrientation(constants.orientation().W);
						return w_rect;
					}
				} else {
					var frame = constants.nodeSurface().FRAME,
						n_rect = new Rectangle(r.x+frame, r.y, r.width-2*frame, frame);
					if (n_rect.hasPointInside(point)) {
						n_rect.setOrientation(constants.orientation().N);
						return n_rect;
					}
					var nw_rect = new Rectangle(r.x, r.y, frame, frame);
					if (nw_rect.hasPointInside(point)) {
						nw_rect.setOrientation(constants.orientation().NW);
						return nw_rect;
					}
					var ne_rect = new Rectangle(r.x+r.width-frame, r.y, frame, frame);
					if (ne_rect.hasPointInside(point)) {
						ne_rect.setOrientation(constants.orientation().NE);
						return ne_rect;
					}
					var e_rect = new Rectangle(r.x+r.width-frame, r.y+frame, frame, r.height-2*frame);
					if (e_rect.hasPointInside(point)) {
						e_rect.setOrientation(constants.orientation().E);
						return e_rect;
					}
					var s_rect = new Rectangle(r.x+frame, r.y+r.height-frame, r.width-2*frame, frame);
					if (s_rect.hasPointInside(point)) {
						s_rect.setOrientation(constants.orientation().S);
						return s_rect;
					}
					var se_rect = new Rectangle(r.x+r.width-frame, r.y+r.height-frame, frame, frame);
					if (se_rect.hasPointInside(point)) {
						se_rect.setOrientation(constants.orientation().SE);
						return se_rect;
					}
					var sw_rect = new Rectangle(r.x, r.y+r.height-frame, frame, frame);
					if (sw_rect.hasPointInside(point)) {
						sw_rect.setOrientation(constants.orientation().SW);
						return sw_rect;
					}
					var w_rect = new Rectangle(r.x, r.y+frame, frame, r.height-2*frame);
					if (w_rect.hasPointInside(point)) {
						w_rect.setOrientation(constants.orientation().W);
						return w_rect;
					}
				}
				return undefined;
			},
			getResizeCursor: function(rect) {
				if (!rect) {
					return "auto";
				}
				if (rect.getOrientation() === constants.orientation().N ||
					rect.getOrientation() === constants.orientation().S) {
					return "ns-resize";
				} else
				if (rect.getOrientation() === constants.orientation().E ||
					rect.getOrientation() === constants.orientation().W) {
					return "ew-resize";
				} else
				if (rect.getOrientation() === constants.orientation().NE ||
					rect.getOrientation() === constants.orientation().SW) {
					return "nesw-resize";
				} else
				if (rect.getOrientation() === constants.orientation().NW||
					rect.getOrientation() === constants.orientation().SE) {
					return "nwse-resize";
				} else {
					return "auto;"
				}
			},
			setResizeValues: function(node, rsDir, point, startPoint) {
				var factor = config.getScale(),
					isVertical = config.getFlowDirection() === constants.flow().VERTICAL,
					dX = (point.x - startPoint.x) / factor,
					dY = (point.y - startPoint.y) / factor,
					//dX = (isVertical ? (point.x - startPoint.x) : (point.y - startPoint.y)) / factor,
					//dY = (isVertical ? (point.y - startPoint.y) : (point.x - startPoint.x)) / factor,
					sX = 0, sY = 0;
				if (rsDir === constants.orientation().N) { sY = -1; }
				else if (rsDir === constants.orientation().E) { sX = 1; }
				else if (rsDir === constants.orientation().S) { sY = 1; }
				else if (rsDir === constants.orientation().W) { sX = -1; }
				else if (rsDir === constants.orientation().NE) { sX = 1; sY = -1; }
				else if (rsDir === constants.orientation().SE) { sX = 1; sY = 1; }
				else if (rsDir === constants.orientation().SW) { sX = -1; sY = 1; }
				else if (rsDir === constants.orientation().NW) { sX = -1; sY = -1; }
				//node.setResizeW(dX*sX);
				//node.setResizeH(dY*sY);
				node.setResizeDeltaW(dX*sX);
				node.setResizeDeltaH(dY*sY);
			},
			getResizeValues: function(rsDir, point, startPoint) {
				var factor = config.getScale(),
					dX = (point.x - startPoint.x) / factor,
					dY = (point.y - startPoint.y) / factor,
					sX = 0, sY = 0;
				if (rsDir === constants.orientation().N) { sY = -1; }
				else if (rsDir === constants.orientation().E) { sX = 1; }
				else if (rsDir === constants.orientation().S) { sY = 1; }
				else if (rsDir === constants.orientation().W) { sX = -1; }
				else if (rsDir === constants.orientation().NE) { sX = 1; sY = -1; }
				else if (rsDir === constants.orientation().SE) { sX = 1; sY = 1; }
				else if (rsDir === constants.orientation().SW) { sX = -1; sY = 1; }
				else if (rsDir === constants.orientation().NW) { sX = -1; sY = -1; }
				var values = {};
				values.resizeW = dX*sX;
				values.resizeH = dY*sY;
				return values;
			},
			getItemsToSelect: function(rect, nodes, links) {
				var i,
					selected = [],
					factor = config.getScale(),
					selRect = new Rectangle(rect.x/factor,
											rect.y/factor,
											rect.width/factor,
											rect.height/factor);
				for (i = 0; i < nodes.length; i++) {
					if (selRect.intersects(nodes[i])) {
						selected.push(nodes[i]);
					}
				}
				for (i = 0; i < links.length; i++) {
					var segments = links[i].getSegments();
					for (var j = 0; j < segments.length; j++) {
						if (selRect.hasPointInside(segments[j].getStartPoint().multiplyBy(factor)) ||
							selRect.hasPointInside(segments[j].getEndPoint().multiplyBy(factor)) ||
							selRect.isLineIntersecting(segments[j].getStartPoint(), segments[j].getEndPoint())) {
							selected.push(links[i]);
							break;
						}
					}
				}
				return selected;
			},
			getCellRectAt: function(flowManager, levelNumber, laneNumber) {
				var levels = flowManager.getFlowLayout().getLevels(),
					level = levels[levelNumber],
					lanes =  flowManager.getFlowLayout().getLanes(),
					lane = lanes[laneNumber],
					xing = level && lane ? level.intersection(lane) : new Rectangle(0,0,0,0);
				return xing;
			}

		}
	}
);
