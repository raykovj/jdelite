define(['jquery',
		'knockout',
		'modules/settings/config',
		'modules/util/utils',
		'modules/graph/graphConstants'],
	function($, ko,
			 config,
			 utils,
			 constants) {

		function OpenFlowDialog() {
			var self = this,
				_manager,
				_restoreOnClose,
				_dialogMode;

			self.initDialog = function(manager) {
				_manager = manager;
				var openDialog = $("#openFlowDialogId");
				openDialog.dialog({
					autoOpen: false,
					closeOnEscape: false,
					width: 400,
					show: {effect: "slideDown",  duration: 200},
					hide: {effect: 'slideUp', duration: 200},
					modal: true,
					resizable: false,
					open: function(event, ui) {
						//$(".ui-dialog-titlebar-close").hide();
						_dialogMode = manager.getCaller().getFSDialogMode();
						if (_dialogMode !== constants.fsDialogMode().SAVE) {
							openDialog.dialog({
								position: {my: "left top", at: "left bottom+4", of: $("#openId")},
								title: "Open Flow Diagram"
							});
						} else { //if (_dialogMode === constants.fsDialogMode().SAVE) {
							var fName = utils.getFileNameNoExt(manager.getFileName());
							manager.getCaller().saveAsFileNameValue(fName);
							openDialog.dialog({
								position: {my: "left top", at: "left bottom+4", of: $("#saveAsId")},
								title: "Save Diagram As..."
							});
						}
						//console.log("CONNECTION: "+manager.getCaller().isConnectionOK());
						if (!manager.getCaller().isConnectionOK()) {
							$("#dirsBtnDownId").attr('disabled', true);
							document.getElementById("selectedDirId").value = "";
						} else {
							$("#dirsBtnDownId").attr('disabled', !manager.getCaller().getSelectedDir());
						}

						$("#createFolderId").attr('disabled', !config.isEditMode());
						//$("#deleteFSId").attr('disabled', !config.isEditMode());
						$("#deleteFSId").attr('disabled', true);

						//manager.getDirContent();
						_restoreOnClose = true;

						//$('.ui-widget-overlay').bind('click', function() {
						//	if ($("#newFolderDialogId").dialog("isOpen")) {
						//		$("#newFolderDialogId").dialog("close");
						//	} else {
						//		openDialog.dialog("close");
						//	}
						//});

						//
						setTimeout(function() {
							openDialog.blur();
							$("#selectedDirId").blur();
						}, 300);

					},
					buttons: [
						{
							text: "OK",
							click: function() {
								_restoreOnClose = false;
								self.handleSelection(manager);
								openDialog.dialog("close");
							}
						},
						{
							text: "Cancel",
							click: function() {
								openDialog.dialog("close");
							}
						}
					]
				});

				$(document).on('click', ".ui-widget-overlay", function(){
						if ($("#newFolderDialogId").dialog("isOpen")) {
						$("#newFolderDialogId").dialog("close");
					} else {
						openDialog.dialog("close");
					}
				});
				openDialog.on("dialogclose", function( event, ui ) {
					manager.getCaller().setFSDialogMode(constants.fsDialogMode().NONE);
					if (_restoreOnClose) {
						// discard !
						//manager.getCaller().restoreWorkDir();
					}
				});
			};

			self.handleSelection = function(manager) {
				if (_dialogMode === constants.fsDialogMode().OPEN) {
					var fileName = manager.getCaller().getSelectedFile();
					//console.log("OK: openFlowDialog - handleSelection: "+fileName);
					manager.openDiagram(fileName);
				} else if (_dialogMode === constants.fsDialogMode().SAVE) {
					var fileName = manager.getCaller().saveAsFileNameValue();
					//console.log("#### SAVE AS fileName: "+fileName);
					if (fileName && fileName.length > 0) {
						manager.saveFlowDataAs(fileName + '.json');
					} else {
						console.log("SaveAs - can't proceed, empty value");
					}
				}
			}
		}

		return new OpenFlowDialog();

	}
);