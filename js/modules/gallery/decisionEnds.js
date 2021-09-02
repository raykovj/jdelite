define(['jquery',
        'knockout',
        'modules/settings/config',
        'modules/graph/graphConstants'],
    function($, ko,
             config,
             constants) {

        var _inputs = [
            constants.decisionInputs().BACK,
            constants.decisionInputs().LEFT,
            constants.decisionInputs().RIGHT
        ];
        var _ends = [
            constants.decisionEnds().TRUE_FALSE_EMPTY,
            constants.decisionEnds().FALSE_TRUE_EMPTY,
            constants.decisionEnds().TRUE_EMPTY_FALSE,
            constants.decisionEnds().FALSE_EMPTY_TRUE,
            constants.decisionEnds().EMPTY_TRUE_FALSE,
            constants.decisionEnds().EMPTY_FALSE_TRUE
        ];

        var _inputsV = [ {
                id:  constants.decisionInputs().BACK,
                url: 'images/branch/d-VB.png'
            }, {
                id:  constants.decisionInputs().LEFT,
                url: 'images/branch/d-VL.png'
            }, {
                id:  constants.decisionInputs().RIGHT,
                url: 'images/branch/d-VR.png'
            }
        ];
        var _inputsH = [ {
                id:  constants.decisionInputs().BACK,
                url: 'images/branch/d-HB.png'
            }, {
                id:  constants.decisionInputs().LEFT,
                url: 'images/branch/d-HL.png'
            }, {
                id:  constants.decisionInputs().RIGHT,
                url: 'images/branch/d-HR.png'
            }
        ];

        var _itemsVB = [ {
                id: constants.decisionEnds().TRUE_FALSE_EMPTY,
                url: 'images/branch/d-VB-YNE.png'
            }, {
                id: constants.decisionEnds().FALSE_TRUE_EMPTY,
                url: 'images/branch/d-VB-NYE.png'
            }, {
                id: constants.decisionEnds().TRUE_EMPTY_FALSE,
                url: 'images/branch/d-VB-YEN.png'
            }, {
                id: constants.decisionEnds().FALSE_EMPTY_TRUE,
                url: 'images/branch/d-VB-NEY.png'
            }, {
                id: constants.decisionEnds().EMPTY_TRUE_FALSE,
                url: 'images/branch/d-VB-EYN.png'
            }, {
                id: constants.decisionEnds().EMPTY_FALSE_TRUE,
                url: 'images/branch/d-VB-ENY.png'
            }
        ];
        var _itemsVL = [
            //{
            //    id: constants.decisionEnds().TRUE_FALSE_EMPTY,
            //    url: 'images/branch/d-VL-YNE.png'
            //}, {
            //    id: constants.decisionEnds().FALSE_TRUE_EMPTY,
            //    url: 'images/branch/d-VL-NYE.png'
            //}, {
            //    id: constants.decisionEnds().TRUE_EMPTY_FALSE,
            //    url: 'images/branch/d-VL-YEN.png'
            //}, {
            //    id: constants.decisionEnds().FALSE_EMPTY_TRUE,
            //    url: 'images/branch/d-VL-NEY.png'
            //}, {
            //    id: constants.decisionEnds().EMPTY_TRUE_FALSE,
            //    url: 'images/branch/d-VL-EYN.png'
            //}, {
            //    id: constants.decisionEnds().EMPTY_FALSE_TRUE,
            //    url: 'images/branch/d-VL-ENY.png'
            //}
        ];
        var _itemsVR = [
            //{
            //    id: constants.decisionEnds().TRUE_FALSE_EMPTY,
            //    url: 'images/branch/d-VR-YNE.png'
            //}, {
            //    id: constants.decisionEnds().FALSE_TRUE_EMPTY,
            //    url: 'images/branch/d-VR-NYE.png'
            //}, {
            //    id: constants.decisionEnds().TRUE_EMPTY_FALSE,
            //    url: 'images/branch/d-VR-YEN.png'
            //}, {
            //    id: constants.decisionEnds().FALSE_EMPTY_TRUE,
            //    url: 'images/branch/d-VR-NEY.png'
            //}, {
            //    id: constants.decisionEnds().EMPTY_TRUE_FALSE,
            //    url: 'images/branch/d-VR-EYN.png'
            //}, {
            //    id: constants.decisionEnds().EMPTY_FALSE_TRUE,
            //    url: 'images/branch/d-VR-ENY.png'
            //}
        ];

        var _itemsHB = [ {
                id: constants.decisionEnds().TRUE_FALSE_EMPTY,
                url: 'images/branch/d-HB-YNE.png'
            }, {
                id: constants.decisionEnds().FALSE_TRUE_EMPTY,
                url: 'images/branch/d-HB-NYE.png'
            }, {
                id: constants.decisionEnds().TRUE_EMPTY_FALSE,
                url: 'images/branch/d-HB-YEN.png'
            }, {
                id: constants.decisionEnds().FALSE_EMPTY_TRUE,
                url: 'images/branch/d-HB-NEY.png'
            }, {
                id: constants.decisionEnds().EMPTY_TRUE_FALSE,
                url: 'images/branch/d-HB-EYN.png'
            }, {
                id: constants.decisionEnds().EMPTY_FALSE_TRUE,
                url: 'images/branch/d-HB-ENY.png'
            }
        ];
        var _itemsHL = [
            //{
            //    id: constants.decisionEnds().TRUE_FALSE_EMPTY,
            //    url: 'images/branch/d-HL-YNE.png'
            //}, {
            //    id: constants.decisionEnds().FALSE_TRUE_EMPTY,
            //    url: 'images/branch/d-HL-NYE.png'
            //}, {
            //    id: constants.decisionEnds().TRUE_EMPTY_FALSE,
            //    url: 'images/branch/d-HL-YEN.png'
            //}, {
            //    id: constants.decisionEnds().FALSE_EMPTY_TRUE,
            //    url: 'images/branch/d-HL-NEY.png'
            //}, {
            //    id: constants.decisionEnds().EMPTY_TRUE_FALSE,
            //    url: 'images/branch/d-HL-EYN.png'
            //}, {
            //    id: constants.decisionEnds().EMPTY_FALSE_TRUE,
            //    url: 'images/branch/d-HL-ENY.png'
            //}
        ];
        var _itemsHR = [
            //{
            //    id: constants.decisionEnds().TRUE_FALSE_EMPTY,
            //    url: 'images/branch/d-HR-YNE.png'
            //},  {
            //    id: constants.decisionEnds().FALSE_TRUE_EMPTY,
            //    url: 'images/branch/d-HR-NYE.png'
            //}, {
            //    id: constants.decisionEnds().TRUE_EMPTY_FALSE,
            //    url: 'images/branch/d-HR-YEN.png'
            //}, {
            //    id: constants.decisionEnds().FALSE_EMPTY_TRUE,
            //    url: 'images/branch/d-HR-NEY.png'
            //}, {
            //    id: constants.decisionEnds().EMPTY_TRUE_FALSE,
            //    url: 'images/branch/d-HR-EYN.png'
            //}, {
            //    id: constants.decisionEnds().EMPTY_FALSE_TRUE,
            //    url: 'images/branch/d-HR-ENY.png'
            //}
        ];

        var inIdx = 0,
            endsIdx = 0;

        function DecisionEnds() {
            var self = this;

            self.getDecisionIcon = function() {
                if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    return 'images/toolbar/arrow_down24.png';
                } else {
                    return 'images/toolbar/arrow_right24.png';
                }
            };

            /////////////// INPUTS //////////////////////

            self.getCurrentInputPicture = function() {
                var input = _inputs[inIdx];
                if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    return getVInput(input);
                } else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
                    return getHInput(input);
                }
            };

            self.getCurrentDecisionInput = function() {
                return _inputs[inIdx];
            };

            self.setCurrentInput = function(input) {
                for (var i = 0; i < _inputs.length; i++) {
                    if (_inputs[i] === input) {
                        inIdx = i;
                        return;
                    }
                }
                inIdx = 0;
            };

            self.resetCurrentInputIndex = function() {
                inIdx = 0;
            };

            self.moveInputNext = function() {
                if (inIdx < _inputs.length-1) {
                    inIdx++;
                } else {
                    inIdx = 0;
                }
            };

            self.moveInputPrevious = function() {
                if (inIdx > 0) {
                    inIdx--;
                } else {
                    inIdx = _inputs.length-1;
                }
            };

            function getVInput(input) {
                for (var i = 0; i < _inputsV.length; i++) {
                    if (_inputsV[i].id === input) {
                        return _inputsV[i].url;
                    }
                }
                return undefined;
            }

            function getHInput(input) {
                for (var i = 0; i < _inputsH.length; i++) {
                    if (_inputsH[i].id === input) {
                        return _inputsH[i].url;
                    }
                }
                return undefined;
            }

            /////////////// ENDS //////////////////////

            self.getCurrentEndsPicture = function() {
                var input = _inputs[inIdx],
                    end = _ends[endsIdx];
                if (config.getFlowDirection() === constants.flow().VERTICAL) {
                    return getVEnd(input, end);
                } else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
                    return getHEnd(input, end);
                }
            };

            self.getCurrentDecisionEnds = function() {
                return _ends[endsIdx];
            };

            self.setCurrentEnds = function(end) {
                for (var i = 0; i < _ends.length; i++) {
                    if (_ends[i] === end) {
                        endsIdx = i;
                        return;
                    }
                }
                endsIdx = 0;
            };

            self.resetCurrentEndsIndex = function() {
                endsIdx = 0;
            };

            self.moveEndsNext = function() {
                if (endsIdx < _ends.length-1) {
                    endsIdx++;
                } else {
                    endsIdx = 0;
                }
                //console.log("+++ moveEndsNext: "+endsIdx);
            };

            self.moveEndsPrevious = function() {
                if (endsIdx > 0) {
                    endsIdx--;
                } else {
                    endsIdx = _ends.length-1;
                }
                //console.log("+++ moveEndsPrevious: "+endsIdx);
            };

            function getVEnd(input, end) {
                var items;
                if (input === constants.decisionInputs().BACK) {
                    items = _itemsVB;
                } else if (input === constants.decisionInputs().LEFT) {
                    items = _itemsVL;
                } else if (input === constants.decisionInputs().RIGHT) {
                    items = _itemsVR;
                }
                if (items) {
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].id === end) {
                            return items[i].url;
                        }
                    }
                }
                return undefined;
            }

            function getHEnd(input, end) {
                var items;
                if (input === constants.decisionInputs().BACK) {
                    items = _itemsHB;
                } else if (input === constants.decisionInputs().LEFT) {
                    items = _itemsHL;
                } else if (input === constants.decisionInputs().RIGHT) {
                    items = _itemsHR;
                }
                if (items) {
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].id === end) {
                            return items[i].url;
                        }
                    }
                }
                return undefined;
            }

        }
        return new DecisionEnds();
    }
);