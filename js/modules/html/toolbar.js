define(['jquery',
		'jqueryui',
		'jqueryuictxm',
		'modules/settings/config',
		'modules/graph/graphConstants',
		'modules/util/aboutText'],
	function($,
			 jqueryui,
			 jqueryuictxm,
			 config,
			 constants,
			 aboutText) {

		var getMenu = function(manager) {
			return [
				{title: "New...", cmd: "newCmd", action: function(event, ui) {
					manager.getCaller().setNewAction(true);
					if (manager.getCaller().isConnectionOK() && manager.isDirty() && !manager.getModelHandler().isDiagramEmpty()) {
						manager.proceedOnSave();
					} else {
						manager.getDirContent();
						$("#newFlowDialogId").dialog("open");
					}
				}},
				{title: "----"},
				{title: "Open...", cmd: "openCmd", action: function(event, ui) {
					manager.getCaller().setNewAction(false);
					if (manager.getCaller().isConnectionOK()) {
						if (manager.isDirty() && !manager.getModelHandler().isDiagramEmpty()) {
							manager.proceedOnSave();
						} else {
							manager.getCaller().setFSDialogMode(constants.fsDialogMode().OPEN);
							manager.getDirContent();
							$("#openFlowDialogId").dialog("open");
						}
					} else {
						manager.getDirContent();
						$("#openFlowDialogId").dialog("open");
					}

				}},
				{title: "----"},
				{title: "Undo<kbd>Ctrl+Z</kbd>", cmd: "undoCmd", action: function(event, ui) {
					manager.getUndoManager().undo();
				}, disabled: true },
				//{title: "----"},
				{title: "Redo<kbd>Ctrl+Shift+Z</kbd>", cmd: "redoCmd", action: function(event, ui) {
					manager.getUndoManager().redo();
				}, disabled: true },
				{title: "----"},
				{title: "Remove selections<kbd>Delete</kbd>", cmd: "removeSelected", action: function(event, ui) {
					manager.getFlowController().removeSelections();
					manager.getSelectionManager().clearSelections();
					manager.refreshDiagramOnEdit();
				}, disabled: true },
				{title: "Copy<kbd>Ctrl+C</kbd>", cmd: "copyCmd", action: function(event, ui) {
					manager.copySelections();
				}, disabled: true },
				{title: "Paste<kbd>Ctrl+V</kbd>", cmd: "pasteCmd", action: function(event, ui) {
					manager.pasteSelections();
				}, disabled: true },
				{title: "----"},
				{title: "Save<kbd>Ctrl+S</kbd>", cmd: "saveCmd", action: function(event, ui) {
					if (manager.isNewToSave()) {
						manager.getCaller().setFSDialogMode(constants.fsDialogMode().SAVE);
						$("#openFlowDialogId").dialog("open");
					} else {
						manager.saveFlowData();
					}
				}, disabled: true },
				//{title: "----"},
				{title: "Save As...<kbd>Ctrl+Shift+S</kbd>", cmd: "saveAsCmd", action: function(event, ui) {
					manager.getCaller().setFSDialogMode(constants.fsDialogMode().SAVE);
					$("#openFlowDialogId").dialog("open");
				}, disabled: false },
				{title: "----"},
				{title: "Settings...", cmd: "settingsCmd", action: function(event, ui) {
					$("#settingsDialogId").dialog("open");
				}, disabled: false },
				{title: "----"},
				{title: "Help", children: getMenuHelp(manager)}
			];
		};

		var getMenuHelp = function(manager) {
			return [
				{title: "Overview", action: function(event, ui) {
					window.open("./js/help/manual.htm");
				}},
				{title: "----"},
				{title: "Comparison chart", action: function(event, ui) {
					window.open("./js/help/comp_chart.html");
				}},
				{title: "----"},
				{title: "About", action: function(event, ui) {
					var title = aboutText.getTitle(),
						version = aboutText.getVersion(),
						text = aboutText.getText(),
						sources = aboutText.getOpenSources(),
						copy = aboutText.getCopyright();
					manager.getCaller().showAboutBox(title, version, text, sources, copy);
				}}
			];
		};

		var getAppMode = function() {
			return config.getAppMode();
		};

		var isConnectionOk = function(manager) {
			return manager.getCaller().isConnectionOK();
		};

		return {
			updateMenus: function(caller) {
				var _menuSelector = $("#menuId"),
					manager = caller.getFlowManager(),
					cnxOK = manager.getCaller().isConnectionOK(),
					allowEdit = config.isEditMode();

				_menuSelector.contextmenu({
					autoTrigger: false,
					menu: getMenu(manager),
					uiMenuOptions: {classes: {"ui-menu": "ui-menu ctx-menu"}},
					position: function(event, ui) {
						return {my: "left top", at: "left bottom+2", of: ui.target};
					},
					beforeOpen: function (event, ui) {
						_menuSelector.contextmenu("enableEntry", "newCmd", allowEdit && getAppMode() === constants.appMode().FLOW_MODE);
						_menuSelector.contextmenu("enableEntry", "openCmd", getAppMode() === constants.appMode().FLOW_MODE);
						_menuSelector.contextmenu("enableEntry", "undoCmd", allowEdit && manager.canUndo());
						_menuSelector.contextmenu("enableEntry", "redoCmd",allowEdit &&  manager.canRedo());
						_menuSelector.contextmenu("enableEntry", "removeSelected", allowEdit && manager.getSelectionManager().hasSelections());
						_menuSelector.contextmenu("enableEntry", "copyCmd", allowEdit && manager.canCopy());
						_menuSelector.contextmenu("enableEntry", "pasteCmd", allowEdit && manager.readyToPaste());
						_menuSelector.contextmenu("enableEntry", "saveCmd", allowEdit && cnxOK && manager.isDirty());
						_menuSelector.contextmenu("enableEntry", "saveAsCmd", allowEdit && cnxOK && !manager.getModelHandler().isDiagramEmpty());
					}
				});
			},
			initButtons: function(caller) {
				var _menuSelector = $("#menuId"),
					_helpSelector = $("#helpId"),
					manager = caller.getFlowManager(),
					cnxOK = manager.getCaller().isConnectionOK(),
					allowEdit = config.isEditMode();

				_menuSelector.contextmenu({
					autoTrigger: false,
					menu: getMenu(manager),
					uiMenuOptions: {classes: {"ui-menu": "ui-menu ctx-menu"}},
					position: function(event, ui) {
						return {my: "left top", at: "left bottom+2", of: ui.target};
					},
					beforeOpen: function (event, ui) {
						_menuSelector.contextmenu("enableEntry", "newCmd", allowEdit && cnxOK);
						_menuSelector.contextmenu("enableEntry", "openCmd", cnxOK);
						_menuSelector.contextmenu("enableEntry", "undoCmd", allowEdit && manager.canUndo());
						_menuSelector.contextmenu("enableEntry", "redoCmd", allowEdit && manager.canRedo());
						_menuSelector.contextmenu("enableEntry", "removeSelected", allowEdit && manager.getSelectionManager().hasSelections());
						_menuSelector.contextmenu("enableEntry", "copyCmd", allowEdit && manager.canCopy());
						_menuSelector.contextmenu("enableEntry", "pasteCmd", allowEdit && manager.readyToPaste());
						_menuSelector.contextmenu("enableEntry", "saveCmd", allowEdit && cnxOK && manager.isDirty());
						_menuSelector.contextmenu("enableEntry", "saveAsCmd", allowEdit && cnxOK && !manager.getModelHandler().isDiagramEmpty());
					}
				}).click(function(event) {
					if ( event.which === 1 ) {
						_menuSelector.contextmenu("open", _menuSelector);
					}
				});

				_helpSelector.contextmenu({
					autoTrigger: false,
					menu: getMenuHelp(manager),
					uiMenuOptions: {classes: {"ui-menu": "ui-menu ctx-menu"}},
					position: function(event, ui) {
						return {my: "left top", at: "left bottom+2", of: ui.target};
					}
				}).click(function(event) {
					if ( event.which === 1 ) {
						_helpSelector.contextmenu("open", _helpSelector);
					}
				});

				$("#newId").click(function() {
					caller.setNewAction(true);
					if (caller.isConnectionOK() && manager.isDirty() && !manager.getModelHandler().isDiagramEmpty()) {
						manager.proceedOnSave();
					} else {
						caller.getFlowManager().getDirContent();
						$("#newFlowDialogId").dialog("open");
					}
				});

				$("#openId").click(function() {
					caller.setNewAction(false);
					if (caller.isConnectionOK()) {
						if (manager.isDirty() && !manager.getModelHandler().isDiagramEmpty()) {
							manager.proceedOnSave();
						} else {
							caller.setFSDialogMode(constants.fsDialogMode().OPEN);
							manager.getDirContent();
							$("#openFlowDialogId").dialog("open");
						}
					} else {
						manager.getDirContent();
						$("#openFlowDialogId").dialog("open");
					}
				});

				$("#deleteId").click(function() {
					caller.getFlowManager().getFlowController().removeSelections();
					caller.getFlowManager().getSelectionManager().clearSelections();
					caller.getFlowManager().refreshDiagramOnEdit();
				}).attr('disabled', true);

				$("#copyId").click(function() {
					caller.getFlowManager().copySelections();
				}).attr('disabled', true);

				$("#pasteId").click(function() {
					//self.setProgressBarVisible(true);
					caller.getFlowManager().pasteSelections();
				}).attr('disabled', true);

				$("#undoId").click(function() {
					caller.getFlowManager().getUndoManager().undo();
				}).attr('disabled', true);

				$("#redoId").click(function() {
					caller.getFlowManager().getUndoManager().redo();
				}).attr('disabled', true);

				$("#saveId").click(function() {
					if (caller.getFlowManager().isNewToSave()) {
						caller.setFSDialogMode(constants.fsDialogMode().SAVE);
						$("#openFlowDialogId").dialog("open");
					} else {
						caller.getFlowManager().saveFlowData();
					}
				}).attr('disabled', true);

				$("#saveAsId").click(function() {
					caller.setFSDialogMode(constants.fsDialogMode().SAVE);
					$("#openFlowDialogId").dialog("open");
				}).attr('disabled', false);

				$("#configId").click(function() {
					$("#settingsDialogId").dialog("open");
				});

				$("#refreshId").click(function() {
					caller.getFlowManager().getSelectionManager().clearSelections();
					caller.getFlowManager().resetScale();
					caller.getFlowManager().refreshDiagramOnEdit();
				}).attr('disabled', true);

				$("#clearId").click(function() {
					caller.getFlowManager().getSelectionManager().clearSelections();
					caller.getFlowManager().clearDiagram();
				}).attr('disabled', true);

				$("#leftId").click(function() {
					caller.getFlowManager().getPreviousDiagram();
				}).attr('disabled', true);

				$("#rightId").click(function() {
					caller.getFlowManager().getNextDiagram();
				}).attr('disabled', true);

				$("#btnFlowHId").dblclick(function() {
					caller.btnFlowH2click();
				});
				$("#btnFlowVId").dblclick(function() {
					caller.btnFlowV2click();
				});

				$("#btnThumbnailId").click(function() {
					caller.btnThumbnailShow();
				});

				// new/decision dialog
				$("#inputPrevId").click(function() {
					caller.moveDecisionInputPrev();
				});
				$("#inputNextId").click(function() {
					caller.moveDecisionInputNext();
				});
				$("#endsPrevId").click(function() {
					caller.moveDecisionEndsPrev();
				});
				$("#endsNextId").click(function() {
					caller.moveDecisionEndsNext();
				});

				$("#dirsBtnUpId").click(function() {
					caller.goOneDirBack();
				});
				$("#dirsBtnDownId").click(function() {
					//caller.getFlowManager().getDirsList();
					caller.updateMainFSLocation();
					caller.getFlowManager().getDirContent();
				});

				//$("#saveAsBtnUpId").click(function() {
				//	caller.goOneDirBack();
				//});
				//$("#saveAsBtnDownId").click(function() {
				//	caller.getFlowManager().getDirsList();
				//});

				$("#createFolderId").click(function() {
					caller.getFlowManager().getDirsList(false, constants.fsFetchType().CREATE);
					$("#newFolderDialogId").dialog("open");
				}).attr('disabled', !config.isEditMode());

				$("#deleteFSId").click(function() {
					caller.deleteFSItem();
				}).attr('disabled', !config.isEditMode());

				$("#findDisksId").click(function() {
					caller.getFlowManager().getDiskDrives();
				}).attr('disabled', !config.isEditMode());

				$("#extendBlockAcrossId").click(function() {
					caller.doResizeContainer(constants.blockResize().EXTEND_ACROSS);
				}).attr('disabled', !config.isEditMode());
				$("#extendBlockAlongId").click(function() {
					caller.doResizeContainer(constants.blockResize().EXTEND_ALONG);
				}).attr('disabled', !config.isEditMode());
				$("#shrinkBlockAcrossId").click(function() {
					caller.doResizeContainer(constants.blockResize().SHRINK_ACROSS);
				}).attr('disabled', !config.isEditMode());
				$("#shrinkBlockAlongId").click(function() {
					caller.doResizeContainer(constants.blockResize().SHRINK_ALONG);
				}).attr('disabled', !config.isEditMode());

				$("#extendSwitchAcrossId").click(function() {
					caller.doResizeSwitch(constants.blockResize().EXTEND_ACROSS);
				}).attr('disabled', !config.isEditMode());
				$("#shrinkSwitchAcrossId").click(function() {
					caller.doResizeSwitch(constants.blockResize().SHRINK_ACROSS);
				}).attr('disabled', !config.isEditMode());

			}
		}
	}
);