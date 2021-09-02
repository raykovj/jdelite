define(['jquery'],
	function($) {

		return {
			showMessage: function(title, message) {
				if (!title)
					title = 'Alert';
				if (!message)
					message = 'No message to display';
				var msgDlg = $("<div style='font-family: sans-serif; font-size: 13px; font-weight: bold;'></div>").html(message).dialog({
					title: title,
					resizable: false,
					width: "380",
					height: "auto",
					font: "10px Arial",
					show: {effect: "slideDown",  duration: 200},
					hide: {effect: 'slideUp', duration: 200},
					modal: true,
					open: function(event, ui) {
						//$(".ui-dialog-titlebar-close").hide();
						$('.ui-widget-overlay').bind('click', function() {
							msgDlg.dialog("close");
						});
					},
					buttons: {
						"OK": function() {
							$(this).dialog("close");
						}
					},
					close: function (event, ui) {
						$(this).remove();
					}
				});
			}
		}
	}
);