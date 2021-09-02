define(function() {

	// element type
	var ELEMENT_TYPE = { UNDEF: 0, NODE: 1, EDGE: 2, PORT: 4, CONTAINER: 8, NESTED_NODE: 16 };

	// flow direction
	var EDIT_MODE = { EDIT_ALL: 1, VIEW_ONLY: 2};
	var EDIT_MODE_TEXT = { EDIT: "Edit", VIEW: "View Only"};

	// flow direction
	var FLOW = { UNDEF: 0, HORIZONTAL: 1, VERTICAL: 2 };

	var APP_MODE = { FLOW_MODE: 0, PAGE_MODE: 1};
	var APP_TITLES = {
		FLOW_TITLE: "Node Symbols",
		PAGES_TITLE: "Pages",
		BPEL_TITLE: "BPMN Demo",
		K8S_TITLE: "K8s Orchestration"
	};

	var ORIENTATION = {
		N: 1,  	// 0001
		E: 2,	// 0010
		S: 4,	// 0100
		W: 8,	// 1000
		NE: 3,	// 0011
		SE: 6,	// 0110
		SW: 12,	// 1100
		NW: 9	// 1001
	};

	var NODE_SURFACE = { SHADE: 10, FRAME: 8 };

	// initial empty levels/lanes
	var INITIAL = { LEVELS: 6, LANES: 6 };
	var CANVAS_SPINNER_RANGE = { MIN: 1, MAX: 12 };

	var CHANGE = { NONE: 0, DOWN: 1, UP: 2 };

	var B_VALUE = { FALSE: 1, TRUE: 2 };

	// inside gap between cell bounds and the node
	var CELL_GAP = { WIDTH: 10, HEIGHT: 10, CTR_WIDTH: 16, CTR_HEIGHT: 16, CTR_GAP: 10 };

	// distance between adjacent ports
	var PORT_STEP = { MIN: 18, MAX: 24 };
	//var PORT_STEP = { MIN: 30, MAX: 44 };

	var NODE_SIZE = {
		WIDTH: PORT_STEP.MIN * 2 + 28, //8,
		HEIGHT: PORT_STEP.MIN * 2 + 8 //8
	};

	var START_END_SIZE = {
		WIDTH: PORT_STEP.MIN * 2 + 28, //20,
		HEIGHT: PORT_STEP.MIN * 2  // 0
	};

	var DECISION_SIZE = {
		WIDTH: NODE_SIZE.WIDTH + 12, //28,
		HEIGHT: NODE_SIZE.HEIGHT + 12
	};

	var SWITCH_SIZE = {
		//WIDTH: NODE_SIZE.WIDTH,
		WIDTH: NODE_SIZE.HEIGHT+6,
		HEIGHT: NODE_SIZE.HEIGHT
	};

	var ENDPOINT_SIZE = { DIAMETER: 20, WIDTH: 20, HEIGHT: 20 };

	var NODE_MIN_SIZE = {
		//WIDTH: Math.min(PORT_STEP.MIN * 2, NODE_SIZE.WIDTH, START_END_SIZE.WIDTH, DECISION_SIZE.WIDTH),
		WIDTH: Math.min(NODE_SIZE.WIDTH, START_END_SIZE.WIDTH, DECISION_SIZE.WIDTH),
		//HEIGHT: Math.min(PORT_STEP.MIN * 2, NODE_SIZE.HEIGHT, START_END_SIZE.HEIGHT, DECISION_SIZE.HEIGHT)
		HEIGHT: Math.min(NODE_SIZE.HEIGHT, START_END_SIZE.HEIGHT, DECISION_SIZE.HEIGHT)
	};

	var NODE_EXTENSION = { WIDTH: 0, HEIGHT: 0 };

	var FONT = { TEXT: "12px Arial", HEIGHT: 12 };
	var CONTENT_SIZE = { WIDTH: 90, HEIGHT: 40, MAX_LINES: 40 };
	//var CONTENT_SIZE = { WIDTH: 20, HEIGHT: 10 };
	var CONTENT_DECISION_SIZE = { WIDTH: 70, HEIGHT: 40, MAX_LINES: 2 };
	var CONTENT_VIEW_EXT = { WIDTH: 16, HEIGHT: 4 };
	var CONTENT_DECISION_VIEW_EXT = { WIDTH: 28, HEIGHT: 8 };
	var TEXT_LEADING = { HEIGHT: 4 };
	var TEXT_LOCATION = { INSIDE: 0, ABOVE: 1, BELOW: 2 };
	var CONTENT_TEXT_SIZE = { WIDTH: 90, HEIGHT: 100, MAX_LINES: 40 };


	var CORRIDOR_MIN_SIZE = {
		WIDTH: NODE_MIN_SIZE.WIDTH + CELL_GAP.WIDTH * 2,
		HEIGHT: NODE_MIN_SIZE.HEIGHT + CELL_GAP.HEIGHT * 2
	};

	var LEVELS_NUM = { MIN: 1, MAX: 1000 }; // AUTO
	var LANES_NUM = { MIN: 1, MAX: 1000 };  // AUTO

	var SEGMENTS_GAP = { MIN: 8, MAX: 8, EXT: 6 };

	var EMPTY_PIPE_SIZE = { WIDTH: 10, HEIGHT: 10 };

	var PIPE_EXPAND = { ALONG: 0, ACROSS: 0, HORIZONTAL: 0, VERTICAL: 0 };

	var EDGE_OFFSET_LIMIT = { HORIZONTAL: 10, VERTICAL: 10 };

	var MIN_SEGMENTS_SIZE = { WIDTH: 2, HEIGHT: 2 };

	var FLOW_COLORS = {
		//BORDER: 	'#A0DC96', // 160, 220, 150
		BORDER: 	'#c0d3ed',
		GRID: 		'#D7E6D7', // 215, 239, 215
		SIDE_LANES_COLOR: 	'#ECFCFF', // 236, 252, 255
		START_END_COLOR: 	'#F6FFF6', // 235,245,225

		ACCEPT_DROP_COLOR: 	'#E3F5E7', // 227,245,231

		NODE_BGNCOLOR: 		'#e2f7b4',
		NODE_BR_BGNCOLOR: 	'#ffd097', //'#E3F5E7', // 227,245,231
		NODE_SE_BGNCOLOR: 	'#8cf3d2', //'#BFEEDF', // 191, 238, 223
		NODE_SQ_BGNCOLOR: 	'#9ff0fa', //'#DAECFE', // 218, 236, 254
		NODE_IO_BGNCOLOR: 	'#FCF4D0', // 246, 255, 246
		NODE_TM_BGNCOLOR: 	'#8cf3d2', // #bfed56
		NODE_TXT_BGNCOLOR: 	'#FFFFFF',
		GROUP_BGNCOLOR:		'#e0e7f7', //'#bcc2ff',

		//NODE_FORCOLOR_DRK:   '#3673C3', // 54, 115, 195
		NODE_FORCOLOR_DRK:   '#111561', //'#00C', // 54, 115, 195
		NODE_FORCOLOR_WHT:   '#8cf3d2', //'#FFFFFF',

		CONTENT_TEXT: 	'#3673C3',  // 54, 115, 195

		NODE:       '#AABBFF', // 170, 187, 255
		NODE_HLT:   '#8899FF', // 136, 153, 255
		NODE_SEL:   '#0000FF', // 0, 0, 255

		BLOCK:      '#aeb3c6',
		BLOCK_HLT:  '#8c919b',
		BLOCK_SEL:  '#646676',

		BLOCK_OUTLINE:	'#0000CC',

		NODE_D:       '#AABBFF', // 170, 187, 255
		NODE_HLT_D:   '#8899FF', // 136, 153, 255
		NODE_SEL_D:   '#5555AA', // 85, 85, 170
		NODE_D_ENDS:  '#99AAFF', // 153, 170, 255

		EDGE:       '#82AAFA', // 130, 170, 250
		EDGE_LIGHT: '#BFD6FC', // 191, 214, 252
		EDGE_HLT:   '#3673C3', // 54, 115, 195
		EDGE_SEL:   '#0000FF', // 0, 0, 255
		EDGE_LINE:  '#0000FF', // 0, 0, 255
		EDGE_SHADE: '#A2CAFF', // 162, 202, 255
		SGM_DRAGGED:'#FF8F53', // 255, 143, 83
		PIPE_DROP: 	'#C6E6EC', // 198, 230, 236

		DND_ORIGIN:       '#4673C3', // 70, 115, 195
		DND_DESTINATION:  '#92DC8F', // 70, 115, 195
		DND_LINE:         '#0000FF', // 0, 0, 255

		ACCEPT_PORT:    '#0000FF', // 0, 0, 255

		EMPTY_CELL: 	'#f0fafe', //'#E3F5FD', // 227, 245, 253
		EMPTY_CORRIDOR: '#F2FCFF', // 242, 252, 255

		DRAG_BORDER: 	'#0000AA',
		DRAG_FILL: 		'#f1f7d1',

		MENU_ITEM: 		'#D3EEFE' // 211, 238, 254
	};

	var EXPAND_TO_VIEWPORT = {
		NONE:  0,          // no expand
		ACROSS: 1,         // expand only across to viewport
		ALONG:  2,         // expand only along to viewport
		BOTH:   3          // expand in both directions
	};

	/**
	 * Port side defined regardless of flow direction
	 * Note: the LEFT/RIGHT is redefined for FlowType - see LayoutConstants
	 */
	var NODE_SIDE = {
		NONE:  0,         // undefined
		FRONT: 1,         // the side facing the output flow direction, adjacent to next LevelPipe
		BACK:  2,         // the side opposite to FRONT, adjacent to previous LevelPipe if any
		RIGHT: 4,         // the side to the right of FRONT, adjacent to the next LanePipe
		LEFT:  8,         // the side to the left of FRONT, adjacent to the previous LanePipe
		PROCESS_OUT: 13,  // FRONT + LEFT + RIGHT ???
		PROCESS_IN:  14,  // BACK + LEFT + RIGHT  ???
		ANY:   15         // any side
	};

	var LINK_TYPE = {
		NONE: 		0,
		CNX_LINK: 	1,
		REF_LINK: 	2,
		FREE_LINK: 	3
	};

	var LINK_STYLE = {
		DOUBLE_ARROW: 1,
		SINGLE_ARROW: 2
	};

	var PORT_DIRECTION = {
		NONE:     	 	0,    // port without edge ?
		IN:          	1,    // node input (edge target)
		OUT:         	2,    // node output (edge source)
		REF_IN:   		3,    // node reference in (ref edge target)
		REF_OUT:  		4,     // node reference out (ref edge source)
		CNX:			10,    // connection ports limit
		MARK_IN:     	11,    // node markup in (flying edge target)
		MARK_IN_AUX:  	12,    // node markup in (flying edge target)
		MARK_OUT: 		13,     // node markup out (flying edge source)
		MARK_OUT_AUX: 	14     // node markup out (flying edge source)
	};

	var PORT_TYPE = {
		LINK_CNX:  	1, // connection
		LINK_REF:  	2, // reference
		MARKUP: 	3, // markup connection
		REF: 		4, // markup reference
		DUMMY:		5  // place holder
	};

	var PORT_MODE = {
		NONE:  		0,
		STATIC:  	1,
		DYNAMIC: 	2
	};

	var PORT_SHIFT = {
		NONE:  	0,
		DOWN:  -1,
		UP: 	1
	};

	var PORT_LAYOUT = {
		AUTO_ARRANGE:   0,  // step is <side length>/<num of ports + 1>, port positions are evenly spaced
		ALIGN_TOP_LEFT: 1,  // starting from top or left in terms of graphics coordinates, port positions follow by step
		ALIGN_CENTER:   2,  // grouped symmetrically at center, port positions distanced by step
		ALIGN_ON_LANES: 3   // outputs on lanes for switch using an array of shifts
	};

	var PORT_NAMES = {
		IN_PORT_BASE_NAME:		 		"IN-",
		OUT_PORT_BASE_NAME:      		"OUT-",
		MARK_IN_PORT_BASE_NAME:  		"LINK-IN-",
		MARK_IN_AUX_PORT_BASE_NAME: 	"LINK-AUX-IN-",
		MARK_OUT_PORT_BASE_NAME: 		"LINK-OUT-",
		MARK_OUT_AUX_PORT_BASE_NAME:	"LINK-AUX-OUT-",
		REF_IN_PORT_LEFT_NAME:   		"A-IN-L-",
		REF_IN_PORT_RIGHT_NAME:  		"A-IN-R-",
		REF_OUT_PORT_LEFT_NAME:  		"A-OUT-L-",
		REF_OUT_PORT_RIGHT_NAME: 		"A-OUT-R-",

		DUMMY_IN_PORT_NAME:  		"DUMMY-IN-",
		DUMMY_OUT_PORT_NAME: 		"DUMMY-OUT-",
		DUMMY_IN_PORT_LEFT_NAME:   	"DUMMY-IN-L-",
		DUMMY_IN_PORT_RIGHT_NAME:  	"DUMMY-IN-R-",
		DUMMY_OUT_PORT_LEFT_NAME:  	"DUMMY-OUT-L-",
		DUMMY_OUT_PORT_RIGHT_NAME: 	"DUMMY-OUT-R-",

		D_IN:					 	"D-IN-",
		TRUE:					 	"YES",
		FALSE:				 	 	"NO",
		D_TRUE:					 	"OUT-YES",
		D_FALSE:				 	"OUT-NO",
		MARK_D_IN:				 	"LINK-D-IN",
		MARK_D_TRUE:			 	"LINK-OUT-YES",
		MARK_D_FALSE:			 	"LINK-OUT-NO"
	};

	var LAYOUT_MODE = {
		UNDEF:          0,
		MANUAL:         1,
		MANUAL_BACKUP:  2,
		AUTO:           3,
		AUTO_BACKUP:    4
	};

	var FLOW_TYPE = {
		NONE:           0,
		START:          1,
		END:            2,
		PROCESS:        3,
		LEFT_TOP:       4,
		RIGHT_BOTTOM:   5,
		DECISION:       6,
		IN_OUT:         7,
		COMMENT:        8,
		PORT:           11,
		CONTAINER:      12,
		TEXT:           13,
		SWITCH:         14,
		PAGE:           15,
		PAGE_CNX:       16,
		ENDPOINT:       17
	};

	var NODE_GROUP = {
		NONE:   0,
		PROC:   1, // PROCESS
		DEC:    2, // DECISION || SWITCH,
		IO:     3, // IN_OUT
		SE:     4, // START || END,
		SIDE:   5, // LEFT_TOP || RIGHT_BOTTOM
		TERM:   6  // ENDPOINT
	};

	var NODE_CATEGORY = {
		NONE:   0,
		FLOW:   1, // PROCESS || LEFT_TOP || RIGHT_BOTTOM || IN_OUT,
		FLAG:   2, // START || END,
		QUIZ:   3, // DECISION || SWITCH,
		PAGE:   4  // PAGE
	};

	var FLOW_ID = {
		START: "START",
		END: "END",
		PROCESS: "PROCESS",
		LEFT_TOP: "LEFT_TOP",
		RIGHT_BOTTOM: "RIGHT_BOTTOM",
		DECISION: "DECISION",
		IN_OUT: "INOUT",
		COMMENT: "COMMENT",
		PORT: "PORT",
		CONTAINER: "CONTAINER",
		TEXT: "TEXT",
		SWITCH: "SWITCH",
		PAGE: "PAGE",
		PAGE_CNX: "PAGE_CNX",
		ENDPOINT: "ENDPOINT"
	};

	var BLOCK_RESIZE = { NONE: 0, EXTEND_ACROSS: 1, EXTEND_ALONG: 2, SHRINK_ACROSS: 3, SHRINK_ALONG: 4 };

	var DESCRIPTOR_EXTERNAL = {
		NONE: 0,
		LEVEL: 1,
		LANE: 2,
		LEVEL_AND_LANE: 3
	};

	var DECISION_INPUTS = {
		BACK: "BACK",
		LEFT: "LEFT",
		RIGHT: "RIGHT"
	};

	var DECISION_ENDS = {
		UNDEF: "NONE",

		TRUE_FALSE_EMPTY: "TRUE_FALSE_EMPTY",
		FALSE_TRUE_EMPTY: "FALSE_TRUE_EMPTY",

		TRUE_EMPTY_FALSE: "TRUE_EMPTY_FALSE",
		FALSE_EMPTY_TRUE: "FALSE_EMPTY_TRUE",

		EMPTY_TRUE_FALSE: "EMPTY_TRUE_FALSE",
		EMPTY_FALSE_TRUE: "EMPTY_FALSE_TRUE",

		THREE_ENDS: "THREE_ENDS"
	};
	var DECISION_RUN = { NONE: 0, CREATE: 1, EDIT: 2 };

	var PORT_DEF_SIZE = { WIDTH: 12, HEIGHT: 12 };

	var RESULT = {
		NONE:  0,
		OK: 1,
		HAS_FIX:  2,
		RETRY_FIX: 4,
		REDO_LAYOUT:  8,
		FAILED:   16
	};

	var PIPE_TYPE = { UNDEF: 0, LEVEL_PIPE: 1, LANE_PIPE: 2 };
	var PIPE_XING = { UNDEF: 0, SIDE_BOX: 1, CROSS_BOX: 2 };

	var SEGMENT_TYPE = {
		UNDEF: 0,
		NODE_TO_PIPE: 1,
		PIPE_TO_NODE: 2,
		IN_PIPE: 3,
		IN_CORRIDOR: 4
	};

	var SEGMENT_POINTDEF =  {
		UNDEF: 0,
		START: 1,
		END: 2
	};

	var SETTINGS = {
		SWIM_LEVELS: 	    B_VALUE.TRUE,
		SWIM_LANES: 	    B_VALUE.TRUE,
		SHOW_GRID: 		    false,
		AUTO_GEN: 		    true,
		SHOW_REFS: 		    false,
		HIDE_NAMES: 	    false,
		SHOW_NODE_ICONS: 	B_VALUE.TRUE,
		SHOW_LINK_LABELS: 	true,
		ADD_CORRIDORS: 	    true
	};

	var GRID_DEF = {
		NONE: 0,
		LEVEL: 1,
		LANE: 2,
		LEVEL_AND_LANE: 3
	};

	var GRID_DIR = {
		TOP: 0,
		BOTTOM: 1,
		LEFT: 2,
		RIGHT: 3
	};

	var DRAG_MODE = {
		NONE: 0,
		GALLERY: 1,
		NODE: 2,
		NODE_RESIZE: 3,
		PORT: 4,
		SEGMENT: 5,
		LINK_POINT: 6,
		LINK_PORT: 7,
		MARKUP_PORT: 8,
		REF_PORT: 9,
		SELECT: 10
	};

	var DND_MODE = {
		NONE: 0,
		ORIGIN: 1,
		DESTINATION: 2
	};

	var CORNER_TYPE = { SINGLE: 0, PAIR: 1 };

	// draw mode
	var DRAW_MODE = { NO_DRAW: 0, LINE: 1, SEGMENTS: 2, SEGMENT_DRAGGED: 3 };

	// draw state
	var DRAW_STATE = { NONE: 0, FOOTPRINT: 1, IN_LAYOUT: 2, DRAGGED: 3, RESIZED: 4 };

	var SCALE = { DEFAULT: 1, FACTOR: 100, MIN: .85, MAX: 2. };

	var FS_DIALOG_MODE = { NONE: 0, OPEN: 1, SAVE: 2 };
	var FS_SELECTION_MODE = { NONE: 0, TOOLBAR: 1, DIALOG: 2 };
	var FS_FETCH_TYPE = { SHOW: 0, CREATE: 1 };

	var FILE_TYPES = { ALL: "All files", JSON: "*.json" };

	var SELECTIONS = { NONE: 0, NODES: 1, LINKS: 2, LEVELS: 3, LANES: 4 };

	return {
		elementType: function() { return ELEMENT_TYPE; },
		editMode: function() { return EDIT_MODE; },
		editModeText: function() { return EDIT_MODE_TEXT; },
		flow: function() { return FLOW; },
		appMode: function() { return APP_MODE; },
		appTitles: function() { return APP_TITLES; },
		orientation: function() { return ORIENTATION; },
		nodeSurface: function() { return NODE_SURFACE; },
		initial: function() { return INITIAL; },
		canvasRange: function() { return CANVAS_SPINNER_RANGE; },
		change: function() { return CHANGE; },
		bValue: function() { return B_VALUE; },
		cellGap: function() { return CELL_GAP; },
		portStep: function() { return PORT_STEP; },
		nodeSize: function() { return NODE_SIZE; },
		nodeMinSize: function() { return NODE_MIN_SIZE; },
		startEndSize: function() { return START_END_SIZE; },
		nodeSizeExt: function() { return NODE_EXTENSION; },
		endpointSize: function() { return ENDPOINT_SIZE; },
		switchSize: function() { return SWITCH_SIZE; },
		font: function() { return FONT; },
		contentSize: function() { return CONTENT_SIZE; },
		contentDecisionSize: function() { return CONTENT_DECISION_SIZE; },
		contentTextSize: function() { return CONTENT_TEXT_SIZE; },
		contentViewExt: function() { return CONTENT_VIEW_EXT; },
		contentDecisionViewExt: function() { return CONTENT_DECISION_VIEW_EXT; },
		textLeading: function() { return TEXT_LEADING; },
		textLocation: function() { return TEXT_LOCATION; },
		corridorMinSize: function() { return CORRIDOR_MIN_SIZE; },
		levelsRange: function() { return LEVELS_NUM; },
		lanesRange: function() { return LANES_NUM; },
		segmentsGap: function() { return SEGMENTS_GAP; },
		emptyPipeSize: function() { return EMPTY_PIPE_SIZE; },
		pipeExpand: function() { return PIPE_EXPAND; },
		edgeOffsetLimit: function() { return EDGE_OFFSET_LIMIT; },
		minSegmentSize: function() { return MIN_SEGMENTS_SIZE; },
		colors: function() { return FLOW_COLORS; },
		expandToViewport: function() { return EXPAND_TO_VIEWPORT; },
		nodeSide: function() { return NODE_SIDE; },
		linkType: function() { return LINK_TYPE; },
		linkStyle: function() { return LINK_STYLE; },
		portDirection: function() { return PORT_DIRECTION; },
		portType: function() { return PORT_TYPE; },
		portMode: function() { return PORT_MODE; },
		portShift: function() { return PORT_SHIFT; },
		portLayout: function() { return PORT_LAYOUT; },
		portNames: function() { return PORT_NAMES; },
		layoutMode: function() { return LAYOUT_MODE; },
		flowType: function() { return FLOW_TYPE; },
		flowId: function() { return FLOW_ID; },
		nodeGroup : function() { return NODE_GROUP; },
		nodeCategory : function() { return NODE_CATEGORY; },
		blockResize: function() { return BLOCK_RESIZE; },
		externalType: function() { return DESCRIPTOR_EXTERNAL; },
		decisionSize: function() { return DECISION_SIZE; },
		decisionInputs: function() { return DECISION_INPUTS; },
		decisionEnds: function() { return DECISION_ENDS; },
		decisionRun: function() { return DECISION_RUN; },
		portDefSize: function() { return PORT_DEF_SIZE; },
		result: function() { return RESULT; },
		pipeType: function() { return PIPE_TYPE; },
		pipeXing: function() { return PIPE_XING; },
		segmentType: function() { return SEGMENT_TYPE; },
		segmentPointDef: function() { return SEGMENT_POINTDEF; },
		settings: function() { return SETTINGS; },
		gridDef: function() { return GRID_DEF; },
		gridDir: function() { return GRID_DIR; },
		dragMode: function() { return DRAG_MODE; },
		dndMode: function() { return DND_MODE; },
		drawMode: function() { return DRAW_MODE; },
		drawState: function() { return DRAW_STATE; },
		cornerType: function() { return CORNER_TYPE; },
		scale: function() { return SCALE; },
		fsDialogMode: function() { return FS_DIALOG_MODE; },
		fsSelectionMode: function() { return FS_SELECTION_MODE; },
		fsFetchType: function() { return FS_FETCH_TYPE; },
		fileTypes: function() { return FILE_TYPES; },
		selections: function() { return SELECTIONS; },

		getBValue: function(bvalue) {
			if (bvalue === B_VALUE.FALSE || bvalue === B_VALUE.TRUE) {
				return bvalue;
			} else {
				return !bvalue ? B_VALUE.FALSE : B_VALUE.TRUE;
			}
		}
	}

});
