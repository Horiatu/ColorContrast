// https://en.wikipedia.org/wiki/YCbCr

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//

function YCbCr(p) {
// console.log(p);
// debugger;
//alert(typeof(p));
	if(p.hasOwnProperty('r') && p.hasOwnProperty('g') && p.hasOwnProperty('b')) {
	    var rSRGB = p.r / 255;
	    var gSRGB = p.g / 255;
	    var bSRGB = p.b / 255;

	    var r = rSRGB <= 0.03928 ? rSRGB / 12.92 : Math.pow(((rSRGB + 0.055)/1.055), 2.4);
	    var g = gSRGB <= 0.03928 ? gSRGB / 12.92 : Math.pow(((gSRGB + 0.055)/1.055), 2.4);
	    var b = bSRGB <= 0.03928 ? bSRGB / 12.92 : Math.pow(((bSRGB + 0.055)/1.055), 2.4);

	    var coords = YCbCr.multiplyMatrixVector(YCbCr.YCC_MATRIX, [r, g, b]);

	    this.luma = this.z = coords[0];
	    this.Cb = this.x = coords[1];
	    this.Cr = this.y = coords[2];
	}
	else if(p.length == 3) {
		this.luma = this.z = p[0];
	    this.Cb = this.x = p[1];
	    this.Cr = this.y = p[2];
	} 
}

YCbCr.prototype = {
	toWebColor: function() {
	    var rgb = YCbCr.multiplyMatrixVector(YCbCr.INVERTED_YCC_MATRIX, [this.luma, this.Cb, this.Cr]);

	    var r = rgb[0];
	    var g = rgb[1];
	    var b = rgb[2];

	    return new WebColor({ 
	    	r: r <= 0.00303949 ? (r * 12.92) : (Math.pow(r, (1/2.4)) * 1.055) - 0.055, 
	    	g: g <= 0.00303949 ? (g * 12.92) : (Math.pow(g, (1/2.4)) * 1.055) - 0.055, 
	    	b: b <= 0.00303949 ? (b * 12.92) : (Math.pow(b, (1/2.4)) * 1.055) - 0.055
	    });
	},

    multiply: function(scalar) {
        var result = [ this.luma * scalar, this.Cb * scalar, this.Cr * scalar ];
        return new YCbCr(result);
    },

    add: function(other) {
        var result = [ this.luma + other.luma, this.Cb + other.Cb, this.Cr + other.Cr ];
        return new YCbCr(result);
    },

    subtract: function(other) {
        var result = [ this.luma - other.luma, this.Cb - other.Cb, this.Cr - other.Cr ];
        return new YCbCr(result);
    },

	translateColor: function(luma) {
	    var endpoint = (luma > this.luma) ? YCbCr.white : YCbCr.black;
	    var cubeFaces = (endpoint == YCbCr.white) 
	    	? YCbCr.CUBE_FACES_WHITE
	        : YCbCr.CUBE_FACES_BLACK;

	    var a = new YCbCr([0, this.Cb, this.Cr]);
	    var b = new YCbCr([1, this.Cb, this.Cr]);
	    var line = { a: a, b: b };

	    var intersection = null;
	    for (var i = 0; i < cubeFaces.length; i++) {
	        var cubeFace = cubeFaces[i];
	        intersection = YCbCr.findIntersection(line, cubeFace);
	        // If intersection within [0, 1] in Z axis, it is within the cube.
	        if (intersection.z >= 0 && intersection.z <= 1)
	            break;
	    }
	    if (!intersection) {
	        // Should never happen
	        throw "Couldn't find intersection with YCbCr color cube for Cb=" + this.Cb + ", Cr=" + this.Cr + ".";
	    }
	    if (intersection.x != this.x || intersection.y != this.y) {
	        // Should never happen
	        throw "Intersection has wrong Cb/Cr values.";
	    }

	    // If intersection.luma is closer to endpoint than desired luma, then luma is inside cube
	    // and we can immediately return new value.
	    if (Math.abs(endpoint.luma - intersection.luma) < Math.abs(endpoint.luma - luma)) {
	        this.luma = luma;
	        return this;
	    }

	    // Otherwise, translate from intersection towards white/black such that luma is correct.
	    var dLuma = luma - intersection.luma;
	    var scale = dLuma / (endpoint.luma - intersection.luma);
	    this.luma = luma;
	    this.Cb = intersection.Cb - (intersection.Cb * scale);
	    this.Cr = intersection.Cr - (intersection.Cr * scale);
	    return this;
	},

};

// Statics 

YCbCr.RGBToYCbCrMatrix = function(kR, kB) {
    return [
        [kR, (1 - kR - kB), kB],
        [-kR/(2 - 2*kB), (kR + kB - 1)/(2 - 2*kB), (1 - kB)/(2 - 2*kB)],
        [(1 - kR)/(2 - 2*kR), (kR + kB - 1)/(2 - 2*kR), -kB/(2 - 2*kR)]
    ];
};

YCbCr.multiplyMatrixVector = function(matrix, vector) {
    var a = matrix[0][0];
    var b = matrix[0][1];
    var c = matrix[0][2];
    var d = matrix[1][0];
    var e = matrix[1][1];
    var f = matrix[1][2];
    var g = matrix[2][0];
    var h = matrix[2][1];
    var k = matrix[2][2];

    var x = vector[0];
    var y = vector[1];
    var z = vector[2];

    return [
        a*x + b*y + c*z,
        d*x + e*y + f*z,
        g*x + h*y + k*z
    ];
};

