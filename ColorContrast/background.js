$( document ).ready(function() {
	var getContrast = function() {
		//console.log( id+" "+txt );
		var backgroundTxt = $("#background").val();
		var foregroundTxt = $("#foreground").val();
		console.log( "background "+backgroundTxt );
		console.log( "foreground "+foregroundTxt );

		var cc = Contrast.testVal(backgroundTxt, foregroundTxt);
		console.log( cc );

		$("#contrast span").html(cc[1]);

	};
	$(".txInput").on( "input", function() {
  		getContrast();
	});
});