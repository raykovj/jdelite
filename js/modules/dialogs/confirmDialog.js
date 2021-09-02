define(['jquery','knockout',
        'modules/graph/graphConstants'],
    function($, ko,
             constants) {

        function ConfirmDialog() {
            var self = this;

            /////////////////////////////////////////////
            // invoked with <dataflow>.showConfirmMessage
            /////////////////////////////////////////////

            self.initDialog = function(manager) {
                var confirmDialog = $("#confirmDialogId");
                confirmDialog.dialog({
                    autoOpen: false,
                    closeOnEscape: false,
                    width: 420,
                    height: 160,
                    show: {effect: "slideDown",  duration: 100},
                    hide: {effect: 'slideUp', duration: 100},
                    modal: true,
                    resizable: false,
                    title: "Confirm",
                    open: function(event, ui) {},
                    buttons:[
                        {
                            text: "OK",
                            click: function() {
                                handleConfirm(manager);
                                $(this).dialog("close");
                            }
                        },
                        {
                            text: "Cancel",
                            click: function() {
                                handleCancel(manager);
                                $(this).dialog("close");
                            }
                        }
                    ]
                });
                $(document).on('click', ".ui-widget-overlay", function(){
                    manager.getCaller().setConfirmFlag(undefined);
                    confirmDialog.dialog( "close" );
                });
            };

            function handleConfirm(manager) {
                manager.getCaller().setConfirmFlag(constants.bValue().TRUE);
            }
            function handleCancel(manager) {
                manager.getCaller().setConfirmFlag(constants.bValue().FALSE);
            }

        }

        return new ConfirmDialog();
    }
);