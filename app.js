'use strict';;
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require("express-session");
var fs = require("fs");

var admin = require("./routes/admin")

var app = express();

global.routingTable = {};
global.loadRoutes = function () {
    var pth = path.join(__dirname, "routingTable.json");
    fs.readFile(pth, "utf8", function (e, data) {
        if (e) throw e;
        routingTable = JSON.parse(data);
    });
}
global.loadRoutes();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

var staticPath = path.join(__dirname, 'public');
app.set("staticPath", staticPath);

 
app.use(function (req, res, next) {
    var path = routingTable[req.url.split("?").shift()];
    if (path != undefined) {
        res.render(path, { title: 'Express' });
    }
    else {
        next();
    }
});

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(staticPath));
app.use(session({ secret: 'BloggiApp', cookie: { maxAge: 60000 * 20 } }));

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
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});



