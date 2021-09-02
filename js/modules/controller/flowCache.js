define(['modules/graph/graphConstants'],
    function(constants) {

        function FlowCache() {
            var self = this;

            var _selectedFlowType;
            self.getSelectedFlowType = function() { return _selectedFlowType; };
            self.setSelectedFlowType = function(type) { _selectedFlowType = type; };

            var _link;
            self.getLink = function() { return _link; };
            self.setLink = function(link) { _link = link; };

            var _cell;
            self.getCell = function() { return _cell; };
            self.setCell = function(cell) { _cell = cell; };

            var _insert;
            self.isInsert = function() { return _insert; };
            self.setInsert = function(b) { _insert = b; };

            var _nodeLevel;
            self.getNodeLevel = function() { return _nodeLevel; };
            self.setNodeLevel = function(n) { _nodeLevel = n; };

            var _nodeLane;
            self.getNodeLane = function() { return _nodeLane; };
            self.setNodeLane = function(n) { _nodeLane = n; };

            var _pipeLevel;
            self.getPipeLevel = function() { return _pipeLevel; };
            self.setPipeLevel = function(n) { _pipeLevel = n; };

            var _pipeLane;
            self.getPipeLane = function() { return _pipeLane; };
            self.setPipeLane = function(n) { _pipeLane = n; };

            var _isLevels;
            self.isLevels = function() { return _isLevels; };
            self.setIsLevels = function(b) { _isLevels = b; };

            var _isLanes;
            self.isLanes = function() { return _isLanes; };
            self.setIsLanes = function(b) { _isLanes = b; };

            var _levelsValue;
            self.levelsValue = function() { return _levelsValue; };
            self.setLevelsValue = function(c) { _levelsValue = c; };

            var _lanesValue;
            self.lanesValue = function() { return _lanesValue; };
            self.setLanesValue = function(c) { _lanesValue = c; };

            self.clear = function() {
                _selectedFlowType = undefined;
                _link = undefined;
                _cell = undefined;
                _insert = false;
                _nodeLevel = -1;
                _nodeLane = -1;
                _pipeLevel = -1;
                _pipeLane = -1;
                _isLevels = undefined;
                _isLanes = undefined;
                _levelsValue = constants.change().NONE;
                _lanesValue = constants.change().NONE;
            };
        }
        return new FlowCache();
    }
);