define(['modules/settings/config',
        'modules/graph/graphConstants'],
    function(config,
             constants) {

        return {
            initButtons: function(caller) {

                var _spinnerNodeWidthSelector = $("#spinnerNodeWidthId"),
                    _spinnerNodeHeightSelector = $("#spinnerNodeHeightId"),
                    _spinnerSEWidthSelector = $("#spinnerSEWidthId"),
                    _spinnerSEHeightSelector = $("#spinnerSEHeightId"),
                    _spinnerDecisionWidthSelector = $("#spinnerDecisionWidthId"),
                    _spinnerDecisionHeightSelector = $("#spinnerDecisionHeightId");

                ///////////////// DIMENSIONS /////////////////

                //////// FLOW ////////
                _spinnerNodeWidthSelector.spinner({
                    step: 2,
                    min: constants.nodeSize().WIDTH,
                    max: constants.nodeSize().WIDTH * 5,
                    numberFormat: "n",
                    spin: function(event, ui) {
                        config.setGlobalFlowWidth(ui.value);
                    }
                });
                _spinnerNodeWidthSelector.spinner("value", config.getGlobalFlowWidth());

                _spinnerNodeHeightSelector.spinner({
                    step: 2,
                    min: constants.nodeSize().HEIGHT,
                    max: constants.nodeSize().HEIGHT * 5,
                    numberFormat: "n",
                    spin: function(event, ui) {
                        config.setGlobalFlowHeight(ui.value);
                    }
                });
                _spinnerNodeHeightSelector.spinner("value", config.getGlobalFlowHeight());

                //////// START/END ////////
                _spinnerSEWidthSelector.spinner({
                    step: 2,
                    min: constants.startEndSize().WIDTH,
                    max: constants.startEndSize().WIDTH * 5,
                    numberFormat: "n",
                    spin: function(event, ui) {
                        config.setGlobalSEWidth(ui.value);
                    }
                });
                _spinnerSEWidthSelector.spinner("value", config.getGlobalSEWidth());

                _spinnerSEHeightSelector.spinner({
                    step: 2,
                    min: constants.startEndSize().HEIGHT,
                    max: constants.startEndSize().HEIGHT * 5,
                    numberFormat: "n",
                    spin: function(event, ui) {
                        config.setGlobalSEHeight(ui.value);
                    }
                });
                _spinnerSEHeightSelector.spinner("value", config.getGlobalSEHeight());

                ///////// DECISION ///////
                _spinnerDecisionWidthSelector.spinner({
                    step: 2,
                    min: constants.decisionSize().WIDTH,
                    max: constants.decisionSize().WIDTH * 5,
                    numberFormat: "n",
                    spin: function(event, ui) {
                        config.setGlobalDecisionWidth(ui.value);
                    }
                });
                _spinnerDecisionWidthSelector.spinner("value", config.getGlobalDecisionWidth());

                _spinnerDecisionHeightSelector.spinner({
                    step: 2,
                    min: constants.decisionSize().HEIGHT,
                    max: constants.decisionSize().HEIGHT * 5,
                    numberFormat: "n",
                    spin: function(event, ui) {
                        config.setGlobalDecisionHeight(ui.value);
                    }
                });
                _spinnerDecisionHeightSelector.spinner("value", config.getGlobalDecisionHeight());

            }
        }
    }
);