$( document ).ready(function() {
	var getContrast = function() {
		
		var backgroundTxt = ContrastAnalyser.colorNameOrHexToColor($("#background").val());
		var foregroundTxt = ContrastAnalyser.colorNameOrHexToColor($("#foreground").val());
		if(backgroundTxt && foregroundTxt) {
			chrome.storage.sync.set({'background': backgroundTxt}, function() {
	          console.log("background "+backgroundTxt+' saved');
        	});
			chrome.storage.sync.set({'foreground': foregroundTxt}, function() {
	          console.log("foreground "+foregroundTxt+' saved');
        	});

			$(".example").css("background-color", backgroundTxt);
			$(".example span").css("color", foregroundTxt);

			var cc = ContrastAnalyser.contrast(backgroundTxt, foregroundTxt);
			console.log( cc );

			$("#contrast span").html(parseFloat(Math.round(cc * 100) / 100).toFixed(2) + " : 1");

			if(cc>=4.5) {
				$(".largeOK").show();
				$(".smallOK").show();
				$(".large").hide();
				$(".small").hide();
			} else if (cc>=3) {
				$(".largeOK").show();
				$(".smallOK").hide();
				$(".large").hide();
				$(".small").show();
			} else {
				$(".largeOK").hide();
				$(".smallOK").hide();
				$(".large").show();
				$(".small").show();
			}
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
		getContrast();
	});

	$(".txInput").on( "input", function() {
  		getContrast();
	});
});