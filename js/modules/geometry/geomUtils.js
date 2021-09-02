define('modules/geometry/geomUtils',
    ['modules/geometry/rectangle'],
    function(Rectangle) {

        return {
            // check if two lines intersect each other
            areIntersecting: function (s1p1, s1p2, s2p1, s2p2) {
                var s1minX = Math.min(s1p1.x, s1p2.x),
                    s1minY = Math.min(s1p1.y, s1p2.y),
                    s1maxX = Math.max(s1p1.x, s1p2.x),
                    s1maxY = Math.max(s1p1.y, s1p2.y),
                    s2minX = Math.min(s2p1.x, s2p2.x),
                    s2minY = Math.min(s2p1.y, s2p2.y),
                    s2maxX = Math.max(s2p1.x, s2p2.x),
                    s2maxY = Math.max(s2p1.y, s2p2.y);

                if (s1minY === s1maxY && s1minX !== s1maxX) {
                    // s1 is horizontal
                    if (s2minX === s2maxX && s2minY !== s2maxY) {
                        // s2 is vertical
                        if (s2minY > s1minY && s2maxY > s1minY ||
                            s2minY < s1minY && s2maxY  < s1minY) {
                            // both ends of s2 are on same side of s1 vertically
                            return false;
                        } else if (s1minX > s2minX && s1maxX > s2minX ||
                            s1minX < s2minX && s1maxX < s2minX) {
                            // both ends of s1 are on same side of s2 horizontally
                            return false;
                        } else {
                            // x-ing
                            return true;
                        }
                    }
                } else if (s1minX === s1maxX && s1minY !== s1maxY) {
                    // s1 is vertical
                    if (s2minY === s2maxY && s2minX !== s2maxX) {
                        // s2 is horizontal
                        if (s2minX > s1minX && s2maxX > s1minX ||
                            s2minX < s1minX && s2maxX < s1minX) {
                            // both ends of s2 are on same side of s1
                            return false;
                        } else if (s1minY > s2minY && s1maxY > s2minY ||
                            s1minY < s2minY && s1maxY < s2minY) {
                            // both ends of s1 are on same side of s2
                            return false;
                        } else {
                            // x-ing
                            return true;
                        }
                    }
                }
                // either parallel, or in-lined, or non-perpendicular ?
                return false;
            }
            // throws exception for bad constructor Rectangle
            // get the rectangle defined by two points
            //get2PointRectangle: function(p1, p2) {
            //    var minX = Math.min(p1.x, p2.x),
            //        minY = Math.min(p1.y, p2.y),
            //        maxX = Math.max(p1.x, p2.x),
            //        maxY = Math.max(p1.y, p2.y);
            //    return new Rectangle(minX, minY, maxX - minX, maxY - minY);
            //}
        }
    }
);