YCbCr.findIntersection = function(l, p) {
    var lhs = [ l.a.x - p.p0.x, l.a.y - p.p0.y, l.a.z - p.p0.z ];

    var matrix = [ [ l.a.x - l.b.x, p.p1.x - p.p0.x, p.p2.x - p.p0.x ],
                   [ l.a.y - l.b.y, p.p1.y - p.p0.y, p.p2.y - p.p0.y ],
                   [ l.a.z - l.b.z, p.p1.z - p.p0.z, p.p2.z - p.p0.z ] ];
    var invertedMatrix = YCbCr.invert3x3Matrix(matrix);

    var tuv = YCbCr.multiplyMatrixVector(invertedMatrix, lhs);
    var t = tuv[0];

    var result = l.a.add(l.b.subtract(l.a).multiply(t));
    return result;
};

YCbCr.scalarMultiplyVector = function(vector, scalar) {
    var result = [];
    for (var i = 0; i < vector.length; i++)
        result[i] = vector[i] * scalar;
    return result;
};

YCbCr.scalarMultiplyMatrix = function(matrix, scalar) {
    var result = [];

    for (var i = 0; i < 3; i++)
      result[i] = YCbCr.scalarMultiplyVector(matrix[i], scalar);

    return result;
};

YCbCr.invert3x3Matrix = function(matrix) {
    var a = matrix[0][0];
    var b = matrix[0][1];
    var c = matrix[0][2];
    var d = matrix[1][0];
    var e = matrix[1][1];
    var f = matrix[1][2];
    var g = matrix[2][0];
    var h = matrix[2][1];
    var k = matrix[2][2];

    var A = (e*k - f*h);
    var B = (f*g - d*k);
    var C = (d*h - e*g);
    var D = (c*h - b*k);
    var E = (a*k - c*g);
    var F = (g*b - a*h);
    var G = (b*f - c*e);
    var H = (c*d - a*f);
    var K = (a*e - b*d);

    var det = a * (e*k - f*h) - b * (k*d - f*g) + c * (d*h - e*g);
    var z = 1/det;

    return YCbCr.scalarMultiplyMatrix([
        [ A, D, G ],
        [ B, E, H ],
        [ C, F, K ]
    ], z);
};

YCbCr.luminanceFromContrastRatio = function(luminance, contrast, higher) {
	contrast += 0.025;
    return higher
        ? (luminance + 0.05) * contrast - 0.05
		: (luminance + 0.05) / contrast - 0.05;
};

YCbCr.suggestColors = function(bgColor, fgColor, desiredContrasts) {
	var bgYCbCr = new YCbCr(bgColor);
	var fgYCbCr = new YCbCr(fgColor);

    var bgLuminance = bgYCbCr.luma;
    var fgLuminance = fgYCbCr.luma;

    var fgLuminanceIsHigher = fgLuminance >= bgLuminance;

    var results = [];

    desiredContrasts.forEach(function(desiredContrast) {
    	try {
		    var desiredFgLuminance = YCbCr.luminanceFromContrastRatio(bgLuminance, desiredContrast, fgLuminanceIsHigher);
		    if (desiredFgLuminance <= 1 && desiredFgLuminance >= 0) {
		        fgYCbCr.translateColor(desiredFgLuminance);
		        results.push([fgYCbCr.toWebColor(), bgColor, desiredContrast]);
		    }
		} catch(e) {}

		try {
		    var desiredBgLuminance = YCbCr.luminanceFromContrastRatio(fgLuminance, desiredContrast, !fgLuminanceIsHigher);
		    if (desiredBgLuminance <= 1 && desiredBgLuminance >= 0) {
		        bgYCbCr.translateColor(desiredBgLuminance);
		        results.push([fgColor, bgYCbCr.toWebColor(), desiredContrast]);
		    }
		} catch(e) {}
	});

    return results;
};



// YCbCr.kR = 0.2126;
// YCbCr.kB = 0.0722;

YCbCr.YCC_MATRIX = YCbCr.RGBToYCbCrMatrix(0.2126, 0.0722);
YCbCr.INVERTED_YCC_MATRIX = YCbCr.invert3x3Matrix(YCbCr.YCC_MATRIX);

YCbCr.black = new YCbCr(new WebColor(WebColor.colorNameToHex('black')));
YCbCr.white = new YCbCr(new WebColor(WebColor.colorNameToHex('white')));
YCbCr.red = new YCbCr(new WebColor(WebColor.colorNameToHex('red')));
YCbCr.green = new YCbCr(new WebColor(WebColor.colorNameToHex('green')));
YCbCr.blue = new YCbCr(new WebColor(WebColor.colorNameToHex('blue')));
YCbCr.cyan = new YCbCr(new WebColor(WebColor.colorNameToHex('cyan')));
YCbCr.magenta = new YCbCr(new WebColor(WebColor.colorNameToHex('magenta')));
YCbCr.yellow = new YCbCr(new WebColor(WebColor.colorNameToHex('yellow')));

YCbCr.CUBE_FACES_BLACK = [ { p0: YCbCr.black, p1: YCbCr.red, p2: YCbCr.green },
                           { p0: YCbCr.black, p1: YCbCr.green, p2: YCbCr.blue },
                           { p0: YCbCr.black, p1: YCbCr.blue, p2: YCbCr.red } ];
YCbCr.CUBE_FACES_WHITE = [ { p0: YCbCr.white, p1: YCbCr.cyan, p2: YCbCr.magenta },
                           { p0: YCbCr.white, p1: YCbCr.magenta, p2: YCbCr.yellow },
                           { p0: YCbCr.white, p1: YCbCr.yellow, p2: YCbCr.cyan } ];

