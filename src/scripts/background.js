var DEFAULT_COMPLETE_VALUE = 5;
var prevNotiId = null;
var prevAlarmTime = null;
var daumDictUrl = "http://dic.daum.net/search.do?q=";

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
                // console.log(response);
            });
        });
    });
}

chrome.contextMenus.create({
    title: "add '%s' to paintover",
    contexts: ["selection"],
    onclick: onClick
});

chrome.contextMenus.create({
    title: "focus view paintover",
    contexts: ['page'],
    onclick: function (info, tab) {
        var request = {cmd: "focus"};
        chrome.tabs.sendMessage(tab.id, request, function (response) {
            // console.log(response);
        });
    }
});

chrome.extension.onRequest.addListener(
    function (request, sender, sendResponse) {
        if (!sender.tab) return;

        chrome.pageAction.show(sender.tab.id);
        var alarmId = "paintover";

        if (request.method == "storage" && request.key == "wordlist") {
            // 단어 요청
            chrome.storage.sync.get(function (items) {
                sendResponse({data: items});
            });
        } else if (request.method == "notification" && request.key == "alarm") {
            // 알람 시작
            chrome.storage.sync.get("$$option", function (obj) {
                var notiPeriod = 1;
                var cancel = false;

                if (obj.$$option) {
                    var notiChecked = obj.$$option["notiChecked"];
                    if (notiChecked) {
                        notiPeriod = obj.$$option["notiPeriod"];
                    } else {
                        cancel = true;
                    }
                } else {
                    cancel = true;
                }

                if (cancel) {
                    chrome.alarms.clear(alarmId);
                    prevAlarmTime = null;
                } else {
                    chrome.alarms.create(alarmId, {
                        "periodInMinutes": notiPeriod,
                        "when": Date.now()
                    });
                }
            });
        } else {
            sendResponse({});
        }
    }
);

var notiWord = "paint over";
// 알람 리스너, 주기적으로 노티를 띄운다.
chrome.alarms.onAlarm.addListener(function (alarm) {
    var d = new Date();
    if (prevAlarmTime) {
        var now = d.getTime();
        var interval = Math.abs(prevAlarmTime - now);
        if (interval < (alarm.periodInMinutes * 60000)) {
            return;
        }
        prevAlarmTime = now;
    }

    prevAlarmTime = d.getTime();

    if (prevNotiId) {
        chrome.notifications.clear(prevNotiId, function (wasCleared) {
        });
    }

    chrome.storage.sync.get(function (item) {
        var list = Object.keys(item);
        var idx = list.indexOf("$$option");
        if (idx >= 0) {
            list.splice(idx, 1);
        }

        if (list.length > 0) {
            notiWord = list[parseInt(Math.random() * list.length)];

            $.get(daumDictUrl + notiWord).done(function (data) {
                var re = /<[^>]+class\s*=\s*"\s*?tit_searchfd\s*">([^>]+?)<\/h4>(?:.|\n|\r)*?class="\s*link_txt\s*">([^>]+?)<\/a>(?:.|\n|\r)*?class="\s*txt_means_[^"]+?\s*">([^>]+?)<\/div>/g;
                var m = re.exec(data);
                if (m && m.length > 3) {
                    var notiId = "paintover"
                    var notiOpt = {
                        type: "basic",
                        title: "등록된 단어: " + notiWord,
                        message: "[ " + m[2] + " ]" + "\n" + m[3],
                        iconUrl: "assets/icon_128.png",
                        buttons: [
                            {title: "다음 사전에서 자세히 보기"}
                        ]
                    }
                }

                chrome.notifications.create(notiId, notiOpt, function (notificationId) {
                    prevNotiId = notificationId;
                });
            });
//
//            var xhr = new XMLHttpRequest();
//            xhr.open("GET", daumDictUrl + notiWord, true);
//            xhr.onreadystatechange = function () {
//                if (xhr.readyState == 4) {
//                    console.log(xhr.responseText);
//                }
//            }
//            xhr.send();
        }
    });
});

chrome.pageAction.onClicked.addListener(function (tab) {
    chrome.tabs.create({
        index: tab.index + 1,
        url: "views/options.html"
    }, function (tab) {
    });
});

chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
    if ("paintover" === notificationId && 0 == buttonIndex) {
        var dicUrl = daumDictUrl + notiWord;
        window.open(dicUrl, "_blank");
    }
});
