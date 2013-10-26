var re = null;
var skipNodeList = null;
var wordList = [""];
var wordListObj = {};
var $$option = {};
var tab;

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
                maxComplete : 10,
                bgColor : "#ffff00",
                fgColor : "#ff0000"
            };

            wordList = Object.keys(response.data);
            if (wordList.length > 0) {
                var regex = "\\b(" + wordList.join("|") + ")\\b";
                re = new RegExp(regex, "gi");
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
    if(node.tagName.toLowerCase() == "span" && node.getAttribute("class") == "mark"){
        if(wordListObj[$(node).html().toLowerCase()] === undefined){
            $(node).css("background",0);
            $(node).popover('destroy');
            return true;
        }
        var alpha = wordListObj[$(node).html().toLowerCase()].complete / $$option.maxComplete;
        var rgba = getRGBA($$option.bgColor, alpha);
        $(node).css("background",rgba);
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
            var data = node.nodeValue.replace(re, "<span class='mark' word='$1'>$1</span>");
            data = data.replace("<span></span>", "");

            // console.log("data");
            if (data != node.nodeValue) {
                var temp = document.createElement("span");
                temp.innerHTML = data;
                // console.log(temp);
                var alpha = wordListObj[$(temp).find("span.mark").html().toLowerCase()].complete / $$option.maxComplete;
                var rgba = getRGBA($$option.bgColor, alpha);
                $(temp).find('span.mark').css("background",rgba);

                node.parentNode.insertBefore(temp, node);
                node.parentNode.removeChild(node);
            }
        }
    }
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
                content : 'dummy value',
                container : 'body'
            });
        }, false);
    }
}

function getRGBA(hex, a) {
    var color = this,
        str = "string",
        args = arguments.length,
        r,
        parseHex = function (h) {
          return parseInt(h, 16);
        };

        if (typeof hex === str) {
                r = hex.substr(hex.indexOf("#") + 1);
                var threeDigits = r.length === 3;
                r = parseHex(r);
                threeDigits &&
                        (r = (((r & 0xF00) * 0x1100) | ((r & 0xF0) * 0x110) | ((r & 0xF) * 0x11)));
        }
        
        
        g = (r & 0xFF00) / 0x100;
        b =  r & 0xFF;
        r =  r >>> 0x10;

    var rgbaList = [
            typeof r === str && parseHex(r) || r,
            typeof g === str && parseHex(g) || g,
            typeof b === str && parseHex(b) || b,
            (typeof a !== str && typeof a !== "number") && 1 ||
                    typeof a === str && parseFloat(a) || a
    ];

    return "rgba(" + rgbaList.join(",") + ")";
}