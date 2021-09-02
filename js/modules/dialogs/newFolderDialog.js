define(['jquery',
        'modules/server/directories',
        'modules/graph/graphConstants'],
    function($,
             directories,
             constants) {

        function NewFolderDialog() {
            var self = this,
                _manager,
                _newFolderDialog = $("#newFolderDialogId");

            self.initDialog = function(manager) {
                _manager = manager;
                _newFolderDialog.dialog({
                    autoOpen: false,
                    closeOnEscape: false,
                    width: 400,
                    //height: 192,
                    show: {effect: "slideDown",  duration: 200},
                    hide: {effect: 'slideUp', duration: 200},
                    modal: true,
                    resizable: false,
                    title: "Create New Folder",
                    //position: {my: "left top", at: "left bottom+4", of: $("#createFolderId")},
                    open: function(event, ui) {
                        //$(".ui-dialog-titlebar-close").hide();
                        _newFolderDialog.dialog({ position: {my: "left top", at: "left bottom+4", of: $("#createFolderId")} });
                        $("#newFolderNameId").val('');
                        $("#newFolderNameId").focus();
                    },
                    buttons: [
                        {
                            id: "newFolderButtonOK",
                            text: "OK",
                            click: function() {
                                self.createNewFolder(manager);
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
            };

            self.createNewFolder = function(manager) {
                var dirName = manager.getCaller().newFSNameValue(),
                    path = manager.getCaller().getWorkDir();
                manager.createFolder(dirName);
            };

            _newFolderDialog.on("dialogopen", function(event, ui) {
                _manager.getCaller().validateFSName(null, true);
            });
            _newFolderDialog.on("dialogclose", function(event, ui) {
                _manager.getCaller().newFSNameValue("");
            });


        }

        return new NewFolderDialog();

    }
);