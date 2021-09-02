define(function () {

    var fileText = {"title": "BankTransaction.json",
        "nodes": [
            {
                "id": 1,
                "name": "S1",
                "type": 1,
                "levelNum": 0,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Start"
            },
            {
                "id": 1,
                "name": "P1",
                "type": 3,
                "levelNum": 1,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Customer requests cash withdrawal"
            },
            {
                "id": 1,
                "name": "P2",
                "type": 3,
                "levelNum": 2,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Teller asks for customer ID"
            },
            {
                "id": 1,
                "name": "D1",
                "type": 6,
                "levelNum": 3,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Valid ID?",
                "decisionEnds": "EMPTY_TRUE_FALSE"
            },
            {
                "id": 1,
                "name": "P3",
                "type": 3,
                "levelNum": 4,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Check customer balance"
            },
            {
                "id": 1,
                "name": "D2",
                "type": 6,
                "levelNum": 5,
                "laneNum": 2,
                "resizeW": 13,
                "resizeH": 7,
                "contentText": "Within the range of bank's policy?",
                "decisionEnds": "FALSE_TRUE_EMPTY"
            },
            {
                "id": 1,
                "name": "P5",
                "type": 3,
                "levelNum": 7,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Cash paid out to customer"
            },
            {
                "id": 1,
                "name": "E1",
                "type": 2,
                "levelNum": 8,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "End"
            },
            {
                "id": 1,
                "name": "IO1",
                "type": 7,
                "levelNum": 6,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Log transaction"
            },
            {
                "id": 1,
                "name": "IO2",
                "type": 7,
                "levelNum": 6,
                "laneNum": 3,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Reject transaction based on invalid credentials\n"
            },
            {
                "id": 1,
                "name": "IO3",
                "type": 7,
                "levelNum": 6,
                "laneNum": 1,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Reject transaction based on insufficient funds"
            },
            {
                "id": 1,
                "name": "L1",
                "type": 4,
                "levelNum": 1,
                "laneNum": 0,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Check if a cash withdrawal is authorized to be executed by teller at this location"
            },
            {
                "id": 1,
                "name": "L2",
                "type": 4,
                "levelNum": 4,
                "laneNum": 0,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Check if customer balance has any pending withdrawals and checks that are not cleared"
            },
            {
                "id": 1,
                "name": "R1",
                "type": 5,
                "levelNum": 2,
                "laneNum": 4,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Driver's license or ID card, bank account #"
            }
        ],
        "links": [
            {
                "id": 2,
                "source": "S1/OUT-0",
                "target": "P1/IN-0",
                "name": "[S1/OUT-0]-[P1/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P1/OUT-0",
                "target": "P2/IN-0",
                "name": "[P1/OUT-0]-[P2/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P2/OUT-0",
                "target": "D1/IN-0",
                "name": "[P2/OUT-0]-[D1/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "D1/OUT-YES",
                "target": "P3/IN-0",
                "name": "[D1/OUT-YES]-[P3/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P3/OUT-0",
                "target": "D2/IN-0",
                "name": "[P3/OUT-0]-[D2/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P5/OUT-0",
                "target": "E1/IN-0",
                "name": "[P5/OUT-0]-[E1/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "IO1/OUT-0",
                "target": "P5/IN-0",
                "name": "[IO1/OUT-0]-[P5/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "D2/OUT-YES",
                "target": "IO1/IN-1",
                "name": "[D2/OUT-YES]-[IO1/IN-1]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "IO2/OUT-0",
                "target": "E1/IN-1",
                "name": "[IO2/OUT-0]-[E1/IN-1]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "IO3/OUT-0",
                "target": "E1/IN-2",
                "name": "[IO3/OUT-0]-[E1/IN-2]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "D1/OUT-NO",
                "target": "IO2/IN-0",
                "name": "[D1/OUT-NO]-[IO2/IN-0]",
                "srcSide": 8,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "D2/OUT-NO",
                "target": "IO3/IN-0",
                "name": "[D2/OUT-NO]-[IO3/IN-0]",
                "srcSide": 4,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "L1/REF-OUT-L-0",
                "target": "P1/REF-IN-R-0",
                "name": "[L1/REF-OUT-L-0]-[P1/REF-IN-R-0]",
                "srcSide": 8,
                "trgSide": 4,
                "type": 2
            },
            {
                "id": 2,
                "source": "L2/REF-OUT-L-0",
                "target": "P3/REF-IN-R-0",
                "name": "[L2/REF-OUT-L-0]-[P3/REF-IN-R-0]",
                "srcSide": 8,
                "trgSide": 4,
                "type": 2
            },
            {
                "id": 2,
                "source": "R1/REF-OUT-R-0",
                "target": "P2/REF-IN-L-0",
                "name": "[R1/REF-OUT-R-0]-[P2/REF-IN-L-0]",
                "srcSide": 4,
                "trgSide": 8,
                "type": 2
            }
        ],
        "settings": {
            "editMode": 1,
            "flowDirection": 2,
            "layoutMode": 1,
            "canvasLevels": 7,
            "canvasLanes": 3,
            "startEndLevels": 2,
            "sideSwimLanes": 2,
            "autoGenNodeNames": true,
            "hideNodeNames": false,
            "showRefHandles": true,
            "linkStyle": 2,
            "processBgnColor": "#6fb57e",
            "processFgnColor": "#FFF",
            "decisionBgnColor": "#e98280",
            "decisionFgnColor": "#FFF",
            "ioBgnColor": "#e7c734",
            "ioFgnColor": "#FFF",
            "seBgnColor": "#57e6d6",
            "seFgnColor": "#FFF",
            "sideBgnColor": "#508cc8",
            "sideFgnColor": "#FFF"
        }
    };

    return {
        getJSONFile: function () {
            return fileText;
        }
    };
});
