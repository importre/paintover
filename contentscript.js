var re = null;
var skipNodeList = null;
var wordList = [""];
var wordListObj = {};
var $$option = {};

window.onload = function () {
    init();
    addDomModifiedEvent();
};

var init = function () {
    skipNodeList = ["style", "script", "object", "form", "head", "input", "fieldset"];

    chrome.extension.sendRequest(
        {
            method: "storage",
            key: "wordlist"
        }, function (response) {
            wordListObj = response.data;
            $$option = response.data['$$option'] || {
                maxComplete : 5,
                bgColor : "yellow",
                fgColor : "red"
            };
            console.log(wordListObj);
            wordList = Object.keys(response.data);
            if (wordList.length > 0) {
                var regex = "\\b(" + wordList.join("|") + ")\\b";
                re = new RegExp(regex, "gi");
                console.log(re)
            }
            mark(document.body);
        }
    );
};

function isHtml(text) {
    return text.indexOf("<meta ") >= 0 ||
        text.indexOf("function(") >= 0 ||
        text.indexOf("if(") >= 0 ||
        text.indexOf("<div ") >= 0;
}

function isValidNode(node) {
    return node.nodeType == Node.TEXT_NODE && !isHtml(node.nodeValue);
}

function isSpanMarkNode(node) {
    if (!node || (node.nodeType != Node.ELEMENT_NODE)) {
        return false;
    }

    return node.tagName.toLowerCase() == "span" && node.getAttribute("class") == "mark";
}

function mark(node) {
    if (!node.hasChildNodes()
        || node.tagName.toLowerCase() in skipNodeList
        || isSpanMarkNode(node)) {
        return;
    }

    var children = node.childNodes;
    for (var i = 0; i < children.length; i++) {
        if (children[i].nodeType == Node.ELEMENT_NODE) {
            arguments.callee(children[i]);
        }

        node = children[i];
        if (isValidNode(node) && re) {
            var data = node.nodeValue.replace(re, "<span class='mark'>$1</span>");
            data = data.replace("<span></span>", "");
            if (data != node.nodeValue) {
                var temp = document.createElement("span");
                temp.innerHTML = data;
                $(temp).css("opacity", wordListObj[$(temp).find("span.mark").html().toLowerCase()].complete / $$option.maxComplete);
                node.parentNode.insertBefore(temp, node);
                node.parentNode.removeChild(node);
            }
        }
    }
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request);
    if (request.cmd == "refresh") {
        init();
        var response = {result: "ok"};
        sendResponse(response);
    }
});

function addDomModifiedEvent() {
    var container = document.body;
    if (container.addEventListener) {
        container.addEventListener('DOMSubtreeModified', function () {
            init();

            $('span.mark').popover({
                trigger : 'hover',
                content : '????',
                container : 'body'
            });
        }, false);
    }
}
