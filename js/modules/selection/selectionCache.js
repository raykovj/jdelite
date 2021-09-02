define('modules/selection/selectionCache',
    ['modules/selection/nodeSelections',
        'modules/common/map'],
    function(NodeSelections,
             Map) {

        function SelectionCache(selMgr) {
            var self = this,
                selectionMgr = selMgr,
                nodeNames = [],
                linkNames = [];

            self.cacheSelections = function(flowModel) {
                self.resetCaches();
                var i, nodes = flowModel.getFlowNodes();
                for (i = 0; i < nodes.length; i++) {
                    if (nodes[i].isSelected()) {
                        nodeNames.push(nodes[i].getName());
                    }
                }
                var links = flowModel.getFlowLinks();
                for (i = 0; i < links.length; i++) {
                    if (links[i].isSelected()) {
                        linkNames.push(links[i].getName());
                    }
                }
            };

            // call when diagram is rebuild
            self.restoreSelections = function(flowModel) {
                var i, j,
                    nodes = flowModel.getFlowNodes(),
                    links = flowModel.getFlowLinks();
                for (i = 0; i < nodes.length; i++) {
                    for (j = 0; j < nodeNames.length; j++) {
                        if (nodes[i].getName() === nodeNames[j]) {
                            selectionMgr.addToSelections(nodes[i]);
                        }
                    }
                }

                for (i = 0; i < links.length; i++) {
                    for (j = 0; j < linkNames.length; j++) {
                        if (links[i].getName() === linkNames[j]) {
                            selectionMgr.addToSelections(links[i]);

                        }
                    }
                }
            };

            self.resetCaches = function() {
                nodeNames = [];
                linkNames = [];
            }

        }
        return SelectionCache;
    }
);
