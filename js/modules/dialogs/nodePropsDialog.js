define(['jquery','jqueryui','knockout',
        'modules/gallery/iconOptionsPicker',
        'modules/graph/graphConstants',
        'modules/diagram/diagramUtils',
        'modules/util/utils',
        'modules/settings/config',
        'modules/geometry/point'],
    function($, $$, ko,
             iconPicker,
             constants,
             diagramUtils,
             utils,
             config,
             Point) {

        function NodePropsDialog() {
            var self = this;
            var _manager,
                _editNameElem = document.getElementById('editNodeNameId'),
                _editNameValid,
                _oldName,
                _isHideNodeName,
                _isShowNodeIcon, // boolean
                _showNodeIconSelector = $("#chkShowNodeIconId"),
                _showNodeIconElem = document.getElementById('chkShowNodeIconId'),
                _editContentElem = document.getElementById('editNodeContentId'),
                _oldContent,
                _oldContentAbove,
                _oldContentBelow,
                _currentContent,
                _currentContentAbove,
                _currentContentBelow,
                _newDeltaW, _oldDeltaW,
                _newDeltaH, _oldDeltaH,
                _resetResize = false,
                _oldBgnColor,
                _newBgnColor,
                _oldFgnColor,
                _newFgnColor,
                _bkgnDisplaySltr = $('#nodeBkgnDisplayId'),
                _fgnDisplaySltr = $('#nodeFgnDisplayId'),
                _borderOffColor = "#bbb",
                _borderSelColor = "#00f",
                _contentTextLocation,
                _nodeInputsTableElem = document.getElementById('nodeInputsTableId'),
                _nodeInputsArray = [],
                _nodeInputsArrayChanged,
                _nodeOutputsTableElem = document.getElementById('nodeOutputsTableId'),
                _nodeOutputsArray = [],
                _nodeOutputsArrayChanged,
                _nodeRefInputsTableElem = document.getElementById('nodeRefInputsTableId'),
                _nodeRefInputsArray = [],
                _nodeRefInputsArrayChanged,
                _nodeRefOutputsTableElem = document.getElementById('nodeRefOutputsTableId'),
                _nodeRefOutputsArray = [],
                _nodeRefOutputsArrayChanged,
                _iconPickerSelector = $('#nodeIconItemsId'),
                _oldIconKey,
                _currentIconKey;


            _editNameElem.addEventListener('keyup', function(event) {
                if (_manager) {
                    checkNameValid();
                    checkEnableOK();
                }
            });
            _editContentElem.addEventListener('keyup', function(event) {
                if (_manager) {
                    checkNameValid();
                    //checkEnableOK();
                    if (_editNameValid) {
                        $("#btnTextApplyId").prop('disabled', false);
                        $("#btnTextClearId").prop('disabled', false);
                    }
                }
            });

            ///////
            var _bckGndPickerSelector = $("#nodeBckGndPickId");
            _bckGndPickerSelector.spectrum({
                color: "#fff",
                clickoutFiresChange: false,
                preferredFormat: "hex",
                showInput: true,
                showInitial: true,
                appendTo: "#nodePropsDialogId",
                change: function(color) {
                    // ON CHOOSE
                    var isBkgn = $("#btnNodeBckgndId").prop('checked');
                    if (isBkgn) {
                        _newBgnColor = color.toHexString();
                    } else {
                        _newFgnColor = color.toHexString();
                    }
                    setDispalyColors(isBkgn, _newBgnColor, _newFgnColor);
                    checkNameValid();
                    checkEnableOK();
                }
            });
            $("#nodeColorDefId").click(function() {
                var node = _manager.getCaller().getPropsNode();
                _newBgnColor = node.getDefBgnColor();
                _newFgnColor = node.getDefFgnColor();
                $("#btnNodeBckgndId").prop('checked', true);
                setDispalyColors(true, _newBgnColor, _newFgnColor);
                _bckGndPickerSelector.spectrum(
                    "set", _newBgnColor
                );
                checkNameValid();
                checkEnableOK();
            });

            _bckGndPickerSelector.on("show.spectrum", function() {
                $("#nodePropsDialogId").scrollTop(1000);
                var node = _manager.getCaller().getPropsNode(),
                    isBkgn = $("#btnNodeBckgndId").prop('checked');
                _bckGndPickerSelector.spectrum(
                    // ON SHOW
                    "set", isBkgn ? node.getBgnColor() : node.getFgnColor()
                );
            });

            ////////////

            //$('input:radio[name="nodeFgn"]').on('change', function(event) {
            //    event.currentTarget.
            //    checkNameValid();
            //    checkEnableOK();
            //});
            $('input[id="btnNodeBckgndId"]').on('change', function(event) {
                setDispalyColors(true, _newBgnColor, _newFgnColor);
                _bckGndPickerSelector.spectrum(
                    "set", _newBgnColor
                );
                checkNameValid();
                checkEnableOK();
            });
            $('input[id="btnNodeForgndId"]').on('change', function(event) {
                setDispalyColors(false, _newBgnColor, _newFgnColor);
                _bckGndPickerSelector.spectrum(
                    "set", _newFgnColor
                );
                checkNameValid();
                checkEnableOK();
            });

            //////////

            $('input[id="chkHideNodeNameId"]').on('change', function(event) {
                _isHideNodeName = $(this).prop("checked");
                checkNameValid();
                checkEnableOK();
            });

            $('input[id="chkShowNodeIconId"]').on('change', function(event) {
                _isShowNodeIcon = $(this).prop("checked");
                checkNameValid();
                checkEnableOK();
            });

            $('input:radio[name="nodeText"]').on('click change', function(event) {
                var node = _manager.getCaller().getPropsNode();
                if ($("#btnInsideId").prop('checked')) {
                    _contentTextLocation = constants.textLocation().INSIDE;
                    _editContentElem.value = _currentContent;
                } else if ($("#btnAboveId").prop('checked')) {
                    _contentTextLocation = constants.textLocation().ABOVE;
                    _editContentElem.value = _currentContentAbove;
                } else if ($("#btnBelowId").prop('checked')) {
                    _contentTextLocation = constants.textLocation().BELOW;
                    _editContentElem.value = _currentContentBelow;
                }
                $("#btnTextClearId").prop('disabled', false);
            });

            $("#btnTextApplyId").click(function() {
                if (_contentTextLocation === constants.textLocation().INSIDE) {
                    _currentContent = _editContentElem.value;
                } else if (_contentTextLocation === constants.textLocation().ABOVE) {
                    _currentContentAbove = _editContentElem.value;
                } else if (_contentTextLocation === constants.textLocation().BELOW) {
                    _currentContentBelow = _editContentElem.value;
                }
                checkEnableOK();
                $("#btnTextApplyId").prop('disabled', true);
            });

            $("#btnTextClearId").click(function() {
                _editContentElem.value = "";
                if (_contentTextLocation === constants.textLocation().INSIDE) {
                    _currentContent = "";
                } else if (_contentTextLocation === constants.textLocation().ABOVE) {
                    _currentContentAbove = "";
                } else if (_contentTextLocation === constants.textLocation().BELOW) {
                    _currentContentBelow = "";
                }
                checkEnableOK();
            });


            ///////
            var _nodeSpinnerWidthSelector = $("#spNodeWidthId"),
                _nodeSpinnerHeightSelector = $("#spNodeHeightId");

            _nodeSpinnerWidthSelector.spinner({
                step: 2,
                numberFormat: "n"
            });

            _nodeSpinnerHeightSelector.spinner({
                step: 2,
                numberFormat: "n"
            });

            $("#nodeSizeDefId").click(function() {
                var node = _manager.getCaller().getPropsNode();
                _newDeltaW = 0;
                _newDeltaH = 0;
                _oldDeltaW = 0;
                _oldDeltaH = 0;
                _resetResize = true;
                //_nodeSpinnerWidthSelector.spinner("value", node.getFlowType() !== constants.flowType().DECISION ?
                //    config.getGlobalFlowWidth() : config.getGlobalDecisionWidth());
                //_nodeSpinnerHeightSelector.spinner("value", node.getFlowType() !== constants.flowType().DECISION ?
                //    config.getGlobalFlowHeight() : config.getGlobalDecisionHeight());
                _nodeSpinnerWidthSelector.spinner("value", config.getGlobalNodeWidth(node.getFlowType()));
                _nodeSpinnerHeightSelector.spinner("value", config.getGlobalNodeHeight(node.getFlowType()));
                checkNameValid();
                checkEnableOK();
            });

            //// node inputs
            _nodeInputsTableElem.addEventListener('keyup', function(event) {
                if (_manager) {
                    var idx = _manager.getCaller().getPropsNodeInputsIdx(),
                        value = _manager.getCaller().getPropsNodeInputsValue(),
                        koArr = _manager.getCaller().propsNodeInputs();
                    koArr[idx].label = value;
                    //console.log("*** input keyup: "+idx+", "+value+", name = "+koArr[idx].name);
                    var oldValue = _nodeInputsArray[idx].label;
                    if (!oldValue || oldValue.localeCompare(value) != 0) {
                        checkNameValid(_manager);
                        checkEnableOK();
                        _nodeInputsArrayChanged = true;
                    } else {
                        _nodeInputsArrayChanged = false;
                    }
                }
            });

            //// node outputs
            _nodeOutputsTableElem.addEventListener('keyup', function(event) {
                if (_manager) {
                    var idx = _manager.getCaller().getPropsNodeOutputsIdx(),
                        value = _manager.getCaller().getPropsNodeOutputsValue(),
                        koArr = _manager.getCaller().propsNodeOutputs();
                    koArr[idx].label = value;
                    //console.log("*** output keyup: "+idx+", "+value+", name = "+koArr[idx].name);
                    var oldValue = _nodeOutputsArray[idx].label;
                    if (!oldValue || oldValue.localeCompare(value) != 0) {
                        checkNameValid(_manager);
                        checkEnableOK();
                        _nodeOutputsArrayChanged = true;
                    } else {
                        _nodeOutputsArrayChanged = false;

                    }
                }
            });

            //// node ref inputs
            _nodeRefInputsTableElem.addEventListener('keyup', function(event) {
                if (_manager) {
                    var idx = _manager.getCaller().getPropsNodeRefInputsIdx(),
                        value = _manager.getCaller().getPropsNodeRefInputsValue(),
                        koArr = _manager.getCaller().propsNodeRefInputs();
                    koArr[idx].label = value;
                    //console.log("*** ref in keyup: "+idx+", "+value+", name = "+koArr[idx].name);
                    var oldValue = _nodeRefInputsArray[idx].label;
                    if (!oldValue || oldValue.localeCompare(value) != 0) {
                        checkNameValid(_manager);
                        checkEnableOK();
                        _nodeRefInputsArrayChanged = true;
                    } else {
                        _nodeRefInputsArrayChanged = false;
                    }
                }
            });

            //// node ref outputs
            _nodeRefOutputsTableElem.addEventListener('keyup', function(event) {
                if (_manager) {
                    var idx = _manager.getCaller().getPropsNodeRefOutputsIdx(),
                        value = _manager.getCaller().getPropsNodeRefOutputsValue(),
                        koArr = _manager.getCaller().propsNodeRefOutputs();
                    koArr[idx].label = value;
                    //console.log("*** ref out keyup: "+idx+", "+value+", name = "+koArr[idx].name);
                    var oldValue = _nodeRefOutputsArray[idx].label;
                    if (!oldValue || oldValue.localeCompare(value) != 0) {
                        checkNameValid(_manager);
                        checkEnableOK();
                        _nodeRefOutputsArrayChanged = true;
                    } else {
                        _nodeRefOutputsArrayChanged = false;
                    }
                }
            });

            ///////////////////////
            self.initDialog = function(manager) {
                var propsDialog = $("#nodePropsDialogId"),
                    _canvas = manager.getCaller().getCanvas(),
                    _canvasRect = _canvas.getBoundingClientRect();
                _manager = manager;
                propsDialog.dialog({
                    autoOpen: false,
                    closeOnEscape: true,
                    width: 370,
                    height: 522,
                    show: {effect: "slideDown",  duration: 200},
                    hide: {effect: 'slideUp', duration: 200},
                    modal: true,
                    resizable: false,
                    title: "Node Properties",
                    position: {my: "right top", at: "right top", of: "#topContainerId"},
                    open: function(event, ui) {
                        //$(".ui-dialog-titlebar-close").hide();
                        //$(this).offset({top: node.y+node.height, left: node.x+node.width+200});
                        initControls();
                        $("#buttonOK").button("option", "disabled", true);
                        $(this).dialog('option', 'title', getTitle());
                        disableControls();
                    },
                    buttons: [
                        {
                            id: "buttonOK",
                            text: "OK",
                            click: function() {
                                proceed();
                                $(this).dialog("close");
                            }
                        },
                        {
                            text: "Cancel",
                            autofocus: true,
                            click: function() {
                                $(this).dialog("close");
                                resetControls();
                            }
                        }
                    ]
                });
                $(document).on('click', ".ui-widget-overlay", function(){
                    propsDialog.dialog( "close" );
                    resetControls();
                });

            };

            function disableControls() {
                var blockEdit = !config.isEditMode();

                _editNameElem.disabled = blockEdit;
                _editContentElem.disabled = blockEdit;
                $("#chkHideNodeNameId").prop('disabled', blockEdit);
                //_showNodeIconSelector.prop('disabled', blockEdit || config.hasShowNodeIcons());
                _showNodeIconSelector.prop('disabled', blockEdit);

                if (blockEdit) {
                    $("#nodeBckGndPickId").spectrum("disable");
                } else {
                    $("#nodeBckGndPickId").spectrum("enable");
                }

                $("#btnNodeBckgndId").prop('disabled', blockEdit);
                $("#btnNodeForgndId").prop('disabled', blockEdit);
                $("#nodeColorDefId").prop('disabled', blockEdit);

                $("#spNodeWidthId").spinner("option", "disabled", !config.isEditMode());
                $("#spNodeHeightId").spinner("option", "disabled", !config.isEditMode());
                $("#nodeSizeDefId").prop('disabled', blockEdit);

                $("#btnInsideId").prop('disabled', blockEdit);
                $("#btnAboveId").prop('disabled', blockEdit);
                $("#btnBelowId").prop('disabled', blockEdit);
                $("#btnTextApplyId").prop('disabled', true);
                $("#btnTextClearId").prop('disabled', blockEdit);

                var node = _manager.getCaller().getPropsNode();
                if (node.getFlowType() === constants.flowType().ENDPOINT) {
                    $("#btnInsideId").prop('disabled', true);
                } else if (node.getFlowType() === constants.flowType().CONTAINER ||
                            node.getFlowType() === constants.flowType().SWITCH) {
                    $("#btnInsideId").prop('disabled', true);
                    $("#btnBelowId").prop('disabled', true);
                } else if (node.getFlowType() === constants.flowType().TEXT) {
                    $("#btnAboveId").prop('disabled', true);
                    $("#btnBelowId").prop('disabled', true);
                }
            }

            function getTitle() {
                return "Node Properties: "+_manager.getCaller().getPropsNode().getName();
            }

            function getPosition() {
                var node = _manager.getCaller().getPropsNode();
                return new Point(node.x + node.width, node.y);
            }

            function checkNameValid() {
                if (_manager.getCaller().isEditNameInvalid()) {
                    $("#buttonOK").button("option", "disabled", true);
                    _editNameValid = false;
                } else {
                    _editNameValid = true;
                }
            }

            function checkEnableOK() {
                if (_editNameValid) {
                    $("#buttonOK").button("enable");
                    $("#buttonOK").button("refresh");
                }
            }

            function setDispalyColors(isBkndSelected, newBgnColor, newFgnColor) {
                var node = _manager.getCaller().getPropsNode();
                _bkgnDisplaySltr.css("border-color", isBkndSelected ? _borderSelColor : _borderOffColor);
                _bkgnDisplaySltr.css("background-color", newBgnColor ? newBgnColor : node.getBgnColor());
                _fgnDisplaySltr.css("border-color", isBkndSelected ? _borderOffColor : _borderSelColor);
                _fgnDisplaySltr.css("background-color", newFgnColor ? newFgnColor : node.getFgnColor());
            }

            function initControls() {
                var node = _manager.getCaller().getPropsNode();

                _manager.getCaller().editNameValue(node.getName());
                _oldName = _manager.getCaller().editNameValue(); //node.getName();
                _manager.getCaller().setOldName(node.getName());
                _isHideNodeName = node.isHideName();
                $("#chkHideNodeNameId").prop('checked', _isHideNodeName);

                _isShowNodeIcon = node.isShowIcon();
                _showNodeIconSelector.prop('checked', _isShowNodeIcon);

                if (node.getFlowType() === constants.flowType().ENDPOINT) {
                    $("#btnAboveId").prop('checked', true);
                    $("#btnInsideId").prop('disabled', true);
                    _contentTextLocation = constants.textLocation().ABOVE;
                    _editContentElem.value = node.getContentTextAbove();

                    //$("#btnInsideId").prop('checked', true);
                    //_contentTextLocation = constants.textLocation().INSIDE;
                    //_editContentElem.value = node.getContentText();

                } else if (node.getFlowType() === constants.flowType().CONTAINER ||
                            node.getFlowType() === constants.flowType().SWITCH) {
                    $("#btnAboveId").prop('checked', true);
                    _contentTextLocation = constants.textLocation().ABOVE;
                    _editContentElem.value = node.getContentTextAbove();
                    $("#btnInsideId").prop('disabled', true);
                    $("#btnBelowId").prop('disabled', true);
                } else if (node.getFlowType() === constants.flowType().TEXT) {
                    _contentTextLocation = constants.textLocation().INSIDE;
                    _editContentElem.value = node.getContentText();
                    $("#btnInsideId").prop('checked', true);
                    $("#btnAboveId").prop('disabled', true);
                    $("#btnBelowId").prop('disabled', true);
                } else {
                    $("#btnInsideId").prop('checked', true);
                    _contentTextLocation = constants.textLocation().INSIDE;
                    _editContentElem.value = node.getContentText();
                }
                $("#btnTextApplyId").prop('disabled', true);

                //_editContentElem.value = node.getContentText();
                _oldContent = node.getContentText();
                _oldContentAbove = node.getContentTextAbove();
                _oldContentBelow = node.getContentTextBelow();
                _currentContent = node.getContentText();
                _currentContentAbove = node.getContentTextAbove();
                _currentContentBelow = node.getContentTextBelow();

                _oldBgnColor = node.getBgnColor();
                _oldFgnColor = node.getFgnColor();
                _newBgnColor = node.getBgnColor();
                _newFgnColor = node.getFgnColor();

                $("#btnNodeBckgndId").prop('checked', true);
                setDispalyColors(true);

                _bckGndPickerSelector.spectrum(
                    "set", node.getBgnColor()
                );

                _resetResize = false;
                _newDeltaW = 0;
                _newDeltaH = 0;
                //_oldDeltaW = 2*node.getResizeW();
                //_oldDeltaH = 2*node.getResizeH();

                _nodeSpinnerWidthSelector.spinner("option", "min", config.getGlobalDefaultWidth(node.getFlowType()));
                _nodeSpinnerWidthSelector.spinner("option", "max", 5 * config.getGlobalDefaultWidth(node.getFlowType()));

                _nodeSpinnerHeightSelector.spinner("option", "min", config.getGlobalDefaultHeight(node.getFlowType()));
                _nodeSpinnerHeightSelector.spinner("option", "max", 5 * config.getGlobalDefaultHeight(node.getFlowType()));

                _nodeSpinnerWidthSelector.spinner("value", node.getNodeWidth());
                _nodeSpinnerHeightSelector.spinner("value", node.getNodeHeight());

                _nodeSpinnerWidthSelector.spinner({
                    spin: function(event, ui) {
                        var spW = ui.value,
                            currW = node.getNodeWidth();
                        _newDeltaW = (spW - currW)/2;
                        checkNameValid();
                        checkEnableOK();
                    }
                });

                _nodeSpinnerHeightSelector.spinner({
                    spin: function(event, ui) {
                        var spH = ui.value,
                            currH = node.getNodeHeight();
                        _newDeltaH = (spH - currH)/2;
                        checkNameValid();
                        checkEnableOK();
                    }
                });

                _nodeInputsArray = node.getInputPortsFullNames();
                _nodeOutputsArray = node.getOutputPortsFullNames();
                _nodeRefInputsArray = node.getRefInPortsFullNames();
                _nodeRefOutputsArray = node.getRefOutPortsFullNames();

                $("#nodeInputsTableId").each(function(){
                    var cells = $('td', this);
                    cells.each(function() {
                        $(this).tooltip({
                            content: $(this)[0].innerHTML,
                            position: {
                                my: "left top",
                                at: "left bottom",
                                collision: "flipfit"
                            }
                        });
                    });
                });

                $("#nodeOutputsTableId").each(function(){
                    var cells = $('td', this);
                    cells.each(function() {
                       $(this).tooltip({
                           content: $(this)[0].innerHTML,
                           position: {
                               my: "left top",
                               at: "left bottom",
                               collision: "flipfit"
                           }
                       });
                    });
                });

                $("#nodeRefInputsTableId").each(function(){
                    var cells = $('td', this);
                    cells.each(function() {
                       $(this).tooltip({
                           content: $(this)[0].innerHTML,
                           position: {
                               my: "left top",
                               at: "left bottom",
                               collision: "flipfit"
                           }
                       });
                    });
                });

                $("#nodeRefOutputsTableId").each(function(){
                    var cells = $('td', this);
                    cells.each(function() {
                       $(this).tooltip({
                           content: $(this)[0].innerHTML,
                           position: {
                               my: "left top",
                               at: "left bottom",
                               collision: "flipfit"
                           }
                       });
                    });
                });

                var key = node.getNodeIconKey();
                _oldIconKey = key;
                _currentIconKey = key;
                _iconPickerSelector.iconselectmenu("refreshButtonItem", key, node.getNodeCategory());

                _iconPickerSelector.iconselectmenu({
                    disabled: !config.isEditMode(),
                    change: function( event, ui ) {
                        _currentIconKey = ui.item.value;
                        checkNameValid();
                        checkEnableOK();
                    }
                });

            }

            function proceed() {
                var node = _manager.getCaller().getPropsNode(),
                    newName = _manager.getCaller().editNameValue().trim();

                if (_oldName.localeCompare(newName) != 0 && !_manager.getCaller().isEditNameInvalid()) {
                    _manager.getFlowController().renameNode(node, newName);
                }
                node.setHideName(_isHideNodeName);

                if (_oldIconKey && _oldIconKey.localeCompare(_currentIconKey) != 0 &&
                    !_manager.getCaller().isEditNameInvalid()) {
                    node.setNodeIconKey(_currentIconKey);
                }
                node.setShowIcon(_isShowNodeIcon);

                if (_oldContent.localeCompare(_currentContent) != 0 ||
                    _oldContentAbove.localeCompare(_currentContentAbove) != 0 ||
                    _oldContentBelow.localeCompare(_currentContentBelow) != 0 ) {
                    _manager.getFlowController().modifyContent(
                        node, _currentContent, _currentContentAbove, _currentContentBelow);
                }

                if (_newBgnColor && !utils.compareHexColors(_newBgnColor, _oldBgnColor)) {
                    node.setBgnColor(_newBgnColor);
                }
                if (_newFgnColor && !utils.compareHexColors(_newFgnColor, _oldFgnColor)) {
                    node.setFgnColor(_newFgnColor);
                }

                if (_nodeInputsArrayChanged) {
                    var inArr = _manager.getCaller().propsNodeInputs();
                    node.updateInputPortsLabels(inArr);
                }
                if (_nodeOutputsArrayChanged) {
                    var outArr = _manager.getCaller().propsNodeOutputs();
                    node.updateOutputPortsLabels(outArr);
                }
                if (_nodeRefInputsArrayChanged) {
                    var refInArr = _manager.getCaller().propsNodeRefInputs();
                    node.updateRefInPortsLabels(refInArr);
                }
                if (_nodeRefOutputsArrayChanged) {
                    var refOutArr = _manager.getCaller().propsNodeRefOutputs();
                    node.updateRefOutPortsLabels(refOutArr);
                }

                if (!_resetResize) {
                    //var currW = _newDeltaW ? _newDeltaW : _oldDeltaW,
                    //    currH = _newDeltaH ? _newDeltaH : _oldDeltaH;
                    node.setResize(_newDeltaW, _newDeltaH);
                } else {
                    node.resetResize();
                }

                _manager.getModelHandler().getFlowModel().updateFlowNodes(_manager.getModelHandler().getFlowNodes());
                _manager.setDirty(true);
                _manager.refreshDiagramOnEdit();
            }

            function resetControls() {
                _manager.getCaller().isEditNameInvalid(false);
            }

        }

        return new NodePropsDialog();

    }
);