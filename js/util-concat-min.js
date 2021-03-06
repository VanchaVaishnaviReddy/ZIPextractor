zipextractor.util = {};
zipextractor.util.IS_NATIVE_BIND_ = Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1;
zipextractor.util.bindFn = function(e, t, n) {
    if (zipextractor.util.IS_NATIVE_BIND_) {
        return e.call.apply(e.bind, arguments)
    } else {
        if (arguments.length > 2) {
            var r = Array.prototype.slice.call(arguments, 2);
            return function() {
                var n = Array.prototype.slice.call(arguments);
                Array.prototype.unshift.apply(n, r);
                return e.apply(t, n)
            }
        } else {
            return function() {
                return e.apply(t, arguments)
            }
        }
    }
};
zipextractor.util.AsyncWorkQueue = function(e) {
    this.workQueue_ = [];
    this.numCurrentWorkers_ = 0;
    this.maxWorkers_ = e;
    this.runCompleteCallback_ = null;
    this.isRunning_ = false
};
zipextractor.util.AsyncWorkQueue.prototype.enqueue = function(e) {
    this.workQueue_.push(e)
};
zipextractor.util.AsyncWorkQueue.prototype.run = function(e) {
    this.runCompleteCallback_ = e;
    this.isRunning_ = true;
    this.processQueue_()
};
zipextractor.util.AsyncWorkQueue.prototype.processQueue_ = function() {
    while (this.numCurrentWorkers_ < this.maxWorkers_ && !this.isEmpty()) {
        this.executeNextWorkItem_()
    }
};
zipextractor.util.AsyncWorkQueue.prototype.stop = function() {
    this.workQueue_.length = 0;
    this.isRunning_ = false
};
zipextractor.util.AsyncWorkQueue.prototype.isEmpty = function() {
    return this.workQueue_.length === 0
};
zipextractor.util.AsyncWorkQueue.prototype.isActive = function() {
    return this.isRunning_ || !this.isDone()
};
zipextractor.util.AsyncWorkQueue.prototype.isDone = function() {
    return this.numCurrentWorkers_ === 0 && this.isEmpty()
};
zipextractor.util.AsyncWorkQueue.prototype.executeNextWorkItem_ = function() {
    var e = this.workQueue_.shift();
    if (this.numCurrentWorkers_ > this.maxWorkers_) {
        throw "Error: too many workers"
    }
    this.numCurrentWorkers_++;
    e(zipextractor.util.bindFn(this.workItemComplete_, this))
};
zipextractor.util.AsyncWorkQueue.prototype.workItemComplete_ = function() {
    if (!this.isRunning_) {
        return
    }
    this.numCurrentWorkers_--;
    if (this.numCurrentWorkers_ < 0) {
        throw "Error: too few workers."
    }
    var e = this.isDone();
    if (e) {
        this.isRunning_ = false;
        if (this.runCompleteCallback_) {
            this.runCompleteCallback_()
        }
    } else {
        this.processQueue_()
    }
};
zipextractor.util.PickerManager = function(e, t) {
    this.appConfig_ = e;
    this.authManager_ = t
};
zipextractor.util.PickerManager.PickerMode = {
    FILE: "file",
    FOLDER: "folder"
};
zipextractor.util.PickerManager.prototype.show = function(e, t) {
    var n = zipextractor.util.bindFn(this.showInternal_, this, e, t);
    var r = {
        callback: n
    };
    gapi.load("picker", r)
};
zipextractor.util.PickerManager.prototype.showInternal_ = function(e, t) {
    if (e == zipextractor.util.PickerManager.PickerMode.FILE) {
        this.showFilePicker_(zipextractor.util.bindFn(this.itemChosenInternalCallback_, this, t))
    } else if (e == zipextractor.util.PickerManager.PickerMode.FOLDER) {
        this.showFolderPicker_(zipextractor.util.bindFn(this.itemChosenInternalCallback_, this, t))
    } else {
        throw "Unexpected Picker Mode: " + e
    }
};
zipextractor.util.PickerManager.prototype.itemChosenInternalCallback_ = function(e, t) {
    if (t.action == google.picker.Action.PICKED) {
        var n = t.docs[0];
        e(n)
    }
};
zipextractor.util.PickerManager.prototype.showFilePicker_ = function(e) {
    var t = (new google.picker.DocsView(google.picker.ViewId.DOCS)).setSelectFolderEnabled(false).setIncludeFolders(false).setMode(google.picker.DocsViewMode.LIST).setMimeTypes("application/zip");
    var n = this.generatePickerBuilder_(t, e);
    n.setTitle("Select a file");
    var r = n.build();
    r.setVisible(true)
};
zipextractor.util.PickerManager.prototype.showFolderPicker_ = function(e) {
    var t = (new google.picker.DocsView(google.picker.ViewId.FOLDERS)).setSelectFolderEnabled(true).setIncludeFolders(true).setMode(google.picker.DocsViewMode.LIST).setMimeTypes("application/vnd.google-apps.folder");
    var n = this.generatePickerBuilder_(t, e);
    n.setTitle("Select a folder");
    var r = n.build();
    r.setVisible(true)
};
zipextractor.util.PickerManager.prototype.generatePickerBuilder_ = function(e, t) {
    return (new google.picker.PickerBuilder).enableFeature(google.picker.Feature.NAV_HIDDEN).setAppId(this.appConfig_.getAppId()).setOAuthToken(this.authManager_.getAccessToken()).setDeveloperKey(this.appConfig_.getApiKey()).setCallback(t).addView(e)
};
zipextractor.util.formatSize = function(e) {
    var t = 0;
    do {
        e /= 1024;
        t++
    } while (e > 1024);
    var n;
    if (t === 1) {
        n = Math.ceil(Math.max(e, zipextractor.util.MIN_VALUE_))
    } else {
        var r = Math.max(e, zipextractor.util.MIN_VALUE_);
        n = Math.round(r * Math.pow(10, 1)) / Math.pow(10, 1)
    }
    return n + " " + zipextractor.util.BYTE_UNITS_[t - 1]
};
zipextractor.util.BYTE_UNITS_ = ["KB", "MB", "GB", "TB"];
zipextractor.util.MIN_VALUE_ = .1;
zipextractor.util.DRIVE_URL_ = "https://drive.google.com/";
zipextractor.util.FOLDER_SUFFIX_ = "#folders/";
zipextractor.util.FILE_EXTENSION_REGEX_ = "/\\.[^/.]+$/";
zipextractor.util.endsWith = function(e, t) {
    return e.indexOf(t, e.length - t.length) !== -1
};
zipextractor.util.trimFileExtension = function(e) {
    return e.replace(zipextractor.util.FILE_EXTENSION_REGEX_, "")
};
zipextractor.util.createDriveFolderLink = function(e) {
    return zipextractor.util.DRIVE_URL_ + (e ? zipextractor.util.FOLDER_SUFFIX_ + e : "")
};
zipextractor.util.isEmptyObject = function(e) {
    var t;
    for (t in e) {
        return false
    }
    return true
};
zipextractor.util.getFileExtension = function(e) {
    var t = e.split(".");
    if (t.length === 1 || t[0] === "" && t.length === 2) {
        return ""
    }
    return t.pop().toLowerCase()
};
zipextractor.util.execLater = function(e, t) {
    window.setTimeout(function() {
        e();
        if (t) {
            t()
        }
    }, 0)
};
zipextractor.util.isIE = function() {
    try {
        var e = navigator.userAgent.toLowerCase();
        return e.indexOf("msie") != -1 ? parseInt(e.split("msie")[1], 10) : false
    } catch (t) {
        return false
    }
}