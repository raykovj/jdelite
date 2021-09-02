define('modules/flow/flowModel',
    ['modules/diagram/flowNode',
        'modules/diagram/containerBlock',
        'modules/diagram/flowLink',
        'modules/diagram/decisionNode',
        'modules/diagram/flowSwitch',
        'modules/diagram/flowTerminator',
        'modules/diagram/flowText',
        'modules/diagram/diagramUtils',
        'modules/flow/flowUtils',
        'modules/graph/pipeCrossing',
        'modules/graph/graphConstants',
        'modules/dialogs/messageDialog',
        'modules/settings/config'],
    function(FlowNode,
             ContainerBlock,
             FlowLink,
             DecisionNode,
             FlowSwitch,
             FlowTerminator,
             FlowText,
             diagramUtils,
             flowUtils,
             PipeCrossing,
             constants,
             messageDialog,
             config) {

        function FlowModel(manager) {
            var self = this,
                DEBUG = false,
                _flowManager = manager;

            var _nodes = [],
                _links = [],
                _nodeObjects = [],
                _linkObjects = [];

            self.getNodeObjects = function() { return _nodeObjects; };
            self.setNodeObjects = function(objects) { _nodeObjects = objects; };

            self.getLinkObjects = function() { return _linkObjects; };
            self.setLinkObjects = function(objects) { _linkObjects = objects; };

            self.getFlowNodes = function() {
                return _nodes; };
            self.getFlowLinks = function() { return _links; };

            self.updateFlowNodes = function(nodes) {
                _nodes = nodes;
                _nodeObjects = [];
                for (var i = 0; i < nodes.length; i++) {
                    _nodeObjects.push(nodes[i].getNodeObject());
                }
            };

            self.updateFlowLinks = function(links) {
                _links = links;
                _linkObjects = [];
                for (var i = 0; i < links.length; i++) {
                    var linkObj = links[i].getLinkObject();
                    //_linkObjects.push(links[i].getLinkObject());
                    _linkObjects.push(linkObj);
                }
            };

            self.updateSelectedFlowLinks = function(links) {
                for (var i = 0; i < _linkObjects.length; i++) {
                    for (var j = 0; j < links.length; j++) {
                        if (_linkObjects[i].name === links[j].getName()) {
                            //var linkObj = links[j].getLinkObject();
                            //linkObj.order = i;
                            _linkObjects.splice(i, 1, links[j].getLinkObject());
                            //_linkObjects.splice(i, 1, linkObj);
                            break;
                        }
                    }
                }
            };

            self.addNodeObject = function(nodeObj) {
                var containerName = nodeObj.containerName;
                if (containerName) {
                    var containerObj = self.getNodeObjectByName(containerName);
                    if (containerObj) {
                        // TODO!! get innermost container ??
                        var names = containerObj.contentNodes;
                        if (!names) { names = ""; }
                        var namesArr = names.split(',');
                        if (!namesArr.includes(nodeObj.name)) {
                            namesArr.push(nodeObj.name);
                        }
                        if (namesArr[0].length === 0) {
                            namesArr.shift();
                        }
                        containerObj.contentNodes = namesArr.join();

                        var locator = {};
                        locator.name = nodeObj.name;
                        locator.levelShift = nodeObj.levelNum - containerObj.levelNum;
                        locator.laneShift = nodeObj.laneNum - containerObj.laneNum;
                        if (!containerObj.locators) {
                            containerObj.locators = [];
                        }
                        containerObj.locators.push(locator);
                    }
                }

                var order = nodeObj.order;
                if (order > -1) {
                    _nodeObjects.splice(order, 0, nodeObj);
                } else {
                    _nodeObjects.push(nodeObj);
                }
            };

            self.removeNodeObject = function(nodeObj) {
                for (var i = 0; i < _nodeObjects.length; i++) {
                    if (_nodeObjects[i].name === nodeObj.name && _nodeObjects[i].type === nodeObj.type) {
                        var containerName = nodeObj.containerName;
                        if (containerName) {
                            var container = self.getNodeObjectByName(containerName);
                            if (container) {
                                var namesArr = container.contentNodes.split(',');
                                namesArr.splice(namesArr.indexOf(nodeObj.name), 1);
                                container.contentNodes = namesArr.join();

                                var idx = container.locators.findIndex(function(item) {
                                        return item.name === nodeObj.name;
                                    });
                                container.locators.splice(idx, 1);
                            } else {
                                console.log("removeNodeObject: could not find container "+containerName);
                            }
                        }
                        var order = _nodeObjects[i].order;
                        _nodeObjects.splice(i, 1);
                    }
                }
                return -1;
            };


            //self.getNodeByNameAndType = function(name, type) {
            //    for (var i = 0; i < _nodes.length; i++) {
            //        if (_nodes[i].getName() === name && _nodes[i].getFlowType() === type) {
            //            return _nodes[i];
            //        }
            //    }
            //    return undefined;
            //};

            self.getNodeObjectByName = function(name) {
                for (var i = 0; i < _nodeObjects.length; i++) {
                    if (_nodeObjects[i].name === name) {
                        return _nodeObjects[i];
                    }
                }
                return undefined;
            };

            self.renameNodeObject = function(nodeObj, newName) {
                var retVal;
                for (var i = 0; i < _nodeObjects.length; i++) {
                    if (_nodeObjects[i].name === nodeObj.name && _nodeObjects[i].type === nodeObj.type) {
                        for (var j = 0; j < _nodes.length; j++) {
                            if (_nodes[j].getName() === nodeObj.name) {
                                _nodes[j].setName(newName);
                            }
                        }
                        _nodeObjects[i].name = newName;
                        retVal = _nodeObjects[i];
                        break;
                    }
                }
                return retVal;
            };

            self.moveNodeObject = function(nodeObj, levelNum, laneNum) {
                for (var i = 0; i < _nodeObjects.length; i++) {
                    if (_nodeObjects[i].name === nodeObj.name && _nodeObjects[i].type === nodeObj.type) {
                        _nodeObjects[i].levelNum = levelNum;
                        _nodeObjects[i].laneNum = laneNum;
                        var containerName = _nodeObjects[i].containerName;
                        if (containerName) {
                            var containerObj = self.getNodeObjectByName(containerName);
                            if (containerObj) {
                                containerObj.locators.forEach(function(locator) {
                                    if (locator.name === _nodeObjects[i].name) {
                                        locator.levelShift = levelNum - containerObj.levelNum;
                                        locator.laneShift = laneNum - containerObj.laneNum;
                                        return;
                                    }
                                });
                            }
                        }
                        return _nodeObjects[i];
                    }
                }
                return undefined;
            };

            self.resizeContainerOutline = function(containerObj, gridAcross, gridAlong) {
                for (var i = 0; i < _nodeObjects.length; i++) {
                    if (_nodeObjects[i].name === containerObj.name && _nodeObjects[i].type === containerObj.type) {
                        _nodeObjects[i].gridAcross = gridAcross;
                        _nodeObjects[i].gridAlong = gridAlong;
                    }
                }
            };

            self.resizeSwitchOutline = function(switchObj) {
                for (var i = 0; i < _nodeObjects.length; i++) {
                    if (_nodeObjects[i].name === switchObj.name && _nodeObjects[i].type === switchObj.type) {
                        _nodeObjects[i].hooks = switchObj.hooks;
                    }
                }
            };

            self.changeDecisionEnds = function(nodeObj, newInput, newEnds) {
                for (var i = 0; i < _nodeObjects.length; i++) {
                    if (_nodeObjects[i].name === nodeObj.name && _nodeObjects[i].type === nodeObj.type) {
                        _nodeObjects[i].decisionInput = newInput;
                        _nodeObjects[i].decisionEnds = newEnds;
                        break;
                    }
                }
            };

            self.modifyNodeContent = function(nodeObj, text) {
                for (var i = 0; i < _nodeObjects.length; i++) {
                    if (_nodeObjects[i].name === nodeObj.name && _nodeObjects[i].type === nodeObj.type) {
                        _nodeObjects[i].contentText = text;
                        break;
                    }
                }
            };

            self.addLinkObject = function(linkObj) {
                //console.log("****** addLinkObject: order = "+linkObj.order);
                var order = linkObj.order;
                if (order > -1) {
                    _linkObjects.splice(order, 0, linkObj);
                } else {
                    _linkObjects.push(linkObj);
                }
            };
            self.removeLinkObject = function(linkObj) {
                for (var j = 0; j < _links.length; j++) {
                    if (_links[j].getName().localeCompare(linkObj.name) === 0) {
                        _links.splice(j, 1);
                        break;
                    }
                }
                for (var i = 0; i < _linkObjects.length; i++) {
                    if (_linkObjects[i].source === linkObj.source && _linkObjects[i].target === linkObj.target) {
                        var order = _linkObjects[i].order;
                        _linkObjects.splice(i, 1);
                        return order;
                    }
                }
                return -1;
            };

            self.renameLinkObject = function(linkObj, newSrc, newTrg) {
                var retVal;
                for (var i = 0; i < _linkObjects.length; i++) {
                    if (_linkObjects[i].source === linkObj.source && _linkObjects[i].target === linkObj.target) {
                        if (newSrc) {
                            _linkObjects[i].name = _linkObjects[i].name.replace(_linkObjects[i].source, newSrc);
                            _linkObjects[i].source = newSrc;
                        }
                        if (newTrg) {
                            _linkObjects[i].name = _linkObjects[i].name.replace(_linkObjects[i].target, newTrg);
                            _linkObjects[i].target = newTrg;
                        }
                        if (newSrc || newTrg) {
                            retVal = _linkObjects[i];
                        }
                        for (var j = 0; j < _links.length; j++) {

                        }
                        break;
                    }
                }
                return retVal;
            };

            //self.enableIndexProperties = function() {
            //    console.log("+++ enableIndexProperties");
            //    for (var i = 0; i < _linkObjects.length; i++) {
            //        _linkObjects[i].order = i;
            //        console.log("   + order="+_linkObjects[i].order);
            //    }
            //};
            self.setNodeIndexProperty = function(nodeObj) {
                //console.log("+++++++++++++++++++ setNodeIndexProperty: "+nodeObj.name);
                for (var i = 0; i < _nodeObjects.length; i++) {
                    if (_nodeObjects[i].name === nodeObj.name && _nodeObjects[i].type === nodeObj.type) {
                        _nodeObjects[i].order = i;
                        nodeObj.order = i;
                        break;
                    }
                }
            };

            self.setLinkIndexProperty = function(linkObj) {
                //console.log("+++++++++++++++++++ setLinkIndexProperty: "+linkObj.name+", order = "+linkObj.order);
                for (var i = 0; i < _linkObjects.length; i++) {
                    if (_linkObjects[i].source === linkObj.source && _linkObjects[i].target === linkObj.target) {
                        _linkObjects[i].order = i;
                        linkObj.order = i;
                        break;
                    }
                }
            };

            self.removeIndexProperties = function() {
                //console.log("### removeIndexProperties ???????????");
                var i;
                for (i = 0; i < _nodeObjects.length; i++) {
                    //console.log("   - order="+_nodeObjects[i].order);
                    if (_nodeObjects[i].order) {
                        //delete _nodeObjects[i].order;
                    }
                }
                for (i = 0; i < _linkObjects.length; i++) {
                    //console.log("   - linkObject: "+_linkObjects[i].name+", order = "+_linkObjects[i].order);
                    if (_linkObjects[i].order) {
                        //delete _linkObjects[i].order;
                    }
                }
            };

            self.isLevelEmpty = function(levelIdx) {
                for (var i = 0; i < _nodeObjects.length; i++) {
                    if (!config.hasStartEndLevels() &&
                        (_nodeObjects[i].type === constants.flowType().START || _nodeObjects[i].type === constants.flowType().END)) {
                        continue;
                    }
                    if ((_nodeObjects[i].type === constants.flowType().CONTAINER ||
                        _nodeObjects[i].type === constants.flowType().SWITCH)
                        &&
                        levelIdx >= _nodeObjects[i].startLevelNum && levelIdx <= _nodeObjects[i].endLevelNum) {
                        return false;
                    } else if (_nodeObjects[i].levelNum === levelIdx) {
                        return false;
                    }
                }
                return true;
            };

            self.isLaneEmpty = function(laneIdx) {
                for (var i = 0; i < _nodeObjects.length; i++) {
                    if (!config.hasSideSwimLanes() &&
                        (_nodeObjects[i].type === constants.flowType().LEFT_TOP || _nodeObjects[i].type === constants.flowType().RIGHT_BOTTOM)) {
                        continue;
                    }
                    if ((_nodeObjects[i].type === constants.flowType().CONTAINER ||
                        _nodeObjects[i].type === constants.flowType().SWITCH)
                        &&
                        laneIdx >= _nodeObjects[i].startLaneNum && laneIdx <= _nodeObjects[i].endLaneNum) {
                        return false;
                    } else if (_nodeObjects[i].laneNum === laneIdx) {
                        return false;
                    }
                }
                return true;
            };

            /////////////////////////////

            /**
             * build FlowNode & FlowLink classes for diagram layout and rendering
             * to be invoked on open/create/refresh
             * @param content - object based on JSON content
             * @param onOpen - true when file is open
             */
            self.buildFlowModel = function(content, onOpen) {
                //console.log("##### buildFlowModel");
                self.clearFlowModel();
                if (content && content.nodes) {
                    var t1 = Date.now();
                    //console.log("-- MODEL:  start ");
                    parseContentNodes(content.nodes, onOpen);
                    var t2 = Date.now();
                    //console.log("-- MODEL:  nodes = "+(t2-t1));
                    updateContainerNodes();
                    updateSwitchNodes();
                    if (content.links) {
                        parseContentLinks(content.links, onOpen);
                    }
                    var t3 = Date.now();
                    //console.log("-- MODEL:  links = "+(t3-t2));
                }
            };

            //var printNodes = function(msg, nodes) {
            //    var list = [];
            //    for (var i = 0; i < nodes.length; i++) {
            //        if (nodes[i].getName() === ("L1") )
            //            list.push("\n\t"+nodes[i].printNode());
            //    }
            //    console.log("printNodes ("+msg+"): "+list);
            //};

            // nodeObjects -> nodes
            function parseContentNodes(nodes, onOpen) {
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i],
                        nodeName = node.name,
                        iconKey = node.iconKey,
                        //type = diagramUtils.getFlowType(node.type),
                        type = node.type,
                        decisionInput = node.decisionInput,
                        decisionEnds = node.decisionEnds,
                        width,
                        height,
                        resizeW,
                        resizeH,
                        theNode,
                        cnxInPorts = node.cnxInPorts,
                        cnxOutPorts = node.cnxOutPorts,
                        refInPorts = node.refInPorts,
                        refOutPorts = node.refOutPorts;

                    if (type === constants.flowType().DECISION || type === constants.flowType().SWITCH) {
                        width = node.width;
                        height = node.height;
                        resizeW = node.resizeW;
                        resizeH = node.resizeH;
                    } else {
                        width = node.contentText ?
                            node.width : (!_flowManager.getCaller().hasFlowDirectionChange() ? node.width : node.height);
                        height = node.contentText ?
                            node.height : (!_flowManager.getCaller().hasFlowDirectionChange() ? node.height : node.width);
                        resizeW = node.contentText ?
                            node.resizeW : (!_flowManager.getCaller().hasFlowDirectionChange() ? node.resizeW : node.resizeH);
                        resizeH = node.contentText ?
                            node.resizeH : (!_flowManager.getCaller().hasFlowDirectionChange() ? node.resizeH : node.resizeW);

                        width = width ? width : config.getGlobalDefaultWidth(type);
                        height = height ? height :config.getGlobalDefaultHeight(type);
                    }

                    if (type === constants.flowType().NONE) {
                        messageDialog.showMessage('Error', 'node '+nodeName+" has invalid type: "+node.type);
                        continue;
                    } else if (type === constants.flowType().CONTAINER) {
                        theNode = new ContainerBlock(nodeName, _flowManager);
                    } else if (type === constants.flowType().SWITCH) {
                        theNode = new FlowSwitch(nodeName, _flowManager);
                    } else if (type === constants.flowType().DECISION) {
                        theNode = new DecisionNode(nodeName, decisionInput, decisionEnds, _flowManager);
                    } else if (type === constants.flowType().TEXT) {
                        theNode = new FlowText(nodeName, _flowManager);
                    } else if (type === constants.flowType().ENDPOINT) {
                        theNode = new FlowTerminator(nodeName, _flowManager);
                    } else {
                        theNode = new FlowNode(nodeName, type, _flowManager);
                    }
                    theNode.setVisible(isNodeAcceptedForLayout(theNode));
                    theNode.setLevelNumber(node.levelNum);
                    theNode.setLaneNumber(node.laneNum);
                    theNode.setNodeIconKey(iconKey);
                    theNode.setHideName(node.hideName ? node.hideName : false);
                    theNode.setShowIcon(node.showIcon);
                    theNode.setContainerName(node.containerName);
                    theNode.setContentText(node.contentText ? node.contentText : "");
                    theNode.setContentTextAbove(node.textAbove ? node.textAbove : "");
                    theNode.setContentTextBelow(node.textBelow ? node.textBelow : "");

                    if (width) { theNode.setWidth(width); }
                    if (height) { theNode.setHeight(height); }

                    if (resizeW) { theNode.setResizeW(resizeW); }
                    if (resizeH) { theNode.setResizeH(resizeH); }

                    if (type === constants.flowType().DECISION) {
                        theNode.setDecisionInitialSize(width, height);
                    } else if (type === constants.flowType().SWITCH) {
                        theNode.setSwitchInitialSize(width, height);
                    } else {
                        theNode.setInitialSize(width, height);
                    }

                    if (type === constants.flowType().CONTAINER) {
                        if (node.contentNodes) {
                            theNode.setNodeNames(node.contentNodes.split(','));
                        }
                        theNode.setExpanded(node.expanded);
                        theNode.setGridAlong(node.gridAlong);
                        theNode.setGridAcross(node.gridAcross);
                        theNode.setContentLocators(node.locators);
                        theNode.setStartLevelNumber(node.startLevelNum);
                        theNode.setEndLevelNumber(node.endLevelNum);
                        theNode.setStartLaneNumber(node.startLaneNum);
                        theNode.setEndLaneNumber(node.endLaneNum);
                    }

                    if (type === constants.flowType().SWITCH) {
                        // TODO
                        theNode.setHooksNumber(node.hooks);
                        //theNode.setStartLevelNumber(node.startLevelNum);
                        //theNode.setEndLevelNumber(node.endLevelNum);
                        //theNode.setStartLaneNumber(node.startLaneNum);
                        //theNode.setEndLaneNumber(node.endLaneNum);
                    }

                    if (node.bgnColor) {
                        theNode.setBgnColor(node.bgnColor);
                    }
                    if (node.fgnColor) {
                        theNode.setFgnColor(node.fgnColor);
                    }

                    if (cnxInPorts) {
                        theNode.loadCnxInPortsMap(cnxInPorts);
                    }
                    if (cnxOutPorts) {
                        theNode.loadCnxOutPortsMap(cnxOutPorts);
                    }
                    if (refInPorts) {
                        theNode.loadRefInPortsMap(refInPorts);
                    }
                    if (refOutPorts) {
                        theNode.loadRefOutPortsMap(refOutPorts);
                    }

                    if (DEBUG)
                        console.log("+++ NODE: "+theNode.print1());
                    addNode(theNode);
                }
            }

            function updateContainerNodes() {
                var theNodes = self.getFlowNodes();
                for (var i = 0; i < theNodes.length; i++) {
                    if (theNodes[i].getFlowType() === constants.flowType().CONTAINER) {
                        var contentNames = theNodes[i].getNodeNames();
                        for (var j = 0; j < contentNames.length; j++) {
                            var node = flowUtils.getNodeByName(self, contentNames[j]);
                            if (node) {
                                node.setContainerReference(theNodes[i]); // most likely already set, except first time
                                theNodes[i].addContentNode(node);
                            }
                        }
                        theNodes[i].setInitialBounds();
                    }
                }
            }

            function updateSwitchNodes() {
                var theNodes = self.getFlowNodes();
                for (var i = 0; i < theNodes.length; i++) {
                    if (theNodes[i].getFlowType() === constants.flowType().SWITCH) {
                        theNodes[i].setInitialBounds();
                    }
                }
            }

            // linkObjects -> links
            function parseContentLinks(links, onOpen) {
                // use nodes that have been just parsed
                var flowNodes = self.getFlowNodes();
                for (var i = 0; i < links.length; i++) {
                    var link = links[i],
                        srcDel = link.source.indexOf("/"),
                        srcNodeName = link.source.slice(0, srcDel).trim(),
                        srcPortName = link.source.slice(srcDel+1).trim(),
                        srcSide = link.srcSide,
                        drawColor = link.drawColor ? link.drawColor : constants.colors().EDGE,
                        trgDel = link.target.indexOf("/"),
                        trgNodeName = link.target.slice(0, trgDel).trim(),
                        trgPortName = link.target.slice(trgDel+1).trim(),
                        trgSide = link.trgSide,
                        linkType = link.type,
                        linkLabel = link.label,
                        linkOrder = link.order,
                        srcPortOrder = link.srcPortOrder,
                        trgPortOrder = link.trgPortOrder,
                        segmentShifts = link.segmentShifts,
                        forcedCorners = link.corners;

                    if (hasDuplicateLinks(srcNodeName, srcPortName, trgNodeName, trgPortName)) {
                        //console.log("*** DUPLICATE LINK: ["+link.source+"]-["+link.target+"], skipped");
                        messageDialog.showMessage('Error', "DUPLICATE LINK: ["+link.source+"]-["+link.target+"], skipped");
                        continue;
                    }
                    var j, srcNode = undefined, trgNode = undefined;
                    for (j = 0; j < flowNodes.length; j++) {
                        if (flowNodes[j].getName() === srcNodeName) {
                            srcNode = flowNodes[j];
                            break;
                        }
                    }
                    for (j = 0; j < flowNodes.length; j++) {
                        if (flowNodes[j].getName() === trgNodeName) {
                            trgNode = flowNodes[j];
                            break;
                        }
                    }
                    //////
                    if (srcNode && trgNode) {
                        var theLink = new FlowLink("");
                        if (onOpen) {
                            theLink.setOrder(i);
                        } else {
                            theLink.setOrder(linkOrder);
                        }
                        srcSide = getLinkSourceSide(srcNode, trgNode, srcSide, linkType);
                        trgSide = getLinkTargetSide(srcNode, trgNode, trgSide, linkType);
                        theLink.setSourceShift(link.srcShift ? link.srcShift : 0);
                        theLink.setTargetShift(link.trgShift ? link.trgShift : 0);
                        theLink.setPipesOnly(link.pipesOnly);
                        var srcPort, dummy,
                            portType = linkType === constants.linkType().REF_LINK ?
                            constants.portType().LINK_REF : constants.portType().LINK_CNX;
                        if (srcNode.isDecisionNode()) {
                            if (srcPortName.indexOf(constants.portNames().TRUE) > 0) {
                                srcSide = diagramUtils.getDecisionTruePortSide(srcNode);
                            } else if (srcPortName.indexOf(constants.portNames().FALSE) > 0) {
                                srcSide = diagramUtils.getDecisionFalsePortSide(srcNode);
                            }
                            srcPort = srcNode.createOutputPort(srcPortName, srcSide, portType);
                        } else {
                            if (link.srcShift === constants.portShift().UP) {
                                dummy = srcNode.createOutputPort(undefined, srcSide, constants.portType().DUMMY);
                                srcPort = srcNode.createOutputPort(srcPortName, srcSide, portType);
                                dummy.setDummyParentName(srcPort.getName());
                                if (DEBUG)
                                    console.log("$$$$ SOURCE PORT UP: "+link.name+", shift="+link.srcShift+
                                    ", order="+srcPort.getOrder()+", dummy="+dummy.getOrder());
                            } else if (link.srcShift === constants.portShift().DOWN) {
                                srcPort = srcNode.createOutputPort(srcPortName, srcSide, portType);
                                dummy = srcNode.createOutputPort(undefined, srcSide, constants.portType().DUMMY);
                                dummy.setDummyParentName(srcPort.getName());
                                if (DEBUG)
                                    console.log("$$$$ SOURCE PORT DOWN: "+link.name+", shift="+link.srcShift+
                                    ", order="+srcPort.getOrder()+", dummy="+dummy.getOrder());
                            }
                            //else {
                                srcPort = srcNode.createOutputPort(srcPortName, srcSide, portType);
                                srcPort.setPortLabel(portType === constants.portType().LINK_CNX ?
                                    srcNode.getCnxOutPortsMap().get(srcPortName) :
                                    srcNode.getRefOutPortsMap().get(srcPortName));
                            //}
                        }
                        if (srcPort) {
                            srcPort.setInverse(checkForSourceInverse(srcNode, srcSide));
                            if (srcPortOrder && srcPortOrder >= 0) {
                                srcPort.setOrder(srcPortOrder);
                            }
                            theLink.setSourcePort(srcPort);
                            theLink.setSourceSide(srcSide);
                        }
                        var trgPort;
                        if (link.trgShift === constants.portShift().UP) {
                            if (!trgNode.isDecisionNode()) {
                                dummy = trgNode.createInputPort(undefined, trgSide, constants.portType().DUMMY);
                            }
                            trgPort = trgNode.createInputPort(trgPortName, trgSide, portType);
                            if (dummy) {
                                dummy.setDummyParentName(trgPort.getName());
                            }
                            if (DEBUG)
                                console.log("$$$$ TARGET PORT UP: "+link.name);
                        } else if (link.trgShift === constants.portShift().DOWN) {
                            trgPort = trgNode.createInputPort(trgPortName, trgSide, portType);
                            if (!trgNode.isDecisionNode()) {
                                dummy = trgNode.createInputPort(undefined, trgSide, constants.portType().DUMMY);
                                dummy.setDummyParentName(trgPort.getName());
                            }
                            if (DEBUG)
                                console.log("$$$$ TARGET PORT DOWN: "+link.name);
                        }
                        //else {
                            trgPort = trgNode.createInputPort(trgPortName, trgSide, portType);
                            trgPort.setPortLabel(portType === constants.portType().LINK_CNX ?
                                trgNode.getCnxInPortsMap().get(trgPortName) :
                                trgNode.getRefInPortsMap().get(trgPortName));
                        //}

                        if (trgPort) {
                            trgPort.setInverse(checkForTargetInverse(trgNode, trgSide));
                            if (trgPortOrder && trgPortOrder >= 0) {
                                trgPort.setOrder(trgPortOrder);
                            }
                            theLink.setTargetPort(trgPort);
                            theLink.setTargetSide(trgSide);
                        }
                        theLink.setType(linkType === constants.linkType().REF_LINK ?
                            constants.linkType().REF_LINK : constants.linkType().CNX_LINK);
                        //if (segmentShifts && !forcedCorners) {
                        //if (segmentShifts) {
                        //    for (var k = 0; k < segmentShifts.length; k++) {
                        //        theLink.setSegmentShift(segmentShifts[k].order, segmentShifts[k].pipeShift);
                        //    }
                        //}
                        theLink.setLinkLabel(linkLabel);
                        if (drawColor) {
                            theLink.setDrawColor(drawColor);
                        }
                        if (forcedCorners) {
                            for (var kk = 0; kk < forcedCorners.length; kk++) {
                                theLink.setForcedCrossing(
                                    new PipeCrossing(forcedCorners[kk].levelPipeOrder, forcedCorners[kk].lanePipeOrder), _flowManager.getFlowLayout());
                            }
                        }
                        if (segmentShifts) {
                            //console.log("MODEL segment shifts: "+segmentShifts.length);
                            for (var k = 0; k < segmentShifts.length; k++) {
                                //console.log("\t- shift: "+segmentShifts[k].order+", "+segmentShifts[k].pipeShift);
                                theLink.setSegmentShift(segmentShifts[k].order, segmentShifts[k].pipeShift);
                            }
                        }
                        if (theLink.isValid()) {
                            if (DEBUG)
                                console.log("+++ LINK: "+theLink.print());
                            addLink(theLink);
                        }
                    }
                }
            }

            //function updateInputWidths() {
            //    var theNodes = self.getFlowNodes();
            //    for (var i = 0; i < theNodes.length; i++) {
            //        if (theNodes[i].getFlowType() === constants.flowType().DECISION) {
            //            theNodes[i].setInputBounds();
            //        }
            //    }
            //}

            function checkForSourceInverse(node, side) {
                if (node.getFlowType() === constants.flowType().PROCESS ||
                    node.getFlowType() === constants.flowType().CONTAINER ||
                    node.getFlowType() === constants.flowType().SWITCH ||
                    node.getFlowType() === constants.flowType().IN_OUT) {
                    if (node.getPreferredOutputSide() === constants.nodeSide().FRONT &&
                        side === constants.nodeSide().BACK) {
                        return true;
                    }
                }
                return false;
            }

            function checkForTargetInverse(node, side) {
                if (node.getFlowType() === constants.flowType().PROCESS ||
                    node.getFlowType() === constants.flowType().CONTAINER ||
                    node.getFlowType() === constants.flowType().SWITCH ||
                    node.getFlowType() === constants.flowType().IN_OUT) {
                    if (node.getPreferredInputSide() === constants.nodeSide().BACK &&
                            side === constants.nodeSide().FRONT) {
                        return true;
                    }
                }
                return false;
            }

            function getLinkSourceSide(srcNode, trgNode, parsedSrcSide, linkType, direction) {
                if (linkType === constants.linkType().CNX_LINK) {
                    if (parsedSrcSide) {
                        if (srcNode.getFlowType() === constants.flowType().START ||
                            srcNode.getFlowType() === constants.flowType().END ||
                            srcNode.getFlowType() === constants.flowType().LEFT_TOP ||
                            srcNode.getFlowType() === constants.flowType().RIGHT_BOTTOM) {
                            return srcNode.getPreferredOutputSide();
                        } else {
                            return parsedSrcSide;
                        }
                    }
                } else if (linkType === constants.linkType().REF_LINK) {
                    if (srcNode.getFlowType() === constants.flowType().START ||
                        srcNode.getFlowType() === constants.flowType().END ||
                        srcNode.getFlowType() === constants.flowType().LEFT_TOP ||
                        srcNode.getFlowType() === constants.flowType().RIGHT_BOTTOM) {
                        return srcNode.getPreferredOutputSide();
                    } else if (srcNode.getFlowType() === constants.flowType().PROCESS ||
                        srcNode.getFlowType() === constants.flowType().CONTAINER ||
                        srcNode.getFlowType() === constants.flowType().SWITCH ||
                        srcNode.getFlowType() === constants.flowType().TEXT ||
                        srcNode.getFlowType() === constants.flowType().IN_OUT) {
                        if (srcNode.getLaneNumber() < trgNode.getLaneNumber()) {
                            return config.getFlowDirection() === constants.flow().VERTICAL ?
                                constants.nodeSide().LEFT : constants.nodeSide().RIGHT;
                        } else if (srcNode.getLaneNumber() > trgNode.getLaneNumber()) {
                            return config.getFlowDirection() === constants.flow().VERTICAL ?
                                constants.nodeSide().RIGHT : constants.nodeSide().LEFT;
                        } else if (parsedSrcSide) { // same lane
                            if (//direction === currDirection &&
                                !_flowManager.getCaller().hasFlowDirectionChange()) {
                                return parsedSrcSide;
                            } else {
                                if (parsedSrcSide === constants.nodeSide().LEFT) {
                                    return constants.nodeSide().RIGHT;
                                } else if (parsedSrcSide === constants.nodeSide().RIGHT) {
                                    return constants.nodeSide().LEFT;
                                }
                            }
                        }
                    }
                }
                return parsedSrcSide ? parsedSrcSide : srcNode.getPreferredOutputSide();
            }

            function getLinkTargetSide(srcNode, trgNode, parsedTrgSide, linkType, direction) {
                if (linkType === constants.linkType().CNX_LINK) {
                    if (parsedTrgSide) {
                        if (trgNode.getFlowType() === constants.flowType().START ||
                            trgNode.getFlowType() === constants.flowType().END ||
                            trgNode.getFlowType() === constants.flowType().LEFT_TOP ||
                            trgNode.getFlowType() === constants.flowType().RIGHT_BOTTOM) {
                            return trgNode.getPreferredInputSide();
                        } else if (trgNode.getFlowType() === constants.flowType().DECISION) {
                            return diagramUtils.getDecisionInputSide(trgNode.getInput());
                        } else {
                            return parsedTrgSide;
                        }
                    }
                } else if (linkType === constants.linkType().REF_LINK) { // no decision node support
                    if (trgNode.getFlowType() === constants.flowType().START ||
                        trgNode.getFlowType() === constants.flowType().END ||
                        trgNode.getFlowType() === constants.flowType().LEFT_TOP ||
                        trgNode.getFlowType() === constants.flowType().RIGHT_BOTTOM) {
                        return trgNode.getPreferredOutputSide();
                    } else if (trgNode.getFlowType() === constants.flowType().PROCESS ||
                        trgNode.getFlowType() === constants.flowType().CONTAINER ||
                        trgNode.getFlowType() === constants.flowType().SWITCH ||
                        trgNode.getFlowType() === constants.flowType().TEXT ||
                        trgNode.getFlowType() === constants.flowType().IN_OUT) {
                        if (trgNode.getLaneNumber() < srcNode.getLaneNumber()) {
                            return config.getFlowDirection() === constants.flow().VERTICAL ?
                                constants.nodeSide().LEFT : constants.nodeSide().RIGHT;
                        } else if (trgNode.getLaneNumber() > srcNode.getLaneNumber()) {
                            return config.getFlowDirection() === constants.flow().VERTICAL ?
                                constants.nodeSide().RIGHT : constants.nodeSide().LEFT;
                        } else if (parsedTrgSide) { // same lane
                            if (//direction === currDirection &&
                                !_flowManager.getCaller().hasFlowDirectionChange()) {
                                return parsedTrgSide;
                            } else {
                                if (parsedTrgSide === constants.nodeSide().LEFT) {
                                    return constants.nodeSide().RIGHT;
                                } else if (parsedTrgSide === constants.nodeSide().RIGHT) {
                                    return constants.nodeSide().LEFT;
                                }
                            }
                        }
                    }
                }
                return parsedTrgSide ? parsedTrgSide : trgNode.getPreferredInputSide();
            }

            function isNodeAcceptedForLayout(node) {
                if (node.getFlowType() === constants.flowType().LEFT_TOP ||
                        node.getFlowType() === constants.flowType().RIGHT_BOTTOM) {
                    return config.hasSideSwimLanes();
                }
                if (node.getFlowType() === constants.flowType().START ||
                        node.getFlowType() === constants.flowType().END) {
                    return config.hasStartEndLevels();
                }
                return true;
            }

            function hasDuplicateLinks(sourceNodeName, sourcePortName, targetNodeName, targetPortName) {
                for (var i = 0; i < _linkObjects.length; i++) {
                    var link = _linkObjects[i];

                    var srcDel = link.source.indexOf("/");
                    var srcNodeName = link.source.slice(0, srcDel).trim();
                    var srcPortName = link.source.slice(srcDel+1).trim();

                    var trgDel = link.target.indexOf("/");
                    var trgNodeName = link.target.slice(0, trgDel).trim();
                    var trgPortName = link.target.slice(trgDel+1).trim();

                    if (srcNodeName === sourceNodeName && srcPortName === sourcePortName ||
                        trgNodeName === targetNodeName && trgPortName === targetPortName) {
                        return true;
                    }
                }
                return false;
            }

            self.clearFlowModel = function() {
                _nodes = [];
                _links = [];
                _nodeObjects = [];
                _linkObjects = [];
            };

            function addNode(node) {
                if (!containsNode(node)) {
                    _nodes.push(node);
                    _nodeObjects.push(node.getNodeObject());
                }
            }

            function addLink(link) {
                if (!containsLink(link)) {
                    _links.push(link);
                    _linkObjects.push(link.getLinkObject());
                }
            }

            function containsNode(node) {
                for (var i = 0; i < _nodes.length; i++) {
                    if (_nodes[i].equals(node)) {
                        return true;
                    }
                }
                return false;
            }

            function containsLink(link) {
                for (var i = 0; i < _links.length; i++) {
                    if (_links[i].equals(link)) {
                        return true;
                    }
                }
                return false;
            }

        }
        return FlowModel;
    }
);
