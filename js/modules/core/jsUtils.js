define(function() {

	return {
		inherit: function(child, parent) {
			child.prototype = Object.create(parent.prototype);
			child.prototype.constructor = child;
		},
		hashCode: function(s) {
			// Convert string to 32bit integer
			var hash = 0,
				len = s.length,
				i, curr;
			if (len === 0) {
				return hash;
			}
			for (i = 0; i < len; i++) {
				curr = s.charCodeAt(i);
				hash = (hash << 5) - hash + curr;
				hash &= hash;
			}
			return hash;
		}
	}

});