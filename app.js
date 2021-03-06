﻿'use strict';;
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const session = require("express-session");
const fs = require("fs");
const fileUpload = require('express-fileupload');

var admin = require("./routes/admin");

const app = express();

app.use(fileUpload());

global.routingTable = {};
global.settings = {};
global.requires = {};

global.loadFilesAndRequires = function () {
    var pth = path.join(__dirname, "routingTable.json");
    var data = fs.readFileSync(pth, "utf8");

    var routesAndRequires = JSON.parse(data);

    routingTable = routesAndRequires.files;
    requires = routesAndRequires.requires;
}
global.loadSettings = function () {
    var pth = path.join(__dirname, "settings.json");
    settings = JSON.parse(fs.readFileSync(pth, "utf8"));
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', settings.viewEngine);
app.engine('pug', require('pug').__express);
app.engine('html', require('ejs').renderFile);

var staticPath = path.join(__dirname, 'public');
app.set("staticPath", staticPath);

var requiresPath = path.join(__dirname, 'requires');
app.set("requiresPath", requiresPath);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(staticPath));
app.use(session({ secret: 'BloggiApp', cookie: { maxAge: 60000 * 20 }, resave: true, saveUninitialized: true }));

app.use(function (req, res, next){
    res.removeHeader("X-Powered-By");
    
    global.settings.headers.forEach(function(e){
        res.header(e.key, e.value);
    });
    
    next();
});

app.use("/admin", authChecker);
app.use("/admin", admin);
function authChecker(req, res, next) {
    if (req.session.auth || req.path === "/login") {
        next();
    }
    else {
        res.redirect("/admin/login");
    }
}

app.use(function (req, res, next) {
    var shft = req.url.split("?").shift();
    var path = routingTable[shft] || routingTable[shft.replace(/\/$/, "")];
    if (path != undefined) {
        res.render(path, { title: settings.appTitle });
    }
    else {
        next();
    }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error.pug', {
        message: err.message,
        error: {}
    });
});

/* Settings, requires and  files */
global.loadFilesAndRequires();
global.loadSettings();

if(typeof(requires) != "undefined"){
    global.requires.forEach(function(element) {
        require("./"+element).init(app);
      });
}
/* eof */

app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});
