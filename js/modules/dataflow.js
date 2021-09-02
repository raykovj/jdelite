define(['jquery',
        //'jqueryuiscroll',
        'jqueryui',
        'jqueryuictxm',
        'knockout',
        'modules/server/ioHandler',
        'modules/server/directories',
        'modules/html/toolbar',
        'modules/settings/config',
        'modules/actions/frameActions',
        'modules/graph/graphConstants',
        'modules/gallery/components',
        'modules/gallery/iconOptionsPicker',
        'modules/gallery/decisionEnds',
        'modules/flow/flowManager',
        'modules/diagram/mouseInteractor',
        'modules/dialogs/newFlowDialog',
        'modules/dialogs/newFolderDialog',
        'modules/dialogs/openFlowDialog',
        'modules/dialogs/createNodeDialog',
        'modules/dialogs/nodePropsDialog',
        'modules/dialogs/linkPropsDialog',
        'modules/dialogs/aboutDialog',
        'modules/dialogs/infoDialog',
        'modules/dialogs/confirmDialog',
        'modules/dialogs/thumbnailDialog',
        'modules/settings/settingsDialog',
        'modules/settings/settingsActions',
        'modules/geometry/point',
        'modules/util/utils',
        'modules/draw/draw',
        'modules/controller/flowCache'],
    //function($, jqueryuiscroll, jqueryui, jqueryuictxm, ko,
    function($, jqueryui, jqueryuictxm, ko,
             ioHandler,
             directories,
             toolbar,
             config,
             frameActions,
             constants,
             components,
             iconPicker,
             decisionEnds,
             FlowManager,
             MouseInteractor,
             newFlowDialog,
             newFolderDialog,
             openFlowDialog,
             createNodeDialog,
             nodePropsDialog,
             linkPropsDialog,
             aboutDialog,
             infoDialog,
             confirmDialog,
             thumbnailDialog,
             settingsDialog,
             settingsActions,
             Point,
             utils,
             draw,
             flowCache) {

        var self = this,
            _canvas = document.getElementById('canvasId'),
            _canvasTh = document.getElementById('canvasThId'),
            _context = _canvas.getContext('2d'), // 190610
            _cnvContainer = document.getElementById('containerId'),
            _topContainer = document.getElementById('topContainerId'),
            _container = document.getElementById('containerId'),
            _topCtrSelector = $("#topContainerId"),
            _spinnerLevelsSelector = $("#spinnerLevelsId"),
            _spinnerLanesSelector = $("#spinnerLanesId"),
            _confirmDialogSelector = $("#confirmDialogId"),
            _thumbnailDialogSelector = $("#thumbnailDialogId");

        var NO_NAME = "[select 'New' or 'Open' from menus]";
        var _controlPressed = false,
            _shiftPressed = false,
            _controlPressedEdit = false;

        self.accHdrDemoTitle = ko.observable(constants.appTitles().FLOW_TITLE);
        self.accHdrPagesTitle = ko.observable(constants.appTitles().PAGES_TITLE);
        self.accHdrBpelTitle = ko.observable(constants.appTitles().BPEL_TITLE);
        self.accHdrK8sTitle = ko.observable(constants.appTitles().K8S_TITLE);

        self.getCanvas = function() { return _canvas; };
        self.getCanvasTh = function() { return _canvasTh; };
        self.getCanvasContext = function() { return _context; }; // 190610
        self.getCanvasContainer = function() { return _cnvContainer; };
        self.flowManager = new FlowManager(self);
        self.interactor = self.flowManager.getMouseInteractor();
        self.dndHandler = self.flowManager.getDnDHandler();
        self.updateTrigger = ko.observable(false);

        self.getFlowManager = function() { return self.flowManager; };

        var __checkStart = Date.now(),
            __cnxOK = false,
            __initOK = false,
            __timeout = 3000; // vs 4000 in ioHandler

        self.isConnectionOK = ko.observable(__cnxOK);

        self.cnxResultOK = function() { console.log("*** connection OK!!!"); };

        self.cnxResultFAIL = function(xhr) {
            //console.log("*** connection FAIL: "+xhr.readyState+", __cnxOK="+__cnxOK);
            var now = Date.now(),
                diff = now - __checkStart;
            if (diff < __timeout) {
                __cnxOK = false;
                self.showOverlayMessage("No server connection", 500);
            } else {
                __cnxOK = true;
                self.showOverlayMessage("Connected", 500);
            }
            //console.log("cnxResultFAIL, dif = "+diff+", __cnxOK="+__cnxOK);
            self.isConnectionOK(__cnxOK);
            __initOK = true;
            setTimeout(function(){
                console.clear();
                //console.log("*** connection: "+__cnxOK);
                self.updateWindow();
            }, 200);
        };

        self.initOK = function() { return __initOK; };

        $(document).ready(function() {

            //ioHandler.checkMyConnection(self.flowManager);

            // auto-scroll works by default in firefox, but not in chrome
            // this plugin fixes it in chrome, but is still sluggish
            // [jr] the plugin is modified to reflect(?) the current html content
            //$().dndPageScroll();

            //_canvas = document.getElementById('canvasId');
            //var context = _canvas.getContext('2d');
            _context.canvas.width = 0;  // 190610
            _context.canvas.height = 0; // 190610

            newFlowDialog.initDialog(self.flowManager);
            newFolderDialog.initDialog(self.flowManager);
            openFlowDialog.initDialog(self.flowManager);
            settingsDialog.initDialog(self.flowManager);
            createNodeDialog.initDialog(self.flowManager);
            nodePropsDialog.initDialog(self.flowManager);
            linkPropsDialog.initDialog(self.flowManager);
            aboutDialog.initDialog(self.flowManager);
            infoDialog.initDialog(self.flowManager);
            confirmDialog.initDialog(self.flowManager);
            thumbnailDialog.initDialog(self.flowManager);

            toolbar.initButtons(self);
            frameActions.initActions(self);
            settingsActions.initButtons(self);

            $("#canvasId").contextmenu(self.interactor.getContextMenu());
            _topContainer.addEventListener('mousemove', function(event) {
                if (!self.interactor.isOverCanvas(event)) {
                    $("#canvasId").contextmenu("close");
                    self.flowManager.getFlowDiagram().setMousePoint(undefined);
                    //self.flowManager.getDnDHandler().resetDrag();
                    //self.flowManager.paintDiagram();
                }
            });
            _topContainer.addEventListener('mousedown', function(event) {
                // ?
            });
            $("#paletteCtrId").show();

            $("#paletteAccordionId").accordion({
                heightStyle: "fill",
                activate: function(event, ui) {
                    if (ui.newHeader.context.innerText === self.accHdrDemoTitle()) {
                        setApplicationMode(constants.appMode().FLOW_MODE);
                    } else if (ui.newHeader.context.innerText === self.accHdrPagesTitle()) {
                        setApplicationMode(constants.appMode().PAGE_MODE);
                    }
                    //else if (ui.newHeader.context.innerText === self.accHdrBpelTitle()) {
                    //    setApplicationMode(constants.appMode().BPEL_MODE);
                    //} else if (ui.newHeader.context.innerText === self.accHdrK8sTitle()) {
                    //    setApplicationMode(constants.appMode().K8S_MODE);
                    //}
                    //addPageClass();
                    self.updateWindow();
                }
            });
            $("#paletteAccordionId").accordion("option", "icons", { 'header': null, 'headerSelected': null });

            $("#settingsTabId").tabs({
                //event: "mouseover"
            });

            $("#nodePropsTabId").tabs({
                //event: "mouseover"
                activate: function(event ,ui){
                    if (ui.newTab.index() === 1) {
                        $("#nodePropsTabId").css({overflow: 'auto'});
                    } else {
                        $("#nodePropsTabId").css({overflow: 'hidden'});
                    }
                }
            });

            $("#infoTextId").attr('visibility', 'hidden');

            //////// LEVEL/LANE ////////
            _spinnerLevelsSelector.spinner({
                step: 1,
                min: constants.canvasRange().MIN,
                max: constants.canvasRange().MAX,
                numberFormat: "n"
            });
            _spinnerLevelsSelector.spinner("value", constants.initial().LEVELS);
            _spinnerLevelsSelector.spinner('enable');

            _spinnerLanesSelector.spinner({
                step: 1,
                min: 1,
                max: 10,
                numberFormat: "n"
            });
            _spinnerLanesSelector.spinner("value", constants.initial().LANES);
            _spinnerLanesSelector.spinner('enable');

            var _progressBarSelector = $("#progressBarId");
            _progressBarSelector.progressbar({ value: false });
            _progressBarSelector.height(14);
            document.getElementById("topProgressId").style.visibility = 'visible';

            $("#selectFileId").selectmenu({
                style: "dropdown",
                width: 372
            });

            //$(document).tooltip({
            //$(".toolbar-button").tooltip({
            //    position: {
            //        my: "left top+5",
            //        at: "left bottom",
            //        collision: "flipfit"
            //    },
            //    trigger: 'hover',
            //    hide: { delay: 500 },
            //    close: function(event, ui) {
            //        ui.tooltip[0].style.visibility = 'hidden';
            //    }
            //}).on('click', function () {
            //    console.log("*** CLICK ***");
            //    //$('[data-toggle="tooltip"]').blur();
            //    setTimeout(function() {
            //        //$('[data-toggle="tooltip"]').tooltip('hide');
            //        $('[data-toggle="tooltip"]').focusout();
            //        //$(".toolbar-button").focusout();
            //    }, 1100);
            //});

            //$(".toolbar-button").click(function(event, ui) {
            //    console.log("*** CLICK ***");
            //    //document.activeElement.blur();
            //    //setTimeout(function() {
            //        $(".toolbar-button").blur();
            //        //$(".toolbar-button").tooltip('hide');
            //    //}, 1000);
            //});

            //$("[title]:disabled").each(function (ix, el) {
            //    // Since the jQueryUI tooltips don't work on disabled controls we remove them
            //    // and then attempt to add them to the elements label.
            //    var title = el.title;
            //    console.log("*** title = "+title+", el: "+el.id);
            //    el.title = ''; // Clear the title to avoid the browser tooltip
            //
            //    // Look for a Label attached to the element and add the tooltip there.
            //    //$('label[for=' + el.id + ']').attr('title', title).tooltip({
            //    $(this).attr('title', title).tooltip({
            //        content: function () {
            //            // Allows the tooltip text to be treated as raw HTML.
            //            return $(this).prop('title');
            //        },
            //        position: {
            //            my: "left top",
            //            at: "left bottom",
            //            collision: "flipfit"
            //        }
            //    });
            //});

            function getMenuIcon(item) {
                return $('<img>', {
                    style: 'margin: 0 6px -2px -22px;',
                    src: iconPicker.getIconURL(item.value)
                });
            }
            function getMenuButtonIcon(item) {
                return $('<img>', {
                    style: 'margin: 0 6px -2px 0;',
                    src: iconPicker.getIconURL(item.value)
                });
            }
            function createCircleIcon() {
                return $('<span>', {
                    'class': 'circle',
                    style: 'background-color: red'
                });
            }
            $.widget("nodeIcons.iconselectmenu", $.ui.selectmenu, {
                _renderButtonItem: function(item) {
                    var wrapper = $("<div>", {
                        //style: 'margin: 4px 0 0 0;',
                        text: iconPicker.getIconLabel(item.value)
                    });
                    getMenuButtonIcon(item).prependTo(wrapper);
                    return wrapper;
                },
                _renderItem: function(ul, item) {
                    var li = $("<li>"),
                        wrapper = $("<div>", {
                            text: iconPicker.getIconLabel(item.value)
                        });
                    getMenuIcon(item).prependTo(wrapper);
                    return li.append(wrapper).appendTo(ul);
                },
                _renderMenu: function(ul, items) {
                    var that = this,
                        optionItems = iconPicker.getOptionItems(items);
                    $.each(optionItems, function(index, item) {
                        that._renderItemData(ul, item);
                    } );
                },
                refreshButtonItem: function(key, category) {
                    var idx = iconPicker.getIndexValue(key, category);
                    this.element[0].selectedIndex = idx;
                    this.refresh();
                }
            });


            $("#nodeIconItemsId").iconselectmenu()
                .iconselectmenu("menuWidget").addClass("ui-menu-icons customicons");

            $("#settingIconItemsId").iconselectmenu()
                .iconselectmenu("menuWidget").addClass("ui-menu-icons customicons");

            $.widget("settings.schememenu", $.ui.selectmenu, {
                _renderButtonItem: function(item) {
                    var wrapper = $("<div>", {
                        //style: 'margin: 4px 0 0 0;',
                        text: "Default"
                    });
                    return wrapper;
                }
                //_renderItem: function(ul, item) {
                //    var li = $("<li>"),
                //        wrapper = $("<div>", {
                //            text: "Default"
                //        });
                //    return li.append(wrapper).appendTo(ul);
                //}
            });

            $("#settingSchemesId").schememenu()
                .schememenu("menuWidget").addClass("ui-menu-icons schememenu");

        });

        self.nodeEmojiItems = ko.pureComputed(function() {
            return iconPicker.getNodeIconOptions();
        });
        //////////////

        //var _progressBarElem = document.getElementById("progressBarId"),
        //    _progressBarOffsetElem = document.getElementById("progressBarOffsetId");
        self.isProgressBarVisible = ko.observable(false);
        self.isProgressBarVisible.extend({ notify: 'always' });
        self.setProgressBarVisible = function(bValue) {
            self.isProgressBarVisible(bValue);
            //_progressBarElem.style.visibility = bValue ? 'visible' : 'hidden';
            //_progressBarOffsetElem.style.visibility = bValue ? 'visible' : 'hidden';
        };

        // IMPORTANT !!! set the triangle icon for open/close the tabs
        //setTimeout(function() {
        //    $("#paletteAccordionId").accordion( "option", "icons",
        //        { "header": "ui-icon-triangle-1-e", "activeHeader": "ui-icon-triangle-1-s" } );
        //}, 200);

        self.showPageMode = ko.observable(config.hasPageMode());

        self.isCanvasVisible = ko.observable(false);
        self.setCanvasVisible = function(bValue) {
            self.isCanvasVisible(bValue);
        };

        function setApplicationMode(appMode) {
            //console.log("APP MODE = "+appMode);
            config.setAppMode(appMode);
            if (appMode !== constants.appMode().FLOW_MODE) {
                // TODO
                //forceFlowDirection(constants.flow().VERTICAL);
            }
            self.flowManager.getSelectionManager().clearSelections();
            self.flowManager.clearNamesCache();
            // TODO
            //self.flowManager.clearDiagram();
            //toolbar.initButtons(self);
            //frameActions.initActions(self);
            //settingsActions.initButtons(self);
        }

        self.scaleValue = ko.observable(config.getScale());
        var slider = document.getElementById("scaleId");
        slider.oninput = function() {
            config.setScale(this.value/constants.scale().FACTOR);
            self.scaleValue(config.getScale());
            self.flowManager.clearClipboard();
            self.flowManager.getFlowDiagram().clearCanvas();
            self.flowManager.paintDiagram();
        };
        slider.onchange = function() {
            self.flowManager.refreshDiagramOnEdit();

        };

        self.editModeText = ko.observable(config.isEditMode() ? constants.editModeText().EDIT : constants.editModeText().VIEW);
        self.setEditModeText = function(mode) {
            if (mode === constants.editMode().EDIT_ALL) {
                self.editModeText(constants.editModeText().EDIT);
            } else {
                self.editModeText(constants.editModeText().VIEW);
            }
        };

        self.setTooltipBox = function(text, point) {
            if (text.length > 0 && config.isEditMode()) {
                //self.flowManager.paintDiagram();
                draw.drawTooltip(_context, _canvas.getBoundingClientRect(), point, text);
            }
        };
        self.showTooltipBox = function(b) {
            //if (b) { $("#tooltipBoxId").show(); }
            //else {  $("#tooltipBoxId").hide(); }
        };

        self.getCurrentFileName = function() {
            var name = self.flowManager.getFileName();
            var idx = name.indexOf('.json');
            return name.substring(0, idx);
        };

        //// CONTAINER RESIZE

        var _blockBarElem = document.getElementById("blockResizeId"),
            _blockResizeBarVisible,
            _extendAcrossBlockSltr = $("#extendBlockAcrossId"),
            _extendAlongBlockSltr = $("#extendBlockAlongId"),
            _shrinkAcrossBlockSltr = $("#shrinkBlockAcrossId"),
            _shrinkAlongBlockSltr = $("#shrinkBlockAlongId");

        //_extendAcrossBlockSltr.hide();
        //_extendAlongBlockSltr.hide();
        //_shrinkAcrossBlockSltr.hide();
        //_shrinkAlongBlockSltr.hide();

        self.showBlockResizeBar = function(node) {
            //self.repaintDiagram();
            var blockRect = node.getExpandedShape(),
                factor = config.getScale();
            _blockBarElem.style.left = _canvas.getBoundingClientRect().left + blockRect.x*factor + 'px';
            _blockBarElem.style.top = _canvas.getBoundingClientRect().top + blockRect.y*factor - 24 + 'px';
            _extendAcrossBlockSltr.attr('disabled', !config.isEditMode() || !node.canExtendAcross());
            _extendAlongBlockSltr.attr('disabled', !config.isEditMode() || !node.canExtendAlong());
            _shrinkAcrossBlockSltr.attr('disabled', !config.isEditMode() || !node.canShrinkAcross());
            _shrinkAlongBlockSltr.attr('disabled', !config.isEditMode() || !node.canShrinkAlong());
            _blockBarElem.style.visibility = 'visible';
        };

        self.doResizeContainer = function(resizeParam) {
            var selections = self.getFlowManager().getSelectionManager().getSelections();
            //if (selections && selections.length === 1) {
                if (selections[0].getFlowType() === constants.flowType().CONTAINER) {
                    selections[0].resizeOutline(resizeParam);
                }
            //}
            _blockBarElem.style.visibility = 'hidden';
            _blockResizeBarVisible = false;
        };

        self.isBlockResizeBarVisible = function() { return _blockResizeBarVisible; };

        self.hideContainerBar = function() {
            _blockBarElem.style.visibility = 'hidden';
        };

        function updateContainerResizeButtons(direction) {
            if (direction === constants.flow().VERTICAL) {
                _extendAcrossBlockSltr.removeClass('block-extendV');
                _extendAcrossBlockSltr.addClass('block-extendH');

                _extendAlongBlockSltr.removeClass('block-extendH');
                _extendAlongBlockSltr.addClass('block-extendV');

                _shrinkAcrossBlockSltr.removeClass('block-shrinkV');
                _shrinkAcrossBlockSltr.addClass('block-shrinkH');

                _shrinkAlongBlockSltr.removeClass('block-shrinkH');
                _shrinkAlongBlockSltr.addClass('block-shrinkV');
            } else if (direction === constants.flow().HORIZONTAL) {
                _extendAcrossBlockSltr.removeClass('block-extendH');
                _extendAcrossBlockSltr.addClass('block-extendV');

                _extendAlongBlockSltr.removeClass('block-extendV');
                _extendAlongBlockSltr.addClass('block-extendH');

                _shrinkAcrossBlockSltr.removeClass('block-shrinkH');
                _shrinkAcrossBlockSltr.addClass('block-shrinkV');

                _shrinkAlongBlockSltr.removeClass('block-shrinkV');
                _shrinkAlongBlockSltr.addClass('block-shrinkH');
            }
        }

        //// SWITCH RESIZE

        var _switchBarElem = document.getElementById("switchResizeId"),
            _switchResizeBarVisible,
            _extendAcrossSwitchSltr = $("#extendSwitchAcrossId"),
            _shrinkAcrossSwitchSltr = $("#shrinkSwitchAcrossId");

        self.showSwitchResizeBar = function(node) {
            var menuBarPos = node.getMenuBarPosition(),
                factor = config.getScale();
            _switchBarElem.style.left = _canvas.getBoundingClientRect().left + menuBarPos.x*factor + 'px';
            _switchBarElem.style.top = _canvas.getBoundingClientRect().top + menuBarPos.y*factor - 24 + 'px';
            _extendAcrossSwitchSltr.attr('disabled', !config.isEditMode() || !node.canExtendAcross());
            _shrinkAcrossSwitchSltr.attr('disabled', !config.isEditMode() || !node.canShrinkAcross());
            _switchBarElem.style.visibility = 'visible';
        };

        self.doResizeSwitch = function(resizeParam) {
            var selections = self.getFlowManager().getSelectionManager().getSelections();
            //if (selections && selections.length === 1) {
                if (selections[0].getFlowType() === constants.flowType().SWITCH) {
                    selections[0].resizeOutline(resizeParam);
                }
            //}
            _switchBarElem.style.visibility = 'hidden';
            _switchResizeBarVisible = false;
        };

        self.isSwitchResizeBarVisible = function() { return _switchResizeBarVisible; };

        self.hideSwitchBar = function() {
            _switchBarElem.style.visibility = 'hidden';
        };

        function updateSwitchResizeButtons(direction) {
            if (direction === constants.flow().VERTICAL) {
                _extendAcrossSwitchSltr.removeClass('block-extendV');
                _extendAcrossSwitchSltr.addClass('block-extendH');

                _shrinkAcrossSwitchSltr.removeClass('block-shrinkV');
                _shrinkAcrossSwitchSltr.addClass('block-shrinkH');
            } else if (direction === constants.flow().HORIZONTAL) {
                _extendAcrossSwitchSltr.removeClass('block-extendH');
                _extendAcrossSwitchSltr.addClass('block-extendV');

                _shrinkAcrossSwitchSltr.removeClass('block-shrinkH');
                _shrinkAcrossSwitchSltr.addClass('block-shrinkV');
            }
        }

        //self.isPageMode = ko.observable(config.hasPageMode());

        //function addPageClass() {
        //    if (config.hasPageMode()) {
        //        $("#paletteAccordionId").removeClass('accordion-props');
        //        $("#paletteAccordionId").addClass('accordion-props-page');
        //    }
        //}

        //self.getPaletteAccordionClass = ko.pureComputed(function() {
        //    console.log("PALETTE CSS: "+(config.hasPageMode() ? "accordion-props-page" : "accordion-props"));
        //    return config.hasPageMode() ? "accordion-props-page" : "accordion-props";
        //}, this);

        //////////////////////////
        // OPEN/SAVE file navigation
        //////////////////////////

        self.currentPath = ko.observable();
        self.fsContentList = ko.observableArray();
        self.selectedPath = ko.observable();
        self.isOpenMode = ko.observable();
        self.isSaveMode = ko.observable();

        var _workDir = "",
            _workDirCache = "",
            _fsMode = constants.fsDialogMode().NONE,
            DELIMITER = '/',
            RENDERED_DELIM = '\\',
            _selectedDir,
            _selectedFile,
            _hasSelectedRow = false,
            _currentFSContent = {},
            _filesOnly = false,
            _selectedDirField = document.getElementById('selectedDirId');

        self.setFSDialogMode = function(mode) {
            //console.log("*** FS MODE: "+mode);
            _fsMode = mode;
            if (mode !== constants.fsDialogMode().NONE) {
                _workDirCache = _workDir;
                _isNewAction = false;
            }
            if (mode === constants.fsDialogMode().OPEN) {
                self.isOpenMode(true);
                self.isSaveMode(false);
            } else if (mode === constants.fsDialogMode().SAVE) {
                self.isOpenMode(false);
                self.isSaveMode(true);
            }
        };
        self.getFSDialogMode = function() { return _fsMode; };

        self.restoreWorkDir = function() {
            self.setWorkDir(_workDirCache);
            _selectedDirField.value = renderDirDisplay(_workDir);
            _selectedDirField.blur();

        };

        self.setWorkDir = function(dir) {
            _workDir = dir;
            _selectedDir = "";
            _selectedDirField.value = renderDirDisplay(dir);
            self.currentPath(renderDirDisplay(dir));
            $("#selectedDirId").focus();
            $("#dirsBtnUpId").attr('disabled', _workDir.length <= 1);
            _selectedDirField.setAttribute('title', renderDirDisplay(_workDir));
            document.getElementById("locationForNewDirId").setAttribute('title', renderDirDisplay(_workDir));
            $("#dirsBtnDownId").attr('disabled', _selectedFile || !_selectedDir);
            _selectedDirField.blur();
        };
        self.getWorkDir = function() { return _workDir; };
        //self.getRenderedWorkDir = function() { return renderDirDisplay(_workDir); };

        $("#dirsBtnUpId").attr('disabled', _workDir.length <= 1);
        $("#deleteFSId").attr('disabled', !config.isEditMode() || !_hasSelectedRow);

        self.getSelectedDir = function() { return _selectedDir; };

        self.onDirTableClick = function(event) {
            _hasSelectedRow = false;
            var selectedLabel = event.target.innerText,
                table = document.getElementById('dirsTableId'),
                rows = table.getElementsByTagName('tr');
            _selectedDir = undefined;
            _selectedFile = undefined;
            for (var i = 0; i < rows.length; i++) {
                var value = rows[i].cells[0].getElementsByTagName('span')[0].innerHTML;
                if (value === selectedLabel) {
                    _hasSelectedRow = true;
                    rows[i].cells[0].className += " selectedTableRow";
                    if (rows[i].cells[0].getAttribute('fstype') === 'dir') {
                        _selectedDir = event.currentTarget.id;
                    } else if (rows[i].cells[0].getAttribute('fstype') === 'file') {
                        _selectedFile = event.currentTarget.id;
                    }
                } else {
                    rows[i].cells[0].classList.remove('selectedTableRow');
                }
            }
            //console.log("**** _selectedDir: "+_selectedDir+", _selectedFile: "+_selectedFile);
            $("#deleteFSId").attr('disabled', !config.isEditMode() || !_hasSelectedRow);
            $("#dirsBtnDownId").attr('disabled', _selectedFile || !_selectedDir);
        };

        function unselectTableRows() {
            var table = document.getElementById('dirsTableId'),
                rows = table.getElementsByTagName('tr');
            for (var i = 0; i < rows.length; i++) {
                rows[i].cells[0].classList.remove('selectedTableRow');
            }
        }

        var _pathToDelete;
        self.deleteFSItem = function() {
            var msg;
            if (_selectedFile) {
                _pathToDelete = _selectedFile;
                msg = "The file '"+_pathToDelete+"' will be removed. Do you want to continue?";

            } else if (_selectedDir) {
                _pathToDelete = _selectedDir;
                msg = "The folder '"+_pathToDelete+"' and all of its content will be removed. Do you want to continue?";
            }
            self.showConfirmMessage(msg, "Confirm to Delete");
            _confirmDialogSelector.on("dialogclose", function() {
                if (self.getConfirmFlag() === constants.bValue().TRUE) {
                    if (_selectedFile) {
                        self.getFlowManager().deleteFile(_pathToDelete);
                    } else if (_selectedDir) {
                        self.getFlowManager().deleteFolder(_pathToDelete);
                    }
                    self.setConfirmFlag(constants.bValue().FALSE);
                    $("#deleteFSId").attr('disabled', true);
                }
            });
        };

        self.onDirTableDblClick = function(event) {
            self.onDirTableClick(event);
            if (_selectedDir) {
                self.updateMainFSLocation();
                self.flowManager.getDirContent();
                _selectedDirField.blur();
            } else if (_selectedFile) {
                self.flowManager.openDiagram(_selectedFile);
                $("#openFlowDialogId").dialog('close');
            }
        };

        self.updateMainFSLocation = function() {
            if (_selectedDir) {
                self.setWorkDir(_selectedDir);
            }
            $("#deleteFSId").attr('disabled', true);
            //self.flowManager.getFilesList();
        };

        self.goOneDirBack = function() {
            unselectTableRows();
            var newDir ="";
            if (_workDir.length > 1 && _workDir.indexOf(DELIMITER) < 0) {
                newDir = "";
            } else if (_workDir.length > 1 && _workDir.split(DELIMITER).length > 1) {
                var last = _workDir.lastIndexOf(DELIMITER);
                newDir = _workDir.slice(0, last);
            }
            self.setWorkDir(newDir);
            _selectedDirField.value = renderDirDisplay(_workDir);
            self.flowManager.getDirContent();
            $("#deleteFSId").attr('disabled', true);
            _selectedDirField.blur();
        };

        self.setDirsList = function(content, type) {
            // content is formatted JSON
            //console.log("### CONTENT: "+JSON.stringify(content, null, 2));
            _currentFSContent = content;
            directories.parseFoldersToList(content);
            if (type !== constants.fsFetchType().CREATE) {
                var parentDir = directories.getParentPath(),
                    dirItems = directories.getDirectories();
                self.setWorkDir(parentDir);
                self.fsContentList(dirItems);
            }
        };

        self.setFolderContent = function(content, type) {
            //console.log("### CONTENT: "+JSON.stringify(content, null, 2));
            _currentFSContent = content;
            self.fsContentList([]);
            directories.parseFullContent(filterFilesType(content));
            if (type !== constants.fsFetchType().CREATE) {
                var parentDir = directories.getParentPath(),
                    allItems = directories.getFullContent(),
                    filteredItems = filterFilesList(directories.getFilesLabels());
                self.filesList(filteredItems);
                self.setWorkDir(parentDir);
                self.fsContentList(allItems);
            }
            //$("#newFlowDialogId").dialog("open");
        };

        function renderDirDisplay(dir) {
            if (dir === "" || dir === DELIMITER) {
                //return DELIMITER;
                return RENDERED_DELIM;
            }
            var rendered = dir.replace('/', '\\');
            //if (dir.startsWith(DELIMITER)) {
            if (rendered.startsWith(RENDERED_DELIM)) {
                //return dir + DELIMITER;
                return rendered + RENDERED_DELIM;
            } else {
                //return DELIMITER + dir + DELIMITER;
                return RENDERED_DELIM + rendered + RENDERED_DELIM;
            }
        }

        self.filesTypes = ko.observableArray([constants.fileTypes().JSON, constants.fileTypes().ALL]);
        self.selectedFileType = ko.observable(constants.fileTypes().JSON);

        self.onFileTypeChange = function(event) {
            var filter = self.selectedFileType().split('.').pop();
            //console.log("FILE TYPE: "+filter);
            if ($("#openFlowDialogId").dialog('isOpen')) {
                self.flowManager.getDirContent();
            }
        };

        function filterFilesList(list) {
            if (self.selectedFileType() === constants.fileTypes().ALL) { return list; }
            var files = [],
                filter = self.selectedFileType().split('.').pop();
            list.forEach(function(file) {
                if (file.split('.').pop() === filter) { files.push(file); }
            });
            return files;
        }

        function filterFilesType(fsContent) {
            if (Object.keys(fsContent).length == 0 || self.selectedFileType() === constants.fileTypes().ALL) { return fsContent; }
            var content = {},
                fsFiles = fsContent.files,
                filter = self.selectedFileType().split('.').pop(),
                filteredFiles = [];
            content.path = fsContent.path;
            content.dirs = fsContent.dirs;
            if (fsFiles && fsFiles.length > 0) {
                fsFiles.forEach(function(file) {
                    if (file.split('.').pop() === filter) { filteredFiles.push(file); }
                });
                content.files = filteredFiles;
            }
            return content;
        }

        /////// SCHEME //////
        self.settingsSchemes = ko.observableArray(["Default"]);
        self.selectedScheme = ko.observable("Default");

        self.onSchemeChange = function(event) {
            var filter = self.selectedScheme().split('.').pop();
            //console.log("FILE TYPE: "+filter);
            //if ($("#openFlowDialogId").dialog('isOpen')) {
            //    self.flowManager.getDirContent();
            //}
        };



        ////////////////////
        ////// new FILE ////
        ////////////////////

        var _isNewAction;
        self.setNewAction = function(b) { _isNewAction = b; };
        self.isNewAction = function() { return _isNewAction; };

        //self.setFSSelectionMode = function(selMode) { _fsSelectionMode = selMode; };
        //self.getFSSelectionMode = function() { return _fsSelectionMode; };

        self.filesList = ko.observableArray();
        var _filesList = [];
        self.setFilesList = function(files) {
            _filesList = files;
            self.filesList(files);
            $("#selectFileId").selectmenu("refresh");
            if (!_filesOnly) {
                // open dialog: filter file types
                self.filesList(filterFilesList(files));
            }
            if (_isNewAction) {
                $("#newFlowDialogId").dialog("open");
            } else if (_filesOnly) {
                directories.parseFilesToList(files);
                var fileItems = directories.getFilesList();
                self.updateTrigger(!self.updateTrigger());
                self.fsContentList(fileItems);
            }
        };

        self.selectedFile = ko.observable();
        //self.getSelectedFile = function() { return self.selectedFile(); };
        self.getSelectedFile = function() {
            return self.isConnectionOK() ?
            _selectedFile : self.selectedFile();
        };

        $("#selectFileId").on( "selectmenuselect", function( event, ui ) {
            //console.log("selectmenuselect: "+ui.item.value+", "+ui.item.label);
            self.flowManager.openDiagram(ui.item.value);
            $("#openFlowDialogId").dialog("close");
        } );

        self.isInputInvalid = ko.observable(false);
        self.validateMessage = ko.observable("");
        self.newFSNameValue = ko.observable("");
        self.nameValueEmpty = ko.observable("");

        self.validateFSName = function(event, fromFolders) {
            var name = self.newFSNameValue().trim(),
                fsItems = fromFolders ? directories.getDirectoriesLabels() : self.filesList();
            self.nameValueEmpty(name.length === 0);
            var oldVal = self.isInputInvalid();
            var isDuplicate = utils.containsFSName(fsItems, name); //self.filesList().contains(name);
            var isValid = utils.isFSNameValid(self.newFSNameValue());
            var newVal = name.length > 0 &&  (!isValid || isDuplicate);
            self.isInputInvalid(newVal);
            if (oldVal && !newVal) {
                $("#newFileNameId").blur();
                $("#newFileNameId").focus();
            }
            $("#newFlowButtonOK").button("option","disabled", (self.isInputInvalid() || self.nameValueEmpty()));
            $("#newFolderButtonOK").button("option","disabled", (self.isInputInvalid() || self.nameValueEmpty()));
            if (!isValid) {
                self.validateMessage("Only alphanumeric characters, dots, dashes, and underscores");
            } else if (isDuplicate) {
                self.validateMessage("Duplicate name");
            } else {
                self.validateMessage("");
            }
            if (event && name.length > 0 && isValid && event.code === 'Enter') {
                if (_isNewAction) {
                    newFlowDialog.createNewDiagram(self.flowManager);
                    $("#newFlowDialogId").dialog("close");
                } else {
                    newFolderDialog.createNewFolder(self.flowManager);
                    $("#newFolderDialogId").dialog("close");
                }
            }
        };

        $("#newFlowDialogId").on("dialogopen", function(event, ui) {
            self.validateFSName();
        });
        $("#newFlowDialogId").on("dialogclose", function(event, ui) {
            self.newFSNameValue("");
        });

        // SAVE AS...
        self.saveAsInputInvalid = ko.observable(false);
        self.saveAsMessage = ko.observable("");
        self.saveAsFileNameValue = ko.observable("");
        self.saveAsNameEmpty = ko.observable("");

        self.validateSaveAsFileName = function(event) {
            var name = self.saveAsFileNameValue().trim();
            self.saveAsNameEmpty(name.length === 0);
            var oldVal = self.saveAsInputInvalid();
            var isDuplicate = name !== self.getCurrentFileName() && utils.containsFSName(self.filesList(), name);
            var isValid = utils.isFSNameValid(self.saveAsFileNameValue());
            var newVal = name.length > 0 &&  (!isValid || isDuplicate);
            self.saveAsInputInvalid(newVal);
            if (oldVal && !newVal) {
                $("#saveAsFileNameId").blur();
                $("#saveAsFileNameId").focus();
            }
            $("#saveAsButtonSave").button("option","disabled", (self.saveAsInputInvalid() || self.saveAsNameEmpty()));
            if (!isValid) {
                self.saveAsMessage("Only alphanumeric characters, dots, dashes, and underscores");
            } else if (isDuplicate) {
                self.saveAsMessage("Duplicate name");
            } else {
                self.saveAsMessage("");
            }
            if (name.length > 0 && isValid && event.code === 'Enter') {
                //??
            }
        };

        // link props
        var _propsLink = ko.observable();
        self.propsLinkSourceName = ko.observable();
        self.propsLinkSourceLabel = ko.observable();
        self.propsLinkTargetName = ko.observable();
        self.propsLinkTargetLabel = ko.observable();
        self.propsLinkLabel = ko.observable();
        //var _propsLinkLabelValue;
        self.getPropsLink = function() { return _propsLink(); };
        //self.getPropsLinkLabelValue = function() { return _propsLinkLabelValue; };
        self.getPropsLinkLabelValue = function() { return self.propsLinkLabel(); };

        self.showLinkProps = function(link) {
            _propsLink(link);
            self.propsLinkSourceName(_propsLink().getLinkSourcePortName());
            self.propsLinkSourceLabel(_propsLink().getLinkSourcePortLabel());
            self.propsLinkTargetName(_propsLink().getLinkTargetPortName());
            self.propsLinkTargetLabel(_propsLink().getLinkTargetPortLabel());
            self.propsLinkLabel(_propsLink().getLinkLabel());
            $("#linkPropsDialogId").dialog("open");
        };

        self.editPropsLinkLabel = function(event) {
            self.propsLinkLabel(document.getElementById('propsLinkLabelId').value);
        };

        //self.showLinkPropSrcName = function(event){
        //    console.log("SHOW: rowIndex = "+rowNum+", cellNum = "+cellNum);
        //    return event.target.parentNode.rowIndex === 0 && event.target.cellIndex === 1;
        //};

        // node props
        self.propsNodeInputs = ko.observableArray();
        var _propsNodeInputsIdx,
            _propsNodeInputsValue;
        self.getPropsNodeInputsIdx = function() { return _propsNodeInputsIdx; };
        self.getPropsNodeInputsValue = function() { return _propsNodeInputsValue; };

        self.propsNodeOutputs = ko.observableArray();
        var _propsNodeOutputsIdx,
            _propsNodeOutputsValue;
        self.getPropsNodeOutputsIdx = function() { return _propsNodeOutputsIdx; };
        self.getPropsNodeOutputsValue = function() { return _propsNodeOutputsValue; };

        self.propsNodeRefInputs = ko.observableArray();
        var _propsNodeRefInputsIdx,
            _propsNodeRefInputsValue;
        self.getPropsNodeRefInputsIdx = function() { return _propsNodeRefInputsIdx; };
        self.getPropsNodeRefInputsValue = function() { return _propsNodeRefInputsValue; };

        self.propsNodeRefOutputs = ko.observableArray();
        var _propsNodeRefOutputsIdx,
            _propsNodeRefOutputsValue;
        self.getPropsNodeRefOutputsIdx = function() { return _propsNodeRefOutputsIdx; };
        self.getPropsNodeRefOutputsValue = function() { return _propsNodeRefOutputsValue; };

        var _propsNode = ko.observable();
        self.getPropsNode = function() { return _propsNode(); };
        self.showNodeProps = function(node) {
            _propsNode(node);
            iconPicker.setNodeCategory(node.getNodeCategory());
            self.propsNodeInputs(_propsNode().getInputPortsFullNames());
            self.propsNodeOutputs(_propsNode().getOutputPortsFullNames());
            self.propsNodeRefInputs(_propsNode().getRefInPortsFullNames());
            self.propsNodeRefOutputs(_propsNode().getRefOutPortsFullNames());
            $("#nodePropsDialogId").dialog("open");

            //$('#select-menu-id').selectmenu('instance')._renderItem = function(event, ui) {
            //     override with custom logic for rendering each select option
            //}
            //$('#nodeIconItemsId').selectmenu('instance')._renderButtonItem("emojiOrange");
            //     override with custom logic for rendering each select option
            //}
        };

        self.editPropsNodeInputLabel = function(event) {
            _propsNodeInputsIdx = event.target.parentNode.parentNode.rowIndex;
            var table = document.getElementById('nodeInputsTableId'),
                rows = table.getElementsByTagName('tr');
            _propsNodeInputsValue = rows[_propsNodeInputsIdx].cells[1].getElementsByTagName('input')[0].value;
        };

        self.editPropsNodeOutputLabel = function(event) {
            _propsNodeOutputsIdx = event.target.parentNode.parentNode.rowIndex;
            var table = document.getElementById('nodeOutputsTableId'),
                rows = table.getElementsByTagName('tr');
            _propsNodeOutputsValue = rows[_propsNodeOutputsIdx].cells[1].getElementsByTagName('input')[0].value;
        };

        self.editPropsNodeRefInputLabel = function(event) {
            _propsNodeRefInputsIdx = event.target.parentNode.parentNode.rowIndex;
            var table = document.getElementById('nodeRefInputsTableId'),
                rows = table.getElementsByTagName('tr');
            _propsNodeRefInputsValue = rows[_propsNodeRefInputsIdx].cells[1].getElementsByTagName('input')[0].value;
        };

        self.editPropsNodeRefOutputLabel = function(event) {
            _propsNodeRefOutputsIdx = event.target.parentNode.parentNode.rowIndex;
            var table = document.getElementById('nodeRefOutputsTableId'),
                rows = table.getElementsByTagName('tr');
            _propsNodeRefOutputsValue = rows[_propsNodeRefOutputsIdx].cells[1].getElementsByTagName('input')[0].value;
        };

        // EDIT node name
        self.isEditNameInvalid = ko.observable(false);
        self.editNameValue = ko.observable("");
        self.validateNameMessage1 = ko.observable("");
        self.validateNameMessage2 = ko.observable("");
        var _oldName;
        self.setOldName = function(oldName) {
            _oldName = oldName;
        };

        self.validateEditName = function(event) {
            var newName = self.editNameValue().trim();
            if (newName.length > 0) {
                var allNames = utils.getAllNames(self.flowManager.getNodeNamesMap());
                var isValid = newName === _oldName || utils.isNewNodeNameValid(newName, allNames);
                self.isEditNameInvalid(!isValid);
            } else {
                self.isEditNameInvalid(true);
            }
            if (!isValid) {
                self.validateNameMessage1("Only alphanumericals, dots, dashes ");
                self.validateNameMessage2("and underscores");
            } else {
                self.validateNameMessage1("");
                self.validateNameMessage2("");
            }
        };

        // EDIT link label
        self.isLinkLabelInvalid = ko.observable(false);
        //self.linkLabelValue = ko.observable("");
        self.validateLinkMessage = ko.observable("");
        var _oldLinkLabel;
        self.setOldLinkLabel = function(oldLabel) {
            _oldLinkLabel = oldLabel;
        };

        self.validateLinkLabel = function(event) {
            //var newLabel = self.linkLabelValue().trim();
            var newLabel = self.propsLinkLabel().trim();
            if (newLabel.length > 0) {
                var allLabels = utils.getAllLinkLabels(self.flowManager.getLinkLabelsMap());
                var isValid = newLabel === _oldLinkLabel || utils.isNewLinkLabelValid(newLabel, allLabels);
                self.isLinkLabelInvalid(!isValid);
            } else {
                self.isLinkLabelInvalid(false);
            }
            if (!isValid) {
                self.validateLinkMessage("Only alphanumericals, dots, dashes, underscores and spaces");
            } else {
                self.validateLinkMessage("");
            }
        };

        self.pictureURLValue = ko.observable("");
        self.isPictureURLInvalid = ko.observable(false);
        // TODO: url validation ???
        self.validatePictureURL = function(event) {
            self.isPictureURLInvalid(false);
        };

        // NEW node name & DECISION dialog
        var _decisionRun = constants.decisionRun().NONE,
            _editedDecisionNode = undefined;
        self.showNewFileName = ko.observable();
        self.showEditedInfo = ko.observable();
        self.showDecisionInfo = ko.observable();

        self.decisionInputPicture = ko.observable();
        self.decisionEndsPicture = ko.observable();

        self.isNodeNameInvalid = ko.observable(false);
        self.newNodeNameValue = ko.observable("");
        self.invalidNameMessage = ko.observable("");
        self.newDecisionInput = ko.observable(decisionEnds.getCurrentDecisionInput());
        self.newDecisionEnds = ko.observable(decisionEnds.getCurrentDecisionEnds());

        self.editedDecisionNodeName = ko.observable("???");

        self.setDecisionRun = function(node, run) {
            //self.updateTrigger(!self.updateTrigger());
            _decisionRun = run;
            if (run === constants.decisionRun().CREATE) {
                //var flowType = self.flowManager.getFlowController().getSelectedFlowType();
                var flowType = flowCache.getSelectedFlowType();
                self.showNewFileName(true);
                self.showEditedInfo(false);
                self.showDecisionInfo(flowType === constants.flowType().DECISION);
            } else if (run === constants.decisionRun().EDIT) {
                _editedDecisionNode = node;
                //self.editedDecisionNodeName(node.getName());
                decisionEnds.setCurrentInput(node.getInput());
                decisionEnds.setCurrentEnds(node.getEnds());
                //self.editedDecisionNodeName(node.getName()+": "+decisionEnds.getCurrentDecisionInput()+"//"+decisionEnds.getCurrentDecisionEnds());
                self.editedDecisionNodeName(node.getName());
                self.newDecisionInput(decisionEnds.getCurrentDecisionInput());
                self.newDecisionEnds(decisionEnds.getCurrentDecisionEnds());
                self.decisionInputPicture(decisionEnds.getCurrentInputPicture());
                self.decisionEndsPicture(decisionEnds.getCurrentEndsPicture());
                self.showNewFileName(false);
                self.showEditedInfo(true);
                self.showDecisionInfo(true);
            }
        };
        self.getEditedDecisionNode = function() { return _editedDecisionNode; };
        function getEditedDecisionNodeName() {
            return (_editedDecisionNode ? _editedDecisionNode.getName() : "[none]");
            //return (_editedDecisionNode ? _editedDecisionNode.getName() : "[none]") +": "+
            //    decisionEnds.getCurrentDecisionInput()+"//"+decisionEnds.getCurrentDecisionEnds();
        }
        self.getDecisionRun = function() { return _decisionRun; };

        self.validateNodeName = function(event) {
            var newName = self.newNodeNameValue().trim();
            //var flowType = self.flowManager.getFlowController().getSelectedFlowType();
            var flowType = flowCache.getSelectedFlowType();
            if (newName.length > 0) {
                var isValid = utils.isNodeNameValid(newName);
                var allNames = utils.getAllNames(self.flowManager.getNodeNamesMap());
                var isDuplicate = utils.isNodeNameDuplicate(newName, allNames);
                self.isNodeNameInvalid(!isValid || isDuplicate);
                if (isValid && !isDuplicate && event.code === 'Enter') {
                    createNodeDialog.proceed(self.flowManager);
                    $("#newNodeDialogId").dialog("close");
                    return;
                }
            }
            $("#newNodeButtonOK").button("option","disabled", (self.isNodeNameInvalid() || newName.length == 0));
            if (!isValid) {
                self.invalidNameMessage("Only alphanumeric characters, dots, dashes, and underscores");
            } else if (isDuplicate) {
                self.invalidNameMessage("Duplicate name");
            } else {
                self.invalidNameMessage("");
            }
        };

        self.getDecisionIcon = function() {
            self.updateTrigger(!self.updateTrigger());
            return decisionEnds.getDecisionIcon();
        };

        self.resetDecisionIndices = function() {
            self.updateTrigger(!self.updateTrigger());
            decisionEnds.resetCurrentInputIndex();
            decisionEnds.resetCurrentEndsIndex();
            self.decisionInputPicture(decisionEnds.getCurrentInputPicture());
            self.decisionEndsPicture(decisionEnds.getCurrentEndsPicture());
            // TODO
            self.newDecisionInput(decisionEnds.getCurrentDecisionInput());
            self.newDecisionEnds(decisionEnds.getCurrentDecisionEnds());
            //console.log("### resetDecisionIndices: "+decisionEnds.getCurrentDecisionEnds());
        };

        self.moveDecisionInputNext = function() {
            self.updateTrigger(!self.updateTrigger());
            decisionEnds.moveInputNext();
            self.newDecisionInput(decisionEnds.getCurrentDecisionInput());
            self.decisionInputPicture(decisionEnds.getCurrentInputPicture());
            self.decisionEndsPicture(decisionEnds.getCurrentEndsPicture());
            var newName = self.newNodeNameValue().trim();
            //self.editedDecisionNodeName(decisionEnds.getCurrentDecisionEnds());
            self.editedDecisionNodeName(getEditedDecisionNodeName());
            $("#newNodeButtonOK").button("option", "disabled",
                self.getDecisionRun() !== constants.decisionRun().EDIT && (self.isNodeNameInvalid() || newName.length == 0));
        };
        self.moveDecisionInputPrev = function() {
            self.updateTrigger(!self.updateTrigger());
            decisionEnds.moveInputPrevious();
            self.newDecisionInput(decisionEnds.getCurrentDecisionInput());
            self.decisionInputPicture(decisionEnds.getCurrentInputPicture());
            self.decisionEndsPicture(decisionEnds.getCurrentEndsPicture());
            var newName = self.newNodeNameValue().trim();
            self.editedDecisionNodeName(getEditedDecisionNodeName());
            $("#newNodeButtonOK").button("option", "disabled",
                self.getDecisionRun() !== constants.decisionRun().EDIT && (self.isNodeNameInvalid() || newName.length == 0));
        };

        self.moveDecisionEndsNext = function() {
            self.updateTrigger(!self.updateTrigger());
            decisionEnds.moveEndsNext();
            self.newDecisionEnds(decisionEnds.getCurrentDecisionEnds());
            self.decisionEndsPicture(decisionEnds.getCurrentEndsPicture());
            var newName = self.newNodeNameValue().trim();
            self.editedDecisionNodeName(getEditedDecisionNodeName());
            $("#newNodeButtonOK").button("option", "disabled",
                self.getDecisionRun() !== constants.decisionRun().EDIT && (self.isNodeNameInvalid() || newName.length == 0));
        };
        self.moveDecisionEndsPrev = function() {
            self.updateTrigger(!self.updateTrigger());
            decisionEnds.moveEndsPrevious();
            self.newDecisionEnds(decisionEnds.getCurrentDecisionEnds());
            self.decisionEndsPicture(decisionEnds.getCurrentEndsPicture());
            var newName = self.newNodeNameValue().trim();
            self.editedDecisionNodeName(getEditedDecisionNodeName());
            $("#newNodeButtonOK").button("option", "disabled",
                self.getDecisionRun() !== constants.decisionRun().EDIT && (self.isNodeNameInvalid() || newName.length == 0));
        };

        ///// flow direction /////
        self.btnFlowH2click = function() {
            self.changeFlowDirection(constants.flow().VERTICAL);
        };
        self.btnFlowV2click = function() {
            self.changeFlowDirection(constants.flow().HORIZONTAL);
        };

        self.changeFlowDirection = function(direction) {
            //if (self.flowManager.getModelHandler().haveLinksSegmentShifts() ||
            //    self.flowManager.getModelHandler().haveLinksForcedCrossings() ) {
            //    var msg = "Changing flow direction will reset some or all segment edits.  "+" Do you want to continue?";
            //    self.showConfirmMessage(msg, "Confirm");
            //    _confirmDialogSelector.on("dialogclose", function(event, ui) {
            //        setTimeout(function(){
            //            if (self.getConfirmFlag() === constants.bValue().TRUE) {
            //                self.flowManager.getModelHandler().clearAllSegmentShifts();
            //                self.flowManager.getModelHandler().clearAllForcedCrossings();
            //                self.flowManager.resetUndoManager();
            //                setFlowDirection(direction);
            //            }
            //        }, 200); //
            //    });
            //} else {
                setFlowDirection(direction);
            //}
        };

        function setFlowDirection(direction) {
            config.setFlowDirection(direction);
            self.setFlowDirectionChange();
            updateContainerResizeButtons(direction);
            updateSwitchResizeButtons(direction);
            if (self.getFlowManager().hasDiagramOpen()) {
                self.flowManager.setDirty(true);
            }
            self.getFlowManager().refreshDiagramOnEdit();
            self.setConfirmFlag(constants.bValue().FALSE);
        }

        function forceFlowDirection(direction) {
            config.setFlowDirection(direction);
            self.setConfirmFlag(constants.bValue().FALSE);
        }

        //////
        self.isHorizontal = ko.observable(false);
        self.layoutModeText = ko.observable(config.getLayoutModeText());
        self.diagramModeText = ko.observable(config.getDiagramModeText());

        var _newIdSltr = $("#newId"),
            _openIdSltr = $("#openId"),
            _undoIdSltr = $("#undoId"),
            _redoIdSltr = $("#redoId"),
            _refreshIdSltr = $("#refreshId"),
            _clearId = $("#clearId"),
            _leftIdSltr = $("#leftId"),
            _rightIdSltr = $("#rightId"),
            _deleteIdSltr = $("#deleteId"),
            _copyIdSltr = $("#copyId"),
            _pasteIdSltr = $("#pasteId"),
            _saveIdSltr = $("#saveId"),
            _saveAsIdSltr = $("#saveAsId"),
            _btnFlowVIdSltr = $("#btnFlowVId"),
            _btnThumbnailIdSltr = $("#btnThumbnailId");

        self.updateWindow = function() {
            self.updateTrigger(!self.updateTrigger());
            self.isHorizontal(config.getFlowDirection() === constants.flow().HORIZONTAL);
            self.layoutModeText(config.getLayoutModeText());
            self.diagramModeText(config.getDiagramModeText());
            var blockEdit = !config.isEditMode();

            toolbar.updateMenus(self);

            //_newIdSltr.attr('disabled', blockEdit || config.getAppMode() !== constants.appMode().FLOW_MODE);
            //_openIdSltr.attr('disabled', config.getAppMode() !== constants.appMode().FLOW_MODE);
            _newIdSltr.attr('disabled', blockEdit || !self.isConnectionOK() && !self.initOK());
            _openIdSltr.attr('disabled', !self.isConnectionOK() && !self.initOK());
            _undoIdSltr.attr('disabled', blockEdit || !self.flowManager.canUndo()).attr('title', self.flowManager.getUndoName());
            _redoIdSltr.attr('disabled', blockEdit || !self.flowManager.canRedo()).attr('title', self.flowManager.getRedoName());
            _deleteIdSltr.attr('disabled', blockEdit || !self.flowManager.getSelectionManager().hasSelections());
            _copyIdSltr.attr('disabled', blockEdit || !self.flowManager.canCopy());
            _pasteIdSltr.attr('disabled', blockEdit || !self.flowManager.readyToPaste());
            _saveIdSltr.attr('disabled', blockEdit || !self.isConnectionOK() || !self.flowManager.isDirty());
            _saveAsIdSltr.attr('disabled', blockEdit || !self.isConnectionOK() || self.flowManager.getModelHandler().isDiagramEmpty());

            _refreshIdSltr.attr('disabled', !self.isCanvasVisible());
            _clearId.attr('disabled', blockEdit || !self.isCanvasVisible());
            _leftIdSltr.attr('disabled', !self.flowManager.hasPreviousDiagram());
            _rightIdSltr.attr('disabled', !self.flowManager.hasNextDiagram());

            _btnFlowVIdSltr.attr('disabled', config.getAppMode() !== constants.appMode().FLOW_MODE);
            //_btnThumbnailIdSltr.attr('disabled', !self.isShowThumbnail());
            $("#btnFlowHId").attr('disabled', blockEdit);
            $("#btnFlowVId").attr('disabled', blockEdit);

            if (document.getElementById("blockResizeId").style.visibility === 'visible' && !_blockResizeBarVisible) {
                _blockResizeBarVisible = true;
            } else if (_blockResizeBarVisible) {
                document.getElementById("blockResizeId").style.visibility = 'hidden';
                _blockResizeBarVisible = false;
            }

            if (document.getElementById("switchResizeId").style.visibility === 'visible' && !_switchResizeBarVisible) {
                _switchResizeBarVisible = true;
            } else if (_switchResizeBarVisible) {
                document.getElementById("switchResizeId").style.visibility = 'hidden';
                _switchResizeBarVisible = false;
            }

            if (self.flowManager.isInitialResizeMode() && self.flowManager.getModelHandler().isDiagramEmpty()) {
                _spinnerLevelsSelector.spinner('enable');
                _spinnerLanesSelector.spinner('enable');
            } else {
                _spinnerLevelsSelector.spinner('disable');
                _spinnerLanesSelector.spinner('disable');
            }
        };

        var _flowDirChange = false;
        self.hasFlowDirectionChange = function() { return _flowDirChange; };
        self.setFlowDirectionChange = function() { _flowDirChange = true; };
        self.resetFlowDirectionChange = function() { _flowDirChange = false; };

        self.initData = function() {
            self.updateWindow();
        };

        self.galleryNodes = ko.pureComputed(function() {
            self.updateTrigger();
            var nodes = [], gNodes = config.getFlowDirection() === constants.flow().HORIZONTAL ?
                components.getHNodes() : components.getVNodes();
            for (var i = 0; i < gNodes.length; i++) {
                nodes.push(gNodes[i]);
            }
            return nodes;
        });

        self.gallerySENodes = ko.pureComputed(function() {
            self.updateTrigger();
            return config.getFlowDirection() === constants.flow().HORIZONTAL ?
                components.getSENodesH() : components.getSENodesV();
        });

        self.galleryFlowNodes = ko.pureComputed(function() {
            self.updateTrigger();
            return config.getFlowDirection() === constants.flow().HORIZONTAL ?
                components.getFlowNodesH() : components.getFlowNodesV();
        });

        self.galleryQuizNodes = ko.pureComputed(function() {
            self.updateTrigger();
            return config.getFlowDirection() === constants.flow().HORIZONTAL ?
                components.getQuizNodesH() : components.getQuizNodesV();
        });

        self.galleryMiscNodes = ko.pureComputed(function() {
            self.updateTrigger();
            return config.getFlowDirection() === constants.flow().HORIZONTAL ?
                components.getMiscNodesH() : components.getMiscNodesV();
        });

        self.pageNodes = ko.pureComputed(function() {
            self.updateTrigger();
            var nodes = [], gNodes = config.getFlowDirection() === constants.flow().HORIZONTAL ?
                components.getHPageItems() : components.getVPageItems();
            for (var i = 0; i < gNodes.length; i++) {
                nodes.push(gNodes[i]);
            }
            return nodes;
        });

        //self.containerW = ko.observable();
        //self.containerH = ko.observable();

        self.diagramDisplayName = ko.observable(NO_NAME);
        self.setDiagramDisplayName = function(name) {
            if (name && name.length > 0) {
                self.diagramDisplayName(name);
            } else {
                self.diagramDisplayName(NO_NAME);
            }
        };

        self.aboutTitle = ko.observable("");
        self.aboutVersion = ko.observable("");
        self.aboutText = ko.observable("");
        self.aboutSources = ko.observable("");
        self.aboutCopyright = ko.observable("");
        self.showAboutBox = function(title, version, text, sources, copy) {
            self.aboutTitle(title);
            self.aboutVersion(version);
            self.aboutText(text);
            self.aboutSources(sources);
            self.aboutCopyright(copy);
            $("#aboutDialogId").dialog("open");
        };

        self.infoMessage = ko.observable("");
        self.infoMessageVisible = ko.observable();
        self.showInfoMessage = function(msg, title) {
            self.infoMessage(msg);
            self.infoMessageVisible(false);
            $("#infoDialogId").dialog("open");
            if (title) {
                $("#infoDialogId").dialog("option", "title", title);
            }
        };
        $("#infoDialogId").on("dialogopen", function(event, ui) {
            setTimeout(function() {
                self.infoMessageVisible(true);
                $("#infoTextId").scrollTop(0);
            }, 200);
        });

        var _confirmFlag;
        self.getConfirmFlag = function() { return _confirmFlag; };
        self.setConfirmFlag = function(value) { _confirmFlag = value; };

        self.confirmMessage = ko.observable("");
        self.showConfirmMessage = function(msg, title, buttonTexts) {
            confirmDialog.initDialog(self.flowManager);
            self.confirmMessage(msg);
            if (title) {
                _confirmDialogSelector.dialog("option", "title", title);
            } if (buttonTexts) {
                $($("button", _confirmDialogSelector.parent())[1]).text(buttonTexts.first);
                $($("button", _confirmDialogSelector.parent())[2]).text(buttonTexts.second);
            }
            _confirmDialogSelector.dialog("open");
        };

        ///// THUMBNAIL show/hide  /////
        //document.getElementById("canvasThId").style.resize = "both";

        self.isShowThumbnail = ko.observable();
        self.btnThumbnailShow = function() {
            self.isShowThumbnail(true);
            $("#thumbnailDialogId").dialog("open");
            self.repaintDiagram();
        };
        self.btnThumbnailHide = function() {
            self.isShowThumbnail(false);
            //$("#thumbnailDialogId").dialog("close");
            self.repaintDiagram();
        };

       self.overlayText = ko.observable("");
        var _overlaySelector = $("#saveOverlayId");
        self.showOverlayMessage = function(msg, duration) {
            var dt = duration ? duration : 400;
            self.overlayText(msg);
            //var wH = $(window).height(), wW = $(window).width();
            //console.log("%%% overlay window: w="+wW+", h="+wH);
            //_overlaySelector.width(wW);
            //_overlaySelector.offset( { top: wH-50, left: 0} );
            _overlaySelector.show();
            setTimeout(function() { _overlaySelector.fadeOut(dt); }, dt+200);
        };

        ////// DND EVENTS from palette //////
        var _draggedPaletteId;
        self.getDraggedPaletteId = function() { return _draggedPaletteId; };
        self.setDraggedPaletteId = function(id) { _draggedPaletteId = id; };

        // PALETTE
        self.onPaletteDragStart = function(event) {
            //console.log("-- PALETTE startDrag: <"+event.target.id+">");
            _draggedPaletteId = event.target.id;
            //event.preventDefault();
            event.dataTransfer.setData("text", event.target.id);
        };

        self.onPaletteDragEnd = function(event) {
            var rect = _canvas.getBoundingClientRect();
            //var x = event.clientX - rect.left, y = event.clientY - rect.top;
            //var x = Math.floor(event.clientX - rect.left), y = Math.floor(event.clientY - rect.top);
            var isInside = event.clientX > rect.left && event.clientX < rect.right
                && event.clientY > rect.top && event.clientY < rect.bottom;
            //console.log("-- PALETTE drag END:  x="+x+", y="+y+
            //    ", left="+rect.left+", right="+rect.right+", top="+rect.top+", bottom="+rect.bottom+
            //    ", INSIDE="+isInside);
            if (!isInside) {
                self.flowManager.getDnDHandler().resetDrag();
            }
        };

        self.requestFocus = function() {
            // TODO: this makes the window scroll to canvas
            //$("#canvasId").focus();
        };

        self.isControlPressed = function() { return _controlPressed; };
        self.setControlPressed = function(b) { _controlPressed = b; };

        self.isEditControlPressed = function() { return _controlPressedEdit; };
        self.setEditControlPressed = function(b) { _controlPressedEdit = b; };

        self.isShiftPressed = function() { return _shiftPressed; };
        self.setShiftPressed = function(b) { _shiftPressed = b; };

        //$(window).resize(function(){
        function windowResize(){
            //console.log("## window resize");
            $("#settingsDialogId").dialog({
                position: {my: "right top+10", at: "right top", of: "#topContainerId"}
            });
            $("#nodePropsDialogId").dialog({
                position: {my: "right top+10", at: "right top", of: "#topContainerId"}
            });
            $("#linkPropsDialogId").dialog({
                position: {my: "right top+10", at: "right top", of: "#topContainerId"}
            });
            $("#thumbnailDialogId").dialog({
                //position: {my: "right top", at: "right-4 bottom-4", of: $("#btnThumbnailId")}
                position: {my: "right bottom", at: "right-10 bottom-2", of: $("#topContainerId")}
            });
            adjustContainerHeight();
            self.flowManager.refreshDiagramOnEdit();
            self.repaintDiagram();
        }

        window.onresize = windowResize;
        window.onscroll = function() {
            $("#thumbnailDialogId").dialog({
                position: {my: "right bottom", at: "right-10 bottom-2", of: $("#topContainerId")}
            });
            self.repaintDiagram()
        };

        var H_DELTA = 0; // compensate toolbar
        var _ctnrSelector = $("#containerId");

        function adjustContainerHeight() {
            var wH = $(window).height(),
                scrollV = $(window).scrollTop();
            //console.log("** scrollV = "+scrollV+", wH = "+wH+",ctrH = "+ctrH+", topctrH = "+topctrH+", cnvH = "+cnvH);
            _ctnrSelector.height(wH - H_DELTA);
            //_ctnrSelector.height(wH - H_DELTA + scrollV);
            //var wH = $(window).height();
            //_ctnrSelector.height(wH - H_DELTA);
            //_ctnrSelector.height(wH - H_DELTA + (ctrH > cnvH ? 0 : scrollV));
            //_ctnrSelector.height(wH - H_DELTA + (ctrH - topctrH));
        }

        self.repaintDiagram = function() {
            self.hideContainerBar();
            self.hideSwitchBar();
            self.flowManager.paintDiagram();
        };

        //////////////////
        // knockout init
        //////////////////
        ko.applyBindings(self);

        self.initData();

        return {
            initFlowDemo: function() {
                //self.setProgressBarVisible(false);
                window.scrollTo(0,0);
                $(window).trigger('resize');
                self.updateWindow();
                self.setProgressBarVisible(false);
                if (!config.isDevMode()) {
                    self.showOverlayMessage("Connecting to server...", 3000);
                    ioHandler.checkMyConnection(self.flowManager);
                } else {
                    self.isConnectionOK(true);
                }
            }
        }
    }
);

