$( document ).ready(function() {
	var getContrast = function() {
		//console.log( id+" "+txt );
		var backgroundTxt = Contrast.colorNameOrHexToColor($("#background").val());
		var foregroundTxt = Contrast.colorNameOrHexToColor($("#foreground").val());
		if(backgroundTxt && foregroundTxt) {
			$(".example").css("background-color", backgroundTxt);
			$(".example span").css("color", foregroundTxt);

			console.log( "background "+backgroundTxt );
			console.log( "foreground "+foregroundTxt );

			var cc = Contrast.contrast(backgroundTxt, foregroundTxt);
			console.log( cc );

			$("#contrast span").html(parseFloat(Math.round(cc * 100) / 100).toFixed(2) + " : 1");
		}

	};
	$(".txInput").on( "input", function() {
  		getContrast();
	});
});