/**
 * Created by jraykov on 2/13/2018.
 */
define('modules/layout/mainLayoutUtils',
    ['modules/geometry/point',
        'modules/geometry/rectangle',
        'modules/geometry/dimension',
        'modules/layout/layoutUtils',
        'modules/diagram/diagramUtils',
        'modules/settings/config',
        'modules/graph/graphConstants'],
    function(Point,
             Rectangle,
             Dimension,
             layoutUtl,
             dgmUtl,
             config,
             constants) {

        var DEBUG = false;

        return {

            adjustCorridorsAndPipes:  function(levels, lanes, levelPipes, lanePipes) {
                if (DEBUG) console.log("***/// adjustCorridorsAndPipes:");
                //self.printEdges();

                // along
                var i, extentAlong = 0, extentAcross = 0;
                for (i = 0; i < levels.length; i++) {
                    var level = levels[i];
                    extentAlong += config.getFlowDirection() === constants.flow().HORIZONTAL ? level.width : level.height;
                }
                for (i = 0; i < levelPipes.length; i++) {
                    var levelPipe = levelPipes[i];
                    levelPipe.reassignSegmentsToChannels();
                    extentAlong += levelPipe.getExtent();
                }

                // across
                for (i = 0; i < lanes.length; i++) {
                    var lane = lanes[i];
                    extentAcross += config.getFlowDirection() === constants.flow().HORIZONTAL ? lane.height : lane.width;
                }
                for (i = 0; i < lanePipes.length; i++) {
                    var lanePipe = lanePipes[i];
                    lanePipe.reassignSegmentsToChannels();
                    extentAcross += lanePipe.getExtent();
                }

                if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
                    return new Dimension(extentAlong, extentAcross);
                } else {
                    return new Dimension(extentAcross, extentAlong);
                }
            },

            reAdjustCorridorsAndPipes: function(levels, lanes, levelPipes, lanePipes) {
                if (DEBUG) console.log("@@@@ Flowlayout: reAdjustCorridorsAndPipes");

                // along
                var i, extentAlong = 0;
                for (i = 0; i < levels.length; i++) {
                    var level = levels[i];
                    extentAlong += config.getFlowDirection() === constants.flow().HORIZONTAL ? level.width : level.height;
                }
                for (i = 0; i < levelPipes.length; i++) {
                    var levelPipe = levelPipes[i];
                    levelPipe.reassignSegmentsToChannels();
                    extentAlong += levelPipe.getExtent();
                }

                // across
                var  extentAcross = 0;
                for (i = 0; i < lanes.length; i++) {
                    var lane = lanes[i];
                    extentAcross += config.getFlowDirection() === constants.flow().HORIZONTAL ? lane.height : lane.width;
                }
                for (i = 0; i < lanePipes.length; i++) {
                    var lanePipe = lanePipes[i];
                    lanePipe.reassignSegmentsToChannels();
                    extentAcross += lanePipe.getExtent();
                }

                if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
                    return new Dimension(extentAlong, extentAcross);
                } else {
                    return new Dimension(extentAcross, extentAlong);
                }
            },

            // last step
            recalculateDimension: function(levels, lanes, levelPipes, lanePipes) {
                if (DEBUG) console.log("@@@@@ FlowLayout: recalculateDimension");

                // along
                var i, extentAlong = 0, extentAcross = 0;
                for (i = 0; i < levels.length; i++) {
                    var level = levels[i];
                    extentAlong += config.getFlowDirection() === constants.flow().HORIZONTAL ? level.width : level.height;
                }
                for (i = 0; i < levelPipes.length; i++) {
                    var levelPipe = levelPipes[i];
                    //levelPipe.adjustLocalSize();
                    extentAlong += levelPipe.getExtent();
                }
                // across
                for (i = 0; i < lanes.length; i++) {
                    var lane = lanes[i];
                    extentAcross += config.getFlowDirection() === constants.flow().HORIZONTAL ? lane.height : lane.width;
                }
                for (i = 0; i < lanePipes.length; i++) {
                    var lanePipe = lanePipes[i];
                    //lanePipe.adjustLocalSize();
                    extentAcross += lanePipe.getExtent();
                }

                if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
                    return new Dimension(extentAlong, extentAcross);
                } else {
                    return new Dimension(extentAcross, extentAlong);
                }
            },

            adjustGridSize: function(dms, levels, lanes, levelPipes, lanePipes) {
                // adjust corridors and pipes
                var i;
                for (i = 0; i < levels.length; i++) {
                    levels[i].adjustGlobalSize(
                        config.getFlowDirection() === constants.flow().HORIZONTAL ? dms.height : dms.width);
                }
                for (i = 0; i < lanes.length; i++) {
                    lanes[i].adjustGlobalSize(
                        config.getFlowDirection() === constants.flow().HORIZONTAL ? dms.width : dms.height);
                }
                for (i = 0; i < levelPipes.length; i++) {
                    levelPipes[i].adjustGlobalSize(
                        config.getFlowDirection() === constants.flow().HORIZONTAL ? dms.height : dms.width);
                }
                for (i = 0; i < lanePipes.length; i++) {
                    lanePipes[i].adjustGlobalSize(
                        config.getFlowDirection() === constants.flow().HORIZONTAL ? dms.width : dms.height);
                }
            }


         };

    }
);