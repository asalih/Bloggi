﻿'use strict';

var fs = require("fs");
var path = require("path");
var express = require('express');

var router = express.Router();


/* GET home page. */
router.get('/', function (req, res) {
    res.render('admin/index.pug');
});

router.get("/getDirectories", function (req, res) {
    var viewPath = req.app.get("views");
    var viewTree = walk(viewPath);

    var staticPath = req.app.get("staticPath");
    var staticTree = walk(staticPath);

    //res.send([viewTree, staticTree]);
    res.render("admin/tree.pug", { views: viewTree, files: staticTree });
});

router.post("/add", function (req, res) {
    var pth = path.join(__dirname, "..//", req.body.pth);

    fs.exists(pth, function (exists) {
        if (exists) {
            res.send(req.body.type == "folder" ? "hasFolder" : "hasFile");
        }
        else {
            if (req.body.type == "folder") {
                fs.mkdir(pth, function (err, data) {
                    if (err) throw err;
                    res.send(data);
                });
            }
            else {
                fs.writeFile(pth, "", function (err, data) {
                    if (err) throw err;
                    res.send(data);
                });
            }
        }
    });

});

router.post("/rename", function (req, res) {
    var pth = path.join(__dirname, "..//", req.body.pth);
    var newPth = path.join(__dirname, "..//", req.body.newPth);
    fs.exists(newPth, function (exists) {
        if (exists) {
            res.send(req.body.type == "folder" ? "hasFolder" : "hasFile");
        }
        else {
            fs.rename(pth, newPth, function (err, data) {
                if (err) throw err;
                res.send(data);
            });
        }
    });
});

router.route("/content")
    .get(function (req, res) {
        var pth = path.join(__dirname, "..//", req.query.pth);
        fs.readFile(pth, "utf8", (err, data) => {
            if (err) throw err;
            res.send(data);
        });
    })
    .post(function (req, res) {
        var pth = path.join(__dirname, "..//", req.body.pth);
        fs.writeFile(pth, req.body.file, "utf8", function (err, data) {
            if (err) throw err;
            res.send(data);
        });
    })
    .delete(function (req, res) {
        var pth = path.join(__dirname, "..//", req.body.pth);
        fs.unlink(pth, function (err, data) {
            if (err) throw err;
            res.send(data);
        });
    });

router.route("/routes")
    .get(function (req, res) {
        var pth = path.join(__dirname, "..//routingTable.json");
        fs.readFile(pth, "utf8", (err, data) => {
            if (err) throw err;
            res.send(data);
        });
    })
    .post(function (req, res) {
        var pth = path.join(__dirname, "..//routingTable.json");
        fs.writeFile(pth, req.body.file, "utf8", function (err, data) {
            if (err) throw err;

            loadRoutes();
            res.send(data);
        });
    });

router.route("/settings")
    .get(function (req, res) {
        var pth = path.join(__dirname, "..//settings.json");
        fs.readFile(pth, "utf8", (err, data) => {
            if (err) throw err;
            res.send(data);
        });
    })
    .post(function (req, res) {
        var pth = path.join(__dirname, "..//settings.json");
        fs.writeFile(pth, req.body.file, "utf8", function (err, data) {
            if (err) throw err;

            loadSettings();
            res.send(data);
        });
    });
router.route('/login')
    .get(function (req, res) {
        res.render('admin/login.pug');
    })
    .post(function (req, res) {
        //user logic here
        req.session.auth = true;
        res.redirect("/admin");
    });

function walk(dirPath) {
    var views = fs.readdirSync(dirPath);

    for (var i in views) {
        if (views[i].toLowerCase() === "admin") { continue; }

        var fp = path.join(dirPath, views[i]);

        var stat = fs.lstatSync(fp);
        if (stat && stat.isDirectory()) {
            views[i] = { name: views[i], sub: walk(fp) };
        }
    }

    return views;
}

module.exports = router;
