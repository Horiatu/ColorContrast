var ColorPicker = function() {

    var _private = {
        colorPickerToolbar: null,
        colorDiv: null,
        colorTxt: null,
        imageData: null,

        width: $(document).width(),
        height: $(document).height(),
        imageData: null,
        canvasBorders: 20,
        canvasData: null,
        dropperActivated: false,
        screenWidth: 0,
        screenHeight: 0,
        options: null,
        YOffset: 0,
        XOffset: 0,

        showMagnifier: false,
        showToolbar: false,

        screenshotDfr: null,

        canvas: document.createElement("canvas"),
        rects: [],

        gridSize: 7,
        reqColor: null,
        eyeType: 'NormalVision',

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

        sendMessage: function(message) {
            chrome.extension.connect().postMessage(message);
        },

        getColor: function(event, type, reqColor) {
            var getColorDfr = $.Deferred();

            var eventTarget = event.target;

            if (eventTarget) {

                color = _private.getPixel(event, 0, 0);
                if (type == "selected") {
                    _private.sendMessage({
                        type: 'set-color',
                        color: color,
                        reqColor: reqColor
                    });
                    _private.copyToClipboard(color);
                };

                if (_private.showMagnifier && $('#colorPickerViewer')) {

                    var tagName = eventTarget.tagName;

                    // If the event target is not the color picker, the color picker is not an ancestor of the event target and the event target is not a scrollbar
                    if (eventTarget != $('#colorPickerViewer') && !_private.isAncestor(eventTarget, $('#colorPickerViewer')) && tagName && tagName.toLowerCase() != "scrollbar") {
                        // place viewer
                        var size = _private.gridSize * 7;
                        var w = window.innerWidth - size - 24;
                        var h = window.innerHeight - size - 24;
                        if (event.clientX < w) {
                            $('#colorPickerViewer').css("left", (event.clientX + 4) + "px");
                        } else {
                            $('#colorPickerViewer').css("left", (event.clientX - size - 4) + "px");
                        }
                        if (event.clientY < h) {
                            $('#colorPickerViewer').css("top", (event.clientY + 4) + "px");
                        } else {
                            $('#colorPickerViewer').css("top", (event.clientY - size - 4) + "px");
                        }

                    }
                };

                if (_private.showToolbar && _private.colorDiv && _private.colorTxt) {
                    _private.colorDiv.setAttribute("style", "background-color:" + color + ";");
                    _private.colorTxt.innerHTML = color !=='transparent' ? color : '#ffffff';
                }

                if (_private.showMagnifier && $('#colorPickerViewer')) {
                    var deep = (_private.gridSize - 1) / 2;
                    for (i = -deep; i <= deep; i++) {
                        for (j = -deep; j <= deep; j++) {
                            ColorPicker.dotArray[i + deep][j + deep].setAttribute("style", "background-color:" + _private.getPixel(event, j, i) + ";");
                        }
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
                //console.log(e.pageX + ' ' + e.pageY + ' ' + _private.canvas.width);

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
                            color = _private.colorTxt.innerHTML;

                            colors = _private.setColor(_private.reqColor, color);

                            _private.contrast(colors.foreground, colors.background).done(_private.showContrast);
                            _private.setSampleColors(colors);
                        }
                    }
                });

                event.stopPropagation();
                event.preventDefault();
            }
        },

        RightClick: function(event) {
            _private.getColor(event, "selected", 'foreground').done(function() {
                if(_private.showToolbar) {
                    colors = _private.setColor('foreground', color);

                    _private.contrast(colors.foreground, colors.background).done(_private.showContrast);
                    _private.setSampleColors(colors);
                }
            });

            event.stopPropagation();
            event.preventDefault();
        },

        setColor: function(req, color) {
            $Sample = $('.Sample');
            if(req==='foreground') {
                $Sample.parent().css('color', color);
                $Sample.css('color', color);
                chrome.storage.sync.set({"foreground": color});
            } else {
                $Sample.parent().css('background-color', color);
                $Sample.css('background-color', color);
                chrome.storage.sync.set({"background": color});
            }

            return _private.getColors();
        },

        getColors: function() {
            $Sample = $('.Sample');
            return {
                foreground: _private.rgbToColor($Sample.parent().css('color')), 
                background: _private.rgbToColor($Sample.parent().css('background-color'))
            };
        },

        showContrast: function (c) {
            //console.log(c);
            $("#contrast").html(parseFloat(c).toFixed(2) + ":1");
    
            if(c<3.0) {
                $('.fail').removeClass('hide').addClass('show');
                $('.SoSo').removeClass('show').addClass('hide');
                $('.ok').removeClass('show').addClass('hide');
            } else if (c<=4.5) {
                $('.small.fail').removeClass('hide').addClass('show');
                $('.small.SoSo').removeClass('show').addClass('hide');
                $('.small.ok').removeClass('show').addClass('hide');

                $('.large.fail').removeClass('show').addClass('hide');
                $('.large.SoSo').removeClass('hide').addClass('show');
                $('.large.ok').removeClass('show').addClass('hide');
            } else if (c<=7.0) {
                $('.small.fail').removeClass('show').addClass('hide');
                $('.small.SoSo').removeClass('hide').addClass('show');
                $('.small.ok').removeClass('show').addClass('hide');

                $('.large.fail').removeClass('show').addClass('hide');
                $('.large.SoSo').removeClass('show').addClass('hide');
                $('.large.ok').removeClass('hide').addClass('show');
            } else {
                $('.fail').removeClass('show').addClass('hide');
                $('.SoSo').removeClass('show').addClass('hide');
                $('.ok').removeClass('hide').addClass('show');
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
            $('#colorPickerViewer').css('display', 'inherit');
        },

        removeMouseSupport: function() {
            $ColorPickerOvr = $('#ColorPickerOvr');
            $ColorPickerOvr.unbind("click", _private.Click);
            $ColorPickerOvr.unbind("contextmenu",_private.RightClick);
            $ColorPickerOvr.unbind("mousemove", _private.MouseMove);
            $(window).unbind('scrollstop', _private.onScrollStop);
            $(window).unbind('resize', _private.onWindowResize);
            $('#colorPickerViewer').css('display', 'none');
        },

        injectCss: function(contentDocument) {
            if(!contentDocument.getElementById("colorPickerCss")) {
                _private._injectCss('<link id="colorPickerCss" rel="stylesheet" type="text/css" href="' + chrome.extension.getURL('ColorPicker.css') + '" />');
            }

            if(!contentDocument.getElementById("dropitrCss")) {
                _private._injectCss('<link id="dropitrCss" rel="stylesheet" type="text/css" href="' + chrome.extension.getURL('dropit.css') + '" />');
            }
        },

        _injectCss : function(css) {
            if ($("head").length == 0) {
                    $("body").before(css);
                } else {
                    $("head").append(css);
                }
        },

        addToContrastEffect : function(i) {
            var s = $(document.getElementById("contrastEffect"));
            n = 100 + i;
            if(!s.length) {
                _private._injectCss('<style id="contrastEffect" class="effectPercent">.ContrastVision {-webkit-filter: contrast('+n+'%);filter: contrast('+n+'%);}</style>');
            } else {
                var c = s.html();
                c = c.replace(/(?:contrast\((\d+)\%\);)/g, function(str, val) { 
                    n = Number(val);
                    if(n + i >= 0) n += i;
                    return 'contrast(' + n + '%);';
                });
                s.html(c);
            }
            $('#ContrastPercent').html(n != 100 ? (n+'%') : '');
        },

        addFilters: function(e) {
            if(!document.getElementById("svgFilters")) {
                var s = 
                    "<svg id='svgFilters' xmlns='http://www.w3.org/2000/svg'>\n"+
                    "    <filter id='protanopia'>\n"+
                    "        <feColorMatrix type='matrix' values='0.56667 0.43333 0.00000 0 0 0.55833 0.44167 0.00000 0 0 0.00000 0.24167 0.75833 0 0 0 0 0 1 0'/>\n"+
                    "    </filter>\n"+
                    "    <filter id='protanomaly'>\n"+
                    "        <feColorMatrix type='matrix' values='0.817 0.183 0 0 0 0.333 0.667 0 0 0 0 0.125 0.875 0 0 0 0 0 1 0'/>\n"+
                    "    </filter>\n"+
                    "    <filter id='deuteranopia'>\n"+
                    "        <feColorMatrix type='matrix' values='0.4251 0.6934 -0.1147 0 0 0.3417 0.5882 0.0692 0 0 -0.0105 0.0234 0.9870 0 0 0 0 0 1 0'/>\n"+
                    "    </filter>\n"+
                    "    <filter id='deuteranomaly'>\n"+
                    "        <feColorMatrix type='matrix' values='0.8 0.2 0 0 0 0.258 0.742 0 0 0 0 0.142 0.858 0 0 0 0 0 1 0'/>\n"+
                    "    </filter>\n"+
                    "    <filter id='tritanopia'>\n"+
                    "        <feColorMatrix type='matrix' values='0.95000 0.05000 0.00000 0 0 0.00000 0.43333 0.56700 0 0 0.00000 0.47500 0.52500 0 0 0 0 0 1 0'/>\n"+
                    "    </filter>\n"+
                    "    <filter id='tritanomaly'>\n"+
                    "        <feColorMatrix type='matrix' values='0.967 0.033 0 0 0 0 0.733 0.267 0 0 0 0.183 0.817 0 0 0 0 0 1 0'/>\n"+
                    "    </filter>\n"+
                    "    <filter id='achromatopsia'>\n"+
                    "        <feColorMatrix type='matrix' values='0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0 0 0 1 0'/>\n"+
                    "    </filter>\n"+
                    "    <filter id='achromatomaly'>\n"+
                    "        <feColorMatrix type='matrix' values='0.618 0.320 0.062 0 0 0.163 0.775 0.062 0 0 0.163 0.320 0.516 0 0 0 0 0 1 0'/>\n"+
                    "    </filter>\n"+
                    "    <filter id='normalFilter'>\n"+
                    "        <feColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0'/>\n"+
                    "    </filter>\n"+
                    "</svg>";

                $("body").append(s);
            }
        },

        init: function(contentDocument) {

            _private.YOffset = $(document).scrollTop();
            _private.XOffset = $(document).scrollLeft();

            optionsDfr = $.Deferred();
            chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
                switch (req.type) {
                    case 'defaults':
                        options = req;
                        optionsDfr.resolve(req);
                        break;
                    case 'error':
                        alert(req.msg);
                        break;
                }
            });

            _private.getOptions(optionsDfr).done(function() {

                _private.injectCss(contentDocument);
                
                if(!contentDocument.getElementById("#ColorPickerOvr")) {
                    //$("body").wrapInner("<div id='bodyNew'></div>");
                    $("body").append('<div id="ColorPickerLdr"></div>');
                    $("#ColorPickerLdr").append('<div id="ColorPickerOvr" style="display:none; cursor: url(' + chrome.extension.getURL("Images/Cursors/pickColor.cur") + '), crosshair !important;"></div>');
                    _private.addFilters('#ColorPickerLdr');
                }
                _private.removeMouseSupport();
                _private.addMouseSupport();

                if(options.magnifierGlass != 'none') {
                    if (!contentDocument.getElementById('colorPickerViewer')) {
                        _private.gridSize = options.gridSize;
                        _private.eyeType = options.eyeType;
                        colorPickerViewer = contentDocument.createElement("Div");
                        colorPickerViewer.setAttribute("id", "colorPickerViewer");
                        colorPickerViewer.setAttribute("style", "display:none;");

                        var t = contentDocument.createElement("Table");
                        t.setAttribute("cellspacing", 1);
                        colorPickerViewer.appendChild(t);

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

                        $('#ColorPickerOvr').append(colorPickerViewer);
                        
                        $('#colorPickerViewer')
                            .append(
                                '<img alt="" width="100%" height="100%" style="position:absolute; top:0; left:0;" '+
                                'src="'+chrome.extension.getURL('Images/' + options.magnifierGlass + '.png')+'"></img>')
                            .css('border-radius', '100%');
                    }

                    _private.showMagnifier = true;
                };

                if(options.toolbar) {
                    if (!contentDocument.getElementById("colorPickerToolbar")) {
                        _private.colorPickerToolbar = contentDocument.createElement("Div");
                        _private.colorPickerToolbar.setAttribute("id", "colorPickerToolbar");
                        $('#ColorPickerOvr').append(_private.colorPickerToolbar);
                        _private.setToolbarPosition(options.position, false);

                        table = contentDocument.createElement("Table");
                        _private.colorPickerToolbar.appendChild(table);
                        row = contentDocument.createElement("tr");
                        table.appendChild(row);
                        _private.colorDiv = contentDocument.createElement("td"); row.appendChild(_private.colorDiv);
                        _private.colorDiv.setAttribute("id", "colorDiv");
                        _private.colorDiv.setAttribute("class", "shadowedBlack");

                        td2 = contentDocument.createElement("td"); row.appendChild(td2);
                        td2.setAttribute("style", "width: 70px;");
                        _private.colorTxt = contentDocument.createElement("Span");
                        _private.colorTxt.setAttribute("id", "colorTxt");
                        td2.appendChild(_private.colorTxt);

                        td3 = contentDocument.createElement("td"); row.appendChild(td3); 
                        $(td3).append('<Span id="smallSample" class="Sample smallSample" title="Min required:&#13; AA - 4.5:1&#13; AAA - 7.0:1">Small Text</Span>');
                        
                        $(td3).append('<img src='+chrome.extension.getURL("Images/Ok.png")+' class="ok small checkmark shadowed hide" alt="Pass AAA" title="Pass AAA">');
                        $(td3).append('<img src='+chrome.extension.getURL("Images/SoSo.png")+' class="SoSo small checkmark shadowed hide" alt="Pass AA" title="Pass AA">');
                        $(td3).append('<img src='+chrome.extension.getURL("Images/NotOk.png")+' class="fail small checkmark shadowed hide" alt="Failed AAA" title="Failed AAA">');
                        
                        td4 = contentDocument.createElement("td"); row.appendChild(td4); 
                        $(td4).append('<Span id="lasegrSample" class="Sample largeSample" title="Min required:&#13; AA - 3.0:1&#13; AAA - 4.5:1">Large Text</Span>');
                        
                        $(td4).append('<img src='+chrome.extension.getURL("Images/Ok.png")+' class="ok large checkmark shadowed hide" alt="Pass AAA" title="Pass AAA">');
                        $(td4).append('<img src='+chrome.extension.getURL("Images/SoSo.png")+' class="SoSo large checkmark shadowed hide" alt="Pass AA" title="Pass AA">');
                        $(td4).append('<img src='+chrome.extension.getURL("Images/NotOk.png")+' class="fail large checkmark shadowed hide" alt="Failed AA" title="Failed AA">');
                        
                        td5 = contentDocument.createElement("td"); row.appendChild(td5); 
                        $(td5)
                        .css("border", "1px solid black")
                        .css("min-width", "80px")
                        .css("text-align", "center")
                        .attr("title", "Contrast")
                        .append('<Span id="contrast" class="Contrast">4.50:1</Span>');

                        td6 = contentDocument.createElement("td"); row.appendChild(td6); 
                        $(td6).css('padding','0 1px').append('<ul id="menu1" class="Menu dropit"></ul>');
                        $('#menu1').append('<li id="menu1-trigger" class="dropit-trigger"><a>'+
                            '<img src='+chrome.extension.getURL("Images/menu.png")+' class="shadowedBlack"></img>'+
                            '</a></li>');
                        $('#menu1-trigger').append('<ul id="menu1-submenu" class="dropit-submenu" style="display: none;"></ul>');
                        $('#menu1-submenu').append('<li><a id="CopyFr"><span class="shortcut">F</span>Copy Foreground</a></li>');
                        $('#menu1-submenu').append('<li><a id="CopyBg"><span class="shortcut">B</span>Copy Background</a></li>');
                        $('#menu1-submenu').append('<li><a id="ToggleColors"><span class="shortcut">T</span>Toggle Colors</a></li>');
                        $('#menu1-submenu').append('<li><hr/></li>');
                        $('#menu1-submenu').append('<li><a id="UpLeft"><span class="shortcut">home</span>Up-Left</a></li>');
                        $('#menu1-submenu').append('<li><a id="UpRight"><span class="shortcut">pg-up</span>Up-Right</a></li>');
                        $('#menu1-submenu').append('<li><hr/></li>');
                        $('#menu1-submenu').append('<li><a id="ShowSample"><span class="shortcut">S</span>Show Sample</a></li>');
                        //$('#menu1-submenu').append('<li><a id="ApplyFilter">Challenged Vision</a></li>');
                        $('#menu1-submenu').append('<li><a id="RefreshColorPicker"><span class="shortcut">R</span>Refresh</a></li>');
                        $('#menu1-submenu').append('<li><a id="ExitColorPicker"><span class="shortcut">esc</span>Exit</a></li>');


                        $('#colorPickerToolbar').append('<input id="CopyBox" type="text" style="display: none; position: absolute; overflow-x: hidden; overflow-y: hidden;"></input>');

                        $('#CopyFr').click(function(e) {
                            _private.foregroundToClipboard();
                        });

                        $('#CopyBg').click(function(e) {
                            _private.backgroundToClipboard();
                        });

                        $('#ShowSample').click(function() {
                            _private.ShowContrastSample(false);
                        });

                        $('#ToggleColors').click(function(e) {
                            _private.toggleColors();
                        });

                        $('#RefreshColorPicker').click(function(e) {
                            _public.refresh();
                        });

                        $('#ExitColorPicker').click(function(e) {
                            _public.Hide();
                        });

                        $('#menu1').dropit({
                            beforeShow: _private.removeMouseSupport,
                            afterHide: _private.addMouseSupport
                        });

                        $('#colorPickerToolbar').on('mouseenter', _private.removeMouseSupport).on('mouseleave', _private.addMouseSupport);
 
                        $('#UpLeft').click(function(e) {
                            _private.setToolbarPosition({up:true, left:true}, true);
                        });

                        $('#UpRight').click(function(e) {
                            _private.setToolbarPosition(pos = {up:true, left:false}, true);
                        });

                        _private.showToolbar = true;
                    };
                };

                chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
                    switch (req.type) {
                        case 'update-image':
                            _private.capture(req.data);
                            break;
                        case 'get-colors':
                            $('.Sample').css('color', req.color).css('background-color', req.bgcolor);
                            $('.Sample').parent().css('color', req.color).css('background-color', req.bgcolor);
                            _private.reqColor = req.reqcolor;
                            _private.contrast(req.color, req.bgcolor).done(function(c) {
                                _private.showContrast(c);
                                _private.colorTxt.innerHTML = req.color !=='transparent' ? req.color : '#ffffff';

                                if(options.sample) _private.ShowContrastSample(true);
                            });
                            break;
                    }
                });

                _private.screenshot().done(function() {
                    $('#ColorPickerOvr').show(function() {

                        _private.YOffset = $(document).scrollTop();
                        _private.XOffset = $(document).scrollLeft();

                        $ColorPickerLdr = $('#ColorPickerLdr');
                        $ColorPickerLdr.css('top', _private.YOffset+'px');
                        $ColorPickerLdr.css('left', _private.XOffset+'px');

                        if(_private.showToolbar)
                            _private.sendMessage({type: 'get-colors', reqColor: 'background'});
                        if(_private.showMagnifier)
                            $('#colorPickerViewer').css('display', 'inherit');

                        $(window).bind('keyup', _private.Shortcuts);
                    });
                });
            });
        },

        foregroundToClipboard: function() {
            alert('Foreground color "'+_private.colorToClipboard('color')+'" copyed to clipboard');
        },
        backgroundToClipboard: function() {
            alert('Background color "'+_private.colorToClipboard('background-color')+'" copyed to clipboard');
        },

        setEyeType: function(name) {
            chrome.storage.sync.set({'eyeType': _private.eyeType = options.eyeType = name});
            $('#eye-menu li ul li a img, #effects-menu li ul li a img').hide();
            $('#'+_private.eyeType+' img').show();
        },

        Shortcuts: function(e) {
            switch (e.keyCode) {
                case 27:
                    _public.Hide(document);
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                case 78 : // N - Normal Vision
                    _private.normalVision();
                    _private.setEyeType('NormalVision');
                    $(".effectPercent").remove();
                    $('.menuPercent').html('');

                    e.stopPropagation();
                    e.preventDefault();
                    break;    
                case 82 : // R - Refresh
                    _public.refresh();
                    e.stopPropagation();
                    e.preventDefault();
                    break;    
                case 84 : // T - Toggle
                    _private.toggleColors();
                    e.stopPropagation();
                    e.preventDefault();
                    break;  
                case 83 : // S - toggle Sample
                    _private.toggleSample();
                    e.stopPropagation();
                    e.preventDefault();
                    break; 
                case 36 : // Home - Up Left
                case 103 : 
                    _private.setToolbarPosition(pos = {up:true, left:true}, true);
                    e.stopPropagation();
                    e.preventDefault();
                    break;    
                case 33 : // PgUp - Up Right
                case 105 : 
                    _private.setToolbarPosition(pos = {up:true, left:false}, true);
                    e.stopPropagation();
                    e.preventDefault();
                    break; 
                case 70 : // F
                    _private.foregroundToClipboard();   
                    e.stopPropagation();
                    e.preventDefault();
                    break; 
                case 66 : // B
                    _private.backgroundToClipboard();   
                    e.stopPropagation();
                    e.preventDefault();
                    break; 
            };
        },

        ShowContrastSample:function(showAnyway){
            $colorPickerSample = $('#colorPickerSample');
            if (!$colorPickerSample.length) {
               $('#ColorPickerOvr').prepend("<div id='colorPickerSample'><div class='SampleContent' style='position.Absolute'></div></div>");
               // $('#ColorPickerOvr').prepend("<div id='colorPickerSample'></div>");
               $colorPickerSample = $('#colorPickerSample');
               $SampleContent = $('.SampleContent');
               $colorPickerSample.on('mouseenter', function() {
                        _private.removeMouseSupport();
                        if($('#colorPickerViewer')) {
                            $('#colorPickerViewer').css('display', 'none');
                        }
                    })
                    .on('mouseleave', function() {
                        if($('#colorPickerViewer')) {
                            $('#colorPickerViewer').css('display', 'inherit');
                        }
                        _private.addMouseSupport();
                    });
               $SampleContent.load(chrome.extension.getURL("TextSample.html"), function() {
                    $colorPickerSample.append("<div id='PickerSampleclose' class='PickerSampleBtn PickerSampleHover shadowed'><img src='"+chrome.extension.getURL("Images/close.png")+"' title='close (image)'></img></div>");
                    $('#PickerSampleclose').click(function(e) {
                        $colorPickerSample.hide();
                        chrome.storage.sync.set({'sample': false});
                        $('#ShowSample').html("<span class='shortcut'>S</span>Show Sample");
                        e.stopPropagation();
                        e.preventDefault();
                    });
               
                    $colorPickerSample.append("<div id='PickerSampleToggle' class='PickerSampleBtn PickerSampleHover shadowed'><img src='"+chrome.extension.getURL("Images/toggle.png")+"' title='Toggle Colors'></img></div>");
                    $colorPickerSample.click(function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                    });

                    $('#PickerSampleToggle').click(function(e) {
                        _private.toggleColors();

                        e.stopPropagation();
                        e.preventDefault();
                    });

                    $colorPickerSample.append("<div id='PickerSampleFix' class='PickerSampleBtn PickerSampleHover shadowed'><img src='"+chrome.extension.getURL("Images/FixContrast.png")+"' title='Fix Contrast'></img></div>");
                    $('#PickerSampleFix').click(function(e) {

                        e.stopPropagation();
                        e.preventDefault();
                    });

                    yesSrc = chrome.extension.getURL("Images/Yes.png");

                    $colorPickerSample.append("<div id='PickerSampleEye' class='PickerSampleBtn shadowed'></div>");

                    $('#PickerSampleEye').append('<ul id="eye-menu" class="Menu dropit"></ul>');
                    $('#eye-menu').append('<li id="eye-trigger" class="dropit-trigger"><a>'+
                        '<img src='+chrome.extension.getURL("Images/DisabledEye.png")+' title="Challenged vision"></img>'+
                        '</a></li>');
                    $('#eye-trigger').append('<ul id="eye-submenu" class="dropit-submenu" style="display: none;"></ul>');
                    
                    $('#eye-submenu').append('<li><a id="NormalVision"><img src="'+yesSrc+'"></img><span class="shortcut">N</span>&nbsp;Normal Vision</a></li>');
                    $('#eye-submenu').append('<li><a id="Protanopia"><img src="'+yesSrc+'"></img>&nbsp;Protanopia</a></li>');
                    $('#eye-submenu').append('<li><a id="Protanomaly"><img src="'+yesSrc+'"></img>&nbsp;Protanomaly</a></li>');
                    $('#eye-submenu').append('<li><a id="Deuteranopia"><img src="'+yesSrc+'"></img>&nbsp;Deuteranopia</a></li>');
                    $('#eye-submenu').append('<li><a id="Deuteranomaly"><img src="'+yesSrc+'"></img>&nbsp;Deuteranomaly</a></li>');
                    $('#eye-submenu').append('<li><a id="Tritanopia"><img src="'+yesSrc+'"></img>&nbsp;Tritanopia</a></li>');
                    $('#eye-submenu').append('<li><a id="Tritanomaly"><img src="'+yesSrc+'"></img>&nbsp;Tritanomaly</a></li>');
                    $('#eye-submenu').append('<li><a id="Achromatopsia"><img src="'+yesSrc+'"></img>&nbsp;Achromatopsia</a></li>');
                    $('#eye-submenu').append('<li><a id="Achromatomaly"><img src="'+yesSrc+'"></img>&nbsp;Achromatomaly</a></li>');
                    
                    $colorPickerSample.append("<div id='PickerSampleEffects' class='PickerSampleBtn shadowed'></div>");

                    $('#PickerSampleEffects').append('<ul id="effects-menu" class="Menu dropit"></ul>');
                    $('#effects-menu').append('<li id="effects-trigger" class="dropit-trigger"><a>'+
                        '<img src='+chrome.extension.getURL("Images/Effects.png")+' title="Effects"></img>'+
                        '</a></li>');
                    $('#effects-trigger').append('<ul id="effects-submenu" class="dropit-submenu" style="display: none;"></ul>');
                    
                    $('#effects-submenu').append('<li><a id="BlurVision"><img src="'+yesSrc+'"></img>&nbsp;Blur</a></li>');
                    $('#effects-submenu').append('<li><a id="ContrastVision" class="effect"><img src="'+yesSrc+'"></img>&nbsp;Contrast<span id="ContrastPercent" class="menuPercent"></span></a></li>');
                    // $('#effects-submenu').append('<li><a id="HighContrastVision"><img src="'+yesSrc+'"></img>&nbsp;High Contrast</a></li>');
                    // $('#effects-submenu').append('<li><a id="LowContrastVision"><img src="'+yesSrc+'"></img>&nbsp;Low Contrast</a></li>');
                    $('#effects-submenu').append('<li><a id="LighterEffect"><img src="'+yesSrc+'"></img>&nbsp;Lighter</a></li>');
                    $('#effects-submenu').append('<li><a id="DarkerEffect"><img src="'+yesSrc+'"></img>&nbsp;Darker</a></li>');
                    $('#effects-submenu').append('<li><a id="BlackAndWhite"><img src="'+yesSrc+'"></img>&nbsp;Black And White</a></li>');
                    $('#effects-submenu').append('<li><a id="InvertVision"><img src="'+yesSrc+'"></img>&nbsp;Invert</a></li>');
                    $('#effects-submenu').append('<li><a id="RotateColorsEffect"><img src="'+yesSrc+'"></img>&nbsp;Rotate Colors</a></li>');

                    
                    $('#eye-menu').dropit({
                        beforeShow: function() {
                            $('#eye-menu li ul li a img').hide();
                            $('#'+_private.eyeType+' img').show();
                        },
                    });
                    $('#effects-menu').dropit({
                        beforeShow: function() {
                            $('#effects-menu li ul li a img').hide();
                            $('#'+_private.eyeType+' img').show();
                        },
                    });

                    $('#eye-menu li ul li a, #effects-menu li ul li a').click(function(e) { 
                        if (e.button == 2) return;

                        id = $(this).attr('id');
                        _private.setEyeType(id);
                        _private.normalVision();
                        if(id != 'NormalVision') {
                            $('html').addClass(id);
                            if($(this).hasClass('effect')) {
                                if (id == 'ContrastVision') {
                                    _private.addToContrastEffect(10);
                                }
                            }
                        } else {
                            $("#contrastEffect").remove();
                            $('.menuPercent').html('');
                        }
                    });

                    $('.effect').mouseenter(function() {
                        $(this).bind("contextmenu", _private.effectRightClick);
                    }).mouseleave(function() {
                        $(this).unbind("contextmenu", _private.effectRightClick);
                    });
                });
                $colorPickerSample.hide();
                $('#ShowSample').html("<span class='shortcut'>S</span>Show Sample");
            }

            $colorPickerSample.width($('#colorPickerToolbar').width());
            $colorPickerSample.addClass($('#colorPickerToolbar').hasClass('left') ? 'left' : 'right');

            if(showAnyway) {
                $colorPickerSample.show("slow", function() {
                    _private.setSampleColors();
                    $('#ShowSample').html("<span class='shortcut'>S</span>Hide Sample");

                    _private.normalVision();
                    // $('#bodyNew, .bodyNew').addClass(_private.eyeType);
                    if(_private.eyeType != 'NormalVision')
                        $('html').addClass(_private.eyeType);
                });
            } else {
                _private.toggleSample();
            }
        },

        effectRightClick : function(e) {
            var id = e.toElement.id;
            _private.setEyeType(id);
            _private.normalVision();
            $('html').addClass(id);
            if (id == 'ContrastVision') {
                _private.addToContrastEffect(-10);
            }

            e.preventDefault();
            e.stopPropagation();
        },

        toggleSample : function() {
            $colorPickerSample = $('#colorPickerSample');
            if(!$colorPickerSample.is(":visible")) 
            {
                _private.setSampleColors();
            }
            $colorPickerSample.animate({width: "toggle"},
                function() {
                    chrome.storage.sync.set({'sample': $colorPickerSample.is(":visible")});
                    $('#ShowSample').html($colorPickerSample.is(":visible") 
                        ? "<span class='shortcut'>S</span>Hide Sample" 
                        : "<span class='shortcut'>S</span>Show Sample");
                }
             );        
        },

        normalVision: function() {
            // $('#bodyNew, .bodyNew')
            $('html')
                .removeClass('NormalVision') // !
                .removeClass('ContrastVision')
                .removeClass('BlackAndWhite').removeClass('BlurVision')
                .removeClass('LighterEffect').removeClass('DarkerEffect')
                .removeClass('InvertVision').removeClass('RotateColorsEffect')
                .removeClass('HighContrastVision').removeClass('LowContrastVision')
                .removeClass('Protanopia').removeClass('Protanomaly')
                .removeClass('Deuteranopia').removeClass('Deuteranomaly')
                .removeClass('Tritanopia').removeClass('Tritanomaly')
                .removeClass('Achromatopsia').removeClass('Achromatomaly')
                ;
        },

        toggleColors: function() {
            colors = _private.getColors();
            _private.setColor('foreground', colors.background);
            colors = _private.setColor('background', colors.foreground);

            //_private.contrast(c2, c1).done(_private.showContrast);
            _private.setSampleColors(colors);
        },

        setSampleColors: function(colors) {
            //$Sample = $('.smallSample').parent();
            if(colors == undefined) colors = _private.getColors();
            // $colorPickerSample = $('.bodyNew');
            $colorPickerSample = $('#colorPickerSample');

            $colorPickerSample.css('color',colors.foreground);
            $colorPickerSample.css('background-color',colors.background);

            //$('#colorPickerSample h1, #colorPickerSample p, #colorPickerSample a').css('color',$Sample.css('color'));
        },

        setToolbarPosition: function(pos, save) {
            if(save) {
                chrome.storage.sync.set({
                    'position': pos
                });
            };
            $('#colorPickerToolbar').addClass('up');
            if(pos.left) {
                $('#colorPickerToolbar').removeClass('right').addClass('left');
                $('#colorPickerSample').removeClass('right').addClass('left');
            }
            else {
                $('#colorPickerToolbar').removeClass('left').addClass('right');
                $('#colorPickerSample').removeClass('left').addClass('right');
            }
        },

        contrast: function(color1, color2) {
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

        getOptions: function(optionsDfr) {
            if(_private.options) {
               optionsDfr.resolve(_private.options); 
            } 
            else 
            {
                chrome.extension.connect().postMessage({type: 'get-defaults'});
            };
            return optionsDfr.promise();
        },
        
        rgbToColor: function(rgbStr) {
            rgb = rgbStr.match(/^rgb(?:a?)\s*\(\s*(\d+)\s*,\s*?(\d+)\s*,\s*(\d+)\s*?(?:\s*,\s*(\d+)\s*)?\)/i);
            return (rgb && rgb.length >= 3) 
            ? "#" +
              ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
              ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
              ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) 
            : rgbStr;
        },

        colorToClipboard: function(what) {
            var color = _private.rgbToColor($('#smallSample').parent().css(what));
            _private.copyToClipboard(color)
            return color;
        },

        copyToClipboard: function(txt) {
            var copyBox = $('#CopyBox')
            copyBox.val(txt);
            copyBox.show();
            copyBox.focus();
            copyBox.select();
            document.execCommand("Copy", false, null);
            copyBox.hide();
        },

        screenshot: function() {
            _private.screenshotDfr = $.Deferred();
            $("#ColorPickerOvr").hide(400, function() {
                chrome.extension.connect().postMessage({type: 'screenshot'});
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
                        return;
                    }
                }
            }

            _private.screenshot();
        },

        onScrollStop: function() {
            _private.screenChanged();
        },

        onWindowResize: function(e) {
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
                _private.canvas = document.createElement('canvas');
                _private.canvas.width = _private.width + _private.canvasBorders;
                _private.canvas.height = _private.height + _private.canvasBorders;
                _private.canvasContext = _private.canvas.getContext('2d');
                _private.canvasContext.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);
                _private.rects = [];
            }

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

                $("#ColorPickerOvr").show(100, function() {
                    _private.screenshotDfr.resolve()
                });
            }
            if (_private.imageData) {
                image.src = _private.imageData;
            } else {
                //console.error('ed: no imageData');
            }
        },

        destroy: function(contentDocument) {
            _private.removeMouseSupport();

            $("#ColorPickerLdr").remove();
            $("#svgFilters").remove();
            $('#colorPickerViewer').remove();

            $("#colorPickerCss").remove();
            $("#dropitCss").remove();

            $("#contrastEffect").remove();
        },

    }

    var _public = {
        rdotArray: null,

        Show: function(contentDocument) {
            _private.init(contentDocument);
        },

        Hide: function(contentDocument) {
            try {
                _private.normalVision();
                _private.removeMouseSupport();
                _private.destroy(contentDocument);
                $(window).unbind('keyup', _private.Shortcuts);
            } catch (err) {
                console.log(err);
            };
        },

        refresh: function() {
            _private.normalVision();
            _private.setEyeType('NormalVision');
            _private.screenChanged(true);
        },
    }

    return _public;

}();
