var DEFAULT_COMPLETE_VALUE = 5;

function onClick(info, tab) {
    var word = info.selectionText;
    var map = {};
    map[word] = {
        'text': word,
        'complete': DEFAULT_COMPLETE_VALUE
    };
    chrome.storage.sync.set(
        map, function () {
            // Notify that we saved.
        }
    );
}

chrome.contextMenus.create(
    {
        title: "add '%s' to paintover",
        contexts: ["selection"],
        onclick: onClick
    }
);

chrome.extension.onRequest.addListener(
    function (request, sender, sendResponse) {
        chrome.pageAction.show(sender.tab.id);

        if (request.method == "storage" && request.key == "wordlist") {
            chrome.storage.sync.get(
                function (items) {
                    sendResponse({data: items});
                }
            )
        } else {
            sendResponse({});
        }
    }
);

chrome.pageAction.onClicked.addListener(
    function (tab) {
        chrome.tabs.create(
            {
                index: tab.index + 1,
                url: "options.html"
            }, function (tab) {
            }
        );
    }
);
