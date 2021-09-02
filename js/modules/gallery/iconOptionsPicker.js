define(['modules/graph/graphConstants'],
	function(constants) {

		var EMOJI_BLUE =    "emojiBlue";
		var EMOJI_GREEN =   "emojiGreen";
		var EMOJI_YELLOW =  "emojiYellow";
		var EMOJI_ORANGE =  "emojiOrange";
		var EMOJI_RED =     "emojiRed";
		var FLAG_BLUE =     "flagBlue";
		var FLAG_GREEN =    "flagGreen";
		var FLAG_YELLOW =   "flagYellow";
		var FLAG_RED =      "flagRed";
		var QUIZ_BLUE =     "quizBlue";
		var QUIZ_GREEN =    "quizGreen";
		var QUIZ_YELLOW =   "quizYellow";
		var QUIZ_RED =      "quizRed";

		var _options = [
			{value: EMOJI_BLUE, label: 'Emoji Blue',
				url: 'images/dataflow/emojiBlue16.png', category: constants.nodeCategory().FLOW},
			{value: EMOJI_GREEN, label: 'Emoji Green',
				url: 'images/dataflow/emojiGreen16.png', category: constants.nodeCategory().FLOW},
			{value: EMOJI_YELLOW, label: 'Emoji Yellow',
				url: 'images/dataflow/emojiYellow16.png', category: constants.nodeCategory().FLOW},
			{value: EMOJI_ORANGE, label: 'Emoji Orange',
				url: 'images/dataflow/emojiOrange16.png', category: constants.nodeCategory().FLOW},
			{value: EMOJI_RED, label: 'Emoji Red',
				url: 'images/dataflow/emojiRed16.png', category: constants.nodeCategory().FLOW},

			{value: FLAG_BLUE, label: 'Flag Blue',
				url: 'images/dataflow/flagBlue16.png', category: constants.nodeCategory().FLAG},
			{value: FLAG_GREEN, label: 'Flag Green',
				url: 'images/dataflow/flagGreen16.png', category: constants.nodeCategory().FLAG},
			{value: FLAG_YELLOW, label: 'Flag Yellow',
				url: 'images/dataflow/flagYellow16.png', category: constants.nodeCategory().FLAG},
			{value: FLAG_RED, label: 'Flag Red',
				url: 'images/dataflow/flagRed16.png', category: constants.nodeCategory().FLAG},

			{value: QUIZ_BLUE, label: 'Quiz Blue',
				url: 'images/dataflow/quizBlue12.png', category: constants.nodeCategory().QUIZ},
			{value: QUIZ_GREEN, label: 'Quiz Green',
				url: 'images/dataflow/quizGreen12.png', category: constants.nodeCategory().QUIZ},
			{value: QUIZ_YELLOW, label: 'Quiz Yellow',
				url: 'images/dataflow/quizYellow12.png', category: constants.nodeCategory().QUIZ},
			{value: QUIZ_RED, label: 'Quiz Red',
				url: 'images/dataflow/quizRed12.png', category: constants.nodeCategory().QUIZ}
		];

		var _nodeCategory = constants.nodeCategory().NONE;

		function IconOptionsPicker() {
			var self = this;

			self.emojiBlue = function() { return EMOJI_BLUE; };
			self.emojiGreen = function() { return EMOJI_GREEN; };
			self.emojiYellow = function() { return EMOJI_YELLOW; };
			self.emojiOrange = function() { return EMOJI_ORANGE; };
			self.emojiRed = function() { return EMOJI_RED; };
			self.flagBlue = function() { return FLAG_BLUE; };
			self.flagGreen = function() { return FLAG_GREEN; };
			self.flagYellow = function() { return FLAG_YELLOW; };
			self.flagRed = function() { return FLAG_RED; };
			self.quizBlue = function() { return QUIZ_BLUE; };
			self.quizGreen = function() { return QUIZ_GREEN; };
			self.quizYellow = function() { return QUIZ_YELLOW; };
			self.quizRed = function() { return QUIZ_RED; };

			self.setNodeCategory = function(category) { _nodeCategory = category; };

			self.getNodeIconOptions = function() {
				return _options;
			};

			// need to update the item index with the index for the subgroup
			self.getOptionItems = function(items) {
				var selections = [], idx = 0;
				for (var i = 0; i < items.length; i++) {
					var option = getOptionByValue(items[i].value);
					if (option && option.category === _nodeCategory) {
						items[i].index = idx++;
						selections.push(items[i]);
					}
				}
				return selections;
			};

			function getOptionByValue(value) {
				for (var i = 0; i < _options.length; i++) {
					if (_options[i].value.localeCompare(value) === 0) {
						return _options[i];
					}
				}
				return undefined;
			}

			self.getIconURL = function(value) {
				for (var i = 0; i < _options.length; i++) {
					if (_options[i].value === value) {
						return _options[i].url;
					}
				}
				return null;
			};

			self.getIconLabel = function(value) {
				for (var i = 0; i < _options.length; i++) {
					if (_options[i].value === value) {
						return _options[i].label;
					}
				}
				return null;
			};

			// need to return the index for the subgroup
			self.getIndexValue = function(value, category) {
				var idx = 0;
				for (var i = 0; i < _options.length; i++) {
					if (_options[i].category === category) {
						if (_options[i].value === value) {
							return idx;
						} else {
							idx++;
						}
					}
				}
				return 0;
			};

			self.getIconImage = function(value) {
				var img = new Image();
				img.src = self.getIconURL(value);
				return img;
			};

		}
		return new IconOptionsPicker();
	}
);