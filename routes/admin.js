'use strict';

var fs = require("fs");
var path = require("path");
var express = require('express');

var router = express.Router();


/* GET home page. */
router.get('/', function (req, res) {
    res.render('admin/index');
});

router.get("/getDirectories", function (req, res) {
    var viewPath = req.app.get("views");
    var viewTree = walk(viewPath);

    var staticPath = req.app.get("staticPath");
    var staticTree = walk(staticPath);

    //res.send([viewTree, staticTree]);
    res.render("admin/tree", { views: viewTree, files: staticTree });
});

router.get("/content", function (req, res) {
    var pth = path.join(__dirname, "..//" , req.query.c);
    fs.readFile(pth, "utf8", (err, data) => {
        if (err) throw err;
        res.send(data);
    });
    
});

router.route('/login')
    .get(function (req, res) {
        res.render('admin/login');
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
