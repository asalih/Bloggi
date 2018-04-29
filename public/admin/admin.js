var editor;
var editingPath = "";
Dropzone.autoDiscover = false;
$(document).ready(function () {
    editor = ace.edit("editor");
    $("#ace-theme").change(function () { editor.setTheme('ace/theme/' + $(this).val().toLowerCase()); });

    $(".save").click(function () {
        if (editingPath == "") {
            return;
        }
        if (editingPath != "routingTable" && editingPath != "settings") {
            $(".save-note").text("saving");
            $.ajax({
                url: "/admin/content",
                type: "POST",
                data: { pth: editingPath, file: editor.getValue() },
                dataType: "text",
                success: function (data) {
                    $(".save-note").text((new Date()).toString());
                }
            });
        }
        else {
            $(".save").text("saving");
            var url = "routes";
            if (editingPath == "settings") {
                url = "settings"
            }

            $.ajax({
                url: "/admin/" + url,
                type: "POST",
                data: { file: editor.getValue() },
                dataType: "text",
                success: function (data) {
                    $(".save").text("save");
                }
            });

        }
    });

    $(".cls").click(function () {
        clear();
    });

    $(".delete").click(function () {
        if (editingPath != "" || editingPath != "routingTable" || editingPath != "settings") {
            if (!confirm("Are you sure?")) {
                return;
            }

            $(".delete").text("deleting");
            $("#currentFilePath").text("");
            deleteFile(editingPath);

        }
    });

    $("#btnAddFile").click(function (e) {
        var name = $("#fileAdding").val();
        e.stopPropagation();
        $("#addMsg").text("");
        if (name != "") {
            add(name, "file");
        }
        else {
            $("#addMsg").text("You must type a file name.");
        }

    });

    $("#btnAddFolder").click(function (e) {
        var name = $("#fileAdding").val();
        e.stopPropagation();
        $("#addMsg").text("");
        if (name != "") {
            add(name, "folder");
        }
        else {
            $("#addMsg").text("You must type a folder name.");
        }

    });

    $("#editRouting").click(function () {
        clear();
        editingPath = "routingTable";
        $.ajax({
            url: "/admin/routes",
            dataType: "text",
            success: function (data) {
                toggleMode(".json");
                editor.setValue(data);
                editor.clearSelection();
            }
        });
    });

    $("#settings").click(function () {
        clear();
        editingPath = "settings";
        $.ajax({
            url: "/admin/settings",
            dataType: "text",
            success: function (data) {
                toggleMode(".json");
                editor.setValue(data);
                editor.clearSelection();
            }
        });
    });

    $('#dropzone').dropzone({
        url: "/admin/fileUpload",
        addRemoveLinks: true,
        autoProcessQueue: true,
        previewsContainer: '#dropzonePreview',
        init: function () {
            this.on("sending", function (file, xhr, formData) {
                formData.append("currentPath", $("#currentPath").val());
            });
            this.on("success", function (file, xhr, formData) {
                loadTree();
            });

        },
    });

    loadTree();

});

function deleteFile(editingPath) {
    $.ajax({
        url: "/admin/content",
        type: "DELETE",
        data: { pth: editingPath },
        dataType: "text",
        success: function (data) {
            $(".treeBtn.active").parent().remove();
            $(".delete").text("delete");
            editingPath = "";
        }
    });
}

function add(name, type) {

    var path = $("#currentPath").val() + "/" + name;
    $.ajax({
        url: "/admin/add",
        type: "POST",
        data: { pth: path, type: type },
        dataType: "text",
        success: function (data) {
            if (data == "hasFile") {
                $("#addMsg").text("Has file with the same name.");
            }
            else if (data == "hasFolder") {
                $("#addMsg").text("Has folder with the same name.")
            }
            else {
                $("#fileAdding").val("");
                loadTree();
            }
        }
    });

}

function rename(path, newPath, type) {
    $.ajax({
        url: "/admin/rename",
        type: "POST",
        data: { pth: path, newPth: newPath, type: type },
        dataType: "text",
        success: function (data) {
            if (data == "hasFile") {
                $("#addMsg").text("Has file with the same name.");
            }
            else if (data == "hasFolder") {
                $("#addMsg").text("Has folder with the same name.")
            }
        }
    });
}

function activate(i) {
    $(".treeBtn.active").removeClass("active");
    $(i).parent().find(".treeBtn").addClass("active");

    var key = $(i).parents("li.branch").first();
    var fp = "/" + key.children('span.filePath').text();

    var parents = $(key).parents("li.parent");
    while (parents.length != 0) {
        fp = "/" + parents.children('span.filePath').text() + fp;
        parents = $(parents).parents("li.parent");
    }

    $("#currentPath").val(fp);
}

