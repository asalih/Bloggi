var editor;
var editingPath = "";
$(document).ready(function () {
    editor = ace.edit("editor");

    $("#ace-theme").change(function () { editor.setTheme('ace/theme/' + $(this).val().toLowerCase()); });

    $(".save").click(function () {
        if (editingPath != "") {
            $(".save").text("saving");
            $.ajax({
                url: "/admin/content",
                type: "POST",
                data: { pth: editingPath, file: editor.getValue() },
                dataType: "text",
                success: function (data) {
                    $(".save").text("save");
                }
            });
        }
    });

    $(".cls").click(function () {
        editingPath = "";
        $("#currentFilePath").text("");
        editor.setValue("");
    });

    $(".delete").click(function () {
        if (editingPath != "") {
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
        toggleMode(path);
        editingPath = path;
        $("#currentFilePath").text(editingPath);

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
        activate(this);
        var path = $("#currentPath").val() + "/" + $(this).parent().find(".treeBtn").text();
        deleteFile(path);
    });

    $(".tRow").mouseover(function () {
        $(this).find(".trb").css("display", "inline-block");
    }).mouseout(function () { $(this).find(".trb").css("display", "none"); });

}

var currentMode = "";
function toggleMode(path) {
    var root = "ace/mode/";

    var ext = path.split('.').pop();
    var mode = "";

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