$(document).ready(function() {
	function hex(i) {
		var hex = //'0123456789abcdef';
					'f1d3456789abc2e0';
		return hex[i];
	}
	function init() {
		var table = document.getElementById('table');
		var content = '';
		for(i=0; i<16; i++) {
			content += '<tr>';
			for (var j = 0; j<16; j++) {
				color = 
					hex(15-j) + hex(i) +
					hex(i) + hex(i) +
					hex(j) + hex(j);
				content += '<td title="' + color + '" tabindex=0 style="width:40px; height:40px; background-color:#' + color + ';"/>';
			};
			content += '</tr>';
		}
		table.innerHTML = content;
	};
	init();
});
