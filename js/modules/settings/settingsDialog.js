define(['jquery','jqueryui',
		'modules/settings/config',
		'modules/gallery/iconOptionsPicker',
		'modules/graph/graphConstants'],
	function($, $$,
			 config,
			 iconPicker,
			 constants) {

		function SettingsDialog() {
			var self = this,
				WIDTH = 460,
				HEIGHT = 524;

			var _manager,
				_startEndLevels,
				_sideSwimLanes,
				_newStartEndLevels,
				_newSideSwimLanes,
				_editMode,
				_layoutMode,
				_canvasLevels,
				_canvasLanes,
				//_isHorizontal,
				_directionBefore,
				_isGenerate,
				_isHideNames,
				_isShowIcons,
				_isShowLinkLabels,
				_linkStyle,
				_showRefs,

				_spinnerNodeWidthSelector = $("#spinnerNodeWidthId"),
				_spinnerNodeHeightSelector = $("#spinnerNodeHeightId"),
				_spinnerSEWidthSelector = $("#spinnerSEWidthId"),
				_spinnerSEHeightSelector = $("#spinnerSEHeightId"),
				_spinnerDecisionWidthSelector = $("#spinnerDecisionWidthId"),
				_spinnerDecisionHeightSelector = $("#spinnerDecisionHeightId"),

				_nodeWidth,
				_nodeHeight,
				_seWidth,
				_seHeight,
				_decisionWidth,
				_decisionHeight,

				_currentType,

				_borderOffColor = "#bbb",
				_borderSelColor = "#00f",

				_oldProcBgnColor,
				_oldProcFgnColor,
				_oldDecBgnColor,
				_oldDecFgnColor,
				_oldIOBgnColor,
				_oldIOFgnColor,
				_oldSEBgnColor,
				_oldSEFgnColor,
				_oldSideBgnColor,
				_oldSideFgnColor,
				_oldTermBgnColor,
				_oldTermFgnColor,

				_currProcBgnColor,
				_currProcFgnColor,
				_currDecBgnColor,
				_currDecFgnColor,
				_currIOBgnColor,
				_currIOFgnColor,
				_currSEBgnColor,
				_currSEFgnColor,
				_currSideBgnColor,
				_currSideFgnColor,
				_currTermBgnColor,
				_currTermFgnColor,

				_doResetAllColors,
				_doRollbackColors,

				_btnProcTypeSltr = $("#btnProcTypeId"),
				_btnDecTypeSltr = $("#btnDecTypeId"),
				_btnIOTypeSltr = $("#btnIOTypeId"),
				_btnSETypeSltr = $("#btnSETypeId"),
				_btnSideTypeSltr = $("#btnSideTypeId"),
				_btnTermTypeSltr = $("#btnTermTypeId"),

				_btnBgnColorSltr = $("#btnBgnColorId"),
				_btnFgnColorSltr = $("#btnFgnColorId"),
				_btnColorDefSltr = $("#btnColorDefId"),

				_btnRollbackColorsSltr = $("#rollbackColorsId"),

				_procBgnDisplaySltr = $("#procBgnDisplayId"),
				_procFgnDisplaySltr = $("#procFgnDisplayId"),
				_decBgnDisplaySltr = $("#decBgnDisplayId"),
				_decFgnDisplaySltr = $("#decFgnDisplayId"),
				_ioBgnDisplaySltr = $("#ioBgnDisplayId"),
				_ioFgnDisplaySltr = $("#ioFgnDisplayId"),
				_seBgnDisplaySltr = $("#seBgnDisplayId"),
				_seFgnDisplaySltr = $("#seFgnDisplayId"),
				_sideBgnDisplaySltr = $("#sideBgnDisplayId"),
				_sideFgnDisplaySltr = $("#sideFgnDisplayId"),
				_termBgnDisplaySltr = $("#termBgnDisplayId"),
				_termFgnDisplaySltr = $("#termFgnDisplayId"),
				_bgnColorDisplaySltr = $("#bgnColorDisplayId"),
				_fgnColorDisplaySltr = $("#fgnColorDisplayId"),

				_chkProcUpdSltr = $("#chkProcUpdId"),
				_chkDecUpdSltr = $("#chkDecUpdId"),
				_chkIOUpdSltr = $("#chkIOUpdId"),
				_chkSEUpdSltr = $("#chkSEUpdId"),
				_chkSideUpdSltr = $("#chkSideUpdId"),
				_chkTermUpdSltr = $("#chkTermUpdId"),

			////
				_currentCategory,
				_oldFlowCtgKey,
				_oldFlagCtgKey,
				_oldQuizCtgKey,
				_currFlowCtgKey,
				_currFlagCtgKey,
				_currQuizCtgKey,

				_btnFlowCtgSltr = $("#btnFlowCtgId"),
				_btnFlagCtgSltr = $("#btnFlagCtgId"),
				_btnQuizCtgSltr = $("#btnQuizCtgId"),

				_imgFlowSltr = $("#flowIconDisplayId"),
				_imgFlagSltr = $("#flagIconDisplayId"),
				_imgQuizSltr = $("#quizIconDisplayId"),

				_chkFlowUpdSltr = $("#chkFlowUpdId"),
				_chkFlagUpdSltr = $("#chkFlagUpdId"),
				_chkQuizUpdSltr = $("#chkQuizUpdId"),

				_doResetAllIcons,
				_iconMenuSelector = $('#settingIconItemsId'),
				_btnResetIconsSltr = $('#allIconsToDefId');

			///////
			$("#chkStartEnd").prop('checked', config.hasStartEndLevels());
			$("#chkLeftRight").prop('checked', config.hasSideSwimLanes());
			$("#chkGrid").prop('checked', config.hasShowGrid());
			$("#chkAutoGen").prop('checked', config.hasAutoGenNodeNames());
			$("#chkHideNamesId").prop('checked', config.hasHideNodeNames());
			$("#chkShowIconsId").prop('checked', config.hasShowNodeIcons());
			$("#chkShowRefs").prop('checked', config.hasShowRefHandles());
			$("#chkShowLinkLabelsId").prop('checked', config.hasShowLinkLabels());

			if (config.getLinkStyle() === constants.linkStyle().SINGLE_ARROW) {
				$("#styleSingleId").prop('checked', true);
			} else if (config.getLinkStyle() === constants.linkStyle().DOUBLE_ARROW) {
				$("#styleDoubleId").prop('checked', true);
			}

			//// GENERAL ///
			$('input[id="btnEditAllId"]').on('change', function(event) {
				checkEnableOK($("#btnEditAllId").prop('checked'));
			});
			$('input[id="btnViewOnlyId"]').on('change', function(event) {
				checkEnableOK();
			});
			$('input[id="btnVertical"]').on('change', function(event) {
				checkEnableOK();
			});
			$('input[id="btnHorizontal"]').on('change', function(event) {
				checkEnableOK();
			});
			$('input[id="chkStartEnd"]').on('change', function(event) {
				checkEnableOK();
			});
			$('input[id="chkLeftRight"]').on('change', function(event) {
				checkEnableOK();
			});
			$('input[id="chkGrid"]').on('change', function(event) {
				checkEnableOK();
			});
			$('input[id="chkAutoGen"]').on('change', function(event) {
				checkEnableOK();
			});
			$('input[id="chkHideNamesId"]').on('change', function(event) {
				checkEnableOK();
			});
			$('input[id="chkShowIconsId"]').on('change', function(event) {
				checkEnableOK();
			});
			$('input[id="chkShowRefs"]').on('change', function(event) {
				checkEnableOK();
			});
			$('input[id="chkShowLinkLabelsId"]').on('change', function(event) {
				checkEnableOK();
			});
			$('input[id="styleSingleId"]').on('change', function(event) {
				checkEnableOK();
			});
			$('input[id="styleDoubleId"]').on('change', function(event) {
				checkEnableOK();
			});

			$("#spinnerLevelsId").spinner({stop: function(event, ui) {
				checkEnableOK();
			}});
			$("#spinnerLanesId").spinner({stop: function(event, ui) {
				checkEnableOK();
			}});

			//////
			_spinnerNodeWidthSelector.spinner({stop: function(event, ui) {
				$("#dmsFlowDefId").prop('disabled', false);
				checkEnableOK();
			}});
			_spinnerNodeHeightSelector.spinner({stop: function(event, ui) {
				$("#dmsFlowDefId").prop('disabled', false);
				checkEnableOK();
			}});
			_spinnerSEWidthSelector.spinner({stop: function(event, ui) {
				$("#dmsSEDefId").prop('disabled', false);
				checkEnableOK();
			}});
			_spinnerSEHeightSelector.spinner({stop: function(event, ui) {
				$("#dmsSEDefId").prop('disabled', false);
				checkEnableOK();
			}});
			_spinnerDecisionWidthSelector.spinner({stop: function(event, ui) {
				$("#dmsDecisionDefId").prop('disabled', false);
				checkEnableOK();
			}});
			_spinnerDecisionHeightSelector.spinner({stop: function(event, ui) {
				$("#dmsDecisionDefId").prop('disabled', false);
				checkEnableOK();
			}});

			$("#dmsFlowDefId").click(function() {
				config.resetGlobalFlowWidth();
				config.resetGlobalFlowHeight();
				_spinnerNodeWidthSelector.spinner("value", config.getGlobalFlowWidth());
				_spinnerNodeHeightSelector.spinner("value", config.getGlobalFlowHeight());
				checkEnableOK();
			});

			$("#dmsSEDefId").click(function() {
				config.resetGlobalSEWidth();
				config.resetGlobalSEHeight();
				_spinnerSEWidthSelector.spinner("value", config.getGlobalSEWidth());
				_spinnerSEHeightSelector.spinner("value", config.getGlobalSEHeight());
				checkEnableOK();
			});

			$("#dmsDecisionDefId").click(function() {
				config.resetGlobalDecisionWidth();
				config.resetGlobalDecisionHeight();
				_spinnerDecisionWidthSelector.spinner("value", config.getGlobalDecisionWidth());
				_spinnerDecisionHeightSelector.spinner("value", config.getGlobalDecisionHeight());
				checkEnableOK();
			});

			$("#allDmsToDefId").click(function() {
				config.resetGlobalNodeWidth();
				config.resetGlobalNodeHeight();
				_spinnerNodeWidthSelector.spinner("value", config.getGlobalFlowWidth());
				_spinnerNodeHeightSelector.spinner("value", config.getGlobalFlowHeight());
				_spinnerSEWidthSelector.spinner("value", config.getGlobalSEWidth());
				_spinnerSEHeightSelector.spinner("value", config.getGlobalSEHeight());
				_spinnerDecisionWidthSelector.spinner("value", config.getGlobalDecisionWidth());
				_spinnerDecisionHeightSelector.spinner("value", config.getGlobalDecisionHeight());
				checkEnableOK();
			});

			///////
			var _typeColorPickSelector = $("#typeColorPickId");
			_typeColorPickSelector.spectrum({
				color: "#fff",
				clickoutFiresChange: false,
				preferredFormat: "hex",
				showInput: true,
				showInitial: true,
				appendTo: "#settingsDialogId",
				disabled: !config.isEditMode(),
				change: function(color) {
					//////////////
					// ON CHOOSE
					//////////////
					var isBkgn = _btnBgnColorSltr.prop('checked');
					if (isBkgn) {
						setBgnColor4Type(_currentType, color.toHexString());
						setTypesDisplayColors(_currentType, true, color.toHexString(), getFgnColor4Type(_currentType, true));
						setDisplayColors(_currentType, isBkgn, color.toHexString(), getFgnColor4Type(_currentType, true));
					} else {
						setFgnColor4Type(_currentType, color.toHexString());
						setTypesDisplayColors(_currentType, true, getBgnColor4Type(_currentType, true), color.toHexString());
						setDisplayColors(_currentType, isBkgn, getBgnColor4Type(_currentType, true), color.toHexString());
					}
					_btnRollbackColorsSltr.prop('disabled', false);
					_doResetAllColors = false;
					enableColorUpdates();
					checkEnableOK();
				}
			});
			_btnColorDefSltr.click(function() {
				setTypesDisplayColors(_currentType, true);
				setDisplayColors(_currentType, true);
				_typeColorPickSelector.spectrum(
					"set", getBgnColor4Type(_currentType, false)
				);
				checkEnableOK();
			});

			function enableColorUpdates(type) {
				if (type === constants.flowType().PROCESS) {
					_chkProcUpdSltr.prop('checked', true);
				} else if (type === constants.flowType().DECISION || type === constants.flowType().SWITCH) {
					_chkDecUpdSltr.prop('checked', true);
				} else if (type === constants.flowType().IN_OUT) {
					_chkIOUpdSltr.prop('checked', true);
				} else if (type === constants.flowType().START || type === constants.flowType().END) {
					_chkSEUpdSltr.prop('checked', true);
				} else if (type === constants.flowType().LEFT_TOP || type === constants.flowType().RIGHT_BOTTOM) {
					_chkSideUpdSltr.prop('checked', true);
				} else if (type === constants.flowType().ENDPOINT) {
					_chkTermUpdSltr.prop('checked', true);
				}
			}
			////////////

			_typeColorPickSelector.on("show.spectrum", function() {
				$("#settingsDialogId").scrollTop(1000);
				var isBkgn = _btnBgnColorSltr.prop('checked'),
					color = isBkgn ?
						getBgnColor4Type(_currentType, true) : getFgnColor4Type(_currentType, true);
				_typeColorPickSelector.spectrum(
					////////////
					// ON SHOW (it should already been set)
					////////////
					"set", color
				);
			});

			//// TYPE listeners
			$('input[id="btnProcTypeId"]').on('change', function(event) {
				updateCheckColorSelection(constants.flowType().PROCESS, _currProcBgnColor, _currProcFgnColor);
				//_currentType = constants.flowType().PROCESS;
				//updateTypesDisplayColors(_currentType, true);
				//_typeColorPickSelector.spectrum(
				//	"set", _currProcBgnColor
				//);
				//setDisplayColors(_currentType, true, _currProcBgnColor, _currProcFgnColor);
				//_btnBgnColorSltr.prop('checked', true);
			});
			$('input[id="btnDecTypeId"]').on('input', function(event) {
				updateCheckColorSelection(constants.flowType().DECISION, _currDecBgnColor, _currDecFgnColor);
			});
			$('input[id="btnIOTypeId"]').on('change', function(event) {
				updateCheckColorSelection(constants.flowType().IN_OUT, _currIOBgnColor, _currIOFgnColor);
			});
			$('input[id="btnSETypeId"]').on('change', function(event) {
				updateCheckColorSelection(constants.flowType().START, _currSEBgnColor, _currSEFgnColor);
			});
			$('input[id="btnSideTypeId"]').on('change', function(event) {
				updateCheckColorSelection(constants.flowType().LEFT_TOP, _currSideBgnColor, _currSideFgnColor);
			});
			$('input[id="btnTermTypeId"]').on('change', function(event) {
				updateCheckColorSelection(constants.flowType().ENDPOINT, _currTermBgnColor, _currTermFgnColor);
			});

			//// COLOR listeners
			$('input[id="btnBgnColorId"]').on('change', function(event) {
				var bgnColor = getBgnColor4Type(_currentType, true),
					fgnColor = getFgnColor4Type(_currentType, true);
				setDisplayColors(_currentType, true, bgnColor, fgnColor);
				_typeColorPickSelector.spectrum(
					"set", bgnColor
				);
			});
			$('input[id="btnFgnColorId"]').on('change', function(event) {
				var bgnColor = getBgnColor4Type(_currentType, true),
					fgnColor = getFgnColor4Type(_currentType, true);
				setDisplayColors(_currentType, false, bgnColor, fgnColor);
				_typeColorPickSelector.spectrum(
					"set", fgnColor
				);
			});

			////
			function updateCheckColorSelection(type, currBgnColor, currFgnColor) {
				_currentType = type;
				updateTypesDisplayColors(_currentType, true);
				_typeColorPickSelector.spectrum(
					"set", currBgnColor
				);
				setDisplayColors(_currentType, true, currBgnColor, currFgnColor);
				_btnBgnColorSltr.prop('checked', true);
			}

			////
			$('input[id="chkProcUpdId"]').on('change', function(event) {
				if (_chkProcUpdSltr.prop('checked')) {
					_btnProcTypeSltr.prop('checked', true);
					updateCheckColorSelection(constants.flowType().PROCESS, _currProcBgnColor, _currProcFgnColor);
				}
				checkEnableOK();
			});
			$('input[id="chkDecUpdId"]').on('change', function(event) {
				if (_chkDecUpdSltr.prop('checked')) {
					_btnDecTypeSltr.prop('checked', true);
					updateCheckColorSelection(constants.flowType().DECISION, _currDecBgnColor, _currDecFgnColor);
				}
				checkEnableOK();
			});
			$('input[id="chkIOUpdId"]').on('change', function(event) {
				if (_chkIOUpdSltr.prop('checked')) {
					_btnIOTypeSltr.prop('checked', true);
					updateCheckColorSelection(constants.flowType().IN_OUT, _currIOBgnColor, _currIOFgnColor);
				}
				checkEnableOK();
			});
			$('input[id="chkSEUpdId"]').on('change', function(event) {
				if (_chkSEUpdSltr.prop('checked')) {
					_btnSETypeSltr.prop('checked', true);
					updateCheckColorSelection(constants.flowType().START, _currSEBgnColor, _currSEFgnColor);
				}
				checkEnableOK();
			});
			$('input[id="chkSideUpdId"]').on('change', function(event) {
				if (_chkSideUpdSltr.prop('checked')) {
					_btnSideTypeSltr.prop('checked', true);
					updateCheckColorSelection(constants.flowType().LEFT_TOP, _currSideBgnColor, _currSideFgnColor);
				}
				checkEnableOK();
			});
			$('input[id="chkTermUpdId"]').on('change', function(event) {
				if (_chkTermUpdSltr.prop('checked')) {
					_btnTermTypeSltr.prop('checked', true);
					updateCheckColorSelection(constants.flowType().ENDPOINT, _currTermBgnColor, _currTermFgnColor);
				}
				checkEnableOK();
			});

			_btnRollbackColorsSltr.click(function() {
				_btnProcTypeSltr.prop('checked', true);
				_currentType = constants.flowType().PROCESS;
				updateTypesDisplayColors(constants.flowType().PROCESS, false);

				_btnBgnColorSltr.prop('checked', true);
				setDisplayColors(_currentType, true);
				_typeColorPickSelector.spectrum(
					"set", getBgnColor4Type(_currentType, false)
				);
				_doRollbackColors = true;
				checkEnableOK();
			});

			$("#resetAllColorsId").click(function() {
				_btnProcTypeSltr.prop('checked', true);
				_currentType = constants.flowType().PROCESS;
				//resetAllColorsToDefs();

				_btnBgnColorSltr.prop('checked', true);
				resetTypesDisplayColors();
				setDisplayColors(_currentType, true);
				_typeColorPickSelector.spectrum(
					"set", getBgnColor4Type(_currentType, false)
				);
				_doResetAllColors = true;
				checkEnableOK();
			});

			function resetAllColorsToDefs() {
				if (_manager) {
					var nodes = _manager.getModelHandler().getFlowNodes();
					for (var i = 0; i < nodes.length; i++) {
						nodes[i].resetBgnColor();
						nodes[i].resetFgnColor();
					}
				}
			}

			//// ICON listeners
			$('input[id="btnFlowCtgId"]').on('change', function(event) {
				_currentCategory = constants.nodeCategory().FLOW;
				iconPicker.setNodeCategory(_currentCategory);
				_iconMenuSelector.iconselectmenu("refreshButtonItem", _currFlowCtgKey, _currentCategory);
			});

			$('input[id="btnFlagCtgId"]').on('change', function(event) {
				_currentCategory = constants.nodeCategory().FLAG;
				iconPicker.setNodeCategory(_currentCategory);
				_iconMenuSelector.iconselectmenu("refreshButtonItem", _currFlagCtgKey, _currentCategory);
			});

			$('input[id="btnQuizCtgId"]').on('change', function(event) {
				_currentCategory = constants.nodeCategory().QUIZ;
				iconPicker.setNodeCategory(_currentCategory);
				_iconMenuSelector.iconselectmenu("refreshButtonItem", _currQuizCtgKey, _currentCategory);
			});

			////
			$('input[id="chkFlowUpdId"]').on('change', function(event) {
				if (_chkFlowUpdSltr.prop('checked')) {
					_btnFlowCtgSltr.prop('checked', true);
					_currentCategory = constants.nodeCategory().FLOW;
					iconPicker.setNodeCategory(_currentCategory);
					_iconMenuSelector.iconselectmenu("refreshButtonItem", _currFlowCtgKey, _currentCategory);
				}
				checkEnableOK();
			});
			$('input[id="chkFlagUpdId"]').on('change', function(event) {
				if (_chkFlagUpdSltr.prop('checked')) {
					_btnFlagCtgSltr.prop('checked', true);
					_currentCategory = constants.nodeCategory().FLAG;
					iconPicker.setNodeCategory(_currentCategory);
					_iconMenuSelector.iconselectmenu("refreshButtonItem", _currFlagCtgKey, _currentCategory);
				}
				checkEnableOK();
			});
			$('input[id="chkQuizUpdId"]').on('change', function(event) {
				if (_chkQuizUpdSltr.prop('checked')) {
					_btnQuizCtgSltr.prop('checked', true);
					_currentCategory = constants.nodeCategory().QUIZ;
					iconPicker.setNodeCategory(_currentCategory);
					_iconMenuSelector.iconselectmenu("refreshButtonItem", _currQuizCtgKey, _currentCategory);
				}
				checkEnableOK();
			});

			_btnResetIconsSltr.click(function() {
				//resetAllIconsToDefs();
				_doResetAllIcons = true;
				_currFlowCtgKey = config.getFlowIconKey();
				_currFlagCtgKey = config.getFlagIconKey();
				_currQuizCtgKey = config.getQuizIconKey();

				_imgFlowSltr.attr('src', iconPicker.getIconURL(_currFlowCtgKey));
				_imgFlagSltr.attr('src', iconPicker.getIconURL(_currFlagCtgKey));
				_imgQuizSltr.attr('src', iconPicker.getIconURL(_currQuizCtgKey));

				_currentCategory = constants.nodeCategory().FLOW;
				_btnFlowCtgSltr.prop('checked', true);
				iconPicker.setNodeCategory(_currentCategory);
				_iconMenuSelector.iconselectmenu("refreshButtonItem", _currFlowCtgKey, _currentCategory);

				checkEnableOK();
			});

			function resetAllIconsToDefs() {
				if (_manager) {
					var nodes = _manager.getModelHandler().getFlowNodes();
					for (var i = 0; i < nodes.length; i++) {
						nodes[i].resetNodeIconKey();
					}
				}
			}

			//////
			function resetTypesDisplayColors() {
				_currProcBgnColor = config.getProcBgnDefColor();
				_currProcFgnColor = config.getProcFgnDefColor();
				_currDecBgnColor = config.getDecBgnDefColor();
				_currDecFgnColor = config.getDecFgnDefColor();
				_currIOBgnColor = config.getIOBgnDefColor();
				_currIOFgnColor = config.getIOFgnDefColor();
				_currSEBgnColor = config.getSEBgnDefColor();
				_currSEFgnColor = config.getSEFgnDefColor();
				_currSideBgnColor = config.getSideBgnDefColor();
				_currSideFgnColor = config.getSideFgnDefColor();
				_currTermBgnColor = config.getTermBgnDefColor();
				_currTermFgnColor = config.getTermFgnDefColor();

				updateTypesDisplayColors(constants.flowType().PROCESS, true);
			}

			////
			function updateTypesDisplayColors(type, current) {
				if (type === constants.flowType().PROCESS) {
					setProcessDisplayColors(true, current);
					setDecisionDisplayColors(false, current);
					setInOutDisplayColors(false, current);
					setSEDisplayColors(false, current);
					setSideDisplayColors(false, current);
					setEndPointDisplayColors(false, current);
				}
				else if (type === constants.flowType().DECISION || type === constants.flowType().SWITCH) {
					setProcessDisplayColors(false, current);
					setDecisionDisplayColors(true, current);
					setInOutDisplayColors(false, current);
					setSEDisplayColors(false, current);
					setSideDisplayColors(false, current);
					setEndPointDisplayColors(false, current);
				}
				else if (type === constants.flowType().IN_OUT) {
					setProcessDisplayColors(false, current);
					setDecisionDisplayColors(false, current);
					setInOutDisplayColors(true, current);
					setSEDisplayColors(false, current);
					setSideDisplayColors(false, current);
					setEndPointDisplayColors(false, current);
				}
				else if (type === constants.flowType().START || type === constants.flowType().END) {
					setProcessDisplayColors(false, current);
					setDecisionDisplayColors(false, current);
					setInOutDisplayColors(false, current);
					setSEDisplayColors(true, current);
					setSideDisplayColors(false, current);
					setEndPointDisplayColors(false, current);
				}
				else if (type === constants.flowType().LEFT_TOP || type === constants.flowType().RIGHT_BOTTOM) {
					setProcessDisplayColors(false, current);
					setDecisionDisplayColors(false, current);
					setInOutDisplayColors(false, current);
					setSEDisplayColors(false, current);
					setSideDisplayColors(true, current);
					setEndPointDisplayColors(false, current);
				}
				else if (type === constants.flowType().ENDPOINT) {
					setProcessDisplayColors(false, current);
					setDecisionDisplayColors(false, current);
					setInOutDisplayColors(false, current);
					setSEDisplayColors(false, current);
					setSideDisplayColors(false, current);
					setEndPointDisplayColors(true, current);
				}
			}
			function setProcessDisplayColors(selected, current) {
				_procBgnDisplaySltr.css("background-color", current ? _currProcBgnColor : _oldProcBgnColor);
				_procBgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
				_procFgnDisplaySltr.css("background-color", current ? _currProcFgnColor : _oldProcFgnColor);
				_procFgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
			}
			function setDecisionDisplayColors(selected, current) {
				_decBgnDisplaySltr.css("background-color", current ? _currDecBgnColor : _oldDecBgnColor);
				_decBgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
				_decFgnDisplaySltr.css("background-color", current ? _currDecFgnColor : _oldDecFgnColor);
				_decFgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
			}
			function setInOutDisplayColors(selected, current) {
				_ioBgnDisplaySltr.css("background-color", current ? _currIOBgnColor : _oldIOBgnColor);
				_ioBgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
				_ioFgnDisplaySltr.css("background-color", current ? _currIOFgnColor : _oldIOFgnColor);
				_ioFgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
			}
			function setSEDisplayColors(selected, current) {
				_seBgnDisplaySltr.css("background-color", current ? _currSEBgnColor : _oldSEBgnColor);
				_seBgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
				_seFgnDisplaySltr.css("background-color", current ? _currSEFgnColor : _oldSEFgnColor);
				_seFgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
			}
			function setSideDisplayColors(selected, current) {
				_sideBgnDisplaySltr.css("background-color", current ? _currSideBgnColor : _oldSideBgnColor);
				_sideBgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
				_sideFgnDisplaySltr.css("background-color", current ? _currSideFgnColor : _oldSideFgnColor);
				_sideFgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
			}
			function setEndPointDisplayColors(selected, current) {
				_termBgnDisplaySltr.css("background-color", current ? _currTermBgnColor : _oldTermBgnColor);
				_termBgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
				_termFgnDisplaySltr.css("background-color", current ? _currTermFgnColor : _oldTermFgnColor);
				_termFgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
			}

			////////
			function setTypesDisplayColors(type, selected, newBgnColor, newFgnColor) {
				if (type === constants.flowType().PROCESS) {
					_procBgnDisplaySltr.css("background-color", newBgnColor ? newBgnColor : _oldProcBgnColor);
					_procBgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
					_procFgnDisplaySltr.css("background-color", newFgnColor ? newFgnColor : _oldProcFgnColor);
					_procFgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
				}
				else if (type === constants.flowType().DECISION || type === constants.flowType().SWITCH) {
					_decBgnDisplaySltr.css("background-color", newBgnColor ? newBgnColor : _oldDecBgnColor);
					_decBgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
					_decFgnDisplaySltr.css("background-color", newFgnColor ? newFgnColor : _oldDecFgnColor);
					_decFgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
				}
				else if (type === constants.flowType().IN_OUT) {
					_ioBgnDisplaySltr.css("background-color", newBgnColor ? newBgnColor : _oldIOBgnColor);
					_ioBgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
					_ioFgnDisplaySltr.css("background-color", newFgnColor ? newFgnColor : _oldIOFgnColor);
					_ioFgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
				}
				else if (type === constants.flowType().START || type === constants.flowType().END) {
					_seBgnDisplaySltr.css("background-color", newBgnColor ? newBgnColor : _oldSEBgnColor);
					_seBgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
					_seFgnDisplaySltr.css("background-color", newFgnColor ? newFgnColor : _oldSEFgnColor);
					_seFgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
				}
				else if (type === constants.flowType().LEFT_TOP || type === constants.flowType().RIGHT_BOTTOM) {
					_sideBgnDisplaySltr.css("background-color", newBgnColor ? newBgnColor : _oldSideBgnColor);
					_sideBgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
					_sideFgnDisplaySltr.css("background-color", newFgnColor ? newFgnColor : _oldSideFgnColor);
					_sideFgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
				}
				else if (type === constants.flowType().ENDPOINT) {
					_termBgnDisplaySltr.css("background-color", newBgnColor ? newBgnColor : _oldTermBgnColor);
					_termBgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
					_termFgnDisplaySltr.css("background-color", newFgnColor ? newFgnColor : _oldTermFgnColor);
					_termFgnDisplaySltr.css("border-color", selected ? _borderSelColor : _borderOffColor);
				}
			}

			function setDisplayColors(type, isBkndSelected, newBgnColor, newFgnColor) {
				_bgnColorDisplaySltr.css("border-color", isBkndSelected ? _borderSelColor : _borderOffColor);
				_bgnColorDisplaySltr.css("background-color", newBgnColor ? newBgnColor : getBgnColor4Type(type));
				_fgnColorDisplaySltr.css("border-color", isBkndSelected ? _borderOffColor : _borderSelColor);
				_fgnColorDisplaySltr.css("background-color", newFgnColor ? newFgnColor : getFgnColor4Type(type));
			}
			function setBgnColor4Type(type, color) {
				if (type === constants.flowType().PROCESS) {
					_currProcBgnColor = color;
				} else if (type === constants.flowType().DECISION || type === constants.flowType().SWITCH) {
					 _currDecBgnColor = color;
				} else if (type === constants.flowType().IN_OUT) {
					_currIOBgnColor = color;
				} else if (type === constants.flowType().START || type === constants.flowType().END) {
					_currSEBgnColor = color;
				} else if (type === constants.flowType().LEFT_TOP || type === constants.flowType().RIGHT_BOTTOM) {
					_currSideBgnColor = color;
				} else if (type === constants.flowType().ENDPOINT) {
					_currTermBgnColor = color;
				}
			}
			function getBgnColor4Type(type, current) {
				if (type === constants.flowType().PROCESS) {
					return current ? _currProcBgnColor : _oldProcBgnColor;
				} else if (type === constants.flowType().DECISION || type === constants.flowType().SWITCH) {
					return current ? _currDecBgnColor : _oldDecBgnColor;
				} else if (type === constants.flowType().IN_OUT) {
					return current ? _currIOBgnColor : _oldIOBgnColor;
				} else if (type === constants.flowType().START || type === constants.flowType().END) {
					return current ? _currSEBgnColor : _oldSEBgnColor;
				} else if (type === constants.flowType().LEFT_TOP || type === constants.flowType().RIGHT_BOTTOM) {
					return current ? _currSideBgnColor : _oldSideBgnColor;
				} else if (type === constants.flowType().ENDPOINT) {
					return current ? _currTermBgnColor : _oldTermBgnColor;
				} else return "#fff";
			}

			function setFgnColor4Type(type, color) {
				if (type === constants.flowType().PROCESS) {
					_currProcFgnColor = color;
				} else if (type === constants.flowType().DECISION || type === constants.flowType().SWITCH) {
					_currDecFgnColor = color;
				} else if (type === constants.flowType().IN_OUT) {
					_currIOFgnColor = color;
				} else if (type === constants.flowType().START || type === constants.flowType().END) {
					_currSEFgnColor = color;
				} else if (type === constants.flowType().LEFT_TOP || type === constants.flowType().RIGHT_BOTTOM) {
					_currSideFgnColor = color;
				} else if (type === constants.flowType().ENDPOINT) {
					_currTermFgnColor = color;
				}
			}
			function getFgnColor4Type(type, current) {
				if (type === constants.flowType().PROCESS) {
					return current ? _currProcFgnColor : _oldProcFgnColor;
				} else if (type === constants.flowType().DECISION || type === constants.flowType().SWITCH) {
					return current ? _currDecFgnColor : _oldDecFgnColor;
				} else if (type === constants.flowType().IN_OUT) {
					return current ? _currIOFgnColor : _oldIOFgnColor;
				} else if (type === constants.flowType().START || type === constants.flowType().END) {
					return current ? _currSEFgnColor : _oldSEFgnColor;
				} else if (type === constants.flowType().LEFT_TOP || type === constants.flowType().RIGHT_BOTTOM) {
					return current ? _currSideFgnColor : _oldSideFgnColor;
				} else if (type === constants.flowType().ENDPOINT) {
					return current ? _currTermFgnColor : _oldTermFgnColor;
				} else return "#fff";
			}

			////
			self.initDialog = function(manager) {
				_manager = manager;
				var cfgDialog = $("#settingsDialogId");
				cfgDialog.dialog({
					autoOpen: false,
					closeOnEscape: false,
					width: WIDTH,
					height: HEIGHT,
					show: {effect: "slideDown",  duration: 250},
					hide: {effect: 'slideUp', duration: 250},
					modal: true,
					resizable: false,
					title: "Settings",
					position: {my: "right top+10", at: "right top", of: "#topContainerId"},
					//position: {my: "left top", at: "left bottom+10", of: $("#configId")},
					open: function(event, ui) {
						//$(this).parent().css("top", $("#topContainerId").top+20);
						$(this).dialog('option', 'title', getTitle());
						initControls();
						$("#buttonOK").button("option", "disabled", true);
					},
					buttons: [
						{
							id: "buttonOK",
							text: "OK",
							click: function() {
								$(this).dialog("close");
								updateConfig();
							}
						},
						{
							text: "Cancel",
							autofocus: true,
							click: function() {
								$(this).dialog("close");
								resetControls();
							}
						}
					]
				});
				$(document).on('click', ".ui-widget-overlay", function(){
					cfgDialog.dialog("close");
					resetControls();
				});
			};

			function getTitle() {
				var title = "Settings ",
					scheme = _manager.getSettingScheme();
				if (scheme) {
					title = title + "/ Scheme: "+scheme;
				}
				return title;
			}

			function checkEnableOK(editOn) {
				$("#buttonOK").button((config.isEditMode() || editOn) ? "enable" : "disable");
				$("#buttonOK").button("refresh");
			}


			function resetControls() {
				//// DIMENSIONS ////
				if (_nodeWidth)  _spinnerNodeWidthSelector.spinner("value", _nodeWidth);
				if (_nodeHeight)  _spinnerNodeHeightSelector.spinner("value", _nodeHeight);
				if (_seWidth)  _spinnerSEWidthSelector.spinner("value", _seWidth);
				if (_seHeight)  _spinnerSEHeightSelector.spinner("value", _seHeight);
				if (_decisionWidth)  _spinnerDecisionWidthSelector.spinner("value", _decisionWidth);
				if (_decisionHeight)  _spinnerDecisionHeightSelector.spinner("value", _decisionHeight);

			}

			function initControls() {

				var blockEdit = !config.isEditMode();
				//// GENERAL ////

				_editMode = config.getEditMode();
				_layoutMode = config.getLayoutMode();
				_startEndLevels = config.getStartEndLevels();
				_sideSwimLanes = config.getSideSwimLanes();
				//_isHorizontal = config.getFlowDirection();
				_directionBefore = config.getFlowDirection();
				_canvasLevels = config.getCanvasLevels();
				_canvasLanes = config.getCanvasLanes();
				_isGenerate = config.hasAutoGenNodeNames();
				_isHideNames = config.hasHideNodeNames();
				_isShowIcons = config.hasShowNodeIcons();
				_isShowLinkLabels = config.hasShowLinkLabels();
				_linkStyle = config.getLinkStyle();
				_showRefs = config.hasShowRefHandles();

				if (config.isEditMode()) {
					$("#btnEditAllId").prop('checked', true);
				} else {
					$("#btnViewOnlyId").prop('checked', true);
				}

				$("#btnHorizontal").prop('disabled', blockEdit);
				$("#btnVertical").prop('disabled', blockEdit);

				$("#chkStartEnd").prop('disabled', blockEdit);
				$("#chkLeftRight").prop('disabled', blockEdit);
				$("#chkGrid").prop('disabled', blockEdit);
				$("#chkAutoGen").prop('disabled', blockEdit);
				$("#chkHideNamesId").prop('disabled', blockEdit);
				$("#chkShowIconsId").prop('disabled', blockEdit);
				$("#chkShowRefs").prop('disabled', blockEdit);
				$("#chkShowLinkLabelsId").prop('disabled', blockEdit);

				_spinnerNodeWidthSelector.spinner("option", "disabled", blockEdit);
				_spinnerNodeHeightSelector.spinner("option", "disabled", blockEdit);
				_spinnerSEWidthSelector.spinner("option", "disabled", blockEdit);
				_spinnerSEHeightSelector.spinner("option", "disabled", blockEdit);
				_spinnerDecisionWidthSelector.spinner("option", "disabled", blockEdit);
				_spinnerDecisionHeightSelector.spinner("option", "disabled", blockEdit);

				$("#allDmsToDefId").prop('disabled', blockEdit);

				_btnProcTypeSltr.prop('disabled', blockEdit);
				_btnDecTypeSltr.prop('disabled', blockEdit);
				_btnIOTypeSltr.prop('disabled', blockEdit);
				_btnSETypeSltr.prop('disabled', blockEdit);
				_btnSideTypeSltr.prop('disabled', blockEdit);
				_btnTermTypeSltr.prop('disabled', blockEdit);

				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					$("#btnVertical").prop('checked', true);
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					$("#btnHorizontal").prop('checked', true);
				}

				$("#spinnerLevelsId").spinner("value", _canvasLevels);
				$("#spinnerLanesId").spinner("value", _canvasLanes);

				$("#chkStartEnd").prop('checked', config.hasStartEndLevels());
				$("#chkLeftRight").prop('checked', config.hasSideSwimLanes());
				$("#chkGrid").prop('checked', config.hasShowGrid());
				$("#chkAutoGen").prop('checked', config.hasAutoGenNodeNames());
				$("#chkHideNamesId").prop('checked', config.hasHideNodeNames());
				$("#chkShowIconsId").prop('checked', config.hasShowNodeIcons());
				$("#chkShowRefs").prop('checked', config.hasShowRefHandles());
				$("#chkShowLinkLabelsId").prop('checked', config.hasShowLinkLabels());

				if (config.getLinkStyle() === constants.linkStyle().SINGLE_ARROW) {
					$("#styleSingleId").prop('checked', true);
				} else if (config.getLinkStyle() === constants.linkStyle().DOUBLE_ARROW) {
					$("#styleDoubleId").prop('checked', true);
				}

				// TODO: more...

				//// DIMENSIONS ////

				_nodeWidth = config.getGlobalFlowWidth();
				_nodeHeight = config.getGlobalFlowHeight();
				_seWidth = config.getGlobalSEWidth();
				_seHeight = config.getGlobalSEHeight();
				_decisionWidth = config.getGlobalDecisionWidth();
				_decisionHeight = config.getGlobalDecisionHeight();

				$("#dmsFlowDefId").prop('disabled', true);
				$("#dmsSEDefId").prop('disabled', true);
				$("#dmsDecisionDefId").prop('disabled', true);
				//$("#allDmsToDefId").prop('disabled', true);

				//// COLORS ////

				if (!config.isEditMode()) {
					_typeColorPickSelector.spectrum("disable");
				} else {
					_typeColorPickSelector.spectrum("enable");
				}

				_oldProcBgnColor = config.getProcBgnColor();
				// initial color
				_typeColorPickSelector.spectrum(
					"set", _oldProcBgnColor
				);
				_oldProcFgnColor = config.getProcFgnColor();
				_oldDecBgnColor = config.getDecBgnColor();
				_oldDecFgnColor = config.getDecFgnColor();
				_oldIOBgnColor = config.getIOBgnColor();
				_oldIOFgnColor = config.getIOFgnColor();
				_oldSEBgnColor = config.getSEBgnColor();
				_oldSEFgnColor = config.getSEFgnColor();
				_oldSideBgnColor = config.getSideBgnColor();
				_oldSideFgnColor = config.getSideFgnColor();
				_oldTermBgnColor = config.getTermBgnColor();
				_oldTermFgnColor = config.getTermFgnColor();

				_currProcBgnColor = _oldProcBgnColor;
				_currProcFgnColor = _oldProcFgnColor;
				_currDecBgnColor = _oldDecBgnColor;
				_currDecFgnColor = _oldDecFgnColor;
				_currIOBgnColor = _oldIOBgnColor;
				_currIOFgnColor = _oldIOFgnColor;
				_currSEBgnColor = _oldSEBgnColor;
				_currSEFgnColor = _oldSEFgnColor;
				_currSideBgnColor = _oldSideBgnColor;
				_currSideFgnColor = _oldSideFgnColor;
				_currTermBgnColor = _oldTermBgnColor;
				_currTermFgnColor = _oldTermFgnColor;

				_btnProcTypeSltr.prop('checked', true);
				_currentType = constants.flowType().PROCESS;

				setTypesDisplayColors(constants.flowType().PROCESS, true);
				setTypesDisplayColors(constants.flowType().DECISION);
				setTypesDisplayColors(constants.flowType().IN_OUT);
				setTypesDisplayColors(constants.flowType().START);
				setTypesDisplayColors(constants.flowType().LEFT_TOP);
				setTypesDisplayColors(constants.flowType().ENDPOINT);

				_btnBgnColorSltr.prop('disabled', blockEdit);
				_btnFgnColorSltr.prop('disabled', blockEdit);
				_btnColorDefSltr.prop('disabled', blockEdit);

				_btnBgnColorSltr.prop('checked', true);
				setDisplayColors(_currentType, true);

				_btnRollbackColorsSltr.prop('disabled', true);
				$("#resetAllColorsId").prop('disabled', blockEdit);

				_btnResetIconsSltr.prop('disabled', blockEdit);

				_chkProcUpdSltr.prop('checked', false);
				_chkDecUpdSltr.prop('checked', false);
				_chkIOUpdSltr.prop('checked', false);
				_chkSEUpdSltr.prop('checked', false);
				_chkSideUpdSltr.prop('checked', false);
				_chkTermUpdSltr.prop('checked', false);

				_chkProcUpdSltr.prop('disabled', blockEdit);
				_chkDecUpdSltr.prop('disabled', blockEdit);
				_chkIOUpdSltr.prop('disabled', blockEdit);
				_chkSEUpdSltr.prop('disabled', blockEdit);
				_chkSideUpdSltr.prop('disabled', blockEdit);
				_chkTermUpdSltr.prop('disabled', blockEdit);

				//// ICONS ////

				_btnFlowCtgSltr.prop('disabled', blockEdit);
				_btnFlagCtgSltr.prop('disabled', blockEdit);
				_btnQuizCtgSltr.prop('disabled', blockEdit);

				_currentCategory = constants.nodeCategory().FLOW;
				_btnFlowCtgSltr.prop('checked', true);
				// IMPORTANT:
				iconPicker.setNodeCategory(_currentCategory);

				_oldFlowCtgKey = config.getFlowIconKey();
				_oldFlagCtgKey = config.getFlagIconKey();
				_oldQuizCtgKey = config.getQuizIconKey();
				_currFlowCtgKey = _oldFlowCtgKey;
				_currFlagCtgKey = _oldFlagCtgKey;
				_currQuizCtgKey = _oldQuizCtgKey;

				_iconMenuSelector.iconselectmenu("refreshButtonItem", _oldFlowCtgKey, _currentCategory);

				_iconMenuSelector.iconselectmenu({
					disabled: !config.isEditMode(),
					change: function( event, ui ) {
						var key = ui.item.value;
						if (_currentCategory === constants.nodeCategory().FLOW) {
							_currFlowCtgKey = key;
							_imgFlowSltr.attr('src', iconPicker.getIconURL(_currFlowCtgKey));
							_chkFlowUpdSltr.prop('checked', true);
						} else if (_currentCategory === constants.nodeCategory().FLAG) {
							_currFlagCtgKey = key;
							_imgFlagSltr.attr('src', iconPicker.getIconURL(_currFlagCtgKey));
							_chkFlagUpdSltr.prop('checked', true);
						} else if (_currentCategory === constants.nodeCategory().QUIZ) {
							_currQuizCtgKey = key;
							_imgQuizSltr.attr('src', iconPicker.getIconURL(_currQuizCtgKey));
							_chkQuizUpdSltr.prop('checked', true);
						}
						_btnResetIconsSltr.prop('disabled', false);
						_doResetAllIcons = false;
						checkEnableOK();
					}
				});

				_imgFlowSltr.attr('src', iconPicker.getIconURL(_oldFlowCtgKey));
				_imgFlagSltr.attr('src', iconPicker.getIconURL(_oldFlagCtgKey));
				_imgQuizSltr.attr('src', iconPicker.getIconURL(_oldQuizCtgKey));

				_chkFlowUpdSltr.prop('checked', false);
				_chkFlagUpdSltr.prop('checked', false);
				_chkQuizUpdSltr.prop('checked', false);

				_chkFlowUpdSltr.prop('disabled', blockEdit);
				_chkFlagUpdSltr.prop('disabled', blockEdit);
				_chkQuizUpdSltr.prop('disabled', blockEdit);

				$("#settingSchemesId").schememenu({
					disabled: !config.isEditMode(),
					change: function( event, ui ) {
						// TODO
					}
				});

				$("#newSchemeId").prop('disabled', blockEdit);
				$("#btnDeleteSchemeId").prop('disabled', true);
				$("#btnSaveSchemeId").prop('disabled', true);

				// TODO: use default button
			}

			function updateConfig() {

				//// GENERAL ////

				if ($("#btnEditAllId").prop('checked')) {
					config.setEditMode(constants.editMode().EDIT_ALL);
				} else if ($("#btnViewOnlyId").prop('checked')) {
					config.setEditMode(constants.editMode().VIEW_ONLY);
				}

				if ($("#btnVertical").prop('checked') && _directionBefore !== constants.flow().VERTICAL) {
					_manager.getCaller().changeFlowDirection(constants.flow().VERTICAL);
				} else if ($("#btnHorizontal").prop('checked') && _directionBefore !== constants.flow().HORIZONTAL) {
					_manager.getCaller().changeFlowDirection(constants.flow().HORIZONTAL);
				}

				config.setCanvasLevels($("#spinnerLevelsId").spinner("value"));
				config.setCanvasLanes($("#spinnerLanesId").spinner("value"));
				_newStartEndLevels = $("#chkStartEnd").prop('checked') ? constants.bValue().TRUE : constants.bValue().FALSE;
				_newSideSwimLanes = $("#chkLeftRight").prop('checked') ? constants.bValue().TRUE : constants.bValue().FALSE;
				config.setShowGrid($("#chkGrid").prop('checked'));
				config.setAutoGenNodeNames($("#chkAutoGen").prop('checked'));
				config.setHideNodeNames($("#chkHideNamesId").prop('checked'));
				config.setShowNodeIcons($("#chkShowIconsId").prop('checked'));
				config.setShowRefHandles($("#chkShowRefs").prop('checked'));
				config.setShowLinkLabels($("#chkShowLinkLabelsId").prop('checked'));

				if ($("#styleSingleId").prop('checked')) {
					config.setLinkStyle(constants.linkStyle().SINGLE_ARROW);
				} else if ($("#styleDoubleId").prop('checked')) {
					config.setLinkStyle(constants.linkStyle().DOUBLE_ARROW);
				}

				var isLevels, levelsValue, isLanes, lanesValue;
				if (_startEndLevels !== _newStartEndLevels) {
					isLevels = true;
					levelsValue = _newStartEndLevels === constants.bValue().TRUE ?
							constants.change().UP : constants.change().DOWN;
				}
				if (_sideSwimLanes !== _newSideSwimLanes) {
					isLanes = true;
					lanesValue = _newSideSwimLanes === constants.bValue().TRUE ?
							constants.change().UP : constants.change().DOWN;
				}
				if (isLevels || isLanes) {
					_manager.getFlowController().changeCanvasSettings(isLevels, levelsValue, isLanes, lanesValue);
				}

				// TODO: more...

				// decide whether diagram to become dirty
				if (_editMode !== config.getEditMode() && !_manager.getModelHandler().isDiagramEmpty()) {
					_manager.setSettingsChanged(true);
					_manager.getCaller().setEditModeText(config.getEditMode());
				}
				if (_layoutMode !== config.getLayoutMode() || //
						_startEndLevels !== config.getStartEndLevels() ||
						_sideSwimLanes !== config.getSideSwimLanes()) {
					//_manager.resetUndoManager();
					_manager.setSettingsChanged(true);
				}
				//if (_manager.hasDiagramOpen() && _isHorizontal !== config.getFlowDirection()) {
				//	_manager.setSettingsChanged(true);
				//}
				if (_manager.hasDiagramOpen() && _linkStyle !== config.getLinkStyle()) {
					_manager.setSettingsChanged(true);
				}
				if (_canvasLevels !== config.getCanvasLevels() ||
						_canvasLanes !== config.getCanvasLanes()) {
					_manager.setSettingsChanged(true);
				}
				if (_manager.hasDiagramOpen() &&
						(_isGenerate !== config.hasAutoGenNodeNames() ||
						_isHideNames !== config.hasHideNodeNames() ||
						_isShowIcons !== config.hasShowNodeIcons() ||
						_isShowLinkLabels !== config.hasShowLinkLabels() ||
						_showRefs !== config.hasShowRefHandles())) {
					_manager.setSettingsChanged(true);
				}

				//// DIMENSIONS ////

				if (_nodeWidth !== config.getGlobalFlowWidth() ||
					_nodeHeight !== config.getGlobalFlowHeight() ||
					_seWidth !== config.getGlobalSEWidth() ||
					_seHeight !== config.getGlobalSEHeight() ||
					_decisionWidth !== config.getGlobalDecisionWidth() ||
					_decisionHeight !== config.getGlobalDecisionHeight()) {

					_manager.setSettingsChanged(true);
				}

				//// COLORS ////

				var hasColorChanges = _doResetAllColors;
				if (_doResetAllColors) {
					hasColorChanges = true;
					resetAllColorsToDefs();
				}
				if (!hasColorChanges) {
					if (_oldProcBgnColor.localeCompare(_currProcBgnColor) !== 0 || _chkProcUpdSltr.prop('checked')) {
						config.setProcBgnColor(_currProcBgnColor);
						updateNodesBgnColors(constants.nodeGroup().PROC, _currProcBgnColor);
						hasColorChanges = true;
					}
					if (_oldProcFgnColor.localeCompare(_currProcFgnColor) !== 0 || _chkProcUpdSltr.prop('checked')) {
						config.setProcFgnColor(_currProcFgnColor);
						updateNodesFgnColors(constants.nodeGroup().PROC, _currProcFgnColor);
						hasColorChanges = true;
					}
					if (_oldDecBgnColor.localeCompare(_currDecBgnColor) !== 0 || _chkDecUpdSltr.prop('checked')) {
						config.setDecBgnColor(_currDecBgnColor);
						updateNodesBgnColors(constants.nodeGroup().DEC, _currDecBgnColor);
						hasColorChanges = true;
					}
					if (_oldDecFgnColor.localeCompare(_currDecFgnColor) !== 0 || _chkDecUpdSltr.prop('checked')) {
						config.setDecFgnColor(_currDecFgnColor);
						updateNodesFgnColors(constants.nodeGroup().DEC, _currDecFgnColor);
						hasColorChanges = true;
					}
					if (_oldIOBgnColor.localeCompare(_currIOBgnColor) !== 0 || _chkIOUpdSltr.prop('checked')) {
						config.setIOBgnColor(_currIOBgnColor);
						updateNodesBgnColors(constants.nodeGroup().IO, _currIOBgnColor);
						hasColorChanges = true;
					}
					if (_oldIOFgnColor.localeCompare(_currIOFgnColor) !== 0 || _chkIOUpdSltr.prop('checked')) {
						config.setIOFgnColor(_currIOFgnColor);
						updateNodesFgnColors(constants.nodeGroup().IO, _currIOFgnColor);
						hasColorChanges = true;
					}
					if (_oldSEBgnColor.localeCompare(_currSEBgnColor) !== 0 || _chkSEUpdSltr.prop('checked')) {
						config.setSEBgnColor(_currSEBgnColor);
						updateNodesBgnColors(constants.nodeGroup().SE, _currSEBgnColor);
						hasColorChanges = true;
					}
					if (_oldSEFgnColor.localeCompare(_currSEFgnColor) !== 0 || _chkSEUpdSltr.prop('checked')) {
						config.setSEFgnColor(_currSEFgnColor);
						updateNodesFgnColors(constants.nodeGroup().SE, _currSEFgnColor);
						hasColorChanges = true;
					}
					if (_oldSideBgnColor.localeCompare(_currSideBgnColor) !== 0 || _chkSideUpdSltr.prop('checked')) {
						config.setSideBgnColor(_currSideBgnColor);
						updateNodesBgnColors(constants.nodeGroup().SIDE, _currSideBgnColor);
						hasColorChanges = true;
					}
					if (_oldSideFgnColor.localeCompare(_currSideFgnColor) !== 0 || _chkSideUpdSltr.prop('checked')) {
						config.setSideFgnColor(_currSideFgnColor);
						updateNodesFgnColors(constants.nodeGroup().SIDE, _currSideFgnColor);
						hasColorChanges = true;
					}
					if (_oldTermBgnColor.localeCompare(_currTermBgnColor) !== 0 || _chkTermUpdSltr.prop('checked')) {
						config.setTermBgnColor(_currTermBgnColor);
						updateNodesBgnColors(constants.nodeGroup().TERM, _currTermBgnColor);
						hasColorChanges = true;
					}
					if (_oldTermFgnColor.localeCompare(_currTermFgnColor) !== 0 || _chkTermUpdSltr.prop('checked')) {
						config.setTermFgnColor(_currTermFgnColor);
						updateNodesFgnColors(constants.nodeGroup().TERM, _currTermFgnColor);
						hasColorChanges = true;
					}
				}
				if (hasColorChanges) {
					_manager.setSettingsChanged(true);
				}

				var hasIconChanges = _doResetAllIcons;
				if (_doResetAllIcons) {
					hasIconChanges = true;
					resetAllIconsToDefs();
				}
				if (!hasIconChanges) {
					if (_oldFlowCtgKey.localeCompare(_currFlowCtgKey) !== 0 || _chkFlowUpdSltr.prop('checked')) {
						config.setFlowIconKey(_currFlowCtgKey);
						updateNodesIconKeys(constants.nodeCategory().FLOW, _currFlowCtgKey);
						hasIconChanges = true;
					}
					if (_oldFlagCtgKey.localeCompare(_currFlagCtgKey) !== 0 || _chkFlagUpdSltr.prop('checked')) {
						config.setFlagIconKey(_currFlagCtgKey);
						updateNodesIconKeys(constants.nodeCategory().FLAG, _currFlagCtgKey);
						hasIconChanges = true;
					}
					if (_oldQuizCtgKey.localeCompare(_currQuizCtgKey) !== 0 || _chkQuizUpdSltr.prop('checked')) {
						config.setQuizIconKey(_currQuizCtgKey);
						updateNodesIconKeys(constants.nodeCategory().QUIZ, _currQuizCtgKey);
						hasIconChanges = true;
					}
				}
				if (hasIconChanges) {
					_manager.setSettingsChanged(true);
				}

				///////
				_manager.refreshDiagramOnEdit(true);

			}

			function updateNodesBgnColors(nodeGroup, newColor) {
				if (_manager) {
					var nodes = _manager.getModelHandler().getFlowNodes();
					for (var i = 0; i < nodes.length; i++) {
						if (nodes[i].getNodeGroup() === nodeGroup) {
							nodes[i].setBgnColor(newColor);
						}
					}
				}
			}
			function updateNodesFgnColors(nodeGroup, newColor) {
				if (_manager) {
					var nodes = _manager.getModelHandler().getFlowNodes();
					for (var i = 0; i < nodes.length; i++) {
						if (nodes[i].getNodeGroup() === nodeGroup) {
							nodes[i].setFgnColor(newColor);
						}
					}
				}
			}
			function updateNodesIconKeys(nodeCategory, newKey) {
				if (_manager) {
					var nodes = _manager.getModelHandler().getFlowNodes();
					for (var i = 0; i < nodes.length; i++) {
						if (nodes[i].getNodeCategory() === nodeCategory) {
							nodes[i].setNodeIconKey(newKey);
						}
					}
				}
			}
		}

		return new SettingsDialog();

	}
);