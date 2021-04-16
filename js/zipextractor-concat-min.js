var zipextractor = {};
zipextractor.config = {};
zipextractor.state = {};
zipextractor.config.DRIVE_API_CONFIG_DATA = {
    clientId: "824911851129-6d64j0e08s86ih74l0lu386tqqfv71t9.apps.googleusercontent.com",
    appId: "824911851129",
    scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive.install"],
    apiKey: "AIzaSyBW4IYnFZLyPFFKtZ2qWJYTlURyyE-Vt_4"
};
zipextractor.App = function() {
    var e = new driveapi.AppConfig(zipextractor.config.DRIVE_API_CONFIG_DATA);
    this.presenter_ = new zipextractor.Presenter(e);
    this.presenter_.init()
};
zipextractor.App.prototype.onHtmlBodyLoaded = function() {
    this.presenter_.onHtmlBodyLoaded()
};
zipextractor.App.prototype.onGapiClientLoaded = function() {
    this.presenter_.onGapiClientLoaded()
};
zipextractor.Model = function() {
    this.filename_ = null;
    this.entryTree_ = null
};
zipextractor.Model.EXTRACTED_FOLDER_SUFFIX_ = "(Unzipped Files)";
zipextractor.Model.prototype.getFilename = function() {
    return this.filename_
};
zipextractor.Model.prototype.setFilename = function(e) {
    if (this.filename_) {
        throw "Existing model must be cleared before existing filename can be updated."
    }
    this.filename_ = e
};
zipextractor.Model.prototype.getEntryTree = function() {
    return this.entryTree_
};
zipextractor.Model.prototype.clear = function() {
    if (!(this.entryTree_ || this.filename_)) {
        throw "No exisitng model to clear."
    }
    this.filename_ = null;
    delete this.entryTree_
};
zipextractor.Model.prototype.build = function(e, t) {
    zipextractor.util.execLater(zipextractor.util.bindFn(this.buildInternal_, this, e), t)
};
zipextractor.Model.prototype.buildInternal_ = function(e) {
    if (this.entryTree_) {
        throw "Existing model must be cleared before being built."
    }
    var t = this.getFolderName_(this.filename_);
    this.entryTree_ = {
        directory: true,
        root: true,
        name: t,
        path: t,
        children: {},
        state: zipextractor.state.SessionState.DEFAULT
    };
    for (var n = 0; n < e.length; n++) {
        this.insertEntry_(this.entryTree_, e[n])
    }
};
zipextractor.Model.prototype.insertEntry_ = function(e, t) {
    var n = t.filename;
    if (zipextractor.util.endsWith(n, "/")) {
        n = n.substring(0, n.length - 1)
    }
    var r = n.split("/");
    var i = e;
    var s = null;
    for (var o = 0; o < r.length; o++) {
        var u = r[o];
        if (s === null) {
            s = u
        } else {
            s = s + "/" + u
        }
        var a = i.children[u];
        if (!a) {
            if (o < r.length - 1 || t.directory) {
                a = {};
                a.directory = true;
                a.children = {}
            } else {
                a = t
            }
            a.state = zipextractor.state.EntryState.DEFAULT;
            a.path = s;
            a.name = u;
            a.parentEntry = i;
            i.children[u] = a
        } else {}
        i = a
    }
};
zipextractor.Model.prototype.getFolderName_ = function(e) {
    return zipextractor.util.trimFileExtension(e) + " " + zipextractor.Model.EXTRACTED_FOLDER_SUFFIX_
};
zipextractor.Presenter = function(e) {
    this.appConfig_ = e;
    this.model_ = new zipextractor.Model;
    this.urlStateParser_ = new driveapi.UrlStateParser;
    this.zipReader_ = new zipextractor.ZipReader;
    this.authManager_ = new driveapi.AuthManager(e);
    this.fileManager_ = new driveapi.FileManager(this.authManager_);
    var t = new zipextractor.util.PickerManager(e, this.authManager_);
    this.view_ = new zipextractor.View(this, t);
    this.state_ = zipextractor.state.SessionState.DEFAULT;
    this.htmlBodyLoaded_ = false;
    this.apiLoaded_ = false;
    this.sharingLoaded_ = false;
    this.currentSession_ = null;
    this.hasDownloadBeenAutoRetried_ = false;
    this.lastDownloadId_ = null
};
zipextractor.Presenter.IS_DEBUG_ = false;
zipextractor.Presenter.prototype.onHtmlBodyLoaded = function() {
    this.htmlBodyLoaded_ = true;
    this.view_.init();
    if (!this.checkBrowser_()) {
        this.setState_(zipextractor.state.SessionState.UNSUPPORTED_BROWSER);
        return
    }
    this.parseUrlState_();
    if (this.apiLoaded_) {
        this.authorize_(true)
    }
    if (zipextractor.Presenter.IS_DEBUG_) {
        this.processRequestFromState_()
    }
};
zipextractor.Presenter.prototype.onGapiClientLoaded = function() {
    if (!this.checkBrowser_()) {
        this.setState_(zipextractor.state.SessionState.UNSUPPORTED_BROWSER);
        return
    }
    this.apiLoaded_ = true;
    this.setState_(zipextractor.state.SessionState.API_LOADED);
    this.parseUrlState_();
    if (this.htmlBodyLoaded_) {
        this.authorize_(true)
    }
    gapi.load("drive-share", zipextractor.util.bindFn(this.sharingLoadComplete_, this))
};
zipextractor.Presenter.prototype.parseUrlState_ = function() {
    if (!this.urlStateParser_.isParsed()) {
        this.setState_(zipextractor.state.SessionState.READ_URL_STATE);
        this.urlStateParser_.parseState()
    }
};
zipextractor.Presenter.prototype.sharingLoadComplete_ = function() {
    this.sharingLoaded_ = true
};
zipextractor.Presenter.prototype.showSharingDialog_ = function(e) {
    var t = new gapi.drive.share.ShareClient(this.appConfig_.getAppId());
    t.setItemIds([e]);
    t.showSettingsDialog()
};
zipextractor.Presenter.prototype.checkBrowser_ = function() {
    var e = zipextractor.util.isIE();
    return !e || e && !(e <= 9)
};
zipextractor.Presenter.prototype.init = function() {
    this.setState_(zipextractor.state.SessionState.INIT)
};
zipextractor.Presenter.prototype.updateEntryState = function(e, t) {
    var n = e.state;
    e.state = t;
    this.view_.updateEntryState(e, t, n)
};
zipextractor.Presenter.prototype.setState_ = function(e, t) {
    var n = this.state_;
    this.state_ = e;
    this.view_.updateState(e, n, t)
};
zipextractor.Presenter.prototype.authorize_ = function(e) {
    if (zipextractor.Presenter.IS_DEBUG_) {
        return
    }
    var t = e ? zipextractor.state.SessionState.AUTH_PENDING_AUTO : zipextractor.state.SessionState.AUTH_PENDING_USER;
    this.setState_(t);
    this.authManager_.authorize(e, zipextractor.util.bindFn(this.handleAuthResult_, this), this.urlStateParser_.getUserId())
};
zipextractor.Presenter.prototype.handleAuthResult_ = function(e) {
    if (e) {
        if (e.error) {
            this.setState_(zipextractor.state.SessionState.AUTH_ERROR, e.error)
        } else {
            this.setState_(zipextractor.state.SessionState.AUTH_SUCCESS);
            this.processRequestFromState_()
        }
    } else {
        this.setState_(zipextractor.state.SessionState.AUTH_REQUIRED)
    }
};
zipextractor.Presenter.prototype.processRequestFromState_ = function() {
    this.setState_(zipextractor.state.SessionState.READ_URL_STATE);
    this.urlStateParser_.parseState();
    if (this.urlStateParser_.isForOpen()) {
        this.downloadFileById_(this.urlStateParser_.getFileId())
    } else {
        this.startNewSession_()
    }
};
zipextractor.Presenter.prototype.startNewSession_ = function() {
    this.view_.updatePageTitle();
    this.setState_(zipextractor.state.SessionState.NEW_SESSION)
};
zipextractor.Presenter.prototype.downloadFileById_ = function(e) {
    this.lastDownloadId_ = e;
    this.setState_(zipextractor.state.SessionState.DOWNLOADING_METADATA);
    var t = this.fileManager_.generateCallbacks(zipextractor.util.bindFn(this.downloadFile_, this), zipextractor.util.bindFn(this.onDownloadError_, this), undefined, zipextractor.util.bindFn(this.onDownloadAborted_, this));
    this.fileManager_.get(e, t)
};
zipextractor.Presenter.prototype.downloadFile_ = function(e) {
    this.setState_(zipextractor.state.SessionState.DOWNLOADING, e);
    var fileSize = e.fileSize ? parseInt(e.fileSize, 10) : -1;
    var t = this.fileManager_.generateCallbacks(zipextractor.util.bindFn(this.onDownloadSuccess_, this), zipextractor.util.bindFn(this.onDownloadError_, this), zipextractor.util.bindFn(this.onDownloadProgress_, this, fileSize), zipextractor.util.bindFn(this.onDownloadAborted_, this));
    this.fileManager_.downloadFile(e, t)
};
zipextractor.Presenter.prototype.onDownloadSuccess_ = function(e, t) {
    this.setState_(zipextractor.state.SessionState.DOWNLOADED);
    this.createSession_(e);
    this.initModel_(e.title, t)
};
zipextractor.Presenter.prototype.onDownloadError_ = function(e, t) {
    if (!this.hasDownloadBeenAutoRetried_) {
        this.hasDownloadBeenAutoRetried_ = true;
        if (e == driveapi.FileManager.ErrorType.AUTH_ERROR) {
            this.setState_(zipextractor.state.SessionState.AUTH_PENDING_AUTO);
            this.authManager_.authorize(true, zipextractor.util.bindFn(this.downloadFileById_, this, this.lastDownloadId_))
        } else {
            this.downloadFileById_(this.lastDownloadId_)
        }
    } else {
        this.setState_(zipextractor.state.SessionState.DOWNLOAD_ERROR, t)
    }
};
zipextractor.Presenter.prototype.onDownloadProgress_ = function(fileSize, e, total) {
    if (this.state_ == zipextractor.state.SessionState.DOWNLOAD_CANCELED) {
        return
    }
    if (fileSize != -1) {
        this.view_.handleDownloadProgress(e, fileSize);
        if (e === fileSize) {
            this.setState_(zipextractor.state.SessionState.DOWNLOAD_ALL_BYTES_TRANSFERRED)
        }
    }
};
zipextractor.Presenter.prototype.onDownloadAborted_ = function() {
    this.handleDownloadCanceled_()
};
zipextractor.Presenter.prototype.handleDownloadCanceled_ = function() {
    this.setState_(zipextractor.state.SessionState.DOWNLOAD_CANCELED)
};
zipextractor.Presenter.prototype.initModel_ = function(e, t) {
    this.view_.updatePageTitle(e);
    this.setState_(zipextractor.state.SessionState.ZIP_READING);
    this.model_.setFilename(e);
    this.zipReader_.read(t, zipextractor.util.bindFn(this.zipReadSuccess_, this), zipextractor.util.bindFn(this.zipReadError_, this))
};
zipextractor.Presenter.prototype.zipReadError_ = function(e) {
    this.setState_(zipextractor.state.SessionState.ZIP_READ_ERROR, e)
};
zipextractor.Presenter.prototype.zipReadSuccess_ = function(e) {
    this.setState_(zipextractor.state.SessionState.MODEL_BUILDING);
    this.model_.build(e, zipextractor.util.bindFn(this.modelBuildComplete_, this))
};
zipextractor.Presenter.prototype.modelBuildComplete_ = function() {
    this.setState_(zipextractor.state.SessionState.MODEL_BUILT, this.model_);
    this.setState_(zipextractor.state.SessionState.RENDER_ZIP_UI, zipextractor.util.bindFn(this.zipUiRenderComplete_, this))
};
zipextractor.Presenter.prototype.zipUiRenderComplete_ = function() {
    this.setState_(zipextractor.state.SessionState.PENDING_USER_INPUT)
};
zipextractor.Presenter.prototype.createSession_ = function(e) {
    this.currentSession_ = new zipextractor.Session(this.urlStateParser_.getFolderId(), this, this.model_, this.view_, this.fileManager_);
    if (e) {
        this.currentSession_.updateParentIdByFile(e)
    }
};
zipextractor.Presenter.prototype.extract_ = function(e) {
    this.setState_(zipextractor.state.SessionState.EXTRACTING, this.model_.getEntryTree());
    this.currentSession_.execute(e)
};
zipextractor.Presenter.prototype.reset_ = function() {
    if (this.currentSession_) {
        this.currentSession_.close();
        this.currentSession_ = null;
        this.model_.clear()
    }
    this.lastDownloadId_ = null;
    this.hasDownloadBeenAutoRetried_ = false
};
zipextractor.Presenter.prototype.VIEW__authRequested = function() {
    this.authorize_(false)
};
zipextractor.Presenter.prototype.VIEW__driveFileChosen = function(e) {
    this.downloadFileById_(e.id)
};
zipextractor.Presenter.prototype.VIEW__driveFolderChosen = function(e) {
    this.currentSession_.setParentId(e.id);
    this.view_.updateDestinationFolderUi(e)
};
zipextractor.Presenter.prototype.VIEW__localBlobChosen = function(e, t) {
    this.createSession_(undefined);
    this.initModel_(e, t)
};
zipextractor.Presenter.prototype.VIEW__extractNow = function() {
    this.extract_(false)
};
zipextractor.Presenter.prototype.VIEW__cancelSession = function() {
    this.setState_(zipextractor.state.SessionState.SESSION_CANCELED);
    this.reset_();
    this.startNewSession_()
};
zipextractor.Presenter.prototype.VIEW__reset = function() {
    this.reset_();
    this.startNewSession_()
};
zipextractor.Presenter.prototype.VIEW__rateApp = function() {
    var e = "https://chrome.google.com/webstore/detail/zip-extractor/mmfcakoljjhncfphlflcedhgogfhpbcd/reviews?hl=en-US";
    window.open(e, "_blank").focus()
};
zipextractor.Presenter.prototype.VIEW__cancelExtraction = function() {
    this.setState_(zipextractor.state.SessionState.EXTRACTION_CANCEL_REQUESTED);
    this.currentSession_.abort()
};
zipextractor.Presenter.prototype.SESSION__extractionComplete = function() {
    var e = this.currentSession_.hasErrors();
    if (e && !this.currentSession_.hasBeenRetried()) {
        if (this.currentSession_.hasAuthErrors()) {
            this.setState_(zipextractor.state.SessionState.AUTH_PENDING_AUTO);
            this.authManager_.authorize(true, zipextractor.util.bindFn(this.extract_, this, true))
        } else {
            this.extract_(true)
        }
    } else {
        this.setState_(zipextractor.state.SessionState.EXTRACTION_COMPLETE, e)
    }
};
zipextractor.Presenter.prototype.SESSION__extractionCanceled = function() {
    this.setState_(zipextractor.state.SessionState.EXTRACTION_CANCELED)
};
zipextractor.Presenter.prototype.VIEW__shareExtractedFiles = function() {
    var e = this.getNewParentId_();
    if (e) {
        if (this.sharingLoaded_) {
            this.showSharingDialog_(this.getNewParentId_())
        }
    }
};
zipextractor.Presenter.prototype.VIEW__viewExtractedFiles = function() {
    var e = zipextractor.util.createDriveFolderLink(this.getNewParentId_());
    var t = window.open(e, "_blank");
    t.focus()
};
zipextractor.Presenter.prototype.VIEW__retryErrors = function() {
    this.extract_(true)
};
zipextractor.Presenter.prototype.VIEW__retryDownload = function() {
    this.hasDownloadBeenAutoRetried_ = false;
    this.downloadFileById_(this.lastDownloadId_)
};
zipextractor.Presenter.prototype.VIEW__downloadBrowser = function(e) {
    var t = null;
    switch (e) {
        case "chrome":
            t = "http://www.google.com/chrome";
            break;
        case "firefox":
            t = "http://www.mozilla.org/en-US/firefox/new/";
            break;
        case "ie":
            t = "http://windows.microsoft.com/en-us/internet-explorer/download-ie";
            break
    }
    if (t) {
        var n = window.open(t, "_blank");
        n.focus()
    }
};
zipextractor.Presenter.prototype.VIEW__cancelDownload = function() {
    this.setState_(zipextractor.state.SessionState.CANCEL_DOWNLOAD_REQUESTED);
    this.fileManager_.abortDownload()
};
zipextractor.Presenter.prototype.getNewParentId_ = function() {
    var e = this.model_.getEntryTree();
    if (e && e.folder) {
        return e.folder.id
    } else if (this.currentSession_ && this.currentSession_.getParentId()) {
        return this.currentSession_.getParentId()
    } else {
        return null
    }
};
zipextractor.Session = function(e, t, n, r, i) {
    this.parentId_ = e;
    this.presenter_ = t;
    this.model_ = n;
    this.view_ = r;
    this.workQueue_ = new zipextractor.util.AsyncWorkQueue(zipextractor.Session.MAX_WORKQUEUE_WORKERS_);
    this.fileManager_ = i;
    this.entryStateMap_ = {};
    this.entriesInProcessMap_ = {};
    this.totalSessionSize_ = 0;
    this.currentSessionProgress_ = 0;
    this.isClosed_ = false;
    this.isAborted_ = false;
    this.hasBeenRetried_ = false
};
zipextractor.Session.MAX_WORKQUEUE_WORKERS_ = 2;
zipextractor.Session.TRANSFER_DECOMPRESS_MULTIPLIER_ = 3;
zipextractor.Session.ENTRY_OVERHEAD_BYTES_ = 2e4;
zipextractor.Session.prototype.updateParentIdByFile = function(e) {
    var t = e.parents;
    if (t && t.length > 0) {
        var n = t[0];
        if (n && n.id) {
            this.parentId_ = n.id
        }
    }
};
zipextractor.Session.prototype.getParentId = function() {
    return this.parentId_
};
zipextractor.Session.prototype.setParentId = function(e) {
    this.parentId_ = e
};
zipextractor.Session.prototype.abort = function() {
    this.isAborted_ = true;
    this.workQueue_.stop();
    this.fileManager_.abortAllRequests();
    this.cancelAllUnstartedEntries_();
    this.checkForExtractionComplete_()
};
zipextractor.Session.prototype.close = function() {
    if (this.isClosed_) {
        throw "Error: Cannot close an already closed session."
    }
    this.model_ = null;
    this.parentId_ = null;
    delete this.workQueue_;
    this.entryStateMap_ = {};
    this.entriesInProcessMap_ = {};
    this.fileManager_ = null;
    this.totalSessionSize_ = 0;
    this.currentSessionProgress_ = 0;
    this.isClosed_ = true
};
zipextractor.Session.prototype.hasBeenRetried = function() {
    return this.hasBeenRetried_
};
zipextractor.Session.prototype.hasErrors = function() {
    var e = this.model_.getEntryTree();
    if (this.isErrorState_(e.state)) {
        return true
    } else {
        return this.childEntriesHaveErrors_(e)
    }
};
zipextractor.Session.prototype.childEntriesHaveErrors_ = function(e) {
    for (var t in e.children) {
        var n = e.children[t];
        if (this.isErrorState_(n.state)) {
            return true
        } else if (n.directory && this.childEntriesHaveErrors_(n)) {
            return true
        }
    }
    return false
};
zipextractor.Session.prototype.hasAuthErrors = function() {
    var e = this.model_.getEntryTree();
    if (this.entryHasAuthError_(e)) {
        return true
    } else {
        return this.childEntriesHaveAuthErrors_(e)
    }
};
zipextractor.Session.prototype.childEntriesHaveAuthErrors_ = function(e) {
    for (var t in e.children) {
        var n = e.children[t];
        if (this.entryHasAuthError_(n)) {
            return true
        } else if (n.directory && this.childEntriesHaveAuthErrors_(n)) {
            return true
        }
    }
    return false
};
zipextractor.Session.prototype.entryHasAuthError_ = function(e) {
    return e.uploadError == driveapi.FileManager.ErrorType.AUTH_ERROR && e.state == zipextractor.state.EntryState.UPLOAD_ERROR
};
zipextractor.Session.prototype.execute = function(e) {
    if (this.isClosed_) {
        throw "Error: Cannot execute a closed session."
    }
    if (e) {
        this.hasBeenRetried_ = true
    }
    var t = this.model_.getEntryTree();
    this.queueEntry_(t);
    this.queueEntryChildren_(t);
    this.currentSessionProgress_ = 0;
    this.totalSessionSize_ = this.computeSessionSize_(t);
    if (this.isUploadableState_(t.state)) {
        this.workQueue_.enqueue(this.generateWorkItem_(t, this.parentId_));
        this.updateEntryState_(t, zipextractor.state.EntryState.PENDING);
        this.runWorkQueue_()
    } else {
        this.processEntryTreeChildren_(t, this.parentId_, e)
    }
};
zipextractor.Session.prototype.processEntryTreeChildren_ = function(e, t, n) {
    for (var r in e.children) {
        var i = e.children[r];
        if (this.isAborted_) {
            this.updateEntryState_(i, zipextractor.state.EntryState.CANCELED)
        } else {
            if (this.isUploadableState_(i.state)) {
                this.workQueue_.enqueue(this.generateWorkItem_(i, t));
                this.updateEntryState_(i, zipextractor.state.EntryState.PENDING)
            } else if (!!n && i.directory && i.state == zipextractor.state.EntryState.UPLOAD_COMPLETE) {
                this.processEntryTreeChildren_(i, i.folder.id, n)
            }
        }
    }
    if (!this.isAborted_) {
        this.runWorkQueue_()
    }
};
zipextractor.Session.prototype.computeSessionSize_ = function(e) {
    return this.getEntrySize_(e) + this.computeChildEntrySize_(e)
};
zipextractor.Session.prototype.computeChildEntrySize_ = function(e) {
    var t = 0;
    for (var n in e.children) {
        var r = e.children[n];
        var i = this.getEntrySize_(r);
        var s = r.directory ? this.computeChildEntrySize_(r) : 0;
        t += i + s
    }
    return t
};
zipextractor.Session.prototype.getEntrySize_ = function(e) {
    if (!this.isUploadableState_(e.state)) {
        return 0
    } else {
        var t = e.directory ? 0 : e.compressedSize + zipextractor.Session.TRANSFER_DECOMPRESS_MULTIPLIER_ * e.uncompressedSize;
        return t + zipextractor.Session.ENTRY_OVERHEAD_BYTES_
    }
};
zipextractor.Session.prototype.queueEntry_ = function(e) {
    if (e.state == zipextractor.state.EntryState.DEFAULT) {
        var t = this.view_.isSelected(e) ? zipextractor.state.EntryState.QUEUED : zipextractor.state.EntryState.SKIPPED;
        this.updateEntryState_(e, t)
    }
};
zipextractor.Session.prototype.queueEntryChildren_ = function(e) {
    for (var t in e.children) {
        var n = e.children[t];
        this.queueEntry_(n);
        if (n.directory) {
            this.queueEntryChildren_(n)
        }
    }
};
zipextractor.Session.prototype.cancelAllUnstartedEntries_ = function() {
    var e = this.model_.getEntryTree();
    this.cancelUnstartedEntry_(e);
    this.cancelUnstartedChildEntries_(e)
};
zipextractor.Session.prototype.cancelUnstartedEntry_ = function(e) {
    if (!this.isTerminalState_(e.state) && !this.isInProgressState_(e.state)) {
        this.updateEntryState_(e, zipextractor.state.EntryState.CANCELED)
    }
};
zipextractor.Session.prototype.cancelUnstartedChildEntries_ = function(e) {
    for (var t in e.children) {
        var n = e.children[t];
        this.cancelUnstartedEntry_(n);
        if (n.directory) {
            this.cancelUnstartedChildEntries_(n)
        }
    }
};
zipextractor.Session.prototype.runWorkQueue_ = function() {
    this.workQueue_.run(zipextractor.util.bindFn(this.workQueueExecutionComplete_, this))
};
zipextractor.Session.prototype.updateEntryState_ = function(e, t) {
    this.updateEntryStateMap_(e, t);
    this.presenter_.updateEntryState(e, t)
};
zipextractor.Session.prototype.incrementSessionProgress_ = function(e, t) {
    if (this.isAborted_) {
        return
    }
    this.currentSessionProgress_ += t;
    this.view_.handleSessionProgress(this.currentSessionProgress_, this.totalSessionSize_)
};
zipextractor.Session.prototype.updateEntryStateMap_ = function(e, t) {
    var n = e.state;
    var r = e.path;
    var i = this.entryStateMap_[t];
    if (!i) {
        i = {};
        this.entryStateMap_[t] = i
    }
    i[r] = e;
    var s = this.entryStateMap_[n];
    if (s) {
        if (s.hasOwnProperty(r)) {
            delete s[r]
        }
    }
    if (this.isTerminalState_(t)) {
        delete this.entriesInProcessMap_[r]
    } else {
        this.entriesInProcessMap_[r] = e
    }
};
zipextractor.Session.prototype.areAllStatesTerminal_ = function() {
    return Object.keys(this.entriesInProcessMap_).length === 0
};
zipextractor.Session.prototype.isTerminalState_ = function(e) {
    return e == zipextractor.state.EntryState.UPLOAD_COMPLETE || e == zipextractor.state.EntryState.UPLOAD_ERROR || e == zipextractor.state.EntryState.SKIPPED || e == zipextractor.state.EntryState.CANCELED || e == zipextractor.state.EntryState.QUEUED_PENDING_RETRY || e == zipextractor.state.EntryState.UPLOAD_ABORTED
};
zipextractor.Session.prototype.isUploadableState_ = function(e) {
    return e == zipextractor.state.EntryState.QUEUED || e == zipextractor.state.EntryState.QUEUED_PENDING_RETRY || e == zipextractor.state.EntryState.UPLOAD_ERROR
};
zipextractor.Session.prototype.isErrorState_ = function(e) {
    return e == zipextractor.state.EntryState.UPLOAD_ERROR || e == zipextractor.state.EntryState.DECOMPRESSION_ERROR
};
zipextractor.Session.prototype.isInProgressState_ = function(e) {
    return e == zipextractor.state.EntryState.BEGIN_UPLOAD || e == zipextractor.state.EntryState.UPLOAD_PROGRESS || e == zipextractor.state.EntryState.UPLOAD_ALL_BYTES_TRANSFERRED
};
zipextractor.Session.prototype.generateWorkItem_ = function(e, t) {
    e.parentId = t;
    var n = e.directory ? this.processFolder_ : this.processFile_;
    return zipextractor.util.bindFn(n, this, e, t)
};
zipextractor.Session.prototype.processFolder_ = function(e, t, n) {
    if (this.isAborted_) {
        this.updateEntryState_(e, zipextractor.state.EntryState.CANCELED);
        return
    }
    e.uploadPrev = 0;
    e.uploadCurrent = 0;
    e.uploadTotal = 0;
    this.updateEntryState_(e, zipextractor.state.EntryState.BEGIN_UPLOAD);
    var r = this.fileManager_.generateCallbacks(zipextractor.util.bindFn(this.folderInsertComplete_, this, e, n, zipextractor.util.bindFn(this.processEntryTreeChildren_, this, e)), zipextractor.util.bindFn(this.folderInsertError_, this, e, n), undefined, zipextractor.util.bindFn(this.folderInsertAborted_, this, e, n));
    this.fileManager_.insertFolder(e.name, t, r)
};
zipextractor.Session.prototype.processFile_ = function(e, t, n) {
    if (this.isAborted_) {
        this.updateEntryState_(e, zipextractor.state.EntryState.CANCELED);
        return
    }
    e.decompressionPrev = 0;
    e.decompressionCurrent = 0;
    e.decompressionTotal = 0;
    e.uploadPrev = 0;
    e.uploadCurrent = 0;
    e.uploadTotal = 0;
    this.updateEntryState_(e, zipextractor.state.EntryState.BEGIN_DECOMPRESSION);
    e.getData(new zip.BlobWriter, zipextractor.util.bindFn(this.decompressionComplete_, this, e, t, n), zipextractor.util.bindFn(this.handleDecompressionProgress_, this, e), true)
};
zipextractor.Session.prototype.handleDecompressionProgress_ = function(e, t, n) {
    if (this.isAborted_) {
        return
    }
    e.decompressionPrev = e.decompressionCurrent ? e.decompressionCurrent : 0;
    e.decompressionCurrent = t;
    e.decompressionTotal = n;
    this.updateEntryState_(e, zipextractor.state.EntryState.DECOMPRESSION_PROGRESS);
    var r = e.decompressionCurrent - e.decompressionPrev;
    this.incrementSessionProgress_(e, r)
};
zipextractor.Session.prototype.decompressionComplete_ = function(e, t, n, r) {
    if (this.isAborted_) {
        this.updateEntryState_(e, zipextractor.state.EntryState.CANCELED);
        this.checkForExtractionComplete_();
        return
    }
    this.updateEntryState_(e, zipextractor.state.EntryState.DECOMPRESSION_COMPLETE);
    this.uploadFile_(e, t, r, n)
};
zipextractor.Session.prototype.uploadFile_ = function(e, t, n, r) {
    if (this.isAborted_) {
        this.updateEntryState_(e, zipextractor.state.EntryState.CANCELED);
        this.checkForExtractionComplete_();
        return
    }
    this.updateEntryState_(e, zipextractor.state.EntryState.BEGIN_UPLOAD);
    var i = this.fileManager_.generateCallbacks(zipextractor.util.bindFn(this.fileUploadComplete_, this, e, r), zipextractor.util.bindFn(this.fileUploadError_, this, e, r), zipextractor.util.bindFn(this.fileUploadProgress_, this, e), zipextractor.util.bindFn(this.fileUploadAborted_, this, e, r));
    this.fileManager_.insertBlob(n, e.name, t, i)
};
zipextractor.Session.prototype.fileUploadComplete_ = function(e, t, n) {
    e.file = n;
    this.updateEntryState_(e, zipextractor.state.EntryState.UPLOAD_COMPLETE);
    this.view_.updateUiForFileComplete(e, n.alternateLink, n.iconLink);
    this.incrementSessionProgress_(e, zipextractor.Session.ENTRY_OVERHEAD_BYTES_);
    t();
    if (this.isAborted_) {
        this.checkForExtractionComplete_()
    }
};
zipextractor.Session.prototype.fileUploadError_ = function(e, t, n, r) {
    this.incrementSessionProgress_(e, zipextractor.Session.ENTRY_OVERHEAD_BYTES_);
    e.uploadError = n;
    e.message = r;
    this.updateEntryState_(e, zipextractor.state.EntryState.UPLOAD_ERROR, n);
    t();
    this.checkForExtractionComplete_()
};
zipextractor.Session.prototype.fileUploadAborted_ = function(e, t, n) {
    this.incrementSessionProgress_(e, zipextractor.Session.ENTRY_OVERHEAD_BYTES_);
    e.aborted = true;
    e.message = n;
    this.updateEntryState_(e, zipextractor.state.EntryState.UPLOAD_ABORTED, n);
    t();
    this.checkForExtractionComplete_()
};
zipextractor.Session.prototype.fileUploadProgress_ = function(e, t, n) {
    if (this.isAborted_) {
        return
    }
    e.uploadPrev = e.uploadCurrent ? e.uploadCurrent : 0;
    e.uploadCurrent = t;
    e.uploadTotal = n;
    this.updateEntryState_(e, zipextractor.state.EntryState.UPLOAD_PROGRESS);
    if (t === n) {
        this.updateEntryState_(e, zipextractor.state.EntryState.UPLOAD_ALL_BYTES_TRANSFERRED)
    }
    var r = e.uploadCurrent - e.uploadPrev;
    var i = e.uncompressedSize / n * r;
    this.incrementSessionProgress_(e, zipextractor.Session.TRANSFER_DECOMPRESS_MULTIPLIER_ * i)
};
zipextractor.Session.prototype.folderInsertComplete_ = function(e, t, n, r) {
    e.folder = r;
    this.updateEntryState_(e, zipextractor.state.EntryState.UPLOAD_COMPLETE);
    this.view_.updateUiForFileComplete(e, zipextractor.util.createDriveFolderLink(r.id));
    this.incrementSessionProgress_(e, zipextractor.Session.ENTRY_OVERHEAD_BYTES_);
    n(r.id);
    t();
    if (this.isAborted_) {
        this.checkForExtractionComplete_()
    }
};
zipextractor.Session.prototype.folderInsertError_ = function(e, t, n, r) {
    this.incrementSessionProgress_(e, zipextractor.Session.ENTRY_OVERHEAD_BYTES_);
    e.uploadError = n;
    e.message = r;
    this.updateEntryState_(e, zipextractor.state.EntryState.UPLOAD_ERROR, r);
    this.setAllChildEntriesQueuedPendingRetry_(e);
    t();
    this.checkForExtractionComplete_()
};
zipextractor.Session.prototype.folderInsertAborted_ = function(e, t, n) {
    this.incrementSessionProgress_(e, zipextractor.Session.ENTRY_OVERHEAD_BYTES_);
    e.aborted = true;
    e.message = n;
    this.updateEntryState_(e, zipextractor.state.EntryState.UPLOAD_ABORTED, n);
    this.cancelAllChildEntries_(e);
    t();
    this.checkForExtractionComplete_()
};
zipextractor.Session.prototype.cancelAllChildEntries_ = function(e) {
    for (var t in e.children) {
        var n = e.children[t];
        this.updateEntryState_(n, zipextractor.state.EntryState.CANCELED);
        if (n.directory) {
            this.cancelAllChildEntries_(n)
        }
    }
};
zipextractor.Session.prototype.setAllChildEntriesQueuedPendingRetry_ = function(e) {
    for (var t in e.children) {
        var n = e.children[t];
        if (n.state != zipextractor.state.EntryState.SKIPPED) {
            this.updateEntryState_(n, zipextractor.state.EntryState.QUEUED_PENDING_RETRY);
            this.incrementSessionProgress_(n, zipextractor.Session.ENTRY_OVERHEAD_BYTES_);
            if (n.directory) {
                this.setAllChildEntriesQueuedPendingRetry_(n)
            }
        }
    }
};
zipextractor.Session.prototype.workQueueExecutionComplete_ = function() {
    this.checkForExtractionComplete_()
};
zipextractor.Session.prototype.checkForExtractionComplete_ = function() {
    if (this.areAllStatesTerminal_()) {
        if (this.isAborted_) {
            this.presenter_.SESSION__extractionCanceled()
        } else {
            this.presenter_.SESSION__extractionComplete()
        }
    }
};
zipextractor.state.SessionState = {
    DEFAULT: "default",
    INIT: "init",
    UNSUPPORTED_BROWSER: "unsupportedBrowser",
    NEW_SESSION: "newSession",
    APP_CREATE: "appCreate",
    APP_CREATED: "appCreated",
    APP_INIT: "appInit",
    AUTH_PENDING_AUTO: "authPendingAuto",
    AUTH_PENDING_USER: "authPendingUser",
    AUTH_REQUIRED: "authRequired",
    AUTH_SUCCESS: "authSuccess",
    AUTH_ERROR: "authError",
    DOWNLOADING: "downloading",
    DOWNLOADING_METADATA: "downloadingMetadata",
    CANCEL_DOWNLOAD_REQUESTED: "cancelDownloadRequested",
    DOWNLOAD_CANCELED: "downloadCanceled",
    DOWNLOAD_ALL_BYTES_TRANSFERRED: "downloadAllBytesTransferred",
    DOWNLOADED: "downloaded",
    DOWNLOAD_ERROR: "downloadError",
    ZIP_READING: "zipReading",
    ZIP_READ_ERROR: "zipReadError",
    MODEL_BUILDING: "modelBuilding",
    MODEL_BUILT: "modelBuilt",
    EXTRACTING: "extracting",
    EXTRACTION_COMPLETE: "extractionComplete",
    READ_URL_STATE: "readUrlState",
    API_LOADED: "apiLoaded",
    PENDING_USER_INPUT: "pendingUserInput",
    SESSION_CANCELED: "sessionCanceled",
    EXTRACTION_CANCEL_REQUESTED: "extractionCancelRequested",
    EXTRACTION_CANCELED: "extractionCanceled",
    RENDER_ZIP_UI: "renderZipUi",
    COMPLETE_WITH_ERRORS: "completeWithErrors"
};
zipextractor.state.EntryState = {
    DEFAULT: "default",
    QUEUED: "queued",
    QUEUED_PENDING_RETRY: "queuedPendingRetry",
    SKIPPED: "skipped",
    PENDING: "pending",
    WAITING: "waiting",
    CANCELED: "canceled",
    BEGIN_DECOMPRESSION: "beginDecompression",
    DECOMPRESSION_PROGRESS: "decompressionProgress",
    DECOMPRESSION_COMPLETE: "decompressionComplete",
    DECOMPRESSION_ERROR: "decompressionError",
    BEGIN_UPLOAD: "beginUpload",
    UPLOAD_PROGRESS: "uploadProgress",
    UPLOAD_ERROR: "uploadError",
    UPLOAD_ALL_BYTES_TRANSFERRED: "uploadAllBytesTransferred",
    UPLOAD_COMPLETE: "uploadComplete",
    UPLOAD_ABORTED: "uploadAborted"
};
zipextractor.Table = function(e) {
    this.tableEl_ = e;
    this.rootEntry_ = null
};
zipextractor.Table.INDENT_PX_ = 24;
zipextractor.Table.BASE_INDENT_PX_ = 5;
zipextractor.Table.UNCHECKED_COLOR_ = "#888";
zipextractor.Table.Herf = "#";
zipextractor.Table.IMAGES_PATH_ = "images/";
zipextractor.Table.Icon_ = {
    CONTAINER: "folder.png",
    FOLDER: "folder.png",
    FILE: "file.png",
    SPINNER: "spinner.gif"
};
zipextractor.Table.prototype.clear = function() {
    while (this.tableEl_.rows.length > 1) {
        this.tableEl_.deleteRow(1)
    }
    this.rootEntry_ = null
};
zipextractor.Table.prototype.lockForSession = function(e) {
    this.getCheckboxForEntry_(e).disabled = true;
    this.disableCheckboxesForChildren_(e)
};
zipextractor.Table.prototype.updateChildEntryIndents_ = function(e, t) {
    for (var n in e.children) {
        var r = e.children[n];
        this.shiftEntryPadding_(r, t);
        if (r.directory) {
            this.updateChildEntryIndents_(r, t)
        }
    }
};
zipextractor.Table.prototype.shiftEntryPadding_ = function(e, t) {
    var n = e.tableRow.cells[0];
    var r = parseInt(n.style.paddingLeft, 10);
    this.setCellPaddingLeft_(n, r + t)
};
zipextractor.Table.prototype.setCellPaddingLeft_ = function(e, t) {
    e.style.paddingLeft = t + "px"
};
zipextractor.Table.prototype.disableCheckboxesForChildren_ = function(e) {
    for (var t in e.children) {
        var n = e.children[t];
        this.getCheckboxForEntry_(n).disabled = true;
        if (n.directory) {
            this.disableCheckboxesForChildren_(n)
        }
    }
};
zipextractor.Table.prototype.isRootEntryFolderCreated = function() {
    return this.getCheckboxForEntry_(this.rootEntry_).checked
};
zipextractor.Table.prototype.generate = function(e, t) {
    zipextractor.util.execLater(zipextractor.util.bindFn(this.generateInternal_, this, e), t)
};
zipextractor.Table.prototype.generateInternal_ = function(e) {
    this.clear();
    this.rootEntry_ = e;
    e.tableRow = this.generateFileTableRow_(e, 0);
  	  this.generateChildren_(e, 1)
};
zipextractor.Table.prototype.generateChildren_ = function(e, t) {
    for (var n in e.children) {
        var r = e.children[n];
        r.tableRow = this.generateFileTableRow_(r, t);
        if (r.directory) {
            this.generateChildren_(r, t + 1)
        }
    }
};
zipextractor.Table.prototype.generateFileTableRow_ = function(e, t) {
    var n = this.tableEl_.insertRow(-1);
    var r = n.insertCell(0);
    var i = n.insertCell(1);
    var s = n.insertCell(2);
    r.className = "filenameCell";
    i.className = "sizeCell";
    s.className = "statusCell";
    r.style.paddingLeft = zipextractor.Table.BASE_INDENT_PX_ + zipextractor.Table.INDENT_PX_ * t + "px";
    var o = document.createElement("input");
    o.type = "checkbox";
    o.checked = "true";
    r.appendChild(o);
    var u = this;
    o.onclick = function(t) {
        u.handleCheckboxClick_(e, t.target.checked)
    };
    var a = document.createElement("span");
    a.className = "tableRowNameSpan";
    a.innerHTML = e.name;
    var f = this.getDefaultIconForEntry_(e);
    var l = this.getDefaultAltTextForEntry_(e);
    var c = document.createElement("img");
    c.className = "tableRowIcon";
    c.setAttribute("src", f);
    c.setAttribute("alt", l);
    r.appendChild(c);
    r.appendChild(a);
    if (!e.directory && e.uncompressedSize) {
        i.innerHTML = zipextractor.util.formatSize(e.uncompressedSize)
    } else {
        i.innerHTML = "——"
    }
    return n
};
zipextractor.Table.prototype.getDefaultIconForEntry_ = function(e) {
    return zipextractor.Table.IMAGES_PATH_ + (e.directory ? e.root ? zipextractor.Table.Icon_.CONTAINER : zipextractor.Table.Icon_.FOLDER : zipextractor.Table.Icon_.FILE)
};
zipextractor.Table.prototype.getDefaultAltTextForEntry_ = function(e) {
    return e.directory ? e.root ? "Container icon" : "Folder icon" : "File icon"
};
zipextractor.Table.prototype.handleSelectAllCheckboxClick = function(e) {
    var t = this.rootEntry_;
    var n = this.getCheckboxForEntry_(t).checked;
    this.setEntryChecked_(t, e);
    this.setChildEntriesCheckState_(t, e);
    
};
zipextractor.Table.prototype.setEntryChecked_ = function(e, t) {
    this.getCheckboxForEntry_(e).checked = t;
    this.updateEntryRowStyle_(e, t)
};
zipextractor.Table.prototype.updateEntryRowStyle_ = function(e, t) {
    e.tableRow.style.color = t ? "inherit" : zipextractor.Table.UNCHECKED_COLOR_
};
zipextractor.Table.prototype.handleCheckboxClick_ = function(e, t) {
    this.updateEntryRowStyle_(e, t);
    if (e.root) {
        this.updateChildEntryIndents_(e, zipextractor.Table.INDENT_PX_ * (t ? 1 : -1));
        return
    }
    if (t) {
        this.setParentEntriesCheckState_(e, true)
    }
    if (!t && e.directory) {
        this.setChildEntriesCheckState_(e, false)
    }
};
zipextractor.Table.prototype.setChildEntriesCheckState_ = function(e, t) {
    for (var n in e.children) {
        var r = e.children[n];
        this.setEntryChecked_(r, t);
        if (r.directory) {
            this.setChildEntriesCheckState_(r, t)
        }
    }
};
zipextractor.Table.prototype.setParentEntriesCheckState_ = function(e, t) {
    var n = e.parentEntry;
    if (n && !n.root) {
        this.setEntryChecked_(n, t);
        this.setParentEntriesCheckState_(n, t)
    }
};
zipextractor.Table.prototype.getCheckboxForEntry_ = function(e) {
    return e.tableRow.cells[0].firstChild
};
zipextractor.Table.prototype.isChecked = function(e) {
    return this.getCheckboxForEntry_(e).checked
};
zipextractor.Table.prototype.updateEntryState = function(e, t, n) {
    var r = "";
    if (t !== null) {
        r = this.translateEntryState_(t, e)
    }
    if (n !== null && n !== -1) {
        r += " (" + n + ")"
    }
    e.tableRow.cells[2].innerHTML = r
};
zipextractor.Table.prototype.updateEntryIcon = function(e, t, n) {
    var r = t ? t : n ? zipextractor.Table.IMAGES_PATH_ + zipextractor.Table.Icon_.SPINNER : this.getDefaultIconForEntry_(e);
    var i = t ? this.getDefaultAltTextForEntry_(e) : n ? "Processing..." : this.getDefaultAltTextForEntry_(e);
    var s = e.tableRow.cells[0].children[1];
    s.src = r;
    s.alt = i
};
zipextractor.Table.prototype.updateEntryLink = function(e, t) {
    var n = this.getFilenameCell_(e);
    n.innerHTML = '<a target="_blank" href="' + t + '">' + n.innerHTML + "</a>"
};
zipextractor.Table.prototype.translateEntryState_ = function(e, t) {
    switch (e) {
        case zipextractor.state.EntryState.QUEUED:
            return "Queued";
        case zipextractor.state.EntryState.QUEUED_PENDING_RETRY:
            return "Queued (Pending resolution of error on parent folder)";
        case zipextractor.state.EntryState.SKIPPED:
            return "Skipped";
        case zipextractor.state.EntryState.PENDING:
            return "Pending";
        case zipextractor.state.EntryState.WAITING:
            return "Waiting";
        case zipextractor.state.EntryState.BEGIN_DECOMPRESSION:
            return "Decompressing...";
        case zipextractor.state.EntryState.DECOMPRESSION_PROGRESS:
            return "Decompressing...";
        case zipextractor.state.EntryState.DECOMPRESSION_COMPLETE:
            return "Decompressed";
        case zipextractor.state.EntryState.BEGIN_UPLOAD:
            return "Uploading...";
        case zipextractor.state.EntryState.UPLOAD_PROGRESS:
            return "Uploading...";
        case zipextractor.state.EntryState.UPLOAD_ERROR:
            return "Upload Error (" + t.message + ")";
        case zipextractor.state.EntryState.UPLOAD_ALL_BYTES_TRANSFERRED:
            return "Finishing...";
        case zipextractor.state.EntryState.UPLOAD_COMPLETE:
            return "Uploaded";
        case zipextractor.state.EntryState.CANCELED:
            return "Canceled";
        case zipextractor.state.EntryState.UPLOAD_ABORTED:
            return "Aborted";
        default:
            return ""
    }
};
zipextractor.Table.prototype.getFilenameCell_ = function(e) {
    return e.tableRow.cells[0].children[2]
};
zipextractor.View = function(e, t) {
    this.model_ = null;
    this.presenter_ = e;
    this.table_ = null;
    this.pickerManager_ = t;
    this.isInitialized_ = false;
    this.localFileInputEl = null;
    this.zipDropAreaDiv = null;
    this.chooseFileFromDriveButton = null;
    this.chooseLocalFileButton = null;
    this.resetButton = null;
    //this.rateAppButton = null;
    this.viewFilesButton = null;
    //this.shareFilesButton = null;
    this.cancelDownloadButton = null;
    this.destinationEl = null;
    this.fileTableDiv = null;
    this.fileTableHeaderEl = null;
    this.fileTable = null;
    this.primaryStatus = null;
    this.primaryStatusSpinner = null;
    this.primaryStatusProgress = null;
    this.primaryStatusText = null;
    this.primaryStatusProgressBar = null;
    this.selectAllCheckbox = null;
    this.cancelSessionButton = null;
    this.cancelExtractionButton = null
};
zipextractor.View.APP_NAME_ = "ZIP Extractor";
zipextractor.View.prototype.init = function() {
    if (this.isInitialized_) {
        throw "Error: View already initialized."
    }
    this.attachDom_();
    this.attachListeners_();
    this.table_ = new zipextractor.Table(this.fileTable);
    this.isInitialized_ = true
};
zipextractor.View.prototype.attachDom_ = function() {
    this.authButton = document.getElementById("authorizeButton");
    this.localFileInputEl = document.getElementById("filePicker");
    this.zipDropAreaDiv = document.getElementById("zipDropArea");
    this.chooseLocalFileButton = document.getElementById("chooseLocalFileButton");
    this.resetButton = document.getElementById("resetButton");
    this.viewFilesButton = document.getElementById("viewFilesButton");
    this.cancelDownloadButton = document.getElementById("cancelDownloadButton");
    this.destinationEl = document.getElementById("destinationFolderName");
    this.fileTableDiv = document.getElementById("fileTableDiv");
    this.primaryStatus = document.getElementById("primaryStatus");
    this.primaryStatusSpinner = document.getElementById("primaryStatusSpinner");
    this.primaryStatusProgress = document.getElementById("primaryStatusProgress");
    this.primaryStatusText = document.getElementById("primaryStatusText");
    this.primaryStatusProgressBar = document.getElementById("primaryStatusProgressBar");
    this.selectAllCheckbox = document.getElementById("selectAllCheckbox");
 this.cancelSessionButton = document.getElementById("cancelSessionButton");
    this.cancelExtractionButton = document.getElementById("cancelExtractionButton");
    this.fileTable = document.getElementById("fileTable");
    this.fileTableHeaderEl = document.getElementById("fileTableHeaderCaption")
};
zipextractor.View.prototype.attachListeners_ = function() {
    this.chooseLocalFileButton.onclick = zipextractor.util.bindFn(this.handleChooseLocalFile_, this);
    this.localFileInputEl.onchange = zipextractor.util.bindFn(this.handleLocalFileInputElChange_, this);
  this.resetButton.onclick = zipextractor.util.bindFn(this.handleResetButtonClick_, this);
    //this.rateAppButton.onclick = zipextractor.util.bindFn(this.handleRateAppButtonClick_, this);
    this.authButton.onclick = zipextractor.util.bindFn(this.handleAuthButtonClick_, this);
    this.cancelSessionButton.onclick = zipextractor.util.bindFn(this.handleCancelSessionButtonClick_, this);
  this.cancelExtractionButton.onclick = zipextractor.util.bindFn(this.handleCancelExtractionButtonClick_, this);
    //this.shareFilesButton.onclick = zipextractor.util.bindFn(this.handleShareFilesButtonClick_, this);
    this.viewFilesButton.onclick = zipextractor.util.bindFn(this.handleViewFilesButtonClick_, this);
    this.cancelDownloadButton.onclick = zipextractor.util.bindFn(this.handleCancelDownloadButtonClick_, this);
  this.selectAllCheckbox.onclick = zipextractor.util.bindFn(this.handleSelectAllCheckboxClick_, this);
    this.zipDropAreaDiv.ondragenter = zipextractor.util.bindFn(this.handleZipDropAreaDragEnter_, this);
    this.zipDropAreaDiv.ondragleave = zipextractor.util.bindFn(this.handleZipDropAreaDragLeave_, this);
    this.zipDropAreaDiv.ondragover = zipextractor.util.bindFn(this.handleZipDropAreaDragOver_, this);
    this.zipDropAreaDiv.ondrop = zipextractor.util.bindFn(this.handleZipDropAreaDrop_, this)
};
zipextractor.View.prototype.isSelected = function(e) {
    return this.table_.isChecked(e)
};
zipextractor.View.prototype.updateState = function(e, t, n) {
    if (!this.isInitialized_) {
        return
    }
    switch (e) {
        case zipextractor.state.SessionState.API_LOADED:
            break;
        case zipextractor.state.SessionState.UNSUPPORTED_BROWSER:
            this.updatePrimaryStatus_(true, false, "Your browser version is not supported by ZIP Extractor. Please upgrade your browser.");
          
            break;
        case zipextractor.state.SessionState.READ_URL_STATE:
            break;
        case zipextractor.state.SessionState.AUTH_PENDING_AUTO:
            this.updatePrimaryStatus_(true, true, "Checking authorization...");
            break;
        case zipextractor.state.SessionState.AUTH_PENDING_USER:
            this.authButton.disabled = true;
            this.updatePrimaryStatus_(true, true, 'Authorization pending... (Click "Accept" in ' + "the popup window to authorize ZIP Extractor to use Google Drive.)");
            break;
        case zipextractor.state.SessionState.AUTH_SUCCESS:
            this.authButton.disabled = true;
            this.showEl_(this.authButton, false);
            break;
        case zipextractor.state.SessionState.AUTH_ERROR:
        case zipextractor.state.SessionState.AUTH_REQUIRED:
            this.updatePrimaryStatus_(true, false, "Please authorize ZIP Extractor to access to Google Drive. " + '(Click "Authorize" below.)');
            this.authButton.disabled = false;
            this.showEl_(this.authButton, true);
            break;
        case zipextractor.state.SessionState.CANCEL_DOWNLOAD_REQUESTED:
            this.enableEl_(this.cancelDownloadButton, false);
            break;
        case zipextractor.state.SessionState.DOWNLOAD_CANCELED:
            this.showEl_(this.cancelDownloadButton, false);
            this.enableEl_(this.cancelDownloadButton, true);
           this.showEl_(this.resetButton, true);
            this.updatePrimaryStatus_(true, false, "Download canceled.");
            break;
        case zipextractor.state.SessionState.DOWNLOADING_METADATA:
            this.showEl_(this.chooseLocalFileButton, false);
            this.zipDropAreaDiv.style.visibility = "hidden";
            this.showEl_(this.cancelDownloadButton, true);
            this.enableEl_(this.cancelDownloadButton, true);
          this.showEl_(this.resetButton, false);
            this.updatePrimaryStatus_(true, true, "Preparing to download file...");
            break;
        case zipextractor.state.SessionState.DOWNLOADING:
            var r = n;
            var i = 'Downloading "' + r.title + '" from Google Drive...';
            this.updatePrimaryStatus_(true, true, i);
            this.handleDownloadProgress(0, 100);
            break;
        case zipextractor.state.SessionState.DOWNLOAD_ALL_BYTES_TRANSFERRED:
            this.updatePrimaryStatus_(true, false, "Finishing download...");
            break;
        case zipextractor.state.SessionState.DOWNLOADED:
            this.showEl_(this.cancelDownloadButton, false);
            this.updatePrimaryStatus_(true, false, "File downloaded.");
            break;
        case zipextractor.state.SessionState.DOWNLOAD_ERROR:
            this.updateUiForDownloadError_(n);
            break;
        case zipextractor.state.SessionState.INIT:
            break;
        case zipextractor.state.SessionState.ZIP_READ_ERROR:
            this.updatePrimaryStatus_(true, false, "Error reading ZIP file: " + n);
          this.enableEl_(this.chooseLocalFileButton, true);
           this.showEl_(this.chooseLocalFileButton, false);
            this.showEl_(this.resetButton, true);
            this.showEl_(this.cancelExtractionButton, false);
            break;
        case zipextractor.state.SessionState.MODEL_BUILDING:
            this.updatePrimaryStatus_(true, true, "Processing ZIP file...");
            break;
        case zipextractor.state.SessionState.MODEL_BUILT:
            this.model_ = n;
            break;
        case zipextractor.state.SessionState.SESSION_CANCELED:
            break;
        case zipextractor.state.SessionState.EXTRACTION_CANCEL_REQUESTED:
            this.updateUiForExtractionCancelRequested_();
            break;
        case zipextractor.state.SessionState.EXTRACTION_CANCELED:
            this.updateUiForExtractionCanceled_();
            break;
        case zipextractor.state.SessionState.RENDER_ZIP_UI:
            this.renderZipTableUi_(n);
            break;
        case zipextractor.state.SessionState.PENDING_USER_INPUT:
            this.promptToExtract_();
            break;
        case zipextractor.state.SessionState.ZIP_READING:
            this.updatePrimaryStatus_(true, true, "Reading ZIP file...");
           this.enableEl_(this.chooseLocalFileButton, false);
            this.zipDropAreaDiv.style.visibility = "hidden";
            break;
        case zipextractor.state.SessionState.EXTRACTING:
            this.updateUiForExtractionStart_(n);
            this.handleSessionProgress(0, 100);
            break;
        case zipextractor.state.SessionState.NEW_SESSION:
            this.setupForNewSession_();
            break;
        case zipextractor.state.SessionState.EXTRACTION_COMPLETE:
            this.updateUiForExtractionComplete_(n);
            break;
        default:
            throw "Unexpected state: " + e
    }
};
zipextractor.View.prototype.updateEntryState = function(e, t, n) {
    var r = null;
    switch (t) {
        case zipextractor.state.EntryState.QUEUED:
            break;
        case zipextractor.state.EntryState.QUEUED_PENDING_RETRY:
            break;
        case zipextractor.state.EntryState.SKIPPED:
            break;
        case zipextractor.state.EntryState.PENDING:
            break;
        case zipextractor.state.EntryState.CANCELED:
            this.updateEntryIconForState_(e, true);
            break;
        case zipextractor.state.EntryState.BEGIN_UPLOAD:
            this.updateEntryIconForState_(e, false);
            break;
        case zipextractor.state.EntryState.UPLOAD_PROGRESS:
            r = Math.round(100 * e.uploadCurrent / e.uploadTotal) + "%";
            break;
        case zipextractor.state.EntryState.UPLOAD_ALL_BYTES_TRANSFERRED:
            break;
        case zipextractor.state.EntryState.UPLOAD_COMPLETE:
            break;
        case zipextractor.state.EntryState.UPLOAD_ERROR:
            this.updateEntryIconForState_(e, true);
            break;
        case zipextractor.state.EntryState.UPLOAD_ABORTED:
            this.updateEntryIconForState_(e, true);
            break;
        case zipextractor.state.EntryState.BEGIN_DECOMPRESSION:
            this.updateEntryIconForState_(e, false);
            break;
        case zipextractor.state.EntryState.DECOMPRESSION_PROGRESS:
            r = Math.round(100 * e.decompressionCurrent / e.decompressionTotal) + "%";
            break;
        case zipextractor.state.EntryState.DECOMPRESSION_COMPLETE:
            break;
        default:
            throw "Unexpected state: " + t
    }
    this.table_.updateEntryState(e, t, r)
};
zipextractor.View.prototype.updateEntryIconForState_ = function(e, t) {
    this.table_.updateEntryIcon(e, undefined, !t)
};
zipextractor.View.prototype.handleDownloadProgress = function(e, t) {
    var n = 5 + 95 * (e / t);
    this.updatePrimaryStatus_(true, false, "", true, true, Math.round(n))
};
zipextractor.View.prototype.handleSessionProgress = function(e, t) {
    var n = 100 * (e / t);
    this.updatePrimaryStatus_(true, false, "", true, true, Math.round(n))
};
zipextractor.View.prototype.updatePageTitle = function(e) {
    document.title = e ? e + " - " + zipextractor.View.APP_NAME_ : zipextractor.View.APP_NAME_
};
zipextractor.View.prototype.updateUiForFileComplete = function(e, t, n) {
    if (t) {
        this.table_.updateEntryLink(e, t)
    }
    if (n) {
        this.table_.updateEntryIcon(e, n)
    } else {
        this.updateEntryIconForState_(e, true)
    }
};
zipextractor.View.prototype.handleSelectAllCheckboxClick_ = function(e) {
    this.table_.handleSelectAllCheckboxClick(e.target.checked)
};
zipextractor.View.prototype.updatePrimaryStatus_ = function(e, t, n, r, i, s) {
    if (!r) {
        this.primaryStatusText.innerHTML = n || ""
    }
    this.showEl_(this.primaryStatusProgress, e);
    this.showEl_(this.primaryStatusSpinner, t);
    if (i) {
        this.primaryStatusProgressBar.style.width = "" + s + "%"
    }
    this.showEl_(this.primaryStatusProgress, !!i)
};
zipextractor.View.prototype.renderZipTableUi_ = function(e) {
    this.fileTableHeaderEl.innerHTML = this.model_.getFilename();
    this.table_.generate(this.model_.getEntryTree(), zipextractor.util.bindFn(this.zipTableUiRendered_, this, e))
};
zipextractor.View.prototype.zipTableUiRendered_ = function(e) {
    this.showEl_(this.fileTableDiv, true);
    e()
};
zipextractor.View.prototype.updateUiForExtractionComplete_ = function(e) {
    this.showEl_(this.cancelExtractionButton, false);
    this.showEl_(this.viewFilesButton, true);   
    this.showEl_(this.resetButton, true);
    if (!e) {
      
    }
    var t = e ? "Extraction complete, but with one or more errors." : "Extraction complete.";
    this.updatePrimaryStatus_(true, false, t)
};
zipextractor.View.prototype.updateUiForExtractionStart_ = function(e) {
    this.showEl_(this.cancelSessionButton, false);
    this.showEl_(this.cancelExtractionButton, true);
    this.enableEl_(this.cancelExtractionButton, true);
    this.showEl_(this.viewFilesButton, false);
    this.showEl_(this.resetButton, false);
    this.enableEl_(this.selectAllCheckbox, false);
   
   this.table_.lockForSession(e);
    this.updatePrimaryStatus_(true, false, "Extracting ZIP file to Drive...")
};
zipextractor.View.prototype.setupForNewSession_ = function() {
    this.showEl_(this.cancelSessionButton, false);
    this.showEl_(this.viewFilesButton, false);
    this.showEl_(this.resetButton, false);
    this.showEl_(this.cancelDownloadButton, false);
    this.showEl_(this.fileTableDiv, false);
    this.showEl_(this.chooseLocalFileButton, true);
    this.enableEl_(this.chooseLocalFileButton, true);
    this.showEl_(this.zipDropAreaDiv, true);
    this.zipDropAreaDiv.style.visibility = "";
    this.table_.clear();
    this.enableEl_(this.selectAllCheckbox, true);
    this.updatePrimaryStatus_(true, false, "Choose a ZIP file to extract.")
};
zipextractor.View.prototype.promptToExtract_ = function() {
    this.updatePrimaryStatus_(true, false, "Ready to extract ZIP file.");
    this.showEl_(this.cancelSessionButton, true);
    this.showEl_(this.chooseLocalFileButton, false);
    this.showEl_(this.zipDropAreaDiv, false);
    this.showEl_(this.cancelDownloadButton, false)
};
zipextractor.View.prototype.updateUiForExtractionCancelRequested_ = function() {
    this.enableEl_(this.cancelExtractionButton, false);
    this.updatePrimaryStatus_(true, false, "Canceling extraction...")
};
zipextractor.View.prototype.updateUiForExtractionCanceled_ = function() {
    this.showEl_(this.cancelExtractionButton, false);
    this.showEl_(this.viewFilesButton, true);
    this.showEl_(this.resetButton, true);
    this.updatePrimaryStatus_(true, false, "Extraction canceled.")
};
zipextractor.View.prototype.updateUiForDownloadError_ = function(e) {
    this.showEl_(this.cancelDownloadButton, false);
    this.showEl_(this.resetButton, true);
    this.updatePrimaryStatus_(true, false, "Unable to download file. (" + e + ")")
};
zipextractor.View.prototype.updateDestinationFolderUi = function(e) {
    var t = zipextractor.util.createDriveFolderLink(e.id);
    var n = 'Ready to extract ZIP file to "<a target="_blank" href="' + t + '">' + e.name + '</a>".';
    this.updatePrimaryStatus_(true, false, n)
};
zipextractor.View.prototype.handleChooseLocalFile_ = function(e) {
    this.localFileInputEl.click()
};
zipextractor.View.prototype.handlePickerFileSelected_ = function(e) {
    this.presenter_.VIEW__driveFileChosen(e)
};
zipextractor.View.prototype.handlePickerFolderSelected_ = function(e) {
    this.presenter_.VIEW__driveFolderChosen(e)
};
zipextractor.View.prototype.handleLocalFileInputElChange_ = function(e) {
    var t = e.target.files[0];
    if (t) {
        this.presenter_.VIEW__localBlobChosen(t.name, t)
    }
};
zipextractor.View.prototype.handleZipDropAreaDragEnter_ = function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.allowedEffect = "copyMove";
    this.zipDropAreaDiv.classList.add("zipDropAreaHover")
};
zipextractor.View.prototype.handleZipDropAreaDragLeave_ = function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.zipDropAreaDiv.classList.remove("zipDropAreaHover")
};
zipextractor.View.prototype.handleZipDropAreaDragOver_ = function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = "move"
};
zipextractor.View.prototype.handleZipDropAreaDrop_ = function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.zipDropAreaDiv.classList.remove("zipDropAreaHover");
    var t = e.dataTransfer.files;
    if (t && t.length == 1) {
        var n = t[0];
        var r = n.name;
        var i = ".zip";
        if (r.indexOf(i, r.length - i.length) !== -1) {
            this.presenter_.VIEW__localBlobChosen(n.name, n)
        }
    }
};
zipextractor.View.prototype.handleAuthButtonClick_ = function(e) {
    this.presenter_.VIEW__authRequested()
};
zipextractor.View.prototype.handleCancelSessionButtonClick_ = function() {
    this.presenter_.VIEW__cancelSession()
};
zipextractor.View.prototype.handleResetButtonClick_ = function() {
    this.presenter_.VIEW__reset()
};
zipextractor.View.prototype.showEl_ = function(e, t) {
    e.style.display = t ? "" : "none"
};
zipextractor.View.prototype.enableEl_ = function(e, t) {
    e.disabled = !t
};
zipextractor.View.prototype.handleCancelExtractionButtonClick_ = function(e) {
    this.presenter_.VIEW__cancelExtraction()
};
zipextractor.View.prototype.handleViewFilesButtonClick_ = function(e) {
    this.presenter_.VIEW__viewExtractedFiles()
};
zipextractor.View.prototype.handleCancelDownloadButtonClick_ = function(e) {
    this.presenter_.VIEW__cancelDownload()
};
zipextractor.ZipReader = function() {};
zipextractor.ZipReader.prototype.read = function(e, t, n) {
    zip.createReader(new zip.BlobReader(e), zipextractor.util.bindFn(this.readZipManifest_, this, t), zipextractor.util.bindFn(this.handleError_, this, n))
};
zipextractor.ZipReader.prototype.readZipManifest_ = function(e, t) {
    t.getEntries(zipextractor.util.bindFn(this.zipManifestReadComplete_, this, t, e))
};
zipextractor.ZipReader.prototype.zipManifestReadComplete_ = function(e, t, n) {
    e.close(zipextractor.util.bindFn(this.readerClosed_, this, n, t))
};
zipextractor.ZipReader.prototype.readerClosed_ = function(e, t) {
    t(e)
};
zipextractor.ZipReader.prototype.handleError_ = function(e, t) {
    e(t)
}