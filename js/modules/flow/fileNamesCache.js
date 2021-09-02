define(['modules/graph/graphConstants'],
    function(constants) {

        function FileNamesCache() {
            var self = this;

            var _cache = [],
                _idx = -1;

            self.clear = function() {
                _cache = [];
                _idx = -1;
            };

            self.addFileName = function(name) {
                var i = _cache.indexOf(name);
                if (i < 0) {
                    _cache.push(name);
                    _idx = _cache.length-1;
                } else {
                    _idx = i;
                }
            };

            self.getCurrent = function() {
                if (_cache.length > 0) {
                    return _cache[_idx];
                } else return undefined;
            };

            self.removeFileName = function(name) {
                var i = _cache.indexOf(name);
                if ( i >= 0) {
                    _cache.splice(i, 1);
                    if (i > _cache.length-1) { _idx--; }
                    if (_cache.length === 0) { _idx = -1; }
                }
            };

            self.hasNext = function(){
               return _cache.length > 1 && _idx < _cache.length-1;
            };
            self.getNext = function() {
                if (self.hasNext()) {
                    return _cache[++_idx];
                } else {
                    return undefined;
                }
            };

            self.hasPrevious = function(){
               return _cache.length > 1 && _idx > 0;
            };
            self.getPrevious = function() {
                if (self.hasPrevious()) {
                    return _cache[--_idx];
                } else {
                    return undefined;
                }
            };

            //self.removeCurrentName = function() {
            //    if (_cache.length > 0 && _idx >= 0 && _idx < _cache.length) {
            //        _cache.splice(_idx, 1);
            //    }
            //};

            self.showNamesCache = function() {
                console.log("== NAMES CACHE current: "+_cache[_idx]+", index: "+_idx);
                _cache.forEach(function(name) {
                    console.log(" - "+name);
                });
            };


        }
        return new FileNamesCache();
    }
);