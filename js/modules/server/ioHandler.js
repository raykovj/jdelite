define(['jquery',
		'modules/dialogs/messageDialog',],
	function($, messageDialog) {
		var CONNECTION = 'http://127.0.0.1:8080/';

		return {
			checkMyConnection: function(manager) {
				//return $.get(CONNECTION,'getFiles')
				//	.done(function(data) {
				//		manager.getCaller().cnxResultOK();
				//	})
				//	.fail(function( jqxhr, textStatus, error ) {
				//		manager.getCaller().cnxResultFAIL(jqxhr);
				//	});

				// this call fails even when the nodejs is running,
				// this is why we use a hack to reject blocking the UI
				return $.ajax({
					url: CONNECTION,
					type: 'HEAD',
					contentType: 'text/plain',
					timeout: 4000 // compared to 3000 in dataflow.js
				}).done(function(data) {
					manager.getCaller().cnxResultOK();
				}).fail(function(xhr) {
					manager.getCaller().cnxResultFAIL(xhr);
				});
			},
			pathExists: function(manager, pathName) {
				if (manager.getCaller().isConnectionOK()) {
					var pathUrl = CONNECTION + pathName;
					return $.get(pathUrl,'pathExists')
						.done(function (data) {
							try {
								manager.ifExistsResult(data);
							} catch(err) {
								manager.ifExistsResult('failed');
							}
						})
						.fail(function (jqxhr, textStatus, error) {
							console.log("Connection failed !!!");
						});
				} else {
					manager.ifExistsResult('no connection !!!');
				}
			},
			//getFlowData: function(manager, dirName, fileName) {
			getFlowData: function(manager, fileName) {
				if (manager.getCaller().isConnectionOK()) {
					//var fileUrl = CONNECTION + dirName + '/' + fileName;
					var fileUrl = CONNECTION + fileName;
					return $.get(fileUrl)
						.done(function (data) {
							//console.log("### IOHANDLER: "+data);
							try {
								var content = JSON.parse(data);
								manager.processFlowData(content);
							} catch(err) {
								//alert("File "+fileName+" content is not a JSON object");
								//manager.getCaller().showInfoMessage("File "+fileName+" content is not a JSON object", "Parser Error");
								messageDialog.showMessage('Processing Error', "File '"+fileName+"' failed to be processed:"+err);
							}
						})
						.fail(function (jqxhr, textStatus, error) {
							window.alert("Failed to get file " + fileName);
							//var err = textStatus + ", " + error;
							manager.getCaller().cnxResultFAIL(jqxhr);
							console.log("Connection failed !!!");
						});
				} else {
					return [];
				}
			},
			getFiles: function(manager, dirName) {
				if (manager.getCaller().isConnectionOK()) {
					var url = CONNECTION + dirName;
					return $.get(url,'getFiles')
						.done(function(data) {
							var content = data.split(',');
							manager.sendFilesList(content);
						})
						.fail(function( jqxhr, textStatus, error ) {
							window.alert("Connection failed");
							//var err = textStatus + ", " + error;
							manager.getCaller().cnxResultFAIL(jqxhr);
							console.log( "getFiles failed !!!");
						});
				} else {
					// open new diagram dialog
					manager.sendFilesList([]);
					return [];
				}
			},
			getDirs: function(manager, dirName, type) {
				if (manager.getCaller().isConnectionOK()) {
					var url = CONNECTION + dirName;
					return $.get(url,'getDirs')
						.done(function(data) {
							manager.sendDirsList(data, type);
						})
						.fail(function( jqxhr, textStatus, error ) {
							//window.alert("getDirs failed");
							var err = textStatus + ", " + error;
							//manager.getCaller().cnxResultFAIL(jqxhr);
							console.log( "getDirs failed !!!");
						});
				} else {
					// open new diagram dialog
					manager.sendDirsList([], type);
					return [];
				}
			},
			getDiskDrivesNames: function(manager, dirName) {
				if (manager.getCaller().isConnectionOK()) {
					var url = CONNECTION + dirName;
					return $.get(url,'getDisks')
						.done(function(data) {
							//manager.sendDirContent(data, type);
							//console.log("Got disks: "+data);
						})
						.fail(function( jqxhr, textStatus, error ) {
							//window.alert("getDirs failed");
							//var err = textStatus + ", " + error;
							//manager.getCaller().cnxResultFAIL(jqxhr);
							console.log("ERROR: getDiskDrivesNames failed !!!");
						});
				}
			},
			getAllContent: function(manager, dirName, type) {
				if (manager.getCaller().isConnectionOK()) {
					var url = CONNECTION + dirName;
					//var url = CONNECTION + "/C:";
					return $.get(url,'getContent')
						.done(function(data) {
							manager.sendDirContent(data, type);
						})
						.fail(function( jqxhr, textStatus, error ) {
							//window.alert("getDirs failed");
							//var err = textStatus + ", " + error;
							//manager.getCaller().cnxResultFAIL(jqxhr);
							console.log("ERROR: getAllContent failed !!!");
						});
				} else {
					// open new diagram dialog
					manager.sendDirContent({}, type);
					return [];
				}
			},
			saveFlowData: function(manager, flowData, filePath) {
				if (manager.getCaller().isConnectionOK()) {
					var fileUrl = CONNECTION + filePath + '?writeFile';
					return $.ajax({
						url: fileUrl,
						type: 'POST',
						data: flowData,
						dataType: 'text/html',
						complete: function(data, status, jqxhr) {
							manager.FlowDataSaved(filePath);
						}
					});
				}
			},
			createDir: function(manager, pathName, newDirName) {
				if (manager.getCaller().isConnectionOK()) {
					var path = CONNECTION + pathName+'/'+newDirName,
						pathUrl = CONNECTION + pathName+'/'+newDirName+'?createDir';
					return $.ajax({
						url: pathUrl,
						type: 'POST',
						dataType: 'text/html',
						complete: function (data, status, jqxhr) {
							manager.folderCreated(pathName + '/' + newDirName);
						}
					});
				}
			},
			removeFile: function(manager, pathName) {
				if (manager.getCaller().isConnectionOK()) {
					var fileUrl = CONNECTION + pathName + '?deleteFile';
					return $.ajax({
						url: fileUrl,
						type: 'DELETE',
						complete: function(data, status, jqxhr) {
							manager.fileDeleted(pathName);
						}
					});
				}
			},
			removeFolder: function(manager, pathName) {
				if (manager.getCaller().isConnectionOK()) {
					var folderUrl = CONNECTION + pathName + '?deleteDir';
					return $.ajax({
						url: folderUrl,
						type: 'DELETE',
						complete: function(data, status, jqxhr) {
							manager.folderDeleted(pathName);
						}
					});

				}
			}
		}
	}
);