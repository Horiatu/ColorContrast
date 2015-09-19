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

        if(bgColor.isColor && frColor.isColor && !bgColor.equals(frColor)) {
            var contrast = frColor.contrastTo(bgColor);
            var desiredContrasts = [];
            if(contrast < 7.0) desiredContrasts.push(7.0);
            if(contrast < 4.5) desiredContrasts.push(4.5);
            if(contrast < 3.0) desiredContrasts.push(3.0);
            if(desiredContrasts.length == 0) return;

            var colors = YCbCr.suggestColors(bgColor, frColor, desiredContrasts);

            if(colors.length > 0) {
                colors.forEach(function(color) {
                    var frColor = color[0].toHex();
                    var bgColor = color[1].toHex();
                    var contrast = color[0].contrastTo(color[1]).toFixed(2)+':1';
                    $fixSamples.append(
                        '<div class="example" style="background-color: '+bgColor+'; '+
                        //'border: 2px solid '+frColor+'; '+
                        'font-size: 12px; font-weight: bold;"'+
                        'title="Pass '+ (color[2]==7?'AAA':color[2]==4.5?'AA and AAA for Large':'A and AA for Large')+'" '+
                        '>'+
                        '   <span style="color:'+frColor+';">Suggestion: '+frColor+' on '+bgColor+' ['+contrast+']'+
                        //' ('+color[2]+')'+
                        '</span>'+
                        '   <img src="'+chrome.extension.getURL('/images/btnOK.png')+'" data-fr="'+frColor+'" data-bg="'+bgColor+'" class="btn btnOK"></img>'+
                        '</div>');
                });
                $('#fixSamples img').click(acceptSample);
                $fixSamples.show();
            }
        }
    },

    fixSamplesClear = function() {
        $('#fixSamples').hide();
        $('#fixSamples').html('');
    },

    acceptSample = function(e) {
        $("#foreground").val($(e.toElement).attr('data-fr'));
        $("#background").val($(e.toElement).attr('data-bg'));
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

            // $().undoable(
            //     function(){ // redo
            //         alert('redo ');
            //     },
            //     function(){ // undo
            //         alert('undo ');
            //     } 
            // );

            $(".example").css("background-color", backgroundTxt);
            $(".example span").css("color", foregroundTxt);

            var cc = c1.contrastTo(c2);
            analyseResults(cc);
            if (cc < 7.0) {
                fixContrast();
            }
        } else {
            if (id) {
                $("#" + id).addClass("error");
            } else {
                $(".txInput").addClass("error");
            }
            $("#contrast span").css("text-shadow", "2px 2px 2px transparent");
        };
    };

    analyseResults = function(cc) {
        $("#contrast span").html(parseFloat(cc).toFixed(2) + ":1");

        if (cc >= 7.0) {
            $("#contrast span").css("text-shadow", "2px 2px 2px darkgreen");
            $(".largeAAA").show();
            $(".smallAAA").show();

            $(".largeAA").hide();
            $(".smallAA").hide();

            $(".large").hide();
            $(".small").hide();
        }
        else if (cc >= 4.5) {
            $("#contrast span").css("text-shadow", "2px 2px 2px orange");
            $(".largeAAA").show();
            $(".smallAAA").hide();

            $(".largeAA").hide();
            $(".smallAA").show();

            $(".large").hide();
            $(".small").hide();
        } else if (cc >= 3.0) {
            $("#contrast span").css("text-shadow", "2px 2px 2px orangered");
            $(".largeAAA").hide();
            $(".smallAAA").hide();

            $(".largeAA").show();
            $(".smallAA").hide();

            $(".large").hide();
            $(".small").show();
        } else {
            $("#contrast span").css("text-shadow", "2px 2px 2px red");
            $(".largeAAA").hide();
            $(".smallAAA").hide();

            $(".largeAA").hide();
            $(".smallAA").hide();

            $(".large").show();
            $(".small").show();
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

    pinCode = function(t) {
        var id = t.currentTarget.id;
        var val = $(id=='pinFr' ? '#foregroundValue' : '#backgroundValue').html();
        if(val.indexOf('close to ')==0) val = val.substring(9);
        if(val.indexOf(',')>=0) val = val.substring(0, val.indexOf(','));
        $(id=='pinFr' ? '#foreground' : '#background').val(val);
        getContrast(id=='pinFr' ? 'foreground' : 'background');
    }

    openTestPage = function(e) {
        window.open(chrome.extension.getURL('/inc/html/test.html'),'_blank');
    };

    openOptionsPage = function(e) {
        window.open(chrome.extension.getURL('/inc/html/options.html'),'_blank');
    };

    // jQuery(function(){
    //     jQuery().enableUndo({ redoCtrlChar : 'y', redoShiftReq : false });
    // });

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
            getContrast(this.id);
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
    
    //$('.code').on('click', copyCode);

    $('.pin').on('click', pinCode);

    $('#toggle').on('click', function(t) {
        var backgroundVal = $("#background").val().trim();
        var foregroundVal = $("#foreground").val().trim();
        $("#background").val(foregroundVal);
        //getContrast("background"); // ???
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
                    getContrast();
                });
            }
        )
    });
});