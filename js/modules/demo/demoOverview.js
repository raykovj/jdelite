define(function () {

    var fileText = {
        "title": "FlowDemo.json",
        "nodes": [
            {
                "id": 1,
                "name": "Start",
                "type": 1,
                "levelNum": 0,
                "laneNum": 1,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Start"
            },
            {
                "id": 1,
                "name": "N1",
                "type": 3,
                "levelNum": 1,
                "laneNum": 1,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Process 1"
            },
            {
                "id": 1,
                "name": "N2",
                "type": 3,
                "levelNum": 2,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Process 2"
            },
            {
                "id": 1,
                "name": "N3",
                "type": 3,
                "levelNum": 2,
                "laneNum": 1,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Process 3"
            },
            {
                "id": 1,
                "name": "E1",
                "type": 2,
                "levelNum": 6,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "End"
            },
            {
                "id": 1,
                "name": "D1",
                "type": 6,
                "levelNum": 3,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Valid?",
                "decisionEnds": "FALSE_EMPTY_TRUE"
            },
            {
                "id": 1,
                "name": "D2",
                "type": 6,
                "levelNum": 5,
                "laneNum": 1,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Ready?",
                "decisionEnds": "TRUE_FALSE_EMPTY"
            },
            {
                "id": 1,
                "name": "D3",
                "type": 6,
                "levelNum": 4,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Accepted?",
                "decisionEnds": "TRUE_FALSE_EMPTY"
            },
            {
                "id": 1,
                "name": "P1",
                "type": 3,
                "levelNum": 3,
                "laneNum": 1,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Process 4"
            },
            {
                "id": 1,
                "name": "L1",
                "type": 4,
                "levelNum": 1,
                "laneNum": 0,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Data Set 1"
            },
            {
                "id": 1,
                "name": "L2",
                "type": 4,
                "levelNum": 2,
                "laneNum": 0,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Data Set 3"
            },
            {
                "id": 1,
                "name": "L3",
                "type": 4,
                "levelNum": 3,
                "laneNum": 0,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Data Set 4"
            },
            {
                "id": 1,
                "name": "R1",
                "type": 5,
                "levelNum": 2,
                "laneNum": 3,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Data Set 2"
            }
        ],
        "links": [
            {
                "id": 2,
                "source": "Start/OUT-0",
                "target": "N1/IN-0",
                "name": "[Start/OUT-0]-[N1/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "N1/OUT-3",
                "target": "N2/IN-2",
                "name": "[N1/OUT-3]-[N2/IN-2]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "N1/OUT-2",
                "target": "N3/IN-2",
                "name": "[N1/OUT-2]-[N3/IN-2]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "N1/OUT-1",
                "target": "N2/IN-1",
                "name": "[N1/OUT-1]-[N2/IN-1]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "N1/OUT-0",
                "target": "N2/IN-0",
                "name": "[N1/OUT-0]-[N2/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "N3/OUT-0",
                "target": "D1/D-IN",
                "name": "[N3/OUT-0]-[D1/D-IN]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "D1/OUT-YES",
                "target": "E1/IN-0",
                "name": "[D1/OUT-YES]-[E1/IN-0]",
                "srcSide": 8,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "N2/OUT-0",
                "target": "D3/D-IN",
                "name": "[N2/OUT-0]-[D3/D-IN]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "D3/OUT-YES",
                "target": "D2/D-IN",
                "name": "[D3/OUT-YES]-[D2/D-IN]",
                "srcSide": 4,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "D2/OUT-YES",
                "target": "P1/IN-0",
                "name": "[D2/OUT-YES]-[P1/IN-0]",
                "srcSide": 4,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P1/LINK-OUT",
                "target": "E1/IN-1",
                "name": "[P1/LINK-OUT]-[E1/IN-1]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "N2/LINK-OUT",
                "target": "E1/IN-2",
                "name": "[N2/LINK-OUT]-[E1/IN-2]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "D1/OUT-NO",
                "target": "N3/IN-1",
                "name": "[D1/OUT-NO]-[N3/IN-1]",
                "srcSide": 4,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "D3/OUT-NO",
                "target": "N1/IN-1",
                "name": "[D3/OUT-NO]-[N1/IN-1]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "D2/OUT-NO",
                "target": "N1/IN-2",
                "name": "[D2/OUT-NO]-[N1/IN-2]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "N3/OUT-1",
                "target": "P1/IN-1",
                "name": "[N3/OUT-1]-[P1/IN-1]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "N3/REF-OUT-R0",
                "target": "N2/REF-IN-L0",
                "name": "[N3/REF-OUT-R0]-[N2/REF-IN-L0]",
                "srcSide": 8,
                "trgSide": 4,
                "type": 2
            },
            {
                "id": 2,
                "source": "P1/OUT-0",
                "target": "N3/IN-0",
                "name": "[P1/OUT-0]-[N3/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "L1/REF-OUT-L-0",
                "target": "N1/REF-IN-R-0",
                "name": "[L1/REF-OUT-L-0]-[N1/REF-IN-R-0]",
                "srcSide": 8,
                "trgSide": 4,
                "type": 2
            },
            {
                "id": 2,
                "source": "L2/REF-OUT-L-0",
                "target": "N3/REF-IN-R-0",
                "name": "[L2/REF-OUT-L-0]-[N3/REF-IN-R-0]",
                "srcSide": 8,
                "trgSide": 4,
                "type": 2
            },
            {
                "id": 2,
                "source": "L3/REF-OUT-L-0",
                "target": "P1/REF-IN-R-0",
                "name": "[L3/REF-OUT-L-0]-[P1/REF-IN-R-0]",
                "srcSide": 8,
                "trgSide": 4,
                "type": 2
            },
            {
                "id": 2,
                "source": "R1/REF-OUT-R-0",
                "target": "N2/REF-IN-L-0",
                "name": "[R1/REF-OUT-R-0]-[N2/REF-IN-L-0]",
                "srcSide": 4,
                "trgSide": 8,
                "type": 2
            }
        ],
        "settings": {
            "editMode": 1,
            "flowDirection": 2,
            "layoutMode": 1,
            "canvasLevels": 5,
            "canvasLanes": 2,
            "startEndLevels": 2,
            "sideSwimLanes": 2,
            "autoGenNodeNames": true,
            "hideNodeNames": false,
            "showRefHandles": true,
            "linkStyle": 2,
            "processBgnColor": "#47cf65",
            "processFgnColor": "#FFF",
            "decisionBgnColor": "#e6978d",
            "decisionFgnColor": "#FFF",
            "seBgnColor": "#bad343",
            "seFgnColor": "#FFF",
            "sideBgnColor": "#68a5e2",
            "sideFgnColor": "#FFF"
        }
    };

    return {
        getJSONFile: function () {
            return fileText;
        }
    };
});
