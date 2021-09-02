define(['jquery','jqueryui','knockout',
		'modules/graph/graphConstants',
		'modules/diagram/diagramUtils',
		'modules/util/utils',
		'modules/settings/config'],
	function($, $$, ko,
	         constants,
	         diagramUtils,
	         utils,
	         config) {

		function LinkPropsDialog() {
			var self = this;
			var HEIGHT1 = 332,
				HEIGHT2 = 550;
			var _manager,
				_propsLinkLabelElem = document.getElementById('propsLinkLabelId'),
				_editNameValid,
				_oldLabel,
				_oldColor,
				_newColor,
				_isPropagateLabel,
				_propsSrcNameIdSelector = $("#propsLinkSourceNameId"),
				_propsSrcLabelIdSelector = $("#propsLinkSourceLabelId"),
				_propsTrgNameIdSelector = $("#propsLinkTargetNameId"),
				_propsTrgLabelIdSelector = $("#propsLinkTargetLabelId"),
				_linkLabelValueChanged;

			_propsLinkLabelElem.addEventListener('keyup', function(event) {
				if (_manager) {
					_manager.getCaller().validateLinkLabel();
					checkNameValid(_manager);
					checkEnableOK();
					var value = _manager.getCaller().getPropsLinkLabelValue();
					if (!_oldLabel || _oldLabel.localeCompare(value) != 0) {
						_linkLabelValueChanged = true;
					}
				}
			});

			///////
			var _linkColorPickerSelector = $("#linkColorPickId");
			_linkColorPickerSelector.spectrum({
				color: "#fff",
				clickoutFiresChange: false,
				preferredFormat: "hex",
				showInput: true,
				showInitial: true,
				appendTo: "#linkPropsDialogId",
				show: function() {
					$("#linkPropsDialogId").dialog("option", "height", HEIGHT2);
				},
				hide: function() {
					$("#linkPropsDialogId").dialog("option", "height", HEIGHT1);
				},
				change: function(color) {
					_newColor = color.toHexString();
					checkNameValid();
					checkEnableOK();
				}
			});
			$("#linkColorDefId").click(function() {
				var link = _manager.getCaller().getPropsLink(),
					defColor = link.getDefDrawColor();
				_linkColorPickerSelector.spectrum(
					"set", defColor
				);
				_newColor = defColor;
				checkNameValid();
				checkEnableOK();
			});

			_linkColorPickerSelector.on("show.spectrum", function() {
				var link = _manager.getCaller().getPropsLink();
				_linkColorPickerSelector.spectrum(
					"set", link.getDrawColor()
				);
			});

			$('input[id="chkPropagateLabelId"]').on('change', function(event) {
				_isPropagateLabel = $(this).prop("checked");
				checkNameValid();
				checkEnableOK();
			});

			///////////////////////
			self.initDialog = function(manager) {
				var _propsDialog = $("#linkPropsDialogId");
				_manager = manager;
				_propsDialog.dialog({
					autoOpen: false,
					closeOnEscape: true,
					width: 470,
					height: HEIGHT1,
					show: {effect: "slideDown",  duration: 200},
					hide: {effect: 'slideUp', duration: 200},
					modal: true,
					resizable: false,
					title: "Link Properties",
					position: {my: "right top", at: "right top", of: "#topContainerId"},
					open: function(event, ui) {
						initControls();
						$("#btnOK").button("option", "disabled", true);
						$(this).dialog('option', 'title', getTitle());
						disableControls();
					},
					buttons: [
						{
							id: "btnOK",
							text: "OK",
							click: function() {
								proceed();
								$(this).dialog("close");
							}
						},
						{
							text: "Cancel",
							autofocus: true,
							click: function() {
								$(this).dialog("close");
								resetControls();
							}
						}
					]
				});
				$(document).on('click', ".ui-widget-overlay", function(){
					_propsDialog.dialog( "close" );
					resetControls();
				});
			};

			function disableControls() {
				var blockEdit = !config.isEditMode();

				$("#chkPropagateLabelId").prop('disabled', blockEdit);

				if (blockEdit) {
					$("#linkColorPickId").spectrum("disable");
				} else {
					$("#linkColorPickId").spectrum("enable");
				}

				$("#linkColorDefId").prop('disabled', blockEdit);
			}

			function getTitle() {
				return "Link Properties: "+_manager.getCaller().getPropsLink().getName();
			}

			function getPosition() {
				//var link = _manager.getCaller().getPropsLink();
				// TODO: calculate location point
			}

			function checkNameValid() {
				if (_manager.getCaller().isLinkLabelInvalid()) {
					$("#btnOK").button("option", "disabled", true);
					_editNameValid = false;
				} else {
					_editNameValid = true;
				}
			}

			function checkEnableOK() {
				if (_editNameValid) {
					$("#btnOK").button("enable");
					$("#btnOK").button("refresh");
				}
			}

			function initControls() {
				var link = _manager.getCaller().getPropsLink();

				_manager.getCaller().propsLinkLabel(link.getLinkLabel());
				_oldLabel = _manager.getCaller().getPropsLinkLabelValue();
				_manager.getCaller().setOldLinkLabel(link.getLinkLabel());

				_isPropagateLabel = false;
				$("#chkPropagateLabelId").prop('checked', _isPropagateLabel);

				_oldColor = link.getDrawColor();
				_linkColorPickerSelector.spectrum(
					"set", link.getDrawColor()
				);

				_propsSrcNameIdSelector.tooltip({
					content: _manager.getCaller().propsLinkSourceName(),
					position: {
						my: "left top",
						at: "left bottom",
						collision: "flipfit"
					}
				});
				_propsSrcLabelIdSelector.tooltip({
					content: _manager.getCaller().propsLinkSourceLabel(),
					position: {
						my: "left top",
						at: "left bottom",
						collision: "flipfit"
					}
				});
				_propsTrgNameIdSelector.tooltip({
					content: _manager.getCaller().propsLinkTargetName(),
					position: {
						my: "left top",
						at: "left bottom",
						collision: "flipfit"
					}
				});
				_propsTrgLabelIdSelector.tooltip({
					content: _manager.getCaller().propsLinkTargetLabel(),
					position: {
						my: "left top",
						at: "left bottom",
						collision: "flipfit"
					}
				});
			}

			function proceed() {
				var link = _manager.getCaller().getPropsLink(),
					newLabel = _manager.getCaller().getPropsLinkLabelValue();

				if (newLabel) {
					link.setLinkLabel(newLabel);
				}

				if (_isPropagateLabel) {
					link.getSourcePort().setPortLabel(newLabel);
					link.getTargetPort().setPortLabel(newLabel);
					_manager.getModelHandler().getFlowModel().updateFlowNodes(_manager.getModelHandler().getFlowNodes());
				}

				if (_newColor && !utils.compareHexColors(_newColor, _oldColor)) {
					link.setDrawColor(_newColor);
				}

				_manager.getModelHandler().getFlowModel().updateFlowLinks(_manager.getModelHandler().getFlowLinks());
				_manager.setDirty(true);
				_manager.refreshDiagramOnEdit();
			}

			function resetControls() {
				_manager.getCaller().isLinkLabelInvalid(false);
			}

		}

		return new LinkPropsDialog();

	}
);