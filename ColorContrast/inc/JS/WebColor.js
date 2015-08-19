function WebColor(color) {
	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.isColor = false;
	this.fixes = [];

	if(color && color != undefined) {
		hex = this.colorNameOrHexToColor(color);
		if(hex) {
			this.rgb(hex);
			this.isColor = true;
		}
	}
}

WebColor.prototype.addToR = function(r) {
	var v = this.r+r;
	if(v<255 && v>0)
		this.r = v;
    return this;
};

WebColor.prototype.addToG = function(g) {
	var v = this.g+g;
	if(v<255 && v>0)
		this.g = v;
	return this;
};

WebColor.prototype.addToB = function(b) {
	var v = this.b+b;
	if(v<255 && v>0)
		this.b = v;
    return this;
};

WebColor.prototype.rgb = function(hex) {
    hex = hex.replace('#', '');
    this.r = parseInt("0x" + hex.substr(0, 2));
    this.g = parseInt("0x" + hex.substr(2, 2));
    this.b = parseInt("0x" + hex.substr(4, 2));
    return this;
};

WebColor.prototype.toHex = function() {
    return '#'
	    +('00' + this.r.toString(16)).substr(-2)
	    +('00' + this.g.toString(16)).substr(-2)
	    +('00' + this.b.toString(16)).substr(-2);
};

WebColor.prototype.colourNameToHex = function(colour) {
    var colours = {
        "aliceblue": "#f0f8ff",
        "antiquewhite": "#faebd7",
        "aqua": "#00ffff",
        "aquamarine": "#7fffd4",
        "azure": "#f0ffff",
        "beige": "#f5f5dc",
        "bisque": "#ffe4c4",
        "black": "#000000",
        "blanchedalmond": "#ffebcd",
        "blue": "#0000ff",
        "blueviolet": "#8a2be2",
        "brown": "#a52a2a",
        "burlywood": "#deb887",
        "cadetblue": "#5f9ea0",
        "chartreuse": "#7fff00",
        "chocolate": "#d2691e",
        "coral": "#ff7f50",
        "cornflowerblue": "#6495ed",
        "cornsilk": "#fff8dc",
        "crimson": "#dc143c",
        "cyan": "#00ffff",
        "darkblue": "#00008b",
        "darkcyan": "#008b8b",
        "darkgoldenrod": "#b8860b",
        "darkgray": "#a9a9a9",
        "darkgreen": "#006400",
        "darkkhaki": "#bdb76b",
        "darkmagenta": "#8b008b",
        "darkolivegreen": "#556b2f",
        "darkorange": "#ff8c00",
        "darkorchid": "#9932cc",
        "darkred": "#8b0000",
        "darksalmon": "#e9967a",
        "darkseagreen": "#8fbc8f",
        "darkslateblue": "#483d8b",
        "darkslategray": "#2f4f4f",
        "darkturquoise": "#00ced1",
        "darkviolet": "#9400d3",
        "deeppink": "#ff1493",
        "deepskyblue": "#00bfff",
        "dimgray": "#696969",
        "dodgerblue": "#1e90ff",
        "firebrick": "#b22222",
        "floralwhite": "#fffaf0",
        "forestgreen": "#228b22",
        "fuchsia": "#ff00ff",
        "gainsboro": "#dcdcdc",
        "ghostwhite": "#f8f8ff",
        "gold": "#ffd700",
        "goldenrod": "#daa520",
        "gray": "#808080",
        "green": "#008000",
        "greenyellow": "#adff2f",
        "honeydew": "#f0fff0",
        "hotpink": "#ff69b4",
        "indianred ": "#cd5c5c",
        "indigo": "#4b0082",
        "ivory": "#fffff0",
        "khaki": "#f0e68c",
        "lavender": "#e6e6fa",
        "lavenderblush": "#fff0f5",
        "lawngreen": "#7cfc00",
        "lemonchiffon": "#fffacd",
        "lightblue": "#add8e6",
        "lightcoral": "#f08080",
        "lightcyan": "#e0ffff",
        "lightgoldenrodyellow": "#fafad2",
        "lightgrey": "#d3d3d3",
        "lightgreen": "#90ee90",
        "lightpink": "#ffb6c1",
        "lightsalmon": "#ffa07a",
        "lightseagreen": "#20b2aa",
        "lightskyblue": "#87cefa",
        "lightslategray": "#778899",
        "lightsteelblue": "#b0c4de",
        "lightyellow": "#ffffe0",
        "lime": "#00ff00",
        "limegreen": "#32cd32",
        "linen": "#faf0e6",
        "magenta": "#ff00ff",
        "maroon": "#800000",
        "mediumaquamarine": "#66cdaa",
        "mediumblue": "#0000cd",
        "mediumorchid": "#ba55d3",
        "mediumpurple": "#9370d8",
        "mediumseagreen": "#3cb371",
        "mediumslateblue": "#7b68ee",
        "mediumspringgreen": "#00fa9a",
        "mediumturquoise": "#48d1cc",
        "mediumvioletred": "#c71585",
        "midnightblue": "#191970",
        "mintcream": "#f5fffa",
        "mistyrose": "#ffe4e1",
        "moccasin": "#ffe4b5",
        "navajowhite": "#ffdead",
        "navy": "#000080",
        "oldlace": "#fdf5e6",
        "olive": "#808000",
        "olivedrab": "#6b8e23",
        "orange": "#ffa500",
        "orangered": "#ff4500",
        "orchid": "#da70d6",
        "palegoldenrod": "#eee8aa",
        "palegreen": "#98fb98",
        "paleturquoise": "#afeeee",
        "palevioletred": "#d87093",
        "papayawhip": "#ffefd5",
        "peachpuff": "#ffdab9",
        "peru": "#cd853f",
        "pink": "#ffc0cb",
        "plum": "#dda0dd",
        "powderblue": "#b0e0e6",
        "purple": "#800080",
        "red": "#ff0000",
        "rosybrown": "#bc8f8f",
        "royalblue": "#4169e1",
        "saddlebrown": "#8b4513",
        "salmon": "#fa8072",
        "sandybrown": "#f4a460",
        "seagreen": "#2e8b57",
        "seashell": "#fff5ee",
        "sienna": "#a0522d",
        "silver": "#c0c0c0",
        "skyblue": "#87ceeb",
        "slateblue": "#6a5acd",
        "slategray": "#708090",
        "snow": "#fffafa",
        "springgreen": "#00ff7f",
        "steelblue": "#4682b4",
        "tan": "#d2b48c",
        "teal": "#008080",
        "thistle": "#d8bfd8",
        "tomato": "#ff6347",
        "turquoise": "#40e0d0",
        "violet": "#ee82ee",
        "wheat": "#f5deb3",
        "white": "#ffffff",
        "whitesmoke": "#f5f5f5",
        "yellow": "#ffff00",
        "yellowgreen": "#9acd32"
    };

    if (typeof colours[colour.toLowerCase()] != 'undefined')
        return colours[colour.toLowerCase()];

    return false;
};

