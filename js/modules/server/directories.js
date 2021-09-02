define(['modules/settings/config',
        'modules/graph/graphConstants'],
    function(config,
             constants) {

        var //_fsContent,
            _parentPath = "",
            _dirsList = [],
            _filesList = [],
            _folderSrc = 'images/dataflow/folder16.png',
            _fileSrc = 'images/dataflow/file16.png';

        // row = { id: '<full path>', label: '<file name>' }

        function Directories() {
            var self = this;

            self.parseFullContent = function(fsContent) {
                if (fsContent && Object.keys(fsContent).length > 0) {
                    _parentPath = getPath(fsContent.path);
                    _dirsList = parseDirs(fsContent.dirs);
                    _filesList = parseFiles(fsContent.files);
                } else {
                    _parentPath = "";
                    _dirsList = [];
                    _filesList = [];
                }
            };

            self.parseFoldersToList = function(fsContent) {
                _parentPath = getPath(fsContent.path);
                _dirsList = parseDirs(fsContent.dirs);
            };

            self.parseFilesToList = function(files) {
                _filesList = parseFiles(files);
            };

            function parseDirs(dirs) {
                if (!dirs) return [];
                var list = [];
                dirs.forEach(function(dir) {
                    var row = {},
                        path = getId(dir);
                    row.id = path;
                    row.displayId = path.replace('/', '\\');
                    row.fstype = 'dir';
                    row.title = path;
                    row.url = _folderSrc;
                    row.label = dir.split('/').pop();
                    list.push(row);
                });
                return list;
            }

            function parseFiles(files) {
                if (!files) return [];
                var list = [];
                files.forEach(function(file) {
                    var row = {},
                        path = getId(file);
                    row.id = path;
                    row.displayId = path.replace('/', '\\');
                    row.fstype = 'file';
                    row.title = path;
                    row.url = _fileSrc;
                    row.label = getFileLabel(path);
                    list.push(row);
                });
                return list;
            }

            function getPath(path) {
                if (!path) return "";
                var str = path;
                if (str.startsWith('//')) {
                    return str.substring(2);
                } else if (str.startsWith('/')) {
                    return str.substring(1);
                } else if (str === '/') {
                    return "";
                } else {
                    return str;
                }
            }

            function getId(item) {
                if (item.startsWith('//')) {
                    return item.substring(2);
                } else if (item.startsWith('/')) {
                    return item.substring(1);
                } else {
                    return item;
                }
            }

            function getFileLabel(path) {
                var last = path.lastIndexOf('/');
                if (last < 0) { return path; }
                else { return path.substring(last+1); }
            }

            self.getParentPath = function() {
                return _parentPath;
            };
            self.getDirectories = function() {
                return _dirsList;
            };
            self.getFilesList = function() {
                return _filesList;
            };
            self.getFullContent = function() {
                return _dirsList.concat(_filesList);
            };

            self.getDirectoriesLabels = function() {
                var labels = [];
                _dirsList.forEach(function(dir) {
                    labels.push(dir.label);
                });
                return labels;
            };

            self.getFilesLabels = function() {
                var labels = [];
                _filesList.forEach(function(file) {
                    labels.push(file.label);
                });
                return labels;
            };

        }
        return new Directories();

    }
);