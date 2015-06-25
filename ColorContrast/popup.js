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
			cc = Math.round((cc * 10) / 10);

			$("#contrast span").html(parseFloat(cc).toFixed(1) + ":1");

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
		//console.log(t.currentTarget.id);
	    $.getSelectedTab().done(function(tab)
  		{
  			$.validateTab(tab).always( 
  				function(err) {
  					if(err) {
  						alert(err);
  					} else {
  						$.when.apply($, $.addScripts(tab, [
  							{mode: "file", script: "jquery-1.11.3.min.js"},
  							{mode: "file", script: "ColorPicker.js"},
  							{mode: "code", script: "ColorPicker.displayColorPicker(false, document);\n"+
  							                       "ColorPicker.displayColorPicker(true, document);\n"+
  							                       "ColorPicker.refresh();"}
  							])).done(function() {
  								console.log('done');
  								//window.close();
  								}
  							);
  					}
				}
			);
        });
	};

	copyCode = function(t) 
	{
		//console.log(t.currentTarget.id);
        var o = $(t.currentTarget).closest('tr').find("input");
	    var initial = o.val();
    	o.val(ContrastAnalyser.colorNameOrHexToColor(initial));
		o.focus(); o.select();
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
        var backgroundVal = $("#background").val().trim();
		var foregroundVal = $("#foreground").val().trim();
		$("#background").val(foregroundVal);
		getContrast("background");
		$("#foreground").val(backgroundVal);
		getContrast("foreground");
    	}
    );

	$('.btn img').on('mouseenter', function(t) {
		t.currentTarget["src"] = t.currentTarget["src"].replace(".png",".color.png");
	});

	$('.btn img').on('mouseleave', function(t) {
		t.currentTarget["src"] = t.currentTarget["src"].replace(".color.png",".png");
	});

	$.addScript = function(tab, script) {
		var dfd = $.Deferred();
		switch(script.mode) {
			case "file" :
				chrome.tabs.executeScript(tab.id, { allFrames: true, "file": script.script }, 
				function() {
					dfd.resolve(script.mode +': '+script.script);
				});
				break;
			case "code" :
				chrome.tabs.executeScript(tab.id, { allFrames: true, "code": script.script }, 
				function() {
					dfd.resolve(script.mode +': '+script.script);
				});
				break;
			};
		return dfd.promise();
		};

	$.addScripts = function(tab, scripts) {
		var d=[];
		$(scripts).each(function(i, s) {
			d.push($.addScript(tab, s).then( function(msg) { console.log(msg); } ));
		});
		return d;
	}

});