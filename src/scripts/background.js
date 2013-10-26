var DEFAULT_COMPLETE_VALUE = 5;

function onClick(info, tab) {
    var word = info.selectionText.toLowerCase();
    chrome.storage.sync.get(function (obj) {
        var map = {};
        var maxComplete = DEFAULT_COMPLETE_VALUE;
        if (obj.$$option) {
            var tmp = obj.$$option["maxComplete"];
            if (tmp) maxComplete = tmp;
        }
        map[word] = {
            'text': word,
            'complete': maxComplete
        };
        chrome.storage.sync.set(map, function () {
            // Notify that we saved.
            var request = {cmd: "refresh"};
            chrome.tabs.sendMessage(tab.id, request, function (response) {
                console.log(response);
            });
        });
    })
}

chrome.contextMenus.create({
    title: "add '%s' to paintover",
    contexts: ["selection"],
    onclick: onClick
});

chrome.extension.onRequest.addListener(
    function (request, sender, sendResponse) {
        if (!sender.tab) return;

        chrome.pageAction.show(sender.tab.id);

        if (request.method == "storage" && request.key == "wordlist") {
            chrome.storage.sync.get(function (items) {
                sendResponse({data: items});
            });
        } else {
            sendResponse({});
        }
    }
);

chrome.pageAction.onClicked.addListener(function (tab) {
    chrome.tabs.create({
        index: tab.index + 1,
        url: "options.html"
    }, function (tab) {
    });
});
