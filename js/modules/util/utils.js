define(
	['modules/graph/graphConstants'],
	function(constants) {

		var INCLUDE_PATTERN = /[a-zA-Z0-9.-_]+/,
			EXCLUDE_PATTERN = /[!@#$%^&*()+=\/\\{}|:'"<>?|; ]/,
			INCLUDE_LABEL_PATTERN = /[a-zA-Z0-9.-_ ]+/,
			EXCLUDE_LABEL_PATTERN = /[!@#$%^&*()+=\/\\{}|:'"<>?|;]/,
			HEX_COLOR_PATTERN = /^#([A-Fa-f0-9]{3}){1,2}$/;

		return {
			getFileExtension: function(fileName) {
				return fileName.split('.').pop();
			},
			getFileNameNoExt: function(filePath) {
				var fName = filePath.split('/').pop(),
					idx = fName.lastIndexOf('.');
				if (idx > 0) {
					return fName.substring(0, idx);
				} else {
					return fName;
				}
			},
			isFSNameValid: function(name) {
				var hasIncludes = INCLUDE_PATTERN.test(name),
					hasExcludes = EXCLUDE_PATTERN.test(name);
				return hasIncludes && !hasExcludes;
			},
			isNewNodeNameValid: function(name, allNames) {
				var hasIncludes = INCLUDE_PATTERN.test(name),
					hasExcludes = EXCLUDE_PATTERN.test(name),
					hasName = false;
				for (var i = 0; i < allNames.length; i++) {
					if (allNames[i]  == name) {
						hasName = true;
						break;
					}
				}
				return hasIncludes && !hasExcludes && !hasName;
			},
			isNewLinkLabelValid: function(label,allLabels) {
				var hasIncludes = INCLUDE_LABEL_PATTERN.test(label),
					hasExcludes = EXCLUDE_LABEL_PATTERN.test(label),
					hasName = false;
				for (var i = 0; i < allLabels.length; i++) {
					if (allLabels[i]  == label) {
						hasName = true;
						break;
					}
				}
				return hasIncludes && !hasExcludes && !hasName;
			},
			isNodeNameValid: function(name) {
				var hasIncludes = INCLUDE_PATTERN.test(name),
					hasExcludes = EXCLUDE_PATTERN.test(name);
				return hasIncludes && !hasExcludes;
			},
			addToNamesMap: function(namesMap, name, flowType) {
				var names = namesMap.get(flowType);
				if (!names) {
					names = [];
					namesMap.put(flowType, names);
				}
				names.push(name);
			},
			addToLabelsMap: function(labelsMap, label, flowType) {
				var labels = labelsMap.get(flowType);
				if (!labels) {
					labels = [];
					labelsMap.put(flowType, labels);
				}
				labels.push(label);
			},
			getAllNames: function(namesMap) {
				var values = namesMap.values(),
					names = [];
				for (var i = 0; i < values.length; i++) {
					names = names.concat(values[i]);
				}
				return names;
			},
			getAllLinkLabels: function(labelsMap) {
				var values = labelsMap.values(),
					labels = [];
				for (var i = 0; i < values.length; i++) {
					labels = labels.concat(values[i]);
				}
				return labels;
			},
			isNodeNameDuplicate: function(name, allNames) {
				for (var i = 0; i < allNames.length; i++) {
					if (allNames[i] == name) {
						return true;
					}
				}
				return false;
			},
			containsFSName: function(files, name) {
				for (var i = 0; i < files.length; i++) {
					var idx = files[i].lastIndexOf('.');
					if (idx > 0) {
						var file = files[i].substring(0, idx);
						if (file === name) {
							return true;
						}
					} else {
						if (files[i] === name) {
							return true;
						}
					}
				}
				return false;
			},
			compareHexColors: function(color1, color2) {
				if (HEX_COLOR_PATTERN.test(color1) && HEX_COLOR_PATTERN.test(color2)) {
					var r1, r2, g1, g2, b1, b2; // strings
					var clr1 = color1.toLowerCase(),
						c1 = clr1.substring(1).split('');
					if (c1.length === 3) {
						r1 = c1[0].concat(c1[0]);
						g1 = c1[1].concat(c1[1]);
						b1 = c1[2].concat(c1[2]);
					} else {
						r1 = c1[0].concat(c1[1]);
						g1 = c1[2].concat(c1[3]);
						b1 = c1[4].concat(c1[5]);
					}
					var clr2 = color2.toLowerCase(),
						c2 = clr2.substring(1).split('');
					if (c2.length === 3) {
						r2 = c2[0].concat(c2[0]);
						g2 = c2[1].concat(c2[1]);
						b2 = c2[2].concat(c2[2]);
					} else {
						r2 = c2[0].concat(c2[1]);
						g2 = c2[2].concat(c2[3]);
						b2 = c2[4].concat(c2[5]);
					}
					return r1 == r2 && g1 == g2 && b1 == b2;
				} else {
					throw ("compareHexColors: bad hex colors: "+color1+" <> "+color2);
				}
			},
			changeHexColor: function(color, percent) {
				if (!HEX_COLOR_PATTERN.test(color)) {
					throw ("getDarkerHexColor: bad hex color: "+color);
				} else  if (Math.abs(percent) > 100) {
					throw ("getDarkerHexColor: percent exceeds: "+percent);
				} else {
					var r, r2, g, g2, b, b2; // numbers
					var clr = color.toLowerCase(),
						arr = clr.substring(1).split('');
					if (arr.length === 3) {
						r = parseInt(arr[0].concat(arr[0]), 16);
						g = parseInt(arr[1].concat(arr[1]), 16);
						b = parseInt(arr[2].concat(arr[2]), 16);
					} else {
						r = parseInt(arr[0].concat(arr[1]), 16);
						g = parseInt(arr[2].concat(arr[3]), 16);
						b = parseInt(arr[4].concat(arr[5]), 16);
					}
					// we need the results to be 2 chars long, like '0A' instead of only 'A'
					r2 = ((1<<8)+Math.max(0, Math.min(255, r + Math.floor(r*percent/100)))).toString(16).substr(1);
					g2 = ((1<<8)+Math.max(0, Math.min(255, g + Math.floor(g*percent/100)))).toString(16).substr(1);
					b2 = ((1<<8)+Math.max(0, Math.min(255, b + Math.floor(b*percent/100)))).toString(16).substr(1);
					return '#' + r2 + g2 + b2;
				}
			}
		}
	}
);
