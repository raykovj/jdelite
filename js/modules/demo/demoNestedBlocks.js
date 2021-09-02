define(function () {

    var fileText = {"title": "NestedBlocks.json",
        "nodes": [
            {
                "id": 1,
                "name": "CIRCUM",
                "hideName": false,
                "type": 3,
                "levelNum": 1,
                "laneNum": 3,
                "width": 90,
                "height": 44,
                "resizeW": 13,
                "resizeH": 0,
                "bgnColor": "#bbf1eb",
                "fgnColor": "#00C"
            },
            {
                "id": 1,
                "name": "APUD",
                "hideName": false,
                "type": 3,
                "levelNum": 1,
                "laneNum": 1,
                "width": 90,
                "height": 44,
                "resizeW": 13,
                "resizeH": 0,
                "bgnColor": "#bbf1eb",
                "fgnColor": "#00C"
            },
            {
                "id": 1,
                "name": "CITRA",
                "hideName": false,
                "type": 3,
                "levelNum": 1,
                "laneNum": 2,
                "width": 90,
                "height": 44,
                "resizeW": 13,
                "resizeH": 0,
                "bgnColor": "#bbf1eb",
                "fgnColor": "#00C"
            },
            {
                "id": 1,
                "name": "A1",
                "hideName": false,
                "type": 13,
                "levelNum": 2,
                "laneNum": 5,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "unus erat toto naturae vultus in orbe,\nquem dixere chaos"
            },
            {
                "id": 1,
                "name": "B1",
                "hideName": false,
                "type": 12,
                "levelNum": 2,
                "laneNum": 2,
                "expanded": true,
                "contentNodes": "B2,B3,B4,B5,B6",
                "gridAcross": 4,
                "gridAlong": 3,
                "locators": [
                    {
                        "name": "B2",
                        "levelShift": 0,
                        "laneShift": -1
                    },
                    {
                        "name": "B3",
                        "levelShift": 0,
                        "laneShift": 0
                    },
                    {
                        "name": "B4",
                        "levelShift": 0,
                        "laneShift": 1
                    },
                    {
                        "name": "B5",
                        "levelShift": 0,
                        "laneShift": -2
                    },
                    {
                        "name": "B6",
                        "levelShift": 0,
                        "laneShift": 2
                    }
                ],
                "startLevelNum": 2,
                "endLevelNum": 5,
                "startLaneNum": 0,
                "endLaneNum": 4,
                "resizeW": 0,
                "resizeH": 0
            },
            {
                "id": 1,
                "name": "B2",
                "hideName": false,
                "type": 12,
                "levelNum": 2,
                "laneNum": 1,
                "expanded": true,
                "contentNodes": "P14,P15,T1,T4",
                "containerName": "B1",
                "gridAcross": 0,
                "gridAlong": 3,
                "locators": [
                    {
                        "name": "P14",
                        "levelShift": 1,
                        "laneShift": 0
                    },
                    {
                        "name": "P15",
                        "levelShift": 2,
                        "laneShift": 0
                    },
                    {
                        "name": "T1",
                        "levelShift": 0,
                        "laneShift": 0
                    },
                    {
                        "name": "T4",
                        "levelShift": 3,
                        "laneShift": 0
                    }
                ],
                "startLevelNum": 2,
                "endLevelNum": 5,
                "startLaneNum": 1,
                "endLaneNum": 1,
                "resizeW": 0,
                "resizeH": 0
            },
            {
                "id": 1,
                "name": "B3",
                "hideName": false,
                "type": 12,
                "levelNum": 2,
                "laneNum": 2,
                "expanded": true,
                "contentNodes": "P16,P17,T2,T5",
                "containerName": "B1",
                "gridAcross": 0,
                "gridAlong": 3,
                "locators": [
                    {
                        "name": "P16",
                        "levelShift": 1,
                        "laneShift": 0
                    },
                    {
                        "name": "P17",
                        "levelShift": 2,
                        "laneShift": 0
                    },
                    {
                        "name": "T2",
                        "levelShift": 0,
                        "laneShift": 0
                    },
                    {
                        "name": "T5",
                        "levelShift": 3,
                        "laneShift": 0
                    }
                ],
                "startLevelNum": 2,
                "endLevelNum": 5,
                "startLaneNum": 2,
                "endLaneNum": 2,
                "resizeW": 0,
                "resizeH": 0
            },
            {
                "id": 1,
                "name": "B4",
                "hideName": false,
                "type": 12,
                "levelNum": 2,
                "laneNum": 3,
                "expanded": true,
                "contentNodes": "P18,P19,T3,T6",
                "containerName": "B1",
                "gridAcross": 0,
                "gridAlong": 3,
                "locators": [
                    {
                        "name": "P18",
                        "levelShift": 1,
                        "laneShift": 0
                    },
                    {
                        "name": "P19",
                        "levelShift": 2,
                        "laneShift": 0
                    },
                    {
                        "name": "T3",
                        "levelShift": 0,
                        "laneShift": 0
                    },
                    {
                        "name": "T6",
                        "levelShift": 3,
                        "laneShift": 0
                    }
                ],
                "startLevelNum": 2,
                "endLevelNum": 5,
                "startLaneNum": 3,
                "endLaneNum": 3,
                "resizeW": 0,
                "resizeH": 0
            },
            {
                "id": 1,
                "name": "P14",
                "hideName": true,
                "type": 3,
                "levelNum": 3,
                "laneNum": 1,
                "containerName": "B2",
                "width": 64,
                "height": 44,
                "resizeW": 0,
                "resizeH": 0,
                "textAbove": "secundus",
                "textBelow": "congestaque ",
                "bgnColor": "#f9eebf",
                "fgnColor": "#00C"
            },
            {
                "id": 1,
                "name": "P15",
                "hideName": true,
                "type": 3,
                "levelNum": 4,
                "laneNum": 1,
                "containerName": "B2",
                "width": 64,
                "height": 44,
                "resizeW": 0,
                "resizeH": 0,
                "textBelow": "nisi pondus"
            },
            {
                "id": 1,
                "name": "P16",
                "hideName": true,
                "type": 3,
                "levelNum": 3,
                "laneNum": 2,
                "containerName": "B3",
                "width": 64,
                "height": 44,
                "resizeW": 0,
                "resizeH": 0,
                "textAbove": "tertius",
                "textBelow": "circumfuso ",
                "bgnColor": "#f9eebf",
                "fgnColor": "#00C"
            },
            {
                "id": 1,
                "name": "P17",
                "hideName": true,
                "type": 3,
                "levelNum": 4,
                "laneNum": 2,
                "containerName": "B3",
                "width": 64,
                "height": 44,
                "resizeW": 0,
                "resizeH": 0,
                "textBelow": "iunctarum "
            },
            {
                "id": 1,
                "name": "P18",
                "hideName": true,
                "type": 3,
                "levelNum": 3,
                "laneNum": 3,
                "containerName": "B4",
                "width": 64,
                "height": 44,
                "resizeW": 0,
                "resizeH": 0,
                "textAbove": "quartus",
                "textBelow": "ponderibus",
                "bgnColor": "#f9eebf",
                "fgnColor": "#00C"
            },
            {
                "id": 1,
                "name": "P19",
                "hideName": true,
                "type": 3,
                "levelNum": 4,
                "laneNum": 3,
                "containerName": "B4",
                "width": 64,
                "height": 44,
                "resizeW": 0,
                "resizeH": 0,
                "textBelow": "pontus et aether"
            },
            {
                "id": 1,
                "name": "T1",
                "hideName": false,
                "type": 17,
                "levelNum": 2,
                "laneNum": 1,
                "resizeW": 0,
                "resizeH": 0,
                "containerName": "B2",
                "textAbove": "corpora di coeptis nam vos mutastis et illas",
                "textBelow": "umor ultima",
                "bgnColor": "#8cf3d2",
                "fgnColor": "#FFF"
            },
            {
                "id": 1,
                "name": "T2",
                "hideName": false,
                "type": 17,
                "levelNum": 2,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "containerName": "B3",
                "textAbove": "adspirate meis primaque ab origine mundi",
                "textBelow": "possedit ",
                "bgnColor": "#8cf3d2",
                "fgnColor": "#FFF"
            },
            {
                "id": 1,
                "name": "T3",
                "hideName": false,
                "type": 17,
                "levelNum": 2,
                "laneNum": 3,
                "resizeW": 0,
                "resizeH": 0,
                "containerName": "B4",
                "textAbove": "ad mea perpetuum deducite tempora carmen",
                "textBelow": "solidumque ",
                "bgnColor": "#8cf3d2",
                "fgnColor": "#FFF"
            },
            {
                "id": 1,
                "name": "T4",
                "hideName": false,
                "type": 17,
                "levelNum": 5,
                "laneNum": 1,
                "resizeW": 0,
                "resizeH": 0,
                "containerName": "B2"
            },
            {
                "id": 1,
                "name": "T5",
                "hideName": false,
                "type": 17,
                "levelNum": 5,
                "laneNum": 2,
                "resizeW": 0,
                "resizeH": 0,
                "containerName": "B3"
            },
            {
                "id": 1,
                "name": "T6",
                "hideName": false,
                "type": 17,
                "levelNum": 5,
                "laneNum": 3,
                "resizeW": 0,
                "resizeH": 0,
                "containerName": "B4"
            },
            {
                "id": 1,
                "name": "CAELUM",
                "hideName": false,
                "type": 3,
                "levelNum": 0,
                "laneNum": 2,
                "width": 122,
                "height": 72,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Quae postquam evolvit caecoque exemit acervo"
            },
            {
                "id": 1,
                "name": "ANTE",
                "hideName": false,
                "type": 3,
                "levelNum": 1,
                "laneNum": 0,
                "width": 90,
                "height": 44,
                "resizeW": 13,
                "resizeH": 0,
                "bgnColor": "#bbf1eb",
                "fgnColor": "#00C"
            },
            {
                "id": 1,
                "name": "CIRCA",
                "hideName": false,
                "type": 3,
                "levelNum": 1,
                "laneNum": 4,
                "width": 90,
                "height": 44,
                "resizeW": 13,
                "resizeH": 0,
                "bgnColor": "#bbf1eb",
                "fgnColor": "#00C"
            },
            {
                "id": 1,
                "name": "B5",
                "hideName": false,
                "type": 12,
                "levelNum": 2,
                "laneNum": 0,
                "expanded": true,
                "contentNodes": "P25,P26,T9,T10",
                "containerName": "B1",
                "gridAcross": 0,
                "gridAlong": 3,
                "locators": [
                    {
                        "name": "P25",
                        "levelShift": 1,
                        "laneShift": 0
                    },
                    {
                        "name": "P26",
                        "levelShift": 2,
                        "laneShift": 0
                    },
                    {
                        "name": "T9",
                        "levelShift": 0,
                        "laneShift": 0
                    },
                    {
                        "name": "T10",
                        "levelShift": 3,
                        "laneShift": 0
                    }
                ],
                "startLevelNum": 2,
                "endLevelNum": 5,
                "startLaneNum": 0,
                "endLaneNum": 0,
                "resizeW": 0,
                "resizeH": 0
            },
            {
                "id": 1,
                "name": "B6",
                "hideName": false,
                "type": 12,
                "levelNum": 2,
                "laneNum": 4,
                "expanded": true,
                "contentNodes": "P23,P24,T7,T8",
                "containerName": "B1",
                "gridAcross": 0,
                "gridAlong": 3,
                "locators": [
                    {
                        "name": "P23",
                        "levelShift": 1,
                        "laneShift": 0
                    },
                    {
                        "name": "P24",
                        "levelShift": 2,
                        "laneShift": 0
                    },
                    {
                        "name": "T7",
                        "levelShift": 0,
                        "laneShift": 0
                    },
                    {
                        "name": "T8",
                        "levelShift": 3,
                        "laneShift": 0
                    }
                ],
                "startLevelNum": 2,
                "endLevelNum": 5,
                "startLaneNum": 4,
                "endLaneNum": 4,
                "resizeW": 0,
                "resizeH": 0
            },
            {
                "id": 1,
                "name": "P23",
                "hideName": true,
                "type": 3,
                "levelNum": 3,
                "laneNum": 4,
                "containerName": "B6",
                "width": 64,
                "height": 44,
                "resizeW": 0,
                "resizeH": 0,
                "textAbove": "quintus",
                "textBelow": "obstabatque ",
                "bgnColor": "#f9eebf",
                "fgnColor": "#00C"
            },
            {
                "id": 1,
                "name": "P24",
                "hideName": true,
                "type": 3,
                "levelNum": 4,
                "laneNum": 4,
                "containerName": "B6",
                "width": 64,
                "height": 44,
                "resizeW": 0,
                "resizeH": 0,
                "textBelow": "aliis aliud"
            },
            {
                "id": 1,
                "name": "T7",
                "hideName": false,
                "type": 17,
                "levelNum": 2,
                "laneNum": 4,
                "resizeW": 0,
                "resizeH": 0,
                "containerName": "B6",
                "textAbove": "Ante mare et terras et quod tegit omnia caelum",
                "textBelow": "coercuit ",
                "bgnColor": "#8cf3d2",
                "fgnColor": "#FFF"
            },
            {
                "id": 1,
                "name": "T8",
                "hideName": false,
                "type": 17,
                "levelNum": 5,
                "laneNum": 4,
                "resizeW": 0,
                "resizeH": 0,
                "containerName": "B6"
            },
            {
                "id": 1,
                "name": "P25",
                "hideName": true,
                "type": 3,
                "levelNum": 3,
                "laneNum": 0,
                "containerName": "B5",
                "width": 64,
                "height": 44,
                "resizeW": 0,
                "resizeH": 0,
                "textAbove": "primus",
                "textBelow": "indigestaque ",
                "bgnColor": "#f9eebf",
                "fgnColor": "#00C"
            },
            {
                "id": 1,
                "name": "P26",
                "hideName": true,
                "type": 3,
                "levelNum": 4,
                "laneNum": 0,
                "containerName": "B5",
                "width": 64,
                "height": 44,
                "resizeW": 0,
                "resizeH": 0,
                "textBelow": "nec quicquam"
            },
            {
                "id": 1,
                "name": "T9",
                "hideName": false,
                "type": 17,
                "levelNum": 2,
                "laneNum": 0,
                "resizeW": 0,
                "resizeH": 0,
                "containerName": "B5",
                "textAbove": "in nova fert animus mutatas dicere formas",
                "textBelow": "circumfluus ",
                "bgnColor": "#8cf3d2",
                "fgnColor": "#FFF"
            },
            {
                "id": 1,
                "name": "T10",
                "hideName": false,
                "type": 17,
                "levelNum": 5,
                "laneNum": 0,
                "resizeW": 0,
                "resizeH": 0,
                "containerName": "B5"
            },
            {
                "id": 1,
                "name": "TERRA",
                "hideName": false,
                "type": 3,
                "levelNum": 6,
                "laneNum": 2,
                "width": 122,
                "height": 56,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "deus et melior natura"
            },
            {
                "id": 1,
                "name": "A2",
                "hideName": false,
                "type": 13,
                "levelNum": 0,
                "laneNum": 5,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Sic ubi dispositam quisquis fuit ille deorum\ncongeriem secuit sectamque in membra redegit"
            },
            {
                "id": 1,
                "name": "A3",
                "hideName": false,
                "type": 13,
                "levelNum": 6,
                "laneNum": 5,
                "resizeW": 0,
                "resizeH": 0,
                "contentText": "Tum freta diffudit rapidisque tumescere ventis\niussit et ambitae circumdare litora terrae"
            }
        ],
        "links": [
            {
                "id": 2,
                "source": "T1/OUT-0",
                "target": "P14/IN-0",
                "name": "[T1/OUT-0]-[P14/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P14/OUT-0",
                "target": "P15/IN-0",
                "name": "[P14/OUT-0]-[P15/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P15/OUT-0",
                "target": "T4/IN-0",
                "name": "[P15/OUT-0]-[T4/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "T2/OUT-0",
                "target": "P16/IN-0",
                "name": "[T2/OUT-0]-[P16/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P16/OUT-0",
                "target": "P17/IN-0",
                "name": "[P16/OUT-0]-[P17/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P17/OUT-0",
                "target": "T5/IN-0",
                "name": "[P17/OUT-0]-[T5/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "T3/OUT-0",
                "target": "P18/IN-0",
                "name": "[T3/OUT-0]-[P18/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P18/OUT-0",
                "target": "P19/IN-0",
                "name": "[P18/OUT-0]-[P19/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P19/OUT-0",
                "target": "T6/IN-0",
                "name": "[P19/OUT-0]-[T6/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "CITRA/OUT-0",
                "target": "B1/IN-1",
                "name": "[CITRA/OUT-0]-[B1/IN-1]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "ANTE/OUT-0",
                "target": "B1/IN-3",
                "name": "[ANTE/OUT-0]-[B1/IN-3]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "CAELUM/OUT-3",
                "target": "ANTE/IN-0",
                "name": "[CAELUM/OUT-3]-[ANTE/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "T7/OUT-0",
                "target": "P23/IN-0",
                "name": "[T7/OUT-0]-[P23/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P23/OUT-0",
                "target": "P24/IN-0",
                "name": "[P23/OUT-0]-[P24/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P24/OUT-0",
                "target": "T8/IN-0",
                "name": "[P24/OUT-0]-[T8/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "T9/OUT-0",
                "target": "P25/IN-0",
                "name": "[T9/OUT-0]-[P25/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P25/OUT-0",
                "target": "P26/IN-0",
                "name": "[P25/OUT-0]-[P26/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "P26/OUT-0",
                "target": "T10/IN-0",
                "name": "[P26/OUT-0]-[T10/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "A1/REF-OUT-R-0",
                "target": "B1/REF-IN-L-0",
                "name": "[A1/REF-OUT-R-0]-[B1/REF-IN-L-0]",
                "srcSide": 4,
                "trgSide": 8,
                "type": 2
            },
            {
                "id": 2,
                "source": "CIRCA/OUT-0",
                "target": "B1/IN-5",
                "name": "[CIRCA/OUT-0]-[B1/IN-5]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "CIRCUM/OUT-0",
                "target": "B1/IN-4",
                "name": "[CIRCUM/OUT-0]-[B1/IN-4]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "APUD/OUT-0",
                "target": "B1/IN-2",
                "name": "[APUD/OUT-0]-[B1/IN-2]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "CAELUM/OUT-2",
                "target": "APUD/IN-0",
                "name": "[CAELUM/OUT-2]-[APUD/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "CAELUM/OUT-0",
                "target": "CIRCUM/IN-0",
                "name": "[CAELUM/OUT-0]-[CIRCUM/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "CAELUM/OUT-4",
                "target": "CIRCA/IN-0",
                "name": "[CAELUM/OUT-4]-[CIRCA/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "CAELUM/OUT-5",
                "target": "CITRA/IN-0",
                "name": "[CAELUM/OUT-5]-[CITRA/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "B1/OUT-0",
                "target": "TERRA/IN-0",
                "name": "[B1/OUT-0]-[TERRA/IN-0]",
                "srcSide": 1,
                "trgSide": 2,
                "type": 1
            },
            {
                "id": 2,
                "source": "A2/REF-OUT-R-0",
                "target": "CAELUM/REF-IN-L-0",
                "name": "[A2/REF-OUT-R-0]-[CAELUM/REF-IN-L-0]",
                "srcSide": 4,
                "trgSide": 8,
                "type": 2
            },
            {
                "id": 2,
                "source": "A3/REF-OUT-R-0",
                "target": "TERRA/REF-IN-L-0",
                "name": "[A3/REF-OUT-R-0]-[TERRA/REF-IN-L-0]",
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
            "canvasLanes": 6,
            "startEndLevels": 1,
            "sideSwimLanes": 1,
            "autoGenNodeNames": true,
            "hideNodeNames": false,
            "showRefHandles": true,
            "linkStyle": 2
        }
    };

    return {
        getJSONFile: function () {
            return fileText;
        }
    };
});
