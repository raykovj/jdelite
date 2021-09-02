define('modules/graph/lanePipe',
	['modules/graph/pipe',
		'modules/graph/segmentChannel',
		'modules/graph/graphConstants',
		'modules/settings/config',
		'modules/core/jsUtils'
	],
	function(Pipe,
	         SegmentChannel,
	         constants,
	         config,
	         jsUtils) {

		function LanePipe(order) {
			Pipe.call(this, order);

			var self = this;

			self.getType = function() {
				return constants.pipeType().LANE_PIPE;
			};

			self.getLayoutStep = function() {
				return constants.segmentsGap().MIN + constants.minSegmentSize().WIDTH;
			};

			self.getPipeFlowWidth = function() {
				var size = self.channels.length;
				return constants.minSegmentSize().WIDTH + (size > 1 ? self.getLayoutStep()*(size-1) : 0);
			};

			self.getExtent = function() {
				var extent = self.getMinExtend()+self.getExpand()+self.getPipeFlowWidth();
				//if (self.order === 1)
				//	console.log("?????? lanePipe: channels="+self.channels.length+", extent="+extent+
				//		" === "+self.getMinExtend()+"+"+self.getExpand()+"+"+self.getPipeFlowWidth());
				//console.log("??? lanePipe: "+self.getMinExtend()+", "+self.getExpand()+", "+self.getPipeFlowWidth());
				return extent;
			};

			self.adjustPipeExtend = function() {
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					self.setWidth(self.getExtent());
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					self.setHeight(self.getExtent());
				}
			};

			self.adjustGlobalSize = function(length) {
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					self.setRectSize(self.getExtent(), length);
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					self.setRectSize(length, self.getExtent());
				}
			};

			self.adjustSegment = function(segment) {
				var step = self.getLayoutStep();
				var offset = self.getStartChannelOffset();
				var sgmChannelIdx = segment.getChannelIndex();
				var sgmOffset = offset + sgmChannelIdx * step;
				var middleX = 0, middleY = 0, sgmX = 0, sgmY = 0;
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					middleX = self.x + Math.floor(self.width/2);
					sgmX = middleX+sgmOffset;
					segment.getStartPoint().moveToXY(sgmX, segment.getStartPoint().y);
					segment.getEndPoint().moveToXY(sgmX, segment.getEndPoint().y);
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					middleY = self.y + Math.floor(self.height/2);
					sgmY = middleY+sgmOffset;
					segment.getStartPoint().moveToXY(segment.getStartPoint().x, sgmY);
					segment.getEndPoint().moveToXY(segment.getEndPoint().x, sgmY);
				}
			};

			self.getMinExtend = function() {
				//if (self.channels.length === 0 ||
				//	self.channels.length === 1 && self.channels[0].getSegments().length === 1 && self.channels[0].getSegments()[0].getLength() === 0) {
				//	return constants.emptyPipeSize().WIDTH;
				//}
				if (self.channels.length === 0) {
					return constants.emptyPipeSize().WIDTH;
				}
				if (self.channels.length === 1) {
					var segments = self.channels[0].getSegments(),
						found;
					for (var i = 0; i < segments.length; i++) {
						if (segments[i].getLength() > 0) {
							found = true;
							break;
						}
					}
					if (!found) {
						return constants.emptyPipeSize().WIDTH;
					}
				}
				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					//return self.channels.length === 1 && self.channels[0].getSegments().length === 0 ?
					//	constants.emptyPipeSize().WIDTH :
					//2 * constants.edgeOffsetLimit().VERTICAL;
					return 2 * constants.edgeOffsetLimit().VERTICAL;
				} else  {
					//return self.channels.length === 1 && self.channels[0].getSegments().length === 0 ?
					//	constants.emptyPipeSize().WIDTH :
					//2 * constants.edgeOffsetLimit().HORIZONTAL;
					return 2 * constants.edgeOffsetLimit().HORIZONTAL;
				}
			};

			self.getExpand = function() {
				return config.getAcrossPipeExpand();
			};

			self.allocateSegments = function() {
				var CHECKIT = self.getType() === constants.pipeType().LANE_PIPE && self.getOrder() === 1;
				if (CHECKIT) {
					//console.log("&&&&& LANE PIPE #2: allocateSegments: "+self.print());
					//console.log("&&&&& LANE PIPE #1: allocateSegments: "+!self.areSegmentsAllocated);
				}
				if (!self.areSegmentsAllocated) {
					if (self.channels.length > 1) {
						var step = self.getLayoutStep();
						var offset = self.getStartChannelOffset();
						for (var i = 0; i < self.channels.length; i++) {
							var channel = self.channels[i];
							channel.setOrder(i);
							for (var j = 0; j < channel.getSegments().length; j++) {
								var sgm = channel.getSegments()[j];
								if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
									sgm.adjustStartPoint(0, offset+i*step);
									sgm.adjustEndPoint(0, offset+i*step);
								} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
									sgm.adjustStartPoint(offset+i*step, 0);
									sgm.adjustEndPoint(offset+i*step, 0);
								}
								sgm.setChannelIndex(i);
							}
						}
					}
					self.areSegmentsAllocated = true;
				}
			};

			self.deallocateSegments = function() {
				if (self.areSegmentsAllocated) {
					if (self.channels.length > 1) {
						var step = self.getLayoutStep();
						var offset = self.getStartChannelOffset();
						for (var i = 0; i < self.channels.length; i++) {
							var channel = self.channels[i];
							for (var j = 0; j < channel.getSegments().length; j++) {
								var sgm = channel.getSegments()[j];
								if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
									sgm.adjustStartPoint(0, -offset-i*step);
									sgm.adjustEndPoint(0, -offset-i*step);
								} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
									sgm.adjustStartPoint(-offset-i*step, 0);
									sgm.adjustEndPoint(-offset-i*step, 0);
								}
								sgm.setChannelIndex(0);
							}
						}
					}
					self.areSegmentsAllocated = false;
				}
			};

			self.swapSegments = function(iChannel, iiSegment, jChannel, jjSegment) {
				var delta = (jChannel.getOrder() - iChannel.getOrder()) * self.getLayoutStep();
				iChannel.removeSegment(iiSegment);
				jChannel.removeSegment(jjSegment);
				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					iiSegment.getEdge().translateSegment(iiSegment, 0, delta);
					jjSegment.getEdge().translateSegment(jjSegment, 0, -delta);
				} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
					iiSegment.getEdge().translateSegment(iiSegment, delta, 0);
					jjSegment.getEdge().translateSegment(jjSegment, -delta, 0);
				}
				iChannel.addSegment(jjSegment);
				jChannel.addSegment(iiSegment);
			};

			self.swapChannels = function(iChannel, jChannel) {
				var delta = (jChannel.getOrder() - iChannel.getOrder()) * self.getLayoutStep();
				var iiSegments = iChannel.getSegments().slice(0);
				var jjSegments = jChannel.getSegments().slice(0);
				var i = 0, j = 0;
				iChannel.clear();
				jChannel.clear();
				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					for (i = 0; i < iiSegments.length; i++) {
						iiSegments[i].adjustStartPoint(0, delta);
						iiSegments[i].adjustEndPoint(0, delta);
					}
					for (j = 0; j < jjSegments.length; j++) {
						jjSegments[j].adjustStartPoint(0, -delta);
						jjSegments[j].adjustEndPoint(0, -delta);
					}
				} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
					for (i = 0; i < iiSegments.length; i++) {
						iiSegments[i].adjustStartPoint(delta, 0);
						iiSegments[i].adjustEndPoint(delta, 0);
					}
					for (j = 0; j < jjSegments.length; j++) {
						jjSegments[j].adjustStartPoint(-delta, 0);
						jjSegments[j].adjustEndPoint(-delta, 0);
					}
				}
				iChannel.addSegments(jjSegments);
				jChannel.addSegments(iiSegments);
			};

			self.moveSegment = function(segment, fromChannel, toChannel) {
				if (fromChannel && toChannel) {
					var delta = (toChannel.getOrder() - fromChannel.getOrder()) * self.getLayoutStep();
					fromChannel.removeSegment(segment);
					if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
						segment.getEdge().translateSegment(segment, 0, delta);
					} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
						segment.getEdge().translateSegment(segment, delta, 0);
					}
					toChannel.addSegment(segment);
					// WRONG !!!
					//segment.getEdge().adjustSegmentsLocations();
				} else {
					console.log("#?????? LANE ?????? ERROR moveSegment, fromChannel: "+fromChannel+", toChannel: "+toChannel);
				}
			};

		}
		jsUtils.inherit(LanePipe, Pipe);
		return LanePipe;
	}
);