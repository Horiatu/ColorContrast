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

                var $colorPickerViewer = $("#colorPickerViewer");
                if (_private.showMagnifier && $colorPickerViewer) {

                    var tagName = eventTarget.tagName;

                    // If the event target is not the color picker, the color picker is not an ancestor of the event target and the event target is not a scrollbar
                    if (eventTarget != $colorPickerViewer && !_private.isAncestor(eventTarget, $colorPickerViewer) && tagName && tagName.toLowerCase() != "scrollbar") {
                        // place viewer
                        var size = _private.gridSize * 7;
                        var w = window.innerWidth - size - 24;
                        var h = window.innerHeight - size - 24;
                        if (event.clientX < w) {
                            $colorPickerViewer.css("left", (event.clientX + 4) + "px");
                        } else {
                            $colorPickerViewer.css("left", (event.clientX - size - 4) + "px");
                        }
                        if (event.clientY < h) {
                            $colorPickerViewer.css("top", (event.clientY + 4) + "px");
                        } else {
                            $colorPickerViewer.css("top", (event.clientY - size - 4) + "px");
                        }

                    }
                };

                if (_private.showToolbar && _private.colorDiv && _private.colorTxt) {
                    _private.colorDiv.setAttribute("style", "background-color:" + color + ";");
                    _private.colorTxt.innerHTML = color !=='transparent' ? color : '#ffffff';
                }

                if (_private.showMagnifier && ColorPicker.colorPickerViewer) {
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
                $Sample.css('color', color);
                chrome.storage.sync.set({"foreground": color});
            } else {
                $Sample.parent().css('background-color', color);
                chrome.storage.sync.set({"background": color});
            }

            return _private.getColors();
        },

        getColors: function() {
            $Sample = $('.Sample');
            return {
                foreground: _private.rgbToColor($Sample.css('color')), 
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

        injectCss: function(contentDocument) {
            if(!contentDocument.getElementById("colorPickerCss")) {
                var colorPickerCss = '<link id="colorPickerCss" rel="stylesheet" type="text/css" href="' + chrome.extension.getURL('ColorPicker.css') + '" />';
                if ($("head").length == 0) {
                    $("body").before(colorPickerCss);
                } else {
                    $("head").append(colorPickerCss);
                }
            }

            if(!contentDocument.getElementById("dropitrCss")) {
                var dropitCss = '<link id="dropitrCss" rel="stylesheet" type="text/css" href="' + chrome.extension.getURL('dropit.css') + '" />';
                if ($("head").length == 0) {
                    $("body").before(dropitCss);
                } else {
                    $("head").append(dropitCss);
                }
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
                
                if(!contentDocument.getElementById("ColorPickerLdr")) {
                    $("body").append('<div id="ColorPickerLdr"></div>');
                    $("#ColorPickerLdr").append('<div id="ColorPickerOvr" style="cursor: url(' + chrome.extension.getURL("Images/Cursors/pickColor.cur") + '), crosshair !important;"></div>');
                }
                $('#ColorPickerOvr').hide();

                $(window).bind('keyup', _private.EscShortcut);

                _private.removeMouseSupport();
                _private.addMouseSupport();

                if(options.magnifierGlass != 'none') {
                    if (!contentDocument.getElementById("colorPickerViewer")) {
                        _private.gridSize = options.gridSize;
                        _private.eyeType = options.eyeType;
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
                        glass.setAttribute("style", "position:absolute; top:0; left:0;"); 


                        //console.log(a['magnifierGlass']);
                        glass.setAttribute("src", chrome.extension.getURL("Images/" + options.magnifierGlass + ".png"));
                        //d.appendChild(glass);

                        ColorPicker.colorPickerViewer.appendChild(glass);

                        $('#ColorPickerOvr').append(ColorPicker.colorPickerViewer);

                        $('#colorPickerViewer').css('border-radius', deep * 8 + 6);
                    }
                    _private.showMagnifier = true;
                };

                if(options.toolbar) {
                    if (!contentDocument.getElementById("colorPickerToolbar")) {
                        _private.colorPickerToolbar = contentDocument.createElement("Div");
                        _private.colorPickerToolbar.setAttribute("id", "colorPickerToolbar");
                        $('#ColorPickerOvr').append(_private.colorPickerToolbar);
                        _private.setToolbarPosition(options.position);

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
                        $('#menu1-submenu').append('<li><a id="CopyFr">Copy Foreground</a></li>');
                        $('#menu1-submenu').append('<li><a id="CopyBg">Copy Background</a></li>');
                        $('#menu1-submenu').append('<li><a id="ToggleColors">Toggle Colors</a></li>');
                        $('#menu1-submenu').append('<li><hr/></li>');
                        $('#menu1-submenu').append('<li><a id="UpLeft">Up-Left</a></li>');
                        $('#menu1-submenu').append('<li><a id="UpRight">Up-Right</a></li>');
                        $('#menu1-submenu').append('<li><hr/></li>');
                        $('#menu1-submenu').append('<li><a id="ShowSample">Show Sample</a></li>');
                        $('#menu1-submenu').append('<li><a id="ExitColorPicker">Exit</a></li>');

                        $('#colorPickerToolbar').append('<input id="CopyBox" type="text" style="display: none; position: absolute; overflow-x: hidden; overflow-y: hidden;"></input>');

                        $('#CopyFr').click(function(e) {
                            alert('Foreground color "'+_private.colorToClipboard('color')+'" copyed to clipboard');
                        });

                        $('#CopyBg').click(function(e) {
                            alert('Background color "'+_private.colorToClipboard('background-color')+'" copyed to clipboard');
                        });

                        $('#ShowSample').click(function() {
                            _private.ShowContrastSample(false);
                        });

                        $('#ToggleColors').click(function(e) {
                            _private.toggleColors();
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
                            pos = {up:true, left:true};
                            chrome.storage.sync.set({
                                'position': pos
                            });
                            _private.setToolbarPosition(pos);
                        });

                        $('#UpRight').click(function(e) {
                            pos = {up:true, left:false}
                            chrome.storage.sync.set({
                                'position': pos
                            });
                            _private.setToolbarPosition(pos);
                        });

                        // _private.sendMessage({type: 'get-colors'});
                        _private.showToolbar = true;
                    };
                };

                chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
                    switch (req.type) {
                        case 'update-image':
                            _private.capture(req.data);
                            break;
                        case 'get-colors':
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
                        if(_private.showToolbar)
                            _private.sendMessage({type: 'get-colors'});
                    });
                });
            });
        },

        EscShortcut: function(e) {
            if(e.keyCode == 27) {
                _public.Hide(document);
                e.stopPropagation();
                e.preventDefault();
            };
        },

        ShowContrastSample:function(showAnyway){
            $colorPickerSample = $('#colorPickerSample');
            if (!$colorPickerSample.length) {
               $('#ColorPickerOvr').prepend("<div id='colorPickerSample'></div>");
               $colorPickerSample = $('#colorPickerSample');
               $colorPickerSample
                    .on('mouseenter', function() {
                        $ColorPickerViewer = $('#ColorPickerViewer');
                        if($ColorPickerViewer.length) {
                            $ColorPickerViewer.hide();
                        }
                        _private.removeMouseSupport();
                    })
                    .on('mouseleave', function() {
                        $ColorPickerViewer = $('#ColorPickerViewer');
                        if($ColorPickerViewer.length) {
                            $ColorPickerViewer.show();
                        }
                        _private.addMouseSupport();
                    });
               $colorPickerSample.load(chrome.extension.getURL("TextSample.html"), function() {
                    $colorPickerSample.append("<div id='PickerSampleclose' class='PickerSampleBtn PickerSampleHover shadowed'><img src='"+chrome.extension.getURL("Images/close.png")+"' title='close (image)'></img></div>");
                    $('#PickerSampleclose').click(function(e) {
                        $colorPickerSample.hide();
                        chrome.storage.sync.set({'sample': false});
                        $('#ShowSample').html("Show Sample");
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

                    $colorPickerSample.append("<div id='PickerSampleEye' class='PickerSampleBtn shadowed'>"+
                        //"<img src='"+chrome.extension.getURL("Images/DisabledEye.png")+"' title='Challenged vision'></img>"+
                        "</div>");

                    $('#PickerSampleEye').append('<ul id="eye-menu" class="Menu dropit"></ul>');
                    $('#eye-menu').append('<li id="eye-trigger" class="dropit-trigger"><a>'+
                        '<img src='+chrome.extension.getURL("Images/DisabledEye.png")+' title="Challenged vision"></img>'+
                        '</a></li>');
                    $('#eye-trigger').append('<ul id="eye-submenu" class="dropit-submenu" style="display: none;"></ul>');
                    
                    yesSrc = chrome.extension.getURL("Images/Yes.png");
                    $('#eye-submenu').append('<li><a id="NormalVision"><img src="'+yesSrc+'"></img>&nbsp;Normal Vision</a></li>');
                    $('#eye-submenu').append('<li><a id="Protanopia"><img src="'+yesSrc+'"></img>&nbsp;Protanopia</a></li>');
                    $('#eye-submenu').append('<li><a id="Deuteranopia"><img src="'+yesSrc+'"></img>&nbsp;Deuteranopia</a></li>');
                    $('#eye-submenu').append('<li><a id="Tritanopia"><img src="'+yesSrc+'"></img>&nbsp;Tritanopia</a></li>');
                    
                    $('#eye-menu').dropit({
                        beforeShow: function() {
                            $('#eye-menu li ul li a img').hide();
                            $('#'+_private.eyeType+' img').show();
                        },
                    });
                    $('#eye-menu li ul li a').click(function() { 
                        //console.log($(this).attr('id'));
                        $('#eye-menu li ul li a img').hide();
                        _private.eyeType = $(this).attr('id');
                        $('#'+_private.eyeType + ' img').show();
                        chrome.storage.sync.set({'eyeType':_private.eyeType});
                    });
                });
                $colorPickerSample.hide();
                $('#ShowSample').html("Show Sample");
            }

            $colorPickerSample.width($('#colorPickerToolbar').width());
            $colorPickerSample.addClass($('#colorPickerToolbar').hasClass('left') ? 'left' : 'right');

            if(showAnyway) {
                $colorPickerSample.show("slow", _private.setSampleColors);
                $('#ShowSample').html("Hide Sample");
            } else {
                if(!$colorPickerSample.is(":visible")) 
                {
                    _private.setSampleColors();
                }
                $colorPickerSample.animate({width: "toggle"},
                    function() {
                        chrome.storage.sync.set({'sample': $colorPickerSample.is(":visible")});
                        $('#ShowSample').html($colorPickerSample.is(":visible") ? "Hide Sample" : "Show Sample");
                    }
                 );
            }
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
            if(colors==undefined) colors = _private.getColors();
            $colorPickerSample = $('#colorPickerSample');

            $colorPickerSample.css('color',colors.foreground);
            $colorPickerSample.css('background-color',colors.background);

            //$('#colorPickerSample h1, #colorPickerSample p, #colorPickerSample a').css('color',$Sample.css('color'));
        },

        setToolbarPosition: function(pos){
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
            var ctx = document.createElement('canvas').getContext('2d');
            ctx.strokeStyle = rgbStr;
            return ctx.strokeStyle; 
        },

        colorToClipboard: function(what) {
            var color = _private.rgbToColor($('#smallSample').css(what));
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
                $(window).unbind('keyup', _private.EscShortcut);
            } catch (err) {
                //console.log(err);
            };
        },

        refresh: function() {
            _private.screenChanged();
        },
    }

    return _public;

}();
