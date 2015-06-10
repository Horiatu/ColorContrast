$( document ).ready(function() {
	var getContrast = function() {
		
		var backgroundTxt = ContrastAnalyser.colorNameOrHexToColor($("#background").val());
		var foregroundTxt = ContrastAnalyser.colorNameOrHexToColor($("#foreground").val());
		if(backgroundTxt && foregroundTxt) {
			$(".example").css("background-color", backgroundTxt);
			$(".example span").css("color", foregroundTxt);

			console.log( "background "+backgroundTxt );
			console.log( "foreground "+foregroundTxt );

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

	getContrast();
	$(".txInput").on( "input", function() {
  		getContrast();
	});
});