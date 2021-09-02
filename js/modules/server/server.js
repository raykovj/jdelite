var http = require('http');
var fs = require('fs');
var url = require('url');
var open = require("open");

process.argv.forEach((val, index) => {
	//console.log(`${index}: ${val}`)
})
const args = process.argv.slice(2);
//console.log("Current version: "+args[0]);
var rqStr;
var port = 8080;
// Create a server
http.createServer( function (request, response) {

	var urlPart, urlData, ii = request.url.indexOf("?");
	if (ii > 0) {
		urlPart = request.url.substring(0, ii);
		urlData = request.url.substring(ii+1);
	} else {
		urlPart = request.url;
	}
	rqStr = "?? received: "+request.url+", urlPart: "+urlPart + ", urlData: " + urlData;

	var path  = url.parse(urlPart).pathname;
   	var verb  = request.method;
   	//console.log("REQUEST: "+verb + ": " + path+", urlData: "+urlData);
	// CORS
   	response.setHeader('Access-Control-Allow-Origin', '*');
   	//response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

	var pathName = path,
		INCLUDE_PATTERN = /[a-zA-Z0-9.-_]+/,
		EXCLUDE_DIR_PATTERN =  /[!@#$%^&*()+=\/\\{}|:'"<>?; ]/,
		EXCLUDE_FILE_PATTERN = /[!@#$%^&*()+=\/\\{}|:'"<>?; ]/;

	function isDirNameValid(item) {
		var hasIncludes = INCLUDE_PATTERN.test(item),
			hasExcludes = EXCLUDE_DIR_PATTERN.test(item);
		return hasIncludes && !hasExcludes;
	}

	function isFileNameValid(item) {
		var hasIncludes = INCLUDE_PATTERN.test(item),
			hasExcludes = EXCLUDE_FILE_PATTERN.test(item);
		return hasIncludes && !hasExcludes;
	}

	if (verb === 'GET') {
		if (urlData === 'pathExists') {
			var content = 'unknown';
			try {
				fs.statSync(path);
				content = 'exists';
				//console.log('$$ OK: file or directory exists: '+path);
			} catch (err) {
				if (err.code === 'ENOENT') {
					content = 'notfound';
					//console.log('** NOT FOUND: path does not exist: '+path);
				}
			}
			response.writeHead(200, {'Content-Type': 'text/html'});
			response.write(content.toString());
			response.end();

		} else  if (urlData === 'getFiles') {
			fs.readdir(path, function (err, files) {
				//console.log("****** fs.readdir getFiles: "+path);
				if (err) {
					console.log(err);
					response.writeHead(404, {'Content-Type': 'text/html'});
				} else {
					// HTTP Status: 200 : OK
					// Content Type: text/plain
					var content = [];
					files.forEach(function(file) {
						if (!isFileNameValid(file)) {
							return;
						}
						var name = pathName + '/' + file,
							stats = fs.statSync(name);
						//if (stats.isFile() && file.split('.').pop() === 'json') {
						if (stats.isFile()) {
							content.push(file);
						}
					});

					response.writeHead(200, {'Content-Type': 'text/html'});
					// Write the content of the file to response body
					//console.log("#### "+content);
					//response.write(files.toString());
					response.write(content.toString());
				}
				// Send the response body
				response.end();
			});
		} else if (urlData === 'getDirs') {

			function traverseFSDirs(pathName) {

				var items = fs.readdirSync(pathName);
				console.log("*** GET DIRS ??? TRAVERSE SUBS fs.readdirSync: "+pathName);
				var struct = {};
				subFileNames = [], subDirNames = [];
				struct.path = pathName;
				items.forEach(function(item) {
					if (!isDirNameValid(item) ||
						item.startsWith('System') ||
						item.startsWith('.') ||
						//item.startsWith('$') ||
						//item.startsWith('META-INF') ||
						//item.split('-').length > 1 ||
						item.split('.').pop() === 'jar' ||
						item.split('.').pop() === 'zip' ||
						item.split('.').pop() === 'pdf')
					{
						//console.log("--- REJECTED: "+item);
						return;
					}
					var name = pathName + '/' + item,
						stats = fs.statSync(name);
					if (stats.isDirectory()) {
						//subDirNames.push(name+"("+name.split('/').pop()+")");
						subDirNames.push(name);
					}
					else if (stats.isFile()) {
						//if (item.split('.').pop() === 'json')  {
							subFileNames.push(name);
						//}
					}
				});
				struct.dirs = subDirNames;
				if (subDirNames.length === 0) {
					return struct;
				}
				var subsArr = [];
				return struct;
			};

			if (fs.existsSync(pathName)) {
				var fileStruct = traverseFSDirs(pathName);
				//console.log("*** !!! FILESTRUCT: "+JSON.stringify(fileStruct, null, 2));
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.write(JSON.stringify(fileStruct, null, 2));
			} else {
				response.writeHead(400, {'Content-Type': 'text/html'});
			}
			response.end();

		}
		else if (urlData === 'getContent') {

			///////////////  ALL /////////////
			function traverseFSAll(pathName) {
				var items = fs.readdirSync(pathName);
				//console.log("*** GET ALL ??? TRAVERSE SUBS fs.readdirSync: "+pathName);
				var struct = {},
					subFileNames = [],
					subDirNames = [];
				struct.path = pathName;
				items.forEach(function(item) {
					if (!isDirNameValid(item) ||
						item.startsWith('System') ||
						item.startsWith('.') ||
						item.split('.').pop() === 'jar' ||
						item.split('.').pop() === 'zip' ||
						item.split('.').pop() === 'pdf')
					{
						//console.log("--- REJECTED: "+item);
						return;
					}
					var name = pathName + '/' + item,
						stats = fs.statSync(name);
					if (stats.isDirectory()) {
						if (!isDirNameValid(item) ||
							item.startsWith('System') ||
							item.startsWith('.') ||
							item.split('.').pop() === 'jar' ||
							item.split('.').pop() === 'zip' ||
							item.split('.').pop() === 'pdf')
						{
							return;
						}
						subDirNames.push(name);
					} else if (stats.isFile()) {
						if (!isFileNameValid(item) ||
							item.split('.').pop() === 'jar' ||
							item.split('.').pop() === 'zip' ||
							item.split('.').pop() === 'pdf')
						{
							return;
						}
						subFileNames.push(name);
					}
				});
				struct.dirs = subDirNames;
				struct.files = subFileNames;
				return struct;
			};

			if (fs.existsSync(pathName)) {
				var fileStruct = traverseFSAll(pathName);
				//console.log("*** !!! FILESTRUCT: "+JSON.stringify(fileStruct, null, 2));
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.write(JSON.stringify(fileStruct, null, 2));
			} else {
				response.writeHead(400, {'Content-Type': 'text/html'});
			}
			response.end();

		}
		else {
			/////////////////////////////////////////////////////
			// Read the requested file content from file system
			/////////////////////////////////////////////////////
			//console.log("##### readFile: "+path);
			fs.readFile(path, function (err, data) {
				if (err) {
					console.log(err);
					response.writeHead(404, {'Content-Type': 'text/html'});
				} else {
					// HTTP Status: 200 : OK
					// Content Type: text/plain
					response.writeHead(200, {'Content-Type': 'text/html'});
					response.write(data.toString());
				}
				// Send the response body
				response.end();
			});
		}
	} else if (verb === 'OPTIONS') {
		//console.log("?? OPTIONS");
		var origin = (request.headers.origin || "*");
		response.writeHead(
			"204",
			"No Content",
			{
				"access-control-allow-origin": origin,
				"access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
				"access-control-allow-headers": "*"
				//"access-control-max-age": 10, // Seconds.
				//"content-length": 0
			}
		);
		// End the response - we're not sending back any content.
		return( response.end() );
	} else if (verb === 'POST') {
		if (urlData === 'writeFile') {
			var body = '';
			request.on('data', function(data) { body += data; });
			request.on('end', function() {
				//console.log("???? writeFile: urlData = "+urlData+", path = "+path);

				//var idx = pathName.lastIndexOf('/'),
				//	parent = pathName.slice(0, idx),
				//	stats = fs.statSync(pa);

				try {
					fs.writeFileSync(path, body);
					response.writeHead(200, {'Content-Type': 'text/html'});
					//response.write("POST - saved: "+path);
				} catch(error) {
					console.log('ERROR: '+JSON.stringify(error));
					response.writeHead(400, {'Content-Type': 'text/html'});
					response.write("ERROR: "+JSON.stringify(error));
				}
				response.end();
			});
		} else if (urlData === 'createDir') {
			//console.log("???? createDir: urlData = "+urlData+", path = "+pathName);

			fs.mkdir(pathName,function(err) {
				if (err) {
					return console.error(err);
					response.writeHead(400, {'Content-Type': 'text/html'});
					response.write("ERROR: "+JSON.stringify(error));
				} else {
					response.writeHead(200, {'Content-Type': 'text/html'});
					response.write("SUCCESS: "+pathName);
					console.log("Directory "+pathName+" created successfully!");
				}
				response.end();
			});
		}
	} else if (verb === 'DELETE') {
		if (urlData === 'deleteDir') {
			//console.log("???? deleteDir: urlData = "+urlData+", path = "+pathName);

			function removeFolder(path) {
				if (fs.existsSync(path)) {
					var items = fs.readdirSync(path);
					try {
						if (items.length > 0) {
							items.forEach(function(itemName) {
								if (fs.statSync(path + "/" + itemName).isDirectory()) {
									removeFolder(path + "/" + itemName);
								} else {
									fs.unlinkSync(path + "/" + itemName);
								}
							});
							fs.rmdirSync(path);
						} else {
							fs.rmdirSync(path);
						}
					} catch (error) {
						console.log(error);
					}
				} else {
					console.log("Directory path '"+path+"' not found.");
				}
			}

			removeFolder(pathName);
			response.end();

		} else if (urlData === 'deleteFile') {
			//console.log("???? deleteFile: urlData = "+urlData+", path = "+pathName);
			try {
				fs.unlinkSync(pathName);
			} catch(error) {
				console.log(error);
			}
			response.end();
		}
	}

}).listen(port);

open('file:///D:/jrsc/webapp/flowdemo.html', 'chrome');
// Console will print the message
console.log('Server running at http://127.0.0.1:'+port);
