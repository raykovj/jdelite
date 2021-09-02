define('modules/flow/flowManager',
	['jquery',
		'modules/layout/flowLayout',
		'modules/diagram/flowDiagram',
		'modules/view/dndHandler',
		'modules/flow/modelHandler',
		'modules/flow/fileNamesCache',
		'modules/controller/flowController',
		'modules/undo/undoManager',
		'modules/diagram/mouseInteractor',
		'modules/selection/selectionManager',
		'modules/selection/clipboardCache',
		'modules/server/ioHandler',
		'modules/common/map',
		'modules/diagram/diagramUtils',
		'modules/graph/graphConstants',
		'modules/settings/config',
		'modules/util/utils',
		'modules/dialogs/messageDialog',
		'modules/demo/demoOverview',
		'modules/demo/demoNestedBlocks',
		'modules/demo/demoBankTrans'],
	function($,
			 FlowLayout,
	         FlowDiagram,
	         DnDHandler,
	         ModelHandler,
			 namesCache,
	         FlowController,
	         UndoManager,
			 MouseInteractor,
			 SelectionManager,
			 ClipboardCache,
	         ioHandler,
	         Map,
	         diagramUtils,
	         constants,
	         config,
	         utils,
	         messageDialog,
			 demoOverview,
			 demoNestedBlocks,
			 demoBankTrans) {
		function FlowManager(caller) {
			var self = this;

			var //WORK_DIR = 'flowdata1',
				UNDO = "Undo",
				REDO = "Redo",
				undoName = UNDO,
				redoName = REDO,
				_settingsChanged = false,
				_isDirty = false,
				_PROGRESS_BAR_DELAY = 100;

			var _caller = caller;
			self.getCaller = function() { return _caller; };

			var _canvas = _caller.getCanvas(),
				_context = _canvas.getContext('2d'),
				_canvasTh = caller.getCanvasTh(),
				_contextTh = _canvasTh.getContext('2d');
				//_context = _caller.getCanvasContext();

			self.getCanvas = function() { return _canvas; };
			self.getCanvasContext = function() { return _context; }; // 190610

			self.getCanvasTh = function() { return _canvasTh; };
			self.getCanvasThContext = function() { return _contextTh; };

			var _modelHandler = new ModelHandler(this);
			self.getModelHandler = function() { return _modelHandler; };

			self.flowLayout = new FlowLayout(this);
			self.getFlowLayout = function() { return self.flowLayout; };

			var _flowDiagram = new FlowDiagram(this);
			self.getFlowDiagram = function() { return _flowDiagram; };

			var _undoManager = new UndoManager(this);
			self.getUndoManager = function() { return _undoManager; };

			var _selectionManager = new SelectionManager(this),
				_clipboard = new ClipboardCache(this);
			self.getSelectionManager = function() { return _selectionManager; };

			// TODO:
			var _scheme = "Default";
			self.getSettingScheme = function() { return _scheme; };

			var _interactor = new MouseInteractor(this);
			self.getMouseInteractor = function() { return _interactor; };

			var _controller = new FlowController(this);
			self.getFlowController = function() { return _controller; };

			var _dndHandler = new DnDHandler(this);
			self.getDnDHandler = function() { return _dndHandler; };

			var _fileName = "";
			function setFileName(name) {
				_fileName = name;
				_caller.setDiagramDisplayName(name);
			}
			self.getFileName = function() { return _fileName; };

			var _nodeNamesMap = new Map();
			self.getNodeNamesMap = function() { return _nodeNamesMap; };

			var _linkLabelsMap = new Map();
			self.getLinkLabelsMap = function() { return _linkLabelsMap; };

			var _isNewToSave = false;
			self.isNewToSave = function() { return _isNewToSave; };

			var _demoFilesMap = new Map(),
				_demoNames = ["FlowDemo", "NestedBlocks", "BankTransaction"];
			self.getDemoNames = function() { return _demoNames; };

			self.initDemo = function() {
				_demoFilesMap.put("FlowDemo", demoOverview.getJSONFile());
				_demoFilesMap.put("NestedBlocks", demoNestedBlocks.getJSONFile());
				_demoFilesMap.put("BankTransaction", demoBankTrans.getJSONFile());
			};

			var _initialResizeMode;
			//self.setInitialResizeMode = function(bValue) { _initialResizeMode = bValue; };
			self.isInitialResizeMode = function() { return _initialResizeMode; };

			var _title;
			self.getTitle = function() { return _title(); };
			var _filesList = [];

			self.isControlPressed = function() { return _caller.isControlPressed(); };
			self.isShiftPressed = function() { return _caller.isShiftPressed(); };

			self.resetScale = function() {
				config.setScale(constants.scale().DEFAULT);
				caller.scaleValue(config.getScale());
				document.getElementById("scaleId").value = config.getScale()*constants.scale().FACTOR;
			};

			self.clearDiagram = function() {
				namesCache.removeFileName(_fileName);
				_nodeNamesMap.clear();
				_linkLabelsMap.clear();
				setFileName("");
				_flowDiagram.clearCanvas();
				self.resetUndoManager();
				_isNewToSave = false;
				_initialResizeMode = true;
				//config.setCanvasReference(_canvas);
				config.setContextReference(_context);
				config.setShowGrid(false);
				_modelHandler.clearModel();
				//namesCache.removeCurrentName();
				_caller.setCanvasVisible(false);
				self.resetScale();
				_caller.updateWindow();
				self.paintDiagram();
			};

			self.hasDiagramOpen = function() {
				return self.getFileName().length > 0;
			};

			/**
			 * NEW DIAGRAM
			 * call from new diagram dialog with provided file name
			 * @param fileName
             */
			self.createDiagram = function(fileName) {
				_nodeNamesMap.clear();
				_linkLabelsMap.clear();
				//_flowDiagram.clearCanvas();
				undoName = UNDO;
				redoName = REDO;
				setFileName(fileName);
				_isNewToSave = true;
				//console.log("createDiagram: "+fileName);
				_caller.setCanvasVisible(true);
				var content = {};
				content.title = fileName;
				content.nodes = [];
				content.links = [];
				_initialResizeMode = true;
				config.setContextReference(_context);
				config.setShowGrid(false);

				content.settings = _modelHandler.getDefaultSettings();
				_modelHandler.updateSettings(content, false);

				self.resetUndoManager();
				_settingsChanged = false;

				self.resetScale();
				_modelHandler.buildContentModel(content, false);
				_flowDiagram.performLayout();

				self.adjustCanvas();
				_caller.updateWindow();
				self.paintDiagram();
				//console.log("### DIAGRAM: "+JSON.stringify(content, null, 2));
			};

			// OPEN: call from dialog with selected file name
			self.openDiagram = function(fileName) {
				//console.log("### openDiagram: connection: "+_caller.isConnectionOK());
				_isNewToSave = false;
				if (fileName) {
					_flowDiagram.clearCanvas();
					_caller.setCanvasVisible(true);
					//_caller.setProgressBarVisible(true);
					setFileName(fileName);
					if (_caller.isConnectionOK()) {
						//ioHandler.getFlowData(self, _caller.getWorkDir(), fileName);
						ioHandler.getFlowData(self, fileName);
					} else {
						self.processFlowData(_demoFilesMap.get(fileName));
					}
					setTimeout(function() {
						_caller.setProgressBarVisible(true);
					}, _PROGRESS_BAR_DELAY);
				} else {
					//console.log("### open diagram failed for file name: "+fileName);
				}
			};

			function showProgressBarTimed() {

			}

			var topCtr = document.getElementById('topContainerId');

			/**
			 * OPEN: callback from ioHandler following openDiagram
			 * @param content - JSON object read from file
             */
			self.processFlowData = function(content) {
				//console.log("### DIAGRAM: "+JSON.stringify(content, null, 2));
				//var demo = demoBankTrans.getJSONFile();
				_isNewToSave = false;
				var t1 = Date.now();
				// TODO : cache selections
				_title = content.title;
				_initialResizeMode = false;
				config.setContextReference(_context);
				config.setShowGrid(false);
				_modelHandler.updateSettings(content, true);
				self.resetUndoManager();
				_settingsChanged = false;

				var t2 = Date.now();
				//console.log("MGR:   init = "+(t2-t1));
				_modelHandler.buildContentModel(content, true);
				var t3 = Date.now();
				//console.log("MGR:  model = "+(t3-t2));
				_flowDiagram.performLayout();
				var t4 = Date.now();
				//console.log("MGR: layout = "+(t4-t3));

				//_caller.setProgressBarVisible(false);
				setTimeout(function() {
					_caller.setProgressBarVisible(false);
				}, _PROGRESS_BAR_DELAY);
				self.resetScale();
				setNodeNamesMap();
				setLinkLabelsMap();
				// TODO: restore selections
				// TODO: scroll to selection
				self.adjustCanvas();
				namesCache.addFileName(_fileName);
				_caller.updateWindow();
				self.paintDiagram();
				var t5 = Date.now();
				window.scrollTo(0,0);
				//console.log("MGR:  paint = "+(t5-t4));
			};

			self.refreshDiagramOnEdit = function(updateModel) {
				_flowDiagram.clearCanvas();
				if (self.hasDiagramOpen()) {
					setTimeout(function() {
						_caller.setProgressBarVisible(true);
					}, _PROGRESS_BAR_DELAY);
				}
				//resetScale();
				if (updateModel) {
					_modelHandler.getModelObjectUpdated(_modelHandler.getFlowNodes(), _modelHandler.getFlowLinks());
				}
				setTimeout(refreshView, 100);
			};

			// refresh from current object model
			self.refreshDiagram = function() {
				_flowDiagram.clearCanvas();
				if (_fileName.length === 0) {
					return;
				}
				refreshView();
			};

			//self.updateAndRefresh = function() {
			//	self.getModelHandler().updateFlowNodesModel();
			//	self.getModelHandler().updateFlowLinksModel();
			//	_caller.updateWindow();
			//	self.refreshDiagram();
			//};

			function refreshView() {
				var t1 = Date.now();
				_modelHandler.resetLinksToDefaults();
				var content = _modelHandler.getModelObject();
				//var content = _modelHandler.getModelObjectUpdated(_modelHandler.getFlowNodes(), _modelHandler.getFlowLinks());
				//console.log("####### refreshView DIAGRAM: "+JSON.stringify(content, null, 2));
				// TODO : cache selection !!!
				_modelHandler.buildContentModel(content, false);
				var t2 = Date.now();
				//console.log("REFRESH:  model = "+(t2-t1));
				_flowDiagram.performLayout();
				var t3 = Date.now();
				//console.log("REFRESH: layout = "+(t3-t2));

				setNodeNamesMap();
				setLinkLabelsMap();
				// TODO: restore selections
				// TODO: scroll to selection
				self.adjustCanvas();
				_selectionManager.restoreSelections();
				//_selectionManager.clearSelections();
				//_caller.setProgressBarVisible(false);
				setTimeout(function() {
					_caller.setProgressBarVisible(false);
				}, _PROGRESS_BAR_DELAY);
				_caller.updateWindow();
				self.paintDiagram();
				var t4 = Date.now();
				//console.log("REFRESH:  paint = "+(t4-t3));
			}

			self.resetHighlights = function() {
				_interactor.resetMouseMove();
			};

			function setNodeNamesMap() {
				_nodeNamesMap.clear();
				var nodes = _flowDiagram.getFlowNodes();
				for (var i = 0; i < nodes.length; i++) {
					utils.addToNamesMap(_nodeNamesMap, nodes[i].getName(), nodes[i].getFlowType());
				}
				//console.log("*** node map:\n"+_nodeNamesMap.print());
				//console.log("## next name = "+diagramUtils.generateNextNodeName(_nodeNamesMap, 6));
			}

			function setLinkLabelsMap() {
				_linkLabelsMap.clear();
				var links = _flowDiagram.getFlowLinks();
				for (var i = 0; i < links.length; i++) {
					utils.addToLabelsMap(_linkLabelsMap, links[i].getName(), links[i].getLinkLabel());
				}
			}

			self.adjustCanvas = function() {
				var size = _flowDiagram.getRectBounds(),
					factor = config.getScale();
				_context.canvas.width = size.width * factor + 2;
				_context.canvas.height = size.height * factor + 3;
			};

			self.paintDiagram = function() {
				_context.save();
				var factor = config.getScale();
				_context.scale(factor, factor);
				_flowDiagram.paintDiagram(_context);
				if (_caller.isShowThumbnail()) {
					_flowDiagram.paintDiagramTh(_contextTh);
				}
				_context.restore();
				_caller.requestFocus();
			};

			self.showTooltip = function(point) {
				_flowDiagram.showTooltip(point);
			};

			// replaced with getDirContent
			self.getFilesList = function() {
				if (_caller.isConnectionOK()) {
					var location = _caller.getWorkDir();
					ioHandler.getFiles(self, location);
				} else {
					self.sendFilesList(_demoNames);
				}
			};
			// not connected
			self.sendFilesList = function(filesList) {
				_caller.setFilesList(filesList);
				_filesList = filesList;
			};

			////////// DIRS ////////
			self.getDirsList = function(selectedOnly, type) {
				if (_caller.isConnectionOK()) {
					var location = selectedOnly ? _caller.getSelectedDir() : _caller.getWorkDir();
					ioHandler.getDirs(self, location, type);
				} else {
					self.sendDirsList({"path":"unknown","dirs":[]}, type);
				}
			};

			self.sendDirsList = function(content, type) {
				//console.log(content);
				var fsContent = JSON.parse(content);
				_caller.setDirsList(fsContent, type);
			};
			/////

			///////// CONTENT /////////
			self.getDirContent = function(type) {
				if (_caller.isConnectionOK()) {
					var location = _caller.getWorkDir();
					//var location = ":/C:";
					ioHandler.getAllContent(self, location, type);
				} else {
					//self.sendDirContent({"path":"unknown","dirs":[],"files":[]}, type);
					self.sendFilesList(_demoNames);
				}
			};

			self.getDiskDrives = function() {
				if (_caller.isConnectionOK()) {
					var location = _caller.getWorkDir();
					ioHandler.getDiskDrivesNames(self, location);
				}
			};

			self.sendDirContent = function(content, type) {
				//console.log(content);
				var fsContent = JSON.parse(content);
				_caller.setFolderContent(fsContent, type);
				_filesList = _caller.filesList();
			};
			/////

			self.saveFlowData = function() {
				_modelHandler.clearIndexProperties();
				_initialResizeMode = false;
				_isNewToSave = false;
				if (utils.getFileExtension(_fileName) === 'json') {
					var model = {};
					var content = _modelHandler.getModelObjectToSave();
					model.title = _fileName;
					model.nodes = content.nodes;
					model.links = content.links;
					model.settings = content.settings;

					var data = JSON.stringify(model, null, 2);
					ioHandler.saveFlowData(this, data, _fileName);
					namesCache.addFileName(_fileName);
					_settingsChanged = false;
					self.resetUndoManager();
					_caller.updateWindow();
				} else {
					messageDialog.showMessage('Error', 'Incorrect file name: ['+_fileName+']');
				}
			};

			self.saveFlowDataAs = function(newFileName) {
				_modelHandler.clearIndexProperties();
				_initialResizeMode = false;
				_isNewToSave = false;
				if (utils.getFileExtension(newFileName) === 'json') {
					var model = {};
					var content = _modelHandler.getModelObjectToSave();
					model.title = newFileName;
					model.nodes = content.nodes;
					model.links = content.links;
					model.settings = content.settings;

					var data = JSON.stringify(model, null, 2),
						newPath = _caller.getWorkDir()+'/'+newFileName;
					ioHandler.saveFlowData(this, data, newPath);
					namesCache.addFileName(newPath);
					_settingsChanged = false;
					self.resetUndoManager();
					_caller.updateWindow();
				} else {
					messageDialog.showMessage('Error', 'Incorrect file name: ['+_fileName+']');
				}
			};

			self.FlowDataSaved = function(filePath) {
				self.getDirContent();
				$("#openFlowDialogId").dialog('close');
				self.openDiagram(filePath);
				_caller.showOverlayMessage("Saved: "+filePath);
				//console.log("!!!! SAVED: "+filePath);
			};

			////////////////

			self.checkIfExists = function(path) {
				//console.log("### CHECK ifExists: "+path);
				ioHandler.pathExists(self, path);
			};

			self.ifExistsResult = function(data) {
				//console.log("### CHECK ifExistsResult - "+data);
				//_caller.self.setFilesOnly(true);
				return data && data === 'exists';
			};

			self.createFolder = function(dirName) {
				var path = _caller.getWorkDir();
				ioHandler.createDir(self, path, dirName);
			};
			self.folderCreated = function(data, status) {
				_caller.showOverlayMessage("Folder created");
				self.getDirContent();
			};

			self.deleteFolder = function(folderPath) {
				ioHandler.removeFolder(self, folderPath);
			};
			self.folderDeleted = function(pathName) {
				_caller.showOverlayMessage("Folder deleted");
				self.getDirContent();
				$("#openFlowDialogId").dialog('close');
			};

			self.deleteFile = function(filePath) {
				//self.checkIfExists(filePath);
				ioHandler.removeFile(self, filePath);
			};
			self.fileDeleted = function(filePath) {
				//console.log("#### FILE "+filePath+" deleted, file opened: "+self.getFileName());
				//console.log("nameCache: "+namesCache.showNamesCache());
				_caller.showOverlayMessage("File deleted");
				namesCache.removeFileName(filePath);
				if (filePath && filePath.localeCompare(self.getFileName()) === 0) {
					self.clearDiagram();
					if (namesCache.hasNext()) {
						goToNext(namesCache.getNext());
					} else if (namesCache.hasPrevious()) {
						goToPrevious(namesCache.getPrevious());
					} else {
						var current = namesCache.getCurrent();
						if (current) {
							self.openDiagram(current);
						}
						_caller.updateWindow();
					}
				}
				self.getDirContent();
				$("#openFlowDialogId").dialog('close');
			};

			////////////////

			var _callOpen = false,
				_callNext = false,
				_callPrev = false;
			self.proceedOnSave = function() {
				if (_caller.isConnectionOK() && self.isDirty()) {
					var msg = "Your changes will be lost. Confirm to save file "+self.getFileName()+"?";
					_callOpen = true;
					_caller.showConfirmMessage(msg, "Confirm", {first: "Confirm", second: "Ignore"});
					if (_callOpen)
					$("#confirmDialogId").on("dialogclose", function(event, ui) {
						if (_caller.getConfirmFlag() === constants.bValue().TRUE && _caller.isConnectionOK()) {
							if (_isNewToSave) {
								_caller.setFSDialogMode(constants.fsDialogMode().SAVE);
								$("#openFlowDialogId").dialog("open");
								_isDirty = false;
								_settingsChanged = false;
							} else {
								self.saveFlowData();
							}
						} else if (_caller.getConfirmFlag() === constants.bValue().FALSE && _caller.isConnectionOK()) {
							//self.clearDiagram();
							_isDirty = false;
							_settingsChanged = false;
							if (_caller.isNewAction()) {
								self.getFilesList();
							} else if (_callOpen) {
								_caller.setFSDialogMode(constants.fsDialogMode().OPEN);
								$("#openFlowDialogId").dialog("open");
							}
						}
						_callOpen = false;
					});
				}
				_caller.setConfirmFlag(constants.bValue().FALSE);
				//_callOpen = false;
			};

			self.hasNextDiagram = function() {
				return namesCache.hasNext();
			};
			self.getNextDiagram = function() {
				if (_caller.isConnectionOK() && self.isDirty()) {
					var msg = "Your changes will be lost. Confirm to save file "+self.getFileName()+"?";
					_callNext = true;
					_caller.showConfirmMessage(msg, "Confirm", {first: "Confirm", second: "Ignore"});
					if (_callNext)
					$("#confirmDialogId").on("dialogclose", function(event, ui) {
						if (_caller.getConfirmFlag() === constants.bValue().TRUE && _caller.isConnectionOK()) {
							if (_isNewToSave) {
								_caller.setFSDialogMode(constants.fsDialogMode().SAVE);
								$("#openFlowDialogId").dialog("open");
							} else {
								self.saveFlowData();
							}
						} else if (_caller.getConfirmFlag() === constants.bValue().FALSE) {
							goToNext(namesCache.getNext());
						}
						_callNext = false;
					});
				} else {
					goToNext(namesCache.getNext());
				}
				_caller.setConfirmFlag(constants.bValue().FALSE);
				//_callNext = false;
			};
			function goToNext(fileName) {
				self.openDiagram(fileName);
				_caller.updateWindow();
			}

			self.hasPreviousDiagram = function() {
				return namesCache.hasPrevious();
			};
			self.getPreviousDiagram = function() {
				//_callOpen = false;
				if (_caller.isConnectionOK() && self.isDirty()) {
					var msg = "Your changes will be lost. Confirm to save file "+self.getFileName()+"?";
					_callPrev = true;
					_caller.showConfirmMessage(msg, "Confirm", {first: "Confirm", second: "Ignore"});
					if (_callPrev)
					$("#confirmDialogId").on("dialogclose", function(event, ui) {
						if (_caller.getConfirmFlag() === constants.bValue().TRUE && _caller.isConnectionOK()) {
							if (_isNewToSave) {
								_caller.setFSDialogMode(constants.fsDialogMode().SAVE);
								$("#openFlowDialogId").dialog("open");
							} else {
								self.saveFlowData();
							}
						} else if (_caller.getConfirmFlag() === constants.bValue().FALSE) {
							goToPrevious(namesCache.getPrevious());
						}
						_callPrev = false;
					});
				} else {
					goToPrevious(namesCache.getPrevious());
				}
				_caller.setConfirmFlag(constants.bValue().FALSE);
				//_callPrev = false;
			};
			function goToPrevious(fileName) {
				self.openDiagram(fileName);
				_caller.updateWindow();
			}

			self.clearNamesCache = function() {
				namesCache.clear();
			};

			///////////////

			self.showLinkLabelAsTooltip = function(linkInfo) {
				_flowDiagram.showLinkLabelTooltip(config.hasShowLinkLabels() ? linkInfo : null);
			};

			///////////////

			self.canCopy = function() {
				return config.isEditMode() && _selectionManager.hasAcceptedNodes();
			};
			self.canPaste = function() { return config.isEditMode() && _clipboard.canPaste(); };
			self.readyToPaste = function() { return _clipboard.readyToPaste(); };

			self.copySelections = function() {
				if (!config.isEditMode() || !self.canCopy()) {
					return;
				}
				//var factor = config.getScale();
				var slxs = _selectionManager.getSelections();
				if (slxs.length > 0) {
					var map = _modelHandler.getClipboardObjectsMap(slxs);
					_clipboard.doCopy(map);
					//_modelHandler.printClipboard(map);
					var rect = _clipboard.getSelectionWrapper();
					_flowDiagram.showSelectionRectangle(rect);
					_flowDiagram.showPasteMessage(true);
					_caller.updateWindow();
					self.paintDiagram();
				}
			};

			self.resetCopyPaste = function() { _clipboard.clearCopyPaste(); };

			self.isClipboardPasteLocationOk = function(point) {
				return _clipboard.isPasteLocationOk(point);
			};

			self.pasteSelections = function() {
				if (!config.isEditMode()) {
					return;
				}
				_clipboard.doPaste();
				self.clearClipboard();
			};

			self.clearClipboard = function() {
				_clipboard.clearCopyPaste();
				_flowDiagram.clearSelectionRectangle();
				_flowDiagram.showPasteMessage(false);
				_flowDiagram.clearPasteTooltip();
				_caller.updateWindow();
				self.paintDiagram();
			};

			///////////////

			self.setDirty = function(b) {
				_isDirty = b;
				_caller.updateWindow();
			};
			self.isDirty = function() {
				//return self.canUndo() || _settingsChanged;
				return _isDirty || _settingsChanged || _isNewToSave;
			};

			self.setSettingsChanged = function(b) {
				if (_fileName.length > 0) {
					_settingsChanged = _settingsChanged || b;
				}
			};

			self.resetUndoManager = function() {
				_undoManager.clearAll();
				_isDirty = false;
			};
			self.canUndo = function() { return _undoManager.canUndo(); };
			self.canRedo = function() { return _undoManager.canRedo(); };

			self.isUndoBufferEmpty = function() {
				return _undoManager.isUndoBufferEmpty();
			};

			self.resetUndoProperties = function() {
				// this may not be needed
				//_modelHandler.clearIndexProperties();
			};

			self.setUndoName = function(name) { undoName = name; };
			self.getUndoName = function() { return undoName; };

			self.setRedoName = function(name) { redoName = name; };
			self.getRedoName = function() { return redoName; };

			self.initDemo();
		}
		return FlowManager;
	}
);
