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
