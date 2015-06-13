$( document ).ready(function() {

	/*
	toggleFeatureOnTab = function(featureItem, tab, scriptFile, scriptCode)//, closeOverlay)
	{
  		var feature = featureItem.attr("id");

  		addScriptsToTab(tab, scriptFile, scriptCode, function()
  		{
    		//chrome.extension.getBackgroundPage().WebDeveloper.Storage.toggleFeatureOnTab(feature, tab);

    		featureItem.toggleClass("active");

    		//// If the overlay should be closed
    		//if(closeOverlay)
    		//{
      		//	WebDeveloper.Overlay.close();
    		//}
  		});
	},
	*/

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

	getContrast = function(id) {
		
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
				$("#contrast span").css("text-shadow", "2px 2px 2px orange");
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

	$('.txInput').contextMenu('inputMenu', {
      bindings: {
        'Copy': function(t) {
          //alert('Trigger was '+t.id+'\nAction was Copy');
			t.focus(); t.select();
          	document.execCommand("Copy", false, null);
        },
        'CopyCode': function(t) {
        	var o = $('#'+t.id);
        	var initial = o.val();
        	o.val(ContrastAnalyser.colorNameOrHexToColor(initial));
			t.focus(); t.select();
          	document.execCommand("Copy", false, null);
          	o.val(initial);
        },
        'Toggle': function(t) {
        	var backgroundVal = $("#background").val().trim();
			var foregroundVal = $("#foreground").val().trim();
			$("#background").val(foregroundVal);
			getContrast("background");
			$("#foreground").val(backgroundVal);
			getContrast("foreground");
        },
        'ColorPicker': function(t) {
	        getSelectedTab(function(tab)
  			{
  				if(isValidTab(tab)) {
  					addScriptsToTab(tab, 
  						"ColorPicker.js", 
  						"ColorPicker.displayColorPicker(true, document);", 
  						function() {
  						});
				}
        	});
    	}
      }
    });

	addScriptToTab = function(tab, script, callback)
	{
  		chrome.tabs.executeScript(tab.id, script, callback);
	},

	addScriptsToTab = function(tab, scriptFile, scriptCode, callback)
	{
  		addScriptToTab(tab, { "file": scriptFile }, function()
  		{
    		addScriptToTab(tab, { "code": scriptCode }, callback);
  		});
	};

});