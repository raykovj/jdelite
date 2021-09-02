define(['knockout'], function(ko) {
	ko.components.register('settings-dialog', {
	    viewModel: { require: 'modules/settings/settingsDialog'},
	    template: { require: 'text!modules/settings/settingsDialogContent.html' }
	});
});