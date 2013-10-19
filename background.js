function onClick(info, tab) {
    var word = info.selectionText;
}

chrome.contextMenus.create(
    {
        title: "add '%s' to paintover",
        contexts:["selection"],
        onclick: onClick
    }
);
