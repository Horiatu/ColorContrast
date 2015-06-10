$( document ).ready(function() {
	var getContrast = function() {
		
		var backgroundVal = $("#background").val();
		var foregroundVal = $("#foreground").val();
		var backgroundTxt = ContrastAnalyser.colorNameOrHexToColor(backgroundVal);
		var foregroundTxt = ContrastAnalyser.colorNameOrHexToColor(foregroundVal);
		if(backgroundTxt && foregroundTxt) {
			chrome.storage.sync.set({'background': backgroundVal}, function() {
	          console.log("background "+backgroundVal+' saved');
        	});
			chrome.storage.sync.set({'foreground': foregroundVal}, function() {
	          console.log("foreground "+foregroundVal+' saved');
        	});

			$(".example").css("background-color", backgroundTxt);
			$(".example span").css("color", foregroundTxt);

			var cc = ContrastAnalyser.contrast(backgroundTxt, foregroundTxt);
			console.log( cc );

			$("#contrast span").html(parseFloat(Math.round(cc * 10) / 10).toFixed(1) + ":1");

			if(cc >= 4.5) {
				$(".largeOK").show();
				$(".smallOK").show();
				$(".large").hide();
				$(".small").hide();
			} else if (cc >= 3) {
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

	$('.txInput').contextMenu('inputMenu', {
      bindings: {
        'Copy': function(t) {
          alert('Trigger was '+t.id+'\nAction was Copy');
        },
        'CopyCode': function(t) {
          alert('Trigger was '+t.id+'\nAction was Copy Code');
        },
        'Paste': function(t) {
          alert('Trigger was '+t.id+'\nAction was Paste');
        },
        'PickColor': function(t) {
          alert('Trigger was '+t.id+'\nAction was Pick Color');
        }
      }
    });

});