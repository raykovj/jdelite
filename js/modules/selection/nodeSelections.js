define('modules/selection/nodeSelections',
    function() {

        // not used, obsolete
        function NodeSelections(node) {
            var self = this,
                theNode = node,
                nodeName = node.getName(),
                nodeFlowType = node.getFlowType(),
                inPortsNames = [],
                outPortsNames = [];

            self.initPortsCache = function() {
                var i, inPorts = theNode.getInputPorts(), outPorts = theNode.getOutputPorts();
                for (i = 0; i < inPorts.length; i++) {
                    if (inPorts[i].isSelected()) {
                        inPortsNames.push(inPorts[i].getName());
                    }
                }
                for (i = 0; i < outPorts.length; i++) {
                    if (outPorts[i].isSelected()) {
                        outPortsNames.push(outPorts[i].getName());
                    }
                }
            };

            self.getCachedNodeSelections = function(node) {
                var selPorts = [];
                if (node && node.getName() === nodeName && node.getFlowType() === nodeFlowType) {
                    var i, cnt = inPortsNames.size();
                    var inPorts = node.getInputPorts();
                    for (i = 0; i < inPorts.length; i++) {
                        if (inPortsNames.indexOf(inPorts[i].getName()) >= 0) {
                            selPorts.push(inPorts[i]);
                        }
                    }
                    var outPorts = node.getOutputPorts();
                    for (i = 0; i < outPorts.length; i++) {
                        if (outPortsNames.indexOf(outPorts[i].getName()) >= 0) {
                            selPorts.push(outPorts[i]);
                        }
                    }
                }
                return selPorts;
            };

            self.initPortsCache();
        }
        return NodeSelections;
    }
);
