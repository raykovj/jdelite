define(['jquery',
		'knockout',
		'modules/gallery/iconOptionsPicker',
		'modules/graph/graphConstants'],
	function($, ko,
	         iconOptionsPicker,
	         constants) {

		function Config() {
			var self = this;

			var _editMode = constants.editMode().EDIT_ALL;
			self.setEditMode = function(edit) { _editMode = edit; };
			self.getEditMode = function() { return _editMode; };
			self.isEditMode = function() { return _editMode === constants.editMode().EDIT_ALL; };

			var _flowDirection = constants.flow().VERTICAL;
			self.getFlowDirection = function() { return _flowDirection; };
			self.setFlowDirection = function(direction) {
				if (direction === constants.flow().HORIZONTAL || direction === constants.flow().VERTICAL) {
					//console.log("** CONFIG: setFlowDirection: "+direction);
					_flowDirection = direction;
				}
			};
			self.setDefaultFlowDirection = function() { _flowDirection = constants.flow().VERTICAL; };

			var _layoutMode = constants.layoutMode().MANUAL;
			self.getLayoutMode = function() {return _layoutMode; };
			self.setLayoutMode = function(layoutMode) {
				//if (layoutMode === constants.layoutMode().AUTO ||
				//	layoutMode === constants.layoutMode().MANUAL) {
				//	//console.log("** setLayoutMode: "+layoutMode);
				//	_layoutMode = layoutMode;
				//}
			};
			self.getLayoutModeText = function() {
				if (_layoutMode === constants.layoutMode().AUTO) { return "AUTO"; }
				else if (_layoutMode === constants.layoutMode().MANUAL) { return "MANUAL"; }
				else { return "";}
			};

			var _scale = 1;
			self.setScale = function(value) {
				if (value < constants.scale().MIN) {
					_scale = constants.scale().MIN;
				} else if (value > constants.scale().MAX) {
					_scale = constants.scale().MAX;
				} else {
					_scale = value;
				}
			};
			self.getScale = function() { return _scale; };

			var _pageMode = false;
			self.hasPageMode = function() { return _pageMode; };

			var _devMode = false;
			self.isDevMode = function() { return _devMode; };

			var _appMode = constants.appMode().FLOW_MODE;
			self.getAppMode = function() {return _appMode; };
			self.setAppMode = function(appMode) {
				if (appMode === constants.appMode().FLOW_MODE ||
					appMode === constants.appMode().PAGE_MODE) {
					_appMode = appMode;
				}
			};
			//self.getAppModeText = function() {
			//	if (_appMode === constants.appMode().FLOW_MODE) { return constants.appTitles().FLOW_TITLE; }
			//	else if (_appMode === constants.appMode().BPEL_MODE) { return constants.appTitles().BPEL_TITLE; }
			//	else if (_appMode === constants.appMode().K8S_MODE) { return constants.appTitles().K8S_TITLE; }
			//	else { return "";}
			//};

			self.getDiagramModeText = function() {
				if (self.hasEnableAddCorridors()) { return "LEVELS / LANES"; }
				else { return "CONTENT";}
			};

			var _portLayout = constants.portLayout().ALIGN_CENTER;
			self.getPortLayout = function() { return _portLayout; };
			self.setPortLayout = function(portLayout) {
				if (portLayout === constants.portLayout().AUTO_ARRANGE ||
					portLayout === constants.portLayout().ALIGN_CENTER ||
					portLayout === constants.portLayout().ALIGN_TOP_LEFT) {
					_portLayout(portLayout);
				}
			};

			var _canvas;
			self.setCanvasReference = function(canvas) { _canvas = canvas; };
			self.getCanvasReference = function() { return _canvas; };

			var _context;
			self.setContextReference = function(ctx) { _context = ctx; };
			self.getContextReference = function() { return _context; };

			var _canvasLevels = constants.initial().LEVELS;
			self.setCanvasLevels = function(levelsNum) { _canvasLevels = levelsNum; };
			self.addCanvasLevel = function() { _canvasLevels += 1; };
			self.removeCanvasLevel = function() {
				if (_canvasLevels > 0) {
					_canvasLevels -= 1;
				} else { alert("Attempt to decrease levels below zero"); }
			};
			self.getCanvasLevels = function() { return _canvasLevels; };

			var _canvasLanes = constants.initial().LANES;
			self.setCanvasLanes = function(lanesNum) { _canvasLanes = lanesNum; };
			self.addCanvasLane = function() { _canvasLanes += 1; };
			self.removeCanvasLane = function() {
				if (_canvasLanes > 0) {
					_canvasLanes -= 1;
				} else { alert("Attempt to decrease lanes below zero"); }
			};
			self.getCanvasLanes = function() { return _canvasLanes; };

			var _startEndLevels = constants.settings().SWIM_LEVELS;
			self.setStartEndLevels = function(value) { _startEndLevels = constants.getBValue(value); };
			self.getStartEndLevels = function() { return _startEndLevels; };
			self.hasStartEndLevels = function() { return _startEndLevels === constants.bValue().TRUE; };

			//var _startEndLevelsChange = constants.change().NONE;
			//self.setStartEndLevelsChange = function(iValue) { _startEndLevelsChange = iValue; };
			//self.getStartEndLevelsChange = function() { return _startEndLevelsChange; };

			var _sideSwimLanes = constants.settings().SWIM_LANES;
			self.setSideSwimLanes = function(value) { _sideSwimLanes = constants.getBValue(value); };
			self.getSideSwimLanes = function() { return _sideSwimLanes; };
			self.hasSideSwimLanes = function() { return _sideSwimLanes === constants.bValue().TRUE; };

			//var _sideSwimLanesChange = constants.change().NONE;
			//self.setSideSwimLanesChange = function(iValue) { _sideSwimLanesChange = iValue; };
			//self.getSideSwimLanesChange = function() { return _sideSwimLanesChange; };

			var _showGrid = constants.settings().SHOW_GRID;
			self.setShowGrid = function(bValue) { _showGrid = bValue; };
			//self.hasShowGrid = function() { return _showGrid; };
			self.hasShowGrid = function() { return false; };

			// true to test show the tooltip, otherwise we show the tip
			// uncomment line 157 in flowDiagram.showTooltip
			var _showTooltip = false;
			self.hasShowTooltip = function() { return _showTooltip; };

			var _showRefHandles = false;
			self.setShowRefHandles = function(bValue) { _showRefHandles = bValue; };
			self.hasShowRefHandles = function() { return _showRefHandles; };

			var _showTitleOnContent = false; // always !!!
			self.hasShowTitleOnContent = function() { return true; };

			var _extraFirstLevel = false;
			self.setExtraFirstLevel = function(bValue) {
				//_extraFirstLevel = bValue;
			};
			self.hasExtraFirstLevel = function() { return _extraFirstLevel; };

			var _extraLastLevel = false;
			self.setExtraLastLevel = function(bValue) {
				//_extraLastLevel = bValue;
			};
			self.hasExtraLastLevel = function() { return _extraLastLevel; };

			var _extraFirstLane = false;
			self.setExtraFirstLane = function(bValue) {
				//_extraFirstLane = bValue;
			};
			self.hasExtraFirstLane = function() { return _extraFirstLane; };

			var _extraLastLane = false;
			self.setExtraLastLane = function(bValue) {
				//_extraLastLane = bValue;
			};
			self.hasExtraLastLane = function() { return _extraLastLane; };

			var _acrossPipeExpand = constants.pipeExpand().ACROSS;
			self.setAcrossPipeExpand = function(iValue) { _acrossPipeExpand = iValue; };
			self.getAcrossPipeExpand = function() { return _acrossPipeExpand; };

			var _alongPipeExpand = constants.pipeExpand().ALONG;
			self.setAlongPipeExpand = function(iValue) { _alongPipeExpand = iValue; };
			self.getAlongPipeExpand = function() { return _alongPipeExpand; };

			var _expandTo = constants.expandToViewport().NONE;
			self.setExpandTo = function(expand) {
				if (expand === constants.expandToViewport().NONE ||
					expand === constants.expandToViewport().ACROSS ||
					expand === constants.expandToViewport().ALONG ||
					expand === constants.expandToViewport().BOTH) {
					console.log("** setExpandTo: "+expand);
					_expandTo = expand;
				}
			};
			self.getExpandTo = function() { return _expandTo; };

			var _autoGenNodeNames = constants.settings().AUTO_GEN;
			self.setAutoGenNodeNames = function(bValue) { _autoGenNodeNames = bValue; };
			self.hasAutoGenNodeNames = function() { return _autoGenNodeNames; };

			var _hideNodeNames = constants.settings().HIDE_NAMES;
			self.setHideNodeNames = function(bValue) { _hideNodeNames = bValue; };
			self.hasHideNodeNames = function() { return _hideNodeNames; };

			var _showNodeIcons = constants.settings().SHOW_NODE_ICONS;
			self.setShowNodeIcons = function(bValue) { _showNodeIcons = constants.getBValue(bValue); };
			self.getShowNodeIcons = function() { return _showNodeIcons; };
			self.hasShowNodeIcons = function() { return _showNodeIcons === constants.bValue().TRUE; };

			var _showLinkLabels = constants.settings().SHOW_LINK_LABELS;
			self.setShowLinkLabels = function(bValue) { _showLinkLabels = bValue; };
			self.hasShowLinkLabels = function() { return _showLinkLabels; };

			var _enableAddCorridors = constants.settings().ADD_CORRIDORS;
			self.setEnableAddCorridors = function(value) { _enableAddCorridors = value; };
			//self.hasEnableAddCorridors = function() { return _enableAddCorridors; };
			self.hasEnableAddCorridors = function() { return true; };

			var _linkStyle = constants.linkStyle().SINGLE_ARROW;
			self.setLinkStyle = function(linkStyle) {
				if (linkStyle === constants.linkStyle().SINGLE_ARROW ||
					linkStyle === constants.linkStyle().DOUBLE_ARROW) {
					_linkStyle = linkStyle;
				}
			};
			self.getLinkStyle = function() { return _linkStyle; };

			var _linkLabelOnHlt = true;
			self.showLinkLabelOnHlt = function(bValue) { _linkLabelOnHlt = bValue; };
			self.isLinkLabelOnHlt = function() { return _linkLabelOnHlt; };

			var _isLayout;
			self.setLayoutOn = function(bValue) { _isLayout = bValue; };
			self.isLayoutOn = function() { return _isLayout; };

			///////////////
			// ICONS
			///////////////

			// process nodes and derived
			var _flowIconKey = iconOptionsPicker.emojiBlue();
			self.getFlowDefIconKey = function() { return iconOptionsPicker.emojiBlue(); };
			self.getFlowIconKey = function() { return _flowIconKey; };
			self.setFlowIconKey = function(key) { _flowIconKey = key; };
			self.resetFlowIconKey = function() { _flowIconKey = iconOptionsPicker.emojiBlue(); };
			self.hasFlowIconKeyChanged = function() { return _flowIconKey.localeCompare(iconOptionsPicker.emojiBlue()) != 0; };

			// start/end nodes
			var _flagIconKey = iconOptionsPicker.flagBlue();
			self.getFlagDefIconKey = function() { return iconOptionsPicker.flagBlue(); };
			self.getFlagIconKey = function() { return _flagIconKey; };
			self.setFlagIconKey = function(key) { _flagIconKey = key; };
			self.resetFlagIconKey = function() { _flagIconKey = iconOptionsPicker.flagBlue(); };
			self.hasFlagIconKeyChanged = function() { return _flagIconKey.localeCompare(iconOptionsPicker.flagBlue()) != 0; };

			// decision/switch
			var _quizIconKey = iconOptionsPicker.quizBlue();
			self.getQuizDefIconKey = function() { return iconOptionsPicker.quizBlue(); };
			self.getQuizIconKey = function() { return _quizIconKey; };
			self.setQuizIconKey = function(key) { _quizIconKey = key; };
			self.resetQuizIconKey = function() { _quizIconKey = iconOptionsPicker.quizBlue(); };
			self.hasQuizIconKeyChanged = function() { return _quizIconKey.localeCompare(iconOptionsPicker.quizBlue()) != 0; };

			///////////////
			// DIMENSIONS
			///////////////

			var _gFlowWidth = constants.nodeSize().WIDTH;
			self.getGlobalFlowDefWidth = function() { return constants.nodeSize().WIDTH; };
			self.getGlobalFlowWidth = function() { return _gFlowWidth; };
			self.setGlobalFlowWidth = function(w) { _gFlowWidth = w; };
			self.resetGlobalFlowWidth = function() { _gFlowWidth = constants.nodeSize().WIDTH; };
			self.hasGlobalFlowWidth = function() { return _gFlowWidth !== constants.nodeSize().WIDTH; };

			var _gFlowHeight = constants.nodeSize().HEIGHT;
			self.getGlobalFlowDefHeight = function() { return constants.nodeSize().HEIGHT; };
			self.getGlobalFlowHeight = function() { return _gFlowHeight; };
			self.setGlobalFlowHeight = function(h) { _gFlowHeight = h; };
			self.resetGlobalFlowHeight = function() { _gFlowHeight = constants.nodeSize().HEIGHT; };
			self.hasGlobalFlowHeight = function() { return _gFlowHeight !== constants.nodeSize().HEIGHT; };

			//// START/END
			var _gSEWidth = constants.startEndSize().WIDTH;
			self.getGlobalSEDefWidth = function() { return constants.startEndSize().WIDTH; };
			self.getGlobalSEWidth = function() { return _gSEWidth; };
			self.setGlobalSEWidth = function(w) { _gSEWidth = w; };
			self.resetGlobalSEWidth = function() { _gSEWidth = constants.startEndSize().WIDTH; };
			self.hasGlobalSEWidth = function() { return _gSEWidth !== constants.startEndSize().WIDTH; };

			var _gSEHeight = constants.startEndSize().HEIGHT;
			self.getGlobalSEDefHeight = function() { return constants.startEndSize().HEIGHT; };
			self.getGlobalSEHeight = function() { return _gSEHeight; };
			self.setGlobalSEHeight = function(h) { _gSEHeight = h; };
			self.resetGlobalSEHeight = function() { _gSEHeight = constants.startEndSize().HEIGHT; };
			self.hasGlobalSEHeight = function() { return _gSEHeight !== constants.startEndSize().HEIGHT; };

			//// DECISION
			var _gDecisionWidth = constants.decisionSize().WIDTH;
			self.getGlobalDecisionDefWidth = function() { return constants.decisionSize().WIDTH; };
			self.getGlobalDecisionWidth = function() { return _gDecisionWidth; };
			self.setGlobalDecisionWidth = function(w) { _gDecisionWidth = w; };
			self.resetGlobalDecisionWidth = function() { _gDecisionWidth = constants.decisionSize().WIDTH; };
			self.hasGlobalDecisionWidth = function() { return _gDecisionWidth !== constants.decisionSize().WIDTH; };

			var _gDecisionHeight = constants.decisionSize().HEIGHT;
			self.getGlobalDecisionDefHeight = function() { return constants.decisionSize().HEIGHT; };
			self.getGlobalDecisionHeight = function() { return _gDecisionHeight; };
			self.setGlobalDecisionHeight = function(h) { _gDecisionHeight = h; };
			self.resetGlobalDecisionHeight = function() { _gDecisionHeight = constants.decisionSize().HEIGHT; };
			self.hasGlobalDecisionHeight = function() { return _gDecisionHeight !== constants.decisionSize().HEIGHT; };

			//// SWITCH
			var _gSwitchWidth = constants.switchSize().WIDTH;
			self.getGlobalSwitchWidth = function() { return _gSwitchWidth; };

			var _gSwitchHeight = constants.switchSize().HEIGHT;
			self.getGlobalSwitchHeight = function() { return _gSwitchHeight; };

			//// ENDPOINT
			var _gTerminatorWidth = constants.endpointSize().WIDTH;
			self.getGlobalTerminatorWidth = function() { return _gTerminatorWidth; };

			var _gTerminatorHeight = constants.endpointSize().HEIGHT;
			self.getGlobalTerminatorHeight = function() { return _gTerminatorHeight; };

			//// ALL WIDTH
			self.getGlobalNodeWidth = function(flowType) {
				if (flowType === constants.flowType().START || flowType === constants.flowType().END) {
					return _gSEWidth;
				} else if (flowType === constants.flowType().DECISION) {
					return _gDecisionWidth;
				} else if (flowType === constants.flowType().ENDPOINT) {
					return _gTerminatorWidth;
				} else {
					return _gFlowWidth;
				}
			};
			self.getGlobalDefaultWidth = function(flowType) {
				if (flowType === constants.flowType().START || flowType === constants.flowType().END) {
					return constants.startEndSize().WIDTH;
				} else if (flowType === constants.flowType().DECISION) {
					return constants.decisionSize().WIDTH;
				} else if (flowType === constants.flowType().ENDPOINT) {
					return constants.endpointSize().WIDTH;
				} else {
					return constants.nodeSize().WIDTH;
				}
			};
			self.resetGlobalNodeWidth = function() {
				_gSEWidth = constants.startEndSize().WIDTH;
				_gDecisionWidth = constants.decisionSize().WIDTH;
				_gTerminatorWidth = constants.endpointSize().WIDTH;
				_gFlowWidth = constants.nodeSize().WIDTH;
			};

			//// ALL HEIGHT
			self.getGlobalNodeHeight = function(flowType) {
				if (flowType === constants.flowType().START || flowType === constants.flowType().END) {
					return _gSEHeight;
				} else if (flowType === constants.flowType().DECISION) {
					return _gDecisionHeight;
				} else if (flowType === constants.flowType().ENDPOINT) {
					return _gTerminatorHeight;
				} else {
					return _gFlowHeight;
				}
			};
			self.getGlobalDefaultHeight = function(flowType) {
				if (flowType === constants.flowType().START || flowType === constants.flowType().END) {
					return constants.startEndSize().HEIGHT;
				} else if (flowType === constants.flowType().DECISION) {
					return constants.decisionSize().HEIGHT;
				} else if (flowType === constants.flowType().ENDPOINT) {
					return constants.endpointSize().HEIGHT;
				} else {
					return constants.nodeSize().HEIGHT;
				}
			};
			self.resetGlobalNodeHeight = function() {
				_gSEHeight = constants.startEndSize().HEIGHT;
				_gDecisionHeight = constants.decisionSize().HEIGHT;
				_gTerminatorHeight = constants.endpointSize().HEIGHT;
				_gFlowHeight = constants.nodeSize().HEIGHT;
			};

			///////////////
			//  COLORS
			///////////////

			// node resizing colors
			var _selFrameColor = constants.colors().NODE_SEL_D;
			self.getSelectFrameColor = function() { return _selFrameColor; };
			// not used
			self.setSelectFrameColor = function(color) { _selFrameColor = color; };
			self.resetSelectFrameColor = function() { _selFrameColor = constants.colors().NODE_SEL_D; };

			//// CONTAINER
			var _blockFgnColor = constants.colors().BLOCK_OUTLINE;
			self.getBlockOutlineColor = function() { return _blockFgnColor; };

			var _blockColor = constants.colors().GROUP_BGNCOLOR;
			self.getBlockDefColor = function() { return constants.colors().GROUP_BGNCOLOR; };
			self.getBlockColor = function() { return _blockColor; };
			self.setBlockColor = function(color) { _blockColor = color; };
			self.resetBlockColor = function() { _blockColor = constants.colors().GROUP_BGNCOLOR; };
			self.hasBlockColorChanged = function() { return _blockColor.localeCompare(constants.colors().GROUP_BGNCOLOR) != 0; };

			//// PROCESS
			var _procBgnColor = constants.colors().NODE_BGNCOLOR;
			self.getProcBgnDefColor = function() { return constants.colors().NODE_BGNCOLOR; };
			self.getProcBgnColor = function() { return _procBgnColor; };
			self.setProcBgnColor = function(color) { _procBgnColor = color; };
			self.resetProcBgnColor = function() { _procBgnColor = constants.colors().NODE_BGNCOLOR; };
			self.hasProcBgnColorChanged = function() { return _procBgnColor.localeCompare(constants.colors().NODE_BGNCOLOR) != 0; };

			var _procFgnColor = constants.colors().NODE_FORCOLOR_DRK;
			self.getProcFgnDefColor = function() { return constants.colors().NODE_FORCOLOR_DRK; };
			self.getProcFgnColor = function() { return _procFgnColor; };
			self.setProcFgnColor = function(color) { _procFgnColor = color; };
			self.resetProcFgnColor = function() { _procFgnColor = constants.colors().NODE_FORCOLOR_DRK; };
			self.hasProcFgnColorChanged = function() { return _procFgnColor.localeCompare(constants.colors().NODE_FORCOLOR_DRK) != 0; };

			//// DECISION
			var _decBgnColor = constants.colors().NODE_BR_BGNCOLOR;
			self.getDecBgnDefColor = function() { return constants.colors().NODE_BR_BGNCOLOR; };
			self.getDecBgnColor = function() { return _decBgnColor; };
			self.setDecBgnColor = function(color) { _decBgnColor = color; };
			self.resetDecBgnColor = function() { _decBgnColor = constants.colors().NODE_BR_BGNCOLOR; };
			self.hasDecBgnColorChanged = function() { return _decBgnColor.localeCompare(constants.colors().NODE_BR_BGNCOLOR) != 0; };

			var _decFgnColor = constants.colors().NODE_FORCOLOR_DRK;
			self.getDecFgnDefColor = function() { return constants.colors().NODE_FORCOLOR_DRK; };
			self.getDecFgnColor = function() { return _decFgnColor; };
			self.setDecFgnColor = function(color) { _decFgnColor = color; };
			self.resetDecFgnColor = function() { _decFgnColor = constants.colors().NODE_FORCOLOR_DRK; };
			self.hasDecFgnColorChanged = function() { return _decFgnColor.localeCompare(constants.colors().NODE_FORCOLOR_DRK) != 0; };

			//// ENDPOINT
			var _termBgnColor = constants.colors().NODE_TM_BGNCOLOR;
			self.getTermBgnDefColor = function() { return constants.colors().NODE_TM_BGNCOLOR; };
			self.getTermBgnColor = function() { return _termBgnColor; };
			self.setTermBgnColor = function(color) { _termBgnColor = color; };
			self.resetTermBgnColor = function() { _termBgnColor = constants.colors().NODE_TM_BGNCOLOR; };
			self.hasTermBgnColorChanged = function() { return _termBgnColor.localeCompare(constants.colors().NODE_TM_BGNCOLOR) != 0; };

			var _termFgnColor = constants.colors().NODE_FORCOLOR_DRK;
			self.getTermFgnDefColor = function() { return constants.colors().NODE_FORCOLOR_DRK; };
			self.getTermFgnColor = function() { return _termFgnColor; };
			self.setTermFgnColor = function(color) { _termFgnColor = color; };
			self.resetTermFgnColor = function() { _termFgnColor = constants.colors().NODE_FORCOLOR_DRK; };
			self.hasTermFgnColorChanged = function() { return _termFgnColor.localeCompare(constants.colors().NODE_FORCOLOR_DRK) != 0; };

			//// IO
			var _ioBgnColor = constants.colors().NODE_IO_BGNCOLOR;
			self.getIOBgnDefColor = function() { return constants.colors().NODE_IO_BGNCOLOR; };
			self.getIOBgnColor = function() { return _ioBgnColor; };
			self.setIOBgnColor = function(color) { _ioBgnColor = color; };
			self.resetIOBgnColor = function() { _ioBgnColor = constants.colors().NODE_IO_BGNCOLOR; };
			self.hasIOBgnColorChanged = function() { return _ioBgnColor.localeCompare(constants.colors().NODE_IO_BGNCOLOR) != 0; };

			var _ioFgnColor = constants.colors().NODE_FORCOLOR_DRK;
			self.getIOFgnDefColor = function() { return constants.colors().NODE_FORCOLOR_DRK; };
			self.getIOFgnColor = function() { return _ioFgnColor; };
			self.setIOFgnColor = function(color) { _ioFgnColor = color; };
			self.resetIOFgnColor = function() { _ioFgnColor = constants.colors().NODE_FORCOLOR_DRK; };
			self.hasIOFgnColorChanged = function() { return _ioFgnColor.localeCompare(constants.colors().NODE_FORCOLOR_DRK) != 0; };

			//// START/END
			var _seBgnColor = constants.colors().NODE_SE_BGNCOLOR;
			self.getSEBgnDefColor = function() { return constants.colors().NODE_SE_BGNCOLOR; };
			self.getSEBgnColor = function() { return _seBgnColor; };
			self.setSEBgnColor = function(color) { _seBgnColor = color; };
			self.resetSEBgnColor = function() { _seBgnColor = constants.colors().NODE_SE_BGNCOLOR; };
			self.hasSEBgnColorChanged = function() { return _seBgnColor.localeCompare(constants.colors().NODE_SE_BGNCOLOR) != 0; };

			var _seFgnColor = constants.colors().NODE_FORCOLOR_DRK;
			self.getSEFgnDefColor = function() { return constants.colors().NODE_FORCOLOR_DRK; };
			self.getSEFgnColor = function() { return _seFgnColor; };
			self.setSEFgnColor = function(color) { _seFgnColor = color; };
			self.resetSEFgnColor = function() { _seFgnColor = constants.colors().NODE_FORCOLOR_DRK; };
			self.hasSEFgnColorChanged = function() { return _seFgnColor.localeCompare(constants.colors().NODE_FORCOLOR_DRK) != 0; };

			//// SIDE
			var _sideBgnColor = constants.colors().NODE_SQ_BGNCOLOR;
			self.getSideBgnDefColor = function() { return constants.colors().NODE_SQ_BGNCOLOR; };
			self.getSideBgnColor = function() { return _sideBgnColor; };
			self.setSideBgnColor = function(color) { _sideBgnColor = color; };
			self.resetSideBgnColor = function() { _sideBgnColor = constants.colors().NODE_SQ_BGNCOLOR; };
			self.hasSideBgnColorChanged = function() { return _sideBgnColor.localeCompare(constants.colors().NODE_SQ_BGNCOLOR) != 0; };

			var _sideFgnColor = constants.colors().NODE_FORCOLOR_DRK;
			self.getSideFgnDefColor = function() { return constants.colors().NODE_FORCOLOR_DRK; };
			self.getSideFgnColor = function() { return _sideFgnColor; };
			self.setSideFgnColor = function(color) { _sideFgnColor = color; };
			self.resetSideFgnColor = function() { _sideFgnColor = constants.colors().NODE_FORCOLOR_DRK; };
			self.hasSideFgnColorChanged = function() { return _sideFgnColor.localeCompare(constants.colors().NODE_FORCOLOR_DRK) != 0; };

			//// TEXT
			var _textBgnColor = constants.colors().NODE_TXT_BGNCOLOR;
			self.getTextBgnDefColor = function() { return constants.colors().NODE_TXT_BGNCOLOR; };
			self.getTextBgnColor = function() { return _textBgnColor; };
			self.setTextBgnColor = function(color) { _textBgnColor = color; };
			self.resetTextBgnColor = function() { _textBgnColor = constants.colors().NODE_TXT_BGNCOLOR; };
			self.hasTextBgnColorChanged = function() { return _textBgnColor.localeCompare(constants.colors().NODE_TXT_BGNCOLOR) != 0; };

			var _textFgnColor = constants.colors().NODE_FORCOLOR_DRK;
			self.getTextFgnDefColor = function() { return constants.colors().NODE_FORCOLOR_DRK; };
			self.getTextFgnColor = function() { return _textFgnColor; };
			self.setTextFgnColor = function(color) { _textFgnColor = color; };
			self.resetTextFgnColor = function() { _textFgnColor = constants.colors().NODE_FORCOLOR_DRK; };
			self.hasTextFgnColorChanged = function() { return _textFgnColor.localeCompare(constants.colors().NODE_FORCOLOR_DRK) != 0; };

		}
		return new Config();
	}
);