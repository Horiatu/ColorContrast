function WebColor(color) {
	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.isColor = true;
	this.fixes = [];
    this.target = 7;

	if(color && color != undefined) {
        if(color.hasOwnProperty('r') && color.hasOwnProperty('g') && color.hasOwnProperty('b')) {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
        } else {
    		hex = WebColor.colorNameOrHexToColor(color);
    		if(hex) {
    			this.rgb(hex);
    			this.isColor = true;
    		} else
                this.isColor = false;
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

WebColor.prototype.addTo = function(delta, mask) {
    if(!mask) mask = {r:1, g:1, b:1};
    var v = this.r + delta.r; if(mask.r == 1 && v<255 && v>0) this.r = v;
        v = this.g + delta.g; if(mask.g == 1 && v<255 && v>0) this.g = v;
        v = this.b + delta.b; if(mask.b == 1 && v<255 && v>0) this.b = v;
    return this;
};


WebColor.toRgb = function(hex) {
	hex = hex.replace('#', '');
	return {
        r:parseInt("0x" + hex.substr(0, 2)), 
        g:parseInt("0x" + hex.substr(2, 2)), 
        b:parseInt("0x" + hex.substr(4, 2))
    }
};

WebColor.prototype.rgb = function(hex) {
	var c = WebColor.toRgb(hex);
    this.r = c.r; 
    this.g = c.g; 
    this.b = c.b; 
    return this;
};

WebColor.prototype.toHex = function() {
    return '#'
	    +('00' + this.r.toString(16)).substr(-2)
	    +('00' + this.g.toString(16)).substr(-2)
	    +('00' + this.b.toString(16)).substr(-2);
};

WebColor.ColorNames = [
    {value: "aliceblue", data: "#f0f8ff"},
    {value: "antiquewhite", data: "#faebd7"},
    {value: "aqua", data: "#00ffff"},
    {value: "aquamarine", data: "#7fffd4"},
    {value: "azure", data: "#f0ffff"},
    {value: "beige", data: "#f5f5dc"},
    {value: "bisque", data: "#ffe4c4"},
    {value: "black", data: "#000000"},
    {value: "blanchedalmond", data: "#ffebcd"},
    {value: "blue", data: "#0000ff"},
    {value: "blueviolet", data: "#8a2be2"},
    {value: "brown", data: "#a52a2a"},
    {value: "burlywood", data: "#deb887"},
    {value: "cadetblue", data: "#5f9ea0"},
    {value: "chartreuse", data: "#7fff00"},
    {value: "chocolate", data: "#d2691e"},
    {value: "coral", data: "#ff7f50"},
    {value: "cornflowerblue", data: "#6495ed"},
    {value: "cornsilk", data: "#fff8dc"},
    {value: "crimson", data: "#dc143c"},
    {value: "cyan", data: "#00ffff"},
    {value: "darkblue", data: "#00008b"},
    {value: "darkcyan", data: "#008b8b"},
    {value: "darkgoldenrod", data: "#b8860b"},
    {value: "darkgray", data: "#a9a9a9"},
    {value: "darkgreen", data: "#006400"},
    {value: "darkkhaki", data: "#bdb76b"},
    {value: "darkmagenta", data: "#8b008b"},
    {value: "darkolivegreen", data: "#556b2f"},
    {value: "darkorange", data: "#ff8c00"},
    {value: "darkorchid", data: "#9932cc"},
    {value: "darkred", data: "#8b0000"},
    {value: "darksalmon", data: "#e9967a"},
    {value: "darkseagreen", data: "#8fbc8f"},
    {value: "darkslateblue", data: "#483d8b"},
    {value: "darkslategray", data: "#2f4f4f"},
    {value: "darkturquoise", data: "#00ced1"},
    {value: "darkviolet", data: "#9400d3"},
    {value: "deeppink", data: "#ff1493"},
    {value: "deepskyblue", data: "#00bfff"},
    {value: "dimgray", data: "#696969"},
    {value: "dodgerblue", data: "#1e90ff"},
    {value: "firebrick", data: "#b22222"},
    {value: "floralwhite", data: "#fffaf0"},
    {value: "forestgreen", data: "#228b22"},
    {value: "fuchsia", data: "#ff00ff"},
    {value: "gainsboro", data: "#dcdcdc"},
    {value: "ghostwhite", data: "#f8f8ff"},
    {value: "gold", data: "#ffd700"},
    {value: "goldenrod", data: "#daa520"},
    {value: "gray", data: "#808080"},
    {value: "green", data: "#008000"},
    {value: "greenyellow", data: "#adff2f"},
    {value: "honeydew", data: "#f0fff0"},
    {value: "hotpink", data: "#ff69b4"},
    {value: "indianred ", data: "#cd5c5c"},
    {value: "indigo", data: "#4b0082"},
    {value: "ivory", data: "#fffff0"},
    {value: "khaki", data: "#f0e68c"},
    {value: "lavender", data: "#e6e6fa"},
    {value: "lavenderblush", data: "#fff0f5"},
    {value: "lawngreen", data: "#7cfc00"},
    {value: "lemonchiffon", data: "#fffacd"},
    {value: "lightblue", data: "#add8e6"},
    {value: "lightcoral", data: "#f08080"},
    {value: "lightcyan", data: "#e0ffff"},
    {value: "lightgoldenrodyellow", data: "#fafad2"},
    {value: "lightgrey", data: "#d3d3d3"},
    {value: "lightgreen", data: "#90ee90"},
    {value: "lightpink", data: "#ffb6c1"},
    {value: "lightsalmon", data: "#ffa07a"},
    {value: "lightseagreen", data: "#20b2aa"},
    {value: "lightskyblue", data: "#87cefa"},
    {value: "lightslategray", data: "#778899"},
    {value: "lightsteelblue", data: "#b0c4de"},
    {value: "lightyellow", data: "#ffffe0"},
    {value: "lime", data: "#00ff00"},
    {value: "limegreen", data: "#32cd32"},
    {value: "linen", data: "#faf0e6"},
    {value: "magenta", data: "#ff00ff"},
    {value: "maroon", data: "#800000"},
    {value: "mediumaquamarine", data: "#66cdaa"},
    {value: "mediumblue", data: "#0000cd"},
    {value: "mediumorchid", data: "#ba55d3"},
    {value: "mediumpurple", data: "#9370d8"},
    {value: "mediumseagreen", data: "#3cb371"},
    {value: "mediumslateblue", data: "#7b68ee"},
    {value: "mediumspringgreen", data: "#00fa9a"},
    {value: "mediumturquoise", data: "#48d1cc"},
    {value: "mediumvioletred", data: "#c71585"},
    {value: "midnightblue", data: "#191970"},
    {value: "mintcream", data: "#f5fffa"},
    {value: "mistyrose", data: "#ffe4e1"},
    {value: "moccasin", data: "#ffe4b5"},
    {value: "navajowhite", data: "#ffdead"},
    {value: "navy", data: "#000080"},
    {value: "oldlace", data: "#fdf5e6"},
    {value: "olive", data: "#808000"},
    {value: "olivedrab", data: "#6b8e23"},
    {value: "orange", data: "#ffa500"},
    {value: "orangered", data: "#ff4500"},
    {value: "orchid", data: "#da70d6"},
    {value: "palegoldenrod", data: "#eee8aa"},
    {value: "palegreen", data: "#98fb98"},
    {value: "paleturquoise", data: "#afeeee"},
    {value: "palevioletred", data: "#d87093"},
    {value: "papayawhip", data: "#ffefd5"},
    {value: "peachpuff", data: "#ffdab9"},
    {value: "peru", data: "#cd853f"},
    {value: "pink", data: "#ffc0cb"},
    {value: "plum", data: "#dda0dd"},
    {value: "powderblue", data: "#b0e0e6"},
    {value: "purple", data: "#800080"},
    {value: "red", data: "#ff0000"},
    {value: "rosybrown", data: "#bc8f8f"},
    {value: "royalblue", data: "#4169e1"},
    {value: "saddlebrown", data: "#8b4513"},
    {value: "salmon", data: "#fa8072"},
    {value: "sandybrown", data: "#f4a460"},
    {value: "seagreen", data: "#2e8b57"},
    {value: "seashell", data: "#fff5ee"},
    {value: "sienna", data: "#a0522d"},
    {value: "silver", data: "#c0c0c0"},
    {value: "skyblue", data: "#87ceeb"},
    {value: "slateblue", data: "#6a5acd"},
    {value: "slategray", data: "#708090"},
    {value: "snow", data: "#fffafa"},
    {value: "springgreen", data: "#00ff7f"},
    {value: "steelblue", data: "#4682b4"},
    {value: "tan", data: "#d2b48c"},
    {value: "teal", data: "#008080"},
    {value: "thistle", data: "#d8bfd8"},
    {value: "tomato", data: "#ff6347"},
    {value: "turquoise", data: "#40e0d0"},
    {value: "violet", data: "#ee82ee"},
    {value: "wheat", data: "#f5deb3"},
    {value: "white", data: "#ffffff"},
    {value: "whitesmoke", data: "#f5f5f5"},
    {value: "yellow", data: "#ffff00"},
    {value: "yellowgreen", data: "#9acd32"}
];

WebColor.hexToColorName = function(hex) {
	hex = hex.toLowerCase()
	var rgb = WebColor.toRgb(hex);
	var dist = 3 * 255 + 1;
	var closeTo = '';

	var select = $.grep(WebColor.ColorNames, function(h, i){
		if(h.data == hex) 
			return true;

		var _rgb = WebColor.toRgb(h.data);
		var r = _rgb.r - rgb.r;
		var g = _rgb.g - rgb.g;
		var b = _rgb.b - rgb.b;
        var d = Math.abs(r) + Math.abs(g) + Math.abs(b); 
        if(dist > d) {
			dist = d;
			closeTo = h.value;
		}
		return false;
	});
	return (select.length < 1) ? ('close to '+closeTo) : $.map(select, function(s,i) { return s.value;}).join(', ');
};

WebColor.colorNameToHex = function(colour) {
	colour = colour.toLowerCase();
	var select = $.grep(WebColor.ColorNames, function(c, i){
		return c.value === colour;
	});
	if(select.length == 1) {
		return select[0].data;
	}
	else return null;
};

WebColor.colorNameOrHexToColor = function(str) {
    str = str.trim();
    var h1 = str.match(/#(?:[0-9a-f]{3}){1,2}$/gi);
    if (h1 && h1.length == 1) {
        var h = h1[0];
        if (h.length == 4) {
            return h[0] + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
        }
        return str;
    } else {
        return WebColor.colorNameToHex(str);
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
	var clone = new WebColor();
	clone.r = this.r; clone.g = this.g; clone.b = this.b;
	return clone;
};

WebColor.prototype.fixContrastTo = function(webColor) {
	this.fixes = [];
	if(this.equals(webColor)) return;
	var initialDelta = this.target - this.contrastTo(webColor);
	if(initialDelta <= 0) {
		return;
	}

	this._fixContrast(webColor, initialDelta, "R");
	this._fixContrast(webColor, initialDelta, "G");
	this._fixContrast(webColor, initialDelta, "B");

    // if(!this.fixes || this.fixes.length == 0)
    //     this.fixContrastBruteForce(webColor);
}

WebColor.prototype._fixContrast = function(webColor, initialDelta, component) {
	var playColor = this.clone();
	var d = 1;
	switch(component) {
		case "R" : playColor.addToR(d); break;
		case "G" : playColor.addToG(d); break;
		case "B" : playColor.addToB(d); break;
	}
	if(this.equals(playColor)) {
		playColor = this.clone();
		d = -d;
		switch(component) {
			case "R" : playColor.addToR(d); break;
			case "G" : playColor.addToG(d); break;
			case "B" : playColor.addToB(d); break;
		}

		if(this.equals(playColor)) return;
	}

	var contrast = playColor.contrastTo(webColor);
	var delta = this.target - contrast;
	if(delta >= initialDelta) d = -d;

	var h = playColor.toHex();
	do {
		switch(component) {
			case "R" : playColor.addToR(d); break;
			case "G" : playColor.addToG(d); break;
			case "B" : playColor.addToB(d); break;
		}
		var h1 = playColor.toHex();
		if(h == h1) {
			return;
		}
		h = h1;
		contrast = playColor.contrastTo(webColor);
		delta = this.target - contrast;
	} while (delta>0);
	this.fixes.push({hex:h, bgHex:webColor.toHex(), contrast:contrast, bruteForce: false});
}

WebColor.prototype.fixContrastBruteForce = function(webColor, restrictTime) {
    if(restrictTime) {
        var startTime = new Date();
    }
    var initialDelta = this.target - this.contrastTo(webColor);
    
    var playColorR = new WebColor(this);
    var dR = 1;
    playColorR.addToR(dR); 
    if(this.equals(playColorR)) {
        dR = -dR;
        playColorR.addToR(dR);
        if(this.equals(playColorR)) dR=0;
    }
    if(dR != 0 && this.target - playColorR.contrastTo(webColor) >= initialDelta) dR = -dR;

    var playColorG = new WebColor(this);
    var dG = 1;
    playColorG.addToG(dG); 
    if(this.equals(playColorG)) {
        dG = -dG;
        playColorG.addToG(dG);
        if(this.equals(playColorG)) dG=0;
    }
    if(dG != 0 && this.target - playColorG.contrastTo(webColor) >= initialDelta) dG = -dG;

    var playColorB = new WebColor(this);
    var dB = 1;
    playColorB.addToB(dB); 
    if(this.equals(playColorB)) {
        dB = -dB;
        playColorB.addToB(dB);
        if(this.equals(playColorB)) dB=0;
    }
    if(dB != 0 && this.target - playColorB.contrastTo(webColor) >= initialDelta) dB = -dB;
    //console.log(dR+' '+dG+' '+dB);

    hp = this.toHex();
    for(var r = this.r+dR; r>=0 && r<=255; r+=dR) {
        for(var g = this.g+dG; g>=0 && g<=255; g+=dG) {
            for(var b = this.b+dB; b>=0 && b<=255; b+=dB) {

                if(restrictTime) {
                    var endTime = new Date();
                    var timeDiff = (endTime - startTime);
                    if(timeDiff > restrictTime*1000) return;
                }
                var playColor = new WebColor({r:r,g:g,b:b});
                h = playColor.toHex();
                if(hp == h) {
                    break;
                } 
                hp = h;
                contrast = playColor.contrastTo(webColor);
                delta = this.target - contrast;
                if(delta <= 0) {
                    this.fixes.push({hex:h, bgHex:webColor.toHex(), contrast:contrast, bruteForce:true});
                    return;
                }
            }

        }
    }
}