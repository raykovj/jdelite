define(
    function() {

        function IconLoader() {
            var self = this;

            self.eastIcon = new Image(); self.eastIcon.src = "images/dataflow/portE12.png";
            self.westIcon = new Image(); self.westIcon.src = "images/dataflow/portW12.png";
            self.northIcon = new Image(); self.northIcon.src = "images/dataflow/portN12.png";
            self.southIcon = new Image(); self.southIcon.src = "images/dataflow/portS12.png";

            self.eastArrowIcon = new Image(); self.eastArrowIcon.src = "images/dataflow/portAE12.png";
            self.westArrowIcon = new Image(); self.westArrowIcon.src = "images/dataflow/portAW12.png";
            self.northArrowIcon = new Image(); self.northArrowIcon.src = "images/dataflow/portAN12.png";
            self.southArrowIcon = new Image(); self.southArrowIcon.src = "images/dataflow/portAS12.png";

            self.eastRefIcon = new Image(); self.eastRefIcon.src = "images/dataflow/refE12.png";
            self.westRefIcon = new Image(); self.westRefIcon.src = "images/dataflow/refW12.png";
            self.northRefIcon = new Image(); self.northRefIcon.src = "images/dataflow/refN12.png";
            self.southRefIcon = new Image(); self.southRefIcon.src = "images/dataflow/refS12.png";

            self.eastNewIcon = new Image(); self.eastNewIcon.src = "images/dataflow/portNewE12.png";
            self.westNewIcon = new Image(); self.westNewIcon.src = "images/dataflow/portNewW12.png";
            self.northNewIcon = new Image(); self.northNewIcon.src = "images/dataflow/portNewN12.png";
            self.southNewIcon = new Image(); self.southNewIcon.src = "images/dataflow/portNewS12.png";

            self.eastRefNewIcon = new Image(); self.eastRefNewIcon.src = "images/dataflow/refNewE12.png";
            self.westRefNewIcon = new Image(); self.westRefNewIcon.src = "images/dataflow/refNewW12.png";
            self.northRefNewIcon = new Image(); self.northRefNewIcon.src = "images/dataflow/refNewN12.png";
            self.southRefNewIcon = new Image(); self.southRefNewIcon.src = "images/dataflow/refNewS12.png";

            self.emptyPort = new Image(); self.emptyPort.src = "images/dataflow/emptyPort.png";

            self.handGrab = new Image(); self.handGrab.src = "images/dataflow/handGrab16.png";

            self.flagGreen = new Image(); self.flagGreen.src = "images/dataflow/flagGreen12.png";
            self.flagYellow = new Image(); self.flagYellow.src = "images/dataflow/flagYellow12.png";
            self.quizBlue12 = new Image(); self.quizBlue12.src = "images/dataflow/quizBlue12.png";
            self.questionLiteSmall = new Image(); self.questionLiteSmall.src = "images/dataflow/questionLite12.png";

            self.componentBlue = new Image(); self.componentBlue.src = "images/dataflow/componentBlue12.png";
            self.componentGreen = new Image(); self.componentGreen.src = "images/dataflow/componentGreen12.png";

            self.emojiBlue16 = new Image(); self.emojiBlue16.src = "images/dataflow/emojiBlue16.png";
            self.emojiGreen16 = new Image(); self.emojiGreen16.src = "images/dataflow/emojiGreen16.png";
            self.emojiYellow16 = new Image(); self.emojiYellow16.src = "images/dataflow/emojiYellow16.png";
            self.emojiOrange16 = new Image(); self.emojiOrange16.src = "images/dataflow/emojiOrange16.png";
            self.emojiRed16 = new Image(); self.emojiRed16.src = "images/dataflow/emojiRed16.png";

            self.expand11 = new Image(); self.expand11.src = "images/dataflow/expand11.png";
            self.collapse11 = new Image(); self.collapse11.src = "images/dataflow/collapse11.png";
            self.expand14 = new Image(); self.expand14.src = "images/dataflow/expand14.png";
            self.expand16 = new Image(); self.expand16.src = "images/dataflow/expand16.png";
            self.collapse14 = new Image(); self.collapse14.src = "images/dataflow/collapse14.png";

            self.menu20x16 = new Image(); self.menu20x16.src = "images/toolbar/menu20x16.png";
            self.extendH20 = new Image(); self.extendH20.src = "images/toolbar/extendH201.png";
            self.extendV20 = new Image(); self.extendV20.src = "images/toolbar/extendV201.png";
            self.shrinkH20 = new Image(); self.shrinkH20.src = "images/toolbar/shrinkH201.png";
            self.shrinkV20 = new Image(); self.shrinkV20.src = "images/toolbar/shrinkV201.png";

            self.extendH20dis = new Image(); self.extendH20dis.src = "images/toolbar/extendH20dis.png";
            self.extendV20dis = new Image(); self.extendV20dis.src = "images/toolbar/extendV20dis.png";
            self.shrinkH20dis = new Image(); self.shrinkH20dis.src = "images/toolbar/shrinkH20dis.png";
            self.shrinkV20dis = new Image(); self.shrinkV20dis.src = "images/toolbar/shrinkV20dis.png";

            self.error10 = new Image(); self.error10.src = "images/toolbar/textError10x10.png";
            self.stop12 = new Image(); self.stop12.src = "images/dataflow/stop12.png";

        }
        return new IconLoader();
    }
);