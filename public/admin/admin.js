$(document).ready(function () {
    $.ajax({
        url: "/admin/getDirectories",
        dataType: "html",
        success: function (html) {
            $(".tree-container").html(html);
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
                $("#documents").attr("src", "/admin/content?c=" + path);
            });
        }
    });
});
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
