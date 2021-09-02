define(['jquery'],
    function($) {

        function AboutDialog() {
            var self = this,
                _width = 450,
                _height = 310;

            self.initDialog = function(manager) {
                var aboutDialog = $("#aboutDialogId");
                aboutDialog.dialog({
                    autoOpen: false,
                    closeOnEscape: false,
                    width: _width,
                    show: {effect: "slideDown", delay: 200, duration: 100},
                    hide: {effect: 'slideUp', duration: 200},
                    modal: true,
                    resizable: false,
                    open: function(event, ui) {
                        $(".ui-dialog-titlebar").hide();
                        $(".ui-dialog-buttonpane").hide();
                        $(this).css('padding', 0);
                        $(this).css('margin', -5);
                        $(this).dialog( "option", "height", _height );
                    }
                });
                aboutDialog.on('dialogclose', function(){
                    //$(".ui-dialog-titlebar").show();
                    $(".ui-dialog-buttonpane").show();
                });
                aboutDialog.on('click', function(){
                    aboutDialog.dialog("close");
                });
                $(document).on('click', ".ui-widget-overlay", function(){
                    aboutDialog.dialog("close");
                });
            };

        }

        return new AboutDialog();
    }
);