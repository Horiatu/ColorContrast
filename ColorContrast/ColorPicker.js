var ColorPicker = function() {

    var _private = {
        colorPickerToolbar: null,
        colorDiv: null,
        colorTxt: null,
        imageUrl: null,
        imageData: null,

        width: $(document).width(),
        height: $(document).height(),
        imageData: null,
        canvasBorders: 20,
        canvasData: null,
        dropperActivated: false,
        screenWidth: 0,
        screenHeight: 0,
        options: {
            enableColorToolbox: true,
            enableColorTooltip: true,
            enableRightClickDeactivate: true
        },
        YOffset: 0,
        XOffset: 0,

        showMagnifier: false,
        showToolbar: false,

        screenshotDfr: null,

        canvas: document.createElement("canvas"),
        rects: [],
        screenshoting: false,

        rectInRect: function(A, B) {
            return (A.x >= B.x && A.y >= B.y && (A.x + A.width) <= (B.x + B.width) && (A.y + A.height) <= (B.y + B.height))
        },

        // found out if two points and length overlaps
        // and merge it if needed. Helper method for
        // rectMerge
        rectMergeGeneric: function(a1, a2, length) {
            // switch them if a2 is above a1
            if (a2 < a1) {
                tmp = a2;
                a2 = a1;
                a1 = tmp;
            }

            // shapes are overlaping
            if (a2 <= a1 + length)
                return {
                    a: a1,
                    length: (a2 - a1) + length
                };
            else
                return false;
        },

        // merge same x or y positioned rectangles if overlaps
        // width (or height) of B has to be equal to A
        rectMerge: function(A, B) {
            var t;

            // same x position and same width
            if (A.x == B.x && A.width == B.width) {
                t = _private.rectMergeGeneric(A.y, B.y, A.height);

                if (t != false) {
                    A.y = t.a;
                    A.height = length;
                    return A;
                }

                // same y position and same height
            } else if (A.y == B.y && A.height == B.height) {
                t = _private.rectMergeGeneric(A.x, B.x, A.width);

                if (t != false) {
                    A.x = t.a;
                    A.width = length;
                    return A;
                }
            }

            return false;
        },

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

                color = _private.getPixel(event, 0, 0);
                if(type == "selected") {
                    chrome.extension.connect().postMessage({
                        type: 'set-color',
                        color: color
                    });
                };

                var colorPickerViewer = $("#colorPickerViewer");
                if (_private.showMagnifier && colorPickerViewer) {

                    var tagName = eventTarget.tagName;

                    // If the event target is not the color picker, the color picker is not an ancestor of the event target and the event target is not a scrollbar
                    if (eventTarget != colorPickerViewer && !_private.isAncestor(eventTarget, colorPickerViewer) && tagName && tagName.toLowerCase() != "scrollbar") {
                        // place viewer
                        var w = window.innerWidth - 100;
                        var h = window.innerHeight - 100;
                        if (event.clientX < w) {
                            colorPickerViewer.css("left", (event.clientX + 4) + "px");
                        } else {
                            colorPickerViewer.css("left", (event.clientX - 62) + "px");
                        }
                        if (event.clientY < h) {
                            colorPickerViewer.css("top", (event.clientY + 4) + "px");
                        } else {
                            colorPickerViewer.css("top", (event.clientY - 62) + "px");
                        }

                    }
                };

                if (_private.showToolbar) {
                    _private.colorDiv.setAttribute("style", "position:fixed; width:18px; height:18px; background-color:" + color + ";");
                    _private.colorTxt.innerHTML = color;
                }

                if (!_private.showMagnifier || !ColorPicker.colorPickerViewer) return;
                var deep = 3;
                for (i = -deep; i <= deep; i++) {
                    for (j = -deep; j <= deep; j++) {
                        ColorPicker.dotArray[i + deep][j + deep].setAttribute("style", "background-color:" + _private.getPixel(event, j, i) + ";");
                    }
                }

                getColorDfr.resolve();
            } else {
                getColorDfr.reject();
            }

            return getColorDfr.promise();
        },

        toHex: function(c, n) {
            if (c === undefined) return '00';
            var hex = c.toString(16);
            while (hex.length < n) {
                hex = '0' + hex;
            }
            return hex;
        },

        getPixel: function(e, x, y) {
            if (_private.canvasData === null)
                return 'transparent';

            var canvasIndex = ((e.pageX + x) + (e.pageY + y) * _private.canvas.width) * 4;
            ////console.log(e.pageX + ' ' + e.pageY + ' ' + _private.canvas.width);

            var rgb = {
                r: _private.canvasData[canvasIndex],
                g: _private.canvasData[canvasIndex + 1],
                b: _private.canvasData[canvasIndex + 2],
                //alpha: _private.canvasData[canvasIndex+3]
            };

            var color = '#' + _private.toHex(rgb.r, 2) + _private.toHex(rgb.g, 2) + _private.toHex(rgb.b, 2);
            return color;
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

                //$('#colorPickerViewer').hide();
                //_private.screenshot().done(function() {
                //    $('#colorPickerViewer').show();
                    _private.getColor(event, "selected");
                //});
            }
        },

        MouseMove: function(event) {
            _private.getColor(event, "hover");
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
                _private.showMagnifier = true;
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
                _private.showToolbar = true;
            });

            chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
                switch (req.type) {
                    case 'update-image':
                        _private.capture(req.data);
                        break;
                }
            });

            _private.YOffset = $(document).scrollTop();
            _private.XOffset = $(document).scrollLeft();

            _private.screenshot();
        },

        screenshot: function() {
            _private.screenshotDfr = $.Deferred();
            chrome.extension.connect().postMessage({
                type: 'screenshot'
            });

            return _private.screenshotDfr.promise();
        },

        capture: function(imageData) {
            _private.imageData = imageData;

            if (_private.canvas.width != (_private.width + _private.canvasBorders) || _private.canvas.height != (_private.height + _private.canvasBorders)) {
                console.log('dropper: creating new canvas');
                _private.canvas = document.createElement('canvas');
                _private.canvas.width = _private.width + _private.canvasBorders;
                _private.canvas.height = _private.height + _private.canvasBorders;
                _private.canvasContext = _private.canvas.getContext('2d');
                _private.canvasContext.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);
                _private.rects = [];
            }

            //    var image = new Image();
            var image = document.createElement('img');

            image.onload = function() {
                _private.screenWidth = image.width;
                _private.screenHeight = image.height;

                var rect = {
                    x: _private.XOffset,
                    y: _private.YOffset,
                    width: image.width,
                    height: image.height
                };
                var merged = false;

                // if there are already any rectangles
                if (_private.rects.length > 0) {
                    // try to merge shot with others
                    for (index in _private.rects) {
                        var t = _private.rectMerge(rect, _private.rects[index]);

                        if (t != false) {
                            console.log('dropper: merging');
                            merged = true;
                            _private.rects[index] = t;
                        }
                    }
                }

                // put rectangle in array
                if (merged == false)
                    _private.rects.push(rect);

                _private.canvasContext.drawImage(image, _private.XOffset, _private.YOffset);
                _private.canvasData = _private.canvasContext.getImageData(0, 0, _private.canvas.width, _private.canvas.height).data;

                _private.screenshoting = false;
                //$("#eye-dropper-overlay").css('cursor',_private.options.cursor);

                //// re-enable tooltip and toolbox
                //if ( _private.options.enableColorTooltip === true ) {
                // _private.elColorTooltip.show(1);
                //}
                //if ( _private.options.enableColorToolbox === true ) {
                //  _private.elColorToolbox.show(1);
                //}

                _private.screenshotDfr.resolve();
            }
            if (_private.imageData) {
                image.src = _private.imageData;
            } else {
                console.error('ed: no imageData');
            }
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
            _private.screenshot();
        },
    }

    return _public;

}();