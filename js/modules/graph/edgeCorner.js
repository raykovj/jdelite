define('modules/graph/edgeCorner',
    function() {
        function EdgeCorner(point, segment1, segment2) {
            var self = this;
            var _point = point,
                _sgm1 = segment1,
                _sgm2 = segment2;

            self.cornerPoint = function() { return _point; };
            self.firstSegment = function() {return _sgm1; };
            self.secondSegment = function() {return _sgm2; };

        }
        return EdgeCorner;
    }
);