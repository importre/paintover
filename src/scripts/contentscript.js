var re = null;
var skipNodeList = null;
var wordList = [""];
var wordListObj = {};
var $$option = {};
var tab;
var DEFAULT_COMPLETE_VALUE = 5;

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
                maxComplete : DEFAULT_COMPLETE_VALUE,
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
            $(node).removeClass('mark');
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

            if (data != node.nodeValue) {
                var spanEl = document.createElement("span");
                spanEl.innerHTML = data;
                var word =  $(spanEl).find("span.mark").html();
                if (word) {
                    var alpha = wordListObj[word.toLowerCase()].complete / $$option.maxComplete;
                    var rgba = getRGBA($$option.bgColor, alpha);
                    $(spanEl).find('span.mark').css("background",rgba);

                    node.parentNode.insertBefore(spanEl, node);
                    node.parentNode.removeChild(node);
                }
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

    if(request.cmd == "focus"){
        focus();
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

function focus() {
    // Padding around the selection
    var PADDING = 5;
    // Opacity of the overlay
    var OPACITY = 0.75;
    // Key modifier that needs to be held down for overlay to appear
    var MODIFIER = null;
    // The opaque overlay canvas
    var overlay,
        overlayContext,
        overlayAlpha = 0,

    // Reference to the redraw animation so it can be cancelled
    redrawAnimation,

    // 선택된 단어들의 regin데이터 목록
    selectedRegionList = [];

    // Currently pressed down key modifiers
    keyModifiers = { ctrl: false, shift: false, alt: false, cmd: false };

    // Ensures that Fokus isn't initialized twice on the same page
    window.__fokused = true;

    //클릭여부 처음엔 클릭안했으니 false 추후에 클릭하면 canvas삭제
    isClicked = false;

    overlay = document.createElement( 'canvas' );
    overlayContext = overlay.getContext( '2d' );

    // Place the canvas on top of everything
    overlay.style.position = 'fixed';
    overlay.style.left = 0;
    overlay.style.top = 0;
    overlay.style.zIndex = 2147483647;
    overlay.style.pointerEvents = 'none';
    overlay.style.background = 'transparent';

    onWindowResize();

    function onKeyPress( event ) {
        if(event.cancelable) isClicked = true;
        updateSelection();
    }

    function onMouseDown( event ) {
        //팝오버된것은 무시한다.
        if($(event.target).parents(".paintover-popover").length>0) return;

        isClicked = true;
        updateSelection();
    }

    /**
     * Steps through all selected nodes and updates the selected
     * region (bounds of selection).
     */
    function updateSelection() {
        // Default to negative space
        var currentRegion = { left: Number.MAX_VALUE, top: Number.MAX_VALUE, right: 0, bottom: 0 };

        var nodes = getSelectedNodes();

        for( var i = 0, len = nodes.length; i < len; i++ ) {
            var node = nodes[i];

            // Select parents of text nodes that have contents
            if( node.nodeName === '#text' && node.nodeValue.trim() ) {
                node = node.parentNode;
            }

            // Fetch the screen coordinates for this element
            var position = getScreenPosition( node );

            var x = position.x,
                y = position.y,
                w = node.offsetWidth,
                h = node.offsetHeight;

            // 1. offsetLeft works
            // 2. offsetWidth works
            // 3. Element is larger than zero pixels
            // 4. Element is not <br>
            if( node && typeof x === 'number' && typeof w === 'number' && ( w > 0 || h > 0 ) && !node.nodeName.match( /^br$/gi ) ) {
                currentRegion.left = Math.min( currentRegion.left, x );
                currentRegion.top = Math.min( currentRegion.top, y );
                currentRegion.right = Math.max( currentRegion.right, x + w );
                currentRegion.bottom = Math.max( currentRegion.bottom, y + h );
            }
            selectedRegionList.push({
                left: x,
                top: y,
                right: x+w,
                bottom: y+h
            });
        }

        // Start repainting if there is a selected region
        if( hasSelection() ) {
            redraw();
        }
    }

    function hasSelection() {
        var spanMarkLength = $("span.mark").get().length;
        return (spanMarkLength > 0);
    }

    function onWindowResize( event ) {
        overlay.width = window.innerWidth;
        overlay.height = window.innerHeight;
    }
    
    function getSelectedNodes() {
        return $("span.mark").get();
    }

    /**
     * Redraws an animates the overlay.
     */
    function redraw() {

        // Cache the response of this for re-use below
        var _hasSelection = hasSelection();

        // Reset to a solid (less opacity) overlay fill
        overlayContext.clearRect( 0, 0, overlay.width, overlay.height );
        overlayContext.fillStyle = 'rgba( 0, 0, 0, '+ overlayAlpha +' )';
        overlayContext.fillRect( 0, 0, overlay.width, overlay.height );

        //전체 선택된 단어를 가지고와서 해당 부분을 지운다.
        for (var i = 0; i < selectedRegionList.length; i++) {
            overlayContext.clearRect(
                selectedRegionList[i].left - window.scrollX - PADDING,
                selectedRegionList[i].top - window.scrollY - PADDING,
                ( selectedRegionList[i].right - selectedRegionList[i].left ) + ( PADDING * 2 ),
                ( selectedRegionList[i].bottom - selectedRegionList[i].top ) + ( PADDING * 2 )
            );
            
        };

        // Fade in if there's a valid selection...
        if( _hasSelection ) {
            overlayAlpha += ( OPACITY - overlayAlpha ) * 0.08;
        }
        // ... otherwise fade out
        else {
            overlayAlpha = Math.max( ( overlayAlpha * 0.85 ) - 0.02, 0 );
        }

        // Ensure there is no overlap
        cancelAnimationFrame( redrawAnimation );

        // 계속해서 그린다. 재귀호출 부분. 클릭하기 전이나 선택된게 없을때까지
        if( isClicked === false && _hasSelection && overlayAlpha > 0 ) {
            // Append the overlay if it isn't already in the DOM
            if( !overlay.parentNode ) {
                document.body.appendChild( overlay );
                document.addEventListener( 'mousedown', onMouseDown, false );
                document.addEventListener( 'keydown', onKeyPress, false );
            };

            // Stage a new animation frame
            redrawAnimation = requestAnimationFrame( redraw );
        }
        else {
            document.body.removeChild( overlay );
            document.removeEventListener('mousedown',onMouseDown,false);
            document.removeEventListener('keydown',onKeyPress,false);
        }

    }

    /**
     * Gets the x/y screen position of the target node, source:
     * http://www.quirksmode.org/js/findpos.html
     */
    function getScreenPosition( node ) {
        var x = document.documentElement.offsetLeft,
            y = document.documentElement.offsetTop;

        if ( node.offsetParent ) {
            do {
                x += node.offsetLeft;
                y += node.offsetTop;
            } while ( node = node.offsetParent );
        }

        return { x: x, y: y };
    }

    updateSelection();
}