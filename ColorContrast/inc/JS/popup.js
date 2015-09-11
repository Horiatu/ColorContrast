$(document).ready(function() {

    getSelectedTab = function() {
        var dfd = $.Deferred();

        chrome.tabs.query({
            "active": true,
            "currentWindow": true
        }, function(tabs) {
            dfd.resolve(tabs[0]);
        });

        return dfd.promise();
    },

    validateTab = function(tab) {
        var dfd = $.Deferred();
        var url = tab.url;

        if (url.indexOf("chrome://") === 0 || url.indexOf("chrome-extension://") === 0) {
            dfd.reject("Warning: Does not work on internal browser pages.");
        } else if (url.indexOf("https://chrome.google.com/extensions/") === 0 || url.indexOf("https://chrome.google.com/webstore/") === 0) {
            dfd.reject("Warning: Does not work on the Chrome Extension Gallery.");
        } else {
            dfd.resolve();
        }

        return dfd.promise();
    },

    stringToColour = function(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        var colour = '#';
        for (var i = 0; i < 3; i++) {
            var value = (hash >> (i * 8)) & 0xFF;
            colour += ('00' + value.toString(16)).substr(-2);
        }
        return colour;
    },

    fixContrast = function() {
        $fixSamples = $('#fixSamples');
        fixSamplesClear();

        var bgColor=new WebColor($("#background").val().trim());
        var frColor=new WebColor($("#foreground").val().trim());

        if(bgColor.isColor && frColor.isColor && !bgColor.equals(frColor) && frColor.contrastTo(bgColor) < bgColor.target) {
            fixContrastMsg(bgColor, frColor); 
        }
    },

    fixSamplesClear = function() {
        $('#fixSamples').hide();
        $('#fixSamples').html('');
    },

    acceptSample = function(e) {
        $("#foreground").val($(e.toElement).attr('data-color'));
        getContrast();
    },

    addColorTitle = function(id) {
        if(!id) return;
        var $box = $("#"+id);
        var $title = $("#"+id+'Value');
        $title.html('');
        if($box.val()[0] === '#') {
            $title.html(WebColor.hexToColorName($box.val()));
        } else {
            $title.html(WebColor.colorNameToHex($box.val()));
        }
    },

    getContrast = function(id) {
        fixSamplesClear();
        var backgroundVal = $("#background").val().trim();
        var foregroundVal = $("#foreground").val().trim();
        var c1 = new WebColor(backgroundVal);
        var c2 = new WebColor(foregroundVal);
        var backgroundTxt = c1.toHex();
        var foregroundTxt = c2.toHex();
        if (c1.isColor && c2.isColor) {
            $(id ? ("#" + id) : ".txInput").removeClass("error");

            chrome.storage.sync.set({
                'background': backgroundVal
            }, function() {
                //console.log("background "+backgroundVal+' saved');
                addColorTitle('background');
            });
            chrome.storage.sync.set({
                'foreground': foregroundVal
            }, function() {
                //console.log("foreground "+foregroundVal+' saved');
                addColorTitle('foreground');
            });

            $(".example").css("background-color", backgroundTxt);
            $(".example span").css("color", foregroundTxt);

            var cc = c1.contrastTo(c2);

            $("#contrast span").html(parseFloat(cc).toFixed(2) + ":1");

            if (cc >= 7.0) {
                $("#contrast span").css("text-shadow", "2px 2px 2px darkgreen");
                $(".largeAAA").show();
                $(".smallAAA").show();

                $(".largeAA").hide();
                $(".smallAA").hide();

                $(".large").hide();
                $(".small").hide();

                //$('#fixContrast').hide();
            }
            else if (cc >= 4.5) {
                $("#contrast span").css("text-shadow", "2px 2px 2px orange");
                $(".largeAAA").show();
                $(".smallAAA").hide();

                $(".largeAA").hide();
                $(".smallAA").show();

                $(".large").hide();
                $(".small").hide();

                //$('#fixContrast').show();
                fixContrast();
            } else if (cc >= 3.0) {
                $("#contrast span").css("text-shadow", "2px 2px 2px orangered");
                $(".largeAAA").hide();
                $(".smallAAA").hide();

                $(".largeAA").show();
                $(".smallAA").hide();

                $(".large").hide();
                $(".small").show();

                //$('#fixContrast').show();
                fixContrast();
            } else {
                $("#contrast span").css("text-shadow", "2px 2px 2px red");
                $(".largeAAA").hide();
                $(".smallAAA").hide();

                $(".largeAA").hide();
                $(".smallAA").hide();

                $(".large").show();
                $(".small").show();

                //$('#fixContrast').show();
                fixContrast();
            };
        } else {
            if (id) {
                $("#" + id).addClass("error");
            } else {
                $(".txInput").addClass("error");
            }
            $("#contrast span").css("text-shadow", "2px 2px 2px transparent");
        };
    };

    pickAction = function(t) {
        //console.log(t.currentTarget);
        backgroundPage.RequestColor = t.currentTarget.name;
        backgroundPage.Color = $("#foreground").val();
        backgroundPage.BackgroundColor = $("#background").val();
        getSelectedTab().done(
            function(tab) {
                validateTab(tab).always(
                    function(err) {
                        if (err) {
                            alert(err);
                        } else {
                            loadScripts(tab.id, [{
                                allFrames: false,
                                file: true,
                                content: "/inc/js/jquery-2.1.4.min.js"
                            }, {
                                allFrames: false,
                                file: true,
                                content: "/inc/js/dropit.js"
                            }, {
                                allFrames: false,
                                file: true,
                                content: "/inc/js/scrollstop.js"
                            }, {
                                allFrames: false,
                                file: true,
                                content: "/inc/js/ColorPicker.js"
                            }, {
                                allFrames: false,
                                file: false,
                                content: 
                                    "ColorPicker.Hide(document);\n" +
                                    "ColorPicker.Show(document);\n" +
                                    "//ColorPicker.refresh();"
                            }], $.Deferred()).done(
                                function() {
                                    try {
                                        window.close();
                                    } catch (e) {alert(e.message);}
                                });
                        }
                    }
                );
            });
    };

    scriptDesc = function(script) {
        return (
            script.file ? {
                allFrames: script.allFrames,
                "file": script.content
            } : {
                allFrames: script.allFrames,
                "code": script.content
            }
        )
    },

    loadScripts = function(tabid, scripts, dfr) {
        options = scriptDesc(scripts.shift());
        chrome.tabs.executeScript(tabid, options, function() {
            if (scripts.length != 0)
                loadScripts(tabid, scripts, dfr);
            else
                dfr.resolve();
        });
        return dfr.promise();
    }

    copyCode = function(t) {
        //console.log(t.currentTarget.id);
        var o = $(t.currentTarget).closest('tr').find("input");
        var initial = o.val();
        var wc = new WebColor(initial);
        if(wc.isColor)
        {
            o.val(wc.toHex());
            o.focus();
            o.select();
            document.execCommand("Copy", false, null);
            o.val(initial);
        }
    };

    pinCode = function(t) {
        var id = t.currentTarget.id;
        var val = $(id=='pinFr' ? '#foregroundValue' : '#backgroundValue').html();
        if(val.indexOf('close to ')==0) val = val.substring(9);
        if(val.indexOf(',')>=0) val = val.substring(0, val.indexOf(','));
        $(id=='pinFr' ? '#foreground' : '#background').val(val);
        getContrast();
    }

    openTestPage = function(e) {
        window.open(chrome.extension.getURL('/inc/html/test.html'),'_blank');
    };

    openOptionsPage = function(e) {
        window.open(chrome.extension.getURL('/inc/html/options.html'),'_blank');
    };

    fixContrastMsg = function(color1, color2) {
        if($('#Waiting').length == 0)
            $fixSamples.append(
                '<div id="Waiting" class="example" style="background-color: white; border: 2px solid red; '+
                'font-size: 14px; font-weight: bold;">'+
                '   <span style="color:red;">Waiting...</span>'+
                '   <img src="'+chrome.extension.getURL('/images/loading.gif')+'" style="margin-bottom: -2px;"></img>'+
                //'   <img src="'+chrome.extension.getURL('/images/btnOK.png')+'" data-color="'+frColor.hex+'" class="btnOK"></img>'+
                '</div>');
        else 
            $('#Waiting').show();
        $fixSamples.show();

        var contrastDfr = $.Deferred();
        sendMessage({
                type: "fix-contrast",
                c1: color1,
                c2: color2
            }).then(function(req) {
                //console.log(req);
                if(req.fixes.length > 0) {
                    req.fixes.forEach(function(frColor) {
                        $fixSamples.prepend(
                            '<div class="example" style="background-color: '+frColor.bgHex+'; '+
                            (frColor.bruteForce ? ('border: 2px solid '+frColor.hex+'; ') : '')+
                            'font-size: 14px; font-weight: bold;">'+
                            '   <span style="color:'+frColor.hex+';">Suggestion: '+frColor.hex+' (contrast: '+frColor.contrast.toFixed(2)+':1)</span>'+
                            '   <img src="'+chrome.extension.getURL('/images/btnOK.png')+'" data-color="'+frColor.hex+'" class="btn btnOK"></img>'+
                            '</div>');
                    });
                    $('#fixSamples img').click(acceptSample);
                }
                $('#Waiting').hide();
            });
        return contrastDfr.promise();
    };

    sendMessage = function(message) {
        $sendMessageDfr = $.Deferred();
        setTimeout(function(){ 
            port.postMessage(message); 
        }, 200);
        return $sendMessageDfr.promise();
    };

    $sendMessageDfr = null;
    var port = chrome.extension.connect({name: "Sample Communication"});
    port.onMessage.addListener(function(req) {
        switch (req.type) {
            case 'fix-contrast':
                $sendMessageDfr.resolve(req);
                break;
        }
    });

    $('#closeBtn').attr('src',chrome.extension.getURL('/images/close.png')).click(function(e) { window.close(); });
    $('#optionsBtn').attr('src',chrome.extension.getURL('/images/DisabledEye.png')).click(openOptionsPage);
    $('#sampleBtn').attr('src',chrome.extension.getURL('/images/Sample.png')).click(openTestPage);
    $(".txInput")
    .on("input", function(e) {
        getContrast(e.currentTarget.id);
    })
    .autocomplete({
      lookup: WebColor.ColorNames,
      onSelect: function (suggestion) {
        getContrast();
      }
    });

    chrome.storage.sync.get(['clickType'], function(a) {
        if(a['clickType'] == undefined || a['clickType']) {
            $('.pickOne').hide();
            $('.pickAll button').show();
            $('.pick1').on('click', pickAction);
        } else {
            $('.pickAll button').hide();
            $('.pickOne').show();
            $('.pick').on('click', pickAction);
        }
        // $('#testPage').click(openTestPage);
        // $('#optionsPage').click(openOptionsPage);
    });
    
    $('.code').on('click', copyCode);

    $('.pin').on('click', pinCode);

    $('#toggle').on('click', function(t) {
        var backgroundVal = $("#background").val().trim();
        var foregroundVal = $("#foreground").val().trim();
        $("#background").val(foregroundVal);
        getContrast("background");
        $("#foreground").val(backgroundVal);
        getContrast();
    });

    var backgroundPage = chrome.extension.getBackgroundPage().Background;

    getSelectedTab().done(function(tab) { // ??? The extensions gallery cannot be scripted.
        chrome.tabs.executeScript(tab.id, {
            allFrames: false,
            "code":
                "try {\n"+
                "   ColorPicker.Hide(document);\n" +
                "} catch(e) {\n"+
                "   //console.log(e);\n"+
                "};"
            }, function() {
                chrome.storage.sync.get(['background', 'foreground'], function(a) {
                    //console.log('Restore '+a['background']+' '+a['foreground']);
                    if (a['background']) {
                        $("#background").val(a['background']);
                    }
                    if (a['foreground']) {
                        $("#foreground").val(a['foreground']);
                    }
                    getContrast(null);
                });
            }
        )
    });
});