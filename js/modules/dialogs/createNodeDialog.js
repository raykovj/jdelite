define(['jquery','knockout',
        'modules/graph/graphConstants',
        'modules/diagram/diagramUtils',
        'modules/settings/config',
        'modules/controller/flowCache'],
    function($, ko,
             constants,
             diagramUtils,
             config,
             flowCache) {

        function CreateNodeDialog() {
            var self = this;
            //console.log("** inside dialogModel: ...");
            //var WIDTH_V = 320, //396,
            //    WIDTH_H = 320, //354,
            var _newNodeNameSelector = $("#newNodeNameId");

            self.initDialog = function(manager) {
                var newDialog = $("#newNodeDialogId");
                newDialog.dialog({
                    autoOpen: false,
                    closeOnEscape: true,
                    width: 300,   //396,   // 354
                    //height: 340,
                    show: {effect: "slideDown",  duration: 200},
                    hide: {effect: 'slideUp', duration: 200},
                    modal: true,
                    resizable: false,
                    title: "Create New Node",
                    // position: {my: "left top", at: "left bottom", of: $("#newId")},
                    position: {my: "right top", at: "right top", of: $("#containerId")},
                    open: function(event, ui) {
                        //$(".ui-dialog-titlebar-close").hide();
                        _newNodeNameSelector.val('');
                        $("#newNodeButtonOK").button("option", "disabled", true);
                        $(this).dialog('option', 'title', getTitle(manager));
                        //$(this).dialog('option', 'width', getWidth());
                        _newNodeNameSelector.blur();
                        _newNodeNameSelector.focus();
                        if ( manager.getCaller().getDecisionRun() === constants.decisionRun().CREATE) {
                            manager.getCaller().resetDecisionIndices();
                        }
                        $("#decision-layout").accordion({
                            heightStyle: "content",
                            active: 0,
                            animate: 200
                        });
                    },
                    buttons: [
                        {
                            id: "newNodeButtonOK",
                            text: "OK",
                            click: function() {
                                self.proceed(manager);
                                $(this).dialog("close");
                                resetDecisionSelection(manager);
                            }
                        },
                        {
                            text: "Cancel",
                            autofocus: true,
                            click: function() {
                                $(this).dialog("close");
                                resetDecisionSelection(manager);
                            }
                        }
                    ]
                });
                $(document).on('click', ".ui-widget-overlay", function(){
                    newDialog.dialog( "close" );
                    resetDecisionSelection(manager);
                });
            };

            self.proceed = function(manager) {
                var controller = manager.getFlowController();
                if (manager.getCaller().getDecisionRun() === constants.decisionRun().CREATE) {
                    var name = manager.getCaller().newNodeNameValue().trim();
                    if (flowCache.getSelectedFlowType() === constants.flowType().DECISION) {
                        controller.addNodeByName(name,
                            manager.getCaller().newDecisionInput(),
                            manager.getCaller().newDecisionEnds());
                    } else {
                        controller.addNodeByName(name);
                    }
                } else if (manager.getCaller().getDecisionRun() === constants.decisionRun().EDIT) {
                    var node = manager.getCaller().getEditedDecisionNode(),
                        newInput = manager.getCaller().newDecisionInput(),
                        newEnds = manager.getCaller().newDecisionEnds();
                    controller.changeNodeDecisionEnds(node, newInput, newEnds);
                }
                manager.refreshDiagramOnEdit();
            };

            function getTitle(manager) {
                if (manager.getCaller().getDecisionRun() === constants.decisionRun().CREATE) {
                    //var type = manager.getFlowController().getSelectedFlowType();
                    var type = flowCache.getSelectedFlowType();
                    var typeName = diagramUtils.getFlowTypeName(type);
                    var name = typeName.replace("_", "/");
                    return "Create New "+name+" Node";
                } else if (manager.getCaller().getDecisionRun() === constants.decisionRun().EDIT) {
                    return "Configure Decision Layout";
                }
            }

            //function getWidth() {
                //return config.getFlowDirection() === constants.flow().VERTICAL ? WIDTH_V : WIDTH_H;
            //}

            function resetDecisionSelection(manager) {
                manager.getCaller().setDecisionRun(constants.decisionRun().NONE);
            }
        }

        return new CreateNodeDialog();

    }
);