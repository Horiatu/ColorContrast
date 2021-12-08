var ColorPicker = function() {

    var _private = {
        colorPickerToolbar: null,
        colorDiv: null,
        colorTxt: null,

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
            return (A.x >= B.x && A.y >= B.y && (A.x + A.width) <= (B.x + B.width) && (A.y + A.height) <= (B.y + B.height));
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

                if (t !== false) {
                    A.y = t.a;
                    A.height = length;
                    return A;
                }

                // same y position and same height
            } else if (A.y == B.y && A.height == B.height) {
                t = _private.rectMergeGeneric(A.x, B.x, A.width);

                if (t !== false) {
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

        getAvgColor: function(event, type, reqColor) {
            var getColorDfr = $.Deferred();
            if (!_private.canvasData) {
                getColorDfr.reject();
                return getColorDfr.promise();
            }

            // if(!_private.downZone) {
            //     _private.downZone = {x:event.pageX, y:event.pageY, width:0, height:0};
            // }
            // if(!_private.downPoint) {
            //     _private.downPoint = {x:event.pageX, y:event.pageY};
            // }

            var r = 0;
            var g = 0;
            var b = 0;
            var n = 0;
            for (var x = _private.downZone.x + (_private.downZone.width === 0 ? 0 : 1); x <= _private.downZone.x + _private.downZone.width; x++) {
                for (var y = _private.downZone.y + (_private.downZone.height === 0 ? 0 : 1); y <= _private.downZone.y + _private.downZone.height; y++) {
                    var i = ((x + 1) + (y + 1) * _private.canvas.width) * 4;

                    r += _private.canvasData[i++];
                    g += _private.canvasData[i++];
                    b += _private.canvasData[i];

                    n++;
                }
            }

            r = (r / n).toFixed(0);
            g = (g / n).toFixed(0);
            b = (b / n).toFixed(0);

            var color = '#' + _private.toHex(r) + _private.toHex(g) + _private.toHex(b);

            var c = document.getElementById("zone");
            if (c) {
                var ctx = c.getContext("2d");
                ctx.rect(1, 1, _private.canvas.width, _private.canvas.height);
                ctx.fillStyle = color;
                ctx.fill();
            }

            if (type == "selected") {
                _private.sendMessage({
                    type: 'set-color',
                    color: color,
                    reqColor: reqColor
                });
                if (options.autoCopy) {
                    _private.copyToClipboard(color);
                }
            }

            _private.setSquareColor(color);
            return _private.fillColorPickerViewer(event, getColorDfr);
        },

        getColor: function(event, type, reqColor) {
            color = _private.getPixel(event.pageX, event.pageY, 0, 0);
            if (type == "selected") {
                // ???

                _private.sendMessage({
                    type: 'set-color',
                    color: color,
                    reqColor: reqColor
                });
                _private.copyToClipboard(color);
            }

            _private.setSquareColor(color);

            return _private.fillColorPickerViewer(event);
        },

        fillColorPickerViewer: function(event, getColorDfr) {
            if (!getColorDfr) {
                getColorDfr = $.Deferred();
            }

            var w = 0;
            var h = 0;
            var eventTarget = event.target;
            if (eventTarget) {
                var tagName = eventTarget.tagName;
                if (_private.showMagnifier && $('#colorPickerViewer')) {

                    // If the event target is not the color picker, the color picker is not an ancestor of the event target and the event target is not a scrollbar
                    if (eventTarget != $('#colorPickerViewer') && !_private.isAncestor(eventTarget, $('#colorPickerViewer')) && tagName && tagName.toLowerCase() != "scrollbar") {
                        // place viewer
                        var size = _private.gridSize * 7;
                        w = window.innerWidth - size - 24;
                        h = window.innerHeight - size - 24;
                        if (event.clientX < w) {
                            $('#colorPickerViewer').css("left", (event.pageX + 4) + "px");
                        } else {
                            $('#colorPickerViewer').css("left", (event.pageX - size - 4) + "px");
                        }
                        if (event.pageY < h) {
                            $('#colorPickerViewer').css("top", (event.pageY + 4) + "px");
                        } else {
                            $('#colorPickerViewer').css("top", (event.pageY - size - 4) + "px");
                        }
                    }

                    var deep = (_private.gridSize - 1) / 2;
                    for (i = -deep; i <= deep; i++) {
                        for (j = -deep; j <= deep; j++) {
                            _public.dotArray[i + deep][j + deep]
                                .setAttribute("style", "background-color:" +
                                    _private.getPixel(event.pageX, event.pageY, j, i) + ";");
                        }
                    }

                    if (!_private.downZone) {
                        _private.setMarkerSize(0, 0);
                    } else {
                        var p = _private.downPoint;
                        var m = { x: event.pageX, y: event.pageY };

                        _private.setMarkerSize(p.x - m.x, p.y - m.y);
                    }
                    var c = _private.getPixel(event.pageX, event.pageY, 0, 0);
                    var l = _private.luminance(c);
                    //console.log(c+' '+l);
                    $('.marker').css('border-color', (l > 0.17) ? 'black' : 'white');
                }
                getColorDfr.resolve();
            } else {
                getColorDfr.reject();
            }
            return getColorDfr.promise();
        },

        luminance: function(c) {
            // http://www.w3.org/Graphics/Color/sRGB.html
            var R = ('0x' + c.substring(2, 3)) / 255.0;
            var G = ('0x' + c.substring(3, 5)) / 255.0;
            var B = ('0x' + c.substring(5, 7)) / 255.0;
            R = R <= 0.03928 ? R / 12.92 : Math.pow((R + 0.055) / 1.055, 2.4);
            G = G <= 0.03928 ? G / 12.92 : Math.pow((G + 0.055) / 1.055, 2.4);
            B = B <= 0.03928 ? B / 12.92 : Math.pow((B + 0.055) / 1.055, 2.4);
            var l = (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
            return l;
        },

        setMarkerSize: function(dx, dy) {
            var w = Math.min(Math.abs(dx) + 1, _private.gridSize);
            var h = Math.min(Math.abs(dy) + 1, _private.gridSize);
            var c = 'black';
            $('.marker')
                .css('width', 7 * w + 'px')
                .css('height', 7 * h + 'px')
                .css('margin-left', ((dx < 0 ? Math.max(dx, -_private.gridSize) * 7 : 0) - 1) + 'px')
                .css('margin-top', ((dy < 0 ? Math.max(dy, -_private.gridSize) * 7 : 0) - 4) + 'px');
        },

        setSquareColor: function(color) {
            if (_private.showToolbar && _private.colorDiv && _private.colorTxt) {
                _private.colorDiv.setAttribute("style", "background-color:" + color + ";");
                _private.colorTxt.innerHTML = color !== 'transparent' ? color : '#ffffff';
            }
        },

        toHex: function(c) {
            return (c === undefined) ? '00' : ('00' + parseInt(c).toString(16)).substr(-2);
        },

        getPixel: function(x0, y0, x, y) {
            if (_private.canvasData === null)
                return 'transparent';

            var X = x0 + x + 1;
            var Y = y0 + y + 1;

            if (X < 0 || Y < 0 || X >= _private.width || Y >= _private.height) {
                return 'indigo';
            } else {
                var i = (X + Y * _private.canvas.width) * 4;

                var r = _private.canvasData[i++];
                var g = _private.canvasData[i++];
                var b = _private.canvasData[i];
                //var alpha = _private.canvasData[i+1];

                var color = '#' + _private.toHex(r) + _private.toHex(g) + _private.toHex(b);
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

        RightClick: function(event) {
            event.stopPropagation();
            event.preventDefault();
            return;
        },

        setColor: function(req, color) {
            $Sample = $('.Sample');
            if (req === 'foreground') {
                $Sample.parent().css('color', color);
                $Sample.css('color', color);
                chrome.storage.sync.set({ "foreground": color });
            } else {
                $Sample.parent().css('background-color', color);
                $Sample.css('background-color', color);
                chrome.storage.sync.set({ "background": color });
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

        showContrast: function(c) {
            //console.log(c);
            $("#contrast").html(parseFloat(c).toFixed(2) + ":1");

            if (c < 3.0) {
                $('.fail').removeClass('hide').addClass('show');
                $('.SoSo').removeClass('show').addClass('hide');
                $('.ok').removeClass('show').addClass('hide');
            } else if (c <= 4.5) {
                $('.small.fail').removeClass('hide').addClass('show');
                $('.small.SoSo').removeClass('show').addClass('hide');
                $('.small.ok').removeClass('show').addClass('hide');

                $('.large.fail').removeClass('show').addClass('hide');
                $('.large.SoSo').removeClass('hide').addClass('show');
                $('.large.ok').removeClass('show').addClass('hide');
            } else if (c <= 7.0) {
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

        isMouseDown: false,
        downZone: null,
        downPoint: null,

        MouseDown: function(event) {
            if (event.button != 2 || options.clickType) {
                _private.downPoint = { x: event.pageX, y: event.pageY };
                _private.downZone = { x: event.pageX, y: event.pageY, width: 0, height: 0 };
                $('#ColorPickerOvr').append('<canvas id="zone" style="position:absolute; border:1px solid red; display:none;"></canvas>');
                _private.isMouseDown = true;
            }
        },

        MouseUp: function(event) {
            var reqColor = (event.button != 2) ? _private.reqColor : 'foreground';
            _private.getAvgColor(event, 'selected', reqColor).done(function() {
                if (_private.showToolbar) {
                    if (_private.reqColor) {
                        var color = _private.colorTxt.innerHTML;

                        var colors = _private.setColor(reqColor, color);

                        _private.contrast(colors.foreground, colors.background).done(_private.showContrast);
                        _private.setSampleColors(colors);
                    }
                }
            });
            _private.isMouseDown = false;
            $('#zone').remove();
            _private.downPoint = null;
            _private.downZone = null;
        },

        MouseMove: function(event) {
            if (_private.isMouseDown) {
                _private.downZone.x = _private.downPoint.x - 1;
                _private.downZone.width = event.pageX - _private.downZone.x;
                if (_private.downZone.width <= 0) {
                    _private.downZone.width = -_private.downZone.width + 2;
                    _private.downZone.x = _private.downPoint.x - _private.downZone.width;
                }

                _private.downZone.y = _private.downPoint.y - 1;
                _private.downZone.height = event.pageY - _private.downZone.y;
                if (_private.downZone.height <= 0) {
                    _private.downZone.height = -_private.downZone.height + 2;
                    _private.downZone.y = _private.downPoint.y - _private.downZone.height;
                }

                $('#zone')
                    .css('left', (_private.downZone.x - _private.XOffset) + 'px')
                    .css('top', (_private.downZone.y - _private.YOffset) + 'px')
                    .css('width', _private.downZone.width + 'px')
                    .css('height', _private.downZone.height + 'px')
                    .css('display', '');

                var color = _private.getAvgColor(event, 'hover', _private.reqColor);
            } else {
                _private.getColor(event, "hover", null);
            }
            event.stopPropagation();
            event.preventDefault();
        },

        addMouseSupport: function() {
            $ColorPickerOvr = $('#ColorPickerOvr');
            //$ColorPickerOvr.bind("click", _private.PageClick);
            if (options.clickType) {
                $ColorPickerOvr.bind("contextmenu", _private.RightClick);
            }
            $ColorPickerOvr.bind("mousedown", _private.MouseDown);
            $ColorPickerOvr.bind("mouseup", _private.MouseUp);
            $ColorPickerOvr.bind("mousemove", _private.MouseMove);
            $(window).bind('scrollstop', _private.onScrollStop);
            $(window).bind('resize', _private.onWindowResize);
            $('#colorPickerViewer').css('display', 'inherit');
        },

        removeMouseSupport: function() {
            $ColorPickerOvr = $('#ColorPickerOvr');
            //$ColorPickerOvr.unbind("click", _private.PageClick);
            try {
                if (options.clickType) {
                    $ColorPickerOvr.unbind("contextmenu", _private.RightClick);
                }
            } catch (e) { /* options is not defined */ }
            $ColorPickerOvr.unbind("mousedown", _private.MouseDown);
            $ColorPickerOvr.unbind("mouseup", _private.MouseUp);
            $ColorPickerOvr.unbind("mousemove", _private.MouseMove);
            $(window).unbind('scrollstop', _private.onScrollStop);
            $(window).unbind('resize', _private.onWindowResize);
            $('#colorPickerViewer').css('display', 'none');
        },

        injectCss: function(contentDocument) {
            if (!contentDocument.getElementById("colorPickerCss")) {
                _private._injectCss('<link id="colorPickerCss" rel="stylesheet" type="text/css" href="' + chrome.extension.getURL('/inc/css/ColorPicker.css') + '" />');
            }

            if (!contentDocument.getElementById("dropitCss")) {
                _private._injectCss('<link id="dropitCss" rel="stylesheet" type="text/css" href="' + chrome.extension.getURL('/inc/css/dropit.css') + '" />');
            }
        },

        _injectCss: function(css) {
            if ($("head").length === 0) {
                $("body").before(css);
            } else {
                $("head").append(css);
            }
        },

        addToContrastEffect: function(i) {
            var s = $(document.getElementById("contrastEffect"));
            var n = 100 + i;
            if (!s.length) {
                _private._injectCss('<style id="contrastEffect" class="effectPercent">.ContrastVision {-webkit-filter: contrast(' + n + '%);filter: contrast(' + n + '%);}</style>');
            } else {
                var c = s.html();
                c = c.replace(/(?:contrast\((\d+)\%\);)/g, function(str, val) {
                    n = Number(val);
                    if (n + i >= 10) n += i;
                    return 'contrast(' + n + '%);';
                });
                s.html(c);
            }
            v = n != 100 ? (n + '%') : '';
            $('#ContrastPercent').html(v).attr('title', v);
        },

        addToBlurEffect: function(i) {
            var s = $(document.getElementById("blurEffect"));
            var n = i;
            if (!s.length) {
                _private._injectCss('<style id="blurEffect" class="effectPercent">.BlurVision {-webkit-filter: blur(' + n + 'px);filter: blur(' + n + 'px);}</style>');
            } else {
                var c = s.html();
                c = c.replace(/(?:blur\((\d+)px\);)/g, function(str, val) {
                    n = Number(val);
                    if (n + i >= 0 && n + i <= 3) n += i;
                    return 'blur(' + n + 'px);';
                });
                s.html(c);
            }
            v = n !== 0 ? (n) : '';
            $('#BlurPx').html(v).attr('title', v);
        },

        addToLighterEffect: function(i) {
            var s = $(document.getElementById("lighterEffect"));
            var n = 100 + i;
            if (!s.length) {
                _private._injectCss('<style id="lighterEffect" class="effectPercent">.LighterVision {-webkit-filter: brightness(' + n + '%);filter: brightness(' + n + '%);}</style>');
            } else {
                var c = s.html();
                c = c.replace(/(?:brightness\((\d+)\%\);)/g, function(str, val) {
                    n = Number(val);
                    if (n + i >= 20) n += i;
                    return 'brightness(' + n + '%);';
                });
                s.html(c);
            }
            v = n != 100 ? (n + '%') : '';
            $('#LighterPercent').html(v).attr('title', v);
        },

        addFilters: function(e) {
            if (!document.getElementById("svgFilters")) {
                var s =
                    "<svg id='svgFilters' xmlns='http://www.w3.org/2000/svg' style='display:none'>\n" +
                    "    <filter id='protanopia'>\n" +
                    "        <feColorMatrix type='matrix' values='0.56667 0.43333 0.00000 0 0 0.55833 0.44167 0.00000 0 0 0.00000 0.24167 0.75833 0 0 0 0 0 1 0'/>\n" +
                    "    </filter>\n" +
                    "    <filter id='protanomaly'>\n" +
                    "        <feColorMatrix type='matrix' values='0.817 0.183 0 0 0 0.333 0.667 0 0 0 0 0.125 0.875 0 0 0 0 0 1 0'/>\n" +
                    "    </filter>\n" +
                    "    <filter id='deuteranopia'>\n" +
                    "        <feColorMatrix type='matrix' values='0.4251 0.6934 -0.1147 0 0 0.3417 0.5882 0.0692 0 0 -0.0105 0.0234 0.9870 0 0 0 0 0 1 0'/>\n" +
                    "    </filter>\n" +
                    "    <filter id='deuteranomaly'>\n" +
                    "        <feColorMatrix type='matrix' values='0.8 0.2 0 0 0 0.258 0.742 0 0 0 0 0.142 0.858 0 0 0 0 0 1 0'/>\n" +
                    "    </filter>\n" +
                    "    <filter id='tritanopia'>\n" +
                    "        <feColorMatrix type='matrix' values='0.95000 0.05000 0.00000 0 0 0.00000 0.43333 0.56700 0 0 0.00000 0.47500 0.52500 0 0 0 0 0 1 0'/>\n" +
                    "    </filter>\n" +
                    "    <filter id='tritanomaly'>\n" +
                    "        <feColorMatrix type='matrix' values='0.967 0.033 0 0 0 0 0.733 0.267 0 0 0 0.183 0.817 0 0 0 0 0 1 0'/>\n" +
                    "    </filter>\n" +
                    "    <filter id='achromatopsia'>\n" +
                    "        <feColorMatrix type='matrix' values='0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0 0 0 1 0'/>\n" +
                    "    </filter>\n" +
                    "    <filter id='achromatomaly'>\n" +
                    "        <feColorMatrix type='matrix' values='0.618 0.320 0.062 0 0 0.163 0.775 0.062 0 0 0.163 0.320 0.516 0 0 0 0 0 1 0'/>\n" +
                    "    </filter>\n" +
                    "    <filter id='normalFilter'>\n" +
                    "        <feColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0'/>\n" +
                    "    </filter>\n" +
                    "</svg>";

                $("body").append(s);
            }
        },

        init: function(contentDocument) {

            _private.YOffset = $(document).scrollTop();
            _private.XOffset = $(document).scrollLeft();

            var optionsDfr = $.Deferred();
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

            _private.getAllOptionsAsync(optionsDfr).done(function() {

                _private.injectCss(contentDocument);

                if (!contentDocument.getElementById("ColorPickerOvr")) {
                    //$("body").wrapInner("<div id='bodyNew'></div>");
                    $("body").append('<div id="ColorPickerLdr"></div>');
                    $("#ColorPickerLdr").append('<div id="ColorPickerOvr" style="display:none; cursor: url(' + chrome.extension.getURL("images/cursors/pickColor.cur") + '), crosshair !important;"></div>');
                    _private.addFilters('#ColorPickerLdr');
                }
                _private.removeMouseSupport();
                _private.addMouseSupport();

                if (options.magnifierGlass != 'none') {
                    if (!contentDocument.getElementById('colorPickerViewer')) {
                        _private.gridSize = options.gridSize;
                        _private.eyeType = (options.eyeType === "" || !options.eyeType) ? "NormalVision" : options.eyeType;
                        colorPickerViewer = contentDocument.createElement("Div");
                        colorPickerViewer.setAttribute("id", "colorPickerViewer");
                        colorPickerViewer.setAttribute("style", "display:none;");

                        var t = contentDocument.createElement("Table");
                        // t.setAttribute("cellspacing", 1);
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
                                if (i === 0 && j === 0) {
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
                                '<img alt="" width="100%" height="100%" style="width:100%; height:100%; position:absolute; top:0; left:0;" ' +
                                'src="' + chrome.extension.getURL('images/' + options.magnifierGlass + '.png') + '"></img>')
                            .css('border-radius', '100%');
                    }

                    _private.showMagnifier = true;
                }

                if (options.toolbar) {
                    if (!contentDocument.getElementById("colorPickerToolbar")) {
                        $('#ColorPickerOvr').append('<div id="colorPickerToolbar"></div>');
                        $('#colorPickerToolbar').load(chrome.extension.getURL("/inc/html/ToolBar.html"), function() {
                            $('img.ok').attr('src', chrome.extension.getURL("/images/Ok.png"));
                            $('img.SoSo').attr('src', chrome.extension.getURL("/images/SoSo.png"));
                            $('img.fail').attr('src', chrome.extension.getURL("/images/NotOk.png"));
                            $('#menu1 img').attr('src', chrome.extension.getURL("/images/menu.png"));
                            $('#menu1 img.yes').attr('src', chrome.extension.getURL("/images/yes.png"));

                            _private.colorTxt = contentDocument.getElementById("colorTxt");
                            _private.colorDiv = contentDocument.getElementById("colorDiv");

                            $('#CopyFr').on("click", function(e) {
                                _private.foregroundToClipboard();
                            });

                            $('#CopyBg').on("click", function(e) {
                                _private.backgroundToClipboard();
                            });

                            $('#ShowSample').on("click", function() {
                                _private.ShowContrastSample(false);
                            });

                            $('#ToggleColors').on("click", function(e) {
                                _private.toggleColors();
                            });

                            $('#RefreshColorPicker').on("click", function(e) {
                                _public.refresh();
                            });

                            $('#ExitColorPicker').on("click", function(e) {
                                _public.Hide();
                            });

                            $('#mNormalVision').on("click", function(e) {
                                _private.normalVision();
                                _private.setEyeType('NormalVision');
                                $(".effectPercent").remove();
                                $('.menuPercent').html('');
                                e.stopPropagation();
                                e.preventDefault();
                            });

                            $('#menu1').dropit({
                                beforeShow: function() {
                                    $('#eye-menu li ul li a img').hide();
                                    $('#effects-menu li ul li a img').hide();
                                    $('#mNormalVision img').hide();
                                    $('#' + _private.eyeType + ' img').show();
                                    if (_private.eyeType == 'NormalVision')
                                        $('#mNormalVision img').show();
                                },
                                afterShow: function() {
                                    $('#eye-menu').hide();
                                    $('#effects-menu').hide();
                                }
                            });

                            var yesSrc = chrome.extension.getURL("images/Yes.png");

                            $('#eye-menu li a img').attr('src', chrome.extension.getURL('images/DisabledEye.png'));
                            $('img.toLeft').attr('src', chrome.extension.getURL('images/ToLeft.png'));
                            $('#eye-menu .yes').attr('src', yesSrc).hide();

                            $('#eye-menu li ul li a').on("click", _private.menuLeftClick);

                            $('#effects-menu li a img').attr('src', chrome.extension.getURL('images/Effects.png'));
                            $('#effects-menu .yes').attr('src', yesSrc).hide();
                            $('.effect').attr('title', 'Or, use the mouse wheel');

                            $('.effect span').hide();
                            $('.shortcut, .menuPercent, .yes').attr('disabled', true);

                            $('.effect').mouseenter(function() {
                                $(this).bind("contextmenu", _private.effectRightClick);
                            }).mouseleave(function() {
                                $(this).unbind("contextmenu", _private.effectRightClick);
                            });

                            $('#effects-menu li ul li a').on("click", _private.menuLeftClick);

                            $('#ChallengedVisions').on("click", function(e) {
                                $('#eye-menu').toggle();
                                $('#effects-menu').hide();
                                e.preventDefault();
                                e.stopPropagation();
                            });

                            $('#Effects').on("click", function(e) {
                                $('#effects-menu').toggle();
                                $('#eye-menu').hide();
                                e.preventDefault();
                                e.stopPropagation();
                            });

                            _private.setVisionEffect();


                            $('#colorPickerToolbar').on('mouseenter', _private.removeMouseSupport).on('mouseleave', _private.addMouseSupport);

                            $('#UpLeft').on("click", function(e) {
                                _private.setToolbarPosition({ up: true, left: true }, true);
                            });

                            $('#UpRight').on("click", function(e) {
                                _private.setToolbarPosition(pos = { up: true, left: false }, true);
                            });

                            _private.setToolbarPosition(options.position, false);

                            _private.showToolbar = true;
                        });
                    }
                }

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
                                _private.colorTxt.innerHTML = req.color !== 'transparent' ? req.color : '#ffffff';

                                if (options.sample) _private.ShowContrastSample(true);
                            });
                            break;
                    }
                });

                //chrome.extension.tabs.update({ active: true });

                _private.screenshot().done(function() {
                    $('#ColorPickerOvr').show(function() {

                        _private.YOffset = $(document).scrollTop();
                        _private.XOffset = $(document).scrollLeft();

                        $ColorPickerLdr = $('#ColorPickerLdr');
                        $ColorPickerLdr.css('top', _private.YOffset + 'px');
                        $ColorPickerLdr.css('left', _private.XOffset + 'px');

                        if (_private.showToolbar)
                            _private.sendMessage({ type: 'get-colors', reqColor: 'background' });
                        if (_private.showMagnifier)
                            $('#colorPickerViewer').css('display', 'inherit');

                        $(window).unbind('keyup', _private.Shortcuts).unbind("mousewheel", _private.effectMouseWheel);
                        $(window).bind('keyup', _private.Shortcuts).bind("mousewheel", _private.effectMouseWheel);
                    });
                });
            });
        },

        foregroundToClipboard: function() {
            alert('Foreground color "' + _private.colorToClipboard('color') + '" copyed to clipboard');
        },
        backgroundToClipboard: function() {
            alert('Background color "' + _private.colorToClipboard('background-color') + '" copyed to clipboard');
        },

        setEyeType: function(name) {
            chrome.storage.sync.set({ 'eyeType': _private.eyeType = options.eyeType = name });
            $('#eye-menu li ul li a img, #effects-menu li ul li a img').hide();
            $('#' + _private.eyeType + ' img').show();

            if (_private.eyeType === 'NormalVision')
                $('#mNormalVision img').show();
            else
                $('#mNormalVision img').hide();

            if ($('#' + name).hasClass('effect'))
                $('#' + name + ' span').show();
        },

        Shortcuts: function(e) {
            switch (e.keyCode) {
                case 27:
                    _public.Hide(document);
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                case 78: // N - Normal Vision
                    _private.normalVision();
                    _private.setEyeType('NormalVision');
                    $(".effectPercent").remove();
                    $('.menuPercent').html('');

                    e.stopPropagation();
                    e.preventDefault();
                    break;
                case 82: // R - Refresh
                    _public.refresh();
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                case 84: // T - Toggle
                    _private.toggleColors();
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                case 83: // S - toggle Sample
                    _private.toggleSample();
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                case 36: // Home - Up Left
                case 103:
                    _private.setToolbarPosition(pos = { up: true, left: true }, true);
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                case 33: // PgUp - Up Right
                case 105:
                    _private.setToolbarPosition(pos = { up: true, left: false }, true);
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                case 70: // F
                    _private.foregroundToClipboard();
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                case 66: // B
                    _private.backgroundToClipboard();
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                case 107: // +
                case 187:
                    if ($('#meffects-submenu').is(':visible'))
                        _private.addToEffect(_private.eyeType, 1);
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                case 109: // -
                case 189:
                    if ($('#meffects-submenu').is(':visible'))
                        _private.addToEffect(_private.eyeType, -1);
                    e.stopPropagation();
                    e.preventDefault();
                    break;
            }
        },

        ShowContrastSample: function(showAnyway) {
            $colorPickerSample = $('#colorPickerSample');
            if (!$colorPickerSample.length) {
                $('#ColorPickerOvr').prepend("<div id='colorPickerSample'><div class='SampleContent' style='position.Absolute'></div></div>");

                $colorPickerSample = $('#colorPickerSample');
                $SampleContent = $('.SampleContent');
                $colorPickerSample
                    .on('mouseenter', function() {
                        _private.removeMouseSupport();
                        if ($('#colorPickerViewer')) {
                            $('#colorPickerViewer').css('display', 'none');
                        }
                    })
                    .on('mouseleave', function() {
                        if ($('#colorPickerViewer')) {
                            $('#colorPickerViewer').css('display', 'inherit');
                        }
                        _private.addMouseSupport();
                    });
                $SampleContent.load(chrome.extension.getURL("/inc/html/TextSample.html"), function() {
                    $colorPickerSample.append("<div id='PickerSampleclose' class='PickerSampleBtn PickerSampleHover shadowed'><img src='" + chrome.extension.getURL("images/close.png") + "' title='close (image)'></img></div>");
                    $('#PickerSampleclose').on("click", function(e) {
                        $colorPickerSample.hide();
                        chrome.storage.sync.set({ 'sample': false });
                        $('#ShowSample').html("<span class='shortcut'>S</span>&nbsp;Show Sample");
                        e.stopPropagation();
                        e.preventDefault();
                    });

                    $colorPickerSample.append("<div id='PickerSampleToggle' class='PickerSampleBtn PickerSampleHover shadowed'><img src='" + chrome.extension.getURL("images/toggle.png") + "' title='Toggle Colors'></img></div>");
                    $colorPickerSample.on("click", function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                    });

                    $('#PickerSampleToggle').on("click", function(e) {
                        _private.toggleColors();

                        e.stopPropagation();
                        e.preventDefault();
                    });

                });
                $colorPickerSample.hide();
                $('#ShowSample').html("<span class='shortcut'>S</span>Show Sample");
            }

            $colorPickerSample.width($('#colorPickerToolbar').width());
            $colorPickerSample.addClass($('#colorPickerToolbar').hasClass('left') ? 'left' : 'right');

            if (showAnyway) {
                $colorPickerSample.show("slow", function() {
                    _private.setSampleColors();
                    $('#ShowSample').html("<span class='shortcut'>S</span>&nbsp;Hide Sample");

                    _private.setVisionEffect();
                });
            } else {
                _private.toggleSample();
            }
        },

        setVisionEffect: function() {
            _private.normalVision();
            var name = _private.eyeType;
            if (name != 'NormalVision') {
                $('body').addClass(name);

                if ($('#' + name).hasClass('effect'))
                    $('#' + name + ' span').show();
            }

        },

        menuLeftClick: function(e) {
            if (e.button == 2) return;
            var id = e.target.id;
            if ($(e.target).attr('disabled') === 'disabled')
                id = e.target.parentElement.id;
            if (!id) return;

            _private.normalVision();
            _private.setEyeType(id);
            if (id != 'NormalVision') {
                _private.addToEffect(id, 1);
            } else {
                $("#contrastEffect").remove();
                $("#blurEffect").remove();
                $("#lighterEffect").remove();
                $('.menuPercent').html('');
            }

            e.preventDefault();
            e.stopPropagation();
        },

        effectRightClick: function(e) {
            var id = e.target.id;
            if ($(e.target).attr('disabled') === 'disabled')
                id = e.target.parentElement.id;
            if (!id) return;

            _private.normalVision();
            _private.setEyeType(id);
            _private.addToEffect(id, -1);

            e.preventDefault();
            e.stopPropagation();
        },

        addToEffect: function(id, delta) {
            $('body').addClass(id);
            if ($('#' + id).hasClass('effect')) {
                switch (id) {
                    case 'ContrastVision':
                        _private.addToContrastEffect(10 * delta);
                        break;
                    case 'BlurVision':
                        _private.addToBlurEffect(delta);
                        break;
                    case 'LighterVision':
                        _private.addToLighterEffect(10 * delta);
                        break;
                }
            }
        },

        effectMouseWheel: function(e) {
            if ($('#meffects-submenu').is(':visible')) {
                _private.addToEffect(_private.eyeType, e.originalEvent.wheelDelta / 120 > 0 ? 1 : -1);
                e.stopPropagation();
                e.preventDefault();
            }
        },

        toggleSample: function() {
            $colorPickerSample = $('#colorPickerSample');
            if (!$colorPickerSample.is(":visible")) {
                _private.setSampleColors();
            }
            $colorPickerSample.animate({ width: "toggle" },
                function() {
                    chrome.storage.sync.set({ 'sample': $colorPickerSample.is(":visible") });
                    $('#ShowSample').html($colorPickerSample.is(":visible") ?
                        "<span class='shortcut'>S</span>&nbsp;Hide Sample" :
                        "<span class='shortcut'>S</span>&nbsp;Show Sample");
                }
            );
        },

        normalVision: function() {
            // $('#bodyNew, .bodyNew')
            $('body')
                .removeClass('NormalVision') // !
                .removeClass('ContrastVision').removeClass('LighterVision').removeClass('BlurVision')
                .removeClass('BlackAndWhite').removeClass('InvertVision').removeClass('RotateColorsEffect')
                .removeClass('Protanopia').removeClass('Protanomaly')
                .removeClass('Deuteranopia').removeClass('Deuteranomaly')
                .removeClass('Tritanopia').removeClass('Tritanomaly')
                .removeClass('Achromatopsia').removeClass('Achromatomaly');
            $('.effect span').hide();
        },

        toggleColors: function() {
            var colors = _private.getColors();
            _private.setColor('foreground', colors.background);
            colors = _private.setColor('background', colors.foreground);

            //_private.contrast(c2, c1).done(_private.showContrast);
            _private.setSampleColors(colors);
        },

        setSampleColors: function(colors) {
            //$Sample = $('.smallSample').parent();
            if (colors === undefined) colors = _private.getColors();
            // $colorPickerSample = $('.bodyNew');
            $colorPickerSample = $('#colorPickerSample');

            $colorPickerSample.css('color', colors.foreground);
            $colorPickerSample.css('background-color', colors.background);

            //$('#colorPickerSample h1, #colorPickerSample p, #colorPickerSample a').css('color',$Sample.css('color'));
        },

        setToolbarPosition: function(pos, save) {
            if (save) {
                chrome.storage.sync.set({
                    'position': pos
                });
            }
            $('#colorPickerToolbar').addClass('up');
            if (pos.left) {
                $('#colorPickerToolbar').removeClass('right').addClass('left');
                $('#colorPickerSample').removeClass('right').addClass('left');
            } else {
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

        getAllOptionsAsync: function(optionsDfr) {
            if (_private.options) {
                optionsDfr.resolve(_private.options);
            } else {
                chrome.extension.connect().postMessage({ type: 'get-defaults' });
            }
            return optionsDfr.promise();
        },

        rgbToColor: function(rgbStr) {
            var rgb = rgbStr.match(/^rgb(?:a?)\s*\(\s*(\d+)\s*,\s*?(\d+)\s*,\s*(\d+)\s*?(?:\s*,\s*(\d+)\s*)?\)/i);
            return (rgb && rgb.length >= 3) ?
                "#" +
                ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
                ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
                ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) :
                rgbStr;
        },

        colorToClipboard: function(what) {
            var color = _private.rgbToColor($('#smallSample').parent().css(what));
            _private.copyToClipboard(color);
            return color;
        },

        copyToClipboard: function(txt) {
            var copyBox = $('#CopyBox');
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
                chrome.extension.connect().postMessage({ type: 'screenshot' });
            });

            return _private.screenshotDfr.promise();
        },

        screenChanged: function(force) {
            //if (!dropperActivated) return;

            //console.log("screen changed");
            _private.YOffset = $(document).scrollTop();
            _private.XOffset = $(document).scrollLeft();

            $ColorPickerLdr = $('#ColorPickerLdr');
            $ColorPickerLdr.css('top', _private.YOffset + 'px');
            $ColorPickerLdr.css('left', _private.XOffset + 'px');

            var rect = {
                x: _private.XOffset,
                y: _private.YOffset,
                width: _private.screenWidth,
                height: _private.screenHeight
            };

            // don't screenshot if we already have this one
            if (!force && _private.rects.length > 0) {
                for (var index in _private.rects) {
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
                    for (var index in _private.rects) {
                        var t = _private.rectMerge(rect, _private.rects[index]);

                        if (t !== false) {
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
                    _private.screenshotDfr.resolve();
                });
            };
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
            $("#blurEffect").remove();
            $("#lighterEffect").remove();
        },

    };

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
                $(window).unbind('keyup', _private.Shortcuts).unbind("mousewheel", _private.effectMouseWheel);
            } catch (err) {
                console.log(err);
            }
        },

        refresh: function() {
            _private.screenChanged(true);
            _private.normalVision();
            _private.setEyeType('NormalVision');
        },
    };

    return _public;

}();