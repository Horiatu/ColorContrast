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

        bgColor=new WebColor($("#background").val().trim());
        frColor=new WebColor($("#foreground").val().trim());
        if(bgColor.isColor && frColor.isColor) {
            target = 7.0;
            if(frColor.contrastTo(bgColor) < target) {
                frColor.fixContrastTo(bgColor, target);
                if(frColor.fixes.length > 0) {
                    isTop = "margin-top: 0; ";
                    frColor.fixes.forEach(function(frColor) {
                        $fixSamples.append(
                            '<div class="example" style="'+isTop+'background-color: '+bgColor.toHex()+'; font-size: 14px; font-weight: bold;">'+
                            '   <span style="color:'+frColor.hex+';">Suggestion: '+frColor.hex+' (contrast: '+frColor.contrast.toFixed(2)+':1)</span>'+
                            '   <img src="'+chrome.extension.getURL('/Images/btnOK.png')+'" data-color="'+frColor.hex+'" class="btnOK"></img>'+
                            '</div>');
                        isTop = "";
                    });
                    $('#fixSamples img').click(acceptSample);
                    $fixSamples.show();
                }
            }
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
        $box = $("#"+id);
        $box.attr('title', '');
        if($box.val()[0] === '#') {
            $box.attr('title', WebColor.hexToColorName($box.val()));
        } else {
            $box.attr('title', WebColor.colorNameToHex($box.val()));
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
                                content: "/inc/JS/jquery-2.1.4.min.js"
                            }, {
                                allFrames: false,
                                file: true,
                                content: "/inc/JS/dropit.js"
                            }, {
                                allFrames: false,
                                file: true,
                                content: "/inc/JS/scrollstop.js"
                            }, {
                                allFrames: false,
                                file: true,
                                content: "/inc/JS/ColorPicker.js"
                            }, {
                                allFrames: false,
                                file: false,
                                content: 
                                    "ColorPicker.Hide(document);\n" +
                                    "ColorPicker.Show(document);\n" +
                                    "//ColorPicker.refresh();"
                            }], $.Deferred()).done(
                                function() {
                                    // console.log('done');
                                    closePopup();
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

    closePopup = function() {
        window.close();
    };

    copyCode = function(t) {
        //console.log(t.currentTarget.id);
        var o = $(t.currentTarget).closest('tr').find("input");
        var initial = o.val();
        wc = new WebColor(initial);
        if(wc.isColor)
        {
            o.val(wc.toHex());
            o.focus();
            o.select();
            document.execCommand("Copy", false, null);
            o.val(initial);
        }
    };

    openTestPage = function(e) {
        window.open(chrome.extension.getURL('/inc/html/test.html'),'_blank');
        // chrome.tabs.create({'url': chrome.extension.getURL('/inc/html/test.html')}, function(tab) {
        //     // Tab opened.
        // });
    };

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
        $('#testPage').click(openTestPage);
    });
    
    $('.code').on('click', copyCode);

    $('#toggle').on('click', function(t) {
        var backgroundVal = $("#background").val().trim();
        var foregroundVal = $("#foreground").val().trim();
        $("#background").val(foregroundVal);
        getContrast("background");
        $("#foreground").val(backgroundVal);
        getContrast();
    });

    var backgroundPage = chrome.extension.getBackgroundPage().Background;

    getSelectedTab().done(function(tab) {
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