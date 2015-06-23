$( document ).ready(function() {

	getSelectedTab = function(callback)
	{
  		chrome.tabs.query({ "active": true, "currentWindow": true }, function(tabs)
  		{
    		callback(tabs[0]);
  		});
	},

	isValidTab = function(tab)
	{
  		var url = tab.url;

  		// If this is a chrome URL
  		if(url.indexOf("chrome://") === 0 || url.indexOf("chrome-extension://") === 0)
  		{
    		alert("Warning: Does not work on internal browser pages.");

    		return false;
  		}
  		else if(url.indexOf("https://chrome.google.com/extensions/") === 0 || url.indexOf("https://chrome.google.com/webstore/") === 0)
  		{
    		alert("Warning: Does not work on the Chrome Extension Gallery.");

    		return false;
  		}

  		return true;
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
	          console.log("background "+backgroundVal+' saved');
        	});
			chrome.storage.sync.set({'foreground': foregroundVal}, function() {
	          console.log("foreground "+foregroundVal+' saved');
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
		console.log(t.currentTarget.id);
	    getSelectedTab(function(tab)
  		{
  			if(isValidTab(tab)) {
  				addScriptToTab(tab, { allFrames: true, "file": "jquery-1.11.3.min.js" }, function()
  				{
  					addScriptsToTab(tab, 
  						"ColorPicker.js", 
 						"ColorPicker.displayColorPicker(false, document);"+
  						"ColorPicker.displayColorPicker(true, document);"+
  						"ColorPicker.refresh();", 
  						function() {
  							//window.close();
  						}
  					);
  				});
			}
        });
	};

	copyCode = function(t) 
	{
		console.log(t.currentTarget.id);
        var o = $(t.currentTarget).closest('tr').find("input");
	    var initial = o.val();
    	o.val(ContrastAnalyser.colorNameOrHexToColor(initial));
		o.focus(); o.select();
        document.execCommand("Copy", false, null);
	    o.val(initial);
	};

	chrome.storage.sync.get(['background', 'foreground'], function(a) {
		console.log('Restore '+a['background']+' '+a['foreground']);
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

	addScriptToTab = function(tab, script, callback)
	{
  		chrome.tabs.executeScript(tab.id, script, callback);
	},

	addScriptsToTab = function(tab, scriptFile, scriptCode, callback)
	{
  		addScriptToTab(tab, { allFrames: true, "file": scriptFile }, function()
  		{
    		addScriptToTab(tab, { allFrames: true, "code": scriptCode }, callback);
  		});
	};

});