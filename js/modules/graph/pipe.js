define('modules/graph/pipe',
		['modules/geometry/rectangle',
			'modules/graph/segmentChannel',
			'modules/graph/graphConstants',
			'modules/settings/config',
			//'modules/layout/layoutUtils',
			'modules/core/jsUtils'
		],
	function(Rectangle,
	         SegmentChannel,
	         constants,
	         config,
	         //layoutUtils,
	         jsUtils) {

		function Pipe(order) {
			Rectangle.call(this, 0, 0, 0, 0);

			var self = this;
			var DEBUG = false;
			var segmentsN2P = [],
				segmentsP2N = [],
				segmentsInP = [],
				segmentsInC = [];

			self.getType = function() {
				return constants.pipeType().UNDEF;
			};

			self.order = order;
			self.getOrder = function() { return self.order; };

			self.channels = [];
			self.getChannels = function() { return self.channels; };
			self.clearChannels = function() {
				for (var i = 0; i < self.channels.length; i++) {
					self.channels[i].clear();
				}
				self.channels = [];
				self.addNewChannel(new SegmentChannel());
			};

			self.clearSegmentsCache = function() {
				segmentsN2P = [];
				segmentsP2N = [];
				segmentsInP = [];
				segmentsInC = [];
			};

			self.addNewChannel = function(channel) {
				self.channels.push(channel);
				channel.setOrder(self.channels.length-1);
			};

			self.insertNewChannel = function(channel) {
				self.channels.splice(0, 0, channel);
				for (var i = 0; i < self.channels.length; i++) {
					self.channels[i].setOrder(i);
				}
			};

			self.insertEmptyChannelAtIndex = function(idx) {
				if (idx < self.channels.length) {
					self.channels.splice(idx, 0, new SegmentChannel());
					for (var i = idx; i < self.channels.length; i++) {
						self.channels[i].setOrder(i);
					}
				} else {
					self.addNewChannel(new SegmentChannel());
				}
			};

			self.incrementChannels = function() {
				var channel = new SegmentChannel();
				self.addNewChannel(channel);
				return channel;
			};

			self.hasEmptyChannels = function() {
				for (var i = 0; i < self.channels.length; i++) {
					if (self.channels[i].getSegments().length === 0) {
						return true;
					}
				}
				return false;
			};

			self.auxChannelsNum = 0;
			self.addAuxChannel = function() {
				//self.addNewChannel(new SegmentChannel());
				if (!self.hasEmptyChannels()) {
					self.auxChannelsNum++;
				}
			};

			self.getSegmentChannel = function(segment) {
				for (var i = 0; i < self.channels.length; i++) {
					if (self.channels[i].contains(segment)) {
						return self.channels[i];
					}
				}
				return undefined;
			};

			self.removeSegmentFromPipe = function(segment) {
				var channel = self.getSegmentChannel(segment);
				if (channel) {
					channel.removeSegment(segment);
				}
			};

			self.addSegmentToPipe = function(segment) {
				var channel = new SegmentChannel();
				channel.addSegment(segment);
				self.addNewChannel(channel);
			};

			self.areSegmentsAllocated = false;

			self.getAllSegments = function() {
				var allSegments = [];
				for (var i = 0; i < self.channels.length; i++) {
					allSegments = allSegments.concat(self.channels[i].getSegments());
				}
				return allSegments;
			};
			self.getSegmentsNumber = function() { return self.getAllSegments().length; };

			self.registerSegment = function(segment) {
				if (segment.getType() === constants.segmentType().NODE_TO_PIPE) {
					//segmentsN2P.push(segment);
					addToN2P(segment);
				} else if (segment.getType() === constants.segmentType().PIPE_TO_NODE) {
					//segmentsP2N.push(segment);
					addToP2N(segment);
				} else if (segment.getType() === constants.segmentType().IN_PIPE) {
					segmentsInP.push(segment);
				} else if (segment.getType() === constants.segmentType().IN_CORRIDOR) {
					segmentsInC.push(segment);
				}
				//console.log("@@@ registerSegment type: "+segment.getType()+" === N2P="+
				//	self.getNode2PipeSegments().length+", P2N="+self.getPipe2NodeSegments().length+", pipe: "+
				//	self.getType()+", "+self.getOrder());
			};

			function addToN2P(segment) {
				for (var i = 0; i < segmentsN2P.length; i++) {
					var sgm = segmentsN2P[i];
					if (sgm.getStartPoint().equals(segment.getStartPoint())) {
						segmentsN2P.splice(i, 1);
						break;
					}
				}
				segmentsN2P.push(segment);
			}

			function addToP2N(segment) {
				for (var i = 0; i < segmentsP2N.length; i++) {
					var sgm = segmentsP2N[i];
					if (sgm.getEndPoint().equals(segment.getEndPoint())) {
						segmentsP2N.splice(i, 1);
						break;
					}
				}
				segmentsP2N.push(segment);
			}

			self.getNode2PipeSegments = function() { return segmentsN2P; };
			self.getPipe2NodeSegments = function() { return segmentsP2N; };
			self.getNodeSegments = function() { return segmentsN2P.concat(segmentsP2N); };
			self.getInPipeSegments = function() { return segmentsInP; };
			self.getInCorridorSegments = function() { return segmentsInC; };

			self.getMinExtend = function() {
				// TODO: in derived classes
				return 0;
			};

			self.getLayoutStep = function() {
				return constants.segmentsGap().MIN + constants.minSegmentSize().WIDTH;
			};

			/**
			 * Single channel is in the middle of the pipe and has offset 0.
			 * The offset for the channel #0 axis (channels > 1) is negative
			 */
			self.getStartChannelOffset = function() {
				var size = self.channels.length;
				if (size <= 1) {
					return 0;
				} else {
					var off = -(Math.floor((self.getLayoutStep()*(size-1))/2));
					//console.log("???????? getStartChannelOffset="+off+", channels="+size);
					return -(Math.floor((self.getLayoutStep()*(size-1))/2));
				}
			};

			self.getExtent = function() {
				// implemented in derived classes
				//return 0;
				//console.log("???: "+self.getMinExtend()+", "+self.getExpand()+", "+self.getPipeFlowWidth());
				//return self.getMinExtend()+self.getExpand()+self.getPipeFlowWidth();
			};

			self.getExpand = function() {
				return 0;
				//console.log("???: "+self.getMinExtend()+", "+self.getExpand()+", "+self.getPipeFlowWidth());
				//return self.getMinExtend()+self.getExpand()+self.getPipeFlowWidth();
			};

			self.adjustSegment = function(segment) {
				// implemented in derived classes
			};

			self.adjustGlobalSize = function(length) {
				// implemented in derived classes
			};

			self.adjustPipeExtend = function() {
				// implemented in derived classes
			};

			/**
			 * Assigning segments is called during the second stage of layout.
			 * The assumption is that at this point all segments, if any, are in channel 0.
			 * Just count the channels that will be allocated on the second call
			 */
			self.assignSegmentsToChannels = function() {
				if (self.channels.length > 1) {
					console.log("ERROR: orderSegment invoked second time");
					//return;
				}

				var layoutUtl = require('modules/layout/layoutUtils');
				if (self.channels.length === 0) {
					self.addNewChannel(new SegmentChannel());
				}
				// at this point all segments are in channels[0]
				if (self.channels[0].getSegments().length < 2) {
					// none or one segment
					return;
				}
//console.log("/// assignSegmentsToChannels: order="+self.getOrder()+", channels="+self.channels.length+
//						", type="+self.getType());
				var CHECKIT = self.getType() === constants.pipeType().LEVEL_PIPE && self.getOrder() === 2;
				if (CHECKIT) {
					//console.log("&&&&&&&&&&&&&&& START: assignSegmentsToChannels: "+self.print());
				}
				var foundOverlap = true;
				while (foundOverlap) {
					foundOverlap = false;
					// if new channel has been added, increment index
					var maxIndex = self.channels.length-1;
					var maxIdxChannel = self.channels[maxIndex];
					if (maxIdxChannel.getSegments().length < 2) {
						// end of check
						break;
					}
					var newChannel = new SegmentChannel();
					var sgmIdx = 0;
					while (sgmIdx < maxIdxChannel.getSegments().length-1) {
						var thisSgm = maxIdxChannel.getSegments()[sgmIdx++];
						for (var i = maxIdxChannel.segments.length-1; i >= 0; i--) {
							var nextSgm = maxIdxChannel.segments[i];
							if (nextSgm.equals(thisSgm) || thisSgm.isSiblingWith(nextSgm)) {
								continue;
							}
							if (layoutUtl.areOverlapping(thisSgm, nextSgm)) {
								foundOverlap = true;
								maxIdxChannel.segments.splice(i, 1);
								newChannel.addSegment(nextSgm);
							}
						}
					}
					if (newChannel.getSegments().length > 0) {
						self.addNewChannel(newChannel);
					}
				}
				for (var j = 0; j < self.auxChannelsNum; j++) {
					if (CHECKIT) {
						//console.log("&&&&& PIPE: add aux channels: "+self.auxChannelsNum);
					}
					if (j%2 == 0) {
						self.addNewChannel(new SegmentChannel());
					} else {
						self.insertNewChannel(new SegmentChannel());
					}
				}
				if (CHECKIT) {
					//console.log("&&&&&&&&&&&&&&&   END: assignSegmentsToChannels: "+self.print());
				}
			};

			//self.bumpUpChannels = function() {
			//	self.addNewChannel(new SegmentChannel());
			//	self.reassignSegmentsToChannels();
			//};

			self.reassignSegmentsToChannels = function() {
				self.unassignChannels();
				self.assignSegmentsToChannels();
			};

			self.unassignChannels = function() {
				self.deallocateSegments();
				var alls = self.getAllSegments();
				self.clearChannels();
				self.channels = [];
				var newSG = new SegmentChannel();
				newSG.addSegments(alls);
				self.addNewChannel(newSG);
			};

			self.addSegment = function(segment) {
				if (!self.containsSegment(segment)) {
					if (self.channels.length === 0) {
						self.addNewChannel(new SegmentChannel());
						//if (self.getType() === constants.pipeType().LEVEL_PIPE && self.getOrder() === 2) {
						//	console.log("++++++***** addNewChannel: "+segment.print());
						//}
					}
					var mainChannel = self.channels[0];
					mainChannel.addSegment(segment);
					segment.setChannelIndex(0);
					//console.log("+++++++++++++++ addSegment: "+segment.print());
					//if (self.getType() === constants.pipeType().LEVEL_PIPE && self.getOrder() === 2) {
					//	console.log("/////////////// segment added: "+self.print());
					//}
				}
			};

			// to use before assigning
			self.containsSegment = function(segment) {
				var mainChannel = self.channels[0];
				if (mainChannel == null) {
					return false;
				}
				for (var i = 0; i < mainChannel.getSegments().length; i++) {
					var sgm = mainChannel.getSegments()[i];
					if (sgm.equals(segment)) {
						return true;
					}
				}
				return false;
			};

			// to use after assigning
			self.hasSegment = function(segment) {
				for (var i = 0; i < self.channels.length; i++) {
					if (self.channels[i].contains(segment)) {
						return true;
					}
				}
				return false;
			};

			self.allocateSegments = function() {
				// TODO: implement in derived classes
			};

			self.deallocateSegments = function() {
				// TODO: implement in derived classes
			};


			///////////////////////

			self.swapSegments = function(iChannel, iiSegment, jChannel, jjSegment) {
				// TODO
				// override in subclasses
			};

			self.swapChannels = function(iChannel, jChannel) {
				// TODO
				// may not be needed
			};

			self.moveSegment = function(segment, fromChannel, toChannel) {
				// TODO
				// override in subclasses
			};

			//function

			///////////////////////

			self.optimizePipe = function() {
				self.trimEmptyChannels();
				self.mergeChannels();
				self.trimEmptyChannels();
			};

			self.mergeChannels = function() {
				if (self.channels.length <= 1) {
					return;
				}
				var layoutUtl = require('modules/layout/layoutUtils');
				// top down
				var CHECKIT = self.getType() === constants.pipeType().LEVEL_PIPE && self.getOrder() === 2;
				if (CHECKIT) {
					//console.log("------------- MERGE--------------- level pipe, order = 2, channels: "+self.channels.length);
				}
				var CLEARANCE = Math.floor(constants.segmentsGap().MIN / 2),
					i, j, jj, k;
				for (i = 0; i < self.channels.length-1; i++) {
					var iChannel = self.channels[i];
					//if (CHECKIT) {
						//console.log("	******** i channels "+i);
						//var iSgms = iChannel.getSegments();
						//for (var ii = 0; ii < iSgms.length; ii++) {
						//	console.log("	    ++++ "+iSgms[ii].print());
						//}
					//}
					for (j = i+1; j < self.channels.length; j++) {
						var jChannel = self.channels[j];
						// try to merge j to i
						var jjSegments = jChannel.getSegments();
						//if (CHECKIT) {
							//console.log("	******** channels "+i+"/"+j+", segsjj="+jjSegments.length+", iCh segs="+iChannel.getSegments().length);
						//}
						for (jj = 0; jj < jjSegments.length; jj++) {
							var jSgm = jjSegments[jj];
							//if (CHECKIT) {
							//	console.log("	--??-- " + i + "/" + j + "/" + jj + ", seg=" + jSgm.print());
							//}
							if (layoutUtl.hasSegmentConflictsInChanel(iChannel, jSgm, CLEARANCE)) {
								//if (CHECKIT) {
								//	console.log("	CONFLICT: i: "+i+", j: "+j+",  "+jSgm.getEdge().getName());
								//}
								continue;
							}
							//if (CHECKIT) {
							//	console.log("	===== i: "+i+", j: "+j+", move: "+jSgm.getEdge().getName());
							//}
							self.moveSegment(jSgm, jChannel, iChannel);
							jSgm.getEdge().adjustSegmentsLocations();
							for (k = 0; k < self.channels.length; k++) {
								//if (k == i || k == j) {
								if (k == j) {
									//continue;
								}
								var bb = i == 5 && j == 6, // && k == 5,
									b1 = layoutUtl.areSegment2ChannelCrossBox(jSgm, self.channels[k], bb),
									b2 = layoutUtl.areSegment2ChannelSideBox(jSgm, self.channels[k], bb);
								//if (layoutUtl.areSegment2ChannelCrossBox(jSgm, self.channels[k]) ||
								//	layoutUtl.areSegment2ChannelSideBox(jSgm, self.channels[k])) {
								if (b1 || b2) {
									// should rollback
									//if (CHECKIT) {
									//	console.log("	ROLL BACK: i: "+i+", j: "+j+", k: "+k+", b1: "+b1+", b2: "+b2+", "+jSgm.getEdge().getName());
									//}
									self.moveSegment(jSgm, iChannel, jChannel);
									jSgm.getEdge().adjustSegmentsLocations();
									break;
								}
							}
							if (CHECKIT) {
								//console.log("	== OK, moved: "+jSgm.getEdge().getName());
							}
						}
					}
				}
			};

			self.trimEmptyChannels = function() {
				var cnt = 0, i = 0;
				// from top
				if (self.channels.length > 1) {
					for (i = 0; i < self.channels.length; i++) {
						if (self.channels[i].getSegments().length === 0) {
							cnt++;
						} else {
							break;
						}
					}
					if (cnt > 0) {
						self.channels.splice(0, cnt);
						// re-index remaining channels
						for (i = 0; i < self.channels.length; i++) {
							self.channels[i].setOrder(self.channels[i].getOrder()-cnt);
						}
					}
				}
				// from bottom up
				if (self.channels.length > 1) {
					cnt = 0;
					for (i = self.channels.length-1; i >= 0; i--) {
						if (self.channels[i].getSegments().length === 0) {
							self.channels.splice(i, 1);
							cnt++;
						} else {
							break;
						}
					}
				}
				// in the middle: look for empty channel ranges inside
				if (self.channels.length > 1) {
					var pointerIdx = -1;
					// exit condition for this loop is pointerIdx == self.channels.length
					while (pointerIdx < self.channels.length) {
						var fwdCnt = 0;
						pointerIdx = -1;
						for (i = 0; i < self.channels.length; i++) {
							if (self.channels[i].getSegments().length === 0) {
								pointerIdx = i;
								break;
							}
						}
						if (pointerIdx > -1) {
							// count range of empty consecutive channels from pointerIdx on, incl
							for (i = pointerIdx; i < self.channels.length; i++) {
								if (self.channels[i].getSegments().length === 0) {
									fwdCnt++;
								} else {
									break;
								}
							}
							if (fwdCnt > 0) {
								// remove empty channels in this range
								for (i = pointerIdx + fwdCnt - 1; i >= pointerIdx; i--) {
									self.channels.splice(i, 1);
								}
								// re-index remaining channels
								for (i = pointerIdx; i < self.channels.length; i++) {
									self.channels[i].setOrder(i);
								}
							}
						} else {
							// break
							pointerIdx = self.channels.length;
						}
					}
				}
				if (self.channels.length === 1 && self.channels[0].getSegments().length == 0) {
					self.channels.splice(0, 1);
				}
				if (DEBUG)
					console.log("## mergeChannels TRIMMED: "+self.print());
			};

			self.optimizeSegmentsLength = function() {
				// TODO: may be implemented later
			};

			// TODO: this should never be used !!!
			// TODO: this creates weird extended cross segment parts
			//self.trimZeroLengthSegments = function() {
			//	if (self.channels.length > 1) {
			//		for (var i = self.channels.length-1; i >= 0; i--) {
			//			var segments = self.channels[i].getSegments();
			//			for (var j = segments.length-1; j >= 0; j--) {
			//				if (segments[j].getLength() === 0) {
			//					segments[j].getEdge().removeZeroLengthSegment(segments[j]);
			//					segments.splice(j, 1);
			//				}
			//			}
			//		}
			//	}
			//};

			// not used
			self.getPipeAcceptingChannels = function(theChannel, theSegment) {
				var ncChannels = [];
				var layoutUtl = require('modules/layout/layoutUtils');
				for (var i = 0; i < self.channels.length; i++) {
					var channel = self.channels[i];
					if (channel === theChannel) {
						continue;
					}
					var hasConflict = false;
					var segments = channel.getSegments();
					for (var j = 0; j < segments.length; j++) {
						if (layoutUtl.areSegmentsProjectionsOverlapping(segments[j], theSegment, 0)) {
							hasConflict = true;
							break;
						}
					}
					if (!hasConflict) {
						ncChannels.push(channel);
					}
				}
				return ncChannels;
			};

			self.equals = function(another) {
				return another instanceof Pipe &&
					self.getType() === another.getType() &&
					self.getOrder() === another.getOrder();
			};

			self.print = function() {
				var info = self.constructor.name + ": order="+self.order+", type="+self.getType()+
					", channels: "+self.getChannels().length+", segments: "+self.getSegmentsNumber();
				for (var i = 0; i < self.getChannels().length; i++) {
					info += "\n\t"+self.getChannels()[i].print();
				}
				return info;
			};
			self.printShort = function() {
				return "" +
					self.constructor.name + ": order="+self.order+", channels: "+self.getChannels().length+", "+self.showBounds();
			};
			self.printRect = function() {
				return "PIPE x = "+self.x+", y = "+self.y+", w = "+self.width+", h = "+self.height;
			};

		}
		jsUtils.inherit(Pipe, Rectangle);
		return Pipe;
	}
);