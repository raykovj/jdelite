var http = require('http');
var fs = require('fs');
var url = require('url');
var open = require("open");

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
   	response.setHeader('Access-Control-Allow-Origin', '*');

	var pathName = url.parse(urlPart).pathname,
		verb  = request.method,
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
				fs.statSync(pathName);
				content = 'exists';
			} catch (err) {
				if (err.code === 'ENOENT') {
					content = 'notfound';
					console.log('** NOT FOUND: pathName does not exist: '+pathName);
				}
			}
			response.writeHead(200, {'Content-Type': 'text/html'});
			response.write(content.toString());
			response.end();

		} else  if (urlData === 'getFiles') {
			fs.readdir(pathName, function (err, files) {
				if (err) {
					console.log(err);
					response.writeHead(404, {'Content-Type': 'text/html'});
				} else {
					var content = [];
					files.forEach(function(file) {
						if (!isFileNameValid(file)) {
							return;
						}
						var name = pathName + '/' + file,
							stats = fs.statSync(name);
						if (stats.isFile()) {
							content.push(file);
						}
					});

					response.writeHead(200, {'Content-Type': 'text/html'});
					response.write(content.toString());
				}
				response.end();
			});
		} else if (urlData === 'getDirs') {

			function traverseFSDirs(pathName) {

				var items = fs.readdirSync(pathName);
				var struct = {}, subFileNames = [], subDirNames = [];
				struct.path = pathName;
				items.forEach(function(item) {
					if (!isDirNameValid(item) ||
						item.startsWith('System') ||
						item.startsWith('.') ||
						item.split('.').pop() === 'jar' ||
						item.split('.').pop() === 'zip' ||
						item.split('.').pop() === 'pdf')
					{
						return;
					}
					var name = pathName + '/' + item,
						stats = fs.statSync(name);
					if (stats.isDirectory()) {
						subDirNames.push(name);
					}
					else if (stats.isFile()) {
						subFileNames.push(name);
					}
				});
				struct.dirs = subDirNames;
				if (subDirNames.length === 0) {
					return struct;
				}
				var subsArr = [];
				return struct;
			}

			if (fs.existsSync(pathName)) {
				var fileStruct = traverseFSDirs(pathName);
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.write(JSON.stringify(fileStruct, null, 2));
			} else {
				response.writeHead(400, {'Content-Type': 'text/html'});
			}
			response.end();

		}
		else if (urlData === 'getContent') {

			function traverseFSAll(pathName) {
				var items = fs.readdirSync(pathName);
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
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.write(JSON.stringify(fileStruct, null, 2));
			} else {
				response.writeHead(400, {'Content-Type': 'text/html'});
			}
			response.end();

		}
		else {
			fs.readFile(pathName, function (err, data) {
				if (err) {
					console.log(err);
					response.writeHead(404, {'Content-Type': 'text/html'});
				} else {
					response.writeHead(200, {'Content-Type': 'text/html'});
					response.write(data.toString());
				}
				response.end();
			});
		}
	} else if (verb === 'OPTIONS') {
		var origin = (request.headers.origin || "*");
		response.writeHead(
			"204",
			"No Content",
			{
				"access-control-allow-origin": origin,
				"access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
				"access-control-allow-headers": "*"
			}
		);
		return( response.end() );
	} else if (verb === 'POST') {
		if (urlData === 'writeFile') {
			var body = '';
			request.on('data', function(data) { body += data; });
			request.on('end', function() {
				try {
					fs.writeFileSync(pathName, body);
					response.writeHead(200, {'Content-Type': 'text/html'});
				} catch(error) {
					console.log('ERROR: '+JSON.stringify(error));
					response.writeHead(400, {'Content-Type': 'text/html'});
					response.write("ERROR: "+JSON.stringify(error));
				}
				response.end();
			});
		} else if (urlData === 'createDir') {
			fs.mkdir(pathName,function(err) {
				if (err) {
					response.writeHead(400, {'Content-Type': 'text/html'});
					response.write("ERROR: "+JSON.stringify(error));
					//return console.error(err);
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

			function removeFolder(pathName) {
				if (fs.existsSync(pathName)) {
					var items = fs.readdirSync(pathName);
					try {
						if (items.length > 0) {
							items.forEach(function(itemName) {
								if (fs.statSync(pathName + "/" + itemName).isDirectory()) {
									removeFolder(pathName + "/" + itemName);
								} else {
									fs.unlinkSync(pathName + "/" + itemName);
								}
							});
							fs.rmdirSync(pathName);
						} else {
							fs.rmdirSync(pathName);
						}
					} catch (error) {
						console.log(error);
					}
				} else {
					console.log("Directory pathName '"+pathName+"' not found");
				}
			}

			removeFolder(pathName);
			response.end();

		} else if (urlData === 'deleteFile') {
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
console.log('Server running at http://127.0.0.1:'+port);
