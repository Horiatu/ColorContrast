$( document ).ready(function() {

	$.getSelectedTab = function()
	{
		var dfd = $.Deferred();

  		chrome.tabs.query({ "active": true, "currentWindow": true }, function(tabs)
  		{
    		dfd.resolve(tabs[0]);
  		});

  		return dfd.promise();
	},

	$.validateTab = function(tab)
	{
		var dfd = $.Deferred();
  		var url = tab.url;

  		if(url.indexOf("chrome://") === 0 || url.indexOf("chrome-extension://") === 0)
  		{
    		dfd.reject("Warning: Does not work on internal browser pages.");
  		}
  		else if(url.indexOf("https://chrome.google.com/extensions/") === 0 || url.indexOf("https://chrome.google.com/webstore/") === 0)
  		{
    		dfd.reject("Warning: Does not work on the Chrome Extension Gallery.");
  		}
  		else {
  			dfd.resolve();
  		}

  		return dfd.promise();
	},

	getContrast = function(id) 
	{
		var backgroundVal = $("#background").val().trim();
		var foregroundVal = $("#foreground").val().trim();
		var backgroundTxt = ContrastAnalyser.colorNameOrHexToColor(backgroundVal);
		var foregroundTxt = ContrastAnalyser.colorNameOrHexToColor(foregroundVal);
		if(backgroundTxt && foregroundTxt) {
			if(id) {
				$("#"+id).removeClass("error");
			} else {
				$(".txInput").removeClass("error");
			}

			chrome.storage.sync.set({'background': backgroundVal}, function() {
	          //console.log("background "+backgroundVal+' saved');
        	});
			chrome.storage.sync.set({'foreground': foregroundVal}, function() {
	          //console.log("foreground "+foregroundVal+' saved');
        	});

			$(".example").css("background-color", backgroundTxt);
			$(".example span").css("color", foregroundTxt);

			var cc = ContrastAnalyser.contrast(backgroundTxt, foregroundTxt);
			//cc = Math.round((cc * 10) / 10);

			$("#contrast span").html(parseFloat(cc).toFixed(2) + ":1");

			if(cc >= 4.5) {
				$("#contrast span").css("text-shadow", "2px 2px 2px darkgreen");
				$(".largeOK").show();
				$(".smallOK").show();
				$(".large").hide();
				$(".small").hide();
			} else if (cc >= 3.0) {
				$("#contrast span").css("text-shadow", "2px 2px 2px orangered");
				$(".largeOK").show();
				$(".smallOK").hide();
				$(".large").hide();
				$(".small").show();
			} else {
				$("#contrast span").css("text-shadow", "2px 2px 2px red");
				$(".largeOK").hide();
				$(".smallOK").hide();
				$(".large").show();
				$(".small").show();
			}
		}
		else {
			if(id) {
				$("#"+id).addClass("error");
			} else {
				$(".txInput").addClass("error");
			}
			$("#contrast span").css("text-shadow", "2px 2px 2px transparent");
		};
	};

	pickAction = function(t) 
  {
        //console.log(t.currentTarget);
        backgroundPage.requestColor = t.currentTarget.name;
        $.getSelectedTab().done(function(tab) {
            $.validateTab(tab).always(
                function(err) {
                    if (err) {
                        alert(err);
                    } else {
                        chrome.tabs.executeScript(tab.id, {
                                allFrames: true,
                                "file": "jquery-2.1.4.js"
                            },
                            function() {
                                chrome.tabs.executeScript(tab.id, {
                                        allFrames: true,
                                        "file": "ColorPicker.js"
                                    },
                                    function() {
                                        chrome.tabs.executeScript(tab.id, {
                                                allFrames: true,
                                                "code": "ColorPicker.Hide(document);\n" +
                                                    "ColorPicker.Show(document);\n" +
                                                    "ColorPicker.refresh();"
                                            },
                                            function() {
                                                console.log('done');
                                                closePopup();
                                            });
                                    });
                            });
                    }
                }
            );
        });
	};

	closePopup = function() 
	{
  		window.close();
	};

	copyCode = function(t) 
	{
		//console.log(t.currentTarget.id);
      var o = $(t.currentTarget).closest('tr').find("input");
	    var initial = o.val();
    	o.val(ContrastAnalyser.colorNameOrHexToColor(initial));
      o.focus();
      o.select();
      document.execCommand("Copy", false, null);
	    o.val(initial);
	};

  chrome.storage.sync.get(['background', 'foreground'], function(a) {
		//console.log('Restore '+a['background']+' '+a['foreground']);
		if(a['background']) {
			$("#background").val(a['background']);
		}
		if(a['foreground']) {
			$("#foreground").val(a['foreground']);
		}
		getContrast(null);
	});

	$(".txInput").on( "input", function(e) {
  		getContrast(e.currentTarget.id);
 	});

	$('.pick').on('click', pickAction);
	$('.code').on('click', copyCode);
	$('#toggle').on('click', function(t) {
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

    $(".txInput").on("input", function(e) {
        getContrast(e.currentTarget.id);
    });

    $('.pick').on('click', pickAction);
    $('.code').on('click', copyCode);
    $('#toggle').on('click', function(t) {
        var backgroundVal = $("#background").val().trim();
		var foregroundVal = $("#foreground").val().trim();
		$("#background").val(foregroundVal);
		getContrast("background");
		$("#foreground").val(backgroundVal);
		getContrast("foreground");
        var foregroundVal = $("#foreground").val().trim();
        $("#background").val(foregroundVal);
        getContrast("background");
        $("#foreground").val(backgroundVal);
        getContrast("foreground");
    });

	$('.btn img').on('mouseenter', function(t) {
		t.currentTarget["src"] = t.currentTarget["src"].replace(".png",".color.png");
	});

	$('.btn img').on('mouseleave', function(t) {
		t.currentTarget["src"] = t.currentTarget["src"].replace(".color.png",".png");
	});

	var backgroundPage = chrome.extension.getBackgroundPage().Background;
							
	$.getSelectedTab().done(function(tab)
  	{
  		$.validateTab(tab).always( 
  			function(err) {
  				if(err) {
  					alert(err);
  				} else {
					chrome.tabs.executeScript(tab.id, { allFrames: false, "code": 
						//"try { " +
						"ColorPicker.displayColorPicker(false, document);"
						//+ " } catch () {}"
						},
						function() {
							var color = backgroundPage.Color;
							if(color != null && backgroundPage.requestColor != null) {
								$('#'+backgroundPage.requestColor).val(color);
								getContrast(backgroundPage.requestColor);
							}
						}
					);
				}
			}
		)
	});
});
    $('.btn img').on('mouseenter', function(t) {
        t.currentTarget["src"] = t.currentTarget["src"].replace(".png", ".color.png");
    });

    $('.btn img').on('mouseleave', function(t) {
        t.currentTarget["src"] = t.currentTarget["src"].replace(".color.png", ".png");
    });

    var backgroundPage = chrome.extension.getBackgroundPage().Background;

    $.getSelectedTab().done(function(tab) {
        $.validateTab(tab).always(
            function(err) {
                if (err) {
                    alert(err);
                } else {
                    chrome.tabs.executeScript(tab.id, {
                            allFrames: false,
                            "code":
                            "try {\n" +
                                //"  if(undefined !== ColorPicker && ColorPicker)\n"+
                                "    ColorPicker.Hide(document);\n"
                        + "}\ncatch (err) {\n  //console.log('Init error: '+err);\n};"
                        },
                        function() {
                            var color = backgroundPage.Color;
                            if (color != null && backgroundPage.requestColor != null) {
                                $('#' + backgroundPage.requestColor).val(color);
                                getContrast(backgroundPage.requestColor);
                            }
                        }
                    );
                }
            }
        )
    });
});
