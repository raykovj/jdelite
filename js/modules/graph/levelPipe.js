define('modules/graph/levelPipe',
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

		function LevelPipe(order) {
			Pipe.call(this, order);

			var self = this;

			self.getType = function() {
				return constants.pipeType().LEVEL_PIPE;
			};

			self.getLayoutStep = function() {
				return constants.segmentsGap().MIN + constants.minSegmentSize().WIDTH;
			};

			self.getPipeFlowWidth = function() {
				var size = self.channels.length;
				//console.log("    --- levelPipe: channels="+size+", step="+self.getLayoutStep());
				return constants.minSegmentSize().WIDTH + (size > 1 ? self.getLayoutStep()*(size-1) : 0);
			};

			self.getExtent = function() {
				var extent =  self.getMinExtend()+self.getExpand()+self.getPipeFlowWidth();
				//if (self.order === 1)
				//console.log("?????? levelPipe: channels="+self.channels.length+", extent="+extent+
				//	" === "+self.getMinExtend()+"+"+self.getExpand()+"+"+self.getPipeFlowWidth());
				return extent;
			};

			self.adjustPipeExtend = function() {
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					self.setHeight(self.getExtent());
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					self.setWidth(self.getExtent());
				}
			};

			self.adjustGlobalSize = function(length) {
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					self.setRectSize(length, self.getExtent());
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					self.setRectSize(self.getExtent(), length);
				}
			};

			self.adjustSegment = function(segment) {
				var step = self.getLayoutStep();
				var offset = self.getStartChannelOffset();
				var sgmChannelIdx = segment.getChannelIndex();
				var sgmOffset = offset + sgmChannelIdx * step;
				var middleX = 0, middleY = 0, sgmX = 0, sgmY = 0;
				if (config.getFlowDirection() === constants.flow().VERTICAL) {
					middleY = self.y + Math.floor(self.height/2);
					sgmY = middleY+sgmOffset;
					segment.getStartPoint().moveToXY(segment.getStartPoint().x, sgmY);
					segment.getEndPoint().moveToXY(segment.getEndPoint().x, sgmY);
				} else if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					middleX = self.x + Math.floor(self.width/2);
					sgmX = middleX+sgmOffset;
					segment.getStartPoint().moveToXY(sgmX, segment.getStartPoint().y);
					segment.getEndPoint().moveToXY(sgmX, segment.getEndPoint().y);
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
				return config.getAlongPipeExpand();
			};

			self.allocateSegments = function() {
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
									sgm.adjustStartPoint(offset+i*step, 0);
									sgm.adjustEndPoint(offset+i*step, 0);
								} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
									sgm.adjustStartPoint(0, offset+i*step);
									sgm.adjustEndPoint(0, offset+i*step);
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
									sgm.adjustStartPoint(-offset-i*step, 0);
									sgm.adjustEndPoint(-offset-i*step, 0);
								} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
									sgm.adjustStartPoint(0, -offset-i*step);
									sgm.adjustEndPoint(0, -offset-i*step);
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
				//console.log("***$$$### LEVEL SWAP: delta= "+delta);
				iChannel.removeSegment(iiSegment);
				jChannel.removeSegment(jjSegment);
				if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
					iiSegment.getEdge().translateSegment(iiSegment, delta, 0);
					jjSegment.getEdge().translateSegment(jjSegment, -delta, 0);
				} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
					iiSegment.getEdge().translateSegment(iiSegment, 0, delta);
					jjSegment.getEdge().translateSegment(jjSegment, 0, -delta);
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
						iiSegments[i].adjustStartPoint(delta, 0);
						iiSegments[i].adjustEndPoint(delta, 0);
					}
					for (j = 0; j < jjSegments.length; j++) {
						jjSegments[j].adjustStartPoint(-delta, 0);
						jjSegments[j].adjustEndPoint(-delta, 0);
					}
				} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
					for (i = 0; i < iiSegments.length; i++) {
						iiSegments[i].adjustStartPoint(0, delta);
						iiSegments[i].adjustEndPoint(0, delta);
					}
					for (j = 0; j < jjSegments.length; j++) {
						jjSegments[j].adjustStartPoint(0, -delta);
						jjSegments[j].adjustEndPoint(0, -delta);
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
						segment.getEdge().translateSegment(segment, delta, 0);
					} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
						segment.getEdge().translateSegment(segment, 0, delta);
					}
					toChannel.addSegment(segment);
					// WRONG !!!
					//segment.getEdge().adjustSegmentsLocations();
				} else {
					console.log("#????? LEVEL ??????? ERROR moveSegment, fromChannel: "+fromChannel+", toChannel: "+toChannel);
				}
			};

		}
		jsUtils.inherit(LevelPipe, Pipe);
		return LevelPipe;
	}
);