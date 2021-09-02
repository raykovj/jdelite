define('modules/draw/drawUtils',
    ['modules/graph/graphConstants',
        'modules/geometry/dimension'],
    function(constants,
             Dimension) {

        var
            //getTokens = function(text) {
            //    var rawSplit = text.split(" "),
            //        tokens = [];
            //    for (var i = 0; i < rawSplit.length; i++) {
            //        if (rawSplit[i].length > 0) {
            //            var tokenSplit = rawSplit[i].split("\n");
            //            for (var j = 0; j < tokenSplit.length; j++) {
            //                tokens.push(tokenSplit[j]);
            //            }
            //        }
            //    }
            //    return tokens;
            //},
            getTokens = function(text) {
                var rows = text.split("\n"),
                    tokens = [];
                for (var i = 0; i < rows.length; i++) {
                    tokens = tokens.concat(rows[i].split(" "));
                }
                return tokens;
            },
            getTokensList = function(text) {
                var rows = text.split("\n"),
                    tokenLines = [];
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].length > 0) {
                        tokenLines.push(rows[i].split(" "));
                    }
                }
                return tokenLines;
            },
            getTruncatedText = function(text, ctx, maxWidth) {
                var textWidth = Math.floor(ctx.measureText(text).width);
                if (textWidth <= maxWidth) {
                    return text;
                }
                var currText = text, currWidth;
                while (currWidth = Math.floor(ctx.measureText(currText).width) > maxWidth) {
                    currText = currText.substring(0, currText.length-2);
                }
                return currText;
            },
            _contentLines = [];

        return {
            //getTextTruncated: function(text, ctx, maxWidth) {
            //    var newText = getTruncatedText(text, ctx, maxWidth);
            //    if (newText.length < text.length) {
            //        newText += "...";
            //    }
            //    return newText;
            //},
            ///////////
            // obsolete
            ///////////
            getTextBox: function (text, ctx, fontHeight, leading, defaults) {
                var maxWidth =  defaults.maxWidth + defaults.extentWidth,
                    maxHeight = defaults.maxHeight + defaults.extentHeight,
                    textArr = getTokens(text),
                    line = "",
                    maxLines = defaults.maxLines,
                    rectWidth = 0, rectHeight = 0,
                    lines = [];
                var exceeds;
                for (var i = 0; i < textArr.length; i++) {
                    if (textArr[i].length === 0) {
                        continue;
                    }
                    var token = getTruncatedText(textArr[i], ctx, maxWidth),
                       tokenLen = Math.floor(ctx.measureText(token).width),
                       lineLen = Math.floor(ctx.measureText(line).width),
                       remSpace = maxWidth - lineLen;
                    if (tokenLen > remSpace) {
                        lines.push(line);
                        rectWidth = Math.max(rectWidth, lineLen);
                        rectHeight = fontHeight * (lines.length) + leading * (lines.length-1);
                        //if (rectHeight + fontHeight > maxHeight || lines.length >= maxLines) {
                        if (lines.length >= maxLines) {
                            lines[lines.length -1] += "...";
                            exceeds = true;
                            break;
                        }
                        line = token + " ";
                        lineLen = Math.floor(ctx.measureText(line).width);
                        rectWidth = Math.max(rectWidth, lineLen);
                    } else {
                        line += token + " ";
                        lineLen = Math.floor(ctx.measureText(line).width);
                        rectWidth = Math.max(rectWidth, lineLen);
                    }
                }
                if (!exceeds) {
                    lines.push(line);
                }
                rectHeight = fontHeight * (lines.length) + leading * (lines.length > 0 ? lines.length-1 : 0);
                _contentLines = lines.slice();
                return new Dimension(rectWidth, rectHeight);
            },

            //////////////////////////////////////////////////////////
            // NEW: handle text rows, expand node size to fit text
            //////////////////////////////////////////////////////////
            getTextBoxLines: function (text, ctx, fontHeight, leading, defaults) {
                var maxWidth =  defaults.maxWidth + defaults.extentWidth,
                    //maxHeight = defaults.maxHeight + defaults.extentHeight,
                    //textArr = getTokens(text),
                    textList = getTokensList(text),
                    //line = "",
                    maxLines = defaults.maxLines,
                    rectWidth = 0, rectHeight = 0,
                    lines = [];
                var exceeds;
                for (var k = 0; k < textList.length; k++) {
                    var textArr = textList[k],
                        line = "";
                    for (var i = 0; i < textArr.length; i++) {
                        if (textArr[i].length === 0) {
                            continue;
                        }
                        var token = getTruncatedText(textArr[i], ctx, maxWidth),
                            tokenLen = Math.floor(ctx.measureText(token).width),
                            lineLen = Math.floor(ctx.measureText(line).width),
                            remSpace = maxWidth - lineLen;
                        if (tokenLen > remSpace) {
                            lines.push(line);
                            rectWidth = Math.max(rectWidth, lineLen);
                            rectHeight = fontHeight * (lines.length) + leading * (lines.length-1);
                            //if (rectHeight + fontHeight > maxHeight || lines.length >= maxLines) {
                            if (lines.length >= maxLines) {
                                lines[lines.length -1] += "...";
                                exceeds = true;
                                break;
                            }
                            line = token + " ";
                            lineLen = Math.floor(ctx.measureText(line).width);
                            rectWidth = Math.max(rectWidth, lineLen);
                        } else {
                            line += token + " ";
                            lineLen = Math.floor(ctx.measureText(line).width);
                            rectWidth = Math.max(rectWidth, lineLen);
                        }
                    }
                    if (!exceeds) {
                        lines.push(line);
                    }
                }
                rectHeight = fontHeight * (lines.length) + leading * (lines.length > 0 ? lines.length-1 : 0);
                _contentLines = lines.slice();
                return new Dimension(rectWidth, rectHeight);
            },
            //getDecisionTextBox: function (text, ctx, fontHeight, leading, extent) {
            //    var maxWidth =  constants.contentDecisionSize().WIDTH + extent,// + 10,
            //        maxHeight = constants.contentDecisionSize().HEIGHT,// + 5,
            //        textArr = getTokens(text),
            //        line = "",
            //        maxLines = constants.contentDecisionSize().MAX_LINES,
            //        rectWidth = 0, rectHeight = 0,
            //        lines = [];
            //    var exceeds;
            //    for (var i = 0; i < textArr.length; i++) {
            //        var token = getTruncatedText(textArr[i], ctx, maxWidth),
            //           tokenLen = Math.floor(ctx.measureText(token).width),
            //           lineLen = Math.floor(ctx.measureText(line).width),
            //           remSpace = maxWidth - lineLen;
            //        if (tokenLen > remSpace) {
            //            lines.push(line);
            //            rectWidth = Math.max(rectWidth, lineLen);
            //            rectHeight = fontHeight * lines.length + leading * (lines.length -1);
            //            if (rectHeight + fontHeight > maxHeight || lines.length >= maxLines) {
            //                lines[lines.length -1] += "...";
            //                exceeds = true;
            //                break;
            //            }
            //            line = token + " ";
            //            lineLen = Math.floor(ctx.measureText(line).width);
            //            rectWidth = Math.max(rectWidth, lineLen);
            //        } else {
            //            line += token + " ";
            //            lineLen = Math.floor(ctx.measureText(line).width);
            //            rectWidth = Math.max(rectWidth, lineLen);
            //        }
            //    }
            //    if (!exceeds) {
            //        lines.push(line);
            //    }
            //    rectHeight = fontHeight * lines.length + leading * (lines.length > 0 ? lines.length -1 : 0);
            //    _contentLines = lines.slice();
            //    return new Dimension(rectWidth, rectHeight);
            //},
            getContentLines: function() {
                return _contentLines;
            }

        }
    }
);
