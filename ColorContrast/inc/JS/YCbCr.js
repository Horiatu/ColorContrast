// https://en.wikipedia.org/wiki/YCbCr

// Copyright 2015 Horia Tudosie

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// This is a Derivative work of accessibility-developer-tools-master/src/js/color.js
// Copyright 2015 Google Inc.

function YCbCr(p) {
	if(p.hasOwnProperty('r') && p.hasOwnProperty('g') && p.hasOwnProperty('b')) {
	    var coords = YCbCr.getCoords(p);

	    this.luma = this.z = coords[0];
	    this.Cb = this.x = coords[1];
	    this.Cr = this.y = coords[2];
	}
    else if(typeof(p) == 'string') {
        var coords = YCbCr.getCoords(new WebColor(p));

        this.luma = this.z = coords[0];
        this.Cb = this.x = coords[1];
        this.Cr = this.y = coords[2];
    }
	else if(p.length == 3) {
		this.luma = this.z = p[0];
	    this.Cb = this.x = p[1];
	    this.Cr = this.y = p[2];
	} 
};

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

	    var line = { a: new YCbCr([0, this.Cb, this.Cr]), b: new YCbCr([1, this.Cb, this.Cr]) };

	    var intersection = null;
	    for (var i = 0; i < cubeFaces.length; i++) {
	        intersection = YCbCr.findIntersection(line, cubeFaces[i]);
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
            throw "Intersection has wrong Cb/Cr values.\n"+intersection.x+"\n"+this.x+"\n\n"+intersection.y+"\n"+this.y;
        }

	    // If intersection.luma is closer to endpoint than desired luma, then luma is inside cube
	    // and we can immediately return new value.
	    if (Math.abs(endpoint.luma - intersection.luma) < Math.abs(endpoint.luma - luma)) {
	        this.luma = this.z = luma;
	        return this;
	    }

	    // Otherwise, translate from intersection towards white/black such that luma is correct.
        var dluma = luma - intersection.luma;
	    var scale = 1 - dluma / (endpoint.luma - intersection.luma);
	    this.luma = this.z = luma;
	    this.Cb = this.x = intersection.Cb * scale;
	    this.Cr = this.y = intersection.Cr * scale;
	    return this;
	},

};

// Statics 

YCbCr.getCoords = function(p) {
    var rSRGB = p.r / 255;
    var gSRGB = p.g / 255;
    var bSRGB = p.b / 255;

    var r = rSRGB <= 0.03928 ? rSRGB / 12.92 : Math.pow(((rSRGB + 0.055)/1.055), 2.4);
    var g = gSRGB <= 0.03928 ? gSRGB / 12.92 : Math.pow(((gSRGB + 0.055)/1.055), 2.4);
    var b = bSRGB <= 0.03928 ? bSRGB / 12.92 : Math.pow(((bSRGB + 0.055)/1.055), 2.4);

    return YCbCr.multiplyMatrixVector(YCbCr.YCC_MATRIX, [r, g, b]);
};

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
    var m11 = matrix[0][0]; var m21 = matrix[1][0]; var m31 = matrix[2][0];
    var m12 = matrix[0][1]; var m22 = matrix[1][1]; var m32 = matrix[2][1];
    var m13 = matrix[0][2]; var m23 = matrix[1][2]; var m33 = matrix[2][2];
    
    var det = m11 * (m22*m33 - m23*m32) - m12 * (m33*m21 - m23*m31) + m13 * (m21*m32 - m22*m31);

    var I11 = (m22*m33 - m23*m32); var I21 = (m13*m32 - m12*m33); var I31 = (m12*m23 - m13*m22);
    var I12 = (m23*m31 - m21*m33); var I22 = (m11*m33 - m13*m31); var I32 = (m13*m21 - m11*m23);
    var I13 = (m21*m32 - m22*m31); var I23 = (m31*m12 - m11*m32); var I33 = (m11*m22 - m12*m21);
   
    return YCbCr.scalarMultiplyMatrix([
        [ I11, I21, I31 ],
        [ I12, I22, I32 ],
        [ I13, I23, I33 ]
    ], 1/det);
};

YCbCr.luminanceFromContrastRatio = function(luminance, contrast, higher) {
	contrast += 0.025;
    return higher
        ? ((luminance + 0.05) * contrast - 0.05)
		: ((luminance + 0.05) / contrast - 0.05);
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
		} catch(e) { console.log(e); }

		try {
		    var desiredBgLuminance = YCbCr.luminanceFromContrastRatio(fgLuminance, desiredContrast, !fgLuminanceIsHigher);
		    if (desiredBgLuminance <= 1 && desiredBgLuminance >= 0) {
		        bgYCbCr.translateColor(desiredBgLuminance);
		        results.push([fgColor, bgYCbCr.toWebColor(), desiredContrast]);
		    }
		} catch(e) { console.log(e); }
	});

    return results;
};



// YCbCr.kR = 0.2126;
// YCbCr.kB = 0.0722;

YCbCr.YCC_MATRIX = YCbCr.RGBToYCbCrMatrix(0.2126, 0.0722);
YCbCr.INVERTED_YCC_MATRIX = YCbCr.invert3x3Matrix(YCbCr.YCC_MATRIX);

YCbCr.black   = new YCbCr('black');  
YCbCr.white   = new YCbCr('white');  
YCbCr.red     = new YCbCr('red');    
YCbCr.green   = new YCbCr('lime');   
YCbCr.blue    = new YCbCr('blue');   
YCbCr.cyan    = new YCbCr('cyan');   
YCbCr.magenta = new YCbCr('magenta');
YCbCr.yellow  = new YCbCr('yellow'); 

YCbCr.CUBE_FACES_BLACK = [ { p0: YCbCr.black, p1: YCbCr.red, p2: YCbCr.green },
                           { p0: YCbCr.black, p1: YCbCr.green, p2: YCbCr.blue },
                           { p0: YCbCr.black, p1: YCbCr.blue, p2: YCbCr.red } ];
YCbCr.CUBE_FACES_WHITE = [ { p0: YCbCr.white, p1: YCbCr.cyan, p2: YCbCr.magenta },
                           { p0: YCbCr.white, p1: YCbCr.magenta, p2: YCbCr.yellow },
                           { p0: YCbCr.white, p1: YCbCr.yellow, p2: YCbCr.cyan } ];

