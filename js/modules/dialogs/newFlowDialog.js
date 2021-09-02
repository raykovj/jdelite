define(['jquery','knockout'],
	function($, ko) {

		function NewFlowDialog() {
			var self = this;
			//console.log("** inside dialogModel: ...");

			self.initDialog = function(manager) {
				//var manager = manager;
				var newDialog = $("#newFlowDialogId");
				newDialog.dialog({
					autoOpen: false,
					closeOnEscape: false,
					width: 400,
					//height: 192,
					show: {effect: "slideDown",  duration: 200},
					hide: {effect: 'slideUp', duration: 200},
					modal: true,
					resizable: false,
					title: "New Flow Diagram",
					position: {my: "left top", at: "left bottom+4", of: $("#newId")},
					open: function(event, ui) {
						//$(".ui-dialog-titlebar-close").hide();
						$("#newFileNameId").val('');
						$("#btnPagesId").prop('disabled', true);
						$("#btnDiagramId").prop('checked', true);
					},
					buttons: [
						{
							id: "newFlowButtonOK",
							text: "OK",
							click: function() {
								self.createNewDiagram(manager);
								$(this).dialog("close");
							}
						},
						{
							text: "Cancel",
							click: function() {
								$(this).dialog("close");
							}
						}
					]
				});
				$(document).on('click', ".ui-widget-overlay", function(){
					newDialog.dialog( "close" );
				});
			};

			self.createNewDiagram = function(manager) {
				var fileName = manager.getCaller().newFSNameValue();
				//console.log("OK: newFlowDialog - handleSelection, name='"+fileName+"'");
				if (fileName && fileName.length > 0) {
					manager.createDiagram(fileName + '.json');
				} else {
					console.log("newFlowDialog - can't proceed, empty value");
				}
			}
		}

		return new NewFlowDialog();

	}
);