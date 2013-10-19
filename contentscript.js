var re = null;
var skipNodeList = null;
var wordList = [""];

window.onload = function () {
    init();
};

var init = function () {
    skipNodeList = ["style", "script", "object", "form", "head", "input", "fieldset"];

    chrome.extension.sendRequest(
        {
            method: "storage",
            key: "wordlist"
        }, function (response) {
            wordList = Object.keys(response.data);
            for(var i=0; i < wordList.length; i++) {
                wordList[i] = toUnicode(wordList[i]);
            }
            if (wordList.length > 0) {
                var regex = "\\b(" + wordList.join("|") + ")\\b";
                re = new RegExp(regex, "gi");
                console.log(re)
            }
            skipNodeList = [];
            mark(document.body);
        }
    );
};

function toUnicode(theString) {
    var unicodeString = '';
    for (var i=0; i < theString.length; i++) {
        var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
        while (theUnicode.length < 4) {
            theUnicode = '0' + theUnicode;
        }
        theUnicode = '\\u' + theUnicode;
        unicodeString += theUnicode;
    }
    return unicodeString;
}

function isHtml(text) {
    return text.indexOf("<meta ") >= 0 ||
        text.indexOf("function(") >= 0 ||
        text.indexOf("if(") >= 0 ||
        text.indexOf("<div ") >= 0;
}

function mark(node) {
    if (!node.hasChildNodes() || node.tagName.toLowerCase() in skipNodeList) {
        return;
    }

    var children = node.childNodes;
    for (var i = 0; i < children.length; i++) {
        if (children[i].nodeType == Node.ELEMENT_NODE) {
            arguments.callee(children[i]);
        }

        node = children[i];
        if (node.nodeType == Node.TEXT_NODE && !isHtml(node.nodeValue)) {
            var data = node.nodeValue.replace(re, "<span class=\"mark\">$1</span>");
            data = data.replace("<span></span>", "");
            if (data != node.nodeValue) {
                var temp = document.createElement("span");
                temp.innerHTML = data;
                node.parentNode.insertBefore(temp, node);
                node.parentNode.removeChild(node);
            }
        }
    }
};

