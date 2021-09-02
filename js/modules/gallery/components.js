define(['modules/settings/config',
		'modules/graph/graphConstants'],
	function(config,
			 constants) {

		var toolTip = "Drag to canvas";
		////////////////
		var drawNodesV = [
			{id: constants.flowType().START, label: 'Start', url: 'images/dataflow/startV24.png', title: toolTip},
			{id: constants.flowType().PROCESS, label: 'Process', url: 'images/dataflow/processV24.png', title: toolTip},
			{id: constants.flowType().DECISION, label: 'Decision', url: 'images/branch/diamond24.png', title: toolTip},
			{id: constants.flowType().SWITCH, label: 'Switch', url: 'images/branch/switchV24.png', title: toolTip},
			{id: constants.flowType().IN_OUT, label: 'Input/Output', url: 'images/dataflow/skew24.png', title: toolTip},
			{id: constants.flowType().LEFT_TOP, label: 'Left Lane', url: 'images/dataflow/swimLeftV24.png', title: toolTip},
			{id: constants.flowType().RIGHT_BOTTOM, label: 'Right Lane', url: 'images/dataflow/swimRightV24.png', title: toolTip},
			{id: constants.flowType().END, label: 'End', url: 'images/dataflow/endV24.png', title: toolTip},
			{id: constants.flowType().ENDPOINT, label: 'Endpoint', url: 'images/dataflow/terminator24-14.png', title: toolTip},
			{id: constants.flowType().CONTAINER, label: 'Container Block', url: 'images/dataflow/blockV24.png', title: toolTip},
			{id: constants.flowType().TEXT, label: 'Text', url: 'images/dataflow/text24.png', title: toolTip}
		];

		var seNodesV = [
			{id: constants.flowType().START, label: 'Start', url: 'images/dataflow/startV24.png', title: toolTip},
			{id: constants.flowType().END, label: 'End', url: 'images/dataflow/endV24.png', title: toolTip}
		];
		var flowNodesV = [
			{id: constants.flowType().PROCESS, label: 'Process', url: 'images/dataflow/processV24.png', title: toolTip},
			{id: constants.flowType().IN_OUT, label: 'Input/Output', url: 'images/dataflow/skew24.png', title: toolTip},
			{id: constants.flowType().LEFT_TOP, label: 'Left Lane', url: 'images/dataflow/swimLeftV24.png', title: toolTip},
			{id: constants.flowType().RIGHT_BOTTOM, label: 'Right Lane', url: 'images/dataflow/swimRightV24.png', title: toolTip}
		];
		var quizNodesV = [
			{id: constants.flowType().DECISION, label: 'Decision', url: 'images/branch/diamond24.png', title: toolTip}
			//{id: constants.flowType().SWITCH, label: 'Switch', url: 'images/branch/switchV24.png', title: toolTip}
		];
		var miscNodesV = [
			{id: constants.flowType().CONTAINER, label: 'Container Block', url: 'images/dataflow/blockV24.png', title: toolTip},
			{id: constants.flowType().ENDPOINT, label: 'Endpoint', url: 'images/dataflow/terminator24-14.png', title: toolTip},
			{id: constants.flowType().TEXT, label: 'Text', url: 'images/dataflow/text24.png', title: toolTip}
		];

		///////////////
		var drawNodesH = [
			{id: constants.flowType().START, label: 'Start', url: 'images/dataflow/startH24.png', title: toolTip},
			{id: constants.flowType().PROCESS, label: 'Process', url: 'images/dataflow/processH24.png', title: toolTip},
			{id: constants.flowType().DECISION, label: 'Decision', url: 'images/branch/diamond24.png', title: toolTip},
			{id: constants.flowType().SWITCH, label: 'Switch', url: 'images/branch/switchH24.png', title: toolTip},
			{id: constants.flowType().IN_OUT, label: 'Input/Output', url: 'images/dataflow/skew24.png', title: toolTip},
			{id: constants.flowType().LEFT_TOP, label: 'Top Lane', url: 'images/dataflow/swimTopH24.png', title: toolTip},
			{id: constants.flowType().RIGHT_BOTTOM, label: 'Bottom Lane', url: 'images/dataflow/swimBottomH24.png', title: toolTip},
			{id: constants.flowType().END, label: 'End', url: 'images/dataflow/endH24.png', title: toolTip},
			{id: constants.flowType().ENDPOINT, label: 'Endpoint', url: 'images/dataflow/terminator24-14.png', title: toolTip},
			{id: constants.flowType().CONTAINER, label: 'Container Block', url: 'images/dataflow/blockH24.png', title: toolTip},
			{id: constants.flowType().TEXT, label: 'Text', url: 'images/dataflow/text24.png', title: toolTip}
		];

		var seNodesH = [
			{id: constants.flowType().START, label: 'Start', url: 'images/dataflow/startH24.png', title: toolTip},
			{id: constants.flowType().END, label: 'End', url: 'images/dataflow/endH24.png', title: toolTip}
		];
		var flowNodesH = [
			{id: constants.flowType().PROCESS, label: 'Process', url: 'images/dataflow/processH24.png', title: toolTip},
			{id: constants.flowType().IN_OUT, label: 'Input/Output', url: 'images/dataflow/skew24.png', title: toolTip},
			{id: constants.flowType().LEFT_TOP, label: 'Top Lane', url: 'images/dataflow/swimTopH24.png', title: toolTip},
			{id: constants.flowType().RIGHT_BOTTOM, label: 'Bottom Lane', url: 'images/dataflow/swimBottomH24.png', title: toolTip}
		];
		var quizNodesH = [
			{id: constants.flowType().DECISION, label: 'Decision', url: 'images/branch/diamond24.png', title: toolTip}
		];
		var miscNodesH = [
			{id: constants.flowType().CONTAINER, label: 'Container Block', url: 'images/dataflow/blockH24.png', title: toolTip},
			{id: constants.flowType().ENDPOINT, label: 'Endpoint', url: 'images/dataflow/terminator24-14.png', title: toolTip},
			{id: constants.flowType().TEXT, label: 'Text', url: 'images/dataflow/text24.png', title: toolTip}
		];

		////////////////
		var drawPagesV = [
			{id: constants.flowType().PAGE, label: 'Flow Page', url: 'images/dataflow/pageV24.png', title: toolTip}
		];
		var drawPagesH = [
			{id: constants.flowType().PAGE, label: 'Flow Page', url: 'images/dataflow/pageH24.png', title: toolTip}
		];


		function Components() {
			var self = this;

			self.getSENodesV = function() { return seNodesV; };
			self.getFlowNodesV = function() { return flowNodesV; };
			self.getQuizNodesV = function() { return quizNodesV; };
			self.getMiscNodesV = function() { return miscNodesV; };

			self.getSENodesH = function() { return seNodesH; };
			self.getFlowNodesH = function() { return flowNodesH; };
			self.getQuizNodesH = function() { return quizNodesH; };
			self.getMiscNodesH = function() { return miscNodesH; };

			self.getVNodes = function() {
				var nodes = [];
				for (var i = 0; i < drawNodesV.length; i++) {
					var node = drawNodesV[i];
					//if (!config.hasSideSwimLanes() &&
					//		(node.id === constants.flowType().LEFT_TOP || node.id === constants.flowType().RIGHT_BOTTOM)) {
					//	continue;
					//}
					nodes.push(node);
				}
				return nodes;
			};

			self.getHNodes = function() {
				var nodes = [];
				for (var i = 0; i < drawNodesH.length; i++) {
					var node = drawNodesH[i];
					//if (!config.hasSideSwimLanes() &&
					//		(node.id === constants.flowType().LEFT_TOP || node.id === constants.flowType().RIGHT_BOTTOM)) {
					//	continue;
					//}
					nodes.push(node);
				}
				return nodes;
			};

			self.getVPageItems = function() {
				var nodes = [];
				for (var i = 0; i < drawPagesV.length; i++) {
					var node = drawPagesV[i];
					//if (!config.hasPageMode() && (node.id === constants.flowType().PAGE)) {
					//	continue;
					//}
					nodes.push(node);
				}
				return nodes;
			};

			self.getHPageItems = function() {
				var nodes = [];
				for (var i = 0; i < drawPagesH.length; i++) {
					var node = drawPagesH[i];
					//if (!config.hasPageMode() && (node.id === constants.flowType().PAGE)) {
					//	continue;
					//}
					nodes.push(node);
				}
				return nodes;
			};

		}
		return new Components();
	}
);