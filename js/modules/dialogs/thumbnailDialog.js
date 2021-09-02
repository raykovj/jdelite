define(['jquery'],
    function($) {

        function ThumbnailDialog() {
            var self = this;

            self.initDialog = function(manager) {
                var thumbnailDialog = $("#thumbnailDialogId");
                thumbnailDialog.dialog({
                    autoOpen: false,
                    closeOnEscape: true,
                    width: 188,
                    height:260,
                    show: {effect: "slideDown",  duration: 200},
                    hide: {effect: 'slideUp', duration: 200},
                    modal: false,
                    resizable: false,
                    dialogClass: 'showCloseButton',
                    title: "Thumbnail View",
                    //position: {my: "left top", at: "left+10 top+10", of: $("#paletteCtrId")}
                    //position: {my: "right top", at: "right-4 bottom-4", of: $("#btnThumbnailId")}
                    position: {my: "right bottom", at: "right-10 bottom-2", of: $("#topContainerId")}
                });
            };
        }
        return new ThumbnailDialog();
    }
);