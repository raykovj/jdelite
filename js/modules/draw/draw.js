define(['modules/settings/config',
		'modules/geometry/point',
		'modules/geometry/rectangle',
		'modules/graph/graphConstants'],
	function(config,
			 Point,
			 Rectangle,
			 constants) {

		function Draw() {
			var self = this;

			self.drawLine = function(ctx, color, stroke, x1, y1, x2, y2) {
				ctx.save();
				ctx.strokeStyle = color;
				ctx.lineWidth = stroke;
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
				ctx.restore();
			};

			self.paintRectangle = function(ctx, rect, fillColor, borderColor, stroke, transparency) {
				if (rect) {
					ctx.save();
					//ctx.globalAlpha = 0.5;
					//ctx.globalAlpha = 1;
					if (transparency && transparency >= 0 && transparency <= 1) {
						ctx.globalAlpha = transparency;
					} else {
						ctx.globalAlpha = 1.0;
					}
					if (fillColor) {
						ctx.fillStyle = fillColor;
						ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
					}
					if (borderColor) {
						ctx.strokeStyle = borderColor;
						ctx.lineWidth = stroke;
						//ctx.setLineDash([0,0]);
						ctx.beginPath();
						ctx.moveTo(rect.x, rect.y);
						ctx.lineTo(rect.x+rect.width, rect.y);
						ctx.lineTo(rect.x+rect.width, rect.y+rect.height);
						ctx.lineTo(rect.x, rect.y+rect.height);
						ctx.lineTo(rect.x, rect.y);
						ctx.stroke();
					}
					ctx.restore();
				}
			};

			self.roundRect = function(ctx, x, y, width, height, radius) {
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(x + radius, y);
				ctx.lineTo(x + width - radius, y);
				ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
				ctx.lineTo(x + width, y + height - radius);
				ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
				ctx.lineTo(x + radius, y + height);
				ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
				ctx.lineTo(x, y + radius);
				ctx.quadraticCurveTo(x, y, x + radius, y);
				ctx.fill();
				ctx.stroke();
				ctx.restore();
			};

			self.roundOval = function(ctx, x, y, width, height) {
				var radius = 0;
				ctx.save();
				ctx.beginPath();
				if (width > height) {
					radius = Math.floor(height/2);
					ctx.moveTo(x + radius, y);
					ctx.lineTo(x + width - 2*radius, y);
					ctx.arc(x + width - 2*radius, y + radius, radius, Math.PI*3/2, Math.PI/2);
					ctx.lineTo(x + radius, y + 2*radius);
					ctx.arc(x + radius, y + radius, radius, Math.PI/2, Math.PI*3/2);
				} else if (width < height) {
					radius = Math.floor(width/2);
					ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI*2);
					ctx.lineTo(x + 2*radius, y + height - 2*radius);
					ctx.arc(x + radius, y + height - 2*radius, radius, 0, Math.PI);
					ctx.lineTo(x, y + radius);
				} else {
					radius = Math.floor(width/2);
					ctx.arc(x + radius, y + radius, radius, 0, 2*Math.PI);
				}
				ctx.fill();
				ctx.stroke();
				ctx.restore();
			};

			self.drawCircle = function(ctx, rect, fillColor, borderColor, stroke, radius) {
				var x = rect.x + Math.floor(rect.width/2),
					y = rect.y + Math.floor(rect.height/2);
				ctx.save();
				ctx.beginPath();
				ctx.arc(x, y, radius, 0, 2*Math.PI);
				if (fillColor) {
					ctx.fillStyle = fillColor;
					ctx.fill();
				}
				ctx.strokeStyle = borderColor;
				ctx.lineWidth = stroke;
				ctx.stroke();
				ctx.restore();
			};

			self.selectedNodeFrame = function(ctx, x, y, width, height, dW, dH, color, node) {
				var nodeType = node.getFlowType(),
					nodeWidth = node.getEffectiveWidth(config.getGlobalNodeWidth(nodeType), config.getGlobalNodeHeight(nodeType)),
					nodeHeight = node.getEffectiveHeight(config.getGlobalNodeWidth(nodeType), config.getGlobalNodeHeight(nodeType)),
					sX = x-dW > x+(width-nodeWidth)/2 ? x+(width-nodeWidth)/2 : x-dW,
					sY = y-dH > y+(height-nodeHeight)/2 ? y+(height-nodeHeight)/2 : y-dH,
					sW = width+2*dW < nodeWidth ? nodeWidth : width+2*dW,
					sH = height+2*dH < nodeHeight ? nodeHeight : height+2*dH,
					dd = 2,
					r1 = new Rectangle(sX-dd, sY-dd, dd*2, dd*2),
					r2 = new Rectangle(sX+sW/2-dd, sY-dd, dd*2, dd*2),
					r3 = new Rectangle(sX+sW-dd, sY-dd, dd*2, dd*2),
					r4 = new Rectangle(sX-dd, sY+sH/2-dd, dd*2, dd*2),
					r5 = new Rectangle(sX+sW-dd, sY+sH/2-dd, dd*2, dd*2),
					r6 = new Rectangle(sX-dd, sY+sH-dd, dd*2, dd*2),
					r7 = new Rectangle(sX+sW/2-dd, sY+sH-dd, dd*2, dd*2),
					r8 = new Rectangle(sX+sW-dd, sY+sH-dd, dd*2, dd*2);
				ctx.save();
				ctx.lineWidth = 1;
				ctx.strokeStyle = color;
				ctx.beginPath();
				ctx.moveTo(sX, sY);
				ctx.lineTo(sX+sW, sY);
				ctx.lineTo(sX+sW, sY+sH);
				ctx.lineTo(sX, sY+sH);
				ctx.lineTo(sX, sY);
				ctx.stroke();

				self.paintRectangle(ctx, r1, color, color, 1);
				self.paintRectangle(ctx, r2, color, color, 1);
				self.paintRectangle(ctx, r3, color, color, 1);
				self.paintRectangle(ctx, r4, color, color, 1);
				self.paintRectangle(ctx, r5, color, color, 1);
				self.paintRectangle(ctx, r6, color, color, 1);
				self.paintRectangle(ctx, r7, color, color, 1);
				self.paintRectangle(ctx, r8, color, color, 1);
				ctx.restore();
			};

			self.roundParallelogram = function(ctx, x, y, width, height, radius, skew) {
				ctx.save();
				ctx.beginPath();
				//if (config.getFlowDirection() === constants.flow().HORIZONTAL) {
				//	ctx.moveTo(x + radius, y - skew);
				//	ctx.lineTo(x + width - radius, y + skew);
				//	ctx.quadraticCurveTo(x + width, y + skew, x + width, y + skew + radius);
				//	ctx.lineTo(x + width, y + skew + height - radius);
				//	ctx.quadraticCurveTo(x + width, y + skew + height, x + width - radius, y + skew + height);
				//	ctx.lineTo(x + radius, y - skew + height);
				//	ctx.quadraticCurveTo(x, y - skew + height, x, y - skew + height - radius);
				//	ctx.lineTo(x, y - skew + radius);
				//	ctx.quadraticCurveTo(x, y - skew, x + radius, y - skew);
				//} else if (config.getFlowDirection() === constants.flow().VERTICAL) {
					ctx.moveTo(x + skew + radius, y);
					ctx.lineTo(x + skew + width - radius, y);
					ctx.quadraticCurveTo(x + skew + width, y, x + skew + width, y + radius);
					ctx.lineTo(x - skew + width, y + height - radius);
					ctx.quadraticCurveTo(x - skew + width, y + height, x - skew + width - radius, y + height);
					ctx.lineTo(x - skew + radius, y + height);
					ctx.quadraticCurveTo(x - skew, y + height, x - skew, y + height - radius);
					ctx.lineTo(x + skew, y + radius);
					ctx.quadraticCurveTo(x + skew, y, x + skew + radius, y);
				//}
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
				ctx.restore();
			};

			self.decisionPolygon = function(ctx, x, y, width, height, radius) {
				ctx.save();
				ctx.beginPath();
				//if (orientation == constants.flow().VERTICAL) {
				ctx.moveTo(x, y + height/2);
				ctx.lineTo(x + width/2, y);
				ctx.lineTo(x + width, y + height/2);
				ctx.lineTo(x + width/2, y + height);

				//ctx.moveTo(x + radius, y + height/2);
				//ctx.lineTo(x + width/2, y);
				//ctx.quadraticCurveTo(x + width/2, y, x + width/2, y + radius);
				//ctx.lineTo(x + width - radius, y + height/2);
				//ctx.quadraticCurveTo(x + width, y + height/2, x + width - radius, y + height/2);
				//ctx.lineTo(x + width/2 + radius, y + height);
				//ctx.quadraticCurveTo(x + width/2, y + height, x + width/2, y + height - radius);
				//ctx.lineTo(x + radius, y + height/2 + radius);
				//ctx.quadraticCurveTo(x + radius, y + height/2, x + radius, y + height/2);

				//} else if (orientation == constants.flow().HORIZONTAL) {
				//
				//}
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
				ctx.restore();
			};

			self.drawTooltip = function(ctx, rect, location, tooltip) {
				var //ctx = canvas.getContext('2d'),
					bckgnd = '#82AAFA',
					forgnd = '#fff',
					//rect = canvas.getBoundingClientRect(),
					point = new Point(location.x+5, location.y-5),
					x = point.x,
					y = point.y,
					dd,
					hd = 2,
					vd = 2, // padding
					width,
					height = 12+2*vd;
				ctx.save();
				ctx.font = '12px sans-serif';
				if (Array.isArray(tooltip)) {
					width = 0;
					var reversed = tooltip.reverse(), i;
					for (i = 0; i < tooltip.length; i++) {
						width = Math.max(width, Math.floor(ctx.measureText(tooltip[i]).width));
					}
					dd = Math.floor(rect.width) - (x+width+3*hd);
					if (dd < 0) {
						x += dd;
					}
					for (i = 0; i < reversed.length; i++) {
						drawTooltipRow(ctx, x, y-(height * i), width, height, bckgnd, forgnd, reversed[i], hd, vd);
					}
				} else {
					width = Math.floor(ctx.measureText(tooltip).width);
					dd = Math.floor(rect.width) - (x+width+3*hd);
					if (dd < 0) {
						x += dd;
					}
					drawTooltipRow(ctx, x, y, width, height, bckgnd, forgnd, tooltip, hd, vd);
				}
				ctx.restore();
			};

			function drawTooltipRow(ctx, x, y, width, height, bckgnd, forgnd, text, hd, vd) {
				ctx.save();
				ctx.fillStyle = bckgnd;
				ctx.fillRect(x, y-height, width+2*hd, height);
				ctx.fillStyle = forgnd;
				ctx.fillText(text, x + hd, y-2*vd);
				ctx.restore();
			}

			self.drawGridTitle = function(ctx, rect, location, direction, text) {
				var bckgnd = '#E1F5FF', //'#E0E8D8',
					forgnd = '#82AAFA',
					point = new Point(location.x, location.y),
					x = point.x, xOrg,
					y = point.y, yOrg,
					dd,
					hd = 2,
					vd = 2, // padding
					textW,
					textH = 12+2*vd;
				//console.log("*** x = "+x+", y = "+y);
				ctx.save();
				ctx.font = '12px sans-serif';
				textW = Math.floor(ctx.measureText(text).width);

				if (direction === constants.gridDir().TOP) {
					xOrg = x - textW/2;
					yOrg = y;
					//ctx.fillStyle = bckgnd;
					//ctx.fillRect(xOrg, yOrg, textW+2*hd, textH);
					ctx.fillStyle = forgnd;
					ctx.fillText(text, xOrg + hd, yOrg+textH-2*vd);
				} else if (direction === constants.gridDir().BOTTOM) {
					xOrg = x - textW/2;
					yOrg = y - textH;
					//ctx.fillStyle = bckgnd;
					//ctx.fillRect(xOrg, yOrg, textW+2*hd, textH);
					ctx.fillStyle = forgnd;
					ctx.fillText(text, xOrg + hd, yOrg+textH-2*vd);
				} else if (direction === constants.gridDir().LEFT) {
					ctx.translate(x, y);
					ctx.rotate(-Math.PI/2);
					ctx.translate(-x, -y);
					xOrg = x - textW/2 - 2*vd;
					yOrg = y;
					//ctx.fillStyle = bckgnd;
					//ctx.fillRect(xOrg, yOrg, textW+2*hd, textH);
					ctx.fillStyle = forgnd;
					ctx.fillText(text, xOrg + hd, yOrg+textH-2*vd);
				} else if (direction === constants.gridDir().RIGHT) {
					ctx.translate(x, y);
					ctx.rotate(-Math.PI/2);
					ctx.translate(-x, -y);
					xOrg = x - textW/2 - 2*vd;
					yOrg = y - textH;
					//ctx.fillStyle = bckgnd;
					//ctx.fillRect(xOrg, yOrg, textW+2*hd, textH);
					ctx.fillStyle = forgnd;
					ctx.fillText(text, xOrg + hd, yOrg+textH-2*vd);
				}
				ctx.restore();
			};
		}

		return new Draw();

	}
);