function loadTree() {
    $.ajax({
        url: "/admin/getDirectories",
        dataType: "html",
        success: function (html) {
            $(".tree-container").html(html);
            onTreeLoaded();
        }
    });
}

function onTreeLoaded() {
    $('.mktre').treed({}, function (i) {
        var fp = "/" + $(i).children('span.filePath').text();

        var parents = $(i).parents("li.parent");
        while (parents.length != 0) {
            fp = "/" + parents.children('span.filePath').text() + fp;
            parents = $(parents).parents("li.parent");
        }

        $("#currentPath").val(fp);

    });
    $(".parent").click();
    $(".treeBtn").click(function () {
        activate(this);
    });

    $(".editBtn").click(function () {
        activate(this);

        var path = $("#currentPath").val() + "/" + $(this).parent().find(".treeBtn").text();
        
        editingPath = path;
        $("#currentFilePath").text(editingPath);
        var readable = toggleMode(path);
        if (!readable){
            return;
        }

        $.ajax({
            url: "/admin/content?pth=" + path,
            dataType: "text",
            success: function (data) {
                editor.setValue(data);
                editor.clearSelection();
            }
        });
    });
    $(".deleteBtn").click(function () {
        if (!confirm("Are you sure?")) {
            return;
        }
        activate(this);
        var path = $("#currentPath").val() + "/" + $(this).parent().find(".treeBtn").text();
        deleteFile(path);
    });
    $(".renameBtn").click(function () {
        $(this).prev().removeAttr("contentEditable");
    });


    $(".tRow").mouseover(function () {
        $(this).find(".trb").css("display", "inline-block");
    })
        .mouseout(function () { $(this).find(".trb").css("display", "none"); });

    var editingName = "";
    $(".treeBtn").dblclick(function () {
        $(this).attr("contentEditable", "true");
        editingName = $(this).text();
        $(this).next().show();
    }).blur(function () {
        var elem = $(this);
        if (elem.attr("contentEditable") == "true") {
            elem.removeAttr("contentEditable");
            elem.next().hide();
            var name = elem.text();

            var path = $("#currentPath").val() + "/" + editingName;
            var newPath = $("#currentPath").val() + "/" + name;

            if (editingName != name) {
                rename(path, newPath, "file");
            }
        }
    });



}

function clear() {
    editingPath = "";
    $("#currentFilePath").text("");
    editor.setValue("");
}

var currentMode = "";
function toggleMode(path) {
    var root = "ace/mode/";

    var ext = path.split('.').pop();
    var mode = "";

    if (/jpg|jpeg|gif|png/gi.test(ext)) {

        $("#editor").hide();
        $("#imagePrev").show();

        $("#imagePrev>.card-img-top").attr("src", path.replace(/\/Public|\/public/, ""));

        return false;
    }

    $("#editor").show();
    $("#imagePrev").hide();
    switch (ext) {
        case "pug":
            mode = "jade";
            break;
        case "jade":
            mode = "jade";
            break;
        case "js":
            mode = "javascript";
            break;
        case "css":
            mode = "css";
            break;
        case "html":
            mode = "html";
            break;
        case "json":
            mode = "json";
            break;
        
        default:
            mode = "text"
            break;
    }

    if (mode != currentMode) {
        editor.getSession().setMode(root + mode);
        currentMode = mode;
    }
    return true;

}

$.fn.extend({
    treed: function (o, cb) {

        var openedClass = 'fa-folder-open-o';
        var closedClass = 'fa-folder-o';

        if (typeof o != 'undefined') {
            if (typeof o.openedClass != 'undefined') {
                openedClass = o.openedClass;
            }
            if (typeof o.closedClass != 'undefined') {
                closedClass = o.closedClass;
            }
        };

        //initialize each of the top levels
        var tree = $(this);
        tree.addClass("tree");
        tree.find('li').has("ul").each(function () {
            var branch = $(this); //li with children ul
            branch.prepend("<i class='indicator fa fa-2 " + closedClass + "'></i>");
            branch.addClass('branch');
            branch.on('click', function (e) {
                if (this == e.target) {
                    var icon = $(this).children('i:first');
                    icon.toggleClass(openedClass + " " + closedClass);
                    $(this).children().children().toggle();

                    if (cb) cb(this);
                }
            })


            branch.children().children().toggle();
        });


        //fire event to open branch if the li contains a button instead of text
        tree.find('.branch>button,.branch .filePath,.branch>a,.branch .indicator').each(function () {
            $(this).on('click', function (e) {
                $(this).closest('li').click();

                e.preventDefault();
            });
        });
    }
});
