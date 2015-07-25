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

        gridSize: 7,
        reqColor: null,

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
            chrome.storage.sync.get(['magnifierGlass', 'gridSize'], function(a) {
                if (a['magnifierGlass'] != 'none') {
                    _private.imageUrl = chrome.extension.getURL("Images/" + a['magnifierGlass'] + ".png");
                    _private.gridSize = a['gridSize'] ? a['gridSize'] : 7;
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

        sendMessage: function(message) {
            chrome.extension.connect().postMessage(message);
        },

        getColor: function(event, type, reqColor) {
            getColorDfr = $.Deferred();

            var eventTarget = event.target;

            if (eventTarget) {

                color = _private.getPixel(event, 0, 0);
                if (type == "selected") {
                    _private.sendMessage({
                        type: 'set-color',
                        color: color,
                        reqColor: reqColor
                    });
                };

                var colorPickerViewer = $("#colorPickerViewer");
                if (_private.showMagnifier && colorPickerViewer) {

                    var tagName = eventTarget.tagName;

                    // If the event target is not the color picker, the color picker is not an ancestor of the event target and the event target is not a scrollbar
                    if (eventTarget != colorPickerViewer && !_private.isAncestor(eventTarget, colorPickerViewer) && tagName && tagName.toLowerCase() != "scrollbar") {
                        // place viewer
                        var size = _private.gridSize * 8;
                        var w = window.innerWidth - size - 24;
                        var h = window.innerHeight - size - 24;
                        if (event.clientX < w) {
                            colorPickerViewer.css("left", (event.clientX + 4) + "px");
                        } else {
                            colorPickerViewer.css("left", (event.clientX - size - 4) + "px");
                        }
                        if (event.clientY < h) {
                            colorPickerViewer.css("top", (event.clientY + 4) + "px");
                        } else {
                            colorPickerViewer.css("top", (event.clientY - size - 4) + "px");
                        }

                    }
                };

                if (_private.showToolbar && _private.colorDiv && _private.colorTxt) {
                    _private.colorDiv.setAttribute("style", "background-color:" + color + ";");
                    _private.colorTxt.innerHTML = color;
                }

                if (!_private.showMagnifier || !ColorPicker.colorPickerViewer) return;
                var deep = (_private.gridSize - 1) / 2;
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
            var X = e.pageX + x;
            var Y = e.pageY + y;

            if (X < 0 || Y < 0 || X >= _private.width || Y >= _private.height) {
                return 'indigo';
            } else {
                var canvasIndex = (X + Y * _private.canvas.width) * 4;
                ////console.log(e.pageX + ' ' + e.pageY + ' ' + _private.canvas.width);

                var rgb = {
                    r: _private.canvasData[canvasIndex],
                    g: _private.canvasData[canvasIndex + 1],
                    b: _private.canvasData[canvasIndex + 2],
                    //alpha: _private.canvasData[canvasIndex+3]
                };

                var color = '#' + _private.toHex(rgb.r, 2) + _private.toHex(rgb.g, 2) + _private.toHex(rgb.b, 2);
                return color;
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
                _private.getColor(event, "selected", _private.reqColor).done(function() {
                    if(_private.showToolbar) {
                        if(_private.reqColor) {
                        $('.Sample').css(
                            (_private.reqColor==='foreground')?'color':'background-color',
                            _private.colorTxt.innerHTML);
                        }
                    }
                });

                var c1 = $('.Sample').css('color');
                var c2 = $('.Sample').css('background-color');
                _private.contrast(c1, c2).done(_private.showContrast);

                event.stopPropagation();
                event.preventDefault();
            }
        },

        RightClick: function(event) {
            _private.getColor(event, "selected", 'foreground').done(function() {
                if(_private.showToolbar) {
                    $Sample = $('.Sample');
                    $Sample.css('color', _private.colorTxt.innerHTML);
                }
            });

            var c1 = $('.Sample').css('color');
            var c2 = $('.Sample').css('background-color');
            _private.contrast(c1, c2).done(_private.showContrast);

            event.stopPropagation();
            event.preventDefault();
        },

        showContrast: function (c) {
            //console.log(c);
            $("#contrast").html(parseFloat(c).toFixed(2) + ":1");

            if(c>4.5) {
                $('.fail').removeClass('show').addClass('hide');
                $('.ok').removeClass('hide').addClass('show');
            } else if(c>3.0) {
                $('.fail.large').removeClass('show').addClass('hide');
                $('.ok.large').removeClass('hide').addClass('show');
                $('.fail.small').removeClass('hide').addClass('show');
                $('.ok.small').removeClass('hide').addClass('show');
            } else {
                $('.fail').removeClass('hide').addClass('show');
                $('.ok').removeClass('show').addClass('hide');
            }

        },

        MouseMove: function(event) {
                _private.getColor(event, "hover", null);
                event.stopPropagation();
                event.preventDefault();
        },

        addMouseSupport: function() {
            $ColorPickerOvr = $('#ColorPickerOvr');
            $ColorPickerOvr.bind("click", _private.Click);
            $ColorPickerOvr.bind("contextmenu",_private.RightClick);
            $ColorPickerOvr.bind("mousemove", _private.MouseMove);
            $(window).bind('scrollstop', _private.onScrollStop);
            $(window).bind('resize', _private.onWindowResize);
            $(_public.colorPickerViewer).css('display', 'inherit');
        },

        removeMouseSupport: function() {
            $ColorPickerOvr = $('#ColorPickerOvr');
            $ColorPickerOvr.unbind("click", _private.Click);
            $ColorPickerOvr.unbind("contextmenu",_private.RightClick);
            $ColorPickerOvr.unbind("mousemove", _private.MouseMove);
            $(window).unbind('scrollstop', _private.onScrollStop);
            $(window).unbind('resize', _private.onWindowResize);
            $(_public.colorPickerViewer).css('display', 'none');
        },

        init: function(contentDocument) {

            if(!contentDocument.getElementById("colorPickerCss")) {
                var colorPickerCss = '<link id="colorPickerCss" rel="stylesheet" type="text/css" href="' + chrome.extension.getURL('ColorPicker.css') + '" />';
                if ($("head").length == 0) {
                    $("body").before(colorPickerCss);
                } else {
                    $("head").append(colorPickerCss);
                }

                var dropitCss = '<link id="dropitrCss" rel="stylesheet" type="text/css" href="' + chrome.extension.getURL('dropit.css') + '" />';
                if ($("head").length == 0) {
                    $("body").before(dropitCss);
                } else {
                    $("head").append(dropitCss);
                }
            }

            $("body").append('<div id="ColorPickerLdr"></div>');
            $("#ColorPickerLdr").append('<div id="ColorPickerOvr" style="cursor: url(' + chrome.extension.getURL("Images/Cursors/pickColor.cur") + '), crosshair !important;"></div>');
            
            _private.removeMouseSupport();
            _private.addMouseSupport();

            _private.retrieveGlass().then(function() {
                if (!contentDocument.getElementById("colorPickerViewer")) {
                    ColorPicker.colorPickerViewer = contentDocument.createElement("Div");
                    ColorPicker.colorPickerViewer.setAttribute("id", "colorPickerViewer");

                    var t = contentDocument.createElement("Table");
                    t.setAttribute("cellspacing", 1);
                    ColorPicker.colorPickerViewer.appendChild(t);

                    _public.dotArray = Array();
                    var deep = (_private.gridSize - 1) / 2;
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

                    //var d = contentDocument.createElement("div");
                    var glass = contentDocument.createElement("img");

                    glass.setAttribute("alt", "");
                    glass.setAttribute("width", "100%");
                    glass.setAttribute("height", "100%");
                    glass.setAttribute("style", "position:absolute; top:0; left:0;"); //_private.gridSize*8+"px");


                    //console.log(a['magnifierGlass']);
                    glass.setAttribute("src", _private.imageUrl);
                    //d.appendChild(glass);

                    ColorPicker.colorPickerViewer.appendChild(glass);

                    $('#ColorPickerOvr').append(ColorPicker.colorPickerViewer);

                    $('#colorPickerViewer').css('border-radius', deep * 8 + 6);
                }
                _private.showMagnifier = true;
            });

            _private.retrieveToolbar().then(function() {
                if (!contentDocument.getElementById("colorPickerToolbar")) {
                    _private.colorPickerToolbar = contentDocument.createElement("Div");
                    _private.colorPickerToolbar.setAttribute("id", "colorPickerToolbar");
                    $('#ColorPickerOvr').append(_private.colorPickerToolbar);
                    chrome.storage.sync.get(['position'], function(a) {
                        if(a['position']) {
                            _private.setToolbarPosition(a['position']);
                        }
                        else {
                            _private.setToolbarPosition({up:true, left:true});
                        }
                    });

                    _private.colorDiv = contentDocument.createElement("Div");
                    _private.colorDiv.setAttribute("id", "colorDiv");
                    _private.colorPickerToolbar.appendChild(_private.colorDiv);

                    _private.colorTxt = contentDocument.createElement("Span");
                    _private.colorTxt.setAttribute("id", "colorTxt");
                    _private.colorPickerToolbar.appendChild(_private.colorTxt);

                    $('#colorPickerToolbar').append('<Span id="smallSample" class="Sample smallSample" title="Min required: 4.5:1">Small Text</Span>');
                    
                    $('#colorPickerToolbar').append('<img src='+chrome.extension.getURL("Images/Ok.png")+' class="ok small checkmark hide" alt="Pass AA" title="Pass AA">');
                    $('#colorPickerToolbar').append('<img src='+chrome.extension.getURL("Images/NotOk.png")+' class="fail small checkmark hide" alt="Failled AA" title="Failled AA">');
                    
                    $('#colorPickerToolbar').append('<Span id="lasegrSample" class="Sample largeSample" title="Min required: 3.0:1">Large Text</Span>');
                    
                    $('#colorPickerToolbar').append('<img src='+chrome.extension.getURL("Images/Ok.png")+' class="ok large checkmark hide" alt="Pass AA" title="Pass AA">');
                    $('#colorPickerToolbar').append('<img src='+chrome.extension.getURL("Images/NotOk.png")+' class="fail large checkmark hide" alt="Failled AA" title="Failled AA">');
                    
                    $('#colorPickerToolbar').append('<Span id="contrast" class="Contrast">4.50:1</Span>');

                    $('#colorPickerToolbar').append('<div style="display: inline-block;">'+
                        '<ul id="menu1" class="menu dropit"></ul></div>');
                    $('#menu1').append('<li class="dropit-trigger"><a class="btn">'+
                        '<img src='+chrome.extension.getURL("Images/menu.png")+'></img>'+
                        '</a></li>');
                    $('.dropit-trigger').append('<ul class="dropit-submenu" style="display: none;"></ul>');
                    $('.dropit-submenu').append('<li><a id="CopyFr">Copy Foreground</a></li>');
                    $('.dropit-submenu').append('<li><a id="CopyBg">Copy Background</a></li>');
                    $('.dropit-submenu').append('<li><hr style="margin: 2px;"/></li>');
                    $('.dropit-submenu').append('<li><a id="UpLeft">Up-Left</a></li>');
                    $('.dropit-submenu').append('<li><a id="UpRight">Up-Right</a></li>');
                    // $('.dropit-submenu').append('<li><a id="DownRight">Down-Right</a></li>');
                    // $('.dropit-submenu').append('<li><a id="DownLeft">Down-Left</a></li>');

                    $('#colorPickerToolbar').append('<input id="CopyBox" type="text" style="display: none; position: absolute;overflow-x: hidden;"></input>');
                    

                    $('#CopyFr').click(function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                        alert('Foreground color "'+_private.colorToClipboard('color')+'" copyed to clipboard');
                    });

                    $('#CopyBg').click(function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                        alert('Background color "'+_private.colorToClipboard('background-color')+'" copyed to clipboard');
                    });

                    $('#menu1').dropit({
                        beforeShow: _private.removeMouseSupport,
                        afterHide: _private.addMouseSupport
                    });

                    $('#colorPickerToolbar').on('mouseenter', _private.removeMouseSupport).on('mouseleave', _private.addMouseSupport);
                };

                $('#UpLeft').click(function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    pos = {up:true, left:true};
                    chrome.storage.sync.set({
                        'position': pos
                    });
                    _private.setToolbarPosition(pos);
                });

                $('#UpRight').click(function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    pos = {up:true, left:false}
                    chrome.storage.sync.set({
                        'position': pos
                    });
                    _private.setToolbarPosition(pos);
                });

                // $('#DownRight').click(function(e) {
                //     e.stopPropagation();
                //     e.preventDefault();
                //     // pos = {up:false, left:false}
                //     // chrome.storage.sync.set({
                //     //     'position': pos
                //     // });
                //     // _private.setToolbarPosition(pos);
                // });

                // $('#DownLeft').click(function(e) {
                //     e.stopPropagation();
                //     e.preventDefault();
                //     // pos = {up:false, left:true}
                //     // chrome.storage.sync.set({
                //     //     'position': pos
                //     // });
                //     // _private.setToolbarPosition(pos);
                // });

                _private.sendMessage({type: 'get-colors'});
                _private.showToolbar = true;
            });

            chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
                switch (req.type) {
                    case 'update-image':
                        _private.capture(req.data);
                        break;
                    case 'get-colors':
                        $('.Sample').css('color', req.color).css('background-color', req.bgcolor);
                        _private.reqColor = req.reqcolor;
                        _private.contrast(req.color, req.bgcolor).done(_private.showContrast);
                        break;
                }
            });

            _private.YOffset = $(document).scrollTop();
            _private.XOffset = $(document).scrollLeft();

            _private.screenshot();
        },

        setToolbarPosition: function(pos){
            $toolbar = $('#colorPickerToolbar');

            if(pos.up) 
                $toolbar.removeClass('down').addClass('up');
            else 
                $toolbar.removeClass('up').addClass('down');

            if(pos.left) 
                $toolbar.removeClass('right').addClass('left');
            else 
                $toolbar.removeClass('left').addClass('right');
        },

        contrast: function(color1, color2) {
            var c = null;
            var contrastDfr = $.Deferred();
            chrome.runtime.sendMessage({
                    type: "get-contrast",
                    c1: _private.rgbToColor(color1),
                    c2: _private.rgbToColor(color2)
                },
                function(result) {
                    contrastDfr.resolve(result.contrast);
                    //console.log(result);
                });
            return contrastDfr.promise();
        },
        
        rgbToColor: function(rgbStr) {
            var ctx = document.createElement('canvas').getContext('2d');
            ctx.strokeStyle = rgbStr;
            return ctx.strokeStyle; 
        },

        colorToClipboard: function(what) {
            var color = _private.rgbToColor($('#smallSample').css(what));
            var copyBox = $('#CopyBox')
            copyBox.val(color);
            copyBox.show();
            copyBox.focus();
            copyBox.select();
            document.execCommand("Copy", false, null);
            copyBox.hide();
            return color;
        },

        screenshot: function() {
            _private.screenshotDfr = $.Deferred();
            $("#ColorPickerOvr").hide(400, function() {
                chrome.extension.connect().postMessage({
                    type: 'screenshot'
                });
            });

            return _private.screenshotDfr.promise();
        },

        screenChanged: function(force) {
            //if (!dropperActivated) return;

            //console.log("screen changed");
            _private.YOffset = $(document).scrollTop();
            _private.XOffset = $(document).scrollLeft();

            $ColorPickerLdr = $('#ColorPickerLdr');
            $ColorPickerLdr.css('top', _private.YOffset+'px');
            $ColorPickerLdr.css('left', _private.XOffset+'px');

            var rect = {
                x: _private.XOffset,
                y: _private.YOffset,
                width: _private.screenWidth,
                height: _private.screenHeight
            };

            // don't screenshot if we already have this one
            if (!force && _private.rects.length > 0) {
                for (index in _private.rects) {
                    if (_private.rectInRect(rect, _private.rects[index])) {
                        console.log('already shoted, skipping');
                        return;
                    }
                }
            }

            _private.screenshot();
        },

        onScrollStop: function() {
            //if (!page.dropperActivated) return;

            console.log("Scroll stop");
            _private.screenChanged();
        },

        onWindowResize: function(e) {
            //if (!_private.dropperActivated) return;

            //console.log('window resized');

            // width and height changed so we have to get new one
            _private.width = $(document).width();
            _private.height = $(document).height();
            _private.screenWidth = window.innerWidth;
            _private.screenHeight = window.innerHeight;

            _private.screenChanged();
        },

        capture: function(imageData) {
            _private.imageData = imageData;

            if (_private.canvas.width != (_private.width + _private.canvasBorders) || _private.canvas.height != (_private.height + _private.canvasBorders)) {
                //console.log('creating new canvas');
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
                            //console.log('merging');
                            merged = true;
                            _private.rects[index] = t;
                        }
                    }
                }

                // put rectangle in array
                if (!merged)
                    _private.rects.push(rect);

                _private.canvasContext.drawImage(image, _private.XOffset, _private.YOffset);
                _private.canvasData = _private.canvasContext.getImageData(0, 0, _private.canvas.width, _private.canvas.height).data;

                $("#ColorPickerOvr").show(100, _private.screenshotDfr.resolve);
            }
            if (_private.imageData) {
                image.src = _private.imageData;
            } else {
                console.error('ed: no imageData');
            }
        },

        destroy: function(contentDocument) {
            _private.removeMouseSupport();

            $("#ColorPickerLdr").remove();

            $("#colorPickerCss").remove();
            $("#dropitCss").remove();
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
                _private.removeMouseSupport();
                _private.destroy(contentDocument);
            } catch (err) {
                console.log(err);
            };
        },

        refresh: function() {
            _private.screenChanged();
        },
    }

    return _public;

}();