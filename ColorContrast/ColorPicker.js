var ColorPicker = function() {

    var _private = {
        colorPickerToolbar: null,
        colorDiv: null,
        colorTxt: null,
        imageUrl: null,
        showToolbar: false,

        retrieveGlass: function() {
            var dfr1 = $.Deferred();
            chrome.storage.sync.get(['magnifierGlass'], function(a) {
                if (a['magnifierGlass'] != 'none') {
                    _private.imageUrl = chrome.extension.getURL("Images/" + a['magnifierGlass'] + ".png");
                    dfr1.resolve();
                } else {
                    dfr1.reject();
                }
            });
            return dfr1.promise();
        },

        retrieveToolbar: function() {
            var dfr2 = $.Deferred();
            chrome.storage.sync.get(['toolbar'], function(a) {
                if (a['toolbar']) {
                    dfr2.resolve();
                } else {
                    dfr2.reject();
                }
            });
            return dfr2.promise();
        },

        getColor: function(event, type) {
            var eventTarget = event.target;

            // If the event target is set
            if (eventTarget) {
                chrome.extension.sendMessage({
                    type: "get-color",
                    x: event.clientX,
                    y: event.clientY,
                    eventType: type
                });

                var ownerDocument = eventTarget.ownerDocument;
                if (ownerDocument) {
                    var colorPicker = ownerDocument.getElementById("colorPickerViewer");
                    if (!colorPicker) return;

                    var tagName = eventTarget.tagName;

                    // If the event target is not the color picker, the color picker is not an ancestor of the event target and the event target is not a scrollbar
                    if (eventTarget != colorPicker && !_private.isAncestor(eventTarget, colorPicker) && tagName && tagName.toLowerCase() != "scrollbar") {
                        var w = window.innerWidth - 100;
                        var h = window.innerHeight - 100;
                        if (event.clientX < w) {
                            colorPicker.style.left = event.clientX + 4 + "px";
                        } else {
                            colorPicker.style.left = event.clientX - 62 + "px";
                        }
                        if (event.clientY < h) {
                            colorPicker.style.top = event.clientY + 4 + "px";
                        } else {
                            colorPicker.style.top = event.clientY - 62 + "px";
                        }
                        //console.log(event);
                    }
                }
            }
        },

        isAncestor: function(element, ancestorElement) {
            // If the element and ancestor element are set
            if (element && ancestorElement) {
                var parentElement = null;

                // Loop through the parent elements
                while ((parentElement = element.parentNode) !== null) {
                    // If the parent element is the ancestor element
                    if (parentElement == ancestorElement) {
                        return true;
                    } else {
                        element = parentElement;
                    }
                }
            }

            return false;
        },

        Click: function(event) {
            if (event.button != 2) {
                _private.getColor(event, "selected");

                event.stopPropagation();
                event.preventDefault();
            }
        },

        MouseMove: function(event) {
            _private.getColor(event, "hover");
        },

        removeTitles: function() {
            //return;
            $('[title]').bind('mousemove.hideTooltips', function() {
                $this = $(this);
                if ($this.attr('title') && $this.attr('title') != '') {
                    $this.data('title', $this.attr('title'));
                    $this.attr('title', '');
                }
            }).bind('mouseout.hideTooltips', function() {
                $this = $(this);
                $this.attr('title', $this.data('title'));
            });
        },

        restoreTitles: function() {
            //return;
            $('[title]').unbind('mousemove.hideTooltips').unbind('mouseout.hideTooltips');
            $('*[data-title!=undefined]').attr('title', $(this).data('title'));
        },

        init: function(contentDocument) {
            if (!contentDocument.getElementById("colorPickerCursor")) {
                var colorPickerCss = '<link id="colorPickerCss" rel="stylesheet" type="text/css" href="' + chrome.extension.getURL('ColorPicker.css') + '" />';
                var css = '<Style id="colorPickerCursor">\n' +
                    ' * { cursor: url(' + chrome.extension.getURL("Images/Cursors/pickColor.cur") + '), crosshair !important; }\n' +
                    '</Style>';
                if ($("head").length == 0) {
                    $("body").before(colorPickerCss);
                    $("body").before(css);
                } else {
                    $("head").append(colorPickerCss);
                    $("head").append(css);
                }
            }

            contentDocument.addEventListener("click", _private.Click, true);
            contentDocument.addEventListener("mousemove", _private.MouseMove, false);

            _private.removeTitles();

            _private.retrieveGlass().then(function() {
                if (!contentDocument.getElementById("colorPickerViewer")) {
                    ColorPicker.colorPickerViewer = contentDocument.createElement("Div");
                    ColorPicker.colorPickerViewer.setAttribute("id", "colorPickerViewer");

                    var t = contentDocument.createElement("Table");
                    ColorPicker.colorPickerViewer.appendChild(t);

                    var d = contentDocument.createElement("div");
                    var i = contentDocument.createElement("img");

                    i.setAttribute("alt", "");
                    i.setAttribute("width", "59px");
                    i.setAttribute("height", "59px");

                    //console.log(a['magnifierGlass']);
                    i.setAttribute("src", _private.imageUrl);
                    d.appendChild(i);

                    ColorPicker.colorPickerViewer.appendChild(d);

                    $('body').append(ColorPicker.colorPickerViewer);
                }
                _public.showMagnifier = true;
            });

            _private.retrieveToolbar().then(function() {
                if (!contentDocument.getElementById("colorPickerDiv")) {
                    _private.colorPickerToolbar = contentDocument.createElement("Div");
                    _private.colorPickerToolbar.setAttribute("id", "colorPickerDiv");

                    _private.colorDiv = contentDocument.createElement("Div");
                    _private.colorDiv.setAttribute("id", "colorDiv");
                    _private.colorPickerToolbar.appendChild(_private.colorDiv);

                    _private.colorTxt = contentDocument.createElement("Span");
                    _private.colorTxt.setAttribute("id", "colorTxt");
                    _private.colorPickerToolbar.appendChild(_private.colorTxt);

                    $('body').append(_private.colorPickerToolbar);
                };
                _public.showToolbar = true;
            });
        },

        destroy: function(contentDocument) {
            $("#colorPickerCursor").remove();
            $("colorPickerCss").remove();

            $("#colorPickerDiv").remove();
            $("#colorPickerViewer").remove();

            contentDocument.removeEventListener("click", _private.Click, true);
            contentDocument.removeEventListener("mousemove", _private.MouseMove, false);
            _private.restoreTitles();
        },

    }

    var _public = {
        showMagnifier: false,
        colorPickerViewer: null,
        Show: function(contentDocument) {
            _private.init(contentDocument);
        },

        Hide: function(contentDocument) {
            try {
                _private.destroy(contentDocument);
            } catch (err) {
                console.log(err);
            };
        },

        refresh: function() {
            chrome.extension.sendMessage({
                type: "get-canvas"
            });
        },

        setColor: function(color, type) {
            _private.colorDiv.setAttribute("style", "position:fixed; width:18px; height:18px; background-color:" + color + ";");
            _private.colorTxt.innerHTML = color;
        },

        setColors: function(colors, type) {

            if (!ColorPicker.showMagnifier || !ColorPicker.colorPickerViewer) return;

            var deep = colors.length;
            m = (deep - 1) / 2;
            var s = ''; //<table style="border-collapse:collapse;" cellspacing="1" >';
            for (i = 0; i < deep; i++) {
                s += '<tr>';

                for (j = 0; j < deep; j++) {
                    color = colors[j][i];
                    if (!color) {
                        color = 'indigo';
                    }
                    var centre = i == m && j == m;
                    s += '<td style="background-color:' + color;
                    if (centre) {
                        s += '; border-radius:6px'
                    }
                    s += ';">';
                    //if(centre) {
                    //  s+='<div style="padding:0px; width:5px; height:5px; border:1px solid red; background-color:transparent;"></div>';
                    //}
                    s += '</td>';
                }

                s += '</tr>';
            }
            this.colorPickerViewer.childNodes[0].innerHTML = s;
        },

    }

    return _public;

}();