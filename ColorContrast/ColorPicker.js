var ColorPicker = function() {

    var _private = {
        colorPickerToolbar: null,
        colorDiv: null,
        colorTxt: null,
        imageUrl: null,

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
            getColorDfr = $.Deferred();

            var eventTarget = event.target;

            if (eventTarget) {
                var colorPicker = $("#colorPickerViewer");
                if (colorPicker) {

                    var tagName = eventTarget.tagName;

                    // If the event target is not the color picker, the color picker is not an ancestor of the event target and the event target is not a scrollbar
                    if (eventTarget != colorPicker && !_private.isAncestor(eventTarget, colorPicker) && tagName && tagName.toLowerCase() != "scrollbar") {
                        var w = window.innerWidth - 100;
                        var h = window.innerHeight - 100;
                        if (event.clientX < w) {
                            colorPicker.css("left", (event.clientX + 4) + "px");
                        } else {
                            colorPicker.css("left", (event.clientX - 62) + "px");
                        }
                        if (event.clientY < h) {
                            colorPicker.css("top", (event.clientY + 4) + "px");
                        } else {
                            colorPicker.css("top", (event.clientY - 62) + "px");
                        }
                        //console.log(event);
                    }
                };

                chrome.extension.sendMessage({
                        type: "get-color",
                        x: event.clientX,
                        y: event.clientY,
                        eventType: type,
                        showMagnifier: _public.showMagnifier,
                        showToolbar: _public.showToolbar,
                    },
                    function(response) {
                        if (_public.showToolbar) {
                            _private.colorDiv.setAttribute("style", "position:fixed; width:18px; height:18px; background-color:" + response.color + ";");
                            _private.colorTxt.innerHTML = response.color;
                        }

                        if (!ColorPicker.showMagnifier || !ColorPicker.colorPickerViewer) return;
                        var deep = response.colors.length;
                        for (i = 0; i < deep; i++) {
                            for (j = 0; j < deep; j++) {
                                color = response.colors[j][i];
                                ColorPicker.dotArray[i][j].setAttribute("style", "background-color:" + color + ";");
                            }
                        }
                        getColorDfr.resolve();
                    }
                );
            } else {
                getColorDfr.reject();
            }

            return getColorDfr.promise();
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
                event.stopPropagation();
                event.preventDefault();
 
               $('#colorPickerViewer').hide();
                _private.getColor(event, "selected").always(
                    function() {
                        $('#colorPickerViewer').show(); // ?
                    });
            }
        },

        MouseMove: function(event) {
                //event.stopPropagation();
                //event.preventDefault();
 
            _private.removeMouseSupport(document);
            _private.getColor(event, "hover").always(
                function() {
                    _private.addMouseSupport(document);
                    $('#colorPickerViewer').show(); // !
                });
        },

        addMouseSupport: function(contentDocument) {
            contentDocument.addEventListener("click", _private.Click, true);
            contentDocument.addEventListener("mousemove", _private.MouseMove, true);
        },

        removeMouseSupport: function(contentDocument) {
            contentDocument.removeEventListener("click", _private.Click);
            contentDocument.removeEventListener("mousemove", _private.MouseMove);
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

            _private.addMouseSupport(document);

            _private.removeTitles();

            _private.retrieveGlass().then(function() {
                if (!contentDocument.getElementById("colorPickerViewer")) {
                    ColorPicker.colorPickerViewer = contentDocument.createElement("Div");
                    ColorPicker.colorPickerViewer.setAttribute("id", "colorPickerViewer");

                    var t = contentDocument.createElement("Table");
                    t.setAttribute("cellspacing", 1);
                    ColorPicker.colorPickerViewer.appendChild(t);

                    _public.dotArray = Array();
                    deep = 3;
                    for (i = -deep; i <= deep; i++) {
                        row = Array();
                        tr = contentDocument.createElement("tr");
                        t.appendChild(tr);
                        for (j = -deep; j <= deep; j++) {
                            td = contentDocument.createElement("td");
                            tr.appendChild(td);
                            row.push(td);
                            if (i == 0 && j == 0) {
                                marker = contentDocument.createElement("div");
                                marker.setAttribute("class", "marker");
                                td.appendChild(marker);
                            }
                        }
                        _public.dotArray.push(row);
                    }

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

            _private.removeMouseSupport(document);
            _private.restoreTitles();
        },

    }

    var _public = {
        colorPickerViewer: null,
        showMagnifier: false,
        showToolbar: false,
        dotArray: null,

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
    }

    return _public;

}();