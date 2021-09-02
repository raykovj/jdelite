define('modules/common/map',
	function() {
		function Map() {
			var self = this;
			var _map = {};

			self.clear = function() {
				_map = {};
			};

			self.put = function(key, value) {
				_map[key] = value;
			};

			self.delete = function(key) {
				delete _map[key];
			};

			self.get = function(key) {
				return _map[key];
			};

			self.values = function() {
				var values = [];
				for (var key in _map) {
					if (Object.prototype.hasOwnProperty.call(_map, key)) {
						var val = _map[key];
						values.push(val);
					}
				}
				return values;
			};

			self.keys = function() {
				var keys = [];
				for (var key in _map) {
					if (Object.prototype.hasOwnProperty.call(_map, key)) {
						keys.push(key);
					}
				}
				return keys;
			};

			self.hasEntries = function() {
				return self.keys().length > 0;
			};

			self.print = function() {
				var sb = "";
				for (var key in _map) {
					if (Object.prototype.hasOwnProperty.call(_map, key)) {
						var val = _map[key];
						sb += key +" = "+val.toString()+"\n";
					}
				}
				return sb;
			};
		}
		return Map;
	}
);