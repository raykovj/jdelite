define('modules/common/commonUtils',
	function() {

	return {
		// return all items from array1 that are not found in array2
		subtractArrays: function(array1, array2) {
			var result = [];
			for (var i = 0; i < array1.length; i++) {
				if (array2.indexOf(array1[i]) < 0) {
					result.push(array1[i]);
				}
			}
			return result;
		},
		// IMPORTANT: difference form concat: no duplicates
		mergeArrays: function(array1, array2) {
			var result = array1.slice(0);
			for (var i = 0; i < array2.length; i++) {
				if (result.indexOf(array2[i]) < 0) {
					result.push(array2[i]);
				}
			}
			return result;
		},
		// swap two items
		arraySwap: function(array, idx1, idx2) {
			if (idx1 === idx2) { return false; }
			if (idx1 < 0 || idx1 >= array.length) {
				console.log("!!! ERROR: index1 out of bound: "+idx1+", array length="+array.length);
				return false;
			}
			if (idx2 < 0 || idx2 >= array.length) {
				console.log("!!! ERROR: index2 out of bound: "+idx2+", array length="+array.length);
				return false;
			}
			var tmp = array[idx1];
			array[idx1] = array[idx2];
			array[idx2] = tmp;
			return true;
		},
		printMillis: function(msg) {
			console.log("TIME: "+Date.now()+" | "+msg);
		}
	}

});