WebColor.prototype.colorNameOrHexToColor = function(str) {
    str = str.trim();
    h1 = str.match(/#(?:[0-9a-f]{3}){1,2}$/gi);
    if (h1 && h1.length == 1) {
        h = h1[0];
        if (h.length == 4) {
            return h[0] + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
        }
        return str;
    } else {
        return this.colourNameToHex(str);
    }
};

WebColor.prototype.luminance = function() {
    // http://www.w3.org/Graphics/Color/sRGB.html
    var R = this.r / 255.0;
    var G = this.g / 255.0;
    var B = this.b / 255.0;
    R = R <= 0.03928 ? R / 12.92 : Math.pow((R + 0.055) / 1.055, 2.4);
    G = G <= 0.03928 ? G / 12.92 : Math.pow((G + 0.055) / 1.055, 2.4);
    B = B <= 0.03928 ? B / 12.92 : Math.pow((B + 0.055) / 1.055, 2.4);
    var l = (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
    return l;
};

WebColor.prototype.contrastTo = function(webColor) {
    var l1 = this.luminance() + 0.05;
    var l2 = webColor.luminance() + 0.05;
    var l = l1 > l2 ? l1 / l2 : l2 / l1;
    return l;
};

WebColor.prototype.equals = function(webColor) {
	return this.r === webColor.r && this.g === webColor.g && this.b === webColor.b;
};

WebColor.prototype.clone = function() {
	clone = new WebColor();
	clone.r = this.r; clone.g = this.g; clone.b = this.b;
	return clone;
};

WebColor.prototype.fixContrastTo = function(webColor, target) {
	this.fixes = [];
	initialDelta = target - this.contrastTo(webColor);
	if(initialDelta <= 0) {
		return;
	}

	this._fixContrast(webColor, initialDelta, "R");
	this._fixContrast(webColor, initialDelta, "G");
	this._fixContrast(webColor, initialDelta, "B");
}

WebColor.prototype._fixContrast = function(webColor, initialDelta, component) {
	playColor = this.clone();
	switch(component) {
		case "R" : playColor.addToR(1); break;
		case "G" : playColor.addToG(1); break;
		case "B" : playColor.addToB(1); break;
	}
	if(!this.equals(playColor)) {
		contrast = playColor.contrastTo(webColor);
		delta = target - contrast;
		d = delta < initialDelta ? 1 : -1;
		h = playColor.toHex();
		while(delta > 0) {
			switch(component) {
				case "R" : playColor.addToR(d); break;
				case "G" : playColor.addToG(d); break;
				case "B" : playColor.addToB(d); break;
			}
			h1 = playColor.toHex();
			if(h == h1) {
				return;
			}
			h = h1;
			contrast = playColor.contrastTo(webColor);
			delta = target - contrast;
		}
		this.fixes.push({hex:h, contrast:contrast});
	}	
}