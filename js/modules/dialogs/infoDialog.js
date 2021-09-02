define(['jquery','knockout',
        'modules/graph/graphConstants'],
    function($, ko,
             constants) {

        function InfoDialog() {
            var self = this;

            /////////////////////////////////////////////
            // invoked with <dataflow>.showInfoMessage
            /////////////////////////////////////////////

            self.initDialog = function(manager) {
                var infoDialog = $("#infoDialogId");
                infoDialog.dialog({
                    autoOpen: false,
                    closeOnEscape: false,
                    width: 420,
                    height: 202,
                    show: {effect: "slideDown",  duration: 200},
                    hide: {effect: 'slideUp', duration: 200},
                    modal: true,
                    resizable: false,
                    title: "Info",
                    //position: {my: "left top", at: "left bottom+4", of: $("#saveAsId")},
                    open: function(event, ui) {
                        //$(".ui-dialog-titlebar-close").hide();
                    },
                    buttons: {
                            "Close": function() {
                                $(this).dialog("close");
                            }
                    },
                    close: function (event, ui) {
                        //
                    }

                });
                $(document).on('click', ".ui-widget-overlay", function(){
                    infoDialog.dialog( "close" );
                });
            };

        }

        return new InfoDialog();
    }
);